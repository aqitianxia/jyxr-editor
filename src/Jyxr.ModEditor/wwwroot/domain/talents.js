import { createHookCondition, createHookEffect } from "./battle-authoring.js?v=20260713-battle-1";

export const talentFilters = Object.freeze([
  ["all", "全部天赋"],
  ["hooks", "含战斗 Hook"],
  ["traits", "含角色特性"],
  ["replacements", "会替换其他天赋"],
  ["issues", "有问题"],
]);

export const affixTypes = Object.freeze([
  ["hook", "战斗 Hook"],
  ["trait", "角色特性"],
  ["stat_modifier", "属性修正"],
  ["weapon_bonus_modifier", "兵器加成"],
  ["skill_bonus_modifier", "武学加成"],
  ["legend_skill_chance_modifier", "奥义概率修正"],
  ["skill_targeting_modifier", "技能范围修正"],
  ["buff_level_stat_modifier", "按 Buff 等级修正属性"],
  ["grant_talent", "授予天赋"],
  ["grant_model", "授予模型"],
]);

export const modifierOps = Object.freeze([
  ["add", "加算"], ["increase", "增量"], ["more", "乘算"], ["post_add", "后加算"], ["override", "覆盖"],
]);

export const statTypes = Object.freeze([
  "bili", "dingli", "fuyuan", "gengu", "jianfa", "daofa", "quanzhang", "qimen", "shenfa", "wuxing", "wuxue",
  "max_hp", "max_mp", "attack", "defence", "evasion", "accuracy", "crit_chance", "crit_mult", "anti_crit_chance",
  "lifesteal", "anti_debuff", "speed", "movement",
].map((value) => Object.freeze([value, value])));

export const weaponTypes = Object.freeze([
  ["quanzhang", "拳掌"], ["jianfa", "剑法"], ["daofa", "刀法"], ["qimen", "奇门"],
  ["internal_skill", "内功"], ["unknown", "未知"],
]);

export const traitTypes = Object.freeze([
  "Swift", "IgnoreZoneOfControl", "CanUseItemOnAlly", "IgnoreItemCooldown", "Ghost", "BroadLearning",
  "DoubleExperienceGain", "DoubleSkillEquipmentTenDimensionAffixes", "IncreaseInternalSkillYangAffinity", "MindEye",
  "PoisonResistance", "AvoidFriendlyFire", "Irascible", "DoubleCombatRageGain", "CannotMove",
].map((value) => Object.freeze([value, value])));

export function createTalentDefinition(id = "新天赋") {
  return { id, name: id, point: 0, description: "", replaceTalentIds: [], affixes: [] };
}

export function ensureTalentShape(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return createTalentDefinition();
  if (!Array.isArray(record.replaceTalentIds)) record.replaceTalentIds = [];
  if (!Array.isArray(record.affixes)) record.affixes = [];
  return record;
}

function modifierValue() {
  return { op: "add", delta: 0 };
}

export function createTalentAffix(type = "hook") {
  if (type === "hook") return { type, timing: "BeforeDamageCalculation", priority: 0, conditions: [], effects: [] };
  if (type === "trait") return { type, traitId: "Swift" };
  if (type === "stat_modifier") return { type, stat: "attack", value: modifierValue() };
  if (type === "weapon_bonus_modifier") return { type, weaponType: "quanzhang", value: modifierValue() };
  if (type === "skill_bonus_modifier") return { type, skillId: "", value: modifierValue() };
  if (type === "legend_skill_chance_modifier") return { type, skillId: "", value: modifierValue() };
  if (type === "skill_targeting_modifier") return { type, sourceSkillId: null, field: "cast_size", value: modifierValue() };
  if (type === "buff_level_stat_modifier") return { type, stat: "attack", addBase: 0, addPerLevel: 0, mulPerLevel: 0 };
  if (type === "grant_talent") return { type, talentId: "" };
  if (type === "grant_model") return { type, modelId: "", priority: 0, description: "" };
  return { type };
}

export { createHookCondition, createHookEffect };

export function cloneTalent(value) {
  return typeof globalThis.structuredClone === "function"
    ? globalThis.structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

export function moveTalentEntry(values, index, direction) {
  const target = index + direction;
  if (!Array.isArray(values) || index < 0 || index >= values.length || target < 0 || target >= values.length) return values;
  const next = [...values];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function getTalentIssues(record, context = {}) {
  const issues = [];
  const id = String(record?.id || "").trim();
  if (!id) issues.push("缺少天赋 ID");
  if (!String(record?.name || "").trim()) issues.push("缺少显示名称");
  if (id && Number(context.idCounts?.get(id) || 0) > 1) issues.push("天赋 ID 重复");
  for (const replacement of record?.replaceTalentIds || []) {
    if (replacement === id) issues.push("不能替换自身");
    else if (context.talentIds && !context.talentIds.has(replacement)) issues.push(`替换目标不存在：${replacement}`);
  }
  for (const affix of record?.affixes || []) {
    if (!affix?.type) { issues.push("存在缺少 type 的词缀"); continue; }
    if (affix.type === "hook") {
      if (!affix.timing) issues.push("战斗 Hook 缺少 timing");
      const hasEffects = Array.isArray(affix.effects) && affix.effects.length > 0;
      if (!hasEffects && !affix.floatText && !affix.speech) issues.push(`Hook ${affix.timing || "未设置"} 没有任何效果或表现`);
      for (const effect of affix.effects || []) {
        if ((effect.type === "custom" || effect.type === "custom_ability") && !String(effect.effectId || "").trim()) issues.push("自定义效果缺少 effectId");
        if ((effect.type === "apply_buff" || effect.type === "remove_buff") && effect.buffId && context.buffIds && !context.buffIds.has(effect.buffId)) issues.push(`Buff 不存在：${effect.buffId}`);
      }
    } else if (affix.type === "grant_talent" && affix.talentId && context.talentIds && !context.talentIds.has(affix.talentId)) {
      issues.push(`授予的天赋不存在：${affix.talentId}`);
    }
  }
  return [...new Set(issues)];
}

export function getTalentStats(record, context = {}) {
  const affixes = Array.isArray(record?.affixes) ? record.affixes : [];
  return {
    affixCount: affixes.length,
    hookCount: affixes.filter((affix) => affix?.type === "hook").length,
    traitCount: affixes.filter((affix) => affix?.type === "trait").length,
    customEffectCount: affixes.flatMap((affix) => affix?.effects || []).filter((effect) => effect?.type === "custom").length,
    issueCount: getTalentIssues(record, context).length,
  };
}

export function matchesTalentSearch(record, query) {
  const normalized = String(query || "").trim().toLocaleLowerCase("zh-CN");
  if (!normalized) return true;
  const nested = JSON.stringify({ replaceTalentIds: record?.replaceTalentIds, affixes: record?.affixes });
  return [record?.id, record?.name, record?.description, nested]
    .some((value) => String(value || "").toLocaleLowerCase("zh-CN").includes(normalized));
}

export function matchesTalentFilter(record, filter, context = {}) {
  const stats = getTalentStats(record, context);
  if (filter === "hooks") return stats.hookCount > 0;
  if (filter === "traits") return stats.traitCount > 0;
  if (filter === "replacements") return (record?.replaceTalentIds || []).length > 0;
  if (filter === "issues") return stats.issueCount > 0;
  return true;
}
