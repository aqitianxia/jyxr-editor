import assert from "node:assert/strict";
import test from "node:test";
import {
  captureInputEditingState,
  rerenderPreservingInput,
  restoreInputEditingState,
} from "../wwwroot/core/input-composition.js";

function createInput(value, start, end = start, direction = "none") {
  return {
    value,
    selectionStart: start,
    selectionEnd: end,
    selectionDirection: direction,
    focusOptions: null,
    restoredSelection: null,
    focus(options) { this.focusOptions = options; },
    setSelectionRange(nextStart, nextEnd, nextDirection) {
      this.restoredSelection = [nextStart, nextEnd, nextDirection];
    },
  };
}

test("输入状态保留光标、选区方向且恢复焦点时不滚动页面", () => {
  const original = createInput("abcde", 1, 4, "backward");
  const editingState = captureInputEditingState(original);
  const replacement = createInput("abcde", 0);

  restoreInputEditingState(replacement, editingState);

  assert.deepEqual(replacement.focusOptions, { preventScroll: true });
  assert.deepEqual(replacement.restoredSelection, [1, 4, "backward"]);
});

test("重绘事务在替换输入节点后恢复编辑状态", () => {
  const original = createInput("search", 3);
  const replacement = createInput("search", 0);
  let rendered = false;

  rerenderPreservingInput(original, () => { rendered = true; }, () => replacement);

  assert.equal(rendered, true);
  assert.deepEqual(replacement.restoredSelection, [3, 3, "none"]);
});

test("恢复选区时限制在新输入值范围内", () => {
  const replacement = createInput("ab", 0);
  restoreInputEditingState(replacement, {
    selectionStart: 8,
    selectionEnd: 12,
    selectionDirection: "forward",
  });
  assert.deepEqual(replacement.restoredSelection, [2, 2, "forward"]);
});
