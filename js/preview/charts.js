/* ── 차트 공통 — SVG · 툴팁 · 기본 차트 ── */

/* ===== charts ===== */
const NS = 'http://www.w3.org/2000/svg';
function svgEl(t, a) {
  const e = document.createElementNS(NS, t);
  for (const k in a || {}) e.setAttribute(k, a[k]);
  return e;
}
/* ============================================================
 *  차트 호버 툴팁 — 값 읽기
 *  · ChartTip      : 화면에 하나만 두는 말풍선(위치는 마우스 따라감)
 *  · bindPlotTip   : 축이 있는 차트(꺾은선/영역/막대)에 크로스헤어 + 값
 *  · data-tip 계열 : 도넛·게이지·진행률·히트맵 등 조각 단위 호버
 * ============================================================ */
const ChartTip = (function () {
  let el = null;
  function node() {
    if (el && el.isConnected) return el;
    el = document.createElement('div');
    el.className = 'chart-tip';
    (document.querySelector('.main') || document.body).appendChild(el);
    return el;
  }
  function place(x, y) {
    const t = node(),
      w = t.offsetWidth,
      h = t.offsetHeight;
    let L = x + 16,
      T = y - h - 14;
    if (L + w > window.innerWidth - 8) L = x - 16 - w;
    if (L < 8) L = 8;
    if (T < 8) T = y + 20;
    if (T + h > window.innerHeight - 8) T = Math.max(8, window.innerHeight - 8 - h);
    t.style.transform = `translate(${Math.round(L)}px, ${Math.round(T)}px)`;
  }
  return {
    show(html, x, y) {
      const t = node();
      t.innerHTML = html;
      t.classList.add('on');
      place(x, y);
    },
    place,
    hide() {
      if (el) el.classList.remove('on');
    },
  };
})();

const tipEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const tipNum = (v) => (Math.abs(v) >= 100 || Number.isInteger(v) ? Math.round(v) : Math.round(v * 10) / 10).toLocaleString();
function tipRow(name, val, color) {
  return `<div class="tt-r">${color ? `<i style="background:${color}"></i>` : ''}<span>${tipEsc(name)}</span>${val != null ? `<b>${tipEsc(val)}</b>` : ''}</div>`;
}
function tipHead(t) {
  return t ? `<div class="tt-h">${tipEsc(t)}</div>` : '';
}

/* 축이 있는 차트에 크로스헤어 + 툴팁을 붙인다.
   get()은 호버 시점의 상태를 돌려줘야 한다(실시간 차트는 데이터가 계속 바뀌므로).
   → { n, max, type, series:[{name,color,values}], label(i), unit } */
function bindPlotTip(plot, get) {
  if (!plot || !get) return;
  const ov = document.createElement('div');
  ov.className = 'cx';
  const band = document.createElement('i');
  band.className = 'cx-band';
  const line = document.createElement('i');
  line.className = 'cx-line';
  ov.append(band, line);
  plot.appendChild(ov);
  let dots = [];
  function move(e) {
    const s = get();
    if (!s || !s.series || !s.series.length || !(s.n > 1) || !(s.max > 0)) return;
    const r = plot.getBoundingClientRect();
    if (!r.width) return;
    if (dots.length !== s.series.length) {
      dots.forEach((d) => d.remove());
      dots = s.series.map((se) => {
        const d = document.createElement('i');
        d.className = 'cx-dot';
        d.style.background = se.color;
        ov.appendChild(d);
        return d;
      });
    }
    const i = clamp(Math.round(((e.clientX - r.left) / r.width) * (s.n - 1)), 0, s.n - 1);
    const xp = (i / (s.n - 1)) * 100;
    const isBar = s.type === 'bar';
    band.style.display = isBar ? '' : 'none';
    line.style.display = isBar ? 'none' : '';
    if (isBar) {
      band.style.left = xp + '%';
      band.style.width = (100 / (s.n - 1)) * 0.82 + '%';
    } else line.style.left = xp + '%';
    const rows = [];
    s.series.forEach((se, si) => {
      const v = se.values[i],
        d = dots[si];
      if (v == null || !isFinite(v)) {
        d.style.display = 'none';
        return;
      }
      /* colorAt — 막대마다 색이 다른 차트(목표 미달·비계획 정지 등)에서
         말풍선 색점도 그 막대의 색을 따라가게 한다 */
      const col = se.colorAt ? se.colorAt(i) : se.color;
      d.style.display = isBar ? 'none' : '';
      d.style.left = xp + '%';
      d.style.top = clamp((1 - v / s.max) * 100, 0, 100) + '%';
      d.style.background = col;
      rows.push(tipRow(se.name, tipNum(v) + (se.unit != null ? se.unit : s.unit || ''), col));
    });
    plot.classList.add('cx-on');
    ChartTip.show(tipHead(s.label ? s.label(i) : '') + rows.join(''), e.clientX, e.clientY);
  }
  function leave() {
    plot.classList.remove('cx-on');
    ChartTip.hide();
  }
  plot.addEventListener('mousemove', move);
  plot.addEventListener('mouseleave', leave);
}

