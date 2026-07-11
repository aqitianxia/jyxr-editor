export const martialKinds = Object.freeze([
  ["external", "外功", "external-skills.json"],
  ["internal", "内功", "internal-skills.json"],
  ["special", "绝技", "special-skills.json"],
  ["legend", "奥义", "legend-skills.json"],
]);

export const weaponTypes = Object.freeze([
  ["quanzhang", "拳掌"], ["jianfa", "剑法"], ["daofa", "刀法"], ["qimen", "奇门"],
]);

export const impactTypes = Object.freeze([
  ["single", "点攻击"], ["plus", "十字攻击"], ["star", "米字攻击"], ["line", "直线攻击"],
  ["square", "面攻击"], ["fan", "扇形攻击"], ["ring", "环状攻击"], ["x", "对角攻击"], ["cleave", "身前攻击"],
]);

export const legendConditionTypes = Object.freeze([
  ["skill", "需要外功"], ["internal_skill", "需要内功"], ["special_skill", "需要绝技"], ["talent", "需要天赋"],
]);

export const specialEffectTypes = Object.freeze([
  ["apply_buff", "附加 Buff"], ["remove_buff", "移除指定 Buff"],
  ["remove_negative_buffs", "移除异常状态"], ["remove_positive_buffs", "移除增益状态"],
  ["add_rage", "增加怒气"], ["set_rage", "设置怒气"], ["set_action_gauge", "设置行动值"],
  ["add_hp", "恢复生命"], ["add_mp", "恢复内力"],
]);

export const targetSelectorTypes = Object.freeze([
  ["self", "自身"], ["source", "施展者"], ["target", "命中目标"],
  ["all_allies", "全体友军"], ["all_enemies", "全体敌军"], ["nearby_allies", "附近友军"],
]);

export const martialCreationTemplates = Object.freeze({
  external: Object.freeze([
    { id: "external-single", name: "基础单体外功", description: "3 格选择距离，适合普通拳掌、指法和暗器。", result: "可直接造成伤害；继续选择图标、动画和音效。" },
    { id: "external-line", name: "直线剑法", description: "攻击前方直线 4 格，适合剑气和穿透型招式。", result: "使用剑法属性和直线范围。" },
    { id: "external-cleave", name: "近身刀法", description: "攻击身前目标及其侧边，适合近距离横扫。", result: "使用刀法属性和身前攻击范围。" },
    { id: "external-area", name: "自身范围奇门", description: "以自身为中心影响十字区域，适合阵法和奇门。", result: "施展距离为 0，影响十字 2 格。" },
  ]),
  internal: Object.freeze([
    { id: "internal-passive", name: "被动内功", description: "提供阴阳倾向、攻防暴击倍率和等级词缀。", result: "不会出现在战斗技能栏；可以不添加招式。" },
    { id: "internal-form", name: "带主动招式的内功", description: "在被动增益之外附带一项可施展招式。", result: "只有装备这门内功时，内功招式才可用。" },
  ]),
  special: Object.freeze([
    { id: "special-self", name: "自身强化绝技", description: "选择自身并通过 Buff 或 effects 改变战斗状态。", result: "不会直接造成伤害，必须继续添加效果。" },
    { id: "special-target", name: "目标型绝技", description: "选择一个目标，适合治疗、清除状态或改变怒气。", result: "不会直接造成伤害，必须继续添加效果。" },
    { id: "special-area", name: "范围型绝技", description: "选择 3 格内目标并影响周围区域。", result: "适合群体 Buff、驱散或资源变化。" },
  ]),
  legend: Object.freeze([
    { id: "legend-standard", name: "标准奥义", description: "由一门外功或招式起手，满足条件后按概率替换释放。", result: "图标、音效、范围和命中特效继承起手武学。" },
  ]),
});

const kindPathMap = new Map(martialKinds.map(([kind, , path]) => [kind, path]));
const pathKindMap = new Map(martialKinds.map(([kind, , path]) => [path, kind]));

