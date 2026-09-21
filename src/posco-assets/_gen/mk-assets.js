/* POSCO KDB CCTV 관제 10화면(Figma dj0SONcO5BySCm7yDdZrNc)의 에셋을
   스튜디오 '에셋 라이브러리' 등록 목록(src/posco-assets.js)으로 만든다.

   ── 등록 단위는 '컴포넌트' 다 ──
   눈금선·배지 바탕·글자 한 줄 같은 **부품은 등록하지 않는다.** 꺼내 쓸 수 있는 최소 단위는
   위젯·판·팝업·표 행·칩·타일처럼 그 자체로 뜻이 서는 덩어리다.
   같은 그림이 여러 화면에 겹쳐 나오면 **한 번만** 올린다(헤더·브레드크럼·이벤트 현황 판은
   여섯 화면에 다 있고, SOP STEP 1·2·3 의 단계 목록은 같은 목록의 진행 상태만 다르다).

   ── 왜 Figma 내보내기가 아니라 화면 DOM 에서 뽑나 (한진·HANA 와 같은 이유) ──
   재구축한 화면에는 같은 컴포넌트가 온전한 DOM 으로 들어 있고 글자가 **편집 가능한 실제 텍스트**다.
   그래서 라이브러리에서 꺼낸 뒤에도 '패널편집'으로 글자를 고칠 수 있고, 화면 테마(다크/라이트)와
   '색 정하기'가 썸네일까지 똑같이 따라온다. SVG 내보내기는 글자가 path 로 굳는다.

   그래서 이 파일은 **마크업도 CSS 도 복사해 두지 않는다.** 등록 목록에는 화면 접두어와 노드 id 만
   적고, 라이브러리가 window.build_pkXX 가 만든 DOM 에서 그때그때 잘라 쓴다.

   ── w·h 는 브라우저에서 잰 값이다 ──
   이 시안에는 HANA 의 nodes.json 같은 **전체 노드 메타가 없다**(meta-*.xml 은 TEXT 상자뿐).
   재구축 화면을 1920x1080 으로 펴 놓고 getBoundingClientRect 로 쟀고, 그 값을 아래 표에 적었다.
   다시 재려면:  node src/posco-assets/_gen/measure.js <px>   → 브라우저에 붙일 코드가 나온다.

   사용법:  node src/posco-assets/_gen/mk-assets.js [-v]
*/
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..');
const OUT = path.join(ROOT, 'src', 'posco-assets.js');
const BASE = 'src/posco/';

/* px → 화면 모듈. 라이브러리는 `build_pkXX` 와 `PKXX_CSS` 전역 이름으로 DOM 과 시트를 가져간다. */
const SCREEN = {
  pkm: { out: 'posco-main', title: '메인' },
  pka: { out: 'posco-ack', title: '메인(Ack 알림)' },
  pko: { out: 'posco-overview', title: '종합현황' },
  pkr: { out: 'posco-route', title: '출입동선' },
  pkf: { out: 'posco-floors', title: '전체층' },
  pkd: { out: 'posco-detail', title: '단층' },
  pks1: { out: 'posco-sop1', title: 'SOP 상황인지' },
  pks4: { out: 'posco-sop4', title: 'SOP 체계도' },
};

global.window = {};
Object.keys(SCREEN).forEach((px) => require(path.join(ROOT, 'src', SCREEN[px].out + '.js')));
const W = global.window;

const HTML = {};
Object.keys(SCREEN).forEach((px) => { HTML[px] = W['build_' + px](BASE); });

/* ── 화면 DOM 에서 노드 하나의 서브트리를 잘라 낸다(여는/닫는 태그 짝 세기) ── */
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
   px=화면 · nid=Figma 노드 id · name=스튜디오 표기 · w/h=브라우저에서 잰 크기(1920x1080 기준)
   fig=Figma 레이어명(추적용).

   이름 짓기: **화면에 찍힌 한글을 그대로** 쓴다(자산정보현황 · 출입내역 · 자산리스트 …).
   제목이 없는 부품은 Figma 레이어명을 곧이곧대로 옮긴다(Nav Item → 내비 타일).
   이름 뒤에 화면을 덧붙이지 않는다 — 같은 이름이 겹칠 때만 괄호로 구분한다
   (자산정보현황 (요약) · (층별)). */
