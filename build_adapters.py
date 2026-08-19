# -*- coding: utf-8 -*-
"""Generate per-editor adapter packages from snippets/theme-snippets.json.

Outputs (under repo):
  adapters/webstorm/ThemeXmlTips.xml        (Live Templates, importable settings zip)
  adapters/hbuilderx/xml.json               (HBuilderX 自定义代码块)
  adapters/sublime/*.sublime-snippet        (Sublime Text snippets)
Outputs (under dist):
  ThemeXmlTips-WebStorm-<ver>.zip           (File > Manage IDE Settings > Import Settings)
  ThemeXmlTips-HBuilderX-<ver>.zip
  ThemeXmlTips-Sublime-Text-<ver>.zip
  adapters-<ver>.zip                        (all-in-one, embedded into installer exe)
"""
import json, os, re, zipfile, html

VER = "1.2.0"
ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, "dist")
SRC = os.path.join(ROOT, "snippets", "theme-snippets.json")
os.makedirs(DIST, exist_ok=True)

snippets = json.load(open(SRC, encoding="utf-8"))

def body_text(body):
    return "\n".join(body) if isinstance(body, list) else str(body)

# ---------- VS Code snippet placeholder -> plain/WebStorm ----------
PH = re.compile(r"\$\{(\d+)(?::((?:[^{}]|\{[^{}]*\})*))?\}|\$(\d+)|\$\{(\d+)\|([^}]*)\|\}")

def to_webstorm(text):
    """convert ${1:foo} / ${1|a,b|} / $1 / $0 to WebStorm $VAR1$ / $END$ and collect variables"""
    variables = {}
    def rep(m):
        if m.group(5) is not None:  # choice
            idx, opts = m.group(4), m.group(5).split(",")
            variables["VAR" + idx] = opts[0]
            return "$VAR" + idx + "$"
        if m.group(3) is not None:  # $1
            idx = m.group(3)
            if idx == "0":
                return "$END$"
            variables.setdefault("VAR" + idx, "")
            return "$VAR" + idx + "$"
        idx, default = m.group(1), m.group(2)
        if idx == "0":
            return "$END$"
        if default:
            variables["VAR" + idx] = default
        else:
            variables.setdefault("VAR" + idx, "")
        return "$VAR" + idx + "$"
    out = PH.sub(rep, text)
    return out, variables

def to_plain(text):
    """strip placeholders to plain text (for editors without placeholder support)"""
    def rep(m):
        if m.group(5) is not None:
            return m.group(5).split(",")[0]
        if m.group(3) is not None:
            return ""
        return m.group(2) or ""
    return PH.sub(rep, text)

def prefixes_of(spec):
    p = spec["prefix"]
    return p if isinstance(p, list) else [p]

def xml_attr(text):
    """escape for use inside a double-quoted XML attribute, preserving newlines/tabs"""
    return html.escape(text, quote=True).replace("\n", "&#10;").replace("\t", "&#9;").replace("\r", "&#13;")

# ---------- 1) WebStorm Live Templates ----------
tpl_entries = []
for name, spec in snippets.items():
    text, variables = to_webstorm(body_text(spec["body"]))
    desc = spec.get("description", name)
    for px in prefixes_of(spec):
        t = ['<template name="%s" value="%s" description="%s" toReformat="false" toShortenFQNames="false">'
             % (html.escape(px, quote=True), xml_attr(text), html.escape(desc, quote=True))]
        for vn, dv in sorted(variables.items(), key=lambda kv: int(kv[0][3:])):
            t.append('<variable name="%s" expression="" defaultValue="%s" alwaysStopAt="true" />'
                     % (vn, html.escape(dv, quote=True)))
        t.append('<context>'
                 '<option name="XML_TAG" value="true" />'
                 '<option name="XML_TEXT" value="true" />'
                 '<option name="XML_ATTRIBUTE" value="false" />'
                 '</context>')
        t.append('</template>')
        tpl_entries.append("\n".join(t))

ws_xml = ('<templateSet group="ThemeXmlTips">\n' + "\n".join(tpl_entries) + '\n</templateSet>\n')
ws_dir = os.path.join(ROOT, "adapters", "webstorm")
os.makedirs(ws_dir, exist_ok=True)
open(os.path.join(ws_dir, "ThemeXmlTips.xml"), "w", encoding="utf-8").write(ws_xml)

ws_zip = os.path.join(DIST, "ThemeXmlTips-WebStorm-%s.zip" % VER)
with zipfile.ZipFile(ws_zip, "w", zipfile.ZIP_DEFLATED) as z:
    z.writestr("templates/ThemeXmlTips.xml", ws_xml)

