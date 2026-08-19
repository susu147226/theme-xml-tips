# -*- coding: utf-8 -*-
"""Set the project version everywhere.

Usage: python tools/set_version.py 1.3.1

Patches:
  - package.json            ("version")
  - installer/Installer.cs  (Version / VsixName)
  - installer/install.bat   (vsix filename)
build_vsix.py / build_adapters.py read the version from package.json directly.
"""
import io, json, re, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def main(ver):
    if not re.match(r"^\d+\.\d+\.\d+$", ver):
        print("版本号格式应为 x.y.z，例如 1.3.1")
        sys.exit(1)

    # package.json
    pkg_path = os.path.join(ROOT, "package.json")
    pkg = json.load(open(pkg_path, encoding="utf-8"))
    old = pkg["version"]
    pkg["version"] = ver
    io.open(pkg_path, "w", encoding="utf-8").write(
        json.dumps(pkg, ensure_ascii=False, indent=2) + "\n")

    # Installer.cs
    cs_path = os.path.join(ROOT, "installer", "Installer.cs")
    s = io.open(cs_path, encoding="utf-8").read()
    s = re.sub(r'private const string Version = "[^"]*";',
               'private const string Version = "%s";' % ver, s)
    s = re.sub(r'private const string VsixName = "[^"]*";',
               'private const string VsixName = "theme-xml-tips-%s.vsix";' % ver, s)
    io.open(cs_path, "w", encoding="utf-8").write(s)

    # install.bat
    bat_path = os.path.join(ROOT, "installer", "install.bat")
    s = io.open(bat_path, encoding="utf-8").read()
    s = re.sub(r"theme-xml-tips-[\d.]+\.vsix", "theme-xml-tips-%s.vsix" % ver, s)
    io.open(bat_path, "w", encoding="utf-8", newline="\r\n").write(s)

    print("version: %s -> %s" % (old, ver))

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("usage: python tools/set_version.py <x.y.z>")
        sys.exit(1)
    main(sys.argv[1])
