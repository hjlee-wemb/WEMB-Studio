/* STATCOM HMI 15화면(Figma lyDJkcOlrznLKWo7mD7C2n)의 에셋을
   스튜디오 '에셋 라이브러리' 등록 목록(src/statcom-assets.js)으로 만든다. 신한카드 · 공장 전력설비 생성기와 같은 규칙이다.

   · 등록 단위는 컴포넌트 — 그 자체로 뜻이 서는 덩어리만 올린다. 글자 한 줄 · 바탕 조각 같은 부품은 안 올린다.
   · 같은 그림이 여러 화면에 겹치면 한 번만 올린다(헤더 · 사이드 메뉴 · 미니맵은 열 화면에 다 있다).
   · 마크업도 CSS 도 복사하지 않는다 — 라이브러리가 build_tcX 의 DOM 에서 노드 id 로 잘라 쓴다.
     글자는 실제 텍스트라 패널편집 · 다크/라이트 · 색 정하기가 썸네일까지 따라온다.
     라이트 규칙은 전부 화면 시트(TCX_LIGHT_CSS)에 있어 라이브 층에서 옮겨 올 것이 없다.
   · 이름은 화면에 찍힌 한글을 그대로 쓴다. '(STATCOM)' 은 다른 시안 등록물과 이름이 겹칠 때만 붙인다.
     파일 이름의 고객사 이름은 쓰지 않는다.
   · w · h 는 브라우저에서 잰 값(sizes.json, measure.js)이다.

   사용법: node src/statcom-assets/_gen/mk-assets.js */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const OUT = path.join(ROOT, 'src', 'statcom-assets.js');
const BASE = 'src/statcom/';

const SCREEN = {
  tcm: { out: 'main', title: '메인 화면' },
  tcs: { out: 'statcom', title: 'STATCOM' },
  tcp: { out: 'power', title: '전력설비' },
  tcv: { out: 'valve', title: 'VSC 밸브실' },
  tcc: { out: 'cooling', title: 'VSC 냉각실' },
  tce: { out: 'supply', title: '전원 설비' },
  tcn: { out: 'safety', title: '제어 안전' },
  tcu: { out: 'simulation', title: '시뮬레이션' },
  tca: { out: 'alarm', title: '알람 메세지' },
  tcq: { out: 'cards', title: '설비 요약 정보' },
  tvt: { out: 'vr-topic', title: 'VR 교육 주제 선택' },
  tvo: { out: 'vr-overview', title: 'VR 교육 개요' },
  tvs: { out: 'vr-step', title: 'VR 교육 단계 안내' },
  tvm: { out: 'vr-menu', title: 'VR 교육 메뉴' },
  tcl: { out: 'login', title: '로그인' },
};

global.window = {};
Object.keys(SCREEN).forEach((px) => require(path.join(ROOT, 'src', 'statcom-' + SCREEN[px].out + '.js')));
const W = global.window;
const HTML = {};
Object.keys(SCREEN).forEach((px) => { HTML[px] = W['build_' + px](BASE); });
const hasNode = (px, nid) => HTML[px].indexOf('data-node-id="' + nid + '"') >= 0;

