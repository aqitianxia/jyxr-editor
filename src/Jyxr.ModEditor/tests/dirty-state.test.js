import assert from "node:assert/strict";
import test from "node:test";

import { createDirtyStateController } from "../wwwroot/core/dirty-state.js";

function createController(confirmDiscard = () => true) {
  const state = { dirty: false, dirtyPath: "", dirtyDetail: "", currentPath: "maps.json" };
  const controller = createDirtyStateController({ state, confirmDiscard });
  return { controller, state };
}

test("未保存状态记录具体文件和编辑位置", () => {
  const { controller, state } = createController();
  controller.markDirty({ path: "maps.json", detail: "地图：大地图 / 点位：昆仑山", render: false });
  assert.equal(state.dirty, true);
  assert.equal(state.dirtyPath, "maps.json");
  assert.equal(state.dirtyDetail, "地图：大地图 / 点位：昆仑山");
});

test("放弃修改提示包含文件、位置和按钮含义", async () => {
  let prompt = "";
  const { controller } = createController((message) => {
    prompt = message;
    return false;
  });
  controller.markDirty({ path: "maps.json", detail: "地图：大地图", render: false });
  assert.equal(await controller.confirmDiscardChanges(), false);
  assert.match(prompt, /maps\.json/);
  assert.match(prompt, /地图：大地图/);
  assert.match(prompt, /确定将放弃/);
  assert.match(prompt, /取消则留在当前页面/);
});

test("清除未保存状态时同时清除来源", () => {
  const { controller, state } = createController();
  controller.markDirty({ detail: "地图：大地图", render: false });
  controller.markClean({ render: false });
  assert.deepEqual({ dirty: state.dirty, path: state.dirtyPath, detail: state.dirtyDetail }, {
    dirty: false,
    path: "",
    detail: "",
  });
});
