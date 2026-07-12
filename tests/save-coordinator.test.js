import assert from "node:assert/strict";
import test from "node:test";
import { createSaveCoordinator } from "../wwwroot/core/save-coordinator.js";

function createHarness() {
  const requests = [];
  const refreshes = [];
  const coordinator = createSaveCoordinator({
    requestJson: async (path, options) => {
      requests.push({ path, options });
      return { content: "saved" };
    },
    refreshContent: async (scope) => { refreshes.push(scope); },
  });
  return { coordinator, requests, refreshes };
}

test("普通 JSON 保存只刷新内容索引", async () => {
  const { coordinator, requests, refreshes } = createHarness();

  await coordinator.saveJson("items.json", "[]");

  assert.equal(requests[0].path, "/api/data/file");
  assert.deepEqual(JSON.parse(requests[0].options.body), { path: "items.json", content: "[]" });
  assert.deepEqual(refreshes, [{ storyChanged: false }]);
});

test("剧情保存显式刷新剧情图", async () => {
  const { coordinator, requests, refreshes } = createHarness();

  await coordinator.saveStorySource({ path: "story/main.story", content: "# main", compiledJson: "{}" });

  assert.equal(requests[0].path, "/api/story/source");
  assert.deepEqual(refreshes, [{ storyChanged: true }]);
});

test("批量写入不会在每个文件后自动刷新", async () => {
  const { coordinator, requests, refreshes } = createHarness();

  await coordinator.writeJson("external-skills.json", "[]");
  await coordinator.writeJson("internal-skills.json", "[]");

  assert.equal(requests.length, 2);
  assert.deepEqual(refreshes, []);
});
