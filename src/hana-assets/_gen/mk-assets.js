/* HANA Bank H.I.T 14화면(Figma H3S2M7DUCvuJgi75oBqg6W)의 에셋을
   스튜디오 '에셋 라이브러리' 등록 목록(src/hana-assets.js)으로 만든다.

   ── 등록 단위는 '컴포넌트' 다 ──
   눈금선·막대 한 줄·배지 그림자 같은 **부품은 등록하지 않는다.** 꺼내 쓸 수 있는 최소 단위는
   위젯·차트·존·노드·칩처럼 그 자체로 뜻이 서는 덩어리다.
   같은 그림이 여러 화면에 겹쳐 나오면 **한 번만** 올린다(네트워크01/02, 보안01/02 등).

   ── 왜 Figma 내보내기가 아니라 화면 DOM 에서 뽑나 (한진과 같은 이유) ──
   재구축한 화면에는 같은 컴포넌트가 온전한 DOM 으로 들어 있고 글자가 **편집 가능한 실제 텍스트**다.
   그래서 라이브러리에서 꺼낸 뒤에도 '패널편집'으로 글자를 고칠 수 있고, 화면 테마(다크/라이트)와
   '색 정하기'가 썸네일까지 똑같이 따라온다. SVG 내보내기는 글자가 path 로 굳는다.

   그래서 이 파일은 **마크업도 CSS 도 복사해 두지 않는다.** 등록 목록에는 화면 접두어와 노드 id 만
   적고, 라이브러리가 window.build_hnXX 가 만든 DOM 에서 그때그때 잘라 쓴다.

   사용법:  node src/hana-assets/_gen/mk-assets.js
*/
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..');
const OUT = path.join(ROOT, 'src', 'hana-assets.js');
const GEN = path.join(ROOT, 'src', 'hana', '_gen');
const BASE = 'src/hana/';

/* px → 화면 모듈. 라이브러리는 `build_hnXX` 와 `HNXX_CSS` 전역 이름으로 DOM 과 시트를 가져간다. */
const SCREEN = {
  hno2: { out: 'hana-overview-02', title: '종합현황' },
  hnc1: { out: 'hana-cloud-01', title: '클라우드현황01' },
  hnc2: { out: 'hana-cloud-02', title: '클라우드현황02' },
  hnm: { out: 'hana-middleware', title: '미들웨어' },
  hni1: { out: 'hana-infra-main', title: '인프라메인' },
  hni2: { out: 'hana-infra-detail', title: '인프라상세' },
  hne: { out: 'hana-event', title: '이벤트' },
  hnn1: { out: 'hana-network-01', title: '네트워크01' },
  hnf: { out: 'hana-facility', title: '상면관리' },
  hns1: { out: 'hana-security-01', title: '보안시스템01' },
};

global.window = {};
Object.keys(SCREEN).forEach((px) => require(path.join(ROOT, 'src', SCREEN[px].out + '.js')));
const W = global.window;

const NODES = JSON.parse(fs.readFileSync(path.join(GEN, 'nodes.json'), 'utf8'));
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
   px=화면 · nid=Figma 노드 id · name=스튜디오 표기(화면에 찍힌 한글 그대로)
   fig=Figma 레이어명(추적용). 이름 뒤에 화면을 덧붙이지 않는다 — 같은 이름이 겹칠 때만 구분한다. */
