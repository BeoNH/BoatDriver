import { Node } from 'cc';
import { SCREEN_H, SCREEN_W } from '../data/GameConfig';
import { lerp } from '../core/C3';
import { Box } from './Entities';

export const LAYOUT_W = 1600;
export const LAYOUT_H = 480;

/** Layout camera (§6): scroll = view centre in C3 coords, zoom applied to world layers only. */
export class Camera {
    sx = 0;
    sy = 0;
    zoom = 1.2;

    snap(x: number, y: number): void {
        this.sx = x;
        this.sy = y;
        this.clamp();
    }

    follow(x: number, y: number, dt: number): void {
        this.sx = lerp(this.sx, x, 5 * dt);
        this.sy = lerp(this.sy, y, 5 * dt);
        this.clamp();
    }

    private clamp(): void {
        const hw = SCREEN_W / (2 * this.zoom), hh = SCREEN_H / (2 * this.zoom);
        this.sx = Math.max(hw, Math.min(LAYOUT_W - hw, this.sx));
        this.sy = Math.max(hh, Math.min(LAYOUT_H - hh, this.sy));
    }

    /** worldRoot sits under a top-left-origin screen node. */
    apply(worldRoot: Node): void {
        const z = this.zoom;
        worldRoot.setScale(z, z, 1);
        worldRoot.setPosition(SCREEN_W / 2 - this.sx * z, -(SCREEN_H / 2 - this.sy * z), 0);
    }

    toScreen(x: number, y: number): { x: number; y: number } {
        return { x: (x - this.sx) * this.zoom + SCREEN_W / 2, y: (y - this.sy) * this.zoom + SCREEN_H / 2 };
    }

    viewBox(): Box {
        const w = SCREEN_W / this.zoom, h = SCREEN_H / this.zoom;
        return { l: this.sx - w / 2, t: this.sy - h / 2, w, h };
    }
}
