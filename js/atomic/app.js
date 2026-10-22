/* ── 분자 라이브러리 — 홈 안의 한 페이지 ──
   주소: #/molecules (분자) · #/molecules/m/:id (분자 정의) · #/molecules/screens (조립 화면) · #/molecules/s/:id (화면 편집)
   아토믹 5단계: #/molecules/atoms (원자) · /organisms · /o/:id (유기체) · /templates · /t/:id (템플릿 = 화면 틀) · /pages · /p/:id (페이지 = 원본 화면)
   데이터는 wemb-atomic 로컬 서버(/api)가 준다. 서버 없이 열린 경우(GitHub Pages 등)에는 미리 뽑아 둔 파일(src/atomic/)로 보고,
   저장은 이 브라우저에만 남는다(static-api.js).
   분자 · 페이지는 섀도 DOM 으로 그려 홈 스타일과 섞이지 않는다. */
import { api, apiMode, globalsCssUrl } from './api.js';
import { ROLE_TOKENS, TOKEN_LABELS } from './theme.js';
import { loadVariants, variant, mountMolecule, mountTemplate, mountSection, mountPage, measureTemplate, registerMolecules } from './render.js';
import { STATES, STATE_LABELS, STATE_COLORS } from './states.js';
import { doc, rank, hitNote } from './search.js';
import { snapshot, download } from './snapshot.js';

const P = {
  lib: '/molecules',
  mol: (id) => '/molecules/m/' + encodeURIComponent(id),
  screens: '/molecules/screens',
  screen: (id) => '/molecules/s/' + encodeURIComponent(id),
  verify: '/molecules/verify',
  names: '/molecules/names',
  atoms: '/molecules/atoms',
  organisms: '/molecules/organisms',
  org: (id) => '/molecules/o/' + encodeURIComponent(id),
  templates: '/molecules/templates',
  tpl: (id) => '/molecules/t/' + encodeURIComponent(id),
  pages: '/molecules/pages',
  page: (id) => '/molecules/p/' + encodeURIComponent(id),
};
const go = (path) => window.WEMB.router.navigate(path);

const S = {
  ready: null, offline: false,
  lib: null, molecules: new Map(), templates: new Map(), templateData: new Map(),
  defs: {}, measures: {},
  theme: loadTheme(),
  size: (() => { try { return localStorage.getItem('wemb-atomic-size') === 'real' ? 'real' : 'fit'; } catch (e) { return 'fit'; } })(),
  filter: { q: '', family: '', cat: '' },
  nfilter: { show: 'review', family: '', q: '' },
  levels: null, // 유기체 · 템플릿 · 페이지 구성 · 원자(분자에서 옮긴 조각 · 아이콘 · 그림) — api/levels
  afilter: { tab: 'part', family: '', ctx: '', q: '' },
  ofilter: { q: '', family: '', cat: '', where: '' },
};
// 원자 · 분자 · 유기체 검색어는 하나다 — 단계를 옮겨도 찾던 말이 그대로 남는다(단계를 몰라도 찾을 수 있게)
S.q = '';
for (const f of [S.filter, S.afilter, S.ofilter]) { delete f.q; Object.defineProperty(f, 'q', { get: () => S.q, set: (v) => { S.q = v; }, enumerable: true }); }
const esc = (s) => String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

function loadTheme() {
  try { const t = JSON.parse(localStorage.getItem('wemb-atomic-theme')); if (t && (t.mode === 'dark' || t.mode === 'light')) return t; } catch (e) {}
  return { mode: 'dark', seed: null };
}
function saveTheme() { try { localStorage.setItem('wemb-atomic-theme', JSON.stringify(S.theme)); } catch (e) {} }

/* 홈의 알림 · 확인 대화상자를 그대로 쓴다 (js/ui/toast.js · confirm.js) */
const note = (message, type = 'ok') => {
  if (typeof window.toast === 'function') window.toast(esc(message), { type });
  else console.log(message);
};
const fail = (error) => { console.error(error); note(error.message || String(error), 'err'); };
const confirmDanger = async (title, body) => (typeof window.askConfirm === 'function'
  ? window.askConfirm({ title, body: esc(body), confirmLabel: '삭제', irreversible: true })
  : window.confirm(title));

const latestOf = (mid) => S.defs[mid]?.versions?.at(-1)?.version || '1.0.0';
const versionsOf = (mid) => S.defs[mid]?.versions || [];
const versionObj = (mid, ver) => versionsOf(mid).find((v) => v.version === ver) || null;
const versionMap = () => new Map(Object.entries(S.defs).map(([k, v]) => [k, v.versions]));
const cmpVer = (a, b) => { const x = a.split('.').map(Number), y = b.split('.').map(Number); return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]; };

function boot() {
  if (!S.ready) {
    S.ready = (async () => {
      const [lib, defs, measures] = await Promise.all([api('api/library'), api('api/definitions'), api('api/measure')]);
      S.lib = lib; S.defs = defs; S.measures = measures;
      lib.molecules.forEach((m) => S.molecules.set(m.id, m));
      lib.templates.forEach((t) => S.templates.set(t.id, t));
      registerMolecules(S.molecules); // 문맥 그리기(원래 화면 안에서 잘라 보여 주기)에 쓴다
      // 분자 · 템플릿이 쓰는 폰트(@font-face · @import)는 섀도 DOM 안에서 먹지 않아 문서에 한 번 싣는다
      if (!document.getElementById('atmGlobals')) {
        const link = document.createElement('link');
        link.id = 'atmGlobals'; link.rel = 'stylesheet'; link.href = await globalsCssUrl();
        document.head.append(link);
      }
    })().catch((e) => { S.ready = null; throw e; });
  }
  return S.ready;
}

async function templateData(id) {
  if (!S.templateData.has(id)) S.templateData.set(id, api('api/templates/' + id));
  return S.templateData.get(id);
}
/** 분자 크기 — 원래 템플릿에서 잰 상자. 없으면 그 템플릿을 한 번 재고 서버에 남긴다. */
let measuring = Promise.resolve();
function ensureMeasured(templateIds, onProgress) {
  const missing = [...new Set(templateIds)].filter((id) => !S.measures[id]);
  if (!missing.length) return Promise.resolve();
  measuring = measuring.then(async () => {
    let n = 0;
    for (const id of missing) {
      if (S.measures[id]) { n++; continue; }
      const t = await templateData(id);
      try { S.measures[id] = await measureTemplate(t, S.molecules); }
      catch (e) { console.warn('측정 실패', id, e); S.measures[id] = { boxes: {} }; } // 한 장이 실패해도 나머지는 잰다
      onProgress?.(++n, missing.length, t.name);
    }
  });
  return measuring;
}
function boxFor(variantId) {
  const use = variant(variantId)?.uses?.[0];
  return use ? S.measures[use.template]?.boxes?.[use.instance] : null;
}

/* ── 썸네일 ── */
/** mount(inner) 가 그린 것을 칸 크기에 맞춰 줄여 보여 준다. 돌려받은 크기가 0 이면 그리지 못한 것 */
async function thumbMount(host, mount, { maxW, maxH, minScale = 0 }) {
  const inner = host.querySelector('.mhost') || host.appendChild(h('<div class="mhost"></div>'));
  const size = await mount(inner);
  if (!(size?.width > 0 && size?.height > 0)) return null;
  inner.style.width = size.width + 'px'; inner.style.height = size.height + 'px';
  host._atmThumb = { w: size.width, h: size.height, maxW, maxH, minScale };
  host.dataset.px = Math.round(size.width) + '×' + Math.round(size.height);
  fitThumb(host);
  thumbRO.observe(host); // 칸 크기가 바뀌면(창 폭 변경 · 사이드바 접힘) 배율을 다시 잡는다
  return size;
}
async function thumb(host, molecule, variantId, { maxW, maxH, version = null, values, theme = S.theme, minScale = 0 }) {
  await loadVariants([variantId]);
  const box = boxFor(variantId);
  return thumbMount(host, (inner) => mountMolecule(inner, { molecule, variantId, version, values, theme, box }), { maxW, maxH, minScale });
}
/** 썸네일을 지운다 — 화면 밖으로 멀리 나간 페이지 · 유기체 그림(페이지 한 장씩 통째로 그린다)은 비워 둔다 */
function unthumb(host) {
  const inner = host.querySelector('.mhost');
  if (inner?.shadowRoot) inner.shadowRoot.innerHTML = '';
  thumbRO.unobserve(host);
}
/* 썸네일 배율 — 칸의 '지금' 크기에 맞춘다. 처음 그릴 때의 폭으로 한 번만 계산하면 창이 좁아졌을 때 글자가 칸 밖으로 잘린다. */
function fitThumb(host) {
  const t = host._atmThumb, inner = host.querySelector('.mhost');
  if (!t || !inner) return;
  const pad = 24;
  const cw = host.clientWidth ? host.clientWidth - pad : t.maxW, ch = host.clientHeight ? host.clientHeight - pad : t.maxH;
  const maxW = Math.min(t.maxW, cw), maxH = Math.min(t.maxH, ch);
  // 크게 보기: 작은 분자는 2.5배까지 키운다 · 실제 크기: 원래 px 그대로(칸보다 크면 그때만 줄인다) — 크기를 서로 견줄 수 있게
  const real = S.size === 'real' && !host.closest('.atm-dcard');
  let scale = Math.max(0.05, Math.min(real ? 1 : 2.5, maxW / Math.max(1, t.w), maxH / Math.max(1, t.h)));
  // 아주 넓고 얇은 것(화면 폭 머리줄 등)은 점처럼 작아지지 않게 — 최소 배율로 두고 왼쪽부터 보여 준다(오른쪽은 잘린다)
  const crop = t.minScale && scale < t.minScale;
  if (crop) scale = t.minScale;
  host.toggleAttribute('data-crop', !!crop);
  inner.style.transform = `scale(${scale})`;
  host.style.setProperty('--tw', t.w * scale + 'px'); host.style.setProperty('--th', t.h * scale + 'px');
}
const thumbRO = new ResizeObserver((entries) => entries.forEach((e) => fitThumb(e.target)));
/** [크게 보기 | 실제 크기] — 고르면 지금 화면의 썸네일을 모두 다시 맞춘다(그리지는 않는다) */
function sizeToggle() {
  const el = h(`<div class="atm-seg atm-sizeseg" role="group" aria-label="미리보기 크기" title="실제 크기 — 원래 px 그대로라 분자끼리 크기를 견줄 수 있습니다">
    <button type="button" data-size="fit">크게 보기</button><button type="button" data-size="real">실제 크기</button></div>`);
  const sync = () => el.querySelectorAll('[data-size]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.size === S.size));
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-size]'); if (!b || b.dataset.size === S.size) return;
    S.size = b.dataset.size;
    try { localStorage.setItem('wemb-atomic-size', S.size); } catch (err) {}
    document.querySelectorAll('.atm-sizeseg').forEach((x) => x.querySelectorAll('[data-size]').forEach((y) => y.setAttribute('aria-pressed', y.dataset.size === S.size)));
    document.querySelectorAll('.atm-thumb').forEach((t) => fitThumb(t));
    el.dispatchEvent(new CustomEvent('atm-size', { bubbles: true }));
  });
  sync();
  return el;
}
function lazy(root, fn) {
  const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); fn(e.target); } }), { root, rootMargin: '300px' });
  return { watch: (el) => io.observe(el), stop: () => io.disconnect() };
}
/** 보일 때 그리고, 멀리 벗어나면 비운다 — 페이지를 통째로 그리는 썸네일(페이지 · 유기체)이 쌓여 무거워지지 않게 */
function lazyLive(root, enter, leave) {
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    const el = e.target;
    if (e.isIntersecting && !el._live) { el._live = true; const gen = (el._gen = (el._gen || 0) + 1); Promise.resolve(enter(el)).then(() => { if (el._gen !== gen || !el._live) leave(el); }).catch((err) => console.warn(err)); }
    else if (!e.isIntersecting && el._live) { el._live = false; el._gen = (el._gen || 0) + 1; leave(el); }
  }), { root, rootMargin: '400px' });
  return { watch: (el) => io.observe(el), stop: () => io.disconnect() };
}

/* ── 섹션 틀 (머리 · 탭 · 테마) ── */
let frame = null;
let cleanup = null;
function ensureFrame(root) {
  if (frame && frame.isConnected) return frame;
  root.innerHTML = '';
  frame = h(`<div class="atm-frame">
    <div class="atm-top">
      <div>
        <div class="lc-title">분자 라이브러리</div>
        <div class="lc-sub" id="atmSub">원본 페이지를 아토믹 5단계로 쪼개 재사용합니다</div>
      </div>
      <nav class="atm-tabs" aria-label="분자 라이브러리 메뉴">
        <a href="#${P.lib}" data-tab="lib">라이브러리</a>
        <a href="#${P.screens}" data-tab="screens">조립 화면</a>
        <details class="atm-admin"><summary>관리</summary><div class="atm-admin-menu">
          <a href="#${P.names}" data-tab="names">이름 정리 <small>분자 이름 · 칸 이름 확정</small></a>
          <a href="#${P.verify}" data-tab="verify">검증 <small>원본 화면과 같은지 확인</small></a>
        </div></details>
      </nav>
      <div class="atm-theme" id="atmTheme" title="미리보기 테마 — 원본 색 그대로 보거나, 시드 색 하나로 전체 토큰을 바꿔 봅니다">
        <div class="atm-seg" role="group" aria-label="모드"><button type="button" data-mode="dark">다크</button><button type="button" data-mode="light">라이트</button></div>
        <div class="atm-seg" role="group" aria-label="색"><button type="button" data-seed="orig">원본 색</button><label class="atm-seedpick"><input type="color" value="#7c5cff" aria-label="시드 색"><span>시드 색</span></label></div>
      </div>
    </div>
    <div class="atm-view" id="atmView" tabindex="-1"></div>
  </div>`);
  root.append(frame);
  frame.addEventListener('click', (e) => { const l = e.target.closest('[data-nq]'); if (l) S.nfilter = { show: 'all', family: '', q: l.dataset.nq }; });
  // 상세 화면 머리의 [id 복사]
  frame.addEventListener('click', async (e) => { const b = e.target.closest('[data-copy]'); if (!b) return; try { await navigator.clipboard.writeText(b.dataset.copy); note('id 를 복사했습니다: ' + b.dataset.copy); } catch (err) { note(b.dataset.copy, 'info'); } });
  // '관리' 메뉴 — 바깥을 누르면 닫는다
  document.addEventListener('pointerdown', (e) => { const d = frame.querySelector('.atm-admin'); if (d?.open && !d.contains(e.target)) d.open = false; });
  const ctl = frame.querySelector('#atmTheme'), seed = ctl.querySelector('input');
  const sync = () => {
    ctl.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.mode === S.theme.mode));
    ctl.querySelector('[data-seed]').setAttribute('aria-pressed', !S.theme.seed);
    ctl.querySelector('.atm-seedpick').classList.toggle('on', !!S.theme.seed);
    if (S.theme.seed) seed.value = S.theme.seed;
    frame.dataset.mode = S.theme.mode; // 썸네일 바탕을 미리보기 테마에 맞춘다(css)
  };
  ctl.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.mode) S.theme = { ...S.theme, mode: b.dataset.mode };
    if (b.dataset.seed) S.theme = { ...S.theme, seed: null };
    saveTheme(); sync(); frame.dispatchEvent(new Event('atm-theme'));
  });
  seed.addEventListener('input', () => { S.theme = { ...S.theme, seed: seed.value }; saveTheme(); sync(); frame.dispatchEvent(new Event('atm-theme')); });
  sync();
  return frame;
}

/** 홈 라우터가 부른다. root = 홈 본문 안의 분자 라이브러리 칸 */
export async function show(root, page, id) {
  closeMenu();
  cleanup?.(); cleanup = null;
  thumbRO.disconnect(); // 이전 페이지 썸네일은 더 보지 않는다
  const fr = ensureFrame(root);
  const view = fr.querySelector('#atmView');
  fr.classList.toggle('is-editor', page === 'screen');
  fr.querySelectorAll('[data-tab]').forEach((a) => a.classList.toggle('on', a.dataset.tab === (page === 'screens' || page === 'screen' ? 'screens' : page === 'verify' ? 'verify' : page === 'names' ? 'names' : 'lib')));
  fr.querySelector('[data-tab="lib"]').setAttribute('href', '#' + P.lib);
  const admin = fr.querySelector('.atm-admin');
  admin.classList.toggle('on', page === 'names' || page === 'verify');
  admin.open = false;
  fr.querySelector('#atmTheme').hidden = page === 'screen'; // 화면 편집은 화면마다 테마를 따로 가진다
  view.innerHTML = '<div class="atm-empty">불러오는 중…</div>';
  try { await boot(); }
  catch (e) {
    view.innerHTML = `<div class="atm-offline">
      <b>분자 라이브러리 자료를 불러오지 못했어요.</b>
      <p>서버 없이 열면 WEMB Studio 의 <code>src/atomic/</code> 자료로 보여 줍니다. 자료가 없으면 <code>wemb-atomic</code> 폴더에서 <code>npm.cmd run export</code> 로 만들어 주세요.</p>
      <p>WEMB Studio 폴더의 <code>WEMB Studio 켜기.cmd</code> 로 열면 Node.js 18 이상과 <code>wemb-atomic</code> 폴더가 있는 PC 에서 서버가 함께 켜져, 저장이 <code>wemb-atomic/data</code> 파일에 남아요.</p>
      <p class="atm-hint">${esc(e.message)}</p></div>`;
    return;
  }
  const s = S.lib.summary;
  fr.querySelector('#atmSub').textContent = `원본 페이지 ${s.templates}장을 아토믹 5단계(원자 → 분자 → 유기체 → 템플릿 → 페이지)로 쪼갰습니다 · 원본 조각 ${s.fragments.toLocaleString()}개`
    + ((await apiMode()) === 'static' ? ' · 고친 내용은 이 브라우저에 저장돼요' : '');
  view.innerHTML = '';
  try {
    // 단계 목록 화면은 위에 5단계 막대를 둔다 (추상 → 구체)
    const level = { lib: 'molecule', atoms: 'atom', organisms: 'organism', templates: 'template', pages: 'page' }[page] || (page === undefined || page === '' ? 'molecule' : null);
    if (level) { view.append(h(levelBar(level))); levelHits(view); }
    if (page === 'mol' && id) await moleculePage(view, id);
    else if (page === 'screens') await screensPage(view);
    else if (page === 'screen' && id) await screenEditor(view, id);
    else if (page === 'verify') await verifyPage(view);
    else if (page === 'names') await namesPage(view);
    else if (page === 'atoms') await atomsPage(view);
    else if (page === 'organisms') await organismsPage(view);
    else if (page === 'org' && id) await organismPage(view, id);
    else if (page === 'templates') await templatesPage(view);
    else if (page === 'tpl' && id) await templatePage(view, id);
    else if (page === 'pages') await pagesPage(view);
    else if (page === 'page' && id) await pagePage(view, id);
    else await libraryPage(view, fr);
  } catch (e) { fail(e); view.append(h(`<div class="atm-empty">${esc(e.message)}</div>`)); }
}

/* ── 아토믹 5단계 — 추상(원자) → 구체(페이지) ──
   원자 = 더 쪼갤 수 없는 것 · 분자 = 원자 2개 이상의 덩어리 · 유기체 = 분자 · 원자를 여러 개 품은 구역
   템플릿 = 페이지에서 내용을 뺀 틀 · 페이지 = 원본 화면. 서버 lib/levels.mjs 가 원본 레이어 이름 · 구조로 나눈다. */
