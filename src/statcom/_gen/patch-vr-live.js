/* live-src.js 에 VR 4장을 넣는다 + 스튜디오 표에 장면을 잇는다(한 번만). 실행: node patch-vr-live.js → node mk-live.js */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
function patch(file, pairs) {
  const p = path.isAbsolute(file) ? file : path.join(ROOT, file);
  const before = fs.readFileSync(p, 'utf8');
  const crlf = before.includes('\r\n');
  let s = crlf ? before.replace(/\r\n/g, '\n') : before;
  pairs.forEach(([a, b, mark]) => {
    if (s.includes(mark || b)) return;
    if (!s.includes(a)) throw new Error(path.basename(p) + ' 앵커 없음: ' + a.slice(0, 80));
    s = s.split(a).join(b);
  });
  if (crlf) s = s.replace(/\n/g, '\r\n');
  fs.writeFileSync(p, s);
  console.log('  patched', path.basename(p));
}
const VR = [
  ['vr-topic', 'tvt', 'VR 교육 주제 선택', 'statcom-vr-topic'], ['vr-overview', 'tvo', 'VR 교육 개요', 'statcom-vr-overview'],
  ['vr-step', 'tvs', 'VR 교육 단계 안내', 'statcom-vr-step'], ['vr-menu', 'tvm', 'VR 교육 메뉴', 'statcom-vr-menu'],
];
const PX = VR.map((x) => x[1]);
const rootList = PX.map((p) => '.' + p + '-root').join(', ');

