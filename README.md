# Theme XML Tips

主题引擎 XML 代码提示插件，适配 **VS Code**（原生扩展）、**WebStorm**、**HBuilderX**、**Sublime Text**。

作者：云舒眠眠

## 功能

- **标签补全**：输入 `<` 后提示全部主题引擎标签（Lockscreen、Wallpaper、Widget、Text、Image、Var、Trigger、各动画/命令/数据开放标签等），并按父子关系优先排序
- **属性补全**：在标签内按空格，提示该标签的全部属性，标注类型与「必填/选填」，自动补 `=""`
- **属性参数提示**：为有固定取值的属性提示支持的参数——枚举值（`align`、`scaleType`、`category`、`action` 等）、`varSpeedFlag` 的 30 种变速函数（SineFun_In ~ BounceFun_InOut）、`MediaCommand.command` 的 9 种媒体命令等；布尔属性提示 `true`/`false`
- **表达式函数提示**：在属性值中提示全部 36 个表达式函数（sin/cos/abs/ifelse/gt/le/substr/formatDate 等），补全后自动带参数占位符，悬停显示参数说明
- **变量补全**：在属性值中输入 `#`（数值）或 `@`（字符串），优先提示当前文件中 `<Var name="...">` 定义的变量，其次提示引擎全局变量（时间、电量、天气、运动健康、场景感知等 134 个）
- **悬停文档**：悬停在标签、属性、变量、函数上显示中文说明与章节号
- **代码片段**：18 个常用标签写法 + 完整锁屏模板（`unlock`/`xml`/`theme`）+ 桌面模板（`wallpaper`/`wall`/`next`）+ 百变卡片模板（`w2_h1`/`w2_h2`/`w4_h2`/`w4_h4`）等

## 安装

### 方式一：安装程序（Windows，推荐）

下载 Release 中的 `ThemeXmlTips-Setup-1.3.0.exe` 双击运行：

- 自动定位 VS Code 并安装原生扩展（`code --install-extension`）
- 在 exe 同目录释放 `ThemeXmlTips-Adapters\` 适配包（webstorm / hbuilderx / sublime）
- 检测到 Sublime Text 时自动把代码片段装入 `Packages\User\ThemeXmlTips\`

### 方式二：各编辑器手动安装

**VS Code（原生适配）**

1. 下载 Release 中的 `theme-xml-tips-1.3.0.vsix`
2. VS Code → 扩展面板 → `...` → `Install from VSIX...` → 选择该文件

或命令行：

```bash
code --install-extension theme-xml-tips-1.3.0.vsix
```

**WebStorm（Live Templates）**

1. 下载 Release 中的 `ThemeXmlTips-WebStorm-1.3.0.zip`
2. `File` → `Manage IDE Settings` → `Import Settings...` → 选择该 zip，重启后生效
3. 在 `.xml` 文件中输入唤醒词（如 `var`、`image-view`、`unlock`）即可展开模板

**HBuilderX（自定义代码块）**

1. 下载 Release 中的 `ThemeXmlTips-HBuilderX-1.3.0.zip` 并解压
2. `工具` → `自定义代码块` → 打开 `xml.json`，将压缩包内 `xml.json` 的内容合并进去保存
3. 在 `.xml` 文件中输入唤醒词即可唤出代码块

**Sublime Text（Snippets）**

1. 下载 Release 中的 `ThemeXmlTips-Sublime-Text-1.3.0.zip` 并解压
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
| `next` | Wallpaper 桌面模板（预置 w/h/pai/h2/click 变量） |
| `lockscreen` | 锁屏 manifest 基础骨架 |
| `chargingskin` | 充电动效换肤骨架 |
| `widget-card` | 百变卡片骨架 |
| `w2_h1` | 百变卡片模板：1x2 卡片（预置 w/h/click/pai 变量） |
| `w2_h2` | 百变卡片模板：2x2 卡片（预置 w/h/click/pai 变量） |
| `w4_h2` | 百变卡片模板：2x4 卡片（预置 w/h/click/pai 变量） |
| `w4_h4` | 百变卡片模板：4x4 卡片（预置 w/h/click/pai 变量） |

## 使用

打开主题工程的 `manifest.xml`（或任意 `.xml` 文件）即可获得提示：

```xml
<?xml version="1.0" encoding="utf-8"?>
<Lockscreen frameRate="60" screenWidth="1080">
    <Text x="100" y="400" size="38" text="小时：%d" format="%d" paras="#hour" />
</Lockscreen>
```

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
