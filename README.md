# JYXR JSON 编辑器使用说明

JYXR JSON 编辑器是一个本地网页工具，用来编辑当前 Godot 工程里的 MOD JSON 内容。它会发现 `mods/*/mod.json`，读取所选 MOD 的 `data/` 目录，并从仓库根目录的 `assets/` 读取图片、音频等资源用于预览和复制路径。

工具只在本机运行，默认地址固定为：

```text
http://localhost:5127
```

它不是 Godot 场景编辑器，也不负责 PCK 导出、Godot 导入、外部任意目录管理或多个 MOD 的运行时合并。

## 运行前准备

1. 安装 `.NET 10 SDK`。
2. 确认已经拿到完整工程目录，目录里应有 `project.godot`。
3. 确认要编辑的 MOD 位于 `mods/<modId>`，并且至少包含：

```text
mods/<modId>/mod.json
mods/<modId>/data/
```

4. 如果需要预览头像、物品图、音乐等资源，确认资源位于仓库根目录的 `assets/`。

推荐从仓库根目录启动。工具后端会从当前目录向上查找 `project.godot`，所以在仓库子目录里启动通常也可以；在仓库外启动会失败。

## Windows 启动

PowerShell：

```powershell
cd C:\path\to\jyxr-web-editor
dotnet run --project .\tools\JsonEditor\JsonEditor.csproj
```

CMD：

```cmd
cd /d C:\path\to\jyxr-web-editor
dotnet run --project tools\JsonEditor\JsonEditor.csproj
```

看到类似 `Now listening on: http://localhost:5127` 后，打开浏览器访问：

```text
http://localhost:5127
```

停止服务：回到命令行窗口，按 `Ctrl+C`。

## macOS 启动

Terminal / zsh：

```bash
cd /path/to/jyxr-web-editor
dotnet run --project tools/JsonEditor/JsonEditor.csproj
```

看到类似 `Now listening on: http://localhost:5127` 后，打开浏览器访问：

```text
http://localhost:5127
```

停止服务：回到终端窗口，按 `Ctrl+C`。

## 常用命令

查看 .NET SDK 是否安装：

```bash
dotnet --list-sdks
```

启动 JSON 编辑器：

```bash
dotnet run --project tools/JsonEditor/JsonEditor.csproj
```

只编译 JSON 编辑器：

```bash
dotnet build tools/JsonEditor/JsonEditor.csproj
```

检查前端 JavaScript 语法：

```bash
node --check tools/JsonEditor/wwwroot/app.js
```

运行项目测试：

```bash
dotnet test
```

编译 Godot C# 宿主项目：

```bash
dotnet build engine-free-rpg.csproj
```

如果只是改 JSON 内容，通常只需要启动编辑器并使用页面右上角的“校验”按钮；改了工具代码后再跑 `dotnet build tools/JsonEditor/JsonEditor.csproj` 和 `node --check tools/JsonEditor/wwwroot/app.js`。

## 基本使用流程

1. 启动服务并打开 `http://localhost:5127`。
2. 在右上角“当前 MOD”选择要编辑的内容包。
3. 在左侧切换“数据 / 剧情 / 资产”。
4. 选择 JSON 文件后，可以用“JSON”直接编辑，也可以用“表单”编辑顶层数组记录。
5. 修改后点击“格式化”检查 JSON 格式。
6. 点击“校验”运行内容校验。
7. 确认无误后点击“保存”。

保存时工具会：

- 格式化 JSON。
- 在 `tools/JsonEditor/.backups` 下创建时间戳备份。
- 自动运行一次内容校验。

## MOD 切换

右上角 MOD 选择器决定当前操作目标。所有读取、保存、校验、静态助手和剧情图分析都会使用当前 MOD id。

路径提示会显示当前目标，例如：

```text
正在编辑：金庸群侠传XR 扩展内容 · mods/jyxr-expansion/data
```

当前编辑器把每个 MOD 视为独立内容目录。运行时也仍是“一次选择一个 MOD 启动”，还没有正式的“基础 MOD + 扩展 MOD”依赖合并机制。

## 数据视图

“数据”页列出当前 MOD 的 `data/**/*.json`。

