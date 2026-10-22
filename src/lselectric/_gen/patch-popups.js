/* 여섯 ~ 열 번째 화면 — 단독 팝업 다섯 장(popup-3 ~ popup-7)을 생성기에 더한다.
   (한 번만 돌린다. 이미 들어가 있으면 건너뛴다.)

   Figma 페이지의 y=2324 줄에 화면 프레임 없이 놓인 팝업들이다. ACB · 계통 · 에너지 진단처럼
   STATCOM Overview(3:5) 위에 얹어 한 장면으로 만든다. 놓을 자리는 원본에 없으므로
   ACB 팝업과 같은 규칙 — 1920x1080 화면 한가운데(보이는 상자 기준, 정수 픽셀)로 둔다.

     118:568   Popup/Transformer - Status              1630x516  → lst · transformer
     124:1703  Popup/AC Power Room - Electrical Readings 302x187 → lsp · acroom
     124:1942  Popup/Charger Battery - Status           842x276  → lsb · charger
     124:3340  Popup/Cooling System - Status            1509x684 → lsc · cooling
     138:1433  Popup/Rooms - Alarm                      410x276  → lsr · alarm   (바탕 판이 318 까지 내려온다 — 보이는 높이로 가운데)

   · conv.js  SCREENS 다섯 줄(층 4~8) · CENTER_STROKE(범례 판) · 화면별 노드 CSS(SCREEN_CSS — 아래 '선' 두 가지)
   · dl.js    다섯 화면(`node dl.js 118-568 124-1703 124-1942 124-3340 138-1433`)

   design context 가 뭉갠 선 두 가지를 use_figma 로 읽은 값 그대로 되살린다.
     ① 그라디언트 선 — 라벨 칩(124:1922·124:1931)은 오른쪽 #5468C0 → 왼쪽 투명, 표 · 목록 판(137:1081 · 137:1218 · 138:1265)은
        #4F5880 위에 #9AD8FF(1→0) 이 왼쪽 위에서 번진다. design context 는 단색 하나(#5468c0 · #9ad8ff)로 냈다.
        테두리 자리는 그대로 두고(투명) 같은 두께의 링을 ::after 로 그린다 — 둥근 모서리를 따라간다.
        각도 · 정지점은 gradientTransform 과 상자 크기에서 계산한다(손으로 맞추지 않는다).
     ② 점선 — PUMP 머리칸 구분선(137:1084 · 137:1087)은 dash [2,3]. CSS dashed 는 길이가 달라 배경 무늬로 그린다.

   실행: node src/lselectric/_gen/patch-popups.js */
'use strict';
const fs = require('fs');
const path = require('path');
const GEN = __dirname;

function edit(file, fn) {
  const p = path.join(GEN, file);
  const before = fs.readFileSync(p, 'utf8');
  const after = fn(before);
  if (after === before) { console.log('건너뜀(이미 됨):', file); return; }
  fs.writeFileSync(p, after);
  console.log('고침:', file);
}
function rep(s, find, val) {
  if (s.indexOf(find) < 0) throw new Error('앵커 없음: ' + find.slice(0, 100));
  return s.replace(find, () => val);
}

/* Figma gradientTransform(첫 줄 = u 식) + 상자 크기 → CSS linear-gradient 각도 · 정지점(0~1 의 u 를 %로) */
function cssGrad(tr, W, H, stops) {
  const a = tr[0][0], b = tr[0][1], c = tr[0][2];
  const gx = a / W, gy = b / H;                                /* 화면 픽셀당 u 변화(y 는 아래로) */
  let deg = Math.atan2(gx, -gy) * 180 / Math.PI;
  if (deg < 0) deg += 360;
  const U = (x, y) => a * x / W + b * y / H + c;
  const us = [U(0, 0), U(W, 0), U(0, H), U(W, H)];
  const u0 = Math.min.apply(null, us), u1 = Math.max.apply(null, us);
  const pct = (u) => +((u - u0) / (u1 - u0) * 100).toFixed(2) + '%';
  return 'linear-gradient(' + +deg.toFixed(2) + 'deg,' + stops.map((s) => s[1] + ' ' + pct(s[0])).join(',') + ')';
}
const RING = 'content:"";position:absolute;inset:-1px;border-radius:inherit;padding:1px;pointer-events:none;'
  + '-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;';
