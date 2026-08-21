# -*- coding: utf-8 -*-
"""condition 属性全平台同步：所有标签（基础库 + 各平台 tagDocs）统一支持 condition"""
import json

COND = {'type': '表达式', 'description': '触发条件：表达式结果为真（>0）时才生效/执行，如 condition="#battery_level>20"'}

# 1) 基础标签库 tags.json：所有标签补齐 condition
p1 = 'data/tags.json'
t = json.load(open(p1, encoding='utf-8'))
added = 0
for tag in t['tags']:
    attrs = tag.setdefault('attributes', {})
    if 'condition' not in attrs:
        attrs['condition'] = dict(COND)
        added += 1
json.dump(t, open(p1, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('tags.json 补 condition:', added, '个标签')

# 2) 平台扩展标签 tagDocs：所有平台所有标签补齐 condition
p2 = 'data/platform_rules.json'
d = json.load(open(p2, encoding='utf-8'))
added2 = 0
for plat in ('harmonyos', 'huawei', 'honor', 'oppo', 'vivo', 'xiaomi'):
    for name, doc in (d[plat].get('tagDocs') or {}).items():
        attrs = doc.setdefault('attributes', {})
        if 'condition' not in attrs:
            attrs['condition'] = dict(COND)
            added2 += 1
json.dump(d, open(p2, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('tagDocs 补 condition:', added2, '个平台标签')
