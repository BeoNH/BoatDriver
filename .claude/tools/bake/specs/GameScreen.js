// Mirror của GameScreen.onLoad (layer tree) + phần tĩnh của World constructor (BG x2, water). Hud/ResultPopup: @property(Prefab), instantiate lúc chạy.
const add = (n, cls, props) => { const c = n.addComponent(cc.js.getClassByName(cls)); Object.assign(c, props || {}); return c; };
const loadPrefab = async (url) => {
  const uuid = await Editor.Message.request('asset-db', 'query-uuid', url);
  if (!uuid) throw new Error('missing ' + url + ' (bake it first)');
  return await new Promise((res, rej) => cc.assetManager.loadAny({ uuid }, (e, a) => e ? rej(e) : res(a)));
};
const gs = add(root, 'GameScreen');
const worldRoot = group(root, 'worldRoot');
const bgLayer = group(worldRoot, 'bgLayer');
const buildingsLayer = group(worldRoot, 'buildingsLayer');
const gameLayer = group(worldRoot, 'gameLayer');
const groundLayer = group(gameLayer, 'groundLayer');
const roadLayer = group(gameLayer, 'roadLayer');
const fxLayer = group(gameLayer, 'fxLayer');
const uiLayer = group(root, 'uiLayer');
const popupLayer = group(root, 'popupLayer');
sprite(bgLayer, 'BG', -1, -2, { w: 904, h: 486 });
sprite(bgLayer, 'BG', 886, -2, { w: 904, h: 486 });
const water = sprite(bgLayer, 'water', 802, 264, { opacity: 0.75, additive: true });
add(water, 'FrameAnim', { def: 'water', fps: 15, loop: true });
const hudPrefab = await loadPrefab('db://assets/prefabs/Hud.prefab');
const popupPrefab = await loadPrefab('db://assets/prefabs/ResultPopup.prefab');
Object.assign(gs, { worldRoot, bgLayer, buildingsLayer, groundLayer, roadLayer, fxLayer, uiLayer, popupLayer, water, hudPrefab, popupPrefab });
