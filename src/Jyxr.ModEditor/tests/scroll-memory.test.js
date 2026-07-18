import assert from "node:assert/strict";
import test from "node:test";
import { bindScrollMemory, resetScrollMemory } from "../wwwroot/ui/scroll-memory.js";

test("统一滚动记忆在重绘后恢复位置并持续记录", async () => {
  const listeners = new Map();
  const element = {
    isConnected: true,
    scrollTop: 0,
    scrollLeft: 0,
    addEventListener(type, listener) { listeners.set(type, listener); },
  };
  const memory = { "items:list": { top: 320, left: 4 } };
  bindScrollMemory(element, memory, "items:list");
  await new Promise((resolve) => queueMicrotask(resolve));
  assert.equal(element.scrollTop, 320);
  assert.equal(element.scrollLeft, 4);

  element.scrollTop = 515;
  element.scrollLeft = 0;
  listeners.get("scroll")();
  assert.deepEqual(memory["items:list"], { top: 515, left: 0 });
});

test("搜索条件变化会清除旧结果列表的滚动位置", () => {
  const memory = { "items:list": { top: 515, left: 0 } };
  resetScrollMemory(memory, "items:list");
  assert.equal(memory["items:list"], undefined);
});
