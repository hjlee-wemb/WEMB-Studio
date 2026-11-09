/* 스마트 도면관리 19화면(Figma hfgGjtOuOsX3wdxk33ldyv)의 에셋을
   스튜디오 '에셋 라이브러리' 등록 목록(src/drawing-assets.js)으로 만든다. 신사업 관리 생성기와 같은 규칙이다.

   · 등록 단위는 컴포넌트 — 그 자체로 뜻이 서는 덩어리만 올린다. 같은 그림이 여러 화면에 겹치면 한 번만 올린다.
   · 마크업도 CSS 도 복사하지 않는다 — 라이브러리가 build_dwX 의 DOM 에서 노드 id 로 잘라 쓴다.
     글자는 실제 텍스트라 패널편집 · 다크/라이트 · 색 정하기가 썸네일까지 따라온다.
   · 썸네일 바탕은 무조건 투명 — 화면 바탕 · Dim 은 올리지 않고, 흰 판이 박힌 그림은 투명 사본(*-tp.png, mk-transparent.js)을 쓴다.
   · 이름은 화면 글자대로. 로고는 올리지 않는다(헤더 안의 로고는 스튜디오 로고로 바뀐다).
   · 차트 · 이벤트 탭은 비어 있다 — 이 시안에 없다. 패널편집 추천 차트는 라이브가 그때그때 그리는 것이라 노드가 아니다.
   · w · h 는 브라우저에서 잰 값(sizes.json, measure.js)이다.

   사용법: node src/drawing-assets/_gen/mk-assets.js */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const OUT = path.join(ROOT, 'src', 'drawing-assets.js');
const BASE = 'src/drawing/';

const SCREEN = {};
JSON.parse(fs.readFileSync(path.join(ROOT, BASE, '_gen', 'screens.json'), 'utf8')).forEach(([key, node, px, title, page]) => { SCREEN[px] = { out: page, title }; });

global.window = {};
Object.keys(SCREEN).forEach((px) => require(path.join(ROOT, 'src', 'drawing-' + SCREEN[px].out + '.js')));
const W = global.window;
const HTML = {};
Object.keys(SCREEN).forEach((px) => { HTML[px] = W['build_' + px](BASE); });
const hasNode = (px, nid) => HTML[px].indexOf('data-node-id="' + nid + '"') >= 0;

