/* ── 레이아웃 정의 — 대시보드 · 디지털 트윈 그리드와 미니 와이어프레임 ── */

(function () {
  const L = (cols, rows, cells) => ({ cols, rows, cells });
  const grid = (c, r) => {
    const a = [];
    for (let y = 1; y <= r; y++) for (let x = 1; x <= c; x++) a.push([x, y, 1, 1]);
    return a;
  };
  /* cells: [colStart, rowStart, colSpan, rowSpan] (1-based) */
  const LAYOUTS = {
    g2: [
      { id: 'g2-2r', name: '2단 · 2행', desc: '큰 카드 4개 (2×2)', ...L(2, 2, grid(2, 2)) },
      { id: 'g2-3r', name: '2단 · 3행', desc: '카드 6개 (2×3)', ...L(2, 3, grid(2, 3)) },
      { id: 'g2-4r', name: '2단 · 4행', desc: '카드 8개 (2×4)', ...L(2, 4, grid(2, 4)) },
    ],
    /* Figma Studio 119:172 / 119:198 / 119:228 구조 그대로 */
    g3: [
      { id: 'g3-2r', name: '3단 · 2행', desc: '카드 6개 (3×2)', ...L(3, 2, grid(3, 2)) },
      /* 119:198 — 열마다 다른 행 분할(3·2·3) */
      { id: 'g3-3r', name: '3단 · 3행', desc: '3열 혼합 (3·2·3행)', ...L(3, 6, [[1, 1, 1, 2], [1, 3, 1, 2], [1, 5, 1, 2], [2, 1, 1, 3], [2, 4, 1, 3], [3, 1, 1, 2], [3, 3, 1, 2], [3, 5, 1, 2]]) },
      { id: 'g3-4r', name: '3단 · 4행', desc: '3×3 + 하단 와이드 바', ...L(3, 4, [...grid(3, 3), [1, 4, 3, 1]]) },
    ],
    /* 모듈 — Figma 119:293 / 119:266 / 119:278 (혼합 벤토, 캡션 2R/3R/4R Mix) */
    mod: [
      /* 119:293 — 상단 풀폭 배너 + 하단 4열 */
      { id: 'mod-2mix', name: '모듈 · 2열 혼합', desc: '상단 배너 + 4열', ...L(4, 5, [[1, 1, 4, 2], [1, 3, 1, 3], [2, 3, 1, 3], [3, 3, 1, 3], [4, 3, 1, 3]]) },
      /* 119:266 — 2열 구성, 일부 행이 2칸으로 분할된 혼합 */
      { id: 'mod-3mix', name: '모듈 · 3열 혼합', desc: '2열 · 일부 분할', ...L(4, 3, [[1, 1, 2, 1], [1, 2, 2, 1], [1, 3, 1, 1], [2, 3, 1, 1], [3, 1, 1, 1], [4, 1, 1, 1], [3, 2, 2, 1], [3, 3, 2, 1]]) },
      /* 119:278 — 좌(2열)·우(1열) 3행 + 하단 배너 */
      { id: 'mod-4mix', name: '모듈 · 4열 혼합', desc: '좌2·우1 + 하단 배너', ...L(3, 4, [[1, 1, 2, 1], [1, 2, 2, 1], [1, 3, 2, 1], [3, 1, 1, 1], [3, 2, 1, 1], [3, 3, 1, 1], [1, 4, 3, 1]]) },
    ],
  };
  const GROUPS = [
    { key: 'g2', label: '2단', hint: '좌우 2열 — 큼직하게' },
    { key: 'g3', label: '3단', hint: '3열 — 정보를 촘촘하게' },
    { key: 'mod', label: '모듈', hint: '크기가 다른 타일의 모자이크 — Figma 모듈 프레임 그대로' },
  ];
  /* ── 디지털 트윈 전용 레이아웃 — Figma Studio 'Digital Twin' 섹션(147:756) 그대로.
     대시보드와 달리 가운데는 3D 씬이 비치도록 비우고 패널을 가장자리·코너에 배치한다.
     level = 패널 열 수(2/3/4), R = 세로 분할 정도(2/3/4). */
  const DT_LAYOUTS = {
    dt2: [
      { id: 'dt-2l-2r', name: '2레벨 · 2R', desc: '좌 1 · 우 2 패널', ...L(4, 3, [[1, 1, 1, 1], [4, 1, 1, 2], [4, 3, 1, 1]]) },
      { id: 'dt-2l-3r', name: '2레벨 · 3R', desc: '좌 세로 1 · 우 3 패널', ...L(4, 3, [[1, 1, 1, 3], [4, 1, 1, 1], [4, 2, 1, 1], [4, 3, 1, 1]]) },
      { id: 'dt-2l-4r', name: '2레벨 · 4R', desc: '좌 3 · 우 4 패널', ...L(4, 12, [[1, 1, 1, 4], [1, 5, 1, 4], [1, 9, 1, 4], [4, 1, 1, 3], [4, 4, 1, 3], [4, 7, 1, 3], [4, 10, 1, 3]]) },
    ],
    dt3: [
      { id: 'dt-3l-2r', name: '3레벨 · 2R', desc: '상단 3분할 · 하단 와이드', ...L(3, 4, [[1, 1, 1, 1], [2, 1, 1, 1], [3, 1, 1, 1], [1, 4, 3, 1]]) },
      { id: 'dt-3l-3r', name: '3레벨 · 3R', desc: '우측 2 · 하단 3분할', ...L(3, 3, [[3, 1, 1, 1], [3, 2, 1, 1], [1, 3, 1, 1], [2, 3, 1, 1], [3, 3, 1, 1]]) },
      { id: 'dt-3l-4r', name: '3레벨 · 4R', desc: '좌 2 · 우 3 · 하단 와이드', ...L(4, 7, [[1, 1, 1, 3], [1, 4, 1, 3], [4, 1, 1, 2], [4, 3, 1, 2], [4, 5, 1, 2], [1, 7, 4, 1]]) },
    ],
    dt4: [
      { id: 'dt-4l-2r', name: '4레벨 · 2R', desc: '좌상 2 · 우 세로 · 하단 2', ...L(4, 4, [[1, 1, 1, 1], [2, 1, 1, 1], [4, 1, 1, 3], [3, 4, 1, 1], [4, 4, 1, 1]]) },
      { id: 'dt-4l-3r', name: '4레벨 · 3R', desc: '상단 4 · 양측 1 · 하단 와이드', ...L(4, 4, [[1, 1, 1, 1], [2, 1, 1, 1], [3, 1, 1, 1], [4, 1, 1, 1], [1, 2, 1, 1], [4, 2, 1, 1], [1, 4, 4, 1]]) },
      { id: 'dt-4l-4r', name: '4레벨 · 4R', desc: '상·하단 4열 · 양측 3', ...L(4, 4, [[1, 1, 1, 1], [2, 1, 1, 1], [3, 1, 1, 1], [4, 1, 1, 1], [1, 2, 1, 1], [1, 3, 1, 1], [4, 2, 1, 1], [4, 3, 1, 1], [1, 4, 1, 1], [2, 4, 1, 1], [3, 4, 1, 1], [4, 4, 1, 1]]) },
    ],
  };
  const DT_GROUPS = [
    { key: 'dt2', label: '2레벨', hint: '좌·우 양쪽 패널 · 가운데 3D 씬' },
    { key: 'dt3', label: '3레벨', hint: '삼분할·상하 배치 · 넓은 씬 확보' },
    { key: 'dt4', label: '4레벨', hint: '가장자리를 촘촘히 · 정보 밀도 높게' },
  ];
  /* 화면 종류에 맞는 레이아웃/그룹 세트 (디지털 트윈이면 DT 전용) */
  const layoutsFor = (screen) => (screen === 'dt' ? DT_LAYOUTS : LAYOUTS);
  const groupsFor = (screen) => (screen === 'dt' ? DT_GROUPS : GROUPS);
  const findLayout = (id) => {
    for (const set of [LAYOUTS, DT_LAYOUTS]) {
      for (const k in set) {
        const f = set[k].find((l) => l.id === id);
        if (f) return f;
      }
    }
    return null;
  };
  function wfEl(lay) {
    const wf = document.createElement('div');
    wf.className = 'wf';
    wf.style.gridTemplateColumns = 'repeat(' + lay.cols + ',1fr)';
    wf.style.gridTemplateRows = 'repeat(' + lay.rows + ',1fr)';
    lay.cells.forEach(([x, y, w, h]) => {
      const c = document.createElement('div');
      c.className = 'wf-c';
      c.style.gridColumn = x + ' / span ' + w;
      c.style.gridRow = y + ' / span ' + h;
      wf.appendChild(c);
    });
    return wf;
  }

  window.WEMB = window.WEMB || {};
  WEMB.layouts = { DT_GROUPS, DT_LAYOUTS, GROUPS, LAYOUTS, findLayout, groupsFor, layoutsFor, wfEl };
})();
