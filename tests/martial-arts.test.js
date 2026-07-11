import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMartialIndex,
  collectAnimationReferences,
  createFormSkill,
  createMartialDefinition,
  createSpecialEffect,
  getImpactPositions,
  moveEntry,
  resolveEffectiveTargeting,
  resolvePresentation,
  getMartialIssues,
  createMartialFromTemplate,
  estimateExternalMpCost,
  getMartialReadiness,
  filterMartialResources,
} from "../wwwroot/domain/martial-arts.js";

test("武学默认结构匹配四类运行时定义", () => {
  assert.equal(createMartialDefinition("external", "拳").type, "quanzhang");
  assert.deepEqual(createMartialDefinition("internal", "功").formSkills, []);
  assert.deepEqual(createMartialDefinition("special", "技").effects, []);
  assert.equal(createMartialDefinition("legend", "奥").probability, 0.1);
  assert.equal(createFormSkill("招").unlockLevel, 1);
  assert.equal(createSpecialEffect("apply_buff").target.type, "target");
});

test("统一索引保留源文件和嵌套招式父级", () => {
  const external = createMartialDefinition("external", "外功");
  external.formSkills.push(createFormSkill("招式"));
  const index = buildMartialIndex({ external: [external], internal: [], special: [], legend: [] });
  assert.equal(index.entries[0].path, "external-skills.json");
  assert.equal(index.formsById.get("招式")[0].parent, external);
});

test("招式表现字段按运行时规则继承父武学", () => {
  const parent = { icon: "父图标", animation: "父动画", audio: "父音效", type: "jianfa", targeting: {} };
  const form = { icon: null, animation: null, audio: null, targeting: { impactType: "square", impactSize: 4 } };
  assert.deepEqual(resolvePresentation(form, "form", parent), { icon: "父图标", animation: "父动画", audio: "父音效" });
  assert.deepEqual(resolveEffectiveTargeting(form, "form", parent), { canTargetSelf: false, castSize: 1, impactType: "square", impactSize: 4 });
});

test("默认武器范围与运行时 SkillHelper 一致", () => {
  assert.deepEqual(resolveEffectiveTargeting({ type: "jianfa", targeting: {} }, "external"), { canTargetSelf: false, castSize: 1, impactType: "line", impactSize: 4 });
  assert.deepEqual(resolveEffectiveTargeting({ type: "qimen", targeting: {} }, "external"), { canTargetSelf: false, castSize: 0, impactType: "plus", impactSize: 2 });
});

test("11x4 预览覆盖算法保持运行时形状", () => {
  const source = { x: 2, y: 2 };
  const target = { x: 4, y: 2 };
  assert.deepEqual([...getImpactPositions(source, target, "line", 4)], ["3,2", "4,2", "5,2", "6,2"]);
  assert.deepEqual([...getImpactPositions(source, target, "cleave", 1)].sort(), ["4,1", "4,2", "4,3"]);
  assert.equal(getImpactPositions(source, target, "square", 4).size, 25);
});

test("动画引用区分格子特效、等级覆盖和奥义全屏特效", () => {
  const external = createMartialDefinition("external", "拳");
  external.animation = "hit";
  external.levelOverrides.push({ level: 10, animation: "hit2" });
  const legend = createMartialDefinition("legend", "奥");
  legend.animation = "screen";
  const refs = collectAnimationReferences({ external: [external], internal: [], special: [], legend: [legend] });
  assert.deepEqual(refs.map((entry) => entry.role), ["命中特效", "等级覆盖特效", "奥义全屏特效"]);
});

test("排序不越界且不修改原数组", () => {
  const values = [{ id: "甲", custom: true }, { id: "乙" }];
  const moved = moveEntry(values, 1, -1);
  assert.deepEqual(moved.map((entry) => entry.id), ["乙", "甲"]);
  assert.equal(moved[1].custom, true);
  assert.equal(moveEntry(values, 0, -1), values);
});

test("诊断缺失表现资源和重复嵌套招式", () => {
  const record = createMartialDefinition("external", "拳");
  record.icon = "missing-icon";
  record.audio = "missing-audio";
  record.animation = "bad-animation";
  record.formSkills.push(createFormSkill("重复招式"));
  const issues = getMartialIssues({ kind: "external", record }, {
    animationIds: new Set(["bad-animation"]),
    invalidAnimationIds: new Set(["bad-animation"]),
    iconExists: () => false,
    formIdCounts: new Map([["重复招式", 2]]),
  });
  assert.ok(issues.some((issue) => issue.includes("图标资产不存在")));
  assert.ok(issues.some((issue) => issue.includes("音效资源不存在")));
  assert.ok(issues.some((issue) => issue.includes("无法在 Web 预览")));
  assert.ok(issues.some((issue) => issue.includes("招式 ID 重复")));
});

test("新建模板只生成运行时已有字段", () => {
  const sword = createMartialFromTemplate("external", "external-line", "新剑法");
  assert.equal(sword.type, "jianfa");
  assert.equal(sword.targeting.impactType, "line");
  assert.equal(sword.targeting.impactSize, 4);
  const internal = createMartialFromTemplate("internal", "internal-form", "新内功");
  assert.equal(internal.formSkills.length, 1);
  assert.equal(internal.formSkills[0].powerExtra, 2);
  const special = createMartialFromTemplate("special", "special-self", "新绝技");
  assert.equal(special.targeting.canTargetSelf, true);
  assert.deepEqual(special.effects, []);
});

test("自动内力估算与 SkillHelper 公式一致", () => {
  const single = createMartialFromTemplate("external", "external-single", "拳");
  assert.equal(estimateExternalMpCost(single, 1), 48);
  const line = createMartialFromTemplate("external", "external-line", "剑");
  assert.equal(estimateExternalMpCost(line, 1), 43);
});

test("完成度提示指出绝技必须配置实际效果", () => {
  const special = createMartialFromTemplate("special", "special-target", "医术");
  const rules = getMartialReadiness("special", special).find((item) => item.id === "rules");
  assert.equal(rules.complete, false);
  special.effects.push(createSpecialEffect("add_hp"));
  assert.equal(getMartialReadiness("special", special).find((item) => item.id === "rules").complete, true);
});

test("武学资源选择器可按 ID、名称和路径搜索", () => {
  const entries = [
    { id: "拳法", name: "拳法图标", path: "art/icon/quanzhang.png" },
    { id: "音效.剑", name: "挥剑", path: "audio/sword.wav" },
  ];
  assert.deepEqual(filterMartialResources(entries, "quanzhang").map((item) => item.id), ["拳法"]);
  assert.deepEqual(filterMartialResources(entries, "挥剑").map((item) => item.id), ["音效.剑"]);
  assert.equal(filterMartialResources(entries, "").length, 2);
});
