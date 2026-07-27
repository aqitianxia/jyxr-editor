import { getMapConditionValueIssue } from "./maps.js?v=20260718-map-runtime-keys-1";

export const achievementGroup = "nick";
export const achievementPrefix = `${achievementGroup}.`;

export const worldTriggerTypes = Object.freeze([
  { value: "story", label: "播放剧情", referenceType: "story" },
  { value: "shop", label: "打开商店", referenceType: "shops" },
  { value: "xiangzi", label: "打开储物箱", referenceType: "" },
  { value: "battle", label: "进入战斗", referenceType: "battles" },
].map(Object.freeze));

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

export function getWorldTriggerIssues(trigger, targetOptions = {}, allTriggers = []) {
  const issues = [];
  const id = String(trigger?.id || "").trim();
  const type = String(trigger?.type || "");
  const typeDefinition = worldTriggerTypes.find((entry) => entry.value === type);
  if (!id) issues.push("缺少触发器 ID");
  if (id && allTriggers.filter((entry) => entry?.id === id).length > 1) issues.push("触发器 ID 重复");
  if (!typeDefinition) {
    issues.push(`不支持的触发类型：${type || "空"}`);
  } else if (typeDefinition.referenceType) {
    const targets = targetOptions[type] || [];
    if (!String(trigger?.targetId || "").trim()) issues.push("缺少目标 ID");
    else if (!targets.some((option) => option.id === trigger.targetId)) issues.push(`目标${typeDefinition.label.slice(2)}不存在`);
  }
  const probability = trigger?.probability ?? 100;
  if (!Number.isInteger(probability) || probability < 0 || probability > 100) issues.push("概率必须是 0 到 100 的整数");
  const repeatMode = trigger?.repeatMode ?? "once";
  if (!["once", "infinite"].includes(repeatMode)) issues.push("触发次数必须是 once 或 infinite");
  if (!Array.isArray(trigger?.conditions)) issues.push("触发条件必须是数组");
  for (const condition of Array.isArray(trigger?.conditions) ? trigger.conditions : []) {
    const issue = getMapConditionValueIssue(condition);
    if (issue) issues.push(`${condition.type || "条件"}：${issue}`);
  }
  return issues;
}

export function moveWorldTrigger(triggers, index, direction) {
  const target = index + direction;
  if (!Array.isArray(triggers) || index < 0 || index >= triggers.length || target < 0 || target >= triggers.length) return triggers;
  const moved = [...triggers];
  [moved[index], moved[target]] = [moved[target], moved[index]];
  return moved;
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
