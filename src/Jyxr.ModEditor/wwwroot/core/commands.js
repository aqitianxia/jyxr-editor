export function createCommandRegistry() {
  const commands = new Map();
  const shortcuts = new Map();

  function register(id, execute, { shortcut = "", when = null } = {}) {
    commands.set(id, { execute, when });
    if (shortcut) {
      shortcuts.set(normalizeShortcut(shortcut), id);
    }
    return () => {
      commands.delete(id);
      for (const [key, commandId] of shortcuts) {
        if (commandId === id) {
          shortcuts.delete(key);
        }
      }
    };
  }

  function execute(id, detail) {
    const command = commands.get(id);
    if (!command || (command.when && !command.when(detail))) {
      return false;
    }
    command.execute(detail);
    return true;
  }

  function handleKeydown(event) {
    const shortcut = shortcutFromEvent(event);
    const commandId = shortcuts.get(shortcut);
    if (!commandId || !canExecute(commandId, event)) {
      return false;
    }
    event.preventDefault();
    return execute(commandId, event);
  }

  function canExecute(id, detail) {
    const command = commands.get(id);
    return Boolean(command) && (!command.when || command.when(detail));
  }

  return { register, execute, canExecute, handleKeydown };
}

function shortcutFromEvent(event) {
  const parts = [];
  if (event.metaKey || event.ctrlKey) parts.push("mod");
  if (event.shiftKey) parts.push("shift");
  if (event.altKey) parts.push("alt");
  parts.push(event.key.toLowerCase());
  return parts.join("+");
}

function normalizeShortcut(shortcut) {
  return shortcut.toLowerCase().replaceAll(" ", "");
}
