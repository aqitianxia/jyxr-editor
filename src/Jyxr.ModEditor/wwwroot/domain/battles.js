export const battleGrid = Object.freeze({ width: 11, height: 4 });

export const battleFilters = Object.freeze([
  ["all", "全部战斗"],
  ["fixed", "含固定敌人"],
  ["random", "含随机敌人"],
  ["unused", "未被引用"],
  ["issues", "有问题"],
]);

export const battleUnitKinds = Object.freeze([
  ["party", "玩家位置"],
  ["ally", "固定友军"],
  ["enemy", "固定敌人"],
  ["random", "随机敌人"],
]);

export function createBattleDefinition(id = "新战斗") {
  return {
    id,
    name: id,
    mapId: "city",
    music: null,
    experienceMultiplier: 1,
    requiredCharacterIds: [],
    participants: [
      createBattleUnit("party", { position: { x: 1, y: 1 }, partyIndex: 0 }),
      createBattleUnit("party", { position: { x: 1, y: 2 }, partyIndex: 1 }),
    ],
    randomParticipants: [],
  };
}

export function ensureBattleShape(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return createBattleDefinition();
  if (!Array.isArray(record.requiredCharacterIds)) record.requiredCharacterIds = [];
  if (!Array.isArray(record.participants)) record.participants = [];
  if (!Array.isArray(record.randomParticipants)) record.randomParticipants = [];
  return record;
}

export function createBattleUnit(kind, options = {}) {
  const position = normalizePosition(options.position) || { x: 0, y: 0 };
  if (kind === "random") {
    return {
      position,
      team: options.team ?? 2,
      facing: options.facing ?? 0,
      name: options.name ?? "随机敌人",
      tier: options.tier ?? 0,
      model: options.model ?? null,
      boss: options.boss ?? false,
    };
  }

  const team = kind === "enemy" ? 2 : 1;
  return {
    position,
    team: options.team ?? team,
    facing: options.facing ?? (team === 1 ? 1 : 0),
    characterId: kind === "party" ? null : options.characterId ?? "",
    partyIndex: kind === "party" ? options.partyIndex ?? 0 : null,
  };
}

export function classifyBattleParticipant(participant) {
  const hasCharacter = hasText(participant?.characterId);
  const hasPartyIndex = participant?.partyIndex !== null && participant?.partyIndex !== undefined;
  if (hasCharacter && hasPartyIndex) return "invalid";
  if (hasCharacter) return Number(participant?.team) === 1 ? "ally" : "enemy";
  if (hasPartyIndex) return Number(participant?.team) === 1 ? "party" : "invalid";
  return "invalid";
}

export function getBattleUnits(record) {
  const battle = ensureBattleShape(record);
  return [
    ...battle.participants.map((unit, index) => ({
      key: `participant:${index}`,
      source: "participants",
      index,
      kind: classifyBattleParticipant(unit),
      unit,
    })),
    ...battle.randomParticipants.map((unit, index) => ({
      key: `random:${index}`,
      source: "randomParticipants",
      index,
      kind: "random",
      unit,
    })),
  ];
}

export function getBattleUnit(record, key) {
  return getBattleUnits(record).find((entry) => entry.key === key) || null;
}

export function addBattleUnit(record, kind, options = {}) {
  const battle = ensureBattleShape(record);
  const source = kind === "random" ? battle.randomParticipants : battle.participants;
  const occupied = new Set(getBattleUnits(battle).map((entry) => positionKey(entry.unit.position)));
  const position = normalizePosition(options.position) || findFirstFreeBattlePosition(occupied, kind);
  const partyIndex = kind === "party" ? getNextPartyIndex(battle) : options.partyIndex;
  source.push(createBattleUnit(kind, { ...options, position, partyIndex }));
  return `${kind === "random" ? "random" : "participant"}:${source.length - 1}`;
}

export function duplicateBattleUnit(record, key) {
  const battle = ensureBattleShape(record);
  const entry = getBattleUnit(battle, key);
  if (!entry) return "";
  const source = battle[entry.source];
  const copy = cloneJson(entry.unit);
  const occupied = new Set(getBattleUnits(battle).map((candidate) => positionKey(candidate.unit.position)));
  copy.position = findFirstFreeBattlePosition(occupied, entry.kind);
  if (entry.kind === "party") copy.partyIndex = getNextPartyIndex(battle);
  source.splice(entry.index + 1, 0, copy);
  return `${entry.source === "randomParticipants" ? "random" : "participant"}:${entry.index + 1}`;
}

export function deleteBattleUnit(record, key) {
  const battle = ensureBattleShape(record);
  const entry = getBattleUnit(battle, key);
  if (!entry) return false;
  battle[entry.source].splice(entry.index, 1);
  renumberPartyIndexes(battle);
  return true;
}

