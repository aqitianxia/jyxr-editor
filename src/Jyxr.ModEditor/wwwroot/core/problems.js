const supportedSeverities = new Set(["error", "warning", "suggestion"]);

export function normalizeProblemSeverity(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "warn") {
    return "warning";
  }
  if (normalized === "info" || normalized === "hint") {
    return "suggestion";
  }
  return supportedSeverities.has(normalized) ? normalized : "warning";
}

export function createProblem({
  id,
  severity = "warning",
  source = "editor",
  sourceLabel = "编辑器检查",
  contentType = "general",
  contentTypeLabel = "通用",
  message,
  detail = "",
  location = null,
}) {
  const normalizedLocation = location
    ? Object.freeze({
      workspace: String(location.workspace || "data"),
      path: String(location.path || ""),
      line: Number.isFinite(Number(location.line)) ? Math.max(1, Number(location.line)) : null,
      column: Number.isFinite(Number(location.column)) ? Math.max(1, Number(location.column)) : null,
      definitionId: String(location.definitionId || ""),
      definitionTypes: Array.isArray(location.definitionTypes) ? [...location.definitionTypes] : [],
    })
    : null;

  return Object.freeze({
    id: String(id || `${source}:${contentType}:${message}`),
    severity: normalizeProblemSeverity(severity),
    source: String(source),
    sourceLabel: String(sourceLabel),
    contentType: String(contentType),
    contentTypeLabel: String(contentTypeLabel),
    message: String(message || "未知问题"),
    detail: String(detail || ""),
    location: normalizedLocation,
    canLocate: Boolean(normalizedLocation && (normalizedLocation.path || normalizedLocation.definitionId)),
  });
}

export function summarizeProblems(problems) {
  const summary = { total: 0, error: 0, warning: 0, suggestion: 0 };
  for (const problem of problems || []) {
    const severity = normalizeProblemSeverity(problem?.severity);
    summary.total += 1;
    summary[severity] += 1;
  }
  return Object.freeze(summary);
}

export function filterProblems(problems, filters = {}) {
  const severity = String(filters.severity || "all");
  const contentType = String(filters.contentType || "all");
  const source = String(filters.source || "all");
  const query = String(filters.query || "").trim().toLowerCase();

  return (problems || []).filter((problem) => {
    if (severity !== "all" && problem.severity !== severity) {
      return false;
    }
    if (contentType !== "all" && problem.contentType !== contentType) {
      return false;
    }
    if (source !== "all" && problem.source !== source) {
      return false;
    }
    if (!query) {
      return true;
    }

    const searchText = [
      problem.message,
      problem.detail,
      problem.sourceLabel,
      problem.contentTypeLabel,
      problem.location?.path,
      problem.location?.definitionId,
    ].filter(Boolean).join(" ").toLowerCase();
    return searchText.includes(query);
  });
}

export function getProblemFilterOptions(problems) {
  const contentTypes = new Map();
  const sources = new Map();
  for (const problem of problems || []) {
    contentTypes.set(problem.contentType, problem.contentTypeLabel);
    sources.set(problem.source, problem.sourceLabel);
  }
  return {
    contentTypes: Array.from(contentTypes, ([value, label]) => ({ value, label }))
      .sort((left, right) => left.label.localeCompare(right.label, "zh-Hans-CN")),
    sources: Array.from(sources, ([value, label]) => ({ value, label }))
      .sort((left, right) => left.label.localeCompare(right.label, "zh-Hans-CN")),
  };
}
