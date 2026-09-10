/* ── 컴포넌트 시트(상태 갤러리) ── */

/* ============================================================
 *  컴포넌트 시트(상태 갤러리) — 선택 테마를 여러 UI에 적용해 보기
 * ============================================================ */
const CS_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
function componentSheetHTML() {
  /* 대시보드의 실제 히트맵(renderHeat)과 동일한 방식 — point-main 농도로 값 표현.
     칸 크기는 max-width로 제한해 넓은 span2 카드에서도 커지지 않게 함 */
  const HEAT_COLS = 12;
  const heat = Array.from({ length: 5 }, (_, r) => {
    const cells = Array.from({ length: HEAT_COLS }, (_, c) => {
      const v = ((Math.sin(r * 1.7 + c * 0.9) + 1) / 2) * 0.8 + (c / HEAT_COLS) * 0.2;
      const pct = Math.round(12 + v * 78);
      return `<span style="flex:1;aspect-ratio:1;min-width:14px;max-width:22px;border-radius:4px;background:color-mix(in srgb,var(--point-main) ${pct}%,transparent)"></span>`;
    }).join('');
    return `<div style="display:flex;gap:4px">${cells}</div>`;
  }).join('');
  return `
          <div class="cssection">화면에 있는 컴포넌트 <small>대시보드에서 실제로 쓰는 것들</small></div>

          <div class="cscard span2"><span class="cslbl">KPI 카드</span>
            <div class="csrow" style="gap:16px">
              <div class="cskpi"><div class="lab">거래건수</div><div class="val">55,045,697</div></div>
              <div class="cskpi"><div class="lab">청구 TPS / Peak</div><div class="val"><b>2,603</b> / 3,992</div></div>
            </div>
          </div>
          <div class="cscard"><span class="cslbl">패널 헤더 · 탭</span>
            <div class="cstabs"><span class="cstab on">tab01</span><span class="cstab">tab02</span><span class="cstab">tab03</span><span class="cstab">tab04</span></div>
            <div class="cstabs" style="margin-top:4px"><span class="cstab on">Overview</span><span class="cstab">Production</span><span class="cstab">Quality</span></div>
          </div>
          <div class="cscard"><span class="cslbl">라인 · 영역 차트</span>
            <svg viewBox="0 0 240 70" preserveAspectRatio="none" style="width:100%;height:54px">
              <polygon points="0,60 0,40 40,45 80,25 120,35 160,15 200,28 240,12 240,60" fill="var(--point-main)" opacity="0.16" />
              <polyline points="0,40 40,45 80,25 120,35 160,15 200,28 240,12" fill="none" stroke="var(--point-main)" stroke-width="2" />
              <polyline points="0,55 40,52 80,50 120,45 160,48 200,40 240,44" fill="none" stroke="var(--point-sub)" stroke-width="2" opacity="0.85" />
            </svg>
            <div style="display:flex;gap:16px;font-size:11px;color:var(--text-weak);margin-top:4px"><span><i class="csdot" style="width:8px;height:8px;border-radius:2px;background:var(--point-main)"></i> 금일</span><span><i class="csdot" style="width:8px;height:8px;border-radius:2px;background:var(--point-sub)"></i> PEAK 데이</span></div>
          </div>
          <div class="cscard"><span class="cslbl">도넛 차트</span>
            <div class="csrow" style="gap:16px;align-items:center">
              <div class="csgauge" style="background:conic-gradient(var(--point-main) 0 42%, var(--point-sub) 42% 68%, var(--warning) 68% 84%, var(--bg-accent) 84%)"><i>68%</i></div>
              <div style="font-size:11.5px;color:var(--text-weak);line-height:1.8">
                <div><i class="csdot" style="background:var(--point-main)"></i> 정상 42%</div>
                <div><i class="csdot" style="background:var(--point-sub)"></i> 처리 26%</div>
                <div><i class="csdot" style="background:var(--warning)"></i> 대기 16%</div>
              </div>
            </div>
          </div>
          <div class="cscard"><span class="cslbl">CPU 미니 게이지</span>
            <div class="csrow" style="gap:16px;text-align:center">
              <div style="font-size:11px;color:var(--text-weak)"><div class="csgauge" style="--v:24%;width:50px;height:50px;margin:0 auto 5px"><i style="width:36px;height:36px;font-size:11px">24%</i></div>상품</div>
              <div style="font-size:11px;color:var(--text-weak)"><div class="csgauge" style="--v:20%;width:50px;height:50px;margin:0 auto 5px"><i style="width:36px;height:36px;font-size:11px">20%</i></div>디지털</div>
              <div style="font-size:11px;color:var(--text-weak)"><div class="csgauge" style="--v:8%;width:50px;height:50px;margin:0 auto 5px"><i style="width:36px;height:36px;font-size:11px">8%</i></div>대외</div>
            </div>
          </div>
          <div class="cscard"><span class="cslbl">상태 히트맵</span>
            <div style="display:flex;flex-direction:column;gap:4px">${heat}</div>
            <div style="display:flex;align-items:center;gap:8px;font-size:11px;color:var(--text-weak);margin-top:8px"><span>낮음</span><span style="width:104px;height:9px;border-radius:5px;background:linear-gradient(90deg,color-mix(in srgb,var(--point-main) 12%,transparent),var(--point-main))"></span><span>높음</span></div>
          </div>
          <div class="cscard span2"><span class="cslbl">표 · 밴드형</span>
            <table class="cstable"><thead><tr><th>항목</th><th>1Q</th><th>상품처리</th></tr></thead><tbody>
              <tr><td>동시 사용자</td><td>10,906 <span class="v2">/ 18,328</span></td><td>2,425 <span class="v2">/ 3,992</span></td></tr>
              <tr><td>초당 처리량</td><td class="teal">1,868 <span class="v2">/ 4,063</span></td><td class="teal">665 <span class="v2">/ 1,775</span></td></tr>
              <tr><td>평균 수행시간</td><td>0.30 <span class="v2">/ 0.20</span></td><td>0.05 <span class="v2">/ 0.06</span></td></tr>
            </tbody></table>
          </div>
          <div class="cscard"><span class="cslbl">상태 표 · 카운트</span>
            <table class="cstable"><thead><tr><th>구분</th><th>Up</th><th>Down</th><th>Warn</th><th>Crit</th></tr></thead><tbody>
              <tr><td>Client</td><td>838</td><td>0</td><td style="color:var(--warning)">2</td><td>0</td></tr>
              <tr><td>Server</td><td>412</td><td style="color:var(--danger)">1</td><td style="color:var(--warning)">3</td><td style="color:var(--danger)">1</td></tr>
            </tbody></table>
          </div>
          <div class="cscard"><span class="cslbl">태그</span>
            <div class="csrow">
              <span class="cstag" style="background:color-mix(in srgb,var(--point-main) 18%,transparent);color:var(--point-main)">전자</span>
              <span class="cstag" style="background:color-mix(in srgb,var(--point-sub) 20%,transparent);color:var(--point-sub)">은행</span>
              <span class="cstag" style="background:color-mix(in srgb,var(--warning) 18%,transparent);color:var(--warning)">지연</span>
              <span class="cstag" style="background:var(--bg-accent);color:var(--text-weak)">기타</span>
            </div>
          </div>
          <div class="cscard"><span class="cslbl">네비게이션</span>
            <div style="display:flex;gap:18px;font-size:13px">
              <a style="color:var(--point-main);font-weight:700;border-bottom:2px solid var(--point-main);padding-bottom:5px">Overview</a>
              <a style="color:var(--text-weak);padding-bottom:5px">Production</a>
              <a style="color:var(--text-weak);padding-bottom:5px">Quality</a>
              <a style="color:var(--text-weak);padding-bottom:5px">Equipment</a>
            </div>
          </div>

          <div class="cssection">화면에 없는 컴포넌트 · 상태 <small>추측 — 앞으로 필요할 수 있는 것들</small></div>

          <div class="cscard"><span class="cslbl">버튼 · 상태</span>
            <div class="csrow"><button class="csbtn primary">기본</button><button class="csbtn sub">보조</button><button class="csbtn ghost">고스트</button><button class="csbtn danger">위험</button></div>
            <div class="csrow"><button class="csbtn primary csfocus">포커스</button><button class="csbtn primary" disabled>비활성</button><button class="csbtn primary" style="display:inline-flex;align-items:center;gap:7px"><span class="csspin" style="width:14px;height:14px;border-width:2px"></span>로딩</button></div>
            <span class="csmeta">기본 · hover(직접 올려보기) · 포커스 · 비활성 · 로딩</span>
          </div>
          <div class="cscard"><span class="cslbl">배지 · 상태칩</span>
            <div class="csrow"><span class="csbadge ok">정상</span><span class="csbadge info">정보</span><span class="csbadge warn">주의</span><span class="csbadge crit">경고</span><span class="csbadge" style="color:var(--text-weak);background:var(--bg-accent)">비활성</span></div>
            <div class="csrow" style="margin-top:2px"><span class="cstag" style="background:color-mix(in srgb,var(--point-sub) 18%,transparent);color:var(--point-sub)"><i class="csdot" style="width:7px;height:7px;background:var(--point-sub);margin-right:5px"></i>온라인</span><span class="cstag" style="background:var(--bg-accent);color:var(--text-weak)"><i class="csdot" style="width:7px;height:7px;background:var(--text-weak);margin-right:5px"></i>오프라인</span></div>
          </div>
          <div class="cscard"><span class="cslbl">입력 · 상태</span>
            <input class="csinput" placeholder="플레이스홀더" />
            <input class="csinput" value="입력된 값 12,345" />
            <input class="csinput csfocus" value="포커스됨" />
            <input class="csinput" value="비활성 필드" disabled />
            <input class="csinput" value="잘못된 값" style="border-color:var(--danger)" />
            <span style="font-size:11px;color:var(--danger)">필수 항목이에요</span>
          </div>
          <div class="cscard"><span class="cslbl">토글 · 선택</span>
            <div class="csrow"><span class="csswitch on cstoggle" role="switch" aria-checked="true"></span><span class="csswitch cstoggle" role="switch" aria-checked="false"></span><span class="csmeta">스위치 On / Off</span></div>
            <div class="csrow"><label class="cschkrow"><span class="cscheck on cstoggle">${CS_CHECK}</span>체크 On</label><label class="cschkrow"><span class="cscheck cstoggle">${CS_CHECK}</span>체크 Off</label><label class="cschkrow"><span class="cscheck on cstoggle" style="position:relative"><span style="position:absolute;left:4px;right:4px;top:50%;height:2px;background:var(--on-main);transform:translateY(-50%)"></span></span>부분 선택</label></div>
            <div class="csrow"><label class="cschkrow"><span class="cscheck round on cstoggle"></span>라디오 On</label><label class="cschkrow"><span class="cscheck round cstoggle"></span>라디오 Off</label></div>
          </div>
          <div class="cscard"><span class="cslbl">진행률</span>
            <div class="cstrack"><div class="csfill" style="width:72%"></div></div>
            <div class="cstrack"><div class="csfill" style="width:38%"></div></div>
            <div class="cstrack" style="overflow:hidden"><div class="csfill" style="width:45%;animation:csIndeterminate 1.3s ease-in-out infinite"></div></div>
            <span class="csmeta">확정 72% · 38% · 불확정(진행 중)</span>
          </div>
          <div class="cscard span2"><span class="cslbl">알림 배너</span>
            <div class="csalert info"><i></i>정보: 모든 시스템이 정상 작동 중입니다.</div>
            <div class="csalert" style="background:color-mix(in srgb,var(--point-sub) 13%,transparent);color:var(--text-strong)"><i style="background:var(--point-sub)"></i>완료: 배포가 성공적으로 끝났습니다.</div>
            <div class="csalert warn"><i></i>주의: 디스크 사용량이 85%를 초과했습니다.</div>
            <div class="csalert crit"><i></i>경고: SOMDB101 응답 지연이 감지되었습니다.</div>
          </div>
          <div class="cscard"><span class="cslbl">토스트 알림</span>
            <div style="display:flex;flex-direction:column;gap:8px">
              <div style="display:flex;align-items:center;gap:9px;background:var(--bg-accent);border:1px solid var(--line);border-radius:9px;padding:10px 12px;font-size:12.5px;color:var(--text-strong);box-shadow:0 6px 18px rgba(0,0,0,.28)"><i class="csdot" style="background:var(--point-sub)"></i>저장되었습니다<span style="margin-left:auto;color:var(--text-weak)">✕</span></div>
              <div style="display:flex;align-items:center;gap:9px;background:var(--bg-accent);border:1px solid color-mix(in srgb,var(--danger) 45%,var(--line));border-radius:9px;padding:10px 12px;font-size:12.5px;color:var(--text-strong)"><i class="csdot" style="background:var(--danger)"></i>연결이 끊겼습니다<span style="margin-left:auto;color:var(--point-main);font-weight:600">다시 시도</span></div>
            </div>
          </div>
          <div class="cscard"><span class="cslbl">툴팁</span>
            <div style="display:flex;justify-content:center;padding:16px 0 10px">
              <div style="position:relative;background:var(--text-strong);color:var(--bg-page);font-size:12px;font-weight:500;padding:6px 11px;border-radius:7px">자세한 설명이 여기 표시돼요<span style="position:absolute;top:100%;left:50%;transform:translateX(-50%);border:6px solid transparent;border-top-color:var(--text-strong)"></span></div>
            </div>
          </div>
          <div class="cscard"><span class="cslbl">드롭다운 (열림)</span>
            <div style="border:1px solid var(--line);border-radius:9px;overflow:hidden;background:var(--bg-surface)">
              <div style="padding:9px 12px;font-size:12.5px;color:var(--point-main);background:color-mix(in srgb,var(--point-main) 14%,transparent)">✓ 선택된 항목</div>
              <div style="padding:9px 12px;font-size:12.5px;color:var(--text-strong);border-top:1px solid var(--line)">두 번째 항목</div>
              <div style="padding:9px 12px;font-size:12.5px;color:var(--text-weak);border-top:1px solid var(--line)">비활성 항목</div>
            </div>
          </div>
          <div class="cscard"><span class="cslbl">페이지네이션</span>
            <div class="csrow" style="gap:5px">
              <span class="cstag" style="min-width:28px;background:var(--bg-accent);color:var(--text-weak)">‹</span>
              <span class="cstag" style="min-width:28px;background:var(--point-main);color:var(--on-main)">1</span>
              <span class="cstag" style="min-width:28px;background:var(--bg-accent);color:var(--text-strong)">2</span>
              <span class="cstag" style="min-width:28px;background:var(--bg-accent);color:var(--text-strong)">3</span>
              <span class="cstag" style="min-width:28px;background:var(--bg-accent);color:var(--text-weak)">›</span>
            </div>
          </div>
          <div class="cscard"><span class="cslbl">스피너 · 로딩</span>
            <div class="csrow" style="align-items:center;gap:14px"><span class="csspin"></span><span class="csspin" style="width:18px;height:18px;border-width:2px"></span><span style="font-size:12px;color:var(--text-weak)">불러오는 중…</span></div>
          </div>
          <div class="cscard"><span class="cslbl">빈 상태</span>
            <div class="csempty"><div class="eic">◎</div><div class="et">표시할 데이터가 없어요</div><div class="es">필터를 바꾸거나 기간을 넓혀보세요</div><button class="csbtn ghost">새로고침</button></div>
          </div>
          <div class="cscard"><span class="cslbl">에러 상태</span>
            <div class="csempty"><div class="eic" style="color:var(--danger)">⚠</div><div class="et">불러오지 못했어요</div><div class="es">네트워크 오류 (503) · 잠시 후 다시 시도하세요</div><button class="csbtn ghost">다시 시도</button></div>
          </div>
          <div class="cscard"><span class="cslbl">로딩 스켈레톤</span>
            <div class="csskel" style="width:70%"></div>
            <div class="csskel" style="width:100%"></div>
            <div class="csskel" style="width:45%"></div>
            <span class="csmeta">데이터를 불러오는 중 표시되는 자리표시자</span>
          </div>
          <div class="cscard"><span class="cslbl">키보드 포커스</span>
            <div class="csrow"><button class="csbtn primary csfocus">포커스된 버튼</button><input class="csinput csfocus" value="포커스된 입력" style="max-width:170px" /></div>
            <span class="csmeta">키보드 이동 시 나타나는 포커스 링</span>
          </div>`;
}
function renderSheet() {
  const theme = abResolve(document.getElementById('csSel').value);
  const hex = themeCoreMap(theme);
  const sheet = document.getElementById('csSheet');
  sheet.className = 'cssheet';
  sheet.setAttribute('data-mode', theme.mode);
  for (const k in RV) sheet.style.setProperty(RV[k], hex[k]);
  sheet.style.setProperty('--radius-panel', (theme.radius != null ? theme.radius : 8) + 'px');
  /* 색면 위 글자색을 실제 대비로 검증해 지정 — point-sub·warning은 팔레트가 흰 글자 대비를
     보장하지 않으므로 하드코딩 대신 각 색의 명도에 맞는 읽기 쉬운 색을 계산 */
  sheet.style.setProperty('--on-main', contrast(hex['point/main']));
  sheet.style.setProperty('--on-sub', contrast(hex['point/sub']));
  sheet.style.setProperty('--on-warn', contrast(hex['warning']));
  sheet.style.setProperty('--on-danger', contrast(hex['danger']));
  sheet.innerHTML = componentSheetHTML();
}
/* 앱 스타일 전체를 문서 순서대로 모은다 — 자립형 HTML 내보내기가 이 문자열을 통째로 박아 넣는다.
   인라인 <style> 과 파일로 분리한 앱 스타일시트(<link data-app-css>)를 함께 읽는다.
   링크 쪽은 CSSOM 에서 읽으므로 http(s) 로 열었을 때만 채워진다(file:// 은 브라우저가 막는다). */
