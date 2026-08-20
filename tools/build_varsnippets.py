#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""解析《代码片段.md》（常用 Var 定义），生成 data/varsnippets.json（幂等）。

文档结构：
    ### 1、时间                    ← 分类
    #### 1）鸿蒙、华为、荣耀        ← 平台组（顿号/逗号分隔；分类标题含「全平台」时无需此级）
    ##### 1.当天天气               ← 可选子名
    ```xml
    <Var name="..." expression="..." />
    ```

输出：[{"name": "时间", "category": "时间", "platforms": ["harmonyos", ...], "xml": "..."}]
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "varsnippets.json"

ALL_PLATFORMS = ["harmonyos", "huawei", "honor", "oppo", "vivo", "xiaomi"]

PLATFORM_TOKENS = [
    ("鸿蒙", "harmonyos"), ("harmonyos", "harmonyos"), ("next", "harmonyos"),
    ("华为", "huawei"), ("huawei", "huawei"),
    ("荣耀", "honor"), ("honor", "honor"),
    ("oppo", "oppo"),
    ("vivo", "vivo"),
    ("小米", "xiaomi"), ("xiaomi", "xiaomi"), ("mi", "xiaomi"),
]


def parse_platforms(text: str):
    """从标题文本解析平台列表；含「全平台」返回全部六个"""
    t = text.lower()
    if "全平台" in t:
        return list(ALL_PLATFORMS)
    found = []
    for kw, key in PLATFORM_TOKENS:
        if kw in t and key not in found:
            found.append(key)
    return found or None


def parse(md_path: Path):
    lines = md_path.read_text(encoding="utf-8").splitlines()
    result = []
    category = None
    category_platforms = None     # 分类标题自带的平台限定（如「全平台一致」）
    group_platforms = None
    sub_name = None
    in_block = False
    buf = []

    def flush():
        nonlocal buf
        xml = "\n".join(l for l in buf if l.strip()).strip()
        buf = []
        if not xml or not category:
            return
        platforms = group_platforms or category_platforms
        if not platforms:
            return
        name = category + ("-" + sub_name if sub_name else "")
        result.append({"name": name, "category": category,
                       "platforms": platforms, "xml": xml})

    for line in lines:
        s = line.strip()
        if s.startswith("```"):
            if in_block:
                flush()
            in_block = not in_block
            continue
        if in_block:
            buf.append(line.rstrip())
            continue
        m3 = re.match(r"^###\s+(.+)$", s)
        m4 = re.match(r"^####\s+(.+)$", s)
        m5 = re.match(r"^#####\s+(.+)$", s)
        if m5:
            sub_name = re.sub(r"^\d+\s*[.、．）)]\s*", "", m5.group(1)).strip().strip("`")
            continue
        if m4:
            t = re.sub(r"^\d+\s*[.、．）)]\s*", "", m4.group(1)).strip().strip("`")
            group_platforms = parse_platforms(t)
            sub_name = None
            continue
        if m3:
            t = re.sub(r"^\d+\s*[.、．）)]\s*", "", m3.group(1)).strip().strip("`")
            category_platforms = parse_platforms(t)
            category = re.sub(r"[（(].*?[）)]", "", t).strip()   # 分类名去掉「（全平台一致）」之类注记
            group_platforms = None
            sub_name = None
            continue
    return result


def main():
    md = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    candidates = [md] if md else [
        Path.home() / "Desktop" / "代码片段.md",
    ]
    src = None
    for c in candidates:
        if c and c.exists() and "```xml" in c.read_text(encoding="utf-8", errors="ignore"):
            src = c
            break
    if not src:
        print("[build_varsnippets] 未找到代码片段文档，跳过（保留现有 varsnippets.json）")
        return 0
    data = parse(src)
    if not data:
        print(f"[build_varsnippets] {src} 中未解析到任何片段，未改写输出")
        return 1
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    for e in data:
        print(f"  {e['name']}: {','.join(e['platforms'])} ({e['xml'].count(chr(10)) + 1} 行)")
    print(f"[build_varsnippets] 共 {len(data)} 个片段（源：{src}）-> {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
