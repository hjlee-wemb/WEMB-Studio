/* 신한카드 정보보호 대시보드 4화면(Figma zXb8i3nonD9Hpu5kdZQs6t)의 에셋을
   스튜디오 '에셋 라이브러리' 등록 목록(src/shinhan-assets.js)으로 만든다.

   ── 등록 단위는 '컴포넌트' 다 (POSCO · 한진 · HANA 와 같은 규칙) ──
   눈금선 · 배지 바탕 · 글자 한 줄 같은 **부품은 등록하지 않는다.** 위젯 · 표 · 표 행 · KPI 타일 ·
   일정 카드 · 배지 · 필드 · 단추처럼 그 자체로 뜻이 서는 덩어리만 올린다.
   같은 그림이 여러 화면에 겹치면 **한 번만** 올린다(헤더는 네 화면에 다 있고, 협력사 KPI 묶음은
   부서 KPI 묶음과 타일 수만 다르다).

   ── 마크업도 CSS 도 복사해 두지 않는다 ──
   등록 목록에는 화면 접두어와 노드 id 만 적고, 라이브러리가 window.build_shXX 가 만든 DOM 에서
   그때그때 잘라 쓴다. 글자는 실제 텍스트라 '패널편집'으로 고칠 수 있고 다크/라이트 · '색 정하기'가 따라온다.

   ── 이 시안만의 사정: 종합현황(2:2)의 위젯은 GROUP 이다 ──
   Figma GROUP 은 재구축 DOM 에서 display:contents 라 상자가 없고, 자식은 **화면(1920x1080) 좌표**로
   놓여 있다. 그대로 잘라 오면 0x0 이다. 그래서 GROUP 등록물에는 화면 안 자리(ox · oy)를 함께 적고,
   라이브러리(js/studio/layout-editor.js hjDom)가 1920x1080 판(.hj-ofs)을 (-ox, -oy) 만큼 당겨
   그 안에 서브트리를 놓는다 — 자식 좌표를 한 글자도 고치지 않고 위젯 자리만 창으로 보여 준다.

   ── w · h · ox · oy 는 브라우저에서 잰 값이다(sizes.json) ──
   이 시안에는 전체 노드 메타가 없다. 다시 재려면:
     1) node src/shinhan/_gen/serve.js 5521
     2) node src/shinhan-assets/_gen/measure.js   → 붙일 코드가 나온다(네 화면 차례로)
     3) 결과 JSON 을 sizes.json 에 저장하고 이 파일을 다시 돌린다.

   사용법:  node src/shinhan-assets/_gen/mk-assets.js
*/
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..');
const OUT = path.join(ROOT, 'src', 'shinhan-assets.js');
const BASE = 'src/shinhan/';

/* px → 화면 모듈 · 빌더. 등록창(sha)은 창 하나만 그리는 빌더라 시트도 SHA_CSS 를 쓴다. */
const SCREEN = {
  shm: { out: 'shinhan-overview', title: '종합현황' },
  sha: { out: 'shinhan-register', title: '이상징후 탐지 등록' },
  shi: { out: 'shinhan-entry', title: '정보보호 데이터 입력' },
  shd: { out: 'shinhan-anomaly', title: '이상징후 탐지' },
};

global.window = {};
Object.keys(SCREEN).forEach((px) => require(path.join(ROOT, 'src', SCREEN[px].out + '.js')));
const W = global.window;
const HTML = {};
Object.keys(SCREEN).forEach((px) => { HTML[px] = W['build_' + px](BASE); });

function sub(html, nid) {
  const at = html.indexOf('data-node-id="' + nid + '"');
  if (at < 0) return null;
  const start = html.lastIndexOf('<', at);
  const tag = (/^<([a-zA-Z0-9]+)/.exec(html.slice(start, start + 20)) || [])[1];
  if (!tag) return null;
  const open = new RegExp('<' + tag + '(?=[\\s>])', 'g');
  const close = new RegExp('</' + tag + '>', 'g');
  let depth = 0, i = start;
  while (i < html.length) {
    open.lastIndex = i; close.lastIndex = i;
    const o = open.exec(html), c = close.exec(html);
    if (!c) return null;
    if (o && o.index < c.index) { depth++; i = o.index + 1; continue; }
    depth--; i = c.index + 1;
    if (depth === 0) return html.slice(start, c.index + c[0].length);
  }
  return null;
}

