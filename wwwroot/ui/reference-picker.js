import { bindImeSafeInput } from "../core/input-composition.js?v=20260711-core-17";

function element(tag, className = "", text = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function normalize(value) {
  return String(value || "").trim().toLocaleLowerCase("zh-Hans-CN");
}

function fuzzyScore(option, query) {
  if (!query) return 1;
  const haystack = normalize(option.searchText || [option.name, option.id, option.subtitle, option.description].join(" "));
  if (haystack === query) return 1000;
  if (normalize(option.name) === query || normalize(option.id) === query) return 900;
  const direct = haystack.indexOf(query);
  if (direct >= 0) return 700 - Math.min(direct, 200);

  let cursor = 0;
  let gap = 0;
  for (const character of query) {
    const next = haystack.indexOf(character, cursor);
    if (next < 0) return -1;
    gap += next - cursor;
    cursor = next + 1;
  }
  return 300 - Math.min(gap, 250);
}

function renderIcon(option, className) {
  const frame = element("span", className);
  if (option?.iconPath) {
    const image = document.createElement("img");
    image.src = `/api/assets/file?path=${encodeURIComponent(option.iconPath)}`;
    image.alt = option.name || option.id;
    image.loading = "lazy";
    frame.appendChild(image);
  } else {
    frame.appendChild(element("span", "reference-picker-icon-placeholder", option?.typeLabel?.slice(0, 1) || "项"));
  }
  return frame;
}

function renderOptionCopy(option, compact = false) {
  const copy = element("span", "reference-picker-copy");
  const heading = element("span", "reference-picker-heading");
  heading.appendChild(element("strong", "", option.name || option.id));
  heading.appendChild(element("code", "", option.id));
  copy.appendChild(heading);
  if (option.subtitle) copy.appendChild(element("small", "reference-picker-subtitle", option.subtitle));
  if (!compact && option.description) copy.appendChild(element("small", "reference-picker-description", option.description));
  if (option.metadata?.length) {
    const metadata = element("span", "reference-picker-metadata");
    for (const item of option.metadata) metadata.appendChild(element("span", "", item));
    copy.appendChild(metadata);
  }
  return copy;
}

function createSelectedPreview(option, missingId = "") {
  const preview = element("div", `reference-picker-selected${option ? "" : " missing"}`);
  if (!option) {
    preview.appendChild(element("span", "reference-picker-icon reference-picker-icon-placeholder", "!"));
    const copy = element("span", "reference-picker-copy");
    copy.appendChild(element("strong", "", missingId ? "当前引用不存在" : "尚未选择"));
    if (missingId) copy.appendChild(element("code", "", missingId));
    preview.appendChild(copy);
    return preview;
  }
  preview.appendChild(renderIcon(option, "reference-picker-icon"));
  preview.appendChild(renderOptionCopy(option));
  return preview;
}

export function createReferencePicker({
  value = "",
  options = [],
  placeholder = "输入名称或 ID 搜索",
  onSelect,
  compact = false,
  showSelected = true,
  excludeIds = [],
} = {}) {
  const wrapper = element("div", `reference-picker${compact ? " compact" : ""}`);
  const optionMap = new Map(options.map((option) => [option.id, option]));
  const excluded = new Set(excludeIds);
  let currentValue = String(value || "");
  let activeIndex = 0;
  let visibleOptions = [];

  if (showSelected && currentValue) {
    wrapper.appendChild(createSelectedPreview(optionMap.get(currentValue), currentValue));
  }

  const input = document.createElement("input");
  input.type = "search";
  input.className = "input reference-picker-search";
  input.placeholder = placeholder;
  input.autocomplete = "off";
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-expanded", "false");
  if (compact && currentValue) input.value = optionMap.get(currentValue)?.name || currentValue;

  const results = element("div", "reference-picker-results hidden");
  results.setAttribute("role", "listbox");

  function close() {
    results.classList.add("hidden");
    input.setAttribute("aria-expanded", "false");
  }

  function choose(option) {
    currentValue = option.id;
    input.value = compact ? option.name || option.id : "";
    close();
    onSelect?.(option.id, option);
  }

  function renderResults() {
    const query = normalize(input.value);
    visibleOptions = options
      .filter((option) => !excluded.has(option.id) || option.id === currentValue)
      .map((option) => ({ option, score: fuzzyScore(option, query) }))
      .filter((entry) => entry.score >= 0)
      .sort((left, right) => right.score - left.score
        || String(left.option.name || left.option.id).localeCompare(String(right.option.name || right.option.id), "zh-Hans-CN"))
      .slice(0, 40)
      .map((entry) => entry.option);
    activeIndex = Math.min(activeIndex, Math.max(0, visibleOptions.length - 1));
    results.replaceChildren();
    if (visibleOptions.length === 0) {
      results.appendChild(element("div", "reference-picker-empty", "没有匹配的内容"));
    } else {
      visibleOptions.forEach((option, index) => {
        const item = element("button", `reference-picker-result${index === activeIndex ? " active" : ""}`);
        item.type = "button";
        item.setAttribute("role", "option");
        item.appendChild(renderIcon(option, "reference-picker-result-icon"));
        item.appendChild(renderOptionCopy(option, compact));
        item.addEventListener("mousedown", (event) => event.preventDefault());
        item.addEventListener("click", () => choose(option));
        results.appendChild(item);
      });
    }
    results.classList.remove("hidden");
    input.setAttribute("aria-expanded", "true");
  }

  bindImeSafeInput(input, renderResults);
  input.addEventListener("focus", () => {
    if (compact && currentValue && input.value === (optionMap.get(currentValue)?.name || currentValue)) input.select();
    renderResults();
  });
  input.addEventListener("blur", () => window.setTimeout(close, 120));
  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (results.classList.contains("hidden")) renderResults();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      activeIndex = Math.max(0, Math.min(visibleOptions.length - 1, activeIndex + direction));
      renderResults();
      results.children[activeIndex]?.scrollIntoView({ block: "nearest" });
    } else if (event.key === "Enter" && !results.classList.contains("hidden") && visibleOptions[activeIndex]) {
      event.preventDefault();
      choose(visibleOptions[activeIndex]);
    } else if (event.key === "Escape") {
      close();
    }
  });

  wrapper.append(input, results);
  return wrapper;
}

export function createReferenceSummary(option, missingId = "") {
  return createSelectedPreview(option, missingId);
}
