function decodeJsonString(value) {
  try {
    return JSON.parse(`"${value}"`);
  } catch {
    return value;
  }
}

export function createJsonPropertyLineIndex(content) {
  const source = String(content || "");
  const linesByProperty = new Map();
  const propertyPattern = /"((?:\\.|[^"\\])*)"\s*:\s*"((?:\\.|[^"\\])*)"/g;
  let line = 1;
  let scannedTo = 0;
  let match;

  while ((match = propertyPattern.exec(source)) !== null) {
    for (let index = scannedTo; index < match.index; index += 1) {
      if (source.charCodeAt(index) === 10) line += 1;
    }
    scannedTo = match.index;

    const propertyName = decodeJsonString(match[1]);
    const value = decodeJsonString(match[2]);
    let values = linesByProperty.get(propertyName);
    if (!values) {
      values = new Map();
      linesByProperty.set(propertyName, values);
    }
    if (!values.has(value)) values.set(value, line);
  }

  return Object.freeze({
    find(propertyName, value) {
      return linesByProperty.get(propertyName)?.get(value) || 1;
    },
  });
}