export function moveBattleUnit(record, key, position, { swap = true } = {}) {
  const battle = ensureBattleShape(record);
  const entry = getBattleUnit(battle, key);
  const target = normalizePosition(position);
  if (!entry || !isBattlePosition(target)) return false;
  const occupying = getBattleUnits(battle)
    .find((candidate) => candidate.key !== key && samePosition(candidate.unit.position, target));
  if (occupying && !swap) return false;
  const previous = normalizePosition(entry.unit.position) || { x: 0, y: 0 };
  entry.unit.position = target;
  if (occupying) occupying.unit.position = previous;
  return true;
}

export function setBattleUnitKind(record, key, kind, options = {}) {
  const battle = ensureBattleShape(record);
  const entry = getBattleUnit(battle, key);
  if (!entry || !battleUnitKinds.some(([value]) => value === kind)) return "";
  const position = normalizePosition(entry.unit.position) || { x: 0, y: 0 };
  const replacement = {
    ...entry.unit,
    ...createBattleUnit(kind, {
    ...options,
    position,
    characterId: options.characterId ?? entry.unit.characterId ?? "",
    name: options.name ?? entry.unit.name ?? "随机敌人",
    model: options.model ?? entry.unit.model ?? null,
    tier: options.tier ?? entry.unit.tier ?? 0,
    boss: options.boss ?? entry.unit.boss ?? false,
    partyIndex: kind === "party" ? getNextPartyIndex(battle) : null,
    }),
  };
  if (kind === "random") {
    delete replacement.characterId;
    delete replacement.partyIndex;
  } else {
    delete replacement.name;
    delete replacement.tier;
    delete replacement.model;
    delete replacement.boss;
  }
  battle[entry.source].splice(entry.index, 1);
  const targetSource = kind === "random" ? battle.randomParticipants : battle.participants;
  targetSource.push(replacement);
  renumberPartyIndexes(battle);
  return `${kind === "random" ? "random" : "participant"}:${targetSource.length - 1}`;
}

export function getBattleStats(record, context = {}) {
  const units = getBattleUnits(record);
  const issues = getBattleIssues(record, context);
  return {
    unitCount: units.length,
    playerSlotCount: units.filter((entry) => entry.kind === "party").length,
    allyCount: units.filter((entry) => entry.kind === "ally").length,
    fixedEnemyCount: units.filter((entry) => entry.kind === "enemy").length,
    randomEnemyCount: units.filter((entry) => entry.kind === "random" && Number(entry.unit.team) !== 1).length,
    enemyCount: units.filter((entry) => Number(entry.unit.team) !== 1).length,
    errorCount: issues.filter((issue) => issue.severity === "error").length,
    warningCount: issues.filter((issue) => issue.severity === "warning").length,
    issues,
  };
}

