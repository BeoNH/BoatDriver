import { Asset, AudioClip, resources, SpriteFrame } from 'cc';

/** Preload toàn bộ resources/textures + resources/audio, truy cập đồng bộ sau khi load. */
export class Res {
    static async loadAll(): Promise<void> {
        await loadDir('textures', SpriteFrame);
        await loadDir('audio', AudioClip);
    }

    /** file = tên png không đuôi trong resources/textures (vd 'Cars_3'). */
    static frame(file: string): SpriteFrame | null {
        return resources.get(`textures/${file}/spriteFrame`, SpriteFrame);
    }

    static audio(name: string): AudioClip | null {
        return resources.get(`audio/${name}`, AudioClip);
    }
}

function loadDir<T extends Asset>(dir: string, type: new (...a: any[]) => T): Promise<void> {
    return new Promise((resolve, reject) => {
        resources.loadDir(dir, type, null, (err) => (err ? reject(err) : resolve()));
    });
}
