/* ── 대시보드 페이지 차트 ── */

/* ============================================================
 *  차트 종류 전환 — '내용 수정하기' 모드에서 차트/그래프 종류를
 *  바꾸고, 내용에 맞는 종류를 추천해 줌. 선택은 자동 저장.
 * ============================================================ */
const DashCharts = (function () {
  const C_MAIN = 'var(--point-main)',
    C_SUB = 'var(--point-sub)';
  const PAL = [
    C_MAIN,
    C_SUB,
    'color-mix(in srgb, var(--point-main) 55%, var(--line))',
    'color-mix(in srgb, var(--point-sub) 55%, var(--line))',
    'color-mix(in srgb, var(--text-weak) 60%, var(--line))',
    'var(--warning)',
    'var(--danger)',
    'var(--line)',
  ];
  /* 선택 가능한 모든 종류 — 카테고리(cat)로 묶어 드롭다운에서 구분해 보여줌 */
  const CATS = [
    { key: 'data', name: '데이터', ico: '🗂️' },
    { key: 'trend', name: '차트 · 그래프', ico: '📈' },
    { key: 'ratio', name: '비율 차트', ico: '🍩' },
    { key: 'level', name: '지표 · 분포', ico: '📊' },
  ];
  const TYPES = [
    { k: 'table', cat: 'data', name: '테이블', ico: '▦', desc: '여러 항목·수치를 표로 나열' },
    { k: 'line', cat: 'trend', name: '꺾은선 그래프', ico: '📈', desc: '시간 흐름에 따른 추세' },
    { k: 'area', cat: 'trend', name: '영역 그래프', ico: '🏔️', desc: '연속적인 누적·사용량 강조' },
    { k: 'bar', cat: 'trend', name: '막대 그래프', ico: '📊', desc: '구간·항목별 값 비교' },
    { k: 'hbar', cat: 'trend', name: '가로 막대', ico: '📶', desc: '항목명이 긴 값의 크기 순 비교' },
    { k: 'pareto', cat: 'trend', name: '파레토', ico: '🏗️', desc: '값 순 막대 + 누적 비중선(80% 원칙)' },
    { k: 'waterfall', cat: 'trend', name: '워터폴', ico: '🪜', desc: '증감이 쌓여 최종값이 되는 과정' },
    { k: 'donut', cat: 'ratio', name: '도넛 차트', ico: '🍩', desc: '전체 대비 구성 비율' },
    { k: 'pie', cat: 'ratio', name: '파이 차트', ico: '🥧', desc: '전체 대비 구성 비율' },
    { k: 'stacked', cat: 'ratio', name: '100% 스택 막대', ico: '🧱', desc: '한 항목이 무엇으로 채워졌는지' },
    { k: 'gauge', cat: 'level', name: '게이지', ico: '⏱️', desc: '목표 대비 현재 수준' },
    { k: 'bullet', cat: 'level', name: '불릿 차트', ico: '🎯', desc: '목표 대비 실적 위치' },
    { k: 'progress', cat: 'level', name: '진행률 막대', ico: '📊', desc: '항목별 비율 순위' },
    { k: 'heatmap', cat: 'level', name: '히트맵', ico: '🟩', desc: '값의 분포·밀도' },
  ];
  /* 전환 대상 차트 정의(대표 데이터 포함 — 애니메이션 기본형은 build로 다시 그림) */
  const DEFS = [
    {
      id: 'ch-tp',
      title: 'Throughput',
      def: 'line',
      build: makeThroughput,
      data: {
        labels: ['08', '09', '10', '11', '12', '13', '14', '15', '16'],
        series: [
          { name: 'PEAK 데이', color: C_SUB, values: [160, 150, 138, 150, 120, 132, 118, 126, 110] },
          { name: '금일', color: C_MAIN, values: [40, 80, 120, 150, 190, 210, 250, 300, 340] },
        ],
      },
    },
    {
      id: 'ch-cn',
      title: 'Connected',
      def: 'bar',
      build: makeConnected,
      data: {
        labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'],
        series: [{ name: 'Connected', color: C_MAIN, values: [46, 58, 39, 72, 64, 50, 81, 55, 68, 42, 77, 60, 53, 70] }],
      },
    },
    {
      id: 'ch-ci',
      title: '회선 사용량 정보',
      def: 'area',
      build: makeCircuit,
      data: {
        labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'],
        series: [{ name: '회선 사용량', color: C_MAIN, values: [62, 66, 70, 68, 64, 72, 75, 70, 66, 69, 74, 71, 67, 73] }],
      },
    },
    {
      id: 'donut',
      title: 'CPU(Core)',
      def: 'donut',
      build: null,
      hostSel: '.donut-wrap',
      data: {
        labels: ['마케팅 정보 분석', '클라우드관리플랫폼', '어플리케이션 보안', '지속적 통합배포', '스마트창구'],
        series: [{ name: 'CPU', color: C_MAIN, values: [38, 22, 18, 14, 8] }],
      },
    },
    /* --- 표·게이지·진행률 등 나머지 데이터 패널: 기본형은 원본 HTML 유지, 다른 종류는 추출 데이터로 렌더 --- */
    {
      id: 'p-biz',
      title: '주요 업무 현황',
      def: 'table',
      body: true,
      find: () => panelBodyByTitle('주요 업무 현황'),
      data: {
        labels: ['1Q', '상품처리', '개인뱅킹', '기업뱅킹'],
        series: [{ name: '초당처리량', color: C_MAIN, values: [1868, 665, 1420, 980] }],
      },
    },
    {
      id: 'p-delay',
      title: '타 기관 지연 TOP5',
      def: 'table',
      body: true,
      find: () => panelBodyByTitle('타 기관 지연 TOP5'),
      data: {
        labels: ['국민은행', '카카오뱅크', '지역농협', '농협은행', '우리은행'],
        series: [{ name: 'time_out', color: C_MAIN, values: [1009, 834, 819, 677, 623] }],
      },
    },
    {
      id: 'p-grpcpu',
      title: '주요 업무 그룹 CPU 현황',
      def: 'gauge',
      body: true,
      find: () => panelBodyByTitle('주요 업무 그룹 CPU 현황'),
      data: {
        labels: ['상품', '디지털', 'EBK', '채널EIC', '대내EIC', '대외EIC'],
        series: [{ name: 'CPU', color: C_MAIN, values: [24, 20, 18, 2, 5, 8] }],
      },
    },
    {
      id: 'p-host',
      title: 'Host & Service Status Monitoring',
      def: 'table',
      body: true,
      find: () => panelBodyByTitle('Host & Service Status Monitoring'),
      data: {
        labels: ['Client', 'Network', 'System', 'e-Banking'],
        series: [{ name: 'Host Up', color: C_MAIN, values: [838, 529, 16, 72] }],
      },
    },
    {
      id: 'p-secres',
      title: '보안시스템 자원 사용 현황',
      def: 'progress',
      body: true,
      find: () => panelBodyByTitle('보안시스템 자원 사용 현황'),
      data: {
        labels: ['하나쉴드 AP#13', 'Any 로그관리', '디지털캠퍼스 #1', '디지털캠퍼스 #2', 'SO VDIDCOM25'],
        series: [{ name: 'CPU %', color: C_MAIN, values: [81, 70, 60, 53, 36] }],
      },
    },
    {
      id: 'p-week',
      title: '보안시스템 가동 현황',
      def: 'heatmap',
      body: true,
      find: () => {
        const h = document.getElementById('heat');
        return h ? h.closest('.pbody') : null;
      },
      data: {
        labels: ['07/22', '07/23', '07/24', '07/25', '07/26', '07/27'],
        series: [
          { name: 'Client', color: C_MAIN, values: [1, 1, 2, 1, 1, 1] },
          { name: 'Network', color: C_MAIN, values: [1, 2, 1, 1, 3, 1] },
          { name: 'System', color: C_MAIN, values: [1, 1, 1, 2, 1, 1] },
          { name: 'e-Banking', color: C_MAIN, values: [2, 1, 1, 1, 1, 2] },
        ],
      },
    },
    /* ===== Production 페이지 차트 — Overview와 같은 전환 시스템에 편입 =====
       기본 종류(def)는 그 데이터에 가장 어울리는 새 유형(파레토·워터폴·스택·불릿 등)이고,
       편집 모드에서 다른 종류로도 바꿀 수 있다. 호스트는 숨겨진 페이지 안이라도 존재한다. */
    {
      id: 'pd-out',
      title: '시간대별 생산 실적',
      def: 'bar',
      data: {
        labels: ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17'],
        series: [
          { name: '계획', color: C_SUB, values: [1400, 1400, 1400, 1400, 700, 1400, 1400, 1400, 1400, 1400] },
          { name: '실적', color: C_MAIN, values: [1362, 1418, 1445, 1390, 664, 1352, 1471, 1428, 1396, 1310] },
        ],
      },
    },
    {
      id: 'pd-stack',
      title: '라인별 시간 구성',
      def: 'stacked',
      data: {
        labels: ['A라인', 'B라인', 'C라인', 'D라인', 'E라인', 'F라인'],
        series: [
          { name: '가동', color: C_MAIN, values: [88, 82, 79, 90, 71, 68] },
          { name: '계획정지', color: C_SUB, values: [6, 7, 9, 5, 8, 10] },
          { name: '비계획', color: 'var(--danger)', values: [3, 8, 7, 2, 14, 12] },
          { name: '유휴', color: 'color-mix(in srgb, var(--text-weak) 35%, var(--line))', values: [3, 3, 5, 3, 7, 10] },
        ],
      },
    },
    {
      id: 'pd-pareto',
      title: '비가동 원인 파레토',
      def: 'pareto',
      data: {
        labels: ['자재대기', '금형교체', '설비고장', '품질점검', '작업준비'],
        series: [{ name: '비가동 시간', color: C_MAIN, values: [143, 126, 98, 62, 52] }],
      },
    },
    {
      id: 'pd-waterfall',
      title: 'OEE 손실 분석',
      def: 'waterfall',
      data: {
        labels: ['계획', '비가동', '속도', '불량'],
        series: [{ name: '증감', color: C_MAIN, values: [480, -31, -26, -8] }],
      },
    },
    {
      id: 'pd-defect',
      title: '불량 유형 분석',
      def: 'hbar',
      data: {
        labels: ['외관 스크래치', '치수 불량', '조립 불량', '도장 얼룩', '기타'],
        series: [{ name: '불량 수량', color: C_MAIN, values: [168, 132, 96, 78, 65] }],
      },
    },
    {
      id: 'pd-bullet',
      title: '라인별 목표 달성',
      def: 'bullet',
      data: {
        labels: ['A라인', 'B라인', 'C라인', 'D라인', 'E라인', 'F라인'],
        series: [
          { name: '실적', color: C_MAIN, values: [26800, 0, 23100, 25200, 19800, 17600] },
          { name: '목표', color: C_SUB, values: [26000, 26000, 26000, 24000, 24000, 22000] },
        ],
      },
    },
  ];

  let gid = 0;
  const maxOf = (d) => Math.max(1, ...d.series.reduce((a, s) => a.concat(s.values), []));
  const colorOf = (s, i) => s.color || PAL[i % PAL.length];
  function niceMax(m) {
    const p = Math.pow(10, Math.floor(Math.log10(m)));
    const n = m / p;
    const s = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
    return s * p;
  }
  /* 축이 필요한 종류(line/area/bar)를 그릴 대상 — .chart 그리드를 재사용 */
  function axisTarget(host) {
    if (host.classList.contains('chart')) {
      host.style.display = '';
      host.innerHTML = '';
      return host;
    }
    host.innerHTML = '';
    host.style.display = 'block';
    const c = document.createElement('div');
    c.className = 'chart';
    c.style.height = '100%';
    host.appendChild(c);
    return c;
  }
  function renderAxis(host, data, type) {
    const t = axisTarget(host);
    const mx = niceMax(maxOf(data) * 1.05);
    const yt = [mx, mx * 0.75, mx * 0.5, mx * 0.25, 0].map((v) => Math.round(v).toLocaleString());
    const { defs, series, plot } = axes(t, yt, data.labels, 5);
    const n = data.labels.length,
      step = 400 / (n - 1),
      ys = (v) => 200 - (v / mx) * 200;
    bindPlotTip(plot, () => ({
      n,
      max: mx,
      type,
      label: (i) => data.labels[i],
      series: data.series.map((s, si) => ({ name: s.name, color: colorOf(s, si), values: s.values })),
    }));
    if (type === 'bar') {
      const ns = data.series.length,
        groupW = step * 0.7,
        bw = groupW / ns;
      data.series.forEach((s, si) => {
        s.values.forEach((v, i) => {
          const x = i * step - groupW / 2 + si * bw,
            y = ys(v);
          const r = svgEl('rect', { x: x.toFixed(1), y: y.toFixed(1), width: (bw * 0.86).toFixed(1), height: (200 - y).toFixed(1), rx: 2, fill: colorOf(s, si) });
          r.style.animation = 'rise .6s cubic-bezier(.2,.8,.2,1) backwards';
          r.style.animationDelay = i * 0.03 + 's';
          series.appendChild(r);
        });
      });
    } else {
      data.series.forEach((s, si) => {
        const col = colorOf(s, si),
          p = spline(s.values, step, ys);
        if (type === 'area') {
          const g = 'cg' + gid++;
          const lg = svgEl('linearGradient', { id: g, x1: 0, y1: 0, x2: 0, y2: 1 });
          lg.append(svgEl('stop', { offset: '0%', 'stop-color': col, 'stop-opacity': 0.34 }), svgEl('stop', { offset: '100%', 'stop-color': col, 'stop-opacity': 0.02 }));
          defs.appendChild(lg);
          series.appendChild(svgEl('path', { d: p + ` L ${(n - 1) * step} 200 L 0 200 Z`, fill: `url(#${g})` }));
        }
        const ln = svgEl('path', { d: p, fill: 'none', stroke: col, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
        series.appendChild(ln);
        series.appendChild(svgEl('circle', { r: 3, fill: col, cx: Math.min((n - 1) * step, 398), cy: ys(s.values[n - 1]) }));
        const L = ln.getTotalLength ? ln.getTotalLength() : 0;
        if (L) {
          ln.style.strokeDasharray = L;
          ln.style.strokeDashoffset = L;
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              ln.style.transition = 'stroke-dashoffset 1s ease';
              ln.style.strokeDashoffset = '0';
            })
          );
        }
      });
    }
  }
  function segsOf(data) {
    if (data.series.length > 1) return data.series.map((s, i) => ({ name: s.name, val: s.values.reduce((a, b) => a + b, 0), col: colorOf(s, i) }));
    return data.labels.map((l, i) => ({ name: l, val: data.series[0].values[i], col: PAL[i % PAL.length] }));
  }
  function arcPath(cx, cy, r, a0, a1) {
    const rad = (d) => (d * Math.PI) / 180;
    const x0 = cx + r * Math.cos(rad(a0)),
      y0 = cy + r * Math.sin(rad(a0)),
      x1 = cx + r * Math.cos(rad(a1)),
      y1 = cy + r * Math.sin(rad(a1)),
      large = a1 - a0 > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
  }
  function renderDonut(host, data, isPie) {
    host.innerHTML = '';
    host.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;height:100%';
    const segs = segsOf(data),
      total = segs.reduce((a, s) => a + s.val, 0) || 1;
    const svg = svgEl('svg', { viewBox: '0 0 128 128' });
    svg.style.cssText = 'width:128px;height:128px;flex:none';
    const cx = 64,
      cy = 64;
    const head = host.closest('.panel') && host.closest('.panel').querySelector('.ph h3');
    const tag = (el, s) => {
      el.dataset.tip = s.name;
      el.dataset.tipV = `${tipNum(s.val)} · ${Math.round((s.val / total) * 100)}%`;
      el.dataset.tipC = s.col;
      if (head) el.dataset.tipH = head.textContent.trim();
      return el;
    };
    if (isPie) {
      const r = 58;
      let ang = -90;
      segs.forEach((s) => {
        const a1 = ang + (s.val / total) * 360;
        svg.appendChild(tag(svgEl('path', { d: arcPath(cx, cy, r, ang, a1), fill: s.col, stroke: 'var(--bg-surface)', 'stroke-width': 1 }), s));
        ang = a1;
      });
    } else {
      const r = 46,
        C = 2 * Math.PI * r,
        gap = 6;
      let off = 0;
      segs.forEach((s) => {
        const seg = (C * s.val) / total;
        const c = svgEl('circle', {
          cx,
          cy,
          r,
          fill: 'none',
          stroke: s.col,
          'stroke-width': 16,
          'stroke-dasharray': `${Math.max(0, seg - gap)} ${C - Math.max(0, seg - gap)}`,
          'stroke-dashoffset': -off,
          transform: `rotate(-90 ${cx} ${cy})`,
        });
        c.style.transition = 'stroke-dasharray .8s ease';
        svg.appendChild(tag(c, s));
        off += seg;
      });
    }
    svg.classList.add('donut-svg');
    const leg = document.createElement('div');
    leg.className = 'dleg';
    leg.innerHTML = segs.map((s) => `<div class="row"><i style="background:${s.col}"></i>${s.name}<b>${Math.round((s.val / total) * 100)}%</b></div>`).join('');
    host.append(svg, leg);
  }
  function renderGauge(host, data) {
    host.innerHTML = '';
    host.style.cssText = 'display:flex;align-items:center;justify-content:center;height:100%';
    const mx = maxOf(data);
    const items =
      data.series.length > 1
        ? data.series.map((s, i) => ({ name: s.name, pct: Math.round((s.values.reduce((a, b) => a + b, 0) / s.values.length / mx) * 100) }))
        : data.labels.map((l, i) => ({ name: l, pct: Math.round((data.series[0].values[i] / mx) * 100) }));
    const wrap = document.createElement('div');
    wrap.className = 'mini-row';
    wrap.style.width = '100%';
    wrap.innerHTML = items
      .slice(0, 8)
      .map((it) => `<div class="mini"><div class="d" style="--v:${it.pct}%"><b>${it.pct}%</b></div>${it.name}</div>`)
      .join('');
    host.appendChild(wrap);
  }
  function renderHeat(host, data) {
    host.innerHTML = '';
    host.style.cssText = 'display:block;padding:6px 0;overflow:auto';
    const mx = maxOf(data);
    const cell = (v, i, s) =>
      `<div data-tip="${s.name}" data-tip-h="${data.labels[i] || ''}" data-tip-v="${tipNum(v)}" data-tip-c="var(--point-main)" style="flex:1;aspect-ratio:1;min-width:14px;border-radius:4px;background:color-mix(in srgb,var(--point-main) ${Math.round(
              12 + (v / mx) * 78
            )}%,transparent)"></div>`;
    let h = '<div style="display:flex;flex-direction:column;gap:4px">';
    data.series.forEach((s) => {
      h += '<div style="display:flex;gap:4px">' + s.values.map((v, i) => cell(v, i, s)).join('') + '</div>';
    });
    h += '</div>';
    h +=
      '<div style="display:flex;gap:4px;margin-top:6px;color:var(--text-weak);font-size:11px">' +
      data.labels.map((l) => `<span style="flex:1;min-width:14px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l}</span>`).join('') +
      '</div>';
    host.innerHTML = h;
  }
  function renderProgress(host, data) {
    host.innerHTML = '';
    host.style.cssText = 'display:block;padding:6px 2px;overflow:auto';
    const mx = maxOf(data),
      s = data.series[0];
    const rows = data.labels.map((l, i) => ({ n: l, v: s.values[i] })).sort((a, b) => b.v - a.v);
    host.innerHTML =
      '<div class="plist">' +
      rows
        .map(
          (r) =>
            `<div class="prow"><span class="nm">${r.n}</span><div class="track"><div class="fill" style="width:${Math.round((r.v / mx) * 100)}%"></div></div><span class="pv num">${r.v}</span></div>`
        )
        .join('') +
      '</div>';
  }

  function renderTable(host, data) {
    host.style.cssText = 'display:block;overflow:auto';
    const h =
      '<table><thead><tr><th>항목</th>' +
      data.series.map((s) => `<th class="num" style="text-align:right">${s.name}</th>`).join('') +
      '</tr></thead><tbody>' +
      data.labels.map((l, i) => '<tr class="rowline"><td>' + l + '</td>' + data.series.map((s) => `<td class="num">${Number(s.values[i]).toLocaleString()}</td>`).join('') + '</tr>').join('') +
      '</tbody></table>';
    host.innerHTML = h;
  }
  const panelHead = (host) => {
    const h = host.closest('.panel') && host.closest('.panel').querySelector('.ph h3');
    return h ? h.textContent.trim() : '';
  };
  /* ── 파레토: 값 내림차순 막대 + 누적 비중선 + 80% 기준선(단일 계열) ── */
  function renderPareto(host, data) {
    const t = axisTarget(host);
    const s0 = data.series[0];
    const rows = data.labels.map((l, i) => ({ l, v: +s0.values[i] || 0 })).sort((a, b) => b.v - a.v);
    const mins = rows.map((r) => r.v),
      total = mins.reduce((a, b) => a + b, 0) || 1;
    let run = 0;
    const cum = mins.map((v) => Math.round(((run += v) / total) * 1000) / 10);
    const mx = niceMax(Math.max(1, ...mins) * 1.05);
    const yt = [mx, mx * 0.75, mx * 0.5, mx * 0.25, 0].map((v) => Math.round(v).toLocaleString());
    const { defs, series, plot } = axes(t, yt, rows.map((r) => r.l), 5);
    const n = rows.length,
      step = 400 / (n - 1),
      bw = step * 0.5,
      ys = (v) => 200 - (v / mx) * 200,
      yp = (p) => 200 - (p / 100) * 200;
    const ggid = 'cg' + gid++;
    const lg = svgEl('linearGradient', { id: ggid, x1: 0, y1: 0, x2: 0, y2: 1 });
    lg.append(svgEl('stop', { offset: '0%', 'stop-color': C_MAIN }), svgEl('stop', { offset: '100%', 'stop-color': C_SUB }));
    defs.appendChild(lg);
    mins.forEach((v, i) => {
      const y = ys(v);
      const r = svgEl('rect', { x: (i * step - bw / 2).toFixed(1), y: y.toFixed(1), width: bw.toFixed(1), height: (200 - y).toFixed(1), rx: 2, fill: `url(#${ggid})` });
      r.style.animation = 'rise .6s cubic-bezier(.2,.8,.2,1) backwards';
      r.style.animationDelay = i * 0.04 + 's';
      series.appendChild(r);
    });
    series.appendChild(svgEl('line', { x1: 0, y1: yp(80), x2: 400, y2: yp(80), stroke: 'var(--warning)', 'stroke-width': 1, 'stroke-dasharray': '4 4', opacity: 0.85 }));
    const cumLine = svgEl('path', { d: cum.map((p, i) => (i ? 'L' : 'M') + ' ' + i * step + ' ' + yp(p)).join(' '), fill: 'none', stroke: C_SUB, 'stroke-width': 2, 'stroke-linejoin': 'round' });
    series.appendChild(cumLine);
    cum.forEach((p, i) => series.appendChild(svgEl('circle', { cx: i * step, cy: yp(p), r: 3, fill: C_SUB })));
    bindPlotTip(plot, () => ({
      n,
      max: mx,
      type: 'bar',
      label: (i) => rows[i].l,
      series: [
        { name: s0.name || '값', color: C_MAIN, values: mins },
        { name: '누적 비중', unit: '%', color: C_SUB, values: cum },
      ],
    }));
  }
  /* ── 워터폴: 부호 있는 증감이 쌓여 최종값이 되는 과정(단일 계열) ── */
  function renderWaterfall(host, data) {
    const t = axisTarget(host);
    const s0 = data.series[0],
      vals = s0.values.map(Number);
    const cum = [];
    let run = 0;
    vals.forEach((v) => cum.push((run += v)));
    const mx = niceMax(Math.max(1, ...cum, 0) * 1.05);
    const yt = [mx, mx * 0.75, mx * 0.5, mx * 0.25, 0].map((v) => Math.round(v).toLocaleString());
    const { series, plot } = axes(t, yt, data.labels, 5);
    const n = vals.length,
      step = 400 / (n - 1),
      bw = step * 0.5,
      ys = (v) => 200 - (v / mx) * 200;
    let prev = 0;
    vals.forEach((v, i) => {
      const start = prev,
        end = prev + v;
      prev = end;
      const up = v >= 0;
      const yTop = ys(Math.max(start, end)),
        yBot = ys(Math.min(start, end));
      const r = svgEl('rect', { x: (i * step - bw / 2).toFixed(1), y: yTop.toFixed(1), width: bw.toFixed(1), height: Math.max(2, yBot - yTop).toFixed(1), rx: 2, fill: up ? C_MAIN : 'var(--danger)', opacity: up ? 1 : 0.85 });
      r.style.animation = 'rise .6s cubic-bezier(.2,.8,.2,1) backwards';
      r.style.animationDelay = i * 0.05 + 's';
      series.appendChild(r);
      if (i < n - 1) series.appendChild(svgEl('line', { x1: i * step + bw / 2, y1: ys(end), x2: (i + 1) * step - bw / 2, y2: ys(end), stroke: 'var(--line)', 'stroke-dasharray': '3 3', 'stroke-width': 1 }));
    });
    bindPlotTip(plot, () => ({
      n,
      max: mx,
      type: 'bar',
      label: (i) => data.labels[i],
      series: [
        { name: '증감', colorAt: (i) => (vals[i] >= 0 ? C_MAIN : 'var(--danger)'), values: vals },
        { name: '누계', color: C_SUB, values: cum },
      ],
    }));
  }
  /* ── 100% 스택 막대: 한 항목(행)이 무엇으로 채워졌는지 ── */
  function renderStacked(host, data) {
    host.style.cssText = 'display:flex;flex-direction:column;gap:9px;height:100%;justify-content:center;padding:4px 2px;overflow:auto';
    const head = panelHead(host);
    const rows = data.labels.map((l, li) => {
      const parts = data.series.map((s, si) => ({ name: s.name, v: +s.values[li] || 0, col: colorOf(s, si) }));
      const tot = parts.reduce((a, p) => a + p.v, 0) || 1;
      return { l, parts, tot };
    });
    host.innerHTML = rows
      .map(
        (r) =>
          `<div class="strow"><span class="nm">${r.l}</span><div class="stbar">` +
          r.parts
            .map(
              (p, si) =>
                `<span style="width:${((p.v / r.tot) * 100).toFixed(1)}%;background:${p.col};animation-delay:${(si * 0.04).toFixed(2)}s" ` +
                `data-tip="${p.name}" data-tip-h="${head} · ${r.l}" data-tip-v="${Math.round((p.v / r.tot) * 100)}% · ${tipNum(p.v)}" data-tip-c="${p.col}"></span>`
            )
            .join('') +
          `</div><span class="pct">${Math.round((r.parts[0].v / r.tot) * 100)}%</span></div>`
      )
      .join('');
  }
  /* ── 가로 막대: 항목명이 긴 값의 크기 순 비교(단일 계열) ── */
  function renderHBar(host, data) {
    host.style.cssText = 'display:flex;flex-direction:column;gap:10px;height:100%;justify-content:center;padding:4px 2px;overflow:auto';
    const s0 = data.series[0];
    const rows = data.labels.map((l, i) => ({ l, v: +s0.values[i] || 0 })).sort((a, b) => b.v - a.v);
    const mx = Math.max(1, ...rows.map((r) => r.v));
    const head = panelHead(host);
    host.innerHTML = rows
      .map(
        (r, i) =>
          `<div class="hbrow" data-tip="${r.l}" data-tip-h="${head}" data-tip-v="${tipNum(r.v)}" data-tip-c="var(--point-main)">` +
          `<span class="nm">${r.l}</span><div class="hbtrack"><i style="width:${((r.v / mx) * 100).toFixed(1)}%;animation-delay:${(i * 0.05).toFixed(2)}s"></i></div><span class="vv">${tipNum(r.v)}</span></div>`
      )
      .join('');
  }
  /* ── 불릿 차트: 목표 대비 실적 위치. 계열2가 있으면 목표로, 없으면 스케일 80%를 기준으로 ── */
  function renderBullet(host, data) {
    host.style.cssText = 'display:flex;flex-direction:column;gap:12px;height:100%;justify-content:center;padding:4px 2px;overflow:auto';
    const meas = data.series[0],
      tgt = data.series[1];
    const mx = niceMax(Math.max(1, ...meas.values.map(Number), ...(tgt ? tgt.values.map(Number) : [0])) * 1.15);
    const head = panelHead(host);
    host.innerHTML = data.labels
      .map((l, i) => {
        const a = +meas.values[i] || 0,
          tv = tgt ? +tgt.values[i] || 0 : mx * 0.8;
        const miss = a < tv;
        return (
          `<div class="blrow" data-tip="${l}" data-tip-h="${head} · 목표 ${tipNum(tv)}" data-tip-v="${tipNum(a)} · ${Math.round((a / (tv || 1)) * 100)}%" data-tip-c="${miss ? 'var(--warning)' : 'var(--point-main)'}">` +
          `<span class="nm">${l}</span><div class="bltrack">` +
          `<div class="blmeasure ${miss ? 'miss' : ''}" style="width:${((a / mx) * 100).toFixed(1)}%;animation-delay:${(i * 0.05).toFixed(2)}s"></div>` +
          `<div class="bltarget" style="left:${((tv / mx) * 100).toFixed(1)}%"></div></div>` +
          `<span class="vv">${tipNum(a)}</span></div>`
        );
      })
      .join('');
  }
  function genericRender(def, type) {
    const host = def.hostEl,
      data = def.data;
    if (type === 'line' || type === 'area' || type === 'bar') renderAxis(host, data, type);
    else if (type === 'pareto') renderPareto(host, data);
    else if (type === 'waterfall') renderWaterfall(host, data);
    else if (type === 'stacked') renderStacked(host, data);
    else if (type === 'hbar') renderHBar(host, data);
    else if (type === 'bullet') renderBullet(host, data);
    else if (type === 'donut') renderDonut(host, data, false);
    else if (type === 'pie') renderDonut(host, data, true);
    else if (type === 'gauge') renderGauge(host, data);
    else if (type === 'heatmap') renderHeat(host, data);
    else if (type === 'progress') renderProgress(host, data);
    else if (type === 'table') renderTable(host, data);
  }
  function render(def, type) {
    const host = def.hostEl;
    host.removeAttribute('style');
    def.ctrl = null;
    if (type === def.def) {
      /* 기본형 복원 — 실시간 차트는 다시 그리고, 원래 표/게이지/진행률/로그는 원본 HTML 복원 */
      if (def.build) {
        host.innerHTML = '';
        def.ctrl = def.build();
      } else if (def.id === 'donut') {
        host.innerHTML = '<svg class="donut-svg" id="donut" viewBox="0 0 128 128"></svg><div class="dleg" id="dleg"></div>';
        makeDonut();
      } else if (def.html0 != null) {
        host.innerHTML = def.html0;
      } else {
        genericRender(def, type);
      }
    } else {
      genericRender(def, type);
    }
    def.cur = type;
    updateBtn(def);
    if (typeof enhanceEnterpriseBars === 'function') enhanceEnterpriseBars(document.querySelector('.main')); /* Enterprise: 새로 그린 진행률 막대 색 보정 */
  }

  /* 제목(타이틀)의 키워드로 어울리는 종류를 추천 */
  function recommend(def) {
    const title = def.title || '',
      multi = def.data.series.length > 1,
      n = def.data.labels.length;
    /* 생산 지표 전용 추천 — Overview 제목에는 걸리지 않는 키워드만 위에 둔다 */
    if (/파레토|pareto|비가동 원인|원인 top/i.test(title)) return { type: 'pareto', reason: '원인을 크기 순으로 세우고 누적 비중으로 우선순위를 보여줘요.' };
    if (/손실|loss|워터폴|waterfall/i.test(title)) return { type: 'waterfall', reason: '각 단계 증감이 쌓여 최종값이 되는 과정을 보여줘요.' };
    if (/불량 유형|defect|유형 분석/i.test(title)) return { type: 'hbar', reason: '항목명이 길어 가로 막대로 크기를 비교하기 좋아요.' };
    if (/목표 달성|달성 현황|target/i.test(title)) return { type: 'bullet', reason: '목표 대비 현재 실적 위치를 한눈에 보여줘요.' };
    if (/시간 구성|구성비|가동 구성/i.test(title)) return { type: 'stacked', reason: '한 항목이 무엇으로 채워졌는지 100% 기준으로 보여줘요.' };
    if (/구성|비율|점유|분포|share|ratio|\(core\)/i.test(title)) return { type: 'donut', reason: '전체에서 각 항목이 차지하는 비율을 한눈에 보여줘요.' };
    if (/주간|가동|매트릭스|heat/i.test(title)) return { type: 'heatmap', reason: '요일·항목별 상태 분포를 색 농도로 보여줘요.' };
    if (/top|순위|rank|지연/i.test(title)) return { type: 'bar', reason: '항목별 값을 크기 순으로 비교하기 좋아요.' };
    if (/cpu|memory|메모리|사용률|점유율|가동률|자원|core/i.test(title)) return { type: 'gauge', reason: '목표(100%) 대비 현재 사용 수준을 보여줘요.' };
    if (/사용량|usage|추이|trend/i.test(title)) return { type: 'area', reason: '연속적인 값 변화를 면적으로 강조해요.' };
    if (/현황|status|monitoring|목록|log|로그|list/i.test(title)) return { type: 'table', reason: '여러 항목·수치를 표로 정확히 나열하기 좋아요.' };
    if (multi) return { type: 'line', reason: '여러 계열의 시간 추이를 겹쳐 비교하기 좋아요.' };
    if (n > 10) return { type: 'bar', reason: '구간이 많아 막대로 개별 값을 비교하기 좋아요.' };
    return { type: 'line', reason: '값의 추세를 보기 좋아요.' };
  }

  const CTK = 'wemb-dash-charttype';
  function saveTypes() {
    const m = {};
    DEFS.forEach((d) => {
      if (d.cur !== d.def) m[d.id] = d.cur;
    });
    try {
      localStorage.setItem(CTK, JSON.stringify(m));
    } catch (e) {}
  }
  function loadTypes() {
    try {
      return JSON.parse(localStorage.getItem(CTK)) || {};
    } catch (e) {
      return {};
    }
  }

  let hideTimer = null;
  function hideSubs(def) {
    (def.subs || []).forEach((s) => {
      s.sub.classList.remove('open');
      s.row.classList.remove('active');
    });
  }
  function cancelHideSub() {
    clearTimeout(hideTimer);
  }
  function scheduleHideSub(def) {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => hideSubs(def), 200);
  }
  function openSub(def, entry) {
    cancelHideSub();
    hideSubs(def); /* 형제 하위 메뉴는 닫음 */
    const sub = entry.sub,
      r = entry.row.getBoundingClientRect();
    sub.classList.add('open');
    entry.row.classList.add('active');
    const w = sub.offsetWidth || 238,
      h = sub.offsetHeight;
    let left = r.right + 2;
    if (left + w > window.innerWidth - 8) left = r.left - 2 - w; /* 오른쪽이 넘치면 왼쪽으로 */
    if (left < 8) left = 8;
    let top = r.top - 6;
    if (top + h > window.innerHeight - 8) top = Math.max(8, window.innerHeight - 8 - h);
    sub.style.left = left + 'px';
    sub.style.top = top + 'px';
  }
  function closeAll() {
    DEFS.forEach((d) => {
      if (d.menu) d.menu.classList.remove('open');
      hideSubs(d);
    });
    cancelHideSub();
  }
  function openMenu(def) {
    closeAll();
    const menu = def.menu,
      r = def.btn.getBoundingClientRect(),
      w = 250;
    menu.classList.add('open');
    let left = Math.max(8, r.right - w),
      top = r.bottom + 6;
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
    const mh = menu.getBoundingClientRect().height;
    if (top + mh > window.innerHeight - 8) menu.style.top = Math.max(8, r.top - 6 - mh) + 'px';
  }
  function updateBtn(def) {
    if (!def.btn) return;
    const cur = TYPES.find((t) => t.k === def.cur) || TYPES[0];
    def.btn.innerHTML = `<span class="ct-ico">${cur.ico}</span><span class="ct-cur">${cur.name}</span><span class="ct-cv">▾</span>`;
    /* 현재 선택된 종류를 하위 메뉴에서 표시 + 그 카테고리 행에도 점 표시 */
    (def.subs || []).forEach((s) => {
      let has = false;
      s.sub.querySelectorAll('.ct-opt').forEach((o) => {
        const on = o.dataset.t === def.cur;
        o.classList.toggle('on', on);
        if (on) has = true;
      });
      s.row.classList.toggle('has-cur', has);
    });
  }
  function buildPicker(def) {
    const ph = def.panel.querySelector('.ph');
    if (!ph) return;
    const box = document.createElement('div');
    box.className = 'charttype';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ct-btn';
    btn.title = '차트 종류 바꾸기';
    const menu = document.createElement('div');
    menu.className = 'ct-menu';
    menu.innerHTML = '<div class="ct-hd">종류 바꾸기 · 카테고리에 마우스를 올리세요</div>';
    /* 1단계: 카테고리 행. 2단계: 마우스 올리면 오른쪽에 뜨는 하위 메뉴(flyout) */
    def.subs = [];
    CATS.forEach((cat) => {
      const list = TYPES.filter((tp) => tp.cat === cat.key);
      if (!list.length) return;
      const recInCat = list.some((tp) => tp.k === def.rec.type);
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'ct-cat-row';
      row.dataset.cat = cat.key;
      row.innerHTML = `<span class="ct-cat-ico">${cat.ico || ''}</span><span class="ct-cat-nm">${cat.name}</span>${recInCat ? '<span class="ct-cat-rec">추천</span>' : ''}<span class="ct-cat-arrow">▸</span>`;
      menu.appendChild(row);

      const sub = document.createElement('div');
      sub.className = 'ct-sub';
      list.forEach((tp) => {
        const rec = def.rec.type === tp.k;
        const o = document.createElement('button');
        o.type = 'button';
        o.className = 'ct-opt';
        o.dataset.t = tp.k;
        o.innerHTML = `<span class="ct-ico">${tp.ico}</span><span class="ct-tx"><b>${tp.name}</b><small>${rec ? def.rec.reason : tp.desc}</small></span>${rec ? '<span class="ct-badge">추천</span>' : ''}`;
        o.addEventListener('click', () => {
          render(def, tp.k);
          saveTypes();
          closeAll();
        });
        sub.appendChild(o);
      });
      mainEl.appendChild(sub);

      const entry = { cat: cat.key, row, sub };
      def.subs.push(entry);
      row.addEventListener('mouseenter', () => openSub(def, entry));
      row.addEventListener('mouseleave', () => scheduleHideSub(def));
      row.addEventListener('click', (e) => {
        e.stopPropagation();
        openSub(def, entry);
      }); /* 클릭·터치로도 펼침 */
      sub.addEventListener('mouseenter', cancelHideSub);
      sub.addEventListener('mouseleave', () => scheduleHideSub(def));
    });
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      def.menu.classList.contains('open') ? closeAll() : openMenu(def);
    });
    box.appendChild(btn);
    ph.appendChild(box);
    mainEl.appendChild(menu); /* .main 안에 두어 미리보기 테마를 그대로 사용 */
    def.box = box;
    def.btn = btn;
    def.menu = menu;
    /* 탭 클릭 시 기본형이면 데이터 갱신(기존 동작 유지) */
    const tabs = def.panel.querySelector('.tabs');
    if (tabs) tabs.querySelectorAll('b').forEach((b) => b.addEventListener('click', () => def.cur === def.def && def.ctrl && def.ctrl.redraw && def.ctrl.redraw()));
  }

  /* 제목으로 패널 본문(.pbody)을 찾음 — 표/게이지 등 본문 통째로 바꾸는 패널용 */
  function panelBodyByTitle(t) {
    const p = [...document.querySelectorAll('.cols .panel')].find((p) => {
      const h = p.querySelector('.ph h3');
      return h && h.textContent.trim() === t;
    });
    return p ? p.querySelector('.pbody') : null;
  }

  const mainEl = document.querySelector('.main');
  const saved = loadTypes();
  DEFS.forEach((def) => {
    def.hostEl = def.find ? def.find() : document.querySelector(def.hostSel || '#' + def.id);
    if (!def.hostEl) return;
    def.panel = def.hostEl.closest('.panel');
    if (def.body) def.html0 = def.hostEl.innerHTML; /* 원본 표/게이지 HTML 스냅샷 → 기본형 복원용 */
    def.rec = recommend(def);
    buildPicker(def);
    render(def, saved[def.id] || def.def);
  });
  document.addEventListener('click', closeAll);
  window.addEventListener('resize', closeAll);
  document.addEventListener('scroll', closeAll, true); /* 대시보드 내부 스크롤 시 위치 어긋남 방지 */
  document.addEventListener('dash-reset', () => {
    try {
      localStorage.removeItem(CTK);
    } catch (e) {}
    DEFS.forEach((def) => def.hostEl && render(def, def.def));
  });

  return {
    tick() {
      DEFS.forEach((def, i) => {
        if (def.ctrl && def.ctrl.tick) setTimeout(() => def.ctrl.tick(), i * 120);
      });
    },
  };
})();