/* 조각 단위 호버 — data-tip을 붙인 요소와, 원본 HTML에 그대로 있는
   게이지(.mini)·진행률(.prow)·범례(.dleg .row)를 위임으로 함께 처리한다. */
(function bindElementTips() {
  const SEL = '[data-tip], .mini, .prow, .dleg .row, .hcell';
  const panelTitle = (el) => {
    const h = el.closest('.panel') && el.closest('.panel').querySelector('.ph h3');
    return h ? h.textContent.trim() : '';
  };
  function html(el) {
    if (el.dataset && el.dataset.tip != null) return tipHead(el.dataset.tipH) + tipRow(el.dataset.tip, el.dataset.tipV, el.dataset.tipC);
    if (el.classList.contains('mini')) {
      const b = el.querySelector('.d b');
      if (!b) return '';
      return tipHead(panelTitle(el)) + tipRow(el.textContent.replace(b.textContent, '').trim(), b.textContent.trim(), 'var(--point-main)');
    }
    if (el.classList.contains('prow')) {
      const nm = el.querySelector('.nm'),
        pv = el.querySelector('.pv');
      if (!nm) return '';
      let head = panelTitle(el);
      for (let p = el.parentElement && el.parentElement.previousElementSibling; p; p = p.previousElementSibling) {
        if (p.classList.contains('sec-lab')) {
          head = head ? head + ' · ' + p.textContent.trim() : p.textContent.trim();
          break;
        }
      }
      return tipHead(head) + tipRow(nm.textContent.trim(), pv ? pv.textContent.trim() : null, 'var(--point-main)');
    }
    if (el.classList.contains('row')) {
      const b = el.querySelector('b'),
        i = el.querySelector('i');
      if (!b) return '';
      return tipHead(panelTitle(el)) + tipRow(el.textContent.replace(b.textContent, '').trim(), b.textContent.trim(), i ? i.style.background : '');
    }
    return '';
  }
  let cur = null,
    curMove = null;
  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest ? e.target.closest(SEL) : null;
    if (!el || el === cur) return;
    const h = html(el);
    if (!h) return;
    if (cur && curMove) cur.removeEventListener('mousemove', curMove);
    const move = (ev) => ChartTip.place(ev.clientX, ev.clientY);
    const leave = () => {
      el.removeEventListener('mousemove', move);
      if (cur !== el) return; /* 이미 다른 조각으로 옮겨갔으면 그쪽 툴팁을 지우지 않는다 */
      cur = null;
      curMove = null;
      ChartTip.hide();
    };
    cur = el;
    curMove = move;
    el.addEventListener('mousemove', move);
    el.addEventListener('mouseleave', leave, { once: true });
    ChartTip.show(h, e.clientX, e.clientY);
  });
})();

