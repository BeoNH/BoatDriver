import { Component, _decorator } from 'cc';
import { SPRITE_DEFS } from '../data/SpriteDefs';
import { setSpriteFrame } from './UIKit';

const { ccclass, property } = _decorator;

/**
 * Animation theo frame của một def trong SPRITE_DEFS. Không có update(): owner gọi tick(dt) / setTime()
 * để giữ đúng thứ tự update của simulation. setSpriteFrame giữ nguyên scale của node.
 */
@ccclass('FrameAnim')
export class FrameAnim extends Component {
    @property def = '';
    @property fps = 15;
    @property loop = true;

    speed = 1;
    /** Thời gian tính bằng frame (không wrap). */
    t = 0;
    onFrame?: (f: number) => void;
    private cur = -1;

    play(from = 0): void {
        this.t = from;
        this.cur = -1;
        this.apply();
    }

    setTime(frames: number): void {
        this.t = frames;
        this.apply();
    }

    tick(dt: number): void {
        this.t += dt * this.fps * this.speed;
        this.apply();
    }

    private apply(): void {
        const n = SPRITE_DEFS[this.def]?.frames.length ?? 0;
        if (n === 0) return;
        const i = Math.floor(this.t);
        const f = this.loop ? i % n : Math.min(n - 1, i);
        if (f === this.cur) return;
        this.cur = f;
        setSpriteFrame(this.node, this.def, f);
        this.onFrame?.(f);
    }
}
