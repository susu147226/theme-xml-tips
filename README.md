# Theme XML Tips

主题引擎 XML 代码提示插件，适配 **VS Code**（原生扩展）、**WebStorm**、**HBuilderX**、**Sublime Text**。

作者：云舒眠眠

## 功能

- **标签补全**：输入 `<` 后提示全部主题引擎标签（Lockscreen、Wallpaper、Widget、Text、Image、Var、Trigger、各动画/命令/数据开放标签等），并按父子关系优先排序
- **属性补全**：在标签内按空格，提示该标签的全部属性，标注类型与「必填/选填」，自动补 `=""`
- **属性参数提示**：为有固定取值的属性提示支持的参数——枚举值（`align`、`scaleType`、`category`、`action` 等）、`varSpeedFlag` 的 30 种变速函数（SineFun_In ~ BounceFun_InOut）、`MediaCommand.command` 的 9 种媒体命令等；布尔属性提示 `true`/`false`
- **表达式函数提示**：在属性值中提示全部 36 个表达式函数（sin/cos/abs/ifelse/gt/le/substr/formatDate 等），补全后自动带参数占位符，悬停显示参数说明
- **变量补全**：在属性值中输入 `#`（数值）或 `@`（字符串），优先提示当前文件中的名字——提取范围覆盖**所有带 `name` 属性的标签**（`<Var>` 变量、`<Image name="pic1">` 等元素名），其次提示引擎全局变量（时间、电量、天气、运动健康、场景感知、图片尺寸 `bmp_width`/`bmp_height`/`actual_w`/`actual_h` 等 138 个）；文件中通过 `#`/`@` 使用但未定义的变量也会提示并标注「未用 Var 定义」
- **悬停文档**：悬停在标签、属性、变量、函数上显示中文说明
- **代码片段**：18 个常用标签写法 + 完整锁屏模板（`unlock`/`xml`/`theme`）+ 桌面模板（`wallpaper`/`wall`/`wall-next`）+ 百变卡片模板（`w2_h1`/`w2_h2`/`w4_h2`/`w4_h4`）等
- **平台识别**（仅 VS Code）：根据 XML 文件所在路径向上遍历父文件夹，自动识别平台——鸿蒙（鸿蒙/next/HarmonyOS/purax/pad/鸿蒙折叠 等）、华为（华为/4.0/huawei/hw）、荣耀（荣耀/honor）、OPPO（oppo 或父级存在 advance 文件夹）、vivo、小米（mi/小米/xiaomi）
- **快捷跳转提示**（仅 VS Code）：识别平台后，输入 `<` 即提示该平台可用的快捷跳转（IntentCommand，共 659 条），每个跳转提供两条提示——单独的快捷跳转、快捷跳转 + `<ExternCommand command="unlock" condition="#click" />` 解锁；无法识别平台时列出全部平台并标注平台名
- **平台代码片段**（仅 VS Code）：16 组常用 Var 定义片段（时间、日期、农历、平闰月判断、干支纪年、天气），按识别到的平台过滤——如鸿蒙工程只出鸿蒙写法、OPPO 工程只出 OPPO 写法；未识别平台时全部列出并标注适用平台
- **XML 错误检测**（仅 VS Code）：实时检测并标注错误行——标签配对（未闭合 / 闭合不匹配 / 多余闭合）、未知标签、标签不支持的属性名（含规范 3.1 通用属性支持/不支持表判断，`condition` 对所有标签放行）、枚举/布尔属性取值非法（`action` 等按标签区分取值）、数值类型属性非法值、表达式括号不配对；并按平台校验 `Image srcExp` 写法：鸿蒙平台变量需 `{}` 包裹（`srcExp="'bg_'+{int(#hour)}+'.jpg'"`），其他平台用 `+` 直接拼接（`srcExp="'bg_'+#hour+'.jpg'"`）。`IntentCommand` 为应用跳转标签，包名/类名/action 适配多平台，不做属性级检测。可在设置 `themeXmlTips.enableDiagnostics` 关闭
- **平台差异化语法判断**（仅 VS Code）：根据识别到的平台应用不同规则——鸿蒙NEXT：`Var type="int"` 报错（需改 `number` 或删除）；华为4.0：属性值禁止特殊字符 `< > & ' "`；荣耀：string 变量 expression 中不支持 `ifelse`；OPPO：检测残留 `globalPersist`、误用 `#hour` 全局变量、锁屏缺少一级子标签 `<Wallpaper src="..."/>` 均给出提示；vivo：提示无 `#hour` 全局变量、不支持 3D 翻转（rotationX/rotationY/rotation）；`Var`/`VarArray`/`VariableCommand` 的 `type` 枚举按平台区分（华为/荣耀/OPPO/vivo/小米额外支持 `int`，天气场景常用）；`Normal`/`Pressed`/`PathItem`/`Slider`/`Calendar`/`ContentProviderBinder` 等老引擎标签在非鸿蒙平台不再报「未知标签」
- **必填属性检查**（仅 VS Code）：结合规范参数说明核对缺失必填属性——如 `Var.name`、`Command.target/value`、`Trigger.action`、`ExternCommand command`、`Mask.src` 等；`Image` 要求 `src`/`srcExp` 至少填写其一
- **平台扩展全局变量提示**（仅 VS Code）：按平台补充全局变量——荣耀/华为/小米（MIUI 系）补充 `weatherRespCode`、`festival`、`is_work_day`、`darkMode`、`lunarYear/lunarMonth/lunarDay`、`system.time.hour1` 等；OPPO 补充 `time_format`、`month_lunar`、`date_lunar` 及多彩引擎 `u_time`/`u_width`/`u_height`/`u_touchX`/`u_touchY`/`u_dark_mode` 等；vivo 补充 `weather_condition`、`weather_cur_temp`、`weather_city`、`steps_value`、`lunar_date` 等
- **平台扩展函数提示**（仅 VS Code）：OPPO 补充 `floor`/`clamp`/`formatDate`/`formatTime`/`eqs`/`substr`；华为/荣耀/vivo/小米补充 `eqs`/`substr` 字符串函数
- **OPPO 多彩引擎支持**（仅 VS Code）：根标签为 `<LiveWallpaper>` 的动态壁纸脚本，识别多彩引擎标签体系（`Rect`/`Elements`/`Animations`/`Methods` 等 26 个标签），不再误报未知标签
- **自定义片段导入导出**（仅 VS Code）：面板一键批量导入/导出；支持导入 JSON（数组或 VS Code 对象格式）、`.sublime-snippet`（自动提取 tabTrigger 为唤醒词、description 为描述、content 为片段体、忽略 scope）、XML 文件（整个文件内容作为片段体，自动转义）

