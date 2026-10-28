import { AudioClip, resources, SpriteFrame } from 'cc';

/** Preload toàn bộ resources/textures + resources/audio, truy cập đồng bộ sau khi load. */
export class Res {
    static async loadAll(onProgress?: (ratio: number) => void): Promise<void> {
        const dirs: [string, typeof SpriteFrame | typeof AudioClip][] = [['textures', SpriteFrame], ['audio', AudioClip]];
        let done = 0;
        for (const [dir, type] of dirs) {
            await new Promise<void>((resolve, reject) => {
                resources.loadDir(dir, type as any,
                    (finished, total) => onProgress?.((done + (total ? finished / total : 1)) / dirs.length),
                    (err) => (err ? reject(err) : resolve()));
            });
            done++;
        }
    }

    /** file = tên png không đuôi trong resources/textures (vd 'Cars_3'). */
    static frame(file: string): SpriteFrame | null {
        return resources.get(`textures/${file}/spriteFrame`, SpriteFrame);
    }

    static audio(name: string): AudioClip | null {
        return resources.get(`audio/${name}`, AudioClip);
    }
}
