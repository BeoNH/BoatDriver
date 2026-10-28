// Helper toán học giống Construct 3 (lerp, anglelerp, random, choose...) để port công thức 1:1.

export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

/** Nội suy góc (độ) theo đường ngắn nhất, như C3 anglelerp. */
export function anglelerp(a: number, b: number, t: number): number {
    let diff = (b - a) % 360;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return a + diff * t;
}

/** random(n) → [0,n); random(a,b) → [a,b). */
export function random(a: number, b?: number): number {
    return b === undefined ? Math.random() * a : a + Math.random() * (b - a);
}

export function randomInt(n: number): number {
    return Math.floor(Math.random() * n);
}

export function choose<T>(...items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.hypot(x2 - x1, y2 - y1);
}

/** Âm lượng C3 (dB) → linear, clamp [0,1]. */
export function dbToLinear(db: number): number {
    return Math.max(0, Math.min(1, Math.pow(10, db / 20)));
}

/** Timer kiểu C3 "Every X seconds": tick(dt, interval) trả về true khi tới hạn. */
export class Every {
    private acc = 0;
    tick(dt: number, interval: number): boolean {
        this.acc += dt;
        if (this.acc >= interval) {
            this.acc = Math.max(0, this.acc - interval);
            if (this.acc > interval) this.acc = 0;
            return true;
        }
        return false;
    }
    reset(): void { this.acc = 0; }
}
