# 템플릿 카드 썸네일 — 재구축 화면 캡처(PNG, cap.js) → src/templates/drawing-<장면>.jpg (1920폭 q82). 긴 화면은 위 1080 만.
# 실행: powershell -ExecutionPolicy Bypass -File src\drawing\_gen\mk-thumb.ps1
Add-Type -AssemblyName System.Drawing
$gen = Split-Path -Parent $MyInvocation.MyCommand.Path
$outDir = Join-Path (Split-Path -Parent (Split-Path -Parent $gen)) 'src\templates'
if (-not (Test-Path $outDir)) { $outDir = Join-Path (Split-Path -Parent $gen) '..\templates' }
$list = Get-Content -Raw -Encoding UTF8 (Join-Path $gen 'screens.json') | ConvertFrom-Json
$codec = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$prm = New-Object Drawing.Imaging.EncoderParameters 1
$prm.Param[0] = New-Object Drawing.Imaging.EncoderParameter ([Drawing.Imaging.Encoder]::Quality), 82L
foreach ($s in $list) {
  $src = Join-Path $gen ('dom-' + $s[0] + '.png')
  if (-not (Test-Path $src)) { Write-Output "캡처 없음 $($s[0])"; continue }
  $img = [Drawing.Image]::FromFile($src)
  $bmp = New-Object Drawing.Bitmap 1920, 1080
  $g = [Drawing.Graphics]::FromImage($bmp)
  $g.DrawImage($img, 0, 0, (New-Object Drawing.Rectangle 0, 0, 1920, 1080), [Drawing.GraphicsUnit]::Pixel)
  $g.Dispose(); $img.Dispose()
  $dst = Join-Path $outDir ('drawing-' + $s[4] + '.jpg')
  $bmp.Save($dst, $codec, $prm); $bmp.Dispose()
}
Write-Output "썸네일 $($list.Count)장 → $outDir"
