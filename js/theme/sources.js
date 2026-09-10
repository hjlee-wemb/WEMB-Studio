/* ── 색 소스 — 랜덤 · 시드 · 팬톤 · 컬러 모음 · 이미지 추출 ── */

/* 모든 색상 소스 아코디언·미세조정 토글을 접음 */
function closeAllToggles() {
  document.querySelectorAll('.colorset .acc, .colorset details.more').forEach((d) => (d.open = false));
}
document.getElementById('rand').onclick = () => {
  const h = Math.floor(Math.random() * 360),
    s = 55 + Math.random() * 35,
    l = 45 + Math.random() * 15;
  state.seed = hslToHex(h, s, l);
  state.subHex = null;
  state.mapMode = 'auto';
  setSource('seed');
  apply();
  closeAllToggles(); /* 랜덤 생성 시 열려 있던 토글 모두 닫기 */
};

/* 추출 방식(자동 조화 / 원본 색 그대로) UI 동기화 */
function syncExtractUI(mode) {
  document.querySelectorAll('#extractMode button').forEach((x) => x.classList.toggle('on', x.dataset.x === mode));
  document.getElementById('extractHint').textContent =
    mode === 'direct'
      ? '사진 속 색을 그대로 가져와 배경·글자·강조에 배치해요. 분위기는 살지만 대비가 약할 수 있어요.'
      : '사진에서 대표색 하나를 골라, 서로 잘 어울리는 팔레트를 자동으로 만들어요.';
}

function applySeed(seed, mode) {
  state.seed = seed;
  state.mode = mode;
  state.subHex = null;
  state.mapMode = 'auto';
  syncExtractUI('auto');
  document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === mode));
  setSource('preset');
  apply();
}

/* ===== Pantone Color of the Year by year (+ companion trend tones) ===== */
const PANTONE = {
  2026: {
    coty: { n: 'Cloud Dancer', code: 'PANTONE 11-4201', c: '#F0EEE9', seed: '#C2B4A0', mode: 'light' },
    comp: [
      { n: 'Butter Yellow', c: '#F3D58D', seed: '#E9B84A', mode: 'light' },
      { n: 'Terracotta', c: '#C56A4A', seed: '#C56A4A', mode: 'light' },
      { n: 'Sage Green', c: '#A3B18A', seed: '#8FA876', mode: 'dark' },
      { n: 'Dusty Blue', c: '#7E9CB5', seed: '#6E93B5', mode: 'dark' },
    ],
  },
  2025: {
    coty: { n: 'Mocha Mousse', code: 'PANTONE 17-1230', c: '#A47864', seed: '#A47864', mode: 'dark' },
    comp: [
      { n: 'Warm Taupe', c: '#B9A48E', seed: '#B9A48E', mode: 'light' },
      { n: 'Olive', c: '#7A7A52', seed: '#7A7A52', mode: 'dark' },
      { n: 'Brick', c: '#9E4A3A', seed: '#9E4A3A', mode: 'dark' },
    ],
  },
  2024: {
    coty: { n: 'Peach Fuzz', code: 'PANTONE 13-1023', c: '#FFBE98', seed: '#F0A57E', mode: 'light' },
    comp: [
      { n: 'Soft Coral', c: '#F08A6B', seed: '#F08A6B', mode: 'light' },
      { n: 'Sky', c: '#8FB6D6', seed: '#7FA9CE', mode: 'dark' },
      { n: 'Cream', c: '#F3E2CE', seed: '#D9B68F', mode: 'light' },
    ],
  },
  2023: {
    coty: { n: 'Viva Magenta', code: 'PANTONE 18-1750', c: '#BB2649', seed: '#BB2649', mode: 'dark' },
    comp: [
      { n: 'Magenta Pink', c: '#D84A6B', seed: '#D84A6B', mode: 'dark' },
      { n: 'Plum', c: '#7A2E4A', seed: '#7A2E4A', mode: 'dark' },
      { n: 'Blush', c: '#E8B0B8', seed: '#D98594', mode: 'light' },
    ],
  },
  2022: {
    coty: { n: 'Very Peri', code: 'PANTONE 17-3938', c: '#6667AB', seed: '#6667AB', mode: 'dark' },
    comp: [
      { n: 'Periwinkle', c: '#8E8FD0', seed: '#8E8FD0', mode: 'dark' },
      { n: 'Lavender', c: '#B7B0E0', seed: '#9A93D6', mode: 'light' },
      { n: 'Indigo', c: '#3E3F73', seed: '#4A4B85', mode: 'dark' },
    ],
  },
};
const trendEl = document.getElementById('trend'),
  yearSel = document.getElementById('trendYear');
