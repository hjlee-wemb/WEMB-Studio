/* index.html 에 'Dashboard: HANA Bank H.I.T' 템플릿과 화면 14장을 연결한다.
   한진(Dashboard: Hanjin main)이 이미 쓰고 있는 길을 그대로 따라간다:
     ① 화면 모듈 <script> ② 템플릿 카드(제목·카테고리·날짜·슬라이드)
     ③ applyHanaDT(스테이지에 얹기) ④ 패널편집 대상(DTSEL) ⑤ 화면 테마·색 정하기(TPLTINT)
     ⑥ '스튜디오 열기' 시 화면 14개 만들기 ⑦ 새로고침 후 복원
   실행: node src/hana/_gen/patch-studio.js  (여러 번 돌려도 안전) */
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, '..', '..', '..', 'index.html');
let s = fs.readFileSync(F, 'utf8');
/* 이 파일은 전부 CRLF 다 — 다룰 때만 LF 로 펴고, 쓸 때 원래대로 되돌린다 */
const CR = String.fromCharCode(13);
const NL = String.fromCharCode(10);
const CRLF = s.indexOf(CR + NL) >= 0;
if (CRLF) s = s.split(CR + NL).join(NL);
const before = s.length;
let done = [];

const SCREENS = [
  ['overview-02', 'hno2', '종합현황02'],
  ['cloud-01', 'hnc1', '클라우드현황01'],
  ['cloud-02', 'hnc2', '클라우드현황02'],
  ['middleware', 'hnm', '미들웨어현황'],
  ['infra-main', 'hni1', '인프라 메인'],
  ['infra-detail', 'hni2', '인프라 상세'],
  ['event', 'hne', '이벤트현황'],
  ['network-01', 'hnn1', '네트워크현황01'],
  ['network-02', 'hnn2', '네트워크현황02'],
  ['network-03', 'hnn3', '네트워크현황03'],
  ['facility', 'hnf', '상면관리'],
  ['security-01', 'hns1', '보안시스템01'],
  ['security-02', 'hns2', '보안시스템02'],
  ['login', 'hnl', '로그인'],
];
const FILE = {
  'overview-02': 'hana-overview-02',
  'cloud-01': 'hana-cloud-01', 'cloud-02': 'hana-cloud-02', middleware: 'hana-middleware',
  'infra-main': 'hana-infra-main', 'infra-detail': 'hana-infra-detail', event: 'hana-event',
  'network-01': 'hana-network-01', 'network-02': 'hana-network-02', 'network-03': 'hana-network-03',
  facility: 'hana-facility', 'security-01': 'hana-security-01', 'security-02': 'hana-security-02',
  login: 'hana-login',
};

function must(anchor) { if (s.indexOf(anchor) < 0) { console.error('anchor missing:', anchor.slice(0, 70)); process.exit(1); } }

/* ── ① 화면 모듈 <script> ── */
if (s.indexOf('src/hana-live.js') < 0) {
  const A = '    <script src="src/hanjin-live.js?v=2"></script>';
  must(A);
  const tags = ['',
    '    <!-- HANA Bank H.I.T — Figma H3S2M7DUCvuJgi75oBqg6W 화면 14장을 순수 HTML/CSS DOM 으로 재구축한 것.',
    '         글자는 편집 가능한 실제 텍스트, 아이콘·그래픽만 원본에서 내려받은 개별 에셋(src/hana/). -->',
  ].concat(SCREENS.map((x) => '    <script src="src/' + FILE[x[0]] + '.js?v=2"></script>'))
    .concat(['    <script src="src/hana-live.js?v=2"></script>']).join('\n');
  s = s.replace(A, A + '\n' + tags);
  done.push('scripts');
}

/* ── ② 스테이지 CSS — 기본 DT 크롬을 숨긴다 ── */
if (s.indexOf("data-tpl='hana'") < 0) {
  const A = "      /* ── 한진 SMART 통합관제 — Figma 그대로 재현: 기본 DT 크롬을 숨기고 재현 캔버스만 보인다 ── */";
  must(A);
  s = s.replace(A, [
    "      /* ── HANA Bank H.I.T — Figma 그대로 재현: 기본 DT 크롬을 숨기고 재현 캔버스만 보인다 ── */",
    "      .dtstage[data-tpl='hana'] .dt-hdr,",
    "      .dtstage[data-tpl='hana'] .dt-ui,",
    "      .dtstage[data-tpl='hana'] .dt-scene {",
    '        display: none !important;',
    '      }',
    '',
    A,
  ].join('\n'));
  done.push('css');
}

