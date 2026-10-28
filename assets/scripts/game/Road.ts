import { Node } from 'cc';
import { Every, random, randomInt } from '../core/C3';
import { Entity, prune, VP_Y, Waydot } from './Entities';

const START_VP_X = 706;
/**
 * C3 quirk: Bullet behavior ticks before events, so a freshly created waydot moves one frame at its default
 * speed 400 px/s before the event sheet sets the real speed. Since speed ∝ d², this offset sets the road density.
 */
const FIRST_TICK_PUSH = 400 / 60;

/** Fake-3D road (§6.2): vanishing point, waydots, buoys, roadside buildings (§6.8). */
export class Road {
    vpX = START_VP_X;
    readonly waydots: Waydot[] = [];
    buoys: Entity[] = [];
    buildings: Entity[] = [];
    private targetX = START_VP_X;
    private vpTimer = new Every();
    private vpInterval = random(3, 5);
    private spawnTimer = new Every();
    private buildTimers = [new Every(), new Every()];
    private buildFactor = [random(5, 10), random(5, 10)];

    constructor(private roadLayer: Node, private buildingsLayer: Node) {
        // Created on layout start: C3's first tick has dt = 0, so these get no FIRST_TICK_PUSH.
        for (let i = 0; i < 20; i++) this.spawnWaydot(VP_Y + 8 + Math.pow((i + 1) / 3, 2));
    }

    get newest(): Waydot { return this.waydots[this.waydots.length - 1]; }

    /** 1-based from newest: nth(1) = newest, nth(5) = "Count-5". */
    nth(n: number): Waydot | null { return this.waydots[this.waydots.length - n] ?? null; }

    update(dt: number, s: number): void {
        this.updateVpoint(dt, s);
        if (this.spawnTimer.tick(dt, 0.5 / s)) this.spawnWaydot(VP_Y + 2 + FIRST_TICK_PUSH);
        for (const w of this.waydots) w.move(dt, s);
        this.dropDeadWaydots();
        this.updateBuildings(dt, s);
    }

    /** Buildings: sort by distance to Vpoint, nearer first so farther ones draw on top (§6.8). */
    sortBuildings(): void {
        const d = (e: Entity) => Math.hypot(e.x - this.vpX, e.y - VP_Y);
        const sorted = this.buildings.slice().sort((a, b) => d(a) - d(b));
        sorted.forEach((e, i) => e.node.setSiblingIndex(i));
    }

    private updateVpoint(dt: number, s: number): void {
        if (this.vpTimer.tick(dt, this.vpInterval)) {
            this.targetX = random(427, 1173);
            this.vpInterval = random(3, 5);
        }
        const step = Math.min(s * 13, 400) * dt, dx = this.targetX - this.vpX;
        this.vpX += Math.abs(dx) <= step ? dx : Math.sign(dx) * step;
    }

    private spawnWaydot(y: number): void {
        const w = new Waydot(this.vpX, y);
        const r = new Entity(this.roadLayer, 'sider').attach(w, 0.5, 230);
        const l = new Entity(this.roadLayer, 'sider2').attach(w, -0.5, 230);
        r.fadeIn = l.fadeIn = 0.3;
        this.waydots.push(w);
        this.buoys.push(r, l);
    }

    private dropDeadWaydots(): void {
        // Initial waydots die in reverse creation order, so remove dead ones anywhere in the list.
        for (let i = this.waydots.length - 1; i >= 0; i--) if (this.waydots[i].dead) this.waydots.splice(i, 1);
        this.buoys.forEach((b) => b.follow());
        this.buoys = prune(this.buoys);
    }

    private updateBuildings(dt: number, s: number): void {
        for (let set = 0; set < 2; set++) {
            if (!this.buildTimers[set].tick(dt, (1 / s) * this.buildFactor[set])) continue;
            this.buildFactor[set] = random(5, 10);
            this.spawnBuilding(set);
        }
        this.buildings.forEach((b) => b.follow());
        this.buildings = prune(this.buildings);
    }

    /** Spawned at the waydot origin (§6.8); the frame origin (ox≈1.8–2.9) pushes the image to the side, mirror flips it. */
    private spawnBuilding(set: number): void {
        const b = new Entity(this.buildingsLayer, 'Buildings', randomInt(7));
        b.mirror = set === 1;
        b.attach(this.newest, 0, 30);
        this.buildings.push(b);
    }
}
