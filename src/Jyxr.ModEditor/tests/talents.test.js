import assert from "node:assert/strict";
import test from "node:test";
import {
  createHookCondition,
  createHookEffect,
  createTalentAffix,
  createTalentDefinition,
  ensureTalentShape,
  getTalentIssues,
  getTalentStats,
  matchesTalentFilter,
  matchesTalentSearch,
  moveTalentEntry,
} from "../wwwroot/domain/talents.js";

test("新建天赋只生成当前运行时字段", () => {
  assert.deepEqual(createTalentDefinition("医者"), {
    id: "医者",
    name: "医者",
    point: 0,
    description: "",
    replaceTalentIds: [],
    affixes: [],
  });
  assert.equal(createTalentAffix("hook").timing, "BeforeDamageCalculation");
  assert.equal(createTalentAffix("trait").traitId, "Swift");
  assert.equal(createTalentAffix("skill_targeting_modifier").field, "cast_size");
});

test("结构补齐保留运行时新增的未知字段", () => {
  const record = { id: "甲", name: "甲", future: { enabled: true } };
  ensureTalentShape(record);
  assert.deepEqual(record.replaceTalentIds, []);
  assert.deepEqual(record.affixes, []);
  assert.deepEqual(record.future, { enabled: true });
});

test("Hook 条件与效果覆盖当前天赋数据能力", () => {
  assert.deepEqual(createHookCondition("context_unit_relation"), { type: "context_unit_relation", role: "target", relation: "enemy" });
  assert.equal(createHookCondition("unit_level_chance").maxValue, 1);
  assert.equal(createHookEffect("modify_damage_context").field, "final_damage");
  assert.equal(createHookEffect("custom").effectId, "");
  assert.equal(createHookEffect("add_action_gauge").target.type, "target");
  assert.deepEqual(createHookEffect("extra_strike").damageFactors, [1]);
});

test("天赋诊断识别重复、坏引用和空 Hook", () => {
  const record = createTalentDefinition("重复");
  record.replaceTalentIds.push("缺失");
  record.affixes.push(createTalentAffix("hook"));
  const issues = getTalentIssues(record, {
    idCounts: new Map([["重复", 2]]),
    talentIds: new Set(["重复"]),
    buffIds: new Set(),
  });
  assert.ok(issues.includes("天赋 ID 重复"));
  assert.ok(issues.includes("替换目标不存在：缺失"));
  assert.ok(issues.some((issue) => issue.includes("没有任何效果")));
});

test("天赋统计、搜索和筛选分析嵌套效果", () => {
  const record = createTalentDefinition("神医");
  record.description = "治疗队友";
  const hook = createTalentAffix("hook");
  hook.effects.push({ type: "custom", effectId: "medical_immortal", parameters: {} });
  record.affixes.push(hook, createTalentAffix("trait"));
  const stats = getTalentStats(record);
  assert.equal(stats.hookCount, 1);
  assert.equal(stats.customEffectCount, 1);
  assert.equal(matchesTalentSearch(record, "medical_immortal"), true);
  assert.equal(matchesTalentFilter(record, "hooks"), true);
  assert.equal(matchesTalentFilter(record, "traits"), true);
});

test("词缀排序不越界且不修改原数组", () => {
  const values = [{ type: "hook" }, { type: "trait", future: true }];
  const moved = moveTalentEntry(values, 1, -1);
  assert.deepEqual(moved.map((item) => item.type), ["trait", "hook"]);
  assert.equal(moved[0].future, true);
  assert.equal(moveTalentEntry(values, 0, -1), values);
});
