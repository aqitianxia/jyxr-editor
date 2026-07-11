import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzeGrowthTemplate,
  createGrowthTemplate,
  ensureGrowthTemplateShape,
  getGrowthProjection,
  getGrowthTemplateIssues,
} from "../wwwroot/domain/growth-templates.js";

test("新建成长模板只生成运行时已有字段", () => {
  const record = createGrowthTemplate("新剑客", "sword");
  assert.deepEqual(Object.keys(record), ["id", "name", "statGrowth"]);
  assert.equal(record.statGrowth.jianfa, 4);
  assert.equal(record.statGrowth.daofa, 0);
});

test("补齐结构不会删除未知字段", () => {
  const record = { id: "自定义", custom: { note: true } };
  assert.equal(ensureGrowthTemplateShape(record), record);
  assert.deepEqual(record.custom, { note: true });
  assert.deepEqual(record.statGrowth, {});
});

test("等级预览区分升级属性和武学点容量", () => {
  const record = createGrowthTemplate("普通", "balanced");
  const level10 = getGrowthProjection(record, 10);
  assert.equal(level10.gains.bili, 9);
  assert.equal(level10.gains.max_hp, 1080);
  assert.equal(level10.gains.wuxue, 100);
});

test("模板分析识别专精方向和相对默认差异", () => {
  const baseline = createGrowthTemplate("default", "balanced");
  const sword = createGrowthTemplate("剑客", "sword");
  const analysis = analyzeGrowthTemplate(sword, baseline);
  assert.equal(analysis.role, "剑法专精");
  assert.ok(analysis.improvements.some((item) => item.key === "jianfa"));
  assert.ok(analysis.reductions.some((item) => item.key === "daofa"));
});

test("静态诊断报告缺字段、负数和重复 ID", () => {
  const record = { id: "重复", name: "", statGrowth: { bili: -1 } };
  const issues = getGrowthTemplateIssues(record, { idCounts: new Map([["重复", 2]]) });
  assert.ok(issues.includes("缺少显示名称"));
  assert.ok(issues.includes("模板 ID 重复"));
  assert.ok(issues.includes("臂力不能小于 0"));
  assert.ok(issues.some((issue) => issue.includes("气血上限")));
});
