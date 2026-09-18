@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo ============================================================
echo  HQTD 官网 GitHub 更新 V8.1
echo  - 官网整体布局保持不变
echo  - 分析表征改为：材料表征 / 环境检测
echo  - 原分析表征内容保留不变
echo  - 在下方新增环境检测专题模块
echo  - 保留四张专题素材图 + 需求表下载
  - 首页新增环境检测专题浮动宣传窗口
echo ============================================================
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0HQTD_UPDATE_V8.1.ps1"
if errorlevel 1 (
  echo.
  echo [FAILED] 更新未完成，请不要提交 GitHub。
  pause
  exit /b 1
)
echo.
echo [SUCCESS] 本地首页已打开。
echo 检查无误后：GitHub Desktop - Commit to main - Push origin
pause
exit /b 0
