# WEMB Studio - local server for offline use (no install needed; Windows PowerShell 5.1+)
# Started by the "WEMB Studio *.cmd" launcher next to this file. Serves this folder at http://localhost:5510/ and opens the browser.
# Projects are stored in the browser per address (origin), so the port is fixed on purpose:
# if 5510 is already serving WEMB Studio, this script just opens it instead of starting a second copy.
#
# Two ways to serve, at the same address:
#  1. wemb-atomic server (Node.js 18+), when Node.js and the wemb-atomic folder are found.
#     The molecule library (home menu) and the atom swap panel (studio) need it: their data comes from /api/...
#     and their saved work (versions, names, screens) is written to files in wemb-atomic\data.
#  2. This script (built-in HttpListener) otherwise. Everything except those two features works.
# Where it looks:
#  wemb-atomic : $env:WEMB_ATOMIC_DIR, .\wemb-atomic, ..\WEMB-02\wemb-atomic, ..\wemb-atomic
#  Node.js     : .\node\node.exe (a portable copy, no install), then node on PATH
# -StaticOnly always uses 2. -NoBrowser does not open the browser (for tests).
param([int]$Port = 5510, [switch]$NoBrowser, [switch]$StaticOnly)

$ProgressPreference = 'SilentlyContinue'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$base = "http://localhost:$Port/"
$home_url = $base + 'index.html'

# Is anything listening on the port? A closed port answers in about 0.4s (a web request to it waits 2s).
function Test-Port {
  $c = New-Object System.Net.Sockets.TcpClient
  try { return ($c.ConnectAsync('127.0.0.1', $Port).Wait(400) -and $c.Connected) } catch { return $false } finally { $c.Close() }
}

function Test-Studio {
  if (-not (Test-Port)) { return $false }
  try {
    $r = Invoke-WebRequest -Uri $home_url -UseBasicParsing -TimeoutSec 3
    return ($r.StatusCode -eq 200 -and $r.Content -match 'WEMB')
  } catch { return $false }
}

function Open-Studio([string]$how) {
  Write-Host ""
  Write-Host "  WEMB Studio  ->  $home_url"
  Write-Host "  $how"
  Write-Host "  Always open this address: projects are saved per address."
  Write-Host "  Works without internet. Keep this window open while you use it; close it to stop."
  Write-Host ""
  if (-not $NoBrowser) { Start-Process $home_url }
}

function Stop-PortInUse {
  Write-Host ""
  Write-Host "Port $Port is used by another program. Close it and run again."
  Write-Host "(Projects are saved per address, so WEMB Studio always uses port $Port.)"
  Read-Host "Press Enter to close"
  exit 1
}

function Find-Atomic {
  foreach ($d in @($env:WEMB_ATOMIC_DIR, (Join-Path $root 'wemb-atomic'), (Join-Path $root '..\WEMB-02\wemb-atomic'), (Join-Path $root '..\wemb-atomic'))) {
    if ($d -and (Test-Path -LiteralPath (Join-Path $d 'server.mjs')) -and (Test-Path -LiteralPath (Join-Path $d 'library\library.json'))) {
      return [System.IO.Path]::GetFullPath($d)
    }
  }
  return $null
}

function Find-Node {
  $local = Join-Path $root 'node\node.exe'
  if (Test-Path -LiteralPath $local) { return $local }
  $cmd = Get-Command node.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($cmd) { return $cmd.Path }
  return $null
}

function Get-NodeMajor([string]$node) {
  try { $v = & $node -v 2>$null; if ("$v" -match '^v(\d+)\.') { return [int]$Matches[1] } } catch { }
  return 0
}

# Already running? (another window of this script) -> just open the browser
if (Test-Studio) {
  Write-Host "WEMB Studio is already running: $home_url"
  if (-not $NoBrowser) { Start-Process $home_url }
  exit 0
}
if (Test-Port) { Stop-PortInUse }

