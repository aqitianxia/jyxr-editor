import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  createShopDefinition,
  createShopProduct,
  createShopProductInfo,
  createShopReward,
  ensureShopShape,
  getShopProductPriceMode,
  moveShopProduct,
  shopRewardTypes,
} from "../wwwroot/domain/shops.js";

const contract = JSON.parse(fs.readFileSync(
  new URL("../Contracts/jyxr-content-contract.json", import.meta.url),
  "utf8",
));

test("新建商店和商品只使用运行时支持字段", () => {
  assert.deepEqual(createShopDefinition("杂货铺"), {
    id: "杂货铺",
    name: "杂货铺",
    music: "",
    background: "",
    products: [],
  });
  assert.deepEqual(createShopProduct("小还丹"), {
    reward: { kind: "item", itemId: "小还丹", quantity: 1 },
    purchaseLimit: null,
    price: null,
    premiumPrice: null,
  });
  assert.deepEqual(createShopReward("skill_max_level", "降龙十八掌"), {
    kind: "skill_max_level", skillKind: "external", skillId: "降龙十八掌", levels: 1,
  });
  assert.deepEqual(createShopReward("yuanbao"), { kind: "yuanbao", amount: 1 });
  assert.deepEqual(shopRewardTypes.map(([value]) => value).sort(), [...contract.polymorphicTypes.reward.values].sort());
});

test("商店结构补齐不会删除未知字段", () => {
  const record = { id: "测试", custom: { enabled: true } };
  assert.equal(ensureShopShape(record), record);
  assert.deepEqual(record.custom, { enabled: true });
  assert.deepEqual(record.products, []);
});

test("商品定价模式保持基础价、银两和元宝语义", () => {
  const items = new Map([["药", { id: "药", name: "药", price: 25 }]]);
  const base = createShopProductInfo(createShopProduct("药"), { items });
  assert.equal(base.priceMode, "base");
  assert.equal(base.effectiveSilverPrice, 25);

  assert.equal(getShopProductPriceMode({ price: 10, premiumPrice: null }), "silver");
  assert.equal(getShopProductPriceMode({ price: null, premiumPrice: 2 }), "premium");
  assert.equal(getShopProductPriceMode({ price: 10, premiumPrice: 2 }), "mixed");
});

test("武学和元宝奖励遵守运行时字段与定价规则", () => {
  const externalSkills = new Map([["降龙十八掌", { id: "降龙十八掌", name: "降龙十八掌" }]]);
  const skill = createShopProductInfo({
    reward: createShopReward("skill_max_level", "降龙十八掌"), premiumPrice: 4,
  }, { externalSkills });
  assert.equal(skill.displayName, "降龙十八掌 · 提升 1 级");
  assert.deepEqual(skill.issues, []);

  const yuanbao = createShopProductInfo({ reward: { kind: "yuanbao", amount: 10 }, price: 100 }, {});
  assert.deepEqual(yuanbao.issues, []);
  assert.ok(createShopProductInfo({ reward: { kind: "yuanbao", amount: 10 }, premiumPrice: 1 }, {}).issues.includes("元宝奖励必须使用银两购买"));
});

test("奖励数量字段省略时使用运行时默认值 1", () => {
  const items = new Map([["药", { id: "药", name: "药", price: 25 }]]);
  const externalSkills = new Map([["掌法", { id: "掌法", name: "掌法" }]]);

  assert.deepEqual(createShopProductInfo({ reward: { kind: "item", itemId: "药" } }, { items }).issues, []);
  const skill = createShopProductInfo({
    reward: { kind: "skill_max_level", skillKind: "external", skillId: "掌法" }, price: 100,
  }, { externalSkills });
  assert.deepEqual(skill.issues, []);
  assert.equal(skill.displayName, "掌法 · 提升 1 级");

  const yuanbao = createShopProductInfo({ reward: { kind: "yuanbao" }, price: 100 }, {});
  assert.deepEqual(yuanbao.issues, []);
  assert.equal(yuanbao.displayName, "1 元宝");
});

test("普通商品缺少物品定义时报告问题", () => {
  const info = createShopProductInfo(createShopProduct("不存在"), { items: new Map() });
  assert.deepEqual(info.issues, ["找不到对应物品"]);
});

test("商品排序不越界、不修改原数组且保留未知字段", () => {
  const products = [{ reward: { kind: "item", itemId: "甲" }, custom: 1 }, { reward: { kind: "item", itemId: "乙" }, custom: 2 }];
  const moved = moveShopProduct(products, 1, -1);
  assert.deepEqual(moved.map((product) => product.reward.itemId), ["乙", "甲"]);
  assert.equal(moved[1].custom, 1);
  assert.deepEqual(products.map((product) => product.reward.itemId), ["甲", "乙"]);
  assert.equal(moveShopProduct(products, 0, -1), products);
});
