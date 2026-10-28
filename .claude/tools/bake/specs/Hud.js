// Mirror của Hud constructor cũ (GAME_SPEC §6.11, §6.3). Nút touch luôn có trong prefab; Hud.init ẩn đi khi không phải mobile.
const add = (n, cls, props) => { const c = n.addComponent(cc.js.getClassByName(cls)); Object.assign(c, props || {}); return c; };
const lbl = (n, name) => { n.name = name; return n.getComponent(cc.Label); };
const hud = add(root, 'Hud');
sprite(root, 'UIbar', 428, 25, { w: 861, h: 51 });
const btnMenu = sprite(root, 'Btn_Menu', 35, 30, { w: 55, h: 53 });
sprite(root, 'dollerIcon', 124, 24, { w: 26.5, h: 17, angle: -20.8 });
const cashTxt = lbl(label(root, '0', 156, 26), 'cashTxt');
label(root, 'Score :', 584, 23).name = 'scoreLabel';
const scoreTxt = lbl(label(root, '0', 694, 23), 'scoreTxt');
const levelTxt = lbl(label(root, '', 420, 25, { align: 'center' }), 'levelTxt');
const leftBtn = sprite(root, 'LeftTurn', 105, 407, { w: 95, h: 104, opacity: 0.75 });
const rightBtn = sprite(root, 'rightTurn', 224, 407, { w: 95, h: 104, opacity: 0.75 });
const brakeBtn = sprite(root, 'Brake', 643, 404, { w: 106, h: 118, opacity: 0.75 });
const accelBtn = sprite(root, 'accele', 776, 383, { w: 103, h: 164, opacity: 0.75 });
Object.assign(hud, { btnMenu, cashTxt, scoreTxt, levelTxt, leftBtn, rightBtn, brakeBtn, accelBtn });
