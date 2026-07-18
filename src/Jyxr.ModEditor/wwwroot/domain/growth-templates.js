export const growthStats = Object.freeze([
  ["bili", "臂力", "基础属性", "影响以力量为核心的战斗能力。"],
  ["dingli", "定力", "基础属性", "偏向内力运用与稳定性。"],
  ["fuyuan", "福缘", "基础属性", "用于部分判定与角色特色。"],
  ["gengu", "根骨", "基础属性", "偏向生存与内功根基。"],
  ["shenfa", "身法", "基础属性", "偏向行动、闪避与机动表现。"],
  ["wuxing", "悟性", "基础属性", "角色升级时直接增加的悟性。"],
  ["jianfa", "剑法", "武学专精", "提高角色的剑法成长。"],
  ["daofa", "刀法", "武学专精", "提高角色的刀法成长。"],
  ["quanzhang", "拳掌", "武学专精", "提高角色的拳掌成长。"],
  ["qimen", "奇门", "武学专精", "提高角色的奇门成长。"],
  ["max_hp", "气血上限", "资源成长", "每次升级直接增加的气血上限。"],
  ["max_mp", "内力上限", "资源成长", "每次升级直接增加的内力上限。"],
  ["wuxue", "武学点", "天赋容量", "不会直接写入角色属性；用于计算天赋点容量：20 + 当前等级 × 此值。"],
]);

const tenDimensionKeys = Object.freeze(["bili", "dingli", "fuyuan", "gengu", "shenfa", "wuxing", "jianfa", "daofa", "quanzhang", "qimen"]);
const specialtyKeys = Object.freeze(["jianfa", "daofa", "quanzhang", "qimen"]);
const labels = new Map(growthStats.map(([key, label]) => [key, label]));

export const growthCreationTemplates = Object.freeze([
  { id: "balanced", name: "均衡伙伴", description: "各项基础与四系武学平稳成长，适合尚未确定流派的普通伙伴。", values: { bili: 1, dingli: 1, fuyuan: 1, gengu: 1, shenfa: 1, wuxing: 0, jianfa: 1, daofa: 1, quanzhang: 1, qimen: 1, max_hp: 120, max_mp: 80, wuxue: 8 } },
  { id: "tank", name: "前排承伤", description: "气血、定力和根骨较高，武学面较窄，适合前排或护卫型角色。", values: { bili: 2, dingli: 3, fuyuan: 0, gengu: 2, shenfa: 1, wuxing: 0, jianfa: 0, daofa: 0, quanzhang: 2, qimen: 0, max_hp: 200, max_mp: 40, wuxue: 8 } },
  { id: "sword", name: "剑法专精", description: "集中投入剑法与身法，其他武学不成长，适合路线明确的剑客。", values: { bili: 1, dingli: 2, fuyuan: 1, gengu: 1, shenfa: 2, wuxing: 0, jianfa: 4, daofa: 0, quanzhang: 0, qimen: 0, max_hp: 120, max_mp: 60, wuxue: 8 } },
  { id: "blade", name: "刀法专精", description: "集中投入刀法、臂力与身法，适合直接进攻的刀客。", values: { bili: 2, dingli: 1, fuyuan: 1, gengu: 1, shenfa: 3, wuxing: 0, jianfa: 0, daofa: 4, quanzhang: 0, qimen: 0, max_hp: 120, max_mp: 60, wuxue: 8 } },
  { id: "fist", name: "拳掌专精", description: "拳掌、根骨和气血较高，适合贴身作战的角色。", values: { bili: 2, dingli: 2, fuyuan: 1, gengu: 3, shenfa: 2, wuxing: 0, jianfa: 0, daofa: 0, quanzhang: 3, qimen: 0, max_hp: 180, max_mp: 60, wuxue: 8 } },
  { id: "qimen", name: "奇门专精", description: "集中投入奇门与身法，适合暗器、奇术或控制型角色。", values: { bili: 1, dingli: 1, fuyuan: 2, gengu: 1, shenfa: 3, wuxing: 0, jianfa: 0, daofa: 0, quanzhang: 0, qimen: 4, max_hp: 110, max_mp: 90, wuxue: 8 } },
  { id: "internal", name: "内家高手", description: "根骨、定力、气血和内力较高，四系武学保持基础成长。", values: { bili: 1, dingli: 3, fuyuan: 1, gengu: 4, shenfa: 1, wuxing: 0, jianfa: 1, daofa: 1, quanzhang: 1, qimen: 1, max_hp: 180, max_mp: 150, wuxue: 8 } },
  { id: "protagonist", name: "主角级全能", description: "所有维度和武学点都明显高于普通伙伴，只适合主角或少数核心人物。", values: { bili: 2, dingli: 2, fuyuan: 2, gengu: 2, shenfa: 2, wuxing: 0, jianfa: 2, daofa: 2, quanzhang: 2, qimen: 2, max_hp: 120, max_mp: 80, wuxue: 11 } },
]);