const ITEMS = {
  /* 그래프·계기 — 위젯 껍데기 없이 그림만. 같은 모양은 대표 하나만 올린다. */
  charts: [
    { px: 'hno2', nid: '1:7514', name: '거래추이 꺾은선', fig: 'Line Chart < Widget/Hourly Trend' },
    { px: 'hnc1', nid: '1:18472', name: '이벤트 꺾은선', fig: 'Line Chart < Widget/Public Status' },
    { px: 'hnn1', nid: '1:19782', name: '회선 꺾은선', fig: 'Line Chart < Widget/Throughput' },
    { px: 'hni2', nid: '1:21899', name: '성능추이 꺾은선', fig: 'Line Chart < Widget/Performance Trend' },
    { px: 'hnf', nid: '1:23054', name: '상면 성능추이 꺾은선', fig: 'Line Chart < Widget/Performance Trend' },
    { px: 'hno2', nid: '1:7203', name: '구간 실린더 게이지', fig: 'Gauge/Total < Widget/Segment Performance' },
    { px: 'hno2', nid: '1:7992', name: '업무그룹 세로도넛', fig: 'Donut/Digital Task < Widget/Workgroup CPU' },
    { px: 'hnm', nid: '1:18991', name: '응답비율 도넛', fig: 'Donut/상품처리 < Widget/AP Response Ratio' },
    { px: 'hnc2', nid: '1:18271', name: '업무별 VM 도넛', fig: 'Donut Chart < Widget/CPU Cores' },
    { px: 'hnc2', nid: '1:18414', name: '백업현황 도넛', fig: 'Donut Chart < Widget/Backup Status' },
    { px: 'hni1', nid: '1:22014', name: '배치현황 도넛', fig: 'Donut Chart < Widget/Batch Status' },
  ],

  /* 그 자체로 뜻이 서는 덩어리 — 존·노드·칩·탭·목록 항목 */
  symbols: [
    /* 주요거래 플로우 — 구역(Zone) */
    { px: 'hno2', nid: '1:7722', name: '네트워크 구역', fig: 'Zone/Network < Widget/Transaction Flow' },
    { px: 'hno2', nid: '1:7757', name: 'API G/W 구역', fig: 'Zone/API Gateway' },
    { px: 'hno2', nid: '1:7653', name: '디지털채널 구역', fig: 'Zone/Digital Channel' },
    { px: 'hno2', nid: '1:7742', name: 'EIC 구역', fig: 'Zone/EIC' },
    { px: 'hno2', nid: '1:7734', name: '업무시스템 구역', fig: 'Zone/Business System' },
    { px: 'hno2', nid: '1:7633', name: '대외망 구역', fig: 'Zone/External Network' },
    { px: 'hno2', nid: '1:7584', name: 'PT(WAS) 구역', fig: 'Zone/PT (WAS)' },
    { px: 'hno2', nid: '1:7608', name: 'BT 구역', fig: 'Zone/BT' },
    /* 주요거래 플로우 — 노드(생김새가 다른 것만) */
    { px: 'hno2', nid: '1:7724', name: '플로우 원형노드', fig: 'Node/APM < Zone/Network' },
    { px: 'hno2', nid: '1:7763', name: '플로우 서버노드', fig: 'Node/DAG < Zone/API Gateway' },
    { px: 'hno2', nid: '1:7748', name: '플로우 EIC 노드', fig: 'Node/Channel EIC < Zone/EIC' },
    { px: 'hno2', nid: '1:7635', name: '대외망 게이트 노드', fig: 'Node/G1 < Zone/External Network' },
    /* 미들웨어 거래 플로우 */
    { px: 'hnm', nid: '1:18934', name: '미들웨어 API G/W 구역', fig: 'Zone/API Gateway < Widget/Transaction Flow' },
    { px: 'hnm', nid: '1:18940', name: '미들웨어 디지털채널 구역', fig: 'Zone/Digital Channel' },
    { px: 'hnm', nid: '1:18946', name: '미들웨어 업무시스템 구역', fig: 'Zone/Business System' },
    /* 클라우드 */
    { px: 'hnc1', nid: '1:18630', name: 'Private 현황 판', fig: 'Stage/Private' },
    { px: 'hnc1', nid: '1:18646', name: 'Public 현황 판', fig: 'Stage/Public' },
    { px: 'hnc1', nid: '1:18662', name: '클라우드 노드', fig: 'Node/AWS < Stage/Public' },
    { px: 'hnc1', nid: '1:18645', name: '서버 노드', fig: 'Node/SDC < Stage/Private' },
    { px: 'hnc1', nid: '1:18677', name: 'CPU 옵션(선택)', fig: 'Option/CPU (Selected)' },
    { px: 'hnc1', nid: '1:18670', name: 'GPU 옵션', fig: 'Option/GPU' },
    /* 네트워크 구성도 */
    { px: 'hnn1', nid: '1:19362', name: '네트워크 장비노드', fig: 'Node/상품 AP' },
    { px: 'hnn1', nid: '1:19369', name: '네트워크 내부망 노드', fig: 'Node/ACI 내부망' },
    { px: 'hnn1', nid: '1:19428', name: 'CHPT 노드', fig: 'Node/전자금융 CHPT' },
    { px: 'hnn1', nid: '1:19333', name: 'DIST 가로바', fig: 'Node/DIST A10, A20' },
    { px: 'hnn1', nid: '1:19306', name: '코어 노드', fig: 'Node/청라코어' },
    { px: 'hnn1', nid: '1:19763', name: '탭(선택)', fig: 'Tab/tab01 (Selected) < Widget/Throughput' },
    { px: 'hnn1', nid: '1:19765', name: '탭', fig: 'Tab/tab02' },
    { px: 'hnn1', nid: '1:19773', name: '범례 항목', fig: 'Item/PEAK 데이' },
    /* 상면관리 */
    { px: 'hnf', nid: '1:22890', name: '위치 트리 노드', fig: 'Node/Level 1 < Widget/Location Tree' },
    { px: 'hnf', nid: '1:22906', name: '위치 트리 방 노드', fig: 'Node/Level 4' },
    { px: 'hnf', nid: '1:22883', name: '사이트 탭(선택)', fig: 'Tab/청라 (Selected)' },
    { px: 'hnf', nid: '1:23049', name: '그룹 옵션', fig: 'Option/Group 1 < Widget/Performance Trend' },
    /* 목록 항목·칩 */
    { px: 'hnc1', nid: '1:18685', name: '성능 TOP10 행', fig: 'Item/Rank 01 < Widget/Performance Top 10' },
    { px: 'hnc2', nid: '1:18317', name: '업무별 VM 행', fig: 'Item/마케팅정보분석 < Widget/CPU Cores' },
    { px: 'hnc2', nid: '1:18379', name: '상태 카운트 행', fig: 'Item/Running < Widget/Status Count' },
    { px: 'hnc2', nid: '1:18426', name: '백업 결과 행', fig: 'Item/Success < Widget/Backup Status' },
    { px: 'hno2', nid: '1:7195', name: 'TPS 칩', fig: 'Item/TPS < Widget/Segment Performance' },
    { px: 'hno2', nid: '1:7198', name: '응답시간 칩', fig: 'Item/Response Time' },
    { px: 'hno2', nid: '1:7507', name: '기간 옵션(선택)', fig: 'Option/All (Selected) < Widget/Hourly Trend' },
    { px: 'hno2', nid: '1:7511', name: '1Q 옵션', fig: 'Option/1Q' },
    /* 헤더 메뉴 */
    { px: 'hns1', nid: '1:61829', name: '헤더 메뉴(선택)', fig: 'Menu Item/Overview (Selected)' },
    { px: 'hns1', nid: '1:61830', name: '헤더 메뉴(하위 있음)', fig: 'Menu Item/Cloud' },
  ],

  /* 위젯 카드(머리글+본문) 통째로 — 같은 판이 두 화면에 겹치면 한 번만 */
  panels: [
    { px: 'hno2', nid: '1:7181', name: '구간별 성능현황', fig: 'Widget/Segment Performance' },
    { px: 'hno2', nid: '1:7501', name: '시간대별 거래추이', fig: 'Widget/Hourly Trend' },
    { px: 'hno2', nid: '1:7575', name: '주요거래 플로우', fig: 'Widget/Transaction Flow' },
    { px: 'hno2', nid: '1:7786', name: '주요 업무 현황', fig: 'Widget/Key Workload' },
    { px: 'hno2', nid: '1:7889', name: '타 기관 지연 TOP5', fig: 'Widget/Institution Delay Top 5' },
    { px: 'hno2', nid: '1:7977', name: '주요 업무 그룹 CPU 현황', fig: 'Widget/Workgroup CPU' },
    { px: 'hnc1', nid: '1:18459', name: 'Public 현황', fig: 'Widget/Public Status' },
    { px: 'hnc1', nid: '1:18515', name: 'Iaas 이벤트', fig: 'Widget/IaaS Events' },
    { px: 'hnc1', nid: '1:18571', name: 'Paas 이벤트', fig: 'Widget/PaaS Events' },
    { px: 'hnc1', nid: '1:18663', name: '성능 TOP10', fig: 'Widget/Performance Top 10' },
    { px: 'hnc2', nid: '1:18211', name: '업무별 VM (수)', fig: 'Widget/VM by Workload' },
    { px: 'hnc2', nid: '1:18263', name: 'CPU(Core)', fig: 'Widget/CPU Cores' },
    { px: 'hnc2', nid: '1:18352', name: '상태(수)', fig: 'Widget/Status Count' },
    { px: 'hnc2', nid: '1:18394', name: 'X86 서버 이벤트 (OME)', fig: 'Widget/X86 Server Events (OME)' },
    { px: 'hnc2', nid: '1:18400', name: '스토리지 (복제, 사용량)', fig: 'Widget/Storage (Replication, Usage)' },
    { px: 'hnc2', nid: '1:18406', name: '백업현황', fig: 'Widget/Backup Status' },
    { px: 'hnc2', nid: '1:18447', name: 'APIC(SDN) 모니터링', fig: 'Widget/APIC (SDN) Monitoring' },
    { px: 'hnm', nid: '1:18701', name: 'TPS/Active Thread (미들웨어)', fig: 'Widget/TPS Active Thread' },
    { px: 'hnm', nid: '1:18746', name: '서버별 상태', fig: 'Widget/Server Status' },
    { px: 'hnm', nid: '1:18927', name: '주요 거래 플로우 (미들웨어)', fig: 'Widget/Transaction Flow' },
    { px: 'hnm', nid: '1:18984', name: '주요 AP별 응답시간 비율', fig: 'Widget/AP Response Ratio' },
    { px: 'hni1', nid: '1:21970', name: 'TPS/Active Thread (인프라메인)', fig: 'Widget/TPS Active Thread' },
    { px: 'hni1', nid: '1:22005', name: '배치현황', fig: 'Widget/Batch Status' },
    { px: 'hni1', nid: '1:22049', name: '상품처리', fig: 'Widget/Product Processing' },
    { px: 'hni2', nid: '1:21686', name: 'TPS/Active Thread (인프라상세)', fig: 'Widget/TPS Active Thread' },
    { px: 'hni2', nid: '1:21720', name: '호스트 목록', fig: 'Widget/Host List' },
    { px: 'hni2', nid: '1:21854', name: '호스트 상세', fig: 'Widget/Host Detail' },
    { px: 'hni2', nid: '1:21886', name: '성능추이', fig: 'Widget/Performance Trend' },
    { px: 'hni2', nid: '1:21928', name: '파일시스템 현황 TOP5', fig: 'Widget/File System Top 5' },
    { px: 'hnn1', nid: '1:19756', name: 'Throughput', fig: 'Widget/Throughput' },
    { px: 'hnn1', nid: '1:19813', name: 'Connected', fig: 'Widget/Connected' },
    { px: 'hnn1', nid: '1:19870', name: '회선 사용량 정보', fig: 'Widget/Line Usage 01' },
    { px: 'hnf', nid: '1:22874', name: '사이트맵', fig: 'Widget/Site Map' },
    { px: 'hnf', nid: '1:22876', name: '위치 트리', fig: 'Widget/Location Tree' },
    { px: 'hnf', nid: '1:22921', name: '자산 상세 팝업', fig: 'Popup/Asset Detail' },
    { px: 'hnf', nid: '1:22968', name: '자산정보', fig: 'Widget/Asset Info' },
    { px: 'hnf', nid: '1:23041', name: '성능추이 (상면)', fig: 'Widget/Performance Trend' },
    { px: 'hns1', nid: '1:23154', name: 'Host & Service Status Monitoring', fig: 'Widget/Host Service Status' },
    { px: 'hns1', nid: '1:23277', name: '보안시스템 자원 사용 현황', fig: 'Widget/Resource Usage' },
    { px: 'hns1', nid: '1:23647', name: '보안시스템 가동 현황', fig: 'Widget/System Uptime' },
    { px: 'hns1', nid: '1:23763', name: 'Today Notice', fig: 'Widget/Today Notice' },
  ],

  /* 이벤트 패널 — 이름에 '이벤트'가 들어가면 라이브러리가 이 탭으로 보낸다 */
  events: [
    { px: 'hne', nid: '1:19024', name: '이벤트 로그 (전체화면)', fig: 'Widget/Event Log' },
    { px: 'hns1', nid: '1:23779', name: '이벤트 로그 (하단 바)', fig: 'Widget/Event Log' },
    { px: 'hnf', nid: '1:23085', name: '이벤트 현황 (상면)', fig: 'Widget/Event Log' },
  ],
};

