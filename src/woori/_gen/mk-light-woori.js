/* 라이트 그림 사본을 파일마다 정한 색으로 다시 만든다(자동 반전 mk-light-assets.js 뒤에 돌린다).
   판은 흰색, 선은 옅은 하늘 회색, 아이콘은 짙은 파랑. 형상은 한 점도 안 건드린다.
   상태 표지 · 라디오 칩은 색이 곧 뜻이라 사본을 만들지 않는다(원본 그대로).
   실행: node mk-light-woori.js */
'use strict';
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '..');
const MAP = {
  'base.svg': { '#11171F': '#FFFFFF' },
  'base-1.svg': { '#132755': '#DCE9F3' },
  'bottom-line.svg': { '#B3BBD0': '#9DB5C9' },
  'bar-mark.svg': { '#647DA5': '#7D97BA' },
  'slash-mark.svg': { '#647DA5': '#7D97BA' },
  'dots-left.svg': { '#90A8B6': '#7F98AA' },
  'dots-right.svg': { '#90A8B6': '#7F98AA' },
  'dots.svg': { '#60D6FD': '#2F9FCF' },
  'bracket-left.svg': { '#9099A2': '#A9B9C5', white: '#5D7A8F' },
  'bracket-right.svg': { '#9099A2': '#A9B9C5', white: '#5D7A8F' },
  'connector-eai-to-expert-systems.svg': { '#9099A2': '#A9B9C5', white: '#5D7A8F' },
  'divider.svg': { '#12616E': '#B4CDDC' },
  'divider-1.svg': { '#60D6FD': '#2F9FCF', '#3D7BAC': '#B4CDDC' },
  'divider-1-2.svg': { '#60D6FD': '#2F9FCF', '#3D7BAC': '#B4CDDC' },
  'divider-2.svg': { '#447E9F': '#9DBFD2' },
  'divider-2-2.svg': { '#214462': '#C5D9E6' },
  'marker-2.svg': { '#080825': '#FFFFFF' },
  'marker-3.svg': { '#60D6FD': '#2F9FCF' },
  'icon-action-user.svg': { '#7CAFE6': '#2B6EA8' },
  'icon-action-logout.svg': { '#7CAFE6': '#2B6EA8' },
  'icon-action-refresh.svg': { '#60D6FD': '#1F8FC0' },
  'input.svg': { '#030517': '#FFFFFF', '#2A7CA0': '#B7D0E0' },
  'input-3.svg': { '#030517': '#FFFFFF', '#2A7CA0': '#B7D0E0' },
  'background-1.svg': { '#0D0F2D': '#FFFFFF', '#7C7C7C': '#D5E2EC', '#EBEBEB': '#D5E2EC' },
  'glow.svg': { '#052844': '#EAF3F9', '#35635C': '#A9C6C0' },
  'glow-2.svg': { white: '#9DB8CC', '#7786AC': '#B8C8DA' },
  'pin-top.svg': { white: '#2F7F9C' }, 'pin-top-1.svg': { white: '#2F7F9C' }, 'pin-bottom.svg': { white: '#2F7F9C' }, 'pin-bottom-1.svg': { white: '#2F7F9C' },
};
/* 원본 그대로 둘 것 */
const KEEP = /^(marker-(critical|major|minor|warning|normal)|elmarker-\d|marker-[145]|marker|radio(-\d)?|indicator|core|icon-action-expand)\.svg$/;
const mapPath = path.join(__dirname, 'light-assets.json');
const assets = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
let made = 0, dropped = 0;
Object.keys(assets).forEach((f) => {
  if (!KEEP.test(f)) return;
  const lt = path.join(DIR, assets[f]);
  if (fs.existsSync(lt)) fs.unlinkSync(lt);
  delete assets[f];
  dropped++;
});
Object.keys(MAP).forEach((f) => {
  const src = path.join(DIR, f);
  if (!fs.existsSync(src)) return;
  let s = fs.readFileSync(src, 'utf8');
  const m = MAP[f];
  Object.keys(m).forEach((c) => {
    if (c === 'white') s = s.replace(/(stop-color|fill|stroke)="white"/g, (a, pr) => pr + '="' + m[c] + '"');
    else s = s.split(c).join(m[c]);
  });
  const out = f.replace(/\.svg$/, '-lt.svg');
  fs.writeFileSync(path.join(DIR, out), s);
  assets[f] = out;
  made++;
});
fs.writeFileSync(mapPath, JSON.stringify(assets, null, 1));
console.log('라이트 사본 다시 만듦', made, '· 원본 유지', dropped, '· 합계', Object.keys(assets).length);
