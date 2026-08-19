# Change Log

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