function gradRing(id, grad, base) {
  const sel = '.{{PX}}-root [data-node-id="' + id + '"]';
  return [
    sel + '{border-color:' + (base || 'transparent') + '!important;}',
    sel + '::after{' + RING + 'background:' + grad + ';}',
  ];
}
const TABLE_TR = [[2.582, 1.327, -0.083], [-0.823, 1.336, 0.417]];          /* 137:1081 · 137:1218 · 138:1265 공통 */
const TABLE_STOPS = [[0, 'rgba(154,216,255,1)'], [1, 'rgba(154,216,255,0)']];
const LABEL_TR = [[-1, 0, 1], [0, -0.166, 0.583]];                         /* 124:1922 · 124:1931 */
const LABEL_STOPS = [[0, 'rgba(84,104,192,1)'], [1, 'rgba(22,56,151,0)']];
const DASH = (id) => '.{{PX}}-root [data-node-id="' + id + '"]{border-right-color:transparent!important;'
  + 'background-image:linear-gradient(to bottom,#3889ff 2px,transparent 2px);background-size:1px 5px;'
  + 'background-repeat:repeat-y;background-position:right top;background-origin:border-box;}';
const SCREEN_CSS = {
  '124-1703': [].concat(
    gradRing('124:1922', cssGrad(LABEL_TR, 57, 23, LABEL_STOPS)),
    gradRing('124:1931', cssGrad(LABEL_TR, 57, 23, LABEL_STOPS))),
  '124-3340': [].concat(
    gradRing('137:1081', cssGrad(TABLE_TR, 360, 80, TABLE_STOPS), '#4f5880'),
    gradRing('137:1218', cssGrad(TABLE_TR, 304, 180, TABLE_STOPS), '#4f5880'),
    gradRing('138:1265', cssGrad(TABLE_TR, 304, 298.667, TABLE_STOPS), '#4f5880'),
    [DASH('137:1084'), DASH('137:1087')]),
};

