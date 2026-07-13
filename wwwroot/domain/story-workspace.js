const STORY_SOURCE_SUFFIX = ".story";
const STORY_JSON_SUFFIX = ".story.json";

export function isStorySourcePath(path) {
  return typeof path === "string" && path.toLowerCase().endsWith(STORY_SOURCE_SUFFIX);
}

export function isStoryJsonPath(path) {
  return typeof path === "string" && path.toLowerCase().endsWith(STORY_JSON_SUFFIX);
}

export function getCompiledStoryPath(sourcePath) {
  return isStorySourcePath(sourcePath) ? `${sourcePath}.json` : "";
}

export function getStorySourcePath(jsonPath) {
  return isStoryJsonPath(jsonPath) ? jsonPath.slice(0, -".json".length) : "";
}

export function buildStoryDocuments(dataFiles, graph) {
  const files = Array.isArray(dataFiles) ? dataFiles : [];
  const paths = new Set(files.map((file) => file.path));
  const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  const diagnostics = Array.isArray(graph?.diagnostics) ? graph.diagnostics : [];
  const documents = [];

  for (const file of files) {
    if (!isStorySourcePath(file.path)) continue;
    documents.push(createStoryDocument({
      path: file.path,
      compiledPath: getCompiledStoryPath(file.path),
      sourceKind: "dsl",
      size: file.size,
      nodes,
      diagnostics,
    }));
  }

  for (const file of files) {
    if (!isStoryJsonPath(file.path)) continue;
    const sourcePath = getStorySourcePath(file.path);
    if (paths.has(sourcePath)) continue;
    documents.push(createStoryDocument({
      path: file.path,
      compiledPath: file.path,
      sourceKind: "json",
      size: file.size,
      nodes,
      diagnostics,
    }));
  }

  return documents.sort((left, right) =>
    left.sourceKind.localeCompare(right.sourceKind) ||
    left.title.localeCompare(right.title, "zh-Hans-CN"));
}

export function resolveStoryDocument(documents, selectedPath, currentPath) {
  const available = Array.isArray(documents) ? documents : [];
  return available.find((document) => document.path === selectedPath)
    || available.find((document) => document.path === currentPath)
    || available[0]
    || null;
}

function createStoryDocument({ path, compiledPath, sourceKind, size, nodes, diagnostics }) {
  const segments = nodes
    .filter((node) => node.path === compiledPath)
    .sort((left, right) => left.line - right.line || left.id.localeCompare(right.id, "zh-Hans-CN"));
  return {
    path,
    compiledPath,
    sourceKind,
    title: formatStoryDocumentTitle(path),
    size: Number(size) || 0,
    segments,
    diagnosticCount: diagnostics.filter((item) => item.path === compiledPath).length,
  };
}

export function formatStoryDocumentTitle(path) {
  const fileName = String(path || "").split("/").pop() || "剧情";
  if (fileName.toLowerCase().endsWith(STORY_JSON_SUFFIX)) {
    return fileName.slice(0, -STORY_JSON_SUFFIX.length);
  }
  if (fileName.toLowerCase().endsWith(STORY_SOURCE_SUFFIX)) {
    return fileName.slice(0, -STORY_SOURCE_SUFFIX.length);
  }
  return fileName;
}

export function matchesStoryDocument(document, query) {
  const normalized = String(query || "").trim().toLowerCase();
  if (!normalized) return true;
  return [document.title, document.path, ...document.segments.map((segment) => segment.id)]
    .some((value) => String(value || "").toLowerCase().includes(normalized));
}

export function buildDraftStoryGraph(storyJson, { compiledPath, lineBySegment = new Map() } = {}) {
  if (!storyJson || typeof storyJson !== "object" || !Array.isArray(storyJson.segments)) {
    throw new Error("Story JSON 必须包含 segments 数组。");
  }

  const nodes = [];
  const edges = [];
  for (const segment of storyJson.segments) {
    if (!segment || typeof segment !== "object") continue;
    const id = String(segment.name || "").trim();
    if (!id) continue;
    const stats = createStoryStats();
    analyzeStorySteps(segment.steps, id, edges, stats, "流程", "");
    nodes.push({
      id,
      groupId: inferStoryGroupId(id),
      groupName: inferStoryGroupId(id),
      path: compiledPath,
      line: lineBySegment.get(id) || 1,
      ...stats,
      incoming: 0,
      outgoing: 0,
      externalEntrypoints: 0,
    });
  }

  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  for (const edge of edges) {
    const source = nodesById.get(edge.fromId);
    const target = nodesById.get(edge.toId);
    if (source) source.outgoing += 1;
    if (target) target.incoming += 1;
  }
  return { nodes, edges };
}

