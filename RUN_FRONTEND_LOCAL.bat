@echo off
title UniFind DNTU - Local UI
cd /d "%~dp0"

if not exist package.json (
  echo [LOI] Ban dang chay file nay trong thu muc patch rieng.
  echo Hay giai nen va ghi de noi dung patch vao thu muc goc foundapp truoc.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo [LOI] Chua cai Node.js. Hay cai Node.js 18 tro len.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Dang cai thu vien...
  call npm install
  if errorlevel 1 (
    echo [LOI] npm install that bai.
    pause
    exit /b 1
  )
)

echo Dang mo UniFind DNTU tai local...
call npm run dev
pause