/* ══════════════════ 등록 목록 ══════════════════
   이름은 **화면에 찍힌 한글을 그대로** 쓴다(보안 위협 등급 · 주요 일정 …). 제목이 없는 부품은
   Figma 레이어명을 옮긴다(Schedule Card → 일정 카드, Day Badge → 요일 배지).
   '(정보보호)' 는 **다른 시안 등록물과 이름이 겹칠 때만** 붙였다(아래 이름 겹침 검사가 잡는다). */
const ITEMS = {
  charts: [
    { px: 'shm', nid: '12:9', name: '전체 트레픽 용량 선 차트', fig: 'Line Chart/Total Traffic' },
    { px: 'shm', nid: '19:239', name: '이상징후 탐지 막대 차트', fig: 'Bar Chart < Widget/Anomaly Detection' },
  ],

  /* 위젯 · 창 · 표 통째로 */
  panels: [
    { px: 'shm', nid: '80:19', name: '헤더 (정보보호)', fig: 'Header' },
    { px: 'shm', nid: '12:10', name: '보안 위협 등급', fig: 'Widget/Threat Level' },
    { px: 'shm', nid: '13:65', name: '위협 현황', fig: 'Widget/Threat Status' },
    { px: 'shm', nid: '16:1019', name: '부서별 정보보호 점검 현황', fig: 'Widget/Department Audit' },
    { px: 'shm', nid: '16:1018', name: '주요 일정', fig: 'Widget/Key Schedule' },
    { px: 'shm', nid: '19:240', name: '이상징후 탐지 현황', fig: 'Widget/Anomaly Detection' },
    { px: 'shm', nid: '42:306', name: '정보반출 승인현황', fig: 'Widget/Data Export Approval' },
    { px: 'shm', nid: '42:307', name: '보안성 심의 및 내부통제 검토 현황', fig: 'Widget/Security Review' },
    { px: 'shm', nid: '42:308', name: '협력사 보안관리 시스템', fig: 'Widget/Partner Security' },
    { px: 'shm', nid: '6:296', name: '경보 티커 (정보보호)', fig: 'Alert Ticker < Widget/Threat Level' },
    { px: 'sha', nid: '66:1026', name: '이상징후 탐지 등록 창', fig: 'Dialog/Anomaly Registration' },
    { px: 'shi', nid: '68:2129', name: '부서별 정보보호 점검 입력', fig: 'Widget/Department Audit < Content' },
    { px: 'shi', nid: '68:2130', name: '보안성 심의 입력', fig: 'Widget/Security Review < Content' },
    { px: 'shi', nid: '68:2186', name: '내부 통제 입력', fig: 'Widget/Internal Control < Content' },
    { px: 'shd', nid: '72:2539', name: '이상징후 탐지 표', fig: 'Table/Anomaly Detection' },
    { px: 'shd', nid: '72:2538', name: '이상징후 검색줄', fig: 'Search Bar' },
  ],

  /* 이 시안에는 이벤트 목록 · 로그가 없다(경보 티커는 공지 한 줄이라 판으로 올렸다) */
  events: [],

  /* 그 자체로 뜻이 서는 덩어리 — 표 · 표 행 · 타일 · 카드 · 배지 · 필드 · 단추 */
  symbols: [
    /* 헤더 */
    { px: 'shm', nid: '2:114', name: '브랜드', fig: 'Brand < Header Bar' },
    { px: 'shm', nid: '2:15', name: '헤더 메뉴 (정보보호)', fig: 'Menu < Header Bar' },
    { px: 'shm', nid: '2:19', name: '메뉴 항목 (선택)', fig: 'Menu Item/Main (Selected)' },
    { px: 'shm', nid: '2:16', name: '메뉴 항목 (정보보호)', fig: 'Menu Item/Anomaly Detection' },
    { px: 'shm', nid: '5:153', name: '헤더 툴바 (정보보호)', fig: 'Toolbar < Header Bar' },
    { px: 'shi', nid: '76:157', name: '페이지 제목', fig: 'Page Title < Header Bar' },
    /* 위젯 공통 */
    { px: 'shm', nid: '19:112', name: '위젯 제목', fig: 'Title < Widget/Anomaly Detection' },
    { px: 'shm', nid: '15:586', name: '소제목 이름표', fig: 'Section Label/Target Departments' },
    { px: 'shm', nid: '15:412', name: '유리 아이콘 배지', fig: 'Icon Badge < Metric Group/Detected' },
    /* 보안 위협 등급 */
    { px: 'shm', nid: '6:714', name: '평시 등급 배지', fig: 'Property 1=normal < Alert Ticker' },
    { px: 'shm', nid: '6:774', name: '선 차트 범례', fig: 'Legend < Line Chart/Total Traffic' },
    { px: 'shm', nid: '6:782', name: '날짜 필터', fig: 'Date Filter < Line Chart/Total Traffic' },
    /* 위협 현황 */
    { px: 'shm', nid: '15:457', name: '탐지건수 지표 묶음', fig: 'Metric Group/Detected' },
    { px: 'shm', nid: '15:458', name: '처리건수 지표 묶음', fig: 'Metric Group/Handled' },
    { px: 'shm', nid: '15:442', name: '지표 항목', fig: 'Metric/Malware < Metrics' },
    /* 부서별 정보보호 점검 현황 */
    { px: 'shm', nid: '15:742', name: '정보보호 점검 표', fig: 'Table < Widget/Department Audit' },
    { px: 'shm', nid: '15:683', name: '점검 표 행', fig: 'Row/In Progress < Body' },
    { px: 'shm', nid: '15:792', name: 'KPI 받침 묶음', fig: 'KPI Group < Widget/Department Audit' },
    { px: 'shm', nid: '15:775', name: 'KPI 타일 (정보보호)', fig: 'KPI/Last Month < KPI List' },
    /* 주요 일정 */
    { px: 'shm', nid: '80:13', name: '일정 목록', fig: 'Schedule List < Widget/Key Schedule' },
    { px: 'shm', nid: '16:874', name: '일정 카드', fig: 'Schedule Card/Mon' },
    { px: 'shm', nid: '16:998', name: '일정 카드 (빈 날)', fig: 'Schedule Card/Thu (Empty)' },
    { px: 'shm', nid: '16:872', name: '요일 배지', fig: 'Day Badge < Schedule Card/Mon' },
    /* 이상징후 탐지 현황 */
    { px: 'shm', nid: '19:120', name: '방패 비주얼', fig: 'Visual < Widget/Anomaly Detection' },
    { px: 'shm', nid: '19:189', name: '막대 묶음 (선택)', fig: 'Bar Group/Scenario 5 (Selected)' },
    /* 정보반출 승인현황 */
    { px: 'shm', nid: '21:588', name: '임계치 초과승인 표', fig: 'Approval Group/Over-Threshold' },
    { px: 'shm', nid: '21:637', name: '부서자체승인 표', fig: 'Approval Group/Department' },
    { px: 'shm', nid: '21:590', name: '승인 표 행', fig: 'Row/Pending < Body' },
    /* 보안성 심의 및 내부통제 검토 현황 */
    { px: 'shm', nid: '80:17', name: '보안성 심의 묶음', fig: 'Review Group/Security Review' },
    { px: 'shm', nid: '80:18', name: '정보보호 · 내부통제 검토 묶음', fig: 'Review Group/Internal Control' },
    { px: 'shm', nid: '42:242', name: '분류 배지', fig: 'Category Badge < Review Group/Security Review' },
    /* 협력사 보안관리 시스템 */
    { px: 'shm', nid: '42:29', name: '협력사 점검 표', fig: 'Table < Widget/Partner Security' },
    { px: 'shm', nid: '22:831', name: '표 머리 칩', fig: 'Chip < Th/On-site Inspection' },
    /* 이상징후 탐지 등록 창 */
    { px: 'sha', nid: '66:1027', name: '창 제목줄', fig: 'Title Bar < Dialog/Anomaly Registration' },
    { px: 'sha', nid: '66:1034', name: '기준일자 필드', fig: 'Field/Base Date < Form' },
    { px: 'sha', nid: '66:1041', name: '대분류 필드', fig: 'Field/Category < Form' },
    { px: 'sha', nid: '66:1062', name: '새로고침 단추', fig: 'Button/Reset < Footer' },
    { px: 'sha', nid: '66:1064', name: '등록 단추', fig: 'Button/Register < Footer' },
    /* 정보보호 데이터 입력 */
    { px: 'shi', nid: '68:2127', name: '입력 위젯 머리글', fig: 'Header < Widget/Department Audit' },
    { px: 'shi', nid: '68:2047', name: '입력 단추', fig: 'Button/Input < Actions' },
    { px: 'shi', nid: '68:2059', name: '입력 표 머리글', fig: 'Header Row < Table' },
    { px: 'shi', nid: '68:2075', name: '입력 표 행', fig: 'Row/In Progress < Body' },
    /* 이상징후 탐지 */
    { px: 'shd', nid: '81:10', name: '대분류 선택 칸', fig: 'Field/Category < Search Bar' },
    { px: 'shd', nid: '81:11', name: '기준일자 칸', fig: 'Field/Base Date < Search Bar' },
    { px: 'shd', nid: '71:2531', name: '조회 단추', fig: 'Button/Search < Actions' },
    { px: 'shd', nid: '72:2540', name: '이상징후 표 머리글', fig: 'Header Row < Table/Anomaly Detection' },
    { px: 'shd', nid: '72:2550', name: '이상징후 표 행', fig: 'Row/01 < Body' },
    { px: 'shd', nid: '72:7589', name: '이상징후 표 행 (선택)', fig: 'Row/04 (Selected) < Body' },
  ],
};

