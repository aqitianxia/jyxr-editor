import assert from "node:assert/strict";
import test from "node:test";
import { createDocumentHistory } from "../wwwroot/core/document-history.js";

test("文档历史支持撤销、重做并丢弃分叉后的重做记录", () => {
  const history = createDocumentHistory();
  history.reset({ value: 1 });
  history.commit({ value: 2 });
  history.commit({ value: 3 });

  assert.deepEqual(history.undo(), { value: 2 });
  assert.deepEqual(history.redo(), { value: 3 });
  assert.deepEqual(history.undo(), { value: 2 });
  history.commit({ value: 4 });
  assert.equal(history.canRedo(), false);
  assert.deepEqual(history.undo(), { value: 2 });
  assert.deepEqual(history.undo(), { value: 1 });
});

test("文档历史克隆快照并忽略相同内容", () => {
  const history = createDocumentHistory();
  const source = { nested: { value: 1 } };
  history.reset(source);
  source.nested.value = 2;

  assert.deepEqual(history.current(), { nested: { value: 1 } });
  assert.equal(history.commit({ nested: { value: 1 } }), false);
});

test("替换当前快照上下文不会新增撤销步骤", () => {
  const history = createDocumentHistory();
  history.reset({ value: 1, selection: "a" });
  history.replaceCurrent({ value: 1, selection: "b" });
  history.commit({ value: 2, selection: "b" });

  assert.deepEqual(history.undo(), { value: 1, selection: "b" });
  assert.equal(history.canUndo(), false);
});