Object.keys(PANTONE)
  .sort((a, b) => b - a)
  .forEach((y) => {
    const o = document.createElement('option');
    o.value = y;
    o.textContent = y;
    yearSel.appendChild(o);
  });
function renderTrend(year) {
  const y = PANTONE[year];
  trendEl.innerHTML = '';
  [{ ...y.coty, coty: true }, ...y.comp].forEach((t) => {
    const el = document.createElement('button');
    el.className = 'trendchip' + (t.coty ? ' coty' : '');
    el.title = t.n + (t.code ? ' · ' + t.code : '');
    el.innerHTML = `<i style="background:${t.c}"></i><span>${t.n}</span>${t.code ? `<span class="pcode">${t.code.replace('PANTONE ', '')}</span>` : `<span class="yr">trend</span>`}`;
    el.onclick = () => {
      applySeed(t.seed, t.mode);
      markPreset(el);
    };
    trendEl.appendChild(el);
  });
}
yearSel.onchange = (e) => renderTrend(e.target.value);
renderTrend('2026');

/* ===== Color Hunt 인기 팔레트 (colorhunt.co/palettes/popular 엄선, 4색) =====
   다크/라이트는 평균 밝기로 자동 분류되어 갤러리 탭(다크 추천/라이트 추천)에 나뉘어 표시됨. */
