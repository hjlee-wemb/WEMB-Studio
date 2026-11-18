/* 다크 테마용 밤 그림 — 브라우저 캔버스로 원본에서 만든다(손으로 그리지 않는다) → _gen/*-dk.(png|jpg) (serve.js /__save) → 그 다음 node mk-night-move.js
   사용자 2026-11-17: "다크모드로 했을 때 배경 이미지가 너무 밝다, 어울리는 이미지로, 건물은 많이 건들지 말고 어울리게만".
   ① screen-main-2(낮 하늘 그라디언트 · 아래는 투명) → 밤하늘: 위는 짙은 남색, 지평선은 옅은 청색 빛. 원본 구름은 차가운 은빛으로 아주 옅게 남긴다. 투명도는 원본 그대로.
   ② screen-main-1(흰 바탕 위 시안 파동 격자 · 점) → 바탕은 투명, 시안 선 · 점만 빛으로(채도 = 빛의 세기).
   ③ background(로그인 사진) → 하늘만 밤하늘로 갈아 끼우고(파란 하늘 · 흰 구름 · 위쪽만), 발전소 · 나무는 톤만 살짝 눌러 차갑게. 건물 형태 · 색은 그대로.
   실행: node pw.js mk-night.js */
async (page) => {
  await page.goto('http://localhost:5570/src/plantdp/main.html?live=0&r=' + Date.now());
  return await page.evaluate(async () => {
    const SRC = './';
    const load = (u) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = u + '?r=' + Date.now(); });
    const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const mix = (a, b, t) => a + (b - a) * t;
    const canvasOf = (img) => { const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const x = c.getContext('2d'); x.drawImage(img, 0, 0); return [c, x]; };
    const save = async (c, name, type, q) => {
      const blob = await new Promise((ok) => c.toBlob(ok, type, q));
      const r = await fetch('/__save?f=' + name, { method: 'POST', body: blob });
      return name + ' ' + r.status + ' ' + Math.round(blob.size / 1024) + 'KB';
    };
    const out = [];
    /* ① 밤하늘 */
    {
      const img = await load(SRC + 'screen-main-2.png');
      const [c, x] = canvasOf(img), W = c.width, H = c.height;
      const d = x.getImageData(0, 0, W, H), a = d.data;
      const TOP = [5, 10, 22], MID = [10, 20, 38], HOR = [22, 42, 70];
      for (let i = 0; i < a.length; i += 4) {
        const py = ((i / 4) / W) | 0, Y = py / H;
        const r = a[i] / 255, g = a[i + 1] / 255, b = a[i + 2] / 255;
        const L = 0.2126 * r + 0.7152 * g + 0.0722 * b, mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        const t1 = sstep(0, 0.55, Y), t2 = sstep(0.4, 0.95, Y);
        let R = mix(mix(TOP[0], MID[0], t1), HOR[0], t2), G = mix(mix(TOP[1], MID[1], t1), HOR[1], t2), B = mix(mix(TOP[2], MID[2], t1), HOR[2], t2);
        /* 구름 — 위쪽의 흰 · 옅은 부분(채도 낮고 밝은 곳) */
        const cloud = sstep(0.62, 0.95, L) * (1 - sstep(0.35, 0.7, Y)) * (1 - sstep(0.25, 0.55, mx - mn + 0.15));
        R += cloud * 46; G += cloud * 58; B += cloud * 80;   /* 구름은 은은하게(진하면 붓자국처럼 보였다) */
        /* 지평선 빛 */
        const glow = sstep(0.55, 0.85, Y) * sstep(0.7, 1, L);
        R += glow * 18; G += glow * 40; B += glow * 72;
        a[i] = R; a[i + 1] = G; a[i + 2] = B;
      }
      x.putImageData(d, 0, 0);
      out.push(await save(c, 'screen-main-2-dk.png', 'image/png'));
    }
    /* ② 빛나는 격자 */
    {
      const img = await load(SRC + 'screen-main-1.png');
      const [c, x] = canvasOf(img), W = c.width, H = c.height;
      const d = x.getImageData(0, 0, W, H), a = d.data;
      for (let i = 0; i < a.length; i += 4) {
        const r = a[i], g = a[i + 1], b = a[i + 2];
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b), ch = (mx - mn) / 255;
        const k = sstep(0.2, 0.55, ch);   /* 원본의 옅은 방사형 빛(채도 낮음)은 빼고 시안 선 · 점만 */
        /* 빛의 색 — 원래 시안을 밝게(최댓값을 255 로) */
        const s = mx ? 255 / mx : 0;
        a[i] = Math.min(255, r * s * 0.55 + 20); a[i + 1] = Math.min(255, g * s * 0.92); a[i + 2] = Math.min(255, b * s);
        /* 위쪽의 둥근 빛(원본 방사형 그라디언트) — 점 · 격자 띠(≈0.3 아래)만 남긴다 */
        const Yg = (((i / 4) / W) | 0) / H;
        a[i + 3] = Math.round(255 * k * sstep(0.22, 0.33, Yg));
      }
      x.putImageData(d, 0, 0);
      out.push(await save(c, 'screen-main-1-dk.png', 'image/png'));
    }
    /* ③ 로그인 사진 — 하늘만 밤으로 */
    {
      const img = await load(SRC + 'background.png');
      const [c, x] = canvasOf(img), W = c.width, H = c.height;
      const d = x.getImageData(0, 0, W, H), a = d.data;
      const TOP = [6, 11, 24], HOR = [28, 46, 78];
      for (let i = 0; i < a.length; i += 4) {
        const px = (i / 4) % W, py = ((i / 4) / W) | 0, Y = py / H;
        const r = a[i] / 255, g = a[i + 1] / 255, b = a[i + 2] / 255;
        const L = 0.2126 * r + 0.7152 * g + 0.0722 * b, mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx - mn;
        /* 하늘 = 파랑이 이기는 곳 또는 밝고 채도 낮은 구름 · 위쪽만(아래로 갈수록 0) */
        const blue = sstep(0.03, 0.12, b - Math.max(r, g * 0.92));   /* 짙은 파랑(오른쪽 위)도 하늘 */
        const white = sstep(0.62, 0.85, L) * (1 - sstep(0.14, 0.28, sat));
        const upper = 1 - sstep(0.4, 0.48, Y);   /* 산등성이(≈0.47) 바로 위 옅은 띠까지 */
        const sky = Math.min(1, Math.max(blue, white)) * upper;
        /* 밤하늘 색 + 구름 결(원본 밝기)을 아주 옅게 */
        const t = sstep(0, 0.42, Y);
        let SR = mix(TOP[0], HOR[0], t), SG = mix(TOP[1], HOR[1], t), SB = mix(TOP[2], HOR[2], t);
        const cl = sstep(0.55, 0.95, L);
        SR += cl * 40; SG += cl * 52; SB += cl * 74;
        /* 땅 · 건물 — 톤만 살짝 누르고 차갑게(형태 · 색은 그대로) */
        /* 저녁 빛 — 밝기 조금 · 채도 조금 누르고 차갑게 */
        const k = 0.68, gy = L, ds = 0.82;
        const r2 = gy + (r - gy) * ds, g2 = gy + (g - gy) * ds, b2 = gy + (b - gy) * ds;
        let GR = r2 * 255 * k * 0.93, GG = g2 * 255 * k * 0.97, GB = Math.min(255, b2 * 255 * k * 1.1 + 8);
        a[i] = mix(GR, SR, sky); a[i + 1] = mix(GG, SG, sky); a[i + 2] = mix(GB, SB, sky);
      }
      x.putImageData(d, 0, 0);
      out.push(await save(c, 'background-dk.jpg', 'image/jpeg', 0.9));
    }
    return out;
  });
}
