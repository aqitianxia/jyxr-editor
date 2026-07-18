export function bindScrollMemory(element, memory, key) {
  if (!element || !memory || !key) return;
  const saved = memory[key];
  element.addEventListener("scroll", () => {
    memory[key] = { top: element.scrollTop, left: element.scrollLeft };
  }, { passive: true });
  queueMicrotask(() => {
    if (!element.isConnected) return;
    element.scrollTop = Number(saved?.top) || 0;
    element.scrollLeft = Number(saved?.left) || 0;
  });
}

export function resetScrollMemory(memory, key) {
  if (!memory || !key) return;
  delete memory[key];
}
