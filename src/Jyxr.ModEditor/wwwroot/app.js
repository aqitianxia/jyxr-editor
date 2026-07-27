import { state } from "./core/state.js?v=20260726-achievements-1";
import { editorVersion } from "./core/version.js?v=20260711-stage9-1";
import { createEditorApi } from "./core/api.js?v=20260711-core-17";
import { createCommandRegistry } from "./core/commands.js?v=20260711-core-17";
import { createDocumentHistory } from "./core/document-history.js?v=20260716-map-data-safety-1";
import { createDirtyStateController } from "./core/dirty-state.js?v=20260711-core-17";
import { createEventBus } from "./core/events.js?v=20260711-core-17";
import { createPreferences, storageKeys } from "./core/preferences.js?v=20260727-warm-theme-1";
import { rememberDataDocumentSelection, restoreDataDocumentSelection } from "./core/data-document-context.js?v=20260714-workspace-context-1";
import { normalizeWorkspaceMode } from "./core/router.js?v=20260726-achievements-1";
import { createJsonPropertyLineIndex } from "./domain/json-source-index.js?v=20260712-performance-1";
import {
  getWorkspaceName,
  normalizeRecentWorkspaces,
  normalizeWorkspacePath,
  rememberWorkspacePath,
} from "./domain/workspace-launcher.js?v=20260718-workspace-launcher-1";
import { bindImeSafeInput, rerenderPreservingInput } from "./core/input-composition.js?v=20260712-search-1";
import { createProblem, summarizeProblems } from "./core/problems.js?v=20260711-core-17";
import { createRecentItemsStore } from "./core/recent-items.js?v=20260711-core-17";
import { parseJsonc } from "./core/jsonc.js?v=20260727-jsonc-1";
import { createButton } from "./ui/buttons.js?v=20260711-core-17";
import { confirmAction, createDialogController } from "./ui/dialogs.js?v=20260711-core-17";
import { createField, createTextInput } from "./ui/fields.js?v=20260711-core-17";
import { createTextList } from "./ui/lists.js?v=20260711-core-17";
import { createProblemSummary, renderStatusMessage } from "./ui/problem-list.js?v=20260711-core-17";
import { createShellController } from "./ui/shell.js?v=20260713-adapt-1";
import { createMapCanvas } from "./ui/map-canvas.js?v=20260716-map-data-safety-1";
import { createReferencePicker } from "./ui/reference-picker.js?v=20260711-core-17";
import { renderProjectHome } from "./ui/home.js?v=20260711-core-17";
import { renderProblemCenter } from "./ui/problem-center.js?v=20260711-core-17";
import { renderCharacterWorkspace } from "./ui/characters.js?v=20260726-richtext-1";
import { createEmbeddedJsonEditor, disposeEmbeddedCodeEditors } from "./ui/code-editor.js?v=20260711-stage6-1";
import { createGrowthTemplate, ensureGrowthTemplateShape } from "./domain/growth-templates.js?v=20260711-stage9-1";
import { renderGrowthTemplateWorkspace } from "./workspaces/growth-templates.js?v=20260711-stage9-2";
import { cloneJson as cloneSectJson, createSectDefinition, ensureSectShape, getSectIssues } from "./domain/sects.js?v=20260711-stage9-2";
import { renderSectWorkspace } from "./workspaces/sects.js?v=20260711-stage9-2";
import { createMapDefinition, createMapEventDefinition, describeMapCondition, findMapReferences, getMapConditionReferences, getMapConditionValueIssue, mapConditionDefinitions, mapConditionTypes, matchesMapSearch, moveMapEventToLocation as moveMapEventToLocationEntry, moveMapEventWithinLocation, moveMapLocation as moveMapLocationEntry, renameMapId } from "./domain/maps.js?v=20260718-map-runtime-keys-1";
import { characterStatFields } from "./domain/characters.js?v=20260712-navigation-2";
import { resolveCharacterBiography } from "./domain/character-biographies.js?v=20260726-biography-1";
import {
  achievementGroup,
  collectAchievementUnlockSources,
  createAchievementResource,
  createWorldTriggerDefinition,
  getAchievementTitle,
  getMissingAchievementReferences,
  indexAchievementUnlockSources,
  isAchievementResource,
  moveWorldTrigger,
} from "./domain/achievements.js?v=20260727-world-triggers-1";
import { createItemDefinition, effectTypes, genderChoices, statChoices, weaponTypes } from "./domain/items.js?v=20260727-runtime-contract-2";
import { renderItemWorkspace } from "./workspaces/items.js?v=20260727-runtime-contract-2";
import { createShopDefinition, createShopProduct, ensureShopShape as ensureShopWorkspaceShape, moveShopProduct as moveShopProductEntry } from "./domain/shops.js?v=20260727-shop-rewards-1";
import { renderShopWorkspace } from "./workspaces/shops.js?v=20260727-shop-rewards-1";
import {
  addBattleUnit,
  createBattleDefinition,
  deleteBattleUnit,
  duplicateBattleUnit,
  ensureBattleShape,
  findBattleReferences as findBattleReferencesInContent,
  getBattleIssues,
  getBattleUnit,
  getBattleUnits,
  moveBattleUnit,
  setBattleUnitKind,
} from "./domain/battles.js?v=20260722-battle-links-1";
import { renderBattleWorkspace } from "./workspaces/battles.js?v=20260722-battle-links-1";
import {
  buildMartialIndex,
  cloneJson as cloneMartialJson,
  createFormSkill,
  createMartialFromTemplate,
  ensureMartialShape,
  getMartialPath,
  getMartialIssues,
  martialKinds,
  moveEntry as moveMartialEntry,
  resolvePresentation as resolveMartialPresentation,
} from "./domain/martial-arts.js?v=20260727-runtime-contract-2";
import { renderMartialArtsWorkspace } from "./workspaces/martial-arts.js?v=20260727-runtime-contract-2";
import {
  cloneTalent,
  createTalentDefinition,
  ensureTalentShape,
  getTalentIssues,
} from "./domain/talents.js?v=20260727-runtime-contract-2";
import { renderTalentWorkspace } from "./workspaces/talents.js?v=20260727-runtime-contract-2";
import {
  buildResourceCatalog,
  findAssetPath as findCatalogAssetPath,
  isAudioAsset,
  isImageAsset,
  normalizeArtAssetValue,
} from "./domain/resource-catalog.js?v=20260726-biography-1";
import { renderResourcesWorkspace } from "./workspaces/resources.js?v=20260711-stage5b-2";
import { renderAchievementWorkspace } from "./workspaces/achievements.js?v=20260727-world-triggers-1";
import {
  collectStoryDeclaredVariablesFromJson,
  getStoryCommandNames,
  getStoryCommandParameter,
  validateStoryRuntimeContract,
} from "./domain/story-runtime-contract.js?v=20260726-story-contract-1";
import { createResourcePickerModel } from "./domain/resource-picker.js?v=20260711-stage5c-1";
import { bindResourcePickerKeyboard, restoreResourcePickerKeyboardFocus } from "./ui/resource-picker-keyboard.js?v=20260711-stage5c-1";
import { bindScrollMemory, resetScrollMemory } from "./ui/scroll-memory.js?v=20260712-search-1";
import {
  buildDraftStoryGraph,
  buildStoryDocuments,
  buildStoryGraphProjection,
  findJsonDifferences,
  matchesStoryDocument,
  mergeDraftStoryGraph,
  resolveStoryDocument,
} from "./domain/story-workspace.js?v=20260714-workspace-context-1";
import { destroyStoryGraph, fitStoryGraph, focusStoryGraph, renderStoryGraph } from "./ui/story-graph.js?v=20260712-stage12-2";

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
  ["item-tags.json", "物品标签"],
  ["items.json", "物品"],
  ["legend-skills.json", "奥义"],
  ["maps.json", "地图"],
  ["resources.json", "资源"],
  ["scoped-battle-effects.json", "范围战斗效果"],
  ["sects.json", "门派"],
  ["shops.json", "商店"],
  ["special-skills.json", "绝技"],
  ["talents.json", "天赋"],
  ["towers.json", "爬塔"],
  ["world-triggers.json", "世界触发器"],
]);

const elements = {
  appShell: document.getElementById("appShell"),
  workspaceLauncher: document.getElementById("workspaceLauncher"),
  workspaceLauncherForm: document.getElementById("workspaceLauncherForm"),
  workspaceLauncherPath: document.getElementById("workspaceLauncherPath"),
  workspaceLauncherBrowse: document.getElementById("workspaceLauncherBrowse"),
  workspaceLauncherOpen: document.getElementById("workspaceLauncherOpen"),
  workspaceLauncherStatus: document.getElementById("workspaceLauncherStatus"),
  workspaceLauncherRecentSection: document.getElementById("workspaceLauncherRecentSection"),
  workspaceLauncherRecentList: document.getElementById("workspaceLauncherRecentList"),
  workspaceLauncherClearRecent: document.getElementById("workspaceLauncherClearRecent"),
  workspaceLauncherCancel: document.getElementById("workspaceLauncherCancel"),
  workspaceSwitchButton: document.getElementById("workspaceSwitchButton"),
  workspaceContextName: document.getElementById("workspaceContextName"),
  dataShortcutButton: document.getElementById("dataShortcutButton"),
  assetsShortcutButton: document.getElementById("assetsShortcutButton"),
  editorVersion: document.getElementById("editorVersion"),
  coreLoadState: document.getElementById("coreLoadState"),
  workspacePath: document.getElementById("workspacePath"),
  navigationToggleButton: document.getElementById("navigationToggleButton"),
  projectNavigationToggle: document.getElementById("projectNavigationToggle"),
  projectNavigationItems: document.getElementById("projectNavigationItems"),
  contentNavigationToggle: document.getElementById("contentNavigationToggle"),
  contentNavigationItems: document.getElementById("contentNavigationItems"),
  toolsNavigationToggle: document.getElementById("toolsNavigationToggle"),
  toolsNavigationItems: document.getElementById("toolsNavigationItems"),
  rawDataNavigationCount: document.getElementById("rawDataNavigationCount"),
  rawDataNavigationList: document.getElementById("rawDataNavigationList"),
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
  achievementsTab: document.getElementById("achievementsTab"),
  mapsTab: document.getElementById("mapsTab"),
  growthTab: document.getElementById("growthTab"),
  sectsTab: document.getElementById("sectsTab"),
  itemsTab: document.getElementById("itemsTab"),
  shopsTab: document.getElementById("shopsTab"),
  battlesTab: document.getElementById("battlesTab"),
  martialTab: document.getElementById("martialTab"),
  talentsTab: document.getElementById("talentsTab"),
  sidebarBrowser: document.getElementById("sidebarBrowser"),
  editorPane: document.getElementById("editorPane"),
  homeView: document.getElementById("homeView"),
  problemCenterView: document.getElementById("problemCenterView"),
  characterWorkspaceView: document.getElementById("characterWorkspaceView"),
  achievementWorkspaceView: document.getElementById("achievementWorkspaceView"),
  mapWorkspaceView: document.getElementById("mapWorkspaceView"),
  growthWorkspaceView: document.getElementById("growthWorkspaceView"),
  sectWorkspaceView: document.getElementById("sectWorkspaceView"),
  itemWorkspaceView: document.getElementById("itemWorkspaceView"),
  shopWorkspaceView: document.getElementById("shopWorkspaceView"),
  battleWorkspaceView: document.getElementById("battleWorkspaceView"),
  martialWorkspaceView: document.getElementById("martialWorkspaceView"),
  talentWorkspaceView: document.getElementById("talentWorkspaceView"),
  resourceWorkspaceView: document.getElementById("resourceWorkspaceView"),
  workspacePaneHeader: document.getElementById("workspacePaneHeader"),
  editorTools: document.getElementById("editorTools"),
  editorStatusbar: document.getElementById("editorStatusbar"),
  workspaceEyebrow: document.getElementById("workspaceEyebrow"),
  browserTitle: document.getElementById("browserTitle"),
  modSelect: document.getElementById("modSelect"),
  formatButton: document.getElementById("formatButton"),
  validateButton: document.getElementById("validateButton"),
  saveButton: document.getElementById("saveButton"),
  themeToggleButton: document.getElementById("themeToggleButton"),
  undoButton: document.getElementById("undoButton"),
  redoButton: document.getElementById("redoButton"),
  dataTab: document.getElementById("dataTab"),
  storyTab: document.getElementById("storyTab"),
  assetsTab: document.getElementById("assetsTab"),
  fileSearch: document.getElementById("fileSearch"),
  fileList: document.getElementById("fileList"),
  editorViewModes: document.getElementById("editorViewModes"),
  sourceModeButton: document.getElementById("sourceModeButton"),
  jsonModeButton: document.getElementById("jsonModeButton"),
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
let monacoInitializationPromise = null;
let storyGraphLoadingPromise = null;
let assetFilesLoadingPromise = null;
let assetFilesLoaded = false;
let storyGraphRenderVersion = 0;
let contentAnalysisRevision = 0;
let projectProblemsCache = null;
let problemIndicatorTimer = 0;
let activeMapCanvasController = null;
let mapSavedContent = "";
let applyingMapHistory = false;
const characterPortraitCache = new WeakMap();
const characterIssueCache = new WeakMap();
const itemPictureCache = new WeakMap();
const itemIssueCache = new WeakMap();

function invalidateContentAnalysis() {
  contentAnalysisRevision += 1;
  projectProblemsCache = null;
}

function scheduleProblemIndicators() {
  window.clearTimeout(problemIndicatorTimer);
  problemIndicatorTimer = window.setTimeout(() => {
    problemIndicatorTimer = 0;
    renderProblemIndicators();
  }, 180);
}

const preferences = createPreferences();
const recentItemsStore = createRecentItemsStore({
  preferences,
  storageKey: storageKeys.recentEntries,
});
const events = createEventBus();
const api = createEditorApi({ getActiveModId: () => state.activeModId });
const commandRegistry = createCommandRegistry();
const mapHistory = createDocumentHistory({ limit: 120 });
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
  navigationSectionsPreferenceKey: storageKeys.navigationSections,
  scheduleLayout: scheduleEditorLayout,
});
const { requestJson } = api;
commandRegistry.register("file.save", saveCurrentFile, { shortcut: "mod+s" });
commandRegistry.register("file.format", formatCurrentJson, { shortcut: "mod+shift+f" });
commandRegistry.register("edit.undo-map", undoMapEdit, {
  shortcut: "mod+z",
  when: () => state.mode === "maps" && mapHistory.canUndo(),
});
commandRegistry.register("edit.redo-map", redoMapEdit, {
  shortcut: "mod+shift+z",
  when: () => state.mode === "maps" && mapHistory.canRedo(),
});

elements.navigationToggleButton.addEventListener("click", () => {
  setNavigationCollapsed(!state.shell.navigationCollapsed);
});
elements.projectNavigationToggle.addEventListener("click", () => shellController.toggleNavigationSection("project"));
elements.contentNavigationToggle.addEventListener("click", () => shellController.toggleNavigationSection("content"));
elements.toolsNavigationToggle.addEventListener("click", () => shellController.toggleNavigationSection("tools"));
elements.inspectorToggleButton.addEventListener("click", () => {
  setContextDrawerOpen(!state.shell.contextDrawerOpen);
});
elements.inspectorCloseButton.addEventListener("click", () => setContextDrawerOpen(false));
elements.contextDrawerBackdrop.addEventListener("click", () => setContextDrawerOpen(false));
elements.problemCenterButton.addEventListener("click", () => requestWorkspaceChange("problems"));
elements.homeTab.addEventListener("click", () => requestWorkspaceChange("home"));
elements.problemsTab.addEventListener("click", () => requestWorkspaceChange("problems"));
elements.charactersTab.addEventListener("click", () => requestWorkspaceChange("characters"));
elements.achievementsTab.addEventListener("click", () => requestWorkspaceChange("achievements"));
elements.mapsTab.addEventListener("click", () => requestWorkspaceChange("maps"));
elements.growthTab.addEventListener("click", () => requestWorkspaceChange("growth"));
elements.sectsTab.addEventListener("click", () => requestWorkspaceChange("sects"));
elements.itemsTab.addEventListener("click", () => requestWorkspaceChange("items"));
elements.shopsTab.addEventListener("click", () => requestWorkspaceChange("shops"));
elements.battlesTab.addEventListener("click", () => requestWorkspaceChange("battles"));
elements.martialTab.addEventListener("click", () => requestWorkspaceChange("martial"));
elements.talentsTab.addEventListener("click", () => requestWorkspaceChange("talents"));
elements.dataTab.addEventListener("click", () => requestWorkspaceChange("data"));
elements.storyTab.addEventListener("click", () => requestWorkspaceChange("story"));
elements.assetsTab.addEventListener("click", () => requestWorkspaceChange("assets"));
bindImeSafeInput(elements.fileSearch, () => {
  resetScrollMemory(state.workspaceScrollPositions, "sidebar:story");
  resetScrollMemory(state.workspaceScrollPositions, "sidebar:data");
  resetScrollMemory(state.workspaceScrollPositions, "sidebar:assets");
  renderFileList();
});
elements.sourceModeButton.addEventListener("click", () => setViewMode("dsl"));
elements.jsonModeButton.addEventListener("click", () => setViewMode("json"));
elements.saveStorySourceButton.addEventListener("click", saveCurrentStoryJsonAsSource);
elements.formatButton.addEventListener("click", formatCurrentJson);
elements.validateButton.addEventListener("click", runProjectChecks);
elements.saveButton.addEventListener("click", saveCurrentFile);
elements.themeToggleButton.addEventListener("click", () => {
  setEditorTheme(document.documentElement.dataset.theme === "warm" ? "light" : "warm");
});
elements.undoButton.addEventListener("click", undoMapEdit);
elements.redoButton.addEventListener("click", redoMapEdit);
elements.newStoryButton.addEventListener("click", openNewStoryDialog);
elements.newSpeakerButton.addEventListener("click", openSpeakerToolDialog);
elements.portraitCheckButton.addEventListener("click", runPortraitCheckFromToolbar);
elements.characterCheckButton.addEventListener("click", focusCheckResults);
elements.modSelect.addEventListener("change", () => switchMod(elements.modSelect.value));
elements.workspaceLauncherForm.addEventListener("submit", (event) => {
  event.preventDefault();
  openWorkspace(elements.workspaceLauncherPath.value);
});
elements.workspaceLauncherBrowse.addEventListener("click", pickWorkspaceFolder);
elements.workspaceLauncherClearRecent.addEventListener("click", clearRecentWorkspaces);
elements.workspaceLauncherCancel.addEventListener("click", hideWorkspaceLauncher);
elements.workspaceLauncher.addEventListener("click", (event) => {
  if (event.target === elements.workspaceLauncher && elements.workspaceLauncher.classList.contains("overlay")) {
    hideWorkspaceLauncher();
  }
});
elements.workspaceSwitchButton.addEventListener("click", requestWorkspaceSwitch);
elements.dataShortcutButton.addEventListener("click", () => requestWorkspaceChange("data"));
elements.assetsShortcutButton.addEventListener("click", () => requestWorkspaceChange("assets"));
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

setEditorTheme(document.documentElement.dataset.theme, false);
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

