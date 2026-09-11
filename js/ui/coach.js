/* ── 화면 둘러보기(코치마크) ── */

/* (6) 온보딩 스포트라이트(코치마크) — 실제 UI 영역을 순서대로 안내 */
const COACH_STEPS = [
  { sel: '.colorset .srcseg', ttl: '① 색을 골라요', desc: '여기서 방식을 고르세요. 잘 모르겠으면 <b>추천</b>을 눌러 마음에 드는 걸 하나 고르면 끝이에요.', side: 'right' },
  /* 화면 종류에 따라 .stage가 숨겨질 수 있으므로 항상 보이는 .main을 가리킴 */
  { sel: '.main', ttl: '② 오른쪽에서 확인', desc: '고른 색이 실제 관제 화면에 바로 입혀져요. 글자가 안 보이면 왼쪽에 <b>경고</b>가 자동으로 떠요.', side: 'left' },
  { sel: '#exportOpen', ttl: '③ 내보내기', desc: '마음에 들면 <b>코드·이미지·PDF 사양서·공유 링크</b>로 내보내 개발·디자인팀에 전달하세요.', side: 'right' },
];
(function initCoach() {
  const coach = document.getElementById('coach');
  const spot = document.getElementById('coachSpot');
  const tip = document.getElementById('coachTip');
  if (!coach) return;
  let idx = 0;
  function place() {
    const step = COACH_STEPS[idx];
    const el = document.querySelector(step.sel);
    if (!el) {
      next();
      return;
    }
    /* 대상이 접힌 스텝 카드 안이면 먼저 펼침 (안 열면 크기가 0이라 스포트라이트가 사라짐) */
    const card = el.closest('details.stepcard');
    if (card && !card.open) card.open = true;
    /* 자동 유도로 숨겨둔 게이트(.cgate) 안이 대상이면 함께 펼쳐 스포트라이트가 잡히게 한다 */
    if (card) card.querySelectorAll('.cgate').forEach((g) => g.classList.remove('locked'));
    el.closest('.cgate')?.classList.remove('locked');
    if (el.closest('.sidebar')) el.scrollIntoView({ block: 'center', behavior: 'auto' });
    /* 텍스트·버튼을 먼저 채운 뒤(툴팁 크기 확정) 위치 계산 — rAF에 의존하지 않아 탭이 비활성이어도 동작 */
    document.getElementById('coachStep').textContent = `둘러보기 ${idx + 1} / ${COACH_STEPS.length}`;
    document.getElementById('coachTtl').textContent = step.ttl;
    document.getElementById('coachDesc').innerHTML = step.desc;
    document.getElementById('coachPrev').style.visibility = idx === 0 ? 'hidden' : 'visible';
    document.getElementById('coachNext').textContent = idx === COACH_STEPS.length - 1 ? '완료' : '다음';
    const r = el.getBoundingClientRect();
    const pad = 6;
    /* 뷰포트 크기 — innerWidth가 0으로 보고되는 환경(숨김 탭 등) 대비 폴백 */
    const vw = window.innerWidth || document.documentElement.clientWidth || 1280;
    const vh = window.innerHeight || document.documentElement.clientHeight || 800;
    const top = Math.max(6, r.top - pad),
      left = Math.max(6, r.left - pad);
    const w = Math.max(20, Math.min(r.width + pad * 2, vw - left - 6));
    const h = Math.max(20, Math.min(r.height + pad * 2, vh - top - 6));
    spot.style.top = top + 'px';
    spot.style.left = left + 'px';
    spot.style.width = w + 'px';
    spot.style.height = h + 'px';
    const tr = tip.getBoundingClientRect();
    let tLeft, tTop;
    if (step.side === 'right' && left + w + 16 + tr.width < vw) tLeft = left + w + 16;
    else if (step.side === 'left' && left - tr.width - 16 > 0) tLeft = left - tr.width - 16;
    else tLeft = Math.min(Math.max(left, 12), Math.max(12, vw - tr.width - 12));
    tTop = Math.min(Math.max(top, 12), Math.max(12, vh - tr.height - 12));
    tip.style.left = tLeft + 'px';
    tip.style.top = tTop + 'px';
  }
  function open() {
    idx = 0;
    coach.classList.add('show');
    place();
  }
  function done() {
    coach.classList.remove('show');
    try {
      localStorage.setItem('wemb-onboarded', '1');
    } catch (e) {}
  }
  function next() {
    if (idx >= COACH_STEPS.length - 1) {
      done();
      return;
    }
    idx++;
    place();
  }
  function prev() {
    if (idx > 0) {
      idx--;
      place();
    }
  }
  document.getElementById('coachNext').onclick = next;
  document.getElementById('coachPrev').onclick = prev;
  document.getElementById('coachSkip').onclick = done;
  window.addEventListener('resize', () => {
    if (coach.classList.contains('show')) place();
  });
  document.addEventListener('keydown', (e) => {
    if (!coach.classList.contains('show')) return;
    if (e.key === 'Escape') done();
    else if (e.key === 'ArrowRight' || e.key === 'Enter') next();
    else if (e.key === 'ArrowLeft') prev();
  });
  window.__startCoach = open; /* 온보딩 '시작하기'에서 호출 */
})();