## 安装

### 方式一：安装程序（Windows，推荐）

下载 Release 中的 `ThemeXmlTips-Setup-2.2.3.exe` 双击运行：

- 自动定位 VS Code 并安装原生扩展（`code --install-extension`）
- 在 exe 同目录释放 `ThemeXmlTips-Adapters\` 适配包（webstorm / hbuilderx / sublime）
- 检测到 Sublime Text 时自动把代码片段装入 `Packages\User\ThemeXmlTips\`

### 方式二：各编辑器手动安装

**VS Code（原生适配）**

1. 下载 Release 中的 `theme-xml-tips-2.2.3.vsix`
2. VS Code → 扩展面板 → `...` → `Install from VSIX...` → 选择该文件

或命令行：

```bash
code --install-extension theme-xml-tips-2.2.3.vsix
```

**WebStorm（Live Templates）**

1. 下载 Release 中的 `ThemeXmlTips-WebStorm-2.2.3.zip`
2. `File` → `Manage IDE Settings` → `Import Settings...` → 选择该 zip，重启后生效
3. 在 `.xml` 文件中输入唤醒词（如 `var`、`image-view`、`unlock`）即可展开模板

**HBuilderX（自定义代码块）**

1. 下载 Release 中的 `ThemeXmlTips-HBuilderX-2.2.3.zip` 并解压
2. `工具` → `自定义代码块` → 打开 `xml.json`，将压缩包内 `xml.json` 的内容合并进去保存
3. 在 `.xml` 文件中输入唤醒词即可唤出代码块

**Sublime Text（Snippets）**

1. 下载 Release 中的 `ThemeXmlTips-Sublime-Text-2.2.3.zip` 并解压
2. `Preferences` → `Browse Packages...` → 进入 `User` → 新建 `ThemeXmlTips` 文件夹
3. 将全部 `.sublime-snippet` 文件复制进去，在 `.xml` 文件中输入唤醒词按 Tab 展开

## 常用标签写法速查

以下 18 个常用写法均已内置为代码片段，输入对应唤醒词即可唤出：

```xml
1)  <Var name="" expression="" persist="" const="" />
2)  <Command target="" value=""/>
3)  <VariableCommand name="" expression="" condition="" />
4)  <ExternCommand command="unlock" condition="#click" />
5)  <Video name="" defaultBitmap="" src="" x="" y="" w="" h="" scaleType="" play="" looping="" visibility="" />
6)  <Image src="" x="" y="" w="" h="" scaleType="" isFullScreenNode="" visibility="" />
7)  <Image src="" srcid="" visibility="" />
8)  <Image srcExp="" visibility="" />
9)  <Image src="" w="" h="" pivotX="" pivotY="" angle="" />
10) <Image src="" w="" h="" align="" alignV="" pivotX="" pivotY="" angle="" />
11) <Image src="" w="" h="" rotationX="" rotationY="" rotation="" />
12) <Image src="" w="" h="" align="" alignV="" rotationX="" rotationY="" rotation="" />
13) <ImageNumber name="" src="" number="" visibility="" />
14) <Group alpha="" x="" y="" visibility=""></Group>
15) <Group x="" y="" visibility=""></Group>
16) <ImageSeries src="" space="" mapList="" />
17) <Image src="">
        <Mask src="" align="" hybridMode=""/>
    </Image>