# 1. wemb-atomic server (Node.js)
$why = $null
if ($StaticOnly) {
  $why = 'started with -StaticOnly'
} else {
  $atomic = Find-Atomic
  $node = Find-Node
  if (-not $atomic) { $why = 'the wemb-atomic folder (with library\library.json) was not found' }
  elseif (-not $node) { $why = 'Node.js was not found (install Node.js 18+ or put node.exe in the "node" folder here)' }
  elseif ((Get-NodeMajor $node) -lt 18) { $why = "Node.js 18+ is needed ($node is older)" }
  else {
    $env:WEMB_ATOMIC_PORT = "$Port"
    $env:WEMB_STUDIO_DIR = $root
    $p = Start-Process -FilePath $node -ArgumentList 'server.mjs' -WorkingDirectory $atomic -NoNewWindow -PassThru
    $null = $p.Handle # keeps ExitCode readable after it exits
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $up = $false
    while (-not $p.HasExited -and $sw.ElapsedMilliseconds -lt 30000) {
      if (Test-Port) { $up = $true; break }
      Start-Sleep -Milliseconds 100
    }
    if ($up) {
      Open-Studio 'Molecule library and atom swap are on (wemb-atomic server).'
      $p.WaitForExit()
      if ($p.ExitCode -ne 0) { Write-Host ""; Write-Host "The server stopped (see the message above)."; Read-Host "Press Enter to close" }
      exit $p.ExitCode
    }
    if (-not $p.HasExited) { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue }
    $why = 'the wemb-atomic server did not start (see the message above)'
  }
}

# 2. Built-in server - everything but the molecule library and atom swap
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($base)
try { $listener.Start() } catch { Stop-PortInUse }

$mime = @{
  '.html' = 'text/html; charset=utf-8'; '.htm' = 'text/html; charset=utf-8'
  '.js' = 'text/javascript; charset=utf-8'; '.mjs' = 'text/javascript; charset=utf-8'
  '.css' = 'text/css; charset=utf-8'; '.json' = 'application/json; charset=utf-8'
  '.md' = 'text/markdown; charset=utf-8'; '.txt' = 'text/plain; charset=utf-8'
  '.svg' = 'image/svg+xml'; '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'
  '.gif' = 'image/gif'; '.webp' = 'image/webp'; '.avif' = 'image/avif'; '.ico' = 'image/x-icon'
  '.woff2' = 'font/woff2'; '.woff' = 'font/woff'; '.ttf' = 'font/ttf'; '.otf' = 'font/otf'
  '.mp4' = 'video/mp4'; '.webm' = 'video/webm'; '.pdf' = 'application/pdf'
}
$rootFull = [System.IO.Path]::GetFullPath($root).TrimEnd('\') + '\'

Open-Studio "Molecule library and atom swap are off: $why."

while ($listener.IsListening) {
  try { $ctx = $listener.GetContext() } catch { break }
  $res = $ctx.Response
  try {
    $rel = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
    if ($rel -eq '') { $rel = 'index.html' }
    $path = [System.IO.Path]::GetFullPath((Join-Path $root $rel))
    if ((Test-Path -LiteralPath $path -PathType Container)) { $path = Join-Path $path 'index.html' }
    if (-not $path.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $path -PathType Leaf)) {
      $res.StatusCode = 404
      $bytes = [System.Text.Encoding]::UTF8.GetBytes('Not found')
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ext = [System.IO.Path]::GetExtension($path).ToLowerInvariant()
      $res.ContentType = $(if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' })
      # Always fresh (an old cached studio.html once hid fixes)
      $res.Headers['Cache-Control'] = 'no-store'
      $fs = [System.IO.File]::OpenRead($path)
      try {
        $res.ContentLength64 = $fs.Length
        $fs.CopyTo($res.OutputStream)
      } finally { $fs.Dispose() }
    }
  } catch {
    # browser closed the connection mid-transfer - ignore
  } finally {
    try { $res.OutputStream.Close() } catch { }
  }
}
