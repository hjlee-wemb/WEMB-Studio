const fs=require('fs');
let s=fs.readFileSync('mk-screen-css.js','utf8');
const a=`L('[data-name="Track"]{opacity:.9;}'),`;
if(!s.includes(a))throw new Error('anchor');
s=s.replace(a,a+`
  L('[data-name="Column/Labels"] [data-name="List"]{border-color:#c9d9e6!important;}'),
  L('[data-name="Column/Labels"] [data-name="List"]::after{border-color:#c9d9e6!important;}'),`);
fs.writeFileSync('mk-screen-css.js',s);
let r=fs.readFileSync('README.md','utf8');
r=r.trimEnd()+'\n\n## 라이트 아이콘 밝기(2026-11-05 사용자 지적 "아이콘들이 너무 어두워 보여")\n\n터빈 사본 범위를 밝은 청회색으로(mk-light-newbiz.js lo · hi), 편집 · 삭제 · 탭 · 시계 아이콘 색을 한 단계 밝게(FAM icon), 태양광 패널은 brightness 1.32, 2040 터빈 brightness .82. 탭의 진한 테두리 · 단추와 2040 칸의 회색 면도 옅게(mk-screen-css). 다크 규칙은 건드리지 않았다.\n';
fs.writeFileSync('README.md',r);
