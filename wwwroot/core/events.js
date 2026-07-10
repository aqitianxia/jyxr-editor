export function createEventBus() {
  const listeners = new Map();

  function on(type, listener) {
    const typeListeners = listeners.get(type) || new Set();
    typeListeners.add(listener);
    listeners.set(type, typeListeners);
    return () => off(type, listener);
  }

  function off(type, listener) {
    const typeListeners = listeners.get(type);
    typeListeners?.delete(listener);
    if (typeListeners?.size === 0) {
      listeners.delete(type);
    }
  }

  function emit(type, detail) {
    for (const listener of listeners.get(type) || []) {
      listener(detail);
    }
  }

  return { on, off, emit };
}
