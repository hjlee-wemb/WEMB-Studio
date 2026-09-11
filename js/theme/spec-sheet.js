/* ── 디자인 사양서 인쇄 ── */

/* (5) 디자인 사양서 — 팔레트 + 대비 검증표를 한 장으로 인쇄/PDF */
function exportSpecSheet() {
  const curTheme = captureTheme();
  const hex = themeCoreMap(curTheme);
  const entT = (curTheme.version || 'flat') === 'enterprise' ? genEnterprise(curTheme) : null;
  const rows = contrastRows(curTheme);
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const modeLabel = state.mode === 'dark' ? '다크(Dark)' : '라이트(Light)';
  const verLabel = (state.version || 'flat') === 'enterprise' ? 'Enterprise' : 'Flat';
  const fails = rows.filter((r) => !r.pass).length;
  const pal = CURPAL_ROLES.map(
    ([k, l]) => `<div class="sw"><span class="chip" style="background:${hex[k]}"></span><div class="swt"><b>${esc(l)}</b><code>${hex[k]}<span>${esc(k)}</span></code></div></div>`
  ).join('');
  const ct = rows
    .map(
      (r) =>
        `<tr class="${r.pass ? 'pass' : 'fail'}"><td><span class="aa" style="background:${r.bg};color:${r.fg}">Aa</span><span>${esc(r.label)}</span></td><td class="mono">${r.fg} / ${r.bg}</td><td class="mono">${r.ratio.toFixed(2)}:1</td><td>${esc(r.level)} · 필요 ${r.min}:1</td><td class="verdict">${r.pass ? '✅ 통과' : '❌ 미달'}</td></tr>`
    )
    .join('');
  const html =
    `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>WEMB 테마 디자인 사양서</title>` +
    `<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@latest/dist/web/variable/pretendardvariable.min.css">` +
    `<style>` +
    `*{box-sizing:border-box}body{font-family:'Pretendard Variable',Pretendard,-apple-system,'Segoe UI','Malgun Gothic',sans-serif;color:#15151a;margin:0;padding:32px 34px;background:#fff;font-size:13px;line-height:1.5}` +
    `h1{font-size:22px;margin:0 0 2px}.meta{color:#6b7280;font-size:12.5px;margin-bottom:22px}` +
    `h2{font-size:14px;margin:26px 0 12px;padding-bottom:6px;border-bottom:2px solid #eef0f3}` +
    `.pal{display:grid;grid-template-columns:repeat(2,1fr);gap:10px 22px}` +
    `.sw{display:flex;align-items:center;gap:11px}.chip{width:34px;height:34px;border-radius:8px;border:1px solid rgba(0,0,0,.12);flex:none}` +
    `.swt b{display:block;font-size:12.5px}.swt code{font-family:Consolas,monospace;font-size:11.5px;color:#6b7280}.swt code span{color:#aab0ba;margin-left:6px}` +
    `table{width:100%;border-collapse:collapse;font-size:12px}th,td{text-align:left;padding:7px 8px;border-bottom:1px solid #eef0f3}th{color:#6b7280;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.3px}` +
    `td:first-child{display:flex;align-items:center;gap:9px}.aa{display:inline-flex;align-items:center;justify-content:center;width:26px;height:22px;border-radius:5px;font-weight:700;font-size:12px;flex:none}` +
    `.mono{font-family:Consolas,monospace;color:#4b5563}.verdict{font-weight:700}tr.fail .verdict{color:#dc2626}tr.pass .verdict{color:#16a34a}` +
    `.summary{margin:10px 0 0;padding:11px 14px;border-radius:9px;font-size:12.5px;font-weight:600;${fails ? 'background:#fef2f2;color:#b91c1c;border:1px solid #fecaca' : 'background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0'}}` +
    `.foot{margin-top:26px;color:#9aa0ac;font-size:11px;border-top:1px solid #eef0f3;padding-top:12px}` +
    `@media print{body{padding:14mm}h2{page-break-after:avoid}tr{page-break-inside:avoid}}` +
    `</style></head><body>` +
    `<h1>WEMB 테마 디자인 사양서</h1>` +
    `<div class="meta">${verLabel} · ${modeLabel} · 패널 모서리 ${exRadius()}px · 생성일 ${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}</div>` +
    `<h2>1. 색상 팔레트 (10 토큰)</h2><div class="pal">${pal}</div>` +
    `<h2>2. 명암 대비 검증 (WCAG)</h2>` +
    `<div class="summary">${fails ? `⚠ 대비 기준 미달 ${fails}곳 — 배포 전 보정 권장` : '✅ 모든 역할쌍이 대비 기준을 통과했습니다'}</div>` +
    `<table><thead><tr><th>역할쌍 (전경/배경)</th><th>색상값</th><th>대비비</th><th>기준</th><th>판정</th></tr></thead><tbody>${ct}</tbody></table>` +
    (entT
      ? `<h2>3. Enterprise 확장 토큰 (${Object.keys(EV).length})</h2><div class="pal">` +
        Object.keys(EV)
          .map((k) => `<div class="sw"><span class="chip" style="background:${entT[k]}"></span><div class="swt"><b>${esc(EV[k].replace(/^--/, ''))}</b><code>${esc(entT[k])}</code></div></div>`)
          .join('') +
        `</div>`
      : '') +
    `<div class="foot">WEMB Theme Studio 자동 생성 · 대비비는 WCAG 2.1 상대휘도 기준</div>` +
    `</body></html>`;
  const w = window.open('', '_blank');
  if (!w) {
    toast('팝업이 차단됐어요. 팝업을 허용한 뒤 다시 시도하세요.', { type: 'err' });
    return;
  }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => {
    try {
      w.print();
    } catch (e) {}
  }, 400);
  toast('사양서를 새 창에서 열었어요. 인쇄 창에서 “PDF로 저장”을 고르세요.', { type: 'ok', dur: 4600 });
}
document.getElementById('exSpec').onclick = exportSpecSheet;