/* 아이콘 — 화면이 쓰는 원본 파일이 이미 최소 단위다(다시 그리지 않고 경로만 참조).
   파일 뿌리가 fill="none" 이라 **배경이 없다** → 썸네일도 그대로 투명하다. */
const ICONS = [
  ['icon-widget-performance.svg', '성능 위젯 아이콘', 'Icon/Widget/Performance'],
  ['icon-widget-performance-2.svg', '성능 위젯 아이콘 2', 'Icon/Widget/Performance'],
  ['icon-widget-trend.svg', '추이 위젯 아이콘', 'Icon/Widget/Trend'],
  ['icon-widget-trend-2.svg', '추이 위젯 아이콘 2', 'Icon/Widget/Trend'],
  ['icon-widget-tps.svg', 'TPS 위젯 아이콘', 'Icon/Widget/TPS'],
  ['icon-widget-throughput.svg', 'Throughput 위젯 아이콘', 'Icon/Widget/Throughput'],
  ['icon-widget-event.svg', '이벤트 위젯 아이콘', 'Icon/Widget/Event'],
  ['icon-widget-event-2.svg', '이벤트 위젯 아이콘 2', 'Icon/Widget/Event'],
  ['icon-widget-event-3.svg', '이벤트 위젯 아이콘 3', 'Icon/Widget/Event'],
  ['icon-widget-host.svg', '호스트 위젯 아이콘', 'Icon/Widget/Host'],
  ['icon-widget-server.svg', '서버 위젯 아이콘', 'Icon/Widget/Server'],
  ['icon-widget-vm.svg', 'VM 위젯 아이콘', 'Icon/Widget/VM'],
  ['icon-widget-rack.svg', '랙 위젯 아이콘', 'Icon/Widget/Rack'],
  ['icon-widget-asset.svg', '자산 위젯 아이콘', 'Icon/Widget/Asset'],
  ['icon-widget-site.svg', '사이트 위젯 아이콘', 'Icon/Widget/Site'],
  ['icon-widget-public.svg', 'Public 위젯 아이콘', 'Icon/Widget/Public'],
  ['icon-widget-realtime.svg', '실시간 위젯 아이콘', 'Icon/Widget/Realtime'],
  ['icon-diagram-site.svg', '구성도 사이트 아이콘', 'Icon/Diagram/Site'],
  ['icon-flow-dag.svg', 'DAG 플로우 아이콘', 'Icon/Flow/DAG'],
  ['icon-stage-private.svg', 'Private 아이콘', 'Icon/Stage/Private'],
  ['icon-trend-product-2.svg', '1Q 추이 아이콘', 'Icon/Trend/1Q'],
  ['icon-action-close.svg', '닫기 아이콘', 'Icon/Action/Close'],
  ['icon-field-user.svg', '아이디 입력 아이콘', 'Icon/Field/User'],
  ['icon-field-password.svg', '비밀번호 입력 아이콘', 'Icon/Field/Password'],
  ['icon-5.svg', '로그아웃 아이콘', 'Icon < Button/Logout'],
  ['icon-6.svg', '사용자 아이콘', 'Icon < Button/User'],
  ['icon-7.svg', '설정 아이콘', 'Icon < Button/Settings'],
  ['icon-4.svg', '메뉴 화살표 아이콘', 'icon < Menu Item/Cloud'],
  ['icon-9.svg', '메뉴 화살표 아이콘 2', 'icon < Menu Item/Cloud'],
];

