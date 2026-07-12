import { bindImeSafeInput } from "../core/input-composition.js?v=20260711-core-17";
import { isAudioAsset, isImageAsset, resourceKinds } from "../domain/resource-catalog.js?v=20260711-stage5b-1";
import { bindScrollMemory } from "../ui/scroll-memory.js?v=20260711-scroll-1";

const el = (tag, className = "", text = "") => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
};

function preview(path, kind, label, className) {
  const frame = el("span", className);
  if (path && kind === resourceKinds.image) {
    const image = document.createElement("img");
    image.src = `/api/assets/file?path=${encodeURIComponent(path)}`;
    image.alt = label;
    image.loading = "lazy";
    image.addEventListener("error", () => image.replaceWith(el("span", "resource-preview-placeholder", "图片读取失败")), { once: true });
    frame.appendChild(image);
  } else {
    frame.appendChild(el("span", "resource-preview-placeholder", kind === resourceKinds.audio ? "音频" : kind === resourceKinds.text ? "文本" : "资源"));
  }
  return frame;
}

function statusOf(item) {
  if (item.duplicate) return { value: "duplicate", label: "重复 ID", tone: "bad" };
  if (item.contract.assetBacked && !item.assetExists) return { value: "missing", label: "资产缺失", tone: "bad" };
  if (item.references.length === 0) return { value: "unreferenced", label: "未发现引用", tone: "muted" };
  return { value: "ok", label: item.kind === resourceKinds.text ? "文本资源" : "可用", tone: "ok" };
}

function renderResourceDetail(parent, item, onOpenDefinition) {
  if (!item) {
    parent.appendChild(el("div", "resource-empty", "选择一条资源查看详情。"));
    return;
  }
  parent.appendChild(preview(item.assetExists ? item.assetPath : "", item.kind, item.id, "resource-detail-preview"));
  parent.append(el("h2", "", item.id || `未命名记录 #${item.sourceIndex + 1}`));
  const status = statusOf(item);
  parent.appendChild(el("div", `resource-status ${status.tone}`, status.label));
  const fields = [["资源组", item.group || "未设置"], ["类型", item.kind], ["value", item.value || "未设置"], ["真实资产", item.assetPath || "不适用或未解析"]];
  for (const [label, value] of fields) {
    const row = el("div", "resource-detail-field");
    row.append(el("span", "", label), el("code", "", value));
    parent.appendChild(row);
  }
  const open = el("button", "button secondary", "在高级数据中打开定义");
  open.type = "button";
  open.disabled = !item.id;
  open.addEventListener("click", () => onOpenDefinition(item.id));
  parent.appendChild(open);
  parent.appendChild(el("h3", "", `静态引用位置 ${item.references.length}`));
  const note = el("p", "resource-detail-note", "仅统计 portrait、picture、icon、image、background、music 等明确资源字段；动态剧情参数不在此范围。 ");
  parent.appendChild(note);
  if (!item.references.length) parent.appendChild(el("div", "resource-empty compact", "当前字段感知索引未发现引用。"));
  for (const reference of item.references) {
    const row = el("div", "resource-reference-row");
    row.append(el("strong", "", reference.ownerDefinitionId || reference.path), el("code", "", `${reference.path} · ${reference.fieldPath}`));
    parent.appendChild(row);
  }
}

function renderAssetDetail(parent, item) {
  if (!item) {
    parent.appendChild(el("div", "resource-empty", "选择一个资产文件查看详情。"));
    return;
  }
  const kind = isImageAsset(item.path) ? resourceKinds.image : isAudioAsset(item.path) ? resourceKinds.audio : resourceKinds.unknown;
  if (kind === resourceKinds.audio) {
    const audio = document.createElement("audio"); audio.controls = true; audio.src = `/api/assets/file?path=${encodeURIComponent(item.path)}`; parent.appendChild(audio);
  } else parent.appendChild(preview(item.path, kind, item.name, "resource-detail-preview"));
  parent.append(el("h2", "", item.name), el("code", "resource-asset-path", item.path));
  parent.appendChild(el("div", `resource-status ${item.resourceIds.length ? "ok" : "muted"}`, item.resourceIds.length ? `已由 ${item.resourceIds.length} 条资源使用` : "未注册资产"));
  for (const id of item.resourceIds) parent.appendChild(el("div", "resource-reference-row", id));
}

