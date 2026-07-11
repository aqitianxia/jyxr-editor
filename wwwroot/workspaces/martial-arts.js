import { bindImeSafeInput } from "../core/input-composition.js?v=20260711-core-17";
import { createEmbeddedJsonEditor, disposeEmbeddedCodeEditors } from "../ui/code-editor.js?v=20260711-stage6-1";
import {
  createFormSkill,
  createLegendCondition,
  createLevelOverride,
  createSkillAffix,
  createSkillBuff,
  createSpecialEffect,
  getImpactPositions,
  getMartialIssues,
  impactTypes,
  legendConditionTypes,
  martialKinds,
  matchesMartialSearch,
  resolveEffectiveTargeting,
  resolvePresentation,
  specialEffectTypes,
  targetSelectorTypes,
  weaponTypes,
} from "../domain/martial-arts.js?v=20260711-stage8-1";

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
  tools.append(input(workspace.search, context.onSearch, { type: "search", placeholder: "搜索名称、ID、招式…", live: true }), button("＋ 新建", "button primary", context.onCreate));
  parent.appendChild(tools);

  const records = workspace.documents[workspace.activeKind] || [];
  const matches = records.map((record, index) => ({ record, index, entry: { kind: workspace.activeKind, record } }))
    .filter(({ entry }) => matchesMartialSearch(entry, workspace.search));
  parent.appendChild(el("div", "martial-list-count", `显示 ${matches.length} / ${records.length}`));
  const list = el("div", "martial-record-list");
  for (const { record, index } of matches) {
    const issues = context.getIssues({ kind: workspace.activeKind, record });
    const row = button("", "martial-record-row", () => context.onSelect(index));
    row.classList.toggle("active", index === workspace.selectedIndex);
    const copy = el("span", "martial-record-copy");
    copy.append(el("strong", "", record.name || record.id || `未命名 ${index + 1}`), el("code", "", record.id || "缺少 ID"));
    const meta = el("span", "martial-record-meta");
    if ((record.formSkills || []).length) meta.appendChild(el("span", "", `${record.formSkills.length} 招`));
    if (issues.length) meta.appendChild(el("span", "martial-issue-count", String(issues.length)));
    row.append(copy, meta);
    list.appendChild(row);
  }
  if (!matches.length) empty(list, "没有匹配的武学", "清除搜索词后再试，或新建一条定义。");
  parent.appendChild(list);
}

