import { summarizeProblems } from "../core/problems.js?v=20260711-core-17";

export function renderProjectHome(container, model, actions = {}) {
  container.replaceChildren();
  const summary = summarizeProblems(model.problems);

  const hero = document.createElement("section");
  hero.className = "project-hero";
  const heroCopy = document.createElement("div");
  heroCopy.className = "project-hero-copy";
  const eyebrow = document.createElement("div");
  eyebrow.className = "workspace-eyebrow";
  eyebrow.textContent = "MOD 项目首页";
  const title = document.createElement("h1");
  title.textContent = model.mod?.name || model.mod?.id || "当前 MOD";
  const description = document.createElement("p");
  description.textContent = model.mod?.description || "从快速入口开始制作内容，复杂数据仍可在高级数据中完整编辑。";
  const metadataSupported = Boolean(
    model.mod
    && Object.prototype.hasOwnProperty.call(model.mod, "author")
    && Object.prototype.hasOwnProperty.call(model.mod, "date"));
  const meta = document.createElement("div");
  meta.className = "project-meta";
  meta.append(
    createMeta("ID", model.mod?.id || "-"),
    createMeta("版本", model.mod?.version || "未填写"),
    createMeta("作者", metadataSupported ? model.mod.author || "未填写" : "服务未刷新", metadataSupported ? "" : "warning"),
    createMeta("日期", metadataSupported ? model.mod.date || "未填写" : "服务未刷新", metadataSupported ? "" : "warning"),
    createMeta("数据目录", model.mod?.dataExists ? "可用" : "缺失", model.mod?.dataExists ? "ok" : "error"),
  );
  heroCopy.append(eyebrow, title, description, meta);
  if (model.mod && !metadataSupported) {
    const notice = document.createElement("div");
    notice.className = "project-service-notice";
    notice.textContent = "当前页面连接的仍是旧版编辑器服务。请重启编辑器服务后刷新页面，才能读取 mod.json 中的作者和日期。";
    heroCopy.appendChild(notice);
  }

  const health = document.createElement("button");
  health.type = "button";
  health.className = `project-health ${summary.error > 0 ? "error" : summary.warning > 0 ? "warning" : "ok"}`;
  health.addEventListener("click", () => actions.openProblems?.());
  const healthValue = document.createElement("strong");
  healthValue.textContent = String(summary.total);
  const healthLabel = document.createElement("span");
  healthLabel.textContent = summary.total === 0 ? "当前没有已知问题" : `${summary.error} 错误 · ${summary.warning} 警告 · ${summary.suggestion} 建议`;
  const healthAction = document.createElement("small");
  healthAction.textContent = "打开问题中心";
  health.append(healthValue, healthLabel, healthAction);
  hero.append(heroCopy, health);
  container.appendChild(hero);

  const metrics = document.createElement("section");
  metrics.className = "project-metrics";
  metrics.append(
    createMetric("数据文件", model.dataFileCount, "高级数据中的 JSON 与 Story 文件"),
    createMetric("内容定义", model.definitionCount, "当前索引识别到的定义数量"),
    createMetric("剧情段", model.storyNodeCount, "剧情图谱识别到的节点数量"),
    createMetric("共享资源", model.assetFileCount, "项目 assets 中可浏览的文件"),
  );
  container.appendChild(metrics);

  const layout = document.createElement("div");
  layout.className = "project-home-layout";
  const start = document.createElement("section");
  start.className = "project-section";
  start.appendChild(createSectionHeader("快速开始", "选择想修改的内容；尚未专用化的模块会进入高级数据。"));
  const grid = document.createElement("div");
  grid.className = "quick-start-grid";
  for (const item of model.quickStarts || []) {
    grid.appendChild(createQuickStart(item, actions.openWorkspace));
  }
  start.appendChild(grid);

  const recent = document.createElement("section");
  recent.className = "project-section";
  recent.appendChild(createSectionHeader("最近编辑", "仅保存在浏览器中，不会写入 MOD 数据。"));
  const recentList = document.createElement("div");
  recentList.className = "recent-list";
  if (!model.recentEntries?.length) {
    const empty = document.createElement("div");
    empty.className = "project-empty";
    empty.textContent = "还没有最近编辑记录。打开一个数据文件或资源后会显示在这里。";
    recentList.appendChild(empty);
  } else {
    for (const entry of model.recentEntries) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "recent-item";
      button.addEventListener("click", () => actions.openRecent?.(entry));
      const copy = document.createElement("span");
      copy.className = "recent-copy";
      const label = document.createElement("strong");
      label.textContent = entry.label || entry.path;
      const detail = document.createElement("small");
      detail.textContent = [entry.detail, entry.path].filter(Boolean).join(" · ");
      copy.append(label, detail);
      const arrow = document.createElement("span");
      arrow.className = "recent-arrow";
      arrow.textContent = "→";
      button.append(copy, arrow);
      recentList.appendChild(button);
    }
  }
  recent.appendChild(recentList);
  layout.append(start, recent);
  container.appendChild(layout);
}

function createMeta(label, value, tone = "") {
  const item = document.createElement("span");
  item.className = `project-meta-item ${tone}`.trim();
  item.textContent = `${label}：${value}`;
  return item;
}

function createMetric(label, value, detail) {
  const card = document.createElement("article");
  card.className = "project-metric-card";
  const number = document.createElement("strong");
  number.textContent = value === null || value === undefined ? "按需" : String(value);
  const title = document.createElement("span");
  title.textContent = label;
  const copy = document.createElement("small");
  copy.textContent = detail;
  card.append(number, title, copy);
  return card;
}

function createSectionHeader(title, detail) {
  const header = document.createElement("header");
  header.className = "project-section-header";
  const heading = document.createElement("h2");
  heading.textContent = title;
  const copy = document.createElement("p");
  copy.textContent = detail;
  header.append(heading, copy);
  return header;
}

function createQuickStart(item, openWorkspace) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "quick-start-card";
  button.disabled = item.disabled === true;
  button.addEventListener("click", () => openWorkspace?.(item));
  const icon = document.createElement("span");
  icon.className = "quick-start-icon";
  icon.textContent = item.icon || "◇";
  const copy = document.createElement("span");
  copy.className = "quick-start-copy";
  const title = document.createElement("strong");
  title.textContent = item.label;
  const detail = document.createElement("small");
  detail.textContent = item.detail;
  copy.append(title, detail);
  const state = document.createElement("span");
  state.className = `quick-start-state ${item.available === false ? "planned" : "available"}`;
  state.textContent = item.available === false ? "高级数据" : "打开";
  button.append(icon, copy, state);
  return button;
}
