param(
    [Parameter(Mandatory = $true)]
    [string]$PackageDir
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'

function Show-Info([string]$Text, [string]$Title = '红祺腾达官网一键上传') {
    [System.Windows.Forms.MessageBox]::Show($Text, $Title, 'OK', 'Information') | Out-Null
}

function Show-Error([string]$Text, [string]$Title = '红祺腾达官网一键上传') {
    [System.Windows.Forms.MessageBox]::Show($Text, $Title, 'OK', 'Error') | Out-Null
}

function Invoke-Git {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Repo,

        [Parameter(Mandatory = $true)]
        [string[]]$GitArgs
    )

    $output = & $script:GitExe -C $Repo @GitArgs 2>&1
    if ($LASTEXITCODE -ne 0) {
        $displayArgs = $GitArgs -join ' '
        throw "Git 命令执行失败：git $displayArgs`r`n$($output | Out-String)"
    }
    return ($output | Out-String).Trim()
}

$tempZip = $null
try {
    $PackageDir = [System.IO.Path]::GetFullPath($PackageDir)
    $siteZip = Join-Path $PackageDir 'site-v19.2.zip'
    if (-not (Test-Path -LiteralPath $siteZip)) {
        throw '未找到 site-v19.2.zip。请先完整解压修正版压缩包，再运行批处理文件。'
    }

    $gitCandidates = @()
    $cmdGit = Get-Command git.exe -ErrorAction SilentlyContinue
    if ($cmdGit -and $cmdGit.Source) { $gitCandidates += $cmdGit.Source }

    $knownGitPaths = @(
        "$env:ProgramFiles\Git\cmd\git.exe",
        "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe"
    )
    foreach ($knownPath in $knownGitPaths) {
        if (Test-Path -LiteralPath $knownPath) { $gitCandidates += $knownPath }
    }

    $desktopGit = Get-ChildItem -Path "$env:LOCALAPPDATA\GitHubDesktop\app-*\resources\app\git\cmd\git.exe" -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending |
        Select-Object -First 1 -ExpandProperty FullName
    if ($desktopGit) { $gitCandidates += $desktopGit }

    $gitCandidates = @($gitCandidates | Select-Object -Unique)
    if (-not $gitCandidates -or $gitCandidates.Count -eq 0) {
        throw '没有找到 Git。请确认 GitHub Desktop 已安装，然后重新运行。'
    }
    $script:GitExe = $gitCandidates[0]

    # 若脚本就放在已克隆仓库根目录，则自动识别；否则让用户选择。
    if (Test-Path -LiteralPath (Join-Path $PackageDir '.git')) {
        $repo = $PackageDir.TrimEnd('\')
    }
    else {
        $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
        $dialog.Description = '请选择 GitHub Desktop 已克隆的 hongqi-tengda-site 文件夹'
        $dialog.ShowNewFolderButton = $false
        $defaultRepo = Join-Path $env:USERPROFILE 'Documents\GitHub\hongqi-tengda-site'
        if (Test-Path -LiteralPath $defaultRepo) { $dialog.SelectedPath = $defaultRepo }
        if ($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { exit 0 }
        $repo = $dialog.SelectedPath
    }

    if (-not (Test-Path -LiteralPath (Join-Path $repo '.git'))) {
        throw '选择的文件夹不是 Git 仓库。请选择 hongqi-tengda-site 文件夹本身。'
    }

    $remote = Invoke-Git -Repo $repo -GitArgs @('remote', 'get-url', 'origin')
    if ($remote -notmatch 'hongqi-tengda-site') {
        throw "选择的仓库不是 hongqi-tengda-site。当前远程地址：$remote"
    }

    $status = Invoke-Git -Repo $repo -GitArgs @('status', '--porcelain')
    if ($status) {
        $answer = [System.Windows.Forms.MessageBox]::Show(
            "仓库存在尚未提交的本地修改。继续将清除这些修改并覆盖旧网站。是否继续？",
            '确认覆盖', 'YesNo', 'Warning')
        if ($answer -ne [System.Windows.Forms.DialogResult]::Yes) { exit 0 }
    }

    $answer2 = [System.Windows.Forms.MessageBox]::Show(
        "即将把 V19.2（完整保留1612项）上传到：`r`n$repo`r`n`r`n程序会保留 .git 和当前 CNAME，并自动提交到 main。是否继续？",
        '确认一键上传', 'YesNo', 'Question')
    if ($answer2 -ne [System.Windows.Forms.DialogResult]::Yes) { exit 0 }

    # 先复制网站压缩包到系统临时目录，避免脚本位于仓库中时被清理掉。
    $tempZip = Join-Path $env:TEMP ("hqt-site-v19.2-" + [guid]::NewGuid().ToString('N') + '.zip')
    Copy-Item -LiteralPath $siteZip -Destination $tempZip -Force

    # 尽量保留现有域名；若文件已被手动删除，则从 Git 当前版本中读取。
    $cnamePath = Join-Path $repo 'CNAME'
    $existingCname = $null
    if (Test-Path -LiteralPath $cnamePath) {
        $existingCname = Get-Content -LiteralPath $cnamePath -Raw -ErrorAction SilentlyContinue
    }
    if (-not $existingCname) {
        try {
            $existingCname = Invoke-Git -Repo $repo -GitArgs @('show', 'HEAD:CNAME')
        }
        catch {
            $existingCname = $null
        }
    }

    # 恢复远程 main 的干净状态，避免手动删除旧文件造成 pull 失败。
    Invoke-Git -Repo $repo -GitArgs @('fetch', 'origin') | Out-Null
    Invoke-Git -Repo $repo -GitArgs @('checkout', 'main') | Out-Null
    Invoke-Git -Repo $repo -GitArgs @('reset', '--hard', 'origin/main') | Out-Null
    Invoke-Git -Repo $repo -GitArgs @('clean', '-fdx') | Out-Null

    # 清除旧站点文件，仅保留 .git。
    Get-ChildItem -LiteralPath $repo -Force |
        Where-Object { $_.Name -ne '.git' } |
        Remove-Item -Recurse -Force

    Expand-Archive -LiteralPath $tempZip -DestinationPath $repo -Force

    if ($existingCname -and $existingCname.Trim()) {
        [System.IO.File]::WriteAllText(
            $cnamePath,
            $existingCname.Trim() + "`n",
            [System.Text.UTF8Encoding]::new($false)
        )
    }

    Invoke-Git -Repo $repo -GitArgs @('add', '-A') | Out-Null
    $pending = Invoke-Git -Repo $repo -GitArgs @('status', '--porcelain')
    if (-not $pending) {
        Show-Info '文件与 GitHub 当前版本一致，没有需要上传的更改。'
        exit 0
    }

    Invoke-Git -Repo $repo -GitArgs @(
        'commit', '-m',
        'Upgrade website to V19.2 - retain 1612 items and enhance static SEO'
    ) | Out-Null
    Invoke-Git -Repo $repo -GitArgs @('push', 'origin', 'main') | Out-Null

    Show-Info "上传成功。`r`n`r`n网站：https://www.hongqitengda.com/`r`n`r`nGitHub Pages 通常需要等待 1–5 分钟更新。"
}
catch {
    Show-Error $_.Exception.Message
    exit 1
}
finally {
    if ($tempZip -and (Test-Path -LiteralPath $tempZip)) {
        Remove-Item -LiteralPath $tempZip -Force -ErrorAction SilentlyContinue
    }
}
