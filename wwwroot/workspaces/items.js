import { bindImeSafeInput } from "../core/input-composition.js?v=20260711-core-17";
import {
  affixTypes,
  applyItemType,
  createAffix,
  createEffect,
  createRequirement,
  effectTypes,
  fromAffixDisplayValue,
  itemFilters,
  itemSlots,
  itemTypeLabel,
  itemTypes,
  isPercentAffixValue,
  matchesItemFilter,
  matchesItemSearch,
  moveArrayEntry,
  requirementTypes,
  statChoices,
  toAffixDisplayValue,
  weaponTypes,
} from "../domain/items.js?v=20260711-stage6-1";
import { createEmbeddedJsonEditor, disposeEmbeddedCodeEditors } from "../ui/code-editor.js?v=20260711-stage6-1";
import { bindScrollMemory } from "../ui/scroll-memory.js?v=20260711-scroll-1";
import { createReferencePicker, createReferenceSummary } from "../ui/reference-picker.js?v=20260711-core-17";

const tabs = Object.freeze([
  ["overview", "概览"],
  ["rules", "使用规则"],
  ["equipment", "装备效果"],
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
  if (options.step !== undefined) node.step = String(options.step);
  if (options.live) bindImeSafeInput(node, onChange);
  else node.addEventListener("change", () => onChange(options.type === "number" ? Number(node.value) || 0 : node.value));
  return node;
}

function select(value, choices, onChange) {
  const node = document.createElement("select");
  node.className = "input";
  for (const [choiceValue, label] of choices) {
    const option = document.createElement("option");
    option.value = choiceValue;
    option.textContent = label;
    option.selected = choiceValue === value;
    node.appendChild(option);
  }
  if (value && !choices.some(([choiceValue]) => choiceValue === value)) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = `${value}（未识别）`;
    option.selected = true;
    node.appendChild(option);
  }
  node.addEventListener("change", () => onChange(node.value));
  return node;
}

function textarea(value, onChange) {
  const node = document.createElement("textarea");
  node.className = "input item-description";
  node.rows = 4;
  node.value = value || "";
  node.addEventListener("change", () => onChange(node.value));
  return node;
}

function field(label, control, hint = "") {
  const wrapper = el("label", "item-field");
  wrapper.appendChild(el("span", "item-field-label", label));
  wrapper.appendChild(control);
  if (hint) wrapper.appendChild(el("small", "item-field-hint", hint));
  return wrapper;
}

function checkbox(label, checked, onChange) {
  const wrapper = el("label", "item-checkbox");
  const node = document.createElement("input");
  node.type = "checkbox";
  node.checked = Boolean(checked);
  node.addEventListener("change", () => onChange(node.checked));
  wrapper.append(node, el("span", "", label));
  return wrapper;
}

function reference(value, options, onSelect, placeholder) {
  return createReferencePicker({ value, options, onSelect, placeholder, compact: true, showSelected: false });
}

function section(title, description = "") {
  const node = el("section", "item-section");
  const heading = el("div", "item-section-heading");
  const copy = el("div");
  copy.appendChild(el("h3", "", title));
  if (description) copy.appendChild(el("p", "", description));
  heading.appendChild(copy);
  node.appendChild(heading);
  return { node, heading };
}

function renderEmpty(parent, title, detail) {
  const empty = el("div", "item-empty");
  empty.append(el("strong", "", title), el("p", "", detail));
  parent.appendChild(empty);
}

