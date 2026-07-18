(function () {
  const numberPattern = /^[+-]?\d+(?:\.\d+)?$/u;
  const reservedCommandNames = new Set([
    "if", "elif", "else", "battle", "when", "call", "return",
    "and", "or", "not", "win", "lose", "timeout",
  ]);

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

  function decompileStoryJson(storyJson) {
    if (!storyJson || typeof storyJson !== "object" || !Array.isArray(storyJson.segments)) {
      throw new Error("Story JSON 必须包含 segments 数组。");
    }

    const lines = [];
    for (const segment of storyJson.segments) {
      if (lines.length > 0) {
        lines.push("");
      }

      lines.push(`# ${String(segment?.name ?? "")}`);
      appendDslSteps(lines, Array.isArray(segment?.steps) ? segment.steps : [], 0);
    }

    return `${lines.join("\n")}\n`;
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

      if (isKeywordLine(line, "when")) {
        this.pushDiagnostic("when 只能作为 choice 的条件组选项出现", lineSpan(line), "structure");
        this.index += 1;
        return null;
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
        if (nextLine && nextLine.indentLevel === expectedIndent &&
            (isBranchLine(nextLine) || isKeywordLine(nextLine, "when"))) {
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

      const commandMatch = /^(\S+)(?:\s+(.*))?$/u.exec(line.trimmed);
      if (!commandMatch) {
        return null;
      }

      const name = commandMatch[1];
      if (name === "jump" || name === "call") {
        const target = line.trimmed.slice(name.length).trim();
        if (!target) {
          this.pushDiagnostic(`${name} 之后必须提供目标段名`, lineSpan(line), "syntax");
        }
        return {
          type: name,
          target,
          span: lineSpan(line),
        };
      }

      if (name === "return") {
        const rest = line.trimmed.slice(name.length).trim();
        if (rest) {
          this.pushDiagnostic("return 后不能跟参数", lineSpan(line), "syntax");
        }
        return { type: "return", span: lineSpan(line) };
      }

      if (reservedCommandNames.has(name)) {
        this.pushDiagnostic(`'${name}' 是保留字，不能作为命令名`, lineSpan(line), "semantic");
      }

      const argsText = commandMatch[2] ?? "";
      const argsStart = argsText ? line.trimmed.indexOf(argsText, name.length) : name.length;
      const parsedArgs = parseValueArgs(argsText, position(line, line.indentSpaces + argsStart + 1));
      this.diagnostics.push(...parsedArgs.diagnostics);

      return {
        type: "command",
        name,
        args: parsedArgs.args,
        span: lineSpan(line),
      };
    }

    parseChoiceStatement(prompt, expectedIndent) {
      const groups = [];

      while (true) {
        this.skipBlankLines();
        const line = this.peek();
        if (!line || line.indentLevel !== expectedIndent) {
          break;
        }

        if (isBranchLine(line)) {
          const options = this.parseChoiceOptions(expectedIndent);
          groups.push({
            type: "choiceGroup",
            condition: null,
            rawCondition: null,
            options,
            span: mergeSpans(options[0].span, options[options.length - 1].span),
          });
          continue;
        }

        if (isKeywordLine(line, "when")) {
          groups.push(this.parseConditionalChoiceGroup(expectedIndent));
          continue;
        }

        break;
      }

      if (groups.length === 0) {
        this.pushDiagnostic("choice 至少需要一个 '- 选项' 分支", prompt.span, "structure");
      }

      if (groups.length > 0 && groups.every((group) => group.condition !== null)) {
        this.pushDiagnostic(
          "choice 全部为条件组选项，运行时可能没有可用选项",
          prompt.span,
          "semantic",
          "warning",
        );
      }

      return {
        type: "choice",
        prompt,
        groups,
        span: groups.length > 0 ? mergeSpans(prompt.span, groups[groups.length - 1].span) : prompt.span,
      };
    }

    parseChoiceOptions(optionIndent) {
      const options = [];
      while (true) {
        this.skipBlankLines();
        const line = this.peek();
        if (!line || line.indentLevel !== optionIndent || !isBranchLine(line)) {
          break;
        }

        options.push(this.parseChoiceOption(optionIndent));
      }

      return options;
    }

    parseChoiceOption(optionIndent) {
      const line = this.peek();
      const optionText = /^-\s*(.*)$/u.exec(line.trimmed)?.[1] ?? "";
      const optionSpan = lineSpan(line);
      this.index += 1;
      const statements = this.parseStatements(
        optionIndent + 1,
        (candidate) => candidate.indentLevel === optionIndent && isBranchLine(candidate),
      );

      return {
        type: "choiceOption",
        text: optionText,
        statements,
        span: statements.length > 0 ? mergeSpans(optionSpan, statements[statements.length - 1].span) : optionSpan,
      };
    }

    parseConditionalChoiceGroup(expectedIndent) {
      const whenLine = this.peek();
      const groupSpan = lineSpan(whenLine);
      const rawCondition = whenLine.trimmed.slice("when".length).trim();
      let condition = null;
      if (!rawCondition) {
        this.pushDiagnostic("when 后缺少条件表达式", groupSpan, "syntax");
      } else {
        const expressionResult = parseExpression(rawCondition, groupSpan);
        condition = expressionResult.expr;
        this.diagnostics.push(...expressionResult.diagnostics);
      }

      this.index += 1;
      const optionIndent = expectedIndent + 1;
      const options = [];
      while (true) {
        this.skipBlankLines();
        const line = this.peek();
        if (!line || line.indentLevel <= expectedIndent) {
          break;
        }

        if (line.indentLevel === optionIndent && isBranchLine(line)) {
          options.push(this.parseChoiceOption(optionIndent));
          continue;
        }

        if (line.indentLevel === optionIndent && isKeywordLine(line, "when")) {
          this.pushDiagnostic("when 条件组不允许嵌套", lineSpan(line), "structure");
        } else if (line.indentLevel === optionIndent) {
          this.pushDiagnostic("when 条件组只能包含 '- 选项'", lineSpan(line), "structure");
        } else {
          this.pushDiagnostic("when 条件组中出现了意外的缩进层级", lineSpan(line), "indentation");
        }
        this.index += 1;
      }

      if (options.length === 0) {
        this.pushDiagnostic("when 条件组至少需要一个缩进的 '- 选项'", groupSpan, "structure");
      }

      return {
        type: "choiceGroup",
        condition,
        rawCondition,
        options,
        span: options.length > 0 ? mergeSpans(groupSpan, options[options.length - 1].span) : groupSpan,
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

    pushDiagnostic(message, span, code, severity = "error") {
      this.diagnostics.push({ message, span, code, severity });
    }
  }

  function compileScript(ast) {
    const diagnostics = [];
    const segments = ast.segments.map((segment) => ({
      name: segment.name,
      steps: compileSteps(segment.statements, segment.name, diagnostics),
    }));
    return { ir: { version: 2, segments }, diagnostics };
  }

  function compileSteps(statements, segmentName, diagnostics) {
    const steps = [];
    let terminated = false;
    for (const statement of statements) {
      if (terminated) {
        diagnostics.push({
          message: "jump/return 之后的同级语句不可达，已跳过 IR 输出",
          span: statement.span,
          severity: "error",
          code: "unreachable",
        });
        continue;
      }

      const step = compileStatement(statement, segmentName, diagnostics);
      if (step) {
        steps.push(step);
        if (step.kind === "jump" || step.kind === "return") {
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
      case "call":
        return { kind: "call", target: statement.target };
      case "return":
        return { kind: "return" };
      case "choice":
        return {
          kind: "choice",
          prompt: { speaker: statement.prompt.speaker, text: statement.prompt.text },
          groups: statement.groups.map((group) => ({
            ...(group.condition ? { when: compileExpr(group.condition) } : {}),
            options: group.options.map((option) => ({
              text: option.text,
              steps: compileSteps(option.statements, segmentName, diagnostics),
            })),
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
    const firstWhitespace = text.search(/\s/u);
    const dialoguePrefixEnd = firstWhitespace === -1 ? text.length : firstWhitespace;
    const rawAsciiIndex = text.indexOf(":");
    const rawFullWidthIndex = text.indexOf("：");
    const asciiIndex = rawAsciiIndex >= 0 && rawAsciiIndex <= dialoguePrefixEnd ? rawAsciiIndex : -1;
    const fullWidthIndex = rawFullWidthIndex >= 0 && rawFullWidthIndex <= dialoguePrefixEnd ? rawFullWidthIndex : -1;
    if (asciiIndex === -1 && fullWidthIndex === -1) return null;
    if (asciiIndex === -1) return { marker: "：", index: fullWidthIndex };
    if (fullWidthIndex === -1) return { marker: ":", index: asciiIndex };
    return asciiIndex < fullWidthIndex ? { marker: ":", index: asciiIndex } : { marker: "：", index: fullWidthIndex };
  }

  function parseValueArg(raw, span) {
    if (raw.startsWith('"') && raw.endsWith('"')) {
      try {
        return { type: "literal", value: JSON.parse(raw), valueType: "string", span };
      } catch {
        return { type: "literal", value: raw.slice(1, -1), valueType: "string", span };
      }
    }
    if (raw.startsWith("$") && raw.length > 1) {
      return { type: "variable", name: raw.slice(1), span };
    }
    if (numberPattern.test(raw)) {
      return { type: "literal", value: Number(raw), valueType: "number", span };
    }
    return { type: "literal", value: raw, valueType: "string", span };
  }

  function parseValueArgs(raw, base) {
    return new ValueArgsParser(raw, base).parse();
  }

  class ValueArgsParser {
    constructor(raw, base) {
      this.raw = raw;
      this.base = base;
      this.diagnostics = [];
      this.index = 0;
    }

    parse() {
      const args = [];
      while (this.index < this.raw.length) {
        this.skipWhitespace();
        if (this.index >= this.raw.length) break;
        if (this.raw[this.index] === "[") {
          args.push(this.parseList());
        } else if (this.raw[this.index] === '"') {
          args.push(this.parseQuoted());
        } else {
          args.push(this.parseScalar(false));
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
        if (this.index >= this.raw.length) break;

        const char = this.raw[this.index];
        if (char === "]") {
          closed = true;
          if (items.length === 0) {
            this.pushDiagnostic("列表参数不能为空", listStart, this.index + 1);
          } else if (expectItem && separatorBefore) {
            this.pushDiagnostic("列表分隔符后缺少元素", this.index, this.index + 1);
          }
          this.index += 1;
          break;
        }

        if (isArgumentSeparator(char)) {
          if (expectItem) {
            this.pushDiagnostic("列表分隔符之间缺少元素", this.index, this.index + 1);
          }
          expectItem = true;
          separatorBefore = true;
          this.index += 1;
          continue;
        }

        if (!expectItem) {
          this.pushDiagnostic("列表元素之间必须使用 ',' 或 '，' 分隔", this.index, this.index + 1);
        }

        if (char === "[") {
          items.push(this.parseList());
        } else if (char === '"') {
          items.push(this.parseQuoted());
        } else {
          items.push(this.parseScalar(true));
        }
        expectItem = false;
        separatorBefore = false;
      }

      if (!closed) {
        this.pushDiagnostic("列表参数缺少右括号 ']'", listStart, this.raw.length);
        this.index = this.raw.length;
      }

      return {
        type: "list",
        items,
        span: spanFromRange(this.base, listStart, this.index),
      };
    }

    parseQuoted() {
      const start = this.index;
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
        this.pushDiagnostic("引号字符串缺少结束引号", start, this.index);
      }
      return parseValueArg(
        this.raw.slice(start, this.index),
        spanFromRange(this.base, start, this.index),
      );
    }

    parseScalar(inList) {
      const start = this.index;
      while (this.index < this.raw.length && !/\s/u.test(this.raw[this.index])) {
        if (inList && (isArgumentSeparator(this.raw[this.index]) || this.raw[this.index] === "]")) {
          break;
        }
        this.index += 1;
      }
      if (start === this.index) this.index += 1;
      return parseValueArg(
        this.raw.slice(start, this.index),
        spanFromRange(this.base, start, this.index),
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
        span: spanFromRange(this.base, start, end),
      });
    }
  }

  function isArgumentSeparator(char) {
    return char === "," || char === "，";
  }

  function spanFromRange(base, start, end) {
    return {
      start: offsetPosition(base, start),
      end: offsetPosition(base, Math.max(end, start + 1)),
    };
  }

  function offsetPosition(base, relativeOffset) {
    return {
      line: base.line,
      column: base.column + relativeOffset,
      offset: base.offset + relativeOffset,
    };
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
      if (this.match("string")) {
        return parseValueArg(this.previous().lexeme, this.span);
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
      return ["identifier", "number", "string", "variable"].includes(this.peek().type);
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
      if (char === '"') {
        const start = index;
        index += 1;
        let escaped = false;
        while (index < text.length) {
          const current = text[index];
          index += 1;
          if (escaped) {
            escaped = false;
          } else if (current === "\\") {
            escaped = true;
          } else if (current === '"') {
            break;
          }
        }
        tokens.push({ type: "string", lexeme: text.slice(start, index) });
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

  function appendDslSteps(lines, steps, indentLevel) {
    for (const step of steps) {
      appendDslStep(lines, step, indentLevel);
    }
  }

  function appendDslStep(lines, step, indentLevel) {
    const indent = "  ".repeat(indentLevel);
    switch (step?.kind) {
      case "dialogue":
        lines.push(`${indent}${formatDialogueLine(step.speaker, step.text)}`);
        break;
      case "command":
        lines.push(`${indent}${formatCommandLine(step.name, step.args)}`);
        break;
      case "jump":
        lines.push(`${indent}jump ${String(step.target ?? "")}`);
        break;
      case "call":
        lines.push(`${indent}call ${String(step.target ?? "")}`);
        break;
      case "return":
        lines.push(`${indent}return`);
        break;
      case "choice":
        lines.push(`${indent}${formatDialogueLine(step.prompt?.speaker, step.prompt?.text)}`);
        appendDslChoiceGroups(lines, Array.isArray(step.groups) ? step.groups : [], indentLevel);
        break;
      case "battle":
        lines.push(`${indent}battle ${String(step.battleId ?? "")}`);
        for (const outcome of ["win", "lose", "timeout"]) {
          if (!Object.prototype.hasOwnProperty.call(step.outcomes || {}, outcome)) {
            continue;
          }
          lines.push(`${indent}- ${outcome}`);
          appendDslSteps(lines, Array.isArray(step.outcomes[outcome]) ? step.outcomes[outcome] : [], indentLevel + 1);
        }
        break;
      case "branch":
        appendDslBranch(lines, step, indentLevel);
        break;
      default:
        lines.push(`${indent}${formatCommandLine("raw_step", [JSON.stringify(step ?? null)])}`);
        break;
    }
  }

  function appendDslChoiceGroups(lines, groups, indentLevel) {
    const indent = "  ".repeat(indentLevel);
    for (const group of groups) {
      const conditional = Object.prototype.hasOwnProperty.call(group || {}, "when");
      const optionIndentLevel = conditional ? indentLevel + 1 : indentLevel;
      if (conditional) {
        lines.push(`${indent}when ${formatExpression(group.when)}`);
      }
      const optionIndent = "  ".repeat(optionIndentLevel);
      for (const option of Array.isArray(group?.options) ? group.options : []) {
        lines.push(`${optionIndent}- ${String(option?.text ?? "")}`);
        appendDslSteps(lines, Array.isArray(option?.steps) ? option.steps : [], optionIndentLevel + 1);
      }
    }
  }

  function appendDslBranch(lines, step, indentLevel) {
    const indent = "  ".repeat(indentLevel);
    const cases = Array.isArray(step.cases) ? step.cases : [];
    cases.forEach((branch, index) => {
      lines.push(`${indent}${index === 0 ? "if" : "elif"} ${formatExpression(branch?.when)}`);
      appendDslSteps(lines, Array.isArray(branch?.steps) ? branch.steps : [], indentLevel + 1);
    });

    if (Array.isArray(step.fallback)) {
      lines.push(`${indent}else`);
      appendDslSteps(lines, step.fallback, indentLevel + 1);
    }
  }

  function formatDialogueLine(speaker, text) {
    return `${String(speaker ?? "")}：${String(text ?? "")}`;
  }

  function formatCommandLine(name, args) {
    const parts = [String(name ?? "")];
    for (const arg of Array.isArray(args) ? args : []) {
      parts.push(formatValueArg(arg));
    }
    return parts.join(" ");
  }

  function formatValueArg(value) {
    if (Array.isArray(value) && value[0] === "list") {
      return `[${value.slice(1).map(formatValueArg).join(", ")}]`;
    }
    if (Array.isArray(value) && value[0] === "var" && typeof value[1] === "string") {
      return `$${value[1]}`;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    if (typeof value !== "string") {
      return JSON.stringify(JSON.stringify(value));
    }
    if (canUseBareValue(value)) {
      return value;
    }
    return JSON.stringify(value);
  }

  function canUseBareValue(value) {
    return value.length > 0
      && !numberPattern.test(value)
      && !value.startsWith("$")
      && !value.startsWith("[")
      && !value.startsWith('"')
      && !/[\s,[\]"]/u.test(value)
      && !value.includes("//");
  }

  function formatExpression(expr) {
    if (Array.isArray(expr)) {
      const [operator, ...rest] = expr;
      if (operator === "and" || operator === "or") {
        return rest.map(formatNestedExpression).join(` ${operator} `);
      }
      if (operator === "not") {
        return `not ${formatNestedExpression(rest[0])}`;
      }
      if (operator === "pred") {
        const [name, ...args] = rest;
        return [String(name ?? ""), ...args.map(formatValueArg)].join(" ");
      }
      if (operator === "var") {
        return `$${String(rest[0] ?? "")}`;
      }
      if (["==", "!=", ">", ">=", "<", "<="].includes(operator)) {
        return `${formatNestedExpression(rest[0])} ${operator} ${formatNestedExpression(rest[1])}`;
      }
    }

    return formatValueArg(expr);
  }

  function formatNestedExpression(expr) {
    return Array.isArray(expr) && ["and", "or", "not", "==", "!=", ">", ">=", "<", "<="].includes(expr[0])
      ? `(${formatExpression(expr)})`
      : formatExpression(expr);
  }

  function position(line, column) {
    return {
      line: line.lineNumber,
      column,
      offset: line.lineStartOffset + column - 1,
    };
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
    decompileStoryJson,
  };
})();
