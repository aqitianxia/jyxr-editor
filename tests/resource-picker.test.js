import assert from "node:assert/strict";
import test from "node:test";
import {
  createResourcePickerModel,
  createResourceSelectionSession,
  moveResourcePickerSelection,
  scoreResourceSearch,
} from "../wwwroot/domain/resource-picker.js";

const entries = [
  { assetPath: "art/head/liwenxiu.png", basename: "liwenxiu", resourceIds: ["头像.李文秀"] },
  { assetPath: "art/head/limocou.png", basename: "limocou", resourceIds: ["头像.李莫愁"] },
  { assetPath: "art/head/miaoruolan.png", basename: "miaoruolan", resourceIds: ["头像.苗若兰"] },
];

test("资源搜索支持包含匹配和顺序模糊匹配", () => {
  assert.ok(scoreResourceSearch("头像.李文秀 head/liwenxiu", "李文秀") > 0);
  assert.ok(scoreResourceSearch("头像.李文秀 head/liwenxiu", "lwx") > 0);
  assert.equal(scoreResourceSearch("头像.李莫愁", "苗若兰"), -1);
});

test("选择模型保留原顺序并优先使用仍可见的当前项", () => {
  const model = createResourcePickerModel({ entries, query: "li", selectedValue: entries[1].assetPath, getValue: (entry) => entry.assetPath });
  assert.deepEqual(model.visibleEntries.map((entry) => entry.basename), ["liwenxiu", "limocou"]);
  assert.equal(model.selectedEntry.basename, "limocou");
});

test("当前选择被筛掉时回退到首条结果", () => {
  const model = createResourcePickerModel({ entries, query: "苗若兰", selectedValue: entries[0].assetPath, getValue: (entry) => entry.assetPath });
  assert.equal(model.selectedEntry.basename, "miaoruolan");
});

test("方向导航限制在结果边界内", () => {
  const model = createResourcePickerModel({ entries, selectedValue: entries[0].assetPath, getValue: (entry) => entry.assetPath });
  assert.equal(moveResourcePickerSelection(model, -1).basename, "liwenxiu");
  assert.equal(moveResourcePickerSelection(model, 1).basename, "limocou");
});

test("取消恢复初始值，确认只返回草稿值", () => {
  const session = createResourceSelectionSession("头像.李文秀");
  session.select("头像.苗若兰");
  assert.equal(session.confirm(), "头像.苗若兰");
  assert.equal(session.cancel(), "头像.李文秀");
  assert.equal(session.draftValue, "头像.李文秀");
});
