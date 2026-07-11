import { filterProblems, getProblemFilterOptions, summarizeProblems } from "../core/problems.js?v=20260711-core-17";
import { bindImeSafeInput } from "../core/input-composition.js?v=20260711-core-17";

const severityLabels = Object.freeze({ error: "错误", warning: "警告", suggestion: "建议" });

export function renderProblemCenter(container, model, actions = {}) {
  container.replaceChildren();
  const problems = model.problems || [];
  const summary = summarizeProblems(problems);
  const filtered = filterProblems(problems, model.filters);
  const options = getProblemFilterOptions(problems);

  const header = document.createElement("header");
  header.className = "problem-center-header";
  const copy = document.createElement("div");
  const eyebrow = document.createElement("div");
  eyebrow.className = "workspace-eyebrow";
  eyebrow.textContent = "质量检查";
  const title = document.createElement("h1");
  title.textContent = "问题中心";
  const detail = document.createElement("p");
  detail.textContent = "统一查看正式内容校验、索引、剧情、头像和当前表单的辅助检查结果。";
  copy.append(eyebrow, title, detail);
  const runButton = document.createElement("button");
  runButton.type = "button";
  runButton.className = "button primary";
  runButton.textContent = model.checking ? "正在检查…" : "重新检查";
  runButton.disabled = model.checking === true;
  runButton.addEventListener("click", () => actions.runChecks?.());
  header.append(copy, runButton);
  container.appendChild(header);

  const metrics = document.createElement("div");
  metrics.className = "problem-summary-grid";
  metrics.append(
    createSummary("全部", summary.total, "all", model.filters.severity, actions.setSeverity),
    createSummary("错误", summary.error, "error", model.filters.severity, actions.setSeverity),
    createSummary("警告", summary.warning, "warning", model.filters.severity, actions.setSeverity),
    createSummary("建议", summary.suggestion, "suggestion", model.filters.severity, actions.setSeverity),
  );
  container.appendChild(metrics);

  const filters = document.createElement("div");
  filters.className = "problem-filters";
  const search = document.createElement("input");
  search.type = "search";
  search.className = "problem-query";
  search.placeholder = "搜索问题、文件或对象 ID";
  search.value = model.filters.query || "";
  bindImeSafeInput(search, (value) => {
    const cursor = search.selectionStart ?? value.length;
    actions.setFilter?.("query", value);
    requestAnimationFrame(() => {
      const nextSearch = container.querySelector(".problem-query");
      nextSearch?.focus();
      nextSearch?.setSelectionRange(cursor, cursor);
    });
  });
  const typeSelect = createSelect("内容类型", model.filters.contentType, options.contentTypes);
  typeSelect.addEventListener("change", () => actions.setFilter?.("contentType", typeSelect.value));
  const sourceSelect = createSelect("问题来源", model.filters.source, options.sources);
  sourceSelect.addEventListener("change", () => actions.setFilter?.("source", sourceSelect.value));
  filters.append(search, typeSelect, sourceSelect);
  container.appendChild(filters);

  const resultMeta = document.createElement("div");
  resultMeta.className = "problem-result-meta";
  resultMeta.textContent = `显示 ${filtered.length} / ${summary.total} 条${model.lastCheckedAt ? ` · 最近检查 ${formatTime(model.lastCheckedAt)}` : " · 尚未完成项目检查"}`;
  container.appendChild(resultMeta);

  const list = document.createElement("div");
  list.className = "problem-center-list";
  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "problem-center-empty";
    empty.textContent = summary.total === 0
      ? "当前没有已收集的问题。可以点击“重新检查”刷新正式校验和头像检查。"
      : "没有符合当前筛选条件的问题。";
    list.appendChild(empty);
  } else {
    for (const problem of filtered) {
      list.appendChild(createProblemRow(problem, actions.locateProblem));
    }
  }
  container.appendChild(list);
}

function createSummary(label, value, severity, activeSeverity, setSeverity) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `problem-summary-card ${severity} ${activeSeverity === severity ? "active" : ""}`.trim();
  button.addEventListener("click", () => setSeverity?.(severity));
  const number = document.createElement("strong");
  number.textContent = String(value);
  const copy = document.createElement("span");
  copy.textContent = label;
  button.append(number, copy);
  return button;
}

function createSelect(allLabel, value, options) {
  const select = document.createElement("select");
  const all = document.createElement("option");
  all.value = "all";
  all.textContent = allLabel;
  select.appendChild(all);
  for (const option of options) {
    const node = document.createElement("option");
    node.value = option.value;
    node.textContent = option.label;
    select.appendChild(node);
  }
  select.value = value || "all";
  return select;
}

function createProblemRow(problem, locateProblem) {
  const row = document.createElement("article");
  row.className = `problem-center-row ${problem.severity}`;
  const badge = document.createElement("span");
  badge.className = `problem-severity ${problem.severity}`;
  badge.textContent = severityLabels[problem.severity] || "警告";
  const body = document.createElement("div");
  body.className = "problem-row-body";
  const message = document.createElement("strong");
  message.textContent = problem.message;
  const meta = document.createElement("div");
  meta.className = "problem-row-meta";
  meta.textContent = [
    problem.sourceLabel,
    problem.contentTypeLabel,
    problem.location?.definitionId,
    problem.location?.path ? `${problem.location.path}${problem.location.line ? `:${problem.location.line}` : ""}` : "",
  ].filter(Boolean).join(" · ");
  body.append(message, meta);
  if (problem.detail) {
    const details = document.createElement("details");
    details.className = "problem-technical-detail";
    const summary = document.createElement("summary");
    summary.textContent = "技术详情";
    const detail = document.createElement("pre");
    detail.textContent = problem.detail;
    details.append(summary, detail);
    body.appendChild(details);
  }
  const action = document.createElement("button");
  action.type = "button";
  action.className = "button secondary";
  action.textContent = problem.canLocate ? "定位" : "仅供参考";
  action.disabled = !problem.canLocate;
  action.addEventListener("click", () => locateProblem?.(problem));
  row.append(badge, body, action);
  return row;
}

function formatTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}
