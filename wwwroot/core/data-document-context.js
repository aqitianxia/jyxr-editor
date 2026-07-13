export function rememberDataDocumentSelection(contexts, path, selectedRecordIndex) {
  if (!(contexts instanceof Map) || !path) return;
  contexts.set(path, {
    selectedRecordIndex: normalizeRecordIndex(selectedRecordIndex),
  });
}

export function restoreDataDocumentSelection(contexts, path) {
  if (!(contexts instanceof Map) || !path) return 0;
  return normalizeRecordIndex(contexts.get(path)?.selectedRecordIndex);
}

function normalizeRecordIndex(value) {
  return Number.isInteger(value) && value >= 0 ? value : 0;
}
