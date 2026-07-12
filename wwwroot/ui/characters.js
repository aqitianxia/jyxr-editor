import { createReferencePicker, createReferenceSummary } from "./reference-picker.js?v=20260711-core-17";
import { bindImeSafeInput } from "../core/input-composition.js?v=20260711-core-17";
import { createEmbeddedJsonEditor, disposeEmbeddedCodeEditors } from "./code-editor.js?v=20260711-stage6-1";
import { bindScrollMemory } from "./scroll-memory.js?v=20260711-scroll-1";

const CHARACTER_FILTERS = Object.freeze([
  { value: "all", label: "全部" },
  { value: "dialogue", label: "仅对白" },
  { value: "joinable", label: "可入队" },
  { value: "battle", label: "可战斗" },
  { value: "missingPortrait", label: "头像缺失" },
  { value: "incomplete", label: "有问题" },
]);

const CHARACTER_TABS = Object.freeze([
  { value: "overview", label: "概览" },
  { value: "stats", label: "属性" },
  { value: "skills", label: "武学与成长" },
  { value: "equipment", label: "装备与天赋" },
  { value: "advanced", label: "高级 JSON" },
]);

const STAT_FIELDS = Object.freeze([
  ["bili", "臂力"], ["dingli", "定力"], ["fuyuan", "福缘"], ["gengu", "根骨"],
  ["jianfa", "剑法"], ["daofa", "刀法"], ["quanzhang", "拳掌"], ["qimen", "奇门"],
  ["shenfa", "身法"], ["wuxing", "悟性"], ["wuxue", "武学常识"],
  ["max_hp", "最大生命"], ["max_mp", "最大内力"],
]);

function el(tag, className = "", text = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== "") node.textContent = text;
  return node;
}

function button(label, className, onClick) {
  const node = el("button", className, label);
  node.type = "button";
  node.addEventListener("click", onClick);
  return node;
}

function field(label, control, hint = "") {
  const wrapper = el("label", "character-field");
  wrapper.appendChild(el("span", "character-field-label", label));
  wrapper.appendChild(control);
  if (hint) wrapper.appendChild(el("small", "character-field-hint", hint));
  return wrapper;
}

function textInput(value, onChange, options = {}) {
  const input = document.createElement("input");
  input.className = "input";
  input.type = options.type || "text";
  input.value = value ?? "";
  if (options.placeholder) input.placeholder = options.placeholder;
  if (options.live) {
    bindImeSafeInput(input, onChange);
  } else {
    input.addEventListener("change", () => onChange(input.value));
  }
  return input;
}

function selectInput(value, choices, onChange) {
  const select = document.createElement("select");
  select.className = "input";
  for (const choice of choices) {
    const option = document.createElement("option");
    option.value = choice.value;
    option.textContent = choice.label;
    option.selected = choice.value === value;
    select.appendChild(option);
  }
  select.addEventListener("change", () => onChange(select.value));
  return select;
}

function checkboxInput(checked, onChange) {
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = Boolean(checked);
  input.addEventListener("change", () => onChange(input.checked));
  return input;
}

function numberInput(value, onChange, min = 1) {
  const input = document.createElement("input");
  input.className = "input";
  input.type = "number";
  input.min = String(min);
  input.value = String(Number.isFinite(value) ? value : min);
  input.addEventListener("change", () => onChange(Math.max(min, Number(input.value) || min)));
  return input;
}

function compactReferencePicker(value, options, onSelect, placeholder, showSelected = false) {
  return createReferencePicker({
    value,
    options,
    placeholder,
    onSelect,
    compact: true,
    showSelected,
  });
}

function matchesFilter(record, filter, issues, portraitInfo) {
  if (filter === "incomplete") return issues.length > 0;
  if (filter === "dialogue") return !record.model && record.arenaEnabled !== true;
  if (filter === "missingPortrait") return !portraitInfo?.resource || !portraitInfo?.previewPath;
  if (filter === "battle") return Boolean(record.model || record.arenaEnabled);
  if (filter === "joinable") {
    return Array.isArray(record.externalSkills)
      || Array.isArray(record.internalSkills)
      || Array.isArray(record.equipmentIds);
  }
  return true;
}

function matchesSearch(record, query) {
  if (!query) return true;
  const values = [record?.id, record?.name, record?.model, record?.growTemplate, record?.portrait];
  return values.some((value) => String(value || "").toLowerCase().includes(query));
}

function renderEmpty(container, title, detail) {
  const empty = el("div", "character-workspace-empty");
  empty.appendChild(el("strong", "", title));
  empty.appendChild(el("p", "", detail));
  container.appendChild(empty);
}