export function getMartialPath(kind) {
  return kindPathMap.get(kind) || "";
}

export function getMartialKind(path) {
  return pathKindMap.get(path) || "";
}

export function createTargeting(overrides = {}) {
  return { canTargetSelf: false, castType: null, castSize: null, impactType: null, impactSize: null, ...overrides };
}

export function createSkillBuff() {
  return { id: "", level: 1, duration: 3, chance: 100 };
}

export function createSkillAffix() {
  return {
    effect: { type: "stat_modifier", stat: "attack", value: { op: "add", delta: 0 } },
    minimumLevel: 1,
  };
}

export function createFormSkill(id = "新招式") {
  return {
    id,
    name: id,
    description: "",
    icon: null,
    hard: 1,
    unlockLevel: 1,
    cooldown: 0,
    cost: { mp: null, rage: 0 },
    targeting: createTargeting(),
    powerExtra: 0,
    animation: null,
    audio: null,
    buffs: [],
  };
}

export function createLevelOverride(level = 10) {
  return { level, targeting: null, powerOverride: null, animation: null, cooldown: null };
}

export function createMartialDefinition(kind, id = "新武学") {
  if (kind === "internal") {
    return {
      id, name: id, description: "", icon: "", yin: 0, yang: 0,
      attackScale: 0, criticalScale: 0, defenceScale: 0, hard: 1, formSkills: [], affixes: [],
    };
  }
  if (kind === "special") {
    return {
      id, name: id, description: "", icon: "", cooldown: 0,
      cost: { mp: 0, rage: 0 }, targeting: createTargeting({ impactType: "single", castSize: 1, impactSize: 1 }),
      animation: "", audio: "", speech: null, buffs: [], effects: [],
    };
  }
  if (kind === "legend") {
    return {
      id, name: id, startSkill: "", probability: 0.1, requiredLevel: 1,
      conditions: [], buffs: [], powerExtra: 0, animation: null,
    };
  }
  return {
    id, name: id, description: "", icon: "", type: "quanzhang", isHarmony: false,
    affinity: 0, hard: 1, cooldown: 0, cost: { mp: null, rage: 0 }, targeting: createTargeting(),
    powerBase: 1, powerStep: 0, animation: "", audio: "", buffs: [], levelOverrides: [], formSkills: [], affixes: [],
  };
}

export function createMartialFromTemplate(kind, templateId, id = "新武学") {
  const record = createMartialDefinition(kind, id);
  if (templateId === "external-single") {
    record.type = "quanzhang";
    record.powerBase = 3;
    record.powerStep = 0.4;
    record.targeting = createTargeting({ castSize: 3, impactType: "single", impactSize: 1 });
  } else if (templateId === "external-line") {
    record.type = "jianfa";
    record.powerBase = 3;
    record.powerStep = 0.5;
    record.targeting = createTargeting({ castSize: 1, impactType: "line", impactSize: 4 });
  } else if (templateId === "external-cleave") {
    record.type = "daofa";
    record.powerBase = 4;
    record.powerStep = 0.45;
    record.targeting = createTargeting({ castSize: 1, impactType: "cleave", impactSize: 1 });
  } else if (templateId === "external-area") {
    record.type = "qimen";
    record.powerBase = 2;
    record.powerStep = 0.35;
    record.targeting = createTargeting({ castSize: 0, impactType: "plus", impactSize: 2, canTargetSelf: true });
  } else if (templateId === "internal-passive" || templateId === "internal-form") {
    record.yin = 25;
    record.yang = 25;
    record.attackScale = 0.15;
    record.criticalScale = 0.1;
    record.defenceScale = 0.15;
    if (templateId === "internal-form") {
      const form = createFormSkill(`${id}招式`);
      form.targeting = createTargeting({ castSize: 3, impactType: "single", impactSize: 1 });
      form.powerExtra = 2;
      record.formSkills.push(form);
    }
  } else if (templateId === "special-self") {
    record.targeting = createTargeting({ canTargetSelf: true, castSize: 0, impactType: "single", impactSize: 0 });
  } else if (templateId === "special-target") {
    record.targeting = createTargeting({ canTargetSelf: true, castSize: 6, impactType: "single", impactSize: 1 });
  } else if (templateId === "special-area") {
    record.targeting = createTargeting({ canTargetSelf: true, castSize: 3, impactType: "square", impactSize: 3 });
  }
  return record;
}