const LEVELS = [
  { key: 'atom', label: '원자', path: P.atoms },
  { key: 'molecule', label: '분자', path: P.lib },
  { key: 'organism', label: '유기체', path: P.organisms },
  { key: 'template', label: '템플릿', path: P.templates },
  { key: 'page', label: '페이지', path: P.pages },
];
const LEVEL_ICONS = {
  atom: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="15" cy="17" r="10.5" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="15" cy="17" r="5.2" fill="currentColor"/><circle cx="25" cy="7.5" r="3.4" fill="currentColor"/></svg>',
  molecule: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M13.5 12.5l-3 5M18.5 12.5l3 5M12 23.5h8" stroke="currentColor" stroke-width="2.6"/><g fill="none" stroke="currentColor" stroke-width="2.6"><circle cx="16" cy="8.5" r="5"/><circle cx="8" cy="23" r="5"/><circle cx="24" cy="23" r="5"/></g></svg>',
  organism: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 6h20M6 16h20M6 26h20M6 6v20M16 6v20M26 6v20" stroke="currentColor" stroke-width="1.6" opacity=".55"/><g fill="currentColor">' + [6, 16, 26].flatMap((y) => [6, 16, 26].map((x) => `<circle cx="${x}" cy="${y}" r="3.7"/>`)).join('') + '</g></svg>',
  template: '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="7" y="4" width="18" height="24" rx="1.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-dasharray="3.2 2.4"/></svg>',
  page: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 25V4h12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 8h10l5 5v15H11z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M21 8v5h5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>',
};
function levelCounts() {
  const L = S.lib.levels || {}, a = L.atoms || {};
  return {
    atom: (a.components || 0) + (a.icons || 0) + (a.images || 0),
    molecule: L.molecules ?? S.lib.molecules.length, organism: L.organisms ?? 0, template: L.templates ?? 0, page: L.pages ?? S.lib.templates.length,
  };
}
function levelBar(active) {
  const c = levelCounts();
  return `<nav class="atm-levels" aria-label="아토믹 단계" data-active="${active}">
    <div class="atm-lvaxis" aria-hidden="true"><span>추상</span><i></i><span>구체</span></div>
    <ol>${LEVELS.map((l) => `<li><a href="#${l.path}" class="atm-lv${l.key === active ? ' on' : ''}"${l.key === active ? ' aria-current="page"' : ''}>${LEVEL_ICONS[l.key]}<b>${l.label}</b><em>${c[l.key].toLocaleString()}</em><i class="atm-lvhit" data-lv="${l.key}" hidden></i></a></li>`).join('')}</ol>
  </nav>`;
}
/* 검색어가 맞은 개수 — 단계마다(프로젝트 · 분류 고르기와 상관없이 전체에서) */
const HIT = {};
async function hitCounts(q) {
  const L = await levelsData();
  HIT.mol ||= S.lib.molecules.filter((m) => m.level !== 'atom').map(moleculeDoc);
  HIT.part ||= L.atoms.components.map((id) => S.molecules.get(id)).filter(Boolean).map(moleculeDoc);
  HIT.icon ||= L.atoms.icons.map(iconDoc);
  HIT.org ||= L.organisms.map(organismDoc);
  return { molecule: rank(HIT.mol, q).length, atom: rank(HIT.part, q).length + rank(HIT.icon, q).length, organism: rank(HIT.org, q).length };
}
const LEVEL_NAME = { atom: '원자', molecule: '분자', organism: '유기체' };
const LEVEL_PATH = { atom: '/molecules/atoms', molecule: '/molecules', organism: '/molecules/organisms' };
let hitT = 0;
/** 단계 막대에 '○개 맞음'을 단다. 검색어를 지우면 숨긴다 */
function levelHits(root) {
  clearTimeout(hitT);
  hitT = setTimeout(async () => {
    const bar = root.querySelector('.atm-levels'); if (!bar) return;
    const q = S.q.trim();
    if (!q) { bar.querySelectorAll('.atm-lvhit').forEach((i) => (i.hidden = true)); return; }
    const n = await hitCounts(q);
    if (S.q.trim() !== q) return;
    for (const k of Object.keys(LEVEL_NAME)) {
      const i = bar.querySelector(`.atm-lvhit[data-lv="${k}"]`); if (!i) continue;
      i.hidden = false; i.textContent = n[k] ? `‘${q}’ ${n[k]}개` : `‘${q}’ 없음`; i.classList.toggle('zero', !n[k]);
    }
  }, 120);
}
/** 이 단계에 없을 때 — 다른 단계에 있으면 거기로 가는 링크(검색어는 그대로 따라간다) */
async function elsewhere(el, here) {
  const q = S.q.trim(); if (!q || !el) return;
  const n = await hitCounts(q);
  const links = Object.keys(LEVEL_NAME).filter((k) => k !== here && n[k]).map((k) => `<a href="#${LEVEL_PATH[k]}">${LEVEL_NAME[k]} ${n[k]}개</a>`);
  if (links.length && el.isConnected && S.q.trim() === q) el.insertAdjacentHTML('beforeend', `<div class="atm-else">다른 단계에 있어요 — ${links.join(' · ')}</div>`);
}
async function levelsData() {
  if (!S.levels) S.levels = await api('api/levels');
  return S.levels;
}
/** 모든 페이지를 잰다 — 잰 값이 없으면(처음 · 측정 형식이 바뀐 뒤) 진행 막대를 보여 준다 */
function measureAll(progress) {
  return ensureMeasured(S.lib.templates.map((t) => t.id), (n, total, name) => {
    progress.hidden = false;
    progress.querySelector('span').textContent = `페이지 재는 중 ${n}/${total} · ${name} — 분자 크기 · 구역 상자`;
    progress.querySelector('i').style.width = (n / total) * 100 + '%';
    if (n === total) setTimeout(() => (progress.hidden = true), 800);
  });
}
const familyOf = (tid) => S.templates.get(tid)?.family;
const pageName = (tid) => S.templates.get(tid)?.name || tid;
const catOfName = (name) => String(name || '').replace(/\s*\([^()]*\)\s*$/, '').split('/')[0].replace(/\s+\d+$/, '').trim();
/* ── 가져다 쓰기 — 상세 화면의 [조립 화면에 넣기] · [PNG 저장] ──
   PNG 는 그려진 모습 그대로(원래 크기 × 2배, 바탕 투명). 조립 화면은 고른 화면에 얹고 그 화면을 열어 선택해 둔다. */
const newItemId = () => 'i' + Math.random().toString(36).slice(2, 9);
async function savePng(host, name, btn, opts = {}) {
  const w = opts.width ?? parseFloat(host?.style.width), hh = opts.height ?? parseFloat(host?.style.height);
  if (!(w > 0 && hh > 0)) return note('아직 그리는 중이에요. 잠시 뒤 다시 눌러 주세요.', 'warn');
  const label = btn.textContent;
  btn.disabled = true; btn.textContent = '만드는 중…';
  try { download(await snapshot(host, { width: w, height: hh, scale: 2, ...opts }), name); note(`‘${name}’ PNG 를 저장했습니다.`); }
  catch (e) { fail(e); }
  finally { btn.disabled = false; btn.textContent = label; }
}
let menuOpen = null;
function closeMenu() { menuOpen?.(); menuOpen = null; }
/** 버튼 아래에 조립 화면 목록을 띄운다. make() = { data: 화면 항목, name } — 고르면 그 화면에 얹고 연다 */
async function placeMenu(btn, make) {
  if (menuOpen) return closeMenu();
  let list = [];
  try { list = await api('api/screens'); } catch (e) { return fail(e); }
  const menu = h(`<div class="atm-menu" role="menu" aria-label="얹을 조립 화면">
    <button type="button" role="menuitem" data-sid="new"><b>+ 새 조립 화면</b><span>빈 캔버스에 놓고 엽니다</span></button>
    ${list.length ? '<div class="atm-menu-sep">저장된 조립 화면</div>' : ''}
    ${list.slice(0, 12).map((s) => `<button type="button" role="menuitem" data-sid="${s.id}"><b>${esc(s.name)}</b><span>${s.kind === 'template' ? '페이지 · ' + esc(pageName(s.template)) : '빈 캔버스'}${s.count ? ` · ${s.count}개 얹음` : ''}</span></button>`).join('')}
  </div>`);
  document.body.append(menu);
  const r = btn.getBoundingClientRect();
  menu.style.top = Math.min(r.bottom + 6, innerHeight - menu.offsetHeight - 8) + 'px';
  menu.style.left = Math.max(8, Math.min(r.left, innerWidth - menu.offsetWidth - 8)) + 'px';
  menu.querySelector('button').focus();
  const onDoc = (e) => { if (!menu.contains(e.target) && e.target !== btn) closeMenu(); };
  const onKey = (e) => { if (e.key === 'Escape') { closeMenu(); btn.focus(); } };
  setTimeout(() => document.addEventListener('pointerdown', onDoc), 0);
  document.addEventListener('keydown', onKey);
  menuOpen = () => { menu.remove(); document.removeEventListener('pointerdown', onDoc); document.removeEventListener('keydown', onKey); };
  menu.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-sid]'); if (!b) return;
    closeMenu();
    const { data, name } = make();
    try {
      let s;
      if (b.dataset.sid === 'new') s = await api('api/screens', { method: 'POST', body: { kind: 'canvas', name, items: [data], theme: { mode: S.theme.mode, seed: S.theme.seed } } });
      else {
        const cur = await api('api/screens/' + b.dataset.sid);
        s = await api('api/screens/' + cur.id, { method: 'PUT', body: { rev: cur.rev, name: cur.name, theme: cur.theme, pins: cur.pins, items: [...cur.items, data], overrides: cur.overrides } });
      }
      S.pendingSelect = data.id;
      go(P.screen(s.id));
    } catch (err) { fail(err); }
  });
}
/** 화면 가운데에 놓을 자리 — 1920×1080 보다 크면 들어가게 줄인다 */
function centerOn(w, hh) {
  const scale = +Math.min(1, 1800 / Math.max(1, w), 1000 / Math.max(1, hh)).toFixed(3);
  return { x: Math.round((1920 - w * scale) / 2), y: Math.round((1080 - hh * scale) / 2), scale: Math.max(0.05, scale) };
}

/** 홈의 다른 메뉴로 나갈 때 */
export function hide() { closeMenu(); cleanup?.(); cleanup = null; }
/** 저장 안 한 화면 편집이 있으면 true — 홈이 다른 메뉴로 나가기 전에 묻는다 */
export const isDirty = () => !!S.dirty;

/* ── 1. 라이브러리 ── */
async function libraryPage(view, fr) {
  const { families, roles } = S.lib;
  const page = h(`<section class="atm-lib">
    <aside class="atm-filters">
      <div class="lc-searchwrap"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /></svg><input type="text" id="atmQ" placeholder="이름 · 문구 · 칸 검색 (예: 알람, 제목)" value="${esc(S.filter.q)}" aria-label="분자 검색"></div>
      <h3>프로젝트</h3><ul class="atm-facet" id="famList"></ul>
      <h3>분류 <small>표준 카테고리</small></h3><ul class="atm-facet" id="catList"></ul>
    </aside>
    <div class="atm-libmain">
      <details class="atm-about"><summary>분자란?</summary><p class="atm-hint">분자는 원자 2개 이상이 한 덩어리로 쓰이는 단위입니다 — 제목 · 라벨과 값 · 표의 한 줄처럼. 보이는 디자인(글자 · 아이콘 그림 · 배경/테두리 칸 · 배치)이 같은 조각을 한 분자로 묶었습니다.</p></details>
      <div class="atm-progress" id="measure" hidden><span></span><i></i></div>
      <div class="atm-gridbar"><span class="atm-count" id="gcount"></span></div>
      <div class="atm-grid" id="grid"></div>
    </div>
  </section>`);
  view.append(page);
  page.querySelector('.atm-gridbar').append(sizeToggle());
  const famList = page.querySelector('#famList'), catList = page.querySelector('#catList'), grid = page.querySelector('#grid');
  const inFamily = (m, f) => (m.families || [m.family]).includes(f); // 여러 프로젝트에 걸친 분자는 각 프로젝트에 다 잡힌다
  // 분자 단계 — 그림 하나 · 글자 하나뿐인 조각은 원자 단계로 옮겼다
  const pool = S.lib.molecules.filter((m) => m.level !== 'atom');
  // 분류마다 가장 많이 쓰인 한글 역할 표시(데이터 행 · 제목 …) — 새로 지은 말이 아니라 분자들이 이미 가진 표시
  const catKo = (() => {
    const t = new Map();
    pool.forEach((m) => { const c = categoryOf(m), r = roles[m.role]; if (!r) return; const x = t.get(c) || {}; x[r] = (x[r] || 0) + 1; t.set(c, x); });
    return new Map([...t].map(([c, x]) => [c, Object.entries(x).sort((a, b) => b[1] - a[1])[0][0]]));
  })();
  const renderFacets = () => {
    const byCat = pool.filter((m) => !S.filter.cat || categoryOf(m) === S.filter.cat);
    const fc = {};
    byCat.forEach((m) => (m.families || [m.family]).forEach((f) => (fc[f] = (fc[f] || 0) + 1)));
    const cc = {};
    pool.filter((m) => !S.filter.family || inFamily(m, S.filter.family)).forEach((m) => { const c = categoryOf(m); cc[c] = (cc[c] || 0) + 1; });
    const total = (f) => Object.values(f).reduce((a, b) => a + b, 0);
    famList.innerHTML = `<li><button type="button" data-family="" aria-pressed="${!S.filter.family}">전체 <em>${byCat.length}</em></button></li>` +
      Object.entries(families).map(([k, v]) => `<li><button type="button" data-family="${k}" aria-pressed="${S.filter.family === k}">${esc(v)} <em>${fc[k] || 0}</em></button></li>`).join('');
    catList.innerHTML = `<li><button type="button" data-cat="" aria-pressed="${!S.filter.cat}">전체 <em>${total(cc)}</em></button></li>` +
      Object.entries(cc).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([k, n]) => `<li><button type="button" data-cat="${esc(k)}" aria-pressed="${S.filter.cat === k}">${esc(k)}${catKo.get(k) ? ` <small>${esc(catKo.get(k))}</small>` : ''} <em>${n}</em></button></li>`).join('');
  };
  const filtered = (m) => (!S.filter.family || inFamily(m, S.filter.family)) && (!S.filter.cat || categoryOf(m) === S.filter.cat);
  const docs = new Map(pool.map((m) => [m.id, moleculeDoc(m)]));
  const scroller = view.closest('.lc-main') || null;
  let io = null;
  const progress = page.querySelector('#measure');
  const measured = measureAll(progress);
  const renderGrid = async () => {
    io?.stop();
    // 검색어가 있으면 잘 맞는 순(같으면 많이 쓰인 순), 없으면 원래 순서
    const found = rank(pool.filter(filtered).map((m) => docs.get(m.id)), S.filter.q, (a, b) => b.instanceCount - a.instanceCount);
    const list = found.map((r) => r.item);
    page.querySelector('#gcount').textContent = `분자 ${list.length.toLocaleString()}개${S.filter.q.trim() ? ` · ‘${S.filter.q.trim()}’ 잘 맞는 순` : ''}`;
    grid.innerHTML = list.length ? '' : `<div class="atm-empty">${S.filter.q.trim() ? `‘${esc(S.filter.q.trim())}’에 맞는 분자가 없습니다.` : '조건에 맞는 분자가 없습니다.'}</div>`;
    if (!list.length) elsewhere(grid.querySelector('.atm-empty'), 'molecule');
    let cards;
    if (!S.filter.q.trim() && !S.filter.cat) {
      const groups = new Map();
      list.forEach((m) => { const c = categoryOf(m); if (!groups.has(c)) groups.set(c, []); groups.get(c).push(m); });
      cards = [];
      [...groups].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])).forEach(([c, ms]) => {
        const kinds = {}; ms.forEach((m) => { const r = roles[m.role] || m.role; kinds[r] = (kinds[r] || 0) + 1; });
        const role = Object.entries(kinds).sort((a, b) => b[1] - a[1])[0][0];
        grid.append(h(`<h3 class="atm-ghead"><button type="button" data-cat="${esc(c)}" title="이 분류만 보기">${esc(c)} <span class="atm-role">${esc(role)}</span></button><em>${ms.length}</em></h3>`));
        ms.forEach((m) => { const card = h(moleculeCard(m, null, true)); cards.push(card); grid.append(card); });
      });
    } else {
      cards = found.slice(0, 400).map((r) => h(moleculeCard(r.item, r.hit)));
      grid.append(...cards);
    }
    if (list.length > 400) grid.append(h(`<div class="atm-empty">앞의 400개만 보여줍니다. 검색이나 필터로 좁혀 주세요. (전체 ${list.length}개)</div>`));
    io = lazy(scroller, async (card) => {
      const m = S.molecules.get(card.dataset.id);
      try { await thumb(card.querySelector('.atm-thumb'), m, m.firstVariant, { maxW: 250, maxH: 130, minScale: 0.35, version: versionObj(m.id, m.latest) }); }
      catch (e) { card.querySelector('.atm-thumb').textContent = '미리보기 실패'; console.warn(m.id, e); }
    });
    await measured; // 크기를 다 재기 전에는 그리지 않는다
    cards.forEach((c) => io.watch(c));
  };
  page.querySelector('#atmQ').addEventListener('input', (e) => { S.filter.q = e.target.value; renderGrid(); levelHits(view); });
  page.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-family],button[data-cat]'); if (!b) return;
    if (b.dataset.family !== undefined) S.filter.family = b.dataset.family;
    if (b.dataset.cat !== undefined) S.filter.cat = b.dataset.cat;
    renderFacets(); renderGrid();
  });
  renderFacets(); renderGrid();
  const onTheme = () => renderGrid();
  fr.addEventListener('atm-theme', onTheme);
  cleanup = () => { io?.stop(); fr.removeEventListener('atm-theme', onTheme); };
}

/* 상태 — 심볼 칸 · 상태별로 나뉜 분자(배지 · 줄) */
const stateDot = (s) => `<i class="atm-stdot" style="--c:${STATE_COLORS[s] || '#8a8a8a'}"></i>`;
/** 분자 전체가 상태별로 나뉜 분자에서, 같은 크기 변형 안에 그 상태의 실제 디자인(색 상태)이 있으면 그 변형 */
function lookForState(detail, vid, state) {
  const shape = variant(vid)?.shape;
  const sh = (detail?.shapes || []).find((x) => x.looks.some((l) => variant(l)?.shape === shape) || x.looks.includes(vid));
  return sh?.states?.[state] || null;
}

/* 구성도 노드 ↔ 떼어 낸 심볼 · 라벨 사이 링크 */
function partLinks(m) {
  const link = (id) => { const x = S.molecules.get(id); return x ? `<a href="#${P.mol(id)}">${esc(S.lib.roles[x.role] || x.role)} · ${x.instanceCount}곳에 쓰임</a>` : ''; };
  if (m.parts?.length) {
    const ids = [...new Set(m.parts)];
    return `<div class="atm-parts"><b>심볼 · 라벨 따로 쓰기</b> ${ids.map(link).join('')}</div>`;
  }
  if (m.partOf?.length) return `<div class="atm-parts"><b>떼어 낸 원래 구성도 노드</b> ${m.partOf.map(link).join('')}</div>`;
  return '';
}

