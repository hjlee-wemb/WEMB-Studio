/* ── 대비비 검증표 · 자동 보정 ── */

/* 검증·시트 모달의 테마 선택 목록(현재 테마 + 저장 스냅샷) 채우기 */
function refreshAuditSelects() {
  ['ctSel', 'csSel'].forEach((id) => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const prev = sel.value;
    const opts = abThemeList();
    sel.innerHTML = opts.map((o) => `<option value="${o.id}">${o.name}</option>`).join('');
    if (opts.some((o) => o.id === prev)) sel.value = prev;
  });
}

/* ============================================================
 *  대비비 검증표 (Contrast Audit) — 역할쌍 대비비 + AA/AAA 통과
 * ============================================================ */
/* [전경, 배경, 라벨, 필요등급 라벨, 필요 대비비] — 용도에 맞는 WCAG 기준으로 단일 판정 */
const CONTRAST_PAIRS = [
  ['text/strong', 'bg/page', '본문 텍스트 ↔ 페이지 배경', 'AAA 본문', 7],
  ['text/strong', 'bg/surface', '본문 텍스트 ↔ 표면', 'AAA 본문', 7],
  ['text/weak', 'bg/page', '보조 텍스트 ↔ 페이지 배경', 'AA 본문', 4.5],
  ['text/weak', 'bg/surface', '보조 텍스트 ↔ 표면', 'AA 본문', 4.5],
  ['point/main', 'bg/page', '강조1(작은 글씨) ↔ 페이지 배경', 'AA 본문', 4.5],
  ['point/main', 'bg/surface', '강조1(작은 글씨) ↔ 표면', 'AA 본문', 4.5],
  ['point/sub', 'bg/surface', '강조2(작은 글씨) ↔ 표면', 'AA 본문', 4.5],
  ['danger', 'bg/surface', '경고색(작은 글씨) ↔ 표면', 'AA 본문', 4.5],
  ['warning', 'bg/surface', '주의색(작은 글씨) ↔ 표면', 'AA 본문', 4.5],
  ['__auto__', 'point/main', '칩·버튼 글자(자동 선택) ↔ 강조1', 'AA 본문', 4.5],
  ['__auto__', 'danger', '칩·버튼 글자(자동 선택) ↔ 경고', 'AA 본문', 4.5],
];
function resolveColor(v, hex) {
  return v.charAt(0) === '#' ? v.toUpperCase() : hex[v];
}
function contrastRows(theme) {
  const hex = themeCoreMap(theme);
  return CONTRAST_PAIRS.map(([fgK, bgK, label, level, min]) => {
    const bg = resolveColor(bgK, hex);
    /* '__auto__' = 그 배경 위에 실제로 쓰는 자동 선택 글자색(흰/검 중 대비 높은 쪽) */
    const fg = fgK === '__auto__' ? contrast(bg).toUpperCase() : resolveColor(fgK, hex);
    const ratio = wcagRatio(fg, bg);
    /* 보정 대상 역할: 전경이 색역할이면 전경, 리터럴·자동이면 배경(=강조/경고색) */
    const adjRole = fgK === '__auto__' || fgK.charAt(0) === '#' ? bgK : fgK;
    return { label, level, min, fg, bg, ratio, pass: ratio >= min, adjRole };
  });
}
function renderContrast(highlightRoles) {
  /* 미달 행을 눌러 색을 고치러 갈 수 있는 건 '지금 팔레트'를 볼 때뿐이다.
     A/B 스냅샷을 고른 상태면 표에 뜬 색이 사이드바의 색과 다른 색이라,
     그대로 데려가면 엉뚱한 색을 고치게 된다 → 그땐 이동을 막고 이유를 알려 준다. */
  const isCurrent = document.getElementById('ctSel').value === '__current__';
  const rows = contrastRows(abResolve(document.getElementById('ctSel').value));
  const verdict = (r) => (r.pass ? '<span class="ctbadge ctpass">통과</span>' : '<span class="ctbadge ctfail">미달</span>');
  const body = rows
    .map((r) => {
      const cls = [];
      if (highlightRoles && highlightRoles.has(r.adjRole)) cls.push('ctflash');
      const jump = !r.pass && isCurrent && CURPAL_KEYS.has(r.adjRole);
      if (jump) cls.push('ctjump');
      const attrs =
        (cls.length ? ` class="${cls.join(' ')}"` : '') +
        (jump
          ? ` data-role="${r.adjRole}" tabindex="0" role="button" title="누르면 ‘${ROLE_LABEL[r.adjRole] || r.adjRole}’ 색을 고칠 수 있는 자리로 이동해요"`
          : !r.pass && !isCurrent
            ? ' title="저장된 스냅샷의 색이라 여기서 바로 고칠 수 없어요. ‘지금 팔레트’를 선택하면 이동할 수 있어요."'
            : '');
      return `<tr${attrs}><td><div class="ctpair"><span class="ctsw" style="background:${r.bg};color:${r.fg}">Aa</span><span class="ctlabel">${r.label}<small>${r.fg} / ${r.bg}</small></span></div></td><td><span class="ctratio">${r.ratio.toFixed(2)}:1</span></td><td>${r.level}<small style="display:block;color:rgba(255,255,255,.4);font-size:10.5px">필요 ${r.min}:1</small></td><td>${verdict(r)}</td></tr>`;
    })
    .join('');
  document.getElementById('ctTable').innerHTML = `<thead><tr><th>역할쌍 (전경 / 배경)</th><th>대비비</th><th>필요 기준</th><th>판정</th></tr></thead><tbody>${body}</tbody>`;
  /* 미달 수정 바 갱신 */
  const fails = rows.filter((r) => !r.pass).length;
  const bar = document.getElementById('ctFixBar');
  const msg = document.getElementById('ctFixMsg');
  if (fails > 0) {
    bar.className = 'ctfixbar has-fail';
    msg.innerHTML = `대비 기준에 <b>${fails}개</b> 항목이 미달입니다. 직접 지정한 색을 같은 색상(명도만)으로 조정해 통과시킬 수 있어요.`;
  } else {
    bar.className = 'ctfixbar all-ok';
    msg.textContent = '모든 역할쌍이 기준을 통과했어요 ✓';
  }
}
/* 미달난 역할쌍의 색만 명도 조정해 통과시키는 보정값(override) 계산 */
/* [역할, 배경역할들, 배경 최소대비, 흰글자 최소대비(0이면 미적용)] — 검증표의 필요 기준과 일치 */
const FIX_ROLES = [
  ['text/strong', ['bg/page', 'bg/surface'], 7, 0],
  ['text/weak', ['bg/page', 'bg/surface'], 4.5, 0],
  ['point/main', ['bg/page', 'bg/surface'], 4.5, 4.5],
  ['point/sub', ['bg/surface'], 4.5, 0],
  ['danger', ['bg/surface'], 4.5, 4.5],
  ['warning', ['bg/surface'], 4.5, 0],
];
const ROLE_LABEL = {};
AB_ROLES.forEach(([k, l]) => (ROLE_LABEL[k] = l));
function fixThemeContrast(theme) {
  const hex = themeCoreMap(theme);
  const ov = Object.assign({}, theme.overrides || {});
  const changes = [];
  FIX_ROLES.forEach(([role, bgRoles, bgMin, textMin]) => {
    const bgs = bgRoles.map((b) => hex[b]);
    const cur = hex[role];
    /* 글자 기준은 흰색 고정이 아닌 '자동 선택 글자색'(흰/검 중 대비 높은 쪽) — 검증표와 동일 */
    const worst = (c) => {
      const arr = bgs.map((b) => wcagRatio(c, b));
      if (textMin) arr.push(bestTextRatio(c));
      return Math.min(...arr);
    };
    const okNow = bgs.every((b) => wcagRatio(cur, b) >= bgMin) && (!textMin || bestTextRatio(cur) >= textMin);
    if (okNow) return;
    const fixed = fixContrastLightness(cur, bgs, bgMin, textMin).toUpperCase();
    ov[role] = fixed;
    changes.push({ role, from: cur.toUpperCase(), to: fixed, ratioBefore: worst(cur), ratioAfter: worst(fixed), min: bgMin });
  });
  return { overrides: ov, changes };
}
/* 수정 내역(무엇이·어떻게 바뀌었는지)을 카드로 표시 */
function renderChanges(changes) {
  const box = document.getElementById('ctChanges');
  if (!changes || !changes.length) {
    box.className = 'ctchanges';
    box.innerHTML = '';
    return;
  }
  const rows = changes
    .map((c) => {
      const lbl = ROLE_LABEL[c.role] || c.role;
      return `<div class="ctchange"><span class="ccrole">${lbl}</span><span class="ccsw" style="background:${c.from}"></span><code>${c.from}</code><span class="ccarrow">→</span><span class="ccsw" style="background:${c.to}"></span><code>${c.to}</code><span class="ccratio"><b>${c.ratioBefore.toFixed(2)}</b> → <b class="ok">${c.ratioAfter.toFixed(2)}</b> (필요 ${c.min})</span></div>`;
    })
    .join('');
  box.className = 'ctchanges show';
  box.innerHTML = `<div class="cchead">수정 내역 — ${changes.length}개 색 보정<span>색상·채도는 유지하고 명도(밝기)만 조정해 기준을 통과시켰어요. 대시보드에 즉시 반영됩니다.</span></div>${rows}`;
}
function applyContrastFix() {
  const id = document.getElementById('ctSel').value;
  if (id === '__current__') {
    const r = fixThemeContrast(captureTheme());
    if (!r.changes.length) {
      ctHintMsg('이미 모든 항목이 통과예요.', 'ok');
      return;
    }
    state.overrides = r.overrides;
    apply();
    commitHistory();
    renderContrast(new Set(r.changes.map((c) => c.role)));
    renderChanges(r.changes);
    ctHintMsg(`${r.changes.length}개 색을 보정했어요 — 대시보드에 바로 반영됐어요(되돌리기로 취소 가능).`, 'ok');
  } else {
    const snap = snapshots.find((s) => s.id === id);
    if (!snap) return;
    const r = fixThemeContrast(snap.theme);
    if (!r.changes.length) {
      ctHintMsg('이미 모든 항목이 통과예요.', 'ok');
      return;
    }
    snap.theme.overrides = r.overrides;
    saveSnapshots();
    renderSnapshots();
    refreshABOptions();
    renderContrast(new Set(r.changes.map((c) => c.role)));
    renderChanges(r.changes);
    ctHintMsg(`${r.changes.length}개 색을 보정해 스냅샷 “${snap.name}”에 저장했어요.`, 'ok');
  }
}
function contrastMarkdown() {
  const rows = contrastRows(abResolve(document.getElementById('ctSel').value));
  let md = '| 역할쌍 | 전경 | 배경 | 대비비 | 필요 기준 | 판정 |\n|---|---|---|---|---|:---:|\n';
  rows.forEach((r) => (md += `| ${r.label} | \`${r.fg}\` | \`${r.bg}\` | ${r.ratio.toFixed(2)}:1 | ${r.level} (${r.min}:1) | ${r.pass ? '✅ 통과' : '❌ 미달'} |\n`));
  return md;
}
function contrastCSV() {
  const rows = contrastRows(abResolve(document.getElementById('ctSel').value));
  let csv = '역할쌍,전경,배경,대비비,필요기준,필요대비비,판정\n';
  rows.forEach((r) => (csv += `"${r.label}",${r.fg},${r.bg},${r.ratio.toFixed(2)}:1,"${r.level}",${r.min}:1,${r.pass ? 'PASS' : 'FAIL'}\n`));
  return csv;
}
function ctHintMsg(msg, cls) {
  const h = document.getElementById('ctHint');
  h.textContent = msg;
  h.className = 'exhint' + (cls ? ' ' + cls : '');
}
function openContrast() {
  refreshAuditSelects();
  document.getElementById('ctSel').value = '__current__';
  const p = document.getElementById('ctModal');
  renderContrast();
  renderChanges(null);
  ctHintMsg('미달 행을 누르면 그 색을 고치는 자리로 이동해요. 한 번에 고치려면 ‘미달 수정’을 쓰세요.');
  p.classList.add('show');
}
function closeContrast() {
  document.getElementById('ctModal').classList.remove('show');
}
/* 미달 행 → 그 색을 고칠 수 있는 자리로 이동.
   검증표는 딤 배경을 깐 모달이라 뒤 사이드바가 안 보인다 → 먼저 닫고 움직인다.
   가는 길에 접혀 있을 수 있는 게 둘(사이드바 자체, '개별 색상' 아코디언)이라 순서대로 편다.
   아코디언은 클래스를 직접 건드리지 않고 기존 토글을 눌러 state.curpalOpen까지 함께 맞춘다. */
