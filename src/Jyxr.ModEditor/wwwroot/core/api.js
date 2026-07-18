export class EditorApiError extends Error {
  constructor(message, { status = 0, url = "", body = null } = {}) {
    super(message);
    this.name = "EditorApiError";
    this.status = status;
    this.url = url;
    this.body = body;
  }
}

export function createEditorApi({ getActiveModId, fetchImpl = window.fetch.bind(window) }) {
  function withActiveMod(url) {
    const activeModId = getActiveModId?.() || "";
    if (!url.startsWith("/api/") || url.startsWith("/api/workspace") || !activeModId) {
      return url;
    }

    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}modId=${encodeURIComponent(activeModId)}`;
  }

  async function requestJson(url, options) {
    const requestUrl = withActiveMod(url);
    const response = await fetchImpl(requestUrl, options);
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new EditorApiError(body?.message || response.statusText, {
        status: response.status,
        url: requestUrl,
        body,
      });
    }

    return body;
  }

  return { requestJson, withActiveMod };
}
