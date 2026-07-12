export function createContentLifecycle({
  state,
  loadDataFiles,
  rebuildContentIndex,
  loadAssetFiles,
  loadStoryGraph,
}) {
  let assetLoadPromise = null;
  let storyGraphLoadPromise = null;

  const ensureAssets = () => {
    if (state.assetsLoaded) return Promise.resolve();
    if (!assetLoadPromise) {
      assetLoadPromise = loadAssetFiles().finally(() => {
        assetLoadPromise = null;
      });
    }
    return assetLoadPromise;
  };

  const ensureStoryGraph = () => {
    if (state.storyGraphLoaded) return Promise.resolve();
    if (!storyGraphLoadPromise) {
      storyGraphLoadPromise = loadStoryGraph().finally(() => {
        storyGraphLoadPromise = null;
      });
    }
    return storyGraphLoadPromise;
  };

  const refresh = async ({ assetsChanged = false, storyChanged = false } = {}) => {
    if (storyChanged && !state.storyGraphLoaded) state.storyGraph = null;

    const refreshes = [loadDataFiles(), rebuildContentIndex()];
    if (assetsChanged && state.assetsLoaded) refreshes.push(loadAssetFiles());
    if (storyChanged && state.storyGraphLoaded) refreshes.push(loadStoryGraph());
    await Promise.all(refreshes);
  };

  const resetOptional = () => {
    state.assetFiles = [];
    state.assetFilePathSet = new Set();
    state.assetsLoaded = false;
    state.storyGraph = null;
    state.storyGraphLoaded = false;
    assetLoadPromise = null;
    storyGraphLoadPromise = null;
  };

  return {
    ensureAssets,
    ensureStoryGraph,
    refresh,
    resetOptional,
  };
}
