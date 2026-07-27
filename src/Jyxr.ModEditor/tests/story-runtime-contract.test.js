import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  getStoryCommandNames,
  validateStoryRuntimeContract,
} from "../wwwroot/domain/story-runtime-contract.js";

globalThis.window = globalThis;
await import("../wwwroot/story-dsl.js");

const contract = JSON.parse(await readFile(
  new URL("../Contracts/jyxr-content-contract.json", import.meta.url),
  "utf8",
)).story;
globalThis.StoryDsl.configureRuntimeContract(contract);

test("Story 运行时契约提供唯一命令名并包含稳定版调试别名", () => {
  const commandNames = getStoryCommandNames(contract);
  assert.equal(commandNames.length, new Set(commandNames).size);
  assert.ok(contract.commands.every((command) => command.name && Array.isArray(command.aliases)));
  assert.ok(commandNames.includes("random_join"));
  assert.ok(commandNames.includes("debug_battle"));
  assert.ok(commandNames.includes("dbattle"));
});

test("契约校验命令拼写、参数数量和参数类型", () => {
  const parsed = globalThis.StoryDsl.parseStory(`# Start
random_jon [胡斐]
join
levelup 主角 很多
cost_money "10"
`);
  const diagnostics = validateStoryRuntimeContract(parsed.ast, contract);

  assert.ok(diagnostics.some((item) => item.code === "unknown-command" && item.message.includes("random_jon")));
  assert.ok(diagnostics.some((item) => item.code === "argument-count" && item.message.includes("join")));
  assert.ok(diagnostics.some((item) => item.code === "argument-type" && item.message.includes("levelup")));
  assert.ok(diagnostics.some((item) => item.code === "argument-type" && item.message.includes("cost_money")));
});

test("契约校验角色、技能与表现资源引用", () => {
  const parsed = globalThis.StoryDsl.parseStory(`# Start
join 不存在角色
learn talent 主角 不存在天赋
remove external 主角 不存在武学
music 不存在音乐
background 不存在背景
effect 不存在音效
`);
  const existing = new Set(["characters:主角"]);
  const diagnostics = validateStoryRuntimeContract(parsed.ast, contract, {
    hasReference: (type, value) => existing.has(`${type}:${value}`),
  });

  for (const value of ["不存在角色", "不存在天赋", "不存在武学", "不存在音乐", "不存在背景", "不存在音效"]) {
    assert.ok(diagnostics.some((item) => item.code === "missing-reference" && item.message.includes(value)));
  }
});

test("契约校验条件谓词和内置或剧情变量", () => {
  const parsed = globalThis.StoryDsl.parseStory(`# Start
set_flag 已开启
if always and $money > 10 and $last_trial_count >= 0 and $已开启 == true
  log 正常
if typo_predicate 参数
  log 错误
if $未声明 > 0
  log 错误
`);
  const diagnostics = validateStoryRuntimeContract(parsed.ast, contract);

  assert.ok(!diagnostics.some((item) => item.message.includes("always")));
  assert.ok(!diagnostics.some((item) => item.message.includes("$money")));
  assert.ok(!diagnostics.some((item) => item.message.includes("$last_trial_count")));
  assert.ok(!diagnostics.some((item) => item.message.includes("$已开启")));
  assert.ok(diagnostics.some((item) => item.code === "unknown-predicate" && item.message.includes("typo_predicate")));
  assert.ok(diagnostics.some((item) => item.code === "unknown-variable" && item.message.includes("$未声明")));
});
