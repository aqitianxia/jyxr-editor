import assert from "node:assert/strict";
import test from "node:test";

import {
  getCharacterBiographyCandidateIds,
  resolveCharacterBiography,
} from "../wwwroot/domain/character-biographies.js";
import {
  analyzeGodotBbcode,
  applyGodotBbcodeFormat,
  tokenizeGodotBbcode,
} from "../wwwroot/domain/godot-bbcode.js";

test("人物列传按运行时顺序优先匹配角色名再匹配 ID", () => {
  const record = { id: "乔峰_青年", name: "乔峰" };
  assert.deepEqual(getCharacterBiographyCandidateIds(record), ["人物.乔峰", "人物.乔峰_青年"]);

  const resources = new Map([
    ["人物.乔峰", { id: "人物.乔峰", group: "人物", value: "名称列传" }],
    ["人物.乔峰_青年", { id: "人物.乔峰_青年", group: "人物", value: "ID 列传" }],
  ]);
  assert.equal(resolveCharacterBiography(record, resources).value, "名称列传");
});

test("没有列传时使用角色 ID 创建独立资源", () => {
  const biography = resolveCharacterBiography({ id: "神级主角", name: "小虾米" }, new Map());
  assert.deepEqual(biography, {
    id: "人物.神级主角",
    value: "",
    exists: false,
    savedValue: "",
    dirty: false,
  });
});

test("列传草稿覆盖已保存资源但保留原值", () => {
  const resources = new Map([
    ["人物.郭靖", { id: "人物.郭靖", group: "人物", value: "旧列传" }],
  ]);
  const drafts = new Map([["人物.郭靖", "新列传"]]);
  assert.deepEqual(resolveCharacterBiography({ id: "郭靖", name: "郭靖" }, resources, drafts), {
    id: "人物.郭靖",
    value: "新列传",
    exists: true,
    savedValue: "旧列传",
    dirty: true,
  });
});

test("列传 BBCode 识别游戏常用标签并保留未知标签", () => {
  const tokens = tokenizeGodotBbcode("[b]侠客[/b][wave]原样[/wave]");
  assert.deepEqual(tokens.map((token) => [token.type, token.name || "", token.value]), [
    ["tag", "b", "[b]"],
    ["text", "", "侠客"],
    ["tag", "b", "[/b]"],
    ["text", "wave", "[wave]"],
    ["text", "", "原样"],
    ["text", "wave", "[/wave]"],
  ]);
});

test("列传 BBCode 报告未闭合与错误嵌套", () => {
  assert.deepEqual(analyzeGodotBbcode("[b][color=red]侠客[/b]" ).map((item) => item.message), [
    "缺少结束标签：[color]",
    "标签嵌套顺序错误：应先结束 [color]",
  ]);
});

test("列传格式工具包裹当前选区", () => {
  assert.deepEqual(applyGodotBbcodeFormat("江湖侠客", 2, 4, "[b]", "[/b]"), {
    value: "江湖[b]侠客[/b]",
    selectionStart: 5,
    selectionEnd: 7,
  });
});