/* ── 라이브 ── */
patch(path.join(__dirname, 'live-src.js'), [
  ["tcq: 'cards' };", "tcq: 'cards', tvt: 'vr-topic', tvm: 'vr-menu', tvs: 'vr-step', tvo: 'vr-overview' };"],
  ["var px = /(tc[a-z])-root/.exec(root.className);", "var px = /(tc[a-z]|tv[a-z])-root/.exec(root.className);"],
  /* 맞추기 — 장면은 cover, 팝업은 원래 프레임에서 차지하던 높이 비율 그대로 가운데 */
  ["    var extras = all(frame, '[data-node-id=\"1:421\"],[data-node-id=\"1:424\"]');",
    "    var vr = /^vr-/.test(st.scene), popup = vr ? one(frame, '[data-name^=\"Popup/\"]') : null;\n" +
    "    var pop0 = popup ? { x: popup.offsetLeft, y: popup.offsetTop, w: popup.offsetWidth, h: popup.offsetHeight, fw: frame.offsetWidth, fh: frame.offsetHeight } : null;\n" +
    "    if (popup) placed(popup);\n" +
    "    var extras = all(frame, '[data-node-id=\"1:421\"],[data-node-id=\"1:424\"]');"],
  ["      if (scene) {\n        var sc = scene.style, w = sw * k, h = 1080 * k;",
    "      if (vr) {\n" +
    "        var vk = Math.max(VW / sw, VH / 788), pk = VH / 788, ss = scene.style;\n" +
    "        ss.margin = '0'; ss.width = (sw * vk).toFixed(2) + 'px'; ss.height = (788 * vk).toFixed(2) + 'px';\n" +
    "        ss.left = ((VW - sw * vk) / 2).toFixed(2) + 'px'; ss.top = ((VH - 788 * vk) / 2).toFixed(2) + 'px';\n" +
    "        var ph = popup.offsetHeight;\n" +
    "        popup.style.left = ((VW - pop0.w) / 2).toFixed(2) + 'px';\n" +
    "        popup.style.top = ((VH - ph) / 2).toFixed(2) + 'px';\n" +
    "        popup.style.transformOrigin = '50% 50%';\n" +
    "        popup.style.transform = 'scale(' + pk.toFixed(4) + ')';\n" +
    "      } else if (scene) {\n        var sc = scene.style, w = sw * k, h = 1080 * k;"],
  /* 화면 묶음 */
  ["    if (st.scene === 'login') steps = steps.filter(function (s) { return /fit|nav/.test(s[0]); });",
    "    if (st.scene === 'login') steps = steps.filter(function (s) { return /fit|nav/.test(s[0]); });\n" +
    "    if (/^vr-/.test(st.scene)) steps = [['fit', installFit], ['vr', installVR], ['move', installPanelMove]];"],
  ["    var frees = all(st.frame, ':scope > [data-name=\"Minimap\"],:scope > [data-name^=\"Hover Card\"]');",
    "    var frees = all(st.frame, ':scope > [data-name=\"Minimap\"],:scope > [data-name^=\"Hover Card\"],:scope > [data-name^=\"Popup/\"]');"],
  /* VR 흐름 */
  ["  /* ══════════════════ 11. 차트 바꾸기 ══════════════════ */",
    "  /* ══════════════════ 10-2. VR 교육 — 주제 선택 → 개요 → 단계 안내 ⇄ 메뉴 ══════════════════\n" +
    "     단추 호버는 원본의 '켜짐' 단추 그림(첫 단추)으로 바꾼다. M 키로 메뉴, Esc 로 돌아온다(개요 글에 적힌 조작 그대로). */\n" +
    "  function installVR(root, st) {\n" +
    "    var FLOW = { 'Button/MMC Valve Submodule Replacement': 'vr-overview', 'Button/Start Training': 'vr-step', 'Button/Back': 'vr-topic', 'Button/Continue': 'vr-step', 'Button/Restart': 'vr-step', 'Button/Main Menu': 'vr-topic' };\n" +
    "    var btns = all(root, '[data-name^=\"Button/\"]');\n" +
    "    var imgOf = function (b) { return one(b, '[data-name=\"Button BG\"] img'); };\n" +
    "    var labOf = function (b) { return one(b, 'p'); };\n" +
    "    var onSrc = btns[0] && imgOf(btns[0]) ? imgOf(btns[0]).getAttribute('src') : '';\n" +
    "    btns.forEach(function (b, i) {\n" +
    "      var img = imgOf(b), lab = labOf(b), off = img ? img.getAttribute('src') : '';\n" +
    "      b.classList.add('tc-vr-btn');\n" +
    "      if (i > 0 && img && onSrc && off !== onSrc) {\n" +
    "        b.addEventListener('pointerenter', function () { if (editing()) return; img.src = onSrc; img.__origSrc = onSrc; b.classList.add('tc-vr-on'); });\n" +
    "        b.addEventListener('pointerleave', function () { img.src = off; img.__origSrc = off; b.classList.remove('tc-vr-on'); });\n" +
    "      }\n" +
    "      var name = b.getAttribute('data-name');\n" +
    "      clickable(b, function () {\n" +
    "        if (FLOW[name]) { goto(FLOW[name]); return; }\n" +
    "        /* 위치 초기화 — 눌린 표시만 */\n" +
    "        b.classList.add('tc-vr-press');\n" +
    "        setTimeout(function () { b.classList.remove('tc-vr-press'); }, 260);\n" +
    "      });\n" +
    "      void lab;\n" +
    "    });\n" +
    "    /* 단계 안내 — 진행 막대가 Step 1 에서 Step 2 로 차오른다 */\n" +
    "    if (st.scene === 'vr-step') {\n" +
    "      var fg = one(root, '[data-name=\"Fill Group\"]'), s2 = one(root, '[data-name=\"Step/2\"]');\n" +
    "      var s1 = one(root, '[data-name=\"Step/1\"]');\n" +
    "      if (fg) {\n" +
    "        var p = 48.65;\n" +
    "        st.timers.push(setInterval(function () {\n" +
    "          if (idle() || editing()) return;\n" +
    "          p = Math.min(98, p + 0.55);\n" +
    "          fg.style.width = p.toFixed(2) + '%';\n" +
    "          if (s2 && s1 && p >= 97) s2.style.color = getComputedStyle(s1).color;\n" +
    "        }, 600));\n" +
    "      }\n" +
    "    }\n" +
    "    st.onKey = function (e) {\n" +
    "      if (editing() || (e.target && e.target.isContentEditable)) return;\n" +
    "      if (st.scene === 'vr-step' && (e.key === 'm' || e.key === 'M' || e.key === 'ㅡ')) goto('vr-menu');\n" +
    "      else if (st.scene === 'vr-menu' && e.key === 'Escape') goto('vr-step');\n" +
    "    };\n" +
    "    window.addEventListener('keydown', st.onKey);\n" +
    "  }\n\n" +
    "  /* ══════════════════ 11. 차트 바꾸기 ══════════════════ */"],
  ["    if (st.obs) st.obs.disconnect();", "    if (st.obs) st.obs.disconnect();\n    if (st.onKey) window.removeEventListener('keydown', st.onKey);"],
  /* 스타일 */
  ["    /* 인라인 스파크라인 */",
    "    /* VR */\n" +
    "    '.tc-root [data-name=\"Fill Group\"]{transition:width .6s linear;}',\n" +
    "    '.tc-root [data-name=\"Handle\"][data-node-id=\"1:4936\"]{animation:tcBreath 2.2s ease-in-out infinite;}',\n" +
    "    '.tc-root .tc-vr-btn{cursor:pointer;transition:translate .16s ease,filter .18s ease;}',\n" +
    "    '.tc-root .tc-vr-btn p{transition:color .18s ease;}',\n" +
    "    '.tc-root .tc-vr-btn:hover{filter:brightness(1.14);}',\n" +
    "    '.tc-root .tc-vr-btn.tc-vr-on p{color:#f1f1f1!important;}',\n" +
    "    '.tc-root[data-theme=\"light\"] .tc-vr-btn.tc-vr-on p{color:#10324d!important;}',\n" +
    "    '.tc-root .tc-vr-btn:active,.tc-root .tc-vr-btn.tc-vr-press{translate:0 1px;filter:brightness(.85);}',\n" +
    "    '.tc-root [data-name^=\"Popup/\"]{transition:translate .5s ' + EASE + ';z-index:3;}',\n" +
    "    /* 인라인 스파크라인 */"],
]);

