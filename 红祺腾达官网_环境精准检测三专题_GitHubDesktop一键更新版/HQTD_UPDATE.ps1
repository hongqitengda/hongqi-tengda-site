$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Index = Join-Path $Root "index.html"
$Board = Join-Path $Root "board\characterization-analysis.html"
if (!(Test-Path $Index) -or !(Test-Path $Board) -or !(Test-Path (Join-Path $Root "assets"))) {
  Write-Host "ERROR: 请把本更新包解压到 hongqi-tengda-site 官网仓库根目录后再运行。" -ForegroundColor Red
  exit 2
}
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = Join-Path $env:TEMP "HQTD-env-topics-backup-$stamp"
New-Item -ItemType Directory -Force -Path (Join-Path $backup "board") | Out-Null
Copy-Item $Index (Join-Path $backup "index.html")
Copy-Item $Board (Join-Path $backup "board\characterization-analysis.html")
$newCard = @'
<article class="ai-showcase-card hqt-feature-card hqt-card-board-analysis">
<a class="ai-showcase-media" href="emerging-contaminants.html"><img alt="新污染物精准检测与风险识别平台" decoding="async" loading="lazy" src="assets/images/homepage-color/08-solution-analysis.webp"/></a>
<div class="ai-showcase-copy"><span>新污染物检测</span><h3><a href="emerging-contaminants.html">新污染物精准检测与风险识别平台</a></h3><p>覆盖 PFAS、农药及代谢物、抗生素、药物、激素、PAHs/PCBs 等，支持目标物筛选、精准检测与风险识别。</p><div class="ai-showcase-footer"><div class="ai-showcase-tags"><span>PFAS</span><span>精准检测</span><span>风险识别</span></div><a href="emerging-contaminants.html">进入平台 →</a></div></div>
</article>
'@
$homeSection = @'
<!-- HQTD ENVIRONMENT TOPICS START -->
<section class="env-topic-section" id="environment-topics">
  <div class="env-topic-wrap">
    <div class="env-topic-head"><div><span class="env-topic-kicker">ENVIRONMENTAL PRECISION ANALYTICS</span><h2>环境精准检测专题平台</h2></div><p>面向新污染物、温室气体与微塑料等环境前沿问题，建立专题化科研检测入口，覆盖目标物筛选、精准检测、组分识别与科研数据分析。</p></div>
    <div class="env-topic-grid">
      <a class="env-topic-card" href="emerging-contaminants.html"><span class="env-topic-status">重点专题 · 已上线</span><span class="en">EMERGING CONTAMINANTS</span><h3>新污染物精准检测与风险识别平台</h3><p>覆盖 PFAS、农药及代谢物、抗生素、药物、激素、PAHs/PCBs 等重点类别。</p><div class="env-topic-tags"><span>12 类</span><span>387 项</span><span>精准检测</span><span>风险识别</span></div><div class="env-topic-foot"><span>进入专题 →</span><small>污染物目标项目库</small></div></a>
      <a class="env-topic-card" href="greenhouse-gas-detection.html"><span class="env-topic-status">已上线</span><span class="en">GREENHOUSE GAS</span><h3>温室气体精准检测与排放分析平台</h3><p>围绕 CH₄、CO₂ 与 N₂O 构建专用 GC 检测链路，展示 FID / ECD、甲烷转化与典型谱图。</p><div class="env-topic-tags"><span>CH₄</span><span>CO₂</span><span>N₂O</span><span>S-GC</span></div><div class="env-topic-foot"><span>进入专题 →</span><small>双检测通道</small></div></a>
      <a class="env-topic-card is-coming" href="microplastics-detection.html"><span class="env-topic-status coming">COMING SOON</span><span class="en">MICROPLASTICS</span><h3>微塑料精准检测与来源识别平台</h3><p>预留微塑料科研检测专题入口，拟围绕粒径/形貌、聚合物类型、丰度和来源识别逐步完善。</p><div class="env-topic-tags"><span>Raman</span><span>μ-FTIR</span><span>来源识别</span></div><div class="env-topic-foot"><span>查看规划 →</span><small>专题建设中</small></div></a>
    </div>
  </div>
</section>
<!-- HQTD ENVIRONMENT TOPICS END -->
'@
$boardStrip = @'
<!-- HQTD ENVIRONMENT BOARD START -->
<div class="env-board-strip"><div class="env-board-strip-head"><div><span>ENVIRONMENTAL SPECIAL TOPICS</span><h2>环境专题检测</h2></div></div><div class="env-board-strip-grid"><a href="emerging-contaminants.html"><strong>新污染物精准检测</strong><small>12 类 · 387 项目标检测项目 · 风险识别</small></a><a href="greenhouse-gas-detection.html"><strong>温室气体精准检测</strong><small>CH₄ · CO₂ · N₂O · GC-FID / ECD</small></a><a href="microplastics-detection.html"><strong>微塑料检测专题</strong><small>专题入口已预留 · 建设中</small></a></div></div>
<!-- HQTD ENVIRONMENT BOARD END -->
'@
function Update-Html([string]$Path, [bool]$IsHome) {
  $html = [IO.File]::ReadAllText($Path, [Text.Encoding]::UTF8)
  if ($html -notmatch 'environment-topics\.css') {
    $html = $html -replace '</head>', '<link href="assets/css/environment-topics.css?v=20260917" rel="stylesheet"/></head>'
  }
  $oldCardPattern = '(?s)<article class="ai-showcase-card hqt-feature-card hqt-card-board-analysis">\s*<a class="ai-showcase-media" href="project/fx-85\.html">.*?</article>'
  if ($html -match $oldCardPattern) { $html = [regex]::Replace($html, $oldCardPattern, $newCard, 1) }
  if ($IsHome) {
    if ($html -notmatch 'HQTD ENVIRONMENT TOPICS START') {
      $marker = '<section class="section hqt-capability-section hqt-capability-supplies">'
      if ($html.Contains($marker)) { $html = $html.Replace($marker, $homeSection + "`r`n" + $marker) } else { throw "未找到首页耗材仪器板块插入位置。" }
    }
  } else {
    if ($html -notmatch 'HQTD ENVIRONMENT BOARD START') {
      $marker = '<section class="section hqt-section-soft">'
      if ($html.Contains($marker)) { $html = $html.Replace($marker, $boardStrip + "`r`n" + $marker) } else { throw "未找到分析表征分类板块插入位置。" }
    }
  }
  [IO.File]::WriteAllText($Path, $html, [System.Text.UTF8Encoding]::new($false))
}
Update-Html $Index $true
Update-Html $Board $false
Write-Host "更新完成。原 index.html 和分析表征页已备份到：$backup" -ForegroundColor Green
Write-Host "现在打开 GitHub Desktop：检查 Changes -> Commit to main -> Push origin。" -ForegroundColor Cyan
exit 0
