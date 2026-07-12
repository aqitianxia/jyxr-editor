import { bindImeSafeInput } from "../core/input-composition.js?v=20260711-core-17";
import { createEmbeddedJsonEditor, disposeEmbeddedCodeEditors } from "../ui/code-editor.js?v=20260711-stage6-1";
import { bindScrollMemory } from "../ui/scroll-memory.js?v=20260711-scroll-1";
import {
  createFormSkill,
  createLegendCondition,
  createLevelOverride,
  createSkillAffix,
  createSkillBuff,
  createSpecialEffect,
  getImpactPositions,
  getMartialIssues,
  getMartialReadiness,
  estimateExternalMpCost,
  filterMartialResources,
  impactTypes,
  legendConditionTypes,
  martialKinds,
  martialCreationTemplates,
  matchesMartialSearch,
  resolveEffectiveTargeting,
  resolvePresentation,
  specialEffectTypes,
  targetSelectorTypes,
  weaponTypes,
} from "../domain/martial-arts.js?v=20260711-stage8-5";

const tabs = Object.freeze([
  ["overview", "概要"], ["combat", "战斗参数"], ["growth", "招式与成长"],
  ["effects", "效果与条件"], ["presentation", "演出预览"], ["references", "引用诊断"], ["advanced", "高级 JSON"],
]);
const kindLabels = new Map(martialKinds.map(([kind, label]) => [kind, label]));

function el(tag, className = "", text = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== "") node.textContent = text;
  return node;
}

function button(label, className, onClick, title = "") {
  const node = el("button", className, label);
  node.type = "button";
  if (title) node.title = title;
  node.addEventListener("click", onClick);
  return node;
}

function input(value, onChange, options = {}) {
  const node = document.createElement(options.multiline ? "textarea" : "input");
  node.className = "input";
  if (!options.multiline) node.type = options.type || "text";
  node.value = value ?? "";
  if (options.placeholder) node.placeholder = options.placeholder;
  if (options.min !== undefined) node.min = String(options.min);
  if (options.max !== undefined) node.max = String(options.max);
  const read = () => options.type === "number" ? (options.nullable && node.value === "" ? null : Number(node.value) || 0) : node.value;
  if (options.live) bindImeSafeInput(node, () => onChange(read()));
  else node.addEventListener("change", () => onChange(read()));
  return node;
}

function select(value, choices, onChange, placeholder = "") {
  const node = el("select", "input");
  if (placeholder) node.appendChild(new Option(placeholder, ""));
  for (const choice of choices) {
    const pair = Array.isArray(choice) ? choice : [choice.id, choice.name || choice.id];
    const option = new Option(pair[1], pair[0]);
    option.selected = String(pair[0]) === String(value ?? "");
    node.appendChild(option);
  }
  node.addEventListener("change", () => onChange(node.value));
  return node;
}

function checkbox(value, onChange, label) {
  const wrapper = el("label", "martial-check");
  const node = document.createElement("input");
  node.type = "checkbox";
  node.checked = Boolean(value);
  node.addEventListener("change", () => onChange(node.checked));
  wrapper.append(node, el("span", "", label));
  return wrapper;
}

function field(label, control, hint = "") {
  const wrapper = el("label", "martial-field");
  wrapper.append(el("span", "martial-field-label", label), control);
  if (hint) wrapper.appendChild(el("small", "martial-field-hint", hint));
  return wrapper;
}

function section(parent, title, note = "") {
  const node = el("section", "martial-section");
  node.appendChild(el("h3", "", title));
  if (note) node.appendChild(el("p", "martial-section-note", note));
  parent.appendChild(node);
  return node;
}

function empty(parent, title, detail) {
  const node = el("div", "martial-empty");
  node.append(el("strong", "", title), el("p", "", detail));
  parent.appendChild(node);
}

function patchObject(context, target, patch) {
  Object.assign(target, patch);
  context.onMutate();
}

function nestedPatch(context, target, key, patch) {
  target[key] = { ...(target[key] || {}), ...patch };
  context.onMutate();
}

function renderCatalog(parent, context) {
  const { state } = context;
  const workspace = state.martialArtsWorkspace;
  const kinds = el("div", "martial-kind-tabs");
  for (const [kind, label] of martialKinds) {
    const count = workspace.documents[kind]?.length || 0;
    const item = button(`${label} ${count}`, "", () => context.onSelectKind(kind));
    item.classList.toggle("active", kind === workspace.activeKind);
    if (workspace.dirtyKinds.has(kind)) item.classList.add("dirty");
    kinds.appendChild(item);
  }
  parent.appendChild(kinds);
  const tools = el("div", "martial-catalog-tools");
  tools.append(input(workspace.search, context.onSearch, { type: "search", placeholder: "搜索名称、ID、招式…", live: true }), button("＋ 新建", "button primary", context.onOpenCreator));
  parent.appendChild(tools);

  const records = workspace.documents[workspace.activeKind] || [];
  const matches = records.map((record, index) => ({ record, index, entry: { kind: workspace.activeKind, record } }))
    .filter(({ entry }) => matchesMartialSearch(entry, workspace.search));
  const visibleLimit = Math.max(60, Number(workspace.visibleLimit) || 60);
  const shown = matches.slice(0, visibleLimit);
  const selected = matches.find((entry) => entry.index === workspace.selectedIndex);
  if (selected && !shown.includes(selected)) shown.unshift(selected);
  parent.appendChild(el("div", "martial-list-count", `显示 ${shown.length} / ${matches.length}，全部 ${records.length}`));
  const list = el("div", "martial-record-list");
  for (const { record, index } of shown) {
    const issues = context.getIssues({ kind: workspace.activeKind, record });
    const row = button("", "martial-record-row", () => context.onSelect(index));
    row.classList.toggle("active", index === workspace.selectedIndex);
    const thumb = el("span", "martial-record-thumb");
    const iconPath = context.getIconPath(record.icon);
    if (iconPath) {
      const image = document.createElement("img");
      image.src = `/api/assets/file?path=${encodeURIComponent(iconPath)}`;
      image.alt = "";
      image.loading = "lazy";
      thumb.appendChild(image);
    } else thumb.appendChild(el("span", "", kindLabels.get(workspace.activeKind)?.slice(0, 1) || "武"));
    const copy = el("span", "martial-record-copy");
    copy.append(el("strong", "", record.name || record.id || `未命名 ${index + 1}`), el("code", "", record.id || "缺少 ID"));
    const meta = el("span", "martial-record-meta");
    if ((record.formSkills || []).length) meta.appendChild(el("span", "", `${record.formSkills.length} 招`));
    if (issues.length) meta.appendChild(el("span", "martial-issue-count", String(issues.length)));
    row.append(thumb, copy, meta);
    list.appendChild(row);
  }
  if (visibleLimit < matches.length) list.appendChild(button(`再加载 ${Math.min(60, matches.length - visibleLimit)} 条`, "button secondary martial-list-more", context.onLoadMore));
  if (!matches.length) empty(list, "没有匹配的武学", "清除搜索词后再试，或新建一条定义。");
  parent.appendChild(list);
  bindScrollMemory(list, state.workspaceScrollPositions, `martial:list:${workspace.activeKind}`);
}

