/* ── 테마 적용 · 색 소스 전환 · 현재 팔레트 카드 ── */

function apply() {
  /* 생성된 팔레트를 오른쪽 콘텐츠(.main)와 왼쪽 사이드바(.sidebar) 모두에 적용 —
     왼쪽 옵션창에서 고른 라이트/다크 모드를 왼쪽 메뉴창(사이드바)도 함께 따라감 */
  const version = state.version || 'flat';
  /* 툴 크롬(사이드바·모달)은 생성 테마와 분리해 항상 고정된 중립 모노톤 유지 —
     html data-mode는 'dark'로 고정하여 본문 밖 모달 프레임이 프리뷰 밝기를 따라가지 않음 */
  document.documentElement.setAttribute('data-mode', 'dark');
  const main = document.querySelector('.main');
  let coreMap;
  let entMap = null;
  if (version === 'enterprise') {
    const T = genEnterprise(state);
    entMap = T;
    coreMap = entCoreMap(T);
    /* 사용자가 직접 지정한 색(overrides)을 코어 색에도 반영 */
    for (const k in state.overrides) if (coreMap[k] != null) coreMap[k] = state.overrides[k];
    /* 오른쪽 콘텐츠(.main): 미세조정(색상 이동·채도·명도)까지 반영 */
    if (main) {
      main.setAttribute('data-mode', state.mode);
      main.setAttribute('data-version', 'enterprise');
      for (const k in EV) main.style.setProperty(EV[k], T[k]);
      for (const k in RV) main.style.setProperty(RV[k], coreMap[k]);
      /* 강조색 위 칩 글자색 — 흰/검 중 대비 높은 쪽 자동 선택 */
      main.style.setProperty('--on-point', contrast(coreMap['point/main']));
      main.style.setProperty('--on-accent', contrast(T.accent));
      main.style.setProperty('--on-danger', contrast(coreMap['danger']));
    }
    /* 사이드바는 테마를 적용하지 않음 — :root의 고정 중립 모노톤 크롬 유지 */
  } else {
    coreMap = computeHexMap(state);
    /* 오른쪽 콘텐츠(.main): 미세조정까지 반영 */
    if (main) {
      main.setAttribute('data-mode', state.mode);
      main.setAttribute('data-version', 'flat');
      for (const k in RV) main.style.setProperty(RV[k], coreMap[k]);
      main.style.setProperty('--on-point', contrast(coreMap['point/main']));
      main.style.setProperty('--on-danger', contrast(coreMap['danger']));
    }
    /* 사이드바는 테마를 적용하지 않음 — :root의 고정 중립 모노톤 크롬 유지 */
  }
  /* 접힘 햄버거 버튼(#opener)이 프리뷰 위에 뜰 때 프리뷰 배경과 어울리도록 노출 */
  document.documentElement.style.setProperty('--preview-page', coreMap['bg/page']);
  document.documentElement.style.setProperty('--preview-text', coreMap['text/strong']);
  document.getElementById('seed').value = normHex(state.seed);
  renderCurrentPalette(coreMap, entMap);
  refreshSourceUI();
  updateContrastWarn(); /* (1) 실시간 대비 경고 갱신 */
  scheduleHistory(); /* 변경 히스토리에 디바운스로 기록 */
  enhanceEnterpriseBars(main);
  /* 이천 FMS 두 시안(메인·항온항습기 상세)의 다크/라이트는 색 다시 칠하기(디바운스)와 달리
     즉시 반응해야 한다 — '화면 테마' 버튼을 누른 순간 바로 바뀌게 여기서 먼저 맞춘다
     (색조는 아래 틴트가 이어서 맞춘다). */
  try {
    const dm = state.mode === 'dark' ? 'dark' : 'light';
    document.querySelectorAll('.skv-root, .skh-root').forEach((r) => { r.dataset.theme = dm; });
    /* 에셋 라이브러리 썸네일도 같은 밝기로 — 에셋이 실제 화면에 놓였을 때의 모습으로 보이게 */
    const lg = document.getElementById('libGrid');
    if (lg) lg.dataset.theme = dm;
    window.__wembThemeThumbs && window.__wembThemeThumbs();
  } catch (e) {}
  try { window.__applyTplTint && window.__applyTplTint(); } catch (e) {} /* 템플릿 시안도 같은 색조로 */
}
/* ===== 활성 색상 소스 관리 — 한 번에 하나만 활성, 나머지는 대기(비활성) ===== */
const srcAccs = {
  seed: document.querySelector('.acc[data-src="seed"]'),
  image: document.querySelector('.acc[data-src="image"]'),
  preset: document.querySelector('.acc[data-src="preset"]'),
};
function clearImageUI() {
  document.getElementById('imgprev').innerHTML = '';
  document.getElementById('imgname').innerHTML = '';
  const f = document.getElementById('imgfile');
  if (f) f.value = '';
}
function refreshSourceUI() {
  const cur = state.source || 'seed';
  /* 화면에 보일 패널(탭) — 세그먼트가 정한 view. 아직 없으면 실제 소스를 따름 */
  const view = state.sourceView || cur;
  for (const key in srcAccs) {
    const el = srcAccs[key];
    if (!el) continue;
    el.classList.toggle('src-active', view === key);
    el.classList.toggle('src-idle', view !== key);
    el.open = view === key; /* 활성 방식만 펼쳐 유지 (세그먼트가 제어) */
  }
  /* '색 고르기' 옆 도움말도 지금 보이는 방식의 것으로 (아코디언 헤더에서 옮겨 옴) */
  document.querySelectorAll('.substep .srchelp').forEach((h) => h.classList.toggle('on', h.dataset.srchelp === view));
  const swprev = document.getElementById('swprev');
  const hex = document.getElementById('hex');
  if (cur === 'seed') {
    swprev.classList.remove('empty');
    swprev.style.background = normHex(state.seed);
    hex.value = normHex(state.seed).toUpperCase();
    hex.placeholder = '';
  } else {
    swprev.classList.add('empty');
    swprev.style.removeProperty('background');
    hex.value = '';
    hex.placeholder = cur === 'preset' ? '추천 테마 사용 중' : '이미지 추출 사용 중';
  }
  /* 미세 조정은 '기준 색'에서만 사용 가능 — 다른 소스면 컨트롤 비활성 */
  ['adjH', 'adjS', 'adjL', 'adjReset'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.disabled = cur !== 'seed';
  });
  updateAccSummaries();
  updateSourceSeg(); /* (2) 상단 소스 세그먼트 활성 표시 동기화 */
}
/* 아코디언 접힘 상태 요약값 — 펼치지 않고도 현재 설정을 한눈에 (예: 기준 색 ● #4A9EFF) */
function updateAccSummaries() {
  const seedVal = document.getElementById('seedVal');
  if (seedVal) {
    const h = normHex(state.seed).toUpperCase();
    seedVal.innerHTML = `<i style="background:${h}"></i>${h}`;
  }
  const imageVal = document.getElementById('imageVal');
  if (imageVal) {
    const nm = (document.getElementById('imgname')?.textContent || '').split('·')[0].trim();
    imageVal.textContent = nm || '';
  }
  const presetVal = document.getElementById('presetVal');
  if (presetVal) {
    const sel = document.querySelector('#trend .trendchip.sel, #gallery .pcard.sel');
    presetVal.textContent = sel ? (sel.getAttribute('title') || sel.getAttribute('aria-label') || '적용됨').trim() : '';
  }
}
/* 미세 조정 값과 슬라이더 UI를 0으로 초기화 */
function resetAdjust() {
  state.adjust = { h: 0, s: 0, l: 0 };
  ['adjH', 'adjS', 'adjL'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = 0;
  });
}
/* 소스 전환 — 새 소스를 활성화하고, 사용하지 않는 소스의 내용은 비움 */
function setSource(src) {
  state.source = src;
  state.sourceView = src; /* 실제 소스가 바뀌면 그 방식의 패널을 보여줌 */
  if (src !== 'image') clearImageUI(); /* 다른 방식으로 바꾸면 올렸던 이미지는 제거 */
  if (src !== 'preset') clearPresetSelection(); /* 추천 테마 외 방식이면 선택 표시 해제 */
  if (src !== 'seed') resetAdjust(); /* 다른 그룹으로 가면 기존 미세 조정은 초기화 */
  refreshSourceUI();
}
/* 추천 테마 선택 표시 — 현재 적용 중인 항목 하나만 강조 */
function clearPresetSelection() {
  document.querySelectorAll('#trend .trendchip.sel, #gallery .pcard.sel').forEach((e) => e.classList.remove('sel'));
}
function markPreset(el) {
  clearPresetSelection();
  if (el) el.classList.add('sel');
}
/* 현재 적용된 팔레트의 색들을 '컬러 모음' 카드처럼 표시 (클릭하면 색상코드 복사) */
const CURPAL_ROLES = [
  ['bg/page', '배경'],
  ['bg/surface', '표면'],
  ['bg/accent', '강조 배경'],
  ['line', '구분선'],
  ['point/main', '강조 1'],
  ['point/sub', '강조 2'],
  ['text/strong', '본문'],
  ['text/weak', '보조 글자'],
  ['danger', '경고'],
  ['warning', '주의'],
];
/* 검증표에서 '이 역할은 사이드바에 고칠 칩이 있는가'를 판단할 때 쓴다 */
const CURPAL_KEYS = new Set(CURPAL_ROLES.map(([k]) => k));
const curpalEl = document.getElementById('curpal');
/* 도착지에 띄워 둘 '이 색이 걸린 검사' 카드가 어느 역할 것인지 — null이면 안 띄움.
   숫자를 실시간으로 갱신해야 해서 상태로 들고 있다(갱신 훅은 updateContrastWarn).
   **선언 위치가 중요하다**: updateContrastWarn은 초기 apply() 중에도 불리는데,
   let은 호이스팅돼도 TDZ라 선언보다 먼저 읽으면 예외가 난다 → curpalEl 옆(=apply보다 위)에 둔다. */
