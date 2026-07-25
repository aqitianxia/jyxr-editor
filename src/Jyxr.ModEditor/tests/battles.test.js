import test from "node:test";
import assert from "node:assert/strict";
import {
  addBattleUnit,
  classifyBattleParticipant,
  createBattleDefinition,
  deleteBattleUnit,
  duplicateBattleUnit,
  ensureBattleShape,
  findBattleReferences,
  getBattleIssues,
  getBattleStats,
  getBattleUnits,
  matchesBattleSearch,
  moveBattleUnit,
  setBattleUnitKind,
} from "../wwwroot/domain/battles.js";

function context(overrides = {}) {
  return {
    idCounts: new Map([["test", 1]]),
    characterIds: new Set(["主角", "山贼", "黄药师"]),
    backgroundIds: new Set(["city", "shamo"]),
    musicIds: new Set(["音乐.战斗"]),
    referenceCount: 1,
    ...overrides,
  };
}

test("创建最小战斗时生成两个连续玩家位置且保留运行时字段", () => {
  const battle = createBattleDefinition("test");
  assert.equal(battle.id, "test");
  assert.deepEqual(battle.participants.map((unit) => unit.partyIndex), [0, 1]);
  assert.equal(getBattleStats(battle, context()).playerSlotCount, 2);
  assert.equal(getBattleStats(battle, context()).warningCount, 1);
});

test("参战者严格区分玩家位置、固定友军和固定敌人", () => {
  assert.equal(classifyBattleParticipant({ team: 1, characterId: null, partyIndex: 0 }), "party");
  assert.equal(classifyBattleParticipant({ team: 1, characterId: "主角", partyIndex: null }), "ally");
  assert.equal(classifyBattleParticipant({ team: 2, characterId: "山贼", partyIndex: null }), "enemy");
  assert.equal(classifyBattleParticipant({ team: 1, characterId: "主角", partyIndex: 0 }), "invalid");
});

test("移动到已占用格时交换位置且不改变未知字段", () => {
  const battle = createBattleDefinition("test");
  battle.participants[0].futureField = { keep: true };
  assert.equal(moveBattleUnit(battle, "participant:0", { x: 1, y: 2 }), true);
  assert.deepEqual(battle.participants.map((unit) => unit.position), [{ x: 1, y: 2 }, { x: 1, y: 1 }]);
  assert.deepEqual(battle.participants[0].futureField, { keep: true });
});

test("添加、复制、转换和删除单位维护数组与玩家序号", () => {
  const battle = createBattleDefinition("test");
  const enemyKey = addBattleUnit(battle, "enemy", { characterId: "山贼" });
  getBattleUnits(battle).find((entry) => entry.key === enemyKey).unit.futureField = { keep: true };
  const copyKey = duplicateBattleUnit(battle, enemyKey);
  assert.equal(getBattleUnits(battle).filter((entry) => entry.kind === "enemy").length, 2);
  const randomKey = setBattleUnitKind(battle, copyKey, "random", { tier: 2, name: "流寇" });
  assert.match(randomKey, /^random:/);
  assert.equal(battle.randomParticipants[0].tier, 2);
  const allyKey = setBattleUnitKind(battle, enemyKey, "ally", { characterId: "主角" });
  assert.deepEqual(getBattleUnits(battle).find((entry) => entry.key === allyKey).unit.futureField, { keep: true });
  assert.equal(deleteBattleUnit(battle, "participant:0"), true);
  assert.deepEqual(battle.participants.filter((unit) => unit.partyIndex !== null).map((unit) => unit.partyIndex), [0]);
});

test("玩家部署位置要求 characterId 为 null 而不是空字符串", () => {
  const battle = createBattleDefinition("test");
  battle.participants[0].characterId = "";
  const codes = new Set(getBattleIssues(battle, context()).map((issue) => issue.code));
  assert.ok(codes.has("party-character.invalid"));
});

test("校验坐标重叠、角色引用、玩家序号、随机等级和容量", () => {
  const battle = createBattleDefinition("test");
  battle.requiredCharacterIds = ["主角", "不存在", "主角"];
  battle.participants[1].partyIndex = 2;
  battle.participants.push({
    position: { x: 1, y: 1 }, team: 2, facing: 0, characterId: "不存在", partyIndex: null,
  });
  battle.randomParticipants.push({
    position: { x: 20, y: 0 }, team: 2, facing: 0, name: "强敌", tier: 4, model: null, boss: false,
  });
  const codes = new Set(getBattleIssues(battle, context()).map((issue) => issue.code));
  ["position.overlap", "position.invalid", "character.missing", "party-index.gap", "random-tier.invalid", "required.duplicate", "required.capacity", "required.missing"]
    .forEach((code) => assert.ok(codes.has(code), code));
});

test("读取已有战斗不会补写可选字段或删除未知字段", () => {
  const battle = { id: "legacy", name: "旧战斗", mapId: "city", participants: [], future: 42 };
  const same = ensureBattleShape(battle);
  assert.equal(same, battle);
  assert.equal(same.future, 42);
  assert.deepEqual(Object.keys(same).sort(), ["future", "id", "mapId", "name", "participants", "randomParticipants", "requiredCharacterIds"].sort());
  assert.equal(getBattleIssues(same, context({ idCounts: new Map([["legacy", 1]]) })).some((issue) => issue.code === "experience.invalid"), false);
});

test("搜索覆盖角色、随机单位、背景和音乐", () => {
  const battle = createBattleDefinition("test");
  addBattleUnit(battle, "enemy", { characterId: "黄药师" });
  addBattleUnit(battle, "random", { name: "黑风寨喽啰" });
  battle.music = "音乐.战斗";
  assert.equal(matchesBattleSearch(battle, "黄药师"), true);
  assert.equal(matchesBattleSearch(battle, "喽啰"), true);
  assert.equal(matchesBattleSearch(battle, "音乐"), true);
  assert.equal(matchesBattleSearch(battle, "不存在"), false);
});

test("战斗引用索引只识别运行时字段并保留调用位置", () => {
  const maps = [{
    id: "洛阳",
    description: "山贼战",
    locations: [{ id: "城门", events: [
      { type: "battle", targetId: "山贼战" },
      { type: "story", targetId: "山贼战" },
    ] }],
  }];
  const mapReferences = findBattleReferences("maps.json", maps);
  assert.deepEqual(mapReferences, [{
    value: "山贼战",
    path: "maps.json",
    fieldPath: "$[0].locations[0].events[0].targetId",
    ownerDefinitionId: "洛阳",
    kind: "map",
    mapIndex: 0,
    locationIndex: 0,
    eventIndex: 0,
  }]);

  const story = {
    segments: [{ name: "开场", steps: [{
      kind: "battle",
      battleId: "山贼战",
      outcomes: { win: [] },
    }, { kind: "command", name: "log", args: ["山贼战"] }] }],
  };
  assert.deepEqual(findBattleReferences("story/main.story.json", story), [{
    value: "山贼战",
    path: "story/main.story.json",
    fieldPath: "$.segments[0].steps[0].battleId",
    ownerDefinitionId: "开场",
    kind: "story",
    segmentIndex: 0,
  }]);

  const towers = [{ id: "试炼塔", stages: [{ id: "第一层", battleId: "山贼战" }] }];
  assert.equal(findBattleReferences("towers.json", towers)[0].kind, "tower");
});
