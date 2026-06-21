param(
    [int]$FrpsBindPort = 7000,
    [int]$FrpsDashboardPort = 7500,
    [int]$FrpcDashboardPort = 7400,
    [int]$FrpsWebPort = 5173,
    [int]$FrpcWebPort = 5174,
    [string]$WebHost = "127.0.0.1",
    [string]$WebUser = "admin",
    [string]$WebPassword = "admin",
    [string]$AuthToken = "dev-token",
    [switch]$Check
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$DevRuntimeDir = Join-Path $RepoRoot ".cache\dev"
$LogDir = Join-Path $DevRuntimeDir "logs"
$FrpsConfigPath = Join-Path $DevRuntimeDir "frps.toml"
$FrpcConfigPath = Join-Path $DevRuntimeDir "frpc.toml"
$FrpcStorePath = Join-Path $DevRuntimeDir "frpc_store.json"
$WebRootBinPath = Join-Path $RepoRoot "web\node_modules\.bin"
$script:DevProcesses = @()

# Ensures the dev stack fails early when a required CLI is unavailable.
function Resolve-RequiredCommand {
    param([string]$Name)

    $command = Get-Command -Name $Name -ErrorAction SilentlyContinue
    if (-not $command) {
        throw "Missing required command: $Name"
    }
    return $command.Source
}

# Escapes values written into generated TOML string fields.
function ConvertTo-TomlString {
    param([string]$Value)

    $escapedValue = $Value.Replace("\", "\\").Replace('"', '\"')
    return '"' + $escapedValue + '"'
}

# Normalizes Windows paths so TOML does not treat backslashes as escape sequences.
function ConvertTo-TomlPath {
    param([string]$Path)

    return ConvertTo-TomlString -Value $Path.Replace("\", "/")
}

# Builds a command line string while preserving arguments that contain spaces.
function Join-ProcessArguments {
    param([string[]]$ArgumentList)

    $quotedArguments = foreach ($arg in $ArgumentList) {
        if ($arg -match '[\s"]') {
            '"' + $arg.Replace('"', '\"') + '"'
        } else {
            $arg
        }
    }
    return ($quotedArguments -join " ")
}

# Runs pnpm through PowerShell so per-process VITE_API_URL can be injected.
function New-EncodedPowerShellArguments {
    param([string]$Command)

    $encodedCommand = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($Command))
    return Join-ProcessArguments -ArgumentList @(
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-EncodedCommand",
        $encodedCommand
    )
}

# Allows pnpm scripts to reuse workspace-level binaries such as vite.
function Get-WebDevPathPrefix {
    param([string]$ProjectDir)

    $projectBinPath = Join-Path $ProjectDir "node_modules\.bin"
    $candidateBinPaths = @($projectBinPath, $WebRootBinPath) | Where-Object {
        Test-Path -LiteralPath $_
    }
    $viteCommands = foreach ($binPath in $candidateBinPaths) {
        @(
            Join-Path $binPath "vite.cmd"
            Join-Path $binPath "vite.ps1"
            Join-Path $binPath "vite"
        )
    }

    if (-not ($viteCommands | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1)) {
        throw "Missing vite binary. Run dependency install for web/frps and web/frpc first."
    }

    return (($candidateBinPaths | Select-Object -Unique) -join [IO.Path]::PathSeparator)
}

# Detects port conflicts before starting long-running dev processes.
function Assert-TcpPortAvailable {
    param(
        [string]$HostName,
        [int]$Port
    )

    $netConnectionCommand = Get-Command -Name "Get-NetTCPConnection" -ErrorAction SilentlyContinue
    if ($netConnectionCommand) {
        $listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Where-Object {
            $_.LocalAddress -in @($HostName, "0.0.0.0", "::", "::1")
        }
        if ($listeners) {
            $processIds = ($listeners | Select-Object -ExpandProperty OwningProcess -Unique) -join ","
            throw "Port $HostName`:$Port is already listening, pid=$processIds"
        }
        return
    }

    $address = [Net.IPAddress]::Parse($HostName)
    $listener = [Net.Sockets.TcpListener]::new($address, $Port)
    try {
        $listener.Start()
    } catch {
        throw "Port $HostName`:$Port is already in use"
    } finally {
        $listener.Stop()
    }
}

# Writes disposable frps/frpc configs used only by the local dev launcher.
function Write-DevConfigs {
    New-Item -ItemType Directory -Force -Path $DevRuntimeDir | Out-Null

    $webUserValue = ConvertTo-TomlString -Value $WebUser
    $webPasswordValue = ConvertTo-TomlString -Value $WebPassword
    $authTokenValue = ConvertTo-TomlString -Value $AuthToken
    $storePathValue = ConvertTo-TomlPath -Path $FrpcStorePath

    $frpsConfig = @"
bindPort = $FrpsBindPort

auth.method = "token"
auth.token = $authTokenValue

webServer.addr = "127.0.0.1"
webServer.port = $FrpsDashboardPort
webServer.user = $webUserValue
webServer.password = $webPasswordValue
"@

    $frpcConfig = @"
serverAddr = "127.0.0.1"
serverPort = $FrpsBindPort
loginFailExit = false

auth.method = "token"
auth.token = $authTokenValue

webServer.addr = "127.0.0.1"
webServer.port = $FrpcDashboardPort
webServer.user = $webUserValue
webServer.password = $webPasswordValue

[store]
path = $storePathValue
"@

    Set-Content -LiteralPath $FrpsConfigPath -Value $frpsConfig -Encoding ASCII
    Set-Content -LiteralPath $FrpcConfigPath -Value $frpcConfig -Encoding ASCII
}

# Starts one background process and redirects its output to a stable log file.
function Start-LoggedProcess {
    param(
        [string]$Name,
        [string]$FilePath,
        [string]$Arguments,
        [string]$WorkingDirectory
    )

    New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

    $stdoutPath = Join-Path $LogDir "$Name.out.log"
    $stderrPath = Join-Path $LogDir "$Name.err.log"
    Set-Content -LiteralPath $stdoutPath -Value "" -Encoding UTF8
    Set-Content -LiteralPath $stderrPath -Value "" -Encoding UTF8

    $process = Start-Process `
        -FilePath $FilePath `
        -ArgumentList $Arguments `
        -WorkingDirectory $WorkingDirectory `
        -RedirectStandardOutput $stdoutPath `
        -RedirectStandardError $stderrPath `
        -WindowStyle Hidden `
        -PassThru

    $script:DevProcesses += [pscustomobject]@{
        Name = $Name
        Process = $process
        Stdout = $stdoutPath
        Stderr = $stderrPath
    }

    Write-Host ("started {0} pid={1}" -f $Name, $process.Id)
}

# Stops a launcher process and its children, including go-run and Vite workers.
function Stop-ProcessTree {
    param([int]$ProcessId)

    if ($env:OS -eq "Windows_NT") {
        & taskkill.exe /PID $ProcessId /T /F *> $null
    } else {
        Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
    }
}

# Cleans up started processes in reverse order to keep shutdown predictable.
function Stop-DevProcesses {
    $processEntries = @($script:DevProcesses)
    [array]::Reverse($processEntries)
    foreach ($entry in $processEntries) {
        $entry.Process.Refresh()
        if (-not $entry.Process.HasExited) {
            Write-Host ("stopping {0} pid={1}" -f $entry.Name, $entry.Process.Id)
            Stop-ProcessTree -ProcessId $entry.Process.Id
        }
    }
}

# Prints the API and Vite URLs that the developer should open.
function Write-DevSummary {
    Write-Host ""
    Write-Host "frps dashboard api: http://127.0.0.1:$FrpsDashboardPort"
    Write-Host "frps web dev:       http://$WebHost`:$FrpsWebPort"
    Write-Host "frpc dashboard api: http://127.0.0.1:$FrpcDashboardPort"
    Write-Host "frpc web dev:       http://$WebHost`:$FrpcWebPort"
    Write-Host "dashboard login:    $WebUser / $WebPassword"
    Write-Host "runtime dir:        $DevRuntimeDir"
    Write-Host "logs dir:           $LogDir"
    Write-Host ""
}

$goPath = Resolve-RequiredCommand -Name "go"
Resolve-RequiredCommand -Name "pnpm" | Out-Null
$powerShellCommand = Get-Command -Name "pwsh" -ErrorAction SilentlyContinue
if (-not $powerShellCommand) {
    $powerShellCommand = Get-Command -Name "powershell" -ErrorAction Stop
}

foreach ($port in @($FrpsBindPort, $FrpsDashboardPort, $FrpcDashboardPort, $FrpsWebPort, $FrpcWebPort)) {
    Assert-TcpPortAvailable -HostName "127.0.0.1" -Port $port
}

$frpsWebPathPrefix = Get-WebDevPathPrefix -ProjectDir (Join-Path $RepoRoot "web\frps")
$frpcWebPathPrefix = Get-WebDevPathPrefix -ProjectDir (Join-Path $RepoRoot "web\frpc")

Write-DevConfigs
Write-DevSummary

if ($Check) {
    Write-Host "dev.ps1 check passed"
    return
}

$frpsGoArguments = Join-ProcessArguments -ArgumentList @(
    "run",
    "-tags",
    "frps,noweb",
    ".\cmd\frps",
    "-c",
    $FrpsConfigPath
)
$frpcGoArguments = Join-ProcessArguments -ArgumentList @(
    "run",
    "-tags",
    "frpc,noweb",
    ".\cmd\frpc",
    "-c",
    $FrpcConfigPath
)
$pathSeparator = [IO.Path]::PathSeparator
$frpsWebArguments = New-EncodedPowerShellArguments -Command @"
`$env:PATH = "$frpsWebPathPrefix$pathSeparator`$env:PATH"
`$env:pnpm_config_verify_deps_before_run = "false"
`$env:VITE_API_URL = "http://127.0.0.1:$FrpsDashboardPort"
pnpm run dev -- --host $WebHost --port $FrpsWebPort --strictPort
"@
$frpcWebArguments = New-EncodedPowerShellArguments -Command @"
`$env:PATH = "$frpcWebPathPrefix$pathSeparator`$env:PATH"
`$env:pnpm_config_verify_deps_before_run = "false"
`$env:VITE_API_URL = "http://127.0.0.1:$FrpcDashboardPort"
pnpm run dev -- --host $WebHost --port $FrpcWebPort --strictPort
"@

try {
    Start-LoggedProcess -Name "frps-go" -FilePath $goPath -Arguments $frpsGoArguments -WorkingDirectory $RepoRoot
    Start-LoggedProcess -Name "frpc-go" -FilePath $goPath -Arguments $frpcGoArguments -WorkingDirectory $RepoRoot
    Start-LoggedProcess -Name "frps-web" -FilePath $powerShellCommand.Source -Arguments $frpsWebArguments -WorkingDirectory (Join-Path $RepoRoot "web\frps")
    Start-LoggedProcess -Name "frpc-web" -FilePath $powerShellCommand.Source -Arguments $frpcWebArguments -WorkingDirectory (Join-Path $RepoRoot "web\frpc")

    Write-Host "dev stack is running. Press Ctrl+C to stop all processes."
    while ($true) {
        foreach ($entry in $script:DevProcesses) {
            $entry.Process.Refresh()
            if ($entry.Process.HasExited) {
                throw ("{0} exited with code {1}. stdout: {2}; stderr: {3}" -f $entry.Name, $entry.Process.ExitCode, $entry.Stdout, $entry.Stderr)
            }
        }
        Start-Sleep -Seconds 2
    }
} finally {
    Stop-DevProcesses
}