/* ── 잘라 보고 크기를 확인한다 ── */
const report = [];
const out = { charts: [], symbols: [], panels: [], events: [], icons: [] };
let miss = 0;

Object.keys(ITEMS).forEach((cat) => {
  ITEMS[cat].forEach((it) => {
    const html = sub(HTML[it.px], it.nid);
    if (!html) { console.error('  !! 못 찾음: ' + it.px + ' ' + it.nid + ' (' + it.name + ')'); miss++; return; }
    const meta = NODES[it.nid] || [];
    const w = it.w || Math.round(meta[1] || 0);
    const h = it.h || Math.round(meta[2] || 0);
    if (!w || !h) { console.error('  !! 크기 없음: ' + it.nid + ' (' + it.name + ')'); miss++; return; }
    out[cat].push({
      id: 'hn_' + it.px + '_' + it.nid.replace(':', '_'),
      name: it.name,
      fig: it.fig + ' (' + it.nid + ')',
      px: it.px,
      nid: it.nid,
      w: w,
      h: h,
    });
    report.push([cat, it.px, it.nid, w + 'x' + h, String(html.length), it.name]);
  });
});

ICONS.forEach(([file, name, fig]) => {
  const p = path.join(ROOT, BASE, file);
  if (!fs.existsSync(p)) { console.error('  !! 파일 없음: ' + BASE + file); miss++; return; }
  const svg = fs.readFileSync(p, 'utf8');
  /* 뿌리 svg 가 fill="none" 인지 — 배경이 깔려 있으면 썸네일이 투명하지 않다 */
  if (!/^<svg[^>]*fill="none"/.test(svg)) console.error('  ?? 배경이 있을 수 있음: ' + file);
  out.icons.push({
    id: 'hn_' + file.replace(/\.svg$/, '').replace(/-/g, '_'),
    name: name, fig: fig, src: BASE + file,
    light: fs.existsSync(path.join(ROOT, BASE, file.replace(/\.svg$/, '-lt.svg'))) ? BASE + file.replace(/\.svg$/, '-lt.svg') : undefined,
  });
});

