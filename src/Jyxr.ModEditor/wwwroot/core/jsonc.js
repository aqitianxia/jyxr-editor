function stripComments(text) {
  const source = String(text ?? "").replace(/^\uFEFF/u, "");
  const output = [...source];
  let inString = false;
  let escaped = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }

    if (character === '"') {
      inString = true;
      continue;
    }
    if (character !== "/" || index + 1 >= source.length) continue;

    const next = source[index + 1];
    if (next === "/") {
      output[index] = " ";
      output[index + 1] = " ";
      index += 2;
      while (index < source.length && source[index] !== "\n" && source[index] !== "\r") {
        output[index] = " ";
        index += 1;
      }
      index -= 1;
    } else if (next === "*") {
      output[index] = " ";
      output[index + 1] = " ";
      index += 2;
      let closed = false;
      while (index < source.length) {
        if (source[index] === "*" && source[index + 1] === "/") {
          output[index] = " ";
          output[index + 1] = " ";
          index += 1;
          closed = true;
          break;
        }
        if (source[index] !== "\n" && source[index] !== "\r") output[index] = " ";
        index += 1;
      }
      if (!closed) throw new SyntaxError("Unterminated block comment in JSONC input.");
    }
  }

  return output.join("");
}

function stripTrailingCommas(text) {
  const output = [...text];
  let inString = false;
  let escaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }

    if (character === '"') {
      inString = true;
      continue;
    }
    if (character !== ",") continue;

    let next = index + 1;
    while (next < text.length && /\s/u.test(text[next])) next += 1;
    if (text[next] === "]" || text[next] === "}") output[index] = " ";
  }

  return output.join("");
}

export function normalizeJsonc(text) {
  return stripTrailingCommas(stripComments(text));
}

export function parseJsonc(text) {
  return JSON.parse(normalizeJsonc(text));
}