# ---------- 2) HBuilderX 自定义代码块 ----------
hx = {}
for name, spec in snippets.items():
    hx[name] = {
        "prefix": spec["prefix"],
        "body": spec["body"],
        "description": spec.get("description", name),
    }
hx_dir = os.path.join(ROOT, "adapters", "hbuilderx")
os.makedirs(hx_dir, exist_ok=True)
hx_json = json.dumps(hx, ensure_ascii=False, indent=2)
open(os.path.join(hx_dir, "xml.json"), "w", encoding="utf-8").write(hx_json)
hx_readme = (
    "HBuilderX 导入方法:\r\n"
    "1. 打开 HBuilderX -> 工具 -> 自定义代码块 -> 选择 xml.json\r\n"
    "2. 将本压缩包内 xml.json 的全部内容合并(复制)到打开的代码块文件中, 保存即可\r\n"
    "3. 在 .xml 文件中输入对应唤醒词(如 var / image-view / unlock / wallpaper / next)即可唤出代码块\r\n"
)
open(os.path.join(hx_dir, "README.txt"), "w", encoding="utf-8").write(hx_readme)
hx_zip = os.path.join(DIST, "ThemeXmlTips-HBuilderX-%s.zip" % VER)
with zipfile.ZipFile(hx_zip, "w", zipfile.ZIP_DEFLATED) as z:
    z.write(os.path.join(hx_dir, "xml.json"), "xml.json")
    z.write(os.path.join(hx_dir, "README.txt"), "README.txt")

# ---------- 3) Sublime Text snippets ----------
st_dir = os.path.join(ROOT, "adapters", "sublime")
os.makedirs(st_dir, exist_ok=True)
st_files = []
used = set()
for name, spec in snippets.items():
    text = body_text(spec["body"]).replace("]]>", "]]&gt;")
    desc = html.escape(spec.get("description", name))
    for px in prefixes_of(spec):
        fname = re.sub(r"[^\w.-]", "_", px) + ".sublime-snippet"
        base = fname; i = 2
        while fname in used:
            fname = base.replace(".sublime-snippet", "-%d.sublime-snippet" % i); i += 1
        used.add(fname)
        content = ("<snippet>\n    <content><![CDATA[%s]]></content>\n"
                   "    <tabTrigger>%s</tabTrigger>\n"
                   "    <scope>text.xml</scope>\n"
                   "    <description>%s</description>\n</snippet>\n") % (text, html.escape(px), desc)
        open(os.path.join(st_dir, fname), "w", encoding="utf-8").write(content)
        st_files.append(fname)
st_readme = (
    "Sublime Text 安装方法:\r\n"
    "1. 菜单 Preferences -> Browse Packages... 打开 Packages 目录\r\n"
    "2. 进入 User 子目录, 新建 ThemeXmlTips 文件夹\r\n"
    "3. 将本压缩包内全部 .sublime-snippet 文件复制进去\r\n"
    "4. 在 .xml 文件中输入唤醒词后按 Tab 即可展开代码片段\r\n"
)
open(os.path.join(st_dir, "README.txt"), "w", encoding="utf-8").write(st_readme)
st_zip = os.path.join(DIST, "ThemeXmlTips-Sublime-Text-%s.zip" % VER)
with zipfile.ZipFile(st_zip, "w", zipfile.ZIP_DEFLATED) as z:
    for f in st_files:
        z.write(os.path.join(st_dir, f), f)
    z.write(os.path.join(st_dir, "README.txt"), "README.txt")

# ---------- 4) all-in-one adapters zip (embedded in installer exe) ----------
ad_zip = os.path.join(DIST, "adapters-%s.zip" % VER)
with zipfile.ZipFile(ad_zip, "w", zipfile.ZIP_DEFLATED) as z:
    z.write(os.path.join(ws_dir, "ThemeXmlTips.xml"), "webstorm/ThemeXmlTips.xml")
    z.write(os.path.join(hx_dir, "xml.json"), "hbuilderx/xml.json")
    z.write(os.path.join(hx_dir, "README.txt"), "hbuilderx/README.txt")
    for f in st_files:
        z.write(os.path.join(st_dir, f), "sublime/" + f)
    z.write(os.path.join(st_dir, "README.txt"), "sublime/README.txt")

print("webstorm templates zip:", os.path.getsize(ws_zip))
print("hbuilderx zip:", os.path.getsize(hx_zip))
print("sublime snippets:", len(st_files), "->", os.path.getsize(st_zip))
print("adapters all-in-one:", os.path.getsize(ad_zip))
