# -*- coding: utf-8 -*-
"""生成各平台 tagDocs（悬浮/补全文档数据）+ 老平台 variableTypeEnum"""
import json

p = 'data/platform_rules.json'
d = json.load(open(p, encoding='utf-8'))

def A(t, r, desc):
    o = {'type': t, 'description': desc}
    if r:
        o['required'] = r
    return o

# ============ OPPO 全量（67 个官方文档页）============
oppo = {
'Root': {'title': '百变引擎根标签', 'description': 'OPPO 百变引擎根标签之一（LockScreen/Root/Fullscreen/Oneshot/Widget）。支持通用根属性：screenWidth/version/frameRate/frameRateBatteryFull/frameRateCharging/frameRateBatteryLow/pressure/id/vibrate。version>=10000 时 hour 为系统常量。', 'attributes': {'screenWidth': A('数值', None, '设定屏幕宽度标准，如 1080'), 'version': A('数值', None, '语法版本，>=10000 时 hour 为系统常量、weather_index=1 查明日天气'), 'frameRate': A('数值', None, '屏幕刷新帧率，推荐 60'), 'frameRateBatteryFull': A('数值', None, '电量充满下刷新帧率，默认同 frameRate'), 'frameRateCharging': A('数值', None, '充电状态下刷新帧率'), 'frameRateBatteryLow': A('数值', None, '低电量（<20）刷新帧率，默认 30'), 'pressure': A('true/false', None, '是否支持按压屏幕压力值'), 'vibrate': A('true/false', None, '是否支持震动')}},
'Fullscreen': {'title': '全屏特效根标签', 'description': 'OPPO 主题卡全屏特效根标签（也写作 FullScreen），点击主题卡显示全屏内容，如烟花动画。支持所有通用根属性。', 'attributes': {'screenWidth': A('数值', None, '设定屏幕宽度标准'), 'frameRate': A('数值', None, '刷新帧率'), 'version': A('数值', None, '语法版本')}},
'Oneshot': {'title': '一镜到底根标签', 'description': 'OPPO 一镜到底资源包脚本根标签（也写作 OneShot）。支持所有通用根属性。一镜到底场景 ExternalCommands 支持 Trigger action="Launcher2Aod" 等桌面/息屏切换事件。', 'attributes': {'screenWidth': A('数值', None, '设定屏幕宽度标准'), 'frameRate': A('数值', None, '刷新帧率'), 'version': A('数值', None, '语法版本')}},
'CancelDelayCommand': {'title': '取消延迟命令', 'description': '取消通过 delay 延迟执行的命令。target 必须与目标命令的 tag 属性值一致。只取消延迟执行，已执行的逻辑无法取消。', 'attributes': {'target': A('字符串', '必填', '要取消的目标命令的 tag 值'), 'condition': A('数字', None, '执行条件，1 执行 0 不执行，默认 1')}},
'VibratorCommand': {'title': '震动命令', 'description': '设置设备震动效果（ColorOS 7+）。', 'attributes': {'duration': A('数值', None, '每次震动持续时间（毫秒）'), 'loop': A('0/1 或 true/false', None, '是否循环震动'), 'spacetime': A('数值', None, '两次震动间隔时间（毫秒）')}},
'CollBodyCommand': {'title': '刚体命令', 'description': '改变物理引擎中刚体的运动速度、受力方向、刚体属性和类型，配合 CollisionWorld 2D 物理碰撞使用。', 'attributes': {'collbodyid': A('字符串', '必填', '要调整的刚体 id'), 'forceX': A('float', None, 'x 方向受力调整，建议 ±10000000'), 'forceY': A('float', None, 'y 方向受力调整'), 'vx': A('float', None, 'x 方向速度调整'), 'vy': A('float', None, 'y 方向速度调整'), 'isActive': A('int', None, '0 为非刚体（可被穿过），默认 1 为刚体'), 'type': A('int', None, '2 为动态刚体，其他值/默认静态刚体')}},
'ParticleCommand': {'title': '流体粒子命令', 'description': '配合 FluidsView 动态增加/删除/重置流体。', 'attributes': {'target': A('字符串', '必填', '目标 FluidsView 的 name'), 'type': A('字符串', None, 'add 添加（需含 CircleShape/PolygonShape 子元素）/ delete 移除（配 deleteNum）/ reset 重置，默认 add'), 'color': A('字符串', None, '新增流体颜色（type=add 时可选）'), 'deleteNum': A('数字', None, '删除的流体数量，默认 100 最高 10000'), 'condition': A('数字', None, '执行条件，非 0 执行')}},
'ProviderCommand': {'title': '数据提供者命令', 'description': '访问其它应用 ContentProvider，执行对应方法。', 'attributes': {'action': A('字符串', '必填', '操作类型，目前支持 "call"'), 'uri': A('字符串', None, 'ContentProvider 完整 URI（与 authority 至少提供一个）'), 'authority': A('字符串', None, 'ContentProvider 的 authority'), 'method': A('字符串', None, 'action 为 call 时要调用的方法名'), 'extras': A('字符串', None, '额外参数，格式 "key=value"，多个用 " and " 分隔'), 'condition': A('表达式', None, '执行条件')}},
'FullScreenCommand': {'title': '全屏特效命令', 'description': '主题卡场景：点击拉起内置全屏页面，页面内容由脚本渲染，支持帧动画/音频/自动关闭。', 'attributes': {'path': A('字符串', None, '全屏脚本路径，默认 fullscreen_manifest.xml'), 'condition': A('表达式', None, '执行条件'), 'delay': A('数值', None, '延迟毫秒数'), 'delayCondition': A('表达式', None, '延时条件')}},
'FilamentCommand': {'title': '3D渲染命令', 'description': '对 FilamentView 执行切换模型、灯光环境、动画及替换素材。子标签：ModelAction/IndirectLightAction/AnimationAction/MaterialAction。', 'attributes': {'target': A('字符串', '必填', '目标 FilamentView 的 name'), 'condition': A('数字', None, '执行条件，默认 1'), 'delay': A('数字', None, '延迟执行时长，默认 0')}},
'ModelAction': {'title': '模型操作', 'description': 'FilamentCommand 子标签，切换 3D 模型文件。', 'attributes': {'path': A('字符串', None, '模型文件路径'), 'type': A('字符串', None, '模型类型：glb / gltf'), 'textureDir': A('字符串', None, 'gltf 模型纹理目录'), 'unitCubeTransform': A('字符串', None, '单位立方体根变换，三个数字逗号分隔，默认 "0,0,-4"')}},
'IndirectLightAction': {'title': '灯光操作', 'description': 'FilamentCommand 子标签，加载模型灯光环境。', 'attributes': {'path': A('字符串', None, '灯光文件路径（.ktx）'), 'intensity': A('数字', None, '灯光强度，默认 30000')}},
'AnimationAction': {'title': '模型动画操作', 'description': 'FilamentCommand 子标签，切换模型动画。animationIndex 与 animationName 同时存在时优先 animationIndex。', 'attributes': {'animationName': A('字符串', None, '播放动画的名称'), 'animationIndex': A('数字', None, '播放动画的下标'), 'loop': A('数字', None, '1 循环播放 / 0 只播一次，默认 1')}},
'MaterialAction': {'title': '素材纹理操作', 'description': 'FilamentCommand 子标签，替换模型素材纹理。', 'attributes': {'key': A('字符串', '必填', '素材名称'), 'texture': A('字符串', '必填', '素材纹理路径')}},
'PropertyAnimation': {'title': '属性动画', 'description': '将目标标签的属性从当前值渐变到最终值。property/value 支持逗号分隔多属性一一对应。同标签同属性多个动画同时播放时只执行最后一个。', 'attributes': {'target': A('字符串', '必填', '动画更新的标签对象名'), 'property': A('字符串', '必填', '更新的属性：x,y,z,w,width,h,height,alpha,scale,scaleX,scaleY,rotation,rotationX,rotationY，逗号分隔多个'), 'value': A('数字表达式', '必填', '属性最终值，与 property 一一对应'), 'duration': A('数字', None, '播放时长（毫秒），默认 500'), 'condition': A('数字表达式', None, '播放条件，0 不执行，默认 1'), 'easeExp': A('字符串', None, '缓动函数，如 BackEaseOut(1.1)')}},
'ValueAnimation': {'title': '数值动画', 'description': 'Trigger 子命令，动画改变数值。', 'attributes': {'target': A('字符串', None, '目标'), 'property': A('字符串', None, '属性'), 'value': A('数字表达式', None, '最终值'), 'duration': A('数字', None, '时长毫秒')}},
'WebpImage': {'title': 'Webp动图', 'description': '在界面上播放 webp 动图。内置变量：#name.state（0 IDLE/1 PLAY/2 PAUSE/3 END）、#name.isPlaying。可用 Command target="name.play"/"name.setSrc"/"name.loopCount" 控制。', 'attributes': {'src': A('字符串', '必填', 'webp 图片文件路径'), 'name': A('字符串', None, '标签名称，需全脚本唯一；需命令控制时必填'), 'loopCount': A('数字', None, '循环次数，<=0 为无限循环（默认）'), 'play': A('数字', None, '1 播放（默认）/ 0 暂停'), 'x': A('数字', None, '横向坐标'), 'y': A('数字', None, '纵向坐标'), 'w': A('数字', None, '宽度'), 'h': A('数字', None, '高度')}},
'Lottie': {'title': 'Lottie动画', 'description': '播放 lottie 动画（.json）。内置变量 #name.state/#name.isPlaying；Command 支持 name.play/setSrc/loopCount/progress/minProgress/maxProgress。', 'attributes': {'src': A('字符串', None, 'lottie 动画文件路径'), 'name': A('字符串', None, '标签名称，需唯一'), 'loopCount': A('数字', None, '循环次数，<=0 无限循环（默认）'), 'loopMode': A('字符串', None, '循环模式：restart 从头播放（默认）/ reverse 反向播放'), 'play': A('数字', None, '1 允许播放（默认）/ 0 不播放'), 'progress': A('数字', None, '当前播放进度 0-1'), 'minProgress': A('数字', None, '最小播放进度 0-1'), 'maxProgress': A('数字', None, '最大播放进度 0-1'), 'w': A('数字', None, '宽度'), 'h': A('数字', None, '高度'), 'x': A('数字', None, '横坐标'), 'y': A('数字', None, '纵坐标')}},
'GLModel': {'title': '3D模型', 'description': '3D 效果，可全方位旋转查看，支持自动旋转和跟手旋转。模型仅支持 obj 格式，需配套贴图与 mtl 文件。', 'attributes': {'src': A('字符串', None, '3D 模型文件名（.obj）'), 'cameraPos': A('数值', None, '摄像机位置，默认 -1 自动计算；0 表示原点在坐标中心'), 'autoRotateAngle': A('数值', None, '自动旋转每帧角度，默认 0 不自动旋转（跟手旋转）'), 'x': A('数值', None, '横坐标'), 'y': A('数值', None, '纵坐标'), 'width': A('数值', None, '宽度'), 'height': A('数值', None, '高度')}},
'StereDropView': {'title': '俯视下落', 'description': '粒子在屏幕内随机位置生成，整体向指定位置移动并逐渐变小变透明，呈下落效果。子标签：StereoImage（静态图）、StereoDropItem（下落粒子）。', 'attributes': {'width': A('数值', None, '视图宽度'), 'height': A('数值', None, '视图高度'), 'depth': A('数值', None, '视图深度，默认最小值 10'), 'bgSrc': A('字符串', None, '背景图')}},
'StereoImage': {'title': '俯视下落静态图', 'description': 'StereDropView 中的静态图片，可用 SourcesAnimation/SourceImage 设置帧动画。', 'attributes': {'src': A('字符串', None, '图片路径'), 'x': A('数值', None, 'x 坐标'), 'y': A('数值', None, 'y 坐标'), 'depth': A('数值', None, '图片深度，需小于 StereDropView 的 depth')}},
'StereoDropItem': {'title': '下落粒子', 'description': 'StereDropView 中的下落粒子效果。子标签：ItemPosition/ItemVelocity/ItemConvergence。', 'attributes': {'src': A('字符串', None, '粒子图片路径'), 'maxCount': A('数值', None, '粒子最大数量'), 'respawnCount': A('数值', None, '粒子重孵化数量')}},
'ItemPosition': {'title': '粒子位置', 'description': '定义 StereoDropItem 粒子出现位置。x/y 为归一化坐标（0,0 为屏幕中心，范围 -1~1）。', 'attributes': {'isRandom': A('true/false', None, '位置是否随机，默认 false'), 'x': A('数值', None, '初始 x（-1~1），不随机时有效'), 'y': A('数值', None, '初始 y（-1~1）'), 'z': A('数值', None, '初始 z（50~depth）')}},
'ItemVelocity': {'title': '粒子速度', 'description': '定义 StereoDropItem 粒子初始速度。isRandom=true 时在 (lowestVelocityX, velocityX) 间随机。', 'attributes': {'isRandom': A('true/false', None, '初始速度是否随机'), 'velocityX': A('数值', None, 'x 方向初始速度（像素/秒）'), 'velocityY': A('数值', None, 'y 方向初始速度'), 'velocityZ': A('数值', None, 'z 方向初始速度（深度/秒）'), 'lowestVelocityX': A('数值', None, '随机时 x 最低速度'), 'lowestVelocityY': A('数值', None, '随机时 y 最低速度'), 'lowestVelocityZ': A('数值', None, '随机时 z 最低速度')}},
'ItemConvergence': {'title': '粒子汇聚点', 'description': '定义粒子汇聚点和汇聚方式。', 'attributes': {'x': A('数值', None, '汇聚点 x，计算方式随 type'), 'y': A('数值', None, '汇聚点 y'), 'type': A('字符串', None, 'ratio：(-1,1) 比例值 / gravity：(-9.8,9.8) 配合重力传感器 / screen：屏幕坐标')}},
'FluidsView': {'title': '流体视图', 'description': '模拟流体流动效果，可设置颜色、数量、区域，支持自定义重力（配合 gravity 类型 SensorBinder）。子标签 CircleShape/PolygonShape；配合 ParticleCommand 动态增删流体。', 'attributes': {'name': A('字符串', '必填', '唯一标识，名称不可重复'), 'bgSrc': A('字符串表达式', None, '流体世界背景图'), 'bgColor': A('字符串表达式', None, '背景色（被背景图遮挡）'), 'color': A('字符串表达式', None, '液体颜色'), 'gravityRatio': A('数字表达式', None, '液体重力系数 0-1'), 'customGravity': A('true/false', None, 'true 时用 gravityX/gravityY 自定义重力'), 'gravityX': A('数字表达式', None, '横向重力（customGravity=true 生效），负值向左'), 'gravityY': A('数字表达式', None, '纵向重力，负值向下'), 'viscosity': A('数字表达式', None, '粘滞系数 0-1'), 'waterAlpha': A('数字表达式', None, '液体透明度 0-1，0 全透明'), 'waterAlphaThreshold': A('数字表达式', None, '混合透明度阈值 0-1，推荐 0.7'), 'scaleType': A('字符串', None, '背景图缩放：center_crop（默认）/fill/fill_center/no_scale'), 'weightScale': A('数字', None, '流体粒子权重 0-1，默认 0.05（控制阴影）'), 'weightRangeShift': A('数字', None, '权重范围 0-1，默认 0.8'), 'weightCutoff': A('数字', None, '权重阈值 0-1，默认 0.7'), 'mixColor': A('true/false', None, '是否混合不同颜色流体，默认 true'), 'refreshRate': A('数字表达式', None, '刷新率 30-90，默认 60，不建议大于 70'), 'debug': A('true/false', None, '调试模式，正式包必须为 false')}},
'CircleShape': {'title': '圆形形状', 'description': 'FluidsView/ParticleCommand 子元素，圆形流体或物体。屏幕宽映射为 3，xPosition 取值 0-3。', 'attributes': {'type': A('字符串', None, 'water 液体（默认）/ solid 透明固体 / staticBody 静态物体 / dynamicBody 动态物体'), 'radius': A('数字表达式', None, '圆形半径'), 'xPosition': A('数字表达式', None, '圆心 x 坐标（0-3）'), 'yPosition': A('数字表达式', None, '圆心 y 坐标'), 'density': A('数字表达式', None, '密度（type 非 water 时生效）'), 'src': A('字符串表达式', None, '绑定图片（staticBody/dynamicBody 时生效）')}},
'PolygonShape': {'title': '方形形状', 'description': 'FluidsView/ParticleCommand 子元素，方形流体或物体。hx/hy 比例最好保持图片宽高比。', 'attributes': {'type': A('字符串', None, 'water（默认）/ solid / staticBody / dynamicBody'), 'hx': A('数字表达式', None, '方形半宽'), 'hy': A('数字表达式', None, '方形半高'), 'xPosition': A('数字表达式', None, '中心 x 坐标（0-3）'), 'yPosition': A('数字表达式', None, '中心 y 坐标'), 'angle': A('数字表达式', None, '旋转角度 0-360'), 'density': A('数字表达式', None, '密度'), 'src': A('字符串表达式', None, '绑定图片')}},
'MusicControl': {'title': '音乐控件', 'description': '在界面上控制音乐播放与暂停（仅系统音乐）。必须包含 4 个 Button（music_prev/music_next/music_play/music_pause）和显示文字 Text（music_track/music_artist/music_display）。变量：#name.position_ms/#name.duration_ms/@name.position/@name.duration/#music_state。', 'attributes': {'name': A('字符串', None, '一般指定 music_control，生成带 name 前缀的变量'), 'visibility': A('0/1 或 true/false', None, '可见性控制')}},
'ReachedUpState': {'title': '到达抬起状态', 'description': 'Slider/Unlocker 的 StartPoint/EndPoint 子标签：到达目标点且手指离开屏幕时显示的内容。', 'attributes': {}},
'ReachedDownState': {'title': '到达按下状态', 'description': 'Slider/Unlocker 的 StartPoint/EndPoint 子标签：到达目标点且手指仍按下时显示的内容。', 'attributes': {}},
}
d['oppo']['tagDocs'] = oppo