/* ── 2. 분자 정의 (편집 · 버전 · 사용처) ── */
async function moleculePage(view, id) {
  const detail = await api('api/molecules/' + encodeURIComponent(id));
  const m = S.molecules.get(id);
  const { roles, families } = S.lib;
  await loadVariants(detail.variants);
  await ensureMeasured(detail.templates);
  let current = detail.shapes?.[0]?.variant || detail.variants[0];
  const shapesCount = detail.shapes?.length ?? detail.variants.length;
  const base = versionObj(id, latestOf(id));
  const draft = {
    root: { ...(base?.root || {}) },
    fields: Object.fromEntries(m.fields.map((f) => [f.key, { text: base?.fields?.[f.key]?.text || '', style: { ...(base?.fields?.[f.key]?.style || {}) } }])),
    states: { ...(base?.states || {}) },
  };
  const slots = m.slots || [];
  const rootState = slots[0]?.root; // 분자 전체가 상태별로 나뉜 것(배지 · 줄)
  const symbolOnly = m.role === 'topology-symbol'; // 심볼 — 색은 분자 전체가 아니라 상태값을 따른다
  let preview = null; // 미리 볼 상태 (null = 원래 상태)
  const tokenOptions = (sel) => '<option value="">원본</option>' + ROLE_TOKENS.map((t) => `<option value="${t}"${sel === t ? ' selected' : ''}>${TOKEN_LABELS[t]} (${t})</option>`).join('');
  const num = (name, val, min, max, label) => `<label class="atm-num"><span>${label}</span><input type="number" data-k="${name}" min="${min}" max="${max}" value="${val ?? ''}" placeholder="원본"></label>`;
  const page = h(`<section class="atm-mol">
    <nav class="lc-crumb" aria-label="위치"><a class="lc-crumb-root" href="#${m.level === 'atom' ? P.atoms : P.lib}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6" /></svg>${m.level === 'atom' ? '원자 목록' : '분자 목록'}</a><span class="lc-crumb-sep" aria-hidden="true">/</span><span class="lc-crumb-cur">${esc(families[m.family])}</span></nav>
    <div class="atm-molhead">
      <h2>${esc(m.name)} <span class="atm-role">${esc(roles[m.role] || m.role)}</span> <span class="atm-lvchip" title="${m.level === 'atom' ? '그림 하나 · 글자 하나뿐이라 더 쪼갤 수 없는 조각' : '원자 2개 이상이 한 덩어리'}">${m.level === 'atom' ? '원자' : '분자'}</span></h2>
      ${!m.confirmed && m.proposal?.name && m.proposal.name !== m.name ? `<div class="atm-namehint">이름 제안 <b>${esc(m.proposal.name)}</b> · <a href="#${P.names}" data-nq="${esc(m.id)}">이름 정리에서 확정</a></div>` : ''}
      <div class="atm-stats"><span>크기 ${shapesCount}종</span><span>색 ${m.lookCount ?? m.variantCount}종</span><span>${m.instanceCount}곳에 쓰임</span><span>페이지 ${m.templates.length}</span><span>문구 ${m.fields.length}</span><span class="atm-ver">최신 v${latestOf(id)}</span></div>
      ${partLinks(m)}
      ${m.names?.length > 1 ? `<div class="atm-names" title="합쳐진 원본 레이어 이름">${m.names.slice(0, 12).map((n) => `<span>${esc(n)}</span>`).join('')}${m.names.length > 12 ? `<span>외 ${m.names.length - 12}</span>` : ''}</div>` : ''}
      <button type="button" class="atm-mid" data-copy="${esc(id)}" title="분자 id: ${esc(id)} — 누르면 복사">id 복사</button>
      <div class="atm-actions"><button type="button" class="atm-btn primary" id="place" aria-haspopup="menu">조립 화면에 넣기</button><button type="button" class="atm-btn ghost" id="png">PNG 저장</button></div>
    </div>
    <div class="atm-molbody">
      <div>
        <div class="atm-stagebox"><div class="atm-thumb atm-preview" id="preview"></div><div class="atm-capbar"><div class="atm-cap" id="cap"></div></div></div>
        <div class="atm-looks" id="looks" hidden></div>
        <h3>크기 ${shapesCount}종 <small>보이는 디자인(글자 · 아이콘 그림 · 배경/테두리 칸 · 배치)이 같은 조각을 한 분자로 합쳤습니다. 글자 크기 · 간격 등이 다른 것은 '크기', 색만 다른 것은 '색'으로 나눴습니다.</small></h3>
        <div class="atm-variants" id="variants"></div>
      </div>
      <div class="atm-side">
        <div class="atm-tabs2" role="tablist"><button type="button" role="tab" data-tab="use" aria-selected="true">사용처 · 버전</button><button type="button" role="tab" data-tab="edit" aria-selected="false">공통 정의 편집</button></div>
        <form class="atm-panel" id="edit" autocomplete="off" hidden>
          <p class="atm-hint">여기서 바꾼 값은 <b>새 버전</b>으로 저장됩니다. 색은 테마 토큰만 고를 수 있어 시드 색 · 라이트/다크를 바꿔도 함께 따라갑니다.</p>
          ${slots.length ? `<fieldset class="atm-stfs"><legend>상태 <small>${rootState ? '색은 상태값을 따라 바뀝니다' : '심볼 색은 분자 전체가 아니라 상태값을 따라 바뀝니다'}</small></legend>
            <div class="atm-stpick" role="group" aria-label="미리 볼 상태">${STATES.map((st) => `<button type="button" data-pv="${st}" aria-pressed="false">${stateDot(st)}${STATE_LABELS[st]}</button>`).join('')}</div>
          </fieldset>` : ''}
          ${symbolOnly ? '' : `<fieldset><legend>분자 전체</legend>
            <label class="atm-sel"><span>배경</span><select data-root="background">${tokenOptions(draft.root.background)}</select></label>
            <label class="atm-sel"><span>테두리 색</span><select data-root="borderColor">${tokenOptions(draft.root.borderColor)}</select></label>
            <div class="atm-nums">${num('borderWidth', draft.root.borderWidth, 0, 12, '테두리 두께')}${num('radius', draft.root.radius, 0, 48, '둥글기')}${num('padding', draft.root.padding, 0, 64, '안쪽 여백')}${num('gap', draft.root.gap, 0, 64, '간격')}</div>
          </fieldset>`}
          ${m.fields.map((f) => `<fieldset data-field="${f.key}"><legend>${esc(f.name)} <code>${esc(f.key)}</code></legend>
            <label class="atm-txt"><span>기본 문구 <small>새로 놓는 분자에 쓰입니다</small></span><input type="text" data-f="text" maxlength="200" value="${esc(draft.fields[f.key].text)}" placeholder="원본 문구 유지"></label>
            <label class="atm-sel"><span>글자 색</span><select data-f="color">${tokenOptions(draft.fields[f.key].style.color)}</select></label>
            <div class="atm-nums">${num('fontSize', draft.fields[f.key].style.fontSize, 8, 96, '글자 크기')}${num('fontWeight', draft.fields[f.key].style.fontWeight, 100, 900, '굵기')}</div>
          </fieldset>`).join('')}
          <div class="atm-saverow">
            <input type="text" id="note" maxlength="300" placeholder="변경 메모 (예: 제목 크기 키움)" aria-label="변경 메모">
            <button type="button" class="atm-btn ghost" id="revert">되돌리기</button>
            <button type="submit" class="atm-btn primary">새 버전으로 저장</button>
          </div>
        </form>
        <div class="atm-panel" id="use"></div>
      </div>
    </div>
  </section>`);
  view.append(page);
  const draftVersion = () => {
    const clean = { version: 'draft', root: {}, fields: {} };
    for (const [k, v] of Object.entries(draft.root)) if (v !== '' && v !== undefined && v !== null) clean.root[k] = v;
    for (const [key, f] of Object.entries(draft.fields)) {
      const style = Object.fromEntries(Object.entries(f.style).filter(([, v]) => v !== '' && v !== undefined && v !== null));
      if (f.text || Object.keys(style).length) clean.fields[key] = { ...(f.text ? { text: f.text } : {}), ...(Object.keys(style).length ? { style } : {}) };
    }
    const states = Object.fromEntries(Object.entries(draft.states).filter(([, t]) => t));
    if (Object.keys(states).length) clean.states = states;
    return clean;
  };
  const previewEl = page.querySelector('#preview');
  page.querySelector('.atm-capbar').append(sizeToggle());
  const draw = async () => {
    const values = preview ? Object.fromEntries(slots.map((sl) => ['@' + sl.key, preview])) : undefined;
    await thumb(previewEl, m, current, { maxW: 2000, maxH: 300, version: draftVersion(), values }); // 폭은 칸 크기가 정한다
    const v = variant(current), box = boxFor(current);
    page.querySelectorAll('[data-pv]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.pv === (preview || (v.slots?.[0]?.state ?? v.state))));
    const b = v.part ? box?.parts?.[v.part] : box; // 떼어 낸 조각은 조각 상자 크기
    page.querySelector('#cap').textContent = `${S.templates.get(v.template)?.name || v.template} · ${b ? Math.round(b.w) + '×' + Math.round(b.h) + 'px' : '크기 미측정'}`;
  };
  // 크기 변형 목록 — 카드 하나가 크기 변형 하나. 누르면 그 크기 변형의 색 상태가 위에 펼쳐진다.
  const vbox = page.querySelector('#variants');
  const drawVariant = (el) => thumb(el.querySelector('.atm-thumb'), m, el.dataset.v, { maxW: 190, maxH: 84, version: versionObj(id, latestOf(id)) }).catch((e) => console.warn(e));
  const vio = lazy(view.closest('.lc-main'), drawVariant);
  const shapes = detail.shapes || detail.variants.map((v) => ({ variant: v, looks: [v], uses: 1 }));
  const usedIn = (vid) => [...new Set(variant(vid).uses.map((u) => S.templates.get(u.template)?.name || u.template))];
  shapes.forEach((sh, i) => {
    const names = [...new Set(sh.looks.flatMap(usedIn))];
    const el = h(`<button type="button" class="atm-vcard" data-v="${sh.variant}" data-shape="${i}" aria-pressed="${i === 0}"><div class="atm-thumb"></div>
      <span>${esc(names[0] || '')}${names.length > 1 ? ` 외 ${names.length - 1}` : ''}</span>
      <em>${sh.looks.length > 1 ? `색 ${sh.looks.length}종 · ` : ''}${sh.uses}곳에 쓰임</em></button>`);
    vbox.append(el); vio.watch(el);
  });
  const lookBox = page.querySelector('#looks');
  const showLooks = (i) => {
    const sh = shapes[i];
    lookBox.innerHTML = '';
    lookBox.hidden = sh.looks.length < 2;
    if (sh.looks.length < 2) return;
    lookBox.append(h(`<div class="atm-looks-t">이 크기의 색 ${sh.looks.length}종</div>`));
    sh.looks.forEach((vid) => {
      const st = variant(vid)?.state;
      const el = h(`<button type="button" class="atm-lcard" data-v="${vid}" aria-pressed="${vid === current}" title="${esc(usedIn(vid).join(', '))}"><div class="atm-thumb"></div>${st ? `<span class="atm-lstate">${stateDot(st)}${STATE_LABELS[st]}</span>` : ''}</button>`);
      lookBox.append(el);
      thumb(el.querySelector('.atm-thumb'), m, vid, { maxW: 120, maxH: 44, version: versionObj(id, latestOf(id)) }).catch(() => {});
    });
  };
  vbox.addEventListener('click', (e) => {
    const b = e.target.closest('.atm-vcard'); if (!b) return;
    current = b.dataset.v;
    vbox.querySelectorAll('.atm-vcard').forEach((x) => x.setAttribute('aria-pressed', x === b));
    showLooks(+b.dataset.shape); draw();
  });
  lookBox.addEventListener('click', (e) => {
    const b = e.target.closest('.atm-lcard'); if (!b) return;
    current = b.dataset.v;
    lookBox.querySelectorAll('.atm-lcard').forEach((x) => x.setAttribute('aria-pressed', x === b));
    draw();
  });
  showLooks(0);

  page.querySelector('.atm-stpick')?.addEventListener('click', (e) => {
    const b = e.target.closest('[data-pv]'); if (!b) return;
    const st = b.dataset.pv;
    // 배지 · 줄처럼 분자 전체가 상태별로 나뉜 것은, 그 상태의 실제 디자인이 있으면 그것을 보여 준다
    const real = rootState ? lookForState(detail, current, st) : null;
    if (real) { current = real; preview = null; lookBox.querySelectorAll('.atm-lcard').forEach((x) => x.setAttribute('aria-pressed', x.dataset.v === real)); }
    else preview = st === (variant(current).slots?.[0]?.state ?? variant(current).state) ? null : st;
    draw();
  });
  const form = page.querySelector('#edit');
  form.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.st) { draft.states[t.dataset.st] = t.value || undefined; draw(); return; }
    if (t.dataset.root) draft.root[t.dataset.root] = t.value || undefined;
    else if (t.dataset.k && !t.closest('[data-field]')) draft.root[t.dataset.k] = t.value === '' ? undefined : Number(t.value);
    else {
      const key = t.closest('[data-field]')?.dataset.field; if (!key) return;
      if (t.dataset.f === 'text') draft.fields[key].text = t.value;
      else if (t.dataset.f === 'color') draft.fields[key].style.color = t.value || undefined;
      else if (t.dataset.k) draft.fields[key].style[t.dataset.k] = t.value === '' ? undefined : Number(t.value);
    }
    draw();
  });
  page.querySelector('#revert').addEventListener('click', () => go(P.mol(id)));
  // 가져다 쓰기 — 지금 고른 크기 변형 · 색 상태 그대로
  page.querySelector('#png').addEventListener('click', (e) => savePng(previewEl.querySelector('.mhost'), `${m.name} ${m.sample || ''}`.trim(), e.currentTarget));
  page.querySelector('#place').addEventListener('click', (e) => placeMenu(e.currentTarget, () => {
    const v = variant(current), b = boxFor(current), bb = (v.part ? b?.parts?.[v.part] : b) || { w: 200, h: 60 };
    return { name: m.name + ' 조립', data: { id: newItemId(), molecule: id, variant: current, ...centerOn(bb.w, bb.h), props: {} } };
  }));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = draftVersion();
    try {
      const saved = await api('api/molecules/' + encodeURIComponent(id) + '/versions', { method: 'POST', body: { baseVersion: latestOf(id), note: page.querySelector('#note').value, root: d.root, fields: d.fields, states: d.states } });
      S.defs[id] = { versions: [...versionsOf(id), saved] };
      m.latest = saved.version;
      note(`v${saved.version} 저장됨 — 저장된 화면은 아직 이전 버전을 씁니다. '사용처 · 버전'에서 적용하세요.`);
      go(P.mol(id));
    } catch (err) { fail(err); }
  });

  const use = page.querySelector('#use');
  const renderUse = async () => {
    const fresh = await api('api/molecules/' + encodeURIComponent(id));
    const versions = ['1.0.0', ...fresh.versions.map((v) => v.version)];
    use.innerHTML = `
      <h4>원본 페이지 <small>${m.templates.length}</small></h4>
      <ul class="atm-links">${m.templates.map((t) => `<li><a href="#${P.page(t)}">${esc(S.templates.get(t)?.name || t)}</a> · <button type="button" class="atm-link" data-new="${t}">조립 화면으로 열기</button></li>`).join('')}</ul>
      <h4>이 ${m.level === 'atom' ? '원자' : '분자'}가 들어 있는 유기체 <small id="orgN"></small></h4>
      <ul class="atm-links" id="orgList"><li class="atm-hint">불러오는 중…</li></ul>
      <h4>이 분자를 쓰는 화면 <small>${fresh.screens.length}개</small></h4>
      ${fresh.screens.length ? `<ul class="atm-pick">${fresh.screens.map((s) => `<li><label><input type="checkbox" value="${s.id}"> ${esc(s.name)} <span class="atm-pin ${s.version === latestOf(id) ? '' : 'old'}">v${s.version}</span></label> <a href="#${P.screen(s.id)}">열기</a></li>`).join('')}</ul>
        <div class="atm-applyrow"><select id="applyVer" aria-label="적용할 버전">${versions.slice().reverse().map((v) => `<option>${v}</option>`).join('')}</select><button type="button" class="atm-btn primary" id="applyBtn">선택한 화면에 적용</button></div>
        <p class="atm-hint">저장된 화면은 고정한 버전을 계속 씁니다. 여기서 고른 화면만 바뀌고, 화면에서 직접 고친 문구는 그대로 남습니다.</p>`
        : '<p class="atm-hint">아직 이 분자를 쓰는 저장된 화면이 없습니다. 위의 [조립 화면에 넣기]로 놓을 수 있어요.</p>'}
      <h4>버전</h4>
      <ol class="atm-versions">${[{ version: '1.0.0', note: '추출 원본', createdAt: null }, ...fresh.versions].reverse().map((v) => `<li><b>v${v.version}</b> <span>${esc(v.note || '')}</span>${v.createdAt ? `<time>${new Date(v.createdAt).toLocaleString('ko-KR')}</time>` : ''}</li>`).join('')}</ol>`;
    levelsData().then((L) => {
      // 구성도에서 떼어 낸 심볼 · 라벨은 원래 노드가 든 유기체에 들어 있다
      const ids = new Set([id, ...(m.partOf || [])]);
      const list = L.organisms.filter((o) => o.molecules.some((x) => ids.has(x.id)));
      const ul = use.querySelector('#orgList'); if (!ul) return;
      use.querySelector('#orgN').textContent = list.length + '종';
      ul.innerHTML = list.length ? list.slice(0, 40).map((o) => `<li><a href="#${P.org(o.id)}">${orgLinkText(o)}${o.instanceCount}곳에 쓰임</small></li>`).join('') + (list.length > 40 ? `<li class="atm-hint">외 ${list.length - 40}</li>` : '')
        : '<li class="atm-hint">유기체 안에 들어 있지 않습니다 (페이지에 바로 놓였거나, 구역으로 세지 않는 칸 안에 있습니다).</li>';
    }).catch(() => {});
    use.querySelector('#applyBtn')?.addEventListener('click', async () => {
      const ids = [...use.querySelectorAll('.atm-pick input:checked')].map((i) => i.value);
      if (!ids.length) return note('적용할 화면을 고르세요.', 'warn');
      try {
        const r = await api('api/molecules/' + encodeURIComponent(id) + '/apply', { method: 'POST', body: { version: use.querySelector('#applyVer').value, screens: ids } });
        note(`${r.changed.length}개 화면에 적용했습니다.`); renderUse();
      } catch (e) { fail(e); }
    });
  };
  use.addEventListener('click', async (e) => { const b = e.target.closest('[data-new]'); if (b) { try { await newTemplateScreen(b.dataset.new); } catch (err) { fail(err); } } });
  page.querySelector('.atm-tabs2').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    page.querySelectorAll('.atm-tabs2 [data-tab]').forEach((x) => x.setAttribute('aria-selected', x === b));
    form.hidden = b.dataset.tab !== 'edit'; use.hidden = b.dataset.tab !== 'use';
    if (!use.hidden) renderUse();
  });
  await draw();
  renderUse();
  const fr = view.closest('.atm-frame');
  const onTheme = () => { draw(); vbox.querySelectorAll('.atm-vcard').forEach((el) => { if (el.querySelector('.mhost')) drawVariant(el); }); };
  fr.addEventListener('atm-theme', onTheme);
  cleanup = () => { vio.stop(); fr.removeEventListener('atm-theme', onTheme); };
}

/* ── 이름 정리 — 네이밍 규칙으로 제안한 이름을 확인하고 확정한다 ──
   제안은 서버(wemb-atomic lib/naming.mjs)가 근거와 함께 준다. 확정한 것만 data/names.json 에 저장되고 라이브러리 전체에 반영된다.
   칸의 내부 key 는 그대로 — 화면에 저장된 문구 · 버전은 영향이 없다. */
const BASIS = {
  source: { label: '원본 이름', cls: 'src', tip: '배치된 곳의 원본 레이어 이름이 이미 표준 어휘입니다' },
  parent: { label: '감싼 컴포넌트', cls: 'src', tip: '바로 감싼 컴포넌트 이름(Count/… 등)을 따랐습니다' },
  rule: { label: '규칙', cls: 'rule', tip: '원본 이름이 옛 이름이라, 같은 역할을 다른 분자들이 부르는 표준 이름을 따랐습니다 — 확인해 주세요' },
  none: { label: '근거 없음', cls: 'none', tip: '표준 어휘로 옮길 근거가 없습니다' },
};
const FBASIS = { keep: '원래 이름', header: '표 머리글', content: '문구 형식', check: '확인 필요', none: '근거 없음', done: '확정' };
const catOf = (name) => String(name || '').replace(/\s*\([^()]*\)\s*$/, '').split('/')[0].trim();
/** 분류 — 확정한 이름의 카테고리, 아직이면 제안의 카테고리 */
const categoryOf = (m) => catOf(m.confirmed ? m.name : m.proposal?.name || m.name) || '—';
const needsReview = (m) => !!m.proposal && (m.proposal.basis === 'rule' || m.proposal.basis === 'none' || m.proposal.fields.some((f) => f.basis === 'check' || f.basis === 'none'));
function applyName(m, entry) {
  if (!m) return;
  if (entry) {
    m.name = entry.name; m.confirmed = true;
    m.fields = m.fields.map((f) => ({ ...f, name: entry.fields?.[f.key] || f.origName || f.name }));
  } else {
    m.name = m.origName || m.name; m.confirmed = false;
    m.fields = m.fields.map((f) => ({ ...f, name: f.origName || f.name }));
  }
}
const proposalEntry = (m) => ({ name: m.proposal.name, fields: Object.fromEntries(m.proposal.fields.map((f) => [f.key, f.to])) });