function renderList(container, options) {
  const { state, getIssues, getPortraitInfo, matchesRecordFilter, onSelect, onSearch, onFilter, onCreate, onCreateSpeaker } = options;
  const workspace = state.characterWorkspace;
  const header = el("div", "character-list-header");
  const heading = el("div");
  heading.appendChild(el("strong", "", "角色列表"));
  heading.appendChild(el("small", "", `${state.formRecords.length} 条定义`));
  header.appendChild(heading);
  const actions = el("div", "character-list-actions");
  const speakerButton = button("对白角色", "button secondary", onCreateSpeaker);
  speakerButton.title = "直接注册最小对白角色和头像资源，不创建完整伙伴配置";
  actions.append(
    speakerButton,
    button("＋ 新建", "button primary", onCreate),
  );
  header.appendChild(actions);
  container.appendChild(header);

  const search = textInput(workspace.search, onSearch, { placeholder: "搜索 ID、名称、模型、头像…", live: true });
  search.type = "search";
  search.classList.add("character-list-search");
  container.appendChild(search);
  container.appendChild(selectInput(workspace.filter, CHARACTER_FILTERS, onFilter));

  const query = workspace.search.trim().toLowerCase();
  const matches = state.formRecords.map((record, index) => {
    const issues = getIssues(record);
    const portrait = getPortraitInfo(record);
    return { record, index, issues, portrait };
  }).filter(({ record, issues, portrait }) => matchesSearch(record, query)
    && (matchesRecordFilter ? matchesRecordFilter(record, workspace.filter) : matchesFilter(record, workspace.filter, issues, portrait)));

  const summary = el("div", "character-list-summary", `显示 ${matches.length} / ${state.formRecords.length}`);
  container.appendChild(summary);
  const list = el("div", "character-record-list");
  for (const item of matches) {
    const card = button("", "character-record-card", () => onSelect(item.index));
    card.classList.toggle("active", item.index === state.selectedRecordIndex);
    if (item.portrait?.previewPath) {
      const image = document.createElement("img");
      image.src = `/api/assets/file?path=${encodeURIComponent(item.portrait.previewPath)}`;
      image.alt = item.record.name || item.record.id || "角色头像";
      image.loading = "lazy";
      card.appendChild(image);
    } else {
      card.appendChild(el("span", "character-record-placeholder", "人"));
    }
    const copy = el("span", "character-record-copy");
    copy.appendChild(el("strong", "", item.record.name || item.record.id || `#${item.index + 1}`));
    copy.appendChild(el("small", "", item.record.id || "缺少 ID"));
    card.appendChild(copy);
    if (item.issues.length > 0) card.appendChild(el("span", "character-issue-badge", String(item.issues.length)));
    list.appendChild(card);
  }
  if (matches.length === 0) renderEmpty(list, "没有匹配的角色", "尝试清除搜索词或切换筛选条件。");
  container.appendChild(list);
  bindScrollMemory(list, state.workspaceScrollPositions, "characters:list");
}

function renderPortraitCard(record, portraitInfo, onPickPortrait) {
  const card = el("section", "character-portrait-card");
  const preview = el("div", "character-portrait-preview");
  if (portraitInfo?.previewPath) {
    const image = document.createElement("img");
    image.src = `/api/assets/file?path=${encodeURIComponent(portraitInfo.previewPath)}`;
    image.alt = record.name || record.id || "头像";
    preview.appendChild(image);
  } else {
    preview.appendChild(el("span", "", "暂无头像"));
  }
  card.appendChild(preview);
  const copy = el("div", "character-portrait-copy");
  copy.appendChild(el("strong", "", "头像资源"));
  copy.appendChild(el("code", "", record.portrait || "未设置 portrait"));
  const portraitResolved = Boolean(portraitInfo?.resourceExists && portraitInfo?.assetExists);
  const portraitStatus = portraitResolved
    ? `已解析：${portraitInfo.assetPath}`
    : !record.portrait
      ? "错误原因：portrait 未设置"
      : !portraitInfo?.resourceExists
        ? `错误原因：资源 ID「${record.portrait}」未注册${portraitInfo?.detectedAssetPath ? `；当前仅显示自动检测预览 ${portraitInfo.detectedAssetPath}` : ""}`
        : `错误原因：资源值「${portraitInfo?.assetValue || record.portrait}」未解析到图片文件${portraitInfo?.detectedAssetPath ? `；当前仅显示自动检测预览 ${portraitInfo.detectedAssetPath}` : ""}`;
  copy.appendChild(el("small", portraitResolved ? "ok" : "bad", portraitStatus));
  copy.appendChild(button("选择头像", "button secondary", onPickPortrait));
  card.appendChild(copy);
  return card;
}

