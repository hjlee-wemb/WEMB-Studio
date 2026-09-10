/* ── 옵션 사이드바 — 접기 · 탭 · 아코디언 · 스텝 카드 ── */

const appEl = document.getElementById('app');
/* 옵션 패널 접힘 상태를 한 곳에서 바꾼다 — 레일 토글의 aria-expanded·라벨이 항상 따라오도록.
   예전엔 세 곳(closer/opener/레일)이 각자 classList 를 만져 상태 표시가 어긋났다. */
function setSidebarCollapsed(next) {
  appEl.classList.toggle('collapsed', !!next);
  const t = document.querySelector('.railtoggle');
  if (t) {
    const open = !next;
    t.setAttribute('aria-expanded', open ? 'true' : 'false');
    const lab = open ? '옵션 패널 접기' : '옵션 패널 펼치기';
    t.setAttribute('aria-label', lab);
    t.title = lab;
  }
}
window.__setSidebarCollapsed = setSidebarCollapsed;
document.getElementById('closer').onclick = () => setSidebarCollapsed(true);
document.getElementById('opener').onclick = () => setSidebarCollapsed(false);

/* ── 좁은 폭에서 옵션 패널 자동 접기 ──
   사이드바(300px) + 레일(52px)이 고정이라 프리뷰가 받는 폭은 '뷰포트 − 352'다.
   시연 장면인 노트북(1280~1440)에서 KPI 숫자와 패널 제목이 잘리던 원인이 이것이다.
   접기 자체는 이미 구현돼 있으니(.app.collapsed) 임계폭에서 걸어 주기만 한다.
   임계폭을 넘는 순간에만 개입하므로, 그 사이의 수동 접기·펼치기는 그대로 유지된다. */
(function initAutoCollapse() {
  const NARROW = 1180;
  let wasNarrow = null;
  function sync() {
    const narrow = window.innerWidth < NARROW;
    if (narrow === wasNarrow) return; /* 임계폭을 넘는 순간에만 개입 */
    wasNarrow = narrow;
    /* 창 크기를 끄는 동안 width 를 애니메이션하면 7천 개 노드가 매 프레임 재배치된다.
       사용자가 직접 누르는 토글의 전환은 그대로 두고, 자동 전환만 즉시 반영한다. */
    appEl.classList.add('no-anim');
    setSidebarCollapsed(narrow);
    requestAnimationFrame(() => requestAnimationFrame(() => appEl.classList.remove('no-anim')));
  }
  sync();
  let t = null;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(sync, 120); });
})();