# ============ 老引擎共享标签（华为/荣耀/vivo/小米 共有）============
shared = {
'Normal': {'title': '按钮正常状态', 'description': 'Button 子标签：按钮正常状态时显示的内容，可包含 Image/Text 等元素。', 'attributes': {}},
'Pressed': {'title': '按钮按下状态', 'description': 'Button 子标签：按钮按下状态时显示的内容，可包含 Image/Text 等元素。', 'attributes': {}},
'NormalState': {'title': '正常状态', 'description': 'Slider/Unlocker 的 StartPoint/EndPoint 子标签：正常状态下显示的元素，可含 Trigger（切换到该状态时触发）。', 'attributes': {}},
'PressedState': {'title': '按下状态', 'description': 'Slider/Unlocker 的 StartPoint/EndPoint 子标签：按下开始拖动时显示的元素。', 'attributes': {}},
'ReachedState': {'title': '到达状态', 'description': 'Slider/Unlocker 的 StartPoint/EndPoint 子标签：滑动到达目标区域时显示的元素。', 'attributes': {}},
'Slider': {'title': '滑块', 'description': '锁屏滑动激活操作：StartPoint 随手指移动落入 EndPoint 目标区域时松开即触发。', 'attributes': {'name': A('字符串', None, '滑块命名'), 'bounceInitSpeed': A('数值', None, '回弹动画初始速度（像素/秒），最小 100'), 'bounceAcceleration': A('数值', None, '回弹加速度，最小 10'), 'keyPoint': A('数值', None, '回弹点，可实现多次回弹'), 'visibility': A('0/1', None, '可见性，支持表达式')}},
'Intent': {'title': '跳转意图', 'description': 'Slider/Unlocker 的 EndPoint 子标签：滑动到达后执行的应用跳转。', 'attributes': {'action': A('字符串', None, 'intent 的 action'), 'type': A('字符串', None, 'intent 的 type'), 'category': A('字符串', None, 'intent 的 category'), 'package': A('字符串', None, '包名'), 'class': A('字符串', None, '类名')}},
'ContentProviderBinder': {'title': '数据绑定', 'description': '绑定访问 ContentProvider 数据（天气/计步/日历等），将查询列映射到变量。置于 VariableBinders 内。', 'attributes': {'uri': A('字符串', None, 'ContentProvider 的 URI，如 content://weather/weather'), 'name': A('字符串', None, 'Binder 名称标识'), 'columns': A('字符串', None, '查询列名，逗号分隔'), 'countName': A('字符串', None, '查询结果数量绑定到的变量名'), 'where': A('字符串', None, '查询条件（SQL WHERE）'), 'whereExp': A('字符串', None, 'WHERE 表达式，支持变量'), 'order': A('字符串', None, '排序（SQL ORDER BY）'), 'dependency': A('字符串', None, '依赖刷新')}},
'Calendar': {'title': '日历组件', 'description': '老引擎日历组件标签。', 'attributes': {}},
'ControlPoint': {'title': '控制点', 'description': 'FramerateController 等动画控制的控制点子标签。', 'attributes': {}},
'FramerateController': {'title': '帧率控制器', 'description': '按变量值控制动画帧率。', 'attributes': {}},
'Paint': {'title': '画笔', 'description': '画笔/绘制标签（老引擎）。', 'attributes': {}},
'ParticleScatter': {'title': '粒子散射', 'description': '粒子散射效果（老引擎）。', 'attributes': {}},
'PathItem': {'title': '路径点', 'description': 'Text 等标签的自定义路径子标签。', 'attributes': {'type': A('字符串', None, 'quadTo / lineTo'), 'controlX': A('数值', None, '控制点 x'), 'controlY': A('数值', None, '控制点 y'), 'x': A('数值', None, 'x 坐标'), 'y': A('数值', None, 'y 坐标')}},
'Rotate': {'title': '旋转', 'description': '网格化/位移动画的旋转子标签。', 'attributes': {'duration': A('数值', None, '动画时间（毫秒）'), 'repeat': A('0/-1', None, '重复次数，0 不重复，-1 无限循环'), 'delay': A('数值', None, '延迟毫秒数'), 'values': A('数值列表', None, '旋转参数，逗号分隔，2-5 个')}},
'RotateView': {'title': '旋转视图', 'description': '旋转视图（老引擎）。', 'attributes': {}},
'Scale': {'title': '缩放', 'description': '网格化缩放动画子标签。', 'attributes': {'duration': A('数值', None, '动画时间（毫秒）'), 'repeat': A('0/-1', None, '重复次数'), 'delay': A('数值', None, '延迟毫秒数'), 'values': A('数值列表', None, '缩放参数，逗号分隔')}},
'VR': {'title': 'VR全景图', 'description': '360° 全景图，支持陀螺仪切换视角和跟手切换。', 'attributes': {'src': A('字符串', None, '全景图资源名称'), 'srcid': A('数值', None, '资源名序号，可用变量切换多张全景图'), 'touchType': A('数值/true/false', None, '0 支持跟手切换，1 不支持')}},
'WaterWallpaper': {'title': '水波纹壁纸', 'description': '全屏水波纹效果，网格越多越细腻但消耗越大。', 'attributes': {'xmesh': A('数值', None, 'x 方向网格数'), 'ymesh': A('数值', None, 'y 方向网格数'), 'src': A('字符串', None, '资源文件'), 'torsion': A('数值', None, '扭曲度 1-10'), 'color': A('字符串', None, '触摸处顶点颜色，如 #0cf02b')}},
'Weight': {'title': '权重', 'description': '物理/动画权重子标签（老引擎）。', 'attributes': {}},
}
for k in ('huawei', 'honor', 'vivo', 'xiaomi'):
    d[k]['tagDocs'] = dict(shared)

