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
