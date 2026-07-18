export const shopFilters = Object.freeze([
  ["all", "全部商店"],
  ["limited", "含限购商品"],
  ["premium", "含元宝商品"],
  ["issues", "有问题"],
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

export function createShopProduct(contentId = "") {
  return {
    contentId,
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

export function isIgnoredShopProduct(contentId) {
  const id = String(contentId || "");
  return id === "元宝" || id.endsWith("残章");
}

export function getShopProductPriceMode(product) {
  const hasSilver = product?.price !== null && product?.price !== undefined;
  const hasPremium = product?.premiumPrice !== null && product?.premiumPrice !== undefined;
  if (hasSilver && hasPremium) return "mixed";
  if (hasPremium) return "premium";
  if (hasSilver) return "silver";
  return "base";
}

export function createShopProductInfo(product, itemMap = new Map()) {
  const contentId = String(product?.contentId || "");
  const item = itemMap.get(contentId) || null;
  const ignored = isIgnoredShopProduct(contentId);
  const priceMode = getShopProductPriceMode(product);
  const issues = [];
  if (!contentId) issues.push("缺少物品 ID");
  else if (!ignored && !item) issues.push("找不到对应物品");
  if (Number(product?.purchaseLimit) < 0) issues.push("限购数量不能小于 0");
  if (Number(product?.price) < 0) issues.push("银两价格不能小于 0");
  if (Number(product?.premiumPrice) < 0) issues.push("元宝价格不能小于 0");
  if (priceMode === "mixed") issues.push("同时设置了银两与元宝价格");
  return {
    contentId,
    item,
    ignored,
    priceMode,
    issues,
    effectiveSilverPrice: priceMode === "base" ? item?.price ?? null : product?.price ?? null,
    purchaseLimited: product?.purchaseLimit !== null && product?.purchaseLimit !== undefined,
  };
}

export function getShopStats(record, itemMap = new Map()) {
  const products = Array.isArray(record?.products) ? record.products : [];
  const infos = products.map((product) => createShopProductInfo(product, itemMap));
  return {
    productCount: products.length,
    limitedCount: infos.filter((info) => info.purchaseLimited).length,
    premiumCount: infos.filter((info) => info.priceMode === "premium" || info.priceMode === "mixed").length,
    ignoredCount: infos.filter((info) => info.ignored).length,
    issueCount: infos.reduce((total, info) => total + info.issues.length, 0),
  };
}

export function matchesShopSearch(record, query) {
  const normalized = String(query || "").trim().toLocaleLowerCase("zh-CN");
  if (!normalized) return true;
  return [record?.id, record?.name, record?.music, record?.background]
    .some((value) => String(value || "").toLocaleLowerCase("zh-CN").includes(normalized));
}

export function matchesShopFilter(record, filter, itemMap = new Map()) {
  const stats = getShopStats(record, itemMap);
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