export function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

export function ensureGrowthTemplateShape(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return createGrowthTemplate("新成长模板");
  if (!record.statGrowth || typeof record.statGrowth !== "object" || Array.isArray(record.statGrowth)) record.statGrowth = {};
  return record;
}

export function createGrowthTemplate(id = "新成长模板", templateId = "balanced") {
  const preset = growthCreationTemplates.find((item) => item.id === templateId) || growthCreationTemplates[0];
  return { id, name: id, statGrowth: cloneJson(preset.values) };
}

export function getGrowthValue(record, key) {
  const value = Number(record?.statGrowth?.[key]);
  return Number.isFinite(value) ? value : 0;
}

export function getGrowthProjection(record, level) {
  const resolvedLevel = Math.max(1, Math.trunc(Number(level) || 1));
  const levelUps = resolvedLevel - 1;
  const gains = Object.fromEntries(growthStats.map(([key]) => [key, key === "wuxue" ? 20 + resolvedLevel * getGrowthValue(record, key) : levelUps * getGrowthValue(record, key)]));
  return { level: resolvedLevel, levelUps, gains };
}

export function getGrowthComparison(record, baseline) {
  return growthStats.map(([key, label, group]) => ({ key, label, group, value: getGrowthValue(record, key), baseline: getGrowthValue(baseline, key), delta: getGrowthValue(record, key) - getGrowthValue(baseline, key) }));
}

export function analyzeGrowthTemplate(record, baseline) {
  const ranked = tenDimensionKeys.map((key) => [key, getGrowthValue(record, key)]).sort((left, right) => right[1] - left[1]);
  const maxValue = ranked[0]?.[1] ?? 0;
  const strongest = ranked.filter(([, value]) => value === maxValue && value > 0);
  const strengths = (strongest.length <= 3 ? strongest : []).map(([key]) => labels.get(key));
  const specialties = specialtyKeys.map((key) => [key, getGrowthValue(record, key)]).sort((left, right) => right[1] - left[1]);
  const specialtyMax = specialties[0]?.[1] ?? 0;
  const bestSpecialties = specialties.filter(([, value]) => value === specialtyMax && value >= 3).map(([key]) => labels.get(key));
  const hp = getGrowthValue(record, "max_hp");
  const mp = getGrowthValue(record, "max_mp");
  const wuxue = getGrowthValue(record, "wuxue");
  let role = "均衡成长";
  if (bestSpecialties.length === 1) role = `${bestSpecialties[0]}专精`;
  else if (bestSpecialties.length > 1) role = `${bestSpecialties.join(" / ")}双修`;
  else if (specialtyMax <= 1 && getGrowthValue(record, "fuyuan") >= 4 && getGrowthValue(record, "gengu") >= 4) role = "辅助 / 医者";
  else if (hp >= 180 && hp >= mp * 1.5) role = "高气血前排";
  else if (mp >= 120) role = "内力型角色";
  else if (wuxue >= 11) role = "高天赋容量";

  const comparison = baseline ? getGrowthComparison(record, baseline) : [];
  const improvements = comparison.filter((item) => item.delta > 0);
  const reductions = comparison.filter((item) => item.delta < 0);
  return {
    role,
    strengths,
    improvements,
    reductions,
    tenDimensionTotal: tenDimensionKeys.reduce((sum, key) => sum + getGrowthValue(record, key), 0),
    resourceTotal: hp + mp,
    wuxue,
  };
}

export function getGrowthTemplateIssues(record, { idCounts = new Map(), isDefault = false } = {}) {
  const issues = [];
  const id = String(record?.id || "").trim();
  if (!id) issues.push("缺少模板 ID");
  if (!String(record?.name || "").trim()) issues.push("缺少显示名称");
  if (id && (idCounts.get(id) || 0) > 1) issues.push("模板 ID 重复");
  if (!record?.statGrowth || typeof record.statGrowth !== "object" || Array.isArray(record.statGrowth)) return [...issues, "statGrowth 必须是对象"];
  for (const [key, label] of growthStats) {
    if (!(key in record.statGrowth)) issues.push(`缺少 ${label}（${key}）`);
    else if (!Number.isFinite(Number(record.statGrowth[key]))) issues.push(`${label}必须是数字`);
    else if (Number(record.statGrowth[key]) < 0) issues.push(`${label}不能小于 0`);
  }
  if (isDefault && id !== "default") issues.push("基础回退模板必须使用 ID default");
  return issues;
}

export function matchesGrowthSearch(record, query) {
  const normalized = String(query || "").trim().toLocaleLowerCase("zh-CN");
  return !normalized || [record?.id, record?.name, analyzeGrowthTemplate(record).role].some((value) => String(value || "").toLocaleLowerCase("zh-CN").includes(normalized));
}
