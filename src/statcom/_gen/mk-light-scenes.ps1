# Light copies of the baked 3D renders: src/statcom/<name>.png -> <name>-lt.jpg
# The renders carry their dark backdrop in the pixels, so a light theme needs its own copy of the picture.
# Geometry is untouched. Three recipes:
#   Floor - indoor renders / minimap: dark backdrop and floor move to the light side, the model keeps its pixels.
#   Day   - outdoor render: screen-lift (never inverts, so clouds stay white) with a little saturation.
#   Bars  - photo with black side bars: only the bars change.
# Box  - a dark tag baked into a render (floor tag, toast): dark -> c0, white -> c1, so its text stays readable.
# Run: powershell -ExecutionPolicy Bypass -File mk-light-scenes.ps1
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
public static class LightScene {
  static double Smooth(double a, double b, double x) { double t = Math.Max(0, Math.Min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  static byte B(double v) { return (byte)Math.Max(0, Math.Min(255, 255 * v)); }
  const double TopL = 1.03, Slope = 0.75, FloorCap = 0.26, Lo = 0.28, Hi = 0.46, NeutralHi = 0.86;

  static void Floor(byte[] px, int i) {
    double b = px[i] / 255.0, g = px[i + 1] / 255.0, r = px[i + 2] / 255.0;
    double L = 0.299 * r + 0.587 * g + 0.114 * b;
    double mx = Math.Max(r, Math.Max(g, b)), mn = Math.Min(r, Math.Min(g, b));
    double s = mx > 0 ? (mx - mn) / mx : 0;
    /* grey-blue glossy spots on the floor belong to the floor: lift them too, otherwise they turn into dark rings.
       warm greys are equipment shading and stay. */
    double cool = Smooth(-0.015, 0.02, b - r);
    double hiE = Hi + (NeutralHi - Hi) * cool * (1 - Smooth(0.10, 0.30, s));
    double w = 1 - Smooth(Lo, hiE, L);
    /* green racks: their dark parts are model, not floor */
    if (g > r * 1.25 && g > b * 1.25 && s > 0.35) w *= 0.15;
    /* backdrop lightest, floor a step below, grid lines a step below that */
    double t = TopL - Math.Min(L, FloorCap) * Slope;
    px[i + 2] = B(r + (t * 0.965 - r) * w);
    px[i + 1] = B(g + (t * 0.985 - g) * w);
    px[i] = B(b + (t - b) * w);
  }
  static void Day(byte[] px, int i, int y, int h) {
    double b = px[i] / 255.0, g = px[i + 1] / 255.0, r = px[i + 2] / 255.0;
    double L0 = 0.299 * r + 0.587 * g + 0.114 * b;
    /* above the horizon a clear sky, below it light pavement. Screen never inverts, so clouds stay white; saturated things on the ground keep their pixels. */
    double ground = Smooth(0.40, 0.45, y / (double)h);
    double kr = 0.52 + (0.74 - 0.52) * ground, kg = 0.68 + (0.77 - 0.68) * ground, kb = 0.86 + (0.80 - 0.86) * ground;
    double mx = Math.Max(r, Math.Max(g, b)), mn = Math.Min(r, Math.Min(g, b)), s0 = mx > 0 ? (mx - mn) / mx : 0;
    double keep = Smooth(0.20, 0.42, s0) * Smooth(0.20, 0.34, L0); /* saturated and not black: building, road, grass */
    double w = 1 - ground * keep;
    double sr = 1 - (1 - r) * (1 - kr), sg = 1 - (1 - g) * (1 - kg), sb = 1 - (1 - b) * (1 - kb);
    r += (sr - r) * w; g += (sg - g) * w; b += (sb - b) * w;
    double L = 0.299 * r + 0.587 * g + 0.114 * b, sat = 1.12;
    px[i + 2] = B(L + (r - L) * sat);
    px[i + 1] = B(L + (g - L) * sat);
    px[i] = B(L + (b - L) * sat);
  }
  public static void Run(string src, string dst, string mode, int[] boxes, double[] colors, int barL, int barR) {
    using (var input = new Bitmap(src))
    using (var bmp = new Bitmap(input.Width, input.Height, PixelFormat.Format24bppRgb)) {
      using (var gr = Graphics.FromImage(bmp)) gr.DrawImage(input, 0, 0, input.Width, input.Height);
      var data = bmp.LockBits(new Rectangle(0, 0, bmp.Width, bmp.Height), ImageLockMode.ReadWrite, PixelFormat.Format24bppRgb);
      int n = data.Stride * bmp.Height;
      var px = new byte[n];
      Marshal.Copy(data.Scan0, px, 0, n);
      int nb = boxes == null ? 0 : boxes.Length / 4;
      var bMin = new double[nb]; var bMax = new double[nb];
      for (int k = 0; k < nb; k++) {
        bMin[k] = 1; bMax[k] = 0.01;
        for (int y = boxes[k * 4 + 1]; y <= boxes[k * 4 + 3]; y++) for (int x = boxes[k * 4]; x <= boxes[k * 4 + 2]; x++) {
          int i = y * data.Stride + x * 3;
          double L = (0.299 * px[i + 2] + 0.587 * px[i + 1] + 0.114 * px[i]) / 255.0;
          bMin[k] = Math.Min(bMin[k], L); bMax[k] = Math.Max(bMax[k], L);
        }
      }
      for (int y = 0; y < bmp.Height; y++) {
        int i = y * data.Stride;
        for (int x = 0; x < bmp.Width; x++, i += 3) {
          bool done = false;
          for (int k = 0; boxes != null && k + 3 < boxes.Length; k += 4) {
            if (x < boxes[k] || x > boxes[k + 2] || y < boxes[k + 1] || y > boxes[k + 3]) continue;
            int c = k / 4 * 6;
            double L = ((0.299 * px[i + 2] + 0.587 * px[i + 1] + 0.114 * px[i]) / 255.0 - bMin[k / 4]) / (bMax[k / 4] - bMin[k / 4]);
            px[i + 2] = B(colors[c] + (colors[c + 3] - colors[c]) * L);
            px[i + 1] = B(colors[c + 1] + (colors[c + 4] - colors[c + 1]) * L);
            px[i] = B(colors[c + 2] + (colors[c + 5] - colors[c + 2]) * L);
            done = true; break;
          }
          if (done) continue;
          if (mode == "Day") Day(px, i, y, bmp.Height);
          else if (mode == "Bars") { if (x < barL || x > barR) { px[i + 2] = 238; px[i + 1] = 243; px[i] = 247; } }
          else Floor(px, i);
        }
      }
      Marshal.Copy(px, 0, data.Scan0, n);
      bmp.UnlockBits(data);
      ImageCodecInfo jpg = null;
      foreach (var c in ImageCodecInfo.GetImageEncoders()) if (c.MimeType == "image/jpeg") jpg = c;
      var ep = new EncoderParameters(1);
      ep.Param[0] = new EncoderParameter(Encoder.Quality, 88L);
      bmp.Save(dst, jpg, ep);
    }
  }
}
'@ -ErrorAction Stop
$dir = Split-Path $PSScriptRoot -Parent
function Go($n, $mode, $boxes, $colors, $barL = 0, $barR = 0) {
  [LightScene]::Run((Join-Path $dir "$n.png"), (Join-Path $dir "$n-lt.jpg"), $mode, [int[]]$boxes, [double[]]$colors, $barL, $barR)
  Write-Output "$n -> $((Get-Item (Join-Path $dir "$n-lt.jpg")).Length) bytes"
}
# floor tags in the exploded view: RF is active (tint + brand-blue text), the others are plain chips with grey-blue text
Go 'scene-image-2' 'Floor' @(1621, 451, 1686, 486, 1592, 522, 1658, 558, 1559, 605, 1625, 641, 1535, 665, 1601, 701, 1512, 720, 1579, 756) @(0.89, 0.94, 0.98, 0.03, 0.33, 0.52, 0.97, 0.98, 0.99, 0.31, 0.38, 0.47, 0.97, 0.98, 0.99, 0.31, 0.38, 0.47, 0.97, 0.98, 0.99, 0.31, 0.38, 0.47, 0.97, 0.98, 0.99, 0.31, 0.38, 0.47)
# browser full-screen toast baked into the render: light chip, dark text
Go 'scene-image-3' 'Floor' @(748, 45, 1170, 94) @(0.90, 0.93, 0.95, 0.20, 0.28, 0.36)
Go 'scene-image-4' 'Floor' $null $null
Go 'scene-image-5' 'Floor' $null $null
Go 'scene-image-6' 'Floor' $null $null
Go 'scene-image-7' 'Floor' $null $null
# room label on the minimap stays a dark pill with white text
Go 'map-image' 'Floor' @(1622, 271, 1704, 287) @(0.08, 0.13, 0.22, 1, 1, 1)
Go 'scene-image' 'Day' $null $null
Go 'scene-image-8' 'Bars' $null $null 656 1263
