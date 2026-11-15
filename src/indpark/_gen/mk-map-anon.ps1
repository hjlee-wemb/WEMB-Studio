# Map image anonymization: the satellite map (map.png) still had the original site labels baked in
# (real company names). The DOM overlay labels hide them at rest, but they showed through while the
# labels animate in / during screen switches (2026-11-13). This bakes the anonymized overlay labels
# into the image at the same spots, so the image itself carries only the virtual names.
# Inputs (in _gen): map.orig.png (original image), map-labeled.png (DOM capture of the Map box at
# 1536x720 with overlay labels, node pw.js dbg-map.js), map-labels.json (label rects in Map px).
# Output: ..\map.png
# Run: powershell -NoProfile -ExecutionPolicy Bypass -File mk-map-anon.ps1
Add-Type -AssemblyName System.Drawing
$gen = $PSScriptRoot
$dir = Split-Path -Parent $gen
$src = New-Object System.Drawing.Bitmap (Join-Path $gen 'map.orig.png')
$cap = New-Object System.Drawing.Bitmap (Join-Path $gen 'map-labeled.png')
$json = Get-Content -Raw (Join-Path $gen 'map-labels.json') | ConvertFrom-Json
$out = New-Object System.Drawing.Bitmap $src.Width, $src.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($out)
$g.DrawImage($src, 0, 0, $src.Width, $src.Height)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
# object-fit: cover scale from image px to Map box px
$k = [Math]::Max($cap.Width / $src.Width, $cap.Height / $src.Height)
$ox = ($cap.Width - $src.Width * $k) / 2
$oy = ($cap.Height - $src.Height * $k) / 2
$pad = 3
$n = 0
foreach ($r in $json.L) {
  $x = [double]$r[0] - $pad; $y = [double]$r[1] - $pad; $w = [double]$r[2] + 2 * $pad; $h = [double]$r[3] + 2 * $pad
  $dst = New-Object System.Drawing.RectangleF ([float](($x - $ox) / $k)), ([float](($y - $oy) / $k)), ([float]($w / $k)), ([float]($h / $k))
  $sr = New-Object System.Drawing.RectangleF ([float]$x), ([float]$y), ([float]$w), ([float]$h)
  $g.DrawImage($cap, $dst, $sr, [System.Drawing.GraphicsUnit]::Pixel)
  $n++
}
$g.Dispose(); $src.Dispose(); $cap.Dispose()
$out.Save((Join-Path $dir 'map.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$out.Dispose()
Write-Output "map.png labels replaced: $n"
