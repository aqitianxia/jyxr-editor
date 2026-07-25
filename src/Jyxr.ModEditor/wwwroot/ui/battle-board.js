import { battleGrid, getBattleUnits, isBattlePosition } from "../domain/battles.js?v=20260722-battle-links-1";

function el(tag, className = "", text = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== "") node.textContent = text;
  return node;
}

function unitPresentation(entry, characters) {
  const character = characters.get(String(entry.unit.characterId || ""));
  if (entry.kind === "party") {
    return { short: String(Number(entry.unit.partyIndex) + 1), label: `玩家位置 ${Number(entry.unit.partyIndex) + 1}` };
  }
  if (entry.kind === "ally") {
    return { short: "友", label: character?.name || entry.unit.characterId || "未选择友军" };
  }
  if (entry.kind === "enemy") {
    return { short: "敌", label: character?.name || entry.unit.characterId || "未选择敌人" };
  }
  if (entry.kind === "random") {
    return {
      short: entry.unit.boss ? "王" : String(Number(entry.unit.tier) + 1),
      label: entry.unit.name || (entry.unit.boss ? "随机 Boss" : `随机敌人 T${entry.unit.tier ?? 0}`),
    };
  }
  return { short: "!", label: "无效固定单位" };
}

function applyGridPosition(node, position) {
  node.style.gridColumn = String(position.x + 2);
  node.style.gridRow = String(position.y + 2);
}

export function createBattleBoard({
  record,
  selectedUnitKey = "",
  characters = new Map(),
  backgroundPath = "",
  onSelect,
  onMove,
} = {}) {
  const viewport = el("div", "battle-board-viewport");
  const board = el("div", "battle-board");
  board.setAttribute("aria-label", "11 列 4 行战斗部署棋盘");

  const corner = el("div", "battle-axis-corner", "Y/X");
  corner.style.gridColumn = "1";
  corner.style.gridRow = "1";
  board.appendChild(corner);
  for (let x = 0; x < battleGrid.width; x += 1) {
    const label = el("div", "battle-axis-label", String(x));
    label.style.gridColumn = String(x + 2);
    label.style.gridRow = "1";
    board.appendChild(label);
  }
  for (let y = 0; y < battleGrid.height; y += 1) {
    const label = el("div", "battle-axis-label", String(y));
    label.style.gridColumn = "1";
    label.style.gridRow = String(y + 2);
    board.appendChild(label);
  }

  const background = el("div", "battle-board-background");
  background.style.gridColumn = "2 / -1";
  background.style.gridRow = "2 / -1";
  if (backgroundPath) {
    const image = document.createElement("img");
    image.src = `/api/assets/file?path=${encodeURIComponent(backgroundPath)}`;
    image.alt = record?.mapId ? `战斗背景 ${record.mapId}` : "战斗背景";
    background.appendChild(image);
  } else {
    background.appendChild(el("span", "", record?.mapId ? `找不到背景：${record.mapId}` : "未选择战斗背景"));
  }
  board.appendChild(background);

  let draggedKey = "";
  for (let y = 0; y < battleGrid.height; y += 1) {
    for (let x = 0; x < battleGrid.width; x += 1) {
      const cell = el("button", "battle-cell");
      cell.type = "button";
      cell.title = `移动到 (${x}, ${y})`;
      cell.setAttribute("aria-label", `战场坐标 ${x}, ${y}`);
      applyGridPosition(cell, { x, y });
      cell.addEventListener("click", () => {
        if (selectedUnitKey) onMove?.(selectedUnitKey, { x, y });
      });
      cell.addEventListener("dragover", (event) => {
        event.preventDefault();
        cell.classList.add("drop-target");
      });
      cell.addEventListener("dragleave", () => cell.classList.remove("drop-target"));
      cell.addEventListener("drop", (event) => {
        event.preventDefault();
        cell.classList.remove("drop-target");
        const key = event.dataTransfer?.getData("text/plain") || draggedKey;
        if (key) onMove?.(key, { x, y });
      });
      board.appendChild(cell);
    }
  }

  for (const entry of getBattleUnits(record)) {
    if (!isBattlePosition(entry.unit.position)) continue;
    const presentation = unitPresentation(entry, characters);
    const token = el("button", `battle-unit-token ${entry.kind}`);
    token.type = "button";
    token.draggable = true;
    token.classList.toggle("selected", entry.key === selectedUnitKey);
    token.title = `${presentation.label} · (${entry.unit.position.x}, ${entry.unit.position.y})`;
    token.setAttribute("aria-label", token.title);
    token.append(el("span", "battle-unit-mark", presentation.short), el("span", "battle-unit-name", presentation.label));
    applyGridPosition(token, entry.unit.position);
    token.addEventListener("click", (event) => {
      event.stopPropagation();
      onSelect?.(entry.key);
    });
    token.addEventListener("dragstart", (event) => {
      draggedKey = entry.key;
      token.classList.add("dragging");
      event.dataTransfer?.setData("text/plain", entry.key);
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
    });
    token.addEventListener("dragend", () => {
      draggedKey = "";
      token.classList.remove("dragging");
    });
    board.appendChild(token);
  }

  viewport.appendChild(board);
  return viewport;
}