function renderHeaderMedia(context, record, kind) {
  const presentation = context.getQuickPresentation(kind, record);
  const media = el("div", "martial-header-media");
  const icon = button("", "martial-header-preview icon", () => context.onTab("presentation"), "查看或更换图标");
  const iconPath = context.getIconPath(presentation.icon);
  if (iconPath) {
    const image = document.createElement("img");
    image.src = `/api/assets/file?path=${encodeURIComponent(iconPath)}`;
    image.alt = record.name || record.id;
    icon.appendChild(image);
  } else icon.appendChild(el("span", "martial-header-placeholder", "无图标"));
  icon.appendChild(el("small", "", "图标"));
  const animation = el("div", "martial-header-preview animation");
  animation.setAttribute("role", "button");
  animation.tabIndex = 0;
  animation.title = presentation.animation ? `查看或更换动画：${presentation.animation}` : presentation.animationLabel;
  animation.addEventListener("click", () => context.onTab(presentation.targetTab));
  animation.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); context.onTab(presentation.targetTab); } });
  if (presentation.animation) {
    const player = renderAnimationPlayer(presentation.animation, context);
    player.classList.add("compact");
    animation.appendChild(player);
  } else animation.appendChild(el("span", "martial-header-placeholder", "无动画"));
  animation.appendChild(el("small", "", presentation.animationLabel));
  media.append(icon, animation);
  return media;
}

function renderCreationProgress(parent, context, record, kind) {
  const issues = context.getIssues({ kind, record });
  const readiness = getMartialReadiness(kind, record, { issues });
  const completeCount = readiness.filter((item) => item.complete).length;
  const guide = el("section", "martial-creation-progress");
  const header = el("div", "martial-progress-header");
  const copy = el("div");
  copy.append(el("strong", "", `创作进度 ${completeCount} / ${readiness.length}`), el("small", "", "按身份、规则、效果、演出、检查完成一门可运行武学"));
  header.append(copy, el("span", completeCount === readiness.length ? "martial-ready-badge ready" : "martial-ready-badge", completeCount === readiness.length ? "可进入游戏验证" : "继续完善"));
  guide.appendChild(header);
  const steps = el("div", "martial-progress-steps");
  readiness.forEach((item) => {
    const step = button("", `martial-progress-step ${item.complete ? "complete" : "pending"}`, () => context.onTab(item.tab));
    step.append(el("span", "martial-progress-mark", item.complete ? "✓" : "○"), el("strong", "", item.label), el("small", "", item.detail));
    steps.appendChild(step);
  });
  guide.appendChild(steps);
  const boundary = el("div", "martial-boundary-note");
  boundary.append(el("strong", "", "制作边界"), el("span", "", "数值、范围、Buff、词缀和现有效果可在这里完成；新动画、图集和 PCK 要去 Godot；全新战斗机制需要扩展运行时代码。"));
  guide.appendChild(boundary);
  parent.appendChild(guide);
}

function renderCreator(root, context) {
  const workspace = context.state.martialArtsWorkspace;
  if (!workspace.creatorOpen) return;
  const kind = workspace.activeKind;
  const overlay = el("div", "martial-creator-overlay");
  const dialog = el("section", "martial-creator-dialog");
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-label", `新建${kindLabels.get(kind)}`);
  const header = el("header", "martial-creator-header");
  const title = el("div");
  title.append(el("div", "martial-detail-eyebrow", `新建${kindLabels.get(kind)}`), el("h2", "", "先选择接近目标的起点"), el("p", "", "模板只填写运行时已有字段，不会自动创建 Godot 资源。已有武学很接近时，关闭此窗口后直接使用“复制”通常更快。"));
  header.append(title, button("×", "icon-button", context.onCloseCreator, "关闭"));
  dialog.appendChild(header);
  const templates = el("div", "martial-template-list");
  for (const template of martialCreationTemplates[kind] || []) {
    const card = button("", "martial-template-card", () => context.onSelectCreatorTemplate(template.id));
    card.classList.toggle("active", workspace.creatorTemplate === template.id);
    card.append(el("span", "martial-template-radio", workspace.creatorTemplate === template.id ? "●" : "○"), el("strong", "", template.name), el("p", "", template.description), el("small", "", template.result));
    templates.appendChild(card);
  }
  dialog.appendChild(templates);
  const reminder = el("div", "martial-creator-reminder");
  const reminders = kind === "external"
    ? ["外功可直接造成伤害", "空内力会按威力和范围自动计算", "动画是每个命中格的特效"]
    : kind === "internal"
      ? ["内功本体不能主动施展", "倍率和词缀提供被动收益", "主动能力必须放在内功招式中"]
      : kind === "special"
        ? ["绝技威力恒为 0", "至少添加 Buff 或 effects", "适合治疗、驱散、强化和资源变化"]
        : ["奥义由起手武学触发", "继承起手的图标、音效和命中范围", "同起手奥义按列表顺序判定"];
  reminders.forEach((text) => reminder.appendChild(el("span", "", text)));
  dialog.appendChild(reminder);
  const footer = el("footer", "martial-creator-actions");
  const create = button(`创建${kindLabels.get(kind)}`, "button primary", () => context.onCreate(workspace.creatorTemplate));
  create.disabled = !workspace.creatorTemplate;
  footer.append(button("取消", "button ghost", context.onCloseCreator), create);
  dialog.appendChild(footer);
  overlay.appendChild(dialog);
  overlay.addEventListener("click", (event) => { if (event.target === overlay) context.onCloseCreator(); });
  root.appendChild(overlay);
}