/* ── js/templates/statcom.js ── */
patch('js/templates/statcom.js', [
  ["  'login': { px: 'tcl',", VR.map((x) => "  '" + x[0] + "': { px: '" + x[1] + "', build: 'build_" + x[1] + "', css: '" + x[1].toUpperCase() + "_CSS', light: '" + x[1].toUpperCase() + "_LIGHT_CSS', title: 'STATCOM HMI — " + x[2] + "' },").join('\n') + "\n  'login': { px: 'tcl',", "'vr-topic': { px"],
  [".tcq-root, .tcl-root'", ".tcq-root, " + rootList + ", .tcl-root'", rootList + ", .tcl-root'"],
]);
/* ── 화면 모듈 표 ── */
patch('js/core/tpl-modules.js', [
  ["      { src: 'src/statcom-login.js?v=1', build: ['build_tcl'], scene: 'login' },",
    VR.map((x) => "      { src: 'src/" + x[3] + ".js?v=1', build: ['build_" + x[1] + "'], scene: '" + x[0] + "' },").join('\n') + "\n      { src: 'src/statcom-login.js?v=1', build: ['build_tcl'], scene: 'login' },", 'statcom-vr-topic.js'],
]);
/* ── 카탈로그 ── */
patch('js/launcher/templates.js', [
  ["      { img: 'src/templates/statcom-login.jpg', label: '로그인' }",
    VR.map((x) => "      { img: 'src/templates/" + x[3] + ".jpg', label: '" + x[2] + "' }").join(',\n') + ",\n      { img: 'src/templates/statcom-login.jpg', label: '로그인' }", 'statcom-vr-topic.jpg'],
]);
patch('js/launcher/home.js', [
  ["'alarm', 'cards', 'login'][i]", "'alarm', 'cards', " + VR.map((x) => "'" + x[0] + "'").join(', ') + ", 'login'][i]", "'vr-topic'"],
]);
patch('js/templates/image.js', [
  ["'tcq', 'tcl'].forEach((px) => {", "'tcq', " + PX.map((p) => "'" + p + "'").join(', ') + ", 'tcl'].forEach((px) => {", "'tvt'"],
]);
patch('js/studio/dt-edit.js', [
  [".tcl-root p, ", PX.map((p) => '.' + p + '-root p, .' + p + '-root li').join(', ') + ", .tcl-root p, ", '.tvt-root p'],
]);
patch('js/studio/atom-swap.js', [
  ["'tcl', ", PX.map((p) => "'" + p + "'").join(', ') + ", 'tcl', ", "'tvt'"],
]);
console.log('done');