function axes(host, yticks, xlabels, gridN) {
  host.innerHTML = '';
  const yax = document.createElement('div');
  yax.className = 'yax';
  yticks.forEach((t) => {
    const s = document.createElement('span');
    s.textContent = t;
    yax.appendChild(s);
  });
  const plot = document.createElement('div');
  plot.className = 'plot';
  const svg = svgEl('svg', { viewBox: '0 0 400 200', preserveAspectRatio: 'none' });
  const grid = svgEl('g');
  const G = gridN || yticks.length;
  for (let i = 0; i < G; i++) {
    const y = (i / (G - 1)) * 200;
    grid.appendChild(svgEl('line', { x1: 0, y1: y, x2: 400, y2: y, stroke: 'var(--line)', 'stroke-dasharray': '2 4', 'stroke-width': 1, opacity: 0.5 }));
  }
  svg.appendChild(grid);
  const defs = svgEl('defs');
  svg.appendChild(defs);
  const series = svgEl('g');
  svg.appendChild(series);
  plot.appendChild(svg);
  const xax = document.createElement('div');
  xax.className = 'xax';
  xlabels.forEach((l) => {
    const s = document.createElement('span');
    s.textContent = l;
    xax.appendChild(s);
  });
  host.append(yax, plot, xax);
  return { defs, series, plot, svg };
}
function spline(d, step, ys) {
  let p = `M 0 ${ys(d[0])}`;
  for (let i = 1; i < d.length; i++) {
    const cx = ((i - 1 + i) / 2) * step;
    p += ` C ${cx} ${ys(d[i - 1])} ${cx} ${ys(d[i])} ${i * step} ${ys(d[i])}`;
  }
  return p;
}