const ITEMS = {
  /* 이 시안에는 그래프·계기가 없다 — 관제 화면이 표·도면·상태 타일로만 짜여 있다.
     (차트 탭에는 다른 시안의 차트와 화면에서 캡처한 차트가 계속 올라온다) */
  charts: [],

  /* 위젯·판·팝업 통째로 */
  panels: [
    { px: 'pkm', nid: '2:18449', name: '자산정보현황 (요약)', fig: 'Widget/Asset Summary', w: 517, h: 114 },
    { px: 'pkm', nid: '2:18454', name: '경보 티커', fig: 'Alert Ticker', w: 552, h: 46 },
    { px: 'pkm', nid: '1:3025', name: '헤더 바', fig: 'Header', w: 1920, h: 56 },
    { px: 'pka', nid: '1:1233', name: 'Ack 안내 팝업', fig: 'ack-popup', w: 336, h: 128 },
    { px: 'pko', nid: '40:11526', name: '종합현황', fig: 'Popup/Overview', w: 539, h: 803 },
    { px: 'pkr', nid: '1:2618', name: '출입동선 판', fig: 'Panel/Access Route', w: 546, h: 678 },
    { px: 'pkr', nid: '1:2621', name: '출입동선', fig: 'Widget/Access Route', w: 521, h: 257 },
    { px: 'pkr', nid: '1:2732', name: '출입내역', fig: 'Widget/Access History', w: 521, h: 379 },
    { px: 'pkf', nid: '1:2504', name: '자산정보현황 (층별)', fig: 'Widget/Asset Summary', w: 305, h: 512 },
    { px: 'pkf', nid: '1:2493', name: '사이드바', fig: 'Sidebar', w: 122, h: 695 },
    { px: 'pkd', nid: '1:2423', name: '자산리스트', fig: 'Widget/Asset List', w: 305, h: 521 },
    /* 이름 뒤 (KDB) 는 **다른 시안 등록물과 겹쳐서** 붙였다 — 아래 '이름 겹침' 검사가 잡아 준다
       (HANA 상면관리에도 '자산 상세 팝업'이, 한진 통합관제에도 '이벤트 표'가 있다) */
    { px: 'pkd', nid: '1:2486', name: '자산 상세 팝업 (KDB)', fig: 'Popup/Asset Detail', w: 557, h: 282 },
    /* SOP — STEP 1·2·3 의 단계 목록은 같은 목록의 진행 상태만 다르다 → STEP 1 것만 올린다 */
    { px: 'pks1', nid: '1:9709', name: '대응 절차 목록', fig: 'Step List < Dialog/SOP', w: 789, h: 537 },
    { px: 'pks1', nid: '1:9723', name: 'SOP 머리글', fig: 'Content < Header < Dialog/SOP', w: 719, h: 135 },
    { px: 'pks4', nid: '1:9465', name: '상황인지 전파 체계도', fig: 'Flow Diagram', w: 694, h: 194 },
    { px: 'pks4', nid: '1:9521', name: '조치 진행 단계', fig: 'Process Flow', w: 739, h: 134 },
    { px: 'pks4', nid: '1:9568', name: '연락처 표', fig: 'Contact Table', w: 794, h: 211 },
  ],

  /* 이벤트 패널 탭 — 이벤트 현황 판과 그 안에서 따로 꺼내 쓸 수 있는 덩어리 */
  events: [
    { px: 'pkm', nid: '1:1926', name: '이벤트 현황', fig: 'Event Panel/Default', w: 1920, h: 267 },
    { px: 'pkm', nid: '1:1949', name: '이벤트 표 (KDB)', fig: 'Table < Event Panel/Default', w: 1760, h: 186 },
    { px: 'pko', nid: '40:11527', name: '이벤트 리스트', fig: 'Popup/Event List', w: 440, h: 227 },
  ],

  /* 그 자체로 뜻이 서는 덩어리 — 표 행·배지·칩·타일·필드·노드 */
  symbols: [
    /* 이벤트 현황 */
    { px: 'pkm', nid: '1:1950', name: '이벤트 표 머리글', fig: 'Header Row < Table', w: 1758, h: 24 },
    { px: 'pkm', nid: '1:1974', name: '이벤트 표 행', fig: 'Row < Rows < Table', w: 1760, h: 32 },
    { px: 'pkm', nid: '1:737', name: 'Critical 등급 배지', fig: 'status-critical < Td/Severity', w: 78, h: 22 },
    { px: 'pkm', nid: '1:747', name: 'Major 등급 배지', fig: 'status-major < Td/Severity', w: 78, h: 22 },
    { px: 'pkm', nid: '1:757', name: 'Minor 등급 배지', fig: 'status-minor < Td/Severity', w: 78, h: 22 },
    { px: 'pkm', nid: '1:767', name: 'Warning 등급 배지', fig: 'status-warning < Td/Severity', w: 78, h: 22 },
    { px: 'pkm', nid: '1:777', name: 'Normal 등급 배지', fig: 'status-normal < Td/Severity', w: 78, h: 22 },
    { px: 'pkm', nid: '1:1943', name: 'Ack 단추', fig: 'Button/Ack', w: 57, h: 24 },
    { px: 'pkm', nid: '1:1944', name: 'Critical 건수 칩', fig: 'Count/Critical', w: 100, h: 25 },
    { px: 'pkm', nid: '1:1945', name: 'Major 건수 칩', fig: 'Count/Major', w: 100, h: 25 },
    { px: 'pkm', nid: '1:1946', name: 'Minor 건수 칩', fig: 'Count/Minor', w: 100, h: 25 },
    { px: 'pkm', nid: '1:1947', name: 'Warning 건수 칩', fig: 'Count/Warning', w: 100, h: 25 },
    { px: 'pkm', nid: '1:1948', name: 'Normal 건수 칩', fig: 'Count/Normal', w: 100, h: 25 },
    { px: 'pkm', nid: '15:8971', name: 'Auto 토글', fig: 'Button/Auto < Auto Toggle', w: 68, h: 22 },
    /* 화면 크롬 */
    { px: 'pkm', nid: '31:10086', name: '내비게이션 바', fig: 'Nav Bar', w: 94, h: 56 },
    { px: 'pkm', nid: '31:10074', name: '내비 타일 (선택)', fig: 'Nav Item/Overview (Selected)', w: 40, h: 56 },
    { px: 'pkm', nid: '31:10033', name: '내비 타일', fig: 'Nav Item < Nav Bar', w: 40, h: 56 },
    { px: 'pkm', nid: '17:13934', name: '브레드크럼', fig: 'Breadcrumb', w: 1920, h: 33 },
    { px: 'pkm', nid: '1:3070', name: '헤더 툴바', fig: 'Toolbar < Header', w: 799, h: 34 },
    { px: 'pkm', nid: '10:9487', name: '헤더 메뉴', fig: 'Menu < Toolbar', w: 512, h: 34 },
    { px: 'pkm', nid: '10:9492', name: '메뉴 항목', fig: 'Menu Item/Operations', w: 109, h: 34 },
    { px: 'pkm', nid: '2:16766', name: '로고', fig: 'Logo < Header', w: 119, h: 23 },
    { px: 'pkm', nid: '1:1748', name: '건물 라벨', fig: 'Building Label', w: 92, h: 19 },
    { px: 'pkm', nid: '17:9461', name: '층 항목', fig: 'Floor Item < Group/Main Building', w: 93, h: 21 },
    /* 종합현황 팝업 */
    { px: 'pko', nid: 'I40:11526;17:13500', name: '종합현황 표 행', fig: 'Row < Rows < Popup/Overview', w: 499, h: 44 },
    { px: 'pko', nid: 'I40:11526;17:13502', name: '설비 상태 묶음', fig: 'Status Group < Row', w: 326, h: 32 },
    { px: 'pko', nid: 'I40:11526;17:13503', name: 'CCTV 상태 칸', fig: 'Status/CCTV < Status Group', w: 32, h: 32 },
    { px: 'pko', nid: 'I40:11526;17:13504', name: '출입 상태 칸', fig: 'Status/Access < Status Group', w: 32, h: 32 },
    { px: 'pko', nid: 'I40:11526;17:13505', name: '소방 상태 칸', fig: 'Status/Fire < Status Group', w: 32, h: 32 },
    { px: 'pko', nid: 'I40:11526;17:13506', name: '도청 상태 칸', fig: 'Status/Wiretap < Status Group', w: 32, h: 32 },
    { px: 'pko', nid: 'I40:11526;17:13609', name: '건물 선택', fig: 'Building Selector < Popup/Overview', w: 113, h: 34 },
    { px: 'pko', nid: '40:11541', name: '이벤트 리스트 항목', fig: 'Item < List < Popup/Event List', w: 385, h: 31 },
    /* 출입동선 */
    { px: 'pkr', nid: '1:2628', name: '출입동선 필터', fig: 'Filters < Toolbar', w: 233, h: 26 },
    { px: 'pkr', nid: '1:2629', name: '날짜 칸', fig: 'Date Field < Filters', w: 93, h: 19 },
    { px: 'pkr', nid: '1:2644', name: '출입동선 범례', fig: 'Legend < Filters', w: 120, h: 26 },
    { px: 'pkr', nid: '1:2649', name: '비인가 범례 항목', fig: 'Item/Unauthorized < Legend', w: 44, h: 13 },
    { px: 'pkr', nid: '1:2652', name: '일반 범례 항목', fig: 'Item/General < Legend', w: 35, h: 13 },
    { px: 'pkr', nid: '1:2656', name: '검색 단추', fig: 'Button/Search < Actions', w: 30, h: 18 },
    { px: 'pkr', nid: '1:2663', name: '인물 단추', fig: 'Button/Person < Actions', w: 30, h: 18 },
    { px: 'pkr', nid: '1:2685', name: '출입동선 표 행 (선택)', fig: 'Row (Selected) < Rows', w: 521, h: 28 },
    { px: 'pkr', nid: '1:2609', name: '출입동선 도면', fig: 'Floor Plan < Stage', w: 1410, h: 330 },
    /* 전체층 */
    { px: 'pkf', nid: '1:2497', name: '층 선택', fig: 'Floor Selector < Sidebar', w: 121, h: 617 },
    { px: 'pkf', nid: '1:2491', name: '전체층 도면', fig: 'Floor Plan < Stage', w: 1410, h: 330 },
    { px: 'pkf', nid: '1:2513', name: '자산정보현황 행', fig: 'Row < Body < Widget/Asset Summary', w: 285, h: 26 },
    /* 단층 */
    { px: 'pkd', nid: '1:2404', name: '단층 도면', fig: 'Floor Plan < Stage', w: 1659, h: 388 },
    { px: 'pkd', nid: '1:2417', name: '자산 분류 바', fig: 'Category Bar', w: 187, h: 58 },
    { px: 'pkd', nid: '1:927', name: 'CCTV 분류 타일', fig: 'item-cctv_off < Category Bar', w: 39, h: 57 },
    { px: 'pkd', nid: '1:941', name: '출입 분류 타일', fig: 'item-enter_off < Category Bar', w: 39, h: 57 },
    { px: 'pkd', nid: '1:953', name: '소방 분류 타일', fig: 'item-fire_off < Category Bar', w: 39, h: 57 },
    { px: 'pkd', nid: '1:968', name: '도청 분류 타일', fig: 'item-wiretpping_off < Category Bar', w: 39, h: 57 },
    { px: 'pkd', nid: '1:2426', name: '자산 검색 칸', fig: 'Search Field < Header', w: 286, h: 32 },
    { px: 'pkd', nid: '1:2433', name: '자산 분류 항목', fig: 'Category/CCTV < Body', w: 286, h: 26 },
    { px: 'pkd', nid: '1:2441', name: '자산 분류 항목 (펼침)', fig: 'Category/Fire Sensor (Expanded)', w: 286, h: 417 },
    { px: 'pkd', nid: '1:2450', name: '자산 항목 (선택)', fig: 'Item (Selected) < Category/Fire Sensor', w: 286, h: 21 },
    /* SOP */
    { px: 'pks1', nid: '1:9934', name: '구역 제목', fig: 'Section Title < Dialog/SOP', w: 794, h: 43 },
    { px: 'pks1', nid: '1:10107', name: '대응 절차 단계', fig: 'Step < Step List', w: 789, h: 127 },
    { px: 'pks1', nid: '1:10129', name: '대응 절차 단계 카드', fig: 'Card < Body < Step', w: 656, h: 127 },
    { px: 'pks1', nid: '1:10446', name: '조치사항 칩', fig: 'Chip < Card', w: 100, h: 26 },
    { px: 'pks1', nid: '1:9736', name: '상황정보 필드', fig: 'Field/Situation Info < Info', w: 719, h: 33 },
    { px: 'pks1', nid: '1:9748', name: '발생일시 필드', fig: 'Field/Time < Info', w: 393, h: 33 },
    { px: 'pks1', nid: '1:9759', name: '경과시간 필드', fig: 'Field/Elapsed Time < Info', w: 326, h: 33 },
    { px: 'pks1', nid: '1:10012', name: 'SOP 가동중 표시', fig: 'SOP Status < Title Row', w: 120, h: 53 },
    { px: 'pks1', nid: '1:9715', name: 'SOP 탭 바', fig: 'Tab Bar < Dialog/SOP', w: 55, h: 121 },
    { px: 'pks1', nid: '1:9717', name: '체계도 탭', fig: 'Tab/Diagram < Tab Bar', w: 55, h: 55 },
    /* 바닥글(Footer 794x35)째로는 올리지 않는다 — 오른쪽 끝 단추 하나뿐이라 썸네일이 빈 칸으로 보인다 */
    { px: 'pks1', nid: '1:10440', name: '상황종료 단추', fig: 'Button/End < Footer < Dialog/SOP', w: 109, h: 34 },
    { px: 'pks4', nid: '1:9467', name: '체계도 노드', fig: 'Flow Node < Canvas', w: 156, h: 31 },
    { px: 'pks4', nid: '1:9516', name: '체계도 범례', fig: 'Legend < Flow Diagram', w: 134, h: 15 },
    { px: 'pks4', nid: '1:9523', name: '조치 단계 카드', fig: 'Process Step/5 < Process Flow', w: 88, h: 133 },
    { px: 'pks4', nid: '1:9524', name: '조치 단계 노드', fig: 'Process Node < Process Step/5', w: 88, h: 88 },
  ],
};

