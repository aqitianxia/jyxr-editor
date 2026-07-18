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

运行编辑器前端纯逻辑测试：

```bash
cd tools/JsonEditor
npm test
```

运行编辑器后端资源写入策略测试：

```bash
dotnet test tools/JsonEditor.Tests/JsonEditor.Tests.csproj
```

运行项目测试：

```bash
dotnet test
```

编译 Godot C# 宿主项目：

```bash
dotnet build engine-free-rpg.csproj
```

如果只是改 JSON 内容，通常只需要启动编辑器并使用页面右上角的“检查”按钮；改了工具代码后再跑 `dotnet build tools/JsonEditor/JsonEditor.csproj`、前端测试和后端编辑器测试。

## 基本使用流程

1. 启动服务并打开 `http://localhost:5127`。
2. 在右上角“当前 MOD”选择要编辑的内容包。
3. 在左侧进入角色、地图、剧情、物品、商店、资源或高级数据等工作区。
4. 专用工作区提供对应的结构化创作流程；高级数据继续保留原始 JSON。文本编辑区使用 Monaco，支持行号、缩略代码地图、JSON/DSL 高亮、错误标记和光标定位。
5. 修改后点击“格式化”检查 JSON 格式。
6. 点击右上角“检查”运行完整内容检查。
7. 确认无误后点击“保存”。

保存时工具会：

- 格式化 JSON。
- 在 `tools/JsonEditor/.backups` 下创建时间戳备份。
- 自动运行一次内容校验。

## MOD 切换

右上角 MOD 选择器决定当前操作目标。所有读取、保存、内容检查、静态助手和剧情图分析都会使用当前 MOD id。

路径提示会显示当前目标，例如：

```text
正在编辑：金庸群侠传XR 扩展内容 · mods/jyxr-expansion/data
```

当前编辑器把每个 MOD 视为独立内容目录。运行时也仍是“一次选择一个 MOD 启动”，还没有正式的“基础 MOD + 扩展 MOD”依赖合并机制。

## 数据视图

“高级数据”列出当前 MOD 的原始内容文件。

- JSON 文件只提供完整 JSON 源码编辑，不再提供通用表单视图。
- 角色、地图、成长、门派、物品、商店、武学和资源通过各自的专用工作区进行结构化创作。
- 未提供专用工作区的内容直接在高级数据中编辑，保存时以当前 JSON 文本为准。
- Story 源文件统一在“剧情与任务”工作区使用 `DSL / JSON / 流程` 三种视图。

## 地图与事件工作区

“地图与事件”用于编辑地图本身、地图点位、点位事件和事件条件。条件编辑器与运行时解析器保持同一组 39 种条件类型，并对物品数量、人物等级、技能参数等结构化参数做即时检查。

- 大地图和小地图使用各自适用的点位与返回规则；大地图不会通过默认“添加返回”生成空目标事件。
- 地图选择、点位选择和详情编辑采用局部刷新，拖动画布时不会在每一帧重建整个表单。
- 右侧“检查与 JSON”显示当前地图的原始 JSON，可编辑、校验并应用到当前草稿。
- 应用 JSON 会保留编辑器暂不认识的字段，但不会立即写盘；完成后仍需点击顶部“保存”，统一写回 `maps.json`。
- 地图图片、背景和图标查找规则与运行时约定不变。编辑器只建立文件名索引加速兜底匹配，不会改写资源路径，也不会导致原本可找到的图片失效。

人物、物品和地图等大列表只在选择变化时局部更新列表状态和详情；图片预览通过预建 basename 索引解析。当前实现仍会在首次进入工作区时生成完整列表，极大内容包后续会继续引入虚拟列表。

## 加载与性能

编辑器不会在首页一次性加载所有重功能：

- 首页加载工作区信息、当前 MOD 数据文件清单和轻量内容索引。
- Monaco 只在首次进入源码编辑时加载；加载失败会回退到普通文本框。
- 资产目录只在首次进入需要资源预览的工作区时加载。
- 剧情图只在进入剧情工作区和流程视图时构建。
- 完整内容校验和头像检查由右上角“检查”或明确操作触发，问题汇总结果会缓存并延迟刷新。

保存仍会格式化完整 JSON 文件、创建时间戳备份，并在写入后运行内容校验。按需加载只减少无关读取和界面重绘，不改变文件路径、资源解析规则或保存格式。

## 剧情与任务工作区

“剧情与任务”把同名 `.story` 与 `.story.json` 合并为一个剧情文档，并提供三个平级视图：

- `DSL`：面向创作的 Story DSL 文本。
- `JSON`：游戏运行时读取的 Story JSON。
- `流程`：从当前草稿实时投影的只读流程图。

每个文档只有一种可写源：

- 存在 `.story` 时，DSL 是可写源，JSON 是实时编译的只读预览。
- 只有 `.story.json` 时，JSON 是可写源，DSL 是实时反编译的只读预览。
- JSON-only 文档可以显式“转换为 DSL 源”。转换前会执行 JSON → DSL → JSON 深度比较；未知字段、数组顺序、字段缺失、值或类型发生变化时会阻止转换，不允许强制覆盖。

流程视图支持：

- 当前段落邻域、当前剧情线、当前文件和全库聚合四种范围。
- 全部、问题、入口和孤立节点筛选。
- 选中节点后强调直接上下游，点击画布空白清除聚焦。
- 从全库剧情线下钻到段落，再定位回 DSL 或 JSON 源码。
- 当前文件最多绘制 500 个 segment，并明确显示截断状态。

流程布局、缩放、选择和筛选都只存在编辑器内存，不写入 MOD JSON，也不会改变游戏剧情 schema。

