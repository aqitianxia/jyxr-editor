import { createEmbeddedJsonEditor, disposeEmbeddedCodeEditors } from "../ui/code-editor.js?v=20260711-stage6-1";
import { createReferencePicker } from "../ui/reference-picker.js?v=20260711-core-17";
import { bindScrollMemory } from "../ui/scroll-memory.js?v=20260712-search-1";
import { getSectIssues, matchesSectSearch } from "../domain/sects.js?v=20260711-stage9-2";

const tabs = [["overview", "门派资料"], ["references", "内容引用"], ["advanced", "高级 JSON"]];

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

function input(value, onChange, multiline = false) {
  const node = document.createElement(multiline ? "textarea" : "input");
  node.value = value ?? "";
  if (!multiline) node.type = "text";
  node.addEventListener("change", () => onChange(node.value));
  return node;
}

function field(label, control, hint = "") {
  const wrapper = el("label", "sect-field");
  wrapper.append(el("span", "sect-field-label", label), control);
  if (hint) wrapper.appendChild(el("small", "sect-field-hint", hint));
  return wrapper;
}

function imagePreview(resource, alt, className = "") {
  const box = el("div", `sect-image-preview ${className} ${resource?.assetPath ? "ok" : "missing"}`);
  if (resource?.assetPath) {
    const image = document.createElement("img");
    image.src = `/api/assets/file?path=${encodeURIComponent(resource.assetPath)}`;
    image.alt = alt;
    box.appendChild(image);
  } else box.appendChild(el("span", "", resource?.id ? "资源未解析" : "未设置"));
  return box;
}

function referenceField(label, value, options, onSelect, hint, placeholder) {
  return field(label, createReferencePicker({ value: value || "", options, onSelect, placeholder, compact: true }), hint);
}

function renderEmpty(parent, title, detail) {
  const node = el("div", "sect-empty");
  node.append(el("strong", "", title), el("p", "", detail));
  parent.appendChild(node);
}

function renderCatalog(parent, context) {
  const header = el("div", "sect-catalog-header");
  const copy = el("div"); copy.append(el("strong", "", "门派"), el("small", "", "入门选择与展示资料"));
  header.append(copy, button("新建", "button primary", context.onCreate));
  const search = input(context.state.sectWorkspace.search, context.onSearch);
  search.type = "search"; search.placeholder = "搜索名称、ID、定位或标签";
  parent.append(header, search);
  const list = el("div", "sect-record-list");
  const visible = context.records.map((record, index) => ({ record, index }))
    .filter(({ record }) => matchesSectSearch(record, context.state.sectWorkspace.search));
  for (const { record, index } of visible) {
    const issues = context.getIssues(record);
    const row = button("", "sect-record-row", () => context.onSelect(index));
    row.classList.toggle("active", index === context.state.selectedRecordIndex);
    row.appendChild(imagePreview(context.resolveResource(record.portrait), record.name || record.id, "thumbnail"));
    const body = el("span", "sect-record-copy");
    body.append(el("strong", "", record.name || record.id || "未命名门派"), el("small", "", record.primaryFocus || "未填写武学定位"), el("code", "", record.id || "缺少 ID"));
    const meta = el("span", "sect-record-meta");
    meta.appendChild(el("span", record.storyId ? "ok" : "warning", record.storyId ? "有入门剧情" : "不显示"));
    if (issues.length) meta.appendChild(el("span", "sect-issue-count", String(issues.length)));
    row.append(body, meta); list.appendChild(row);
  }
  if (!visible.length) renderEmpty(list, "没有匹配门派", "调整搜索词后重试。 ");
  parent.appendChild(list);
  bindScrollMemory(list, context.state.workspaceScrollPositions, "sects:list");
}

