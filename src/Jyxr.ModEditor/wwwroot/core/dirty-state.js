export const dirtyStateEvents = Object.freeze({
  changed: "dirty-state:changed",
});

export function createDirtyStateController({ state, events, render, confirmDiscard }) {
  function setDirty(dirty, options = {}) {
    const nextDirty = Boolean(dirty);
    const changed = state.dirty !== nextDirty;
    state.dirty = nextDirty;
    if (changed) {
      events?.emit(dirtyStateEvents.changed, { dirty: nextDirty });
    }
    if (options.render !== false) {
      render?.();
    }
    return nextDirty;
  }

  function isDirty() {
    return state.dirty;
  }

  async function confirmDiscardChanges(message = "当前文件尚未保存，是否放弃修改？") {
    if (!isDirty()) {
      return true;
    }

    return Boolean(await confirmDiscard(message));
  }

  return {
    isDirty,
    setDirty,
    markDirty: (options) => setDirty(true, options),
    markClean: (options) => setDirty(false, options),
    confirmDiscardChanges,
  };
}
