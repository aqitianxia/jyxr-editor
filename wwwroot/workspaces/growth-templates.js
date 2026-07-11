import { createEmbeddedJsonEditor, disposeEmbeddedCodeEditors } from "../ui/code-editor.js?v=20260711-stage6-1";
import {
  analyzeGrowthTemplate,
  getGrowthProjection,
  getGrowthTemplateIssues,
  getGrowthValue,
  growthCreationTemplates,
  growthStats,
  matchesGrowthSearch,
} from "../domain/growth-templates.js?v=20260711-stage9-1";

const tabs = Object.freeze([["overview", "成长设计"], ["usage", "使用角色"], ["advanced", "高级 JSON"]]);

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

function field(label, control, hint = "") {
  const wrapper = el("label", "growth-field");
  wrapper.appendChild(el("span", "growth-field-label", label));
  wrapper.appendChild(control);
  if (hint) wrapper.appendChild(el("small", "growth-field-hint", hint));
  return wrapper;
}

function input(value, onChange, options = {}) {
  const node = document.createElement("input");
  node.type = options.type || "text";
  node.value = value ?? "";
  if (options.min !== undefined) node.min = String(options.min);
  if (options.step !== undefined) node.step = String(options.step);
  node.addEventListener(options.event || "input", () => onChange(node.type === "number" ? Number(node.value) : node.value));
  return node;
}

function renderEmpty(parent, title, detail) {
  const node = el("div", "growth-empty");
  node.append(el("strong", "", title), el("p", "", detail));
  parent.appendChild(node);
}

function getUsage(context, record) {
  return context.getUsage(record.id);
}

function getIssues(context, record) {
  return getGrowthTemplateIssues(record, { idCounts: context.idCounts });
}

function matchesFilter(context, record) {
  const filter = context.state.growthWorkspace.filter;
  if (filter === "used") return getUsage(context, record).length > 0;
  if (filter === "unused") return getUsage(context, record).length === 0;
  if (filter === "issues") return getIssues(context, record).length > 0;
  return true;
}

function renderCatalog(parent, context) {
  const header = el("div", "growth-catalog-header");
  const copy = el("div");
  copy.append(el("strong", "", "成长模板"), el("small", "", "角色升级规则"));
  header.append(copy, button("新建", "button primary", context.onOpenCreator));
  parent.appendChild(header);

  const tools = el("div", "growth-catalog-tools");
  const search = input(context.state.growthWorkspace.search, context.onSearch);
  search.type = "search";
  search.placeholder = "搜索名称、ID 或定位";
  const filter = document.createElement("select");
  [["all", "全部模板"], ["used", "正在使用"], ["unused", "未使用"], ["issues", "有问题"]].forEach(([value, label]) => {
    const option = el("option", "", label);
    option.value = value;
    option.selected = value === context.state.growthWorkspace.filter;
    filter.appendChild(option);
  });
  filter.addEventListener("change", () => context.onFilter(filter.value));
  tools.append(search, filter);
  parent.appendChild(tools);

  const baseline = context.records.find((record) => record.id === "default") || context.records[0];
  const visible = context.records.map((record, index) => ({ record, index }))
    .filter(({ record }) => matchesGrowthSearch(record, context.state.growthWorkspace.search) && matchesFilter(context, record));
  parent.appendChild(el("div", "growth-list-summary", `显示 ${visible.length} / ${context.records.length}`));
  if (!context.records.some((record) => record.id === "default")) parent.appendChild(el("div", "growth-callout warning", "缺少 default：未指定成长模板的角色升级时将无法解析回退模板。"));
  const list = el("div", "growth-record-list");
  for (const { record, index } of visible) {
    const analysis = analyzeGrowthTemplate(record, baseline);
    const usage = getUsage(context, record);
    const issues = getIssues(context, record);
    const row = button("", "growth-record-row", () => context.onSelect(index));
    row.classList.toggle("active", index === context.state.selectedRecordIndex);
    const body = el("span", "growth-record-copy");
    body.append(el("strong", "", record.name || record.id || "未命名模板"), el("small", "", analysis.role), el("code", "", record.id || "缺少 ID"));
    const meta = el("span", "growth-record-meta");
    meta.appendChild(el("span", "", `${usage.length} 人`));
    if (issues.length) meta.appendChild(el("span", "growth-issue-count", String(issues.length)));
    row.append(body, meta);
    list.appendChild(row);
  }
  if (!visible.length) renderEmpty(list, "没有匹配模板", "调整搜索词或筛选条件。 ");
  parent.appendChild(list);
}

