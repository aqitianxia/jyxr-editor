(function () {
  const numberPattern = /^[+-]?\d+(?:\.\d+)?$/u;
  const reservedCommandNames = new Set(["if", "elif", "else", "battle", "and", "or", "not", "win", "lose", "timeout"]);

  function analyzeStory(text) {
    const parseResult = parseStory(text);
    const compileResult = compileScript(parseResult.ast);
    const diagnostics = [...parseResult.diagnostics, ...compileResult.diagnostics];
    const hasErrors = diagnostics.some((item) => item.severity === "error");
    return {
      ast: parseResult.ast,
      diagnostics,
      ir: hasErrors ? null : compileResult.ir,
      jsonText: hasErrors ? null : `${JSON.stringify(compileResult.ir, null, 2)}\n`,
    };
  }

  function parseStory(text) {
    const parser = new StoryParser(text);
    return parser.parse();
  }

  class StoryParser {
    constructor(text) {
      this.text = text;
      this.lines = preprocessLines(text);
      this.diagnostics = [];
      this.index = 0;
      this.validateIndentation();
    }

    parse() {
      const segments = [];
      const seenSegments = new Map();
      while (true) {
        this.skipBlankLines();
        const line = this.peek();
        if (!line) {
          break;
        }

        if (!isSegmentHeader(line)) {
          this.pushDiagnostic("剧情段必须以顶格 '# 段名' 开始", lineSpan(line), "structure");
          this.index += 1;
          continue;
        }

        const segment = this.parseSegment();
        if (segment) {
          if (seenSegments.has(segment.name)) {
            this.pushDiagnostic(`重复的剧情段名 '${segment.name}'`, segment.headerSpan, "duplicate");
          } else {
            seenSegments.set(segment.name, segment.headerSpan);
          }
          segments.push(segment);
        }
      }

      return {
        ast: {
          type: "script",
          span: segments.length > 0 ? mergeSpans(segments[0].span, segments[segments.length - 1].span) : zeroSpan(),
          segments,
        },
        diagnostics: this.diagnostics,
      };
    }

    validateIndentation() {
      for (const line of this.lines) {
        if (line.rawText.includes("\t")) {
          this.pushDiagnostic("禁止使用 Tab 缩进，请统一使用 2 个空格", lineSpan(line), "indentation");
        }
        if (line.indentSpaces % 2 !== 0) {
          this.pushDiagnostic("缩进必须是 2 个空格的整数倍", lineSpan(line), "indentation");
        }
      }
    }

    parseSegment() {
      const headerLine = this.peek();
      if (!headerLine) {
        return null;
      }

      const rawName = headerLine.trimmed.slice(1);
      const name = rawName.trim();
      if (!name) {
        this.pushDiagnostic("剧情段名不能为空", lineSpan(headerLine), "syntax");
      }

      this.index += 1;
      const statements = this.parseStatements(0, (line) => isSegmentHeader(line));
      const endSpan = statements.length > 0 ? statements[statements.length - 1].span : lineSpan(headerLine);
      return {
        type: "segment",
        name,
        rawName,
        headerSpan: lineSpan(headerLine),
        span: mergeSpans(lineSpan(headerLine), endSpan),
        statements,
      };
    }

    parseStatements(expectedIndent, shouldStop) {
      const statements = [];
      while (true) {
        this.skipBlankLines();
        const line = this.peek();
        if (!line || shouldStop(line) || line.indentLevel < expectedIndent) {
          break;
        }
        if (line.indentLevel > expectedIndent) {
          this.pushDiagnostic("出现了意外的缩进层级", lineSpan(line), "indentation");
          this.index += 1;
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
      const line = this.peek();
      if (!line) {
        return null;
      }

      if (isKeywordLine(line, "elif") || isKeywordLine(line, "else")) {
        this.pushDiagnostic("elif/else 必须紧跟在同级 if 之后", lineSpan(line), "structure");
        this.index += 1;
        return null;
      }

      if (isKeywordLine(line, "if")) {
        return this.parseIfStatement(expectedIndent);
      }

      if (isKeywordLine(line, "battle")) {
        return this.parseBattleStatement(expectedIndent);
      }

      if (isBranchLine(line)) {
        this.pushDiagnostic("'- xxx' 只能作为 choice 或 battle 的子结构出现", lineSpan(line), "structure");
        this.index += 1;
        return null;
      }

      const simpleStatement = this.parseSimpleStatement(line);
      this.index += 1;
      if (simpleStatement?.type === "dialogue") {
        const nextLine = this.peekNonBlank();
        if (nextLine && nextLine.indentLevel === expectedIndent && isBranchLine(nextLine)) {
          return this.parseChoiceStatement(simpleStatement, expectedIndent);
        }
      }

      return simpleStatement;
    }

    parseSimpleStatement(line) {
      const dialogueSeparator = findDialogueSeparator(line.trimmed);
      if (dialogueSeparator) {
        return {
          type: "dialogue",
          speaker: line.trimmed.slice(0, dialogueSeparator.index).trim(),
          text: line.trimmed.slice(dialogueSeparator.index + 1).trim(),
          span: lineSpan(line),
        };
      }

      const parts = splitCommandParts(line.trimmed);
      if (parts.length === 0) {
        return null;
      }

      const name = parts[0];
      if (name === "jump") {
        const target = line.trimmed.slice(name.length).trim();
        if (!target) {
          this.pushDiagnostic("jump 之后必须提供目标段名", lineSpan(line), "syntax");
        }
        return {
          type: "jump",
          target,
          span: lineSpan(line),
        };
      }

      if (reservedCommandNames.has(name)) {
        this.pushDiagnostic(`'${name}' 是保留字，不能作为命令名`, lineSpan(line), "semantic");
      }

      return {
        type: "command",
        name,
        args: parts.slice(1).map((part) => parseValueArg(part, lineSpan(line))),
        span: lineSpan(line),
      };
    }

    parseChoiceStatement(prompt, expectedIndent) {
      const options = [];
      while (true) {
        this.skipBlankLines();
        const line = this.peek();
        if (!line || line.indentLevel !== expectedIndent || !isBranchLine(line)) {
          break;
        }

        const optionText = /^-\s*(.*)$/u.exec(line.trimmed)?.[1] ?? "";
        const optionSpan = lineSpan(line);
        this.index += 1;
        const statements = this.parseStatements(
          expectedIndent + 1,
          (candidate) => candidate.indentLevel === expectedIndent && isBranchLine(candidate),
        );
        options.push({
          type: "choiceOption",
          text: optionText,
          statements,
          span: statements.length > 0 ? mergeSpans(optionSpan, statements[statements.length - 1].span) : optionSpan,
        });
      }

      if (options.length === 0) {
        this.pushDiagnostic("choice 至少需要一个 '- 选项' 分支", prompt.span, "structure");
      }

      return {
        type: "choice",
        prompt,
        options,
        span: options.length > 0 ? mergeSpans(prompt.span, options[options.length - 1].span) : prompt.span,
      };
    }

    parseBattleStatement(expectedIndent) {
      const headerLine = this.peek();
      const battleId = headerLine.trimmed.slice("battle".length).trim();
      if (!battleId) {
        this.pushDiagnostic("battle 之后必须提供战斗名", lineSpan(headerLine), "syntax");
      }
      this.index += 1;

      const outcomes = [];
      const seenOutcomes = new Set();
      while (true) {
        this.skipBlankLines();
        const line = this.peek();
        if (!line || line.indentLevel !== expectedIndent || !isBranchLine(line)) {
          break;
        }

        const rawOutcome = (/^-\s*(.*)$/u.exec(line.trimmed)?.[1] ?? "").trim();
        const outcomeSpan = lineSpan(line);
        this.index += 1;
        if (rawOutcome !== "win" && rawOutcome !== "lose" && rawOutcome !== "timeout") {
          this.pushDiagnostic("battle 分支只允许 win / lose / timeout", outcomeSpan, "semantic");
          this.parseStatements(
            expectedIndent + 1,
            (candidate) => candidate.indentLevel === expectedIndent && isBranchLine(candidate),
          );
          continue;
        }

        if (seenOutcomes.has(rawOutcome)) {
          this.pushDiagnostic(`battle 结果分支 '${rawOutcome}' 重复`, outcomeSpan, "duplicate");
        }
        seenOutcomes.add(rawOutcome);

        const statements = this.parseStatements(
          expectedIndent + 1,
          (candidate) => candidate.indentLevel === expectedIndent && isBranchLine(candidate),
        );
        outcomes.push({
          type: "battleOutcome",
          outcome: rawOutcome,
          statements,
          span: statements.length > 0 ? mergeSpans(outcomeSpan, statements[statements.length - 1].span) : outcomeSpan,
        });
      }

      if (outcomes.length === 0) {
        this.pushDiagnostic("battle 至少需要一个结果分支", lineSpan(headerLine), "structure");
      }

      return {
        type: "battle",
        battleId,
        outcomes,
        span: outcomes.length > 0 ? mergeSpans(lineSpan(headerLine), outcomes[outcomes.length - 1].span) : lineSpan(headerLine),
      };
    }

    parseIfStatement(expectedIndent) {
      const branches = [];
      const startLine = this.peek();
      while (true) {
        this.skipBlankLines();
        const line = this.peek();
        if (!line || line.indentLevel !== expectedIndent) {
          break;
        }

        const keyword = readConditionalKeyword(line);
        if (!keyword) {
          break;
        }
        if (branches.length === 0 && keyword !== "if") {
          this.pushDiagnostic("条件分支必须从 if 开始", lineSpan(line), "structure");
        }
        if (branches.some((branch) => branch.keyword === "else")) {
          this.pushDiagnostic("else 必须是条件分支的最后一项", lineSpan(line), "structure");
        }

        const rest = line.trimmed.slice(keyword.length).trim();
        let condition = null;
        let rawCondition = null;
        if (keyword === "else") {
          if (rest.length > 0) {
            this.pushDiagnostic("else 后不能再跟条件表达式", lineSpan(line), "syntax");
          }
        } else {
          rawCondition = rest;
          if (!rawCondition) {
            this.pushDiagnostic(`${keyword} 后缺少条件表达式`, lineSpan(line), "syntax");
          } else {
            const expressionResult = parseExpression(rawCondition, lineSpan(line));
            condition = expressionResult.expr;
            this.diagnostics.push(...expressionResult.diagnostics);
          }
        }

        this.index += 1;
        const statements = this.parseStatements(
          expectedIndent + 1,
          (candidate) =>
            candidate.indentLevel === expectedIndent &&
            (isKeywordLine(candidate, "elif") || isKeywordLine(candidate, "else")),
        );
        branches.push({
          type: "conditionalBranch",
          keyword,
          condition,
          rawCondition,
          statements,
          span: statements.length > 0 ? mergeSpans(lineSpan(line), statements[statements.length - 1].span) : lineSpan(line),
        });

        const nextLine = this.peekNonBlank();
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
        span: branches.length > 0 ? mergeSpans(lineSpan(startLine), branches[branches.length - 1].span) : lineSpan(startLine),
      };
    }

    skipBlankLines() {
      while (this.peek()?.blank) {
        this.index += 1;
      }
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
      return undefined;
    }

    pushDiagnostic(message, span, code) {
      this.diagnostics.push({ message, span, code, severity: "error" });
    }
  }

  function compileScript(ast) {
    const diagnostics = [];
    const segments = ast.segments.map((segment) => ({
      name: segment.name,
      steps: compileSteps(segment.statements, segment.name, diagnostics),
    }));
    return { ir: { version: 1, segments }, diagnostics };
  }

  function compileSteps(statements, segmentName, diagnostics) {
    const steps = [];
    let terminated = false;
    for (const statement of statements) {
      if (terminated) {
        diagnostics.push({
          message: "jump 之后的同级语句不可达，已跳过 IR 输出",
          span: statement.span,
          severity: "error",
          code: "unreachable",
        });
        continue;
      }

      const step = compileStatement(statement, segmentName, diagnostics);
      if (step) {
        steps.push(step);
        if (step.kind === "jump") {
          terminated = true;
        }
      }
    }
    return steps;
  }

  function compileStatement(statement, segmentName, diagnostics) {
    switch (statement.type) {
      case "dialogue":
        return { kind: "dialogue", speaker: statement.speaker, text: statement.text };
      case "command":
        return transformCommand({
          kind: "command",
          name: statement.name,
          args: statement.args.map(compileValueArg),
        }, segmentName, statement.span, diagnostics);
      case "jump":
        return { kind: "jump", target: statement.target };
      case "choice":
        return {
          kind: "choice",
          prompt: { speaker: statement.prompt.speaker, text: statement.prompt.text },
          options: statement.options.map((option) => ({
            text: option.text,
            steps: compileSteps(option.statements, segmentName, diagnostics),
          })),
        };
      case "battle": {
        const outcomes = {};
        for (const outcome of statement.outcomes) {
          outcomes[outcome.outcome] = compileSteps(outcome.statements, segmentName, diagnostics);
        }
        return { kind: "battle", battleId: statement.battleId, outcomes };
      }
      case "if": {
        const cases = [];
        let fallback = null;
        for (const branch of statement.branches) {
          const steps = compileSteps(branch.statements, segmentName, diagnostics);
          if (branch.keyword === "else") {
            fallback = steps;
          } else if (branch.condition) {
            cases.push({ when: compileExpr(branch.condition), steps });
          }
        }
        return { kind: "branch", cases, fallback };
      }
      default:
        return null;
    }
  }

  function transformCommand(command, segmentName, span, diagnostics) {
    if (command.name !== "maxlevel" || command.args.length !== 2) {
      return command;
    }

    const skillName = command.args[0];
    if (typeof skillName !== "string") {
      diagnostics.push({
        message: "maxlevel 自动补 key 时，技能名必须是字符串字面量",
        span,
        severity: "error",
        code: "semantic",
      });
      return command;
    }

    return { ...command, args: [...command.args, `${segmentName}_${skillName}`] };
  }

  function compileExpr(expr) {
    switch (expr.type) {
      case "binary":
      case "comparison":
        return [expr.operator, compileExpr(expr.left), compileExpr(expr.right)];
      case "unary":
        return ["not", compileExpr(expr.operand)];
      case "predicate":
        return ["pred", expr.name, ...expr.args.map(compileValueArg)];
      case "variable":
        return ["var", expr.name];
      case "literal":
        return expr.value;
      default:
        return "";
    }
  }

  function compileValueArg(arg) {
    if (arg.type === "variable") {
      return ["var", arg.name];
    }
    if (arg.type === "list") {
      return ["list", ...arg.items.map(compileValueArg)];
    }
    return arg.value;
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
        lineStartOffset: offset,
      });
      offset += rawText.length + 1;
    });
    return lines;
  }

  function stripComment(text) {
    const commentIndex = text.indexOf("//");
    return commentIndex >= 0 ? text.slice(0, commentIndex) : text;
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

  function readConditionalKeyword(line) {
    if (isKeywordLine(line, "if")) return "if";
    if (isKeywordLine(line, "elif")) return "elif";
    if (isKeywordLine(line, "else")) return "else";
    return null;
  }

  function findDialogueSeparator(text) {
    const asciiIndex = text.indexOf(":");
    const fullWidthIndex = text.indexOf("：");
    if (asciiIndex === -1 && fullWidthIndex === -1) return null;
    if (asciiIndex === -1) return { marker: "：", index: fullWidthIndex };
    if (fullWidthIndex === -1) return { marker: ":", index: asciiIndex };
    return asciiIndex < fullWidthIndex ? { marker: ":", index: asciiIndex } : { marker: "：", index: fullWidthIndex };
  }

  function splitCommandParts(text) {
    const parts = [];
    let index = 0;
    while (index < text.length) {
      while (index < text.length && /\s/u.test(text[index])) {
        index += 1;
      }
      if (index >= text.length) {
        break;
      }

      if (text[index] === "[") {
        const start = index;
        let depth = 0;
        while (index < text.length) {
          if (text[index] === "[") depth += 1;
          if (text[index] === "]") {
            depth -= 1;
            if (depth === 0) {
              index += 1;
              break;
            }
          }
          index += 1;
        }
        parts.push(text.slice(start, index));
        continue;
      }

      const start = index;
      while (index < text.length && !/\s/u.test(text[index])) {
        index += 1;
      }
      parts.push(text.slice(start, index));
    }
    return parts;
  }

  function parseValueArg(raw, span) {
    if (raw.startsWith("[") && raw.endsWith("]")) {
      return {
        type: "list",
        items: splitListItems(raw.slice(1, -1)).map((item) => parseValueArg(item, span)),
        span,
      };
    }
    if (raw.startsWith("$") && raw.length > 1) {
      return { type: "variable", name: raw.slice(1), span };
    }
    if (numberPattern.test(raw)) {
      return { type: "literal", value: Number(raw), valueType: "number", span };
    }
    return { type: "literal", value: raw, valueType: "string", span };
  }

  function splitListItems(text) {
    const items = [];
    let index = 0;
    let start = 0;
    let depth = 0;
    while (index <= text.length) {
      const char = text[index] ?? ",";
      if (char === "[") depth += 1;
      if (char === "]") depth -= 1;
      if (char === "," && depth === 0) {
        const item = text.slice(start, index).trim();
        if (item) {
          items.push(item);
        }
        start = index + 1;
      }
      index += 1;
    }
    return items;
  }

  function parseExpression(text, span) {
    const parser = new ExpressionParser(text, span);
    return parser.parse();
  }

  class ExpressionParser {
    constructor(text, span) {
      this.text = text;
      this.span = span;
      this.tokens = tokenizeExpression(text);
      this.diagnostics = [];
      this.index = 0;
    }

    parse() {
      const expr = this.parseOr();
      if (this.peek().type !== "eof") {
        this.errorAtToken(this.peek(), "表达式存在无法解析的尾随内容");
      }
      return { expr, diagnostics: this.diagnostics };
    }

    parseOr() {
      let expr = this.parseAnd();
      while (this.match("or")) {
        const operatorToken = this.previous();
        const right = this.parseAnd();
        if (!expr || !right) return expr ?? right;
        expr = { type: "binary", operator: "or", rawOperator: operatorToken.lexeme, left: expr, right, span: this.span };
      }
      return expr;
    }

    parseAnd() {
      let expr = this.parseNot();
      while (this.match("and")) {
        const operatorToken = this.previous();
        const right = this.parseNot();
        if (!expr || !right) return expr ?? right;
        expr = { type: "binary", operator: "and", rawOperator: operatorToken.lexeme, left: expr, right, span: this.span };
      }
      return expr;
    }

    parseNot() {
      if (this.match("not")) {
        const operand = this.parseNot();
        if (!operand) {
          this.errorAtToken(this.previous(), "not 后缺少表达式");
          return null;
        }
        return { type: "unary", operator: "not", operand, span: this.span };
      }
      return this.parseComparison();
    }

    parseComparison() {
      const left = this.parsePrimary();
      const operatorMap = { eq: "==", ne: "!=", gt: ">", gte: ">=", lt: "<", lte: "<=" };
      const operator = operatorMap[this.peek().type];
      if (!operator) {
        return left;
      }

      this.advance();
      const right = this.parsePrimary();
      if (!left || !right) {
        this.errorAtToken(this.previous(), "比较运算符两侧都必须有表达式");
        return left ?? right;
      }
      return { type: "comparison", operator, left, right, span: this.span };
    }

    parsePrimary() {
      const token = this.peek();
      if (this.match("lparen")) {
        const expr = this.parseOr();
        if (!this.match("rparen")) {
          this.errorAtToken(this.peek(), "缺少右括号 ')'");
        }
        return expr;
      }
      if (this.match("variable")) {
        return { type: "variable", name: this.previous().lexeme.slice(1), span: this.span };
      }
      if (this.match("number")) {
        return { type: "literal", value: Number(this.previous().lexeme), valueType: "number", span: this.span };
      }
      if (this.match("identifier")) {
        const identifierToken = this.previous();
        const args = [];
        while (this.canConsumePredicateArgument()) {
          args.push(parseValueArg(this.advance().lexeme, this.span));
        }
        if (args.length > 0) {
          return { type: "predicate", name: identifierToken.lexeme, args, span: this.span };
        }
        return { type: "literal", value: identifierToken.lexeme, valueType: "string", span: this.span };
      }
      if (token.type !== "eof" && token.type !== "rparen") {
        this.errorAtToken(token, `无法识别的表达式片段 '${token.lexeme}'`);
        this.advance();
      }
      return null;
    }

    canConsumePredicateArgument() {
      return ["identifier", "number", "variable"].includes(this.peek().type);
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
        span: this.span,
      });
    }
  }

  function tokenizeExpression(text) {
    const tokens = [];
    let index = 0;
    const boundaryChars = new Set(["(", ")", "!", "<", ">", "=", "&", "|"]);
    while (index < text.length) {
      const char = text[index];
      if (/\s/u.test(char)) {
        index += 1;
        continue;
      }
      const nextTwo = text.slice(index, index + 2);
      const twoCharTypes = { "&&": "and", "||": "or", "==": "eq", "!=": "ne", ">=": "gte", "<=": "lte" };
      if (twoCharTypes[nextTwo]) {
        tokens.push({ type: twoCharTypes[nextTwo], lexeme: nextTwo });
        index += 2;
        continue;
      }
      const oneCharTypes = { "(": "lparen", ")": "rparen", "!": "not", ">": "gt", "<": "lt" };
      if (oneCharTypes[char]) {
        tokens.push({ type: oneCharTypes[char], lexeme: char });
        index += 1;
        continue;
      }
      if (char === "$") {
        const start = index;
        index += 1;
        while (index < text.length && !/\s/u.test(text[index]) && !boundaryChars.has(text[index])) {
          index += 1;
        }
        tokens.push({ type: "variable", lexeme: text.slice(start, index) });
        continue;
      }
      if (/\d/u.test(char) || ((char === "-" || char === "+") && /\d/u.test(text[index + 1] ?? ""))) {
        const start = index;
        index += char === "-" || char === "+" ? 2 : 1;
        while (index < text.length && /\d/u.test(text[index])) index += 1;
        if (text[index] === "." && /\d/u.test(text[index + 1] ?? "")) {
          index += 1;
          while (index < text.length && /\d/u.test(text[index])) index += 1;
        }
        tokens.push({ type: "number", lexeme: text.slice(start, index) });
        continue;
      }

      const start = index;
      while (index < text.length && !/\s/u.test(text[index]) && !boundaryChars.has(text[index])) {
        index += 1;
      }
      const lexeme = text.slice(start, index);
      tokens.push({
        type: lexeme === "and" ? "and" : lexeme === "or" ? "or" : lexeme === "not" ? "not" : "identifier",
        lexeme,
      });
    }
    tokens.push({ type: "eof", lexeme: "" });
    return tokens;
  }

  function lineSpan(line, startColumn = 1, endColumn) {
    const end = endColumn ?? line.rawText.length + 1;
    return {
      start: { line: line.lineNumber, column: startColumn, offset: line.lineStartOffset + startColumn - 1 },
      end: { line: line.lineNumber, column: end, offset: line.lineStartOffset + end - 1 },
    };
  }

  function mergeSpans(start, end) {
    return { start: start.start, end: end.end };
  }

  function zeroSpan() {
    return {
      start: { line: 1, column: 1, offset: 0 },
      end: { line: 1, column: 1, offset: 0 },
    };
  }

  window.StoryDsl = {
    analyzeStory,
    parseStory,
    compileScript,
  };
})();
