// Entity prefab Explosion + FrameAnim(def Explosion, fps 15, loop false).
const n = sprite(root, 'Explosion', 0, 0);
const c = n.addComponent(cc.js.getClassByName('FrameAnim'));
Object.assign(c, { def: 'Explosion', fps: 15, loop: false });
return n;
