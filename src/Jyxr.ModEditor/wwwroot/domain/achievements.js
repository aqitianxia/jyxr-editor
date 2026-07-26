export const achievementGroup = "nick";
export const achievementPrefix = `${achievementGroup}.`;

export function getAchievementTitle(resource) {
  const id = String(resource?.id || "").trim();
  return id.startsWith(achievementPrefix) ? id.slice(achievementPrefix.length) : id;
}

export function isAchievementResource(resource) {
  return resource?.group === achievementGroup && String(resource?.id || "").startsWith(achievementPrefix);
}

export function createAchievementResource(title = "新成就") {
  const normalized = String(title || "新成就").trim() || "新成就";
  return { id: `${achievementPrefix}${normalized}`, group: achievementGroup, value: "" };
}

export function createWorldTriggerDefinition(id = "新世界触发器") {
  return {
    id,
    type: "story",
    targetId: "",
    probability: 100,
    repeatMode: "once",
    conditions: [],
  };
}

export function collectAchievementUnlockSources(path, root) {
  const sources = [];
  if (String(path).endsWith(".story.json")) {
    for (const segment of Array.isArray(root?.segments) ? root.segments : []) {
      visitStoryValue(segment?.steps, segment?.name || "", path, sources);
    }
  } else if (String(path).endsWith("towers.json")) {
    for (const tower of Array.isArray(root) ? root : []) {
      for (const stage of Array.isArray(tower?.stages) ? tower.stages : []) {
        for (const title of Array.isArray(stage?.achievementIds) ? stage.achievementIds : []) {
          if (typeof title !== "string" || !title.trim()) continue;
          sources.push({
            achievementId: title.trim(),
            kind: "tower",
            path,
            ownerId: tower?.id || "",
            segmentId: "",
            detail: stage?.name || stage?.id || "爬塔层级",
          });
        }
      }
    }
  }
  return sources;
}

function visitStoryValue(value, segmentId, path, sources) {
  if (Array.isArray(value)) {
    for (const child of value) visitStoryValue(child, segmentId, path, sources);
    return;
  }
  if (!value || typeof value !== "object") return;
  if (value.kind === "command" && value.name === "nick") {
    const title = typeof value.args?.[0] === "string" ? value.args[0].trim() : "";
    if (title) {
      sources.push({
        achievementId: title,
        kind: "story",
        path,
        ownerId: segmentId,
        segmentId,
        detail: `剧情命令 nick ${title}`,
      });
    }
  }
  for (const child of Object.values(value)) visitStoryValue(child, segmentId, path, sources);
}

export function indexAchievementUnlockSources(sources) {
  const byId = new Map();
  for (const source of sources || []) {
    const id = String(source?.achievementId || "").trim();
    if (!id) continue;
    const entries = byId.get(id) || [];
    entries.push(source);
    byId.set(id, entries);
  }
  return byId;
}

export function getMissingAchievementReferences(resources, sourcesById) {
  const defined = new Set((resources || []).filter(isAchievementResource).map(getAchievementTitle));
  return [...sourcesById.entries()]
    .filter(([id]) => !defined.has(id))
    .map(([id, sources]) => ({ id, sources }))
    .sort((left, right) => left.id.localeCompare(right.id, "zh-CN"));
}