/* ── ③ 템플릿 카드 ── */
if (s.indexOf("'Dashboard: HANA Bank H.I.T'") < 0) {
  const A = "          'Dashboard: wooribank Transaction',\n        ].map((title, i) => {";
  must(A);
  s = s.replace(A, "          'Dashboard: wooribank Transaction',\n          'Dashboard: HANA Bank H.I.T',\n        ].map((title, i) => {");
  /* 업무 영역 — 서비스·거래 */
  const B = "'종합현황', '서비스·거래'];";
  must(B);
  s = s.replace(B, "'종합현황', '서비스·거래', '서비스·거래'];");
  /* 등록일 — 2025-06-30 */
  const C = "            'September 8, 2024', 'December 1, 2026',\n          ];";
  must(C);
  s = s.replace(C, "            'September 8, 2024', 'December 1, 2026', 'June 30, 2025',\n          ];");
  done.push('template-card');
}

/* ── ③-b 템플릿에 tpl/slides 붙이기 ── */
if (s.indexOf("hn.tpl = 'hana'") < 0) {
  const A = "        let tplScreen = 'all'; /* 화면 유형 필터(all | 2D 대시보드 | 3D 디지털트윈) */";
  must(A);
  const slides = SCREENS.map((x) => "              { img: 'src/templates/hana-" + x[0] + ".jpg', label: '" + x[2] + "' },").join('\n');
  const blk = [
    "        /* HANA Bank H.I.T — '스튜디오 열기' 시 Figma(H3S2M7DUCvuJgi75oBqg6W) 화면 14장을",
    '           순수 HTML/CSS DOM 으로 재구축한 것(src/hana-*.js)으로 연다. 상세 미리보기도 그 화면을 그대로 캡처한 것이다. */',
    '        (function () {',
    "          const hn = TEMPLATES.find((t) => t.title === 'Dashboard: HANA Bank H.I.T');",
    '          if (hn) {',
    "            hn.tpl = 'hana';",
    "            hn.img = 'src/templates/hana-overview-02.jpg';",
    '            hn.slides = [',
    slides,
    '            ];',
    '          }',
    '        })();',
    A,
  ].join('\n');
  s = s.replace(A, blk);
  done.push('template-slides');
}