export function getBattleIssues(record, context = {}) {
  const battle = ensureBattleShape(record);
  const issues = [];
  const id = String(battle.id || "").trim();
  const add = (severity, code, message, unitKey = "") => issues.push({ severity, code, message, unitKey });
  if (!id) add("error", "id.empty", "战斗 ID 不能为空。");
  if (!hasText(battle.name)) add("error", "name.empty", "战斗显示名称不能为空。");
  if (!hasText(battle.mapId)) add("error", "background.empty", "必须选择战斗背景。");
  else if (context.backgroundIds && !context.backgroundIds.has(String(battle.mapId).trim())) {
    add("warning", "background.missing", `战斗背景不存在：${battle.mapId}`);
  }
  if (context.idCounts?.get(id) > 1) add("error", "id.duplicate", `战斗 ID 重复：${id}`);
  if (battle.music && context.musicIds && !context.musicIds.has(String(battle.music).trim())) {
    add("warning", "music.missing", `音乐资源不存在：${battle.music}`);
  }
  if (battle.experienceMultiplier !== undefined
    && (!Number.isFinite(Number(battle.experienceMultiplier)) || Number(battle.experienceMultiplier) < 0)) {
    add("error", "experience.invalid", "经验倍率必须是大于等于 0 的数字。");
  }

  const occupied = new Map();
  const partyIndexes = [];
  const units = getBattleUnits(battle);
  for (const entry of units) {
    const position = normalizePosition(entry.unit.position);
    if (!isBattlePosition(position)) {
      add("error", "position.invalid", `${unitLabel(entry)}坐标必须位于 0..10 × 0..3。`, entry.key);
    } else {
      const key = positionKey(position);
      if (occupied.has(key)) add("error", "position.overlap", `${unitLabel(entry)}与另一单位重叠在 (${position.x}, ${position.y})。`, entry.key);
      else occupied.set(key, entry.key);
    }
    const team = Number(entry.source === "randomParticipants" ? entry.unit.team ?? 2 : entry.unit.team ?? 0);
    if (team !== 1 && team !== 2) {
      add("error", "team.invalid", `${unitLabel(entry)}阵营只允许玩家 1 或敌方 2。`, entry.key);
    }
    if (entry.unit.facing !== undefined && !Number.isFinite(Number(entry.unit.facing))) {
      add("error", "facing.invalid", `${unitLabel(entry)}朝向必须是数字。`, entry.key);
    }

    if (entry.source === "participants") {
      if (entry.kind === "invalid") add("error", "participant.source", `${unitLabel(entry)}必须且只能设置 characterId 或 partyIndex。`, entry.key);
      if (entry.kind === "party") {
        if (entry.unit.characterId !== null && entry.unit.characterId !== undefined) {
          add("error", "party-character.invalid", `${unitLabel(entry)}的 characterId 必须为 null，否则游戏不会把它计入部署位置。`, entry.key);
        }
        if (!Number.isInteger(Number(entry.unit.partyIndex)) || Number(entry.unit.partyIndex) < 0) {
          add("error", "party-index.invalid", `${unitLabel(entry)}的玩家序号必须是非负整数。`, entry.key);
        } else partyIndexes.push(Number(entry.unit.partyIndex));
      }
      if ((entry.kind === "ally" || entry.kind === "enemy") && context.characterIds && !context.characterIds.has(String(entry.unit.characterId).trim())) {
        add("error", "character.missing", `${unitLabel(entry)}引用的角色不存在：${entry.unit.characterId}`, entry.key);
      }
    } else {
      const tier = Number(entry.unit.tier ?? 0);
      if (!Number.isInteger(tier) || tier < 0 || (!entry.unit.boss && tier > 3)) {
        add("error", "random-tier.invalid", `${unitLabel(entry)}的普通等级只能是 0..3，随机 Boss 必须使用非负整数。`, entry.key);
      }
    }
  }

  const sortedPartyIndexes = [...partyIndexes].sort((left, right) => left - right);
  if (new Set(sortedPartyIndexes).size !== sortedPartyIndexes.length) add("error", "party-index.duplicate", "玩家位置的 partyIndex 不能重复。");
  if (sortedPartyIndexes.some((value, index) => value !== index)) add("error", "party-index.gap", "玩家位置的 partyIndex 必须从 0 连续编号。");
  const playerCount = units.filter((entry) => Number(entry.unit.team) === 1 && entry.kind !== "invalid").length;
  const enemyCount = units.filter((entry) => Number(entry.unit.team) !== 1).length;
  if (playerCount === 0) add("error", "player.empty", "至少需要一个玩家位置或固定友军。");
  if (enemyCount === 0) add("warning", "enemy.empty", "没有敌方单位，战斗可能立即胜利。");

  const requiredIds = battle.requiredCharacterIds.map((value) => String(value || "").trim()).filter(Boolean);
  if (new Set(requiredIds).size !== requiredIds.length) add("error", "required.duplicate", "必选角色不能重复。");
  if (requiredIds.length > partyIndexes.length) add("error", "required.capacity", "必选角色数量超过玩家部署位置数。");
  if (context.characterIds) {
    requiredIds.filter((value) => !context.characterIds.has(value))
      .forEach((value) => add("warning", "required.missing", `必选角色不存在：${value}`));
  }
  if (context.referenceCount === 0) add("warning", "reference.unused", "没有发现剧情或地图引用这场战斗。");
  return issues;
}

export function matchesBattleSearch(record, query) {
  const normalized = String(query || "").trim().toLocaleLowerCase("zh-Hans-CN");
  if (!normalized) return true;
  const units = getBattleUnits(record);
  return [record?.id, record?.name, record?.mapId, record?.music,
    ...units.flatMap((entry) => [entry.unit.characterId, entry.unit.name, entry.unit.model])]
    .some((value) => String(value || "").toLocaleLowerCase("zh-Hans-CN").includes(normalized));
}

export function matchesBattleFilter(record, filter, context = {}) {
  const stats = getBattleStats(record, context);
  if (filter === "fixed") return stats.fixedEnemyCount > 0;
  if (filter === "random") return stats.randomEnemyCount > 0;
  if (filter === "unused") return context.referenceCount === 0;
  if (filter === "issues") return stats.errorCount + stats.warningCount > 0;
  return true;
}