async function namesPage(view) {
  const { families } = S.lib;
  const st = S.nfilter;
  const page = h(`<section class="atm-names">
    <p class="atm-hint">분자 이름을 정해 둔 네이밍 규칙으로 제안합니다 — 분자는 <code>카테고리/이름</code>, 칸은 Label · Value · Unit · Separator · Total · Time · <code>Td/열</code> 같은 고정 어휘.
      새로 짓지 않고 근거가 있는 것만 제안하며(원본 레이어 이름 → 감싼 컴포넌트 · 표 머리글 → 규칙), <b>확정</b>한 것만 라이브러리에 반영됩니다.
      칸의 내부 키는 그대로라 저장된 화면 · 버전에는 영향이 없습니다.</p>
    <div class="atm-nstats" id="nstats"></div>
    <div class="atm-ntools">
      <div class="atm-seg" role="group" aria-label="보기">
        <button type="button" data-show="review">확인 필요</button><button type="button" data-show="source">원본 근거</button><button type="button" data-show="done">확정됨</button><button type="button" data-show="all">전체</button>
      </div>
      <select id="nfam" aria-label="프로젝트"><option value="">모든 프로젝트</option>${Object.entries(families).map(([k, v]) => `<option value="${k}"${st.family === k ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select>
      <div class="lc-searchwrap"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /></svg><input type="text" id="nq" placeholder="이름 · 위치 · 분자 id 검색" value="${esc(st.q)}" aria-label="이름 검색"></div>
      <button type="button" class="atm-btn primary" id="nbulk">원본 근거 제안 모두 확정</button>
    </div>
    <div class="atm-nlist" id="nlist"></div>
  </section>`);
  view.append(page);
  const list = page.querySelector('#nlist'), stats = page.querySelector('#nstats');
  const all = S.lib.molecules;
  const inFam = (m) => !st.family || (m.families || [m.family]).includes(st.family);
  const matchQ = (m) => { const q = st.q.trim().toLowerCase(); return !q || [m.id, m.name, m.origName, m.proposal?.name, ...(m.proposal?.context || [])].join(' ').toLowerCase().includes(q); };
  const bucket = (m) => (m.confirmed ? 'done' : needsReview(m) ? 'review' : 'source');
  const renderStats = () => {
    const c = { review: 0, source: 0, done: 0 };
    const mine = all.filter(inFam);
    mine.forEach((m) => c[bucket(m)]++);
    stats.innerHTML = `<span>분자 <b>${mine.length}</b></span><span class="s-done">확정 <b>${c.done}</b></span><span class="s-review">확인 필요 <b>${c.review}</b></span><span class="s-src">원본 근거 · 확정 대기 <b>${c.source}</b></span>`;
    page.querySelector('#nbulk').disabled = !c.source;
    page.querySelectorAll('[data-show]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.show === st.show));
  };
  let io = null;
  const row = (m) => {
    const p = m.proposal;
    const b = BASIS[p?.basis] || BASIS.none;
    const nameNow = m.confirmed ? m.name : p?.name || m.origName;
    const fields = m.fields.map((f) => {
      const pf = p?.fields.find((x) => x.key === f.key);
      const to = m.confirmed ? f.name : pf?.to || f.origName;
      const fb = m.confirmed ? 'done' : pf?.basis || 'keep';
      const changed = (f.origName || f.name) !== to;
      return `<label class="atm-nf f-${fb}${changed ? ' changed' : ''}" title="${esc(pf?.why || '')}"><span class="atm-nfrom">${esc(f.origName || f.name)}</span>${changed ? '<i aria-hidden="true">→</i>' : ''}<input type="text" data-fkey="${esc(f.key)}" value="${esc(to)}" maxlength="60" aria-label="${esc(f.origName || f.name)} 칸 이름"><small>${FBASIS[fb] || ''}</small></label>`;
    }).join('');
    return h(`<article class="atm-nrow${m.confirmed ? ' is-done' : ''}" data-id="${esc(m.id)}">
      <a class="atm-thumb" href="#${P.mol(m.id)}" aria-label="${esc(nameNow)} 분자 정의 열기"></a>
      <div class="atm-nmain">
        <div class="atm-nhead">
          <span class="atm-nfam">${esc(families[m.family] || m.family)}</span>
          ${nameNow !== m.origName ? `<s class="atm-nold" title="원래 이름">${esc(m.origName)}</s><i aria-hidden="true">→</i>` : ''}
          <input type="text" class="atm-nname" value="${esc(nameNow)}" maxlength="80" aria-label="분자 이름">
          ${m.confirmed ? '<span class="atm-nbasis b-done">확정됨</span>' : `<span class="atm-nbasis b-${b.cls}" title="${esc(b.tip)}">${b.label}</span>`}
          ${p?.duplicates > 1 ? `<span class="atm-ndup" title="같은 프로젝트에 같은 이름이 ${p.duplicates}개 있습니다 — 이름을 지어 붙이지 않고 위치로 구분합니다">같은 이름 ${p.duplicates}</span>` : ''}
        </div>
        <div class="atm-nwhy">${esc(p?.why || '')}</div>
        <div class="atm-nctx">위치 ${esc((p?.context || []).join(' · ') || '—')} · ${m.instanceCount}곳에 쓰임</div>
        ${m.fields.length ? `<div class="atm-nfields">${fields}</div>` : ''}
      </div>
      <div class="atm-nact">${m.confirmed ? '<button type="button" class="atm-btn ghost" data-act="ok">고친 이름 저장</button><button type="button" class="atm-btn ghost" data-act="undo">확정 취소</button>' : '<button type="button" class="atm-btn primary" data-act="ok">확정</button>'}</div>
    </article>`);
  };
  const render = () => {
    io?.stop();
    renderStats();
    const items = all.filter((m) => inFam(m) && matchQ(m) && (st.show === 'all' || bucket(m) === st.show));
    list.innerHTML = items.length ? '' : `<div class="atm-empty">${st.show === 'review' ? '확인이 필요한 제안이 없습니다.' : '조건에 맞는 분자가 없습니다.'}</div>`;
    const rows = items.slice(0, 300).map(row);
    list.append(...rows);
    if (items.length > 300) list.append(h(`<div class="atm-empty">앞의 300개만 보여 줍니다. (전체 ${items.length}개)</div>`));
    io = lazy(view.closest('.lc-main'), async (r) => {
      const m = S.molecules.get(r.dataset.id);
      try { await thumb(r.querySelector('.atm-thumb'), m, m.firstVariant, { maxW: 150, maxH: 80, version: versionObj(m.id, m.latest) }); } catch (e) { console.warn(m.id, e); }
    });
    rows.forEach((r) => io.watch(r));
  };
  const save = async (set, remove = []) => {
    const saved = await api('api/names', { method: 'PUT', body: { set, remove } });
    for (const id of Object.keys(set)) applyName(S.molecules.get(id), saved[id]);
    for (const id of remove) applyName(S.molecules.get(id), null);
  };
  page.querySelector('[role="group"]').addEventListener('click', (e) => { const b = e.target.closest('[data-show]'); if (!b) return; st.show = b.dataset.show; render(); });
  page.querySelector('#nfam').addEventListener('change', (e) => { st.family = e.target.value; render(); });
  page.querySelector('#nq').addEventListener('input', (e) => { st.q = e.target.value; render(); });
  page.querySelector('#nbulk').addEventListener('click', async (e) => {
    const targets = all.filter((m) => inFam(m) && bucket(m) === 'source');
    if (!targets.length) return;
    e.target.disabled = true;
    try {
      await save(Object.fromEntries(targets.map((m) => [m.id, proposalEntry(m)])));
      note(`원본 근거 제안 ${targets.length}개를 확정했습니다. '확정됨'에서 하나씩 고치거나 취소할 수 있습니다.`);
      render();
    } catch (err) { fail(err); e.target.disabled = false; }
  });
  list.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const r = b.closest('.atm-nrow'), id = r.dataset.id;
    b.disabled = true;
    try {
      if (b.dataset.act === 'undo') { await save({}, [id]); note('확정을 취소했습니다 — 원래 이름으로 돌아갑니다.'); }
      else {
        const fields = {};
        r.querySelectorAll('[data-fkey]').forEach((i) => { if (i.value.trim()) fields[i.dataset.fkey] = i.value.trim(); });
        await save({ [id]: { name: r.querySelector('.atm-nname').value.trim(), fields } });
        note(S.molecules.get(id).name + ' — 확정했습니다.');
      }
      render();
    } catch (err) { fail(err); b.disabled = false; }
  });
  render();
  cleanup = () => io?.stop();
}

/* ── 원자 — 더 쪼갤 수 없는 것 ─────────────────────────────
   분자에서 옮긴 조각(그림만 있거나 글자 하나뿐인 것 — 구성도 심볼 · 라벨)과, 페이지에 쓰인 아이콘 · 그림.
   색 · 글자 스타일 · 모양 같은 스타일 값은 원자로 세지 않는다(사용자 지시 2026-10-01). */
const ATOM_TABS = [{ key: 'part', label: '분자에서 옮긴 원자' }, { key: 'icon', label: '아이콘' }, { key: 'image', label: '그림' }];
/* 검색할 곳 — 이름 · 분류가 맞으면 맨 앞, 화면 문구 · 원본 레이어 이름에서만 맞으면 뒤(카드에 어디서 맞았는지 적는다).
   프로젝트 이름은 넣지 않는다 — 'CCTV'가 POSCO 분자 전부에 걸렸다. 프로젝트는 왼쪽 필터로 고른다. */
function moleculeDoc(m) {
  return doc(m, [
    [[m.name, categoryOf(m)], 10, ''],
    [S.lib.roles[m.role], 8, ''],
    [m.proposal?.name, 6, ''],
    [m.fields.map((f) => f.name), 5, '칸'],
    [m.sample, 4, ''],
    [m.texts || [], 4, '문구'],
    [[...(m.names || []), m.origName], 3, '원본 레이어'],
    [m.proposal?.context || [], 1, '놓인 곳'],
  ]);
}
const fileName = (f) => f.split('/').pop();
const GENERIC_FILE = /^(icon|icons|ico|image|img|vector|group|frame|ellipse|rectangle|rect|union|path|layer|shape|svg|bg|property|mask|subtract|polygon|line|star|vector-stroke)([\s_-]*\d+)*$/i;
/** 아이콘 · 그림을 부를 말 — 같은 그림의 여러 파일 이름 중 뜻이 있는 것(가장 긴 것). 없으면 null */
function graphicName(i) {
  const words = i.files.map((f) => fileName(f).replace(/\.\w+$/, '').replace(/^(icon|ico)[-_]/i, '').replace(/([-_]\d+)+$/, '')).filter((n) => n && !GENERIC_FILE.test(n) && !/^[\d\s_-]+$/.test(n) && n.length > 1);
  const best = words.sort((a, b) => b.length - a.length)[0];
  return best ? best.replace(/[-_]+/g, ' ') : null;
}
function organismDoc(o) {
  return doc(o, [
    [[o.name, o.category], 10, ''],
    [o.names, 6, '원본 레이어'],
    [o.content || [], 4, '문구'],
    [o.molecules.map((x) => S.molecules.get(x.id)?.name).filter(Boolean), 3, '안의 분자'],
    [o.templates.map(pageName), 2, '페이지'],
  ]);
}
function iconDoc(i) {
  return doc(i, [
    [i.files.map((f) => fileName(f).replace(/\.\w+$/, '')), 8, '파일'],
    [i.context, 6, '맥락'],
    [i.templates.map(pageName), 2, '페이지'],
  ]);
}
/** 분자 카드 — 분자 목록 · 원자(분자에서 옮긴 것)에서 같이 쓴다. hit = 검색이 맞은 곳(카드에 안 보이는 곳이면 한 줄 적는다) */
/** 카드 맨 위에 쓸 실제 문구 — 비었거나 기호 · 숫자뿐이면 없다 */
const sampleText = (m) => { const t = String(m.sample || '').trim(); return /\p{L}/u.test(t) ? t : ''; };
function moleculeCard(m, hit = null, grouped = false) {
  const { families, roles } = S.lib;
  const lead = grouped && sampleText(m);
  return `<a class="atm-card" href="#${P.mol(m.id)}" data-id="${m.id}">
      <div class="atm-thumb" aria-hidden="true"></div>
      <div class="atm-meta">
        ${lead ? `<div class="atm-name atm-lead" title="${esc(lead)}">${esc(lead)}</div><div class="atm-sample">${esc(m.name)} <span class="atm-role">${esc(roles[m.role] || m.role)}</span></div>`
          : `<div class="atm-name">${esc(m.name)} <span class="atm-role">${esc(roles[m.role] || m.role)}</span></div>`}
        ${!m.confirmed && m.proposal?.name && m.proposal.name !== m.name ? `<div class="atm-nhint" title="이름 정리에서 확정하면 바뀝니다">제안 ${esc(m.proposal.name)}</div>` : ''}
        ${lead ? '' : `<div class="atm-sample">${esc(m.sample || '—')}</div>`}
        ${hitNote(hit) ? `<div class="atm-hit">${esc(hitNote(hit))}</div>` : ''}
        <div class="atm-stats"><span>${esc(families[m.family])}${m.families?.length > 1 ? ` 외 ${m.families.length - 1}` : ''}</span>${m.shapeCount > 1 ? `<span>크기 ${m.shapeCount}종</span>` : ''}<span>${m.instanceCount}곳에 쓰임</span>${m.latest !== '1.0.0' ? `<span class="atm-ver">v${m.latest}</span>` : ''}</div>
      </div></a>`;
}

async function atomsPage(view) {
  const L = await levelsData();
  const { families } = S.lib;
  const st = S.afilter;
  const page = h(`<section class="atm-atoms">
    <details class="atm-about"><summary>원자란?</summary><p class="atm-hint">원자는 더 쪼갤 수 없는 단위입니다 — 분자로 뽑혔지만 그림만 있거나 글자 하나뿐인 조각(구성도 심볼 · 라벨)을 분자에서 이곳으로 옮겼고, 페이지에 쓰인 아이콘 · 그림을 함께 둡니다.</p></details>
    <div class="atm-ntools">
      <div class="lc-searchwrap"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /></svg><input type="text" id="aq" placeholder="이름 · 파일 · 맥락 검색 (예: 알람, 닫기)" value="${esc(st.q)}" aria-label="원자 검색"></div>
      <div class="atm-seg" role="group" aria-label="원자 종류" id="atabs"></div>
      <span class="atm-spacer"></span>
      <select id="afam" aria-label="프로젝트"><option value="">모든 프로젝트</option>${Object.entries(families).map(([k, v]) => `<option value="${k}"${st.family === k ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select>
    </div>
    <div id="abody"></div>
  </section>`);
  view.append(page);
  const body = page.querySelector('#abody'), tabs = page.querySelector('#atabs');
  page.querySelector('.atm-ntools').append(sizeToggle());
  const inFam = (tids) => !st.family || tids.some((t) => familyOf(t) === st.family);
  const iconDocs = new Map(L.atoms.icons.map((i) => [i.id, iconDoc(i)]));
  const partDocs = new Map();
  const partDoc = (m) => partDocs.get(m.id) || partDocs.set(m.id, moleculeDoc(m)).get(m.id);
  // 검색어가 있으면 잘 맞는 순 — 탭마다 따로 센다
  const graphics = () => rank(L.atoms.icons.filter((i) => inFam(i.templates)).map((i) => iconDocs.get(i.id)), st.q, (a, b) => b.uses - a.uses);
  const parts = () => rank(L.atoms.components.map((id) => S.molecules.get(id)).filter((m) => m && (!st.family || (m.families || [m.family]).includes(st.family))).map(partDoc), st.q, (a, b) => b.instanceCount - a.instanceCount);
  let io = null;

  const renderParts = () => {
    const list = parts();
    body.append(h('<p class="atm-hint">분자로 뽑혔지만 그림만 있거나 글자 하나뿐이라 더 쪼갤 수 없는 조각입니다. 분자 정의(버전 · 상태 색 · 조립 화면에 놓기)는 그대로 쓸 수 있습니다.</p>'));
    const grid = h('<div class="atm-grid"></div>');
    io = lazy(view.closest('.lc-main'), async (card) => {
      const m = S.molecules.get(card.dataset.id);
      try { await thumb(card.querySelector('.atm-thumb'), m, m.firstVariant, { maxW: 250, maxH: 130, minScale: 0.35, version: versionObj(m.id, m.latest) }); } catch (e) { console.warn(m.id, e); }
    });
    for (const r of list) { const card = h(moleculeCard(r.item, r.hit)); grid.append(card); io.watch(card); }
    if (!list.length) { const em = h(`<div class="atm-empty">‘${esc(st.q.trim())}’에 맞는 원자가 없습니다.</div>`); grid.append(em); elsewhere(em, 'atom'); }
    body.append(grid);
  };

  const renderGraphics = (kind) => {
    let list = graphics().filter((r) => (kind === 'icon' ? r.item.kind === 'icon' : r.item.kind !== 'icon'));
    if (kind === 'image') {
      const cnt = {};
      list.forEach((r) => (cnt[r.item.context] = (cnt[r.item.context] || 0) + 1));
      if (st.ctx && !cnt[st.ctx]) st.ctx = '';
      body.append(h('<p class="atm-hint">아이콘이 아닌 그림 — 배경 · 장식 · 눈금 · 마커 등입니다. 맥락은 그림을 감싼 가까운 레이어 이름이고, 표준 어휘가 아닌 옛 이름은 한데 묶었습니다.</p>'),
        h(`<div class="atm-chips">${['', ...Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])].map((c) => `<button type="button" data-ctx="${esc(c)}" aria-pressed="${st.ctx === c}">${c ? esc(c) : '전체'} <em>${c ? cnt[c] : list.length}</em></button>`).join('')}</div>`));
      if (st.ctx) list = list.filter((r) => r.item.context === st.ctx);
    } else body.append(h('<p class="atm-hint">레이어 이름이 Icon 인 그림입니다. 모양이 같으면 파일 이름 · 색이 달라도 하나로 셉니다 — 색은 상태값 · 테마가 정합니다.</p>'));
    const grid = h(`<div class="atm-icons${kind === 'image' ? ' big' : ''}"></div>`);
    if (!list.length) { const em = h(`<div class="atm-empty">‘${esc(st.q.trim())}’에 맞는 그림이 없습니다.</div>`); body.append(em); elsewhere(em, 'atom'); }
    for (const { item: i, hit } of list.slice(0, 400)) {
      const named = graphicName(i), shown = named || (i.kind === 'icon' ? '이름 없는 아이콘' : '이름 없는 그림');
      const note = hit && hit.label !== '파일' ? hitNote(hit) : '';
      const f = h(`<figure class="atm-ico"><div><img alt="" loading="lazy" decoding="async"></div><figcaption><b${named ? '' : ' class="atm-noname"'}>${esc(shown)}</b><span>${i.w && i.h ? i.w + '×' + i.h + ' · ' : ''}${i.uses.toLocaleString()}곳에 쓰임</span>${note ? `<span class="atm-hit">${esc(note)}</span>` : ''}</figcaption></figure>`);
      f.title = i.files.join('\n');
      f.querySelector('img').src = i.src;
      grid.append(f);
    }
    body.append(grid);
    if (list.length > 400) body.append(h(`<div class="atm-empty">앞의 400개만 보여 줍니다 (전체 ${list.length}개)</div>`));
  };

  const render = () => {
    io?.stop(); io = null;
    const g = graphics();
    const c = { part: parts().length, icon: g.filter((r) => r.item.kind === 'icon').length, image: g.filter((r) => r.item.kind !== 'icon').length };
    tabs.innerHTML = ATOM_TABS.map((t) => `<button type="button" data-tab="${t.key}" aria-pressed="${st.tab === t.key}">${t.label} <em>${c[t.key].toLocaleString()}</em></button>`).join('');
    body.innerHTML = '';
    ({ part: renderParts, icon: () => renderGraphics('icon'), image: () => renderGraphics('image') })[st.tab]();
  };
  tabs.addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (!b) return; st.tab = b.dataset.tab; render(); });
  page.querySelector('#aq').addEventListener('input', (e) => { st.q = e.target.value; render(); levelHits(view); });
  page.querySelector('#afam').addEventListener('change', (e) => { st.family = e.target.value; render(); });
  body.addEventListener('click', (e) => { const b = e.target.closest('[data-ctx]'); if (!b) return; st.ctx = b.dataset.ctx; render(); });
  if (!ATOM_TABS.some((t) => t.key === st.tab)) st.tab = 'part';
  render();
  const fr = view.closest('.atm-frame');
  const onTheme = () => { if (st.tab === 'part') render(); };
  fr.addEventListener('atm-theme', onTheme);
  cleanup = () => { io?.stop(); fr.removeEventListener('atm-theme', onTheme); };
}

/* ── 유기체 — 분자 · 원자를 여러 개 품은 이름 있는 구역 ──
   원본 레이어 이름이 구역(Widget/… · Header · Event Log · Table · List · Legend …)이고 안에 부품이 여럿인 것(서버 lib/levels.mjs).
   같은 분류 + 같은 보이는 틀이면 한 유기체. 그림은 페이지를 그린 뒤 그 구역만 잘라 보여 준다(구역은 페이지 배치에 기대어 있다). */
/** 유기체를 부를 말 — { lead: 'Hourly Trend', tag: 'Widget' }. 이름이 곧 분류면 tag 없음 */
function orgLabel(o) {
  const i = o.name.indexOf('/');
  const lead = i > 0 ? o.name.slice(i + 1) : o.name;
  return { lead, tag: lead === o.category ? '' : o.category };
}
const orgLinkText = (o) => { const l = orgLabel(o); return `${esc(l.lead)}</a> <small>${l.tag ? esc(l.tag) + ' · ' : ''}`; };
const orgTitle = (o) => { const l = orgLabel(o); return `${esc(l.lead)}${l.tag ? ` <span class="atm-role">${esc(l.tag)}</span>` : ''}`; };
const sectionRect = (tid, path) => S.measures[tid]?.rects?.[path.join('.')] || null;
async function organismThumb(host, inst, { maxW, maxH, minScale = 0 }) {
  const t = await templateData(inst.template);
  const size = await thumbMount(host, (inner) => mountSection(inner, { template: t, path: inst.path, theme: S.theme, rect: sectionRect(inst.template, inst.path) }), { maxW, maxH, minScale });
  host.toggleAttribute('data-empty', !size); // 펼침 · 탭 · 호버 상태라 원본 화면에서 접혀 있는 구역
  if (!size) unthumb(host); // 보여 줄 것이 없으면 그려 둔 페이지를 비운다
  return size;
}
/** 대표로 보여 줄 자리 — 원본 화면에서 보이는(잰 상자가 있는) 첫 자리 */
const shownInstance = (o) => o.instances.find((i) => sectionRect(i.template, i.path)) || o.instances[0];
/** 넓고 낮은 구역(머리줄 · 이벤트 로그 · 표)은 한 칸에 넣으면 글자를 못 읽을 만큼 줄어든다 → 두 칸 · 한 줄 전체로.
    그린 뒤의 크기(칠해진 범위로 좁힌 것)로 정한다 — 구역 상자는 화면 폭이어도 글자는 왼쪽에만 있는 경우가 많다 */
function spanCard(card, size) {
  const ratio = size ? size.width / Math.max(1, size.height) : 0;
  card.classList.toggle('spanall', !!size && size.width >= 1300 && ratio >= 5);
  card.classList.toggle('span2', !!size && !card.classList.contains('spanall') && size.width >= 650 && ratio >= 2.4);
}
const orgCard = (o, hit = null) => `<a class="atm-card" href="#${P.org(o.id)}" data-id="${o.id}">
    <div class="atm-thumb" aria-hidden="true"></div>
    <div class="atm-meta">
      <div class="atm-name">${orgTitle(o)}</div>
      <div class="atm-sample">${esc(o.names.length > 1 ? o.names.slice(0, 3).join(' · ') + (o.names.length > 3 ? ` 외 ${o.names.length - 3}` : '') : pageName(o.instances[0].template))}</div>
      ${hitNote(hit) && hit.label !== '페이지' ? `<div class="atm-hit">${esc(hitNote(hit))}</div>` : ''}
      <div class="atm-stats"><span>${esc(S.lib.families[o.family] || o.family)}${o.families.length > 1 ? ` 외 ${o.families.length - 1}` : ''}</span><span>${o.instanceCount}곳에 쓰임</span><span>분자 ${o.molecules.length}종</span>${o.top ? '' : '<span>구역 안</span>'}</div>
    </div></a>`;

async function organismsPage(view) {
  const L = await levelsData();
  const { families } = S.lib;
  const st = S.ofilter;
  const page = h(`<section class="atm-lib">
    <aside class="atm-filters">
      <div class="lc-searchwrap"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /></svg><input type="text" id="oq" placeholder="이름 · 문구 · 페이지 검색 (예: 이벤트, 표)" value="${esc(st.q)}" aria-label="유기체 검색"></div>
      <h3>프로젝트</h3><ul class="atm-facet" id="ofam"></ul>
      <h3>놓인 곳</h3><ul class="atm-facet" id="owhere"></ul>
      <h3>분류 <small>원본 레이어 이름</small></h3><ul class="atm-facet" id="ocat"></ul>
    </aside>
    <div class="atm-libmain">
      <details class="atm-about"><summary>유기체란?</summary><p class="atm-hint">유기체는 분자 · 원자를 여러 개 품은 구역입니다 — 원본 레이어 이름이 구역(Widget/… · Header · Event Log · Table · List · Legend …)이고 안에 부품이 여럿인 것.
        바탕 · 감싸개(Background · Body · Content · Column · Row …)와 분자 크기의 이름(Title · Label · Menu Item/… )은 구역으로 세지 않고, 같은 분류에 보이는 틀(배경 · 테두리 · 배치 · 안의 분자 종류)이 같으면 하나로 묶었습니다.</p></details>
      <div class="atm-progress" id="measure" hidden><span></span><i></i></div>
      <div class="atm-gridbar"><span class="atm-count" id="gcount"></span></div>
      <div class="atm-grid atm-ogrid" id="grid"></div>
    </div>
  </section>`);
  view.append(page);
  page.querySelector('.atm-gridbar').append(sizeToggle());
  const grid = page.querySelector('#grid');
  const all = L.organisms;
  const inFam = (o) => !st.family || o.families.includes(st.family);
  const inWhere = (o) => !st.where || (st.where === 'top' ? o.top : !o.top);
  const docs = new Map(all.map((o) => [o.id, organismDoc(o)]));
  const facet = (el, key, entries, total, labelOf = (k) => k) => {
    el.innerHTML = `<li><button type="button" data-${key}="" aria-pressed="${!st[key]}">전체 <em>${total}</em></button></li>` +
      entries.map(([k, n]) => `<li><button type="button" data-${key}="${esc(k)}" aria-pressed="${st[key] === k}">${esc(labelOf(k))} <em>${n}</em></button></li>`).join('');
  };
  const renderFacets = () => {
    const tally = (list, fn) => { const c = {}; list.forEach((o) => [].concat(fn(o)).forEach((k) => (c[k] = (c[k] || 0) + 1))); return c; };
    const fc = tally(all.filter((o) => (!st.cat || o.category === st.cat) && inWhere(o)), (o) => o.families);
    facet(page.querySelector('#ofam'), 'family', Object.keys(families).map((k) => [k, fc[k] || 0]), all.filter((o) => (!st.cat || o.category === st.cat) && inWhere(o)).length, (k) => families[k]);
    const base = all.filter((o) => inFam(o) && (!st.cat || o.category === st.cat));
    facet(page.querySelector('#owhere'), 'where', [['top', base.filter((o) => o.top).length], ['inner', base.filter((o) => !o.top).length]], base.length, (k) => (k === 'top' ? '페이지에 바로' : '다른 구역 안'));
    const cc = tally(all.filter((o) => inFam(o) && inWhere(o)), (o) => o.category);
    facet(page.querySelector('#ocat'), 'cat', Object.entries(cc).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])), all.filter((o) => inFam(o) && inWhere(o)).length);
  };
  let io = null;
  const renderGrid = () => {
    io?.stop();
    const found = rank(all.filter((o) => inFam(o) && inWhere(o) && (!st.cat || o.category === st.cat)).map((o) => docs.get(o.id)), st.q, (a, b) => b.instanceCount - a.instanceCount);
    const list = found.map((r) => r.item);
    page.querySelector('#gcount').textContent = `유기체 ${list.length.toLocaleString()}개${st.q.trim() ? ` · ‘${st.q.trim()}’ 잘 맞는 순` : ''}`;
    grid.innerHTML = list.length ? '' : `<div class="atm-empty">${st.q.trim() ? `‘${esc(st.q.trim())}’에 맞는 유기체가 없습니다.` : '조건에 맞는 유기체가 없습니다.'}</div>`;
    if (!list.length) elsewhere(grid.querySelector('.atm-empty'), 'organism');
    const cards = found.slice(0, 400).map((r) => h(orgCard(r.item, r.hit)));
    grid.append(...cards);
    if (list.length > 400) grid.append(h(`<div class="atm-empty">앞의 400개만 보여 줍니다 (전체 ${list.length}개)</div>`));
    const byId = new Map(list.map((o) => [o.id, o]));
    io = lazyLive(view.closest('.lc-main'), (card) => organismThumb(card.querySelector('.atm-thumb'), shownInstance(byId.get(card.dataset.id)), { maxW: 2000, maxH: 130, minScale: 0.4 }).then((size) => spanCard(card, size)).catch((e) => console.warn(card.dataset.id, e)),
      (card) => unthumb(card.querySelector('.atm-thumb')));
    cards.forEach((c) => io.watch(c));
  };
  page.querySelector('#oq').addEventListener('input', (e) => { st.q = e.target.value; renderGrid(); levelHits(view); });
  page.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-family],button[data-where],button[data-cat]'); if (!b) return;
    for (const k of ['family', 'where', 'cat']) if (b.dataset[k] !== undefined) st[k] = b.dataset[k];
    renderFacets(); renderGrid();
  });
  renderFacets(); renderGrid();
  measureAll(page.querySelector('#measure'));
  const fr = view.closest('.atm-frame');
  const onTheme = () => renderGrid();
  fr.addEventListener('atm-theme', onTheme);
  cleanup = () => { io?.stop(); fr.removeEventListener('atm-theme', onTheme); };
}

