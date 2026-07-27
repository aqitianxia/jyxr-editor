export const shopFilters = Object.freeze([
  ["all", "全部商店"],
  ["limited", "含限购商品"],
  ["premium", "含元宝商品"],
  ["issues", "有问题"],
]);

export const shopRewardTypes = Object.freeze([
  ["item", "物品"],
  ["skill_max_level", "武学等级"],
  ["yuanbao", "元宝"],
]);

export const shopSkillKinds = Object.freeze([
  ["external", "外功"],
  ["internal", "内功"],
]);

export function createShopDefinition(id = "新商店") {
  return {
    id,
    name: id,
    music: "",
    background: "",
    products: [],
  };
}

export function createShopReward(kind = "item", referenceId = "") {
  if (kind === "skill_max_level") return { kind, skillKind: "external", skillId: referenceId, levels: 1 };
  if (kind === "yuanbao") return { kind, amount: 1 };
  return { kind: "item", itemId: referenceId, quantity: 1 };
}

export function createShopProduct(itemId = "") {
  return {
    reward: createShopReward("item", itemId),
    purchaseLimit: null,
    price: null,
    premiumPrice: null,
  };
}

export function ensureShopShape(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return createShopDefinition();
  if (!Array.isArray(record.products)) record.products = [];
  if (!("music" in record)) record.music = "";
  if (!("background" in record)) record.background = "";
  return record;
}

export function getShopRewardKey(reward) {
  if (reward?.kind === "item") return `item:${String(reward.itemId || "")}`;
  if (reward?.kind === "skill_max_level") return `skill_max_level:${String(reward.skillKind || "")}:${String(reward.skillId || "")}`;
  if (reward?.kind === "yuanbao") return "yuanbao";
  return "";
}

export function getShopProductPriceMode(product) {
  const hasSilver = product?.price !== null && product?.price !== undefined;
  const hasPremium = product?.premiumPrice !== null && product?.premiumPrice !== undefined;
  if (hasSilver && hasPremium) return "mixed";
  if (hasPremium) return "premium";
  if (hasSilver) return "silver";
  return "base";
}

export function createShopProductInfo(product, catalog = {}) {
  const reward = product?.reward && typeof product.reward === "object" ? product.reward : null;
  const kind = String(reward?.kind || "");
  const itemId = kind === "item" ? String(reward?.itemId || "") : "";
  const skillId = kind === "skill_max_level" ? String(reward?.skillId || "") : "";
  const item = catalog.items?.get(itemId) || null;
  const skillMap = reward?.skillKind === "internal" ? catalog.internalSkills : catalog.externalSkills;
  const skill = skillMap?.get(skillId) || null;
  const priceMode = getShopProductPriceMode(product);
  const issues = [];
  if (!reward) issues.push("缺少奖励定义");
  else if (kind === "item") {
    if (!itemId) issues.push("缺少物品 ID");
    else if (!item) issues.push("找不到对应物品");
    const quantity = reward.quantity ?? 1;
    if (!Number.isInteger(quantity) || quantity <= 0) issues.push("物品数量必须是正整数");
  } else if (kind === "skill_max_level") {
    if (!shopSkillKinds.some(([value]) => value === reward.skillKind)) issues.push("武学类型必须是 external 或 internal");
    if (!skillId) issues.push("缺少武学 ID");
    else if (!skill) issues.push("找不到对应武学");
    const levels = reward.levels ?? 1;
    if (!Number.isInteger(levels) || levels <= 0) issues.push("提升等级必须是正整数");
    if (priceMode === "base") issues.push("武学奖励必须明确设置价格");
  } else if (kind === "yuanbao") {
    const amount = reward.amount ?? 1;
    if (!Number.isInteger(amount) || amount <= 0) issues.push("元宝数量必须是正整数");
    if (priceMode !== "silver") issues.push("元宝奖励必须使用银两购买");
  } else if (reward) issues.push(`不支持的奖励类型：${kind || "空"}`);
  if (Number(product?.purchaseLimit) < 0) issues.push("限购数量不能小于 0");
  if (Number(product?.price) < 0) issues.push("银两价格不能小于 0");
  if (Number(product?.premiumPrice) < 0) issues.push("元宝价格不能小于 0");
  if (priceMode === "mixed") issues.push("同时设置了银两与元宝价格");
  return {
    reward,
    kind,
    kindLabel: shopRewardTypes.find(([value]) => value === kind)?.[1] || kind || "未知奖励",
    referenceId: itemId || skillId,
    item,
    skill,
    displayName: kind === "item"
      ? item?.name || itemId || "未选择物品"
      : kind === "skill_max_level"
        ? `${skill?.name || skillId || "未选择武学"} · 提升 ${reward?.levels ?? 1} 级`
        : kind === "yuanbao"
          ? `${reward?.amount ?? 1} 元宝`
          : "未知奖励",
    priceMode,
    issues,
    effectiveSilverPrice: priceMode === "base" ? item?.price ?? null : product?.price ?? null,
    purchaseLimited: product?.purchaseLimit !== null && product?.purchaseLimit !== undefined,
  };
}

export function getShopStats(record, catalog = {}) {
  const products = Array.isArray(record?.products) ? record.products : [];
  const infos = products.map((product) => createShopProductInfo(product, catalog));
  const rewardKeys = infos.map((info) => getShopRewardKey(info.reward)).filter(Boolean);
  const duplicateCount = rewardKeys.length - new Set(rewardKeys).size;
  return {
    productCount: products.length,
    limitedCount: infos.filter((info) => info.purchaseLimited).length,
    premiumCount: infos.filter((info) => info.priceMode === "premium" || info.priceMode === "mixed").length,
    specialCount: infos.filter((info) => info.kind !== "item").length,
    issueCount: infos.reduce((total, info) => total + info.issues.length, 0) + duplicateCount,
  };
}

export function matchesShopSearch(record, query) {
  const normalized = String(query || "").trim().toLocaleLowerCase("zh-CN");
  if (!normalized) return true;
  return [record?.id, record?.name, record?.music, record?.background,
    ...(record?.products || []).flatMap((product) => [product?.reward?.kind, product?.reward?.itemId, product?.reward?.skillId])]
    .some((value) => String(value || "").toLocaleLowerCase("zh-CN").includes(normalized));
}

export function matchesShopFilter(record, filter, catalog = {}) {
  const stats = getShopStats(record, catalog);
  if (filter === "limited") return stats.limitedCount > 0;
  if (filter === "premium") return stats.premiumCount > 0;
  if (filter === "issues") return stats.issueCount > 0;
  return true;
}

export function moveShopProduct(products, index, direction) {
  const target = index + direction;
  if (!Array.isArray(products) || index < 0 || index >= products.length || target < 0 || target >= products.length) return products;
  const next = [...products];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