function renderList(parent, options) {
  const { state, getIssues, getPictureInfo, onCreate, onSelect, onSearch, onFilter } = options;
  const workspace = state.itemWorkspace;
  const header = el("div", "item-list-header");
  const copy = el("div");
  copy.append(el("strong", "", "物品列表"), el("small", "", `${state.formRecords.length} 条定义`));
  header.append(copy, button("＋ 新建", "button primary", onCreate));
  parent.appendChild(header);
  const search = input(workspace.search, onSearch, { type: "search", placeholder: "搜索 ID、名称、描述、图片…", live: true });
  search.classList.add("item-list-search");
  parent.append(search, select(workspace.filter, itemFilters, onFilter));

  const matches = state.formRecords.map((record, index) => {
    const issues = getIssues(record);
    const picture = getPictureInfo(record);
    return { record, index, issues, picture };
  }).filter(({ record, issues, picture }) => matchesItemSearch(record, workspace.search)
    && matchesItemFilter(record, workspace.filter, {
      issueCount: issues.length,
      pictureMissing: !picture?.resourceExists || !picture?.assetExists,
    }));
  parent.appendChild(el("div", "item-list-summary", `显示 ${matches.length} / ${state.formRecords.length}`));
  const list = el("div", "item-record-list");
  for (const entry of matches) {
    const card = button("", "item-record-card", () => onSelect(entry.index));
    card.classList.toggle("active", entry.index === state.selectedRecordIndex);
    const thumb = el("span", "item-record-thumb");
    if (entry.picture?.previewPath) {
      const image = document.createElement("img");
      image.src = `/api/assets/file?path=${encodeURIComponent(entry.picture.previewPath)}`;
      image.alt = entry.record.name || entry.record.id || "物品";
      image.loading = "lazy";
      thumb.appendChild(image);
    } else thumb.appendChild(el("span", "", "物"));
    const body = el("span", "item-record-copy");
    body.append(el("strong", "", entry.record.name || entry.record.id || `#${entry.index + 1}`), el("small", "", entry.record.id || "缺少 ID"));
    const meta = el("span", "item-record-meta");
    meta.appendChild(el("span", "item-type-badge", itemTypeLabel(entry.record.type)));
    if (entry.issues.length) meta.appendChild(el("span", "item-issue-badge", String(entry.issues.length)));
    card.append(thumb, body, meta);
    list.appendChild(card);
  }
  if (!matches.length) renderEmpty(list, "没有匹配的物品", "清除搜索词或切换筛选条件后再试。");
  parent.appendChild(list);
  bindScrollMemory(list, state.workspaceScrollPositions, "items:list");
}

function renderPictureCard(parent, context) {
  const { record, pictureInfo, mutate, onPickPicture, onUploadPicture } = context;
  const card = el("section", "item-picture-card");
  const preview = el("div", "item-picture-preview");
  if (pictureInfo?.previewPath) {
    const image = document.createElement("img");
    image.src = `/api/assets/file?path=${encodeURIComponent(pictureInfo.previewPath)}`;
    image.alt = record.name || record.id || "物品图片";
    preview.appendChild(image);
  } else preview.appendChild(el("span", "", "暂无图片"));
  const copy = el("div", "item-picture-copy");
  copy.append(el("strong", "", "物品图片"), el("code", "", record.picture || "未设置 picture"));
  const ok = Boolean(pictureInfo?.resourceExists && pictureInfo?.assetExists);
  copy.appendChild(el("small", ok ? "ok" : "bad", ok ? `已解析：${pictureInfo.assetPath}` : "资源或图片文件尚未解析"));
  const actions = el("div", "item-picture-actions");
  const upload = document.createElement("input");
  upload.type = "file";
  upload.accept = ".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp";
  upload.hidden = true;
  upload.addEventListener("change", () => {
    const file = upload.files?.[0];
    upload.value = "";
    if (file) onUploadPicture(file);
  });
  actions.append(button("选择图片", "button secondary", onPickPicture), button("上传图片", "button ghost", () => upload.click()));
  copy.append(actions, upload);
  card.append(preview, copy);
  parent.appendChild(card);

  const resource = section("资源绑定", "picture 保存资源 ID，实际文件由 resources.json 解析。");
  resource.node.appendChild(field("图片资源 ID", input(record.picture, (value) => mutate("picture", value)), "可直接输入，也可使用上方统一资源选择器。"));
  parent.appendChild(resource.node);
}

