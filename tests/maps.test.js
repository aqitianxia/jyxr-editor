import assert from "node:assert/strict";
import test from "node:test";
import { createMapDefinition, createMapEventDefinition, describeMapCondition, ensureMapShape, findMapReferences, getMapConditionReferences, getMapConditionValueIssue, mapConditionTypes, matchesMapSearch, moveMapEventToLocation, moveMapEventWithinLocation, moveMapLocation, renameMapId, simulateMapLocationEvents } from "../wwwroot/domain/maps.js";

test("新建地图只使用运行时支持的字段", () => {
  assert.deepEqual(createMapDefinition("测试地图"), {
    id: "测试地图",
    name: "测试地图",
    kind: "small",
    description: "",
    picture: "地图.测试地图",
    musics: [],
    locations: [{
      id: "返回",
      name: "返回",
      position: { x: -1, y: -1 },
      description: "返回大地图",
      picture: null,
      events: [{ id: "返回_map_1", type: "map", targetId: "大地图", probability: 100, description: "返回大地图", conditions: [] }],
    }],
  });
});

test("结构补齐保留地图、点位、事件和条件的未知字段", () => {
  const record = {
    id: "测试",
    extension: { map: true },
    locations: [{
      id: "入口",
      extension: { location: true },
      events: [{
        type: "story",
        targetId: "开场",
        probability: 100,
        extension: { event: true },
        conditions: [{ type: "always", value: "", extension: { condition: true } }],
      }],
    }],
  };
  assert.equal(ensureMapShape(record), record);
  assert.deepEqual(record.extension, { map: true });
  assert.deepEqual(record.locations[0].extension, { location: true });
  assert.deepEqual(record.locations[0].events[0].extension, { event: true });
  assert.deepEqual(record.locations[0].events[0].conditions[0].extension, { condition: true });
});

test("结构补齐不改写大地图坐标", () => {
  const record = { id: "大地图", kind: "large", locations: [{ id: "山门", position: { x: 112.5, y: -8 }, events: [] }] };
  ensureMapShape(record);
  assert.deepEqual(record.locations[0].position, { x: 112.5, y: -8 });
});

test("结构补齐为缺失和重复事件生成地图内唯一稳定 ID", () => {
  const record = {
    id: "大地图",
    locations: [
      { id: "山门", events: [{ type: "story" }, { id: "固定事件", type: "map" }] },
      { id: "客栈", events: [{ id: "固定事件", type: "shop" }] },
    ],
  };
  ensureMapShape(record);
  assert.deepEqual(record.locations.flatMap((location) => location.events.map((event) => event.id)), [
    "山门_story_1",
    "固定事件",
    "客栈_shop_1",
  ]);
});

test("新增事件 ID 在同一地图内保持唯一", () => {
  const record = { locations: [{ id: "入口", events: [{ id: "入口_story", type: "story" }] }] };
  const created = createMapEventDefinition(record, record.locations[0]);
  assert.equal(created.id, "入口_story_2");
});

test("地图重命名更新进入地图事件和 current_map 条件", () => {
  const records = [
    { id: "旧地图", locations: [] },
    { id: "入口", locations: [{ id: "门", events: [
      { id: "enter", type: "map", targetId: "旧地图", conditions: [] },
      { id: "condition", type: "story", targetId: "剧情", conditions: [{ type: "current_map", value: "旧地图" }] },
    ] }] },
  ];
  assert.equal(findMapReferences(records, "旧地图").length, 2);
  assert.deepEqual(renameMapId(records, "旧地图", "新地图").updatedReferences, 2);
  assert.equal(records[0].id, "新地图");
  assert.equal(records[1].locations[0].events[0].targetId, "新地图");
  assert.equal(records[1].locations[0].events[1].conditions[0].value, "新地图");
});

test("搜索覆盖地图、点位、事件目标和条件", () => {
  const record = {
    id: "洛阳",
    name: "洛阳城",
    locations: [{ id: "酒馆", events: [{ type: "story", targetId: "风陵夜话", conditions: [{ type: "in_team", value: "郭襄" }] }] }],
  };
  assert.equal(matchesMapSearch(record, "酒馆"), true);
  assert.equal(matchesMapSearch(record, "风陵夜话"), true);
  assert.equal(matchesMapSearch(record, "郭襄"), true);
  assert.equal(matchesMapSearch(record, "襄阳"), false);
});

test("点位排序保留对象和未知字段", () => {
  const first = { id: "甲", custom: 1 };
  const second = { id: "乙", custom: 2 };
  const record = { locations: [first, second] };
  assert.equal(moveMapLocation(record, 0, 1), 1);
  assert.equal(record.locations[1], first);
  assert.equal(record.locations[1].custom, 1);
});

test("事件支持点位内排序和跨点位移动并保留对象", () => {
  const first = { id: "first", type: "story", extension: { keep: true } };
  const second = { id: "second", type: "map" };
  const record = { locations: [{ id: "甲", events: [first, second] }, { id: "乙", events: [] }] };

  assert.equal(moveMapEventWithinLocation(record.locations[0], 0, 1), 1);
  assert.equal(record.locations[0].events[1], first);
  const moved = moveMapEventToLocation(record, 0, 1, 1);
  assert.equal(moved.mapEvent, first);
  assert.equal(record.locations[1].events[0].extension.keep, true);
  assert.equal(record.locations[0].events.length, 1);
});

