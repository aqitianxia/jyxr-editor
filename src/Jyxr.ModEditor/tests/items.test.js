import assert from "node:assert/strict";
import test from "node:test";
import {
  applyItemType,
  createAffix,
  createEffect,
  createItemDefinition,
  createRequirement,
  fromAffixDisplayValue,
  matchesItemFilter,
  moveArrayEntry,
  toAffixDisplayValue,
} from "../wwwroot/domain/items.js";

test("新建普通物品和装备只使用运行时支持字段", () => {
  assert.deepEqual(createItemDefinition("consumable", "药丸").category, "normal");
  const equipment = createItemDefinition("equipment", "木刀");
  assert.equal(equipment.category, "equipment");
  assert.equal(equipment.slotType, "weapon");
  assert.deepEqual(equipment.affixes, []);
});

test("切换到装备补齐装备结构但不删除已有数组", () => {
  const item = createItemDefinition("consumable", "测试");
  item.useEffects.push({ type: "add_hp", value: 10 });
  applyItemType(item, "equipment");
  assert.equal(item.category, "equipment");
  assert.equal(item.useEffects.length, 1);
  assert.ok(Array.isArray(item.affixes));
});

test("需求、效果和词缀默认结构匹配现有 JSON", () => {
  assert.deepEqual(createRequirement("talent"), { type: "talent", talentId: "" });
  assert.deepEqual(createEffect("external_skill"), { type: "external_skill", skillId: "", level: 1 });
  assert.deepEqual(createAffix("grant_talent"), { type: "grant_talent", talentId: "" });
});

test("物品筛选按领域类型和问题状态工作", () => {
  assert.equal(matchesItemFilter({ type: "booster" }, "consumable"), true);
  assert.equal(matchesItemFilter({ type: "equipment" }, "equipment"), true);
  assert.equal(matchesItemFilter({}, "issues", { issueCount: 2 }), true);
});

test("数组排序不越界且不修改原数组", () => {
  const original = ["a", "b", "c"];
  assert.deepEqual(moveArrayEntry(original, 1, -1), ["b", "a", "c"]);
  assert.deepEqual(original, ["a", "b", "c"]);
  assert.equal(moveArrayEntry(original, 0, -1), original);
});

test("装备百分比使用易读数值但保持 JSON 小数结构", () => {
  const crit = { type: "stat_modifier", stat: "crit_chance", value: { op: "add", delta: 0.15 } };
  assert.equal(toAffixDisplayValue(crit), 15);
  assert.equal(fromAffixDisplayValue(crit, 15), 0.15);

  const multiplier = { type: "stat_modifier", stat: "attack", value: { op: "more", delta: 1.2 } };
  assert.equal(toAffixDisplayValue(multiplier), 1.2);
  assert.equal(fromAffixDisplayValue(multiplier, 1.2), 1.2);
});