/* 사이드바 상단 탭 — 테마(컬러 워크플로우)와 대시보드 편집을 분리해 전환 */
let selectSidebarTab = () => {};
(function () {
  const tabbody = document.querySelector('.tabbody');
  const tabs = [...document.querySelectorAll('.sbtab')];
  /* 화면 종류를 바꿀 때(applyScreen) 탭을 강제로 되돌릴 수 있도록 밖으로 노출 */
  selectSidebarTab = (t) => {
    if (tabbody) tabbody.setAttribute('data-tab', t);
    tabs.forEach((x) => {
      const on = x.dataset.tab === t;
      x.classList.toggle('on', on);
      x.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  };
  tabs.forEach((b) => {
    b.addEventListener('click', () => {
      if (b.disabled) return;
      selectSidebarTab(b.dataset.tab);
    });
  });
})();

/* 색 소스 패널 — 상단 세그먼트(직접색·사진·추천)가 어떤 패널을 열지 제어.
   summary는 정적 섹션 헤더가 되어 클릭으로 접히지 않음('?' 도움말 클릭도 접힘 방지) */
const accList = [...document.querySelectorAll('.colorset .acc')];
accList.forEach((d) => {
  const summary = d.querySelector(':scope > summary');
  if (summary)
    summary.addEventListener('click', (e) => {
      e.preventDefault(); /* 네이티브 <details> 접힘/펼침 방지 — 항상 펼친 상태 유지 */
      if (e.target.closest('.info')) e.stopPropagation();
    });
});
/* 실제 열림 상태는 refreshSourceUI(활성 view)가 제어 */

/* 스텝 카드(검증·저장·내보내기) — 헤더의 '?' 도움말 클릭은 접기/펼치기에서 제외 */
document.querySelectorAll('.stepcard > summary .info').forEach((info) => {
  info.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
});

/* 스텝 카드 펼침/접힘 애니메이션 —
   네이티브 <details>는 내용이 툭 끊기듯 나타난다. 높이·세로 패딩·투명도를
   이어 줘서 부드럽게 밀려 나오게 한다. 접을 때는 내용이 끝까지 보여야 하므로
   open 속성을 애니메이션이 끝난 뒤에 내린다(그 사이 .closing으로 ▾를 먼저 돌림).
   box-sizing:border-box라 height만 0으로 줄이면 패딩이 남으므로 함께 줄인다. */

/* 카드 내용 높이가 63px('내보내기')~771px('색 정하기')로 12배 넘게 차이 난다.
   시간을 고정하면 같은 280ms 안에 어떤 카드는 84px, 어떤 카드는 771px를 지나가서
   큰 카드일수록 확 튀어 보인다 — '시간은 같은데 속도가 다른' 상태.
   그래서 스텝1 '화면 정하기'(84px에 280ms ≈ 0.3px/ms)의 체감 속도를 기준으로
   이동 거리에 따라 시간을 늘린다. 다만 정비례하면 '색 정하기'가 2.5초라 못 쓰므로
   √에 비례시키고 상한을 둔다(상한을 올릴수록 큰 카드가 더 느긋해진다). */
const STEP_BASE_H = 84,
  STEP_BASE_MS = 280;
const stepDuration = (dist) => clamp(Math.round(STEP_BASE_MS * Math.sqrt(Math.max(dist, 1) / STEP_BASE_H)), 260, 560);

document.querySelectorAll('details.stepcard').forEach((card) => {
  const summary = card.querySelector(':scope > summary');
  const body = card.querySelector(':scope > .stepbody');
  if (!summary || !body) return;
  const cs = getComputedStyle(body);
  const padTop = cs.paddingTop,
    padBottom = cs.paddingBottom;
  let anim = null;
  let want = card.open; /* 연타 대비 — 지금 향하는 상태를 따로 기억 */

  function stop() {
    if (!anim) return;
    anim.onfinish = null;
    anim.cancel();
    anim = null;
  }
  function toggle(open) {
    want = open;
    /* 진행 중이었다면 지금 보이는 모습에서 이어 가도록 현재 값을 먼저 재 둔다
       (안 그러면 방향을 바꾼 순간 원래 높이로 한 번 튀었다가 움직인다) */
    const mid = anim ? { height: body.getBoundingClientRect().height + 'px', paddingTop: cs.paddingTop, paddingBottom: cs.paddingBottom, opacity: +cs.opacity } : null;
    stop();
    body.style.overflow = '';
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      card.classList.remove('closing');
      card.open = open;
      return;
    }
    if (open) card.open = true; /* 펼침은 붙인 뒤라야 높이를 잴 수 있다 */
    card.classList.toggle('closing', !open);
    const shut = { height: '0px', paddingTop: '0px', paddingBottom: '0px', opacity: 0 };
    const full = { height: body.getBoundingClientRect().height + 'px', paddingTop: padTop, paddingBottom: padBottom, opacity: 1 };
    body.style.overflow = 'hidden';
    /* fill:forwards — 마지막 프레임과 open 해제 사이에 원래 높이가 한 번 번쩍이는 걸 막는다 */
    /* 실제 이동 거리로 시간을 정한다 — 도중에 방향을 바꾼 경우도 남은 만큼만 움직이게 */
    const from = mid || (open ? shut : full);
    const to = open ? full : shut;
    const dur = stepDuration(Math.abs(parseFloat(to.height) - parseFloat(from.height)));
    anim = body.animate([from, to], {
      duration: open ? dur : Math.round(dur * 0.72) /* 접힘은 조금 더 빠르게 */,
      easing: open ? 'cubic-bezier(.25,.7,.25,1)' : 'cubic-bezier(.4,0,.7,1)',
      fill: 'forwards',
    });
    anim.onfinish = () => {
      const done = anim;
      anim = null;
      body.style.overflow = '';
      card.classList.remove('closing');
      if (!want) card.open = false;
      if (done) {
        done.onfinish = null;
        done.cancel(); /* 상태를 반영한 뒤 fill 해제 — 인라인 높이가 남지 않게 */
      }
    };
  }
  summary.addEventListener('click', (e) => {
    if (e.target.closest('.info')) return; /* 도움말 배지는 접기/펼치기 대상이 아님 */
    e.preventDefault(); /* 네이티브 즉시 토글을 막고 직접 제어 */
    /* 애니메이션 중이면 향하던 상태를, 아니면 실제 DOM 상태를 기준으로 뒤집는다.
       (둘러보기 코치마크처럼 밖에서 card.open을 직접 켜는 경우와 어긋나지 않게) */
    toggle(!(anim ? want : card.open));
  });
  /* 스텝별 자동 유도에서 애니메이션과 함께 펼칠 수 있도록 노출 */
  card.__setOpen = toggle;
});