async function organismPage(view, id) {
  const L = await levelsData();
  const o = L.organisms.find((x) => x.id === id);
  if (!o) throw new Error('없는 유기체입니다: ' + id);
  const { families, roles } = S.lib;
  const byId = new Map(L.organisms.map((x) => [x.id, x]));
  let current = Math.max(0, o.instances.indexOf(shownInstance(o)));
  const page = h(`<section class="atm-mol">
    <nav class="lc-crumb" aria-label="위치"><a class="lc-crumb-root" href="#${P.organisms}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6" /></svg>유기체 목록</a><span class="lc-crumb-sep" aria-hidden="true">/</span><span class="lc-crumb-cur">${esc(families[o.family] || o.family)}</span></nav>
    <div class="atm-molhead">
      <h2>${orgTitle(o)} <span class="atm-lvchip">유기체</span></h2>
      <div class="atm-stats"><span>${o.instanceCount}곳에 쓰임</span><span>페이지 ${o.templates.length}</span><span>분자 ${o.molecules.length}종 · ${o.molecules.reduce((s, m) => s + m.n, 0)}개</span><span>따로 선 글자 ${o.texts}</span><span>그림 ${o.icons}</span><span>${o.top ? '페이지에 바로 놓임' : '다른 구역 안'}</span></div>
      ${o.names.length > 1 ? `<div class="atm-names" title="합쳐진 원본 레이어 이름">${o.names.slice(0, 12).map((n) => `<span>${esc(n)}</span>`).join('')}${o.names.length > 12 ? `<span>외 ${o.names.length - 12}</span>` : ''}</div>` : ''}
      <button type="button" class="atm-mid" data-copy="${esc(o.id)}" title="유기체 id: ${esc(o.id)} — 누르면 복사">id 복사</button>
      <div class="atm-actions"><button type="button" class="atm-btn primary" id="place" aria-haspopup="menu">조립 화면에 넣기</button><button type="button" class="atm-btn ghost" id="png">PNG 저장</button></div>
    </div>
    <div class="atm-molbody">
      <div>
        <div class="atm-stagebox"><div class="atm-thumb atm-preview" id="preview"></div><div class="atm-capbar"><div class="atm-cap" id="cap"></div></div></div>
        <h3>${o.instanceCount}곳에 쓰임 <small>같은 유기체가 놓인 자리 — 누르면 위에 크게 봅니다. 안의 문구 · 분자 개수는 자리마다 다를 수 있습니다.</small></h3>
        <div class="atm-variants" id="insts"></div>
      </div>
      <div class="atm-side"><div class="atm-panel" id="parts"></div></div>
    </div>
  </section>`);
  view.append(page);
  const preview = page.querySelector('#preview'), cap = page.querySelector('#cap');
  page.querySelector('.atm-capbar').append(sizeToggle());
  // 보기 칸 높이를 유기체 비율에 맞춘다 — 넓고 낮은 구역(이벤트 로그 · 머리줄)이 큰 빈 칸 가운데 얇은 띠로 보이지 않게
  const fitBox = (size) => { const k = Math.min(S.size === 'real' ? 1 : 2.5, (preview.clientWidth - 24) / size.width); preview.style.height = Math.round(Math.max(120, Math.min(460, size.height * k + 28))) + 'px'; fitThumb(preview); };
  page.addEventListener('atm-size', () => { const t = preview._atmThumb; if (t) fitBox({ width: t.w, height: t.h }); });
  const draw = async () => {
    const inst = o.instances[current];
    const size = await organismThumb(preview, inst, { maxW: 2000, maxH: 440 });
    if (size) fitBox(size);
    cap.textContent = `${pageName(inst.template)} · ${inst.name}${size ? ` · ${size.width}×${size.height}px` : ' · 원본에서 보이지 않는 구역'}`;
  };
  const insts = page.querySelector('#insts');
  const vio = lazyLive(view.closest('.lc-main'), (el) => organismThumb(el.querySelector('.atm-thumb'), o.instances[+el.dataset.i], { maxW: 190, maxH: 84, minScale: 0.22 }), (el) => unthumb(el.querySelector('.atm-thumb')));
  o.instances.forEach((inst, i) => {
    const el = h(`<button type="button" class="atm-vcard" data-i="${i}" aria-pressed="${i === current}"><div class="atm-thumb"></div><span>${esc(pageName(inst.template))}</span><em>${esc(inst.name)}</em></button>`);
    insts.append(el); vio.watch(el);
  });
  // 가져다 쓰기 — 지금 크게 보는 자리의 모습 그대로
  page.querySelector('#png').addEventListener('click', (e) => savePng(preview.querySelector('.mhost'), `${o.name} ${pageName(o.instances[current].template)}`, e.currentTarget));
  page.querySelector('#place').addEventListener('click', (e) => placeMenu(e.currentTarget, () => {
    const host = preview.querySelector('.mhost');
    return { name: o.name + ' 조립', data: { id: newItemId(), organism: o.id, inst: current, ...centerOn(+host?.dataset.w || 600, +host?.dataset.h || 300) } };
  }));
  insts.addEventListener('click', (e) => {
    const b = e.target.closest('.atm-vcard'); if (!b) return;
    current = +b.dataset.i;
    insts.querySelectorAll('.atm-vcard').forEach((x) => x.setAttribute('aria-pressed', x === b));
    draw();
  });
  const molLink = ({ id: mid, n }) => { const m = S.molecules.get(mid); return m ? `<li><a href="#${P.mol(mid)}">${esc(m.name)}</a> <small>${m.level === 'atom' ? '원자' : esc(roles[m.role] || m.role)} · ${n}개</small></li>` : ''; };
  const orgLink = (oid) => { const x = byId.get(oid); return x ? `<li><a href="#${P.org(oid)}">${orgLinkText(x)}${x.instanceCount}곳에 쓰임</small></li>` : ''; };
  page.querySelector('#parts').innerHTML = `
    <h4>들어 있는 분자 · 원자 <small>${o.molecules.length}종 · 개수는 한 자리에 가장 많이 든 수</small></h4>
    ${o.molecules.length ? `<ul class="atm-links">${o.molecules.map(molLink).join('')}</ul>` : '<p class="atm-hint">분자 없이 글자 · 그림만 있는 구역입니다.</p>'}
    ${o.children.length ? `<h4>안쪽 유기체 <small>${o.children.length}</small></h4><ul class="atm-links">${o.children.map(orgLink).join('')}</ul>` : ''}
    ${o.parents.length ? `<h4>이 유기체를 품은 유기체 <small>${o.parents.length}</small></h4><ul class="atm-links">${o.parents.map(orgLink).join('')}</ul>` : ''}
    <h4>페이지 <small>${o.templates.length}</small></h4><ul class="atm-links">${o.templates.map((t) => `<li><a href="#${P.page(t)}">${esc(pageName(t))}</a></li>`).join('')}</ul>`;
  await draw();
  const fr = view.closest('.atm-frame');
  const onTheme = () => { draw(); insts.querySelectorAll('.atm-vcard').forEach((el) => { if (el._live) organismThumb(el.querySelector('.atm-thumb'), o.instances[+el.dataset.i], { maxW: 190, maxH: 84, minScale: 0.22 }); }); };
  fr.addEventListener('atm-theme', onTheme);
  cleanup = () => { vio.stop(); fr.removeEventListener('atm-theme', onTheme); };
}

/* ── 템플릿 — 페이지에서 내용을 뺀 틀 ──
   페이지 루트 바로 아래 구역(Header · Breadcrumb · Content · Event Log …)의 짜임이 같으면 같은 틀이다(서버 lib/levels.mjs).
   팝업 · 대화상자 · 툴팁은 페이지의 상태라 틀에 넣지 않는다. 그림은 원본 페이지에서 잰 구역 상자로 그린 와이어프레임이다. */
