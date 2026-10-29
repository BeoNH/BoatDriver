// Popup lịch sử. Bake: sh bake.sh specs/PopupHistory.js
// Popup danh sách (PopupBase). Root bị Component ẩn trong init() lúc chạy.
const add = (n, cls, props) => { const c = n.addComponent(cc.js.getClassByName(cls)); Object.assign(c, props || {}); return c; };
const BROWN = [75, 53, 46, 255];
const rlabel = (p, t, x, y, o) => { const n = label(p, t, x, y, o); n.getComponent(cc.Label).horizontalAlign = cc.Label.HorizontalAlign.RIGHT; n.getComponent(cc.UITransform).setAnchorPoint(1, 0.5); return n; };
const named = (n, name) => { n.name = name; return n; };
const dim = sprite(root, "dim", 427, 240, { file: 'dim', fw: 16, fh: 16, w: 900, h: 520, opacity: 0.6 });
dim.addComponent(cc.BlockInputEvents);
sprite(root, "panel", 427, 245, { file: 'popup_panel', fw: 620, fh: 440, w: 620, h: 440 });
const btnClose = sprite(root, "btnClose", 722, 52, { file: 'btn_close', fw: 125, fh: 125, w: 56, h: 56 });
// list: view (Mask) x142-712 y155-410; content anchor (0.5,1) + Layout VERTICAL
const view = group(root, "view", { w: 570, h: 255, x: 427, y: 282.5 });
view.addComponent(cc.Mask).type = cc.Mask.Type.GRAPHICS_RECT;
const content = group(view, "content", { w: 570, h: 0, ax: 0.5, ay: 1, y: -127.5 });
const lay = content.addComponent(cc.Layout);
lay.type = cc.Layout.Type.VERTICAL; lay.resizeMode = cc.Layout.ResizeMode.CONTAINER; lay.spacingY = 4;
const scroll = view.addComponent(cc.ScrollView);
scroll.content = content; scroll.horizontal = false; scroll.vertical = true; scroll.elastic = true; scroll.inertia = true;
const statusTxt = named(label(root, "", 427, 280, { align: "center", size: 26, color: BROWN }), "statusTxt").getComponent(cc.Label);
const tplRow = (name) => { const r = sprite(root, name, 427, 0, { file: 'popup_row', fw: 540, fh: 40, w: 540, h: 40, color: [120, 84, 64, 255] }); r.active = false; return r; };

const pop = add(root, 'PopupHistory');
const title = named(label(root, 'HISTORY', 415, 88, { align: 'center', size: 30 }), 'title');
label(root, 'DATE', 165, 140, { size: 18, color: BROWN });
label(root, 'TIME', 470, 140, { align: 'center', size: 18, color: BROWN });
rlabel(root, 'SCORE', 690, 140, { size: 18, color: BROWN });
const itemTpl = tplRow('itemTpl');
named(label(itemTpl, '-', -262, 0, { size: 20 }), 'date');
named(label(itemTpl, '-', 43, 0, { align: 'center', size: 20 }), 'time');
named(rlabel(itemTpl, '-', 263, 0, { size: 20 }), 'score');
Object.assign(pop, { btnClose, statusTxt, scroll, content, itemTpl });