function collectAppCss() {
  return [...document.querySelectorAll('style, link[rel="stylesheet"][data-app-css]')]
    .map((el) => {
      if (el.tagName === 'STYLE') return el.textContent;
      try { return [...el.sheet.cssRules].map((r) => r.cssText).join('\n'); } catch (e) { return ''; }
    })
    .join('\n');
}

/* ===== 내보내기(B) — 검증 보드를 자립형 HTML로 저장 ===== */
function componentSheetExportHTML() {
  const css = collectAppCss();
  const sheet = document.getElementById('csSheet');
  const mode = sheet.getAttribute('data-mode') || 'dark';
  const themeName = document.getElementById('csSel').selectedOptions[0].textContent.trim().replace(/^●\s*/, '');
  const date = new Date().toLocaleString('ko-KR');
  const body = sheet.outerHTML;
  return `<!doctype html>
<html lang="ko" data-mode="${mode}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>WEMB 컴포넌트 시트 — ${themeName}</title>
    <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@latest/dist/web/variable/pretendardvariable.min.css" />
    <style>${css}</style>
    <style>
      html, body { height: auto; overflow: auto; background: #0f1320; color: #e7ecf5; margin: 0; padding: 26px; }
      .exwrap { max-width: 1080px; margin: 0 auto; }
      .exhd { display: flex; align-items: baseline; gap: 10px; margin-bottom: 16px; color: #fff; flex-wrap: wrap; }
      .exhd h1 { font-size: 18px; margin: 0; font-weight: 700; }
      .exhd .sub { font-size: 12.5px; color: rgba(255, 255, 255, 0.55); }
    </style>
  </head>
  <body>
    <div class="exwrap">
      <div class="exhd"><h1>WEMB 컴포넌트 갤러리</h1><span class="sub">테마: ${themeName} · 내보낸 시각 ${date}</span></div>
      ${body}
    </div>
  </body>
</html>`;
}
function exportSheet() {
  const name =
    document
      .getElementById('csSel')
      .selectedOptions[0].textContent.trim()
      .replace(/^●\s*/, '')
      .replace(/[^\w가-힣-]+/g, '_') || 'theme';
  downloadBlob(new Blob([componentSheetExportHTML()], { type: 'text/html;charset=utf-8' }), `wemb-components-${name}.html`);
}