/* ── ④ applyHanaDT 묶음 ── */
if (s.indexOf('function applyHanaDT') < 0) {
  const A = "      /* ── 한진 SMART 통합관제 — Figma 화면 3장을 순수 HTML/CSS DOM 으로 재구축한 것을 얹는다 ──";
  must(A);
  const rows = SCREENS.map((x) => "        '" + x[0] + "': { px: '" + x[1] + "', build: 'build_" + x[1] + "', css: '"
    + x[1].toUpperCase() + "_CSS', light: '" + x[1].toUpperCase() + "_LIGHT_CSS', title: 'HANA Bank H.I.T — " + x[2] + "' },").join('\n');
  const roots = SCREENS.map((x) => '.' + x[1] + '-root').join(', ');
  const blk = [
    '      /* ── HANA Bank H.I.T — Figma 화면 14장을 순수 HTML/CSS DOM 으로 재구축한 것을 얹는다 ──',
    '         원본: Figma H3S2M7DUCvuJgi75oBqg6W (1920x1080, page "Page 1")',
    '         글자는 전부 편집 가능한 실제 텍스트(Pretendard CDN), 아이콘·그래픽만 Figma 가 내보낸',
    '         개별 svg/png(src/hana/)을 그대로 쓴다. 좌표·크기·색은 Figma 값 그대로(근사 없음).',
    "         원본이 다크 시안이라 라이트 시트를 따로 만들어 '화면 테마'로 자유롭게 바꿀 수 있다. */",
    '      const HN_SCREENS = {',
    rows,
    '      };',
    "      const HN_ROOTS = '" + roots + "';",
    "      const HN_SEED = '#009178';   /* 시안 자신의 브랜드 초록 — '색 정하기'의 시작값 */",
    '',
    '      function applyHanaDT(which) {',
    "        const stage = document.getElementById('dtStage');",
    '        if (!stage) return;',
    "        const key = HN_SCREENS[which] ? which : (localStorage.getItem('wemb-hana-screen') || 'overview-02');",
    "        const S = HN_SCREENS[key] || HN_SCREENS['overview-02'];",
    "        if (typeof window[S.build] !== 'function') return;",
    "        try { localStorage.setItem('wemb-hana-screen', key); } catch (e) {}",
    "        /* 고정 캔버스는 끈다 — 이 시안은 스스로 여백 없이 채운다(src/hana-live.js 의 fitStage). */",
    '        try { if (window.__setCanvas1920) window.__setCanvas1920(false); } catch (e) {}',
    "        stage.setAttribute('data-tpl', 'hana');",
    '        try { syncSkxControls(); } catch (e) {}',
    '        seedHanaBaseColor();',
    "        try {",
    "          const want = localStorage.getItem('wemb-hana-mode') === 'light' ? 'light' : 'dark';",
    "          if (typeof state !== 'undefined' && state.mode !== want) {",
    '            state.mode = want;',
    "            document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));",
    "            if (typeof apply === 'function') apply();",
    '          }',
    '        } catch (e) {}',
    "        const bn = stage.querySelector('.dt-bname');",
    '        if (bn) bn.textContent = S.title;',
    '        stage.querySelectorAll(HN_ROOTS).forEach((e) => {',
    '          try { window.disposeHana && window.disposeHana(e); } catch (err) {}',
    '          e.remove();',
    '        });',
    "        [[S.px + '-style', window[S.css]], [S.px + '-light-style', window[S.light]]].forEach(function (p) {",
    '          if (!p[1] || document.getElementById(p[0])) return;',
    "          const st = document.createElement('style');",
    '          st.id = p[0];',
    '          st.textContent = p[1];',
    '          document.head.appendChild(st);',
    '        });',
    "        const scr = document.createElement('div');",
    "        scr.className = S.px + '-root';",
    "        scr.dataset.theme = (typeof state !== 'undefined' && state.mode === 'light') ? 'light' : 'dark';",
    '        scr.innerHTML = window[S.build]();',
    "        const added = document.createElement('div');",
    "        added.className = 'dt-added';",
    '        added.innerHTML = \'<div class="cols gridmode"></div>\';',
    '        scr.appendChild(added);',
    '        stage.appendChild(scr);',
    '        try { window.__refreshTpl && window.__refreshTpl(); } catch (e) {}',
    '        try { window.initHana && window.initHana(scr); } catch (e) {}',
    '        try { window.__dtRecaptureDefaults && window.__dtRecaptureDefaults(false); } catch (e) {}',
    '      }',
    '      window.__applyHanaDT = applyHanaDT;',
    '',
    '      function clearHanaDT() {',
    "        document.querySelectorAll(HN_ROOTS.split(', ').map((x) => '#dtStage ' + x).join(', ')).forEach((e) => {",
    '          try { window.disposeHana && window.disposeHana(e); } catch (err) {}',
    '          e.remove();',
    '        });',
    '      }',
    '      window.__clearHanaDT = clearHanaDT;',
    '',
    '      window.__hanaSceneOf = function () {',
    '        try {',
    "          const list = JSON.parse(localStorage.getItem('wemb-projects') || '[]');",
    "          const open = list.find((p) => p && p.open && p.tpl === 'hana');",
    '          if (open && open.tplScene) return open.tplScene;',
    '        } catch (e) {}',
    "        const v = localStorage.getItem('wemb-hana-screen');",
    "        return HN_SCREENS[v] ? v : 'overview-02';",
    '      };',
    '      window.__openHanaScreen = function (which) {',
    "        try { localStorage.setItem('wemb-tpl-dt', 'hana'); } catch (e) {}",
    "        applyHanaDT(HN_SCREENS[which] ? which : 'overview-02');",
    '      };',
    '',
    "      /* 이 시안의 '기본 색' — 처음 열 때 '색 정하기'의 시작값을 브랜드 초록으로 놓는다.",
    "         시드가 그대로인 동안은 TPLTINT 가 '아직 안 바꿨다'로 보고 원본 색을 그대로 보여 준다. */",
    '      function seedHanaBaseColor() {',
    '        try {',
    "          if (localStorage.getItem('wemb-hana-seeded')) return;",
    "          localStorage.setItem('wemb-hana-seeded', '1');",
    "          if (typeof state === 'undefined') return;",
    "          state.source = 'seed';",
    "          state.sourceView = 'seed';",
    '          state.seed = HN_SEED;',
    '          state.overrides = {};',
    "          if (typeof apply === 'function') apply();",
    '        } catch (e) {}',
    '      }',
    '',
    A,
  ].join('\n');
  s = s.replace(A, blk);
  done.push('applyHanaDT');
}

/* ── ⑤ 패널편집 대상 ── */
if (s.indexOf('.hno1-root p') < 0) {
  const A = ".hjc-root p, .hjg-root p, .hju-root p'";
  must(A);
  s = s.replace(A, A.slice(0, -1) + ', ' + SCREENS.map((x) => '.' + x[1] + '-root p').join(', ') + "'");
  done.push('DTSEL');
}

