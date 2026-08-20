# Change Log

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