function createStoryStats() {
  return {
    stepCount: 0,
    dialogueCount: 0,
    commandCount: 0,
    choiceCount: 0,
    branchCount: 0,
    battleCount: 0,
    jumpCount: 0,
    callCount: 0,
    returnCount: 0,
  };
}

function analyzeStorySteps(steps, segmentId, edges, stats, label, condition) {
  if (!Array.isArray(steps)) return;
  for (const step of steps) {
    if (!step || typeof step !== "object") continue;
    stats.stepCount += 1;
    switch (step.kind) {
      case "dialogue":
        stats.dialogueCount += 1;
        break;
      case "command":
        stats.commandCount += 1;
        analyzeStoryCommand(step, segmentId, edges, label, condition);
        break;
      case "jump":
        stats.jumpCount += 1;
        addStoryEdge(edges, segmentId, step.target, "jump", label, condition);
        return;
      case "call":
        stats.callCount += 1;
        addStoryEdge(edges, segmentId, step.target, "call", label, condition);
        break;
      case "return":
        stats.returnCount += 1;
        return;
      case "choice":
        stats.choiceCount += 1;
        for (const group of Array.isArray(step.groups) ? step.groups : []) {
          const groupCondition = Object.prototype.hasOwnProperty.call(group || {}, "when")
            ? formatStoryExpression(group.when)
            : "";
          const effectiveCondition = combineStoryConditions(condition, groupCondition);
          for (const option of Array.isArray(group?.options) ? group.options : []) {
            analyzeStorySteps(option?.steps, segmentId, edges, stats, `选择：${shorten(option?.text)}`, effectiveCondition);
          }
        }
        break;
      case "battle":
        stats.battleCount += 1;
        for (const [outcome, outcomeSteps] of Object.entries(step.outcomes || {})) {
          analyzeStorySteps(outcomeSteps, segmentId, edges, stats, `战斗 ${step.battleId || ""}：${outcome}`, condition);
        }
        break;
      case "branch":
        stats.branchCount += 1;
        for (const branchCase of Array.isArray(step.cases) ? step.cases : []) {
          const branchCondition = formatStoryExpression(branchCase?.when);
          analyzeStorySteps(branchCase?.steps, segmentId, edges, stats, `条件：${shorten(branchCondition)}`, branchCondition);
        }
        analyzeStorySteps(step.fallback, segmentId, edges, stats, "条件都不满足", condition);
        break;
    }
  }
}

function combineStoryConditions(outer, inner) {
  if (!outer) return inner || "";
  if (!inner) return outer;
  return `(${outer}) and (${inner})`;
}

function analyzeStoryCommand(step, segmentId, edges, label, condition) {
  const args = Array.isArray(step.args) ? step.args : [];
  if (step.name === "set_time_key") {
    addStoryEdge(edges, segmentId, args[2], "time_key", `限时触发 ${String(args[0] || "")}`, condition);
  } else if (step.name === "arena") {
    addStoryEdge(edges, segmentId, args[0], "dynamic", "arena 回调", condition);
  }
}

function addStoryEdge(edges, fromId, rawTarget, kind, label, condition) {
  const toId = typeof rawTarget === "string" ? rawTarget.trim() : "";
  if (!toId) return;
  edges.push({
    fromId,
    toId,
    kind,
    label,
    condition: condition || null,
    sourcePath: "",
    line: null,
  });
}

export function mergeDraftStoryGraph(graph, draft, compiledPath) {
  const baseNodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  const baseEdges = Array.isArray(graph?.edges) ? graph.edges : [];
  const replacedIds = new Set(baseNodes.filter((node) => node.path === compiledPath).map((node) => node.id));
  for (const node of draft.nodes) replacedIds.add(node.id);
  return {
    ...graph,
    nodes: [...baseNodes.filter((node) => node.path !== compiledPath && !replacedIds.has(node.id)), ...draft.nodes],
    edges: [...baseEdges.filter((edge) => !replacedIds.has(edge.fromId)), ...draft.edges],
  };
}

