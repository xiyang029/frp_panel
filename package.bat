@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "ROOT=%~dp0"
set "WEB_DIR=%ROOT%web"
set "RELEASE_DIR=%ROOT%release"
set "PACKAGES_DIR=%RELEASE_DIR%\packages"
set "BIN_DIR=%ROOT%bin"
set "NPM_REGISTRY=https://registry.npmmirror.com"

where go >nul 2>nul || (
  echo missing command: go
  exit /b 1
)
where pnpm >nul 2>nul || (
  echo missing command: pnpm
  exit /b 1
)
where tar >nul 2>nul || (
  echo missing command: tar
  exit /b 1
)

if exist "%BIN_DIR%" rmdir /s /q "%BIN_DIR%"
if exist "%RELEASE_DIR%" rmdir /s /q "%RELEASE_DIR%"
if exist "%WEB_DIR%\node_modules" rmdir /s /q "%WEB_DIR%\node_modules"
if exist "%WEB_DIR%\frps\node_modules" rmdir /s /q "%WEB_DIR%\frps\node_modules"
if exist "%WEB_DIR%\frpc\node_modules" rmdir /s /q "%WEB_DIR%\frpc\node_modules"
mkdir "%BIN_DIR%" >nul
mkdir "%PACKAGES_DIR%" >nul

echo [1/6] Installing frontend dependencies
pushd "%WEB_DIR%" || goto :fail
call pnpm install --registry="%NPM_REGISTRY%"
set "INSTALL_EXIT=%ERRORLEVEL%"
popd
if not "%INSTALL_EXIT%"=="0" goto :fail
if errorlevel 1 goto :fail

echo [2/6] Building frps web assets
call pnpm --dir "%WEB_DIR%" --filter frps-dashboard build
if errorlevel 1 goto :fail

echo [3/6] Building frpc web assets
call pnpm --dir "%WEB_DIR%" --filter frpc-dashboard build
if errorlevel 1 goto :fail

echo [4/6] Building Windows binaries
set "CGO_ENABLED=0"
go build -trimpath -ldflags "-s -w" -tags "frps" -o "%BIN_DIR%\frps_windows_amd64.exe" .\cmd\frps
if errorlevel 1 goto :fail
go build -trimpath -ldflags "-s -w" -tags "frpc" -o "%BIN_DIR%\frpc_windows_amd64.exe" .\cmd\frpc
if errorlevel 1 goto :fail

for /f "usebackq delims=" %%V in (`"%BIN_DIR%\frps_windows_amd64.exe" --version`) do set "FRP_VERSION=%%V"
if not defined FRP_VERSION (
  echo failed to resolve frp version
  goto :fail
)

echo [5/6] Building Linux binaries
set "GOOS=linux"
set "GOARCH=amd64"
go build -trimpath -ldflags "-s -w" -tags "frps" -o "%BIN_DIR%\frps_linux_amd64" .\cmd\frps
if errorlevel 1 goto :fail
go build -trimpath -ldflags "-s -w" -tags "frpc" -o "%BIN_DIR%\frpc_linux_amd64" .\cmd\frpc
if errorlevel 1 goto :fail

echo [6/6] Creating release packages
set "WINDOWS_PKG=%PACKAGES_DIR%\frp_%FRP_VERSION%_windows_amd64"
set "LINUX_PKG=%PACKAGES_DIR%\frp_%FRP_VERSION%_linux_amd64"

mkdir "%WINDOWS_PKG%" >nul
mkdir "%LINUX_PKG%" >nul

copy /Y "%ROOT%LICENSE" "%WINDOWS_PKG%\" >nul
copy /Y "%ROOT%LICENSE" "%LINUX_PKG%\" >nul
copy /Y "%ROOT%conf\frpc.toml" "%WINDOWS_PKG%\" >nul
copy /Y "%ROOT%conf\frps.toml" "%WINDOWS_PKG%\" >nul
copy /Y "%ROOT%conf\frpc.toml" "%LINUX_PKG%\" >nul
copy /Y "%ROOT%conf\frps.toml" "%LINUX_PKG%\" >nul
copy /Y "%BIN_DIR%\frpc_windows_amd64.exe" "%WINDOWS_PKG%\frpc.exe" >nul
copy /Y "%BIN_DIR%\frps_windows_amd64.exe" "%WINDOWS_PKG%\frps.exe" >nul
copy /Y "%BIN_DIR%\frpc_linux_amd64" "%LINUX_PKG%\frpc" >nul
copy /Y "%BIN_DIR%\frps_linux_amd64" "%LINUX_PKG%\frps" >nul

tar -czf "%PACKAGES_DIR%\frp_%FRP_VERSION%_linux_amd64.tar.gz" -C "%PACKAGES_DIR%" "frp_%FRP_VERSION%_linux_amd64"
if errorlevel 1 goto :fail

powershell -NoProfile -ExecutionPolicy Bypass -Command "Compress-Archive -Path '%WINDOWS_PKG%\*' -DestinationPath '%PACKAGES_DIR%\frp_%FRP_VERSION%_windows_amd64.zip' -Force"
if errorlevel 1 goto :fail

rmdir /s /q "%WINDOWS_PKG%"
rmdir /s /q "%LINUX_PKG%"

echo done
echo release artifacts are in %PACKAGES_DIR%
exit /b 0

:fail
set "EXIT_CODE=%errorlevel%"
echo packaging failed with exit code %EXIT_CODE%
exit /b %EXIT_CODE%
