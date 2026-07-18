using System.Text.Json;

namespace JsonEditor.Services;

public sealed record ContentFileContract(string Path, string DefinitionType);

public sealed record PolymorphicTypeContract(string Discriminator, IReadOnlyList<string> Values);

public sealed record DefinitionContract(IReadOnlyList<DefinitionFieldContract> Fields);

public sealed record DefinitionFieldContract(string Name, string Kind, bool Required);

public sealed record ResourceContract(
    string GodotAssetPrefix,
    string SkillAnimationDirectory,
    IReadOnlyList<string> SkillAnimationExtensions,
    string AtlasTextureDirectory);

public sealed record EditorContentContract(
    string Format,
    int ContractVersion,
    IReadOnlyList<ContentFileContract> RequiredContentFiles,
    IReadOnlyDictionary<string, DefinitionContract> Definitions,
    IReadOnlyDictionary<string, PolymorphicTypeContract> PolymorphicTypes,
    IReadOnlyDictionary<string, string[]> Enums,
    ResourceContract Resources);

public sealed record ContentContractIssue(
    string Code,
    string Severity,
    string Category,
    string Message,
    string? Path = null,
    int? Line = null,
    string? DefinitionId = null);

public sealed record ContentContractValidation(
    int JsonFileCount,
    int ContractVersion,
    IReadOnlyList<ContentContractIssue> Issues)
{
    public int ErrorCount => Issues.Count(static issue => issue.Severity == "error");
    public int WarningCount => Issues.Count(static issue => issue.Severity == "warning");
}

public sealed class ContentContractCatalog
{
    private readonly EditorContentContract _contract;
    private readonly Dictionary<string, HashSet<string>> _allowedValues;
    private readonly Dictionary<string, ContentFileContract> _contentFiles;

    private ContentContractCatalog(EditorContentContract contract)
    {
        _contract = contract;
        _allowedValues = contract.PolymorphicTypes.ToDictionary(
            static entry => entry.Key,
            static entry => entry.Value.Values.ToHashSet(StringComparer.Ordinal),
            StringComparer.Ordinal);
        _contentFiles = contract.RequiredContentFiles.ToDictionary(static entry => entry.Path, StringComparer.OrdinalIgnoreCase);
    }

    public EditorContentContract Contract => _contract;

