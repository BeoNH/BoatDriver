import { sys } from 'cc';

const SAVE_KEY = 'Boat DriversaveData';

/** Biến global giữa các màn (C3 global vars) + persistence localStorage. Xem GAME_SPEC §2. */
export class GameState {
    static cash = 0;
    static best = 0;
    static selectedBoat = 0;
    static score = 0;
    private static dict: Record<string, number> = {};

    static load(): void {
        let raw: string | null = null;
        try { raw = sys.localStorage.getItem(SAVE_KEY); } catch { raw = null; }
        if (raw) {
            try { this.dict = JSON.parse(raw) ?? {}; } catch { this.dict = {}; }
        }
        this.dict['Car0'] = 1;
        if (this.dict['Cash'] !== undefined) this.cash = Number(this.dict['Cash']) || 0;
        if (this.dict['Best'] !== undefined) this.best = Number(this.dict['Best']) || 0;
        if (this.dict['SelectedCar'] !== undefined) this.selectedBoat = Number(this.dict['SelectedCar']) || 0;
    }

    static owns(boat: number): boolean {
        return this.dict['Car' + boat] !== undefined;
    }

    static setOwned(boat: number): void {
        this.dict['Car' + boat] = 1;
    }

    /** Ghi các biến hiện tại vào dictionary rồi lưu toàn bộ. */
    static save(): void {
        this.dict['Cash'] = this.cash;
        this.dict['Best'] = this.best;
        this.dict['SelectedCar'] = this.selectedBoat;
        try { sys.localStorage.setItem(SAVE_KEY, JSON.stringify(this.dict)); } catch { /* storage bị chặn */ }
    }
}
