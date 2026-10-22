/* ── 디지털 트윈 3D — 사진(src/dt-bg.jpg)을 찍은 카메라를 되살린 사진 맞춤 모형(js/preview/3d/models.js 'plant') ──
   처음 시점은 사진과 픽셀까지 같고, 끌면 단지 가운데를 축으로 한 바퀴(360°) 돈다 — 움직이기 시작하면 단지 전체가 화면에 들어오게 물러선다.
   사진에 안 찍힌 곳(건물 뒷면 · 가려진 땅 · 사진 틀 밖)은 엔진이 찍힌 곳에서 이어 채운다(맞은편 면 · 건물 반대쪽 땅 · 둘레에서 번짐).
   - 엔진은 js/preview/3d/engine.js (WEMB3D). 마우스: 끌기 = 돌리기, 오른쪽 끌기 = 옮기기, 휠 = 확대/축소, 건물 누르면 다가가기.
   - 왼쪽 위 보기 단추(data-view): 종합현황 = 단지 전체를 위에서 · 기본위치 = 처음 시점(사진 그대로) · 순차감시 = 건물을 차례로 돌아가며 본다.
   - three.js 는 로컬 사본(src/vendor/three)을 먼저 쓰고 없으면 jsDelivr 에서 받는다. 둘 다 실패하면 사진이 그대로 남는다.
   - 멈출 때마다 지금 모습을 사진 칸(.dt-scene-img)에 정지 그림으로 남긴다 — 캔버스를 못 옮기는 복제본에서도 3D 모습. */
(function initDt3d() {
  const stage = document.getElementById('dtStage');
  const holder = stage && stage.querySelector('.dt-scene');
  if (!holder || !window.WEMB3D) return;
  let state = 'idle'; // idle → loading → ready | failed
  let api = null;

  /* 기본 디지털 트윈일 때만 — 템플릿 화면(HANA · 한진 · LS · POSCO · SK하이닉스)은 자기 시안을 덮는다 */
  const active = () => {
    if (stage.hidden || stage.hasAttribute('data-tpl') || !holder.offsetWidth) return false;
    for (const s of stage.querySelectorAll('.skx-screen')) if (s.style.display !== 'none' && s.offsetWidth) return false;
    return true;
  };
  const photo = holder.querySelector('.dt-scene-img');
  const boot = () => {
    if (state === 'ready') return api.wake();
    if (state !== 'idle' || !active()) return;
    state = 'loading';
    /* 화면 이동(1.5초 규칙)을 막지 않게 — 사진이 먼저 뜨고, 3D 는 뒤에서 받아 준비되면 바꿔 끼운다 */
    setTimeout(() => {
      WEMB3D.load()
        .then(() => {
          api = WEMB3D.create({
            model: 'plant', cls: 'dt3d', transparent: false, themeEl: stage,
            isActive: active,
            place: (c) => holder.appendChild(c),
            onFirst: () => holder.classList.add('is-3d'),
            onStill: (url) => { if (photo) photo.style.backgroundImage = 'url(' + url + ')'; },
            onTourStop: (byUser) => { if (byUser) { const b = stage.querySelector('.dt-navbtn[data-view="tour"]'); if (b) b.classList.remove('on'); } },
          });
          state = 'ready'; api.wake();
        })
        .catch((e) => { state = 'failed'; console.warn('[dt-3d] 3D 를 띄우지 못해 사진을 그대로 둡니다.', e); });
    }, 150);
  };
  const mo = new MutationObserver(boot);
  mo.observe(stage, { attributes: true, attributeFilter: ['hidden', 'data-tpl', 'class'] });
  const body = stage.querySelector('.dt-body');
  if (body) mo.observe(body, { childList: true });
  boot();

  /* 보기 단추 — 종합현황 · 기본위치 · 순차감시 */
  stage.addEventListener('click', (e) => {
    const b = e.target.closest('.dt-navbtn[data-view]');
    if (!b || !api) return;
    const v = b.dataset.view;
    if (v === 'tour') return api.startTour();
    api.view(v === 'overview' ? 'overview' : 'home');
  });
})();
