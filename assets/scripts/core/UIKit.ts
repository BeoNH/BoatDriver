import { builtinResMgr, Color, Component, gfx, Label, Material, Node, Sprite, SpriteFrame, Texture2D, UIOpacity, UITransform, _decorator } from 'cc';
import { SPRITE_DEFS } from '../data/SpriteDefs';
import { Res } from './Res';

const { ccclass, property } = _decorator;

/**
 * Dựng UI theo toạ độ C3: parent là node có gốc ở góc trên-trái (anchor (0,1)), con đặt tại (x, -y).
 * Kích thước/origin lấy từ SPRITE_DEFS nên khớp layout gốc.
 */

export interface SpriteOpts { w?: number; h?: number; opacity?: number; angle?: number; mirror?: boolean; frame?: number; }

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

/** Tạo sprite tại (x,y) C3. w/h = kích thước hiển thị mong muốn (mặc định = kích thước gốc). */
export function makeSprite(parent: Node, def: string, x: number, y: number, opts: SpriteOpts = {}): Node {
    const node = new Node(def);
    node.layer = parent.layer;
    node.addComponent(UITransform);
    parent.addChild(node);
    setSpriteFrame(node, def, opts.frame ?? 0);
    const fd = SPRITE_DEFS[def].frames[opts.frame ?? 0];
    const sx = (opts.w ?? fd.w) / fd.w;
    const sy = (opts.h ?? fd.h) / fd.h;
    node.setScale(opts.mirror ? -sx : sx, sy, 1);
    if (opts.angle) node.angle = -opts.angle;
    if (opts.opacity !== undefined) setOpacity(node, opts.opacity);
    placeC3(node, x, y);
    return node;
}

export interface LabelOpts { size?: number; align?: 'left' | 'center'; color?: Color; }

export function makeLabel(parent: Node, text: string, x: number, y: number, opts: LabelOpts = {}): Label {
    const node = new Node('Label');
    node.layer = parent.layer;
    const ut = node.addComponent(UITransform);
    parent.addChild(node);
    const lb = node.addComponent(Label);
    lb.string = text;
    lb.fontFamily = 'Arial';
    lb.isBold = true;
    lb.fontSize = opts.size ?? 21.75;
    lb.lineHeight = lb.fontSize * 1.2;
    lb.color = opts.color ?? Color.WHITE;
    lb.overflow = Label.Overflow.NONE;
    const left = (opts.align ?? 'left') === 'left';
    lb.horizontalAlign = left ? Label.HorizontalAlign.LEFT : Label.HorizontalAlign.CENTER;
    ut.setAnchorPoint(left ? 0 : 0.5, 0.5);
    placeC3(node, x, y);
    return lb;
}

/** opacity 0..1 */
export function setOpacity(node: Node, opacity: number): void {
    const op = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
    op.opacity = Math.round(Math.max(0, Math.min(1, opacity)) * 255);
}

let whiteFrame: SpriteFrame | null = null;

/** Hình chữ nhật màu (C3 TiledBg đơn sắc) — sprite trắng 2×2 tạo runtime, tránh Graphics (lỗi batch trong Game View). */
export function makeRect(parent: Node, x: number, y: number, w: number, h: number, color: Color): Node {
    if (!whiteFrame) {
        const tex = new Texture2D();
        tex.reset({ width: 2, height: 2, format: Texture2D.PixelFormat.RGBA8888 });
        tex.uploadData(new Uint8Array(16).fill(255));
        whiteFrame = new SpriteFrame();
        whiteFrame.packable = false;
        whiteFrame.texture = tex;
    }
    const node = new Node('Rect');
    node.layer = parent.layer;
    const ut = node.addComponent(UITransform);
    parent.addChild(node);
    const sp = node.addComponent(Sprite);
    sp.sizeMode = Sprite.SizeMode.CUSTOM;
    sp.spriteFrame = whiteFrame;
    sp.color = color;
    ut.setContentSize(w, h);
    ut.setAnchorPoint(0, 1);
    placeC3(node, x, y);
    return node;
}

let additiveMat: Material | null = null;

/** C3 blend mode "Additive" (src·alpha + dst). Material dùng chung cho mọi sprite additive. */
export function setAdditive(node: Node): void {
    const sp = node.getComponent(Sprite);
    if (!sp) return;
    if (!additiveMat) {
        const base = builtinResMgr.get<Material>('ui-sprite-material');
        additiveMat = new Material();
        additiveMat.initialize({
            effectAsset: base.effectAsset,
            defines: { ...base.passes[0].defines },
            states: { blendState: { targets: [{ blend: true, blendSrc: gfx.BlendFactor.SRC_ALPHA, blendDst: gfx.BlendFactor.ONE }] } },
        });
    }
    sp.customMaterial = additiveMat;
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
