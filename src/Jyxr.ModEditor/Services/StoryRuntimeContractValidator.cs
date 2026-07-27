using System.Text.Json;

namespace JsonEditor.Services;

internal sealed class StoryRuntimeContractValidator
{
    private const int CurrentStoryVersion = 2;
    private readonly Dictionary<string, StoryInvocationContract> _commands;
    private readonly Dictionary<string, StoryInvocationContract> _predicates;
    private readonly HashSet<string> _operators;
    private readonly IReadOnlyDictionary<string, HashSet<string>> _references;
    private readonly HashSet<string> _knownVariables;

    public StoryRuntimeContractValidator(
        StoryRuntimeContract contract,
        IReadOnlyDictionary<string, HashSet<string>> references,
        IEnumerable<string> declaredVariables)
    {
        _commands = BuildInvocationLookup(contract.Commands);
        _predicates = BuildInvocationLookup(contract.Predicates);
        _operators = contract.Operators.ToHashSet(StringComparer.Ordinal);
        _references = references;
        _knownVariables = contract.Variables
            .Select(static variable => variable.Name)
            .Concat(declaredVariables)
            .ToHashSet(StringComparer.Ordinal);
    }

    public static void CollectDeclaredVariables(JsonElement element, HashSet<string> variables)
    {
        if (element.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in element.EnumerateArray())
            {
                CollectDeclaredVariables(item, variables);
            }

            return;
        }

        if (element.ValueKind != JsonValueKind.Object)
        {
            return;
        }

        if (TryGetProperty(element, "kind", out var kind) &&
            kind.ValueKind == JsonValueKind.String &&
            string.Equals(kind.GetString(), "command", StringComparison.Ordinal) &&
            TryGetProperty(element, "name", out var name) &&
            name.ValueKind == JsonValueKind.String &&
            string.Equals(name.GetString(), "set_flag", StringComparison.Ordinal) &&
            TryGetProperty(element, "args", out var args) &&
            args.ValueKind == JsonValueKind.Array)
        {
            var firstArgument = args.EnumerateArray().FirstOrDefault();
            if (firstArgument.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(firstArgument.GetString()))
            {
                variables.Add(firstArgument.GetString()!);
            }
        }

