import test from "node:test";
import assert from "node:assert/strict";

import {
  getWorkspaceName,
  normalizeRecentWorkspaces,
  normalizeWorkspacePath,
  rememberWorkspacePath,
} from "../wwwroot/domain/workspace-launcher.js";

test("工作区路径去除引号和多余结尾分隔符", () => {
  assert.equal(normalizeWorkspacePath('  "/Users/zheng/jyxr-android/"  '), "/Users/zheng/jyxr-android");
  assert.equal(normalizeWorkspacePath("C:\\JYXR\\"), "C:\\JYXR");
  assert.equal(normalizeWorkspacePath("/"), "/");
});

test("最近工作区按顺序去重并限制数量", () => {
  assert.deepEqual(
    normalizeRecentWorkspaces(["/work/a/", "/work/B", "/work/a", "/work/c"], 2),
    ["/work/a", "/work/B"]
  );
});

test("打开的工作区移动到最近列表首位", () => {
  assert.deepEqual(
    rememberWorkspacePath(["/work/a", "/work/b"], "/work/b/"),
    ["/work/b", "/work/a"]
  );
});

test("工作区名称取路径最后一段", () => {
  assert.equal(getWorkspaceName("/Users/zheng/jyxr-android"), "jyxr-android");
  assert.equal(getWorkspaceName("C:\\Games\\JYXR"), "JYXR");
});