export function estimateExternalMpCost(record, level = 1) {
  const power = Math.max(0, Number(record?.powerBase) + (Math.max(1, level) - 1) * Number(record?.powerStep));
  const targeting = resolveEffectiveTargeting(record, "external");
  const baseCost = 8 * Math.trunc(power);
  if (targeting.impactType === "single" || targeting.impactType === "cleave") return baseCost * 2;
  if (targeting.impactType === "plus") return baseCost * targeting.impactSize;
  if (targeting.impactType === "star") return Math.trunc(baseCost * targeting.impactSize * 1.3);
  if (targeting.impactType === "line") return Math.trunc(baseCost * targeting.impactSize * 0.45);
  if (targeting.impactType === "square") return Math.trunc(baseCost * targeting.impactSize * 3);
  if (targeting.impactType === "fan") return Math.trunc(baseCost * targeting.impactSize * 2.5);
  return Math.trunc(baseCost * targeting.impactSize * 1.5);
}

export function getMartialReadiness(kind, record, context = {}) {
  const hasText = (value) => typeof value === "string" && value.trim().length > 0;
  const presentation = kind === "legend"
    ? { complete: hasText(record?.startSkill), detail: "奥义继承起手武学的图标、音效和命中特效" }
    : { complete: hasText(record?.icon) && (kind === "internal" || (hasText(record?.animation) && hasText(record?.audio))), detail: kind === "internal" ? "设置图标；内功招式单独设置战斗演出" : "设置图标、动画和音效" };
  let rules;
  if (kind === "external") rules = { complete: Number(record?.powerBase) > 0 && Boolean(resolveEffectiveTargeting(record, kind).impactType), detail: "确认威力、消耗、冷却和范围" };
  else if (kind === "internal") rules = { complete: [record?.attackScale, record?.criticalScale, record?.defenceScale].some((value) => Number(value) > 0) || (record?.affixes || []).length > 0, detail: "至少配置一项倍率或被动词缀" };
  else if (kind === "special") rules = { complete: (record?.buffs || []).length > 0 || (record?.effects || []).length > 0, detail: "绝技威力恒为 0，至少添加一个 Buff 或战斗效果" };
  else rules = { complete: hasText(record?.startSkill) && Number(record?.probability) > 0 && Number(record?.requiredLevel) >= 1, detail: "选择起手武学、等级和基础概率" };
  const diagnostics = Array.isArray(context.issues) ? context.issues : [];
  return [
    { id: "identity", label: "身份", complete: hasText(record?.id) && hasText(record?.name), detail: "填写稳定 ID 和显示名称", tab: "overview" },
    { id: "rules", label: "规则", ...rules, tab: kind === "internal" ? "overview" : "combat" },
    { id: "effects", label: "效果", complete: kind === "external" || kind === "internal" ? true : rules.complete, detail: kind === "external" ? "Buff 和词缀按设计选填" : kind === "internal" ? "词缀和主动招式按设计选填" : rules.detail, tab: "effects" },
    { id: "presentation", label: "演出", ...presentation, tab: "presentation" },
    { id: "diagnostics", label: "检查", complete: diagnostics.length === 0, detail: diagnostics.length ? `${diagnostics.length} 个静态问题待处理` : "静态引用检查通过", tab: "references" },
  ];
}

export function createLegendCondition(type = "skill") {
  if (type === "skill" || type === "internal_skill") return { type, targetId: "", level: 1 };
  return { type, targetId: "" };
}

export function createTargetSelector(type = "target") {
  if (type === "all_allies") return { type, includeSelf: true };
  if (type === "nearby_allies") return { type, radius: 2, includeSelf: true };
  return { type };
}

