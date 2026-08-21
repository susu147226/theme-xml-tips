# -*- coding: utf-8 -*-
import io

p = 'package.json'
s = io.open(p, encoding='utf-8').read()
s = s.replace('"version": "2.2.5"', '"version": "2.2.6"')
io.open(p, 'w', encoding='utf-8').write(s)

p = 'README.md'
s = io.open(p, encoding='utf-8').read()
s = s.replace('2.2.5', '2.2.6')
io.open(p, 'w', encoding='utf-8').write(s)

entry = '''## 2.2.6 (2026-08-21)

- 语法检测更新：`DateTime`、`Time` 标签除自身属性外，全平台共享 `Text` 的全部属性（color/size/bold/textalign/textExp 等），属性补全、悬浮说明、取值校验同步生效
- 语法检测修复：数值类型属性（如 x/y/w/h/angle）的纯数字四则运算写法不再误报——`y="-52+1138"`、`y="(10+20)*2"` 等均为引擎合法表达式

'''
p = 'CHANGELOG.md'
s = io.open(p, encoding='utf-8').read()
s = s.replace('# Change Log\n\n', '# Change Log\n\n' + entry, 1)
io.open(p, 'w', encoding='utf-8').write(s)
print('bumped to 2.2.6')
