/* ── 화면 만들기 — 그리드 · 와이어프레임 ── */

/* ===== 화면 만들기 — 종류 → 그리드 → 와이어프레임 선택, 미리보기 반영 =====
   Figma 'Studio' 파일의 그리드 섹션(2단/3단/모듈)에 있는 실제 와이어프레임을
   그대로 가져왔다. 각 와이어프레임은 1920×1080 위의 패널 사각형 좌표 묶음이고,
   고르면 오른쪽 미리보기에 그 좌표대로 패널을 배치한 뒤 박스 크기에 맞는 대표
   콘텐츠(차트·표·KPI·리스트)를 채워 테마 색을 미리 본다.
   레이아웃은 대시보드·디지털 트윈이 공유하고(디지털 트윈은 유리 카드 스타일),
   종류별로 고른 그리드/와이어프레임은 각각 localStorage에 저장/복원한다. */
(function initScreenBuilder() {
  const gridPick = document.getElementById('gridPick');
  const gridSeg = document.getElementById('gridSeg');
  const wirePick = document.getElementById('wirePick');
  const wireGal = document.getElementById('wireGal');
  const wfCanvas = document.getElementById('wfCanvas');
  const wfCanvasDt = document.getElementById('wfCanvasDt');
  const dtUi = document.querySelector('#dtStage .dt-ui');
  if (!gridSeg || !wireGal) return;

  const mk = (tag, cls) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ── 실제 Figma 와이어프레임 (2단/3단/모듈 공유) ──
     각 항목: { n:'이름', p:[[x,y,w,h]...] } — 1920×1080 좌표의 패널 사각형들. */
  const WF = {
    g2: [
      { n: '1-2', p: [[44,96,900,456],[976,96,615,456],[1617,96,259,456],[44,582,900,456],[976,582,900,456]] },
      { n: '2-2', p: [[23,96,925,279],[23,400,925,153],[23,580,925,278],[23,883,925,154],[972,96,923,214],[972,338,923,215],[972,581,923,215],[972,824,923,214]] },
      { n: '13-2', p: [[40,192,917,185],[964,192,917,185],[40,391,917,185],[964,391,917,185],[40,589,917,186],[964,589,917,186],[40,789,1841,291]] },
    ],
    g3: [
      { n: '7-1', p: [[38,107,469,308],[38,425,470,149],[38,584,470,410],[521,107,879,183],[521,301,879,235],[521,547,879,447],[1411,107,470,223],[1411,341,470,195],[1411,549,470,264],[1411,824,470,170],[38,1006,1843,74]] },
      { n: '7-2', p: [[38,107,469,308],[38,425,470,149],[38,584,470,410],[521,107,879,183],[521,301,879,235],[521,547,879,447],[1411,107,470,223],[1411,341,470,195],[1411,549,470,264],[1411,826,470,54],[1411,894,470,100],[38,1006,1843,74]] },
      { n: '7-3', p: [[38,185,469,625],[38,824,470,170],[521,185,879,535],[521,732,879,125],[521,869,879,125],[1411,188,470,160],[1411,359,470,140],[1411,510,470,140],[1411,661,470,95],[1411,768,470,226],[38,1006,1843,74]] },
      { n: '20', p: [[40,106,600,117],[40,237,600,117],[660,106,600,117],[660,237,600,117],[1281,106,600,117],[1281,237,600,117],[40,395,600,353],[660,395,600,353],[1280,395,600,353],[40,789,600,234],[660,789,600,234]] },
      { n: '21', p: [[54,111,379,462],[494,111,938,462],[1493,111,379,462],[31,664,601,374],[660,664,601,374],[1289,664,601,374]] },
      { n: '22', p: [[81,110,501,76],[81,245,501,186],[81,459,501,428],[720,179,489,188],[649,395,631,437],[1347,110,501,76],[1347,231,501,299],[1347,558,501,449],[38,1040,1844,40]] },
      { n: '23', p: [[40,106,600,255],[40,442,600,589],[665,106,598,255],[665,442,598,255],[1288,106,592,255],[1288,442,592,255],[665,778,598,255],[1288,777,592,255]] },
      { n: '28', p: [[40,106,285,188],[40,307,285,189],[40,509,285,188],[355,106,285,188],[355,307,285,189],[355,509,285,188],[40,778,600,253],[665,106,592,591],[1288,106,592,591],[665,778,598,255],[1288,777,592,255]] },
      { n: '13-2 · b', p: [[121,454,548,541],[687,698,548,297],[1252,698,548,297]] },
    ],
    mod: [
      { n: '74', p: [[40,106,390,342],[451,106,499,342],[971,106,499,342],[1491,106,390,342],[40,469,1841,391],[40,881,1841,143]] },
      { n: '75', p: [[40,106,1841,143],[40,264,1841,391],[40,682,446,342],[505,682,446,342],[970,682,446,342],[1435,682,446,342]] },
      { n: '76', p: [[40,139,546,229],[605,139,417,229],[1032,139,417,229],[1459,139,417,229],[40,380,631,274],[684,380,1192,274],[40,665,451,162],[502,665,451,162],[964,665,451,162],[1426,665,452,162],[40,838,1840,242]] },
      { n: '77', p: [[23,116,458,218],[23,356,458,218],[23,596,458,218],[23,836,458,218],[511,159,814,343],[511,529,390,132],[935,529,390,132],[511,682,390,132],[935,682,390,132],[511,879,515,176],[1053,879,272,176],[1347,192,546,440],[1347,670,546,120],[1347,815,546,240]] },
      { n: '24', p: [[41,260,1340,135],[1430,215,449,180],[41,448,1838,164],[41,644,586,225],[667,644,586,225],[1293,644,586,225],[41,901,430,138],[510,901,430,138],[979,901,430,138],[1449,901,430,138]] },
      { n: '25', p: [[52,81,788,98],[1080,81,788,98],[52,201,337,325],[503,201,337,325],[1080,201,190,325],[1306,205,562,321],[40,568,1840,79],[40,655,914,184],[963,655,917,184],[40,848,450,184],[501,848,453,184],[966,848,453,184],[1427,848,453,184]] },
      { n: '26', p: [[40,106,482,96],[40,213,482,96],[40,320,482,96],[40,427,482,96],[40,536,485,211],[541,536,478,211],[1049,536,385,211],[1451,115,429,272],[40,757,907,275],[977,836,903,196],[1451,436,429,150],[1451,636,429,150]] },
      { n: '13-M', p: [[20,160,490,446],[520,160,314,213],[844,160,314,213],[520,383,314,222],[844,383,314,222],[1170,160,730,446],[20,616,318,218],[20,844,318,218],[348,616,318,446],[672,617,331,218],[672,845,331,218],[1013,617,563,218],[1013,845,563,218],[1582,616,318,446]] },
      { n: '47', p: [[24,103,1873,209],[24,329,739,381],[783,329,565,381],[1368,329,528,381],[24,727,460,286],[495,727,460,286],[966,727,460,286],[1437,727,460,286],[24,1031,1872,49]] },
      { n: '44', p: [[24,103,1104,648],[1147,103,422,648],[1588,103,309,648],[24,772,1873,275]] },
      { n: '46', p: [[24,103,1548,300],[24,427,1548,300],[24,751,1548,300],[1588,103,309,949]] },
      { n: '13-M · b', p: [[24,103,1873,209],[24,329,593,336],[636,329,781,336],[24,689,1393,362],[1438,331,459,275],[1438,629,459,242],[1438,894,459,159]] },
    ],
  };

  /* ── 콘텐츠 종류 결정 (박스 크기·비율 기반) ── */
  function kindFor(w, h, i) {
    const ar = w / h, area = w * h;
    if (h <= 90) return 'strip';
    if (ar >= 2.4 && h <= 200) return 'kpi';
    if (ar <= 0.9 && h >= 280) return 'list';
    const big = area >= 200000; /* 큰 박스엔 차트/도넛/히트 등 시각물 우선 */
    if (big) {
      if (ar >= 0.78 && ar <= 1.5) return i % 2 ? 'donut' : 'line';
      return ['line', 'bars', 'heat', 'table'][i % 4];
    }
    if (h >= 170) return ['table', 'line', 'list', 'bars'][i % 4];
    return ['table', 'list'][i % 2];
  }

  /* ── 대표 콘텐츠 HTML ── */
  const BARH = [55, 82, 40, 68, 92, 48, 74, 60, 86, 52];
  function content(kind, w, h) {
    if (kind === 'strip') {
      return '<div class="wfstrip"><i style="width:20%"></i><i style="width:10%"></i><i style="width:13%"></i><i style="flex:1"></i><i style="width:9%"></i></div>';
    }
    if (kind === 'kpi') {
      const cols = clamp(Math.round(w / 230), 2, 7);
      let s = '<div class="wfkpis" style="grid-template-columns:repeat(' + cols + ',1fr)">';
      for (let k = 0; k < cols; k++) s += '<div class="wfkpi"><div class="n"></div><div class="l"></div></div>';
      return s + '</div>';
    }
    if (kind === 'bars') {
      const cols = clamp(Math.round(w / 55), 4, 11);
      let s = '<div class="wfbars">';
      for (let k = 0; k < cols; k++) s += '<i style="height:' + BARH[k % BARH.length] + '%"></i>';
      return s + '</div>';
    }
    if (kind === 'line') {
      return '<div class="wfline"><svg viewBox="0 0 100 90" preserveAspectRatio="none"><polyline points="0,74 15,54 30,62 45,34 60,46 75,22 90,36 100,28" fill="none" stroke="var(--point-main)" stroke-width="2.4" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/></svg></div>';
    }
    if (kind === 'donut') {
      return '<div class="wfdonut"><svg viewBox="0 0 42 42"><circle cx="21" cy="21" r="15.9" fill="none" stroke="color-mix(in srgb,var(--text-weak) 20%, transparent)" stroke-width="6" pathLength="100"/><circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--point-main)" stroke-width="6" pathLength="100" stroke-dasharray="64 36" stroke-dashoffset="25" stroke-linecap="round"/></svg></div>';
    }
    if (kind === 'list') {
      const rows = clamp(Math.round(h / 42), 3, 7);
      const ww = [64, 52, 74, 46, 68, 58, 50];
      let s = '<div class="wflist">';
      for (let k = 0; k < rows; k++) s += '<div class="wfrow"><span class="b"></span><i style="width:' + ww[k % ww.length] + '%"></i><span class="v"></span></div>';
      return s + '</div>';
    }
    /* table */
    const rows = clamp(Math.round(h / 34), 2, 7);
    let s = '<div class="wftable"><div class="wftr h"><i style="width:34%"></i><i style="width:22%"></i><i style="width:18%"></i><i style="width:14%"></i></div>';
    const ww = [40, 26, 20, 16];
    for (let k = 0; k < rows - 1; k++) {
      s += '<div class="wftr">';
      for (let c = 0; c < 4; c++) s += '<i style="width:' + (ww[c] - (k % 2) * 4) + '%"></i>';
      s += '</div>';
    }
    return s + '</div>';
  }
  const head = () => '<div class="wfhead"><span class="dot"></span><span class="t"></span></div>';
  /* PRD 제목이 들어간 헤더 — 실제 글자를 보여준다 */
  const escHtml = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const titledHead = (t) => '<div class="wfhead"><span class="dot"></span><span class="t tx">' + escHtml(t) + '</span></div>';

  /* ── 실제 대시보드 콘텐츠 풀 ──
     오버뷰 페이지의 진짜 패널(.ph+.pbody)·KPI를 종류별로 모아 와이어프레임 박스에
     복제해 넣는다. 차트 색이 전부 CSS 변수라 복제본도 테마가 바뀌면 같이 리컬러된다. */
  function buildPool() {
    const P = { chart: [], table: [], list: [], donut: [], heat: [], bars: [], kpi: null };
    const dp = document.querySelector('.stage .dashpage[data-page="overview"]');
    if (!dp) return P;
    P.kpi = dp.querySelector('.kpis');
    dp.querySelectorAll('.cols .panel').forEach((p) => {
      let t = 'table';
      if (p.querySelector('.donut-wrap')) t = 'donut';
      else if (p.querySelector('.heat')) t = 'heat';
      else if (p.querySelector('.chart')) t = 'chart';
      else if (p.querySelector('.loglist') || p.querySelector('.plist')) t = 'list';
      else if (p.querySelector('.mini-row')) t = 'bars';
      else if (p.querySelector('table')) t = 'table';
      P[t].push(p);
    });
    return P;
  }
  let POOL = buildPool();
  const ORDER = {
    strip: ['kpi'], kpi: ['kpi'],
    line: ['chart', 'bars', 'table'], bars: ['bars', 'chart', 'table'],
    donut: ['donut', 'chart', 'table'], heat: ['heat', 'chart', 'table'],
    list: ['list', 'table'], table: ['table', 'list', 'chart'],
  };
  const cursor = {};
  function cleanClone(node) {
    const c = node.cloneNode(true);
    c.removeAttribute('draggable');
    c.querySelectorAll('[id]').forEach((e) => e.removeAttribute('id'));
    c.querySelectorAll('[data-eid],[data-pid],[contenteditable]').forEach((e) => { e.removeAttribute('data-eid'); e.removeAttribute('data-pid'); e.removeAttribute('contenteditable'); });
    /* 그려지며 나타나는 획(dashoffset) 애니는 복제본에선 최종 상태로 고정해 바로 보이게 */
    c.querySelectorAll('svg [style]').forEach((e) => { if (e.style.strokeDashoffset || e.style.strokeDasharray) { e.style.strokeDashoffset = '0'; e.style.strokeDasharray = ''; } });
    return c;
  }
  function kpiBox(cols) {
    if (!POOL.kpi) return null;
    const src = [...POOL.kpi.querySelectorAll('.kpi')];
    if (!src.length) return null;
    const box = mk('div', 'kpis');
    box.style.gridTemplateColumns = 'repeat(' + cols + ',1fr)';
    for (let k = 0; k < cols; k++) box.appendChild(cleanClone(src[k % src.length]));
    return box;
  }
  function realFor(kind, w) {
    if (kind === 'strip' || kind === 'kpi') {
      const box = kpiBox(clamp(Math.round(w / 230), 2, 7));
      return box ? { kpi: true, el: box } : null;
    }
    const order = ORDER[kind] || ['table', 'chart', 'list'];
    for (const b of order) {
      if (b === 'kpi') { const box = kpiBox(clamp(Math.round(w / 230), 2, 6)); if (box) return { kpi: true, el: box }; continue; }
      const arr = POOL[b];
      if (arr && arr.length) { const n = (cursor[b] = (cursor[b] || 0) + 1); return { el: cleanClone(arr[(n - 1) % arr.length]) }; }
    }
    for (const b of ['table', 'chart', 'list', 'donut', 'bars', 'heat']) {
      const arr = POOL[b];
      if (arr && arr.length) { const n = (cursor[b] = (cursor[b] || 0) + 1); return { el: cleanClone(arr[(n - 1) % arr.length]) }; }
    }
    return null;
  }

  /* ── 좌표 정규화 (패널 묶음의 bbox를 캔버스 [1.5,98.5]% 로 매핑) ── */
  function norm(panels) {
    let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    panels.forEach((q) => { minX = Math.min(minX, q[0]); minY = Math.min(minY, q[1]); maxX = Math.max(maxX, q[0] + q[2]); maxY = Math.max(maxY, q[1] + q[3]); });
    const W = maxX - minX || 1, H = maxY - minY || 1, pad = 1.5, span = 100 - pad * 2;
    return panels.map((q) => ({ l: pad + (q[0] - minX) / W * span, t: pad + (q[1] - minY) / H * span, w: q[2] / W * span, h: q[3] / H * span, pw: q[2], ph: q[3] }));
  }

  /* ── 미리보기 렌더 ── 원본(1920 기준) bbox 크기의 보드에 네이티브 px로 그린 뒤
       fitBoard가 view 크기에 맞게 통째로 scale (콘텐츠 밀도=실제 대시보드와 동일). */
  function renderInto(cv, wf) {
    if (!cv) return;
    POOL = buildPool(); /* 최신 차트 렌더 상태 반영 */
    Object.keys(cursor).forEach((k) => (cursor[k] = 0)); /* 순환 초기화 → 같은 와이어프레임은 항상 같은 배치 */
    cv.innerHTML = '';
    const P = wf.p;
    let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    P.forEach((q) => { minX = Math.min(minX, q[0]); minY = Math.min(minY, q[1]); maxX = Math.max(maxX, q[0] + q[2]); maxY = Math.max(maxY, q[1] + q[3]); });
    const bw = maxX - minX || 1, bh = maxY - minY || 1;
    const board = mk('div', 'wfboard');
    board.style.width = bw + 'px';
    board.style.height = bh + 'px';
    P.forEach((q, i) => {
      const el = mk('div', 'wfpanel');
      el.style.left = q[0] - minX + 'px';
      el.style.top = q[1] - minY + 'px';
      el.style.width = q[2] + 'px';
      el.style.height = q[3] + 'px';
      el.style.animationDelay = (i * 0.025).toFixed(3) + 's';
      const kind = kindFor(q[2], q[3], i);
      /* PRD 답변 기반 제목 — 실제(리치) 콘텐츠는 그대로 쓰고 제목만 모니터링 대상으로 바꾼다 */
      const title = (wf.titles && wf.titles.length) ? wf.titles[i % wf.titles.length] : null;
      el.appendChild(buildFit(el, kind, q[2], q[3], title, i));
      board.appendChild(el);
    });
    cv.appendChild(board);
    cv.hidden = false;
    cv.__board = { el: board, bw, bh };
    fitContents(board);
    fitBoard(cv);
    startWfLive(board);
  }
  /* ══════════════════ PRD 내용 입히기 (와이어프레임 보드 공용) ══════════════════
     복제해 온 건 오버뷰 데모 패널이라 글자가 전부 은행 데모(거래건수·CPU Top 5·국민은행 …)다.
     그대로 두면 어떤 PRD로 만들어도 모든 판이 같은 내용이라, 여기서 **판의 글자를 PRD 대상의
     어휘로 갈아끼운다** — 제목뿐 아니라 KPI 라벨·표 머리글·자산 이름·진행률 항목·범례·이벤트
     문구까지. 값은 그 계측의 실제 범위에서 뽑고, 라이브 틱이 그 폭 안에서 계속 걸어 다닌다.

     숫자가 든 자리에는 표시를 남긴다 — 걸어 다닐 폭은 감싸는 칸(data-wf-live="lo|hi|dec|%")에,
     실제로 고쳐 쓸 곳은 그 안의 .wf-n(글자) · .wf-bar(막대 폭) · .wf-gauge(--v)에 붙인다.
     (한 줄의 숫자와 막대가 따로 놀지 않게 '줄' 단위로 한 값을 쓴다) */
  const wfComma = (v, dec) => {
    const s = Number(v).toFixed(dec || 0).split('.');
    return s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (s[1] ? '.' + s[1] : '');
  };
  const wfPick = (arr, k) => arr[((k % arr.length) + arr.length) % arr.length];
  /* 한 '줄'을 살아 있는 값으로 만든다 — v 는 지금 값, lo~hi 는 앞으로 걸어 다닐 폭 */
  function wfLive(host, m, v, opt) {
    opt = opt || {};
    host.dataset.wfLive = [m.lo, m.hi, m.dec, m.unit === '%' ? '%' : ''].join('|');
    host.dataset.wfV = v;
    if (opt.suffix) host.dataset.wfSuf = opt.suffix;
  }
  /* 값 → 막대 길이(%). 단위가 %면 값 그대로, 아니면 폭 안에서의 위치로 환산한다 */
  const wfPct = (v, lo, hi, isPct) => {
    const p = isPct ? Number(v) : ((v - lo) / ((hi - lo) || 1)) * 100;
    return Math.max(4, Math.min(100, p));
  };
  const wfHm = (back) => {
    const d = new Date(Date.now() - back * 1000);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  };
  /* 칸의 글자를 갈아끼운다 — 직접 붙은 글자 노드가 있으면 그걸, 없으면 안쪽 <b>/<span> 을.
     (Total 줄처럼 값이 <b> 안에만 든 칸이 있다 — 없다고 새로 붙이면 글자가 두 벌이 된다.)
     배지(.tag)·색 점(i)·쌍의 뒷값(.v2)·구분자(.sl)는 건드리지 않는다.
     돌려주는 값: 'self' = 칸에 직접 썼다 / 요소 = 그 안쪽에 썼다. */
  const WF_INNER = 'b, span:not(.tag):not(.v2):not(.sl)';
  function wfWrite(el, text) {
    let hit = null;
    el.childNodes.forEach((n) => { if (n.nodeType === 3 && n.textContent.trim()) hit = n; });
    if (hit) { hit.textContent = text; return 'self'; }
    const inner = el.querySelector(WF_INNER);
    if (inner && !inner.children.length) { inner.textContent = text; return inner; }
    el.insertBefore(document.createTextNode(text), el.firstChild);
    return 'self';
  }
  /* 이름 칸 — 앞에 붙은 배지·색 점 뒤에 한 칸 띄우고 이름만 갈아끼운다 */
  function wfSetTail(el, text) {
    const pre = el.querySelector('.tag, i') ? ' ' : '';
    let hit = null;
    el.childNodes.forEach((n) => { if (n.nodeType === 3 && n.textContent.trim()) hit = n; });
    if (hit) { hit.textContent = pre + text; return; }
    const inner = el.querySelector(WF_INNER);
    if (inner && !inner.children.length) { inner.textContent = text; return; }
    el.appendChild(document.createTextNode(pre + text));
  }
  const WF_LVC = { crit: 'b-crit', warn: 'b-warn', info: '' };
  const WF_LVN = { crit: 'Critical', warn: 'Warning', info: 'Info' };
  function wfFillLogRow(row, ev, back) {
    const badge = row.querySelector('.badge');
    const t = row.querySelector('.t');
    const mid = [...row.children].find((c) => !c.classList.contains('badge') && !c.classList.contains('t'));
    if (badge) {
      badge.className = 'badge ' + (WF_LVC[ev.lv] || '');
      badge.removeAttribute('style');
      badge.textContent = WF_LVN[ev.lv] || 'Info';
    }
    if (mid) mid.textContent = (ev.of ? '[' + ev.of + '] ' : '') + ev.msg;
    if (t) t.textContent = wfHm(back);
  }

  /* 대시보드 미리보기(.cols > .panel)에도 같은 치환을 적용하기 위한 통로.
     예전에는 이 엔진의 소비자가 buildFit(와이어프레임 보드)와 renderDtGrid(디지털 트윈)뿐이라,
     PRD 를 6단계 채우고 도착한 '대시보드' 경로만 하드코딩된 은행 데모로 남아 있었다 —
     PRD 인트로가 '고른 구성이 스튜디오에 그대로 반영됩니다'라고 약속한 바로 그 화면이다. */
  window.__applyPrdToPanels = function (root) {
    if (typeof window.__prdPanelSpec !== 'function') return 0;
    const stage = (root && root.closest ? root.closest('.stage') : null) || document.querySelector('.main .stage');
    let n = 0;
    /* 상단 KPI 줄(.kpis)은 .cols 밖에 있다 — 여기를 빼면 '거래건수 · 대외계 · C/C' 가 그대로 남는다.
       applyPrdContent 는 컨테이너 안의 .kpi 를 한꺼번에 처리하므로 줄 단위로 한 번만 부른다. */
    const kpis = stage && stage.querySelector('.kpis');
    if (kpis) {
      let spec = null;
      try { spec = window.__prdPanelSpec(0); } catch (e) { spec = null; }   /* 0 = '종합 현황' = 여러 대상 묶음 */
      if (spec) { try { applyPrdContent(kpis, spec); n++; } catch (e) {} }
    }
    /* 패널은 보이는 것만 — 다른 화면 템플릿의 숨은 패널까지 건드리면 인덱스가 어긋난다 */
    const host = (root && root.querySelectorAll ? root : null) || (stage && stage.querySelector('.cols'));
    if (!host) return n;
    const panels = [...host.querySelectorAll('.panel, .kpibox')].filter((el) => el.style.display !== 'none');
    panels.forEach((el, i) => {
      let spec = null;
      try { spec = window.__prdPanelSpec(i + 1); } catch (e) { spec = null; }   /* 0 은 KPI 줄이 썼다 */
      if (!spec) return;
      try { applyPrdContent(el, spec); n++; } catch (e) {}
    });
    /* 라이브 틱은 로드 시점의 숫자를 기준으로 삼는다 — 내용을 갈아끼웠으니 기준값도 다시 읽게 한다.
       이걸 빼면 라벨은 '발전량·발전기'인데 값은 옛 은행 숫자(5,500만)로 되돌아온다. */
    /* 순시값 지표임을 라이브 틱에 알린다(누적 금지) */
    try { const st = document.querySelector('.stage'); if (st) st.dataset.prdKpi = '1'; } catch (e) {}
    try { if (window.__reseedLiveKPI) window.__reseedLiveKPI(); } catch (e) {}
    return n;
  };

  function applyPrdContent(fit, spec) {
    if (!fit || !spec) return;
    const rnd = spec.rnd || Math.random;
    const M = spec.metrics.length ? spec.metrics : [{ label: '값', unit: '', lo: 0, hi: 100, dec: 0 }];
    const val = (m) => m.lo + rnd() * (m.hi - m.lo);
    const COUNT = { label: '건수', unit: '건', lo: 0, hi: 9, dec: 0 };   /* 상태·경보 칸 */

    /* ── 머리(제목·탭·힌트·범례) ── */
    const h3 = fit.querySelector('.ph h3');
    if (h3) h3.textContent = spec.title;
    fit.querySelectorAll('.ph .tabs b').forEach((b, k) => { b.textContent = wfPick(['금일', '주간', '월간', '누적'], k); });
    const hint = fit.querySelector('.ph .hint');
    if (hint) hint.innerHTML = '현재 / <b>임계</b>';
    fit.querySelectorAll('.clegend span').forEach((s, k) => { s.textContent = k ? '현재' : '기준'; });
    /* 'CPU Top 5'·'Memory Top 5' 같은 머리말 — 아래 목록이 재는 계측 이름으로 바꾼다 */
    fit.querySelectorAll('.sec-lab').forEach((el, li) => { el.textContent = wfPick(M, li).label + ' 상위 5'; });

    /* ── KPI 칸 ── */
    fit.querySelectorAll('.kpi').forEach((kpi, k) => {
      const m = wfPick(M, k);
      const lab = kpi.querySelector('.lab');
      const v = kpi.querySelector('.val');
      const sub = kpi.querySelector('.sub');
      /* 여러 대상을 모은 판(종합·KPI·리포트)에서만 대상 이름이 라벨 — 한 대상만 보는 판은 계측 이름이 라벨이다 */
      const named = spec.roundup && m.of && m.of !== m.label;
      if (lab) lab.textContent = named ? m.of : m.label;
      const x = val(m);
      if (v) { v.classList.add('wf-n'); v.textContent = wfComma(x, m.dec); }
      if (sub) sub.innerHTML = (named ? m.label : '기준') + ' <b>| ' + wfComma(m.hi, m.dec) + (m.unit ? ' ' + m.unit : '') + '</b>';
      wfLive(kpi, m, x);
    });

    /* ── 표 — 머리글·구분 밴드·첫 칸(대상)·숫자 칸 ── */
    fit.querySelectorAll('table').forEach((tb) => {
      const HEAD = ['대상', '현재', '임계', '상태', '경보', '점검'];
      tb.querySelectorAll('thead th').forEach((th, k) => { if (th.textContent.trim()) th.textContent = wfPick(HEAD, k); });
      tb.querySelectorAll('tr.bandh td').forEach((td, k) => { if (td.textContent.trim()) td.textContent = wfPick(['금일', '기준', '전일'], k - 1); });
      const rows = [...tb.querySelectorAll('tr')].filter((r) => !r.classList.contains('bandh') && !r.classList.contains('bandgap') && r.querySelector('td'));
      rows.forEach((tr, r) => {
        const first = tr.querySelector('td');
        if (first && !first.classList.contains('num') && !first.classList.contains('pair')) {
          const tag = first.querySelector('.tag');
          if (tag) tag.textContent = spec.tag;
          wfSetTail(first, tag ? wfPick(spec.assets, r) : wfPick(M, r).label);
        }
        /* 한 줄은 한 대상(=한 계측)이다. 칸마다 다른 계측을 넣으면 kW 옆에 % 가 서는 표가 된다.
           · 쌍(현재/피크) 칸과 첫 숫자 칸 = 지금 값(라이브)
           · 두 번째 숫자 칸 = 임계(고정 — 흔들리면 임계가 아니다)
           · 그 뒤 = 상태·경보 건수 */
        const rowM = wfPick(M, r);
        [...tr.querySelectorAll('td.num, td.pair')].forEach((td, c) => {
          const isPair = td.classList.contains('pair');
          const m = (isPair || c === 0) ? rowM : c === 1 ? null : COUNT;
          const x = m ? val(m) : rowM.hi;
          const where = wfWrite(td, wfComma(x, (m || rowM).dec));
          td.querySelectorAll('.v2').forEach((n2) => (n2.textContent = wfComma(rowM.hi, rowM.dec)));
          if (!m) return;                        /* 임계 칸은 라이브로 잡지 않는다 — 흔들리면 임계가 아니다 */
          if (where === 'self') td.classList.add('wf-n-self');
          else where.classList.add('wf-n');
          wfLive(td, m, x);
        });
      });
    });

    /* ── 진행률 목록(.plist) — '무엇의 상위 5' 이므로 **목록 하나 = 계측 하나**다.
          줄마다 다른 계측을 넣으면 kW 옆에 ℃ 가 서서 순위표로 읽히지 않는다. 바뀌는 건 대상뿐. ── */
    fit.querySelectorAll('.plist').forEach((list, li) => {
      const m = wfPick(M, li);
      [...list.querySelectorAll('.prow')].forEach((row, k) => {
        const nm = row.querySelector('.nm');
        const fill = row.querySelector('.fill');
        const pv = row.querySelector('.pv');
        if (nm) nm.textContent = wfPick(spec.assets, k + li * 5);
        const x = val(m);
        if (fill) { fill.classList.add('wf-bar'); fill.style.width = wfPct(x, m.lo, m.hi, m.unit === '%') + '%'; }
        if (pv) { pv.classList.add('wf-n'); pv.textContent = wfComma(x, m.dec); }
        wfLive(row, m, x);
      });
    });

    /* ── 게이지 줄(.mini-row) — 항상 % 로 읽는다 ── */
    fit.querySelectorAll('.mini-row .mini').forEach((mini, k) => {
      const m = wfPick(M, k);
      const d = mini.querySelector('.d');
      const b = mini.querySelector('.d b');
      const p = wfPct(val(m), m.lo, m.hi, m.unit === '%');
      if (d) { d.classList.add('wf-gauge'); d.style.setProperty('--v', p.toFixed(0) + '%'); }
      if (b) { b.classList.add('wf-n'); b.textContent = p.toFixed(0) + '%'; }
      wfSetTail(mini, wfPick(spec.assets, k).replace(/\s*#\d+$/, ''));
      wfLive(mini, { lo: 0, hi: 100, dec: 0, unit: '%' }, p, { suffix: '%' });
    });

    /* ── 도넛 범례 ── */
    fit.querySelectorAll('.dleg .row').forEach((row, k) => {
      wfSetTail(row, wfPick(spec.assets, k));
      const b = row.querySelector('b');
      if (b) b.textContent = Math.max(4, Math.round(38 - k * 7 + rnd() * 4)) + '%';
    });

    /* ── 히트맵 행 이름(첫 줄은 날짜 머리글이라 그대로) ── */
    fit.querySelectorAll('.heat .hrow .rl').forEach((rl, k) => {
      if (k === 0) return;
      rl.textContent = wfPick(spec.assets, k - 1).replace(/\s*#\d+$/, '');
    });

    /* ── 이벤트 로그 — 문구·등급·시각을 대상에 맞게. 라이브 틱이 여기에 새 줄을 흘려 넣는다 ── */
    const log = fit.querySelector('.loglist');
    if (log) {
      /* 아래로 갈수록 반드시 더 오래된 줄이 되도록 간격을 쌓아 간다(줄마다 따로 뽑으면 순서가 엉킨다) */
      let back = 40 + Math.floor(rnd() * 90);
      [...log.querySelectorAll('.logrow')].forEach((row, k) => {
        wfFillLogRow(row, wfPick(spec.events, k), back);
        back += 150 + Math.floor(rnd() * 320);
      });
      log.dataset.wfFeed = '1';
      log.__wfEvents = spec.events;
    }
  }

  /* ── 라이브 틱 — 값이 폭 안에서 조금씩 걸어 다니고, 이벤트 로그엔 이따금 새 줄이 흘러든다 ──
     '패널편집'(글자 수정)·배치 편집 중에는 멈춘다. 안 그러면 지나간 값이 편집 내용으로 굳는다.
     보드가 문서에서 떨어지면 스스로 멈춘다(다시 그릴 때마다 새 틱이 붙는다). */
  function stopWfLive(board) {
    if (board && board.__wfTick) { clearInterval(board.__wfTick); board.__wfTick = 0; }
  }
  function startWfLive(board) {
    stopWfLive(board);
    if (!board || !board.querySelector('[data-wf-live]')) return;
    const stage = document.getElementById('dtStage');
    let n = 0;
    const step = () => {
      if (!board.isConnected) return stopWfLive(board);
      if (window.__wembIdle ? window.__wembIdle() : document.hidden) return;
      if (stage && (stage.classList.contains('dt-content-editing') || stage.classList.contains('dt-editing'))) return;
      n++;
      board.querySelectorAll('[data-wf-live]').forEach((host) => {
        const p = String(host.dataset.wfLive).split('|');
        const lo = parseFloat(p[0]), hi = parseFloat(p[1]);
        const dec = parseInt(p[2], 10) || 0, isPct = p[3] === '%';
        let v = parseFloat(host.dataset.wfV);
        if (!isFinite(v)) v = lo;
        const prev = v;
        v += (Math.random() - 0.5) * (hi - lo) * 0.14;      /* 폭의 ±7% 안에서 한 걸음 */
        v = Math.max(lo, Math.min(hi, v));
        host.dataset.wfV = v;
        /* KPI 의 증감 화살표도 이 걸음을 따라온다 — 숫자만 움직이고 화살표가 굳어 있으면 티가 난다 */
        const chg = host.querySelector('.kchg');
        if (chg) {
          const d = prev ? ((v - prev) / prev) * 100 : 0;
          const flat = Math.abs(d) < 0.05;
          chg.className = 'kchg ' + (flat ? 'flat' : v > prev ? 'up' : 'down');
          chg.innerHTML = (flat ? '—' : v > prev ? '▲' : '▼') + ' ' + Math.abs(d).toFixed(1) + '%';
        }
        const txt = wfComma(v, dec) + (host.dataset.wfSuf || '');
        if (host.classList.contains('wf-n-self')) {
          host.childNodes.forEach((c) => { if (c.nodeType === 3 && c.textContent.trim()) c.textContent = txt; });
        }
        host.querySelectorAll('.wf-n').forEach((e) => (e.textContent = txt));
        const pct = wfPct(v, lo, hi, isPct).toFixed(0);
        host.querySelectorAll('.wf-bar').forEach((e) => (e.style.width = pct + '%'));
        host.querySelectorAll('.wf-gauge').forEach((e) => e.style.setProperty('--v', pct + '%'));
      });
      /* 다섯 틱(약 12초)에 한 번 새 이벤트 — 맨 아래 줄을 떼어 맨 위에 다시 넣는다 */
      if (n % 5 === 0) {
        board.querySelectorAll('.loglist[data-wf-feed]').forEach((log) => {
          const rows = [...log.querySelectorAll('.logrow')];
          const evs = log.__wfEvents;
          if (rows.length < 2 || !evs || !evs.length) return;
          const row = rows[rows.length - 1];
          wfFillLogRow(row, evs[(Math.random() * evs.length) | 0], 5 + Math.floor(Math.random() * 40));
          log.insertBefore(row, log.firstElementChild);
        });
      }
    };
    board.__wfTick = setInterval(step, 2400);
  }

  /* 패널 하나에 콘텐츠(실제 대시보드 복제본 또는 대표 콘텐츠)를 채워 .wffit 을 만든다.
     renderInto(고정 보드)와 renderDtGrid(캔버스 채움)가 공유한다. */
  function buildFit(el, kind, w, h, title, idx) {
    const fit = mk('div', 'wffit');
    const real = realFor(kind, w);
    /* 이 판이 무엇을 보여줄지 — PRD 답변에서 뽑는다(제목·계측 항목·자산·이벤트 문구). */
    let spec = null;
    try { if (idx != null && typeof window.__prdPanelSpec === 'function') spec = window.__prdPanelSpec(idx); } catch (e) { spec = null; }
    if (spec && spec.title) title = spec.title;
    if (real && real.kpi) {
      el.classList.add('kpibox');
      fit.appendChild(real.el);
    } else if (real) {
      el.classList.add('panel'); /* 실제 .ph/.pbody 스타일이 그대로 먹도록 */
      while (real.el.firstChild) fit.appendChild(real.el.firstChild);
      if (title != null) { const hh = fit.querySelector('.ph h3'); if (hh) hh.textContent = title; }
    } else {
      fit.innerHTML = (kind === 'strip' ? '' : (title != null ? titledHead(title) : head())) + '<div class="wfbody">' + content(kind, w, h) + '</div>';
    }
    /* 복제해 온 데모 글자를 PRD 어휘로 갈아끼우고, 숫자에 라이브 표시를 남긴다 */
    if (spec) { try { applyPrdContent(fit, spec); } catch (e) { } }
    return fit;
  }
  /* ── 디지털 트윈 전용: 캔버스를 꽉 채우는 격자 렌더 ──
     예전엔 고정 비율 보드(열수×448 : 1080)를 통째로 축소(letterbox)해서, 레이아웃 비율이
     화면과 다르면 좌우/상하 여백이 크게 벌어져 어색했다. 여기서는 그리드 셀을 '현재 캔버스'
     크기에 맞춰 직접 배치하고, 바깥 테두리 여백(dtPad)과 패널 사이 간격(dtGap)을 일정하게 준다
     (기본 8px, '패널 간격' 슬라이더로 조절). 축소가 없으므로(1:1) 어느 화면에서도 여백이 균일하다. 리사이즈 때 재배치. */
  /* 바깥 테두리 여백(dtPad)·패널 사이 간격(dtGap) — '대시보드 편집 > 패널 간격' 슬라이더가 조절한다.
     저장된 간격(wemb-dash-gap)이 있으면 처음 렌더부터 그 값을 쓴다. */
  let dtPad = 8, dtGap = 8; /* dtPad(바깥 테두리 여백)은 고정 — 간격 슬라이더는 dtGap(패널 사이)만 바꾼다 */
  try { const g = parseInt(localStorage.getItem('wemb-dash-gap')); if (g >= 0 && g <= 20) dtGap = g; } catch (e) {}
  window.__setDtGap = function (px) {
    px = Math.max(0, Math.min(20, px | 0));
    if (px === dtGap) return;
    /* 패널 사이 간격만 조절한다 — 바깥 여백(dtPad)은 고정이라 전체폭 패널의 크기는 그대로 유지된다.
       (전체폭 패널 폭 = 캔버스폭 − dtPad*2 로 간격과 무관, 다열 패널만 여유폭을 나눠 갖는다.) */
    dtGap = px;
    if (dtLay) scheduleDtReflow();
  };
  window.__getDtGap = () => dtGap;
  function renderDtGrid(lay, animate) {
    const cv = wfCanvasDt;
    if (!cv || !lay || !lay.cells || !lay.cells.length) return;
    const cw = cv.clientWidth, ch = cv.clientHeight;
    if (!cw || !ch) { cv.hidden = false; return; } /* 아직 크기 0 → ResizeObserver가 다시 부른다 */
    POOL = buildPool();
    Object.keys(cursor).forEach((k) => (cursor[k] = 0));
    const cols = Math.max(1, lay.cols || 1), rows = Math.max(1, lay.rows || 1);
    const colW = (cw - dtPad * 2 - dtGap * (cols - 1)) / cols;
    const rowH = (ch - dtPad * 2 - dtGap * (rows - 1)) / rows;
    const titles = (typeof window.__prdContentItems === 'function') ? window.__prdContentItems() : [];
    cv.innerHTML = '';
    const board = mk('div', 'wfboard');
    board.style.width = cw + 'px';
    board.style.height = ch + 'px';
    board.style.transform = ''; /* 축소 없음 — 1:1 로 캔버스를 채운다 */
    lay.cells.forEach(([x, y, w, h], i) => {
      const left = dtPad + (x - 1) * (colW + dtGap);
      const top = dtPad + (y - 1) * (rowH + dtGap);
      const width = Math.max(1, w * colW + (w - 1) * dtGap);
      const height = Math.max(1, h * rowH + (h - 1) * dtGap);
      const el = mk('div', 'wfpanel');
      el.style.left = left + 'px';
      el.style.top = top + 'px';
      el.style.width = width + 'px';
      el.style.height = height + 'px';
      if (animate === false) el.style.animation = 'none'; /* 리사이즈 재배치 땐 등장 애니 생략 */
      else el.style.animationDelay = (i * 0.025).toFixed(3) + 's';
      const kind = kindFor(width, height, i);
      const title = (titles && titles.length) ? titles[i % titles.length] : null;
      el.appendChild(buildFit(el, kind, width, height, title, i));
      /* KPI 스트립은 내용 높이(≈112px)만 쓰고 셀 안에서 세로 가운데로 배치 →
         한 행을 통째로 차지하며 생기던 유리 안 위·아래 빈칸을 없앤다.
         (buildFit이 실제 KPI 박스일 때만 'kpibox'를 붙이므로 그때만 줄인다.)

         다만 **보드 가장자리에 닿는 셀은 그 가장자리에 붙인다.** 가운데로 두면 판이 천장·바닥에서
         떠 보드 위아래에 여백이 생긴다 — 바깥 여백은 dtPad 하나여야 한다('3레벨 · 2R'의 하단
         와이드 바가 그랬다: 위 8px 인데 아래는 24px 로 어긋나 판이 바닥에서 떠 보였다).
         · 위아래 모두 닿는 셀(세로로 보드를 다 쓰는 셀)이거나 셀이 내용보다 조금 클 뿐이면
           아예 줄이지 않고 셀을 그대로 채운다 — 어느 쪽에 붙여도 반대쪽에 여백이 남고,
           조금 남는 유리는 빈칸이 아니라 판 여백으로 읽힌다(내용은 CSS 가 가운데로 잡는다).
         · 안쪽 셀은 예전대로 가운데 — 위아래로 3D 씬이 비쳐야 하는 자리다. */
      if (el.classList.contains('kpibox')) {
        const KPI_H = 112, SNUG = 48;   /* SNUG: 이만큼 남는 건 빈칸이 아니라 판 여백으로 본다 */
        const slack = height - KPI_H;
        if (slack > 4) {
          const atTop = y === 1, atBottom = (y + h - 1) === rows;
          const fill = (atTop && atBottom) || ((atTop || atBottom) && slack <= SNUG);
          if (!fill) {
            el.style.top = (top + (atTop ? 0 : atBottom ? slack : slack / 2)) + 'px';
            el.style.height = KPI_H + 'px';
          }
        }
      }
      board.appendChild(el);
    });
    cv.appendChild(board);
    cv.hidden = false;
    cv.__board = { el: board, bw: cw, bh: ch, dtGrid: lay };
    fitContents(board);
    startWfLive(board);
  }
  /* 패널별 콘텐츠 축소 없음 — 콘텐츠는 실제 화면과 같은 밀도(네이티브)로 두고,
     보드 전체만 fitBoard가 화면 비율에 맞춰 균일 축소한다(패널마다 폰트가 제각각 작아지지 않게). */
  function fitContents(board) {
    board.querySelectorAll('.wfpanel > .wffit').forEach((fit) => {
      fit.style.transform = '';
      fit.style.width = '';
    });
  }
  /* 보드를 캔버스에 맞게 축소·가운데 정렬 (반응형 — 리사이즈 때 재계산) */
  function fitBoard(cv) {
    const b = cv && cv.__board;
    if (!b) return;
    const cw = cv.clientWidth, ch = cv.clientHeight;
    if (!cw || !ch) return; /* 숨겨진 캔버스는 보일 때 ResizeObserver가 다시 부른다 */
    const s = Math.min(cw / b.bw, ch / b.bh);
    const ox = (cw - b.bw * s) / 2, oy = (ch - b.bh * s) / 2;
    b.el.style.transform = 'translate(' + ox.toFixed(1) + 'px,' + oy.toFixed(1) + 'px) scale(' + s.toFixed(4) + ')';
  }
  const find = (grid, wid) => (WF[grid] || WF.g3).find((w) => w.n === wid) || (WF[grid] || WF.g3)[0];

  /* ── 원본 대시보드로 복귀 모드 ──
     와이어프레임을 미리보기에 반영하지 않는다. 와이어프레임 캔버스는 비우고 숨기며,
     기존 대시보드(.dashpage) / 디지털 트윈(.dt-ui)을 그대로 다시 보여준다.
     (renderInto·buildPool 등 와이어프레임 렌더 함수는 나중에 되살릴 수 있도록 남겨 둔다.) */
  function applyDash() {
    if (wfCanvas) { wfCanvas.hidden = true; wfCanvas.innerHTML = ''; wfCanvas.__board = null; }
    document.querySelectorAll('.stage .dashpage').forEach((p) => (p.style.display = ''));
  }
  /* ── 새 프로젝트에서 고른 디지털 트윈 레이아웃을 3D 씬 위 유리 패널로 재현 ──
     그리드 모델(cols/rows/cells)을 1920×1080 좌표의 패널 사각형으로 바꿔 renderInto로
     그린다. 가운데 빈 셀은 패널을 만들지 않아 3D 씬이 그대로 비친다. */
  let dtLay = null;
  let dtReflowRaf = 0;
  /* 리사이즈/사이드바 토글로 캔버스 크기가 바뀌면 다음 프레임에 한 번만 재배치(등장 애니 생략) */
  function scheduleDtReflow() {
    if (!dtLay || dtReflowRaf) return;
    dtReflowRaf = requestAnimationFrame(() => {
      dtReflowRaf = 0;
      const firstPaint = !(wfCanvasDt && wfCanvasDt.__board);
      renderDtGrid(dtLay, firstPaint);
      if (window.__dtWfEditRefresh) window.__dtWfEditRefresh();
    });
  }
  function applyDt() {
    /* 레이아웃이 지정되면 유리 패널로 재현하고 기본 .dt-ui는 감춘다 */
    if (dtLay) {
      if (dtUi) dtUi.style.display = 'none';
      renderDtGrid(dtLay, true);
      /* 렌더 직후, PRD 플로우 유리 패널에 저장된 배치·내용 편집을 다시 입힌다 */
      if (window.__dtWfEditRefresh) window.__dtWfEditRefresh();
      /* 진입 직후엔 캔버스가 아직 최종 크기가 아닐 수 있어 다음 프레임에 한 번 더 맞춘다 */
      scheduleDtReflow();
      return;
    }
    if (wfCanvasDt) { wfCanvasDt.hidden = true; wfCanvasDt.innerHTML = ''; wfCanvasDt.__board = null; }
    if (dtUi) dtUi.style.display = '';
  }
  /* 레이아웃 객체(cols/rows/cells) 또는 null을 받아 DT 화면에 반영. initFlow에서 호출. */
  window.__applyDtLayout = function (lay) {
    dtLay = (lay && lay.cells && lay.cells.length) ? lay : null;
    applyDt();
  };
  /* PRD 플로우 편집 모듈이 참조 — 현재 유리 패널 레이아웃 id, 강제 재렌더 */
  window.__dtWfLayoutId = () => (dtLay ? dtLay.id : null);
  window.__dtWfRerender = () => { if (dtLay) applyDt(); };
  /* 창 크기가 바뀌면 활성 DT 레이아웃을 캔버스에 맞춰 다시 배치한다 */
  window.addEventListener('resize', scheduleDtReflow);
  /* 캔버스 자체 크기가 바뀔 때(스튜디오 진입 전환·사이드바 접기·처음 표시 등)마다 보드를 다시 맞춘다.
     — 렌더 시점에 캔버스가 아직 최종 크기가 아니면 축소 배율이 어긋나 레이아웃이 이상하게 나오던 문제 해결. */
  if (typeof ResizeObserver === 'function') {
    const ro = new ResizeObserver(() => {
      if (wfCanvas && wfCanvas.__board && !wfCanvas.hidden) fitBoard(wfCanvas);
      if (dtLay && wfCanvasDt && !wfCanvasDt.hidden) scheduleDtReflow();
    });
    if (wfCanvas) ro.observe(wfCanvas);
    if (wfCanvasDt) ro.observe(wfCanvasDt);
  }
  function applyLayout() {
    applyDash();
    applyDt();
  }

  /* ── 갤러리 썸네일 (같은 좌표를 미니로) ── */
  function thumb(wf) {
    const t = mk('div', 'wthumb pos');
    norm(wf.p).forEach((p) => {
      const i = mk('i');
      i.style.left = p.l + '%';
      i.style.top = p.t + '%';
      i.style.width = p.w + '%';
      i.style.height = p.h + '%';
      t.appendChild(i);
    });
    return t;
  }

  /* ── 저장/복원 ── */
  function persist(s) {
    try {
      localStorage.setItem('wemb-grid-' + s, state.gridBy[s]);
      localStorage.setItem('wemb-wire-' + s, state.wireBy[s]);
    } catch (e) {}
  }
  function restore() {
    ['dash', 'dt'].forEach((s) => {
      try {
        const g = localStorage.getItem('wemb-grid-' + s);
        if (g && WF[g]) state.gridBy[s] = g;
      } catch (e) {}
      const list = WF[state.gridBy[s]] || WF.g3;
      let w = null;
      try { w = localStorage.getItem('wemb-wire-' + s); } catch (e) {}
      state.wireBy[s] = list.some((x) => x.n === w) ? w : list[0].n;
    });
  }

  /* ── 복귀 모드 — 그리드/와이어프레임 선택 UI는 감춘다(원본 대시보드만 보인다) ── */
  function render() {
    if (gridPick) gridPick.hidden = true;
    if (wirePick) wirePick.hidden = true;
  }

  /* ── 초기화 ── 와이어프레임 미리보기를 끄고 원본 대시보드/디지털 트윈을 복원 ── */
  applyDash();
  applyDt();
  render();
  window.__refreshScreenBuilder = render;
  /* 화면 종류(대시보드/디지털 트윈)를 바꿔도 각 원본 화면이 그대로 보이도록 보정 */
  document.querySelectorAll('#screen button').forEach((b) => {
    b.addEventListener('click', () => {
      if (b.disabled) return;
      setTimeout(() => { applyDash(); applyDt(); }, 0);
    });
  });
})();