function setEditorTheme(theme, persist = true) {
  const normalizedTheme = theme === "light" ? "light" : "warm";
  const isWarm = normalizedTheme === "warm";
  const switchLabel = isWarm ? "切换到明亮主题" : "切换到暖色主题";

  document.documentElement.dataset.theme = normalizedTheme;
  elements.themeToggleButton.classList.toggle("active", isWarm);
  elements.themeToggleButton.setAttribute("aria-pressed", String(isWarm));
  elements.themeToggleButton.setAttribute("aria-label", switchLabel);
  elements.themeToggleButton.title = switchLabel;

  if (persist) {
    preferences.set(storageKeys.theme, normalizedTheme);
  }
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
  if (monacoState.ready) return Promise.resolve(true);
  if (monacoInitializationPromise) return monacoInitializationPromise;
  if (!elements.monacoHost || !window.require) {
    useLegacyTextEditor();
    return Promise.resolve(false);
  }

  monacoInitializationPromise = new Promise((resolve) => {
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
  return monacoInitializationPromise;
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
      { open: '"', close: '"' },
    ],
  });
  monaco.languages.setMonarchTokensProvider("storydsl", {
    defaultToken: "",
    keywords: [
      "if", "elif", "else", "when", "battle", "jump", "call", "return",
      "and", "or", "not", "win", "lose", "timeout",
    ],
    tokenizer: {
      root: [
        [/\/\/.*$/, "comment"],
        [/^(#)(.*)$/, ["keyword", "type.identifier"]],
        [/^(\s*)(-)(\s*)(win|lose|timeout)\b/, ["", "keyword", "", "keyword"]],
        [/^(\s*)(-)(\s*)(.*)$/, ["", "keyword", "", "string"]],
        [/^(\s*)(if|elif|else|when|battle|jump|call|return)\b/, ["", "keyword"]],
        [/^(\s*)([A-Za-z_][\w.]*)\b/, ["", "identifier"]],
        [/^(\s*)([^:：\s][^:：]*)([:：])/, ["", "type.identifier", "delimiter"]],
        [/\$[A-Za-z_][\w\u4e00-\u9fa5]*/, "variable"],
        [/[+-]?\d+(?:\.\d+)?/, "number"],
        [/[=!<>]=?|&&|\|\||!/, "operator"],
        [/[\[\],()]/, "delimiter"],
      ],
    },
  });
  monaco.languages.registerCompletionItemProvider("storydsl", {
    triggerCharacters: [" ", "：", ":", "#", "-"],
    provideCompletionItems(model, position) {
      const line = model.getLineContent(position.lineNumber).slice(0, position.column - 1);
      if (line.trimStart().startsWith("//")) return { suggestions: [] };
      const currentToken = /[^\s]*$/u.exec(line)?.[0] || "";
      const range = new monaco.Range(
        position.lineNumber,
        Math.max(1, position.column - currentToken.length),
        position.lineNumber,
        position.column,
      );
      const completedText = line.slice(0, line.length - currentToken.length).trim();
      const completedParts = completedText ? completedText.split(/\s+/u) : [];
      const command = completedParts[0] || "";
      const argumentIndex = completedParts.length - 1;

      if (command === "jump" || command === "call") return storySegmentCompletionItems(range);
      const argumentItems = storyCommandArgumentCompletionItems(command, argumentIndex, range);
      if (argumentItems.length > 0) return { suggestions: argumentItems };
      if (completedParts.length > 0) return { suggestions: [] };

      const suggestions = [
        createStorySnippetCompletion("剧情段", "# ${1:segment_id}\n${2:旁白：剧情内容}", "创建新的剧情段", range),
        createStorySnippetCompletion("对话", "${1:旁白}：${2:对白内容}", "添加一行对白", range),
        createStorySnippetCompletion("选择分支", "${1:旁白}：${2:请选择}\n- ${3:选项一}\n  jump ${4:target}\n- ${5:选项二}\n  jump ${6:target}", "添加选择及跳转", range),
        createStorySnippetCompletion("条件选项", "${1:旁白}：${2:请选择}\n- ${3:普通选项}\n  ${4:jump normal}\nwhen ${5:$rank >= 2}\n  - ${6:条件选项}\n    ${7:jump special}", "添加按条件成组显示的选项", range),
        createStorySnippetCompletion("条件分支", "if ${1:$flag == true}\n  ${2:jump target}\nelif ${3:$flag == false}\n  ${4:jump other}\nelse\n  ${5:jump fallback}", "添加 if / elif / else", range),
        createStorySnippetCompletion("战斗结果", "battle ${1:battle_id}\n- win\n  ${2:jump win_target}\n- lose\n  ${3:jump lose_target}", "添加战斗胜负分支", range),
        ...getStoryDslCommandNames().map((name) => ({
          label: name,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: `${name} `,
          detail: "剧情命令",
          range,
        })),
        ...["jump", "call", "return", "if", "elif", "else", "when", "battle"].map((name) => ({
          label: name,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: name === "return" ? name : `${name} `,
          range,
        })),
        ...Array.from(state.contentIndex.storySpeakers.keys()).map((speaker) => ({
          label: speaker,
          kind: monaco.languages.CompletionItemKind.Value,
          insertText: `${speaker}：`,
          detail: "已有说话人",
          range,
        })),
      ];
      return { suggestions };
    },
  });
}

const storyDslCommandNames = [
  "animation", "arena", "background", "clear_flag", "clear_time_key", "cost_day", "cost_item", "cost_money",
  "daode", "effect", "follow", "game", "gamefin", "gameover", "get_exp", "get_money", "get_point", "grant_exp",
  "grant_point", "growtemplate", "haogan", "head", "input_name", "item", "join", "learn", "leave",
  "leave_all", "leave_follow", "levelup", "log", "mainmenu", "map", "maxlevel", "menpai", "minus_maxpoints",
  "music", "newbie", "nextzhoumu", "nick", "random_item", "rank", "remove", "restart", "roll_stats",
  "select_head", "select_menpai", "select_sect", "set_flag", "set_game_mode", "set_map", "set_round", "set_time_key",
  "shake", "shop", "suggest", "toast", "touch", "tower", "trial", "tutorial", "upgrade", "world_trigger",
  "xilian", "yuanbao", "zhenlongqiju", "huashan",
];

function getStoryDslCommandNames() {
  const contractNames = getStoryCommandNames(state.contentContract?.story);
  if (contractNames.length > 0) return contractNames;
  return [...new Set([
    ...storyDslCommandNames,
    ...(state.storyGraph?.commands || []).map((command) => command.name),
  ])].sort((left, right) => left.localeCompare(right));
}

function createStorySnippetCompletion(label, insertText, detail, range) {
  return {
    label,
    kind: monaco.languages.CompletionItemKind.Snippet,
    insertText,
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    detail,
    range,
  };
}

function storySegmentCompletionItems(range) {
  const ids = new Set((state.storyGraph?.nodes || []).map((node) => node.id));
  if (state.storySource.kind === "source") {
    for (const entry of getStoryDslOutlineEntries(getEditorValue())) ids.add(entry.title);
  }
  return {
    suggestions: [...ids].sort((left, right) => left.localeCompare(right, "zh-Hans-CN")).map((id) => ({
      label: id,
      kind: monaco.languages.CompletionItemKind.Reference,
      insertText: id,
      detail: "剧情段",
      range,
    })),
  };
}

function storyCommandArgumentCompletionItems(command, argumentIndex, range) {
  let options = [];
  if (["item", "cost_item", "random_item"].includes(command) && argumentIndex === 0) {
    options = Array.from(state.contentIndex.itemsById.values()).map((item) => ({ id: item.id, name: item.name, type: "物品" }));
  } else if (["join", "follow", "leave", "leave_follow", "grant_point", "get_point", "grant_exp", "get_exp", "levelup", "minus_maxpoints", "growtemplate", "animation", "input_name", "select_head"].includes(command) && argumentIndex === 0) {
    options = uniqueStoryCharacters();
  } else if (["learn", "remove"].includes(command) && argumentIndex === 0) {
    options = ["skill", "external", "internal", "special", "talent"].map((id) => ({ id, type: "技能类型" }));
  } else if (command === "upgrade" && argumentIndex === 0) {
    options = [
      "stat", "skill", "external", "internal", "quanzhang", "jianfa", "daofa", "qimen", "bili", "shenfa",
      "wuxing", "fuyuan", "gengu", "dingli", "wuxue", "max_hp", "max_mp", "attack", "defence", "evasion",
      "accuracy", "crit_chance", "crit_mult", "anti_crit_chance", "lifesteal", "anti_debuff", "speed", "movement",
    ].map((id) => ({ id, type: "成长类型或属性" }));
  } else if (["learn", "remove", "upgrade"].includes(command) && argumentIndex === 1) {
    options = uniqueStoryCharacters();
  } else if (["learn", "remove", "upgrade"].includes(command) && argumentIndex === 2) {
    options = storySkillCompletionOptions(completedStoryCommandArgument(command, 0));
  } else if (command === "maxlevel" && argumentIndex === 0) {
    options = storySkillCompletionOptions("skill");
  } else if (command === "growtemplate" && argumentIndex === 1) {
    options = storyDefinitionCompletionOptions("grow-templates");
  } else if (command === "menpai" && argumentIndex === 0) {
    options = storyDefinitionCompletionOptions("sects");
  } else if (command === "nick" && argumentIndex === 0) {
    options = (state.contentIndex.resourcesByGroup.get("nick") || []).map((resource) => {
      const id = String(resource.id || "").replace(/^nick\./u, "");
      return { id, name: id, type: resource.value ? `成就 · ${resource.value}` : "成就" };
    });
  } else if (command === "set_game_mode" && argumentIndex === 0) {
    options = ["normal", "hard", "crazy"].map((id) => ({ id, type: "难度" }));
  } else if (["toast", "world_trigger"].includes(command) && argumentIndex === 0) {
    options = ["on", "off"].map((id) => ({ id, type: "开关" }));
  } else if (command === "set_time_key" && argumentIndex === 2) {
    return storySegmentCompletionItems(range).suggestions;
  } else if (command === "music") {
    options = storyResourceCompletionOptions(["音乐", "战斗音乐"]);
  } else if (command === "background") {
    options = storyResourceCompletionOptions(["地图", "场景", ""]);
  } else if (command === "effect") {
    options = storyResourceCompletionOptions(["音效"]);
  } else if (command === "head") {
    options = storyResourceCompletionOptions(["头像"]);
  } else {
    const typeByCommand = { map: "maps", set_map: "maps", tutorial: "maps", shop: "shops", battle: "battles" };
    if (typeByCommand[command] && argumentIndex === 0) options = storyDefinitionCompletionOptions(typeByCommand[command]);
  }
  if (options.length === 0) {
    const parameter = getStoryCommandParameter(state.contentContract?.story, command, argumentIndex);
    if (parameter?.allowedValues?.length) {
      options = parameter.allowedValues.map((id) => ({ id, type: "运行时允许值" }));
    } else if (parameter?.referenceType === "story") {
      return storySegmentCompletionItems(range).suggestions;
    } else if (parameter?.referenceType) {
      options = storyRuntimeReferenceCompletionOptions(parameter.referenceType);
    }
  }
  return options
    .filter((option) => option.id)
    .sort((left, right) => String(left.name || left.id).localeCompare(String(right.name || right.id), "zh-Hans-CN"))
    .map((option) => ({
      label: option.name && option.name !== option.id ? `${option.name} (${option.id})` : option.id,
      filterText: `${option.id} ${option.name || ""}`,
      kind: monaco.languages.CompletionItemKind.Reference,
      insertText: option.id,
      detail: option.type || "内容引用",
      range,
    }));
}

function storyRuntimeReferenceCompletionOptions(type) {
  if (type === "characters") return uniqueStoryCharacters();
  if (type === "skills") return storySkillCompletionOptions("skill")
    .concat(storyDefinitionCompletionOptions("talents"));
  if (type === "achievements") {
    return (state.contentIndex.resourcesByGroup.get("nick") || []).map((resource) => {
      const id = String(resource.id || "").replace(/^nick\./u, "");
      return { id, name: id, type: "成就" };
    });
  }
  if (type === "resources") {
    return state.contentIndex.resourceRecords
      .map((resource) => ({ id: resource.id, name: resource.value, type: resource.group || "资源" }));
  }
  if (type.startsWith("resource:")) {
    return (state.contentIndex.resourcesByGroup.get(type.slice("resource:".length)) || [])
      .map((resource) => ({ id: resource.id, name: resource.value, type: "资源" }));
  }
  return storyDefinitionCompletionOptions(type);
}

function storyResourceCompletionOptions(groups) {
  return groups.flatMap((group) => state.contentIndex.resourcesByGroup.get(group) || [])
    .map((resource) => ({ id: resource.id, name: resource.value, type: resource.group || "资源" }));
}

function completedStoryCommandArgument(command, argumentIndex) {
  const line = monacoState.editor?.getPosition()?.lineNumber;
  if (!line) return "";
  const text = monacoState.editor.getModel()?.getLineContent(line).trim() || "";
  const parts = text.split(/\s+/u);
  return parts[0] === command ? parts[argumentIndex + 1] || "" : "";
}

function storySkillCompletionOptions(kind) {
  const typesByKind = {
    external: ["external-skills"],
    internal: ["internal-skills"],
    special: ["special-skills"],
    talent: ["talents"],
    skill: ["external-skills", "internal-skills", "special-skills"],
  };
  return (typesByKind[kind] || []).flatMap(storyDefinitionCompletionOptions);
}

function storyDefinitionCompletionOptions(type) {
  const options = [];
  for (const definitions of state.contentIndex.definitionsById.values()) {
    for (const definition of definitions) {
      if (definition.type === type) options.push({ id: definition.id, name: definition.displayName, type });
    }
  }
  return options;
}

function uniqueStoryCharacters() {
  const seen = new Set();
  const characters = [];
  for (const character of state.contentIndex.charactersByIdOrName.values()) {
    if (!character?.id || seen.has(character.id)) continue;
    seen.add(character.id);
    characters.push({ id: character.id, name: character.name, type: "角色" });
  }
  return characters;
}

function handleTextEditorInput() {
  dirtyStateController.markDirty({ render: false });
  if (isStorySourceFile() && state.viewMode === "dsl") {
    updateStoryDslAnalysis({ showSuccess: false });
  } else if (isStoryJsonDslFile() && state.viewMode === "json") {
    state.storySource.jsonText = getEditorValue();
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
  try {
    const workspace = await requestJson("/api/workspace");
    if (!workspace?.isOpen) {
      showWorkspaceLauncher({ message: workspace?.message || "尚未打开工作区。" });
      return;
    }

    setWorkspaceLauncherStatus("正在载入工作区...", "busy");
    await loadWorkspace(workspace);
    const [, contract] = await Promise.all([
      loadDataFiles(),
      requestJson("/api/content-contract"),
      initializeMonacoEditor(),
    ]);
    state.contentContract = contract;
    window.StoryDsl.configureRuntimeContract(contract?.story);
    state.recentEntries = recentItemsStore.read(state.activeModId);
    await rebuildContentIndex();
    rememberCurrentWorkspace();
    setMode("home");
    hideWorkspaceLauncher();
  } catch (error) {
    showWorkspaceLauncher({
      message: error instanceof Error ? error.message : String(error),
      error: true,
    });
  }
}

async function loadWorkspace(workspace = null) {
  state.workspace = workspace || await requestJson("/api/workspace");
  state.mods = Array.isArray(state.workspace.mods) ? state.workspace.mods : [];
  const savedModId = preferences.get(storageKeys.activeModId);
  const defaultModId = state.workspace.defaultModId || "jyxr-base";
  state.activeModId = state.mods.some((mod) => mod.id === savedModId)
    ? savedModId
    : state.mods.some((mod) => mod.id === defaultModId)
      ? defaultModId
      : state.mods[0]?.id || defaultModId;

  const requestedModId = state.activeModId;
  let validation = await validateActiveMod({ render: false });
  if (!validation.ok) {
    const fallbackCandidates = [
      defaultModId,
      "jyxr-base",
      ...state.mods.filter((mod) => mod.dataExists).map((mod) => mod.id),
    ].filter((id, index, values) => id && id !== requestedModId && values.indexOf(id) === index);
    for (const candidate of fallbackCandidates) {
      if (!state.mods.some((mod) => mod.id === candidate)) continue;
      state.activeModId = candidate;
      const candidateValidation = await validateActiveMod({ render: false });
      if (candidateValidation.ok) {
        validation = candidateValidation;
        preferences.set(storageKeys.activeModId, candidate);
        showValidation(false, `MOD「${requestedModId}」与当前运行时不兼容，已切换到「${candidate}」：${state.modValidationById.get(requestedModId)?.message || "内容加载失败"}`);
        break;
      }
    }
  }
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

function showWorkspaceLauncher({ message = "", error = false } = {}) {
  const recent = readRecentWorkspaces();
  const currentPath = state.workspace?.rootPath || "";
  const overlay = Boolean(state.workspace?.isOpen && !elements.appShell.hidden);
  elements.workspaceLauncherPath.value = currentPath || recent[0] || "";
  elements.workspaceLauncherCancel.hidden = !state.workspace?.isOpen;
  elements.workspaceLauncherCancel.textContent = overlay ? "关闭" : "返回当前工作区";
  elements.workspaceLauncher.classList.toggle("overlay", overlay);
  elements.workspaceLauncher.hidden = false;
  elements.appShell.hidden = !overlay;
  document.body.classList.toggle("workspace-launcher-open", overlay);
  renderRecentWorkspaces(recent);
  setWorkspaceLauncherStatus(message || "尚未打开工作区。", error ? "error" : "");
  requestAnimationFrame(() => elements.workspaceLauncherPath.focus({ preventScroll: true }));
}

function hideWorkspaceLauncher() {
  if (!state.workspace?.isOpen) {
    return;
  }

  elements.workspaceLauncher.hidden = true;
  elements.workspaceLauncher.classList.remove("overlay");
  elements.appShell.hidden = false;
  document.body.classList.remove("workspace-launcher-open");
  setWorkspaceLauncherBusy(false);
  scheduleEditorLayout();
}

async function requestWorkspaceSwitch() {
  elements.workspaceSwitchButton.closest("details")?.removeAttribute("open");
  if (!(await confirmDiscardChanges())) {
    return;
  }

  showWorkspaceLauncher({ message: `当前工作区：${state.workspace.rootPath}` });
}

async function openWorkspace(pathValue) {
  const path = normalizeWorkspacePath(pathValue);
  if (!path) {
    setWorkspaceLauncherStatus("请输入工作区绝对路径。", "error");
    elements.workspaceLauncherPath.focus({ preventScroll: true });
    return;
  }

  setWorkspaceLauncherBusy(true);
  setWorkspaceLauncherStatus("正在验证工作区...", "busy");
  try {
    const workspace = await requestJson("/api/workspace/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    });
    writeRecentWorkspaces(rememberWorkspacePath(readRecentWorkspaces(), workspace.rootPath));
    window.location.reload();
  } catch (error) {
    setWorkspaceLauncherBusy(false);
    setWorkspaceLauncherStatus(error instanceof Error ? error.message : String(error), "error");
  }
}

async function pickWorkspaceFolder() {
  setWorkspaceLauncherBusy(true);
  setWorkspaceLauncherStatus("正在等待目录选择...", "busy");
  try {
    const result = await requestJson("/api/workspace/pick", { method: "POST" });
    if (!result.supported) {
      setWorkspaceLauncherStatus(result.message || "当前系统不支持目录选择。", "error");
      return;
    }
    if (result.canceled || !result.path) {
      setWorkspaceLauncherStatus("已取消目录选择。", "");
      return;
    }

    elements.workspaceLauncherPath.value = result.path;
    await openWorkspace(result.path);
  } catch (error) {
    setWorkspaceLauncherStatus(error instanceof Error ? error.message : String(error), "error");
  } finally {
    if (!document.hidden) {
      setWorkspaceLauncherBusy(false);
    }
  }
}

function setWorkspaceLauncherBusy(busy) {
  elements.workspaceLauncherPath.disabled = busy;
  elements.workspaceLauncherBrowse.disabled = busy;
  elements.workspaceLauncherOpen.disabled = busy;
  elements.workspaceLauncherCancel.disabled = busy;
  for (const button of elements.workspaceLauncherRecentList.querySelectorAll("button")) {
    button.disabled = busy;
  }
}

function setWorkspaceLauncherStatus(message, tone = "") {
  elements.workspaceLauncherStatus.className = `workspace-launcher-status${tone ? ` ${tone}` : ""}`;
  elements.workspaceLauncherStatus.textContent = message || "";
}

function readRecentWorkspaces() {
  try {
    return normalizeRecentWorkspaces(JSON.parse(preferences.get(storageKeys.recentWorkspaces, "[]")));
  } catch {
    return [];
  }
}

function writeRecentWorkspaces(paths) {
  preferences.set(storageKeys.recentWorkspaces, JSON.stringify(normalizeRecentWorkspaces(paths)));
  renderRecentWorkspaces(readRecentWorkspaces());
}

function rememberCurrentWorkspace() {
  if (!state.workspace?.rootPath) {
    return;
  }

  writeRecentWorkspaces(rememberWorkspacePath(readRecentWorkspaces(), state.workspace.rootPath));
}

function clearRecentWorkspaces() {
  preferences.remove(storageKeys.recentWorkspaces);
  renderRecentWorkspaces([]);
  setWorkspaceLauncherStatus("最近工作区记录已清除。", "");
}

function renderRecentWorkspaces(paths = readRecentWorkspaces()) {
  elements.workspaceLauncherRecentList.replaceChildren();
  elements.workspaceLauncherRecentSection.hidden = paths.length === 0;
  for (const path of paths) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "workspace-launcher-recent-item";
    button.title = path;
    button.addEventListener("click", () => openWorkspace(path));

    const name = document.createElement("span");
    name.className = "workspace-launcher-recent-name";
    name.textContent = getWorkspaceName(path);
    const pathText = document.createElement("span");
    pathText.className = "workspace-launcher-recent-path";
    pathText.textContent = path;
    const action = document.createElement("span");
    action.className = "workspace-launcher-recent-action";
    action.textContent = "打开";
    button.append(name, pathText, action);
    elements.workspaceLauncherRecentList.appendChild(button);
  }
}

function renderModSelect() {
  elements.modSelect.replaceChildren();
  for (const mod of state.mods) {
    const option = document.createElement("option");
    option.value = mod.id;
    const validation = state.modValidationById.get(mod.id);
    const status = validation ? (validation.ok ? "可用" : "不兼容") : "未检查";
    option.textContent = `${mod.name || mod.id} (${mod.id}) · ${status}`;
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
  const validation = state.modValidationById.get(state.activeModId);
  const validationText = validation ? (validation.ok ? "内容兼容" : "内容不兼容") : "内容未检查";
  const modText = activeMod
    ? `${activeMod.name || activeMod.id} · ${activeMod.path}/data`
    : state.activeModId;
  const summary = `正在编辑：${modText} · ${validationText}  |  共享资产：${state.workspace.assetsPath}`;
  elements.workspacePath.textContent = summary;
  elements.workspacePath.title = summary;
  renderProjectContext();
}

function renderProjectContext() {
  const rootPath = state.workspace?.rootPath || "";
  const activeMod = getActiveMod();
  const dataPath = activeMod ? `${activeMod.path}/data` : "尚未选择 MOD";
  const assetsPath = state.workspace?.assetsPath || "尚未打开工作区";
  elements.workspaceContextName.textContent = rootPath ? getWorkspaceName(rootPath) : "未打开";
  elements.workspaceSwitchButton.title = rootPath
    ? `切换工作区：${rootPath}`
    : "打开工作区";
  elements.dataShortcutButton.title = `打开数据文件：${dataPath}`;
  elements.assetsShortcutButton.title = `打开资产文件：${assetsPath}`;
  elements.dataShortcutButton.classList.toggle("active", state.mode === "data");
  elements.assetsShortcutButton.classList.toggle("active", state.mode === "assets");
  elements.dataShortcutButton.setAttribute("aria-pressed", String(state.mode === "data"));
  elements.assetsShortcutButton.setAttribute("aria-pressed", String(state.mode === "assets"));
}

async function switchMod(modId) {
  if (modId === state.activeModId) {
    return;
  }

  if (!(await confirmDiscardChanges())) {
    elements.modSelect.value = state.activeModId;
    return;
  }
  if (storyGraphLoadingPromise) await storyGraphLoadingPromise;

  state.activeModId = modId;
  preferences.set(storageKeys.activeModId, modId);
  state.currentPath = "";
  dirtyStateController.markClean({ render: false });
  state.records = [];
  state.recordsPath = "";
  state.characterWorkspace.biographyDrafts.clear();
  invalidateContentAnalysis();
  state.selectedRecordIndex = 0;
  state.dataDocumentContexts.clear();
  state.workspaceScrollPositions = {};
  resetMartialWorkspaceState();
  state.storySource = {
    path: "",
    text: "",
    jsonText: "",
    diagnostics: [],
    kind: "",
  };
  state.storyWorkspace = {
    search: "",
    view: "dsl",
    graphScope: "neighbors",
    graphFilter: "all",
    selectedDocumentPath: "",
    selectedSegmentId: "",
    selectedGraphNodeId: "",
  };
  state.selectedStoryGroupId = "";
  state.selectedStoryNodeId = "";
  state.storyGraph = null;
  setEditorValue("");
  setEditorReadOnly(false);
  setEditorLanguage("json");
  elements.currentPath.textContent = "未选择文件";
  elements.saveState.textContent = "";
  renderWorkspacePath();
  await loadDataFiles();
  await rebuildContentIndex();
  const validation = await validateActiveMod();
  showValidation(validation.ok, validation.ok
    ? `MOD「${state.activeModId}」内容加载通过。`
    : `MOD「${state.activeModId}」与当前运行时不兼容：${validation.message}`);
  state.recentEntries = recentItemsStore.read(state.activeModId);
  renderDirtyState();
  renderCursorState();
  setMode("home");
}

function getActiveMod() {
  return state.mods.find((mod) => mod.id === state.activeModId) || null;
}

async function validateActiveMod({ render = true } = {}) {
  let validation;
  try {
    validation = await requestJson("/api/validate");
  } catch (error) {
    validation = { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
  state.modValidationById.set(state.activeModId, validation);
  if (render) {
    renderModSelect();
    renderWorkspacePath();
  }
  return validation;
}

async function loadDataFiles() {
  state.dataFiles = await requestJson("/api/data/files");
  renderRawDataNavigation();
}

function renderRawDataNavigation() {
  const files = state.dataFiles.filter((file) => file.path.toLowerCase().endsWith(".json"));
  elements.rawDataNavigationCount.textContent = String(files.length);
  elements.rawDataNavigationList.replaceChildren();

  for (const file of files) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "raw-data-navigation-item";
    button.classList.toggle("active", state.mode === "data" && state.currentPath === file.path);
    button.title = file.path;

    const title = document.createElement("strong");
    title.textContent = getDataFileDisplayName(file.path) || file.name;
    const path = document.createElement("small");
    path.textContent = file.path;
    button.append(title, path);
    button.addEventListener("click", () => openRawJsonFile(file.path));
    elements.rawDataNavigationList.appendChild(button);
  }
}

async function openRawJsonFile(path) {
  const opened = await openDataFile(path);
  if (!opened) return;
  setMode("data");
  setViewMode("json");
  renderRawDataNavigation();
}

async function loadAssetFiles() {
  if (assetFilesLoadingPromise) return assetFilesLoadingPromise;
  assetFilesLoadingPromise = (async () => {
    state.assetFiles = await requestJson("/api/assets/files");
    state.assetFilePathSet = new Set(state.assetFiles.map((file) => file.path));
    state.assetBasenameIndexes = buildAssetBasenameIndexes(state.assetFiles);
    assetFilesLoaded = true;
    invalidateContentAnalysis();
  })();
  try {
    await assetFilesLoadingPromise;
  } finally {
    assetFilesLoadingPromise = null;
  }
}

async function ensureAssetFilesLoaded() {
  if (assetFilesLoaded) return;
  await loadAssetFiles();
}

function buildAssetBasenameIndexes(files) {
  const indexes = new Map([
    ["head", new Map()],
    ["item", new Map()],
  ]);
  for (const file of files) {
    const lower = String(file?.path || "").toLowerCase();
    if (!isImage(lower)) continue;
    const kind = lower.startsWith("art/head/") ? "head" : lower.startsWith("art/item/") ? "item" : "";
    if (!kind) continue;
    const basename = normalizeToolSearchValue((file.name || file.path.split("/").pop() || "").replace(/\.[^.]+$/i, ""));
    if (basename && !indexes.get(kind).has(basename)) indexes.get(kind).set(basename, file.path);
  }
  return indexes;
}

function findAssetByBasename(kind, candidates) {
  const index = state.assetBasenameIndexes.get(kind);
  if (!index) return "";
  for (const candidate of candidates) {
    const basename = normalizeToolSearchValue(candidate.split("/").pop() || "");
    const path = index.get(basename);
    if (path) return path;
  }
  return "";
}

async function loadStoryGraph() {
  if (storyGraphLoadingPromise) return storyGraphLoadingPromise;
  storyGraphLoadingPromise = (async () => {
    try {
      state.storyGraph = await requestJson("/api/story/graph");
      projectProblemsCache = null;
      if (!state.selectedStoryGroupId && state.storyGraph.groups.length > 0) {
        state.selectedStoryGroupId = state.storyGraph.groups[0].id;
      }
    } catch (error) {
      state.storyGraph = null;
      showValidation(false, error.message);
    } finally {
      storyGraphLoadingPromise = null;
      renderProblemIndicators();
    }
  })();
  return storyGraphLoadingPromise;
}

function setMode(mode) {
  const previousMode = state.mode;
  mode = normalizeWorkspaceMode(mode);
  if (mode !== state.mode) projectProblemsCache = null;
  state.mode = mode;
  const isOverview = mode === "home" || mode === "problems";
  const isStory = mode === "story";
  const isCharacters = mode === "characters";
  const isAchievements = mode === "achievements";
  const isMaps = mode === "maps";
  const isGrowth = mode === "growth";
  const isSects = mode === "sects";
  const isItems = mode === "items";
  const isShops = mode === "shops";
  const isBattles = mode === "battles";
  const isMartial = mode === "martial";
  const isTalents = mode === "talents";
  const isResources = mode === "assets";

  if (previousMode === "maps" && !isMaps) destroyActiveMapCanvas();

  if (!isStory) {
    restoreStoryEditorPlacement();
  }

  document.body.classList.toggle("story-mode", isStory);
  document.body.classList.toggle("characters-mode", isCharacters);
  document.body.classList.toggle("achievements-mode", isAchievements);
  document.body.classList.toggle("maps-mode", isMaps);
  document.body.classList.toggle("growth-mode", isGrowth);
  document.body.classList.toggle("sects-mode", isSects);
  document.body.classList.toggle("items-mode", isItems);
  document.body.classList.toggle("shops-mode", isShops);
  document.body.classList.toggle("battles-mode", isBattles);
  document.body.classList.toggle("martial-mode", isMartial);
  document.body.classList.toggle("talents-mode", isTalents);
  document.body.classList.toggle("resources-mode", isResources);
  document.body.classList.toggle("overview-mode", isOverview);
  elements.editorPane.classList.toggle("overview-workspace", isOverview);
  elements.homeTab.classList.toggle("active", mode === "home");
  elements.problemsTab.classList.toggle("active", mode === "problems");
  elements.charactersTab.classList.toggle("active", isCharacters);
  elements.achievementsTab.classList.toggle("active", isAchievements);
  elements.mapsTab.classList.toggle("active", isMaps);
  elements.growthTab.classList.toggle("active", isGrowth);
  elements.sectsTab.classList.toggle("active", isSects);
  elements.itemsTab.classList.toggle("active", isItems);
  elements.shopsTab.classList.toggle("active", isShops);
  elements.battlesTab.classList.toggle("active", isBattles);
  elements.martialTab.classList.toggle("active", isMartial);
  elements.talentsTab.classList.toggle("active", isTalents);
  elements.dataTab.classList.toggle("active", mode === "data");
  elements.storyTab.classList.toggle("active", isStory);
  elements.assetsTab.classList.toggle("active", mode === "assets");
  renderProjectContext();
  elements.homeView.classList.toggle("hidden", mode !== "home");
  elements.problemCenterView.classList.toggle("hidden", mode !== "problems");
  elements.characterWorkspaceView.classList.toggle("hidden", !isCharacters);
  elements.achievementWorkspaceView.classList.toggle("hidden", !isAchievements);
  elements.mapWorkspaceView.classList.toggle("hidden", !isMaps);
  elements.growthWorkspaceView.classList.toggle("hidden", !isGrowth);
  elements.sectWorkspaceView.classList.toggle("hidden", !isSects);
  elements.itemWorkspaceView.classList.toggle("hidden", !isItems);
  elements.shopWorkspaceView.classList.toggle("hidden", !isShops);
  elements.battleWorkspaceView.classList.toggle("hidden", !isBattles);
  elements.martialWorkspaceView.classList.toggle("hidden", !isMartial);
  elements.talentWorkspaceView.classList.toggle("hidden", !isTalents);
  elements.resourceWorkspaceView.classList.toggle("hidden", !isResources);
  elements.workspacePaneHeader.classList.toggle("hidden", isOverview || isStory || isCharacters || isAchievements || isMaps || isGrowth || isSects || isItems || isShops || isBattles || isMartial || isTalents || isResources);
  elements.editorTools.classList.toggle("hidden", isOverview || isStory || isCharacters || isAchievements || isMaps || isGrowth || isSects || isItems || isShops || isBattles || isMartial || isTalents || isResources);
  elements.editorStatusbar.classList.toggle("hidden", isOverview || isStory || isCharacters || isAchievements || isMaps || isGrowth || isSects || isItems || isShops || isBattles || isMartial || isTalents || isResources);

  elements.fileSearch.value = "";
  elements.fileSearch.placeholder = isStory
    ? "搜索剧情文档"
    : mode === "assets"
      ? "搜索资产"
      : "搜索文件";
  const canSaveStory = isStory && (isStorySourceFile() || isStoryJsonFile());
  elements.saveButton.disabled = mode !== "data" && !canSaveStory && !isCharacters && !isAchievements && !isMaps && !isGrowth && !isSects && !isItems && !isShops && !isBattles && !isMartial && !isTalents;
  elements.formatButton.disabled = mode !== "data";
  renderMapHistoryControls();

  if (mode === "home") {
    elements.storyView.classList.add("hidden");
    setTextEditorVisible(false);
    renderProjectHomeWorkspace();
  } else if (mode === "problems") {
    elements.storyView.classList.add("hidden");
    setTextEditorVisible(false);
    renderProblemCenterWorkspace();
  } else if (isCharacters) {
    elements.storyView.classList.add("hidden");
    setTextEditorVisible(false);
    elements.currentPath.textContent = "characters.json";
    renderCharacterWorkspaceView();
  } else if (isAchievements) {
    elements.storyView.classList.add("hidden");
    setTextEditorVisible(false);
    elements.currentPath.textContent = "resources.json · world-triggers.json";
    renderAchievementWorkspaceView();
  } else if (isMaps) {
    elements.storyView.classList.add("hidden");
    setTextEditorVisible(false);
    elements.currentPath.textContent = "maps.json";
    renderMapWorkspaceView();
  } else if (isGrowth) {
    elements.storyView.classList.add("hidden");
    setTextEditorVisible(false);
    elements.currentPath.textContent = "grow-templates.json";
    renderGrowthWorkspaceView();
  } else if (isSects) {
    elements.storyView.classList.add("hidden");
    setTextEditorVisible(false);
    elements.currentPath.textContent = "sects.json";
    renderSectWorkspaceView();
  } else if (isItems) {
    elements.storyView.classList.add("hidden");
    setTextEditorVisible(false);
    elements.currentPath.textContent = "items.json";
    renderItemWorkspaceView();
  } else if (isShops) {
    elements.storyView.classList.add("hidden");
    setTextEditorVisible(false);
    elements.currentPath.textContent = "shops.json";
    renderShopWorkspaceView();
  } else if (isBattles) {
    elements.storyView.classList.add("hidden");
    setTextEditorVisible(false);
    elements.currentPath.textContent = "battles.json";
    renderBattleWorkspaceView();
  } else if (isMartial) {
    elements.storyView.classList.add("hidden");
    setTextEditorVisible(false);
    elements.currentPath.textContent = "武学与奥义";
    renderMartialWorkspaceView();
  } else if (isTalents) {
    elements.storyView.classList.add("hidden");
    setTextEditorVisible(false);
    elements.currentPath.textContent = "talents.json";
    renderTalentWorkspaceView();
  } else if (isResources) {
    elements.storyView.classList.add("hidden");
    setTextEditorVisible(false);
    renderResourceWorkspaceView();
  } else if (isStory) {
    elements.currentPath.textContent = state.currentPath || "剧情与任务";
    elements.assetPreview.textContent = "流程视图由当前剧情草稿生成";
    elements.saveStorySourceButton.classList.add("hidden");
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
      state.viewMode = "json";
      elements.editorViewModes.classList.add("hidden");
      setTextEditorVisible(true);
    }
    renderEditorOutline();
  }

  updateStorySourceButton();
  renderShellContext();
  if (!isOverview && !isCharacters && !isMaps && !isGrowth && !isItems && !isShops && !isBattles && !isMartial && !isTalents && !isResources) {
    renderFileList();
    renderCurrentFileInfo();
  }
  renderProblemIndicators();
  renderRawDataNavigation();
  scheduleEditorLayout();
}


async function requestWorkspaceChange(mode) {
  if (mode === state.mode) return;
  if (state.mode === "martial" && dirtyStateController.isDirty()) {
    if (!(await confirmDiscardChanges("武学区有尚未保存的修改，是否放弃全部修改？"))) return;
    resetMartialWorkspaceState();
    dirtyStateController.markClean({ render: false });
  }
  const switchingCharacterSurface = isCharacterFile()
    && ((state.mode === "characters" && mode === "data") || (state.mode === "data" && mode === "characters"));
  if (switchingCharacterSurface) {
    if (mode === "characters") {
      try {
        const records = parseJsonText(getEditorValue());
        if (!Array.isArray(records) || !records.every((record) => record && typeof record === "object" && !Array.isArray(record))) {
          throw new Error("characters.json 顶层必须是角色对象数组。");
        }
        state.records = records;
        state.selectedRecordIndex = Math.min(state.selectedRecordIndex, Math.max(0, records.length - 1));
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
  const switchingMapSurface = isMapFile()
    && ((state.mode === "maps" && mode === "data") || (state.mode === "data" && mode === "maps"));
  if (switchingMapSurface) {
    if (mode === "maps") {
      try {
        const records = parseJsonText(getEditorValue());
        if (!Array.isArray(records) || !records.every((record) => record && typeof record === "object" && !Array.isArray(record))) {
          throw new Error("maps.json 顶层必须是地图对象数组。");
        }
        state.records = records;
        state.selectedRecordIndex = Math.min(state.selectedRecordIndex, Math.max(0, records.length - 1));
        initializeMapHistory(records);
        setMode("maps");
      } catch (error) {
        showValidation(false, error instanceof SyntaxError ? formatJsonError(error) : error.message);
      }
    } else {
      setMode("data");
      setViewMode("json");
    }
    return;
  }
  const switchingGrowthSurface = isGrowthFile()
    && ((state.mode === "growth" && mode === "data") || (state.mode === "data" && mode === "growth"));
  if (switchingGrowthSurface) {
    if (mode === "growth") {
      try {
        const records = parseJsonText(getEditorValue());
        if (!Array.isArray(records) || !records.every((record) => record && typeof record === "object" && !Array.isArray(record))) {
          throw new Error("grow-templates.json 顶层必须是成长模板对象数组。");
        }
        state.records = records;
        state.records.forEach(ensureGrowthTemplateShape);
        state.selectedRecordIndex = Math.min(state.selectedRecordIndex, Math.max(0, records.length - 1));
        setMode("growth");
      } catch (error) {
        showValidation(false, error instanceof SyntaxError ? formatJsonError(error) : error.message);
      }
    } else {
      setMode("data");
      setViewMode("json");
    }
    return;
  }
  const switchingSectSurface = isSectFile()
    && ((state.mode === "sects" && mode === "data") || (state.mode === "data" && mode === "sects"));
  if (switchingSectSurface) {
    if (mode === "sects") {
      try {
        const records = parseJsonText(getEditorValue());
        if (!Array.isArray(records) || !records.every((record) => record && typeof record === "object" && !Array.isArray(record))) {
          throw new Error("sects.json 顶层必须是门派对象数组。");
        }
        state.records = records;
        state.records.forEach(ensureSectShape);
        state.selectedRecordIndex = Math.min(state.selectedRecordIndex, Math.max(0, records.length - 1));
        setMode("sects");
      } catch (error) {
        showValidation(false, error instanceof SyntaxError ? formatJsonError(error) : error.message);
      }
    } else {
      setMode("data");
      setViewMode("json");
    }
    return;
  }
  const switchingItemSurface = isItemFile()
    && ((state.mode === "items" && mode === "data") || (state.mode === "data" && mode === "items"));
  if (switchingItemSurface) {
    if (mode === "items") {
      try {
        const records = parseJsonText(getEditorValue());
        if (!Array.isArray(records) || !records.every((record) => record && typeof record === "object" && !Array.isArray(record))) {
          throw new Error("items.json 顶层必须是物品对象数组。");
        }
        state.records = records;
        state.selectedRecordIndex = Math.min(state.selectedRecordIndex, Math.max(0, records.length - 1));
        setMode("items");
      } catch (error) {
        showValidation(false, error instanceof SyntaxError ? formatJsonError(error) : error.message);
      }
    } else {
      setMode("data");
      setViewMode("json");
    }
    return;
  }
  const switchingShopSurface = isShopFile()
    && ((state.mode === "shops" && mode === "data") || (state.mode === "data" && mode === "shops"));
  if (switchingShopSurface) {
    if (mode === "shops") {
      try {
        const records = parseJsonText(getEditorValue());
        if (!Array.isArray(records) || !records.every((record) => record && typeof record === "object" && !Array.isArray(record))) {
          throw new Error("shops.json 顶层必须是商店对象数组。");
        }
        state.records = records;
        state.records.forEach(ensureShopWorkspaceShape);
        state.selectedRecordIndex = Math.min(state.selectedRecordIndex, Math.max(0, records.length - 1));
        state.shopWorkspace.selectedProductIndex = Math.min(state.shopWorkspace.selectedProductIndex, Math.max(0, (records[state.selectedRecordIndex]?.products?.length || 0) - 1));
        setMode("shops");
      } catch (error) {
        showValidation(false, error instanceof SyntaxError ? formatJsonError(error) : error.message);
      }
    } else {
      setMode("data");
      setViewMode("json");
    }
    return;
  }
  const switchingBattleSurface = isBattleFile()
    && ((state.mode === "battles" && mode === "data") || (state.mode === "data" && mode === "battles"));
  if (switchingBattleSurface) {
    if (mode === "battles") {
      try {
        const records = parseJsonText(getEditorValue());
        if (!Array.isArray(records) || !records.every((record) => record && typeof record === "object" && !Array.isArray(record))) {
          throw new Error("battles.json 顶层必须是战斗对象数组。");
        }
        state.records = records;
        state.records.forEach(ensureBattleShape);
        state.selectedRecordIndex = Math.min(state.selectedRecordIndex, Math.max(0, records.length - 1));
        ensureSelectedBattleUnit();
        setMode("battles");
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
  } else if (mode === "achievements") {
    await openAchievementWorkspace();
  } else if (mode === "maps") {
    await openMapWorkspace();
  } else if (mode === "growth") {
    await openGrowthWorkspace();
  } else if (mode === "sects") {
    await openSectWorkspace();
  } else if (mode === "items") {
    await openItemWorkspace();
  } else if (mode === "shops") {
    await openShopWorkspace();
  } else if (mode === "battles") {
    await openBattleWorkspace();
  } else if (mode === "martial") {
    await openMartialWorkspace();
  } else if (mode === "talents") {
    await openTalentWorkspace();
  } else if (mode === "story") {
    await openStoryWorkspace();
  } else if (mode === "data" || mode === "assets") {
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
  if (isCharacterFile()) state.characterWorkspace.biographyDrafts.clear();
  dirtyStateController.markClean({ render: false });
  refreshRecordsFromEditor();
  renderDirtyState();
}

async function openWorkspaceMode(mode) {
  if (mode === "assets") await ensureAssetFilesLoaded();
  setMode(mode);
  if (mode === "data" && !state.dataFiles.some((file) => file.path === state.currentPath)) {
    await openLastDataFile();
    if (!state.dataFiles.some((file) => file.path === state.currentPath) && state.dataFiles.length > 0) {
      await openDataFile(state.dataFiles[0].path);
    }
  }
}

async function openStoryWorkspace() {
  if (!state.storyGraph) await loadStoryGraph();
  const documents = buildStoryDocuments(state.dataFiles, state.storyGraph);
  if (documents.length === 0) {
    setMode("story");
    return;
  }

  const selectedPath = state.storyWorkspace.selectedDocumentPath;
  const selectedSegmentId = state.storyWorkspace.selectedSegmentId;
  const selectedView = state.storyWorkspace.view;
  const currentPath = isStorySourceFile(state.currentPath) || isStoryJsonFile(state.currentPath)
    ? state.currentPath
    : "";
  const document = resolveStoryDocument(documents, selectedPath, currentPath);
  const restoreDocumentContext = document.path === selectedPath;
  const opened = await openDataFile(document.path);
  if (!opened) return;
  state.storyWorkspace.selectedDocumentPath = document.path;
  state.storyWorkspace.selectedSegmentId = restoreDocumentContext ? selectedSegmentId : "";
  state.storyWorkspace.selectedGraphNodeId = restoreDocumentContext ? state.storyWorkspace.selectedGraphNodeId : "";
  state.storyWorkspace.view = restoreDocumentContext && ["dsl", "json", "flow"].includes(selectedView)
    ? selectedView
    : document.sourceKind;
  if (state.storyWorkspace.view !== "flow") setViewMode(state.storyWorkspace.view);
  setMode("story");
  if (restoreDocumentContext && state.storyWorkspace.view !== "flow" && state.storyWorkspace.selectedSegmentId) {
    selectStorySegment(state.storyWorkspace.selectedSegmentId);
  }
}

function rerenderSearchResults(input, render, findReplacement, scrollKey = "") {
  resetScrollMemory(state.workspaceScrollPositions, scrollKey);
  return rerenderPreservingInput(input, render, findReplacement);
}

function renderResourceWorkspaceView() {
  if (state.mode !== "assets") return;
  const catalog = buildResourceCatalog(state.contentIndex.resourceRecords, state.assetFilePathSet, state.contentIndex.referencesByValue);
  const resourceIdsByAssetPath = new Map();
  for (const item of catalog) {
    if (!item.assetExists || !item.id) continue;
    const ids = resourceIdsByAssetPath.get(item.assetPath) || [];
    ids.push(item.id);
    resourceIdsByAssetPath.set(item.assetPath, ids);
  }
  const assets = state.assetFiles
    .filter((file) => !file.path.endsWith(".import") && !file.path.split("/").some((segment) => segment.startsWith(".")))
    .map((file) => ({
      ...file,
      resourceIds: resourceIdsByAssetPath.get(file.path) || [],
    }))
    .sort((left, right) => {
      const rank = (file) => isImageAsset(file.path) ? 0 : isAudioAsset(file.path) ? 1 : 2;
      return rank(left) - rank(right) || left.path.localeCompare(right.path, "zh-CN");
    });
  renderResourcesWorkspace(elements.resourceWorkspaceView, {
    state,
    catalog,
    assets,
    onChange: (key, value) => {
      state.resourceWorkspace[key] = value;
      if (key === "tab") {
        state.resourceWorkspace.selectedKey = "";
        state.resourceWorkspace.search = "";
      }
      renderResourceWorkspaceView();
    },
    onOpenDefinition: (id) => revealDefinitionById(id, ["resources"]),
  });
}

async function openAchievementWorkspace() {
  const requiredPaths = ["resources.json", "world-triggers.json"];
  const missingPath = requiredPaths.find((path) => !state.dataFiles.some((file) => file.path === path));
  if (missingPath) {
    showValidation(false, `当前 MOD 缺少 ${missingPath}。`);
    return;
  }
  try {
    const [resourcesFile, triggersFile] = await Promise.all(requiredPaths.map((path) => (
      requestJson(`/api/data/file?path=${encodeURIComponent(path)}`)
    )));
    const resources = parseJsonText(resourcesFile.content);
    const worldTriggers = parseJsonText(triggersFile.content);
    if (!Array.isArray(resources) || !Array.isArray(worldTriggers)) throw new Error("成就资源与世界触发器文件必须是数组。");
    const workspace = state.achievementWorkspace;
    workspace.resources = resources;
    workspace.worldTriggers = worldTriggers;
    workspace.sourcesById = state.contentIndex.achievementSourcesById || new Map();
    workspace.triggerTargetOptions = {
      story: getMapEventTargetOptions("story"),
      shop: getMapEventTargetOptions("shop"),
      battle: getMapEventTargetOptions("battle"),
      xiangzi: [],
    };
    const achievements = resources.filter(isAchievementResource);
    if (!achievements.some((entry) => entry.id === workspace.selectedAchievementId)) {
      workspace.selectedAchievementId = achievements[0]?.id || "";
    }
    workspace.selectedTriggerIndex = Math.min(workspace.selectedTriggerIndex, Math.max(0, worldTriggers.length - 1));
    workspace.search = "";
    state.currentPath = "resources.json";
    state.records = [];
    state.recordsPath = "";
    dirtyStateController.markClean({ render: false });
    setMode("achievements");
  } catch (error) {
    showValidation(false, error instanceof Error ? error.message : String(error));
  }
}

function getAchievementWorkspaceRecords() {
  return state.achievementWorkspace.resources.filter(isAchievementResource);
}

function findLastAchievementResourceIndex(resources) {
  for (let index = resources.length - 1; index >= 0; index -= 1) {
    if (isAchievementResource(resources[index])) return index;
  }
  return -1;
}

function renderAchievementWorkspaceView() {
  if (state.mode !== "achievements") return;
  const workspace = state.achievementWorkspace;
  const markDirty = (path, detail, rerender) => {
    dirtyStateController.markDirty({ render: false, path, detail });
    renderDirtyState();
    if (rerender) renderAchievementWorkspaceView();
  };
  renderAchievementWorkspace(elements.achievementWorkspaceView, {
    state,
    achievements: getAchievementWorkspaceRecords(),
    worldTriggers: workspace.worldTriggers,
    sourcesById: workspace.sourcesById,
    triggerTargetOptions: workspace.triggerTargetOptions,
    onTab: (tab) => {
      workspace.tab = tab;
      workspace.search = "";
      renderAchievementWorkspaceView();
    },
    onSearch: (value) => { workspace.search = value; renderAchievementWorkspaceView(); },
    onSelectAchievement: (id) => { workspace.selectedAchievementId = id; renderAchievementWorkspaceView(); },
    onCreateAchievement: (requestedTitle) => {
      const existingTitles = new Set(getAchievementWorkspaceRecords().map(getAchievementTitle));
      const base = String(requestedTitle || "新成就").trim() || "新成就";
      let title = base;
      for (let index = 2; existingTitles.has(title); index += 1) title = `${base}_${index}`;
      const resource = createAchievementResource(title);
      const lastAchievementIndex = findLastAchievementResourceIndex(workspace.resources);
      workspace.resources.splice(lastAchievementIndex + 1, 0, resource);
      workspace.selectedAchievementId = resource.id;
      markDirty("resources.json", `新建成就：${title}`, true);
    },
    onCreateFromReference: (title) => {
      const resource = createAchievementResource(title);
      const lastAchievementIndex = findLastAchievementResourceIndex(workspace.resources);
      workspace.resources.splice(lastAchievementIndex + 1, 0, resource);
      workspace.selectedAchievementId = resource.id;
      markDirty("resources.json", `补建成就：${title}`, true);
    },
    onMutateAchievement: (resource, key, value, rerender) => {
      const oldId = resource.id;
      resource[key] = value;
      if (key === "id" && workspace.selectedAchievementId === oldId) workspace.selectedAchievementId = value;
      markDirty("resources.json", `成就：${getAchievementTitle(resource) || "未命名"}`, rerender);
    },
    onDeleteAchievement: (resource) => {
      const title = getAchievementTitle(resource);
      const sourceCount = workspace.sourcesById.get(title)?.length || 0;
      if (!confirmAction(`确认删除成就“${title}”？${sourceCount ? `\n\n仍有 ${sourceCount} 处剧情或爬塔解锁引用。` : ""}`)) return;
      const index = workspace.resources.indexOf(resource);
      if (index >= 0) workspace.resources.splice(index, 1);
      workspace.selectedAchievementId = getAchievementWorkspaceRecords()[0]?.id || "";
      markDirty("resources.json", `删除成就：${title}`, true);
    },
    onOpenSource: openAchievementUnlockSource,
    onSelectTrigger: (index) => { workspace.selectedTriggerIndex = index; renderAchievementWorkspaceView(); },
    onCreateTrigger: () => {
      const existing = new Set(workspace.worldTriggers.map((trigger) => trigger?.id));
      let id = "新世界触发器";
      for (let index = 2; existing.has(id); index += 1) id = `新世界触发器_${index}`;
      workspace.worldTriggers.push(createWorldTriggerDefinition(id));
      workspace.selectedTriggerIndex = workspace.worldTriggers.length - 1;
      markDirty("world-triggers.json", `新建世界触发器：${id}`, true);
    },
    onMutateTrigger: (rerender) => {
      const trigger = workspace.worldTriggers[workspace.selectedTriggerIndex];
      markDirty("world-triggers.json", `世界触发器：${trigger?.id || "未命名"}`, rerender);
    },
    onMoveTrigger: (direction) => {
      const index = workspace.selectedTriggerIndex;
      const moved = moveWorldTrigger(workspace.worldTriggers, index, direction);
      if (moved === workspace.worldTriggers) return;
      workspace.worldTriggers = moved;
      workspace.selectedTriggerIndex = index + direction;
      const trigger = workspace.worldTriggers[workspace.selectedTriggerIndex];
      markDirty("world-triggers.json", `调整世界触发器优先级：${trigger?.id || "未命名"}`, true);
    },
    onDeleteTrigger: (trigger) => {
      if (!confirmAction(`确认删除世界触发器“${trigger.id || "未命名"}”？`)) return;
      const index = workspace.worldTriggers.indexOf(trigger);
      if (index >= 0) workspace.worldTriggers.splice(index, 1);
      workspace.selectedTriggerIndex = Math.min(workspace.selectedTriggerIndex, Math.max(0, workspace.worldTriggers.length - 1));
      markDirty("world-triggers.json", `删除世界触发器：${trigger.id || "未命名"}`, true);
    },
    onReplaceTrigger: (value) => {
      workspace.worldTriggers[workspace.selectedTriggerIndex] = value;
      markDirty("world-triggers.json", `世界触发器 JSON：${value.id || "未命名"}`, true);
    },
  });
}

async function openAchievementUnlockSource(source) {
  if (source.kind === "story" && source.segmentId) {
    await revealDefinitionById(source.segmentId, ["story"]);
  } else if (source.kind === "tower" && source.ownerId) {
    await revealDefinitionById(source.ownerId, ["towers"]);
  }
}

function revealAssetInResourceWorkspace(assetPath) {
  state.resourceWorkspace.tab = "assets";
  state.resourceWorkspace.search = "";
  state.resourceWorkspace.selectedKey = assetPath;
  setMode("assets");
}


async function openCharacterWorkspace() {
  if (state.mode === "characters" && isCharacterFile() && state.records.length > 0) {
    renderCharacterWorkspaceView();
    return;
  }
  if (!state.dataFiles.some((file) => file.path === "characters.json")) {
    showValidation(false, "当前 MOD 缺少 characters.json。");
    return;
  }
  await openDataFile("characters.json", { initializeEditor: false });
  if (!isCharacterFile()) {
    return;
  }
  setMode("characters");
}

function renderCharacterWorkspaceView(renderOptions = {}) {
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
    getBiography: (record) => resolveCharacterBiography(
      record,
      state.contentIndex.resourcesById,
      state.characterWorkspace.biographyDrafts,
    ),
    onSelect: (index) => {
      state.selectedRecordIndex = index;
      state.characterWorkspace.referencesOpen = false;
      renderCharacterWorkspaceView({ list: false });
    },
    onSearch: (value) => {
      const input = elements.characterWorkspaceView.querySelector(".character-list-search");
      state.characterWorkspace.search = value;
      rerenderSearchResults(input, renderCharacterWorkspaceView,
        () => elements.characterWorkspaceView.querySelector(".character-list-search"), "characters:list");
    },
    onFilter: (value) => {
      state.characterWorkspace.filter = value;
      renderCharacterWorkspaceView();
    },
    onTab: (value) => {
      state.characterWorkspace.tab = value;
      renderCharacterWorkspaceView({ list: false });
    },
    onMutate: (record, key, value) => {
      record[key] = value;
      syncRecordsToEditor();
      renderCharacterWorkspaceView();
    },
    onReplaceRecord: (record) => {
      state.records[state.selectedRecordIndex] = record;
      syncRecordsToEditor();
      renderCharacterWorkspaceView();
    },
    onBiographyChange: (id, value) => {
      state.characterWorkspace.biographyDrafts.set(id, value);
      dirtyStateController.markDirty({
        render: false,
        path: "resources.json",
        detail: `角色列传：${state.records[state.selectedRecordIndex]?.name || state.records[state.selectedRecordIndex]?.id || id}`,
      });
      elements.saveState.textContent = "角色列传已修改，尚未保存";
      renderDirtyState();
    },
    onPickPortrait: () => openPortraitPicker(getCurrentCharacterPortraitAssetPath()),
    onCreate: createCharacterRecord,
    onCreateSpeaker: openSpeakerToolDialog,
    onDuplicate: duplicateCharacterRecord,
    onDelete: deleteCharacterRecord,
    onOpenReferences: () => {
      state.characterWorkspace.referencesOpen = true;
      renderCharacterWorkspaceView({ list: false });
    },
    onCloseReferences: () => {
      state.characterWorkspace.referencesOpen = false;
      renderCharacterWorkspaceView({ list: false });
    },
    onOpenAdvancedData: async () => {
      await initializeMonacoEditor();
      setMode("data");
      state.viewMode = "json";
      setViewMode("json");
      const record = state.records[state.selectedRecordIndex];
      if (record?.id) {
        const definition = (state.contentIndex.definitionsById.get(record.id) || [])
          .find((candidate) => candidate.path === "characters.json");
        if (definition?.line) selectLine(definition.line);
      }
    },
    onOpenProblems: () => requestWorkspaceChange("problems"),
  }, renderOptions);
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
  state.records.push(record);
  state.selectedRecordIndex = state.records.length - 1;
  state.characterWorkspace.filter = "all";
  state.characterWorkspace.search = "";
  state.characterWorkspace.tab = "overview";
  syncRecordsToEditor();
  renderCharacterWorkspaceView();
}

function duplicateCharacterRecord() {
  const current = state.records[state.selectedRecordIndex];
  if (!current) return;
  const copy = structuredCloneCompat(current);
  copy.id = createUniqueId(`${String(current.id || "新角色")}_copy`);
  copy.name = `${String(current.name || current.id || "新角色")} 副本`;
  state.records.splice(state.selectedRecordIndex + 1, 0, copy);
  state.selectedRecordIndex += 1;
  syncRecordsToEditor();
  renderCharacterWorkspaceView();
}

function deleteCharacterRecord() {
  const current = state.records[state.selectedRecordIndex];
  if (!current) return;
  const references = getCharacterReferences(current);
  const referenceSummary = references.length > 0
    ? `静态扫描找到 ${references.length} 处引用。\n\n${references.slice(0, 5).map((item) => `${item.path} · ${item.fieldPath}`).join("\n")}\n\n`
    : "静态扫描未找到引用，但无法覆盖动态脚本或运行时引用。\n\n";
  if (!confirmAction(`${referenceSummary}确认删除角色「${current.name || current.id}」？此操作会留在未保存状态。`)) {
    return;
  }
  state.records.splice(state.selectedRecordIndex, 1);
  state.selectedRecordIndex = Math.max(0, Math.min(state.selectedRecordIndex, state.records.length - 1));
  state.characterWorkspace.referencesOpen = false;
  syncRecordsToEditor();
  renderCharacterWorkspaceView();
}

async function openItemWorkspace() {
  if (state.mode === "items" && isItemFile() && state.records.length > 0) {
    renderItemWorkspaceView();
    return;
  }
  if (!state.dataFiles.some((file) => file.path === "items.json")) {
    showValidation(false, "当前 MOD 缺少 items.json。");
    return;
  }
  await openDataFile("items.json", { initializeEditor: false });
  if (!isItemFile()) return;
  setMode("items");
}

async function openTalentWorkspace() {
  if (state.mode === "talents" && state.currentPath === "talents.json" && state.records.length > 0) {
    renderTalentWorkspaceView();
    return;
  }
  if (!state.dataFiles.some((file) => file.path === "talents.json")) {
    showValidation(false, "当前 MOD 缺少 talents.json。");
    return;
  }
  await openDataFile("talents.json", { initializeEditor: false });
  if (state.currentPath !== "talents.json") return;
  state.records.forEach(ensureTalentShape);
  setMode("talents");
}

function createTalentOptions() {
  const definitionsOfType = (...types) => {
    const values = [];
    for (const definitions of state.contentIndex.definitionsById.values()) {
      for (const definition of definitions) {
        if (!types.includes(definition.type)) continue;
        values.push([definition.id, definition.displayName || definition.record?.name || definition.id]);
      }
    }
    return Array.from(new Map(values.map((entry) => [entry[0], entry])).values())
      .sort((left, right) => left[1].localeCompare(right[1], "zh-Hans-CN"));
  };
  return {
    talents: state.records.map((record) => [record.id, record.name || record.id]).filter(([id]) => id),
    buffs: definitionsOfType("buffs"),
    scopedEffects: definitionsOfType("scoped-battle-effects"),
    skills: definitionsOfType("external-skills", "internal-skills", "special-skills", "form-skills"),
    legends: definitionsOfType("legend-skills"),
  };
}

function getTalentIssueContext() {
  const idCounts = new Map();
  for (const record of state.records) {
    if (!record?.id) continue;
    idCounts.set(record.id, (idCounts.get(record.id) || 0) + 1);
  }
  const options = createTalentOptions();
  return {
    idCounts,
    talentIds: new Set(options.talents.map(([id]) => id)),
    buffIds: new Set(options.buffs.map(([id]) => id)),
    scopedEffectIds: new Set(options.scopedEffects.map(([id]) => id)),
  };
}

function renderTalentWorkspaceView() {
  if (state.mode !== "talents") return;
  state.selectedRecordIndex = Math.max(0, Math.min(state.selectedRecordIndex, Math.max(0, state.records.length - 1)));
  const issueContext = getTalentIssueContext();
  renderTalentWorkspace(elements.talentWorkspaceView, {
    state,
    options: createTalentOptions(),
    issueContext,
    getIssues: (record) => getTalentIssues(record, issueContext),
    onSelect: (index) => { state.selectedRecordIndex = index; state.talentWorkspace.tab = "overview"; renderTalentWorkspaceView(); },
    onSearch: (value) => {
      const node = elements.talentWorkspaceView.querySelector(".talent-list-search");
      state.talentWorkspace.search = value;
      rerenderSearchResults(node, renderTalentWorkspaceView,
        () => elements.talentWorkspaceView.querySelector(".talent-list-search"), "talents:list");
    },
    onFilter: (value) => { state.talentWorkspace.filter = value; renderTalentWorkspaceView(); },
    onTab: (value) => { state.talentWorkspace.tab = value; renderTalentWorkspaceView(); },
    onMutate: () => { syncRecordsToEditor(); renderTalentWorkspaceView(); },
    onReplace: (next) => {
      if (!next || typeof next !== "object" || Array.isArray(next)) {
        showValidation(false, "天赋定义必须是 JSON 对象。");
        return;
      }
      state.records[state.selectedRecordIndex] = ensureTalentShape(next);
      syncRecordsToEditor();
      renderTalentWorkspaceView();
    },
    onJsonError: (error) => showValidation(false, error.message),
    onCreate: createTalentRecord,
    onDuplicate: duplicateTalentRecord,
    onDelete: deleteTalentRecord,
  });
  renderProblemIndicators();
}

function createTalentRecord() {
  const id = createUniqueId("新天赋");
  state.records.push(createTalentDefinition(id));
  state.selectedRecordIndex = state.records.length - 1;
  state.talentWorkspace.search = "";
  state.talentWorkspace.filter = "all";
  state.talentWorkspace.tab = "overview";
  syncRecordsToEditor();
  renderTalentWorkspaceView();
}

function duplicateTalentRecord() {
  const current = state.records[state.selectedRecordIndex];
  if (!current) return;
  const copy = cloneTalent(current);
  copy.id = createUniqueId(`${String(current.id || "新天赋")}_copy`);
  copy.name = `${String(current.name || current.id || "新天赋")} 副本`;
  state.records.splice(state.selectedRecordIndex + 1, 0, copy);
  state.selectedRecordIndex += 1;
  syncRecordsToEditor();
  renderTalentWorkspaceView();
}

function deleteTalentRecord() {
  const current = state.records[state.selectedRecordIndex];
  if (!current || !confirmAction(`确认删除天赋「${current.name || current.id}」？\n\n替换关系、角色、物品和战斗效果中的引用不会自动修改。`)) return;
  state.records.splice(state.selectedRecordIndex, 1);
  state.selectedRecordIndex = Math.max(0, Math.min(state.selectedRecordIndex, state.records.length - 1));
  syncRecordsToEditor();
  renderTalentWorkspaceView();
}

function renderItemWorkspaceView(renderOptions = {}) {
  if (state.mode !== "items") return;
  renderItemWorkspace(elements.itemWorkspaceView, {
    state,
    getIssues: getItemValidationIssues,
    getPictureInfo: getItemPictureInfo,
    getReferences: getItemReferences,
    references: getItemReferenceOptions(),
    onSelect: (index) => {
      state.selectedRecordIndex = index;
      renderItemWorkspaceView({ list: false });
    },
    onSearch: (value) => {
      const input = elements.itemWorkspaceView.querySelector(".item-list-search");
      state.itemWorkspace.search = value;
      rerenderSearchResults(input, renderItemWorkspaceView,
        () => elements.itemWorkspaceView.querySelector(".item-list-search"), "items:list");
    },
    onFilter: (value) => {
      state.itemWorkspace.filter = value;
      renderItemWorkspaceView();
    },
    onTab: (value) => {
      state.itemWorkspace.tab = value;
      renderItemWorkspaceView({ list: false });
    },
    onMutate: (record, key, value) => {
      record[key] = value;
      syncRecordsToEditor();
      renderItemWorkspaceView();
    },
    onReplaceRecord: (record) => {
      state.records[state.selectedRecordIndex] = record;
      syncRecordsToEditor();
      renderItemWorkspaceView();
    },
    onCreate: createItemRecord,
    onDuplicate: duplicateItemRecord,
    onDelete: deleteItemRecord,
    onPickPicture: () => openItemPicturePicker(getCurrentItemPictureAssetPath()),
    onUploadPicture: uploadCurrentItemPicture,
    onOpenAdvancedData: async () => {
      await initializeMonacoEditor();
      setMode("data");
      state.viewMode = "json";
      setViewMode("json");
      const record = state.records[state.selectedRecordIndex];
      if (record?.id) {
        const definition = (state.contentIndex.definitionsById.get(record.id) || [])
          .find((candidate) => candidate.path === "items.json");
        if (definition?.line) selectLine(definition.line);
      }
    },
    onOpenProblems: () => requestWorkspaceChange("problems"),
  }, renderOptions);
  renderItemPicturePicker();
}

function createItemRecord() {
  const id = createUniqueId("新物品");
  state.records.push(createItemDefinition("consumable", id));
  state.selectedRecordIndex = state.records.length - 1;
  state.itemWorkspace.search = "";
  state.itemWorkspace.filter = "all";
  state.itemWorkspace.tab = "overview";
  syncRecordsToEditor();
  renderItemWorkspaceView();
}

function duplicateItemRecord() {
  const current = state.records[state.selectedRecordIndex];
  if (!current) return;
  const copy = structuredCloneCompat(current);
  copy.id = createUniqueId(`${String(current.id || "新物品")}_copy`);
  copy.name = `${String(current.name || current.id || "新物品")} 副本`;
  state.records.splice(state.selectedRecordIndex + 1, 0, copy);
  state.selectedRecordIndex += 1;
  syncRecordsToEditor();
  renderItemWorkspaceView();
}

function deleteItemRecord() {
  const current = state.records[state.selectedRecordIndex];
  if (!current) return;
  const references = getItemReferences(current);
  const summary = references.length
    ? `静态扫描找到 ${references.length} 处引用。\n\n${references.slice(0, 5).map((item) => `${item.path} · ${item.fieldPath}`).join("\n")}\n\n`
    : "静态扫描未找到引用，但无法覆盖动态脚本或运行时引用。\n\n";
  if (!confirmAction(`${summary}确认删除物品「${current.name || current.id}」？此操作会留在未保存状态。`)) return;
  state.records.splice(state.selectedRecordIndex, 1);
  state.selectedRecordIndex = Math.max(0, Math.min(state.selectedRecordIndex, state.records.length - 1));
  syncRecordsToEditor();
  renderItemWorkspaceView();
}

function getItemReferences(record) {
  const values = new Set([record?.id, record?.name]
    .filter((value) => typeof value === "string" && value.trim())
    .map((value) => value.trim()));
  const references = [];
  for (const value of values) {
    for (const reference of state.contentIndex.referencesByValue?.get(value) || []) {
      if (reference.path === "items.json" && reference.ownerDefinitionId === record.id) continue;
      references.push({ ...reference, value });
    }
  }
  return Array.from(new Map(references.map((item) => [`${item.path}:${item.fieldPath}:${item.value}`, item])).values())
    .sort((left, right) => left.path.localeCompare(right.path, "zh-Hans-CN") || left.fieldPath.localeCompare(right.fieldPath));
}

function getItemReferenceOptions() {
  const definitionsOfType = (type, projector = createReferenceOption) => {
    const options = [];
    for (const definitions of state.contentIndex.definitionsById.values()) {
      for (const definition of definitions) {
        if (definition.type === type) options.push(projector(definition));
      }
    }
    return Array.from(new Map(options.map((option) => [option.id, option])).values())
      .sort((left, right) => left.name.localeCompare(right.name, "zh-Hans-CN") || left.id.localeCompare(right.id, "zh-Hans-CN"));
  };
  const externalSkills = definitionsOfType("external-skills", createExternalSkillReferenceOption);
  const internalSkills = definitionsOfType("internal-skills", createInternalSkillReferenceOption);
  const specialSkills = definitionsOfType("special-skills", createSpecialSkillReferenceOption);
  return {
    talents: definitionsOfType("talents", createTalentReferenceOption),
    buffs: definitionsOfType("buffs"),
    itemTags: definitionsOfType("item-tags"),
    externalSkills,
    internalSkills,
    specialSkills,
    allSkills: [...externalSkills, ...internalSkills, ...specialSkills],
  };
}

async function uploadCurrentItemPicture(file) {
  const record = getCurrentItemRecord();
  if (!record) return;
  try {
    const result = await uploadItemImageAndBind(record, file, getBindableItemPictureId(record));
    if (!result) return;
    await loadAssetFiles();
    await loadDataFiles();
    await rebuildContentIndex();
    record.picture = result.pictureId;
    syncRecordsToEditor();
    showValidation(result.validation.ok, `已上传并绑定：${result.pictureId} -> ${result.assetPath}`);
    renderItemWorkspaceView();
  } catch (error) {
    showValidation(false, error instanceof Error ? error.message : String(error));
  }
}

async function openGrowthWorkspace() {
  if (state.mode === "growth" && isGrowthFile() && state.records.length > 0) {
    renderGrowthWorkspaceView();
    return;
  }
  if (!state.dataFiles.some((file) => file.path === "grow-templates.json")) {
    showValidation(false, "当前 MOD 缺少 grow-templates.json。");
    return;
  }
  await openDataFile("grow-templates.json", { initializeEditor: false });
  if (!isGrowthFile()) return;
  state.records.forEach(ensureGrowthTemplateShape);
  setMode("growth");
}

function getGrowthCharacterRecords() {
  const records = [];
  for (const definitions of state.contentIndex.definitionsById.values()) {
    for (const definition of definitions) {
      if (definition.type === "characters" && definition.record) records.push(definition.record);
    }
  }
  return records;
}

function getGrowthTemplateUsage(templateId) {
  return getGrowthCharacterRecords()
    .filter((record) => record.growTemplate === templateId || (templateId === "default" && !String(record.growTemplate || "").trim()))
    .map((record) => ({ ...record, implicit: templateId === "default" && !String(record.growTemplate || "").trim() }))
    .sort((left, right) => String(left.name || left.id).localeCompare(String(right.name || right.id), "zh-Hans-CN"));
}

function renderGrowthWorkspaceView() {
  if (state.mode !== "growth") return;
  state.records.forEach(ensureGrowthTemplateShape);
  const idCounts = new Map();
  for (const record of state.records) {
    const id = String(record.id || "").trim();
    if (id) idCounts.set(id, (idCounts.get(id) || 0) + 1);
  }
  renderGrowthTemplateWorkspace(elements.growthWorkspaceView, {
    state,
    records: state.records,
    idCounts,
    getUsage: getGrowthTemplateUsage,
    onSelect: (index) => {
      state.selectedRecordIndex = index;
      state.growthWorkspace.tab = "overview";
      renderGrowthWorkspaceView();
    },
    onSearch: (value) => {
      const input = elements.growthWorkspaceView.querySelector('.growth-catalog-tools input[type="search"]');
      state.growthWorkspace.search = value;
      rerenderSearchResults(input, renderGrowthWorkspaceView,
        () => elements.growthWorkspaceView.querySelector('.growth-catalog-tools input[type="search"]'), "growth:list");
    },
    onFilter: (value) => { state.growthWorkspace.filter = value; renderGrowthWorkspaceView(); },
    onTab: (value) => { state.growthWorkspace.tab = value; renderGrowthWorkspaceView(); },
    onPatch: (key, value) => {
      const record = state.records[state.selectedRecordIndex];
      if (!record) return;
      record[key] = value;
      syncRecordsToEditor();
      renderGrowthWorkspaceView();
    },
    onPatchGrowth: (key, value) => {
      const record = state.records[state.selectedRecordIndex];
      if (!record) return;
      ensureGrowthTemplateShape(record).statGrowth[key] = value;
      syncRecordsToEditor();
      renderGrowthWorkspaceView();
    },
    onReplace: (next) => {
      state.records[state.selectedRecordIndex] = ensureGrowthTemplateShape(next);
      syncRecordsToEditor();
      renderGrowthWorkspaceView();
    },
    onDuplicate: duplicateGrowthTemplateRecord,
    onDelete: deleteGrowthTemplateRecord,
    onOpenCreator: () => { state.growthWorkspace.creatorOpen = true; state.growthWorkspace.creatorTemplate = "balanced"; renderGrowthWorkspaceView(); },
    onCloseCreator: () => { state.growthWorkspace.creatorOpen = false; renderGrowthWorkspaceView(); },
    onSelectCreatorTemplate: (value) => { state.growthWorkspace.creatorTemplate = value; renderGrowthWorkspaceView(); },
    onCreate: createGrowthTemplateRecord,
  });
  renderProblemIndicators();
}

function createGrowthTemplateRecord() {
  const id = createUniqueId("新成长模板");
  state.records.push(createGrowthTemplate(id, state.growthWorkspace.creatorTemplate));
  state.selectedRecordIndex = state.records.length - 1;
  state.growthWorkspace.creatorOpen = false;
  state.growthWorkspace.search = "";
  state.growthWorkspace.filter = "all";
  state.growthWorkspace.tab = "overview";
  syncRecordsToEditor();
  renderGrowthWorkspaceView();
}

function duplicateGrowthTemplateRecord() {
  const current = state.records[state.selectedRecordIndex];
  if (!current) return;
  const copy = structuredCloneCompat(current);
  copy.id = createUniqueId(`${String(current.id || "成长模板")}_copy`);
  copy.name = `${String(current.name || current.id || "成长模板")} 副本`;
  state.records.splice(state.selectedRecordIndex + 1, 0, copy);
  state.selectedRecordIndex += 1;
  syncRecordsToEditor();
  renderGrowthWorkspaceView();
}

function deleteGrowthTemplateRecord() {
  const current = state.records[state.selectedRecordIndex];
  if (!current) return;
  const usage = getGrowthTemplateUsage(current.id);
  const defaultWarning = current.id === "default" ? "\n\n这是运行时回退模板，删除后未指定模板的角色升级会失败。" : "";
  const usageWarning = usage.length ? `\n\n当前静态扫描发现 ${usage.length} 名角色使用：${usage.slice(0, 6).map((item) => item.name || item.id).join("、")}${usage.length > 6 ? "等" : ""}。` : "";
  if (!confirmAction(`确认删除成长模板「${current.name || current.id}」？${defaultWarning}${usageWarning}\n\n此操作会留在未保存状态。`)) return;
  state.records.splice(state.selectedRecordIndex, 1);
  state.selectedRecordIndex = Math.max(0, Math.min(state.selectedRecordIndex, state.records.length - 1));
  syncRecordsToEditor();
  renderGrowthWorkspaceView();
}

async function openSectWorkspace() {
  if (state.mode === "sects" && isSectFile() && state.records.length > 0) {
    renderSectWorkspaceView();
    return;
  }
  if (!state.dataFiles.some((file) => file.path === "sects.json")) {
    showValidation(false, "当前 MOD 缺少 sects.json。");
    return;
  }
  await openDataFile("sects.json", { initializeEditor: false });
  if (!isSectFile()) return;
  state.records.forEach(ensureSectShape);
  setMode("sects");
}

function getSectWorkspaceReferences() {
  const stories = [];
  const skills = [];
  const characters = [];
  const skillTypes = new Map([
    ["external-skills", "外功"], ["internal-skills", "内功"], ["special-skills", "绝技"],
    ["legend-skills", "奥义"], ["talents", "天赋"],
  ]);
  for (const definitions of state.contentIndex.definitionsById.values()) {
    for (const definition of definitions) {
      if (definition.type === "story") stories.push({ id: definition.id, name: definition.displayName || definition.id, typeLabel: "剧情", subtitle: definition.path });
      if (definition.type === "characters") {
        const name = String(definition.record?.name || definition.id);
        characters.push({ id: name, name, typeLabel: "角色", subtitle: definition.id === name ? "" : definition.id, description: definition.record?.description || "" });
      }
      if (skillTypes.has(definition.type)) {
        const record = definition.record || {};
        skills.push({ id: record.name || definition.id, name: record.name || definition.id, typeLabel: skillTypes.get(definition.type), subtitle: definition.id === record.name ? "" : definition.id, description: record.description || "" });
        for (const form of Array.isArray(record.formSkills) ? record.formSkills : []) {
          if (form?.id) skills.push({ id: form.name || form.id, name: form.name || form.id, typeLabel: "招式", subtitle: `${record.name || definition.id} · ${form.id}`, description: form.description || "" });
        }
      }
    }
  }
  const resourceOptions = (groups) => state.contentIndex.resourceRecords
    .filter((resource) => groups.has(String(resource.group || "")))
    .map((resource) => ({ id: resource.id, name: resource.id, typeLabel: resource.group || "资源", subtitle: resource.value || "", iconPath: resolveResourceAssetPath(resource) }))
    .sort((left, right) => left.name.localeCompare(right.name, "zh-Hans-CN"));
  return {
    stories: stories.sort((a, b) => a.name.localeCompare(b.name, "zh-Hans-CN")),
    skills: skills.sort((a, b) => a.name.localeCompare(b.name, "zh-Hans-CN")),
    characters: characters.sort((a, b) => a.name.localeCompare(b.name, "zh-Hans-CN")),
    portraits: resourceOptions(new Set(["头像"])),
    backgrounds: resourceOptions(new Set(["地图", "背景", "场景"])),
  };
}

function renderSectWorkspaceView() {
  if (state.mode !== "sects") return;
  state.records.forEach(ensureSectShape);
  const references = getSectWorkspaceReferences();
  const idCounts = new Map();
  state.records.forEach((record) => { const id = String(record.id || "").trim(); if (id) idCounts.set(id, (idCounts.get(id) || 0) + 1); });
  const issueContext = {
    idCounts,
    storyIds: new Set(references.stories.map((item) => item.id)),
    resourceIds: new Set(state.contentIndex.resourceRecords.map((item) => item.id)),
    skillNames: new Set(references.skills.flatMap((item) => [item.id, item.name, item.subtitle].filter(Boolean))),
    characterNames: new Set(references.characters.flatMap((item) => [item.id, item.name, item.subtitle].filter(Boolean))),
  };
  renderSectWorkspace(elements.sectWorkspaceView, {
    state, records: state.records, references,
    getIssues: (record) => getSectIssues(record, issueContext),
    resolveResource: (id) => {
      const resource = state.contentIndex.resourcesById.get(String(id || ""));
      return { id: String(id || ""), assetPath: resource ? resolveResourceAssetPath(resource) : "" };
    },
    onSelect: (index) => { state.selectedRecordIndex = index; state.sectWorkspace.tab = "overview"; renderSectWorkspaceView(); },
    onSearch: (value) => {
      const input = elements.sectWorkspaceView.querySelector('input[type="search"]');
      state.sectWorkspace.search = value;
      rerenderSearchResults(input, renderSectWorkspaceView,
        () => elements.sectWorkspaceView.querySelector('input[type="search"]'), "sects:list");
    },
    onTab: (value) => { state.sectWorkspace.tab = value; renderSectWorkspaceView(); },
    onPatch: (key, value) => { const record = state.records[state.selectedRecordIndex]; if (!record) return; record[key] = value; syncRecordsToEditor(); renderSectWorkspaceView(); },
    onReplace: (next) => { state.records[state.selectedRecordIndex] = ensureSectShape(next); syncRecordsToEditor(); renderSectWorkspaceView(); },
    onCreate: createSectRecord,
    onDuplicate: duplicateSectRecord,
    onDelete: deleteSectRecord,
  });
  renderProblemIndicators();
}

function createSectRecord() {
  const id = createUniqueId("新门派");
  state.records.push(createSectDefinition(id));
  state.selectedRecordIndex = state.records.length - 1;
  state.sectWorkspace.search = "";
  state.sectWorkspace.tab = "overview";
  syncRecordsToEditor();
  renderSectWorkspaceView();
  showValidation(true, "已创建最小门派模板。Web 编辑器可配置文本与已有资源引用；新图片和 PCK 资源仍需在 Godot 资源流程中制作。 ");
}

function duplicateSectRecord() {
  const current = state.records[state.selectedRecordIndex];
  if (!current) return;
  const copy = cloneSectJson(current);
  copy.id = createUniqueId(`${String(current.id || "门派")}_copy`);
  copy.name = `${String(current.name || current.id || "门派")} 副本`;
  state.records.splice(state.selectedRecordIndex + 1, 0, copy);
  state.selectedRecordIndex += 1;
  syncRecordsToEditor(); renderSectWorkspaceView();
}

function deleteSectRecord() {
  const current = state.records[state.selectedRecordIndex];
  if (!current || !confirmAction(`确认删除门派「${current.name || current.id}」？\n\n剧情或其他高级数据中的字符串引用不会自动修改。此操作会留在未保存状态。`)) return;
  state.records.splice(state.selectedRecordIndex, 1);
  state.selectedRecordIndex = Math.max(0, Math.min(state.selectedRecordIndex, state.records.length - 1));
  syncRecordsToEditor(); renderSectWorkspaceView();
}

async function openShopWorkspace() {
  if (state.mode === "shops" && isShopFile() && state.records.length > 0) {
    renderShopWorkspaceView();
    return;
  }
  if (!state.dataFiles.some((file) => file.path === "shops.json")) {
    showValidation(false, "当前 MOD 缺少 shops.json。");
    return;
  }
  await openDataFile("shops.json", { initializeEditor: false });
  if (!isShopFile()) return;
  state.records.forEach(ensureShopWorkspaceShape);
  setMode("shops");
}

async function openBattleWorkspace() {
  if (state.mode === "battles" && isBattleFile() && state.records.length > 0) {
    renderBattleWorkspaceView();
    return;
  }
  if (!state.dataFiles.some((file) => file.path === "battles.json")) {
    showValidation(false, "当前 MOD 缺少 battles.json。");
    return;
  }
  await openDataFile("battles.json", { initializeEditor: false });
  if (!isBattleFile()) return;
  state.records.forEach(ensureBattleShape);
  ensureSelectedBattleUnit();
  setMode("battles");
}

function getBattleCharacterOptions() {
  const options = [];
  for (const definitions of state.contentIndex.definitionsById.values()) {
    for (const definition of definitions) {
      if (definition.type !== "characters") continue;
      options.push(createReferenceOption(definition, {
        typeLabel: "角色",
        subtitle: definition.record?.name && definition.record.name !== definition.id ? definition.id : "",
      }));
    }
  }
  return Array.from(new Map(options.map((option) => [option.id, option])).values())
    .sort((left, right) => left.name.localeCompare(right.name, "zh-Hans-CN") || left.id.localeCompare(right.id, "zh-Hans-CN"));
}

function getBattleBackgroundOptions() {
  const byId = new Map();
  for (const file of state.assetFiles) {
    const path = String(file?.path || "").replaceAll("\\", "/");
    const match = path.match(/(?:^|\/)art\/battle_bg\/([^/]+)\.(png|jpe?g|webp)$/iu);
    if (!match || byId.has(match[1])) continue;
    byId.set(match[1], { id: match[1], label: match[1], path });
  }
  return Array.from(byId.values()).sort((left, right) => left.label.localeCompare(right.label, "zh-Hans-CN"));
}

function getBattleMusicOptions() {
  return state.contentIndex.resourceRecords
    .map((resource) => ({
      resource,
      path: typeof resource?.value === "string" ? findAssetPath(resource.value, { audio: true }) : "",
    }))
    .filter(({ resource, path }) => resource?.id && path && isAudioAsset(path))
    .map(({ resource, path }) => ({
      id: resource.id,
      name: resource.id,
      typeLabel: resource.group || "音乐",
      subtitle: resource.value || path,
      description: path,
      searchText: [resource.id, resource.group, resource.value, path].filter(Boolean).join(" "),
    }))
    .sort((left, right) => left.name.localeCompare(right.name, "zh-Hans-CN"));
}

function getBattleReferences(record) {
  const id = typeof record?.id === "string" ? record.id.trim() : "";
  if (!id) return [];
  return (state.contentIndex.battleReferencesById?.get(id) || [])
    .filter((reference) => !(reference.path === "battles.json" && reference.ownerDefinitionId === record.id))
    .sort((left, right) => left.path.localeCompare(right.path, "zh-Hans-CN") || left.fieldPath.localeCompare(right.fieldPath));
}

async function revealBattleReference(reference) {
  if (reference.kind === "map" && reference.path === "maps.json") {
    await openMapWorkspace();
    if (state.mode !== "maps") return;
    const mapIndex = Number.isInteger(reference.mapIndex)
      ? reference.mapIndex
      : state.records.findIndex((record) => record?.id === reference.ownerDefinitionId);
    if (mapIndex >= 0 && state.records[mapIndex]) {
      state.selectedRecordIndex = mapIndex;
      state.mapEditor.selectedLocationIndex = Math.max(0, Number(reference.locationIndex) || 0);
      state.mapEditor.tab = "locations";
      renderMapWorkspaceView();
      elements.mapWorkspaceView
        .querySelector(`[data-event-index="${Math.max(0, Number(reference.eventIndex) || 0)}"]`)
        ?.scrollIntoView({ block: "center" });
    }
    return;
  }

  if (reference.kind === "story" || reference.path.endsWith(".story.json")) {
    const documentPath = getStorySourcePathForJson(reference.path) || reference.path;
    state.storyWorkspace.selectedDocumentPath = documentPath;
    state.storyWorkspace.selectedSegmentId = reference.ownerDefinitionId || "";
    await openStoryWorkspace();
    if (state.mode !== "story") return;
    state.storyWorkspace.selectedSegmentId = reference.ownerDefinitionId || state.storyWorkspace.selectedSegmentId;
    state.storyWorkspace.selectedGraphNodeId = state.storyWorkspace.selectedSegmentId;
    state.storyWorkspace.view = isStorySourceFile(state.currentPath) ? "dsl" : "json";
    setViewMode(state.storyWorkspace.view);
    renderStoryView();
    if (state.storyWorkspace.selectedSegmentId) selectStorySegment(state.storyWorkspace.selectedSegmentId);
    return;
  }

  const opened = await openDataFile(reference.path);
  if (!opened) return;
  setMode("data");
  setViewMode("json");
  selectLine(reference.line || 1);
}

function getBattleIssueContext(record, characterOptions, backgroundOptions, musicOptions) {
  const idCounts = new Map();
  for (const candidate of state.records) {
    const id = String(candidate?.id || "").trim();
    if (id) idCounts.set(id, (idCounts.get(id) || 0) + 1);
  }
  return {
    idCounts,
    characterIds: new Set(characterOptions.map((option) => option.id)),
    backgroundIds: new Set(backgroundOptions.map((option) => option.id)),
    musicIds: new Set(musicOptions.map((option) => option.id)),
    referenceCount: getBattleReferences(record).length,
  };
}

function ensureSelectedBattleUnit() {
  const record = state.records[state.selectedRecordIndex];
  if (!record) {
    state.battleWorkspace.selectedUnitKey = "";
    return;
  }
  if (getBattleUnit(record, state.battleWorkspace.selectedUnitKey)) return;
  state.battleWorkspace.selectedUnitKey = getBattleUnits(record)[0]?.key || "";
}

function renderBattleWorkspaceView() {
  if (state.mode !== "battles") return;
  const record = state.records[state.selectedRecordIndex];
  if (record) ensureBattleShape(record);
  ensureSelectedBattleUnit();
  const characterOptions = getBattleCharacterOptions();
  const backgroundOptions = getBattleBackgroundOptions();
  const musicOptions = getBattleMusicOptions();
  renderBattleWorkspace(elements.battleWorkspaceView, {
    state,
    characterOptions,
    characterMap: state.contentIndex.charactersByIdOrName,
    backgroundOptions,
    musicOptions,
    getReferences: getBattleReferences,
    getIssueContext: (battle) => getBattleIssueContext(battle, characterOptions, backgroundOptions, musicOptions),
    onSelectBattle: (index) => {
      state.selectedRecordIndex = index;
      state.battleWorkspace.tab = "deployment";
      state.battleWorkspace.selectedUnitKey = "";
      ensureSelectedBattleUnit();
      renderBattleWorkspaceView();
      renderProblemIndicators();
    },
    onSearch: (value) => {
      const search = elements.battleWorkspaceView.querySelector('.battle-workspace-catalog input[type="search"]');
      state.battleWorkspace.search = value;
      rerenderSearchResults(search, renderBattleWorkspaceView,
        () => elements.battleWorkspaceView.querySelector('.battle-workspace-catalog input[type="search"]'), "battles:list");
    },
    onFilter: (value) => {
      state.battleWorkspace.filter = value;
      renderBattleWorkspaceView();
    },
    onTab: (value) => {
      state.battleWorkspace.tab = value;
      renderBattleWorkspaceView();
    },
    onSelectUnit: (key) => {
      state.battleWorkspace.selectedUnitKey = key;
      state.battleWorkspace.tab = "deployment";
      renderBattleWorkspaceView();
    },
    onPatchBattle: (patch) => {
      const current = state.records[state.selectedRecordIndex];
      if (!current) return;
      Object.assign(current, patch);
      syncRecordsToEditor();
      renderBattleWorkspaceView();
    },
    onReplaceBattle: (next) => {
      state.records[state.selectedRecordIndex] = ensureBattleShape(next);
      state.battleWorkspace.selectedUnitKey = "";
      ensureSelectedBattleUnit();
      syncRecordsToEditor();
      renderBattleWorkspaceView();
    },
    onAddUnit: addWorkspaceBattleUnit,
    onPatchUnit: patchWorkspaceBattleUnit,
    onMoveUnit: moveWorkspaceBattleUnit,
    onSetUnitKind: convertWorkspaceBattleUnit,
    onDuplicateUnit: duplicateWorkspaceBattleUnit,
    onDeleteUnit: deleteWorkspaceBattleUnit,
    onAddRequiredCharacter: addBattleRequiredCharacter,
    onRemoveRequiredCharacter: removeBattleRequiredCharacter,
    onOpenReference: revealBattleReference,
    onRename: renameBattleRecord,
    onCreate: createBattleRecord,
    onDuplicate: duplicateBattleRecord,
    onDelete: deleteBattleRecord,
  });
}

function createBattleRecord() {
  const id = createUniqueId("新战斗");
  const battle = createBattleDefinition(id);
  const firstBackground = getBattleBackgroundOptions()[0];
  if (firstBackground) battle.mapId = firstBackground.id;
  state.records.push(battle);
  state.selectedRecordIndex = state.records.length - 1;
  state.battleWorkspace.search = "";
  state.battleWorkspace.filter = "all";
  state.battleWorkspace.tab = "deployment";
  state.battleWorkspace.selectedUnitKey = "participant:0";
  syncRecordsToEditor();
  renderBattleWorkspaceView();
}

async function createBattleForReference(preferredId = "") {
  const requestedId = preferredId || window.prompt("新战斗 ID", "新战斗");
  const id = String(requestedId || "").trim();
  if (!id) return "";
  if (id.includes("\n") || id.includes("\r")) {
    showValidation(false, "战斗 ID 不能包含换行符。");
    return "";
  }
  if (hasDefinition("battles", id)) {
    showValidation(true, `战斗「${id}」已经存在，将直接使用现有定义。`);
    return id;
  }

  try {
    const file = await requestJson(`/api/data/file?path=${encodeURIComponent("battles.json")}`);
    const records = parseJsonText(file.content);
    if (!Array.isArray(records)) throw new Error("battles.json 顶层必须是数组。");
    if (records.some((record) => String(record?.id || "").trim() === id)) {
      showValidation(true, `战斗「${id}」已经存在，将直接使用现有定义。`);
      return id;
    }
    const battle = createBattleDefinition(id);
    const firstBackground = getBattleBackgroundOptions()[0];
    if (firstBackground) battle.mapId = firstBackground.id;
    records.push(battle);
    const result = await requestJson("/api/data/file", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "battles.json", content: JSON.stringify(records) }),
    });
    await loadDataFiles();
    await rebuildContentIndex();
    showValidation(result.validation.ok, `已创建战斗「${id}」，可从当前调用位置继续配置。`);
    return id;
  } catch (error) {
    showValidation(false, error instanceof Error ? error.message : String(error));
    return "";
  }
}

async function renameBattleRecord() {
  const current = state.records[state.selectedRecordIndex];
  const oldId = String(current?.id || "").trim();
  if (!current || !oldId) {
    showValidation(false, "当前战斗缺少可重命名的 ID。");
    return;
  }
  const newId = String(window.prompt("新的战斗 ID", oldId) || "").trim();
  if (!newId || newId === oldId) return;
  if (newId.includes("\n") || newId.includes("\r")) {
    showValidation(false, "战斗 ID 不能包含换行符。");
    return;
  }
  if (state.records.some((record) => record !== current && String(record?.id || "").trim() === newId)) {
    showValidation(false, `战斗 ID 已存在：${newId}`);
    return;
  }

  const references = getBattleReferences(current);
  const referenceSummary = references.length
    ? `已识别 ${references.length} 处已保存引用，将同步更新。`
    : "没有发现已保存的静态引用。";
  const dirtySummary = state.dirty ? "当前 battles.json 的其他未保存修改也会一起保存。" : "";
  if (!confirmAction(`确认将战斗 ID「${oldId}」改为「${newId}」？\n\n${referenceSummary}\n${dirtySummary}\n地图、剧情源与编译 JSON、塔层和世界触发器会在同一事务中更新。`)) return;

  try {
    const result = await requestJson("/api/static/battle/rename", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldId, newId, battlesContent: JSON.stringify(state.records) }),
    });
    setEditorValue(result.content);
    state.records = parseJsonText(result.content);
    state.records.forEach(ensureBattleShape);
    state.recordsPath = "battles.json";
    state.selectedRecordIndex = Math.max(0, state.records.findIndex((record) => record?.id === newId));
    state.battleWorkspace.selectedUnitKey = "";
    ensureSelectedBattleUnit();
    dirtyStateController.markClean({ render: false });
    elements.saveState.textContent = `已重命名并更新 ${result.updatedReferences} 处引用`;
    state.problemCenter.validation = result.validation;
    projectProblemsCache = null;
    await loadDataFiles();
    await rebuildContentIndex();
    await loadStoryGraph();
    renderDirtyState();
    renderBattleWorkspaceView();
    renderFileList();
    showValidation(result.validation.ok,
      `战斗已重命名为「${newId}」，更新 ${result.updatedReferences} 处引用，涉及 ${result.changedFiles.length} 个文件。`);
  } catch (error) {
    showValidation(false, error instanceof Error ? error.message : String(error));
  }
}

function duplicateBattleRecord() {
  const current = state.records[state.selectedRecordIndex];
  if (!current) return;
  const copy = structuredCloneCompat(current);
  copy.id = createUniqueId(`${String(current.id || "新战斗")}_copy`);
  copy.name = `${String(current.name || current.id || "新战斗")} 副本`;
  state.records.splice(state.selectedRecordIndex + 1, 0, copy);
  state.selectedRecordIndex += 1;
  state.battleWorkspace.selectedUnitKey = "";
  ensureSelectedBattleUnit();
  syncRecordsToEditor();
  renderBattleWorkspaceView();
}

function deleteBattleRecord() {
  const current = state.records[state.selectedRecordIndex];
  if (!current) return;
  const references = getBattleReferences(current);
  const summary = references.length
    ? `静态扫描找到 ${references.length} 处引用。\n\n${references.slice(0, 5).map((item) => `${item.path} · ${item.fieldPath}`).join("\n")}\n\n`
    : "静态扫描未找到引用，但无法覆盖动态脚本或运行时引用。\n\n";
  if (!confirmAction(`${summary}确认删除战斗「${current.name || current.id}」？此操作会留在未保存状态。`)) return;
  state.records.splice(state.selectedRecordIndex, 1);
  state.selectedRecordIndex = Math.max(0, Math.min(state.selectedRecordIndex, state.records.length - 1));
  state.battleWorkspace.selectedUnitKey = "";
  ensureSelectedBattleUnit();
  syncRecordsToEditor();
  renderBattleWorkspaceView();
}

function addWorkspaceBattleUnit(kind) {
  const record = state.records[state.selectedRecordIndex];
  if (!record) return;
  const characterId = (kind === "ally" || kind === "enemy") ? getBattleCharacterOptions()[0]?.id || "" : undefined;
  state.battleWorkspace.selectedUnitKey = addBattleUnit(record, kind, { characterId });
  state.battleWorkspace.tab = "deployment";
  syncRecordsToEditor();
  renderBattleWorkspaceView();
}

function patchWorkspaceBattleUnit(key, patch) {
  const record = state.records[state.selectedRecordIndex];
  const entry = record ? getBattleUnit(record, key) : null;
  if (!entry) return;
  Object.assign(entry.unit, patch);
  syncRecordsToEditor();
  renderBattleWorkspaceView();
}

function moveWorkspaceBattleUnit(key, position) {
  const record = state.records[state.selectedRecordIndex];
  if (!record || !moveBattleUnit(record, key, position)) return;
  state.battleWorkspace.selectedUnitKey = key;
  syncRecordsToEditor();
  renderBattleWorkspaceView();
}

function convertWorkspaceBattleUnit(key, kind) {
  const record = state.records[state.selectedRecordIndex];
  if (!record) return;
  const characterId = (kind === "ally" || kind === "enemy") ? getBattleCharacterOptions()[0]?.id || "" : undefined;
  const nextKey = setBattleUnitKind(record, key, kind, { characterId });
  if (!nextKey) return;
  state.battleWorkspace.selectedUnitKey = nextKey;
  syncRecordsToEditor();
  renderBattleWorkspaceView();
}

function duplicateWorkspaceBattleUnit(key) {
  const record = state.records[state.selectedRecordIndex];
  if (!record) return;
  const nextKey = duplicateBattleUnit(record, key);
  if (!nextKey) return;
  state.battleWorkspace.selectedUnitKey = nextKey;
  syncRecordsToEditor();
  renderBattleWorkspaceView();
}

function deleteWorkspaceBattleUnit(key) {
  const record = state.records[state.selectedRecordIndex];
  const entry = record ? getBattleUnit(record, key) : null;
  if (!entry || !confirmAction("确认删除这个部署单位？")) return;
  if (!deleteBattleUnit(record, key)) return;
  state.battleWorkspace.selectedUnitKey = "";
  ensureSelectedBattleUnit();
  syncRecordsToEditor();
  renderBattleWorkspaceView();
}

function addBattleRequiredCharacter(characterId) {
  const record = state.records[state.selectedRecordIndex];
  if (!record || record.requiredCharacterIds.includes(characterId)) return;
  record.requiredCharacterIds.push(characterId);
  syncRecordsToEditor();
  renderBattleWorkspaceView();
}

function removeBattleRequiredCharacter(index) {
  const record = state.records[state.selectedRecordIndex];
  if (!record || index < 0 || index >= record.requiredCharacterIds.length) return;
  record.requiredCharacterIds.splice(index, 1);
  syncRecordsToEditor();
  renderBattleWorkspaceView();
}

function renderShopWorkspaceView() {
  if (state.mode !== "shops") return;
  const record = state.records[state.selectedRecordIndex];
  if (record) ensureShopWorkspaceShape(record);
  renderShopWorkspace(elements.shopWorkspaceView, {
    state,
    catalog: getShopRewardCatalog(),
    rewardOptions: getShopRewardOptions(),
    getResourceInfo: (shop, key) => getShopResourceInfo(shop, key, getShopResourceGroup(key)),
    getReferences: getShopReferences,
    onSelectShop: (index) => {
      state.selectedRecordIndex = index;
      state.shopWorkspace.selectedProductIndex = 0;
      state.shopWorkspace.tab = "products";
      renderShopWorkspaceView();
      renderProblemIndicators();
    },
    onSearch: (value) => {
      const input = elements.shopWorkspaceView.querySelector('.shop-workspace-shops input[type="search"]');
      state.shopWorkspace.search = value;
      rerenderSearchResults(input, renderShopWorkspaceView,
        () => elements.shopWorkspaceView.querySelector('.shop-workspace-shops input[type="search"]'), "shops:list");
    },
    onFilter: (value) => {
      state.shopWorkspace.filter = value;
      renderShopWorkspaceView();
    },
    onTab: (value) => {
      state.shopWorkspace.tab = value;
      renderShopWorkspaceView();
    },
    onSelectProduct: (index) => {
      state.shopWorkspace.selectedProductIndex = index;
      state.shopWorkspace.tab = "products";
      renderShopWorkspaceView();
    },
    onMutateShop: (key, value) => {
      const current = state.records[state.selectedRecordIndex];
      if (!current) return;
      current[key] = value;
      syncRecordsToEditor();
      renderShopWorkspaceView();
    },
    onReplaceShop: (next) => {
      state.records[state.selectedRecordIndex] = ensureShopWorkspaceShape(next);
      state.shopWorkspace.selectedProductIndex = Math.min(state.shopWorkspace.selectedProductIndex, Math.max(0, next.products.length - 1));
      syncRecordsToEditor();
      renderShopWorkspaceView();
    },
    onAddProduct: addWorkspaceShopProduct,
    onPatchProduct: patchShopProduct,
    onMoveProduct: moveCurrentShopProduct,
    onDuplicateProduct: duplicateWorkspaceShopProduct,
    onDeleteProduct: deleteWorkspaceShopProduct,
    onCreate: createShopRecord,
    onDuplicate: duplicateShopRecord,
    onDelete: deleteShopRecord,
    onPickResource: (field, path) => openShopResourcePicker(field, path),
  });
  renderShopResourcePicker();
}

function getShopItemOptions() {
  const options = [];
  for (const definitions of state.contentIndex.definitionsById.values()) {
    for (const definition of definitions) {
      if (definition.type === "items") options.push(createReferenceOption(definition, {
        typeLabel: "物品",
        subtitle: [definition.record?.type, Number.isFinite(definition.record?.price) ? `基础价 ${definition.record.price}` : ""].filter(Boolean).join(" · "),
      }));
    }
  }
  return Array.from(new Map(options.map((option) => [option.id, option])).values())
    .sort((left, right) => left.name.localeCompare(right.name, "zh-Hans-CN") || left.id.localeCompare(right.id, "zh-Hans-CN"));
}

function getShopSkillOptions(definitionType, typeLabel) {
  const options = [];
  for (const definitions of state.contentIndex.definitionsById.values()) {
    for (const definition of definitions) {
      if (definition.type !== definitionType) continue;
      options.push(createReferenceOption(definition, { typeLabel }));
    }
  }
  return Array.from(new Map(options.map((option) => [option.id, option])).values())
    .sort((left, right) => left.name.localeCompare(right.name, "zh-Hans-CN") || left.id.localeCompare(right.id, "zh-Hans-CN"));
}

function getShopRewardOptions() {
  return {
    items: getShopItemOptions(),
    externalSkills: getShopSkillOptions("external-skills", "外功"),
    internalSkills: getShopSkillOptions("internal-skills", "内功"),
  };
}

function getShopRewardCatalog() {
  const definitionsOfType = (type) => {
    const entries = [];
    for (const definitions of state.contentIndex.definitionsById.values()) {
      for (const definition of definitions) {
        if (definition.type === type && definition.id) entries.push([definition.id, definition.record]);
      }
    }
    return new Map(entries);
  };
  return {
    items: state.contentIndex.itemsById,
    externalSkills: definitionsOfType("external-skills"),
    internalSkills: definitionsOfType("internal-skills"),
  };
}

function resetMartialWorkspaceState() {
  const workspace = state.martialArtsWorkspace;
  workspace.documents = { external: [], internal: [], special: [], legend: [] };
  workspace.baselines = { external: "", internal: "", special: "", legend: "" };
  workspace.dirtyKinds = new Set();
  workspace.activeKind = "external";
  workspace.selectedIndex = 0;
  workspace.selectedFormIndex = -1;
  workspace.search = "";
  workspace.tab = "overview";
  workspace.animationCatalog = [];
  workspace.loading = false;
  workspace.creatorOpen = false;
  workspace.creatorTemplate = "";
  workspace.resourcePicker = { open: false, type: "", search: "", selectedId: "", target: null, field: "", clearValue: null };
}

async function openMartialWorkspace() {
  const workspace = state.martialArtsWorkspace;
  if (state.mode === "martial" && Object.values(workspace.documents).some((records) => records.length > 0)) {
    renderMartialWorkspaceView();
    return;
  }
  const missing = martialKinds.map(([, , path]) => path).filter((path) => !state.dataFiles.some((file) => file.path === path));
  if (missing.length) {
    showValidation(false, `当前 MOD 缺少武学数据文件：${missing.join("、")}`);
    return;
  }
  workspace.loading = true;
  try {
    const [documents, animations] = await Promise.all([
      Promise.all(martialKinds.map(async ([kind, , path]) => {
        const file = await requestJson(`/api/data/file?path=${encodeURIComponent(path)}`);
        const records = parseJsonText(file.content);
        if (!Array.isArray(records) || !records.every((record) => record && typeof record === "object" && !Array.isArray(record))) {
          throw new Error(`${path} 顶层必须是对象数组。`);
        }
        records.forEach((record) => ensureMartialShape(kind, record));
        return [kind, records];
      })),
      requestJson("/api/assets/skill-animations"),
    ]);
    workspace.documents = Object.fromEntries(documents);
    workspace.baselines = Object.fromEntries(documents.map(([kind, records]) => [kind, JSON.stringify(records)]));
    workspace.dirtyKinds = new Set();
    workspace.animationCatalog = animations;
    workspace.resourcePicker = { open: false, type: "", search: "", selectedId: "", target: null, field: "", clearValue: null };
    rememberCurrentDataDocumentContext();
    state.currentPath = getMartialPath(workspace.activeKind);
    state.records = [];
    state.recordsPath = "";
    dirtyStateController.markClean({ render: false });
    setMode("martial");
  } catch (error) {
    resetMartialWorkspaceState();
    showValidation(false, error instanceof Error ? error.message : String(error));
  } finally {
    workspace.loading = false;
  }
}

function createMartialOptions() {
  const byType = (type) => {
    const result = [];
    for (const definitions of state.contentIndex.definitionsById.values()) {
      for (const definition of definitions) {
        if (definition.type === type) result.push([definition.id, definition.displayName || definition.record?.name || definition.id]);
      }
    }
    return Array.from(new Map(result.map((entry) => [entry[0], entry])).values())
      .sort((left, right) => left[1].localeCompare(right[1], "zh-Hans-CN"));
  };
  const workspace = state.martialArtsWorkspace;
  const index = buildMartialIndex(workspace.documents);
  const external = (workspace.documents.external || []).map((record) => [record.id, record.name || record.id]);
  const internal = (workspace.documents.internal || []).map((record) => [record.id, record.name || record.id]);
  const special = (workspace.documents.special || []).map((record) => [record.id, record.name || record.id]);
  const forms = [...index.formsById.values()].flat().map((entry) => [entry.id, `${entry.name}（${entry.parent.name || entry.parent.id}）`]);
  return {
    buffs: byType("buffs"),
    scopedEffects: byType("scoped-battle-effects"),
    icons: Array.from(new Map(state.assetFiles
      .filter((file) => /^art\/icon\//i.test(file.path) && isImageAsset(file.path))
      .map((file) => {
        const id = file.path.split("/").pop().replace(/\.[^.]+$/, "");
        return [id, { id, name: id, path: file.path }];
      })).values()).sort((left, right) => left.id.localeCompare(right.id, "zh-Hans-CN")),
    audio: (state.contentIndex.resourceRecords || [])
      .filter((record) => record.group === "音效")
      .map((record) => ({ id: record.id, name: record.id, value: record.value || "", path: resolveResourceAssetPath(record) }))
      .sort((left, right) => left.id.localeCompare(right.id, "zh-Hans-CN")),
    startSkills: [...external, ...forms],
    conditions: {
      skill: external,
      internal_skill: internal,
      special_skill: special,
      talent: byType("talents"),
    },
  };
}

function createMartialAudioLibrary() {
  const registered = (state.contentIndex.resourceRecords || [])
    .filter((record) => record.group === "音效" && typeof record.id === "string")
    .map((record) => ({
      key: record.id,
      id: record.id,
      name: record.id,
      value: record.value || "",
      path: resolveResourceAssetPath(record),
      registered: true,
    }));
  const registeredPaths = new Set(registered.map((entry) => entry.path).filter(Boolean));
  const unregistered = state.assetFiles
    .filter((file) => isAudioAsset(file.path) && !registeredPaths.has(file.path))
    .map((file) => {
      const name = String(file.name || file.path.split("/").pop() || "新音效").replace(/\.[^.]+$/, "");
      return { key: file.path, id: "", name, value: file.path, path: file.path, registered: false };
    });
  return [...registered, ...unregistered].sort((left, right) => {
    const registrationOrder = Number(right.registered) - Number(left.registered);
    return registrationOrder || left.name.localeCompare(right.name, "zh-Hans-CN");
  });
}

function getMartialQuickPresentation(kind, record) {
  if (kind === "internal") {
    const form = record.formSkills?.[0];
    const presentation = form ? resolveMartialPresentation(form, "form", record) : { icon: record.icon || "", animation: "", audio: "" };
    return { ...presentation, animationLabel: form ? `招式：${form.name || form.id}` : "内功本体无动画", targetTab: form ? "growth" : "presentation" };
  }
  if (kind === "legend") {
    const index = buildMartialIndex(state.martialArtsWorkspace.documents);
    const form = index.formsById.get(record.startSkill)?.[0];
    const external = index.byId.get(record.startSkill)?.find((entry) => entry.kind === "external");
    const inherited = form ? resolveMartialPresentation(form.record, "form", form.parent) : external ? resolveMartialPresentation(external.record, "external") : { icon: "", animation: "", audio: "" };
    return {
      icon: inherited.icon,
      animation: record.animation || inherited.animation,
      audio: inherited.audio,
      animationLabel: record.animation ? "奥义全屏动画" : "继承起手武学动画",
      targetTab: "presentation",
    };
  }
  return { ...resolveMartialPresentation(record, kind), animationLabel: kind === "special" ? "绝技命中特效" : "外功命中特效", targetTab: "presentation" };
}

function getMartialIssueContext() {
  const documents = state.martialArtsWorkspace.documents;
  const index = buildMartialIndex(documents);
  const ids = (kind) => new Set((documents[kind] || []).map((record) => record.id).filter(Boolean));
  const formIdCounts = new Map([...index.formsById].map(([id, entries]) => [id, entries.length]));
  return {
    animationIds: new Set(state.martialArtsWorkspace.animationCatalog.map((entry) => entry.id)),
    invalidAnimationIds: new Set(state.martialArtsWorkspace.animationCatalog.filter((entry) => !entry.previewable).map((entry) => entry.id)),
    audioIds: new Set((state.contentIndex.resourceRecords || []).filter((record) => record.group === "音效").map((record) => record.id)),
    iconExists: (id) => Boolean(getMartialIconPath(id)),
    buffIds: new Set(createMartialOptions().buffs.map(([id]) => id)),
    scopedEffectIds: new Set(createMartialOptions().scopedEffects.map(([id]) => id)),
    externalIds: ids("external"),
    internalIds: ids("internal"),
    specialIds: ids("special"),
    talentIds: new Set(createMartialOptions().conditions.talent.map(([id]) => id)),
    startSkillIds: new Set([...ids("external"), ...index.formsById.keys()]),
    formIdCounts,
  };
}

function getMartialIconPath(iconId) {
  if (!iconId) return "";
  const resource = state.contentIndex.resourcesById.get(iconId);
  if (resource) return resolveResourceAssetPath(resource);
  return findAssetPath(`icon/${iconId}`, { art: true }) || findAssetPath(iconId, { art: true });
}

function markMartialChanged() {
  const workspace = state.martialArtsWorkspace;
  for (const [kind] of martialKinds) {
    const changed = JSON.stringify(workspace.documents[kind]) !== workspace.baselines[kind];
    if (changed) workspace.dirtyKinds.add(kind); else workspace.dirtyKinds.delete(kind);
  }
  dirtyStateController.setDirty(workspace.dirtyKinds.size > 0, { render: false });
  elements.saveState.textContent = workspace.dirtyKinds.size ? `${workspace.dirtyKinds.size} 个武学文件尚未保存` : "";
  renderDirtyState();
  renderMartialWorkspaceView();
}

function renderMartialWorkspaceView() {
  if (state.mode !== "martial") return;
  const workspace = state.martialArtsWorkspace;
  const records = workspace.documents[workspace.activeKind] || [];
  workspace.selectedIndex = Math.max(0, Math.min(workspace.selectedIndex, Math.max(0, records.length - 1)));
  const record = records[workspace.selectedIndex];
  if (record?.formSkills) workspace.selectedFormIndex = Math.min(workspace.selectedFormIndex, record.formSkills.length - 1);
  const options = createMartialOptions();
  const issueContext = getMartialIssueContext();
  renderMartialArtsWorkspace(elements.martialWorkspaceView, {
    state,
    options,
    audioLibrary: createMartialAudioLibrary(),
    animationChoices: workspace.animationCatalog.map((entry) => [entry.id, `${entry.id}${entry.previewable ? ` · ${entry.frameCount} 帧` : " · 不可预览"}`]),
    getIssues: (entry) => getMartialIssues(entry, issueContext),
    getIconPath: getMartialIconPath,
    getQuickPresentation: getMartialQuickPresentation,
    getAudioPath: (id) => {
      const resource = state.contentIndex.resourcesById.get(id);
      return resource ? resolveResourceAssetPath(resource) : "";
    },
    onSelectKind: (kind) => {
      workspace.activeKind = kind; workspace.selectedIndex = 0; workspace.selectedFormIndex = -1; workspace.tab = "overview"; workspace.creatorOpen = false; workspace.creatorTemplate = ""; workspace.resourcePicker.open = false; state.currentPath = getMartialPath(kind); renderMartialWorkspaceView();
    },
    onSelect: (index) => { workspace.selectedIndex = index; workspace.selectedFormIndex = -1; renderMartialWorkspaceView(); },
    onSearch: (value) => {
      const input = elements.martialWorkspaceView.querySelector('.martial-catalog-tools input[type="search"]');
      workspace.search = value;
      rerenderSearchResults(input, renderMartialWorkspaceView,
        () => elements.martialWorkspaceView.querySelector('.martial-catalog-tools input[type="search"]'), `martial:list:${workspace.activeKind}`);
    },
    onTab: (tab) => { workspace.tab = tab; renderMartialWorkspaceView(); },
    onMutate: markMartialChanged,
    onReplace: (next) => {
      if (!next || typeof next !== "object" || Array.isArray(next)) { showValidation(false, "武学定义必须是 JSON 对象。"); return; }
      records[workspace.selectedIndex] = ensureMartialShape(workspace.activeKind, next); markMartialChanged();
    },
    onJsonError: (error) => showValidation(false, error.message),
    onOpenCreator: () => { workspace.creatorOpen = true; workspace.creatorTemplate = ""; renderMartialWorkspaceView(); },
    onCloseCreator: () => { workspace.creatorOpen = false; workspace.creatorTemplate = ""; renderMartialWorkspaceView(); },
    onSelectCreatorTemplate: (templateId) => { workspace.creatorTemplate = templateId; renderMartialWorkspaceView(); },
    onOpenResourcePicker: ({ type, target, field, clearValue, selectedId }) => {
      workspace.resourcePicker = { open: true, type, search: "", selectedId: selectedId || "", target, field, clearValue };
      renderMartialWorkspaceView();
      elements.martialWorkspaceView.querySelector(".martial-resource-picker-search")?.focus({ preventScroll: true });
    },
    onCloseResourcePicker: () => {
      workspace.resourcePicker = { open: false, type: "", search: "", selectedId: "", target: null, field: "", clearValue: null };
      renderMartialWorkspaceView();
    },
    onResourcePickerSearch: (value) => {
      const input = elements.martialWorkspaceView.querySelector(".martial-resource-picker-search");
      workspace.resourcePicker.search = value;
      rerenderSearchResults(input, renderMartialWorkspaceView,
        () => elements.martialWorkspaceView.querySelector(".martial-resource-picker-search"));
    },
    onSelectResourcePicker: (id) => { workspace.resourcePicker.selectedId = id; renderMartialWorkspaceView(); },
    onApplyResourcePicker: () => {
      const picker = workspace.resourcePicker;
      if (!picker.target || !picker.field || !picker.selectedId) return;
      picker.target[picker.field] = picker.selectedId;
      workspace.resourcePicker = { open: false, type: "", search: "", selectedId: "", target: null, field: "", clearValue: null };
      markMartialChanged();
    },
    onRegisterAudioResource: async (rawId, entry) => {
      const picker = workspace.resourcePicker;
      const id = String(rawId || "").trim();
      if (!id) { showValidation(false, "请填写音效资源 ID。"); return; }
      if (!id.startsWith("音效.") || id.length <= "音效.".length) { showValidation(false, "音效资源 ID 必须使用“音效.名称”格式。"); return; }
      if (state.contentIndex.resourcesById.has(id)) { showValidation(false, `资源 ID 已存在：${id}`); return; }
      if (!picker.target || !picker.field || !entry?.path) return;
      try {
        const result = await createGenericResource(id, "音效", entry.path);
        picker.target[picker.field] = result.id || id;
        workspace.resourcePicker = { open: false, type: "", search: "", selectedId: "", target: null, field: "", clearValue: null };
        await loadDataFiles();
        await rebuildContentIndex();
        showValidation(result.validation.ok, result.validation.message);
        markMartialChanged();
      } catch (error) {
        showValidation(false, error instanceof Error ? error.message : String(error));
      }
    },
    onClearResourcePicker: () => {
      const picker = workspace.resourcePicker;
      if (!picker.target || !picker.field) return;
      picker.target[picker.field] = picker.clearValue;
      workspace.resourcePicker = { open: false, type: "", search: "", selectedId: "", target: null, field: "", clearValue: null };
      markMartialChanged();
    },
    onCreate: (templateId) => {
      if (!templateId) return;
      const id = createUniqueMartialId(`新${new Map(martialKinds.map(([kind, label]) => [kind, label])).get(workspace.activeKind)}`);
      records.push(createMartialFromTemplate(workspace.activeKind, templateId, id)); workspace.selectedIndex = records.length - 1; workspace.search = ""; workspace.tab = "overview"; workspace.creatorOpen = false; workspace.creatorTemplate = ""; markMartialChanged();
    },
    onDuplicate: () => {
      const current = records[workspace.selectedIndex]; if (!current) return;
      const copy = cloneMartialJson(current); copy.id = createUniqueMartialId(`${copy.id || "武学"}_copy`); if (copy.name) copy.name = `${copy.name} 副本`; records.splice(workspace.selectedIndex + 1, 0, copy); workspace.selectedIndex += 1; markMartialChanged();
    },
    onDelete: () => {
      const current = records[workspace.selectedIndex]; if (!current || !confirmAction(`确认删除「${current.name || current.id}」？引用不会自动修复。`)) return;
      records.splice(workspace.selectedIndex, 1); workspace.selectedIndex = Math.max(0, Math.min(workspace.selectedIndex, records.length - 1)); markMartialChanged();
    },
    onMove: (direction) => {
      const next = moveMartialEntry(records, workspace.selectedIndex, direction); if (next === records) return;
      workspace.documents[workspace.activeKind] = next; workspace.selectedIndex += direction; markMartialChanged();
    },
    onAddForm: () => { const current = records[workspace.selectedIndex]; if (!current) return; current.formSkills.push(createFormSkill(createUniqueMartialId("新招式"))); workspace.selectedFormIndex = current.formSkills.length - 1; markMartialChanged(); },
    onSelectForm: (index) => { workspace.selectedFormIndex = index; renderMartialWorkspaceView(); },
    onDuplicateForm: (index) => { const forms = records[workspace.selectedIndex]?.formSkills; if (!forms?.[index]) return; const copy = cloneMartialJson(forms[index]); copy.id = createUniqueMartialId(`${copy.id || "招式"}_copy`); if (copy.name) copy.name = `${copy.name} 副本`; forms.splice(index + 1, 0, copy); workspace.selectedFormIndex = index + 1; markMartialChanged(); },
    onDeleteForm: (index) => { const forms = records[workspace.selectedIndex]?.formSkills; if (!forms?.[index] || !confirmAction(`确认删除招式「${forms[index].name || forms[index].id}」？`)) return; forms.splice(index, 1); workspace.selectedFormIndex = Math.min(index, forms.length - 1); markMartialChanged(); },
  });
  renderProblemIndicators();
}

function createUniqueMartialId(base) {
  const index = buildMartialIndex(state.martialArtsWorkspace.documents);
  const used = new Set([...index.byId.keys(), ...index.formsById.keys()]);
  if (!used.has(base)) return base;
  let suffix = 2;
  while (used.has(`${base}_${suffix}`)) suffix += 1;
  return `${base}_${suffix}`;
}

function getShopReferences(record) {
  const id = typeof record?.id === "string" ? record.id.trim() : "";
  if (!id) return [];
  return (state.contentIndex.referencesByValue?.get(id) || [])
    .filter((reference) => !(reference.path === "shops.json" && reference.ownerDefinitionId === record.id))
    .map((reference) => ({ ...reference, value: id }))
    .sort((left, right) => left.path.localeCompare(right.path, "zh-Hans-CN") || left.fieldPath.localeCompare(right.fieldPath));
}

function createShopRecord() {
  const id = createUniqueId("新商店");
  state.records.push(createShopDefinition(id));
  state.selectedRecordIndex = state.records.length - 1;
  state.shopWorkspace.search = "";
  state.shopWorkspace.filter = "all";
  state.shopWorkspace.tab = "settings";
  state.shopWorkspace.selectedProductIndex = 0;
  syncRecordsToEditor();
  renderShopWorkspaceView();
}

function duplicateShopRecord() {
  const current = state.records[state.selectedRecordIndex];
  if (!current) return;
  const copy = structuredCloneCompat(current);
  copy.id = createUniqueId(`${String(current.id || "新商店")}_copy`);
  copy.name = `${String(current.name || current.id || "新商店")} 副本`;
  state.records.splice(state.selectedRecordIndex + 1, 0, copy);
  state.selectedRecordIndex += 1;
  state.shopWorkspace.selectedProductIndex = 0;
  syncRecordsToEditor();
  renderShopWorkspaceView();
}

function deleteShopRecord() {
  const current = state.records[state.selectedRecordIndex];
  if (!current) return;
  const references = getShopReferences(current);
  const summary = references.length
    ? `静态扫描找到 ${references.length} 处引用。\n\n${references.slice(0, 5).map((item) => `${item.path} · ${item.fieldPath}`).join("\n")}\n\n`
    : "静态扫描未找到引用，但无法覆盖动态脚本或运行时引用。\n\n";
  if (!confirmAction(`${summary}确认删除商店「${current.name || current.id}」？此操作会留在未保存状态。`)) return;
  state.records.splice(state.selectedRecordIndex, 1);
  state.selectedRecordIndex = Math.max(0, Math.min(state.selectedRecordIndex, state.records.length - 1));
  state.shopWorkspace.selectedProductIndex = 0;
  syncRecordsToEditor();
  renderShopWorkspaceView();
}

function addWorkspaceShopProduct() {
  const record = state.records[state.selectedRecordIndex];
  if (!record) return;
  ensureShopWorkspaceShape(record);
  const firstAvailable = getShopItemOptions().find((option) => !record.products.some((product) => product.reward?.kind === "item" && product.reward.itemId === option.id));
  record.products.push(createShopProduct(firstAvailable?.id || ""));
  state.shopWorkspace.selectedProductIndex = record.products.length - 1;
  state.shopWorkspace.tab = "products";
  syncRecordsToEditor();
  renderShopWorkspaceView();
}

function patchShopProduct(index, patch) {
  const record = state.records[state.selectedRecordIndex];
  if (!record?.products?.[index]) return;
  record.products[index] = { ...record.products[index], ...patch };
  syncRecordsToEditor();
  renderShopWorkspaceView();
}

function moveCurrentShopProduct(index, direction) {
  const record = state.records[state.selectedRecordIndex];
  if (!record) return;
  const next = moveShopProductEntry(record.products, index, direction);
  if (next === record.products) return;
  record.products = next;
  state.shopWorkspace.selectedProductIndex = index + direction;
  syncRecordsToEditor();
  renderShopWorkspaceView();
}

function duplicateWorkspaceShopProduct(index) {
  const record = state.records[state.selectedRecordIndex];
  const product = record?.products?.[index];
  if (!product) return;
  record.products.splice(index + 1, 0, structuredCloneCompat(product));
  state.shopWorkspace.selectedProductIndex = index + 1;
  syncRecordsToEditor();
  renderShopWorkspaceView();
}

function deleteWorkspaceShopProduct(index) {
  const record = state.records[state.selectedRecordIndex];
  const product = record?.products?.[index];
  const rewardName = product?.reward?.itemId || product?.reward?.skillId || (product?.reward?.kind === "yuanbao" ? `${product.reward.amount ?? 0} 元宝` : "未命名商品");
  if (!product || !confirmAction(`确认从当前商店删除商品「${rewardName}」？`)) return;
  record.products.splice(index, 1);
  state.shopWorkspace.selectedProductIndex = Math.max(0, Math.min(index, record.products.length - 1));
  syncRecordsToEditor();
  renderShopWorkspaceView();
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
    state.records
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
      { label: "地图与事件", detail: "编辑地图、点位和交互事件", icon: "图", mode: "maps", path: "maps.json", available: true },
      { label: "剧情与任务", detail: "查看剧情图谱与静态诊断", icon: "文", mode: "story", available: true },
      { label: "物品与装备", detail: "编辑物品、装备和效果", icon: "物", mode: "data", path: "items.json", available: false },
      { label: "商店与经济", detail: "编辑商店商品、价格和限购", icon: "商", mode: "data", path: "shops.json", available: false },
      { label: "战斗编排", detail: "编辑队伍、敌人、站位与背景", icon: "战", mode: "battles", path: "battles.json", available: true },
      { label: "浏览共享资源", detail: "预览项目图片、音频与文件", icon: "◇", mode: "assets", available: true },
      { label: "高级数据", detail: "打开完整文件树与原始 JSON", icon: "▦", mode: "data", available: true },
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
  if (projectProblemsCache) return projectProblemsCache;
  const problems = [];
  const validation = state.problemCenter.validation;
  if (Array.isArray(validation?.issues) && validation.issues.length > 0) {
    const sourceLabels = {
      syntax: "JSON 语法检查",
      contract: "游戏内容契约",
      resource: "资源依赖检查",
    };
    for (const [index, issue] of validation.issues.entries()) {
      const issuePath = String(issue.path || "");
      const dataPath = issue.category === "resource"
        ? issuePath
        : issuePath.match(/^[^.[\]]+\.json/i)?.[0] || issuePath;
      problems.push(createProblem({
        id: `backend:${issue.code || "validation"}:${issuePath}:${index}`,
        severity: issue.severity,
        source: `backend-${issue.category || "validation"}`,
        sourceLabel: sourceLabels[issue.category] || "正式内容校验",
        ...getProblemContentType(dataPath),
        message: issue.message,
        detail: issuePath && issuePath !== dataPath ? `数据位置：${issuePath}` : "",
        location: dataPath ? {
          workspace: issue.category === "resource" ? "assets" : "data",
          path: dataPath,
          line: issue.line,
          definitionId: issue.definitionId,
        } : null,
      }));
    }
  } else if (validation && !validation.ok) {
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

  const knownBattleIds = new Set(getDefinitionsByType("battles").map((definition) => definition.id));
  if (isBattleFile()) {
    for (const record of state.records) {
      const id = String(record?.id || "").trim();
      if (id) knownBattleIds.add(id);
    }
  }
  for (const [battleId, references] of state.contentIndex.battleReferencesById || []) {
    if (knownBattleIds.has(battleId)) continue;
    for (const reference of references) {
      const contentType = reference.kind === "map" ? "map" : reference.kind === "story" ? "story" : "data";
      problems.push(createProblem({
        id: `battle-reference:${reference.path}:${reference.fieldPath}:${battleId}`,
        severity: "error",
        source: "battle-reference",
        sourceLabel: "战斗调用检查",
        contentType,
        contentTypeLabel: contentType === "map" ? "地图" : contentType === "story" ? "剧情" : "高级数据",
        message: `引用的战斗不存在：${battleId}`,
        detail: `${reference.path} · ${reference.fieldPath}`,
        location: {
          workspace: reference.kind === "map" ? "maps" : reference.kind === "story" ? "story" : "data",
          path: reference.path,
          line: reference.line,
          definitionId: reference.ownerDefinitionId,
          definitionTypes: reference.kind === "map" ? ["maps"] : reference.kind === "story" ? ["story"] : [],
        },
      }));
    }
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

  const achievementResources = state.contentIndex.resourcesByGroup.get(achievementGroup) || [];
  const missingAchievements = getMissingAchievementReferences(
    achievementResources,
    state.contentIndex.achievementSourcesById,
  );
  for (const missing of missingAchievements) {
    for (const source of missing.sources) {
      problems.push(createProblem({
        id: `achievement-reference:${source.path}:${source.kind}:${missing.id}`,
        severity: "error",
        source: "achievement-reference",
        sourceLabel: "成就引用检查",
        contentType: source.kind === "story" ? "story" : "data",
        contentTypeLabel: source.kind === "story" ? "剧情" : "高级数据",
        message: `引用的成就不存在：${missing.id}`,
        detail: source.detail || "",
        location: {
          workspace: source.kind === "story" ? "story" : "data",
          path: source.path,
          definitionId: source.ownerId || missing.id,
          definitionTypes: source.kind === "story" ? ["story"] : ["towers"],
        },
      }));
    }
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

  if (isCharacterFile() && state.records.length > 0) {
    appendCurrentRecordProblems(problems, "character", "角色", getCharacterValidationIssues);
  } else if (isMapFile() && state.records.length > 0) {
    for (let index = 0; index < state.records.length; index += 1) {
      const record = state.records[index];
      const recordId = String(record?.id || record?.name || `#${index + 1}`);
      for (const message of getMapStats(record).issues) {
        problems.push(createProblem({
          id: `form:maps.json:${recordId}:${message}`,
          severity: "warning",
          source: "form-check",
          sourceLabel: "地图工作区检查",
          contentType: "map",
          contentTypeLabel: "地图",
          message,
          location: { workspace: "maps", path: "maps.json", definitionId: recordId },
        }));
      }
    }
  } else if (isBattleFile() && state.records.length > 0) {
    const characterOptions = getBattleCharacterOptions();
    const backgroundOptions = getBattleBackgroundOptions();
    const musicOptions = getBattleMusicOptions();
    for (let index = 0; index < state.records.length; index += 1) {
      const record = state.records[index];
      const recordId = String(record?.id || record?.name || `#${index + 1}`);
      const context = getBattleIssueContext(record, characterOptions, backgroundOptions, musicOptions);
      for (const issue of getBattleIssues(record, context).filter((candidate) => candidate.code !== "reference.unused")) {
        problems.push(createProblem({
          id: `form:battles.json:${recordId}:${issue.code}:${issue.unitKey || "battle"}`,
          severity: issue.severity,
          source: "form-check",
          sourceLabel: "战斗工作区检查",
          contentType: "battle",
          contentTypeLabel: "战斗",
          message: issue.message,
          detail: issue.unitKey ? `部署单位：${issue.unitKey}` : "",
          location: { workspace: "battles", path: "battles.json", definitionId: recordId },
        }));
      }
    }
  } else if (isItemFile() && state.records.length > 0) {
    appendCurrentRecordProblems(problems, "item", "物品", getItemValidationIssues);
  }

  projectProblemsCache = Array.from(new Map(problems.map((problem) => [problem.id, problem])).values());
  return projectProblemsCache;
}

function appendCurrentRecordProblems(problems, contentType, contentTypeLabel, getIssues) {
  for (let index = 0; index < state.records.length; index += 1) {
    const record = state.records[index];
    const recordId = String(record?.id || record?.name || `#${index + 1}`);
    for (const issue of getIssues(record)) {
      problems.push(createProblem({
        id: `form:${state.currentPath}:${recordId}:${issue.message}`,
        severity: issue.severity,
        source: "form-check",
        sourceLabel: "结构化内容检查",
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
  if (normalized.endsWith("battles.json")) return { contentType: "battle", contentTypeLabel: "战斗" };
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
      projectProblemsCache = null;
    } catch (error) {
      state.portraitCheck = {
        ok: false,
        summary: { characterCount: 0, portraitResourceCount: 0, storySpeakerCount: 0, checkedPortraitCount: 0, errors: 1, warnings: 0, infos: 0 },
        issues: [{ severity: "error", area: "resources", message: error.message, dataPath: null, line: null, definitionId: null, assetPath: null, assetExists: false }],
      };
      projectProblemsCache = null;
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
  if (item.mode === "maps") {
    await openMapWorkspace();
    return;
  }
  if (item.mode === "battles") {
    await openBattleWorkspace();
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
    const index = state.records.findIndex((record) => record?.id === location.definitionId || record?.name === location.definitionId);
    if (index >= 0) {
      state.selectedRecordIndex = index;
      renderCharacterWorkspaceView();
    }
    return;
  }
  if (location.workspace === "maps" || location.path === "maps.json") {
    await openMapWorkspace();
    const index = state.records.findIndex((record) => record?.id === location.definitionId || record?.name === location.definitionId);
    if (index >= 0) {
      state.selectedRecordIndex = index;
      state.mapEditor.selectedLocationIndex = 0;
      renderMapWorkspaceView();
    }
    return;
  }
  if (location.workspace === "battles" || location.path === "battles.json") {
    await openBattleWorkspace();
    const index = state.records.findIndex((record) => record?.id === location.definitionId || record?.name === location.definitionId);
    if (index >= 0) {
      state.selectedRecordIndex = index;
      state.battleWorkspace.tab = "deployment";
      state.battleWorkspace.selectedUnitKey = "";
      ensureSelectedBattleUnit();
      renderBattleWorkspaceView();
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

function updateStorySourceButton() {
  const available = canSaveCurrentStoryJsonAsSource();
  elements.saveStorySourceButton.classList.toggle("hidden", !available);
  elements.saveStorySourceButton.disabled = !available;
}

function renderFileList() {
  const query = elements.fileSearch.value.trim().toLowerCase();
  if (state.mode === "story") {
    renderStoryDocumentList(query);
    bindScrollMemory(elements.fileList, state.workspaceScrollPositions, "sidebar:story");
    return;
  }

  if (state.mode === "data") {
    elements.browserTitle.textContent = "数据文件";
    renderDataFileGroupList(query);
    bindScrollMemory(elements.fileList, state.workspaceScrollPositions, "sidebar:data");
    return;
  }

  if (state.mode !== "assets") {
    elements.fileList.replaceChildren();
    return;
  }

  const files = state.assetFiles;
  elements.browserTitle.textContent = "资产文件";
  elements.fileList.replaceChildren();

  for (const file of files) {
    if (query && !getFileSearchText(file).includes(query)) {
      continue;
    }

    elements.fileList.appendChild(createFileListItem(file));
  }
  bindScrollMemory(elements.fileList, state.workspaceScrollPositions, "sidebar:assets");
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

function renderLegacyStoryView() {
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
    rerenderSearchResults(search, renderStoryView,
      () => elements.storyView.querySelector(".story-search"));
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
  if (node.callCount > 0) appendStoryTag(tags, `调用 ${node.callCount}`);
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
    createStoryMetric("跳转", node.jumpCount),
    createStoryMetric("调用", node.callCount),
    createStoryMetric("返回", node.returnCount));
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

function renderStoryDocumentList(query = "") {
  const documents = buildStoryDocuments(state.dataFiles, state.storyGraph)
    .filter((document) => matchesStoryDocument(document, query));
  elements.browserTitle.textContent = "剧情文档";
  elements.fileList.replaceChildren();

  if (documents.length === 0) {
    const empty = document.createElement("div");
    empty.className = "file-item muted";
    empty.textContent = query ? "没有匹配的剧情文档" : "当前 MOD 没有剧情文档";
    elements.fileList.appendChild(empty);
    return;
  }

  for (const documentModel of documents) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "file-item";
    item.title = documentModel.path;
    item.classList.toggle("active", state.storyWorkspace.selectedDocumentPath === documentModel.path);
    const title = document.createElement("div");
    title.className = "file-title";
    title.textContent = documentModel.title;
    const meta = document.createElement("div");
    meta.className = "file-meta";
    meta.textContent = `${documentModel.sourceKind.toUpperCase()} · ${documentModel.segments.length} 段${documentModel.diagnosticCount ? ` · ${documentModel.diagnosticCount} 问题` : ""}`;
    item.append(title, meta);
    item.addEventListener("click", () => openStoryDocument(documentModel.path));
    elements.fileList.appendChild(item);
  }
}

async function openStoryDocument(path) {
  if (path === state.currentPath && state.storyWorkspace.selectedDocumentPath === path) return;
  await openDataFile(path);
  if (state.currentPath !== path) return;
  state.storyWorkspace.selectedDocumentPath = path;
  state.storyWorkspace.selectedSegmentId = "";
  state.storyWorkspace.selectedGraphNodeId = "";
  state.storyWorkspace.view = isStorySourceFile(path) ? "dsl" : "json";
  renderFileList();
  renderStoryView();
}

function restoreStoryEditorPlacement() {
  if (elements.editor.parentElement !== elements.editorPane) {
    elements.editorPane.insertBefore(elements.editor, elements.editorStatusbar);
  }
  if (elements.monacoHost.parentElement !== elements.editorPane) {
    elements.editorPane.insertBefore(elements.monacoHost, elements.editorStatusbar);
  }
}

function placeStoryEditor(host) {
  host.append(elements.editor, elements.monacoHost);
}

function renderStoryView() {
  const previousCanvas = elements.storyView.querySelector(".story-graph-canvas");
  if (previousCanvas) destroyStoryGraph(previousCanvas);
  storyGraphRenderVersion += 1;
  restoreStoryEditorPlacement();
  elements.storyView.replaceChildren();

  const documents = buildStoryDocuments(state.dataFiles, state.storyGraph);
  const currentDocument = documents.find((item) => item.path === state.storyWorkspace.selectedDocumentPath)
    || documents.find((item) => item.path === state.currentPath)
    || documents[0];
  if (!currentDocument) {
    setTextEditorVisible(false);
    const empty = document.createElement("div");
    empty.className = "story-workspace-empty";
    empty.textContent = "当前 MOD 没有可创作的 .story 或 .story.json 文档。";
    elements.storyView.appendChild(empty);
    return;
  }

  state.storyWorkspace.selectedDocumentPath = currentDocument.path;
  const workspaceGraph = buildCurrentStoryWorkspaceGraph(currentDocument);
  const segments = workspaceGraph.graph.nodes
    .filter((node) => node.path === currentDocument.compiledPath)
    .sort((left, right) => left.line - right.line || left.id.localeCompare(right.id, "zh-Hans-CN"));
  if (!state.storyWorkspace.selectedSegmentId || !segments.some((segment) => segment.id === state.storyWorkspace.selectedSegmentId)) {
    state.storyWorkspace.selectedSegmentId = segments[0]?.id || "";
  }

  const shell = document.createElement("div");
  shell.className = "story-workspace-shell";
  const catalog = createStorySegmentCatalog(currentDocument, segments, documents);
  const main = document.createElement("section");
  main.className = "story-workspace-main";
  main.append(
    createStoryWorkspaceHeader(currentDocument, segments.length),
    createStoryViewbar(currentDocument),
    createStoryWorkspaceStage(currentDocument, workspaceGraph));
  shell.append(catalog, main);
  elements.storyView.appendChild(shell);
  scheduleEditorLayout();
}

function createStorySegmentCatalog(documentModel, segments, documents) {
  const catalog = document.createElement("aside");
  catalog.className = "story-catalog";
  const header = document.createElement("div");
  header.className = "story-catalog-header";
  const title = document.createElement("div");
  title.className = "story-catalog-title";
  title.textContent = "剧情文档";
  const documentSelect = document.createElement("select");
  documentSelect.className = "story-document-select";
  documentSelect.setAttribute("aria-label", "当前剧情文档");
  for (const item of documents) {
    const option = document.createElement("option");
    option.value = item.path;
    option.textContent = `${item.title} · ${item.sourceKind.toUpperCase()}`;
    option.selected = item.path === documentModel.path;
    documentSelect.appendChild(option);
  }
  documentSelect.addEventListener("change", () => openStoryDocument(documentSelect.value));
  const meta = document.createElement("div");
  meta.className = "story-catalog-meta";
  meta.textContent = `段落目录 · ${segments.length} 个 segment`;
  header.append(title, documentSelect, meta);

  const search = document.createElement("input");
  search.className = "story-catalog-search";
  search.type = "search";
  search.placeholder = "搜索段落 ID";
  search.setAttribute("aria-label", "搜索当前剧情段落");
  search.value = state.storyWorkspace.search;
  bindImeSafeInput(search, (value) => {
    state.storyWorkspace.search = value;
    rerenderSearchResults(search, renderStoryView,
      () => elements.storyView.querySelector(".story-catalog-search"), `story:segments:${documentModel.path}`);
  });

  const normalized = state.storyWorkspace.search.trim().toLowerCase();
  const list = document.createElement("div");
  list.className = "story-segment-list";
  for (const segment of segments.filter((item) => !normalized || item.id.toLowerCase().includes(normalized))) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "story-segment-item";
    button.dataset.segmentId = segment.id;
    button.classList.toggle("active", segment.id === state.storyWorkspace.selectedSegmentId);
    const name = document.createElement("div");
    name.className = "story-segment-name";
    name.textContent = segment.id;
    const segmentMeta = document.createElement("div");
    segmentMeta.className = "story-segment-meta";
    segmentMeta.textContent = `${segment.stepCount || 0} 步 · ${segment.incoming || 0} 入 / ${segment.outgoing || 0} 出`;
    button.append(name, segmentMeta);
    button.addEventListener("click", () => selectStorySegment(segment.id));
    list.appendChild(button);
  }
  if (!list.childElementCount) {
    const empty = document.createElement("div");
    empty.className = "story-workspace-empty";
    empty.textContent = "没有匹配的段落";
    list.appendChild(empty);
  }
  bindScrollMemory(list, state.workspaceScrollPositions, `story:segments:${documentModel.path}`);
  catalog.append(header, search, list);
  return catalog;
}

function createStoryWorkspaceHeader(documentModel, segmentCount) {
  const header = document.createElement("header");
  header.className = "story-workspace-header";
  const heading = document.createElement("div");
  heading.className = "story-document-heading";
  const title = document.createElement("div");
  title.className = "story-document-title";
  title.textContent = documentModel.path;
  const meta = document.createElement("div");
  meta.className = "story-document-meta";
  meta.textContent = `${segmentCount} 个剧情段 · ${formatFileSize(documentModel.size)}`;
  heading.append(title, meta);
  const badge = document.createElement("div");
  badge.className = "story-authority-badge";
  badge.textContent = documentModel.sourceKind === "dsl" ? "DSL 是可写源" : "JSON 是可写源";
  const actions = document.createElement("div");
  actions.className = "story-document-actions";
  actions.appendChild(badge);
  if (documentModel.sourceKind === "json") {
    const convert = document.createElement("button");
    convert.type = "button";
    convert.className = "button secondary";
    convert.textContent = "转换为 DSL 源";
    convert.title = "创建同名 .story，并从此由 DSL 生成 JSON";
    convert.addEventListener("click", saveCurrentStoryJsonAsSource);
    actions.appendChild(convert);
  }
  header.append(heading, actions);
  return header;
}

function createStoryViewbar(documentModel) {
  const bar = document.createElement("div");
  bar.className = "story-viewbar";
  const tabs = document.createElement("div");
  tabs.className = "story-view-tabs";
  for (const [id, label] of [["dsl", "DSL"], ["json", "JSON"], ["flow", "流程"]]) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "story-view-tab";
    button.classList.toggle("active", state.storyWorkspace.view === id);
    button.textContent = label;
    button.addEventListener("click", () => setStoryWorkspaceView(id));
    tabs.appendChild(button);
  }
  bar.appendChild(tabs);

  if (state.storyWorkspace.view === "flow") {
    const tools = document.createElement("div");
    tools.className = "story-graph-tools";
    for (const [id, label] of [["neighbors", "邻域"], ["group", "剧情线"], ["file", "当前文件"], ["overview", "全库"]]) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "story-scope-button";
      button.classList.toggle("active", state.storyWorkspace.graphScope === id);
      button.textContent = label;
      button.addEventListener("click", () => {
        state.storyWorkspace.graphScope = id;
        state.storyWorkspace.selectedGraphNodeId = "";
        renderStoryView();
      });
      tools.appendChild(button);
    }
    const filterLabel = document.createElement("label");
    filterLabel.className = "story-graph-filter";
    const filterText = document.createElement("span");
    filterText.textContent = "筛选";
    const filter = document.createElement("select");
    filter.setAttribute("aria-label", "筛选流程节点");
    for (const [value, label] of [["all", "全部"], ["issues", "问题"], ["entrypoints", "入口"], ["isolated", "孤立"]]) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = state.storyWorkspace.graphFilter === value;
      filter.appendChild(option);
    }
    filter.addEventListener("change", () => {
      state.storyWorkspace.graphFilter = filter.value;
      state.storyWorkspace.selectedGraphNodeId = "";
      renderStoryView();
    });
    filterLabel.append(filterText, filter);
    tools.appendChild(filterLabel);
    const locate = document.createElement("button");
    locate.type = "button";
    locate.className = "story-graph-fit icon-button compact";
    locate.title = "定位当前剧情段";
    locate.setAttribute("aria-label", "定位当前剧情段");
    locate.textContent = "⌖";
    locate.addEventListener("click", () => {
      const canvas = elements.storyView.querySelector(".story-graph-canvas");
      if (canvas && !focusStoryGraph(canvas, state.storyWorkspace.selectedSegmentId)) {
        showValidation(false, "当前筛选范围不包含所选剧情段。");
      }
    });
    tools.appendChild(locate);
    const fit = document.createElement("button");
    fit.type = "button";
    fit.className = "story-graph-fit icon-button compact";
    fit.title = "适应画布";
    fit.setAttribute("aria-label", "适应画布");
    fit.textContent = "⊞";
    fit.addEventListener("click", () => {
      const canvas = elements.storyView.querySelector(".story-graph-canvas");
      if (canvas) fitStoryGraph(canvas);
    });
    tools.appendChild(fit);
    bar.appendChild(tools);
  }
  return bar;
}

function createStoryWorkspaceStage(documentModel, workspaceGraph) {
  const stage = document.createElement("div");
  stage.className = "story-workspace-stage";
  if (state.storyWorkspace.view === "flow") {
    setTextEditorVisible(false);
    stage.appendChild(createStoryFlowStage(documentModel, workspaceGraph));
    return stage;
  }

  const codeStage = document.createElement("div");
  codeStage.className = "story-code-stage";
  const note = document.createElement("div");
  note.className = "story-source-note";
  const isWritable = state.storyWorkspace.view === documentModel.sourceKind;
  const label = document.createElement("strong");
  label.textContent = isWritable ? "可编辑源" : "只读预览";
  const detail = document.createElement("span");
  detail.textContent = isWritable
    ? "保存时只写入当前源文件"
    : documentModel.sourceKind === "dsl" ? "由 DSL 草稿实时编译" : "由 JSON 草稿实时反编译";
  note.append(label, detail);
  if (isWritable) codeStage.appendChild(createStoryBattleAuthoringBar(documentModel));
  const host = document.createElement("div");
  host.className = "story-code-host";
  placeStoryEditor(host);
  codeStage.append(note, host);
  stage.appendChild(codeStage);
  setTextEditorVisible(true);
  return stage;
}

function createStoryBattleAuthoringBar(documentModel) {
  const bar = document.createElement("div");
  bar.className = "story-battle-authoring";
  const label = document.createElement("strong");
  label.textContent = "插入战斗";
  const picker = createReferencePicker({
    options: getMapEventTargetOptions("battle"),
    placeholder: "搜索战斗名称或 ID",
    compact: true,
    showSelected: false,
    onSelect: (battleId) => insertStoryBattleReference(documentModel, battleId),
  });
  const create = createActionButton("新建战斗", async () => {
    const battleId = await createBattleForReference();
    if (battleId) insertStoryBattleReference(documentModel, battleId);
  });
  bar.append(label, picker, create);
  return bar;
}

function insertStoryBattleReference(documentModel, battleId) {
  const normalizedId = String(battleId || "").trim();
  if (!normalizedId) return;
  if (documentModel.sourceKind === "json") {
    try {
      const root = parseJsonText(getEditorValue());
      const segments = Array.isArray(root?.segments) ? root.segments : [];
      const segment = segments.find((candidate) => candidate?.name === state.storyWorkspace.selectedSegmentId) || segments[0];
      if (!segment) throw new Error("当前 Story JSON 没有可插入战斗的剧情段。");
      if (!Array.isArray(segment.steps)) segment.steps = [];
      segment.steps.push({ kind: "battle", battleId: normalizedId, outcomes: { win: [], lose: [] } });
      setEditorValue(`${JSON.stringify(root, null, 2)}\n`);
      handleTextEditorInput();
      showValidation(true, `已向剧情段「${segment.name}」添加战斗「${normalizedId}」。`);
    } catch (error) {
      showValidation(false, error instanceof Error ? error.message : String(error));
    }
    return;
  }

  const editor = monacoState.editor;
  if (editor && window.monaco) {
    const position = editor.getPosition() || { lineNumber: 1, column: 1 };
    const line = editor.getModel()?.getLineContent(position.lineNumber) || "";
    const indent = /^\s*/u.exec(line)?.[0] || "";
    const text = `${indent}battle ${normalizedId}\n${indent}- win\n${indent}- lose\n`;
    editor.executeEdits("battle-reference-picker", [{
      range: new monaco.Range(position.lineNumber, 1, position.lineNumber, 1),
      text,
      forceMoveMarkers: true,
    }]);
    editor.setPosition({ lineNumber: position.lineNumber, column: indent.length + 8 });
    editor.focus();
  } else {
    const source = elements.editor.value;
    const cursor = elements.editor.selectionStart || 0;
    const lineStart = source.lastIndexOf("\n", Math.max(0, cursor - 1)) + 1;
    const lineEnd = source.indexOf("\n", lineStart);
    const line = source.slice(lineStart, lineEnd < 0 ? source.length : lineEnd);
    const indent = /^\s*/u.exec(line)?.[0] || "";
    const text = `${indent}battle ${normalizedId}\n${indent}- win\n${indent}- lose\n`;
    elements.editor.setRangeText(text, lineStart, lineStart, "end");
    handleTextEditorInput();
    elements.editor.focus();
  }
  showValidation(true, `已插入战斗「${normalizedId}」的胜负分支。`);
}

function createStoryFlowStage(documentModel, workspaceGraph) {
  const stage = document.createElement("div");
  stage.className = "story-graph-stage";
  const projection = buildStoryGraphProjection(workspaceGraph.graph, {
    scope: state.storyWorkspace.graphScope,
    filter: state.storyWorkspace.graphFilter,
    selectedId: state.storyWorkspace.selectedSegmentId,
    documentPath: documentModel.compiledPath,
  });
  const canvas = document.createElement("div");
  canvas.className = "story-graph-canvas";
  canvas.setAttribute("aria-label", "剧情流程图");
  const status = document.createElement("div");
  status.className = "story-graph-status";
  status.textContent = projection.nodes.length === 0
    ? "当前范围和筛选下没有可显示的节点"
    : projection.truncated
      ? `显示 500 / ${projection.totalNodeCount} 个节点，请缩小范围查看完整流向`
      : `${projection.nodes.length} 个节点 · ${projection.edges.length} 条流向${workspaceGraph.usingSavedGraph ? " · 草稿无法解析，显示已保存版本" : ""}`;
  stage.append(canvas, createStoryGraphLegend(), status);

  const selectedNode = workspaceGraph.graph.nodes.find((node) => node.id === state.storyWorkspace.selectedGraphNodeId);
  if (selectedNode) stage.appendChild(createStoryFlowDetail(selectedNode));

  const renderVersion = storyGraphRenderVersion;
  renderStoryGraph(canvas, projection, {
    selectedId: state.storyWorkspace.selectedGraphNodeId,
    onSelect: (nodeId) => handleStoryGraphNodeSelect(nodeId, projection, workspaceGraph.graph),
    onBackgroundSelect: () => {
      if (!state.storyWorkspace.selectedGraphNodeId) return;
      state.storyWorkspace.selectedGraphNodeId = "";
      renderStoryView();
    },
  }).catch((error) => {
    if (renderVersion !== storyGraphRenderVersion || !canvas.isConnected) return;
    status.textContent = `流程组件加载失败：${error instanceof Error ? error.message : String(error)}`;
    canvas.classList.remove("loading");
  });
  return stage;
}

function createStoryGraphLegend() {
  const legend = document.createElement("div");
  legend.className = "story-graph-legend";
  for (const [kind, label] of [["jump", "跳转"], ["time", "限时"], ["dynamic", "动态"], ["issue", "问题"]]) {
    const item = document.createElement("span");
    item.className = `story-graph-legend-item ${kind}`;
    const marker = document.createElement("i");
    marker.setAttribute("aria-hidden", "true");
    item.append(marker, label);
    legend.appendChild(item);
  }
  return legend;
}

function createStoryFlowDetail(node) {
  const detail = document.createElement("aside");
  detail.className = "story-flow-detail";
  const header = document.createElement("div");
  header.className = "story-flow-detail-header";
  const title = document.createElement("div");
  title.className = "story-flow-detail-title";
  title.textContent = node.id;
  const close = document.createElement("button");
  close.type = "button";
  close.className = "icon-button compact";
  close.title = "关闭详情";
  close.setAttribute("aria-label", "关闭详情");
  close.textContent = "×";
  close.addEventListener("click", () => {
    state.storyWorkspace.selectedGraphNodeId = "";
    renderStoryView();
  });
  header.append(title, close);
  const grid = document.createElement("div");
  grid.className = "story-flow-detail-grid";
  for (const [label, value] of [["步骤", node.stepCount || 0], ["对白", node.dialogueCount || 0], ["命令", node.commandCount || 0], ["流向", node.outgoing || 0]]) {
    const stat = document.createElement("div");
    stat.className = "story-flow-stat";
    stat.innerHTML = `<strong>${value}</strong>${label}`;
    grid.appendChild(stat);
  }
  const open = document.createElement("button");
  open.type = "button";
  open.className = "button secondary";
  open.textContent = "定位到源码";
  open.addEventListener("click", () => openStoryGraphNode(node));
  const actions = document.createElement("div");
  actions.className = "story-flow-detail-actions";
  if (state.storyWorkspace.graphScope !== "neighbors") {
    const drilldown = document.createElement("button");
    drilldown.type = "button";
    drilldown.className = "button secondary";
    drilldown.textContent = "查看邻域";
    drilldown.addEventListener("click", () => {
      state.storyWorkspace.graphScope = "neighbors";
      state.storyWorkspace.selectedSegmentId = node.id;
      state.storyWorkspace.selectedGraphNodeId = node.id;
      renderStoryView();
    });
    actions.appendChild(drilldown);
  }
  actions.appendChild(open);
  detail.append(header, grid, actions);
  return detail;
}

function buildCurrentStoryWorkspaceGraph(documentModel) {
  try {
    const jsonText = getCurrentStoryJsonText();
    const json = parseJsonText(jsonText);
    const lineEntries = documentModel.sourceKind === "dsl"
      ? getStoryDslOutlineEntries(state.storySource.text)
      : getStoryJsonOutlineEntries(jsonText);
    const lineBySegment = new Map(lineEntries.map((entry) => [entry.title, entry.line]));
    const draft = buildDraftStoryGraph(json, { compiledPath: documentModel.compiledPath, lineBySegment });
    return { graph: mergeDraftStoryGraph(state.storyGraph || {}, draft, documentModel.compiledPath), usingSavedGraph: false };
  } catch {
    return { graph: state.storyGraph || { nodes: [], edges: [], entrypoints: [] }, usingSavedGraph: true };
  }
}

function getCurrentStoryJsonText() {
  if (state.storySource.kind === "source") {
    const sourceText = state.viewMode === "dsl" ? getEditorValue() : state.storySource.text;
    state.storySource.text = sourceText;
    const analysis = window.StoryDsl.analyzeStory(sourceText);
    if (!analysis.jsonText) throw new Error("Story DSL 无法编译。");
    state.storySource.jsonText = analysis.jsonText;
    return analysis.jsonText;
  }
  if (state.storySource.kind === "json") {
    if (state.viewMode === "json") state.storySource.jsonText = getEditorValue();
    return state.storySource.jsonText;
  }
  throw new Error("当前文件不是剧情文档。");
}

function setStoryWorkspaceView(view) {
  if (!["dsl", "json", "flow"].includes(view) || view === state.storyWorkspace.view) return;
  if (view === "flow") {
    try {
      getCurrentStoryJsonText();
    } catch {
      // The flow view falls back to the last saved graph while the draft is invalid.
    }
    state.storyWorkspace.view = "flow";
    renderStoryView();
    return;
  }
  state.storyWorkspace.view = view;
  setViewMode(view);
  renderStoryView();
}

function selectStorySegment(segmentId) {
  state.storyWorkspace.selectedSegmentId = segmentId;
  state.storyWorkspace.selectedGraphNodeId = segmentId;
  if (state.storyWorkspace.view === "flow") {
    renderStoryView();
    return;
  }
  for (const item of elements.storyView.querySelectorAll(".story-segment-item")) {
    item.classList.toggle("active", item.dataset.segmentId === segmentId);
  }
  const entries = state.viewMode === "dsl"
    ? getStoryDslOutlineEntries(getEditorValue())
    : getStoryJsonOutlineEntries(getEditorValue());
  const entry = entries.find((item) => item.title === segmentId);
  if (entry) {
    setEditorCursorToLine(entry.line, 1);
    focusTextEditor();
  }
}

function handleStoryGraphNodeSelect(nodeId, projection, graph) {
  if (projection.overview) {
    const firstNode = graph.nodes.find((node) => node.groupId === nodeId);
    if (!firstNode) return;
    state.storyWorkspace.graphScope = "group";
    state.storyWorkspace.selectedSegmentId = firstNode.id;
    state.storyWorkspace.selectedGraphNodeId = firstNode.id;
  } else {
    state.storyWorkspace.selectedGraphNodeId = nodeId;
    state.storyWorkspace.selectedSegmentId = nodeId;
  }
  renderStoryView();
}

async function openStoryGraphNode(node) {
  const documents = buildStoryDocuments(state.dataFiles, state.storyGraph);
  const documentModel = documents.find((item) => item.compiledPath === node.path);
  if (documentModel && documentModel.path !== state.currentPath) {
    await openStoryDocument(documentModel.path);
  }
  state.storyWorkspace.view = documentModel?.sourceKind || (isStorySourceFile() ? "dsl" : "json");
  setViewMode(state.storyWorkspace.view);
  renderStoryView();
  selectStorySegment(node.id);
}

async function openDataFile(path, options = {}) {
  if (!(await confirmDiscardChanges())) {
    return;
  }

  rememberCurrentDataDocumentContext();

  const [file] = await Promise.all([
    requestJson(`/api/data/file?path=${encodeURIComponent(path)}`),
    options.initializeEditor === false ? Promise.resolve(false) : initializeMonacoEditor(),
    ensureAssetFilesLoaded(),
  ]);
  state.currentPath = file.path;
  state.selectedRecordIndex = restoreDataDocumentSelection(state.dataDocumentContexts, file.path);
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
    state.records = [];
    state.recordsPath = "";
    state.storySource.path = file.path;
    state.storySource.text = file.content;
    state.storySource.kind = "source";
    setViewMode("dsl");
    updateStoryDslAnalysis({ showSuccess: true });
  } else if (isStoryJsonFile(file.path)) {
    state.records = [];
    state.recordsPath = "";
    const storyDsl = window.StoryDsl.decompileStoryJson(parseJsonText(file.content));
    state.storySource = {
      path: file.path,
      text: storyDsl,
      jsonText: file.content,
      diagnostics: [],
      kind: "json",
    };
    setEditorValue(file.content);
    setViewMode("json");
    showValidation(true, "Story JSON 已载入；JSON 是当前文档的可写源。");
  } else {
    state.storySource = {
      path: "",
      text: "",
      jsonText: "",
      diagnostics: [],
      kind: "",
    };
    state.viewMode = "json";
    refreshRecordsFromEditor();
    showValidation(true, "完整 JSON 已载入。");
  }
  updateSearchMatches();
  renderEditorOutline();
  renderIndexPanel();
  renderSelectionLookup();
  renderDirtyState();
  renderCursorState();
  renderFileList();
  renderProblemIndicators();
  return true;
}

function openAssetFile(path) {
  rememberCurrentDataDocumentContext();
  state.currentPath = path;
  state.records = [];
  state.recordsPath = "";
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
  if (state.mode === "achievements") {
    await saveAchievementWorkspace();
    return;
  }
  if (state.mode === "martial") {
    await saveMartialWorkspace();
    return;
  }
  if (state.mode === "characters" || (isCharacterFile() && state.characterWorkspace.biographyDrafts.size > 0)) {
    await saveCharacterWorkspace();
    return;
  }
  if (!state.currentPath || (state.mode !== "data" && state.mode !== "story" && state.mode !== "characters" && state.mode !== "maps" && state.mode !== "growth" && state.mode !== "sects" && state.mode !== "items" && state.mode !== "shops" && state.mode !== "battles" && state.mode !== "talents")) {
    showValidation(false, "请选择可保存的数据工作区。");
    return;
  }
  if (state.mode === "story" && !isStorySourceFile() && !isStoryJsonFile()) {
    showValidation(false, "请选择可保存的剧情文档。");
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
    refreshRecordsFromEditor();
    if (state.mode === "maps") initializeMapHistory(state.records);
    renderDirtyState();
    renderCursorState();
    elements.saveState.textContent = result.backupPath
      ? `已保存，备份：${result.backupPath}`
      : "已保存";
    showValidation(result.validation.ok, result.validation.message);
    await loadDataFiles();
    await rebuildContentIndex();
    renderFileList();
    if (state.mode === "story") renderStoryView();
    if (state.mode === "characters") {
      renderCharacterWorkspaceView();
    } else if (state.mode === "maps") {
      renderMapWorkspaceView();
    } else if (state.mode === "growth") {
      renderGrowthWorkspaceView();
    } else if (state.mode === "sects") {
      renderSectWorkspaceView();
    } else if (state.mode === "items") {
      renderItemWorkspaceView();
    } else if (state.mode === "shops") {
      renderShopWorkspaceView();
    } else if (state.mode === "battles") {
      renderBattleWorkspaceView();
    } else if (state.mode === "talents") {
      renderTalentWorkspaceView();
    }
  } catch (error) {
    showValidation(false, error instanceof SyntaxError ? formatJsonError(error) : error.message);
  } finally {
    elements.saveButton.disabled = false;
  }
}

async function saveAchievementWorkspace() {
  const workspace = state.achievementWorkspace;
  elements.saveButton.disabled = true;
  try {
    const result = await requestJson("/api/story-systems", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resourcesContent: `${JSON.stringify(workspace.resources, null, 2)}\n`,
        worldTriggersContent: `${JSON.stringify(workspace.worldTriggers, null, 2)}\n`,
      }),
    });
    workspace.resources = parseJsonText(result.resourcesContent);
    workspace.worldTriggers = parseJsonText(result.worldTriggersContent);
    dirtyStateController.markClean({ render: false });
    renderDirtyState();
    elements.saveState.textContent = result.backupPaths?.length
      ? `已保存成就与世界触发器，备份 ${result.backupPaths.length} 个文件`
      : "已保存成就与世界触发器";
    showValidation(result.validation.ok, result.validation.message);
    await loadDataFiles();
    await rebuildContentIndex();
    workspace.sourcesById = state.contentIndex.achievementSourcesById || new Map();
    renderFileList();
    renderAchievementWorkspaceView();
  } catch (error) {
    showValidation(false, error instanceof Error ? error.message : String(error));
  } finally {
    elements.saveButton.disabled = false;
  }
}

async function saveCharacterWorkspace() {
  elements.saveButton.disabled = true;
  try {
    const content = getEditorValue();
    const records = parseJsonText(content);
    if (!Array.isArray(records) || !records.every((record) => record && typeof record === "object" && !Array.isArray(record))) {
      throw new Error("characters.json 顶层必须是角色对象数组。");
    }
    const result = await requestJson("/api/characters", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        biographies: [...state.characterWorkspace.biographyDrafts].map(([id, value]) => ({ id, value })),
      }),
    });

    setEditorValue(result.content);
    state.characterWorkspace.biographyDrafts.clear();
    dirtyStateController.markClean({ render: false });
    refreshRecordsFromEditor();
    renderDirtyState();
    renderCursorState();
    elements.saveState.textContent = result.backupPaths?.length
      ? `已保存 characters.json 与列传资源，备份 ${result.backupPaths.length} 个文件`
      : "已保存 characters.json 与列传资源";
    showValidation(result.validation.ok, result.validation.message);
    await loadDataFiles();
    await rebuildContentIndex();
    renderFileList();
    if (state.mode === "characters") renderCharacterWorkspaceView();
  } catch (error) {
    showValidation(false, error instanceof SyntaxError ? formatJsonError(error) : error.message);
  } finally {
    elements.saveButton.disabled = false;
  }
}

async function saveMartialWorkspace() {
  const workspace = state.martialArtsWorkspace;
  const kinds = martialKinds.map(([kind]) => kind).filter((kind) => workspace.dirtyKinds.has(kind));
  if (!kinds.length) {
    showValidation(true, "武学区没有需要保存的修改。");
    return;
  }
  elements.saveButton.disabled = true;
  const saved = [];
  let validation = null;
  try {
    for (const kind of kinds) {
      const path = getMartialPath(kind);
      const content = `${JSON.stringify(workspace.documents[kind], null, 2)}\n`;
      const result = await requestJson("/api/data/file", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content }),
      });
      validation = result.validation;
      const records = parseJsonText(result.content);
      records.forEach((record) => ensureMartialShape(kind, record));
      workspace.documents[kind] = records;
      workspace.baselines[kind] = JSON.stringify(records);
      workspace.dirtyKinds.delete(kind);
      saved.push(path);
    }
    dirtyStateController.markClean({ render: false });
    elements.saveState.textContent = `已保存 ${saved.length} 个武学文件`;
    await loadDataFiles();
    await rebuildContentIndex();
    await loadStoryGraph();
    showValidation(validation?.ok ?? true, validation?.message || `已保存：${saved.join("、")}`);
    renderMartialWorkspaceView();
    renderDirtyState();
  } catch (error) {
    markMartialChanged();
    showValidation(false, `${saved.length ? `已保存 ${saved.join("、")}；` : ""}${error instanceof Error ? error.message : String(error)}`);
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
    if (state.mode === "story") renderStoryView();
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

  if (isStorySourceFile()) {
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
    refreshRecordsFromEditor();
    updateSearchMatches();
    renderEditorOutline();
    renderDirtyState();
    renderCursorState();
  } catch (error) {
    showValidation(false, formatJsonError(error));
  }
}

async function saveCurrentStoryJsonDsl() {
  if (state.viewMode !== "json") setViewMode("json");
  const content = getEditorValue();
  try {
    parseJsonText(content);
  } catch (error) {
    showValidation(false, formatJsonError(error));
    return;
  }

  elements.saveButton.disabled = true;
  try {
    const result = await requestJson("/api/data/file", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: state.currentPath,
        content,
      }),
    });

    state.storySource.jsonText = result.content;
    state.storySource.text = window.StoryDsl.decompileStoryJson(parseJsonText(result.content));
    setEditorValue(result.content);
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
    if (state.mode === "story") renderStoryView();
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

  if (state.viewMode !== "json") setViewMode("json");
  let sourceText;
  let compiledJson;
  let preflight;
  try {
    const json = parseJsonText(getEditorValue());
    sourceText = window.StoryDsl.decompileStoryJson(json);
    const analysis = window.StoryDsl.analyzeStory(sourceText);
    if (!analysis.jsonText) {
      throw new Error("反编译后的 DSL 无法重新编译，已阻止转换。");
    }
    compiledJson = analysis.jsonText;
    preflight = findJsonDifferences(json, parseJsonText(compiledJson));
  } catch (error) {
    showValidation(false, error instanceof SyntaxError ? formatJsonError(error) : error.message);
    return;
  }

  const saveInfo = getStorySourceSaveInfo();
  if (!preflight.equal) {
    await showStorySourceConversionBlocked(saveInfo, preflight);
    showValidation(false, `DSL 无法无损表达当前 JSON，发现 ${preflight.total} 处结构差异，未创建源文件。`);
    return;
  }
  if (!(await confirmSaveStorySource(saveInfo, preflight))) {
    elements.saveState.textContent = "已取消另存为 Story";
    return;
  }

  elements.saveStorySourceButton.disabled = true;
  elements.saveButton.disabled = true;
  try {
    const result = await requestJson("/api/story/source/from-json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonPath: state.currentPath,
        content: sourceText,
        compiledJson,
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
    state.storyWorkspace.selectedDocumentPath = result.path;
    state.storyWorkspace.view = "dsl";
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
    if (state.mode === "story") renderStoryView();
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

function confirmSaveStorySource(info, preflight) {
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
    note.className = "static-tool-note story-source-preflight-ok";
    note.textContent = `无损预检通过：JSON → DSL → JSON 的结构和值完全一致。确认后会创建 .story；如果同名文件已存在，后端会拒绝写入。`;

    const details = document.createElement("dl");
    details.className = "story-source-confirm-list";
    appendConfirmDetail(details, "当前 JSON", info.jsonPath);
    appendConfirmDetail(details, "目标文件", info.sourcePath);
    appendConfirmDetail(details, "保存位置", info.absoluteSourcePath);
    appendConfirmDetail(details, "同步写回", info.absoluteJsonPath);
    appendConfirmDetail(details, "无损预检", preflight?.equal ? "通过" : "未执行");

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

function showStorySourceConversionBlocked(info, preflight) {
  return new Promise((resolve) => {
    closeToolDialog();
    const overlay = document.createElement("div");
    overlay.className = "tool-dialog-overlay";
    const close = () => {
      document.removeEventListener("keydown", handleKeydown);
      overlay.remove();
      resolve();
    };
    function handleKeydown(event) {
      if (event.key === "Escape") close();
    }
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close();
    });
    document.addEventListener("keydown", handleKeydown);

    const dialog = document.createElement("div");
    dialog.className = "tool-dialog story-source-confirm-dialog";
    const header = document.createElement("div");
    header.className = "tool-dialog-header";
    const titleGroup = document.createElement("div");
    const title = document.createElement("div");
    title.className = "tool-dialog-title";
    title.textContent = "无法无损转换为 DSL";
    const subtitle = document.createElement("div");
    subtitle.className = "tool-dialog-subtitle";
    subtitle.textContent = "当前 JSON 含有 DSL 不能完整表达的结构或值，因此不会创建或覆盖任何文件。";
    titleGroup.append(title, subtitle);
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.textContent = "关闭";
    closeButton.addEventListener("click", close);
    header.append(titleGroup, closeButton);

    const content = document.createElement("div");
    content.className = "tool-dialog-content story-source-confirm";
    const note = document.createElement("div");
    note.className = "static-tool-note story-source-preflight-blocked";
    note.textContent = `发现 ${preflight.total} 处差异。请继续使用 JSON 作为权威源，或先手动改写这些字段。`;
    const path = document.createElement("code");
    path.className = "story-source-blocked-path";
    path.textContent = info.jsonPath;
    const list = document.createElement("div");
    list.className = "story-source-difference-list";
    for (const difference of preflight.differences) {
      const row = document.createElement("div");
      row.className = "story-source-difference";
      const differencePath = document.createElement("code");
      differencePath.textContent = difference.path;
      const values = document.createElement("div");
      values.textContent = `原值 ${formatStoryDifferenceValue(difference.original)} · 转换后 ${formatStoryDifferenceValue(difference.roundTripped)}`;
      row.append(differencePath, values);
      list.appendChild(row);
    }
    if (preflight.truncated) {
      const more = document.createElement("div");
      more.className = "story-source-difference-more";
      more.textContent = `另有 ${preflight.total - preflight.differences.length} 处差异未展开。`;
      list.appendChild(more);
    }
    const actions = document.createElement("div");
    actions.className = "tool-dialog-actions";
    const acknowledge = document.createElement("button");
    acknowledge.type = "button";
    acknowledge.className = "primary";
    acknowledge.textContent = "知道了";
    acknowledge.addEventListener("click", close);
    actions.appendChild(acknowledge);
    content.append(note, path, list, actions);
    dialog.append(header, content);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    acknowledge.focus();
  });
}

function formatStoryDifferenceValue(value) {
  if (value === undefined) return "<缺失>";
  const text = JSON.stringify(value);
  if (text === undefined) return String(value);
  return text.length > 90 ? `${text.slice(0, 87)}...` : text;
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
    projectProblemsCache = null;
    showValidation(result.ok, result.message);
  } catch (error) {
    state.problemCenter.validation = { ok: false, message: error.message };
    projectProblemsCache = null;
    showValidation(false, error.message);
  } finally {
    renderProblemIndicators();
  }
}