    public static ContentContractCatalog Load(string path)
    {
        if (!File.Exists(path))
        {
            throw new FileNotFoundException($"Editor content contract was not found: {path}", path);
        }

        var contract = JsonSerializer.Deserialize<EditorContentContract>(
            File.ReadAllText(path),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
            ?? throw new InvalidDataException($"Editor content contract is empty: {path}");
        if (!string.Equals(contract.Format, "jyxr-content", StringComparison.Ordinal) || contract.ContractVersion <= 0)
        {
            throw new InvalidDataException($"Unsupported editor content contract: {contract.Format} v{contract.ContractVersion}");
        }

        return new ContentContractCatalog(contract);
    }

    public ContentContractValidation Validate(string dataPath)
    {
        var issues = new List<ContentContractIssue>();
        var requiredFiles = _contract.RequiredContentFiles
            .ToDictionary(static entry => entry.Path, StringComparer.OrdinalIgnoreCase);
        foreach (var requiredFile in _contract.RequiredContentFiles)
        {
            if (!File.Exists(Path.Combine(dataPath, requiredFile.Path)))
            {
                issues.Add(new ContentContractIssue(
                    "contract.required-file",
                    "error",
                    "contract",
                    $"游戏必需的数据文件不存在：{requiredFile.Path}",
                    requiredFile.Path));
            }
        }

        var jsonFiles = Directory.Exists(dataPath)
            ? Directory.EnumerateFiles(dataPath, "*.json", SearchOption.AllDirectories)
                .OrderBy(static path => path, StringComparer.OrdinalIgnoreCase)
                .ToArray()
            : [];
        foreach (var jsonFile in jsonFiles)
        {
            var relativePath = Path.GetRelativePath(dataPath, jsonFile).Replace('\\', '/');
            try
            {
                using var document = JsonDocument.Parse(File.ReadAllText(jsonFile));
                if (requiredFiles.ContainsKey(relativePath) &&
                    document.RootElement.ValueKind is not JsonValueKind.Array and not JsonValueKind.Object)
                {
                    issues.Add(new ContentContractIssue(
                        "contract.root-shape",
                        "error",
                        "contract",
                        "游戏内容文件顶层必须是对象或数组。",
                        relativePath,
                        1));
                    continue;
                }

                ValidateDocument(relativePath, document.RootElement, issues);
            }
            catch (JsonException exception)
            {
                issues.Add(new ContentContractIssue(
                    "syntax.json",
                    "error",
                    "syntax",
                    $"JSON 语法错误：{exception.Message}",
                    relativePath,
                    exception.LineNumber is null ? 1 : checked((int)exception.LineNumber.Value + 1)));
            }
        }

        return new ContentContractValidation(jsonFiles.Length, _contract.ContractVersion, issues);
    }

    private void ValidateDocument(string relativePath, JsonElement root, List<ContentContractIssue> issues)
    {
        if (_contentFiles.TryGetValue(relativePath, out var contentFile) &&
            _contract.Definitions.TryGetValue(contentFile.DefinitionType, out var definition))
        {
            ForEachDefinition(root, (value, index) =>
                ValidateDefinition(value, definition, $"{relativePath}[{index}]", issues));
        }

        WalkAffixes(root, relativePath, issues);
        if (string.Equals(relativePath, "items.json", StringComparison.OrdinalIgnoreCase))
        {
            ForEachDefinition(root, (item, index) =>
            {
                var path = $"{relativePath}[{index}]";
                ValidateDiscriminator(item, "item", path, issues);
                ValidatePropertyArray(item, "requirements", "itemRequirement", path, issues);
                ValidatePropertyArray(item, "useEffects", "itemUseEffect", path, issues);
            });
        }
        else if (string.Equals(relativePath, "special-skills.json", StringComparison.OrdinalIgnoreCase))
        {
            ForEachDefinition(root, (skill, index) =>
                ValidatePropertyArray(skill, "effects", "battleEffect", $"{relativePath}[{index}]", issues));
        }
    }

    private static void ValidateDefinition(
        JsonElement value,
        DefinitionContract definition,
        string path,
        List<ContentContractIssue> issues)
    {
        if (value.ValueKind != JsonValueKind.Object)
        {
            issues.Add(new ContentContractIssue(
                "contract.definition-shape",
                "error",
                "contract",
                "游戏内容定义必须是 JSON 对象。",
                path));
            return;
        }

        var definitionId = TryGetPropertyIgnoreCase(value, "id", out var idElement) &&
            idElement.ValueKind == JsonValueKind.String
            ? idElement.GetString()
            : null;
        foreach (var field in definition.Fields)
        {
            if (!TryGetPropertyIgnoreCase(value, field.Name, out var fieldValue) || fieldValue.ValueKind == JsonValueKind.Null)
            {
                if (field.Required)
                {
                    issues.Add(new ContentContractIssue(
                        "contract.required-field",
                        "error",
                        "contract",
                        $"缺少游戏必填字段“{field.Name}”。",
                        path,
                        null,
                        definitionId));
                }

                continue;
            }

            if (!MatchesKind(fieldValue.ValueKind, field.Kind))
            {
                issues.Add(new ContentContractIssue(
                    "contract.field-kind",
                    "error",
                    "contract",
                    $"字段“{field.Name}”应为 {KindLabel(field.Kind)}。",
                    path,
                    null,
                    definitionId));
            }
        }
    }

    private static bool TryGetPropertyIgnoreCase(JsonElement value, string propertyName, out JsonElement propertyValue)
    {
        foreach (var property in value.EnumerateObject())
        {
            if (string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
            {
                propertyValue = property.Value;
                return true;
            }
        }

        propertyValue = default;
        return false;
    }

    private static bool MatchesKind(JsonValueKind valueKind, string kind) => kind switch
    {
        "array" => valueKind == JsonValueKind.Array,
        "boolean" => valueKind is JsonValueKind.True or JsonValueKind.False,
        "enum" => valueKind is JsonValueKind.String or JsonValueKind.Number,
        "number" => valueKind == JsonValueKind.Number,
        "object" => valueKind == JsonValueKind.Object,
        "string" => valueKind == JsonValueKind.String,
        _ => true,
    };

    private static string KindLabel(string kind) => kind switch
    {
        "array" => "数组",
        "boolean" => "布尔值",
        "enum" => "枚举名称或数字",
        "number" => "数字",
        "object" => "对象",
        "string" => "文本",
        _ => kind,
    };

    private void WalkAffixes(JsonElement element, string path, List<ContentContractIssue> issues)
    {
        if (element.ValueKind == JsonValueKind.Array)
        {
            var index = 0;
            foreach (var item in element.EnumerateArray())
            {
                WalkAffixes(item, $"{path}[{index}]", issues);
                index++;
            }

            return;
        }

        if (element.ValueKind != JsonValueKind.Object)
        {
            return;
        }

        foreach (var property in element.EnumerateObject())
        {
            var propertyPath = $"{path}.{property.Name}";
            if (string.Equals(property.Name, "affixes", StringComparison.OrdinalIgnoreCase) &&
                property.Value.ValueKind == JsonValueKind.Array)
            {
                var index = 0;
                foreach (var affixEntry in property.Value.EnumerateArray())
                {
                    var affixPath = $"{propertyPath}[{index}]";
                    if (affixEntry.ValueKind == JsonValueKind.Object &&
                        TryGetPropertyIgnoreCase(affixEntry, "effect", out var wrappedEffect))
                    {
                        ValidateAffix(wrappedEffect, $"{affixPath}.effect", issues);
                    }
                    else
                    {
                        ValidateAffix(affixEntry, affixPath, issues);
                    }

                    index++;
                }
            }

            WalkAffixes(property.Value, propertyPath, issues);
        }
    }

    private void ValidateAffix(JsonElement affix, string path, List<ContentContractIssue> issues)
    {
        var type = ValidateDiscriminator(affix, "affix", path, issues);
        if (!string.Equals(type, "hook", StringComparison.Ordinal) || affix.ValueKind != JsonValueKind.Object)
        {
            return;
        }

        ValidatePropertyArray(affix, "conditions", "battleHookCondition", path, issues);
        ValidatePropertyArray(affix, "effects", "battleEffect", path, issues);
    }

    private void ValidatePropertyArray(
        JsonElement owner,
        string propertyName,
        string group,
        string ownerPath,
        List<ContentContractIssue> issues)
    {
        if (owner.ValueKind != JsonValueKind.Object ||
            !TryGetPropertyIgnoreCase(owner, propertyName, out var values) ||
            values.ValueKind != JsonValueKind.Array)
        {
            return;
        }

        var index = 0;
        foreach (var value in values.EnumerateArray())
        {
            var path = $"{ownerPath}.{propertyName}[{index}]";
            ValidateDiscriminator(value, group, path, issues);
            if (string.Equals(group, "battleEffect", StringComparison.Ordinal) &&
                value.ValueKind == JsonValueKind.Object &&
                TryGetPropertyIgnoreCase(value, "target", out var target))
            {
                ValidateDiscriminator(target, "battleTarget", $"{path}.target", issues);
            }

            index++;
        }
    }

    private string? ValidateDiscriminator(
        JsonElement value,
        string group,
        string path,
        List<ContentContractIssue> issues)
    {
        if (!_contract.PolymorphicTypes.TryGetValue(group, out var typeContract) ||
            !_allowedValues.TryGetValue(group, out var allowedValues))
        {
            throw new InvalidDataException($"Content contract does not define polymorphic group '{group}'.");
        }

        if (value.ValueKind != JsonValueKind.Object ||
            !TryGetPropertyIgnoreCase(value, typeContract.Discriminator, out var discriminator) ||
            discriminator.ValueKind != JsonValueKind.String)
        {
            issues.Add(new ContentContractIssue(
                "contract.missing-discriminator",
                "error",
                "contract",
                $"缺少游戏类型字段“{typeContract.Discriminator}”。",
                path));
            return null;
        }

        var type = discriminator.GetString()!;
        if (!allowedValues.Contains(type))
        {
            issues.Add(new ContentContractIssue(
                "contract.unknown-discriminator",
                "error",
                "contract",
                $"当前游戏契约不支持类型“{type}”（{group}）。",
                path));
        }

        return type;
    }

    private static void ForEachDefinition(JsonElement root, Action<JsonElement, int> action)
    {
        if (root.ValueKind == JsonValueKind.Array)
        {
            var index = 0;
            foreach (var item in root.EnumerateArray())
            {
                action(item, index++);
            }
        }
        else if (root.ValueKind == JsonValueKind.Object)
        {
            action(root, 0);
        }
    }
}
