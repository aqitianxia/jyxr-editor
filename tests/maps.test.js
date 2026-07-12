import assert from "node:assert/strict";
import test from "node:test";
import { createMapDefinition, ensureMapShape, matchesMapSearch, moveMapLocation } from "../wwwroot/domain/maps.js";

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
