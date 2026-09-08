/* conv.js 의 Tailwind→CSS 번역표에 이 파일에서만 나오는 유틸리티를 더한다.
   네트워크 화면의 아이소메트릭 카드가 rotate-30 / skew-x-30 / scale-y-87 조합으로 그려져 있고,
   클라우드 스테이지의 격자가 mix-blend-color-burn / saturation 을 쓴다. 근사 없이 1:1 로 옮긴다. */
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(F, 'utf8');

const anchor = "      case 'rotate-90': tr.push('rotate(90deg)'); continue;";
if (s.indexOf(anchor) < 0) { console.error('anchor not found'); process.exit(1); }
const add = [
  anchor,
  "      case 'rotate-30': tr.push('rotate(30deg)'); continue;",
  "      case '-rotate-30': tr.push('rotate(-30deg)'); continue;",
  "      case 'rotate-45': tr.push('rotate(45deg)'); continue;",
  "      case '-rotate-45': tr.push('rotate(-45deg)'); continue;",
  "      case 'skew-x-30': tr.push('skewX(30deg)'); continue;",
  "      case '-skew-x-30': tr.push('skewX(-30deg)'); continue;",
  "      case 'skew-y-30': tr.push('skewY(30deg)'); continue;",
  "      case '-skew-y-30': tr.push('skewY(-30deg)'); continue;",
  "      case 'scale-y-87': tr.push('scaleY(0.87)'); continue;",
].join('\n');
s = s.replace(anchor, add);

const anchor2 = "      case 'mix-blend-screen': set('mix-blend-mode', 'screen'); continue;";
s = s.replace(anchor2, [
  anchor2,
  "      case 'mix-blend-color-burn': set('mix-blend-mode', 'color-burn'); continue;",
  "      case 'mix-blend-saturation': set('mix-blend-mode', 'saturation'); continue;",
  "      case 'mix-blend-color': set('mix-blend-mode', 'color'); continue;",
  "      case 'mix-blend-luminosity': set('mix-blend-mode', 'luminosity'); continue;",
  "      case 'mix-blend-difference': set('mix-blend-mode', 'difference'); continue;",
  "      case 'mix-blend-exclusion': set('mix-blend-mode', 'exclusion'); continue;",
  "      case 'mix-blend-hue': set('mix-blend-mode', 'hue'); continue;",
  "      case 'text-ellipsis': set('text-overflow', 'ellipsis'); continue;",
  "      case 'text-clip': set('text-overflow', 'clip'); continue;",
  "      case 'bg-clip-text': set('-webkit-background-clip', 'text'); set('background-clip', 'text'); continue;",
].join('\n'));

fs.writeFileSync(F, s);
console.log('patched: extra tailwind utilities');
