# Template card thumbnails for the five standalone popups (popup-3..7) -> src/templates/lselectric-<scene>.jpg (1920w q82).
# Same conversion as mk-thumb.ps1 (System.Drawing; no PIL here). Captures: thumb-<scene>.png from the preview at ?live=0&t=dark.
# Run: powershell -ExecutionPolicy Bypass -File src\lselectric\_gen\mk-thumb-popups.ps1
Add-Type -AssemblyName System.Drawing

$gen = Split-Path -Parent $MyInvocation.MyCommand.Path
$outDir = Join-Path (Split-Path -Parent (Split-Path -Parent $gen)) 'templates'

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$prm = New-Object System.Drawing.Imaging.EncoderParameters 1
$prm.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), 82L

foreach ($scene in @('transformer', 'acroom', 'charger', 'cooling', 'alarm')) {
  $src = Join-Path $gen ('thumb-' + $scene + '.png')
  if (-not (Test-Path $src)) { Write-Output ('skip (no capture): ' + $src); continue }
  $dst = Join-Path $outDir ('lselectric-' + $scene + '.jpg')
  $img = [System.Drawing.Image]::FromFile($src)
  $w = 1920
  $h = [int][Math]::Round($img.Height * $w / $img.Width)
  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.DrawImage($img, 0, 0, $w, $h)
  $g.Dispose()
  $bmp.Save($dst, $codec, $prm)
  $bmp.Dispose()
  $img.Dispose()
  Write-Output ('wrote ' + $dst + ' (' + $w + 'x' + $h + ')')
}