/* ── CSS 는 담지 않는다 ──
   화면 시트는 이미 index.html 이 <script>(src/hana-*.js)로 들고 있다(window.HNO2_CSS 등).
   등록 목록에는 **어느 화면 시트가 필요한지만** 적고 라이브러리가 그때 붙인다
   (스튜디오가 시안을 얹을 때 쓰는 style#hnXX-style 과 같은 id 라 두 번 붙지 않는다).
   시트는 `.hnXX-root` 안으로 스코프돼 있어 라이브러리 밖으로 새지 않는다. */
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
  '/* 자동 생성물 — HANA Bank H.I.T 14화면(Figma H3S2M7DUCvuJgi75oBqg6W)의 에셋 라이브러리 등록 목록.\n' +
  '   등록 단위는 컴포넌트다(부품은 넣지 않는다). 같은 그림이 여러 화면에 겹치면 한 번만 올린다.\n' +
  '   마크업도 CSS 도 복사해 두지 않는다 — 화면 빌더(build_hnXX)의 DOM 에서 노드 id 로 그때그때\n' +
  '   잘라 쓰고, 시트는 window.HNO2_CSS 등 이미 로드된 것을 붙인다. 그래서 글자는 실제 텍스트 그대로고\n' +
  "   ('패널편집'으로 고칠 수 있다) 라이트 테마·'색 정하기'도 화면과 똑같이 따라온다.\n" +
  '   생성기: src/hana-assets/_gen/mk-assets.js — 손으로 고치지 말고 다시 돌릴 것. */\n';

const js = head + 'window.__HANA_ASSETS = ' + JSON.stringify({
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
console.log('파일: src/hana-assets.js ' + kb(js.length) + ' (마크업·CSS 를 안 담아 목록만)');
if (process.argv[2] === '-v') {
  console.log('\ncat      px    node       size        markup  name');
  report.forEach((r) => console.log(r[0].padEnd(8) + r[1].padEnd(6) + r[2].padEnd(11) + r[3].padEnd(12) + r[4].padStart(7) + '  ' + r[5]));
}
