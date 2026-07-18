using System.Globalization;
using System.Text.RegularExpressions;

namespace JsonEditor.Services;

public sealed record SkillAnimationSummary(
    string Id,
    string Path,
    bool Previewable,
    int FrameCount,
    double Duration,
    string Status,
    string Message);

public sealed record SkillAnimationFrame(
    double Time,
    string AtlasPath,
    double RegionX,
    double RegionY,
    double RegionWidth,
    double RegionHeight,
    double OffsetX,
    double OffsetY,
    double ScaleX,
    double ScaleY);

public sealed record SkillAnimationManifest(
    string Id,
    string Path,
    bool Previewable,
    double Duration,
    IReadOnlyList<SkillAnimationFrame> Frames,
    IReadOnlyList<string> Diagnostics);

public static partial class GodotSkillAnimationCatalog
{
    private const string SkillAnimationRelativeDirectory = "animation/skill";
    private const string ResourcePrefix = "res://assets/";

    public static IReadOnlyList<SkillAnimationSummary> List(string assetsPath)
    {
        var directory = Path.Combine(assetsPath, "animation", "skill");
        if (!Directory.Exists(directory))
        {
            return [];
        }

        var atlasCache = new Dictionary<string, (string AtlasPath, double X, double Y, double Width, double Height)>(
            StringComparer.Ordinal);
        return Directory.EnumerateFiles(directory, "*.*", SearchOption.TopDirectoryOnly)
            .Where(static path => string.Equals(Path.GetExtension(path), ".tres", StringComparison.OrdinalIgnoreCase) ||
                                  string.Equals(Path.GetExtension(path), ".res", StringComparison.OrdinalIgnoreCase))
            .OrderBy(static path => Path.GetFileNameWithoutExtension(path), StringComparer.OrdinalIgnoreCase)
            .Select(path => CreateSummary(path, assetsPath, atlasCache))
            .ToArray();
    }

    public static SkillAnimationManifest Load(string animationId, string assetsPath)
    {
        var normalizedId = NormalizeAnimationId(animationId);
        var relativePath = $"{SkillAnimationRelativeDirectory}/{normalizedId}.tres";
        var animationPath = ResolveAssetChild(assetsPath, relativePath);
        if (!File.Exists(animationPath))
        {
            var binaryPath = ResolveAssetChild(assetsPath, $"{SkillAnimationRelativeDirectory}/{normalizedId}.res");
            if (File.Exists(binaryPath))
            {
                return new SkillAnimationManifest(normalizedId, ToAssetRelativePath(assetsPath, binaryPath), false, 0, [],
                    ["二进制 .res 动画必须在 Godot 中预览。"]);
            }

            throw new FileNotFoundException($"Skill animation was not found: {normalizedId}");
        }

        return ParseTextAnimation(normalizedId, animationPath, assetsPath, null);
    }

    private static SkillAnimationSummary CreateSummary(
        string path,
        string assetsPath,
        Dictionary<string, (string AtlasPath, double X, double Y, double Width, double Height)> atlasCache)
    {
        var id = Path.GetFileNameWithoutExtension(path);
        var relativePath = ToAssetRelativePath(assetsPath, path);
        if (string.Equals(Path.GetExtension(path), ".res", StringComparison.OrdinalIgnoreCase))
        {
            return new SkillAnimationSummary(id, relativePath, false, 0, 0, "unsupported", "二进制 .res 只能在 Godot 中预览");
        }

        try
        {
            var text = File.ReadAllText(path);
            var frameCount = ParseTextureResourceIds(GetTrackBlock(text, 0)).Count;
            var manifest = ParseTextAnimation(id, path, assetsPath, atlasCache);
            return manifest.Previewable
                ? new SkillAnimationSummary(id, relativePath, true, frameCount, manifest.Duration, "ok", $"{frameCount} 帧")
                : new SkillAnimationSummary(
                    id,
                    relativePath,
                    false,
                    frameCount,
                    manifest.Duration,
                    "invalid",
                    manifest.Diagnostics.FirstOrDefault() ?? "动画无法预览");
        }
        catch (Exception exception)
        {
            return new SkillAnimationSummary(id, relativePath, false, 0, 0, "invalid", exception.Message);
        }
    }

