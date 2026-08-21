# Change Log

## 2.2.1 (2026-08-21)

- 修正：华为/荣耀/vivo/小米平台的 `ContentProviderBinder` 内 `Variable` 的 type 支持 `int`（与 Var 一致），并新增类型校验（写错类型会标错）；华为 `Var`/`VariableCommand` 的 `type="int"` 规则确认生效
- 修正：鸿蒙平台 `Video`/`Image`/`Group`/`ImageNumber` 补齐 `active` 属性（与 `Button` 一致），不再误报且提供补全
- 新增：平台扩展标签的悬浮提示与代码补全——
  - 标签提示：输入 `<` 时按当前平台列出扩展标签（OPPO 31 个：FluidsView/PropertyAnimation/FilamentCommand 全家/WebpImage/Lottie/StereDropView 全家等；华为/荣耀/vivo/小米 20+ 个老引擎标签：Slider/Normal/Pressed/NormalState/VR/WaterWallpaper/ContentProviderBinder 等），带中文标题与功能描述
  - 属性提示：平台扩展标签内输入属性名时给出属性列表（类型、必填、说明）
  - 悬浮提示：悬停在平台扩展标签/属性上显示中文说明；不同平台同名标签显示各自平台的描述（如 vivo 与 OPPO 的 FluidsView）
## 2.2.0 (2026-08-21)

- 根据 OPPO 开放平台百变引擎/锁屏引擎全部章节（67 个补充文档页）完善 OPPO 平台语法规则：
  - 新增 33 个扩展标签放行：`CancelDelayCommand`/`VibratorCommand`/`CollBodyCommand`/`ParticleCommand`/`ProviderCommand`/`FullScreenCommand`/`FilamentCommand`(含 ModelAction/IndirectLightAction/AnimationAction/MaterialAction)/`PropertyAnimation`/`ValueAnimation`/`WebpImage`/`Lottie`/`GLModel`/`StereDropView`(含 StereoImage/StereoDropItem/ItemPosition/ItemVelocity/ItemConvergence)/`FluidsView`(含 CircleShape/PolygonShape)/`MusicControl`/`ReachedUpState`/`ReachedDownState`，及根标签 `Root`/`Fullscreen`/`Oneshot` 等写法变体
  - 新增 21 个 OPPO 全局变量提示：`time_sys`/`touch_pressure`/`ampm`/`year_lunar`/`raw_screen_width`/`view_width`/`feast`/`lunar_solar_term`/`sms_unread_count`/`ring_mode`/`wifi_state`/`data_state`/`music_state` 等
  - 新增 18 个 OPPO 函数提示：`ceil`/`sinh`/`cosh`/`strStartsWith`/`strEndsWith`/`strMatches`/`replace`/`strReplaceFirst`/`strTrim`/`strToLowerCase`/`strToUpperCase`/`arrayGet`/`arrayLength`/`randomSelect`/`mapGet`/`diffDate`/`eval`/`formatFloat`
  - OPPO 枚举按文档校准：`Trigger.action` 扩展 cancel/正常解锁/快速解锁/熄屏亮屏等 19 个取值并支持逗号多值；`ExternCommand.command` 支持 unlock/openFlashlight/closeFlashlight/closeScreen；`Command.value` 支持 toggle/on/off/normal/silent/vibrate（修复 RingMode/Wifi/Data 开关误报）；`Video.scaleType` 限定 fill/fit_width；`Mask.align` 限定 absolute/relative；`Image/Mask` 的 xfermode/hybridMode 支持 11 种混合模式
  - `ContentProviderBinder` 内 `Variable` 的 type 按 OPPO 文档校验（string/int/long/float/double/number），写错类型会标错
  - OPPO 根标签放行 frameRateBatteryFull/frameRateCharging/frameRateBatteryLow、主题卡 cardWidth 等扩展属性
- 枚举校验支持逗号分隔多值（如 `action="click,double"`），不再误报
## 2.1.0 (2026-08-21)

