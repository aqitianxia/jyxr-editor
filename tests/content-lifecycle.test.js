import assert from "node:assert/strict";
import test from "node:test";
import { createContentLifecycle } from "../wwwroot/core/content-lifecycle.js";

function createHarness() {
  const state = {
    assetFiles: [],
    assetFilePathSet: new Set(),
    assetsLoaded: false,
    storyGraph: null,
    storyGraphLoaded: false,
  };
  const calls = { data: 0, index: 0, assets: 0, story: 0 };
  const lifecycle = createContentLifecycle({
    state,
    loadDataFiles: async () => { calls.data += 1; },
    rebuildContentIndex: async () => { calls.index += 1; },
    loadAssetFiles: async () => { calls.assets += 1; state.assetsLoaded = true; },
    loadStoryGraph: async () => { calls.story += 1; state.storyGraphLoaded = true; },
  });
  return { state, calls, lifecycle };
}

test("普通内容刷新不会加载资产或剧情图", async () => {
  const { calls, lifecycle } = createHarness();

  await lifecycle.refresh();

  assert.deepEqual(calls, { data: 1, index: 1, assets: 0, story: 0 });
});

test("变化的可选数据只在已经加载后刷新", async () => {
  const { state, calls, lifecycle } = createHarness();

  await lifecycle.refresh({ assetsChanged: true, storyChanged: true });
  assert.deepEqual(calls, { data: 1, index: 1, assets: 0, story: 0 });

  await Promise.all([lifecycle.ensureAssets(), lifecycle.ensureStoryGraph()]);
  await lifecycle.refresh({ assetsChanged: true, storyChanged: true });

  assert.equal(state.assetsLoaded, true);
  assert.equal(state.storyGraphLoaded, true);
  assert.deepEqual(calls, { data: 2, index: 2, assets: 2, story: 2 });
});

test("并发按需加载复用同一个请求", async () => {
  const { calls, lifecycle } = createHarness();

  await Promise.all([lifecycle.ensureAssets(), lifecycle.ensureAssets(), lifecycle.ensureAssets()]);

  assert.equal(calls.assets, 1);
});
