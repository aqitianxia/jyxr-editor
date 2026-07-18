export function normalizeWorkspacePath(value) {
  let path = String(value || "").trim();
  if (path.length >= 2) {
    const first = path[0];
    const last = path[path.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      path = path.slice(1, -1).trim();
    }
  }

  if (/^[A-Za-z]:[\\/]$/u.test(path) || path === "/") {
    return path;
  }

  return path.replace(/[\\/]+$/u, "");
}

export function normalizeRecentWorkspaces(values, limit = 6) {
  const paths = [];
  for (const value of Array.isArray(values) ? values : []) {
    const path = normalizeWorkspacePath(value);
    if (!path || paths.some((candidate) => candidate.toLowerCase() === path.toLowerCase())) {
      continue;
    }

    paths.push(path);
    if (paths.length >= limit) {
      break;
    }
  }

  return paths;
}

export function rememberWorkspacePath(values, path, limit = 6) {
  return normalizeRecentWorkspaces([path, ...(Array.isArray(values) ? values : [])], limit);
}

export function getWorkspaceName(path) {
  const normalized = normalizeWorkspacePath(path);
  if (!normalized) {
    return "未命名工作区";
  }

  const parts = normalized.split(/[\\/]/u).filter(Boolean);
  return parts.at(-1) || normalized;
}
