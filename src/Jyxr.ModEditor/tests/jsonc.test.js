import assert from "node:assert/strict";
import test from "node:test";
import { normalizeJsonc, parseJsonc } from "../wwwroot/core/jsonc.js";

test("JSONC 解析支持行注释、块注释和尾逗号", () => {
  const value = parseJsonc(`{
    // shop note
    "url": "https://example.test/a//b",
    "items": [1, /* optional */ 2,],
  }`);

  assert.deepEqual(value, {
    url: "https://example.test/a//b",
    items: [1, 2],
  });
});

test("JSONC 预处理保留换行与字符位置", () => {
  const source = "{\n  // note\n  \"value\": 1,\n}\n";
  const normalized = normalizeJsonc(source);
  assert.equal(normalized.length, source.length);
  assert.equal(normalized.split("\n").length, source.split("\n").length);
});

test("JSONC 解析拒绝未闭合的块注释", () => {
  assert.throws(() => parseJsonc('{"value": 1 /* note'), /Unterminated block comment/u);
});
