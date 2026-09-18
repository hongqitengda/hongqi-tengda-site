$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Index = Join-Path $Root "index.html"
$Board = Join-Path $Root "board\characterization-analysis.html"
$Sitemap = Join-Path $Root "sitemap.xml"

if (!(Test-Path $Index) -or !(Test-Path $Board) -or !(Test-Path (Join-Path $Root "assets"))) {
  Write-Host "ERROR: 请将本更新包内所有文件复制到 hongqi-tengda-site 官网仓库根目录后再运行。" -ForegroundColor Red
  exit 2
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = Join-Path $env:TEMP "HQTD-env-v61-backup-$stamp"
New-Item -ItemType Directory -Force -Path (Join-Path $backup "board") | Out-Null
Copy-Item $Index (Join-Path $backup "index.html")
Copy-Item $Board (Join-Path $backup "board\characterization-analysis.html")
if (Test-Path $Sitemap) { Copy-Item $Sitemap (Join-Path $backup "sitemap.xml") }
@('emerging-contaminants.html','greenhouse-gas-detection.html','microplastics-detection.html') | ForEach-Object {
  $src = Join-Path $Root $_
  if (Test-Path $src) { Copy-Item $src (Join-Path $backup $_) }
}

$solutionCard = @'
<article class="ai-showcase-card hqt-feature-card hqt-card-board-analysis">
<a class="ai-showcase-media" href="project/fx-85.html">
<img alt="XPS全谱分析 参考图" decoding="async" loading="lazy" src="assets/images/homepage-color/08-solution-analysis.webp"/>
</a>
<div class="ai-showcase-copy">
<span>溶液检测</span>
<h3><a href="project/fx-85.html">HPLC 有机污染物定量检测</a></h3>
<p>面向水样、反应液与提取液开展组分分离、目标物定性定量及标准曲线分析。</p>
<div class="ai-showcase-footer">
<div class="ai-showcase-tags"><span>HPLC</span><span>定量</span><span>色谱</span></div>
<a href="project/fx-85.html">查看详情 →</a>
</div>
</div>
</article>
'@

$homeSection = @'
<!-- HQTD ENVIRONMENT TOPICS START -->
<section class="env-topic-section" id="environment-topics">
  <div class="env-topic-wrap">
    <div class="env-topic-head">
      <div><span class="env-topic-kicker">ENVIRONMENTAL PRECISION ANALYTICS</span><h2>环境精准检测专题平台</h2></div>
      <p>面向新污染物、温室气体、微塑料及综合科研检测需求，提供专题化检测入口、目标物与指标匹配、科研数据分析及方法开发定制。</p>
    </div>
    <div class="env-topic-grid">
      <a class="env-topic-card topic-emerging" id="env-topic-emerging" href="emerging-contaminants.html">
        <span class="env-topic-status">重点专题 · 已上线</span><span class="en">EMERGING CONTAMINANTS</span>
        <h3>新污染物精准检测与风险识别平台</h3>
        <p>覆盖 PFAS、农药及代谢物、抗生素、药物、激素、PAHs/PCBs 等重点类别。</p>
        <div class="env-topic-tags"><span>12 类</span><span>387 项</span><span>精准检测</span><span>风险识别</span></div>
        <div class="env-topic-foot"><span>进入专题 →</span><small>污染物目标项目库</small></div>
      </a>
      <a class="env-topic-card topic-greenhouse" id="env-topic-greenhouse" href="greenhouse-gas-detection.html">
        <span class="env-topic-status">已上线</span><span class="en">GREENHOUSE GAS</span>
        <h3>温室气体精准检测与排放分析平台</h3>
        <p>围绕 CH₄、CO₂ 与 N₂O 构建专用 GC 检测链路，展示 FID / ECD、甲烷转化与典型谱图。</p>
        <div class="env-topic-tags"><span>CH₄</span><span>CO₂</span><span>N₂O</span><span>FID + ECD</span></div>
        <div class="env-topic-foot"><span>进入专题 →</span><small>温室气体科研分析</small></div>
      </a>
      <a class="env-topic-card topic-microplastics" id="env-topic-microplastics" href="microplastics-detection.html">
        <span class="env-topic-status">已上线</span><span class="en">MICROPLASTICS</span>
        <h3>微塑料精准检测与聚合物识别平台</h3>
        <p>已有土壤与水样检测资料，覆盖显微形貌筛查、FTIR 光谱匹配与聚合物识别，并可拓展复杂生物样本。</p>
        <div class="env-topic-tags"><span>土壤</span><span>水样</span><span>显微筛查</span><span>FTIR</span></div>
        <div class="env-topic-foot"><span>进入专题 →</span><small>聚合物识别</small></div>
      </a>
      <a class="env-topic-card topic-custom" id="env-topic-custom" href="comprehensive-testing-method-development.html">
        <span class="env-topic-status">开放咨询</span><span class="en">CUSTOMIZED ANALYTICAL TESTING</span>
        <h3>综合检测与方法开发</h3>
        <p>面向 6PPD-Q 类、重金属、土壤碳指标及组分等科研需求，并支持特殊基质、新目标物的检测方法开发与定制。</p>
        <div class="env-topic-tags"><span>6PPD-Q</span><span>重金属</span><span>土壤碳</span><span>方法开发</span></div>
        <div class="env-topic-foot"><span>进入专题 →</span><small>定制检测</small></div>
      </a>
    </div>
  </div>
</section>
<!-- HQTD ENVIRONMENT TOPICS END -->
'@

$boardStrip = @'
<!-- HQTD ENVIRONMENT BOARD START -->
<div class="env-board-strip">
  <div class="env-board-strip-head"><div><span>ENVIRONMENTAL SPECIAL TOPICS</span><h2>环境专题检测</h2></div></div>
  <div class="env-board-strip-grid">
    <a href="emerging-contaminants.html"><strong>新污染物精准检测</strong><small>12 类 · 387 项目标检测项目 · 风险识别</small></a>
    <a href="greenhouse-gas-detection.html"><strong>温室气体精准检测</strong><small>CH₄ · CO₂ · N₂O · GC-FID / ECD</small></a>
    <a href="microplastics-detection.html"><strong>微塑料精准检测</strong><small>土壤 · 水样 · 显微筛查 · FTIR</small></a>
    <a href="comprehensive-testing-method-development.html"><strong>综合检测与方法开发</strong><small>6PPD-Q · 重金属 · 土壤碳 · 定制方法</small></a>
  </div>
</div>
<!-- HQTD ENVIRONMENT BOARD END -->
'@

$returnBar = @'
<!-- HQTD ENV RETURN START -->
<div class="env-topic-return"><div class="env-topic-return-inner"><a href="index.html#environment-topics">← 返回环境精准检测专题平台</a></div></div>
<!-- HQTD ENV RETURN END -->
'@

function Ensure-V6Assets([string]$html) {
  $html = [regex]::Replace($html, '<link[^>]+environment-topics-v(?:5|6)\.css[^>]*>\s*', '')
  $html = $html -replace '</head>', '<link href="assets/css/environment-topics-v6.css?v=20260918-v61" rel="stylesheet"/></head>'
  if ($html -match 'environment-topics\.js\?v=[^"'']+') {
    $html = $html -replace 'environment-topics\.js\?v=[^"'']+', 'environment-topics.js?v=20260918-v61'
  } elseif ($html -notmatch 'environment-topics\.js') {
    $html = $html -replace '</body>', '<script defer src="assets/js/environment-topics.js?v=20260918-v61"></script></body>'
  }
  return $html
}

function Restore-SolutionCard([string]$html) {
  $patternNew = '(?s)<article class="ai-showcase-card hqt-feature-card hqt-card-board-analysis">\s*<a class="ai-showcase-media" href="emerging-contaminants\.html">.*?</article>'
  if ($html -match $patternNew) { return [regex]::Replace($html, $patternNew, $solutionCard, 1) }
  return $html
}

function Ensure-TopicReturn([string]$html) {
  $html = [regex]::Replace($html, '(?s)<!-- HQTD ENV RETURN START -->.*?<!-- HQTD ENV RETURN END -->\s*', '')
  return [regex]::Replace($html, '(<main\b[^>]*>)', ('$1' + "`r`n" + $returnBar), 1)
}

# Homepage
$home = [IO.File]::ReadAllText($Index, [Text.Encoding]::UTF8)
$home = Restore-SolutionCard $home
$home = [regex]::Replace($home, '(?s)<!-- HQTD ENVIRONMENT TOPICS START -->.*?<!-- HQTD ENVIRONMENT TOPICS END -->\s*', '')
$marker = '<section class="section hqt-capability-section hqt-capability-supplies">'
if ($home.Contains($marker)) { $home = $home.Replace($marker, $homeSection + "`r`n" + $marker) }
else { throw "首页找不到环境专题矩阵插入位置。" }
$home = Ensure-V6Assets $home
# Force-refresh static-visuals.js so browsers cannot reuse the historical cached popup version.
$home = [regex]::Replace($home, 'assets/js/static-visuals\.js(?:\?v=[^"'' ]*)?', 'assets/js/static-visuals.js?v=20260918-clean')
[IO.File]::WriteAllText($Index, $home, [System.Text.UTF8Encoding]::new($false))

# Characterization board
$board = [IO.File]::ReadAllText($Board, [Text.Encoding]::UTF8)
$board = Restore-SolutionCard $board
$board = [regex]::Replace($board, '(?s)<!-- HQTD ENVIRONMENT BOARD START -->.*?<!-- HQTD ENVIRONMENT BOARD END -->\s*', '')
$boardMarker = '<section class="section hqt-section-soft">'
if ($board.Contains($boardMarker)) { $board = $board.Replace($boardMarker, $boardStrip + "`r`n" + $boardMarker) }
else { throw "分析表征页找不到环境专题入口插入位置。" }
$board = Ensure-V6Assets $board
[IO.File]::WriteAllText($Board, $board, [System.Text.UTF8Encoding]::new($false))

# Unified topic return + cache version
@('emerging-contaminants.html','greenhouse-gas-detection.html','microplastics-detection.html','comprehensive-testing-method-development.html') | ForEach-Object {
  $p = Join-Path $Root $_
  if (Test-Path $p) {
    $t = [IO.File]::ReadAllText($p, [Text.Encoding]::UTF8)
    $t = Ensure-TopicReturn $t
    $t = Ensure-V6Assets $t
    [IO.File]::WriteAllText($p, $t, [System.Text.UTF8Encoding]::new($false))
  }
}

# Sitemap: add the four environment topics if missing
if (Test-Path $Sitemap) {
  $sm = [IO.File]::ReadAllText($Sitemap, [Text.Encoding]::UTF8)
  $urls = @(
    'https://www.hongqitengda.com/emerging-contaminants.html',
    'https://www.hongqitengda.com/greenhouse-gas-detection.html',
    'https://www.hongqitengda.com/microplastics-detection.html',
    'https://www.hongqitengda.com/comprehensive-testing-method-development.html'
  )
  $add = ''
  foreach ($u in $urls) {
    if (!$sm.Contains("<loc>$u</loc>")) { $add += "<url><loc>$u</loc><lastmod>2026-09-18</lastmod></url>" }
  }
  if ($add -ne '') { $sm = $sm.Replace('</urlset>', $add + '</urlset>') }
  [IO.File]::WriteAllText($Sitemap, $sm, [System.Text.UTF8Encoding]::new($false))
}

# Remove the obsolete V5 overlay file if it was previously committed
$oldV5 = Join-Path $Root 'assets\css\environment-topics-v5.css'
if (Test-Path $oldV5) { Remove-Item $oldV5 -Force }

# Validation
$hc = [IO.File]::ReadAllText($Index, [Text.Encoding]::UTF8)
$bc = [IO.File]::ReadAllText($Board, [Text.Encoding]::UTF8)
$jc = [IO.File]::ReadAllText((Join-Path $Root 'assets\js\environment-topics.js'), [Text.Encoding]::UTF8)
$requiredHome = @('HPLC 有机污染物定量检测','project/fx-85.html','环境精准检测专题平台','env-topic-emerging','env-topic-greenhouse','env-topic-microplastics','env-topic-custom','综合检测与方法开发','environment-topics-v6.css','static-visuals.js?v=20260918-clean')
foreach ($x in $requiredHome) { if (!$hc.Contains($x)) { throw "首页校验失败：缺少 $x" } }
$forbidden = @('COMING SOON','查看规划 →','微塑料精准检测与来源识别平台')
foreach ($x in $forbidden) { if ($hc.Contains($x)) { throw "首页仍残留旧内容：$x" } }
$requiredBoard = @('HPLC 有机污染物定量检测','新污染物精准检测','温室气体精准检测','微塑料精准检测','综合检测与方法开发')
foreach ($x in $requiredBoard) { if (!$bc.Contains($x)) { throw "分析表征页校验失败：缺少 $x" } }
$requiredFloat = @('env-topic-emerging','env-topic-greenhouse','env-topic-microplastics','env-topic-custom','环境精准检测专题平台')
foreach ($x in $requiredFloat) { if (!$jc.Contains($x)) { throw "浮窗导航校验失败：缺少 $x" } }
if (!(Test-Path (Join-Path $Root 'comprehensive-testing-method-development.html'))) { throw "综合检测与方法开发页面缺失。" }
$cssc = [IO.File]::ReadAllText((Join-Path $Root 'assets\css\environment-topics-v6.css'), [Text.Encoding]::UTF8)
if (!$cssc.Contains('#hqtd-emerging-platform-entry')) { throw "旧浮窗 CSS 兜底缺失。" }


Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host " V6.1 更新成功：四专题 + 浮窗小型化 + 缓存清理 + SEO 收尾" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host "1. 溶液检测 / HPLC 保持原界面和原 project/fx-85.html 跳转。" -ForegroundColor Cyan
Write-Host "2. 首页环境专题升级为 2×2 四卡片。" -ForegroundColor Cyan
Write-Host "3. 新增：综合检测与方法开发（6PPD-Q、重金属、土壤碳、定制方法）。" -ForegroundColor Cyan
Write-Host "4. 右侧浮窗缩小为导航，点击自动滚动到中间对应专题。" -ForegroundColor Cyan
Write-Host "5. 手机端默认只显示小入口，避免与在线咨询遮挡。" -ForegroundColor Cyan
Write-Host "6. 四个专题页统一加入返回环境专题平台入口。" -ForegroundColor Cyan
Write-Host "7. sitemap.xml 自动补充四个专题地址。" -ForegroundColor Cyan
Write-Host "备份目录：$backup" -ForegroundColor DarkGray
Write-Host ""
Start-Process $Index
exit 0
