/* 라이트 바탕 그림 사본 — 다크 바탕 사진(짙은 남색 + 파랑 빛)을 같은 모양의 밝은 판으로(다크 → 라이트 원칙: 모양 그대로 색만).
   색상(hue)은 그대로, 명도는 뒤집어 밝게(L' = 0.965 - L*0.42), 채도는 반으로 — 빛줄기는 옅은 하늘색 결로 남는다.
   실행: node pw.js lt-raster.js → src/secmon/<이름>-lt.png + light-assets.json */
async (page) => {
  const fs = require('fs'), path = require('path');
  const DIR = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/secmon/';
  const GEN = DIR + '_gen/';
  /* GLASS — 3D 유리 심볼(큐브 노드 · DB 서버 · TPQ 원통 · 인프라 서버 층). 11-27 5차(사용자): "어둡게 해서 보이는 게 아니라 주변 색과 어울리게"
     → 무채색(흰 · 회색 유리) 픽셀만 브랜드 파랑 유리로 물들인다(색상 217°, 채도 0.86, 명도 0.34 + L·0.48 — 흰색은 0.82 맑은 하늘색),
     원래 색이 있는 픽셀(TPQ 분홍 막대 · 시안 표시)은 그대로, 거의 투명한 유리 결은 불투명도 1.45배. */
  const GLASS = ['image-1.png', 'image-2.png', 'image-4.png', 'image-6.png', 'image-7.png', 'bar.png', 'bar-1.png', 'shape.png', 'shape-1.png', 'shape-2.png'];
  const FILES = ['image.png', 'background.png', 'circle.png'].concat(GLASS);
  await page.goto('http://localhost:5620/src/secmon/main.html?live=0');
  const map = JSON.parse(fs.readFileSync(GEN + 'light-assets.json', 'utf8'));
  for (const f of FILES) {
    const b64 = await page.evaluate(async ([src, glass]) => {
      const img = new Image();
      img.src = src + '?r=' + Date.now();
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height), a = d.data;
      for (let i = 0; i < a.length; i += 4) {
        const r = a[i] / 255, gg = a[i + 1] / 255, b = a[i + 2] / 255;
        const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), L = (mx + mn) / 2, dd = mx - mn;
        let h = 0, s = 0;
        if (dd) {
          s = dd / (1 - Math.abs(2 * L - 1));
          h = mx === r ? ((gg - b) / dd) % 6 : mx === gg ? (b - r) / dd + 2 : (r - gg) / dd + 4;
          h *= 60; if (h < 0) h += 360;
        }
        /* 11-27 맑게 — 잿빛이 아니라 옅은 청백(채도 유지 · 바닥 채도 0.12), 종합상황판 원판(circle)은 한 단 진한 하늘색이라 흰 큐브가 떠 보인다 */
        if (glass) {
          if (s >= 0.25 && L > 0.08 && L < 0.95) continue;   /* 원래 색 있는 픽셀은 그대로 */
          const L3 = 0.3 + L * 0.48, S3 = 0.92, h3 = 232;   /* 참고 이미지 인디고 쪽으로 */   /* 11-27 6차: 조금 더 진하게(흰 면 0.78) */
          const C3 = (1 - Math.abs(2 * L3 - 1)) * S3, X3 = C3 * (1 - Math.abs((h3 / 60) % 2 - 1)), m3 = L3 - C3 / 2;
          a[i] = Math.round(m3 * 255); a[i + 1] = Math.round((X3 + m3) * 255); a[i + 2] = Math.round((C3 + m3) * 255);
          a[i + 3] = Math.min(255, Math.round(a[i + 3] * 1.6));
          continue;
        }
        const ring = src === 'circle.png';
        const L2 = ring ? 0.965 - L * 0.05 : 0.985 - L * 0.26, S2 = Math.min(1, ring ? 0.3 : s * 0.35 + 0.05);   /* 11-27 4차: 원판(circle)은 아주 연하게, 바탕은 거의 무채색 */
        const C = (1 - Math.abs(2 * L2 - 1)) * S2, X = C * (1 - Math.abs((h / 60) % 2 - 1)), m = L2 - C / 2;
        let rr = 0, g2 = 0, bb = 0;
        if (h < 60) { rr = C; g2 = X; } else if (h < 120) { rr = X; g2 = C; } else if (h < 180) { g2 = C; bb = X; } else if (h < 240) { g2 = X; bb = C; } else if (h < 300) { rr = X; bb = C; } else { rr = C; bb = X; }
        a[i] = Math.round((rr + m) * 255); a[i + 1] = Math.round((g2 + m) * 255); a[i + 2] = Math.round((bb + m) * 255);
      }
      g.putImageData(d, 0, 0);
      return c.toDataURL('image/png').split(',')[1];
    }, [f, GLASS.indexOf(f) >= 0]);
    const out = f.replace(/\.(png|jpg)$/, '-lt.png');
    fs.writeFileSync(DIR + out, Buffer.from(b64, 'base64'));
    map[f] = out;
  }
  fs.writeFileSync(GEN + 'light-assets.json', JSON.stringify(map, null, 1));
  return map;
}
