#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""解析《快捷跳转》文档，生成 data/shortcuts.json（幂等，可重复运行）。

文档结构：
    #### 1、`华为`平台        ← 编号平台章节标题（#### 级别）
    ```xml
    <!-- 主题 -->
    <IntentCommand ... condition="#click" />
    ```

章节归属：
    华为/荣耀/OPPO/VIVO/mi → 对应平台
    第三方                → huawei/honor/oppo/vivo/xiaomi 四平台通用
    鸿蒙NEXT系统/鸿蒙第三方  → harmonyos
    四平台不一样第三方链接   → 按 "名称-平台：" 行内标签拆分归属

输出：{"huawei": [{"name": "主题", "xml": "<IntentCommand .../>"}, ...], ...}
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "shortcuts.json"

ANDROID_PLATFORMS = ["huawei", "honor", "oppo", "vivo", "xiaomi"]

# 章节标题（去掉编号、反引号、“平台”后缀）→ 目标平台列表；"multi" 表示按行内标签拆分
SECTION_MAP = [
    ("鸿蒙", ["harmonyos"]),
    ("华为", ["huawei"]),
    ("荣耀", ["honor"]),
    ("oppo", ["oppo"]),
    ("vivo", ["vivo"]),
    ("小米", ["xiaomi"]),
    ("mi", ["xiaomi"]),
    ("第三方", ANDROID_PLATFORMS),
    ("四平台", "multi"),
]

# 行内平台后缀 → 平台 key
SUFFIX_MAP = {
    "huawei": "huawei", "hw": "huawei",
    "hnt": "honor", "honor": "honor",
    "oppo": "oppo", "vivo": "vivo",
    "mi": "xiaomi", "xiaomi": "xiaomi",
}


def map_section(title: str):
    """返回 (平台列表 或 'multi' 或 None)"""
    raw = re.sub(r"^\s*\d+\s*[、.．]?\s*", "", title).strip().lower().replace("`", "")
    if "四平台" in raw:                      # 须先于 "平台" 剥离判断
        return "multi"
    if "鸿蒙" in raw:
        return ["harmonyos"]
    t = raw.replace("平台", "").strip()
    if "第三方" in t:
        return ANDROID_PLATFORMS
    for key, platforms in SECTION_MAP:
        if key in ("鸿蒙", "第三方"):
            continue
        if t == key or t.startswith(key):
            return platforms
    return None


def parse(md_path: Path):
    text = md_path.read_text(encoding="utf-8")
    lines = text.splitlines()
    result = {}
    section = None      # list[str] | 'multi' | None
    in_block = False
    cur_name = None
    cur_lines = []

    def add(platform, name, xml):
        xml = xml.strip()
        if xml:
            result.setdefault(platform, []).append({"name": name.strip(), "xml": xml})

    def flush():
        nonlocal cur_name, cur_lines
        if cur_name and cur_lines:
            xml = "\n".join(l for l in cur_lines if l.strip())
            if section == "multi":
                # 四平台区：仅收录带平台后缀的行内标签（无后缀者与 -oppo 重复且包名有歧义）
                m = re.match(r"^(.*?)[-—]([a-z]+)\s*$", cur_name.strip())
                if m and m.group(2).lower() in SUFFIX_MAP:
                    add(SUFFIX_MAP[m.group(2).lower()], cur_name.strip(), xml)
            elif section:
                for p in section:
                    add(p, cur_name, xml)
        cur_name, cur_lines = None, []

    for line in lines:
        s = line.strip()
        m = re.match(r"^#{2,5}\s+(.+)$", s)
        if m and not in_block:
            sec = map_section(m.group(1))
            if sec is not None:
                flush()
                section = sec
            continue
        if s.startswith("```"):
            if in_block:
                flush()
            in_block = not in_block
            continue
        if not in_block or not section:
            continue
        cm = re.match(r"^<!--\s*(.*?)\s*-->\s*$", s)
        if cm:
            flush()
            if section != "multi":          # 四平台区忽略注释条目（与行内标签重复）
                cur_name = cm.group(1)
            continue
        # 四平台区的行内标签："蛋仔派对-huawei：" 后跟命令行
        if section == "multi":
            lm = re.match(r"^([一-鿿\w（）()·]+?(?:[-—][a-z]+)?)\s*[：:]\s*$", s)
            if lm:
                flush()
                cur_name = lm.group(1)
                continue
        if cur_name and s:
            cur_lines.append(s)
    flush()
    return result


def main():
    md = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    candidates = [md] if md else [
        Path.home() / "Desktop" / "快捷跳转.md",
        Path.home() / "Desktop" / "主题开发" / "主题开发文档" / "2、快捷跳转.md",
    ]
    src = None
    for c in candidates:
        if c and c.exists() and "IntentCommand" in c.read_text(encoding="utf-8", errors="ignore"):
            src = c
            break
    if not src:
        print("[build_shortcuts] 未找到含 IntentCommand 的快捷跳转文档，跳过（保留现有 shortcuts.json）")
        return 0
    data = parse(src)
    if not data:
        print(f"[build_shortcuts] {src} 中未解析到任何快捷跳转条目，未改写输出")
        return 1
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    total = sum(len(v) for v in data.values())
    for k in ("harmonyos", "huawei", "honor", "oppo", "vivo", "xiaomi"):
        if k in data:
            print(f"  {k}: {len(data[k])} 条")
    print(f"[build_shortcuts] 共 {total} 条（源：{src}）-> {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
