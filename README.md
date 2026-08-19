# HarmonyOS Theme XML Tips

适用于 VS Code 的 **HarmonyOS NEXT 主题引擎 XML 代码提示插件**。数据来源于《HarmonyOS NEXT主题引擎规范及指导 v2.3》，覆盖文档内全部 **127 个标签**、标签属性、枚举取值与 **134 个全局变量**。

## 功能

- **标签补全**：输入 `<` 后提示全部主题引擎标签（Lockscreen、Wallpaper、Widget、Text、Image、Var、Trigger、各动画/命令/数据开放标签等），并按父子关系优先排序
- **属性补全**：在标签内按空格，提示该标签的全部属性，标注类型与「必填/选填」，自动补 `=""`
- **枚举值提示**：为 `align`、`scaleType`、`category`、`action`（Trigger）等属性提供候选值；布尔属性提示 `true`/`false`
- **变量补全**：在属性值中输入 `#`（数值）或 `@`（字符串），提示引擎全局变量（时间、电量、天气、运动健康、场景感知等 134 个）
- **悬停文档**：悬停在标签、属性、变量上显示规范中的中文说明与章节号
- **代码片段**：`lockscreen` / `wallpaper` / `widget-card` / `chargingskin` 等骨架片段

## 安装

### 方式一：安装程序（Windows）

下载 Release 中的 `ThemeXmlTips-Setup-1.0.0.exe`，双击运行即可自动完成 VS Code 扩展安装（安装程序会自动定位 VS Code 并执行 `code --install-extension`）。

### 方式二：VSIX 手动安装

1. 下载 Release 中的 `theme-xml-tips-1.0.0.vsix`
2. VS Code → 扩展面板 → `...` → `Install from VSIX...` → 选择该文件

或命令行：

```bash
code --install-extension theme-xml-tips-1.0.0.vsix
```

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

## 数据说明

`data/tags.json` 由解析规范文档自动生成，包含每个标签的功能描述、规范章节号、属性（类型/必填/说明）、子元素关系，以及全局变量表。

## License

MIT