/* ── ⑥ 화면 테마 · 색 정하기 ── */
if (s.indexOf('HANA_OPT') < 0) {
  const A = "        HANJIN_OPT: {";
  must(A);
  s = s.replace(A, [
    '        /* ── HANA Bank H.I.T 시안 ──',
    '           주조색은 브랜드 초록(#009178, 색상각 169°). 색을 그대로 둘 것:',
    '             · 상태·경보 색이 곧 의미인 아이콘(상태 점·배지·트렌드 화살표·단계 아이콘)',
    '             · 도넛/막대/꺾은선 등 차트 계열색 · 로고 · 로그인 배경 사진 */',
    '        HANA_OPT: {',
    "          seed: '#009178', seededKey: 'wemb-hana-seeded', refHue: 169,",
    '          keep: /(icon-widget-[\\w-]+|icon-stage-[\\w-]+|icon-flow-[\\w-]+|icon-trend-[\\w-]+|icon-action-[\\w-]+|icon-field-[\\w-]+|icon-nav-[\\w-]+|status-[\\w-]+|marker[-\\d]*|badge|logo[-\\w]*|divider[-\\d]*|series[-\\w]*|area[-\\d]*|grid-line[-\\d]*|axis-line[-\\d]*|meter[-\\w]*|track[-\\d]*|arc[-\\d]*|segment[-\\d]*|btn-arrow-\\w+)(-lt)?\\.svg(\\?|$)/i,',
    '          raster: /(background|floor-plan|grid)[-\\w]*\\.(png|jpg)(\\?|$)/i,',
    '        },',
    A,
  ].join('\n'));
  const B = "          ['hjc', 'hjg', 'hju'].forEach((px) => {";
  must(B);
  s = s.replace(B, [
    '          /* HANA Bank H.I.T 화면 14장 — 같은 방식(시안 원본 색이면 그대로, 색을 바꾸면 팔레트를 따라 칠한다) */',
    '          [' + SCREENS.map((x) => "'" + x[1] + "'").join(', ') + '].forEach((px) => {',
    '            this.icheonTint(t, mode, \'.\' + px + \'-root\',',
    "              [px + '-style', px + '-light-style', 'hana-live-style'], 'wemb-hana-mode', this.HANA_OPT);",
    '          });',
    B,
  ].join('\n'));
  done.push('TPLTINT');
}

/* ── ⑦ '스튜디오 열기' — 화면 14개 만들기 ── */
if (s.indexOf("proj.tpl === 'hana'") < 0) {
  const A = "            : pending.tpl === 'hanjin' ? 'src/templates/hanjin-studio.jpg' : null;";
  must(A);
  s = s.replace(A, "            : pending.tpl === 'hanjin' ? 'src/templates/hanjin-studio.jpg'\n"
    + "            : pending.tpl === 'hana' ? 'src/templates/hana-overview-02.jpg' : null;");
  const B = "                    : ('scene' + (i + 2)),";
  must(B);
  const scenes = SCREENS.slice(1).map((x) => "'" + x[0] + "'").join(', ');
  s = s.replace(B, "                    : proj.tpl === 'hana' ? [" + scenes + "][i]\n"
    + '                      : (\'scene\' + (i + 2)),');
  done.push('startStudio');
}

/* ── ⑧ 새로고침 후 복원 ── */
if (s.indexOf("__tdt === 'hana'") < 0) {
  const A = "          if (__tdt === 'hanjin' && typeof applyHanjinDT === 'function') {";
  must(A);
  s = s.replace(A, [
    "          if (__tdt === 'hana' && typeof applyHanaDT === 'function') {",
    '            /* 이 화면이 15장 중 어느 것인지는 열려 있는 프로젝트의 tplScene 이 정답 */',
    "            applyHanaDT(window.__hanaSceneOf ? window.__hanaSceneOf() : localStorage.getItem('wemb-hana-screen'));",
    '          }',
    '          else ' + A.trim().replace(/^if/, 'if'),
  ].join('\n'));
  done.push('restore');
}

/* ── ⑨ 템플릿을 열 때 tpl 을 기억하는 목록에 hana 를 더한다 ── */
s = s.split("t.tpl === 'hanjin' || t.tpl === 'skhynix' || t.tpl === 'skhynix-hub'")
  .join("t.tpl === 'hanjin' || t.tpl === 'hana' || t.tpl === 'skhynix' || t.tpl === 'skhynix-hub'");
s = s.split("t.tpl === 'hanjin' || t.tpl === 'skhynix-hub' || t.screen === 'dt'")
  .join("t.tpl === 'hanjin' || t.tpl === 'hana' || t.tpl === 'skhynix-hub' || t.screen === 'dt'");

fs.writeFileSync(F, CRLF ? s.split(String.fromCharCode(10)).join(String.fromCharCode(13, 10)) : s);
console.log('patched index.html:', done.join(', '), '| +' + (s.length - before) + ' chars');