function renderDirtyState() {
  const path = state.dirtyPath || state.currentPath || "当前文件";
  elements.dirtyState.textContent = state.dirty ? `${path} 未保存` : "";
  elements.dirtyState.title = state.dirtyDetail || "";
  renderMapHistoryControls();
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
    const documents = buildStoryDocuments(state.dataFiles, state.storyGraph);
    const documentModel = documents.find((item) => item.path === state.storyWorkspace.selectedDocumentPath);
    if (!documentModel) {
      return {
        summary: "剧情与任务 · 暂无剧情文档",
        rows: [["工作区", "剧情与任务"]],
      };
    }

    return {
      summary: `${documentModel.title} · ${documentModel.sourceKind.toUpperCase()} 源 · ${documentModel.segments.length} 段`,
      rows: [
        ["可写源", documentModel.sourceKind.toUpperCase()],
        ["当前视图", state.storyWorkspace.view === "flow" ? "流程" : state.storyWorkspace.view.toUpperCase()],
        ["剧情段", String(documentModel.segments.length)],
        ["问题", String(documentModel.diagnosticCount)],
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
    ...validateStoryRuntimeContract(baseAnalysis.ast, state.contentContract?.story, {
      hasReference: hasStoryRuntimeReference,
      knownVariables: state.contentIndex.storyVariableNames,
    }),
  ];
  const hasErrors = diagnostics.some((item) => item.severity === "error");
  const analysis = {
    ...baseAnalysis,
    diagnostics,
    jsonText: hasErrors ? null : baseAnalysis.jsonText,
  };
  state.storySource.diagnostics = diagnostics;
  state.storySource.jsonText = analysis.jsonText || "";
  projectProblemsCache = null;
  setMonacoDiagnostics(state.viewMode === "dsl" ? diagnostics : []);
  renderStoryDslStatus();
  scheduleProblemIndicators();

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
        break;
      case "choice":
        for (const group of statement.groups || []) {
          for (const option of group.options || []) {
            analyzeStoryDslStatements(option.statements, diagnostics, knownStorySegmentIds);
          }
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
    case "nick":
      for (const value of getStoryDslLiteralArgValues(firstArg)) {
        const resource = state.contentIndex.resourcesById.get(`nick.${value}`);
        addMissingReferenceDiagnostic(
          diagnostics,
          resource?.group === "nick",
          `nick 引用的成就不存在：${value}`,
          statement.span);
      }
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

function hasStoryRuntimeReference(type, value) {
  const normalized = String(value || "").trim();
  if (!normalized) return false;
  if (type === "resources") {
    return state.contentIndex.resourcesById.has(normalized);
  }
  if (type.startsWith("resource:")) {
    return (state.contentIndex.resourcesByGroup.get(type.slice("resource:".length)) || [])
      .some((resource) => resource.id === normalized);
  }
  if (type === "achievements") {
    return state.contentIndex.resourcesById.get(`nick.${normalized}`)?.group === "nick";
  }
  if (type === "characters") {
    return state.contentIndex.charactersByIdOrName.has(normalized);
  }
  if (type === "skills") {
    return ["external-skills", "internal-skills", "special-skills", "talents"]
      .some((definitionType) => hasDefinitionOfType(normalized, definitionType));
  }
  return hasDefinitionOfType(normalized, type);
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
    const dslIsSource = state.storySource.kind === "source";
    if (mode === "json") {
      if (dslIsSource) {
        const analysis = updateStoryDslAnalysis({ showSuccess: false });
        if (!analysis.jsonText) {
          showValidation(false, "Story DSL 存在错误，无法预览 JSON。");
          mode = "dsl";
        } else {
          state.storySource.text = state.viewMode === "dsl" ? getEditorValue() : state.storySource.text;
          state.storySource.jsonText = analysis.jsonText;
        }
      } else if (state.viewMode === "json") {
        state.storySource.jsonText = getEditorValue();
      }
      if (mode === "json") {
        setEditorValue(state.storySource.jsonText);
        setEditorReadOnly(dslIsSource);
        setEditorLanguage("json");
        resetEditorViewport();
      }
    }

    if (mode === "dsl") {
      if (!dslIsSource) {
        if (state.viewMode === "json") state.storySource.jsonText = getEditorValue();
        try {
          state.storySource.text = window.StoryDsl.decompileStoryJson(parseJsonText(state.storySource.jsonText));
        } catch (error) {
          showValidation(false, error instanceof SyntaxError ? formatJsonError(error) : error.message);
          mode = "json";
          setEditorValue(state.storySource.jsonText);
          setEditorReadOnly(false);
          setEditorLanguage("json");
        }
      }
      if (mode === "dsl") {
        setEditorValue(dslIsSource && state.viewMode !== "json" ? getEditorValue() : state.storySource.text);
        setEditorReadOnly(!dslIsSource);
        setEditorLanguage("storydsl");
        setMonacoDiagnostics(dslIsSource ? state.storySource.diagnostics : []);
        resetEditorViewport();
      }
    }

    state.viewMode = mode === "json" ? "json" : "dsl";
    elements.editorViewModes.classList.remove("hidden");
    elements.sourceModeButton.textContent = "DSL";
    elements.jsonModeButton.textContent = "JSON";
    elements.sourceModeButton.disabled = false;
    elements.jsonModeButton.disabled = false;
    elements.sourceModeButton.classList.toggle("active", state.viewMode === "dsl");
    elements.jsonModeButton.classList.toggle("active", state.viewMode === "json");
    setTextEditorVisible(true);
    if (dslIsSource) renderStoryDslStatus();
    updateSearchMatches();
    renderEditorOutline();
    renderCursorState();
    updateStorySourceButton();
    return;
  }

  mode = "json";
  state.viewMode = "json";
  elements.editorViewModes.classList.add("hidden");
  elements.saveStorySourceButton.classList.add("hidden");
  setTextEditorVisible(true);
  renderEditorOutline();
  updateStorySourceButton();
}

function refreshRecordsFromEditor() {
  try {
    const json = parseJsonText(getEditorValue());
    if (!Array.isArray(json) || !json.every((record) => record && typeof record === "object" && !Array.isArray(record))) {
      state.records = [];
      state.recordsPath = "";
      invalidateContentAnalysis();
      return false;
    }

    state.records = json;
    state.recordsPath = state.currentPath;
    invalidateContentAnalysis();
    state.selectedRecordIndex = Math.min(state.selectedRecordIndex, Math.max(0, state.records.length - 1));
    return true;
  } catch {
    state.records = [];
    state.recordsPath = "";
    invalidateContentAnalysis();
    return false;
  }
}

function rememberCurrentDataDocumentContext() {
  if (!state.currentPath || state.recordsPath !== state.currentPath) return;
  rememberDataDocumentSelection(state.dataDocumentContexts, state.currentPath, state.selectedRecordIndex);
}

 function isCharacterFile() {
  return state.currentPath === "characters.json";
}

function isMapFile() {
  return state.currentPath === "maps.json";
}

async function openMapWorkspace() {
  if (state.mode === "maps" && isMapFile() && state.records.length > 0) {
    renderMapWorkspaceView();
    return;
  }
  if (!state.dataFiles.some((file) => file.path === "maps.json")) {
    showValidation(false, "当前 MOD 缺少 maps.json。");
    return;
  }
  await openDataFile("maps.json", { initializeEditor: false });
  if (!isMapFile()) return;
  initializeMapHistory(state.records);
  setMode("maps");
}

function renderMapWorkspaceView(renderOptions = {}) {
  if (state.mode !== "maps") return;
  let shell = elements.mapWorkspaceView.firstElementChild;
  const createShell = !shell?.classList.contains("map-workspace-shell");
  if (createShell) {
    destroyActiveMapCanvas();
    disposeEmbeddedCodeEditors(elements.mapWorkspaceView);
    elements.mapWorkspaceView.replaceChildren();
    shell = document.createElement("div");
    shell.className = "map-workspace-shell";
    for (const [tag, className] of [["aside", "map-workspace-catalog"], ["main", "map-workspace-stage"], ["aside", "map-workspace-inspector"]]) {
      const panel = document.createElement(tag);
      panel.className = className;
      shell.appendChild(panel);
    }
    elements.mapWorkspaceView.appendChild(shell);
  }

  clampMapSelection();
  const catalog = shell.querySelector(".map-workspace-catalog");
  const stage = shell.querySelector(".map-workspace-stage");
  const inspector = shell.querySelector(".map-workspace-inspector");
  if (createShell || renderOptions.catalog !== false) {
    catalog.replaceChildren();
    renderMapWorkspaceCatalog(catalog);
  } else {
    for (const row of catalog.querySelectorAll(".map-workspace-map-row")) {
      row.classList.toggle("active", Number(row.dataset.recordIndex) === state.selectedRecordIndex);
    }
  }
  const record = state.records[state.selectedRecordIndex];
  if (!record) {
    destroyActiveMapCanvas();
    stage.replaceChildren();
    inspector.replaceChildren();
    const empty = document.createElement("div");
    empty.className = "map-workspace-empty";
    empty.innerHTML = "<strong>还没有地图</strong><span>新建第一张地图后即可布置点位与事件。</span>";
    stage.appendChild(empty);
    const create = createActionButton("新建地图", addMapRecord);
    create.classList.add("primary");
    inspector.appendChild(create);
    return;
  }

  if (createShell || renderOptions.stage !== false) {
    destroyActiveMapCanvas();
    stage.replaceChildren();
    renderMapWorkspaceStage(stage, record);
  } else {
    activeMapCanvasController?.setMode(state.mapEditor.canvasMode);
    activeMapCanvasController?.setSelection(state.mapEditor.selectedLocationIndex);
    for (const chip of stage.querySelectorAll(".map-workspace-location-chip")) {
      chip.classList.toggle("active", Number(chip.dataset.locationIndex) === state.mapEditor.selectedLocationIndex);
    }
  }
  if (createShell || renderOptions.inspector !== false) {
    disposeEmbeddedCodeEditors(inspector);
    inspector.replaceChildren();
    renderMapWorkspaceInspector(inspector, record);
  }
  renderMapResourcePicker();
}

function renderMapWorkspaceCatalog(parent) {
  const header = document.createElement("header");
  header.className = "map-workspace-catalog-header";
  const copy = document.createElement("div");
  copy.innerHTML = `<strong>地图</strong><small>${state.records.length} 张地图</small>`;
  header.append(copy, createActionButton("新建", addMapRecord));

  const search = document.createElement("input");
  search.type = "search";
  search.className = "map-workspace-search";
  search.placeholder = "搜索地图、点位或事件目标";
  search.value = state.mapEditor.search;
  bindImeSafeInput(search, (value) => {
    state.mapEditor.search = value;
    rerenderSearchResults(search, renderMapWorkspaceView,
      () => elements.mapWorkspaceView.querySelector(".map-workspace-search"), "maps:list");
  });

  const filter = document.createElement("select");
  filter.className = "map-workspace-filter";
  for (const item of MAP_FILTERS) {
    const option = document.createElement("option");
    option.value = item.value;
    option.textContent = item.label;
    option.selected = state.mapEditor.filter === item.value;
    filter.appendChild(option);
  }
  filter.addEventListener("change", () => {
    state.mapEditor.filter = filter.value;
    renderMapWorkspaceView();
  });

  const list = document.createElement("div");
  list.className = "map-workspace-map-list";
  const query = state.mapEditor.search.trim().toLowerCase();
  let visibleCount = 0;
  state.records.forEach((record, index) => {
    if (!matchesMapSearch(record, query) || !matchesMapFilter(record, state.mapEditor.filter)) return;
    visibleCount += 1;
    const stats = getMapStats(record);
    const row = document.createElement("button");
    row.type = "button";
    row.className = "map-workspace-map-row";
    row.dataset.recordIndex = String(index);
    row.classList.toggle("active", index === state.selectedRecordIndex);
    row.addEventListener("click", () => {
      state.selectedRecordIndex = index;
      state.mapEditor.selectedLocationIndex = 0;
      state.mapEditor.locationSearch = "";
      state.mapEditor.canvasMode = "select";
      state.mapEditor.tab = "locations";
      rememberMapHistorySelection();
      renderMapWorkspaceView({ catalog: false });
    });
    const thumb = createRecordThumb(record);
    thumb.classList.add("map-workspace-map-thumb");
    const body = document.createElement("span");
    body.className = "map-workspace-map-copy";
    const title = document.createElement("strong");
    title.textContent = record.name || record.id || "未命名地图";
    const id = document.createElement("code");
    id.textContent = record.id || "缺少 ID";
    const meta = document.createElement("small");
    meta.textContent = `${isLargeMap(record) ? "大地图" : "小地图"} · ${stats.locations} 点位 · ${stats.events} 事件`;
    body.append(title, id, meta);
    const status = document.createElement("span");
    status.className = `map-workspace-map-status ${stats.issues.length ? "warn" : "ok"}`;
    status.textContent = stats.issues.length ? String(stats.issues.length) : "✓";
    row.append(thumb, body, status);
    list.appendChild(row);
  });
  if (!visibleCount) {
    const empty = document.createElement("div");
    empty.className = "map-workspace-empty compact";
    empty.textContent = "没有匹配的地图";
    list.appendChild(empty);
  }
  bindScrollMemory(list, state.workspaceScrollPositions, "maps:list");
  parent.append(header, search, filter, list);
}

function renderMapWorkspaceStage(parent, record) {
  const stats = getMapStats(record);
  const header = document.createElement("header");
  header.className = "map-workspace-stage-header";
  const copy = document.createElement("div");
  const eyebrow = document.createElement("span");
  eyebrow.className = "map-workspace-eyebrow";
  eyebrow.textContent = isLargeMap(record) ? "大地图" : "小地图";
  const title = document.createElement("h2");
  title.textContent = record.name || record.id || "未命名地图";
  const id = document.createElement("code");
  id.textContent = record.id || "缺少 ID";
  copy.append(eyebrow, title, id);
  const actions = document.createElement("div");
  actions.className = "map-workspace-stage-actions";
  actions.append(createActionButton("复制", duplicateMapRecord), createActionButton("删除", deleteMapRecord));
  header.append(copy, actions);

  const metrics = document.createElement("div");
  metrics.className = "map-workspace-metrics";
  for (const [value, label, tone] of [
    [stats.locations, "点位", ""], [stats.events, "事件", ""], [stats.storyEvents, "剧情", ""],
    [stats.issues.length, "待处理", stats.issues.length ? "warn" : "ok"],
  ]) {
    const metric = document.createElement("div");
    metric.className = `map-workspace-metric ${tone}`;
    metric.innerHTML = `<strong>${value}</strong><small>${label}</small>`;
    metrics.appendChild(metric);
  }

  const canvasSection = document.createElement("section");
  canvasSection.className = "map-workspace-canvas-section";
  canvasSection.appendChild(isLargeMap(record) ? createLargeMapCanvas(record) : createSmallMapPreview(record));
  canvasSection.appendChild(createMapWorkspaceLocationRail(record));
  parent.append(header, metrics, canvasSection);
}

function createMapWorkspaceLocationRail(record) {
  const rail = document.createElement("div");
  rail.className = "map-workspace-location-rail";
  record.locations.forEach((location, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "map-workspace-location-chip";
    button.dataset.locationIndex = String(index);
    button.classList.toggle("active", index === state.mapEditor.selectedLocationIndex);
    const info = getMapLocationIconInfo(location, (location.events || [])[0] || null);
    button.append(createMapIconVisual(info, "", "map-workspace-location-icon"), document.createTextNode(location.name || location.id || `点位 ${index + 1}`));
    button.addEventListener("click", () => {
      selectMapLocation(index);
    });
    rail.appendChild(button);
  });
  if (!record.locations.length) {
    const empty = document.createElement("span");
    empty.className = "map-workspace-rail-empty";
    empty.textContent = "暂无点位";
    rail.appendChild(empty);
  }
  return rail;
}

function selectMapLocation(index, options = {}) {
  state.mapEditor.selectedLocationIndex = index;
  state.mapEditor.tab = "locations";
  state.mapEditor.canvasMode = "select";
  activeMapCanvasController?.setMode("select");
  activeMapCanvasController?.setSelection(index);
  rememberMapHistorySelection();
  renderMapWorkspaceView({ catalog: false, stage: false });
  if (options.focus !== false) activeMapCanvasController?.focusLocation(index);
}

function destroyActiveMapCanvas() {
  activeMapCanvasController?.destroy();
  activeMapCanvasController = null;
}

function renderMapWorkspaceInspector(parent, record) {
  const tabs = [
    ["locations", "点位与事件"],
    ["settings", "地图设置"],
    ["review", "检查与 JSON"],
  ];
  if (!tabs.some(([id]) => id === state.mapEditor.tab)) state.mapEditor.tab = "locations";
  const nav = document.createElement("div");
  nav.className = "map-workspace-tabs";
  for (const [id, label] of tabs) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "map-workspace-tab";
    button.classList.toggle("active", state.mapEditor.tab === id);
    button.textContent = label;
    button.addEventListener("click", () => {
      state.mapEditor.tab = id;
      renderMapWorkspaceView({ catalog: false, stage: false });
    });
    nav.appendChild(button);
  }
  const body = document.createElement("div");
  body.className = "map-workspace-inspector-body";
  if (state.mapEditor.tab === "settings") {
    body.appendChild(createMapBasicSection(record));
  } else if (state.mapEditor.tab === "review") {
    body.append(createMapIntro(getMapStats(record)), createMapAdvancedJsonSection(record));
  } else {
    body.appendChild(createMapLocationPanel(record));
  }
  parent.append(nav, body);
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

const MAP_CONDITION_CHOICES = mapConditionDefinitions;

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
    createMapIdField(record),
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

function createMapIdField(record) {
  const field = createCharacterFieldShell("地图ID", "id");
  const input = document.createElement("input");
  input.type = "text";
  input.value = record.id || "";
  input.readOnly = true;
  const actions = document.createElement("div");
  actions.className = "shop-resource-actions";
  const rename = createActionButton("重命名 ID", () => renameSelectedMap(record));
  actions.appendChild(rename);
  field.append(input, actions);
  return field;
}

function renameSelectedMap(record) {
  const oldId = String(record?.id || "").trim();
  const externalReferences = getExternalStaticReferences(oldId);
  if (externalReferences.length > 0) {
    showValidation(false, `无法自动重命名「${oldId}」：其他数据文件存在 ${externalReferences.length} 处静态引用。\n${formatStaticReferenceList(externalReferences)}`);
    return;
  }
  const nextId = window.prompt("新的地图 ID", oldId)?.trim() || "";
  if (!nextId || nextId === oldId) return;
  try {
    const viewport = state.mapEditor.viewports.get(oldId);
    const result = renameMapId(state.records, oldId, nextId);
    if (viewport) {
      state.mapEditor.viewports.delete(oldId);
      state.mapEditor.viewports.set(nextId, viewport);
    }
    syncRecordsToEditor();
    renderMapWorkspaceView();
    showValidation(true, `地图 ID 已更新为「${nextId}」，同步修改 ${result.updatedReferences} 处 maps.json 引用。`);
  } catch (error) {
    showValidation(false, error instanceof Error ? error.message : String(error));
  }
}

function getExternalStaticReferences(value) {
  return (state.contentIndex.referencesByValue?.get(String(value || "").trim()) || [])
    .filter((reference) => reference.path !== "maps.json");
}

function formatStaticReferenceList(references) {
  return references.slice(0, 6).map((reference) => `${reference.path} · ${reference.fieldPath}`).join("\n");
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
    syncRecordsToEditor();
    renderMapWorkspaceView();
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
    syncRecordsToEditor();
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
    syncRecordsToEditor();
  });
  input.addEventListener("change", () => renderMapWorkspaceView());
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
      syncRecordsToEditor();
    });
    input.addEventListener("change", () => renderMapWorkspaceView());
    const remove = createActionButton("删除", () => {
      record.musics.splice(index, 1);
      syncRecordsToEditor();
      renderMapWorkspaceView();
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
    syncRecordsToEditor();
    renderMapWorkspaceView();
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
  const modeButtons = new Map();
  let controller = null;
  for (const choice of [
    { value: "select", label: "选择" },
    { value: "add", label: "添加" },
    { value: "pan", label: "平移" },
  ]) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "map-canvas-mode-button";
    button.classList.toggle("active", state.mapEditor.canvasMode === choice.value);
    button.textContent = choice.label;
    button.addEventListener("click", () => {
      state.mapEditor.canvasMode = choice.value;
      controller?.setMode(choice.value);
      for (const [value, modeButton] of modeButtons) modeButton.classList.toggle("active", value === choice.value);
    });
    modeButtons.set(choice.value, button);
    modeActions.appendChild(button);
  }

  const fitButton = document.createElement("button");
  fitButton.type = "button";
  fitButton.className = "map-canvas-fit-button";
  fitButton.textContent = "适应视图";
  fitButton.addEventListener("click", () => controller?.fitView());
  modeActions.appendChild(fitButton);

  const tools = document.createElement("div");
  tools.className = "map-canvas-tools";
  const filter = document.createElement("input");
  filter.type = "search";
  filter.className = "map-canvas-filter";
  filter.placeholder = "筛选点位";
  filter.value = state.mapEditor.canvasSearch;
  filter.addEventListener("input", () => {
    state.mapEditor.canvasSearch = filter.value;
    controller?.setLocationFilter(filter.value);
  });

  const locate = document.createElement("select");
  locate.className = "map-canvas-locate";
  const locatePlaceholder = document.createElement("option");
  locatePlaceholder.value = "";
  locatePlaceholder.textContent = "快速定位";
  locate.appendChild(locatePlaceholder);
  record.locations.forEach((location, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = location.name || location.id || `点位 ${index + 1}`;
    locate.appendChild(option);
  });
  locate.addEventListener("change", () => {
    const index = Number(locate.value);
    if (Number.isInteger(index)) selectMapLocation(index);
    locate.value = "";
  });

  const labelToggle = document.createElement("label");
  labelToggle.className = "map-canvas-label-toggle";
  const labelCheckbox = document.createElement("input");
  labelCheckbox.type = "checkbox";
  labelCheckbox.checked = state.mapEditor.showLabels;
  labelCheckbox.addEventListener("change", () => {
    state.mapEditor.showLabels = labelCheckbox.checked;
    controller?.setLabelsVisible(labelCheckbox.checked);
  });
  labelToggle.append(labelCheckbox, document.createTextNode("标签"));
  tools.append(filter, locate, labelToggle);

  const legend = document.createElement("div");
  legend.className = "map-canvas-legend";
  legend.textContent = "800 × 600";
  toolbar.append(modeActions, tools, legend);

  const assetPath = resolveAssetPath(record.picture);
  const locations = record.locations.map((location, index) => {
    const iconInfo = getMapLocationIconInfo(location, (location.events || [])[0] || null);
    return {
      position: normalizeMapPosition(location.position),
      badge: index + 1,
      label: location.name || location.id || `点位 ${index + 1}`,
      searchText: [location.id, location.name, location.description].filter(Boolean).join(" "),
      status: iconInfo.status,
      iconUrl: iconInfo.previewPath && isImage(iconInfo.previewPath.toLowerCase())
        ? `/api/assets/file?path=${encodeURIComponent(iconInfo.previewPath)}`
        : "",
    };
  });

  controller = createMapCanvas({
    ariaLabel: `${record.name || record.id || "大地图"}点位画布`,
    mode: state.mapEditor.canvasMode,
    selectedIndex: state.mapEditor.selectedLocationIndex,
    showLabels: state.mapEditor.showLabels,
    initialViewState: state.mapEditor.viewports.get(record.id) || null,
    backgroundUrl: assetPath && isImage(assetPath.toLowerCase())
      ? `/api/assets/file?path=${encodeURIComponent(assetPath)}`
      : "",
    locations,
    onSelect: (index) => selectMapLocation(index, { focus: false }),
    onViewChange(viewState) {
      state.mapEditor.viewports.set(record.id, viewState);
    },
    onMove(index, position) {
      const location = record.locations[index];
      if (!location) return;
      location.position = position;
      state.mapEditor.selectedLocationIndex = index;
      syncRecordsToEditor();
      renderMapWorkspaceView({ catalog: false, stage: false });
    },
    onAdd(position) {
      const location = createMapLocationTemplate(record, `新地点${record.locations.length + 1}`);
      location.position = position;
      record.locations.push(location);
      state.mapEditor.selectedLocationIndex = record.locations.length - 1;
      state.mapEditor.canvasMode = "select";
      syncRecordsToEditor();
      renderMapWorkspaceView({ catalog: false });
    },
  });
  controller.setLocationFilter(state.mapEditor.canvasSearch);
  activeMapCanvasController = controller;

  wrap.append(toolbar, controller.element);
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
        selectMapLocation(index);
      });

      const iconInfo = getMapLocationIconInfo(location, (location.events || [])[0] || null);
      const icon = createMapIconVisual(iconInfo, String(index + 1), "map-location-list-icon");
      const content = document.createElement("div");
      content.className = "map-location-card-content";
      const name = document.createElement("div");
      name.className = "map-location-card-name";
      name.textContent = location.name || location.id || `点位 ${index + 1}`;
      const meta = document.createElement("div");
      meta.className = "record-subtitle";
      meta.textContent = `${(location.events || []).length} 事件${isLargeMap(record) ? ` · (${normalizeMapPosition(location.position).x}, ${normalizeMapPosition(location.position).y})` : ""}`;
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
    list.scrollTop = 0;
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
    syncRecordsToEditor();
  });
  if (options.rerenderOnChange) {
    input.addEventListener("change", () => renderMapWorkspaceView());
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
    syncRecordsToEditor();
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
    syncRecordsToEditor();
  });
  input.addEventListener("change", () => renderMapWorkspaceView());
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
      syncRecordsToEditor();
      renderMapWorkspaceView();
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
  const mapEvent = (location.events || [])[0] || null;
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
    syncRecordsToEditor();
  });
  input.addEventListener("change", () => renderMapWorkspaceView());
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
  const actions = document.createElement("div");
  actions.className = "record-actions";
  actions.append(createActionButton("新增事件", () => addMapEvent(location)));
  toolbar.append(note, actions);

  const list = document.createElement("div");
  list.className = "item-array-list map-event-list";
  const events = Array.isArray(location.events) ? location.events : [];
  events.forEach((event, eventIndex) => {
    list.appendChild(createMapEventCard(record, location, event, eventIndex));
  });
  if (events.length === 0) {
    const empty = document.createElement("div");
    empty.className = "record-empty";
    empty.textContent = "这个点位没有事件。小地图中没有事件的点位不会显示。";
    list.appendChild(empty);
  }

  section.append(toolbar, list);
  return section;
}