- 新增平台官方文档规则（荣耀开发者文档、华为 HarmonyOS 4.X 主题引擎规范、OPPO 百变/多彩引擎文档、vivo 锁屏引擎制作文档 doc/524/527/528/724）：
  - OPPO 多彩引擎（LiveWallpaper 动态壁纸）整体识别：根标签为 `<LiveWallpaper>` 时，`Elements/Rect/NormalVideo/InteractiveVideo/LottieElement/PanoramaElement/Animations/PositionAnim/RotateAnim/ScaleAnim/AlphaAnim/ActionAnim/ValueAnim/ScrollAnim/CutScenesAnim/SceneAnim/StartFrame/EndFrame/Methods/Method` 等 26 个多彩标签不再报「未知标签」，属性按多彩体系放行（标签配对与括号检测保留）
  - OPPO 补充多彩全局变量提示：`u_time`/`u_width`/`u_height`/`u_touchX`/`u_touchY`/`u_dark_mode`/`u_animatedValue`；补充函数提示：`floor`/`clamp`/`formatDate`/`formatTime`/`eqs`/`substr`
  - vivo 扩展标签放行：`VR`/`Paint`/`MeshImage` 子标签/`DropPhysicalView` 子标签/`ParticleScatter`/`WaterWallpaper`/`Marquee`/`PathUtil`/`FramerateController`/`RotateView`/`FluidsView`/`CircleShape`/`FluidsZone`/`FluidsParticleCommand`/`NormalState`/`PressedState`/`ReachedState`/`Intent`/`Slider` 等（华为/荣耀/小米的老引擎扩展标签同步放行）
  - vivo 补充全局变量提示：`weather_city`/`weather_wind_pow`/`weather_wind_dir`/`steps_value`/`sms_unread_count`/`call_missed_count`/`shake`；`Video.scaleType` 按 vivo 文档校验 `fill`/`fit_width`
  - 华为/荣耀/小米/vivo 补充 `eqs`/`substr` 字符串函数提示
- 真实工程回归修复（对华为/荣耀/OPPO/vivo/鸿蒙NEXT 五平台实机锁屏工程全量 lint 验证）：
  - `Trigger` 的 `action` 不再列为必填（Var threshold 阈值触发等场景使用无 action 的 `<Trigger>`，各平台均合法）
  - OPPO/vivo 等平台的 `ContentProviderBinder` 内 `Variable` 标签放行 `column`/`type` 属性（数据绑定写法）
  - `Mask` 的 `align` 放开枚举限制（支持 `absolute` 等定位取值）

## 2.0.0 (2026-08-21)

- 平台差异化语法判断（依据荣耀开发者文档、华为 HarmonyOS 4.X 主题引擎规范、OPPO 百变引擎文档、vivo 锁屏引擎文档及各平台实机代码交叉验证）：
  - `type` 取值按标签+平台区分：`Var`/`VarArray`/`VariableCommand` 为 number/string/number[]/string[]，华为/荣耀/OPPO/vivo/小米额外支持 `int`（天气场景）；鸿蒙NEXT 使用 `type="int"` 报错并给出修改建议；`Array`/`SensorBinder` 等业务型 type 不再误报枚举
  - 华为4.0：属性值含 `< > & ' "` 特殊字符报错（脚本规范）
  - 荣耀：string 类型变量的 expression 中使用 `ifelse` 给出警告
  - OPPO：残留 `globalPersist` 属性、误用 `#hour` 全局变量、锁屏缺少 `<Wallpaper src="..."/>` 一级子标签，均给出警告
  - vivo：误用 `#hour` 全局变量、使用 3D 翻转属性（rotationX/rotationY/rotation）给出警告
  - `Normal`/`Pressed`/`PathItem`/`Slider`/`Calendar`/`ContentProviderBinder` 等老引擎标签在非鸿蒙平台不再报「未知标签」
- 必填属性检查：结合规范参数说明核对缺失必填属性（`Var.name`、`Command.target/value`、`VariableCommand.name/expression`、`Trigger.action`、`ExternCommand.command`、`SoundCommand.sound`、`Video.name/src`、`ImageNumber.src/number`、`Mask.src`、`CountDownTime.name/date/countDownType`）；`Image` 要求 `src`/`srcExp` 至少其一
- 平台扩展全局变量提示：荣耀/华为/小米补充 weatherRespCode、festival、is_work_day、darkMode、农历与 system.time.* 等 MIUI 系全局变量；OPPO 补充 time_format、month_lunar、date_lunar；vivo 补充 weather_condition、weather_cur_temp、lunar_date 等天气/农历变量

## 1.9.7 (2026-08-21)

