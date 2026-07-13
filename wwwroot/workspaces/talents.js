import { bindImeSafeInput } from "../core/input-composition.js?v=20260712-search-1";
import { createEmbeddedJsonEditor, disposeEmbeddedCodeEditors } from "../ui/code-editor.js?v=20260711-stage6-1";
import { bindScrollMemory } from "../ui/scroll-memory.js?v=20260712-search-1";
import {
  affixTypes,
  createHookCondition,
  createHookEffect,
  createTalentAffix,
  getTalentStats,
  matchesTalentFilter,
  matchesTalentSearch,
  modifierOps,
  moveTalentEntry,
  statTypes,
  talentFilters,
  traitTypes,
  weaponTypes,
} from "../domain/talents.js?v=20260713-talents-2";
import {
  hookConditionTypes,
  hookEffectTypes,
  hookTimings,
  targetSelectorTypes,
} from "../domain/battle-authoring.js?v=20260713-battle-1";

const tabs = Object.freeze([
  ["overview", "概要"],
  ["affixes", "词缀与 Hook"],
  ["references", "引用诊断"],
  ["advanced", "高级 JSON"],
]);

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
  const read = () => options.type === "number"
    ? (options.nullable && node.value === "" ? null : Number(node.value) || 0)
    : node.value;
  if (options.live) bindImeSafeInput(node, () => onChange(read()));
  else node.addEventListener("change", () => onChange(read()));
  return node;
}

function select(value, choices, onChange, placeholder = "") {
  const node = el("select", "input");
  const normalized = String(value ?? "");
  const known = new Set();
  if (placeholder) node.appendChild(new Option(placeholder, ""));
  for (const choice of choices) {
    const [choiceValue, label] = Array.isArray(choice) ? choice : [choice.id, choice.name || choice.id];
    known.add(String(choiceValue));
    const option = new Option(label, choiceValue);
    option.selected = String(choiceValue) === normalized;
    node.appendChild(option);
  }
  if (normalized && !known.has(normalized)) {
    const option = new Option(`未知值：${normalized}`, normalized);
    option.selected = true;
    node.appendChild(option);
  }
  node.addEventListener("change", () => onChange(node.value));
  return node;
}

function checkbox(value, onChange, label) {
  const wrapper = el("label", "talent-check");
  const node = document.createElement("input");
  node.type = "checkbox";
  node.checked = Boolean(value);
  node.addEventListener("change", () => onChange(node.checked));
  wrapper.append(node, el("span", "", label));
  return wrapper;
}

function field(label, control, hint = "") {
  const wrapper = el("label", "talent-field");
  wrapper.append(el("span", "talent-field-label", label), control);
  if (hint) wrapper.appendChild(el("small", "talent-field-hint", hint));
  return wrapper;
}

function section(parent, title, note = "") {
  const node = el("section", "talent-section");
  node.appendChild(el("h3", "", title));
  if (note) node.appendChild(el("p", "talent-section-note", note));
  parent.appendChild(node);
  return node;
}

function empty(parent, title, detail) {
  const node = el("div", "talent-empty");
  node.append(el("strong", "", title), el("p", "", detail));
  parent.appendChild(node);
}

function replaceObject(target, next) {
  Object.keys(target).forEach((key) => delete target[key]);
  Object.assign(target, next);
}