/* 아이콘 — 화면이 쓰는 원본 파일이 이미 최소 단위다(다시 그리지 않고 경로만 참조).
   파일 뿌리가 fill="none" 이라 배경이 없다 → 썸네일도 그대로 투명하다.
   **아이콘 탭은 이름이 '…아이콘'인 것만 올린다**(js/studio/layout-editor.js 의 isIconNamed).
   숫자만 붙은 파일(icon-3.svg …)은 **어느 레이어 밑에 쓰이는지 확인하고** 이름을 붙였다:
       node src/posco-assets/_gen/where.js '^icon'
   같은 그림의 상태 변형(색만 다른 것)은 **한 벌만** 올린다. */
const ICONS = [
  ['icon-nav-sop.svg', 'SOP 아이콘', 'Icon/Nav/SOP < Menu Item/SOP'],
  ['icon-nav-operations.svg', '운영현황 아이콘', 'Icon/Nav/Operations < Menu Item/Operations'],
  ['icon-nav-editor.svg', '에디터 아이콘', 'Icon/Nav/Editor < Menu Item/Editor'],
  ['icon-nav-admin.svg', '관리자 아이콘', 'Icon/Nav/Admin < Menu Item/Admin'],
  ['icon-nav-logout.svg', '로그아웃 아이콘', 'Icon/Nav/Logout < Menu Item/Logout'],
  ['icon-system-clock.svg', '시계 아이콘', 'Icon/System/Clock < Timestamp'],
  ['icon-nav.svg', '종합현황 아이콘', 'Glyph < Icon Box < Nav Item/Overview'],
  ['icon-action-search.svg', '검색 아이콘', 'Icon/Action/Search < Button/Search'],
  ['icon-action-person.svg', '인물 아이콘', 'Icon/Action/Person < Button/Person'],
  ['icon-action-calendar.svg', '달력 아이콘', 'Icon/Action/Calendar < Date Field'],
  ['icon-action-cctv.svg', 'CCTV 보기 아이콘', 'Icon/Action/CCTV < Td/CCTV'],
  ['icon-action-chevron.svg', '펼침 화살표 아이콘', 'Icon/Action/Chevron < Button/Dropdown'],
  ['icon-cctv.svg', 'CCTV 설비 아이콘', 'icon-cctv < item-cctv_off'],
  ['icon-gate.svg', '출입 설비 아이콘', 'icon-gate < item-enter_off'],
  ['icon-fire.svg', '소방 설비 아이콘', 'icon-fire < item-fire_off'],
  ['icon-5-2.svg', 'CCTV 상태 아이콘', 'Icon/Nav < Status/CCTV'],
  ['icon-9.svg', '출입 상태 아이콘', 'Icon/Nav < Status/Access'],
  ['icon-7.svg', '소방 상태 아이콘', 'Icon/Nav < Status/Fire'],
  ['icon-10.svg', '도청 상태 아이콘', 'Icon/Nav < Status/Wiretap'],
  /* icon-13 은 팝업 제목 **뒤쪽**의 ✕ 다(자산 아이콘은 제목 앞의 popup-01-icon) — 그림을 보고 잡았다 */
  ['icon-13.svg', '팝업 닫기 아이콘', 'Icon < popup01-title < Popup/Asset Detail'],
  ['popup-01-icon.svg', '자산 상세 아이콘', 'popup01-icon < popup01-txt < Popup/Asset Detail'],
  ['icon-1.svg', '대응 절차 아이콘', 'Icon < Content < Section Title'],
  ['icon-14.svg', '단계 배지 아이콘', 'Icon < Content < Badge'],
  ['icon-2.svg', '조치사항 칩 아이콘', 'Icon < Content < Chip'],
  ['icon-7-2.svg', '체계도 탭 아이콘', 'Icon < Tab/Diagram'],
  ['icon-5.svg', '상황전파 아이콘', 'Icon < Icon Group < Process Step/1'],
  ['icon-4.svg', '상황보고 아이콘', 'Icon < Icon Group < Process Step/2-1'],
];

