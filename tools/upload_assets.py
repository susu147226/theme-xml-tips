# -*- coding: utf-8 -*-
"""仅上传产物到已存在的 release（发版脚本网络中断后的补救）。用法: python tools/upload_assets.py 2.2.1"""
import os
import sys
import importlib.util

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
spec = importlib.util.spec_from_file_location("release", os.path.join(ROOT, "release.py"))
rel = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rel)  # release.py 有 __main__ 保护，import 不执行主流程

ver = sys.argv[1]
token = rel.git_token()
status, r = rel.gh_api(token, "GET", "https://api.github.com/repos/%s/releases/tags/v%s" % (rel.REPO, ver))
assert status == 200, "release 不存在: %s" % r
rid = r["id"]
existing = {a["name"] for a in r.get("assets", [])}
print("release id:", rid, "| 已有产物:", existing or "无")
for name, ctype in rel.assets(ver):
    if name in existing:
        print("跳过已存在:", name)
        continue
    st, resp = rel.gh_api(token, "POST",
                          "https://uploads.github.com/repos/%s/releases/%s/assets?name=%s" % (rel.REPO, rid, name),
                          file=os.path.join(rel.DIST, name), ctype=ctype)
    print(name, "->", st)
    assert st == 201, "上传失败: %s" % resp
print("== 产物上传完成 ==")
