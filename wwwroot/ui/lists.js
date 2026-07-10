export function createTextList(items, { className = "", limit = Infinity, emptyText = "" } = {}) {
  if (!items.length && emptyText) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = emptyText;
    return empty;
  }

  const list = document.createElement("ul");
  list.className = className;
  for (const value of items.slice(0, limit)) {
    const item = document.createElement("li");
    item.textContent = value;
    list.appendChild(item);
  }
  return list;
}
