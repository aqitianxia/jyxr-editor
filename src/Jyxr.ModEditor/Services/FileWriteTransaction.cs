using System.Text;

namespace JsonEditor.Services;

public sealed class FileWriteTransaction : IDisposable
{
    private readonly List<Entry> _entries = [];
    private bool _completed;

    public void StageText(string path, string content, Encoding? encoding = null)
    {
        ObjectDisposedException.ThrowIf(_completed, this);
        ArgumentException.ThrowIfNullOrWhiteSpace(path);
        ArgumentNullException.ThrowIfNull(content);
        if (_entries.Any(entry => string.Equals(entry.TargetPath, path, StringComparison.Ordinal)))
        {
            throw new InvalidOperationException($"File '{path}' is already staged.");
        }

        var directory = Path.GetDirectoryName(path)
            ?? throw new InvalidOperationException($"File '{path}' has no parent directory.");
        Directory.CreateDirectory(directory);
        var candidatePath = Path.Combine(directory, $".{Path.GetFileName(path)}.{Guid.NewGuid():N}.candidate");
        File.WriteAllText(candidatePath, content, encoding ?? new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));
        _entries.Add(new Entry(path, candidatePath, File.Exists(path)));
    }

    public bool TryCommit(Func<bool> validate)
    {
        ObjectDisposedException.ThrowIf(_completed, this);
        ArgumentNullException.ThrowIfNull(validate);
        PrepareRollbackFiles();
        try
        {
            foreach (var entry in _entries)
            {
                File.Move(entry.CandidatePath, entry.TargetPath, overwrite: true);
                entry.Applied = true;
            }

            if (!validate())
            {
                Rollback();
                _completed = true;
                return false;
            }

            CleanupRollbackFiles();
            _completed = true;
            return true;
        }
        catch
        {
            Rollback();
            _completed = true;
            throw;
        }
    }

    public void Dispose()
    {
        if (!_completed)
        {
            Rollback();
            _completed = true;
        }
        GC.SuppressFinalize(this);
    }

    private void PrepareRollbackFiles()
    {
        foreach (var entry in _entries.Where(static entry => entry.Existed))
        {
            var directory = Path.GetDirectoryName(entry.TargetPath)!;
            entry.RollbackPath = Path.Combine(directory, $".{Path.GetFileName(entry.TargetPath)}.{Guid.NewGuid():N}.rollback");
            File.Copy(entry.TargetPath, entry.RollbackPath, overwrite: false);
        }
    }

    private void Rollback()
    {
        foreach (var entry in _entries.AsEnumerable().Reverse())
        {
            if (entry.Existed && entry.RollbackPath is not null && File.Exists(entry.RollbackPath))
            {
                File.Move(entry.RollbackPath, entry.TargetPath, overwrite: true);
            }
            else if (!entry.Existed && entry.Applied && File.Exists(entry.TargetPath))
            {
                File.Delete(entry.TargetPath);
            }

            DeleteIfExists(entry.CandidatePath);
            if (entry.RollbackPath is not null) DeleteIfExists(entry.RollbackPath);
        }
    }

    private void CleanupRollbackFiles()
    {
        foreach (var entry in _entries)
        {
            DeleteIfExists(entry.CandidatePath);
            if (entry.RollbackPath is not null) DeleteIfExists(entry.RollbackPath);
        }
    }

    private static void DeleteIfExists(string path)
    {
        if (File.Exists(path)) File.Delete(path);
    }

    private sealed class Entry(string targetPath, string candidatePath, bool existed)
    {
        public string TargetPath { get; } = targetPath;
        public string CandidatePath { get; } = candidatePath;
        public bool Existed { get; } = existed;
        public string? RollbackPath { get; set; }
        public bool Applied { get; set; }
    }
}