function renderIssues(parent, context) {
  const { issues, onOpenProblems } = context;
  const block = section(`当前问题 ${issues.length}`);
  block.heading.appendChild(button("打开问题中心", "button ghost", onOpenProblems));
  if (!issues.length) block.node.appendChild(el("p", "item-ok", "未发现物品专项问题。"));
  else {
    const list = el("ul", "item-issue-list");
    for (const issue of issues) list.appendChild(el("li", issue.severity === "warning" || issue.severity === "warn" ? "warning" : "bad", issue.message || issue.detail || String(issue)));
    block.node.appendChild(list);
  }
  parent.appendChild(block.node);
}

function renderOverview(parent, context) {
  const { record, mutate } = context;
  const top = el("div", "item-overview-grid");
  const media = el("div");
  renderPictureCard(media, context);
  top.appendChild(media);
  const quality = el("div");
  renderIssues(quality, context);
  top.appendChild(quality);
  parent.appendChild(top);
  const basic = section("基础信息");
  const fields = el("div", "item-fields-grid");
  fields.append(
    field("物品 ID", input(record.id, (value) => mutate("id", value)), "稳定引用 ID；修改前请查看引用。"),
    field("显示名称", input(record.name, (value) => mutate("name", value))),
    field("业务类型", select(record.type, itemTypes, (value) => context.changeType(value))),
    field("运行时分类", input(record.category, () => {}, { placeholder: "由类型自动维护" }), "由业务类型自动维护，不建议手动修改。"),
    field("等级", input(record.level, (value) => mutate("level", value), { type: "number", min: 0 })),
    field("价格", input(record.price, (value) => mutate("price", value), { type: "number" })),
    field("使用冷却", input(record.cooldown, (value) => mutate("cooldown", value), { type: "number", min: 0 })),
    field("掉落规则", checkbox("允许掉落", record.canDrop, (value) => mutate("canDrop", value))),
  );
  fields.children[3].querySelector("input").readOnly = true;
  basic.node.appendChild(fields);
  basic.node.appendChild(field("描述", textarea(record.description, (value) => mutate("description", value))));
  parent.appendChild(basic.node);
}

function nestedCard(title, subtitle, index, count, onMove, onCopy, onDelete) {
  const card = el("article", "item-nested-card");
  const header = el("div", "item-nested-header");
  const copy = el("div");
  copy.append(el("strong", "", title), el("small", "", subtitle));
  const actions = el("div", "item-nested-actions");
  const up = button("↑", "icon-button compact", () => onMove(-1), "上移");
  const down = button("↓", "icon-button compact", () => onMove(1), "下移");
  up.disabled = index === 0;
  down.disabled = index === count - 1;
  actions.append(up, down, button("复制", "button ghost compact", onCopy), button("删除", "button danger compact", onDelete));
  header.append(copy, actions);
  card.appendChild(header);
  return card;
}

