import { bindImeSafeInput } from "../core/input-composition.js?v=20260712-search-1";
import {
  battleFilters,
  battleUnitKinds,
  getBattleStats,
  getBattleUnit,
  getBattleUnits,
  matchesBattleFilter,
  matchesBattleSearch,
} from "../domain/battles.js?v=20260722-battle-links-1";
import { createEmbeddedJsonEditor, disposeEmbeddedCodeEditors } from "../ui/code-editor.js?v=20260711-stage6-1";
import { createBattleBoard } from "../ui/battle-board.js?v=20260722-battle-links-1";
import { createReferencePicker, createReferenceSummary } from "../ui/reference-picker.js?v=20260711-core-17";
import { bindScrollMemory } from "../ui/scroll-memory.js?v=20260712-search-1";

const tabs = Object.freeze([
  ["deployment", "部署"],
  ["settings", "战斗设置"],
  ["references", "引用"],
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
  const node = document.createElement("input");
  node.className = "input";
  node.type = options.type || "text";
  node.value = value ?? "";
  if (options.placeholder) node.placeholder = options.placeholder;
  if (options.min !== undefined) node.min = String(options.min);
  if (options.max !== undefined) node.max = String(options.max);
  if (options.step !== undefined) node.step = String(options.step);
  if (options.readOnly) node.readOnly = true;
  const read = () => options.type === "number" ? Number(node.value) : node.value;
  if (options.live) bindImeSafeInput(node, () => onChange(read()));
  else node.addEventListener("change", () => onChange(read()));
  return node;
}

function select(value, choices, onChange) {
  const node = document.createElement("select");
  node.className = "input";
  for (const [choiceValue, label] of choices) {
    const option = document.createElement("option");
    option.value = String(choiceValue);
    option.textContent = label;
    option.selected = String(choiceValue) === String(value ?? "");
    node.appendChild(option);
  }
  node.addEventListener("change", () => onChange(node.value));
  return node;
}

function checkbox(checked, onChange, label) {
  const wrapper = el("label", "battle-checkbox");
  const control = document.createElement("input");
  control.type = "checkbox";
  control.checked = Boolean(checked);
  control.addEventListener("change", () => onChange(control.checked));
  wrapper.append(control, el("span", "", label));
  return wrapper;
}

function field(label, control, hint = "") {
  const wrapper = el("label", "battle-field");
  wrapper.append(el("span", "battle-field-label", label), control);
  if (hint) wrapper.appendChild(el("small", "battle-field-hint", hint));
  return wrapper;
}

function empty(parent, title, detail) {
  const node = el("div", "battle-empty");
  node.append(el("strong", "", title), el("p", "", detail));
  parent.appendChild(node);
}

function segmented(value, choices, onChange) {
  const group = el("div", "battle-segmented");
  for (const [choiceValue, label] of choices) {
    const item = button(label, "", () => onChange(choiceValue));
    item.classList.toggle("active", choiceValue === value);
    group.appendChild(item);
  }
  return group;
}

function renderIssueList(parent, issues, onSelectUnit) {
  if (!issues.length) {
    parent.appendChild(el("div", "battle-callout ok", "当前战斗结构完整。"));
    return;
  }
  const list = el("ul", "battle-issue-list");
  for (const issue of issues) {
    const item = el("li", issue.severity, issue.message);
    if (issue.unitKey) item.addEventListener("click", () => onSelectUnit?.(issue.unitKey));
    list.appendChild(item);
  }
  parent.appendChild(list);
}

function renderBattleList(parent, context) {
  const { state, onCreate, onSelectBattle, onSearch, onFilter } = context;
  const workspace = state.battleWorkspace;
  const header = el("div", "battle-column-header");
  const title = el("div");
  title.append(el("strong", "", "战斗"), el("small", "", `${state.records.length} 条定义`));
  header.append(title, button("＋ 新建", "button primary", onCreate));
  parent.append(header,
    input(workspace.search, onSearch, { type: "search", placeholder: "搜索战斗、角色或背景…", live: true }),
    select(workspace.filter, battleFilters, onFilter));

  const matches = state.records.map((record, index) => {
    const issueContext = context.getIssueContext(record);
    return { record, index, issueContext, stats: getBattleStats(record, issueContext) };
  }).filter(({ record, issueContext }) => matchesBattleSearch(record, workspace.search)
    && matchesBattleFilter(record, workspace.filter, issueContext));
  parent.appendChild(el("div", "battle-list-summary", `显示 ${matches.length} / ${state.records.length}`));
  const list = el("div", "battle-record-list");
  for (const { record, index, stats } of matches) {
    const row = button("", "battle-record-row", () => onSelectBattle(index));
    row.classList.toggle("active", index === state.selectedRecordIndex);
    const copy = el("span", "battle-record-copy");
    copy.append(el("strong", "", record.name || record.id || `战斗 ${index + 1}`), el("code", "", record.id || "缺少 ID"));
    const meta = el("span", "battle-record-meta");
    meta.append(el("span", "", `${stats.playerSlotCount} 位`), el("span", "", `${stats.enemyCount} 敌`));
    if (stats.errorCount + stats.warningCount) meta.appendChild(el("span", "battle-warning-count", String(stats.errorCount + stats.warningCount)));
    row.append(copy, meta);
    list.appendChild(row);
  }
  if (!matches.length) empty(list, "没有匹配的战斗", "清除搜索词或切换筛选条件后再试。");
  parent.appendChild(list);
  bindScrollMemory(list, state.workspaceScrollPositions, "battles:list");
}

function renderUnitStrip(parent, context, record) {
  const units = getBattleUnits(record);
  const strip = el("div", "battle-unit-strip");
  const heading = el("div", "battle-unit-strip-header");
  heading.append(el("strong", "", `参战单位 ${units.length}`), el("small", "", "拖动棋子，或选择后点击目标格"));
  const add = el("div", "battle-add-unit-actions");
  for (const [kind, label] of battleUnitKinds) add.appendChild(button(`＋ ${label}`, "button secondary", () => context.onAddUnit(kind)));
  heading.appendChild(add);
  strip.appendChild(heading);
  const list = el("div", "battle-unit-chip-list");
  for (const entry of units) {
    const character = context.characterMap.get(String(entry.unit.characterId || ""));
    const labels = {
      party: `位置 ${Number(entry.unit.partyIndex) + 1}`,
      ally: character?.name || entry.unit.characterId || "未选择友军",
      enemy: character?.name || entry.unit.characterId || "未选择敌人",
      random: entry.unit.name || "随机敌人",
      invalid: "无效单位",
    };
    const chip = button("", `battle-unit-chip ${entry.kind}`, () => context.onSelectUnit(entry.key));
    chip.classList.toggle("active", entry.key === context.state.battleWorkspace.selectedUnitKey);
    chip.append(el("strong", "", labels[entry.kind]), el("small", "", `(${entry.unit.position?.x ?? "?"}, ${entry.unit.position?.y ?? "?"})`));
    list.appendChild(chip);
  }
  strip.appendChild(list);
  parent.appendChild(strip);
}

function renderDeployment(parent, context, record) {
  const background = context.backgroundOptions.find((option) => option.id === record.mapId);
  parent.appendChild(createBattleBoard({
    record,
    selectedUnitKey: context.state.battleWorkspace.selectedUnitKey,
    characters: context.characterMap,
    backgroundPath: background?.path || "",
    onSelect: context.onSelectUnit,
    onMove: context.onMoveUnit,
  }));
  renderUnitStrip(parent, context, record);
}

function renderSettings(parent, context, record) {
  const basics = el("section", "battle-editor-section");
  basics.appendChild(el("h3", "", "基础信息"));
  const fields = el("div", "battle-fields-grid");
  const idControl = el("div", "battle-id-control");
  idControl.append(
    input(record.id, () => {}, { readOnly: true }),
    button("重命名 ID", "button ghost", context.onRename),
  );
  fields.append(
    field("战斗 ID", idControl, "地图事件和剧情使用这个稳定 ID。"),
    field("显示名称", input(record.name, (value) => context.onPatchBattle({ name: value }))),
    field("经验倍率", input(record.experienceMultiplier ?? 1, (value) => context.onPatchBattle({ experienceMultiplier: value }), { type: "number", min: 0, step: 0.1 }), "0 表示不获得经验。"),
    field("战斗音乐", createReferencePicker({
      value: record.music || "",
      options: context.musicOptions,
      compact: true,
      placeholder: "搜索音乐资源 ID",
      onSelect: (value) => context.onPatchBattle({ music: value }),
    }), "保存 resources.json 中的音乐资源 ID。"),
  );
  basics.appendChild(fields);
  if (record.music) basics.appendChild(button("清空音乐", "button ghost", () => context.onPatchBattle({ music: null })));
  parent.appendChild(basics);

  const backgrounds = el("section", "battle-editor-section");
  backgrounds.append(el("h3", "", "战场背景"), el("p", "battle-section-note", "mapId 保存 assets/art/battle_bg 下图片的文件名，不是 maps.json 的地图 ID。"));
  const backgroundChoices = context.backgroundOptions.map((option) => [option.id, option.label]);
  if (record.mapId && !backgroundChoices.some(([id]) => id === record.mapId)) backgroundChoices.unshift([record.mapId, `${record.mapId}（文件不存在）`]);
  backgrounds.appendChild(field("背景文件", select(record.mapId || "", backgroundChoices, (value) => context.onPatchBattle({ mapId: value }))));
  const selected = context.backgroundOptions.find((option) => option.id === record.mapId);
  const preview = el("div", "battle-background-preview");
  if (selected?.path) {
    const image = document.createElement("img");
    image.src = `/api/assets/file?path=${encodeURIComponent(selected.path)}`;
    image.alt = selected.label;
    preview.appendChild(image);
  } else preview.appendChild(el("span", "", record.mapId ? `找不到 ${record.mapId}` : "尚未选择背景"));
  backgrounds.appendChild(preview);
  parent.appendChild(backgrounds);

  const required = el("section", "battle-editor-section");
  required.append(el("h3", "", `必选角色 ${record.requiredCharacterIds.length}`), el("p", "battle-section-note", "这里只会从玩家当前队伍中自动选中角色，数量不能超过玩家部署位置。"));
  const list = el("div", "battle-required-list");
  record.requiredCharacterIds.forEach((id, index) => {
    const row = el("div", "battle-required-row");
    row.append(createReferenceSummary(context.characterOptions.find((option) => option.id === id), id), button("×", "icon-button", () => context.onRemoveRequiredCharacter(index), "移除必选角色"));
    list.appendChild(row);
  });
  required.appendChild(list);
  required.appendChild(createReferencePicker({
    options: context.characterOptions,
    compact: true,
    showSelected: false,
    excludeIds: record.requiredCharacterIds,
    placeholder: "添加必选角色",
    onSelect: context.onAddRequiredCharacter,
  }));
  parent.appendChild(required);
}

function renderReferences(parent, context, record) {
  const references = context.getReferences(record);
  const section = el("section", "battle-editor-section");
  section.append(el("h3", "", `静态引用 ${references.length}`), el("p", "battle-section-note", "列出地图、剧情和其他 JSON 中可静态识别的战斗 ID 引用。"));
  if (!references.length) empty(section, "未找到静态引用", "动态脚本或运行时拼接的引用不会出现在这里。");
  else {
    const list = el("div", "battle-reference-list");
    for (const reference of references) {
      const row = el("div", "battle-reference-row");
      row.append(
        el("strong", "", reference.path),
        el("code", "", reference.fieldPath),
        el("small", "", reference.value || record.id),
        button("打开", "button ghost", () => context.onOpenReference(reference)),
      );
      list.appendChild(row);
    }
    section.appendChild(list);
  }
  parent.appendChild(section);
}

function renderAdvanced(parent, context, record) {
  const section = el("section", "battle-editor-section battle-advanced-json");
  section.append(el("h3", "", "战斗 JSON"), el("p", "battle-section-note", "用于编辑结构化控件尚未覆盖的字段。应用时整体替换当前战斗，并保留你写入的扩展字段。"));
  section.appendChild(createEmbeddedJsonEditor({
    value: record,
    modelPath: `battles/${record.id || "record"}`,
    validate: (value) => {
      if (!value || Array.isArray(value) || typeof value !== "object") throw new Error("战斗 JSON 必须是对象");
      if (!Array.isArray(value.participants)) throw new Error("participants 必须是数组");
      if (!Array.isArray(value.randomParticipants)) throw new Error("randomParticipants 必须是数组");
      if (!Array.isArray(value.requiredCharacterIds)) throw new Error("requiredCharacterIds 必须是数组");
    },
    onApply: context.onReplaceBattle,
  }));
  parent.appendChild(section);
}

function renderInspector(parent, context, record) {
  const issueContext = context.getIssueContext(record);
  const entry = getBattleUnit(record, context.state.battleWorkspace.selectedUnitKey);
  const heading = el("div", "battle-inspector-header");
  heading.append(el("span", "battle-detail-eyebrow", "单位检查器"), el("h3", "", entry ? "部署单位" : "战斗检查"));
  parent.appendChild(heading);
  if (!entry || context.state.battleWorkspace.tab !== "deployment") {
    const stats = getBattleStats(record, issueContext);
    const summary = el("div", "battle-stats");
    [["玩家位置", stats.playerSlotCount], ["固定友军", stats.allyCount], ["固定敌人", stats.fixedEnemyCount], ["随机敌人", stats.randomEnemyCount]].forEach(([label, value]) => {
      const item = el("div", "battle-stat");
      item.append(el("span", "", label), el("strong", "", String(value)));
      summary.appendChild(item);
    });
    parent.appendChild(summary);
    renderIssueList(parent, stats.issues, context.onSelectUnit);
    return;
  }

  const section = el("section", "battle-inspector-section");
  section.append(el("h4", "", "单位类型"), segmented(entry.kind, battleUnitKinds, (kind) => context.onSetUnitKind(entry.key, kind)));
  if (entry.kind === "ally" || entry.kind === "enemy") {
    section.appendChild(field("角色", createReferencePicker({
      value: entry.unit.characterId || "",
      options: context.characterOptions,
      compact: true,
      placeholder: "搜索角色名称或 ID",
      onSelect: (characterId) => context.onPatchUnit(entry.key, { characterId }),
    })));
  }
  if (entry.kind === "party") {
    section.appendChild(field("玩家序号", input(entry.unit.partyIndex, (partyIndex) => context.onPatchUnit(entry.key, { partyIndex }), { type: "number", min: 0 }), "从 0 开始并保持连续。"));
  }
  if (entry.kind === "random") {
    section.append(
      field("显示名称", input(entry.unit.name || "", (name) => context.onPatchUnit(entry.key, { name }))),
      field("随机等级", input(entry.unit.tier ?? 0, (tier) => context.onPatchUnit(entry.key, { tier }), { type: "number", min: 0 }), "普通敌人允许 0..3。"),
      field("模型", input(entry.unit.model || "", (model) => context.onPatchUnit(entry.key, { model: model || null }), { placeholder: "可选模型覆盖" })),
      checkbox(entry.unit.boss, (boss) => context.onPatchUnit(entry.key, { boss }), "Boss"),
    );
  }
  section.appendChild(el("h4", "", "位置与朝向"));
  const coordinates = el("div", "battle-coordinate-fields");
  coordinates.append(
    field("X", input(entry.unit.position?.x ?? 0, (x) => context.onMoveUnit(entry.key, { x, y: Number(entry.unit.position?.y ?? 0) }), { type: "number", min: 0, max: 10 })),
    field("Y", input(entry.unit.position?.y ?? 0, (y) => context.onMoveUnit(entry.key, { x: Number(entry.unit.position?.x ?? 0), y }), { type: "number", min: 0, max: 3 })),
  );
  section.appendChild(coordinates);
  if (entry.kind === "random") {
    section.appendChild(field("阵营", segmented(Number(entry.unit.team) === 1 ? "1" : "2", [["1", "玩家 1"], ["2", "敌方 2"]], (team) => context.onPatchUnit(entry.key, { team: Number(team) }))));
  } else {
    section.appendChild(field("阵营", el("div", "battle-readonly-value", Number(entry.unit.team) === 1 ? "玩家 1" : "敌方 2"), "固定单位的阵营由单位类型决定。"));
  }
  section.appendChild(field("朝向", segmented(Number(entry.unit.facing) > 0 ? "1" : "0", [["0", "向左"], ["1", "向右"]], (facing) => context.onPatchUnit(entry.key, { facing: Number(facing) }))));
  parent.appendChild(section);

  const issues = getBattleStats(record, issueContext).issues.filter((issue) => !issue.unitKey || issue.unitKey === entry.key);
  renderIssueList(parent, issues, context.onSelectUnit);
  const actions = el("div", "battle-inspector-actions");
  actions.append(button("复制单位", "button ghost", () => context.onDuplicateUnit(entry.key)), button("删除单位", "button danger", () => context.onDeleteUnit(entry.key)));
  parent.appendChild(actions);
}

function renderStage(parent, context, record) {
  const stats = getBattleStats(record, context.getIssueContext(record));
  const header = el("div", "battle-detail-header");
  const copy = el("div");
  copy.append(el("span", "battle-detail-eyebrow", "战斗编排"), el("h2", "", record.name || record.id || "未命名战斗"), el("code", "", record.id || "缺少 ID"));
  const badges = el("div", "battle-detail-badges");
  badges.append(el("span", "", `${stats.playerSlotCount + stats.allyCount} 友方`), el("span", "", `${stats.enemyCount} 敌方`));
  if (stats.errorCount) badges.appendChild(el("span", "error", `${stats.errorCount} 错误`));
  const actions = el("div", "battle-detail-actions");
  actions.append(button("复制战斗", "button ghost", context.onDuplicate), button("删除战斗", "button danger", context.onDelete));
  header.append(copy, badges, actions);
  parent.appendChild(header);
  const nav = el("div", "battle-tabs");
  for (const [id, label] of tabs) {
    const tab = button(label, "battle-tab", () => context.onTab(id));
    tab.classList.toggle("active", context.state.battleWorkspace.tab === id);
    nav.appendChild(tab);
  }
  parent.appendChild(nav);
  const body = el("div", "battle-stage-body");
  if (context.state.battleWorkspace.tab === "settings") renderSettings(body, context, record);
  else if (context.state.battleWorkspace.tab === "references") renderReferences(body, context, record);
  else if (context.state.battleWorkspace.tab === "advanced") renderAdvanced(body, context, record);
  else renderDeployment(body, context, record);
  parent.appendChild(body);
}

export function renderBattleWorkspace(container, context) {
  disposeEmbeddedCodeEditors(container);
  container.replaceChildren();
  const shell = el("div", "battle-workspace-shell");
  const catalog = el("aside", "battle-workspace-catalog");
  const stage = el("main", "battle-workspace-stage");
  const inspector = el("aside", "battle-workspace-inspector");
  shell.append(catalog, stage, inspector);
  container.appendChild(shell);
  renderBattleList(catalog, context);
  const record = context.state.records[context.state.selectedRecordIndex];
  if (!record) {
    empty(stage, "没有战斗", "创建第一场战斗后即可设置部署和背景。");
    empty(inspector, "没有可检查内容", "从左侧创建或选择战斗。");
    return;
  }
  renderStage(stage, context, record);
  renderInspector(inspector, context, record);
}
