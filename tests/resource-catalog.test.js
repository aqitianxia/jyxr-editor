import assert from "node:assert/strict";
import test from "node:test";
import {
  buildResourceContractSummary,
  findAssetPath,
  getResourceGroupContract,
  normalizeArtAssetValue,
  resolveResourceAssetPath,
  resourceKinds,
} from "../wwwroot/domain/resource-catalog.js";

const files = new Set(["art/head/liwenxiu.png", "art/item/pill.webp", "audio/battle.mp3"]);

test("资源组区分图片、音频、文本和未知类型", () => {
  assert.equal(getResourceGroupContract("头像").kind, resourceKinds.image);
  assert.equal(getResourceGroupContract("战斗音乐").kind, resourceKinds.audio);
  assert.equal(getResourceGroupContract("nick").kind, resourceKinds.text);
  assert.equal(getResourceGroupContract("自定义组").kind, resourceKinds.unknown);
});

test("只有后端通用注册接口支持的资源组被标记为可注册", () => {
  assert.equal(getResourceGroupContract("头像").genericRegistrationSupported, true);
  assert.equal(getResourceGroupContract("战斗音乐").genericRegistrationSupported, false);
  assert.equal(getResourceGroupContract("nick").genericRegistrationSupported, false);
});

test("保持现有图片和音频路径回退行为", () => {
  assert.equal(findAssetPath("head/liwenxiu", files, { art: true }), "art/head/liwenxiu.png");
  assert.equal(findAssetPath("item/pill.png", files, { art: true }), "art/item/pill.webp");
  assert.equal(findAssetPath("audio/battle.mp3", files, { audio: true }), "audio/battle.mp3");
  assert.equal(resolveResourceAssetPath({ group: "头像", value: "head/liwenxiu" }, files), "art/head/liwenxiu.png");
  assert.equal(resolveResourceAssetPath({ group: "战斗音乐", value: "audio/battle.mp3" }, files), "audio/battle.mp3");
});

test("文本资源不被错误解析为资产", () => {
  assert.equal(resolveResourceAssetPath({ group: "nick", value: "一段称号说明" }, files), "");
});

test("艺术资源 value 规范化保持现有写入格式", () => {
  assert.equal(normalizeArtAssetValue("res://assets/art/head/liwenxiu.PNG"), "head/liwenxiu");
  assert.equal(normalizeArtAssetValue("art\\item\\pill.webp"), "item/pill");
});

test("资源摘要保留分组数量并报告重复 ID", () => {
  const summary = buildResourceContractSummary([
    { id: "头像.甲", group: "头像" },
    { id: "头像.甲", group: "头像" },
    { id: "nick.甲", group: "nick" },
  ]);
  assert.equal(summary.total, 3);
  assert.equal(summary.groupCounts.get("头像"), 2);
  assert.deepEqual([...summary.duplicateIds], ["头像.甲"]);
});