function renderRequirements(parent, context) {
  const values = Array.isArray(context.record.requirements) ? context.record.requirements : [];
  const block = section("使用要求", "所有要求同时满足时，物品才可使用。");
  block.heading.appendChild(button("＋ 添加要求", "button secondary", () => context.replaceArray("requirements", [...values, createRequirement()] )));
  const list = el("div", "item-nested-list");
  values.forEach((value, index) => {
    const card = nestedCard(requirementTypes.find(([id]) => id === value.type)?.[1] || value.type, `要求 ${index + 1}`, index, values.length,
      (direction) => context.replaceArray("requirements", moveArrayEntry(values, index, direction)),
      () => context.replaceArray("requirements", [...values.slice(0, index + 1), structuredClone(value), ...values.slice(index + 1)]),
      () => context.replaceArray("requirements", values.filter((_, candidate) => candidate !== index)));
    const fields = el("div", "item-nested-fields");
    fields.appendChild(field("类型", select(value.type, requirementTypes, (type) => context.replaceNested("requirements", index, createRequirement(type)))));
    if (value.type === "talent") {
      fields.appendChild(field("天赋", reference(value.talentId, context.references.talents, (talentId) => context.patchNested("requirements", index, { talentId }), "搜索天赋名称或 ID")));
    } else {
      fields.append(field("属性", select(value.statId, statChoices, (statId) => context.patchNested("requirements", index, { statId }))),
        field("最低值", input(value.value, (minimum) => context.patchNested("requirements", index, { value: minimum }), { type: "number" })));
    }
    card.appendChild(fields);
    list.appendChild(card);
  });
  if (!values.length) renderEmpty(list, "没有使用要求", "当前物品不限制角色属性或天赋。" );
  block.node.appendChild(list);
  parent.appendChild(block.node);
}

function effectReferenceOptions(type, references) {
  if (type === "external_skill") return references.externalSkills;
  if (type === "internal_skill") return references.internalSkills;
  if (type === "special_skill") return references.specialSkills;
  if (type === "grant_talent") return references.talents;
  if (type === "add_buff") return references.buffs;
  return [];
}

function renderEffects(parent, context) {
  const values = Array.isArray(context.record.useEffects) ? context.record.useEffects : [];
  const block = section("使用效果", "效果按数组顺序执行；类型变化时生成该类型的安全默认结构。");
  block.heading.appendChild(button("＋ 添加效果", "button secondary", () => context.replaceArray("useEffects", [...values, createEffect()] )));
  const list = el("div", "item-nested-list");
  values.forEach((value, index) => {
    const label = effectTypes.find(([id]) => id === value.type)?.[1] || value.type;
    const card = nestedCard(label, `效果 ${index + 1}`, index, values.length,
      (direction) => context.replaceArray("useEffects", moveArrayEntry(values, index, direction)),
      () => context.replaceArray("useEffects", [...values.slice(0, index + 1), structuredClone(value), ...values.slice(index + 1)]),
      () => context.replaceArray("useEffects", values.filter((_, candidate) => candidate !== index)));
    const fields = el("div", "item-nested-fields");
    fields.appendChild(field("类型", select(value.type, effectTypes, (type) => context.replaceNested("useEffects", index, createEffect(type)))));
    const referenceOptions = effectReferenceOptions(value.type, context.references);
    if (referenceOptions.length || ["external_skill", "internal_skill", "special_skill", "grant_talent", "add_buff"].includes(value.type)) {
      const key = value.type === "grant_talent" ? "talentId" : value.type === "add_buff" ? "buffId" : "skillId";
      fields.appendChild(field(key === "talentId" ? "天赋" : key === "buffId" ? "Buff" : "武学", reference(value[key], referenceOptions, (id) => context.patchNested("useEffects", index, { [key]: id }), "搜索名称或 ID")));
    }
    if (["external_skill", "internal_skill", "add_buff"].includes(value.type)) fields.appendChild(field("等级", input(value.level, (level) => context.patchNested("useEffects", index, { level }), { type: "number", min: 0 })));
    if (value.type === "add_buff") fields.appendChild(field("持续回合", input(value.duration, (duration) => context.patchNested("useEffects", index, { duration }), { type: "number", min: 0 })));
    else if (value.type === "detoxify") {
      fields.append(field("最小值", input(value.values?.[0], (minimum) => context.patchNested("useEffects", index, { values: [minimum, value.values?.[1] ?? minimum] }), { type: "number" })),
        field("最大值", input(value.values?.[1], (maximum) => context.patchNested("useEffects", index, { values: [value.values?.[0] ?? maximum, maximum] }), { type: "number" })));
    } else if (!["external_skill", "internal_skill", "special_skill", "grant_talent"].includes(value.type)) {
      fields.appendChild(field("数值", input(value.value, (amount) => context.patchNested("useEffects", index, { value: amount }), { type: "number" })));
    }
    card.appendChild(fields);
    list.appendChild(card);
  });
  if (!values.length) renderEmpty(list, "没有使用效果", "剧情物品或功能物品可以没有直接使用效果。" );
  block.node.appendChild(list);
  parent.appendChild(block.node);
}

