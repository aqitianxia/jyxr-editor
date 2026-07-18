export function renderStatusMessage(container, { ok, message }) {
  container.replaceChildren();
  container.className = `message ${ok ? "ok" : "bad"}`;
  container.textContent = message;
}

export function createProblemSummary({ title, detail, action = null, more = "" }) {
  const fragment = document.createDocumentFragment();
  const titleNode = document.createElement("div");
  titleNode.className = "validation-title";
  titleNode.textContent = title;
  const detailNode = document.createElement("div");
  detailNode.className = "validation-detail";
  detailNode.textContent = detail;
  fragment.append(titleNode, detailNode);

  if (action) {
    const actions = document.createElement("div");
    actions.className = "validation-actions";
    actions.appendChild(action);
    fragment.appendChild(actions);
  }

  if (more) {
    const moreNode = document.createElement("div");
    moreNode.className = "validation-detail";
    moreNode.textContent = more;
    fragment.appendChild(moreNode);
  }
  return fragment;
}
