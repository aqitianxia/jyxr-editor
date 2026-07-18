export const storageKeys = Object.freeze({
  lastDataPath: "jyxr-json-editor:last-data-path",
  activeModId: "jyxr-json-editor:active-mod-id",
  navigationCollapsed: "jyxr-json-editor:navigation-collapsed",
  navigationSections: "jyxr-json-editor:navigation-sections",
  recentEntries: "jyxr-json-editor:recent-entries",
  recentWorkspaces: "jyxr-json-editor:recent-workspaces",
});

export function createPreferences(storage = window.localStorage) {
  return {
    get(key, fallback = null) {
      const value = storage.getItem(key);
      return value === null ? fallback : value;
    },
    set(key, value) {
      storage.setItem(key, String(value));
    },
    remove(key) {
      storage.removeItem(key);
    },
    scopedKey(key, scope = "default") {
      return `${key}:${scope || "default"}`;
    },
  };
}
