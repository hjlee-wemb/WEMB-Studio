param([string]$path,[string]$out,[int]$x,[int]$y,[int]$w,[int]$h,[int]$s)
Add-Type -AssemblyName System.Drawing
$bm=New-Object System.Drawing.Bitmap $path
$dst=New-Object System.Drawing.Bitmap ([int]$w*$s),([int]$h*$s)
$g=[System.Drawing.Graphics]::FromImage($dst); $g.InterpolationMode='NearestNeighbor'
$g.DrawImage($bm,(New-Object System.Drawing.Rectangle 0,0,($w*$s),($h*$s)),(New-Object System.Drawing.Rectangle $x,$y,$w,$h),[System.Drawing.GraphicsUnit]::Pixel)
$dst.Save($out)
# row profile of white
$rows=@(); for($yy=$y;$yy -lt $y+$h;$yy++){ $c=0; for($xx=$x;$xx -lt $x+$w;$xx++){ $p=$bm.GetPixel($xx,$yy); if($p.R -gt 225 -and $p.G -gt 225 -and $p.B -gt 225){$c++} }; $rows+="${yy}:${c}" }
$rows -join ' '
