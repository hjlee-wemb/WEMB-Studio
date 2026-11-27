# Remove the small vendor mark printed on the red sensor icon in the forklift render (row-wise inpaint, no hand drawing).
param([string]$src, [string]$dst)
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile($src)
$bm = New-Object System.Drawing.Bitmap $img
$img.Dispose()
function L($c) { return 0.299 * $c.R + 0.587 * $c.G + 0.114 * $c.B }
function Patch($x0, $x1, $y0, $y1) {
  for ($y = $y0; $y -le $y1; $y++) {
    $row = @(); for ($x = $x0; $x -le $x1; $x++) { $row += $bm.GetPixel($x, $y) }
    $ls = @($row | ForEach-Object { L $_ } | Sort-Object)
    $base = $ls[[int][Math]::Floor($ls.Count * 0.3)]
    $m = @(); for ($i = 0; $i -lt $row.Count; $i++) { $m += ((L $row[$i]) -gt 52) }
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
Patch 933 953 229 236
$bm.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
"saved"
