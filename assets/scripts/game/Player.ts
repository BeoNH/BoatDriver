import { Node } from 'cc';
import { anglelerp } from '../core/C3';
import { BOAT_STATS, BoatStats } from '../data/GameConfig';
import { Box, centeredBox, Entity, VP_Y } from './Entities';

export interface Controls { accel: boolean; brake: boolean; left: boolean; right: boolean; neutral: boolean; }

const WALL_L = 46.5;
const WALL_R = 1564.5;

/** The player boat (§6.3): sprite, 8Direction-style X movement, collision sensors. */
export class Player {
    readonly ent: Entity;
    readonly stats: BoatStats;
    private vx = 0;

    constructor(layer: Node, boat: number) {
        this.stats = BOAT_STATS[boat];
        this.ent = new Entity(layer, 'Cars', boat, 705, 435);
        this.updateScale();
    }

    get x(): number { return this.ent.x; }
    get y(): number { return this.ent.y; }
    get colWidth(): number { return 0.8 * this.ent.fd.w * this.ent.scale; }

    colider(): Box { return centeredBox(this.x, this.y, this.colWidth, 40); }
    overtakeSensor(): Box { return centeredBox(this.x, this.y, this.colWidth + 100, 20); }

    updateScale(): void { this.ent.scale = (this.ent.y - VP_Y) / 230; }

    /** Steering while GameOn=1. */
    steer(dt: number, c: Controls): void {
        const e = this.ent;
        if (c.right) e.angle = anglelerp(e.angle, 8, 2 * dt);
        if (c.left) e.angle = anglelerp(e.angle, -8, 2 * dt);
        if (c.neutral) e.angle = anglelerp(e.angle, 0, 2 * dt);
        this.moveX(dt, (c.right ? 1 : 0) - (c.left ? 1 : 0));
    }

    /** Controls disabled (GameOn != 1): velocity decays, no steering. */
    coast(dt: number, straightenRate: number): void {
        this.ent.angle = anglelerp(this.ent.angle, 0, straightenRate * dt);
        this.moveX(dt, 0);
    }

    /** 8Direction on X: maxSpeed 1000, accel = Turning, decel 500 (accel+decel when reversing). */
    private moveX(dt: number, dir: number): void {
        const decel = 500;
        if (dir !== 0) {
            const a = this.stats.turning + (this.vx * dir < 0 ? decel : 0);
            this.vx = Math.max(-1000, Math.min(1000, this.vx + dir * a * dt));
        } else {
            const d = decel * dt;
            this.vx = Math.abs(this.vx) <= d ? 0 : this.vx - Math.sign(this.vx) * d;
        }
        const half = this.colWidth / 2;
        this.ent.x = Math.max(WALL_L + half, Math.min(WALL_R - half, this.ent.x + this.vx * dt));
    }

    /** §6.6: distance from colider to either wall <= 10 px. */
    touchesWall(): boolean {
        const half = this.colWidth / 2;
        return this.x - half - WALL_L <= 10 || WALL_R - (this.x + half) <= 10;
    }
}
