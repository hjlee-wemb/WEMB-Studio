/* ── Production 페이지 차트 ── */

/* ===== Production 페이지 차트 =====
   Overview와 같은 헬퍼(axes/spline/svgEl)와 같은 호버 툴팁을 쓴다.
   페이지가 숨겨진 상태에서 만들어도 되도록 좌표는 전부 viewBox 기준(측정 없음)이고,
   선 그리기 애니메이션만 화면에 처음 들어올 때 실행한다. */
const ProdCharts = (function () {
  const built = [];
  /* 공통 — 기준선(목표·관리선). 값 위에 얹는 가는 파선 */
  function refLine(v, ys, color, dash) {
    return svgEl('line', { x1: 0, y1: ys(v), x2: 400, y2: ys(v), stroke: color, 'stroke-width': 1, 'stroke-dasharray': dash || '4 4', opacity: 0.85 });
  }
  /* 시간대별 생산 실적 — 계획 대비 실적은 '누적 추세'가 아니라 '시간마다 목표를 채웠나'라
     실적을 막대로 세우고 계획을 선으로 얹는 콤보가 맞다. 미달 시간대는 경고색. */
  function outputChart() {
    const host = document.getElementById('pd-out');
    if (!host) return;
    const labels = ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17'];
    const plan = [1400, 1400, 1400, 1400, 700, 1400, 1400, 1400, 1400, 1400];
    const act = [1362, 1418, 1445, 1390, 664, 1352, 1471, 1428, 1396, 1310];
    const max = 1600;
    const { defs, series, plot } = axes(host, [1600, 800, 0], labels, 9);
    const lg = svgEl('linearGradient', { id: 'pdOutGrad', x1: 0, y1: 0, x2: 0, y2: 1 });
    lg.append(svgEl('stop', { offset: '0%', 'stop-color': 'var(--point-main)' }), svgEl('stop', { offset: '100%', 'stop-color': 'var(--point-sub)' }));
    defs.appendChild(lg);
    const n = labels.length,
      step = 400 / (n - 1),
      bw = step * 0.48,
      ys = (v) => 200 - (v / max) * 200;
    act.forEach((v, i) => {
      const y = ys(v);
      const short = v < plan[i];
      const r = svgEl('rect', {
        x: (i * step - bw / 2).toFixed(1),
        y: y.toFixed(1),
        width: bw.toFixed(1),
        height: (200 - y).toFixed(1),
        rx: 2,
        fill: short ? 'var(--warning)' : 'url(#pdOutGrad)',
        opacity: short ? 0.85 : 1,
      });
      r.style.animationDelay = i * 0.03 + 's';
      series.appendChild(r);
    });
    const pPlan = svgEl('path', { d: spline(plan, step, ys), fill: 'none', stroke: 'var(--point-sub)', 'stroke-width': 2, 'stroke-dasharray': '5 4', 'stroke-linejoin': 'round' });
    series.appendChild(pPlan);
    bindPlotTip(plot, () => ({
      n,
      max,
      type: 'bar',
      unit: ' EA',
      label: (i) => labels[i] + ':00 · 달성 ' + ((act[i] / plan[i]) * 100).toFixed(1) + '%',
      series: [
        { name: '계획', color: 'var(--point-sub)', values: plan },
        { name: '실적', colorAt: (i) => (act[i] < plan[i] ? 'var(--warning)' : 'var(--point-main)'), values: act },
      ],
    }));
    built.push(() => {
      series.querySelectorAll('rect').forEach((r) => (r.style.animation = 'rise .7s cubic-bezier(.2,.8,.2,1) backwards'));
      drawIn([pPlan]);
    });
  }
  /* 공정 흐름 — 단계별 처리량과 단계 사이 재공(WIP). 적체 구간을 색으로 짚는다 */
  function flowStages() {
    const host = document.getElementById('pd-flow');
    if (!host) return;
    /* [단계, 처리량, 상태(0정상/1지연/2정체), 다음 단계로 넘어가기 전 재공] */
    const st = [
      ['자재 투입', 12480, 0, 340],
      ['가공', 12140, 0, 210],
      ['조립', 11930, 1, 520],
      ['검사', 11410, 0, 95],
      ['포장', 11315, 0, null],
    ];
    const cls = ['', 'warn', 'crit'];
    const label = ['정상', '지연', '정체'];
    let h = '';
    st.forEach(([nm, v, s, wip], i) => {
      h +=
        `<div class="pstage ${cls[s]}" data-tip="${nm}" data-tip-h="공정 흐름 · ${label[s]}" data-tip-v="${v.toLocaleString('en-US')} EA" data-tip-c="${
                s === 2 ? 'var(--danger)' : s === 1 ? 'var(--warning)' : 'var(--point-main)'
              }">` +
        `<i class="dot"></i><span class="nm">${nm}</span><span class="v">${v.toLocaleString('en-US')}</span></div>`;
      if (wip != null) h += `<div class="pwip" data-tip="${nm} → ${st[i + 1][0]} 재공" data-tip-h="공정 간 재공(WIP)" data-tip-v="${wip} EA" data-tip-c="var(--point-sub)">재공 <b>${wip}</b> EA</div>`;
    });
    host.innerHTML = h;
  }

  /* 라인별 시간 구성 — 조업 480분이 무엇으로 채워졌는지(100% 스택) */
  function stackBars() {
    const host = document.getElementById('pd-stack');
    if (!host) return;
    /* [라인, 가동, 계획정지, 비계획정지, 유휴] — 합 100 */
    const rows = [
      ['A', 88, 6, 3, 3],
      ['B', 82, 7, 8, 3],
      ['C', 79, 9, 7, 5],
      ['D', 90, 5, 2, 3],
      ['E', 71, 8, 14, 7],
      ['F', 68, 10, 12, 10],
    ];
    const seg = [
      ['가동', 'var(--point-main)'],
      ['계획정지', 'var(--point-sub)'],
      ['비계획정지', 'var(--danger)'],
      ['유휴', 'color-mix(in srgb, var(--text-weak) 35%, var(--line))'],
    ];
    host.innerHTML = rows
      .map(
        (r, ri) =>
          `<div class="strow"><span class="nm">${r[0]}라인</span><div class="stbar">` +
          seg
            .map(
              ([nm, col], si) =>
                `<span style="width:${r[si + 1]}%;background:${col};animation-delay:${(ri * 0.05 + si * 0.04).toFixed(2)}s" data-tip="${nm}" data-tip-h="${r[0]}라인 · 조업 480분" ` +
                `data-tip-v="${r[si + 1]}% · ${Math.round(480 * r[si + 1] * 0.01)}분" data-tip-c="${col}"></span>`
            )
            .join('') +
          `</div><span class="pct">${r[1]}%</span></div>`
      )
      .join('');
  }

  /* 모델별 생산 현황 — 표 안에 최근 7일 스파크라인을 같이 세운다 */
  function modelTable() {
    const tb = document.querySelector('#pd-model tbody');
    if (!tb) return;
    /* [모델, 계획, 실적, 불량, 최근 7일 추세] */
    const rows = [
      ['WM-A100', 39000, 38420, 142, [36200, 37100, 38400, 37800, 39100, 38050, 38420]],
      ['WM-B220', 32000, 31180, 168, [31900, 31200, 30400, 31650, 30900, 31480, 31180]],
      ['WM-C310', 35000, 34260, 119, [32800, 33400, 33900, 34600, 34100, 34700, 34260]],
      ['WM-D450', 26000, 24590, 110, [26100, 25700, 25200, 24800, 25100, 24400, 24590]],
    ];
    function spark(vals, up) {
      const w = 52,
        h = 16,
        lo = Math.min(...vals),
        hi = Math.max(...vals),
        sp = hi - lo || 1;
      const pts = vals.map((v, i) => [(i / (vals.length - 1)) * (w - 2) + 1, h - 2 - ((v - lo) / sp) * (h - 4)]);
      const col = up ? 'var(--point-main)' : 'var(--warning)';
      return (
        `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">` +
        `<polyline points="${pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}" fill="none" stroke="${col}" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/>` +
        `<circle cx="${pts[pts.length - 1][0].toFixed(1)}" cy="${pts[pts.length - 1][1].toFixed(1)}" r="1.8" fill="${col}"/></svg>`
      );
    }
    let sum = [0, 0, 0];
    tb.innerHTML =
      rows
        .map(([nm, plan, act, ng, trend]) => {
          sum = [sum[0] + plan, sum[1] + act, sum[2] + ng];
          const rate = (act / plan) * 100;
          const up = trend[trend.length - 1] >= trend[0];
          return (
            `<tr class="rowline"><td>${nm}</td>` +
            `<td style="text-align:center" data-tip="${nm} 최근 7일" data-tip-h="${up ? '상승 추세' : '하락 추세'}" data-tip-v="${trend[0].toLocaleString('en-US')} → ${trend[
                    trend.length - 1
                  ].toLocaleString('en-US')}" data-tip-c="${up ? 'var(--point-main)' : 'var(--warning)'}">${spark(trend, up)}</td>` +
            `<td class="num">${act.toLocaleString('en-US')}</td>` +
            `<td class="num" style="color:${rate < 96 ? 'var(--fg-warning)' : 'inherit'}">${rate.toFixed(1)}%</td>` +
            `<td class="num">${ng}</td></tr>`
          );
        })
        .join('') +
      `<tr class="bandh"><td>합계</td><td></td><td class="num">${sum[1].toLocaleString('en-US')}</td><td class="num">${((sum[1] / sum[0]) * 100).toFixed(1)}%</td><td class="num">${sum[2]}</td></tr>`;
  }

  /* OEE 손실 워터폴 — 계획 조업 480분이 가용성·성능·품질 손실로 깎여
     실질 가동 415분(= OEE 86.4%)이 되는 과정을 단계 막대로 분해한다. */
  function waterfall() {
    const host = document.getElementById('pd-waterfall');
    if (!host) return;
    const PLAN = 480,
      A = 93.5,
      P = 94.2,
      Q = 98.1;
    const afterA = PLAN * A * 0.01,
      afterP = afterA * P * 0.01,
      afterQ = afterP * Q * 0.01;
    /* [라벨, 시작값, 끝값, 손실여부] — 손실 막대는 공중에 뜬다 */
    const bars = [
      ['계획', 0, PLAN, false, '계획 조업시간'],
      ['비가동', afterA, PLAN, true, `가용성 손실 (가동률 ${A}%)`],
      ['속도', afterP, afterA, true, `성능 손실 (속도 ${P}%)`],
      ['불량', afterQ, afterP, true, `품질 손실 (양품률 ${Q}%)`],
      ['실가동', 0, afterQ, false, '실질 가동시간 = OEE 86.4%'],
    ];
    const max = 520;
    const { defs, series, plot } = axes(host, [520, 390, 260, 130, 0], bars.map((b) => b[0]), 5);
    const lg = svgEl('linearGradient', { id: 'pdWfGrad', x1: 0, y1: 0, x2: 0, y2: 1 });
    lg.append(svgEl('stop', { offset: '0%', 'stop-color': 'var(--point-main)' }), svgEl('stop', { offset: '100%', 'stop-color': 'var(--point-sub)' }));
    defs.appendChild(lg);
    const n = bars.length,
      step = 400 / (n - 1),
      bw = step * 0.5,
      ys = (v) => 200 - (v / max) * 200;
    bars.forEach(([, lo, hi, loss], i) => {
      const r = svgEl('rect', {
        x: (i * step - bw / 2).toFixed(1),
        y: ys(hi).toFixed(1),
        width: bw.toFixed(1),
        height: Math.max(2, ys(lo) - ys(hi)).toFixed(1),
        rx: 2,
        fill: loss ? 'var(--danger)' : 'url(#pdWfGrad)',
        opacity: loss ? 0.85 : 1,
      });
      r.style.animationDelay = i * 0.05 + 's';
      series.appendChild(r);
      /* 단계를 잇는 연결 점선 */
      if (i < n - 1) series.appendChild(svgEl('line', { x1: i * step + bw / 2, y1: ys(hi), x2: (i + 1) * step - bw / 2, y2: ys(hi), stroke: 'var(--line)', 'stroke-dasharray': '3 3', 'stroke-width': 1 }));
    });
    bindPlotTip(plot, () => ({
      n,
      max,
      type: 'bar',
      unit: '분',
      label: (i) => bars[i][4],
      series: [
        {
          name: '시간',
          colorAt: (i) => (bars[i][3] ? 'var(--danger)' : 'var(--point-main)'),
          values: bars.map((b) => Math.round(b[2] - b[1])),
        },
      ],
    }));
    built.push(() => series.querySelectorAll('rect').forEach((r) => (r.style.animation = 'rise .7s cubic-bezier(.2,.8,.2,1) backwards')));
  }

  /* 작업지시 스케줄(간트) — 08~20시 축 위에 라인별 작업지시 구간을 얹는다 */
  function gantt() {
    const host = document.getElementById('pd-gantt');
    if (!host) return;
    const H0 = 8,
      H1 = 20,
      SPAN = H1 - H0;
    /* [작업지시, 시작, 종료, 상태] */
    const rows = [
      ['WO-24071 A', 8, 13, 'done'],
      ['WO-24075 A', 13, 19, ''],
      ['WO-24068 B', 8, 12, 'done'],
      ['WO-24080 B', 12, 17, ''],
      ['WO-24083 C', 9, 15, 'late'],
      ['WO-24090 C', 15, 20, 'wait'],
      ['WO-24095 D', 10, 18, ''],
    ];
    const state = { done: ['완료', 'color-mix(in srgb, var(--point-main) 42%, var(--line))'], late: ['지연', 'var(--danger)'], wait: ['대기', 'color-mix(in srgb, var(--text-weak) 40%, var(--line))'], '': ['진행', 'var(--point-main)'] };
    const ticks = [8, 11, 14, 17, 20];
    let h = `<div class="gthead">${ticks.map((t) => `<span>${String(t).padStart(2, '0')}</span>`).join('')}</div>`;
    rows.forEach(([nm, s, e, st], i) => {
      const [lbl, col] = state[st];
      h +=
        `<div class="gtrow"><span class="nm">${nm}</span><div class="gttrack">` +
        `<div class="gtbar ${st}" style="left:${(((s - H0) / SPAN) * 100).toFixed(1)}%;width:${(((e - s) / SPAN) * 100).toFixed(1)}%;animation-delay:${(i * 0.05).toFixed(2)}s" ` +
        `data-tip="${nm}" data-tip-h="${String(s).padStart(2, '0')}:00 – ${String(e).padStart(2, '0')}:00" data-tip-v="${lbl}" data-tip-c="${col}"></div></div></div>`;
    });
    host.innerHTML = h;
  }
  /* 비가동 원인 파레토 — 막대(시간, 내림차순) + 누적 비중 선 + 80% 기준선.
     '어느 원인까지 잡으면 80%가 해결되나'를 한눈에 읽는 현장 표준 형태. */
  function paretoChart() {
    const host = document.getElementById('pd-pareto');
    if (!host) return;
    const items = [
      ['자재대기', 143, false],
      ['금형교체', 126, true],
      ['설비고장', 98, false],
      ['품질점검', 62, true],
      ['작업준비', 52, true],
    ];
    const total = items.reduce((a, it) => a + it[1], 0);
    const mins = items.map((it) => it[1]);
    const max = 160;
    let run = 0;
    const cum = mins.map((v) => Math.round(((run += v) / total) * 1000) / 10);
    const { defs, series, plot } = axes(host, [160, 120, 80, 40, 0], items.map((it) => it[0]), 5);
    const lg = svgEl('linearGradient', { id: 'pdParetoGrad', x1: 0, y1: 0, x2: 0, y2: 1 });
    lg.append(svgEl('stop', { offset: '0%', 'stop-color': 'var(--point-main)' }), svgEl('stop', { offset: '100%', 'stop-color': 'var(--point-sub)' }));
    defs.appendChild(lg);
    const n = items.length,
      step = 400 / (n - 1),
      bw = step * 0.5,
      ys = (v) => 200 - (v / max) * 200,
      /* 누적 비중은 0~100%를 플롯 전체 높이에 매핑(오른쪽 축 대신 툴팁·범례로 안내) */
      yp = (p) => 200 - (p / 100) * 200;
    mins.forEach((v, i) => {
      const y = ys(v);
      const r = svgEl('rect', {
        x: (i * step - bw / 2).toFixed(1),
        y: y.toFixed(1),
        width: bw.toFixed(1),
        height: (200 - y).toFixed(1),
        rx: 2,
        fill: items[i][2] ? 'url(#pdParetoGrad)' : 'var(--danger)',
        opacity: items[i][2] ? 1 : 0.85,
      });
      r.style.animationDelay = i * 0.04 + 's';
      series.appendChild(r);
    });
    series.appendChild(refLine(80, yp, 'var(--warning)')); /* 파레토 80% 기준선 */
    const cumLine = svgEl('path', {
      d: cum.map((p, i) => (i ? 'L' : 'M') + ' ' + i * step + ' ' + yp(p)).join(' '),
      fill: 'none',
      stroke: 'var(--point-sub)',
      'stroke-width': 2,
      'stroke-linejoin': 'round',
    });
    series.appendChild(cumLine);
    cum.forEach((p, i) => series.appendChild(svgEl('circle', { cx: i * step, cy: yp(p), r: 3, fill: 'var(--point-sub)' })));
    bindPlotTip(plot, () => ({
      n,
      max,
      type: 'bar',
      label: (i) => items[i][0] + ' · ' + (items[i][2] ? '계획 정지' : '비계획 정지'),
      series: [
        { name: '비가동 시간', unit: '분', colorAt: (i) => (items[i][2] ? 'var(--point-main)' : 'var(--danger)'), values: mins },
        { name: '누적 비중', unit: '%', color: 'var(--point-sub)', values: cum },
      ],
    }));
    built.push(() => {
      series.querySelectorAll('rect').forEach((r) => (r.style.animation = 'rise .7s cubic-bezier(.2,.8,.2,1) backwards'));
      drawIn([cumLine]);
    });
  }
  /* 안돈 현황판 — 라인별 신호등 타일(가동/경고/정지 + 현재 실적) */
  function andon() {
    const host = document.getElementById('pd-andon');
    if (!host) return;
    /* [라인, 상태(run/warn/stop), 상태 문구, 현재 시간당 실적] */
    const tiles = [
      ['A라인', 'run', '가동', 268],
      ['B라인', 'stop', '정지', 0],
      ['C라인', 'warn', '속도저하', 231],
      ['D라인', 'run', '가동', 252],
      ['E라인', 'warn', '자재대기', 198],
      ['F라인', 'run', '가동', 176],
    ];
    const col = { run: 'var(--point-main)', warn: 'var(--warning)', stop: 'var(--danger)' };
    host.innerHTML = tiles
      .map(
        ([ln, s, txt, ov]) =>
          `<div class="atile ${s}" data-tip="${ln}" data-tip-h="라인 안돈 · ${txt}" data-tip-v="${ov ? ov.toLocaleString('en-US') + ' EA/h' : '정지'}" data-tip-c="${col[s]}">` +
          `<span class="ln"><i></i>${ln}</span><span class="stt">${txt}</span><span class="ov">${ov ? ov + ' EA/h' : '—'}</span></div>`
      )
      .join('');
  }

  /* 불량 유형 분석 — 가로 랭킹 막대(수량 내림차순 + 비중) */
  function defectBars() {
    const host = document.getElementById('pd-defect');
    if (!host) return;
    /* [유형, 수량] */
    const items = [
      ['외관 스크래치', 168],
      ['치수 불량', 132],
      ['조립 불량', 96],
      ['도장 얼룩', 78],
      ['기타', 65],
    ];
    const total = items.reduce((a, it) => a + it[1], 0);
    const max = Math.max(...items.map((it) => it[1]));
    host.innerHTML = items
      .map(
        ([nm, v], i) =>
          `<div class="hbrow" data-tip="${nm}" data-tip-h="불량 유형 · 총 ${total} EA" data-tip-v="${v} EA · ${Math.round((v / total) * 100)}%" data-tip-c="var(--point-main)">` +
          `<span class="nm">${nm}</span><div class="hbtrack"><i style="width:${((v / max) * 100).toFixed(1)}%;animation-delay:${(i * 0.05).toFixed(2)}s"></i></div><span class="vv">${v}</span></div>`
      )
      .join('');
  }

  /* 라인별 목표 달성 — 불릿 차트(실적 막대 + 목표 눈금). 목표 대비 위치를 한눈에 */
  function bullet() {
    const host = document.getElementById('pd-bullet');
    if (!host) return;
    /* [라인, 실적, 목표, 스케일 최대] */
    const rows = [
      ['A', 26800, 26000, 30000],
      ['B', 0, 26000, 30000],
      ['C', 23100, 26000, 30000],
      ['D', 25200, 24000, 30000],
      ['E', 19800, 24000, 30000],
      ['F', 17600, 22000, 30000],
    ];
    host.innerHTML = rows
      .map(([ln, act, tgt, max], i) => {
        const miss = act < tgt;
        return (
          `<div class="blrow" data-tip="${ln}라인" data-tip-h="목표 ${tgt.toLocaleString('en-US')} EA · ${miss ? '미달' : '달성'}" data-tip-v="${act.toLocaleString('en-US')} EA · ${Math.round(
                  (act / tgt) * 100
                )}%" data-tip-c="${miss ? 'var(--warning)' : 'var(--point-main)'}">` +
          `<span class="nm">${ln}라인</span><div class="bltrack">` +
          `<div class="blmeasure ${miss ? 'miss' : ''}" style="width:${((act / max) * 100).toFixed(1)}%;animation-delay:${(i * 0.05).toFixed(2)}s"></div>` +
          `<div class="bltarget" style="left:${((tgt / max) * 100).toFixed(1)}%"></div></div>` +
          `<span class="vv">${(act / 1000).toFixed(1)}k</span></div>`
        );
      })
      .join('');
  }
  /* 선 그리기 인트로 — 페이지가 보일 때 한 번만 */
  function drawIn(paths) {
    paths.forEach((p) => {
      let L = 0;
      try {
        L = p.getTotalLength();
      } catch (e) {}
      if (!L) return;
      p.style.transition = 'none';
      p.style.strokeDasharray = L;
      p.style.strokeDashoffset = L;
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          p.style.transition = 'stroke-dashoffset 1.3s ease';
          p.style.strokeDashoffset = '0';
        })
      );
    });
  }
  /* 아래 6종(시간대별 실적·시간 구성·파레토·OEE 손실·불량 유형·목표 달성)은
     DashCharts로 옮겨 대시보드 편집에서 종류를 바꿀 수 있게 했다.
     여기서는 위젯형(공정 흐름·모델 표·간트·안돈)만 그린다. */
  flowStages();
  modelTable();
  gantt();
  andon();
  let introDone = false;
  return {
    /* 페이지가 처음 보일 때만 인트로 — 숨겨진 동안 재생돼 버리는 걸 막는다 */
    reveal() {
      if (introDone) return;
      introDone = true;
      built.forEach((fn) => fn());
    },
  };
})();

