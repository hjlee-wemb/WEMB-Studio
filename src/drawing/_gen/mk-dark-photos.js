/* Playwright filename — 다크 테마 사진을 브라우저 캔버스에서 밤 장면으로 새로 그린다 → src/drawing/*-dk.jpg (serve.js 5544 /__save)
   그 다음 node mk-dark-assets.js → node conv.js.

   왜 — 첫 판은 색 행렬로 눌러 남색 필터를 씌운 꼴이었다: 건물 빛이 죽고, 회색 패널과 남색 사진이 따로 놀아 어색하다(사용자 2026-11-09).
   둘째 판(건물만 네온 · 도면선 뒤집기 · 윤곽선 강조)은 오려 붙인 것처럼 따로 놀았다 → "이미지가 이상해, 잘 어우러지게"(같은 날).
   ① 메인: 사진 전체를 같은 곡선 · 같은 푸른 기운으로 낮추고, 건물이 내는 빛을 넓게 흐려 책상 · 종이 표면 밝기에 곱한다(빛이 떨어지는 웅덩이).
   ② 로그인: 같은 방식으로 도형 · 흰 무늬 · 구름의 밝기 관계를 그대로 둔 채 낮춘다.
   ③ 아이콘 타일: 그림에 박힌 흰 판을 가장자리부터 지워(flood) 어두운 타일로 — 물체의 흰 면은 남긴다. */