function formatDelta(item) {
  if (item.delta === 0) return "与 default 相同";
  return `比 default ${item.delta > 0 ? "+" : ""}${item.delta} / 级`;
}

function renderAnalysis(parent, context, record) {
  const baseline = context.records.find((item) => item.id === "default") || null;
  const analysis = analyzeGrowthTemplate(record, baseline && baseline !== record ? baseline : null);
  const intro = el("section", "growth-intro");
  const introCopy = el("div");
  const analysisSummary = analysis.strengths.length
    ? `主要成长优势：${analysis.strengths.join("、")}。说明会随数值自动更新。`
    : analysis.tenDimensionTotal > 0
      ? "十维成长分配较均衡，没有单独突出的最高项；可结合下方 default 差异判断强度。"
      : "当前没有十维成长，请检查是否有意创建不随等级提升属性的角色。";
  introCopy.append(el("span", "growth-eyebrow", "自动分析"), el("h3", "", analysis.role), el("p", "", analysisSummary));
  const metrics = el("div", "growth-metrics");
  [["十维合计", analysis.tenDimensionTotal], ["气血 + 内力", analysis.resourceTotal], ["武学点 / 级", analysis.wuxue]].forEach(([label, value]) => {
    const metric = el("div", "growth-metric");
    metric.append(el("strong", "", String(value)), el("small", "", label));
    metrics.appendChild(metric);
  });
  intro.append(introCopy, metrics);
  parent.appendChild(intro);

  const note = el("div", "growth-runtime-note");
  note.append(el("strong", "", "这些数值何时生效"), el("span", "", "角色每升一级应用一次成长；不会改变角色 1 级初始属性。武学点是天赋容量系数，按 20 + 当前等级 × 武学点计算，不会像其他属性一样直接累加。"));
  parent.appendChild(note);

  if (baseline && baseline !== record) {
    const comparison = el("section", "growth-section");
    comparison.append(el("h3", "", "与 default 的区别"), el("p", "growth-section-note", "default 是角色未指定成长模板时的运行时回退。这里只显示发生变化的重点项目。"));
    const rows = el("div", "growth-comparison");
    const differences = [...analysis.improvements, ...analysis.reductions];
    if (!differences.length) rows.appendChild(el("div", "growth-callout", "各项成长与 default 相同，只是模板名称和引用用途不同。"));
    for (const item of differences) {
      const row = el("div", `growth-comparison-row ${item.delta > 0 ? "up" : "down"}`);
      row.append(el("strong", "", item.label), el("span", "", `${item.baseline} → ${item.value}`), el("small", "", formatDelta(item)));
      rows.appendChild(row);
    }
    comparison.appendChild(rows);
    parent.appendChild(comparison);
  }
}

function renderStatGroup(parent, context, record, group, description) {
  const section = el("section", "growth-section");
  section.append(el("h3", "", group), el("p", "growth-section-note", description));
  const grid = el("div", "growth-stat-grid");
  for (const [key, label, statGroup, hint] of growthStats.filter((item) => item[2] === group)) {
    const control = input(getGrowthValue(record, key), (value) => context.onPatchGrowth(key, value), { type: "number", min: 0, step: 1, event: "change" });
    grid.appendChild(field(`${label} / 级`, control, hint));
  }
  section.appendChild(grid);
  parent.appendChild(section);
}

