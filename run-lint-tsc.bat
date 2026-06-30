@echo off
setlocal enabledelayedexpansion

set "ROOT=%~dp0"
set "WEB_DIR=%ROOT%web"
if not exist "%WEB_DIR%" (
  echo web directory not found: "%WEB_DIR%"
  exit /b 1
)

echo [1/4] frps lint
pushd "%WEB_DIR%" || exit /b 1
call pnpm --filter frps-dashboard lint
if errorlevel 1 (
  popd
  exit /b 1
)

echo [2/4] frps type-check
call pnpm --filter frps-dashboard type-check
if errorlevel 1 (
  popd
  exit /b 1
)

echo [3/4] frpc lint
call pnpm --filter frpc-dashboard lint
if errorlevel 1 (
  popd
  exit /b 1
)

echo [4/4] frpc type-check
call pnpm --filter frpc-dashboard type-check
set "EXIT_CODE=%ERRORLEVEL%"
popd

if not "%EXIT_CODE%"=="0" exit /b %EXIT_CODE%

echo All checks passed.
endlocal
