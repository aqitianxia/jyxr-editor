import { bindImeSafeInput, rerenderPreservingInput } from "../core/input-composition.js?v=20260712-search-1";
import {
  achievementPrefix,
  getAchievementTitle,
  getMissingAchievementReferences,
} from "../domain/achievements.js?v=20260726-achievements-1";
import {
  describeMapCondition,
  getMapConditionValueIssue,
  mapConditionDefinitions,
} from "../domain/maps.js?v=20260718-map-runtime-keys-1";
import { createEmbeddedJsonEditor, disposeEmbeddedCodeEditors } from "../ui/code-editor.js?v=20260711-stage6-1";
import { createReferencePicker } from "../ui/reference-picker.js?v=20260711-core-17";
import { bindScrollMemory, resetScrollMemory } from "../ui/scroll-memory.js?v=20260712-search-1";

const el = (tag, className = "", text = "") => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== "") node.textContent = text;
  return node;
};

function button(label, className, onClick, title = "") {
  const node = el("button", className, label);
  node.type = "button";
  if (title) node.title = title;
  node.addEventListener("click", onClick);
  return node;
}

function field(label, control, hint = "") {
  const wrapper = el("label", "achievement-field");
  wrapper.append(el("span", "achievement-field-label", label), control);
  if (hint) wrapper.appendChild(el("small", "achievement-field-hint", hint));
  return wrapper;
}

function input(value, onChange, options = {}) {
  const node = document.createElement("input");
  node.className = "input";
  node.type = options.type || "text";
  node.value = value ?? "";
  if (options.min != null) node.min = String(options.min);
  if (options.max != null) node.max = String(options.max);
  if (options.placeholder) node.placeholder = options.placeholder;
  if (options.live) bindImeSafeInput(node, onChange);
  else node.addEventListener("change", () => onChange(node.value));
  return node;
}

function renderHeader(container, options) {
  const { state, achievements, worldTriggers, sourcesById, onTab } = options;
  const missing = getMissingAchievementReferences(achievements, sourcesById);
  const header = el("header", "achievement-workspace-header");
  const heading = el("div", "achievement-workspace-heading");
  heading.append(el("h1", "", "成就与触发"));
  const metrics = el("div", "achievement-metrics");
  metrics.append(
    el("span", "", `${achievements.length} 项成就`),
    el("span", "", `${[...sourcesById.values()].flat().length} 处解锁`),
    el("span", missing.length ? "bad" : "ok", missing.length ? `${missing.length} 个缺失定义` : "引用完整"),
    el("span", "", `${worldTriggers.length} 个世界触发器`),
  );
  heading.appendChild(metrics);
  const tabs = el("div", "segmented-control");
  for (const [value, label] of [["achievements", "成就"], ["triggers", "世界触发器"]]) {
    const control = button(label, state.achievementWorkspace.tab === value ? "active" : "", () => onTab(value));
    tabs.appendChild(control);
  }
  header.append(heading, tabs);
  container.appendChild(header);
}