    private static SkillAnimationManifest ParseTextAnimation(
        string id,
        string animationPath,
        string assetsPath,
        Dictionary<string, (string AtlasPath, double X, double Y, double Width, double Height)>? atlasCache)
    {
        var diagnostics = new List<string>();
        var text = File.ReadAllText(animationPath);
        if (!DefaultAnimationRegex().IsMatch(text))
        {
            diagnostics.Add("动画库缺少 default 动画。");
        }

        var textureResources = ParseTextureResources(text);
        var textureTrack = GetTrackBlock(text, 0);
        var offsetTrack = GetTrackBlock(text, 1);
        var scaleTrack = GetTrackBlock(text, 2);
        var times = ParseNumbers(ParsePackedArray(textureTrack));
        var textureIds = ParseTextureResourceIds(textureTrack);
        var offsets = ParseVectors(offsetTrack);
        var scales = ParseVectors(scaleTrack);
        var frameCount = textureIds.Count;
        if (frameCount == 0)
        {
            diagnostics.Add("default 动画没有纹理帧。");
        }

        if (times.Count != frameCount)
        {
            diagnostics.Add($"帧时间数量 {times.Count} 与纹理帧数量 {frameCount} 不一致。");
        }

        var frames = new List<SkillAnimationFrame>(frameCount);
        for (var index = 0; index < frameCount; index++)
        {
            if (!textureResources.TryGetValue(textureIds[index], out var atlasTextureResourcePath))
            {
                diagnostics.Add($"纹理资源 {textureIds[index]} 未声明。");
                continue;
            }

            try
            {
                var atlas = ParseAtlasTexture(atlasTextureResourcePath, assetsPath, atlasCache);
                var offset = ResolveVector(offsets, index, (0d, 0d));
                var scale = ResolveVector(scales, index, (1d, 1d));
                frames.Add(new SkillAnimationFrame(
                    index < times.Count ? times[index] : index * 0.1d,
                    atlas.AtlasPath,
                    atlas.X,
                    atlas.Y,
                    atlas.Width,
                    atlas.Height,
                    offset.X,
                    offset.Y,
                    scale.X,
                    scale.Y));
            }
            catch (Exception exception)
            {
                diagnostics.Add($"帧 {index + 1}：{exception.Message}");
            }
        }

        var duration = ParseDuration(text, times);
        var previewable = diagnostics.Count == 0 && frames.Count == frameCount && frameCount > 0;
        return new SkillAnimationManifest(
            id,
            ToAssetRelativePath(assetsPath, animationPath),
            previewable,
            duration,
            frames,
            diagnostics);
    }

    private static Dictionary<string, string> ParseTextureResources(string text)
    {
        var resources = new Dictionary<string, string>(StringComparer.Ordinal);
        foreach (Match headerMatch in ExtResourceHeaderRegex().Matches(text))
        {
            var attributes = ParseResourceHeaderAttributes(headerMatch.Groups["attributes"].Value);
            if (!attributes.TryGetValue("type", out var type) ||
                !string.Equals(type, "Texture2D", StringComparison.Ordinal) ||
                !attributes.TryGetValue("path", out var path) ||
                !attributes.TryGetValue("id", out var id))
            {
                continue;
            }

            resources[id] = path;
        }

        return resources;
    }

    private static Dictionary<string, string> ParseResourceHeaderAttributes(string value)
    {
        var attributes = new Dictionary<string, string>(StringComparer.Ordinal);
        foreach (Match match in ResourceHeaderAttributeRegex().Matches(value))
        {
            attributes[match.Groups["name"].Value] = match.Groups["value"].Value;
        }

        return attributes;
    }

