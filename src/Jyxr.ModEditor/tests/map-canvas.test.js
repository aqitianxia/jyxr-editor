import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateFitTransform,
  clampMapPoint,
  normalizeViewState,
  screenToMapPoint,
  zoomMapTransformAtPoint,
} from "../wwwroot/ui/map-canvas.js";

test("地图坐标会按 800×600 逻辑边界取整并限制", () => {
  assert.deepEqual(clampMapPoint({ x: -12.4, y: 680.2 }), { x: 0, y: 600 });
  assert.deepEqual(clampMapPoint({ x: 123.6, y: 456.2 }), { x: 124, y: 456 });
  assert.deepEqual(clampMapPoint(null), { x: 400, y: 300 });
});

test("地图视口状态限制中心点和相对缩放倍率", () => {
  assert.deepEqual(normalizeViewState({ center: { x: 900, y: -20 }, zoomRatio: 20 }), {
    center: { x: 800, y: 0 },
    zoomRatio: 8,
  });
});

test("适应视图保持地图比例并居中", () => {
  assert.deepEqual(calculateFitTransform(1000, 600), { x: 100, y: 0, scale: 1 });
  assert.deepEqual(calculateFitTransform(400, 400), { x: 0, y: 50, scale: 0.5 });
});

test("以指针为中心缩放时指针下的地图坐标不漂移", () => {
  const before = { x: 100, y: 50, scale: 0.5 };
  const pointer = { x: 300, y: 200 };
  const after = zoomMapTransformAtPoint(before, pointer, 1, 0.25, 4);
  assert.deepEqual(after, { x: -100, y: -100, scale: 1 });
  assert.deepEqual(screenToMapPoint(before, pointer), screenToMapPoint(after, pointer));
});

test("缩放级别遵守最小与最大边界", () => {
  assert.equal(zoomMapTransformAtPoint({ x: 0, y: 0, scale: 1 }, { x: 0, y: 0 }, 0.01, 0.5, 3).scale, 0.5);
  assert.equal(zoomMapTransformAtPoint({ x: 0, y: 0, scale: 1 }, { x: 0, y: 0 }, 20, 0.5, 3).scale, 3);
});

test("屏幕坐标转换回地图坐标时同样限制到逻辑边界", () => {
  assert.deepEqual(screenToMapPoint({ x: 20, y: 10, scale: 2 }, { x: 420, y: 310 }), { x: 200, y: 150 });
  assert.deepEqual(screenToMapPoint({ x: 20, y: 10, scale: 2 }, { x: -50, y: 2000 }), { x: 0, y: 600 });
});