function renderRules(parent, context) {
  renderRequirements(parent, context);
  renderEffects(parent, context);
}

const modifierOps = Object.freeze([
  ["add", "直接增加"], ["increase", "按前段结果提高"], ["more", "最终倍率"],
  ["post_add", "最终增加"], ["override", "直接设为"],
]);

function choiceLabel(choices, value) {
  return choices.find(([id]) => id === value)?.[1] || value || "未设置";
}

function formatAffixNumber(value) {
  return Number(value.toFixed(4)).toLocaleString("zh-CN", { maximumFractionDigits: 4 });
}

function affixSummary(affix) {
  if (affix.type === "grant_talent") return `获得天赋 · ${affix.talentId || "未选择"}`;
  if (affix.type === "grant_model") return `战斗外观 · ${affix.modelId || "未设置"}`;
  const amount = toAffixDisplayValue(affix);
  const unit = isPercentAffixValue(affix) ? "%" : "";
  const operation = affix.value?.op || "add";
  const prefix = operation === "override" ? "设为 " : operation === "more" ? "×" : amount >= 0 ? "+" : "";
  if (affix.type === "stat_modifier") return `${choiceLabel(statChoices, affix.stat)} ${prefix}${formatAffixNumber(amount)}${unit}`;
  if (affix.type === "weapon_bonus_modifier") return `${choiceLabel(weaponTypes, affix.weaponType)}武学 ${prefix}${formatAffixNumber(amount)}${unit}`;
  if (affix.type === "legend_skill_chance_modifier") return `${affix.skillId || "未选择武学"} · 奥义率 ${prefix}${formatAffixNumber(amount)}${unit}`;
  if (affix.type === "skill_bonus_modifier") return `${affix.skillId || "未选择武学"} · 威力 ${prefix}${formatAffixNumber(amount)}${unit}`;
  return choiceLabel(affixTypes, affix.type);
}

function affixValueControl(affix, onChange) {
  const percent = isPercentAffixValue(affix);
  const wrapper = el("div", "item-value-control");
  wrapper.appendChild(input(toAffixDisplayValue(affix), (displayValue) => onChange(fromAffixDisplayValue(affix, displayValue)), {
    type: "number",
    step: percent ? 0.1 : 1,
  }));
  if (percent) wrapper.appendChild(el("span", "item-value-unit", "%"));
  return wrapper;
}

function affixValueLabel(affix) {
  if (affix.value?.op === "more") return "倍率";
  if (affix.value?.op === "override") return "设定值";
  return isPercentAffixValue(affix) ? "加成比例" : "加成数值";
}

function modifierHelp(affix) {
  const op = affix.value?.op || "add";
  const displayValue = formatAffixNumber(toAffixDisplayValue(affix));
  if (op === "increase") {
    return {
      title: "按前段结果提高",
      detail: `在“基础值 + 直接增加”之后按比例提高。输入 ${displayValue}% 时，JSON 保存 ${(Number(affix.value?.delta) || 0)}。例如前段结果为 120，提高 25% 后得到 150。`,
    };
  }
  if (op === "more") {
    return {
      title: "最终倍率",
      detail: `把前段结果乘以 ${displayValue}。例如前段结果为 150，倍率 1.2 后得到 180。这里输入 1.2，不是输入 20%。多个倍率会继续相乘。`,
    };
  }
  if (op === "post_add") {
    return {
      title: "最终增加",
      detail: `完成比例提高和最终倍率后，再增加 ${displayValue}。例如前段计算得到 180，最终增加 20，结果为 200。`,
    };
  }
  if (op === "override") {
    return {
      title: "直接设为",
      detail: `结果直接设为 ${displayValue}${isPercentAffixValue(affix) ? "%" : ""}，忽略直接增加、比例提高、最终倍率和最终增加。`,
    };
  }
  return isPercentAffixValue(affix)
    ? {
      title: "直接增加",
      detail: `直接增加 ${displayValue} 个百分点，并参与后续比例和倍率计算。界面显示 ${displayValue}%，JSON 保存 ${(Number(affix.value?.delta) || 0)}。`,
    }
    : {
      title: "直接增加",
      detail: `先加到基础值上，并参与后续比例和倍率计算。例如基础值为 100，直接增加 ${displayValue} 后，前段结果为 ${formatAffixNumber(100 + (Number(affix.value?.delta) || 0))}。`,
    };
}

