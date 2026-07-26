const tagPattern = /\[(\/)?([a-z_]+)(?:=([^\]]+))?\]/giu;

export const supportedGodotBbcodeTags = Object.freeze(new Set([
  "b", "i", "u", "s", "color", "bgcolor", "font_size", "left", "center", "right", "indent", "url",
]));

const selfClosingTags = new Set(["br"]);

export function tokenizeGodotBbcode(value) {
  const text = String(value || "");
  const tokens = [];
  let cursor = 0;
  for (const match of text.matchAll(tagPattern)) {
    if (match.index > cursor) tokens.push({ type: "text", value: text.slice(cursor, match.index) });
    const name = match[2].toLowerCase();
    const recognized = supportedGodotBbcodeTags.has(name) || selfClosingTags.has(name);
    tokens.push({
      type: recognized ? "tag" : "text",
      value: match[0],
      name,
      closing: Boolean(match[1]),
      argument: match[3]?.trim() || "",
      selfClosing: selfClosingTags.has(name),
      offset: match.index,
    });
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) tokens.push({ type: "text", value: text.slice(cursor) });
  return tokens;
}

export function analyzeGodotBbcode(value) {
  const stack = [];
  const diagnostics = [];
  for (const token of tokenizeGodotBbcode(value)) {
    if (token.type !== "tag" || token.selfClosing) continue;
    if (!token.closing) {
      stack.push(token);
      continue;
    }

    let matchingIndex = -1;
    for (let index = stack.length - 1; index >= 0; index -= 1) {
      if (stack[index].name !== token.name) continue;
      matchingIndex = index;
      break;
    }
    if (matchingIndex < 0) {
      diagnostics.push({ offset: token.offset, tag: token.name, message: `缺少开始标签：[${token.name}]` });
      continue;
    }
    if (matchingIndex !== stack.length - 1) {
      diagnostics.push({
        offset: token.offset,
        tag: token.name,
        message: `标签嵌套顺序错误：应先结束 [${stack.at(-1).name}]`,
      });
    }
    stack.splice(matchingIndex, 1);
  }
  for (const token of stack) {
    diagnostics.push({ offset: token.offset, tag: token.name, message: `缺少结束标签：[${token.name}]` });
  }
  return diagnostics.sort((left, right) => left.offset - right.offset);
}

export function applyGodotBbcodeFormat(value, selectionStart, selectionEnd, openTag, closeTag) {
  const text = String(value || "");
  const start = Math.max(0, Math.min(text.length, Number(selectionStart) || 0));
  const end = Math.max(start, Math.min(text.length, Number(selectionEnd) || 0));
  const open = String(openTag || "");
  const close = String(closeTag || "");
  const selected = text.slice(start, end);
  return {
    value: `${text.slice(0, start)}${open}${selected}${close}${text.slice(end)}`,
    selectionStart: start + open.length,
    selectionEnd: start + open.length + selected.length,
  };
}