function renderAchievementList(container, options) {
  const { state, achievements, sourcesById, onSearch, onSelectAchievement, onCreateAchievement, onCreateFromReference } = options;
  const ws = state.achievementWorkspace;
  const tools = el("div", "achievement-list-tools");
  tools.appendChild(button("＋ 新建", "button primary", () => onCreateAchievement("")));
  const search = input(ws.search, (value) => {
    resetScrollMemory(state.workspaceScrollPositions, "achievements:list");
    rerenderPreservingInput(search, () => onSearch(value), () => container.querySelector("input[type=search]"));
  }, { live: true, placeholder: "搜索成就名称或说明" });
  search.type = "search";
  tools.appendChild(search);
  container.appendChild(tools);

  const missing = getMissingAchievementReferences(achievements, sourcesById);
  if (missing.length) {
    const missingBox = el("div", "achievement-missing-list");
    missingBox.appendChild(el("strong", "", "引用了尚未定义的成就"));
    for (const entry of missing.slice(0, 8)) {
      const row = el("div", "achievement-missing-row");
      row.append(el("span", "", entry.id), button("创建", "button ghost", () => onCreateFromReference(entry.id)));
      missingBox.appendChild(row);
    }
    container.appendChild(missingBox);
  }

  const query = ws.search.trim().toLocaleLowerCase("zh-CN");
  const visible = achievements.filter((resource) => !query || `${getAchievementTitle(resource)} ${resource.value || ""}`.toLocaleLowerCase("zh-CN").includes(query));
  const summary = el("div", "achievement-list-summary", `显示 ${visible.length} / ${achievements.length}`);
  const list = el("div", "achievement-record-list");
  for (const resource of visible) {
    const title = getAchievementTitle(resource);
    const row = button("", "achievement-record-row", () => onSelectAchievement(resource.id));
    row.classList.toggle("active", ws.selectedAchievementId === resource.id);
    const copy = el("span", "achievement-record-copy");
    copy.append(el("strong", "", title || "未命名成就"), el("small", "", resource.value || "尚未填写说明"));
    row.append(copy, el("span", "achievement-source-count", `${sourcesById.get(title)?.length || 0} 处`));
    list.appendChild(row);
  }
  if (!visible.length) list.appendChild(el("div", "achievement-empty", "没有符合条件的成就。"));
  container.append(summary, list);
  bindScrollMemory(list, state.workspaceScrollPositions, "achievements:list");
}

function renderAchievementDetail(container, options) {
  const { state, achievements, sourcesById, onMutateAchievement, onDeleteAchievement, onOpenSource } = options;
  const resource = achievements.find((entry) => entry.id === state.achievementWorkspace.selectedAchievementId) || achievements[0];
  if (!resource) {
    container.appendChild(el("div", "achievement-empty detail", "新建一项成就后即可编辑。"));
    return;
  }
  const title = getAchievementTitle(resource);
  const header = el("div", "achievement-detail-header");
  const heading = el("div");
  heading.append(el("span", "achievement-eyebrow", "成就定义"), el("h2", "", title || "未命名成就"), el("code", "", resource.id));
  header.append(heading, button("删除", "button danger", () => onDeleteAchievement(resource)));
  container.appendChild(header);

  const editor = el("section", "achievement-detail-section");
  editor.appendChild(el("h3", "", "基本信息"));
  const titleInput = input(title, (value) => onMutateAchievement(resource, "id", `${achievementPrefix}${value.trim()}`, true));
  const description = document.createElement("textarea");
  description.className = "input achievement-description";
  description.value = resource.value || "";
  description.placeholder = "成就达成条件或故事说明";
  bindImeSafeInput(description, (value) => onMutateAchievement(resource, "value", value, false));
  editor.append(field("成就名称", titleInput, "剧情 nick 命令与爬塔 achievementIds 使用这里的名称。"), field("解锁后说明", description));
  container.appendChild(editor);

  const sourceSection = el("section", "achievement-detail-section");
  const sourceHeading = el("div", "achievement-section-heading");
  const sources = sourcesById.get(title) || [];
  sourceHeading.append(el("h3", "", `解锁来源 ${sources.length}`));
  sourceSection.appendChild(sourceHeading);
  const sourceList = el("div", "achievement-source-list");
  for (const source of sources) {
    const row = el("div", "achievement-source-row");
    const copy = el("div");
    copy.append(
      el("strong", "", source.kind === "story" ? `剧情：${source.segmentId}` : `爬塔：${source.detail}`),
      el("code", "", source.path),
    );
    row.append(copy, button("打开", "button secondary", () => onOpenSource(source)));
    sourceList.appendChild(row);
  }
  if (!sources.length) sourceList.appendChild(el("div", "achievement-empty compact", "当前没有剧情或爬塔解锁来源。"));
  sourceSection.appendChild(sourceList);
  container.appendChild(sourceSection);
}

