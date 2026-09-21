/* ── 미연결 템플릿 — 이미지 시안 · 로고 · 색 입히기 ── */

/* ── 아직 Figma로 구현하지 않은 템플릿 — 임시로 카탈로그 이미지를 스튜디오 화면에 통째로 얹는다 ──
   대시보드(.stage)·디지털 트윈(#dtStage) 어느 쪽이든 data-tpl='image'로 기본 크롬을 덮고
   이미지 오버레이만 보여준다. (한진과 같은 방식이되, 화면 종류에 무관하게 재사용) */
function applyImageTemplate(img, screen) {
  const stage = screen === 'dt' ? document.getElementById('dtStage') : document.querySelector('.stage');
  if (!stage || !img) return;
  stage.setAttribute('data-tpl', 'image');
  /* 템플릿은 1920x1080 기준 시안 → 캔버스를 그 크기로 고정하고 화면에 맞춰 축소 */
  try { if (window.__setCanvas1920) window.__setCanvas1920(true, screen === 'dt' ? 'dt' : 'dash'); } catch (e) {}
  try { syncSkxControls(); } catch (e) {}
  let repro = stage.querySelector('.tplimg-repro');
  if (repro) repro.remove();
  repro = document.createElement('div');
  repro.className = 'tplimg-repro';
  /* 고해상도 시안 우선 — 파일명에 '-hi'가 붙은 1920급 시안(예: tpl-03-hi.jpg)이 있으면 그걸,
     없으면(404) 카탈로그 썸네일(tpl-03.jpg)로 자동 폴백한다. 새 고해상도 파일을 넣기만 하면 반영됨. */
  const hi = img.replace(/(\.[a-z0-9]+)$/i, '-hi$1');
  repro.innerHTML = '<img class="tplimg-shot" src="' + hi + '" alt="템플릿 미리보기">';
  const el = repro.querySelector('.tplimg-shot');
  el.addEventListener('error', function onErr() { el.removeEventListener('error', onErr); el.src = img; }, { once: true });
  ensureTplAddedLayer(repro);
  stage.appendChild(repro);
  try { window.__refreshTpl && window.__refreshTpl(); } catch (e) {} /* 업로드한 브랜드 로고 · 테마 색조 반영 */
}
/* 이미지 오버레이 제거(다른 프로젝트로 전환·초기화 시) */
function clearImageTemplate() {
  document.querySelectorAll(".stage[data-tpl='image'], #dtStage[data-tpl='image']").forEach((stage) => {
    stage.removeAttribute('data-tpl');
    const r = stage.querySelector('.tplimg-repro');
    if (r) r.remove();
  });
  /* 템플릿을 걷어내면 1920x1080 캔버스도 해제 */
  try { if (window.__setCanvas1920) window.__setCanvas1920(false); } catch (e) {}
}
window.__applyImageTemplate = applyImageTemplate;

/* ── 템플릿 시안의 로고를 업로드한 브랜드 로고로 교체 ────────────────────────────
   '색 정하기 → 로고 업로드 → 로고에서 기준색'을 누르면 기준색만 바꾸는 게 아니라
   시안 좌상단 로고도 업로드 로고로 바꾼다(모든 템플릿 공통).
     · SK하이닉스: 인라인 SVG라 #skx-Logo 그룹을 숨기고 같은 자리(bbox)에 <image>를 얹는다.
     · 한진·미연결 이미지 템플릿: 시안이 통짜 래스터라 로고 자리(1920×1080 기준 좌표)에
       업로드 로고를 얹고, 원래 로고는 시안에서 뽑은 헤더 배경색으로 덮는다.
   적용 여부(FLAG)는 저장돼 새로고침·시안 재생성 후에도 유지된다. */
