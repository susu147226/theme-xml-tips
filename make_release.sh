#!/usr/bin/env bash
# Create GitHub release v1.0.0 and upload assets using stored git credential.
set -e
cd "$(dirname "$0")"

TOKEN=$(printf 'protocol=https\nhost=github.com\n' | git credential fill | grep '^password=' | cut -d= -f2-)
if [ -z "$TOKEN" ]; then echo "NO_TOKEN"; exit 1; fi

REPO="susu147226/theme-xml-tips"
AUTH="Authorization: Bearer $TOKEN"

# create release
BODY=$(python - <<'EOF'
import json
print(json.dumps({
  "tag_name": "v1.3.0",
  "name": "Theme XML Tips v1.3.0",
  "body": "主题引擎 XML 代码提示插件，作者：云舒眠眠。\n\n**v1.3.0 更新**\n\n- 新增 4 个百变卡片模板代码片段：`w2_h1`（1x2）、`w2_h2`（2x2）、`w4_h2`（2x4）、`w4_h4`（4x4），预置 w/h/click/pai 变量\n- VS Code / WebStorm / HBuilderX / Sublime Text 四端代码片段同源一致\n\n**Assets**\n\n- `ThemeXmlTips-Setup-1.3.0.exe` — Windows 安装程序（VS Code 自动安装 + 适配包释放）\n- `theme-xml-tips-1.3.0.vsix` — VS Code 扩展包\n- `ThemeXmlTips-WebStorm-1.3.0.zip` — WebStorm Live Templates（Import Settings 导入）\n- `ThemeXmlTips-HBuilderX-1.3.0.zip` — HBuilderX 自定义代码块\n- `ThemeXmlTips-Sublime-Text-1.3.0.zip` — Sublime Text 代码片段包\n- `theme-xml-tips-1.3.0-source.zip` — 完整源码包"
}))
EOF
)
RESP=$(curl -sS -X POST -H "$AUTH" -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$REPO/releases" -d "$BODY")
RID=$(echo "$RESP" | python -c "import json,sys; d=json.load(sys.stdin); print(d.get('id',''))")
if [ -z "$RID" ]; then echo "CREATE_FAILED"; echo "$RESP" | head -c 600; exit 1; fi
echo "RELEASE_ID=$RID"

upload() {
  local file="$1" name="$2" ctype="$3"
  local code
  code=$(curl -sS -o /dev/null -w '%{http_code}' -X POST -H "$AUTH" \
    -H "Content-Type: $ctype" \
    "https://uploads.github.com/repos/$REPO/releases/$RID/assets?name=$name" \
    --data-binary @"$file")
  echo "$name -> HTTP $code"
}

upload "dist/ThemeXmlTips-Setup-1.3.0.exe" "ThemeXmlTips-Setup-1.3.0.exe" "application/octet-stream"
upload "dist/theme-xml-tips-1.3.0.vsix" "theme-xml-tips-1.3.0.vsix" "application/octet-stream"
upload "dist/ThemeXmlTips-WebStorm-1.3.0.zip" "ThemeXmlTips-WebStorm-1.3.0.zip" "application/zip"
upload "dist/ThemeXmlTips-HBuilderX-1.3.0.zip" "ThemeXmlTips-HBuilderX-1.3.0.zip" "application/zip"
upload "dist/ThemeXmlTips-Sublime-Text-1.3.0.zip" "ThemeXmlTips-Sublime-Text-1.3.0.zip" "application/zip"
upload "dist/theme-xml-tips-1.3.0-source.zip" "theme-xml-tips-1.3.0-source.zip" "application/zip"