const ITEMS = {
  charts: [],
  events: [],
  panels: [
    /* 공통 */
    { px: 'dwm', nid: '1:198', name: '헤더 · 사용자 메뉴 (도면관리)', fig: 'Header', fit: 1 },
    { px: 'dwa', nid: '1:2549', name: '헤더 · eP&ID (도면관리)', fig: 'Header', fit: 1 },
    { px: 'dwn', nid: '1:292', name: '메뉴 드롭다운 (LNB)', fig: 'LNB' },
    { px: 'dwa', nid: '1:2537', name: '페이지 제목 줄 (도면관리)', fig: 'Page Header', fit: 1 },
    /* 메인 */
    { px: 'dwm', nid: '1:129', name: '나의 도면현황 패널', fig: 'Widget/My Drawings' },
    { px: 'dwm', nid: '1:119', name: '공지사항 패널', fig: 'Widget/Notice' },
    { px: 'dwm', nid: '1:108', name: 'Help Desk 패널', fig: 'Widget/Help Desk' },
    { px: 'dwp', nid: '1:493', name: '사업소변경 팝업', fig: 'Popup/Office Change' },
    /* 도면조회 */
    { px: 'dwa', nid: '1:2508', name: '계통 트리 패널', fig: 'Tree Panel' },
    { px: 'dwa', nid: '1:1892', name: '도면조회 검색 패널', fig: 'Search Panel' },
    { px: 'dwb', nid: '1:2552', name: '도면조회 상세검색 패널', fig: 'Search Panel' },
    { px: 'dwa', nid: '1:2006', name: '도면 목록 패널', fig: 'Result Panel' },
    { px: 'dwv', nid: '1:8443', name: '미리보기 파일 목록', fig: 'Preview Files' },
    { px: 'dwo', nid: '1:9853', name: '미리보기 팝업', fig: 'Popup/Preview' },
    /* 도면등록 · 수정 */
    { px: 'dwr', nid: '1:3122', name: '도면파일 섹션', fig: 'Section/Drawing File' },
    { px: 'dwr', nid: '1:3160', name: '도면 메타 정보 섹션', fig: 'Section/Drawing Meta' },
    { px: 'dwr', nid: '1:3195', name: '도면 등록 섹션', fig: 'Section/Drawing Register' },
    { px: 'dwe', nid: '1:2790', name: '설비 마스터 검색 팝업 본문', fig: 'Popup Body' },
    { px: 'dwh', nid: '1:2952', name: '도움말 팝업', fig: 'Popup/Help' },
    { px: 'dwi', nid: '1:3911', name: '도면정보 패널', fig: 'Panel/Drawing Info' },
    { px: 'dwi', nid: '1:3947', name: '체크인 파일 업로드 패널', fig: 'Panel/Check-in File Upload' },
    { px: 'dwi', nid: '1:3981', name: '체크인 목록 섹션', fig: 'Section/Check-in List' },
    /* CCTV */
    { px: 'dwc', nid: '1:3562', name: 'CCTV 목록', fig: 'Site List' },
    { px: 'dwc', nid: '1:3486', name: 'CCTV 화면', fig: 'CCTV View/Cheonghae Room 1' },
    /* Help Desk */
    { px: 'dwk', nid: '1:3741', name: 'Help Desk 검색 패널', fig: 'Filter Panel' },
    { px: 'dwk', nid: '1:3753', name: 'Help Desk 목록 패널', fig: 'Result Panel' },
    { px: 'dww', nid: '1:3664', name: 'Help Desk 작성 폼', fig: 'Form Section' },
    { px: 'dww', nid: '1:3694', name: '첨부파일 섹션', fig: 'Attachment Section' },
    { px: 'dwd', nid: '1:3600', name: 'Help Desk 게시글', fig: 'Article' },
    /* 통합검색 · 로그인 */
    { px: 'dwt', nid: '1:6532', name: '통합검색 창', fig: 'Search Overlay' },
    { px: 'dwu', nid: '1:6936', name: '통합검색 결과', fig: 'Result Box' },
    { px: 'dwl', nid: '1:76', name: '로그인 폼 (도면관리)', fig: 'Form' },   /* Login Card 는 빈 유리판이고 폼은 그 형제다 */
  ],
  symbols: [
    /* 결재 단계 */
    { px: 'dwm', nid: '1:130', name: '결재 단계 묶음', fig: 'Workflow' },
    { px: 'dwm', nid: '1:133', name: '등록 단계', fig: 'Step/Register' },
    { px: 'dwm', nid: '1:143', name: '체크인 단계', fig: 'Step/Check In' },
    { px: 'dwm', nid: '1:153', name: '회수 단계', fig: 'Step/Retrieve' },
    { px: 'dwm', nid: '1:163', name: '상신 단계', fig: 'Step/Submit' },
    { px: 'dwm', nid: '1:173', name: '승인 단계', fig: 'Step/Approve' },
    /* 목록 줄 */
    { px: 'dwm', nid: '1:190', name: '즐겨찾기 도면 줄 (선택)', fig: 'List Item/Drawing' },
    { px: 'dwm', nid: '1:191', name: '즐겨찾기 도면 줄', fig: 'List Item/Drawing' },
    { px: 'dwm', nid: '1:126', name: '공지 줄 (선택)', fig: 'List Item/Post' },
    { px: 'dwm', nid: '1:127', name: '공지 줄', fig: 'List Item/Post' },
    { px: 'dwm', nid: '1:542', name: '건수 배지', fig: 'Badge/Count' },
    /* 헤더 부품 */
    { px: 'dwm', nid: 'I1:198;1:620', name: '상단 메뉴 (도면관리)', fig: 'Menu' },
    { px: 'dwm', nid: 'I1:198;1:626', name: '검색창 (도면관리)', fig: 'Search Group' },
    { px: 'dwm', nid: 'I1:198;1:628', name: '사업소 선택', fig: 'Select/Office' },
    { px: 'dws', nid: '1:392', name: '사업소 선택 (펼침)', fig: 'Select/Office' },
    { px: 'dwm', nid: 'I1:198;1:629', name: '사용자 메뉴 (도면관리)', fig: 'User Menu' },
    { px: 'dwa', nid: '1:572', name: 'eP&ID 단추', fig: 'Button/eP&ID' },
    /* 단추 */
    { px: 'dwa', nid: '1:2003', name: '조회 단추 (도면관리)', fig: 'Button/Search' },
    { px: 'dwa', nid: '1:2004', name: '조건초기화 단추', fig: 'Button/Reset' },
    { px: 'dwa', nid: '1:1999', name: '상세검색 단추', fig: 'Button/Advanced Search' },
    { px: 'dwa', nid: '1:2008', name: '미리보기 단추', fig: 'Button/Preview' },
    { px: 'dwa', nid: '1:2009', name: '다운로드 단추', fig: 'Button/Download' },
    { px: 'dwa', nid: '1:2010', name: '수정요청 단추', fig: 'Button/Edit Request' },
    { px: 'dwa', nid: '1:2011', name: 'Check Out 단추', fig: 'Button/Check Out' },
    { px: 'dwa', nid: '1:2012', name: '폐기 단추', fig: 'Button/Dispose' },
    { px: 'dwa', nid: '1:9882', name: '도움말 단추', fig: 'Button/Help' },
    { px: 'dwa', nid: '1:4148', name: '입력칸 검색 단추', fig: 'Button/Input Small' },
    { px: 'dwr', nid: '1:3126', name: '일괄등록(엑셀) 단추', fig: 'Button/Bulk Register (Excel)' },
    { px: 'dwr', nid: '1:3127', name: '파일 선택 단추', fig: 'Button/Select File' },
    { px: 'dwr', nid: '1:3204', name: '등록 단추 (도면관리)', fig: 'Button/Register' },
    { px: 'dwr', nid: '1:3205', name: '임시저장 단추', fig: 'Button/Save Draft' },
    { px: 'dwi', nid: '1:3956', name: '도면파일 업로드 단추', fig: 'Button/Upload Drawing File' },
    { px: 'dwp', nid: '1:496', name: '변경 단추', fig: 'Button/Change' },
    { px: 'dwp', nid: '1:497', name: '닫기 단추 (도면관리)', fig: 'Button/Close' },
    { px: 'dwl', nid: '1:725', name: '로그인 단추 (도면관리)', fig: 'Button/Login' },
    /* 입력 */
    { px: 'dwa', nid: '33:3452', name: '코드 · 이름 검색 필드', fig: 'Field/System' },
    { px: 'dwa', nid: '33:3464', name: '입력 필드 (도면명)', fig: 'Field/Drawing Name' },
    { px: 'dwa', nid: '33:3482', name: '선택 필드 (도면종류)', fig: 'Field/Drawing Category' },
    { px: 'dwr', nid: '1:3164', name: '선택 필드 (도면유형)', fig: 'Field/Drawing Type' },
    { px: 'dwr', nid: '1:3170', name: '입력 필드 (도면번호)', fig: 'Field/Drawing No' },
    { px: 'dwe', nid: '1:2812', name: '라디오 필드 (And · Or)', fig: 'Field/And Or' },
    { px: 'dwl', nid: '1:77', name: '아이디 입력칸', fig: 'Field/ID' },
    { px: 'dwl', nid: '1:79', name: '비밀번호 입력칸', fig: 'Field/Password' },
    { px: 'dwl', nid: '1:82', name: '아이디 저장 체크', fig: 'Checkbox/Save ID' },
    { px: 'dwk', nid: '1:3744', name: '제목 선택', fig: 'Select/Title' },
    /* 표 */
    { px: 'dwa', nid: '1:2016', name: '도면 목록 머리줄', fig: 'Header Row' },
    { px: 'dwa', nid: '1:2037', name: '도면 목록 줄', fig: 'Row' },
    { px: 'dwe', nid: '1:2892', name: '설비 목록 머리줄', fig: 'Header Row' },
    { px: 'dwe', nid: '1:2913', name: '설비 목록 줄', fig: 'Table Row/Equipment' },
    { px: 'dwk', nid: '1:3756', name: 'Help Desk 목록 머리줄', fig: 'Header Row' },
    { px: 'dwk', nid: '1:3768', name: 'Help Desk 목록 줄 (공지)', fig: 'Row' },
    { px: 'dwk', nid: '1:3780', name: 'Help Desk 목록 줄', fig: 'Row' },
    { px: 'dwp', nid: '1:502', name: '사업소 목록 줄', fig: 'List Item/Office' },
    { px: 'dwa', nid: '1:2478', name: '페이지 이동 (도면관리)', fig: 'Pagination' },
    { px: 'dwe', nid: '1:3074', name: '페이지 크기 선택', fig: 'Pagination/Page Size' },
    /* 트리 · 경로 · 파일 */
    { px: 'dwa', nid: '1:2512', name: '트리 제목', fig: 'Tree Title' },
    { px: 'dwe', nid: '1:2856', name: '트리 탭', fig: 'Tabs' },
    { px: 'dwa', nid: '1:2541', name: '경로 표시 (도면관리)', fig: 'Breadcrumb' },
    { px: 'dwr', nid: '1:3129', name: '파일 끌어놓기 칸', fig: 'Drop Zone' },
    { px: 'dwr', nid: '1:3132', name: '도면파일 항목', fig: 'File Item' },
    { px: 'dwd', nid: '1:3615', name: '첨부파일 링크', fig: 'File Link' },
    { px: 'dwd', nid: '1:3624', name: '이전글 · 다음글 줄', fig: 'Post Link' },
    /* CCTV */
    { px: 'dwc', nid: '1:3563', name: 'CCTV 사업소 카드', fig: 'Card/Seorim' },
    { px: 'dwc', nid: '1:3564', name: 'CCTV 사업소 카드 (선택)', fig: 'Card/Cheonghae' },
    { px: 'dwc', nid: '1:3591', name: 'CCTV 도면실 항목', fig: 'List Item/CCTV Room' },
    { px: 'dwc', nid: '1:3495', name: '영상 조작 막대', fig: 'Control Icons' },
    { px: 'dwc', nid: '1:3503', name: 'CCTV 화면 이름표', fig: 'Caption' },
    /* 통합검색 */
    { px: 'dwt', nid: '1:6535', name: '통합검색 입력칸', fig: 'Search Input' },
    { px: 'dwt', nid: '1:6544', name: '추천 키워드 칩', fig: 'Chip/Drawing' },
    { px: 'dwu', nid: '1:6938', name: '결과 탭 (선택)', fig: 'Tab/All (Selected)' },
    { px: 'dwu', nid: '1:6941', name: '결과 탭', fig: 'Tab/Menu' },
    { px: 'dwu', nid: '1:6956', name: '검색 결과 항목', fig: 'Result Item' },
  ],
};

