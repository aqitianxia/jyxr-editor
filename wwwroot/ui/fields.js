export function createTextInput({ id = "", label = "", placeholder = "", className = "tool-input" } = {}) {
  const input = document.createElement("input");
  input.type = "text";
  input.id = id;
  input.className = className;
  input.placeholder = placeholder;
  if (label) {
    input.setAttribute("aria-label", label);
  }
  return input;
}

export function createField({ label, control, className = "tool-field" }) {
  const wrapper = document.createElement("label");
  wrapper.className = className;
  const text = document.createElement("span");
  text.textContent = label;
  wrapper.append(text, control);
  return wrapper;
}
