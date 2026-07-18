import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDraftStoryGraph,
  buildStoryDocuments,
  buildStoryGraphProjection,
  findJsonDifferences,
  mergeDraftStoryGraph,
  resolveStoryDocument,
} from "../wwwroot/domain/story-workspace.js";

test("剧情目录把 DSL 与编译 JSON 合并为一个文档", () => {
  const files = [
    { path: "story/demo.story", size: 10 },
    { path: "story/demo.story.json", size: 20 },
    { path: "story/legacy.story.json", size: 30 },
  ];
  const graph = {
    nodes: [
      { id: "demo_start", path: "story/demo.story.json", line: 1 },
      { id: "legacy_start", path: "story/legacy.story.json", line: 1 },
    ],
    diagnostics: [],
  };
  const documents = buildStoryDocuments(files, graph);
  assert.deepEqual(documents.map((item) => [item.path, item.sourceKind, item.segments.length]), [
    ["story/demo.story", "dsl", 1],
    ["story/legacy.story.json", "json", 1],
  ]);
});

test("剧情文档恢复优先使用已记忆文档，再回退当前剧情和首项", () => {
  const documents = [
    { path: "story/first.story", sourceKind: "dsl" },
    { path: "story/remembered.story.json", sourceKind: "json" },
    { path: "story/current.story", sourceKind: "dsl" },
  ];

  assert.equal(resolveStoryDocument(documents, "story/remembered.story.json", "story/current.story").path, "story/remembered.story.json");
  assert.equal(resolveStoryDocument(documents, "story/missing.story", "story/current.story").path, "story/current.story");
  assert.equal(resolveStoryDocument(documents, "story/missing.story", "maps.json").path, "story/first.story");
  assert.equal(resolveStoryDocument([], "story/missing.story", "maps.json"), null);
});

test("草稿图谱识别选择组、调用、条件、战斗和跳转", () => {
  const draft = buildDraftStoryGraph({
    version: 2,
    segments: [
      {
        name: "start",
        steps: [
          { kind: "choice", prompt: { speaker: "主角", text: "去哪" }, groups: [
            { options: [{ text: "左", steps: [{ kind: "jump", target: "left" }] }] },
            { when: [">=", ["var", "rank"], 2], options: [
              { text: "右", steps: [{ kind: "battle", battleId: "test", outcomes: { win: [{ kind: "jump", target: "right" }] } }] },
            ] },
          ] },
          { kind: "call", target: "shared" },
        ],
      },
      { name: "left", steps: [] },
      { name: "right", steps: [] },
      { name: "shared", steps: [{ kind: "return" }] },
    ],
  }, { compiledPath: "story/demo.story.json" });
  assert.deepEqual(draft.edges.map((edge) => [edge.toId, edge.label]), [
    ["left", "选择：左"],
    ["right", "战斗 test：win"],
    ["shared", "流程"],
  ]);
  assert.equal(draft.nodes[0].choiceCount, 1);
  assert.equal(draft.nodes[0].battleCount, 1);
  assert.equal(draft.nodes[0].callCount, 1);
  assert.equal(draft.nodes.find((node) => node.id === "shared").returnCount, 1);
  assert.equal(draft.edges.find((edge) => edge.toId === "right").condition, "$rank >= 2");
});

test("草稿覆盖已保存文档但保留其他剧情", () => {
  const graph = {
    nodes: [
      { id: "old", path: "story/demo.story.json" },
      { id: "other", path: "story/other.story.json" },
    ],
    edges: [{ fromId: "old", toId: "other" }, { fromId: "other", toId: "old" }],
  };
  const merged = mergeDraftStoryGraph(graph, {
    nodes: [{ id: "new", path: "story/demo.story.json" }],
    edges: [{ fromId: "new", toId: "other" }],
  }, "story/demo.story.json");
  assert.deepEqual(merged.nodes.map((node) => node.id), ["other", "new"]);
  assert.deepEqual(merged.edges.map((edge) => edge.fromId), ["other", "new"]);
});

