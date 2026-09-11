/* ── KPI 진입 애니메이션 · 실시간 변동 ── */

/* entrance */
document.querySelectorAll('.kpi').forEach((el, i) => (el.style.animationDelay = i * 0.06 + 's'));
document.querySelectorAll('.col .panel').forEach((el, i) => (el.style.animationDelay = 0.3 + i * 0.06 + 's'));
document.querySelectorAll('.fill').forEach((f, i) => {
  const w = f.style.width;
  f.style.width = '0';
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      f.style.transitionDelay = i * 0.05 + 's';
      f.style.width = w;
    })
  );
});
document.querySelectorAll('.mini .d').forEach((d, i) => {
  const v = d.style.getPropertyValue('--v');
  d.style.setProperty('--v', '0%');
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      d.style.transitionDelay = i * 0.07 + 's';
      d.style.setProperty('--v', v);
    })
  );
});
/* ===== KPI 실시간 변동 + 추세 화살표 (값 카운트업보다 먼저 원본 목표값을 읽음) ===== */
(function liveKPI() {
  const stage = document.querySelector('.stage');
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  /* Overview 전용 — 누적 카운터(거래건수)와 TPS 형태를 전제로 한 로직이라
     퍼센트·비율이 섞인 Production KPI에는 적용하지 않는다(아래 prodKPI가 담당). */
  /* 기준값은 '지금 화면에 적힌 숫자'에서 읽는다. PRD 어휘로 내용을 갈아끼우면(__applyPrdToPanels)
     그 값이 통째로 바뀌므로, 로드 시점에 한 번만 읽어두면 라이브 틱이 옛 은행 숫자를 계속 되살린다.
     → 다시 읽을 수 있게 함수로 빼고 노출한다. */
  let kpis = [];
  function seedKPIs() {
    kpis = [...document.querySelectorAll('.dashpage[data-page="overview"] .kpis .kpi')].map((kpi) => {
    const valEl = kpi.querySelector('.val');
    const subB = kpi.querySelector('.sub b');
    const val = parseInt((valEl ? valEl.textContent : '').replace(/,/g, '')) || 0;
    let cur = 0,
      peak = 0,
      hasPeak = false;
    if (subB) {
      const parts = subB.textContent
        .replace(/[^\d/]/g, '')
        .split('/')
        .filter(Boolean)
        .map(Number);
      cur = parts[0] || 0;
      if (parts.length > 1) {
        peak = parts[1] || 0;
        hasPeak = true;
      }
    }
      /* 재시드 시 화살표가 중복 생성되지 않게 이미 있으면 그걸 쓴다 */
      let chg = kpi.querySelector('.kchg');
      if (!chg) {
        chg = document.createElement('div');
        chg.className = 'kchg flat';
        chg.innerHTML = '—';
        if (valEl) valEl.insertAdjacentElement('afterend', chg);
      }
      return { valEl, subB, val, cur, base: cur, peak, hasPeak, chg };
    });
  }
  seedKPIs();
  /* 내용이 PRD 어휘로 바뀐 뒤 이 함수를 부르면 기준값이 새 숫자로 다시 잡힌다 */
  window.__reseedLiveKPI = seedKPIs;
  /* 값이 바뀔 때 옛 값 → 새 값으로 카운트업(이징) 애니메이션 */
  function animateVal(k, from, to) {
    if (k.raf) cancelAnimationFrame(k.raf);
    const start = performance.now(),
      dur = 700;
    k.valEl.classList.add('bump');
    setTimeout(() => k.valEl && k.valEl.classList.remove('bump'), 520);
    (function step(t) {
      const p = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - p, 3); /* easeOutCubic */
      k.valEl.textContent = fmt(from + (to - from) * e);
      if (p < 1) k.raf = requestAnimationFrame(step);
    })(start);
  }
  /* 3초마다 한 번씩: 누적 거래량 단계 증가 + TPS 변동 + 추세 + 임계치 */
  const STEP_SEC = 3;
  function tick() {
    if (window.__wembIdle && window.__wembIdle()) return;      /* 런처에 덮여 안 보이면 쉰다 */
    if (stage.classList.contains('content-editing')) return; /* 내용 수정 중엔 멈춤 */
    kpis.forEach((k) => {
      if (!k.cur) return;
      const prev = k.cur;
      /* 평소엔 기준값 근처로 회귀, 가끔(7%) 피크 근처로 급등 → 임계치 경고 시연 */
      const surge = k.hasPeak && Math.random() < 0.07;
      const aim = surge ? k.base + (k.peak - k.base) * (0.88 + Math.random() * 0.22) : k.base;
      let next = prev + (aim - prev) * 0.3 + (Math.random() - 0.5) * Math.max(6, k.base * 0.03);
      next = Math.max(1, Math.round(next));
      if (k.hasPeak) next = Math.min(next, k.peak);
      k.cur = next;
      /* 누적 거래량은 3초간 처리량(≈ TPS×3)만큼 증가 → 3초마다 또박또박, 카운트업 애니메이션.
         단 PRD 어휘로 갈아끼운 지표(kW·%·℃ 같은 순시값)는 누적하면 '기준 1,180 kW' 옆에서
         값이 무한정 올라가 자기모순이 된다 → 그때는 기준값 근처를 오가게 둔다. */
      const from = k.val;
      k.val = stage.dataset.prdKpi === '1' ? next : k.val + next * STEP_SEC;
      if (k.valEl) animateVal(k, from, k.val);
      if (k.subB) {
        k.subB.textContent = k.hasPeak ? `| ${next}/${k.peak}` : `| ${next}`;
        if (k.hasPeak) {
          const ratio = next / k.peak;
          k.subB.style.color = ratio >= 0.95 ? 'var(--danger)' : ratio >= 0.85 ? 'var(--warning)' : '';
        }
      }
      const d = prev ? ((next - prev) / prev) * 100 : 0;
      const flat = next === prev;
      k.chg.className = 'kchg ' + (flat ? 'flat' : next > prev ? 'up' : 'down');
      k.chg.innerHTML = `${flat ? '—' : next > prev ? '▲' : '▼'} ${Math.abs(d).toFixed(1)}%`;
    });
  }
  /* 초기 카운트업(1.3s)이 끝난 뒤 3초 주기로 갱신 시작 */
  setTimeout(() => setInterval(tick, STEP_SEC * 1000), 1400);
})();