function renderOverview(parent, context, record, kind) {
  renderCreationProgress(parent, context, record, kind);
  const basic = section(parent, "基础信息", "ID 是剧情、角色与奥义引用的稳定键；发布后不宜随意修改。");
  const grid = el("div", "martial-fields-grid");
  grid.append(field("武学 ID", input(record.id, (value) => patchObject(context, record, { id: value }))), field("显示名称", input(record.name, (value) => patchObject(context, record, { name: value }))));
  if (kind !== "legend") grid.appendChild(field("说明", input(record.description, (value) => patchObject(context, record, { description: value }), { multiline: true }), "用于物品、角色和战斗界面的文本。"));
  basic.appendChild(grid);

  if (kind === "external") {
    const identity = section(parent, "武学类型", "兵器分类决定使用哪项角色武学属性，也决定范围字段为空时的默认攻击形状。");
    const fields = el("div", "martial-fields-grid");
    fields.append(field("兵器分类", select(record.type, weaponTypes, (value) => patchObject(context, record, { type: value })), "伤害计算会读取角色对应的拳掌、剑法、刀法或奇门属性。"), field("修炼难度", input(record.hard, (value) => patchObject(context, record, { hard: value }), { type: "number", min: 0 }), "数值越高，每级需要的修炼经验越多；它不直接增加伤害。"), field("内功适性", input(record.affinity, (value) => patchObject(context, record, { affinity: value }), { type: "number" }), "正数按装备内功阳性增伤，负数按阴性增伤，0 表示不吃阴阳适性。"), checkbox(record.isHarmony, (value) => patchObject(context, record, { isHarmony: value }), "阴阳调和"));
    identity.appendChild(fields);
  } else if (kind === "internal") {
    const scales = section(parent, "内功倾向", "百分比以小数保存，例如 0.15 表示 15%。10 级时阴阳值达到配置值；攻防倍率继续随等级增长，暴击倍率在 10 级达到上限。");
    const fields = el("div", "martial-fields-grid three");
    fields.append(field("阴性", input(record.yin, (value) => patchObject(context, record, { yin: value }), { type: "number" }), "供负适性外功计算阴性增伤。"), field("阳性", input(record.yang, (value) => patchObject(context, record, { yang: value }), { type: "number" }), "供正适性外功计算阳性增伤。"), field("攻击倍率", input(record.attackScale, (value) => patchObject(context, record, { attackScale: value }), { type: "number" }), "装备后扩大攻击浮动上限；0.15 表示 10 级基础值 15%。"), field("暴击倍率", input(record.criticalScale, (value) => patchObject(context, record, { criticalScale: value }), { type: "number" }), "乘到基础暴击概率上；10 级后不再随等级增加。"), field("防御倍率", input(record.defenceScale, (value) => patchObject(context, record, { defenceScale: value }), { type: "number" }), "装备后提高战斗防御计算。"), field("修炼难度", input(record.hard, (value) => patchObject(context, record, { hard: value }), { type: "number", min: 0 }), "越高越难升级，并提高内功自身的自动内力消耗。"));
    scales.appendChild(fields);
    scales.appendChild(el("div", "martial-callout", "内功本体不会出现在战斗技能栏。希望玩家主动施展时，请在“招式与成长”中添加内功招式；该招式只有装备本内功时可用。"));
  } else if (kind === "legend") {
    const trigger = section(parent, "触发入口", "同一批奥义按 JSON 顺序从上到下判定，第一条满足条件且概率成功的定义生效。");
    const fields = el("div", "martial-fields-grid");
    fields.append(field("起手武学 / 招式", select(record.startSkill, context.options.startSkills, (value) => patchObject(context, record, { startSkill: value }), "请选择起手武学")), field("所需等级", input(record.requiredLevel, (value) => patchObject(context, record, { requiredLevel: value }), { type: "number", min: 1 })), field("触发概率", input(record.probability, (value) => patchObject(context, record, { probability: value }), { type: "number", min: 0, max: 1 }), "0.3 表示 30%。"), field("额外威力", input(record.powerExtra, (value) => patchObject(context, record, { powerExtra: value }), { type: "number" })));
    trigger.appendChild(fields);
  }
}

function renderTargeting(sectionNode, context, record, kind, parentRecord = null) {
  const effective = resolveEffectiveTargeting(record, kind, parentRecord);
  const targeting = record.targeting || {};
  const grid = el("div", "martial-fields-grid");
  grid.append(field("施展距离", input(targeting.castSize ?? "", (value) => nestedPatch(context, record, "targeting", { castSize: value }), { type: "number", min: 0, nullable: true }), `当前生效：${effective.castSize} 格`), field("影响形状", select(targeting.impactType ?? "", impactTypes, (value) => nestedPatch(context, record, "targeting", { impactType: value || null }), "继承 / 默认"), `当前生效：${new Map(impactTypes).get(effective.impactType) || effective.impactType}`), field("影响尺寸", input(targeting.impactSize ?? "", (value) => nestedPatch(context, record, "targeting", { impactSize: value }), { type: "number", min: 0, nullable: true }), `当前生效：${effective.impactSize}`), checkbox(targeting.canTargetSelf ?? false, (value) => nestedPatch(context, record, "targeting", { canTargetSelf: value }), "允许选择自己"));
  sectionNode.appendChild(grid);
  sectionNode.appendChild(el("div", "martial-targeting-help", "施展距离决定目标能选多远；影响形状决定命中哪些格；影响尺寸的含义随形状变化。直线表示从施展者向目标方向延伸，面攻击按目标点展开，十字/米字/环状通常用于以自身为中心的范围技。"));
}

function renderCombat(parent, context, record, kind) {
  if (kind === "internal") {
    const note = section(parent, "内功战斗规则", "内功提供属性投影并承载可施展招式；它本身不是战斗技能。请在“招式与成长”中编辑内功招式的消耗、冷却和范围。");
    note.appendChild(el("div", "martial-callout", `攻击 ${record.attackScale ?? 0} · 暴击 ${record.criticalScale ?? 0} · 防御 ${record.defenceScale ?? 0}`));
    return;
  }
  if (kind === "legend") {
    const note = section(parent, "奥义继承规则", "奥义的图标、音效、格子范围与命中特效均继承起手武学；这里只叠加威力、Buff 和全屏演出。编辑器不模拟最终伤害。");
    note.appendChild(el("div", "martial-callout", `起手：${record.startSkill || "未设置"} · 额外威力：${record.powerExtra ?? 0}`));
    return;
  }
  if (kind === "special") {
    const warning = section(parent, "绝技作用方式", "绝技运行时威力固定为 0，不会因为选择了敌人或动画就自动造成伤害。");
    warning.appendChild(el("div", "martial-callout warning", "必须在“效果与条件”里至少添加一个 Buff 或战斗效果。治疗用“恢复生命”，强化用 Buff，驱散用移除状态，怒气与行动值使用对应 effects。"));
  }
  const costs = section(parent, "消耗与冷却");
  const cost = record.cost || {};
  const costFields = el("div", "martial-fields-grid three");
  const autoMp = kind === "external" ? estimateExternalMpCost(record, context.state.martialArtsWorkspace.previewLevel) : null;
  costFields.append(field("内力", input(cost.mp ?? "", (value) => nestedPatch(context, record, "cost", { mp: value }), { type: "number", min: 0, nullable: true }), kind === "external" ? `留空自动计算；按当前 ${context.state.martialArtsWorkspace.previewLevel} 级预览约为 ${autoMp}。范围越大通常越贵。` : "施展时固定扣除；绝技不会自动计算。"), field("怒气", input(cost.rage ?? 0, (value) => nestedPatch(context, record, "cost", { rage: value }), { type: "number", min: 0 }), "施展时固定扣除；0 表示不消耗怒气。"), field("冷却回合", input(record.cooldown ?? 0, (value) => patchObject(context, record, { cooldown: value }), { type: "number", min: 0 }), "0 表示没有额外冷却；数值越大，重复使用间隔越长。"));
  costs.appendChild(costFields);
  if (kind === "external") {
    const power = section(parent, "基础威力", "配置威力 = 基础威力 +（当前等级 - 1）× 每级成长。最终伤害还会乘入兵器属性、臂力、装备内功、词缀、Buff 与目标防御。");
    const fields = el("div", "martial-fields-grid");
    fields.append(field("基础威力", input(record.powerBase, (value) => patchObject(context, record, { powerBase: value }), { type: "number" }), "1 级时使用的配置威力。"), field("每级成长", input(record.powerStep, (value) => patchObject(context, record, { powerStep: value }), { type: "number" }), "每提升一级增加的配置威力。"), field(`等级 ${context.state.martialArtsWorkspace.previewLevel} 配置威力`, input((Number(record.powerBase) + (context.state.martialArtsWorkspace.previewLevel - 1) * Number(record.powerStep)).toFixed(2), () => {}), "只读估算，不是最终伤害。"));
    fields.lastElementChild.querySelector("input").readOnly = true;
    power.appendChild(fields);
  }
  const targeting = section(parent, "选择与影响范围", "空的外功范围会按兵器分类使用运行时默认值；下方展示当前生效值。");
  renderTargeting(targeting, context, record, kind);
  targeting.appendChild(renderRangeGrid(record, kind));
}