function createMapEventCard(record, location, mapEvent, eventIndex) {
  const info = getMapEventInfo(mapEvent);
  const locationIndex = record.locations.indexOf(location);
  const card = document.createElement("article");
  card.className = `item-array-card map-event-card ${info.severity}`;
  card.dataset.eventIndex = String(eventIndex);
  card.addEventListener("dragover", (event) => {
    if (!event.dataTransfer?.types.includes("application/x-jyxr-map-event")) return;
    event.preventDefault();
    card.classList.add("drag-over");
  });
  card.addEventListener("dragleave", () => card.classList.remove("drag-over"));
  card.addEventListener("drop", (event) => {
    card.classList.remove("drag-over");
    const payload = parseMapEventDragPayload(event.dataTransfer?.getData("application/x-jyxr-map-event"));
    if (!payload || payload.mapId !== record.id || payload.locationIndex !== locationIndex) return;
    event.preventDefault();
    moveMapEventToIndex(location, payload.eventIndex, eventIndex);
  });
  const header = document.createElement("div");
  header.className = "item-array-card-header";
  const title = document.createElement("div");
  title.className = "item-array-card-title";
  title.textContent = `${eventIndex + 1}. ${info.title}`;
  const actions = document.createElement("div");
  actions.className = "record-actions";
  actions.append(
    createMapEventDragHandle(record, locationIndex, eventIndex),
    createActionButton("上移", () => moveMapEvent(location, eventIndex, -1)),
    createActionButton("下移", () => moveMapEvent(location, eventIndex, 1)),
    createActionButton("复制", () => duplicateMapEvent(location, eventIndex)),
    createMapEventDestinationSelect(record, locationIndex, eventIndex),
    createActionButton("删除", () => deleteMapEvent(location, eventIndex)),
  );
  header.append(title, actions);

  const grid = document.createElement("div");
  grid.className = "item-array-grid map-event-grid";
  grid.append(
    createMapEventTypeField(mapEvent),
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
    createPill(`事件键 ${record.id || "?"}|${location.id || "?"}|${eventIndex}`),
    createPill(info.typeLabel),
    createPill(info.targetStatusText, info.targetStatusTone),
    createPill(mapEvent.repeatMode === "once" ? "一次性" : "可重复"),
    createPill(`概率 ${mapEvent.probability}%`)
  );

  card.append(
    header,
    meta,
    createMapEventIconSummary(location, mapEvent),
    createMapEventTargetField(record, mapEvent),
    grid,
    createMapConditionEditor(record, mapEvent),
  );
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
    if (mapEvent.type === "xiangzi") mapEvent.targetId = "";
    syncRecordsToEditor();
    renderMapWorkspaceView();
  });
  field.appendChild(select);
  return field;
}

