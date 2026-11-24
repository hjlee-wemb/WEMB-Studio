/* 설비 카드 장면 미리보기(cardset.html) — card.html(전력 + 카드) 에 간이 설비정보 창(compact)을 얹는다. conv.js 를 돌린 뒤 다시 실행.
   스튜디오 쪽 짝은 js/templates/datacenter.js 의 build_dmp_cardset. 실행: node mk-cardset.js */
'use strict';
const fs = require('fs'), path = require('path');
const D = path.join(__dirname, '..');
let card = fs.readFileSync(path.join(D, 'card.html'), 'utf8'), cp = fs.readFileSync(path.join(D, 'compact.html'), 'utf8');
const st = cp.slice(cp.indexOf('<style>') + 7, cp.indexOf('</style>'));
const tpl = fs.readFileSync(path.join(D, '..', '..', 'js', 'templates', 'datacenter.js'), 'utf8');
const a = tpl.indexOf('window.build_dmp_cardset'), b = tpl.indexOf('};', a) + 2;
card = card.replace('</style>', () => st + '\n</style>');
card = card.replace('<script src="../datacenter-card.js"></script>', () => '<script src="../datacenter-card.js"></script>\n<script src="../datacenter-compact.js"></script>\n<script>' + tpl.slice(a, b) + '</script>');
card = card.replace('window.build_dmp_card("./")', 'window.build_dmp_cardset("./")');
card = card.replace('document.querySelectorAll(".dmc-root")', 'document.querySelectorAll(".sh-pop")');
fs.writeFileSync(path.join(D, 'cardset.html'), card);
console.log('cardset.html', card.length);
