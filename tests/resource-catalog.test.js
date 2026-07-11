import assert from "node:assert/strict";
import test from "node:test";
import {
  buildResourceContractSummary,
  buildResourceCatalog,
  findAssetPath,
  getResourceGroupContract,
  normalizeArtAssetValue,
  isResourceReferenceLocation,
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

test("资源引用索引只接受已知资源字段", () => {
  assert.equal(isResourceReferenceLocation("$[0].portrait"), true);
  assert.equal(isResourceReferenceLocation("$[0].musics[2]"), true);
  assert.equal(isResourceReferenceLocation("$[0].description"), false);
  assert.equal(isResourceReferenceLocation("$[0].commands[1].args[0]"), false);
});

test("只读目录保留重复记录并区分文本和缺失资产", () => {
  const references = new Map([["头像.甲", [
    { path: "characters.json", fieldPath: "$[0].portrait", ownerDefinitionId: "甲" },
    { path: "items.json", fieldPath: "$[0].description", ownerDefinitionId: "说明" },
  ]]]);
  const catalog = buildResourceCatalog([
    { id: "头像.甲", group: "头像", value: "head/missing" },
    { id: "头像.甲", group: "头像", value: "head/other" },
    { id: "nick.甲", group: "nick", value: "称号说明" },
  ], files, references);
  assert.equal(catalog.length, 3);
  assert.equal(catalog[0].duplicate, true);
  assert.equal(catalog[0].assetExists, false);
  assert.equal(catalog[0].references.length, 1);
  assert.equal(catalog[2].kind, resourceKinds.text);
  assert.equal(catalog[2].assetExists, false);
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
