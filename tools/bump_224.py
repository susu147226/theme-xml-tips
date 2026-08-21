# -*- coding: utf-8 -*-
import io

p = 'package.json'
s = io.open(p, encoding='utf-8').read()
s = s.replace('"version": "2.2.3"', '"version": "2.2.4"')
io.open(p, 'w', encoding='utf-8').write(s)

p = 'README.md'
s = io.open(p, encoding='utf-8').read()
s = s.replace('2.2.3', '2.2.4')
io.open(p, 'w', encoding='utf-8').write(s)

entry = '''## 2.2.4 (2026-08-21)

- 鸿蒙平台 `type` 属性新增支持 `int` 类型（Var / VarArray / VariableCommand 的语法检查与值补全均已包含，与华为/荣耀/OPPO/vivo/小米一致）
- OPPO、vivo 平台的 `Image.scaleType` 属性值新增 `fit_width`（`Video.scaleType` 此前已支持），语法检查与值补全同步生效
- `VideoCommand` 标签新增 `sound` 属性（鸿蒙、华为平台均支持）：控制视频播放声音，支持 0~1 浮点音量或 true/false 开关，与 play 参数互斥；提供属性补全与悬浮说明

'''
p = 'CHANGELOG.md'
s = io.open(p, encoding='utf-8').read()
s = s.replace('# Change Log\n\n', '# Change Log\n\n' + entry, 1)
io.open(p, 'w', encoding='utf-8').write(s)
print('bumped to 2.2.4')
