import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { createMapDefinition, createMapEventDefinition, describeMapCondition, findMapReferences, getMapConditionReferences, getMapConditionValueIssue, mapConditionTypes, matchesMapSearch, moveMapEventToLocation, moveMapEventWithinLocation, moveMapLocation, renameMapId } from "../wwwroot/domain/maps.js";

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
      events: [{ type: "map", targetId: "大地图", probability: 100, description: "返回大地图", conditions: [] }],
    }],
  });
});

test("新增事件只使用运行时支持的字段", () => {
  const record = { locations: [{ id: "入口", events: [{ type: "story" }] }] };
  const created = createMapEventDefinition(record, record.locations[0]);
  assert.deepEqual(created, { type: "story", targetId: "", probability: 100, description: "", conditions: [] });
});

test("查看安卓端真实地图数据不会改写内容或添加事件 ID", {
  skip: !process.env.JYXR_GAME_ROOT,
}, () => {
  const mapsPath = join(process.env.JYXR_GAME_ROOT, "mods", "jyxr-base", "data", "maps.json");
  const source = readFileSync(mapsPath, "utf8");
  const records = JSON.parse(source);
  const beforeViewing = JSON.stringify(records);
  let eventCount = 0;

  for (const record of records) {
    matchesMapSearch(record, "");
    for (const location of record.locations || []) {
      for (const mapEvent of location.events || []) {
        eventCount += 1;
        assert.equal(Object.hasOwn(mapEvent, "id"), false);
        for (const condition of mapEvent.conditions || []) {
          describeMapCondition(condition);
          getMapConditionValueIssue(condition);
          getMapConditionReferences(condition);
        }
      }
    }
  }

  assert.ok(eventCount > 0);
  assert.equal(JSON.stringify(records), beforeViewing);
  assert.equal(readFileSync(mapsPath, "utf8"), source);
});

test("地图重命名更新进入地图事件和 current_map 条件", () => {
  const records = [
    { id: "旧地图", locations: [] },
    { id: "入口", locations: [{ id: "门", events: [
      { type: "map", targetId: "旧地图", conditions: [] },
      { type: "story", targetId: "剧情", conditions: [{ type: "current_map", value: "旧地图" }] },
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
  assert.equal(getMapConditionValueIssue({ type: "event_completed", value: "大地图|黑木崖|1" }), "");
  assert.match(getMapConditionValueIssue({ type: "event_completed", value: "大地图|黑木崖_story_1" }), /地图id\|点位id\|事件序号/);
  assert.match(getMapConditionValueIssue({ type: "event_completed", value: "大地图|黑木崖|-1" }), /从 0 开始/);
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
  assert.deepEqual(getMapConditionReferences({ type: "event_completed", value: "大地图|黑木崖|1" }), [
    { id: "大地图|黑木崖|1", types: ["map-events"], label: "地图事件" },
  ]);
});