const TPLLOGO = {
  FLAG: 'wemb-brand-logo-tpl',
  SRCK: 'wemb-brand-logo',
  SVGNS: 'http://www.w3.org/2000/svg',
  /* 로고 자리를 못 찾았을 때 쓰는 기본 자리 — 1920×1080 기준 좌상단 헤더 */
  FALLBACK: { x: 14, y: 12, w: 170, h: 36 },
  boxCache: {},
  arCache: {},
  /* 업로드 로고의 가로세로비 — 로고 자리 높이에 맞춘 '실제 이미지 폭'을 계산하는 데 쓴다.
     아직 못 읽었으면 0을 주고, 로드가 끝나면 콜백으로 다시 적용한다. */
  aspect(src, again) {
    if (this.arCache[src]) return this.arCache[src];
    const im = new Image();
    im.onload = () => { if (im.naturalWidth && im.naturalHeight) { this.arCache[src] = im.naturalWidth / im.naturalHeight; try { again && again(); } catch (e) {} } };
    im.src = src;
    return 0;
  },
  isOn() { try { return localStorage.getItem(this.FLAG) === '1'; } catch (e) { return false; } },
  setOn(v) { try { v ? localStorage.setItem(this.FLAG, '1') : localStorage.removeItem(this.FLAG); } catch (e) {} },
  logoSrc() { try { return (this.isOn() && localStorage.getItem(this.SRCK)) || ''; } catch (e) { return ''; } },

  /* 원래 로고를 덮을 색 — 로고 오른쪽 헤더 띠를 작게 그려 최빈색을 고른다.
     (file:// 로 열어 캔버스가 막히면 테마 배경색으로 대체) */
  patch(imgEl, box) {
    try {
      const nw = imgEl.naturalWidth, nh = imgEl.naturalHeight;
      if (!nw || !nh) throw 0;
      const sx = nw / 1920, sy = nh / 1080;
      const cv = document.createElement('canvas');
      cv.width = 24; cv.height = 8;
      const cx = cv.getContext('2d', { willReadFrequently: true });
      cx.drawImage(imgEl, (box.x + box.w + 8) * sx, box.y * sy, 120 * sx, box.h * sy, 0, 0, 24, 8);
      const d = cx.getImageData(0, 0, 24, 8).data, cnt = {};
      for (let i = 0; i < d.length; i += 4) {
        const k = ((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3);
        cnt[k] = (cnt[k] || 0) + 1;
      }
      let best = -1, n = -1;
      for (const k in cnt) if (cnt[k] > n) { n = cnt[k]; best = +k; }
      if (best < 0) throw 0;
      /* 시안 픽셀을 그대로 읽으므로(테마 색으로 이미 다시 칠해진 그림) 보정이 따로 필요 없다 */
      return 'rgb(' + (((best >> 10) & 31) << 3) + ',' + (((best >> 5) & 31) << 3) + ',' + ((best & 31) << 3) + ')';
    } catch (e) {
      const cs = getComputedStyle(document.documentElement);
      return (cs.getPropertyValue('--bg-header') || cs.getPropertyValue('--bg-surface') || '').trim() || '#0b1220';
    }
  },
  /* 시안 좌상단 헤더에서 '로고 덩어리'를 찾아 그 자리를 돌려준다 — 시안마다 로고 위치·크기가
     달라 좌표를 박아 둘 수 없다. 헤더 좌측 600×80(1920 기준) 을 축소해 배경색과 다른 픽셀을
     모으고, 가로줄(헤더 밑선)은 빼고, 8단위 이상 떨어진 덩어리로 나눈 뒤 왼쪽에서 시작하는
     가장 진한 덩어리를 로고로 본다(햄버거 버튼 같은 작은 덩어리는 자연히 밀린다). */
  detect(imgEl) {
    const key = imgEl.__origSrc || imgEl.currentSrc || imgEl.src; /* 다시 칠한 그림도 원본 기준으로 캐시 */
    if (this.boxCache[key]) return this.boxCache[key];
    let box = null;
    try {
      const cw = imgEl.naturalWidth, chh = imgEl.naturalHeight;
      if (!cw || !chh) return this.FALLBACK;
      const W = 300, H = 40, U = 2; /* 1px = 2단위 */
      const cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      const cx = cv.getContext('2d', { willReadFrequently: true });
      cx.drawImage(imgEl, 0, 0, (600 / 1920) * cw, (80 / 1080) * chh, 0, 0, W, H);
      const d = cx.getImageData(0, 0, W, H).data, cnt = {};
      for (let i = 0; i < d.length; i += 4) { const k = ((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3); cnt[k] = (cnt[k] || 0) + 1; }
      let bg = -1, n = -1;
      for (const k in cnt) if (cnt[k] > n) { n = cnt[k]; bg = +k; }
      const br = ((bg >> 10) & 31) << 3, bgg = ((bg >> 5) & 31) << 3, bb = (bg & 31) << 3;
      const ink = (x, y) => { const i = (y * W + x) * 4; return Math.abs(d[i] - br) + Math.abs(d[i + 1] - bgg) + Math.abs(d[i + 2] - bb) > 100; };
      const rowOK = [];
      for (let y = 0; y < H; y++) { let c = 0; for (let x = 0; x < W; x++) if (ink(x, y)) c++; rowOK[y] = c < W * 0.7; }
      const col = [];
      for (let x = 0; x < W; x++) { let c = 0; for (let y = 0; y < H; y++) if (rowOK[y] && ink(x, y)) c++; col[x] = c; }
      const groups = []; let g = null, gap = 0;
      for (let x = 0; x < W; x++) {
        if (col[x] > 0) { if (!g) { g = { x0: x, x1: x, area: 0 }; groups.push(g); } g.x1 = x; g.area += col[x]; gap = 0; }
        else if (g && ++gap >= 4) g = null;
      }
      const cand = groups.filter((t) => t.x0 < 75 && t.x1 - t.x0 >= 3).sort((a, b) => b.area - a.area)[0];
      if (cand) {
        let y0 = -1, y1 = -1;
        for (let y = 0; y < H; y++) {
          if (!rowOK[y]) continue;
          let c = 0; for (let x = cand.x0; x <= cand.x1; x++) if (ink(x, y)) c++;
          if (c > 0) { if (y0 < 0) y0 = y; y1 = y; }
        }
        if (y0 >= 0) {
          /* 여유 2단위를 두되, 헤더를 넘어서지 않게 크기를 제한한다(잘못 잡아도 피해가 없도록) */
          let x = Math.max(0, cand.x0 * U - 2), y = Math.max(4, y0 * U - 2);
          let w = Math.min(210, (cand.x1 - cand.x0 + 1) * U + 4), h = Math.min(42, (y1 - y0 + 1) * U + 4);
          if (y + h > 68) h = 68 - y;
          box = { x, y, w, h };
        }
      }
    } catch (e) {}
    return (this.boxCache[key] = box || this.FALLBACK);
  },
  /* 시안 이미지는 object-fit:contain — 실제로 그려진 사각형에 맞춰 로고 자리를 잡는다.
     크기는 레이어의 레이아웃 크기(clientWidth/Height)로 잰다 — getBoundingClientRect 는
     1920 캔버스에 걸린 transform:scale 이 섞여 들어가 자리가 어긋난다. */
  fit(layer) {
    const el = layer.querySelector(':scope > .tpl-logoswap');
    const imgEl = layer.querySelector(':scope > img');
    if (!el || !imgEl || !el.__box) return;
    const cw = layer.clientWidth, chh = layer.clientHeight;
    const nw = imgEl.naturalWidth || 1920, nh = imgEl.naturalHeight || 1080;
    if (!cw || !chh) return;
    const sc = Math.min(cw / nw, chh / nh), dw = nw * sc, dh = nh * sc;
    const ox = (cw - dw) / 2, oy = (chh - dh) / 2, b = el.__box;
    /* 상자 = 원래 로고를 덮을 자리 */
    el.style.left = (ox + (b.x / 1920) * dw) + 'px';
    el.style.top = (oy + (b.y / 1080) * dh) + 'px';
    el.style.width = ((b.w / 1920) * dw) + 'px';
    el.style.height = ((b.h / 1080) * dh) + 'px';
    /* 이미지 = 원본 비율 그대로의 실제 크기(늘이거나 남는 여백 없이) */
    const im = el.querySelector('img');
    if (im && el.__logoW) {
      im.style.width = ((el.__logoW / 1920) * dw) + 'px';
      im.style.height = ((el.__logoH / 1080) * dh) + 'px';
    } else if (im) { im.style.width = ''; im.style.height = ''; }
  },
  raster(layer, src) {
    let el = layer.querySelector(':scope > .tpl-logoswap');
    if (!src) { if (el) { if (el.__ro) el.__ro.disconnect(); el.remove(); } return; }
    const imgEl = layer.querySelector(':scope > img');
    if (!imgEl) return;
    if (!imgEl.complete || !imgEl.naturalWidth) {
      imgEl.addEventListener('load', () => this.raster(layer, src), { once: true });
      return;
    }
    if (!el) {
      el = document.createElement('div');
      el.className = 'tpl-logoswap';
      el.innerHTML = '<img alt="브랜드 로고">';
      layer.appendChild(el);
      if (window.ResizeObserver) { el.__ro = new ResizeObserver(() => this.fit(layer)); el.__ro.observe(layer); }
    }
    el.__box = this.detect(imgEl);
    const ar = this.aspect(src, () => this.raster(layer, src));
    /* 로고 크기(1920 단위) — 높이는 원래 로고 높이에 맞추고 폭은 원본 비율 그대로.
       다만 통짜 그림 시안은 오른쪽 타이틀을 밀 수 없으므로 원래 로고 자리 폭을 넘지 않게
       하고(넘으면 비율 유지한 채 축소), 남는 높이는 위아래 가운데로 놓는다. */
    const bx = el.__box;
    let lw = ar ? bx.h * ar : bx.w, lh = bx.h;
    if (ar && lw > bx.w) { lw = bx.w; lh = lw / ar; }
    el.__logoW = ar ? lw : 0;
    el.__logoH = ar ? lh : 0;
    el.style.background = this.patch(imgEl, el.__box);
    el.querySelector('img').src = src;
    this.fit(layer);
  },
  /* 그래픽 '잉크'만의 상자 — 스튜디오가 글자 편집용으로 주입한 foreignObject(폭 400+)는
     빼고, 실제로 그려지는 요소만 모아 감싼다. */
  inkBox(node) {
    const OK = { path: 1, rect: 1, circle: 1, ellipse: 1, line: 1, polyline: 1, polygon: 1, text: 1, image: 1, use: 1 };
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const walk = (n) => {
      [...n.children].forEach((c) => {
        const t = (c.tagName || '').toLowerCase();
        if (t === 'foreignobject' || t === 'defs' || (c.style && c.style.display === 'none')) return;
        if (OK[t]) {
          try {
            const r = c.getBBox();
            if (r && (r.width || r.height)) {
              x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y);
              x1 = Math.max(x1, r.x + r.width); y1 = Math.max(y1, r.y + r.height);
            }
          } catch (e) {}
        }
        if (c.children && c.children.length) walk(c);
      });
    };
    walk(node);
    return x1 > x0 ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
  },
  /* 로고 폭이 바뀌어도 브랜드 줄(.skx-Brand)의 간격은 일정하게 —
     원래 로고 오른쪽 끝을 기준으로 넓어지거나 좁아진 만큼, 뒤따르는 구분선·타이틀을
     통째로 평행이동한다(간격 자체는 시안 원본 값 그대로 유지된다).
     단, 오른쪽 시계 영역을 침범하지는 않도록 이동량을 제한한다. */
  reflowBrand(g, newRight) {
    const brand = g.parentNode;
    if (!brand || !g.__logoBox) return;
    if (brand.__origRight == null) brand.__origRight = g.__logoBox.x + g.__logoBox.w;
    let dx = newRight - brand.__origRight;
    if (dx > 0) {
      const title = brand.querySelector('[id="skx-Product Title"]') || brand.lastElementChild;
      const clock = brand.parentNode && brand.parentNode.querySelector('[id="skx-Clock"]');
      const tb = title && (title.__inkBox || (title.__inkBox = this.inkBox(title)));
      const cb = clock && (clock.__inkBox || (clock.__inkBox = this.inkBox(clock)));
      if (tb && cb) dx = Math.min(dx, Math.max(0, cb.x - 24 - (tb.x + tb.w)));
    }
    let after = false;
    [...brand.children].forEach((c) => {
      if (c === g) { after = true; return; }
      if (!after || c.getAttribute('id') === 'skx-logoswap') return;
      if (c.__baseTf == null) c.__baseTf = c.getAttribute('transform') || '';
      const tf = (c.__baseTf + ' translate(' + dx.toFixed(2) + ' 0)').trim();
      c.setAttribute('transform', tf);
    });
  },
  /* 원래 로고로 되돌릴 때 — 옮겨 뒀던 형제들을 제자리로 */
  resetBrand(g) {
    const brand = g && g.parentNode;
    if (!brand) return;
    [...brand.children].forEach((c) => {
      if (c.__baseTf == null) return;
      c.__baseTf ? c.setAttribute('transform', c.__baseTf) : c.removeAttribute('transform');
    });
  },
  /* 인라인 SVG 시안(SK하이닉스) — #skx-Logo 그룹 자리에 <image>로 얹는다 */
  svgLogo(scr, src, tries) {
    const svg = scr.querySelector('svg');
    if (!svg) return;
    const g = svg.querySelector('[id="skx-Logo"]');
    if (!g) return;
    let img = svg.querySelector('[id="skx-logoswap"]');
    if (!src) { if (img) img.remove(); g.style.display = ''; this.resetBrand(g); return; }
    let b = g.__logoBox;
    if (!b) {
      /* 로고 '잉크'(심볼+워드마크)만의 합집합 상자를 쓴다 — 그룹 전체 getBBox 는 스튜디오가
         글자 편집용으로 주입한 foreignObject(폭 400+) 때문에 4배 가까이 넓게 잡힌다. */
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      [...g.children].forEach((c) => {
        if (c.tagName === 'foreignObject' || c.getAttribute('id') === 'skx-logoswap') return;
        try {
          const r = c.getBBox();
          if (!r || !r.width) return;
          x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y);
          x1 = Math.max(x1, r.x + r.width); y1 = Math.max(y1, r.y + r.height);
        } catch (e) {}
      });
      if (x1 > x0) b = g.__logoBox = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    }
    /* 레이아웃 전에는 getBBox 가 0 이라 잠시 뒤 다시 시도한다(핫스팟 표시와 같은 방식) */
    if (!b) { if ((tries || 0) < 20) setTimeout(() => this.svgLogo(scr, src, (tries || 0) + 1), 150); return; }
    g.style.display = 'none';
    if (!img) {
      img = document.createElementNS(this.SVGNS, 'image');
      img.setAttribute('id', 'skx-logoswap');
      img.setAttribute('preserveAspectRatio', 'xMinYMid meet'); /* 로고는 왼쪽 맞춤 */
      g.parentNode.insertBefore(img, g.nextSibling);
    }
    /* 폭은 로고 자리 높이에 맞춘 이미지 실제 폭 — 남는 여백 없이 원본 비율 그대로 들어간다 */
    const ar = this.aspect(src, () => this.svgLogo(scr, src));
    const w = ar ? b.h * ar : b.w;
    img.setAttribute('x', b.x); img.setAttribute('y', b.y);
    img.setAttribute('width', w); img.setAttribute('height', b.h);
    this.reflowBrand(g, b.x + w); /* 로고 폭이 달라져도 뒤 요소와의 간격은 그대로 */
    img.setAttribute('href', src);
    img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', src);
  },
  apply() {
    const src = this.logoSrc();
    document.querySelectorAll('.skx-screen').forEach((scr) => this.svgLogo(scr, src));
    document.querySelectorAll('.hj-repro, .tplimg-repro').forEach((l) => this.raster(l, src));
  },
};
window.__applyTplLogo = () => { try { TPLLOGO.apply(); } catch (e) {} };

