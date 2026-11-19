# Light copy of the screen background (screen-main.png, dark space + light rays) -> screen-main-lt.jpg
# No filter inversion: dark areas become a pale blue-grey base, bright structure (rays, haze, bokeh)
# becomes a soft sky-blue tint on top, so the composition stays the same in light theme.
# Run: powershell -NoProfile -ExecutionPolicy Bypass -File mk-light-bg.ps1
$src = @"
using System; using System.Drawing; using System.Drawing.Imaging; using System.Runtime.InteropServices;
public static class LBg {
  static int C(double v) { return v < 0 ? 0 : v > 255 ? 255 : (int)Math.Round(v); }
  public static void Run(string inp, string outp) {
    var b = new Bitmap(inp); int W = b.Width, H = b.Height;
    var px = new int[W * H];
    var d = b.LockBits(new Rectangle(0, 0, W, H), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
    Marshal.Copy(d.Scan0, px, 0, px.Length); b.UnlockBits(d); b.Dispose();
    for (int y = 0; y < H; y++) for (int x = 0; x < W; x++) {
      int i = y * W + x, c = px[i];
      double r = (c >> 16) & 255, g = (c >> 8) & 255, bl = c & 255;
      double Y = (0.2126 * r + 0.7152 * g + 0.0722 * bl) / 255.0;
      double t = (double)y / (H - 1);
      // base: top #eef5fc -> bottom #f8fbfe (2026-11-13: brighter, the old base looked dull grey)
      double r0 = 238 + 10 * t, g0 = 245 + 6 * t, b0 = 252 + 2 * t;
      // bright structure strength (dark floor ~0.03, haze ~0.35)
      double k = Math.Min(0.75, Math.Max(0, Y - 0.04) * 2.3);
      // tint toward clear sky blue #9fd0f6
      double tr = 159, tg = 208, tb = 246;
      px[i] = (255 << 24) | (C(r0 + (tr - r0) * k) << 16) | (C(g0 + (tg - g0) * k) << 8) | C(b0 + (tb - b0) * k);
    }
    var o = new Bitmap(W, H, PixelFormat.Format32bppArgb);
    var e = o.LockBits(new Rectangle(0, 0, W, H), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
    Marshal.Copy(px, 0, e.Scan0, px.Length); o.UnlockBits(e);
    var enc = Array.Find(ImageCodecInfo.GetImageEncoders(), z => z.MimeType == "image/jpeg");
    var ep = new EncoderParameters(1); ep.Param[0] = new EncoderParameter(System.Drawing.Imaging.Encoder.Quality, 90L);
    o.Save(outp, enc, ep);
  }
}
"@
Add-Type -TypeDefinition $src -ReferencedAssemblies System.Drawing
$dir = Split-Path -Parent $PSScriptRoot
[LBg]::Run((Join-Path $dir 'screen-main.png'), (Join-Path $dir 'screen-main-lt.jpg'))
Write-Output 'screen-main-lt.jpg'