export function buildStoryGraphProjection(graph, {
  scope = "neighbors",
  filter = "all",
  selectedId = "",
  documentPath = "",
} = {}) {
  const allNodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  const allEdges = Array.isArray(graph?.edges) ? graph.edges : [];
  const allEntrypoints = Array.isArray(graph?.entrypoints) ? graph.entrypoints : [];
  const diagnostics = Array.isArray(graph?.diagnostics) ? graph.diagnostics : [];
  const metrics = buildNodeMetrics(allNodes, allEdges, allEntrypoints, diagnostics);
  const filteredNodes = allNodes
    .map((node) => ({ ...node, ...metrics.get(node.id) }))
    .filter((node) => matchesGraphFilter(node, filter));
  const filteredIds = new Set(filteredNodes.map((node) => node.id));
  const filteredEdges = allEdges.filter((edge) => filteredIds.has(edge.fromId) && filteredIds.has(edge.toId));
  const filteredEntrypoints = allEntrypoints.filter((entry) => filteredIds.has(entry.targetId));
  if (scope === "overview") {
    return buildOverviewProjection(filteredNodes, filteredEdges, filteredEntrypoints, filter);
  }

  const nodesById = new Map(filteredNodes.map((node) => [node.id, node]));
  const selected = nodesById.get(selectedId)
    || filteredNodes.find((node) => node.path === documentPath)
    || filteredNodes[0];
  if (!selected) return { nodes: [], edges: [], entrypoints: [], totalNodeCount: 0, truncated: false };

  let visibleIds;
  if (scope === "file") {
    visibleIds = new Set(filteredNodes.filter((node) => node.path === documentPath).map((node) => node.id));
  } else if (scope === "group") {
    visibleIds = new Set(filteredNodes.filter((node) => node.groupId === selected.groupId).map((node) => node.id));
  } else {
    visibleIds = new Set([selected.id]);
    for (const edge of filteredEdges) {
      if (edge.fromId === selected.id) visibleIds.add(edge.toId);
      if (edge.toId === selected.id) visibleIds.add(edge.fromId);
    }
  }

  const totalNodeCount = visibleIds.size;
  const orderedIds = [selected.id, ...[...visibleIds].filter((id) => id !== selected.id)];
  const limitedIds = new Set(orderedIds.slice(0, 500));
  const visibleEdges = filteredEdges.filter((edge) => limitedIds.has(edge.fromId) && limitedIds.has(edge.toId));
  const visibleNodes = [...limitedIds].map((id) => nodesById.get(id)).filter(Boolean);
  const entrypoints = filteredEntrypoints.filter((entry) => limitedIds.has(entry.targetId));
  return {
    nodes: visibleNodes,
    edges: visibleEdges,
    entrypoints,
    totalNodeCount,
    truncated: totalNodeCount > limitedIds.size,
    selectedId: selected.id,
    filter,
  };
}

function buildNodeMetrics(nodes, edges, entrypoints, diagnostics) {
  const metrics = new Map(nodes.map((node) => [node.id, {
    incomingCount: 0,
    outgoingCount: 0,
    entrypointCount: 0,
    issueCount: 0,
    isolated: false,
  }]));
  for (const edge of edges) {
    const source = metrics.get(edge.fromId);
    const target = metrics.get(edge.toId);
    if (source) source.outgoingCount += 1;
    if (target) target.incomingCount += 1;
  }
  for (const entrypoint of entrypoints) {
    const target = metrics.get(entrypoint.targetId);
    if (target) target.entrypointCount += 1;
  }
  for (const diagnostic of diagnostics) {
    const target = metrics.get(diagnostic.segmentId);
    if (target) target.issueCount += 1;
  }
  for (const metric of metrics.values()) {
    metric.isolated = metric.incomingCount === 0 && metric.outgoingCount === 0 && metric.entrypointCount === 0;
  }
  return metrics;
}

function matchesGraphFilter(node, filter) {
  if (filter === "issues") return node.issueCount > 0;
  if (filter === "entrypoints") return node.entrypointCount > 0;
  if (filter === "isolated") return node.isolated;
  return true;
}

