# -*- coding: utf-8 -*-
"""Theme XML Tips 一键发版脚本（本地）。

用法:
    python release.py 1.3.1 -m "新增 xx 代码片段"
    python release.py 1.3.1            # 不发版，仅打包
    python release.py 1.3.1 --push-only ... 见下

流程:
  1. tools/set_version.py 同步版本号（package.json / Installer.cs / install.bat）
  2. 重新生成四端适配包（build_adapters.py）
  3. 构建 VSIX（build_vsix.py）
  4. csc 编译多编辑器安装程序 exe
  5. 打包源码 zip
  6. git 提交 + 打 tag + 推送
  7. 通过 GitHub API 创建 Release 并上传全部产物（凭据取自 git credential）

选项:
  -m, --message   Release 更新说明（多行用 \\n）
  --no-release    只打包和提交推送，不创建 GitHub Release
  --no-git        只打包，不做 git 操作（也不发 Release）
"""
import argparse, json, os, re, subprocess, sys, zipfile

ROOT = os.path.dirname(os.path.abspath(__file__))
CSC = r"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
REPO = "susu147226/theme-xml-tips"
DIST = os.path.join(ROOT, "dist")


def run(cmd, **kw):
    print("+", " ".join(cmd) if isinstance(cmd, list) else cmd)
    r = subprocess.run(cmd, cwd=ROOT, **kw)
    if r.returncode != 0:
        sys.exit("命令失败: %s" % cmd)


def assets(ver):
    return [
        ("ThemeXmlTips-Setup-%s.exe" % ver, "application/octet-stream"),
        ("theme-xml-tips-%s.vsix" % ver, "application/octet-stream"),
        ("ThemeXmlTips-WebStorm-%s.zip" % ver, "application/zip"),
        ("ThemeXmlTips-HBuilderX-%s.zip" % ver, "application/zip"),
        ("ThemeXmlTips-Sublime-Text-%s.zip" % ver, "application/zip"),
        ("theme-xml-tips-%s-source.zip" % ver, "application/zip"),
    ]


def build_source_zip(ver):
    sys.path.insert(0, os.path.join(ROOT, "tools"))
    import build_source_zip as bsz
    bsz.build()


def git_token():
    p = subprocess.run(["git", "credential", "fill"], cwd=ROOT,
                       input="protocol=https\nhost=github.com\n\n",
                       capture_output=True, text=True)
    for line in p.stdout.splitlines():
        if line.startswith("password="):
            return line[len("password="):]
    sys.exit("未找到 github.com 的 git 凭据，无法调用 GitHub API")


def gh_api(token, method, url, data=None, file=None, ctype=None):
    import urllib.request
    req = urllib.request.Request(url, method=method)
    req.add_header("Authorization", "Bearer " + token)
    req.add_header("Accept", "application/vnd.github+json")
    if file is not None:
        req.add_header("Content-Type", ctype)
        req.data = open(file, "rb").read()
    elif data is not None:
        req.add_header("Content-Type", "application/json")
        req.data = json.dumps(data).encode("utf-8")
    with urllib.request.urlopen(req) as resp:
        body = resp.read()
        return resp.status, json.loads(body) if body else {}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("version", help="新版本号，例如 1.3.1")
    ap.add_argument("-m", "--message", default="")
    ap.add_argument("--no-release", action="store_true")
    ap.add_argument("--no-git", action="store_true")
    a = ap.parse_args()
    ver = a.version
    if not re.match(r"^\d+\.\d+\.\d+$", ver):
        sys.exit("版本号格式应为 x.y.z")

    # 1. 版本号
    run([sys.executable, os.path.join("tools", "set_version.py"), ver])
    # 2~3. 适配包 + VSIX
    run([sys.executable, "build_adapters.py"])
    run([sys.executable, "build_vsix.py"])
    # 4. exe
    vsix = os.path.join(DIST, "theme-xml-tips-%s.vsix" % ver)
    ad = os.path.join(DIST, "adapters-%s.zip" % ver)
    exe = os.path.join(DIST, "ThemeXmlTips-Setup-%s.exe" % ver)
    run([CSC, "/nologo", "/target:exe", "/platform:anycpu",
         "/r:System.IO.Compression.dll", "/r:System.IO.Compression.FileSystem.dll",
         "/out:" + exe,
         "/resource:%s,ThemeXmlTips.vsix" % vsix,
         "/resource:%s,ThemeXmlTips.adapters" % ad,
         os.path.join("installer", "Installer.cs")])
    # 5. source zip
    build_source_zip(ver)
    for name, _ in assets(ver):
        assert os.path.exists(os.path.join(DIST, name)), "缺少产物: " + name
    print("== 打包完成 ==")

    if a.no_git:
        return
    # 6. git
    tag = "v" + ver
    run(["git", "add", "-A"])
    run(["git", "commit", "-m", "release: %s" % tag])
    run(["git", "tag", "-a", tag, "-m", "Release %s" % tag])
    run(["git", "push", "origin", "main"])
    run(["git", "push", "origin", tag])

    if a.no_release:
        return
    # 7. release
    token = git_token()
    notes = a.message or "Theme XML Tips %s" % tag
    body = "主题引擎 XML 代码提示插件，作者：云舒眠眠。\n\n**%s 更新**\n\n%s\n\n**Assets**\n\n%s" % (
        tag, notes,
        "\n".join("- `%s`" % n for n, _ in assets(ver)))
    status, rel = gh_api(token, "POST",
                         "https://api.github.com/repos/%s/releases" % REPO,
                         data={"tag_name": tag, "name": "Theme XML Tips %s" % tag, "body": body})
    rid = rel.get("id")
    if not rid:
        sys.exit("创建 Release 失败: %s" % rel)
    print("release id:", rid)
    for name, ctype in assets(ver):
        status, r = gh_api(token, "POST",
                           "https://uploads.github.com/repos/%s/releases/%s/assets?name=%s" % (REPO, rid, name),
                           file=os.path.join(DIST, name), ctype=ctype)
        print(name, "->", status)
        assert status == 201, "上传失败: " + name
    print("== 发版完成: https://github.com/%s/releases/tag/%s ==" % (REPO, tag))


if __name__ == "__main__":
    main()