function renderIssues(issues, onOpenProblems) {
  const card = el("section", "character-issues-card");
  const title = el("div", "character-section-heading");
  title.appendChild(el("strong", "", `当前问题 ${issues.length}`));
  title.appendChild(button("打开问题中心", "button ghost", onOpenProblems));
  card.appendChild(title);
  if (issues.length === 0) {
    card.appendChild(el("p", "character-ok-message", "未发现角色专项问题。"));
  } else {
    const list = el("ul", "character-issue-list");
    for (const issue of issues) {
      list.appendChild(el("li", issue.severity === "warning" ? "warning" : "bad", issue.message || issue.detail || String(issue)));
    }
    card.appendChild(list);
  }
  return card;
}

function renderOverview(parent, context) {
  const { record, portraitInfo, references, mutate, onPickPortrait, issues, onOpenProblems } = context;
  const grid = el("div", "character-overview-grid");
  grid.appendChild(renderPortraitCard(record, portraitInfo, onPickPortrait));
  grid.appendChild(renderIssues(issues, onOpenProblems));
  parent.appendChild(grid);

  const section = el("section", "character-section-card");
  section.appendChild(el("h3", "", "基础字段"));
  const fields = el("div", "character-fields-grid");
  fields.appendChild(field("角色 ID", textInput(record.id, (value) => mutate("id", value)), "稳定引用 ID；修改前请查看引用关系。"));
  fields.appendChild(field("显示名称", textInput(record.name, (value) => mutate("name", value))));
  fields.appendChild(field("初始等级", textInput(record.level ?? 1, (value) => mutate("level", Number(value) || 1), { type: "number" })));
  fields.appendChild(field("性别", selectInput(record.gender || "neutral", [
    { value: "male", label: "male 男" }, { value: "female", label: "female 女" }, { value: "neutral", label: "neutral 中性" },
  ], (value) => mutate("gender", value))));
  fields.appendChild(field("模型", compactReferencePicker(record.model, references.models, (value) => mutate("model", value || null), "输入模型名称或 ID"), "模糊搜索已有模型；保存时写入模型 ID。"));
  fields.appendChild(field("成长模板", compactReferencePicker(record.growTemplate, references.growTemplates, (value) => mutate("growTemplate", value || null), "输入成长模板名称或 ID"), "模糊搜索成长模板；保存时写入稳定 ID。"));
  fields.appendChild(field("头像资源 ID", textInput(record.portrait, (value) => mutate("portrait", value || null))));
  const arena = el("div", "character-checkbox-field");
  arena.appendChild(checkboxInput(record.arenaEnabled, (value) => mutate("arenaEnabled", value)));
  arena.appendChild(el("span", "", "允许进入竞技场"));
  fields.appendChild(field("竞技场", arena));
  section.appendChild(fields);
  parent.appendChild(section);
}

function renderStats(parent, context) {
  const { record, mutateNested } = context;
  const section = el("section", "character-section-card");
  section.appendChild(el("h3", "", "初始属性"));
  section.appendChild(el("p", "character-section-help", "仅编辑 CharacterDefinition 当前支持的 stats 字段。"));
  const fields = el("div", "character-stat-grid");
  for (const [key, label] of STAT_FIELDS) {
    fields.appendChild(field(`${label} · ${key}`, textInput(record.stats?.[key] ?? 0, (value) => {
      mutateNested("stats", key, Number(value) || 0);
    }, { type: "number" })));
  }
  section.appendChild(fields);
  parent.appendChild(section);
}

function renderReferenceCollection(label, values, options, onChange) {
  const section = el("section", "character-section-card character-reference-editor");
  section.appendChild(el("h3", "", label));
  const list = el("div", "character-selected-references");
  const optionMap = new Map(options.map((option) => [option.id, option]));
  for (const id of values || []) {
    const option = optionMap.get(id);
    const row = el("div", "character-selected-reference");
    row.appendChild(createReferenceSummary(option, id));
    row.appendChild(button("删除", "button ghost", () => onChange(values.filter((candidate) => candidate !== id))));
    list.appendChild(row);
  }
  if (!values?.length) list.appendChild(el("div", "character-reference-empty", "尚未配置"));
  section.appendChild(list);

  const available = options.filter((option) => !values?.includes(option.id));
  section.appendChild(createReferencePicker({
    options: available,
    placeholder: `输入${label}名称或 ID 搜索并添加`,
    onSelect: (id) => onChange([...(values || []), id]),
  }));
  return section;
}

