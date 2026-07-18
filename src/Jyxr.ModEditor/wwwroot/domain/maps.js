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
  if (["event_completed", "event_finished", "event_not_completed", "event_not_finished"].includes(type)) {
    const eventKeyParts = value.split("|").map((part) => part.trim());
    if (parts.length !== 1 || eventKeyParts.length !== 3 || eventKeyParts.some((part) => !part)
      || !isNonNegativeInteger(eventKeyParts[2])) {
      return "格式应为“地图id|点位id|事件序号”，事件序号从 0 开始。";
    }
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
  if (!source || !target) return null;
  const sourceEvents = Array.isArray(source.events) ? source.events : [];
  const targetEvents = Array.isArray(target.events) ? target.events : [];
  if (eventIndex < 0 || eventIndex >= sourceEvents.length) return null;
  if (!Array.isArray(source.events)) source.events = sourceEvents;
  if (!Array.isArray(target.events)) target.events = targetEvents;
  const [mapEvent] = sourceEvents.splice(eventIndex, 1);
  targetEvents.push(mapEvent);
  return { mapEvent, targetEventIndex: targetEvents.length - 1 };
}

export function createMapEventDefinition(_record, _location, overrides = {}) {
  return {
    type: String(overrides.type || "story").trim() || "story",
    targetId: "",
    probability: 100,
    description: "",
    conditions: [],
    ...overrides,
  };
}

export function findMapReferences(records, mapId) {
  const targetId = String(mapId || "").trim();
  if (!targetId) return [];
  const references = [];
  for (const map of records || []) {
    for (const location of map?.locations || []) {
      for (const [eventIndex, mapEvent] of (location?.events || []).entries()) {
        const eventKey = `${String(map?.id || "")}|${String(location?.id || "")}|${eventIndex}`;
        if (mapEvent?.type === "map" && mapEvent.targetId === targetId) {
          references.push({
            kind: "event-target",
            mapId: String(map?.id || ""),
            locationId: String(location?.id || ""),
            eventKey,
          });
        }
        for (const condition of mapEvent?.conditions || []) {
          if (condition?.type === "current_map" && condition.value === targetId) {
            references.push({
              kind: "condition",
              mapId: String(map?.id || ""),
              locationId: String(location?.id || ""),
              eventKey,
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

function isNonNegativeInteger(value) {
  return /^\d+$/.test(String(value || "").trim());
}

function splitConditionValue(value) {
  return String(value || "").split("#").map((part) => part.trim()).filter(Boolean);
}