function createMapEventTargetField(record, mapEvent) {
  const labels = {
    map: ["目标地图", "targetId"],
    story: ["剧情段", "targetId"],
    shop: ["商店", "targetId"],
    battle: ["战斗", "targetId"],
    xiangzi: ["储物箱", "targetId"],
  };
  const [label, key] = labels[mapEvent.type] || ["目标", "targetId"];
  const field = createCharacterFieldShell(label, key, true);
  field.classList.add("map-event-target-field");
  if (mapEvent.type === "xiangzi") {
    const summary = document.createElement("div");
    summary.className = "map-event-type-summary";
    summary.textContent = "使用当前游戏状态中的共享储物箱，不需要目标 ID。";
    field.appendChild(summary);
    return field;
  }

  const options = getMapEventTargetOptions(mapEvent.type);
  const picker = createReferencePicker({
    value: mapEvent.targetId || "",
    options,
    placeholder: getMapEventTargetPlaceholder(mapEvent.type),
    compact: true,
    showSelected: true,
    onSelect: (targetId) => {
      mapEvent.targetId = targetId;
      syncRecordsToEditor();
      renderMapWorkspaceView();
    },
  });
  field.appendChild(picker);

  const actions = document.createElement("div");
  actions.className = "record-actions map-event-target-actions";
  const clear = createActionButton("清空目标", () => {
    mapEvent.targetId = "";
    syncRecordsToEditor();
    renderMapWorkspaceView();
  });
  clear.disabled = !mapEvent.targetId;
  actions.appendChild(clear);
  if (mapEvent.type === "battle") {
    const targetExists = hasMapEventTarget("battle", String(mapEvent.targetId || "").trim());
    const open = createActionButton("打开战斗", async () => {
      const battleId = String(mapEvent.targetId || "").trim();
      await openBattleWorkspace();
      if (state.mode !== "battles") return;
      const index = state.records.findIndex((battle) => battle?.id === battleId);
      if (index >= 0) {
        state.selectedRecordIndex = index;
        state.battleWorkspace.tab = "deployment";
        state.battleWorkspace.selectedUnitKey = "";
        ensureSelectedBattleUnit();
        renderBattleWorkspaceView();
      }
    });
    open.disabled = !targetExists;
    const create = createActionButton(mapEvent.targetId && !targetExists ? "创建此战斗" : "新建战斗", async () => {
      const battleId = await createBattleForReference(targetExists ? "" : mapEvent.targetId);
      if (!battleId) return;
      mapEvent.targetId = battleId;
      syncRecordsToEditor();
      renderMapWorkspaceView();
    });
    actions.append(open, create);
  }
  field.appendChild(actions);
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
    syncRecordsToEditor();
    renderMapWorkspaceView();
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
    syncRecordsToEditor();
  });
  input.addEventListener("change", () => renderMapWorkspaceView());
  field.appendChild(input);
  return field;
}

