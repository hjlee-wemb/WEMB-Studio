/* ── 템플릿 시안 위 편집 텍스트 오버레이 ── */

(function tplTextOverlay() {
  const dt = document.getElementById('dtStage');
  if (!dt) return;
  const NW = 1920, NH = 1080;
  const KEY = (tpl) => 'wemb-tpl-text-' + tpl;

  let curTpl = null;    /* 'hanjin' | 'skhynix' */
  let host = null;      /* .hj-repro | .skx-screen */
  let layer = null, stageEl = null, hintEl = null;
  let boxes = [];       /* [{id,x,y,text,size}] — x,y,size는 1920×1080 좌표계 px */
  let scale = 1, sel = null, building = false, ro = null;

  /* 현재 dtStage에 어떤 연결형 시안이 떠 있는지 판별.
     SK하이닉스(.skx-screen)는 아래 skxTextLayer 모듈이 'Figma 텍스트 재구성(Pretendard)'으로
     따로 처리하므로 여기선 한진(통짜 JPG)만 자유 텍스트 오버레이 대상으로 삼는다. */
  function detect() {
    if (dt.getAttribute('data-tpl') === 'hanjin') {
      const h = dt.querySelector('.hj-repro');
      if (h) return { tpl: 'hanjin', host: h };
    }
    return null;
  }

  function load(tpl) {
    try { const r = localStorage.getItem(KEY(tpl)); if (r) { const a = JSON.parse(r); if (Array.isArray(a)) return a; } } catch (e) {}
    return [];
  }
  function save() { if (!curTpl) return; try { localStorage.setItem(KEY(curTpl), JSON.stringify(boxes)); } catch (e) {} }

  /* 그래픽의 실제 표시 사각형(object-fit:contain / preserveAspectRatio meet)에
     맞춰 텍스트 스테이지를 배치 — 여기서만 스케일을 계산해 상자 위치/글자크기를 맞춘다. */
  function fitStage() {
    if (!host || !stageEl) return;
    const r = host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    scale = Math.min(r.width / NW, r.height / NH);
    const w = NW * scale, h = NH * scale;
    stageEl.style.width = w + 'px';
    stageEl.style.height = h + 'px';
    stageEl.style.left = ((r.width - w) / 2) + 'px';
    stageEl.style.top = ((r.height - h) / 2) + 'px';
    stageEl.style.setProperty('--tpl-scale', scale);
    positionBoxes();
  }
  function positionBoxes() {
    if (!stageEl) return;
    [...stageEl.querySelectorAll('.tpl-tbox')].forEach((el) => {
      const b = boxes.find((x) => x.id === el.dataset.id);
      if (!b) return;
      el.style.left = (b.x * scale) + 'px';
      el.style.top = (b.y * scale) + 'px';
      el.style.setProperty('--tpl-fs', b.size || 28);
    });
  }

  function selectBox(el) {
    if (sel && sel !== el) sel.classList.remove('sel');
    sel = el; if (el) el.classList.add('sel');
  }

  function makeBoxEl(b) {
    const el = document.createElement('div');
    el.className = 'tpl-tbox'; el.dataset.id = b.id;
    el.style.setProperty('--tpl-fs', b.size || 28);
    const t = document.createElement('span');
    t.className = 'tpl-t'; t.textContent = b.text;
    const del = document.createElement('button');
    del.className = 'tpl-del'; del.type = 'button'; del.textContent = '×'; del.title = '삭제';
    el.appendChild(t); el.appendChild(del);

    /* 삭제 */
    del.addEventListener('click', (e) => {
      e.stopPropagation(); e.preventDefault();
      boxes = boxes.filter((x) => x.id !== b.id);
      if (sel === el) sel = null;
      el.remove(); save();
    });
    del.addEventListener('pointerdown', (e) => { e.stopPropagation(); });

    /* 글자 입력 → 디바운스 저장 */
    let st;
    t.addEventListener('input', () => {
      b.text = t.textContent;
      clearTimeout(st); st = setTimeout(save, 300);
    });
    t.addEventListener('blur', () => { b.text = t.textContent; save(); });

    /* 클릭=선택, 끌기=이동, 짧은 클릭=글자 편집 진입 */
    el.addEventListener('pointerdown', (e) => {
      if (!layer.classList.contains('editing') || e.button !== 0) return;
      if (e.target === del) return;
      e.stopPropagation();
      selectBox(el);
      const rect = stageEl.getBoundingClientRect();
      const st0 = { sx: e.clientX, sy: e.clientY, ox: b.x, oy: b.y, moved: false, pid: e.pointerId };
      const onMove = (ev) => {
        const dx = (ev.clientX - st0.sx) / scale, dy = (ev.clientY - st0.sy) / scale;
        if (!st0.moved && Math.hypot(ev.clientX - st0.sx, ev.clientY - st0.sy) < 3) return;
        st0.moved = true;
        b.x = Math.max(0, Math.min(NW, st0.ox + dx));
        b.y = Math.max(0, Math.min(NH, st0.oy + dy));
        el.style.left = (b.x * scale) + 'px';
        el.style.top = (b.y * scale) + 'px';
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        if (st0.moved) { save(); }
        else {
          /* 이동 안 했으면 글자 편집으로 — 캐럿 배치 */
          t.setAttribute('contenteditable', 'true');
          t.focus();
          try {
            const rg = document.createRange(); rg.selectNodeContents(t);
            const s = window.getSelection(); s.removeAllRanges(); s.addRange(rg);
          } catch (e2) {}
        }
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });
    return el;
  }

  function render() {
    if (!stageEl) return;
    [...stageEl.querySelectorAll('.tpl-tbox')].forEach((el) => el.remove());
    boxes.forEach((b) => stageEl.appendChild(makeBoxEl(b)));
    positionBoxes();
  }

  function addBox(clientX, clientY) {
    const rect = stageEl.getBoundingClientRect();
    const x = Math.max(0, Math.min(NW, (clientX - rect.left) / scale));
    const y = Math.max(0, Math.min(NH, (clientY - rect.top) / scale));
    const b = { id: 't' + Date.now().toString(36) + Math.floor(Math.random() * 1e3), x, y, text: '텍스트', size: 28 };
    boxes.push(b); save();
    const el = makeBoxEl(b); stageEl.appendChild(el);
    positionBoxes(); selectBox(el);
    const t = el.querySelector('.tpl-t');
    t.setAttribute('contenteditable', 'true'); t.focus();
    try { const rg = document.createRange(); rg.selectNodeContents(t); const s = window.getSelection(); s.removeAllRanges(); s.addRange(rg); } catch (e) {}
  }

  function buildLayer() {
    teardown();
    building = true;
    layer = document.createElement('div');
    layer.className = 'tpl-textlayer';
    stageEl = document.createElement('div');
    stageEl.className = 'tpl-textstage';
    hintEl = document.createElement('div');
    hintEl.className = 'tpl-hint';
    hintEl.textContent = '빈 곳을 더블클릭해 글자 추가 · 글자를 끌어 이동 · 클릭해 수정 · × 삭제';
    layer.appendChild(hintEl);
    layer.appendChild(stageEl);

    /* 빈 영역 더블클릭 → 새 글자 상자 */
    stageEl.addEventListener('dblclick', (e) => {
      if (!layer.classList.contains('editing')) return;
      if (e.target !== stageEl) return; /* 상자 위 더블클릭은 무시 */
      addBox(e.clientX, e.clientY);
    });
    /* 빈 곳 클릭 시 선택 해제 */
    stageEl.addEventListener('pointerdown', (e) => { if (e.target === stageEl) selectBox(null); });

    host.appendChild(layer);
    boxes = load(curTpl);
    render();
    fitStage();
    if (ro) ro.disconnect();
    ro = new ResizeObserver(() => fitStage());
    ro.observe(host);
    building = false;
  }

  function teardown() {
    if (ro) { ro.disconnect(); ro = null; }
    if (layer) { building = true; layer.remove(); building = false; }
    layer = stageEl = hintEl = null; sel = null; boxes = [];
  }

  function updateEditing() {
    if (!layer) return;
    layer.classList.toggle('editing', dt.classList.contains('dt-content-editing'));
    if (!dt.classList.contains('dt-content-editing')) {
      selectBox(null);
      [...(stageEl ? stageEl.querySelectorAll('.tpl-t[contenteditable]') : [])].forEach((t) => t.removeAttribute('contenteditable'));
    }
  }

  function sync() {
    if (building) return;
    const d = detect();
    if (!d) { if (layer) teardown(); curTpl = null; host = null; return; }
    if (d.host !== host || d.tpl !== curTpl) {
      curTpl = d.tpl; host = d.host;
      buildLayer();
    }
    updateEditing();
  }

  /* dtStage 변화 관찰 — 시안 교체(childList)·편집모드 토글(class)·템플릿 전환(data-tpl) */
  const mo = new MutationObserver((muts) => {
    if (building) return;
    /* 내 레이어 내부에서 난 변화는 무시(무한 루프 방지) */
    for (const m of muts) { if (m.target.closest && m.target.closest('.tpl-textlayer')) continue; }
    const relevant = muts.some((m) => !(m.target.closest && m.target.closest('.tpl-textlayer')));
    if (relevant) sync();
  });
  mo.observe(dt, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'data-tpl'] });

  /* 리셋 연동은 별도로 두지 않는다: '전체 기본값으로 되돌리기'(doResetAll)는 이미
     wemb-* 키를 통째로 지우고 새로고침하므로 오버레이 글자(wemb-tpl-text-*)도 함께 초기화되고,
     '색 정하기 초기화'는 대시보드 내용을 보존해야 하므로 오버레이를 건드리면 안 된다.
     개별 글자는 편집 모드에서 × 로 지운다. */

  /* 초기 동기화(이미 연결형 시안이 떠 있는 새로고침 복원 대비) */
  sync();
  window.addEventListener('resize', fitStage);
  window.__tplTextSync = sync;
})();
