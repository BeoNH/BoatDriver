import { Component, dynamicAtlasManager, Node, UITransform, _decorator } from 'cc';
import { SCREEN_H, SCREEN_W } from '../data/GameConfig';
import { GameScreen } from '../screens/GameScreen';
import { MenuScreen } from '../screens/MenuScreen';
import { Res } from './Res';
import { GameState } from './Save';
import { Sfx } from './Sfx';

const { ccclass } = _decorator;

export type ScreenName = 'Menu' | 'Game';

const SCREENS = { Menu: MenuScreen, Game: GameScreen };

/**
 * Entry component, gắn trên Canvas của Main.scene. Mỗi màn (C3 layout) là 1 node con 854×480 có gốc ở góc trên-trái
 * (anchor (0,1)) — con đặt theo toạ độ C3 qua UIKit.placeC3. Chuyển màn = huỷ node cũ, tạo node mới.
 */
@ccclass('GameApp')
export class GameApp extends Component {
    static instance: GameApp;
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
        const node = new Node(name);
        node.layer = this.node.layer;
        const ut = node.addComponent(UITransform);
        ut.setContentSize(SCREEN_W, SCREEN_H);
        ut.setAnchorPoint(0, 1);
        node.setPosition(-SCREEN_W / 2, SCREEN_H / 2, 0);
        this.node.addChild(node);
        this.current = node;
        node.addComponent(SCREENS[name] as any);
    }
}
