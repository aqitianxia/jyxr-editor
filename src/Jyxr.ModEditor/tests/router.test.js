import test from "node:test";
import assert from "node:assert/strict";

import { normalizeWorkspaceMode } from "../wwwroot/core/router.js";

test("地图工作区是有效路由", () => {
  assert.equal(normalizeWorkspaceMode("maps"), "maps");
});

test("天赋工作区是有效路由", () => {
  assert.equal(normalizeWorkspaceMode("talents"), "talents");
});

test("战斗工作区是有效路由", () => {
  assert.equal(normalizeWorkspaceMode("battles"), "battles");
});

test("成就与触发工作区是有效路由", () => {
  assert.equal(normalizeWorkspaceMode("achievements"), "achievements");
});

test("未知工作区仍回退到项目首页", () => {
  assert.equal(normalizeWorkspaceMode("missing-workspace"), "home");
});