function renderRangeGrid(record, kind, parentRecord = null) {
  const effective = resolveEffectiveTargeting(record, kind, parentRecord);
  const source = { x: 2, y: 1 };
  const target = { x: Math.min(10, source.x + Math.max(1, effective.castSize)), y: 1 };
  const impacts = getImpactPositions(source, target, effective.impactType, effective.impactSize);
  const wrapper = el("div", "martial-range-preview");
  const grid = el("div", "martial-range-grid");
  for (let y = 0; y < 4; y += 1) for (let x = 0; x < 11; x += 1) {
    const cell = el("span", "martial-range-cell");
    if (x === source.x && y === source.y) { cell.classList.add("source"); cell.textContent = "我"; }
    else if (x === target.x && y === target.y) { cell.classList.add("target"); cell.textContent = "靶"; }
    else if (impacts.has(`${x},${y}`)) cell.classList.add("impact");
    grid.appendChild(cell);
  }
  wrapper.append(grid, el("small", "", `11 × 4 战场预览 · ${new Map(impactTypes).get(effective.impactType) || effective.impactType} · 尺寸 ${effective.impactSize}`));
  return wrapper;
}

function renderForms(parent, context, record, kind) {
  if (kind !== "external" && kind !== "internal") {
    const sectionNode = section(parent, kind === "legend" ? "判定顺序" : "等级成长");
    sectionNode.appendChild(el("div", "martial-callout", kind === "legend" ? "奥义优先级由左侧列表顺序决定，可使用页头的上移、下移调整。" : "绝技当前没有独立等级覆盖表；它使用定义中的固定消耗、范围和效果。"));
    return;
  }
  const forms = record.formSkills || (record.formSkills = []);
  if (forms.length && context.state.martialArtsWorkspace.selectedFormIndex < 0) {
    context.state.martialArtsWorkspace.selectedFormIndex = 0;
  }
  const formSection = section(parent, "可施展招式", "招式嵌套保存在父武学中。空的图标、动画、音效和范围字段按运行时规则继承父武学。");
  const toolbar = el("div", "martial-array-toolbar");
  toolbar.append(el("strong", "", `${forms.length} 个招式`), button("＋ 添加招式", "button secondary", context.onAddForm));
  formSection.appendChild(toolbar);
  const chips = el("div", "martial-form-tabs");
  forms.forEach((form, index) => {
    const chip = button(form.name || form.id || `招式 ${index + 1}`, "", () => context.onSelectForm(index));
    chip.classList.toggle("active", index === context.state.martialArtsWorkspace.selectedFormIndex);
    chips.appendChild(chip);
  });
  formSection.appendChild(chips);
  const index = context.state.martialArtsWorkspace.selectedFormIndex;
  const form = forms[index];
  if (form) renderFormEditor(formSection, context, form, record, index);
  else if (!forms.length) empty(formSection, "尚无招式", kind === "internal" ? "添加招式后，这门内功才能提供可主动施展的技能。" : "外功本体仍可直接施展，也可以添加额外招式。 ");

  if (kind === "external") renderLevelOverrides(parent, context, record);
}

function renderFormEditor(parent, context, form, parentRecord, index) {
  const editor = el("div", "martial-form-editor");
  const actions = el("div", "martial-array-actions");
  actions.append(button("复制", "button ghost", () => context.onDuplicateForm(index)), button("删除", "button danger", () => context.onDeleteForm(index)));
  editor.appendChild(actions);
  const grid = el("div", "martial-fields-grid");
  grid.append(field("招式 ID", input(form.id, (value) => patchObject(context, form, { id: value }))), field("显示名称", input(form.name, (value) => patchObject(context, form, { name: value }))), field("解锁等级", input(form.unlockLevel, (value) => patchObject(context, form, { unlockLevel: value }), { type: "number", min: 1 })), field("修炼难度", input(form.hard, (value) => patchObject(context, form, { hard: value }), { type: "number", min: 0 })), field("额外威力", input(form.powerExtra, (value) => patchObject(context, form, { powerExtra: value }), { type: "number" })), field("冷却回合", input(form.cooldown, (value) => patchObject(context, form, { cooldown: value }), { type: "number", min: 0 })));
  grid.appendChild(field("说明", input(form.description, (value) => patchObject(context, form, { description: value }), { multiline: true })));
  editor.appendChild(grid);
  const cost = form.cost || {};
  const costs = el("div", "martial-fields-grid");
  costs.append(field("内力", input(cost.mp ?? "", (value) => nestedPatch(context, form, "cost", { mp: value }), { type: "number", min: 0, nullable: true }), "空值继承父武学。"), field("怒气", input(cost.rage ?? 0, (value) => nestedPatch(context, form, "cost", { rage: value }), { type: "number", min: 0 })));
  editor.appendChild(costs);
  const range = el("div", "martial-subsection");
  range.appendChild(el("h4", "", "招式范围"));
  renderTargeting(range, context, form, "form", parentRecord);
  range.appendChild(renderRangeGrid(form, "form", parentRecord));
  editor.appendChild(range);
  const presentation = resolvePresentation(form, "form", parentRecord);
  const media = el("div", "martial-subsection");
  media.appendChild(el("h4", "", "招式表现"));
  const mediaFields = el("div", "martial-fields-grid");
  mediaFields.append(
    field("图标", renderResourceSelection(context, { type: "icon", target: form, field: "icon", clearValue: null, value: form.icon, effectiveValue: presentation.icon }), `空值继承：${presentation.icon || "未设置"}`),
    field("命中特效", select(form.animation ?? "", context.animationChoices, (value) => patchObject(context, form, { animation: value || null }), "继承父武学"), `当前生效：${presentation.animation || "未设置"}`),
    field("音效", renderResourceSelection(context, { type: "audio", target: form, field: "audio", clearValue: null, value: form.audio, effectiveValue: presentation.audio }), `空值继承：${presentation.audio || "未设置"}`),
  );
  media.appendChild(mediaFields);
  editor.appendChild(media);
  const buffs = form.buffs || [];
  const buffNode = el("div", "martial-subsection");
  const buffHeader = el("div", "martial-array-toolbar");
  buffHeader.append(el("h4", "", `招式 Buff（${buffs.length}）`), button("＋ 添加 Buff", "button secondary", () => { (form.buffs ||= []).push(createSkillBuff()); context.onMutate(); }));
  buffNode.appendChild(buffHeader);
  buffs.forEach((entry, buffIndex) => {
    const row = el("div", "martial-array-row five");
    row.append(field("Buff", select(entry.id, context.options.buffs, (value) => patchObject(context, entry, { id: value }), "请选择")), field("等级", input(entry.level ?? 1, (value) => patchObject(context, entry, { level: value }), { type: "number", min: 0 })), field("持续", input(entry.duration ?? 0, (value) => patchObject(context, entry, { duration: value }), { type: "number", min: 0 })), field("概率 %", input(entry.chance ?? 100, (value) => patchObject(context, entry, { chance: value }), { type: "number", min: 0, max: 100 })), button("×", "icon-button danger", () => { form.buffs.splice(buffIndex, 1); context.onMutate(); }, "删除 Buff"));
    buffNode.appendChild(row);
  });
  editor.appendChild(buffNode);
  parent.appendChild(editor);
}

