/* ── 협의 결과서 — 고객사 회의 끝에 한 장으로 남기는 문서(인쇄 · PDF) ──
   PRD 요약 · 고객이 꼭 볼 숫자와 메모 · 기능명세(보여 줄 값 · 메모) · 지금 화면 캡처 · 색과 로고 · 디자인 결정 ·
   다음 할 일과 확인 칸. 디자인 사양서(spec-sheet.js)는 색 · 대비만 담는 개발 핸드오프용이고, 이건 고객에게 주는 문서다.
   팝업 차단을 피하려고 누른 순간 창부터 열고(작성 중), 화면 캡처가 끝나면 내용을 채운다. */
async function exportMeetingRecord() {
  const w = window.open('', '_blank');
  if (!w) {
    toast('팝업이 차단됐어요. 팝업을 허용한 뒤 다시 시도하세요.', { type: 'err' });
    return;
  }
  w.document.write('<!doctype html><meta charset="utf-8"><title>협의 결과서 작성 중</title><body style="font-family:sans-serif;padding:40px;color:#555">협의 결과서를 만드는 중이에요…</body>');
  const M = window.WEMB && WEMB.meeting;
  const tx = (s) => (M ? M.text(String(s == null ? '' : s)) : String(s == null ? '' : s));
  const esc = (s) => tx(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const ls = (k, def) => { try { const v = localStorage.getItem(k); return v == null ? def : v; } catch (e) { return def; } };
  const lsJSON = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) || def; } catch (e) { return def; } };

  const prd = lsJSON('wemb-prd', {});
  const site = (prd.site || '').trim() || (document.getElementById('brandName') || {}).value || '이 프로젝트';
  const SCREEN = { dash: '관제 대시보드', dt: '디지털 트윈' };
  const SCALE = { single: '단일 설비', multi: '다중 설비·구역', enterprise: '전사·다중 사이트' };
  const inds = window.__prdIndustryLabels ? window.__prdIndustryLabels() : [];
  const kpis = (prd.kpis || []).filter((k) => k && k.label);
  const specRows = window.__specRecord ? window.__specRecord() : [];

  /* 지금 화면 캡처 — PNG 내보내기와 같은 보정(애니메이션 끔 · 게이지 그림)을 쓴다 */
  let shot = '';
  try {
    const cv = await captureMain(1.5);
    shot = cv.toDataURL('image/jpeg', 0.9);
    if (window.__wembThumbFrom) window.__wembThumbFrom(cv); /* 홈 카드 썸네일도 이 모습으로 */
  } catch (e) { shot = ''; }

  const theme = captureTheme();
  const hex = themeCoreMap(theme);
  const logo = ls('wemb-brand-logo', '');
  const lay = (window.WEMB && WEMB.layouts && WEMB.layouts.findLayout(ls('wemb-layout', ''))) || null;
  const FONT = { pretendard: 'Pretendard', malgun: '맑은 고딕', system: '시스템 글꼴' };
  const HDR = { base: '기본', left: '메뉴 왼쪽', compact: '간결' };
  const decisions = [
    ['화면 형식', (state.version === 'enterprise' ? 'Enterprise(정밀형)' : 'Flat(기본형)') + ' · ' + (state.mode === 'light' ? '라이트' : '다크')],
    ['배치', lay ? lay.name + ' — ' + lay.desc : '—'],
    ['본문 글꼴', FONT[ls('wemb-dash-font', 'pretendard')] || 'Pretendard'],
    ['숫자 글꼴', ls('wemb-dash-numfont', 'base') === 'tech' ? '테크(Tomorrow)' : '본문과 같게'],
    ['제목 · 숫자 크기', ls('wemb-dash-tscale', '100') + '%'],
    ['헤더 모양', HDR[ls('wemb-dash-hdr', 'base')] || '기본'],
    ['패널 모서리', (theme.radius != null ? theme.radius : 8) + 'px'],
  ];
  const swatches = (typeof CURPAL_ROLES !== 'undefined' ? CURPAL_ROLES : []).map(([k, l]) =>
    `<div class="sw"><span class="chip" style="background:${hex[k]}"></span><b>${esc(l)}</b><code>${hex[k]}</code></div>`).join('');
  const d = new Date(), p = (n) => String(n).padStart(2, '0');
  const day = d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  const PRI = { hi: '높음', mid: '보통', low: '낮음' };
  const specHTML = specRows.length
    ? specRows.map((r) => `<tr><td><b>${esc(r.feat)}</b>${r.sub ? `<small>${esc(r.sub)}</small>` : ''}${r.memo ? `<small class="memo">메모 · ${esc(r.memo)}</small>` : ''}${r.reqs ? `<small class="memo">요구사항 · ${esc(r.reqs.replace(/\n+/g, ' / '))}</small>` : ''}</td><td>${esc(r.type)}</td><td>${esc(PRI[r.pri] || r.pri)}</td><td>${esc(r.status)}</td></tr>`).join('')
    : '<tr><td colspan="4">기능명세서를 아직 만들지 않았어요.</td></tr>';
  const lines = (n) => Array.from({ length: n }, () => '<div class="line"></div>').join('');

  const html =
    `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${esc(site)} 협의 결과서 ${day}</title>` +
    (typeof wembFontLinks === 'function' ? wembFontLinks() : '') +
    `<style>` +
    `*{box-sizing:border-box}body{font-family:'Pretendard Variable',Pretendard,-apple-system,'Segoe UI','Malgun Gothic',sans-serif;color:#15151a;margin:0;padding:32px 36px;background:#fff;font-size:13px;line-height:1.55}` +
    `header{display:flex;align-items:center;gap:16px;border-bottom:2px solid #15151a;padding-bottom:12px;margin-bottom:6px}header img{max-height:34px;max-width:160px}` +
    `h1{font-size:22px;margin:0}.meta{color:#6b7280;font-size:12.5px;margin:6px 0 20px}` +
    `h2{font-size:14.5px;margin:24px 0 10px;padding-bottom:5px;border-bottom:1px solid #e5e7eb}` +
    `dl{display:grid;grid-template-columns:130px 1fr;gap:6px 14px;margin:0}dt{color:#6b7280}dd{margin:0}` +
    `table{width:100%;border-collapse:collapse;font-size:12.5px}th,td{text-align:left;padding:7px 8px;border-bottom:1px solid #eef0f3;vertical-align:top}th{color:#6b7280;font-weight:600;font-size:11.5px}` +
    `td small{display:block;color:#6b7280;font-size:11.5px;margin-top:2px}td small.memo{color:#9a5b00}` +
    `.shot{width:100%;border:1px solid #e5e7eb;border-radius:6px}` +
    `.pal{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}.sw{display:grid;gap:3px;font-size:11.5px}.chip{height:30px;border-radius:6px;border:1px solid rgba(0,0,0,.12)}.sw code{font-family:Consolas,monospace;color:#6b7280;font-size:11px}` +
    `.kpis{display:flex;flex-wrap:wrap;gap:8px}.kpis span{border:1px solid #d1d5db;border-radius:999px;padding:3px 12px;font-weight:600}` +
    `.memo-box{white-space:pre-wrap;background:#f9fafb;border:1px solid #eef0f3;border-radius:8px;padding:10px 12px}` +
    `.line{border-bottom:1px solid #d1d5db;height:28px}.sign{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:10px}.sign div{border-bottom:1px solid #9ca3af;height:40px;font-size:11.5px;color:#6b7280}` +
    `.foot{margin-top:24px;color:#9aa0ac;font-size:11px}` +
    `@media print{body{padding:12mm}h2,tr,.shot{page-break-inside:avoid}h2{page-break-after:avoid}}` +
    `</style></head><body>` +
    `<header>${logo ? `<img src="${logo}" alt="">` : ''}<h1>${esc(site)} 협의 결과서</h1></header>` +
    `<div class="meta">회의 날짜 ${day} ${p(d.getHours())}:${p(d.getMinutes())} · 장소 ______________ · 참석자 ______________________________</div>` +
    `<h2>1. 프로젝트 개요</h2><dl>` +
    `<dt>프로젝트</dt><dd>${esc(site)}</dd>` +
    `<dt>화면</dt><dd>${esc(SCREEN[prd.screen] || '—')}</dd>` +
    `<dt>관제 규모</dt><dd>${esc(SCALE[prd.scale] || '—')}</dd>` +
    `<dt>산업군</dt><dd>${esc(inds.join(', ') || '—')}</dd>` +
    `<dt>모니터링 대상</dt><dd>${esc((prd.targets || []).join(' · ') || '—')}</dd></dl>` +
    `<h2>2. 고객이 꼭 보고 싶은 숫자 · 요청</h2>` +
    (kpis.length ? `<div class="kpis">${kpis.map((k) => `<span>${esc(k.label)}${k.unit ? ' (' + esc(k.unit) + ')' : ''}</span>`).join('')}</div>` : '<p>—</p>') +
    (prd.memo && prd.memo.trim() ? `<p style="margin:10px 0 4px;color:#6b7280">고객 메모</p><div class="memo-box">${esc(prd.memo.trim())}</div>` : '') +
    `<h2>3. 기능명세</h2><table><thead><tr><th>기능 · 보여 줄 값</th><th>구분</th><th>중요도</th><th>상태</th></tr></thead><tbody>${specHTML}</tbody></table>` +
    `<h2>4. 화면 시안</h2>` + (shot ? `<img class="shot" src="${shot}" alt="화면 시안">` : '<p>화면을 캡처하지 못했어요. 스튜디오에서 ‘대시보드 PNG’로 따로 저장해 주세요.</p>') +
    `<h2>5. 디자인 결정</h2><dl>${decisions.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join('')}</dl>` +
    `<p style="margin:14px 0 8px;color:#6b7280">색</p><div class="pal">${swatches}</div>` +
    `<h2>6. 다음 할 일 · 확인 필요</h2>${lines(4)}` +
    `<div class="sign"><div>고객사 확인</div><div>WEMB 담당</div></div>` +
    `<div class="foot">WEMB Studio에서 만든 협의 결과서 · ${day}</div>` +
    `</body></html>`;
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { try { w.print(); } catch (e) {} }, 600);
  toast('협의 결과서를 새 창에서 열었어요. 인쇄 창에서 “PDF로 저장”을 고르세요.', { type: 'ok', dur: 4600 });
}
(function () {
  const b = document.getElementById('exRecord');
  if (b) b.onclick = exportMeetingRecord;
})();
