(() => {
  const entryUrl = "/app.js?v=20260711-stage9-1";
  const status = document.getElementById("coreLoadState");
  const errorBox = document.getElementById("coreLoadError");
  const errorMessage = document.getElementById("coreLoadErrorMessage");

  status.className = "core-load-state pending";
  status.textContent = "核心加载中";
  status.title = `正在加载 ${entryUrl}`;

  import(entryUrl)
    .then(() => {
      status.className = "core-load-state loaded";
      status.textContent = "核心已加载";
      status.title = "ES Module 入口及依赖已成功执行";
      errorBox.hidden = true;
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      status.className = "core-load-state failed";
      status.textContent = "核心加载失败";
      status.title = message;
      errorMessage.textContent = message;
      errorBox.hidden = false;
      console.error("[JYXR Editor] ES Module bootstrap failed:", error);
    });
})();
