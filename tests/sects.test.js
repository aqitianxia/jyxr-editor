import assert from "node:assert/strict";
import test from "node:test";
import { createSectDefinition, ensureSectShape, getSectIssues, matchesSectSearch } from "../wwwroot/domain/sects.js";

test("新建门派只包含运行时字段", () => {
  assert.deepEqual(createSectDefinition("青城派"), {
    id: "青城派", name: "青城派", storyId: "", primaryFocus: "", description: "", portrait: null,
    signatureSkillNames: [], masterNames: [], background: null, traitTags: [],
  });
});

test("结构补齐保留未知字段", () => {
  const record = { id: "测试", custom: { enabled: true } };
  assert.equal(ensureSectShape(record), record);
  assert.deepEqual(record.custom, { enabled: true });
  assert.deepEqual(record.signatureSkillNames, []);
});

test("静态检查定位剧情、资源和武学字段", () => {
  const record = createSectDefinition("测试");
  record.storyId = "缺失剧情";
  record.portrait = "头像.缺失";
  record.signatureSkillNames = ["缺失武学", "缺失武学"];
  record.masterNames = ["门人合称"];
  const issues = getSectIssues(record, {
    idCounts: new Map([["测试", 1]]), storyIds: new Set(), resourceIds: new Set(), skillNames: new Set(), characterNames: new Set(),
  });
  assert.ok(issues.some((issue) => issue.field === "storyId"));
  assert.ok(issues.some((issue) => issue.field === "portrait"));
  assert.ok(issues.some((issue) => issue.field === "signatureSkillNames" && issue.message.includes("不存在")));
  assert.ok(issues.some((issue) => issue.field === "signatureSkillNames" && issue.message.includes("重复")));
  assert.equal(issues.some((issue) => issue.field === "masterNames" && issue.message.includes("不存在")), false);
});

test("搜索覆盖名称、ID、定位和标签", () => {
  const record = { id: "武当派", name: "武当", primaryFocus: "剑法", description: "玄门正宗", traitTags: ["控场"] };
  assert.equal(matchesSectSearch(record, "剑法"), true);
  assert.equal(matchesSectSearch(record, "控场"), true);
  assert.equal(matchesSectSearch(record, "少林"), false);
});
