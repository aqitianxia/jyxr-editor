import assert from "node:assert/strict";
import test from "node:test";

import {
  collectAchievementUnlockSources,
  createAchievementResource,
  createWorldTriggerDefinition,
  getAchievementTitle,
  getMissingAchievementReferences,
  getWorldTriggerIssues,
  indexAchievementUnlockSources,
  isAchievementResource,
  moveWorldTrigger,
  worldTriggerTypes,
} from "../wwwroot/domain/achievements.js";

test("成就资源使用运行时 nick 前缀", () => {
  const resource = createAchievementResource("初出茅庐");
  assert.deepEqual(resource, { id: "nick.初出茅庐", group: "nick", value: "" });
  assert.equal(isAchievementResource(resource), true);
  assert.equal(getAchievementTitle(resource), "初出茅庐");
});

test("从嵌套 Story 命令精确提取成就解锁来源", () => {
  const story = {
    segments: [{
      name: "开场",
      steps: [{ kind: "branch", cases: [{ steps: [{ kind: "command", name: "nick", args: ["初出茅庐"] }] }] }],
    }],
  };
  assert.deepEqual(collectAchievementUnlockSources("story/main.story.json", story), [{
    achievementId: "初出茅庐",
    kind: "story",
    path: "story/main.story.json",
    ownerId: "开场",
    segmentId: "开场",
    detail: "剧情命令 nick 初出茅庐",
  }]);
});

test("从爬塔层级提取成就解锁来源并找出缺失定义", () => {
  const towers = [{ id: "天关", stages: [{ id: "一层", achievementIds: ["登峰造极"] }] }];
  const sources = collectAchievementUnlockSources("towers.json", towers);
  const indexed = indexAchievementUnlockSources(sources);
  assert.equal(indexed.get("登峰造极")[0].kind, "tower");
  assert.deepEqual(getMissingAchievementReferences([], indexed).map((entry) => entry.id), ["登峰造极"]);
});

test("新建世界触发器提供运行时默认值", () => {
  assert.deepEqual(createWorldTriggerDefinition("夜雨触发"), {
    id: "夜雨触发",
    type: "story",
    targetId: "",
    probability: 100,
    repeatMode: "once",
    conditions: [],
  });
});

test("世界触发器覆盖运行时目标类型与引用检查", () => {
  assert.deepEqual(worldTriggerTypes.map((entry) => entry.value), ["story", "shop", "xiangzi", "battle"]);
  const targets = {
    story: [{ id: "开场" }],
    shop: [{ id: "洛阳.商店" }],
    battle: [{ id: "山中战斗" }],
  };
  assert.deepEqual(getWorldTriggerIssues({
    id: "商店触发", type: "shop", targetId: "洛阳.商店", conditions: [],
  }, targets, []), []);
  assert.deepEqual(getWorldTriggerIssues({
    id: "箱子触发", type: "xiangzi", targetId: "", probability: 100, repeatMode: "once", conditions: [],
  }, targets, []), []);
  assert.ok(getWorldTriggerIssues({
    id: "战斗触发", type: "battle", targetId: "不存在", conditions: [],
  }, targets, []).includes("目标战斗不存在"));
});

test("世界触发器排序保持对象和未知字段", () => {
  const triggers = [{ id: "甲", custom: 1 }, { id: "乙", custom: 2 }];
  const moved = moveWorldTrigger(triggers, 1, -1);
  assert.deepEqual(moved.map((trigger) => trigger.id), ["乙", "甲"]);
  assert.equal(moved[1].custom, 1);
  assert.deepEqual(triggers.map((trigger) => trigger.id), ["甲", "乙"]);
  assert.equal(moveWorldTrigger(triggers, 0, -1), triggers);
});
