import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  abilityEffectTypes,
  createAbilityEffect,
  createTargetSelector,
  hookConditionTypes,
  hookEffectTypes,
  hookTimings,
  targetSelectorTypes,
} from "../wwwroot/domain/battle-authoring.js";
import { createItemDefinition, effectTypes as itemEffectTypes, requirementTypes } from "../wwwroot/domain/items.js";
import {
  affixTypes,
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

const contract = JSON.parse(fs.readFileSync(
  new URL("../Contracts/jyxr-content-contract.json", import.meta.url),
  "utf8",
));

function values(entries) {
  return entries.map(([value]) => value).sort();
}

test("编辑器表单类型与游戏导出的契约一致", () => {
  assert.deepEqual(values(affixTypes), [...contract.polymorphicTypes.affix.values].sort());
  assert.deepEqual(values(hookConditionTypes), [...contract.polymorphicTypes.battleHookCondition.values].sort());
  assert.deepEqual(
    [...new Set([...values(abilityEffectTypes), ...values(hookEffectTypes)])].sort(),
    [...contract.polymorphicTypes.battleEffect.values].sort(),
  );
  assert.deepEqual(values(targetSelectorTypes), [...contract.polymorphicTypes.battleTarget.values].sort());
  assert.deepEqual(values(hookTimings), [...contract.enums["Game.Core.Affix.HookTiming"]].sort());
  assert.deepEqual(values(requirementTypes), [...contract.polymorphicTypes.itemRequirement.values].sort());
  assert.deepEqual(values(itemEffectTypes), [...contract.polymorphicTypes.itemUseEffect.values].sort());
  assert.deepEqual(
    [createItemDefinition("consumable").category, createItemDefinition("equipment").category].sort(),
    [...contract.polymorphicTypes.item.values].sort(),
  );
});

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
  assert.deepEqual(createHookCondition("context_skill_source_id"), { type: "context_skill_source_id", sourceSkillIds: [] });
  assert.equal(createHookCondition("unit_level_chance").maxValue, 1);
  assert.equal(createHookEffect("modify_damage_context").field, "final_damage");
  assert.equal(createHookEffect("custom").effectId, "");
  assert.equal(createHookEffect("add_action_gauge").target.type, "target");
  assert.deepEqual(createHookEffect("grant_scoped_battle_effect"), { type: "grant_scoped_battle_effect", effectId: "" });
  assert.deepEqual(createAbilityEffect("grant_scoped_battle_effect"), { type: "grant_scoped_battle_effect", effectId: "" });
  assert.deepEqual(createTargetSelector("explicit_units"), { type: "explicit_units" });
  assert.deepEqual(createHookEffect("extra_strike").damageFactors, [1]);
});

test("天赋诊断校验范围战斗效果引用", () => {
  const record = createTalentDefinition("阵法");
  const hook = createTalentAffix("hook");
  hook.effects.push(createHookEffect("grant_scoped_battle_effect"));
  record.affixes.push(hook);

  assert.ok(getTalentIssues(record, { scopedEffectIds: new Set(["存在"]) }).includes("范围战斗效果缺少 effectId"));
  hook.effects[0].effectId = "缺失";
  assert.ok(getTalentIssues(record, { scopedEffectIds: new Set(["存在"]) }).includes("范围战斗效果不存在：缺失"));
  hook.effects[0].effectId = "存在";
  assert.equal(getTalentIssues(record, { scopedEffectIds: new Set(["存在"]) }).some((issue) => issue.includes("范围战斗效果")), false);
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
