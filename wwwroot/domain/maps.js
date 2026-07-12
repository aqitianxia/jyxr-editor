export const mapConditionTypes = Object.freeze([
  "always", "silver_at_least", "gold_at_least", "friendCount", "current_map",
  "event_completed", "event_finished", "event_not_completed", "event_not_finished",
  "time_slot", "in_time", "not_in_time", "key_in_team", "key_not_in_team", "in_team", "not_in_team",
  "have_item", "not_have_item", "level_greater_than", "level_less_than", "shenfa_greater_than",
  "skill_less_than", "skill_more_than", "should_finish", "follow_story", "should_not_finish",
  "has_time_key", "not_has_time_key", "exceed_day", "not_exceed_day", "in_round", "not_in_round",
  "zhoumu_greater_than", "game_mode", "in_menpai", "in_sect", "not_in_menpai", "not_in_sect",
  "in_newbie_task",
]);

export function getMapConditionValueIssue(condition) {
  const type = String(condition?.type || "");
  const value = String(condition?.value ?? "").trim();
  if (type === "always" || type === "in_newbie_task") return "";
  if (!value) return "缺少值。";

  const parts = value.split("#").map((part) => part.trim()).filter(Boolean);
  const nonNegativeIntegerTypes = new Set([
    "silver_at_least", "gold_at_least", "friendCount", "exceed_day", "not_exceed_day",
    "in_round", "not_in_round", "zhoumu_greater_than",
  ]);
  if (nonNegativeIntegerTypes.has(type) && !isNonNegativeInteger(value)) return "必须填写非负整数。";
  if (["have_item", "not_have_item"].includes(type)
    && (parts.length > 2 || (parts.length === 2 && !isNonNegativeInteger(parts[1])))) {
    return "格式应为“物品id”或“物品id#非负数量”。";
  }
  if (["level_greater_than", "level_less_than", "shenfa_greater_than"].includes(type)
    && (parts.length !== 2 || !isNonNegativeInteger(parts[1]))) {
    return "格式应为“角色#非负数值”。";
  }
  if (["skill_more_than", "skill_less_than"].includes(type)
    && (parts.length !== 3 || !isNonNegativeInteger(parts[2]))) {
    return "格式应为“角色#技能#非负等级”。";
  }
  return "";
}

export function createMapDefinition(id = "新地图") {
  return {
    id,
    name: id,
    kind: "small",
    description: "",
    picture: `地图.${id}`,
    musics: [],
    locations: [
      {
        id: "返回",
        name: "返回",
        position: { x: -1, y: -1 },
        description: "返回大地图",
        picture: null,
        events: [
          {
            type: "map",
            targetId: "大地图",
            probability: 100,
            description: "返回大地图",
            conditions: [],
          },
        ],
      },
    ],
  };
}

export function ensureMapShape(record) {
  if (!record || Array.isArray(record) || typeof record !== "object") return record;
  if (typeof record.id !== "string") record.id = "";
  if (typeof record.name !== "string") record.name = record.id;
  if (!Array.isArray(record.musics)) record.musics = [];
  if (!Array.isArray(record.locations)) record.locations = [];

  record.locations = record.locations.map((location) => (
    isObject(location) ? location : createLocationDefinition()
  ));
  for (const location of record.locations) ensureMapLocationShape(location);
  return record;
}

export function matchesMapSearch(record, query) {
  const normalized = String(query || "").trim().toLocaleLowerCase("zh-CN");
  if (!normalized) return true;
  const locationText = (record?.locations || []).flatMap((location) => [
    location?.id,
    location?.name,
    location?.description,
    ...(location?.events || []).flatMap((event) => [
      event?.type,
      event?.targetId,
      event?.description,
      ...(event?.conditions || []).flatMap((condition) => [condition?.type, condition?.value]),
    ]),
  ]);
  return [
    record?.id,
    record?.name,
    record?.description,
    record?.picture,
    ...(record?.musics || []),
    ...locationText,
  ].some((value) => String(value || "").toLocaleLowerCase("zh-CN").includes(normalized));
}

export function moveMapLocation(record, index, delta) {
  const locations = Array.isArray(record?.locations) ? record.locations : [];
  const nextIndex = index + delta;
  if (index < 0 || index >= locations.length || nextIndex < 0 || nextIndex >= locations.length) return index;
  const [location] = locations.splice(index, 1);
  locations.splice(nextIndex, 0, location);
  return nextIndex;
}

export function ensureMapLocationShape(location) {
  if (typeof location.id !== "string") location.id = "";
  if (location.name != null && typeof location.name !== "string") location.name = String(location.name);
  if (!Array.isArray(location.events)) location.events = [];
  location.events = location.events.map((event) => isObject(event) ? event : createEventDefinition());
  for (const event of location.events) ensureMapEventShape(event);
}

export function ensureMapEventShape(event) {
  if (typeof event.type !== "string" || !event.type.trim()) event.type = "story";
  if (typeof event.targetId !== "string") event.targetId = "";
  if (!Number.isFinite(event.probability)) event.probability = 100;
  if (!Array.isArray(event.conditions)) event.conditions = [];
  event.conditions = event.conditions.map((condition) => isObject(condition) ? condition : createConditionDefinition());
  for (const condition of event.conditions) {
    if (typeof condition.type !== "string") condition.type = "always";
    if (condition.value == null) condition.value = "";
    else if (typeof condition.value !== "string") condition.value = String(condition.value);
  }
}

function createLocationDefinition() {
  return { id: "", name: "", description: "", picture: null, events: [] };
}

function createEventDefinition() {
  return { type: "story", targetId: "", probability: 100, conditions: [] };
}

function createConditionDefinition() {
  return { type: "always", value: "" };
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonNegativeInteger(value) {
  return /^\d+$/.test(String(value || "").trim());
}