function wireframe(pageId, { inner = true, focus = null } = {}) {
  const pg = S.levels.pages[pageId], rects = S.measures[pageId]?.rects || {};
  const el = h(`<div class="atm-wire" data-mode="${S.theme.mode}"></div>`);
  const box = (b, cls, label, key) => {
    const d = h(`<div class="${cls}"${key ? ` data-k="${key}"` : ''}>${label ? `<b>${esc(label)}</b>` : ''}</div>`);
    Object.assign(d.style, { left: b.x + 'px', top: b.y + 'px', width: b.w + 'px', height: b.h + 'px' });
    el.append(d);
  };
  const regionKeys = new Set();
  for (const r of pg.regions) {
    if (r.kind === 'backdrop') continue;
    const k = r.path.join('.'), b = rects[k];
    if (!b) continue;
    regionKeys.add(k);
    box(b, `w-region w-${r.kind}${r.overlay ? ' w-overlay' : ''}${focus === k ? ' focus' : ''}`, r.name || (r.kind === 'molecule' ? '분자' : ''), k);
  }
  if (inner) for (const s of pg.sections) {
    const k = s.path.join('.');
    if (!s.top || regionKeys.has(k) || !rects[k]) continue;
    box(rects[k], 'w-org' + (focus === k ? ' focus' : ''), catOfName(s.name), k);
  }
  return el;
}
const wireThumb = (host, pageId, opts, size) => thumbMount(host, (inner) => { inner.replaceChildren(wireframe(pageId, opts)); return { width: 1920, height: 1080 }; }, size);
/** 틀 이름 — 구역 이름을 화면에서 놓인 순서(위 → 아래, 왼쪽 → 오른쪽)로. 재기 전에는 원본 레이어 순서 */
function layoutTitle(l) {
  const pg = S.levels?.pages?.[l.pages[0]], rects = S.measures[l.pages[0]]?.rects;
  const regs = pg ? pg.regions.filter((r) => r.kind !== 'backdrop' && !r.overlay) : [];
  let names = l.regions;
  if (rects && regs.length === l.regions.length) {
    const at = (i) => rects[regs[i].path.join('.')] || { x: 1e5, y: 1e5, w: 0, h: 0 };
    // 세로로 절반 넘게 겹치면 나란히 놓인 것 — 왼쪽부터. 아니면 위부터
    const cmp = (a, b) => (Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 0.5 * Math.min(a.h, b.h) ? a.x - b.x : a.y - b.y);
    names = l.regions.map((n, i) => ({ n, b: at(i) })).sort((a, b) => cmp(a.b, b.b)).map((x) => x.n);
  }
  return names.map((n) => (n === '-' ? '(이름 없음)' : n.replace(/^M:/, ''))).join(' · ') || '(구역 없음)';
}

async function templatesPage(view) {
  const L = await levelsData();
  const { families } = S.lib;
  const page = h(`<section class="atm-tpls">
    <details class="atm-about"><summary>템플릿이란?</summary><p class="atm-hint">템플릿은 페이지에서 내용을 뺀 틀입니다. 페이지 바로 아래 구역(Header · Breadcrumb · Content · Event Log …)의 짜임이 같으면 같은 틀로 묶었고,
      화면 위에 띄운 팝업 · 대화상자 · 툴팁은 페이지의 상태라 틀에 넣지 않았습니다. 그림은 원본 페이지에서 잰 구역 상자입니다.</p></details>
    <div class="atm-progress" id="measure" hidden><span></span><i></i></div>
    <div id="tbody"></div>
  </section>`);
  view.append(page);
  const body = page.querySelector('#tbody');
  const render = () => {
    body.innerHTML = '';
    const byFam = new Map();
    for (const l of L.layouts) { if (!byFam.has(l.family)) byFam.set(l.family, []); byFam.get(l.family).push(l); }
    for (const f of Object.keys(families)) {
      const list = byFam.get(f);
      if (!list) continue;
      const sec = h(`<section><h3>${esc(families[f])} <small>틀 ${list.length} · 페이지 ${list.reduce((s, l) => s + l.pages.length, 0)}</small></h3><div class="atm-grid wide"></div></section>`);
      const grid = sec.querySelector('.atm-grid');
      for (const l of list) {
        const card = h(`<a class="atm-card" href="#${P.tpl(l.id)}"><div class="atm-thumb wire" aria-hidden="true"></div><div class="atm-meta"><div class="atm-name">${esc(layoutTitle(l))}</div>
          <div class="atm-stats"><span>${l.root === 'Popup' ? '팝업' : '화면'}</span><span>페이지 ${l.pages.length}</span></div><div class="atm-sample">${esc(l.pages.map(pageName).join(' · '))}</div></div></a>`);
        grid.append(card);
        wireThumb(card.querySelector('.atm-thumb'), l.pages[0], { inner: false }, { maxW: 600, maxH: 340 });
      }
      body.append(sec);
    }
  };
  render();
  measureAll(page.querySelector('#measure')).then(() => { if (page.isConnected) render(); });
  const fr = view.closest('.atm-frame');
  const onTheme = () => render();
  fr.addEventListener('atm-theme', onTheme);
  cleanup = () => fr.removeEventListener('atm-theme', onTheme);
}

async function templatePage(view, id) {
  const L = await levelsData();
  const l = L.layouts.find((x) => x.id === id);
  if (!l) throw new Error('없는 템플릿입니다: ' + id);
  const { families } = S.lib;
  let current = l.pages[0], inner = false;
  const page = h(`<section class="atm-mol">
    <nav class="lc-crumb" aria-label="위치"><a class="lc-crumb-root" href="#${P.templates}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6" /></svg>템플릿 목록</a><span class="lc-crumb-sep" aria-hidden="true">/</span><span class="lc-crumb-cur">${esc(families[l.family] || l.family)}</span></nav>
    <div class="atm-molhead">
      <h2>${esc(layoutTitle(l))} <span class="atm-lvchip">템플릿</span></h2>
      <div class="atm-stats"><span>${l.root === 'Popup' ? '팝업' : '화면'}</span><span>페이지 ${l.pages.length}</span><span>구역 ${l.regions.length}</span></div>
      <button type="button" class="atm-mid" data-copy="${esc(l.id)}" title="템플릿 id: ${esc(l.id)} — 누르면 복사">id 복사</button>
    </div>
    <div class="atm-molbody">
      <div>
        <div class="atm-stagebox"><div class="atm-thumb atm-preview wire" id="preview"></div><div class="atm-cap" id="cap"></div></div>
        <div class="atm-ntools atm-wtools"><div class="atm-seg" role="group" aria-label="보기" id="wmode"><button type="button" data-inner="0">틀만</button><button type="button" data-inner="1">유기체 자리까지</button></div></div>
        <h3>이 틀을 쓰는 페이지 ${l.pages.length} <small>누르면 그 페이지의 구역 상자로 봅니다</small></h3>
        <div class="atm-variants wide" id="pgs"></div>
      </div>
      <div class="atm-side"><div class="atm-panel" id="side"></div></div>
    </div>
  </section>`);
  view.append(page);
  const preview = page.querySelector('#preview'), side = page.querySelector('#side');
  const draw = async () => {
    await wireThumb(preview, current, { inner }, { maxW: 2000, maxH: 460 });
    page.querySelectorAll('#wmode [data-inner]').forEach((b) => b.setAttribute('aria-pressed', (b.dataset.inner === '1') === inner));
    page.querySelector('#cap').textContent = `${pageName(current)} — 점선 = 구역${inner ? ', 실선 = 구역 안 유기체 자리' : ''}`;
    const pg = L.pages[current];
    side.innerHTML = `<h4>구역 <small>${pageName(current)}</small></h4>
      <ul class="atm-links">${pg.regions.filter((r) => r.kind !== 'backdrop').map((r) => `<li>${r.organism ? `<a href="#${P.org(r.organism)}">${esc(r.name)}</a>` : esc(r.name || '(이름 없음)')} <small>${r.overlay ? '화면 위에 띄움 · 틀 밖' : r.kind === 'organism' ? '유기체' : r.kind === 'layout' ? '배치 칸' : r.kind === 'molecule' ? '분자' : '구역'}</small></li>`).join('')}</ul>
      <p class="atm-hint"><a class="atm-link" href="#${P.page(current)}">이 페이지 보기 →</a></p>`;
  };
  page.querySelector('#wmode').addEventListener('click', (e) => { const b = e.target.closest('[data-inner]'); if (!b) return; inner = b.dataset.inner === '1'; draw(); });
  const pgs = page.querySelector('#pgs');
  const vio = lazyLive(view.closest('.lc-main'), async (el) => thumbMount(el.querySelector('.atm-thumb'), async (hostEl) => mountPage(hostEl, { template: await templateData(el.dataset.p), theme: S.theme }), { maxW: 300, maxH: 170 }),
    (el) => unthumb(el.querySelector('.atm-thumb')));
  for (const p of l.pages) {
    const el = h(`<button type="button" class="atm-vcard" data-p="${esc(p)}" aria-pressed="${p === current}"><div class="atm-thumb pg"></div><span>${esc(pageName(p))}</span></button>`);
    pgs.append(el); vio.watch(el);
  }
  pgs.addEventListener('click', (e) => { const b = e.target.closest('.atm-vcard'); if (!b) return; current = b.dataset.p; pgs.querySelectorAll('.atm-vcard').forEach((x) => x.setAttribute('aria-pressed', x === b)); draw(); });
  await draw();
  measureAll(h('<div><span></span><i></i></div>')).then(() => { if (page.isConnected) draw(); });
  const fr = view.closest('.atm-frame');
  const onTheme = () => draw();
  fr.addEventListener('atm-theme', onTheme);
  cleanup = () => { vio.stop(); fr.removeEventListener('atm-theme', onTheme); };
}

/* ── 페이지 — 원본 화면 그대로 ──
   템플릿(틀)에 유기체 · 분자 · 원자가 실제 내용으로 채워진 것. 조립 화면에서 만든 화면도 페이지다. */
async function pagesPage(view) {
  const L = await levelsData();
  const screens = await api('api/screens').catch(() => []);
  const { families } = S.lib;
  const page = h(`<section class="atm-pages">
    <details class="atm-about"><summary>페이지란?</summary><p class="atm-hint">페이지는 원본 화면 그대로입니다 — 템플릿(틀)의 구역에 유기체 · 분자 · 원자가 실제 내용으로 채워진 것. 조립 화면에서 만든 화면도 페이지입니다.</p></details>
    <div id="pbody"></div>
  </section>`);
  view.append(page);
  const body = page.querySelector('#pbody');
  const byFam = new Map();
  for (const t of S.lib.templates) { if (!byFam.has(t.family)) byFam.set(t.family, []); byFam.get(t.family).push(t); }
  const cards = [];
  for (const f of Object.keys(families)) {
    const list = byFam.get(f);
    if (!list) continue;
    const sec = h(`<section><h3>${esc(families[f])} <small>페이지 ${list.length}</small></h3><div class="atm-grid wide"></div></section>`);
    const grid = sec.querySelector('.atm-grid');
    for (const t of list) {
      const pg = L.pages[t.id];
      const card = h(`<a class="atm-card" href="#${P.page(t.id)}" data-p="${esc(t.id)}"><div class="atm-thumb pg" aria-hidden="true"></div><div class="atm-meta"><div class="atm-name">${esc(t.name)} <span class="atm-role">${pg?.kind === 'popup' ? '팝업' : '화면'}</span></div>
        <div class="atm-stats"><span>유기체 ${pg?.sections.length ?? 0}</span><span>분자 ${pg?.molecules ?? t.instanceCount}</span><span>${t.defaultTheme === 'dark' ? '다크' : '라이트'}</span></div></div></a>`);
      grid.append(card); cards.push(card);
    }
    body.append(sec);
  }
  body.append(h(`<section><h3>내 조립 화면 <small>${screens.length}</small></h3>
    <div class="atm-slist">${screens.length ? screens.map((s) => `<div class="atm-srow"><a href="#${P.screen(s.id)}"><b>${esc(s.name)}</b><span>${s.kind === 'template' ? '페이지 · ' + esc(pageName(s.template)) : '빈 캔버스'}</span><time>${new Date(s.updatedAt).toLocaleString('ko-KR')}</time></a></div>`).join('') : '<div class="atm-empty">아직 저장한 조립 화면이 없습니다. 조립 화면 탭에서 만들 수 있습니다.</div>'}</div></section>`));
  const io = lazyLive(view.closest('.lc-main'), async (card) => thumbMount(card.querySelector('.atm-thumb'), async (hostEl) => mountPage(hostEl, { template: await templateData(card.dataset.p), theme: S.theme }), { maxW: 600, maxH: 340 }),
    (card) => unthumb(card.querySelector('.atm-thumb')));
  cards.forEach((c) => io.watch(c));
  const fr = view.closest('.atm-frame');
  const onTheme = () => cards.forEach((c) => { if (c._live) thumbMount(c.querySelector('.atm-thumb'), async (hostEl) => mountPage(hostEl, { template: await templateData(c.dataset.p), theme: S.theme }), { maxW: 600, maxH: 340 }); });
  fr.addEventListener('atm-theme', onTheme);
  cleanup = () => { io.stop(); fr.removeEventListener('atm-theme', onTheme); };
}

async function pagePage(view, id) {
  const L = await levelsData();
  const pg = L.pages[id];
  if (!pg) throw new Error('없는 페이지입니다: ' + id);
  const { families } = S.lib;
  const layout = L.layouts.find((x) => x.id === pg.layout);
  const byId = new Map(L.organisms.map((o) => [o.id, o]));
  let showBoxes = true, hot = null;
  const tops = pg.sections.filter((s) => s.top);
  const page = h(`<section class="atm-mol">
    <nav class="lc-crumb" aria-label="위치"><a class="lc-crumb-root" href="#${P.pages}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6" /></svg>페이지 목록</a><span class="lc-crumb-sep" aria-hidden="true">/</span><span class="lc-crumb-cur">${esc(families[pg.family] || pg.family)}</span></nav>
    <div class="atm-molhead">
      <h2>${esc(pg.name)} <span class="atm-role">${pg.kind === 'popup' ? '팝업' : '화면'}</span> <span class="atm-lvchip">페이지</span></h2>
      <div class="atm-stats"><span>유기체 ${pg.sections.length} (페이지에 바로 ${tops.length})</span><span>분자 ${pg.molecules}</span><span>따로 선 글자 ${pg.texts}</span><span>그림 ${pg.icons}</span></div>
      <button type="button" class="atm-mid" data-copy="${esc(id)}" title="페이지 id: ${esc(id)} — 누르면 복사">id 복사</button>
    </div>
    <div class="atm-molbody">
      <div>
        <div class="atm-stagebox"><div class="atm-thumb atm-preview pgview" id="preview"></div><div class="atm-cap" id="cap"></div></div>
        <div class="atm-ntools atm-wtools"><label class="atm-check"><input type="checkbox" id="boxes" checked> 유기체 자리 표시</label><button type="button" class="atm-btn ghost" id="png">PNG 저장</button><button type="button" class="atm-btn primary" id="open">조립 화면으로 열기</button></div>
      </div>
      <div class="atm-side"><div class="atm-panel" id="side"></div></div>
    </div>
  </section>`);
  view.append(page);
  const preview = page.querySelector('#preview');
  // 유기체 자리 — 페이지(섀도 DOM) 위에 겹쳐 그린다. 섀도 DOM 안이라 스타일은 직접 넣는다
  const paintBoxes = () => {
    const fr = preview.querySelector('.mhost')?.shadowRoot?.querySelector('.wa-frame');
    if (!fr) return;
    fr.querySelector('.wa-orgs')?.remove();
    if (!showBoxes) return;
    const rects = S.measures[id]?.rects || {};
    const ov = document.createElement('div');
    ov.className = 'wa-orgs';
    ov.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:2147483646';
    for (const s of pg.sections) {
      const k = s.path.join('.'), b = rects[k];
      if (!b || (!s.top && hot !== k)) continue;
      const on = hot === k;
      const d = document.createElement('div');
      d.style.cssText = `position:absolute;left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px;box-sizing:border-box;border:${on ? 4 : 2}px ${on ? 'solid' : 'dashed'} ${on ? '#ffd166' : 'rgba(124,92,255,.95)'};background:${on ? 'rgba(255,209,102,.12)' : 'transparent'};border-radius:4px`;
      const tag = document.createElement('span');
      tag.textContent = catOfName(s.name);
      tag.style.cssText = `position:absolute;left:-2px;top:-2px;transform:translateY(-100%);font:600 20px/1.3 sans-serif;padding:2px 8px;border-radius:4px 4px 0 0;background:${on ? '#ffd166' : 'rgba(124,92,255,.95)'};color:${on ? '#222' : '#fff'};white-space:nowrap`;
      if (b.y < 30) tag.style.transform = 'none';
      d.append(tag); ov.append(d);
    }
    fr.append(ov);
  };
  const draw = async () => {
    await thumbMount(preview, async (hostEl) => mountPage(hostEl, { template: await templateData(id), theme: S.theme }), { maxW: 2000, maxH: 560 });
    paintBoxes();
    page.querySelector('#cap').textContent = `${pageName(id)} · 1920×1080`;
  };
  const side = page.querySelector('#side');
  const orgItem = (s) => { const o = byId.get(s.organism); return `<li data-k="${s.path.join('.')}"><a href="#${P.org(s.organism)}">${esc(s.name)}</a> <small>${esc(o?.category || catOfName(s.name))}${o && o.instanceCount > 1 ? ` · ${o.instanceCount}곳에 쓰임` : ''}</small></li>`; };
  const innerOf = (s) => pg.sections.filter((x) => !x.top && x.path.length > s.path.length && s.path.every((v, i) => x.path[i] === v));
  side.innerHTML = `
    <h4>템플릿 <small>이 페이지의 틀</small></h4>
    ${layout ? `<a class="atm-wirelink" href="#${P.tpl(layout.id)}"><div class="atm-thumb wire" id="wire"></div><span>${esc(layoutTitle(layout))}</span><small>이 틀을 쓰는 페이지 ${layout.pages.length}</small></a>` : ''}
    <h4>유기체 <small>페이지에 바로 놓인 것 ${tops.length} · 안쪽 ${pg.sections.length - tops.length}</small></h4>
    <ul class="atm-links atm-orglist">${tops.map((s) => { const kids = innerOf(s); return orgItem(s) + (kids.length ? `<ul>${kids.map(orgItem).join('')}</ul>` : ''); }).join('')}</ul>
    <p class="atm-hint">목록에 마우스를 올리면 페이지에서 그 자리를 보여 줍니다.</p>`;
  side.addEventListener('mouseover', (e) => { const li = e.target.closest('[data-k]'); const k = li?.dataset.k || null; if (k !== hot) { hot = k; paintBoxes(); } });
  side.addEventListener('mouseleave', () => { hot = null; paintBoxes(); });
  page.querySelector('#boxes').addEventListener('change', (e) => { showBoxes = e.target.checked; paintBoxes(); });
  page.querySelector('#open').addEventListener('click', async () => { try { await newTemplateScreen(id); } catch (err) { fail(err); } });
  page.querySelector('#png').addEventListener('click', async (e) => {
    const was = showBoxes; showBoxes = false; paintBoxes();
    await savePng(preview.querySelector('.mhost'), pg.name, e.currentTarget);
    showBoxes = was; paintBoxes();
  });
  await draw();
  if (layout) wireThumb(side.querySelector('#wire'), layout.pages[0], { inner: false }, { maxW: 320, maxH: 180 });
  measureAll(h('<div><span></span><i></i></div>')).then(() => { if (page.isConnected) { paintBoxes(); if (layout) wireThumb(side.querySelector('#wire'), layout.pages[0], { inner: false }, { maxW: 320, maxH: 180 }); } });
  const fr = view.closest('.atm-frame');
  const onTheme = () => draw();
  fr.addEventListener('atm-theme', onTheme);
  cleanup = () => fr.removeEventListener('atm-theme', onTheme);
}

