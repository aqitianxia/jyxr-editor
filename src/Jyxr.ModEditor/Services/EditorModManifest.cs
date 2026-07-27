using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace JsonEditor.Services;

public sealed record EditorModManifest(
    string Id,
    string Name,
    string Version,
    string? Date = null,
    string? Description = null,
    string? Author = null,
    IReadOnlyList<string>? Packs = null,
    IReadOnlyList<string>? Assemblies = null,
    string? MinClientVersion = null)
{
    private static readonly HashSet<string> AllowedFields =
    [
        "id", "name", "version", "date", "description", "author", "packs", "assemblies", "minClientVersion",
    ];

    public static EditorModManifest Load(string manifestPath, string modDirectoryPath)
    {
        var json = File.ReadAllText(manifestPath);
        var root = EditorJson.ParseNode(json) as JsonObject
            ?? throw new InvalidOperationException($"Mod manifest root must be a JSON object: {manifestPath}");
        foreach (var property in root)
        {
            if (!AllowedFields.Contains(property.Key))
            {
                throw new InvalidOperationException(
                    $"Unsupported mod manifest field '{property.Key}' in '{manifestPath}'.");
            }
        }

        var manifest = JsonSerializer.Deserialize<EditorModManifest>(json, EditorJson.SerializerOptions)
            ?? throw new InvalidOperationException($"Unable to deserialize mod manifest: {manifestPath}");
        manifest.Validate(modDirectoryPath);
        return manifest;
    }

    private void Validate(string modDirectoryPath)
    {
        EnsureStableId(Id, nameof(Id));
        EnsureRequired(Name, nameof(Name));
        EnsureRequired(Version, nameof(Version));
        EnsureDate(Date, nameof(Date));

        foreach (var pack in NormalizeRelativePaths(Packs))
        {
            var packPath = Path.Combine(modDirectoryPath, pack.Replace('/', Path.DirectorySeparatorChar));
            if (!File.Exists(packPath))
            {
                throw new FileNotFoundException($"Mod PCK file was not found: {packPath}", packPath);
            }

            if (!string.Equals(Path.GetExtension(packPath), ".pck", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException($"Mod pack must be a .pck file: {packPath}");
            }
        }

        _ = NormalizeRelativePaths(Assemblies);
    }

    private static IReadOnlyList<string> NormalizeRelativePaths(IReadOnlyList<string>? paths) =>
        paths is null
            ? []
            : paths.Select(NormalizeRelativePath).Where(static path => path.Length > 0).ToArray();

    private static string NormalizeRelativePath(string? path)
    {
        var normalized = string.IsNullOrWhiteSpace(path)
            ? string.Empty
            : path.Trim().Replace('\\', '/').Trim('/');
        if (normalized.Length == 0) return string.Empty;
        if (Path.IsPathRooted(normalized) ||
            normalized.StartsWith("res://", StringComparison.Ordinal) ||
            normalized.StartsWith("user://", StringComparison.Ordinal) ||
            normalized.Split('/').Any(static part => part == ".."))
        {
            throw new InvalidOperationException(
                $"Mod manifest path must be relative and stay inside the mod directory: {path}");
        }

        return normalized;
    }

    private static void EnsureRequired(string? value, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"Mod manifest field '{fieldName}' is required.");
        }
    }

    private static void EnsureStableId(string? value, string fieldName)
    {
        EnsureRequired(value, fieldName);
        if (value!.Any(static character =>
                !(char.IsAsciiLetterOrDigit(character) || character is '-' or '_' or '.')))
        {
            throw new InvalidOperationException(
                $"Mod manifest field '{fieldName}' must contain only ASCII letters, digits, '-', '_' or '.'.");
        }
    }

    private static void EnsureDate(string? value, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value)) return;
        if (!DateOnly.TryParseExact(
                value.Trim(),
                "yyyy-MM-dd",
                CultureInfo.InvariantCulture,
                DateTimeStyles.None,
                out _))
        {
            throw new InvalidOperationException(
                $"Mod manifest field '{fieldName}' must use yyyy-MM-dd format.");
        }
    }
}