function renderLevelOverrides(parent, context, record) {
  const node = section(parent, "等级覆盖", "达到指定等级后覆盖范围、威力、动画或冷却。重复等级会被诊断标记。");
  const list = record.levelOverrides || (record.levelOverrides = []);
  const toolbar = el("div", "martial-array-toolbar");
  toolbar.append(el("strong", "", `${list.length} 条覆盖`), button("＋ 添加", "button secondary", () => { list.push(createLevelOverride()); context.onMutate(); }));
  node.appendChild(toolbar);
  list.forEach((entry, index) => {
    const targeting = entry.targeting || {};
    const row = el("div", "martial-level-row");
    row.append(field("等级", input(entry.level, (value) => patchObject(context, entry, { level: value }), { type: "number", min: 1 })), field("威力覆盖", input(entry.powerOverride ?? "", (value) => patchObject(context, entry, { powerOverride: value }), { type: "number", nullable: true })), field("冷却覆盖", input(entry.cooldown ?? "", (value) => patchObject(context, entry, { cooldown: value }), { type: "number", min: 0, nullable: true })), field("影响形状", select(targeting.impactType ?? "", impactTypes, (value) => { entry.targeting = { ...(entry.targeting || {}), impactType: value || null }; context.onMutate(); }, "不覆盖")), field("影响尺寸", input(targeting.impactSize ?? "", (value) => { entry.targeting = { ...(entry.targeting || {}), impactSize: value }; context.onMutate(); }, { type: "number", min: 0, nullable: true })), field("动画覆盖", select(entry.animation ?? "", context.animationChoices, (value) => patchObject(context, entry, { animation: value || null }), "不覆盖")), button("×", "icon-button danger", () => { list.splice(index, 1); context.onMutate(); }, "删除等级覆盖"));
    node.appendChild(row);
  });
}

function renderEffects(parent, context, record, kind) {
  const guide = section(parent, "效果怎么选");
  const guideText = kind === "external"
    ? "想让命中的敌人中毒、眩晕或减速，用“命中 Buff”；想让角色学会武学后永久获得属性或强化另一技能，用“被动词缀”；更复杂的即时规则不属于外功现有数据能力。"
    : kind === "internal"
      ? "内功的常驻收益主要写在“被动词缀”；需要玩家主动施展的能力应创建内功招式，再给招式配置 Buff。只有标记 requiresEquippedInternalSkill 的词缀才要求当前装备。"
      : kind === "special"
        ? "持续数回合的状态用 Buff；立即治疗、增减怒气、调整行动值或驱散状态用 effects。绝技本身不造成伤害，至少需要其中一种效果。"
        : "奥义 Buff 会随奥义命中处理；触发条件必须全部满足，之后才按基础概率判定。起手相同的多条奥义按列表从上到下尝试。";
  guide.appendChild(el("div", "martial-callout", guideText));
  if (kind === "external" || kind === "internal") renderAffixes(parent, context, record);
  if (kind !== "internal") renderBuffs(parent, context, record);
  if (kind === "special") renderSpecialEffects(parent, context, record);
  if (kind === "legend") renderLegendConditions(parent, context, record);
}

function renderBuffs(parent, context, record) {
  const node = section(parent, "命中 Buff", "Buff 会按等级、持续回合和概率施加到运行时目标。");
  const list = record.buffs || (record.buffs = []);
  const toolbar = el("div", "martial-array-toolbar");
  toolbar.append(el("strong", "", `${list.length} 条`), button("＋ 添加 Buff", "button secondary", () => { list.push(createSkillBuff()); context.onMutate(); }));
  node.appendChild(toolbar);
  list.forEach((entry, index) => {
    const row = el("div", "martial-array-row five");
    row.append(field("Buff", select(entry.id, context.options.buffs, (value) => patchObject(context, entry, { id: value }), "请选择")), field("等级", input(entry.level ?? 1, (value) => patchObject(context, entry, { level: value }), { type: "number", min: 0 })), field("持续", input(entry.duration ?? 0, (value) => patchObject(context, entry, { duration: value }), { type: "number", min: 0 })), field("概率 %", input(entry.chance ?? 100, (value) => patchObject(context, entry, { chance: value }), { type: "number", min: 0, max: 100 })), button("×", "icon-button danger", () => { list.splice(index, 1); context.onMutate(); }, "删除 Buff"));
    node.appendChild(row);
  });
}

function renderAffixes(parent, context, record) {
  const node = section(parent, "被动词缀", "词缀从最低等级开始投影到角色快照；复杂 effect 可在高级 JSON 中完整编辑。");
  const list = record.affixes || (record.affixes = []);
  const toolbar = el("div", "martial-array-toolbar");
  toolbar.append(el("strong", "", `${list.length} 条`), button("＋ 添加词缀", "button secondary", () => { list.push(createSkillAffix()); context.onMutate(); }));
  node.appendChild(toolbar);
  list.forEach((entry, index) => {
    const effect = entry.effect || {};
    const row = el("div", "martial-affix-row");
    row.append(field("最低等级", input(entry.minimumLevel ?? 1, (value) => patchObject(context, entry, { minimumLevel: value }), { type: "number", min: 1 })), field("效果类型", input(effect.type ?? "", (value) => { entry.effect = { ...(entry.effect || {}), type: value }; context.onMutate(); })), field("目标属性 / 武学", input(effect.stat ?? effect.skillId ?? effect.weaponType ?? "", (value) => { const next = { ...(entry.effect || {}) }; if ("skillId" in next) next.skillId = value; else if ("weaponType" in next) next.weaponType = value; else next.stat = value; entry.effect = next; context.onMutate(); })), field("运算", input(effect.value?.op ?? "", (value) => { entry.effect = { ...(entry.effect || {}), value: { ...(entry.effect?.value || {}), op: value } }; context.onMutate(); })), field("数值", input(effect.value?.delta ?? effect.value?.factor ?? 0, (value) => { const valueKey = "factor" in (entry.effect?.value || {}) ? "factor" : "delta"; entry.effect = { ...(entry.effect || {}), value: { ...(entry.effect?.value || {}), [valueKey]: value } }; context.onMutate(); }, { type: "number" })), button("×", "icon-button danger", () => { list.splice(index, 1); context.onMutate(); }, "删除词缀"));
    node.appendChild(row);
  });
}

function renderLegendConditions(parent, context, record) {
  const node = section(parent, "触发条件", "所有条件都满足后才进入概率判定。");
  const list = record.conditions || (record.conditions = []);
  const toolbar = el("div", "martial-array-toolbar");
  toolbar.append(el("strong", "", `${list.length} 项`), button("＋ 添加条件", "button secondary", () => { list.push(createLegendCondition()); context.onMutate(); }));
  node.appendChild(toolbar);
  list.forEach((entry, index) => {
    const choices = context.options.conditions[entry.type] || [];
    const row = el("div", "martial-array-row four");
    row.append(field("条件类型", select(entry.type, legendConditionTypes, (value) => { const replacement = createLegendCondition(value); Object.keys(entry).forEach((key) => delete entry[key]); Object.assign(entry, replacement); context.onMutate(); })), field("目标", select(entry.targetId, choices, (value) => patchObject(context, entry, { targetId: value }), "请选择")), field("最低等级", input(entry.level ?? 1, (value) => patchObject(context, entry, { level: value }), { type: "number", min: 1 })), button("×", "icon-button danger", () => { list.splice(index, 1); context.onMutate(); }, "删除条件"));
    node.appendChild(row);
  });
}