async (page) => {
  const BASE = 'http://localhost:5544/src/drawing/';
  await page.goto(BASE + 'login.html?live=0&r=' + Date.now());
  return await page.evaluate(async (BASE) => {
    const load = (u) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = u + '?r=' + Date.now(); });
    const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const toLin = (v) => Math.pow(v, 2.2), toS = (v) => Math.pow(Math.max(0, Math.min(1, v)), 1 / 2.2);
    const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const canvas = (W, H) => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
    const save = async (cv, name, q) => { dither(cv); const blob = await new Promise((ok) => cv.toBlob(ok, 'image/jpeg', q)); const res = await fetch('/__save?f=' + name, { method: 'POST', body: blob }); return [cv.width, cv.height, blob.size, await res.text()]; };
    const blurred = (img, W, H, px) => { const c = canvas(W, H), x = c.getContext('2d'); x.filter = 'blur(' + px.toFixed(1) + 'px)'; x.drawImage(img, 0, 0, W, H); return x.getImageData(0, 0, W, H).data; };
    /* 어두운 그라데이션의 계단 · JPEG 네모를 막는 미세한 결 */
    const dither = (cv) => { const x = cv.getContext('2d'), d = x.getImageData(0, 0, cv.width, cv.height), a = d.data; for (let i = 0; i < a.length; i += 4) { const n = (Math.random() - 0.5) * 2.4; a[i] += n; a[i + 1] += n; a[i + 2] += n; } x.putImageData(d, 0, 0); };
    const out = {};

    /* ① 메인 — 사진 전체를 같은 빛으로 낮춘다. 오려 붙인 느낌의 원인이던 윤곽선 강조 · 도면선 뒤집기는 쓰지 않는다 */
    {
      const img = await load(BASE + 'background.png');
      const W = 2400, H = Math.round(W * img.naturalHeight / img.naturalWidth), U = W / 1920;
      const cv = canvas(W, H), cx = cv.getContext('2d'); cx.drawImage(img, 0, 0, W, H);
      const d = cx.getImageData(0, 0, W, H), a = d.data;
      const soft = blurred(img, W, H, 1.6 * U);
      /* 건물 자리 — 넓고 부드럽게(경계가 보이면 안 된다) */
      const POLY = [[1150, 135], [1420, 135], [1425, 178], [1548, 185], [1542, 372], [1700, 395], [1745, 430], [1738, 505], [1640, 532], [1530, 525], [1425, 552], [1420, 575], [1260, 612], [1180, 595], [878, 520], [868, 420], [1010, 388], [1150, 395]];
      const pm = canvas(W, H), pc = pm.getContext('2d');
      pc.filter = 'blur(' + (24 * U).toFixed(1) + 'px)'; pc.fillStyle = '#fff'; pc.beginPath();
      POLY.forEach(([x, y], k) => { const ix = (x + 448) / 2400 * W, iy = (y + 46) / 1355 * H; if (k) pc.lineTo(ix, iy); else pc.moveTo(ix, iy); });
      pc.closePath(); pc.fill();
      const pd = pc.getImageData(0, 0, W, H).data;
      /* 건물이 내는 빛 — 채도 · 밝기로 부드럽게. 감마 값으로 담아 흐려도 어두운 쪽 계단이 안 생기게 한다 */
      const em = canvas(W, H), ex = em.getContext('2d'), ed = ex.createImageData(W, H), e = ed.data;
      const V = new Float32Array(W * H);
      for (let n = 0; n < W * H; n++) {
        const i = n * 4, Yc = (n / W | 0) / H;
        const R = soft[i] / 255, G = soft[i + 1] / 255, B = soft[i + 2] / 255, mx = Math.max(R, G, B), mn = Math.min(R, G, B), L = lum(R, G, B), s = mx > 0 ? (mx - mn) / mx : 0;
        const core = sstep(0.84, 1, L) * sstep(0.34, 0.46, Yc);
        const v = Math.min(1, sstep(0.1, 0.46, s) * sstep(0.42, 0.92, L) * 0.82 + core * 0.62) * (pd[i + 3] / 255);
        V[n] = v;
        e[i] = 255 * toS(toLin(R) * 0.46 * v); e[i + 1] = 255 * toS(toLin(G) * 0.74 * v); e[i + 2] = 255 * toS(toLin(B) * v); e[i + 3] = 255;
      }
      ex.putImageData(ed, 0, 0);
      const spread = (px) => { const c = canvas(W, H), x = c.getContext('2d'); x.filter = 'blur(' + px.toFixed(0) + 'px)'; x.drawImage(em, 0, 0); return x.getImageData(0, 0, W, H).data; };
      const far = spread(120 * U), near = spread(30 * U);
      for (let n = 0; n < W * H; n++) {
        const i = n * 4, X = (n % W) / W, Yc = (n / W | 0) / H;
        const lr = toLin(a[i] / 255), lg = toLin(a[i + 1] / 255), lb = toLin(a[i + 2] / 255), Y = lum(lr, lg, lb);
        /* 어둠 — 밝기 곡선 + 아래로 깊게(패널이 앉는 자리) */
        const fall = (1 - 0.16 * sstep(0.56, 1, Yc)) * (1 - 0.12 * sstep(0.55, 1.1, Math.hypot((X - 0.6) / 0.7, (Yc - 0.4) / 0.7)));
        const amb = 0.27 * Math.pow(Y, 0.5) * fall;
        const chroma = 0.55;
        /* 건물 빛이 책상 · 종이에 떨어진다 — 표면 밝기에 곱해서 도면 선이 빛 속에서 그대로 보이게 */
        const kF = 0.34, kN = 0.3, alb = Math.pow(Y, 0.75);
        let R = (Y + (lr - Y) * chroma) * amb * 0.7, G = (Y + (lg - Y) * chroma) * amb * 0.87, B = (Y + (lb - Y) * chroma) * amb * 1.2;
        R += alb * (toLin(far[i] / 255) * kF + toLin(near[i] / 255) * kN);
        G += alb * (toLin(far[i + 1] / 255) * kF + toLin(near[i + 1] / 255) * kN);
        B += alb * (toLin(far[i + 2] / 255) * kF + toLin(near[i + 2] / 255) * kN);
        /* 건물 자체 */
        const v = V[n] * 0.9;
        R += lr * 0.46 * v; G += lg * 0.74 * v; B += lb * v;
        a[i] = 255 * toS(R); a[i + 1] = 255 * toS(G); a[i + 2] = 255 * toS(B);
      }
      cx.putImageData(d, 0, 0);
      cx.globalCompositeOperation = 'lighter'; cx.filter = 'blur(' + (9 * U).toFixed(0) + 'px)'; cx.globalAlpha = 0.14; cx.drawImage(em, 0, 0);
      cx.filter = 'none'; cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
      out.main = await save(cv, 'background-dk.jpg', 0.95);
    }

    /* ② 로그인 — 같은 방식: 도형 · 흰 무늬 · 구름의 밝기 관계를 그대로 둔 채 낮춘다 */
    {
      const img = await load(BASE + 'background-2.png');
      const W = img.naturalWidth, H = img.naturalHeight;
      const cv = canvas(W, H), cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, W, H); cx.drawImage(img, 0, 0);
      const d = cx.getImageData(0, 0, W, H), a = d.data;
      for (let i = 0; i < a.length; i += 4) {
        const n = i / 4, X = (n % W) / W, Yc = (n / W | 0) / H;
        const lr = toLin(a[i] / 255), lg = toLin(a[i + 1] / 255), lb = toLin(a[i + 2] / 255), Y = lum(lr, lg, lb);
        const vig = 1 - 0.24 * sstep(0.4, 1.05, Math.hypot((X - 0.5) / 0.72, (Yc - 0.5) / 0.72));
        const amb = 0.23 * Math.pow(Y, 1.25) * vig, chroma = 1;
        a[i] = 255 * toS((Y + (lr - Y) * chroma) * amb * 0.6);
        a[i + 1] = 255 * toS((Y + (lg - Y) * chroma) * amb * 0.82);
        a[i + 2] = 255 * toS((Y + (lb - Y) * chroma) * amb * 1.32);
      }
      cx.putImageData(d, 0, 0);
      out.login = await save(cv, 'background-2-dk.jpg', 0.95);
    }

    /* ③ 아이콘 타일 */
    for (const name of ['icon-image', 'icon-image-1']) {
      const img = await load(BASE + name + '.png');
      const W = img.naturalWidth, H = img.naturalHeight;
      const cv = canvas(W, H), cx = cv.getContext('2d'); cx.drawImage(img, 0, 0);
      const d = cx.getImageData(0, 0, W, H), a = d.data;
      const pale = new Uint8Array(W * H);
      for (let n = 0; n < W * H; n++) { const i = n * 4, mx = Math.max(a[i], a[i + 1], a[i + 2]) / 255, mn = Math.min(a[i], a[i + 1], a[i + 2]) / 255; pale[n] = lum(a[i] / 255, a[i + 1] / 255, a[i + 2] / 255) > 0.8 && (mx - mn) / mx < 0.13 ? 1 : 0; }
      const bg = new Uint8Array(W * H), st = [];
      const push = (n) => { if (pale[n] && !bg[n]) { bg[n] = 1; st.push(n); } };
      for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
      for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
      while (st.length) { const n = st.pop(), x = n % W; if (x > 0) push(n - 1); if (x < W - 1) push(n + 1); if (n >= W) push(n - W); if (n < W * (H - 1)) push(n + W); }
      /* 경계를 부드럽게 — 판 마스크를 살짝 흐린다 */
      const mk = canvas(W, H), mx = mk.getContext('2d'), md = mx.createImageData(W, H);
      for (let n = 0; n < W * H; n++) { md.data[n * 4 + 3] = bg[n] ? 255 : 0; }
      mx.putImageData(md, 0, 0);
      const sf = canvas(W, H), sx = sf.getContext('2d'); sx.filter = 'blur(' + (W / 260).toFixed(1) + 'px)'; sx.drawImage(mk, 0, 0);
      const sa = sx.getImageData(0, 0, W, H).data;
      for (let n = 0; n < W * H; n++) {
        const i = n * 4, Y = (n / W | 0) / H, X = (n % W) / W, k = sa[i + 3] / 255;
        const glow = 0.05 * Math.max(0, 1 - Math.hypot((X - 0.5) / 0.5, (Y - 0.5) / 0.5));
        const R = 0.135 - 0.04 * Y + glow * 0.4, G = 0.148 - 0.04 * Y + glow * 0.7, B = 0.178 - 0.045 * Y + glow * 1.5;
        a[i] = Math.round(a[i] * (1 - k) * 0.94 + 255 * R * k); a[i + 1] = Math.round(a[i + 1] * (1 - k) * 0.96 + 255 * G * k); a[i + 2] = Math.round(a[i + 2] * (1 - k) + 255 * B * k);
      }
      cx.putImageData(d, 0, 0);
      out[name] = await save(cv, name + '-dk.jpg', 0.9);
    }
    return out;
  }, BASE);
}
