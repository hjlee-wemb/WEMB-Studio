# 계통도 그림(흰 종이 JPG)의 다크 사본 — src/ccpp/diagram-image-dk.jpg
# 원칙: 자동 반전 금지 → 무채색(바탕 흰색 · 검은 글씨 · 회색 선)만 명도를 뒤집고, 색 있는 선 · 면은 색상각 · 채도를 지키고 어두운 바탕에서 보이게 명도만 올린다.
# 실행: powershell -ExecutionPolicy Bypass -File mk-dark-diagram.ps1
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System; using System.Drawing; using System.Drawing.Imaging; using System.Runtime.InteropServices;
public static class DiagDark {
  static void Hsl(double r, double g, double b, out double h, out double s, out double l) {
    double mx = Math.Max(r, Math.Max(g, b)), mn = Math.Min(r, Math.Min(g, b)), d = mx - mn; l = (mx + mn) / 2; h = 0; s = 0;
    if (d > 1e-6) { s = d / (1 - Math.Abs(2 * l - 1)); if (mx == r) h = ((g - b) / d + (g < b ? 6 : 0)); else if (mx == g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; }
  }
  static void Rgb(double h, double s, double l, out double r, out double g, out double b) {
    double c = (1 - Math.Abs(2 * l - 1)) * s, hp = (h % 360 + 360) % 360 / 60, x = c * (1 - Math.Abs(hp % 2 - 1)), m = l - c / 2;
    double[] t = hp < 1 ? new[] { c, x, 0.0 } : hp < 2 ? new[] { x, c, 0.0 } : hp < 3 ? new[] { 0.0, c, x } : hp < 4 ? new[] { 0.0, x, c } : hp < 5 ? new[] { x, 0.0, c } : new[] { c, 0.0, x };
    r = t[0] + m; g = t[1] + m; b = t[2] + m;
  }
  public static void Run(string src, string dst) {
    using (var bmp = new Bitmap(src)) {
      var rect = new Rectangle(0, 0, bmp.Width, bmp.Height);
      var bd = bmp.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format24bppRgb);
      int n = bd.Stride * bd.Height; var px = new byte[n]; Marshal.Copy(bd.Scan0, px, 0, n);
      for (int y = 0; y < bd.Height; y++) for (int x = 0; x < bd.Width; x++) {
        int i = y * bd.Stride + x * 3; double B = px[i] / 255.0, G = px[i + 1] / 255.0, R = px[i + 2] / 255.0, h, s, l, r2, g2, b2;
        Hsl(R, G, B, out h, out s, out l);
        if (s < 0.18 || l > 0.94) {
          /* 무채색 — 흰 바탕 → #10141b, 검은 글씨 → 밝은 회백 */
          double L = 0.07 + (1 - l) * 0.80; Rgb(215, 0.10, L, out r2, out g2, out b2);
        } else {
          /* 색 있는 선 · 면 — 색상각 · 채도 유지, 명도는 어두운 바탕에서 보이게(0.42~0.72) */
          double L = l > 0.8 ? 0.16 + (1 - l) * 1.2 : Math.Max(0.46, Math.Min(0.72, l + 0.12));
          Rgb(h, Math.Min(1, s * 0.92), L, out r2, out g2, out b2);
        }
        px[i] = (byte)Math.Round(Math.Max(0, Math.Min(1, b2)) * 255); px[i + 1] = (byte)Math.Round(Math.Max(0, Math.Min(1, g2)) * 255); px[i + 2] = (byte)Math.Round(Math.Max(0, Math.Min(1, r2)) * 255);
      }
      Marshal.Copy(px, 0, bd.Scan0, n); bmp.UnlockBits(bd);
      var enc = Array.Find(ImageCodecInfo.GetImageEncoders(), e => e.MimeType == "image/jpeg");
      var ps = new EncoderParameters(1); ps.Param[0] = new EncoderParameter(System.Drawing.Imaging.Encoder.Quality, 90L);
      bmp.Save(dst, enc, ps);
    }
  }
}
"@
$art = Join-Path $PSScriptRoot '..'
[DiagDark]::Run((Join-Path $art 'diagram-image.png'), (Join-Path $art 'diagram-image-dk.jpg'))
Get-Item (Join-Path $art 'diagram-image-dk.jpg') | Select-Object Name, Length