function renderAffixes(parent, context) {
  const { record } = context;
  if (record.type !== "equipment") {
    renderEmpty(parent, "当前不是装备", "把业务类型切换为“装备”后，可以配置装备槽位和穿戴效果。旧效果字段不会被自动删除。" );
    return;
  }
  const summary = section("装备类型");
  summary.node.classList.add("equipment-type-section");
  summary.node.appendChild(field("穿戴位置", select(record.slotType, itemSlots, (slotType) => context.mutate("slotType", slotType))));
  parent.appendChild(summary.node);
  const values = Array.isArray(record.affixes) ? record.affixes : [];
  const block = section("装备效果", "角色穿戴后获得以下加成与能力。");
  block.node.classList.add("equipment-effects-section");
  block.heading.appendChild(button("＋ 添加效果", "button secondary", () => context.replaceArray("affixes", [...values, createAffix()] )));
  const list = el("div", "item-nested-list equipment-effect-list");
  values.forEach((value, index) => {
    const label = choiceLabel(affixTypes, value.type);
    const card = nestedCard(affixSummary(value), label, index, values.length,
      (direction) => context.replaceArray("affixes", moveArrayEntry(values, index, direction)),
      () => context.replaceArray("affixes", [...values.slice(0, index + 1), structuredClone(value), ...values.slice(index + 1)]),
      () => context.replaceArray("affixes", values.filter((_, candidate) => candidate !== index)));
    card.classList.add("equipment-effect-row");
    const fields = el("div", "equipment-effect-fields");
    if (value.type === "grant_talent") {
      fields.appendChild(field("获得天赋", reference(value.talentId, context.references.talents, (talentId) => context.patchNested("affixes", index, { talentId }), "搜索天赋")));
    } else if (value.type === "grant_model") {
      fields.append(field("战斗模型", input(value.modelId, (modelId) => context.patchNested("affixes", index, { modelId }))),
        field("显示说明", input(value.description, (description) => context.patchNested("affixes", index, { description }))));
    } else {
      if (value.type === "stat_modifier") fields.appendChild(field("加成属性", select(value.stat, statChoices, (stat) => context.patchNested("affixes", index, { stat }))));
      else if (value.type === "weapon_bonus_modifier") fields.appendChild(field("武学类别", select(value.weaponType, weaponTypes, (weaponType) => context.patchNested("affixes", index, { weaponType }))));
      else fields.appendChild(field("指定武学", reference(value.skillId, context.references.allSkills, (skillId) => context.patchNested("affixes", index, { skillId }), "搜索武学")));
      fields.appendChild(field(affixValueLabel(value), affixValueControl(value, (delta) => context.patchNested("affixes", index, { value: { ...(value.value || {}), delta } }))));
    }
    card.appendChild(fields);

    const advanced = el("details", "equipment-effect-advanced");
    advanced.appendChild(el("summary", "", "高级计算设置"));
    const advancedFields = el("div", "equipment-effect-advanced-fields");
    const hasCalculation = !["grant_talent", "grant_model"].includes(value.type);
    if (hasCalculation) {
      const formula = el("div", "equipment-calculation-formula");
      formula.append(el("strong", "", "常规计算顺序"), el("code", "", "(基础值 + 直接增加) × (1 + 比例提高) × 最终倍率 + 最终增加"));
      advancedFields.appendChild(formula);
    }
    advancedFields.appendChild(field("效果类型", select(value.type, affixTypes, (type) => context.replaceNested("affixes", index, createAffix(type))), "对应 JSON 的 type。切换类型会重置这一项。"));
    if (hasCalculation) {
      advancedFields.appendChild(field("计算方式", select(value.value?.op || "add", modifierOps, (op) => context.patchNested("affixes", index, { value: { ...(value.value || {}), op } }))));
      const help = modifierHelp(value);
      const helpBox = el("div", "equipment-calculation-help");
      helpBox.append(el("strong", "", help.title), el("p", "", help.detail));
      advancedFields.appendChild(helpBox);
    }
    if (value.type === "grant_model") advancedFields.appendChild(field("显示优先级", input(value.priority, (priority) => context.patchNested("affixes", index, { priority }), { type: "number" })));
    advanced.appendChild(advancedFields);
    card.appendChild(advanced);
    list.appendChild(card);
  });
  if (!values.length) renderEmpty(list, "没有装备效果", "当前装备只占用穿戴位置，不提供额外加成。" );
  block.node.appendChild(list);
  parent.appendChild(block.node);
}