export function renderResourcesWorkspace(container, { state, catalog, assets, onChange, onOpenDefinition }) {
  const ws = state.resourceWorkspace;
  container.replaceChildren();
  const header = el("header", "resource-workspace-header");
  const heading = el("div"); heading.append(el("h1", "", "资源管理"), el("p", "", "查看资源定义、共享资产和静态引用；当前阶段只读。"));
  const tabs = el("div", "segmented-control");
  for (const [value, label] of [["resources", "已注册资源"], ["assets", "原始资产"]]) {
    const button = el("button", ws.tab === value ? "active" : "", label); button.type = "button"; button.addEventListener("click", () => onChange("tab", value)); tabs.appendChild(button);
  }
  header.append(heading, tabs); container.appendChild(header);
  const tools = el("div", "resource-workspace-tools");
  const search = el("input", "search resource-workspace-search"); search.type = "search"; search.value = ws.search; search.placeholder = ws.tab === "resources" ? "搜索资源 ID、组、value 或引用位置" : "搜索资产文件名或路径";
  bindImeSafeInput(search, (value) => onChange("search", value, { restoreFocus: true })); tools.appendChild(search);
  if (ws.tab === "resources") {
    const group = el("select", "input"); group.append(new Option("全部资源组", "all"));
    for (const name of [...new Set(catalog.map((item) => item.group))].sort((a, b) => a.localeCompare(b, "zh-CN"))) group.append(new Option(name || "未分组", name));
    group.value = ws.group; group.addEventListener("change", () => onChange("group", group.value));
    const status = el("select", "input"); for (const [value, label] of [["all", "全部状态"], ["ok", "可用/文本"], ["missing", "资产缺失"], ["duplicate", "重复 ID"], ["unreferenced", "未发现引用"]]) status.append(new Option(label, value));
    status.value = ws.status; status.addEventListener("change", () => onChange("status", status.value)); tools.append(group, status);
  }
  container.appendChild(tools);
  const query = ws.search.trim().toLocaleLowerCase("zh-CN");
  const layout = el("div", "resource-workspace-layout"); const list = el("div", "resource-workspace-list"); const detail = el("aside", "resource-workspace-detail");
  if (ws.tab === "resources") {
    const visible = catalog.filter((item) => (ws.group === "all" || item.group === ws.group) && (ws.status === "all" || statusOf(item).value === ws.status)
      && (!query || [item.id, item.group, item.value, item.assetPath, ...item.references.flatMap((ref) => [ref.path, ref.fieldPath, ref.ownerDefinitionId])].join(" ").toLocaleLowerCase("zh-CN").includes(query)));
    const shown = visible.slice(0, 400); const summary = el("div", "resource-list-summary", `显示 ${shown.length} / ${visible.length}，全部 ${catalog.length}`); list.appendChild(summary);
    for (const item of shown) {
      const key = `${item.id}\u0000${item.sourceIndex}`; const row = el("button", "resource-list-row"); row.type = "button"; row.classList.toggle("active", ws.selectedKey === key);
      row.append(preview(item.assetExists ? item.assetPath : "", item.kind, item.id, "resource-list-preview"));
      const copy = el("span", "resource-list-copy"); copy.append(el("strong", "", item.id || `未命名 #${item.sourceIndex + 1}`), el("small", "", `${item.group || "未分组"} · ${item.value || "未设置 value"}`)); row.append(copy);
      const status = statusOf(item); row.append(el("span", `resource-status ${status.tone}`, status.label)); row.addEventListener("click", () => onChange("selectedKey", key)); list.appendChild(row);
    }
    if (!shown.length) list.appendChild(el("div", "resource-empty", "没有符合筛选条件的资源。"));
    const selected = catalog.find((item) => `${item.id}\u0000${item.sourceIndex}` === ws.selectedKey) || shown[0]; renderResourceDetail(detail, selected, onOpenDefinition);
  } else {
    const visible = assets.filter((item) => !query || `${item.name} ${item.path}`.toLocaleLowerCase("zh-CN").includes(query)).slice(0, 400);
    list.appendChild(el("div", "resource-list-summary", `显示 ${visible.length} / ${assets.length}`));
    for (const item of visible) {
      const row = el("button", "resource-list-row"); row.type = "button"; row.classList.toggle("active", ws.selectedKey === item.path);
      const kind = isImageAsset(item.path) ? resourceKinds.image : isAudioAsset(item.path) ? resourceKinds.audio : resourceKinds.unknown;
      row.append(preview(item.path, kind, item.name, "resource-list-preview")); const copy = el("span", "resource-list-copy"); copy.append(el("strong", "", item.name), el("small", "", item.path)); row.append(copy, el("span", `resource-status ${item.resourceIds.length ? "ok" : "muted"}`, item.resourceIds.length ? `${item.resourceIds.length} 条资源` : "未注册")); row.addEventListener("click", () => onChange("selectedKey", item.path)); list.appendChild(row);
    }
    if (!visible.length) list.appendChild(el("div", "resource-empty", "没有符合搜索条件的资产。")); renderAssetDetail(detail, assets.find((item) => item.path === ws.selectedKey) || visible[0]);
  }
  layout.append(list, detail); container.appendChild(layout);
  bindScrollMemory(list, state.workspaceScrollPositions, `resources:list:${ws.tab}`);
}