    private static (string AtlasPath, double X, double Y, double Width, double Height) ParseAtlasTexture(
        string resourcePath,
        string assetsPath,
        Dictionary<string, (string AtlasPath, double X, double Y, double Width, double Height)>? atlasCache)
    {
        if (atlasCache?.TryGetValue(resourcePath, out var cached) == true)
        {
            return cached;
        }

        var atlasTexturePath = ResolveGodotAssetPath(resourcePath, assetsPath);
        if (!File.Exists(atlasTexturePath))
        {
            throw new FileNotFoundException($"AtlasTexture 不存在：{resourcePath}");
        }

        var text = File.ReadAllText(atlasTexturePath);
        var atlasResourceMatch = AtlasResourceRegex().Match(text);
        var textureResources = ParseTextureResources(text);
        if (!atlasResourceMatch.Success ||
            !textureResources.TryGetValue(atlasResourceMatch.Groups["id"].Value, out var atlasResourcePath))
        {
            throw new InvalidDataException($"AtlasTexture 缺少图集引用：{resourcePath}");
        }

        var regionMatch = RegionRegex().Match(text);
        if (!regionMatch.Success)
        {
            throw new InvalidDataException($"AtlasTexture 缺少 region：{resourcePath}");
        }

        var atlasPath = ResolveGodotAssetPath(atlasResourcePath, assetsPath);
        if (!File.Exists(atlasPath))
        {
            throw new FileNotFoundException($"图集图片不存在：{atlasResourcePath}");
        }

        var result = (
            ToAssetRelativePath(assetsPath, atlasPath),
            ParseDouble(regionMatch.Groups["x"].Value),
            ParseDouble(regionMatch.Groups["y"].Value),
            ParseDouble(regionMatch.Groups["width"].Value),
            ParseDouble(regionMatch.Groups["height"].Value));
        if (atlasCache is not null)
        {
            atlasCache[resourcePath] = result;
        }

        return result;
    }

    private static string GetTrackBlock(string text, int trackIndex)
    {
        var marker = $"tracks/{trackIndex}/type";
        var start = text.IndexOf(marker, StringComparison.Ordinal);
        if (start < 0)
        {
            return string.Empty;
        }

        var nextTrack = text.IndexOf($"tracks/{trackIndex + 1}/type", start, StringComparison.Ordinal);
        var resource = text.IndexOf("\n[resource]", start, StringComparison.Ordinal);
        var endCandidates = new[] { nextTrack, resource }.Where(static value => value >= 0).ToArray();
        var end = endCandidates.Length == 0 ? text.Length : endCandidates.Min();
        return text[start..end];
    }

    private static string ParsePackedArray(string trackBlock)
    {
        var match = PackedFloatArrayRegex().Match(trackBlock);
        return match.Success ? match.Groups["values"].Value : string.Empty;
    }

    private static IReadOnlyList<string> ParseTextureResourceIds(string trackBlock) =>
        ExtResourceValueRegex().Matches(trackBlock)
            .Select(static match => match.Groups["id"].Value)
            .ToArray();

    private static IReadOnlyList<(double X, double Y)> ParseVectors(string trackBlock) =>
        VectorRegex().Matches(trackBlock)
            .Select(static match => (
                ParseDouble(match.Groups["x"].Value),
                ParseDouble(match.Groups["y"].Value)))
            .ToArray();

    private static IReadOnlyList<double> ParseNumbers(string value) => value
        .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        .Select(ParseDouble)
        .ToArray();

    private static (double X, double Y) ResolveVector(
        IReadOnlyList<(double X, double Y)> values,
        int index,
        (double X, double Y) fallback)
    {
        if (values.Count == 0)
        {
            return fallback;
        }

        return values[Math.Min(index, values.Count - 1)];
    }

    private static double ParseDuration(string text, IReadOnlyList<double> times)
    {
        var match = AnimationLengthRegex().Match(text);
        if (match.Success)
        {
            return ParseDouble(match.Groups["value"].Value);
        }

        if (times.Count == 0)
        {
            return 0;
        }

        var frameDuration = times.Count > 1 ? Math.Max(0.01d, times[^1] - times[^2]) : 0.1d;
        return times[^1] + frameDuration;
    }