export function findBattleReferences(path, root) {
  const references = [];
  const normalizedPath = String(path || "").replaceAll("\\", "/");

  function add(value, fieldPath, ownerDefinitionId, kind) {
    const battleId = String(value || "").trim();
    if (!battleId) return;
    const reference = {
      value: battleId,
      path: normalizedPath,
      fieldPath,
      ownerDefinitionId: ownerDefinitionId || "",
      kind,
    };
    const mapMatch = /^\$\[(\d+)\]\.locations\[(\d+)\]\.events\[(\d+)\]\.targetId$/u.exec(fieldPath);
    if (mapMatch) {
      reference.mapIndex = Number(mapMatch[1]);
      reference.locationIndex = Number(mapMatch[2]);
      reference.eventIndex = Number(mapMatch[3]);
    }
    const storyMatch = /^\$\.segments\[(\d+)\]/u.exec(fieldPath);
    if (storyMatch) reference.segmentIndex = Number(storyMatch[1]);
    references.push(reference);
  }

  function visit(node, fieldPath, ownerDefinitionId) {
    if (Array.isArray(node)) {
      node.forEach((child, index) => {
        const ownsChildren = fieldPath === "$" || fieldPath === "$.segments";
        const childOwner = ownsChildren && child && typeof child === "object"
          ? String(child.id || child.name || ownerDefinitionId || "")
          : ownerDefinitionId;
        visit(child, `${fieldPath}[${index}]`, childOwner);
      });
      return;
    }
    if (!node || typeof node !== "object") return;

    const nextOwner = ownerDefinitionId || String(node.id || node.name || "");
    if (node.kind === "battle" && typeof node.battleId === "string") {
      add(node.battleId, `${fieldPath}.battleId`, nextOwner, "story");
    } else if (typeof node.battleId === "string") {
      add(node.battleId, `${fieldPath}.battleId`, nextOwner,
        normalizedPath === "towers.json" ? "tower" : "battle-id");
    }
    if (node.type === "battle" && typeof node.targetId === "string") {
      add(node.targetId, `${fieldPath}.targetId`, nextOwner,
        normalizedPath === "maps.json" ? "map" : normalizedPath === "world-triggers.json" ? "world" : "battle-target");
    }

    for (const [key, value] of Object.entries(node)) {
      if (key === "battleId" || (key === "targetId" && node.type === "battle")) continue;
      visit(value, `${fieldPath}.${key}`, nextOwner);
    }
  }

  visit(root, "$", "");
  return references;
}

export function findFirstFreeBattlePosition(occupied, kind = "enemy") {
  const taken = occupied instanceof Set ? occupied : new Set(occupied || []);
  const columns = kind === "party" || kind === "ally"
    ? [...Array(battleGrid.width).keys()]
    : [...Array(battleGrid.width).keys()].reverse();
  for (const x of columns) {
    for (let y = 0; y < battleGrid.height; y += 1) {
      if (!taken.has(`${x},${y}`)) return { x, y };
    }
  }
  return { x: 0, y: 0 };
}

export function isBattlePosition(position) {
  return Boolean(position) && Number.isInteger(position.x) && Number.isInteger(position.y)
    && position.x >= 0 && position.x < battleGrid.width
    && position.y >= 0 && position.y < battleGrid.height;
}

function getNextPartyIndex(record) {
  const used = new Set(record.participants
    .filter((unit) => classifyBattleParticipant(unit) === "party")
    .map((unit) => Number(unit.partyIndex))
    .filter(Number.isInteger));
  let index = 0;
  while (used.has(index)) index += 1;
  return index;
}

function renumberPartyIndexes(record) {
  record.participants
    .filter((unit) => classifyBattleParticipant(unit) === "party")
    .sort((left, right) => Number(left.partyIndex) - Number(right.partyIndex))
    .forEach((unit, index) => { unit.partyIndex = index; });
}

function normalizePosition(position) {
  if (!position || typeof position !== "object") return null;
  const x = Number(position.x);
  const y = Number(position.y);
  return Number.isInteger(x) && Number.isInteger(y) ? { x, y } : null;
}

function samePosition(left, right) {
  const a = normalizePosition(left);
  const b = normalizePosition(right);
  return Boolean(a && b && a.x === b.x && a.y === b.y);
}

function positionKey(position) {
  const normalized = normalizePosition(position);
  return normalized ? `${normalized.x},${normalized.y}` : "invalid";
}

function unitLabel(entry) {
  if (entry.kind === "party") return `玩家位置 ${Number(entry.unit.partyIndex) + 1}`;
  if (entry.kind === "ally") return `固定友军「${entry.unit.characterId || "未选择"}」`;
  if (entry.kind === "enemy") return `固定敌人「${entry.unit.characterId || "未选择"}」`;
  if (entry.kind === "random") return `随机单位「${entry.unit.name || `#${entry.index + 1}`}」`;
  return `固定单位 #${entry.index + 1}`;
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function cloneJson(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}
