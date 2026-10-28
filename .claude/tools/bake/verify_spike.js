return await (async()=>{
const C=cc;
const pf = await new Promise((res,rej)=>C.assetManager.loadAny({uuid:'f8b3bd33-bf2e-40c0-8a3b-862e3671e9af'},(e,a)=>e?rej(e):res(a)));
const canvas=C.director.getScene().getChildByName('Canvas');
const tmp=new C.Node('__verify'); canvas.addChild(tmp);
const inst=C.instantiate(pf); tmp.addChild(inst);
const out={};
for(const n of inst.children){
  const ut=n.getComponent(C.UITransform), sp=n.getComponent(C.Sprite), op=n.getComponent(C.UIOpacity), lb=n.getComponent(C.Label);
  out[n.name]={pos:[n.position.x,n.position.y],scale:[n.scale.x,n.scale.y],size:[ut.width,ut.height],anchor:[ut.anchorX,ut.anchorY],
    sf: sp&&sp.spriteFrame&&sp.spriteFrame._uuid, sizeMode: sp&&sp.sizeMode, mat: sp&&sp.customMaterial&&sp.customMaterial._uuid,
    opacity: op&&op.opacity, label: lb&&{s:lb.string,fs:lb.fontSize,lh:lb.lineHeight,bold:lb.isBold,font:lb.fontFamily,ov:lb.overflow,al:lb.horizontalAlign}};
}
tmp.destroy();
return out;
})();