const ITEMS = {
  charts: [
    { px: 'tcq', nid: 'I1:561;278:20275', name: '설비 스파크라인 차트', fig: 'Sparkline < Row/2 < Equipment Card/STATCOM' },
    { px: 'tcs', nid: 'I1:193;1:666', name: '운전점 미터', fig: 'Meter < Widget/Operating Point' },
  ],

  /* 위젯 · 창 · 설비 카드 통째로 */
  panels: [
    /* 공통 */
    { px: 'tcm', nid: '1:419', name: '헤더 (STATCOM)', fig: 'Header' },
    { px: 'tcm', nid: 'I1:317;1:640', name: '사이드 메뉴 (STATCOM)', fig: 'Side Bar' },
    { px: 'tcs', nid: '1:192', name: '미니맵 패널', fig: 'Minimap' },
    /* STATCOM */
    { px: 'tcs', nid: 'I1:193;1:648', name: '운전모드', fig: 'Widget/Operation Mode' },
    { px: 'tcs', nid: 'I1:193;1:661', name: '운전점', fig: 'Widget/Operating Point' },
    { px: 'tcs', nid: 'I1:193;1:696', name: '연계모선전압', fig: 'Widget/Bus Voltage' },
    { px: 'tcs', nid: 'I1:193;1:724', name: '상별 전류', fig: 'Widget/Phase Current' },
    /* 전력설비 */
    { px: 'tcp', nid: 'I1:275;1:750', name: '변압기 주요 상태', fig: 'Widget/Transformer Status' },
    { px: 'tcp', nid: 'I1:275;1:767', name: '변압기 온도 / 전원 상태', fig: 'Widget/Temperature Power Status' },
    { px: 'tcp', nid: 'I1:275;1:799', name: '리액터 스위치 상태', fig: 'Widget/Reactor Switch Status' },
    /* VSC 밸브실 */
    { px: 'tcv', nid: 'I1:270;1:831', name: '밸브실 환경', fig: 'Widget/Valve Room Environment' },
    { px: 'tcv', nid: 'I1:270;1:850', name: '개별 서브모듈 상태', fig: 'Widget/Submodule Status' },
    { px: 'tcv', nid: 'I1:270;1:1327', name: 'Trip/ Alarm/ Bypass 현황', fig: 'Widget/Trip Alarm Bypass Status' },
    /* VSC 냉각실 */
    { px: 'tcc', nid: 'I1:285;1:1358', name: '냉각실 주요 계측', fig: 'Widget/Cooling Room Readings' },
    { px: 'tcc', nid: 'I1:285;1:1382', name: '냉각기 PUMP 상태', fig: 'Widget/Cooler Pump Status' },
    { px: 'tcc', nid: 'I1:285;1:1405', name: '냉각기 상태', fig: 'Widget/Cooler Status' },
    { px: 'tcc', nid: 'I1:285;1:1443', name: '팽창탱크', fig: 'Widget/Expansion Tank' },
    { px: 'tcc', nid: 'I1:285;1:1451', name: '밸브 상태', fig: 'Widget/Valve Status' },
    /* 전원 설비 */
    { px: 'tce', nid: 'I1:290;1:1465', name: '소내변압기', fig: 'Widget/House Transformer' },
    { px: 'tce', nid: 'I1:290;1:1485', name: 'AC 전원실', fig: 'Widget/AC Power Room' },
    { px: 'tce', nid: 'I1:290;1:1512', name: 'DC 전원실', fig: 'Widget/DC Power Room' },
    { px: 'tce', nid: 'I1:290;1:1533', name: '배터리실', fig: 'Widget/Battery Room' },
    /* 제어 안전 */
    { px: 'tcn', nid: 'I1:297;1:1548', name: '제어기 상태 요약', fig: 'Widget/Controller Status' },
    { px: 'tcn', nid: 'I1:297;1:1578', name: '제어 보드 상태', fig: 'Widget/Control Board Status' },
    { px: 'tcn', nid: 'I1:297;1:1594', name: '제어실 / 소화가스실 / 제어동', fig: 'Widget/Room Safety' },
    /* 시뮬레이션 */
    { px: 'tcu', nid: 'I1:306;1:1775', name: '3D 공정 애니메이션', fig: 'Widget/3D Process Animation' },
    { px: 'tcu', nid: 'I1:306;1:1836', name: '애니메이션 제어', fig: 'Widget/Animation Control' },
    { px: 'tcu', nid: 'I1:306;1:1871', name: '재생옵션', fig: 'Widget/Playback Options' },
    { px: 'tcu', nid: 'I1:306;1:1894', name: '현재 단계 정보', fig: 'Widget/Current Step Info' },
    /* 설비 요약 정보 카드 */
    { px: 'tcq', nid: '1:561', name: 'STATCOM 설비 카드', fig: 'Equipment Card/STATCOM' },
    { px: 'tcq', nid: '1:562', name: '냉각 시스템 설비 카드', fig: 'Equipment Card/Cooling System' },
    { px: 'tcq', nid: '1:563', name: 'MMC 밸브 설비 카드', fig: 'Equipment Card/MMC Valve' },
    { px: 'tcq', nid: '1:564', name: '제어반 설비 카드', fig: 'Equipment Card/Control Panel' },
    { px: 'tcq', nid: '1:565', name: '변압기 설비 카드', fig: 'Equipment Card/Transformer' },
    { px: 'tcq', nid: '1:566', name: 'DC 시스템 설비 카드', fig: 'Equipment Card/DC System' },
    { px: 'tcq', nid: '1:567', name: 'AC 필터 설비 카드', fig: 'Equipment Card/AC Filter' },
    { px: 'tcq', nid: '1:568', name: '보호 시스템 설비 카드', fig: 'Equipment Card/Protection System' },
    /* VR 교육 · 로그인 */
    { px: 'tvt', nid: '1:4860', name: 'VR 교육 주제 선택 창', fig: 'Popup/VR Training - Topic Select' },
    { px: 'tvo', nid: '1:4945', name: 'VR 교육 개요 창', fig: 'Popup/VR Training - Overview' },
    { px: 'tvs', nid: '1:4918', name: 'VR 교육 단계 안내 창', fig: 'Popup/VR Training - Step Guide' },
    { px: 'tvm', nid: '1:4879', name: 'VR 교육 메뉴 창', fig: 'Popup/VR Training - Menu' },
    { px: 'tcl', nid: '1:428', name: '로그인 폼', fig: 'Login Form' },
  ],

  events: [
    { px: 'tca', nid: 'I1:312;1:1631', name: '알림 메세지', fig: 'Widget/Alarm Message' },
    { px: 'tca', nid: 'I1:312;1:1651', name: '알림 메세지 항목', fig: 'Message Item/1' },
  ],

  symbols: [
    /* 헤더 · 메뉴 · 미니맵 */
    { px: 'tcm', nid: 'I1:419;58:5275', name: '날짜 · 시계 (STATCOM)', fig: 'Timestamp < Header' },
    { px: 'tcm', nid: 'I1:419;58:5278', name: '헤더 동작 단추 묶음', fig: 'Actions < Header' },
    { px: 'tcm', nid: 'I1:317;1:640;89:12906', name: '사이드 메뉴 항목', fig: 'Nav Item/Power Equipment' },
    { px: 'tcp', nid: 'I1:275;1:748;89:12906', name: '사이드 메뉴 항목 (선택)', fig: 'Nav Item (Selected) < Side Bar' },
    { px: 'tcm', nid: '1:420', name: '미니맵 탭', fig: 'Minimap (Closed)' },
    /* STATCOM */
    { px: 'tcs', nid: 'I1:193;1:652', name: '운전모드 항목 (선택)', fig: 'Option/Vac Control (Active)' },
    { px: 'tcs', nid: 'I1:193;1:655', name: '운전모드 항목', fig: 'Option/Q Mode Control' },
    { px: 'tcs', nid: 'I1:193;1:673', name: '유효 · 무효전력 지표 묶음', fig: 'Metric Row' },
    { px: 'tcs', nid: 'I1:193;1:674', name: '유효전력 지표', fig: 'Metric/Active Power' },
    { px: 'tcs', nid: 'I1:193;1:699', name: '대표 전압 지표', fig: 'Metric/Representative Voltage' },
    { px: 'tcs', nid: 'I1:193;1:706', name: '상별 전압 묶음', fig: 'Phase Voltage' },
    { px: 'tcs', nid: 'I1:193;1:728', name: '상별 전류 지표', fig: 'Metric/Phase A' },
    /* 전력설비 */
    { px: 'tcp', nid: 'I1:275;1:754', name: '변압기 운전 지표', fig: 'Metric/Transformer Operation' },
    { px: 'tcp', nid: 'I1:275;1:762', name: '권선온도 지표', fig: 'Metric/Winding Temperature' },
    { px: 'tcp', nid: 'I1:275;1:785', name: '냉각팬 · 가스검출 목록', fig: 'List < Card < Widget/Temperature Power Status' },
    { px: 'tcp', nid: 'I1:275;1:803', name: '리액터 지표 (ON)', fig: 'Metric/Reactor 1' },
    { px: 'tcp', nid: 'I1:275;1:811', name: '리액터 지표 (OFF)', fig: 'Metric/Reactor 3' },
    /* VSC 밸브실 */
    { px: 'tcv', nid: '1:198', name: '모듈 hover 카드 (정상)', fig: 'Hover Card (Normal)' },
    { px: 'tcv', nid: '1:233', name: '모듈 hover 카드 (에러)', fig: 'Hover Card (Error)' },
    { px: 'tcv', nid: 'I1:270;1:854', name: '밸브 서브모듈 지도', fig: 'Valve/A' },
    { px: 'tcv', nid: 'I1:270;1:1296', name: '서브모듈 범례', fig: 'Legend < Widget/Submodule Status' },
    { px: 'tcv', nid: 'I1:270;1:1331', name: 'SM Trip 지표', fig: 'Metric/SM Trip' },
    { px: 'tcv', nid: 'I1:270;1:835', name: '부스 온도 지표', fig: 'Metric/Booth Temperature' },
    /* VSC 냉각실 */
    { px: 'tcc', nid: 'I1:285;1:1385', name: '냉각기 PUMP 항목 (RUN)', fig: 'Pump/P1' },
    { px: 'tcc', nid: 'I1:285;1:1395', name: '냉각기 PUMP 항목 (STOP)', fig: 'Pump/P2' },
    { px: 'tcc', nid: 'I1:285;1:1408', name: '냉각기 항목', fig: 'Cooler/1' },
    { px: 'tcc', nid: 'I1:285;1:1445', name: '팽창 탱크 수위 지표', fig: 'Metric/Level' },
    { px: 'tcc', nid: 'I1:285;1:1453', name: '차단 밸브 지표', fig: 'Metric/V11 Shutoff Valve' },
    /* 전원 설비 · 제어 안전 */
    { px: 'tce', nid: 'I1:290;1:1469', name: '운전상태 지표', fig: 'Metric/Operation Status' },
    { px: 'tce', nid: 'I1:290;1:1535', name: '셀별 충전전압 평균 지표', fig: 'Metric/Average Cell Charge Voltage' },
    { px: 'tcn', nid: 'I1:297;1:1552', name: 'IED Live 지표', fig: 'Metric/IED Live' },
    /* 시뮬레이션 */
    { px: 'tcu', nid: 'I1:306;1:1780', name: '공정 단계 (대기)', fig: 'Process Step/Transport' },
    { px: 'tcu', nid: 'I1:306;1:1794', name: '공정 단계 (진행중)', fig: 'Process Step/Carry In (Active)' },
    { px: 'tcu', nid: 'I1:306;1:1839', name: '재생 조작 단추 묶음', fig: 'Toolbar < Widget/Animation Control' },
    { px: 'tcu', nid: 'I1:306;1:1848', name: '재생/일시정지 단추', fig: 'Control/Play Pause (Active)' },
    { px: 'tcu', nid: 'I1:306;1:1865', name: '재생 시간 막대', fig: 'Timeline < Widget/Animation Control' },
    { px: 'tcu', nid: 'I1:306;1:1874', name: '재생속도 선택', fig: 'Field/Playback Speed' },
    { px: 'tcu', nid: 'I1:306;1:1885', name: '카메라 뷰 선택', fig: 'Field/Camera View' },
    { px: 'tcu', nid: 'I1:306;1:1897', name: '단계 요약', fig: 'Step Summary' },
    { px: 'tcu', nid: 'I1:306;1:1915', name: 'STATCOM 모니터링 단추', fig: 'Button/STATCOM Monitoring' },
    /* 알람 메세지 */
    { px: 'tca', nid: 'I1:312;1:1634', name: '모두 확인 단추', fig: 'Button/Confirm All' },
    { px: 'tca', nid: 'I1:312;1:1637', name: '알림 탭', fig: 'Segmented Control < Tabs' },
    { px: 'tca', nid: 'I1:312;1:1653', name: '진행 배지', fig: 'Status Badge < Message Item/1' },
    /* 설비 요약 정보 카드 */
    { px: 'tcq', nid: 'I1:561;278:7623', name: '정상 칩', fig: 'Status Chip (Normal)' },
    { px: 'tcq', nid: 'I1:561;278:7640', name: '설비 카드 줄 (스파크라인)', fig: 'Row/2 < Equipment Card/STATCOM' },
    { px: 'tcq', nid: 'I1:561;278:7639', name: '설비 카드 줄', fig: 'Row/1 < Equipment Card/STATCOM' },
    /* VR 교육 */
    { px: 'tvt', nid: '1:4870', name: 'VR 교육 주제 단추', fig: 'Button/MMC Valve Submodule Replacement' },
    { px: 'tvo', nid: '1:4953', name: '전체 단계 지표', fig: 'Metric/Total Steps' },
    { px: 'tvo', nid: '1:4959', name: '조작 방법 카드', fig: 'Instruction Card < Popup/VR Training - Overview' },
    { px: 'tvo', nid: '1:4965', name: '교육시작 단추', fig: 'Button/Start Training' },
    { px: 'tvo', nid: '1:4972', name: '뒤로 단추', fig: 'Button/Back' },
    { px: 'tvs', nid: '1:4927', name: '교육 단계 표시', fig: 'Stepper' },
    { px: 'tvs', nid: '1:4937', name: '단계 안내 카드', fig: 'Instruction Card < Popup/VR Training - Step Guide' },
    { px: 'tvm', nid: '1:4888', name: 'VR 교육 메뉴 단추', fig: 'Button/Continue' },
    /* 로그인 */
    { px: 'tcl', nid: '1:429', name: '로그인 브랜드', fig: 'Login Brand' },
    { px: 'tcl', nid: '1:434', name: 'Id 입력칸', fig: 'Field/ID' },
    { px: 'tcl', nid: '1:441', name: 'Password 입력칸', fig: 'Field/Password' },
    { px: 'tcl', nid: '1:448', name: '아이디 저장 선택', fig: 'Option/Remember ID (Active)' },
    { px: 'tcl', nid: '1:453', name: 'SIGN UP 단추', fig: 'Button/Sign Up' },
  ],
};