/* ── 잘라 보고 크기를 확인한다 ── */
const report = [];
const out = { charts: [], symbols: [], panels: [], events: [], icons: [] };
let miss = 0;

['charts', 'symbols', 'panels', 'events'].forEach((cat) => {
  ITEMS[cat].forEach((it) => {
    const html = sub(HTML[it.px], it.nid);
    if (!html) { console.error('  !! 못 찾음: ' + it.px + ' ' + it.nid + ' (' + it.name + ')'); miss++; return; }
    if (!it.w || !it.h) { console.error('  !! 크기 없음: ' + it.nid + ' (' + it.name + ') — measure.js 로 재 볼 것'); miss++; return; }
    out[cat].push({
      id: 'pk_' + it.px + '_' + it.nid.replace(/[:;]/g, '_'),
      name: it.name,
      fig: it.fig + ' (' + it.nid + ')',
      px: it.px,
      nid: it.nid,
      w: it.w,
      h: it.h,
    });
    report.push([cat, it.px, it.nid, it.w + 'x' + it.h, String(html.length), it.name]);
  });
});

/* 이름이 겹치면 라이브러리에서 무엇이 무엇인지 알 수 없다 — 탭 안에서 유일해야 한다 */
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
  const svg = fs.readFileSync(p, 'utf8');
  /* 뿌리 svg 에 fill="none" 이 있는지 — 배경이 깔려 있으면 썸네일이 투명하지 않다 */
  if (!/^<svg[^>]*fill="none"/.test(svg)) console.error('  ?? 배경이 있을 수 있음: ' + file);
  /* 정말 화면이 쓰는 파일인지 — 어느 화면에도 안 나오면 Figma 가 내보내기만 한 것이다 */
  if (!Object.keys(HTML).some((px) => HTML[px].indexOf('/' + file) >= 0)) {
    console.error('  !! 화면이 안 쓰는 파일: ' + file); miss++; return;
  }
  if (!/아이콘/.test(name)) { console.error('  !! 아이콘 탭 규칙 위반(이름에 \'아이콘\'이 없다): ' + name); miss++; return; }
  out.icons.push({ id: 'pk_' + file.replace(/\.svg$/, '').replace(/-/g, '_'), name: name, fig: fig, src: BASE + file });
});