function getWorldTriggerIssues(trigger, storyOptions, allTriggers) {
  const issues = [];
  const id = String(trigger?.id || "").trim();
  if (!id) issues.push("缺少触发器 ID");
  if (id && allTriggers.filter((entry) => entry?.id === id).length > 1) issues.push("触发器 ID 重复");
  if (trigger?.type === "story" && !storyOptions.some((option) => option.id === trigger.targetId)) issues.push("目标剧情不存在");
  const probability = Number(trigger?.probability);
  if (!Number.isFinite(probability) || probability < 0 || probability > 100) issues.push("概率必须在 0 到 100 之间");
  for (const condition of trigger?.conditions || []) {
    const issue = getMapConditionValueIssue(condition);
    if (issue) issues.push(`${condition.type || "条件"}：${issue}`);
  }
  return issues;
}

function renderTriggerList(container, options) {
  const { state, worldTriggers, storyOptions, onSearch, onSelectTrigger, onCreateTrigger } = options;
  const ws = state.achievementWorkspace;
  const tools = el("div", "achievement-list-tools");
  tools.appendChild(button("＋ 新建", "button primary", onCreateTrigger));
  const search = input(ws.search, (value) => {
    resetScrollMemory(state.workspaceScrollPositions, "world-triggers:list");
    rerenderPreservingInput(search, () => onSearch(value), () => container.querySelector("input[type=search]"));
  }, { live: true, placeholder: "搜索 ID、目标剧情或条件" });
  search.type = "search";
  tools.appendChild(search);
  container.appendChild(tools);
  const query = ws.search.trim().toLocaleLowerCase("zh-CN");
  const visible = worldTriggers.map((trigger, index) => ({ trigger, index })).filter(({ trigger }) => !query || JSON.stringify(trigger).toLocaleLowerCase("zh-CN").includes(query));
  container.appendChild(el("div", "achievement-list-summary", `显示 ${visible.length} / ${worldTriggers.length}`));
  const list = el("div", "achievement-record-list");
  for (const { trigger, index } of visible) {
    const issues = getWorldTriggerIssues(trigger, storyOptions, worldTriggers);
    const row = button("", "achievement-record-row", () => onSelectTrigger(index));
    row.classList.toggle("active", ws.selectedTriggerIndex === index);
    const copy = el("span", "achievement-record-copy");
    copy.append(el("strong", "", trigger.id || "未命名触发器"), el("small", "", trigger.targetId || "尚未选择目标剧情"));
    row.append(copy, issues.length ? el("span", "achievement-issue-count", String(issues.length)) : el("span", "achievement-source-count", `${trigger.conditions?.length || 0} 条件`));
    list.appendChild(row);
  }
  if (!visible.length) list.appendChild(el("div", "achievement-empty", "没有符合条件的世界触发器。"));
  container.appendChild(list);
  bindScrollMemory(list, state.workspaceScrollPositions, "world-triggers:list");
}

function renderConditionEditor(parent, trigger, options) {
  const { onMutateTrigger } = options;
  const section = el("section", "achievement-detail-section");
  const heading = el("div", "achievement-section-heading");
  heading.append(el("h3", "", `触发条件 ${trigger.conditions?.length || 0}`), button("＋ 添加条件", "button secondary", () => {
    (trigger.conditions ||= []).push({ type: "should_not_finish", value: "" });
    onMutateTrigger(true);
  }));
  section.appendChild(heading);
  const list = el("div", "world-trigger-condition-list");
  for (const [index, condition] of (trigger.conditions || []).entries()) {
    const row = el("div", "world-trigger-condition-row");
    const type = document.createElement("select");
    type.className = "input";
    for (const definition of mapConditionDefinitions) type.appendChild(new Option(definition.label, definition.value));
    if (!mapConditionDefinitions.some((definition) => definition.value === condition.type)) type.appendChild(new Option(`${condition.type || "未知"} 未支持`, condition.type || ""));
    type.value = condition.type || "";
    type.addEventListener("change", () => {
      condition.type = type.value;
      if (["always", "in_newbie_task"].includes(condition.type)) condition.value = "";
      onMutateTrigger(true);
    });
    const value = input(condition.value, (next) => { condition.value = next.trim(); onMutateTrigger(false); });
    value.disabled = ["always", "in_newbie_task"].includes(condition.type);
    const remove = button("×", "icon-button danger", () => {
      trigger.conditions.splice(index, 1);
      onMutateTrigger(true);
    }, "删除条件");
    const detail = el("small", getMapConditionValueIssue(condition) ? "bad" : "", getMapConditionValueIssue(condition) || describeMapCondition(condition));
    row.append(type, value, remove, detail);
    list.appendChild(row);
  }
  if (!trigger.conditions?.length) list.appendChild(el("div", "achievement-empty compact", "无条件时会直接参与世界触发判断。"));
  section.appendChild(list);
  parent.appendChild(section);
}

