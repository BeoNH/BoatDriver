// Popup Pause nhỏ gọn. Root bị Component ẩn (active=false) trong init() lúc chạy. Board_short: gen_board_short.py.
const add = (n, cls, props) => { const c = n.addComponent(cc.js.getClassByName(cls)); Object.assign(c, props || {}); return c; };
const pop = add(root, 'PausePopup');
const dim = sprite(root, 'dim', 427, 240, { file: 'dim', fw: 16, fh: 16, w: 900, h: 520, opacity: 0.6 });
dim.addComponent(cc.BlockInputEvents);
sprite(root, 'Board', 427, 240, { file: 'Board_short', fw: 379, fh: 258, w: 250, h: 170 });
label(root, 'PAUSED', 424, 197, { align: 'center', size: 20 }).name = 'titleLabel';
const btnNo = sprite(root, 'Btn_restart', 375, 287, { w: 72, h: 72 });
btnNo.name = 'btnNo';
add(btnNo, 'SinePulse', { magnitude: 5, period: 0.5 });
const btnYes = sprite(root, 'btn_play', 479, 287, { file: 'btn_play', fw: 125, fh: 125, w: 72, h: 72 });
btnYes.name = 'btnYes';
add(btnYes, 'SinePulse', { magnitude: 5, period: 0.5 });
Object.assign(pop, { btnYes, btnNo });