function createMapConditionEditor(record, mapEvent) {
  const box = document.createElement("div");
  box.className = "map-condition-editor";
  const header = document.createElement("div");
  header.className = "shop-product-toolbar";
  const note = document.createElement("div");
  note.className = "static-tool-note";
  note.textContent = "条件全部满足后才会尝试触发这个事件。多个值用 # 分隔，例如 角色#10。";
  const add = createActionButton("添加条件", () => {
    if (!Array.isArray(mapEvent.conditions)) mapEvent.conditions = [];
    mapEvent.conditions.push({ type: "should_not_finish", value: "" });
    syncRecordsToEditor();
    renderMapWorkspaceView();
  });
  header.append(note, add);
  const list = document.createElement("div");
  list.className = "map-condition-list";
  const conditions = Array.isArray(mapEvent.conditions) ? mapEvent.conditions : [];
  conditions.forEach((condition, index) => {
    list.appendChild(createMapConditionRow(record, mapEvent, condition, index));
  });
  if (conditions.length === 0) {
    const empty = document.createElement("div");
    empty.className = "record-empty compact";
    empty.textContent = "无条件，始终可参与触发判断。";
    list.appendChild(empty);
  }
  box.append(header, list);
  return box;
}

function createMapConditionRow(record, mapEvent, condition, index) {
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
    if (condition.type === "always" || condition.type === "in_newbie_task") condition.value = "";
    syncRecordsToEditor();
    renderMapWorkspaceView();
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
    syncRecordsToEditor();
  });
  value.addEventListener("change", () => renderMapWorkspaceView());

  const remove = createActionButton("删除", () => {
    mapEvent.conditions.splice(index, 1);
    syncRecordsToEditor();
    renderMapWorkspaceView();
  });
  const valueIssue = getMapConditionValueIssue(condition);
  const references = getMapConditionReferenceDiagnostics(condition);
  const referenceIssue = references.find((reference) => !reference.exists);
  row.classList.toggle("has-issue", Boolean(valueIssue || referenceIssue));

  const detail = document.createElement("div");
  detail.className = "map-condition-detail";
  const meaning = document.createElement("span");
  meaning.className = "map-condition-meaning";
  meaning.textContent = describeMapCondition(condition);
  detail.appendChild(meaning);
  if (valueIssue) {
    const issue = document.createElement("span");
    issue.className = "map-condition-status warn";
    issue.textContent = valueIssue;
    detail.appendChild(issue);
  }
  for (const reference of references) {
    const status = document.createElement("span");
    status.className = `map-condition-status ${reference.exists ? "ok" : "warn"}`;
    status.textContent = `${reference.label}${reference.exists ? "存在" : "缺失"}：${reference.id}`;
    detail.appendChild(status);
    if (reference.exists) {
      const open = createActionButton("打开", () => revealMapConditionReference(reference));
      open.classList.add("map-condition-open");
      detail.appendChild(open);
    }
  }

  row.append(type, value, remove, detail);
  return row;
}

