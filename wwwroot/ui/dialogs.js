const defaultOverlayId = "toolDialogOverlay";

export function createDialogController({ root = document.body, overlayId = defaultOverlayId } = {}) {
  function close() {
    document.getElementById(overlayId)?.remove();
  }

  function isOpen() {
    return Boolean(document.getElementById(overlayId));
  }

  function open({ title, subtitle = "", content, closeLabel = "关闭" }) {
    close();

    const overlay = document.createElement("div");
    overlay.id = overlayId;
    overlay.className = "tool-dialog-overlay";
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        close();
      }
    });

    const dialog = document.createElement("div");
    dialog.className = "tool-dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");

    const header = document.createElement("div");
    header.className = "tool-dialog-header";
    const titleGroup = document.createElement("div");
    const titleNode = document.createElement("div");
    titleNode.className = "tool-dialog-title";
    titleNode.textContent = title;
    const subtitleNode = document.createElement("div");
    subtitleNode.className = "tool-dialog-subtitle";
    subtitleNode.textContent = subtitle;
    titleGroup.append(titleNode, subtitleNode);

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.textContent = closeLabel;
    closeButton.addEventListener("click", close);
    header.append(titleGroup, closeButton);

    dialog.append(header, content);
    overlay.appendChild(dialog);
    root.appendChild(overlay);
    return { overlay, dialog, closeButton };
  }

  return { open, close, isOpen };
}

export function confirmAction(message, confirmImpl = window.confirm.bind(window)) {
  return Boolean(confirmImpl(message));
}