function renderSpecialEffects(parent, context, record) {
  const node = section(parent, "战斗效果", "效果由运行时按列表顺序执行。目标可指向自身、命中目标或双方队伍。");
  const list = record.effects || (record.effects = []);
  const toolbar = el("div", "martial-array-toolbar");
  toolbar.append(el("strong", "", `${list.length} 项`), button("＋ 添加效果", "button secondary", () => { list.push(createSpecialEffect()); context.onMutate(); }));
  node.appendChild(toolbar);
  list.forEach((entry, index) => {
    const target = entry.target || { type: "target" };
    const row = el("div", "martial-effect-row");
    row.append(field("效果", select(entry.type, specialEffectTypes, (value) => { const replacement = createSpecialEffect(value); Object.keys(entry).forEach((key) => delete entry[key]); Object.assign(entry, replacement); context.onMutate(); })), field("目标", select(target.type, targetSelectorTypes, (value) => nestedPatch(context, entry, "target", { type: value }))));
    if ("buffId" in entry) row.appendChild(field("Buff", select(entry.buffId, context.options.buffs, (value) => patchObject(context, entry, { buffId: value }), "请选择")));
    if ("value" in entry) row.appendChild(field("数值", input(entry.value, (value) => patchObject(context, entry, { value }), { type: "number" })));
    if ("level" in entry) row.appendChild(field("等级", input(entry.level, (value) => patchObject(context, entry, { level: value }), { type: "number" })));
    if ("duration" in entry) row.appendChild(field("持续", input(entry.duration, (value) => patchObject(context, entry, { duration: value }), { type: "number" })));
    if ("chance" in entry) row.appendChild(field("概率 %", input(entry.chance, (value) => patchObject(context, entry, { chance: value }), { type: "number", min: 0, max: 100 })));
    if (target.type === "nearby_allies") row.appendChild(field("半径", input(target.radius ?? 2, (value) => nestedPatch(context, entry, "target", { radius: value }), { type: "number", min: 0 })));
    if (target.type === "all_allies" || target.type === "nearby_allies") row.appendChild(checkbox(target.includeSelf ?? true, (value) => nestedPatch(context, entry, "target", { includeSelf: value }), "包含自己"));
    row.appendChild(button("×", "icon-button danger", () => { list.splice(index, 1); context.onMutate(); }, "删除效果"));
    node.appendChild(row);
  });
}

function renderPresentation(parent, context, record, kind) {
  if (kind === "internal") {
    const node = section(parent, "内功表现", "内功本体只有图标；战斗动画、音效由嵌套招式定义或继承。");
    renderIconField(node, context, record);
    return;
  }
  if (kind !== "legend") {
    const icon = section(parent, "图标");
    renderIconField(icon, context, record);
    const audio = section(parent, "音效", "打开选择器后可搜索并试听 resources.json 中“音效”资源组的已有音效。");
    const audioPath = context.getAudioPath(record.audio);
    audio.appendChild(field("音效资源", renderResourceSelection(context, { type: "audio", target: record, field: "audio", clearValue: "", value: record.audio })));
    if (audioPath) { const player = document.createElement("audio"); player.controls = true; player.src = `/api/assets/file?path=${encodeURIComponent(audioPath)}`; audio.appendChild(player); }
  }
  const animation = section(parent, kind === "legend" ? "奥义全屏动画" : "命中特效动画", kind === "legend" ? "这里是覆盖战场的全屏叠加动画。命中动画、图标和音效仍继承起手武学。可以更换已有动画引用，但新动画仍需在 Godot 制作。" : "可以从已有 Godot AnimationLibrary 中更换动画引用并立即预览；编辑器不会修改 .tres/.res，新增动画仍需在 Godot 制作并打入 PCK。");
  animation.appendChild(field("Godot 动画", select(record.animation ?? "", context.animationChoices, (value) => patchObject(context, record, { animation: value || null }), "未设置")));
  animation.appendChild(renderAnimationPlayer(record.animation, context));
  if (kind === "special") renderSpeech(parent, context, record);
}

function renderIconField(parent, context, record) {
  const fields = el("div", "martial-fields-grid");
  fields.append(field("从现有图标选择", renderResourceSelection(context, { type: "icon", target: record, field: "icon", clearValue: "", value: record.icon }), "弹窗会显示现有图标缩略图；选择后只修改当前武学的 icon ID。"), field("图标 ID", input(record.icon ?? "", (value) => patchObject(context, record, { icon: value })), "可手动填写 PCK 中提供的自定义图标 ID；新增图片仍需进入资源制作流程。"));
  parent.appendChild(fields);
  const path = context.getIconPath(record.icon);
  const preview = el("div", "martial-icon-preview");
  if (path) { const image = document.createElement("img"); image.src = `/api/assets/file?path=${encodeURIComponent(path)}`; image.alt = record.name || record.id; preview.append(image, el("code", "", path)); }
  else preview.appendChild(el("span", "martial-missing", record.icon ? "未找到图标资产" : "尚未设置图标"));
  parent.appendChild(preview);
}

function renderResourceSelection(context, { type, target, field: fieldName, clearValue, value, effectiveValue = "" }) {
  const resolvedValue = String(value || "");
  const shownValue = resolvedValue || String(effectiveValue || "");
  const path = type === "icon" ? context.getIconPath(shownValue) : context.getAudioPath(shownValue);
  const control = button("", `martial-resource-select ${type}`, () => context.onOpenResourcePicker({ type, target, field: fieldName, clearValue, selectedId: resolvedValue }));
  const media = el("span", "martial-resource-select-media");
  if (type === "icon" && path) {
    const image = document.createElement("img");
    image.src = `/api/assets/file?path=${encodeURIComponent(path)}`;
    image.alt = shownValue;
    media.appendChild(image);
  } else media.appendChild(el("span", "", type === "audio" ? "♪" : "图"));
  const copy = el("span", "martial-resource-select-copy");
  copy.append(el("strong", "", resolvedValue || (effectiveValue ? `继承 ${effectiveValue}` : type === "audio" ? "选择音效" : "选择图标")), el("small", "", path || (resolvedValue ? "当前引用无法预览" : "打开资源选择器")));
  control.append(media, copy, el("span", "martial-resource-select-arrow", "›"));
  return control;
}