function renderTriggerDetail(container, options) {
  const { state, worldTriggers, storyOptions, onMutateTrigger, onDeleteTrigger, onReplaceTrigger } = options;
  const trigger = worldTriggers[state.achievementWorkspace.selectedTriggerIndex] || worldTriggers[0];
  if (!trigger) {
    container.appendChild(el("div", "achievement-empty detail", "新建世界触发器后即可编辑。"));
    return;
  }
  const issues = getWorldTriggerIssues(trigger, storyOptions, worldTriggers);
  const header = el("div", "achievement-detail-header");
  const heading = el("div");
  heading.append(el("span", "achievement-eyebrow", "世界触发器"), el("h2", "", trigger.id || "未命名触发器"), el("code", "", trigger.targetId || "缺少目标"));
  header.append(heading, button("删除", "button danger", () => onDeleteTrigger(trigger)));
  container.appendChild(header);
  if (issues.length) {
    const list = el("ul", "achievement-issues");
    for (const issue of issues) list.appendChild(el("li", "", issue));
    container.appendChild(list);
  }

  const basic = el("section", "achievement-detail-section");
  basic.appendChild(el("h3", "", "触发设置"));
  const grid = el("div", "achievement-field-grid");
  grid.append(
    field("触发器 ID", input(trigger.id, (value) => { trigger.id = value.trim(); onMutateTrigger(true); })),
    field("目标剧情", createReferencePicker({
      value: trigger.targetId || "",
      options: storyOptions,
      placeholder: "搜索剧情段 ID",
      compact: true,
      showSelected: true,
      onSelect: (value) => { trigger.type = "story"; trigger.targetId = value; onMutateTrigger(true); },
    })),
    field("触发概率 %", input(trigger.probability ?? 100, (value) => { trigger.probability = Math.max(0, Math.min(100, Number(value) || 0)); onMutateTrigger(true); }, { type: "number", min: 0, max: 100 })),
  );
  const repeat = document.createElement("select");
  repeat.className = "input";
  repeat.append(new Option("只触发一次", "once"), new Option("可重复触发", "infinite"));
  repeat.value = trigger.repeatMode || "once";
  repeat.addEventListener("change", () => { trigger.repeatMode = repeat.value; onMutateTrigger(true); });
  grid.appendChild(field("触发次数", repeat));
  basic.appendChild(grid);
  container.appendChild(basic);
  renderConditionEditor(container, trigger, options);

  const advanced = el("section", "achievement-detail-section");
  advanced.appendChild(el("h3", "", "高级 JSON"));
  advanced.appendChild(createEmbeddedJsonEditor({
    value: trigger,
    modelPath: `world-triggers/${trigger.id || state.achievementWorkspace.selectedTriggerIndex}`,
    compact: true,
    validate: (value) => {
      if (!value || Array.isArray(value) || typeof value !== "object") throw new Error("世界触发器必须是对象");
    },
    onApply: onReplaceTrigger,
  }));
  container.appendChild(advanced);
}

export function renderAchievementWorkspace(container, options) {
  disposeEmbeddedCodeEditors(container);
  container.replaceChildren();
  renderHeader(container, options);
  const layout = el("div", "achievement-workspace-layout");
  const list = el("aside", "achievement-workspace-list");
  const detail = el("main", "achievement-workspace-detail");
  if (options.state.achievementWorkspace.tab === "triggers") {
    renderTriggerList(list, options);
    renderTriggerDetail(detail, options);
  } else {
    renderAchievementList(list, options);
    renderAchievementDetail(detail, options);
  }
  layout.append(list, detail);
  container.appendChild(layout);
}
