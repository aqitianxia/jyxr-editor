import { parseJsonc } from "../core/jsonc.js?v=20260727-jsonc-1";

const activeEditors = new Set();
let modelSequence = 0;

function element(tag, className = "", text = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

export function disposeEmbeddedCodeEditors(root) {
  for (const entry of [...activeEditors]) {
    if (!root || root.contains(entry.wrapper)) {
      entry.editor?.dispose();
      entry.model?.dispose();
      activeEditors.delete(entry);
    }
  }
}

export function createEmbeddedJsonEditor({ value, modelPath = "record", onApply, validate, compact = false }) {
  const wrapper = element("section", `embedded-code-editor${compact ? " compact" : ""}`);
  const host = element("div", "embedded-code-editor-host");
  const fallback = document.createElement("textarea");
  fallback.className = "input embedded-code-editor-fallback hidden";
  fallback.spellcheck = false;
  fallback.value = JSON.stringify(value, null, 2);
  const status = element("div", "embedded-code-editor-status muted", "未修改");
  const toolbar = element("div", "embedded-code-editor-toolbar");
  const formatButton = element("button", "button ghost", "格式化");
  const resetButton = element("button", "button secondary", "放弃修改");
  const applyButton = element("button", "button primary", "应用 JSON");
  for (const button of [formatButton, resetButton, applyButton]) button.type = "button";
  toolbar.append(status, formatButton, resetButton, applyButton);
  wrapper.append(host, fallback, toolbar);

  const originalText = JSON.stringify(value, null, 2);
  let editor = null;
  let model = null;
  let suppressChange = false;
  const getText = () => editor ? editor.getValue() : fallback.value;
  const setText = (text) => {
    if (editor) editor.setValue(text);
    else fallback.value = text;
  };
  const updateStatus = () => {
    if (suppressChange) return;
    status.className = "embedded-code-editor-status warning";
    status.textContent = "JSON 草稿尚未应用";
  };

  const initialize = () => {
    if (!wrapper.isConnected) return;
    if (!window.monaco?.editor) {
      host.classList.add("hidden");
      fallback.classList.remove("hidden");
      fallback.addEventListener("input", updateStatus);
      return;
    }
    const uri = window.monaco.Uri.parse(`inmemory://jyxr/${encodeURIComponent(modelPath)}-${++modelSequence}.json`);
    model = window.monaco.editor.createModel(originalText, "json", uri);
    editor = window.monaco.editor.create(host, {
      model,
      theme: "vs",
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 13,
      lineNumbersMinChars: 3,
      scrollBeyondLastLine: false,
      wordWrap: "off",
      tabSize: 2,
      insertSpaces: true,
      renderLineHighlight: "line",
      padding: { top: 10, bottom: 10 },
    });
    editor.onDidChangeModelContent(updateStatus);
    activeEditors.add({ wrapper, editor, model });
  };

  formatButton.addEventListener("click", async () => {
    try {
      const parsed = parseJsonc(getText());
      suppressChange = true;
      setText(JSON.stringify(parsed, null, 2));
      suppressChange = false;
      status.className = "embedded-code-editor-status ok";
      status.textContent = "格式化完成，尚未应用";
    } catch (error) {
      status.className = "embedded-code-editor-status bad";
      status.textContent = `JSON 解析失败：${error.message}`;
    }
  });
  resetButton.addEventListener("click", () => {
    suppressChange = true;
    setText(originalText);
    suppressChange = false;
    status.className = "embedded-code-editor-status muted";
    status.textContent = "已放弃 JSON 草稿";
  });
  applyButton.addEventListener("click", () => {
    try {
      const parsed = parseJsonc(getText());
      validate?.(parsed);
      onApply(parsed);
      status.className = "embedded-code-editor-status ok";
      status.textContent = "已应用到当前内存对象，尚未保存";
    } catch (error) {
      status.className = "embedded-code-editor-status bad";
      status.textContent = `无法应用：${error.message}`;
    }
  });
  queueMicrotask(initialize);
  return wrapper;
}
