/* ── 대시보드 편집 — 패널 배치 · 내용 수정 ── */

/* 차트 탭 클릭 시 데이터 갱신은 DashCharts 모듈에서 처리(현재 종류가 기본형일 때만) */
/* 진행률 막대의 값은 차트 호버 툴팁(.prow 위임 핸들러)이 패널·구간 제목까지 함께
   보여 주므로, 예전의 네이티브 title 툴팁은 겹쳐 뜨지 않도록 걷어냈다. */

/* ===== 대시보드 편집: 패널 배치(드래그) + 내용(텍스트) 수정 — 자동 저장 ===== */
(function () {
  const stage = document.querySelector('.stage');
  const cols = document.querySelector('.cols');
  if (!cols || !stage) return;
  /* 대시보드는 페이지(진입·인증 / 종합 현황 ...)마다 .cols 가 따로 있다.
     예전엔 첫 번째 .cols 하나에만 편집/드래그를 걸어, 다른 페이지에서는 이동이 전혀 되지 않았다.
     -> 아래 헬퍼로 모든 페이지를 대상으로 하고, 이벤트는 stage 위임으로 받는다. */
  const colsAll = () => [...stage.querySelectorAll('.cols')];
  const colsOf = (el) => (el && el.closest ? el.closest('.cols') : null) || cols;
  const pageKeyOf = (c) => { const dp = c && c.closest ? c.closest('.dashpage') : null; return (dp && dp.dataset.page) || 'main'; };

  /* ---------- 1) 패널 배치 ---------- */
  const LK = 'wemb-dash-layout';
  /* pid 는 모든 페이지를 통틀어 유일하게 부여 */
  (function assignPids(){ let i=0; stage.querySelectorAll('.cols .panel').forEach((p)=>{ if(!p.dataset.pid) p.dataset.pid='p'+(i++); }); })();
  /* 배치 캡처 — 열(.col)이 있는 레이아웃과, 열 없이 패널이 .cols 바로 아래 놓이는
     그리드/모듈 레이아웃을 모두 지원한다. 예전엔 .col 만 훑어서 모듈형은 항상 빈 배열([])로
     저장됐고, 그래서 위젯을 옮겨도 저장이 안 돼 다시 그려질 때 원래대로 되돌아갔다. */
  const captureLayoutOf = (c) => {
    const colEls = [...c.querySelectorAll(':scope > .col')];
    if (colEls.length) return colEls.map((col) => [...col.querySelectorAll(':scope > .panel')].map((p) => p.dataset.pid));
    return [[...c.querySelectorAll(':scope > .panel')].map((p) => p.dataset.pid)];
  };
  const captureLayout = () => captureLayoutOf(cols);
  function applyLayoutTo(c, layout) {
    const colEls = [...c.querySelectorAll(':scope > .col')];
    const byId = {};
    c.querySelectorAll('.panel').forEach((p) => { if (p.dataset.pid) byId[p.dataset.pid] = p; });
    if (colEls.length) {
      layout.forEach((ids, ci) => {
        const col = colEls[ci];
        if (col && Array.isArray(ids)) ids.forEach((id) => byId[id] && col.appendChild(byId[id]));
      });
    } else {
      /* 열이 없는 배치 — .cols 바로 아래 순서대로 다시 붙인다 */
      (layout[0] || []).forEach((id) => { if (byId[id]) c.appendChild(byId[id]); });
    }
  }
  function applyLayout(layout) { applyLayoutTo(cols, layout); }
  const DEFAULT_LAYOUT = captureLayout();
  /* 페이지마다 배치를 따로 저장 { overview:[...], production:[...] } */
  const saveLayout = () => {
    try {
      const all = {};
      colsAll().forEach((c) => { all[pageKeyOf(c)] = captureLayoutOf(c); });
      localStorage.setItem(LK, JSON.stringify(all));
    } catch (e) {}
  };
  const loadLayout = () => {
    try {
      const r = localStorage.getItem(LK);
      if (!r) return;
      const d = JSON.parse(r);
      if (Array.isArray(d)) { applyLayoutTo(cols, d); return; }   /* 구버전 호환 */
      colsAll().forEach((c) => { const l = d[pageKeyOf(c)]; if (l) applyLayoutTo(c, l); });
    } catch (e) {}
  };

  /* ---------- 2) 내용(텍스트) ---------- */
  const CK = 'wemb-dash-content';
  const CSEL = '.kpi .lab, .kpi .val, .kpi .sub, .ph h3, .nav a, .brand .sub, .panel th, .panel td, .logrow span, .dleg .row, .prow .nm, .prow .pv, .sec-lab';
  const textEls = [...stage.querySelectorAll(CSEL)];
  textEls.forEach((el, i) => (el.dataset.eid = 'e' + i));
  const DEFAULT_CONTENT = {};
  textEls.forEach((el) => (DEFAULT_CONTENT[el.dataset.eid] = el.innerHTML));
  const saveContent = () => {
    const m = {};
    textEls.forEach((el) => {
      if (el.innerHTML !== DEFAULT_CONTENT[el.dataset.eid]) m[el.dataset.eid] = el.innerHTML;
    });
    try {
      localStorage.setItem(CK, JSON.stringify(m));
    } catch (e) {}
  };
  const loadContent = () => {
    try {
      const r = localStorage.getItem(CK);
      if (!r) return;
      const m = JSON.parse(r);
      textEls.forEach((el) => {
        if (m[el.dataset.eid] != null) el.innerHTML = m[el.dataset.eid];
      });
    } catch (e) {}
  };

  /* ---------- 3) 모드 토글 (배치/내용 상호 배타) ---------- */
  const layoutBtn = document.getElementById('editToggle');
  const layoutLbl = layoutBtn.querySelector('.lbl');
  const contentBtn = document.getElementById('contentToggle');
  const contentLbl = contentBtn.querySelector('.lbl');
  const banner = document.getElementById('editBanner');
  const bannerText = document.getElementById('editBannerText');
  let layoutMode = false,
    contentMode = false,
    dragEl = null;

  function refreshBanner() {
    if (layoutMode) bannerText.textContent = '위젯을 다른 위젯 위로 끌어다 놓으면 서로 자리가 바뀝니다. 변경 내용은 자동 저장됩니다.';
    else if (contentMode) bannerText.textContent = '글자를 클릭해 직접 수정하고, 차트 오른쪽 위의 종류 버튼으로 차트 모양을 바꿀 수 있어요(추천 표시 참고). 자동 저장됩니다.';
    banner.classList.toggle('show', layoutMode || contentMode);
  }
  /* ── 패널편집 = '클릭한 패널만' 편집 ──
     한 패널을 클릭해 선택(.psel)하면 그 패널만: 텍스트 편집·이동(draggable)·크기 손잡이·삭제·에셋추가 대상이 된다. */
  const CTRL_SEL = '.pdel, .psz, .aszr, .assettools, .compcopy, .charttype, .ct-btn, button';
  let selPanel = null;
  function editablePanelText(panel, on) {
    if (on) {
      /* 글자가 담긴 '잎' 요소를 고른다. <b>·<span> 같은 인라인 강조만 품은 줄
         (예: KPI 부제 '전일 대비 <b>+3.2%</b>')도 통째로 편집 대상 — 예전엔 자식이 하나라도
         있으면 건너뛰어 그런 줄은 아예 편집이 안 됐다. */
      const INLINE = /^(B|I|EM|STRONG|SPAN|SMALL|U|SUP|SUB|BR|MARK|A)$/;
      const isLeaf = (el) => !el.children.length || [...el.children].every((c) => INLINE.test(c.tagName) && !c.children.length);
      panel.querySelectorAll('*').forEach((el) => {
        if (!isLeaf(el)) return;
        if (!el.textContent || !el.textContent.trim()) return;
        if (el.closest('svg') || el.closest(CTRL_SEL)) return;
        if (el.parentElement && el.parentElement.closest('[contenteditable="true"]')) return; /* 부모가 이미 편집 중이면 중첩 금지 */
        el.setAttribute('contenteditable', 'true');
      });
    } else {
      panel.querySelectorAll('[contenteditable="true"]').forEach((el) => el.removeAttribute('contenteditable'));
    }
  }
  /* 선택 상태 반영 — 선택된 패널만 편집, 나머지는 모두 해제 */
  const doneBtn = document.getElementById('editDone');
  /* '완료' 버튼 — 위젯이 선택돼 있을 때만 노출. 누르면 선택을 해제해 다른 위젯을 고를 수 있다. */
  function updateDoneBtn() {
    if (doneBtn) doneBtn.hidden = !(selPanel && (layoutMode || contentMode));
  }
  function refreshEdit() {
    stage.querySelectorAll('.cols .panel').forEach((panel) => {
      const sel = panel === selPanel && (layoutMode || contentMode);
      panel.classList.toggle('psel', sel);
      /* 패널 이동은 포인터 기반(아래 pointerdown/move/up)으로 처리한다 — 네이티브 HTML5 드래그는
         contenteditable·내부 SVG/이미지와 충돌해 '이동이 안 되는' 문제가 있었다. 그래서 패널 자체는
         draggable을 끈다. 에셋(차트·심볼) 순서 바꾸기만 네이티브 드래그를 계속 쓴다. */
      panel.draggable = false;
      panel.querySelectorAll('.assetslot').forEach((s) => (s.draggable = layoutMode));
      editablePanelText(panel, sel && contentMode);
    });
    updateDoneBtn();
  }
  /* scroll=true일 때만 화면으로 스크롤(새로 추가된 패널용). 클릭 선택 시엔 스크롤하지 않는다 —
     mousedown에서 부드러운 스크롤이 일어나면 그 움직임이 드래그 시작을 취소해 이동이 안 됐다. */
  function selectPanel(p, scroll) { selPanel = p; window.__selPanel = p; refreshEdit(); if (scroll) { try { p.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {} } }
  function clearEdit() { selPanel = null; window.__selPanel = null; refreshEdit(); }
  if (doneBtn) doneBtn.addEventListener('click', () => clearEdit());

  function setLayout(on) {
    layoutMode = on;
    colsAll().forEach((c) => c.classList.toggle('editing', on));
    layoutBtn.classList.toggle('on', on);
    layoutLbl.textContent = on ? '끝내기' : '배치 수정';
    if (!on && !contentMode) clearEdit(); else refreshEdit();
    refreshBanner();
  }
  function setContent(on) {
    contentMode = on;
    stage.classList.toggle('content-editing', on);
    contentBtn.classList.toggle('on', on);
    contentLbl.textContent = on ? '끝내기' : '내용 수정';
    if (!on && !layoutMode) clearEdit(); else refreshEdit();
    refreshBanner();
  }
  layoutBtn.onclick = () => { if (state.screen !== 'dash') return; setLayout(!layoutMode); };
  contentBtn.onclick = () => { if (state.screen !== 'dash') return; setContent(!contentMode); };
  window.__dashEditExit = () => { setLayout(false); setContent(false); clearEdit(); };

  /* 패널편집 중 패널을 클릭하면 그 패널만 편집 대상으로 선택(기존 패널 포함) */
  stage.addEventListener('mousedown', (e) => {
    if (state.screen !== 'dash') return;
    if (!(layoutMode || contentMode)) return;
    const panel = e.target.closest('.cols .panel');
    if (!panel || e.target.closest(CTRL_SEL)) return;
    if (panel !== selPanel) selectPanel(panel);
    /* 배치 수정(이동)이 켜져 있으면 — 누를 때 글자에 '포커스/캐럿·텍스트 선택'이 잡히면 브라우저가
       그 제스처를 가로채 패널 드래그가 시작되지 않는다. 그래서 layout 모드에선 기본동작을 막는다.
       글자 편집은 더블클릭으로 한다(아래). 순수 '내용 수정'만 켠 상태에선 막지 않아 클릭 편집이 그대로 된다. */
    if (layoutMode) e.preventDefault();
  });
  /* ── 글자에 캐럿 놓기 ──
     제목줄(.ph)의 제목은 '글자 폭만큼만' 차지하는 flex 아이템이라, 조금만 옆을 눌러도
     .ph(편집 대상 아님)가 잡혀 편집이 안 되는 것처럼 보였다(축소된 템플릿 시안에선 특히).
     → 줄 아무 데나 눌러도 그 줄의 글자로 캐럿을 보낸다. */
  let lastPanelMove = 0; /* 패널을 실제로 끌어 옮긴 시각 — 그 직후의 클릭은 캐럿을 놓지 않는다 */
  function focusEditableAt(target, x, y) {
    /* 패널 이동용 포인터 캡처가 잡혀 있으면 click/dblclick 의 target 이 '패널'로 바뀐다(브라우저가
       캡처 요소로 리타깃). 그래서 눌린 좌표 아래의 실제 요소도 함께 후보로 본다 —
       이게 없으면 제목 h3 를 정확히 눌러도 편집이 시작되지 않았다. */
    const under = (typeof x === 'number' && typeof y === 'number') ? document.elementFromPoint(x, y) : null;
    let el = null;
    for (const t of [target, under]) {
      if (!t || !t.closest) continue;
      el = t.closest('[contenteditable="true"]');
      if (el) break;
      const head = t.closest('.ph, .dt-cardhead, .wfhead');
      el = (head && head.querySelector('[contenteditable="true"]')) || null;
      if (el) break;
    }
    if (!el) return false;
    try {
      /* 브라우저가 이미 이 요소 안에 캐럿/선택을 놓았으면 그대로 둔다 — 끌어서 한 선택이
         초기화되지 않게. (제목 h3는 display:flex + 방금 contenteditable 이 붙은 상태라
         네이티브 클릭으로는 캐럿이 안 잡히는 경우가 있어, 그때만 아래에서 직접 놓는다.) */
      const cur = document.getSelection();
      if (document.activeElement === el && cur && cur.rangeCount && el.contains(cur.getRangeAt(0).startContainer)) return true;
      el.focus();
      const sel = document.getSelection();
      const r = document.caretRangeFromPoint ? document.caretRangeFromPoint(x, y) : null;
      if (r && el.contains(r.startContainer)) { sel.removeAllRanges(); sel.addRange(r); }
      else { const rg = document.createRange(); rg.selectNodeContents(el); rg.collapse(false); sel.removeAllRanges(); sel.addRange(rg); }
    } catch (_) {}
    return true;
  }
  /* 배치 수정 중에도 글자를 고칠 수 있게 — 더블클릭한 자리의 글자에 포커스+캐럿을 놓는다. */
  stage.addEventListener('dblclick', (e) => {
    if (state.screen !== 'dash' || !contentMode) return;
    focusEditableAt(e.target, e.clientX, e.clientY);
  });
  /* 한 번 클릭으로 바로 편집 — 패널을 갓 선택한 순간엔 그 mousedown 시점에 글자가 아직
     contenteditable 이 아니어서 네이티브 캐럿이 안 잡히고(특히 제목 h3는 display:flex),
     제목줄 여백을 누르면 아예 빗나간다. 두 경우 모두 여기서 캐럿을 놓아준다.
     패널을 실제로 끌어 옮긴 직후의 클릭은 무시(이동 제스처였으므로). */
  stage.addEventListener('click', (e) => {
    if (state.screen !== 'dash' || !contentMode) return;
    if (e.target.closest(CTRL_SEL)) return;
    if (Date.now() - lastPanelMove < 250) return;
    focusEditableAt(e.target, e.clientX, e.clientY);
  });

  /* 새로 추가되는 패널(＋ 패널·에셋 삽입)도 '배치 수정하기'에서 바로 옮길 수 있도록:
     pid를 부여하고, 편집 중이면 즉시 draggable로 만든다. */
  let pidSeq = stage.querySelectorAll('.cols .panel').length;
  const prepPanel = (p) => { if (!p.dataset.pid) p.dataset.pid = 'p' + pidSeq++; };
  new MutationObserver((muts) => {
    let newPanel = null, added = false;
    muts.forEach((m) =>
      m.addedNodes.forEach((n) => {
        if (n.nodeType !== 1) return;
        added = true;
        if (n.classList.contains('panel')) { prepPanel(n); newPanel = n; }
        if (n.querySelectorAll) n.querySelectorAll('.panel').forEach((p) => { prepPanel(p); newPanel = p; });
      })
    );
    if (!(layoutMode || contentMode)) return;
    /* 새 패널을 추가하면 그 패널을 자동 선택(바로 편집), 선택 패널에 에셋을 넣으면 선택 상태를 다시 반영 */
    if (newPanel) selectPanel(newPanel, true);
    else if (added && selPanel) refreshEdit();
  }).observe(stage, { childList: true, subtree: true });
  const _lrBtn = document.getElementById('layoutReset');
  if (_lrBtn) _lrBtn.onclick = () => {
    if (state.screen !== 'dash') return;
    applyLayout(DEFAULT_LAYOUT);
    textEls.forEach((el) => (el.innerHTML = DEFAULT_CONTENT[el.dataset.eid]));
    document.dispatchEvent(new CustomEvent('dash-reset')); /* 차트 종류도 기본값으로 */
    try {
      localStorage.removeItem(LK);
      localStorage.removeItem(CK);
    } catch (e) {}
  };

  /* 내용 편집 → 입력 시 자동 저장(디바운스) */
  let st;
  stage.addEventListener('input', (e) => {
    if (!contentMode || !e.target.closest('[data-eid]')) return;
    clearTimeout(st);
    st = setTimeout(saveContent, 350);
  });

  /* ---------- 4) 드래그 앤 드롭 ---------- */
  let dragKind = null; /* 'panel' | 'asset' — 무엇을 끌고 있는지 */
  function getAfter(col, y) {
    const els = [...col.querySelectorAll('.panel:not(.dragging)')];
    let closest = { offset: -Infinity, el: null };
    els.forEach((child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) closest = { offset, el: child };
    });
    return closest.el;
  }
  /* 에셋 삽입 위치 계산 — 가로/세로 배치에 따라 X 또는 Y 기준으로 가장 가까운 슬롯을 찾는다 */
  function getAfterAsset(row, x, y) {
    const horiz = row.parentElement && row.parentElement.dataset.dir === 'row';
    const els = [...row.querySelectorAll(':scope > .assetslot:not(.dragging)')];
    let closest = { offset: -Infinity, el: null };
    els.forEach((child) => {
      const box = child.getBoundingClientRect();
      const offset = horiz ? x - box.left - box.width / 2 : y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) closest = { offset, el: child };
    });
    return closest.el;
  }
  stage.addEventListener('dragstart', (e) => {
    if (!layoutMode) return;
    /* 삭제 X 등 컨트롤에서 시작한 드래그는 취소한다 — 안 그러면 패널이 끌려가며
       클릭이 삼켜져 '삭제 버튼을 눌러도 안 지워지는' 문제가 생긴다. */
    if (e.target.closest(CTRL_SEL)) { e.preventDefault(); return; }
    /* 교체 대상 에셋을 집으면 패널 이동으로 번지지 않게 한다(클릭 선택·교체를 위해) */
    if (e.target.closest('.swap-asset')) { e.preventDefault(); return; }
    /* 에셋 슬롯이 먼저 — 패널보다 안쪽이라 이걸 집으면 에셋만 이동한다 */
    const slot = e.target.closest('.assetslot');
    if (slot) {
      dragEl = slot;
      dragKind = 'asset';
      slot.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', 'asset'); } catch (_) {}
      return;
    }
    /* 패널은 포인터 기반 이동을 쓴다 — 내부 이미지 등이 시작하는 네이티브 드래그는 취소한다. */
    if (e.target.closest('.panel')) { e.preventDefault(); return; }
  });
  stage.addEventListener('dragover', (e) => {
    if (!layoutMode || !dragEl) return;
    if (dragKind === 'asset') {
      /* 같은 줄 안에서 순서 바꾸기 + 다른 패널의 에셋 줄로 이동 */
      const row = e.target.closest('.assetrow');
      if (!row) return;
      e.preventDefault();
      const after = getAfterAsset(row, e.clientX, e.clientY);
      if (after == null) row.appendChild(dragEl);
      else row.insertBefore(dragEl, after);
      return;
    }
    e.preventDefault();
    const col = e.target.closest('.col');
    if (!col) return;
    const after = getAfter(col, e.clientY);
    if (after == null) col.appendChild(dragEl);
    else col.insertBefore(dragEl, after);
  });
  stage.addEventListener('drop', (e) => {
    if (layoutMode) e.preventDefault();
  });
  stage.addEventListener('dragend', () => {
    if (dragEl) dragEl.classList.remove('dragging');
    dragEl = null;
    dragKind = null;
    if (layoutMode) saveLayout();
  });

  /* ── 패널 이동 = 포인터 기반 재배치 ──
     네이티브 HTML5 드래그가 contenteditable·내부 SVG/이미지와 충돌해 이동이 안 되던 문제를 없애기 위해
     포인터 이벤트로 직접 옮긴다. 살짝(5px) 움직여야 드래그로 인식하므로 '클릭=선택'과 겹치지 않는다.
     끌고 있는 패널은 .dragging(pointer-events:none)이라 커서 아래의 .col을 정확히 집는다. */
  let pdrag = null;
  stage.addEventListener('pointerdown', (e) => {
    if (!layoutMode || e.button !== 0) return;
    if (e.target.closest(CTRL_SEL) || e.target.closest('.psz') || e.target.closest('.assetslot') || e.target.closest('.swap-asset')) return;
    const panel = e.target.closest('.panel');
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    pdrag = { panel, cols: colsOf(panel), pid: e.pointerId, sx: e.clientX, sy: e.clientY, started: false, w: r.width, h: r.height, offX: e.clientX - r.left, offY: e.clientY - r.top };
  });
  /* 이동 처리 본체 — pointermove 가 오지 않는 환경(확장/드라이버 등)을 대비해 mousemove 로도 호출한다 */
  function onDragMove(e) {
    if (!pdrag) return;
    if (!pdrag.started) {
      if (Math.abs(e.clientX - pdrag.sx) + Math.abs(e.clientY - pdrag.sy) < 5) return;
      pdrag.started = true;
      dragEl = pdrag.panel; dragKind = 'panel';
      try { const s = document.getSelection(); if (s) s.removeAllRanges(); } catch (_) {}
      try { pdrag.panel.setPointerCapture(pdrag.pid); } catch (_) {}
      /* 패널은 '제자리'에 둔 채 transform 으로만 옮긴다(빈 자리가 그대로 원래 위치를 보여줌).
         예전엔 position:fixed 로 띄웠는데, 상위 요소의 transform/filter 가 fixed 의 기준을 바꿔
         위젯이 커서와 전혀 다른 곳에 떠 버리고 드롭 대상도 못 잡았다. */
      const p = pdrag.panel;
      const rr = p.getBoundingClientRect();
      pdrag.scale = (p.offsetWidth && rr.width) ? (rr.width / p.offsetWidth) : 1;
      if (!(pdrag.scale > 0.05)) pdrag.scale = 1;
      p.classList.add('dragging');
    }
    e.preventDefault();
    /* 시작 지점 대비 이동량만큼 옮긴다(화면 배율 보정) → 커서에 정확히 따라온다 */
    const mdx = (e.clientX - pdrag.sx) / pdrag.scale;
    const mdy = (e.clientY - pdrag.sy) / pdrag.scale;
    pdrag.panel.style.transform = 'translate(' + mdx + 'px, ' + mdy + 'px)';
    /* placeholder를 커서에 가장 가까운 '다른 패널' 옆으로 옮겨 드롭 위치를 보여준다 —
       .col 기둥(2·3단)이든 .cols 직속(모듈)이든, 가로/세로 어느 배치든 동작한다. */
    /* ── 자리 맞바꾸기(swap) ──
       커서가 올라간 '다른 패널'을 맞바꿀 대상으로 표시한다. 놓으면 둘의 자리가 서로 바뀐다.
       (예전엔 사이에 끼워 넣어 나머지가 밀렸는데, 원하는 동작은 1:1 자리 교환이다.) */
    const dcols = pdrag.cols || cols;
    /* 대상 판정 — ① 커서가 올라간 패널을 우선, ② 없으면 '끌고 있는 위젯과 가장 많이 겹치는' 패널.
       커서 한 점만 보면 위젯을 크게 옮겼을 때 빈틈·여백에 걸려 대상을 놓치는 경우가 있었다. */
    const dr = pdrag.panel.getBoundingClientRect();
    let tgt = null, bestOv = 0;
    dcols.querySelectorAll('.panel').forEach((q) => {
      if (q === pdrag.panel || q === pdrag.ph || q.classList.contains('drag-placeholder')) return;
      const b = q.getBoundingClientRect();
      if (b.width < 2 || b.height < 2) return;
      if (e.clientX >= b.left && e.clientX <= b.right && e.clientY >= b.top && e.clientY <= b.bottom) { tgt = q; bestOv = Infinity; return; }
      if (bestOv === Infinity) return;
      const ow = Math.min(dr.right, b.right) - Math.max(dr.left, b.left);
      const oh = Math.min(dr.bottom, b.bottom) - Math.max(dr.top, b.top);
      if (ow <= 0 || oh <= 0) return;
      const ov = (ow * oh) / Math.max(1, Math.min(dr.width * dr.height, b.width * b.height));
      if (ov > 0.25 && ov > bestOv) { bestOv = ov; tgt = q; }
    });
    if (tgt !== pdrag.target) {
      if (pdrag.target) pdrag.target.classList.remove('swap-target');
      pdrag.target = tgt;
      if (tgt) tgt.classList.add('swap-target');
    }
  }
  stage.addEventListener('pointermove', (e) => {
    if (!pdrag || e.pointerId !== pdrag.pid) return;
    pdrag.gotPointer = true;
    onDragMove(e);
  });
  /* 대체 경로 — pointermove 가 한 번도 오지 않았다면 mousemove 로 이동을 처리한다 */
  stage.addEventListener('mousemove', (e) => {
    if (!pdrag || pdrag.gotPointer) return;
    onDragMove(e);
  });
  stage.addEventListener('mouseup', () => { if (pdrag && !pdrag.gotPointer) endPanelDrag(); });
  window.addEventListener('mouseup', () => { if (pdrag) endPanelDrag(); });
  const endPanelDrag = () => {
    if (!pdrag) return;
    if (pdrag.started) {
      lastPanelMove = Date.now();
      const p = pdrag.panel, tgt = pdrag.target;
      if (tgt) tgt.classList.remove('swap-target');
      /* 맞바꾸기 — 두 패널의 DOM 자리를 서로 교환한다(임시 표식으로 인접한 경우도 안전하게). */
      let swapped = false;
      if (tgt && tgt.parentElement && p.parentElement && tgt !== p) {
        /* ① 격자(gridmode) 배치에서는 위젯 위치가 인라인 좌표(grid-column/row)로 고정된다.
           DOM 순서만 바꾸면 화면은 그대로이므로, 좌표를 먼저 서로 맞바꾼다. */
        const gc = p.style.gridColumn, gr = p.style.gridRow, ga = p.style.gridArea;
        p.style.gridColumn = tgt.style.gridColumn; p.style.gridRow = tgt.style.gridRow; p.style.gridArea = tgt.style.gridArea;
        tgt.style.gridColumn = gc; tgt.style.gridRow = gr; tgt.style.gridArea = ga;
        /* ② DOM 순서도 맞바꾼다 — 저장·복원(레이아웃 재적용)이 순서를 기준으로 하기 때문. */
        const m1 = document.createElement('div'); m1.style.display = 'none';
        const m2 = document.createElement('div'); m2.style.display = 'none';
        p.parentElement.insertBefore(m1, p);
        tgt.parentElement.insertBefore(m2, tgt);
        m1.parentElement.insertBefore(tgt, m1);
        m2.parentElement.insertBefore(p, m2);
        m1.remove(); m2.remove();
        swapped = true;
      }
      /* 옮겨진 패널은 진입 애니메이션 재시작으로 사라질 수 있어 영구히 꺼둔다 */
      [p, tgt].forEach((el) => { if (el) { el.classList.add('no-anim'); el.style.animation = 'none'; } });
      p.classList.remove('dragging');
      p.style.transform = '';
      try { p.releasePointerCapture(pdrag.pid); } catch (_) {}
      /* 이동 중 붙였던 FLIP 트랜지션·transform 잔여물 정리 */
      (pdrag.cols || cols).querySelectorAll('.panel.reflowing').forEach((el) => { el.classList.remove('reflowing'); el.style.transform = ''; });
      dragEl = null; dragKind = null;
      saveLayout();
      /* 결과를 눈으로 알 수 있게 알림 — 교환됐는지, 대상이 없어 제자리로 돌아왔는지 */
      try {
        if (typeof toast === 'function') {
          /* 패널 제목은 사용자가 고친 글자라 토스트(HTML)에 넣기 전에 이스케이프한다 */
          const nm = (el) => escHTML(el && el.querySelector('.ph h3') ? el.querySelector('.ph h3').textContent.trim() : '위젯');
          if (swapped) toast('“' + nm(p) + '” ↔ “' + nm(tgt) + '” 자리를 바꿨어요.', { type: 'ok' });
          else toast('바꿀 위젯 위에 놓아야 자리가 바뀝니다. (제자리로 돌아감)', { type: 'info' });
        }
      } catch (_) {}
    }
    pdrag = null;
  };
  stage.addEventListener('pointerup', endPanelDrag);
  stage.addEventListener('pointercancel', endPanelDrag);

  /* 페이지 로드 시 저장된 배치·내용 복원 */
  loadLayout();
  loadContent();
})();
