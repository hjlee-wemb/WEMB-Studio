/* ── 디지털 트윈 편집 ── */

/* ===== Digital Twin 화면도 '대시보드 편집' 대상 =====
   DT는 .dt-ui 그리드에 유리 패널이 놓인 고정 레이아웃 → 배치=패널 자유 이동(transform),
   내용=글자 직접 수정. 버튼(editToggle/contentToggle/layoutReset)은 화면이 dt일 때만 이 모듈이 처리.
   (대시보드 모듈은 위에서 screen!=='dash'면 무시하도록 가드됨) */
(function initDTEdit() {
  const dt = document.getElementById('dtStage');
  const ui = dt && dt.querySelector('.dt-ui');
  if (!ui) return;
  const layoutBtn = document.getElementById('editToggle');
  const contentBtn = document.getElementById('contentToggle');
  const resetBtn = document.getElementById('layoutReset');
  if (!layoutBtn || !contentBtn) return;
  const layoutLbl = layoutBtn.querySelector('.lbl');
  const contentLbl = contentBtn.querySelector('.lbl');
  const banner = document.getElementById('editBanner');
  const bannerText = document.getElementById('editBannerText');
  const body = dt.querySelector('.dt-body');

  /* 배치 대상 = .dt-ui 직속 패널 5개 */
  const panels = [...ui.children].filter((el) => el.matches('.dt-navbtns, .dt-symbols, .dt-card'));
  panels.forEach((p, i) => { p.dataset.did = 'd' + i; p.classList.add('dt-drag'); });

  /* ---------- 배치(자유 이동) ---------- */
  const LK = 'wemb-dt-layout';
  let pos = {};
  const applyPos = () => panels.forEach((p) => {
    const o = pos[p.dataset.did];
    p.style.transform = o ? 'translate(' + o[0] + 'px, ' + o[1] + 'px)' : '';
  });
  const savePos = () => { try { localStorage.setItem(LK, JSON.stringify(pos)); } catch (e) {} };
  try { const r = localStorage.getItem(LK); if (r) pos = JSON.parse(r) || {}; } catch (e) {}

  /* ---------- 내용(글자) ---------- */
  const CK = 'wemb-dt-content';
  /* .skh-root p — SK하이닉스 FMS Hub 시안의 모든 글자(Figma 텍스트 노드 = <p>).
     '패널편집'(내용 수정)을 켜면 화면의 글자를 전부 그 자리에서 고칠 수 있고, 수정분은 여기 CK 키에 자동 저장된다. */
  /* .hjc-root p / .hjg-root p / .hju-root p — 한진 통합관제 화면 3장의 모든 글자도 같은 방식으로 잡는다
     (Figma 텍스트 노드 = <p>. 아이콘·그래픽만 SVG 라서 화면의 글자는 전부 여기 걸린다) */
  const DTSEL = '.dt-bname, .dt-nav a, .dt-navbtn span, .dt-sym span, .dt-cardhead h3, .dt-tabs b, .dt-live, .dt-chip, .dt-tnm, .skxp-txt, .skh-root p, .skv-root p, .hjc-root p, .hjg-root p, .hju-root p, .hno2-root p, .hnc1-root p, .hnc2-root p, .hnm-root p, .hni1-root p, .hni2-root p, .hne-root p, .hnn1-root p, .hnn2-root p, .hnn3-root p, .hnf-root p, .hns1-root p, .hns2-root p, .hnl-root p';
  let layoutMode = false, contentMode = false;
  let textEls = [], DEF = {};
  /* 실제로 사람이 고친 글자만 기억한다.
     시안(SK하이닉스·한진)에는 시계·카운터·차트 수치처럼 스스로 바뀌는 글자가 있어서
     '기본값과 다른 것'을 전부 저장해 버리면, 잠깐 지나간 값이 편집 내용으로 굳어 버린다. */
  const touched = new Set();
  const saveContent = () => {
    let m = {};
    try { m = JSON.parse(localStorage.getItem(CK) || '{}') || {}; } catch (e) { m = {}; }
    textEls.forEach((el) => {
      const id = el.dataset.deid;
      if (!touched.has(id)) return;
      if (el.innerHTML === DEF[id]) delete m[id];      /* 원래 글자로 되돌렸으면 편집 기록도 지운다 */
      else m[id] = el.innerHTML;
    });
    try { localStorage.setItem(CK, JSON.stringify(m)); } catch (e) {}
  };
  /* 기본값(글자) 캡처 — PRD 답변으로 트윈 콘텐츠가 새로 그려지면 __dtRecaptureDefaults(true)로
     다시 불러 새 요소를 추적한다. reset=true면 이전 글자 편집(CK)은 버리고(구조가 바뀌었으니)
     새 콘텐츠를 기본값으로 삼는다. reset=false면 저장된 글자 편집을 그대로 다시 입힌다. */
  function captureDefaults(reset) {
    if (reset) { try { localStorage.removeItem(CK); } catch (e) {} }
    textEls = [...dt.querySelectorAll(DTSEL)];
    /* 편집 기록의 열쇠 — 요소에 고유 id 가 있으면 그걸 쓴다.
       순번('x3')만 쓰면 한 프로젝트 안에서 화면을 바꿨을 때(한진 3장처럼 구조가 다른 화면)
       같은 순번의 '엉뚱한 글자'에 이전 수정이 들어간다. 재구축 시안은 모든 글자에
       레이어명 기반 고유 id 가 있으므로 화면이 바뀌어도 제 자리를 찾는다. */
    textEls.forEach((el, i) => (el.dataset.deid = el.id || ('x' + i)));
    DEF = {};
    textEls.forEach((el) => (DEF[el.dataset.deid] = el.innerHTML));
    if (!reset) {
      try {
        const r = localStorage.getItem(CK);
        if (r) { const m = JSON.parse(r); textEls.forEach((el) => { if (m[el.dataset.deid] != null) el.innerHTML = m[el.dataset.deid]; }); }
      } catch (e) {}
    }
    /* 내용 수정 모드 중에 다시 그려졌으면 새 요소에도 편집 가능 상태를 이어준다 */
    if (contentMode) textEls.forEach((el) => el.setAttribute('contenteditable', 'true'));
  }
  window.__dtRecaptureDefaults = captureDefaults;
  captureDefaults(false);

  /* ---------- 모드 토글 ---------- */
  function refreshBanner() {
    if (layoutMode) bannerText.textContent = '패널은 끌어서 자유롭게, 에셋은 끌어서 순서를 바꿔보세요. 세로/가로 버튼으로 에셋 정렬도 바꿀 수 있어요.';
    else if (contentMode) bannerText.textContent = '글자를 클릭해 직접 수정하세요. 변경 내용은 자동 저장됩니다.';
    if (banner) banner.classList.toggle('show', layoutMode || contentMode);
  }
  /* ── 트윈도 '클릭한 패널만' 편집 ── (추가 패널 .dt-drag 를 클릭해 선택) */
  const DT_CTRL_SEL = '.pdel, .psz, .aszr, .assettools, .compcopy, .charttype, .ct-btn, button';
  let selDt = null;
  function editableDtPanelText(panel, on) {
    if (on) {
      /* 글자가 담긴 '잎' 요소를 고른다. <b>·<span> 같은 인라인 강조만 품은 줄
         (예: KPI 부제 '전일 대비 <b>+3.2%</b>')도 통째로 편집 대상 — 예전엔 자식이 하나라도
         있으면 건너뛰어 그런 줄은 아예 편집이 안 됐다. */
      const INLINE = /^(B|I|EM|STRONG|SPAN|SMALL|U|SUP|SUB|BR|MARK|A)$/;
      const isLeaf = (el) => !el.children.length || [...el.children].every((c) => INLINE.test(c.tagName) && !c.children.length);
      panel.querySelectorAll('*').forEach((el) => {
        if (!isLeaf(el)) return;
        if (!el.textContent || !el.textContent.trim()) return;
        if (el.closest('svg') || el.closest(DT_CTRL_SEL)) return;
        if (el.parentElement && el.parentElement.closest('[contenteditable="true"]')) return; /* 부모가 이미 편집 중이면 중첩 금지 */
        el.setAttribute('contenteditable', 'true');
      });
    } else {
      panel.querySelectorAll('[contenteditable="true"]').forEach((el) => el.removeAttribute('contenteditable'));
    }
  }
  function refreshDtEdit() {
    dt.querySelectorAll('.panel').forEach((panel) => {
      const sel = panel === selDt && (layoutMode || contentMode);
      panel.classList.toggle('psel', sel);
      panel.querySelectorAll('.assetslot').forEach((s) => (s.draggable = sel && layoutMode));
      editableDtPanelText(panel, sel && contentMode);
    });
  }
  function selectDtPanel(p) { selDt = p; window.__selDtPanel = p; refreshDtEdit(); try { p.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {} }
  function clearDtEdit() { selDt = null; window.__selDtPanel = null; refreshDtEdit(); }
  function setLayout(on) {
    layoutMode = on;
    dt.classList.toggle('dt-editing', on);
    layoutBtn.classList.toggle('on', on);
    if (layoutLbl) layoutLbl.textContent = on ? '끝내기' : '배치 수정';
    if (typeof wfSetLayout === 'function') wfSetLayout(on);
    if (!on && !contentMode) clearDtEdit(); else refreshDtEdit();
    refreshBanner();
  }
  function setContent(on) {
    contentMode = on;
    dt.classList.toggle('dt-content-editing', on);
    contentBtn.classList.toggle('on', on);
    if (contentLbl) contentLbl.textContent = on ? '끝내기' : '내용 수정';
    /* 고정 글라스 UI 텍스트는 그대로 편집(패널이 아님), 추가 패널은 선택된 것만 편집 */
    textEls.forEach((el) => (on ? el.setAttribute('contenteditable', 'true') : el.removeAttribute('contenteditable')));
    if (typeof wfSetContent === 'function') wfSetContent(on);
    if (!on && !layoutMode) clearDtEdit(); else refreshDtEdit();
    refreshBanner();
  }
  window.__dtEditExit = () => { setLayout(false); setContent(false); clearDtEdit(); };

  layoutBtn.addEventListener('click', () => { if (state.screen === 'dt') setLayout(!layoutMode); });
  contentBtn.addEventListener('click', () => { if (state.screen === 'dt') setContent(!contentMode); });
  if (resetBtn) resetBtn.addEventListener('click', () => {
    if (state.screen !== 'dt') return;
    pos = {}; applyPos(); savePos();
    textEls.forEach((el) => (el.innerHTML = DEF[el.dataset.deid]));
    try { localStorage.removeItem(LK); localStorage.removeItem(CK); } catch (e) {}
    /* PRD 플로우 유리 패널 편집(배치·내용)도 함께 기본값으로 되돌리고 재렌더 */
    const wfid = wfLid();
    if (wfid) { delete wfOrd[wfid]; delete wfCont[wfid]; wfSaveOrd(); wfSaveCont(); }
    if (wfActive() && window.__dtWfRerender) window.__dtWfRerender();
  });

  /* 내용 입력 자동 저장(디바운스) */
  let st;
  dt.addEventListener('input', (e) => {
    if (!contentMode) return;
    const host = e.target.closest('[data-deid]');
    if (!host) return;
    touched.add(host.dataset.deid);
    clearTimeout(st); st = setTimeout(saveContent, 350);
  });

  /* 편집 중 클릭이 DT 기능(뷰전환·트리·필터)을 건드리지 않게 캡처 단계에서 차단 */
  dt.addEventListener('click', (e) => {
    /* 팝업 닫기(✕)는 편집 중에도 눌러야 하므로 차단 대상에서 제외한다 */
    if (e.target.closest && e.target.closest('.skxp-Close-Button')) return;
    if (layoutMode || (contentMode && e.target.closest('[data-deid]'))) e.stopPropagation();
  }, true);

  /* ---------- 자유 이동 드래그(포인터) ----------
     .dt-body 기준으로 위임 — 고정 유리카드(.dt-ui 안)와 콘텐츠 추가 패널(.dt-added, 레이아웃 모드에서도
     보이도록 .dt-body 직속)을 모두 잡는다. */
  let drag = null;
  /* 위임은 dtStage 전체에 건다 — SK하이닉스 인라인 SVG 화면의 추가 패널(.skx-screen 안)도 잡기 위해.
     이동 경계는 패널이 속한 컨테이너(.dt-body 또는 .skx-screen) 기준으로 계산해 기존 DT 동작은 유지. */
  const dragBoundsOf = (panel) => (panel.closest('.skx-screen') || panel.closest('.dt-body') || dt).getBoundingClientRect();
  /* #dtStage 안의 시안은 저마다 다른 곳에서 축소된다 — 고정 캔버스(--canvas-scale),
     FMS Hub·항온항습기 상세의 화면 scale, UPS 팝업의 .skxp-canvas scale. 어느 한 곳을 읽으면
     나머지에서 틀리므로 결과를 잰다: 화면 픽셀(rect) ÷ 레이아웃 픽셀(offset) = 실제 배율.
     이걸 안 나누면 마우스가 움직인 '화면 픽셀'이 그대로 translate 에 들어가 패널이 더 멀리 간다. */
  const dtScale = (el) => {
    const w = el && el.offsetWidth;
    if (!w) return 1;
    const s = el.getBoundingClientRect().width / w;
    return s > 0.01 ? s : 1;
  };
  dt.addEventListener('pointerdown', (e) => {
    if (!(layoutMode || contentMode) || e.button !== 0) return;
    /* 에셋 컨트롤(세로/가로 토글·크기 슬라이더)·에셋 슬롯·삭제 X 등 컨트롤은 패널 이동으로 가로채지 않는다.
       (특히 .pdel 삭제 버튼을 여기서 잡으면 pointerdown이 클릭을 삼켜 삭제가 안 됨) */
    if (e.target.closest('.assettools, .aszr, .assetslot, .swap-asset, .pdel, .psz, .compcopy, .charttype, .ct-btn, .skxp-Close-Button')) return;
    const panel = e.target.closest('.dt-drag');
    if (!panel || !dt.contains(panel)) return;
    /* 클릭한 패널만 편집 대상으로 선택. 예전엔 '선택 안 된 패널은 먼저 선택만 하고 이동은 안 함'(select-first)이라
       한 번 눌러선 안 움직여 '이동이 안 되는' 것처럼 보였다 → 이제 첫 누름에서 바로 선택+이동을 시작한다. */
    if (panel !== selDt) selectDtPanel(panel);
    if (!layoutMode) return;                                   /* 이동은 배치 모드에서만 */
    /* 글자(내용 수정) 위에서 눌러도 이동되게 한다 — 아래 mousedown에서 글자 포커스를 막고,
       글자 편집은 더블클릭으로 처리한다. (예전엔 글자 위를 누르면 이동을 막아, 글자로 가득한 패널은 못 옮겼다.) */
    try { const s = document.getSelection(); if (s) s.removeAllRanges(); } catch (_) {}
    try { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch (_) {}
    const o = pos[panel.dataset.did] || [0, 0];
    const rect = panel.getBoundingClientRect();
    const sc = dtScale(panel);
    drag = {
      panel, pid: e.pointerId, sx: e.clientX, sy: e.clientY, ox: o[0], oy: o[1], cur: null,
      sc: sc, baseL: rect.left - o[0] * sc, baseT: rect.top - o[1] * sc, w: rect.width, h: rect.height,
      br: dragBoundsOf(panel)
    };
    /* 포인터 캡처는 실제로 끌기 시작할 때(첫 이동) 잡는다 — 누르자마자 잡으면 click/dblclick 의
       target 이 패널로 리타깃돼 그 안의 글자를 눌러도 편집이 시작되지 않는다. */
    e.preventDefault();
  });
  dt.addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (!drag.moved) {
      /* 손떨림 정도는 클릭으로 본다 — 3px 넘게 움직였을 때만 이동 시작(그때 캡처를 잡는다) */
      if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 3) return;
      drag.moved = true;
      try { drag.panel.setPointerCapture(drag.pid); } catch (_) {}
      drag.panel.classList.add('dragging');
    }
    /* 화면 픽셀 → 캔버스 좌표(배율 나누기). 경계값도 같은 좌표계로 환산한다. */
    let dx = drag.ox + (e.clientX - drag.sx) / drag.sc;
    let dy = drag.oy + (e.clientY - drag.sy) / drag.sc;
    const minDx = (drag.br.left + 4 - drag.baseL) / drag.sc, maxDx = (drag.br.right - 4 - (drag.baseL + drag.w)) / drag.sc;
    const minDy = (drag.br.top + 4 - drag.baseT) / drag.sc, maxDy = (drag.br.bottom - 4 - (drag.baseT + drag.h)) / drag.sc;
    if (minDx <= maxDx) dx = Math.max(minDx, Math.min(maxDx, dx));
    if (minDy <= maxDy) dy = Math.max(minDy, Math.min(maxDy, dy));
    drag.cur = [Math.round(dx), Math.round(dy)];
    drag.panel.style.transform = 'translate(' + drag.cur[0] + 'px, ' + drag.cur[1] + 'px)';
  });
  const endDrag = (e) => {
    if (!drag) return;
    drag.panel.classList.remove('dragging');
    if (drag.cur) { pos[drag.panel.dataset.did] = drag.cur; savePos(); lastPanelMove = Date.now(); }
    try { drag.panel.releasePointerCapture(drag.pid); } catch (er) {}
    drag = null;
  };
  dt.addEventListener('pointerup', endDrag);
  dt.addEventListener('pointercancel', endDrag);

  /* 배치 모드에서 패널을 누를 때 글자 포커스·선택이 잡히면 브라우저가 제스처를 가로채 이동이 시작되지 않는다.
     → layout 모드에선 패널 위 누름의 기본동작(포커스/캐럿/선택)을 막는다. 글자 편집은 더블클릭(아래). */
  dt.addEventListener('mousedown', (e) => {
    if (!layoutMode) return;
    if (e.target.closest('.assettools, .aszr, .assetslot, .swap-asset, .pdel, .psz, .compcopy, .charttype, .ct-btn')) return;
    if (e.target.closest('.dt-drag')) e.preventDefault();
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
  dt.addEventListener('dblclick', (e) => {
    if (!contentMode) return;
    focusEditableAt(e.target, e.clientX, e.clientY);
  });
  /* 한 번 클릭으로 바로 편집 — 위 대시보드와 같은 이유(갓 선택된 패널·제목 h3·제목줄 여백).
     패널을 실제로 끌어 옮긴 직후의 클릭은 무시한다. */
  /* 캡처 단계에 둔다 — 위쪽에 'DT 기능(뷰전환·트리·필터)이 눌리지 않게' 막는 캡처 핸들러가
     stopPropagation 을 하고 있어, 버블 단계 리스너는 편집 중에 아예 호출되지 않는다.
     (stopPropagation 은 같은 노드의 다른 리스너까지 막지는 않으므로 여기서 처리 가능) */
  dt.addEventListener('click', (e) => {
    if (!contentMode) return;
    if (e.target.closest(DT_CTRL_SEL)) return;
    if (Date.now() - lastPanelMove < 250) return;
    focusEditableAt(e.target, e.clientX, e.clientY);
  }, true);

  /* ── 에셋 순서 바꾸기(HTML5 드래그) — 패널은 포인터로 자유 이동, 에셋은 줄 안에서 재배치 ──
     세로 배치면 Y, 가로 배치면 X 기준으로 가장 가까운 슬롯 앞에 끼워 넣는다. */
  let aDrag = null;
  function dtAfterAsset(row, x, y) {
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
  dt.addEventListener('dragstart', (e) => {
    if (!layoutMode) return;
    const slot = e.target.closest('.assetslot');
    if (!slot) return;
    aDrag = slot;
    slot.classList.add('dragging');
    if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', 'asset'); } catch (_) {} }
  });
  dt.addEventListener('dragover', (e) => {
    if (!layoutMode || !aDrag) return;
    const row = e.target.closest('.assetrow');
    if (!row) return;
    e.preventDefault();
    const after = dtAfterAsset(row, e.clientX, e.clientY);
    if (after == null) row.appendChild(aDrag);
    else row.insertBefore(aDrag, after);
  });
  dt.addEventListener('drop', (e) => { if (layoutMode && aDrag) e.preventDefault(); });
  dt.addEventListener('dragend', () => { if (aDrag) aDrag.classList.remove('dragging'); aDrag = null; });

  applyPos();

  /* '콘텐츠 추가'로 디지털 트윈에 넣은 패널도 자유 이동 대상이 되게 한다.
     .dt-added 안에 새 .panel이 들어오면 .dt-drag + 고유 did를 붙여, 위의 포인터 드래그가 잡게 한다. */
  let didSeq = panels.length;
  const tagAddedPanel = (p) => {
    if (p.dataset.did) return;
    p.dataset.did = 'd' + didSeq++;
    p.classList.add('dt-drag');
  };
  dt.querySelectorAll('.dt-added .panel').forEach(tagAddedPanel);
  new MutationObserver((muts) => {
    let added = false, newPanel = null;
    muts.forEach((m) =>
      m.addedNodes.forEach((n) => {
        if (n.nodeType !== 1) return;
        added = true;
        if (n.classList.contains('panel')) { tagAddedPanel(n); newPanel = n; }
        if (n.querySelectorAll) n.querySelectorAll('.panel').forEach((p) => { tagAddedPanel(p); newPanel = p; });
      })
    );
    if (!(layoutMode || contentMode)) return;
    if (newPanel) selectDtPanel(newPanel);
    else if (added && selDt) refreshDtEdit();
  }).observe(dt, { childList: true, subtree: true });

  /* ============================================================
   *  PRD → 기능명세서 → 유저플로우 → 와이어프레임을 거쳐 만들어진
   *  '화면 시안'(유리 패널, #wfCanvasDt의 .wfpanel)도 편집 대상.
   *  .dt-ui 고정 배치가 숨겨진 이 모드에서 패널을 직접 끌어 배치하고,
   *  패널 안 제목·표·리스트·KPI 글자를 직접 고친다. 저장은 레이아웃 id별로.
   *  (renderInto가 패널을 매번 새로 그리므로, 렌더 직후 저장분을 다시 입힌다.)
   * ============================================================ */
  const wfCanvas = document.getElementById('wfCanvasDt');
  /* 실제 글자가 담긴 요소들 — 유리 패널 제목(PRD 대상)과 복제된 대시보드 콘텐츠 텍스트 */
  const WFSEL = '.wfhead .t.tx, .ph h3, .kpi .lab, .kpi .val, .kpi .sub, th, td, .logrow span, .prow .nm, .prow .pv, .dleg .row, .sec-lab';
  const WFOK = 'wemb-dt-wf-order', WFCK = 'wemb-dt-wf-content';
  const wfLoad = (k) => { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; } };
  let wfOrd = wfLoad(WFOK), wfCont = wfLoad(WFCK);
  const wfLid = () => (window.__dtWfLayoutId ? window.__dtWfLayoutId() : null);
  const wfActive = () => !!(wfCanvas && !wfCanvas.hidden && wfCanvas.__board);
  const wfPanels = () => (wfCanvas ? [...wfCanvas.querySelectorAll('.wfpanel')] : []);
  function wfSaveOrd() { try { localStorage.setItem(WFOK, JSON.stringify(wfOrd)); } catch (e) {} }
  function wfSaveCont() { try { localStorage.setItem(WFCK, JSON.stringify(wfCont)); } catch (e) {} }
  /* 캔버스를 1:1로 채우므로 보통 배율은 1이지만, 혹시 축소 보드일 때를 대비해 계산해 둔다 */
  function wfScale() {
    const b = wfCanvas && wfCanvas.__board;
    if (!b) return 1;
    const s = Math.min(wfCanvas.clientWidth / b.bw, wfCanvas.clientHeight / b.bh);
    return s > 0 ? s : 1;
  }
  /* 방금 그려진(격자 순서) 패널의 '기본 슬롯 좌표'를 dataset에 기억 — 자리바꿈은 이 좌표 집합을 재배열만 한다 */
  function wfSlotRect(p) {
    if (p.dataset.wfdl == null) {
      p.dataset.wfdl = parseFloat(p.style.left) || 0;
      p.dataset.wfdt = parseFloat(p.style.top) || 0;
      p.dataset.wfdw = parseFloat(p.style.width) || 0;
      p.dataset.wfdh = parseFloat(p.style.height) || 0;
    }
    return { l: +p.dataset.wfdl, t: +p.dataset.wfdt, w: +p.dataset.wfdw, h: +p.dataset.wfdh };
  }
  /* 저장된 순서(치환)를 좌표에 반영 — 패널 i 는 slot perm[i] 자리로 간다. 슬롯(격자) 집합은 그대로라 레이아웃 유지. */
  function wfApplyOrder() {
    const panels = wfPanels();
    if (!panels.length) return;
    const defs = panels.map(wfSlotRect);
    const id = wfLid();
    let perm = id && wfOrd[id];
    if (!Array.isArray(perm) || perm.length !== panels.length) perm = panels.map((_, i) => i);
    panels.forEach((p, i) => {
      const d = defs[perm[i]] || defs[i];
      p.style.left = d.l + 'px'; p.style.top = d.t + 'px';
      p.style.width = d.w + 'px'; p.style.height = d.h + 'px';
      p.style.transform = '';
    });
  }
  function wfApplyCont() {
    const id = wfLid(), m = (id && wfCont[id]) || {};
    wfPanels().forEach((p, i) => {
      const cm = m[i]; if (!cm) return;
      [...p.querySelectorAll(WFSEL)].forEach((el, j) => { if (cm[j] != null) el.innerHTML = cm[j]; });
    });
  }
  function wfSetLayout(on) { if (on && wfActive()) wfApplyOrder(); }
  function wfSetContent(on) {
    if (!wfActive()) return;
    wfPanels().forEach((p) => {
      [...p.querySelectorAll(WFSEL)].forEach((el) => (on ? el.setAttribute('contenteditable', 'true') : el.removeAttribute('contenteditable')));
    });
  }
  /* renderDtGrid로 패널이 새로 그려진 직후 호출(applyDt/리사이즈) — 기본 슬롯 좌표를 새로 읽고 순서·내용을 다시 입힌다 */
  function wfRefresh() {
    if (!wfActive()) return;
    wfPanels().forEach((p) => { delete p.dataset.wfdl; delete p.dataset.wfdt; delete p.dataset.wfdw; delete p.dataset.wfdh; });
    wfApplyOrder();
    wfApplyCont();
    if (contentMode) wfSetContent(true);
  }
  window.__dtWfEditRefresh = wfRefresh;

  /* 내용 입력 자동 저장(디바운스) — 레이아웃 id > 패널 index > 요소 index 로 저장 */
  let wfCt;
  if (wfCanvas) wfCanvas.addEventListener('input', (e) => {
    if (!contentMode || !wfActive()) return;
    const el = e.target.closest('[contenteditable]'); if (!el) return;
    const panel = el.closest('.wfpanel'); if (!panel) return;
    const id = wfLid(); if (!id) return;
    const i = wfPanels().indexOf(panel);
    const j = [...panel.querySelectorAll(WFSEL)].indexOf(el);
    if (i < 0 || j < 0) return;
    (wfCont[id] = wfCont[id] || {});
    (wfCont[id][i] = wfCont[id][i] || {});
    wfCont[id][i][j] = el.innerHTML;
    clearTimeout(wfCt); wfCt = setTimeout(wfSaveCont, 350);
  });

  /* ── 배치 수정 = '자리 맞바꾸기' ──
     끌고 있는 패널을 같은 크기의 다른 패널 위에 놓으면 둘의 자리를 바꾼다. 슬롯(격자)은 그대로라
     레이아웃이 유지되고 배치(순서)만 바뀐다. 자유 이동이 아니므로 겹침·빈칸이 생기지 않는다. */
  let wfDrag = null;
  const wfSameSize = (a, b) => Math.abs(a.offsetWidth - b.offsetWidth) < 2 && Math.abs(a.offsetHeight - b.offsetHeight) < 2;
  function wfTargetAt(x, y, drag) {
    return wfPanels().find((p) => {
      if (p === drag.panel || !wfSameSize(p, drag.panel)) return false;
      const r = p.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    }) || null;
  }
  if (wfCanvas) {
    wfCanvas.addEventListener('pointerdown', (e) => {
      if (!layoutMode || !wfActive() || e.button !== 0) return;
      const panel = e.target.closest('.wfpanel'); if (!panel) return;
      wfDrag = { panel, pid: e.pointerId, sx: e.clientX, sy: e.clientY, s: wfScale(), target: null };
      panel.classList.add('wf-dragging');
      try { panel.setPointerCapture(e.pointerId); } catch (er) {}
      e.preventDefault();
    });
    wfCanvas.addEventListener('pointermove', (e) => {
      if (!wfDrag) return;
      const dx = (e.clientX - wfDrag.sx) / wfDrag.s, dy = (e.clientY - wfDrag.sy) / wfDrag.s;
      wfDrag.panel.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
      const tgt = wfTargetAt(e.clientX, e.clientY, wfDrag);
      if (tgt !== wfDrag.target) {
        if (wfDrag.target) wfDrag.target.classList.remove('wf-swaptarget');
        wfDrag.target = tgt;
        if (tgt) tgt.classList.add('wf-swaptarget');
      }
    });
    const wfEnd = () => {
      if (!wfDrag) return;
      const drag = wfDrag; wfDrag = null;
      drag.panel.classList.remove('wf-dragging');
      if (drag.target) drag.target.classList.remove('wf-swaptarget');
      const panels = wfPanels();
      const a = panels.indexOf(drag.panel);
      const b = drag.target ? panels.indexOf(drag.target) : -1;
      const id = wfLid();
      if (id && a >= 0 && b >= 0 && a !== b) {
        let perm = (Array.isArray(wfOrd[id]) && wfOrd[id].length === panels.length) ? wfOrd[id].slice() : panels.map((_, i) => i);
        const t = perm[a]; perm[a] = perm[b]; perm[b] = t;
        wfOrd[id] = perm; wfSaveOrd();
      }
      wfApplyOrder(); /* 자리 바꾸거나(스왑) 제자리로(스냅백) — 트랜지션이 부드럽게 이동시킨다 */
      try { drag.panel.releasePointerCapture(drag.pid); } catch (er) {}
    };
    wfCanvas.addEventListener('pointerup', wfEnd);
    wfCanvas.addEventListener('pointercancel', wfEnd);
  }

  /* 이미 유리 패널이 그려진 채 스크립트가 로드된 경우(플로우 복원 등) 저장분을 즉시 반영 */
  wfRefresh();
})();
