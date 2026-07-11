import { state } from "./core/state.js?v=20260711-core-17";
import { editorVersion } from "./core/version.js?v=20260711-core-17";
import { createEditorApi } from "./core/api.js?v=20260711-core-17";
import { createCommandRegistry } from "./core/commands.js?v=20260711-core-17";
import { createDirtyStateController } from "./core/dirty-state.js?v=20260711-core-17";
import { createEventBus } from "./core/events.js?v=20260711-core-17";
import { createPreferences, storageKeys } from "./core/preferences.js?v=20260711-core-17";
import { normalizeWorkspaceMode } from "./core/router.js?v=20260711-core-17";
import { bindImeSafeInput } from "./core/input-composition.js?v=20260711-core-17";
import { createProblem, summarizeProblems } from "./core/problems.js?v=20260711-core-17";
import { createRecentItemsStore } from "./core/recent-items.js?v=20260711-core-17";
import { createButton } from "./ui/buttons.js?v=20260711-core-17";
import { confirmAction, createDialogController } from "./ui/dialogs.js?v=20260711-core-17";
import { createField, createTextInput } from "./ui/fields.js?v=20260711-core-17";
import { createTextList } from "./ui/lists.js?v=20260711-core-17";
import { createProblemSummary, renderStatusMessage } from "./ui/problem-list.js?v=20260711-core-17";
import { createShellController } from "./ui/shell.js?v=20260711-core-17";
import { renderProjectHome } from "./ui/home.js?v=20260711-core-17";
import { renderProblemCenter } from "./ui/problem-center.js?v=20260711-core-17";
import { renderCharacterWorkspace } from "./ui/characters.js?v=20260711-core-17";
import {
  findAssetPath as findCatalogAssetPath,
  isAudioAsset,
  isImageAsset,
  normalizeArtAssetValue,
} from "./domain/resource-catalog.js?v=20260711-stage5a-1";

const dataFileDisplayNames = new Map([
  ["battles.json", "战斗"],
  ["buffs.json", "状态 / Buff"],
  ["characters.json", "角色"],
  ["equipment-random-affixes.json", "装备随机词缀"],
  ["external-skills.json", "外功"],
  ["form-skills.json", "招式"],
  ["game-config.json", "游戏配置"],
  ["game-tips.json", "游戏提示"],
  ["grow-templates.json", "成长模板"],
  ["internal-skills.json", "内功"],
  ["items.json", "物品"],
  ["legend-skills.json", "奥义"],
  ["maps.json", "地图"],
  ["resources.json", "资源"],
  ["sects.json", "门派"],
  ["shops.json", "商店"],
  ["special-skills.json", "绝技"],
  ["talents.json", "天赋"],
  ["towers.json", "爬塔"],
  ["world-triggers.json", "世界触发器"],
]);

const elements = {
  editorVersion: document.getElementById("editorVersion"),
  coreLoadState: document.getElementById("coreLoadState"),
  workspacePath: document.getElementById("workspacePath"),
  navigationToggleButton: document.getElementById("navigationToggleButton"),
  inspectorToggleButton: document.getElementById("inspectorToggleButton"),
  inspectorCloseButton: document.getElementById("inspectorCloseButton"),
  contextDrawerBackdrop: document.getElementById("contextDrawerBackdrop"),
  contextInspector: document.getElementById("contextInspector"),
  inspectorStatus: document.getElementById("inspectorStatus"),
  problemCenterButton: document.getElementById("problemCenterButton"),
  problemCountBadge: document.getElementById("problemCountBadge"),
  homeTab: document.getElementById("homeTab"),
  problemsTab: document.getElementById("problemsTab"),
  charactersTab: document.getElementById("charactersTab"),
  sidebarBrowser: document.getElementById("sidebarBrowser"),
  editorPane: document.getElementById("editorPane"),
  homeView: document.getElementById("homeView"),
  problemCenterView: document.getElementById("problemCenterView"),
  characterWorkspaceView: document.getElementById("characterWorkspaceView"),
  workspacePaneHeader: document.getElementById("workspacePaneHeader"),
  editorTools: document.getElementById("editorTools"),
  editorStatusbar: document.getElementById("editorStatusbar"),
  workspaceEyebrow: document.getElementById("workspaceEyebrow"),
  browserTitle: document.getElementById("browserTitle"),
  modSelect: document.getElementById("modSelect"),
  formatButton: document.getElementById("formatButton"),
  validateButton: document.getElementById("validateButton"),
  saveButton: document.getElementById("saveButton"),
  dataTab: document.getElementById("dataTab"),
  storyTab: document.getElementById("storyTab"),
  assetsTab: document.getElementById("assetsTab"),
  fileSearch: document.getElementById("fileSearch"),
  fileList: document.getElementById("fileList"),
  formModeButton: document.getElementById("formModeButton"),
  jsonModeButton: document.getElementById("jsonModeButton"),
  mapFocusButton: document.getElementById("mapFocusButton"),
  currentPath: document.getElementById("currentPath"),
  currentFileSummary: document.getElementById("currentFileSummary"),
  currentFileBox: document.getElementById("currentFileBox"),
  newStoryButton: document.getElementById("newStoryButton"),
  newSpeakerButton: document.getElementById("newSpeakerButton"),
  portraitCheckButton: document.getElementById("portraitCheckButton"),
  characterCheckButton: document.getElementById("characterCheckButton"),
  dirtyState: document.getElementById("dirtyState"),
  contentSearch: document.getElementById("contentSearch"),
  outlineSelect: document.getElementById("outlineSelect"),
  findPreviousButton: document.getElementById("findPreviousButton"),
  findNextButton: document.getElementById("findNextButton"),
  searchState: document.getElementById("searchState"),
  formView: document.getElementById("formView"),
  saveStorySourceButton: document.getElementById("saveStorySourceButton"),
  storyView: document.getElementById("storyView"),
  monacoHost: document.getElementById("monacoHost"),
  editor: document.getElementById("editor"),
  cursorState: document.getElementById("cursorState"),
  saveState: document.getElementById("saveState"),
  validationBox: document.getElementById("validationBox"),
  indexBox: document.getElementById("indexBox"),
  selectionBox: document.getElementById("selectionBox"),
  portraitCheckBox: document.getElementById("portraitCheckBox"),
  characterCheckBox: document.getElementById("characterCheckBox"),
  assetPreview: document.getElementById("assetPreview"),
};

elements.editorVersion.textContent = `${editorVersion.label} · ${editorVersion.phase}`;
elements.editorVersion.title = `编辑器版本 ${editorVersion.label}，${editorVersion.date}`;
elements.coreLoadState.className = "core-load-state loaded";
elements.coreLoadState.textContent = "核心已加载";
document.documentElement.dataset.editorCoreVersion = editorVersion.number;

const monacoState = {
  ready: false,
  editor: null,
  language: "json",
  suppressChange: false,
};

const preferences = createPreferences();
const recentItemsStore = createRecentItemsStore({
  preferences,
  storageKey: storageKeys.recentEntries,
});
const events = createEventBus();
const api = createEditorApi({ getActiveModId: () => state.activeModId });
const commandRegistry = createCommandRegistry();
const dialogController = createDialogController();
const dirtyStateController = createDirtyStateController({
  state,
  events,
  render: renderDirtyState,
  confirmDiscard: confirmAction,
});
const shellController = createShellController({
  state,
  elements,
  preferences,
  navigationPreferenceKey: storageKeys.navigationCollapsed,
  scheduleLayout: scheduleEditorLayout,
});
const { requestJson } = api;
commandRegistry.register("file.save", saveCurrentFile, { shortcut: "mod+s" });
commandRegistry.register("file.format", formatCurrentJson, { shortcut: "mod+shift+f" });

elements.navigationToggleButton.addEventListener("click", () => {
  setNavigationCollapsed(!state.shell.navigationCollapsed);
});
elements.inspectorToggleButton.addEventListener("click", () => {
  setContextDrawerOpen(!state.shell.contextDrawerOpen);
});
elements.inspectorCloseButton.addEventListener("click", () => setContextDrawerOpen(false));
elements.contextDrawerBackdrop.addEventListener("click", () => setContextDrawerOpen(false));
elements.problemCenterButton.addEventListener("click", () => requestWorkspaceChange("problems"));
elements.homeTab.addEventListener("click", () => requestWorkspaceChange("home"));
elements.problemsTab.addEventListener("click", () => requestWorkspaceChange("problems"));
elements.charactersTab.addEventListener("click", () => requestWorkspaceChange("characters"));
elements.dataTab.addEventListener("click", () => requestWorkspaceChange("data"));
elements.storyTab.addEventListener("click", () => requestWorkspaceChange("story"));
elements.assetsTab.addEventListener("click", () => requestWorkspaceChange("assets"));
bindImeSafeInput(elements.fileSearch, renderFileList);
elements.formModeButton.addEventListener("click", () => setViewMode(isStoryDslEditingFile() ? "dsl" : "form"));
elements.jsonModeButton.addEventListener("click", () => setViewMode("json"));
elements.saveStorySourceButton.addEventListener("click", saveCurrentStoryJsonAsSource);
elements.mapFocusButton.addEventListener("click", () => setMapFocusMode(!state.mapEditor.focusMode));
elements.formatButton.addEventListener("click", formatCurrentJson);
elements.validateButton.addEventListener("click", runProjectChecks);
elements.saveButton.addEventListener("click", saveCurrentFile);
elements.newStoryButton.addEventListener("click", openNewStoryDialog);
elements.newSpeakerButton.addEventListener("click", openSpeakerToolDialog);
elements.portraitCheckButton.addEventListener("click", runPortraitCheckFromToolbar);
elements.characterCheckButton.addEventListener("click", focusCheckResults);
elements.modSelect.addEventListener("change", () => switchMod(elements.modSelect.value));
bindImeSafeInput(elements.contentSearch, () => {
  if (state.mode === "story") {
    renderStoryView();
  } else {
    updateSearchMatches();
  }
});
elements.contentSearch.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    jumpSearch(event.shiftKey ? -1 : 1);
  }
});
elements.findPreviousButton.addEventListener("click", () => jumpSearch(-1));
elements.findNextButton.addEventListener("click", () => jumpSearch(1));
elements.outlineSelect.addEventListener("change", jumpToSelectedOutline);
elements.editor.addEventListener("input", handleTextEditorInput);
elements.editor.addEventListener("click", renderCursorState);
elements.editor.addEventListener("keyup", renderCursorState);
elements.editor.addEventListener("select", () => {
  renderCursorState();
  renderSelectionLookup();
});

initializeShell();

window.addEventListener("keydown", handleGlobalKeydown);
window.addEventListener("beforeunload", (event) => {
  if (!dirtyStateController.isDirty()) {
    return;
  }

  event.preventDefault();
  event.returnValue = "";
});

boot();

function initializeShell() {
  shellController.initialize();
}

function setNavigationCollapsed(collapsed, options = {}) {
  shellController.setNavigationCollapsed(collapsed, options);
}

function setContextDrawerOpen(open, options = {}) {
  shellController.setContextDrawerOpen(open, options);
}

function renderShellContext() {
  shellController.renderContext();
}

function renderInspectorStatus(ok, label) {
  shellController.renderInspectorStatus(ok, label);
}

function initializeMonacoEditor() {
  if (!elements.monacoHost || !window.require) {
    useLegacyTextEditor();
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    window.require.config({ paths: { vs: "/vendor/monaco/vs" } });
    window.require(["vs/editor/editor.main"], () => {
      registerStoryDslMonacoLanguage();
      monacoState.editor = monaco.editor.create(elements.monacoHost, {
        value: elements.editor.value,
        language: "json",
        theme: "vs",
        automaticLayout: true,
        minimap: { enabled: true },
        fontSize: 13,
        lineNumbersMinChars: 3,
        scrollBeyondLastLine: false,
        wordWrap: "off",
        tabSize: 2,
        insertSpaces: true,
        renderLineHighlight: "line",
        padding: { top: 10, bottom: 10 },
      });
      monacoState.editor.onDidChangeModelContent(() => {
        if (monacoState.suppressChange) {
          return;
        }

        elements.editor.value = monacoState.editor.getValue();
        handleTextEditorInput();
      });
      monacoState.editor.onDidChangeCursorPosition(renderCursorState);
      monacoState.editor.onDidChangeCursorSelection(renderCursorState);
      monacoState.ready = true;
      syncMonacoFromEditor();
      resolve(true);
    }, () => {
      useLegacyTextEditor();
      resolve(false);
    });
  });
}

function useLegacyTextEditor() {
  elements.editor.classList.remove("legacy-editor");
  elements.monacoHost?.classList.add("hidden");
}

function registerStoryDslMonacoLanguage() {
  if (!window.monaco || monaco.languages.getLanguages().some((language) => language.id === "storydsl")) {
    return;
  }

  monaco.languages.register({
    id: "storydsl",
    extensions: [".story"],
    aliases: ["Story DSL", "storydsl"],
  });
  monaco.languages.setLanguageConfiguration("storydsl", {
    comments: { lineComment: "//" },
    brackets: [["(", ")"], ["[", "]"]],
    autoClosingPairs: [
      { open: "(", close: ")" },
      { open: "[", close: "]" },
    ],
  });
  monaco.languages.setMonarchTokensProvider("storydsl", {
    defaultToken: "",
    keywords: ["if", "elif", "else", "battle", "jump", "and", "or", "not", "win", "lose", "timeout"],
    tokenizer: {
      root: [
        [/\/\/.*$/, "comment"],
        [/^(#)(.*)$/, ["keyword", "type.identifier"]],
        [/^(\s*)(-)(\s*)(win|lose|timeout)\b/, ["", "keyword", "", "keyword"]],
        [/^(\s*)(-)(\s*)(.*)$/, ["", "keyword", "", "string"]],
        [/^(\s*)(if|elif|else|battle|jump)\b/, ["", "keyword"]],
        [/^(\s*)([A-Za-z_][\w.]*)\b/, ["", "identifier"]],
        [/^(\s*)([^:：\s][^:：]*)([:：])/, ["", "type.identifier", "delimiter"]],
        [/\$[A-Za-z_][\w\u4e00-\u9fa5]*/, "variable"],
        [/[+-]?\d+(?:\.\d+)?/, "number"],
        [/[=!<>]=?|&&|\|\||!/, "operator"],
        [/[\[\],()]/, "delimiter"],
      ],
    },
  });
}

function handleTextEditorInput() {
  dirtyStateController.markDirty({ render: false });
  if (isStorySourceFile() && state.viewMode === "dsl") {
    updateStoryDslAnalysis({ showSuccess: false });
  }
  updateSearchMatches();
  renderEditorOutline();
  renderDirtyState();
  renderCursorState();
}

function setTextEditorVisible(visible) {
  elements.monacoHost.classList.toggle("hidden", !visible);
  if (!monacoState.editor) {
    elements.editor.classList.toggle("hidden", !visible);
  }
  if (visible) {
    scheduleEditorLayout();
  }
}

function setEditorValue(value) {
  elements.editor.value = value;
  if (!monacoState.editor) {
    return;
  }

  if (monacoState.editor.getValue() === value) {
    return;
  }

  monacoState.suppressChange = true;
  monacoState.editor.setValue(value);
  monacoState.suppressChange = false;
}

function resetEditorViewport() {
  if (monacoState.editor) {
    const position = { lineNumber: 1, column: 1 };
    monacoState.editor.setPosition(position);
    monacoState.editor.setScrollPosition({ scrollTop: 0, scrollLeft: 0 });
    monacoState.editor.revealPosition(position);
    scheduleEditorLayout();
  } else {
    elements.editor.setSelectionRange(0, 0);
    elements.editor.scrollTop = 0;
    elements.editor.scrollLeft = 0;
  }

  renderCursorState();
}

function getEditorValue() {
  return monacoState.editor ? monacoState.editor.getValue() : elements.editor.value;
}

function isEditorReadOnly() {
  return elements.editor.readOnly;
}

function setEditorReadOnly(readOnly) {
  elements.editor.readOnly = readOnly;
  monacoState.editor?.updateOptions({ readOnly });
}

function setEditorLanguage(language) {
  monacoState.language = language;
  if (monacoState.editor && window.monaco) {
    monaco.editor.setModelLanguage(monacoState.editor.getModel(), language);
    if (language !== "storydsl") {
      setMonacoDiagnostics([]);
    }
  }
}

function syncMonacoFromEditor() {
  if (!monacoState.editor) {
    return;
  }

  setEditorValue(elements.editor.value);
  setEditorLanguage(monacoState.language);
  scheduleEditorLayout();
}

function focusTextEditor() {
  if (monacoState.editor && !elements.monacoHost.classList.contains("hidden")) {
    monacoState.editor.focus();
  } else {
    elements.editor.focus();
  }
}

function scheduleEditorLayout() {
  if (!monacoState.editor) {
    return;
  }

  monacoState.editor.layout();
  window.requestAnimationFrame(() => {
    monacoState.editor?.layout();
    window.requestAnimationFrame(() => monacoState.editor?.layout());
  });
}

function getEditorCursorPosition() {
  if (monacoState.editor) {
    const position = monacoState.editor.getPosition();
    if (position) {
      return {
        line: position.lineNumber,
        column: position.column,
      };
    }
  }

  const position = elements.editor.selectionStart ?? 0;
  const textBeforeCursor = elements.editor.value.slice(0, position);
  const lines = textBeforeCursor.split("\n");
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

function getEditorSelectedText() {
  if (monacoState.editor) {
    const model = monacoState.editor.getModel();
    const selection = monacoState.editor.getSelection();
    if (!model || !selection || selection.isEmpty()) {
      return "";
    }

    return model.getValueInRange(selection);
  }

  const start = elements.editor.selectionStart ?? 0;
  const end = elements.editor.selectionEnd ?? 0;
  return start === end ? "" : elements.editor.value.slice(start, end);
}

function setEditorSelectionByOffsets(start, end) {
  const textLength = getEditorValue().length;
  const safeStart = Math.max(0, Math.min(start, textLength));
  const safeEnd = Math.max(safeStart, Math.min(end, textLength));
  if (monacoState.editor) {
    const model = monacoState.editor.getModel();
    if (!model) {
      return;
    }

    const startPosition = model.getPositionAt(safeStart);
    const endPosition = model.getPositionAt(safeEnd);
    const selection = new monaco.Selection(
      startPosition.lineNumber,
      startPosition.column,
      endPosition.lineNumber,
      endPosition.column);
    monacoState.editor.setSelection(selection);
    monacoState.editor.revealRangeInCenter(selection);
    monacoState.editor.focus();
    renderCursorState();
    return;
  }

  elements.editor.focus();
  elements.editor.setSelectionRange(safeStart, safeEnd);
  renderCursorState();
}

function setEditorCursorToPosition(lineNumber, columnNumber = 1) {
  const text = getEditorValue();
  const lines = text.split("\n");
  const lineIndex = Math.max(0, Math.min(lineNumber - 1, Math.max(0, lines.length - 1)));
  const columnIndex = Math.max(0, Math.min(columnNumber - 1, lines[lineIndex]?.length || 0));

  if (monacoState.editor) {
    const position = {
      lineNumber: lineIndex + 1,
      column: columnIndex + 1,
    };
    monacoState.editor.setPosition(position);
    monacoState.editor.revealPositionInCenter(position);
    monacoState.editor.focus();
    renderCursorState();
    return;
  }

  let offset = 0;
  for (let index = 0; index < lineIndex; index += 1) {
    offset += lines[index].length + 1;
  }

  setEditorSelectionByOffsets(offset + columnIndex, offset + columnIndex);
}

function setMonacoDiagnostics(diagnostics) {
  if (!window.monaco || !monacoState.editor) {
    return;
  }

  const model = monacoState.editor.getModel();
  if (!model) {
    return;
  }

  const markers = (diagnostics || []).map((diagnostic) => {
    const start = diagnostic.span?.start || { line: 1, column: 1 };
    const end = diagnostic.span?.end || start;
    const startLineNumber = Math.max(1, start.line || 1);
    const startColumn = Math.max(1, start.column || 1);
    const endLineNumber = Math.max(startLineNumber, end.line || startLineNumber);
    const endColumn = endLineNumber === startLineNumber
      ? Math.max(startColumn + 1, end.column || startColumn + 1)
      : Math.max(1, end.column || 1);
    return {
      severity: diagnostic.severity === "warning"
        ? monaco.MarkerSeverity.Warning
        : monaco.MarkerSeverity.Error,
      message: diagnostic.message,
      code: diagnostic.code || "storydsl",
      startLineNumber,
      startColumn,
      endLineNumber,
      endColumn,
    };
  });

  monaco.editor.setModelMarkers(model, "storydsl", markers);
}

async function boot() {
  await initializeMonacoEditor();
  await loadWorkspace();
  await Promise.all([loadDataFiles(), loadAssetFiles()]);
  state.recentEntries = recentItemsStore.read(state.activeModId);
  await rebuildContentIndex();
  await loadStoryGraph();
  await validateContent();
  setMode("home");
}

async function loadWorkspace() {
  state.workspace = await requestJson("/api/workspace");
  state.mods = Array.isArray(state.workspace.mods) ? state.workspace.mods : [];
  const savedModId = preferences.get(storageKeys.activeModId);
  const defaultModId = state.workspace.defaultModId || "jyxr-expansion";
  state.activeModId = state.mods.some((mod) => mod.id === savedModId)
    ? savedModId
    : state.mods.some((mod) => mod.id === defaultModId)
      ? defaultModId
      : state.mods[0]?.id || defaultModId;
  renderModSelect();
  renderWorkspacePath();
  const activeMod = getActiveMod();
  if (activeMod && !activeMod.dataExists) {
    showValidation(false, `缺少 MOD data 目录：${activeMod.path}/data`);
  }
  if (!state.workspace.assetsExists) {
    elements.assetPreview.textContent = `缺少 assets 目录：${state.workspace.assetsPath}`;
  }
}

function renderModSelect() {
  elements.modSelect.replaceChildren();
  for (const mod of state.mods) {
    const option = document.createElement("option");
    option.value = mod.id;
    option.textContent = `${mod.name || mod.id} (${mod.id})`;
    option.selected = mod.id === state.activeModId;
    elements.modSelect.appendChild(option);
  }

  if (state.mods.length === 0) {
    const option = document.createElement("option");
    option.value = state.activeModId;
    option.textContent = state.activeModId;
    elements.modSelect.appendChild(option);
  }
}

function renderWorkspacePath() {
  const activeMod = getActiveMod();
  const modText = activeMod
    ? `${activeMod.name || activeMod.id} · ${activeMod.path}/data`
    : state.activeModId;
  const summary = `正在编辑：${modText}  |  共享资产：${state.workspace.assetsPath}`;
  elements.workspacePath.textContent = summary;
  elements.workspacePath.title = summary;
}

async function switchMod(modId) {
  if (modId === state.activeModId) {
    return;
  }

  if (!(await confirmDiscardChanges())) {
    elements.modSelect.value = state.activeModId;
    return;
  }

  state.activeModId = modId;
  preferences.set(storageKeys.activeModId, modId);
  state.currentPath = "";
  dirtyStateController.markClean({ render: false });
  state.formRecords = [];
  state.selectedRecordIndex = 0;
  state.storySource = {
    path: "",
    text: "",
    jsonText: "",
    diagnostics: [],
    kind: "",
  };
  state.selectedStoryGroupId = "";
  state.selectedStoryNodeId = "";
  setEditorValue("");
  setEditorReadOnly(false);
  setEditorLanguage("json");
  elements.currentPath.textContent = "未选择文件";
  elements.saveState.textContent = "";
  renderWorkspacePath();
  await Promise.all([loadDataFiles(), loadAssetFiles()]);
  await rebuildContentIndex();
  await loadStoryGraph();
  state.recentEntries = recentItemsStore.read(state.activeModId);
  renderDirtyState();
  renderCursorState();
  await validateContent();
  setMode("home");
}

function getActiveMod() {
  return state.mods.find((mod) => mod.id === state.activeModId) || null;
}

async function loadDataFiles() {
  state.dataFiles = await requestJson("/api/data/files");
}

async function loadAssetFiles() {
  state.assetFiles = await requestJson("/api/assets/files");
  state.assetFilePathSet = new Set(state.assetFiles.map((file) => file.path));
}

async function loadStoryGraph() {
  try {
    state.storyGraph = await requestJson("/api/story/graph");
    if (!state.selectedStoryGroupId && state.storyGraph.groups.length > 0) {
      state.selectedStoryGroupId = state.storyGraph.groups[0].id;
    }
  } catch (error) {
    state.storyGraph = null;
    showValidation(false, error.message);
  } finally {
    renderProblemIndicators();
  }
}

function setMode(mode) {
  mode = normalizeWorkspaceMode(mode);
  state.mode = mode;
  const isOverview = mode === "home" || mode === "problems";
  const isStory = mode === "story";
  const isCharacters = mode === "characters";

  document.body.classList.toggle("story-mode", isStory);
  document.body.classList.toggle("characters-mode", isCharacters);
  document.body.classList.toggle("overview-mode", isOverview);
  elements.editorPane.classList.toggle("overview-workspace", isOverview);
  elements.homeTab.classList.toggle("active", mode === "home");
  elements.problemsTab.classList.toggle("active", mode === "problems");
  elements.charactersTab.classList.toggle("active", isCharacters);
  elements.dataTab.classList.toggle("active", mode === "data");
  elements.storyTab.classList.toggle("active", isStory);
  elements.assetsTab.classList.toggle("active", mode === "assets");
  elements.homeView.classList.toggle("hidden", mode !== "home");
  elements.problemCenterView.classList.toggle("hidden", mode !== "problems");
  elements.characterWorkspaceView.classList.toggle("hidden", !isCharacters);
  elements.workspacePaneHeader.classList.toggle("hidden", isOverview || isCharacters);
  elements.editorTools.classList.toggle("hidden", isOverview || isStory || isCharacters);
  elements.editorStatusbar.classList.toggle("hidden", isOverview || isStory || isCharacters);

  elements.fileSearch.value = "";
  elements.fileSearch.placeholder = isStory
    ? "搜索剧情线"
    : mode === "assets"
      ? "搜索资产"
      : "搜索文件";
  elements.saveButton.disabled = mode !== "data" && !isCharacters;
  elements.formatButton.disabled = mode !== "data";

  if (mode === "home") {
    elements.formView.classList.add("hidden");
    elements.storyView.classList.add("hidden");
    setTextEditorVisible(false);
    renderProjectHomeWorkspace();
  } else if (mode === "problems") {
    elements.formView.classList.add("hidden");
    elements.storyView.classList.add("hidden");
    setTextEditorVisible(false);
    renderProblemCenterWorkspace();
  } else if (isCharacters) {
    elements.formView.classList.add("hidden");
    elements.storyView.classList.add("hidden");
    setTextEditorVisible(false);
    elements.currentPath.textContent = "characters.json";
    renderCharacterWorkspaceView();
  } else if (isStory) {
    elements.currentPath.textContent = "剧情图谱";
    elements.saveState.textContent = "";
    elements.assetPreview.textContent = "剧情视图不预览资产";
    elements.formModeButton.disabled = true;
    elements.jsonModeButton.disabled = true;
    elements.saveStorySourceButton.classList.add("hidden");
    elements.formView.classList.add("hidden");
    setTextEditorVisible(false);
    elements.storyView.classList.remove("hidden");
    renderDirtyState();
    renderStoryView();
    renderEditorOutline();
    renderCurrentFileInfo();
  } else {
    elements.storyView.classList.add("hidden");
    if (isStoryDslEditingFile()) {
      setViewMode(state.viewMode === "json" ? "json" : "dsl");
    } else {
      elements.formModeButton.textContent = "表单";
      elements.jsonModeButton.textContent = "JSON";
      elements.formModeButton.disabled = state.formRecords.length === 0;
      elements.jsonModeButton.disabled = false;
      elements.formView.classList.toggle("hidden", state.viewMode !== "form");
      setTextEditorVisible(state.viewMode === "json");
    }
    renderEditorOutline();
  }

  updateMapFocusControl();
  updateStorySourceButton();
  renderShellContext();
  if (!isOverview && !isCharacters) {
    renderFileList();
    renderCurrentFileInfo();
  }
  renderProblemIndicators();
  scheduleEditorLayout();
}


async function requestWorkspaceChange(mode) {
  if (mode === state.mode) return;
  const switchingCharacterSurface = isCharacterFile()
    && ((state.mode === "characters" && mode === "data") || (state.mode === "data" && mode === "characters"));
  if (switchingCharacterSurface) {
    if (mode === "characters") {
      try {
        const records = parseJsonText(getEditorValue());
        if (!Array.isArray(records) || !records.every((record) => record && typeof record === "object" && !Array.isArray(record))) {
          throw new Error("characters.json 顶层必须是角色对象数组。");
        }
        state.formRecords = records;
        state.selectedRecordIndex = Math.min(state.selectedRecordIndex, Math.max(0, records.length - 1));
        state.viewMode = "form";
        setMode("characters");
      } catch (error) {
        showValidation(false, error instanceof SyntaxError ? formatJsonError(error) : error.message);
      }
    } else {
      setMode("data");
      setViewMode("json");
    }
    return;
  }
  if (dirtyStateController.isDirty()) {
    if (!(await confirmDiscardChanges())) return;
    await reloadCurrentDataFile();
  }
  if (mode === "characters") {
    await openCharacterWorkspace();
  } else if (mode === "data" || mode === "story" || mode === "assets") {
    await openWorkspaceMode(mode);
  } else {
    setMode(mode);
  }
}

async function reloadCurrentDataFile() {
  if (!state.currentPath || !state.dataFiles.some((file) => file.path === state.currentPath)) {
    dirtyStateController.markClean();
    return;
  }
  const file = await requestJson(`/api/data/file?path=${encodeURIComponent(state.currentPath)}`);
  setEditorValue(file.content);
  dirtyStateController.markClean({ render: false });
  refreshFormFromEditor({ preferForm: state.viewMode === "form" || state.mode === "characters" });
  renderDirtyState();
}

async function openWorkspaceMode(mode) {
  setMode(mode);
  if (mode === "data" && !state.dataFiles.some((file) => file.path === state.currentPath)) {
    await openLastDataFile();
    if (!state.dataFiles.some((file) => file.path === state.currentPath) && state.dataFiles.length > 0) {
      await openDataFile(state.dataFiles[0].path);
    }
  }
}


async function openCharacterWorkspace() {
  if (state.mode === "characters" && isCharacterFile() && state.formRecords.length > 0) {
    renderCharacterWorkspaceView();
    return;
  }
  if (!state.dataFiles.some((file) => file.path === "characters.json")) {
    showValidation(false, "当前 MOD 缺少 characters.json。");
    return;
  }
  await openDataFile("characters.json");
  if (!isCharacterFile()) {
    return;
  }
  state.viewMode = "form";
  setMode("characters");
}

function renderCharacterWorkspaceView() {
  if (state.mode !== "characters") {
    return;
  }
  renderCharacterWorkspace(elements.characterWorkspaceView, {
    state,
    getIssues: getCharacterValidationIssues,
    getPortraitInfo: getCharacterPortraitInfo,
    matchesRecordFilter: matchesCharacterFilter,
    getReferences: getCharacterReferences,
    referenceOptions: getCharacterReferenceOptions(),
    onSelect: (index) => {
      state.selectedRecordIndex = index;
      state.characterWorkspace.referencesOpen = false;
      renderCharacterWorkspaceView();
      renderProblemIndicators();
    },
    onSearch: (value) => {
      state.characterWorkspace.search = value;
      renderCharacterWorkspaceView();
      const search = elements.characterWorkspaceView.querySelector(".character-list-search");
      if (search) {
        search.focus();
        search.setSelectionRange(value.length, value.length);
      }
    },
    onFilter: (value) => {
      state.characterWorkspace.filter = value;
      renderCharacterWorkspaceView();
    },
    onTab: (value) => {
      state.characterWorkspace.tab = value;
      renderCharacterWorkspaceView();
    },
    onMutate: (record, key, value) => {
      record[key] = value;
      syncFormToEditor();
      renderCharacterWorkspaceView();
    },
    onReplaceRecord: (record) => {
      state.formRecords[state.selectedRecordIndex] = record;
      syncFormToEditor();
      renderCharacterWorkspaceView();
    },
    onPickPortrait: () => openPortraitPicker(getCurrentCharacterPortraitAssetPath()),
    onCreate: createCharacterRecord,
    onCreateSpeaker: openSpeakerToolDialog,
    onDuplicate: duplicateCharacterRecord,
    onDelete: deleteCharacterRecord,
    onOpenReferences: () => {
      state.characterWorkspace.referencesOpen = true;
      renderCharacterWorkspaceView();
    },
    onCloseReferences: () => {
      state.characterWorkspace.referencesOpen = false;
      renderCharacterWorkspaceView();
    },
    onOpenAdvancedData: async () => {
      setMode("data");
      state.viewMode = "json";
      setViewMode("json");
      const record = state.formRecords[state.selectedRecordIndex];
      if (record?.id) {
        const definition = (state.contentIndex.definitionsById.get(record.id) || [])
          .find((candidate) => candidate.path === "characters.json");
        if (definition?.line) selectLine(definition.line);
      }
    },
    onOpenProblems: () => requestWorkspaceChange("problems"),
  });
  renderPortraitPicker();
}

function createCharacterRecord() {
  const id = createUniqueId("新角色");
  const record = {
    id,
    name: "新角色",
    level: 1,
    portrait: null,
    model: null,
    gender: "neutral",
    growTemplate: null,
    arenaEnabled: false,
    talentIds: [],
    stats: {
      bili: 10, dingli: 10, fuyuan: 10, gengu: 10,
      jianfa: 10, daofa: 10, quanzhang: 10, qimen: 10,
      shenfa: 10, wuxing: 10, wuxue: 10, max_hp: 100, max_mp: 100,
    },
    specialSkillIds: [],
    internalSkills: [],
    equipmentIds: [],
    externalSkills: [],
  };
  state.formRecords.push(record);
  state.selectedRecordIndex = state.formRecords.length - 1;
  state.characterWorkspace.filter = "all";
  state.characterWorkspace.search = "";
  state.characterWorkspace.tab = "overview";
  syncFormToEditor();
  renderCharacterWorkspaceView();
}

function duplicateCharacterRecord() {
  const current = state.formRecords[state.selectedRecordIndex];
  if (!current) return;
  const copy = structuredCloneCompat(current);
  copy.id = createUniqueId(`${String(current.id || "新角色")}_copy`);
  copy.name = `${String(current.name || current.id || "新角色")} 副本`;
  state.formRecords.splice(state.selectedRecordIndex + 1, 0, copy);
  state.selectedRecordIndex += 1;
  syncFormToEditor();
  renderCharacterWorkspaceView();
}

function deleteCharacterRecord() {
  const current = state.formRecords[state.selectedRecordIndex];
  if (!current) return;
  const references = getCharacterReferences(current);
  const referenceSummary = references.length > 0
    ? `静态扫描找到 ${references.length} 处引用。\n\n${references.slice(0, 5).map((item) => `${item.path} · ${item.fieldPath}`).join("\n")}\n\n`
    : "静态扫描未找到引用，但无法覆盖动态脚本或运行时引用。\n\n";
  if (!confirmAction(`${referenceSummary}确认删除角色「${current.name || current.id}」？此操作会留在未保存状态。`)) {
    return;
  }
  state.formRecords.splice(state.selectedRecordIndex, 1);
  state.selectedRecordIndex = Math.max(0, Math.min(state.selectedRecordIndex, state.formRecords.length - 1));
  state.characterWorkspace.referencesOpen = false;
  syncFormToEditor();
  renderCharacterWorkspaceView();
}

function getCharacterReferences(record) {
  const values = new Set([record?.id, record?.name].filter((value) => typeof value === "string" && value.trim()).map((value) => value.trim()));
  const references = [];
  for (const value of values) {
    for (const reference of state.contentIndex.referencesByValue?.get(value) || []) {
      if (reference.path === "characters.json" && reference.ownerDefinitionId === record.id) {
        continue;
      }
      references.push({ ...reference, value });
    }
  }
  return Array.from(new Map(references.map((item) => [`${item.path}:${item.fieldPath}:${item.value}`, item])).values())
    .sort((left, right) => left.path.localeCompare(right.path, "zh-Hans-CN") || left.fieldPath.localeCompare(right.fieldPath));
}

function getCharacterReferenceOptions() {
  function definitionsOfType(type, predicate = () => true, projector = createReferenceOption) {
    const options = [];
    for (const definitions of state.contentIndex.definitionsById.values()) {
      for (const definition of definitions) {
        if (definition.type === type && predicate(definition.id)) {
          options.push(projector(definition));
        }
      }
    }
    return Array.from(new Map(options.map((option) => [option.id, option])).values())
      .sort((left, right) => left.name.localeCompare(right.name, "zh-Hans-CN") || left.id.localeCompare(right.id, "zh-Hans-CN"));
  }

  const modelIds = new Set(
    state.formRecords
      .map((record) => typeof record?.model === "string" ? record.model.trim() : "")
      .filter(Boolean)
  );
  for (const [value, references] of state.contentIndex.referencesByValue || []) {
    if (references.some((reference) => /\.model$/.test(reference.fieldPath))) {
      modelIds.add(value);
    }
  }

  return {
    models: Array.from(modelIds).sort((left, right) => left.localeCompare(right, "zh-Hans-CN"))
      .map((id) => createReferenceOption({ id, displayName: id, type: "model", record: { id, name: id } })),
    growTemplates: definitionsOfType("grow-templates", () => true, createGrowTemplateReferenceOption),
    externalSkills: definitionsOfType("external-skills", () => true, createExternalSkillReferenceOption),
    internalSkills: definitionsOfType("internal-skills", () => true, createInternalSkillReferenceOption),
    specialSkills: definitionsOfType("special-skills", () => true, createSpecialSkillReferenceOption),
    talents: definitionsOfType("talents", () => true, createTalentReferenceOption),
    equipment: definitionsOfType("items", isEquipmentId, createEquipmentReferenceOption),
  };
}

function createReferenceOption(definition, details = {}) {
  const record = definition.record || {};
  const iconId = details.iconId || record.icon || record.picture || "";
  const resource = iconId ? state.contentIndex.resourcesById.get(iconId) : null;
  const iconPath = resource
    ? resolveResourceAssetPath(resource)
    : iconId ? (findAssetPath(iconId, { art: true }) || findAssetPath(`icon/${iconId}`, { art: true })) : "";
  const option = {
    id: definition.id,
    name: definition.displayName || record.name || definition.id,
    type: definition.type,
    typeLabel: details.typeLabel || definition.type,
    iconId,
    iconPath,
    subtitle: details.subtitle || "",
    description: typeof record.description === "string" ? record.description : "",
    metadata: [
      ...(details.metadata || []),
      iconId ? (iconPath ? "图标已解析" : `图标未解析 ${iconId}`) : "未配置图标",
    ].filter(Boolean),
  };
  option.searchText = [option.name, option.id, option.typeLabel, option.subtitle, option.description, ...option.metadata].join(" ");
  return option;
}

function createGrowTemplateReferenceOption(definition) {
  const growth = definition.record?.statGrowth || {};
  const highlights = ["bili", "gengu", "shenfa", "wuxing", "max_hp", "max_mp"]
    .filter((key) => Number.isFinite(growth[key]) && growth[key] !== 0)
    .slice(0, 4)
    .map((key) => `${key} +${growth[key]}`);
  return createReferenceOption(definition, {
    typeLabel: "成长模板",
    subtitle: highlights.length > 0 ? highlights.join(" · ") : "未配置成长属性",
    metadata: Object.entries(growth).filter(([, value]) => Number.isFinite(value) && value !== 0).map(([key, value]) => `${key} +${value}`),
  });
}

function createExternalSkillReferenceOption(definition) {
  const record = definition.record || {};
  const typeLabels = { quanzhang: "拳掌", jianfa: "剑法", daofa: "刀法", qimen: "奇门", internal_skill: "内功" };
  return createReferenceOption(definition, {
    typeLabel: "外功",
    subtitle: [typeLabels[record.type] || record.type, Number.isFinite(record.powerBase) ? `基础威力 ${record.powerBase}` : "", Number.isFinite(record.cooldown) ? `冷却 ${record.cooldown}` : ""].filter(Boolean).join(" · "),
    metadata: [Number.isFinite(record.powerStep) ? `成长 ${record.powerStep}` : "", Number.isFinite(record.hard) ? `难度 ${record.hard}` : "", `${record.formSkills?.length || 0} 个招式`],
  });
}

function createInternalSkillReferenceOption(definition) {
  const record = definition.record || {};
  return createReferenceOption(definition, {
    typeLabel: "内功",
    subtitle: [`阴 ${record.yin ?? 0}`, `阳 ${record.yang ?? 0}`, Number.isFinite(record.hard) ? `难度 ${record.hard}` : ""].filter(Boolean).join(" · "),
    metadata: [Number.isFinite(record.attackScale) ? `攻击 ${record.attackScale}` : "", Number.isFinite(record.defenceScale) ? `防御 ${record.defenceScale}` : "", Number.isFinite(record.criticalScale) ? `暴击 ${record.criticalScale}` : ""],
  });
}

function createSpecialSkillReferenceOption(definition) {
  const record = definition.record || {};
  const costs = Object.entries(record.cost || {}).filter(([, value]) => Number(value) !== 0).map(([key, value]) => `${key} ${value}`);
  return createReferenceOption(definition, {
    typeLabel: "绝技",
    subtitle: [Number.isFinite(record.cooldown) ? `冷却 ${record.cooldown}` : "", costs.length > 0 ? `消耗 ${costs.join(" / ")}` : "无消耗"].filter(Boolean).join(" · "),
    metadata: [record.targeting?.impactType ? `范围 ${record.targeting.impactType}` : "", `${record.buffs?.length || 0} 个 Buff`],
  });
}

function createTalentReferenceOption(definition) {
  const record = definition.record || {};
  return createReferenceOption(definition, {
    typeLabel: "天赋",
    subtitle: Number.isFinite(record.point) ? `天赋点 ${record.point}` : "",
    metadata: [`${record.affixes?.length || 0} 个效果`],
  });
}

function createEquipmentReferenceOption(definition) {
  const record = definition.record || {};
  const slots = { weapon: "武器", armor: "防具", accessory: "饰品" };
  const allAffixes = (record.affixes || []).map(formatReferenceAffix).filter(Boolean);
  const affixes = allAffixes.slice(0, 5);
  if (allAffixes.length > affixes.length) affixes.push(`另 ${allAffixes.length - affixes.length} 个效果`);
  return createReferenceOption(definition, {
    typeLabel: "装备",
    subtitle: [slots[record.slotType] || record.slotType, Number.isFinite(record.level) ? `等级 ${record.level}` : "", Number.isFinite(record.price) ? `价格 ${record.price}` : ""].filter(Boolean).join(" · "),
    metadata: affixes,
  });
}

function formatReferenceAffix(affix) {
  if (!affix || typeof affix !== "object") return "";
  if (affix.type === "stat_modifier") {
    const delta = affix.value?.delta;
    return `${affix.stat || "属性"} ${Number(delta) >= 0 ? "+" : ""}${delta ?? 0}`;
  }
  if (affix.type === "grant_talent") return `天赋 ${affix.talentId || "未填写"}`;
  return affix.type || "未知效果";
}

function renderProjectHomeWorkspace() {
  const definitionCount = Array.from(state.contentIndex.definitionsById.values())
    .reduce((total, definitions) => total + definitions.length, 0);
  renderProjectHome(elements.homeView, {
    mod: getActiveMod(),
    dataFileCount: state.dataFiles.length,
    assetFileCount: state.assetFiles.length,
    definitionCount,
    storyNodeCount: state.storyGraph?.summary?.nodeCount || 0,
    problems: collectProjectProblems(),
    recentEntries: state.recentEntries,
    quickStarts: [
      { label: "角色与伙伴", detail: "编辑角色、头像、成长与武学", icon: "人", mode: "characters", path: "characters.json", available: true },
      { label: "地图与事件", detail: "编辑地图、点位和交互事件", icon: "图", mode: "data", path: "maps.json", available: false },
      { label: "剧情与任务", detail: "查看剧情图谱与静态诊断", icon: "文", mode: "story", available: true },
      { label: "物品与装备", detail: "编辑物品、装备和效果", icon: "物", mode: "data", path: "items.json", available: false },
      { label: "商店与经济", detail: "编辑商店商品、价格和限购", icon: "商", mode: "data", path: "shops.json", available: false },
      { label: "浏览共享资源", detail: "预览项目图片、音频与文件", icon: "◇", mode: "assets", available: true },
      { label: "高级数据", detail: "打开完整文件树、表单、JSON 与 DSL", icon: "▦", mode: "data", available: true },
      { label: "问题中心", detail: "执行检查并定位内容问题", icon: "!", mode: "problems", available: true },
    ],
  }, {
    openProblems: () => setMode("problems"),
    openWorkspace: openQuickStart,
    openRecent: openRecentEntry,
  });
}

function renderProblemCenterWorkspace() {
  renderProblemCenter(elements.problemCenterView, {
    problems: collectProjectProblems(),
    filters: state.problemCenter.filters,
    checking: state.problemCenter.checking,
    lastCheckedAt: state.problemCenter.lastCheckedAt,
  }, {
    runChecks: runProjectChecks,
    setSeverity: (severity) => {
      state.problemCenter.filters.severity = severity;
      renderProblemCenterWorkspace();
    },
    setFilter: (key, value) => {
      state.problemCenter.filters[key] = value;
      renderProblemCenterWorkspace();
    },
    locateProblem,
  });
}

function renderProblemIndicators() {
  const summary = summarizeProblems(collectProjectProblems());
  elements.problemCountBadge.textContent = String(summary.total);
  elements.problemCountBadge.className = `status-badge ${summary.error > 0 ? "bad" : summary.total === 0 ? "ok" : "neutral"}`;
  elements.problemCenterButton.title = summary.total === 0
    ? "当前没有已收集的问题"
    : `${summary.error} 个错误，${summary.warning} 个警告，${summary.suggestion} 个建议`;
  if (state.mode === "home") {
    renderProjectHomeWorkspace();
  } else if (state.mode === "problems") {
    renderProblemCenterWorkspace();
  }
}

function collectProjectProblems() {
  const problems = [];
  const validation = state.problemCenter.validation;
  if (validation && !validation.ok) {
    problems.push(createProblem({
      id: "backend:content-validation",
      severity: "error",
      source: "backend-validation",
      sourceLabel: "正式内容校验",
      contentType: "project",
      contentTypeLabel: "项目",
      message: "正式内容加载校验失败",
      detail: validation.message,
    }));
  }

  for (const parseError of state.contentIndex.parseErrors || []) {
    problems.push(createProblem({
      id: `index:parse:${parseError.path}`,
      severity: "error",
      source: "content-index",
      sourceLabel: "编辑器内容索引",
      ...getProblemContentType(parseError.path),
      message: `文件无法解析：${parseError.path}`,
      detail: parseError.message,
      location: { workspace: "data", path: parseError.path, line: 1 },
    }));
  }

  for (const duplicate of state.contentIndex.duplicateDefinitions || []) {
    const first = duplicate.definitions?.[0];
    problems.push(createProblem({
      id: `index:duplicate:${duplicate.type}:${duplicate.id}`,
      severity: "error",
      source: "content-index",
      sourceLabel: "编辑器内容索引",
      ...getProblemContentType(first?.path || ""),
      message: `重复定义：${duplicate.id}`,
      detail: `类型 ${duplicate.type} 共出现 ${duplicate.count} 次。`,
      location: first ? {
        workspace: "data",
        path: first.path,
        line: first.line,
        definitionId: duplicate.id,
        definitionTypes: [duplicate.type],
      } : null,
    }));
  }

  for (const diagnostic of state.storyGraph?.diagnostics || []) {
    problems.push(createProblem({
      id: `story-graph:${diagnostic.path}:${diagnostic.line || 1}:${diagnostic.message}`,
      severity: diagnostic.severity,
      source: "story-graph",
      sourceLabel: "剧情图谱检查",
      contentType: "story",
      contentTypeLabel: "剧情",
      message: diagnostic.message,
      location: {
        workspace: "data",
        path: diagnostic.path,
        line: diagnostic.line || 1,
        definitionId: diagnostic.segmentId || "",
        definitionTypes: ["story"],
      },
    }));
  }

  for (const issue of state.portraitCheck?.issues || []) {
    problems.push(createProblem({
      id: `portrait:${issue.area}:${issue.definitionId || ""}:${issue.dataPath || ""}:${issue.message}`,
      severity: issue.severity,
      source: "portrait-check",
      sourceLabel: "头像静态检查",
      contentType: issue.area === "story" ? "story" : issue.area === "characters" ? "character" : "resource",
      contentTypeLabel: issue.area === "story" ? "剧情" : issue.area === "characters" ? "角色" : "资源",
      message: issue.message,
      detail: issue.assetPath ? `资源路径：${issue.assetPath}${issue.assetExists ? "" : "（不存在）"}` : "",
      location: issue.dataPath ? {
        workspace: "data",
        path: issue.dataPath,
        line: issue.line || 1,
        definitionId: issue.definitionId || "",
      } : issue.assetPath && issue.assetExists ? {
        workspace: "assets",
        path: issue.assetPath,
      } : null,
    }));
  }

  if (state.storySource.path && Array.isArray(state.storySource.diagnostics)) {
    for (const diagnostic of state.storySource.diagnostics) {
      problems.push(createProblem({
        id: `story-dsl:${state.storySource.path}:${diagnostic.span?.start?.line || 1}:${diagnostic.message}`,
        severity: diagnostic.severity,
        source: "story-dsl",
        sourceLabel: "Story DSL 即时检查",
        contentType: "story",
        contentTypeLabel: "剧情",
        message: diagnostic.message,
        detail: diagnostic.code || "",
        location: {
          workspace: "data",
          path: state.storySource.path,
          line: diagnostic.span?.start?.line || 1,
          column: diagnostic.span?.start?.column || 1,
        },
      }));
    }
  }

  if (isCharacterFile() && state.formRecords.length > 0) {
    appendCurrentRecordProblems(problems, "character", "角色", getCharacterValidationIssues);
  } else if (isItemFile() && state.formRecords.length > 0) {
    appendCurrentRecordProblems(problems, "item", "物品", getItemValidationIssues);
  }

  return Array.from(new Map(problems.map((problem) => [problem.id, problem])).values());
}

function appendCurrentRecordProblems(problems, contentType, contentTypeLabel, getIssues) {
  for (let index = 0; index < state.formRecords.length; index += 1) {
    const record = state.formRecords[index];
    const recordId = String(record?.id || record?.name || `#${index + 1}`);
    for (const issue of getIssues(record)) {
      problems.push(createProblem({
        id: `form:${state.currentPath}:${recordId}:${issue.message}`,
        severity: issue.severity,
        source: "form-check",
        sourceLabel: "编辑器表单检查",
        contentType,
        contentTypeLabel,
        message: issue.message,
        location: {
          workspace: contentType === "character" ? "characters" : "data",
          path: state.currentPath,
          definitionId: contentType === "character" ? recordId : (issue.definitionId || recordId),
          definitionTypes: contentType === "character" ? ["characters"] : (issue.types || []),
        },
      }));
    }
  }
}

function getProblemContentType(path) {
  const normalized = String(path || "").toLowerCase();
  if (normalized.includes("story")) return { contentType: "story", contentTypeLabel: "剧情" };
  if (normalized.endsWith("characters.json")) return { contentType: "character", contentTypeLabel: "角色" };
  if (normalized.endsWith("maps.json")) return { contentType: "map", contentTypeLabel: "地图" };
  if (normalized.endsWith("items.json")) return { contentType: "item", contentTypeLabel: "物品" };
  if (normalized.endsWith("shops.json")) return { contentType: "shop", contentTypeLabel: "商店" };
  if (normalized.endsWith("resources.json")) return { contentType: "resource", contentTypeLabel: "资源" };
  return { contentType: "data", contentTypeLabel: "高级数据" };
}

async function runProjectChecks() {
  if (state.problemCenter.checking) {
    return;
  }

  state.problemCenter.checking = true;
  renderProblemIndicators();
  try {
    await rebuildContentIndex();
    await loadStoryGraph();
    await validateContent();
    try {
      state.portraitCheck = await requestJson("/api/static/portraits/check");
    } catch (error) {
      state.portraitCheck = {
        ok: false,
        summary: { characterCount: 0, portraitResourceCount: 0, storySpeakerCount: 0, checkedPortraitCount: 0, errors: 1, warnings: 0, infos: 0 },
        issues: [{ severity: "error", area: "resources", message: error.message, dataPath: null, line: null, definitionId: null, assetPath: null, assetExists: false }],
      };
    }
    renderPortraitCheckTool();
    state.problemCenter.lastCheckedAt = new Date().toISOString();
  } finally {
    state.problemCenter.checking = false;
    renderProblemIndicators();
  }
}

async function openQuickStart(item) {
  if (item.mode === "problems") {
    setMode("problems");
    return;
  }
  if (item.mode === "characters") {
    await openCharacterWorkspace();
    return;
  }
  if (item.mode === "story" || item.mode === "assets") {
    await openWorkspaceMode(item.mode);
    return;
  }
  setMode("data");
  if (item.path && state.dataFiles.some((file) => file.path === item.path)) {
    await openDataFile(item.path);
  } else {
    await openWorkspaceMode("data");
  }
}

async function openRecentEntry(entry) {
  if (entry.workspace === "assets") {
    if (state.assetFilePathSet.has(entry.path)) {
      setMode("assets");
      openAssetFile(entry.path);
    }
    return;
  }
  if (state.dataFiles.some((file) => file.path === entry.path)) {
    setMode("data");
    await openDataFile(entry.path);
  }
}

async function locateProblem(problem) {
  const location = problem.location;
  if (!location) {
    return;
  }
  if (location.definitionId && location.definitionTypes.length > 0) {
    const definitions = state.contentIndex.definitionsById.get(location.definitionId) || [];
    const definition = definitions.find((candidate) => location.definitionTypes.includes(candidate.type));
    if (definition) {
      await revealDefinition(definition);
      return;
    }
  }
  if (location.workspace === "characters" || location.path === "characters.json") {
    await openCharacterWorkspace();
    const index = state.formRecords.findIndex((record) => record?.id === location.definitionId || record?.name === location.definitionId);
    if (index >= 0) {
      state.selectedRecordIndex = index;
      renderCharacterWorkspaceView();
    }
    return;
  }
  if (location.workspace === "assets") {
    if (location.path && state.assetFilePathSet.has(location.path)) {
      setMode("assets");
      openAssetFile(location.path);
    }
    return;
  }
  if (!location.path || !state.dataFiles.some((file) => file.path === location.path)) {
    return;
  }
  setMode("data");
  await openDataFile(location.path);
  if (location.line) {
    setEditorCursorToLine(location.line, location.column || 1);
  }
}

function recordRecentEntry(workspace, path) {
  if (!path) {
    return;
  }
  const label = workspace === "assets"
    ? path.split("/").pop() || path
    : dataFileDisplayNames.get(path) || path.replace(/^story\//, "");
  state.recentEntries = recentItemsStore.add(state.activeModId, {
    workspace,
    path,
    label,
    detail: workspace === "assets" ? "资源" : "高级数据",
  });
  if (state.mode === "home") {
    renderProjectHomeWorkspace();
  }
}

function setMapFocusMode(enabled) {
  state.mapEditor.focusMode = enabled && canUseMapFocusMode();
  updateMapFocusControl();
}

function canUseMapFocusMode() {
  return state.mode === "data" && state.viewMode === "form" && isMapFile();
}

function updateMapFocusControl() {
  if (!canUseMapFocusMode()) {
    state.mapEditor.focusMode = false;
  }

  document.body.classList.toggle("map-focus-mode", state.mapEditor.focusMode);
  elements.mapFocusButton.classList.toggle("hidden", !canUseMapFocusMode());
  elements.mapFocusButton.classList.toggle("active", state.mapEditor.focusMode);
  elements.mapFocusButton.textContent = state.mapEditor.focusMode ? "退出工作台" : "地图工作台";
  elements.mapFocusButton.title = state.mapEditor.focusMode
    ? "退出地图工作台（Esc）"
    : "隐藏两侧栏，放大地图编辑区";
}

function updateStorySourceButton() {
  const available = canSaveCurrentStoryJsonAsSource();
  elements.saveStorySourceButton.classList.toggle("hidden", !available);
  elements.saveStorySourceButton.disabled = !available;
}

function renderFileList() {
  const query = elements.fileSearch.value.trim().toLowerCase();
  if (state.mode === "story") {
    renderStoryGroupList(query);
    return;
  }

  if (state.mode === "data") {
    renderDataFileGroupList(query);
    return;
  }

  const files = state.assetFiles;
  elements.fileList.replaceChildren();

  for (const file of files) {
    if (query && !getFileSearchText(file).includes(query)) {
      continue;
    }

    elements.fileList.appendChild(createFileListItem(file));
  }
}

function renderDataFileGroupList(query) {
  elements.fileList.replaceChildren();

  const groups = [
    {
      id: "basicData",
      title: "基础数据",
      files: state.dataFiles.filter((file) => !isStoryDataFile(file.path)),
    },
    {
      id: "storyData",
      title: "故事剧情",
      files: state.dataFiles.filter((file) => isStoryDataFile(file.path)),
    },
  ];

  let visibleGroupCount = 0;
  for (const group of groups) {
    const matchingFiles = group.files.filter((file) => !query || getFileSearchText(file).includes(query));
    if (query && matchingFiles.length === 0) {
      continue;
    }

    visibleGroupCount += 1;
    const groupNode = document.createElement("section");
    groupNode.className = "file-group";
    const collapsed = !query && Boolean(state.fileGroups[group.id]?.collapsed);
    groupNode.classList.toggle("collapsed", collapsed);

    const header = document.createElement("button");
    header.type = "button";
    header.className = "file-group-header";
    header.setAttribute("aria-expanded", collapsed ? "false" : "true");
    header.title = collapsed ? `展开${group.title}` : `收起${group.title}`;

    const icon = document.createElement("span");
    icon.className = "file-group-icon";
    icon.textContent = collapsed ? "▸" : "▾";
    const title = document.createElement("span");
    title.className = "file-group-title";
    title.textContent = group.title;
    const count = document.createElement("span");
    count.className = "file-group-count";
    count.textContent = query ? `${matchingFiles.length} / ${group.files.length}` : String(group.files.length);
    header.append(icon, title, count);
    header.addEventListener("click", () => {
      state.fileGroups[group.id].collapsed = !state.fileGroups[group.id].collapsed;
      renderFileList();
    });
    groupNode.appendChild(header);

    if (!collapsed) {
      for (const file of matchingFiles) {
        groupNode.appendChild(createFileListItem(file));
      }
    }

    elements.fileList.appendChild(groupNode);
  }

  if (visibleGroupCount === 0) {
    const empty = document.createElement("div");
    empty.className = "file-item muted";
    empty.textContent = "没有匹配的文件";
    elements.fileList.appendChild(empty);
  }
}

function createFileListItem(file) {
  const storySourcePath = state.mode === "data" ? getStorySourcePathForJson(file.path) : "";
  const clickPath = storySourcePath || file.path;
  const item = document.createElement("button");
  item.type = "button";
  item.className = "file-item";
  item.title = file.path;
  item.classList.toggle("active", state.currentPath === file.path || state.currentPath === storySourcePath);
  const summary = state.contentIndex.fileSummaries.get(file.path);
  const title = document.createElement("div");
  title.className = "file-title";
  title.textContent = getFileDisplayTitle(file);
  const meta = document.createElement("div");
  meta.className = "file-meta";
  meta.textContent = formatFileMeta(file, summary, storySourcePath);
  item.append(title, meta);
  item.addEventListener("click", () => {
    if (state.mode === "data") {
      openDataFile(clickPath);
    } else {
      openAssetFile(file.path);
    }
  });
  return item;
}

function renderStoryGroupList(query) {
  elements.fileList.replaceChildren();
  const graph = state.storyGraph;
  if (!graph) {
    const item = document.createElement("div");
    item.className = "file-item muted";
    item.textContent = "剧情图谱未加载";
    elements.fileList.appendChild(item);
    return;
  }

  for (const group of graph.groups) {
    const searchable = `${group.name} ${group.id}`.toLowerCase();
    if (query && !searchable.includes(query)) {
      continue;
    }

    const item = document.createElement("button");
    item.type = "button";
    item.className = "file-item";
    item.classList.toggle("active", state.selectedStoryGroupId === group.id);
    const title = document.createElement("div");
    title.className = "file-title";
    title.textContent = group.name;
    const meta = document.createElement("div");
    meta.className = "file-meta";
    meta.textContent = `${group.nodeCount} 段 · ${group.entrypointCount} 入口 · ${group.diagnosticCount} 问题`;
    item.append(title, meta);
    item.addEventListener("click", () => {
      state.selectedStoryGroupId = group.id;
      state.selectedStoryNodeId = "";
      renderFileList();
      renderStoryView();
      renderCurrentFileInfo();
    });
    elements.fileList.appendChild(item);
  }
}

function renderStoryView() {
  elements.storyView.replaceChildren();
  const graph = state.storyGraph;
  if (!graph) {
    const empty = document.createElement("div");
    empty.className = "story-empty";
    empty.textContent = "剧情图谱未加载。";
    elements.storyView.appendChild(empty);
    return;
  }

  if (!state.selectedStoryGroupId && graph.groups.length > 0) {
    state.selectedStoryGroupId = graph.groups[0].id;
  }

  const selectedGroup = graph.groups.find((group) => group.id === state.selectedStoryGroupId) || graph.groups[0];
  if (!selectedGroup) {
    const empty = document.createElement("div");
    empty.className = "story-empty";
    empty.textContent = "没有可显示的剧情段落。";
    elements.storyView.appendChild(empty);
    return;
  }

  const groupNodes = graph.nodes
    .filter((node) => node.groupId === selectedGroup.id)
    .sort((a, b) =>
      b.externalEntrypoints - a.externalEntrypoints ||
      b.outgoing - a.outgoing ||
      a.id.localeCompare(b.id, "zh-Hans-CN"));
  const query = elements.contentSearch.value.trim().toLowerCase();
  const visibleNodes = query
    ? groupNodes.filter((node) => node.id.toLowerCase().includes(query))
    : groupNodes;

  if (!state.selectedStoryNodeId || !groupNodes.some((node) => node.id === state.selectedStoryNodeId)) {
    state.selectedStoryNodeId = visibleNodes[0]?.id || groupNodes[0]?.id || "";
  }

  const selectedNode = graph.nodes.find((node) => node.id === state.selectedStoryNodeId) || visibleNodes[0] || groupNodes[0];
  renderStorySummary(graph, selectedGroup);

  const layout = document.createElement("div");
  layout.className = "story-layout";

  const nodePanel = document.createElement("section");
  nodePanel.className = "story-panel story-node-panel";
  const nodeTitle = document.createElement("div");
  nodeTitle.className = "story-panel-title";
  nodeTitle.textContent = `段落 · ${visibleNodes.length}/${groupNodes.length}`;
  nodePanel.appendChild(nodeTitle);

  const nodeList = document.createElement("div");
  nodeList.className = "story-node-list";
  for (const node of visibleNodes) {
    nodeList.appendChild(createStoryNodeButton(node));
  }
  nodePanel.appendChild(nodeList);

  const detailPanel = document.createElement("section");
  detailPanel.className = "story-panel story-detail-panel";
  renderStoryNodeDetail(detailPanel, graph, selectedNode);

  layout.append(nodePanel, detailPanel);
  elements.storyView.appendChild(layout);

  renderStoryEdgeTable(graph, selectedGroup, query);
}

function renderStorySummary(graph, selectedGroup) {
  const header = document.createElement("div");
  header.className = "story-header";
  const titleWrap = document.createElement("div");
  const title = document.createElement("div");
  title.className = "story-title";
  title.textContent = selectedGroup.name;
  const subtitle = document.createElement("div");
  subtitle.className = "story-subtitle";
  subtitle.textContent = `全库 ${graph.summary.nodeCount} 段 · ${graph.summary.edgeCount} 条流向 · ${graph.summary.entrypointCount} 入口`;
  titleWrap.append(title, subtitle);
  header.appendChild(titleWrap);

  const search = document.createElement("input");
  search.className = "story-search";
  search.type = "search";
  search.placeholder = "搜索当前剧情线";
  search.value = elements.contentSearch.value;
  bindImeSafeInput(search, (value) => {
    elements.contentSearch.value = value;
    renderStoryView();
  });

  const metrics = document.createElement("div");
  metrics.className = "story-metrics";
  metrics.append(
    createStoryMetric("本线段落", selectedGroup.nodeCount),
    createStoryMetric("入口", selectedGroup.entrypointCount),
    createStoryMetric("流向", selectedGroup.outgoingCount),
    createStoryMetric("提醒", selectedGroup.diagnosticCount),
    createStoryMetric("错误", graph.summary.errors));
  header.append(search, metrics);
  elements.storyView.appendChild(header);
}

function createStoryMetric(label, value) {
  const item = document.createElement("div");
  item.className = "story-metric";
  const number = document.createElement("div");
  number.className = "story-metric-value";
  number.textContent = String(value);
  const text = document.createElement("div");
  text.className = "story-metric-label";
  text.textContent = label;
  item.append(number, text);
  return item;
}

function createStoryNodeButton(node) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "story-node";
  button.classList.toggle("active", state.selectedStoryNodeId === node.id);

  const title = document.createElement("div");
  title.className = "story-node-title";
  title.textContent = node.id;
  const meta = document.createElement("div");
  meta.className = "story-node-meta";
  meta.textContent = `${node.stepCount} 步 · 来源 ${node.incoming} · 去向 ${node.outgoing}`;
  const tags = document.createElement("div");
  tags.className = "story-node-tags";
  appendStoryTag(tags, `对白 ${node.dialogueCount}`);
  appendStoryTag(tags, `命令 ${node.commandCount}`);
  if (node.choiceCount > 0) appendStoryTag(tags, `选择 ${node.choiceCount}`);
  if (node.branchCount > 0) appendStoryTag(tags, `条件 ${node.branchCount}`);
  if (node.battleCount > 0) appendStoryTag(tags, `战斗 ${node.battleCount}`);
  if (node.externalEntrypoints > 0) appendStoryTag(tags, `入口 ${node.externalEntrypoints}`, "entry");
  button.append(title, meta, tags);
  button.addEventListener("click", () => {
    state.selectedStoryNodeId = node.id;
    renderStoryView();
  });
  return button;
}

function renderStoryNodeDetail(panel, graph, node) {
  panel.replaceChildren();
  if (!node) {
    const empty = document.createElement("div");
    empty.className = "story-empty";
    empty.textContent = "选择一个剧情段落。";
    panel.appendChild(empty);
    return;
  }

  const title = document.createElement("div");
  title.className = "story-panel-title";
  title.textContent = node.id;
  panel.appendChild(title);

  const actions = document.createElement("div");
  actions.className = "story-actions";
  actions.appendChild(createStoryOpenButton("打开 JSON", node.path, node.line));
  panel.appendChild(actions);

  const stats = document.createElement("div");
  stats.className = "story-detail-stats";
  stats.append(
    createStoryMetric("对白", node.dialogueCount),
    createStoryMetric("命令", node.commandCount),
    createStoryMetric("选择", node.choiceCount),
    createStoryMetric("条件", node.branchCount),
    createStoryMetric("战斗", node.battleCount),
    createStoryMetric("跳转", node.jumpCount));
  panel.appendChild(stats);

  const entries = graph.entrypoints.filter((entry) => entry.targetId === node.id);
  appendStoryDetailList(panel, "地图/世界入口", entries, (entry) => {
    const item = document.createElement("div");
    item.className = "story-row";
    item.append(
      createStoryKindBadge(entry.kind),
      createStoryTextBlock(entry.label, entry.conditions.length > 0 ? entry.conditions.join("；") : entry.sourceId),
      createStoryOpenButton("定位", entry.sourcePath, entry.line));
    return item;
  });

  const incoming = graph.edges.filter((edge) => edge.toId === node.id);
  appendStoryDetailList(panel, "从这些段落进入", incoming, (edge) => createStoryEdgeRow(edge, true));

  const outgoing = graph.edges.filter((edge) => edge.fromId === node.id);
  appendStoryDetailList(panel, "会继续到", outgoing, (edge) => createStoryEdgeRow(edge, false));

  const diagnostics = graph.diagnostics.filter((diagnostic) => diagnostic.segmentId === node.id);
  appendStoryDetailList(panel, "结构提醒", diagnostics, (diagnostic) => {
    const item = document.createElement("div");
    item.className = `story-row ${diagnostic.severity}`;
    item.append(
      createStoryKindBadge(diagnostic.severity),
      createStoryTextBlock(diagnostic.message, `${diagnostic.path}:${diagnostic.line || 1}`),
      createStoryOpenButton("定位", diagnostic.path, diagnostic.line || 1));
    return item;
  });
}

function appendStoryDetailList(panel, titleText, items, renderItem) {
  const title = document.createElement("div");
  title.className = "story-section-title";
  title.textContent = `${titleText} (${items.length})`;
  panel.appendChild(title);

  const list = document.createElement("div");
  list.className = "story-row-list";
  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "story-empty small";
    empty.textContent = "无";
    list.appendChild(empty);
  } else {
    for (const item of items.slice(0, 80)) {
      list.appendChild(renderItem(item));
    }
  }

  panel.appendChild(list);
}

function renderStoryEdgeTable(graph, selectedGroup, query) {
  const groupNodeIds = new Set(graph.nodes.filter((node) => node.groupId === selectedGroup.id).map((node) => node.id));
  const edges = graph.edges
    .filter((edge) => groupNodeIds.has(edge.fromId) || groupNodeIds.has(edge.toId))
    .filter((edge) => !query || `${edge.fromId} ${edge.toId} ${edge.label} ${edge.condition || ""}`.toLowerCase().includes(query))
    .slice(0, 500);

  const panel = document.createElement("section");
  panel.className = "story-panel story-edge-panel";
  const title = document.createElement("div");
  title.className = "story-panel-title";
  title.textContent = `本剧情线流向 · ${edges.length}`;
  panel.appendChild(title);

  const list = document.createElement("div");
  list.className = "story-edge-list";
  if (edges.length === 0) {
    const empty = document.createElement("div");
    empty.className = "story-empty small";
    empty.textContent = "当前筛选下没有跨段流向。";
    list.appendChild(empty);
  } else {
    for (const edge of edges) {
      list.appendChild(createStoryEdgeRow(edge, false));
    }
  }

  panel.appendChild(list);
  elements.storyView.appendChild(panel);
}

function createStoryEdgeRow(edge, incoming) {
  const item = document.createElement("div");
  item.className = `story-row edge-${edge.kind}`;
  const mainText = incoming ? edge.fromId : edge.toId;
  const subText = formatStoryEdgeSubtitle(edge);
  item.append(
    createStoryKindBadge(edge.kind),
    createStoryTextBlock(mainText, subText),
    createStoryOpenButton("定位", edge.sourcePath, edge.line || 1));
  return item;
}

function createStoryKindBadge(kind) {
  const badge = document.createElement("span");
  badge.className = `story-badge ${kind}`;
  badge.textContent = translateStoryKind(kind);
  return badge;
}

function formatStoryEdgeSubtitle(edge) {
  if (!edge.condition) {
    return edge.label;
  }

  if (edge.label.includes(edge.condition)) {
    return edge.label;
  }

  return `${edge.label} · ${edge.condition}`;
}

function translateStoryKind(kind) {
  switch (kind) {
    case "jump":
      return "跳转";
    case "time_key":
      return "限时";
    case "dynamic":
      return "动态";
    case "map":
      return "地图";
    case "world":
      return "世界";
    case "initial":
      return "开局";
    case "error":
      return "错误";
    case "warn":
      return "提醒";
    case "info":
      return "信息";
    default:
      return kind;
  }
}

function createStoryTextBlock(titleText, metaText) {
  const wrap = document.createElement("div");
  wrap.className = "story-text-block";
  const title = document.createElement("div");
  title.className = "story-row-title";
  title.textContent = titleText;
  const meta = document.createElement("div");
  meta.className = "story-row-meta";
  meta.textContent = metaText || "";
  wrap.append(title, meta);
  return wrap;
}

function createStoryOpenButton(label, path, line) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", async () => {
    await revealStoryLocation(path, line || 1);
  });
  return button;
}

function appendStoryTag(container, text, variant = "") {
  const tag = document.createElement("span");
  tag.className = variant ? `story-tag ${variant}` : "story-tag";
  tag.textContent = text;
  container.appendChild(tag);
}

async function openDataFile(path) {
  if (!(await confirmDiscardChanges())) {
    return;
  }

  const file = await requestJson(`/api/data/file?path=${encodeURIComponent(path)}`);
  state.currentPath = file.path;
  recordRecentEntry("data", file.path);
  dirtyStateController.markClean({ render: false });
  setEditorValue(file.content);
  setEditorReadOnly(false);
  setEditorLanguage(isStorySourceFile(file.path) ? "storydsl" : "json");
  resetEditorViewport();
  elements.currentPath.textContent = file.path;
  elements.assetPreview.textContent = "未选择资产";
  elements.saveState.textContent = "";
  preferences.set(getLastDataPathStorageKey(), file.path);
  if (isStorySourceFile(file.path)) {
    state.storySource.path = file.path;
    state.storySource.text = file.content;
    state.storySource.kind = "source";
    setViewMode("dsl");
    updateStoryDslAnalysis({ showSuccess: true });
  } else if (isStoryJsonFile(file.path)) {
    const storyDsl = window.StoryDsl.decompileStoryJson(parseJsonText(file.content));
    state.storySource = {
      path: file.path,
      text: storyDsl,
      jsonText: file.content,
      diagnostics: [],
      kind: "json",
    };
    setEditorValue(storyDsl);
    setViewMode("dsl");
    updateStoryDslAnalysis({ showSuccess: true });
  } else {
    state.storySource = {
      path: "",
      text: "",
      jsonText: "",
      diagnostics: [],
      kind: "",
    };
    elements.formModeButton.textContent = "表单";
    elements.jsonModeButton.textContent = "JSON";
    const supportsForm = refreshFormFromEditor({ preferForm: true });
    showValidation(true, supportsForm ? "JSON 已载入，可使用表单视图。" : "JSON 已载入。");
  }
  updateSearchMatches();
  renderEditorOutline();
  renderIndexPanel();
  renderSelectionLookup();
  renderDirtyState();
  renderCursorState();
  renderFileList();
  renderProblemIndicators();
}

function openAssetFile(path) {
  state.currentPath = path;
  recordRecentEntry("assets", path);
  dirtyStateController.markClean({ render: false });
  state.storySource = {
    path: "",
    text: "",
    jsonText: "",
    diagnostics: [],
    kind: "",
  };
  setEditorValue(`assets/${path}`);
  setEditorReadOnly(true);
  setEditorLanguage("plaintext");
  resetEditorViewport();
  elements.currentPath.textContent = path;
  elements.saveState.textContent = "";
  setViewMode("json");
  elements.formModeButton.disabled = true;
  updateSearchMatches();
  renderEditorOutline();
  renderIndexPanel();
  renderSelectionLookup();
  renderDirtyState();
  renderCursorState();
  renderFileList();
  previewAsset(path);
  renderProblemIndicators();
}

function previewAsset(path) {
  const url = `/api/assets/file?path=${encodeURIComponent(path)}`;
  const lower = path.toLowerCase();
  elements.assetPreview.replaceChildren();

  if (isImage(lower)) {
    const image = document.createElement("img");
    image.src = url;
    image.alt = path;
    elements.assetPreview.appendChild(image);
  } else if (isAudio(lower)) {
    const audio = document.createElement("audio");
    audio.controls = true;
    audio.src = url;
    elements.assetPreview.appendChild(audio);
  } else {
    const text = document.createElement("div");
    text.className = "muted";
    text.textContent = "可复制资产路径";
    elements.assetPreview.appendChild(text);
  }

  const pathLine = document.createElement("div");
  pathLine.className = "asset-path";
  pathLine.textContent = path;
  elements.assetPreview.appendChild(pathLine);

  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.textContent = "复制路径";
  copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(path);
  });
  elements.assetPreview.appendChild(copyButton);
}

async function saveCurrentFile() {
  if (!state.currentPath || (state.mode !== "data" && state.mode !== "characters")) {
    showValidation(false, "请选择可保存的数据工作区。");
    return;
  }

  if (isStorySourceFile()) {
    await saveCurrentStorySource();
    return;
  }
  if (isStoryJsonDslFile()) {
    await saveCurrentStoryJsonDsl();
    return;
  }

  elements.saveButton.disabled = true;
  try {
    const content = getEditorValue();
    parseJsonText(content);
    const result = await requestJson("/api/data/file", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: state.currentPath,
        content,
      }),
    });

    setEditorValue(result.content);
    dirtyStateController.markClean({ render: false });
    refreshFormFromEditor({ preferForm: state.viewMode === "form" });
    renderDirtyState();
    renderCursorState();
    elements.saveState.textContent = result.backupPath
      ? `已保存，备份：${result.backupPath}`
      : "已保存";
    showValidation(result.validation.ok, result.validation.message);
    await loadDataFiles();
    await rebuildContentIndex();
    await loadStoryGraph();
    renderFileList();
    if (state.mode === "characters") {
      renderCharacterWorkspaceView();
    }
  } catch (error) {
    showValidation(false, error instanceof SyntaxError ? formatJsonError(error) : error.message);
  } finally {
    elements.saveButton.disabled = false;
  }
}

async function saveCurrentStorySource() {
  if (state.viewMode !== "dsl") {
    setViewMode("dsl");
  }

  const analysis = updateStoryDslAnalysis({ showSuccess: false });
  const errorCount = analysis.diagnostics.filter((item) => item.severity === "error").length;
  if (errorCount > 0 || !analysis.jsonText) {
    showValidation(false, `Story DSL 存在 ${errorCount} 个错误，未保存。`);
    return;
  }

  elements.saveButton.disabled = true;
  try {
    const content = getEditorValue();
    const result = await requestJson("/api/story/source", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: state.currentPath,
        content,
        compiledJson: analysis.jsonText,
      }),
    });

    state.storySource.text = result.content;
    state.storySource.jsonText = result.compiledJsonContent;
    setEditorValue(result.content);
    dirtyStateController.markClean({ render: false });
    renderDirtyState();
    renderCursorState();
    const backups = [result.sourceBackupPath, result.jsonBackupPath].filter(Boolean);
    elements.saveState.textContent = backups.length > 0
      ? `已保存，生成：${result.compiledJsonPath}，备份：${backups.join("、")}`
      : `已保存，生成：${result.compiledJsonPath}`;
    showValidation(result.validation.ok, result.validation.message);
    await loadDataFiles();
    await rebuildContentIndex();
    await loadStoryGraph();
    renderFileList();
  } catch (error) {
    showValidation(false, error.message);
  } finally {
    elements.saveButton.disabled = false;
  }
}

function formatCurrentJson() {
  if (state.mode !== "data" || isEditorReadOnly()) {
    return;
  }

  if (isStoryDslEditingFile()) {
    const analysis = updateStoryDslAnalysis({ showSuccess: true });
    if (analysis.jsonText) {
      state.storySource.jsonText = analysis.jsonText;
    }
    return;
  }

  try {
    setEditorValue(`${JSON.stringify(parseJsonText(getEditorValue()), null, 2)}\n`);
    dirtyStateController.markDirty({ render: false });
    elements.saveState.textContent = "已格式化，尚未保存";
    showValidation(true, "JSON format is valid.");
    refreshFormFromEditor({ preferForm: state.viewMode === "form" });
    updateSearchMatches();
    renderEditorOutline();
    renderDirtyState();
    renderCursorState();
  } catch (error) {
    showValidation(false, formatJsonError(error));
  }
}

async function saveCurrentStoryJsonDsl() {
  if (state.viewMode !== "dsl") {
    setViewMode("dsl");
  }

  const analysis = updateStoryDslAnalysis({ showSuccess: false });
  const errorCount = analysis.diagnostics.filter((item) => item.severity === "error").length;
  if (errorCount > 0 || !analysis.jsonText) {
    showValidation(false, `Story DSL 存在 ${errorCount} 个错误，未保存。`);
    return;
  }

  elements.saveButton.disabled = true;
  try {
    const sourceText = getEditorValue();
    const result = await requestJson("/api/data/file", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: state.currentPath,
        content: analysis.jsonText,
      }),
    });

    state.storySource.text = sourceText;
    state.storySource.jsonText = result.content;
    setEditorValue(sourceText);
    dirtyStateController.markClean({ render: false });
    renderDirtyState();
    renderCursorState();
    elements.saveState.textContent = result.backupPath
      ? `已保存 Story JSON，备份：${result.backupPath}`
      : "已保存 Story JSON";
    showValidation(result.validation.ok, result.validation.message);
    await loadDataFiles();
    await rebuildContentIndex();
    await loadStoryGraph();
    renderFileList();
  } catch (error) {
    showValidation(false, error.message);
  } finally {
    elements.saveButton.disabled = false;
  }
}

async function saveCurrentStoryJsonAsSource() {
  if (!canSaveCurrentStoryJsonAsSource()) {
    showValidation(false, "当前文件不需要另存为 Story 源文件。");
    return;
  }

  if (state.viewMode !== "dsl") {
    setViewMode("dsl");
  }

  const analysis = updateStoryDslAnalysis({ showSuccess: false });
  const errorCount = analysis.diagnostics.filter((item) => item.severity === "error").length;
  if (errorCount > 0 || !analysis.jsonText) {
    showValidation(false, `Story DSL 存在 ${errorCount} 个错误，未保存。`);
    return;
  }

  const saveInfo = getStorySourceSaveInfo();
  if (!(await confirmSaveStorySource(saveInfo))) {
    elements.saveState.textContent = "已取消另存为 Story";
    return;
  }

  elements.saveStorySourceButton.disabled = true;
  elements.saveButton.disabled = true;
  try {
    const sourceText = getEditorValue();
    const result = await requestJson("/api/story/source/from-json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonPath: state.currentPath,
        content: sourceText,
        compiledJson: analysis.jsonText,
      }),
    });

    state.currentPath = result.path;
    state.storySource = {
      path: result.path,
      text: result.content,
      jsonText: result.compiledJsonContent,
      diagnostics: [],
      kind: "source",
    };
    state.viewMode = "dsl";
    dirtyStateController.markClean({ render: false });
    setEditorValue(result.content);
    setEditorReadOnly(false);
    setEditorLanguage("storydsl");
    preferences.set(getLastDataPathStorageKey(), result.path);
    elements.currentPath.textContent = result.path;
    elements.saveState.textContent = result.jsonBackupPath
      ? `已另存为 ${result.path}，生成：${result.compiledJsonPath}，备份：${result.jsonBackupPath}`
      : `已另存为 ${result.path}，生成：${result.compiledJsonPath}`;
    showValidation(result.validation.ok, result.validation.message);
    await loadDataFiles();
    await rebuildContentIndex();
    await loadStoryGraph();
    updateStoryDslAnalysis({ showSuccess: true });
    renderFileList();
    renderDirtyState();
    renderCursorState();
    renderEditorOutline();
    updateStorySourceButton();
  } catch (error) {
    showValidation(false, error.message);
  } finally {
    elements.saveButton.disabled = false;
    updateStorySourceButton();
  }
}

function getStorySourceSaveInfo() {
  const sourcePath = getStorySourceTargetPathForJson(state.currentPath);
  const activeMod = getActiveMod();
  const dataRoot = activeMod?.path ? `${activeMod.path}/data` : "当前 MOD data 目录";
  return {
    jsonPath: state.currentPath,
    sourcePath,
    dataRoot,
    absoluteSourcePath: sourcePath ? `${dataRoot}/${sourcePath}` : "",
    absoluteJsonPath: state.currentPath ? `${dataRoot}/${state.currentPath}` : "",
  };
}

function confirmSaveStorySource(info) {
  return new Promise((resolve) => {
    closeToolDialog();

    const overlay = document.createElement("div");
    overlay.id = "storySourceConfirmOverlay";
    overlay.className = "tool-dialog-overlay";

    let settled = false;
    const close = (confirmed) => {
      if (settled) {
        return;
      }

      settled = true;
      document.removeEventListener("keydown", handleKeydown);
      overlay.remove();
      resolve(confirmed);
    };

    function handleKeydown(event) {
      if (event.key === "Escape") {
        close(false);
      }
    }

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        close(false);
      }
    });
    document.addEventListener("keydown", handleKeydown);

    const dialog = document.createElement("div");
    dialog.className = "tool-dialog story-source-confirm-dialog";

    const header = document.createElement("div");
    header.className = "tool-dialog-header";
    const titleGroup = document.createElement("div");
    const titleNode = document.createElement("div");
    titleNode.className = "tool-dialog-title";
    titleNode.textContent = "确认另存为 Story";
    const subtitleNode = document.createElement("div");
    subtitleNode.className = "tool-dialog-subtitle";
    subtitleNode.textContent = "会创建一个可长期编辑的 .story 源文件，并同步写回当前 Story JSON。";
    titleGroup.append(titleNode, subtitleNode);

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.textContent = "关闭";
    closeButton.addEventListener("click", () => close(false));
    header.append(titleGroup, closeButton);

    const content = document.createElement("div");
    content.className = "tool-dialog-content story-source-confirm";

    const note = document.createElement("div");
    note.className = "static-tool-note";
    note.textContent = "确认后会把当前编辑器里的 DSL 保存为下面的 .story 文件；如果同名 .story 已存在，后端会拒绝写入，不会覆盖。";

    const details = document.createElement("dl");
    details.className = "story-source-confirm-list";
    appendConfirmDetail(details, "当前 JSON", info.jsonPath);
    appendConfirmDetail(details, "目标文件", info.sourcePath);
    appendConfirmDetail(details, "保存位置", info.absoluteSourcePath);
    appendConfirmDetail(details, "同步写回", info.absoluteJsonPath);

    const actions = document.createElement("div");
    actions.className = "tool-dialog-actions";
    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.textContent = "取消";
    cancelButton.addEventListener("click", () => close(false));
    const confirmButton = document.createElement("button");
    confirmButton.type = "button";
    confirmButton.className = "primary";
    confirmButton.textContent = "确认另存为";
    confirmButton.addEventListener("click", () => close(true));
    actions.append(cancelButton, confirmButton);

    content.append(note, details, actions);
    dialog.append(header, content);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    confirmButton.focus();
  });
}

function appendConfirmDetail(list, label, value) {
  const row = document.createElement("div");
  row.className = "story-source-confirm-row";
  const term = document.createElement("dt");
  term.textContent = label;
  const detail = document.createElement("dd");
  const code = document.createElement("code");
  code.textContent = value || "-";
  detail.appendChild(code);
  row.append(term, detail);
  list.appendChild(row);
}

async function validateContent() {
  try {
    const result = await requestJson("/api/validate");
    state.problemCenter.validation = result;
    showValidation(result.ok, result.message);
  } catch (error) {
    state.problemCenter.validation = { ok: false, message: error.message };
    showValidation(false, error.message);
  } finally {
    renderProblemIndicators();
  }
}

function renderDirtyState() {
  elements.dirtyState.textContent = state.dirty ? "未保存" : "";
  renderCurrentFileInfo();
}

function renderCursorState() {
  const { line, column } = getEditorCursorPosition();
  elements.cursorState.textContent = `行 ${line}，列 ${column}`;
  renderSelectionLookup();
}

function renderCurrentFileInfo() {
  const info = getCurrentFileInfo();
  elements.currentFileSummary.textContent = info.summary;
  elements.currentFileBox.replaceChildren();
  elements.currentFileBox.className = info.rows.length > 0 ? "index-box" : "index-box muted";

  if (info.rows.length === 0) {
    elements.currentFileBox.textContent = info.summary;
    return;
  }

  for (const [label, value] of info.rows) {
    appendIndexRow(elements.currentFileBox, label, value);
  }
}

function getCurrentFileInfo() {
  if (state.mode === "story") {
    const graph = state.storyGraph;
    const group = graph?.groups?.find((item) => item.id === state.selectedStoryGroupId) || graph?.groups?.[0] || null;
    if (!group) {
      return {
        summary: "剧情图谱 · 暂无剧情段",
        rows: [["视图", "剧情图谱"]],
      };
    }

    return {
      summary: `剧情图谱 · ${group.name} · ${group.nodeCount} 段 · ${group.diagnosticCount} 问题`,
      rows: [
        ["视图", "剧情图谱"],
        ["当前分组", group.name],
        ["剧情段", String(group.nodeCount)],
        ["入口", String(group.entrypointCount)],
        ["问题", String(group.diagnosticCount)],
      ],
    };
  }

  if (!state.currentPath) {
    return { summary: "未选择文件", rows: [] };
  }

  const files = state.mode === "assets" ? state.assetFiles : state.dataFiles;
  const file = files.find((item) => item.path === state.currentPath);
  const summary = state.contentIndex.fileSummaries.get(state.currentPath);
  const displayName = getDataFileDisplayName(state.currentPath);
  const type = state.mode === "assets"
    ? "资产"
    : isStorySourceFile(state.currentPath)
      ? "Story DSL"
      : isStoryJsonDslFile(state.currentPath)
        ? "Story DSL"
      : isStoryJsonFile(state.currentPath)
        ? "Story JSON"
        : displayName || summary?.type || "数据";
  const size = file ? formatFileSize(file.size) : "-";
  const rows = [
    ["路径", state.currentPath],
    ["类型", type],
    ["大小", size],
  ];

  if (summary) {
    rows.push(["定义", `${summary.definitions} 条`]);
  }

  if (isStorySourceFile(state.currentPath)) {
    rows.push(["生成文件", `${state.currentPath}.json`]);
  } else if (isStoryJsonDslFile(state.currentPath)) {
    rows.push(["编辑视图", "Story DSL"]);
  }

  const title = displayName ? `${displayName} ${state.currentPath}` : state.currentPath;
  const count = summary ? ` · ${summary.definitions} 条` : "";
  return {
    summary: `${type} · ${title}${count} · ${size}`,
    rows,
  };
}

function renderEditorOutline() {
  const entries = getEditorOutlineEntries();
  elements.outlineSelect.replaceChildren();

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = entries.length > 0 ? `跳转剧情段 (${entries.length})` : "无剧情段";
  elements.outlineSelect.appendChild(placeholder);
  elements.outlineSelect.disabled = entries.length === 0;

  for (const entry of entries) {
    const option = document.createElement("option");
    option.value = String(entry.line);
    option.textContent = `${entry.line}: ${entry.title}`;
    elements.outlineSelect.appendChild(option);
  }
}

function getEditorOutlineEntries() {
  if (state.mode !== "data" || !state.currentPath) {
    return [];
  }

  if (isStoryDslEditingFile() && state.viewMode === "dsl") {
    return getStoryDslOutlineEntries(getEditorValue());
  }

  if ((isStoryDslEditingFile() && state.viewMode === "json") || isStoryJsonFile()) {
    return getStoryJsonOutlineEntries(getEditorValue());
  }

  return [];
}

function getStoryDslOutlineEntries(text) {
  return text
    .split("\n")
    .map((line, index) => {
      const match = line.match(/^\s*#\s*(.+?)\s*$/);
      return match ? { line: index + 1, title: match[1] } : null;
    })
    .filter(Boolean);
}

function getStoryJsonOutlineEntries(text) {
  return text
    .split("\n")
    .map((line, index) => {
      const match = line.match(/^\s*"name"\s*:\s*"((?:\\.|[^"\\])*)"/);
      if (!match) {
        return null;
      }

      return {
        line: index + 1,
        title: decodeJsonStringLiteral(match[1]),
      };
    })
    .filter(Boolean);
}

function decodeJsonStringLiteral(value) {
  try {
    return JSON.parse(`"${value}"`);
  } catch {
    return value;
  }
}

function jumpToSelectedOutline() {
  const line = Number(elements.outlineSelect.value);
  if (!Number.isFinite(line) || line <= 0) {
    return;
  }

  setEditorCursorToLine(line, 1);
  elements.outlineSelect.value = "";
}

function showValidation(ok, message) {
  renderStatusMessage(elements.validationBox, { ok, message });
  renderInspectorStatus(ok, ok ? "正常" : "有问题");
}

function showStoryDslValidation(errors, warnings, segmentCount) {
  elements.validationBox.replaceChildren();
  renderInspectorStatus(errors.length === 0, errors.length === 0 ? "正常" : "有问题");

  if (errors.length === 0) {
    elements.validationBox.className = "message ok";
    elements.validationBox.textContent = `Story DSL 校验通过：${segmentCount} 个剧情段，${warnings.length} 个提醒。`;
    return;
  }

  const first = errors[0];
  elements.validationBox.className = "message bad";

  const locateButton = createButton({
    label: "定位第一个错误",
    onClick: () => {
      if (state.viewMode !== "dsl") {
        setViewMode("dsl");
      }
      setEditorCursorToLine(first.span.start.line, first.span.start.column);
    },
  });
  elements.validationBox.appendChild(createProblemSummary({
    title: `Story DSL 存在 ${errors.length} 个错误`,
    detail: `第 ${first.span.start.line} 行，第 ${first.span.start.column} 列：${first.message}`,
    action: locateButton,
    more: errors.length > 1
      ? `还有 ${errors.length - 1} 个错误，右侧 Story DSL 诊断区可逐条定位。`
      : "",
  }));
}

function updateStoryDslAnalysis({ showSuccess }) {
  const sourceText = state.viewMode === "json" ? state.storySource.text : getEditorValue();
  state.storySource.text = sourceText;
  const baseAnalysis = window.StoryDsl.analyzeStory(sourceText);
  const diagnostics = [
    ...baseAnalysis.diagnostics,
    ...analyzeStoryDslReferences(baseAnalysis.ast),
  ];
  const hasErrors = diagnostics.some((item) => item.severity === "error");
  const analysis = {
    ...baseAnalysis,
    diagnostics,
    jsonText: hasErrors ? null : baseAnalysis.jsonText,
  };
  state.storySource.diagnostics = diagnostics;
  state.storySource.jsonText = analysis.jsonText || "";
  setMonacoDiagnostics(state.viewMode === "dsl" ? diagnostics : []);
  renderStoryDslStatus();
  renderProblemIndicators();

  const errors = diagnostics.filter((item) => item.severity === "error");
  const warnings = diagnostics.filter((item) => item.severity === "warning");
  if (errors.length > 0) {
    showStoryDslValidation(errors, warnings, analysis.ast.segments.length);
  } else if (showSuccess) {
    showStoryDslValidation(errors, warnings, analysis.ast.segments.length);
  }

  return analysis;
}

function analyzeStoryDslReferences(ast) {
  if (!ast || !state.contentIndex.ready) {
    return [];
  }

  const diagnostics = [];
  const currentSegmentIds = new Set(ast.segments.map((segment) => segment.name).filter(Boolean));
  const knownStorySegmentIds = new Set(currentSegmentIds);
  for (const definitions of state.contentIndex.definitionsById.values()) {
    for (const definition of definitions) {
      if (definition.type === "story") {
        knownStorySegmentIds.add(definition.id);
      }
    }
  }

  for (const segment of ast.segments) {
    analyzeStoryDslStatements(segment.statements, diagnostics, knownStorySegmentIds);
  }

  return diagnostics;
}

function analyzeStoryDslStatements(statements, diagnostics, knownStorySegmentIds) {
  for (const statement of statements || []) {
    switch (statement.type) {
      case "jump":
        addMissingReferenceDiagnostic(
          diagnostics,
          knownStorySegmentIds.has(statement.target),
          `jump 目标剧情段不存在：${statement.target}`,
          statement.span);
        break;
      case "battle":
        addMissingReferenceDiagnostic(
          diagnostics,
          hasDefinitionOfType(statement.battleId, "battles"),
          `战斗不存在：${statement.battleId}`,
          statement.span);
        for (const outcome of statement.outcomes || []) {
          analyzeStoryDslStatements(outcome.statements, diagnostics, knownStorySegmentIds);
        }
        break;
      case "command":
        analyzeStoryDslCommand(statement, diagnostics);
        break;
      case "choice":
        for (const option of statement.options || []) {
          analyzeStoryDslStatements(option.statements, diagnostics, knownStorySegmentIds);
        }
        break;
      case "if":
        for (const branch of statement.branches || []) {
          analyzeStoryDslStatements(branch.statements, diagnostics, knownStorySegmentIds);
        }
        break;
    }
  }
}

function analyzeStoryDslCommand(statement, diagnostics) {
  const firstArg = statement.args?.[0];
  switch (statement.name) {
    case "item":
    case "cost_item":
      validateStoryDslItemArg(diagnostics, firstArg, statement.span, statement.name);
      break;
    case "random_item":
      validateStoryDslItemArg(diagnostics, firstArg, statement.span, statement.name);
      break;
    case "map":
      validateStoryDslDefinitionArg(diagnostics, firstArg, "maps", "地图", statement.span, statement.name);
      break;
    case "shop":
      validateStoryDslDefinitionArg(diagnostics, firstArg, "shops", "商店", statement.span, statement.name);
      break;
  }
}

function validateStoryDslItemArg(diagnostics, arg, span, commandName) {
  for (const value of getStoryDslLiteralArgValues(arg)) {
    addMissingReferenceDiagnostic(
      diagnostics,
      hasDefinitionOfType(value, "items"),
      `${commandName} 引用的物品不存在：${value}`,
      span);
  }
}

function validateStoryDslDefinitionArg(diagnostics, arg, definitionType, label, span, commandName) {
  for (const value of getStoryDslLiteralArgValues(arg)) {
    addMissingReferenceDiagnostic(
      diagnostics,
      hasDefinitionOfType(value, definitionType),
      `${commandName} 引用的${label}不存在：${value}`,
      span);
  }
}

function getStoryDslLiteralArgValues(arg) {
  if (!arg) {
    return [];
  }

  if (arg.type === "literal" && typeof arg.value === "string" && arg.value.length > 0) {
    return [arg.value];
  }

  if (arg.type === "list") {
    return (arg.items || []).flatMap(getStoryDslLiteralArgValues);
  }

  return [];
}

function addMissingReferenceDiagnostic(diagnostics, exists, message, span) {
  if (exists) {
    return;
  }

  diagnostics.push({
    message,
    span,
    severity: "error",
    code: "semantic",
  });
}

function hasDefinitionOfType(id, type) {
  if (typeof id !== "string") {
    return false;
  }

  const normalizedId = id.trim();
  if (!normalizedId) {
    return false;
  }

  const definitions = state.contentIndex.definitionsById.get(normalizedId) || [];
  return definitions.some((definition) => definition.type === type);
}

function renderStoryDslStatus() {
  if (!isStoryDslEditingFile()) {
    return;
  }

  const diagnostics = state.storySource.diagnostics || [];
  const errors = diagnostics.filter((item) => item.severity === "error");
  const warnings = diagnostics.filter((item) => item.severity === "warning");
  elements.assetPreview.replaceChildren();

  const title = document.createElement("div");
  title.className = "asset-path";
  title.textContent = `Story DSL · ${errors.length} 错误 · ${warnings.length} 提醒`;
  elements.assetPreview.appendChild(title);

  if (diagnostics.length === 0) {
    const ok = document.createElement("div");
    ok.className = "muted";
    ok.textContent = "当前 DSL 可以编译为 story.json。";
    elements.assetPreview.appendChild(ok);
    return;
  }

  for (const diagnostic of diagnostics.slice(0, 12)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "definition-link";
    button.textContent = `${diagnostic.severity === "error" ? "错误" : "提醒"} ${diagnostic.span.start.line}:${diagnostic.span.start.column} ${diagnostic.message}`;
    button.addEventListener("click", () => {
      if (state.viewMode !== "dsl") {
        setViewMode("dsl");
      }
      setEditorCursorToLine(diagnostic.span.start.line, diagnostic.span.start.column);
    });
    elements.assetPreview.appendChild(button);
  }
}

function setViewMode(mode) {
  if (isStoryDslEditingFile()) {
    if (mode === "json") {
      const analysis = updateStoryDslAnalysis({ showSuccess: false });
      if (!analysis.jsonText) {
        showValidation(false, "Story DSL 存在错误，无法预览 JSON。");
        mode = "dsl";
      } else {
        state.storySource.text = state.viewMode === "dsl" ? getEditorValue() : state.storySource.text;
        state.storySource.jsonText = analysis.jsonText;
        setEditorValue(analysis.jsonText);
        setEditorReadOnly(true);
        setEditorLanguage("json");
        resetEditorViewport();
      }
    }

    if (mode === "dsl") {
      setEditorValue(state.viewMode === "json"
        ? state.storySource.text
        : getEditorValue());
      setEditorReadOnly(false);
      setEditorLanguage("storydsl");
      setMonacoDiagnostics(state.storySource.diagnostics);
      resetEditorViewport();
    }

    state.viewMode = mode === "json" ? "json" : "dsl";
    elements.formModeButton.textContent = "DSL";
    elements.jsonModeButton.textContent = "JSON";
    elements.formModeButton.disabled = false;
    elements.jsonModeButton.disabled = false;
    elements.formModeButton.classList.toggle("active", state.viewMode === "dsl");
    elements.jsonModeButton.classList.toggle("active", state.viewMode === "json");
    elements.formView.classList.add("hidden");
    setTextEditorVisible(true);
    renderStoryDslStatus();
    updateSearchMatches();
    renderEditorOutline();
    renderCursorState();
    updateMapFocusControl();
    updateStorySourceButton();
    return;
  }

  elements.formModeButton.textContent = "表单";
  elements.jsonModeButton.textContent = "JSON";
  elements.saveStorySourceButton.classList.add("hidden");
  if (mode === "form" && !refreshFormFromEditor({ preferForm: false })) {
    showValidation(false, "当前 JSON 暂不支持表单视图。");
    mode = "json";
  }

  state.viewMode = mode;
  elements.formModeButton.classList.toggle("active", mode === "form");
  elements.jsonModeButton.classList.toggle("active", mode === "json");
  elements.formView.classList.toggle("hidden", mode !== "form");
  setTextEditorVisible(mode === "json");
  renderFormView();
  renderEditorOutline();
  updateMapFocusControl();
  updateStorySourceButton();
}

function refreshFormFromEditor({ preferForm }) {
  try {
      const json = parseJsonText(getEditorValue());
    if (!Array.isArray(json) || !json.every((record) => record && typeof record === "object" && !Array.isArray(record))) {
      state.formRecords = [];
      elements.formModeButton.disabled = true;
      if (state.viewMode === "form") {
        state.viewMode = "json";
      }

      setViewModeButtons();
      elements.formView.classList.add("hidden");
      setTextEditorVisible(true);
      updateMapFocusControl();
      return false;
    }

    state.formRecords = json;
    state.selectedRecordIndex = Math.min(state.selectedRecordIndex, Math.max(0, state.formRecords.length - 1));
    elements.formModeButton.disabled = false;
    if (preferForm) {
      state.viewMode = "form";
    }

    setViewModeButtons();
    elements.formView.classList.toggle("hidden", state.viewMode !== "form");
    setTextEditorVisible(state.viewMode === "json");
    renderFormView();
    updateMapFocusControl();
    return true;
  } catch {
    state.formRecords = [];
    elements.formModeButton.disabled = true;
    if (state.viewMode === "form") {
      state.viewMode = "json";
    }

    setViewModeButtons();
    elements.formView.classList.add("hidden");
    setTextEditorVisible(true);
    updateMapFocusControl();
    return false;
  }
}

function setViewModeButtons() {
  elements.formModeButton.classList.toggle("active", state.viewMode === "form");
  elements.jsonModeButton.classList.toggle("active", state.viewMode === "json");
}

function renderFormView() {
  if (state.mode === "characters") {
    elements.formView.classList.add("hidden");
    setTextEditorVisible(false);
    renderPortraitPicker();
    return;
  }

  const scrollState = captureFormViewScrollState();
  elements.formView.replaceChildren();
  if (state.viewMode !== "form") {
    renderCharacterCheckTool();
    renderPortraitPicker();
    renderItemPicturePicker();
    renderShopResourcePicker();
    renderMapResourcePicker();
    return;
  }

  if (state.formRecords.length === 0) {
    const error = document.createElement("div");
    error.className = "form-error";
    error.textContent = "当前 JSON 没有可表单化的顶层数组条目。";
    elements.formView.appendChild(error);
    renderCharacterCheckTool();
    renderPortraitPicker();
    renderItemPicturePicker();
    renderShopResourcePicker();
    renderMapResourcePicker();
    return;
  }

  if (isCharacterFile()) {
    renderCharacterFormView();
  } else if (isMapFile()) {
    renderMapFormView();
  } else if (isItemFile()) {
    renderItemFormView();
  } else if (isShopFile()) {
    renderShopFormView();
  } else {
    renderGenericFormView();
  }

  renderCharacterCheckTool();
  renderPortraitPicker();
  renderItemPicturePicker();
  renderShopResourcePicker();
  renderMapResourcePicker();
  restoreFormViewScrollState(scrollState);
}

function selectFormRecord(index) {
  if (index === state.selectedRecordIndex) {
    return;
  }

  state.selectedRecordIndex = index;
  updateRecordCardSelection();
  renderSelectedRecordDetail();
  renderCharacterCheckTool();
  renderPortraitPicker();
  renderItemPicturePicker();
  renderShopResourcePicker();
  renderMapResourcePicker();
}

function updateRecordCardSelection() {
  for (const card of elements.formView.querySelectorAll(".record-card[data-record-index]")) {
    card.classList.toggle("active", Number(card.dataset.recordIndex) === state.selectedRecordIndex);
  }
}

function renderSelectedRecordDetail() {
  const detail = elements.formView.querySelector(".form-detail");
  if (!detail) {
    renderFormView();
    return;
  }

  detail.replaceChildren();
  if (isCharacterFile()) {
    renderCharacterDetail(detail);
  } else if (isMapFile()) {
    renderMapDetail(detail);
  } else if (isItemFile()) {
    renderItemDetail(detail);
  } else if (isShopFile()) {
    renderShopDetail(detail);
  } else {
    renderGenericRecordDetail(detail);
  }
  detail.scrollTop = 0;
}

function captureFormViewScrollState() {
  return {
    recordListScrollTop: elements.formView.querySelector(".record-list")?.scrollTop ?? 0,
    detailScrollTop: elements.formView.querySelector(".form-detail")?.scrollTop ?? 0,
  };
}

function restoreFormViewScrollState(scrollState) {
  if (!scrollState) {
    return;
  }

  requestAnimationFrame(() => {
    const recordList = elements.formView.querySelector(".record-list");
    const detail = elements.formView.querySelector(".form-detail");
    if (recordList) {
      recordList.scrollTop = scrollState.recordListScrollTop;
    }

    if (detail) {
      detail.scrollTop = scrollState.detailScrollTop;
    }
  });
}

function renderGenericFormView() {
  const recordPanel = document.createElement("aside");
  recordPanel.className = "record-panel";

  const recordHeader = document.createElement("div");
  recordHeader.className = "record-panel-header";
  recordHeader.innerHTML = `<div class="record-panel-title">条目</div><div class="record-panel-subtitle">${state.formRecords.length} 条</div>`;

  const recordSearch = document.createElement("input");
  recordSearch.className = "record-search";
  recordSearch.type = "search";
  recordSearch.placeholder = "搜索 id、名称、类型";
  recordSearch.value = state.formSearch;
  bindImeSafeInput(recordSearch, (value) => {
    state.formSearch = value;
    renderGenericRecordCards(recordList);
  });

  const recordList = document.createElement("div");
  recordList.className = "record-list";
  renderGenericRecordCards(recordList);

  recordPanel.append(recordHeader, recordSearch, recordList);

  const detail = document.createElement("section");
  detail.className = "form-detail";
  renderGenericRecordDetail(detail);

  elements.formView.append(recordPanel, detail);
}

function renderCharacterFormView() {
  if (!getCharacterFilters().some((filter) => filter.value === state.formFilter)) {
    state.formFilter = "all";
  }

  const recordPanel = document.createElement("aside");
  recordPanel.className = "record-panel character-record-panel";

  const recordHeader = document.createElement("div");
  recordHeader.className = "record-panel-header";
  const headerTitle = document.createElement("div");
  headerTitle.className = "record-panel-title";
  headerTitle.textContent = "角色";
  const headerSubtitle = document.createElement("div");
  headerSubtitle.className = "record-panel-subtitle";
  recordHeader.append(headerTitle, headerSubtitle);

  const recordSearch = document.createElement("input");
  recordSearch.className = "record-search";
  recordSearch.type = "search";
  recordSearch.placeholder = "搜索 id、姓名、头像、门派、标签";
  recordSearch.value = state.formSearch;
  bindImeSafeInput(recordSearch, (value) => {
    state.formSearch = value;
    renderCharacterRecordCards(recordList, headerSubtitle);
  });

  const filterRow = document.createElement("div");
  filterRow.className = "character-filter-row";
  for (const filter of getCharacterFilters()) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "character-filter-button";
    button.classList.toggle("active", state.formFilter === filter.value);
    button.textContent = filter.label;
    button.addEventListener("click", () => {
      state.formFilter = filter.value;
      renderFormView();
    });
    filterRow.appendChild(button);
  }

  const recordList = document.createElement("div");
  recordList.className = "record-list";
  renderCharacterRecordCards(recordList, headerSubtitle);

  recordPanel.append(recordHeader, recordSearch, filterRow, recordList);

  const detail = document.createElement("section");
  detail.className = "form-detail character-form-detail";
  renderCharacterDetail(detail);

  elements.formView.append(recordPanel, detail);
}

function renderGenericRecordCards(parent) {
  parent.replaceChildren();
  const query = state.formSearch.trim().toLowerCase();
  let visibleCount = 0;

  state.formRecords.forEach((record, index) => {
    const title = getRecordTitle(record, index);
    const subtitle = getRecordSubtitle(record, index);
    const haystack = `${title} ${subtitle} ${JSON.stringify(record)}`.toLowerCase();
    if (query && !haystack.includes(query)) {
      return;
    }

    visibleCount += 1;
    const card = document.createElement("button");
    card.type = "button";
    card.className = "record-card";
    card.dataset.recordIndex = String(index);
    card.classList.toggle("active", index === state.selectedRecordIndex);
    card.addEventListener("click", () => {
      selectFormRecord(index);
    });

    const text = document.createElement("div");
    const titleNode = document.createElement("div");
    titleNode.className = "record-title";
    titleNode.textContent = title;
    const subtitleNode = document.createElement("div");
    subtitleNode.className = "record-subtitle";
    subtitleNode.textContent = subtitle;
    text.append(titleNode, subtitleNode);
    card.append(createRecordThumb(record), text);
    parent.appendChild(card);
  });

  if (visibleCount === 0) {
    const empty = document.createElement("div");
    empty.className = "record-empty";
    empty.textContent = "没有匹配的条目";
    parent.appendChild(empty);
  }
}

function renderCharacterRecordCards(parent, subtitleNode) {
  parent.replaceChildren();
  const query = state.formSearch.trim().toLowerCase();
  let visibleCount = 0;

  state.formRecords.forEach((record, index) => {
    if (!matchesCharacterSearch(record, query) || !matchesCharacterFilter(record, state.formFilter)) {
      return;
    }

    visibleCount += 1;
    const card = document.createElement("button");
    card.type = "button";
    card.className = "record-card character-record-card";
    card.dataset.recordIndex = String(index);
    card.classList.toggle("active", index === state.selectedRecordIndex);
    card.addEventListener("click", () => {
      selectFormRecord(index);
    });

    const portraitInfo = getCharacterPortraitInfo(record);
    const classification = getCharacterUiClassification(record);
    const issues = getCharacterValidationIssues(record);

    const text = document.createElement("div");
    text.className = "character-record-text";

    const titleRow = document.createElement("div");
    titleRow.className = "character-record-title-row";
    const title = document.createElement("div");
    title.className = "record-title";
    title.textContent = typeof record.name === "string" && record.name.trim() ? record.name.trim() : (record.id || `#${index + 1}`);
    const badge = document.createElement("span");
    badge.className = `character-role-badge ${classification.key}`;
    badge.textContent = classification.label;
    titleRow.append(title, badge);

    const subtitle = document.createElement("div");
    subtitle.className = "record-subtitle";
    subtitle.textContent = typeof record.id === "string" && record.id.trim() ? record.id.trim() : `#${index + 1}`;

    const meta = document.createElement("div");
    meta.className = "character-record-meta";
    meta.textContent = [
      `Lv.${getDisplayNumber(record.level, 1)}`,
      portraitInfo.assetExists ? "有头像" : portraitInfo.portraitId ? "缺头像" : "无 portrait",
      issues.length > 0 ? `${issues.length} 项待处理` : "配置正常",
    ].join(" · ");

    text.append(titleRow, subtitle, meta);
    card.append(createRecordThumb(record), text);
    parent.appendChild(card);
  });

  subtitleNode.textContent = `${visibleCount} / ${state.formRecords.length} 条`;

  if (visibleCount === 0) {
    const empty = document.createElement("div");
    empty.className = "record-empty";
    empty.textContent = "没有匹配的角色";
    parent.appendChild(empty);
  }
}

function renderGenericRecordDetail(parent) {
  const record = state.formRecords[state.selectedRecordIndex];
  if (!record) {
    parent.innerHTML = `<div class="form-error">未选择条目。</div>`;
    return;
  }

  const title = getRecordTitle(record, state.selectedRecordIndex);
  const subtitle = getRecordSubtitle(record, state.selectedRecordIndex);
  const header = document.createElement("div");
  header.className = "form-detail-header";
  const titleGroup = document.createElement("div");
  titleGroup.innerHTML = `<div class="form-detail-title">${escapeHtml(title)}</div><div class="form-detail-subtitle">${escapeHtml(subtitle)}</div>`;
  const actions = document.createElement("div");
  actions.className = "record-actions";
  actions.append(
    createActionButton("新增", addRecord),
    createActionButton("复制", duplicateRecord),
    createActionButton("删除", deleteRecord)
  );
  header.append(titleGroup, actions);

  const summary = document.createElement("div");
  summary.className = "form-summary";
  summary.textContent = "常用字段可直接编辑；复杂字段会保留为 JSON 文本。保存仍使用顶部保存按钮。";

  const fieldset = document.createElement("section");
  fieldset.className = "form-fieldset";
  const fieldsetTitle = document.createElement("div");
  fieldsetTitle.className = "form-fieldset-title";
  fieldsetTitle.textContent = "字段";
  const grid = document.createElement("div");
  grid.className = "form-grid";

  for (const [key, value] of Object.entries(record)) {
    grid.appendChild(createFieldEditor(record, key, value));
  }

  fieldset.append(fieldsetTitle, grid);
  parent.append(header, summary, fieldset);
}

function renderCharacterDetail(parent) {
  const record = state.formRecords[state.selectedRecordIndex];
  if (!record) {
    parent.innerHTML = `<div class="form-error">未选择角色。</div>`;
    return;
  }

  ensureCharacterShape(record);
  const portraitInfo = getCharacterPortraitInfo(record);
  const classification = getCharacterUiClassification(record);
  const issues = getCharacterValidationIssues(record);

  const shell = document.createElement("div");
  shell.className = "character-detail-shell";

  const summaryCard = document.createElement("section");
  summaryCard.className = "character-summary-card";

  const portrait = createCharacterPortraitHero(record, portraitInfo);
  const content = document.createElement("div");
  content.className = "character-summary-content";

  const titleRow = document.createElement("div");
  titleRow.className = "character-summary-title-row";
  const titleGroup = document.createElement("div");
  const title = document.createElement("div");
  title.className = "form-detail-title";
  title.textContent = typeof record.name === "string" && record.name.trim() ? record.name.trim() : (record.id || "未命名角色");
  const subtitle = document.createElement("div");
  subtitle.className = "form-detail-subtitle";
  subtitle.textContent = typeof record.id === "string" && record.id.trim() ? record.id.trim() : `#${state.selectedRecordIndex + 1}`;
  titleGroup.append(title, subtitle);
  const actions = document.createElement("div");
  actions.className = "record-actions";
  actions.append(
    createActionButton("新增", addRecord),
    createActionButton("复制", duplicateRecord),
    createActionButton("删除", deleteRecord)
  );
  titleRow.append(titleGroup, actions);

  const badgeRow = document.createElement("div");
  badgeRow.className = "character-summary-badges";
  badgeRow.append(
    createPill(`等级 Lv.${getDisplayNumber(record.level, 1)}`),
    createPill(`性别 ${formatGenderLabel(record.gender)}`),
    createPill(`用途 ${classification.label}`, classification.key),
    createPill(issues.length > 0 ? `待处理 ${issues.length}` : "配置正常", issues.length > 0 ? "warn" : "ok")
  );

  content.append(titleRow, badgeRow);
  summaryCard.append(portrait, content);
  shell.appendChild(summaryCard);

  if (issues.length > 0) {
    shell.appendChild(createCharacterIssueSummary(issues));
  }

  const intro = document.createElement("div");
  intro.className = "form-summary character-form-summary";
  intro.textContent = "底层仍保存原 JSON；这里把角色常用字段整理成可直接编辑的专用界面。复杂字段保留在“高级 JSON”里兜底。";
  shell.appendChild(intro);

  const basicSection = createCharacterSection("基础信息", "Basic");
  const basicGrid = document.createElement("div");
  basicGrid.className = "character-form-grid";
  basicGrid.append(
    createCharacterTextField(record, "角色ID", "id", {
      list: null,
      placeholder: "例如：骆冰",
      rerenderOnChange: true,
    }),
    createCharacterTextField(record, "显示名", "name", {
      placeholder: "例如：骆冰",
      rerenderOnChange: true,
    }),
    createCharacterNumberField(record, "等级", "level", {
      min: 1,
      fallback: 1,
      rerenderOnChange: true,
    }),
    createCharacterSelectField(record, "性别", "gender", [
      { value: "neutral", label: "neutral 中立" },
      { value: "male", label: "male 男" },
      { value: "female", label: "female 女" },
    ]),
    createCharacterTextField(record, "头像", "portrait", {
      list: ensureResourceIdDatalist("头像"),
      placeholder: "例如：头像.骆冰",
      rerenderOnChange: true,
    }),
    createCharacterTextField(record, "模型", "model", {
      placeholder: "例如：luobing",
      rerenderOnChange: true,
    }),
    createCharacterTextField(record, "成长模板", "growTemplate", {
      list: ensureDefinitionIdDatalist("grow-templates"),
      placeholder: "例如：主角",
      nullable: true,
      rerenderOnChange: true,
    }),
    createCharacterCheckboxField(record, "可上战场", "arenaEnabled", "arenaEnabled")
  );
  basicSection.appendChild(basicGrid);
  shell.appendChild(basicSection);

  const portraitSection = createCharacterSection("头像", "Portrait");
  portraitSection.appendChild(createCharacterPortraitSection(record, portraitInfo));
  shell.appendChild(portraitSection);

  const statsSection = createCharacterSection("属性", "Stats");
  const statsGrid = document.createElement("div");
  statsGrid.className = "character-stats-grid";
  for (const stat of CHARACTER_STAT_FIELDS) {
    statsGrid.appendChild(createCharacterStatField(record, stat));
  }
  statsSection.appendChild(statsGrid);
  shell.appendChild(statsSection);

  const skillsSection = createCharacterSection("技能与装备", "Skills & Equipment");
  skillsSection.appendChild(createCharacterTabBar());
  skillsSection.appendChild(createCharacterTabContent(record));
  shell.appendChild(skillsSection);

  const advancedSection = createCharacterAdvancedJsonSection(record);
  shell.appendChild(advancedSection);

  parent.appendChild(shell);
}

const CHARACTER_STAT_FIELDS = [
  { key: "bili", label: "臂力" },
  { key: "dingli", label: "定力" },
  { key: "fuyuan", label: "福缘" },
  { key: "gengu", label: "根骨" },
  { key: "jianfa", label: "剑法" },
  { key: "daofa", label: "刀法" },
  { key: "quanzhang", label: "拳掌" },
  { key: "qimen", label: "奇门" },
  { key: "shenfa", label: "身法" },
  { key: "wuxing", label: "悟性" },
  { key: "wuxue", label: "武学" },
  { key: "max_hp", label: "最大生命" },
  { key: "max_mp", label: "最大内力" },
];

const ITEM_TYPE_CHOICES = [
  { value: "consumable", label: "consumable 消耗品" },
  { value: "equipment", label: "equipment 装备" },
  { value: "skill_book", label: "skill_book 武学书" },
  { value: "special_skill_book", label: "special_skill_book 绝技书" },
  { value: "talent_book", label: "talent_book 天赋书" },
  { value: "quest_item", label: "quest_item 剧情物品" },
  { value: "booster", label: "booster 强化道具" },
  { value: "utility", label: "utility 功能物品" },
];

const ITEM_CATEGORY_CHOICES = [
  { value: "normal", label: "normal 普通" },
  { value: "equipment", label: "equipment 装备" },
];

const ITEM_SLOT_TYPE_CHOICES = [
  { value: "weapon", label: "weapon 武器" },
  { value: "armor", label: "armor 护甲" },
  { value: "accessory", label: "accessory 饰品" },
];

const ITEM_REQUIREMENT_TYPE_CHOICES = [
  { value: "stat", label: "stat 属性要求" },
  { value: "talent", label: "talent 天赋要求" },
];

const ITEM_EFFECT_TYPE_CHOICES = [
  { value: "add_hp", label: "add_hp 回复生命" },
  { value: "add_mp", label: "add_mp 回复内力" },
  { value: "add_hp_percent", label: "add_hp_percent 生命百分比" },
  { value: "add_mp_percent", label: "add_mp_percent 内力百分比" },
  { value: "add_maxhp", label: "add_maxhp 提升生命上限" },
  { value: "add_maxmp", label: "add_maxmp 提升内力上限" },
  { value: "add_rage", label: "add_rage 增加怒气" },
  { value: "detoxify", label: "detoxify 解毒" },
  { value: "add_buff", label: "add_buff 添加 Buff" },
  { value: "external_skill", label: "external_skill 学会外功" },
  { value: "internal_skill", label: "internal_skill 学会内功" },
  { value: "special_skill", label: "special_skill 学会绝技" },
  { value: "grant_talent", label: "grant_talent 获得天赋" },
];

const ITEM_AFFIX_TYPE_CHOICES = [
  { value: "stat_modifier", label: "stat_modifier 属性修正" },
  { value: "grant_talent", label: "grant_talent 赋予天赋" },
  { value: "grant_model", label: "grant_model 赋予模型" },
  { value: "skill_bonus_modifier", label: "skill_bonus_modifier 技能威力修正" },
  { value: "weapon_bonus_modifier", label: "weapon_bonus_modifier 武学类别修正" },
  { value: "legend_skill_chance_modifier", label: "legend_skill_chance_modifier 传奇招式触发率" },
];

const ITEM_AFFIX_STAT_CHOICES = [
  { value: "attack", label: "attack 攻击" },
  { value: "defence", label: "defence 防御" },
  { value: "crit_chance", label: "crit_chance 暴击率" },
  { value: "anti_crit_chance", label: "anti_crit_chance 抗暴率" },
  { value: "crit_mult", label: "crit_mult 暴击倍率" },
  { value: "lifesteal", label: "lifesteal 吸血" },
  { value: "anti_debuff", label: "anti_debuff 抗异常" },
  { value: "bili", label: "bili 臂力" },
  { value: "dingli", label: "dingli 定力" },
  { value: "fuyuan", label: "fuyuan 福缘" },
  { value: "gengu", label: "gengu 根骨" },
  { value: "jianfa", label: "jianfa 剑法" },
  { value: "daofa", label: "daofa 刀法" },
  { value: "quanzhang", label: "quanzhang 拳掌" },
  { value: "qimen", label: "qimen 奇门" },
  { value: "shenfa", label: "shenfa 身法" },
  { value: "wuxing", label: "wuxing 悟性" },
];

const ITEM_WEAPON_TYPE_CHOICES = [
  { value: "quanzhang", label: "quanzhang 拳掌" },
  { value: "jianfa", label: "jianfa 剑法" },
  { value: "daofa", label: "daofa 刀法" },
  { value: "qimen", label: "qimen 奇门" },
  { value: "internal_skill", label: "internal_skill 内功" },
];

const SHOP_PRODUCT_FILTERS = [
  { value: "all", label: "全部" },
  { value: "limited", label: "限购" },
  { value: "premium", label: "元宝价" },
  { value: "fallbackPrice", label: "用基础价" },
  { value: "ignored", label: "兼容忽略" },
  { value: "missing", label: "引用缺失" },
];

function isCharacterFile() {
  return state.currentPath === "characters.json";
}

function isMapFile() {
  return state.currentPath === "maps.json";
}

const MAP_FILTERS = [
  { value: "all", label: "全部" },
  { value: "large", label: "大地图" },
  { value: "small", label: "小地图" },
  { value: "story", label: "有剧情" },
  { value: "issues", label: "待处理" },
];

const MAP_KIND_CHOICES = [
  { value: "small", label: "小地图" },
  { value: "large", label: "大地图" },
];

const MAP_EVENT_TYPE_CHOICES = [
  { value: "map", label: "进入地图" },
  { value: "story", label: "播放剧情" },
  { value: "shop", label: "打开商店" },
  { value: "xiangzi", label: "打开储物箱" },
  { value: "battle", label: "进入战斗" },
];

const MAP_CONDITION_CHOICES = [
  { value: "always", label: "总是" },
  { value: "should_finish", label: "已完成剧情" },
  { value: "should_not_finish", label: "未完成剧情" },
  { value: "follow_story", label: "上一个剧情是" },
  { value: "in_team", label: "队伍有角色名" },
  { value: "not_in_team", label: "队伍没有角色名" },
  { value: "key_in_team", label: "队伍有角色ID" },
  { value: "key_not_in_team", label: "队伍没有角色ID" },
  { value: "have_item", label: "拥有物品" },
  { value: "not_have_item", label: "没有物品" },
  { value: "in_time", label: "当前时辰是" },
  { value: "not_in_time", label: "当前时辰不是" },
  { value: "has_time_key", label: "有限时 key" },
  { value: "not_has_time_key", label: "没有限时 key" },
  { value: "in_menpai", label: "门派是" },
  { value: "not_in_menpai", label: "门派不是" },
  { value: "in_round", label: "周目是" },
  { value: "not_in_round", label: "周目不是" },
  { value: "game_mode", label: "难度是" },
  { value: "exceed_day", label: "超过天数" },
  { value: "not_exceed_day", label: "未超过天数" },
  { value: "zhoumu_greater_than", label: "周目至少" },
  { value: "level_greater_than", label: "角色等级至少" },
  { value: "level_less_than", label: "角色等级低于" },
  { value: "shenfa_greater_than", label: "身法至少" },
  { value: "skill_more_than", label: "技能等级至少" },
  { value: "skill_less_than", label: "技能等级低于" },
  { value: "in_newbie_task", label: "新手任务中" },
];

function renderMapFormView() {
  if (!MAP_FILTERS.some((filter) => filter.value === state.formFilter)) {
    state.formFilter = "all";
  }

  clampMapSelection();

  const recordPanel = document.createElement("aside");
  recordPanel.className = "record-panel character-record-panel map-record-panel";

  const recordHeader = document.createElement("div");
  recordHeader.className = "record-panel-header";
  const headerTitle = document.createElement("div");
  headerTitle.className = "record-panel-title";
  headerTitle.textContent = "地图";
  const headerSubtitle = document.createElement("div");
  headerSubtitle.className = "record-panel-subtitle";
  recordHeader.append(headerTitle, headerSubtitle);

  const recordSearch = document.createElement("input");
  recordSearch.className = "record-search";
  recordSearch.type = "search";
  recordSearch.placeholder = "搜索地图、点位、剧情、目标";
  recordSearch.value = state.formSearch;
  bindImeSafeInput(recordSearch, (value) => {
    state.formSearch = value;
    renderMapRecordCards(recordList, headerSubtitle);
  });

  const filterRow = document.createElement("div");
  filterRow.className = "character-filter-row";
  for (const filter of MAP_FILTERS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "character-filter-button";
    button.classList.toggle("active", state.formFilter === filter.value);
    button.textContent = filter.label;
    button.addEventListener("click", () => {
      state.formFilter = filter.value;
      renderFormView();
    });
    filterRow.appendChild(button);
  }

  const recordList = document.createElement("div");
  recordList.className = "record-list";
  renderMapRecordCards(recordList, headerSubtitle);

  recordPanel.append(recordHeader, recordSearch, filterRow, recordList);

  const detail = document.createElement("section");
  detail.className = "form-detail character-form-detail map-form-detail";
  renderMapDetail(detail);

  elements.formView.append(recordPanel, detail);
}

function renderMapRecordCards(parent, subtitleNode) {
  parent.replaceChildren();
  const query = state.formSearch.trim().toLowerCase();
  let visibleCount = 0;

  state.formRecords.forEach((record, index) => {
    ensureMapShape(record);
    if (!matchesMapSearch(record, query) || !matchesMapFilter(record, state.formFilter)) {
      return;
    }

    visibleCount += 1;
    const stats = getMapStats(record);
    const card = document.createElement("button");
    card.type = "button";
    card.className = "record-card character-record-card map-record-card";
    card.dataset.recordIndex = String(index);
    card.classList.toggle("active", index === state.selectedRecordIndex);
    card.addEventListener("click", () => {
      state.mapEditor.selectedLocationIndex = 0;
      state.mapEditor.canvasMode = "select";
      state.mapEditor.locationSearch = "";
      selectFormRecord(index);
    });

    const text = document.createElement("div");
    text.className = "character-record-text";
    const titleRow = document.createElement("div");
    titleRow.className = "character-record-title-row";
    const title = document.createElement("div");
    title.className = "record-title";
    title.textContent = record.name || record.id || `#${index + 1}`;
    const badge = document.createElement("span");
    badge.className = `character-role-badge map-kind-badge ${isLargeMap(record) ? "large" : "small"}`;
    badge.textContent = isLargeMap(record) ? "大地图" : "小地图";
    titleRow.append(title, badge);

    const subtitle = document.createElement("div");
    subtitle.className = "record-subtitle";
    subtitle.textContent = record.id || `#${index + 1}`;

    const meta = document.createElement("div");
    meta.className = "character-record-meta";
    meta.textContent = [
      `${stats.locations} 点位`,
      `${stats.storyEvents} 剧情`,
      `${stats.mapEvents} 跳转`,
      stats.issues.length > 0 ? `${stats.issues.length} 项待处理` : "可运行",
    ].join(" · ");

    text.append(titleRow, subtitle, meta);
    card.append(createRecordThumb(record), text);
    parent.appendChild(card);
  });

  subtitleNode.textContent = `${visibleCount} / ${state.formRecords.length} 条`;
  if (visibleCount === 0) {
    const empty = document.createElement("div");
    empty.className = "record-empty";
    empty.textContent = "没有匹配的地图";
    parent.appendChild(empty);
  }
}

function renderMapDetail(parent) {
  const record = state.formRecords[state.selectedRecordIndex];
  if (!record) {
    parent.innerHTML = `<div class="form-error">未选择地图。</div>`;
    return;
  }

  ensureMapShape(record);
  clampMapSelection();
  const stats = getMapStats(record);

  const shell = document.createElement("div");
  shell.className = "character-detail-shell map-detail-shell";
  shell.appendChild(createMapSummary(record, stats));
  shell.appendChild(createMapIntro(stats));
  shell.appendChild(createMapBasicSection(record));
  shell.appendChild(createMapWorkspaceSection(record));
  shell.appendChild(createMapAdvancedJsonSection(record));
  parent.appendChild(shell);
}

function createMapSummary(record, stats) {
  const summaryCard = document.createElement("section");
  summaryCard.className = "character-summary-card map-summary-card";

  const preview = document.createElement("div");
  preview.className = "character-summary-portrait map-summary-background";
  const assetPath = resolveAssetPath(record.picture);
  if (assetPath && isImage(assetPath.toLowerCase())) {
    const image = document.createElement("img");
    image.src = `/api/assets/file?path=${encodeURIComponent(assetPath)}`;
    image.alt = record.name || record.id || "地图背景";
    preview.appendChild(image);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "character-summary-portrait-placeholder";
    placeholder.textContent = "地图";
    preview.appendChild(placeholder);
  }

  const content = document.createElement("div");
  content.className = "character-summary-content";
  const titleRow = document.createElement("div");
  titleRow.className = "character-summary-title-row";
  const titleGroup = document.createElement("div");
  const title = document.createElement("div");
  title.className = "form-detail-title";
  title.textContent = record.name || record.id || "未命名地图";
  const subtitle = document.createElement("div");
  subtitle.className = "form-detail-subtitle";
  subtitle.textContent = record.id || `#${state.selectedRecordIndex + 1}`;
  titleGroup.append(title, subtitle);
  const actions = document.createElement("div");
  actions.className = "record-actions";
  actions.append(
    createActionButton("新增", addRecord),
    createActionButton("复制", duplicateRecord),
    createActionButton("删除", deleteRecord)
  );
  titleRow.append(titleGroup, actions);

  const badgeRow = document.createElement("div");
  badgeRow.className = "character-summary-badges";
  badgeRow.append(
    createPill(isLargeMap(record) ? "大地图" : "小地图", "ok"),
    createPill(`点位 ${stats.locations}`),
    createPill(`事件 ${stats.events}`),
    createPill(`剧情 ${stats.storyEvents}`),
    createPill(stats.issues.length > 0 ? `待处理 ${stats.issues.length}` : "可运行", stats.issues.length > 0 ? "warn" : "ok")
  );

  content.append(titleRow, badgeRow);
  summaryCard.append(preview, content);
  return summaryCard;
}

function createMapIntro(stats) {
  const box = document.createElement("div");
  box.className = "form-summary character-form-summary map-issue-summary";
  if (stats.issues.length === 0) {
    box.textContent = "这个地图当前没有发现阻断问题。编辑器只生成现有运行时支持的 maps.json 数据，适合剧情入口、场景跳转、商店、储物箱和战斗接线。";
    return box;
  }

  const title = document.createElement("div");
  title.className = "map-issue-title";
  title.textContent = "保存前建议处理：";
  const list = createTextList(stats.issues, { limit: 8 });
  box.append(title, list);
  return box;
}

function createMapBasicSection(record) {
  const section = createCharacterSection("基础信息", "Basic");
  const grid = document.createElement("div");
  grid.className = "character-form-grid";
  grid.append(
    createCharacterTextField(record, "地图ID", "id", {
      placeholder: "例如：新地图",
      rerenderOnChange: true,
    }),
    createCharacterTextField(record, "显示名", "name", {
      placeholder: "例如：新地图",
      rerenderOnChange: true,
    }),
    createMapKindField(record),
    createMapResourceField(record, "背景资源", "picture", "地图"),
    createMapTextareaField(record, "地图描述", "description"),
    createMapMusicField(record)
  );
  section.appendChild(grid);
  return section;
}

function createMapKindField(record) {
  const field = createCharacterFieldShell("地图类型", "kind");
  const select = document.createElement("select");
  for (const choice of MAP_KIND_CHOICES) {
    const option = document.createElement("option");
    option.value = choice.value;
    option.textContent = choice.label;
    option.selected = getMapKind(record) === choice.value;
    select.appendChild(option);
  }

  select.addEventListener("change", () => {
    record.kind = select.value === "large" ? "large" : "small";
    if (record.kind === "small") {
      delete record.kind;
    }
    syncFormToEditor();
    renderFormView();
  });
  field.appendChild(select);
  return field;
}

function createMapTextareaField(record, labelCn, key) {
  const field = createCharacterFieldShell(labelCn, key, true);
  const textarea = document.createElement("textarea");
  textarea.rows = 4;
  textarea.value = record[key] == null ? "" : String(record[key]);
  textarea.addEventListener("input", () => {
    record[key] = textarea.value;
    syncFormToEditor();
  });
  field.appendChild(textarea);
  return field;
}

function createMapResourceField(record, labelCn, key, group) {
  const field = createCharacterFieldShell(labelCn, key, true);
  field.classList.add("shop-resource-field");
  const input = document.createElement("input");
  input.type = "text";
  input.value = record[key] == null ? "" : String(record[key]);
  input.placeholder = group === "音乐" ? "例如：音乐.逍遥" : "例如：地图.新地图";
  input.setAttribute("list", ensureResourceIdDatalist(group));
  input.addEventListener("input", () => {
    const value = input.value.trim();
    record[key] = value || null;
    syncFormToEditor();
  });
  input.addEventListener("change", () => renderFormView());
  field.appendChild(input);
  field.appendChild(createShopResourcePreview(getMapResourceInfo(record[key], group)));
  return field;
}

function createMapMusicField(record) {
  const field = createCharacterFieldShell("背景音乐", "musics", true);
  const list = document.createElement("div");
  list.className = "map-music-list";
  record.musics.forEach((musicId, index) => {
    const row = document.createElement("div");
    row.className = "map-music-row";
    const input = document.createElement("input");
    input.type = "text";
    input.value = musicId || "";
    input.placeholder = "例如：音乐.逍遥";
    input.setAttribute("list", ensureResourceIdDatalist("音乐"));
    input.addEventListener("input", () => {
      record.musics[index] = input.value.trim();
      syncFormToEditor();
    });
    input.addEventListener("change", () => renderFormView());
    const remove = createActionButton("删除", () => {
      record.musics.splice(index, 1);
      syncFormToEditor();
      renderFormView();
    });
    row.append(input, remove);
    list.appendChild(row);
  });

  if (record.musics.length === 0) {
    const empty = document.createElement("div");
    empty.className = "record-empty compact";
    empty.textContent = "未设置音乐，进入地图时不会切换 BGM。";
    list.appendChild(empty);
  }

  const add = createActionButton("添加音乐", () => {
    record.musics.push("");
    syncFormToEditor();
    renderFormView();
  });
  field.append(list, add);
  return field;
}

function createMapWorkspaceSection(record) {
  const section = createCharacterSection(isLargeMap(record) ? "大地图画布与点位" : "小地图点位与事件", "Locations");
  const workspace = document.createElement("div");
  workspace.className = `map-editor-workspace ${isLargeMap(record) ? "large" : "small"}`;
  workspace.appendChild(isLargeMap(record) ? createLargeMapCanvas(record) : createSmallMapPreview(record));
  workspace.appendChild(createMapLocationPanel(record));
  section.appendChild(workspace);
  return section;
}

function createLargeMapCanvas(record) {
  const wrap = document.createElement("div");
  wrap.className = "map-canvas-wrap";

  const toolbar = document.createElement("div");
  toolbar.className = "map-canvas-toolbar";
  const modeActions = document.createElement("div");
  modeActions.className = "map-canvas-mode-actions";
  for (const choice of [
    { value: "select", label: "选择 / 拖动" },
    { value: "add", label: "添加点位" },
  ]) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "map-canvas-mode-button";
    button.classList.toggle("active", state.mapEditor.canvasMode === choice.value);
    button.textContent = choice.label;
    button.addEventListener("click", () => {
      state.mapEditor.canvasMode = choice.value;
      renderFormView();
    });
    modeActions.appendChild(button);
  }
  const legend = document.createElement("div");
  legend.className = "map-canvas-legend";
  legend.textContent = "图标预览按第一个事件计算；实际游戏会按当前命中的事件显示。";
  toolbar.append(modeActions, legend);

  const canvas = document.createElement("div");
  canvas.className = `map-canvas ${state.mapEditor.canvasMode === "add" ? "adding" : "selecting"}`;
  const assetPath = resolveAssetPath(record.picture);
  if (assetPath && isImage(assetPath.toLowerCase())) {
    const image = document.createElement("img");
    image.src = `/api/assets/file?path=${encodeURIComponent(assetPath)}`;
    image.alt = record.name || record.id || "大地图背景";
    canvas.appendChild(image);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "map-canvas-placeholder";
    placeholder.textContent = "选择地图背景后可在画布上拖动点位";
    canvas.appendChild(placeholder);
  }

  record.locations.forEach((location, index) => {
    const pin = document.createElement("button");
    pin.type = "button";
    pin.className = "map-location-pin";
    pin.classList.toggle("active", index === state.mapEditor.selectedLocationIndex);
    const iconInfo = getMapLocationIconInfo(location, location.events[0] || null);
    pin.appendChild(createMapIconVisual(iconInfo, String(index + 1), "map-location-pin-icon"));
    const position = normalizeMapPosition(location.position);
    pin.style.left = `${Math.max(0, Math.min(100, position.x / 800 * 100))}%`;
    pin.style.top = `${Math.max(0, Math.min(100, position.y / 600 * 100))}%`;
    pin.title = `${location.name || location.id || `点位 ${index + 1}`} · ${iconInfo.sourceLabel}`;
    pin.addEventListener("click", (event) => {
      event.stopPropagation();
      state.mapEditor.selectedLocationIndex = index;
      state.mapEditor.canvasMode = "select";
      renderFormView();
    });
    pin.addEventListener("pointerdown", (event) => {
      if (state.mapEditor.canvasMode !== "select") {
        return;
      }
      event.preventDefault();
      state.mapEditor.selectedLocationIndex = index;
      moveMapLocationFromPointer(record, location, canvas, event);
      const move = (moveEvent) => moveMapLocationFromPointer(record, location, canvas, moveEvent);
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        syncFormToEditor();
        renderFormView();
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    });
    canvas.appendChild(pin);
  });

  canvas.addEventListener("click", (event) => {
    if (state.mapEditor.canvasMode !== "add") {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(800, Math.round((event.clientX - rect.left) / rect.width * 800)));
    const y = Math.max(0, Math.min(600, Math.round((event.clientY - rect.top) / rect.height * 600)));
    const location = createMapLocationTemplate(record, `新地点${record.locations.length + 1}`);
    location.position = { x, y };
    record.locations.push(location);
    state.mapEditor.selectedLocationIndex = record.locations.length - 1;
    state.mapEditor.canvasMode = "select";
    syncFormToEditor();
    renderFormView();
  });

  const hint = document.createElement("div");
  hint.className = "map-canvas-hint";
  hint.textContent = state.mapEditor.canvasMode === "add"
    ? "添加模式：点击画布空白处创建一个点位；创建后会自动回到选择模式。"
    : "选择模式：点击图标选择点位，拖动图标调整坐标。坐标按 800×600 源图保存。";
  wrap.append(toolbar, canvas, hint);
  return wrap;
}

function createMapIconVisual(iconInfo, badgeText = "", className = "") {
  const visual = document.createElement("span");
  visual.className = `map-icon-visual ${className}`.trim();
  if (iconInfo.previewPath && isImage(iconInfo.previewPath.toLowerCase())) {
    const image = document.createElement("img");
    image.src = `/api/assets/file?path=${encodeURIComponent(iconInfo.previewPath)}`;
    image.alt = iconInfo.resourceId || iconInfo.sourceLabel;
    visual.appendChild(image);
  } else {
    const fallback = document.createElement("span");
    fallback.className = "map-icon-fallback";
    fallback.textContent = iconInfo.status === "empty" ? "默认" : "!";
    visual.appendChild(fallback);
  }

  if (badgeText) {
    const badge = document.createElement("span");
    badge.className = "map-icon-index";
    badge.textContent = badgeText;
    visual.appendChild(badge);
  }
  return visual;
}

function moveMapLocationFromPointer(record, location, canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.round((event.clientX - rect.left) / rect.width * 800);
  const y = Math.round((event.clientY - rect.top) / rect.height * 600);
  location.position = {
    x: Math.max(0, Math.min(800, x)),
    y: Math.max(0, Math.min(600, y)),
  };
  syncFormToEditor();
}

function createSmallMapPreview(record) {
  const panel = document.createElement("div");
  panel.className = "map-small-preview";
  const assetPath = resolveAssetPath(record.picture);
  if (assetPath && isImage(assetPath.toLowerCase())) {
    const image = document.createElement("img");
    image.src = `/api/assets/file?path=${encodeURIComponent(assetPath)}`;
    image.alt = record.name || record.id || "小地图背景";
    panel.appendChild(image);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "map-canvas-placeholder";
    placeholder.textContent = "小地图运行时显示背景图，下方显示可触发点位按钮。";
    panel.appendChild(placeholder);
  }
  const note = document.createElement("div");
  note.className = "static-tool-note";
  note.textContent = "小地图当前运行时不是背景点选；点位会显示为按钮列表。需要场景内点选时再升级底层。";
  panel.appendChild(note);
  return panel;
}

function createMapLocationPanel(record) {
  const panel = document.createElement("div");
  panel.className = "map-location-panel";
  const toolbar = document.createElement("div");
  toolbar.className = "shop-product-toolbar";
  const title = document.createElement("div");
  title.className = "static-tool-note";
  title.textContent = "运行时先选择第一个满足条件与概率的事件，再按“事件图标 → 点位图片 → 角色头像 → 默认图标”显示。";
  const actions = document.createElement("div");
  actions.className = "record-actions";
  actions.append(
    createActionButton("新增点位", () => addMapLocation(record)),
    createActionButton("添加返回", () => addMapReturnLocation(record))
  );
  toolbar.append(title, actions);

  const body = document.createElement("div");
  body.className = "map-location-body";
  const navigation = document.createElement("div");
  navigation.className = "map-location-navigation";
  const search = document.createElement("input");
  search.type = "search";
  search.className = "map-location-search";
  search.placeholder = "搜索点位、事件目标";
  search.value = state.mapEditor.locationSearch;
  const count = document.createElement("div");
  count.className = "record-subtitle map-location-count";
  const list = document.createElement("div");
  list.className = "map-location-list";

  const refreshList = () => {
    list.replaceChildren();
    const query = state.mapEditor.locationSearch.trim().toLowerCase();
    let visibleCount = 0;
    record.locations.forEach((location, index) => {
      if (!matchesMapLocationSearch(location, query)) {
        return;
      }
      visibleCount += 1;
      const card = document.createElement("button");
      card.type = "button";
      card.className = "map-location-card";
      card.classList.toggle("active", index === state.mapEditor.selectedLocationIndex);
      card.addEventListener("click", () => {
        state.mapEditor.selectedLocationIndex = index;
        state.mapEditor.canvasMode = "select";
        renderFormView();
      });

      const iconInfo = getMapLocationIconInfo(location, location.events[0] || null);
      const icon = createMapIconVisual(iconInfo, String(index + 1), "map-location-list-icon");
      const content = document.createElement("div");
      content.className = "map-location-card-content";
      const name = document.createElement("div");
      name.className = "map-location-card-name";
      name.textContent = location.name || location.id || `点位 ${index + 1}`;
      const meta = document.createElement("div");
      meta.className = "record-subtitle";
      meta.textContent = `${location.events.length} 事件${isLargeMap(record) ? ` · (${normalizeMapPosition(location.position).x}, ${normalizeMapPosition(location.position).y})` : ""}`;
      const source = document.createElement("div");
      source.className = `map-location-icon-source ${iconInfo.status}`;
      source.textContent = iconInfo.sourceLabel;
      content.append(name, meta, source);
      card.append(icon, content);
      list.appendChild(card);
    });

    count.textContent = `${visibleCount} / ${record.locations.length} 个点位`;
    if (visibleCount === 0) {
      const empty = document.createElement("div");
      empty.className = "record-empty";
      empty.textContent = record.locations.length === 0
        ? "还没有点位。先添加一个剧情 NPC、入口或返回点。"
        : "没有匹配的点位。";
      list.appendChild(empty);
    }
  };

  bindImeSafeInput(search, (value) => {
    state.mapEditor.locationSearch = value;
    refreshList();
  });
  refreshList();
  navigation.append(search, count, list);

  const editor = createSelectedMapLocationEditor(record);
  body.append(navigation, editor);
  panel.append(toolbar, body);
  return panel;
}

function matchesMapLocationSearch(location, query) {
  if (!query) {
    return true;
  }
  const eventText = (location.events || [])
    .map((mapEvent) => `${mapEvent.type || ""} ${mapEvent.targetId || ""} ${mapEvent.description || ""}`)
    .join(" ");
  return [location.id, location.name, location.description, location.picture, eventText]
    .filter((value) => value != null)
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function createSelectedMapLocationEditor(record) {
  const location = record.locations[state.mapEditor.selectedLocationIndex];
  const editor = document.createElement("div");
  editor.className = "map-location-editor";
  if (!location) {
    const empty = document.createElement("div");
    empty.className = "record-empty";
    empty.textContent = "选择或新建一个点位开始编辑。";
    editor.appendChild(empty);
    return editor;
  }

  ensureMapLocationShape(location);
  const header = document.createElement("div");
  header.className = "item-array-card-header";
  const title = document.createElement("div");
  title.className = "item-array-card-title";
  title.textContent = location.name || location.id || "未命名点位";
  const actions = document.createElement("div");
  actions.className = "record-actions";
  actions.append(
    createActionButton("上移", () => moveMapLocation(record, state.mapEditor.selectedLocationIndex, -1)),
    createActionButton("下移", () => moveMapLocation(record, state.mapEditor.selectedLocationIndex, 1)),
    createActionButton("复制", () => duplicateMapLocation(record, state.mapEditor.selectedLocationIndex)),
    createActionButton("删除", () => deleteMapLocation(record, state.mapEditor.selectedLocationIndex))
  );
  header.append(title, actions);

  const grid = document.createElement("div");
  grid.className = "character-form-grid map-location-grid";
  grid.append(
    createMapObjectTextField(location, "点位ID", "id", { placeholder: "例如：神秘人", rerenderOnChange: true }),
    createMapObjectTextField(location, "显示名", "name", { placeholder: "为空时显示 id", nullable: true, rerenderOnChange: true }),
    createMapObjectResourceField(location, "点位图片（公共回退）", "picture", null, {
      locationIndex: state.mapEditor.selectedLocationIndex,
      eventIndex: -1,
      help: "当当前事件没有填写 image 时使用；如果这里也为空，运行时会尝试使用与点位 ID 同名角色的头像。",
    }),
    createMapObjectTextareaField(location, "点位描述", "description")
  );

  if (isLargeMap(record)) {
    grid.append(createMapPositionField(location, "x"), createMapPositionField(location, "y"));
  }

  editor.append(header, createMapLocationIconSummary(location), grid, createMapEventSection(record, location));
  return editor;
}

function createMapObjectTextField(owner, labelCn, key, options = {}) {
  const field = createCharacterFieldShell(labelCn, key, options.full === true);
  const input = document.createElement("input");
  input.type = "text";
  input.value = owner[key] == null ? "" : String(owner[key]);
  input.placeholder = options.placeholder || "";
  if (options.list) {
    input.setAttribute("list", options.list);
  }
  input.addEventListener("input", () => {
    const value = input.value.trim();
    owner[key] = options.nullable && !value ? null : input.value;
    syncFormToEditor();
  });
  if (options.rerenderOnChange) {
    input.addEventListener("change", () => renderFormView());
  }
  field.appendChild(input);
  return field;
}

function createMapObjectTextareaField(owner, labelCn, key) {
  const field = createCharacterFieldShell(labelCn, key, true);
  const textarea = document.createElement("textarea");
  textarea.rows = 3;
  textarea.value = owner[key] == null ? "" : String(owner[key]);
  textarea.addEventListener("input", () => {
    owner[key] = textarea.value.trim() ? textarea.value : null;
    syncFormToEditor();
  });
  field.appendChild(textarea);
  return field;
}

function createMapObjectResourceField(owner, labelCn, key, group, pickerContext = null) {
  const field = createCharacterFieldShell(labelCn, key, true);
  field.classList.add("map-resource-field");
  const input = document.createElement("input");
  input.type = "text";
  input.value = owner[key] == null ? "" : String(owner[key]);
  input.placeholder = "例如：town.kezhan；也可填写其他图片资源 id";
  input.setAttribute("list", pickerContext ? ensureMapIconResourceDatalist() : ensureResourceIdDatalist(group));
  input.addEventListener("input", () => {
    owner[key] = input.value.trim() || null;
    syncFormToEditor();
  });
  input.addEventListener("change", () => renderFormView());
  field.appendChild(input);

  const info = getMapResourceInfo(owner[key], group);
  field.appendChild(createShopResourcePreview(info));
  if (pickerContext) {
    const actions = document.createElement("div");
    actions.className = "shop-resource-actions";
    const pickerButton = document.createElement("button");
    pickerButton.type = "button";
    pickerButton.textContent = "选择图标";
    pickerButton.addEventListener("click", () => openMapResourcePicker({
      ...pickerContext,
      field: key,
    }));
    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.textContent = "清空";
    clearButton.disabled = !info.resourceId;
    clearButton.addEventListener("click", () => {
      owner[key] = null;
      syncFormToEditor();
      renderFormView();
    });
    actions.append(pickerButton, clearButton);
    field.appendChild(actions);

    if (pickerContext.help) {
      const help = document.createElement("div");
      help.className = "map-resource-help";
      help.textContent = pickerContext.help;
      field.appendChild(help);
    }
  }
  return field;
}

function createMapLocationIconSummary(location) {
  const box = document.createElement("div");
  box.className = "map-runtime-icon-summary";
  const mapEvent = location.events[0] || null;
  const info = getMapLocationIconInfo(location, mapEvent);
  box.appendChild(createMapIconVisual(info, "", "map-runtime-icon-preview"));
  const content = document.createElement("div");
  content.className = "map-runtime-icon-content";
  const title = document.createElement("div");
  title.className = "map-runtime-icon-title";
  title.textContent = mapEvent ? `首个事件的运行时图标：${info.sourceLabel}` : "当前没有事件，运行时不会显示这个交互点";
  const detail = document.createElement("div");
  detail.className = `map-runtime-icon-detail ${info.status}`;
  detail.textContent = info.message;
  const rule = document.createElement("div");
  rule.className = "map-runtime-icon-rule";
  rule.textContent = "回退顺序：事件 image → 点位 picture → 与点位 ID 同名角色的 portrait → 默认图标。已填写但失效的资源会直接落到默认图标，不会继续回退。";
  content.append(title, detail, rule);
  box.appendChild(content);
  return box;
}

function getMapLocationIconInfo(location, mapEvent) {
  if (!mapEvent) {
    return {
      resourceId: "",
      previewPath: "",
      sourceLabel: "默认图标",
      status: "empty",
      message: "没有可触发事件；运行时不会创建可交互按钮。",
    };
  }

  const eventImage = typeof mapEvent.image === "string" ? mapEvent.image.trim() : "";
  if (eventImage) {
    return createMapResolvedIconInfo(eventImage, "事件图标");
  }

  const locationPicture = typeof location.picture === "string" ? location.picture.trim() : "";
  if (locationPicture) {
    return createMapResolvedIconInfo(locationPicture, "点位图片");
  }

  const character = state.contentIndex.charactersByIdOrName.get(String(location.id || "").trim());
  const portraitId = typeof character?.portrait === "string" ? character.portrait.trim() : "";
  if (portraitId) {
    return createMapResolvedIconInfo(portraitId, "角色头像");
  }

  return {
    resourceId: "",
    previewPath: "",
    sourceLabel: "默认图标",
    status: "empty",
    message: `事件和点位都未设置图标，且找不到 ID 为「${location.id || "未填写"}」的角色头像。`,
  };
}

function createMapResolvedIconInfo(resourceId, sourceLabel) {
  const resourceInfo = getMapResourceInfo(resourceId, null);
  const available = resourceInfo.status === "ok";
  return {
    resourceId,
    previewPath: available ? resourceInfo.previewPath : "",
    sourceLabel: available ? sourceLabel : `${sourceLabel}失效，使用默认图标`,
    status: resourceInfo.status,
    message: available
      ? `${sourceLabel}：${resourceInfo.message}`
      : `${sourceLabel}已填写为「${resourceId}」，但${resourceInfo.message}；运行时会直接使用默认图标。`,
  };
}

function ensureMapIconResourceDatalist() {
  const id = "resourceIdOptions-map-icons";
  document.getElementById(id)?.remove();
  const datalist = document.createElement("datalist");
  datalist.id = id;
  for (const resource of getMapIconResources()) {
    const option = document.createElement("option");
    option.value = resource.id;
    option.label = `${resource.group || "未分组"} · ${resource.value || ""}`;
    datalist.appendChild(option);
  }
  document.body.appendChild(datalist);
  return id;
}

function createMapPositionField(location, axis) {
  const field = createCharacterFieldShell(`坐标 ${axis.toUpperCase()}`, `position.${axis}`);
  const input = document.createElement("input");
  input.type = "number";
  input.min = axis === "x" ? "0" : "0";
  input.max = axis === "x" ? "800" : "600";
  const position = normalizeMapPosition(location.position);
  input.value = String(position[axis]);
  input.addEventListener("input", () => {
    const next = normalizeMapPosition(location.position);
    next[axis] = parseNumberInputValue(input.value, 0);
    location.position = next;
    syncFormToEditor();
  });
  input.addEventListener("change", () => renderFormView());
  field.appendChild(input);
  return field;
}

function createMapEventSection(record, location) {
  const section = document.createElement("div");
  section.className = "map-event-section";
  const toolbar = document.createElement("div");
  toolbar.className = "shop-product-toolbar";
  const note = document.createElement("div");
  note.className = "static-tool-note";
  note.textContent = "优先级从上到下；常见写法是先放一次性剧情，再放进入地图的兜底事件。";
  const add = createActionButton("新增事件", () => addMapEvent(location));
  toolbar.append(note, add);

  const list = document.createElement("div");
  list.className = "item-array-list map-event-list";
  location.events.forEach((event, eventIndex) => {
    list.appendChild(createMapEventCard(record, location, event, eventIndex));
  });
  if (location.events.length === 0) {
    const empty = document.createElement("div");
    empty.className = "record-empty";
    empty.textContent = "这个点位没有事件。小地图中没有事件的点位不会显示。";
    list.appendChild(empty);
  }

  section.append(toolbar, list);
  return section;
}

function createMapEventCard(record, location, mapEvent, eventIndex) {
  ensureMapEventShape(mapEvent);
  const info = getMapEventInfo(mapEvent);
  const card = document.createElement("article");
  card.className = `item-array-card map-event-card ${info.severity}`;
  const header = document.createElement("div");
  header.className = "item-array-card-header";
  const title = document.createElement("div");
  title.className = "item-array-card-title";
  title.textContent = `${eventIndex + 1}. ${info.title}`;
  const actions = document.createElement("div");
  actions.className = "record-actions";
  actions.append(
    createActionButton("上移", () => moveMapEvent(location, eventIndex, -1)),
    createActionButton("下移", () => moveMapEvent(location, eventIndex, 1)),
    createActionButton("复制", () => duplicateMapEvent(location, eventIndex)),
    createActionButton("删除", () => deleteMapEvent(location, eventIndex))
  );
  header.append(title, actions);

  const grid = document.createElement("div");
  grid.className = "item-array-grid map-event-grid";
  grid.append(
    createMapEventTypeField(mapEvent),
    createMapEventTargetField(mapEvent),
    createMapEventRepeatField(mapEvent),
    createMapEventProbabilityField(mapEvent),
    createMapObjectResourceField(mapEvent, "事件图标（仅当前事件）", "image", null, {
      locationIndex: state.mapEditor.selectedLocationIndex,
      eventIndex,
      help: "填写后会覆盖点位 picture 和角色头像；清空后才会继续使用点位的公共回退图。",
    }),
    createMapObjectTextareaField(mapEvent, "提示文本", "description")
  );

  const meta = document.createElement("div");
  meta.className = "shop-product-meta";
  meta.append(
    createPill(info.typeLabel),
    createPill(info.targetStatusText, info.targetStatusTone),
    createPill(mapEvent.repeatMode === "once" ? "一次性" : "可重复"),
    createPill(`概率 ${mapEvent.probability}%`)
  );

  card.append(header, meta, createMapEventIconSummary(location, mapEvent), grid, createMapConditionEditor(mapEvent));
  if (info.message) {
    const message = document.createElement("div");
    message.className = `shop-product-message ${info.severity}`;
    message.textContent = info.message;
    card.appendChild(message);
  }
  return card;
}

function createMapEventIconSummary(location, mapEvent) {
  const info = getMapLocationIconInfo(location, mapEvent);
  const summary = document.createElement("div");
  summary.className = `map-event-icon-summary ${info.status}`;
  summary.appendChild(createMapIconVisual(info, "", "map-event-icon-preview"));
  const text = document.createElement("div");
  text.className = "map-event-icon-text";
  const title = document.createElement("strong");
  title.textContent = `运行时最终图标：${info.sourceLabel}`;
  const detail = document.createElement("span");
  detail.textContent = info.message;
  text.append(title, detail);
  summary.appendChild(text);
  return summary;
}

function createMapEventTypeField(mapEvent) {
  const field = createCharacterFieldShell("事件类型", "type");
  const select = document.createElement("select");
  for (const choice of MAP_EVENT_TYPE_CHOICES) {
    const option = document.createElement("option");
    option.value = choice.value;
    option.textContent = choice.label;
    option.selected = mapEvent.type === choice.value;
    select.appendChild(option);
  }
  if (!MAP_EVENT_TYPE_CHOICES.some((choice) => choice.value === mapEvent.type)) {
    const option = document.createElement("option");
    option.value = mapEvent.type;
    option.textContent = `${mapEvent.type} 未支持`;
    option.selected = true;
    select.appendChild(option);
  }
  select.addEventListener("change", () => {
    mapEvent.type = select.value;
    syncFormToEditor();
    renderFormView();
  });
  field.appendChild(select);
  return field;
}

function createMapEventTargetField(mapEvent) {
  const field = createCharacterFieldShell("目标", "targetId", true);
  const input = document.createElement("input");
  input.type = "text";
  input.value = mapEvent.targetId || "";
  input.placeholder = getMapEventTargetPlaceholder(mapEvent.type);
  const datalist = ensureMapEventTargetDatalist(mapEvent.type);
  if (datalist) {
    input.setAttribute("list", datalist);
  }
  input.disabled = mapEvent.type === "xiangzi";
  input.addEventListener("input", () => {
    mapEvent.targetId = input.value.trim();
    syncFormToEditor();
  });
  input.addEventListener("change", () => renderFormView());
  field.appendChild(input);
  return field;
}

function createMapEventRepeatField(mapEvent) {
  const field = createCharacterFieldShell("触发次数", "repeatMode");
  const select = document.createElement("select");
  for (const choice of [
    { value: "infinite", label: "可重复" },
    { value: "once", label: "只触发一次" },
  ]) {
    const option = document.createElement("option");
    option.value = choice.value;
    option.textContent = choice.label;
    option.selected = (mapEvent.repeatMode || "infinite") === choice.value;
    select.appendChild(option);
  }
  select.addEventListener("change", () => {
    if (select.value === "once") {
      mapEvent.repeatMode = "once";
    } else {
      delete mapEvent.repeatMode;
    }
    syncFormToEditor();
    renderFormView();
  });
  field.appendChild(select);
  return field;
}

function createMapEventProbabilityField(mapEvent) {
  const field = createCharacterFieldShell("概率", "probability");
  const input = document.createElement("input");
  input.type = "number";
  input.min = "0";
  input.max = "100";
  input.value = String(Number.isFinite(mapEvent.probability) ? mapEvent.probability : 100);
  input.addEventListener("input", () => {
    mapEvent.probability = Math.max(0, Math.min(100, parseNumberInputValue(input.value, 100)));
    syncFormToEditor();
  });
  input.addEventListener("change", () => renderFormView());
  field.appendChild(input);
  return field;
}

function createMapConditionEditor(mapEvent) {
  const box = document.createElement("div");
  box.className = "map-condition-editor";
  const header = document.createElement("div");
  header.className = "shop-product-toolbar";
  const note = document.createElement("div");
  note.className = "static-tool-note";
  note.textContent = "条件全部满足后才会尝试触发这个事件。多个值用 # 分隔，例如 角色#10。";
  const add = createActionButton("添加条件", () => {
    mapEvent.conditions.push({ type: "should_not_finish", value: "" });
    syncFormToEditor();
    renderFormView();
  });
  header.append(note, add);
  const list = document.createElement("div");
  list.className = "map-condition-list";
  mapEvent.conditions.forEach((condition, index) => {
    list.appendChild(createMapConditionRow(mapEvent, condition, index));
  });
  if (mapEvent.conditions.length === 0) {
    const empty = document.createElement("div");
    empty.className = "record-empty compact";
    empty.textContent = "无条件，始终可参与触发判断。";
    list.appendChild(empty);
  }
  box.append(header, list);
  return box;
}

function createMapConditionRow(mapEvent, condition, index) {
  const row = document.createElement("div");
  row.className = "map-condition-row";
  const type = document.createElement("select");
  for (const choice of MAP_CONDITION_CHOICES) {
    const option = document.createElement("option");
    option.value = choice.value;
    option.textContent = choice.label;
    option.selected = condition.type === choice.value;
    type.appendChild(option);
  }
  if (!MAP_CONDITION_CHOICES.some((choice) => choice.value === condition.type)) {
    const option = document.createElement("option");
    option.value = condition.type || "";
    option.textContent = `${condition.type || "未知"} 未支持`;
    option.selected = true;
    type.appendChild(option);
  }
  type.addEventListener("change", () => {
    condition.type = type.value;
    syncFormToEditor();
    renderFormView();
  });

  const value = document.createElement("input");
  value.type = "text";
  value.value = condition.value == null ? "" : String(condition.value);
  value.placeholder = getMapConditionValuePlaceholder(condition.type);
  const datalist = ensureMapConditionValueDatalist(condition.type);
  if (datalist) {
    value.setAttribute("list", datalist);
  }
  value.disabled = condition.type === "always" || condition.type === "in_newbie_task";
  value.addEventListener("input", () => {
    condition.value = value.value.trim();
    syncFormToEditor();
  });

  const remove = createActionButton("删除", () => {
    mapEvent.conditions.splice(index, 1);
    syncFormToEditor();
    renderFormView();
  });
  row.append(type, value, remove);
  return row;
}

function createMapAdvancedJsonSection(record) {
  const section = createCharacterSection("高级 JSON", "Advanced");
  const details = document.createElement("details");
  details.className = "character-advanced-json";
  const summary = document.createElement("summary");
  summary.textContent = "展开原始地图 JSON";
  const textarea = document.createElement("textarea");
  textarea.value = JSON.stringify(record, null, 2);
  textarea.addEventListener("change", () => {
    try {
      const parsed = JSON.parse(textarea.value);
      state.formRecords[state.selectedRecordIndex] = parsed;
      syncFormToEditor();
      renderFormView();
    } catch (error) {
      textarea.setCustomValidity(error instanceof Error ? error.message : String(error));
      textarea.reportValidity();
    }
  });
  details.append(summary, textarea);
  section.appendChild(details);
  return section;
}

function addMapLocation(record) {
  const location = createMapLocationTemplate(record, `新点位${record.locations.length + 1}`);
  record.locations.push(location);
  state.mapEditor.selectedLocationIndex = record.locations.length - 1;
  syncFormToEditor();
  renderFormView();
}

function addMapReturnLocation(record) {
  const targetId = record.id === "大地图" ? "" : "大地图";
  const location = createMapLocationTemplate(record, "返回");
  location.description = targetId ? "返回大地图" : "返回上一处";
  location.events = [
    {
      type: "map",
      targetId,
      probability: 100,
      description: location.description,
      conditions: [],
    },
  ];
  record.locations.push(location);
  state.mapEditor.selectedLocationIndex = record.locations.length - 1;
  syncFormToEditor();
  renderFormView();
}

function createMapLocationTemplate(record, baseId) {
  const id = createUniqueLocationId(record, baseId);
  const location = {
    id,
    name: id,
    description: "",
    picture: null,
    events: [],
  };
  if (isLargeMap(record)) {
    location.position = { x: 400, y: 300 };
  }
  return location;
}

function createUniqueLocationId(record, baseId) {
  const existing = new Set(record.locations.map((location) => String(location?.id || "")));
  if (!existing.has(baseId)) {
    return baseId;
  }
  for (let index = 2; index < 10000; index += 1) {
    const candidate = `${baseId}_${index}`;
    if (!existing.has(candidate)) {
      return candidate;
    }
  }
  return `${baseId}_${Date.now()}`;
}

function moveMapLocation(record, index, delta) {
  const nextIndex = index + delta;
  if (nextIndex < 0 || nextIndex >= record.locations.length) {
    return;
  }
  const [location] = record.locations.splice(index, 1);
  record.locations.splice(nextIndex, 0, location);
  state.mapEditor.selectedLocationIndex = nextIndex;
  syncFormToEditor();
  renderFormView();
}

function duplicateMapLocation(record, index) {
  const location = record.locations[index];
  if (!location) {
    return;
  }
  const copy = structuredCloneCompat(location);
  copy.id = createUniqueLocationId(record, `${copy.id || "点位"}_复制`);
  copy.name = copy.name ? `${copy.name} 复制` : copy.id;
  record.locations.splice(index + 1, 0, copy);
  state.mapEditor.selectedLocationIndex = index + 1;
  syncFormToEditor();
  renderFormView();
}

function deleteMapLocation(record, index) {
  const location = record.locations[index];
  if (!location) {
    return;
  }
  const title = location.name || location.id || `点位 ${index + 1}`;
  if (!confirmAction(`确认删除点位「${title}」？`)) {
    return;
  }
  record.locations.splice(index, 1);
  state.mapEditor.selectedLocationIndex = Math.max(0, Math.min(index, record.locations.length - 1));
  syncFormToEditor();
  renderFormView();
}

function addMapEvent(location) {
  location.events.push({
    type: "story",
    targetId: "",
    probability: 100,
    description: "",
    conditions: [],
  });
  syncFormToEditor();
  renderFormView();
}

function moveMapEvent(location, index, delta) {
  const nextIndex = index + delta;
  if (nextIndex < 0 || nextIndex >= location.events.length) {
    return;
  }
  const [event] = location.events.splice(index, 1);
  location.events.splice(nextIndex, 0, event);
  syncFormToEditor();
  renderFormView();
}

function duplicateMapEvent(location, index) {
  const source = location.events[index];
  if (!source) {
    return;
  }
  location.events.splice(index + 1, 0, structuredCloneCompat(source));
  syncFormToEditor();
  renderFormView();
}

function deleteMapEvent(location, index) {
  const source = location.events[index];
  if (!source) {
    return;
  }
  const info = getMapEventInfo(source);
  if (!confirmAction(`确认删除事件「${info.title}」？`)) {
    return;
  }
  location.events.splice(index, 1);
  syncFormToEditor();
  renderFormView();
}

function ensureMapShape(record) {
  if (typeof record.id !== "string") {
    record.id = "";
  }
  if (typeof record.name !== "string") {
    record.name = record.id || "";
  }
  if (!Array.isArray(record.musics)) {
    record.musics = [];
  }
  if (!Array.isArray(record.locations)) {
    record.locations = [];
  }
  record.locations = record.locations.map((location) => (
    location && typeof location === "object" && !Array.isArray(location)
      ? location
      : createMapLocationTemplate(record, "点位")
  ));
  for (const location of record.locations) {
    ensureMapLocationShape(location);
  }
}

function ensureMapLocationShape(location) {
  if (typeof location.id !== "string") {
    location.id = "";
  }
  if (location.name != null && typeof location.name !== "string") {
    location.name = String(location.name);
  }
  if (!Array.isArray(location.events)) {
    location.events = [];
  }
  location.events = location.events.map((event) => (
    event && typeof event === "object" && !Array.isArray(event)
      ? event
      : { type: "story", targetId: "", probability: 100, conditions: [] }
  ));
  for (const event of location.events) {
    ensureMapEventShape(event);
  }
}

function ensureMapEventShape(mapEvent) {
  if (typeof mapEvent.type !== "string" || !mapEvent.type.trim()) {
    mapEvent.type = "story";
  }
  if (typeof mapEvent.targetId !== "string") {
    mapEvent.targetId = "";
  }
  if (!Number.isFinite(mapEvent.probability)) {
    mapEvent.probability = 100;
  }
  if (!Array.isArray(mapEvent.conditions)) {
    mapEvent.conditions = [];
  }
  mapEvent.conditions = mapEvent.conditions.map((condition) => (
    condition && typeof condition === "object" && !Array.isArray(condition)
      ? {
        type: typeof condition.type === "string" ? condition.type : "always",
        value: condition.value == null ? "" : String(condition.value),
      }
      : { type: "always", value: "" }
  ));
}

function clampMapSelection() {
  const record = state.formRecords[state.selectedRecordIndex];
  const count = Array.isArray(record?.locations) ? record.locations.length : 0;
  if (count <= 0) {
    state.mapEditor.selectedLocationIndex = 0;
    return;
  }
  state.mapEditor.selectedLocationIndex = Math.max(0, Math.min(state.mapEditor.selectedLocationIndex, count - 1));
}

function getMapKind(record) {
  return record.kind === "large" ? "large" : "small";
}

function isLargeMap(record) {
  return getMapKind(record) === "large";
}

function normalizeMapPosition(position) {
  if (!position || typeof position !== "object") {
    return { x: 400, y: 300 };
  }
  return {
    x: Number.isFinite(position.x) ? position.x : 400,
    y: Number.isFinite(position.y) ? position.y : 300,
  };
}

function getMapResourceInfo(resourceId, group) {
  const normalizedId = typeof resourceId === "string" ? resourceId.trim() : "";
  const resource = normalizedId ? state.contentIndex.resourcesById.get(normalizedId) : null;
  const previewPath = resource ? resolveResourceAssetPath(resource) : "";
  const status = !normalizedId
    ? "empty"
    : !resource
      ? "missing"
      : !previewPath
        ? "broken"
        : "ok";
  let message = "未设置资源";
  if (status === "missing") {
    message = `resources.json 中不存在：${normalizedId}`;
  } else if (status === "broken") {
    message = "资源存在，但找不到对应文件";
  } else if (status === "ok") {
    message = `${normalizedId} · ${resource.value || ""}`;
  }
  return {
    resourceId: normalizedId,
    resource,
    previewPath,
    group,
    status,
    message,
  };
}

function getMapStats(record) {
  const issues = [];
  const locations = Array.isArray(record.locations) ? record.locations : [];
  let events = 0;
  let storyEvents = 0;
  let mapEvents = 0;

  if (!record.id) {
    issues.push("地图缺少 id。");
  }
  if (record.id && state.formRecords.filter((candidate) => candidate?.id === record.id).length > 1) {
    issues.push(`地图 ID 重复：${record.id}`);
  }
  if (!record.name) {
    issues.push(`地图「${record.id || "未命名"}」缺少显示名。`);
  }
  if (record.picture && getMapResourceInfo(record.picture, "地图").status !== "ok") {
    issues.push(`地图「${record.id || "未命名"}」背景资源不可用：${record.picture}`);
  }
  for (const music of record.musics || []) {
    if (music && getMapResourceInfo(music, "音乐").status !== "ok") {
      issues.push(`地图「${record.id || "未命名"}」音乐资源不可用：${music}`);
    }
  }

  const locationIdCounts = new Map();
  const occupiedPositions = new Map();
  for (const location of locations) {
    const id = String(location?.id || "").trim();
    if (id) {
      locationIdCounts.set(id, (locationIdCounts.get(id) || 0) + 1);
    }
  }

  let hasExitMapEvent = false;
  locations.forEach((location, locationIndex) => {
    const locationName = location.name || location.id || `点位 ${locationIndex + 1}`;
    const locationId = String(location.id || "").trim();
    if (!locationId) {
      issues.push(`点位 ${locationIndex + 1} 缺少 id。`);
    } else if ((locationIdCounts.get(locationId) || 0) > 1) {
      issues.push(`点位 ID 重复：${locationId}`);
    }

    if (isLargeMap(record)) {
      if (!location.position || !Number.isFinite(location.position.x) || !Number.isFinite(location.position.y)) {
        issues.push(`大地图点位「${locationName}」缺少坐标。`);
      } else {
        const { x, y } = location.position;
        if (x < 0 || x > 800 || y < 0 || y > 600) {
          issues.push(`大地图点位「${locationName}」坐标越界：(${x}, ${y})，有效范围是 0..800 × 0..600。`);
        }
        const positionKey = `${x},${y}`;
        const previousLocation = occupiedPositions.get(positionKey);
        if (previousLocation) {
          issues.push(`大地图点位「${locationName}」与「${previousLocation}」坐标重叠：(${x}, ${y})。`);
        } else {
          occupiedPositions.set(positionKey, locationName);
        }
      }
    }

    if (location.picture && getMapResourceInfo(location.picture, null).status !== "ok") {
      issues.push(`点位「${locationName}」图片资源不可用：${location.picture}`);
    }
    if (!Array.isArray(location.events) || location.events.length === 0) {
      issues.push(`${isLargeMap(record) ? "大" : "小"}地图点位「${locationName}」没有事件，${isLargeMap(record) ? "运行时会显示但无法交互" : "运行时不会显示"}。`);
      return;
    }

    let hasPermanentCatchAll = false;
    location.events.forEach((mapEvent, eventIndex) => {
      events += 1;
      if (hasPermanentCatchAll) {
        issues.push(`点位「${locationName}」第 ${eventIndex + 1} 个事件永远不会触发：前面已有可重复、无条件、100% 概率事件。`);
      }
      if (mapEvent.type === "story") {
        storyEvents += 1;
      }
      if (mapEvent.type === "map") {
        mapEvents += 1;
        if (mapEvent.targetId && mapEvent.targetId !== record.id) {
          hasExitMapEvent = true;
        }
      }
      const eventInfo = getMapEventInfo(mapEvent);
      if (eventInfo.severity === "warn" && eventInfo.message) {
        issues.push(`点位「${locationName}」：${eventInfo.message}`);
      }
      if (mapEvent.image && getMapResourceInfo(mapEvent.image, null).status !== "ok") {
        issues.push(`点位「${locationName}」事件图标不可用：${mapEvent.image}`);
      }
      for (const condition of mapEvent.conditions || []) {
        if (!MAP_CONDITION_CHOICES.some((choice) => choice.value === condition.type)) {
          issues.push(`点位「${locationName}」使用了未支持条件：${condition.type}`);
        } else if (condition.type !== "always" && condition.type !== "in_newbie_task" && !String(condition.value || "").trim()) {
          issues.push(`点位「${locationName}」条件「${condition.type}」缺少值。`);
        }
      }
      if (mapEvent.repeatMode !== "once" &&
          mapEvent.probability === 100 &&
          (!Array.isArray(mapEvent.conditions) || mapEvent.conditions.length === 0)) {
        hasPermanentCatchAll = true;
      }
    });
  });

  if (!isLargeMap(record) && record.id !== "大地图" && !hasExitMapEvent) {
    issues.push(`小地图「${record.id || "未命名"}」没有跳转到其他地图的出口事件。`);
  }

  return {
    locations: locations.length,
    events,
    storyEvents,
    mapEvents,
    issues: Array.from(new Set(issues)),
  };
}

function getMapEventInfo(mapEvent) {
  const typeChoice = MAP_EVENT_TYPE_CHOICES.find((choice) => choice.value === mapEvent.type);
  const typeLabel = typeChoice?.label || `${mapEvent.type} 未支持`;
  const targetId = String(mapEvent.targetId || "").trim();
  const targetExists = mapEvent.type === "xiangzi" || hasMapEventTarget(mapEvent.type, targetId);
  let targetStatusText = targetExists ? "目标存在" : "目标缺失";
  let targetStatusTone = targetExists ? "ok" : "warn";
  let severity = targetExists ? "ok" : "warn";
  let message = "";

  if (!typeChoice) {
    targetStatusText = "类型未支持";
    targetStatusTone = "warn";
    severity = "warn";
    message = `当前运行时不会处理事件类型「${mapEvent.type}」，只会写日志占位。`;
  } else if (mapEvent.type !== "xiangzi" && !targetId) {
    targetStatusText = "未填写目标";
    targetStatusTone = "warn";
    severity = "warn";
    message = `${typeLabel} 需要填写目标。`;
  } else if (!targetExists) {
    message = `${typeLabel} 目标不存在：${targetId}`;
  }

  if (!Number.isFinite(mapEvent.probability) || mapEvent.probability < 0 || mapEvent.probability > 100) {
    severity = "warn";
    message = "概率必须在 0 到 100 之间。";
  }

  return {
    title: targetId ? `${typeLabel}：${targetId}` : typeLabel,
    typeLabel,
    targetStatusText,
    targetStatusTone,
    severity,
    message,
  };
}

function hasMapEventTarget(type, targetId) {
  if (!targetId) {
    return false;
  }
  switch (type) {
    case "map":
      return state.formRecords.some((record) => record?.id === targetId) ||
        hasDefinition("maps", targetId);
    case "story":
      return hasDefinition("story", targetId);
    case "shop":
      return hasDefinition("shops", targetId);
    case "battle":
      return hasDefinition("battles", targetId);
    default:
      return false;
  }
}

function hasDefinition(type, id) {
  const definitions = state.contentIndex.definitionsById.get(id) || [];
  return definitions.some((definition) => definition.type === type);
}

function getDefinitionsByType(type) {
  const result = [];
  for (const definitions of state.contentIndex.definitionsById.values()) {
    for (const definition of definitions) {
      if (definition.type === type) {
        result.push(definition);
      }
    }
  }
  return result.sort((left, right) => left.id.localeCompare(right.id, "zh-Hans-CN"));
}

function ensureMapEventTargetDatalist(type) {
  const typeMap = {
    map: "maps",
    story: "story",
    shop: "shops",
    battle: "battles",
  };
  const definitionType = typeMap[type];
  if (!definitionType) {
    return "";
  }
  const id = `mapEventTargetOptions-${type}`;
  const existing = document.getElementById(id);
  if (existing) {
    existing.remove();
  }
  const datalist = document.createElement("datalist");
  datalist.id = id;
  for (const definition of getDefinitionsByType(definitionType)) {
    const option = document.createElement("option");
    option.value = definition.id;
    option.label = definition.displayName || definition.id;
    datalist.appendChild(option);
  }
  document.body.appendChild(datalist);
  return id;
}

function getMapEventTargetPlaceholder(type) {
  return {
    map: "选择 maps.json 中的地图 id",
    story: "选择 story 段落 id",
    shop: "选择 shops.json 中的商店 id",
    battle: "选择 battles.json 中的战斗 id",
    xiangzi: "储物箱无需目标",
  }[type] || "未支持事件类型";
}

function ensureMapConditionValueDatalist(type) {
  const datalistTypes = {
    should_finish: "story",
    should_not_finish: "story",
    follow_story: "story",
    in_team: "characters",
    not_in_team: "characters",
    key_in_team: "characters",
    key_not_in_team: "characters",
    have_item: "items",
    not_have_item: "items",
    level_greater_than: "characters",
    level_less_than: "characters",
    shenfa_greater_than: "characters",
    skill_more_than: "characters",
    skill_less_than: "characters",
  };
  const targetType = datalistTypes[type];
  if (!targetType) {
    return "";
  }
  const id = `mapConditionValueOptions-${type}`;
  const existing = document.getElementById(id);
  if (existing) {
    existing.remove();
  }
  const datalist = document.createElement("datalist");
  datalist.id = id;
  const definitions = targetType === "characters"
    ? getDefinitionsByType("characters")
    : targetType === "items"
      ? getDefinitionsByType("items")
      : getDefinitionsByType("story");
  for (const definition of definitions) {
    const option = document.createElement("option");
    option.value = type === "in_team" || type === "not_in_team"
      ? definition.displayName || definition.id
      : definition.id;
    option.label = definition.displayName || definition.id;
    datalist.appendChild(option);
  }
  document.body.appendChild(datalist);
  return id;
}

function getMapConditionValuePlaceholder(type) {
  return {
    always: "无需填写",
    should_finish: "剧情 id",
    should_not_finish: "剧情 id",
    follow_story: "剧情 id",
    in_team: "角色显示名",
    not_in_team: "角色显示名",
    key_in_team: "角色 id",
    key_not_in_team: "角色 id",
    have_item: "物品id 或 物品id#数量",
    not_have_item: "物品id 或 物品id#数量",
    in_time: "子#丑#寅 或 Zi#Chou",
    not_in_time: "子#丑#寅 或 Zi#Chou",
    has_time_key: "限时 key",
    not_has_time_key: "限时 key",
    in_menpai: "门派 id",
    not_in_menpai: "门派 id",
    in_round: "周目数字",
    not_in_round: "周目数字",
    game_mode: "normal / hard / crazy",
    exceed_day: "天数",
    not_exceed_day: "天数",
    level_greater_than: "角色#等级",
    level_less_than: "角色#等级",
    shenfa_greater_than: "角色#身法",
    skill_more_than: "角色#技能#等级",
    skill_less_than: "角色#技能#等级",
    zhoumu_greater_than: "周目数字",
    in_newbie_task: "无需填写",
  }[type] || "条件参数";
}

function matchesMapSearch(record, query) {
  if (!query) {
    return true;
  }
  const locationText = (record.locations || []).map((location) => [
    location.id,
    location.name,
    location.description,
    ...(location.events || []).flatMap((event) => [
      event.type,
      event.targetId,
      event.description,
      ...(event.conditions || []).map((condition) => `${condition.type}:${condition.value}`),
    ]),
  ].filter(Boolean).join(" ")).join(" ");
  const haystack = [
    record.id,
    record.name,
    record.description,
    record.picture,
    ...(record.musics || []),
    locationText,
  ].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(query);
}

function matchesMapFilter(record, filter) {
  const stats = getMapStats(record);
  switch (filter) {
    case "large":
      return isLargeMap(record);
    case "small":
      return !isLargeMap(record);
    case "story":
      return stats.storyEvents > 0;
    case "issues":
      return stats.issues.length > 0;
    case "all":
    default:
      return true;
  }
}

function isShopFile() {
  return state.currentPath === "shops.json";
}

function renderShopFormView() {
  if (!SHOP_PRODUCT_FILTERS.some((filter) => filter.value === state.formFilter)) {
    state.formFilter = "all";
  }

  const recordPanel = document.createElement("aside");
  recordPanel.className = "record-panel character-record-panel shop-record-panel";

  const recordHeader = document.createElement("div");
  recordHeader.className = "record-panel-header";
  const headerTitle = document.createElement("div");
  headerTitle.className = "record-panel-title";
  headerTitle.textContent = "商店";
  const headerSubtitle = document.createElement("div");
  headerSubtitle.className = "record-panel-subtitle";
  recordHeader.append(headerTitle, headerSubtitle);

  const recordSearch = document.createElement("input");
  recordSearch.className = "record-search";
  recordSearch.type = "search";
  recordSearch.placeholder = "搜索商店 id、名称、商品";
  recordSearch.value = state.formSearch;
  bindImeSafeInput(recordSearch, (value) => {
    state.formSearch = value;
    renderShopRecordCards(recordList, headerSubtitle);
  });

  const filterRow = document.createElement("div");
  filterRow.className = "character-filter-row";
  for (const filter of SHOP_PRODUCT_FILTERS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "character-filter-button";
    button.classList.toggle("active", state.formFilter === filter.value);
    button.textContent = filter.label;
    button.addEventListener("click", () => {
      state.formFilter = filter.value;
      renderFormView();
    });
    filterRow.appendChild(button);
  }

  const recordList = document.createElement("div");
  recordList.className = "record-list";
  renderShopRecordCards(recordList, headerSubtitle);

  recordPanel.append(recordHeader, recordSearch, filterRow, recordList);

  const detail = document.createElement("section");
  detail.className = "form-detail character-form-detail shop-form-detail";
  renderShopDetail(detail);

  elements.formView.append(recordPanel, detail);
}

function renderShopRecordCards(parent, subtitleNode) {
  parent.replaceChildren();
  const query = state.formSearch.trim().toLowerCase();
  let visibleCount = 0;

  state.formRecords.forEach((record, index) => {
    ensureShopShape(record);
    if (!matchesShopSearch(record, query) || !matchesShopFilter(record, state.formFilter)) {
      return;
    }

    visibleCount += 1;
    const card = document.createElement("button");
    card.type = "button";
    card.className = "record-card character-record-card shop-record-card";
    card.dataset.recordIndex = String(index);
    card.classList.toggle("active", index === state.selectedRecordIndex);
    card.addEventListener("click", () => {
      selectFormRecord(index);
    });

    const stats = getShopRecordStats(record);
    const text = document.createElement("div");
    text.className = "character-record-text";

    const titleRow = document.createElement("div");
    titleRow.className = "character-record-title-row";
    const title = document.createElement("div");
    title.className = "record-title";
    title.textContent = record.name || record.id || `#${index + 1}`;
    const badge = document.createElement("span");
    badge.className = "character-role-badge shop-badge";
    badge.textContent = `${stats.effectiveProducts}/${stats.products}`;
    titleRow.append(title, badge);

    const subtitle = document.createElement("div");
    subtitle.className = "record-subtitle";
    subtitle.textContent = record.id || `#${index + 1}`;

    const meta = document.createElement("div");
    meta.className = "character-record-meta";
    meta.textContent = [
      `${stats.products} 商品`,
      `${stats.limitedProducts} 限购`,
      `${stats.premiumProducts} 元宝价`,
      stats.ignoredProducts > 0 ? `${stats.ignoredProducts} 兼容忽略` : "无忽略",
      stats.missingProducts > 0 ? `${stats.missingProducts} 缺引用` : "引用正常",
    ].join(" · ");

    text.append(titleRow, subtitle, meta);
    card.append(createRecordThumb(record), text);
    parent.appendChild(card);
  });

  subtitleNode.textContent = `${visibleCount} / ${state.formRecords.length} 条`;

  if (visibleCount === 0) {
    const empty = document.createElement("div");
    empty.className = "record-empty";
    empty.textContent = "没有匹配的商店";
    parent.appendChild(empty);
  }
}

function renderShopDetail(parent) {
  const record = state.formRecords[state.selectedRecordIndex];
  if (!record) {
    parent.innerHTML = `<div class="form-error">未选择商店。</div>`;
    return;
  }

  ensureShopShape(record);
  const stats = getShopRecordStats(record);

  const shell = document.createElement("div");
  shell.className = "character-detail-shell shop-detail-shell";

  const summaryCard = document.createElement("section");
  summaryCard.className = "character-summary-card shop-summary-card";
  const background = createShopSummaryBackground(record);
  const content = document.createElement("div");
  content.className = "character-summary-content";

  const titleRow = document.createElement("div");
  titleRow.className = "character-summary-title-row";
  const titleGroup = document.createElement("div");
  const title = document.createElement("div");
  title.className = "form-detail-title";
  title.textContent = record.name || record.id || "未命名商店";
  const subtitle = document.createElement("div");
  subtitle.className = "form-detail-subtitle";
  subtitle.textContent = record.id || `#${state.selectedRecordIndex + 1}`;
  titleGroup.append(title, subtitle);
  const actions = document.createElement("div");
  actions.className = "record-actions";
  actions.append(
    createActionButton("新增", addRecord),
    createActionButton("复制", duplicateRecord),
    createActionButton("删除", deleteRecord)
  );
  titleRow.append(titleGroup, actions);

  const badgeRow = document.createElement("div");
  badgeRow.className = "character-summary-badges";
  badgeRow.append(
    createPill(`商品 ${stats.products}`),
    createPill(`可交易 ${stats.effectiveProducts}`, "ok"),
    createPill(`限购 ${stats.limitedProducts}`),
    createPill(`元宝价 ${stats.premiumProducts}`),
    createPill(stats.ignoredProducts > 0 ? `兼容忽略 ${stats.ignoredProducts}` : "无兼容忽略", stats.ignoredProducts > 0 ? "warn" : "ok"),
    createPill(stats.missingProducts > 0 ? `缺引用 ${stats.missingProducts}` : "引用正常", stats.missingProducts > 0 ? "warn" : "ok")
  );

  content.append(titleRow, badgeRow);
  summaryCard.append(background, content);
  shell.appendChild(summaryCard);

  const intro = document.createElement("div");
  intro.className = "form-summary character-form-summary";
  intro.textContent = "这里只编辑 shops.json 已支持的数据字段；标为兼容忽略的元宝和残章条目会保留在 JSON 中，但当前游戏商店界面不会展示或交易。";
  shell.appendChild(intro);

  const basicSection = createCharacterSection("基础信息", "Basic");
  const basicGrid = document.createElement("div");
  basicGrid.className = "character-form-grid";
  basicGrid.append(
    createCharacterTextField(record, "商店ID", "id", {
      placeholder: "例如：洛阳.商店",
      rerenderOnChange: true,
    }),
    createCharacterTextField(record, "显示名", "name", {
      placeholder: "例如：洛阳.商店",
      rerenderOnChange: true,
    }),
    createShopResourceField(record, "背景资源", "background", "场景"),
    createShopResourceField(record, "音乐资源", "music", "音乐")
  );
  basicSection.appendChild(basicGrid);
  shell.appendChild(basicSection);

  shell.appendChild(createShopProductSection(record));
  shell.appendChild(createShopAdvancedJsonSection(record));
  parent.appendChild(shell);
}

function createShopSummaryBackground(record) {
  const box = document.createElement("div");
  box.className = "character-summary-portrait shop-summary-background";
  const assetPath = resolveAssetPath(record.background);
  if (assetPath && isImage(assetPath.toLowerCase())) {
    const image = document.createElement("img");
    image.src = `/api/assets/file?path=${encodeURIComponent(assetPath)}`;
    image.alt = record.name || record.id || "商店背景";
    box.appendChild(image);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "character-summary-portrait-placeholder";
    placeholder.textContent = "商店";
    box.appendChild(placeholder);
  }
  return box;
}

function createShopResourceField(record, labelCn, key, group) {
  const field = createCharacterFieldShell(labelCn, key, true);
  field.classList.add("shop-resource-field");
  const input = document.createElement("input");
  input.type = "text";
  input.value = record[key] == null ? "" : String(record[key]);
  input.placeholder = group === "音乐" ? "例如：音乐.城市3" : "例如：场景.商店";
  input.setAttribute("list", ensureResourceIdDatalist(group));
  input.addEventListener("input", () => {
    updateRecordField(record, key, input.value.trim() || null);
  });
  input.addEventListener("change", () => renderFormView());
  field.appendChild(input);

  const info = getShopResourceInfo(record, key, group);
  field.appendChild(createShopResourcePreview(info));

  const actions = document.createElement("div");
  actions.className = "shop-resource-actions";
  const pickerButton = document.createElement("button");
  pickerButton.type = "button";
  pickerButton.textContent = "选择/注册";
  pickerButton.addEventListener("click", () => openShopResourcePicker(key));

  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.textContent = "清空";
  clearButton.disabled = !info.resourceId;
  clearButton.addEventListener("click", () => {
    updateRecordField(record, key, null, { rerender: true });
  });
  actions.append(pickerButton, clearButton);
  field.appendChild(actions);
  return field;
}

function createShopResourcePreview(info) {
  const preview = document.createElement("div");
  preview.className = `shop-resource-preview ${info.status}`;
  if (info.previewPath && isImage(info.previewPath.toLowerCase())) {
    const image = document.createElement("img");
    image.src = `/api/assets/file?path=${encodeURIComponent(info.previewPath)}`;
    image.alt = info.resourceId || "商店资源";
    preview.appendChild(image);
  } else if (info.previewPath && isAudio(info.previewPath.toLowerCase())) {
    const audio = document.createElement("audio");
    audio.controls = true;
    audio.src = `/api/assets/file?path=${encodeURIComponent(info.previewPath)}`;
    preview.appendChild(audio);
  }

  const text = document.createElement("div");
  text.className = "shop-resource-preview-text";
  text.textContent = info.message;
  preview.appendChild(text);
  return preview;
}

function getShopResourceInfo(record, key, group) {
  const resourceId = typeof record?.[key] === "string" ? record[key].trim() : "";
  const resource = resourceId ? state.contentIndex.resourcesById.get(resourceId) : null;
  const previewPath = resource ? resolveResourceAssetPath(resource) : "";
  const expectedKind = group === "音乐" ? "audio" : "image";
  const status = !resourceId
    ? "empty"
    : !resource
      ? "missing"
      : !previewPath
        ? "broken"
        : "ok";
  let message = "未设置资源";
  if (status === "missing") {
    message = `resources.json 中不存在：${resourceId}`;
  } else if (status === "broken") {
    message = `资源存在，但找不到${expectedKind === "audio" ? "音频" : "图片"}文件`;
  } else if (status === "ok") {
    message = `${resourceId} · ${resource.value || ""}`;
  }

  return {
    resourceId,
    resource,
    previewPath,
    group,
    key,
    status,
    message,
  };
}

function createShopProductSection(record) {
  const section = createCharacterSection("商品清单", "Products");
  const toolbar = document.createElement("div");
  toolbar.className = "shop-product-toolbar";
  const note = document.createElement("div");
  note.className = "static-tool-note";
  note.textContent = "价格留空时使用物品基础价；purchaseLimit 留空表示不限购，0 表示售罄展示。";
  const addButton = createActionButton("新增商品", () => addShopProduct(record));
  toolbar.append(note, addButton);

  const list = document.createElement("div");
  list.className = "item-array-list shop-product-list";
  const products = record.products.filter((product) => matchesShopProductFilter(product, state.formFilter));

  products.forEach((product) => {
    const productIndex = record.products.indexOf(product);
    list.appendChild(createShopProductCard(record, product, productIndex));
  });

  if (products.length === 0) {
    const empty = document.createElement("div");
    empty.className = "record-empty";
    empty.textContent = "当前筛选下没有商品";
    list.appendChild(empty);
  }

  section.append(toolbar, list);
  return section;
}

function createShopProductCard(record, product, productIndex) {
  ensureShopProductShape(product);
  const info = getShopProductInfo(product);
  const card = document.createElement("article");
  card.className = `item-array-card shop-product-card ${info.severity}`;

  const header = document.createElement("div");
  header.className = "item-array-card-header shop-product-card-header";
  const title = document.createElement("div");
  title.className = "item-array-card-title";
  title.textContent = `${productIndex + 1}. ${getShopProductTitle(product, info)}`;
  const actions = document.createElement("div");
  actions.className = "record-actions";
  actions.append(
    createActionButton("上移", () => moveShopProduct(record, productIndex, -1)),
    createActionButton("下移", () => moveShopProduct(record, productIndex, 1)),
    createActionButton("复制", () => duplicateShopProduct(record, productIndex)),
    createActionButton("删除", () => deleteShopProduct(record, productIndex))
  );
  header.append(title, actions);

  const meta = document.createElement("div");
  meta.className = "shop-product-meta";
  meta.append(
    createPill(info.typeLabel),
    createPill(info.priceText, info.priceTone),
    createPill(info.limitText),
    createPill(info.statusText, info.statusTone)
  );

  const body = document.createElement("div");
  body.className = "item-array-card-body";
  const grid = document.createElement("div");
  grid.className = "item-array-grid shop-product-grid";
  grid.append(
    createShopProductContentField(product),
    createNullableShopNumberField(product, "限购", "purchaseLimit", { placeholder: "空 = 不限购", min: 0 }),
    createNullableShopNumberField(product, "银两价", "price", { placeholder: "空 = 物品基础价", min: 0 }),
    createNullableShopNumberField(product, "元宝价", "premiumPrice", { placeholder: "空 = 不支持元宝价", min: 0 })
  );
  body.append(grid);

  if (info.message) {
    const message = document.createElement("div");
    message.className = `shop-product-message ${info.severity}`;
    message.textContent = info.message;
    body.appendChild(message);
  }

  card.append(header, meta, body);
  return card;
}

function createShopProductContentField(product) {
  const field = createCharacterFieldShell("商品ID", "contentId", true);
  const input = document.createElement("input");
  input.type = "text";
  input.value = product.contentId == null ? "" : String(product.contentId);
  input.placeholder = "选择 items.json 中的物品 id";
  input.setAttribute("list", ensureShopProductContentDatalist());
  input.addEventListener("input", () => {
    product.contentId = input.value;
    syncFormToEditor();
  });
  input.addEventListener("change", () => renderFormView());
  field.appendChild(input);
  return field;
}

function createNullableShopNumberField(product, labelCn, key, options = {}) {
  const field = createCharacterFieldShell(labelCn, key);
  const input = document.createElement("input");
  input.type = "number";
  input.value = Number.isFinite(product[key]) ? String(product[key]) : "";
  input.placeholder = options.placeholder || "";
  if (Number.isFinite(options.min)) {
    input.min = String(options.min);
  }
  input.addEventListener("input", () => {
    const text = input.value.trim();
    product[key] = text ? parseNumberInputValue(text, 0) : null;
    syncFormToEditor();
  });
  input.addEventListener("change", () => renderFormView());
  field.appendChild(input);
  return field;
}

function addShopProduct(record) {
  record.products.push({
    contentId: "",
    purchaseLimit: null,
    price: null,
    premiumPrice: null,
  });
  syncFormToEditor();
  renderFormView();
}

function duplicateShopProduct(record, productIndex) {
  const source = record.products[productIndex];
  if (!source) {
    return;
  }

  record.products.splice(productIndex + 1, 0, structuredCloneCompat(source));
  syncFormToEditor();
  renderFormView();
}

function deleteShopProduct(record, productIndex) {
  const source = record.products[productIndex];
  if (!source) {
    return;
  }

  const title = getShopProductTitle(source, getShopProductInfo(source));
  if (!confirmAction(`确认删除商品「${title}」？`)) {
    return;
  }

  record.products.splice(productIndex, 1);
  syncFormToEditor();
  renderFormView();
}

function moveShopProduct(record, productIndex, delta) {
  const nextIndex = productIndex + delta;
  if (nextIndex < 0 || nextIndex >= record.products.length) {
    return;
  }

  const [product] = record.products.splice(productIndex, 1);
  record.products.splice(nextIndex, 0, product);
  syncFormToEditor();
  renderFormView();
}

function createShopAdvancedJsonSection(record) {
  const section = createCharacterSection("高级 JSON", "Advanced");
  const details = document.createElement("details");
  details.className = "character-advanced-json";
  const summary = document.createElement("summary");
  summary.textContent = "展开原始商店 JSON";
  const textarea = document.createElement("textarea");
  textarea.value = JSON.stringify(record, null, 2);
  textarea.addEventListener("change", () => {
    try {
      const parsed = JSON.parse(textarea.value);
      state.formRecords[state.selectedRecordIndex] = parsed;
      syncFormToEditor();
      renderFormView();
    } catch (error) {
      textarea.setCustomValidity(error instanceof Error ? error.message : String(error));
      textarea.reportValidity();
    }
  });
  details.append(summary, textarea);
  section.appendChild(details);
  return section;
}

function matchesShopSearch(record, query) {
  if (!query) {
    return true;
  }

  const productText = Array.isArray(record.products)
    ? record.products.map((product) => {
      const item = state.contentIndex.itemsById.get(String(product?.contentId || ""));
      return `${product?.contentId || ""} ${item?.name || ""} ${item?.type || ""}`;
    }).join(" ")
    : "";
  const haystack = [
    record.id,
    record.name,
    record.music,
    record.background,
    productText,
  ].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(query);
}

function matchesShopFilter(record, filter) {
  return filter === "all" || record.products.some((product) => matchesShopProductFilter(product, filter));
}

function matchesShopProductFilter(product, filter) {
  const info = getShopProductInfo(product);
  switch (filter) {
    case "limited":
      return Number.isFinite(product?.purchaseLimit);
    case "premium":
      return Number.isFinite(product?.premiumPrice);
    case "fallbackPrice":
      return !Number.isFinite(product?.price) && !Number.isFinite(product?.premiumPrice) && Boolean(info.item);
    case "ignored":
      return info.ignored;
    case "missing":
      return info.missing;
    case "all":
    default:
      return true;
  }
}

function getShopRecordStats(record) {
  const products = Array.isArray(record.products) ? record.products : [];
  let limitedProducts = 0;
  let premiumProducts = 0;
  let ignoredProducts = 0;
  let missingProducts = 0;

  for (const product of products) {
    const info = getShopProductInfo(product);
    if (Number.isFinite(product?.purchaseLimit)) {
      limitedProducts += 1;
    }
    if (Number.isFinite(product?.premiumPrice)) {
      premiumProducts += 1;
    }
    if (info.ignored) {
      ignoredProducts += 1;
    }
    if (info.missing) {
      missingProducts += 1;
    }
  }

  return {
    products: products.length,
    effectiveProducts: Math.max(0, products.length - ignoredProducts - missingProducts),
    limitedProducts,
    premiumProducts,
    ignoredProducts,
    missingProducts,
  };
}

function getShopProductInfo(product) {
  const contentId = String(product?.contentId || "").trim();
  const ignored = isIgnoredShopProductContentId(contentId);
  const item = state.contentIndex.itemsById.get(contentId) || null;
  const missing = Boolean(contentId) && !ignored && !item;
  const typeLabel = item ? getItemTypeShortLabel(item.type) : ignored ? "兼容条目" : "未选择物品";

  let priceText = "无价格";
  let priceTone = "warn";
  if (Number.isFinite(product?.price)) {
    priceText = `银两 ${product.price}`;
    priceTone = "";
  } else if (Number.isFinite(product?.premiumPrice)) {
    priceText = `元宝 ${product.premiumPrice}`;
    priceTone = "";
  } else if (item) {
    priceText = `基础价 ${getDisplayNumber(item.price, 0)}`;
    priceTone = "";
  }

  const limitText = Number.isFinite(product?.purchaseLimit)
    ? `限购 ${product.purchaseLimit}`
    : "不限购";

  let statusText = "可交易";
  let statusTone = "ok";
  let severity = "ok";
  let message = "";

  if (!contentId) {
    statusText = "未选择";
    statusTone = "warn";
    severity = "warn";
    message = "请填写 contentId。";
  } else if (ignored) {
    statusText = "运行时忽略";
    statusTone = "warn";
    severity = "warn";
    message = "当前游戏商店界面会保留但过滤此兼容条目，不会展示或交易。";
  } else if (missing) {
    statusText = "引用缺失";
    statusTone = "warn";
    severity = "warn";
    message = "items.json 中找不到这个商品 id，内容校验会失败。";
  } else if (Number.isFinite(product?.price) && Number.isFinite(product?.premiumPrice)) {
    statusText = "双货币";
    statusTone = "warn";
    severity = "warn";
    message = "当前 UI 默认优先显示银两价；如要元宝价商品，建议清空 price。";
  }

  return {
    contentId,
    item,
    ignored,
    missing,
    typeLabel,
    priceText,
    priceTone,
    limitText,
    statusText,
    statusTone,
    severity,
    message,
  };
}

function getShopProductTitle(product, info) {
  if (info.item) {
    return `${info.item.name || info.item.id}（${info.item.id}）`;
  }

  return info.contentId || "未选择商品";
}

function isIgnoredShopProductContentId(contentId) {
  return contentId === "元宝" || contentId.endsWith("残章");
}

function ensureShopShape(record) {
  if (!Array.isArray(record.products)) {
    record.products = [];
  }

  record.products = record.products.map((product) => (
    product && typeof product === "object" && !Array.isArray(product)
      ? product
      : {
        contentId: "",
        purchaseLimit: null,
        price: null,
        premiumPrice: null,
      }
  ));

  if (typeof record.id !== "string") {
    record.id = "";
  }

  if (typeof record.name !== "string") {
    record.name = record.id || "";
  }
}

function ensureShopProductShape(product) {
  if (typeof product.contentId !== "string") {
    product.contentId = "";
  }

  for (const key of ["purchaseLimit", "price", "premiumPrice"]) {
    if (!Number.isFinite(product[key])) {
      product[key] = null;
    }
  }
}

function ensureShopProductContentDatalist() {
  const id = "shopProductContentOptions";
  const existing = document.getElementById(id);
  if (existing) {
    existing.remove();
  }

  const datalist = document.createElement("datalist");
  datalist.id = id;
  const options = new Map();

  for (const item of Array.from(state.contentIndex.itemsById.values())) {
    if (typeof item.id !== "string") {
      continue;
    }

    options.set(item.id, `${item.name || item.id} · ${getItemTypeShortLabel(item.type)} · 基础价 ${getDisplayNumber(item.price, 0)}`);
  }

  for (const shop of state.formRecords) {
    for (const product of Array.isArray(shop.products) ? shop.products : []) {
      const contentId = typeof product?.contentId === "string" ? product.contentId.trim() : "";
      if (contentId && !options.has(contentId)) {
        options.set(contentId, isIgnoredShopProductContentId(contentId) ? "兼容保留，运行时忽略" : "当前 items.json 中不存在");
      }
    }
  }

  if (!options.has("元宝")) {
    options.set("元宝", "兼容保留，运行时忽略");
  }

  for (const [value, label] of Array.from(options.entries()).sort((left, right) => left[0].localeCompare(right[0], "zh-Hans-CN"))) {
    const option = document.createElement("option");
    option.value = value;
    option.label = label;
    datalist.appendChild(option);
  }

  document.body.appendChild(datalist);
  return id;
}

function isItemFile() {
  return state.currentPath === "items.json";
}

function renderItemFormView() {
  if (!getItemFilters().some((filter) => filter.value === state.formFilter)) {
    state.formFilter = "all";
  }

  if (!["requirements", "effects", "affixes"].includes(state.itemTab)) {
    state.itemTab = "requirements";
  }

  const recordPanel = document.createElement("aside");
  recordPanel.className = "record-panel character-record-panel";

  const recordHeader = document.createElement("div");
  recordHeader.className = "record-panel-header";
  const headerTitle = document.createElement("div");
  headerTitle.className = "record-panel-title";
  headerTitle.textContent = "物品";
  const headerSubtitle = document.createElement("div");
  headerSubtitle.className = "record-panel-subtitle";
  recordHeader.append(headerTitle, headerSubtitle);

  const recordSearch = document.createElement("input");
  recordSearch.className = "record-search";
  recordSearch.type = "search";
  recordSearch.placeholder = "搜索 id、名称、图片、类型、分类";
  recordSearch.value = state.formSearch;
  bindImeSafeInput(recordSearch, (value) => {
    state.formSearch = value;
    renderItemRecordCards(recordList, headerSubtitle);
  });

  const filterRow = document.createElement("div");
  filterRow.className = "character-filter-row";
  for (const filter of getItemFilters()) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "character-filter-button";
    button.classList.toggle("active", state.formFilter === filter.value);
    button.textContent = filter.label;
    button.addEventListener("click", () => {
      state.formFilter = filter.value;
      renderFormView();
    });
    filterRow.appendChild(button);
  }

  const recordList = document.createElement("div");
  recordList.className = "record-list";
  renderItemRecordCards(recordList, headerSubtitle);

  recordPanel.append(recordHeader, recordSearch, filterRow, recordList);

  const detail = document.createElement("section");
  detail.className = "form-detail character-form-detail";
  renderItemDetail(detail);

  elements.formView.append(recordPanel, detail);
}

function getItemFilters() {
  return [
    { value: "all", label: "全部" },
    { value: "consumable", label: "消耗/强化" },
    { value: "equipment", label: "装备" },
    { value: "books", label: "秘籍" },
    { value: "talentBook", label: "天赋书" },
    { value: "quest", label: "剧情物品" },
    { value: "missingPicture", label: "缺图片" },
    { value: "incomplete", label: "配置待补" },
  ];
}

function matchesItemSearch(record, query) {
  if (!query) {
    return true;
  }

  const haystack = [
    record.id,
    record.name,
    record.picture,
    record.type,
    record.category,
    record.slotType,
    record.description,
    JSON.stringify(record),
  ].filter(Boolean).join(" ").toLowerCase();

  return haystack.includes(query);
}

function matchesItemFilter(record, filter) {
  const pictureInfo = getItemPictureInfo(record);
  const issues = getItemValidationIssues(record);

  switch (filter) {
    case "consumable":
      return ["consumable", "booster", "utility"].includes(record.type);
    case "equipment":
      return record.type === "equipment";
    case "books":
      return ["skill_book", "special_skill_book"].includes(record.type);
    case "talentBook":
      return record.type === "talent_book";
    case "quest":
      return record.type === "quest_item";
    case "missingPicture":
      return !pictureInfo.resourceExists || !pictureInfo.assetExists;
    case "incomplete":
      return issues.length > 0;
    case "all":
    default:
      return true;
  }
}

function renderItemRecordCards(parent, subtitleNode) {
  parent.replaceChildren();
  const query = state.formSearch.trim().toLowerCase();
  let visibleCount = 0;

  state.formRecords.forEach((record, index) => {
    if (!matchesItemSearch(record, query) || !matchesItemFilter(record, state.formFilter)) {
      return;
    }

    visibleCount += 1;
    const card = document.createElement("button");
    card.type = "button";
    card.className = "record-card character-record-card item-record-card";
    card.dataset.recordIndex = String(index);
    card.classList.toggle("active", index === state.selectedRecordIndex);
    card.addEventListener("click", () => {
      selectFormRecord(index);
    });

    const pictureInfo = getItemPictureInfo(record);
    const issues = getItemValidationIssues(record);

    const text = document.createElement("div");
    text.className = "character-record-text";

    const titleRow = document.createElement("div");
    titleRow.className = "character-record-title-row";
    const title = document.createElement("div");
    title.className = "record-title";
    title.textContent = typeof record.name === "string" && record.name.trim() ? record.name.trim() : (record.id || `#${index + 1}`);
    const badge = document.createElement("span");
    badge.className = `character-role-badge item-type-badge ${record.type || "unknown"}`;
    badge.textContent = getItemTypeShortLabel(record.type);
    titleRow.append(title, badge);

    const subtitle = document.createElement("div");
    subtitle.className = "record-subtitle";
    subtitle.textContent = typeof record.id === "string" && record.id.trim() ? record.id.trim() : `#${index + 1}`;

    const meta = document.createElement("div");
    meta.className = "character-record-meta";
    meta.textContent = [
      `Lv.${getDisplayNumber(record.level, 1)}`,
      getItemCategoryLabel(record.category),
      pictureInfo.assetExists ? "有图片" : pictureInfo.pictureId ? "缺图片" : "无 picture",
      issues.length > 0 ? `${issues.length} 项待处理` : "配置正常",
    ].join(" · ");

    text.append(titleRow, subtitle, meta);
    card.append(createRecordThumb(record), text);
    parent.appendChild(card);
  });

  subtitleNode.textContent = `${visibleCount} / ${state.formRecords.length} 条`;

  if (visibleCount === 0) {
    const empty = document.createElement("div");
    empty.className = "record-empty";
    empty.textContent = "没有匹配的物品";
    parent.appendChild(empty);
  }
}

function renderItemDetail(parent) {
  const record = state.formRecords[state.selectedRecordIndex];
  if (!record) {
    parent.innerHTML = `<div class="form-error">未选择物品。</div>`;
    return;
  }

  ensureItemShape(record);
  const pictureInfo = getItemPictureInfo(record);
  const issues = getItemValidationIssues(record);

  const shell = document.createElement("div");
  shell.className = "character-detail-shell item-detail-shell";

  const summaryCard = document.createElement("section");
  summaryCard.className = "character-summary-card item-summary-card";

  const picture = createItemSummaryPicture(record, pictureInfo);
  const content = document.createElement("div");
  content.className = "character-summary-content";

  const titleRow = document.createElement("div");
  titleRow.className = "character-summary-title-row";
  const titleGroup = document.createElement("div");
  const title = document.createElement("div");
  title.className = "form-detail-title";
  title.textContent = typeof record.name === "string" && record.name.trim() ? record.name.trim() : (record.id || "未命名物品");
  const subtitle = document.createElement("div");
  subtitle.className = "form-detail-subtitle";
  subtitle.textContent = typeof record.id === "string" && record.id.trim() ? record.id.trim() : `#${state.selectedRecordIndex + 1}`;
  titleGroup.append(title, subtitle);
  const actions = document.createElement("div");
  actions.className = "record-actions";
  actions.append(
    createActionButton("新增", addRecord),
    createActionButton("复制", duplicateRecord),
    createActionButton("删除", deleteRecord)
  );
  titleRow.append(titleGroup, actions);

  const badgeRow = document.createElement("div");
  badgeRow.className = "character-summary-badges";
  badgeRow.append(
    createPill(`类型 ${getItemTypeShortLabel(record.type)}`),
    createPill(`分类 ${getItemCategoryLabel(record.category)}`),
    createPill(`等级 Lv.${getDisplayNumber(record.level, 1)}`),
    createPill(`价格 ${getDisplayNumber(record.price, 0)}`),
    createPill(record.canDrop === true ? "可掉落" : "不可掉落", record.canDrop === true ? "ok" : ""),
    createPill(issues.length > 0 ? `待处理 ${issues.length}` : "配置正常", issues.length > 0 ? "warn" : "ok")
  );

  content.append(titleRow, badgeRow);
  summaryCard.append(picture, content);
  shell.appendChild(summaryCard);

  if (issues.length > 0) {
    shell.appendChild(createCharacterIssueSummary(issues));
  }

  const intro = document.createElement("div");
  intro.className = "form-summary character-form-summary";
  intro.textContent = "底层仍保存原 JSON；这里把物品常用字段整理成更容易理解的专用界面。复杂结构仍可在“高级 JSON”里直接调整。";
  shell.appendChild(intro);

  const basicSection = createCharacterSection("基础信息", "Basic");
  const basicGrid = document.createElement("div");
  basicGrid.className = "character-form-grid";
  basicGrid.append(
    createItemCategoryField(record),
    createItemTypeField(record),
    createCharacterTextField(record, "物品ID", "id", {
      placeholder: "例如：止血草",
      rerenderOnChange: true,
    }),
    createCharacterTextField(record, "显示名", "name", {
      placeholder: "例如：止血草",
      rerenderOnChange: true,
    }),
    createCharacterNumberField(record, "等级", "level", {
      min: 1,
      fallback: 1,
      rerenderOnChange: true,
    }),
    createCharacterNumberField(record, "价格", "price", {
      fallback: 0,
      rerenderOnChange: true,
    }),
    createCharacterNumberField(record, "冷却", "cooldown", {
      min: 0,
      fallback: 0,
      rerenderOnChange: true,
    }),
    createCharacterCheckboxField(record, "可掉落", "canDrop", "canDrop"),
    createCharacterTextField(record, "图片资源", "picture", {
      list: ensureResourceIdDatalist("物品"),
      placeholder: "例如：物品.止血草",
      rerenderOnChange: true,
    }),
    createItemSlotTypeField(record),
    createItemTextareaField(record, "描述", "description")
  );
  basicSection.appendChild(basicGrid);
  shell.appendChild(basicSection);

  const pictureSection = createCharacterSection("图片", "Picture");
  pictureSection.appendChild(createItemPictureSection(record, pictureInfo));
  shell.appendChild(pictureSection);

  const configSection = createCharacterSection("使用与配置", "Logic");
  configSection.appendChild(createItemTabBar(record));
  configSection.appendChild(createItemTabContent(record));
  shell.appendChild(configSection);

  shell.appendChild(createItemAdvancedJsonSection(record));
  parent.appendChild(shell);
}

function getItemTypeLabel(type) {
  return ITEM_TYPE_CHOICES.find((choice) => choice.value === type)?.label || `${type || "unknown"} 未知类型`;
}

function getItemTypeShortLabel(type) {
  const label = getItemTypeLabel(type);
  return label.split(" ").slice(1).join(" ") || label;
}

function getItemCategoryLabel(category) {
  return ITEM_CATEGORY_CHOICES.find((choice) => choice.value === category)?.label.split(" ").slice(1).join(" ") || (category || "未分类");
}

function createItemSummaryPicture(record, pictureInfo) {
  const box = document.createElement("div");
  box.className = "character-summary-portrait item-summary-picture";
  if (pictureInfo.previewPath) {
    const image = document.createElement("img");
    image.src = `/api/assets/file?path=${encodeURIComponent(pictureInfo.previewPath)}`;
    image.alt = typeof record.name === "string" ? record.name : (record.id || "物品图片");
    box.appendChild(image);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "character-summary-portrait-placeholder";
    placeholder.textContent = "无图片";
    box.appendChild(placeholder);
  }
  return box;
}

function createItemTextareaField(record, labelCn, key) {
  const field = createCharacterFieldShell(labelCn, key, true);
  const textarea = document.createElement("textarea");
  textarea.value = record[key] == null ? "" : String(record[key]);
  textarea.rows = 4;
  textarea.addEventListener("input", () => updateRecordField(record, key, textarea.value));
  field.appendChild(textarea);
  return field;
}

function createItemCategoryField(record) {
  return createCharacterSelectField(record, "物品分类", "category", ITEM_CATEGORY_CHOICES);
}

function createItemTypeField(record) {
  const field = createCharacterFieldShell("物品类型", "type");
  const select = document.createElement("select");
  for (const choice of ITEM_TYPE_CHOICES) {
    const option = document.createElement("option");
    option.value = choice.value;
    option.textContent = choice.label;
    option.selected = String(record.type ?? "") === choice.value;
    select.appendChild(option);
  }

  select.addEventListener("change", () => {
    applyItemTypeDefaults(record, select.value);
    syncFormToEditor();
    renderFormView();
  });

  field.appendChild(select);
  return field;
}

function createItemSlotTypeField(record) {
  const field = createCharacterFieldShell("装备部位", "slotType");
  const select = document.createElement("select");
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = record.type === "equipment" ? "请选择部位" : "仅装备类型需要";
  placeholder.selected = !record.slotType;
  select.appendChild(placeholder);

  for (const choice of ITEM_SLOT_TYPE_CHOICES) {
    const option = document.createElement("option");
    option.value = choice.value;
    option.textContent = choice.label;
    option.selected = String(record.slotType ?? "") === choice.value;
    select.appendChild(option);
  }

  select.disabled = record.type !== "equipment";
  select.addEventListener("change", () => {
    updateRecordField(record, "slotType", select.value || null, { rerender: true });
  });

  field.appendChild(select);
  return field;
}

function applyItemTypeDefaults(record, type) {
  record.type = type;
  ensureItemShape(record);

  if (type === "equipment") {
    record.category = "equipment";
    if (!record.slotType) {
      record.slotType = "weapon";
    }
  } else {
    if (record.category === "equipment") {
      record.category = "normal";
    }
    if (!record.useEffects) {
      record.useEffects = [];
    }
  }
}

function ensureItemShape(record) {
  if (!Array.isArray(record.requirements)) {
    record.requirements = [];
  }
  if (!Array.isArray(record.useEffects)) {
    record.useEffects = [];
  }
  if (record.type === "equipment" && !Array.isArray(record.affixes)) {
    record.affixes = [];
  }

  if (!Number.isFinite(record.level)) {
    record.level = 1;
  }
  if (!Number.isFinite(record.price)) {
    record.price = 0;
  }
  if (!Number.isFinite(record.cooldown)) {
    record.cooldown = 0;
  }
  if (typeof record.canDrop !== "boolean") {
    record.canDrop = false;
  }
  if (typeof record.description !== "string") {
    record.description = "";
  }
  if (typeof record.category !== "string" || !record.category.trim()) {
    record.category = record.type === "equipment" ? "equipment" : "normal";
  }
}

function getItemPictureInfo(record) {
  const pictureId = typeof record.picture === "string" ? record.picture.trim() : "";
  const resource = pictureId ? state.contentIndex.resourcesById.get(pictureId) : null;
  const resourceExists = Boolean(resource);
  const assetValue = typeof resource?.value === "string" ? resource.value.trim() : "";
  const assetPath = resourceExists ? resolveResourceAssetPath(resource) : "";
  const detectedAssetValue = detectItemPictureAssetValue(record.id || "", record.name || "", pictureId);
  const detectedAssetPath = detectedAssetValue ? findAssetPath(detectedAssetValue, { art: true }) : "";
  const previewPath = assetPath || detectedAssetPath || "";

  return {
    pictureId,
    resource,
    resourceExists,
    assetValue,
    assetPath,
    assetExists: Boolean(assetPath),
    detectedAssetValue,
    detectedAssetPath,
    previewPath,
  };
}

function getAssetImageInfo(path) {
  if (!path || !isImage(path.toLowerCase())) {
    return null;
  }

  const cached = state.assetImageInfo.get(path);
  if (cached) {
    return cached;
  }

  const loading = { status: "loading" };
  state.assetImageInfo.set(path, loading);
  loadImage(`/api/assets/file?path=${encodeURIComponent(path)}&v=${Date.now()}`)
    .then((image) => {
      state.assetImageInfo.set(path, {
        status: "ready",
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
      renderFormView();
    })
    .catch(() => {
      state.assetImageInfo.set(path, { status: "error" });
      renderFormView();
    });

  return loading;
}

function formatAssetImageInfo(info) {
  if (!info) {
    return "无图片";
  }

  if (info.status === "ready") {
    const suffix = info.width === 512 && info.height === 512 ? " · 标准 512" : "";
    return `${info.width} x ${info.height}${suffix}`;
  }

  if (info.status === "error") {
    return "读取失败";
  }

  return "读取中...";
}

function detectItemPictureAssetValue(id, name, pictureId = "") {
  const candidates = [];
  const strippedPictureId = pictureId.replace(/^物品\./, "");
  for (const value of [strippedPictureId, id, name, toPinyinSlug(strippedPictureId), toPinyinSlug(id), toPinyinSlug(name)]) {
    const normalized = normalizeToolSearchValue(value);
    if (!normalized) {
      continue;
    }

    candidates.push(`item/${normalized}`);
  }

  for (const candidate of candidates) {
    const found = findAssetPath(candidate, { art: true });
    if (found) {
      return normalizeToolAssetValue(found);
    }
  }

  const wanted = new Set(candidates.map((candidate) => normalizeToolSearchValue(candidate.split("/").pop() || "")));
  for (const file of state.assetFiles) {
    if (!file.path.toLowerCase().startsWith("art/item/") || !isImage(file.path.toLowerCase())) {
      continue;
    }

    const basename = normalizeToolSearchValue((file.name || file.path.split("/").pop() || "").replace(/\.[^.]+$/i, ""));
    if (wanted.has(basename)) {
      return normalizeToolAssetValue(file.path);
    }
  }

  return "";
}

function getItemValidationIssues(record) {
  const issues = [];
  const pictureInfo = getItemPictureInfo(record);

  if (!pictureInfo.pictureId) {
    issues.push(createCharacterIssue("error", "图片资源为空，请填写 picture。"));
  } else if (!pictureInfo.resourceExists) {
    issues.push(createCharacterIssue("error", `图片资源不存在：${pictureInfo.pictureId}`));
  } else if (pictureInfo.resource?.group !== "物品") {
    issues.push(createCharacterIssue("warn", `图片资源分组不是“物品”：${pictureInfo.pictureId}`));
  } else if (!pictureInfo.assetExists) {
    issues.push(createCharacterIssue("error", `物品图片不存在：${pictureInfo.assetValue || pictureInfo.pictureId}`));
  }

  if (record.type === "equipment" && record.category !== "equipment") {
    issues.push(createCharacterIssue("warn", "当前物品是 equipment，但 category 不是 equipment。"));
  }

  if (record.type !== "equipment" && record.category === "equipment") {
    issues.push(createCharacterIssue("warn", "当前物品不是 equipment，但 category 仍然是 equipment。"));
  }

  if (record.type === "equipment" && !String(record.slotType || "").trim()) {
    issues.push(createCharacterIssue("error", "装备类型物品缺少 slotType。"));
  }

  for (const [key, label] of [["level", "等级"], ["price", "价格"], ["cooldown", "冷却"]]) {
    if (!Number.isFinite(record[key])) {
      issues.push(createCharacterIssue("error", `${label} 不是数字：${key}`));
    }
  }

  appendItemRequirementIssues(issues, record.requirements);
  appendItemEffectIssues(issues, record.useEffects);
  if (record.type === "equipment") {
    appendItemAffixIssues(issues, record.affixes);
  }

  return issues;
}

function appendItemRequirementIssues(issues, requirements) {
  if (!Array.isArray(requirements)) {
    issues.push(createCharacterIssue("error", "requirements 不是数组。"));
    return;
  }

  for (const requirement of requirements) {
    if (requirement?.type === "stat") {
      if (!isKnownCharacterStatId(requirement.statId)) {
        issues.push(createCharacterIssue("error", `属性要求 statId 不存在：${requirement.statId || "空"}`));
      }
      if (!Number.isFinite(requirement.value)) {
        issues.push(createCharacterIssue("error", `属性要求数值不是数字：${requirement.statId || "stat"}`));
      }
      continue;
    }

    if (requirement?.type === "talent") {
      const talentId = typeof requirement.talentId === "string" ? requirement.talentId.trim() : "";
      if (!talentId) {
        issues.push(createCharacterIssue("error", "天赋要求缺少 talentId。"));
      } else if (!hasDefinitionOfType(talentId, "talents")) {
        issues.push(createCharacterIssue("error", `天赋要求不存在：${talentId}`, talentId, ["talents"]));
      }
      continue;
    }

    issues.push(createCharacterIssue("warn", `未识别的 requirements 类型：${requirement?.type || "空"}`));
  }
}

function appendItemEffectIssues(issues, effects) {
  if (!Array.isArray(effects)) {
    issues.push(createCharacterIssue("error", "useEffects 不是数组。"));
    return;
  }

  for (const effect of effects) {
    const effectType = effect?.type || "";
    if (effectType === "external_skill" && !hasDefinitionOfType(effect.skillId, "external-skills")) {
      issues.push(createCharacterIssue("error", `外功不存在：${effect.skillId || "空"}`, effect.skillId || "", ["external-skills"]));
      continue;
    }

    if (effectType === "internal_skill" && !hasDefinitionOfType(effect.skillId, "internal-skills")) {
      issues.push(createCharacterIssue("error", `内功不存在：${effect.skillId || "空"}`, effect.skillId || "", ["internal-skills"]));
      continue;
    }

    if (effectType === "special_skill" && !hasDefinitionOfType(effect.skillId, "special-skills")) {
      issues.push(createCharacterIssue("error", `绝技不存在：${effect.skillId || "空"}`, effect.skillId || "", ["special-skills"]));
      continue;
    }

    if (effectType === "grant_talent") {
      if (!hasDefinitionOfType(effect.talentId, "talents")) {
        issues.push(createCharacterIssue("error", `天赋不存在：${effect.talentId || "空"}`, effect.talentId || "", ["talents"]));
      }
      continue;
    }

    if (effectType === "add_buff") {
      if (!hasDefinitionOfType(effect.buffId, "buffs")) {
        issues.push(createCharacterIssue("error", `Buff 不存在：${effect.buffId || "空"}`, effect.buffId || "", ["buffs"]));
      }
      if (!Number.isFinite(effect.duration)) {
        issues.push(createCharacterIssue("error", `Buff 持续时间不是数字：${effect.buffId || "add_buff"}`));
      }
      continue;
    }

    if (effectType === "detoxify") {
      const values = Array.isArray(effect.values) ? effect.values : [];
      if (values.length !== 2 || values.some((value) => !Number.isFinite(value))) {
        issues.push(createCharacterIssue("error", "detoxify 需要两个数字 values。"));
      }
      continue;
    }

    if ([
      "add_hp",
      "add_mp",
      "add_hp_percent",
      "add_mp_percent",
      "add_maxhp",
      "add_maxmp",
      "add_rage",
    ].includes(effectType)) {
      if (!Number.isFinite(effect.value)) {
        issues.push(createCharacterIssue("error", `${effectType} 的 value 不是数字。`));
      }
      continue;
    }

    if (!ITEM_EFFECT_TYPE_CHOICES.some((choice) => choice.value === effectType)) {
      issues.push(createCharacterIssue("warn", `未识别的 useEffect 类型：${effectType || "空"}`));
    }
  }
}

function appendItemAffixIssues(issues, affixes) {
  if (!Array.isArray(affixes)) {
    issues.push(createCharacterIssue("error", "affixes 不是数组。"));
    return;
  }

  for (const affix of affixes) {
    switch (affix?.type) {
      case "stat_modifier":
        if (!ITEM_AFFIX_STAT_CHOICES.some((choice) => choice.value === affix.stat)) {
          issues.push(createCharacterIssue("error", `装备词缀属性不存在：${affix.stat || "空"}`));
        }
        if (!Number.isFinite(affix?.value?.delta)) {
          issues.push(createCharacterIssue("error", `装备词缀 delta 不是数字：${affix.stat || "stat_modifier"}`));
        }
        break;
      case "grant_talent":
        if (!hasDefinitionOfType(affix.talentId, "talents")) {
          issues.push(createCharacterIssue("error", `装备词缀天赋不存在：${affix.talentId || "空"}`, affix.talentId || "", ["talents"]));
        }
        break;
      case "skill_bonus_modifier":
        if (!hasDefinitionOfType(affix.skillId, "external-skills")) {
          issues.push(createCharacterIssue("error", `技能加成对应外功不存在：${affix.skillId || "空"}`, affix.skillId || "", ["external-skills"]));
        }
        if (!Number.isFinite(affix?.value?.delta)) {
          issues.push(createCharacterIssue("error", `技能加成 delta 不是数字：${affix.skillId || "skill_bonus_modifier"}`));
        }
        break;
      case "legend_skill_chance_modifier":
        if (!hasDefinitionOfType(affix.skillId, "legend-skills")) {
          issues.push(createCharacterIssue("error", `传奇招式不存在：${affix.skillId || "空"}`, affix.skillId || "", ["legend-skills"]));
        }
        if (!Number.isFinite(affix?.value?.delta)) {
          issues.push(createCharacterIssue("error", `传奇招式 delta 不是数字：${affix.skillId || "legend_skill_chance_modifier"}`));
        }
        break;
      case "weapon_bonus_modifier":
        if (!ITEM_WEAPON_TYPE_CHOICES.some((choice) => choice.value === affix.weaponType)) {
          issues.push(createCharacterIssue("error", `武学类别不存在：${affix.weaponType || "空"}`));
        }
        if (!Number.isFinite(affix?.value?.delta)) {
          issues.push(createCharacterIssue("error", `武学类别加成 delta 不是数字：${affix.weaponType || "weapon_bonus_modifier"}`));
        }
        break;
      case "grant_model":
        if (!String(affix.modelId || "").trim()) {
          issues.push(createCharacterIssue("error", "grant_model 缺少 modelId。"));
        }
        break;
      default:
        issues.push(createCharacterIssue("warn", `未识别的 affix 类型：${affix?.type || "空"}`));
        break;
    }
  }
}

function isKnownCharacterStatId(statId) {
  return CHARACTER_STAT_FIELDS.some((stat) => stat.key === statId);
}

function createItemPictureSection(record, pictureInfo) {
  const wrapper = document.createElement("div");
  wrapper.className = "character-portrait-section";
  const imageInfo = getAssetImageInfo(pictureInfo.previewPath);

  const preview = document.createElement("div");
  preview.className = `character-portrait-preview item-picture-preview ${pictureInfo.assetExists ? "ok" : "missing"}`;

  if (pictureInfo.previewPath) {
    const image = document.createElement("img");
    image.src = `/api/assets/file?path=${encodeURIComponent(pictureInfo.previewPath)}`;
    image.alt = pictureInfo.pictureId || "物品图片";
    preview.appendChild(image);
  } else {
    const empty = document.createElement("div");
    empty.className = "character-portrait-preview-empty";
    empty.textContent = "缺图";
    preview.appendChild(empty);
  }

  const meta = document.createElement("div");
  meta.className = "character-portrait-meta";
  meta.append(
    createCharacterMetaRow("图片资源", pictureInfo.pictureId || "未填写"),
    createCharacterMetaRow("真实图片", pictureInfo.assetPath || "未找到"),
    createCharacterMetaRow("当前尺寸", formatAssetImageInfo(imageInfo)),
    createCharacterMetaRow("自动检测路径", pictureInfo.detectedAssetValue || "未检测到"),
    createCharacterMetaRow("资源状态", pictureInfo.resourceExists ? "已存在" : "resources.json 中不存在"),
  );

  if (!pictureInfo.assetExists) {
    const warning = document.createElement("div");
    warning.className = "character-portrait-warning";
    warning.textContent = pictureInfo.pictureId
      ? `缺图提示：${pictureInfo.pictureId} 还没有可用图片。`
      : "缺图提示：当前物品还没有填写 picture。";
    meta.appendChild(warning);
  }

  const actions = document.createElement("div");
  actions.className = "character-portrait-actions";
  const uploadInput = document.createElement("input");
  uploadInput.type = "file";
  uploadInput.accept = ".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp";
  uploadInput.hidden = true;
  uploadInput.addEventListener("change", async () => {
    const [file] = Array.from(uploadInput.files || []);
    uploadInput.value = "";
    if (!file) {
      return;
    }

    uploadButton.disabled = true;
    try {
      const pictureId = getBindableItemPictureId(record);
      const result = await uploadItemImageAndBind(record, file, pictureId);
      await loadAssetFiles();
      await loadDataFiles();
      await rebuildContentIndex();
      record.picture = result.pictureId;
      syncFormToEditor();
      showValidation(result.validation.ok, `已上传并绑定：${result.pictureId} -> ${result.assetPath}`);
      renderFormView();
    } catch (error) {
      showValidation(false, error instanceof Error ? error.message : String(error));
    } finally {
      uploadButton.disabled = false;
    }
  });

  const pickerButton = document.createElement("button");
  pickerButton.type = "button";
  pickerButton.className = "primary";
  pickerButton.textContent = "从图库选择";
  pickerButton.addEventListener("click", () => {
    openItemPicturePicker(pictureInfo.previewPath);
  });

  const openButton = document.createElement("button");
  openButton.type = "button";
  openButton.textContent = "打开图片";
  openButton.disabled = !pictureInfo.previewPath;
  openButton.addEventListener("click", () => {
    if (!pictureInfo.previewPath) {
      return;
    }

    setMode("assets");
    openAssetFile(pictureInfo.previewPath);
  });

  const normalizeButton = document.createElement("button");
  normalizeButton.type = "button";
  normalizeButton.textContent = "手动规范512";
  normalizeButton.disabled = !pictureInfo.previewPath || !pictureInfo.previewPath.toLowerCase().endsWith(".png");
  normalizeButton.addEventListener("click", async () => {
    normalizeButton.disabled = true;
    try {
      await normalizePortraitAsset(pictureInfo.previewPath);
      await loadAssetFiles();
      renderFormView();
      showValidation(true, `已规范化图片：${pictureInfo.previewPath}`);
    } catch (error) {
      showValidation(false, formatNormalizePortraitError(error));
    } finally {
      normalizeButton.disabled = !pictureInfo.previewPath || !pictureInfo.previewPath.toLowerCase().endsWith(".png");
    }
  });

  const uploadButton = document.createElement("button");
  uploadButton.type = "button";
  uploadButton.className = "primary";
  uploadButton.textContent = "上传图片并绑定当前物品";
  uploadButton.addEventListener("click", () => {
    uploadInput.click();
  });

  const createResourceButton = document.createElement("button");
  createResourceButton.type = "button";
  createResourceButton.className = "primary";
  createResourceButton.textContent = "一键创建物品资源";
  createResourceButton.disabled = pictureInfo.resourceExists || !pictureInfo.pictureId || !pictureInfo.detectedAssetValue;
  createResourceButton.addEventListener("click", async () => {
    createResourceButton.disabled = true;
    try {
      const result = await createItemResource(pictureInfo.pictureId, pictureInfo.detectedAssetValue);
      await loadDataFiles();
      await rebuildContentIndex();
      showValidation(result.validation.ok, result.validation.message);
      renderFormView();
    } catch (error) {
      showValidation(false, error instanceof Error ? error.message : String(error));
    } finally {
      createResourceButton.disabled = pictureInfo.resourceExists || !pictureInfo.pictureId || !pictureInfo.detectedAssetValue;
    }
  });

  actions.append(pickerButton, uploadButton, openButton, normalizeButton, createResourceButton, uploadInput);
  preview.append(meta, actions);
  wrapper.appendChild(preview);
  return wrapper;
}

function createItemTabBar(record) {
  const tabBar = document.createElement("div");
  tabBar.className = "character-tab-bar";
  const tabs = [
    { value: "requirements", label: "使用条件" },
    { value: "effects", label: "使用效果" },
    { value: "affixes", label: record.type === "equipment" ? "装备词缀" : "装备词缀（仅装备）" },
  ];

  for (const tab of tabs) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "character-tab-button";
    button.classList.toggle("active", state.itemTab === tab.value);
    button.textContent = tab.label;
    button.addEventListener("click", () => {
      state.itemTab = tab.value;
      renderFormView();
    });
    tabBar.appendChild(button);
  }

  return tabBar;
}

function createItemTabContent(record) {
  const wrapper = document.createElement("div");
  wrapper.className = "character-tab-content";

  switch (state.itemTab) {
    case "effects":
      wrapper.appendChild(createItemUseEffectEditor(record));
      break;
    case "affixes":
      wrapper.appendChild(createItemAffixEditor(record));
      break;
    case "requirements":
    default:
      wrapper.appendChild(createItemRequirementEditor(record));
      break;
  }

  return wrapper;
}

function createItemRequirementEditor(record) {
  ensureItemShape(record);
  const wrapper = document.createElement("div");
  wrapper.className = "character-table-editor";

  const summary = document.createElement("div");
  summary.className = "character-list-summary";
  summary.textContent = record.requirements.length > 0
    ? record.requirements.map(formatItemRequirementSummary).join(" / ")
    : "未配置使用条件";

  const list = document.createElement("div");
  list.className = "item-array-list";
  for (const requirement of record.requirements) {
    list.appendChild(createItemRequirementCard(record, requirement));
  }

  const addRow = document.createElement("div");
  addRow.className = "character-add-row";
  const addStat = document.createElement("button");
  addStat.type = "button";
  addStat.textContent = "+ 属性要求";
  addStat.addEventListener("click", () => {
    record.requirements.push(createDefaultItemRequirement("stat"));
    syncFormToEditor();
    renderFormView();
  });
  const addTalent = document.createElement("button");
  addTalent.type = "button";
  addTalent.textContent = "+ 天赋要求";
  addTalent.addEventListener("click", () => {
    record.requirements.push(createDefaultItemRequirement("talent"));
    syncFormToEditor();
    renderFormView();
  });
  addRow.append(addStat, addTalent);

  wrapper.append(summary, list, addRow);
  return wrapper;
}

function createItemRequirementCard(record, requirement) {
  normalizeItemRequirement(requirement);
  const card = createItemArrayCard(record.requirements, requirement, formatItemRequirementSummary(requirement));
  const grid = document.createElement("div");
  grid.className = "item-array-grid";
  grid.append(
    createNestedSelectField(requirement, "条件类型", "type", ITEM_REQUIREMENT_TYPE_CHOICES, {
      rerenderOnChange: true,
      onAfterChange: () => {
        replacePlainObject(requirement, createDefaultItemRequirement(requirement.type));
      },
    })
  );

  if (requirement.type === "talent") {
    grid.append(
      createNestedTextField(requirement, "天赋", "talentId", {
        list: ensureDefinitionIdDatalist("talents"),
        placeholder: "例如：毒圣",
      })
    );
  } else {
    grid.append(
      createNestedSelectField(requirement, "属性", "statId", CHARACTER_STAT_FIELDS.map((stat) => ({
        value: stat.key,
        label: `${stat.key} ${stat.label}`,
      }))),
      createNestedNumberField(requirement, "要求值", "value", {
        fallback: 0,
      })
    );
  }

  card.body.appendChild(grid);
  return card.root;
}

function createItemUseEffectEditor(record) {
  ensureItemShape(record);
  const wrapper = document.createElement("div");
  wrapper.className = "character-table-editor";

  const summary = document.createElement("div");
  summary.className = "character-list-summary";
  summary.textContent = record.useEffects.length > 0
    ? record.useEffects.map(formatItemEffectSummary).join(" / ")
    : "未配置使用效果";

  const list = document.createElement("div");
  list.className = "item-array-list";
  for (const effect of record.useEffects) {
    list.appendChild(createItemUseEffectCard(record, effect));
  }

  const addRow = document.createElement("div");
  addRow.className = "character-add-row";
  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.textContent = "+ 添加效果";
  addButton.addEventListener("click", () => {
    record.useEffects.push(createDefaultItemEffect("add_hp"));
    syncFormToEditor();
    renderFormView();
  });
  addRow.appendChild(addButton);

  wrapper.append(summary, list, addRow);
  return wrapper;
}

function createItemUseEffectCard(record, effect) {
  normalizeItemEffect(effect);
  const card = createItemArrayCard(record.useEffects, effect, formatItemEffectSummary(effect));
  const grid = document.createElement("div");
  grid.className = "item-array-grid";
  grid.append(
    createNestedSelectField(effect, "效果类型", "type", ITEM_EFFECT_TYPE_CHOICES, {
      rerenderOnChange: true,
      onAfterChange: () => {
        replacePlainObject(effect, createDefaultItemEffect(effect.type));
      },
    })
  );

  switch (effect.type) {
    case "external_skill":
      grid.append(
        createNestedTextField(effect, "外功", "skillId", {
          list: ensureDefinitionIdDatalist("external-skills"),
          placeholder: "例如：罗汉拳",
        }),
        createNestedNumberField(effect, "等级", "level", { fallback: 1 })
      );
      break;
    case "internal_skill":
      grid.append(
        createNestedTextField(effect, "内功", "skillId", {
          list: ensureDefinitionIdDatalist("internal-skills"),
          placeholder: "例如：基本内功",
        }),
        createNestedNumberField(effect, "等级", "level", { fallback: 1 })
      );
      break;
    case "special_skill":
      grid.append(
        createNestedTextField(effect, "绝技", "skillId", {
          list: ensureDefinitionIdDatalist("special-skills"),
          placeholder: "例如：笑傲江湖曲",
        })
      );
      break;
    case "grant_talent":
      grid.append(
        createNestedTextField(effect, "天赋", "talentId", {
          list: ensureDefinitionIdDatalist("talents"),
          placeholder: "例如：毒圣",
        })
      );
      break;
    case "add_buff":
      grid.append(
        createNestedTextField(effect, "Buff", "buffId", {
          list: ensureDefinitionIdDatalist("buffs"),
          placeholder: "例如：中毒",
        }),
        createNestedNumberField(effect, "持续时间", "duration", { fallback: 1 })
      );
      break;
    case "detoxify":
      if (!Array.isArray(effect.values)) {
        effect.values = [0, 0];
      }
      grid.append(
        createArrayValueNumberField(effect.values, 0, "数值 1"),
        createArrayValueNumberField(effect.values, 1, "数值 2")
      );
      break;
    default:
      grid.append(createNestedNumberField(effect, "数值", "value", { fallback: 0 }));
      break;
  }

  card.body.appendChild(grid);
  return card.root;
}

function createItemAffixEditor(record) {
  ensureItemShape(record);
  const wrapper = document.createElement("div");
  wrapper.className = "character-table-editor";

  if (record.type !== "equipment") {
    const note = document.createElement("div");
    note.className = "form-summary character-form-summary";
    note.textContent = "当前物品不是 equipment，装备词缀区域仅在装备类型下生效。切换 type 为 equipment 后可直接编辑 slotType 与 affixes。";
    wrapper.appendChild(note);
    return wrapper;
  }

  const summary = document.createElement("div");
  summary.className = "character-list-summary";
  summary.textContent = record.affixes.length > 0
    ? record.affixes.map(formatItemAffixSummary).join(" / ")
    : "未配置装备词缀";

  const list = document.createElement("div");
  list.className = "item-array-list";
  for (const affix of record.affixes) {
    list.appendChild(createItemAffixCard(record, affix));
  }

  const addRow = document.createElement("div");
  addRow.className = "character-add-row";
  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.textContent = "+ 添加词缀";
  addButton.addEventListener("click", () => {
    record.affixes.push(createDefaultItemAffix("stat_modifier"));
    syncFormToEditor();
    renderFormView();
  });
  addRow.appendChild(addButton);

  wrapper.append(summary, list, addRow);
  return wrapper;
}

function createItemAffixCard(record, affix) {
  normalizeItemAffix(affix);
  const card = createItemArrayCard(record.affixes, affix, formatItemAffixSummary(affix));
  const grid = document.createElement("div");
  grid.className = "item-array-grid";
  grid.append(
    createNestedSelectField(affix, "词缀类型", "type", ITEM_AFFIX_TYPE_CHOICES, {
      rerenderOnChange: true,
      onAfterChange: () => {
        replacePlainObject(affix, createDefaultItemAffix(affix.type));
      },
    })
  );

  switch (affix.type) {
    case "grant_talent":
      grid.append(createNestedTextField(affix, "天赋", "talentId", {
        list: ensureDefinitionIdDatalist("talents"),
        placeholder: "例如：刀系装备",
      }));
      break;
    case "grant_model":
      grid.append(
        createNestedTextField(affix, "模型", "modelId", {
          placeholder: "例如：fanseng",
        }),
        createNestedNumberField(affix, "优先级", "priority", { fallback: 0 }),
        createNestedTextField(affix, "描述", "description", {
          placeholder: "例如：血刀门弟子",
        })
      );
      break;
    case "skill_bonus_modifier":
      grid.append(
        createNestedTextField(affix, "外功", "skillId", {
          list: ensureDefinitionIdDatalist("external-skills"),
          placeholder: "例如：八卦刀法",
        }),
        createNestedNumberField(affix.value, "加成", "delta", { fallback: 0 })
      );
      break;
    case "weapon_bonus_modifier":
      grid.append(
        createNestedSelectField(affix, "武学类别", "weaponType", ITEM_WEAPON_TYPE_CHOICES),
        createNestedNumberField(affix.value, "加成", "delta", { fallback: 0 })
      );
      break;
    case "legend_skill_chance_modifier":
      grid.append(
        createNestedTextField(affix, "传奇招式", "skillId", {
          list: ensureDefinitionIdDatalist("legend-skills"),
          placeholder: "例如：小人物的愤怒",
        }),
        createNestedNumberField(affix.value, "触发率加成", "delta", { fallback: 0 })
      );
      break;
    case "stat_modifier":
    default:
      grid.append(
        createNestedSelectField(affix, "属性", "stat", ITEM_AFFIX_STAT_CHOICES),
        createNestedNumberField(affix.value, "数值", "delta", { fallback: 0 })
      );
      break;
  }

  card.body.appendChild(grid);
  return card.root;
}

function createItemArrayCard(collection, entry, summaryText) {
  const root = document.createElement("div");
  root.className = "item-array-card";
  const header = document.createElement("div");
  header.className = "item-array-card-header";
  const title = document.createElement("div");
  title.className = "item-array-card-title";
  title.textContent = summaryText;
  const remove = document.createElement("button");
  remove.type = "button";
  remove.textContent = "删除";
  remove.addEventListener("click", () => {
    const index = collection.indexOf(entry);
    if (index >= 0) {
      collection.splice(index, 1);
      syncFormToEditor();
      renderFormView();
    }
  });
  header.append(title, remove);
  const body = document.createElement("div");
  body.className = "item-array-card-body";
  root.append(header, body);
  return { root, body };
}

function createNestedTextField(target, labelCn, key, options = {}) {
  const field = createCharacterFieldShell(labelCn, key, options.full === true);
  const input = document.createElement("input");
  input.type = "text";
  input.value = target[key] == null ? "" : String(target[key]);
  input.placeholder = options.placeholder || "";
  if (options.list) {
    input.setAttribute("list", options.list);
  }

  input.addEventListener("input", () => {
    target[key] = input.value;
    syncFormToEditor();
    renderCharacterCheckTool();
  });
  if (options.rerenderOnChange) {
    input.addEventListener("change", () => renderFormView());
  }

  field.appendChild(input);
  return field;
}

function createNestedNumberField(target, labelCn, key, options = {}) {
  const field = createCharacterFieldShell(labelCn, key, options.full === true);
  const input = document.createElement("input");
  input.type = "number";
  input.value = Number.isFinite(target[key]) ? String(target[key]) : String(options.fallback ?? 0);
  input.addEventListener("input", () => {
    target[key] = parseNumberInputValue(input.value, options.fallback ?? 0);
    syncFormToEditor();
    renderCharacterCheckTool();
  });
  if (options.rerenderOnChange) {
    input.addEventListener("change", () => renderFormView());
  }
  field.appendChild(input);
  return field;
}

function createNestedSelectField(target, labelCn, key, choices, options = {}) {
  const field = createCharacterFieldShell(labelCn, key, options.full === true);
  const select = document.createElement("select");
  for (const choice of choices) {
    const option = document.createElement("option");
    option.value = choice.value;
    option.textContent = choice.label;
    option.selected = String(target[key] ?? "") === choice.value;
    select.appendChild(option);
  }
  select.addEventListener("change", () => {
    target[key] = select.value;
    if (typeof options.onAfterChange === "function") {
      options.onAfterChange();
    }
    syncFormToEditor();
    if (options.rerenderOnChange) {
      renderFormView();
    } else {
      renderCharacterCheckTool();
    }
  });
  field.appendChild(select);
  return field;
}

function createArrayValueNumberField(values, index, labelCn) {
  const field = createCharacterFieldShell(labelCn, `values[${index}]`);
  const input = document.createElement("input");
  input.type = "number";
  input.value = Number.isFinite(values[index]) ? String(values[index]) : "0";
  input.addEventListener("input", () => {
    values[index] = parseNumberInputValue(input.value, 0);
    syncFormToEditor();
    renderCharacterCheckTool();
  });
  field.appendChild(input);
  return field;
}

function replacePlainObject(target, next) {
  for (const key of Object.keys(target)) {
    delete target[key];
  }
  Object.assign(target, next);
}

function createDefaultItemRequirement(type) {
  return type === "talent"
    ? { type: "talent", talentId: "" }
    : { type: "stat", statId: "wuxing", value: 10 };
}

function normalizeItemRequirement(requirement) {
  if (!requirement || typeof requirement !== "object") {
    return;
  }

  if (requirement.type === "talent") {
    if (typeof requirement.talentId !== "string") {
      requirement.talentId = "";
    }
    return;
  }

  requirement.type = "stat";
  if (!isKnownCharacterStatId(requirement.statId)) {
    requirement.statId = "wuxing";
  }
  if (!Number.isFinite(requirement.value)) {
    requirement.value = 10;
  }
}

function formatItemRequirementSummary(requirement) {
  if (requirement?.type === "talent") {
    return `需天赋 ${requirement.talentId || "未填写"}`;
  }

  const statLabel = CHARACTER_STAT_FIELDS.find((stat) => stat.key === requirement?.statId)?.label || requirement?.statId || "属性";
  return `${statLabel} >= ${getDisplayNumber(requirement?.value, 0)}`;
}

function createDefaultItemEffect(type) {
  switch (type) {
    case "external_skill":
      return { type, skillId: "", level: 1 };
    case "internal_skill":
      return { type, skillId: "", level: 1 };
    case "special_skill":
      return { type, skillId: "" };
    case "grant_talent":
      return { type, talentId: "" };
    case "add_buff":
      return { type, buffId: "", duration: 1 };
    case "detoxify":
      return { type, values: [5, 5] };
    default:
      return { type, value: 0 };
  }
}

function normalizeItemEffect(effect) {
  if (!effect || typeof effect !== "object") {
    return;
  }

  const normalized = createDefaultItemEffect(effect.type || "add_hp");
  for (const [key, value] of Object.entries(normalized)) {
    if (effect[key] == null || (Array.isArray(value) && !Array.isArray(effect[key]))) {
      effect[key] = structuredCloneCompat(value);
    }
  }
}

function formatItemEffectSummary(effect) {
  switch (effect?.type) {
    case "external_skill":
      return `外功 ${effect.skillId || "未填写"} Lv${getDisplayNumber(effect.level, 1)}`;
    case "internal_skill":
      return `内功 ${effect.skillId || "未填写"} Lv${getDisplayNumber(effect.level, 1)}`;
    case "special_skill":
      return `绝技 ${effect.skillId || "未填写"}`;
    case "grant_talent":
      return `获得天赋 ${effect.talentId || "未填写"}`;
    case "add_buff":
      return `Buff ${effect.buffId || "未填写"} ${getDisplayNumber(effect.duration, 1)} 回合`;
    case "detoxify":
      return `解毒 ${Array.isArray(effect.values) ? effect.values.join(" / ") : "未填写"}`;
    default:
      return `${effect?.type || "效果"} ${getDisplayNumber(effect?.value, 0)}`;
  }
}

function createDefaultItemAffix(type) {
  switch (type) {
    case "grant_talent":
      return { type, talentId: "" };
    case "grant_model":
      return { type, modelId: "", priority: 0, description: "" };
    case "skill_bonus_modifier":
      return { type, skillId: "", value: { op: "add", delta: 0 } };
    case "weapon_bonus_modifier":
      return { type, weaponType: "qimen", value: { op: "add", delta: 0 } };
    case "legend_skill_chance_modifier":
      return { type, skillId: "", value: { op: "add", delta: 0 } };
    case "stat_modifier":
    default:
      return { type: "stat_modifier", stat: "attack", value: { op: "add", delta: 0 } };
  }
}

function normalizeItemAffix(affix) {
  if (!affix || typeof affix !== "object") {
    return;
  }

  const normalized = createDefaultItemAffix(affix.type || "stat_modifier");
  for (const [key, value] of Object.entries(normalized)) {
    if (affix[key] == null || (typeof value === "object" && value !== null && (typeof affix[key] !== "object" || affix[key] === null))) {
      affix[key] = structuredCloneCompat(value);
    }
  }

  if (!affix.value || typeof affix.value !== "object" || Array.isArray(affix.value)) {
    affix.value = { op: "add", delta: 0 };
  }
  if (typeof affix.value.op !== "string") {
    affix.value.op = "add";
  }
  if (!Number.isFinite(affix.value.delta)) {
    affix.value.delta = 0;
  }
}

function formatItemAffixSummary(affix) {
  switch (affix?.type) {
    case "grant_talent":
      return `赋予天赋 ${affix.talentId || "未填写"}`;
    case "grant_model":
      return `模型 ${affix.modelId || "未填写"}`;
    case "skill_bonus_modifier":
      return `外功加成 ${affix.skillId || "未填写"} +${getDisplayNumber(affix?.value?.delta, 0)}`;
    case "weapon_bonus_modifier":
      return `类别加成 ${affix.weaponType || "未填写"} +${getDisplayNumber(affix?.value?.delta, 0)}`;
    case "legend_skill_chance_modifier":
      return `传奇招式 ${affix.skillId || "未填写"} +${getDisplayNumber(affix?.value?.delta, 0)}`;
    case "stat_modifier":
    default:
      return `${affix.stat || "属性"} +${getDisplayNumber(affix?.value?.delta, 0)}`;
  }
}

function createItemAdvancedJsonSection(record) {
  const section = createCharacterSection("高级 JSON", "Advanced");
  const details = document.createElement("details");
  details.className = "character-advanced-json";
  const summary = document.createElement("summary");
  summary.textContent = "展开原始物品 JSON";
  const textarea = document.createElement("textarea");
  textarea.value = JSON.stringify(record, null, 2);
  textarea.addEventListener("change", () => {
    try {
      const parsed = JSON.parse(textarea.value);
      state.formRecords[state.selectedRecordIndex] = parsed;
      syncFormToEditor();
      renderFormView();
    } catch (error) {
      textarea.setCustomValidity(error instanceof Error ? error.message : String(error));
      textarea.reportValidity();
    }
  });
  details.append(summary, textarea);
  section.appendChild(details);
  return section;
}

function getCharacterFilters() {
  return [
    { value: "all", label: "全部" },
    { value: "dialogue", label: "仅对白" },
    { value: "joinable", label: "可入队" },
    { value: "battle", label: "可战斗" },
    { value: "missingPortrait", label: "缺头像" },
    { value: "incomplete", label: "配置不完整" },
  ];
}

function matchesCharacterSearch(record, query) {
  if (!query) {
    return true;
  }

  const haystack = [
    record.id,
    record.name,
    record.portrait,
    record.model,
    record.growTemplate,
    record.gender,
    JSON.stringify(record),
  ].filter(Boolean).join(" ").toLowerCase();

  return haystack.includes(query);
}

function matchesCharacterFilter(record, filter) {
  const classification = getCharacterUiClassification(record);
  const issues = getCharacterValidationIssues(record);
  const portraitInfo = getCharacterPortraitInfo(record);

  switch (filter) {
    case "dialogue":
      return classification.key === "dialogue";
    case "joinable":
      return classification.key === "joinable" || classification.key === "partner";
    case "battle":
      return record.arenaEnabled === true;
    case "missingPortrait":
      return !portraitInfo.resourceExists || !portraitInfo.assetExists;
    case "incomplete":
      return issues.length > 0;
    case "all":
    default:
      return true;
  }
}

function createCharacterSection(titleCn, titleEn) {
  const section = document.createElement("section");
  section.className = "character-section";
  const heading = document.createElement("div");
  heading.className = "character-section-title";
  heading.innerHTML = `${escapeHtml(titleCn)} <span>${escapeHtml(titleEn)}</span>`;
  section.appendChild(heading);
  return section;
}

function createCharacterFieldShell(labelCn, key, full = false) {
  const field = document.createElement("label");
  field.className = `form-field character-field ${full ? "full" : ""}`;
  const label = document.createElement("span");
  label.className = "character-field-label";
  label.innerHTML = `${escapeHtml(labelCn)} <code>${escapeHtml(key)}</code>`;
  field.appendChild(label);
  return field;
}

function createCharacterTextField(record, labelCn, key, options = {}) {
  const field = createCharacterFieldShell(labelCn, key, options.full === true);
  const input = document.createElement("input");
  input.type = "text";
  input.value = record[key] == null ? "" : String(record[key]);
  input.placeholder = options.placeholder || "";
  if (options.list) {
    input.setAttribute("list", options.list);
  }

  input.addEventListener("input", () => {
    const value = input.value.trim();
    updateRecordField(record, key, options.nullable && !value ? null : input.value);
  });
  if (options.rerenderOnChange) {
    input.addEventListener("change", () => renderFormView());
  }

  field.appendChild(input);
  return field;
}

function createCharacterNumberField(record, labelCn, key, options = {}) {
  const field = createCharacterFieldShell(labelCn, key, options.full === true);
  const input = document.createElement("input");
  input.type = "number";
  input.value = String(getDisplayNumber(record[key], options.fallback ?? 0));
  if (Number.isFinite(options.min)) {
    input.min = String(options.min);
  }
  if (Number.isFinite(options.max)) {
    input.max = String(options.max);
  }

  input.addEventListener("input", () => {
    updateRecordField(record, key, parseNumberInputValue(input.value, options.fallback ?? 0));
  });
  if (options.rerenderOnChange) {
    input.addEventListener("change", () => renderFormView());
  }

  field.appendChild(input);
  return field;
}

function createCharacterSelectField(record, labelCn, key, choices) {
  const field = createCharacterFieldShell(labelCn, key);
  const select = document.createElement("select");
  for (const choice of choices) {
    const option = document.createElement("option");
    option.value = choice.value;
    option.textContent = choice.label;
    option.selected = String(record[key] ?? "") === choice.value;
    select.appendChild(option);
  }

  select.addEventListener("change", () => {
    updateRecordField(record, key, select.value, { rerender: true });
  });

  field.appendChild(select);
  return field;
}

function createCharacterCheckboxField(record, labelCn, key, displayKey) {
  const field = createCharacterFieldShell(labelCn, displayKey || key);
  const wrapper = document.createElement("label");
  wrapper.className = "character-checkbox";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = record[key] === true;
  const text = document.createElement("span");
  text.textContent = record[key] === true ? "是" : "否";
  input.addEventListener("change", () => {
    text.textContent = input.checked ? "是" : "否";
    updateRecordField(record, key, input.checked, { rerender: true });
  });
  wrapper.append(input, text);
  field.appendChild(wrapper);
  return field;
}

function ensureCharacterShape(record) {
  if (!record.stats || typeof record.stats !== "object" || Array.isArray(record.stats)) {
    record.stats = {};
  }

  for (const stat of CHARACTER_STAT_FIELDS) {
    if (!Number.isFinite(record.stats[stat.key])) {
      record.stats[stat.key] = stat.key.startsWith("max_") ? 100 : 10;
    }
  }

  if (!Array.isArray(record.talentIds)) {
    record.talentIds = [];
  }
  if (!Array.isArray(record.specialSkillIds)) {
    record.specialSkillIds = [];
  }
  if (!Array.isArray(record.equipmentIds)) {
    record.equipmentIds = [];
  }
  if (!Array.isArray(record.externalSkills)) {
    record.externalSkills = [];
  }
  if (!Array.isArray(record.internalSkills)) {
    record.internalSkills = [];
  }
}

function createCharacterPortraitHero(record, portraitInfo) {
  const box = document.createElement("div");
  box.className = "character-summary-portrait";
  const previewPath = portraitInfo.previewPath;
  if (previewPath) {
    const image = document.createElement("img");
    image.src = `/api/assets/file?path=${encodeURIComponent(previewPath)}`;
    image.alt = typeof record.name === "string" ? record.name : (record.id || "角色头像");
    box.appendChild(image);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "character-summary-portrait-placeholder";
    placeholder.textContent = "无头像";
    box.appendChild(placeholder);
  }
  return box;
}

function createPill(text, tone = "") {
  const pill = document.createElement("span");
  pill.className = `character-pill ${tone}`;
  pill.textContent = text;
  return pill;
}

function getCharacterUiClassification(record) {
  const hasGrowTemplate = typeof record.growTemplate === "string" && record.growTemplate.trim().length > 0;
  const hasAnySkills = Array.isArray(record.externalSkills) && record.externalSkills.length > 0
    || Array.isArray(record.internalSkills) && record.internalSkills.length > 0
    || Array.isArray(record.specialSkillIds) && record.specialSkillIds.length > 0;
  const hasTalents = Array.isArray(record.talentIds) && record.talentIds.length > 0;
  const hasEquipment = Array.isArray(record.equipmentIds) && record.equipmentIds.length > 0;

  if (hasGrowTemplate && (hasAnySkills || hasTalents || hasEquipment)) {
    return { key: "partner", label: "完整伙伴" };
  }

  if (record.arenaEnabled === true) {
    return { key: "battle", label: "可战斗 NPC" };
  }

  if (hasGrowTemplate) {
    return { key: "joinable", label: "可入队角色" };
  }

  return { key: "dialogue", label: "对白角色" };
}

function formatGenderLabel(gender) {
  switch (gender) {
    case "male":
      return "男";
    case "female":
      return "女";
    default:
      return "中立";
  }
}

function getDisplayNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function parseNumberInputValue(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getCharacterPortraitInfo(record) {
  const portraitId = typeof record.portrait === "string" ? record.portrait.trim() : "";
  const resource = portraitId ? state.contentIndex.resourcesById.get(portraitId) : null;
  const resourceExists = Boolean(resource);
  const assetValue = typeof resource?.value === "string" ? resource.value.trim() : "";
  const assetPath = resourceExists ? resolveResourceAssetPath(resource) : "";
  const detectedAssetValue = detectSpeakerPortraitAssetValue(record.id || "", record.name || "");
  const detectedAssetPath = detectedAssetValue ? findAssetPath(detectedAssetValue, { art: true }) : "";
  const previewPath = assetPath || detectedAssetPath || "";

  return {
    portraitId,
    resource,
    resourceExists,
    assetValue,
    assetPath,
    assetExists: Boolean(assetPath),
    detectedAssetValue,
    detectedAssetPath,
    previewPath,
  };
}

function getCharacterValidationIssues(record) {
  const issues = [];
  const portraitInfo = getCharacterPortraitInfo(record);
  const classification = getCharacterUiClassification(record);
  const stats = record.stats && typeof record.stats === "object" && !Array.isArray(record.stats) ? record.stats : {};

  if (!portraitInfo.portraitId) {
    issues.push(createCharacterIssue("error", "头像资源为空，请填写 portrait。"));
  } else if (!portraitInfo.resourceExists) {
    issues.push(createCharacterIssue("error", `头像资源不存在：${portraitInfo.portraitId}`));
  } else if (!portraitInfo.assetExists) {
    issues.push(createCharacterIssue("error", `头像图片不存在：${portraitInfo.assetValue || portraitInfo.portraitId}`));
  }

  if (record.arenaEnabled === true && !String(record.model || "").trim()) {
    issues.push(createCharacterIssue("error", "此角色可战斗，但没有模型 model。"));
  }

  if ((classification.key === "joinable" || classification.key === "partner") && !String(record.growTemplate || "").trim()) {
    issues.push(createCharacterIssue("error", "此角色可入队，但没有成长模板 growTemplate。"));
  }

  if (String(record.growTemplate || "").trim() && !hasDefinitionOfType(record.growTemplate, "grow-templates")) {
    issues.push(createCharacterIssue("error", `成长模板不存在：${record.growTemplate}`, record.growTemplate, ["grow-templates"]));
  }

  for (const stat of CHARACTER_STAT_FIELDS) {
    if (!Number.isFinite(stats[stat.key])) {
      issues.push(createCharacterIssue("error", `数值字段不是数字：${stat.label} ${stat.key}`));
    }
  }

  const internalSkills = Array.isArray(record.internalSkills) ? record.internalSkills : [];
  const equippedCount = internalSkills.filter((entry) => entry?.equipped === true).length;
  if (equippedCount > 1) {
    issues.push(createCharacterIssue("error", "内功存在多个 equipped = true。"));
  }

  appendMissingReferenceIssues(issues, record.talentIds, "天赋不存在", ["talents"]);
  appendMissingReferenceIssues(issues, record.specialSkillIds, "绝技不存在", ["special-skills"]);
  appendMissingReferenceIssues(issues, record.equipmentIds, "装备不存在", ["items"], (id) => isEquipmentId(id));
  appendSkillEntryIssues(issues, record.externalSkills, "外功不存在", ["external-skills"]);
  appendSkillEntryIssues(issues, record.internalSkills, "内功不存在", ["internal-skills"]);

  if (record.id && record.name && record.id !== record.name
    && state.contentIndex.storySpeakers.has(record.id)
    && state.contentIndex.storySpeakers.has(record.name)) {
    issues.push(createCharacterIssue("warn", "剧情对白同时使用了角色 id 和 name 作为 speaker，建议统一命名。"));
  }

  return issues;
}

function createCharacterIssue(severity, message, definitionId = "", types = []) {
  return { severity, message, definitionId, types };
}

function appendMissingReferenceIssues(issues, values, prefix, types, extraValidator = null) {
  if (!Array.isArray(values)) {
    return;
  }

  for (const value of values) {
    if (typeof value !== "string" || !value.trim()) {
      continue;
    }

    const valid = extraValidator ? extraValidator(value) : hasDefinitionInTypes(value, types);
    if (!valid) {
      issues.push(createCharacterIssue("error", `${prefix}：${value}`, value, types));
    }
  }
}

function appendSkillEntryIssues(issues, entries, prefix, types) {
  if (!Array.isArray(entries)) {
    return;
  }

  for (const entry of entries) {
    const id = typeof entry?.id === "string" ? entry.id.trim() : "";
    if (!id) {
      issues.push(createCharacterIssue("error", `${prefix.replace("不存在", "")}条目缺少 id。`));
      continue;
    }

    if (!hasDefinitionInTypes(id, types)) {
      issues.push(createCharacterIssue("error", `${prefix}：${id}`, id, types));
    }
  }
}

function hasDefinitionInTypes(id, types) {
  return types.some((type) => hasDefinitionOfType(id, type));
}

function isEquipmentId(id) {
  const item = state.contentIndex.itemsById.get(id);
  return Boolean(item && item.type === "equipment");
}

function createCharacterIssueSummary(issues) {
  const box = document.createElement("div");
  box.className = "character-issue-summary";
  const title = document.createElement("div");
  title.className = "character-issue-summary-title";
  title.textContent = "实时提示";
  const list = document.createElement("div");
  list.className = "character-inline-issue-list";
  for (const issue of issues.slice(0, 6)) {
    const row = document.createElement("div");
    row.className = `character-inline-issue ${issue.severity || "warn"}`;
    row.textContent = issue.message;
    list.appendChild(row);
  }
  box.append(title, list);
  return box;
}

function createCharacterPortraitSection(record, portraitInfo) {
  const wrapper = document.createElement("div");
  wrapper.className = "character-portrait-section";

  const preview = document.createElement("div");
  preview.className = `character-portrait-preview ${portraitInfo.assetExists ? "ok" : "missing"}`;

  if (portraitInfo.previewPath) {
    const image = document.createElement("img");
    image.src = `/api/assets/file?path=${encodeURIComponent(portraitInfo.previewPath)}`;
    image.alt = portraitInfo.portraitId || "角色头像";
    preview.appendChild(image);
  } else {
    const empty = document.createElement("div");
    empty.className = "character-portrait-preview-empty";
    empty.textContent = "缺图";
    preview.appendChild(empty);
  }

  const meta = document.createElement("div");
  meta.className = "character-portrait-meta";
  meta.append(
    createCharacterMetaRow("头像资源", portraitInfo.portraitId || "未填写"),
    createCharacterMetaRow("真实图片", portraitInfo.assetPath || "未找到"),
    createCharacterMetaRow("自动检测路径", portraitInfo.detectedAssetValue || "未检测到"),
    createCharacterMetaRow("资源状态", portraitInfo.resourceExists ? "已存在" : "resources.json 中不存在"),
  );

  if (!portraitInfo.assetExists) {
    const warning = document.createElement("div");
    warning.className = "character-portrait-warning";
    warning.textContent = portraitInfo.portraitId
      ? `缺图红色提示：${portraitInfo.portraitId} 还没有可用图片。`
      : "缺图红色提示：当前角色还没有填写 portrait。";
    meta.appendChild(warning);
  }

  const actions = document.createElement("div");
  actions.className = "character-portrait-actions";

  const pickerButton = document.createElement("button");
  pickerButton.type = "button";
  pickerButton.className = "primary";
  pickerButton.textContent = "从图库选择";
  pickerButton.addEventListener("click", () => {
    openPortraitPicker(portraitInfo.previewPath);
  });

  const openButton = document.createElement("button");
  openButton.type = "button";
  openButton.textContent = "打开图片";
  openButton.disabled = !portraitInfo.previewPath;
  openButton.addEventListener("click", () => {
    if (!portraitInfo.previewPath) {
      return;
    }

    setMode("assets");
    openAssetFile(portraitInfo.previewPath);
  });

  const normalizeButton = document.createElement("button");
  normalizeButton.type = "button";
  normalizeButton.textContent = "规范化512";
  normalizeButton.disabled = !portraitInfo.previewPath || !portraitInfo.previewPath.toLowerCase().endsWith(".png");
  normalizeButton.addEventListener("click", async () => {
    normalizeButton.disabled = true;
    try {
      await normalizePortraitAsset(portraitInfo.previewPath);
      await loadAssetFiles();
      renderFormView();
    } catch (error) {
      showValidation(false, formatNormalizePortraitError(error));
    } finally {
      normalizeButton.disabled = false;
    }
  });

  const createResourceButton = document.createElement("button");
  createResourceButton.type = "button";
  createResourceButton.className = "primary";
  createResourceButton.textContent = "一键创建头像资源";
  createResourceButton.disabled = portraitInfo.resourceExists || !portraitInfo.portraitId || !portraitInfo.detectedAssetValue;
  createResourceButton.addEventListener("click", async () => {
    createResourceButton.disabled = true;
    try {
      const result = await createPortraitResource(portraitInfo.portraitId, portraitInfo.detectedAssetValue);
      await loadDataFiles();
      await rebuildContentIndex();
      showValidation(result.validation.ok, result.validation.message);
      renderFormView();
    } catch (error) {
      showValidation(false, error.message);
    } finally {
      createResourceButton.disabled = portraitInfo.resourceExists || !portraitInfo.portraitId || !portraitInfo.detectedAssetValue;
    }
  });

  actions.append(pickerButton, openButton, normalizeButton, createResourceButton);
  preview.append(meta, actions);
  wrapper.appendChild(preview);
  return wrapper;
}

function createCharacterMetaRow(label, value) {
  const row = document.createElement("div");
  row.className = "character-meta-row";
  const labelNode = document.createElement("span");
  labelNode.textContent = label;
  const valueNode = document.createElement("strong");
  valueNode.textContent = value;
  row.append(labelNode, valueNode);
  return row;
}

function createCharacterStatField(record, stat) {
  ensureCharacterShape(record);
  const field = createCharacterFieldShell(stat.label, stat.key);
  const input = document.createElement("input");
  input.type = "number";
  input.value = String(getDisplayNumber(record.stats[stat.key], stat.key.startsWith("max_") ? 100 : 10));
  input.addEventListener("input", () => {
    record.stats[stat.key] = parseNumberInputValue(input.value, 0);
    syncFormToEditor();
  });
  field.appendChild(input);
  return field;
}

function createCharacterTabBar() {
  const tabBar = document.createElement("div");
  tabBar.className = "character-tab-bar";
  for (const tab of [
    { value: "talents", label: "天赋" },
    { value: "externalSkills", label: "外功" },
    { value: "internalSkills", label: "内功" },
    { value: "specialSkills", label: "绝技" },
    { value: "equipment", label: "装备" },
  ]) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "character-tab-button";
    button.classList.toggle("active", state.characterTab === tab.value);
    button.textContent = tab.label;
    button.addEventListener("click", () => {
      state.characterTab = tab.value;
      renderFormView();
    });
    tabBar.appendChild(button);
  }
  return tabBar;
}

function createCharacterTabContent(record) {
  const wrapper = document.createElement("div");
  wrapper.className = "character-tab-content";

  switch (state.characterTab) {
    case "externalSkills":
      wrapper.appendChild(createExternalSkillEditor(record));
      break;
    case "internalSkills":
      wrapper.appendChild(createInternalSkillEditor(record));
      break;
    case "specialSkills":
      wrapper.appendChild(createStringChipEditor(record, "specialSkillIds", "绝技", ensureDefinitionIdDatalist("special-skills")));
      break;
    case "equipment":
      wrapper.appendChild(createEquipmentEditor(record));
      break;
    case "talents":
    default:
      wrapper.appendChild(createStringChipEditor(record, "talentIds", "天赋", ensureDefinitionIdDatalist("talents")));
      break;
  }

  return wrapper;
}

function createStringChipEditor(record, key, labelCn, datalistId) {
  ensureCharacterShape(record);
  const wrapper = document.createElement("div");
  wrapper.className = "character-chip-editor";

  const summary = document.createElement("div");
  summary.className = "character-list-summary";
  summary.textContent = Array.isArray(record[key]) && record[key].length > 0
    ? record[key].join(" / ")
    : `未配置${labelCn}`;

  const chips = document.createElement("div");
  chips.className = "character-chip-list";
  for (const id of record[key]) {
    const chip = document.createElement("span");
    const valid = key === "equipmentIds" ? isEquipmentId(id) : hasDefinitionInTypes(id, [key === "talentIds" ? "talents" : "special-skills"]);
    chip.className = `character-chip ${valid ? "" : "invalid"}`.trim();
    chip.textContent = id;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "x";
    remove.addEventListener("click", () => {
      record[key] = record[key].filter((entry) => entry !== id);
      syncFormToEditor();
      renderFormView();
    });

    chip.appendChild(remove);
    chips.appendChild(chip);
  }

  const addRow = document.createElement("div");
  addRow.className = "character-add-row";
  const input = document.createElement("input");
  input.type = "text";
  input.className = "tool-input";
  input.placeholder = `搜索并添加${labelCn} id`;
  input.setAttribute("list", datalistId);
  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.textContent = `+ 添加${labelCn}`;
  addButton.addEventListener("click", () => {
    const value = input.value.trim();
    if (!value || record[key].includes(value)) {
      return;
    }

    record[key].push(value);
    input.value = "";
    syncFormToEditor();
    renderFormView();
  });
  addRow.append(input, addButton);

  wrapper.append(summary, chips, addRow);
  return wrapper;
}

function createExternalSkillEditor(record) {
  ensureCharacterShape(record);
  const wrapper = document.createElement("div");
  wrapper.className = "character-table-editor";
  wrapper.appendChild(createSkillSummary(record.externalSkills, "外功"));

  const table = document.createElement("div");
  table.className = "character-skill-table";
  table.appendChild(createSkillTableHeader(["武功ID", "等级", "上限", "操作"]));

  for (const entry of record.externalSkills) {
    table.appendChild(createExternalSkillRow(record, entry));
  }

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.textContent = "+ 添加外功";
  addButton.addEventListener("click", () => {
    record.externalSkills.push({ id: "", level: 1, maxLevel: 10 });
    syncFormToEditor();
    renderFormView();
  });

  wrapper.append(table, addButton);
  return wrapper;
}

function createExternalSkillRow(record, entry) {
  const row = document.createElement("div");
  row.className = "character-skill-row";
  row.append(
    createRowTextInput(entry, "id", ensureDefinitionIdDatalist("external-skills"), "外功 id"),
    createRowNumberInput(entry, "level", 1),
    createRowNumberInput(entry, "maxLevel", 10, true),
  );

  const actions = document.createElement("div");
  actions.className = "character-row-actions";
  const remove = document.createElement("button");
  remove.type = "button";
  remove.textContent = "删除";
  remove.addEventListener("click", () => {
    record.externalSkills = record.externalSkills.filter((candidate) => candidate !== entry);
    syncFormToEditor();
    renderFormView();
  });
  actions.appendChild(remove);
  row.appendChild(actions);
  return row;
}

function createInternalSkillEditor(record) {
  ensureCharacterShape(record);
  const wrapper = document.createElement("div");
  wrapper.className = "character-table-editor";
  wrapper.appendChild(createSkillSummary(record.internalSkills, "内功"));

  const table = document.createElement("div");
  table.className = "character-skill-table";
  table.appendChild(createSkillTableHeader(["内功ID", "等级", "上限", "已装备", "操作"]));

  for (const entry of record.internalSkills) {
    table.appendChild(createInternalSkillRow(record, entry));
  }

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.textContent = "+ 添加内功";
  addButton.addEventListener("click", () => {
    record.internalSkills.push({ id: "", level: 1, maxLevel: 10, equipped: false });
    syncFormToEditor();
    renderFormView();
  });

  wrapper.append(table, addButton);
  return wrapper;
}

function createInternalSkillRow(record, entry) {
  const row = document.createElement("div");
  row.className = "character-skill-row internal";
  row.append(
    createRowTextInput(entry, "id", ensureDefinitionIdDatalist("internal-skills"), "内功 id"),
    createRowNumberInput(entry, "level", 1),
    createRowNumberInput(entry, "maxLevel", 10, true),
  );

  const equipped = document.createElement("label");
  equipped.className = "character-row-toggle";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = entry.equipped === true;
  input.addEventListener("change", () => {
    entry.equipped = input.checked;
    syncFormToEditor();
    renderCharacterCheckTool();
  });
  equipped.append(input, document.createTextNode(input.checked ? "是" : "否"));
  input.addEventListener("change", () => {
    equipped.lastChild.textContent = input.checked ? "是" : "否";
  });
  row.appendChild(equipped);

  const actions = document.createElement("div");
  actions.className = "character-row-actions";
  const remove = document.createElement("button");
  remove.type = "button";
  remove.textContent = "删除";
  remove.addEventListener("click", () => {
    record.internalSkills = record.internalSkills.filter((candidate) => candidate !== entry);
    syncFormToEditor();
    renderFormView();
  });
  actions.appendChild(remove);
  row.appendChild(actions);
  return row;
}

function createEquipmentEditor(record) {
  ensureCharacterShape(record);
  const wrapper = document.createElement("div");
  wrapper.className = "character-table-editor";

  const summary = document.createElement("div");
  summary.className = "character-list-summary";
  summary.textContent = record.equipmentIds.length > 0
    ? record.equipmentIds.map((id) => `${id}${getEquipmentSlotLabel(id) ? ` (${getEquipmentSlotLabel(id)})` : ""}`).join(" / ")
    : "未配置装备";

  const list = document.createElement("div");
  list.className = "character-equipment-list";
  for (const id of record.equipmentIds) {
    const row = document.createElement("div");
    row.className = "character-equipment-row";
    const text = document.createElement("div");
    text.className = "character-equipment-row-text";
    text.textContent = id;
    const meta = document.createElement("div");
    meta.className = "character-equipment-row-meta";
    meta.textContent = getEquipmentSlotLabel(id) || "未知部位";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "删除";
    remove.addEventListener("click", () => {
      record.equipmentIds = record.equipmentIds.filter((entry) => entry !== id);
      syncFormToEditor();
      renderFormView();
    });
    row.append(text, meta, remove);
    list.appendChild(row);
  }

  const addRow = document.createElement("div");
  addRow.className = "character-add-row";
  const input = document.createElement("input");
  input.type = "text";
  input.className = "tool-input";
  input.placeholder = "搜索并添加装备 id";
  input.setAttribute("list", ensureDefinitionIdDatalist("equipment"));
  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.textContent = "+ 添加装备";
  addButton.addEventListener("click", () => {
    const value = input.value.trim();
    if (!value || record.equipmentIds.includes(value)) {
      return;
    }

    record.equipmentIds.push(value);
    input.value = "";
    syncFormToEditor();
    renderFormView();
  });
  addRow.append(input, addButton);

  wrapper.append(summary, list, addRow);
  return wrapper;
}

function createSkillSummary(entries, label) {
  const summary = document.createElement("div");
  summary.className = "character-list-summary";
  summary.textContent = Array.isArray(entries) && entries.length > 0
    ? entries.map((entry) => {
      const level = Number.isFinite(entry?.level) ? entry.level : 1;
      const maxLevel = Number.isFinite(entry?.maxLevel) ? entry.maxLevel : "?";
      const equipped = entry?.equipped === true ? " 已装备" : "";
      return `${entry?.id || "未命名"} Lv${level}/${maxLevel}${equipped}`;
    }).join(" / ")
    : `未配置${label}`;
  return summary;
}

function createSkillTableHeader(labels) {
  const header = document.createElement("div");
  header.className = "character-skill-row header";
  for (const label of labels) {
    const cell = document.createElement("div");
    cell.className = "character-skill-header";
    cell.textContent = label;
    header.appendChild(cell);
  }
  return header;
}

function createRowTextInput(target, key, datalistId, placeholder) {
  const input = document.createElement("input");
  input.type = "text";
  input.className = "tool-input";
  input.value = target[key] == null ? "" : String(target[key]);
  input.placeholder = placeholder;
  if (datalistId) {
    input.setAttribute("list", datalistId);
  }
  input.addEventListener("input", () => {
    target[key] = input.value;
    syncFormToEditor();
    renderCharacterCheckTool();
  });
  return input;
}

function createRowNumberInput(target, key, fallback, nullable = false) {
  const input = document.createElement("input");
  input.type = "number";
  input.className = "tool-input";
  const value = target[key];
  input.value = Number.isFinite(value) ? String(value) : String(fallback);
  input.addEventListener("input", () => {
    const trimmed = input.value.trim();
    target[key] = nullable && !trimmed ? null : parseNumberInputValue(trimmed, fallback);
    syncFormToEditor();
    renderCharacterCheckTool();
  });
  return input;
}

function createCharacterAdvancedJsonSection(record) {
  const section = createCharacterSection("高级 JSON", "Advanced");
  const details = document.createElement("details");
  details.className = "character-advanced-json";
  const summary = document.createElement("summary");
  summary.textContent = "展开原始角色 JSON";
  const textarea = document.createElement("textarea");
  textarea.value = JSON.stringify(record, null, 2);
  textarea.addEventListener("change", () => {
    try {
      const parsed = JSON.parse(textarea.value);
      state.formRecords[state.selectedRecordIndex] = parsed;
      syncFormToEditor();
      renderFormView();
    } catch (error) {
      textarea.setCustomValidity(error instanceof Error ? error.message : String(error));
      textarea.reportValidity();
    }
  });
  details.append(summary, textarea);
  section.appendChild(details);
  return section;
}

function getEquipmentSlotLabel(id) {
  const item = state.contentIndex.itemsById.get(id);
  if (!item || item.type !== "equipment") {
    return "";
  }

  switch (item.slotType) {
    case "weapon":
      return "武器";
    case "armor":
      return "护甲";
    case "accessory":
      return "饰品";
    default:
      return item.slotType || "";
  }
}

function ensureDefinitionIdDatalist(kind) {
  const id = `definitionOptions-${kind}`;
  const existing = document.getElementById(id);
  if (existing) {
    existing.remove();
  }

  const datalist = document.createElement("datalist");
  datalist.id = id;
  const options = getDefinitionOptions(kind);
  for (const option of options) {
    const node = document.createElement("option");
    node.value = option.id;
    node.label = option.label;
    datalist.appendChild(node);
  }

  document.body.appendChild(datalist);
  return id;
}

function getDefinitionOptions(kind) {
  if (kind === "equipment") {
    return Array.from(state.contentIndex.itemsById.values())
      .filter((item) => item.type === "equipment" && typeof item.id === "string")
      .sort((left, right) => String(left.id).localeCompare(String(right.id), "zh-Hans-CN"))
      .map((item) => ({
        id: item.id,
        label: `${item.name || item.id} ${getEquipmentSlotLabel(item.id) || ""}`.trim(),
      }));
  }

  const options = [];
  for (const definitions of state.contentIndex.definitionsById.values()) {
    for (const definition of definitions) {
      if (definition.type !== kind) {
        continue;
      }

      options.push({
        id: definition.id,
        label: definition.displayName || definition.id,
      });
    }
  }

  return options.sort((left, right) => left.id.localeCompare(right.id, "zh-Hans-CN"));
}

function createActionButton(label, action) {
  return createButton({ label, onClick: action });
}

function createFieldEditor(record, key, value) {
  const field = document.createElement("div");
  const complex = value !== null && typeof value === "object";
  const longText = typeof value === "string" && value.length > 80;
  field.className = `form-field ${complex || longText ? "full" : ""}`;

  const label = document.createElement("label");
  label.textContent = key;
  field.appendChild(label);

  if (typeof value === "boolean") {
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = value;
    input.addEventListener("change", () => updateRecordField(record, key, input.checked));
    field.appendChild(input);
    return field;
  }

  if (typeof value === "number") {
    const input = document.createElement("input");
    input.type = "number";
    input.value = String(value);
    input.addEventListener("input", () => updateRecordField(record, key, Number(input.value)));
    field.appendChild(input);
    return field;
  }

  if (state.currentPath === "resources.json" && key === "group") {
    const input = document.createElement("input");
    input.value = value === null ? "" : String(value);
    input.setAttribute("list", ensureResourceGroupDatalist());
    input.addEventListener("input", () => updateRecordField(record, key, input.value.trim() || null));
    field.appendChild(input);
    return field;
  }

  if (state.currentPath === "characters.json" && key === "portrait") {
    const input = document.createElement("input");
    input.value = value === null ? "" : String(value);
    input.setAttribute("list", ensureResourceIdDatalist("头像"));
    input.addEventListener("input", () => updateRecordField(record, key, input.value));
    field.appendChild(input);

    const assetPath = resolveAssetPath(input.value);
    if (assetPath) {
      field.appendChild(createInlineAssetPreview(assetPath, input.value));
    }

    return field;
  }

  if (complex) {
    const textarea = document.createElement("textarea");
    textarea.value = JSON.stringify(value, null, 2);
    textarea.addEventListener("change", () => {
      try {
        updateRecordField(record, key, JSON.parse(textarea.value));
        textarea.setCustomValidity("");
      } catch (error) {
        textarea.setCustomValidity(error instanceof Error ? error.message : String(error));
        textarea.reportValidity();
      }
    });
    field.appendChild(textarea);
    return field;
  }

  const input = longText ? document.createElement("textarea") : document.createElement("input");
  input.value = value === null ? "" : String(value);
  if (!longText && isResourceReferenceField(key)) {
    input.setAttribute("list", ensureResourceIdDatalist(getResourceGroupForField(key)));
  } else if (!longText && isAssetField(key, input.value)) {
    input.setAttribute("list", ensureAssetDatalist());
  }
  input.addEventListener("input", () => updateRecordField(record, key, input.value));
  field.appendChild(input);

  const assetPath = resolveAssetPath(input.value);
  if (assetPath) {
    field.appendChild(createInlineAssetPreview(assetPath, input.value));
  }

  return field;
}

function updateRecordField(record, key, value, options = {}) {
  record[key] = value;
  syncFormToEditor();
  if (options.rerender) {
    if (state.mode === "characters") {
      renderCharacterWorkspaceView();
    } else {
      renderFormView();
    }
  }
}

function addRecord() {
  const record = createRecordTemplate();
  state.formRecords.splice(state.selectedRecordIndex + 1, 0, record);
  state.selectedRecordIndex += 1;
  syncFormToEditor();
  renderFormView();
}

function duplicateRecord() {
  const current = state.formRecords[state.selectedRecordIndex];
  if (!current) {
    return;
  }

  const record = structuredCloneCompat(current);
  if (typeof record.id === "string") {
    record.id = createUniqueId(`${record.id}_copy`);
  }

  if (typeof record.name === "string") {
    record.name = `${record.name} 副本`;
  }

  state.formRecords.splice(state.selectedRecordIndex + 1, 0, record);
  state.selectedRecordIndex += 1;
  syncFormToEditor();
  renderFormView();
}

function deleteRecord() {
  if (state.formRecords.length === 0) {
    return;
  }

  const current = state.formRecords[state.selectedRecordIndex];
  const title = current ? getRecordTitle(current, state.selectedRecordIndex) : "当前条目";
  if (!confirmAction(`确认删除「${title}」？`)) {
    return;
  }

  state.formRecords.splice(state.selectedRecordIndex, 1);
  state.selectedRecordIndex = Math.max(0, Math.min(state.selectedRecordIndex, state.formRecords.length - 1));
  syncFormToEditor();
  renderFormView();
}

function createRecordTemplate() {
  if (state.currentPath === "resources.json") {
    return { id: createUniqueId("新资源"), group: null, value: "" };
  }

  if (state.currentPath === "characters.json") {
    const id = createUniqueId("新角色");
    return {
      id,
      name: id,
      level: 1,
      portrait: `头像.${id}`,
      gender: "neutral",
      arenaEnabled: false,
      talentIds: [],
      stats: {
        bili: 10,
        dingli: 10,
        fuyuan: 10,
        gengu: 10,
        jianfa: 10,
        daofa: 10,
        quanzhang: 10,
        qimen: 10,
        shenfa: 10,
        wuxing: 10,
        wuxue: 10,
        max_hp: 100,
        max_mp: 100,
      },
      specialSkillIds: [],
      internalSkills: [],
      equipmentIds: [],
      externalSkills: [],
    };
  }

  if (state.currentPath === "maps.json") {
    const id = createUniqueId("新地图");
    return {
      id,
      name: id,
      description: "",
      picture: `地图.${id}`,
      musics: [],
      locations: [
        {
          id: "返回",
          name: "返回",
          position: {
            x: -1,
            y: -1,
          },
          description: "返回大地图",
          picture: null,
          events: [
            {
              type: "map",
              targetId: "大地图",
              probability: 100,
              description: "返回大地图",
              conditions: [],
            },
          ],
        },
      ],
    };
  }

  if (state.currentPath === "items.json") {
    const id = createUniqueId("新物品");
    return {
      category: "normal",
      id,
      name: id,
      type: "consumable",
      level: 1,
      price: 0,
      cooldown: 0,
      canDrop: false,
      description: "",
      picture: `物品.${id}`,
      requirements: [],
      useEffects: [],
    };
  }

  if (state.currentPath === "shops.json") {
    const id = createUniqueId("新商店");
    return {
      id,
      name: id,
      music: null,
      background: null,
      products: [],
    };
  }

  if (state.currentPath === "game-tips.json") {
    return { id: createUniqueId("小贴士.新"), text: "" };
  }

  return { id: createUniqueId("新条目") };
}

function createUniqueId(baseId) {
  const existing = new Set(
    state.formRecords
      .map((record) => typeof record.id === "string" ? record.id : "")
      .filter(Boolean)
  );
  if (!existing.has(baseId)) {
    return baseId;
  }

  for (let index = 2; index < 10000; index += 1) {
    const candidate = `${baseId}_${index}`;
    if (!existing.has(candidate)) {
      return candidate;
    }
  }

  return `${baseId}_${Date.now()}`;
}

function structuredCloneCompat(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

function syncFormToEditor() {
  setEditorValue(`${JSON.stringify(state.formRecords, null, 2)}\n`);
  dirtyStateController.markDirty({ render: false });
  elements.saveState.textContent = "表单已修改，尚未保存";
  updateSearchMatches();
  renderEditorOutline();
  renderDirtyState();
  renderCursorState();
  renderIndexPanel();
  renderCharacterCheckTool();
  renderProblemIndicators();
}

function getRecordTitle(record, index) {
  return String(record.name || record.id || record.text || `#${index + 1}`);
}

function getRecordSubtitle(record, index) {
  const id = record.id ? String(record.id) : `#${index + 1}`;
  const type = record.type ? ` · ${record.type}` : "";
  return `${id}${type}`;
}

function createRecordThumb(record) {
  const assetPath = resolveRecordAssetPath(record);
  if (assetPath && isImage(assetPath.toLowerCase())) {
    const image = document.createElement("img");
    image.className = "record-thumb";
    image.src = `/api/assets/file?path=${encodeURIComponent(assetPath)}`;
    image.alt = getRecordTitle(record, 0);
    return image;
  }

  const placeholder = document.createElement("div");
  placeholder.className = "record-thumb record-thumb-placeholder";
  placeholder.textContent = "JSON";
  return placeholder;
}

function resolveRecordAssetPath(record) {
  for (const key of ["portrait", "picture", "icon", "model", "avatar", "image"]) {
    if (typeof record[key] === "string") {
      const path = resolveAssetPath(record[key]);
      if (path) {
        return path;
      }
    }
  }

  return "";
}

function resolveAssetPath(value) {
  if (!value) {
    return "";
  }

  const resource = state.contentIndex.resourcesById.get(value);
  if (resource) {
    return resolveResourceAssetPath(resource);
  }

  if (value.includes("/") && !value.startsWith("res://") && !value.startsWith("user://")) {
    return findAssetPath(value) || value;
  }

  return "";
}

function resolveResourceAssetPath(resource) {
  const value = typeof resource.value === "string" ? resource.value : "";
  if (!value) {
    return "";
  }

  if (resource.group === "音乐" || resource.group === "音效") {
    return findAssetPath(value, { audio: true }) || value;
  }

  return findAssetPath(value, { art: true }) || value;
}

function findAssetPath(value, options = {}) {
  return findCatalogAssetPath(value, state.assetFilePathSet, options);
}

function isAssetField(key, value) {
  const lowerKey = key.toLowerCase();
  return ["value", "portrait", "icon", "model", "avatar", "image", "music", "audio", "background"]
    .some((part) => lowerKey.includes(part)) || resolveAssetPath(value) !== "";
}

function isResourceReferenceField(key) {
  return ["portrait", "picture", "background", "music", "musics", "image", "icon"].includes(key);
}

function getResourceGroupForField(key) {
  if (key === "portrait") {
    return "头像";
  }

  if (key === "music" || key === "musics") {
    return "音乐";
  }

  if (key === "background" || key === "picture" || key === "image") {
    return null;
  }

  return null;
}

function createInlineAssetPreview(path, label) {
  const wrapper = document.createElement("div");
  wrapper.className = "inline-asset";
  const lower = path.toLowerCase();

  if (isImage(lower)) {
    const image = document.createElement("img");
    image.src = `/api/assets/file?path=${encodeURIComponent(path)}`;
    image.alt = label;
    wrapper.appendChild(image);
  } else if (isAudio(lower)) {
    const audio = document.createElement("audio");
    audio.controls = true;
    audio.src = `/api/assets/file?path=${encodeURIComponent(path)}`;
    wrapper.appendChild(audio);
  }

  const text = document.createElement("div");
  text.className = "inline-asset-path";
  text.textContent = path;
  wrapper.appendChild(text);
  return wrapper;
}

function ensureAssetDatalist() {
  const id = "assetPathOptions";
  if (document.getElementById(id)) {
    return id;
  }

  const datalist = document.createElement("datalist");
  datalist.id = id;
  for (const file of state.assetFiles) {
    if (file.path.endsWith(".import")) {
      continue;
    }

    const option = document.createElement("option");
    option.value = file.path;
    datalist.appendChild(option);
  }

  document.body.appendChild(datalist);
  return id;
}

function ensureResourceIdDatalist(group) {
  const id = `resourceIdOptions-${group || "all"}`;
  const existing = document.getElementById(id);
  if (existing) {
    existing.remove();
  }

  const datalist = document.createElement("datalist");
  datalist.id = id;
  const resources = group
    ? state.contentIndex.resourcesByGroup.get(group) || []
    : Array.from(state.contentIndex.resourcesById.values());

  for (const resource of resources) {
    if (typeof resource.id !== "string") {
      continue;
    }

    const option = document.createElement("option");
    option.value = resource.id;
    option.label = typeof resource.value === "string" ? resource.value : "";
    datalist.appendChild(option);
  }

  document.body.appendChild(datalist);
  return id;
}

function ensureResourceGroupDatalist() {
  const id = "resourceGroupOptions";
  const existing = document.getElementById(id);
  if (existing) {
    existing.remove();
  }

  const groups = new Set();
  for (const record of state.formRecords) {
    if (typeof record.group === "string" && record.group.length > 0) {
      groups.add(record.group);
    }
  }

  const datalist = document.createElement("datalist");
  datalist.id = id;
  for (const group of Array.from(groups).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"))) {
    const option = document.createElement("option");
    option.value = group;
    datalist.appendChild(option);
  }

  document.body.appendChild(datalist);
  return id;
}

async function rebuildContentIndex() {
  const definitionsById = new Map();
  const fileSummaries = new Map();
  const parseErrors = [];
  const resourceValues = new Map();
  const resourcesById = new Map();
  const resourcesByGroup = new Map();
  const charactersByIdOrName = new Map();
  const itemsById = new Map();
  const storySpeakers = new Map();
  const referencesByValue = new Map();

  for (const file of state.dataFiles) {
    if (isStorySourceFile(file.path)) {
      fileSummaries.set(file.path, {
        definitions: 0,
        type: "story-dsl",
      });
      continue;
    }

    try {
      const response = await requestJson(`/api/data/file?path=${encodeURIComponent(file.path)}`);
      const json = parseJsonText(response.content);
      indexStaticStringReferences(referencesByValue, file.path, json);
      if (file.path === "resources.json" && Array.isArray(json)) {
        for (const resource of json) {
          if (typeof resource?.id === "string" && typeof resource?.value === "string") {
            resourceValues.set(resource.id, resource.value);
          }

          if (typeof resource?.id === "string") {
            resourcesById.set(resource.id, resource);
            const group = typeof resource.group === "string" ? resource.group : "";
            const groupResources = resourcesByGroup.get(group) || [];
            groupResources.push(resource);
            resourcesByGroup.set(group, groupResources);
          }
        }
      }

      if (file.path === "characters.json" && Array.isArray(json)) {
        for (const character of json) {
          if (typeof character?.id === "string") {
            charactersByIdOrName.set(character.id, character);
          }

          if (typeof character?.name === "string") {
            charactersByIdOrName.set(character.name, character);
          }
        }
      }

      if (file.path === "items.json" && Array.isArray(json)) {
        for (const item of json) {
          if (typeof item?.id === "string") {
            itemsById.set(item.id, item);
          }
        }
      }

      if (file.path.endsWith(".story.json")) {
        for (const speaker of ExtractStorySpeakers(file.path, response.content, json)) {
          storySpeakers.set(speaker.Name, (storySpeakers.get(speaker.Name) || 0) + 1);
        }
      }

      const definitions = extractDefinitions(file.path, response.content, json);
      fileSummaries.set(file.path, {
        definitions: definitions.length,
        type: getDefinitionType(file.path),
      });

      for (const definition of definitions) {
        const existing = definitionsById.get(definition.id) || [];
        existing.push(definition);
        definitionsById.set(definition.id, existing);
      }
    } catch (error) {
      parseErrors.push({
        path: file.path,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  state.contentIndex = {
    ready: true,
    definitionsById,
    fileSummaries,
    duplicateDefinitions: findDuplicateDefinitions(definitionsById),
    parseErrors,
    resourcesById,
    resourcesByGroup,
    charactersByIdOrName,
    itemsById,
    storySpeakers,
    referencesByValue,
  };
  state.resourceValues = resourceValues;

  renderIndexPanel();
  renderSelectionLookup();
  renderSpeakerTool();
  renderPortraitCheckTool();
  renderCharacterCheckTool();
  renderCurrentFileInfo();
  renderProblemIndicators();
}


function indexStaticStringReferences(index, path, root) {
  function add(value, fieldPath, ownerDefinitionId) {
    const normalized = value.trim();
    if (!normalized) return;
    const entries = index.get(normalized) || [];
    entries.push({ path, fieldPath, ownerDefinitionId });
    index.set(normalized, entries);
  }

  function visit(node, fieldPath, ownerDefinitionId) {
    if (typeof node === "string") {
      add(node, fieldPath, ownerDefinitionId);
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((child, index) => {
        const childOwner = fieldPath === "$" && child && typeof child === "object" && typeof child.id === "string"
          ? child.id
          : ownerDefinitionId;
        visit(child, `${fieldPath}[${index}]`, childOwner);
      });
      return;
    }
    if (!node || typeof node !== "object") return;
    const nextOwner = ownerDefinitionId || (typeof node.id === "string" ? node.id : "");
    for (const [key, value] of Object.entries(node)) {
      visit(value, `${fieldPath}.${key}`, nextOwner);
    }
  }

  visit(root, "$", "");
}

function extractDefinitions(path, content, json) {
  if (path.endsWith(".story.json")) {
    const segments = Array.isArray(json?.segments) ? json.segments : [];
    return segments
      .filter((segment) => typeof segment?.name === "string" && segment.name.length > 0)
      .map((segment) => ({
        id: segment.name,
        displayName: segment.name,
        type: "story",
        path,
        line: findJsonPropertyLine(content, "name", segment.name),
      }));
  }

  const records = Array.isArray(json) ? json : [json];
  return records
    .filter((record) => typeof record?.id === "string" && record.id.length > 0)
    .map((record) => ({
      id: record.id,
      displayName: typeof record.name === "string" && record.name.length > 0 ? record.name : record.id,
      type: getDefinitionType(path),
      path,
      line: findJsonPropertyLine(content, "id", record.id),
      record,
    }));
}

function ExtractStorySpeakers(path, content, root) {
  const speakers = [];

  function visit(node) {
    if (Array.isArray(node)) {
      for (const child of node) {
        visit(child);
      }
      return;
    }

    if (!node || typeof node !== "object") {
      return;
    }

    if (typeof node.speaker === "string" && node.speaker.trim().length > 0 && Object.prototype.hasOwnProperty.call(node, "text")) {
      speakers.push({
        Name: node.speaker,
        Path: path,
        Line: findJsonPropertyLine(content, "speaker", node.speaker),
      });
    }

    for (const value of Object.values(node)) {
      visit(value);
    }
  }

  visit(root);
  return speakers;
}

function getDefinitionType(path) {
  if (path.endsWith(".story.json")) {
    return "story";
  }

  return path.replace(/\.json$/i, "");
}

function findJsonPropertyLine(content, propertyName, value) {
  const escapedValue = escapeRegExp(JSON.stringify(value).slice(1, -1));
  const pattern = new RegExp(`"${escapeRegExp(propertyName)}"\\s*:\\s*"${escapedValue}"`);
  const match = pattern.exec(content);
  if (!match) {
    return 1;
  }

  return content.slice(0, match.index).split("\n").length;
}

function findDuplicateDefinitions(definitionsById) {
  const duplicates = [];
  for (const [id, definitions] of definitionsById.entries()) {
    const byType = new Map();
    for (const definition of definitions) {
      const key = definition.type;
      const group = byType.get(key) || [];
      group.push(definition);
      byType.set(key, group);
    }

    for (const [type, group] of byType.entries()) {
      if (group.length > 1) {
        duplicates.push({ id, type, count: group.length, definitions: group });
      }
    }
  }

  return duplicates;
}

function renderIndexPanel() {
  elements.indexBox.replaceChildren();

  if (!state.contentIndex.ready) {
    elements.indexBox.className = "index-box muted";
    elements.indexBox.textContent = "正在建立索引";
    return;
  }

  elements.indexBox.className = "index-box";
  const summary = state.contentIndex.fileSummaries.get(state.currentPath);
  const totalDefinitions = Array.from(state.contentIndex.definitionsById.values())
    .reduce((total, definitions) => total + definitions.length, 0);

  appendIndexRow(elements.indexBox, "全局定义", String(totalDefinitions));
  appendIndexRow(elements.indexBox, "当前文件", summary ? `${summary.definitions} 条 ${summary.type}` : "-");

  if (state.contentIndex.parseErrors.length > 0) {
    const line = document.createElement("div");
    line.className = "warning-line";
    line.textContent = `解析失败：${state.contentIndex.parseErrors.length} 个文件`;
    elements.indexBox.appendChild(line);
  }

  if (state.contentIndex.duplicateDefinitions.length > 0) {
    const line = document.createElement("div");
    line.className = "warning-line";
    line.textContent = `重复定义：${state.contentIndex.duplicateDefinitions.length} 组`;
    elements.indexBox.appendChild(line);
  }
}

function appendIndexRow(parent, label, value) {
  const row = document.createElement("div");
  row.className = "index-row";

  const labelNode = document.createElement("span");
  labelNode.className = "index-label";
  labelNode.textContent = label;

  const valueNode = document.createElement("span");
  valueNode.className = "index-value";
  valueNode.textContent = value;

  row.append(labelNode, valueNode);
  parent.appendChild(row);
}

function renderSelectionLookup() {
  elements.selectionBox.replaceChildren();

  const selected = getSelectedLookupText();
  if (!selected) {
    elements.selectionBox.className = "index-box muted";
    elements.selectionBox.textContent = "选中 JSON 字符串后显示定义";
    return;
  }

  const definitions = state.contentIndex.definitionsById.get(selected) || [];
  elements.selectionBox.className = "index-box";
  appendIndexRow(elements.selectionBox, "文本", selected);

  if (definitions.length === 0) {
    const empty = document.createElement("div");
    empty.className = "warning-line";
    empty.textContent = "未找到定义";
    elements.selectionBox.appendChild(empty);
    return;
  }

  const list = document.createElement("div");
  list.className = "definition-list";
  for (const definition of definitions) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "definition-button";
    button.textContent = `${definition.type}: ${definition.path}:${definition.line}`;
    button.addEventListener("click", () => revealDefinition(definition));
    list.appendChild(button);
  }

  elements.selectionBox.appendChild(list);
}

function renderSpeakerTool(target = null) {
  const container = target || elements.speakerToolBox;
  if (!container) {
    return;
  }

  container.replaceChildren();

  const description = document.createElement("div");
  description.className = "static-tool-note";
  description.textContent = "直接注册可用于 dialogue speaker 的最小对白角色，并按需补头像资源。它不同于创建完整伙伴。头像路径可填 head/qingbing 或 art/head/qingbing.png。";

  const idInput = createToolInput("speakerId", "说话人 id", "清兵");
  const nameInput = createToolInput("speakerName", "显示名", "清兵");
  const portraitInput = createToolInput("speakerPortrait", "头像资源 id", "头像.清兵");
  portraitInput.setAttribute("list", ensureResourceIdDatalist("头像"));
  const assetInput = createToolInput("speakerAsset", "头像路径 value", "head/qingbing");
  assetInput.setAttribute("list", ensureAssetDatalist());
  const assetStatus = document.createElement("div");
  assetStatus.className = "speaker-asset-preview muted";
  let speakerAutoValues = {
    name: "",
    portraitId: "",
    assetValue: "",
    gender: "neutral",
  };
  const speakerManualFields = {
    name: false,
    portraitId: false,
    assetValue: false,
    gender: false,
  };

  const genderSelect = document.createElement("select");
  genderSelect.className = "tool-input";
  for (const [value, label] of [["neutral", "neutral"], ["male", "male"], ["female", "female"]]) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    genderSelect.appendChild(option);
  }

  idInput.addEventListener("input", () => {
    applySpeakerDefaults(false);
  });
  nameInput.addEventListener("input", () => {
    speakerManualFields.name = true;
  });
  portraitInput.addEventListener("input", () => {
    speakerManualFields.portraitId = true;
    if (!speakerManualFields.assetValue) {
      applySpeakerDefaults(false);
    }
  });
  assetInput.addEventListener("input", () => {
    speakerManualFields.assetValue = true;
    renderSpeakerAssetStatus(assetInput.value, assetStatus);
  });
  genderSelect.addEventListener("change", () => {
    speakerManualFields.gender = true;
  });

  const selectedButton = document.createElement("button");
  selectedButton.type = "button";
  selectedButton.textContent = "使用选中文本";
  selectedButton.addEventListener("click", () => {
    const selected = getSelectedLookupText();
    if (!selected) {
      return;
    }

    idInput.value = selected;
    resetSpeakerManualFields();
    applySpeakerDefaults(true);
  });

  const createButton = document.createElement("button");
  createButton.type = "button";
  createButton.className = "primary";
  createButton.textContent = "注册对白角色与头像";

  const status = document.createElement("div");
  status.className = "static-tool-status muted";

  createButton.addEventListener("click", async () => {
    if (state.dirty && (state.currentPath === "characters.json" || state.currentPath === "resources.json")) {
      status.className = "static-tool-status bad";
      status.textContent = "当前 characters/resources 有未保存改动，请先保存或切换文件后再创建。";
      return;
    }

    const speakerId = idInput.value.trim();
    if (!speakerId) {
      status.className = "static-tool-status bad";
      status.textContent = "请先填写对白角色 ID。";
      return;
    }
    const portraitId = portraitInput.value.trim() || `头像.${speakerId}`;
    const assetValue = assetInput.value.trim();
    if (!portraitId.startsWith("头像.") || portraitId.length <= "头像.".length) {
      status.className = "static-tool-status bad";
      status.textContent = "头像资源 ID 必须使用“头像.中文名”格式。";
      return;
    }
    const existingCharacter = (state.contentIndex.definitionsById.get(speakerId) || [])
      .some((definition) => definition.type === "characters");
    if (existingCharacter) {
      status.className = "static-tool-status bad";
      status.textContent = `角色 ID 已存在：${speakerId}。请编辑已有角色，不要重复注册。`;
      return;
    }
    const existingResource = state.contentIndex.resourcesById.get(portraitId);
    if (existingResource && (existingResource.group !== "头像" || existingResource.value !== assetValue)) {
      status.className = "static-tool-status bad";
      status.textContent = `头像资源冲突：${portraitId} 已指向 ${existingResource.value || "空 value"}，不能改绑到 ${assetValue || "空 value"}。`;
      return;
    }
    const resourceAction = existingResource ? "复用已存在且路径一致的头像资源" : "创建新的头像资源";
    if (!confirmAction(`确认直接注册对白角色？\n\n角色 ID：${speakerId}\n显示名：${nameInput.value.trim() || speakerId}\n性别：${genderSelect.value}\n头像资源：${portraitId}\n头像 value：${assetValue}\n资源操作：${resourceAction}\n\n该操作会立即写入 characters.json${existingResource ? "" : " 和 resources.json"}。`)) {
      return;
    }

    createButton.disabled = true;
    status.className = "static-tool-status muted";
    status.textContent = "正在创建...";

    try {
      const result = await requestJson("/api/static/speaker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: idInput.value,
          name: nameInput.value,
          portraitId: portraitInput.value,
          assetValue: assetInput.value,
          gender: genderSelect.value,
        }),
      });

      await loadDataFiles();
      await rebuildContentIndex();
      renderFileList();
      showValidation(result.validation.ok, result.validation.message);
      status.className = "static-tool-status ok";
      status.textContent = `已创建：${result.id} / ${result.portraitId}`;

      if (state.currentPath === "characters.json" || state.currentPath === "resources.json") {
        await openDataFile(state.currentPath);
        if (state.mode === "characters" && state.currentPath === "characters.json") {
          const index = state.formRecords.findIndex((record) => record?.id === result.id);
          if (index >= 0) state.selectedRecordIndex = index;
          renderCharacterWorkspaceView();
        }
      }
    } catch (error) {
      status.className = "static-tool-status bad";
      status.textContent = error.message;
    } finally {
      createButton.disabled = false;
    }
  });

  container.append(
    description,
    createToolField("说话人 id", idInput),
    createToolField("显示名", nameInput),
    createToolField("头像资源", portraitInput),
    createToolField("头像路径", assetInput),
    assetStatus,
    createToolField("性别", genderSelect),
    selectedButton,
    createButton,
    status
  );

  function resetSpeakerManualFields() {
    speakerManualFields.name = false;
    speakerManualFields.portraitId = false;
    speakerManualFields.assetValue = false;
    speakerManualFields.gender = false;
  }

  function applySpeakerDefaults(force) {
    const explicitPortraitId = speakerManualFields.portraitId ? portraitInput.value : "";
    const defaults = getSpeakerDefaults(idInput.value, explicitPortraitId);
    if (!defaults.id) {
      return;
    }

    if (force || !speakerManualFields.name || nameInput.value === speakerAutoValues.name) {
      nameInput.value = defaults.name;
    }

    if (force || !speakerManualFields.portraitId || portraitInput.value === speakerAutoValues.portraitId) {
      portraitInput.value = defaults.portraitId;
    }

    if (force || !speakerManualFields.assetValue || assetInput.value === speakerAutoValues.assetValue) {
      assetInput.value = defaults.assetValue;
    }

    if (force || !speakerManualFields.gender || genderSelect.value === speakerAutoValues.gender) {
      genderSelect.value = defaults.gender;
    }

    speakerAutoValues = defaults;
    renderSpeakerAssetStatus(assetInput.value, assetStatus);
  }
}

function openSpeakerToolDialog() {
  const content = document.createElement("div");
  content.className = "tool-dialog-content";
  const toolBox = document.createElement("div");
  toolBox.className = "static-tool";
  content.appendChild(toolBox);
  openToolDialog("注册对白角色", "直接写入最小对白角色和头像资源；不会创建完整伙伴配置。", content);
  renderSpeakerTool(toolBox);
}

function openNewStoryDialog() {
  const content = document.createElement("form");
  content.className = "tool-dialog-content";

  const fileInput = createToolInput("newStoryFileName", "文件名", "book-shujian");
  const segmentInput = createToolInput("newStorySegmentName", "首段名", "书剑入口");
  const status = document.createElement("div");
  status.className = "static-tool-status muted";
  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.className = "primary";
  submitButton.textContent = "创建并打开";

  content.append(
    createToolField("文件名", fileInput),
    createToolField("首段名", segmentInput),
    submitButton,
    status
  );

  content.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!(await confirmDiscardChanges())) {
      return;
    }

    submitButton.disabled = true;
    status.className = "static-tool-status muted";
    status.textContent = "正在创建...";
    try {
      const result = await requestJson("/api/story/source/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: fileInput.value,
          segmentName: segmentInput.value,
        }),
      });
      await loadDataFiles();
      await rebuildContentIndex();
      await loadStoryGraph();
      renderFileList();
      closeToolDialog();
      dirtyStateController.markClean({ render: false });
      renderDirtyState();
      setMode("data");
      await openDataFile(result.path);
      showValidation(true, `已创建 ${result.path}，保存后会生成 ${result.compiledJsonPath}。`);
    } catch (error) {
      status.className = "static-tool-status bad";
      status.textContent = error instanceof Error ? error.message : String(error);
    } finally {
      submitButton.disabled = false;
    }
  });

  openToolDialog("新建 Story", "在当前 MOD 的 data/story 目录下创建 .story 源文件。", content);
  fileInput.focus();
  fileInput.select();
}

function openToolDialog(title, subtitle, content) {
  return dialogController.open({ title, subtitle, content });
}

function closeToolDialog() {
  dialogController.close();
}

function runPortraitCheckFromToolbar() {
  focusCheckResults();
  const button = elements.portraitCheckBox.querySelector("button");
  button?.click();
}

function focusCheckResults() {
  setContextDrawerOpen(true);
  requestAnimationFrame(() => {
    elements.characterCheckBox.scrollIntoView({ block: "nearest" });
  });
}

function getSpeakerDefaults(rawId, explicitPortraitId) {
  const id = rawId.trim();
  if (!id) {
    return {
      id: "",
      name: "",
      portraitId: "",
      assetValue: "",
      gender: "neutral",
    };
  }

  const character = state.contentIndex.charactersByIdOrName.get(id);
  const name = typeof character?.name === "string" && character.name.trim()
    ? character.name.trim()
    : id;
  const portraitId = typeof character?.portrait === "string" && character.portrait.trim()
    ? character.portrait.trim()
    : explicitPortraitId.trim() && explicitPortraitId.trim() !== "头像."
      ? explicitPortraitId.trim()
      : `头像.${id}`;
  const resource = state.contentIndex.resourcesById.get(portraitId);
  const assetValue = typeof resource?.value === "string" && resource.value.trim()
    ? normalizeToolAssetValue(resource.value)
    : detectSpeakerPortraitAssetValue(id, name) || `head/${id}`;
  const gender = ["male", "female", "neutral"].includes(character?.gender)
    ? character.gender
    : "neutral";

  return {
    id,
    name,
    portraitId,
    assetValue,
    gender,
  };
}

function detectSpeakerPortraitAssetValue(id, name) {
  const candidates = [];
  for (const value of [id, name, toPinyinSlug(id), toPinyinSlug(name)]) {
    const normalized = normalizeToolSearchValue(value);
    if (!normalized) {
      continue;
    }

    candidates.push(`head/${normalized}`);
  }

  for (const candidate of candidates) {
    const found = findAssetPath(candidate, { art: true });
    if (found) {
      return normalizeToolAssetValue(found);
    }
  }

  const wanted = new Set(candidates.map((candidate) => normalizeToolSearchValue(candidate.split("/").pop() || "")));
  for (const file of state.assetFiles) {
    if (!file.path.toLowerCase().startsWith("art/head/") || !isImage(file.path.toLowerCase())) {
      continue;
    }

    const basename = normalizeToolSearchValue((file.name || file.path.split("/").pop() || "").replace(/\.[^.]+$/i, ""));
    if (wanted.has(basename)) {
      return normalizeToolAssetValue(file.path);
    }
  }

  return "";
}

function renderSpeakerAssetStatus(value, statusNode) {
  statusNode.replaceChildren();
  const found = findAssetPath(value, { art: true });
  if (found) {
    statusNode.className = "speaker-asset-preview ok";

    const image = document.createElement("img");
    image.src = `/api/assets/file?path=${encodeURIComponent(found)}`;
    image.alt = found;

    const info = document.createElement("div");
    const label = document.createElement("div");
    label.className = "speaker-asset-preview-label";
    label.textContent = "已找到真实文件";
    const path = document.createElement("button");
    path.type = "button";
    path.className = "speaker-asset-preview-path";
    path.textContent = `assets/${found}`;
    path.title = "打开资产预览";
    path.addEventListener("click", () => {
      setMode("assets");
      openAssetFile(found);
    });

    const normalizeButton = document.createElement("button");
    normalizeButton.type = "button";
    normalizeButton.className = "speaker-asset-action";
    normalizeButton.textContent = "规范化512";
    normalizeButton.addEventListener("click", async () => {
      normalizeButton.disabled = true;
      label.textContent = "正在规范化...";
      try {
        const result = await normalizePortraitAsset(found);
        await loadAssetFiles();
        label.textContent = `已规范化为 512x512，备份：${result.backupPath || "无"}`;
        image.src = `/api/assets/file?path=${encodeURIComponent(found)}&v=${Date.now()}`;
      } catch (error) {
        label.textContent = formatNormalizePortraitError(error);
      } finally {
        normalizeButton.disabled = false;
      }
    });

    info.append(label, path, normalizeButton);

    statusNode.append(image, info);
    return;
  }

  statusNode.className = "speaker-asset-preview muted";
  statusNode.textContent = "未找到同名图片；创建数据前请确认 assets/art/head 下已有头像 PNG。";
}

async function normalizePortraitAsset(assetPath) {
  const lower = assetPath.toLowerCase();
  const supportedFolder = lower.startsWith("art/head/") || lower.startsWith("art/item/");
  if (!supportedFolder || !lower.endsWith(".png")) {
    throw new Error("目前只支持规范化 assets/art/head 或 assets/art/item 下的 PNG 图片。");
  }

  const image = await loadImage(`/api/assets/file?path=${encodeURIComponent(assetPath)}&v=${Date.now()}`);
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, 512, 512);

  const scale = Math.min(512 / image.naturalWidth, 512 / image.naturalHeight);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const x = Math.round((512 - width) / 2);
  const y = Math.round((512 - height) / 2);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, x, y, width, height);

  const pngBase64 = canvas.toDataURL("image/png").split(",", 2)[1];
  return requestJson("/api/assets/portrait/normalize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: assetPath,
      pngBase64,
    }),
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图片读取失败，无法规范化。"));
    image.src = src;
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("图片读取失败，无法上传。"));
    reader.readAsDataURL(file);
  });
}

function formatNormalizePortraitError(error) {
  const message = error instanceof Error ? error.message : String(error);
  if (message === "Not Found" || message.includes("404")) {
    return "工具后端未更新，请重启 JsonEditor 服务后再点规范化512。";
  }

  return message;
}

function normalizeToolAssetValue(value) {
  return normalizeArtAssetValue(value);
}

function normalizeToolSearchValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll("\\", "/")
    .replace(/^res:\/\/assets\/art\//i, "")
    .replace(/^assets\/art\//i, "")
    .replace(/^art\//i, "")
    .replace(/\.(png|jpg|jpeg|webp)$/i, "")
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "");
}

function toPinyinSlug(value) {
  const table = {
    阿: "a", 敖: "ao", 白: "bai", 包: "bao", 宝: "bao", 北: "bei", 本: "ben", 冰: "bing", 伯: "bo", 博: "bo",
    蔡: "cai", 常: "chang", 陈: "chen", 程: "cheng", 崇: "chong", 仇: "chou", 春: "chun",
    达: "da", 大: "da", 丁: "ding", 狄: "di", 段: "duan", 多: "duo",
    范: "fan", 方: "fang", 菲: "fei", 冯: "feng", 福: "fu",
    高: "gao", 公: "gong", 关: "guan", 桂: "gui", 郭: "guo",
    海: "hai", 韩: "han", 和: "he", 何: "he", 赫: "he", 洪: "hong", 胡: "hu", 花: "hua", 华: "hua", 霍: "huo", 黄: "huang",
    家: "jia", 蒋: "jiang", 金: "jin", 镜: "jing",
    康: "kang", 柯: "ke", 空: "kong",
    来: "lai", 蓝: "lan", 郎: "lang", 李: "li", 梁: "liang", 廖: "liao", 林: "lin", 凌: "ling", 刘: "liu", 陆: "lu", 洛: "luo", 罗: "luo",
    马: "ma", 苗: "miao", 闵: "min", 木: "mu", 慕: "mu",
    南: "nan", 宁: "ning",
    欧: "ou",
    彭: "peng", 平: "ping",
    祁: "qi", 齐: "qi", 乾: "qian", 青: "qing", 丘: "qiu",
    任: "ren", 茹: "ru", 阮: "ruan",
    石: "shi", 士: "shi", 双: "shuang", 水: "shui", 苏: "su",
    泰: "tai", 谭: "tan", 唐: "tang", 天: "tian", 田: "tian", 铁: "tie", 童: "tong",
    万: "wan", 王: "wang", 韦: "wei", 卫: "wei", 文: "wen", 闻: "wen", 无: "wu", 吴: "wu",
    夏: "xia", 香: "xiang", 萧: "xiao", 小: "xiao", 谢: "xie", 心: "xin", 星: "xing", 徐: "xu", 许: "xu", 薛: "xue",
    杨: "yang", 阳: "yang", 姚: "yao", 叶: "ye", 殷: "yin", 英: "ying", 余: "yu", 鱼: "yu", 袁: "yuan", 岳: "yue",
    张: "zhang", 章: "zhang", 赵: "zhao", 郑: "zheng", 周: "zhou", 朱: "zhu", 庄: "zhuang", 卓: "zhuo",
  };

  let result = "";
  for (const char of String(value || "").trim()) {
    if (/[a-z0-9]/i.test(char)) {
      result += char.toLowerCase();
    } else if (table[char]) {
      result += table[char];
    }
  }

  return result;
}

function renderPortraitCheckTool() {
  elements.portraitCheckBox.replaceChildren();

  const description = document.createElement("div");
  description.className = "static-tool-note";
  description.textContent = "静态检查角色 portrait、头像资源、剧情 speaker 与头像图片尺寸/透明度。只检查，不自动修改数据或图片。";

  const checkButton = document.createElement("button");
  checkButton.type = "button";
  checkButton.className = "primary";
  checkButton.textContent = "检查头像";

  const status = document.createElement("div");
  status.className = "static-tool-status muted";

  const resultBox = document.createElement("div");
  resultBox.className = "portrait-check-result";

  checkButton.addEventListener("click", async () => {
    checkButton.disabled = true;
    status.className = "static-tool-status muted";
    status.textContent = "正在检查...";
    resultBox.replaceChildren();

    try {
      state.portraitCheck = await requestJson("/api/static/portraits/check");
      status.className = `static-tool-status ${state.portraitCheck.ok ? "ok" : "bad"}`;
      status.textContent = state.portraitCheck.ok ? "检查完成，没有阻断问题。" : "检查完成，发现需要处理的问题。";
      renderPortraitCheckResult(resultBox, state.portraitCheck);
      state.problemCenter.lastCheckedAt = new Date().toISOString();
      renderProblemIndicators();
    } catch (error) {
      state.portraitCheck = null;
      renderProblemIndicators();
      status.className = "static-tool-status bad";
      status.textContent = error.message;
    } finally {
      checkButton.disabled = false;
    }
  });

  elements.portraitCheckBox.append(description, checkButton, status, resultBox);

  if (state.portraitCheck) {
    status.className = `static-tool-status ${state.portraitCheck.ok ? "ok" : "bad"}`;
    status.textContent = state.portraitCheck.ok ? "上次检查没有阻断问题。" : "上次检查发现问题。";
    renderPortraitCheckResult(resultBox, state.portraitCheck);
  }
}

function renderPortraitCheckResult(parent, result) {
  parent.replaceChildren();
  const summary = result.summary;

  const summaryGrid = document.createElement("div");
  summaryGrid.className = "portrait-summary";
  summaryGrid.append(
    createPortraitMetric("角色", summary.characterCount),
    createPortraitMetric("头像资源", summary.portraitResourceCount),
    createPortraitMetric("剧情说话", summary.storySpeakerCount),
    createPortraitMetric("已查图片", summary.checkedPortraitCount),
    createPortraitMetric("错误", summary.errors, "error"),
    createPortraitMetric("警告", summary.warnings, "warn"),
    createPortraitMetric("提示", summary.infos, "info")
  );
  parent.appendChild(summaryGrid);

  if (!Array.isArray(result.issues) || result.issues.length === 0) {
    const empty = document.createElement("div");
    empty.className = "portrait-empty ok";
    empty.textContent = "头像链路看起来都通。";
    parent.appendChild(empty);
    return;
  }

  const list = document.createElement("div");
  list.className = "portrait-issue-list";
  for (const issue of result.issues.slice(0, 120)) {
    list.appendChild(createPortraitIssueRow(issue));
  }

  parent.appendChild(list);

  if (result.issues.length > 120) {
    const more = document.createElement("div");
    more.className = "static-tool-note";
    more.textContent = `仅显示前 120 条，共 ${result.issues.length} 条。`;
    parent.appendChild(more);
  }
}

function createPortraitMetric(label, value, severity = "") {
  const item = document.createElement("div");
  item.className = `portrait-metric ${severity}`;
  const valueNode = document.createElement("strong");
  valueNode.textContent = String(value);
  const labelNode = document.createElement("span");
  labelNode.textContent = label;
  item.append(valueNode, labelNode);
  return item;
}

function createPortraitIssueRow(issue) {
  const row = document.createElement("div");
  row.className = `portrait-issue ${issue.severity || "info"}`;

  const badge = document.createElement("span");
  badge.className = "portrait-issue-badge";
  badge.textContent = issue.severity === "error" ? "错误" : issue.severity === "warn" ? "警告" : "提示";

  const message = document.createElement("div");
  message.className = "portrait-issue-message";
  message.textContent = issue.message;

  const meta = document.createElement("div");
  meta.className = "portrait-issue-meta";
  meta.textContent = [
    issue.area,
    issue.definitionId,
    issue.dataPath ? `${issue.dataPath}${issue.line ? `:${issue.line}` : ""}` : "",
    issue.assetPath || "",
  ].filter(Boolean).join(" · ");

  const actions = document.createElement("div");
  actions.className = "portrait-issue-actions";
  if (issue.dataPath) {
    const dataButton = document.createElement("button");
    dataButton.type = "button";
    dataButton.textContent = "打开数据";
    dataButton.addEventListener("click", async () => {
      setMode("data");
      await openDataFile(issue.dataPath);
      if (issue.line) {
        selectLine(issue.line);
      }
    });
    actions.appendChild(dataButton);
  }

  if (issue.assetPath && issue.assetExists) {
    const assetButton = document.createElement("button");
    assetButton.type = "button";
    assetButton.textContent = "预览图片";
    assetButton.addEventListener("click", () => {
      setMode("assets");
      openAssetFile(issue.assetPath);
    });
    actions.appendChild(assetButton);
  }

  row.append(badge, message, meta, actions);
  return row;
}

function renderCharacterCheckTool() {
  elements.characterCheckBox.replaceChildren();

  if (isItemFile()) {
    renderItemCheckTool();
    return;
  }

  if (!isCharacterFile() || state.formRecords.length === 0) {
    const empty = document.createElement("div");
    empty.className = "static-tool-note";
    empty.textContent = "选择 characters.json 中的角色后，这里会显示当前角色的引用和配置检查。";
    elements.characterCheckBox.appendChild(empty);
    return;
  }

  const record = state.formRecords[state.selectedRecordIndex];
  if (!record) {
    const empty = document.createElement("div");
    empty.className = "static-tool-note";
    empty.textContent = "未选择角色。";
    elements.characterCheckBox.appendChild(empty);
    return;
  }

  const portraitInfo = getCharacterPortraitInfo(record);
  const issues = getCharacterValidationIssues(record);
  const summary = document.createElement("div");
  summary.className = "portrait-summary";
  summary.append(
    createPortraitMetric("角色", 1),
    createPortraitMetric("问题", issues.length, issues.some((issue) => issue.severity === "error") ? "error" : issues.length > 0 ? "warn" : "info"),
    createPortraitMetric("有资源", portraitInfo.resourceExists ? 1 : 0, portraitInfo.resourceExists ? "info" : "error"),
    createPortraitMetric("有图片", portraitInfo.assetExists ? 1 : 0, portraitInfo.assetExists ? "info" : "error"),
  );
  elements.characterCheckBox.appendChild(summary);

  if (issues.length === 0) {
    const ok = document.createElement("div");
    ok.className = "portrait-empty ok";
    ok.textContent = "当前角色没有明显的引用或配置问题。";
    elements.characterCheckBox.appendChild(ok);
    return;
  }

  const list = document.createElement("div");
  list.className = "portrait-issue-list";
  for (const issue of issues) {
    const row = document.createElement("div");
    row.className = `portrait-issue ${issue.severity || "warn"}`;
    const badge = document.createElement("span");
    badge.className = "portrait-issue-badge";
    badge.textContent = issue.severity === "error" ? "错误" : "警告";
    const message = document.createElement("div");
    message.className = "portrait-issue-message";
    message.textContent = issue.message;
    const meta = document.createElement("div");
    meta.className = "portrait-issue-meta";
    meta.textContent = issue.definitionId || "当前角色";
    const actions = document.createElement("div");
    actions.className = "portrait-issue-actions";
    if (issue.definitionId && Array.isArray(issue.types) && issue.types.length > 0) {
      const openButton = document.createElement("button");
      openButton.type = "button";
      openButton.textContent = "打开定义";
      openButton.addEventListener("click", () => revealDefinitionById(issue.definitionId, issue.types));
      actions.appendChild(openButton);
    }
    row.append(badge, message, meta, actions);
    list.appendChild(row);
  }
  elements.characterCheckBox.appendChild(list);
}

function renderItemCheckTool() {
  if (state.formRecords.length === 0) {
    const empty = document.createElement("div");
    empty.className = "static-tool-note";
    empty.textContent = "选择 items.json 中的物品后，这里会显示当前物品的图片和引用检查。";
    elements.characterCheckBox.appendChild(empty);
    return;
  }

  const record = state.formRecords[state.selectedRecordIndex];
  if (!record) {
    const empty = document.createElement("div");
    empty.className = "static-tool-note";
    empty.textContent = "未选择物品。";
    elements.characterCheckBox.appendChild(empty);
    return;
  }

  const pictureInfo = getItemPictureInfo(record);
  const issues = getItemValidationIssues(record);
  const summary = document.createElement("div");
  summary.className = "portrait-summary";
  summary.append(
    createPortraitMetric("物品", 1),
    createPortraitMetric("问题", issues.length, issues.some((issue) => issue.severity === "error") ? "error" : issues.length > 0 ? "warn" : "info"),
    createPortraitMetric("有资源", pictureInfo.resourceExists ? 1 : 0, pictureInfo.resourceExists ? "info" : "error"),
    createPortraitMetric("有图片", pictureInfo.assetExists ? 1 : 0, pictureInfo.assetExists ? "info" : "error"),
  );
  elements.characterCheckBox.appendChild(summary);

  if (issues.length === 0) {
    const ok = document.createElement("div");
    ok.className = "portrait-empty ok";
    ok.textContent = "当前物品没有明显的图片或引用问题。";
    elements.characterCheckBox.appendChild(ok);
    return;
  }

  const list = document.createElement("div");
  list.className = "portrait-issue-list";
  for (const issue of issues) {
    const row = document.createElement("div");
    row.className = `portrait-issue ${issue.severity || "warn"}`;
    const badge = document.createElement("span");
    badge.className = "portrait-issue-badge";
    badge.textContent = issue.severity === "error" ? "错误" : "警告";
    const message = document.createElement("div");
    message.className = "portrait-issue-message";
    message.textContent = issue.message;
    const meta = document.createElement("div");
    meta.className = "portrait-issue-meta";
    meta.textContent = issue.definitionId || "当前物品";
    const actions = document.createElement("div");
    actions.className = "portrait-issue-actions";
    if (issue.definitionId && Array.isArray(issue.types) && issue.types.length > 0) {
      const openButton = document.createElement("button");
      openButton.type = "button";
      openButton.textContent = "打开定义";
      openButton.addEventListener("click", () => revealDefinitionById(issue.definitionId, issue.types));
      actions.appendChild(openButton);
    }
    row.append(badge, message, meta, actions);
    list.appendChild(row);
  }
  elements.characterCheckBox.appendChild(list);
}

async function revealDefinitionById(id, types) {
  const definitions = state.contentIndex.definitionsById.get(id) || [];
  const definition = definitions.find((candidate) => types.includes(candidate.type));
  if (!definition) {
    return;
  }

  await revealDefinition(definition);
}

function createPortraitResource(portraitId, assetValue) {
  return requestJson("/api/static/portrait-resource", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      portraitId,
      assetValue,
    }),
  });
}

function updatePortraitResource(portraitId, assetValue, expectedAssetValue) {
  return requestJson("/api/static/portrait-resource", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      portraitId,
      assetValue,
      expectedAssetValue,
    }),
  });
}

function createItemResource(pictureId, assetValue) {
  return requestJson("/api/static/item-resource", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pictureId,
      assetValue,
    }),
  });
}

function createGenericResource(id, group, value) {
  return requestJson("/api/static/resource", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id,
      group,
      value,
    }),
  });
}

function getBindableItemPictureId(record) {
  const current = typeof record?.picture === "string" ? record.picture.trim() : "";
  if (current) {
    return current;
  }

  const itemId = typeof record?.id === "string" && record.id.trim()
    ? record.id.trim()
    : "新物品";
  return `物品.${itemId}`;
}

async function uploadItemImageAndBind(record, file, pictureId) {
  const dataUrl = await readFileAsDataUrl(file);
  const [, mimeType = "application/octet-stream", base64 = ""] = dataUrl.match(/^data:([^;]+);base64,(.+)$/) || [];
  if (!base64) {
    throw new Error("图片读取失败，未拿到可上传的数据。");
  }

  return requestJson("/api/assets/item/upload-bind", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      itemId: typeof record?.id === "string" ? record.id.trim() : "",
      pictureId,
      fileName: file.name,
      mimeType,
      imageBase64: base64,
    }),
  });
}

function openPortraitPicker(initialAssetPath = "") {
  state.portraitPicker.open = true;
  state.portraitPicker.search = "";
  state.portraitPicker.selectedAssetPath = initialAssetPath || getCurrentCharacterPortraitAssetPath();
  renderPortraitPicker();
}

function closePortraitPicker() {
  state.portraitPicker.open = false;
  state.portraitPicker.search = "";
  state.portraitPicker.selectedAssetPath = "";
  renderPortraitPicker();
}

function getCurrentCharacterRecord() {
  if (!isCharacterFile()) {
    return null;
  }

  return state.formRecords[state.selectedRecordIndex] || null;
}

function getCurrentCharacterPortraitAssetPath() {
  const record = getCurrentCharacterRecord();
  if (!record) {
    return "";
  }

  return getCharacterPortraitInfo(record).previewPath || "";
}

function openItemPicturePicker(initialAssetPath = "") {
  state.itemPicturePicker.open = true;
  state.itemPicturePicker.search = "";
  state.itemPicturePicker.selectedAssetPath = initialAssetPath || getCurrentItemPictureAssetPath();
  renderItemPicturePicker();
}

function closeItemPicturePicker() {
  state.itemPicturePicker.open = false;
  state.itemPicturePicker.search = "";
  state.itemPicturePicker.selectedAssetPath = "";
  renderItemPicturePicker();
}

function getCurrentItemRecord() {
  if (!isItemFile()) {
    return null;
  }

  return state.formRecords[state.selectedRecordIndex] || null;
}

function getCurrentItemPictureAssetPath() {
  const record = getCurrentItemRecord();
  if (!record) {
    return "";
  }

  return getItemPictureInfo(record).previewPath || "";
}

function openShopResourcePicker(field, initialAssetPath = "") {
  if (field !== "background" && field !== "music") {
    return;
  }

  state.shopResourcePicker.open = true;
  state.shopResourcePicker.field = field;
  state.shopResourcePicker.search = "";
  state.shopResourcePicker.selectedAssetPath = initialAssetPath || getCurrentShopResourceAssetPath(field);
  renderShopResourcePicker();
}

function closeShopResourcePicker() {
  state.shopResourcePicker.open = false;
  state.shopResourcePicker.field = "";
  state.shopResourcePicker.search = "";
  state.shopResourcePicker.selectedAssetPath = "";
  renderShopResourcePicker();
}

function openMapResourcePicker(context) {
  const record = isMapFile() ? state.formRecords[state.selectedRecordIndex] : null;
  const location = record?.locations?.[context.locationIndex];
  const owner = context.eventIndex >= 0 ? location?.events?.[context.eventIndex] : location;
  if (!owner || (context.field !== "picture" && context.field !== "image")) {
    return;
  }

  const currentResourceId = typeof owner[context.field] === "string" ? owner[context.field].trim() : "";
  const currentGroup = state.contentIndex.resourcesById.get(currentResourceId)?.group || "";
  state.mapEditor.resourcePicker = {
    open: true,
    locationIndex: context.locationIndex,
    eventIndex: context.eventIndex,
    field: context.field,
    filter: currentGroup && currentGroup !== "town" && currentGroup !== "头像" ? "all" : "recommended",
    search: "",
    selectedResourceId: currentResourceId,
  };
  renderMapResourcePicker();
}

function closeMapResourcePicker() {
  state.mapEditor.resourcePicker = {
    open: false,
    locationIndex: -1,
    eventIndex: -1,
    field: "",
    filter: "recommended",
    search: "",
    selectedResourceId: "",
  };
  renderMapResourcePicker();
}

function getCurrentMapResourcePickerTarget() {
  if (!isMapFile()) {
    return null;
  }
  const picker = state.mapEditor.resourcePicker;
  const record = state.formRecords[state.selectedRecordIndex];
  const location = record?.locations?.[picker.locationIndex];
  const owner = picker.eventIndex >= 0 ? location?.events?.[picker.eventIndex] : location;
  if (!record || !location || !owner || (picker.field !== "picture" && picker.field !== "image")) {
    return null;
  }
  return { record, location, owner, picker };
}

function getMapIconResources() {
  return Array.from(state.contentIndex.resourcesById.values())
    .filter((resource) => {
      if (typeof resource?.id !== "string") {
        return false;
      }
      const assetPath = resolveResourceAssetPath(resource);
      return Boolean(assetPath && isImage(assetPath.toLowerCase()));
    })
    .sort((left, right) => {
      const rank = (resource) => resource.group === "town" ? 0 : resource.group === "头像" ? 1 : 2;
      return rank(left) - rank(right) || left.id.localeCompare(right.id, "zh-Hans-CN");
    });
}

function matchesMapResourcePickerFilter(resource, filter) {
  if (filter === "town" || filter === "头像") {
    return resource.group === filter;
  }
  if (filter === "recommended") {
    return resource.group === "town" || resource.group === "头像";
  }
  return true;
}

function useMapResource(resourceId) {
  const target = getCurrentMapResourcePickerTarget();
  if (!target) {
    closeMapResourcePicker();
    return;
  }
  target.owner[target.picker.field] = resourceId || null;
  syncFormToEditor();
  closeMapResourcePicker();
  renderFormView();
}

function getCurrentShopRecord() {
  if (!isShopFile()) {
    return null;
  }

  return state.formRecords[state.selectedRecordIndex] || null;
}

function getCurrentShopResourceAssetPath(field) {
  const record = getCurrentShopRecord();
  if (!record) {
    return "";
  }

  return getShopResourceInfo(record, field, getShopResourceGroup(field)).previewPath || "";
}

function getShopResourceGroup(field) {
  return field === "music" ? "音乐" : "场景";
}

function getShopResourceKind(field) {
  return field === "music" ? "audio" : "image";
}

function getHeadPortraitLibraryEntries() {
  const resourcesByAssetPath = new Map();
  for (const resource of state.contentIndex.resourcesById.values()) {
    if (resource?.group !== "头像" || typeof resource?.id !== "string") {
      continue;
    }

    const assetPath = resolveResourceAssetPath(resource);
    if (!assetPath) {
      continue;
    }

    const linked = resourcesByAssetPath.get(assetPath) || [];
    linked.push(resource.id);
    resourcesByAssetPath.set(assetPath, linked);
  }

  return state.assetFiles
    .filter((file) => file.path.toLowerCase().startsWith("art/head/") && isImage(file.path.toLowerCase()))
    .map((file) => {
      const basename = (file.name || file.path.split("/").pop() || "").replace(/\.[^.]+$/i, "");
      const resourceIds = (resourcesByAssetPath.get(file.path) || []).sort((left, right) => left.localeCompare(right, "zh-Hans-CN"));
      return {
        assetPath: file.path,
        assetValue: normalizeToolAssetValue(file.path),
        basename,
        resourceIds,
      };
    })
    .sort((left, right) => left.basename.localeCompare(right.basename, "zh-Hans-CN"));
}

function getItemPictureLibraryEntries() {
  const resourcesByAssetPath = new Map();
  for (const resource of state.contentIndex.resourcesById.values()) {
    if (resource?.group !== "物品" || typeof resource?.id !== "string") {
      continue;
    }

    const assetPath = resolveResourceAssetPath(resource);
    if (!assetPath) {
      continue;
    }

    const linked = resourcesByAssetPath.get(assetPath) || [];
    linked.push(resource.id);
    resourcesByAssetPath.set(assetPath, linked);
  }

  return state.assetFiles
    .filter((file) => file.path.toLowerCase().startsWith("art/item/") && isImage(file.path.toLowerCase()))
    .map((file) => {
      const basename = (file.name || file.path.split("/").pop() || "").replace(/\.[^.]+$/i, "");
      const resourceIds = (resourcesByAssetPath.get(file.path) || []).sort((left, right) => left.localeCompare(right, "zh-Hans-CN"));
      return {
        assetPath: file.path,
        assetValue: normalizeToolAssetValue(file.path),
        basename,
        resourceIds,
      };
    })
    .sort((left, right) => left.basename.localeCompare(right.basename, "zh-Hans-CN"));
}

function getShopResourceLibraryEntries(field) {
  const group = getShopResourceGroup(field);
  const kind = getShopResourceKind(field);
  const resourcesByAssetPath = new Map();
  for (const resource of state.contentIndex.resourcesById.values()) {
    if (resource?.group !== group || typeof resource?.id !== "string") {
      continue;
    }

    const assetPath = resolveResourceAssetPath(resource);
    if (!assetPath) {
      continue;
    }

    const linked = resourcesByAssetPath.get(assetPath) || [];
    linked.push(resource.id);
    resourcesByAssetPath.set(assetPath, linked);
  }

  return state.assetFiles
    .filter((file) => {
      const path = String(file.path || "");
      const lower = path.toLowerCase();
      if (lower.endsWith(".import")) {
        return false;
      }

      return kind === "audio"
        ? isAudio(lower)
        : lower.startsWith("art/") && isImage(lower);
    })
    .map((file) => {
      const basename = (file.name || file.path.split("/").pop() || "").replace(/\.[^.]+$/i, "");
      const resourceIds = (resourcesByAssetPath.get(file.path) || []).sort((left, right) => left.localeCompare(right, "zh-Hans-CN"));
      return {
        assetPath: file.path,
        assetValue: file.path,
        basename,
        resourceIds,
      };
    })
    .sort((left, right) => {
      const linkedDelta = Math.sign(right.resourceIds.length) - Math.sign(left.resourceIds.length);
      return linkedDelta || left.basename.localeCompare(right.basename, "zh-Hans-CN");
    });
}

function getSelectedPortraitLibraryEntry(entries) {
  if (entries.length === 0) {
    return null;
  }

  if (state.portraitPicker.selectedAssetPath) {
    const selected = entries.find((entry) => entry.assetPath === state.portraitPicker.selectedAssetPath);
    if (selected) {
      return selected;
    }
  }

  return entries[0];
}

function getSelectedShopResourceLibraryEntry(entries) {
  if (entries.length === 0) {
    return null;
  }

  if (state.shopResourcePicker.selectedAssetPath) {
    const selected = entries.find((entry) => entry.assetPath === state.shopResourcePicker.selectedAssetPath);
    if (selected) {
      return selected;
    }
  }

  return entries[0];
}

function matchesPortraitPickerSearch(entry, query) {
  if (!query) {
    return true;
  }

  const haystack = [
    entry.basename,
    entry.assetPath,
    entry.assetValue,
    ...entry.resourceIds,
  ].join(" ").toLowerCase();

  return haystack.includes(query);
}

function matchesShopResourcePickerSearch(entry, query) {
  if (!query) {
    return true;
  }

  const haystack = [
    entry.basename,
    entry.assetPath,
    entry.assetValue,
    ...entry.resourceIds,
  ].join(" ").toLowerCase();

  return haystack.includes(query);
}

function getSuggestedPortraitId(record, entry) {
  const currentPortraitId = typeof record?.portrait === "string" ? record.portrait.trim() : "";
  if (currentPortraitId && !state.contentIndex.resourcesById.has(currentPortraitId)) {
    return currentPortraitId;
  }

  const displayName = [record?.name, record?.id, entry.basename, "新头像"]
    .find((value) => typeof value === "string" && value.trim());
  const normalizedName = String(displayName || "新头像").trim();
  return normalizedName.startsWith("头像.") ? normalizedName : `头像.${normalizedName}`;
}

async function usePortraitLibraryResource(record, portraitId) {
  closePortraitPicker();
  updateRecordField(record, "portrait", portraitId, { rerender: true });
}

function getSelectedItemPictureLibraryEntry(entries) {
  if (entries.length === 0) {
    return null;
  }

  if (state.itemPicturePicker.selectedAssetPath) {
    const selected = entries.find((entry) => entry.assetPath === state.itemPicturePicker.selectedAssetPath);
    if (selected) {
      return selected;
    }
  }

  return entries[0];
}

function matchesItemPicturePickerSearch(entry, query) {
  if (!query) {
    return true;
  }

  const haystack = [
    entry.basename,
    entry.assetPath,
    entry.assetValue,
    ...entry.resourceIds,
  ].join(" ").toLowerCase();

  return haystack.includes(query);
}

function getSuggestedItemPictureId(record, entry) {
  const currentPictureId = typeof record?.picture === "string" ? record.picture.trim() : "";
  if (currentPictureId && !state.contentIndex.resourcesById.has(currentPictureId)) {
    return currentPictureId;
  }

  return `物品.${entry.basename || record?.id || "新物品"}`;
}

function getSuggestedShopResourceId(record, field, entry) {
  const currentResourceId = typeof record?.[field] === "string" ? record[field].trim() : "";
  if (currentResourceId && !state.contentIndex.resourcesById.has(currentResourceId)) {
    return currentResourceId;
  }

  const group = getShopResourceGroup(field);
  const label = [record?.name, record?.id, entry?.basename, "新商店"]
    .find((value) => typeof value === "string" && value.trim());
  const baseId = String(label || "新商店").startsWith(`${group}.`)
    ? String(label).trim()
    : `${group}.${String(label || "新商店").trim()}`;
  return createUniqueResourceId(baseId);
}

function createUniqueResourceId(baseId) {
  const normalized = String(baseId || "新资源").trim().replaceAll("/", "_").replaceAll("\\", "_") || "新资源";
  if (!state.contentIndex.resourcesById.has(normalized)) {
    return normalized;
  }

  for (let index = 2; index < 10000; index += 1) {
    const candidate = `${normalized}_${index}`;
    if (!state.contentIndex.resourcesById.has(candidate)) {
      return candidate;
    }
  }

  return `${normalized}_${Date.now()}`;
}

async function useItemPictureLibraryResource(record, pictureId) {
  closeItemPicturePicker();
  updateRecordField(record, "picture", pictureId, { rerender: true });
}

async function useShopResource(record, field, resourceId) {
  closeShopResourcePicker();
  updateRecordField(record, field, resourceId, { rerender: true });
}

async function createAndUsePortraitLibraryResource(record, portraitId, entry, button) {
  const value = portraitId.trim();
  if (!value) {
    showValidation(false, "请先填写头像资源 id。");
    return;
  }
  if (!value.startsWith("头像.") || value.length <= "头像.".length) {
    showValidation(false, "头像资源 ID 必须使用“头像.中文名”格式。");
    return;
  }
  const existing = state.contentIndex.resourcesById.get(value);
  if (existing) {
    showValidation(false, `头像资源 ID 已存在：${value}。请直接使用已有资源，或更换新的 ID。`);
    return;
  }
  if (!confirmAction(`确认注册头像资源？\n\n资源 ID：${value}\n资源组：头像\n资源 value：${entry.assetValue}\n图片：${entry.assetPath}\n\n资源 ID 是稳定引用，创建后不建议直接改名。`)) {
    return;
  }

  button.disabled = true;
  try {
    const result = await createPortraitResource(value, entry.assetValue);
    record.portrait = value;
    syncFormToEditor();
    await loadDataFiles();
    await rebuildContentIndex();
    showValidation(result.validation.ok, result.validation.message);
    state.mode === "characters" ? renderCharacterWorkspaceView() : renderFormView();
  } catch (error) {
    showValidation(false, error instanceof Error ? error.message : String(error));
  } finally {
    button.disabled = false;
  }
}

async function updateAndUsePortraitLibraryResource(record, portraitId, entry, existingResource, button) {
  if (!confirmAction(`确认修正头像资源路径？\n\n资源 ID：${portraitId}\n当前 value：${existingResource.value || "空"}\n修正为：${entry.assetValue}\n图片：${entry.assetPath}\n\n资源 ID保持不变，所有引用该 ID的角色会改用新图片。`)) {
    return;
  }
  button.disabled = true;
  try {
    const result = await updatePortraitResource(portraitId, entry.assetValue, existingResource.value || "");
    record.portrait = portraitId;
    syncFormToEditor();
    await loadDataFiles();
    await rebuildContentIndex();
    showValidation(result.validation.ok, result.validation.message);
    state.mode === "characters" ? renderCharacterWorkspaceView() : renderFormView();
  } catch (error) {
    showValidation(false, error instanceof Error ? error.message : String(error));
  } finally {
    button.disabled = false;
  }
}

async function openPortraitResourceDefinition(resourceId) {
  if (dirtyStateController.isDirty()) {
    showValidation(false, "请先保存当前角色，再打开 resources.json 编辑头像资源，避免丢失当前角色修改。");
    return;
  }
  const definition = (state.contentIndex.definitionsById.get(resourceId) || [])
    .find((candidate) => candidate.type === "resources");
  if (!definition) {
    showValidation(false, `未找到头像资源定义：${resourceId}`);
    return;
  }
  closePortraitPicker();
  await revealDefinition(definition);
}

async function createAndUseItemPictureLibraryResource(record, pictureId, entry, button) {
  const value = pictureId.trim();
  if (!value) {
    showValidation(false, "请先填写物品资源 id。");
    return;
  }

  button.disabled = true;
  try {
    const result = await createItemResource(value, entry.assetValue);
    record.picture = value;
    syncFormToEditor();
    await loadDataFiles();
    await rebuildContentIndex();
    closeItemPicturePicker();
    showValidation(result.validation.ok, result.validation.message);
    renderFormView();
  } catch (error) {
    showValidation(false, error instanceof Error ? error.message : String(error));
  } finally {
    button.disabled = false;
  }
}

async function createAndUseShopResource(record, field, resourceId, entry, button) {
  const value = resourceId.trim();
  if (!value) {
    showValidation(false, "请先填写资源 id。");
    return;
  }

  button.disabled = true;
  try {
    const result = await createGenericResource(value, getShopResourceGroup(field), entry.assetValue);
    record[field] = result.id || value;
    syncFormToEditor();
    await loadDataFiles();
    await rebuildContentIndex();
    closeShopResourcePicker();
    showValidation(result.validation.ok, result.validation.message);
    renderFormView();
  } catch (error) {
    showValidation(false, error instanceof Error ? error.message : String(error));
  } finally {
    button.disabled = false;
  }
}

function renderPortraitPicker() {
  const scrollState = capturePortraitPickerScrollState();
  const existing = document.getElementById("portraitPickerOverlay");
  if (existing) {
    existing.remove();
  }

  if (!state.portraitPicker.open) {
    return;
  }

  const record = getCurrentCharacterRecord();
  if (!record) {
    state.portraitPicker.open = false;
    return;
  }

  const overlay = document.createElement("div");
  overlay.id = "portraitPickerOverlay";
  overlay.className = "portrait-picker-overlay";
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closePortraitPicker();
    }
  });

  const dialog = document.createElement("div");
  dialog.className = "portrait-picker-dialog";

  const header = document.createElement("div");
  header.className = "portrait-picker-header";
  const titleGroup = document.createElement("div");
  const title = document.createElement("div");
  title.className = "portrait-picker-title";
  title.textContent = "头像选择器";
  const subtitle = document.createElement("div");
  subtitle.className = "portrait-picker-subtitle";
  subtitle.textContent = "预览全部头像，已有资源可直接使用，未绑定资源可创建后立即替换当前角色。";
  titleGroup.append(title, subtitle);
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.textContent = "关闭";
  closeButton.addEventListener("click", closePortraitPicker);
  header.append(titleGroup, closeButton);

  const search = document.createElement("input");
  search.type = "search";
  search.className = "portrait-picker-search";
  search.placeholder = "搜索资源 id、文件名、路径";
  search.value = state.portraitPicker.search;
  bindImeSafeInput(search, (value) => {
    state.portraitPicker.search = value;
    renderPortraitPicker();
  });

  const allEntries = getHeadPortraitLibraryEntries();
  const query = state.portraitPicker.search.trim().toLowerCase();
  const entries = allEntries.filter((entry) => matchesPortraitPickerSearch(entry, query));
  const selectedEntry = getSelectedPortraitLibraryEntry(entries);
  if (selectedEntry) {
    state.portraitPicker.selectedAssetPath = selectedEntry.assetPath;
  }

  const body = document.createElement("div");
  body.className = "portrait-picker-body";

  const gallery = document.createElement("div");
  gallery.className = "portrait-picker-gallery";
  if (entries.length === 0) {
    const empty = document.createElement("div");
    empty.className = "record-empty";
    empty.textContent = "没有匹配的头像图片";
    gallery.appendChild(empty);
  } else {
    for (const entry of entries) {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "portrait-picker-card";
      card.classList.toggle("active", entry.assetPath === state.portraitPicker.selectedAssetPath);
      card.addEventListener("click", () => {
        state.portraitPicker.selectedAssetPath = entry.assetPath;
        renderPortraitPicker();
      });

      const image = document.createElement("img");
      image.className = "portrait-picker-card-image";
      image.src = `/api/assets/file?path=${encodeURIComponent(entry.assetPath)}`;
      image.alt = entry.basename;

      const content = document.createElement("div");
      content.className = "portrait-picker-card-content";

      const cardTitle = document.createElement("div");
      cardTitle.className = "portrait-picker-card-title";
      cardTitle.textContent = entry.resourceIds[0] || entry.basename;

      const cardMeta = document.createElement("div");
      cardMeta.className = "portrait-picker-card-meta";
      cardMeta.textContent = entry.resourceIds.length > 0
        ? `${entry.resourceIds.length} 个资源`
        : "未绑定资源";

      const cardPath = document.createElement("div");
      cardPath.className = "portrait-picker-card-path";
      cardPath.textContent = entry.assetPath;

      content.append(cardTitle, cardMeta, cardPath);
      card.append(image, content);
      gallery.appendChild(card);
    }
  }

  const detail = document.createElement("div");
  detail.className = "portrait-picker-detail";
  if (!selectedEntry) {
    const empty = document.createElement("div");
    empty.className = "record-empty";
    empty.textContent = "没有可用头像";
    detail.appendChild(empty);
  } else {
    const preview = document.createElement("img");
    preview.className = "portrait-picker-detail-image";
    preview.src = `/api/assets/file?path=${encodeURIComponent(selectedEntry.assetPath)}&v=${Date.now()}`;
    preview.alt = selectedEntry.basename;

    const info = document.createElement("div");
    info.className = "portrait-picker-detail-info";
    info.append(
      createCharacterMetaRow("文件", selectedEntry.assetPath),
      createCharacterMetaRow("资源 value", selectedEntry.assetValue),
      createCharacterMetaRow("已绑定资源", selectedEntry.resourceIds.length > 0 ? selectedEntry.resourceIds.join(" / ") : "暂无"),
    );

    const actionBlock = document.createElement("div");
    actionBlock.className = "portrait-picker-detail-actions";
    const dimensionBlock = document.createElement("div");
    dimensionBlock.className = "portrait-picker-dimension-check";
    const dimensionStatus = document.createElement("div");
    dimensionStatus.className = "static-tool-status muted";
    dimensionStatus.textContent = "正在读取头像尺寸...";
    const normalizeButton = document.createElement("button");
    normalizeButton.type = "button";
    normalizeButton.textContent = "备份并规范化为 512×512";
    normalizeButton.className = "secondary hidden";
    const portraitCommitButtons = [];
    let portraitImageReadable = false;
    const refreshPortraitCommitButtons = () => {
      for (const button of portraitCommitButtons) {
        button.disabled = !portraitImageReadable || button.dataset.resourceAllowed === "false";
      }
    };
    const applyPortraitDimensions = () => {
      const width = preview.naturalWidth;
      const height = preview.naturalHeight;
      const dimensionsStandard = width === 512 && height === 512;
      portraitImageReadable = width > 0 && height > 0;
      dimensionStatus.className = `static-tool-status ${dimensionsStandard ? "ok" : "warn"}`;
      dimensionStatus.textContent = dimensionsStandard
        ? "头像尺寸 512×512，符合对白显示规范。"
        : `头像尺寸 ${width}×${height}。建议规范化为 512×512，也可以保留原图并继续使用${selectedEntry.assetPath.toLowerCase().endsWith(".png") ? "。" : "（当前自动规范化仅支持 PNG）。"}`;
      normalizeButton.classList.toggle("hidden", dimensionsStandard || !selectedEntry.assetPath.toLowerCase().endsWith(".png"));
      refreshPortraitCommitButtons();
    };
    normalizeButton.addEventListener("click", async () => {
      if (!confirmAction(`将把 ${selectedEntry.assetPath} 等比缩放并透明居中到 512×512。\n\n原文件会先备份。确认继续？`)) {
        return;
      }
      normalizeButton.disabled = true;
      dimensionStatus.className = "static-tool-status muted";
      dimensionStatus.textContent = "正在规范化头像...";
      try {
        const result = await normalizePortraitAsset(selectedEntry.assetPath);
        state.assetImageInfo.delete(selectedEntry.assetPath);
        dimensionStatus.className = "static-tool-status ok";
        dimensionStatus.textContent = `已规范化为 512×512，备份：${result.backupPath || "无"}`;
        preview.src = `/api/assets/file?path=${encodeURIComponent(selectedEntry.assetPath)}&v=${Date.now()}`;
      } catch (error) {
        dimensionStatus.className = "static-tool-status bad";
        dimensionStatus.textContent = formatNormalizePortraitError(error);
      } finally {
        normalizeButton.disabled = false;
      }
    });
    dimensionBlock.append(dimensionStatus, normalizeButton);

    if (selectedEntry.resourceIds.length > 0) {
      for (const resourceId of selectedEntry.resourceIds) {
        const resourceActions = document.createElement("div");
        resourceActions.className = "portrait-picker-resource-actions";
        const useButton = document.createElement("button");
        useButton.type = "button";
        useButton.className = "primary";
        useButton.dataset.resourceAllowed = "true";
        useButton.disabled = true;
        portraitCommitButtons.push(useButton);
        useButton.textContent = `使用 ${resourceId}`;
        useButton.addEventListener("click", async () => {
          await usePortraitLibraryResource(record, resourceId);
        });
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "编辑资源定义";
        editButton.title = state.dirty ? "请先保存当前角色，再打开 resources.json" : "在高级数据中打开该 resources.json 定义";
        editButton.addEventListener("click", () => openPortraitResourceDefinition(resourceId));
        resourceActions.append(useButton, editButton);
        actionBlock.appendChild(resourceActions);
      }
    } else {
      const helper = document.createElement("div");
      helper.className = "static-tool-note";
      helper.textContent = "这张图还没有头像资源。请核对稳定资源 ID 和图片路径，确认后才会注册并写回当前角色。";
      const portraitIdInput = document.createElement("input");
      portraitIdInput.type = "text";
      portraitIdInput.className = "portrait-picker-resource-input";
      portraitIdInput.value = getSuggestedPortraitId(record, selectedEntry);
      const valuePreview = createCharacterMetaRow("将写入 value", selectedEntry.assetValue);
      const createStatus = document.createElement("div");
      createStatus.className = "static-tool-status muted";
      const createButton = document.createElement("button");
      createButton.type = "button";
      createButton.className = "primary";
      createButton.dataset.resourceAllowed = "true";
      createButton.disabled = true;
      portraitCommitButtons.push(createButton);
      createButton.textContent = "检查并确认注册";
      let matchedExistingResource = null;
      createButton.addEventListener("click", async () => {
        const resourceId = portraitIdInput.value.trim();
        if (createButton.dataset.resourceAction === "reuse" && matchedExistingResource) {
          await usePortraitLibraryResource(record, resourceId);
        } else if (createButton.dataset.resourceAction === "repair" && matchedExistingResource) {
          await updateAndUsePortraitLibraryResource(record, resourceId, selectedEntry, matchedExistingResource, createButton);
        } else {
          await createAndUsePortraitLibraryResource(record, resourceId, selectedEntry, createButton);
        }
      });
      const refreshCreateState = () => {
        const resourceId = portraitIdInput.value.trim();
        const existing = resourceId ? state.contentIndex.resourcesById.get(resourceId) : null;
        matchedExistingResource = existing || null;
        const validFormat = resourceId.startsWith("头像.") && resourceId.length > "头像.".length;
        const existingIsPortrait = existing?.group === "头像";
        const existingMatches = existingIsPortrait
          && normalizeToolAssetValue(existing.value || "") === selectedEntry.assetValue;
        const action = !existing
          ? "create"
          : existingMatches
            ? "reuse"
            : existingIsPortrait
              ? "repair"
              : "blocked";
        createButton.dataset.resourceAction = action;
        createButton.dataset.resourceAllowed = String(Boolean(resourceId) && validFormat && action !== "blocked");
        createButton.textContent = action === "reuse"
          ? "使用已有资源"
          : action === "repair"
            ? "修正资源路径并使用"
            : "检查并确认注册";
        refreshPortraitCommitButtons();
        createStatus.className = `static-tool-status ${action === "repair" || action === "blocked" || (resourceId && !validFormat) ? "bad" : resourceId ? "ok" : "muted"}`;
        createStatus.textContent = action === "reuse"
          ? `资源 ID 已存在且指向当前图片：${resourceId} → ${existing.value}。可以直接使用。`
          : action === "repair"
            ? `资源 ID 已存在，但当前 value 是 ${existing.value || "空"}；所选图片应写为 ${selectedEntry.assetValue}。可保留 ID并修正路径。`
          : action === "blocked"
            ? `资源 ID 已存在，但资源组是 ${existing.group || "空"}，不能作为头像修正。`
          : resourceId && !validFormat
            ? "头像资源 ID 必须使用“头像.中文名”格式。"
          : resourceId
            ? `待创建：${resourceId} · 头像 · ${selectedEntry.assetValue}`
            : "请填写资源 ID。";
      };
      portraitIdInput.addEventListener("input", refreshCreateState);
      refreshCreateState();
      actionBlock.append(helper, portraitIdInput, valuePreview, createStatus, createButton);
    }
    preview.addEventListener("load", applyPortraitDimensions);
    preview.addEventListener("error", () => {
      portraitImageReadable = false;
      dimensionStatus.className = "static-tool-status bad";
      dimensionStatus.textContent = "头像图片读取失败，不能注册或用于对白。";
      normalizeButton.classList.add("hidden");
      refreshPortraitCommitButtons();
    });
    if (preview.complete && preview.naturalWidth > 0) applyPortraitDimensions();

    const footerActions = document.createElement("div");
    footerActions.className = "portrait-picker-footer-actions";
    const previewButton = document.createElement("button");
    previewButton.type = "button";
    previewButton.textContent = "在资产面板中打开";
    previewButton.addEventListener("click", () => {
      closePortraitPicker();
      setMode("assets");
      openAssetFile(selectedEntry.assetPath);
    });
    footerActions.appendChild(previewButton);

    detail.append(preview, info, dimensionBlock, actionBlock, footerActions);
  }

  body.append(gallery, detail);
  dialog.append(header, search, body);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  restorePortraitPickerScrollState(scrollState);
}

function renderItemPicturePicker() {
  const scrollState = captureItemPicturePickerScrollState();
  const existing = document.getElementById("itemPicturePickerOverlay");
  if (existing) {
    existing.remove();
  }

  if (!state.itemPicturePicker.open) {
    return;
  }

  const record = getCurrentItemRecord();
  if (!record) {
    state.itemPicturePicker.open = false;
    return;
  }

  const overlay = document.createElement("div");
  overlay.id = "itemPicturePickerOverlay";
  overlay.className = "portrait-picker-overlay";
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeItemPicturePicker();
    }
  });

  const dialog = document.createElement("div");
  dialog.className = "portrait-picker-dialog";

  const header = document.createElement("div");
  header.className = "portrait-picker-header";
  const titleGroup = document.createElement("div");
  const title = document.createElement("div");
  title.className = "portrait-picker-title";
  title.textContent = "物品图片选择器";
  const subtitle = document.createElement("div");
  subtitle.className = "portrait-picker-subtitle";
  subtitle.textContent = "预览全部物品缩略图，已有资源可直接使用，未绑定资源可创建后立即替换当前物品。";
  titleGroup.append(title, subtitle);
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.textContent = "关闭";
  closeButton.addEventListener("click", closeItemPicturePicker);
  header.append(titleGroup, closeButton);

  const search = document.createElement("input");
  search.type = "search";
  search.className = "portrait-picker-search";
  search.placeholder = "搜索资源 id、文件名、路径";
  search.value = state.itemPicturePicker.search;
  bindImeSafeInput(search, (value) => {
    state.itemPicturePicker.search = value;
    renderItemPicturePicker();
  });

  const allEntries = getItemPictureLibraryEntries();
  const query = state.itemPicturePicker.search.trim().toLowerCase();
  const entries = allEntries.filter((entry) => matchesItemPicturePickerSearch(entry, query));
  const selectedEntry = getSelectedItemPictureLibraryEntry(entries);
  if (selectedEntry) {
    state.itemPicturePicker.selectedAssetPath = selectedEntry.assetPath;
  }

  const body = document.createElement("div");
  body.className = "portrait-picker-body";

  const gallery = document.createElement("div");
  gallery.className = "portrait-picker-gallery item-picture-picker-gallery";
  if (entries.length === 0) {
    const empty = document.createElement("div");
    empty.className = "record-empty";
    empty.textContent = "没有匹配的物品图片";
    gallery.appendChild(empty);
  } else {
    for (const entry of entries) {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "portrait-picker-card item-picture-picker-card";
      card.classList.toggle("active", entry.assetPath === state.itemPicturePicker.selectedAssetPath);
      card.addEventListener("click", () => {
        state.itemPicturePicker.selectedAssetPath = entry.assetPath;
        renderItemPicturePicker();
      });

      const image = document.createElement("img");
      image.className = "portrait-picker-card-image item-picture-picker-card-image";
      image.src = `/api/assets/file?path=${encodeURIComponent(entry.assetPath)}`;
      image.alt = entry.basename;

      const content = document.createElement("div");
      content.className = "portrait-picker-card-content";

      const cardTitle = document.createElement("div");
      cardTitle.className = "portrait-picker-card-title";
      cardTitle.textContent = entry.resourceIds[0] || entry.basename;

      const cardMeta = document.createElement("div");
      cardMeta.className = "portrait-picker-card-meta";
      cardMeta.textContent = entry.resourceIds.length > 0
        ? `${entry.resourceIds.length} 个资源`
        : "未绑定资源";

      const cardPath = document.createElement("div");
      cardPath.className = "portrait-picker-card-path";
      cardPath.textContent = entry.assetPath;

      content.append(cardTitle, cardMeta, cardPath);
      card.append(image, content);
      gallery.appendChild(card);
    }
  }

  const detail = document.createElement("div");
  detail.className = "portrait-picker-detail";
  if (!selectedEntry) {
    const empty = document.createElement("div");
    empty.className = "record-empty";
    empty.textContent = "没有可用物品图片";
    detail.appendChild(empty);
  } else {
    const preview = document.createElement("img");
    preview.className = "portrait-picker-detail-image item-picture-picker-detail-image";
    preview.src = `/api/assets/file?path=${encodeURIComponent(selectedEntry.assetPath)}&v=${Date.now()}`;
    preview.alt = selectedEntry.basename;

    const info = document.createElement("div");
    info.className = "portrait-picker-detail-info";
    info.append(
      createCharacterMetaRow("文件", selectedEntry.assetPath),
      createCharacterMetaRow("资源 value", selectedEntry.assetValue),
      createCharacterMetaRow("已绑定资源", selectedEntry.resourceIds.length > 0 ? selectedEntry.resourceIds.join(" / ") : "暂无"),
    );

    const actionBlock = document.createElement("div");
    actionBlock.className = "portrait-picker-detail-actions";

    if (selectedEntry.resourceIds.length > 0) {
      for (const resourceId of selectedEntry.resourceIds) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "primary";
        button.textContent = `使用 ${resourceId}`;
        button.addEventListener("click", async () => {
          await useItemPictureLibraryResource(record, resourceId);
        });
        actionBlock.appendChild(button);
      }
    } else {
      const helper = document.createElement("div");
      helper.className = "static-tool-note";
      helper.textContent = "这张图还没有物品资源。创建资源后会自动写回当前物品的 picture。";
      const pictureIdInput = document.createElement("input");
      pictureIdInput.type = "text";
      pictureIdInput.className = "portrait-picker-resource-input";
      pictureIdInput.value = getSuggestedItemPictureId(record, selectedEntry);
      const createButton = document.createElement("button");
      createButton.type = "button";
      createButton.className = "primary";
      createButton.textContent = "创建资源并使用";
      createButton.addEventListener("click", async () => {
        await createAndUseItemPictureLibraryResource(record, pictureIdInput.value, selectedEntry, createButton);
      });
      actionBlock.append(helper, pictureIdInput, createButton);
    }

    const footerActions = document.createElement("div");
    footerActions.className = "portrait-picker-footer-actions";
    const previewButton = document.createElement("button");
    previewButton.type = "button";
    previewButton.textContent = "在资产面板中打开";
    previewButton.addEventListener("click", () => {
      closeItemPicturePicker();
      setMode("assets");
      openAssetFile(selectedEntry.assetPath);
    });
    footerActions.appendChild(previewButton);

    detail.append(preview, info, actionBlock, footerActions);
  }

  body.append(gallery, detail);
  dialog.append(header, search, body);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  restoreItemPicturePickerScrollState(scrollState);
}

function renderShopResourcePicker() {
  const scrollState = captureShopResourcePickerScrollState();
  const existing = document.getElementById("shopResourcePickerOverlay");
  if (existing) {
    existing.remove();
  }

  if (!state.shopResourcePicker.open) {
    return;
  }

  const record = getCurrentShopRecord();
  const field = state.shopResourcePicker.field;
  if (!record || (field !== "background" && field !== "music")) {
    state.shopResourcePicker.open = false;
    return;
  }

  const isMusic = field === "music";
  const group = getShopResourceGroup(field);
  const titleText = isMusic ? "商店音乐选择器" : "商店背景选择器";
  const overlay = document.createElement("div");
  overlay.id = "shopResourcePickerOverlay";
  overlay.className = "portrait-picker-overlay";
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeShopResourcePicker();
    }
  });

  const dialog = document.createElement("div");
  dialog.className = "portrait-picker-dialog shop-resource-picker-dialog";

  const header = document.createElement("div");
  header.className = "portrait-picker-header";
  const titleGroup = document.createElement("div");
  const title = document.createElement("div");
  title.className = "portrait-picker-title";
  title.textContent = titleText;
  const subtitle = document.createElement("div");
  subtitle.className = "portrait-picker-subtitle";
  subtitle.textContent = `选择已有 ${group} 资源，或把资产一键注册到 resources.json 并写回当前商店。`;
  titleGroup.append(title, subtitle);
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.textContent = "关闭";
  closeButton.addEventListener("click", closeShopResourcePicker);
  header.append(titleGroup, closeButton);

  const search = document.createElement("input");
  search.type = "search";
  search.className = "portrait-picker-search";
  search.placeholder = "搜索资源 id、文件名、路径";
  search.value = state.shopResourcePicker.search;
  bindImeSafeInput(search, (value) => {
    state.shopResourcePicker.search = value;
    renderShopResourcePicker();
  });

  const allEntries = getShopResourceLibraryEntries(field);
  const query = state.shopResourcePicker.search.trim().toLowerCase();
  const entries = allEntries.filter((entry) => matchesShopResourcePickerSearch(entry, query));
  const selectedEntry = getSelectedShopResourceLibraryEntry(entries);
  if (selectedEntry) {
    state.shopResourcePicker.selectedAssetPath = selectedEntry.assetPath;
  }

  const body = document.createElement("div");
  body.className = "portrait-picker-body";

  const gallery = document.createElement("div");
  gallery.className = `portrait-picker-gallery shop-resource-picker-gallery ${isMusic ? "audio" : "image"}`;
  if (entries.length === 0) {
    const empty = document.createElement("div");
    empty.className = "record-empty";
    empty.textContent = isMusic ? "没有匹配的音频资产" : "没有匹配的背景图片";
    gallery.appendChild(empty);
  } else {
    for (const entry of entries) {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "portrait-picker-card shop-resource-picker-card";
      card.classList.toggle("active", entry.assetPath === state.shopResourcePicker.selectedAssetPath);
      card.addEventListener("click", () => {
        state.shopResourcePicker.selectedAssetPath = entry.assetPath;
        renderShopResourcePicker();
      });

      let media;
      if (isMusic) {
        media = document.createElement("div");
        media.className = "portrait-picker-card-image shop-resource-audio-card";
        media.textContent = "音频";
      } else {
        media = document.createElement("img");
        media.className = "portrait-picker-card-image shop-resource-picker-card-image";
        media.src = `/api/assets/file?path=${encodeURIComponent(entry.assetPath)}`;
        media.alt = entry.basename;
      }

      const content = document.createElement("div");
      content.className = "portrait-picker-card-content";

      const cardTitle = document.createElement("div");
      cardTitle.className = "portrait-picker-card-title";
      cardTitle.textContent = entry.resourceIds[0] || entry.basename;

      const cardMeta = document.createElement("div");
      cardMeta.className = "portrait-picker-card-meta";
      cardMeta.textContent = entry.resourceIds.length > 0
        ? `${entry.resourceIds.length} 个资源`
        : "未绑定资源";

      const cardPath = document.createElement("div");
      cardPath.className = "portrait-picker-card-path";
      cardPath.textContent = entry.assetPath;

      content.append(cardTitle, cardMeta, cardPath);
      card.append(media, content);
      gallery.appendChild(card);
    }
  }

  const detail = document.createElement("div");
  detail.className = "portrait-picker-detail";
  if (!selectedEntry) {
    const empty = document.createElement("div");
    empty.className = "record-empty";
    empty.textContent = isMusic ? "没有可用音频" : "没有可用背景图片";
    detail.appendChild(empty);
  } else {
    let preview;
    if (isMusic) {
      preview = document.createElement("audio");
      preview.className = "shop-resource-detail-audio";
      preview.controls = true;
      preview.src = `/api/assets/file?path=${encodeURIComponent(selectedEntry.assetPath)}&v=${Date.now()}`;
    } else {
      preview = document.createElement("img");
      preview.className = "portrait-picker-detail-image shop-resource-detail-image";
      preview.src = `/api/assets/file?path=${encodeURIComponent(selectedEntry.assetPath)}&v=${Date.now()}`;
      preview.alt = selectedEntry.basename;
    }

    const info = document.createElement("div");
    info.className = "portrait-picker-detail-info";
    info.append(
      createCharacterMetaRow("文件", selectedEntry.assetPath),
      createCharacterMetaRow("资源组", group),
      createCharacterMetaRow("注册 value", selectedEntry.assetValue),
      createCharacterMetaRow("已绑定资源", selectedEntry.resourceIds.length > 0 ? selectedEntry.resourceIds.join(" / ") : "暂无"),
    );

    const actionBlock = document.createElement("div");
    actionBlock.className = "portrait-picker-detail-actions";

    if (selectedEntry.resourceIds.length > 0) {
      for (const resourceId of selectedEntry.resourceIds) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "primary";
        button.textContent = `使用 ${resourceId}`;
        button.addEventListener("click", async () => {
          await useShopResource(record, field, resourceId);
        });
        actionBlock.appendChild(button);
      }
    } else {
      const helper = document.createElement("div");
      helper.className = "static-tool-note";
      helper.textContent = `这个资产还没有 ${group} 资源。创建后会自动写回当前商店的 ${field}。`;
      const resourceIdInput = document.createElement("input");
      resourceIdInput.type = "text";
      resourceIdInput.className = "portrait-picker-resource-input";
      resourceIdInput.value = getSuggestedShopResourceId(record, field, selectedEntry);
      const createButton = document.createElement("button");
      createButton.type = "button";
      createButton.className = "primary";
      createButton.textContent = "创建资源并使用";
      createButton.addEventListener("click", async () => {
        await createAndUseShopResource(record, field, resourceIdInput.value, selectedEntry, createButton);
      });
      actionBlock.append(helper, resourceIdInput, createButton);
    }

    const footerActions = document.createElement("div");
    footerActions.className = "portrait-picker-footer-actions";
    const previewButton = document.createElement("button");
    previewButton.type = "button";
    previewButton.textContent = "在资产面板中打开";
    previewButton.addEventListener("click", () => {
      closeShopResourcePicker();
      setMode("assets");
      openAssetFile(selectedEntry.assetPath);
    });
    footerActions.appendChild(previewButton);

    detail.append(preview, info, actionBlock, footerActions);
  }

  body.append(gallery, detail);
  dialog.append(header, search, body);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  restoreShopResourcePickerScrollState(scrollState);
}

function renderMapResourcePicker() {
  document.getElementById("mapResourcePickerOverlay")?.remove();
  if (!state.mapEditor.resourcePicker.open) {
    return;
  }

  const target = getCurrentMapResourcePickerTarget();
  if (!target) {
    state.mapEditor.resourcePicker.open = false;
    return;
  }

  const picker = target.picker;
  const isEventIcon = picker.field === "image";
  const overlay = document.createElement("div");
  overlay.id = "mapResourcePickerOverlay";
  overlay.className = "portrait-picker-overlay";
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeMapResourcePicker();
    }
  });

  const dialog = document.createElement("div");
  dialog.className = "portrait-picker-dialog map-resource-picker-dialog";
  const header = document.createElement("div");
  header.className = "portrait-picker-header";
  const titleGroup = document.createElement("div");
  const title = document.createElement("div");
  title.className = "portrait-picker-title";
  title.textContent = isEventIcon ? "选择当前事件图标" : "选择点位公共回退图";
  const subtitle = document.createElement("div");
  subtitle.className = "portrait-picker-subtitle";
  subtitle.textContent = isEventIcon
    ? "事件 image 优先级最高，只影响当前事件。推荐从 town 图标中选择。"
    : "点位 picture 会被所有未填写 image 的事件复用；为空时才会尝试角色头像。";
  titleGroup.append(title, subtitle);
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.textContent = "关闭";
  closeButton.addEventListener("click", closeMapResourcePicker);
  header.append(titleGroup, closeButton);

  const controls = document.createElement("div");
  controls.className = "map-resource-picker-controls";
  const search = document.createElement("input");
  search.type = "search";
  search.className = "portrait-picker-search";
  search.placeholder = "搜索资源 id、资源组、文件路径";
  search.value = picker.search;
  bindImeSafeInput(search, (value) => {
    picker.search = value;
    renderMapResourcePicker();
  });
  const filter = document.createElement("select");
  filter.className = "map-resource-picker-filter";
  for (const choice of [
    { value: "recommended", label: "推荐：town + 头像" },
    { value: "town", label: "仅 town 交互图标" },
    { value: "头像", label: "仅角色头像" },
    { value: "all", label: "全部图片资源" },
  ]) {
    const option = document.createElement("option");
    option.value = choice.value;
    option.textContent = choice.label;
    option.selected = picker.filter === choice.value;
    filter.appendChild(option);
  }
  filter.addEventListener("change", () => {
    picker.filter = filter.value;
    picker.selectedResourceId = "";
    renderMapResourcePicker();
  });
  controls.append(search, filter);

  const query = picker.search.trim().toLowerCase();
  const resources = getMapIconResources().filter((resource) => {
    if (!matchesMapResourcePickerFilter(resource, picker.filter)) {
      return false;
    }
    if (!query) {
      return true;
    }
    return [resource.id, resource.group, resource.value]
      .filter((value) => typeof value === "string")
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
  let selectedResource = resources.find((resource) => resource.id === picker.selectedResourceId) || null;
  if (!selectedResource && resources.length > 0) {
    selectedResource = resources[0];
    picker.selectedResourceId = selectedResource.id;
  }

  const body = document.createElement("div");
  body.className = "portrait-picker-body";
  const gallery = document.createElement("div");
  gallery.className = "portrait-picker-gallery map-resource-picker-gallery";
  if (resources.length === 0) {
    const empty = document.createElement("div");
    empty.className = "record-empty";
    empty.textContent = "没有匹配的图片资源。可以切换到“全部图片资源”继续查找。";
    gallery.appendChild(empty);
  } else {
    for (const resource of resources) {
      const assetPath = resolveResourceAssetPath(resource);
      const card = document.createElement("button");
      card.type = "button";
      card.className = "portrait-picker-card map-resource-picker-card";
      card.classList.toggle("active", resource.id === picker.selectedResourceId);
      card.addEventListener("click", () => {
        picker.selectedResourceId = resource.id;
        renderMapResourcePicker();
      });
      const image = document.createElement("img");
      image.className = "portrait-picker-card-image map-resource-picker-card-image";
      image.src = `/api/assets/file?path=${encodeURIComponent(assetPath)}`;
      image.alt = resource.id;
      const content = document.createElement("div");
      content.className = "portrait-picker-card-content";
      const cardTitle = document.createElement("div");
      cardTitle.className = "portrait-picker-card-title";
      cardTitle.textContent = resource.id;
      const cardMeta = document.createElement("div");
      cardMeta.className = "portrait-picker-card-meta";
      cardMeta.textContent = resource.group || "未分组";
      content.append(cardTitle, cardMeta);
      card.append(image, content);
      gallery.appendChild(card);
    }
  }

  const detail = document.createElement("div");
  detail.className = "portrait-picker-detail";
  if (!selectedResource) {
    const empty = document.createElement("div");
    empty.className = "record-empty";
    empty.textContent = "请选择一个图片资源。";
    detail.appendChild(empty);
  } else {
    const assetPath = resolveResourceAssetPath(selectedResource);
    const preview = document.createElement("img");
    preview.className = "portrait-picker-detail-image map-resource-picker-detail-image";
    preview.src = `/api/assets/file?path=${encodeURIComponent(assetPath)}&v=${Date.now()}`;
    preview.alt = selectedResource.id;
    const info = document.createElement("div");
    info.className = "portrait-picker-detail-info";
    info.append(
      createCharacterMetaRow("资源 ID", selectedResource.id),
      createCharacterMetaRow("资源组", selectedResource.group || "未分组"),
      createCharacterMetaRow("资源 value", selectedResource.value || ""),
      createCharacterMetaRow("资产文件", assetPath)
    );
    const useButton = document.createElement("button");
    useButton.type = "button";
    useButton.className = "primary";
    useButton.textContent = isEventIcon ? "用于当前事件" : "用作点位公共回退图";
    useButton.addEventListener("click", () => useMapResource(selectedResource.id));
    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.textContent = "清空当前字段";
    clearButton.addEventListener("click", () => useMapResource(""));
    const actions = document.createElement("div");
    actions.className = "portrait-picker-footer-actions";
    actions.append(useButton, clearButton);
    detail.append(preview, info, actions);
  }

  body.append(gallery, detail);
  dialog.append(header, controls, body);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
}

function capturePortraitPickerScrollState() {
  const overlay = document.getElementById("portraitPickerOverlay");
  return {
    galleryScrollTop: overlay?.querySelector(".portrait-picker-gallery")?.scrollTop ?? 0,
    detailScrollTop: overlay?.querySelector(".portrait-picker-detail")?.scrollTop ?? 0,
  };
}

function captureItemPicturePickerScrollState() {
  const overlay = document.getElementById("itemPicturePickerOverlay");
  return {
    galleryScrollTop: overlay?.querySelector(".portrait-picker-gallery")?.scrollTop ?? 0,
    detailScrollTop: overlay?.querySelector(".portrait-picker-detail")?.scrollTop ?? 0,
  };
}

function captureShopResourcePickerScrollState() {
  const overlay = document.getElementById("shopResourcePickerOverlay");
  return {
    galleryScrollTop: overlay?.querySelector(".portrait-picker-gallery")?.scrollTop ?? 0,
    detailScrollTop: overlay?.querySelector(".portrait-picker-detail")?.scrollTop ?? 0,
  };
}

function restorePortraitPickerScrollState(scrollState) {
  if (!scrollState || !state.portraitPicker.open) {
    return;
  }

  requestAnimationFrame(() => {
    const overlay = document.getElementById("portraitPickerOverlay");
    if (!overlay) {
      return;
    }

    const gallery = overlay.querySelector(".portrait-picker-gallery");
    const detail = overlay.querySelector(".portrait-picker-detail");
    if (gallery) {
      gallery.scrollTop = scrollState.galleryScrollTop;
    }

    if (detail) {
      detail.scrollTop = scrollState.detailScrollTop;
    }
  });
}

function restoreItemPicturePickerScrollState(scrollState) {
  if (!scrollState || !state.itemPicturePicker.open) {
    return;
  }

  requestAnimationFrame(() => {
    const overlay = document.getElementById("itemPicturePickerOverlay");
    if (!overlay) {
      return;
    }

    const gallery = overlay.querySelector(".portrait-picker-gallery");
    const detail = overlay.querySelector(".portrait-picker-detail");
    if (gallery) {
      gallery.scrollTop = scrollState.galleryScrollTop;
    }

    if (detail) {
      detail.scrollTop = scrollState.detailScrollTop;
    }
  });
}

function restoreShopResourcePickerScrollState(scrollState) {
  if (!scrollState || !state.shopResourcePicker.open) {
    return;
  }

  requestAnimationFrame(() => {
    const overlay = document.getElementById("shopResourcePickerOverlay");
    if (!overlay) {
      return;
    }

    const gallery = overlay.querySelector(".portrait-picker-gallery");
    const detail = overlay.querySelector(".portrait-picker-detail");
    if (gallery) {
      gallery.scrollTop = scrollState.galleryScrollTop;
    }

    if (detail) {
      detail.scrollTop = scrollState.detailScrollTop;
    }
  });
}

function createToolInput(id, label, placeholder) {
  return createTextInput({ id, label, placeholder });
}

function createToolField(label, control) {
  return createField({ label, control });
}

function getSelectedLookupText() {
  return getEditorSelectedText().trim().replace(/^"|"$/g, "");
}

async function revealDefinition(definition) {
  if (definition.path === "characters.json" || definition.type === "characters") {
    await openCharacterWorkspace();
    const index = state.formRecords.findIndex((record) => record?.id === definition.id);
    if (index >= 0) {
      state.selectedRecordIndex = index;
      state.characterWorkspace.tab = "overview";
      renderCharacterWorkspaceView();
    }
    return;
  }
  setMode("data");
  await openDataFile(definition.path);
  setViewMode("json");
  selectLine(definition.line);
}

async function revealStoryLocation(path, line) {
  if (!(await confirmDiscardChanges())) {
    return;
  }

  setMode("data");
  await openDataFile(path);
  setViewMode("json");
  selectLine(line);
}

function selectLine(lineNumber) {
  const lines = getEditorValue().split("\n");
  const lineIndex = Math.max(0, Math.min(lineNumber - 1, lines.length - 1));
  let start = 0;
  for (let index = 0; index < lineIndex; index += 1) {
    start += lines[index].length + 1;
  }

  const end = start + lines[lineIndex].length;
  setEditorSelectionByOffsets(start, end);
}

function setEditorCursorToLine(lineNumber, columnNumber = 1) {
  setEditorCursorToPosition(lineNumber, columnNumber);
}

async function openLastDataFile() {
  const lastPath = preferences.get(getLastDataPathStorageKey());
  if (!lastPath || !state.dataFiles.some((file) => file.path === lastPath)) {
    return;
  }

  await openDataFile(getStorySourcePathForJson(lastPath) || lastPath);
}

function getLastDataPathStorageKey() {
  return preferences.scopedKey(storageKeys.lastDataPath, state.activeModId);
}

async function confirmDiscardChanges() {
  return dirtyStateController.confirmDiscardChanges();
}

function updateSearchMatches() {
  const query = elements.contentSearch.value;
  state.searchMatches = [];
  state.searchIndex = -1;

  if (!query) {
    elements.searchState.textContent = "";
    return;
  }

  const lowerText = getEditorValue().toLowerCase();
  const lowerQuery = query.toLowerCase();
  let index = lowerText.indexOf(lowerQuery);
  while (index >= 0) {
    state.searchMatches.push(index);
    index = lowerText.indexOf(lowerQuery, index + lowerQuery.length);
  }

  if (state.searchMatches.length === 0) {
    elements.searchState.textContent = "无匹配";
    return;
  }

  elements.searchState.textContent = `${state.searchMatches.length} 处匹配`;
}

function jumpSearch(direction) {
  if (state.searchMatches.length === 0) {
    updateSearchMatches();
  }

  if (state.searchMatches.length === 0) {
    return;
  }

  state.searchIndex = (state.searchIndex + direction + state.searchMatches.length) % state.searchMatches.length;
  const start = state.searchMatches[state.searchIndex];
  const end = start + elements.contentSearch.value.length;
  setEditorSelectionByOffsets(start, end);
  elements.searchState.textContent = `${state.searchIndex + 1} / ${state.searchMatches.length}`;
}

function handleGlobalKeydown(event) {
  if (event.key === "Escape" && state.portraitPicker.open) {
    event.preventDefault();
    closePortraitPicker();
    return;
  }

  if (event.key === "Escape" && state.itemPicturePicker.open) {
    event.preventDefault();
    closeItemPicturePicker();
    return;
  }

  if (event.key === "Escape" && state.shopResourcePicker.open) {
    event.preventDefault();
    closeShopResourcePicker();
    return;
  }

  if (event.key === "Escape" && state.mapEditor.resourcePicker.open) {
    event.preventDefault();
    closeMapResourcePicker();
    return;
  }

  if (event.key === "Escape" && dialogController.isOpen()) {
    event.preventDefault();
    closeToolDialog();
    return;
  }

  if (event.key === "Escape" && state.shell.contextDrawerOpen) {
    event.preventDefault();
    setContextDrawerOpen(false);
    elements.inspectorToggleButton.focus({ preventScroll: true });
    return;
  }

  if (event.key === "Escape" && state.mapEditor.focusMode) {
    event.preventDefault();
    setMapFocusMode(false);
    return;
  }

  commandRegistry.handleKeydown(event);
}

function formatJsonError(error) {
  const message = error instanceof Error ? error.message : String(error);
  const positionMatch = message.match(/position\s+(\d+)/i);
  if (!positionMatch) {
    return `JSON parse failed: ${message}`;
  }

  const position = Number(positionMatch[1]);
  const lines = getEditorValue().slice(0, position).split("\n");
  return `JSON parse failed near 行 ${lines.length}，列 ${lines[lines.length - 1].length + 1}: ${message}`;
}

function parseJsonText(text) {
  return JSON.parse(String(text ?? "").replace(/^\uFEFF/u, ""));
}

function isImage(path) {
  return isImageAsset(path);
}

function isAudio(path) {
  return isAudioAsset(path);
}

function isStorySourceFile(path = state.currentPath) {
  return typeof path === "string" && path.toLowerCase().endsWith(".story");
}

function isStoryJsonFile(path = state.currentPath) {
  return typeof path === "string" && path.toLowerCase().endsWith(".story.json");
}

function isStoryDslEditingFile(path = state.currentPath) {
  return isStorySourceFile(path) || isStoryJsonDslFile(path);
}

function isStoryJsonDslFile(path = state.currentPath) {
  return isStoryJsonFile(path)
    && state.storySource.kind === "json"
    && state.storySource.path === path;
}

function canSaveCurrentStoryJsonAsSource() {
  return state.mode === "data"
    && isStoryJsonDslFile()
    && !getStorySourcePathForJson(state.currentPath);
}

function isStoryDataFile(path) {
  if (typeof path !== "string") {
    return false;
  }

  const normalized = path.replaceAll("\\", "/").toLowerCase();
  return normalized.startsWith("story/") || normalized.endsWith(".story") || normalized.endsWith(".story.json");
}

function getFileDisplayTitle(file) {
  if (state.mode !== "data" || isStoryDataFile(file.path)) {
    return file.path;
  }

  return getDataFileDisplayName(file.path) || file.path;
}

function getFileSearchText(file) {
  return `${file.path} ${getDataFileDisplayName(file.path) || ""}`.toLowerCase();
}

function getDataFileDisplayName(path) {
  const normalized = String(path || "").replaceAll("\\", "/").toLowerCase();
  return normalized.includes("/") ? "" : dataFileDisplayNames.get(normalized) || "";
}

function getStorySourcePathForJson(path) {
  if (!isStoryJsonFile(path)) {
    return "";
  }

  const sourcePath = path.slice(0, -".json".length);
  return state.dataFiles.some((file) => file.path === sourcePath) ? sourcePath : "";
}

function getStorySourceTargetPathForJson(path) {
  return isStoryJsonFile(path) ? path.slice(0, -".json".length) : "";
}

function formatFileMeta(file, summary, storySourcePath) {
  if (isStorySourceFile(file.path)) {
    const compiledPath = `${file.path}.json`;
    const hasCompiledJson = state.dataFiles.some((candidate) => candidate.path === compiledPath);
    return `Story DSL · ${hasCompiledJson ? "有生成 JSON" : "未生成 JSON"} · ${formatFileSize(file.size)}`;
  }

  if (storySourcePath) {
    return `由 ${storySourcePath} 生成 · ${formatFileSize(file.size)}`;
  }

  if (state.mode === "data" && summary) {
    const displayName = getDataFileDisplayName(file.path);
    const prefix = displayName ? `${file.path} · ` : "";
    return `${prefix}${summary.type} · ${summary.definitions} 条 · ${formatFileSize(file.size)}`;
  }

  return formatFileSize(file.size);
}

function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
