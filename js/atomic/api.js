// 서버 호출. 쓰기 요청에는 스튜디오 표시 헤더를 붙인다 (서버가 이 헤더 없는 쓰기를 거부한다).
// wemb-atomic 서버가 없으면(GitHub Pages · 켜기.cmd 의 PowerShell 서버) 미리 뽑아 둔 파일로 같은 응답을 만든다 — static-api.js
import { staticApi } from './static-api.js';

let mode = null;
/** 'server' | 'static' — 처음 한 번 알아본다. GitHub Pages 는 물어보지 않는다(콘솔에 404 가 남지 않게) */
export function apiMode() {
  if (!mode) {
    mode = /\.github\.io$/.test(location.hostname) ? Promise.resolve('static')
      : fetch('api/definitions', { cache: 'no-store' })
        .then((r) => (r.ok && /json/.test(r.headers.get('content-type') || '') ? 'server' : 'static'))
        .catch(() => 'static');
  }
  return mode;
}
/** 문서에 <link> 로 싣는 공용 글꼴 시트 */
export async function globalsCssUrl() {
  return (await apiMode()) === 'server' ? 'api/globals.css' : 'src/atomic/globals.css';
}

export async function api(url, opts = {}) {
  if ((await apiMode()) === 'static') return staticApi(url, opts);
  const { method = 'GET', body, text = false } = opts;
  const init = { method, headers: {} };
  if (method !== 'GET') init.headers['X-Wemb-Atomic'] = '1';
  if (body !== undefined) { init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(body); }
  const res = await fetch(url, init);
  if (!res.ok) {
    let message = res.status + ' ' + res.statusText;
    try { message = (await res.json()).error || message; } catch {}
    const error = new Error(message); error.status = res.status; throw error;
  }
  return text ? res.text() : res.json();
}
