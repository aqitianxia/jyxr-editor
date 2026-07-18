import { setDrawerOpen } from "./drawers.js?v=20260711-core-17";

const shellContexts = Object.freeze({
  home: { eyebrow: "项目首页", browserTitle: "项目导航" },
  problems: { eyebrow: "质量检查 / 问题中心", browserTitle: "问题筛选" },
  characters: { eyebrow: "内容创作 / 角色与伙伴", browserTitle: "角色" },
  growth: { eyebrow: "内容创作 / 成长模板", browserTitle: "成长模板" },
  items: { eyebrow: "内容创作 / 物品与装备", browserTitle: "物品" },
  shops: { eyebrow: "内容创作 / 商店与经济", browserTitle: "商店" },
  martial: { eyebrow: "内容创作 / 武学与奥义", browserTitle: "武学" },
  talents: { eyebrow: "内容创作 / 天赋与战斗 Hook", browserTitle: "天赋" },
  data: { eyebrow: "高级数据", browserTitle: "数据文件" },
  story: { eyebrow: "剧情与任务 / 图谱", browserTitle: "剧情分组" },
  assets: { eyebrow: "资源管理", browserTitle: "资源目录" },
});

export function createShellController({
  state,
  elements,
  preferences,
  navigationPreferenceKey,
  navigationSectionsPreferenceKey,
  scheduleLayout,
  matchMedia = window.matchMedia.bind(window),
}) {
  function initialize() {
    const savedNavigationState = preferences.get(navigationPreferenceKey);
    const collapseForNarrowScreen = matchMedia("(max-width: 680px)").matches;
    state.shell.navigationCollapsed = savedNavigationState === null
      ? collapseForNarrowScreen
      : savedNavigationState === "true";
    restoreNavigationSections();
    setNavigationCollapsed(state.shell.navigationCollapsed, { persist: false });
    setContextDrawerOpen(false, { focusClose: false });
    renderContext();
  }

  function restoreNavigationSections() {
    const saved = preferences.get(navigationSectionsPreferenceKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        for (const section of Object.keys(state.shell.navigationSections)) {
          state.shell.navigationSections[section] = parsed?.[section] === true;
        }
      } catch {
        preferences.remove(navigationSectionsPreferenceKey);
      }
    }

    renderNavigationSections();
  }

  function toggleNavigationSection(section) {
    if (!(section in state.shell.navigationSections)) return;
    state.shell.navigationSections[section] = !state.shell.navigationSections[section];
    preferences.set(navigationSectionsPreferenceKey, JSON.stringify(state.shell.navigationSections));
    renderNavigationSections();
  }

  function renderNavigationSections() {
    const sections = {
      project: [elements.projectNavigationToggle, elements.projectNavigationItems],
      content: [elements.contentNavigationToggle, elements.contentNavigationItems],
      tools: [elements.toolsNavigationToggle, elements.toolsNavigationItems],
    };
    for (const [section, [toggle, items]] of Object.entries(sections)) {
      const collapsed = state.shell.navigationSections[section];
      toggle.setAttribute("aria-expanded", String(!collapsed));
      items.hidden = collapsed;
    }
  }

  function setNavigationCollapsed(collapsed, options = {}) {
    state.shell.navigationCollapsed = Boolean(collapsed);
    document.body.classList.toggle("navigation-collapsed", state.shell.navigationCollapsed);
    elements.navigationToggleButton.setAttribute("aria-expanded", String(!state.shell.navigationCollapsed));
    const actionLabel = state.shell.navigationCollapsed ? "展开导航" : "收起导航";
    elements.navigationToggleButton.setAttribute("aria-label", actionLabel);
    elements.navigationToggleButton.title = actionLabel;
    if (options.persist !== false) {
      preferences.set(navigationPreferenceKey, state.shell.navigationCollapsed);
    }
    scheduleLayout();
  }

  function setContextDrawerOpen(open, options = {}) {
    state.shell.contextDrawerOpen = setDrawerOpen({
      open,
      bodyClass: "context-drawer-open",
      toggleButton: elements.inspectorToggleButton,
      drawer: elements.contextInspector,
      closeButton: elements.inspectorCloseButton,
      focusClose: options.focusClose !== false,
    });
  }

  function renderContext() {
    const context = shellContexts[state.mode] || shellContexts.home;
    elements.workspaceEyebrow.textContent = context.eyebrow;
    elements.browserTitle.textContent = context.browserTitle;
    elements.newStoryButton.classList.toggle("hidden", state.mode !== "story");
    elements.newSpeakerButton.classList.toggle("hidden", state.mode !== "story");
    elements.portraitCheckButton.classList.toggle("hidden", state.mode === "story");
    elements.characterCheckButton.classList.toggle("hidden", state.mode !== "data" && state.mode !== "characters");
  }

  function renderInspectorStatus(ok, label) {
    elements.inspectorStatus.className = `status-badge ${ok ? "ok" : "bad"}`;
    elements.inspectorStatus.textContent = label || (ok ? "正常" : "有问题");
  }

  return {
    initialize,
    setNavigationCollapsed,
    toggleNavigationSection,
    setContextDrawerOpen,
    renderContext,
    renderInspectorStatus,
  };
}
