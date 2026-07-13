import test from "node:test";
import assert from "node:assert/strict";

import {
  rememberDataDocumentSelection,
  restoreDataDocumentSelection,
} from "../wwwroot/core/data-document-context.js";

test("不同数据文件分别恢复自己的条目选择", () => {
  const contexts = new Map();
  rememberDataDocumentSelection(contexts, "maps.json", 12);
  rememberDataDocumentSelection(contexts, "characters.json", 37);

  assert.equal(restoreDataDocumentSelection(contexts, "maps.json"), 12);
  assert.equal(restoreDataDocumentSelection(contexts, "characters.json"), 37);
  assert.equal(restoreDataDocumentSelection(contexts, "items.json"), 0);
});

test("清空上下文后不把选择带到另一个 MOD", () => {
  const contexts = new Map();
  rememberDataDocumentSelection(contexts, "maps.json", 8);
  contexts.clear();

  assert.equal(restoreDataDocumentSelection(contexts, "maps.json"), 0);
});
