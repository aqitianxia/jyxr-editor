import { bindImeSafeInput } from "../core/input-composition.js?v=20260712-search-1";
import {
  createShopReward,
  createShopProductInfo,
  getShopProductPriceMode,
  getShopStats,
  matchesShopFilter,
  matchesShopSearch,
  shopFilters,
  shopRewardTypes,
  shopSkillKinds,
} from "../domain/shops.js?v=20260727-shop-rewards-1";
import { createEmbeddedJsonEditor, disposeEmbeddedCodeEditors } from "../ui/code-editor.js?v=20260711-stage6-1";
import { createReferencePicker, createReferenceSummary } from "../ui/reference-picker.js?v=20260711-core-17";
import { bindScrollMemory } from "../ui/scroll-memory.js?v=20260712-search-1";

const tabs = Object.freeze([
  ["products", "商品"],
  ["settings", "商店设置"],
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
  if (options.live) bindImeSafeInput(node, onChange);
  else node.addEventListener("change", () => onChange(options.type === "number" ? Math.max(Number(options.min) || 0, Number(node.value) || 0) : node.value));
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
  node.addEventListener("change", () => onChange(node.value));
  return node;
}

function field(label, control, hint = "") {
  const wrapper = el("label", "shop-field");
  wrapper.append(el("span", "shop-field-label", label), control);
  if (hint) wrapper.appendChild(el("small", "shop-field-hint", hint));
  return wrapper;
}

function empty(parent, title, detail) {
  const node = el("div", "shop-empty");
  node.append(el("strong", "", title), el("p", "", detail));
  parent.appendChild(node);
}

function renderShopList(parent, context) {
  const { state, catalog, onCreate, onSelectShop, onSearch, onFilter } = context;
  const workspace = state.shopWorkspace;
  const header = el("div", "shop-column-header");
  const title = el("div");
  title.append(el("strong", "", "商店"), el("small", "", `${state.records.length} 条定义`));
  header.append(title, button("＋ 新建", "button primary", onCreate));
  parent.append(header,
    input(workspace.search, onSearch, { type: "search", placeholder: "搜索名称、ID 或资源…", live: true }),
    select(workspace.filter, shopFilters, onFilter));

  const matches = state.records.map((record, index) => ({ record, index, stats: getShopStats(record, catalog) }))
    .filter(({ record }) => matchesShopSearch(record, workspace.search) && matchesShopFilter(record, workspace.filter, catalog));
  parent.appendChild(el("div", "shop-list-summary", `显示 ${matches.length} / ${state.records.length}`));
  const list = el("div", "shop-record-list");
  for (const { record, index, stats } of matches) {
    const row = button("", "shop-record-row", () => onSelectShop(index));
    row.classList.toggle("active", index === state.selectedRecordIndex);
    const copy = el("span", "shop-record-copy");
    copy.append(el("strong", "", record.name || record.id || `商店 ${index + 1}`), el("code", "", record.id || "缺少 ID"));
    const meta = el("span", "shop-record-meta");
    meta.appendChild(el("span", "", `${stats.productCount} 件`));
    if (stats.issueCount) meta.appendChild(el("span", "shop-warning-count", String(stats.issueCount)));
    row.append(copy, meta);
    list.appendChild(row);
  }
  if (!matches.length) empty(list, "没有匹配的商店", "清除搜索词或切换筛选条件后再试。");
  parent.appendChild(list);
  bindScrollMemory(list, state.workspaceScrollPositions, "shops:list");
}

function productPriceText(product, info) {
  if (info.priceMode === "premium") return `${product.premiumPrice ?? 0} 元宝`;
  if (info.priceMode === "silver") return `${product.price ?? 0} 银两`;
  if (info.priceMode === "mixed") return `${product.price ?? 0} 银两 + ${product.premiumPrice ?? 0} 元宝`;
  return info.effectiveSilverPrice === null ? "继承基础价（物品缺失）" : `基础价 ${info.effectiveSilverPrice} 银两`;
}

function renderProductList(parent, context, record) {
  const { state, catalog, rewardOptions, onAddProduct, onSelectProduct } = context;
  const products = record.products || [];
  const header = el("div", "shop-column-header");
  const title = el("div");
  title.append(el("strong", "", "商品清单"), el("small", "", `${products.length} 件商品`));
  header.append(title, button("＋ 添加", "button primary", onAddProduct));
  parent.appendChild(header);
  if (!products.length) {
    empty(parent, "暂无商品", "添加商品后可设置价格、限购数量和陈列顺序。");
    return;
  }
  const itemOptionsById = new Map(rewardOptions.items.map((option) => [option.id, option]));
  const list = el("div", "shop-product-list");
  products.forEach((product, index) => {
    const info = createShopProductInfo(product, catalog);
    const option = info.kind === "item" ? itemOptionsById.get(info.referenceId) : null;
    const row = button("", "shop-product-row", () => onSelectProduct(index));
    row.classList.toggle("active", index === state.shopWorkspace.selectedProductIndex);
    const icon = el("span", "shop-product-icon");
    if (option?.iconPath) {
      const image = document.createElement("img");
      image.src = `/api/assets/file?path=${encodeURIComponent(option.iconPath)}`;
      image.alt = option.name || option.id;
      image.loading = "lazy";
      icon.appendChild(image);
    } else icon.appendChild(el("span", "", info.kind === "skill_max_level" ? "武" : info.kind === "yuanbao" ? "元" : "物"));
    const copy = el("span", "shop-product-copy");
    copy.append(el("strong", "", option?.name || info.displayName), el("small", "", productPriceText(product, info)));
    const meta = el("span", "shop-product-meta");
    if (info.purchaseLimited) meta.appendChild(el("span", "shop-limit-badge", `限 ${product.purchaseLimit}`));
    if (info.kind !== "item") meta.appendChild(el("span", "shop-ignored-badge", info.kindLabel));
    if (info.issues.length) meta.appendChild(el("span", "shop-warning-count", String(info.issues.length)));
    row.append(icon, copy, meta);
    list.appendChild(row);
  });
  parent.appendChild(list);
  bindScrollMemory(list, state.workspaceScrollPositions, `shops:products:${record.id || state.selectedRecordIndex}`);
}

function segmented(value, choices, onChange) {
  const group = el("div", "shop-segmented");
  for (const [choiceValue, label] of choices) {
    const item = button(label, "", () => onChange(choiceValue));
    item.classList.toggle("active", choiceValue === value);
    group.appendChild(item);
  }
  return group;
}

function renderProductEditor(parent, context, record) {
  const { state, catalog, rewardOptions, onPatchProduct, onMoveProduct, onDuplicateProduct, onDeleteProduct } = context;
  const index = state.shopWorkspace.selectedProductIndex;
  const product = record.products?.[index];
  if (!product) {
    empty(parent, "请选择商品", "从中间列表选择商品，或添加第一件商品。");
    return;
  }
  const info = createShopProductInfo(product, catalog);
  const reward = info.reward || {};
  const referenceOptions = info.kind === "item"
    ? rewardOptions.items
    : reward.skillKind === "internal" ? rewardOptions.internalSkills : rewardOptions.externalSkills;
  const option = referenceOptions.find((candidate) => candidate.id === info.referenceId);
  const summary = el("div", "shop-product-summary");
  if (info.kind === "yuanbao") summary.appendChild(el("div", "shop-callout", `出售内容：${info.displayName}`));
  else summary.appendChild(createReferenceSummary(option, info.referenceId));
  if (info.issues.length) {
    const issues = el("ul", "shop-issue-list");
    info.issues.forEach((issue) => issues.appendChild(el("li", "", issue)));
    summary.appendChild(issues);
  }
  parent.appendChild(summary);

  const section = el("section", "shop-editor-section");
  section.appendChild(el("h3", "", "出售内容"));
  section.appendChild(field("奖励类型", select(info.kind, shopRewardTypes, (kind) => {
    const pricing = kind === "yuanbao"
      ? { price: 0, premiumPrice: null }
      : kind === "skill_max_level" ? { price: null, premiumPrice: 0 } : { price: null, premiumPrice: null };
    onPatchProduct(index, { reward: createShopReward(kind), ...pricing });
  })));
  if (info.kind === "item") {
    section.appendChild(field("物品", createReferencePicker({
      value: reward.itemId,
      options: rewardOptions.items,
      compact: true,
      showSelected: false,
      placeholder: "输入物品名称或 ID",
      onSelect: (itemId) => onPatchProduct(index, { reward: { ...reward, itemId } }),
    }), "保存的是 items.json 中的稳定 ID。"));
    section.appendChild(field("数量", input(reward.quantity ?? 1, (quantity) => onPatchProduct(index, { reward: { ...reward, quantity } }), { type: "number", min: 1 })));
  } else if (info.kind === "skill_max_level") {
    section.appendChild(field("武学类型", select(reward.skillKind, shopSkillKinds, (skillKind) => onPatchProduct(index, {
      reward: { ...reward, skillKind, skillId: "" },
    }))));
    section.appendChild(field("武学", createReferencePicker({
      value: reward.skillId,
      options: referenceOptions,
      compact: true,
      showSelected: false,
      placeholder: "输入武学名称或 ID",
      onSelect: (skillId) => onPatchProduct(index, { reward: { ...reward, skillId } }),
    }), `保存的是 ${reward.skillKind === "internal" ? "internal-skills.json" : "external-skills.json"} 中的稳定 ID。`));
    section.appendChild(field("提升等级", input(reward.levels ?? 1, (levels) => onPatchProduct(index, { reward: { ...reward, levels } }), { type: "number", min: 1 })));
  } else if (info.kind === "yuanbao") {
    section.appendChild(field("元宝数量", input(reward.amount ?? 1, (amount) => onPatchProduct(index, { reward: { ...reward, amount } }), { type: "number", min: 1 }), "元宝奖励只能使用银两购买。"));
  }
  parent.appendChild(section);

  const pricing = el("section", "shop-editor-section");
  pricing.append(el("h3", "", "售价"), el("p", "shop-section-note", "同一件商品通常只使用一种货币；继承基础价时不写商店价格。"));
  const mode = getShopProductPriceMode(product);
  const choices = info.kind === "item"
    ? [["base", "使用物品基础价"], ["silver", "银两定价"], ["premium", "元宝定价"]]
    : info.kind === "yuanbao" ? [["silver", "银两定价"]] : [["silver", "银两定价"], ["premium", "元宝定价"]];
  if (mode === "mixed") choices.push(["mixed", "双价（需处理）"]);
  pricing.appendChild(segmented(mode, choices, (next) => {
    if (next === "base") onPatchProduct(index, { price: null, premiumPrice: null });
    else if (next === "silver") onPatchProduct(index, { price: product.price ?? info.effectiveSilverPrice ?? 0, premiumPrice: null });
    else if (next === "premium") onPatchProduct(index, { price: null, premiumPrice: product.premiumPrice ?? 0 });
  }));
  const priceFields = el("div", "shop-fields-grid");
  if (mode === "base" && info.kind === "item") priceFields.appendChild(field("当前物品基础价", input(info.effectiveSilverPrice ?? "", () => {}), "来自 items.json；这里只读。"));
  if (mode === "silver" || mode === "mixed") priceFields.appendChild(field("银两价格", input(product.price ?? 0, (value) => onPatchProduct(index, { price: value }), { type: "number", min: 0 })));
  if (mode === "premium" || mode === "mixed") priceFields.appendChild(field("元宝价格", input(product.premiumPrice ?? 0, (value) => onPatchProduct(index, { premiumPrice: value }), { type: "number", min: 0 })));
  const readOnly = priceFields.querySelector("input");
  if (mode === "base" && info.kind === "item" && readOnly) readOnly.readOnly = true;
  pricing.appendChild(priceFields);
  parent.appendChild(pricing);

  const limit = el("section", "shop-editor-section");
  limit.append(el("h3", "", "购买次数"), el("p", "shop-section-note", "不限购会保存为 null；限购 0 表示已经没有可购买次数。"));
  limit.appendChild(segmented(info.purchaseLimited ? "limited" : "unlimited", [["unlimited", "不限购"], ["limited", "限购"]], (next) => {
    onPatchProduct(index, { purchaseLimit: next === "limited" ? product.purchaseLimit ?? 1 : null });
  }));
  if (info.purchaseLimited) limit.appendChild(field("每个存档可购买", input(product.purchaseLimit ?? 0, (value) => onPatchProduct(index, { purchaseLimit: value }), { type: "number", min: 0 }), "购买记录会进入存档。"));
  parent.appendChild(limit);

  const actions = el("div", "shop-product-actions");
  const up = button("↑", "icon-button", () => onMoveProduct(index, -1), "上移商品");
  const down = button("↓", "icon-button", () => onMoveProduct(index, 1), "下移商品");
  up.disabled = index === 0;
  down.disabled = index === record.products.length - 1;
  actions.append(up, down, button("复制商品", "button ghost", () => onDuplicateProduct(index)), button("删除商品", "button danger", () => onDeleteProduct(index)));
  parent.appendChild(actions);
}

function renderResourceField(parent, context, record, key, label, description) {
  const info = context.getResourceInfo(record, key);
  const row = el("div", "shop-resource-row");
  const preview = el("div", `shop-resource-media ${key}`);
  if (info.previewPath && key === "background") {
    const image = document.createElement("img");
    image.src = `/api/assets/file?path=${encodeURIComponent(info.previewPath)}`;
    image.alt = label;
    preview.appendChild(image);
  } else preview.appendChild(el("span", "", key === "music" ? "♪" : "景"));
  const body = el("div", "shop-resource-body");
  body.append(el("strong", "", label), el("small", "", description), el("code", "", record[key] || "未设置"));
  const status = el("span", `shop-resource-status ${info.status}`, info.message);
  const actions = el("div", "shop-resource-actions");
  actions.append(button("选择资源", "button secondary", () => context.onPickResource(key, info.previewPath)));
  if (record[key]) actions.appendChild(button("清空", "button ghost", () => context.onMutateShop(key, null)));
  body.append(status, actions);
  row.append(preview, body);
  parent.appendChild(row);
}

function renderSettings(parent, context, record) {
  const basics = el("section", "shop-editor-section");
  basics.appendChild(el("h3", "", "基础信息"));
  const grid = el("div", "shop-fields-grid");
  grid.append(field("商店 ID", input(record.id, (value) => context.onMutateShop("id", value)), "地图和剧情引用使用这个稳定 ID。"), field("显示名称", input(record.name, (value) => context.onMutateShop("name", value))));
  basics.appendChild(grid);
  parent.appendChild(basics);
  const resources = el("section", "shop-editor-section");
  resources.append(el("h3", "", "环境资源"), el("p", "shop-section-note", "通过统一资源选择器绑定 resources.json，未注册的资产可在选择器内注册。"));
  renderResourceField(resources, context, record, "background", "商店背景", "进入商店时使用的场景图片");
  renderResourceField(resources, context, record, "music", "商店音乐", "商店界面播放的背景音乐");
  parent.appendChild(resources);
}

function renderReferences(parent, context, record) {
  const references = context.getReferences(record);
  const section = el("section", "shop-editor-section");
  section.append(el("h3", "", `静态引用 ${references.length}`), el("p", "shop-section-note", "这里列出地图、剧情和其他 JSON 中可静态识别的商店 ID 引用。"));
  if (!references.length) empty(section, "未找到静态引用", "动态脚本或运行时拼接的引用不会出现在这里。");
  else {
    const list = el("div", "shop-reference-list");
    references.forEach((reference) => {
      const row = el("div", "shop-reference-row");
      row.append(el("strong", "", reference.path), el("code", "", reference.fieldPath), el("small", "", reference.value || record.id));
      list.appendChild(row);
    });
    section.appendChild(list);
  }
  parent.appendChild(section);
}

function renderAdvanced(parent, context, record) {
  const section = el("section", "shop-editor-section shop-advanced-json");
  section.append(el("h3", "", "商店 JSON"), el("p", "shop-section-note", "用于编辑结构化控件尚未覆盖的字段。应用时会整体替换当前商店，但不会主动删除未知字段。"));
  section.appendChild(createEmbeddedJsonEditor({
    value: record,
    modelPath: `shops/${record.id || "record"}`,
    validate: (value) => {
      if (!value || Array.isArray(value) || typeof value !== "object") throw new Error("商店 JSON 必须是对象");
      if (!Array.isArray(value.products)) throw new Error("products 必须是数组");
    },
    onApply: context.onReplaceShop,
  }));
  parent.appendChild(section);
}

function renderDetail(parent, context, record) {
  const { state } = context;
  const header = el("div", "shop-detail-header");
  const copy = el("div");
  copy.append(el("span", "shop-detail-eyebrow", "商店与经济"), el("h2", "", record.name || record.id || "未命名商店"), el("code", "", record.id || "缺少 ID"));
  const actions = el("div", "shop-detail-actions");
  actions.append(button("复制商店", "button ghost", context.onDuplicate), button("删除商店", "button danger", context.onDelete));
  header.append(copy, actions);
  parent.appendChild(header);
  const nav = el("div", "shop-tabs");
  tabs.forEach(([id, label]) => {
    const tab = button(label, "shop-tab", () => context.onTab(id));
    tab.classList.toggle("active", state.shopWorkspace.tab === id);
    nav.appendChild(tab);
  });
  parent.appendChild(nav);
  const body = el("div", "shop-detail-body");
  if (state.shopWorkspace.tab === "settings") renderSettings(body, context, record);
  else if (state.shopWorkspace.tab === "references") renderReferences(body, context, record);
  else if (state.shopWorkspace.tab === "advanced") renderAdvanced(body, context, record);
  else renderProductEditor(body, context, record);
  parent.appendChild(body);
}

export function renderShopWorkspace(container, context) {
  disposeEmbeddedCodeEditors(container);
  container.replaceChildren();
  const shell = el("div", "shop-workspace-shell");
  const shops = el("aside", "shop-workspace-shops");
  const products = el("aside", "shop-workspace-products");
  const detail = el("main", "shop-workspace-detail");
  shell.append(shops, products, detail);
  container.appendChild(shell);
  renderShopList(shops, context);
  const record = context.state.records[context.state.selectedRecordIndex];
  if (!record) {
    empty(products, "没有商店", "创建第一间商店后即可配置商品。");
    empty(detail, "没有可编辑内容", "从左侧创建或选择商店。");
    return;
  }
  renderProductList(products, context, record);
  renderDetail(detail, context, record);
}
