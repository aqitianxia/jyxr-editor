const workspaceModes = new Set(["home", "problems", "characters", "items", "data", "story", "assets"]);

export function normalizeWorkspaceMode(mode) {
  return workspaceModes.has(mode) ? mode : "home";
}

export function createWorkspaceRoute({ mode = "home", path = "" } = {}) {
  return Object.freeze({
    mode: normalizeWorkspaceMode(mode),
    path: String(path || ""),
  });
}

export function isSameWorkspaceRoute(left, right) {
  const leftRoute = createWorkspaceRoute(left);
  const rightRoute = createWorkspaceRoute(right);
  return leftRoute.mode === rightRoute.mode && leftRoute.path === rightRoute.path;
}