function buildOverviewProjection(nodes, edges, entrypoints, filter) {
  const groups = new Map();
  const nodeGroup = new Map();
  for (const node of nodes) {
    nodeGroup.set(node.id, node.groupId);
    const group = groups.get(node.groupId) || {
      id: node.groupId,
      label: node.groupName || node.groupId,
      nodeCount: 0,
      issueCount: 0,
      entrypointCount: 0,
      isolatedCount: 0,
    };
    group.nodeCount += 1;
    group.issueCount += node.issueCount || 0;
    group.entrypointCount += node.entrypointCount || 0;
    group.isolatedCount += node.isolated ? 1 : 0;
    groups.set(node.groupId, group);
  }
  const aggregatedEdges = new Map();
  for (const edge of edges) {
    const source = nodeGroup.get(edge.fromId);
    const target = nodeGroup.get(edge.toId);
    if (!source || !target || source === target) continue;
    const key = `${source}\u0000${target}`;
    const aggregate = aggregatedEdges.get(key) || { fromId: source, toId: target, kind: "group", label: "", count: 0 };
    aggregate.count += 1;
    aggregate.label = `${aggregate.count} 条流向`;
    aggregatedEdges.set(key, aggregate);
  }
  const visibleGroupIds = new Set(groups.keys());
  return {
    nodes: [...groups.values()].map((group) => ({ ...group, groupId: group.id, groupName: group.label, stepCount: group.nodeCount })),
    edges: [...aggregatedEdges.values()],
    entrypoints: entrypoints.filter((entry) => visibleGroupIds.has(nodeGroup.get(entry.targetId))),
    totalNodeCount: groups.size,
    truncated: false,
    selectedId: "",
    overview: true,
    filter,
  };
}

export function findJsonDifferences(original, roundTripped, { limit = 20 } = {}) {
  const differences = [];
  let total = 0;

  function add(path, kind, before, after) {
    total += 1;
    if (differences.length < limit) differences.push({ path, kind, original: before, roundTripped: after });
  }

  function visit(before, after, path) {
    if (Object.is(before, after)) return;
    const beforeArray = Array.isArray(before);
    const afterArray = Array.isArray(after);
    if (beforeArray || afterArray) {
      if (!beforeArray || !afterArray) {
        add(path, "type", before, after);
        return;
      }
      if (before.length !== after.length) add(path, "array-length", before.length, after.length);
      const length = Math.max(before.length, after.length);
      for (let index = 0; index < length; index += 1) {
        const childPath = `${path}[${index}]`;
        if (index >= before.length) add(childPath, "added", undefined, after[index]);
        else if (index >= after.length) add(childPath, "removed", before[index], undefined);
        else visit(before[index], after[index], childPath);
      }
      return;
    }

    const beforeObject = before !== null && typeof before === "object";
    const afterObject = after !== null && typeof after === "object";
    if (beforeObject || afterObject) {
      if (!beforeObject || !afterObject) {
        add(path, "type", before, after);
        return;
      }
      const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
      for (const key of keys) {
        const childPath = appendJsonPath(path, key);
        if (!Object.prototype.hasOwnProperty.call(before, key)) add(childPath, "added", undefined, after[key]);
        else if (!Object.prototype.hasOwnProperty.call(after, key)) add(childPath, "removed", before[key], undefined);
        else visit(before[key], after[key], childPath);
      }
      return;
    }

    add(path, typeof before === typeof after ? "value" : "type", before, after);
  }

  visit(original, roundTripped, "$");
  return {
    equal: total === 0,
    differences,
    total,
    truncated: total > differences.length,
  };
}

function appendJsonPath(path, key) {
  return /^[A-Za-z_$][\w$]*$/u.test(key) ? `${path}.${key}` : `${path}[${JSON.stringify(key)}]`;
}

export function inferStoryGroupId(segmentId) {
  const normalized = String(segmentId || "").trim();
  for (const separator of ["_", ".", "：", ":"]) {
    const index = normalized.indexOf(separator);
    if (index > 0) return normalized.slice(0, index);
  }
  return normalized.length <= 8 ? normalized : normalized.slice(0, 8);
}

function shorten(value, max = 32) {
  const text = String(value || "");
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function formatStoryExpression(expression) {
  if (!Array.isArray(expression)) return String(expression ?? "");
  const [operator, ...args] = expression;
  if (operator === "pred") return [args[0], ...args.slice(1).map(formatStoryExpression)].join(" ");
  if (operator === "var") return `$${String(args[0] || "")}`;
  if (operator === "not") return `not ${formatStoryExpression(args[0])}`;
  if (["and", "or", "==", "!=", ">", ">=", "<", "<="].includes(operator)) {
    return `${formatStoryExpression(args[0])} ${operator} ${formatStoryExpression(args[1])}`;
  }
  return JSON.stringify(expression);
}