function clearRoleNote() {
  noteRole = null;
  clearTimeout(noteDoneTimer);
  const n = curpalEl.querySelector('.swnote');
  if (n) n.remove();
}
/* 이동만으로는 '뭐가 왜 미달인지'를 알 수 없다 — 그 색이 걸린 검사들을 칩 바로 아래에
   숫자로 펼쳐 둔다. 한 역할이 여러 검사에 걸리므로(강조1은 3개) 통과분까지 같이 보여야
   '무엇을 건드리면 무엇이 깨지는지'가 보인다. */
function renderRoleNote() {
  const old = curpalEl.querySelector('.swnote');
  if (!noteRole) {
    if (old) old.remove();
    return;
  }
  const chip = curpalEl.querySelector(`.swhex[data-k="${CSS.escape(noteRole)}"]`);
  if (!chip) {
    if (old) old.remove();
    return;
  }
  let rows;
  try {
    rows = contrastRows(captureTheme()).filter((r) => r.adjRole === noteRole);
  } catch (e) {
    return;
  }
  if (!rows.length) {
    if (old) old.remove();
    return;
  }
  const allPass = rows.every((r) => r.pass);
  const label = ROLE_LABEL[noteRole] || noteRole;
  const body =
    `<div class="snhead"><span>‘${label}’ 색이 걸린 검사</span>` +
    `<button type="button" class="snx" aria-label="안내 닫기" title="닫기">✕</button></div>` +
    rows
      .map(
        (r) =>
          `<div class="snrow ${r.pass ? 'pass' : 'fail'}"><span class="snmk">${r.pass ? '✓' : '✕'}</span>` +
          `<span class="snlb">${r.label}</span>` +
          `<span class="snnum">${r.ratio.toFixed(2)}<small> / ${r.min}</small></span></div>`
      )
      .join('') +
    `<div class="sntip">${allPass ? '이제 기준을 모두 넘겼어요 ✓' : '색을 바꾸면 숫자가 바로 따라옵니다. 같은 색상에서 밝기만 조절해 보세요.'}</div>`;
  let note = old;
  if (!note) {
    note = document.createElement('div');
    note.className = 'swnote';
    note.setAttribute('role', 'status');
    chip.insertAdjacentElement('afterend', note);
  } else if (note.previousElementSibling !== chip) {
    chip.insertAdjacentElement('afterend', note);
  }
  note.classList.toggle('done', allPass);
  note.innerHTML = body;
  note.querySelector('.snx').onclick = clearRoleNote;
  /* 통과로 바뀌면 결과를 잠깐 보여 준 뒤 스스로 물러난다 — 계속 붙어 있으면 잔소리가 된다 */
  clearTimeout(noteDoneTimer);
  if (allPass) noteDoneTimer = setTimeout(clearRoleNote, 4000);
}
function jumpToRoleChip(role) {
  closeContrast();
  document.getElementById('app').classList.remove('collapsed');
  const toggle = curpalEl.querySelector('.cptoggle');
  if (toggle && !state.curpalOpen) toggle.click();
  const chip = curpalEl.querySelector(`.swhex[data-k="${CSS.escape(role)}"]`);
  if (!chip) return;
  /* 도착지 안내 카드 — 스크롤 위치를 잡기 전에 먼저 넣어야 카드까지 포함해 가운데로 온다 */
  noteRole = role;
  renderRoleNote();
  /* 스포트라이트 — 나머지 색칸을 잠깐 물려 눈이 목표에 꽂히게 */
  const box = curpalEl.querySelector('.swhexes');
  if (box) {
    box.classList.add('spot');
    setTimeout(() => box.classList.remove('spot'), 1800);
  }
  /* 여기서 requestAnimationFrame을 쓰면 안 된다 — 탭이 백그라운드거나 창이 가려져
     프레임을 안 그리는 동안엔 콜백이 아예 실행되지 않아 이동이 통째로 무산된다.
     아코디언은 hidden 속성만 떼는 동기 처리라 레이아웃은 지금 바로 읽을 수 있다. */
  chip.classList.remove('swfocus');
  void chip.offsetWidth; /* 같은 행을 연달아 눌러도 애니메이션이 다시 돌게 리플로우 */
  chip.classList.add('swfocus');
  setTimeout(() => chip.classList.remove('swfocus'), 2400);
  /* 스크롤도 직접 계산해서 옮긴다. scrollIntoView({behavior:'smooth'})는 프레임이
     있어야 움직여서, 프레임이 없으면 위치가 그대로 남는다. 목표 위치를 먼저 확정해
     두고 부드러운 이동은 그 위에 얹는다(모션 최소화 설정이면 즉시 이동). */
  const sb = chip.closest('.sidebar');
  if (sb) {
    /* 칩 하나가 아니라 '칩 + 안내 카드'를 한 덩어리로 보고 가운데 맞춘다 —
       칩만 기준으로 잡으면 정작 읽어야 할 카드가 화면 아래로 밀린다. */
    const note = curpalEl.querySelector('.swnote');
    const groupH = chip.offsetHeight + (note ? note.offsetHeight + 6 : 0);
    const top = Math.max(0, Math.min(sb.scrollHeight - sb.clientHeight, sb.scrollTop + chip.getBoundingClientRect().top - sb.getBoundingClientRect().top - (sb.clientHeight - groupH) / 2));
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    sb.scrollTop = top; /* 확정 위치 — 프레임이 없어도 반드시 도달 */
    if (smooth) sb.scrollTo({ top, behavior: 'smooth' });
  }
  /* 바로 고칠 수 있게 색상 코드 입력칸에 커서를 두고 전체 선택 */
  const hx = chip.querySelector('.hx');
  if (hx) {
    hx.focus({ preventScroll: true });
    hx.select();
  }
}
function initContrast() {
  document.getElementById('contrastOpen').onclick = openContrast;
  document.getElementById('ctClose').onclick = closeContrast;
  document.getElementById('ctSel').onchange = () => {
    renderContrast();
    renderChanges(null);
  };
  document.getElementById('ctModal').addEventListener('click', (e) => {
    if (e.target.id === 'ctModal') closeContrast();
  });
  /* 미달 행 클릭/키보드 → 해당 색으로 이동. 표는 매번 새로 그려지므로 위임으로 건다.
     복사 버튼 같은 행 안의 다른 조작이 생겨도 삼키지 않도록 버튼·입력은 통과시킨다. */
  const ctTable = document.getElementById('ctTable');
  ctTable.addEventListener('click', (e) => {
    if (e.target.closest('button, input, a, select')) return;
    const tr = e.target.closest('tr.ctjump');
    if (tr) jumpToRoleChip(tr.dataset.role);
  });
  ctTable.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const tr = e.target.closest('tr.ctjump');
    if (!tr) return;
    e.preventDefault(); /* Space가 모달을 스크롤시키지 않게 */
    jumpToRoleChip(tr.dataset.role);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.getElementById('ctModal').classList.contains('show')) closeContrast();
  });
  document.getElementById('ctMd').onclick = async () => {
    try {
      await navigator.clipboard.writeText(contrastMarkdown());
      ctHintMsg('Markdown 표를 복사했어요. 설계서·Notion·Confluence에 그대로 붙여넣으세요.', 'ok');
    } catch (e) {
      ctHintMsg('복사 권한이 없어요.', 'err');
    }
  };
  document.getElementById('ctCsv').onclick = () => {
    downloadBlob(new Blob(['﻿' + contrastCSV()], { type: 'text/csv;charset=utf-8' }), 'wemb-contrast.csv');
    ctHintMsg('CSV 파일을 저장했어요(스프레드시트에서 열 수 있어요).', 'ok');
  };
  document.getElementById('ctFix').onclick = applyContrastFix;
}