## Story DSL 编辑

新剧情推荐直接创建 `.story` 源文件，例如：

```text
mods/jyxr-expansion/data/story/book-shujian.story
```

在“剧情与任务”打开 `.story` 文件时：

- `DSL` 是可编辑源文件。
- `JSON` 是只读编译预览。
- 左侧文档目录会把 `.story` 和同名 `.story.json` 合并，段落目录可按 segment id 搜索和定位。
- 保存 `.story` 时会先编译 DSL，再生成同名 `.story.json`，例如 `book-shujian.story.json`。
- 游戏运行时仍只读取 `.story.json`。
- DSL 会做轻量静态检查：`jump` 目标剧情段、`battle` 战斗、`map` 地图、`shop` 商店，以及 `item` / `cost_item` / `random_item` 物品引用不存在时会在右侧显示错误。
- Monaco 会补全结构片段、正式剧情命令、已有说话人，以及当前 MOD 的剧情段、角色、物品、地图、商店、战斗、门派、成长模板和技能引用。
- 如果 Monaco 静态资源加载失败，页面会退回普通文本框，仍可编辑和保存。

DSL 支持剧情段、对白、命令、选择、条件、战斗分支和跳转：

```text
# 书剑入口
南贤：这里是书剑剧情。
主角：要做什么？
- 领取奖励
  random_item [小还丹, 王母蟠桃] 1
  log 书剑剧情已领取奖励
  jump 书剑结束

# 书剑结束
南贤：结束。
```

列表参数使用 `[甲, 乙, 丙]`，中英文逗号都可以；保存后会编译为运行时支持的 `["list", "甲", "乙", "丙"]`。需要保留空格或 `//` 的字符串参数可以使用 JSON 风格双引号。

### DSL 基本语法

剧情段使用顶格标题：

```text
# 段名
```

对白使用“说话人 + 冒号 + 文本”，中英文冒号都可以：

```text
南贤：少侠，且慢。
主角: 我听着。
```

普通剧情命令直接写命令名和参数。参数按空格分隔，列表参数使用方括号：

```text
item 小还丹 1
cost_item 银票 2
get_money 500
random_item [小还丹, 王母蟠桃] 1
```

强跳转使用 `jump`：

```text
jump 下一段剧情
```

复用公共剧情段时使用 `call`，被调用段执行到末尾或 `return` 后回到调用点：

```text
call 公共奖励
南贤：已经回到原剧情。

# 公共奖励
item 小还丹 1
return
```

选择题写法是“提示对白”后面紧跟同级 `- 选项`，选项内容缩进 2 个空格：

```text
南贤：你要去哪？
- 去洛阳
  map 洛阳
- 继续聊
  jump 继续聊天
```

按条件显示整组选项时，`when` 与提示对白和普通选项同级，组内选项再缩进一级：

```text
掌柜：客官需要什么？
- 离开
  jump 离开商店
when have_item 贵宾令 and $money > 100
  - 查看珍品
    jump 珍品列表
  - 领取赠礼
    call 贵宾赠礼
```

同一个 `when` 条件只在进入选择时求值一次。所有选项组都有条件时，编辑器会警告运行时可能没有可用选项。

条件分支支持 `if` / `elif` / `else`，分支内容缩进 2 个空格：

```text
if $money >= 500
  cost_money 500
  南贤：银两收下了。
elif $daode > 30
  南贤：看你为人不错。
else
  南贤：条件还不够。
```

战斗分支使用 `battle 战斗id`，结果分支只允许 `win` / `lose` / `timeout`：

```text
battle 新手战斗
- win
  get_money 100
  jump 战斗胜利
- lose
  jump 战斗失败
```

缩进规则：

- 不使用 Tab。
- 每一级缩进固定 2 个空格。
- `jump` 或 `return` 之后同级语句不可达，会作为错误提示。

### 常用剧情命令速查

DSL 的普通命令会编译为 story JSON 的 `kind: "command"`，实际执行仍由应用层剧情命令系统负责。当前常用命令包括：

| 类别 | 命令 | 示例 |
| --- | --- | --- |
| 物品 | `item` / `cost_item` / `random_item` | `item 小还丹 1` |
| 银两 / 元宝 | `get_money` / `cost_money` / `yuanbao` | `get_money 500` |
| 时间 | `cost_day` / `set_time_key` / `clear_time_key` | `cost_day 1` |
| 状态 | `set_flag` / `clear_flag` / `daode` / `haogan` / `rank` / `menpai` | `set_flag 初遇南贤` |
| 角色 | `join` / `follow` / `leave` / `leave_follow` / `leave_all` | `join 郭靖` |
| 成长 | `upgrade` / `grant_point` / `get_exp` / `levelup` / `maxlevel` | `grant_exp 主角 100` |
| 技能 | `learn` / `remove` / `growtemplate` | `learn skill 主角 野球拳 1` |
| 档案 | `nick` | `nick 武林新星` |
| 流程 | `map` / `shop` / `battle` / `jump` / `call` / `return` | `call 公共奖励` |
| 宿主表现 | `music` / `effect` / `background` / `suggest` / `toast` / `shake` / `head` / `animation` | `music music/main` |

命令参数是否有效取决于当前内容库。编辑器目前会静态检查 `jump`、`battle`、`map`、`shop` 和物品类引用；其他命令仍以运行时校验和内容校验结果为准。

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

### 保存失败或检查失败

先看右侧检查信息。常见原因包括 JSON 语法错误、引用了不存在的角色/物品/资源/剧情段，或字段类型不符合内容加载器要求。

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