/* 아이콘 — 화면이 쓰는 원본 파일 그대로(경로만 참조). 이름은 '…아이콘'(아이콘 탭 규칙 isIconNamed).
   유리 아이콘 배지(icon-badge*.svg)는 배경 흐림(foreignObject)이라 <img> 로 안 그려진다 → 아이콘이 아니라
   위 symbols 의 '유리 아이콘 배지'(인라인 DOM)로 올렸다. */
const ICONS = [
  ['icon-action-clock.svg', '시계 아이콘', 'Icon/Action/Clock < Time'],
  ['icon-action-logout.svg', '로그아웃 아이콘', 'Icon/Action/Logout < Time Group'],
  ['icon-action-close.svg', '닫기 아이콘', 'Icon/Action/Close < Close Button'],
  ['icon-field-calendar.svg', '달력 아이콘', 'Icon < Field/Base Date'],
  ['checkbox-checked.svg', '체크 아이콘', 'Checkbox < Td/Visible'],
];

const SIZES = JSON.parse(fs.readFileSync(path.join(__dirname, 'sizes.json'), 'utf8'));

const report = [];
const out = { charts: [], symbols: [], panels: [], events: [], icons: [] };
let miss = 0;

['charts', 'symbols', 'panels', 'events'].forEach((cat) => {
  ITEMS[cat].forEach((it) => {
    const html = sub(HTML[it.px], it.nid);
    if (!html) { console.error('  !! 못 찾음: ' + it.px + ' ' + it.nid + ' (' + it.name + ')'); miss++; return; }
    const z = SIZES[it.px + '|' + it.nid];
    if (!z || !z.w || !z.h) { console.error('  !! 크기 없음: ' + it.nid + ' (' + it.name + ') — measure.js 로 잴 것'); miss++; return; }
    const a = {
      id: 'sh_' + it.px + '_' + it.nid.replace(/[:;]/g, '_'),
      name: it.name,
      fig: it.fig + ' (' + it.nid + ')',
      px: it.px,
      nid: it.nid,
      w: z.w,
      h: z.h,
    };
    /* GROUP(상자 없음) — 화면 안 자리를 함께 적는다(hjDom 이 1920x1080 판을 그만큼 당긴다) */
    if (z.group) { a.ox = z.ox; a.oy = z.oy; }
    out[cat].push(a);
    report.push([cat, it.px, it.nid, z.w + 'x' + z.h + (z.group ? ' @' + z.ox + ',' + z.oy : ''), it.name]);
  });
});