/* ── 검증 — 모든 분자를 따로 그려 원래 템플릿 안에서와 같은지 확인 (js/atomic/verify.js) ── */
async function verifyPage(view) {
  const page = h(`<section class="atm-verify">
    <p class="atm-hint">분자 ${S.lib.molecules.length}개의 모든 변형(원본 조각 + 떼어 낸 심볼 · 라벨)을 하나씩 따로 그려, 원래 페이지 안에서 잰 글자 위치와 비교합니다.
      위치가 2px 넘게 다르거나, 보이는 글자끼리 새로 겹치거나, 보여 주는 상자 밖으로 잘리면 문제로 표시합니다. 1분 남짓 걸립니다.</p>
    <div class="lc-tools"><button type="button" class="lc-new" id="run">전체 검사 실행</button><span class="atm-hint" id="state"></span></div>
    <div id="out"></div>
  </section>`);
  view.append(page);
  const out = page.querySelector('#out'), state = page.querySelector('#state'), run = page.querySelector('#run');
  run.addEventListener('click', async () => {
    run.disabled = true; out.innerHTML = ''; state.textContent = '준비 중…';
    try {
      const { verifyAll } = await import('./verify.js');
      const measures = await api('api/measure');
      const res = await verifyAll({ lib: S.lib, measures, onProgress: (n, t) => (state.textContent = `검사 중 ${n}/${t}`) });
      const errors = res.issues.filter((i) => !i.kind.startsWith('참고')), notes = res.issues.filter((i) => i.kind.startsWith('참고'));
      state.textContent = `${res.checked.toLocaleString()}개 검사 · 문제 ${errors.length}건 · 참고 ${notes.length}건`;
      const group = (list) => {
        const by = new Map();
        for (const i of list) { const k = i.kind + '|' + i.molecule; if (!by.has(k)) by.set(k, { ...i, n: 0, details: new Set() }); const g = by.get(k); g.n++; g.details.add(i.detail); }
        return [...by.values()].sort((a, b) => b.n - a.n);
      };
      const rows = (list) => group(list).map((g) => `<li><span class="atm-vkind">${esc(g.kind)}</span> <a href="#${P.mol(g.molecule)}">${esc(g.name)}</a> <small>${esc(S.lib.roles[g.role] || g.role)} · ${g.n}건</small><div class="atm-hint">${[...g.details].slice(0, 3).map(esc).join(' / ')}</div></li>`).join('');
      out.innerHTML = (errors.length ? `<h3>문제 ${errors.length}건</h3><ul class="atm-vlist">${rows(errors)}</ul>` : '<div class="atm-vok">문제 없음 — 모든 분자가 원래 페이지 안에서와 같은 위치 · 크기로 그려집니다.</div>')
        + (notes.length ? `<h3>참고 ${notes.length}건</h3><ul class="atm-vlist">${rows(notes)}</ul>` : '');
    } catch (e) { fail(e); state.textContent = '검사 실패'; }
    run.disabled = false;
  });
}

/* ── 3. 조립 화면 목록 ── */
async function newTemplateScreen(tid) {
  const t = S.templates.get(tid);
  const s = await api('api/screens', { method: 'POST', body: { kind: 'template', template: tid, name: t.name, theme: { mode: t.defaultTheme, seed: null } } });
  go(P.screen(s.id));
}
async function screensPage(view) {
  const list = await api('api/screens');
  const { families } = S.lib;
  const byFam = {};
  S.lib.templates.forEach((t) => (byFam[t.family] = byFam[t.family] || []).push(t));
  const stale = (s) => Object.entries(s.pins || {}).filter(([mid, v]) => cmpVer(latestOf(mid), v) > 0).length;
  const page = h(`<section class="atm-screens">
    <div class="lc-tools"><button type="button" class="lc-new" id="newCanvas"><svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>빈 캔버스</button>
      <span class="atm-hint">원본 페이지에서 시작하거나, 빈 캔버스에 분자를 끌어다 조립합니다. 저장한 화면은 쓰는 분자의 버전을 고정합니다.</span></div>
    <h3>내 조립 화면 <small>${list.length}개</small></h3>
    <div class="atm-slist">${list.length ? list.map((s) => `<div class="atm-srow"><a href="#${P.screen(s.id)}"><b>${esc(s.name)}</b><span>${s.kind === 'template' ? '페이지 · ' + esc(S.templates.get(s.template)?.name || s.template) : '빈 캔버스'}</span><time>${new Date(s.updatedAt).toLocaleString('ko-KR')}</time>${stale(s) ? `<span class="atm-pin old">새 버전 ${stale(s)}</span>` : ''}</a><button type="button" class="atm-btn ghost danger" data-del="${s.id}" data-name="${esc(s.name)}">삭제</button></div>`).join('') : '<div class="atm-empty">아직 저장한 조립 화면이 없습니다.</div>'}</div>
    <h3>원본 페이지에서 새 화면</h3>
    ${Object.entries(byFam).map(([f, ts]) => `<h4>${esc(families[f])}</h4><div class="atm-tlist">${ts.map((t) => `<button type="button" class="atm-tcard" data-new="${t.id}"><b>${esc(t.name)}</b><span>분자 ${t.instanceCount}개 · ${t.defaultTheme === 'dark' ? '다크' : '라이트'}</span></button>`).join('')}</div>`).join('')}
  </section>`);
  view.append(page);
  page.addEventListener('click', async (e) => {
    const n = e.target.closest('[data-new]'); if (n) { try { await newTemplateScreen(n.dataset.new); } catch (err) { fail(err); } return; }
    const d = e.target.closest('[data-del]');
    if (d) {
      if (!(await confirmDanger('조립 화면을 삭제할까요?', `“${d.dataset.name}” 화면이 영구히 지워져요.`))) return;
      try { await api('api/screens/' + d.dataset.del, { method: 'DELETE' }); note('삭제했습니다.'); go(P.screens); } catch (err) { fail(err); }
    }
  });
  page.querySelector('#newCanvas').addEventListener('click', async () => {
    try { const s = await api('api/screens', { method: 'POST', body: { kind: 'canvas', name: '새 화면', items: [], theme: { mode: S.theme.mode, seed: S.theme.seed } } }); go(P.screen(s.id)); } catch (err) { fail(err); }
  });
}

