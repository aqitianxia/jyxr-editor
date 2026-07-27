function invocationLookup(invocations) {
  const lookup = new Map();
  for (const invocation of invocations || []) {
    if (!invocation?.name) continue;
    lookup.set(invocation.name, invocation);
    for (const alias of invocation.aliases || []) lookup.set(alias, invocation);
  }
  return lookup;
}

export function getStoryCommandNames(contract) {
  return [...invocationLookup(contract?.commands).keys()].sort((left, right) => left.localeCompare(right));
}

export function getStoryCommandContract(contract, name) {
  return invocationLookup(contract?.commands).get(name) || null;
}

export function getStoryCommandParameter(contract, name, index) {
  const invocation = getStoryCommandContract(contract, name);
  return invocation ? parameterAt(invocation.parameters || [], index) : null;
}

export function collectStoryDeclaredVariablesFromJson(value, target = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) collectStoryDeclaredVariablesFromJson(item, target);
    return target;
  }
  if (!value || typeof value !== "object") return target;
  if (value.kind === "command" && value.name === "set_flag" && typeof value.args?.[0] === "string") {
    target.add(value.args[0]);
  }
  for (const child of Object.values(value)) collectStoryDeclaredVariablesFromJson(child, target);
  return target;
}

export function validateStoryRuntimeContract(ast, contract, context = {}) {
  if (!ast || !contract) return [];
  const diagnostics = [];
  const commands = invocationLookup(contract.commands);
  const predicates = invocationLookup(contract.predicates);
  const knownVariables = new Set([
    ...(contract.variables || []).map((entry) => entry.name),
    ...(context.knownVariables || []),
  ]);
  collectDeclaredVariables(ast, knownVariables);

  const add = (message, span, code = "runtime-contract") => diagnostics.push({
    message,
    span,
    severity: "error",
    code,
  });
  const validateVariable = (arg, fallbackSpan) => {
    if (arg?.type !== "variable" || knownVariables.has(arg.name)) return;
    add(`变量未定义：$${arg.name}`, arg.span || fallbackSpan, "unknown-variable");
  };
  const validateArgument = (arg, parameter, invocationLabel, fallbackSpan) => {
    if (!arg || !parameter || arg.type === "variable" || parameter.kind === "any") return;
    const span = arg.span || fallbackSpan;
    if (!matchesArgumentKind(arg, parameter.kind)) {
      add(`${invocationLabel} 参数“${parameter.name}”需要${argumentKindLabel(parameter.kind)}`, span, "argument-type");
      return;
    }
    if (parameter.allowedValues?.length && arg.type === "literal" &&
        !parameter.allowedValues.includes(String(arg.value))) {
      add(`${invocationLabel} 参数“${parameter.name}”只允许：${parameter.allowedValues.join(" / ")}`, span, "argument-value");
    }
    if (!parameter.referenceType || typeof context.hasReference !== "function") return;
    for (const value of literalStringValues(arg)) {
      if (!context.hasReference(parameter.referenceType, value)) {
        add(`${invocationLabel} 引用了不存在的${referenceTypeLabel(parameter.referenceType)}：${value}`, span, "missing-reference");
      }
    }
  };
  const validateInvocation = (node, lookup, label) => {
    const invocation = lookup.get(node.name);
    const display = `${label} ${node.name}`;
    if (!invocation) {
      add(`运行时不支持${label}：${node.name}`, node.span, label === "命令" ? "unknown-command" : "unknown-predicate");
      return;
    }
    const args = node.args || [];
    if (args.length < invocation.minimumArguments ||
        (invocation.maximumArguments != null && args.length > invocation.maximumArguments)) {
      add(`${display} 参数数量错误：需要 ${formatArity(invocation)}，实际 ${args.length} 个`, node.span, "argument-count");
    }
    for (const [index, arg] of args.entries()) {
      validateArgument(arg, parameterAt(invocation.parameters || [], index), display, node.span);
    }
  };
  const validateExpression = (expr, fallbackSpan, requiresBoolean = true) => {
    if (!expr) return;
    if (expr.type === "predicate") {
      validateInvocation(expr, predicates, "条件谓词");
      return;
    }
    if (expr.type === "variable") {
      validateVariable(expr, fallbackSpan);
      return;
    }
    if (expr.type === "literal") {
      if (requiresBoolean && typeof expr.value !== "boolean") {
        add(`条件表达式不是有效谓词或布尔比较：${String(expr.value)}`, expr.span || fallbackSpan, "invalid-condition");
      }
      return;
    }
    if (expr.type === "comparison") {
      validateExpression(expr.left, fallbackSpan, false);
      validateExpression(expr.right, fallbackSpan, false);
      return;
    }
    validateExpression(expr.left || expr.operand, fallbackSpan, true);
    validateExpression(expr.right, fallbackSpan, true);
  };
  const walkStatements = (statements) => {
    for (const statement of statements || []) {
      if (statement.type === "command") {
        validateInvocation(statement, commands, "命令");
        for (const arg of statement.args || []) walkArgumentVariables(arg, validateVariable, statement.span);
      } else if (statement.type === "battle") {
        for (const outcome of statement.outcomes || []) walkStatements(outcome.statements);
      } else if (statement.type === "choice") {
        for (const group of statement.groups || []) {
          validateExpression(group.condition, group.span || statement.span);
          for (const option of group.options || []) walkStatements(option.statements);
        }
      } else if (statement.type === "if") {
        for (const branch of statement.branches || []) {
          validateExpression(branch.condition, branch.span || statement.span);
          walkStatements(branch.statements);
        }
      }
    }
  };
  for (const segment of ast.segments || []) walkStatements(segment.statements);
  return diagnostics;
}

