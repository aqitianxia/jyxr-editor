export function createDocumentHistory({ limit = 100 } = {}) {
  const maxEntries = Math.max(2, Number(limit) || 100);
  let entries = [];
  let index = -1;

  function reset(value) {
    entries = [clone(value)];
    index = 0;
  }

  function commit(value) {
    const next = clone(value);
    if (index < 0) {
      reset(next);
      return false;
    }
    if (isEqual(entries[index], next)) return false;
    entries.splice(index + 1);
    entries.push(next);
    if (entries.length > maxEntries) entries.shift();
    index = entries.length - 1;
    return true;
  }

  function undo() {
    if (!canUndo()) return null;
    index -= 1;
    return clone(entries[index]);
  }

  function redo() {
    if (!canRedo()) return null;
    index += 1;
    return clone(entries[index]);
  }

  function current() {
    return index < 0 ? null : clone(entries[index]);
  }

  function replaceCurrent(value) {
    if (index < 0) {
      reset(value);
      return;
    }
    entries[index] = clone(value);
  }

  function canUndo() {
    return index > 0;
  }

  function canRedo() {
    return index >= 0 && index < entries.length - 1;
  }

  return { reset, commit, replaceCurrent, undo, redo, current, canUndo, canRedo };
}

function clone(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function isEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
