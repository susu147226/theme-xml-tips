// ThemeXmlTips Setup — 主题引擎 XML 代码提示多编辑器安装程序
// 作者：云舒眠眠
// VS Code: 原生扩展（内嵌 VSIX，自动执行 code --install-extension）
// WebStorm / HBuilderX / Sublime Text: 释放官方代码片段适配包
using System;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Reflection;

internal static class Installer
{
    private const string Version = "1.3.0";
    private const string VsixName = "theme-xml-tips-1.3.0.vsix";
    private const string VsixResource = "ThemeXmlTips.vsix";
    private const string AdaptersResource = "ThemeXmlTips.adapters";

    private static int Main(string[] args)
    {
        bool quiet = args.Length > 0 && (args[0] == "/S" || args[0] == "/s" || args[0] == "-q");
        Console.WriteLine("=======================================================");
        Console.WriteLine(" Theme XML Tips - Multi-Editor Setup  v" + Version);
        Console.WriteLine(" Author: YunShuMianMian");
        Console.WriteLine(" Supported: VS Code / WebStorm / HBuilderX / Sublime");
        Console.WriteLine("=======================================================");
        Console.WriteLine();

        // ---------- 1. VS Code 原生扩展 ----------
        string tempDir = Path.Combine(Path.GetTempPath(), "ThemeXmlTipsSetup");
        Directory.CreateDirectory(tempDir);
        string vsixPath = Path.Combine(tempDir, VsixName);
        if (!ExtractResource(VsixResource, vsixPath))
        {
            Console.WriteLine("[错误] 安装包资源缺失，请重新下载安装程序。");
            return Pause(quiet, 1);
        }

        string code = FindCode();
        if (code == null)
        {
            Console.WriteLine("[VS Code] 未找到 code 命令，请安装 VS Code 后手动安装:");
            Console.WriteLine("          扩展面板 -> ... -> Install from VSIX ->");
            Console.WriteLine("          " + vsixPath);
        }
        else
        {
            Console.WriteLine("[VS Code] 找到: " + code);
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = code;
                psi.Arguments = "--install-extension \"" + vsixPath + "\" --force";
                psi.UseShellExecute = false;
                psi.RedirectStandardOutput = true;
                psi.RedirectStandardError = true;
                psi.CreateNoWindow = true;
                Process p = Process.Start(psi);
                string stdout = p.StandardOutput.ReadToEnd();
                p.WaitForExit();
                Console.WriteLine(stdout.Trim());
                Console.WriteLine(p.ExitCode == 0
                    ? "[VS Code] 扩展安装完成，重启 VS Code 后生效。"
                    : "[VS Code] 安装返回码 " + p.ExitCode + "，可手动 Install from VSIX。");
            }
            catch (Exception ex)
            {
                Console.WriteLine("[VS Code] 调用失败: " + ex.Message);
                Console.WriteLine("          可手动执行: code --install-extension \"" + vsixPath + "\"");
            }
        }
        Console.WriteLine();

        // ---------- 2. 释放其他编辑器适配包 ----------
        string exeDir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
        string adaptersZip = Path.Combine(tempDir, "adapters.zip");
        string adaptersDir = Path.Combine(exeDir, "ThemeXmlTips-Adapters");
        if (ExtractResource(AdaptersResource, adaptersZip))
        {
            try
            {
                if (Directory.Exists(adaptersDir)) Directory.Delete(adaptersDir, true);
                ZipFile.ExtractToDirectory(adaptersZip, adaptersDir);
                Console.WriteLine("[适配包] 已释放到: " + adaptersDir);
                Console.WriteLine("  - webstorm\\   WebStorm Live Templates");
                Console.WriteLine("  - hbuilderx\\  HBuilderX 自定义代码块");
                Console.WriteLine("  - sublime\\    Sublime Text 代码片段");
            }
            catch (Exception ex)
            {
                Console.WriteLine("[适配包] 释放失败: " + ex.Message);
            }
        }

        // ---------- 3. Sublime Text 自动安装（检测到配置目录时） ----------
        string sublimeUser = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "Sublime Text", "Packages", "User");
        string sublimeSrc = Path.Combine(adaptersDir, "sublime");
        if (Directory.Exists(sublimeUser) && Directory.Exists(sublimeSrc))
        {
            try
            {
                string dest = Path.Combine(sublimeUser, "ThemeXmlTips");
                Directory.CreateDirectory(dest);
                int n = 0;
                foreach (string f in Directory.GetFiles(sublimeSrc, "*.sublime-snippet"))
                {
                    File.Copy(f, Path.Combine(dest, Path.GetFileName(f)), true);
                    n++;
                }
                Console.WriteLine("[Sublime] 已自动安装 " + n + " 个代码片段到 " + dest);
            }
            catch (Exception ex)
            {
                Console.WriteLine("[Sublime] 自动安装失败: " + ex.Message + "，可参考 sublime\\README.txt 手动复制。");
            }
        }
        Console.WriteLine();

        // ---------- 4. 导入指引 ----------
        Console.WriteLine("[WebStorm]  File -> Manage IDE Settings -> Import Settings...");
        Console.WriteLine("            选择 ThemeXmlTips-WebStorm-" + Version + ".zip (Release 附件)，");
        Console.WriteLine("            或 adapters 目录中的 webstorm\\ThemeXmlTips.xml。");
        Console.WriteLine("[HBuilderX] 工具 -> 自定义代码块 -> xml.json，");
        Console.WriteLine("            合并 hbuilderx\\xml.json 的内容后保存。");
        Console.WriteLine();
        Console.WriteLine("安装完成。");
        return Pause(quiet, 0);
    }

    private static bool ExtractResource(string resource, string target)
    {
        try
        {
            using (Stream res = Assembly.GetExecutingAssembly().GetManifestResourceStream(resource))
            {
                if (res == null) return false;
                using (FileStream fs = File.Create(target)) res.CopyTo(fs);
            }
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine("[错误] 释放资源失败: " + ex.Message);
            return false;
        }
    }

    private static string FindCode()
    {
        string pathEnv = Environment.GetEnvironmentVariable("PATH") ?? "";
        foreach (string dir in pathEnv.Split(';'))
        {
            if (dir.Trim().Length == 0) continue;
            foreach (string name in new string[] { "code.cmd", "code.exe", "code" })
            {
                try
                {
                    string p = Path.Combine(dir.Trim(), name);
                    if (File.Exists(p)) return p;
                }
                catch { }
            }
        }
        string local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        string prog = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
        string prog86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
        string[] candidates = new string[]
        {
            Path.Combine(local, "Programs", "Microsoft VS Code", "bin", "code.cmd"),
            Path.Combine(prog, "Microsoft VS Code", "bin", "code.cmd"),
            Path.Combine(prog86, "Microsoft VS Code", "bin", "code.cmd"),
            Path.Combine(local, "Programs", "Microsoft VS Code Insiders", "bin", "code-insiders.cmd"),
            Path.Combine(local, "Programs", "VSCodium", "bin", "codium.cmd")
        };
        foreach (string c in candidates)
        {
            if (File.Exists(c)) return c;
        }
        return null;
    }

    private static int Pause(bool quiet, int code)
    {
        if (!quiet)
        {
            Console.WriteLine();
            Console.WriteLine("按任意键退出...");
            try { Console.ReadKey(true); } catch { }
        }
        return code;
    }
}
