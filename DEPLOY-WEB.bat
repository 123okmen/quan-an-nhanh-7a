@echo off
chcp 65001 >nul
title DEPLOY QUAN AN NHANH 7A TO GITHUB PAGES
color 0A
echo ============================================================
echo 🚀 DANG BUILD VA DAY WEB QUAN AN NHANH 7A LEN GITHUB PAGES...
echo ============================================================
echo.

set "PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI;C:\Program Files\nodejs"

cd /d "%~dp0"

echo [1/3] Luu ma nguon moi nhat vao Git...
call git add .
call git commit -m "Update Quan An Nhanh 7A Phuoc Thien web app"
call git push origin main

echo.
echo [2/3] Bien dich du an Vite (Build)...
call npm.cmd run build
if errorlevel 1 (
  echo ❌ Build loi! Khong the deploy.
  pause
  exit /b 1
)

echo.
echo [3/3] Day trang web moi len GitHub Pages (gh-pages)...
call npx.cmd gh-pages -d dist

echo.
echo ============================================================
echo ✅ DA PUBLISH WEBSITE MOI NHAT 100%% THANH CONG!
echo 🌐 Link Gọi Món Tại Bàn: https://123okmen.github.io/quan-an-nhanh-7a/#/order
echo 👥 Link Ca Làm / Bếp:    https://123okmen.github.io/quan-an-nhanh-7a/#/staff
echo 📊 Link Báo Cáo:         https://123okmen.github.io/quan-an-nhanh-7a/#/planner
echo 📋 Link Kế Hoạch Setup:  https://123okmen.github.io/quan-an-nhanh-7a/#/plan
echo ============================================================
echo.
pause