function collectDeclaredVariables(ast, variables) {
  const walk = (statements) => {
    for (const statement of statements || []) {
      if (statement.type === "command" && statement.name === "set_flag") {
        for (const value of literalStringValues(statement.args?.[0])) variables.add(value);
      }
      if (statement.type === "battle") {
        for (const outcome of statement.outcomes || []) walk(outcome.statements);
      } else if (statement.type === "choice") {
        for (const group of statement.groups || []) {
          for (const option of group.options || []) walk(option.statements);
        }
      } else if (statement.type === "if") {
        for (const branch of statement.branches || []) walk(branch.statements);
      }
    }
  };
  for (const segment of ast.segments || []) walk(segment.statements);
}

function parameterAt(parameters, index) {
  if (index < parameters.length) return parameters[index];
  const last = parameters[parameters.length - 1];
  return last?.variadic ? last : null;
}

function matchesArgumentKind(arg, kind) {
  if (kind === "stringList") {
    return arg.type === "list" && (arg.items || []).every((item) =>
      item.type === "variable" || (item.type === "literal" && typeof item.value === "string"));
  }
  if (arg.type !== "literal") return false;
  if (kind === "string") return typeof arg.value === "string";
  if (kind === "number") return typeof arg.value === "number" && Number.isFinite(arg.value);
  if (kind === "boolean") return typeof arg.value === "boolean";
  return true;
}

function walkArgumentVariables(arg, validate, fallbackSpan) {
  validate(arg, fallbackSpan);
  for (const item of arg?.items || []) walkArgumentVariables(item, validate, fallbackSpan);
}

function literalStringValues(arg) {
  if (arg?.type === "literal" && typeof arg.value === "string" && arg.value) return [arg.value];
  if (arg?.type === "list") return (arg.items || []).flatMap(literalStringValues);
  return [];
}

function formatArity(invocation) {
  if (invocation.maximumArguments == null) return `至少 ${invocation.minimumArguments} 个`;
  if (invocation.minimumArguments === invocation.maximumArguments) return `${invocation.minimumArguments} 个`;
  return `${invocation.minimumArguments} 至 ${invocation.maximumArguments} 个`;
}

function argumentKindLabel(kind) {
  return ({ string: "字符串", number: "数字", boolean: "布尔值", stringList: "字符串列表" })[kind] || "有效值";
}

function referenceTypeLabel(type) {
  if (type === "resources") return "资源";
  if (type.startsWith("resource:")) return `${type.slice("resource:".length)}资源`;
  return ({
    items: "物品", story: "剧情段", sects: "门派", characters: "角色", "grow-templates": "成长模板",
    skills: "技能或天赋", achievements: "成就", maps: "地图", shops: "商店",
  })[type] || "内容";
}
