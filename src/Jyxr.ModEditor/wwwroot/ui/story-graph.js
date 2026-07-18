let graphLibrariesPromise = null;
const graphInstances = new WeakMap();

async function loadGraphLibraries() {
  if (!graphLibrariesPromise) {
    graphLibrariesPromise = Promise.all([
      import("../vendor/cytoscape/cytoscape.esm.min.mjs"),
      import("../vendor/cytoscape-dagre/cytoscape-dagre.min.mjs"),
    ]).then(([cytoscapeModule, dagreModule]) => {
      const cytoscape = cytoscapeModule.default;
      dagreModule.default(cytoscape);
      return cytoscape;
    });
  }
  return graphLibrariesPromise;
}

export async function renderStoryGraph(container, projection, {
  selectedId = "",
  onSelect,
  onBackgroundSelect,
} = {}) {
  destroyStoryGraph(container);
  container.classList.add("loading");
  container.setAttribute("aria-busy", "true");

  const cytoscape = await loadGraphLibraries();
  if (!container.isConnected) return null;

  const nodeIds = new Set(projection.nodes.map((node) => node.id));
  const hasFocus = Boolean(selectedId && nodeIds.has(selectedId));
  const relatedNodeIds = new Set(hasFocus ? [selectedId] : []);
  for (const edge of projection.edges) {
    if (edge.fromId === selectedId) relatedNodeIds.add(edge.toId);
    if (edge.toId === selectedId) relatedNodeIds.add(edge.fromId);
  }
  const nodes = projection.nodes.map((node) => ({
    data: {
      id: node.id,
      label: projection.overview
        ? `${node.groupName || node.id}\n${node.nodeCount || 0} 段${node.issueCount ? ` · ${node.issueCount} 问题` : ""}`
        : node.id,
      selected: node.id === selectedId,
      issueCount: node.issueCount || 0,
    },
    classes: [
      projection.overview ? "group" : "segment",
      node.id === selectedId ? "selected" : "",
      node.issueCount ? "issue" : "",
      hasFocus && !relatedNodeIds.has(node.id) ? "dimmed" : "",
    ].filter(Boolean).join(" "),
  }));
  const edges = projection.edges
    .filter((edge) => nodeIds.has(edge.fromId) && nodeIds.has(edge.toId))
    .map((edge, index) => ({
      data: {
        id: `edge-${index}-${edge.fromId}-${edge.toId}`,
        source: edge.fromId,
        target: edge.toId,
        label: projection.overview ? "" : edge.label || "",
        kind: edge.kind || "jump",
        width: edge.count ? Math.min(8, 1.5 + Math.sqrt(edge.count)) : 1.5,
      },
      classes: [
        edge.kind || "jump",
        hasFocus && (edge.fromId === selectedId || edge.toId === selectedId) ? "related" : "",
        hasFocus && edge.fromId !== selectedId && edge.toId !== selectedId ? "dimmed" : "",
      ].filter(Boolean).join(" "),
    }));

  const instance = cytoscape({
    container,
    elements: [...nodes, ...edges],
    minZoom: 0.12,
    maxZoom: 2.5,
    boxSelectionEnabled: false,
    autoungrabify: true,
    style: [
      {
        selector: "node",
        style: {
          shape: "round-rectangle",
          width: 180,
          height: 44,
          padding: 0,
          "background-color": "#ffffff",
          "border-color": "#cbd5e1",
          "border-width": 1,
          color: "#172033",
          label: "data(label)",
          "font-family": "Inter, system-ui, sans-serif",
          "font-size": 12,
          "font-weight": 600,
          "text-wrap": "wrap",
          "text-max-width": 190,
          "text-valign": "center",
          "text-halign": "center",
        },
      },
      {
        selector: "node.group",
        style: {
          width: 164,
          height: 58,
          "background-color": "#f8fafc",
          "border-color": "#94a3b8",
        },
      },
      {
        selector: "node.selected",
        style: {
          "background-color": "#ecfdf5",
          "border-color": "#0f766e",
          "border-width": 2,
        },
      },
      {
        selector: "node.issue",
        style: {
          "border-color": "#dc2626",
        },
      },
      {
        selector: "node.dimmed",
        style: { opacity: 0.18 },
      },
      {
        selector: "edge",
        style: {
          width: "data(width)",
          "line-color": "#94a3b8",
          "target-arrow-color": "#64748b",
          "target-arrow-shape": "triangle",
          "curve-style": "bezier",
          label: "data(label)",
          color: "#64748b",
          "font-size": 10,
          "text-background-color": "#f8fafc",
          "text-background-opacity": 0.9,
          "text-background-padding": 3,
          "text-rotation": "autorotate",
        },
      },
      {
        selector: "edge.related",
        style: {
          "line-color": "#0f766e",
          "target-arrow-color": "#0f766e",
          "z-index": 8,
        },
      },
      {
        selector: "edge.dimmed",
        style: { opacity: 0.1 },
      },
      {
        selector: "edge.time_key",
        style: { "line-style": "dashed", "line-color": "#d97706", "target-arrow-color": "#d97706" },
      },
      {
        selector: "edge.dynamic",
        style: { "line-style": "dotted", "line-color": "#7c3aed", "target-arrow-color": "#7c3aed" },
      },
    ],
    layout: projection.overview
      ? {
          name: "cose",
          animate: false,
          randomize: true,
          idealEdgeLength: 130,
          nodeRepulsion: 900000,
          componentSpacing: 110,
          gravity: 0.2,
          numIter: 1200,
          padding: 42,
        }
      : {
          name: "dagre",
          rankDir: "LR",
          rankSep: 72,
          nodeSep: 34,
          edgeSep: 18,
          padding: 42,
          animate: false,
        },
  });

  instance.on("tap", "node", (event) => onSelect?.(event.target.id()));
  instance.on("tap", (event) => {
    if (event.target === instance) onBackgroundSelect?.();
  });
  graphInstances.set(container, instance);
  container.classList.remove("loading");
  container.setAttribute("aria-busy", "false");
  window.requestAnimationFrame(() => instance.resize().fit(undefined, 42));
  return instance;
}

export function fitStoryGraph(container) {
  graphInstances.get(container)?.fit(undefined, 42);
}

export function focusStoryGraph(container, nodeId) {
  const instance = graphInstances.get(container);
  const node = instance?.getElementById(nodeId);
  if (!node || node.empty()) return false;
  instance.animate({ fit: { eles: node.closedNeighborhood(), padding: 90 }, duration: 220 });
  return true;
}

export function destroyStoryGraph(container) {
  const instance = graphInstances.get(container);
  if (!instance) return;
  instance.destroy();
  graphInstances.delete(container);
}
