import { Color, Node, Sprite, SpriteFrame, Texture2D, UITransform } from 'cc';
import { placeC3 } from '../core/UIKit';

let softFrame: SpriteFrame | null = null;

/** 16x16 white soft circle generated at runtime (no particle texture in resources). */
function softCircle(): SpriteFrame {
    if (softFrame) return softFrame;
    const n = 16, data = new Uint8Array(n * n * 4);
    for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
            const d = Math.min(1, Math.hypot(x + 0.5 - n / 2, y + 0.5 - n / 2) / (n / 2));
            const i = (y * n + x) * 4;
            data[i] = data[i + 1] = data[i + 2] = 255;
            data[i + 3] = Math.round((1 - d * d) * 255);
        }
    }
    const tex = new Texture2D();
    tex.reset({ width: n, height: n, format: Texture2D.PixelFormat.RGBA8888 });
    tex.uploadData(data);
    tex.setFilters(Texture2D.Filter.LINEAR, Texture2D.Filter.LINEAR);
    softFrame = new SpriteFrame();
    softFrame.packable = false;
    softFrame.texture = tex;
    return softFrame;
}

export interface ParticleInit {
    x: number; y: number; vx: number; vy: number; life: number;
    size0: number; size1: number; alpha: number; gravity?: number; color?: Color;
}

interface Particle extends ParticleInit {
    node: Node; sprite: Sprite; ut: UITransform; color: Color; age: number; live: boolean;
}

/** Small fixed-size pool of tinted soft-circle sprites (C3 coords, y down). */
export class Particles {
    private pool: Particle[] = [];

    constructor(private parent: Node, private max: number) {}

    emit(init: ParticleInit): void {
        const p = this.acquire();
        if (!p) return;
        Object.assign(p, init);
        p.color = (init.color ?? Color.WHITE).clone();
        p.age = 0;
        p.live = true;
        p.node.active = true;
        this.render(p);
    }

    update(dt: number): void {
        for (const p of this.pool) {
            if (!p.live) continue;
            p.age += dt;
            if (p.age >= p.life) { p.live = false; p.node.active = false; continue; }
            p.vy += (p.gravity ?? 0) * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            this.render(p);
        }
    }

    private render(p: Particle): void {
        const t = p.age / p.life;
        const size = p.size0 + (p.size1 - p.size0) * t;
        p.ut.setContentSize(size, size);
        placeC3(p.node, p.x, p.y);
        p.color.a = Math.round(255 * p.alpha * (1 - t));
        p.sprite.color = p.color;
    }

    private acquire(): Particle | null {
        for (const p of this.pool) if (!p.live) return p;
        if (this.pool.length >= this.max) return null;
        const node = new Node('p');
        node.layer = this.parent.layer;
        const ut = node.addComponent(UITransform);
        const sprite = node.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.spriteFrame = softCircle();
        this.parent.addChild(node);
        const p = { node, sprite, ut, color: new Color(), age: 0, live: false } as Particle;
        this.pool.push(p);
        return p;
    }
}