function renderProjection(parent, record) {
  const section = el("section", "growth-section");
  section.append(el("h3", "", "等级累计预览"), el("p", "growth-section-note", "假设角色从 1 级开始使用此模板。结果只计算成长增量，不包含角色初始属性、装备和词缀。"));
  const projections = el("div", "growth-projections");
  for (const level of [10, 20]) {
    const projection = getGrowthProjection(record, level);
    const panel = el("div", "growth-projection");
    panel.append(el("h4", "", `${level} 级时累计`), el("small", "", `经历 ${projection.levelUps} 次升级`));
    const values = el("div", "growth-projection-values");
    for (const [key, label] of growthStats) {
      const suffix = key === "wuxue" ? "容量" : "";
      const row = el("div", "growth-projection-row");
      row.append(el("span", "", `${label}${suffix}`), el("strong", "", `${key === "wuxue" ? "" : "+"}${projection.gains[key]}`));
      values.appendChild(row);
    }
    panel.appendChild(values);
    projections.appendChild(panel);
  }
  section.appendChild(projections);
  parent.appendChild(section);
}

function renderOverview(parent, context, record) {
  renderAnalysis(parent, context, record);
  const identity = el("section", "growth-section");
  identity.append(el("h3", "", "模板身份"), el("p", "growth-section-note", "角色和剧情命令保存的是稳定 ID。已有模板被使用后不要随意修改 ID。"));
  const identityGrid = el("div", "growth-fields-grid");
  identityGrid.append(field("模板 ID", input(record.id, (value) => context.onPatch("id", value), { event: "change" }), "default 是未指定模板时的回退 ID。"), field("显示名称", input(record.name, (value) => context.onPatch("name", value), { event: "change" }), "用于编辑器识别，可与 ID 不同。"));
  identity.appendChild(identityGrid);
  parent.appendChild(identity);
  renderStatGroup(parent, context, record, "基础属性", "臂力、定力、福缘、根骨、身法和悟性会在每次升级时直接加到角色基础属性。0 表示该项不随等级成长。");
  renderStatGroup(parent, context, record, "武学专精", "四系数值决定角色随等级自然获得的武学属性。专精角色通常集中一至两系，而不是四系都填高。 ");
  renderStatGroup(parent, context, record, "资源成长", "气血和内力是每级直接增加的上限。它们的数值尺度明显大于十维属性，不能横向比较。 ");
  renderStatGroup(parent, context, record, "天赋容量", "武学点不是普通属性成长。游戏用它计算角色可容纳的天赋点数，数值过高会显著扩大角色构筑空间。 ");
  renderProjection(parent, record);
}

function renderUsage(parent, context, record) {
  const usage = getUsage(context, record);
  const section = el("section", "growth-section");
  section.append(el("h3", "", `使用角色 ${usage.length}`), el("p", "growth-section-note", record.id === "default" ? "未填写 growTemplate 的角色会在运行时隐式使用 default，下面会分别标记显式与隐式引用。" : "这里扫描 characters.json 中的 growTemplate 字段。剧情可在运行时通过 growtemplate 命令切换模板，无法完整静态统计。"));
  if (!usage.length) renderEmpty(section, "当前没有角色使用", "可以先完成模板，再到角色工作区选择它。删除前仍需留意剧情命令中的动态引用。 ");
  else {
    const list = el("div", "growth-usage-list");
    for (const item of usage) {
      const row = el("div", "growth-usage-row");
      const copy = el("div");
      copy.append(el("strong", "", item.name || item.id || "未命名角色"), el("code", "", item.id || "缺少 ID"));
      row.append(copy, el("span", `growth-usage-kind ${item.implicit ? "implicit" : "explicit"}`, item.implicit ? "未填写，回退 default" : "显式使用"));
      list.appendChild(row);
    }
    section.appendChild(list);
  }
  parent.appendChild(section);
}

function renderAdvanced(parent, context, record) {
  const issues = getIssues(context, record);
  const section = el("section", "growth-section");
  section.append(el("h3", "", "静态检查"), el("p", "growth-section-note", "高级 JSON 用于编辑尚未表单化的自定义字段，应用时整体替换当前模板。"));
  if (!issues.length) section.appendChild(el("div", "growth-callout ok", "当前模板未发现可静态识别的问题。"));
  else {
    const list = el("ul", "growth-issues");
    issues.forEach((issue) => list.appendChild(el("li", "", issue)));
    section.appendChild(list);
  }
  section.appendChild(createEmbeddedJsonEditor({
    value: record,
    modelPath: `grow-templates/${record.id || context.state.selectedRecordIndex}`,
    validate: (value) => {
      if (!value || Array.isArray(value) || typeof value !== "object") throw new Error("成长模板 JSON 必须是对象");
      if (!value.statGrowth || Array.isArray(value.statGrowth) || typeof value.statGrowth !== "object") throw new Error("statGrowth 必须是对象");
    },
    onApply: context.onReplace,
  }));
  parent.appendChild(section);
}

