export const resourceKinds = Object.freeze({
  image: "image",
  audio: "audio",
  text: "text",
  unknown: "unknown",
});

const imageGroups = new Set(["UI", "ui", "town", "touch", "地图", "场景", "头像", "物品"]);
const audioGroups = new Set(["战斗音乐", "音乐", "音效"]);
const textGroups = new Set(["ItemTrigger", "nick", "人物"]);
const genericRegistrableGroups = new Set(["场景", "地图", "音乐", "音效", "物品", "头像"]);
const imageExtensions = Object.freeze([".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif"]);
const audioExtensions = Object.freeze([".ogg", ".mp3", ".wav", ".flac"]);

export function getResourceGroupContract(group) {
  const normalized = String(group || "");
  const kind = imageGroups.has(normalized)
    ? resourceKinds.image
    : audioGroups.has(normalized)
      ? resourceKinds.audio
      : textGroups.has(normalized)
        ? resourceKinds.text
        : resourceKinds.unknown;
  return Object.freeze({
    group: normalized,
    kind,
    assetBacked: kind === resourceKinds.image || kind === resourceKinds.audio,
    genericRegistrationSupported: genericRegistrableGroups.has(normalized),
  });
}

export function isImageAsset(path) {
  const normalized = String(path || "").toLowerCase();
  return imageExtensions.some((extension) => normalized.endsWith(extension));
}

export function isAudioAsset(path) {
  const normalized = String(path || "").toLowerCase();
  return audioExtensions.some((extension) => normalized.endsWith(extension));
}

export function normalizeArtAssetValue(value) {
  return String(value || "")
    .trim()
    .replaceAll("\\", "/")
    .replace(/^res:\/\/assets\/art\//i, "")
    .replace(/^assets\/art\//i, "")
    .replace(/^art\//i, "")
    .replace(/\.(png|jpg|jpeg|webp)$/i, "");
}

export function findAssetPath(value, assetFilePaths, options = {}) {
  const normalized = String(value || "").trim().replaceAll("\\", "/")
    .replace(/^res:\/\/assets\//, "").replace(/^assets\//, "");
  if (!normalized) return "";
  const candidates = [];
  const hasExtension = /\.[a-z0-9]+$/i.test(normalized);
  const extensions = options.audio ? audioExtensions : imageExtensions.slice(0, 4);
  const roots = options.audio ? ["", "audio/"] : options.art ? ["", "art/"] : ["", "art/", "audio/"];
  for (const root of roots) {
    const base = normalized.startsWith(root) ? normalized : `${root}${normalized}`;
    if (hasExtension) {
      candidates.push(base);
      const extensionlessBase = base.replace(/\.[a-z0-9]+$/i, "");
      for (const extension of extensions) candidates.push(`${extensionlessBase}${extension}`);
    } else {
      for (const extension of extensions) candidates.push(`${base}${extension}`);
    }
  }
  for (const candidate of candidates) {
    if (assetFilePaths.has(candidate)) return candidate;
  }
  return "";
}

export function resolveResourceAssetPath(resource, assetFilePaths) {
  const value = typeof resource?.value === "string" ? resource.value : "";
  if (!value) return "";
  const contract = getResourceGroupContract(resource.group);
  if (contract.kind === resourceKinds.audio) return findAssetPath(value, assetFilePaths, { audio: true }) || value;
  if (contract.kind === resourceKinds.image) return findAssetPath(value, assetFilePaths, { art: true }) || value;
  return "";
}

export function buildResourceContractSummary(resources) {
  const groupCounts = new Map();
  const idCounts = new Map();
  for (const resource of resources || []) {
    const group = String(resource?.group || "");
    groupCounts.set(group, (groupCounts.get(group) || 0) + 1);
    if (typeof resource?.id === "string") idCounts.set(resource.id, (idCounts.get(resource.id) || 0) + 1);
  }
  return {
    total: Array.isArray(resources) ? resources.length : 0,
    groupCounts,
    duplicateIds: new Set([...idCounts].filter(([, count]) => count > 1).map(([id]) => id)),
  };
}

const resourceReferenceFields = new Set(["background", "icon", "image", "music", "musics", "picture", "portrait"]);

export function isResourceReferenceLocation(fieldPath) {
  const segments = String(fieldPath || "").replace(/\[\d+\]/g, "").split(".");
  return segments.some((segment) => resourceReferenceFields.has(segment));
}

export function buildResourceCatalog(resources, assetFilePaths, referencesByValue = new Map()) {
  const summary = buildResourceContractSummary(resources);
  return (resources || []).map((resource, index) => {
    const id = typeof resource?.id === "string" ? resource.id : "";
    const contract = getResourceGroupContract(resource?.group);
    const assetPath = contract.assetBacked ? resolveResourceAssetPath(resource, assetFilePaths) : "";
    const references = (referencesByValue.get(id) || []).filter((reference) =>
      reference?.path !== "resources.json" && isResourceReferenceLocation(reference?.fieldPath));
    return {
      id,
      group: contract.group,
      value: typeof resource?.value === "string" ? resource.value : "",
      kind: contract.kind,
      contract,
      assetPath,
      assetExists: contract.assetBacked && Boolean(assetPath) && assetFilePaths.has(assetPath),
      duplicate: Boolean(id) && summary.duplicateIds.has(id),
      references,
      sourceIndex: index,
      record: resource,
    };
  });
}