function getMapConditionReferenceDiagnostics(condition) {
  return getMapConditionReferences(condition).map((reference) => {
    if (reference.types.includes("map-events")) {
      const [mapId, locationId, eventIndexText, ...extra] = reference.id.split("|");
      const eventIndex = Number(eventIndexText);
      const targetMap = extra.length === 0 ? state.records.find((map) => map.id === mapId) : null;
      const targetLocationIndex = targetMap?.locations?.findIndex((location) => location.id === locationId) ?? -1;
      const targetLocation = targetLocationIndex >= 0 ? targetMap?.locations?.[targetLocationIndex] : null;
      return {
        ...reference,
        exists: Boolean(targetMap && targetLocation && Number.isInteger(eventIndex)
          && eventIndex >= 0 && eventIndex < (targetLocation.events || []).length),
        mapId,
        locationId,
        eventIndex,
        targetLocationIndex,
      };
    }

    if (reference.types.includes("characters")) {
      const character = state.contentIndex.charactersByIdOrName.get(reference.id);
      return {
        ...reference,
        exists: Boolean(character),
        definitionId: character?.id || reference.id,
      };
    }

    const exists = reference.types.some((type) => (
      type === "maps"
        ? state.records.some((map) => map.id === reference.id)
        : hasDefinition(type, reference.id)
    ));
    return { ...reference, exists, definitionId: reference.id };
  });
}

async function revealMapConditionReference(reference) {
  if (reference.types.includes("map-events")) {
    const mapIndex = state.records.findIndex((map) => map.id === reference.mapId);
    if (mapIndex < 0 || reference.targetLocationIndex < 0) return;
    state.selectedRecordIndex = mapIndex;
    state.mapEditor.selectedLocationIndex = reference.targetLocationIndex;
    state.mapEditor.tab = "locations";
    renderMapWorkspaceView();
    return;
  }
  if (reference.types.includes("maps")) {
    const mapIndex = state.records.findIndex((map) => map.id === reference.id);
    if (mapIndex < 0) return;
    state.selectedRecordIndex = mapIndex;
    state.mapEditor.selectedLocationIndex = 0;
    state.mapEditor.tab = "locations";
    renderMapWorkspaceView();
    return;
  }
  await revealDefinitionById(reference.definitionId || reference.id, reference.types);
}

function createMapAdvancedJsonSection(record) {
  const section = createCharacterSection("高级 JSON", "Advanced");
  const note = document.createElement("p");
  note.className = "static-tool-note";
  note.textContent = "用于编辑结构化控件尚未覆盖的字段。应用后会替换当前地图，未知字段会保留，仍需点击顶部“保存”写入 maps.json。";
  section.append(note, createEmbeddedJsonEditor({
    value: record,
    modelPath: `maps/${record.id || state.selectedRecordIndex}`,
    minHeight: 420,
    validate: (value) => {
      if (!value || Array.isArray(value) || typeof value !== "object") throw new Error("地图 JSON 必须是对象");
      if (!Array.isArray(value.locations)) throw new Error("locations 必须是数组");
    },
    onApply: (value) => {
      state.records[state.selectedRecordIndex] = value;
      clampMapSelection();
      syncRecordsToEditor();
      renderMapWorkspaceView();
    },
    onError: (error) => showValidation(false, error instanceof Error ? error.message : String(error)),
  }));
  return section;
}

function addMapLocation(record) {
  const location = createMapLocationTemplate(record, `新点位${record.locations.length + 1}`);
  record.locations.push(location);
  state.mapEditor.selectedLocationIndex = record.locations.length - 1;
  syncRecordsToEditor();
  renderMapWorkspaceView();
}