function renderCreator(context) {
  if (!context.state.growthWorkspace.creatorOpen) return;
  const overlay = el("div", "growth-creator-overlay");
  overlay.addEventListener("click", (event) => { if (event.target === overlay) context.onCloseCreator(); });
  const dialog = el("section", "growth-creator-dialog");
  const header = el("header", "growth-creator-header");
  const copy = el("div");
  copy.append(el("span", "growth-eyebrow", "新建成长模板"), el("h2", "", "先选择最接近的成长方向"), el("p", "", "预设只是安全起点。创建后可以继续调整每级成长，并通过 10/20 级预览判断是否符合角色定位。"));
  header.append(copy, button("×", "icon-button", context.onCloseCreator, "关闭"));
  const list = el("div", "growth-template-list");
  for (const template of growthCreationTemplates) {
    const item = button("", "growth-template-option", () => context.onSelectCreatorTemplate(template.id));
    item.classList.toggle("active", context.state.growthWorkspace.creatorTemplate === template.id);
    const marker = el("span", "growth-template-marker", context.state.growthWorkspace.creatorTemplate === template.id ? "●" : "○");
    const body = el("div");
    body.append(el("strong", "", template.name), el("p", "", template.description), el("small", "", `气血 ${template.values.max_hp} · 内力 ${template.values.max_mp} · 武学点 ${template.values.wuxue}`));
    item.append(marker, body);
    list.appendChild(item);
  }
  const warning = el("div", "growth-runtime-note");
  warning.append(el("strong", "", "创建前要知道"), el("span", "", "成长模板不提供技能、装备或初始属性；它只在角色升级时生效。主角级全能预设明显强于普通伙伴，请有意识地控制使用范围。"));
  const actions = el("footer", "growth-creator-actions");
  actions.append(button("取消", "button secondary", context.onCloseCreator), button("创建模板", "button primary", context.onCreate));
  dialog.append(header, list, warning, actions);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
}

function renderDetail(parent, context, record) {
  const header = el("header", "growth-detail-header");
  const copy = el("div");
  const analysis = analyzeGrowthTemplate(record, context.records.find((item) => item.id === "default"));
  copy.append(el("span", "growth-eyebrow", "成长模板"), el("h2", "", record.name || record.id || "未命名模板"), el("div", "growth-header-meta", `${analysis.role} · ${getUsage(context, record).length} 名角色使用`));
  const actions = el("div", "growth-detail-actions");
  actions.append(button("复制", "button ghost", context.onDuplicate), button("删除", "button danger", context.onDelete));
  header.append(copy, actions);
  parent.appendChild(header);
  const nav = el("div", "growth-tabs");
  for (const [id, label] of tabs) {
    const tab = button(label, "growth-tab", () => context.onTab(id));
    tab.classList.toggle("active", context.state.growthWorkspace.tab === id);
    nav.appendChild(tab);
  }
  parent.appendChild(nav);
  const body = el("div", "growth-detail-body");
  if (context.state.growthWorkspace.tab === "usage") renderUsage(body, context, record);
  else if (context.state.growthWorkspace.tab === "advanced") renderAdvanced(body, context, record);
  else renderOverview(body, context, record);
  parent.appendChild(body);
}

export function renderGrowthTemplateWorkspace(container, context) {
  disposeEmbeddedCodeEditors(container);
  document.querySelector(".growth-creator-overlay")?.remove();
  container.replaceChildren();
  const shell = el("div", "growth-workspace-shell");
  const catalog = el("aside", "growth-workspace-catalog");
  const detail = el("main", "growth-workspace-detail");
  shell.append(catalog, detail);
  container.appendChild(shell);
  renderCatalog(catalog, context);
  const record = context.records[context.state.selectedRecordIndex];
  if (record) renderDetail(detail, context, record);
  else renderEmpty(detail, "没有成长模板", "新建第一份模板后即可配置角色升级成长。 ");
  renderCreator(context);
}