let noteRole = null;
let noteDoneTimer = null;
const COPY_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
const CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
function renderCurrentPalette(hex) {
  const circleKeys = ['bg/page', 'bg/surface', 'point/main', 'point/sub', 'text/strong'];
  const circles = circleKeys.map((k) => `<i data-c="${k}" style="background:${hex[k]}"></i>`).join('');
  const hasOv = Object.keys(state.overrides).length > 0;
  const chips = CURPAL_ROLES.map(([k, label]) => {
    const ov = !!state.overrides[k];
    return (
      `<div class="swhex${ov ? ' ov' : ''}" data-k="${k}">` +
      `<span class="swc" title="${label} 색 바꾸기 — 눌러서 색상 선택기를 여세요"><i style="background:${hex[k]}"></i><input type="color" value="${hex[k].toLowerCase()}" aria-label="${label} 색 선택"></span>` +
      `<span class="wrap"><span class="rl">${label}<b class="ovd" title="직접 지정한 색">●</b></span>` +
      `<input class="hx" type="text" value="${hex[k]}" spellcheck="false" maxlength="7" title="${label} 색상 코드 직접 입력 (예: ${hex[k]}) — Enter로 적용"></span>` +
      `<button class="cpy" type="button" title="색상 코드 복사">${COPY_SVG}</button>` +
      `</div>`
    );
  }).join('');
  const open = !!state.curpalOpen;
  curpalEl.innerHTML =
    `<div class="pcard"><div class="phead"><span class="pname">현재 팔레트 <span class="ko">색칸=선택기 · 글자=직접입력</span></span>` +
    `<button class="ghostbtn cpreset" type="button" title="직접 바꾼 색을 모두 지우고 자동 생성값으로 되돌려요"${hasOv ? '' : ' disabled'}>색 초기화</button></div>` +
    `<div class="circles">${circles}</div>` +
    `<button class="cptoggle${open ? ' open' : ''}" type="button" aria-expanded="${open}" title="개별 색상(색칸·코드·복사)을 펼치거나 접어요"><span class="lbl">개별 색상 ${open ? '접기' : '펼치기'}</span> <span class="cnt">(${CURPAL_ROLES.length})</span> <span class="chev">▾</span></button>` +
    `<div class="swhexes"${open ? '' : ' hidden'}>${chips}</div></div>`;
  curpalEl.classList.add('show');
  curpalEl.querySelectorAll('.swhex').forEach((row) => {
    const k = row.dataset.k;
    const colorInput = row.querySelector('input[type=color]');
    const hxInput = row.querySelector('.hx');
    const swatch = row.querySelector('.swc i');
    const setOverride = (val) => {
      val = val.toUpperCase();
      state.overrides[k] = val;
      document.querySelector('.main').style.setProperty(RV[k], val);
      swatch.style.background = val;
      colorInput.value = val.toLowerCase();
      hxInput.value = val;
      row.classList.add('ov');
      const c = curpalEl.querySelector(`.circles i[data-c="${k}"]`);
      if (c) c.style.background = val;
      const rb = curpalEl.querySelector('.cpreset');
      if (rb) rb.disabled = false;
      scheduleHistory(); /* 색 직접 지정도 히스토리에 기록 */
      updateContrastWarn(); /* (1) 직접 지정 색도 즉시 대비 검사 */
    };
    colorInput.oninput = () => setOverride(colorInput.value);
    hxInput.onchange = () => {
      const v = hxInput.value.trim();
      if (/^#?[0-9a-fA-F]{6}$/.test(v)) setOverride(v[0] === '#' ? v : '#' + v);
      else hxInput.value = state.overrides[k] || hex[k]; /* 잘못된 값이면 되돌림 */
    };
    row.querySelector('.cpy').onclick = (e) => {
      e.stopPropagation();
      if (navigator.clipboard) navigator.clipboard.writeText(hxInput.value).catch(() => {});
      const btn = e.currentTarget;
      btn.classList.add('done');
      btn.innerHTML = CHECK_SVG;
      setTimeout(() => {
        btn.classList.remove('done');
        btn.innerHTML = COPY_SVG;
      }, 900);
    };
  });
  const resetBtn = curpalEl.querySelector('.cpreset');
  if (resetBtn)
    resetBtn.onclick = () => {
      state.overrides = {};
      apply();
    };
  /* 개별 색상 펼치기/접기 — 기본은 접힘, 상태는 재렌더에도 유지 */
  const tg = curpalEl.querySelector('.cptoggle');
  const sw = curpalEl.querySelector('.swhexes');
  if (tg && sw)
    tg.onclick = () => {
      state.curpalOpen = !state.curpalOpen;
      const o = state.curpalOpen;
      tg.classList.toggle('open', o);
      tg.setAttribute('aria-expanded', o);
      tg.querySelector('.lbl').textContent = '개별 색상 ' + (o ? '접기' : '펼치기');
      if (o) sw.removeAttribute('hidden');
      else sw.setAttribute('hidden', '');
    };
}
document.getElementById('seed').oninput = (e) => {
  state.seed = e.target.value;
  state.subHex = null;
  state.mapMode = 'auto';
  setSource('seed');
  apply();
};
document.getElementById('hex').onchange = (e) => {
  let v = e.target.value.trim();
  if (/^#?[0-9a-fA-F]{6}$/.test(v)) {
    state.seed = v[0] === '#' ? v : '#' + v;
    state.subHex = null;
    state.mapMode = 'auto';
    setSource('seed');
    apply();
  }
};
