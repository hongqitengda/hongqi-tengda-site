@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo ============================================================
echo  HQTD 环境精准检测专题 V6.1 最终校验版
echo  - 2x2 四专题矩阵
echo  - 新增综合检测与方法开发
echo  - 浮窗小型化并联动中间四专题
echo  - 手机端避免遮挡在线咨询
echo  - 保留原溶液检测/HPLC
echo  - 专题返回入口 + sitemap SEO
echo ============================================================
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0HQTD_UPDATE_V6.1.ps1"
if errorlevel 1 (
  echo.
  echo [FAILED] 更新未完成，请不要提交 GitHub。
  echo 请把上面的错误截图发给我。
  pause
  exit /b 1
)
echo.
echo [SUCCESS] 已自动打开本地首页，请检查效果。
echo 确认无误后：GitHub Desktop - Commit to main - Push origin
pause
exit /b 0