function renderSkillTable(label, entries, options, internal, onChange) {
  const section = el("section", "character-section-card character-skill-editor");
  section.appendChild(el("h3", "", label));
  const table = el("div", "character-workspace-skill-table");
  const header = el("div", `character-workspace-skill-row${internal ? " internal" : ""} header`);
  for (const title of [label, "等级", "上限", ...(internal ? ["装备"] : []), "操作"]) {
    header.appendChild(el("span", "", title));
  }
  table.appendChild(header);

  entries.forEach((entry, index) => {
    const row = el("div", `character-workspace-skill-row${internal ? " internal" : ""}`);
    row.appendChild(compactReferencePicker(entry?.id, options, (value) => {
      const next = entries.map((candidate, candidateIndex) => candidateIndex === index ? { ...candidate, id: value } : candidate);
      onChange(next);
    }, `输入${label}名称或 ID`, true));
    row.appendChild(numberInput(entry?.level, (value) => {
      onChange(entries.map((candidate, candidateIndex) => candidateIndex === index ? { ...candidate, level: value } : candidate));
    }));
    row.appendChild(numberInput(entry?.maxLevel, (value) => {
      onChange(entries.map((candidate, candidateIndex) => candidateIndex === index ? { ...candidate, maxLevel: value } : candidate));
    }));
    if (internal) {
      const equipped = el("label", "character-skill-equipped");
      equipped.appendChild(checkboxInput(entry?.equipped, (value) => {
        const next = entries.map((candidate, candidateIndex) => ({
          ...candidate,
          equipped: value ? candidateIndex === index : (candidateIndex === index ? false : candidate.equipped === true),
        }));
        onChange(next);
      }));
      equipped.appendChild(el("span", "", entry?.equipped ? "是" : "否"));
      row.appendChild(equipped);
    }
    row.appendChild(button("删除", "button ghost", () => onChange(entries.filter((_, candidateIndex) => candidateIndex !== index))));
    table.appendChild(row);
  });
  if (entries.length === 0) table.appendChild(el("div", "character-reference-empty", `尚未配置${label}`));
  section.appendChild(table);
  section.appendChild(createReferencePicker({
    options,
    excludeIds: entries.map((entry) => entry?.id).filter(Boolean),
    placeholder: `输入${label}名称或 ID 搜索并添加`,
    onSelect: (id) => onChange([...entries, { id, level: 1, maxLevel: 10, ...(internal ? { equipped: false } : {}) }]),
  }));
  return section;
}

function renderSkills(parent, context) {
  const { record, references, replaceField } = context;
  const columns = el("div", "character-editor-columns");
  columns.appendChild(renderSkillTable("外功", record.externalSkills || [], references.externalSkills, false, (value) => replaceField("externalSkills", value)));
  columns.appendChild(renderSkillTable("内功", record.internalSkills || [], references.internalSkills, true, (value) => replaceField("internalSkills", value)));
  parent.appendChild(columns);
  parent.appendChild(renderReferenceCollection("绝技", record.specialSkillIds || [], references.specialSkills, (value) => replaceField("specialSkillIds", value)));
}

function renderEquipment(parent, context) {
  const { record, references, replaceField } = context;
  const columns = el("div", "character-editor-columns");
  columns.appendChild(renderReferenceCollection("天赋", record.talentIds || [], references.talents, (value) => replaceField("talentIds", value)));
  columns.appendChild(renderReferenceCollection("初始装备", record.equipmentIds || [], references.equipment, (value) => replaceField("equipmentIds", value)));
  parent.appendChild(columns);
}

function renderAdvanced(parent, context) {
  const { record, replaceRecord, onOpenAdvancedData } = context;
  const notice = el("div", "character-advanced-notice");
  notice.appendChild(el("strong", "", "高级 JSON 与表单编辑同一条内存记录"));
  notice.appendChild(el("p", "", "未识别字段会保留。应用 JSON 后仍需点击顶部“保存”写入 characters.json。"));
  notice.appendChild(button("在高级数据中打开 characters.json", "button ghost", onOpenAdvancedData));
  parent.appendChild(notice);
  parent.appendChild(createEmbeddedJsonEditor({
    value: record,
    modelPath: `characters/${record.id || "record"}`,
    validate: (value) => {
      if (!value || Array.isArray(value) || typeof value !== "object") throw new Error("角色 JSON 必须是对象");
    },
    onApply: replaceRecord,
  }));
}

