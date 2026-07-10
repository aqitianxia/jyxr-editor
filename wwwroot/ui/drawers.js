export function setDrawerOpen({
  open,
  bodyClass,
  toggleButton,
  drawer,
  closeButton = null,
  focusClose = true,
}) {
  const nextOpen = Boolean(open);
  document.body.classList.toggle(bodyClass, nextOpen);
  toggleButton.setAttribute("aria-expanded", String(nextOpen));
  drawer.setAttribute("aria-hidden", String(!nextOpen));
  if (nextOpen && focusClose) {
    closeButton?.focus({ preventScroll: true });
  }
  return nextOpen;
}
