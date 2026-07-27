import {
  DiagnosticItem,
  ListValueArgAst,
  SourcePosition,
  SourceSpan,
  ValueArgAst,
} from "../ast";

const NUMBER_PATTERN = /^[+-]?\d+(?:\.\d+)?$/u;

interface ParseValueArgsResult {
  args: ValueArgAst[];
  diagnostics: DiagnosticItem[];
}

function offsetPosition(base: SourcePosition, relativeOffset: number): SourcePosition {
  return {
    line: base.line,
    column: base.column + relativeOffset,
    offset: base.offset + relativeOffset,
  };
}

function spanFromRange(base: SourcePosition, start: number, end: number): SourceSpan {
  return {
    start: offsetPosition(base, start),
    end: offsetPosition(base, Math.max(end, start + 1)),
  };
}

function isArgumentSeparator(char: string): boolean {
  return char === "," || char === "，";
}

export function parseValueArgAst(raw: string, span: SourceSpan): ValueArgAst {
  if (raw.startsWith('"') && raw.endsWith('"')) {
    try {
      return {
        type: "literal",
        value: JSON.parse(raw) as string,
        valueType: "string",
        span,
      };
    } catch {
      return {
        type: "literal",
        value: raw.slice(1, -1),
        valueType: "string",
        span,
      };
    }
  }

  if (raw.startsWith("$") && raw.length > 1) {
    return {
      type: "variable",
      name: raw.slice(1),
      span,
    };
  }

  if (NUMBER_PATTERN.test(raw)) {
    return {
      type: "literal",
      value: Number(raw),
      valueType: "number",
      span,
    };
  }

  if (raw === "true" || raw === "false") {
    return {
      type: "literal",
      value: raw === "true",
      valueType: "boolean",
      span,
    };
  }

  return {
    type: "literal",
    value: raw,
    valueType: "string",
    span,
  };
}

export function parseValueArgs(raw: string, base: SourcePosition): ParseValueArgsResult {
  return new ValueArgsParser(raw, base).parse();
}

class ValueArgsParser {
  private readonly diagnostics: DiagnosticItem[] = [];
  private index = 0;

  constructor(
    private readonly raw: string,
    private readonly base: SourcePosition,
  ) {}

  parse(): ParseValueArgsResult {
    const args: ValueArgAst[] = [];

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

  private parseList(): ListValueArgAst {
    const listStart = this.index;
    const items: ValueArgAst[] = [];
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
        items.push(this.parseListItem());
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

  private parseListItem(): ValueArgAst {
    const itemStart = this.index;
    while (
      this.index < this.raw.length &&
      !/\s/u.test(this.raw[this.index]) &&
      !isArgumentSeparator(this.raw[this.index]) &&
      this.raw[this.index] !== "]"
    ) {
      this.index += 1;
    }

    if (itemStart === this.index) {
      this.index += 1;
    }

    return parseValueArgAst(
      this.raw.slice(itemStart, this.index),
      spanFromRange(this.base, itemStart, this.index),
    );
  }

  private parseScalar(): ValueArgAst {
    const tokenStart = this.index;
    while (this.index < this.raw.length && !/\s/u.test(this.raw[this.index])) {
      this.index += 1;
    }

    return parseValueArgAst(
      this.raw.slice(tokenStart, this.index),
      spanFromRange(this.base, tokenStart, this.index),
    );
  }

  private parseQuoted(): ValueArgAst {
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
      this.pushDiagnostic("引号字符串缺少结束引号", tokenStart, this.index);
    }

    return parseValueArgAst(
      this.raw.slice(tokenStart, this.index),
      spanFromRange(this.base, tokenStart, this.index),
    );
  }

  private skipWhitespace(): void {
    while (this.index < this.raw.length && /\s/u.test(this.raw[this.index])) {
      this.index += 1;
    }
  }

  private pushDiagnostic(message: string, start: number, end: number): void {
    this.diagnostics.push({
      message,
      severity: "error",
      code: "syntax",
      span: spanFromRange(this.base, start, end),
    });
  }
}
