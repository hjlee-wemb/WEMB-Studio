// 서버 호출. 쓰기 요청에는 스튜디오 표시 헤더를 붙인다 (서버가 이 헤더 없는 쓰기를 거부한다).
export async function api(url, { method = 'GET', body, text = false } = {}) {
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
