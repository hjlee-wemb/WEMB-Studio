/* ── 실시간 — 시계 · 날씨 · 내비 탭 ── */

/* clock — 날짜·시간 모두 실시간 */
function fmtClock() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const date = d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  const time = p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  return date + ' · ' + time;
}
/* Digital Twin 헤더 시계 — Figma와 같은 '16시 28분 38초 / 2026. 01. 12.' 형식 */
function tickClocks() {
  document.getElementById('clock').textContent = fmtClock();
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const t = document.getElementById('dtTime');
  const dd = document.getElementById('dtDate');
  if (t) t.textContent = `${p(d.getHours())}시 ${p(d.getMinutes())}분 ${p(d.getSeconds())}초`;
  if (dd) dd.textContent = `${d.getFullYear()}. ${p(d.getMonth() + 1)}. ${p(d.getDate())}.`;
}
/* ── 스튜디오가 아무에게도 안 보이는 상태인가 ──
   탭이 뒤로 가 있으면 주기 갱신(시계·KPI·차트·라이브 표)은 전부 헛일이다.
   (예전엔 같은 문서의 런처가 스튜디오를 덮고 있을 때도 멈췄다 — 홈이 별도 문서가 되며 그 경우는 사라졌다) */
window.__wembIdle = function () {
  return document.hidden;
};
tickClocks();
setInterval(() => { if (!window.__wembIdle()) tickClocks(); }, 1000);

/* weather — 실시간 날씨
   네이버 날씨는 공개 API가 없고, 브라우저에서 페이지를 직접 읽으면 CORS로 차단돼요.
   그래서 키 없이 바로 쓰는 무료 실시간 기상 서비스(Open-Meteo, 기상청 데이터 기반)를 사용합니다.
   위치 권한을 허용하면 현재 위치, 아니면 서울 기준으로 표시돼요. */
const WMO = {
  0: ['☀', '맑음'],
  1: ['🌤', '대체로 맑음'],
  2: ['⛅', '구름 조금'],
  3: ['☁', '흐림'],
  45: ['🌫', '안개'],
  48: ['🌫', '짙은 안개'],
  51: ['🌦', '이슬비'],
  53: ['🌦', '이슬비'],
  55: ['🌦', '강한 이슬비'],
  56: ['🌧', '어는 이슬비'],
  57: ['🌧', '어는 이슬비'],
  61: ['🌧', '약한 비'],
  63: ['🌧', '비'],
  65: ['🌧', '강한 비'],
  66: ['🌧', '어는 비'],
  67: ['🌧', '어는 비'],
  71: ['🌨', '약한 눈'],
  73: ['🌨', '눈'],
  75: ['🌨', '강한 눈'],
  77: ['🌨', '싸락눈'],
  80: ['🌦', '소나기'],
  81: ['🌦', '소나기'],
  82: ['⛈', '강한 소나기'],
  85: ['🌨', '소낙눈'],
  86: ['🌨', '강한 소낙눈'],
  95: ['⛈', '뇌우'],
  96: ['⛈', '우박 동반 뇌우'],
  99: ['⛈', '우박 동반 뇌우'],
};
async function loadWeather(lat, lon) {
  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current=temperature_2m,weather_code&timezone=auto';
    const r = await fetch(url);
    if (!r.ok) throw new Error('weather http ' + r.status);
    const j = await r.json();
    const c = j.current;
    const [icon, desc] = WMO[c.weather_code] || ['☁', '—'];
    document.getElementById('wicon').textContent = icon;
    document.getElementById('wdesc').textContent = desc;
    document.getElementById('wtemp').textContent = Math.round(c.temperature_2m) + '℃';
  } catch (e) {
    document.getElementById('wicon').textContent = '⚠';
    document.getElementById('wdesc').textContent = '날씨 정보 없음';
    document.getElementById('wtemp').textContent = '';
  }
}
/* 위치 권한은 '처음 한 번만' 요청하고, 이후 갱신은 저장된 좌표로 날씨만 다시 불러옴
   (예전엔 10분마다 getCurrentPosition을 다시 호출해 권한 팝업이 계속 떴음) */
const SEOUL = [37.5665, 126.978];
let weatherCoords = SEOUL; // 기본값: 서울. 위치 허용 시 실제 좌표로 교체
/* (3) 위치 권한은 사용자가 날씨 위젯을 직접 눌러 '켤 때만' 요청 (테마 도구가 무단으로 위치를 묻지 않도록) */
function requestLiveLocation() {
  if (!navigator.geolocation) {
    toast('이 브라우저는 위치 기능을 지원하지 않아요.', { type: 'warn' });
    return;
  }
  toast('위치를 확인하는 중…', { type: 'info', dur: 1800 });
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      weatherCoords = [pos.coords.latitude, pos.coords.longitude];
      loadWeather(weatherCoords[0], weatherCoords[1]);
      const w = document.getElementById('weather');
      if (w) {
        w.classList.remove('wopt');
        w.title = '실시간 날씨 · 내 위치';
      }
      toast('내 위치의 실시간 날씨로 바꿨어요.', { type: 'ok' });
    },
    () => toast('위치 권한이 거부됐어요. 기본(서울) 날씨를 계속 표시해요.', { type: 'warn' }),
    { timeout: 8000, maximumAge: 60 * 60 * 1000 }
  );
}
function initWeather() {
  /* 기본은 서울 날씨만 표시 — 권한 팝업 없음 */
  loadWeather(weatherCoords[0], weatherCoords[1]);
  const w = document.getElementById('weather');
  if (w) {
    w.classList.add('wopt');
    w.title = '눌러서 내 위치의 실시간 날씨 보기 (기본: 서울)';
    w.addEventListener('click', requestLiveLocation);
  }
}
initWeather();
// 10분마다 갱신 — 위치는 다시 묻지 않고 저장된 좌표로 날씨만 새로고침
setInterval(() => loadWeather(weatherCoords[0], weatherCoords[1]), 10 * 60 * 1000);

/* interactions */
document.querySelectorAll('.nav a').forEach((a) =>
  a.addEventListener('click', () => {
    document.querySelectorAll('.nav a').forEach((x) => x.classList.remove('active'));
    a.classList.add('active');
  })
);
document.querySelectorAll('.ph .tabs').forEach((g) =>
  g.querySelectorAll('b').forEach((b) =>
    b.addEventListener('click', () => {
      g.querySelectorAll('b').forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
    })
  )
);