test("地图条件清单与运行时解析器保持一致", () => {
  assert.deepEqual(mapConditionTypes, [
    "always", "silver_at_least", "gold_at_least", "friendCount", "current_map",
    "event_completed", "event_finished", "event_not_completed", "event_not_finished",
    "time_slot", "in_time", "not_in_time", "key_in_team", "key_not_in_team", "in_team", "not_in_team",
    "have_item", "not_have_item", "level_greater_than", "level_less_than", "shenfa_greater_than",
    "skill_less_than", "skill_more_than", "should_finish", "follow_story", "should_not_finish",
    "has_time_key", "not_has_time_key", "exceed_day", "not_exceed_day", "in_round", "not_in_round",
    "zhoumu_greater_than", "game_mode", "in_menpai", "in_sect", "not_in_menpai", "not_in_sect",
    "in_newbie_task",
  ]);
});

test("地图条件参数按运行时分隔与非负整数规则检查", () => {
  assert.equal(getMapConditionValueIssue({ type: "always", value: "" }), "");
  assert.equal(getMapConditionValueIssue({ type: "silver_at_least", value: "100" }), "");
  assert.equal(getMapConditionValueIssue({ type: "silver_at_least", value: "-1" }), "必须填写非负整数。");
  assert.equal(getMapConditionValueIssue({ type: "have_item", value: "小还丹#2" }), "");
  assert.equal(getMapConditionValueIssue({ type: "level_greater_than", value: "主角#10" }), "");
  assert.equal(getMapConditionValueIssue({ type: "skill_more_than", value: "主角#太极拳#5" }), "");
  assert.match(getMapConditionValueIssue({ type: "skill_more_than", value: "主角#太极拳" }), /角色#技能/);
  assert.equal(getMapConditionValueIssue({ type: "event_completed", value: "大地图|黑木崖_story_1" }), "");
  assert.match(getMapConditionValueIssue({ type: "event_completed", value: "大地图|黑木崖|1" }), /地图id\|事件id/);
  assert.equal(getMapConditionValueIssue({ type: "in_time", value: "子#Wu" }), "");
  assert.match(getMapConditionValueIssue({ type: "in_time", value: "早晨" }), /时辰/);
  assert.match(getMapConditionValueIssue({ type: "game_mode", value: "nightmare" }), /normal/);
});

test("地图条件提供运行时含义和引用目标", () => {
  assert.equal(describeMapCondition({ type: "skill_more_than", value: "主角#太极拳#5" }), "角色「主角」的「太极拳」等级不少于 5");
  assert.deepEqual(getMapConditionReferences({ type: "skill_more_than", value: "主角#太极拳#5" }), [
    { id: "主角", types: ["characters"], label: "角色" },
    { id: "太极拳", types: ["external-skills", "internal-skills"], label: "技能" },
  ]);
  assert.deepEqual(getMapConditionReferences({ type: "event_completed", value: "大地图|黑木崖_story_1" }), [
    { id: "大地图|黑木崖_story_1", types: ["map-events"], label: "地图事件" },
  ]);
});

test("触发模拟按一次性、条件、概率和事件顺序选择首个事件", () => {
  const location = {
    events: [
      { id: "intro", type: "story", targetId: "开场", repeatMode: "once", probability: 100, conditions: [] },
      { id: "night", type: "story", targetId: "夜话", probability: 50, conditions: [
        { type: "in_time", value: "子#Zi" },
        { type: "in_team", value: "郭襄" },
        { type: "silver_at_least", value: "100" },
      ] },
      { id: "fallback", type: "map", targetId: "洛阳", probability: 100, conditions: [] },
    ],
  };
  const result = simulateMapLocationEvents("大地图", location, {
    timeSlot: "Zi",
    partyMembers: ["郭襄"],
    completedStories: ["开场"],
    silver: 100,
    probabilityRoll: 20,
  });

  assert.equal(result.selectedIndex, 1);
  assert.equal(result.selectedEvent.id, "night");
  assert.equal(result.results[0].alreadyCompleted, true);
  assert.equal(result.results[1].conditionsPassed, true);
  assert.equal(result.results[1].probabilityPassed, true);
  assert.equal(result.results[2].reached, false);
});

test("触发模拟的角色条件与运行时队伍语义一致", () => {
  assert.equal(simulateMapLocationEvents("大地图", {
    events: [{ id: "level", type: "story", probability: 100, conditions: [{ type: "level_greater_than", value: "主角#10" }] }],
  }, {
    characterLevels: { 主角: 20 },
  }).selectedEvent, null);

  assert.equal(simulateMapLocationEvents("大地图", {
    events: [{ id: "skill", type: "story", probability: 100, conditions: [{ type: "skill_less_than", value: "主角#太极拳#1" }] }],
  }, {
    partyMembers: ["主角"],
  }).selectedEvent.id, "skill");
});

test("新手任务条件按当前运行时固定为不满足", () => {
  const result = simulateMapLocationEvents("大地图", {
    events: [{ id: "newbie", type: "story", probability: 100, conditions: [{ type: "in_newbie_task", value: "" }] }],
  }, { inNewbieTask: true });
  assert.equal(result.selectedEvent, null);
  assert.match(result.results[0].conditionResults[0].message, /尚未建模/);
});