export function createSpecialEffect(type = "apply_buff") {
  const target = createTargetSelector("target");
  if (type === "apply_buff") return { type, target, buffId: "", level: 1, duration: 3, chance: 100 };
  if (type === "remove_buff") return { type, target, buffId: "" };
  if (["remove_negative_buffs", "remove_positive_buffs"].includes(type)) return { type, target };
  return { type, target, value: 0 };
}

export function cloneJson(value) {
  return typeof globalThis.structuredClone === "function"
    ? globalThis.structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

export function moveEntry(values, index, direction) {
  const target = index + direction;
  if (!Array.isArray(values) || index < 0 || index >= values.length || target < 0 || target >= values.length) return values;
  const next = [...values];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function ensureMartialShape(kind, record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return createMartialDefinition(kind);
  if (kind === "external" || kind === "internal") {
    if (!Array.isArray(record.formSkills)) record.formSkills = [];
    if (!Array.isArray(record.affixes)) record.affixes = [];
  }
  if (kind === "external") {
    if (!Array.isArray(record.buffs)) record.buffs = [];
    if (!Array.isArray(record.levelOverrides)) record.levelOverrides = [];
  }
  if (kind === "special" || kind === "legend") {
    if (!Array.isArray(record.buffs)) record.buffs = [];
  }
  if (kind === "special" && !Array.isArray(record.effects)) record.effects = [];
  if (kind === "legend" && !Array.isArray(record.conditions)) record.conditions = [];
  return record;
}

export function buildMartialIndex(documents) {
  const entries = [];
  const byId = new Map();
  const formsById = new Map();
  for (const [kind] of martialKinds) {
    const records = Array.isArray(documents?.[kind]) ? documents[kind] : [];
    records.forEach((record, index) => {
      const entry = { kind, index, id: String(record?.id || ""), name: String(record?.name || record?.id || ""), record, path: getMartialPath(kind) };
      entries.push(entry);
      if (entry.id) {
        const existing = byId.get(entry.id) || [];
        existing.push(entry);
        byId.set(entry.id, existing);
      }
      if (kind === "external" || kind === "internal") {
        (record.formSkills || []).forEach((form, formIndex) => {
          if (!form?.id) return;
          const formEntry = { kind: "form", sourceKind: kind, index, formIndex, id: form.id, name: form.name || form.id, record: form, parent: record, path: getMartialPath(kind) };
          const existing = formsById.get(form.id) || [];
          existing.push(formEntry);
          formsById.set(form.id, existing);
        });
      }
    });
  }
  return { entries, byId, formsById };
}

export function matchesMartialSearch(entry, query) {
  const normalized = String(query || "").trim().toLocaleLowerCase("zh-CN");
  if (!normalized) return true;
  const record = entry?.record || {};
  const formText = (record.formSkills || []).flatMap((form) => [form.id, form.name, form.description, form.animation]).join(" ");
  return [entry?.id, entry?.name, record.description, record.icon, record.animation, record.audio, record.type, record.startSkill, formText]
    .some((value) => String(value || "").toLocaleLowerCase("zh-CN").includes(normalized));
}

export function resolveExternalDefaults(type) {
  if (type === "jianfa") return { impactType: "line", castSize: 1, impactSize: 4 };
  if (type === "daofa") return { impactType: "cleave", castSize: 1, impactSize: 1 };
  if (type === "qimen") return { impactType: "plus", castSize: 0, impactSize: 2 };
  return { impactType: "single", castSize: 3, impactSize: 1 };
}

export function resolveEffectiveTargeting(record, kind, parent = null) {
  const targeting = record?.targeting || {};
  if (kind === "form" && parent) {
    const inherited = resolveEffectiveTargeting(parent, parent.type ? "external" : "internal");
    return {
      canTargetSelf: targeting.canTargetSelf ?? inherited.canTargetSelf,
      castSize: targeting.castSize ?? inherited.castSize,
      impactType: targeting.impactType ?? inherited.impactType,
      impactSize: targeting.impactSize ?? inherited.impactSize,
    };
  }
  if (kind === "external") {
    const defaults = resolveExternalDefaults(record?.type);
    return {
      canTargetSelf: targeting.canTargetSelf ?? false,
      castSize: targeting.castSize ?? defaults.castSize,
      impactType: targeting.impactType ?? defaults.impactType,
      impactSize: targeting.impactSize ?? defaults.impactSize,
    };
  }
  return {
    canTargetSelf: targeting.canTargetSelf ?? false,
    castSize: targeting.castSize ?? 0,
    impactType: targeting.impactType ?? "single",
    impactSize: targeting.impactSize ?? 0,
  };
}

export function resolvePresentation(record, kind, parent = null) {
  if (kind === "form" && parent) {
    return {
      icon: record.icon ?? parent.icon ?? "",
      animation: record.animation ?? parent.animation ?? "",
      audio: record.audio ?? parent.audio ?? "",
    };
  }
  return { icon: record?.icon || "", animation: record?.animation || "", audio: record?.audio || "" };
}

export function getImpactPositions(source, target, impactType, impactSize) {
  const size = Math.max(0, Number(impactSize) || 0);
  const key = (position) => `${position.x},${position.y}`;
  const result = new Map();
  const add = (x, y) => result.set(key({ x, y }), { x, y });
  const square = (center, radius) => {
    const values = [];
    for (let y = center.y - radius; y <= center.y + radius; y += 1) {
      for (let x = center.x - radius; x <= center.x + radius; x += 1) values.push({ x, y });
    }
    return values;
  };
  if (impactType === "single") add(target.x, target.y);
  else if (impactType === "plus" || impactType === "star" || impactType === "ring" || impactType === "x") {
    for (const position of square(target, size)) {
      const dx = Math.abs(position.x - target.x);
      const dy = Math.abs(position.y - target.y);
      if (impactType === "plus" && (dx === 0 || dy === 0)) add(position.x, position.y);
      if (impactType === "star" && (dx === 0 || dy === 0 || dx === dy)) add(position.x, position.y);
      if (impactType === "ring" && dx + dy === size) add(position.x, position.y);
      if (impactType === "x" && ((dx === 0 && dy === 0) || dx === dy)) add(position.x, position.y);
    }
  } else if (impactType === "square") {
    for (const position of square(target, Math.floor(size / 2))) add(position.x, position.y);
  } else {
    const dxRaw = target.x - source.x;
    const dyRaw = target.y - source.y;
    const horizontal = Math.abs(dxRaw) >= Math.abs(dyRaw);
    const dx = horizontal ? (dxRaw < 0 ? -1 : 1) : 0;
    const dy = horizontal ? 0 : (dyRaw < 0 ? -1 : 1);
    if (impactType === "line") {
      for (let step = 1; step <= Math.max(1, size); step += 1) add(source.x + dx * step, source.y + dy * step);
    } else if (impactType === "cleave") {
      add(target.x, target.y);
      if (dx !== 0) { add(target.x, target.y - 1); add(target.x, target.y + 1); }
      else { add(target.x - 1, target.y); add(target.x + 1, target.y); }
    } else if (impactType === "fan") {
      add(target.x, target.y);
      const sideX = dx === 0 ? 1 : 0;
      const sideY = dx === 0 ? 0 : 1;
      for (let distance = 1; distance <= size; distance += 1) {
        const cx = target.x + dx * distance;
        const cy = target.y + dy * distance;
        add(cx, cy);
        for (let offset = 1; offset <= distance; offset += 1) {
          add(cx + sideX * offset, cy + sideY * offset);
          add(cx - sideX * offset, cy - sideY * offset);
        }
      }
    } else add(target.x, target.y);
  }
  return new Set(result.keys());
}

export function collectAnimationReferences(documents) {
  const references = [];
  const add = (id, owner, role, kind) => {
    if (typeof id === "string" && id.trim()) references.push({ id: id.trim(), owner, role, kind });
  };
  for (const record of documents?.external || []) {
    add(record.animation, record.id, "命中特效", "external");
    for (const override of record.levelOverrides || []) add(override.animation, `${record.id} ${override.level}级`, "等级覆盖特效", "external");
    for (const form of record.formSkills || []) add(form.animation, form.id, "招式命中特效", "form");
  }
  for (const record of documents?.internal || []) for (const form of record.formSkills || []) add(form.animation, form.id, "内功招式特效", "form");
  for (const record of documents?.special || []) add(record.animation, record.id, "绝技命中特效", "special");
  for (const record of documents?.legend || []) add(record.animation, record.id, "奥义全屏特效", "legend");
  return references;
}

export function getMartialIssues(entry, context = {}) {
  const issues = [];
  const { animationIds = new Set(), invalidAnimationIds = new Set(), audioIds = new Set(), iconExists = () => true, buffIds = new Set(), externalIds = new Set(), internalIds = new Set(), specialIds = new Set(), talentIds = new Set(), startSkillIds = new Set(), formIdCounts = new Map() } = context;
  const record = entry?.record || {};
  if (!record.id) issues.push("缺少 ID");
  if (!record.name) issues.push("缺少名称");
  if (entry.kind !== "legend" && record.icon && !iconExists(record.icon)) issues.push(`图标资产不存在：${record.icon}`);
  if ((entry.kind === "external" || entry.kind === "special") && record.audio && !audioIds.has(record.audio)) issues.push(`音效资源不存在：${record.audio}`);
  const checkAnimation = (id, label) => {
    if (id && !animationIds.has(id)) issues.push(`${label}不存在：${id}`);
    else if (id && invalidAnimationIds.has(id)) issues.push(`${label}无法在 Web 预览：${id}`);
  };
  const checkBuffs = (buffs) => (buffs || []).forEach((buff) => { if (!buffIds.has(buff.id)) issues.push(`Buff 不存在：${buff.id || "未填写"}`); });
  if (entry.kind === "external") {
    checkAnimation(record.animation, "命中特效"); checkBuffs(record.buffs);
    (record.formSkills || []).forEach((form) => { checkAnimation(form.animation, `招式 ${form.id} 动画`); checkBuffs(form.buffs); if ((formIdCounts.get(form.id) || 0) > 1) issues.push(`招式 ID 重复：${form.id}`); });
    (record.levelOverrides || []).forEach((override) => checkAnimation(override.animation, `${override.level}级动画`));
    const levels = (record.levelOverrides || []).map((override) => override.level);
    if (new Set(levels).size !== levels.length) issues.push("等级覆盖存在重复等级");
  } else if (entry.kind === "internal") {
    (record.formSkills || []).forEach((form) => { checkAnimation(form.animation, `招式 ${form.id} 动画`); checkBuffs(form.buffs); if ((formIdCounts.get(form.id) || 0) > 1) issues.push(`招式 ID 重复：${form.id}`); });
  } else if (entry.kind === "special") {
    checkAnimation(record.animation, "绝技动画"); checkBuffs(record.buffs);
    (record.effects || []).filter((effect) => effect.type === "apply_buff" || effect.type === "remove_buff").forEach((effect) => { if (!buffIds.has(effect.buffId)) issues.push(`战斗效果 Buff 不存在：${effect.buffId || "未填写"}`); });
  } else if (entry.kind === "legend") {
    checkAnimation(record.animation, "奥义全屏特效"); checkBuffs(record.buffs);
    if (!startSkillIds.has(record.startSkill)) issues.push(`起手武学不存在：${record.startSkill || "未填写"}`);
    (record.conditions || []).forEach((condition) => {
      const set = condition.type === "skill" ? externalIds : condition.type === "internal_skill" ? internalIds : condition.type === "special_skill" ? specialIds : talentIds;
      if (!set.has(condition.targetId)) issues.push(`条件引用不存在：${condition.targetId || "未填写"}`);
    });
  }
  return issues;
}
