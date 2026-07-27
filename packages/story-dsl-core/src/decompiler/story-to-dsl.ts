import { ExprIr, ScriptIr, StepIr, ValueArgIr } from "../compiler/ir";

const NUMBER_PATTERN = /^[+-]?\d+(?:\.\d+)?$/u;

export function decompileStoryJson(story: ScriptIr): string {
  if (!story || typeof story !== "object" || !Array.isArray(story.segments)) {
    throw new Error("Story JSON 必须包含 segments 数组。");
  }

  const lines: string[] = [];
  for (const segment of story.segments) {
    if (lines.length > 0) lines.push("");
    lines.push(`# ${String(segment?.name ?? "")}`);
    appendSteps(lines, Array.isArray(segment?.steps) ? segment.steps : [], 0);
  }
  return `${lines.join("\n")}\n`;
}

function appendSteps(lines: string[], steps: StepIr[], indentLevel: number): void {
  for (const step of steps) appendStep(lines, step, indentLevel);
}

function appendStep(lines: string[], step: StepIr, indentLevel: number): void {
  const indent = "  ".repeat(indentLevel);
  switch (step.kind) {
    case "dialogue":
      lines.push(`${indent}${formatDialogue(step.speaker, step.text, step.style)}`);
      break;
    case "command":
      lines.push(`${indent}${formatCommand(step.name, step.args)}`);
      break;
    case "jump":
      lines.push(`${indent}jump ${step.target}`);
      break;
    case "call":
      lines.push(`${indent}call ${step.target}`);
      break;
    case "return":
      lines.push(`${indent}return`);
      break;
    case "choice":
      lines.push(`${indent}${formatDialogue(step.prompt.speaker, step.prompt.text, step.style)}`);
      appendChoiceGroups(lines, step.groups, indentLevel);
      break;
    case "battle":
      lines.push(`${indent}battle ${step.battleId}`);
      for (const outcome of ["win", "lose", "timeout"] as const) {
        if (!Object.prototype.hasOwnProperty.call(step.outcomes, outcome)) continue;
        lines.push(`${indent}- ${outcome}`);
        appendSteps(lines, step.outcomes[outcome] ?? [], indentLevel + 1);
      }
      break;
    case "branch":
      step.cases.forEach((branch, index) => {
        lines.push(`${indent}${index === 0 ? "if" : "elif"} ${formatExpression(branch.when)}`);
        appendSteps(lines, branch.steps, indentLevel + 1);
      });
      if (Array.isArray(step.fallback)) {
        lines.push(`${indent}else`);
        appendSteps(lines, step.fallback, indentLevel + 1);
      }
      break;
  }
}

function appendChoiceGroups(
  lines: string[],
  groups: Extract<StepIr, { kind: "choice" }>["groups"],
  indentLevel: number,
): void {
  const indent = "  ".repeat(indentLevel);
  for (const group of groups) {
    const conditional = Object.prototype.hasOwnProperty.call(group, "when");
    const optionIndentLevel = conditional ? indentLevel + 1 : indentLevel;
    if (conditional) lines.push(`${indent}when ${formatExpression(group.when!)}`);
    const optionIndent = "  ".repeat(optionIndentLevel);
    for (const option of group.options) {
      lines.push(`${optionIndent}- ${option.text}`);
      appendSteps(lines, option.steps, optionIndentLevel + 1);
    }
  }
}

function formatDialogue(speaker: string, text: string, style?: string): string {
  return `${speaker}：${style ? `[#style=${style}]` : ""}${text}`;
}

function formatCommand(name: string, args: ValueArgIr[]): string {
  return [name, ...args.map(formatValueArg)].join(" ");
}

function formatValueArg(value: ValueArgIr): string {
  if (Array.isArray(value) && value[0] === "list") {
    return `[${value.slice(1).map((item) => formatValueArg(item as ValueArgIr)).join(", ")}]`;
  }
  if (Array.isArray(value) && value[0] === "var") return `$${value[1]}`;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return canUseBareValue(value) ? value : JSON.stringify(value);
}

function canUseBareValue(value: string): boolean {
  return value.length > 0
    && !NUMBER_PATTERN.test(value)
    && !value.startsWith("$")
    && !value.startsWith("[")
    && !value.startsWith('"')
    && !/[\s,[\]"]/u.test(value)
    && !value.includes("//")
    && value !== "true"
    && value !== "false";
}

function formatExpression(expr: ExprIr): string {
  if (Array.isArray(expr)) {
    const [operator, ...rest] = expr;
    if (operator === "and" || operator === "or") {
      return (rest as ExprIr[]).map(formatNestedExpression).join(` ${operator} `);
    }
    if (operator === "not") return `not ${formatNestedExpression(rest[0] as ExprIr)}`;
    if (operator === "pred") {
      const [name, ...args] = rest;
      return [String(name), ...(args as ValueArgIr[]).map(formatValueArg)].join(" ");
    }
    if (operator === "var") return `$${String(rest[0])}`;
    if (["==", "!=", ">", ">=", "<", "<="].includes(operator)) {
      return `${formatNestedExpression(rest[0] as ExprIr)} ${operator} ${formatNestedExpression(rest[1] as ExprIr)}`;
    }
  }
  return formatValueArg(expr as ValueArgIr);
}

function formatNestedExpression(expr: ExprIr): string {
  return Array.isArray(expr) && ["and", "or", "not", "==", "!=", ">", ">=", "<", "<="].includes(expr[0])
    ? `(${formatExpression(expr)})`
    : formatExpression(expr);
}