/* ── 템플릿 시안 팔레트 바꾸기 ──────────────────────────────────────────────
   2D·DT 시안은 팔레트 변수로 그려서 '색 정하기'가 그대로 반영되지만, 템플릿 시안은
   통짜 그림(한진·미연결 이미지)이거나 색이 박힌 SVG(SK하이닉스)라 강조색 몇 군데만 바뀌었다.
   필터·블렌드로 덮으면 '뭔가 씌운' 느낌이 나므로, 여기서는 색 자체를 다시 칠한다.
     · 래스터 시안: 픽셀을 HSL 로 풀어 색상은 기준색 쪽으로 돌리고, 회색 면은 기준색으로
       옅게 물들인 뒤 이미지를 통째로 다시 만들어 끼운다(64³ LUT 로 한 번에 매핑).
     · SK하이닉스 SVG: 색 변수(--skx-c*)·색맵에 없는 하드코딩 색(그라데이션 정지색 포함)·
       내장 래스터 이미지를 모두 같은 규칙으로 다시 칠한다.
   변환은 OKLab(사람이 느끼는 밝기 기준) 에서 한다. HSL 의 L 은 색상마다 실제 밝기가
   달라서(같은 L=50% 라도 파랑은 어둡고 초록·노랑은 훨씬 밝다), HSL 로 색상만 돌리면
   파랑→초록 계열로 갈 때 화면이 통째로 떠 버린다(#0056FF→#00ff62 는 체감 밝기 +0.34).
   그래서 여기서는 체감 밝기(L)를 그대로 두고 색상만 옮기며, 채도가 sRGB 밖으로 나가면
   채도만 줄여 넣는다 — 채널이 잘려 색이 뭉개지는(‘날아가는’) 현상을 막는다. */
