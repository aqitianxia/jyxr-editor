const DEFAULT_LOGICAL_WIDTH = 800;
const DEFAULT_LOGICAL_HEIGHT = 600;
const MARKER_SIZE = 42;
const MIN_ZOOM_RATIO = 0.5;
const MAX_ZOOM_RATIO = 8;

export function clampMapPoint(point, width = DEFAULT_LOGICAL_WIDTH, height = DEFAULT_LOGICAL_HEIGHT) {
  const x = Number.isFinite(point?.x) ? point.x : width / 2;
  const y = Number.isFinite(point?.y) ? point.y : height / 2;
  return {
    x: Math.round(Math.max(0, Math.min(width, x))),
    y: Math.round(Math.max(0, Math.min(height, y))),
  };
}

export function calculateFitTransform(
  containerWidth,
  containerHeight,
  logicalWidth = DEFAULT_LOGICAL_WIDTH,
  logicalHeight = DEFAULT_LOGICAL_HEIGHT,
  padding = 0,
) {
  const width = Math.max(1, Number(containerWidth) || 1);
  const height = Math.max(1, Number(containerHeight) || 1);
  const safeLogicalWidth = Math.max(1, Number(logicalWidth) || DEFAULT_LOGICAL_WIDTH);
  const safeLogicalHeight = Math.max(1, Number(logicalHeight) || DEFAULT_LOGICAL_HEIGHT);
  const safePadding = Math.max(0, Number(padding) || 0);
  const availableWidth = Math.max(1, width - safePadding * 2);
  const availableHeight = Math.max(1, height - safePadding * 2);
  const scale = Math.min(availableWidth / safeLogicalWidth, availableHeight / safeLogicalHeight);
  return {
    x: (width - safeLogicalWidth * scale) / 2,
    y: (height - safeLogicalHeight * scale) / 2,
    scale,
  };
}

export function zoomMapTransformAtPoint(transform, pointer, requestedScale, minScale = 0.1, maxScale = 10) {
  const oldScale = Number.isFinite(transform?.scale) && transform.scale > 0 ? transform.scale : 1;
  const safeMin = Number.isFinite(minScale) && minScale > 0 ? minScale : 0.1;
  const safeMax = Number.isFinite(maxScale) && maxScale >= safeMin ? maxScale : Math.max(safeMin, 10);
  const nextScale = Math.max(safeMin, Math.min(safeMax, Number(requestedScale) || oldScale));
  const point = {
    x: Number.isFinite(pointer?.x) ? pointer.x : 0,
    y: Number.isFinite(pointer?.y) ? pointer.y : 0,
  };
  const mapPoint = {
    x: (point.x - (Number(transform?.x) || 0)) / oldScale,
    y: (point.y - (Number(transform?.y) || 0)) / oldScale,
  };
  return {
    x: point.x - mapPoint.x * nextScale,
    y: point.y - mapPoint.y * nextScale,
    scale: nextScale,
  };
}

export function screenToMapPoint(transform, pointer, width = DEFAULT_LOGICAL_WIDTH, height = DEFAULT_LOGICAL_HEIGHT) {
  const scale = Number.isFinite(transform?.scale) && transform.scale > 0 ? transform.scale : 1;
  return clampMapPoint({
    x: ((Number(pointer?.x) || 0) - (Number(transform?.x) || 0)) / scale,
    y: ((Number(pointer?.y) || 0) - (Number(transform?.y) || 0)) / scale,
  }, width, height);
}

