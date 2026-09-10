/* ── 화면 종류 복원 · 디지털 트윈 인터랙션 ── */

try {
  const ss = localStorage.getItem('wemb-screen');
  if (ss === 'dash' || ss === 'dt') state.screen = ss;
} catch (e) {}
document.querySelectorAll('#screen button').forEach(
  (b) =>
    (b.onclick = () => {
      if (b.disabled) return;
      state.screen = b.dataset.s;
      applyScreen();
    })
);

/* ===== Digital Twin 화면 상호작용 =====
   #dtStage에 위임 하나로 전부 처리. A/B 미리보기의 복제본에는 리스너가 안 붙는데,
   복제본은 색을 비교하는 정지 화면이라 그게 맞다.
   테마 미리보기용 데모라 어떤 상태도 localStorage에 저장하지 않는다. */
(function initDT() {
  const dt = document.getElementById('dtStage');
  if (!dt) return;
  const table = document.getElementById('dtTable');
  const empty = document.getElementById('dtEmpty');
  let lvFilter = null;

  /* 이벤트 현황의 발생시각 — 열 때마다 최근으로 다시 찍는다(src/recent-time.js).
     시안에 박힌 시각은 만든 날에 멈춰 있어, 그대로 두면 살아 있는 관제 화면이 아니라
     오래된 스크린샷처럼 보인다. 줄 사이 간격과 글자 모양은 원본 그대로 두고 표만 옮겨 온다.
     '패널편집'이 글자 기본값을 잡기(__dtRecaptureDefaults) 전에 불러야 새 시각이 기본값이 되고,
     손으로 고쳐 둔 시각은 그 캡처가 다시 덮어 준다(사용자 편집이 이긴다). */
  const restampLog = () => {
    try { if (window.wembRestampTimesIn) window.wembRestampTimesIn(table, '.dt-tr:not(.dt-th) .num'); } catch (e) {}
  };
  window.__dtRestampLog = restampLog;
  restampLog();

  /* 같은 묶음 안에서 하나만 선택 */
  const pickOne = (el, sel, scope) => (scope || dt).querySelectorAll(sel).forEach((x) => x.classList.toggle('on', x === el));

  function applyLogFilter() {
    let shown = 0;
    table.querySelectorAll('.dt-tr:not(.dt-th)').forEach((r) => {
      const on = !lvFilter || r.dataset.lv === lvFilter;
      r.hidden = !on;
      if (on) shown++;
    });
    empty.hidden = shown > 0;
    dt.querySelectorAll('.dt-cnt').forEach((c) => c.classList.toggle('on', c.dataset.lv === lvFilter));
    dt.querySelector('.dt-chip[data-act="all"]').classList.toggle('on', !lvFilter);
  }

  /* 검색 — 이름이 걸리는 줄만 남기고, 자식이 걸리면 부모를 남긴 채 펼쳐서 보여줌.
     검색어를 지우면 검색 전 펼침 상태로 되돌린다. */
  function filterPanel(input) {
    const card = input.closest('.dt-card');
    const root = card.querySelector('.dt-tree, .dt-drops');
    if (!root) return;
    const q = input.value.trim().toLowerCase();
    const nodes = [...root.querySelectorAll('.dt-node')];
    if (q && !root.__snap) root.__snap = nodes.map((n) => n.classList.contains('open'));
    const hit = (el) => el.textContent.toLowerCase().includes(q);
    const walk = (node) => {
      const row = node.querySelector(':scope > .dt-ti, :scope > .dt-drop');
      const kids = node.querySelector(':scope > .dt-kids > .dt-kidsin');
      let any = false;
      if (kids)
        [...kids.children].forEach((c) => {
          if (c.classList.contains('dt-node')) any = walk(c) || any;
          else {
            const m = !q || hit(c);
            c.hidden = !m;
            any = m || any;
          }
        });
      const keep = !q || hit(row) || any;
      node.hidden = !keep;
      if (q && any) node.classList.add('open');
      return keep;
    };
    [...root.children].forEach((c) => {
      if (c.classList.contains('dt-node')) walk(c);
      else if (c.classList.contains('dt-tgap')) c.hidden = !!q;
      else c.hidden = !!q && !hit(c);
    });
    if (!q && root.__snap) {
      nodes.forEach((n, i) => n.classList.toggle('open', root.__snap[i]));
      root.__snap = null;
    }
  }

  dt.addEventListener('click', (e) => {
    /* 화살표 = 접기/펴기. 줄 선택보다 먼저 가로채야 함 */
    const chev = e.target.closest('.dt-chev');
    if (chev) {
      const node = chev.closest('.dt-node');
      if (node) node.classList.toggle('open');
      e.stopPropagation();
      return;
    }
    /* 액션 버튼은 행 선택으로 번지지 않게 */
    if (e.target.closest('.dt-abtn')) {
      e.stopPropagation();
      return;
    }

    const t = e.target;
    const ti = t.closest('.dt-ti');
    if (ti && dt.contains(ti)) {
      /* 자식 있는 줄은 클릭만으로도 펼쳐지는 게 자연스러움.
         closest('.dt-node')를 쓰면 안 됨 — 잎(.dt-leaf)은 .dt-kidsin 안에 있어
         조상 노드가 잡히고, 잎을 고를 때마다 부모가 접혀버린다. 자기 줄일 때만 토글. */
      const node = ti.parentElement.classList.contains('dt-node') ? ti.parentElement : null;
      if (node && node.querySelector(':scope > .dt-kids')) node.classList.toggle('open');
      pickOne(ti, '.dt-tree .dt-ti');
      return;
    }
    const drop = t.closest('.dt-drop');
    if (drop) {
      drop.closest('.dt-node').classList.toggle('open');
      return;
    }
    /* 자산 항목은 감시 대상 켜기 — 여러 개 동시 선택 */
    const di = t.closest('.dt-di');
    if (di) {
      di.classList.toggle('on');
      return;
    }
    const cnt = t.closest('.dt-cnt');
    if (cnt) {
      lvFilter = lvFilter === cnt.dataset.lv ? null : cnt.dataset.lv;
      applyLogFilter();
      return;
    }
    const chip = t.closest('.dt-chip');
    if (chip) {
      if (chip.dataset.act === 'all') {
        lvFilter = null;
        applyLogFilter();
      } else {
        /* Ack — 확인 처리해 '신규' 배지를 지움 */
        dt.querySelectorAll('.dt-tr[data-new]').forEach((r) => r.removeAttribute('data-new'));
      }
      return;
    }
    const tr = t.closest('.dt-tr:not(.dt-th)');
    if (tr) {
      pickOne(tr, '.dt-tr:not(.dt-th)', table);
      return;
    }
    const sw = t.closest('.dt-switch');
    if (sw) {
      sw.querySelector('i').classList.toggle('on');
      return;
    }
    const nav = t.closest('.dt-nav a');
    if (nav) return pickOne(nav, '.dt-nav a');
    const nb = t.closest('.dt-navbtn');
    if (nb) return pickOne(nb, '.dt-navbtn');
    const sym = t.closest('.dt-sym');
    if (sym) return pickOne(sym, '.dt-sym');
    const tab = t.closest('.dt-tabs b');
    if (tab) return pickOne(tab, '.dt-tabs b');
  });

  dt.querySelectorAll('.dt-search input').forEach((inp) => inp.addEventListener('input', () => filterPanel(inp)));
})();