/* ===== 대시보드 페이지 전환(Overview ↔ Production) =====
   상단 네비를 누르면 KPI 줄과 패널 그리드만 갈아끼운다. 헤더·시계·날씨는 공유. */
(function dashPages() {
  const stage = document.querySelector('.stage');
  if (!stage) return;
  const pages = [...stage.querySelectorAll('.dashpage')];
  const links = [...stage.querySelectorAll('.nav a')];
  const brandSub = stage.querySelector('.brand .sub');
  const NAMES = { overview: '종합현황', production: '생산현황' };
  /* 상단 내비 표시 라벨 — 유저플로우 메뉴로 교체될 수 있다. 없으면 NAMES를 쓴다. */
  const LABELS = {};
  const PK = 'wemb-dash-page';
  let current = 'overview';
  function show(key) {
    if (!NAMES[key]) return;
    current = key;
    pages.forEach((p) => (p.hidden = p.dataset.page !== key));
    links.forEach((a) => a.classList.toggle('active', (a.dataset.page || '') === key));
    /* .brand .sub는 이제 '프로젝트명'을 표시한다(initBrand가 채움). 현재 섹션은 상단 내비의 활성 링크로만
       나타내고, 여기서 .sub를 섹션명으로 덮어쓰지 않는다. */
    if (key === 'production') ProdCharts.reveal();
    try {
      localStorage.setItem(PK, key);
    } catch (e) {}
  }
  /* 앞의 두 항목만 실제 페이지가 있다 — 나머지는 준비 중 */
  links.forEach((a) => {
    const key = a.textContent.trim().toLowerCase();
    if (NAMES[key]) a.dataset.page = key;
    else a.title = '준비 중입니다';
    a.addEventListener('click', () => {
      if (stage.classList.contains('content-editing')) return; /* 글자 수정 중엔 이동하지 않음 */
      if (a.dataset.page) show(a.dataset.page);
    });
  });
  /* 유저플로우의 상위 메뉴를 상단 내비 라벨로 반영한다(기존 링크의 라벨만 교체 → 핸들러 유지).
     1번째→종합현황(overview), 2번째→생산현황(production), 이후는 준비 중 화면. */
  window.__setStudioNav = function (labels) {
    if (!Array.isArray(labels) || !labels.length) return;
    links.forEach((a, i) => {
      if (i >= labels.length || !labels[i]) return;
      a.textContent = labels[i];
      if (i === 0) { a.dataset.page = 'overview'; LABELS.overview = labels[i]; a.removeAttribute('title'); }
      else if (i === 1) { a.dataset.page = 'production'; LABELS.production = labels[i]; a.removeAttribute('title'); }
      else { delete a.dataset.page; a.title = '준비 중입니다'; }
    });
    show(NAMES[current] ? current : 'overview');
  };
  let saved = 'overview';
  try {
    saved = localStorage.getItem(PK) || 'overview';
  } catch (e) {}
  show(saved);
  document.addEventListener('dash-reset', () => {
    try {
      localStorage.removeItem(PK);
    } catch (e) {}
    show('overview');
  });
})();