/* ── 다른 시안 등록물과 이름이 겹치는지 ──
   라이브러리 한 탭에는 여러 시안이 함께 산다(한진·HANA·이천·SK하이닉스). 판·표처럼 덩치 있는 것이
   같은 이름으로 두 개 놓이면 어느 시안 것인지 알 수 없다 → 이쪽 이름에 (KDB) 를 붙인다.
   아이콘은 원래 일반명(검색·시계·로그아웃 …)이라 겹쳐도 그대로 둔다 — 기존 시안끼리도 이미 겹친다. */
(function crossCheck() {
  const TAB = { charts: 'chart', symbols: 'symbol', icons: 'icon', panels: 'panel', events: 'event' };
  const mine = {};
  Object.keys(TAB).forEach((k) => out[k].forEach((a) => { (mine[TAB[k]] = mine[TAB[k]] || {})[a.name] = 1; }));
  ['hanjin-assets.js', 'hana-assets.js', 'icheon-assets.js', 'skhynix-assets.js'].forEach((f) => {
    const p = path.join(ROOT, 'src', f);
    if (!fs.existsSync(p)) return;
    const w = {};
    try { new Function('window', fs.readFileSync(p, 'utf8'))(w); } catch (e) { return; }
    const A = w[Object.keys(w)[0]] || {};
    Object.keys(TAB).forEach((k) => (A[k] || []).forEach((a) => {
      const nm = String(a.name).split('/').pop().trim();     /* SK하이닉스는 'group/name' 꼴 */
      if (TAB[k] !== 'icon' && mine[TAB[k]] && mine[TAB[k]][nm]) {
        console.error('  ?? 이름 겹침: [' + TAB[k] + '] ' + nm + '  ← ' + f);
      }
    }));
  });
})();

