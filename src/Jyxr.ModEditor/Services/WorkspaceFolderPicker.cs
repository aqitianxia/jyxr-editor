using System.Diagnostics;

namespace JsonEditor.Services;

public static class WorkspaceFolderPicker
{
    public static Task<FolderPickerResult> PickAsync(CancellationToken cancellationToken = default)
    {
        if (OperatingSystem.IsMacOS())
        {
            return RunAsync(
                "/usr/bin/osascript",
                ["-e", "POSIX path of (choose folder with prompt \"选择 JYXR 创作工作区\")"],
                cancellationToken);
        }

        if (OperatingSystem.IsWindows())
        {
            const string script = "Add-Type -AssemblyName System.Windows.Forms; " +
                "$dialog = New-Object System.Windows.Forms.FolderBrowserDialog; " +
                "$dialog.Description = '选择 JYXR 创作工作区'; " +
                "if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) " +
                "{ [Console]::Out.Write($dialog.SelectedPath) } else { exit 2 }";
            return RunAsync(
                "powershell.exe",
                ["-NoProfile", "-STA", "-Command", script],
                cancellationToken);
        }

        return Task.FromResult(new FolderPickerResult(
            false,
            false,
            null,
            "当前系统不支持原生目录选择，请粘贴工作区绝对路径。"));
    }

    private static async Task<FolderPickerResult> RunAsync(
        string executable,
        IReadOnlyList<string> arguments,
        CancellationToken cancellationToken)
    {
        var startInfo = new ProcessStartInfo(executable)
        {
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true,
        };
        foreach (var argument in arguments)
        {
            startInfo.ArgumentList.Add(argument);
        }

        try
        {
            using var process = Process.Start(startInfo)
                ?? throw new InvalidOperationException("无法启动目录选择器。");
            try
            {
                await process.WaitForExitAsync(cancellationToken);
            }
            catch (OperationCanceledException)
            {
                if (!process.HasExited)
                {
                    process.Kill(entireProcessTree: true);
                }

                throw;
            }

            var output = (await process.StandardOutput.ReadToEndAsync(cancellationToken)).Trim();
            var error = (await process.StandardError.ReadToEndAsync(cancellationToken)).Trim();
            if (process.ExitCode != 0 || string.IsNullOrWhiteSpace(output))
            {
                return new FolderPickerResult(true, true, null, string.IsNullOrWhiteSpace(error) ? null : error);
            }

            return new FolderPickerResult(true, false, output, null);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            return new FolderPickerResult(false, false, null, $"目录选择器启动失败：{ex.Message}");
        }
    }
}

public sealed record FolderPickerResult(
    bool Supported,
    bool Canceled,
    string? Path,
    string? Message);