- 修复语法检测 6 类误报/漏报：
  - `condition` 属性放宽：该属性对非命令标签同样生效，不再报「不支持属性」
  - `action` 取值按标签判断：触发动作枚举（down/up/click 等）仅用于 Trigger/Button；KeepScreenOnCommand 校验 start/reset；其余标签的 action 不限制
  - `isFullScreenNode` 放行所有 Image/Video 类标签（Video、ImageNumber、ImageSeries、SourceImage）
  - `SoundCommand.sound` 支持声音文件路径字符串（不再被强制布尔校验），非 .mp3/.m4a/.amr/.wav 字面量路径给出提示；VariableCommand/Video 的 sound 音量浮点值不再误报
  - 数值类型属性写入纯字母等非法值时给出「应为数值或表达式」提示；数据标注布尔类型的属性校验 true/false
  - 新增规范 3.1 通用属性表判断：Time 不支持 width/height、Line 不支持 name/alpha、ImageNumber/ImageSeries 不支持 width/height/rotationX/rotationY 等 12 个视图标签按表报错（含 w/h/angle 等别名识别）；支持的通用属性即使数据缺失也放行

## 1.9.6 (2026-08-21)

- 修复：XML 错误检测跳过 IntentCommand 标签的属性级检测——该标签作为应用跳转标签，包名/类名/action 需适配多平台，不再报属性名与取值警告（标签配对检测仍保留）

## 1.9.5 (2026-08-21)

- 新增 XML 错误检测（仅 VS Code，实时写入问题面板，标注错误行）：
  - 标签书写：未闭合、闭合标签与开标签不匹配、无对应开标签、未知标签（对照规范 129 个标签）
  - 属性规范：标签不支持的属性名、枚举/布尔属性非法取值、表达式括号不配对
  - `Image srcExp` 平台写法区分：鸿蒙平台变量/表达式须 `{}` 包裹，其他平台须 `+` 直接拼接，写反即警告
  - 注释与 CDATA 自动跳过；可用 `themeXmlTips.enableDiagnostics` 关闭
- 新增自定义代码片段批量导入/导出（面板按钮 + 命令面板）：
  - 导出：全部自定义片段（含平台字段）→ JSON 文件
  - 导入：JSON（数组 / VS Code 对象格式）、`.sublime-snippet`（tabTrigger→唤醒词、description→描述、content→片段体、忽略 scope）、XML（整文件内容作片段体），导入自动转义、同唤醒词覆盖
- 集成测试扩至 101 个用例（新增场景 17：标签配对/属性/枚举/括号/srcExp 平台写法 16 项诊断断言 + 导入解析 6 项）

## 1.9.4 (2026-08-21)

- 新增内置代码片段：`button`（Button 按钮 + Triggers/Trigger 事件结构，四端同步）
- 自定义代码片段新增「平台」字段（选填：全平台/鸿蒙/华为/荣耀/OPPO/vivo/小米）：不选为全平台片段；选择具体平台后仅在该平台工程的 XML 文件中提示，其他平台不出现；设置项 `themeXmlTips.customSnippets` 同步支持 `platform` 属性
- 自定义片段面板新增搜索：关键词搜索（默认模糊匹配唤醒词/描述/片段内容，可切换精确匹配）+ 按平台下拉筛选
- 自定义片段列表新增平台列；非法平台值自动归一为全平台
- 集成测试扩至 78 个用例（新增场景 16：平台持久化、非法平台归一、按平台过滤、搜索 UI 断言）

## 1.9.3 (2026-08-21)

- 变量提取范围扩大：从仅 `<Var name>` 扩大到所有带 `name` 属性的标签（如 `<Image name="pic1">` 的元素名也可被 `#`/`@` 提示，标注来源标签）
- 新增 4 个引擎全局变量提示：`bmp_width`、`bmp_height`、`actual_w`、`actual_h`（图片宽度/高度，全局变量总数 134 → 138）
- 新增：提取文件中通过 `#`/`@` 使用但未用 `Var` 定义的变量，提示时标注「文件中使用（未用 Var 定义）」，悬停同步说明
- 集成测试扩至 63 个用例（新增场景 15：元素名提取、未定义变量、新全局变量、重名优先级）

## 1.9.2 (2026-08-20)

- 修复：自定义片段面板中删除功能不触发——VS Code Webview 沙箱禁用 confirm()/alert()（confirm 恒返回 false，postMessage 未发出），删除确认改为扩展侧原生模态框，表单必填校验改为内联错误提示
- 新增回归断言：面板 HTML 中禁止出现 confirm/alert

## 1.9.1 (2026-08-20)

- 新增：右键菜单「查看自定义代码片段」，列表新增代码片段预览列（前 50 字符），每行可快捷编辑/删除
- 新增：编辑表单内删除按钮，编辑现有片段时可直接删除
- 集成测试扩至 54 个用例（新增右键菜单与面板结构断言）