function renderReferences(container, references, onClose) {
  const backdrop = el("div", "character-reference-backdrop");
  backdrop.addEventListener("click", onClose);
  const drawer = el("aside", "character-reference-drawer");
  drawer.addEventListener("click", (event) => event.stopPropagation());
  const header = el("div", "character-reference-header");
  const copy = el("div");
  copy.appendChild(el("strong", "", `静态引用 ${references.length}`));
  copy.appendChild(el("small", "", "按角色 ID 与名称进行精确字符串扫描"));
  header.appendChild(copy);
  header.appendChild(button("×", "icon-button", onClose));
  drawer.appendChild(header);
  const warning = el("p", "character-reference-warning", "该检查不能覆盖动态拼接、脚本逻辑或运行时生成的引用；删除前仍需人工确认。");
  drawer.appendChild(warning);
  const list = el("div", "character-reference-list");
  if (references.length === 0) {
    renderEmpty(list, "未找到静态引用", "这不代表角色一定可以安全删除。" );
  } else {
    for (const reference of references) {
      const item = el("div", "character-reference-item");
      item.appendChild(el("strong", "", reference.path));
      item.appendChild(el("code", "", reference.fieldPath || "$"));
      item.appendChild(el("small", "", `匹配值：${reference.value}`));
      list.appendChild(item);
    }
  }
  drawer.appendChild(list);
  backdrop.appendChild(drawer);
  container.appendChild(backdrop);
}

function renderDetail(container, options) {
  const { state, getIssues, getPortraitInfo, getReferences, onMutate, onReplaceRecord, onPickPortrait,
    referenceOptions, onDuplicate, onDelete, onOpenAdvancedData, onOpenProblems, onOpenReferences, onCloseReferences, onTab } = options;
  const record = state.formRecords[state.selectedRecordIndex];
  if (!record) {
    renderEmpty(container, "没有可编辑的角色", "点击左侧“新建”创建第一条角色定义。" );
    return;
  }
  const issues = getIssues(record);
  const portraitInfo = getPortraitInfo(record);
  const header = el("div", "character-detail-header");
  const title = el("div");
  title.appendChild(el("span", "character-detail-eyebrow", "角色定义"));
  title.appendChild(el("h2", "", record.name || record.id || "未命名角色"));
  title.appendChild(el("code", "", record.id || "缺少 ID"));
  header.appendChild(title);
  const actions = el("div", "character-detail-actions");
  actions.appendChild(button("引用关系", "button secondary", onOpenReferences));
  actions.appendChild(button("复制", "button ghost", onDuplicate));
  actions.appendChild(button("删除", "button danger", onDelete));
  header.appendChild(actions);
  container.appendChild(header);

  const tabs = el("div", "character-tabs");
  for (const tab of CHARACTER_TABS) {
    const tabButton = button(tab.label, "character-tab", () => onTab(tab.value));
    tabButton.classList.toggle("active", state.characterWorkspace.tab === tab.value);
    tabs.appendChild(tabButton);
  }
  container.appendChild(tabs);

  const body = el("div", "character-detail-body");
  const context = {
    record, issues, portraitInfo, references: referenceOptions, onPickPortrait, onOpenProblems, onOpenAdvancedData,
    mutate: (key, value) => onMutate(record, key, value),
    mutateNested: (owner, key, value) => onMutate(record, owner, { ...(record[owner] || {}), [key]: value }),
    replaceField: (key, value) => onMutate(record, key, value),
    replaceRecord: onReplaceRecord,
  };
  if (state.characterWorkspace.tab === "stats") renderStats(body, context);
  else if (state.characterWorkspace.tab === "skills") renderSkills(body, context);
  else if (state.characterWorkspace.tab === "equipment") renderEquipment(body, context);
  else if (state.characterWorkspace.tab === "advanced") renderAdvanced(body, context);
  else renderOverview(body, context);
  container.appendChild(body);

  if (state.characterWorkspace.referencesOpen) {
    renderReferences(container, getReferences(record), onCloseReferences);
  }
}

export function renderCharacterWorkspace(container, options) {
  const { state } = options;
  disposeEmbeddedCodeEditors(container);
  container.replaceChildren();
  const shell = el("div", "character-workspace-shell");
  const list = el("aside", "character-workspace-list");
  const detail = el("main", "character-workspace-detail");
  shell.appendChild(list);
  shell.appendChild(detail);
  container.appendChild(shell);
  renderList(list, options);
  renderDetail(detail, options);
}
