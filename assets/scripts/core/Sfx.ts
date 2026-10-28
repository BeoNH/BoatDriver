import { AudioSource, Node } from 'cc';
import { dbToLinear } from './C3';
import { Res } from './Res';

/** Audio: one-shot SFX + 1 kênh loop cho engine (tag "Move2" của bản gốc). */
export class Sfx {
    private static oneShot: AudioSource | null = null;
    private static engine: AudioSource | null = null;

    static init(host: Node): void {
        this.oneShot = host.addComponent(AudioSource);
        this.engine = host.addComponent(AudioSource);
        this.engine.loop = true;
    }

    /** volumeDb theo C3 (0 = full, -10 = nhỏ hơn). */
    static play(name: string, volumeDb = 0): void {
        const clip = Res.audio(name);
        if (clip && this.oneShot) this.oneShot.playOneShot(clip, dbToLinear(volumeDb));
    }

    static startEngine(): void {
        const clip = Res.audio('carmove');
        if (!clip || !this.engine) return;
        this.engine.stop();
        this.engine.clip = clip;
        this.engine.play();
    }

    static setEngineVolumeDb(db: number): void {
        if (this.engine) this.engine.volume = dbToLinear(db);
    }

    static stopEngine(): void {
        this.engine?.stop();
    }

    static stopAll(): void {
        this.oneShot?.stop();
        this.engine?.stop();
    }
}
