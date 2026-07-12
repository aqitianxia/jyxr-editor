export function bindImeSafeInput(input, onInput) {
  let composing = false;
  let lastEmittedValue = input.value;

  const emitIfChanged = (event) => {
    if (input.value === lastEmittedValue) return;
    lastEmittedValue = input.value;
    onInput(input.value, event);
  };

  input.addEventListener("compositionstart", () => {
    composing = true;
  });
  input.addEventListener("compositionend", (event) => {
    composing = false;
    emitIfChanged(event);
  });
  input.addEventListener("input", (event) => {
    if (!composing && !event.isComposing) emitIfChanged(event);
  });
}

export function captureInputEditingState(input) {
  if (!input) return null;
  return Object.freeze({
    selectionStart: Number.isInteger(input.selectionStart) ? input.selectionStart : null,
    selectionEnd: Number.isInteger(input.selectionEnd) ? input.selectionEnd : null,
    selectionDirection: input.selectionDirection || "none",
  });
}

export function restoreInputEditingState(input, editingState) {
  if (!input || !editingState) return;
  input.focus({ preventScroll: true });
  if (editingState.selectionStart === null || editingState.selectionEnd === null
    || typeof input.setSelectionRange !== "function") return;
  const length = String(input.value || "").length;
  const start = Math.max(0, Math.min(editingState.selectionStart, length));
  const end = Math.max(start, Math.min(editingState.selectionEnd, length));
  input.setSelectionRange(start, end, editingState.selectionDirection);
}

export function rerenderPreservingInput(input, render, findReplacement) {
  const editingState = captureInputEditingState(input);
  const result = render();
  const replacement = typeof findReplacement === "function" ? findReplacement() : input;
  restoreInputEditingState(replacement, editingState);
  return result;
}