edit('conv.js', (s) => {
  if (!s.includes("key: '118-568'")) {
    const anchor = "    overlay: { base: 'lsm', baseOut: 'lselectric-statcom', build: 'build_lsm_energy', left: 33, top: 117, w: 1855, h: 846 } },";
    const row = (key, node, px, name, out, page, layer, L, T, W, H, note) =>
      '  /* ' + note + ' */\n'
      + "  { key: '" + key + "', node: '" + node + "', px: '" + px + "', name: " + JSON.stringify(name) + ", out: '" + out + "', page: '" + page + "', meta: ['meta-" + key + ".xml'], layer: " + layer + ',\n'
      + "    overlay: { base: 'lsm', baseOut: 'lselectric-statcom', build: 'build_lsm_" + page + "', left: " + L + ', top: ' + T + ', w: ' + W + ', h: ' + H + ' } },';
    s = rep(s, anchor, anchor + '\n'
      + '  /* ── 단독 팝업 다섯 장(popup-3 ~ 7) — 화면 프레임이 없어 STATCOM 위 한가운데(보이는 상자 기준, 정수 픽셀)에 얹는다(patch-popups.js) ── */\n'
      + [
        row('118-568', '118:568', 'lst', 'Popup/Transformer - Status', 'lselectric-transformer', 'transformer', 4, 145, 282, 1630, 516, '여섯 번째 = 상태정보(변압기) 1630x516'),
        row('124-1703', '124:1703', 'lsp', 'Popup/AC Power Room - Electrical Readings', 'lselectric-acroom', 'acroom', 5, 809, 446, 302, 187, '일곱 번째 = AC전원실 전압/전류 302x187'),
        row('124-1942', '124:1942', 'lsb', 'Popup/Charger Battery - Status', 'lselectric-charger', 'charger', 6, 539, 402, 842, 276, '여덟 번째 = 충전기/배터리 운영상태 842x276'),
        row('124-3340', '124:3340', 'lsc', 'Popup/Cooling System - Status', 'lselectric-cooling', 'cooling', 7, 205, 198, 1509, 684, '아홉 번째 = 냉각설비 상태 정보 1509x684'),
        row('138-1433', '138:1433', 'lsr', 'Popup/Rooms - Alarm', 'lselectric-alarm', 'alarm', 8, 755, 381, 410, 276, '열 번째 = 알림 410x276(바탕 판은 318 까지 — 보이는 높이로 가운데)'),
      ].join('\n'));
  }
  if (!s.includes("'118-568': [")) {
    s = rep(s, "    { id: '94:5336', w: 1, c: '#273458' }, { id: '94:5229', w: 1, c: '#273458' },\n  ],\n};",
      "    { id: '94:5336', w: 1, c: '#273458' }, { id: '94:5229', w: 1, c: '#273458' },\n  ],\n"
      + "  /* 상태정보 팝업 — 범례 판 세 개(use_figma 로 읽음: CENTER 1px #273458) */\n"
      + "  '118-568': [\n    { id: '122:1076', w: 1, c: '#273458' }, { id: '124:1190', w: 1, c: '#273458' }, { id: '124:1235', w: 1, c: '#273458' },\n  ],\n};");
  }
  /* 알림 · AC전원실 · 충전기 팝업의 바탕 판은 5px 안쪽 테두리(use_figma: INSIDE 5 #5b5e67) */
  if (!s.includes("case 'border-5'")) {
    s = rep(s, "      case 'border-4': bAll = '4px'; continue;\n",
      "      case 'border-4': bAll = '4px'; continue;\n      case 'border-5': bAll = '5px'; continue;   /* 단독 팝업 바탕 판(124:1711 · 124:1943 · 138:1434) */\n");
  }
  if (!s.includes('const SCREEN_CSS')) {
    s = rep(s, 'const BG_URL_PROPS = ',
      '/* 화면별 노드 CSS — design context 가 뭉갠 선(그라디언트 선 · 점선)을 use_figma 로 읽은 값으로 되살린다(patch-popups.js 가 계산해 적었다). */\n'
      + 'const SCREEN_CSS = ' + JSON.stringify(SCREEN_CSS, null, 1) + ';\n'
      + 'const BG_URL_PROPS = ');
    s = rep(s, "  const CSS = CSS0 + '\\n' + NODE_RULES + '\\n' + centerStrokeCss(r.S) + (r.S.overlay ? '\\n' + OVERLAY_CSS(r.S) : '');",
      "  const SCR_RULES = (SCREEN_CSS[r.S.key] || []).map(function (x) { return x.split('{{PX}}').join(PX); }).join('\\n');\n"
      + "  const CSS = CSS0 + '\\n' + NODE_RULES + '\\n' + centerStrokeCss(r.S) + (SCR_RULES ? '\\n' + SCR_RULES : '') + (r.S.overlay ? '\\n' + OVERLAY_CSS(r.S) : '');");
  }
  return s;
});

edit('dl.js', (s) => {
  if (s.includes("'118-568'")) return s;
  return rep(s, "  '94-5015': 'dc-94-5015.txt',\n",
    "  '94-5015': 'dc-94-5015.txt',\n  '118-568': 'dc-118-568.txt',\n  '124-1703': 'dc-124-1703.txt',\n"
    + "  '124-1942': 'dc-124-1942.txt',\n  '124-3340': 'dc-124-3340.txt',\n  '138-1433': 'dc-138-1433.txt',\n");
});

console.log('\n다음: node dl.js 118-568 124-1703 124-1942 124-3340 138-1433 → node strip-gama.js → node dedupe-assets.js → node mk-light-assets.js → node conv.js');
