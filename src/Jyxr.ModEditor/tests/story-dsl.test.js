import test from "node:test";
import assert from "node:assert/strict";

globalThis.window = globalThis;
await import("../wwwroot/story-dsl.js");

const { analyzeStory, compileScript, decompileStoryJson, parseStory } = globalThis.StoryDsl;

test("Story DSL 把简洁选择编译为 IR v2 无条件组", () => {
  const result = analyzeStory(`# start
主角：去哪
- 左
  jump left
- 右
  jump right
`);

  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.ir.version, 2);
  assert.deepEqual(result.ir.segments[0].steps[0], {
    kind: "choice",
    prompt: { speaker: "主角", text: "去哪" },
    groups: [{
      options: [
        { text: "左", steps: [{ kind: "jump", target: "left" }] },
        { text: "右", steps: [{ kind: "jump", target: "right" }] },
      ],
    }],
  });
});

test("Story DSL 使用核心语法编译并往返保留展示样式", () => {
  const result = analyzeStory(`# Start
胡斐：[#style=怒气.强调]你骗我！
掌柜：[#style=shop-cards]客官需要什么？
- 购买
  jump buy
`);

  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.ir.segments[0].steps[0].style, "怒气.强调");
  assert.equal(result.ir.segments[0].steps[0].text, "你骗我！");
  assert.equal(result.ir.segments[0].steps[1].style, "shop-cards");

  const source = decompileStoryJson(result.ir);
  assert.match(source, /胡斐：\[#style=怒气\.强调\]你骗我！/u);
  assert.match(source, /掌柜：\[#style=shop-cards\]客官需要什么？/u);
  assert.deepEqual(analyzeStory(source).ir, result.ir);
});

test("Story DSL 往返保留条件选择组、call 和 return", () => {
  const story = {
    version: 2,
    segments: [{
      name: "start",
      steps: [{
        kind: "choice",
        prompt: { speaker: "主角", text: "选择" },
        groups: [
          { options: [{ text: "普通", steps: [{ kind: "call", target: "shared" }] }] },
          { when: [">=", ["var", "rank"], 2], options: [{ text: "高手", steps: [{ kind: "jump", target: "elite" }] }] },
        ],
      }, { kind: "return" }],
    }],
  };

  const source = decompileStoryJson(story);
  assert.match(source, /^when \$rank >= 2$/mu);
  assert.doesNotMatch(source, /\bgroup\b/u);
  assert.match(source, /call shared/u);
  assert.match(source, /return/u);
  const compiled = analyzeStory(source);
  assert.deepEqual(compiled.diagnostics, []);
  assert.deepEqual(compiled.ir, story);
});

test("Story DSL 按作者语法交错编译普通选项与 when 条件组", () => {
  const result = analyzeStory(`# Start
掌柜：客官需要什么？
- 离开
  jump leave
when has_item 小刀 and $money > 10
  - 购买
    jump buy
  - 出售
    jump sell
- 打听消息
  jump gossip
`);

  assert.deepEqual(result.diagnostics, []);
  const step = result.ir.segments[0].steps[0];
  assert.deepEqual(step.groups.map((group) => group.options.map((option) => option.text)), [
    ["离开"],
    ["购买", "出售"],
    ["打听消息"],
  ]);
  assert.deepEqual(step.groups[1].when, [
    "and",
    ["pred", "has_item", "小刀"],
    [">", ["var", "money"], 10],
  ]);
});

test("Story DSL 报告非法 when 结构", () => {
  const parsed = parseStory(`# Start
when always
旁白：空条件
when
  - 选项
旁白：空组
when always
旁白：直接语句
when always
  do_something
旁白：嵌套组
when always
  when always
    - 选项
`);

  assert.ok(parsed.diagnostics.some((item) => item.message.includes("when 只能作为 choice")));
  assert.ok(parsed.diagnostics.some((item) => item.message.includes("when 后缺少条件表达式")));
  assert.ok(parsed.diagnostics.some((item) => item.message.includes("至少需要一个缩进")));
  assert.ok(parsed.diagnostics.some((item) => item.message.includes("只能包含 '- 选项'")));
  assert.ok(parsed.diagnostics.some((item) => item.message.includes("不允许嵌套")));
});

test("Story DSL 在所有选项组都有条件时给出警告但仍可编译", () => {
  const result = analyzeStory(`# Start
旁白：选择
when always
  - 唯一选项
`);

  assert.equal(result.diagnostics.filter((item) => item.severity === "error").length, 0);
  assert.ok(result.diagnostics.some((item) =>
    item.severity === "warning" && item.message.includes("可能没有可用选项")));
  assert.equal(result.ir.version, 2);
});

test("Story DSL 解析英文和中文分隔的列表参数", () => {
  const result = analyzeStory(`# Start
random_item [小还丹, 大还丹] 1
random_item [小还丹， 大还丹] 2
random_join [胡斐, 程灵素, $candidateId]
set_text ["带 空格", "https://example.test/a//b"]
`);

  assert.deepEqual(result.diagnostics, []);
  assert.deepEqual(result.ir.segments[0].steps.map((step) => step.args), [
    [["list", "小还丹", "大还丹"], 1],
    [["list", "小还丹", "大还丹"], 2],
    [["list", "胡斐", "程灵素", ["var", "candidateId"]]],
    [["list", "带 空格", "https://example.test/a//b"]],
  ]);
});

test("Story DSL 报告损坏的列表参数", () => {
  const parsed = parseStory(`# Start
random_item [小还丹, 大还丹
random_item [] 1
random_join [胡斐,,程灵素]
random_join [胡斐 程灵素]
`);

  assert.ok(parsed.diagnostics.some((item) => item.message.includes("缺少右括号")));
  assert.ok(parsed.diagnostics.some((item) => item.message.includes("不能为空")));
  assert.ok(parsed.diagnostics.some((item) => item.message.includes("缺少元素")));
  assert.ok(parsed.diagnostics.some((item) => item.message.includes("必须使用")));
});

test("Story DSL 归一化有符号数字并按作者规则补 maxlevel key", () => {
  const parsed = parseStory(`# 某剧情
maxlevel 独孤九剑 1
upgrade 臂力 主角 -5
if $money > +100
  get_money -10
# 自定义
maxlevel 独孤九剑 1 custom_key
# 动态
maxlevel $skill 1
`);
  const compiled = compileScript(parsed.ast);

  assert.deepEqual(parsed.diagnostics, []);
  assert.equal(compiled.diagnostics.length, 1);
  assert.match(compiled.diagnostics[0].message, /maxlevel/u);
  assert.deepEqual(compiled.ir.segments[0].steps[0].args, ["独孤九剑", 1, "某剧情_独孤九剑"]);
  assert.deepEqual(compiled.ir.segments[0].steps[1].args, ["臂力", "主角", -5]);
  assert.deepEqual(compiled.ir.segments[0].steps[2].cases[0].when, [">", ["var", "money"], 100]);
  assert.deepEqual(compiled.ir.segments[1].steps[0].args, ["独孤九剑", 1, "custom_key"]);
  assert.deepEqual(compiled.ir.segments[2].steps[0].args, [["var", "skill"], 1]);
});

test("Story DSL 校验 call/return 并跳过 return 后不可达语句", () => {
  const invalid = parseStory(`# Start
call
return value
`);
  assert.ok(invalid.diagnostics.some((item) => item.message.includes("call 之后必须提供目标段名")));
  assert.ok(invalid.diagnostics.some((item) => item.message.includes("return 后不能跟参数")));

  const parsed = parseStory(`# Start
call Shared
南贤：回来
return
南贤：这里不该到达
# Shared
南贤：公共段
return
`);
  const compiled = compileScript(parsed.ast);
  assert.ok(compiled.diagnostics.some((item) =>
    item.code === "unreachable" && item.message.includes("jump/return")));
  assert.deepEqual(compiled.ir.segments[0].steps.map((step) => step.kind), ["call", "dialogue", "return"]);
});

test("Story DSL 校验保留字和归一化后的重复段名", () => {
  const parsed = parseStory(`#   游戏开始
and foo
# 游戏开始${"  "}
南贤：重复
`);

  assert.ok(parsed.diagnostics.some((item) => item.message.includes("保留字")));
  assert.ok(parsed.diagnostics.some((item) => item.message.includes("重复的剧情段名")));
});
