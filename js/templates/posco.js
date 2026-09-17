/* ── POSCO KDB CCTV 관제 템플릿 연결 ── */

/* ── POSCO KDB CCTV 관제 — Figma 화면을 순수 HTML/CSS DOM 으로 재구축한 것을 얹는다 ──
   원본: Figma dj0SONcO5BySCm7yDdZrNc / 2:18441 Screen/Control Main (1920x1080, page "Page 1")
   글자는 전부 편집 가능한 실제 텍스트(Pretendard CDN), 아이콘·그래픽만 Figma 가 내보낸
   개별 svg/png(src/posco/)을 그대로 쓴다. 좌표·크기·색은 Figma 값 그대로(근사 없음).
   원본이 다크 시안이라 라이트 시트를 따로 만들어 '화면 테마'로 자유롭게 바꿀 수 있다.
   인터랙션·라이브·반응형은 src/posco-live.js(window.initPosco). */
const PK_SCREENS = {
  'main': { px: 'pkm', build: 'build_pkm', css: 'PKM_CSS', light: 'PKM_LIGHT_CSS', title: 'POSCO KDB CCTV 관제 — 메인' },
  'ack': { px: 'pka', build: 'build_pka', css: 'PKA_CSS', light: 'PKA_LIGHT_CSS', title: 'POSCO KDB CCTV 관제 — 메인(Ack 알림)' },
  'overview': { px: 'pko', build: 'build_pko', css: 'PKO_CSS', light: 'PKO_LIGHT_CSS', title: 'POSCO KDB CCTV 관제 — 종합현황' },
  'route': { px: 'pkr', build: 'build_pkr', css: 'PKR_CSS', light: 'PKR_LIGHT_CSS', title: 'POSCO KDB CCTV 관제 — 출입동선' },
  'floors': { px: 'pkf', build: 'build_pkf', css: 'PKF_CSS', light: 'PKF_LIGHT_CSS', title: 'POSCO KDB CCTV 관제 — 전체층' },
  'detail': { px: 'pkd', build: 'build_pkd', css: 'PKD_CSS', light: 'PKD_LIGHT_CSS', title: 'POSCO KDB CCTV 관제 — 단층' },
  /* SOP 대응 절차 — Figma 세 장(STEP 1 1:9688 · STEP 2 1:9770 · STEP 3 1:9852)을 한 장면으로.
     STEP 1 화면을 얹고, 라이브(installSop)가 STEP 2·3 의 Step List 를 같은 자리에 겹쳐 10초마다 넘긴다. */
  'sop': { px: 'pks1', build: 'build_pks1', css: 'PKS1_CSS', light: 'PKS1_LIGHT_CSS', extra: ['pks2', 'pks3', 'pks4'], title: 'POSCO KDB CCTV 관제 — SOP 대응 절차' },
};
const PK_ROOTS = '.pkm-root, .pka-root, .pko-root, .pkr-root, .pkf-root, .pkd-root, .pks1-root';
const PK_SEED = '#004BFF';   /* 시안 자신의 브랜드 파랑 — '색 정하기'의 시작값 */

function applyPoscoDT(which) {
  const stage = document.getElementById('dtStage');
  if (!stage) return;
  const key = PK_SCREENS[which] ? which : (localStorage.getItem('wemb-posco-screen') || 'main');
  const S = PK_SCREENS[key] || PK_SCREENS['main'];
  if (typeof window[S.build] !== 'function') return;
  try { localStorage.setItem('wemb-posco-screen', key); } catch (e) {}
  /* 고정 캔버스는 끈다 — 이 시안은 스스로 여백 없이 채운다(src/posco-live.js 의 applyFit). */
  try { if (window.__setCanvas1920) window.__setCanvas1920(false); } catch (e) {}
  stage.setAttribute('data-tpl', 'posco');
  try { syncSkxControls(); } catch (e) {}
  seedPoscoBaseColor();
  try {
    const want = localStorage.getItem('wemb-posco-mode') === 'light' ? 'light' : 'dark';
    if (typeof state !== 'undefined' && state.mode !== want) {
      state.mode = want;
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));
      if (typeof apply === 'function') apply();
    }
  } catch (e) {}
  const bn = stage.querySelector('.dt-bname');
  if (bn) bn.textContent = S.title;
  stage.querySelectorAll(PK_ROOTS).forEach((e) => {
    try { window.disposePosco && window.disposePosco(e); } catch (err) {}
    e.remove();
  });
  /* SOP 는 겹쳐 얹는 STEP 2·3 화면의 시트도 함께 싣는다(색 정하기가 그 시트를 id 로 찾는다) */
  const sheets = [[S.px + '-style', window[S.css]], [S.px + '-light-style', window[S.light]]];
  (S.extra || []).forEach(function (px) { const G = px.toUpperCase(); sheets.push([px + '-style', window[G + '_CSS']], [px + '-light-style', window[G + '_LIGHT_CSS']]); });
  sheets.forEach(function (p) {
    if (!p[1] || document.getElementById(p[0])) return;
    const st = document.createElement('style');
    st.id = p[0];
    st.textContent = p[1];
    document.head.appendChild(st);
  });
  const scr = document.createElement('div');
  scr.className = S.px + '-root';
  scr.dataset.theme = (typeof state !== 'undefined' && state.mode === 'light') ? 'light' : 'dark';
  scr.innerHTML = window[S.build]();
  const added = document.createElement('div');
  added.className = 'dt-added';
  added.innerHTML = '<div class="cols gridmode"></div>';
  scr.appendChild(added);
  stage.appendChild(scr);
  try { window.__refreshTpl && window.__refreshTpl(); } catch (e) {}
  try { window.initPosco && window.initPosco(scr); } catch (e) {}
  /* 라이브가 발생시각을 최근으로 다시 찍은 **뒤에** 기본값을 캡처해야
     새로 찍은 시각이 기본값이 되고, 사용자가 고친 글자는 캡처가 덮어 준다. */
  try { window.__dtRecaptureDefaults && window.__dtRecaptureDefaults(false); } catch (e) {}
}
window.__applyPoscoDT = applyPoscoDT;

