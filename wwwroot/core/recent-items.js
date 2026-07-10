export function createRecentItemsStore({ preferences, storageKey, limit = 8 }) {
  function read(scope) {
    const raw = preferences.get(preferences.scopedKey(storageKey, scope), "[]");
    try {
      const entries = JSON.parse(raw);
      return Array.isArray(entries) ? entries.filter(isValidEntry).slice(0, limit) : [];
    } catch {
      return [];
    }
  }

  function add(scope, entry) {
    if (!isValidEntry(entry)) {
      return read(scope);
    }

    const normalized = {
      workspace: entry.workspace,
      path: entry.path,
      label: String(entry.label || entry.path),
      detail: String(entry.detail || ""),
      openedAt: new Date().toISOString(),
    };
    const entries = read(scope)
      .filter((candidate) => !(candidate.workspace === normalized.workspace && candidate.path === normalized.path));
    entries.unshift(normalized);
    const next = entries.slice(0, limit);
    preferences.set(preferences.scopedKey(storageKey, scope), JSON.stringify(next));
    return next;
  }

  function clear(scope) {
    preferences.remove(preferences.scopedKey(storageKey, scope));
  }

  return { read, add, clear };
}

function isValidEntry(entry) {
  return Boolean(entry && typeof entry.workspace === "string" && typeof entry.path === "string" && entry.path);
}
