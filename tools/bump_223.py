# -*- coding: utf-8 -*-
import io, re

# bump package.json
p = 'package.json'
s = io.open(p, encoding='utf-8').read()
s = s.replace('"version": "2.2.2"', '"version": "2.2.3"')
io.open(p, 'w', encoding='utf-8').write(s)

# bump README refs
p = 'README.md'
s = io.open(p, encoding='utf-8').read()
s = s.replace('2.2.2', '2.2.3')
io.open(p, 'w', encoding='utf-8').write(s)

# prepend CHANGELOG entry
entry = '''## 2.2.3 (2026-08-21)

- 修复（重要）：打包脚本遗漏 `data/platform_rules.json`，导致安装版扩展丢失全部平台差异化语法规则——华为/荣耀/OPPO/vivo/小米平台的 `type="int"` 误报"不在可选值中"，平台专属标签/属性/变量/函数规则全部失效。现已纳入 VSIX 打包清单，安装版与源码版行为一致
- 修复：华为平台"属性值禁止特殊字符"规则误报——表达式中的引号字符串字面量（如 `'甲'`、`'bg_'+{}+'.jpg'`）为合法用法，规则收窄为仅检查 `<`、`>`、`&`

'''
p = 'CHANGELOG.md'
s = io.open(p, encoding='utf-8').read()
s = s.replace('# Change Log\n\n', '# Change Log\n\n' + entry, 1)
io.open(p, 'w', encoding='utf-8').write(s)
print('bumped to 2.2.3')