/* 파일 하나 = 아이콘 하나. 이름에 '아이콘' 이 있어야 아이콘 탭에 뜬다(isIconNamed).
   light: 어두운 무채색 그림 — 다크 칸에서는 라이브러리가 색을 뒤집어 보여 준다(figimg-light).
   tp: 흰 판이 박힌 그림의 투명 사본 — 화면이 쓰는 파일은 원본이고 라이브러리만 사본을 쓴다 */
const ICONS = [
  ['icon.svg', '등록 단계 아이콘', 'Icon < Step/Register'],
  ['icon-1.svg', '체크인 단계 아이콘', 'Icon < Step/Check In'],
  ['icon-2.svg', '회수 단계 아이콘', 'Icon < Step/Retrieve'],
  ['icon-3.svg', '상신 단계 아이콘', 'Icon < Step/Submit'],
  ['icon-4.svg', '승인 단계 아이콘', 'Icon < Step/Approve'],
  ['step-arrow.svg', '단계 화살표 아이콘', 'Step Arrow'],
  ['icon-epid-state-default.svg', 'eP&ID 아이콘', 'Icon=eP&ID, State=Default'],
  ['icon-office-state-default.svg', '사업소 아이콘', 'Icon=Office, State=Default'],
  ['icon-header-3.svg', '사업소 아이콘 (선택)', 'Icon/Header'],
  ['icon-setting-state-default.svg', '설정 아이콘 (도면관리)', 'Icon=Setting, State=Default'],
  ['glyph-1-2.svg', '사용자 아이콘 (도면관리)', 'Glyph < User Menu'],
  ['icon-8.svg', '입력칸 검색 아이콘', 'Icon < Button/Input Small'],
  ['required-mark.svg', '필수 표시 아이콘', 'Required Mark'],
  ['icon-button-1.svg', '드롭다운 삼각형 아이콘', 'Icon/Button'],
  ['icon-arrow-up.svg', '드롭다운 삼각형 아이콘 (선택)', 'Icon=Arrow Up'],
  ['state-default.svg', '북마크 아이콘', 'Bookmark State=Default', 1],
  ['state-bookmarked.svg', '북마크 아이콘 (선택)', 'Bookmark State=Bookmarked'],
  ['icon-2-5.svg', '처음 페이지 아이콘', 'Icon < Button/First', 1],
  ['icon-3-5.svg', '이전 페이지 아이콘', 'Icon < Button/Prev', 1],
  ['icon-4-5.svg', '다음 페이지 아이콘', 'Icon < Button/Next', 1],
  ['icon-5-4.svg', '마지막 페이지 아이콘', 'Icon < Button/Last', 1],
  ['icon-tree.svg', '트리 펼침 아이콘', 'Icon/Tree', 1],
  ['icon-tree-2.svg', '트리 접힘 아이콘', 'Icon/Tree', 1],
  ['icon-tree-1.svg', '폴더 아이콘', 'Icon/Tree', 1],
  ['icon-tree-4.svg', '파일 아이콘 (도면관리)', 'Icon/Tree', 1],
  ['icon-home.svg', '홈 아이콘 (도면관리)', 'Icon/Home'],
  ['icon-button.svg', '도움말 아이콘', 'Icon/Button', 1],
  ['icon-box.svg', '다운로드 아이콘', 'Icon Box'],
  ['icon-box-2.svg', '도면파일 아이콘', 'Icon Box'],
  ['icon-3-6.svg', '파일 끌어놓기 아이콘', 'Icon < Drop Zone'],
  ['glyph-2-3.svg', '첨부 문서 아이콘', 'Glyph', 1],
  ['icon-1-7.svg', '첨부 링크 아이콘', 'Icon < File Link'],
  ['icon-1-9.svg', '첨부파일 아이콘', 'Icon < Field/Attachment'],
  ['icon-14.svg', '첨부파일 아이콘 (선택)', 'Icon < Field/Attachment'],
  ['actions-2.svg', '항목 삭제 아이콘', 'State=Default < File Item'],
  ['actions-1.svg', '항목 삭제 아이콘 (호버)', 'State=Hover < File Item', 1],
  ['label.svg', '질문 아이콘', 'Label < Result Item'],
  ['icon-12.svg', 'CCTV 아이콘', 'Icon < Card/Seorim'],
  ['icon-1-8.svg', 'CCTV 아이콘 (선택)', 'Icon < Card/Cheonghae'],
  ['icon-check.svg', '체크 아이콘 (도면관리)', 'Icon/Check'],
  ['state-active.svg', '라디오 선택 아이콘', 'State=Active'],
  ['icon-image.png', 'Help Desk 일러스트 아이콘', 'Icon Image < Widget/Help Desk', 0, 'icon-image-tp.png'],
  ['icon-image-1.png', '공지사항 일러스트 아이콘', 'Icon Image < Widget/Notice', 0, 'icon-image-1-tp.png'],
  ['icon-image-2.png', '나의 도면현황 일러스트 아이콘', 'Icon Image < Widget/My Drawings'],
];

