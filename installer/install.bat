@echo off
chcp 65001 >nul
echo =======================================================
echo  HarmonyOS Theme XML Tips - Manual Installer
echo =======================================================
echo.
set VSIX=%~dp0theme-xml-tips-1.3.1.vsix
if not exist "%VSIX%" (
    echo [ERROR] theme-xml-tips-1.3.1.vsix not found next to this script.
    pause
    exit /b 1
)
where code >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] 'code' command not found. Please install VS Code first,
    echo         or use VS Code -^> Extensions -^> ... -^> Install from VSIX.
    pause
    exit /b 2
)
code --install-extension "%VSIX%" --force
echo.
echo Done. Restart VS Code to activate the extension.
pause