const PALETTES = [
  { n: 'Charcoal Teal', c: ['#222831', '#393E46', '#00ADB5', '#EEEEEE'] },
  { n: 'Ocean Ink', c: ['#F9F7F7', '#DBE2EF', '#3F72AF', '#112D4E'] },
  { n: 'Coral Navy', c: ['#364F6B', '#3FC1C9', '#F5F5F5', '#FC5185'] },
  { n: 'Forest Night', c: ['#0F0F0F', '#232D3F', '#005B41', '#008170'] },
  { n: 'Sunset Ember', c: ['#0B192C', '#1E3E62', '#FF6500', '#F5F5F5'] },
  { n: 'Deep Pine', c: ['#2C3333', '#2E4F4F', '#0E8388', '#CBE4DE'] },
  { n: 'Neon Grape', c: ['#211951', '#836FFF', '#15F5BA', '#F0F3FF'] },
  { n: 'Mocha Cream', c: ['#F8EDE3', '#DFD3C3', '#D0B8A8', '#8D7B68'] },
  { n: 'Espresso', c: ['#1A120B', '#3C2A21', '#D5CEA3', '#E5E5CB'] },
  { n: 'Slate Mist', c: ['#27374D', '#526D82', '#9DB2BF', '#DDE6ED'] },
  { n: 'Cotton Candy', c: ['#FFB6B9', '#FAE3D9', '#BBDED6', '#8AC6D1'] },
  { n: 'Warm Clay', c: ['#7F5539', '#B08968', '#DDB892', '#EDE0D4'] },
  { n: 'Muted Plum', c: ['#22223B', '#4A4E69', '#9A8C98', '#C9ADA7'] },
  { n: 'Electric Pop', c: ['#F72585', '#7209B7', '#3A0CA3', '#4361EE'] },
  { n: 'Crimson Slate', c: ['#2B2D42', '#8D99AE', '#EDF2F4', '#EF233C'] },
  { n: 'Olive Sand', c: ['#606C38', '#283618', '#FEFAE0', '#DDA15E'] },
  { n: 'Fire Sunset', c: ['#003049', '#D62828', '#F77F00', '#FCBF49'] },
  { n: 'Amber Deep', c: ['#04293A', '#064663', '#ECB365', '#FFFFFF'] },
  { n: 'Citrus Teal', c: ['#F5F5F5', '#FF9F1C', '#2EC4B6', '#011627'] },
  { n: 'Midnight Steel', c: ['#0D1B2A', '#1B263B', '#415A77', '#E0E1DD'] },
  { n: 'Pastel Dream', c: ['#CDB4DB', '#FFC8DD', '#FFAFCC', '#BDE0FE'] },
  { n: 'Forest Lime', c: ['#191A19', '#1E5128', '#4E9F3D', '#D8E9A8'] },
  { n: 'Periwinkle', c: ['#F0F3FF', '#DFE3FA', '#B4B4FF', '#5D5FEF'] },
  { n: 'Gold Noir', c: ['#FFFFFF', '#FFD369', '#393E46', '#222831'] },
  { n: 'Mauve Rose', c: ['#331D2C', '#3F2E3E', '#A78295', '#EFE1D1'] },
  { n: 'Mustard Deep', c: ['#EAE7B1', '#E6B325', '#7C7C3A', '#0B2027'] },
  { n: 'Teal Stone', c: ['#12343B', '#2D5D62', '#CDC6AE', '#E8E4C9'] },
  { n: 'Blush Pink', c: ['#F6F5F5', '#FBBECD', '#F1929C', '#FA5075'] },
  { n: 'Rose Quartz', c: ['#FFF2F2', '#FFE2E2', '#FFC7C7', '#8785A2'] },
  { n: 'Sage Grove', c: ['#DAD7CD', '#A3B18A', '#588157', '#344E41'] },
  { n: 'Sky Serenity', c: ['#F1FAEE', '#A8DADC', '#457B9D', '#1D3557'] },
  { n: 'Peach Fuzz', c: ['#FFCDB2', '#FFB4A2', '#E5989B', '#B5838D'] },
  { n: 'Lavender Fields', c: ['#E0AAFF', '#C77DFF', '#9D4EDD', '#5A189A'] },
  { n: 'Autumn Spice', c: ['#582F0E', '#7F4F24', '#936639', '#A68A64'] },
  { n: 'Cyber Lime', c: ['#131313', '#00FF9C', '#B6FFA1', '#E4FF3F'] },
  { n: 'Berry Wine', c: ['#4A1C40', '#7A3B69', '#C06C84', '#F8B195'] },
  { n: 'Arctic Blue', c: ['#CAF0F8', '#90E0EF', '#00B4D8', '#0077B6'] },
  { n: 'Graphite', c: ['#EAEAEA', '#CBCBCB', '#7D7D7D', '#212121'] },
  { n: 'Terracotta', c: ['#264653', '#E76F51', '#F4A261', '#E9C46A'] },
  { n: 'Cocoa Mint', c: ['#1B4332', '#2D6A4F', '#40916C', '#95D5B2'] },
];
/* 컬러 모음이 다크/라이트 중 어느 모드로 적용될지 — 평균 밝기로 판정(applyPalette와 동일 기준) */
function paletteMode(hexes) {
  const avgL = hexes.reduce((a, h) => a + rgbToHsl(hexToRgb(h)).l, 0) / hexes.length;
  return avgL > 55 ? 'light' : 'dark';
}
function applyPalette(hexes) {
  const cols = hexes.map((h) => {
    const c = hexToRgb(h);
    const hsl = rgbToHsl(c);
    return { r: c.r, g: c.g, b: c.b, h: hsl.h, s: hsl.s, l: hsl.l, n: 1, score: (hsl.s / 100) * (1 - Math.abs(hsl.l - 55) / 100) };
  });
  state.imgCols = cols;
  state.mapMode = 'direct';
  state.mode = paletteMode(hexes);
  state.subHex = null;
  syncExtractUI('direct');
  document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === state.mode));
  setSource('preset');
  apply();
}
const galleryEl = document.getElementById('gallery');
PALETTES.forEach((p) => {
  const el = document.createElement('button');
  el.className = 'pcard';
  el.title = p.n;
  const pm = paletteMode(p.c);
  el.dataset.pm = pm;
  el.innerHTML = `<div class="pcardtop"><div class="circles">${p.c.map((c) => `<i style="background:${c}"></i>`).join('')}</div><span class="pmode pmode-${pm}"><i></i>${pm === 'light' ? '라이트' : '다크'}</span></div><span class="pname">${p.n}</span>`;
  el.onclick = () => {
    applyPalette(p.c);
    markPreset(el);
  };
  galleryEl.appendChild(el);
});
/* 컬러 모음 탭(다크/라이트) + 페이지네이션 — 한 페이지에 8개씩, 넘치면 다음으로 */
const GAL_PER = 8;
let galleryFilter = 'dark';
let galleryPage = 0;
function renderGalleryPage() {
  const all = [...galleryEl.querySelectorAll('.pcard')];
  const matches = all.filter((el) => el.dataset.pm === galleryFilter);
  const pages = Math.max(1, Math.ceil(matches.length / GAL_PER));
  galleryPage = Math.min(Math.max(0, galleryPage), pages - 1);
  const start = galleryPage * GAL_PER;
  all.forEach((el) => (el.style.display = 'none'));
  matches.slice(start, start + GAL_PER).forEach((el) => (el.style.display = ''));
  const pos = document.getElementById('galPos');
  if (pos) pos.textContent = galleryPage + 1 + ' / ' + pages;
  const prev = document.getElementById('galPrev'),
    next = document.getElementById('galNext'),
    pager = document.getElementById('galPager');
  if (prev) prev.disabled = galleryPage <= 0;
  if (next) next.disabled = galleryPage >= pages - 1;
  if (pager) pager.style.display = pages > 1 ? '' : 'none';
}
function filterGallery(mode) {
  galleryFilter = mode;
  galleryPage = 0;
  renderGalleryPage();
}
document.querySelectorAll('#galleryMode button').forEach(
  (b) =>
    (b.onclick = () => {
      document.querySelectorAll('#galleryMode button').forEach((x) => x.classList.toggle('on', x === b));
      filterGallery(b.dataset.gm);
    })
);
{
  const prev = document.getElementById('galPrev'),
    next = document.getElementById('galNext');
  if (prev)
    prev.onclick = () => {
      galleryPage--;
      renderGalleryPage();
    };
  if (next)
    next.onclick = () => {
      galleryPage++;
      renderGalleryPage();
    };
}
filterGallery('dark');