['charts', 'symbols', 'panels', 'events'].forEach((cat) => {
  const seen = {};
  out[cat].forEach((a) => {
    if (seen[a.name]) { console.error('  !! 이름 중복: [' + cat + '] ' + a.name); miss++; }
    seen[a.name] = 1;
  });
});

ICONS.forEach(([file, name, fig]) => {
  const p = path.join(ROOT, BASE, file);
  if (!fs.existsSync(p)) { console.error('  !! 파일 없음: ' + BASE + file); miss++; return; }
  if (!Object.keys(HTML).some((px) => HTML[px].indexOf('/' + file) >= 0)) {
    console.error('  !! 화면이 안 쓰는 파일: ' + file); miss++; return;
  }
  if (!/아이콘/.test(name)) { console.error('  !! 아이콘 탭 규칙 위반: ' + name); miss++; return; }
  out.icons.push({ id: 'sh_' + file.replace(/\.svg$/, '').replace(/-/g, '_'), name: name, fig: fig, src: BASE + file });
});

/* 다른 시안 등록물과 이름이 겹치는지 — 겹치면 이쪽 이름에 (정보보호) 를 붙인다(아이콘은 일반명이라 그대로) */
(function crossCheck() {
  const TAB = { charts: 'chart', symbols: 'symbol', icons: 'icon', panels: 'panel', events: 'event' };
  const mine = {};
  Object.keys(TAB).forEach((k) => out[k].forEach((a) => { (mine[TAB[k]] = mine[TAB[k]] || {})[a.name] = 1; }));
  ['hanjin-assets.js', 'hana-assets.js', 'posco-assets.js', 'icheon-assets.js', 'skhynix-assets.js'].forEach((f) => {
    const p = path.join(ROOT, 'src', f);
    if (!fs.existsSync(p)) return;
    const w = {};
    try { new Function('window', fs.readFileSync(p, 'utf8'))(w); } catch (e) { return; }
    const A = w[Object.keys(w)[0]] || {};
    Object.keys(TAB).forEach((k) => (A[k] || []).forEach((a) => {
      const nm = String(a.name).split('/').pop().trim();
      if (TAB[k] !== 'icon' && mine[TAB[k]] && mine[TAB[k]][nm]) {
        console.error('  ?? 이름 겹침: [' + TAB[k] + '] ' + nm + '  ← ' + f);
      }
    }));
  });
})();