        foreach (var property in element.EnumerateObject())
        {
            CollectDeclaredVariables(property.Value, variables);
        }
    }

    public void Validate(string relativePath, JsonElement root, List<ContentContractIssue> issues)
    {
        if (root.ValueKind != JsonValueKind.Object)
        {
            AddSchemaIssue(issues, relativePath, "Story JSON 顶层必须是对象。");
            return;
        }

        if (!TryGetProperty(root, "version", out var version) ||
            version.ValueKind != JsonValueKind.Number ||
            !version.TryGetInt32(out var versionNumber))
        {
            AddSchemaIssue(issues, relativePath, "Story JSON 缺少数字版本号 version。");
        }
        else if (versionNumber != CurrentStoryVersion)
        {
            AddSchemaIssue(issues, relativePath, $"Story JSON 版本应为 {CurrentStoryVersion}，实际为 {versionNumber}。");
        }

        if (!TryGetProperty(root, "segments", out var segments) || segments.ValueKind != JsonValueKind.Array)
        {
            AddSchemaIssue(issues, relativePath, "Story JSON 缺少剧情段数组 segments。");
            return;
        }

        var segmentNames = new HashSet<string>(StringComparer.Ordinal);
        var segmentIndex = 0;
        foreach (var segment in segments.EnumerateArray())
        {
            var segmentPath = $"{relativePath}.segments[{segmentIndex}]";
            if (segment.ValueKind != JsonValueKind.Object)
            {
                AddSchemaIssue(issues, segmentPath, "剧情段必须是对象。");
            }
            else
            {
                var segmentName = RequireString(segment, "name", segmentPath, issues);
                if (segmentName is not null && !segmentNames.Add(segmentName))
                {
                    issues.Add(new ContentContractIssue(
                        "story.segment.duplicate",
                        "error",
                        "story",
                        $"剧情段名称重复：{segmentName}。",
                        segmentPath));
                }
                if (TryGetProperty(segment, "steps", out var steps))
                {
                    ValidateSteps(steps, $"{segmentPath}.steps", issues);
                }
                else
                {
                    AddSchemaIssue(issues, segmentPath, "剧情段缺少 steps 数组。");
                }
            }

            segmentIndex++;
        }
    }

    private void ValidateSteps(JsonElement steps, string path, List<ContentContractIssue> issues)
    {
        if (steps.ValueKind != JsonValueKind.Array)
        {
            AddSchemaIssue(issues, path, "剧情步骤必须是数组。");
            return;
        }

        var index = 0;
        foreach (var step in steps.EnumerateArray())
        {
            ValidateStep(step, $"{path}[{index}]", issues);
            index++;
        }
    }

    private void ValidateStep(JsonElement step, string path, List<ContentContractIssue> issues)
    {
        if (step.ValueKind != JsonValueKind.Object)
        {
            AddSchemaIssue(issues, path, "剧情步骤必须是对象。");
            return;
        }

        var kind = RequireString(step, "kind", path, issues);
        switch (kind)
        {
            case "dialogue":
                RequireString(step, "speaker", path, issues);
                RequireString(step, "text", path, issues);
                break;
            case "command":
                ValidateCommand(step, path, issues);
                break;
            case "jump":
            case "call":
                ValidateReference(RequireString(step, "target", path, issues), "story", path, issues);
                break;
            case "return":
                break;
            case "choice":
                ValidateChoice(step, path, issues);
                break;
            case "battle":
                ValidateBattle(step, path, issues);
                break;
            case "branch":
                ValidateBranch(step, path, issues);
                break;
            case null:
                break;
            default:
                issues.Add(new ContentContractIssue(
                    "story.step.unknown",
                    "error",
                    "story",
                    $"游戏运行时不支持剧情步骤类型“{kind}”。",
                    path));
                break;
        }
    }

    private void ValidateCommand(JsonElement step, string path, List<ContentContractIssue> issues)
    {
        var name = RequireString(step, "name", path, issues);
        if (!TryGetProperty(step, "args", out var arguments) || arguments.ValueKind != JsonValueKind.Array)
        {
            AddSchemaIssue(issues, path, "剧情命令缺少 args 数组。");
            return;
        }

        if (name is not null)
        {
            ValidateInvocation(name, arguments.EnumerateArray().ToArray(), _commands, "命令", path, issues);
        }
    }

    private void ValidateChoice(JsonElement step, string path, List<ContentContractIssue> issues)
    {
        if (TryGetProperty(step, "style", out var style) &&
            (style.ValueKind != JsonValueKind.String || style.GetString() is not ("regular" or "bold")))
        {
            AddSchemaIssue(issues, $"{path}.style", "选择样式只支持 regular 或 bold。");
        }

        if (!TryGetProperty(step, "prompt", out var prompt) || prompt.ValueKind != JsonValueKind.Object)
        {
            AddSchemaIssue(issues, path, "选择步骤缺少 prompt 对象。");
        }
        else
        {
            RequireString(prompt, "speaker", $"{path}.prompt", issues);
            RequireString(prompt, "text", $"{path}.prompt", issues);
        }

        if (!TryGetProperty(step, "groups", out var groups) || groups.ValueKind != JsonValueKind.Array)
        {
            AddSchemaIssue(issues, path, "选择步骤缺少 groups 数组。");
            return;
        }

        var groupValues = groups.EnumerateArray().ToArray();
        if (groupValues.Length == 0)
        {
            AddSchemaIssue(issues, $"{path}.groups", "选择步骤至少需要一个选项组。");
        }

        for (var groupIndex = 0; groupIndex < groupValues.Length; groupIndex++)
        {
            var group = groupValues[groupIndex];
            var groupPath = $"{path}.groups[{groupIndex}]";
            if (group.ValueKind != JsonValueKind.Object)
            {
                AddSchemaIssue(issues, groupPath, "选择组必须是对象。");
                continue;
            }

            if (TryGetProperty(group, "when", out var condition))
            {
                if (condition.ValueKind == JsonValueKind.Null)
                {
                    AddSchemaIssue(issues, $"{groupPath}.when", "无条件选择组应省略 when，不能写 null。");
                }
                else
                {
                    ValidateExpression(condition, $"{groupPath}.when", issues);
                }
            }

            if (!TryGetProperty(group, "options", out var options) || options.ValueKind != JsonValueKind.Array)
            {
                AddSchemaIssue(issues, groupPath, "选择组缺少 options 数组。");
                continue;
            }

            var optionValues = options.EnumerateArray().ToArray();
            if (optionValues.Length == 0)
            {
                AddSchemaIssue(issues, $"{groupPath}.options", "选择组至少需要一个选项。");
            }

            for (var optionIndex = 0; optionIndex < optionValues.Length; optionIndex++)
            {
                var option = optionValues[optionIndex];
                var optionPath = $"{groupPath}.options[{optionIndex}]";
                if (option.ValueKind != JsonValueKind.Object)
                {
                    AddSchemaIssue(issues, optionPath, "选择项必须是对象。");
                    continue;
                }

                RequireString(option, "text", optionPath, issues);
                if (TryGetProperty(option, "steps", out var optionSteps))
                {
                    ValidateSteps(optionSteps, $"{optionPath}.steps", issues);
                }
                else
                {
                    AddSchemaIssue(issues, optionPath, "选择项缺少 steps 数组。");
                }
            }
        }
    }

    private void ValidateBattle(JsonElement step, string path, List<ContentContractIssue> issues)
    {
        ValidateReference(RequireString(step, "battleId", path, issues), "battles", path, issues);
        if (!TryGetProperty(step, "outcomes", out var outcomes) || outcomes.ValueKind != JsonValueKind.Object)
        {
            AddSchemaIssue(issues, path, "战斗步骤缺少 outcomes 对象。");
            return;
        }

        foreach (var outcome in outcomes.EnumerateObject())
        {
            if (outcome.Name is not ("win" or "lose" or "timeout"))
            {
                AddSchemaIssue(issues, $"{path}.outcomes.{outcome.Name}", $"不支持战斗结果“{outcome.Name}”。");
                continue;
            }

            ValidateSteps(outcome.Value, $"{path}.outcomes.{outcome.Name}", issues);
        }
    }

    private void ValidateBranch(JsonElement step, string path, List<ContentContractIssue> issues)
    {
        if (!TryGetProperty(step, "cases", out var cases) || cases.ValueKind != JsonValueKind.Array)
        {
            AddSchemaIssue(issues, path, "条件分支缺少 cases 数组。");
            return;
        }

        var index = 0;
        foreach (var branchCase in cases.EnumerateArray())
        {
            var casePath = $"{path}.cases[{index}]";
            if (branchCase.ValueKind != JsonValueKind.Object)
            {
                AddSchemaIssue(issues, casePath, "条件分支项必须是对象。");
            }
            else
            {
                if (TryGetProperty(branchCase, "when", out var condition))
                {
                    ValidateExpression(condition, $"{casePath}.when", issues);
                }
                else
                {
                    AddSchemaIssue(issues, casePath, "条件分支项缺少 when 表达式。");
                }

                if (TryGetProperty(branchCase, "steps", out var caseSteps))
                {
                    ValidateSteps(caseSteps, $"{casePath}.steps", issues);
                }
                else
                {
                    AddSchemaIssue(issues, casePath, "条件分支项缺少 steps 数组。");
                }
            }

            index++;
        }

        if (TryGetProperty(step, "fallback", out var fallback) && fallback.ValueKind != JsonValueKind.Null)
        {
            ValidateSteps(fallback, $"{path}.fallback", issues);
        }
    }

    private void ValidateExpression(JsonElement expression, string path, List<ContentContractIssue> issues)
    {
        if (expression.ValueKind is JsonValueKind.True or JsonValueKind.False)
        {
            return;
        }

        if (expression.ValueKind is JsonValueKind.String or JsonValueKind.Number)
        {
            issues.Add(new ContentContractIssue(
                "story.condition.type",
                "error",
                "story",
                "条件表达式必须产生布尔值，不能只写字符串或数字。",
                path));
            return;
        }

        if (expression.ValueKind != JsonValueKind.Array)
        {
            AddSchemaIssue(issues, path, "条件表达式必须是布尔值或表达式数组。");
            return;
        }

        var items = expression.EnumerateArray().ToArray();
        if (items.Length == 0 || items[0].ValueKind != JsonValueKind.String)
        {
            AddSchemaIssue(issues, path, "条件表达式数组必须以运算符字符串开头。");
            return;
        }

        var operation = items[0].GetString()!;
        if (string.Equals(operation, "var", StringComparison.Ordinal))
        {
            ValidateVariableExpression(items, path, issues);
            return;
        }

        if (string.Equals(operation, "pred", StringComparison.Ordinal))
        {
            if (items.Length < 2 || items[1].ValueKind != JsonValueKind.String)
            {
                AddSchemaIssue(issues, path, "谓词表达式必须以 [\"pred\", \"名称\", ...] 开头。");
                return;
            }

            ValidateInvocation(items[1].GetString()!, items.Skip(2).ToArray(), _predicates, "条件谓词", path, issues);
            return;
        }

        if (string.Equals(operation, "not", StringComparison.Ordinal))
        {
            if (items.Length != 2)
            {
                AddSchemaIssue(issues, path, "not 条件必须只有一个子表达式。");
                return;
            }

            ValidateExpression(items[1], $"{path}[1]", issues);
            return;
        }

        if (!_operators.Contains(operation) || operation is "not")
        {
            issues.Add(new ContentContractIssue(
                "story.condition.operator",
                "error",
                "story",
                $"游戏运行时不支持条件运算符“{operation}”。",
                path));
            return;
        }

        if (items.Length != 3)
        {
            AddSchemaIssue(issues, path, $"条件运算符“{operation}”必须有两个操作数。");
            return;
        }

        if (operation is "and" or "or")
        {
            ValidateExpression(items[1], $"{path}[1]", issues);
            ValidateExpression(items[2], $"{path}[2]", issues);
        }
        else
        {
            ValidateExpressionOperand(items[1], $"{path}[1]", issues);
            ValidateExpressionOperand(items[2], $"{path}[2]", issues);
        }
    }

    private void ValidateExpressionOperand(JsonElement operand, string path, List<ContentContractIssue> issues)
    {
        if (operand.ValueKind == JsonValueKind.Array)
        {
            ValidateExpression(operand, path, issues);
        }
        else if (operand.ValueKind is not (JsonValueKind.String or JsonValueKind.Number or JsonValueKind.True or JsonValueKind.False))
        {
            AddSchemaIssue(issues, path, "条件操作数必须是字面值或表达式。");
        }
    }

    private void ValidateInvocation(
        string name,
        IReadOnlyList<JsonElement> arguments,
        IReadOnlyDictionary<string, StoryInvocationContract> lookup,
        string label,
        string path,
        List<ContentContractIssue> issues)
    {
        if (!lookup.TryGetValue(name, out var invocation))
        {
            issues.Add(new ContentContractIssue(
                label == "命令" ? "story.command.unknown" : "story.predicate.unknown",
                "error",
                "story",
                $"游戏运行时不支持{label}“{name}”。",
                path));
            return;
        }

        if (arguments.Count < invocation.MinimumArguments ||
            (invocation.MaximumArguments is not null && arguments.Count > invocation.MaximumArguments.Value))
        {
            issues.Add(new ContentContractIssue(
                "story.argument.count",
                "error",
                "story",
                $"{label}“{name}”参数数量错误：需要 {FormatArity(invocation)}，实际 {arguments.Count} 个。",
                path));
        }

        for (var index = 0; index < arguments.Count; index++)
        {
            var argumentPath = $"{path}.args[{index}]";
            if (!ValidateValueArgument(arguments[index], argumentPath, issues))
            {
                continue;
            }

            var parameter = ParameterAt(invocation.Parameters, index);
            if (parameter is null || IsVariableArgument(arguments[index]) || string.Equals(parameter.Kind, "any", StringComparison.Ordinal))
            {
                continue;
            }

            if (!MatchesArgumentKind(arguments[index], parameter.Kind))
            {
                issues.Add(new ContentContractIssue(
                    "story.argument.type",
                    "error",
                    "story",
                    $"{label}“{name}”的参数“{parameter.Name}”需要{ArgumentKindLabel(parameter.Kind)}。",
                    argumentPath));
                continue;
            }

            if (parameter.AllowedValues.Count > 0 &&
                arguments[index].ValueKind == JsonValueKind.String &&
                !parameter.AllowedValues.Contains(arguments[index].GetString()!, StringComparer.Ordinal))
            {
                issues.Add(new ContentContractIssue(
                    "story.argument.value",
                    "error",
                    "story",
                    $"{label}“{name}”的参数“{parameter.Name}”只允许：{string.Join(" / ", parameter.AllowedValues)}。",
                    argumentPath));
            }

            if (parameter.ReferenceType is not null)
            {
                foreach (var value in LiteralStringValues(arguments[index]))
                {
                    ValidateReference(value, parameter.ReferenceType, argumentPath, issues, $"{label}“{name}”");
                }
            }
        }
    }

    private bool ValidateValueArgument(JsonElement argument, string path, List<ContentContractIssue> issues)
    {
        if (argument.ValueKind is JsonValueKind.String or JsonValueKind.Number)
        {
            return true;
        }

        if (argument.ValueKind != JsonValueKind.Array)
        {
            AddSchemaIssue(issues, path, "命令和谓词参数只能是字符串、数字、变量或列表。");
            return false;
        }

        var items = argument.EnumerateArray().ToArray();
        if (items.Length == 0 || items[0].ValueKind != JsonValueKind.String)
        {
            AddSchemaIssue(issues, path, "数组参数必须以 var 或 list 开头。");
            return false;
        }

        if (string.Equals(items[0].GetString(), "var", StringComparison.Ordinal))
        {
            ValidateVariableExpression(items, path, issues);
            return items.Length == 2 && items[1].ValueKind == JsonValueKind.String;
        }

        if (!string.Equals(items[0].GetString(), "list", StringComparison.Ordinal))
        {
            AddSchemaIssue(issues, path, "数组参数只支持 var 或 list。");
            return false;
        }

        var valid = true;
        for (var index = 1; index < items.Length; index++)
        {
            valid &= ValidateValueArgument(items[index], $"{path}[{index}]", issues);
        }

        return valid;
    }

    private void ValidateVariableExpression(
        IReadOnlyList<JsonElement> items,
        string path,
        List<ContentContractIssue> issues)
    {
        if (items.Count != 2 || items[1].ValueKind != JsonValueKind.String)
        {
            AddSchemaIssue(issues, path, "变量表达式必须是 [\"var\", \"变量名\"]。 ");
            return;
        }

        var name = items[1].GetString()!;
        if (!_knownVariables.Contains(name))
        {
            issues.Add(new ContentContractIssue(
                "story.variable.unknown",
                "error",
                "story",
                $"剧情变量未定义：${name}。请先用 set_flag 声明，或使用运行时内置变量。",
                path));
        }
    }

    private void ValidateReference(
        string? value,
        string referenceType,
        string path,
        List<ContentContractIssue> issues,
        string? invocationLabel = null)
    {
        if (string.IsNullOrWhiteSpace(value) ||
            !_references.TryGetValue(referenceType, out var values) ||
            values.Contains(value))
        {
            return;
        }

        issues.Add(new ContentContractIssue(
            "story.reference.missing",
            "error",
            "story",
            $"{invocationLabel ?? "剧情步骤"}引用了不存在的{ReferenceTypeLabel(referenceType)}：{value}。",
            path));
    }

    private static bool MatchesArgumentKind(JsonElement argument, string kind) => kind switch
    {
        "string" => argument.ValueKind == JsonValueKind.String,
        "number" => argument.ValueKind == JsonValueKind.Number,
        "boolean" => argument.ValueKind is JsonValueKind.True or JsonValueKind.False,
        "stringList" => IsStringList(argument),
        _ => true,
    };

    private static bool IsStringList(JsonElement argument)
    {
        if (argument.ValueKind != JsonValueKind.Array)
        {
            return false;
        }

        var items = argument.EnumerateArray().ToArray();
        return items.Length > 0 &&
            items[0].ValueKind == JsonValueKind.String &&
            string.Equals(items[0].GetString(), "list", StringComparison.Ordinal) &&
            items.Skip(1).All(static item => item.ValueKind == JsonValueKind.String || IsVariableArgument(item));
    }

    private static bool IsVariableArgument(JsonElement argument)
    {
        if (argument.ValueKind != JsonValueKind.Array)
        {
            return false;
        }

        var items = argument.EnumerateArray().ToArray();
        return items.Length == 2 &&
            items[0].ValueKind == JsonValueKind.String &&
            string.Equals(items[0].GetString(), "var", StringComparison.Ordinal) &&
            items[1].ValueKind == JsonValueKind.String;
    }

    private static IEnumerable<string> LiteralStringValues(JsonElement argument)
    {
        if (argument.ValueKind == JsonValueKind.String)
        {
            var value = argument.GetString();
            if (!string.IsNullOrWhiteSpace(value)) yield return value;
            yield break;
        }

        if (argument.ValueKind != JsonValueKind.Array)
        {
            yield break;
        }

        var items = argument.EnumerateArray().ToArray();
        if (items.Length == 0 || items[0].ValueKind != JsonValueKind.String ||
            !string.Equals(items[0].GetString(), "list", StringComparison.Ordinal))
        {
            yield break;
        }

        foreach (var item in items.Skip(1))
        {
            foreach (var value in LiteralStringValues(item)) yield return value;
        }
    }

    private static StoryParameterContract? ParameterAt(IReadOnlyList<StoryParameterContract> parameters, int index)
    {
        if (index < parameters.Count) return parameters[index];
        return parameters.Count > 0 && parameters[^1].Variadic ? parameters[^1] : null;
    }

    private static Dictionary<string, StoryInvocationContract> BuildInvocationLookup(
        IEnumerable<StoryInvocationContract> invocations)
    {
        var lookup = new Dictionary<string, StoryInvocationContract>(StringComparer.Ordinal);
        foreach (var invocation in invocations)
        {
            lookup[invocation.Name] = invocation;
            foreach (var alias in invocation.Aliases) lookup[alias] = invocation;
        }

        return lookup;
    }

    private static string? RequireString(
        JsonElement owner,
        string propertyName,
        string path,
        List<ContentContractIssue> issues)
    {
        if (!TryGetProperty(owner, propertyName, out var value) || value.ValueKind != JsonValueKind.String)
        {
            AddSchemaIssue(issues, path, $"缺少字符串字段“{propertyName}”。");
            return null;
        }

        return value.GetString();
    }

    private static bool TryGetProperty(JsonElement owner, string propertyName, out JsonElement value)
    {
        foreach (var property in owner.EnumerateObject())
        {
            if (property.NameEquals(propertyName))
            {
                value = property.Value;
                return true;
            }
        }

        value = default;
        return false;
    }

    private static void AddSchemaIssue(List<ContentContractIssue> issues, string path, string message)
    {
        issues.Add(new ContentContractIssue("story.schema", "error", "story", message, path));
    }

    private static string FormatArity(StoryInvocationContract invocation)
    {
        if (invocation.MaximumArguments is null) return $"至少 {invocation.MinimumArguments} 个";
        if (invocation.MinimumArguments == invocation.MaximumArguments) return $"{invocation.MinimumArguments} 个";
        return $"{invocation.MinimumArguments} 至 {invocation.MaximumArguments} 个";
    }

    private static string ArgumentKindLabel(string kind) => kind switch
    {
        "string" => "字符串",
        "number" => "数字",
        "boolean" => "布尔值",
        "stringList" => "字符串列表",
        _ => "有效值",
    };

    private static string ReferenceTypeLabel(string type) => type switch
    {
        "resources" => "资源",
        "items" => "物品",
        "story" => "剧情段",
        "sects" => "门派",
        "characters" => "角色",
        "grow-templates" => "成长模板",
        "skills" => "技能或天赋",
        "achievements" => "成就",
        "maps" => "地图",
        "shops" => "商店",
        "battles" => "战斗",
        _ => "内容",
    };
}
