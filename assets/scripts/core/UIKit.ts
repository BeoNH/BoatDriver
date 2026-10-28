import { Component, Node, Sprite, UIOpacity, UITransform, _decorator } from 'cc';
import { SPRITE_DEFS } from '../data/SpriteDefs';
import { Res } from './Res';

const { ccclass, property } = _decorator;

/**
 * Helper UI theo toạ độ C3: parent có gốc ở góc trên-trái (anchor (0,1)), con đặt tại (x, -y).
 * Gồm: placeC3 / setSpriteFrame / setOpacity / onTap / SinePulse. Node dựng bằng prefab
 * (assets/prefabs, bake specs .claude/tools/bake/specs), kích thước/origin lấy từ SPRITE_DEFS.
 */

export function placeC3(node: Node, x: number, y: number): void {
    node.setPosition(x, -y, 0);
}

/** Đổi frame (texture + anchor theo origin gốc + contentSize = kích thước gốc). Giữ nguyên scale. */
export function setSpriteFrame(node: Node, def: string, frame = 0): void {
    const fd = SPRITE_DEFS[def]?.frames[frame];
    if (!fd) return;
    const sp = node.getComponent(Sprite) ?? node.addComponent(Sprite);
    sp.sizeMode = Sprite.SizeMode.CUSTOM;
    sp.spriteFrame = Res.frame(fd.file);
    const ut = node.getComponent(UITransform)!;
    ut.setContentSize(fd.w, fd.h);
    ut.setAnchorPoint(fd.ox, 1 - fd.oy);
}

/** opacity 0..1 */
export function setOpacity(node: Node, opacity: number): void {
    const op = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
    op.opacity = Math.round(Math.max(0, Math.min(1, opacity)) * 255);
}

/** C3 Touch.OnTouchObject = kích hoạt khi chạm xuống (touch start). */
export function onTap(node: Node, cb: () => void): void {
    node.on(Node.EventType.TOUCH_START, cb);
}

/** Behavior Sine "Size" của C3: kích thước dao động ±magnitude px quanh kích thước gốc (base lấy từ node lúc onLoad). */
@ccclass('SinePulse')
export class SinePulse extends Component {
    @property magnitude = 5;
    @property period = 0.5;
    private t = 0;
    private baseX = 1;
    private baseY = 1;
    private baseW = 1;

    onLoad(): void {
        this.baseX = this.node.scale.x;
        this.baseY = this.node.scale.y;
        this.baseW = Math.abs(this.node.getComponent(UITransform)!.width * this.baseX) || 1;
    }

    update(dt: number): void {
        this.t += dt;
        const m = 1 + (this.magnitude * Math.sin((this.t / this.period) * Math.PI * 2)) / this.baseW;
        this.node.setScale(this.baseX * m, this.baseY * m, 1);
    }
}
