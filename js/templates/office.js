/* ── 스마트 오피스 템플릿 연결 ── */

/* ── Dashboard: Smart Office — Figma 화면 54장을 순수 HTML/CSS DOM 으로 재구축한 것을 얹는다 ──
   원본: Figma WUxDt6yorbRlc8V1py86HM (홈 · 현황 · 분석 · 관리정보) · 생성기 src/office/_gen.
   글자는 전부 편집 가능한 실제 텍스트(Pretendard CDN · 영문 숫자는 KRAFTON_Font 가 있으면 그것), 아이콘 · 그래픽만 Figma 가 내보낸 개별 svg/png(src/office/).
   원본이 라이트 시안이라 처음엔 라이트로 연다(다크는 생성기가 파생, _gen/dark.js).
   인터랙션 · 라이브 · 반응형 · 차트 바꾸기 · 패널 옮기기는 src/office-live.js(window.initOffice). */
const OF_SCREENS = {
  'home': { px: 'ofha', build: 'build_ofha', css: 'OFHA_CSS', light: 'OFHA_LIGHT_CSS', title: '스마트 오피스 — 홈' },
  'home-alert': { px: 'ofhb', build: 'build_ofhb', css: 'OFHB_CSS', light: 'OFHB_LIGHT_CSS', title: '스마트 오피스 — 홈 · 알림' },
  'home-setting': { px: 'ofhc', build: 'build_ofhc', css: 'OFHC_CSS', light: 'OFHC_LIGHT_CSS', title: '스마트 오피스 — 홈 · 설정' },
  'home-account': { px: 'ofhd', build: 'build_ofhd', css: 'OFHD_CSS', light: 'OFHD_LIGHT_CSS', title: '스마트 오피스 — 홈 · 계정' },
  'home-privacy': { px: 'ofhe', build: 'build_ofhe', css: 'OFHE_CSS', light: 'OFHE_LIGHT_CSS', title: '스마트 오피스 — 홈 · 개인정보 처리방침' },
  'live-work': { px: 'ofla', build: 'build_ofla', css: 'OFLA_CSS', light: 'OFLA_LIGHT_CSS', title: '스마트 오피스 — 현황 · 업무시간' },
  'live-work-zoom': { px: 'oflb', build: 'build_oflb', css: 'OFLB_CSS', light: 'OFLB_LIGHT_CSS', title: '스마트 오피스 — 현황 · 업무시간 확대' },
  'live-after': { px: 'oflc', build: 'build_oflc', css: 'OFLC_CSS', light: 'OFLC_LIGHT_CSS', title: '스마트 오피스 — 현황 · 업무시간 종료' },
  'live-used': { px: 'ofld', build: 'build_ofld', css: 'OFLD_CSS', light: 'OFLD_LIGHT_CSS', title: '스마트 오피스 — 현황 · 사용중' },
  'live-used-zoom': { px: 'ofle', build: 'build_ofle', css: 'OFLE_CSS', light: 'OFLE_LIGHT_CSS', title: '스마트 오피스 — 현황 · 사용중 확대' },
  'live-used-popup': { px: 'oflf', build: 'build_oflf', css: 'OFLF_CSS', light: 'OFLF_LIGHT_CSS', title: '스마트 오피스 — 현황 · 사용중 팝업' },
  'live-free': { px: 'oflg', build: 'build_oflg', css: 'OFLG_CSS', light: 'OFLG_LIGHT_CSS', title: '스마트 오피스 — 현황 · 사용가능' },
  'live-free-popup': { px: 'oflh', build: 'build_oflh', css: 'OFLH_CSS', light: 'OFLH_LIGHT_CSS', title: '스마트 오피스 — 현황 · 사용가능 팝업' },
  'live-ghost': { px: 'ofli', build: 'build_ofli', css: 'OFLI_CSS', light: 'OFLI_LIGHT_CSS', title: '스마트 오피스 — 현황 · 고스트룸' },
  'live-ghost-busy': { px: 'oflj', build: 'build_oflj', css: 'OFLJ_CSS', light: 'OFLJ_LIGHT_CSS', title: '스마트 오피스 — 현황 · 고스트룸 팝업(사용불가)' },
  'live-ghost-free': { px: 'oflk', build: 'build_oflk', css: 'OFLK_CSS', light: 'OFLK_LIGHT_CSS', title: '스마트 오피스 — 현황 · 고스트룸 팝업(사용가능)' },
  'occ-map': { px: 'ofoa', build: 'build_ofoa', css: 'OFOA_CSS', light: 'OFOA_LIGHT_CSS', title: '스마트 오피스 — 분석 · 점유' },
  'occ-popup': { px: 'ofob', build: 'build_ofob', css: 'OFOB_CSS', light: 'OFOB_LIGHT_CSS', title: '스마트 오피스 — 분석 · 점유 팝업' },
  'occ-area': { px: 'ofoc', build: 'build_ofoc', css: 'OFOC_CSS', light: 'OFOC_LIGHT_CSS', title: '스마트 오피스 — 분석 · 점유 차트(영역별)' },
  'occ-group': { px: 'ofod', build: 'build_ofod', css: 'OFOD_CSS', light: 'OFOD_LIGHT_CSS', title: '스마트 오피스 — 분석 · 점유 차트(그룹별)' },
  'occ-matrix': { px: 'ofoe', build: 'build_ofoe', css: 'OFOE_CSS', light: 'OFOE_LIGHT_CSS', title: '스마트 오피스 — 분석 · 공간 활용 매트릭스' },
  'occ-matrix-hover': { px: 'ofof', build: 'build_ofof', css: 'OFOF_CSS', light: 'OFOF_LIGHT_CSS', title: '스마트 오피스 — 분석 · 공간 활용 매트릭스 호버' },
  'occ-raw': { px: 'ofog', build: 'build_ofog', css: 'OFOG_CSS', light: 'OFOG_LIGHT_CSS', title: '스마트 오피스 — 분석 · 점유 RAW DATA' },
  'bridge': { px: 'ofba', build: 'build_ofba', css: 'OFBA_CSS', light: 'OFBA_LIGHT_CSS', title: '스마트 오피스 — 분석 · 스페이스 브릿지' },
  'bridge-node': { px: 'ofbb', build: 'build_ofbb', css: 'OFBB_CSS', light: 'OFBB_LIGHT_CSS', title: '스마트 오피스 — 분석 · 스페이스 브릿지 노드 호버' },
  'bridge-link': { px: 'ofbc', build: 'build_ofbc', css: 'OFBC_CSS', light: 'OFBC_LIGHT_CSS', title: '스마트 오피스 — 분석 · 스페이스 브릿지 라인 호버' },
  'bridge-chart': { px: 'ofbd', build: 'build_ofbd', css: 'OFBD_CSS', light: 'OFBD_LIGHT_CSS', title: '스마트 오피스 — 분석 · 스페이스 브릿지 차트' },
  'bridge-raw': { px: 'ofbe', build: 'build_ofbe', css: 'OFBE_CSS', light: 'OFBE_LIGHT_CSS', title: '스마트 오피스 — 분석 · 공간분석 RAW DATA' },
  'pattern-main': { px: 'ofpa', build: 'build_ofpa', css: 'OFPA_CSS', light: 'OFPA_LIGHT_CSS', title: '스마트 오피스 — 분석 · 업무 패턴' },
  'pattern-meeting': { px: 'ofpb', build: 'build_ofpb', css: 'OFPB_CSS', light: 'OFPB_LIGHT_CSS', title: '스마트 오피스 — 분석 · 회의실 패턴 분석' },
  'pattern-desk': { px: 'ofpc', build: 'build_ofpc', css: 'OFPC_CSS', light: 'OFPC_LIGHT_CSS', title: '스마트 오피스 — 분석 · 스탠딩 데스크 사용 시간' },
  'pattern-collab': { px: 'ofpd', build: 'build_ofpd', css: 'OFPD_CSS', light: 'OFPD_LIGHT_CSS', title: '스마트 오피스 — 분석 · 협업 · 세렌디피티 분석' },
  'pattern-raw': { px: 'ofpe', build: 'build_ofpe', css: 'OFPE_CSS', light: 'OFPE_LIGHT_CSS', title: '스마트 오피스 — 분석 · 업무패턴 RAW DATA' },
  'room-main': { px: 'ofra', build: 'build_ofra', css: 'OFRA_CSS', light: 'OFRA_LIGHT_CSS', title: '스마트 오피스 — 분석 · 고스트룸' },
  'room-chart': { px: 'ofrb', build: 'build_ofrb', css: 'OFRB_CSS', light: 'OFRB_LIGHT_CSS', title: '스마트 오피스 — 분석 · 고스트룸 차트' },
  'room-usage': { px: 'ofrc', build: 'build_ofrc', css: 'OFRC_CSS', light: 'OFRC_LIGHT_CSS', title: '스마트 오피스 — 분석 · 회의실 별 실사용률' },
  'room-raw': { px: 'ofrd', build: 'build_ofrd', css: 'OFRD_CSS', light: 'OFRD_LIGHT_CSS', title: '스마트 오피스 — 분석 · 회의실 RAW DATA' },
  'count-main': { px: 'ofca', build: 'build_ofca', css: 'OFCA_CSS', light: 'OFCA_LIGHT_CSS', title: '스마트 오피스 — 분석 · 카운팅' },
  'count-single': { px: 'ofcb', build: 'build_ofcb', css: 'OFCB_CSS', light: 'OFCB_LIGHT_CSS', title: '스마트 오피스 — 분석 · 카운팅 팝업(단일)' },
  'count-multi': { px: 'ofcc', build: 'build_ofcc', css: 'OFCC_CSS', light: 'OFCC_LIGHT_CSS', title: '스마트 오피스 — 분석 · 카운팅 팝업(다중)' },
  'count-gate': { px: 'ofcd', build: 'build_ofcd', css: 'OFCD_CSS', light: 'OFCD_LIGHT_CSS', title: '스마트 오피스 — 분석 · 카운팅 출입구' },
  'count-floor': { px: 'ofce', build: 'build_ofce', css: 'OFCE_CSS', light: 'OFCE_LIGHT_CSS', title: '스마트 오피스 — 분석 · 카운팅 층' },
  'count-building': { px: 'ofcf', build: 'build_ofcf', css: 'OFCF_CSS', light: 'OFCF_LIGHT_CSS', title: '스마트 오피스 — 분석 · 카운팅 건물' },
  'count-toilet': { px: 'ofcg', build: 'build_ofcg', css: 'OFCG_CSS', light: 'OFCG_LIGHT_CSS', title: '스마트 오피스 — 분석 · 카운팅 화장실' },
  'count-brush': { px: 'ofch', build: 'build_ofch', css: 'OFCH_CSS', light: 'OFCH_LIGHT_CSS', title: '스마트 오피스 — 분석 · 카운팅 양치실' },
  'count-raw': { px: 'ofci', build: 'build_ofci', css: 'OFCI_CSS', light: 'OFCI_LIGHT_CSS', title: '스마트 오피스 — 분석 · 카운팅 RAW DATA' },
  'admin-home': { px: 'ofma', build: 'build_ofma', css: 'OFMA_CSS', light: 'OFMA_LIGHT_CSS', title: '스마트 오피스 — 관리정보 · 홈 화면 관리' },
  'admin-home-popup': { px: 'ofmb', build: 'build_ofmb', css: 'OFMB_CSS', light: 'OFMB_LIGHT_CSS', title: '스마트 오피스 — 관리정보 · 홈 화면 관리 팝업' },
  'admin-time': { px: 'ofmc', build: 'build_ofmc', css: 'OFMC_CSS', light: 'OFMC_LIGHT_CSS', title: '스마트 오피스 — 관리정보 · 시간 설정' },
  'admin-space': { px: 'ofmd', build: 'build_ofmd', css: 'OFMD_CSS', light: 'OFMD_LIGHT_CSS', title: '스마트 오피스 — 관리정보 · 공간 설정' },
  'admin-space-popup': { px: 'ofme', build: 'build_ofme', css: 'OFME_CSS', light: 'OFME_LIGHT_CSS', title: '스마트 오피스 — 관리정보 · 공간 설정 팝업' },
  'admin-sensor': { px: 'ofmf', build: 'build_ofmf', css: 'OFMF_CSS', light: 'OFMF_LIGHT_CSS', title: '스마트 오피스 — 관리정보 · 센서 관리' },
  'admin-sensor-popup': { px: 'ofmg', build: 'build_ofmg', css: 'OFMG_CSS', light: 'OFMG_LIGHT_CSS', title: '스마트 오피스 — 관리정보 · 센서 관리 팝업' },
  'admin-account': { px: 'ofmh', build: 'build_ofmh', css: 'OFMH_CSS', light: 'OFMH_LIGHT_CSS', title: '스마트 오피스 — 관리정보 · 관리자 계정 목록' },
};
const OF_ROOTS = '.ofha-root, .ofhb-root, .ofhc-root, .ofhd-root, .ofhe-root, .ofla-root, .oflb-root, .oflc-root, .ofld-root, .ofle-root, .oflf-root, .oflg-root, .oflh-root, .ofli-root, .oflj-root, .oflk-root, .ofoa-root, .ofob-root, .ofoc-root, .ofod-root, .ofoe-root, .ofof-root, .ofog-root, .ofba-root, .ofbb-root, .ofbc-root, .ofbd-root, .ofbe-root, .ofpa-root, .ofpb-root, .ofpc-root, .ofpd-root, .ofpe-root, .ofra-root, .ofrb-root, .ofrc-root, .ofrd-root, .ofca-root, .ofcb-root, .ofcc-root, .ofcd-root, .ofce-root, .ofcf-root, .ofcg-root, .ofch-root, .ofci-root, .ofma-root, .ofmb-root, .ofmc-root, .ofmd-root, .ofme-root, .ofmf-root, .ofmg-root, .ofmh-root';
/* 시안 자신의 주조색 — 파랑보라(#657AFF). '색 정하기'의 시작값 */
const OF_SEED = '#657AFF';