/* ── 라이트 테마 규칙을 에셋에도 ──
   이 시안의 라이트(흰 카드 · 짙은 글자 · 한 톤 짙은 KPI 타일 …)는 화면 시트(SHM_LIGHT_CSS)가 아니라
   라이브 층(src/shinhan-live.js)의 `.sh-root[data-theme="light"] …` 규칙이 칠한다. 라이브 층은 라이브러리
   썸네일 · 삽입본에는 돌지 않으니, 그 규칙을 에셋 뿌리(.sh-asset)용으로 옮겨 적는다.
   · 라이브가 실행 중에 붙이는 표시 클래스는 원본 레이어 이름으로 바꾼다
     .sh-cur · .sh-sel · .sh-on → [data-name*="(Selected)"],  p.sh-offplate → 두 줄 이름표의 아랫줄(p + p),
     .sh-gtext → 화면 시트에서 background-clip:text 인 글자들
   · 끌기 · 반응형 층(.sh-wl · .sh-blk) · 차트 바꾸기(.sh-chart) · 라이브 움직임(.sh-live) 규칙은 뺀다.
     흰 카드 규칙(.sh-wl > Background)만 GROUP 위젯의 판(.hj-ofs > Widget > Background)으로 옮긴다. */
require(path.join(ROOT, 'src', 'shinhan-live.js'));
const LIVE = W.SHINHAN_LIVE_CSS || '';
if (!LIVE) { console.error('  !! shinhan-live.js 에 SHINHAN_LIVE_CSS 가 없다'); miss++; }
const gsel = [];
Object.keys(SCREEN).forEach((px) => {
  (W[px.toUpperCase() + '_CSS'].match(/[^{}]+\{[^}]*background-clip:\s*text[^}]*\}/g) || []).forEach((r) => {
    r.split('{')[0].split(',').forEach((s) => {
      s = s.trim();
      if (s.indexOf('.' + px + '-root ') === 0) gsel.push('.sh-asset.' + px + '-root[data-theme="light"] ' + s.slice(px.length + 7));
    });
  });
});
const SEL = '[data-name*="(Selected)"]';
const assetCss = LIVE.split('\n').filter((l) => {
  if (/^\.sh-root\{--sh-acc/.test(l)) return true;
  if (l.indexOf('[data-theme="light"]') < 0) return false;
  if (/\.sh-wl > \[data-name="Background"\]/.test(l)) return true;
  return !/\.sh-(wl|blk|chart|live|drag|edit|resiz|click)/.test(l);
}).map((l) => l
  .replace('.sh-root[data-theme="light"]{background:#eef2f8!important;', '.sh-root[data-theme="light"]{')
  .replace(/\.sh-wl > \[data-name="Background"\]/g, '.hj-ofs > [data-name^="Widget/"] > [data-name="Background"]')
  .replace(/\.sh-root \.sha-root\[data-theme="light"\]/g, '.sh-asset.sha-root[data-theme="light"]')
  .replace(/\.sh-root/g, '.sh-asset')
  .replace(/:not\(\.sh-cur\)/g, ':not(' + SEL + ')')
  .replace(/\.sh-(cur|sel|on)\b/g, SEL)
  .replace(/p\.sh-offplate/g, '[data-name="Label"] > p + p')
  .replace(/^(.*?)\.sh-gtext(\{.*)$/, (m, pre, body) => gsel.join(',') + body)
).join('\n');

const screens = {};
Object.keys(SCREEN).forEach((px) => {
  screens[px] = {
    build: 'build_' + px,
    css: px.toUpperCase() + '_CSS',
    light: px.toUpperCase() + '_LIGHT_CSS',
    /* 라이브러리(hjScreenHtml)가 화면 시트 다음에 붙이는 시트 · 에셋 뿌리에 더하는 클래스 */
    extra: 'SHINHAN_ASSET_CSS',
    rootClass: 'sh-asset',
    title: SCREEN[px].title,
    base: BASE,
  };
});

const head =
  '/* 자동 생성물 — 신한카드 정보보호 대시보드 4화면(Figma zXb8i3nonD9Hpu5kdZQs6t)의 에셋 라이브러리 등록 목록.\n' +
  '   등록 단위는 컴포넌트다(부품은 넣지 않는다). 같은 그림이 여러 화면에 겹치면 한 번만 올린다.\n' +
  '   마크업도 CSS 도 복사해 두지 않는다 — 화면 빌더(build_shXX)의 DOM 에서 노드 id 로 그때그때 잘라 쓴다.\n' +
  '   ox · oy 가 있는 것은 Figma GROUP(상자 없음)이라 화면 판째 당겨 그 자리만 보여 준다(layout-editor.js hjDom).\n' +
  '   생성기: src/shinhan-assets/_gen/mk-assets.js — 손으로 고치지 말고 다시 돌릴 것. */\n';

const js = head + 'window.__SHINHAN_ASSETS = ' + JSON.stringify({
  base: BASE,
  screens: screens,
  charts: out.charts,
  symbols: out.symbols,
  icons: out.icons,
  panels: out.panels,
  events: out.events,
}, null, 1) + ';\n'
  + '/* 라이브 층의 라이트 규칙을 에셋 뿌리(.sh-asset)용으로 옮긴 것 — 위 머리말 참고 */\n'
  + 'window.SHINHAN_ASSET_CSS = ' + JSON.stringify(assetCss) + ';\n';
fs.writeFileSync(OUT, js);

report.forEach((r) => console.log('  ' + r[0].padEnd(8) + r[1].padEnd(4) + r[2].padEnd(10) + r[3].padEnd(22) + r[4]));
console.log('\n' + path.relative(ROOT, OUT) + ' — 차트 ' + out.charts.length + ' · 심볼 ' + out.symbols.length
  + ' · 아이콘 ' + out.icons.length + ' · 판 ' + out.panels.length + ' · 이벤트 ' + out.events.length
  + (miss ? '  (문제 ' + miss + '건)' : ''));
if (miss) process.exitCode = 1;
