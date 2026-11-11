# 템플릿 카드 썸네일 — 재구축 화면 캡처(thumb-<장면>.png, 1920x1080) → src/templates/gasmon-<장면>.jpg (1920폭 q82)
# 실행: powershell -ExecutionPolicy Bypass -File src\gasmon\_gen\mk-thumb.ps1
Add-Type -AssemblyName System.Drawing
$gen = Split-Path -Parent $MyInvocation.MyCommand.Path
$outDir = Join-Path (Split-Path -Parent (Split-Path -Parent $gen)) 'templates'
$codec = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$prm = New-Object Drawing.Imaging.EncoderParameters 1
$prm.Param[0] = New-Object Drawing.Imaging.EncoderParameter ([Drawing.Imaging.Encoder]::Quality), 82L
$n = 0
foreach ($s in @('main', 'gas', 'worksite', 'alarm', 'confirm')) {
  $src = Join-Path $gen ('thumb-' + $s + '.png')
  if (-not (Test-Path $src)) { Write-Output "캡처 없음 $s"; continue }
  $img = [Drawing.Image]::FromFile($src)
  $bmp = New-Object Drawing.Bitmap 1920, 1080
  $g = [Drawing.Graphics]::FromImage($bmp)
  $g.DrawImage($img, 0, 0, (New-Object Drawing.Rectangle 0, 0, 1920, 1080), [Drawing.GraphicsUnit]::Pixel)
  $g.Dispose(); $img.Dispose()
  $bmp.Save((Join-Path $outDir ('gasmon-' + $s + '.jpg')), $codec, $prm); $bmp.Dispose(); $n++
}
Write-Output "썸네일 $n장 → $outDir"