// Throughput: two lines (PEAK 데이 = sub, 금일 = main), live scroll left
function makeThroughput() {
  const { series, plot } = axes(document.getElementById('ch-tp'), [400, 200, 0], ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'], 9);
  const N = 28,
    step = 400 / (N - 1),
    max = 440,
    ys = (v) => 200 - (v / max) * 200;
  let A = Array.from({ length: N }, (_, i) => 160 - i * 4.2 + Math.random() * 28);
  let B = Array.from({ length: N }, (_, i) => 40 + i * 4.0 + Math.random() * 28);
  const g = svgEl('g');
  series.appendChild(g);
  const pa = svgEl('path', { fill: 'none', stroke: 'var(--point-sub)', 'stroke-width': 2, 'stroke-linejoin': 'round' });
  const pb = svgEl('path', { fill: 'none', stroke: 'var(--point-main)', 'stroke-width': 2, 'stroke-linejoin': 'round' });
  const da = svgEl('circle', { class: 'pulse-dot', r: 3, fill: 'var(--point-sub)' });
  const db = svgEl('circle', { class: 'pulse-dot', r: 3, fill: 'var(--point-main)' });
  g.append(pa, pb, da, db);
  function draw(a, b) {
    pa.setAttribute('d', spline(a, step, ys));
    pb.setAttribute('d', spline(b, step, ys));
    da.setAttribute('cx', Math.min((a.length - 1) * step, 398));
    da.setAttribute('cy', ys(a[a.length - 1]));
    db.setAttribute('cx', Math.min((b.length - 1) * step, 398));
    db.setAttribute('cy', ys(b[b.length - 1]));
  }
  function intro() {
    draw(A, B);
    [pa, pb].forEach((p) => {
      const L = p.getTotalLength();
      p.style.transition = 'none';
      p.style.strokeDasharray = L;
      p.style.strokeDashoffset = L;
    });
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        [pa, pb].forEach((p) => {
          p.style.transition = 'stroke-dashoffset 1.3s ease';
          p.style.strokeDashoffset = '0';
        })
      )
    );
  }
  intro();
  /* x축은 08:00~16:00 고정 — 점 인덱스를 그 구간의 시각으로 환산해 보여준다 */
  const tpLabel = (i) => {
    const m = Math.round((480 + (i / (N - 1)) * 480) / 5) * 5;
    return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  };
  bindPlotTip(plot, () => ({
    n: N,
    max,
    type: 'line',
    label: tpLabel,
    series: [
      { name: 'PEAK 데이', color: 'var(--point-sub)', values: A },
      { name: '금일', color: 'var(--point-main)', values: B },
    ],
  }));
  return {
    tick() {
      const na = [...A, clamp(A[N - 1] + (Math.random() * 40 - 20), 10, 430)],
        nb = [...B, clamp(B[N - 1] + (Math.random() * 40 - 20), 10, 430)];
      draw(na, nb);
      g.style.transition = 'none';
      g.style.transform = 'translateX(0)';
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          g.style.transition = 'transform .9s ease';
          g.style.transform = `translateX(${-step}px)`;
        })
      );
      setTimeout(() => {
        A = na.slice(1);
        B = nb.slice(1);
        g.style.transition = 'none';
        g.style.transform = 'translateX(0)';
        draw(A, B);
      }, 920);
    },
    redraw() {
      A = Array.from({ length: N }, (_, i) => 160 - i * 4.2 + Math.random() * 28);
      B = Array.from({ length: N }, (_, i) => 40 + i * 4.0 + Math.random() * 28);
      intro();
    },
  };
}
// Connected: 14 bars, blue(top)->cyan(bottom) gradient, value-shift left each tick
function makeConnected() {
  const { defs, series, plot } = axes(document.getElementById('ch-cn'), [100, 75, 50, 25, 0], ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'], 5);
  const lg = svgEl('linearGradient', { id: 'barGrad', x1: 0, y1: 0, x2: 0, y2: 1 });
  lg.append(svgEl('stop', { offset: '0%', 'stop-color': 'var(--point-main)' }), svgEl('stop', { offset: '100%', 'stop-color': 'var(--point-sub)' }));
  defs.appendChild(lg);
  const N = 14,
    step = 400 / (N - 1),
    bw = step * 0.5,
    max = 100,
    ys = (v) => 200 - (v / max) * 200;
  let data = Array.from({ length: N }, () => 20 + Math.random() * 72);
  function draw(d, anim) {
    series.innerHTML = '';
    d.forEach((v, i) => {
      const y = ys(v);
      const r = svgEl('rect', { x: (i * step - bw / 2).toFixed(1), y: y.toFixed(1), width: bw.toFixed(1), height: (200 - y).toFixed(1), rx: 2, fill: 'url(#barGrad)' });
      if (anim) {
        r.style.animation = 'rise .7s cubic-bezier(.2,.8,.2,1) backwards';
        r.style.animationDelay = i * 0.03 + 's';
      }
      series.appendChild(r);
    });
  }
  draw(data, true);
  bindPlotTip(plot, () => ({ n: N, max, type: 'bar', label: (i) => i + 1 + ' 구간', series: [{ name: 'Connected', color: 'var(--point-main)', values: data }] }));
  return {
    tick() {
      data = [...data.slice(1), 20 + Math.random() * 72];
      draw(data, false);
      const last = series.lastChild;
      if (last) {
        last.style.animation = 'rise .6s cubic-bezier(.2,.8,.2,1)';
      }
    },
    redraw() {
      data = Array.from({ length: N }, () => 20 + Math.random() * 72);
      draw(data, true);
    },
  };
}
// 회선 사용량: area chart, live scroll left
function makeCircuit() {
  const { defs, series, plot } = axes(document.getElementById('ch-ci'), [100, 75, 50, 25, 0], ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'], 5);
  const lg = svgEl('linearGradient', { id: 'ciGrad', x1: 0, y1: 0, x2: 0, y2: 1 });
  lg.append(svgEl('stop', { offset: '0%', 'stop-color': 'var(--point-main)', 'stop-opacity': 0.35 }), svgEl('stop', { offset: '100%', 'stop-color': 'var(--point-main)', 'stop-opacity': 0 }));
  defs.appendChild(lg);
  const N = 14,
    step = 400 / (N - 1),
    max = 100,
    ys = (v) => 200 - (v / max) * 200;
  let data = Array.from({ length: N }, (_, i) => 62 + Math.sin(i / 2) * 14 + Math.random() * 7);
  const g = svgEl('g');
  series.appendChild(g);
  const ar = svgEl('path', { fill: 'url(#ciGrad)' });
  const ln = svgEl('path', { fill: 'none', stroke: 'var(--point-main)', 'stroke-width': 2, 'stroke-linejoin': 'round' });
  const dot = svgEl('circle', { class: 'pulse-dot', r: 3, fill: 'var(--point-main)' });
  g.append(ar, ln, dot);
  function draw(d) {
    const p = spline(d, step, ys);
    ln.setAttribute('d', p);
    ar.setAttribute('d', p + ` L ${(d.length - 1) * step} 200 L 0 200 Z`);
    dot.setAttribute('cx', Math.min((d.length - 1) * step, 398));
    dot.setAttribute('cy', ys(d[d.length - 1]));
  }
  function intro() {
    draw(data);
    const L = ln.getTotalLength();
    ln.style.transition = 'none';
    ln.style.strokeDasharray = L;
    ln.style.strokeDashoffset = L;
    ar.style.transition = 'none';
    ar.style.opacity = '0';
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        ln.style.transition = 'stroke-dashoffset 1.3s ease';
        ln.style.strokeDashoffset = '0';
        ar.style.transition = 'opacity 1.3s ease';
        ar.style.opacity = '1';
      })
    );
  }
  intro();
  bindPlotTip(plot, () => ({ n: N, max, type: 'area', unit: '%', label: (i) => i + 1 + ' 구간', series: [{ name: '회선 사용량', color: 'var(--point-main)', values: data }] }));
  return {
    tick() {
      const nd = [...data, clamp(data[N - 1] + (Math.random() * 24 - 12), 35, 98)];
      draw(nd);
      g.style.transition = 'none';
      g.style.transform = 'translateX(0)';
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          g.style.transition = 'transform .9s ease';
          g.style.transform = `translateX(${-step}px)`;
        })
      );
      setTimeout(() => {
        data = nd.slice(1);
        g.style.transition = 'none';
        g.style.transform = 'translateX(0)';
        draw(data);
      }, 920);
    },
  };
}
// CPU(Core) segmented donut + legend
function makeDonut() {
  const svg = document.getElementById('donut');
  const leg = document.getElementById('dleg');
  const items = [
    ['마케팅 정보 분석', 38, 'var(--point-main)'],
    ['클라우드관리플랫폼', 22, 'var(--point-sub)'],
    ['어플리케이션 보안', 18, 'color-mix(in srgb,var(--point-main) 50%,var(--line))'],
    ['지속적 통합배포', 14, 'color-mix(in srgb,var(--text-weak) 55%,var(--line))'],
    ['스마트창구', 8, 'var(--line)'],
  ];
  const cx = 64,
    cy = 64,
    r = 46,
    C = 2 * Math.PI * r,
    gap = 8;
  svg.innerHTML = '';
  let off = 0;
  items.forEach(([nm, val, col]) => {
    const seg = (C * val) / 100;
    const c = svgEl('circle', {
      cx,
      cy,
      r,
      fill: 'none',
      stroke: col,
      'stroke-width': 16,
      'stroke-dasharray': `${Math.max(0, seg - gap)} ${C - Math.max(0, seg - gap)}`,
      'stroke-dashoffset': -off,
      transform: `rotate(-90 ${cx} ${cy})`,
    });
    c.style.transition = 'stroke-dasharray .9s ease';
    c.dataset.tip = nm;
    c.dataset.tipV = val + '%';
    c.dataset.tipC = col;
    c.dataset.tipH = 'CPU(Core)';
    svg.appendChild(c);
    off += seg;
  });
  leg.innerHTML = items.map(([n, v, c]) => `<div class="row"><i style="background:${c}"></i>${n}<b>${v}%</b></div>`).join('');
}
// heatmap status dots
function makeHeat() {
  const heat = document.getElementById('heat');
  const days = ['07/22', '07/23', '07/24', '07/25', '07/26', '07/27'];
  const rows = ['Client', 'Network', 'System', 'e-Banking'];
  let h = `<div class="hrow"><div class="rl">주간현황</div>${days.map((d) => `<div class="hh">${d}</div>`).join('')}</div>`;
  rows.forEach((r) => {
    h += `<div class="hrow"><div class="rl">${r}</div>`;
    for (let i = 0; i < 6; i++) {
      const alert = Math.random() > 0.86;
      const dly = `animation-delay:${(Math.random() * 2.2).toFixed(2)}s`;
      h += `<div class="hcell" data-tip="${r}" data-tip-h="${days[i]}" data-tip-v="${alert ? 'Critical' : '정상'}" data-tip-c="${alert ? 'var(--danger)' : 'var(--point-main)'}">${
              alert ? `<span class="al" style="${dly}"><i></i></span>` : `<span class="ok" style="${dly}"></span>`
            }</div>`;
    }
    h += '</div>';
  });
  heat.innerHTML = h;
}
makeHeat();