function renderOverview(parent, context, record, kind) {
  const basic = section(parent, "基础信息", "ID 是剧情、角色与奥义引用的稳定键；发布后不宜随意修改。");
  const grid = el("div", "martial-fields-grid");
  grid.append(field("武学 ID", input(record.id, (value) => patchObject(context, record, { id: value }))), field("显示名称", input(record.name, (value) => patchObject(context, record, { name: value }))));
  if (kind !== "legend") grid.appendChild(field("说明", input(record.description, (value) => patchObject(context, record, { description: value }), { multiline: true }), "用于物品、角色和战斗界面的文本。"));
  basic.appendChild(grid);

  if (kind === "external") {
    const identity = section(parent, "武学类型");
    const fields = el("div", "martial-fields-grid");
    fields.append(field("兵器分类", select(record.type, weaponTypes, (value) => patchObject(context, record, { type: value }))), field("修炼难度", input(record.hard, (value) => patchObject(context, record, { hard: value }), { type: "number", min: 0 })), field("适性", input(record.affinity, (value) => patchObject(context, record, { affinity: value }), { type: "number" })), checkbox(record.isHarmony, (value) => patchObject(context, record, { isHarmony: value }), "阴阳调和"));
    identity.appendChild(fields);
  } else if (kind === "internal") {
    const scales = section(parent, "内功倾向", "百分比以小数保存，例如 0.15 表示 15%。内功本身不进入技能栏，只有嵌套招式可在战斗中施展。");
    const fields = el("div", "martial-fields-grid three");
    [["yin", "阴性"], ["yang", "阳性"], ["attackScale", "攻击倍率"], ["criticalScale", "暴击倍率"], ["defenceScale", "防御倍率"], ["hard", "修炼难度"]].forEach(([key, label]) => fields.appendChild(field(label, input(record[key], (value) => patchObject(context, record, { [key]: value }), { type: "number" }))));
    scales.appendChild(fields);
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
  const costs = section(parent, "消耗与冷却");
  const cost = record.cost || {};
  const costFields = el("div", "martial-fields-grid three");
  costFields.append(field("内力", input(cost.mp ?? "", (value) => nestedPatch(context, record, "cost", { mp: value }), { type: "number", min: 0, nullable: true }), kind === "external" ? "空值由运行时按等级计算。" : "施展时扣除。"), field("怒气", input(cost.rage ?? 0, (value) => nestedPatch(context, record, "cost", { rage: value }), { type: "number", min: 0 })), field("冷却回合", input(record.cooldown ?? 0, (value) => patchObject(context, record, { cooldown: value }), { type: "number", min: 0 })));
  costs.appendChild(costFields);
  if (kind === "external") {
    const power = section(parent, "基础威力", "这里只显示配置值。最终伤害还会受角色属性、技能等级、Buff 和战斗规则影响。");
    const fields = el("div", "martial-fields-grid");
    fields.append(field("基础威力", input(record.powerBase, (value) => patchObject(context, record, { powerBase: value }), { type: "number" })), field("每级成长", input(record.powerStep, (value) => patchObject(context, record, { powerStep: value }), { type: "number" })), field(`等级 ${context.state.martialArtsWorkspace.previewLevel} 配置威力`, input((Number(record.powerBase) + (context.state.martialArtsWorkspace.previewLevel - 1) * Number(record.powerStep)).toFixed(2), () => {}), "只读估算，不包含最终伤害公式。"));
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
  mediaFields.append(field("图标 ID", input(form.icon ?? "", (value) => patchObject(context, form, { icon: value || null })), `空值继承：${presentation.icon || "未设置"}`), field("命中特效", select(form.animation ?? "", context.animationChoices, (value) => patchObject(context, form, { animation: value || null }), "继承父武学"), `当前生效：${presentation.animation || "未设置"}`), field("音效", select(form.audio ?? "", context.options.audio, (value) => patchObject(context, form, { audio: value || null }), "继承父武学"), `当前生效：${presentation.audio || "未设置"}`));
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
    const audio = section(parent, "音效", "音效 ID 来自 resources.json 的“音效”资源组。");
    const audioPath = context.getAudioPath(record.audio);
    audio.appendChild(field("音效资源", select(record.audio, context.options.audio, (value) => patchObject(context, record, { audio: value }), "未设置")));
    if (audioPath) { const player = document.createElement("audio"); player.controls = true; player.src = `/api/assets/file?path=${encodeURIComponent(audioPath)}`; audio.appendChild(player); }
  }
  const animation = section(parent, kind === "legend" ? "奥义全屏动画" : "命中特效动画", kind === "legend" ? "这里是覆盖战场的全屏叠加动画。命中动画、图标和音效仍继承起手武学。" : "Web 编辑器只读解析 Godot AnimationLibrary，不会修改 .tres/.res 资源。");
  animation.appendChild(field("Godot 动画", select(record.animation ?? "", context.animationChoices, (value) => patchObject(context, record, { animation: value || null }), "未设置")));
  animation.appendChild(renderAnimationPlayer(record.animation, context));
  if (kind === "special") renderSpeech(parent, context, record);
}

function renderIconField(parent, context, record) {
  parent.appendChild(field("图标 ID", input(record.icon ?? "", (value) => patchObject(context, record, { icon: value })), "优先按 assets/art/icon/{id} 查找，再使用 resources.json 回退。"));
  const path = context.getIconPath(record.icon);
  const preview = el("div", "martial-icon-preview");
  if (path) { const image = document.createElement("img"); image.src = `/api/assets/file?path=${encodeURIComponent(path)}`; image.alt = record.name || record.id; preview.append(image, el("code", "", path)); }
  else preview.appendChild(el("span", "martial-missing", record.icon ? "未找到图标资产" : "尚未设置图标"));
  parent.appendChild(preview);
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
  const copy = el("div", "martial-detail-copy");
  copy.append(el("div", "martial-detail-eyebrow", kindLabels.get(kind)), el("h2", "", record.name || record.id || "未命名武学"), el("code", "", record.id || "缺少 ID"));
  const actions = el("div", "martial-detail-actions");
  const up = button("↑", "icon-button", () => context.onMove(-1), "上移定义");
  const down = button("↓", "icon-button", () => context.onMove(1), "下移定义");
  up.disabled = workspace.selectedIndex === 0; down.disabled = workspace.selectedIndex === records.length - 1;
  actions.append(up, down, button("复制", "button ghost", context.onDuplicate), button("删除", "button danger", context.onDelete));
  header.append(copy, actions); parent.appendChild(header);
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
}
