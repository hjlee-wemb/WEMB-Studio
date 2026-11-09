/* Playwright filename — 흰 판이 그림에 박힌 일러스트(공지사항 · Help Desk)의 투명 사본을 만든다 → src/drawing/_gen/*-tp.png (serve.js 5544 /__save)
   그 다음 src/drawing/ 로 옮긴다. 에셋 썸네일 바탕은 무조건 투명이어야 해서(사용자 지시 2026-11-09) 라이브러리만 이 사본을 쓴다 — 화면은 원본 그대로다.
   가장자리부터 옅은 무채색을 flood 로 지우므로 물체 안의 흰 면은 남는다. 물체 밖의 옅은 그림자는 판과 함께 사라진다. */
async (page) => {
  const BASE = 'http://localhost:5544/src/drawing/';
  await page.goto(BASE + 'login.html?live=0&r=' + Date.now());
  return await page.evaluate(async (BASE) => {
    const load = (u) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = u + '?r=' + Date.now(); });
    const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const out = {};
    for (const name of ['icon-image', 'icon-image-1']) {
      const img = await load(BASE + name + '.png');
      const W = img.naturalWidth, H = img.naturalHeight;
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, W, H), a = d.data;
      const pale = new Uint8Array(W * H);
      for (let n = 0; n < W * H; n++) { const i = n * 4, mx = Math.max(a[i], a[i + 1], a[i + 2]) / 255, mn = Math.min(a[i], a[i + 1], a[i + 2]) / 255; pale[n] = lum(a[i] / 255, a[i + 1] / 255, a[i + 2] / 255) > 0.74 && (mx - mn) / mx < 0.14 ? 1 : 0; }
      const bg = new Uint8Array(W * H), st = [];
      const push = (n) => { if (pale[n] && !bg[n]) { bg[n] = 1; st.push(n); } };
      for (let i = 0; i < W; i++) { push(i); push((H - 1) * W + i); }
      for (let i = 0; i < H; i++) { push(i * W); push(i * W + W - 1); }
      while (st.length) { const n = st.pop(), px = n % W; if (px > 0) push(n - 1); if (px < W - 1) push(n + 1); if (n >= W) push(n - W); if (n < W * (H - 1)) push(n + W); }
      const mk = document.createElement('canvas'); mk.width = W; mk.height = H;
      const mx2 = mk.getContext('2d'), md = mx2.createImageData(W, H);
      for (let n = 0; n < W * H; n++) md.data[n * 4 + 3] = bg[n] ? 255 : 0;
      mx2.putImageData(md, 0, 0);
      const sf = document.createElement('canvas'); sf.width = W; sf.height = H;
      const sx = sf.getContext('2d'); sx.filter = 'blur(' + (W / 300).toFixed(1) + 'px)'; sx.drawImage(mk, 0, 0);
      const sa = sx.getImageData(0, 0, W, H).data;
      let corner = 0;
      for (let n = 0; n < W * H; n++) { a[n * 4 + 3] = Math.round(255 * (1 - sa[n * 4 + 3] / 255) * (bg[n] ? 0 : 1)); }
      corner = a[3] + a[(W - 1) * 4 + 3] + a[(H - 1) * W * 4 + 3];
      x.putImageData(d, 0, 0);
      /* 그림 둘레로 잘라 낸다 — 판이 넓어 썸네일에서 물체가 콩알만 해진다 */
      let x0 = W, y0 = H, x1 = 0, y1 = 0;
      for (let n = 0; n < W * H; n++) if (a[n * 4 + 3] > 24) { const px = n % W, py = n / W | 0; if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py; }
      const pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.04), bx = Math.max(0, x0 - pad), by = Math.max(0, y0 - pad), bw = Math.min(W - bx, x1 - x0 + 1 + pad * 2), bh = Math.min(H - by, y1 - y0 + 1 + pad * 2);
      const cut = document.createElement('canvas'); cut.width = bw; cut.height = bh; cut.getContext('2d').drawImage(c, bx, by, bw, bh, 0, 0, bw, bh);
      const blob = await new Promise((ok) => cut.toBlob(ok, 'image/png'));
      const res = await fetch('/__save?f=' + name + '-tp.png', { method: 'POST', body: blob });
      out[name] = [W, H, blob.size, corner, await res.text()];
    }
    return out;
  }, BASE);
}