## 1.9.0 (2026-08-20)

- 新增自定义代码片段管理（仅 VS Code）：XML 文件右键菜单「新增 XML 代码片段」/ 命令面板「管理自定义代码片段」打开表格面板，支持新增、编辑、删除、表格查看；唤醒词、描述、代码片段均为必填
- 片段保存到本地 globalStorage 的 custom-snippets.json，JSON 序列化自动转义；插入时自动转义 `$`、`\`，修改保存后自动重新转义
- 支持在插件设置 `themeXmlTips.customSnippets` 中直接新增片段（与面板数据合并）
- 自定义片段即时生效：标签体内直接输入唤醒词（中英文）即提示；已输入 `<` 时自动去掉片段开头重复的 `<`
- 集成测试扩至 52 个用例（新增转义、本地存储、补全接入测试）

## 1.8.2 (2026-08-20)

- 数据更新：OPPO 平台快捷跳转移除 6 条个性化主题商店链接（Aa链接/萌叔/花兮/字遇系/嗨字/喵喵拯救世界链接），「主题」条目名称简化；快捷跳转总数 659 → 653
- 同步更新源文档，保证数据可幂等重建
- 集成测试的跳转条数断言改为从数据文件动态读取，源文档更新不再导致误报

## 1.8.1 (2026-08-20)

- 新增：命令标签（Command、VariableCommand、VideoCommand、CardInteractionCommand、StyleCommand、Collaboration*Command 等所有 `*Command` 标签）的 `name` 属性无需输入 `#`/`@` 即直接提示变量名（文件内 Var 定义优先 + 引擎全局变量）
- 不变：`expression` 属性仍按输入 `#`/`@` 触发变量提示，其余标签的提示行为不受影响
- 测试桩补齐 getWordRangeAtPosition，属性值上下文纳入集成测试（45 个用例）

## 1.8.0 (2026-08-20)

- 新增：快捷跳转与平台代码片段**免输 `<`**——在标签体内部直接输入中文名称（主题/微信/天气…）或英文关键词（intent/unlock/var…）即自动弹出提示
- 新增：通过 `configurationDefaults` 为 XML 文件默认开启 `editor.quickSuggestions`（含字符串内），保证直接打字即弹列表；关闭 wordBasedSuggestions 避免干扰
- 调整：与 Red Hat XML 扩展兼容共存，本扩展提示项排序置顶（sortText 优先），双方提示合并显示、本扩展主导
- 集成测试扩至 40 个用例（新增免输 `<` 直接触发与配置断言）

## 1.7.2 (2026-08-20)

- **重要修复**：补全/悬停 provider 误以裸函数注册，真实 VS Code 中抛 `provideCompletionItems is not a function` 导致所有动态提示（标签/属性/变量/函数/快捷跳转/平台片段）完全不工作——已改为对象注册并新增注册契约测试（离线桩测试此前直接调用函数，无法暴露该问题）
- 新增：打开或切换到 XML 文件时弹出平台识别结果（识别为【鸿蒙/华为/荣耀/OPPO/vivo/小米】或未识别），便于确认识别是否正确；每个文件每次会话提醒一次
- 新增：检测到 Red Hat XML 扩展时提醒一次（其部分版本在补全解析阶段会报错），可选择不再提示
- 修复：光标紧贴标签名时的属性补全项去掉空 filterText（空字符串在真实 VS Code 中会回退为按 label 过滤导致被过滤掉）

## 1.7.1 (2026-08-20)

- 修复：`<` 后输入中文过滤词（如 `<主`）被误判为属性上下文导致提示全空
- 修复：`<Button>` 等标签体内部无法唤起快捷跳转——现在标签体内输入 `<` 或 Ctrl+Space 均可唤起快捷跳转与平台代码片段
- 调整：快捷跳转提示项的提示词改为跳转名称本身（如 `主题`、`主题 +解锁`），filterText 同时含中文名与英文关键词（intent/unlock 等），中英文输入均可触发
- README 新增「如何唤醒各类提示」使用说明

## 1.7.0 (2026-08-20)

- 修复：光标紧贴完整标签名时（如 `<Var|`、`<Var|/>`）不显示属性提示的问题——现在同时给出该标签的全部属性，插入时自动补前导空格、不会覆盖标签名
- 调整：悬停文档不再显示规范章节号
- 调整：Wallpaper 桌面模板唤醒词由 `next` 改为 `wall-next`，四端（VS Code / WebStorm / HBuilderX / Sublime）同步
- 明确：标签与属性提示不区分平台，全平台一致提示（平台识别仅作用于快捷跳转与平台代码片段）
- 集成测试扩充至 26 个用例，新增紧贴标签名属性提示的回归测试

