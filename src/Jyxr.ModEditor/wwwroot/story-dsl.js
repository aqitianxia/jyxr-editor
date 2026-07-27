(() => {
  // ../../packages/story-dsl-core/src/compiler/command-transforms.ts
  function transformCommand(command, context) {
    if (command.name !== "maxlevel" || command.args.length !== 2) {
      return command;
    }
    const skillName = command.args[0];
    if (typeof skillName !== "string") {
      context.diagnostics.push({
        message: "maxlevel \u81EA\u52A8\u8865 key \u65F6\uFF0C\u6280\u80FD\u540D\u5FC5\u987B\u662F\u5B57\u7B26\u4E32\u5B57\u9762\u91CF",
        span: context.span,
        severity: "error",
        code: "semantic"
      });
      return command;
    }
    return {
      ...command,
      args: [...command.args, `${context.segmentName}_${skillName}`]
    };
  }

  // ../../packages/story-dsl-core/src/compiler/compiler.ts
  function unreachableDiagnostic(span) {
    return {
      message: "jump/return \u4E4B\u540E\u7684\u540C\u7EA7\u8BED\u53E5\u4E0D\u53EF\u8FBE\uFF0C\u5DF2\u8DF3\u8FC7 IR \u8F93\u51FA",
      span,
      severity: "error",
      code: "unreachable"
    };
  }
  function compileScript(ast) {
    const diagnostics = [];
    const segments = ast.segments.map((segment) => ({
      name: segment.name,
      steps: compileSteps(segment.statements, segment.name, diagnostics)
    }));
    return {
      ir: {
        version: 2,
        segments
      },
      diagnostics
    };
  }
  function compileSteps(statements, segmentName, diagnostics) {
    const steps = [];
    let terminated = false;
    for (const statement of statements) {
      if (terminated) {
        diagnostics.push(unreachableDiagnostic(statement.span));
        continue;
      }
      const step = compileStatement(statement, segmentName, diagnostics);
      if (step) {
        steps.push(step);
        if (isTerminatingStep(step)) {
          terminated = true;
        }
      }
    }
    return steps;
  }
  function isTerminatingStep(step) {
    return step.kind === "jump" || step.kind === "return";
  }
  function compileStatement(statement, segmentName, diagnostics) {
    switch (statement.type) {
      case "dialogue":
        return {
          kind: "dialogue",
          speaker: statement.speaker,
          text: statement.text,
          ...statement.style ? { style: statement.style } : {}
        };
      case "command":
        return transformCommand({
          kind: "command",
          name: statement.name,
          args: statement.args.map(compileValueArg)
        }, {
          segmentName,
          span: statement.span,
          diagnostics
        });
      case "jump":
        return {
          kind: "jump",
          target: statement.target
        };
      case "call":
        return {
          kind: "call",
          target: statement.target
        };
      case "return":
        return {
          kind: "return"
        };
      case "choice":
        return {
          kind: "choice",
          ...statement.style ? { style: statement.style } : {},
          prompt: {
            speaker: statement.prompt.speaker,
            text: statement.prompt.text
          },
          groups: statement.groups.map((group) => ({
            ...group.condition ? { when: compileExpr(group.condition) } : {},
            options: group.options.map((option) => ({
              text: option.text,
              steps: compileSteps(option.statements, segmentName, diagnostics)
            }))
          }))
        };
      case "battle": {
        const outcomes = {};
        statement.outcomes.forEach((outcome) => {
          outcomes[outcome.outcome] = compileSteps(outcome.statements, segmentName, diagnostics);
        });
        return {
          kind: "battle",
          battleId: statement.battleId,
          outcomes
        };
      }
      case "if":
        return compileBranch(statement, segmentName, diagnostics);
      default:
        return null;
    }
  }
  function compileBranch(statement, segmentName, diagnostics) {
    const cases = [];
    let fallback = null;
    for (const branch of statement.branches) {
      const steps = compileSteps(branch.statements, segmentName, diagnostics);
      if (branch.keyword === "else") {
        fallback = steps;
        continue;
      }
      if (!branch.condition) {
        continue;
      }
      cases.push({
        when: compileExpr(branch.condition),
        steps
      });
    }
    return {
      kind: "branch",
      cases,
      fallback
    };
  }
  function compileExpr(expr) {
    switch (expr.type) {
      case "binary":
        return [expr.operator, compileExpr(expr.left), compileExpr(expr.right)];
      case "unary":
        return ["not", compileExpr(expr.operand)];
      case "comparison":
        return compileComparison(expr);
      case "predicate":
        return ["pred", expr.name, ...expr.args.map(compileValueArg)];
      case "variable":
        return compileVariableExpr(expr);
      case "literal":
        return expr.value;
    }
  }
  function compileComparison(expr) {
    return [expr.operator, compileExpr(expr.left), compileExpr(expr.right)];
  }
  function compileValueArg(arg) {
    if (arg.type === "list") {
      return compileListValueArg(arg);
    }
    if (arg.type === "variable") {
      return compileVariableExpr(arg);
    }
    return compileLiteralExpr(arg);
  }
  function compileListValueArg(arg) {
    return ["list", ...arg.items.map(compileValueArg)];
  }
  function compileVariableExpr(expr) {
    return ["var", expr.name];
  }
  function compileLiteralExpr(expr) {
    return expr.value;
  }

  // ../../packages/story-dsl-core/src/decompiler/story-to-dsl.ts
  var NUMBER_PATTERN = /^[+-]?\d+(?:\.\d+)?$/u;
  function decompileStoryJson(story) {
    if (!story || typeof story !== "object" || !Array.isArray(story.segments)) {
      throw new Error("Story JSON \u5FC5\u987B\u5305\u542B segments \u6570\u7EC4\u3002");
    }
    const lines = [];
    for (const segment of story.segments) {
      if (lines.length > 0) lines.push("");
      lines.push(`# ${String(segment?.name ?? "")}`);
      appendSteps(lines, Array.isArray(segment?.steps) ? segment.steps : [], 0);
    }
    return `${lines.join("\n")}
`;
  }
  function appendSteps(lines, steps, indentLevel) {
    for (const step of steps) appendStep(lines, step, indentLevel);
  }
  function appendStep(lines, step, indentLevel) {
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
        for (const outcome of ["win", "lose", "timeout"]) {
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
  function appendChoiceGroups(lines, groups, indentLevel) {
    const indent = "  ".repeat(indentLevel);
    for (const group of groups) {
      const conditional = Object.prototype.hasOwnProperty.call(group, "when");
      const optionIndentLevel = conditional ? indentLevel + 1 : indentLevel;
      if (conditional) lines.push(`${indent}when ${formatExpression(group.when)}`);
      const optionIndent = "  ".repeat(optionIndentLevel);
      for (const option of group.options) {
        lines.push(`${optionIndent}- ${option.text}`);
        appendSteps(lines, option.steps, optionIndentLevel + 1);
      }
    }
  }
  function formatDialogue(speaker, text, style) {
    return `${speaker}\uFF1A${style ? `[#style=${style}]` : ""}${text}`;
  }
  function formatCommand(name, args) {
    return [name, ...args.map(formatValueArg)].join(" ");
  }
  function formatValueArg(value) {
    if (Array.isArray(value) && value[0] === "list") {
      return `[${value.slice(1).map((item) => formatValueArg(item)).join(", ")}]`;
    }
    if (Array.isArray(value) && value[0] === "var") return `$${value[1]}`;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    return canUseBareValue(value) ? value : JSON.stringify(value);
  }
  function canUseBareValue(value) {
    return value.length > 0 && !NUMBER_PATTERN.test(value) && !value.startsWith("$") && !value.startsWith("[") && !value.startsWith('"') && !/[\s,[\]"]/u.test(value) && !value.includes("//") && value !== "true" && value !== "false";
  }
  function formatExpression(expr) {
    if (Array.isArray(expr)) {
      const [operator, ...rest] = expr;
      if (operator === "and" || operator === "or") {
        return rest.map(formatNestedExpression).join(` ${operator} `);
      }
      if (operator === "not") return `not ${formatNestedExpression(rest[0])}`;
      if (operator === "pred") {
        const [name, ...args] = rest;
        return [String(name), ...args.map(formatValueArg)].join(" ");
      }
      if (operator === "var") return `$${String(rest[0])}`;
      if (["==", "!=", ">", ">=", "<", "<="].includes(operator)) {
        return `${formatNestedExpression(rest[0])} ${operator} ${formatNestedExpression(rest[1])}`;
      }
    }
    return formatValueArg(expr);
  }
  function formatNestedExpression(expr) {
    return Array.isArray(expr) && ["and", "or", "not", "==", "!=", ">", ">=", "<", "<="].includes(expr[0]) ? `(${formatExpression(expr)})` : formatExpression(expr);
  }

  // ../../packages/story-dsl-core/src/parser/value-arg.ts
  var NUMBER_PATTERN2 = /^[+-]?\d+(?:\.\d+)?$/u;
  function offsetPosition(base, relativeOffset) {
    return {
      line: base.line,
      column: base.column + relativeOffset,
      offset: base.offset + relativeOffset
    };
  }
  function spanFromRange(base, start, end) {
    return {
      start: offsetPosition(base, start),
      end: offsetPosition(base, Math.max(end, start + 1))
    };
  }
  function isArgumentSeparator(char) {
    return char === "," || char === "\uFF0C";
  }
  function parseValueArgAst(raw, span) {
    if (raw.startsWith('"') && raw.endsWith('"')) {
      try {
        return {
          type: "literal",
          value: JSON.parse(raw),
          valueType: "string",
          span
        };
      } catch {
        return {
          type: "literal",
          value: raw.slice(1, -1),
          valueType: "string",
          span
        };
      }
    }
    if (raw.startsWith("$") && raw.length > 1) {
      return {
        type: "variable",
        name: raw.slice(1),
        span
      };
    }
    if (NUMBER_PATTERN2.test(raw)) {
      return {
        type: "literal",
        value: Number(raw),
        valueType: "number",
        span
      };
    }
    if (raw === "true" || raw === "false") {
      return {
        type: "literal",
        value: raw === "true",
        valueType: "boolean",
        span
      };
    }
    return {
      type: "literal",
      value: raw,
      valueType: "string",
      span
    };
  }
  function parseValueArgs(raw, base) {
    return new ValueArgsParser(raw, base).parse();
  }
  var ValueArgsParser = class {
    constructor(raw, base) {
      this.raw = raw;
      this.base = base;
    }
    diagnostics = [];
    index = 0;
    parse() {
      const args = [];
      while (this.index < this.raw.length) {
        this.skipWhitespace();
        if (this.index >= this.raw.length) {
          break;
        }
        if (this.raw[this.index] === "[") {
          args.push(this.parseList());
        } else if (this.raw[this.index] === '"') {
          args.push(this.parseQuoted());
        } else {
          args.push(this.parseScalar());
        }
      }
      return { args, diagnostics: this.diagnostics };
    }
    parseList() {
      const listStart = this.index;
      const items = [];
      let closed = false;
      let expectItem = true;
      let separatorBefore = false;
      this.index += 1;
      while (this.index < this.raw.length) {
        this.skipWhitespace();
        if (this.index >= this.raw.length) {
          break;
        }
        const char = this.raw[this.index];
        if (char === "]") {
          closed = true;
          if (items.length === 0) {
            this.pushDiagnostic("\u5217\u8868\u53C2\u6570\u4E0D\u80FD\u4E3A\u7A7A", listStart, this.index + 1);
          } else if (expectItem && separatorBefore) {
            this.pushDiagnostic("\u5217\u8868\u5206\u9694\u7B26\u540E\u7F3A\u5C11\u5143\u7D20", this.index, this.index + 1);
          }
          this.index += 1;
          break;
        }
        if (isArgumentSeparator(char)) {
          if (expectItem) {
            this.pushDiagnostic("\u5217\u8868\u5206\u9694\u7B26\u4E4B\u95F4\u7F3A\u5C11\u5143\u7D20", this.index, this.index + 1);
          }
          expectItem = true;
          separatorBefore = true;
          this.index += 1;
          continue;
        }
        if (!expectItem) {
          this.pushDiagnostic("\u5217\u8868\u5143\u7D20\u4E4B\u95F4\u5FC5\u987B\u4F7F\u7528 ',' \u6216 '\uFF0C' \u5206\u9694", this.index, this.index + 1);
        }
        if (char === "[") {
          items.push(this.parseList());
        } else if (char === '"') {
          items.push(this.parseQuoted());
        } else {
          items.push(this.parseListItem());
        }
        expectItem = false;
        separatorBefore = false;
      }
      if (!closed) {
        this.pushDiagnostic("\u5217\u8868\u53C2\u6570\u7F3A\u5C11\u53F3\u62EC\u53F7 ']'", listStart, this.raw.length);
        this.index = this.raw.length;
      }
      return {
        type: "list",
        items,
        span: spanFromRange(this.base, listStart, this.index)
      };
    }
    parseListItem() {
      const itemStart = this.index;
      while (this.index < this.raw.length && !/\s/u.test(this.raw[this.index]) && !isArgumentSeparator(this.raw[this.index]) && this.raw[this.index] !== "]") {
        this.index += 1;
      }
      if (itemStart === this.index) {
        this.index += 1;
      }
      return parseValueArgAst(
        this.raw.slice(itemStart, this.index),
        spanFromRange(this.base, itemStart, this.index)
      );
    }
    parseScalar() {
      const tokenStart = this.index;
      while (this.index < this.raw.length && !/\s/u.test(this.raw[this.index])) {
        this.index += 1;
      }
      return parseValueArgAst(
        this.raw.slice(tokenStart, this.index),
        spanFromRange(this.base, tokenStart, this.index)
      );
    }
    parseQuoted() {
      const tokenStart = this.index;
      this.index += 1;
      let escaped = false;
      let closed = false;
      while (this.index < this.raw.length) {
        const char = this.raw[this.index];
        this.index += 1;
        if (escaped) {
          escaped = false;
        } else if (char === "\\") {
          escaped = true;
        } else if (char === '"') {
          closed = true;
          break;
        }
      }
      if (!closed) {
        this.pushDiagnostic("\u5F15\u53F7\u5B57\u7B26\u4E32\u7F3A\u5C11\u7ED3\u675F\u5F15\u53F7", tokenStart, this.index);
      }
      return parseValueArgAst(
        this.raw.slice(tokenStart, this.index),
        spanFromRange(this.base, tokenStart, this.index)
      );
    }
    skipWhitespace() {
      while (this.index < this.raw.length && /\s/u.test(this.raw[this.index])) {
        this.index += 1;
      }
    }
    pushDiagnostic(message, start, end) {
      this.diagnostics.push({
        message,
        severity: "error",
        code: "syntax",
        span: spanFromRange(this.base, start, end)
      });
    }
  };

  // ../../packages/story-dsl-core/src/parser/expression.ts
  var BOUNDARY_CHARS = /* @__PURE__ */ new Set(["(", ")", "!", "<", ">", "=", "&", "|"]);
  function offsetPosition2(base, relativeOffset) {
    return {
      line: base.line,
      column: base.column + relativeOffset,
      offset: base.offset + relativeOffset
    };
  }
  function spanFromRange2(base, start, end) {
    return {
      start: offsetPosition2(base, start),
      end: offsetPosition2(base, end)
    };
  }
  function mergeSpans(start, end) {
    return {
      start: start.start,
      end: end.end
    };
  }
  function tokenize(text) {
    const tokens = [];
    let index = 0;
    while (index < text.length) {
      const char = text[index];
      if (/\s/u.test(char)) {
        index += 1;
        continue;
      }
      const nextTwo = text.slice(index, index + 2);
      if (nextTwo === "&&") {
        tokens.push({ type: "and", lexeme: "&&", start: index, end: index + 2 });
        index += 2;
        continue;
      }
      if (nextTwo === "||") {
        tokens.push({ type: "or", lexeme: "||", start: index, end: index + 2 });
        index += 2;
        continue;
      }
      if (nextTwo === "==") {
        tokens.push({ type: "eq", lexeme: "==", start: index, end: index + 2 });
        index += 2;
        continue;
      }
      if (nextTwo === "!=") {
        tokens.push({ type: "ne", lexeme: "!=", start: index, end: index + 2 });
        index += 2;
        continue;
      }
      if (nextTwo === ">=") {
        tokens.push({ type: "gte", lexeme: ">=", start: index, end: index + 2 });
        index += 2;
        continue;
      }
      if (nextTwo === "<=") {
        tokens.push({ type: "lte", lexeme: "<=", start: index, end: index + 2 });
        index += 2;
        continue;
      }
      if (char === "(") {
        tokens.push({ type: "lparen", lexeme: char, start: index, end: index + 1 });
        index += 1;
        continue;
      }
      if (char === ")") {
        tokens.push({ type: "rparen", lexeme: char, start: index, end: index + 1 });
        index += 1;
        continue;
      }
      if (char === "!") {
        tokens.push({ type: "not", lexeme: char, start: index, end: index + 1 });
        index += 1;
        continue;
      }
      if (char === ">") {
        tokens.push({ type: "gt", lexeme: char, start: index, end: index + 1 });
        index += 1;
        continue;
      }
      if (char === "<") {
        tokens.push({ type: "lt", lexeme: char, start: index, end: index + 1 });
        index += 1;
        continue;
      }
      if (char === "$") {
        let end2 = index + 1;
        while (end2 < text.length && !/\s/u.test(text[end2]) && !BOUNDARY_CHARS.has(text[end2])) {
          end2 += 1;
        }
        tokens.push({ type: "variable", lexeme: text.slice(index, end2), start: index, end: end2 });
        index = end2;
        continue;
      }
      if (/\d/u.test(char) || (char === "-" || char === "+") && /\d/u.test(text[index + 1] ?? "")) {
        let end2 = index + (char === "-" || char === "+" ? 2 : 1);
        while (end2 < text.length && /\d/u.test(text[end2])) {
          end2 += 1;
        }
        if (text[end2] === "." && /\d/u.test(text[end2 + 1] ?? "")) {
          end2 += 1;
          while (end2 < text.length && /\d/u.test(text[end2])) {
            end2 += 1;
          }
        }
        tokens.push({ type: "number", lexeme: text.slice(index, end2), start: index, end: end2 });
        index = end2;
        continue;
      }
      let end = index + 1;
      while (end < text.length && !/\s/u.test(text[end]) && !BOUNDARY_CHARS.has(text[end])) {
        end += 1;
      }
      const lexeme = text.slice(index, end);
      const type = lexeme === "and" ? "and" : lexeme === "or" ? "or" : lexeme === "not" ? "not" : "identifier";
      tokens.push({ type, lexeme, start: index, end });
      index = end;
    }
    tokens.push({ type: "eof", lexeme: "", start: text.length, end: text.length });
    return tokens;
  }
  var ExpressionParser = class {
    constructor(text, base, options) {
      this.text = text;
      this.base = base;
      this.options = options;
      this.tokens = tokenize(text);
    }
    tokens;
    diagnostics = [];
    index = 0;
    parse() {
      const expr = this.parseOr();
      if (this.peek().type !== "eof") {
        this.errorAtToken(this.peek(), "\u8868\u8FBE\u5F0F\u5B58\u5728\u65E0\u6CD5\u89E3\u6790\u7684\u5C3E\u968F\u5185\u5BB9");
      }
      return { expr, diagnostics: this.diagnostics };
    }
    parseOr() {
      let expr = this.parseAnd();
      while (this.match("or")) {
        const operatorToken = this.previous();
        const right = this.parseAnd();
        if (!expr || !right) {
          return expr ?? right;
        }
        expr = {
          type: "binary",
          operator: "or",
          rawOperator: operatorToken.lexeme,
          left: expr,
          right,
          span: mergeSpans(expr.span, right.span)
        };
      }
      return expr;
    }
    parseAnd() {
      let expr = this.parseNot();
      while (this.match("and")) {
        const operatorToken = this.previous();
        const right = this.parseNot();
        if (!expr || !right) {
          return expr ?? right;
        }
        expr = {
          type: "binary",
          operator: "and",
          rawOperator: operatorToken.lexeme,
          left: expr,
          right,
          span: mergeSpans(expr.span, right.span)
        };
      }
      return expr;
    }
    parseNot() {
      if (this.match("not")) {
        const operatorToken = this.previous();
        const operand = this.parseNot();
        if (!operand) {
          this.errorAtToken(operatorToken, "not \u540E\u7F3A\u5C11\u8868\u8FBE\u5F0F");
          return null;
        }
        return {
          type: "unary",
          operator: "not",
          rawOperator: operatorToken.lexeme,
          operand,
          span: mergeSpans(spanFromRange2(this.base, operatorToken.start, operatorToken.end), operand.span)
        };
      }
      return this.parseComparison();
    }
    parseComparison() {
      const left = this.parsePrimary();
      const operatorToken = this.peek();
      const operatorMap = {
        eq: "==",
        ne: "!=",
        gt: ">",
        gte: ">=",
        lt: "<",
        lte: "<="
      };
      const operator = operatorMap[operatorToken.type];
      if (!operator) {
        return left;
      }
      this.advance();
      const right = this.parsePrimary();
      if (!left || !right) {
        this.errorAtToken(operatorToken, "\u6BD4\u8F83\u8FD0\u7B97\u7B26\u4E24\u4FA7\u90FD\u5FC5\u987B\u6709\u8868\u8FBE\u5F0F");
        return left ?? right;
      }
      return {
        type: "comparison",
        operator,
        left,
        right,
        span: mergeSpans(left.span, right.span)
      };
    }
    parsePrimary() {
      const token = this.peek();
      if (this.match("lparen")) {
        const expr = this.parseOr();
        if (!this.match("rparen")) {
          this.errorAtToken(this.peek(), "\u7F3A\u5C11\u53F3\u62EC\u53F7 ')'");
        }
        return expr;
      }
      if (this.match("variable")) {
        const variableToken = this.previous();
        return {
          type: "variable",
          name: variableToken.lexeme.slice(1),
          span: spanFromRange2(this.base, variableToken.start, variableToken.end)
        };
      }
      if (this.match("number")) {
        const numberToken = this.previous();
        return {
          type: "literal",
          value: Number(numberToken.lexeme),
          valueType: "number",
          span: spanFromRange2(this.base, numberToken.start, numberToken.end)
        };
      }
      if (this.match("identifier")) {
        const identifierToken = this.previous();
        const args = [];
        let endToken = identifierToken;
        while (this.canConsumePredicateArgument()) {
          const argumentToken = this.advance();
          args.push(this.buildPredicateArgument(argumentToken));
          endToken = argumentToken;
        }
        if (args.length > 0 || this.options.zeroArgumentPredicates?.has(identifierToken.lexeme)) {
          return {
            type: "predicate",
            name: identifierToken.lexeme,
            args,
            span: spanFromRange2(this.base, identifierToken.start, endToken.end)
          };
        }
        return {
          type: "literal",
          value: identifierToken.lexeme === "true" ? true : identifierToken.lexeme === "false" ? false : identifierToken.lexeme,
          valueType: identifierToken.lexeme === "true" || identifierToken.lexeme === "false" ? "boolean" : "string",
          span: spanFromRange2(this.base, identifierToken.start, identifierToken.end)
        };
      }
      if (token.type !== "eof" && token.type !== "rparen") {
        this.errorAtToken(token, `\u65E0\u6CD5\u8BC6\u522B\u7684\u8868\u8FBE\u5F0F\u7247\u6BB5 '${token.lexeme}'`);
        this.advance();
      }
      return null;
    }
    canConsumePredicateArgument() {
      const token = this.peek();
      return token.type === "identifier" || token.type === "number" || token.type === "variable";
    }
    buildPredicateArgument(token) {
      return parseValueArgAst(token.lexeme, spanFromRange2(this.base, token.start, token.end));
    }
    match(type) {
      if (this.peek().type === type) {
        this.advance();
        return true;
      }
      return false;
    }
    advance() {
      const token = this.tokens[this.index];
      if (this.index < this.tokens.length - 1) {
        this.index += 1;
      }
      return token;
    }
    previous() {
      return this.tokens[Math.max(0, this.index - 1)];
    }
    peek() {
      return this.tokens[this.index];
    }
    errorAtToken(token, message) {
      this.diagnostics.push({
        message,
        severity: "error",
        code: "syntax",
        span: spanFromRange2(this.base, token.start, Math.max(token.end, token.start + 1))
      });
    }
  };
  function parseExpression(text, base, options = {}) {
    return new ExpressionParser(text, base, options).parse();
  }

  // ../../packages/story-dsl-core/src/parser/source-lines.ts
  var LineCursor = class {
    lines;
    index = 0;
    constructor(text) {
      this.lines = preprocessLines(text);
    }
    peek() {
      return this.lines[this.index];
    }
    peekNonBlank() {
      let cursor = this.index;
      while (cursor < this.lines.length) {
        const line = this.lines[cursor];
        if (!line.blank) {
          return line;
        }
        cursor += 1;
      }
      return void 0;
    }
    skipBlankLines() {
      while (this.peek()?.blank) {
        this.advance();
      }
    }
    advance() {
      this.index += 1;
    }
  };
  function position(line, column) {
    return {
      line: line.lineNumber,
      column,
      offset: line.lineStartOffset + column - 1
    };
  }
  function lineSpan(line, startColumn = 1, endColumn) {
    const end = endColumn ?? line.rawText.length + 1;
    return {
      start: position(line, startColumn),
      end: position(line, end)
    };
  }
  function mergeSpans2(start, end) {
    return {
      start: start.start,
      end: end.end
    };
  }
  function zeroSpan() {
    return {
      start: { line: 1, column: 1, offset: 0 },
      end: { line: 1, column: 1, offset: 0 }
    };
  }
  function isSegmentHeader(line) {
    return line.indentSpaces === 0 && line.trimmed.startsWith("#");
  }
  function isKeywordLine(line, keyword) {
    return line.trimmed === keyword || line.trimmed.startsWith(`${keyword} `);
  }
  function isBranchLine(line) {
    return line.trimmed.startsWith("-");
  }
  function findDialogueSeparator(text) {
    const firstWhitespace = text.search(/\s/u);
    const dialoguePrefixEnd = firstWhitespace === -1 ? text.length : firstWhitespace;
    const rawAsciiIndex = text.indexOf(":");
    const rawFullWidthIndex = text.indexOf("\uFF1A");
    const asciiIndex = rawAsciiIndex >= 0 && rawAsciiIndex <= dialoguePrefixEnd ? rawAsciiIndex : -1;
    const fullWidthIndex = rawFullWidthIndex >= 0 && rawFullWidthIndex <= dialoguePrefixEnd ? rawFullWidthIndex : -1;
    if (asciiIndex === -1 && fullWidthIndex === -1) {
      return null;
    }
    if (asciiIndex === -1) {
      return { marker: "\uFF1A", index: fullWidthIndex };
    }
    if (fullWidthIndex === -1) {
      return { marker: ":", index: asciiIndex };
    }
    return asciiIndex < fullWidthIndex ? { marker: ":", index: asciiIndex } : { marker: "\uFF1A", index: fullWidthIndex };
  }
  function preprocessLines(text) {
    const rawLines = text.split(/\r?\n/u);
    const lines = [];
    let offset = 0;
    rawLines.forEach((rawText, index) => {
      const withoutComment = stripComment(rawText);
      let indentSpaces = 0;
      while (indentSpaces < withoutComment.length && withoutComment[indentSpaces] === " ") {
        indentSpaces += 1;
      }
      const textWithoutIndent = withoutComment.slice(indentSpaces);
      const trimmed = textWithoutIndent.trimEnd();
      lines.push({
        lineNumber: index + 1,
        rawText,
        text: textWithoutIndent,
        trimmed,
        indentSpaces,
        indentLevel: Math.floor(indentSpaces / 2),
        blank: trimmed.trim().length === 0,
        lineStartOffset: offset
      });
      offset += rawText.length + 1;
    });
    return lines;
  }
  function stripComment(text) {
    let quoted = false;
    let escaped = false;
    for (let index = 0; index < text.length - 1; index += 1) {
      const char = text[index];
      if (quoted) {
        if (escaped) {
          escaped = false;
        } else if (char === "\\") {
          escaped = true;
        } else if (char === '"') {
          quoted = false;
        }
        continue;
      }
      if (char === '"') {
        quoted = true;
      } else if (char === "/" && text[index + 1] === "/") {
        return text.slice(0, index);
      }
    }
    return text;
  }

  // ../../packages/story-dsl-core/src/parser/battle.ts
  function parseBattleStatement(context, expectedIndent, parseStatements) {
    const headerLine = context.peek();
    const battleId = headerLine.trimmed.slice("battle".length).trim();
    if (!battleId) {
      context.report("battle \u4E4B\u540E\u5FC5\u987B\u63D0\u4F9B\u6218\u6597\u540D", lineSpan(headerLine), "syntax");
    }
    context.advance();
    const outcomes = [];
    const seenOutcomes = /* @__PURE__ */ new Set();
    while (true) {
      context.skipBlankLines();
      const line = context.peek();
      if (!line || line.indentLevel !== expectedIndent || !isBranchLine(line)) {
        break;
      }
      const rawOutcome = (/^-\s*(.*)$/u.exec(line.trimmed)?.[1] ?? "").trim();
      const outcomeSpan = lineSpan(line);
      context.advance();
      if (rawOutcome !== "win" && rawOutcome !== "lose" && rawOutcome !== "timeout") {
        context.report("battle \u5206\u652F\u53EA\u5141\u8BB8 win / lose / timeout", outcomeSpan, "semantic");
        parseStatements(
          expectedIndent + 1,
          (candidate) => candidate.indentLevel === expectedIndent && isBranchLine(candidate)
        );
        continue;
      }
      if (seenOutcomes.has(rawOutcome)) {
        context.report(`battle \u7ED3\u679C\u5206\u652F '${rawOutcome}' \u91CD\u590D`, outcomeSpan, "duplicate");
      }
      seenOutcomes.add(rawOutcome);
      const statements = parseStatements(
        expectedIndent + 1,
        (candidate) => candidate.indentLevel === expectedIndent && isBranchLine(candidate)
      );
      outcomes.push({
        type: "battleOutcome",
        outcome: rawOutcome,
        statements,
        span: statements.length > 0 ? mergeSpans2(outcomeSpan, statements[statements.length - 1].span) : outcomeSpan
      });
    }
    if (outcomes.length === 0) {
      context.report("battle \u81F3\u5C11\u9700\u8981\u4E00\u4E2A\u7ED3\u679C\u5206\u652F", lineSpan(headerLine), "structure");
    }
    return {
      type: "battle",
      battleId,
      outcomes,
      raw: headerLine.trimmed,
      span: outcomes.length > 0 ? mergeSpans2(lineSpan(headerLine), outcomes[outcomes.length - 1].span) : lineSpan(headerLine)
    };
  }

  // ../../packages/story-dsl-core/src/parser/condition-header.ts
  function parseConditionHeader(line, keyword, zeroArgumentPredicates2 = /* @__PURE__ */ new Set()) {
    const rawCondition = line.trimmed.slice(keyword.length).trim();
    if (!rawCondition) {
      return {
        condition: null,
        rawCondition,
        diagnostics: [
          {
            message: `${keyword} \u540E\u7F3A\u5C11\u6761\u4EF6\u8868\u8FBE\u5F0F`,
            span: lineSpan(line),
            code: "syntax",
            severity: "error"
          }
        ]
      };
    }
    const startColumn = line.indentSpaces + 1 + line.text.indexOf(rawCondition);
    const result = parseExpression(rawCondition, position(line, startColumn + 1), { zeroArgumentPredicates: zeroArgumentPredicates2 });
    return {
      condition: result.expr,
      rawCondition,
      diagnostics: result.diagnostics
    };
  }

  // ../../packages/story-dsl-core/src/parser/presentation-style.ts
  var STYLE_ID_PATTERN = /^[\p{L}\p{N}_.-]+$/u;
  function parsePresentationStyle(context, line, content, contentStartColumn) {
    let remaining = content;
    let consumed = 0;
    let style = null;
    while (remaining.startsWith("[#")) {
      const closingIndex = remaining.indexOf("]");
      if (closingIndex < 0) {
        context.report(
          "\u5C55\u793A\u6837\u5F0F\u6807\u7B7E\u7F3A\u5C11\u53F3\u65B9\u62EC\u53F7 ']'",
          lineSpan(line, contentStartColumn + consumed),
          "syntax"
        );
        return { text: "", style };
      }
      const tagText = remaining.slice(0, closingIndex + 1);
      const tagSpan = lineSpan(
        line,
        contentStartColumn + consumed,
        contentStartColumn + consumed + tagText.length
      );
      const body = tagText.slice(2, -1).trim();
      const equalsIndex = body.indexOf("=");
      if (equalsIndex < 0) {
        context.report("\u5C55\u793A\u6807\u7B7E\u5FC5\u987B\u4F7F\u7528 '[#key=value]' \u683C\u5F0F", tagSpan, "syntax");
      } else {
        const key = body.slice(0, equalsIndex).trim();
        const value = body.slice(equalsIndex + 1).trim();
        if (key !== "style") {
          context.report(`\u6682\u4E0D\u652F\u6301\u5C55\u793A\u6807\u7B7E '${key || "\u7A7A"}'`, tagSpan, "semantic");
        } else if (!value) {
          context.report("style \u6807\u7B7E\u5FC5\u987B\u63D0\u4F9B\u6837\u5F0F ID", tagSpan, "syntax");
        } else if (!STYLE_ID_PATTERN.test(value)) {
          context.report("\u6837\u5F0F ID \u53EA\u80FD\u5305\u542B\u4E2D\u82F1\u6587\u3001\u6570\u5B57\u3001\u70B9\u3001\u4E0B\u5212\u7EBF\u548C\u77ED\u6A2A\u7EBF\uFF0C\u4E14\u4E0D\u80FD\u5305\u542B\u7A7A\u767D", tagSpan, "syntax");
        } else if (style !== null) {
          context.report("\u540C\u4E00\u6761\u8BED\u53E5\u53EA\u80FD\u914D\u7F6E\u4E00\u4E2A style \u6807\u7B7E", tagSpan, "semantic");
        } else {
          style = value;
        }
      }
      consumed += tagText.length;
      remaining = remaining.slice(tagText.length);
      const whitespaceLength = /^\s*/u.exec(remaining)?.[0].length ?? 0;
      consumed += whitespaceLength;
      remaining = remaining.slice(whitespaceLength);
    }
    const misplacedTagIndex = remaining.indexOf("[#");
    if (misplacedTagIndex >= 0) {
      const closingIndex = remaining.indexOf("]", misplacedTagIndex);
      const endOffset = closingIndex >= 0 ? closingIndex + 1 : remaining.length;
      context.report(
        "\u5C55\u793A\u6807\u7B7E\u53EA\u80FD\u51FA\u73B0\u5728\u5BF9\u767D\u6B63\u6587\u5F00\u5934",
        lineSpan(
          line,
          contentStartColumn + consumed + misplacedTagIndex,
          contentStartColumn + consumed + endOffset
        ),
        "structure"
      );
    }
    return { text: remaining.trim(), style };
  }
  function reportOptionPresentationStyle(context, line, optionText) {
    const tagIndex = optionText.indexOf("[#");
    if (tagIndex < 0) {
      return;
    }
    const sourceIndex = line.trimmed.indexOf("[#", 1);
    const startColumn = line.indentSpaces + Math.max(sourceIndex, 0) + 1;
    const closingIndex = line.trimmed.indexOf("]", Math.max(sourceIndex, 0));
    context.report(
      "\u9009\u9879\u6682\u4E0D\u652F\u6301\u5C55\u793A\u6837\u5F0F\u6807\u7B7E\uFF1Bstyle \u53EA\u80FD\u914D\u7F6E\u5728 choice \u7684\u63D0\u793A\u5BF9\u767D\u4E0A",
      lineSpan(line, startColumn, closingIndex >= 0 ? line.indentSpaces + closingIndex + 2 : void 0),
      "structure"
    );
  }

  // ../../packages/story-dsl-core/src/parser/choice.ts
  function parseChoiceStatement(context, prompt, expectedIndent, parseStatements) {
    const groups = [];
    while (true) {
      context.skipBlankLines();
      const line = context.peek();
      if (!line || line.indentLevel !== expectedIndent) {
        break;
      }
      if (isBranchLine(line)) {
        const options = parseChoiceOptions(context, expectedIndent, parseStatements);
        groups.push({
          type: "choiceOptionGroup",
          condition: null,
          rawCondition: null,
          options,
          span: mergeSpans2(options[0].span, options[options.length - 1].span)
        });
        continue;
      }
      if (isKeywordLine(line, "when")) {
        groups.push(parseConditionalChoiceGroup(context, expectedIndent, parseStatements));
        continue;
      }
      break;
    }
    if (groups.length === 0) {
      context.report("choice \u81F3\u5C11\u9700\u8981\u4E00\u4E2A '- \u9009\u9879' \u5206\u652F", prompt.span, "structure");
    }
    if (groups.length > 0 && groups.every((group) => group.condition !== null)) {
      context.report("choice \u5168\u90E8\u4E3A\u6761\u4EF6\u7EC4\u9009\u9879\uFF0C\u8FD0\u884C\u65F6\u53EF\u80FD\u6CA1\u6709\u53EF\u7528\u9009\u9879", prompt.span, "semantic", "warning");
    }
    return {
      type: "choice",
      style: prompt.style,
      prompt: { ...prompt, style: null },
      groups,
      span: groups.length > 0 ? mergeSpans2(prompt.span, groups[groups.length - 1].span) : prompt.span
    };
  }
  function parseChoiceOptions(context, optionIndent, parseStatements) {
    const options = [];
    while (true) {
      context.skipBlankLines();
      const line = context.peek();
      if (!line || line.indentLevel !== optionIndent || !isBranchLine(line)) {
        break;
      }
      options.push(parseChoiceOption(context, optionIndent, parseStatements));
    }
    return options;
  }
  function parseChoiceOption(context, optionIndent, parseStatements) {
    const line = context.peek();
    const optionText = /^-\s*(.*)$/u.exec(line.trimmed)?.[1] ?? "";
    reportOptionPresentationStyle(context, line, optionText);
    const optionSpan = lineSpan(line);
    context.advance();
    const statements = parseStatements(
      optionIndent + 1,
      (candidate) => candidate.indentLevel === optionIndent && isBranchLine(candidate)
    );
    return {
      type: "choiceOption",
      text: optionText,
      statements,
      span: statements.length > 0 ? mergeSpans2(optionSpan, statements[statements.length - 1].span) : optionSpan
    };
  }
  function parseConditionalChoiceGroup(context, expectedIndent, parseStatements) {
    const whenLine = context.peek();
    const parsedCondition = parseConditionHeader(whenLine, "when", context.zeroArgumentPredicates);
    context.addDiagnostics(parsedCondition.diagnostics);
    context.advance();
    const optionIndent = expectedIndent + 1;
    const options = [];
    while (true) {
      context.skipBlankLines();
      const line = context.peek();
      if (!line || line.indentLevel <= expectedIndent) {
        break;
      }
      if (line.indentLevel === optionIndent && isBranchLine(line)) {
        options.push(parseChoiceOption(context, optionIndent, parseStatements));
        continue;
      }
      if (line.indentLevel === optionIndent && isKeywordLine(line, "when")) {
        context.report("when \u6761\u4EF6\u7EC4\u4E0D\u5141\u8BB8\u5D4C\u5957", lineSpan(line), "structure");
      } else if (line.indentLevel === optionIndent) {
        context.report("when \u6761\u4EF6\u7EC4\u53EA\u80FD\u5305\u542B '- \u9009\u9879'", lineSpan(line), "structure");
      } else {
        context.report("when \u6761\u4EF6\u7EC4\u4E2D\u51FA\u73B0\u4E86\u610F\u5916\u7684\u7F29\u8FDB\u5C42\u7EA7", lineSpan(line), "indentation");
      }
      context.advance();
    }
    if (options.length === 0) {
      context.report("when \u6761\u4EF6\u7EC4\u81F3\u5C11\u9700\u8981\u4E00\u4E2A\u7F29\u8FDB\u7684 '- \u9009\u9879'", lineSpan(whenLine), "structure");
    }
    return {
      type: "choiceOptionGroup",
      condition: parsedCondition.condition,
      rawCondition: parsedCondition.rawCondition,
      options,
      span: options.length > 0 ? mergeSpans2(lineSpan(whenLine), options[options.length - 1].span) : lineSpan(whenLine)
    };
  }

  // ../../packages/story-dsl-core/src/parser/conditional.ts
  function parseIfStatement(context, expectedIndent, parseStatements) {
    const branches = [];
    const startLine = context.peek();
    while (true) {
      context.skipBlankLines();
      const line = context.peek();
      if (!line || line.indentLevel !== expectedIndent) {
        break;
      }
      const keyword = readConditionalKeyword(line);
      if (!keyword) {
        break;
      }
      if (branches.length === 0 && keyword !== "if") {
        context.report("\u6761\u4EF6\u5206\u652F\u5FC5\u987B\u4ECE if \u5F00\u59CB", lineSpan(line), "structure");
      }
      if (branches.some((branch) => branch.keyword === "else")) {
        context.report("else \u5FC5\u987B\u662F\u6761\u4EF6\u5206\u652F\u7684\u6700\u540E\u4E00\u9879", lineSpan(line), "structure");
      }
      const rest = line.trimmed.slice(keyword.length).trim();
      let condition = null;
      let rawCondition = null;
      if (keyword === "else") {
        if (rest.length > 0) {
          context.report("else \u540E\u4E0D\u80FD\u518D\u8DDF\u6761\u4EF6\u8868\u8FBE\u5F0F", lineSpan(line), "syntax");
        }
      } else {
        const parsedCondition = parseConditionHeader(line, keyword, context.zeroArgumentPredicates);
        condition = parsedCondition.condition;
        rawCondition = parsedCondition.rawCondition;
        context.addDiagnostics(parsedCondition.diagnostics);
      }
      context.advance();
      const statements = parseStatements(
        expectedIndent + 1,
        (candidate) => candidate.indentLevel === expectedIndent && (isKeywordLine(candidate, "elif") || isKeywordLine(candidate, "else"))
      );
      branches.push({
        type: "conditionalBranch",
        keyword,
        condition,
        rawCondition,
        statements,
        span: statements.length > 0 ? mergeSpans2(lineSpan(line), statements[statements.length - 1].span) : lineSpan(line)
      });
      const nextLine = context.peekNonBlank();
      if (!nextLine || nextLine.indentLevel !== expectedIndent) {
        break;
      }
      if (!isKeywordLine(nextLine, "elif") && !isKeywordLine(nextLine, "else")) {
        break;
      }
    }
    return {
      type: "if",
      branches,
      span: branches.length > 0 ? mergeSpans2(lineSpan(startLine), branches[branches.length - 1].span) : lineSpan(startLine)
    };
  }
  function readConditionalKeyword(line) {
    if (isKeywordLine(line, "if")) {
      return "if";
    }
    if (isKeywordLine(line, "elif")) {
      return "elif";
    }
    if (isKeywordLine(line, "else")) {
      return "else";
    }
    return null;
  }

  // ../../packages/story-dsl-core/src/parser/parser-context.ts
  var ParserContext = class extends LineCursor {
    diagnostics = [];
    zeroArgumentPredicates;
    constructor(text, zeroArgumentPredicates2 = []) {
      super(text);
      this.zeroArgumentPredicates = new Set(zeroArgumentPredicates2);
    }
    report(message, span, code, severity = "error") {
      this.diagnostics.push({
        message,
        span,
        code,
        severity
      });
    }
    addDiagnostics(diagnostics) {
      this.diagnostics.push(...diagnostics);
    }
  };

  // ../../packages/story-dsl-core/src/parser/parser.ts
  var RESERVED_COMMAND_NAMES = /* @__PURE__ */ new Set([
    "if",
    "elif",
    "else",
    "battle",
    "call",
    "return",
    "when",
    "and",
    "or",
    "not",
    "win",
    "lose",
    "timeout"
  ]);
  var StoryParser = class {
    context;
    constructor(text, options = {}) {
      this.context = new ParserContext(text, options.zeroArgumentPredicates);
      this.validateIndentation();
    }
    parse() {
      const segments = [];
      const seenSegments = /* @__PURE__ */ new Map();
      while (true) {
        this.context.skipBlankLines();
        const line = this.context.peek();
        if (!line) {
          break;
        }
        if (!isSegmentHeader(line)) {
          this.context.report("\u5267\u60C5\u6BB5\u5FC5\u987B\u4EE5\u9876\u683C '# \u6BB5\u540D' \u5F00\u59CB", lineSpan(line), "structure");
          this.context.advance();
          continue;
        }
        const segment = this.parseSegment();
        if (segment) {
          if (seenSegments.has(segment.name)) {
            this.context.report(`\u91CD\u590D\u7684\u5267\u60C5\u6BB5\u540D '${segment.name}'`, segment.headerSpan, "duplicate");
          } else {
            seenSegments.set(segment.name, segment.headerSpan);
          }
          segments.push(segment);
        }
      }
      return {
        ast: {
          type: "script",
          span: segments.length > 0 ? mergeSpans2(segments[0].span, segments[segments.length - 1].span) : zeroSpan(),
          segments
        },
        diagnostics: this.context.diagnostics
      };
    }
    validateIndentation() {
      for (const line of this.context.lines) {
        if (line.rawText.includes("	")) {
          this.context.report("\u7981\u6B62\u4F7F\u7528 Tab \u7F29\u8FDB\uFF0C\u8BF7\u7EDF\u4E00\u4F7F\u7528 2 \u4E2A\u7A7A\u683C", lineSpan(line), "indentation");
        }
        if (line.indentSpaces % 2 !== 0) {
          this.context.report("\u7F29\u8FDB\u5FC5\u987B\u662F 2 \u4E2A\u7A7A\u683C\u7684\u6574\u6570\u500D", lineSpan(line), "indentation");
        }
      }
    }
    parseSegment() {
      const headerLine = this.context.peek();
      if (!headerLine) {
        return null;
      }
      const rawName = headerLine.trimmed.slice(1);
      const name = rawName.trim();
      if (!name) {
        this.context.report("\u5267\u60C5\u6BB5\u540D\u4E0D\u80FD\u4E3A\u7A7A", lineSpan(headerLine), "syntax");
      }
      this.context.advance();
      const statements = this.parseStatements(0, (line) => isSegmentHeader(line));
      const endSpan = statements.length > 0 ? statements[statements.length - 1].span : lineSpan(headerLine);
      return {
        type: "segment",
        name,
        rawName,
        headerSpan: lineSpan(headerLine),
        span: mergeSpans2(lineSpan(headerLine), endSpan),
        statements
      };
    }
    parseStatements(expectedIndent, shouldStop) {
      const statements = [];
      while (true) {
        this.context.skipBlankLines();
        const line = this.context.peek();
        if (!line) {
          break;
        }
        if (shouldStop(line)) {
          break;
        }
        if (line.indentLevel < expectedIndent) {
          break;
        }
        if (line.indentLevel > expectedIndent) {
          this.context.report("\u51FA\u73B0\u4E86\u610F\u5916\u7684\u7F29\u8FDB\u5C42\u7EA7", lineSpan(line), "indentation");
          this.context.advance();
          continue;
        }
        const statement = this.parseStatement(expectedIndent);
        if (statement) {
          statements.push(statement);
        }
      }
      return statements;
    }
    parseStatement(expectedIndent) {
      const line = this.context.peek();
      if (!line) {
        return null;
      }
      if (isKeywordLine(line, "elif") || isKeywordLine(line, "else")) {
        this.context.report("elif/else \u5FC5\u987B\u7D27\u8DDF\u5728\u540C\u7EA7 if \u4E4B\u540E", lineSpan(line), "structure");
        this.context.advance();
        return null;
      }
      if (isKeywordLine(line, "if")) {
        return parseIfStatement(
          this.context,
          expectedIndent,
          (indent, shouldStop) => this.parseStatements(indent, shouldStop)
        );
      }
      if (isKeywordLine(line, "when")) {
        this.context.report("when \u53EA\u80FD\u4F5C\u4E3A choice \u7684\u6761\u4EF6\u7EC4\u9009\u9879\u51FA\u73B0", lineSpan(line), "structure");
        this.context.advance();
        return null;
      }
      if (isKeywordLine(line, "battle")) {
        return parseBattleStatement(
          this.context,
          expectedIndent,
          (indent, shouldStop) => this.parseStatements(indent, shouldStop)
        );
      }
      if (isBranchLine(line)) {
        this.context.report("'- xxx' \u53EA\u80FD\u4F5C\u4E3A choice \u6216 battle \u7684\u5B50\u7ED3\u6784\u51FA\u73B0", lineSpan(line), "structure");
        this.context.advance();
        return null;
      }
      const simpleStatement = this.parseSimpleStatement(line);
      this.context.advance();
      if (simpleStatement?.type === "dialogue") {
        const nextLine = this.context.peekNonBlank();
        if (nextLine && nextLine.indentLevel === expectedIndent && (isBranchLine(nextLine) || isKeywordLine(nextLine, "when"))) {
          return parseChoiceStatement(
            this.context,
            simpleStatement,
            expectedIndent,
            (indent, shouldStop) => this.parseStatements(indent, shouldStop)
          );
        }
      }
      return simpleStatement;
    }
    parseSimpleStatement(line) {
      const dialogueSeparator = findDialogueSeparator(line.trimmed);
      if (dialogueSeparator) {
        const rawContent = line.trimmed.slice(dialogueSeparator.index + 1);
        const leadingWhitespace = /^\s*/u.exec(rawContent)?.[0].length ?? 0;
        const parsedContent = parsePresentationStyle(
          this.context,
          line,
          rawContent.slice(leadingWhitespace),
          line.indentSpaces + dialogueSeparator.index + 2 + leadingWhitespace
        );
        return {
          type: "dialogue",
          speaker: line.trimmed.slice(0, dialogueSeparator.index).trim(),
          text: parsedContent.text,
          style: parsedContent.style,
          marker: dialogueSeparator.marker,
          raw: line.trimmed,
          span: lineSpan(line)
        };
      }
      const commandMatch = /^(\S+)(?:\s+(.*))?$/u.exec(line.trimmed);
      if (!commandMatch) {
        return null;
      }
      const name = commandMatch[1];
      if (name === "jump") {
        const target = line.trimmed.slice(name.length).trim();
        if (!target) {
          this.context.report("jump \u4E4B\u540E\u5FC5\u987B\u63D0\u4F9B\u76EE\u6807\u6BB5\u540D", lineSpan(line), "syntax");
        }
        return {
          type: "jump",
          target,
          raw: line.trimmed,
          span: lineSpan(line)
        };
      }
      if (name === "call") {
        const target = line.trimmed.slice(name.length).trim();
        if (!target) {
          this.context.report("call \u4E4B\u540E\u5FC5\u987B\u63D0\u4F9B\u76EE\u6807\u6BB5\u540D", lineSpan(line), "syntax");
        }
        return {
          type: "call",
          target,
          raw: line.trimmed,
          span: lineSpan(line)
        };
      }
      if (name === "return") {
        const rest = line.trimmed.slice(name.length).trim();
        if (rest) {
          this.context.report("return \u540E\u4E0D\u80FD\u8DDF\u53C2\u6570", lineSpan(line), "syntax");
        }
        return {
          type: "return",
          raw: line.trimmed,
          span: lineSpan(line)
        };
      }
      if (RESERVED_COMMAND_NAMES.has(name)) {
        this.context.report(`'${name}' \u662F\u4FDD\u7559\u5B57\uFF0C\u4E0D\u80FD\u4F5C\u4E3A\u547D\u4EE4\u540D`, lineSpan(line), "semantic");
      }
      const argsText = commandMatch[2] ?? "";
      const argsStartColumnInTrimmed = argsText ? line.trimmed.indexOf(argsText, name.length) + 1 : name.length + 1;
      const parsedArgs = parseValueArgs(argsText, position(line, line.indentSpaces + argsStartColumnInTrimmed));
      this.context.addDiagnostics(parsedArgs.diagnostics);
      return {
        type: "command",
        name,
        args: parsedArgs.args,
        raw: line.trimmed,
        span: lineSpan(line)
      };
    }
  };
  function parseStory(text, options = {}) {
    return new StoryParser(text, options).parse();
  }

  // frontend/story-dsl-browser.ts
  var zeroArgumentPredicates = /* @__PURE__ */ new Set();
  function configureRuntimeContract(contract) {
    zeroArgumentPredicates = new Set(
      (contract?.predicates ?? []).filter((predicate) => predicate.minimumArguments === 0).flatMap((predicate) => [predicate.name, ...predicate.aliases ?? []])
    );
  }
  function parseStory2(text) {
    return parseStory(text, { zeroArgumentPredicates });
  }
  function analyzeStory(text) {
    const parseResult = parseStory2(text);
    const compileResult = compileScript(parseResult.ast);
    const diagnostics = [...parseResult.diagnostics, ...compileResult.diagnostics];
    const hasErrors = diagnostics.some((item) => item.severity === "error");
    return {
      ast: parseResult.ast,
      diagnostics,
      ir: hasErrors ? null : compileResult.ir,
      jsonText: hasErrors ? null : `${JSON.stringify(compileResult.ir, null, 2)}
`
    };
  }
  var storyDsl = {
    analyzeStory,
    parseStory: parseStory2,
    compileScript,
    decompileStoryJson,
    configureRuntimeContract
  };
  window.StoryDsl = storyDsl;
})();
