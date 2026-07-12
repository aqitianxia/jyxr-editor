import assert from "node:assert/strict";
import test from "node:test";
import { createMapDefinition, ensureMapShape, getMapConditionValueIssue, mapConditionTypes, matchesMapSearch, moveMapLocation } from "../wwwroot/domain/maps.js";

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
});
