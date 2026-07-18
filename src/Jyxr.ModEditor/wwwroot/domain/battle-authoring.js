export const specialSkillIntents = Object.freeze([
  ["Offensive", "进攻"],
  ["Support", "辅助"],
]);

export const abilityEffectTypes = Object.freeze([
  ["apply_buff", "附加 Buff"],
  ["remove_buff", "移除指定 Buff"],
  ["remove_negative_buffs", "移除异常状态"],
  ["remove_positive_buffs", "移除增益状态"],
  ["add_rage", "增加怒气"],
  ["set_rage", "设置怒气"],
  ["add_action_gauge", "增加行动值"],
  ["set_action_gauge", "设置行动值"],
  ["add_hp", "恢复生命"],
  ["add_mp", "恢复内力"],
  ["custom_ability", "自定义绝技效果"],
]);

export const hookTimings = Object.freeze([
  "OnBattleStart", "BeforeActionReadiness", "BeforeActionStart", "AfterActionEnd", "AfterBuffRound",
  "BeforeMove", "AfterMove", "BeforeSkillCost", "BeforeHitResolved", "BeforeDamageCalculation",
  "BeforeDamageApplied", "BeforeDefeated", "BeforeSkillCast", "AfterSkillCast", "OnHitConfirmed",
  "BeforeItemUse", "AfterItemUse", "BeforeRest", "AfterRest", "BeforeBuffApplied", "OnBuffApplied",
  "OnBuffRemoved", "OnDamageTaken", "OnDamageDealt", "BeforeRecoveryResolved",
].map((value) => Object.freeze([value, value])));

export const hookConditionTypes = Object.freeze([
  ["chance", "固定概率"],
  ["unit_level_chance", "按单位等级概率"],
  ["damage_positive", "伤害为正"],
  ["context_buff_id", "上下文 Buff ID"],
  ["context_buff_negative", "上下文 Buff 为负面"],
  ["context_unit_hp_ratio", "上下文单位生命比例"],
  ["context_unit_effective_talent", "上下文单位拥有天赋"],
  ["context_unit_equipped_internal_skill", "上下文单位装备内功"],
  ["context_unit_relation", "上下文单位关系"],
  ["context_unit_role", "上下文单位角色"],
  ["context_unit_gender", "上下文单位性别"],
  ["context_hit_state", "命中状态"],
  ["context_skill_source_id", "来源武学 ID"],
  ["context_skill_name_equals", "技能名等于"],
  ["context_skill_name_contains", "技能名包含"],
  ["context_skill_kind", "技能种类"],
  ["context_skill_weapon_type", "技能兵器类型"],
  ["context_recovery_kind", "恢复类型"],
]);

export const hookEffectTypes = Object.freeze([
  ...abilityEffectTypes.filter(([type]) => type !== "custom_ability"),
  ["remove_context_buff", "移除上下文 Buff"],
  ["cancel_hit", "取消命中"],
  ["set_hit_success", "强制命中"],
  ["modify_damage", "修改伤害"],
  ["modify_damage_context", "修改伤害上下文"],
  ["modify_mp_cost", "修改内力消耗"],
  ["modify_recovery", "修改恢复量"],
  ["modify_lifesteal", "修改吸血"],
  ["strengthen_context_buff", "强化上下文 Buff"],
  ["extra_strike", "追加攻击"],
  ["custom", "自定义 Hook 效果"],
]);

export const targetSelectorTypes = Object.freeze([
  ["self", "自身"],
  ["source", "施展者"],
  ["target", "命中目标"],
  ["all_allies", "全体友军"],
  ["all_enemies", "全体敌军"],
  ["nearby_allies", "附近友军"],
  ["nearby_enemies", "附近敌军"],
]);

export function createTargetSelector(type = "target") {
  if (type === "all_allies") return { type, includeSelf: true };
  if (type === "nearby_allies") return { type, radius: 2, includeSelf: true };
  if (type === "nearby_enemies") return { type, radius: 2 };
  return { type };
}

export function createAbilityEffect(type = "apply_buff") {
  const target = createTargetSelector("target");
  if (type === "apply_buff") return { type, target, buffId: "", level: 1, duration: 3, chance: 100 };
  if (type === "remove_buff") return { type, target, buffId: "" };
  if (["remove_negative_buffs", "remove_positive_buffs"].includes(type)) return { type, target };
  if (type === "custom_ability") return { type, effectId: "", target, parameters: {} };
  return { type, target, value: 0 };
}

export function createHookCondition(type = "chance") {
  if (type === "chance") return { type, value: 0.5 };
  if (type === "unit_level_chance") return { type, baseValue: 0, valuePerLevel: 0.01, maxValue: 1 };
  if (["damage_positive", "context_buff_negative"].includes(type)) return { type };
  if (type === "context_buff_id") return { type, buffId: "" };
  if (type === "context_unit_hp_ratio") return { type, maxInclusive: 0.5 };
  if (type === "context_unit_effective_talent") return { type, talentIds: [] };
  if (type === "context_unit_equipped_internal_skill") return { type, internalSkillIds: [] };
  if (type === "context_unit_relation") return { type, role: "target", relation: "enemy" };
  if (type === "context_unit_role") return { type, role: "source" };
  if (type === "context_unit_gender") return { type, role: "target", genders: ["female"] };
  if (type === "context_hit_state") return { type, state: "hit" };
  if (type === "context_skill_source_id") return { type, sourceSkillIds: [] };
  if (type === "context_skill_name_equals" || type === "context_skill_name_contains") return { type, values: [] };
  if (type === "context_skill_kind") return { type, kinds: ["External"] };
  if (type === "context_skill_weapon_type") return { type, weaponTypes: ["quanzhang"] };
  if (type === "context_recovery_kind") return { type, kind: "hp" };
  return { type };
}

export function createHookEffect(type = "modify_damage_context") {
  if (abilityEffectTypes.some(([candidate]) => candidate === type) && type !== "custom_ability") {
    return createAbilityEffect(type);
  }
  if (["remove_context_buff", "set_hit_success"].includes(type)) return { type };
  if (type === "cancel_hit") return { type, suppressHitEffects: true };
  if (type === "modify_damage") return { type, op: "add", delta: 0, deltaPerBuffLevel: 0, rounding: "Truncate" };
  if (type === "modify_damage_context") return { type, field: "final_damage", op: "add", delta: 0 };
  if (type === "modify_mp_cost") return { type, op: "add", delta: 0, deltaPerBuffLevel: 0, rounding: "Ceiling" };
  if (type === "modify_recovery") return { type, op: "add", delta: 0, deltaPerBuffLevel: 0, rounding: "Truncate" };
  if (type === "modify_lifesteal") return { type, factor: 0, factorPerUnitLevel: 0 };
  if (type === "strengthen_context_buff") return { type, levelDelta: 0, turnDelta: 0 };
  if (type === "extra_strike") return { type, target: createTargetSelector("target"), damageFactors: [1], chance: 0, chancePerBuffLevel: 0 };
  if (type === "custom") return { type, effectId: "", parameters: {} };
  return { type };
}
