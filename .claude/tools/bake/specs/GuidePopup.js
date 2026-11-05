// Popup hướng dẫn chơi: nội dung tĩnh. Root bị Component ẩn trong init() lúc chạy.
const add = (n, cls, props) => { const c = n.addComponent(cc.js.getClassByName(cls)); Object.assign(c, props || {}); return c; };
const BROWN = [75, 53, 46, 255];
const named = (n, name) => { n.name = name; return n; };
const pop = add(root, 'GuidePopup');
const dim = sprite(root, 'dim', 427, 240, { file: 'dim', fw: 16, fh: 16, w: 900, h: 520, opacity: 0.6 });
dim.addComponent(cc.BlockInputEvents);
sprite(root, 'panel', 427, 245, { file: 'popup_panel', fw: 620, fh: 440, w: 620, h: 440 });
const btnClose = sprite(root, 'btnClose', 722, 52, { file: 'btn_close', fw: 125, fh: 125, w: 56, h: 56 });
named(label(root, 'GUIDE', 415, 88, { align: 'center', size: 30 }), 'title');

const ROW0 = 150, STEP = 46, ICON_X = 185, TEXT_X = 240;
const rows = [
    ['Steer left / right  (A, D or arrow keys)', (y) => {
        sprite(root, 'LeftTurn', ICON_X - 21, y, { file: 'LeftTurn', fw: 193, fh: 210, w: 35, h: 38 });
        sprite(root, 'rightTurn', ICON_X + 21, y, { file: 'rightTurn', fw: 192, fh: 210, w: 35, h: 38 });
    }],
    ['Hold to speed up  (W or Up): faster = more score', (y) => sprite(root, 'accele', ICON_X, y, { file: 'accele', fw: 224, fh: 358, w: 26, h: 42 })],
    ['Brake  (S or Down)', (y) => sprite(root, 'Brake', ICON_X, y, { file: 'Brake', fw: 231, fh: 258, w: 36, h: 40 })],
    ['Avoid buoys, boats and walls: one hit ends the run', (y) => sprite(root, 'sider', ICON_X, y, { file: 'sider', fw: 85, fh: 319, w: 12, h: 44 })],
    ['Shield: smash boats for 10s, but not buoys', (y) => sprite(root, 'shieldIcon', ICON_X, y, { file: 'shieldIcon', fw: 250, fh: 250, w: 40, h: 40 })],
    ['Collect cash and pass boats to buy new boats', (y) => sprite(root, 'CashPickiUp_1', ICON_X, y, { file: 'CashPickiUp_1', fw: 149, fh: 171, w: 35, h: 40 })],
];
rows.forEach(([text, draw], i) => {
    const y = ROW0 + STEP * i;
    draw(y);
    named(label(root, text, TEXT_X, y, { size: 18, color: BROWN }), 'row' + i);
});
Object.assign(pop, { btnClose });
