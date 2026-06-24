@echo off
setlocal enabledelayedexpansion

set "ROOT=%~dp0"
set "WEB_DIR=%ROOT%web"
set "FRPS_DIR=%WEB_DIR%\frps"
set "FRPC_DIR=%WEB_DIR%\frpc"

if not exist "%WEB_DIR%" (
  echo web directory not found: "%WEB_DIR%"
  exit /b 1
)

echo [1/4] frps lint
pushd "%FRPS_DIR%" || exit /b 1
call npm run lint
if errorlevel 1 (
  popd
  exit /b 1
)

echo [2/4] frps type-check
call npm run type-check
if errorlevel 1 (
  popd
  exit /b 1
)
popd

echo [3/4] frpc lint
pushd "%FRPC_DIR%" || exit /b 1
call npm run lint
if errorlevel 1 (
  popd
  exit /b 1
)

echo [4/4] frpc type-check
call npm run type-check
set "EXIT_CODE=%ERRORLEVEL%"
popd

if not "%EXIT_CODE%"=="0" exit /b %EXIT_CODE%

echo All checks passed.
endlocal