function openSheet() {
  refreshAuditSelects();
  document.getElementById('csSel').value = '__current__';
  renderSheet();
  document.getElementById('csModal').classList.add('show');
}
function closeSheet() {
  document.getElementById('csModal').classList.remove('show');
}
function initSheet() {
  document.getElementById('sheetOpen').onclick = openSheet;
  document.getElementById('csClose').onclick = closeSheet;
  document.getElementById('csExport').onclick = exportSheet;
  document.getElementById('csSel').onchange = renderSheet;
  document.getElementById('csModal').addEventListener('click', (e) => {
    if (e.target.id === 'csModal') closeSheet();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.getElementById('csModal').classList.contains('show')) closeSheet();
  });
  /* 토글·체크·라디오는 클릭해 상태를 바꿔볼 수 있게 (상태 갤러리) */
  document.getElementById('csSheet').addEventListener('click', (e) => {
    const t = e.target.closest('.cstoggle');
    if (!t) return;
    if (t.classList.contains('csswitch')) {
      t.classList.toggle('on');
      t.setAttribute('aria-checked', t.classList.contains('on'));
    } else if (t.classList.contains('cscheck')) {
      if (t.classList.contains('round')) {
        const row = t.closest('.csrow');
        if (row) row.querySelectorAll('.cscheck.round').forEach((x) => x.classList.remove('on'));
        t.classList.add('on');
      } else {
        t.classList.toggle('on');
      }
    }
  });
}