/* ===== theme from image ===== */
function extractTheme(img) {
  /* 사진 전체를 종횡비 그대로 축소해 골고루 표본 추출(가운데만 보지 않음) */
  const maxSide = 128;
  const iw = img.naturalWidth || img.width || 1;
  const ih = img.naturalHeight || img.height || 1;
  const scale = Math.min(1, maxSide / Math.max(iw, ih));
  const cw = Math.max(1, Math.round(iw * scale));
  const ch = Math.max(1, Math.round(ih * scale));
  const c = document.createElement('canvas');
  c.width = cw;
  c.height = ch;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, cw, ch);
  const d = ctx.getImageData(0, 0, cw, ch).data;
  const map = {};
  let lumSum = 0,
    cnt = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue;
    const r = d[i],
      g = d[i + 1],
      b = d[i + 2];
    lumSum += 0.299 * r + 0.587 * g + 0.114 * b;
    cnt++;
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    if (!map[key]) map[key] = { r: 0, g: 0, b: 0, n: 0 };
    const o = map[key];
    o.r += r;
    o.g += g;
    o.b += b;
    o.n++;
  }
  const toHex = (o) => {
    const t = (x) => Math.round(x).toString(16).padStart(2, '0');
    return `#${t(o.r)}${t(o.g)}${t(o.b)}`;
  };
  const cols = Object.values(map).map((o) => {
    const c = { r: o.r / o.n, g: o.g / o.n, b: o.b / o.n, n: o.n };
    const hsl = rgbToHsl(c);
    c.h = hsl.h;
    c.s = hsl.s;
    c.l = hsl.l;
    /* 전체 이미지에서 '넓게 차지하는 색'이 대표색이 되도록 면적(n) 가중을 크게,
       채도는 완만한 하한(0.25)만 두어 작은 원색 얼룩이 대표색을 가로채지 않게 함 */
    c.score = Math.pow(o.n, 0.8) * (0.25 + 0.75 * (hsl.s / 100)) * (1 - Math.abs(hsl.l - 55) / 100);
    return c;
  });
  if (!cols.length) return { seed: '#4f6ce0', sub: null, mode: 'dark' };
  cols.sort((a, b) => b.score - a.score);
  const seed = cols[0];
  const seedH = seed.h;
  let sub = null;
  for (const o of cols.slice(0, 10)) {
    const dh = Math.abs(((o.h - seedH + 540) % 360) - 180);
    if (o.s > 22 && dh > 40) {
      sub = o;
      break;
    }
  }
  return { seed: toHex(seed), sub: sub ? toHex(sub) : null, mode: lumSum / cnt / 255 > 0.55 ? 'light' : 'dark', cols };
}
document.getElementById('imgfile').onchange = (e) => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  const dot = f.name.lastIndexOf('.');
  const ext = dot > -1 ? f.name.slice(dot + 1).toUpperCase() : '';
  const nameEl = document.getElementById('imgname');
  /* 큰 사진은 디코딩·색 분석에 시간이 걸림 — 무반응처럼 보이지 않게 즉시 로딩 표시 */
  nameEl.innerHTML = `<span class="spin" aria-hidden="true"></span>사진 분석 중…`;
  const url = URL.createObjectURL(f);
  const img = new Image();
  img.onload = () => {
    /* 스피너가 먼저 그려지도록 분석을 다음 틱으로 미룸 */
    setTimeout(() => {
      const t = extractTheme(img);
      state.seed = t.seed;
      state.mode = t.mode;
      state.subHex = t.sub;
      state.imgCols = t.cols;
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === t.mode));
      setSource('image');
      apply();
      nameEl.innerHTML = `${f.name}${ext ? ` · <b>${ext}</b>` : ''}`;
      document.getElementById('imgprev').innerHTML =
        `<img src="${url}" alt=""><div class="sws"><i style="background:${t.seed}" title="${t.seed}"></i>${t.sub ? `<i style="background:${t.sub}" title="${t.sub}"></i>` : ''}</div><span class="ihint">${t.mode === 'light' ? '라이트' : '다크'} 추출됨</span>`;
    }, 30);
  };
  img.onerror = () => {
    nameEl.innerHTML = '';
    URL.revokeObjectURL(url);
    toast('이미지를 열지 못했어요. 다른 사진(JPG·PNG 등)으로 시도해 주세요.', { type: 'err' });
  };
  img.src = url;
};
/* 추출 방식 선택 + fine-tune sliders */
document.querySelectorAll('#extractMode button').forEach(
  (b) =>
    (b.onclick = () => {
      const hasImg = document.getElementById('imgprev').children.length > 0;
      state.mapMode = b.dataset.x;
      syncExtractUI(b.dataset.x);
      if (hasImg) setSource('image');
      apply();
    })
);
['adjH', 'adjS', 'adjL'].forEach(
  (id) =>
    (document.getElementById(id).oninput = () => {
      if (state.source !== 'seed') return; /* 기준 색에서만 미세 조정 가능 */
      state.adjust = { h: +document.getElementById('adjH').value, s: +document.getElementById('adjS').value, l: +document.getElementById('adjL').value };
      apply();
    })
);
document.getElementById('adjReset').onclick = () => {
  if (state.source !== 'seed') return;
  resetAdjust();
  apply();
};