/* ── CSS 는 담지 않는다 ──
   화면 시트는 이미 studio.html 이 <script>(src/posco-*.js)로 들고 있다(window.PKM_CSS 등).
   등록 목록에는 **어느 화면 시트가 필요한지만** 적고 라이브러리가 그때 붙인다
   (스튜디오가 시안을 얹을 때 쓰는 style#pkXX-style 과 같은 id 라 두 번 붙지 않는다).
   시트는 `.pkXX-root` 안으로 스코프돼 있어 라이브러리 밖으로 새지 않는다. */
const screens = {};
Object.keys(SCREEN).forEach((px) => {
  screens[px] = {
    build: 'build_' + px,
    css: px.toUpperCase() + '_CSS',
    light: px.toUpperCase() + '_LIGHT_CSS',
    title: SCREEN[px].title,
    base: BASE,
  };
});

const head =
  '/* 자동 생성물 — POSCO KDB CCTV 관제 화면(Figma dj0SONcO5BySCm7yDdZrNc)의 에셋 라이브러리 등록 목록.\n' +
  '   등록 단위는 컴포넌트다(부품은 넣지 않는다). 같은 그림이 여러 화면에 겹치면 한 번만 올린다.\n' +
  '   마크업도 CSS 도 복사해 두지 않는다 — 화면 빌더(build_pkXX)의 DOM 에서 노드 id 로 그때그때\n' +
  '   잘라 쓰고, 시트는 window.PKM_CSS 등 이미 로드된 것을 붙인다. 그래서 글자는 실제 텍스트 그대로고\n' +
  "   ('패널편집'으로 고칠 수 있다) 라이트 테마·'색 정하기'도 화면과 똑같이 따라온다.\n" +
  '   생성기: src/posco-assets/_gen/mk-assets.js — 손으로 고치지 말고 다시 돌릴 것. */\n';

