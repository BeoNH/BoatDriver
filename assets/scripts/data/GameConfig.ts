// Bảng dữ liệu port từ game gốc — xem docs/GAME_SPEC.md §3.

export interface BoatStats { acceleration: number; maxSpeed: number; brake: number; turning: number; }

export const BOAT_STATS: BoatStats[] = [
    { acceleration: 0.2, maxSpeed: 3, brake: 0.8, turning: 400 },
    { acceleration: 0.2, maxSpeed: 4, brake: 1, turning: 400 },
    { acceleration: 0.8, maxSpeed: 4, brake: 2, turning: 400 },
    { acceleration: 0.5, maxSpeed: 5, brake: 3, turning: 800 },
    { acceleration: 0.5, maxSpeed: 5, brake: 2, turning: 400 },
    { acceleration: 0.6, maxSpeed: 6, brake: 2, turning: 400 },
];

export const BOAT_PRICES = [0, 150, 400, 600, 800, 1200];
export const BOAT_COUNT = BOAT_PRICES.length;

export const SCREEN_W = 854;
export const SCREEN_H = 480;
