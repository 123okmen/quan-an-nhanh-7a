@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo Đang khởi động Web App Mô Hình Quán Ăn Nhanh (Số 2 Đường 7A, Phước Thiện)...
call npm.cmd run build
node start_local_web.cjs
pause