function renderResourcePicker(root, context) {
  const picker = context.state.martialArtsWorkspace.resourcePicker;
  if (!picker?.open) return;
  const isAudio = picker.type === "audio";
  const allEntries = isAudio ? context.audioLibrary : context.options.icons;
  const keyOf = (entry) => entry.key || entry.id || entry.path;
  const entries = filterMartialResources(allEntries, picker.search);
  const selected = entries.find((entry) => keyOf(entry) === picker.selectedId)
    || allEntries.find((entry) => keyOf(entry) === picker.selectedId)
    || null;
  const overlay = el("div", "martial-resource-picker-overlay");
  overlay.addEventListener("click", (event) => { if (event.target === overlay) context.onCloseResourcePicker(); });
  overlay.addEventListener("keydown", (event) => { if (event.key === "Escape") context.onCloseResourcePicker(); });
  const dialog = el("section", `martial-resource-picker ${isAudio ? "audio" : "icon"}`);
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  const header = el("header", "martial-resource-picker-header");
  const title = el("div");
  title.append(el("span", "martial-detail-eyebrow", isAudio ? "音效资源" : "图标资源"), el("h2", "", isAudio ? "选择、试听或注册音效" : "选择现有武学图标"), el("p", "", isAudio ? "已注册音效可直接使用；未注册文件需要先创建 resources.json 资源 ID。音频文件本身不会被修改。" : "这里只引用现有图片，不会修改 Godot 图集或 PCK。"));
  header.append(title, button("×", "icon-button", context.onCloseResourcePicker, "关闭"));
  const search = input(picker.search, context.onResourcePickerSearch, { type: "search", placeholder: isAudio ? "搜索音效 ID 或路径" : "搜索图标 ID 或路径", live: true });
  search.classList.add("martial-resource-picker-search");
  const body = el("div", "martial-resource-picker-body");
  const gallery = el("div", `martial-resource-picker-gallery ${isAudio ? "audio" : "icon"}`);
  for (const entry of entries) {
    const entryKey = keyOf(entry);
    const card = button("", "martial-resource-picker-card", () => context.onSelectResourcePicker(entryKey));
    card.classList.toggle("active", entryKey === picker.selectedId);
    const media = el("span", "martial-resource-picker-card-media");
    if (!isAudio && entry.path) {
      const image = document.createElement("img");
      image.src = `/api/assets/file?path=${encodeURIComponent(entry.path)}`;
      image.alt = entry.name || entry.id;
      image.loading = "lazy";
      media.appendChild(image);
    } else media.appendChild(el("span", "", "♪"));
    const copy = el("span", "martial-resource-picker-card-copy");
    copy.append(el("strong", "", entry.name || entry.id || entry.path), el("code", "", entry.id || "未注册"), el("small", "", entry.path || entry.value || "资源路径不可预览"));
    card.append(media, copy);
    gallery.appendChild(card);
  }
  if (!entries.length) empty(gallery, "没有匹配资源", "更换搜索词后再试。自定义 PCK 图标仍可在表单中手动填写 ID。 ");
  const detail = el("aside", "martial-resource-picker-detail");
  if (!selected) empty(detail, "请选择一项", isAudio ? "选择音效后可先试听，再决定是否使用。" : "选择图标后可查看大图。 ");
  else {
    if (isAudio && selected.path) {
      const player = document.createElement("audio");
      player.controls = true;
      player.preload = "metadata";
      player.src = `/api/assets/file?path=${encodeURIComponent(selected.path)}`;
      detail.appendChild(player);
    } else if (!isAudio && selected.path) {
      const image = document.createElement("img");
      image.src = `/api/assets/file?path=${encodeURIComponent(selected.path)}`;
      image.alt = selected.name || selected.id;
      detail.appendChild(image);
    }
    detail.append(el("h3", "", selected.name || selected.id || selected.path), el("code", "", selected.id || "尚未注册资源 ID"), el("small", "", selected.path || selected.value || "资源路径不可预览"));
    if (isAudio && !selected.id) {
      const registration = el("div", "martial-audio-registration");
      registration.append(el("strong", "", "注册为音效资源"), el("p", "", "注册会立即保存到 resources.json；武学修改仍需使用顶部保存按钮。"));
      const resourceId = input(`音效.${selected.name || "新音效"}`, () => {});
      resourceId.classList.add("martial-audio-registration-id");
      registration.append(resourceId, button("注册并使用", "button primary", () => context.onRegisterAudioResource(resourceId.value, selected)));
      detail.appendChild(registration);
    } else detail.appendChild(button(isAudio ? "使用此音效" : "使用此图标", "button primary", context.onApplyResourcePicker));
  }
  const footer = el("footer", "martial-resource-picker-actions");
  footer.append(button(picker.clearValue === null ? "继承父武学" : "清空当前引用", "button ghost", context.onClearResourcePicker), button("取消", "button secondary", context.onCloseResourcePicker));
  body.append(gallery, detail);
  dialog.append(header, search, body, footer);
  overlay.appendChild(dialog);
  root.appendChild(overlay);
  queueMicrotask(() => search.focus());
}

function renderSpeech(parent, context, record) {
  const node = section(parent, "施展台词", "运行时从台词列表中选择；chance 为空时使用运行时默认概率。");
  const speech = record.speech;
  node.appendChild(checkbox(Boolean(speech), (enabled) => { record.speech = enabled ? { lines: [] } : null; context.onMutate(); }, "启用施展台词"));
  if (!speech) return;
  node.appendChild(field("触发概率", input(speech.chance ?? "", (value) => patchObject(context, speech, { chance: value }), { type: "number", min: 0, max: 1 }), "0 到 1；留空使用运行时默认值。"));
  const lines = speech.lines || [];
  lines.forEach((line, index) => {
    const row = el("div", "martial-line-row");
    row.append(input(line, (value) => { lines[index] = value; context.onMutate(); }), button("×", "icon-button danger", () => { lines.splice(index, 1); context.onMutate(); }, "删除台词"));
    node.appendChild(row);
  });
  node.appendChild(button("＋ 添加台词", "button secondary", () => { (speech.lines ||= []).push(""); context.onMutate(); }));
}

function renderAnimationPlayer(animationId, context) {
  const host = el("div", "martial-animation-player");
  const canvas = document.createElement("canvas");
  canvas.width = 560; canvas.height = 260;
  const status = el("div", "martial-animation-status", animationId ? "正在加载动画…" : "尚未选择动画");
  const controls = el("div", "martial-animation-controls");
  const play = button("▶", "icon-button", () => controller?.toggle(), "播放 / 暂停");
  const replay = button("↻", "icon-button", () => controller?.replay(), "重新播放");
  const speed = select("1", [["0.5", "0.5×"], ["1", "1×"], ["2", "2×"]], (value) => controller?.setSpeed(Number(value)));
  controls.append(play, replay, speed);
  host.append(canvas, status, controls);
  let controller = null;
  if (animationId) {
    loadAnimation(animationId, canvas, status, play).then((value) => { controller = value; if (value) context.registerCleanup(() => value.dispose()); });
  }
  return host;
}