/* ===== Production KPI 실시간 변동 =====
   생산 실적만 누적으로 올리고(시간당 약 1,240EA ≈ 3초에 1EA 남짓),
   나머지 비율 지표는 기준값 근처에서 소수점 한 자리로 미세하게 흔든다.
   단위(%, EA, 분)가 섞여 있어 Overview의 정수 카운터 로직과는 따로 둔다. */
(function prodKPI() {
  const page = document.querySelector('.dashpage[data-page="production"]');
  const stage = document.querySelector('.stage');
  if (!page || !stage) return;
  const vals = [...page.querySelectorAll('.kpi .val')];
  if (vals.length < 5) return;
  const TARGET = 132000;
  let made = 128450;
  /* [기준값, 흔들림 폭, 소수 자리] — 순서는 마크업의 KPI 순서와 같다 */
  const jitter = [null, null, [86.4, 0.6, 1], [0.42, 0.06, 2], [91.8, 0.7, 1]];
  function tick() {
    if (window.__wembIdle && window.__wembIdle()) return;      /* 런처에 덮여 안 보이면 쉰다 */
    if (stage.classList.contains('content-editing')) return; /* 글자 수정 중엔 멈춤 */
    made = Math.min(TARGET, made + Math.round(1 + Math.random() * 3));
    vals[0].textContent = made.toLocaleString('en-US');
    vals[1].textContent = ((made / TARGET) * 100).toFixed(1) + '%';
    const rest = page.querySelectorAll('.kpi')[1].querySelector('.sub b');
    if (rest) rest.textContent = '| ' + (TARGET - made).toLocaleString('en-US') + ' EA';
    jitter.forEach((j, i) => {
      if (!j) return;
      const [base, amp, dp] = j;
      vals[i].textContent = (base + (Math.random() - 0.5) * 2 * amp).toFixed(dp) + '%';
    });
  }
  setTimeout(() => setInterval(tick, 3000), 2200);
})();
document.querySelectorAll('.kpi .val').forEach((el) => {
  const raw = el.textContent.replace(/,/g, '').trim();
  if (!/^\d+$/.test(raw)) return; /* 사용자가 바꾼 숫자 아닌 값은 그대로 둠 */
  const target = parseInt(raw) || 0;
  const dur = 1300,
    start = performance.now();
  (function step(t) {
    const p = Math.min(1, (t - start) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * e).toLocaleString('en-US');
    if (p < 1) requestAnimationFrame(step);
  })(start);
});

/* live: every 5s — 기본형(실시간) 차트만 갱신. 다른 종류로 바꾼 차트는 정지.
   런처에 덮여 안 보일 땐 쉰다(차트 다시 그리기가 이 화면에서 가장 무겁다). */
setInterval(() => { if (!window.__wembIdle()) DashCharts.tick(); }, 5000);