const TPLTINT = {
  NEUTRAL_OK: 0.022, /* 회색 면에 입히는 채도(OKLab) — 팔레트가 바뀐 느낌을 만드는 값 */
  NEUTRAL_C: 0.035,  /* 이 채도(OKLab) 미만은 '회색'으로 본다 */
  CHROMA_LIMIT: [0.9, 1.06], /* 유채색 채도 보정 범위 — 넓게 잡으면 화면이 쨍해진다 */
  COMPRESS: 0.45,    /* 브랜드 계열의 색상 편차를 기준색 쪽으로 얼마나 모을지(0=완전 단일색, 1=원래 간격 유지) */
  /* 의미가 정해진 색 대역 — 경보(빨강·주황·노랑)와 정상(초록)은 테마가 바뀌어도 그대로 둔다.
     단, 시안 자체의 주조색이 그 대역이면(예: 앰버 기반 시안) 보호하지 않는다. */
  SEMANTIC: [[0, 62], [330, 360], [95, 165]],
  LUT_N: 64,
  DEFAULT_HUE: 215,  /* 표에도 없고 픽셀도 못 읽을 때 쓰는 기본값(대부분 남색 계열) */
  /* 시안별 주조 hue — 미리 재 둔 값. file:// 로 열면 캔버스에서 픽셀을 못 읽어(보안 제한)
     그때는 이 표가 없으면 아무 색도 못 바꾼다. */
  HUE: {
    'tpl-01': 205, 'tpl-02': 263, 'tpl-03': 215, 'tpl-04': 41, 'tpl-05': 202, 'tpl-06': 201,
    'tpl-07': 231, 'tpl-08': 217, 'tpl-09': 204, 'tpl-10': 234, 'tpl-11': 189, 'tpl-12': 232,
    'tpl-13': 233, 'tpl-14': 233, 'tpl-15': 39, 'tpl-16': 216, 'tpl-17': 219, 'tpl-18': 232,
    'hanjin-studio': 220, 'skhynix-1': 217, 'skhynix-2': 217,
    /* Icheon main 계열(Light-시안02) — 남보라 계열이 주조색이다 */
    'icheon-hub': 250, 'icheon-hvac': 250,
  },
  canvasOK: true,    /* 픽셀을 읽어 다시 칠할 수 있는 환경인지 */
  hueCache: {},      /* 원본 이미지 src → 주조 hue */
  origImg: {},       /* 원본 이미지 캐시(다시 칠하기 전 원본) */
  skxBase: null,     /* skhynix 색 변수 원본값 { dark:{}, light:{} } */
  skxRef: undefined, /* skhynix 시안 주조 hue */
  lut: null, lutKey: '',
  timer: null,

  norm(d) { d = ((d % 360) + 360) % 360; return d > 180 ? d - 360 : d; },
  parse(v) {
    v = String(v || '').trim();
    if (!v) return null;
    try {
      if (v[0] === '#') return rgbToHsl(hexToRgb(v));
      let m = v.match(/rgba?\(([^)]+)\)/);
      if (m) { const q = m[1].split(/[,\s/]+/).map(Number); return rgbToHsl({ r: q[0], g: q[1], b: q[2] }); }
      m = v.match(/hsla?\(([^)]+)\)/);
      if (m) { const q = m[1].split(/[,\s/]+/); return { h: parseFloat(q[0]), s: parseFloat(q[1]), l: parseFloat(q[2]) }; }
    } catch (e) {}
    return null;
  },
  /* 여러 색의 '주조 hue' — 15도 구간별로 채도·명도 가중치를 모아 가장 두꺼운 구간의 평균 */
  domHue(list) {
    const B = 24, w = new Array(B).fill(0), sx = new Array(B).fill(0), sy = new Array(B).fill(0);
    list.forEach((c) => {
      if (!c || c.s < 12 || c.l < 6 || c.l > 94) return;
      const k = c.s * (1 - Math.abs(c.l - 50) / 50);
      const b = Math.min(B - 1, Math.floor(c.h / (360 / B)));
      w[b] += k; sx[b] += Math.cos((c.h * Math.PI) / 180) * k; sy[b] += Math.sin((c.h * Math.PI) / 180) * k;
    });
    let bi = -1, bv = 0;
    for (let i = 0; i < B; i++) if (w[i] > bv) { bv = w[i]; bi = i; }
    return bi < 0 ? null : ((Math.atan2(sy[bi], sx[bi]) * 180) / Math.PI + 360) % 360;
  },
  /* 기준색 — 색 정하기가 만든 강조색 */
  target() {
    const main = document.querySelector('.main');
    const cs = main ? getComputedStyle(main) : null;
    let c = cs ? this.parse(cs.getPropertyValue('--point-main')) : null;
    if (!c) { try { c = this.parse(state.seed); } catch (e) {} }
    return c;
  },
  /* ── 색 변환 규칙 (전 화면 공통) ── */
  hsl2rgb(h, s, l) {
    h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(100, s)) / 100; l = Math.max(0, Math.min(100, l)) / 100;
    const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
  },
  /* ── OKLab — 체감 밝기를 보존하기 위한 색 공간 ── */
  srgb2lin(v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); },
  lin2srgb(v) { v = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(Math.max(0, v), 1 / 2.4) - 0.055; return Math.max(0, Math.min(255, Math.round(v * 255))); },
  rgb2ok(r, g, b) {
    const R = this.srgb2lin(r), G = this.srgb2lin(g), B = this.srgb2lin(b);
    const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B),
      m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B),
      s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
    const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
      A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
      Bb = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
    return { L: L, C: Math.sqrt(A * A + Bb * Bb), h: Math.atan2(Bb, A) };
  },
  /* OKLCH → 선형 RGB. 색역 판정은 감마 전에 하는 게 싸고(제곱근 없음) 결과는 같다. */
  okLin(L, C, h) {
    const A = C * Math.cos(h), B = C * Math.sin(h);
    const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3,
      m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3,
      s = (L - 0.0894841775 * A - 1.2914855480 * B) ** 3;
    return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
  },
  inGamut(o) { return o[0] >= -0.001 && o[0] <= 1.001 && o[1] >= -0.001 && o[1] <= 1.001 && o[2] >= -0.001 && o[2] <= 1.001; },
  /* 색역 밖이면 밝기·색상은 두고 채도만 줄여 넣는다 — 채널을 자르면 색이 뭉개진다. */
  ok2rgb(L, C, h) {
    let o = this.okLin(L, C, h);
    if (!this.inGamut(o)) {
      let lo = 0, hi = C, ok = this.okLin(L, 0, h);
      for (let i = 0; i < 10; i++) {
        const mid = (lo + hi) / 2, t = this.okLin(L, mid, h);
        if (this.inGamut(t)) { lo = mid; ok = t; } else hi = mid;
      }
      o = ok;
    }
    return [this.lin2srgb(o[0]), this.lin2srgb(o[1]), this.lin2srgb(o[2])];
  },
  normRad(d) { while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; },
  mapRGB(r, g, b, P) {
    const c = rgbToHsl({ r, g, b });
    if (c.l <= 3 || c.l >= 97) return [r, g, b];  /* 완전 검정·흰색(글자·배경)은 그대로 */
    const o = this.rgb2ok(r, g, b);              /* 체감 밝기 o.L 은 끝까지 그대로 쓴다 */
    if (o.C < this.NEUTRAL_C) {
      /* 회색 면 — 기준색으로 옅게 물들인다(채도만, 밝기는 유지) */
      return this.ok2rgb(o.L, o.C + this.NEUTRAL_OK * (1 - o.C / this.NEUTRAL_C), P.hOk);
    }
    /* 경보(빨강·주황·노랑)·정상(초록)은 의미가 있는 색이라 그대로 둔다.
       나머지(시안의 브랜드 계열)는 기준색 둘레로 모아 준다 — 원래 색상 간의 간격은
       COMPRESS 만큼만 남겨, 파랑·보라·시안이 다 같이 기준색 계열로 넘어온다.
       (예전엔 주조색에서 먼 색일수록 덜 돌려서, 보라·시안이 파란색으로 남아 있었다.) */
    if (this.isSemantic(c.h, P.src)) return [r, g, b];
    const dev = this.normRad(o.h - P.srcOk);
    return this.ok2rgb(o.L, o.C * P.chromaK, P.hOk + dev * this.COMPRESS);
  },
  isSemantic(h, src) {
    for (const [a, b] of this.SEMANTIC) {
      if (h >= a && h <= b) return !(src >= a - 10 && src <= b + 10);
    }
    return false;
  },
  mapHex(hex, P) { const o = this.mapRGB(...Object.values(hexToRgb(hex)), P); return '#' + o.map((v) => v.toString(16).padStart(2, '0')).join(''); },
  paramsFor(srcHue, t) {
    if (!t || srcHue == null) return null;
    const lim = this.CHROMA_LIMIT;
    /* 시안 주조색·기준색을 OKLab 색상각으로 옮겨 둔다(회전은 이 각도끼리 계산). */
    const sOk = this.rgb2ok(...this.hsl2rgb(srcHue, 70, 50));
    const tOk = this.rgb2ok(...this.hsl2rgb(t.h, t.s, t.l));
    return {
      src: srcHue, target: t.h, d: this.norm(t.h - srcHue),
      srcOk: sOk.h, hOk: tOk.h,
      /* 기준색이 진할수록 아주 조금만 더 진하게 — 예전엔 최대 +15%라 화면이 쨍했다 */
      chromaK: Math.max(lim[0], Math.min(lim[1], tOk.C / 0.13)),
    };
  },
  /* 64³ 색 대응표 — 픽셀마다 HSL 변환하면 느리므로 한 번 만들어 두고 찍어 낸다 */
  lutFor(P) {
    const key = P.src.toFixed(1) + '|' + P.d.toFixed(1) + '|' + P.target.toFixed(1) + '|' + P.chromaK.toFixed(2);
    if (this.lutKey === key && this.lut) return this.lut;
    const N = this.LUT_N, T = new Uint8Array(N * N * N * 3);
    let i = 0;
    for (let ri = 0; ri < N; ri++) {
      const r = Math.round((ri * 255) / (N - 1));
      for (let gi = 0; gi < N; gi++) {
        const g = Math.round((gi * 255) / (N - 1));
        for (let bi = 0; bi < N; bi++) {
          const o = this.mapRGB(r, g, Math.round((bi * 255) / (N - 1)), P);
          T[i++] = o[0]; T[i++] = o[1]; T[i++] = o[2];
        }
      }
    }
    this.lutKey = key;
    return (this.lut = T);
  },
  /* 원본 이미지(다시 칠하기 전) — 한 번 받아 두고 재사용 */
  orig(src, done) {
    const im = this.origImg[src];
    if (im) return im.complete && im.naturalWidth ? im : null;
    const n = new Image();
    n.onload = () => { try { done && done(); } catch (e) {} };
    n.src = src;
    this.origImg[src] = n;
    return null;
  },
  repaintImage(base, P, png) {
    try {
      const w = base.naturalWidth, h = base.naturalHeight;
      if (!w || !h) return null;
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      const cx = cv.getContext('2d', { willReadFrequently: true });
      cx.drawImage(base, 0, 0);
      const id = cx.getImageData(0, 0, w, h), d = id.data, T = this.lutFor(P), N = this.LUT_N, q = (N - 1) / 255;
      for (let i = 0; i < d.length; i += 4) {
        if (!d[i + 3]) continue;
        const o = ((((d[i] * q + 0.5) | 0) * N + ((d[i + 1] * q + 0.5) | 0)) * N + ((d[i + 2] * q + 0.5) | 0)) * 3;
        d[i] = T[o]; d[i + 1] = T[o + 1]; d[i + 2] = T[o + 2];
      }
      cx.putImageData(id, 0, 0);
      return png ? cv.toDataURL('image/png') : cv.toDataURL('image/jpeg', 0.92);
    } catch (e) { return null; }
  },
  /* 시안 이미지(한진·미연결 이미지 템플릿) 다시 칠하기 */
  /* srcHue 를 넘기면 그 값을 시안의 주조색으로 삼는다 — 상태 점·아이콘처럼 '한 가지 색'만
     들어 있는 작은 그림은 자기 색이 곧 주조색이 돼 경보색까지 통째로 돌아가기 때문이다. */
  rasterTint(imgEl, t, srcHue) {
    if (!imgEl.__origSrc) imgEl.__origSrc = imgEl.getAttribute('src');
    const src = imgEl.__origSrc;
    const base = this.orig(src, () => this.schedule());
    if (!base) return;
    const P = this.paramsFor(srcHue != null ? srcHue : this.hueOf(src, base), t);
    const key = P ? src + '|' + P.d.toFixed(1) + '|' + P.target.toFixed(1) + '|' + P.chromaK.toFixed(2) : '';
    if (imgEl.__tintKey === key) return;
    imgEl.__tintKey = key;
    if (!P || (Math.abs(P.d) < 1 && Math.abs(P.chromaK - 1) < 0.02)) {
      imgEl.style.filter = '';
      if (imgEl.getAttribute('src') !== src) imgEl.src = src;
      return;
    }
    /* 알파를 지켜야 하는 그림은 PNG 로 굽는다 — JPEG 에는 투명도가 없어서
       .svg 아이콘(흰 글리프 + 투명 배경)이 통째로 사각형 블록이 돼 버린다.
       (UPS 팝업 헤더의 시계·사용자·로그아웃 아이콘이 네모로 보이던 원인)
       사진(.jpg)만 JPEG 로 두고 나머지는 전부 PNG. */
    const url = this.repaintImage(base, P, !/^data:image\/jpe?g|\.jpe?g$/i.test(src));
    if (url) {
      imgEl.style.filter = '';
      /* 새 그림이 들어오면 로고 덮개 색도 그 그림에서 다시 뽑는다 */
      imgEl.addEventListener('load', () => { try { TPLLOGO.apply(); } catch (e) {} }, { once: true });
      imgEl.src = url;
    } else {
      /* 픽셀을 못 읽는 환경(file:// 로 연 경우) — 색상 회전으로 대신한다.
         경보색 보호·회색 물들이기는 못 하지만, 아무 것도 안 바뀌는 것보다는 낫다. */
      this.canvasOK = false;
      if (imgEl.getAttribute('src') !== src) imgEl.src = src;
      imgEl.style.filter = 'hue-rotate(' + P.d.toFixed(1) + 'deg)';
      try { TPLLOGO.apply(); } catch (e) {}
    }
  },
  hueOf(src, base) {
    const name = String(src || '').split('/').pop().split('?')[0].replace(/-hi(?=\.)/i, '').replace(/\.[a-z0-9]+$/i, '');
    if (this.HUE[name] != null) return this.HUE[name];
    if (this.hueCache[src] === undefined) this.hueCache[src] = base ? this.imgHueOf(base) : null;
    return this.hueCache[src] != null ? this.hueCache[src] : this.DEFAULT_HUE;
  },
  imgHueOf(base) {
    try {
      const W = 96, H = 54;
      const cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      const cx = cv.getContext('2d', { willReadFrequently: true });
      cx.drawImage(base, 0, 0, W, H);
      const d = cx.getImageData(0, 0, W, H).data, list = [];
      for (let i = 0; i < d.length; i += 4) list.push(rgbToHsl({ r: d[i], g: d[i + 1], b: d[i + 2] }));
      return this.domHue(list);
    } catch (e) { return null; }
  },
  /* ── SK하이닉스 SVG ── */
  skxMap(mode) {
    if (!this.skxBase) {
      const base = { dark: {}, light: {} };
      try {
        [...document.styleSheets].forEach((sh) => {
          let rules = null;
          try { rules = sh.cssRules; } catch (e) { return; }
          [...(rules || [])].forEach((r) => {
            if (!r.selectorText || !/skx-(screen|svg)/.test(r.selectorText)) return;
            const light = /light/.test(r.selectorText);
            for (let i = 0; i < r.style.length; i++) {
              const n = r.style[i];
              if (n.indexOf('--skx-c') !== 0) continue;
              const v = r.style.getPropertyValue(n).trim();
              if (v[0] === '#') (light ? base.light : base.dark)[n] = v;
            }
          });
        });
      } catch (e) {}
      this.skxBase = base;
    }
    const m = Object.assign({}, this.skxBase.dark);
    if (mode === 'light') Object.assign(m, this.skxBase.light);
    return m;
  },
  /* 시안 주조 hue — 색 변수 개수로 재면 경보용 주황 계열에 끌려가므로 실제 렌더에서 잰다 */
  skxRefHue() { return this.hueOf('skhynix-1.jpg', null); },
  skxTint(scr, t, mode) {
    const host = scr.querySelector('.skx-svg') || scr;
    host.style.filter = ''; /* 예전 필터 방식 잔재 제거 */
    const veil = scr.querySelector(':scope > .tpl-tintveil');
    if (veil) veil.remove();
    const map = this.skxMap(mode);
    const P = this.paramsFor(this.skxRefHue(), t);
    const key = P ? mode + '|' + P.d.toFixed(1) + '|' + P.target.toFixed(1) + '|' + P.chromaK.toFixed(2) : '';
    if (host.__tintKey === key) return;
    host.__tintKey = key;
    /* 1) 색 변수 */
    Object.keys(map).forEach((k) => (P ? host.style.setProperty(k, this.mapHex(map[k], P)) : host.style.removeProperty(k)));
    /* 2) 색맵에 없는 하드코딩 색(그라데이션 정지색 포함) */
    if (!host.__paint) {
      host.__paint = [];
      host.querySelectorAll('[fill^="#"],[stroke^="#"],[stop-color^="#"]').forEach((el) => {
        ['fill', 'stroke', 'stop-color'].forEach((a) => {
          const v = el.getAttribute(a);
          if (!v || v[0] !== '#') return;
          if (map['--skx-c' + v.slice(1).toUpperCase()]) return; /* 변수로 이미 처리되는 색 */
          host.__paint.push([el, a, v]);
        });
      });
    }
    host.__paint.forEach(([el, a, v]) => {
      if (!P) el.style.removeProperty(a);
      else el.style.setProperty(a, this.mapHex(v, P));
    });
    /* 3) 효과(그림자·글로우) 색 — Figma 내보내기는 filter 안 feColorMatrix 의 '마지막 열'에
          색을 넣는다(예: 0.243137 0.498039 1 = #3E7FFF 파란 글로우). 여기를 안 바꾸면
          아이콘·버튼의 발광 효과만 원래 파란색으로 남는다. */
    if (!host.__fx) {
      host.__fx = [];
      host.querySelectorAll('feColorMatrix[type="matrix"]').forEach((fe) => {
        const v = (fe.getAttribute('values') || '').trim().split(/[\s,]+/).map(Number);
        if (v.length < 20 || v.some((n) => !isFinite(n))) return;
        /* 색을 통째로 칠하는 행렬만(각 행의 앞 4칸이 0) 대상으로 삼는다 */
        const solid = [0, 1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 13].every((i) => Math.abs(v[i]) < 1e-6);
        if (!solid) return;
        host.__fx.push([fe, v]);
      });
    }
    host.__fx.forEach(([fe, v]) => {
      if (!P) { fe.setAttribute('values', v.join(' ')); return; }
      const o = this.mapRGB(Math.round(v[4] * 255), Math.round(v[9] * 255), Math.round(v[14] * 255), P);
      const w = v.slice();
      w[4] = +(o[0] / 255).toFixed(6); w[9] = +(o[1] / 255).toFixed(6); w[14] = +(o[2] / 255).toFixed(6);
      fe.setAttribute('values', w.join(' '));
    });
    /* 4) 내장 래스터 이미지(배경·3D 렌더) */
    host.querySelectorAll('image').forEach((im) => {
      const cur = im.getAttribute('href') || im.getAttribute('xlink:href');
      if (!im.__origHref) im.__origHref = cur;
      const src = im.__origHref;
      if (!src) return;
      if (!P) { if (cur !== src) { im.setAttribute('href', src); im.setAttribute('xlink:href', src); } return; }
      const base = this.orig(src, () => this.schedule());
      if (!base) return;
      const url = this.repaintImage(base, P, true);
      if (url) { im.style.filter = ''; im.setAttribute('href', url); im.setAttribute('xlink:href', url); }
      else { this.canvasOK = false; im.style.filter = 'hue-rotate(' + P.d.toFixed(1) + 'deg)'; }
    });
  },
  /* 팝업(UPS 전력 상세) 시안 — SVG 가 아니라 HTML/CSS 재구축이라, 주입된 스타일시트의
     색값(#hex·rgb/rgba)을 같은 규칙으로 바꿔 끼운다. 버튼·칩 같은 액션 요소 색도 함께 따라온다. */
  skxpTint(t) {
    const st = document.getElementById('skxp-style');
    if (!st) return;
    if (st.__orig == null) st.__orig = st.textContent;
    const P = this.paramsFor(this.skxRefHue(), t);
    /* 팝업 안 이미지(UPS 장비·평면도)도 같은 규칙으로 다시 칠한다.
       (스타일시트 키 검사보다 먼저 — 팝업을 나중에 열어도 반영되도록) */
    document.querySelectorAll('.skxp-root img').forEach((im) => this.rasterTint(im, t, this.skxRefHue()));
    const key = P ? P.d.toFixed(1) + '|' + P.target.toFixed(1) + '|' + P.chromaK.toFixed(2) : '';
    if (st.__tintKey === key) return;
    st.__tintKey = key;
    if (!P) { st.textContent = st.__orig; return; }
    st.textContent = st.__orig
      .replace(/#([0-9a-f]{6})\b/gi, (m) => this.mapHex(m, P))
      .replace(/\brgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*([^)]*)\)/gi, (m, r, g, b, rest) => {
        const o = this.mapRGB(+r, +g, +b, P);
        const a = (rest || '').trim();
        return (a ? 'rgba(' : 'rgb(') + o[0] + ',' + o[1] + ',' + o[2] + (a ? ',' + a.replace(/^,\s*/, '') : '') + ')';
      });
  },
  /* ── 이천 FMS 두 시안(메인 Screen/FMS Hub · 항온항습기 상세 Screen/HVAC Detail) ──
     SVG 가 아니라 HTML/CSS 재구축이라, 주입한 스타일시트(라이트·다크·인터랙션)의 색값을 같은 규칙으로
     바꿔 끼운다. 배경 사진은 픽셀을 다시 칠하고, 한 가지 색으로 그려진 벡터 에셋은 같은 각도만큼
     색상만 돌린다. 의미가 정해진 에셋(도넛 조각·꺾은선·상태 점·경보 아이콘·로고)은 건드리지 않는다.
     두 화면은 같은 시안 계열이라 기준 hue(250)와 규칙을 공유한다. */
  icheonRefHue() { return this.hueOf('icheon-hvac.jpg', null); },
  /* ── 한진 SMART 통합관제 시안 ──
     주조색은 브랜드 파랑(#2861FF, 색상각 222°). 색을 그대로 둘 것:
       · 상태·경보 색이 곧 의미인 아이콘(단계 아이콘·마커·배지·도크 아이콘·라디오·구분선)
       · 도넛/막대/게이지 등 차트 계열색(계열을 색으로 구분한다)
       · 3D 건물 렌더와 밤하늘 배경(사진이라 색상만 돌리면 어색하다 → 픽셀을 다시 칠한다) */
  /* ── HANA Bank H.I.T 시안 ──
     주조색은 브랜드 초록(#009178, 색상각 169°). 색을 그대로 둘 것:
       · 상태·경보 색이 곧 의미인 아이콘(상태 점·배지·트렌드 화살표·단계 아이콘)
       · 도넛/막대/꺾은선 등 차트 계열색 · 로고 · 로그인 배경 사진 */
  HANA_OPT: {
    seed: '#009178', seededKey: 'wemb-hana-seeded', refHue: 169,
    keep: /(icon-widget-[\w-]+|icon-stage-[\w-]+|icon-flow-[\w-]+|icon-trend-[\w-]+|icon-action-[\w-]+|icon-field-[\w-]+|icon-nav-[\w-]+|status-[\w-]+|marker[-\d]*|badge|logo[-\w]*|divider[-\d]*|series[-\w]*|area[-\d]*|grid-line[-\d]*|axis-line[-\d]*|meter[-\w]*|track[-\d]*|arc[-\d]*|segment[-\d]*|btn-arrow-\w+)(-lt)?\.svg(\?|$)/i,
    raster: /(background|floor-plan|grid)[-\w]*\.(png|jpg)(\?|$)/i,
  },
  /* ── POSCO KDB CCTV 관제 시안 ──
     주조색은 브랜드 파랑(#004BFF, 색상각 222°). 색을 그대로 둘 것:
       · 상태·등급 색이 곧 의미인 것(전구·등급 배지·상태 칩)
       · 3D 건물 렌더와 밤하늘 배경(사진이라 색상만 돌리면 어색하다 → 픽셀을 다시 칠한다) */
  POSCO_OPT: {
    seed: '#004BFF', seededKey: 'wemb-posco-seeded', refHue: 222,
    keep: /(bulb[-\w]*|status-(critical|major|minor|warning|normal)-bg|btn-event-status-bg[-\d]*|logo-mark|icon-system-clock)(-lt)?\.svg(\?|$)/i,
    raster: /(background[-\w]*|building-image|body|click)\.(png|jpg)(\?|$)/i,
  },
  /* ── LS Electric STATCOM 시안 ──
     주조색은 브랜드 파랑(#2861FF, 색상각 224°). 색을 그대로 둘 것:
       · 상태·등급 색이 곧 의미인 것(상태 표지 marker · 등급 점 ellipse · 토글 손잡이 knob · 로고)
       · 바탕 사진과 3D 미니맵 렌더(사진이라 색상만 돌리면 어색하다 → 픽셀을 다시 칠한다) */
  LSELECTRIC_OPT: {
    seed: '#2861FF', seededKey: 'wemb-lselectric-seeded', refHue: 224,
    keep: /(marker[-\d]*|ellipse[-\d]*|knob[-\d]*|logo-mark[-\d]*|battery|plug)(-lt)?\.svg(\?|$)|(visual[-\d]*|thermal-image|chart-image[-\d]*)\.png(\?|$)/i,
    /* ↑ ACB 진단 팝업의 장비 사진(visual*) · 열화상(thermal-image) · PD 차트(chart-image*)는 색이 곧 데이터라 칠하지 않는다 */
    raster: /(background|map-image)\.(png|jpg)(\?|$)/i,
  },
  HANJIN_OPT: {
    seed: '#2861FF', seededKey: 'wemb-hanjin-seeded', refHue: 222,
    keep: /(icon-stage-[\w-]+|icon-dock-[\w-]+|icon-map-[\w-]+|icon-system-[\w-]+|icon-action-[\w-]+|marker[-\d]*|badge|radio|divider[-\d]*|bullet|data[-\d]*|bar[-\w]*|meter[-\w]*|guide-ring|logo|track[-\d]*|average-line|axis-line|grid-line[-\d]*|part[-\d]*|ramp)(-lt)?\.svg(\?|$)/i,
    raster: /(base|building-image)\.png(\?|$)/i,
  },
  /* 이 시안의 '기본 색' — 시안 안에서 실제로 쓰인 브랜드 보라들의 평균 색상각(250°)에 맞춘 값이다.
     (#6059E5 243 · #4747B9 240 · #9773EC 258 · #A37CFF 258 · #7B51D8 259 → 평균 ≈ 250)
     템플릿을 처음 열 때 '색 정하기'의 시작값을 이 색으로 놓아, 시안이 원래 색 그대로 보이게 한다. */
  ICHEON_SEED: '#7B61FF',
  /* 색을 그대로 두는(의미가 정해진) 에셋 — 두 화면 공통 */
  ICHEON_KEEP: /(arc|lines?|line-series[-\d]*|dot|dot-\d|status-dot[-\d]*|icon-callout-[a-z]+|icon|icon-\d|icon-trend-\w+|icon-widget-\w+|icon-action-\w+|logo|point|chart-\d+|needle|marker[-\d]*|radio)\.svg(\?|$)/i,
  ICHEON_RASTER: /(base|overlay[-\d]*|hero-image|header)\.png(\?|$)/i,
  /* roots: 화면 루트들 · sheets: 그 화면에 주입한 스타일시트 id · modeKey: 고른 밝기를 기억할 키
     opt: 시안마다 다른 값 — seed(시작색) · seededKey(시드 저장 키) · keep/raster(색을 그대로 둘 에셋) · refHue
     (기본값은 SK하이닉스 이천 FMS. 한진 시안은 opt 로 갈아 끼운다) */
  icheonTint(t, mode, sel, sheets, modeKey, opt) {
    const O = opt || {};
    const SEED = O.seed || this.ICHEON_SEED;
    const SEEDED = O.seededKey || 'wemb-icheon-seeded';
    const KEEP = O.keep || this.ICHEON_KEEP;
    const RASTER = O.raster || this.ICHEON_RASTER;
    const REFHUE = O.refHue != null ? O.refHue : this.icheonRefHue();
    const roots = document.querySelectorAll(sel);
    if (!roots.length) return;
    /* 화면 테마(다크/라이트)는 앱의 밝기 토글을 그대로 따라간다 */
    const dark = mode === 'dark';
    roots.forEach((r) => { r.dataset.theme = dark ? 'dark' : 'light'; });
    try { localStorage.setItem(modeKey, dark ? 'dark' : 'light'); } catch (e) {}

    /* ── '시안 원본 색' 상태면 아예 칠하지 않는다 ──
       템플릿을 처음 열면 색 시작값을 시안의 브랜드 색으로 놓는다(seedIcheonBaseColor).
       그 값이 그대로인 동안은 Figma 원본 색을 그대로 보여 주고, 사용자가 '색 정하기'에서
       색·이미지·프리셋을 바꾸거나 미세조정을 하면 그때부터 팔레트를 따라 칠한다.
       판정 기준은 시드(state.seed)다 — 팔레트에서 나온 --point-main 은 라이트/다크에 따라
       값이 달라져서 '안 바꿨다'의 기준으로 쓸 수 없다. */
    let atBase = false;
    try {
      atBase = !!localStorage.getItem(SEEDED)
        && typeof state !== 'undefined'
        && (state.source || 'seed') === 'seed'
        && String(state.seed || '').toLowerCase() === SEED.toLowerCase()
        && !(state.overrides && Object.keys(state.overrides).length);
    } catch (e) {}

    const P = atBase ? null : this.paramsFor(REFHUE, t);
    const key = P ? P.d.toFixed(1) + '|' + P.target.toFixed(1) + '|' + P.chromaK.toFixed(2) : 'base';
    /* 화면 시트(라이트)·다크 시트·인터랙션 시트를 함께 바꾼다 —
       활성 알약 그라디언트·호버색·포커스 링처럼 '움직일 때만 보이는 색'도 같은 팔레트를 따라야 한다. */
    sheets.forEach((id) => {
      const st = document.getElementById(id);
      if (!st) return;
      if (st.__orig == null) st.__orig = st.textContent;
      if (st.__tintKey === key) return;
      st.__tintKey = key;
      if (!P) { st.textContent = st.__orig; return; }
      st.textContent = st.__orig
        /* 6자리·3자리 hex 를 함께 잡는다(#666·#fff 같은 축약형이 이 시안에 많다) */
        .replace(/#([0-9a-f]{6}|[0-9a-f]{3})\b(?![0-9a-f])/gi, (m) => {
          const h = m.length === 4 ? '#' + m[1] + m[1] + m[2] + m[2] + m[3] + m[3] : m;
          return this.mapHex(h, P);
        })
        .replace(/\brgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*([^)]*)\)/gi, (m, r, g, b, rest) => {
          const o = this.mapRGB(+r, +g, +b, P);
          const a = (rest || '').trim();
          return (a ? 'rgba(' : 'rgb(') + o[0] + ',' + o[1] + ',' + o[2] + (a ? ',' + a.replace(/^,\s*/, '') : '') + ')';
        });
    });
    /* 이미지 — 큰 배경/장비 사진만 픽셀을 다시 칠하고(색이 정확히 옮겨진다),
       단색 계열 벡터는 색상만 돌린다(래스터로 바꾸면 확대 시 흐려진다). */
    const deg = P ? P.d : 0;
    roots.forEach((r) => {
      r.querySelectorAll('img').forEach((im) => {
        const src = im.__origSrc || im.getAttribute('src') || '';
        /* 원본 색 상태 — 다시 칠한 그림이 있으면 원본 파일로 되돌린다 */
        if (!P) {
          im.style.filter = '';
          im.__tintKey = '';
          if (im.__origSrc && im.getAttribute('src') !== im.__origSrc) im.src = im.__origSrc;
          return;
        }
        if (RASTER.test(src)) { this.rasterTint(im, t, REFHUE); return; }
        if (KEEP.test(src)) { im.style.filter = ''; return; }
        im.style.filter = Math.abs(deg) > 1 ? 'hue-rotate(' + deg.toFixed(1) + 'deg)' : '';
      });
      /* 라이브가 움직이려고 <img> 를 인라인 <svg class="ls-inl"> 로 바꿔 넣은 원본 벡터(LS 계통·에너지 차트) —
         그림은 같으니 같은 규칙으로 색상만 돌린다(원래 파일 이름은 data-src 에 있다) */
      r.querySelectorAll('svg.ls-inl').forEach((sv) => {
        const src = sv.getAttribute('data-src') || '';
        sv.style.filter = (!P || KEEP.test(src) || Math.abs(deg) <= 1) ? '' : 'hue-rotate(' + deg.toFixed(1) + 'deg)';
      });
    });
  },
  apply() {
    const t = this.target();
    const main = document.querySelector('.main');
    const mode = (main && main.getAttribute('data-mode')) || 'dark';
    document.querySelectorAll('.tplimg-shot, .hj-studioimg').forEach((im) => this.rasterTint(im, t));
    document.querySelectorAll('.skx-screen').forEach((scr) => this.skxTint(scr, t, mode));
    this.skxpTint(t);
    this.icheonTint(t, mode, '.skh-root', ['skh-style', 'skh-dark-style', 'skh-live-style', 'icheon-link-style'], 'wemb-skh-mode');
    this.icheonTint(t, mode, '.skv-root', ['skv-style', 'skv-dark-style', 'skv-live-style', 'icheon-link-style'], 'wemb-skv-mode');
    /* 한진 화면 3장 — 같은 방식(시안 원본 색이면 그대로, 색을 바꾸면 팔레트를 따라 칠한다).
       화면 세 장이 같은 밝기·같은 색을 공유하므로 modeKey 도 하나로 쓴다. */
    /* HANA Bank H.I.T 화면 15장 — 같은 방식(시안 원본 색이면 그대로, 색을 바꾸면 팔레트를 따라 칠한다) */
    ['hno2', 'hnc1', 'hnc2', 'hnm', 'hni1', 'hni2', 'hne', 'hnn1', 'hnn2', 'hnn3', 'hnf', 'hns1', 'hns2', 'hnl'].forEach((px) => {
      this.icheonTint(t, mode, '.' + px + '-root',
        [px + '-style', px + '-light-style', 'hana-live-style'], 'wemb-hana-mode', this.HANA_OPT);
    });
    /* POSCO KDB CCTV 관제 화면 6장 — 같은 방식(시안 원본 색이면 그대로, 색을 바꾸면 팔레트를 따라 칠한다).
       여섯 장이 같은 밝기·같은 색을 공유하므로 modeKey(wemb-posco-mode)도 하나로 쓴다. */
    ['pkm', 'pka', 'pko', 'pkr', 'pkf', 'pkd', 'pks1', 'pks2', 'pks3', 'pks4'].forEach((px) => {   /* pks1~3 = SOP STEP 1~3 · pks4 = SOP 체계도 */
      this.icheonTint(t, mode, '.' + px + '-root',
        [px + '-style', px + '-light-style', 'posco-live-style'], 'wemb-posco-mode', this.POSCO_OPT);
    });
    /* LS Electric STATCOM 화면 2장 — 같은 방식. 두 장이 같은 밝기를 공유한다(wemb-lselectric-mode) */
    ['lsm', 'lsd', 'lsa', 'lsy', 'lse'].forEach((px) => {      /* lsa·lsy·lse = ACB·계통·에너지 진단 팝업(.lsm-root 안에 겹쳐 있다) */
      this.icheonTint(t, mode, '.' + px + '-root',
        [px + '-style', px + '-light-style', 'lselectric-live-style'], 'wemb-lselectric-mode', this.LSELECTRIC_OPT);
    });
    ['hjc', 'hjg', 'hju'].forEach((px) => {
      this.icheonTint(t, mode, '.' + px + '-root',
        [px + '-style', px + '-light-style', 'hanjin-live-style'], 'wemb-hanjin-mode', this.HANJIN_OPT);
    });
    try { TPLLOGO.apply(); } catch (e) {}
  },
  /* 색을 고르는 동안 매 입력마다 다시 칠하지 않도록 잠깐 모아서 처리 */
  schedule() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { try { this.apply(); } catch (e) {} }, 140);
  },
};
window.__applyTplTint = () => { try { TPLTINT.schedule(); } catch (e) {} };
/* 콘솔에서 __tplTintStatus() 로 지금 시안에 색이 어떻게 적용됐는지 확인할 수 있다 */
window.__tplTintStatus = () => {
  const t = TPLTINT.target();
  const shots = [...document.querySelectorAll('.tplimg-shot, .hj-studioimg')].map((im) => ({
    원본: im.__origSrc, 적용: im.src.indexOf('data:') === 0 ? '다시 칠함' : im.style.filter ? '색상회전(' + im.style.filter + ')' : '없음',
  }));
  const skx = document.querySelector('.skx-svg');
  return {
    방식: TPLTINT.canvasOK ? '팔레트 다시 칠하기' : '색상 회전(캔버스 제한 — file:// 로 연 경우)',
    기준색: t ? 'h' + Math.round(t.h) + ' s' + Math.round(t.s) : null,
    시안: shots,
    skhynix: skx ? { 색변수: skx.style.length, 하드코딩색: (skx.__paint || []).length, 효과색: (skx.__fx || []).length } : null,
    팝업: document.getElementById('skxp-style') ? '연결됨' : '없음',
  };
};
window.__refreshTpl = () => { try { TPLLOGO.apply(); } catch (e) {} try { TPLTINT.schedule(); } catch (e) {} };