const sizePath = path.join(__dirname, 'sizes.json');
const SIZES = fs.existsSync(sizePath) ? JSON.parse(fs.readFileSync(sizePath, 'utf8')) : {};
/* measure.js 가 읽는 목록 */
const CATS = ['charts', 'panels', 'events', 'symbols'];
fs.writeFileSync(path.join(__dirname, 'nodes.json'), JSON.stringify(CATS.reduce((a, c) => a.concat(ITEMS[c].map((x) => ({ px: x.px, scene: SCREEN[x.px].out, nid: x.nid }))), [])));

const out = { charts: [], symbols: [], panels: [], events: [], icons: [] };
const report = [];
let miss = 0;
CATS.forEach((cat) => {
  ITEMS[cat].forEach((it) => {
    if (!hasNode(it.px, it.nid)) { console.error('  !! 못 찾음: ' + it.px + ' ' + it.nid + ' (' + it.name + ')'); miss++; return; }
    const z = SIZES[it.px + '|' + it.nid];
    if (process.env.LIST_ONLY) return;
    if (!z || !z.w || !z.h) { console.error('  !! 크기 없음: ' + it.px + ' ' + it.nid + ' (' + it.name + ')'); miss++; return; }
    const a = { id: 'dw_' + it.px + '_' + it.nid.replace(/[:;]/g, '_'), name: it.name, fig: it.fig + ' (' + it.nid + ')', px: it.px, nid: it.nid, w: z.w, h: z.h };
    if (z.group) { a.ox = z.ox; a.oy = z.oy; }
    /* 이 시안은 가로로 긴 판이 많다 — 왼쪽만 잘려 빈 면이 보이지 않게 전부 통째로 */
    a.fit = 1;
    out[cat].push(a);
    report.push([cat, it.px, it.nid, z.w + 'x' + z.h + (z.group ? ' @' + z.ox + ',' + z.oy : ''), it.name]);
  });
});
ICONS.forEach(([file, name, fig, light, tp]) => {
  const use = tp || file;
  if (!fs.existsSync(path.join(ROOT, BASE, use))) { console.error('  !! 파일 없음: ' + use); miss++; return; }
  if (!Object.keys(HTML).some((px) => HTML[px].indexOf('/' + file) >= 0)) { console.error('  !! 화면이 안 쓰는 파일: ' + file); miss++; return; }
  const a = { id: 'dw_' + file.replace(/\.(svg|png)$/, '').replace(/-/g, '_'), name, fig, src: BASE + use };
  if (light) a.light = 1;
  out.icons.push(a);
});
/* 이름 중복 · 다른 시안과 겹침 */
CATS.concat(['icons']).forEach((cat) => {
  const seen = {};
  out[cat].forEach((a) => { if (seen[a.name]) { console.error('  !! 이름 중복: ' + a.name); miss++; } seen[a.name] = 1; });
});
['hanjin-assets.js', 'hana-assets.js', 'posco-assets.js', 'icheon-assets.js', 'skhynix-assets.js', 'shinhan-assets.js', 'plant-assets.js', 'statcom-assets.js', 'newbiz-assets.js'].forEach((f) => {
  const p = path.join(ROOT, 'src', f);
  if (!fs.existsSync(p)) return;
  const w = {};
  try { new Function('window', fs.readFileSync(p, 'utf8'))(w); } catch (e) { return; }
  const A = w[Object.keys(w)[0]] || {};
  CATS.concat(['icons']).forEach((k) => (A[k] || []).forEach((a) => {
    const nm = String(a.name).split('/').pop().trim();
    if (out[k].some((x) => x.name === nm)) console.error('  ?? 이름 겹침: [' + k + '] ' + nm + '  ← ' + f);
  }));
});

