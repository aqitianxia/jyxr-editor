function normalize(value) {
  return String(value || "").trim().toLocaleLowerCase("zh-CN");
}

export function scoreResourceSearch(searchText, query) {
  if (Array.isArray(searchText)) {
    return searchText.reduce((best, value) => Math.max(best, scoreResourceSearch(value, query)), -1);
  }
  const haystack = normalize(searchText);
  const needle = normalize(query);
  if (!needle) return 1;
  if (haystack === needle) return 1000;
  const direct = haystack.indexOf(needle);
  if (direct >= 0) return 700 - Math.min(direct, 200);
  let cursor = 0;
  let gap = 0;
  for (const character of needle) {
    const next = haystack.indexOf(character, cursor);
    if (next < 0) return -1;
    gap += next - cursor;
    cursor = next + 1;
  }
  return 300 - Math.min(gap, 250);
}

export function createResourcePickerModel({
  entries = [],
  query = "",
  selectedValue = "",
  getValue = (entry) => entry?.id || entry?.assetPath || "",
  getSearchText = (entry) => [entry?.id, entry?.basename, entry?.assetPath, entry?.assetValue, ...(entry?.resourceIds || [])],
  limit = Infinity,
} = {}) {
  const visibleEntries = entries
    .map((entry, index) => ({ entry, index, score: scoreResourceSearch(getSearchText(entry), query) }))
    .filter((candidate) => candidate.score >= 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, limit)
    .map((candidate) => candidate.entry);
  const selectedEntry = visibleEntries.find((entry) => getValue(entry) === selectedValue) || visibleEntries[0] || null;
  const selectedIndex = selectedEntry ? visibleEntries.indexOf(selectedEntry) : -1;
  return Object.freeze({ visibleEntries, selectedEntry, selectedIndex });
}

export function moveResourcePickerSelection(model, direction) {
  if (!model?.visibleEntries?.length) return null;
  const delta = direction < 0 ? -1 : 1;
  const start = model.selectedIndex >= 0 ? model.selectedIndex : 0;
  const next = Math.max(0, Math.min(model.visibleEntries.length - 1, start + delta));
  return model.visibleEntries[next];
}

export function createResourceSelectionSession(initialValue = "") {
  let draftValue = String(initialValue || "");
  const originalValue = draftValue;
  return Object.freeze({
    get originalValue() { return originalValue; },
    get draftValue() { return draftValue; },
    select(value) { draftValue = String(value || ""); return draftValue; },
    confirm() { return draftValue; },
    cancel() { draftValue = originalValue; return originalValue; },
  });
}