async function loadAnimation(animationId, canvas, status, playButton) {
  try {
    const response = await fetch(`/api/assets/skill-animation?id=${encodeURIComponent(animationId)}`);
    const manifest = await response.json();
    if (!response.ok) throw new Error(manifest.error || manifest.message || "动画读取失败");
    if (!manifest.previewable || !manifest.frames?.length) throw new Error((manifest.diagnostics || []).join("；") || "该动画不能在 Web 中预览");
    const images = new Map();
    await Promise.all([...new Set(manifest.frames.map((frame) => frame.atlasPath))].map((path) => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => { images.set(path, image); resolve(); };
      image.onerror = () => reject(new Error(`图集加载失败：${path}`));
      image.src = `/api/assets/file?path=${encodeURIComponent(path)}`;
    })));
    const ctx = canvas.getContext("2d");
    const frameBounds = manifest.frames.map((frame) => {
      const width = frame.regionWidth * Math.abs(frame.scaleX || 1);
      const height = frame.regionHeight * Math.abs(frame.scaleY || 1);
      return { left: frame.offsetX - width / 2, right: frame.offsetX + width / 2, top: frame.offsetY - height / 2, bottom: frame.offsetY + height / 2 };
    });
    const bounds = {
      left: Math.min(...frameBounds.map((value) => value.left)),
      right: Math.max(...frameBounds.map((value) => value.right)),
      top: Math.min(...frameBounds.map((value) => value.top)),
      bottom: Math.max(...frameBounds.map((value) => value.bottom)),
    };
    const boundsCenter = { x: (bounds.left + bounds.right) / 2, y: (bounds.top + bounds.bottom) / 2 };
    const fit = Math.min((canvas.width - 48) / Math.max(1, bounds.right - bounds.left), (canvas.height - 48) / Math.max(1, bounds.bottom - bounds.top), 1.5);
    let playing = true, speed = 1, startedAt = performance.now(), pausedAt = 0, frameHandle = 0;
    const draw = (now) => {
      const elapsed = playing ? ((now - startedAt) / 1000) * speed : pausedAt;
      const time = manifest.duration > 0 ? elapsed % manifest.duration : 0;
      let frame = manifest.frames[0];
      for (const candidate of manifest.frames) if (candidate.time <= time) frame = candidate;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#151a21"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const originX = canvas.width / 2 - boundsCenter.x * fit;
      const originY = canvas.height / 2 - boundsCenter.y * fit;
      ctx.strokeStyle = "#2c3542"; ctx.beginPath(); ctx.moveTo(0, originY); ctx.lineTo(canvas.width, originY); ctx.moveTo(originX, 0); ctx.lineTo(originX, canvas.height); ctx.stroke();
      const image = images.get(frame.atlasPath);
      const width = frame.regionWidth * Math.abs(frame.scaleX || 1) * fit, height = frame.regionHeight * Math.abs(frame.scaleY || 1) * fit;
      ctx.save(); ctx.translate(canvas.width / 2 + (frame.offsetX - boundsCenter.x) * fit, canvas.height / 2 + (frame.offsetY - boundsCenter.y) * fit); ctx.scale(Math.sign(frame.scaleX || 1), Math.sign(frame.scaleY || 1));
      ctx.drawImage(image, frame.regionX, frame.regionY, frame.regionWidth, frame.regionHeight, -width / 2, -height / 2, width, height); ctx.restore();
      status.textContent = `${animationId} · ${manifest.frames.length} 帧 · ${manifest.duration.toFixed(2)} 秒 · ${(time).toFixed(2)} 秒`;
      if (playing) frameHandle = requestAnimationFrame(draw);
    };
    frameHandle = requestAnimationFrame(draw);
    return {
      toggle() { if (playing) { playing = false; pausedAt = ((performance.now() - startedAt) / 1000) * speed; cancelAnimationFrame(frameHandle); playButton.textContent = "▶"; draw(performance.now()); } else { playing = true; startedAt = performance.now() - (pausedAt / speed) * 1000; playButton.textContent = "Ⅱ"; frameHandle = requestAnimationFrame(draw); } },
      replay() { pausedAt = 0; startedAt = performance.now(); if (!playing) draw(performance.now()); },
      setSpeed(value) { const current = playing ? ((performance.now() - startedAt) / 1000) * speed : pausedAt; speed = value; startedAt = performance.now() - (current / speed) * 1000; pausedAt = current; },
      dispose() { playing = false; cancelAnimationFrame(frameHandle); },
    };
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : String(error);
    status.classList.add("error");
    return null;
  }
}

function renderReferences(parent, context, record, kind) {
  const node = section(parent, "静态诊断", "检查当前武学对动画、Buff、起手武学和条件目标的引用。Godot 资源只读，PCK 中的自定义资源无法在此静态确认。");
  const issues = context.getIssues({ kind, record });
  if (!issues.length) node.appendChild(el("div", "martial-callout ok", "当前定义未发现可静态识别的问题。"));
  else { const list = el("ul", "martial-issues"); issues.forEach((issue) => list.appendChild(el("li", "", issue))); node.appendChild(list); }
  const refs = section(parent, "定义引用");
  const values = [record.startSkill, ...(record.buffs || []).map((item) => item.id), ...(record.conditions || []).map((item) => item.targetId)].filter(Boolean);
  if (!values.length) empty(refs, "没有直接引用", "此定义当前没有起手武学、Buff 或条件目标引用。");
  else values.forEach((value) => refs.appendChild(el("code", "martial-reference", value)));
}

function renderAdvanced(parent, context, record, kind) {
  const node = section(parent, "当前定义 JSON", "用于编辑尚未表单化的字段。应用时只替换当前定义，未知字段会原样保留。");
  node.appendChild(createEmbeddedJsonEditor({
    value: record,
    modelPath: `${kind}-skills/${record.id || context.state.martialArtsWorkspace.selectedIndex}.json`,
    minHeight: 520,
    onApply: (value) => context.onReplace(value),
    onError: context.onJsonError,
  }));
}

function renderDetail(parent, context) {
  const workspace = context.state.martialArtsWorkspace;
  const kind = workspace.activeKind;
  const records = workspace.documents[kind] || [];
  const record = records[workspace.selectedIndex];
  if (!record) { empty(parent, "当前分类没有定义", "新建第一条武学后即可开始编辑。"); return; }
  const header = el("header", "martial-detail-header");
  const identity = el("div", "martial-detail-identity");
  const copy = el("div", "martial-detail-copy");
  copy.append(el("div", "martial-detail-eyebrow", kindLabels.get(kind)), el("h2", "", record.name || record.id || "未命名武学"), el("code", "", record.id || "缺少 ID"));
  identity.append(renderHeaderMedia(context, record, kind), copy);
  const actions = el("div", "martial-detail-actions");
  const up = button("↑", "icon-button", () => context.onMove(-1), "上移定义");
  const down = button("↓", "icon-button", () => context.onMove(1), "下移定义");
  up.disabled = workspace.selectedIndex === 0; down.disabled = workspace.selectedIndex === records.length - 1;
  actions.append(up, down, button("复制", "button ghost", context.onDuplicate), button("删除", "button danger", context.onDelete));
  header.append(identity, actions); parent.appendChild(header);
  const tabbar = el("div", "martial-tabs");
  for (const [tab, label] of tabs) {
    if (tab === "growth" && kind === "special") continue;
    const item = button(label, "martial-tab", () => context.onTab(tab));
    item.classList.toggle("active", tab === workspace.tab); tabbar.appendChild(item);
  }
  parent.appendChild(tabbar);
  const body = el("div", "martial-detail-body");
  if (workspace.tab === "overview") renderOverview(body, context, record, kind);
  else if (workspace.tab === "combat") renderCombat(body, context, record, kind);
  else if (workspace.tab === "growth") renderForms(body, context, record, kind);
  else if (workspace.tab === "effects") renderEffects(body, context, record, kind);
  else if (workspace.tab === "presentation") renderPresentation(body, context, record, kind);
  else if (workspace.tab === "references") renderReferences(body, context, record, kind);
  else renderAdvanced(body, context, record, kind);
  parent.appendChild(body);
}

export function renderMartialArtsWorkspace(root, context) {
  for (const cleanup of root._martialCleanups || []) cleanup();
  root._martialCleanups = [];
  disposeEmbeddedCodeEditors(root);
  root.replaceChildren();
  context.registerCleanup = (cleanup) => root._martialCleanups.push(cleanup);
  const shell = el("div", "martial-workspace-shell");
  const catalog = el("aside", "martial-workspace-catalog");
  const detail = el("main", "martial-workspace-detail");
  renderCatalog(catalog, context);
  renderDetail(detail, context);
  shell.append(catalog, detail);
  root.appendChild(shell);
  renderCreator(root, context);
  renderResourcePicker(root, context);
}