const used = {};
CATS.forEach((c) => out[c].forEach((a) => { used[a.px] = 1; }));
const screens = {};
Object.keys(SCREEN).forEach((px) => {
  if (!used[px] && !process.env.LIST_ONLY) return;
  screens[px] = { build: 'build_' + px, css: px.toUpperCase() + '_CSS', light: px.toUpperCase() + '_LIGHT_CSS', rootClass: 'tc-asset dw-asset', title: SCREEN[px].title, base: BASE };
});
const js = '/* 자동 생성물 — 스마트 도면관리 19화면(Figma hfgGjtOuOsX3wdxk33ldyv)의 에셋 라이브러리 등록 목록.\n'
  + '   등록 단위는 컴포넌트다. 같은 그림이 여러 화면에 겹치면 한 번만 올린다.\n'
  + '   마크업도 CSS 도 복사해 두지 않는다 — build_dwX 의 DOM 에서 노드 id 로 잘라 쓴다.\n'
  + '   생성기: src/drawing-assets/_gen/mk-assets.js — 손으로 고치지 말고 다시 돌릴 것. */\n'
  + 'window.__DRAWING_ASSETS = ' + JSON.stringify({
    base: BASE, screens,
    charts: out.charts, symbols: out.symbols, icons: out.icons, panels: out.panels, events: out.events,
  }, null, 1) + ';\n';
if (!process.env.LIST_ONLY) fs.writeFileSync(OUT, js);
report.forEach((r) => console.log('  ' + r[0].padEnd(8) + r[1].padEnd(4) + r[2].padEnd(16) + r[3].padEnd(20) + r[4]));
console.log('\nsrc/drawing-assets.js — 차트 ' + out.charts.length + ' · 심볼 ' + out.symbols.length + ' · 아이콘 ' + out.icons.length + ' · 판 ' + out.panels.length + ' · 이벤트 ' + out.events.length + (miss ? '  (문제 ' + miss + ')' : ''));
if (miss) process.exitCode = 1;