/* 파일 하나 = 아이콘 하나. 이름에 '아이콘' 이 있어야 아이콘 탭에 뜬다(isIconNamed).
   VR 고글은 시안에 없어 새로 그린 것이라 화면 모듈이 아니라 라이브 층이 쓴다 → 사용 검사에서 뺀다 */
const LIVE_ONLY = /^icon-nav-vr-training\.svg$/;
const ICONS = [
  ['icon-nav-statcom.svg', 'STATCOM 메뉴 아이콘', 'Icon/Nav/STATCOM'],
  ['icon-nav-power-equipment.svg', '전력 설비 메뉴 아이콘', 'Icon/Nav/Power Equipment'],
  ['icon-nav-vsc-valve-room.svg', 'VSC 밸브실 메뉴 아이콘', 'Icon/Nav/VSC Valve Room'],
  ['icon-nav-vsc-cooling-room.svg', 'VSC 냉각실 메뉴 아이콘', 'Icon/Nav/VSC Cooling Room'],
  ['icon-nav-power-supply.svg', '전원 설비 메뉴 아이콘', 'Icon/Nav/Power Supply'],
  ['icon-nav-control-safety.svg', '제어 안전 메뉴 아이콘', 'Icon/Nav/Control Safety'],
  ['icon-nav-simulation.svg', '공정 영상 메뉴 아이콘', 'Icon/Nav/Simulation'],
  ['icon-nav-alarm-message.svg', '알림 메세지 메뉴 아이콘', 'Icon/Nav/Alarm Message'],
  ['icon-nav-vr-training.svg', 'VR 교육 메뉴 아이콘', 'Nav Item/VR Training (시안에 없어 새로 그림)'],
  ['icon.svg', '홈 아이콘', 'Icon < Button/Home'],
  ['icon-1.svg', '사용자 아이콘', 'Icon < Button/User'],
  ['icon-2.svg', '로그아웃 아이콘', 'Icon < Button/Logout'],
  ['icon-action-chevron-right.svg', '오른쪽 화살표 아이콘', 'Icon/Action/Chevron Right'],
  ['icon-action-close.svg', '닫기 아이콘', 'Icon/Action/Close'],
  ['icon-control-first.svg', '처음으로 아이콘', 'Control/First'],
  ['icon-control-previous.svg', '이전 아이콘', 'Control/Previous'],
  ['glyph.svg', '재생/일시정지 아이콘', 'Control/Play Pause (Active)'],
  ['icon-control-next.svg', '다음 아이콘', 'Control/Next'],
  ['glyph-1.svg', '반복 아이콘', 'Control/Repeat'],
  ['icon-input-user.svg', 'Id 입력 아이콘', 'Input Wrap < Field/ID'],
  ['icon-input-key.svg', 'Password 입력 아이콘', 'Input Wrap < Field/Password'],
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
    if (!z || !z.w || !z.h) { console.error('  !! 크기 없음: ' + it.px + ' ' + it.nid + ' (' + it.name + ')'); miss++; return; }
    const a = { id: 'sc_' + it.px + '_' + it.nid.replace(/[:;]/g, '_'), name: it.name, fig: it.fig + ' (' + it.nid + ')', px: it.px, nid: it.nid, w: z.w, h: z.h };
    if (z.group) { a.ox = z.ox; a.oy = z.oy; }
    /* 판 · 창은 라이브러리 기본(가로로 긴 것은 왼쪽부터 잘라 크게), 작은 부품은 통째로 — 단추는 글자가 가운데라 잘리면 빈 면만 보인다 */
    if (cat === 'symbols' || cat === 'charts') a.fit = 1;
    out[cat].push(a);
    report.push([cat, it.px, it.nid, z.w + 'x' + z.h + (z.group ? ' @' + z.ox + ',' + z.oy : ''), it.name]);
  });
});
ICONS.forEach(([file, name, fig]) => {
  if (!fs.existsSync(path.join(ROOT, BASE, file))) { console.error('  !! 파일 없음: ' + file); miss++; return; }
  if (!LIVE_ONLY.test(file) && !Object.keys(HTML).some((px) => HTML[px].indexOf('/' + file) >= 0)) { console.error('  !! 화면이 안 쓰는 파일: ' + file); miss++; return; }
  if (!/아이콘/.test(name)) { console.error('  !! 아이콘 탭 규칙 위반: ' + name); miss++; return; }
  out.icons.push({ id: 'sc_' + file.replace(/\.svg$/, '').replace(/-/g, '_'), name, fig, src: BASE + file });
});
/* 이름 중복 · 다른 시안과 겹침 */
CATS.forEach((cat) => {
  const seen = {};
  out[cat].forEach((a) => { if (seen[a.name]) { console.error('  !! 이름 중복: ' + a.name); miss++; } seen[a.name] = 1; });
});
['hanjin-assets.js', 'hana-assets.js', 'posco-assets.js', 'icheon-assets.js', 'skhynix-assets.js', 'shinhan-assets.js', 'plant-assets.js'].forEach((f) => {
  const p = path.join(ROOT, 'src', f);
  if (!fs.existsSync(p)) return;
  const w = {};
  try { new Function('window', fs.readFileSync(p, 'utf8'))(w); } catch (e) { return; }
  const A = w[Object.keys(w)[0]] || {};
  CATS.forEach((k) => (A[k] || []).forEach((a) => {
    const nm = String(a.name).split('/').pop().trim();
    if (out[k].some((x) => x.name === nm)) console.error('  ?? 이름 겹침: [' + k + '] ' + nm + '  ← ' + f);
  }));
});