# vivo 专有补充（doc/724 流体）
d['vivo']['tagDocs'].update({
'FluidsView': {'title': '流体视图', 'description': 'vivo 锁屏引擎流体流动效果。子标签 CircleShape/FluidsZone；配合 FluidsParticleCommand 动态增删流体。', 'attributes': {'name': A('字符串', '必填', '唯一标识'), 'bgSrc': A('字符串', None, '背景图'), 'color': A('字符串', None, '液体颜色'), 'gravityRatio': A('数字', None, '重力系数 0-1'), 'viscosity': A('数字', None, '粘滞系数 0-1'), 'waterAlpha': A('数字', None, '液体透明度 0-1'), 'refreshRate': A('数字', None, '刷新率')}},
'CircleShape': {'title': '圆形形状', 'description': 'vivo FluidsView 子元素：圆形流体/固体。', 'attributes': {'type': A('字符串', None, 'water / solid / staticBody / dynamicBody'), 'radius': A('数字', None, '半径'), 'xPosition': A('数字', None, '圆心 x'), 'yPosition': A('数字', None, '圆心 y')}},
'FluidsZone': {'title': '流体区域', 'description': 'vivo FluidsView 子元素：限定流体区域。', 'attributes': {}},
'FluidsParticleCommand': {'title': '流体粒子命令', 'description': 'vivo：动态增加/删除 FluidsView 中的流体。', 'attributes': {'target': A('字符串', '必填', '目标 FluidsView 的 name'), 'type': A('字符串', None, 'add / delete / reset'), 'deleteNum': A('数字', None, '删除数量')}},
})

# 老平台 Variable（数据绑定子标签）type 枚举：number/string/int
for k in ('huawei', 'honor', 'vivo', 'xiaomi'):
    d[k]['variableTypeEnum'] = ['number', 'string', 'int']

json.dump(d, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('oppo tagDocs:', len(oppo), '| shared:', len(shared), '| vivo total:', len(d['vivo']['tagDocs']))