18) <Triggers>
        <Trigger action="">
        </Trigger>
    </Triggers>
```

| 编号 | 唤醒词（prefix） |
|------|------------------|
| 1 | `var` |
| 2 | `command` |
| 3 | `var-command` |
| 4 | `extern-unlock` |
| 5 | `video-view` |
| 6 | `image-view` |
| 7 | `image-srcid` |
| 8 | `image-srcexp` |
| 9 | `image-rotate` |
| 10 | `image-align-rotate` |
| 11 | `image-3d` |
| 12 | `image-align-3d` |
| 13 | `imagenumber` |
| 14 | `group-alpha` |
| 15 | `group` |
| 16 | `imageseries` |
| 17 | `image-mask` |
| 18 | `triggers` |

## 模板代码片段

| 唤醒词 | 内容 |
|--------|------|
| `unlock` / `xml` / `theme` | 完整锁屏模板：滑动方向判断、开屏动画、开屏命令、全局按钮、解锁命令（含 OPPO 乐滑兼容段） |
| `wallpaper` / `wall` | CommonWallpaper 桌面模板（预置 w/h/pai/h2/click 变量） |
| `wall-next` | Wallpaper 桌面模板（预置 w/h/pai/h2/click 变量） |
| `lockscreen` | 锁屏 manifest 基础骨架 |
| `chargingskin` | 充电动效换肤骨架 |
| `widget-card` | 百变卡片骨架 |
| `w2_h1` | 百变卡片模板：1x2 卡片（预置 w/h/click/pai 变量） |
| `w2_h2` | 百变卡片模板：2x2 卡片（预置 w/h/click/pai 变量） |
| `w4_h2` | 百变卡片模板：2x4 卡片（预置 w/h/click/pai 变量） |
| `w4_h4` | 百变卡片模板：4x4 卡片（预置 w/h/click/pai 变量） |
| `button` | Button 按钮（含 Triggers/Trigger 事件结构） |
| `button-trigger` | Button 按钮 + 单个 Trigger 触发器 |

## 使用

打开主题工程的 `manifest.xml`（或任意 `.xml` 文件）即可获得提示：

```xml
<?xml version="1.0" encoding="utf-8"?>
<Lockscreen frameRate="60" screenWidth="1080">
    <Text x="100" y="400" size="38" text="小时：%d" format="%d" paras="#hour" />