function jsonObjectEditor(value, onApply, onError) {
  const node = input(JSON.stringify(value, null, 2), (text) => {
    try {
      const parsed = JSON.parse(text || "{}");
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("参数必须是 JSON 对象。");
      onApply(parsed);
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }, { multiline: true });
  node.classList.add("talent-json-input");
  return node;
}

function renderCatalog(parent, context) {
  const workspace = context.state.talentWorkspace;
  const header = el("div", "talent-catalog-header");
  const title = el("div");
  title.append(el("strong", "", "天赋"), el("small", "", `${context.state.records.length} 条定义`));
  header.append(title, button("＋ 新建", "button primary", context.onCreate));
  const search = input(workspace.search, context.onSearch, { type: "search", placeholder: "搜索名称、ID、效果…", live: true });
  search.classList.add("talent-list-search");
  parent.append(header, search, select(workspace.filter, talentFilters, context.onFilter));

  const matches = context.state.records
    .map((record, index) => ({ record, index, stats: getTalentStats(record, context.issueContext) }))
    .filter(({ record }) => matchesTalentSearch(record, workspace.search) && matchesTalentFilter(record, workspace.filter, context.issueContext));
  parent.appendChild(el("div", "talent-list-summary", `显示 ${matches.length} / ${context.state.records.length}`));
  const list = el("div", "talent-record-list");
  for (const { record, index, stats } of matches) {
    const row = button("", "talent-record-row", () => context.onSelect(index));
    row.classList.toggle("active", index === context.state.selectedRecordIndex);
    const copy = el("span", "talent-record-copy");
    copy.append(el("strong", "", record.name || record.id || `天赋 ${index + 1}`), el("code", "", record.id || "缺少 ID"));
    const meta = el("span", "talent-record-meta");
    meta.appendChild(el("span", "", `${stats.hookCount} Hook`));
    if (stats.customEffectCount) meta.appendChild(el("span", "talent-custom-count", `${stats.customEffectCount} 自定义`));
    if (stats.issueCount) meta.appendChild(el("span", "talent-warning-count", String(stats.issueCount)));
    row.append(copy, meta);
    list.appendChild(row);
  }
  if (!matches.length) empty(list, "没有匹配的天赋", "调整搜索词或筛选条件。 ");
  parent.appendChild(list);
  bindScrollMemory(list, context.state.workspaceScrollPositions, "talents:list");
}

function renderOverview(parent, context, record) {
  const basics = section(parent, "基础信息");
  const grid = el("div", "talent-fields-grid");
  grid.append(
    field("天赋 ID", input(record.id, (value) => { record.id = value; context.onMutate(); })),
    field("显示名称", input(record.name, (value) => { record.name = value; context.onMutate(); })),
    field("消耗点数", input(record.point ?? 0, (value) => { record.point = value; context.onMutate(); }, { type: "number" })),
  );
  basics.appendChild(grid);
  basics.appendChild(field("说明", input(record.description ?? "", (value) => { record.description = value; context.onMutate(); }, { multiline: true })));

  const replacements = section(parent, "替换关系", "解锁本天赋后，被列出的天赋会从生效集合中移除。");
  replacements.appendChild(field("被替换天赋（每行一个 ID）", input((record.replaceTalentIds || []).join("\n"), (value) => {
    record.replaceTalentIds = String(value).split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    context.onMutate();
  }, { multiline: true }), "保存顺序与输入顺序一致。"));
  if (record.replaceTalentIds?.length) {
    const chips = el("div", "talent-reference-chips");
    record.replaceTalentIds.forEach((id) => chips.appendChild(el("code", "", id)));
    replacements.appendChild(chips);
  }

  const summary = section(parent, "战斗投影");
  const stats = getTalentStats(record, context.issueContext);
  const values = el("div", "talent-stat-strip");
  values.append(
    el("span", "", `${stats.affixCount} 个词缀`),
    el("span", "", `${stats.hookCount} 个 Hook`),
    el("span", "", `${stats.traitCount} 个特性`),
    el("span", "", `${stats.customEffectCount} 个自定义效果`),
  );
  summary.appendChild(values);
}

function renderModifierFields(parent, context, affix) {
  const value = affix.value || (affix.value = { op: "add", delta: 0 });
  parent.append(
    field("运算", select(value.op, modifierOps, (next) => { value.op = next; context.onMutate(); })),
    field("数值", input(value.delta ?? 0, (next) => { value.delta = next; context.onMutate(); }, { type: "number" })),
  );
}

function renderSimpleAffix(parent, context, affix) {
  const grid = el("div", "talent-affix-fields");
  if (affix.type === "trait") {
    grid.appendChild(field("特性", select(affix.traitId, traitTypes, (value) => { affix.traitId = value; context.onMutate(); })));
  } else if (affix.type === "stat_modifier") {
    grid.appendChild(field("属性", select(affix.stat, statTypes, (value) => { affix.stat = value; context.onMutate(); })));
    renderModifierFields(grid, context, affix);
  } else if (affix.type === "weapon_bonus_modifier") {
    grid.appendChild(field("兵器类型", select(affix.weaponType, weaponTypes, (value) => { affix.weaponType = value; context.onMutate(); })));
    renderModifierFields(grid, context, affix);
  } else if (affix.type === "skill_bonus_modifier" || affix.type === "legend_skill_chance_modifier") {
    const choices = affix.type === "legend_skill_chance_modifier" ? context.options.legends : context.options.skills;
    grid.appendChild(field("武学 / 奥义", select(affix.skillId, choices, (value) => { affix.skillId = value; context.onMutate(); }, "请选择")));
    renderModifierFields(grid, context, affix);
  } else if (affix.type === "skill_targeting_modifier") {
    grid.append(
      field("来源武学", select(affix.sourceSkillId ?? "", context.options.skills, (value) => { affix.sourceSkillId = value || null; context.onMutate(); }, "全部武学")),
      field("范围字段", select(affix.field, [["cast_size", "施展距离"], ["impact_size", "影响尺寸"]], (value) => { affix.field = value; context.onMutate(); })),
    );
    renderModifierFields(grid, context, affix);
  } else if (affix.type === "buff_level_stat_modifier") {
    grid.append(
      field("属性", select(affix.stat, statTypes, (value) => { affix.stat = value; context.onMutate(); })),
      field("基础加值", input(affix.addBase ?? 0, (value) => { affix.addBase = value; context.onMutate(); }, { type: "number" })),
      field("每级加值", input(affix.addPerLevel ?? 0, (value) => { affix.addPerLevel = value; context.onMutate(); }, { type: "number" })),
      field("每级乘值", input(affix.mulPerLevel ?? 0, (value) => { affix.mulPerLevel = value; context.onMutate(); }, { type: "number" })),
    );
  } else if (affix.type === "grant_talent") {
    grid.appendChild(field("授予天赋", select(affix.talentId, context.options.talents, (value) => { affix.talentId = value; context.onMutate(); }, "请选择")));
  } else if (affix.type === "grant_model") {
    grid.append(
      field("模型 ID", input(affix.modelId ?? "", (value) => { affix.modelId = value; context.onMutate(); })),
      field("优先级", input(affix.priority ?? 0, (value) => { affix.priority = value; context.onMutate(); }, { type: "number" })),
      field("说明", input(affix.description ?? "", (value) => { affix.description = value; context.onMutate(); })),
    );
  } else {
    grid.appendChild(field("完整词缀 JSON", jsonObjectEditor(affix, (value) => { replaceObject(affix, value); context.onMutate(); }, context.onJsonError)));
  }
  parent.appendChild(grid);
}

function renderTargetFields(parent, context, effect) {
  const target = effect.target;
  if (!target || typeof target !== "object") return;
  parent.appendChild(field("目标", select(target.type, targetSelectorTypes, (type) => {
    const next = { type };
    if (type === "all_allies") next.includeSelf = true;
    if (type === "nearby_allies") { next.radius = 2; next.includeSelf = true; }
    if (type === "nearby_enemies") next.radius = 2;
    effect.target = next;
    context.onMutate();
  })));
  if (target.type === "nearby_allies" || target.type === "nearby_enemies") {
    parent.appendChild(field("半径", input(target.radius ?? 2, (value) => { target.radius = value; context.onMutate(); }, { type: "number", min: 0 })));
  }
  if (target.type === "all_allies" || target.type === "nearby_allies") {
    parent.appendChild(checkbox(target.includeSelf ?? true, (value) => { target.includeSelf = value; context.onMutate(); }, "包含自己"));
  }
}

function renderConditionList(parent, context, hook) {
  const conditions = hook.conditions || (hook.conditions = []);
  const node = el("div", "talent-hook-block");
  const toolbar = el("div", "talent-array-toolbar");
  const type = select("chance", hookConditionTypes, () => {});
  toolbar.append(el("strong", "", `条件（${conditions.length}）`), type, button("＋ 添加", "button secondary", () => {
    conditions.push(createHookCondition(type.value)); context.onMutate();
  }));
  node.appendChild(toolbar);
  conditions.forEach((condition, index) => {
    const row = el("div", "talent-hook-row");
    const top = el("div", "talent-hook-row-header");
    top.append(
      field("条件类型", select(condition.type, hookConditionTypes, (value) => { replaceObject(condition, createHookCondition(value)); context.onMutate(); })),
      button("×", "icon-button danger", () => { conditions.splice(index, 1); context.onMutate(); }, "删除条件"),
    );
    row.append(top, field("条件 JSON", jsonObjectEditor(condition, (value) => { conditions[index] = value; context.onMutate(); }, context.onJsonError)));
    node.appendChild(row);
  });
  parent.appendChild(node);
}

function renderEffectList(parent, context, hook) {
  const effects = hook.effects || (hook.effects = []);
  const node = el("div", "talent-hook-block");
  const toolbar = el("div", "talent-array-toolbar");
  const type = select("modify_damage_context", hookEffectTypes, () => {});
  toolbar.append(el("strong", "", `效果（${effects.length}）`), type, button("＋ 添加", "button secondary", () => {
    effects.push(createHookEffect(type.value)); context.onMutate();
  }));
  node.appendChild(toolbar);
  effects.forEach((effect, index) => {
    const row = el("div", "talent-hook-row");
    const top = el("div", "talent-hook-row-header");
    top.append(
      field("效果类型", select(effect.type, hookEffectTypes, (value) => { replaceObject(effect, createHookEffect(value)); context.onMutate(); })),
      button("×", "icon-button danger", () => { effects.splice(index, 1); context.onMutate(); }, "删除效果"),
    );
    row.appendChild(top);
    const quick = el("div", "talent-hook-quick-fields");
    renderTargetFields(quick, context, effect);
    if ("buffId" in effect) quick.appendChild(field("Buff", select(effect.buffId, context.options.buffs, (value) => { effect.buffId = value; context.onMutate(); }, "请选择")));
    if ("effectId" in effect) quick.appendChild(field("效果 ID", input(effect.effectId, (value) => { effect.effectId = value; context.onMutate(); })));
    if ("parameters" in effect) quick.appendChild(field("自定义参数", jsonObjectEditor(effect.parameters ?? {}, (value) => { effect.parameters = value; context.onMutate(); }, context.onJsonError)));
    if (quick.childElementCount) row.appendChild(quick);
    row.appendChild(field("完整效果 JSON", jsonObjectEditor(effect, (value) => { effects[index] = value; context.onMutate(); }, context.onJsonError)));
    node.appendChild(row);
  });
  parent.appendChild(node);
}

function renderHookPresentation(parent, context, hook) {
  const node = el("div", "talent-hook-presentation");
  const floatEnabled = Boolean(hook.floatText);
  node.appendChild(checkbox(floatEnabled, (enabled) => {
    hook.floatText = enabled ? { target: "owner", text: "天赋发动", style: "Special" } : null;
    context.onMutate();
  }, "显示战斗浮字"));
  if (floatEnabled) {
    const fields = el("div", "talent-affix-fields");
    fields.append(
      field("浮字目标", select(hook.floatText.target ?? "owner", [["owner", "拥有者"], ["source", "来源"], ["target", "目标"]], (value) => { hook.floatText.target = value; context.onMutate(); })),
      field("浮字", input(hook.floatText.text ?? "", (value) => { hook.floatText.text = value; context.onMutate(); })),
      field("样式", select(hook.floatText.style ?? "Normal", ["Normal", "Critical", "Recovery", "Mana", "Energy", "Beneficial", "Harmful", "Special"].map((value) => [value, value]), (value) => { hook.floatText.style = value; context.onMutate(); })),
    );
    node.appendChild(fields);
  }
  const speechEnabled = Boolean(hook.speech);
  node.appendChild(checkbox(speechEnabled, (enabled) => {
    hook.speech = enabled ? { speaker: "owner", lines: ["天赋发动"], chance: 1 } : null;
    context.onMutate();
  }, "触发战斗台词"));
  if (speechEnabled) {
    const fields = el("div", "talent-affix-fields");
    fields.append(
      field("说话者", select(hook.speech.speaker ?? "owner", [["owner", "拥有者"], ["source", "来源"], ["target", "目标"]], (value) => { hook.speech.speaker = value; context.onMutate(); })),
      field("概率", input(hook.speech.chance ?? 1, (value) => { hook.speech.chance = value; context.onMutate(); }, { type: "number", min: 0, max: 1 })),
      field("台词（每行一条）", input((hook.speech.lines || []).join("\n"), (value) => { hook.speech.lines = String(value).split(/\r?\n/).filter(Boolean); context.onMutate(); }, { multiline: true })),
    );
    node.appendChild(fields);
  }
  parent.appendChild(node);
}

function renderHookAffix(parent, context, hook) {
  const basics = el("div", "talent-affix-fields");
  basics.append(
    field("触发时机", select(hook.timing, hookTimings, (value) => { hook.timing = value; context.onMutate(); })),
    field("优先级", input(hook.priority ?? 0, (value) => { hook.priority = value; context.onMutate(); }, { type: "number" })),
  );
  parent.appendChild(basics);
  renderConditionList(parent, context, hook);
  renderEffectList(parent, context, hook);
  renderHookPresentation(parent, context, hook);
}

function renderAffixes(parent, context, record) {
  const intro = section(parent, "生效词缀", "同一天赋中的词缀按 JSON 顺序投影；Hook 内的条件必须全部满足，效果按列表顺序执行。");
  const toolbar = el("div", "talent-array-toolbar");
  const type = select("hook", affixTypes, () => {});
  toolbar.append(el("strong", "", `${record.affixes.length} 个词缀`), type, button("＋ 添加词缀", "button primary", () => {
    record.affixes.push(createTalentAffix(type.value)); context.onMutate();
  }));
  intro.appendChild(toolbar);
  if (!record.affixes.length) empty(intro, "尚无词缀", "添加属性、特性或战斗 Hook。 ");
  record.affixes.forEach((affix, index) => {
    const item = el("article", "talent-affix-item");
    const header = el("div", "talent-affix-header");
    const actions = el("div", "talent-affix-actions");
    const up = button("↑", "icon-button", () => {
      const next = moveTalentEntry(record.affixes, index, -1); if (next === record.affixes) return;
      record.affixes = next; context.onMutate();
    }, "上移词缀");
    const down = button("↓", "icon-button", () => {
      const next = moveTalentEntry(record.affixes, index, 1); if (next === record.affixes) return;
      record.affixes = next; context.onMutate();
    }, "下移词缀");
    up.disabled = index === 0; down.disabled = index === record.affixes.length - 1;
    actions.append(up, down, button("×", "icon-button danger", () => { record.affixes.splice(index, 1); context.onMutate(); }, "删除词缀"));
    header.append(field("词缀类型", select(affix.type, affixTypes, (value) => { replaceObject(affix, createTalentAffix(value)); context.onMutate(); })), actions);
    item.appendChild(header);
    if (affix.type === "hook") renderHookAffix(item, context, affix);
    else renderSimpleAffix(item, context, affix);
    intro.appendChild(item);
  });
}

function renderReferences(parent, context, record) {
  const issues = section(parent, "静态诊断");
  const values = context.getIssues(record);
  if (!values.length) issues.appendChild(el("div", "talent-callout ok", "当前定义未发现可静态识别的问题。"));
  else {
    const list = el("ul", "talent-issues");
    values.forEach((issue) => list.appendChild(el("li", "", issue)));
    issues.appendChild(list);
  }
  const references = section(parent, "直接引用");
  const ids = new Set(record.replaceTalentIds || []);
  for (const affix of record.affixes || []) {
    if (affix.talentId) ids.add(affix.talentId);
    if (affix.skillId) ids.add(affix.skillId);
    if (affix.sourceSkillId) ids.add(affix.sourceSkillId);
    for (const condition of affix.conditions || []) {
      for (const key of ["talentIds", "internalSkillIds"]) for (const id of condition[key] || []) ids.add(id);
      if (condition.buffId) ids.add(condition.buffId);
    }
    for (const effect of affix.effects || []) if (effect.buffId) ids.add(effect.buffId);
  }
  if (!ids.size) empty(references, "没有直接引用", "当前天赋不引用其他定义。 ");
  else {
    const chips = el("div", "talent-reference-chips");
    ids.forEach((id) => chips.appendChild(el("code", "", id)));
    references.appendChild(chips);
  }
}

function renderAdvanced(parent, context, record) {
  const node = section(parent, "当前天赋 JSON", "应用时只替换当前定义；运行时新增但结构化表单未覆盖的字段会保留。");
  node.appendChild(createEmbeddedJsonEditor({
    value: record,
    modelPath: `talents/${record.id || context.state.selectedRecordIndex}.json`,
    minHeight: 560,
    onApply: context.onReplace,
    onError: context.onJsonError,
  }));
}

function renderDetail(parent, context) {
  const record = context.state.records[context.state.selectedRecordIndex];
  if (!record) { empty(parent, "当前 MOD 没有天赋", "新建第一条天赋后即可开始编辑。 "); return; }
  const stats = getTalentStats(record, context.issueContext);
  const header = el("header", "talent-detail-header");
  const identity = el("div", "talent-detail-copy");
  identity.append(el("div", "talent-detail-eyebrow", "天赋定义"), el("h2", "", record.name || record.id || "未命名天赋"), el("code", "", record.id || "缺少 ID"));
  const actions = el("div", "talent-detail-actions");
  actions.append(button("复制", "button ghost", context.onDuplicate), button("删除", "button danger", context.onDelete));
  header.append(identity, actions);
  parent.appendChild(header);
  const strip = el("div", "talent-detail-stats");
  strip.append(el("span", "", `${record.point ?? 0} 点`), el("span", "", `${stats.affixCount} 词缀`), el("span", "", `${stats.hookCount} Hook`), el("span", stats.issueCount ? "warning" : "ok", stats.issueCount ? `${stats.issueCount} 问题` : "静态检查通过"));
  parent.appendChild(strip);
  const tabbar = el("div", "talent-tabs");
  for (const [tab, label] of tabs) {
    const item = button(label, "talent-tab", () => context.onTab(tab));
    item.classList.toggle("active", tab === context.state.talentWorkspace.tab);
    tabbar.appendChild(item);
  }
  parent.appendChild(tabbar);
  const body = el("div", "talent-detail-body");
  if (context.state.talentWorkspace.tab === "overview") renderOverview(body, context, record);
  else if (context.state.talentWorkspace.tab === "affixes") renderAffixes(body, context, record);
  else if (context.state.talentWorkspace.tab === "references") renderReferences(body, context, record);
  else renderAdvanced(body, context, record);
  parent.appendChild(body);
}

export function renderTalentWorkspace(root, context) {
  disposeEmbeddedCodeEditors(root);
  root.replaceChildren();
  const shell = el("div", "talent-workspace-shell");
  const catalog = el("aside", "talent-workspace-catalog");
  const detail = el("main", "talent-workspace-detail");
  renderCatalog(catalog, context);
  renderDetail(detail, context);
  shell.append(catalog, detail);
  root.appendChild(shell);
}