function renderHero(parent, context, record) {
  const hero = el("section", "sect-hero");
  const background = context.resolveResource(record.background);
  if (background?.assetPath) hero.style.backgroundImage = `linear-gradient(rgb(10 16 20/.2),rgb(10 16 20/.82)),url('/api/assets/file?path=${encodeURIComponent(background.assetPath)}')`;
  hero.appendChild(imagePreview(context.resolveResource(record.portrait), record.name || record.id, "portrait"));
  const copy = el("div", "sect-hero-copy");
  copy.append(el("span", "sect-eyebrow", "门派资料"), el("h2", "", record.name || record.id || "未命名门派"), el("p", "", record.primaryFocus || "尚未填写主修方向"));
  hero.appendChild(copy); parent.appendChild(hero);
}

function renderStringCollection(parent, title, values, options, onReplace, description, placeholder, allowCustom = false) {
  const section = el("section", "sect-section");
  const heading = el("div", "sect-section-heading");
  heading.append(el("div", "", ""), button("添加", "button secondary", () => onReplace([...(values || []), ""])));
  heading.firstChild.append(el("h3", "", title), el("p", "", description));
  section.appendChild(heading);
  const list = el("div", "sect-reference-list");
  let datalistId = "";
  if (allowCustom && options.length) {
    datalistId = `sect-options-${title}`;
    document.getElementById(datalistId)?.remove();
    const datalist = document.createElement("datalist"); datalist.id = datalistId;
    options.forEach((option) => { const item = document.createElement("option"); item.value = option.id; item.label = [option.name, option.subtitle].filter(Boolean).join(" · "); datalist.appendChild(item); });
    document.body.appendChild(datalist);
  }
  (values || []).forEach((value, index) => {
    const row = el("div", "sect-reference-row");
    let control;
    if (allowCustom) {
      control = input(value, (next) => { const copy = [...values]; copy[index] = next; onReplace(copy); });
      control.placeholder = placeholder;
      if (datalistId) control.setAttribute("list", datalistId);
    } else {
      control = createReferencePicker({ value, options, placeholder, compact: true, onSelect: (next) => {
        const copy = [...values]; copy[index] = next; onReplace(copy);
      }});
    }
    row.append(control, button("×", "icon-button", () => onReplace(values.filter((_, itemIndex) => itemIndex !== index)), "移除"));
    list.appendChild(row);
  });
  if (!(values || []).length) renderEmpty(list, `尚未添加${title}`, "使用“添加”创建第一项。 ");
  section.appendChild(list); parent.appendChild(section);
}

function renderOverview(parent, context, record) {
  const identity = el("section", "sect-section");
  identity.append(el("h3", "", "基础资料"), el("p", "sect-section-note", "门派选择界面直接展示这些文本。已有门派被剧情引用后，不要随意修改稳定 ID。"));
  const grid = el("div", "sect-fields-grid");
  grid.append(field("门派 ID", input(record.id, (value) => context.onPatch("id", value))), field("显示名称", input(record.name, (value) => context.onPatch("name", value))), field("主修方向", input(record.primaryFocus, (value) => context.onPatch("primaryFocus", value)), "自由文本，例如“拳/剑、内功”。"));
  identity.appendChild(grid);
  identity.appendChild(field("门派介绍", input(record.description, (value) => context.onPatch("description", value), true), "支持换行；选择门派时完整显示。"));
  parent.appendChild(identity);

  const resources = el("section", "sect-section");
  resources.append(el("h3", "", "展示资源"), el("p", "sect-section-note", "这里只绑定 resources.json 中已有资源。图片制作、导入和 PCK 覆盖必须在 Godot 或资源包流程完成。"));
  const resourceGrid = el("div", "sect-resource-grid");
  resourceGrid.append(referenceField("头像", record.portrait, context.references.portraits, (value) => context.onPatch("portrait", value || null), "门派列表和详情头像。", "搜索头像名称或 ID"), referenceField("背景", record.background, context.references.backgrounds, (value) => context.onPatch("background", value || null), "门派详情的大幅背景。", "搜索地图或背景名称"));
  resources.appendChild(resourceGrid); parent.appendChild(resources);

  renderStringCollection(parent, "特色标签", record.traitTags, [], (value) => context.onPatch("traitTags", value), "用于展示门派特色，不参与规则计算。可直接输入自定义文字。", "输入标签", true);
}

