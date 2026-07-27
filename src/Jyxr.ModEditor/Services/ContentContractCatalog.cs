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

public sealed record StoryParameterContract(
    string Name,
    string Kind,
    bool Required,
    bool Variadic,
    object? DefaultValue,
    string? ReferenceType,
    IReadOnlyList<string> AllowedValues);

public sealed record StoryInvocationContract(
    string Name,
    IReadOnlyList<string> Aliases,
    int MinimumArguments,
    int? MaximumArguments,
    IReadOnlyList<StoryParameterContract> Parameters);

public sealed record StoryVariableContract(string Name, string Kind);

public sealed record StoryRuntimeContract(
    IReadOnlyList<StoryInvocationContract> Commands,
    IReadOnlyList<StoryInvocationContract> Predicates,
    IReadOnlyList<StoryVariableContract> Variables,
    IReadOnlyList<string> Operators);

public sealed record EditorContentContract(
    string Format,
    int ContractVersion,
    IReadOnlyList<ContentFileContract> RequiredContentFiles,
    IReadOnlyDictionary<string, DefinitionContract> Definitions,
    IReadOnlyDictionary<string, PolymorphicTypeContract> PolymorphicTypes,
    IReadOnlyDictionary<string, string[]> Enums,
    ResourceContract Resources,
    StoryRuntimeContract Story);

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
        var parsedDocuments = new List<(string RelativePath, JsonDocument Document)>();
        try
        {
            foreach (var jsonFile in jsonFiles)
            {
                var relativePath = Path.GetRelativePath(dataPath, jsonFile).Replace('\\', '/');
                try
                {
                    parsedDocuments.Add((relativePath, JsonDocument.Parse(File.ReadAllText(jsonFile))));
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

            var storyReferences = BuildStoryReferences(parsedDocuments);
            var declaredVariables = new HashSet<string>(StringComparer.Ordinal);
            foreach (var (relativePath, document) in parsedDocuments)
            {
                if (relativePath.EndsWith(".story.json", StringComparison.OrdinalIgnoreCase))
                {
                    StoryRuntimeContractValidator.CollectDeclaredVariables(document.RootElement, declaredVariables);
                }
            }

            var storyValidator = new StoryRuntimeContractValidator(_contract.Story, storyReferences, declaredVariables);
            foreach (var (relativePath, document) in parsedDocuments)
            {
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
                if (relativePath.EndsWith(".story.json", StringComparison.OrdinalIgnoreCase))
                {
                    storyValidator.Validate(relativePath, document.RootElement, issues);
                }
            }
        }
        finally
        {
            foreach (var (_, document) in parsedDocuments) document.Dispose();
        }

        return new ContentContractValidation(jsonFiles.Length, _contract.ContractVersion, issues);
    }

    private static IReadOnlyDictionary<string, HashSet<string>> BuildStoryReferences(
        IReadOnlyList<(string RelativePath, JsonDocument Document)> documents)
    {
        var references = new Dictionary<string, HashSet<string>>(StringComparer.Ordinal);
        foreach (var type in new[]
                 {
                     "achievements", "battles", "characters", "grow-templates", "items", "maps",
                     "resources", "sects", "shops", "skills", "story",
                 })
        {
            references[type] = new HashSet<string>(StringComparer.Ordinal);
        }

        foreach (var (relativePath, document) in documents)
        {
            if (relativePath.EndsWith(".story.json", StringComparison.OrdinalIgnoreCase))
            {
                if (document.RootElement.ValueKind == JsonValueKind.Object &&
                    TryGetPropertyIgnoreCase(document.RootElement, "segments", out var segments) &&
                    segments.ValueKind == JsonValueKind.Array)
                {
                    foreach (var segment in segments.EnumerateArray())
                    {
                        AddStringPropertyReference(references, "story", segment, "name");
                    }
                }

                continue;
            }

            if (document.RootElement.ValueKind != JsonValueKind.Array)
            {
                continue;
            }

            var definitionType = Path.GetFileNameWithoutExtension(relativePath);
            foreach (var definition in document.RootElement.EnumerateArray())
            {
                AddStringPropertyReference(references, definitionType, definition, "id");
                if (string.Equals(definitionType, "characters", StringComparison.Ordinal))
                {
                    AddStringPropertyReference(references, "characters", definition, "name");
                }
                else if (string.Equals(definitionType, "resources", StringComparison.Ordinal))
                {
                    if (TryGetPropertyIgnoreCase(definition, "id", out var id) &&
                        id.ValueKind == JsonValueKind.String &&
                        TryGetPropertyIgnoreCase(definition, "group", out var group) &&
                        group.ValueKind == JsonValueKind.String &&
                        string.Equals(group.GetString(), "nick", StringComparison.Ordinal) &&
                        id.GetString() is { } resourceId &&
                        resourceId.StartsWith("nick.", StringComparison.Ordinal) &&
                        resourceId.Length > "nick.".Length)
                    {
                        AddReference(references, "achievements", resourceId["nick.".Length..]);
                    }
                }
            }
        }

        foreach (var skillType in new[] { "external-skills", "internal-skills", "special-skills", "talents" })
        {
            if (!references.TryGetValue(skillType, out var skillIds)) continue;
            foreach (var skillId in skillIds) AddReference(references, "skills", skillId);
        }

        return references;
    }

    private static void AddStringPropertyReference(
        Dictionary<string, HashSet<string>> references,
        string type,
        JsonElement owner,
        string propertyName)
    {
        if (owner.ValueKind == JsonValueKind.Object &&
            TryGetPropertyIgnoreCase(owner, propertyName, out var value) &&
            value.ValueKind == JsonValueKind.String)
        {
            AddReference(references, type, value.GetString());
        }
    }

    private static void AddReference(
        Dictionary<string, HashSet<string>> references,
        string type,
        string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return;
        if (!references.TryGetValue(type, out var values))
        {
            values = new HashSet<string>(StringComparer.Ordinal);
            references[type] = values;
        }

        values.Add(value);
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