const js = head + 'window.__POSCO_ASSETS = ' + JSON.stringify({
  base: BASE,
  screens: screens,
  charts: out.charts,
  symbols: out.symbols,
  icons: out.icons,
  panels: out.panels,
  events: out.events,
}, null, 1) + ';\n';

fs.writeFileSync(OUT, js, 'utf8');

const kb = (n) => (n / 1024).toFixed(1) + 'KB';
console.log('등록: 차트 ' + out.charts.length + ' · 심볼 ' + out.symbols.length + ' · 아이콘 ' + out.icons.length +
  ' · 패널 ' + out.panels.length + ' · 이벤트 패널 ' + out.events.length +
  ' = ' + (out.charts.length + out.symbols.length + out.icons.length + out.panels.length + out.events.length) +
  (miss ? '  (실패 ' + miss + ')' : ''));
console.log('파일: src/posco-assets.js ' + kb(js.length) + ' (마크업·CSS 를 안 담아 목록만)');
if (process.argv[2] === '-v') {
  console.log('\ncat      px    node                 size        markup  name');
  report.forEach((r) => console.log(r[0].padEnd(8) + r[1].padEnd(6) + r[2].padEnd(21) + r[3].padEnd(12) + r[4].padStart(7) + '  ' + r[5]));
}
if (miss) process.exit(1);
