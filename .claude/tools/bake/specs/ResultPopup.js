// Mirror của ResultPopup constructor cũ (GAME_SPEC §6.11). Root bị Component ẩn (active=false) trong init() lúc chạy.
const add = (n, cls, props) => { const c = n.addComponent(cc.js.getClassByName(cls)); Object.assign(c, props || {}); return c; };
const lbl = (n, name) => { n.name = name; return n.getComponent(cc.Label); };
const pop = add(root, 'ResultPopup');
sprite(root, 'Board', 415, 266, { w: 312, h: 302 });
label(root, 'SCORE', 411, 170, { align: 'center', size: 26.25 }).name = 'scoreLabel';
const scoreTxt = lbl(label(root, '0', 411, 226, { align: 'center', size: 36 }), 'scoreTxt');
const bestTxt = lbl(label(root, '', 418, 272, { align: 'center' }), 'bestTxt');
sprite(root, 'dollerIcon', 318, 319, { w: 39, h: 25 });
const cashTxt = lbl(label(root, '0', 354, 318), 'cashTxt');
const rewardTxt = lbl(label(root, '', 461, 318, { color: [0, 255, 0, 255] }), 'rewardTxt');
const btnMenu = sprite(root, 'Btn_Menu', 353, 389, { w: 91, h: 88 });
add(btnMenu, 'SinePulse', { magnitude: 5, period: 0.5 });
const btnRestart = sprite(root, 'Btn_restart', 489, 389, { w: 89, h: 89 });
add(btnRestart, 'SinePulse', { magnitude: 5, period: 0.5 });
Object.assign(pop, { scoreTxt, bestTxt, cashTxt, rewardTxt, btnMenu, btnRestart });
