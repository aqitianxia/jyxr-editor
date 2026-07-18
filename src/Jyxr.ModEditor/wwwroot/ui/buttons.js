export function createButton({
  label,
  onClick,
  variant = "",
  className = "",
  title = "",
  ariaLabel = "",
  disabled = false,
} = {}) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label || "";
  button.disabled = Boolean(disabled);
  button.className = [variant ? `button ${variant}` : "", className].filter(Boolean).join(" ");
  if (title) {
    button.title = title;
  }
  if (ariaLabel) {
    button.setAttribute("aria-label", ariaLabel);
  }
  if (onClick) {
    button.addEventListener("click", onClick);
  }
  return button;
}
