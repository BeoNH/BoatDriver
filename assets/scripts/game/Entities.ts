import { Node, Prefab, UIOpacity, instantiate } from 'cc';
import { Pool } from '../core/Pool';
import { setOpacity, placeC3, setSpriteFrame } from '../core/UIKit';
import { FrameDef, SPRITE_DEFS } from '../data/SpriteDefs';

/** Registry prefab entity (key = prefab.data.name = def). GameScreen đăng ký ở onLoad, clear ở onDestroy. */
export class EntityPrefabs {
    private static map = new Map<string, Prefab>();

    static register(list: Prefab[]): void {
        for (const p of list) EntityPrefabs.map.set(p.data.name, p);
    }

    /** Dựng node mới từ prefab; thiếu prefab thì throw (không fallback dựng tay). */
    static create(name: string): Node {
        const p = EntityPrefabs.map.get(name);
        if (!p) throw new Error(`EntityPrefabs: thiếu prefab '${name}' (wire GameScreen.entityPrefabs)`);
        return instantiate(p);
    }

    static clear(): void { EntityPrefabs.map.clear(); }
}

/** Vanishing point Y (GAME_SPEC §6.1). */
export const VP_Y = 288;
/** Waydot / attached objects are destroyed below this Y (§6.2). */
export const KILL_Y = 490;

export interface Box { l: number; t: number; w: number; h: number; }

export function overlap(a: Box, b: Box): boolean {
    return a.l < b.l + b.w && b.l < a.l + a.w && a.t < b.t + b.h && b.t < a.t + a.h;
}

export function centeredBox(cx: number, cy: number, w: number, h: number): Box {
    return { l: cx - w / 2, t: cy - h / 2, w, h };
}

/** Invisible road slice (§6.2): pure data, `width` = 1300 * scale. */
export class Waydot {
    dead = false;
    scale: number;
    width: number;
    constructor(public x: number, public y: number) {
        this.scale = (y - VP_Y) / 230;
        this.width = 1300 * this.scale;
    }
    move(dt: number, s: number): void {
        const d = this.y - VP_Y;
        this.y += (s * d * d / 60) * dt;
        this.scale = (this.y - VP_Y) / 230;
        this.width = 1300 * this.scale;
        if (this.y > KILL_Y) this.dead = true;
    }
}

/** A sprite in C3 coordinates. Optionally glued to a waydot at x = waydot.x + k * waydot.width. */
export class Entity {
    private static nextId = 1;
    readonly id = Entity.nextId++;
    readonly node: Node;
    scale = 1;
    mirror = false;
    angle = 0;
    alpha = 1;
    fadeIn = 0;
    age = 0;
    alive = true;
    waydot: Waydot | null = null;
    private k = 0;
    private div = 230;
    private lastOpacity = -1;
    private released = false;

    constructor(parent: Node, readonly def: string, public frame = 0, public x = 0, public y = 0) {
        // Node tái dùng được reset y hệt node prefab mới (frame/size/anchor, scale, angle, opacity, vị trí, layer).
        // Node từ prefab (additive của Shield nằm trong prefab); pool theo key = def.
        const node = Pool.get(def, parent, () => EntityPrefabs.create(def));
        setSpriteFrame(node, def, frame);
        node.setScale(1, 1, 1);
        node.angle = 0;
        const op = node.getComponent(UIOpacity);
        if (op) op.opacity = 255;
        placeC3(node, x, y);
        this.node = node;
    }

    get fd(): FrameDef { return SPRITE_DEFS[this.def].frames[this.frame]; }

    attach(w: Waydot, k: number, scaleDiv: number): this {
        this.waydot = w;
        this.k = k;
        this.div = scaleDiv;
        this.follow();
        return this;
    }

    /** Re-read position/scale from the waydot; dies with it or below KILL_Y. */
    follow(): void {
        const w = this.waydot;
        if (!w) return;
        if (w.dead) { this.alive = false; return; }
        this.x = w.x + this.k * w.width;
        this.y = w.y;
        this.scale = (this.y - VP_Y) / this.div;
        if (this.y > KILL_Y) this.alive = false;
    }

    /** Axis-aligned box from origin + size (§6 collision rule). */
    box(): Box {
        const fd = this.fd, w = fd.w * this.scale, h = fd.h * this.scale;
        const ox = this.mirror ? 1 - fd.ox : fd.ox;
        return { l: this.x - ox * w, t: this.y - fd.oy * h, w, h };
    }

    sync(dt: number): void {
        this.age += dt;
        const fade = this.fadeIn > 0 ? Math.min(1, this.age / this.fadeIn) : 1;
        const op = Math.round(Math.max(0, Math.min(1, fade * this.alpha)) * 255);
        if (op !== this.lastOpacity) { this.lastOpacity = op; setOpacity(this.node, op / 255); }
        placeC3(this.node, this.x, this.y);
        const s = Math.max(this.scale, 0.0001);
        this.node.setScale(this.mirror ? -s : s, s, 1);
        this.node.angle = -this.angle;
    }

    /** Nhường node cho owner khác (ví dụ Fx.flyBag); owner chịu trách nhiệm Pool.put(def, node). */
    detach(): Node {
        this.alive = false;
        this.released = true;
        return this.node;
    }

    destroy(): void {
        this.alive = false;
        if (this.released) return;
        this.released = true;
        Pool.put(this.def, this.node);
    }
}

/** Removes dead entities (destroying their nodes) and returns the survivors. */
export function prune(list: Entity[]): Entity[] {
    return list.filter((e) => {
        if (!e.alive) e.destroy();
        return e.alive;
    });
}

/** C3 "On collision" = fires only on the frame an overlap begins. One tracker per sensor/target pair. */
export class OverlapTracker {
    private current = new Set<number>();
    begins(sensor: Box, targets: Entity[]): Entity[] {
        const next = new Set<number>();
        const out: Entity[] = [];
        for (const e of targets) {
            if (!e.alive || !overlap(sensor, e.box())) continue;
            next.add(e.id);
            if (!this.current.has(e.id)) out.push(e);
        }
        this.current = next;
        return out;
    }
}
