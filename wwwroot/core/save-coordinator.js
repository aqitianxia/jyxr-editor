export function createSaveCoordinator({ requestJson, refreshContent }) {
  const writeJson = (path, content) => requestJson("/api/data/file", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, content }),
  });

  const saveJson = async (path, content, { storyChanged = false } = {}) => {
    const result = await writeJson(path, content);
    await refreshContent({ storyChanged });
    return result;
  };

  const saveStorySource = async ({ path, content, compiledJson }) => {
    const result = await requestJson("/api/story/source", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, content, compiledJson }),
    });
    await refreshContent({ storyChanged: true });
    return result;
  };

  const saveStorySourceFromJson = async ({ jsonPath, content, compiledJson }) => {
    const result = await requestJson("/api/story/source/from-json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonPath, content, compiledJson }),
    });
    await refreshContent({ storyChanged: true });
    return result;
  };

  const createStorySource = async ({ fileName, segmentName }) => {
    const result = await requestJson("/api/story/source/new", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName, segmentName }),
    });
    await refreshContent({ storyChanged: true });
    return result;
  };

  return {
    createStorySource,
    saveJson,
    saveStorySource,
    saveStorySourceFromJson,
    writeJson,
  };
}
