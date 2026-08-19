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
  "tag_name": "v1.0.0",
  "name": "HarmonyOS Theme XML Tips v1.0.0",
  "body": "HarmonyOS NEXT 主题引擎 XML 代码提示插件（VS Code）。数据来源于《HarmonyOS NEXT主题引擎规范及指导 v2.3》，覆盖全部 127 个标签、属性、枚举值与 134 个全局变量。\n\n**Assets**\n\n- `ThemeXmlTips-Setup-1.0.0.exe` — Windows 安装程序，双击自动安装扩展到 VS Code\n- `theme-xml-tips-1.0.0.vsix` — VS Code 扩展包，可通过 Install from VSIX 手动安装\n- `theme-xml-tips-1.0.0-source.zip` — 完整源码包"
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

upload "dist/ThemeXmlTips-Setup-1.0.0.exe" "ThemeXmlTips-Setup-1.0.0.exe" "application/octet-stream"
upload "dist/theme-xml-tips-1.0.0.vsix" "theme-xml-tips-1.0.0.vsix" "application/octet-stream"
upload "dist/theme-xml-tips-1.0.0-source.zip" "theme-xml-tips-1.0.0-source.zip" "application/zip"