- 顶层数组文件会显示文件卡片、记录数量和表单视图。
- `characters.json`、`items.json`、`resources.json`、`game-tips.json` 等文件可以用表单新增、复制、删除记录。
- 对象和数组字段会保留为 JSON 文本，避免隐藏丢字段。
- JSON 视图仍是最终来源，保存时以当前编辑内容为准。

## 剧情视图

“剧情”页读取 `story/*.story.json`，展示轻量剧情图：

- 分组和 segment 列表。
- 入口段。
- 跳转关系。
- 静态诊断信息。

剧情图目前偏只读分析，复杂剧情仍建议在 JSON 视图中编辑。

## Story DSL 编辑

新剧情推荐直接创建 `.story` 源文件，例如：

```text
mods/jyxr-expansion/data/story/book-shujian.story
```

在“数据”页打开 `.story` 文件时，编辑器会切换为 `DSL / JSON`：

- `DSL` 是可编辑源文件。
- `JSON` 是只读编译预览。
- 保存 `.story` 时会先编译 DSL，再生成同名 `.story.json`，例如 `book-shujian.story.json`。
- 游戏运行时仍只读取 `.story.json`。

DSL 支持剧情段、对白、命令、选择、条件、战斗分支和跳转：

```text
# 书剑入口
南贤：这里是书剑剧情。
主角：要做什么？
- 领取奖励
  random_item [小还丹, 王母蟠桃] 1
  jump 书剑结束

# 书剑结束
南贤：结束。
```

列表参数使用 `[甲, 乙, 丙]`，保存后会编译为运行时支持的 `["list", "甲", "乙", "丙"]`。

## 资产视图

“资产”页浏览仓库根目录 `assets/`。

- 图片和音频会尽量预览。
- 可复制资源路径。
- `resources.json` 的资源值通常写相对资源 id，例如 `head/qingbing`，不要写成随意的外部绝对路径。

MOD 资源覆盖走 PCK。编辑器不会把 loose assets 目录当作 MOD 覆盖来源。

## 静态助手

右侧检查区包含几类辅助工具：

- “对白头像助手”：为剧情说话人快速创建最小角色记录和头像资源记录。
- “头像检查”：检查角色头像、`resources.json`、剧情 speaker 和头像图片文件是否能串起来。
- “角色 / 物品检查”：检查常见静态引用问题。

对白头像推荐流程：

1. 把头像图片放到 `assets/art/head/`，推荐 `512x512` PNG，透明背景优先。
2. 在助手里填写：
   - speaker id，例如 `清兵`
   - display name，例如 `清兵`
   - portrait resource，例如 `头像.清兵`
   - portrait asset value，例如 `head/qingbing`
3. 点击“创建说话人”。

运行时对白头像解析链路是：

```text
story speaker -> characters.json -> portrait -> resources.json -> assets/art
```

## 常见问题

### 打不开 `http://localhost:5127`

先确认启动命令还在运行，没有被 `Ctrl+C` 停掉。也可以检查命令行里是否出现启动失败信息。

### 端口 5127 被占用

当前端口在 `tools/JsonEditor/Program.cs` 中固定为 `http://localhost:5127`。请先关闭另一个正在使用 5127 的进程，再重新启动。

macOS 可查看占用：

```bash
lsof -i :5127
```

Windows 可查看占用：

```powershell
netstat -ano | findstr :5127
```

### 提示找不到 `project.godot`

说明启动命令不是在工程目录或其子目录执行的。先 `cd` 到 `jyxr-web-editor` 仓库根目录，再运行启动命令。

### 页面没有显示 MOD

检查：

- `mods/` 目录是否存在。
- MOD 是否有 `mod.json`。
- MOD 是否有 `data/` 目录。
- `mod.json` 是否是合法 JSON。

### 保存失败或校验失败

先看右侧校验信息。常见原因包括 JSON 语法错误、引用了不存在的角色/物品/资源/剧情段，或字段类型不符合内容加载器要求。

保存前工具会备份旧文件，备份目录为：

```text
tools/JsonEditor/.backups
```

### 改了资源但游戏里没变化

JSON 编辑器只改 loose data 和辅助查看根 `assets/`。Godot 资源导入、PCK 打包和运行时资源覆盖不由这个工具处理。

## 开发说明

架构、接口、数据规则和已知限制见：

```text
tools/JsonEditor/DEVELOPMENT.md
```
