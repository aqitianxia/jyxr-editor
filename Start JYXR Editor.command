#!/bin/zsh

set -u

script_path="$0"
while [[ -L "$script_path" ]]; do
  script_dir="${script_path:A:h}"
  link_target="$(readlink "$script_path")"
  if [[ "$link_target" = /* ]]; then
    script_path="$link_target"
  else
    script_path="$script_dir/$link_target"
  fi
done

repo_dir="${script_path:A:h}"
project_path="$repo_dir/src/Jyxr.ModEditor/Jyxr.ModEditor.csproj"
editor_url="http://127.0.0.1:5127"
log_dir="$repo_dir/.logs"
log_path="$log_dir/jyxr-editor.log"

is_editor_running() {
  curl --silent --fail --max-time 1 "$editor_url/" 2>/dev/null \
    | grep --quiet "JYXR MOD 编辑器"
}

show_error() {
  print ""
  print "启动失败：$1"
  print ""
  read "?按回车键关闭窗口..."
  exit 1
}

if is_editor_running; then
  print "JYXR MOD 编辑器已经运行，正在打开浏览器..."
  open "$editor_url"
  exit 0
fi

if lsof -nP -iTCP:5127 -sTCP:LISTEN >/dev/null 2>&1; then
  show_error "端口 5127 已被其他程序占用。"
fi

dotnet_path="$(command -v dotnet 2>/dev/null || true)"
[[ -n "$dotnet_path" ]] || show_error "找不到 dotnet，请先安装 .NET SDK。"
[[ -f "$project_path" ]] || show_error "找不到项目文件：$project_path"

mkdir -p "$log_dir"
print "正在启动 JYXR MOD 编辑器..."
print "日志：$log_path"

cd "$repo_dir" || show_error "无法进入项目目录：$repo_dir"
nohup "$dotnet_path" run --project "$project_path" </dev/null >"$log_path" 2>&1 &
server_pid=$!

for attempt in {1..120}; do
  if is_editor_running; then
    print "启动成功，正在打开浏览器..."
    open "$editor_url"
    exit 0
  fi

  if ! kill -0 "$server_pid" 2>/dev/null; then
    print ""
    tail -n 20 "$log_path"
    show_error "服务进程已退出，请查看上面的日志。"
  fi

  sleep 0.5
done

print ""
tail -n 20 "$log_path"
show_error "等待服务启动超时，请查看上面的日志。"