/* ── 4. 조립 화면 편집 ── */
async function screenEditor(view, sid) {
  let screen = await api('api/screens/' + sid);
  const template = screen.kind === 'template' ? await templateData(screen.template) : null;
  const L = await levelsData();
  const orgById = new Map(L.organisms.map((o) => [o.id, o]));
  const orgInst = (it) => { const o = orgById.get(it.organism); return o && (o.instances[it.inst] || o.instances[0]); };
  let selected = null; // {type:'inst'|'item', id}
  let pristine = screen.kind === 'canvas' && screen.rev === 1 && !screen.items.length; // 만들기만 하고 아직 아무것도 저장하지 않은 빈 캔버스
  const { roles } = S.lib;
  const page = h(`<section class="atm-editor">
    <div class="atm-etool">
      <a class="atm-btn ghost" href="#${P.screens}">← 조립 화면</a>
      <input class="atm-ename" id="ename" value="${esc(screen.name)}" aria-label="화면 이름" maxlength="80">
      <span class="atm-hint">${template ? '페이지 · ' + esc(template.name) : '빈 캔버스'}</span>
      <div class="atm-seg" id="emode"><button type="button" data-mode="dark">다크</button><button type="button" data-mode="light">라이트</button></div>
      <div class="atm-seg"><button type="button" id="eorig">원본 색</button><label class="atm-seedpick"><input type="color" id="eseed" value="${screen.theme.seed || '#7c5cff'}" aria-label="시드 색"><span>시드 색</span></label></div>
      <button type="button" class="atm-btn ghost" id="upd" hidden></button>
      <span class="atm-spacer"></span>
      <div class="atm-seg" role="group" aria-label="되돌리기"><button type="button" id="undo" title="되돌리기 (Ctrl+Z)" aria-label="되돌리기" disabled>↶</button><button type="button" id="redo" title="다시 하기 (Ctrl+Shift+Z)" aria-label="다시 하기" disabled>↷</button></div>
      <div class="atm-seg" role="group" aria-label="보기 배율"><button type="button" data-z="out" title="축소 (Ctrl + -)" aria-label="축소">−</button><button type="button" data-z="fit" id="zlabel" title="화면에 맞추기 (Ctrl+0)">맞춤</button><button type="button" data-z="in" title="확대 (Ctrl + +)" aria-label="확대">+</button></div>
      <span class="atm-dirty" id="dirty" hidden>저장 안 됨</span>
      <button type="button" class="atm-btn ghost" id="png">PNG로 내보내기</button>
      <button type="button" class="atm-btn primary" id="save">저장</button>
    </div>
    <div class="atm-ebody">
      <aside class="atm-drawer">
        <div class="atm-seg atm-dtabs" role="group" aria-label="놓을 것"><button type="button" data-lv="molecule" aria-pressed="true">분자</button><button type="button" data-lv="organism" aria-pressed="false">유기체</button><button type="button" data-lv="atom" aria-pressed="false">원자</button></div>
        <input type="search" id="dq" placeholder="검색 (예: 제목, 표) — 끌어 놓거나 누르기" aria-label="놓을 것 검색">
        <div class="atm-dlist" id="dlist"></div>
      </aside>
      <div class="atm-canvas" id="wrap"><div class="atm-zsize" id="zsize"></div><div class="atm-stage" id="stage"><div class="atm-base" id="base"></div><div class="atm-items" id="items"></div><i class="atm-guide v" id="gv" hidden></i><i class="atm-guide h" id="gh" hidden></i><div class="atm-selbox" id="selbox" hidden><i class="atm-selh" title="끌어서 크기 조절"></i></div></div></div>
      <aside class="atm-insp" id="insp"><div class="atm-empty">화면의 분자를 누르면 여기서 문구 · 버전을 바꿉니다.</div></aside>
    </div>
  </section>`);
  view.append(page);
  const stage = page.querySelector('#stage'), wrap = page.querySelector('#wrap'), base = page.querySelector('#base'), itemsEl = page.querySelector('#items'), selbox = page.querySelector('#selbox'), insp = page.querySelector('#insp');
  const snap = () => JSON.stringify({ items: screen.items, overrides: screen.overrides || {}, pins: screen.pins, theme: screen.theme });
  let hist = [snap()], hpos = 0;
  const syncHist = () => { page.querySelector('#undo').disabled = hpos <= 0; page.querySelector('#redo').disabled = hpos >= hist.length - 1; };
  const record = () => { const v = snap(); if (v === hist[hpos]) return; hist = hist.slice(0, hpos + 1); hist.push(v); if (hist.length > 100) hist.shift(); hpos = hist.length - 1; syncHist(); };
  const setDirty = (v, rec = true) => { S.dirty = v; page.querySelector('#dirty').hidden = !v; if (v && rec) record(); };
  setDirty(false);
  const travel = async (d) => {
    const n = hpos + d; if (n < 0 || n >= hist.length) return;
    hpos = n;
    const v = JSON.parse(hist[hpos]), themed = JSON.stringify(v.theme) !== JSON.stringify(screen.theme);
    Object.assign(screen, { items: v.items, overrides: v.overrides, pins: v.pins, theme: v.theme });
    if (selected?.type === 'item' && !screen.items.some((i) => i.id === selected.id)) selected = null;
    setDirty(true, false); syncHist();
    await redraw(); if (themed) renderDrawer(); inspect();
  };
  page.querySelector('#undo').addEventListener('click', () => travel(-1));
  page.querySelector('#redo').addEventListener('click', () => travel(1));

  /* 배율 — 기본은 '맞춤'(캔버스 칸에 1920×1080 이 다 들어오게). 확대하면 캔버스 칸이 스크롤된다 */
  let scale = 1, zoom = null;
  const ZOOMS = [0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2];
  const fitScale = () => Math.max(0.05, Math.min((wrap.clientWidth - 32) / 1920, (wrap.clientHeight - 32) / 1080));
  const fit = () => {
    scale = zoom ?? fitScale();
    const w = 1920 * scale, hh = 1080 * scale;
    stage.style.transform = `scale(${scale})`;
    stage.style.setProperty('--gw', 2 / scale + 'px'); // 안내선은 화면에서 늘 2px
    stage.style.left = Math.max(16, (wrap.clientWidth - w) / 2) + 'px'; stage.style.top = Math.max(16, (wrap.clientHeight - hh) / 2) + 'px';
    const zs = page.querySelector('#zsize'); zs.style.width = w + 32 + 'px'; zs.style.height = hh + 32 + 'px';
    wrap.style.overflow = zoom == null ? 'hidden' : 'auto'; // 맞춤일 때는 스크롤 없이
    page.querySelector('#zlabel').textContent = zoom == null ? `맞춤 ${Math.round(scale * 100)}%` : Math.round(scale * 100) + '%';
    positionSel();
  };
  /** 배율 바꾸기 — at = 그 자리를 붙잡고(화면 좌표) 키운다 */
  const setZoom = (z, at) => {
    const r = wrap.getBoundingClientRect(), p = at || { x: r.left + wrap.clientWidth / 2, y: r.top + wrap.clientHeight / 2 };
    const sr = stage.getBoundingClientRect(), sx = (p.x - sr.left) / scale, sy = (p.y - sr.top) / scale;
    zoom = z == null ? null : Math.min(4, Math.max(0.1, z));
    fit();
    const nr = stage.getBoundingClientRect();
    wrap.scrollLeft += nr.left + sx * scale - p.x; wrap.scrollTop += nr.top + sy * scale - p.y;
  };
  const stepZoom = (dir, at) => { const cur = scale; const next = dir > 0 ? ZOOMS.find((z) => z > cur + 0.001) : [...ZOOMS].reverse().find((z) => z < cur - 0.001); setZoom(next ?? (dir > 0 ? 4 : 0.1), at); };
  page.querySelector('[data-z="in"]').addEventListener('click', () => stepZoom(1));
  page.querySelector('[data-z="out"]').addEventListener('click', () => stepZoom(-1));
  page.querySelector('[data-z="fit"]').addEventListener('click', () => { setZoom(null); wrap.scrollTo(0, 0); });
  wrap.addEventListener('wheel', (e) => { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); stepZoom(e.deltaY < 0 ? 1 : -1, { x: e.clientX, y: e.clientY }); }, { passive: false });
  const ro = new ResizeObserver(fit); ro.observe(wrap);

  let tpl = null;
  const drawBase = async () => {
    if (!template) { base.className = 'atm-base blank'; base.dataset.mode = screen.theme.mode; return; }
    tpl = await mountTemplate(base, { template, molecules: S.molecules, pins: screen.pins, versions: versionMap(), overrides: screen.overrides || {}, theme: screen.theme });
  };
  const drawItems = async () => {
    const mols = screen.items.filter((i) => i.molecule);
    await loadVariants(mols.map((i) => i.variant));
    await ensureMeasured([...mols.map((i) => variant(i.variant).template), ...screen.items.filter((i) => i.organism).map(orgInst).filter(Boolean).map((x) => x.template)]);
    itemsEl.innerHTML = '';
    for (const it of screen.items) {
      const el = h(`<div class="atm-item${it.organism ? ' is-org' : ''}" data-item="${it.id}" style="left:${it.x}px;top:${it.y}px"><div class="mhost"></div></div>`);
      itemsEl.append(el);
      let size;
      if (it.organism) {
        const inst = orgInst(it), host = el.firstElementChild;
        size = inst ? await mountSection(host, { template: await templateData(inst.template), path: inst.path, theme: screen.theme, rect: sectionRect(inst.template, inst.path) }) : { width: 0, height: 0 };
        if (!size.width) { host.textContent = '원본에서 보이지 않는 구역'; size = { width: 240, height: 40 }; }
        host.style.width = size.width + 'px'; host.style.height = size.height + 'px';
      } else {
        const m = S.molecules.get(it.molecule);
        size = await mountMolecule(el.firstElementChild, { molecule: m, variantId: it.variant, version: versionObj(it.molecule, screen.pins[it.molecule]), values: it.props, theme: screen.theme, box: boxFor(it.variant) });
      }
      el.firstElementChild.style.transform = `scale(${it.scale})`;
      el.style.width = size.width * it.scale + 'px'; el.style.height = size.height * it.scale + 'px';
    }
    positionSel();
  };
  const redraw = async () => { await drawBase(); await drawItems(); syncTheme(); syncUpd(); };

  function selectedEl() {
    if (!selected) return null;
    if (selected.type === 'item') return itemsEl.querySelector(`[data-item="${selected.id}"]`);
    return tpl?.elements.get(selected.id) || null;
  }
  function positionSel() {
    const el = selectedEl();
    if (!el) { selbox.hidden = true; return; }
    const sr = stage.getBoundingClientRect(), r = el.getBoundingClientRect();
    let { left, top, width, height } = r;
    if (!width && !height && el.children.length) { const rs = [...el.children].map((c) => c.getBoundingClientRect()); left = Math.min(...rs.map((x) => x.left)); top = Math.min(...rs.map((x) => x.top)); width = Math.max(...rs.map((x) => x.right)) - left; height = Math.max(...rs.map((x) => x.bottom)) - top; }
    Object.assign(selbox.style, { left: (left - sr.left) / scale + 'px', top: (top - sr.top) / scale + 'px', width: width / scale + 'px', height: height / scale + 'px' });
    selbox.dataset.kind = selected.type;
    selbox.style.setProperty('--hs', 12 / scale + 'px'); // 손잡이는 화면에서 늘 12px
    selbox.hidden = false;
  }
  const newId = () => 'i' + Math.random().toString(36).slice(2, 9);
  function inspect() {
    positionSel();
    if (!selected) { insp.innerHTML = '<div class="atm-empty">화면의 분자를 누르면 여기서 문구 · 버전을 바꿉니다.</div>'; return; }
    const isItem = selected.type === 'item';
    const it = isItem ? screen.items.find((i) => i.id === selected.id) : null;
    if (it?.organism) return inspectOrg(it);
    const inst = !isItem ? template.instances.find((i) => i.id === selected.id) : null;
    const mid = isItem ? it.molecule : inst.molecule;
    const m = S.molecules.get(mid), v = variant(isItem ? it.variant : inst.variant);
    const values = isItem ? it.props : screen.overrides?.[inst.id] || {};
    const pin = screen.pins[mid] || '1.0.0';
    const vers = ['1.0.0', ...versionsOf(mid).map((x) => x.version)].reverse();
    const originals = Object.fromEntries(m.fields.map((f, i) => [f.key, v.props[v.order[i]].default]));
    const verTexts = isItem ? Object.fromEntries(Object.entries(versionObj(mid, pin)?.fields || {}).filter(([, f]) => f.text).map(([k, f]) => [k, f.text])) : {};
    // 자동 맞춤 결과 — render.js fitMolecule 이 필드 요소에 남긴 표시
    const molEl = isItem ? itemsEl.querySelector(`[data-item="${it.id}"] .mhost`)?.shadowRoot?.querySelector('[data-wa-m]') : tpl?.elements.get(inst.id);
    const fitOf = (key) => {
      const f = molEl && (molEl.matches(`[data-wa-f="${key}"]`) ? molEl : molEl.querySelector(`[data-wa-f="${key}"]`));
      const kind = f?.getAttribute('data-wa-fit');
      if (!kind) return '';
      const pct = Math.round((parseFloat(f.style.getPropertyValue('--wa-fit-scale')) || 1) * 100);
      return kind === 'grow' ? '<small class="atm-fit grow">칸을 늘려 간격 조절</small>'
        : kind === 'wrap' ? '<small class="atm-fit grow">줄바꿈해서 맞춤</small>'
        : kind === 'tight' ? '<small class="atm-fit grow">짧아진 만큼 간격 좁힘</small>'
        : kind === 'shrink' ? `<small class="atm-fit shrink">자리가 없어 글자 ${pct}%</small>`
        : '<small class="atm-fit clip">60%로도 넘쳐 … 처리</small>';
    };
    insp.innerHTML = `
      <div class="atm-ihead"><b>${esc(m.name)}</b> <span class="atm-role">${esc(roles[m.role] || m.role)}</span></div>
      <a class="atm-link" href="#${P.mol(mid)}">분자 정의 열기 →</a>
      <label class="atm-sel"><span>버전 <small>이 화면의 모든 '${esc(m.name)}'에 적용</small></span><select id="ipin">${vers.map((x) => `<option${x === pin ? ' selected' : ''}>${x}</option>`).join('')}</select></label>
      ${cmpVer(latestOf(mid), pin) > 0 ? `<p class="atm-hint warn">새 버전 v${latestOf(mid)}이 있습니다.</p>` : ''}
      <h4>문구 <small>길이가 바뀌면 간격 · 글자 크기가 자동으로 맞춰집니다</small></h4>
      ${m.fields.map((f) => `<label class="atm-txt"><span>${esc(f.name)} ${fitOf(f.key)}</span><input type="text" data-key="${f.key}" maxlength="500" value="${esc(values[f.key] ?? '')}" placeholder="${esc(verTexts[f.key] ?? originals[f.key])}"></label>`).join('')}
      ${m.slots?.length ? `<h4>상태 <small>${m.slots[0].root ? '색은' : '심볼 색은'} 분자 전체가 아니라 상태값을 따라 바뀝니다</small></h4>
        ${m.slots.map((sl) => { const cur = values['@' + sl.key] || (v.slots?.find((x) => x.key === sl.key)?.state ?? v.state ?? sl.state); return `<label class="atm-sel"><span>${stateDot(cur)}${esc(sl.name)}</span><select data-slot="${sl.key}">${STATES.map((st) => `<option value="${st}"${st === cur ? ' selected' : ''}>${STATE_LABELS[st]}</option>`).join('')}</select></label>`; }).join('')}` : ''}
      ${isItem ? placeHtml(it) : '<p class="atm-hint">원본 페이지의 분자입니다. 문구만 바꿀 수 있고, 위치는 페이지를 따릅니다.</p>'}`;
    insp.querySelector('#ipin').addEventListener('change', async (e) => { screen.pins[mid] = e.target.value; setDirty(true); await redraw(); inspect(); });
    insp.querySelectorAll('[data-key]').forEach((inp) => inp.addEventListener('change', async () => {
      const k = inp.dataset.key;
      const target = isItem ? it.props : ((screen.overrides ||= {})[inst.id] ||= {});
      if (inp.value === '') delete target[k]; else target[k] = inp.value;
      if (!isItem && !Object.keys(target).length) delete screen.overrides[inst.id];
      setDirty(true);
      if (isItem) await drawItems(); else await drawBase();
      inspect(); // 자동 맞춤 결과 표시를 새로 읽는다
    }));
    insp.querySelectorAll('[data-slot]').forEach((sel) => sel.addEventListener('change', async () => {
      const k = '@' + sel.dataset.slot, st = sel.value;
      const target = isItem ? it.props : ((screen.overrides ||= {})[inst.id] ||= {});
      const orig = v.slots?.find((x) => x.key === sel.dataset.slot)?.state ?? v.state;
      // 배지 · 줄 — 같은 크기 변형에 그 상태의 실제 디자인이 있으면 변형을 바꾼다(얹은 분자만. 템플릿 분자는 칠해서 보여 준다)
      if (isItem && m.slots[0].root) {
        const det = await api('api/molecules/' + encodeURIComponent(mid));
        const real = lookForState(det, it.variant, st);
        if (real) { await loadVariants([real]); it.variant = real; delete target[k]; setDirty(true); await drawItems(); inspect(); return; }
      }
      if (st === orig) delete target[k]; else target[k] = st;
      if (!isItem && !Object.keys(target).length) delete screen.overrides[inst.id];
      setDirty(true);
      if (isItem) await drawItems(); else await drawBase();
      inspect();
    }));
    if (isItem) wirePlace(it);
  }
  /* 배치 칸(X · Y · 배율 · 복제 · 삭제) — 분자 · 유기체 공용 */
  const placeHtml = (it) => `<h4>배치</h4><div class="atm-nums">
        <label class="atm-num"><span>X</span><input type="number" id="ix" value="${it.x}"></label>
        <label class="atm-num"><span>Y</span><input type="number" id="iy" value="${it.y}"></label>
        <label class="atm-num"><span>배율</span><input type="number" id="is" step="0.05" min="0.05" max="4" value="${it.scale}"></label></div>
        <div class="atm-row"><button type="button" class="atm-btn ghost" id="dup">복제</button><button type="button" class="atm-btn ghost danger" id="del">삭제</button></div>`;
  function wirePlace(it) {
    const upd = async () => { it.x = +insp.querySelector('#ix').value || 0; it.y = +insp.querySelector('#iy').value || 0; it.scale = Math.min(4, Math.max(0.05, +insp.querySelector('#is').value || 1)); setDirty(true); await drawItems(); };
    ['#ix', '#iy', '#is'].forEach((s) => insp.querySelector(s).addEventListener('change', upd));
    insp.querySelector('#dup').addEventListener('click', async () => { const c = { ...structuredClone(it), id: newId(), x: it.x + 24, y: it.y + 24 }; screen.items.push(c); selected = { type: 'item', id: c.id }; setDirty(true); await drawItems(); inspect(); });
    insp.querySelector('#del').addEventListener('click', async () => { screen.items = screen.items.filter((x) => x !== it); selected = null; setDirty(true); await drawItems(); inspect(); });
  }
  /* 유기체 — 원본 구역을 통째로 얹은 것. 글자는 원본 그대로, 자리(모습)를 바꿀 수 있다 */
  function inspectOrg(it) {
    const o = orgById.get(it.organism);
    insp.innerHTML = `
      <div class="atm-ihead"><b>${orgTitle(o)}</b> <span class="atm-lvchip">유기체</span></div>
      <a class="atm-link" href="#${P.org(o.id)}">유기체 정의 열기 →</a>
      ${o.instances.length > 1 ? `<label class="atm-sel"><span>모습 <small>같은 유기체가 놓인 자리마다 안의 문구가 다릅니다</small></span><select id="iinst">${o.instances.map((x, i) => `<option value="${i}"${i === it.inst ? ' selected' : ''}>${esc(pageName(x.template))} · ${i + 1}번째 자리</option>`).join('')}</select></label>` : ''}
      <p class="atm-hint">원본 페이지의 구역을 통째로 얹었습니다. 안의 글자를 바꾸려면 그 자리에 분자를 따로 얹으세요.</p>
      ${placeHtml(it)}`;
    insp.querySelector('#iinst')?.addEventListener('change', async (e) => { it.inst = +e.target.value; setDirty(true); await drawItems(); inspect(); });
    wirePlace(it);
  }

  const gv = page.querySelector('#gv'), gh = page.querySelector('#gh');
  /** 붙을 자리 — [가로 선들, 세로 선들] (스테이지 px) */
  const snapLines = (self) => {
    const xs = [0, 960, 1920], ys = [0, 540, 1080];
    itemsEl.querySelectorAll('.atm-item').forEach((el) => {
      if (el.dataset.item === self) return;
      const x = el.offsetLeft, y = el.offsetTop, w = el.offsetWidth, hh = el.offsetHeight;
      xs.push(x, x + w / 2, x + w); ys.push(y, y + hh / 2, y + hh);
    });
    return { xs, ys };
  };
  const snapAxis = (start, size, lines, tol) => {
    let best = null;
    for (const [k, edge] of [[0, start], [size / 2, start + size / 2], [size, start + size]]) {
      for (const l of lines) { const d = l - edge; if (Math.abs(d) <= tol && (!best || Math.abs(d) < Math.abs(best.d))) best = { d, line: l, k }; }
    }
    return best;
  };
  stage.addEventListener('pointerdown', (e) => {
    // 크기 손잡이 — 비율은 그대로, 오른쪽 아래를 끌어 배율을 바꾼다
    if (e.target.closest('.atm-selh') && selected?.type === 'item') {
      e.stopPropagation();
      const it = screen.items.find((i) => i.id === selected.id), itemEl = selectedEl();
      const natW = itemEl.offsetWidth / it.scale, natH = itemEl.offsetHeight / it.scale, sx = e.clientX, s0 = it.scale;
      const h0 = e.target; h0.setPointerCapture(e.pointerId);
      const move = (ev) => {
        it.scale = +Math.min(4, Math.max(0.05, (natW * s0 + (ev.clientX - sx) / scale) / natW)).toFixed(3);
        itemEl.firstElementChild.style.transform = `scale(${it.scale})`;
        itemEl.style.width = natW * it.scale + 'px'; itemEl.style.height = natH * it.scale + 'px';
        positionSel();
      };
      const up = () => { h0.removeEventListener('pointermove', move); h0.removeEventListener('pointerup', up); if (it.scale !== s0) { setDirty(true); inspect(); } };
      h0.addEventListener('pointermove', move); h0.addEventListener('pointerup', up);
      return;
    }
    const itemEl = e.target.closest('.atm-item');
    if (itemEl) {
      selected = { type: 'item', id: itemEl.dataset.item }; inspect();
      const it = screen.items.find((i) => i.id === itemEl.dataset.item);
      const sx = e.clientX, sy = e.clientY, ox = it.x, oy = it.y; let moved = false;
      const lines = snapLines(it.id), w = itemEl.offsetWidth, hh = itemEl.offsetHeight;
      itemEl.setPointerCapture(e.pointerId);
      const move = (ev) => {
        moved = true;
        let x = ox + (ev.clientX - sx) / scale, y = oy + (ev.clientY - sy) / scale;
        const tol = 6 / scale;
        const bx = ev.altKey ? null : snapAxis(x, w, lines.xs, tol), by = ev.altKey ? null : snapAxis(y, hh, lines.ys, tol);
        if (bx) x += bx.d; if (by) y += by.d;
        gv.hidden = !bx; gh.hidden = !by;
        if (bx) gv.style.left = bx.line + 'px'; if (by) gh.style.top = by.line + 'px';
        it.x = Math.round(x); it.y = Math.round(y); itemEl.style.left = it.x + 'px'; itemEl.style.top = it.y + 'px'; positionSel();
      };
      const up = () => { gv.hidden = gh.hidden = true; itemEl.removeEventListener('pointermove', move); itemEl.removeEventListener('pointerup', up); if (moved) { setDirty(true); inspect(); } };
      itemEl.addEventListener('pointermove', move); itemEl.addEventListener('pointerup', up);
      return;
    }
    const hit = e.composedPath().find((n) => n instanceof Element && n.hasAttribute('data-wa-i'));
    selected = hit ? { type: 'inst', id: hit.getAttribute('data-wa-i') } : null;
    inspect();
  });

  const dlist = page.querySelector('#dlist');
  let dio = null, dlevel = 'molecule';
  const ddocs = {};
  const renderDrawer = () => {
    dio?.stop();
    const q = page.querySelector('#dq').value;
    dlist.innerHTML = '';
    page.querySelectorAll('.atm-dtabs [data-lv]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.lv === dlevel));
    if (dlevel === 'organism') {
      ddocs.organism ||= L.organisms.map(organismDoc);
      const list = rank(ddocs.organism, q, (a, b) => b.instanceCount - a.instanceCount).slice(0, 60).map((r) => r.item);
      dio = lazyLive(dlist, (el) => organismThumb(el.querySelector('.atm-thumb'), shownInstance(orgById.get(el.dataset.org)), { maxW: 190, maxH: 64, minScale: 0.2 }), (el) => unthumb(el.querySelector('.atm-thumb')));
      list.forEach((o) => { const el = h(`<div class="atm-dcard" draggable="true" data-org="${o.id}" title="${esc(o.name)} — 끌어 놓거나 누르면 가운데에 놓습니다"><div class="atm-thumb"></div><span>${esc(orgLabel(o).lead)}${orgLabel(o).tag ? ' · ' + esc(orgLabel(o).tag) : ''}</span></div>`); dlist.append(el); dio.watch(el); });
    } else {
      ddocs[dlevel] ||= S.lib.molecules.filter((m) => (dlevel === 'atom') === (m.level === 'atom')).map(moleculeDoc);
      const list = rank(ddocs[dlevel], q, (a, b) => b.instanceCount - a.instanceCount).slice(0, 120).map((r) => r.item);
      dio = lazy(dlist, async (el) => { const m = S.molecules.get(el.dataset.id); try { await thumb(el.querySelector('.atm-thumb'), m, m.firstVariant, { maxW: 190, maxH: 64, version: versionObj(m.id, m.latest), theme: screen.theme }); } catch (e) {} });
      list.forEach((m) => { const el = h(`<div class="atm-dcard" draggable="true" data-id="${m.id}" title="${esc(m.name)} — 끌어 놓거나 누르면 가운데에 놓습니다"><div class="atm-thumb"></div><span>${esc(m.name)} · ${esc(roles[m.role] || m.role)}</span></div>`); dlist.append(el); dio.watch(el); });
    }
    if (!dlist.children.length) dlist.append(h(`<div class="atm-empty">${q.trim() ? `‘${esc(q.trim())}’에 맞는 것이 없습니다.` : '없습니다.'}</div>`));
  };
  page.querySelector('#dq').addEventListener('input', renderDrawer);
  page.querySelector('.atm-dtabs').addEventListener('click', (e) => { const b = e.target.closest('[data-lv]'); if (!b) return; dlevel = b.dataset.lv; renderDrawer(); });
  /** 서랍의 것을 화면에 놓는다 — at = 화면 좌표(없으면 가운데) */
  const addFromDrawer = async (card, at) => {
    let it;
    if (card.dataset.org) {
      const o = orgById.get(card.dataset.org), inst = shownInstance(o), r = sectionRect(inst.template, inst.path) || { w: 600, h: 300 };
      it = { id: newId(), organism: o.id, inst: Math.max(0, o.instances.indexOf(inst)), ...centerOn(r.w, r.h), ...(at || {}) };
    } else {
      const m = S.molecules.get(card.dataset.id), b = boxFor(m.firstVariant) || { w: 200, h: 60 };
      it = { id: newId(), molecule: m.id, variant: m.firstVariant, ...centerOn(b.w, b.h), ...(at || {}), props: {} };
      if (!screen.pins[m.id]) screen.pins[m.id] = latestOf(m.id);
    }
    screen.items.push(it); selected = { type: 'item', id: it.id }; setDirty(true);
    await drawItems(); inspect();
  };
  dlist.addEventListener('click', (e) => { const c = e.target.closest('.atm-dcard'); if (c) addFromDrawer(c); });
  dlist.addEventListener('dragstart', (e) => { const c = e.target.closest('.atm-dcard'); if (c) e.dataTransfer.setData('text/wa-place', c.dataset.org ? 'org:' + c.dataset.org : 'mol:' + c.dataset.id); });
  wrap.addEventListener('dragover', (e) => { if (e.dataTransfer.types.includes('text/wa-place')) e.preventDefault(); });
  wrap.addEventListener('drop', async (e) => {
    const v = e.dataTransfer.getData('text/wa-place'); if (!v) return;
    e.preventDefault();
    const sr = stage.getBoundingClientRect(), id = v.slice(4);
    await addFromDrawer(v.startsWith('org:') ? { dataset: { org: id } } : { dataset: { id } }, { x: Math.round((e.clientX - sr.left) / scale), y: Math.round((e.clientY - sr.top) / scale) });
  });
  page.querySelector('#png').addEventListener('click', async (e) => {
    const sel = selbox.hidden; selbox.hidden = true;
    await savePng(stage, page.querySelector('#ename').value || screen.name, e.currentTarget, { width: 1920, height: 1080, scale: 1 });
    selbox.hidden = sel;
  });

  const syncTheme = () => {
    page.dataset.mode = screen.theme.mode; // 서랍 썸네일 바탕
    page.querySelectorAll('#emode [data-mode]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.mode === screen.theme.mode));
    page.querySelector('#eorig').setAttribute('aria-pressed', !screen.theme.seed);
    page.querySelector('.atm-etool .atm-seedpick').classList.toggle('on', !!screen.theme.seed);
  };
  page.querySelector('#emode').addEventListener('click', async (e) => { const b = e.target.closest('[data-mode]'); if (!b) return; screen.theme = { ...screen.theme, mode: b.dataset.mode }; setDirty(true); await redraw(); renderDrawer(); });
  page.querySelector('#eorig').addEventListener('click', async () => { screen.theme = { ...screen.theme, seed: null }; setDirty(true); await redraw(); renderDrawer(); });
  page.querySelector('#eseed').addEventListener('change', async (e) => { screen.theme = { ...screen.theme, seed: e.target.value }; setDirty(true); await redraw(); renderDrawer(); });
  const syncUpd = () => {
    const stale = Object.entries(screen.pins).filter(([mid, v]) => cmpVer(latestOf(mid), v) > 0);
    const b = page.querySelector('#upd');
    b.hidden = !stale.length; b.textContent = `새 버전 ${stale.length}개 모두 적용`;
    b.onclick = async () => { stale.forEach(([mid]) => (screen.pins[mid] = latestOf(mid))); setDirty(true); await redraw(); inspect(); note('고정 버전을 최신으로 올렸습니다. 저장해야 남습니다.', 'info'); };
  };
  page.querySelector('#ename').addEventListener('input', () => setDirty(true, false));
  const save = async () => {
    try {
      const body = { rev: screen.rev, name: page.querySelector('#ename').value, theme: screen.theme, pins: screen.pins, items: screen.items, overrides: screen.overrides };
      screen = await api('api/screens/' + sid, { method: 'PUT', body });
      pristine = false;
      setDirty(false); note('저장했습니다.');
      return true;
    } catch (e) { fail(e); return false; }
  };
  page.querySelector('#save').addEventListener('click', save);
  /* 저장 안 한 채 나가기 — 위 탭 · '← 조립 화면' · 뒤로가기 · 왼쪽 메뉴 등 모든 이동을 라우터가 여기서 먼저 묻는다 */
  let asking = false;
  const askLeave = () => (typeof window.askConfirm === 'function'
    ? window.askConfirm({ title: '저장하지 않은 변경이 있어요', body: `“${esc(page.querySelector('#ename').value || screen.name)}” 화면을 저장하지 않고 나가면 바뀐 내용이 사라져요.`, confirmLabel: '저장하고 나가기', altLabel: '저장 안 하고 나가기', danger: false })
    : Promise.resolve(window.confirm('저장하지 않은 변경이 있어요. 저장하지 않고 나갈까요?') ? 'alt' : false));
  window.WEMB.router.setGuard((target) => {
    if (!S.dirty) return true;
    if (!asking) {
      asking = true;
      askLeave().then(async (v) => {
        asking = false;
        if (v === true) { if (!(await save())) return; } // 저장에 실패하면 남는다
        else if (v !== 'alt') return;
        setDirty(false);
        go(target);
      });
    }
    return false;
  });
  const onKey = (e) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);
    const mod = e.ctrlKey || e.metaKey;
    if (mod && !typing && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); travel(e.shiftKey ? 1 : -1); return; }
    if (mod && !typing && e.key === 'y') { e.preventDefault(); travel(1); return; }
    if (mod && (e.key === '=' || e.key === '+')) { e.preventDefault(); stepZoom(1); return; }
    if (mod && e.key === '-') { e.preventDefault(); stepZoom(-1); return; }
    if (mod && e.key === '0') { e.preventDefault(); setZoom(null); return; }
    if (!typing && selected?.type === 'item' && /^Arrow/.test(e.key)) {
      e.preventDefault();
      const it = screen.items.find((i) => i.id === selected.id), d = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowLeft') it.x -= d; if (e.key === 'ArrowRight') it.x += d; if (e.key === 'ArrowUp') it.y -= d; if (e.key === 'ArrowDown') it.y += d;
      const el = selectedEl(); el.style.left = it.x + 'px'; el.style.top = it.y + 'px';
      positionSel(); setDirty(true); clearTimeout(onKey.t); onKey.t = setTimeout(inspect, 150);
      return;
    }
    if (mod && e.key === 's') { e.preventDefault(); save(); }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selected?.type === 'item' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) { screen.items = screen.items.filter((i) => i.id !== selected.id); selected = null; setDirty(true); drawItems(); inspect(); }
  };
  const onLeave = (e) => { if (S.dirty) { e.preventDefault(); e.returnValue = ''; } };
  window.addEventListener('keydown', onKey);
  window.addEventListener('beforeunload', onLeave);
  cleanup = () => {
    ro.disconnect(); dio?.stop(); S.dirty = false; window.WEMB.router.setGuard(null); window.removeEventListener('keydown', onKey); window.removeEventListener('beforeunload', onLeave);
    if (pristine) api('api/screens/' + sid, { method: 'DELETE' }).catch(() => {}); // 한 번도 저장하지 않은 빈 캔버스
  };

  fit();
  await redraw();
  renderDrawer();
  if (S.pendingSelect) {
    if (screen.items.some((i) => i.id === S.pendingSelect)) { selected = { type: 'item', id: S.pendingSelect }; inspect(); note('조립 화면에 얹었습니다. 끌어서 옮기고, 오른쪽에서 문구 · 배치를 바꿔요.', 'info'); }
    S.pendingSelect = null;
  }
}
