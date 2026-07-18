export const dirtyStateEvents = Object.freeze({
  changed: "dirty-state:changed",
});

export function createDirtyStateController({ state, events, render, confirmDiscard }) {
  function setDirty(dirty, options = {}) {
    const nextDirty = Boolean(dirty);
    const changed = state.dirty !== nextDirty;
    state.dirty = nextDirty;
    if (nextDirty) {
      state.dirtyPath = options.path || state.dirtyPath || state.currentPath || "";
      if (options.detail !== undefined) state.dirtyDetail = String(options.detail || "");
    } else {
      state.dirtyPath = "";
      state.dirtyDetail = "";
    }
    if (changed) {
      events?.emit(dirtyStateEvents.changed, {
        dirty: nextDirty,
        path: state.dirtyPath,
        detail: state.dirtyDetail,
      });
    }
    if (options.render !== false) {
      render?.();
    }
    return nextDirty;
  }

  function isDirty() {
    return state.dirty;
  }

  async function confirmDiscardChanges(message = "") {
    if (!isDirty()) {
      return true;
    }

    const path = state.dirtyPath || state.currentPath || "当前文件";
    const detail = state.dirtyDetail ? `（${state.dirtyDetail}）` : "";
    const prompt = message || `“${path}”${detail}有尚未保存的修改。\n\n确定将放弃这些修改并继续，取消则留在当前页面。`;
    return Boolean(await confirmDiscard(prompt));
  }

  return {
    isDirty,
    setDirty,
    markDirty: (options) => setDirty(true, options),
    markClean: (options) => setDirty(false, options),
    confirmDiscardChanges,
  };
}
