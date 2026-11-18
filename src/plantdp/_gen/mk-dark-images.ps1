# 다크 테마용 바탕 그림 사본 — 원본은 그대로 두고 <이름>-dk.<확장자> 를 만든다(dark-assets.json 이 갈아 끼운다).
# 원칙(메모리 dark-render-light-theme): 자동 반전 금지 — 밝기만 뒤집고 색은 중성 그래파이트로 다시 입힌다(2026-11-06 사용자 지시로 남색에서 바꿈).
#   out = 바탕남색 + k * (1 - 밝기)   (흰 바탕 → #0b111c, 옅은 격자선 · 하늘빛 → 한 단계 밝은 남색)
# 3D 조감도 · 통신실 장면 그림(Scene Image)은 사진 같은 렌더라 건드리지 않는다.
# 실행: powershell -ExecutionPolicy Bypass -File mk-dark-images.ps1
Add-Type -AssemblyName System.Drawing
$dir = Split-Path -Parent $PSScriptRoot
# 로그인 사진(background-base · overlay)은 뒤집으면 큐브가 죽는다 → mk-dark-login.js(Playwright) 가 따로 만든다
$files = @('background.png', 'background-image.png', 'background-layer-1.png', 'background-layer-2.png', 'background-layer-3.png', 'background-layer-4.png')
$base = @(0.052, 0.056, 0.066)
$k = @(0.10, 0.105, 0.12)
$lum = @(0.2126, 0.7152, 0.0722)
$map = @{ 'background-base.png' = 'background-base-dk.jpg'; 'background-overlay.png' = 'background-overlay-dk.jpg' }
foreach ($f in $files) {
  $src = Join-Path $dir $f
  if (-not (Test-Path $src)) { Write-Host "없음 $f"; continue }
  $bytes = [System.IO.File]::ReadAllBytes($src)
  $isJpg = ($bytes[0] -eq 0xFF -and $bytes[1] -eq 0xD8)
  $img = [System.Drawing.Image]::FromFile($src)
  $bmp = New-Object System.Drawing.Bitmap $img.Width, $img.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $cm = New-Object System.Drawing.Imaging.ColorMatrix
  # 행 = 입력 채널(R,G,B,A,1), 열 = 출력 채널
  # 주의: PowerShell 변수 이름은 대소문자를 가리지 않는다($G 가 그래픽스 $g 를 덮어 그림이 전부 검게 나온 적이 있다).
  # 계통도 격자 바탕(background.png)은 밝기 폭이 232~246 뿐이라 그냥 뒤집으면 14~18 로 뭉개져 격자가 사라진다
  # (사용자 지적 "다크에서 세부 계통도 배경이 없어진다") → 이 그림만 밝은 끝(0.965) 기준으로 대비를 늘인다:
  #   out = 바탕 + 틴트 × gain × (0.965 - 밝기)   — 바탕 면은 거의 #0e0f12, 격자선은 한 단계 밝은 회청색
  $stretch = ($f -eq 'background.png')
  $gain = 2.6; $Lhi = 0.965; $tint = @(0.92, 0.96, 1.08)
  for ($o = 0; $o -lt 3; $o++) {
    if ($stretch) {
      for ($i = 0; $i -lt 3; $i++) { $cm.Item($i, $o) = - $tint[$o] * $gain * $lum[$i] }
      $cm.Item(4, $o) = $base[$o] + $tint[$o] * $gain * $Lhi
    } else {
      for ($i = 0; $i -lt 3; $i++) { $cm.Item($i, $o) = - $k[$o] * $lum[$i] }
      $cm.Item(4, $o) = $base[$o] + $k[$o]
    }
  }
  $cm.Item(3, 3) = 1
  $ia = New-Object System.Drawing.Imaging.ImageAttributes
  $ia.SetColorMatrix($cm)
  $rect = New-Object System.Drawing.Rectangle 0, 0, $img.Width, $img.Height
  $g.DrawImage($img, $rect, 0, 0, $img.Width, $img.Height, [System.Drawing.GraphicsUnit]::Pixel, $ia)
  $g.Dispose()
  $name = [System.IO.Path]::GetFileNameWithoutExtension($f)
  if ($isJpg) {
    $out = "$name-dk.jpg"
    $enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $ep = New-Object System.Drawing.Imaging.EncoderParameters 1
    $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), 86L
    $bmp.Save((Join-Path $dir $out), $enc, $ep)
  } else {
    $out = "$name-dk.png"
    $bmp.Save((Join-Path $dir $out), [System.Drawing.Imaging.ImageFormat]::Png)
  }
  $bmp.Dispose(); $img.Dispose()
  $map[$f] = $out
  Write-Host "$f -> $out"
}
$json = '{' + (($map.GetEnumerator() | Sort-Object Name | ForEach-Object { '"' + $_.Name + '":"' + $_.Value + '"' }) -join ',') + '}'
[System.IO.File]::WriteAllText((Join-Path $PSScriptRoot 'dark-assets.json'), $json, (New-Object System.Text.UTF8Encoding $false))
Write-Host $json
