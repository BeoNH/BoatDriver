import { Color, Node, Sprite, UITransform } from 'cc';
import { placeC3 } from '../core/UIKit';
import { EntityPrefabs } from './Entities';

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
        const node = EntityPrefabs.create('Spray');
        node.active = false;
        const ut = node.getComponent(UITransform)!;
        const sprite = node.getComponent(Sprite)!;
        this.parent.addChild(node);
        const p = { node, sprite, ut, color: new Color(), age: 0, live: false } as Particle;
        this.pool.push(p);
        return p;
    }
}
