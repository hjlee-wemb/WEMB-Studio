param([string]$path,[int]$x0,[int]$y0,[int]$w,[int]$h)
Add-Type -AssemblyName System.Drawing
$bm = New-Object System.Drawing.Bitmap $path
$chars = ' .:-=+*#%@'
for ($y = $y0; $y -lt $y0 + $h; $y++) {
  $line = ''
  for ($x = $x0; $x -lt $x0 + $w; $x++) {
    $c = $bm.GetPixel($x, $y)
    $l = (0.299 * $c.R + 0.587 * $c.G + 0.114 * $c.B) / 256
    $line += $chars[[int][Math]::Floor($l * 10)]
  }
  "{0,4} {1}" -f $y, $line
}