</Lockscreen>
```

### 如何唤醒各类提示

**标签提示**：输入 `<` 即弹出全部标签列表，继续输入标签名（中英文）可过滤。

**属性提示**（不区分平台，全平台一致）：

- 输入完整标签名后按**空格**，如 `<Var `，弹出该标签的全部属性（标注类型、必填/选填），选中自动补 `=""`
- 光标**紧贴标签名**时（如 `<Var|`、`<Var|/>`）按 `Ctrl+Space`（或自动触发），标签与属性提示同时出现
- 在属性值引号内输入时，有固定取值的属性自动提示可选参数（枚举值、`true`/`false`、变速函数等）；输入 `#` 或 `@` 提示变量（当前文件内所有带 `name` 属性标签定义的名字优先，含未定义的 #/@ 使用名），输入函数名提示 36 个表达式函数并自动带参数占位符
- 命令标签（`Command` / `VariableCommand` / `VideoCommand` 等 `*Command`）的 `name` 属性**无需输入 `#`/`@`** 即直接提示变量名；`expression` 属性仍按 `#`/`@` 触发

**快捷跳转**（仅 VS Code，按平台识别结果过滤）：

- **无需输入 `<`**：在 `<Button>` 等标签体内部直接输入中文名称（如 `主题`、`微信`）或英文关键词（如 `intent`、`unlock`），提示列表自动弹出
- 每个跳转有两条：`名称`（单独跳转）与 `名称 +解锁`（跳转 + ExternCommand 解锁）
- 列表中的跳转项即为当前文件识别到的平台所支持的跳转；未识别平台时列出全部平台并标注（如 `主题（鸿蒙）`）

**平台代码片段**（仅 VS Code，按平台识别结果过滤）：

- **无需输入 `<`**：直接输入 `时间`、`农历`、`天气` 等中文名（或 `var` 等英文），选择 `代码片段·xxx` 一键插入该平台写法的常用 Var 定义
- 鸿蒙工程只出鸿蒙写法，OPPO 工程只出 OPPO 写法（含 `天气-当天天气`、`天气-昨天、今天、明天天气` 两套）；未识别平台时全部列出并标注适用平台

**与 Red Hat XML 扩展的关系**：两者可兼容共存，VS Code 会合并双方提示，本扩展的提示项排序置顶（标签/属性/变量/跳转优先于通用 XML 提示）。本扩展已为 XML 文件默认开启快速建议（quickSuggestions），确保直接输入中英文即弹出提示。

**模板代码片段**：在 XML 文件中直接输入唤醒词（如 `unlock`、`wall-next`、`w2_h1`），选择对应片段回车插入。

**自定义代码片段**（仅 VS Code）：

