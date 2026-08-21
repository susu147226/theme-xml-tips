# -*- coding: utf-8 -*-
import io

p = 'package.json'
s = io.open(p, encoding='utf-8').read()
s = s.replace('"version": "2.2.4"', '"version": "2.2.5"')
io.open(p, 'w', encoding='utf-8').write(s)

p = 'README.md'
s = io.open(p, encoding='utf-8').read()
s = s.replace('2.2.4', '2.2.5')
io.open(p, 'w', encoding='utf-8').write(s)

entry = '''## 2.2.5 (2026-08-21)

- 语法检测更新：`Group` 标签全平台共享 `Image` 的全部属性（Image 支持的属性 Group 同样支持），属性补全、悬浮说明、取值校验同步生效
- 语法检测更新：`Mask` 标签除自身属性外同样共享 `Image` 的全部属性（自身属性优先），并同步展开通用属性别名（angle→rotation 等）
- 平台枚举覆盖对 Group/Mask 回退到 Image：如 OPPO/vivo 的 `scaleType="fit_width"` 在 Group、Mask 上同样合法

'''
p = 'CHANGELOG.md'
s = io.open(p, encoding='utf-8').read()
s = s.replace('# Change Log\n\n', '# Change Log\n\n' + entry, 1)
io.open(p, 'w', encoding='utf-8').write(s)
print('bumped to 2.2.5')
