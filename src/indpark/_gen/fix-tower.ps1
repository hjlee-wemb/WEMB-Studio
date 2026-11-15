# Remove the real company text/logo baked into the 3D render tower (screen-site-3-d-1.png) using surrounding pixels.
#  - white band text (x 1158..1171, y 162..202): band shading varies only horizontally -> fill each column with the mean of its brightest band pixels
#  - logo on the teal body (x 1153..1172, y 146..154): copy the mean of the body rows just below (y 155..157) per column
param([string]$src, [string]$dst)
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile($src)
$bm = New-Object System.Drawing.Bitmap $img
$img.Dispose()
function L($c) { return 0.299 * $c.R + 0.587 * $c.G + 0.114 * $c.B }
for ($x = 1156; $x -le 1173; $x++) {
  $cols = @()
  for ($y = 160; $y -le 204; $y++) { $cols += $bm.GetPixel($x, $y) }
  $sorted = @($cols | Sort-Object { L $_ } -Descending)
  $k = [int][Math]::Floor($sorted.Count * 0.4)
  $top = $sorted[0..$k]
  $r = ($top | Measure-Object -Property R -Average).Average
  $g = ($top | Measure-Object -Property G -Average).Average
  $b = ($top | Measure-Object -Property B -Average).Average
  $ref = 0.299 * $r + 0.587 * $g + 0.114 * $b
  for ($y = 161; $y -le 203; $y++) {
    $c = $bm.GetPixel($x, $y)
    if ($x -ge 1157 -and $x -le 1172) { $bm.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($c.A, [int]$r, [int]$g, [int]$b)) } elseif ((L $c) -lt ($ref - 6)) { $bm.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($c.A, [int]$r, [int]$g, [int]$b)) }
  }
}
for ($x = 1152; $x -le 1173; $x++) {
  $t = $bm.GetPixel($x, 145); $u = $bm.GetPixel($x, 154)
  if ([Math]::Abs($t.G - $t.R) -lt 30) { $t = $u }
  for ($y = 146; $y -le 153; $y++) {
    $k = ($y - 145) / 9.0
    $bm.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, [int]($t.R + ($u.R - $t.R) * $k), [int]($t.G + ($u.G - $t.G) * $k), [int]($t.B + ($u.B - $t.B) * $k)))
  }
}

# small logos on the main building facades: row-wise inpaint (interpolate each masked run between its unmasked neighbours)
function Patch($x0, $x1, $y0, $y1) {
  for ($y = $y0; $y -le $y1; $y++) {
    $row = @(); for ($x = $x0; $x -le $x1; $x++) { $row += $bm.GetPixel($x, $y) }
    $ls = @($row | ForEach-Object { L $_ } | Sort-Object -Descending)
    $wallL = $ls[[int][Math]::Floor($ls.Count * 0.25)]
    $m = @(); for ($i = 0; $i -lt $row.Count; $i++) { $c = $row[$i]; $l = L $c; $m += (((($c.G - $c.R) -gt 30) -or ($l -lt ($wallL - 14))) -and $l -gt 75) }
    $i = 0
    while ($i -lt $row.Count) {
      if (-not $m[$i]) { $i++; continue }
      $j = $i; while ($j -lt $row.Count -and $m[$j]) { $j++ }
      $lc = if ($i -gt 0) { $row[$i - 1] } else { $row[$j] }
      $rc = if ($j -lt $row.Count) { $row[$j] } else { $lc }
      for ($k = $i; $k -lt $j; $k++) { $t = ($k - $i + 1) / ($j - $i + 1); $bm.SetPixel($x0 + $k, $y, [System.Drawing.Color]::FromArgb(255, [int]($lc.R + ($rc.R - $lc.R) * $t), [int]($lc.G + ($rc.G - $lc.G) * $t), [int]($lc.B + ($rc.B - $lc.B) * $t))) }
      $i = $j
    }
  }
}
Patch 420 449 339 354
Patch 545 578 346 366
$bm.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
"saved $dst"
