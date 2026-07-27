export const itemTypes = Object.freeze([
  ["consumable", "消耗品"], ["equipment", "装备"], ["skill_book", "武学书"],
  ["special_skill_book", "绝技书"], ["talent_book", "天赋书"], ["quest_item", "剧情物品"],
  ["booster", "强化道具"], ["utility", "功能物品"],
]);
export const itemSlots = Object.freeze([["weapon", "武器"], ["armor", "护甲"], ["accessory", "饰品"]]);
export const requirementTypes = Object.freeze([["stat", "属性要求"], ["talent", "天赋要求"], ["gender", "性别要求"]]);
export const genderChoices = Object.freeze([
  ["male", "男"], ["female", "女"], ["neutral", "中立"], ["animal", "动物"], ["eunuch", "阉人"],
]);
export const effectTypes = Object.freeze([
  ["add_hp", "回复生命"], ["add_mp", "回复内力"], ["add_hp_percent", "回复生命百分比"],
  ["add_mp_percent", "回复内力百分比"], ["add_maxhp", "提升生命上限"], ["add_maxmp", "提升内力上限"],
  ["add_rage", "增加怒气"], ["detoxify", "解毒"], ["add_buff", "添加 Buff"],
  ["external_skill", "学习外功"], ["internal_skill", "学习内功"], ["special_skill", "学习绝技"],
  ["grant_talent", "获得天赋"],
  ["set_gender", "设置性别"], ["reduce_max_resource_ratio", "降低资源上限"],
]);
export const affixTypes = Object.freeze([
  ["stat_modifier", "属性加成"], ["grant_talent", "获得天赋"], ["grant_model", "战斗外观"],
  ["skill_bonus_modifier", "指定武学加成"], ["weapon_bonus_modifier", "武学类别加成"],
  ["legend_skill_chance_modifier", "奥义触发率"],
]);
export const statChoices = Object.freeze([
  ["attack", "攻击"], ["defence", "防御"], ["crit_chance", "暴击率"], ["anti_crit_chance", "抗暴率"],
  ["crit_mult", "暴击倍率"], ["lifesteal", "吸血"], ["anti_debuff", "抗异常"],
  ["bili", "臂力"], ["dingli", "定力"], ["fuyuan", "福缘"], ["gengu", "根骨"],
  ["jianfa", "剑法"], ["daofa", "刀法"], ["quanzhang", "拳掌"], ["qimen", "奇门"],
  ["shenfa", "身法"], ["wuxing", "悟性"], ["wuxue", "武学"], ["max_hp", "最大生命"], ["max_mp", "最大内力"],
]);
export const weaponTypes = Object.freeze([
  ["quanzhang", "拳掌"], ["jianfa", "剑法"], ["daofa", "刀法"], ["qimen", "奇门"], ["internal_skill", "内功"],
]);
export const itemFilters = Object.freeze([
  ["all", "全部"], ["consumable", "消耗/强化"], ["equipment", "装备"], ["books", "秘籍"],
  ["talent_book", "天赋书"], ["quest_item", "剧情物品"], ["missing_picture", "缺图片"], ["issues", "有问题"],
]);
const percentAffixStats = new Set(["crit_chance", "anti_crit_chance", "crit_mult", "lifesteal", "anti_debuff"]);

export function itemTypeLabel(type) {
  return itemTypes.find(([value]) => value === type)?.[1] || `${type || "unknown"} 未知类型`;
}

export function createItemDefinition(type = "consumable", id = "新物品") {
  const equipment = type === "equipment";
  return {
    category: equipment ? "equipment" : "normal",
    id,
    name: id,
    type,
    level: 1,
    price: 0,
    cooldown: 0,
    canDrop: true,
    consumeOnUse: true,
    description: "",
    picture: "",
    tagIds: [],
    requirements: [],
    useEffects: [],
    ...(equipment ? { slotType: "weapon", affixes: [] } : {}),
  };
}

export function applyItemType(record, type) {
  record.type = type;
  record.category = type === "equipment" ? "equipment" : "normal";
  if (type === "equipment") {
    if (!record.slotType) record.slotType = "weapon";
    if (!Array.isArray(record.affixes)) record.affixes = [];
  }
}

export function createRequirement(type = "stat") {
  if (type === "talent") return { type, talentId: "" };
  if (type === "gender") return { type, genders: ["male"] };
  return { type: "stat", statId: "wuxing", value: 10 };
}

export function createEffect(type = "add_hp") {
  if (type === "external_skill" || type === "internal_skill") return { type, skillId: "", level: 1 };
  if (type === "special_skill") return { type, skillId: "" };
  if (type === "grant_talent") return { type, talentId: "" };
  if (type === "set_gender") return { type, gender: "eunuch" };
  if (type === "reduce_max_resource_ratio") return { type, statId: "max_hp", ratio: 0.1 };
  if (type === "add_buff") return { type, buffId: "", level: 1, duration: 3 };
  if (type === "detoxify") return { type, values: [5, 5] };
  return { type, value: 0 };
}

export function createAffix(type = "stat_modifier") {
  if (type === "grant_talent") return { type, talentId: "" };
  if (type === "grant_model") return { type, modelId: "", priority: 0, description: "" };
  if (type === "skill_bonus_modifier" || type === "legend_skill_chance_modifier") return { type, skillId: "", value: { op: "add", delta: 0 } };
  if (type === "weapon_bonus_modifier") return { type, weaponType: "qimen", value: { op: "add", delta: 0 } };
  return { type: "stat_modifier", stat: "attack", value: { op: "add", delta: 0 } };
}

export function isPercentAffixValue(affix) {
  if (affix?.value?.op === "more") return false;
  return affix?.type === "skill_bonus_modifier"
    || affix?.type === "weapon_bonus_modifier"
    || affix?.type === "legend_skill_chance_modifier"
    || (affix?.type === "stat_modifier" && percentAffixStats.has(affix?.stat))
    || affix?.value?.op === "increase";
}

export function toAffixDisplayValue(affix) {
  const delta = Number(affix?.value?.delta) || 0;
  return isPercentAffixValue(affix) ? delta * 100 : delta;
}

export function fromAffixDisplayValue(affix, displayValue) {
  const value = Number(displayValue) || 0;
  return isPercentAffixValue(affix) ? value / 100 : value;
}

export function matchesItemSearch(record, query) {
  const normalized = String(query || "").trim().toLocaleLowerCase("zh-CN");
  if (!normalized) return true;
  return [record?.id, record?.name, record?.description, record?.type, record?.picture]
    .some((value) => String(value || "").toLocaleLowerCase("zh-CN").includes(normalized));
}

export function matchesItemFilter(record, filter, { issueCount = 0, pictureMissing = false } = {}) {
  if (filter === "consumable") return ["consumable", "booster", "utility"].includes(record?.type);
  if (filter === "equipment") return record?.type === "equipment";
  if (filter === "books") return ["skill_book", "special_skill_book"].includes(record?.type);
  if (filter === "talent_book" || filter === "quest_item") return record?.type === filter;
  if (filter === "missing_picture") return pictureMissing;
  if (filter === "issues") return issueCount > 0;
  return true;
}

export function moveArrayEntry(values, index, direction) {
  const target = index + direction;
  if (!Array.isArray(values) || target < 0 || target >= values.length) return values;
  const next = [...values];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