const screens = {};
Object.keys(SCREEN).forEach((px) => {
  screens[px] = { build: 'build_' + px, css: px.toUpperCase() + '_CSS', light: px.toUpperCase() + '_LIGHT_CSS', rootClass: 'tc-asset', title: SCREEN[px].title, base: BASE };
});
const js = '/* 자동 생성물 — STATCOM HMI 15화면(Figma lyDJkcOlrznLKWo7mD7C2n)의 에셋 라이브러리 등록 목록.\n'
  + '   등록 단위는 컴포넌트다. 같은 그림이 여러 화면에 겹치면 한 번만 올린다.\n'
  + '   마크업도 CSS 도 복사해 두지 않는다 — build_tcX 의 DOM 에서 노드 id 로 잘라 쓴다.\n'
  + '   생성기: src/statcom-assets/_gen/mk-assets.js — 손으로 고치지 말고 다시 돌릴 것. */\n'
  + 'window.__STATCOM_ASSETS = ' + JSON.stringify({
    base: BASE, screens,
    charts: out.charts, symbols: out.symbols, icons: out.icons, panels: out.panels, events: out.events,
  }, null, 1) + ';\n';
if (!process.env.LIST_ONLY) fs.writeFileSync(OUT, js);
report.forEach((r) => console.log('  ' + r[0].padEnd(8) + r[1].padEnd(4) + r[2].padEnd(26) + r[3].padEnd(16) + r[4]));
console.log('\nsrc/statcom-assets.js — 차트 ' + out.charts.length + ' · 심볼 ' + out.symbols.length + ' · 아이콘 ' + out.icons.length + ' · 판 ' + out.panels.length + ' · 이벤트 ' + out.events.length + (miss ? '  (문제 ' + miss + '건)' : ''));
if (miss) process.exitCode = 1;