function renderReferences(parent, context, record) {
  const story = el("section", "sect-section");
  story.append(el("h3", "", "入门剧情"), el("p", "sect-section-note", "运行时只把 storyId 非空的门派放入选择界面；确认门派后由宿主继续执行该剧情 segment。"));
  story.appendChild(referenceField("剧情 segment", record.storyId, context.references.stories, (value) => context.onPatch("storyId", value), "保存 segment ID。缺失引用不会自动修复。", "搜索剧情标题或 segment ID"));
  parent.appendChild(story);
  renderStringCollection(parent, "代表武学", record.signatureSkillNames, context.references.skills, (value) => context.onPatch("signatureSkillNames", value), "可选择外功、内功、绝技、奥义、嵌套招式和天赋；JSON 继续保存名称/ID字符串数组。", "搜索武学或天赋");
  renderStringCollection(parent, "代表人物", record.masterNames, context.references.characters, (value) => context.onPatch("masterNames", value), "运行时把这些值直接作为展示文字，不解析角色对象。角色名称会提供搜索建议；“全真七子”等集合称谓可直接输入并保留。", "搜索角色名称或输入称谓", true);
}

function renderAdvanced(parent, context, record) {
  const section = el("section", "sect-section");
  const issues = context.getIssues(record);
  section.append(el("h3", "", "静态检查"), el("p", "sect-section-note", "问题会定位到具体字段；编辑器不会静默替换或删除缺失引用。"));
  if (!issues.length) section.appendChild(el("div", "sect-callout ok", "当前门派未发现可静态识别的问题。"));
  else {
    const list = el("ul", "sect-issues");
    issues.forEach((issue) => { const item = el("li"); item.append(el("code", "", issue.field), document.createTextNode(` ${issue.message}`)); list.appendChild(item); });
    section.appendChild(list);
  }
  section.appendChild(createEmbeddedJsonEditor({ value: record, modelPath: `sects/${record.id || context.state.selectedRecordIndex}`, validate: (value) => {
    if (!value || Array.isArray(value) || typeof value !== "object") throw new Error("门派 JSON 必须是对象");
  }, onApply: context.onReplace }));
  parent.appendChild(section);
}

function renderDetail(parent, context, record) {
  renderHero(parent, context, record);
  const actions = el("div", "sect-detail-actions");
  actions.append(button("复制", "button ghost", context.onDuplicate), button("删除", "button danger", context.onDelete));
  parent.appendChild(actions);
  const nav = el("div", "sect-tabs");
  tabs.forEach(([id, label]) => { const tab = button(label, "sect-tab", () => context.onTab(id)); tab.classList.toggle("active", context.state.sectWorkspace.tab === id); nav.appendChild(tab); });
  parent.appendChild(nav);
  const body = el("div", "sect-detail-body");
  if (context.state.sectWorkspace.tab === "references") renderReferences(body, context, record);
  else if (context.state.sectWorkspace.tab === "advanced") renderAdvanced(body, context, record);
  else renderOverview(body, context, record);
  parent.appendChild(body);
}

export function renderSectWorkspace(container, context) {
  disposeEmbeddedCodeEditors(container);
  container.replaceChildren();
  const shell = el("div", "sect-workspace-shell");
  const catalog = el("aside", "sect-workspace-catalog");
  const detail = el("main", "sect-workspace-detail");
  shell.append(catalog, detail); container.appendChild(shell);
  renderCatalog(catalog, context);
  const record = context.records[context.state.selectedRecordIndex];
  if (record) renderDetail(detail, context, record);
  else renderEmpty(detail, "没有门派", "新建第一份门派资料后即可配置入门选择。 ");
}