## 1.6.0 (2026-08-20)

- 新增平台代码片段：16 组常用 Var 定义（时间/日期/农历/平闰月判断/干支纪年/天气，含 OPPO 当天与三天天气两套写法），按平台识别结果过滤提示，未识别平台时全量列出并标注适用平台
- 新增 tools/build_varsnippets.py：从《代码片段》文档幂等生成 data/varsnippets.json
- 新增 tools/test_completion.js：端到端集成测试（stub vscode），覆盖鸿蒙/OPPO/小米/未知路径的跳转与片段过滤、误判防护，共 15 个用例

## 1.5.0 (2026-08-20)

- 新增平台识别：根据 XML 文件路径向上遍历父文件夹自动判断平台（鸿蒙/华为/荣耀/OPPO/vivo/小米），短拉丁关键词按词边界匹配避免误判（如 admin 不命中小米）
- 新增快捷跳转提示：内置 659 条各平台快捷跳转（IntentCommand），识别到平台时只提示该平台条目；每个跳转提供「单独跳转」与「跳转 + ExternCommand 解锁」两条提示；未识别平台时列出全部并标注平台名
- 新增 tools/build_shortcuts.py：从快捷跳转文档幂等生成 data/shortcuts.json，四平台差异化链接按平台后缀自动拆分
- 新增 tools/test_platform.js：平台识别离线测试（20 个用例）

## 1.4.0 (2026-08-20)

- 新增属性参数提示：枚举值扩充（varSpeedFlag 30 种变速函数、MediaCommand.command 9 种媒体命令、IntentCommand.action、VideoCommand.play 等），支持「标签.属性」级别的专属取值
- 新增表达式函数提示：36 个数字/字符串表达式函数（数学、条件、字符串三类），补全自带参数占位符，悬停显示参数说明
- 新增文件内变量提示：自动扫描当前 XML 中 `<Var name="...">` 定义的变量，输入 `#`/`@` 时优先提示
- 新增函数与文件内变量的悬停文档
- 修正 ExternCommand.command 取值为文档实际支持的 unlock

## 1.3.0 (2026-08-19)

- 新增 4 个百变卡片模板代码片段：`w2_h1`（1x2）、`w2_h2`（2x2）、`w4_h2`（2x4）、`w4_h4`（4x4），预置 w/h/click/pai 变量
- VS Code / WebStorm / HBuilderX / Sublime Text 四端代码片段保持同源一致（均由 snippets/theme-snippets.json 生成）

## 1.2.0 (2026-08-19)

- 插件作者更新为：云舒眠眠
- 新增编辑器适配：WebStorm（Live Templates 导入包）、HBuilderX（自定义代码块 xml.json）、Sublime Text（32 个 .sublime-snippet）；VS Code 保持原生扩展适配
- 安装程序升级：除 VS Code 原生安装外，自动释放多编辑器适配包，检测到 Sublime Text 时自动装入代码片段
- README 调整为多编辑器说明

## 1.1.0 (2026-08-19)

- 新增 18 个常用标签写法代码片段（var / command / var-command / extern-unlock / video-view / image-view / image-srcid / image-srcexp / image-rotate / image-align-rotate / image-3d / image-align-3d / imagenumber / group-alpha / group / imageseries / image-mask / triggers）
- 新增完整锁屏模板片段，唤醒词 `unlock` / `xml` / `theme`
- 新增 CommonWallpaper 桌面模板片段，唤醒词 `wallpaper` / `wall`
- 新增 Wallpaper 桌面模板片段，唤醒词 `next`
- 标签库新增：ImageNumber（数字图片常用写法）、SupportPictorialButton（OPPO 乐划锁屏按钮）
- 属性补充：Lockscreen.displayDeskTop、Image.isFullScreenNode、AniFrame.varSpeedFlag/value/time、Command/VariableCommand/ExternCommand.condition 等

## 1.0.0 (2026-08-19)

- 首次发布
- 覆盖主题引擎规范 v2.3 全部 127 个标签
- 标签 / 属性 / 枚举值 / 全局变量补全与悬停文档
- 根标签骨架代码片段（Lockscreen / Wallpaper / Widget / ChargingSkin）
- 提供 Windows 安装程序（exe）与 VSIX 安装包