function collectOutgoing(record, options) {
  const result = [];
  const add = (kind, id, choices, fieldPath) => {
    if (!id) return;
    result.push({ kind, id, option: choices.find((choice) => choice.id === id), fieldPath });
  };
  (record.requirements || []).forEach((entry, index) => {
    if (entry.type === "talent") add("天赋要求", entry.talentId, options.talents, `requirements[${index}].talentId`);
  });
  (record.useEffects || []).forEach((entry, index) => {
    if (entry.type === "grant_talent") add("获得天赋", entry.talentId, options.talents, `useEffects[${index}].talentId`);
    else if (entry.type === "add_buff") add("添加 Buff", entry.buffId, options.buffs, `useEffects[${index}].buffId`);
    else if (entry.skillId) add("学习武学", entry.skillId, options.allSkills, `useEffects[${index}].skillId`);
  });
  (record.affixes || []).forEach((entry, index) => {
    if (entry.type === "grant_talent") add("赋予天赋", entry.talentId, options.talents, `affixes[${index}].talentId`);
    else if (entry.skillId) add("武学修正", entry.skillId, options.allSkills, `affixes[${index}].skillId`);
  });
  return result;
}

function renderReferences(parent, context) {
  const outgoing = collectOutgoing(context.record, context.references);
  const out = section(`引用的内容 ${outgoing.length}`, "当前物品主动引用的天赋、武学和 Buff。");
  const outList = el("div", "item-reference-list");
  outgoing.forEach((entry) => {
    const row = el("div", "item-reference-row");
    row.append(el("small", "", `${entry.kind} · ${entry.fieldPath}`), createReferenceSummary(entry.option, entry.id));
    outList.appendChild(row);
  });
  if (!outgoing.length) renderEmpty(outList, "没有内容引用", "当前物品没有引用天赋、武学或 Buff。" );
  out.node.appendChild(outList);
  parent.appendChild(out.node);

  const incoming = context.getReferences(context.record);
  const into = section(`引用此物品 ${incoming.length}`, "按物品 ID 与名称进行静态字符串扫描，动态脚本引用无法覆盖。");
  const inList = el("div", "item-reference-list");
  incoming.forEach((entry) => {
    const row = el("div", "item-reference-row");
    row.append(el("strong", "", entry.path), el("code", "", entry.fieldPath || "$"), el("small", "", `匹配值：${entry.value}`));
    inList.appendChild(row);
  });
  if (!incoming.length) renderEmpty(inList, "未找到静态引用", "这不代表物品一定可以安全删除。" );
  into.node.appendChild(inList);
  parent.appendChild(into.node);
}

