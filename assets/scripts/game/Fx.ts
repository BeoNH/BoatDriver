import { Color, Label, Node } from 'cc';
import { random } from '../core/C3';
import { FrameAnim } from '../core/FrameAnim';
import { Pool } from '../core/Pool';
import { placeC3, setOpacity } from '../core/UIKit';
import { Entity, EntityPrefabs, VP_Y } from './Entities';
import { Particles } from './Particles';

interface BonusText { label: Label; y: number; age: number; }
interface FlyingBag { node: Node; key: string; x: number; y: number; age: number; }

const WATER = new Color(255, 255, 255);
const BONUS_KEY = 'label:bonus';

/** Explosion, bonus text, water spray and the flying cash bag. */
export class Fx {
    private readonly spray: Particles;
    private explosions: Entity[] = [];
    private texts: BonusText[] = [];
    private bags: FlyingBag[] = [];
    private sprayAcc = 0;

    constructor(private ground: Node, private top: Node, private ui: Node, private bagTarget: { x: number; y: number }) {
        this.spray = new Particles(ground, 60);
    }

    /** §6.5 EneDestroy explosion. */
    explode(x: number, y: number): void {
        const e = new Entity(this.top, 'Explosion', 0, x, y);
        const anim = e.node.getComponent(FrameAnim)!;
        anim.onFrame = (f) => { e.frame = f; };
        anim.play(0);
        e.scale = (y - VP_Y) / 150;
        this.explosions.push(e);
    }

    /** §6.5 Bonus(n) text. */
    bonusText(x: number, n: number): void {
        const node = Pool.get(BONUS_KEY, this.top, () => EntityPrefabs.create('BonusText'));
        const label = node.getComponent(Label)!;
        label.string = `+${n}`;
        placeC3(node, x, 240);
        setOpacity(node, 1);
        this.texts.push({ label, y: 240, age: 0 });
    }

    /** §6.7: move a picked-up bag (reparented keeping its on-screen place) toward the HUD dollar icon. */
    flyBag(node: Node, key: string, screenX: number, screenY: number, screenScale: number): void {
        node.parent = this.ui;
        placeC3(node, screenX, screenY);
        node.setScale(screenScale, screenScale, 1);
        this.bags.push({ node, key, x: screenX, y: screenY, age: 0 });
    }

    /** §6.8 spray behind the boat: rate S*20/s, speed 100+S*60, 3 directions. */
    emitSpray(dt: number, s: number, x: number, y: number): void {
        this.sprayAcc += s * 20 * dt;
        const speed = 100 + s * 60;
        const dirs = [[0, 1], [-0.6, 0.8], [0.6, 0.8]];
        while (this.sprayAcc >= 1) {
            this.sprayAcc -= 1;
            const d = dirs[Math.floor(Math.random() * 3)];
            const sp = speed * random(0.8, 1.1);
            this.spray.emit({ x, y, vx: d[0] * sp, vy: d[1] * sp, life: 0.5, size0: 8, size1: 22, alpha: 0.5, color: WATER });
        }
    }

    update(dt: number, s: number, vpX: number): void {
        this.updateExplosions(dt, s, vpX);
        this.updateTexts(dt);
        this.updateBags(dt);
        this.spray.update(dt);
    }

    private updateExplosions(dt: number, s: number, vpX: number): void {
        for (const e of this.explosions) {
            e.x += s * (e.x - vpX) * dt;
            e.y += s * (e.y - VP_Y) * dt;
            e.scale = (e.y - VP_Y) / 150;
            e.node.getComponent(FrameAnim)!.setTime(e.age * 15);
            e.alpha = Math.max(0, 1 - e.age / 0.6);
            if (e.age >= 0.6) e.alive = false;
            e.sync(dt);
        }
        this.explosions = this.explosions.filter((e) => {
            if (!e.alive) e.destroy();
            return e.alive;
        });
    }

    private updateTexts(dt: number): void {
        for (const t of this.texts) {
            t.age += dt;
            t.y -= 100 * dt;
            t.label.node.setPosition(t.label.node.position.x, -t.y, 0);
            setOpacity(t.label.node, 1 - t.age);
        }
        this.texts = this.texts.filter((t) => {
            if (t.age >= 1) Pool.put(BONUS_KEY, t.label.node);
            return t.age < 1;
        });
    }

    private updateBags(dt: number): void {
        for (const b of this.bags) {
            b.age += dt;
            const dx = this.bagTarget.x - b.x, dy = this.bagTarget.y - b.y;
            const dist = Math.hypot(dx, dy), step = Math.min(dist, 800 * dt);
            if (dist > 0) { b.x += (dx / dist) * step; b.y += (dy / dist) * step; }
            placeC3(b.node, b.x, b.y);
            setOpacity(b.node, 1 - b.age / 2);
        }
        this.bags = this.bags.filter((b) => {
            if (b.age >= 2) Pool.put(b.key, b.node);
            return b.age < 2;
        });
    }
}
