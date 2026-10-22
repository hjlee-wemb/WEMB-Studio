/* ── 원자 변경 — 지금 화면의 원자 · 분자를 분자 라이브러리의 다른 원자 · 분자로 바꾼다 ──

   아토믹 단계를 따른다.
     원자  분자에서 옮긴 원자(구성도 심볼 · 라벨)와 화면에 쓰인 그림 파일. 그림은 모양이 같으면 색이 다른 파일도 같은 원자다.
           스튜디오가 직접 그린 화면(대시보드 · 디지털 트윈)의 선 아이콘(svg)도 그 화면의 아이콘(Icon)으로 본다.
     분자  원자를 품은 오브젝트 — 분자 라이브러리의 분자 인스턴스. 원자를 고른 뒤 '분자' 단계로 올라가 통째로 바꾼다.
   분류는 라이브러리와 같은 표준 이름이다 — 그림 원자는 맥락(가까운 레이어 이름: Icon · Background · Marker …),
   옮긴 원자 · 분자는 확정 이름의 카테고리(Icon · Node Label · Row · Title …). 고른 것의 분류를 맨 앞에 둔다.
   템플릿 화면과, 내가 만든 화면에 넣은 템플릿 에셋은 모두 .<접두어>-root 안에 있어 같은 방법으로 찾는다.

   바꾸는 방법 — 원래 DOM 은 지우지 않는다(원래대로 되돌리기 · 화면을 다시 그릴 때 안전하게)
     그림 → 그림  src 는 그대로 두고 CSS content 로 새 그림을 보인다. 템플릿 색 칠하기(TPLTINT)가 원래 파일 이름으로
                  정하는 규칙과 라이트 테마 짝(-lt)이 그대로 산다. 한 가지 색 아이콘끼리면 새 모양을 이 자리의 색으로 칠한다(mask).
                  선 아이콘(svg)은 안쪽 그림을 숨기고 같은 상자에 새 모양을 글자색(currentColor)으로 칠한다.
     그 밖        원래 요소는 자리만 남기고 숨기고, 바꿀 원자 · 분자를 원래 화면 그대로 그려 같은 자리에 맞춰 얹는다(판 .atm-rep).
                  다른 화면에서 온 것은 섀도 DOM 안에서 그 화면 CSS 로만 그린다 — 화면마다 클래스 번호(x211 …)가 겹친다.
                  라벨은 원래 글자를, 분자는 원래 글자 칸의 내용을 옮겨 적는다(칸 이름이 같은 것부터, 나머지는 순서대로).

   저장 — localStorage 'wemb-atom-swap'. wemb- 키라 화면(프로젝트)마다 따로 저장된다(js/core/projects.js).
     { v:1, pages: { <화면>: { atoms, places, mols, molPlaces } } }  — 원자 · 원자 자리 · 분자 · 분자 자리 → 바꿀 것
     화면 = 템플릿 페이지 접두어(hno2 · pkm …) 또는 'studio:dash' · 'studio:dt'. 자리 기록이 '같은 것 모두' 기록보다 먼저다.
     기록에는 서버 없이도 다시 입힐 수 있는 정보(파일 · 노드 요소 · 글자 칸)를 같이 적는다 — 화면이 열릴 때 바로 입힌다.
   원자 · 분자 목록은 분자 라이브러리 서버(wemb-atomic)의 api/atoms 에서 받는다. */