function renderAdvanced(parent, context) {
  const notice = el("div", "item-advanced-notice");
  notice.append(el("strong", "", "高级 JSON 与表单编辑同一条内存记录"), el("p", "", "未识别字段会保留。应用后仍需点击顶部“保存”写入 items.json。"),
    button("在高级数据中打开 items.json", "button ghost", context.onOpenAdvancedData));
  parent.appendChild(notice);
  parent.appendChild(createEmbeddedJsonEditor({
    value: context.record,
    modelPath: `items/${context.record.id || "record"}`,
    validate: (value) => {
      if (!value || Array.isArray(value) || typeof value !== "object") throw new Error("物品 JSON 必须是对象");
    },
    onApply: context.replaceRecord,
  }));
}

function structuredClone(value) {
  return typeof globalThis.structuredClone === "function"
    ? globalThis.structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function renderDetail(parent, options) {
  const { state, getIssues, getPictureInfo, onMutate, onReplaceRecord, onDuplicate, onDelete, onTab } = options;
  const record = state.formRecords[state.selectedRecordIndex];
  if (!record) {
    renderEmpty(parent, "没有可编辑的物品", "点击左侧“新建”创建第一条物品定义。" );
    return;
  }
  const header = el("div", "item-detail-header");
  const copy = el("div");
  copy.append(el("span", "item-detail-eyebrow", itemTypeLabel(record.type)), el("h2", "", record.name || record.id || "未命名物品"), el("code", "", record.id || "缺少 ID"));
  const actions = el("div", "item-detail-actions");
  actions.append(button("复制", "button ghost", onDuplicate), button("删除", "button danger", onDelete));
  header.append(copy, actions);
  parent.appendChild(header);
  const nav = el("div", "item-tabs");
  for (const [id, label] of tabs) {
    const tab = button(label, "item-tab", () => onTab(id));
    tab.classList.toggle("active", state.itemWorkspace.tab === id);
    if (id === "equipment" && record.type !== "equipment") tab.classList.add("muted");
    nav.appendChild(tab);
  }
  parent.appendChild(nav);

  const body = el("div", "item-detail-body");
  const context = {
    ...options,
    record,
    issues: getIssues(record),
    pictureInfo: getPictureInfo(record),
    mutate: (key, value) => onMutate(record, key, value),
    changeType: (type) => {
      applyItemType(record, type);
      onMutate(record, "category", record.category);
    },
    replaceRecord: onReplaceRecord,
    replaceArray: (key, values) => onMutate(record, key, values),
    replaceNested: (key, index, value) => onMutate(record, key, (record[key] || []).map((entry, candidate) => candidate === index ? value : entry)),
    patchNested: (key, index, patch) => onMutate(record, key, (record[key] || []).map((entry, candidate) => candidate === index ? { ...entry, ...patch } : entry)),
  };
  if (state.itemWorkspace.tab === "rules") renderRules(body, context);
  else if (state.itemWorkspace.tab === "equipment") renderAffixes(body, context);
  else if (state.itemWorkspace.tab === "references") renderReferences(body, context);
  else if (state.itemWorkspace.tab === "advanced") renderAdvanced(body, context);
  else renderOverview(body, context);
  parent.appendChild(body);
}

export function renderItemWorkspace(container, options) {
  disposeEmbeddedCodeEditors(container);
  container.replaceChildren();
  const shell = el("div", "item-workspace-shell");
  const list = el("aside", "item-workspace-list");
  const detail = el("main", "item-workspace-detail");
  shell.append(list, detail);
  container.appendChild(shell);
  renderList(list, options);
  renderDetail(detail, options);
}
