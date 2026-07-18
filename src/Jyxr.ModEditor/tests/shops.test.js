import assert from "node:assert/strict";
import test from "node:test";
import {
  createShopDefinition,
  createShopProduct,
  createShopProductInfo,
  ensureShopShape,
  getShopProductPriceMode,
  isIgnoredShopProduct,
  moveShopProduct,
} from "../wwwroot/domain/shops.js";

test("新建商店和商品只使用运行时支持字段", () => {
  assert.deepEqual(createShopDefinition("杂货铺"), {
    id: "杂货铺",
    name: "杂货铺",
    music: "",
    background: "",
    products: [],
  });
  assert.deepEqual(createShopProduct("小还丹"), {
    contentId: "小还丹",
    purchaseLimit: null,
    price: null,
    premiumPrice: null,
  });
});

test("商店结构补齐不会删除未知字段", () => {
  const record = { id: "测试", custom: { enabled: true } };
  assert.equal(ensureShopShape(record), record);
  assert.deepEqual(record.custom, { enabled: true });
  assert.deepEqual(record.products, []);
});

test("商品定价模式保持基础价、银两和元宝语义", () => {
  const items = new Map([["药", { id: "药", name: "药", price: 25 }]]);
  const base = createShopProductInfo(createShopProduct("药"), items);
  assert.equal(base.priceMode, "base");
  assert.equal(base.effectiveSilverPrice, 25);

  assert.equal(getShopProductPriceMode({ price: 10, premiumPrice: null }), "silver");
  assert.equal(getShopProductPriceMode({ price: null, premiumPrice: 2 }), "premium");
  assert.equal(getShopProductPriceMode({ price: 10, premiumPrice: 2 }), "mixed");
});

test("运行时兼容商品会标记为忽略且不报告物品缺失", () => {
  assert.equal(isIgnoredShopProduct("元宝"), true);
  assert.equal(isIgnoredShopProduct("九阴残章"), true);
  const info = createShopProductInfo({ contentId: "九阴残章", price: 10 }, new Map());
  assert.equal(info.ignored, true);
  assert.equal(info.issues.includes("找不到对应物品"), false);
});

test("普通商品缺少物品定义时报告问题", () => {
  const info = createShopProductInfo({ contentId: "不存在", price: null, premiumPrice: null }, new Map());
  assert.deepEqual(info.issues, ["找不到对应物品"]);
});

test("商品排序不越界、不修改原数组且保留未知字段", () => {
  const products = [{ contentId: "甲", custom: 1 }, { contentId: "乙", custom: 2 }];
  const moved = moveShopProduct(products, 1, -1);
  assert.deepEqual(moved.map((product) => product.contentId), ["乙", "甲"]);
  assert.equal(moved[1].custom, 1);
  assert.deepEqual(products.map((product) => product.contentId), ["甲", "乙"]);
  assert.equal(moveShopProduct(products, 0, -1), products);
});
