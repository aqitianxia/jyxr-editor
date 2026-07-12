using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;

namespace JsonEditor.Services;

public sealed record ContentDocumentSnapshot(
    string Path,
    string Content,
    long Size,
    DateTime LastWriteTimeUtc);

public sealed record ContentSnapshotResponse(
    string Version,
    IReadOnlyList<ContentDocumentSnapshot> Documents);

public sealed class ContentDocumentSnapshotService
{
    private readonly ConcurrentDictionary<string, CachedDocument> cache = new(StringComparer.OrdinalIgnoreCase);

    public ContentSnapshotResponse Load(string dataPath)
    {
        if (!Directory.Exists(dataPath))
        {
            throw new DirectoryNotFoundException($"Data directory was not found: {dataPath}");
        }

        var rootPath = Path.GetFullPath(dataPath);
        var documents = Directory.EnumerateFiles(rootPath, "*.json", SearchOption.AllDirectories)
            .OrderBy(static path => path, StringComparer.OrdinalIgnoreCase)
            .Select(path => LoadDocument(rootPath, path))
            .ToArray();

        var activePaths = documents.Select(static document => document.FullPath).ToHashSet(StringComparer.OrdinalIgnoreCase);
        foreach (var cachedPath in cache.Keys)
        {
            if (IsInsideRoot(rootPath, cachedPath) && !activePaths.Contains(cachedPath))
            {
                cache.TryRemove(cachedPath, out _);
            }
        }

        var responseDocuments = documents
            .Select(static document => new ContentDocumentSnapshot(
                document.RelativePath,
                document.Content,
                document.Size,
                document.LastWriteTimeUtc))
            .ToArray();
        var versionSource = string.Join('\n', documents.Select(static document =>
            $"{document.RelativePath}\0{document.Size}\0{document.LastWriteTimeUtc.Ticks}"));
        var version = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(versionSource)));
        return new ContentSnapshotResponse(version, responseDocuments);
    }

    private CachedDocument LoadDocument(string rootPath, string path)
    {
        var fullPath = Path.GetFullPath(path);
        if (!IsInsideRoot(rootPath, fullPath))
        {
            throw new InvalidOperationException($"Content path escapes data root: {path}");
        }

        var info = new FileInfo(fullPath);
        if (cache.TryGetValue(fullPath, out var cached)
            && cached.Size == info.Length
            && cached.LastWriteTimeUtc == info.LastWriteTimeUtc)
        {
            return cached;
        }

        var document = new CachedDocument(
            fullPath,
            Path.GetRelativePath(rootPath, fullPath).Replace('\\', '/'),
            File.ReadAllText(fullPath, Encoding.UTF8),
            info.Length,
            info.LastWriteTimeUtc);
        cache[fullPath] = document;
        return document;
    }

    private static bool IsInsideRoot(string rootPath, string path)
    {
        var normalizedRoot = Path.GetFullPath(rootPath);
        var normalizedPath = Path.GetFullPath(path);
        var rootPrefix = normalizedRoot.EndsWith(Path.DirectorySeparatorChar)
            ? normalizedRoot
            : normalizedRoot + Path.DirectorySeparatorChar;
        return normalizedPath.StartsWith(rootPrefix, StringComparison.OrdinalIgnoreCase);
    }

    private sealed record CachedDocument(
        string FullPath,
        string RelativePath,
        string Content,
        long Size,
        DateTime LastWriteTimeUtc);
}
