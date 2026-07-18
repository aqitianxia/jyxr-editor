import assert from "node:assert/strict";
import test from "node:test";
import { createJsonPropertyLineIndex } from "../wwwroot/domain/json-source-index.js";

test("JSON 属性行号只扫描一次并保留首次匹配行为", () => {
  const index = createJsonPropertyLineIndex(`[
  { "id": "甲", "name": "第一行" },
  { "id": "乙", "speaker": "旁白" },
  { "id": "甲", "speaker": "旁白" }
]`);

  assert.equal(index.find("id", "甲"), 2);
  assert.equal(index.find("id", "乙"), 3);
  assert.equal(index.find("speaker", "旁白"), 3);
  assert.equal(index.find("id", "不存在"), 1);
});

test("JSON 属性行号支持转义字符", () => {
  const index = createJsonPropertyLineIndex(`{
  "id": "a\\\"b",
  "name": "第一\\n行"
}`);

  assert.equal(index.find("id", `a"b`), 2);
  assert.equal(index.find("name", "第一\n行"), 3);
});