export function createMapCanvas(options = {}) {
  const Konva = globalThis.Konva;
  if (!Konva) throw new Error("Konva 未加载，无法创建地图画布。");

  const logicalWidth = Math.max(1, Number(options.logicalWidth) || DEFAULT_LOGICAL_WIDTH);
  const logicalHeight = Math.max(1, Number(options.logicalHeight) || DEFAULT_LOGICAL_HEIGHT);
  const element = document.createElement("div");
  element.className = "map-canvas";
  element.tabIndex = 0;
  element.setAttribute("role", "application");
  element.setAttribute("aria-label", options.ariaLabel || "大地图点位画布");

  const stage = new Konva.Stage({ container: element, width: 1, height: 1 });
  const backgroundLayer = new Konva.Layer({ listening: false });
  const pointLayer = new Konva.Layer();
  const overlayLayer = new Konva.Layer({ listening: false });
  const backgroundGroup = new Konva.Group();
  const pointGroup = new Konva.Group();
  const overlayGroup = new Konva.Group();
  backgroundLayer.add(backgroundGroup);
  pointLayer.add(pointGroup);
  overlayLayer.add(overlayGroup);
  stage.add(backgroundLayer, pointLayer, overlayLayer);

  const background = new Konva.Rect({
    x: 0,
    y: 0,
    width: logicalWidth,
    height: logicalHeight,
    fill: "#edf1f4",
    stroke: "#c9d0d7",
    strokeWidth: 1,
  });
  const placeholder = new Konva.Text({
    x: 40,
    y: logicalHeight / 2 - 10,
    width: logicalWidth - 80,
    align: "center",
    fill: "#647383",
    fontFamily: "system-ui, sans-serif",
    fontSize: 16,
    text: options.backgroundUrl ? "地图背景加载中" : "尚未设置地图背景",
  });
  backgroundGroup.add(background, placeholder);

  let destroyed = false;
  let mode = normalizeMode(options.mode);
  let locations = Array.isArray(options.locations) ? options.locations : [];
  let selectedIndex = normalizeSelection(options.selectedIndex, locations.length);
  let markerNodes = [];
  let selectionNode = null;
  let fitTransform = { x: 0, y: 0, scale: 1 };
  let viewTransform = { ...fitTransform };
  let userAdjustedView = false;
  let initialViewApplied = false;
  let labelsVisible = options.showLabels !== false;
  let panGesture = null;
  let addGesture = null;

  loadBackground(options.backgroundUrl);
  renderMarkers();
  setMode(mode);
  setSelection(selectedIndex);

  stage.on("wheel", (event) => {
    event.evt.preventDefault();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const zoomFactor = event.evt.deltaY > 0 ? 0.9 : 1.1;
    viewTransform = zoomMapTransformAtPoint(
      viewTransform,
      pointer,
      viewTransform.scale * zoomFactor,
      fitTransform.scale * MIN_ZOOM_RATIO,
      fitTransform.scale * MAX_ZOOM_RATIO,
    );
    userAdjustedView = true;
    applyViewTransform();
    notifyViewChange();
  });

  stage.on("pointerdown", (event) => {
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    if (mode === "pan") {
      panGesture = { pointer, transform: { ...viewTransform } };
      element.classList.add("panning");
      event.evt.preventDefault();
    } else if (mode === "add") {
      addGesture = { pointer };
    }
  });

  stage.on("pointermove", () => {
    if (!panGesture) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    viewTransform = {
      x: panGesture.transform.x + pointer.x - panGesture.pointer.x,
      y: panGesture.transform.y + pointer.y - panGesture.pointer.y,
      scale: panGesture.transform.scale,
    };
    userAdjustedView = true;
    applyViewTransform();
  });

  stage.on("pointerup pointercancel", () => {
    const pointer = stage.getPointerPosition();
    if (panGesture) {
      panGesture = null;
      element.classList.remove("panning");
      notifyViewChange();
    }
    if (!addGesture || !pointer) {
      addGesture = null;
      return;
    }
    const distance = Math.hypot(pointer.x - addGesture.pointer.x, pointer.y - addGesture.pointer.y);
    addGesture = null;
    if (distance <= 4) options.onAdd?.(screenToMapPoint(viewTransform, pointer, logicalWidth, logicalHeight));
  });

  element.addEventListener("keydown", (event) => {
    if (mode !== "select" || selectedIndex < 0 || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      return;
    }
    event.preventDefault();
    const location = locations[selectedIndex];
    const marker = markerNodes[selectedIndex];
    if (!location || !marker) return;
    const step = event.shiftKey ? 10 : 1;
    const delta = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    }[event.key];
    const next = clampMapPoint({
      x: marker.x() + delta.x,
      y: marker.y() + delta.y,
    }, logicalWidth, logicalHeight);
    marker.position(next);
    location.position = next;
    positionSelection(next);
    pointLayer.batchDraw();
    options.onMove?.(selectedIndex, next);
  });

  function loadBackground(url) {
    if (!url) return;
    const image = new Image();
    image.onload = () => {
      if (destroyed) return;
      const node = new Konva.Image({
        x: 0,
        y: 0,
        width: logicalWidth,
        height: logicalHeight,
        image,
      });
      backgroundGroup.add(node);
      node.moveToBottom();
      background.moveToBottom();
      placeholder.visible(false);
      backgroundLayer.batchDraw();
    };
    image.onerror = () => {
      if (destroyed) return;
      placeholder.text("地图背景加载失败");
      backgroundLayer.batchDraw();
    };
    image.src = url;
  }

  function renderMarkers() {
    pointGroup.destroyChildren();
    markerNodes = locations.map((location, index) => createMarker(location, index));
    pointGroup.add(...markerNodes);
    pointLayer.batchDraw();
  }

  function createMarker(location, index) {
    const position = clampMapPoint(location?.position, logicalWidth, logicalHeight);
    const marker = new Konva.Group({
      x: position.x,
      y: position.y,
      draggable: mode === "select",
    });
    marker.visible(location?.visible !== false);
    const hitCircle = new Konva.Circle({
      radius: MARKER_SIZE / 2,
      fill: "#eef3f7",
      stroke: "#ffffff",
      strokeWidth: 2,
      shadowColor: "#192c58",
      shadowBlur: 12,
      shadowOpacity: 0.28,
      shadowOffsetY: 4,
    });
    marker.add(hitCircle);

    const iconGroup = new Konva.Group({
      clipFunc(context) {
        context.arc(0, 0, MARKER_SIZE / 2 - 3, 0, Math.PI * 2, false);
      },
    });
    marker.add(iconGroup);
    if (location?.iconUrl) {
      const image = new Image();
      image.onload = () => {
        if (destroyed || !marker.getStage()) return;
        const rect = calculateContainedRect(image.width, image.height, MARKER_SIZE - 6, MARKER_SIZE - 6);
        iconGroup.add(new Konva.Image({
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          image,
        }));
        pointLayer.batchDraw();
      };
      image.src = location.iconUrl;
    } else {
      marker.add(new Konva.Text({
        x: -MARKER_SIZE / 2,
        y: -6,
        width: MARKER_SIZE,
        align: "center",
        fill: "#39516a",
        fontFamily: "system-ui, sans-serif",
        fontSize: 10,
        fontStyle: "bold",
        text: location?.status === "empty" ? "默认" : "!",
      }));
    }

    const badgeText = String(location?.badge || index + 1);
    marker.add(
      new Konva.Circle({ x: 16, y: 16, radius: 9, fill: "#2d6cdf", stroke: "#ffffff", strokeWidth: 2 }),
      new Konva.Text({
        x: 8,
        y: 10.5,
        width: 16,
        align: "center",
        fill: "#ffffff",
        fontFamily: "system-ui, sans-serif",
        fontSize: 9,
        fontStyle: "bold",
        text: badgeText,
      }),
    );

    const label = new Konva.Text({
      x: -70,
      y: 27,
      width: 140,
      align: "center",
      fill: "#21354a",
      fontFamily: "system-ui, sans-serif",
      fontSize: 12,
      fontStyle: "bold",
      text: String(location?.label || ""),
      visible: labelsVisible && Boolean(location?.label),
      shadowColor: "#ffffff",
      shadowBlur: 3,
      shadowOpacity: 1,
    });
    label.name("location-label");
    marker.add(label);

    marker.on("pointerdown", (event) => {
      if (mode === "pan") return;
      event.cancelBubble = true;
      if (mode === "select") selectMarker(index);
    });
    marker.on("click tap", (event) => {
      if (mode === "pan") return;
      event.cancelBubble = true;
      if (mode === "select") selectMarker(index);
    });
    marker.on("dragstart", () => {
      selectMarker(index);
      element.classList.add("dragging-marker");
    });
    marker.on("dragmove", () => {
      const next = clampMapPoint(marker.position(), logicalWidth, logicalHeight);
      marker.position(next);
      if (selectedIndex === index) positionSelection(next);
    });
    marker.on("dragend", () => {
      element.classList.remove("dragging-marker");
      const next = clampMapPoint(marker.position(), logicalWidth, logicalHeight);
      marker.position(next);
      location.position = next;
      options.onMove?.(index, next);
    });
    return marker;
  }

  function selectMarker(index) {
    setSelection(index);
    options.onSelect?.(index);
  }

  function setMode(nextMode) {
    mode = normalizeMode(nextMode);
    element.dataset.mode = mode;
    element.classList.toggle("adding", mode === "add");
    element.classList.toggle("pannable", mode === "pan");
    for (const marker of markerNodes) marker.draggable(mode === "select");
  }

  function setSelection(index) {
    selectedIndex = normalizeSelection(index, locations.length);
    selectionNode?.destroy();
    selectionNode = null;
    const location = locations[selectedIndex];
    if (!location) {
      overlayLayer.batchDraw();
      return;
    }
    selectionNode = new Konva.Circle({
      radius: MARKER_SIZE / 2 + 5,
      stroke: "#d45b36",
      strokeWidth: 3,
    });
    positionSelection(clampMapPoint(location.position, logicalWidth, logicalHeight));
    overlayGroup.add(selectionNode);
    updateFixedVisualScale();
    overlayLayer.batchDraw();
  }

  function focusLocation(index) {
    setSelection(index);
    const location = locations[selectedIndex];
    if (!location) return;
    const position = clampMapPoint(location.position, logicalWidth, logicalHeight);
    const size = stage.size();
    viewTransform = {
      x: size.width / 2 - position.x * viewTransform.scale,
      y: size.height / 2 - position.y * viewTransform.scale,
      scale: viewTransform.scale,
    };
    userAdjustedView = true;
    applyViewTransform();
    notifyViewChange();
    element.focus({ preventScroll: true });
  }

  function setLocationFilter(query) {
    const normalized = String(query || "").trim().toLocaleLowerCase("zh-CN");
    markerNodes.forEach((marker, index) => {
      const searchText = String(locations[index]?.searchText || locations[index]?.label || "")
        .toLocaleLowerCase("zh-CN");
      marker.visible(!normalized || searchText.includes(normalized));
    });
    pointLayer.batchDraw();
  }

  function setLabelsVisible(visible) {
    labelsVisible = Boolean(visible);
    for (const marker of markerNodes) {
      const label = marker.findOne(".location-label");
      if (label) label.visible(labelsVisible && Boolean(label.text()));
    }
    pointLayer.batchDraw();
  }

  function positionSelection(position) {
    selectionNode?.position(position);
    overlayLayer.batchDraw();
  }

  function applyViewTransform() {
    for (const group of [backgroundGroup, pointGroup, overlayGroup]) {
      group.position({ x: viewTransform.x, y: viewTransform.y });
      group.scale({ x: viewTransform.scale, y: viewTransform.scale });
    }
    updateFixedVisualScale();
    backgroundLayer.batchDraw();
    pointLayer.batchDraw();
    overlayLayer.batchDraw();
  }

  function updateFixedVisualScale() {
    const inverseScale = 1 / Math.max(viewTransform.scale, 0.0001);
    for (const marker of markerNodes) marker.scale({ x: inverseScale, y: inverseScale });
    selectionNode?.scale({ x: inverseScale, y: inverseScale });
  }

  function resize() {
    if (destroyed) return;
    const rect = element.getBoundingClientRect();
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
    if (width < 2 || height < 2) return;

    const previousFit = fitTransform;
    const previousStageSize = stage.size();
    const centerMapPoint = screenToMapPoint(viewTransform, {
      x: previousStageSize.width / 2,
      y: previousStageSize.height / 2,
    }, logicalWidth, logicalHeight);
    const zoomRatio = previousFit.scale > 0 ? viewTransform.scale / previousFit.scale : 1;
    stage.size({ width, height });
    fitTransform = calculateFitTransform(width, height, logicalWidth, logicalHeight);
    if (!initialViewApplied && options.initialViewState) {
      const initial = normalizeViewState(options.initialViewState, logicalWidth, logicalHeight);
      const scale = Math.max(
        fitTransform.scale * MIN_ZOOM_RATIO,
        Math.min(fitTransform.scale * MAX_ZOOM_RATIO, fitTransform.scale * initial.zoomRatio),
      );
      viewTransform = {
        x: width / 2 - initial.center.x * scale,
        y: height / 2 - initial.center.y * scale,
        scale,
      };
      userAdjustedView = true;
      initialViewApplied = true;
    } else if (userAdjustedView) {
      const scale = Math.max(
        fitTransform.scale * MIN_ZOOM_RATIO,
        Math.min(fitTransform.scale * MAX_ZOOM_RATIO, fitTransform.scale * zoomRatio),
      );
      viewTransform = {
        x: width / 2 - centerMapPoint.x * scale,
        y: height / 2 - centerMapPoint.y * scale,
        scale,
      };
    } else {
      viewTransform = { ...fitTransform };
      initialViewApplied = true;
    }
    applyViewTransform();
  }

  function fitView() {
    userAdjustedView = false;
    viewTransform = { ...fitTransform };
    applyViewTransform();
    notifyViewChange();
  }

  function getViewState() {
    const size = stage.size();
    return normalizeViewState({
      center: screenToMapPoint(viewTransform, { x: size.width / 2, y: size.height / 2 }, logicalWidth, logicalHeight),
      zoomRatio: fitTransform.scale > 0 ? viewTransform.scale / fitTransform.scale : 1,
    }, logicalWidth, logicalHeight);
  }

  function notifyViewChange() {
    if (!destroyed) options.onViewChange?.(getViewState());
  }

  const resizeObserver = typeof ResizeObserver === "function"
    ? new ResizeObserver(resize)
    : null;
  resizeObserver?.observe(element);
  if (!resizeObserver) window.addEventListener("resize", resize);
  queueMicrotask(resize);

  return {
    element,
    setMode,
    setSelection,
    focusLocation,
    setLocationFilter,
    setLabelsVisible,
    getViewState,
    fitView,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      resizeObserver?.disconnect();
      if (!resizeObserver) window.removeEventListener("resize", resize);
      stage.destroy();
      element.replaceChildren();
    },
  };
}

export function normalizeViewState(viewState, width = DEFAULT_LOGICAL_WIDTH, height = DEFAULT_LOGICAL_HEIGHT) {
  return {
    center: clampMapPoint(viewState?.center, width, height),
    zoomRatio: Math.max(MIN_ZOOM_RATIO, Math.min(MAX_ZOOM_RATIO, Number(viewState?.zoomRatio) || 1)),
  };
}

function normalizeMode(mode) {
  return ["select", "add", "pan"].includes(mode) ? mode : "select";
}

function normalizeSelection(index, count) {
  if (count <= 0) return -1;
  const value = Number.isInteger(index) ? index : 0;
  return Math.max(0, Math.min(value, count - 1));
}

function calculateContainedRect(sourceWidth, sourceHeight, targetWidth, targetHeight) {
  const safeWidth = Math.max(1, Number(sourceWidth) || 1);
  const safeHeight = Math.max(1, Number(sourceHeight) || 1);
  const scale = Math.min(targetWidth / safeWidth, targetHeight / safeHeight);
  const width = safeWidth * scale;
  const height = safeHeight * scale;
  return { x: -width / 2, y: -height / 2, width, height };
}
