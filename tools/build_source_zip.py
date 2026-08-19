# -*- coding: utf-8 -*-
"""Build the source zip into dist/. Standalone and CI-friendly."""
import json, os, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VER = json.load(open(os.path.join(ROOT, "package.json"), encoding="utf-8"))["version"]
DIST = os.path.join(ROOT, "dist")
os.makedirs(DIST, exist_ok=True)

def build():
    out = os.path.join(DIST, "theme-xml-tips-%s-source.zip" % VER)
    files = []
    for base, dirs, fs in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in ("dist", ".git", "node_modules")]
        for f in fs:
            files.append(os.path.relpath(os.path.join(base, f), ROOT))
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for f in files:
            z.write(os.path.join(ROOT, f), f.replace(os.sep, "/"))
    print("source zip:", out, len(files), "files")
    return out

if __name__ == "__main__":
    build()