test("邻域图只包含当前段落和直接上下游", () => {
  const graph = {
    nodes: ["a", "b", "c", "d"].map((id) => ({ id, groupId: "g", path: "story/a.story.json" })),
    edges: [
      { fromId: "a", toId: "b" },
      { fromId: "b", toId: "c" },
      { fromId: "c", toId: "d" },
    ],
    entrypoints: [],
  };
  const projection = buildStoryGraphProjection(graph, { scope: "neighbors", selectedId: "b" });
  assert.deepEqual(projection.nodes.map((node) => node.id), ["b", "a", "c"]);
  assert.deepEqual(projection.edges.map((edge) => [edge.fromId, edge.toId]), [["a", "b"], ["b", "c"]]);
});

test("流程筛选按问题、入口和完全孤立段落投影", () => {
  const graph = {
    nodes: ["problem", "entry", "isolated", "connected"].map((id) => ({
      id,
      groupId: id === "connected" ? "other" : "main",
      path: "story/a.story.json",
    })),
    edges: [{ fromId: "entry", toId: "connected" }],
    entrypoints: [{ targetId: "entry" }],
    diagnostics: [{ segmentId: "problem", severity: "error" }],
  };

  assert.deepEqual(
    buildStoryGraphProjection(graph, { scope: "file", filter: "issues", documentPath: "story/a.story.json" }).nodes.map((node) => node.id),
    ["problem"],
  );
  assert.deepEqual(
    buildStoryGraphProjection(graph, { scope: "file", filter: "entrypoints", documentPath: "story/a.story.json" }).nodes.map((node) => node.id),
    ["entry"],
  );
  assert.deepEqual(
    buildStoryGraphProjection(graph, { scope: "file", filter: "isolated", documentPath: "story/a.story.json" }).nodes.map((node) => node.id),
    ["problem", "isolated"],
  );
});

test("全库聚合保留流向权重和筛选统计", () => {
  const graph = {
    nodes: [
      { id: "a1", groupId: "a", groupName: "甲" },
      { id: "a2", groupId: "a", groupName: "甲" },
      { id: "b1", groupId: "b", groupName: "乙" },
    ],
    edges: [
      { fromId: "a1", toId: "b1" },
      { fromId: "a2", toId: "b1" },
    ],
    entrypoints: [{ targetId: "a1" }],
    diagnostics: [{ segmentId: "a2" }],
  };
  const projection = buildStoryGraphProjection(graph, { scope: "overview" });
  assert.equal(projection.edges[0].count, 2);
  assert.equal(projection.nodes.find((node) => node.id === "a").issueCount, 1);
  assert.equal(projection.nodes.find((node) => node.id === "a").entrypointCount, 1);
});

test("JSON 无损比较忽略对象字段顺序", () => {
  const result = findJsonDifferences(
    { version: 2, segments: [{ name: "start", steps: [] }] },
    { segments: [{ steps: [], name: "start" }], version: 2 },
  );
  assert.equal(result.equal, true);
  assert.deepEqual(result.differences, []);
});

test("JSON 无损比较报告未知字段、数组顺序和值类型", () => {
  const result = findJsonDifferences(
    { version: 2, extra: true, values: ["a", 2] },
    { version: "2", values: [2, "a"] },
  );
  assert.equal(result.equal, false);
  assert.deepEqual(result.differences.map((item) => [item.path, item.kind]), [
    ["$.version", "type"],
    ["$.extra", "removed"],
    ["$.values[0]", "type"],
    ["$.values[1]", "type"],
  ]);
});

test("JSON 无损比较限制输出但保留完整差异计数", () => {
  const result = findJsonDifferences({ a: 1, b: 2, c: 3 }, {}, { limit: 2 });
  assert.equal(result.total, 3);
  assert.equal(result.differences.length, 2);
  assert.equal(result.truncated, true);
});
