/* SK하이닉스 이천 FMS — Popup/UPS Power - Overview
   원본: Figma 0R04sQR7srWuzezhRPzkMW / node 64:2504 (1920x1080)
   순수 HTML/CSS 재구축. 글자는 편집 가능한 실제 텍스트(SVG 아님), 아이콘·이미지는 원본에서 내려받은 에셋 그대로 사용.
   Figma 레이어명은 클래스(skxp- + 레이어명)와 data-name / data-node-id 에 그대로 보존한다.
   좌표·크기·색상은 Figma 값 그대로. */
(function () {
  var A = 'src/skhynix-popup/';

  window.SKHYNIX_POPUP_CSS = [
    "@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css');",
    /* 루트 — 1920x1080 원본 캔버스 */
    ".skxp-root{position:absolute;inset:0;overflow:hidden;background:#05070d;z-index:5;}",
    ".skxp-canvas{position:absolute;left:0;top:0;width:1920px;height:1080px;transform-origin:top left;",
    "font-family:'Pretendard','Pretendard GOV',-apple-system,system-ui,'Malgun Gothic',sans-serif;}",
    /* Background */
    ".skxp-Background{position:absolute;left:0;top:0;width:1920px;height:1080.3px;}",
    ".skxp-Base{position:absolute;left:0;top:.3px;width:1920px;height:1080px;}",
    ".skxp-Base img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;}",
    ".skxp-Gradient-Glow{position:absolute;left:0;top:0;width:1920px;height:340px;",
    "background:linear-gradient(180deg,#000 0%,rgba(0,0,0,0) 100%);}",
    /* 상단 Header */
    ".skxp-Header-Top{position:absolute;left:0;top:.3px;width:1920px;height:60px;box-sizing:border-box;",
    "display:flex;align-items:center;justify-content:space-between;padding:9px 40px 10px 47px;",
    "background:rgba(2,2,2,.5);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);",
    "border:2px solid rgba(120,129,136,0);}",
    ".skxp-Brand{display:flex;align-items:center;gap:23px;}",
    ".skxp-Logo{display:flex;align-items:center;gap:7.137px;}",
    ".skxp-logo-chip{width:28.55px;height:28.55px;display:block;}",
    ".skxp-WEMB-Studio{font-weight:700;font-size:17.844px;letter-spacing:-.3569px;color:rgba(255,255,255,.9);white-space:nowrap;}",
    ".skxp-Divider{width:1px;height:30px;display:block;}",
    ".skxp-Product-Title{display:flex;align-items:center;gap:25px;}",
    ".skxp-Title-FMS{display:flex;align-items:center;gap:5px;font-size:20px;white-space:nowrap;}",
    ".skxp-Title-FMS .fms{color:#ebebeb;font-weight:500;}",
    ".skxp-Title-FMS .dash{color:#bbb;font-weight:400;}",
    ".skxp-Site-Badge{display:flex;align-items:center;justify-content:center;height:30px;padding:5px 29px;box-sizing:border-box;",
    "background:rgba(49,49,49,.1);border:1px solid rgba(140,140,140,.6);border-radius:100px;}",
    ".skxp-Site-Badge span{font-weight:600;font-size:16px;color:#fff;white-space:nowrap;}",
    ".skxp-Clock{display:flex;align-items:center;gap:12px;}",
    ".skxp-Clock .ico{width:20px;height:20px;display:block;}",
    ".skxp-Timestamp{display:flex;align-items:center;gap:5px;}",
    ".skxp-Date,.skxp-Time{font-size:20px;letter-spacing:-1px;white-space:nowrap;font-variant-numeric:tabular-nums;}",
    ".skxp-Date{color:#bbb;}",
    ".skxp-Time{color:#ff9542;}",
    ".skxp-User-Actions{width:463px;height:20px;position:relative;}",
    ".skxp-Actions{position:absolute;left:393px;top:-.2px;width:70px;display:flex;align-items:center;justify-content:space-between;}",
    ".skxp-Actions img{width:20px;height:20px;display:block;}",
    /* Modal */
    ".skxp-Modal{position:absolute;left:50%;transform:translateX(-50%);top:121.3px;width:1520px;height:837px;box-sizing:border-box;",
    "display:flex;flex-direction:column;align-items:center;gap:32px;padding-bottom:34px;overflow:hidden;",
    "background:#1f2228;border:1px solid #9fa2a6;border-radius:10px;}",
    ".skxp-Modal-Header{width:100%;height:42px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;",
    "padding:0 16px 0 28px;background:#404554;flex:none;}",
    ".skxp-Modal-Title{width:100%;display:flex;align-items:center;justify-content:space-between;}",
    ".skxp-Modal-Title>.t{font-weight:600;font-size:20px;color:#fff;white-space:nowrap;}",
    ".skxp-Close-Button{width:24px;height:24px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;",
    "border:.75px solid #e7e9eb;border-radius:4px;cursor:pointer;",
    "background-image:linear-gradient(137.8156deg,rgba(209,223,255,.2) 52.344%,rgba(209,223,255,0) 52.344%),linear-gradient(90deg,#404554 0%,#404554 100%);}",
    ".skxp-Icon-Action-Close{width:12px;height:12px;display:block;}",
    ".skxp-Body{width:100%;box-sizing:border-box;display:flex;flex-direction:column;align-items:flex-start;gap:20px;padding:0 30px;flex:none;}",
    ".skxp-Overview{width:100%;display:flex;align-items:center;gap:20px;}",
    ".skxp-UPS-Model{width:330px;height:320px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;flex:none;",
    "background:#1f2228;border:1px solid #92959a;border-radius:12px;}",
    ".skxp-UPS-Model .img{width:217px;height:278px;position:relative;overflow:hidden;}",
    ".skxp-UPS-Model .img img{position:absolute;left:0;top:0;width:100%;height:100%;}",
    ".skxp-Floor-Layout{flex:1 0 0;min-width:0;height:320px;box-sizing:border-box;display:flex;flex-direction:column;",
    "align-items:center;justify-content:center;padding-top:10px;background:#1f2228;border:1px solid #92959a;border-radius:12px;}",
    ".skxp-Floor-Layout .img{width:561px;height:315px;position:relative;overflow:hidden;}",
    ".skxp-Floor-Layout .img img{position:absolute;left:0;top:0;width:100%;height:137.5%;}",
    /* Event List */
    ".skxp-Event-List{width:100%;height:389px;box-sizing:border-box;display:flex;flex-direction:column;align-items:flex-end;gap:16px;",
    "padding:0 19px 17px 0;background:rgba(31,34,40,.7);border:1px solid #9fa2a6;border-radius:10px;}",
    ".skxp-EL-Header{width:100%;display:flex;align-items:center;justify-content:space-between;}",
    ".skxp-Title-Tab{position:relative;width:243.836px;height:40px;flex:none;}",
    ".skxp-Title-Tab>img{position:absolute;inset:0;width:100%;height:100%;display:block;}",
    ".skxp-Title-Tab>span{position:absolute;left:21.32px;top:8px;font-weight:600;font-size:20px;color:#d3d3d3;white-space:nowrap;}",
    ".skxp-Count-Group{display:flex;align-items:center;justify-content:flex-end;gap:4px;}",
    ".skxp-Count{position:relative;width:87px;height:22px;background:#000;box-sizing:border-box;border:1px solid;}",
    ".skxp-Count .bar{position:absolute;left:39.08%;right:59.77%;top:31.82%;bottom:31.82%;}",
    ".skxp-Count .lab{position:absolute;left:11.49%;top:50%;transform:translateY(-50%);font-size:12px;white-space:nowrap;line-height:1.2;}",
    ".skxp-Count .val{position:absolute;right:9.2%;top:50%;transform:translateY(-50%);font-size:16px;text-align:right;white-space:nowrap;line-height:1.2;}",
    /* Table */
    ".skxp-Table{width:100%;box-sizing:border-box;display:flex;flex-direction:column;align-items:flex-start;padding:0 20px;overflow:hidden;}",
    ".skxp-Grid{width:100%;}",
    ".skxp-Header-Row{width:100%;height:36px;display:flex;align-items:center;background:#151920;border-bottom:1px solid #555b6d;box-sizing:border-box;}",
    ".skxp-Header-Row .th{height:100%;display:flex;align-items:center;justify-content:center;border-right:1px solid #555b6d;",
    "box-sizing:border-box;font-weight:600;font-size:13px;color:#e0e2fb;white-space:nowrap;flex:none;}",
    ".skxp-Header-Row .th.msg{flex:1 0 0;min-width:0;border-right:0;}",
    ".skxp-Row{width:100%;height:35px;display:flex;align-items:center;border-bottom:1px solid #555b6d;box-sizing:border-box;}",
    ".skxp-Row.last{border-bottom:0;}",
    ".skxp-Row.on{background:#45505f;}",
    ".skxp-Row .td{height:100%;display:flex;align-items:center;justify-content:center;border-right:1px solid #555b6d;",
    "box-sizing:border-box;font-size:13px;color:#cfcfcf;white-space:nowrap;flex:none;}",
    ".skxp-Row .td.msg{flex:1 0 0;min-width:0;border-right:0;justify-content:flex-start;padding:0 26px;}",
    ".skxp-Status-Dot{width:13px;height:13px;display:block;}",
    /* (2) 표 — 실제 테이블처럼 행에 마우스 올리면 색이 바뀐다 */
    ".skxp-Row{transition:background .12s ease;}",
    ".skxp-Row:hover{background:#3a4351;cursor:default;}",
    ".skxp-Row.on:hover{background:#51606f;}",
    ".skxp-Row:hover .td{color:#fff;}",
    /* (4) 닫기 버튼 — hover / 누름 상태 */
    ".skxp-Close-Button{transition:background-color .12s ease,border-color .12s ease,transform .08s ease;}",
    ".skxp-Close-Button:hover{border-color:#fff;background-color:rgba(228,87,90,.85);}",
    ".skxp-Close-Button:hover .skxp-Icon-Action-Close{filter:brightness(2.2);}",
    ".skxp-Close-Button:active{transform:scale(.92);}",
    /* (1) 패널편집 — 팝업 블록도 끌어 옮길 수 있게 표시 */
    ".dt-editing .skxp-root .dt-drag{cursor:move;outline:1px dashed rgba(120,170,255,.45);outline-offset:2px;border-radius:4px;}",
    ".dt-editing .skxp-root .dt-drag:hover{outline-color:#4c8dff;}",
    ".dt-editing .skxp-root .dt-drag.dragging{opacity:.9;z-index:50;}",
    /* 열 너비 — Figma 값 그대로 */
    ".skxp-w-grade{width:81px;}.skxp-w-time{width:170px;}.skxp-w-count{width:200px;}.skxp-w-system{width:190px;}",
    /* 내용 수정 모드 */
    ".dt-content-editing .skxp-root [contenteditable='true']{outline:1px dashed rgba(120,170,255,.5);outline-offset:1px;border-radius:2px;}",
    ".dt-content-editing .skxp-root [contenteditable='true']:focus{outline:1px solid #4c8dff;background:rgba(76,141,255,.16);}",

    /* ══ 라이트 테마 ══════════════════════════════════════════════════════
       팝업은 다크 시안(Figma 64:2504)이 원본이라 색이 전부 어둡게 박혀 있다.
       메인 시안(src/skhynix-light.css)과 같은 톤으로 라이트 값을 얹는다.
       **이 시트 안에 두는 이유**: 시드 색 틴트(index.html TPLTINT.skxpTint)가 #skxp-style 의
       색 문자열을 통째로 다시 쓴다 → 여기 적힌 라이트 값도 함께 시드 색을 따라간다.
       바깥 스타일시트에 두면 라이트에서만 틴트가 안 먹어 색이 어긋난다. */
    /* 등급 색 — 다크 기본값(원본 그대로) */
    ".skxp-root{--skxp-sev-all:#cccccc;--skxp-sev-critical:#e4575a;--skxp-sev-major:#fc9126;--skxp-sev-minor:#e3af31;--skxp-sev-warning:#4cb5ff;}",
    /* 〃 라이트 — 흰 칩 위에서 읽히도록 색상은 두고 명도만 낮춘다 */
    ".main[data-mode='light'] .skxp-root{--skxp-sev-all:#4a5468;--skxp-sev-critical:#c62828;--skxp-sev-major:#a04f00;--skxp-sev-minor:#8a6900;--skxp-sev-warning:#0b6fb8;}",
    /* 바탕 — 3D 렌더와 상단 글로우는 다크 전용 연출이라 걷어낸다(메인 시안과 같은 처리) */
    ".main[data-mode='light'] .skxp-root{background:linear-gradient(180deg,#eef1f7 0%,#e2e7ef 100%);}",
    ".main[data-mode='light'] .skxp-Base,.main[data-mode='light'] .skxp-Gradient-Glow{display:none;}",
    /* 헤더 */
    ".main[data-mode='light'] .skxp-Header-Top{background:rgba(255,255,255,.72);}",
    ".main[data-mode='light'] .skxp-WEMB-Studio{color:#20232e;}",
    ".main[data-mode='light'] .skxp-Title-FMS .fms{color:#20232e;}",
    ".main[data-mode='light'] .skxp-Title-FMS .dash{color:#4a5468;}",
    ".main[data-mode='light'] .skxp-Site-Badge{background:rgba(255,255,255,.6);border-color:#c3cbdb;}",
    ".main[data-mode='light'] .skxp-Site-Badge span{color:#20232e;}",
    ".main[data-mode='light'] .skxp-Date{color:#4a5468;}",
    ".main[data-mode='light'] .skxp-Time{color:#b85c07;}",
    /* 모달 */
    ".main[data-mode='light'] .skxp-Modal{background:#ffffff;border-color:#ccd3df;}",
    ".main[data-mode='light'] .skxp-Modal-Header{background:#eef3fa;}",
    ".main[data-mode='light'] .skxp-Modal-Title>.t{color:#20232e;}",
    ".main[data-mode='light'] .skxp-Close-Button{border-color:#8d97a8;background-image:linear-gradient(137.8156deg,rgba(120,140,180,.14) 52.344%,rgba(120,140,180,0) 52.344%),linear-gradient(90deg,#eef3fa 0%,#eef3fa 100%);}",
    /* 닫기 X 는 흰 글리프 이미지라 라이트에선 뒤집어 짙게 — hover 때는 붉은 판이므로 원래대로 */
    ".main[data-mode='light'] .skxp-Close-Button .skxp-Icon-Action-Close{filter:invert(1) brightness(.4);}",
    ".main[data-mode='light'] .skxp-Close-Button:hover .skxp-Icon-Action-Close{filter:none;}",
    /* 헤더의 흰 글리프 아이콘(시계·사용자·로그아웃)과 세로 구분선 — 밝은 헤더 위에서는 사라진다 */
    ".main[data-mode='light'] .skxp-Clock .ico,.main[data-mode='light'] .skxp-Actions img,.main[data-mode='light'] .skxp-Divider{filter:invert(1) brightness(.42);}",
    ".main[data-mode='light'] .skxp-UPS-Model,.main[data-mode='light'] .skxp-Floor-Layout{background:#ffffff;border-color:#d5dbe6;}",
    /* 이벤트 목록 — 탭 배경은 다크용 SVG 이미지라 라이트에선 감추고 같은 모양을 CSS 로 낸다 */
    ".main[data-mode='light'] .skxp-Event-List{background:rgba(255,255,255,.75);border-color:#ccd3df;}",
    ".main[data-mode='light'] .skxp-Title-Tab>img{display:none;}",
    ".main[data-mode='light'] .skxp-Title-Tab{background:#eef3fa;border-radius:10px 10px 0 0;}",
    ".main[data-mode='light'] .skxp-Title-Tab>span{color:#20232e;}",
    ".main[data-mode='light'] .skxp-Count{background:#eef2f9;}",
    /* 표 */
    ".main[data-mode='light'] .skxp-Header-Row{background:#eef3fa;border-bottom-color:#d5dbe6;}",
    ".main[data-mode='light'] .skxp-Header-Row .th{border-right-color:#d5dbe6;color:#3a4358;}",
    ".main[data-mode='light'] .skxp-Row{border-bottom-color:#e1e6ef;}",
    ".main[data-mode='light'] .skxp-Row .td{border-right-color:#e1e6ef;color:#2e3340;}",
    ".main[data-mode='light'] .skxp-Row.on{background:#e3ecf9;}",
    ".main[data-mode='light'] .skxp-Row:hover{background:#f1f5fb;}",
    ".main[data-mode='light'] .skxp-Row.on:hover{background:#dbe7f7;}",
    ".main[data-mode='light'] .skxp-Row:hover .td{color:#12151d;}"
  ].join('');

  /* 이벤트 카운트 칩 — 색상은 Figma 값 그대로 */
  var COUNTS = [
    { n: 'Count/All',      id: '64:1740', lab: 'ALL', c: '#cccccc' },
    { n: 'Count/Critical', id: '64:1716', lab: 'CR',  c: '#e4575a' },
    { n: 'Count/Major',    id: '64:1722', lab: 'MA',  c: '#fc9126' },
    { n: 'Count/Minor',    id: '64:1728', lab: 'MI',  c: '#e3af31' },
    { n: 'Count/Warning',  id: '64:1734', lab: 'WA',  c: '#4cb5ff' }
  ];
  /* 표 데이터 — Figma 원본 값 */
  var ROWS = [
    { dot: 1, time: '2026-02-26 14:30', cnt: '20', sys: '시스템01', msg: 'txt', on: false },
    { dot: 2, time: '2026-02-26 14:30', cnt: '10', sys: '시스템02', msg: 'txt', on: true },
    { dot: 3, time: '2026-02-26 14:30', cnt: '5',  sys: '시스템03', msg: 'txt', on: false },
    { dot: 4, time: '2026-02-26 14:30', cnt: '7',  sys: '시스템04', msg: 'txt', on: false },
    { dot: 5, time: '2026-02-26 14:30', cnt: '3',  sys: '시스템05', msg: 'txt', on: false }
  ];

  function chip(c) {
    /* 심각도 색은 인라인이 아니라 CSS 변수로 넘긴다 — 라이트 테마에서는 흰 칩 위에 얹히므로
       더 진한 값이어야 하는데, 인라인으로 박으면 스타일시트로 덮을 수가 없다.
       값은 아래 SKHYNIX_POPUP_CSS 의 --skxp-sev-* (다크 기본 + 라이트 오버라이드). */
    var v = 'var(--skxp-sev-' + c.n.split('/')[1].toLowerCase() + ',' + c.c + ')';
    var half = 'color-mix(in srgb,' + v + ' 50%,transparent)';
    return '<div class="skxp-Count" data-name="' + c.n + '" data-node-id="' + c.id + '" style="border-color:' + half + '">'
      + '<div class="bar" style="background:' + half + '"></div>'
      + '<span class="lab skxp-txt" style="color:' + v + '">' + c.lab + '</span>'
      + '<span class="val skxp-txt" style="color:' + v + '">0</span>'
      + '</div>';
  }
  function row(r) {
    return '<div class="skxp-Row' + (r.on ? ' on' : '') + '" data-name="Row">'
      + '<div class="td skxp-w-grade" data-name="Td/Grade"><img class="skxp-Status-Dot" src="' + A + 'status-dot-' + r.dot + '.svg" alt=""></div>'
      + '<div class="td skxp-w-time skxp-txt" data-name="Td/Time">' + r.time + '</div>'
      + '<div class="td skxp-w-count skxp-txt" data-name="Td/Count">' + r.cnt + '</div>'
      + '<div class="td skxp-w-system skxp-txt" data-name="Td/System">' + r.sys + '</div>'
      + '<div class="td msg skxp-txt" data-name="Td/Message">' + r.msg + '</div>'
      + '</div>';
  }
  function emptyRow(last) {
    return '<div class="skxp-Row' + (last ? ' last' : '') + '" data-name="Row">'
      + '<div class="td skxp-w-grade" data-name="Td/Grade"></div>'
      + '<div class="td skxp-w-time" data-name="Td/Time"></div>'
      + '<div class="td skxp-w-count" data-name="Td/Count"></div>'
      + '<div class="td skxp-w-system" data-name="Td/System"></div>'
      + '<div class="td msg" data-name="Td/Message"></div>'
      + '</div>';
  }

  window.buildSkhynixPopup = function () {
    var html = '';
    html += '<div class="skxp-canvas" data-name="Popup/UPS Power - Overview" data-node-id="64:2504">';

    /* Background */
    html += '<div class="skxp-Background" data-name="Background" data-node-id="64:2505">';
    html += '<div class="skxp-Base" data-name="Base" data-node-id="64:2506"><img src="' + A + 'base.png" alt=""></div>';
    html += '<div class="skxp-Gradient-Glow" data-name="Gradient Glow" data-node-id="64:2507"></div>';
    html += '</div>';

    /* 상단 Header */
    html += '<div class="skxp-Header-Top" data-name="Header" data-node-id="84:4699">';
    html += '<div class="skxp-Brand" data-name="Brand" data-node-id="84:4700">';
    html += '<div class="skxp-Logo" data-name="Logo" data-node-id="84:4701">';
    html += '<img class="skxp-logo-chip" src="' + A + 'logo-chip.svg" alt="" data-name="logo chip" data-node-id="84:4702">';
    html += '<span class="skxp-WEMB-Studio skxp-txt" data-name="WEMB Studio" data-node-id="84:4704">WEMB Studio</span>';
    html += '</div>';
    html += '<img class="skxp-Divider" src="' + A + 'divider.svg" alt="" data-name="Divider" data-node-id="84:4705">';
    html += '<div class="skxp-Product-Title" data-name="Product Title" data-node-id="84:4706">';
    html += '<div class="skxp-Title-FMS" data-name="Title" data-node-id="84:4707">';
    html += '<span class="fms skxp-txt" data-node-id="84:4708">FMS</span>';
    html += '<span class="dash skxp-txt" data-node-id="84:4709">Dashboard</span>';
    html += '</div>';
    html += '<div class="skxp-Site-Badge" data-name="Site Badge" data-node-id="84:4710"><span class="skxp-txt" data-node-id="84:4711">이천</span></div>';
    html += '</div></div>';
    html += '<div class="skxp-Clock" data-name="Clock" data-node-id="84:4712">';
    html += '<img class="ico" src="' + A + 'icon-system-clock.svg" alt="" data-name="Icon/System/Clock" data-node-id="84:4713">';
    html += '<div class="skxp-Timestamp" data-name="Timestamp" data-node-id="84:4715">';
    html += '<span class="skxp-Date skxp-txt" data-name="Date" data-node-id="84:4717">0000-00-00</span>';
    html += '<span class="skxp-Time skxp-txt" data-name="Time" data-node-id="84:4719">09:30:00</span>';
    html += '</div></div>';
    html += '<div class="skxp-User-Actions" data-name="User Actions" data-node-id="84:4720">';
    html += '<div class="skxp-Actions" data-name="Actions" data-node-id="84:4721">';
    html += '<img src="' + A + 'icon-action-user.svg" alt="" data-name="Icon/Action/User" data-node-id="84:4722">';
    html += '<img src="' + A + 'icon-action-logout.svg" alt="" data-name="Icon/Action/Logout" data-node-id="84:4724">';
    html += '</div></div>';
    html += '</div>';

    /* Modal */
    html += '<div class="skxp-Modal" data-name="Modal" data-node-id="64:2508">';
    html += '<div class="skxp-Modal-Header" data-name="Header" data-node-id="64:2509">';
    html += '<div class="skxp-Modal-Title" data-name="Title" data-node-id="64:2510">';
    html += '<span class="t skxp-txt" data-node-id="64:2511">UPS 전력</span>';
    html += '<div class="skxp-Close-Button" data-name="Close Button" data-node-id="64:2512" role="button" aria-label="닫기">';
    html += '<img class="skxp-Icon-Action-Close" src="' + A + 'icon-action-close.svg" alt="" data-name="Icon/Action/Close" data-node-id="64:2513">';
    html += '</div></div></div>';

    html += '<div class="skxp-Body" data-name="Body" data-node-id="64:2515">';
    html += '<div class="skxp-Overview" data-name="Overview" data-node-id="64:2516">';
    html += '<div class="skxp-UPS-Model" data-name="UPS Model" data-node-id="64:2517">';
    html += '<div class="img" data-name="Image" data-node-id="64:2518"><img src="' + A + 'ups-model.png" alt=""></div>';
    html += '</div>';
    html += '<div class="skxp-Floor-Layout" data-name="Floor Layout" data-node-id="64:2519">';
    html += '<div class="img" data-name="Image" data-node-id="64:2520"><img src="' + A + 'floor-layout.png" alt=""></div>';
    html += '</div></div>';

    html += '<div class="skxp-Event-List" data-name="Event List" data-node-id="64:2521">';
    html += '<div class="skxp-EL-Header" data-name="Header" data-node-id="64:2522">';
    html += '<div class="skxp-Title-Tab" data-name="Title Tab" data-node-id="64:2523">';
    html += '<img src="' + A + 'title-tab-bg.svg" alt="" data-name="Background" data-node-id="64:2524">';
    html += '<span class="skxp-txt" data-node-id="64:2525">Event List</span>';
    html += '</div>';
    html += '<div class="skxp-Count-Group" data-name="Count Group" data-node-id="64:2526">';
    html += COUNTS.map(chip).join('');
    html += '</div></div>';

    html += '<div class="skxp-Table" data-name="Table" data-node-id="64:2532">';
    html += '<div class="skxp-Grid" data-name="Grid" data-node-id="64:2533">';
    html += '<div class="skxp-Header-Row" data-name="Header Row" data-node-id="64:2534">';
    html += '<div class="th skxp-w-grade skxp-txt" data-name="Th/Grade">등급</div>';
    html += '<div class="th skxp-w-time skxp-txt" data-name="Th/Time">발생시간</div>';
    html += '<div class="th skxp-w-count skxp-txt" data-name="Th/Count">중복건수</div>';
    html += '<div class="th skxp-w-system skxp-txt" data-name="Th/System">시스템명</div>';
    html += '<div class="th msg skxp-txt" data-name="Th/Message">메시지</div>';
    html += '</div>';
    html += '<div class="skxp-TBody" data-name="Body" data-node-id="64:2545">';
    html += ROWS.map(row).join('') + emptyRow(false) + emptyRow(false) + emptyRow(true);
    html += '</div></div></div>';

    html += '</div></div></div>';
    html += '</div>';
    return html;
  };
})();