/* 헤더 메뉴로 넘어왔으면 떠난 화면의 밝기 · 색을 그대로 잇는다 — 상태 묶음이 화면마다 따로라 안 이으면 다크 · 기본 색으로 돌아간다.
   main.js 가 이 화면을 그린 뒤에 저장 테마를 복원하므로(restoreCurrentTheme) 그 복원이 끝난 다음 차례에 입힌다. */
function applyOfficeCarry() {
  let c = null;
  try {
    const raw = sessionStorage.getItem('wemb-office-carry');
    if (!raw) return;
    sessionStorage.removeItem('wemb-office-carry');
    c = JSON.parse(raw);
  } catch (e) { return; }
  setTimeout(() => {
    try {
      if (typeof state === 'undefined') return;
      const mode = c.mode === 'dark' ? 'dark' : 'light';
      localStorage.setItem('wemb-office-mode', mode);
      state.mode = mode;
      state.source = c.source || 'seed';
      state.sourceView = c.source || 'seed';
      state.seed = c.seed || OF_SEED;
      state.subHex = c.subHex || null;
      state.mapMode = c.mapMode || 'auto';
      state.imgCols = c.imgCols || null;
      if (c.adjust) state.adjust = c.adjust;
      state.overrides = c.overrides || {};
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === mode));
      if (typeof apply === 'function') apply();
      document.querySelectorAll(OF_ROOTS).forEach((r) => { r.dataset.theme = mode; });
      if (window.__applyTplTint) window.__applyTplTint();
    } catch (e) {}
  }, 0);
}