function addMapReturnLocation(record) {
  if (record.id === "大地图") {
    showValidation(false, "大地图没有默认返回目标，请使用“新增点位”并明确选择目标地图。");
    return;
  }
  const targetId = "大地图";
  const location = createMapLocationTemplate(record, "返回");
  location.description = "返回大地图";
  location.events = [
    createMapEventDefinition(record, location, {
      type: "map",
      targetId,
      probability: 100,
      description: location.description,
      conditions: [],
    }),
  ];
  record.locations.push(location);
  state.mapEditor.selectedLocationIndex = record.locations.length - 1;
  syncRecordsToEditor();
  renderMapWorkspaceView();
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
  const nextIndex = moveMapLocationEntry(record, index, delta);
  if (nextIndex === index) {
    return;
  }
  state.mapEditor.selectedLocationIndex = nextIndex;
  syncRecordsToEditor();
  renderMapWorkspaceView();
}

function duplicateMapLocation(record, index) {
  const location = record.locations[index];
  if (!location) {
    return;
  }
  const copy = structuredCloneCompat(location);
  copy.id = createUniqueLocationId(record, `${copy.id || "点位"}_复制`);
  copy.name = copy.name ? `${copy.name} 复制` : copy.id;
  copy.events = Array.isArray(copy.events) ? copy.events : [];
  record.locations.splice(index + 1, 0, copy);
  state.mapEditor.selectedLocationIndex = index + 1;
  syncRecordsToEditor();
  renderMapWorkspaceView();
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
  syncRecordsToEditor();
  renderMapWorkspaceView();
}

function addMapEvent(location) {
  const record = state.records[state.selectedRecordIndex];
  if (!Array.isArray(location.events)) location.events = [];
  location.events.push(createMapEventDefinition(record, location));
  syncRecordsToEditor();
  renderMapWorkspaceView();
}

function moveMapEvent(location, index, delta) {
  const nextIndex = index + delta;
  if (moveMapEventWithinLocation(location, index, nextIndex) === index) return;
  syncRecordsToEditor();
  renderMapWorkspaceView();
}

function moveMapEventToIndex(location, fromIndex, toIndex) {
  if (moveMapEventWithinLocation(location, fromIndex, toIndex) === fromIndex) return;
  syncRecordsToEditor();
  renderMapWorkspaceView();
}

function moveMapEventAcrossLocations(record, sourceLocationIndex, eventIndex, targetLocationIndex) {
  const result = moveMapEventToLocationEntry(record, sourceLocationIndex, eventIndex, targetLocationIndex);
  if (!result) return;
  state.mapEditor.selectedLocationIndex = targetLocationIndex;
  syncRecordsToEditor();
  renderMapWorkspaceView();
}

function createMapEventDragHandle(record, locationIndex, eventIndex) {
  const handle = document.createElement("button");
  handle.type = "button";
  handle.className = "map-event-drag-handle";
  handle.draggable = true;
  handle.textContent = "拖动";
  handle.title = "拖动调整事件优先级";
  handle.addEventListener("dragstart", (event) => {
    event.dataTransfer?.setData("application/x-jyxr-map-event", JSON.stringify({
      mapId: record.id,
      locationIndex,
      eventIndex,
    }));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
    handle.closest(".map-event-card")?.classList.add("dragging");
  });
  handle.addEventListener("dragend", () => {
    handle.closest(".map-event-card")?.classList.remove("dragging");
    document.querySelectorAll(".map-event-card.drag-over").forEach((card) => card.classList.remove("drag-over"));
  });
  return handle;
}

function createMapEventDestinationSelect(record, sourceLocationIndex, eventIndex) {
  const select = document.createElement("select");
  select.className = "map-event-destination";
  select.title = "移动到其他点位";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "移动到…";
  placeholder.selected = true;
  select.appendChild(placeholder);
  record.locations.forEach((location, index) => {
    if (index === sourceLocationIndex) return;
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = location.name || location.id || `点位 ${index + 1}`;
    select.appendChild(option);
  });
  select.disabled = record.locations.length <= 1;
  select.addEventListener("change", () => {
    const targetLocationIndex = Number(select.value);
    if (Number.isInteger(targetLocationIndex)) {
      moveMapEventAcrossLocations(record, sourceLocationIndex, eventIndex, targetLocationIndex);
    }
  });
  return select;
}

function parseMapEventDragPayload(value) {
  try {
    const payload = JSON.parse(String(value || ""));
    return typeof payload?.mapId === "string"
      && Number.isInteger(payload.locationIndex)
      && Number.isInteger(payload.eventIndex)
      ? payload
      : null;
  } catch {
    return null;
  }
}

function duplicateMapEvent(location, index) {
  const source = location.events[index];
  if (!source) {
    return;
  }
  const copy = structuredCloneCompat(source);
  location.events.splice(index + 1, 0, copy);
  syncRecordsToEditor();
  renderMapWorkspaceView();
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
  syncRecordsToEditor();
  renderMapWorkspaceView();
}

function clampMapSelection() {
  const record = state.records[state.selectedRecordIndex];
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
  if (String(record.id || "").includes("|")) {
    issues.push("地图 ID 不能包含 |。");
  }
  if (record.id && state.records.filter((candidate) => candidate?.id === record.id).length > 1) {
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
        if (!mapConditionTypes.includes(condition.type)) {
          issues.push(`点位「${locationName}」使用了未支持条件：${condition.type}`);
        } else {
          const conditionIssue = getMapConditionValueIssue(condition);
          if (conditionIssue) issues.push(`点位「${locationName}」条件「${condition.type}」${conditionIssue}`);
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
      return state.records.some((record) => record?.id === targetId) ||
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

function getMapEventTargetOptions(type) {
  const typeMap = {
    map: "maps",
    story: "story",
    shop: "shops",
    battle: "battles",
  };
  const definitionType = typeMap[type];
  if (!definitionType) return [];
  if (type === "map") {
    return (state.records || []).map((map) => ({
      id: map.id,
      name: map.name || map.id,
      typeLabel: map.kind === "large" ? "大地图" : "小地图",
      subtitle: `${(map.locations || []).length} 个点位`,
      description: map.description || "",
      searchText: [map.id, map.name, map.description, map.kind].filter(Boolean).join(" "),
    }));
  }
  const byId = new Map();
  for (const definition of getDefinitionsByType(definitionType)) {
    if (byId.has(definition.id)) continue;
    const definitionRecord = definition.record || {};
    const metadata = [];
    if (type === "shop") metadata.push(`${(definitionRecord.products || []).length} 件商品`);
    if (type === "battle") {
      const fixedEnemies = (definitionRecord.participants || []).filter((participant) => Number(participant?.team) !== 1).length;
      const randomEnemies = (definitionRecord.randomParticipants || []).filter((participant) => Number(participant?.team) !== 1).length;
      metadata.push(`${fixedEnemies + randomEnemies} 个敌方单位`);
    }
    byId.set(definition.id, {
      id: definition.id,
      name: definition.displayName || definition.id,
      typeLabel: type === "story" ? "剧情" : type === "shop" ? "商店" : "战斗",
      subtitle: definition.path || "",
      description: definitionRecord.description || "",
      metadata,
      searchText: [definition.id, definition.displayName, definition.path, definitionRecord.description].filter(Boolean).join(" "),
    });
  }
  return Array.from(byId.values());
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
    current_map: "maps",
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
    in_menpai: "sects",
    not_in_menpai: "sects",
    in_sect: "sects",
    not_in_sect: "sects",
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
  const definitions = getDefinitionsByType(targetType);
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
    silver_at_least: "非负整数",
    gold_at_least: "非负整数",
    friendCount: "队伍人数",
    current_map: "地图 id",
    event_completed: "地图id|点位id|事件序号（从0开始）",
    event_finished: "地图id|点位id|事件序号（从0开始）",
    event_not_completed: "地图id|点位id|事件序号（从0开始）",
    event_not_finished: "地图id|点位id|事件序号（从0开始）",
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
    time_slot: "子#丑#寅 或 Zi#Chou",
    not_in_time: "子#丑#寅 或 Zi#Chou",
    has_time_key: "限时 key",
    not_has_time_key: "限时 key",
    in_menpai: "门派 id",
    in_sect: "门派 id",
    not_in_menpai: "门派 id",
    not_in_sect: "门派 id",
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

function isBattleFile() {
  return state.currentPath === "battles.json";
}

function isGrowthFile() {
  return state.currentPath === "grow-templates.json";
}

function isSectFile() {
  return state.currentPath === "sects.json";
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

 function isItemFile() {
  return state.currentPath === "items.json";
}

function getItemPictureInfo(record) {
  const cached = itemPictureCache.get(record);
  if (cached?.revision === contentAnalysisRevision) return cached.value;
  const pictureId = typeof record.picture === "string" ? record.picture.trim() : "";
  const resource = pictureId ? state.contentIndex.resourcesById.get(pictureId) : null;
  const resourceExists = Boolean(resource);
  const assetValue = typeof resource?.value === "string" ? resource.value.trim() : "";
  const assetPath = resourceExists ? resolveResourceAssetPath(resource) : "";
  const detectedAssetValue = detectItemPictureAssetValue(record.id || "", record.name || "", pictureId);
  const detectedAssetPath = detectedAssetValue ? findAssetPath(detectedAssetValue, { art: true }) : "";
  const previewPath = assetPath || detectedAssetPath || "";

  const value = {
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
  itemPictureCache.set(record, { revision: contentAnalysisRevision, value });
  return value;
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

  const fallback = findAssetByBasename("item", candidates);
  return fallback ? normalizeToolAssetValue(fallback) : "";
}

function getItemValidationIssues(record) {
  const cached = itemIssueCache.get(record);
  if (cached?.revision === contentAnalysisRevision) return cached.value;
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

  if (typeof record.consumeOnUse !== "boolean") {
    issues.push(createCharacterIssue("error", "consumeOnUse 必须是布尔值。"));
  }

  if (!Array.isArray(record.tagIds)) {
    issues.push(createCharacterIssue("error", "tagIds 不是数组。"));
  } else {
    for (const tagId of record.tagIds) {
      if (typeof tagId !== "string" || !tagId.trim()) {
        issues.push(createCharacterIssue("error", "tagIds 包含空值或非文本值。"));
      } else if (!hasDefinitionOfType(tagId, "item-tags")) {
        issues.push(createCharacterIssue("error", `物品标签不存在：${tagId}`, tagId, ["item-tags"]));
      }
    }
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

  itemIssueCache.set(record, { revision: contentAnalysisRevision, value: issues });
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

    if (requirement?.type === "gender") {
      const genders = Array.isArray(requirement.genders) ? requirement.genders : [];
      const allowed = new Set(genderChoices.map(([value]) => value));
      if (!genders.length || genders.some((gender) => !allowed.has(gender))) {
        issues.push(createCharacterIssue("error", "性别要求 genders 必须包含至少一个有效性别。"));
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

    if (effectType === "set_gender") {
      if (!genderChoices.some(([value]) => value === effect.gender)) {
        issues.push(createCharacterIssue("error", `set_gender 的 gender 无效：${effect.gender || "空"}`));
      }
      continue;
    }

    if (effectType === "reduce_max_resource_ratio") {
      if (!["max_hp", "max_mp"].includes(effect.statId)) {
        issues.push(createCharacterIssue("error", `reduce_max_resource_ratio 的 statId 无效：${effect.statId || "空"}`));
      }
      if (!Number.isFinite(effect.ratio) || effect.ratio < 0 || effect.ratio > 1) {
        issues.push(createCharacterIssue("error", "reduce_max_resource_ratio 的 ratio 必须是 0 至 1 之间的数字。"));
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

    if (!effectTypes.some(([value]) => value === effectType)) {
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
        if (!statChoices.some(([value]) => value === affix.stat)) {
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
        if (!weaponTypes.some(([value]) => value === affix.weaponType)) {
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
  return characterStatFields.some(([key]) => key === statId);
}

function matchesCharacterFilter(record, filter, analysis = {}) {
  const classification = getCharacterUiClassification(record);

  switch (filter) {
    case "dialogue":
      return classification.key === "dialogue";
    case "joinable":
      return classification.key === "joinable" || classification.key === "partner";
    case "battle":
      return record.arenaEnabled === true;
    case "missingPortrait":
      return !analysis.portraitInfo?.resourceExists || !analysis.portraitInfo?.assetExists;
    case "incomplete":
      return (analysis.issues?.length || 0) > 0;
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
    input.addEventListener("change", () => renderMapWorkspaceView());
  }

  field.appendChild(input);
  return field;
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
  const cached = characterPortraitCache.get(record);
  if (cached?.revision === contentAnalysisRevision) return cached.value;
  const portraitId = typeof record.portrait === "string" ? record.portrait.trim() : "";
  const resource = portraitId ? state.contentIndex.resourcesById.get(portraitId) : null;
  const resourceExists = Boolean(resource);
  const assetValue = typeof resource?.value === "string" ? resource.value.trim() : "";
  const assetPath = resourceExists ? resolveResourceAssetPath(resource) : "";
  const detectedAssetValue = detectSpeakerPortraitAssetValue(record.id || "", record.name || "");
  const detectedAssetPath = detectedAssetValue ? findAssetPath(detectedAssetValue, { art: true }) : "";
  const previewPath = assetPath || detectedAssetPath || "";

  const value = {
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
  characterPortraitCache.set(record, { revision: contentAnalysisRevision, value });
  return value;
}

function getCharacterValidationIssues(record) {
  const cached = characterIssueCache.get(record);
  if (cached?.revision === contentAnalysisRevision) return cached.value;
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

  for (const [key, label] of characterStatFields) {
    if (!Number.isFinite(stats[key])) {
      issues.push(createCharacterIssue("error", `数值字段不是数字：${label} ${key}`));
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

  characterIssueCache.set(record, { revision: contentAnalysisRevision, value: issues });
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

 function createActionButton(label, action) {
  return createButton({ label, onClick: action });
}

 function updateRecordField(record, key, value, options = {}) {
  record[key] = value;
  syncRecordsToEditor();
  if (!options.rerender) return;

  if (state.mode === "characters") renderCharacterWorkspaceView();
  else if (state.mode === "maps") renderMapWorkspaceView();
  else if (state.mode === "growth") renderGrowthWorkspaceView();
  else if (state.mode === "sects") renderSectWorkspaceView();
  else if (state.mode === "items") renderItemWorkspaceView();
  else if (state.mode === "shops") renderShopWorkspaceView();
  else if (state.mode === "battles") renderBattleWorkspaceView();
}

function addMapRecord() {
  const record = createMapDefinition(createUniqueId("新地图"));
  const insertionIndex = state.records.length === 0
    ? 0
    : Math.min(state.selectedRecordIndex + 1, state.records.length);
  state.records.splice(insertionIndex, 0, record);
  state.selectedRecordIndex = insertionIndex;
  syncRecordsToEditor();
  renderMapWorkspaceView();
}

function duplicateMapRecord() {
  const current = state.records[state.selectedRecordIndex];
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

  state.records.splice(state.selectedRecordIndex + 1, 0, record);
  state.selectedRecordIndex += 1;
  syncRecordsToEditor();
  renderMapWorkspaceView();
}

function deleteMapRecord() {
  if (state.records.length === 0) {
    return;
  }

  const current = state.records[state.selectedRecordIndex];
  const title = current ? getRecordTitle(current, state.selectedRecordIndex) : "当前条目";
  const internalReferences = findMapReferences(state.records, current?.id)
    .filter((reference) => reference.mapId !== current?.id);
  const externalReferences = getExternalStaticReferences(current?.id);
  if (internalReferences.length > 0 || externalReferences.length > 0) {
    const internal = internalReferences.slice(0, 6)
      .map((reference) => `maps.json · ${reference.eventKey}`);
    const external = externalReferences.slice(0, 6)
      .map((reference) => `${reference.path} · ${reference.fieldPath}`);
    showValidation(false, `无法删除「${title}」：仍有 ${internalReferences.length + externalReferences.length} 处引用。\n${[...internal, ...external].join("\n")}`);
    return;
  }
  if (!confirmAction(`确认删除「${title}」？`)) {
    return;
  }

  state.records.splice(state.selectedRecordIndex, 1);
  state.selectedRecordIndex = Math.max(0, Math.min(state.selectedRecordIndex, state.records.length - 1));
  syncRecordsToEditor();
  renderMapWorkspaceView();
}

function createUniqueId(baseId) {
  const existing = new Set(
    state.records
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

function serializeRecords(records = state.records) {
  return `${JSON.stringify(records, null, 2)}\n`;
}

function createMapHistorySnapshot() {
  const record = state.records[state.selectedRecordIndex] || null;
  const location = record?.locations?.[state.mapEditor.selectedLocationIndex] || null;
  return {
    records: state.records,
    selectedMapId: String(record?.id || ""),
    selectedLocationId: String(location?.id || ""),
  };
}

function rememberMapHistorySelection() {
  if (state.mode === "maps" && !applyingMapHistory) {
    mapHistory.replaceCurrent(createMapHistorySnapshot());
  }
}

function initializeMapHistory(savedRecords = state.records) {
  mapSavedContent = serializeRecords(savedRecords);
  const currentContent = serializeRecords();
  setEditorValue(currentContent);
  mapHistory.reset(createMapHistorySnapshot());
  dirtyStateController.setDirty(currentContent !== mapSavedContent, { render: false });
  renderMapHistoryControls();
}

function undoMapEdit() {
  applyMapHistorySnapshot(mapHistory.undo());
}

function redoMapEdit() {
  applyMapHistorySnapshot(mapHistory.redo());
}

function applyMapHistorySnapshot(snapshot) {
  if (!snapshot || state.mode !== "maps") return;
  applyingMapHistory = true;
  try {
    state.records = snapshot.records;
    state.selectedRecordIndex = Math.max(0, state.records.findIndex((record) => record?.id === snapshot.selectedMapId));
    const record = state.records[state.selectedRecordIndex];
    const locationIndex = (record?.locations || []).findIndex((location) => location?.id === snapshot.selectedLocationId);
    state.mapEditor.selectedLocationIndex = Math.max(0, locationIndex);
    const content = serializeRecords();
    invalidateContentAnalysis();
    setEditorValue(content);
    dirtyStateController.setDirty(content !== mapSavedContent, { render: false });
    elements.saveState.textContent = state.dirty ? "结构化内容已修改，尚未保存" : "";
    renderDirtyState();
    scheduleProblemIndicators();
    renderMapWorkspaceView();
  } finally {
    applyingMapHistory = false;
    renderMapHistoryControls();
  }
}

function renderMapHistoryControls() {
  const available = state.mode === "maps";
  elements.undoButton.hidden = !available;
  elements.redoButton.hidden = !available;
  elements.undoButton.disabled = !available || !mapHistory.canUndo();
  elements.redoButton.disabled = !available || !mapHistory.canRedo();
}

function syncRecordsToEditor() {
  invalidateContentAnalysis();
  const content = serializeRecords();
  if (state.mode === "maps" && !applyingMapHistory) mapHistory.commit(createMapHistorySnapshot());
  setEditorValue(content);
  const dirtyOptions = {
    render: false,
    path: state.currentPath,
    detail: getStructuredDirtyDetail(),
  };
  if (state.mode === "maps") {
    dirtyStateController.setDirty(content !== mapSavedContent, dirtyOptions);
  } else {
    dirtyStateController.markDirty(dirtyOptions);
  }
  elements.saveState.textContent = state.dirty ? "结构化内容已修改，尚未保存" : "";
  if (state.mode === "data" || state.mode === "story") {
    updateSearchMatches();
    renderEditorOutline();
    renderCursorState();
    renderIndexPanel();
    renderCharacterCheckTool();
  }
  renderDirtyState();
  scheduleProblemIndicators();
}

function getStructuredDirtyDetail() {
  const record = state.records[state.selectedRecordIndex];
  if (!record) return "";
  const recordLabel = String(record.name || record.id || `第 ${state.selectedRecordIndex + 1} 项`);
  if (state.mode !== "maps") return recordLabel;
  const location = record.locations?.[state.mapEditor.selectedLocationIndex];
  const locationLabel = location ? String(location.name || location.id || `点位 ${state.mapEditor.selectedLocationIndex + 1}`) : "";
  return locationLabel ? `地图：${recordLabel} / 点位：${locationLabel}` : `地图：${recordLabel}`;
}

function getRecordTitle(record, index) {
  return String(record.name || record.id || record.text || `#${index + 1}`);
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

async function rebuildContentIndex() {
  const definitionsById = new Map();
  const fileSummaries = new Map();
  const parseErrors = [];
  const resourceValues = new Map();
  const resourcesById = new Map();
  const resourcesByGroup = new Map();
  const resourceRecords = [];
  const charactersByIdOrName = new Map();
  const itemsById = new Map();
  const storySpeakers = new Map();
  const referencesByValue = new Map();
  const battleReferencesById = new Map();
  const achievementSources = [];
  const storyVariableNames = new Set();

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
      const lineIndex = createJsonPropertyLineIndex(response.content);
      indexStaticStringReferences(referencesByValue, file.path, json);
      achievementSources.push(...collectAchievementUnlockSources(file.path, json));
      for (const reference of findBattleReferencesInContent(file.path, json)) {
        reference.line = lineIndex.find(reference.fieldPath.endsWith("battleId") ? "battleId" : "targetId", reference.value);
        const entries = battleReferencesById.get(reference.value) || [];
        entries.push(reference);
        battleReferencesById.set(reference.value, entries);
      }
      if (file.path === "resources.json" && Array.isArray(json)) {
        for (const resource of json) {
          resourceRecords.push(resource);
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
        collectStoryDeclaredVariablesFromJson(json, storyVariableNames);
        for (const speaker of ExtractStorySpeakers(file.path, response.content, json, lineIndex)) {
          storySpeakers.set(speaker.Name, (storySpeakers.get(speaker.Name) || 0) + 1);
        }
      }

      const definitions = extractDefinitions(file.path, response.content, json, lineIndex);
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
    resourceRecords,
    charactersByIdOrName,
    itemsById,
    storySpeakers,
    referencesByValue,
    battleReferencesById,
    achievementSourcesById: indexAchievementUnlockSources(achievementSources),
    storyVariableNames,
  };
  invalidateContentAnalysis();
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

function extractDefinitions(path, content, json, lineIndex = createJsonPropertyLineIndex(content)) {
  if (path.endsWith(".story.json")) {
    const segments = Array.isArray(json?.segments) ? json.segments : [];
    return segments
      .filter((segment) => typeof segment?.name === "string" && segment.name.length > 0)
      .map((segment) => ({
        id: segment.name,
        displayName: segment.name,
        type: "story",
        path,
        line: lineIndex.find("name", segment.name),
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
      line: lineIndex.find("id", record.id),
      record,
    }));
}

function ExtractStorySpeakers(path, content, root, lineIndex = createJsonPropertyLineIndex(content)) {
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
        Line: lineIndex.find("speaker", node.speaker),
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
          const index = state.records.findIndex((record) => record?.id === result.id);
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

  const fallback = findAssetByBasename("head", candidates);
  return fallback ? normalizeToolAssetValue(fallback) : "";
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
      projectProblemsCache = null;
      status.className = `static-tool-status ${state.portraitCheck.ok ? "ok" : "bad"}`;
      status.textContent = state.portraitCheck.ok ? "检查完成，没有阻断问题。" : "检查完成，发现需要处理的问题。";
      renderPortraitCheckResult(resultBox, state.portraitCheck);
      state.problemCenter.lastCheckedAt = new Date().toISOString();
      renderProblemIndicators();
    } catch (error) {
      state.portraitCheck = null;
      projectProblemsCache = null;
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

  if (!isCharacterFile() || state.records.length === 0) {
    const empty = document.createElement("div");
    empty.className = "static-tool-note";
    empty.textContent = "选择 characters.json 中的角色后，这里会显示当前角色的引用和配置检查。";
    elements.characterCheckBox.appendChild(empty);
    return;
  }

  const record = state.records[state.selectedRecordIndex];
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
  if (state.records.length === 0) {
    const empty = document.createElement("div");
    empty.className = "static-tool-note";
    empty.textContent = "选择 items.json 中的物品后，这里会显示当前物品的图片和引用检查。";
    elements.characterCheckBox.appendChild(empty);
    return;
  }

  const record = state.records[state.selectedRecordIndex];
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
  const itemId = typeof record?.id === "string" ? record.id.trim() : "";
  const preflight = await requestJson("/api/assets/item/upload-bind/preflight", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      itemId,
      pictureId,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
    }),
  });
  if (!preflight.canApply) {
    throw new Error(preflight.message || "物品图片上传预检未通过。");
  }
  const actionLabel = preflight.resourceAction === "create" ? "创建资源" : "复用资源";
  const overwriteLabel = preflight.assetExists ? "覆盖现有资产（覆盖前备份）" : "创建新资产";
  if (!confirmAction(`确认上传并绑定物品图片？\n\n资源 ID：${preflight.pictureId}\n资源组：物品\nvalue：${preflight.assetValue}\n资产路径：${preflight.assetPath}\n资源动作：${actionLabel}\n资产动作：${overwriteLabel}`)) {
    return null;
  }
  const dataUrl = await readFileAsDataUrl(file);
  const [, mimeType = "application/octet-stream", base64 = ""] = dataUrl.match(/^data:([^;]+);base64,(.+)$/) || [];
  if (!base64) {
    throw new Error("图片读取失败，未拿到可上传的数据。");
  }

  return requestJson("/api/assets/item/upload-bind", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      itemId,
      pictureId,
      fileName: file.name,
      mimeType,
      imageBase64: base64,
      preflightToken: preflight.token,
      allowAssetOverwrite: preflight.assetExists,
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

  return state.records[state.selectedRecordIndex] || null;
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

  return state.records[state.selectedRecordIndex] || null;
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
  const record = isMapFile() ? state.records[state.selectedRecordIndex] : null;
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
  const record = state.records[state.selectedRecordIndex];
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
  syncRecordsToEditor();
  closeMapResourcePicker();
  renderMapWorkspaceView();
}

function getCurrentShopRecord() {
  if (!isShopFile()) {
    return null;
  }

  return state.records[state.selectedRecordIndex] || null;
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

function createAssetLibraryPickerModel(entries, query, selectedAssetPath) {
  return createResourcePickerModel({
    entries,
    query,
    selectedValue: selectedAssetPath,
    getValue: (entry) => entry.assetPath,
    getSearchText: (entry) => [entry.basename, entry.assetPath, entry.assetValue, ...entry.resourceIds],
  });
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
    syncRecordsToEditor();
    await loadDataFiles();
    await rebuildContentIndex();
    showValidation(result.validation.ok, result.validation.message);
    renderCharacterWorkspaceView();
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
    syncRecordsToEditor();
    await loadDataFiles();
    await rebuildContentIndex();
    showValidation(result.validation.ok, result.validation.message);
    renderCharacterWorkspaceView();
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
    syncRecordsToEditor();
    await loadDataFiles();
    await rebuildContentIndex();
    closeItemPicturePicker();
    showValidation(result.validation.ok, result.validation.message);
    renderItemWorkspaceView();
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
    syncRecordsToEditor();
    await loadDataFiles();
    await rebuildContentIndex();
    closeShopResourcePicker();
    showValidation(result.validation.ok, result.validation.message);
    renderShopWorkspaceView();
  } catch (error) {
    showValidation(false, error instanceof Error ? error.message : String(error));
  } finally {
    button.disabled = false;
  }
}

function renderPortraitPicker(options = {}) {
  const scrollState = options.resetResults ? null : capturePortraitPickerScrollState();
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
    rerenderSearchResults(search, () => renderPortraitPicker({ resetResults: true }),
      () => document.querySelector("#portraitPickerOverlay .portrait-picker-search"));
  });

  const allEntries = getHeadPortraitLibraryEntries();
  const query = state.portraitPicker.search.trim().toLowerCase();
  const pickerModel = createAssetLibraryPickerModel(allEntries, query, state.portraitPicker.selectedAssetPath);
  const entries = pickerModel.visibleEntries;
  const selectedEntry = pickerModel.selectedEntry;
  if (selectedEntry && !state.portraitPicker.selectedAssetPath) {
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
      card.dataset.resourcePickerValue = entry.assetPath;
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
      revealAssetInResourceWorkspace(selectedEntry.assetPath);
    });
    footerActions.appendChild(previewButton);

    detail.append(preview, info, dimensionBlock, actionBlock, footerActions);
  }

  body.append(gallery, detail);
  bindResourcePickerKeyboard(dialog, {
    model: pickerModel,
    getValue: (entry) => entry.assetPath,
    onCancel: closePortraitPicker,
    onSelect: (assetPath, options = {}) => {
      state.portraitPicker.selectedAssetPath = assetPath;
      renderPortraitPicker();
      if (options.restoreKeyboardFocus) restoreResourcePickerKeyboardFocus("portraitPickerOverlay", assetPath);
    },
  });
  dialog.append(header, search, body);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  restorePortraitPickerScrollState(scrollState);
}

function renderItemPicturePicker(options = {}) {
  const scrollState = options.resetResults ? null : captureItemPicturePickerScrollState();
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
    rerenderSearchResults(search, () => renderItemPicturePicker({ resetResults: true }),
      () => document.querySelector("#itemPicturePickerOverlay .portrait-picker-search"));
  });

  const allEntries = getItemPictureLibraryEntries();
  const query = state.itemPicturePicker.search.trim().toLowerCase();
  const pickerModel = createAssetLibraryPickerModel(allEntries, query, state.itemPicturePicker.selectedAssetPath);
  const entries = pickerModel.visibleEntries;
  const selectedEntry = pickerModel.selectedEntry;
  if (selectedEntry && !state.itemPicturePicker.selectedAssetPath) {
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
      card.dataset.resourcePickerValue = entry.assetPath;
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
      revealAssetInResourceWorkspace(selectedEntry.assetPath);
    });
    footerActions.appendChild(previewButton);

    detail.append(preview, info, actionBlock, footerActions);
  }

  body.append(gallery, detail);
  bindResourcePickerKeyboard(dialog, {
    model: pickerModel,
    getValue: (entry) => entry.assetPath,
    onCancel: closeItemPicturePicker,
    onSelect: (assetPath, options = {}) => {
      state.itemPicturePicker.selectedAssetPath = assetPath;
      renderItemPicturePicker();
      if (options.restoreKeyboardFocus) restoreResourcePickerKeyboardFocus("itemPicturePickerOverlay", assetPath);
    },
  });
  dialog.append(header, search, body);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  restoreItemPicturePickerScrollState(scrollState);
}

function renderShopResourcePicker(options = {}) {
  const scrollState = options.resetResults ? null : captureShopResourcePickerScrollState();
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
    rerenderSearchResults(search, () => renderShopResourcePicker({ resetResults: true }),
      () => document.querySelector("#shopResourcePickerOverlay .portrait-picker-search"));
  });

  const allEntries = getShopResourceLibraryEntries(field);
  const query = state.shopResourcePicker.search.trim().toLowerCase();
  const pickerModel = createAssetLibraryPickerModel(allEntries, query, state.shopResourcePicker.selectedAssetPath);
  const entries = pickerModel.visibleEntries;
  const selectedEntry = pickerModel.selectedEntry;
  if (selectedEntry && !state.shopResourcePicker.selectedAssetPath) {
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
      card.dataset.resourcePickerValue = entry.assetPath;
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
      revealAssetInResourceWorkspace(selectedEntry.assetPath);
    });
    footerActions.appendChild(previewButton);

    detail.append(preview, info, actionBlock, footerActions);
  }

  body.append(gallery, detail);
  bindResourcePickerKeyboard(dialog, {
    model: pickerModel,
    getValue: (entry) => entry.assetPath,
    onCancel: closeShopResourcePicker,
    onSelect: (assetPath, options = {}) => {
      state.shopResourcePicker.selectedAssetPath = assetPath;
      renderShopResourcePicker();
      if (options.restoreKeyboardFocus) restoreResourcePickerKeyboardFocus("shopResourcePickerOverlay", assetPath);
    },
  });
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
    rerenderSearchResults(search, renderMapResourcePicker,
      () => document.querySelector("#mapResourcePickerOverlay .portrait-picker-search"));
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
  const availableResources = getMapIconResources().filter((resource) => matchesMapResourcePickerFilter(resource, picker.filter));
  const pickerModel = createResourcePickerModel({
    entries: availableResources,
    query,
    selectedValue: picker.selectedResourceId,
    getValue: (resource) => resource.id,
    getSearchText: (resource) => [resource.id, resource.group, resource.value].filter((value) => typeof value === "string"),
  });
  const resources = pickerModel.visibleEntries;
  const selectedResource = pickerModel.selectedEntry;
  if (selectedResource && !picker.selectedResourceId) {
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
      card.dataset.resourcePickerValue = resource.id;
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
  bindResourcePickerKeyboard(dialog, {
    model: pickerModel,
    getValue: (resource) => resource.id,
    onCancel: closeMapResourcePicker,
    onSelect: (resourceId, options = {}) => {
      picker.selectedResourceId = resourceId;
      renderMapResourcePicker();
      if (options.restoreKeyboardFocus) restoreResourcePickerKeyboardFocus("mapResourcePickerOverlay", resourceId);
    },
  });
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
    const index = state.records.findIndex((record) => record?.id === definition.id);
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
  if (event.key === "Escape" && elements.workspaceLauncher.classList.contains("overlay")) {
    event.preventDefault();
    hideWorkspaceLauncher();
    elements.workspaceSwitchButton.focus({ preventScroll: true });
    return;
  }

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
  return parseJsonc(text);
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
  return (state.mode === "data" || state.mode === "story")
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
