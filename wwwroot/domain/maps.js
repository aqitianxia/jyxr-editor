export const mapConditionDefinitions = Object.freeze([
  { value: "always", label: "总是" },
  { value: "silver_at_least", label: "银两至少" },
  { value: "gold_at_least", label: "元宝至少" },
  { value: "friendCount", label: "队伍人数至少" },
  { value: "current_map", label: "当前地图是" },
  { value: "event_completed", label: "地图事件已完成" },
  { value: "event_finished", label: "地图事件已完成（别名）" },
  { value: "event_not_completed", label: "地图事件未完成" },
  { value: "event_not_finished", label: "地图事件未完成（别名）" },
  { value: "time_slot", label: "当前时辰是（别名）" },
  { value: "in_time", label: "当前时辰是" },
  { value: "not_in_time", label: "当前时辰不是" },
  { value: "key_in_team", label: "队伍有角色ID" },
  { value: "key_not_in_team", label: "队伍没有角色ID" },
  { value: "in_team", label: "队伍有角色名" },
  { value: "not_in_team", label: "队伍没有角色名" },
  { value: "have_item", label: "拥有物品" },
  { value: "not_have_item", label: "没有物品" },
  { value: "level_greater_than", label: "角色等级至少" },
  { value: "level_less_than", label: "角色等级低于" },
  { value: "shenfa_greater_than", label: "身法至少" },
  { value: "skill_less_than", label: "技能等级低于" },
  { value: "skill_more_than", label: "技能等级至少" },
  { value: "should_finish", label: "已完成剧情" },
  { value: "follow_story", label: "上一个剧情是" },
  { value: "should_not_finish", label: "未完成剧情" },
  { value: "has_time_key", label: "有限时 key" },
  { value: "not_has_time_key", label: "没有限时 key" },
  { value: "exceed_day", label: "超过天数" },
  { value: "not_exceed_day", label: "未超过天数" },
  { value: "in_round", label: "周目是" },
  { value: "not_in_round", label: "周目不是" },
  { value: "zhoumu_greater_than", label: "周目至少" },
  { value: "game_mode", label: "难度是" },
  { value: "in_menpai", label: "门派是" },
  { value: "in_sect", label: "门派是（别名）" },
  { value: "not_in_menpai", label: "门派不是" },
  { value: "not_in_sect", label: "门派不是（别名）" },
  { value: "in_newbie_task", label: "新手任务中" },
].map(Object.freeze));

export const mapConditionTypes = Object.freeze(mapConditionDefinitions.map((definition) => definition.value));

