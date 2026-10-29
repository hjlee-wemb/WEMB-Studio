# 템플릿 카드 썸네일 만들기 — 재구축 화면 캡처(PNG) → src/templates/shinhan-*.jpg (1920폭 q82)
# 캡처는 미리보기를 `?t=dark` 로 띄워 찍는다(t 를 주면 미리보기의 'theme' 단추가 숨는다).
# 여기에는 PIL 이 없다. System.Drawing 으로 변환한다(POSCO mk-thumb.ps1 과 같은 방식).
# 실행: powershell -ExecutionPolicy Bypass -File src\lselectric\_gen\mk-thumb.ps1
Add-Type -AssemblyName System.Drawing

$gen = Split-Path -Parent $MyInvocation.MyCommand.Path
$outDir = Join-Path (Join-Path (Split-Path -Parent (Split-Path -Parent $gen)) 'templates') ''

# 캡처 파일 → 썸네일 이름 (화면 4장 · 캡처 = 미리보기 ?live=0&t=dark)
$jobs = @(
  @{ src = 'thumb-overview.png'; dst = 'shinhan-overview.jpg' },
  @{ src = 'thumb-register.png'; dst = 'shinhan-register.jpg' },
  @{ src = 'thumb-entry.png';    dst = 'shinhan-entry.jpg' },
  @{ src = 'thumb-anomaly.png';  dst = 'shinhan-anomaly.jpg' }
)

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$prm = New-Object System.Drawing.Imaging.EncoderParameters 1
$prm.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), 82L

foreach ($j in $jobs) {
  $src = Join-Path $gen $j.src
  if (-not (Test-Path $src)) { Write-Output ("건너뜀(캡처 없음): {0}" -f $j.src); continue }
  $dst = Join-Path $outDir $j.dst
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
  Write-Output ("wrote {0} ({1}x{2})" -f $dst, $w, $h)
}
