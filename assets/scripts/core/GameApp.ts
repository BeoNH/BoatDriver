import { Component, Node, Prefab, dynamicAtlasManager, instantiate, _decorator } from 'cc';
import { SCREEN_H, SCREEN_W } from '../data/GameConfig';
import { Res } from './Res';
import { GameState } from './Save';
import { Sfx } from './Sfx';

const { ccclass, property } = _decorator;

export type ScreenName = 'Menu' | 'Game';

/**
 * Entry component, gắn trên Canvas của Main.scene. Mỗi màn (C3 layout) là 1 prefab root 854×480 có gốc ở góc trên-trái
 * (anchor (0,1)) — con đặt theo toạ độ C3 qua UIKit.placeC3. Chuyển màn = huỷ node cũ, tạo node mới.
 */
@ccclass('GameApp')
export class GameApp extends Component {
    static instance: GameApp;
    @property(Prefab) menuPrefab: Prefab = null!;
    @property(Prefab) gamePrefab: Prefab = null!;
    private current: Node | null = null;
    private ready = false;
    private pending: ScreenName | null = null;

    onLoad(): void {
        GameApp.instance = this;
        // Dynamic atlas làm mất sprite ngẫu nhiên trong Game View của editor (có texture runtime); game nhỏ, tắt đi.
        dynamicAtlasManager.enabled = false;
        // Node con tạo runtime: AudioSource không dính vào Canvas của scene (an toàn khi save lúc đang Game View).
        const audioHost = new Node('Audio');
        this.node.addChild(audioHost);
        Sfx.init(audioHost);
        GameState.load();
        Res.loadAll().then(() => {
            this.ready = true;
            this.go(this.pending ?? 'Menu');
        }).catch((e) => console.error('[GameApp] load resources failed', e));
    }

    /** C3 "Go to layout" / "Restart layout" (gọi go với chính màn hiện tại). */
    go(name: ScreenName): void {
        if (!this.ready) { this.pending = name; return; }
        // Defer 1 frame: không huỷ node trong chính callback touch/update của nó.
        this.scheduleOnce(() => this.swap(name), 0);
    }

    private swap(name: ScreenName): void {
        this.current?.destroy();
        const node = instantiate(name === 'Menu' ? this.menuPrefab : this.gamePrefab);
        node.setPosition(-SCREEN_W / 2, SCREEN_H / 2, 0);
        this.node.addChild(node);
        this.current = node;
    }
}