    private static string NormalizeAnimationId(string animationId)
    {
        var normalized = animationId?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(normalized) ||
            normalized.Contains('/') ||
            normalized.Contains('\\') ||
            normalized is "." or ".." ||
            Path.IsPathRooted(normalized))
        {
            throw new InvalidOperationException($"Invalid skill animation id: {animationId}");
        }

        return normalized;
    }

    private static string ResolveGodotAssetPath(string resourcePath, string assetsPath)
    {
        if (!resourcePath.StartsWith(ResourcePrefix, StringComparison.Ordinal))
        {
            throw new InvalidDataException($"动画依赖不在 res://assets 下：{resourcePath}");
        }

        return ResolveAssetChild(assetsPath, resourcePath[ResourcePrefix.Length..]);
    }

    private static string ResolveAssetChild(string assetsPath, string relativePath)
    {
        var root = Path.GetFullPath(assetsPath);
        var candidate = Path.GetFullPath(Path.Combine(root, relativePath.Replace('/', Path.DirectorySeparatorChar)));
        var prefix = root.EndsWith(Path.DirectorySeparatorChar) ? root : root + Path.DirectorySeparatorChar;
        if (!candidate.StartsWith(prefix, StringComparison.Ordinal) && !string.Equals(candidate, root, StringComparison.Ordinal))
        {
            throw new InvalidOperationException($"Asset path escapes assets root: {relativePath}");
        }

        return candidate;
    }

    private static string ToAssetRelativePath(string assetsPath, string path) =>
        Path.GetRelativePath(assetsPath, path).Replace('\\', '/');

    private static double ParseDouble(string value) =>
        double.Parse(value, NumberStyles.Float, CultureInfo.InvariantCulture);

    [GeneratedRegex("&\\\"default\\\"\\s*:", RegexOptions.CultureInvariant)]
    private static partial Regex DefaultAnimationRegex();

    [GeneratedRegex("^\\[ext_resource\\s+(?<attributes>[^\\]]+)\\]\\s*$", RegexOptions.CultureInvariant | RegexOptions.Multiline)]
    private static partial Regex ExtResourceHeaderRegex();

    [GeneratedRegex("(?<name>[A-Za-z_][A-Za-z0-9_]*)=\\\"(?<value>[^\\\"]*)\\\"", RegexOptions.CultureInvariant)]
    private static partial Regex ResourceHeaderAttributeRegex();

    [GeneratedRegex("^atlas\\s*=\\s*ExtResource\\(\\\"(?<id>[^\\\"]+)\\\"\\)", RegexOptions.CultureInvariant | RegexOptions.Multiline)]
    private static partial Regex AtlasResourceRegex();

    [GeneratedRegex("PackedFloat32Array\\((?<values>[^)]*)\\)", RegexOptions.CultureInvariant)]
    private static partial Regex PackedFloatArrayRegex();

    [GeneratedRegex("ExtResource\\(\\\"(?<id>[^\\\"]+)\\\"\\)", RegexOptions.CultureInvariant)]
    private static partial Regex ExtResourceValueRegex();

    [GeneratedRegex("Vector2\\(\\s*(?<x>-?[0-9.]+(?:[eE][+-]?[0-9]+)?)\\s*,\\s*(?<y>-?[0-9.]+(?:[eE][+-]?[0-9]+)?)\\s*\\)", RegexOptions.CultureInvariant)]
    private static partial Regex VectorRegex();

    [GeneratedRegex("region\\s*=\\s*Rect2\\(\\s*(?<x>-?[0-9.]+)\\s*,\\s*(?<y>-?[0-9.]+)\\s*,\\s*(?<width>[0-9.]+)\\s*,\\s*(?<height>[0-9.]+)\\s*\\)", RegexOptions.CultureInvariant)]
    private static partial Regex RegionRegex();

    [GeneratedRegex("^length\\s*=\\s*(?<value>[0-9.]+)", RegexOptions.CultureInvariant | RegexOptions.Multiline)]
    private static partial Regex AnimationLengthRegex();
}