- **新增/查看**：在 XML 文件中**右键 → 新增 XML 代码片段 / 查看自定义代码片段**，或命令面板（`Ctrl+Shift+P`）执行 `管理自定义代码片段`，打开表格管理面板
- 列表以表格展示：唤醒词、描述、平台、代码片段（预览前 50 字符），每行含编辑、删除按钮；编辑表单内也有删除按钮
- 表格字段：唤醒词（必填）、描述（必填）、平台（选填：全平台/鸿蒙/华为/荣耀/OPPO/vivo/小米）、代码片段 xml格式（必填），保存/取消按钮
- **平台字段**：不选（全平台）则所有工程都提示；选择了具体平台后，仅当 XML 文件路径识别为该平台时才提示，其他平台不出现
- **搜索**：面板顶部支持按关键词搜索（默认模糊匹配唤醒词/描述/片段内容，勾选「精确匹配」则要求唤醒词或描述完全相等），并可按平台下拉筛选（全部平台 / 全平台未指定 / 各具体平台）
- 保存后片段写入本地文件 `%APPDATA%\Code\User\globalStorage\susu147226.theme-xml-tips\custom-snippets.json`（JSON 序列化自动完成引号/换行转义，插入时自动转义 `$`、`\`）；**修改后再次保存会自动重新转义**
- 也可在插件设置 `themeXmlTips.customSnippets` 中直接维护（数组项含 prefix/description/body/platform）
- 面板中以表格查看全部自定义片段，支持编辑与删除；保存后立即生效，直接输入唤醒词（中英文）即可提示插入
- **导入/导出**：面板「导入」「导出」按钮（或命令面板执行 `导入/导出自定义代码片段`）。导出为 JSON 数组；导入支持：本插件导出的 JSON、VS Code 原生片段格式 JSON、`.sublime-snippet`（提取 tabTrigger/description/content，忽略 scope）、`.xml` 文件（整文件内容作为片段体）；导入内容自动完成转义，唤醒词重复时覆盖

## 标签覆盖范围

| 分类 | 标签 |
|------|------|
| 应用范围（根标签） | Lockscreen、Wallpaper、Widget、ChargingSkin |
| 视图 | Text、Image、Image数值、Video、Time、DateTime、CountDownTime、ImageSeries、SourceImage、Mask、GroupImage、Geometrical（Rectangle/Circle/Ellipse/Arc/Line）、PathUtil、Swiper、Marquee、MeshImage、ParticleView、DropPhysicalView、Progress 等 |
| 组与控件 | Group、Button、Unlocker |
| 变量与表达式 | Var、GlobalVariable、VarArray、Array、Expression、StringExpression |
| 命令 | Command、SoundCommand、VisibilityCommand、IntentCommand、VideoCommand、VariableCommand、ExternCommand、GroupCommands、CycleCommand、RefreshWeatherCommand、RefreshHealthyCommand、StyleCommand、KeepScreenOnCommand、SwingCommand、CollaborationCommands、CollaborationSendCommand、CollaborationDisconnectCommand、EmotionCommand、ScenarioIntentCommand、CardInteractionCommand、ProgressCommand、MediaCommand 等 |
| 数据开放 | Weather、WeatherObject、MediaController、Healthy、HealthyObject、StepCount、BluetoothBattery、Scenarios、ScenarioElements |
| 适配功能 | SensorBinder、Shake、BatteryCharging、FrameRate、VariableFramerate、Microphone |
| 动画 | AlphaAnimation、PositionAnimation、RotationAnimation、SizeAnimation、SourceAnimation（SourcesAnimation）、VariableAnimation |
| 高级动效 | MeshImage-Translation、MeshImage-SinMotion、ParticleView、DropPhysicalView、CollisionWorld、StereoView、MultiLayer、Scene3D |

以及 Trigger、Position、Rotation、Alpha、Size、Source、AniFrame、Item、ItemGroup、Velocity、AngleVelocity、Angle、weight、PathData、Range、StartPoint、EndPoint、VariableBinders、CollBody、Texture2D、Camera3D、SceneModel3D、Layer、StereoGroup 等全部子元素标签。

## 发版与二次开发

新增/修改代码片段只需编辑 `snippets/theme-snippets.json`（`prefix` 支持字符串或数组，`body` 支持 `${1:默认值}`、`${1|选项1,选项2|}`、`$0` 占位符），VS Code / WebStorm / HBuilderX / Sublime Text 四端适配包由它自动生成，永远保持一致。

**本地一键发版**（同步版本号 → 四端打包 → git 提交/打 tag/推送 → 创建 Release 并上传产物）：

```bash
python release.py 1.3.1 -m "新增 xx 代码片段"
```

其他模式：`--no-git` 只打包；`--no-release` 打包+推送但不创建 Release。

**GitHub Actions 自动发版**（`.github/workflows/release.yml`）：

- 推送 main 且改动了 `snippets/**` 或 `package.json`（版本号已先改好）→ 自动构建并发版
- 或在 Actions 页面手动运行 `Build & Release`，填写版本号即可（会自动同步版本号并提交）

## License

MIT
