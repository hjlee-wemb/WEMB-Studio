// 라이트 그림 사본 — 필터로 뒤집지 않고 역할별로 다시 칠한다(메모리 dark-render-light-theme).
//  · screen-main.jpg(화면 바탕, 어두운 육각 무늬) → screen-main-lt.jpg : 밝은 회청 바탕 위에 원본의 밝은 결(육각 선 · 빛줄기)이 옅은 남색 결로 남는다.
//  · floor-plan.png 는 mk-light-floor.js(밝기만 뒤집기 + 국소 톤 매핑)
// 컴파일 · 실행: mk-light-images.ps1
using System; using System.Drawing; using System.Drawing.Imaging; using System.Runtime.InteropServices;
class L {
  static int[] Read(Bitmap b) { var px = new int[b.Width * b.Height]; var d = b.LockBits(new Rectangle(0, 0, b.Width, b.Height), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb); Marshal.Copy(d.Scan0, px, 0, px.Length); b.UnlockBits(d); return px; }
  static Bitmap Write(int[] px, int w, int h) { var o = new Bitmap(w, h, PixelFormat.Format32bppArgb); var d = o.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb); Marshal.Copy(px, 0, d.Scan0, px.Length); o.UnlockBits(d); return o; }
  static double[] Blur(double[] s, int W, int H, int R) { var t = new double[s.Length]; var d = new double[s.Length]; double w = 2 * R + 1;
    for (int y = 0; y < H; y++) { double a = 0; int o = y * W; for (int x = -R; x <= R; x++) a += s[o + Math.Min(W - 1, Math.Max(0, x))]; for (int x = 0; x < W; x++) { t[o + x] = a / w; a += s[o + Math.Min(W - 1, x + R + 1)] - s[o + Math.Max(0, x - R)]; } }
    for (int x = 0; x < W; x++) { double a = 0; for (int y = -R; y <= R; y++) a += t[Math.Min(H - 1, Math.Max(0, y)) * W + x]; for (int y = 0; y < H; y++) { d[y * W + x] = a / w; a += t[Math.Min(H - 1, y + R + 1) * W + x] - t[Math.Max(0, y - R) * W + x]; } }
    return d; }
  static int C(double v) { return v < 0 ? 0 : v > 255 ? 255 : (int)Math.Round(v); }
  static void Main(string[] a) {
    string dir = a[0];
    { // 바탕
      var b = new Bitmap(System.IO.Path.Combine(dir, "screen-main.jpg")); int W = b.Width, H = b.Height; var px = Read(b); b.Dispose();
      // 2026-11-11 다시(사용자: 어색하다): 원본 밝기를 그대로 옮기면 위 띠의 경계(y≈218) 가 가로줄로, 렌즈 빛 · 빛줄기 점이 검은 얼룩으로 남았다.
      //  ① 띠 경계: 경계 위아래 밝기 차를 열마다 재서(가로로 흐려) 경계 위쪽에서 뺀다 → 육각 무늬는 남고 가로 단차만 사라진다
      //  ② 결의 세기 상한 0.42 — 가장 밝던 점(렌즈 빛 · 빛줄기)이 짙은 점이 되지 않게
      //  ③ 바탕은 위 #e8eef5 → 아래 #f3f6fa 로 옅어진다(원본의 위가 짙은 깊이감)
      int N = W * H; var Y = new double[N];
      for (int i = 0; i < N; i++) { int c = px[i]; Y[i] = (0.2126 * ((c >> 16) & 255) + 0.7152 * ((c >> 8) & 255) + 0.0722 * (c & 255)) / 255.0; }
      int EDGE = 218; var step = new double[W];
      for (int x = 0; x < W; x++) step[x] = (Y[(EDGE - 3) * W + x] + Y[(EDGE - 2) * W + x]) / 2 - (Y[(EDGE + 1) * W + x] + Y[(EDGE + 2) * W + x]) / 2;
      var sm = new double[W]; for (int x = 0; x < W; x++) { double acc = 0; int n = 0; for (int k = -24; k <= 24; k++) { int xx = x + k; if (xx < 0 || xx >= W) continue; acc += step[xx]; n++; } sm[x] = Math.Max(0, acc / n); }
      for (int y = 0; y < EDGE; y++) for (int x = 0; x < W; x++) Y[y * W + x] = Math.Max(0, Y[y * W + x] - sm[x]);
      for (int y = 0; y < H; y++) for (int x = 0; x < W; x++) {
        int i = y * W + x; double t = (double)y / (H - 1);
        double k = Math.Min(0.42, Math.Max(0, Y[i] - 0.012) * 2.2);
        double r0 = 232 + 11 * t, g0 = 238 + 8 * t, b0 = 245 + 5 * t;
        px[i] = (255 << 24) | (C(r0 - 92 * k) << 16) | (C(g0 - 76 * k) << 8) | C(b0 - 50 * k);
      }
      var o = Write(px, W, H);
      var enc = Array.Find(ImageCodecInfo.GetImageEncoders(), e => e.MimeType == "image/jpeg");
      var ep = new EncoderParameters(1); ep.Param[0] = new EncoderParameter(System.Drawing.Imaging.Encoder.Quality, 90L);
      o.Save(System.IO.Path.Combine(dir, "screen-main-lt.jpg"), enc, ep);
    }
    // 평면도(floor-plan-lt.png)는 node mk-light-floor.js 가 만든다(2026-11-11 — 픽셀 종류별 다시 칠하기가 윤곽을 지우고 선을 글자 위로 그었다)
    Console.WriteLine("screen-main-lt.jpg");
  }
}
