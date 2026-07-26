export const characterBiographyGroup = "人物";
export const characterBiographyPrefix = `${characterBiographyGroup}.`;

export function getCharacterBiographyCandidateIds(record) {
  const values = [record?.name, record?.id]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  return [...new Set(values)].map((value) => `${characterBiographyPrefix}${value}`);
}

export function resolveCharacterBiography(record, resourcesById, drafts = new Map()) {
  const candidates = getCharacterBiographyCandidateIds(record);
  for (const id of candidates) {
    if (drafts.has(id)) {
      const savedRecord = resourcesById.get(id);
      return {
        id,
        value: String(drafts.get(id) || ""),
        exists: Boolean(savedRecord),
        savedValue: typeof savedRecord?.value === "string" ? savedRecord.value : "",
        dirty: true,
      };
    }
    const resource = resourcesById.get(id);
    if (resource?.group === characterBiographyGroup) {
      return {
        id,
        value: typeof resource.value === "string" ? resource.value : "",
        exists: true,
        savedValue: typeof resource.value === "string" ? resource.value : "",
        dirty: false,
      };
    }
  }

  const fallbackId = record?.id
    ? `${characterBiographyPrefix}${String(record.id).trim()}`
    : candidates[0] || characterBiographyPrefix;
  return {
    id: fallbackId,
    value: String(drafts.get(fallbackId) || ""),
    exists: false,
    savedValue: "",
    dirty: drafts.has(fallbackId),
  };
}