const validTimeSlots = new Set([
  "zi", "chou", "yin", "mao", "chen", "si", "wu", "wei", "shen", "you", "xu", "hai",
  "子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥",
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
  if (["event_completed", "event_finished", "event_not_completed", "event_not_finished"].includes(type)
    && (parts.length !== 1 || value.split("|").length !== 2 || value.split("|").some((part) => !part.trim()))) {
    return "格式应为“地图id|事件id”。";
  }
  if (["time_slot", "in_time", "not_in_time"].includes(type)
    && parts.some((part) => !validTimeSlots.has(part.toLocaleLowerCase("en-US")))) {
    return "包含无法识别的时辰。";
  }
  if (type === "game_mode" && !["normal", "hard", "crazy"].includes(value)) {
    return "难度必须是 normal、hard 或 crazy。";
  }
  return "";
}

export function describeMapCondition(condition) {
  const type = String(condition?.type || "");
  const value = String(condition?.value ?? "").trim();
  const parts = splitConditionValue(value);
  const descriptions = {
    always: "始终满足",
    silver_at_least: `银两不少于 ${value || "?"}`,
    gold_at_least: `元宝不少于 ${value || "?"}`,
    friendCount: `当前队伍至少 ${value || "?"} 人`,
    current_map: `当前地图是「${value || "未填写"}」`,
    event_completed: `事件「${value || "未填写"}」已经完成`,
    event_finished: `事件「${value || "未填写"}」已经完成`,
    event_not_completed: `事件「${value || "未填写"}」尚未完成`,
    event_not_finished: `事件「${value || "未填写"}」尚未完成`,
    should_finish: `剧情「${value || "未填写"}」已经完成`,
    should_not_finish: `剧情「${value || "未填写"}」尚未完成`,
    follow_story: `上一个剧情是「${value || "未填写"}」`,
    in_team: `队伍中有名为「${value || "未填写"}」的角色`,
    not_in_team: `队伍中没有名为「${value || "未填写"}」的角色`,
    key_in_team: `队伍中有角色 ID「${value || "未填写"}」`,
    key_not_in_team: `队伍中没有角色 ID「${value || "未填写"}」`,
    have_item: `拥有「${parts[0] || "未填写"}」至少 ${parts[1] || 1} 个`,
    not_have_item: `未拥有「${parts[0] || "未填写"}」至少 ${parts[1] || 1} 个`,
    in_time: `当前时辰属于「${value || "未填写"}」`,
    time_slot: `当前时辰属于「${value || "未填写"}」`,
    not_in_time: `当前时辰不属于「${value || "未填写"}」`,
    has_time_key: `存在限时 key「${value || "未填写"}」`,
    not_has_time_key: `不存在限时 key「${value || "未填写"}」`,
    in_menpai: `当前门派是「${value || "未填写"}」`,
    in_sect: `当前门派是「${value || "未填写"}」`,
    not_in_menpai: `当前门派不是「${value || "未填写"}」`,
    not_in_sect: `当前门派不是「${value || "未填写"}」`,
    in_round: `当前周目等于 ${value || "?"}`,
    not_in_round: `当前周目不等于 ${value || "?"}`,
    game_mode: `当前难度是「${value || "未填写"}」`,
    exceed_day: `已经超过 ${value || "?"} 天`,
    not_exceed_day: `尚未超过 ${value || "?"} 天`,
    zhoumu_greater_than: `当前周目不少于 ${value || "?"}`,
    level_greater_than: `角色「${parts[0] || "未填写"}」等级不少于 ${parts[1] || "?"}`,
    level_less_than: `角色「${parts[0] || "未填写"}」等级低于 ${parts[1] || "?"}`,
    shenfa_greater_than: `角色「${parts[0] || "未填写"}」身法不少于 ${parts[1] || "?"}`,
    skill_more_than: `角色「${parts[0] || "未填写"}」的「${parts[1] || "未填写"}」等级不少于 ${parts[2] || "?"}`,
    skill_less_than: `角色「${parts[0] || "未填写"}」的「${parts[1] || "未填写"}」等级低于 ${parts[2] || "?"}`,
    in_newbie_task: "新手任务状态尚未建模，运行时始终不满足",
  };
  return descriptions[type] || `未支持条件「${type || "未填写"}」`;
}

export function getMapConditionReferences(condition) {
  const type = String(condition?.type || "");
  const value = String(condition?.value ?? "").trim();
  const parts = splitConditionValue(value);
  if (!value) return [];
  if (type === "current_map") return [{ id: value, types: ["maps"], label: "地图" }];
  if (["event_completed", "event_finished", "event_not_completed", "event_not_finished"].includes(type)) {
    return [{ id: value, types: ["map-events"], label: "地图事件" }];
  }
  if (["should_finish", "should_not_finish", "follow_story"].includes(type)) {
    return [{ id: value, types: ["story"], label: "剧情" }];
  }
  if (["in_team", "not_in_team", "key_in_team", "key_not_in_team", "level_greater_than", "level_less_than", "shenfa_greater_than"].includes(type)) {
    return [{ id: parts[0] || value, types: ["characters"], label: "角色" }];
  }
  if (["have_item", "not_have_item"].includes(type)) {
    return [{ id: parts[0] || value, types: ["items"], label: "物品" }];
  }
  if (["skill_more_than", "skill_less_than"].includes(type)) {
    return [
      { id: parts[0] || "", types: ["characters"], label: "角色" },
      { id: parts[1] || "", types: ["external-skills", "internal-skills"], label: "技能" },
    ].filter((reference) => reference.id);
  }
  if (["in_menpai", "in_sect", "not_in_menpai", "not_in_sect"].includes(type)) {
    return [{ id: value, types: ["sects"], label: "门派" }];
  }
  return [];
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
            id: "返回_map_1",
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
  const eventIds = new Set();
  for (const location of record.locations) {
    ensureMapLocationShape(location);
    location.events.forEach((event, eventIndex) => {
      const currentId = String(event.id || "").trim();
      if (currentId && !eventIds.has(currentId)) {
        event.id = currentId;
        eventIds.add(currentId);
        return;
      }
      event.id = createUniqueIdFromSet(
        eventIds,
        `${normalizeIdSeed(location.id, "location")}_${normalizeIdSeed(event.type, "event")}_${eventIndex + 1}`,
      );
    });
  }
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

export function moveMapEventWithinLocation(location, fromIndex, toIndex) {
  const events = Array.isArray(location?.events) ? location.events : [];
  if (fromIndex < 0 || fromIndex >= events.length || toIndex < 0 || toIndex >= events.length) return fromIndex;
  if (fromIndex === toIndex) return fromIndex;
  const [mapEvent] = events.splice(fromIndex, 1);
  events.splice(toIndex, 0, mapEvent);
  return toIndex;
}

export function moveMapEventToLocation(record, sourceLocationIndex, eventIndex, targetLocationIndex) {
  const locations = Array.isArray(record?.locations) ? record.locations : [];
  const source = locations[sourceLocationIndex];
  const target = locations[targetLocationIndex];
  if (!source || !target || eventIndex < 0 || eventIndex >= (source.events || []).length) return null;
  const [mapEvent] = source.events.splice(eventIndex, 1);
  target.events.push(mapEvent);
  return { mapEvent, targetEventIndex: target.events.length - 1 };
}

export function simulateMapLocationEvents(mapId, location, scenario = {}) {
  const normalized = normalizeSimulationScenario(scenario);
  const results = [];
  let selectedIndex = -1;
  for (const [index, mapEvent] of (location?.events || []).entries()) {
    const conditionResults = (mapEvent.conditions || []).map((condition) => evaluateMapConditionForSimulation(condition, normalized));
    const completedKey = mapEvent.type === "story" ? mapEvent.targetId : `${mapId}|${mapEvent.id}`;
    const alreadyCompleted = mapEvent.repeatMode === "once" && (
      mapEvent.type === "story"
        ? normalized.completedStories.has(String(mapEvent.targetId || ""))
        : normalized.completedEvents.has(completedKey)
    );
    const probability = Math.max(0, Math.min(100, Number(mapEvent.probability) || 0));
    const probabilityPassed = normalized.probabilityRoll < probability;
    const conditionsPassed = conditionResults.every((result) => result.passed);
    const eligible = selectedIndex < 0 && !alreadyCompleted && conditionsPassed && probabilityPassed;
    if (eligible) selectedIndex = index;
    results.push({
      index,
      eventId: String(mapEvent.id || ""),
      eligible,
      alreadyCompleted,
      conditionsPassed,
      probability,
      probabilityPassed,
      conditionResults,
      reached: selectedIndex < 0 || selectedIndex === index,
    });
  }
  return {
    selectedIndex,
    selectedEvent: selectedIndex >= 0 ? location.events[selectedIndex] : null,
    results,
  };
}

export function evaluateMapConditionForSimulation(condition, scenario = {}) {
  const normalized = scenario?.completedStories instanceof Set ? scenario : normalizeSimulationScenario(scenario);
  const type = String(condition?.type || "");
  const value = String(condition?.value ?? "").trim();
  const parts = splitConditionValue(value);
  const issue = getMapConditionValueIssue(condition);
  if (issue) return { passed: false, message: issue };
  const amount = Number(parts[1] ?? value);
  const threshold = Number(parts[2] ?? parts[1] ?? value);
  let passed;
  switch (type) {
    case "always": passed = true; break;
    case "silver_at_least": passed = normalized.silver >= Number(value); break;
    case "gold_at_least": passed = normalized.gold >= Number(value); break;
    case "friendCount": passed = normalized.partyMembers.size >= Number(value); break;
    case "current_map": passed = normalized.currentMapId === value; break;
    case "event_completed":
    case "event_finished": passed = normalized.completedEvents.has(value); break;
    case "event_not_completed":
    case "event_not_finished": passed = !normalized.completedEvents.has(value); break;
    case "time_slot":
    case "in_time": passed = parts.map(normalizeTimeSlot).includes(normalized.timeSlot); break;
    case "not_in_time": passed = !parts.map(normalizeTimeSlot).includes(normalized.timeSlot); break;
    case "key_in_team":
    case "in_team": passed = normalized.partyMembers.has(value); break;
    case "key_not_in_team":
    case "not_in_team": passed = !normalized.partyMembers.has(value); break;
    case "have_item": passed = (normalized.items[value ? parts[0] : ""] || 0) >= (parts.length > 1 ? amount : 1) && (parts.length <= 1 || amount > 0); break;
    case "not_have_item": passed = !((normalized.items[value ? parts[0] : ""] || 0) >= (parts.length > 1 ? amount : 1) && (parts.length <= 1 || amount > 0)); break;
    case "level_greater_than": passed = normalized.partyMembers.has(parts[0]) && hasNumericEntry(normalized.characterLevels, parts[0]) && normalized.characterLevels[parts[0]] >= threshold; break;
    case "level_less_than": passed = normalized.partyMembers.has(parts[0]) && hasNumericEntry(normalized.characterLevels, parts[0]) && normalized.characterLevels[parts[0]] < threshold; break;
    case "shenfa_greater_than": passed = normalized.partyMembers.has(parts[0]) && hasNumericEntry(normalized.characterShenfa, parts[0]) && normalized.characterShenfa[parts[0]] >= threshold; break;
    case "skill_more_than": {
      const level = normalized.partyMembers.has(parts[0])
        ? normalized.skillLevels[parts[0]]?.[parts[1]] ?? 0
        : 0;
      passed = level >= threshold;
      break;
    }
    case "skill_less_than": {
      const level = normalized.skillLevels[parts[0]]?.[parts[1]] ?? 0;
      passed = normalized.partyMembers.has(parts[0]) && level < threshold;
      break;
    }
    case "should_finish": passed = normalized.completedStories.has(value); break;
    case "follow_story": passed = normalized.lastStoryId === value; break;
    case "should_not_finish": passed = !normalized.completedStories.has(value); break;
    case "has_time_key": passed = normalized.timeKeys.has(value); break;
    case "not_has_time_key": passed = !normalized.timeKeys.has(value); break;
    case "exceed_day": passed = normalized.totalDays > Number(value); break;
    case "not_exceed_day": passed = normalized.totalDays <= Number(value); break;
    case "in_round": passed = normalized.round === Number(value); break;
    case "not_in_round": passed = normalized.round !== Number(value); break;
    case "zhoumu_greater_than": passed = normalized.round >= Number(value); break;
    case "game_mode": passed = normalized.difficulty === value; break;
    case "in_menpai":
    case "in_sect": passed = normalized.sectId === value; break;
    case "not_in_menpai":
    case "not_in_sect": passed = normalized.sectId !== value; break;
    case "in_newbie_task": passed = false; break;
    default: return { passed: false, message: `未支持条件：${type}` };
  }
  return { passed, message: describeMapCondition(condition) };
}

export function ensureMapLocationShape(location) {
  if (typeof location.id !== "string") location.id = "";
  if (location.name != null && typeof location.name !== "string") location.name = String(location.name);
  if (!Array.isArray(location.events)) location.events = [];
  location.events = location.events.map((event) => isObject(event) ? event : createEventDefinition());
  for (const event of location.events) ensureMapEventShape(event);
}

export function ensureMapEventShape(event) {
  if (typeof event.id !== "string") event.id = "";
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

export function createMapEventDefinition(record, location, overrides = {}) {
  const type = String(overrides.type || "story").trim() || "story";
  return {
    id: createUniqueMapEventId(record, `${normalizeIdSeed(location?.id, "location")}_${normalizeIdSeed(type, "event")}`),
    type,
    targetId: "",
    probability: 100,
    description: "",
    conditions: [],
    ...overrides,
  };
}

export function createUniqueMapEventId(record, baseId = "event") {
  const used = new Set(
    (record?.locations || []).flatMap((location) => (
      (location?.events || []).map((event) => String(event?.id || "").trim()).filter(Boolean)
    )),
  );
  return createUniqueIdFromSet(used, normalizeIdSeed(baseId, "event"));
}

export function findMapReferences(records, mapId) {
  const targetId = String(mapId || "").trim();
  if (!targetId) return [];
  const references = [];
  for (const map of records || []) {
    for (const location of map?.locations || []) {
      for (const mapEvent of location?.events || []) {
        if (mapEvent?.type === "map" && mapEvent.targetId === targetId) {
          references.push({
            kind: "event-target",
            mapId: String(map?.id || ""),
            locationId: String(location?.id || ""),
            eventId: String(mapEvent?.id || ""),
          });
        }
        for (const condition of mapEvent?.conditions || []) {
          if (condition?.type === "current_map" && condition.value === targetId) {
            references.push({
              kind: "condition",
              mapId: String(map?.id || ""),
              locationId: String(location?.id || ""),
              eventId: String(mapEvent?.id || ""),
            });
          }
        }
      }
    }
  }
  return references;
}

export function renameMapId(records, oldId, newId) {
  const sourceId = String(oldId || "").trim();
  const targetId = String(newId || "").trim();
  if (!sourceId || !targetId) throw new Error("地图 ID 不能为空。");
  if (targetId.includes("|")) throw new Error("地图 ID 不能包含 |。");
  if (sourceId !== targetId && (records || []).some((record) => record?.id === targetId)) {
    throw new Error(`地图 ID「${targetId}」已存在。`);
  }
  const record = (records || []).find((item) => item?.id === sourceId);
  if (!record) throw new Error(`找不到地图「${sourceId}」。`);

  let updatedReferences = 0;
  for (const map of records || []) {
    for (const location of map?.locations || []) {
      for (const mapEvent of location?.events || []) {
        if (mapEvent?.type === "map" && mapEvent.targetId === sourceId) {
          mapEvent.targetId = targetId;
          updatedReferences += 1;
        }
        for (const condition of mapEvent?.conditions || []) {
          if (condition?.type === "current_map" && condition.value === sourceId) {
            condition.value = targetId;
            updatedReferences += 1;
          }
        }
      }
    }
  }
  record.id = targetId;
  return { record, updatedReferences };
}

function createLocationDefinition() {
  return { id: "", name: "", description: "", picture: null, events: [] };
}

function createEventDefinition() {
  return { id: "", type: "story", targetId: "", probability: 100, conditions: [] };
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

function splitConditionValue(value) {
  return String(value || "").split("#").map((part) => part.trim()).filter(Boolean);
}

function normalizeSimulationScenario(scenario) {
  return {
    silver: Math.max(0, Number(scenario.silver) || 0),
    gold: Math.max(0, Number(scenario.gold) || 0),
    currentMapId: String(scenario.currentMapId || ""),
    timeSlot: normalizeTimeSlot(scenario.timeSlot || "Zi"),
    partyMembers: toStringSet(scenario.partyMembers),
    completedStories: toStringSet(scenario.completedStories),
    completedEvents: toStringSet(scenario.completedEvents),
    timeKeys: toStringSet(scenario.timeKeys),
    items: normalizeNumberRecord(scenario.items),
    characterLevels: normalizeNumberRecord(scenario.characterLevels),
    characterShenfa: normalizeNumberRecord(scenario.characterShenfa),
    skillLevels: normalizeSkillRecord(scenario.skillLevels),
    lastStoryId: String(scenario.lastStoryId || ""),
    totalDays: Math.max(0, Number(scenario.totalDays) || 0),
    round: Math.max(0, Number(scenario.round) || 0),
    difficulty: String(scenario.difficulty || "normal"),
    sectId: String(scenario.sectId || ""),
    probabilityRoll: Math.max(0, Math.min(99, Math.trunc(Number(scenario.probabilityRoll) || 0))),
  };
}

function toStringSet(value) {
  if (value instanceof Set) return new Set(Array.from(value, (item) => String(item)));
  if (Array.isArray(value)) return new Set(value.map((item) => String(item)).filter(Boolean));
  return new Set();
}

function normalizeNumberRecord(value) {
  const result = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return result;
  for (const [key, entry] of Object.entries(value)) {
    const number = Number(entry);
    if (key && Number.isFinite(number)) result[key] = Math.max(0, number);
  }
  return result;
}

function normalizeSkillRecord(value) {
  const result = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return result;
  for (const [characterId, skills] of Object.entries(value)) {
    result[characterId] = normalizeNumberRecord(skills);
  }
  return result;
}

function normalizeTimeSlot(value) {
  const aliases = {
    "子": "zi", "丑": "chou", "寅": "yin", "卯": "mao", "辰": "chen", "巳": "si",
    "午": "wu", "未": "wei", "申": "shen", "酉": "you", "戌": "xu", "亥": "hai",
  };
  const normalized = String(value || "").trim();
  return aliases[normalized] || normalized.toLocaleLowerCase("en-US");
}

function hasNumericEntry(record, key) {
  return Object.prototype.hasOwnProperty.call(record, key) && Number.isFinite(record[key]);
}

function normalizeIdSeed(value, fallback) {
  const normalized = String(value || "")
    .trim()
    .replace(/[|\\/\s]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized || fallback;
}

function createUniqueIdFromSet(used, baseId) {
  if (!used.has(baseId)) {
    used.add(baseId);
    return baseId;
  }
  for (let index = 2; index < 10000; index += 1) {
    const candidate = `${baseId}_${index}`;
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
  }
  const candidate = `${baseId}_${Date.now()}`;
  used.add(candidate);
  return candidate;
}
