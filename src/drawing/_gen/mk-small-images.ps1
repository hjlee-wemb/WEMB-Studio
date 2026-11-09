# 화면보다 훨씬 큰 원본 그림을 표시 크기의 2~4배로 줄인다(열기 1.5초 규칙). 그림 자체는 Figma 원본에서 줄인 것.
Add-Type -AssemblyName System.Drawing
$dir = Join-Path $PSScriptRoot '..'
$targets = @{ 'viewer.png' = 1200; 'viewer-1.png' = 1200; 'viewer-2.png' = 1200; 'viewer-3.png' = 1200; 'icon-image.png' = 480; 'icon-image-1.png' = 480; 'icon-image-2.png' = 480 }
foreach ($name in $targets.Keys) {
  $p = Join-Path $dir $name
  if (-not (Test-Path $p)) { Write-Output "없음 $name"; continue }
  $bytes = [IO.File]::ReadAllBytes($p)
  $ms = New-Object IO.MemoryStream(,$bytes)
  $src = [Drawing.Image]::FromStream($ms)
  $w = $targets[$name]
  if ($src.Width -le $w) { Write-Output "$name 이미 $($src.Width)"; $src.Dispose(); continue }
  $h = [int][Math]::Round($src.Height * $w / $src.Width)
  $bmp = New-Object Drawing.Bitmap($w, $h, [Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $gr = [Drawing.Graphics]::FromImage($bmp)
  $gr.InterpolationMode = 'HighQualityBicubic'; $gr.SmoothingMode = 'HighQuality'; $gr.PixelOffsetMode = 'HighQuality'; $gr.CompositingQuality = 'HighQuality'
  $gr.DrawImage($src, 0, 0, $w, $h)
  $gr.Dispose(); $src.Dispose()
  $bmp.Save($p, [Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Output "$name -> ${w}x${h} $((Get-Item $p).Length)"
}
