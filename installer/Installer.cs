// ThemeXmlTips Setup — HarmonyOS Theme XML Tips VS Code 扩展安装程序
// 内嵌 VSIX，自动定位 VS Code 并执行 code --install-extension
using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;

internal static class Installer
{
    private const string VsixName = "theme-xml-tips-1.1.0.vsix";
    private const string ResourceName = "ThemeXmlTips.vsix";

    private static int Main(string[] args)
    {
        bool quiet = args.Length > 0 && (args[0] == "/S" || args[0] == "/s" || args[0] == "-q");
        Console.WriteLine("=======================================================");
        Console.WriteLine(" HarmonyOS Theme XML Tips - VS Code Extension Setup");
        Console.WriteLine(" Version 1.1.0");
        Console.WriteLine("=======================================================");
        Console.WriteLine();

        // 1. 释放内嵌 VSIX
        string tempDir = Path.Combine(Path.GetTempPath(), "ThemeXmlTipsSetup");
        Directory.CreateDirectory(tempDir);
        string vsixPath = Path.Combine(tempDir, VsixName);
        try
        {
            using (Stream res = Assembly.GetExecutingAssembly().GetManifestResourceStream(ResourceName))
            {
                if (res == null)
                {
                    Console.WriteLine("[错误] 安装包资源缺失，请重新下载安装程序。");
                    return Pause(quiet, 1);
                }
                using (FileStream fs = File.Create(vsixPath))
                {
                    res.CopyTo(fs);
                }
            }
            Console.WriteLine("[1/3] 已释放扩展包: " + vsixPath);
        }
        catch (Exception ex)
        {
            Console.WriteLine("[错误] 释放安装文件失败: " + ex.Message);
            return Pause(quiet, 1);
        }

        // 2. 定位 VS Code 命令行
        string code = FindCode();
        if (code == null)
        {
            Console.WriteLine("[2/3] 未找到 VS Code 命令行工具 (code)。");
            Console.WriteLine("      请先安装 Visual Studio Code，或手动安装扩展:");
            Console.WriteLine("      VS Code -> 扩展 -> ... -> Install from VSIX -> 选择:");
            Console.WriteLine("      " + vsixPath);
            return Pause(quiet, 2);
        }
        Console.WriteLine("[2/3] 找到 VS Code: " + code);

        // 3. 执行安装
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
            string stderr = p.StandardError.ReadToEnd();
            p.WaitForExit();
            Console.WriteLine(stdout);
            if (!string.IsNullOrWhiteSpace(stderr)) Console.WriteLine(stderr);
            if (p.ExitCode == 0)
            {
                Console.WriteLine("[3/3] 安装完成! 请重启 VS Code，打开主题工程的 manifest.xml 即可使用代码提示。");
                return Pause(quiet, 0);
            }
            Console.WriteLine("[错误] VS Code 返回错误码: " + p.ExitCode);
            return Pause(quiet, 3);
        }
        catch (Exception ex)
        {
            Console.WriteLine("[错误] 调用 VS Code 失败: " + ex.Message);
            Console.WriteLine("      可手动执行: code --install-extension \"" + vsixPath + "\"");
            return Pause(quiet, 3);
        }
    }

    private static string FindCode()
    {
        // PATH 中查找
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
        // 常见安装路径
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