function clearPoscoDT() {
  document.querySelectorAll(PK_ROOTS.split(', ').map((x) => '#dtStage ' + x).join(', ')).forEach((e) => {
    try { window.disposePosco && window.disposePosco(e); } catch (err) {}
    e.remove();
  });
}
window.__clearPoscoDT = clearPoscoDT;

window.__poscoSceneOf = function () {
  try {
    const list = JSON.parse(localStorage.getItem('wemb-projects') || '[]');
    const open = list.find((p) => p && p.open && p.tpl === 'posco');
    if (open && open.tplScene) return open.tplScene;
  } catch (e) {}
  const v = localStorage.getItem('wemb-posco-screen');
  return PK_SCREENS[v] ? v : 'main';
};
window.__openPoscoScreen = function (which) {
  try { localStorage.setItem('wemb-tpl-dt', 'posco'); } catch (e) {}
  applyPoscoDT(PK_SCREENS[which] ? which : 'main');
};

/* 화면끼리 잇기 — 시안 안에서 '종합현황'·'출입동선'·브레드크럼 따위를 누르면 그 장면으로 간다
   (붙이는 쪽은 src/posco-live.js 의 installGo).
   이 프로젝트에 **그 장면으로 만든 형제 화면이 있으면 그 화면을 연다** — 작업공간은 화면 하나를
   여는 구조라, 캔버스만 바꿔치우면 지금 열린 화면 기록(tplScene)과 어긋나 새로고침 때 되돌아가고
   고친 글자도 엉뚱한 화면에 저장된다. 형제가 없을 때만 제자리에서 장면을 바꾼다(낱장 미리보기와 같은 동작). */
/* 떠나기 전에 '여는 막'을 먼저 띄운다 — 홈에서 화면을 열 때와 같은 막(#openSplash)이라
   새 문서가 첫 페인트부터 그대로 이어받는다(css/base/splash.css · js/shell/routes.js).
   막이 한 번 그려진 뒤 떠나고, 탭이 가려져 rAF 가 멈춰도 떠나도록 시간 폴백을 둔다. */
function leavePosco(url, name) {
  const sp = document.getElementById('openSplash');
  if (!sp) { location.href = url; return; }
  if (name) document.documentElement.style.setProperty('--boot-name', JSON.stringify(String(name)));
  sp.classList.remove('out');
  sp.classList.add('show', 'enter');
  let gone = false;
  const go = () => { if (gone) return; gone = true; location.href = url; };
  requestAnimationFrame(() => requestAnimationFrame(go));
  setTimeout(go, 120);
}

window.__gotoPoscoScene = function (scene) {
  const key = PK_SCREENS[scene] ? scene : 'main';
  try {
    const P = window.WEMB && WEMB.projects;
    if (P) {
      const list = P.loadProjects();
      const me = list.find((x) => x.id === localStorage.getItem(P.CUR_PROJ));
      if (me && me.tpl === 'posco') {
        if ((me.tplScene || 'main') === key) return;      /* 이미 그 화면이다 */
        const sib = list
          .filter((x) => x.tpl === 'posco' && x.projectId === me.projectId && !x.deleted && (x.tplScene || 'main') === key)
          .sort((a, b) => (b.ts || 0) - (a.ts || 0))[0];
        if (sib) {
          P.persistCurrentProjectData();
          leavePosco(location.pathname + '?screen=' + encodeURIComponent(sib.id) + '#/studio', sib.name);
          return;
        }
      }
    }
  } catch (e) {}
  window.__openPoscoScreen(key);
};

/* 이 시안의 '기본 색' — 처음 열 때 '색 정하기'의 시작값을 브랜드 파랑으로 놓는다.
   시드가 그대로인 동안은 TPLTINT 가 '아직 안 바꿨다'로 보고 원본 색을 그대로 보여 준다. */
function seedPoscoBaseColor() {
  try {
    if (localStorage.getItem('wemb-posco-seeded')) return;
    localStorage.setItem('wemb-posco-seeded', '1');
    if (typeof state === 'undefined') return;
    state.source = 'seed';
    state.sourceView = 'seed';
    state.seed = PK_SEED;
    state.overrides = {};
    if (typeof apply === 'function') apply();
  } catch (e) {}
}
