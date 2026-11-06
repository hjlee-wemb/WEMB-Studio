/* Playwright filename — 로그인 바탕 사진의 다크(밤) 사본을 브라우저 캔버스에서 만든다 → _gen/login-*-dk.jpg (serve.js /__save)
   그 다음 `node mk-dark-login-move.js` 로 src/wnms/ 에 옮긴다.

   왜 — 로그인 바탕은 사진(푸른 방 · 빛줄기 · 빛나는 큐브)이다. 밝기를 뒤집으면 큐브가 검게 죽어 "배경이 안 보인다",
   톤만 누른 첫 판은 큐브 윗면이 거친 은빛 · 방이 평평했다 → "더 심미성 있게, 잘 보이게"(사용자 2026-11-06).
   밤 사진 연출:
   ① 방(벽 · 바닥): 그래파이트 톤 곡선 + 아주 옅은 차가운 기운. 큐브 쪽은 조금 밝게, 가장자리는 비네트로 깊게 → 공간감
   ② 빛줄기: 부드러운 은빛으로 남긴다(살짝 차갑게)
   ③ 큐브 · 원자: 원래 파랑을 살리고, 흰 면 · 빛 선은 결(필름 노이즈)을 걷어 매끈하게(살짝 흐린 사본에서 가져온다)
   ④ 블룸: 빛나는 부분만 크게 흐려 'lighter' 로 얹어 어둠 속에서 은은히 번지게 */
async (page) => {
  const SRC = 'http://localhost:5544/src/wnms/';
  await page.goto(SRC + 'login.html?live=0&r=' + Date.now());
  return await page.evaluate(async (SRC) => {
    const load = (u) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = u + '?r=' + Date.now(); });
    const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const out = {};
    for (const name of ['background-base', 'background-overlay']) {
      const img = await load(SRC + name + '.png');
      const W = img.naturalWidth, H = img.naturalHeight, U = W / 1920;          /* U = 화면 1px 의 원본 px */
      const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
      const cv = mk(), cx = cv.getContext('2d'); cx.drawImage(img, 0, 0);
      const sm = mk(), sx = sm.getContext('2d'); sx.filter = 'blur(' + (1.6 * U).toFixed(1) + 'px)'; sx.drawImage(img, 0, 0);
      const d = cx.getImageData(0, 0, W, H), a = d.data, sd = sx.getImageData(0, 0, W, H).data;
      const gl = mk(), gx = gl.getContext('2d'), gd = gx.createImageData(W, H), g = gd.data;
      for (let i = 0; i < a.length; i += 4) {
        const px = (i / 4) % W, py = ((i / 4) / W) | 0, X = px / W, Y = py / H;
        /* 큐브 묶음 자리(사진 오른쪽 아래) */
        const dxm = (X - 0.64) / 0.2, dym = (Y - 0.70) / 0.26, rr = Math.sqrt(dxm * dxm + dym * dym), m = Math.max(0, Math.min(1, 1.6 - rr * 1.6));
        const r = a[i] / 255, gg = a[i + 1] / 255, b = a[i + 2] / 255;
        const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b);
        const L = 0.2126 * r + 0.7152 * gg + 0.0722 * b, s = mx > 0 ? (mx - mn) / mx : 0;
        const body = sstep(0.4, 0.7, s) * sstep(0.22, 0.6, L) * (0.08 + 0.92 * sstep(0, 0.35, m));   /* 큐브 몸(채도 높은 파랑) — 자리 밖의 푸른 벽(오른쪽 위)은 빼야 얼룩이 안 진다 */
        const hi = sstep(0.86, 0.97, L) * m;                                    /* 큐브 흰 면 · 빛 선 */
        const glow = Math.min(1, body + hi);
        /* ① 방 — 톤 곡선 + 공간감(큐브 쪽 살짝 밝게 · 가장자리 비네트) */
        const lift = 0.05 * Math.max(0, 1 - Math.hypot((X - 0.66) / 0.55, (Y - 0.62) / 0.6));
        const vig = 1 - 0.32 * sstep(0.45, 1.05, Math.hypot((X - 0.5) / 0.75, (Y - 0.5) / 0.75));
        const beam = sstep(0.62, 0.92, L) * (1 - m * 0.6);                       /* 빛줄기(밝고 채도 낮은 띠) */
        const Lw = (0.05 + 0.34 * Math.pow(L, 2.2) + lift) * vig;
        const cool = 0.012 + 0.02 * beam;
        const wr = Lw - 0.004 + (r - L) * 0.05, wg = Lw + 0.002 + (gg - L) * 0.05, wb = Lw + cool + (b - L) * 0.05;
        /* ③ 큐브 — 매끈한 사본에서, 흰 면은 차가운 흰빛으로 */
        const R = sd[i] / 255, G = sd[i + 1] / 255, B = sd[i + 2] / 255;
        const kb = 0.98;
        const cr = R * kb * (1 - hi * 0.08), cg = G * kb, cb = Math.min(1, B * kb + hi * 0.04);
        a[i] = Math.round(255 * Math.min(1, wr * (1 - glow) + cr * glow));
        a[i + 1] = Math.round(255 * Math.min(1, wg * (1 - glow) + cg * glow));
        a[i + 2] = Math.round(255 * Math.min(1, wb * (1 - glow) + cb * glow));
        /* ④ 블룸 재료 — 빛나는 부분의 색(파랑 쪽으로) */
        const gw = glow * (0.55 + 0.45 * L);
        g[i] = Math.round(255 * R * gw * 0.55); g[i + 1] = Math.round(255 * G * gw * 0.8); g[i + 2] = Math.round(255 * Math.min(1, B * gw * 1.05)); g[i + 3] = 255;
      }
      cx.putImageData(d, 0, 0);
      gx.putImageData(gd, 0, 0);
      /* 블룸 두 겹 — 넓고 옅게 + 좁고 조금 진하게 */
      cx.globalCompositeOperation = 'lighter';
      cx.filter = 'blur(' + (36 * U).toFixed(0) + 'px)'; cx.globalAlpha = 0.55; cx.drawImage(gl, 0, 0);
      cx.filter = 'blur(' + (10 * U).toFixed(0) + 'px)'; cx.globalAlpha = 0.35; cx.drawImage(gl, 0, 0);
      cx.filter = 'none'; cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
      const blob = await new Promise((ok) => cv.toBlob(ok, 'image/jpeg', 0.9));
      const res = await fetch('/__save?f=login-' + name + '-dk.jpg', { method: 'POST', body: blob });
      out[name] = [W, H, blob.size, await res.text()];
    }
    return out;
  }, SRC);
}
