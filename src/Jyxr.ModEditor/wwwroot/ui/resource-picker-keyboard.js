import { moveResourcePickerSelection } from "../domain/resource-picker.js?v=20260711-stage5c-1";

function isTextControl(target) {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
}

export function bindResourcePickerKeyboard(dialog, { model, getValue, onSelect, onCancel }) {
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
      return;
    }
    if (isTextControl(event.target) || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    const direction = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
    const next = moveResourcePickerSelection(model, direction);
    if (!next) return;
    event.preventDefault();
    onSelect(getValue(next), { restoreKeyboardFocus: true });
  });
}

export function restoreResourcePickerKeyboardFocus(overlayId, value) {
  requestAnimationFrame(() => {
    const cards = document.querySelectorAll(`#${overlayId} [data-resource-picker-value]`);
    for (const card of cards) {
      if (card.dataset.resourcePickerValue === value) {
        card.focus();
        break;
      }
    }
  });
}
