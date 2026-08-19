# -*- coding: utf-8 -*-
"""Build theme-xml-tips VSIX manually (vsix = zip with vsixmanifest)."""
import os, zipfile

ROOT = r"C:\Users\Administrator\Desktop\dsh workspace\theme-xml-tips"
DIST = os.path.join(ROOT, "dist")
os.makedirs(DIST, exist_ok=True)
VSIX = os.path.join(DIST, "theme-xml-tips-1.0.0.vsix")

MANIFEST = '''<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011" xmlns:d="http://schemas.microsoft.com/developer/vsx-schema-design/2011">
  <Metadata>
    <Identity Language="en-US" Id="theme-xml-tips" Version="1.0.0" Publisher="susu147226" />
    <DisplayName>HarmonyOS Theme XML Tips</DisplayName>
    <Description xml:space="preserve">HarmonyOS NEXT 主题引擎 XML 代码提示：标签/属性/枚举/变量补全与悬停文档（基于规范 v2.3）。</Description>
    <Tags>harmonyos,theme,xml,lockscreen</Tags>
    <Categories>Programming Languages,Snippets,Other</Categories>
    <GalleryFlags>Public</GalleryFlags>
    <Properties>
      <Property Id="Microsoft.VisualStudio.Code.Engine" Value="^1.60.0" />
      <Property Id="Microsoft.VisualStudio.Code.ExtensionDependencies" Value="" />
      <Property Id="Microsoft.VisualStudio.Code.ExtensionPack" Value="" />
      <Property Id="Microsoft.VisualStudio.Code.ExtensionKind" Value="UI,Workspace" />
      <Property Id="Microsoft.VisualStudio.Code.LocalizedLanguages" Value="" />
    </Properties>
  </Metadata>
  <Installation>
    <InstallationTarget Id="Microsoft.VisualStudio.Code" />
  </Installation>
  <Dependencies />
  <Assets>
    <Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true" />
  </Assets>
</PackageManifest>
'''

CONTENT_TYPES = '''<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="json" ContentType="application/json" />
  <Default Extension="js" ContentType="application/javascript" />
  <Default Extension="md" ContentType="text/markdown" />
  <Default Extension="txt" ContentType="text/plain" />
  <Default Extension="vsixmanifest" ContentType="text/xml" />
</Types>
'''

FILES = [
    "package.json", "extension.js", "README.md", "CHANGELOG.md",
    "data/tags.json", "snippets/theme-snippets.json",
]

with zipfile.ZipFile(VSIX, "w", zipfile.ZIP_DEFLATED) as z:
    z.writestr("extension.vsixmanifest", MANIFEST)
    z.writestr("[Content_Types].xml", CONTENT_TYPES)
    z.writestr("extension/LICENSE.txt", open(os.path.join(ROOT, "LICENSE"), encoding="utf-8").read())
    for f in FILES:
        z.write(os.path.join(ROOT, f), "extension/" + f.replace(os.sep, "/"))

print("built:", VSIX, os.path.getsize(VSIX), "bytes")
with zipfile.ZipFile(VSIX) as z:
    for n in z.namelist(): print("  ", n)
