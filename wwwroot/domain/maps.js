export function createMapDefinition(id = "新地图") {
  return {
    id,
    name: id,
    kind: "small",
    description: "",
    picture: `地图.${id}`,
    musics: [],
    locations: [
      {
        id: "返回",
        name: "返回",
        position: { x: -1, y: -1 },
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

export function ensureMapShape(record) {
  if (!record || Array.isArray(record) || typeof record !== "object") return record;
  if (typeof record.id !== "string") record.id = "";
  if (typeof record.name !== "string") record.name = record.id;
  if (!Array.isArray(record.musics)) record.musics = [];
  if (!Array.isArray(record.locations)) record.locations = [];

  record.locations = record.locations.map((location) => (
    isObject(location) ? location : createLocationDefinition()
  ));
  for (const location of record.locations) ensureMapLocationShape(location);
  return record;
}

export function matchesMapSearch(record, query) {
  const normalized = String(query || "").trim().toLocaleLowerCase("zh-CN");
  if (!normalized) return true;
  const locationText = (record?.locations || []).flatMap((location) => [
    location?.id,
    location?.name,
    location?.description,
    ...(location?.events || []).flatMap((event) => [
      event?.type,
      event?.targetId,
      event?.description,
      ...(event?.conditions || []).flatMap((condition) => [condition?.type, condition?.value]),
    ]),
  ]);
  return [
    record?.id,
    record?.name,
    record?.description,
    record?.picture,
    ...(record?.musics || []),
    ...locationText,
  ].some((value) => String(value || "").toLocaleLowerCase("zh-CN").includes(normalized));
}

export function moveMapLocation(record, index, delta) {
  const locations = Array.isArray(record?.locations) ? record.locations : [];
  const nextIndex = index + delta;
  if (index < 0 || index >= locations.length || nextIndex < 0 || nextIndex >= locations.length) return index;
  const [location] = locations.splice(index, 1);
  locations.splice(nextIndex, 0, location);
  return nextIndex;
}

export function ensureMapLocationShape(location) {
  if (typeof location.id !== "string") location.id = "";
  if (location.name != null && typeof location.name !== "string") location.name = String(location.name);
  if (!Array.isArray(location.events)) location.events = [];
  location.events = location.events.map((event) => isObject(event) ? event : createEventDefinition());
  for (const event of location.events) ensureMapEventShape(event);
}

export function ensureMapEventShape(event) {
  if (typeof event.type !== "string" || !event.type.trim()) event.type = "story";
  if (typeof event.targetId !== "string") event.targetId = "";
  if (!Number.isFinite(event.probability)) event.probability = 100;
  if (!Array.isArray(event.conditions)) event.conditions = [];
  event.conditions = event.conditions.map((condition) => isObject(condition) ? condition : createConditionDefinition());
  for (const condition of event.conditions) {
    if (typeof condition.type !== "string") condition.type = "always";
    if (condition.value == null) condition.value = "";
    else if (typeof condition.value !== "string") condition.value = String(condition.value);
  }
}

function createLocationDefinition() {
  return { id: "", name: "", description: "", picture: null, events: [] };
}

function createEventDefinition() {
  return { type: "story", targetId: "", probability: 100, conditions: [] };
}

function createConditionDefinition() {
  return { type: "always", value: "" };
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