(function initAtomSwap() {
  const main = document.querySelector('.main');
  const dt = document.getElementById('dtStage');
  const stage = main && main.querySelector(':scope > .stage');
  if (!main || !dt || !stage) return;

  const LS = 'wemb-atom-swap';
  const POS = 'atm-swap-pos'; /* 창 위치 — 보는 사람 편의라 화면 묶음(wemb-)에 넣지 않는다 */
  /* 분자 라이브러리 40페이지의 화면 루트 접두어 — 서버 없이 다시 입힐 때 화면을 알아보는 데 쓴다
     (2026-10-02 LS Electric 단독 팝업 다섯 장 lst · lsp · lsb · lsc · lsr 추가) */
  const PXS = new Set(['hno2', 'hnc1', 'hnc2', 'hnm', 'hni1', 'hni2', 'hne', 'hnn1', 'hnn2', 'hnn3', 'hnf', 'hns1', 'hns2', 'hnl',
    'hjc', 'hjg', 'hju', 'pkm', 'pka', 'pko', 'pkr', 'pkf', 'pkd', 'pks1', 'pks2', 'pks3', 'pks4', 'lsm', 'lsd', 'lsa', 'lsy', 'lse',
    'lst', 'lsp', 'lsb', 'lsc', 'lsr', 'skh', 'skv', 'skxp']);
  const ROOT_SEL = [...PXS].map((p) => '.' + p + '-root').join(',');
  const LEVEL_WORD = { atom: '원자', mol: '분자' };
  const PART_WORD = { symbol: '심볼', label: '라벨' };
  const ICON_NAME = /^icons?\b|\bicons?$|^ico\b|^ico[-_]/i; /* 서버 lib/levels.mjs 의 graphicContext 와 같은 규칙 */
  const NO_NAME = '(이름 없음)';
  const ICONS = {
    atom: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="15" cy="17" r="10.5" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="15" cy="17" r="5.2" fill="currentColor"/><circle cx="25" cy="7.5" r="3.4" fill="currentColor"/></svg>',
    pick: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="7"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
  };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const base = (f) => String(f || '').split('/').pop().replace(/\.(svg|png|jpe?g|gif|webp)$/i, '');
  const familyOf = (tid) => String(tid || '').split('-')[0];
  /* 라이브러리와 같은 카테고리 — 'Widget/Public Status (Active)' → 'Widget' · 'Row 2' → 'Row' (lib/levels.mjs categoryOfName) */
  const catOfName = (name) => String(name || '').replace(/\s*\([^()]*\)\s*$/, '').split('/')[0].replace(/\s+\d+$/, '').trim();
  /* 창 상태
     목록 — 단계(원자 · 분자) · 분류 거르기
     고른 것 — 단계 · 원자와 그 자리 · 원자 범위 · 분자와 그 자리 · 분자 범위
     바꿀 것 고르기 — 분류 · 색 · 프로젝트 · 찾기 */
  const ui = {
    open: false, el: null, body: null, view: 'list', listLevel: 'atom', listCat: '',
    level: 'atom', sel: null, place: null, scope: 'atom', mol: null, inst: null, molScope: 'all',
    cat: null, chipsOpen: false, color: 'place', fam: null, q: '', picking: false, err: null, sigList: '', pageKey: undefined,
  };

  /* ── 저장 ── */
  const SECTIONS = ['atoms', 'places', 'mols', 'molPlaces'];
  let store = readStore();
  let storeVer = 0;
  function readStore() {
    try {
      const d = JSON.parse(localStorage.getItem(LS) || 'null');
      if (d && d.v === 1 && d.pages) {
        Object.values(d.pages).forEach((p) => SECTIONS.forEach((s) => { p[s] = p[s] || {}; }));
        return d;
      }
    } catch (e) {}
    return { v: 1, pages: {} };
  }
  const recCount = (rec) => (rec ? SECTIONS.reduce((n, s) => n + Object.keys(rec[s]).length, 0) : 0);
  function writeStore() {
    storeVer++;
    Object.keys(store.pages).forEach((k) => { if (!recCount(store.pages[k])) delete store.pages[k]; });
    try {
      if (Object.keys(store.pages).length) localStorage.setItem(LS, JSON.stringify(store));
      else localStorage.removeItem(LS);
      return true;
    } catch (e) {
      if (typeof toast === 'function') toast('바꾼 원자를 저장하지 못했어요 — 브라우저 저장 공간이 부족하거나 시크릿 모드예요.', { type: 'err' });
      return false;
    }
  }
  const pageRec = (key) => (key && store.pages[key]) || null;
  const pageRecMake = (key) => store.pages[key] || (store.pages[key] = { atoms: {}, places: {}, mols: {}, molPlaces: {} });

  /* ── 지금 화면 ──
     템플릿 화면이면 #dtStage 바로 아래의 화면 루트(.hno2-root 등)가 범위다(그 뒤에 깔린 기본 트윈 UI 는 보지 않는다).
     그림 한 장 · 통 SVG 시안(이미지 템플릿 · SK하이닉스 메인)은 원자로 나뉘어 있지 않다. */
  const pxOf = (el) => {
    if (!el || !el.classList) return null;
    for (const c of el.classList) {
      const m = /^([a-z]+\d*)-root$/.exec(c);
      if (m && PXS.has(m[1])) return m[1];
    }
    return null;
  };
  function currentPage() {
    if (!dt.hidden) {
      const roots = [...dt.children].filter((el) => pxOf(el));
      if (roots.length) return { key: pxOf(roots[0]), kind: 'tpl', px: pxOf(roots[0]), scopes: roots, themeEl: roots[0] };
      if (dt.getAttribute('data-tpl') || dt.querySelector('.skx-screen, .tplimg-shot')) return { key: null, kind: 'flat', scopes: [] };
      return { key: 'studio:dt', kind: 'studio', scopes: [dt] };
    }
    return { key: 'studio:dash', kind: 'studio', scopes: [stage] };
  }
  const pageTheme = (page) => (page.themeEl && page.themeEl.dataset.theme) || main.getAttribute('data-mode') || 'dark';

  /* ── 파일 경로 — 문서 기준 상대 경로('src/hana/icon-9.svg')로 맞춘다 ── */
  const DIR = new URL('.', location.href).pathname;
  function norm(src) {
    if (!src || /^(data|blob):/i.test(src)) return null;
    try {
      const u = new URL(src, location.href);
      if (u.origin !== location.origin) return null;
      let p = decodeURIComponent(u.pathname);
      if (p.startsWith(DIR)) p = p.slice(DIR.length);
      return p.replace(/^\/+/, '');
    } catch (e) { return null; }
  }
  /* CSS 변수 안의 url() 은 쓰는 쪽 시트를 기준으로 풀린다 — 절대 주소로 넣는다 */
  const absUrl = (f) => new URL(f, location.href).href;
  const cssUrl = (f) => 'url("' + absUrl(f).replace(/"/g, '%22') + '")';

  /* ── 분자 라이브러리 색인 (api/atoms) ── */
  let IDX = null, idxLoading = null;
  function loadIndex() {
    if (IDX) return Promise.resolve(IDX);
    if (!idxLoading) {
      idxLoading = fetch('api/atoms', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status === 404 ? '분자 라이브러리 서버가 아니에요 (api/atoms 없음)' : 'HTTP ' + r.status))))
        .then((d) => (IDX = makeIndex(d)))
        .catch((e) => { idxLoading = null; throw e; });
    }
    return idxLoading;
  }
  function makeIndex(d) {
    const pxByTpl = new Map(d.templates.map((t) => [t.id, t.px]));
    const byPx = (obj) => {
      const m = new Map();
      Object.entries(obj || {}).forEach(([tid, list]) => { const px = pxByTpl.get(tid); if (px) m.set(px, list); });
      return m;
    };
    return {
      raw: d,
      families: d.families || {},
      files: new Map(Object.entries(d.files || {})),
      icons: new Map(d.icons.map((i) => [i.id, i])),
      parts: new Map(d.parts.map((p) => [p.id, p])),
      mols: new Map((d.molecules || []).map((m) => [m.id, m])),
      tplByPx: new Map(d.templates.map((t) => [t.px, t])),
      pxByTpl,
      placesByPx: byPx(d.places),
      molPlacesByPx: byPx(d.molPlaces),
    };
  }

  /* 화면을 훑을 때 쓰는 대응표 — 색인 + 이 화면 기록(서버가 없을 때도 바꾼 것을 다시 입힐 수 있게) */
  let mapsCache = null;
  function mapsFor(rec) {
    const ck = (IDX ? 1 : 0) + ':' + storeVer;
    if (mapsCache && mapsCache.ck === ck && mapsCache.rec === rec) return mapsCache;
    const files = new Map(IDX ? IDX.files : []);
    const parts = new Map(), mols = new Map(), molKeys = new Map();
    if (IDX) {
      IDX.placesByPx.forEach((l, px) => parts.set(px, l.slice()));
      IDX.molPlacesByPx.forEach((l, px) => mols.set(px, l.slice()));
    }
    const addTo = (map, px, item, same) => {
      if (!px) return;
      const l = map.get(px) || map.set(px, []).get(px);
      if (!l.some((x) => same(x, item))) l.push(item);
    };
    const samePart = (x, y) => x.node === y.node && x.part === y.part;
    const sameMol = (x, y) => x.node === y.node;
    if (rec) {
      Object.entries(rec.atoms).forEach(([key, r]) => {
        const f = r.from || {};
        if (f.files) Object.entries(f.files).forEach(([file, info]) => { if (!files.has(file)) files.set(file, Object.assign({ atom: key }, info)); });
        if (f.places) f.places.forEach((pl) => addTo(parts, pl.px, { atom: key, part: f.part, node: pl.node, nid: pl.nid, ids: pl.ids }, samePart));
      });
      Object.values(rec.places).forEach((r) => {
        const at = r.at;
        if (!at) return;
        if (at.node && at.ids) addTo(parts, at.px, { atom: at.atom, part: at.part, node: at.node, nid: at.nid, ids: at.ids }, samePart);
        if (at.file && !files.has(at.file)) files.set(at.file, { atom: at.atom, paint: at.paint, lt: at.lt, ltPaint: at.ltPaint });
      });
      Object.entries(rec.mols).forEach(([m, r]) => {
        const f = r.from || {};
        if (f.keys) molKeys.set(m, f.keys);
        (f.places || []).forEach((mp) => addTo(mols, mp.px, { m, v: mp.v, node: mp.node, paths: mp.paths }, sameMol));
      });
      Object.values(rec.molPlaces).forEach((r) => {
        const at = r.at;
        if (!at) return;
        if (at.keys) molKeys.set(at.m, at.keys);
        addTo(mols, at.px, { m: at.m, v: at.v, node: at.node, paths: at.paths }, sameMol);
      });
    }
    const keysOf = (m) => (IDX && IDX.mols.get(m) ? IDX.mols.get(m).fields.map((f) => f.key) : molKeys.get(m) || []);
    return (mapsCache = { ck, rec, files, parts, mols, keysOf });
  }

  /* ── 분류 · 이름 ── */
  /* 그림의 맥락 — 가까운 레이어 이름(3단계 안). 아이콘 이름이면 Icon, 표준 어휘가 아닌 이름(소문자 · 숫자로 시작 · 한 글자)은 옛 이름 */
  function ctxCat(el) {
    let a = el;
    for (let d = 0; a && d < 3; a = a.parentElement, d++) {
      const n = (a.getAttribute && a.getAttribute('data-name') || '').trim();
      if (!n) continue;
      if (ICON_NAME.test(n)) return 'Icon';
      return /^[a-z\d]/.test(n) || n.length < 2 || /\scopy(\s\d+)?$/i.test(n) ? '(옛 이름)' : catOfName(n) || NO_NAME;
    }
    return NO_NAME;
  }
  function atomCat(key, p) {
    if (IDX) {
      const i = IDX.icons.get(key);
      if (i) return i.context || 'Icon';
      const pt = IDX.parts.get(key);
      if (pt) return pt.category || catOfName(pt.name);
    }
    if (p && p.studio) return 'Icon';
    return (p && p.cat) || NO_NAME;
  }
  const molCat = (m) => (IDX && IDX.mols.get(m) ? IDX.mols.get(m).category : NO_NAME);
  const molName = (m) => (IDX && IDX.mols.get(m) ? IDX.mols.get(m).name : m);

  /* ── 화면 훑기 — 원자와 그 자리, 분자와 그 자리 ── */
  function sigOf(svg) {
    const s = (svg.getAttribute('viewBox') || '') + '|' + svg.innerHTML.replace(/\s+/g, ' ').trim();
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return 'svg:' + (h >>> 0).toString(36) + s.length.toString(36);
  }
  function iconSized(svg) {
    const cs = getComputedStyle(svg);
    const w = parseFloat(cs.width), h = parseFloat(cs.height);
    return w >= 6 && h >= 6 && w <= 48 && h <= 48;
  }
  function svgName(svg) {
    const host = svg.closest('[aria-label], [title], button, a');
    if (!host) return '';
    const t = host.getAttribute('aria-label') || host.getAttribute('title') || host.textContent;
    return String(t || '').replace(/\s+/g, ' ').trim().slice(0, 16);
  }
  const childById = (node, id) => { for (const c of node.children) if (c.id === id) return c; return null; };
  const cssEsc = (s) => (window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/["\\]/g, '\\$&'));
  /* 화면 루트(또는 에셋) 안에서 요소 id 로 — 같은 에셋을 두 번 넣으면 문서 전체에서는 id 가 겹친다 */
  const byId = (root, id) => root.querySelector('[id="' + cssEsc(id) + '"]');
  const rendered = (p) => p.els.some((e) => e.getClientRects().length > 0);

  function scan(page, maps) {
    const atoms = new Map(), places = [], byEl = new Map();
    const mols = new Map(), molPlaces = [], molByEl = new Map();
    const res = { page, atoms, places, byEl, mols, molPlaces, molByEl };
    if (!page.scopes.length) return res;
    /* 같은 접두어 루트가 여럿이면(같은 에셋을 두 번 넣었을 때) 문서 순서로 번호를 붙인다 — 자리 이름이 겹치지 않게 */
    const rootKey = new Map(), pxCount = new Map();
    const roots = [];
    page.scopes.forEach((S) => [S, ...S.querySelectorAll(ROOT_SEL)].forEach((r) => {
      const px = pxOf(r);
      if (!px || rootKey.has(r) || r.closest('.atm-rep, .atx')) return;
      const n = pxCount.get(px) || 0;
      pxCount.set(px, n + 1);
      rootKey.set(r, n ? px + '@' + n : px);
      roots.push(r);
    }));
    const counters = new Map();
    const placeKeyIn = (r, el, t) => {
      const rk = rootKey.get(r);
      if (el.id) return rk + '#' + el.id;
      const c = counters.get(r) || {};
      c[t] = (c[t] || 0) + 1;
      counters.set(r, c);
      return rk + ':' + t + c[t];
    };
    const nth = new Map();
    const nthKey = (k) => { const n = (nth.get(k) || 0) + 1; nth.set(k, n); return k + '@' + n; };
    const add = (key, p) => {
      let a = atoms.get(key);
      if (!a) atoms.set(key, (a = { key, places: [] }));
      p.atom = a;
      a.places.push(p);
      places.push(p);
      p.els.forEach((e) => { if (!byEl.has(e)) byEl.set(e, p); });
    };
    page.scopes.forEach((S) => {
      /* 그림 파일 */
      S.querySelectorAll('img').forEach((img) => {
        if (img.closest('.atm-rep, .atx')) return;
        const file = norm(img.__origSrc || img.getAttribute('src')); /* 템플릿 색 칠하기가 사진을 다시 칠하면 src 가 data: 로 바뀐다 */
        if (!file) return;
        const r = img.closest(ROOT_SEL);
        const rk = r && rootKey.has(r) ? r : null;
        const ent = maps.files.get(file) || null;
        add(ent ? ent.atom : 'img:' + file, { key: rk ? placeKeyIn(rk, img, 'i') : nthKey('img:' + file), type: 'img', el: img, els: [img], file, ent, root: rk, cat: rk ? ctxCat(img) : NO_NAME });
      });
      /* svg — 템플릿 밖은 스튜디오가 그린 선 아이콘, 템플릿 안은 라이브가 그림을 바꿔 넣은 벡터(data-src)만 */
      S.querySelectorAll('svg').forEach((svg) => {
        if ((svg.parentElement && svg.parentElement.closest('svg')) || svg.closest('.atm-rep, .atx')) return;
        const r = svg.closest(ROOT_SEL);
        if (r) {
          const file = norm(svg.getAttribute('data-src'));
          if (!file || !rootKey.has(r)) return;
          const ent = maps.files.get(file) || null;
          add(ent ? ent.atom : 'img:' + file, { key: placeKeyIn(r, svg, 's'), type: 'svg', el: svg, els: [svg], file, ent, root: r, cat: ctxCat(svg) });
          return;
        }
        /* 화면에 그려진 아이콘 크기(48px 이하)만 아이콘으로 센다 — 차트 · 지도 같은 큰 그림은 원자가 아니다.
           숨은 칸(다른 탭)의 같은 아이콘은 크기를 잴 수 없지만, 같은 모양이면 함께 바꿔야 하므로 자리로는 넣는다. */
        if (svg.getClientRects().length && !iconSized(svg)) return;
        const sig = sigOf(svg);
        add(sig, { key: nthKey(sig), type: 'svg', el: svg, els: [svg], sig, studio: true, root: null });
      });
    });
    /* 분자에서 옮긴 원자 — 구성도 노드 안의 심볼 · 라벨 조각 */
    roots.forEach((r) => {
      const list = maps.parts.get(pxOf(r));
      if (!list) return;
      list.forEach((pl) => {
        const node = pl.node && byId(r, pl.node);
        if (!node || node.closest(ROOT_SEL) !== r || node.closest('.atm-rep')) return;
        const els = pl.ids.map((id) => childById(node, id));
        if (els.some((e) => !e)) return;
        const p = { key: rootKey.get(r) + ':' + pl.node + ':' + pl.part, type: 'part', part: pl.part, node, nodeId: pl.node, els, nid: pl.nid, ids: pl.ids, root: r };
        add(pl.atom, p);
        const rep = repOf(p);
        if (rep) byEl.set(rep, p);
      });
    });
    /* 분자 — 분자 라이브러리의 분자 인스턴스(노드 요소) */
    roots.forEach((r) => {
      const list = maps.mols.get(pxOf(r));
      if (!list) return;
      list.forEach((mp) => {
        const el = mp.node && byId(r, mp.node);
        if (!el || el.closest(ROOT_SEL) !== r || el.closest('.atm-rep')) return;
        const inst = { key: rootKey.get(r) + '#' + mp.node, type: 'mol', m: mp.m, v: mp.v, node: mp.node, paths: mp.paths || [], keys: maps.keysOf(mp.m), el, els: [el], root: r };
        let g = mols.get(mp.m);
        if (!g) mols.set(mp.m, (g = { key: mp.m, places: [] }));
        inst.mol = g;
        g.places.push(inst);
        molPlaces.push(inst);
        molByEl.set(el, inst);
        const rep = repOf(inst);
        if (rep) molByEl.set(rep, inst);
      });
    });
    return res;
  }
  /* 원자를 품은 분자 — 원자 요소에서 위로 올라가며 가장 가까운 분자 인스턴스 */
  function molOfPlace(res, p) {
    if (!p || !p.root) return null;
    for (let n = p.type === 'part' ? p.node : p.el; n && n !== p.root; n = n.parentElement) {
      const inst = res.molByEl.get(n);
      if (inst) return inst;
    }
    return null;
  }

  /* ── 입히기 ── */
  let lastRes = null;
  let pending = false; /* 아직 그려지지 않아(숨은 화면) 자리를 못 잰 것 — 화면이 보이면 다시 */
  function applyAll() {
    const page = currentPage();
    const rec = pageRec(page.key);
    if (!rec && !ui.open && !document.querySelector('[data-atm], .atm-rep')) return (lastRes = null);
    const res = scan(page, mapsFor(rec));
    pending = false;
    res.places.forEach((p) => {
      const want = rec ? (rec.places[p.key] || rec.atoms[p.atom.key] || null) : null;
      if (setPlace(p, want) === false) pending = true;
    });
    res.molPlaces.forEach((inst) => {
      const want = rec ? (rec.molPlaces[inst.key] || rec.mols[inst.m] || null) : null;
      if (setMol(inst, want) === false) pending = true;
    });
    /* 기록이 지워졌거나 더는 원자 · 분자 자리가 아닌 곳에 남은 흔적 */
    const known = new Set(res.places.flatMap((p) => p.els));
    const repKeys = new Set(res.places.map((p) => p.key).concat(res.molPlaces.map((i) => i.key)));
    page.scopes.forEach((S) => {
      S.querySelectorAll('[data-atm]').forEach((el) => { if (!known.has(el) && !el.closest('.atm-rep')) clearPaint(el); });
      S.querySelectorAll('.atm-rep').forEach((rep) => { if (!repKeys.has(rep.getAttribute('data-atm-for'))) dropRep(rep); });
    });
    watchLive(page);
    return (lastRes = res);
  }
  function setPlace(p, want) {
    if (!want || want.kind === 'orig') { if (p.type !== 'part') clearPaint(p.el); return clearRep(p); }
    if (want.kind === 'file' && p.type !== 'part') { clearRep(p); return paintPlace(p, want); }
    if (p.type !== 'part') clearPaint(p.el);
    return applyRep(p, want);
  }
  function setMol(inst, want) {
    if (!want || want.kind !== 'mol') return clearRep(inst);
    return applyRep(inst, want);
  }

  /* 그림 → 그림 · 선 아이콘 — 속성과 CSS 변수만 바꾼다(css/studio/atom-swap.css) */
  function placeColors(p, to) {
    if (to.color === 'own' || !to.paint) return null; /* 새 모양이 여러 색이면 원래 색 그대로 */
    if (p.studio) return { c: null, cl: null }; /* 스튜디오 선 아이콘 — 글자색(currentColor) */
    const e = p.ent;
    if (!e || !e.paint) return null; /* 이 자리 그림이 여러 색이라 '이 자리의 색'이 하나로 정해지지 않는다 */
    return { c: e.paint, cl: e.ltPaint || (e.lt ? null : e.paint) };
  }
  function paintPlace(p, to) {
    const el = p.el;
    const pc = placeColors(p, to);
    const mode = pc ? 'mask' : 'file';
    const sig = to.atom + '|' + mode + '|' + (pc ? (pc.c || '') + '|' + (pc.cl || '') : to.src);
    if (el.getAttribute('data-atm') === mode && el.__atmSig === sig) return true;
    clearPaint(el);
    el.__atmSig = sig;
    el.setAttribute('data-atm', mode);
    if (mode === 'mask') {
      el.style.setProperty('--atm-m', cssUrl(to.src));
      if (pc.c) el.style.setProperty('--atm-c', pc.c);
      if (pc.cl) el.style.setProperty('--atm-c-lt', pc.cl);
    } else {
      el.style.setProperty('--atm-src', cssUrl(to.src));
      if (to.lt) el.style.setProperty('--atm-src-lt', cssUrl(to.lt));
    }
    return true;
  }
  function clearPaint(el) {
    if (!el.hasAttribute('data-atm')) return true;
    el.removeAttribute('data-atm');
    el.__atmSig = '';
    ['--atm-m', '--atm-c', '--atm-c-lt', '--atm-src', '--atm-src-lt'].forEach((v) => el.style.removeProperty(v));
    return true;
  }

  /* ── 얹기 — 바꿀 원자 · 분자를 그 원자 · 분자가 있던 화면 HTML 에서 그대로 떼어 와 같은 자리에 얹는다 ── */
  const docs = new Map(); /* 접두어 → 화면 HTML 을 한 번 읽어 둔 <template> */
  /* 그 화면 모듈이 아직 안 실렸으면(js/core/tpl-modules.js 는 지금 화면 것만 싣는다) 싣기 시작하고 true.
     실리면 then 을 부른다 — 입히기는 다시 돌리고, 썸네일은 그 칸만 다시 그린다.
     입히기(저장해 둔 교체)는 화면 모습 자체라 바로(need — 막이 걷히기 전에), 창 안 썸네일은 페이지 로드 뒤에(later) */
  function moduleLater(px, then, urgent) {
    const M = window.WEMB && WEMB.tplModules;
    const name = 'build_' + px;
    if (!M || M.has(name) || !M.known(name)) return false;
    (urgent ? M.need([name]) : M.later([name])).then(then, () => {});
    return true;
  }
  function tplDoc(px) {
    if (!docs.has(px)) {
      if (moduleLater(px, () => schedule(0), true)) return null;   /* 아직 — 기억해 두지 않는다 */
      let t = null;
      const build = window['build_' + px];
      if (typeof build === 'function') {
        try { t = document.createElement('template'); t.innerHTML = build(); } catch (e) { t = null; }
      }
      docs.set(px, t);
    }
    return docs.get(px);
  }
  /* 노드 하나를 떼어 온다 — ids 가 있으면 그 조각(바로 아래 요소)만, 없으면 노드 통째로 */
  function cloneFrom(px, nodeId, ids) {
    const t = tplDoc(px);
    const src = t && nodeId && byId(t.content, nodeId);
    if (!src) return null;
    let node;
    if (ids) {
      node = src.cloneNode(false);
      ids.forEach((id) => { const c = childById(src, id); if (c) node.appendChild(c.cloneNode(true)); });
      if (node.children.length !== ids.length) return null;
    } else node = src.cloneNode(true);
    /* 같은 id 가 문서에 둘 생기지 않게 — 원래 화면의 id · 노드 번호는 지운다(글자 편집 · 원자 찾기 대상이 아니다) */
    [node, ...node.querySelectorAll('[id], [data-node-id]')].forEach((e) => {
      e.removeAttribute('id');
      if (e.hasAttribute('data-node-id')) { e.setAttribute('data-atm-nid', e.getAttribute('data-node-id')); e.removeAttribute('data-node-id'); }
    });
    /* 노드의 원래 화면 좌표는 버린다 — 얹을 자리는 바깥 상자가 맞춘다 */
    [['position', 'relative'], ['left', '0'], ['top', '0'], ['right', 'auto'], ['bottom', 'auto'], ['margin', '0'], ['transform', 'none'], ['translate', 'none'], ['rotate', 'none'], ['scale', 'none']]
      .forEach(([k, v]) => node.style.setProperty(k, v, 'important'));
    return node;
  }

  /* 다른 화면의 조각은 섀도 DOM 안에서 그 화면 CSS 로만 그린다.
     시트는 문서에 실린 그 화면 시트가 있으면 그 '지금' 글(템플릿 색 칠하기가 다시 쓴 것)을, 없으면 원본 글을 쓴다.
     화면에 얹을 때는(doc) 문서에도 실어 두고 숨은 빈 루트를 둬서 템플릿 색 칠하기가 칠하게 한다 — 썸네일은 문서에 싣지 않는다. */
  const noImport = (css) => String(css || '').replace(/@import[^;]+;/g, '');
  const BASE_SHEET = (() => {
    try {
      const s = new CSSStyleSheet();
      s.replaceSync('.atm-rep-root{display:block;position:relative!important;inset:auto!important;width:auto!important;height:auto!important;overflow:visible!important;background:transparent!important;z-index:auto!important}'
        + '.atx-mini-root{position:absolute!important;inset:0!important;width:auto!important;height:auto!important;overflow:hidden!important;background:transparent!important;z-index:auto!important}'
        + '.atx-mini-hold{position:absolute;left:0;top:0;transform-origin:0 0}');
      return s;
    } catch (e) { return null; }
  })();
  const shadowSheets = new Map(); /* 접두어 → [{ id, sheet, el, text }] */
  const styleMO = new MutationObserver((muts) => {
    const changed = new Set(muts.map((m) => (m.target.nodeType === 1 ? m.target : m.target.parentElement)));
    shadowSheets.forEach((list) => list.forEach((s) => {
      if (s.el && changed.has(s.el)) { try { s.sheet.replaceSync(noImport(s.el.textContent)); s.text = s.el.textContent; } catch (er) {} }
    }));
  });
  function sheetsFor(px, doc) {
    if (doc) { ensureCss(px); ensureAnchor(px); }
    let list = shadowSheets.get(px);
    if (!list) {
      list = [px + '-style', px + '-light-style'].concat(/^hn/.test(px) ? ['hana-live-style'] : [])
        .map((id) => ({ id, sheet: new CSSStyleSheet(), el: null, text: null }));
      shadowSheets.set(px, list);
    }
    const up = px.toUpperCase();
    list.forEach((s) => {
      const st = document.getElementById(s.id);
      if (st && s.el !== st) { s.el = st; s.text = null; styleMO.observe(st, { childList: true, characterData: true, subtree: true }); }
      const text = st ? st.textContent : s.id === px + '-style' ? window[up + '_CSS'] : s.id === px + '-light-style' ? window[up + '_LIGHT_CSS'] : '';
      if (text != null && text !== s.text) { try { s.sheet.replaceSync(noImport(text)); s.text = text; } catch (er) {} }
    });
    return list.map((s) => s.sheet).concat(BASE_SHEET ? [BASE_SHEET] : []);
  }
  /* 템플릿 색 칠하기는 문서에 그 화면 루트가 있을 때만 그 화면 시트를 칠한다 — 숨은 빈 루트 하나를 둔다 */
  function ensureAnchor(px) {
    if (document.querySelector('body > .atm-anchor.' + px + '-root')) return;
    const a = document.createElement('div');
    a.className = px + '-root atm-anchor';
    a.hidden = true;
    a.setAttribute('aria-hidden', 'true');
    document.body.appendChild(a);
  }
  /* 화면을 열 때와 같은 id 로 싣는다(js/templates/hana.js 등) */
  function ensureCss(px) {
    const up = px.toUpperCase();
    let added = false;
    [[px + '-style', window[up + '_CSS']], [px + '-light-style', window[up + '_LIGHT_CSS']]].forEach(([id, css]) => {
      if (!css || document.getElementById(id)) return;
      const st = document.createElement('style');
      st.id = id;
      st.textContent = css;
      document.head.appendChild(st);
      added = true;
    });
    if (added) { try { window.__applyTplTint && window.__applyTplTint(); } catch (e) {} }
  }

  /* 실제로 칠해지는 범위(그림 · 배경 · 테두리 · 글자) — 칸 상자보다 그림이 넘치는 조각이 많다 */
  function paintBounds(list) {
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    const add = (r) => {
      if (!(r.width > 0.5 && r.height > 0.5)) return;
      x1 = Math.min(x1, r.left); y1 = Math.min(y1, r.top); x2 = Math.max(x2, r.right); y2 = Math.max(y2, r.bottom);
    };
    const clear = (c) => !c || c === 'transparent' || /rgba\([^)]*,\s*0\)$/.test(c);
    list.forEach((top) => [top, ...top.querySelectorAll(':not(svg *)')].forEach((e) => {
      if (e.tagName === 'IMG' || e.tagName.toLowerCase() === 'svg') { add(e.getBoundingClientRect()); return; }
      const cs = getComputedStyle(e);
      if (cs.display === 'none') return;
      if ((cs.backgroundImage && cs.backgroundImage !== 'none') || !clear(cs.backgroundColor)
        || ['Top', 'Right', 'Bottom', 'Left'].some((k) => parseFloat(cs['border' + k + 'Width']) > 0 && cs['border' + k + 'Style'] !== 'none')) add(e.getBoundingClientRect());
      e.childNodes.forEach((n) => {
        if (n.nodeType !== 3 || !n.data.trim()) return;
        const rg = document.createRange();
        rg.selectNodeContents(n);
        add(rg.getBoundingClientRect());
      });
    }));
    return x1 === Infinity ? null : { left: x1, top: y1, right: x2, bottom: y2, width: x2 - x1, height: y2 - y1 };
  }
  const boxHost = (node) => { let h = node; while (h && h.parentElement && getComputedStyle(h).display === 'contents') h = h.parentElement; return h; };
  const scaleOf = (el) => { const w = el.offsetWidth; return w ? el.getBoundingClientRect().width / w : 1; };
  const boxRect = (el) => { const r = el.getBoundingClientRect(); return r.width || r.height ? r : null; };
  /* 판을 넣을 부모 — 조각은 노드 안, 그림 · 분자는 그 요소의 부모 */
  const hostOf = (pl) => boxHost(pl.type === 'part' ? pl.node : pl.el.parentElement);
  const hideTag = (pl) => (pl.type === 'part' ? pl.part : pl.type === 'mol' ? 'mol' : 'atom');
  function repOf(pl) {
    const host = hostOf(pl);
    if (!host) return null;
    for (const c of host.children) if (c.classList.contains('atm-rep') && c.getAttribute('data-atm-for') === pl.key) return c;
    return null;
  }
  /* 원래 자리 상자 — 조각 · 분자는 칠해지는 범위, 그림은 그 요소 상자 */
  function placeRectOf(pl) {
    if (pl.type === 'part') return paintBounds(pl.els);
    if (pl.type === 'mol') return paintBounds([pl.el]) || boxRect(pl.el);
    return boxRect(pl.el);
  }
  const nodeAt = (el, path) => (path || []).reduce((n, i) => (n && n.children[i]) || null, el);
  function firstText(root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.data.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP) });
    return w.nextNode();
  }
  function textNode(el) {
    if (!el) return null;
    for (const n of el.childNodes) if (n.nodeType === 3 && n.data.trim()) return n;
    return firstText(el);
  }
  /* 라벨은 글자를 그대로 둔다 — 바뀌는 것은 라벨의 생김새다 */
  function syncLabel(pl, clone) {
    for (const e of pl.els) {
      const t = firstText(e);
      if (!t) continue;
      const r = firstText(clone);
      if (r && r.data !== t.data) { r.data = t.data; return true; }
      return false;
    }
    return false;
  }
  /* 분자는 원래 글자 칸의 내용을 새 분자의 칸으로 옮긴다 — 칸 이름이 같은 것부터, 나머지는 순서대로 */
  function copyFields(inst, clone, to) {
    const src = (inst.paths || []).map((path, i) => ({ key: (inst.keys || [])[i], path }));
    const used = new Set();
    let changed = false;
    (to.fields || []).forEach((d) => {
      let j = src.findIndex((s, i) => !used.has(i) && s.key && s.key === d.key);
      if (j < 0) j = src.findIndex((s, i) => !used.has(i));
      if (j < 0) return;
      used.add(j);
      const from = textNode(nodeAt(inst.el, src[j].path)), into = textNode(nodeAt(clone, d.path));
      if (from && into && into.data !== from.data) { into.data = from.data; changed = true; }
    });
    return changed;
  }
  /* 상태(심각 · 경계 · 주의 깜박임)는 자리의 값이다 — 원래 조각의 상태를 새 조각에 옮긴다 */
  function copyStatus(pl, clone) {
    clone.querySelectorAll('[data-hn-status]').forEach((e) => e.removeAttribute('data-hn-status'));
    for (const e of pl.els) {
      const s = e.matches('[data-hn-status]') ? e : e.querySelector('[data-hn-status]');
      if (s) { if (clone.children[0]) clone.children[0].setAttribute('data-hn-status', s.getAttribute('data-hn-status')); return; }
    }
  }
  function syncRep(pl, rep, to) {
    const clone = rep.__atmClone;
    if (!clone) return false;
    if (pl.type === 'part' && pl.part === 'label' && to.kind === 'part' && to.part === 'label') return syncLabel(pl, clone);
    if (pl.type === 'mol' && to.kind === 'mol') return copyFields(pl, clone, to);
    return false;
  }
  /* 얹은 것을 원래 상자에 맞춘다 — 그림은 상자를 채우고(비율 유지), 라벨은 원래 크기로 가운데,
     심볼 · 분자는 상자 안에 들어가게(키우지는 않는다) */
  function fitRep(rep) {
    const hold = rep.firstElementChild, box = rep.__atmBox;
    if (!hold || !box || rep.__atmFit === 'fill') return !!hold;
    const k = scaleOf(rep) || 1; /* 화면 배율은 창 크기에 따라 바뀐다 — 잴 때마다 다시 구한다 */
    hold.style.transform = 'none';
    const clone = rep.__atmClone;
    const rr = rep.getBoundingClientRect();
    const b = clone && paintBounds(rep.__atmWhole ? [clone] : [...clone.children]);
    if (!b || !rr.width) return false;
    const bx = (b.left - rr.left) / k, by = (b.top - rr.top) / k, bw = b.width / k, bh = b.height / k;
    const s = rep.__atmFit === 'natural' ? 1 : Math.min(1, box.w / bw, box.h / bh);
    const tx = (box.w - bw * s) / 2 - bx * s, ty = (box.h - bh * s) / 2 - by * s;
    hold.style.transform = 'translate(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px) scale(' + s.toFixed(4) + ')';
    return true;
  }
  const targetSig = (to) => [to.kind, to.atom || to.mol, to.px || '', to.node || to.src || ''].join('|');
  function applyRep(pl, to) {
    const sig = targetSig(to);
    let rep = repOf(pl);
    if (rep && rep.__atmSig === sig) {
      /* 다른 화면 조각의 밝기는 지금 화면을 따른다(다크 ↔ 라이트) */
      const fr = rep.__atmFrame, th = (pl.root && pl.root.dataset.theme) || 'dark';
      if (fr && fr.dataset.theme !== th) { fr.dataset.theme = th; fitRep(rep); }
      if (syncRep(pl, rep, to)) fitRep(rep);
      return true;
    }
    if (rep) clearRep(pl);
    const host = hostOf(pl);
    const rect = placeRectOf(pl);
    if (!host || !rect || !host.getClientRects().length) return false; /* 아직 그려지지 않았다 */
    const k = scaleOf(host) || 1;
    const hr = host.getBoundingClientRect();
    const box = { x: (rect.left - hr.left) / k - host.clientLeft, y: (rect.top - hr.top) / k - host.clientTop, w: rect.width / k, h: rect.height / k };
    rep = document.createElement('div');
    rep.className = 'atm-rep';
    rep.setAttribute('data-atm-part', hideTag(pl));
    rep.setAttribute('data-atm-for', pl.key);
    rep.style.cssText = 'left:' + box.x.toFixed(2) + 'px;top:' + box.y.toFixed(2) + 'px;width:' + box.w.toFixed(2) + 'px;height:' + box.h.toFixed(2) + 'px';
    const hold = document.createElement('div');
    hold.className = 'atm-rep-hold';
    rep.appendChild(hold);
    if (to.kind === 'file') {
      /* 그림 원자 — 판을 채워 그린다. 라이트 테마 짝은 그림 바꾸기와 같은 규칙(data-atm='file') */
      const im = document.createElement('img');
      im.className = 'atm-rep-img';
      im.alt = '';
      im.src = absUrl(to.src);
      paintPlace({ el: im, ent: null, studio: false }, Object.assign({}, to, { color: 'own' }));
      hold.classList.add('atm-rep-fill');
      hold.appendChild(im);
      rep.__atmFit = 'fill';
    } else {
      const clone = cloneFrom(to.px, to.node, to.kind === 'part' ? to.ids : null);
      if (!clone) return true; /* 바꿀 것을 그 화면에서 찾지 못했다 — 원래 그대로 둔다 */
      let frame = hold;
      if (to.px !== pxOf(pl.root)) {
        const sr = hold.attachShadow({ mode: 'open' });
        sr.adoptedStyleSheets = sheetsFor(to.px, true);
        frame = document.createElement('div');
        frame.className = to.px + '-root atm-rep-root' + (/^hn/.test(to.px) ? ' hn-root' : '');
        frame.dataset.theme = (pl.root && pl.root.dataset.theme) || 'dark';
        sr.appendChild(frame);
        rep.__atmFrame = frame;
      }
      frame.appendChild(clone);
      rep.__atmClone = clone;
      rep.__atmWhole = to.kind === 'mol';
      rep.__atmFit = to.kind === 'part' && to.part === 'label' ? 'natural' : 'contain';
      if (pl.type === 'part') copyStatus(pl, clone);
    }
    rep.__atmSig = sig;
    rep.__atmBox = box;
    rep.__atmEls = pl.els;
    rep.__atmSync = () => { if (syncRep(pl, rep, to)) fitRep(rep); };
    pl.els.forEach((e) => { e.setAttribute('data-atm-hide', hideTag(pl)); e.__atmRep = rep; });
    if (getComputedStyle(host).position === 'static') { host.style.position = 'relative'; host.setAttribute('data-atm-pos', ''); }
    host.appendChild(rep);
    syncRep(pl, rep, to);
    fitRep(rep);
    /* 그림이 늦게 오면(크기가 그림에 달린 경우) 다시 맞춘다 */
    if (rep.__atmClone) rep.__atmClone.querySelectorAll('img').forEach((im) => { if (!im.complete) im.addEventListener('load', () => fitRep(rep), { once: true }); });
    return true;
  }
  function dropRep(rep) {
    (rep.__atmEls || []).forEach((e) => { e.removeAttribute('data-atm-hide'); e.__atmRep = null; });
    const host = rep.parentElement;
    rep.remove();
    if (host && host.hasAttribute('data-atm-pos') && !host.querySelector(':scope > .atm-rep')) { host.style.position = ''; host.removeAttribute('data-atm-pos'); }
  }
  function clearRep(pl) {
    const rep = repOf(pl);
    if (rep) dropRep(rep);
    else pl.els.forEach((e) => { if (e.__atmRep) return; e.removeAttribute('data-atm-hide'); });
    return true;
  }

  /* ── 다시 입히기 — 화면이 다시 그려지거나(장면 · 테마 전환) 라이브가 줄을 더하면 ── */
  let applying = false, timer = 0;
  const hasWork = () => ui.open || Object.keys(store.pages).length > 0;
  function run() {
    clearTimeout(timer);
    applying = true;
    try { applyAll(); } catch (e) { console.warn('[원자 변경]', e); }
    finally { applying = false; mo.takeRecords(); liveMO.takeRecords(); }
    if (ui.open) refresh();
  }
  const schedule = (ms) => { clearTimeout(timer); timer = setTimeout(run, ms); };
  const RELEVANT = 'img, svg, [data-node-id]';
  const mo = new MutationObserver((muts) => {
    if (applying || !hasWork()) return;
    let now = false, later = false;
    for (const m of muts) {
      for (const n of m.addedNodes) {
        if (n.nodeType !== 1 || n.classList.contains('atm-rep') || n.closest('.atm-rep')) continue;
        /* 화면 루트가 새로 붙었다(장면 · 템플릿 전환) — 칠하기 전에 바로 입혀 원래 것이 비치지 않게 */
        if (n.parentElement === dt && pxOf(n)) now = true;
        else if (n.matches(RELEVANT) || n.querySelector(RELEVANT)) later = true;
      }
      if (ui.open && !later) for (const n of m.removedNodes) if (n.nodeType === 1 && (n.matches(RELEVANT) || n.querySelector(RELEVANT))) later = true;
    }
    if (now) run();
    else if (later) schedule(160);
  });
  mo.observe(main, { childList: true, subtree: true });
  /* 화면 종류 전환(대시보드 ↔ 트윈) · 내용 수정 켜고 끄기 */
  const moAttr = new MutationObserver(() => { if (hasWork()) schedule(60); });
  [dt, stage].forEach((el) => moAttr.observe(el, { attributes: true, attributeFilter: ['hidden', 'class', 'data-tpl'] }));
  /* 다크 ↔ 라이트 — 다른 화면에서 가져온 것(섀도 DOM)은 밝기를 직접 맞춰 줘야 한다 */
  const moTheme = new MutationObserver(() => { if (!applying && (ui.open || main.querySelector('.atm-rep'))) schedule(30); });
  moTheme.observe(main, { attributes: true, subtree: true, attributeFilter: ['data-theme'] });
  /* 숨긴 원래 라벨 · 분자의 글자가 바뀌면(라이브 수치 · 내용 수정) 얹은 판에 바로 옮겨 적는다 */
  const liveMO = new MutationObserver((muts) => {
    if (applying) return;
    const reps = new Set();
    muts.forEach((m) => {
      const n = m.target.nodeType === 1 ? m.target : m.target.parentElement;
      const orig = n && n.closest('[data-atm-hide="label"], [data-atm-hide="mol"]');
      if (orig && orig.__atmRep) reps.add(orig.__atmRep);
    });
    reps.forEach((rep) => { if (rep.isConnected && rep.__atmSync) rep.__atmSync(); });
  });
  function watchLive(page) {
    liveMO.disconnect();
    page.scopes.forEach((S) => S.querySelectorAll('[data-atm-hide="label"], [data-atm-hide="mol"]')
      .forEach((e) => liveMO.observe(e, { characterData: true, childList: true, subtree: true })));
  }
  window.addEventListener('resize', () => { if (pending) schedule(200); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (Object.keys(store.pages).length) schedule(0); });

  /* ── 창 ── */
  let hl = null;
  function ensureUI() {
    if (ui.el) return ui.el;
    const el = document.createElement('section');
    el.className = 'atx';
    el.id = 'atomSwap';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', '원자 변경');
    el.hidden = true;
    el.innerHTML =
      '<header class="atx-head">'
      + '<span class="atx-mark">' + ICONS.atom + '</span>'
      + '<div class="atx-ttl"><b>원자 변경</b><span class="atx-sub"></span></div>'
      + '<button type="button" class="atx-pick" aria-pressed="false" title="화면에서 원자 · 분자를 눌러 고릅니다 (Esc 로 끝내기)">' + ICONS.pick + '<span>화면에서 고르기</span></button>'
      + '<button type="button" class="atx-x" title="닫기" aria-label="원자 변경 닫기">' + ICONS.x + '</button>'
      + '</header>'
      + '<div class="atx-body"></div>'
      + '<footer class="atx-foot"><span class="atx-count"></span><button type="button" class="atx-resetall">이 화면 모두 원래대로</button></footer>';
    document.body.appendChild(el);
    ui.el = el;
    ui.body = el.querySelector('.atx-body');
    hl = document.createElement('div');
    hl.className = 'atx-hl';
    hl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(hl);
    try { const pos = JSON.parse(localStorage.getItem(POS) || 'null'); if (pos) moveTo(pos.x, pos.y); } catch (e) {}

    el.querySelector('.atx-x').addEventListener('click', close);
    el.querySelector('.atx-pick').addEventListener('click', () => setPicking(!ui.picking));
    el.querySelector('.atx-resetall').addEventListener('click', resetPage);
    ui.body.addEventListener('click', onBodyClick);
    ui.body.addEventListener('change', onBodyChange);
    ui.body.addEventListener('input', onBodyInput);
    ui.body.addEventListener('pointerover', (e) => {
      const t = e.target.closest('.atx-tile');
      if (!t || ui.view !== 'list' || !lastRes) return;
      const g = t.dataset.level === 'mol' ? lastRes.mols.get(t.dataset.key) : lastRes.atoms.get(t.dataset.key);
      if (g) highlight(g.places.filter(rendered));
    });
    ui.body.addEventListener('pointerleave', () => { if (ui.view === 'list') highlight([]); });
    dragBy(el.querySelector('.atx-head'));
    return el;
  }
  function moveTo(x, y) {
    const el = ui.el;
    const w = el.offsetWidth || 360, h = el.offsetHeight || 200;
    const nx = Math.max(8, Math.min(window.innerWidth - w - 8, x));
    const ny = Math.max(8, Math.min(window.innerHeight - Math.min(h, 120), y));
    el.style.left = nx + 'px';
    el.style.top = ny + 'px';
    el.style.right = 'auto';
  }
  function dragBy(head) {
    let d = null;
    head.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('button')) return;
      const r = ui.el.getBoundingClientRect();
      d = { dx: e.clientX - r.left, dy: e.clientY - r.top };
      try { head.setPointerCapture(e.pointerId); } catch (er) {}
      e.preventDefault();
    });
    head.addEventListener('pointermove', (e) => { if (d) moveTo(e.clientX - d.dx, e.clientY - d.dy); });
    const end = () => {
      if (!d) return;
      d = null;
      try { localStorage.setItem(POS, JSON.stringify({ x: parseFloat(ui.el.style.left) || 0, y: parseFloat(ui.el.style.top) || 0 })); } catch (e) {}
    };
    head.addEventListener('pointerup', end);
    head.addEventListener('pointercancel', end);
  }
  function open() {
    ensureUI();
    ui.open = true;
    ui.el.hidden = false;
    railSync();
    if (ui.el.style.left) moveTo(parseFloat(ui.el.style.left), parseFloat(ui.el.style.top)); /* 창 크기가 바뀌었으면 화면 안으로 */
    ui.sigList = '';
    run();
    loadIndex().then(() => { ui.err = null; ui.sigList = ''; mapsCache = null; run(); }).catch((e) => { ui.err = e; ui.sigList = ''; refresh(); });
  }
  function close() {
    if (!ui.el) return;
    ui.open = false;
    ui.el.hidden = true;
    setPicking(false);
    highlight([]);
    railSync();
  }
  const toggle = () => (ui.open ? close() : open());
  function railSync() {
    const b = document.querySelector('.siderail .railbtn[data-rail="atoms"]');
    if (b) { b.classList.toggle('atx-on', ui.open); b.setAttribute('aria-pressed', ui.open ? 'true' : 'false'); }
  }

  /* ── 창 내용 ── */
  /* 페이지 이름 — 템플릿마다 화면 표(js/templates/*.js)의 이름. 없으면 템플릿 id */
  let pxTitles = null;
  function pageTitleOf(tid) {
    if (!pxTitles) {
      pxTitles = new Map();
      const tables = [];
      try { if (typeof HN_SCREENS !== 'undefined') tables.push(HN_SCREENS); } catch (e) {}
      try { if (typeof HJ_SCREENS !== 'undefined') tables.push(HJ_SCREENS); } catch (e) {}
      try { if (typeof PK_SCREENS !== 'undefined') tables.push(PK_SCREENS); } catch (e) {}
      try { if (typeof LS_SCREENS !== 'undefined') tables.push(LS_SCREENS); } catch (e) {}
      tables.forEach((t) => Object.values(t).forEach((s) => { if (s && s.px && s.title && !pxTitles.has(s.px)) pxTitles.set(s.px, s.title.split(' — ').pop()); }));
    }
    const px = IDX && IDX.pxByTpl.get(tid);
    return (px && pxTitles.get(px)) || tid;
  }
  function pageName(page) {
    if (page.kind === 'tpl') {
      const bn = (dt.querySelector('.dt-bname') || {}).textContent;
      if (bn && bn.trim()) return bn.trim();
      const t = IDX && IDX.tplByPx.get(page.px);
      return t ? t.id : page.px;
    }
    if (page.kind === 'flat') return '그림 한 장으로 된 시안';
    const proj = (document.getElementById('tbProj') || {}).textContent;
    return (proj && proj.trim() ? proj.trim() + ' · ' : '') + (page.key === 'studio:dt' ? '디지털 트윈' : '대시보드');
  }
  /* 분류별 묶음 — 많은 분류부터 */
  function grouped(items, catOf) {
    const by = new Map();
    items.forEach((x) => { const c = catOf(x); (by.get(c) || by.set(c, []).get(c)).push(x); });
    by.forEach((l) => l.sort((a, b) => b.n - a.n || String(a.key).localeCompare(b.key)));
    return [...by.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  }
  function atomItems(res) {
    const out = [];
    res.atoms.forEach((a) => { const n = a.places.filter(rendered).length; if (n) out.push({ key: a.key, g: a, n }); });
    return out;
  }
  function molItems(res) {
    const out = [];
    res.mols.forEach((g) => { const n = g.places.filter(rendered).length; if (n) out.push({ key: g.key, g, n }); });
    return out;
  }
  /* 화면이 그대로면 다시 그리지 않는다 — 라이브가 줄을 바꿀 때마다 창이 깜박이지 않게 */
  function refresh() {
    if (!ui.open) return;
    const res = lastRes || scan(currentPage(), mapsFor(null));
    const page = res.page;
    if (ui.pageKey !== page.key) { ui.pageKey = page.key; ui.view = 'list'; ui.sel = ui.place = ui.mol = ui.inst = null; ui.listCat = ''; highlight([]); }
    ui.el.dataset.shot = pageTheme(page) === 'light' ? 'light' : 'dark';
    const sub = ui.el.querySelector('.atx-sub');
    sub.textContent = sub.title = pageName(page);
    const rec = pageRec(page.key);
    const cnt = recCount(rec);
    ui.el.querySelector('.atx-count').textContent = cnt ? '바꾼 것 ' + cnt + '개' : '바꾼 것 없음';
    ui.el.querySelector('.atx-resetall').disabled = !cnt;
    ui.el.querySelector('.atx-pick').disabled = page.kind === 'flat' || !IDX;
    const ai = atomItems(res), mi = molItems(res);
    const sig = [page.key, ui.el.dataset.shot, ui.view, ui.listLevel, ui.listCat, ui.level, ui.sel, ui.place, ui.scope, ui.mol, ui.inst, ui.molScope, ui.cat, ui.chipsOpen, ui.color, ui.fam, ui.q,
      IDX ? 1 : 0, ui.err ? 1 : 0, storeVer, ai.map((x) => x.key + '=' + x.n).join(','), mi.map((x) => x.key + '=' + x.n).join(',')].join('¦');
    if (sig === ui.sigList) return;
    ui.sigList = sig;
    if (page.kind === 'flat') return show('<div class="atx-empty"><b>이 화면은 원자로 나뉘어 있지 않아요</b><p>그림 한 장(또는 SVG 한 덩어리)으로 된 시안이라, 화면 안에서 원자를 찾을 수 없어요.</p></div>');
    if (ui.err && !IDX) return show('<div class="atx-empty atx-err"><b>분자 라이브러리 서버에 연결하지 못했어요</b><p>' + esc(ui.err.message) + '</p><p>원자 · 분자 목록과 바꿀 것은 wemb-atomic 서버로 스튜디오를 열었을 때 볼 수 있어요 — 폴더의 WEMB Studio 켜기.cmd 로 열면 Node.js 가 있는 PC 에서 함께 켜져요. 이미 바꾼 것은 서버 없이도 화면에 그대로 보여요.</p></div>');
    if (!IDX) return show('<div class="atx-empty"><p>분자 라이브러리에서 원자 목록을 불러오는 중…</p></div>');
    if (ui.view === 'detail') {
      const S = selection(res); /* 원자를 품은 분자는 고른 원자의 자리에서 구한다 */
      if (S.a || S.g) return renderDetail(res);
    }
    ui.view = 'list';
    return renderList(res, ai, mi);
  }
  let miniIO = null;
  function show(html) {
    if (miniIO) miniIO.disconnect();
    ui.body.innerHTML = html;
  }

  /* 목록 — 단계(원자 · 분자)를 고르고, 분류별로 본다 */
  function renderList(res, ai, mi) {
    const rec = pageRec(res.page.key);
    const level = ui.listLevel === 'mol' ? 'mol' : 'atom';
    const items = level === 'mol' ? mi : ai;
    const catOf = (x) => (level === 'mol' ? molCat(x.key) : atomCat(x.key, x.g.places[0]));
    const groups = grouped(items, catOf);
    if (ui.listCat && !groups.some(([c]) => c === ui.listCat)) ui.listCat = '';
    const changed = (x) => !!(rec && (level === 'mol'
      ? rec.mols[x.key] || x.g.places.some((i) => rec.molPlaces[i.key])
      : rec.atoms[x.key] || x.g.places.some((p) => rec.places[p.key])));
    const tile = (x) => '<button type="button" class="atx-tile' + (changed(x) ? ' is-changed' : '') + (level === 'atom' && !isLib(x.key) ? ' is-local' : '') + '" data-level="' + level + '" data-key="' + esc(x.key) + '" title="' + esc(level === 'mol' ? molTitle(x.g) : atomTitle(x.g)) + '">'
      + (level === 'mol' ? thumbOfInst(x.g.places.find(rendered)) : thumbOfAtom(x.g)) + '<span class="atx-cap"><b>' + esc(level === 'mol' ? molName(x.key) : atomName(x.g)) + '</b><em>' + x.n + '곳</em></span>'
      + (changed(x) ? '<i class="atx-badge">바뀜</i>' : '') + '</button>';
    const sections = groups.filter(([c]) => !ui.listCat || c === ui.listCat)
      .map(([c, l]) => (ui.listCat ? '' : '<h4 class="atx-sec">' + esc(c) + '<em>' + l.length + '</em></h4>') + '<div class="atx-grid">' + l.map(tile).join('') + '</div>').join('');
    show('<div class="atx-seg atx-lvl" role="tablist" aria-label="단계">'
      + ['atom', 'mol'].map((k) => '<button type="button" role="tab" data-list-level="' + k + '" aria-selected="' + (k === level) + '">' + LEVEL_WORD[k] + '<em>' + (k === 'mol' ? mi.length : ai.length) + '</em></button>').join('')
      + '</div>'
      + (items.length
        ? chipRow([{ value: '', label: '전체', n: items.length }].concat(groups.map(([c, l]) => ({ value: c, label: c, n: l.length }))), ui.listCat, 'data-list-cat')
          + '<p class="atx-hint">' + (level === 'mol'
            ? '분자를 누르면 바꿀 분자를 고를 수 있어요. 글자는 원래 내용을 새 분자의 같은 칸으로 옮겨요.'
            : '원자를 누르면 같은 분류의 원자부터 바꿀 원자를 고를 수 있어요. 그 원자를 품은 분자(오브젝트)도 바꿀 수 있어요.') + '</p>'
          + sections
        : '<div class="atx-empty"><p>' + (level === 'mol'
          ? '이 화면에는 분자 라이브러리의 분자가 없어요.<br>스튜디오가 직접 그린 부분은 분자 라이브러리에 없어요 — 템플릿 화면이나, 에셋으로 넣은 템플릿 조각에서 바꿀 수 있어요.'
          : '이 화면에서 바꿀 수 있는 원자를 찾지 못했어요.') + '</p></div>'));
    mountMinis(ui.body);
  }
  const isLib = (key) => !!(IDX && (IDX.icons.has(key) || IDX.parts.has(key)));
  function atomName(a) {
    if (IDX && IDX.parts.has(a.key)) return IDX.parts.get(a.key).name || PART_WORD[a.places[0].part];
    if (a.key.startsWith('svg:')) return svgName(a.places[0].el) || '스튜디오 아이콘';
    if (IDX && IDX.icons.has(a.key)) return base(IDX.icons.get(a.key).src);
    return base(a.places[0].file);
  }
  function atomTitle(a) {
    const where = ' · 이 화면 ' + a.places.length + '곳';
    if (IDX && IDX.parts.has(a.key)) return atomName(a) + ' — 분자에서 옮긴 원자(' + PART_WORD[a.places[0].part] + ')' + where;
    if (a.key.startsWith('svg:')) return atomName(a) + ' — 스튜디오가 그린 선 아이콘(라이브러리에 없음)' + where;
    const i = IDX && IDX.icons.get(a.key);
    const files = [...new Set(a.places.map((p) => p.file))];
    return (i ? atomName(a) + ' — ' + atomCat(a.key) + ' · 원본 ' + i.uses + '곳' : atomName(a) + ' — 분자 라이브러리에 없는 그림') + where + '\n' + files.slice(0, 6).join('\n');
  }
  function molTitle(g) {
    const m = IDX && IDX.mols.get(g.key);
    return molName(g.key) + ' — ' + molCat(g.key) + (m ? ' · 원본 ' + m.instanceCount + '곳' : '') + ' · 이 화면 ' + g.places.length + '곳';
  }

  /* ── 썸네일 ── */
  /* 그림 — 지금 화면이 라이트면 라이트 짝(-lt) 파일로(다크용 흰 아이콘이 밝은 칸에 묻히지 않게) */
  function imgThumb(file) {
    const e = IDX && IDX.files.get(file);
    const src = ui.el && ui.el.dataset.shot === 'light' && e && e.lt ? e.lt : file;
    return '<span class="atx-th"><img src="' + esc(src) + '" alt="" loading="lazy" decoding="async"></span>';
  }
  const miniThumb = (o) => '<span class="atx-th atx-th-mini" data-mini="' + esc(JSON.stringify(o)) + '"></span>';
  function thumbOfAtom(a, p) {
    p = p || a.places.find(rendered) || a.places[0];
    if (p.type === 'part') return miniThumb({ px: pxOf(p.root), node: p.nodeId, ids: p.ids });
    if (p.studio) {
      const c = p.el.cloneNode(true);
      ['data-atm', 'style', 'class', 'id'].forEach((k) => c.removeAttribute(k));
      return '<span class="atx-th atx-th-svg">' + c.outerHTML + '</span>';
    }
    return imgThumb(p.file);
  }
  const thumbOfInst = (inst) => (inst ? miniThumb({ px: pxOf(inst.root), node: inst.node }) : '<span class="atx-th"></span>');
  function thumbOfTarget(to) {
    if (!to) return '';
    if (to.kind === 'file') return imgThumb(to.src);
    return miniThumb({ px: to.px, node: to.node, ids: to.kind === 'part' ? to.ids : null });
  }
  /* 심볼 · 라벨 · 분자 — 원래 화면 HTML 에서 떼어 와 섀도 DOM 안에서 그 화면 CSS 로 그리고, 칸에 맞춰 줄인다.
     보일 때 그린다(분자 후보는 여러 화면에서 와서 많다) */
  const MIN_MINI = 0.12;
  function mountMini(host, o) {
    if (moduleLater(o.px, () => { if (host.isConnected) mountMini(host, o); })) return;
    const clone = cloneFrom(o.px, o.node, o.ids || null);
    if (!clone || !host.attachShadow) { host.classList.add('atx-miss'); return; }
    const sr = host.shadowRoot || host.attachShadow({ mode: 'open' });
    sr.adoptedStyleSheets = sheetsFor(o.px, false);
    const frame = document.createElement('div');
    frame.className = o.px + '-root atx-mini-root';
    frame.dataset.theme = (ui.el && ui.el.dataset.shot) || 'dark';
    const hold = document.createElement('div');
    hold.className = 'atx-mini-hold';
    hold.appendChild(clone);
    frame.appendChild(hold);
    sr.replaceChildren(frame);
    const fit = () => {
      hold.style.transform = 'none';
      const hr = host.getBoundingClientRect();
      const b = paintBounds(o.ids ? [...clone.children] : [clone]);
      if (!b || !hr.width) return;
      let s = Math.min(2, (hr.width - 8) / b.width, (hr.height - 8) / b.height);
      let left = (hr.width - b.width * s) / 2;
      /* 아주 넓은 줄(표 줄 · 머리줄)은 점처럼 작아지지 않게 — 최소 배율로 두고 왼쪽부터 보여 준다 */
      if (s < MIN_MINI) { s = MIN_MINI; left = 4; }
      hold.style.transform = 'translate(' + (left - (b.left - hr.left) * s).toFixed(2) + 'px,' + ((hr.height - b.height * s) / 2 - (b.top - hr.top) * s).toFixed(2) + 'px) scale(' + s.toFixed(4) + ')';
    };
    fit();
    clone.querySelectorAll('img').forEach((im) => { if (!im.complete) im.addEventListener('load', fit, { once: true }); });
  }
  function mountMinis(root) {
    if (!miniIO) {
      miniIO = new IntersectionObserver((entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        miniIO.unobserve(e.target);
        const raw = e.target.getAttribute('data-mini');
        e.target.removeAttribute('data-mini');
        try { mountMini(e.target, JSON.parse(raw)); } catch (er) { e.target.classList.add('atx-miss'); }
      }), { root: ui.body, rootMargin: '240px' });
    }
    root.querySelectorAll('.atx-th[data-mini]').forEach((h) => miniIO.observe(h));
  }

  /* ── 고른 것 — 단계(원자 · 분자) · 지금 모습 · 범위 · 바꿀 것 ── */
  function selection(res) {
    const a = ui.sel ? res.atoms.get(ui.sel) || null : null;
    const pl = a && ui.place ? a.places.find((p) => p.key === ui.place) || null : null;
    const ref = pl || (a ? a.places.find(rendered) || a.places[0] : null);
    /* 원자를 품은 분자 — 고른 자리가 있으면 그 자리의 분자, 목록에서 고른 원자면 첫 자리의 분자 */
    let inst = ui.inst ? res.molPlaces.find((i) => i.key === ui.inst) || null : null;
    if (!inst && ref) inst = molOfPlace(res, ref);
    const g = inst ? inst.mol : ui.mol ? res.mols.get(ui.mol) || null : null;
    return { a, pl, ref, inst, g, instPicked: !!ui.inst && !!inst };
  }
  function renderDetail(res) {
    const S = selection(res);
    const rec = pageRec(res.page.key);
    if (ui.level === 'atom' && !S.a) ui.level = 'mol';
    if (ui.level === 'mol' && !S.g) ui.level = 'atom';
    const level = ui.level;
    const head = '<div class="atx-dhead"><button type="button" class="atx-back">' + ICONS.back + '<span>목록</span></button>'
      + '<b class="atx-dname">' + esc(level === 'mol' ? molName(S.g.key) : atomName(S.a)) + '</b>'
      + '<span class="atx-dkind">' + esc(level === 'mol' ? molCat(S.g.key) : atomCat(S.a.key, S.ref)) + '</span></div>'
      + '<div class="atx-seg atx-lvl" role="tablist" aria-label="바꿀 단계">'
      + '<button type="button" role="tab" data-level="atom" aria-selected="' + (level === 'atom') + '"' + (S.a ? '' : ' disabled') + '>원자' + (S.a ? '<small>' + esc(atomCat(S.a.key, S.ref)) + '</small>' : '') + '</button>'
      + '<button type="button" role="tab" data-level="mol" aria-selected="' + (level === 'mol') + '"' + (S.g ? '' : ' disabled title="이 원자는 분자 라이브러리의 분자 안에 있지 않아요"') + '>분자' + (S.g ? '<small>' + esc(molName(S.g.key)) + '</small>' : '') + '</button>'
      + '</div>';
    show(head + (level === 'mol' ? molBody(res, S, rec) : atomBody(res, S, rec)));
    mountMinis(ui.body);
    if (level === 'mol') highlight(S.g.places.filter(rendered), S.instPicked ? S.inst : null);
    else highlight(S.a.places.filter(rendered), S.pl);
  }
  /* 분류 칩 — 고른 것의 분류를 맨 앞에 두고, 나머지는 많은 순 */
  function chipsHtml(counts, current) {
    const cats = Object.keys(counts).sort((x, y) => (x === current ? -1 : y === current ? 1 : counts[y] - counts[x] || x.localeCompare(y)));
    if (!cats.includes(ui.cat)) ui.cat = cats.includes(current) ? current : cats[0] || null;
    return chipRow(cats.map((c) => ({ value: c, label: c, n: counts[c], cur: c === current })), ui.cat, 'data-cat');
  }
  /* 칩 줄 — 분류가 많으면 앞의 몇 개(고른 분류 포함)만 보이고 '분류 더 보기'로 펼친다 */
  const CHIP_SHOWN = 8;
  function chipRow(items, selected, attr) {
    let shown = items;
    const more = !ui.chipsOpen && items.length > CHIP_SHOWN;
    if (more) {
      shown = items.slice(0, CHIP_SHOWN - 1);
      const sel = items.find((x) => x.value === selected);
      if (sel && !shown.includes(sel)) shown.push(sel);
    }
    return '<div class="atx-chips" role="group" aria-label="분류">'
      + shown.map((x) => '<button type="button" ' + attr + '="' + esc(x.value) + '" aria-pressed="' + (x.value === selected) + '"' + (x.cur ? ' class="is-cur"' : '') + '>' + esc(x.label) + '<em>' + x.n + '</em></button>').join('')
      + (more ? '<button type="button" class="atx-more" data-chips="open">분류 더 보기 +' + (items.length - shown.length) + '</button>'
        : items.length > CHIP_SHOWN ? '<button type="button" class="atx-more" data-chips="close">접기</button>' : '')
      + '</div>';
  }
  function famSelect(fams) {
    return '<select class="atx-fam" aria-label="프로젝트"><option value="">모든 프로젝트</option>' + fams.map((f) => '<option value="' + esc(f) + '"' + (f === ui.fam ? ' selected' : '') + '>' + esc(IDX.families[f] || f) + '</option>').join('') + '</select>';
  }
  const searchBox = (ph) => '<input class="atx-q" type="search" placeholder="' + esc(ph) + '" aria-label="찾기" value="' + esc(ui.q) + '">';
  function defaultFam(page, fams) {
    if (ui.fam !== null) return;
    const mine = page.kind === 'tpl' && IDX.tplByPx.get(page.px);
    ui.fam = mine && fams.includes(mine.family) ? mine.family : '';
  }

  /* 원자 단계 — 원자 후보는 그림 원자(맥락 분류)와 분자에서 옮긴 원자(이름 분류)를 함께 분류별로 */
  function atomBody(res, S, rec) {
    const a = S.a, pl = S.pl, p0 = pl || S.ref;
    const visible = a.places.filter(rendered);
    if (!pl) ui.scope = 'atom';
    const cur = ui.scope === 'place' && pl ? (rec && (rec.places[pl.key] || rec.atoms[a.key])) || null : (rec && rec.atoms[a.key]) || null;
    const curShown = cur && cur.kind !== 'orig' ? cur : null;
    const onlyHere = ui.scope === 'place' && pl && rec && rec.places[pl.key];
    /* 색 — 이 자리가 한 가지 색 그림이거나 스튜디오 선 아이콘이면 새 모양을 이 자리 색으로 칠할 수 있다 */
    const canPlaceColor = p0.type !== 'part' && (p0.studio || !!(p0.ent && p0.ent.paint));
    const color = curShown && curShown.color ? curShown.color : ui.color;
    const pool = IDX.raw.icons.map((i) => ({ id: i.id, cat: i.context || 'Icon', file: i, tpls: i.templates, text: base(i.src) + ' ' + (i.context || '') }))
      .concat(IDX.raw.parts.filter((x) => x.rep).map((x) => ({ id: x.id, cat: x.category || catOfName(x.name), part: x, tpls: x.templates, text: x.name + ' ' + (x.category || '') })));
    const fams = [...new Set(pool.flatMap((c) => c.tpls.map(familyOf)))].sort();
    defaultFam(res.page, fams);
    const q = ui.q.trim().toLowerCase();
    const shown = pool.filter((c) => (!ui.fam || c.tpls.some((t) => familyOf(t) === ui.fam)) && (!q || c.text.toLowerCase().includes(q)));
    const counts = {};
    shown.forEach((c) => { counts[c.cat] = (counts[c.cat] || 0) + 1; });
    const current = atomCat(a.key, p0);
    if (!(current in counts)) counts[current] = 0;
    const chips = chipsHtml(counts, current);
    const cands = shown.filter((c) => c.cat === ui.cat);
    const curId = curShown ? curShown.atom : a.key;
    return '<div class="atx-now">'
      + '<figure>' + thumbOfAtom(a, p0) + '<figcaption>원래</figcaption></figure>'
      + '<span class="atx-arrow" aria-hidden="true">→</span>'
      + '<figure>' + (curShown ? thumbOfTarget(curShown) : '<span class="atx-th atx-same">그대로</span>') + '<figcaption>' + (curShown ? '바꾼 원자' : '바꾸지 않음') + '</figcaption></figure>'
      + '</div>'
      + (pl
        ? '<div class="atx-seg" role="radiogroup" aria-label="바꿀 범위"><button type="button" data-scope="atom" aria-pressed="' + (ui.scope === 'atom') + '">같은 원자 모두 · ' + visible.length + '곳</button><button type="button" data-scope="place" aria-pressed="' + (ui.scope === 'place') + '">고른 자리만</button></div>'
        : '<p class="atx-note">이 화면에 있는 같은 원자 ' + visible.length + '곳을 함께 바꿔요. 한 자리만 바꾸려면 ‘화면에서 고르기’로 그 자리를 누르세요.</p>')
      + (canPlaceColor
        ? '<div class="atx-seg atx-seg-color" role="radiogroup" aria-label="색"><button type="button" data-color="place" aria-pressed="' + (color === 'place') + '">이 자리 색으로</button><button type="button" data-color="own" aria-pressed="' + (color === 'own') + '">원자 색 그대로</button></div>'
        : '')
      + ((onlyHere || (cur && ui.scope !== 'place')) ? '<button type="button" class="atx-undo">원래대로</button>' : '')
      + '<div class="atx-chead"><b>바꿀 원자</b><em>' + shown.length + '</em>' + famSelect(fams) + searchBox('이름 · 분류') + '</div>'
      + chips
      + '<div class="atx-cands">' + (cands.length ? cands.map((c) => '<button type="button" class="atx-cand" data-id="' + esc(c.id) + '" aria-pressed="' + (c.id === curId) + '" title="' + esc(candTitle(c)) + '">'
        + (c.part ? miniThumb({ px: IDX.pxByTpl.get(c.part.rep.template), node: c.part.rep.node, ids: c.part.rep.ids }) : imgThumb(c.file.src))
        + (c.id === a.key ? '<i class="atx-badge atx-badge-orig">원래</i>' : '') + '</button>').join('') : '<p class="atx-none">이 분류에 맞는 원자가 없어요.</p>') + '</div>';
  }
  /* 분자 단계 — 원자를 품은 분자(오브젝트)를 통째로. 분자 후보는 분류별로 */
  function molBody(res, S, rec) {
    const g = S.g, inst = S.instPicked ? S.inst : null;
    const visible = g.places.filter(rendered);
    if (!inst) ui.molScope = 'all';
    const cur = ui.molScope === 'place' && inst ? (rec && (rec.molPlaces[inst.key] || rec.mols[g.key])) || null : (rec && rec.mols[g.key]) || null;
    const onlyHere = ui.molScope === 'place' && inst && rec && rec.molPlaces[inst.key];
    const pool = IDX.raw.molecules.map((m) => ({ id: m.id, cat: m.category, mol: m, tpls: m.templates, text: m.name + ' ' + m.category }));
    const fams = [...new Set(pool.flatMap((c) => c.tpls.map(familyOf)))].sort();
    defaultFam(res.page, fams);
    const q = ui.q.trim().toLowerCase();
    const shown = pool.filter((c) => (!ui.fam || c.tpls.some((t) => familyOf(t) === ui.fam)) && (!q || c.text.toLowerCase().includes(q)));
    const counts = {};
    shown.forEach((c) => { counts[c.cat] = (counts[c.cat] || 0) + 1; });
    const current = molCat(g.key);
    if (!(current in counts)) counts[current] = 0;
    const chips = chipsHtml(counts, current);
    const cands = shown.filter((c) => c.cat === ui.cat);
    const curId = cur ? cur.mol : g.key;
    const ref = inst || S.inst || visible[0] || g.places[0];
    return '<div class="atx-now">'
      + '<figure>' + thumbOfInst(ref) + '<figcaption>원래</figcaption></figure>'
      + '<span class="atx-arrow" aria-hidden="true">→</span>'
      + '<figure>' + (cur ? thumbOfTarget(cur) : '<span class="atx-th atx-same">그대로</span>') + '<figcaption>' + (cur ? '바꾼 분자' : '바꾸지 않음') + '</figcaption></figure>'
      + '</div>'
      + (inst
        ? '<div class="atx-seg" role="radiogroup" aria-label="바꿀 범위"><button type="button" data-mol-scope="all" aria-pressed="' + (ui.molScope === 'all') + '">같은 분자 모두 · ' + visible.length + '곳</button><button type="button" data-mol-scope="place" aria-pressed="' + (ui.molScope === 'place') + '">고른 자리만</button></div>'
        : '<p class="atx-note">이 화면에 있는 같은 분자 ' + visible.length + '곳을 함께 바꿔요. 한 곳만 바꾸려면 ‘화면에서 고르기’로 그 자리를 누르세요.</p>')
      + '<p class="atx-note">글자는 원래 내용을 새 분자의 같은 칸으로 옮겨요.</p>'
      + ((onlyHere || (cur && ui.molScope !== 'place')) ? '<button type="button" class="atx-undo">원래대로</button>' : '')
      + '<div class="atx-chead"><b>바꿀 분자</b><em>' + shown.length + '</em>' + famSelect(fams) + searchBox('이름 · 분류') + '</div>'
      + chips
      + '<div class="atx-cands atx-cands-mol">' + (cands.length ? cands.map((c) => '<button type="button" class="atx-cand" data-mol-id="' + esc(c.id) + '" aria-pressed="' + (c.id === curId) + '" title="' + esc(candTitle(c)) + '">'
        + miniThumb({ px: IDX.pxByTpl.get(c.mol.rep.template), node: c.mol.rep.node })
        + '<span class="atx-cname">' + esc(c.mol.name !== c.mol.category ? c.mol.name : pageTitleOf(c.mol.rep.template)) + '</span>'
        + (c.id === g.key ? '<i class="atx-badge atx-badge-orig">원래</i>' : '') + '</button>').join('') : '<p class="atx-none">이 분류에 맞는 분자가 없어요.</p>') + '</div>';
  }
  function candTitle(c) {
    if (c.mol) return c.mol.name + ' — ' + c.mol.category + ' · ' + (IDX.families[c.mol.family] || c.mol.family || '') + ' ' + pageTitleOf(c.mol.rep.template) + ' · 원본 ' + c.mol.instanceCount + '곳';
    if (c.part) return c.part.name + ' — 분자에서 옮긴 원자(' + (PART_WORD[c.part.part] || '') + ') · ' + (IDX.families[c.part.family] || c.part.family || '') + ' ' + pageTitleOf(c.part.rep.template) + ' · 원본 ' + c.part.instanceCount + '곳';
    const i = c.file;
    return base(i.src) + ' — ' + (i.context || '') + (i.w && i.h ? ' · ' + i.w + '×' + i.h : '') + ' · 원본 ' + i.uses + '곳' + (i.fileCount > 1 ? ' · 같은 모양 파일 ' + i.fileCount : '');
  }

  /* ── 바꾸기 ── */
  function atomTarget(id) {
    const part = IDX.parts.get(id);
    if (part) return { kind: 'part', atom: id, part: part.part, px: IDX.pxByTpl.get(part.rep.template), node: part.rep.node, nid: part.rep.nid, ids: part.rep.ids };
    const i = IDX.icons.get(id);
    if (!i) return null;
    const e = IDX.files.get(i.src) || {};
    return { kind: 'file', atom: id, src: i.src, lt: e.lt || null, paint: e.paint || null, color: ui.color };
  }
  function molTarget(id) {
    const m = IDX.mols.get(id);
    if (!m) return null;
    return { kind: 'mol', mol: id, px: IDX.pxByTpl.get(m.rep.template), node: m.rep.node, fields: m.fields.map((f, i) => ({ key: f.key, path: (m.rep.paths || [])[i] || null })).filter((f) => f.path) };
  }
  /* 기록 — 서버 없이 다시 입힐 때 이 화면에서 그 원자 · 분자를 찾는 정보(파일 · 노드 요소 · 글자 칸)를 같이 둔다 */
  function atomFrom(a) {
    if (a.places[0].type === 'part') {
      const seen = new Set(), places = [];
      a.places.forEach((p) => { const px = pxOf(p.root), k = px + ':' + p.nodeId; if (!seen.has(k)) { seen.add(k); places.push({ px, node: p.nodeId, nid: p.nid, ids: p.ids }); } });
      return { part: a.places[0].part, places };
    }
    if (a.key.startsWith('svg:')) return {};
    const files = {};
    a.places.forEach((p) => { if (p.file && !files[p.file]) { const e = p.ent || {}; files[p.file] = { paint: e.paint, lt: e.lt, ltPaint: e.ltPaint }; } });
    return { files };
  }
  function atomAt(p) {
    if (p.type === 'part') return { atom: p.atom.key, part: p.part, px: pxOf(p.root), node: p.nodeId, nid: p.nid, ids: p.ids };
    const e = p.ent || {};
    return { atom: p.atom.key, file: p.file || null, paint: e.paint, lt: e.lt, ltPaint: e.ltPaint };
  }
  const instAt = (i) => ({ m: i.m, px: pxOf(i.root), node: i.node, v: i.v, paths: i.paths, keys: i.keys });
  function chooseAtom(id) {
    const res = lastRes, S = res && selection(res);
    if (!S || !S.a) return;
    const a = S.a;
    const rec = pageRecMake(res.page.key);
    const pl = ui.scope === 'place' ? S.pl : null;
    const isOrig = id === a.key;
    const to = isOrig ? null : atomTarget(id);
    if (!isOrig && !to) return;
    if (pl) {
      if (isOrig) { if (rec.atoms[a.key]) rec.places[pl.key] = { kind: 'orig', at: atomAt(pl) }; else delete rec.places[pl.key]; }
      else rec.places[pl.key] = Object.assign(to, { at: atomAt(pl) });
    } else if (isOrig) delete rec.atoms[a.key];
    else rec.atoms[a.key] = Object.assign(to, { from: atomFrom(a) });
    commit();
  }
  function chooseMol(id) {
    const res = lastRes, S = res && selection(res);
    if (!S || !S.g) return;
    const g = S.g;
    const rec = pageRecMake(res.page.key);
    const inst = ui.molScope === 'place' && S.instPicked ? S.inst : null;
    const isOrig = id === g.key;
    const to = isOrig ? null : molTarget(id);
    if (!isOrig && !to) return;
    if (inst) {
      if (isOrig) { if (rec.mols[g.key]) rec.molPlaces[inst.key] = { kind: 'orig', at: instAt(inst) }; else delete rec.molPlaces[inst.key]; }
      else rec.molPlaces[inst.key] = Object.assign(to, { at: instAt(inst) });
    } else if (isOrig) delete rec.mols[g.key];
    else rec.mols[g.key] = Object.assign(to, { from: { keys: g.places[0].keys, places: g.places.map(instAt).map(({ keys, ...x }) => x) } });
    commit();
  }
  function undo() {
    const res = lastRes, S = res && selection(res);
    const rec = res && pageRec(res.page.key);
    if (!S || !rec) return;
    if (ui.level === 'mol' && S.g) {
      if (ui.molScope === 'place' && S.instPicked) delete rec.molPlaces[S.inst.key];
      else { delete rec.mols[S.g.key]; S.g.places.forEach((i) => { if (rec.molPlaces[i.key] && rec.molPlaces[i.key].kind === 'orig') delete rec.molPlaces[i.key]; }); }
    } else if (S.a) {
      if (ui.scope === 'place' && S.pl) delete rec.places[S.pl.key];
      else { delete rec.atoms[S.a.key]; S.a.places.forEach((p) => { if (rec.places[p.key] && rec.places[p.key].kind === 'orig') delete rec.places[p.key]; }); }
    }
    commit();
  }
  function setColor(color) {
    ui.color = color;
    const res = lastRes, S = res && selection(res);
    const rec = res && pageRec(res.page.key);
    if (S && S.a && rec) {
      const r = ui.scope === 'place' && S.pl ? rec.places[S.pl.key] : rec.atoms[S.a.key];
      if (r && r.kind === 'file') r.color = color;
    }
    commit();
  }
  async function resetPage() {
    const page = currentPage();
    const n = recCount(pageRec(page.key));
    if (!n) return;
    const ok = typeof askConfirm === 'function'
      ? await askConfirm({ title: '이 화면에서 바꾼 원자 · 분자를 모두 원래대로 할까요?', body: '바꾼 것 ' + n + '개가 원래대로 돌아가요.', confirmLabel: '원래대로' })
      : window.confirm('이 화면에서 바꾼 원자 · 분자를 모두 원래대로 할까요?');
    if (!ok) return;
    delete store.pages[page.key];
    commit();
    if (typeof toast === 'function') toast('이 화면에서 바꾼 것을 모두 원래대로 돌렸어요.', { type: 'ok' });
  }
  function commit() {
    writeStore();
    mapsCache = null;
    ui.sigList = '';
    run();
  }

  /* ── 창 조작 ── */
  function selectAtom(key, placeKey) {
    Object.assign(ui, { view: 'detail', level: 'atom', sel: key, place: placeKey || null, scope: placeKey ? 'place' : 'atom', mol: null, inst: null, molScope: 'all', cat: null, chipsOpen: false, q: '', fam: null, sigList: '' });
  }
  function selectMol(key, instKey) {
    Object.assign(ui, { view: 'detail', level: 'mol', sel: null, place: null, scope: 'atom', mol: key, inst: instKey || null, molScope: instKey ? 'place' : 'all', cat: null, chipsOpen: false, q: '', fam: null, sigList: '' });
  }
  function onBodyClick(e) {
    const t = (sel) => e.target.closest(sel);
    let b;
    if ((b = t('[data-list-level]'))) { ui.listLevel = b.dataset.listLevel; ui.listCat = ''; ui.chipsOpen = false; ui.sigList = ''; return refresh(); }
    if ((b = t('[data-chips]'))) { ui.chipsOpen = b.dataset.chips === 'open'; ui.sigList = ''; return refresh(); }
    if ((b = t('[data-list-cat]'))) { ui.listCat = b.dataset.listCat; ui.sigList = ''; return refresh(); }
    if ((b = t('.atx-tile'))) {
      if (b.dataset.level === 'mol') selectMol(b.dataset.key);
      else selectAtom(b.dataset.key);
      return refresh();
    }
    if (t('.atx-back')) { ui.view = 'list'; ui.sel = ui.place = ui.mol = ui.inst = null; ui.chipsOpen = false; ui.sigList = ''; highlight([]); return refresh(); }
    if ((b = t('[data-level]')) && !b.disabled) { ui.level = b.dataset.level; ui.cat = null; ui.chipsOpen = false; ui.q = ''; ui.fam = null; ui.sigList = ''; return refresh(); }
    if ((b = t('[data-scope]'))) { ui.scope = b.dataset.scope; ui.sigList = ''; return refresh(); }
    if ((b = t('[data-mol-scope]'))) { ui.molScope = b.dataset.molScope; ui.sigList = ''; return refresh(); }
    if ((b = t('[data-cat]'))) { ui.cat = b.dataset.cat; ui.sigList = ''; return refresh(); }
    if ((b = t('[data-color]'))) return setColor(b.dataset.color);
    if (t('.atx-undo')) return undo();
    if ((b = t('.atx-cand'))) return b.dataset.molId ? chooseMol(b.dataset.molId) : chooseAtom(b.dataset.id);
  }
  function onBodyChange(e) {
    if (e.target.classList.contains('atx-fam')) { ui.fam = e.target.value; ui.cat = null; ui.sigList = ''; refresh(); }
  }
  let qTimer = 0;
  function onBodyInput(e) {
    if (!e.target.classList.contains('atx-q')) return;
    clearTimeout(qTimer);
    qTimer = setTimeout(() => {
      ui.q = e.target.value;
      ui.sigList = '';
      refresh();
      const q = ui.body.querySelector('.atx-q');
      if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
    }, 180);
  }

  /* ── 화면 위 자리 표시 ── */
  let hlPlaces = [], hlSel = null;
  function placeRect(p) {
    const rep = (p.type === 'part' || p.type === 'mol' || (p.els[0] && p.els[0].hasAttribute('data-atm-hide'))) ? repOf(p) : null;
    if (rep) return rep.getBoundingClientRect();
    if (p.type === 'part') return paintBounds(p.els) || unionBox(p.els);
    const r = p.el.getBoundingClientRect();
    return r.width || r.height ? r : null;
  }
  function unionBox(els) {
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    els.forEach((e) => { const r = e.getBoundingClientRect(); if (!r.width && !r.height) return; x1 = Math.min(x1, r.left); y1 = Math.min(y1, r.top); x2 = Math.max(x2, r.right); y2 = Math.max(y2, r.bottom); });
    return x1 === Infinity ? null : { left: x1, top: y1, width: x2 - x1, height: y2 - y1 };
  }
  function highlight(places, sel) {
    hlPlaces = places || [];
    hlSel = sel || null;
    drawHighlight();
  }
  function drawHighlight() {
    if (!hl) return;
    const mr = main.getBoundingClientRect();
    hl.innerHTML = '';
    hlPlaces.slice(0, 400).forEach((p) => {
      const r = placeRect(p);
      if (!r || r.left + r.width < mr.left || r.left > mr.right || r.top + r.height < mr.top || r.top > mr.bottom) return;
      const d = document.createElement('div');
      d.className = 'atx-hlb' + (p === hlSel ? ' on' : '') + (p.type === 'mol' ? ' mol' : '');
      d.style.cssText = 'left:' + (r.left - 3) + 'px;top:' + (r.top - 3) + 'px;width:' + (r.width + 6) + 'px;height:' + (r.height + 6) + 'px';
      hl.appendChild(d);
    });
  }
  let rafHL = 0;
  const redrawSoon = () => { if (!hlPlaces.length || rafHL) return; rafHL = requestAnimationFrame(() => { rafHL = 0; drawHighlight(); }); };
  window.addEventListener('resize', redrawSoon);
  window.addEventListener('scroll', redrawSoon, true);

  /* ── 화면에서 고르기 — 누른 곳의 원자(분자에서 옮긴 원자가 있으면 그것), 원자가 없으면 그곳의 분자 ── */
  /* 그 요소가 눈에 보이게 칠해지나 — 그림 · 배경 · 테두리 · 글자. 얹은 판(바꾼 것)도 칠해진 것으로 본다 */
  function paints(el) {
    if (el.closest('.atm-rep') || el.tagName === 'IMG' || el.closest('svg')) return true;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || +cs.opacity === 0) return false;
    if ((cs.backgroundImage && cs.backgroundImage !== 'none') || !/rgba\([^)]*,\s*0\)$|transparent/.test(cs.backgroundColor)) return true;
    if (['Top', 'Right', 'Bottom', 'Left'].some((k) => parseFloat(cs['border' + k + 'Width']) > 0 && cs['border' + k + 'Style'] !== 'none')) return true;
    for (const n of el.childNodes) if (n.nodeType === 3 && n.data.trim()) return true;
    return false;
  }
  /* 누른 곳에서 눈에 보이는 맨 위 요소 — 투명한 상자(다른 분자의 빈 칸)가 아이콘 위를 덮고 있는 경우가 있어 건너뛴다.
     그 요소가 원자 안이면 원자(분자에서 옮긴 원자가 있으면 그것), 원자가 아니면 그곳의 분자 */
  function pickAt(x, y) {
    const res = lastRes;
    if (!res) return null;
    for (const el of document.elementsFromPoint(x, y)) {
      if (el.closest('.atx, .atx-hl')) return null;
      if (!main.contains(el) || !paints(el)) continue;
      let atom = null, part = null, inst = null;
      for (let n = el; n && n !== main; n = n.parentElement) {
        const p = res.byEl.get(n);
        if (p && rendered(p)) { if (!atom) atom = p; if (!part && p.type === 'part') part = p; }
        if (!inst) inst = res.molByEl.get(n) || null;
      }
      if (part || atom) return { place: part || atom };
      if (inst) return { inst };
    }
    return null;
  }
  function setPicking(on) {
    ui.picking = !!on && !!IDX;
    main.classList.toggle('atx-picking', ui.picking);
    if (ui.el) ui.el.querySelector('.atx-pick').setAttribute('aria-pressed', ui.picking ? 'true' : 'false');
    if (!ui.picking && ui.view === 'list') highlight([]);
  }
  const inMain = (e) => ui.picking && e.target instanceof Element && main.contains(e.target) && !e.target.closest('.atx');
  window.addEventListener('pointermove', (e) => {
    if (!inMain(e)) return;
    const hit = pickAt(e.clientX, e.clientY);
    const p = hit && (hit.place || hit.inst);
    highlight(p ? [p] : [], p);
  }, true);
  ['pointerdown', 'mousedown', 'mouseup', 'dblclick', 'contextmenu'].forEach((t) => window.addEventListener(t, (e) => {
    if (!inMain(e)) return;
    e.preventDefault();
    e.stopPropagation();
  }, true));
  window.addEventListener('click', (e) => {
    if (!inMain(e)) return;
    e.preventDefault();
    e.stopPropagation();
    const hit = pickAt(e.clientX, e.clientY);
    if (!hit) return;
    if (hit.place) {
      selectAtom(hit.place.atom.key, hit.place.key);
      const inst = molOfPlace(lastRes, hit.place);
      if (inst) { ui.inst = inst.key; ui.mol = inst.m; ui.molScope = 'place'; }
    } else selectMol(hit.inst.m, hit.inst.key);
    setPicking(false);
    refresh();
  }, true);
  /* Esc — 화면에서 고르는 중이면 고르기만 끝내고, 창 안에 있으면 창을 닫는다 */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !ui.open) return;
    if (ui.picking) { setPicking(false); e.stopPropagation(); return; }
    if (ui.el.contains(document.activeElement)) { close(); e.stopPropagation(); }
  });

  /* ── 내보내기 · 썸네일(html2canvas) ──
     html2canvas 는 CSS content · mask 와 섀도 DOM 의 시트를 그리지 못해 바꾼 것이 원래대로 찍힌다.
     복제한 문서(onclone)에서만 바꾼 것을 실제 그림 · 인라인 스타일로 굳힌다 — 화면은 건드리지 않는다. */
  const svgTexts = new Map();
  const svgText = (url) => {
    if (!svgTexts.has(url)) svgTexts.set(url, fetch(url).then((r) => (r.ok ? r.text() : null)).catch(() => null));
    return svgTexts.get(url);
  };
  const urlIn = (v) => { const m = /url\(\s*["']?([^"')]+)["']?\s*\)/.exec(v || ''); return m ? m[1] : null; };
  function recolor(text, color) {
    const keep = (v) => /^(none|transparent)$/i.test(v.trim()) || /^url\(/i.test(v.trim());
    return text
      .replace(/(\s(?:fill|stroke|stop-color)=")([^"]+)(")/g, (m, a, v, b) => (keep(v) ? m : a + color + b))
      .replace(/((?:fill|stroke|stop-color)\s*:\s*)([^;"']+)/g, (m, a, v) => (keep(v) ? m : a + color))
      .replace(/<svg\b(?![^>]*\sfill=)/, '<svg fill="' + color + '"');
  }
  async function bakeClone(doc) {
    const win = doc.defaultView || window;
    /* 다른 화면에서 가져온 것(섀도 DOM)은 복제본에서 섀도 시트가 빠진 채 펼쳐진다 —
       지금 화면에 그려진 계산 스타일을 복제본 요소에 그대로 옮겨 적는다 */
    doc.querySelectorAll('.atm-rep[data-atm-for]').forEach((cr) => {
      const live = main.querySelector('.atm-rep[data-atm-for="' + cssEsc(cr.getAttribute('data-atm-for')) + '"]');
      const frame = live && live.__atmFrame;
      const cf = cr.firstElementChild && cr.firstElementChild.firstElementChild;
      if (!frame || !cf) return;
      const walk = (a, b) => {
        const cs = getComputedStyle(a);
        let t = '';
        for (let i = 0; i < cs.length; i++) t += cs[i] + ':' + cs.getPropertyValue(cs[i]) + ';';
        b.setAttribute('style', t);
        for (let i = 0; i < a.children.length && i < b.children.length; i++) walk(a.children[i], b.children[i]);
      };
      walk(frame, cf);
    });
    await Promise.all([...doc.querySelectorAll('img[data-atm], svg[data-atm]')].map(async (el) => {
      const light = !!el.closest('[data-theme="light"]');
      const st = el.style;
      const pick = (dark, lt) => (light && st.getPropertyValue(lt).trim()) || st.getPropertyValue(dark).trim();
      let src = null;
      if (el.getAttribute('data-atm') === 'file') src = urlIn(pick('--atm-src', '--atm-src-lt'));
      else {
        const shape = urlIn(st.getPropertyValue('--atm-m'));
        const color = pick('--atm-c', '--atm-c-lt') || win.getComputedStyle(el).color; /* 스튜디오 선 아이콘 — 글자색 */
        const text = shape && (await svgText(shape));
        if (text) src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(recolor(text, color));
      }
      if (!src) return;
      if (el.tagName === 'IMG') {
        el.removeAttribute('data-atm');
        el.setAttribute('src', src);
        el.style.objectFit = 'contain';
        return;
      }
      const cs = win.getComputedStyle(el);
      const im = doc.createElement('img');
      im.alt = '';
      im.setAttribute('src', src);
      im.style.cssText = 'width:' + cs.width + ';height:' + cs.height + ';object-fit:contain;flex:none;vertical-align:' + cs.verticalAlign + ';margin:' + cs.margin + ';display:' + (cs.display === 'inline' ? 'inline-block' : cs.display);
      el.replaceWith(im);
    }));
  }

  /* 스튜디오가 아닌 페이지(PRD · 기능명세서 …)로 가면 닫는다 */
  try { if (window.WEMB && WEMB.router && WEMB.router.onChange) WEMB.router.onChange((next) => { if (next && next.name !== 'page:wire') close(); }); } catch (e) {}

  window.__atomSwap = { open, close, toggle, apply: run, bakeClone };
  /* 처음 — 바꾼 것이 있으면 화면이 그려지는 대로 입힌다(이미 그려져 있으면 지금) */
  if (Object.keys(store.pages).length) run();
})();
