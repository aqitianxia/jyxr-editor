export function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createSectDefinition(id = "新门派") {
  return {
    id,
    name: id,
    storyId: "",
    primaryFocus: "",
    description: "",
    portrait: null,
    signatureSkillNames: [],
    masterNames: [],
    background: null,
    traitTags: [],
  };
}

export function ensureSectShape(record) {
  if (!record || Array.isArray(record) || typeof record !== "object") return record;
  for (const key of ["signatureSkillNames", "masterNames", "traitTags"]) {
    if (!Array.isArray(record[key])) record[key] = [];
  }
  return record;
}

export function matchesSectSearch(record, query) {
  const normalized = String(query || "").trim().toLocaleLowerCase("zh-CN");
  if (!normalized) return true;
  return [record?.id, record?.name, record?.primaryFocus, record?.description, ...(record?.traitTags || [])]
    .some((value) => String(value || "").toLocaleLowerCase("zh-CN").includes(normalized));
}

export function getSectIssues(record, context = {}) {
  const issues = [];
  const id = String(record?.id || "").trim();
  const name = String(record?.name || "").trim();
  if (!id) issues.push({ field: "id", message: "门派 ID 不能为空" });
  else if ((context.idCounts?.get(id) || 0) > 1) issues.push({ field: "id", message: `门派 ID 重复：${id}` });
  if (!name) issues.push({ field: "name", message: "门派名称不能为空" });

  const storyId = String(record?.storyId || "").trim();
  if (!storyId) issues.push({ field: "storyId", message: "未配置入门剧情；运行时不会在门派选择界面显示" });
  else if (context.storyIds && !context.storyIds.has(storyId)) issues.push({ field: "storyId", message: `入门剧情不存在：${storyId}` });

  for (const field of ["portrait", "background"]) {
    const value = String(record?.[field] || "").trim();
    if (value && context.resourceIds && !context.resourceIds.has(value)) {
      issues.push({ field, message: `${field === "portrait" ? "头像" : "背景"}资源不存在：${value}` });
    }
  }

  const checkReferences = (field, values, known, label, allowUnmatched = false) => {
    const seen = new Set();
    for (const raw of Array.isArray(values) ? values : []) {
      const value = String(raw || "").trim();
      if (!value) issues.push({ field, message: `${label}包含空值` });
      else if (seen.has(value)) issues.push({ field, message: `${label}重复：${value}` });
      else if (!allowUnmatched && known && !known.has(value)) issues.push({ field, message: `${label}不存在：${value}` });
      seen.add(value);
    }
  };
  checkReferences("signatureSkillNames", record?.signatureSkillNames, context.skillNames, "代表武学");
  checkReferences("masterNames", record?.masterNames, context.characterNames, "代表人物", true);
  checkReferences("traitTags", record?.traitTags, null, "特色标签", true);
  return issues;
}

export function createSectReferenceOptions(definitions, typeLabels = {}) {
  return (definitions || [])
    .filter((item) => item?.id)
    .map((item) => ({
      id: item.id,
      name: item.name || item.id,
      typeLabel: typeLabels[item.type] || item.type || "内容",
      subtitle: item.id === item.name ? "" : item.id,
      description: item.description || "",
      iconPath: item.iconPath || "",
    }))
    .sort((left, right) => left.name.localeCompare(right.name, "zh-Hans-CN"));
}