function applyOfficeDT(which) {
  const stage = document.getElementById('dtStage');
  if (!stage) return;
  const key = OF_SCREENS[which] ? which : (localStorage.getItem('wemb-office-screen') || 'home');
  const S = OF_SCREENS[key] || OF_SCREENS['home'];
  /* 화면 모듈은 필요할 때 싣는다(js/core/tpl-modules.js) — 아직이면 싣고 나서 다시 그린다 */
  if (window.WEMB && WEMB.tplModules && WEMB.tplModules.wait([S.build], () => applyOfficeDT(key))) return;
  if (typeof window[S.build] !== 'function') return;
  try { localStorage.setItem('wemb-office-screen', key); } catch (e) {}
  /* 고정 캔버스는 끈다 — 이 시안은 스스로 여백 없이 채운다(src/office-live.js 의 installFit) */
  try { if (window.__setCanvas1920) window.__setCanvas1920(false); } catch (e) {}
  stage.setAttribute('data-tpl', 'office');
  try { syncSkxControls(); } catch (e) {}
  seedOfficeBaseColor();
  applyOfficeCarry();
  try {
    const want = localStorage.getItem('wemb-office-mode') === 'dark' ? 'dark' : 'light';
    if (typeof state !== 'undefined' && state.mode !== want) {
      state.mode = want;
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));
      if (typeof apply === 'function') apply();
    }
  } catch (e) {}
  const bn = stage.querySelector('.dt-bname');
  if (bn) bn.textContent = S.title;
  stage.querySelectorAll(OF_ROOTS).forEach((e) => {
    try { window.disposeOffice && window.disposeOffice(e); } catch (err) {}
    e.remove();
  });
  /* 시트 id = 'wrt-style' · 'wrt-light-style' (색 바꾸기가 이 id 로 시트를 찾는다) */
  [[S.css, S.px + '-style'], [S.light, S.px + '-light-style']].forEach(function (a) {
    if (!window[a[0]] || document.getElementById(a[1])) return;
    const st = document.createElement('style');
    st.id = a[1];
    st.textContent = window[a[0]];
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
  try { window.initOffice && window.initOffice(scr); } catch (e) {}
  /* 라이브가 시계 · 발생일시를 지금으로 다시 찍은 **뒤에** 기본값을 캡처해야
     새 시각이 기본값이 되고, 사용자가 고친 글자는 캡처가 덮어 준다. */
  try { window.__dtRecaptureDefaults && window.__dtRecaptureDefaults(false); } catch (e) {}
  try { window.__applyTplTint && window.__applyTplTint(); } catch (e) {}
}
window.__applyOfficeDT = applyOfficeDT;

function clearOfficeDT() {
  document.querySelectorAll(OF_ROOTS.split(', ').map((x) => '#dtStage ' + x).join(', ')).forEach((e) => {
    try { window.disposeOffice && window.disposeOffice(e); } catch (err) {}
    e.remove();
  });
}
window.__clearOfficeDT = clearOfficeDT;

window.__officeSceneOf = function () {
  try {
    const P = window.WEMB && WEMB.projects;
    if (P) {
      const me = P.loadProjects().find((x) => x.id === localStorage.getItem(P.CUR_PROJ));
      if (me && me.tpl === 'office' && OF_SCREENS[me.tplScene]) return me.tplScene;
    }
  } catch (e) {}
  const v = localStorage.getItem('wemb-office-screen');
  return OF_SCREENS[v] ? v : 'home';
};
const OF_BUILDS = (k) => [(OF_SCREENS[k] || OF_SCREENS.home).build];
WEMB.screenSwitch.register('office', { sceneOf: (s) => s.tplScene || 'home', draw: applyOfficeDT, builds: OF_BUILDS });
window.__openOfficeScreen = function (which) {
  try { localStorage.setItem('wemb-tpl-dt', 'office'); } catch (e) {}
  const key = OF_SCREENS[which] ? which : 'home';
  WEMB.screenSwitch.transition(() => applyOfficeDT(key), OF_BUILDS(key));
};

/* 화면끼리 잇기 — 헤더 메뉴 · 단추가 그 장면으로 간다(붙이는 쪽은 src/office-live.js 의 installNav).
   같은 프로젝트에 그 장면으로 만든 형제 화면이 있으면 그 화면을 연다 — 캔버스만 바꿔치우면 열린 화면 기록(tplScene)과 어긋나
   새로고침 때 되돌아간다. 문서를 다시 읽지 않고 오른쪽 화면만 바꾼다(js/core/screen-switch.js).
   아래 막은 그럴 수 없을 때(발표 화면)만 쓰는 예전 길이다. */
function leaveOffice(url, name) {
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
window.__gotoOfficeScene = function (scene) {
  const key = OF_SCREENS[scene] ? scene : 'home';
  try {
    const P = window.WEMB && WEMB.projects;
    if (P) {
      const list = P.loadProjects();
      const me = list.find((x) => x.id === localStorage.getItem(P.CUR_PROJ));
      if (me && me.tpl === 'office') {
        if ((me.tplScene || 'home') === key) return;
        const sib = list
          .filter((x) => x.tpl === 'office' && x.projectId === me.projectId && !x.deleted && (x.tplScene || 'home') === key)
          .sort((a, b) => (b.ts || 0) - (a.ts || 0))[0];
        if (sib) {
          try {
            if (typeof state !== 'undefined') sessionStorage.setItem('wemb-office-carry', JSON.stringify({ mode: state.mode, source: state.source, seed: state.seed, subHex: state.subHex, mapMode: state.mapMode, imgCols: state.imgCols, adjust: state.adjust, overrides: state.overrides }));
          } catch (e) {}
          if (WEMB.screenSwitch.toScreen(sib)) return;
          P.persistCurrentProjectData();
          leaveOffice(location.pathname + '?screen=' + encodeURIComponent(sib.id) + '#/studio', sib.name);
          return;
        }
      }
    }
  } catch (e) {}
  window.__openOfficeScreen(key);
};

/* 이 시안의 '기본 색' — 처음 열 때 '색 정하기'의 시작값을 시안 주조색으로 놓는다.
   시드가 그대로인 동안은 TPLTINT 가 '아직 안 바꿨다'로 보고 원본 색을 그대로 보여 준다. */
function seedOfficeBaseColor() {
  try {
    if (localStorage.getItem('wemb-office-seeded')) return;
    localStorage.setItem('wemb-office-seeded', '1');
    if (typeof state === 'undefined') return;
    state.source = 'seed';
    state.sourceView = 'seed';
    state.seed = OF_SEED;
    state.overrides = {};
    if (typeof apply === 'function') apply();
  } catch (e) {}
}
