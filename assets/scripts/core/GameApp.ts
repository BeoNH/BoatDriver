import { Camera, Canvas, Color, Component, Node, Prefab, Rect, instantiate, macro, screen, view, _decorator } from 'cc';
import { SCREEN_H, SCREEN_W } from '../data/GameConfig';
import { NetworkManager, urlParam } from './NetworkManager';
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
    private mainCam: Camera | null = null;
    private lastWinW = 0;
    private lastWinH = 0;

    onLoad(): void {
        GameApp.instance = this;
        // Ép landscape: web mobile cầm dọc thì engine xoay frame (pal screen-adapter isFrameRotated, touch được map lại).
        view.setOrientation(macro.ORIENTATION_LANDSCAPE);
        // Node con tạo runtime: AudioSource không dính vào Canvas của scene (an toàn khi save lúc đang Game View).
        const audioHost = new Node('Audio');
        this.node.addChild(audioHost);
        Sfx.init(audioHost);
        this.setupLetterbox();
        GameState.load();
        this.login();
        Res.loadAll().then(() => {
            this.ready = true;
            this.go(this.pending ?? 'Menu');
        }).catch((e) => console.error('[GameApp] load resources failed', e));
    }

    /** Không chặn vào Menu: lỗi/không có token thì chơi offline, userName rỗng. */
    private async login(): Promise<void> {
        const login = await NetworkManager.instance.httpPost("/login", { token: urlParam("token") });
        if (login) GameState.userName = login.username ?? '';
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

    /**
     * SHOW_ALL của Cocos 3.8 chỉ scale/căn giữa, render target vẫn phủ cả cửa sổ nên vùng ngoài 854×480 lộ nội dung.
     * Bản C3 gốc letterbox = viền đen: camera chính chỉ vẽ trong khung design (Camera.rect), 1 camera phụ clear đen toàn màn.
     */
    private setupLetterbox(): void {
        this.mainCam = this.getComponent(Canvas)?.cameraComponent ?? null;
        const n = new Node('LetterboxClear');
        this.node.addChild(n);
        const cam = n.addComponent(Camera);
        cam.projection = Camera.ProjectionType.ORTHO;
        cam.clearFlags = Camera.ClearFlag.SOLID_COLOR;
        cam.clearColor = new Color(0, 0, 0, 255);
        cam.visibility = 0; // không vẽ gì, chỉ clear đen
        cam.priority = (this.mainCam?.priority ?? 0) - 1;
    }

    lateUpdate(): void {
        const cam = this.mainCam;
        if (!cam) return;
        const ws = screen.windowSize;
        if (ws.width === this.lastWinW && ws.height === this.lastWinH) return;
        this.lastWinW = ws.width;
        this.lastWinH = ws.height;
        // Khung design chiếm bao nhiêu phần cửa sổ (windowSize ở không gian đã xoay -> khớp oriented viewport).
        const scale = Math.min(ws.width / SCREEN_W, ws.height / SCREEN_H);
        const fw = Math.min(1, (SCREEN_W * scale) / ws.width);
        const fh = Math.min(1, (SCREEN_H * scale) / ws.height);
        cam.rect = new Rect((1 - fw) / 2, (1 - fh) / 2, fw, fh);
        cam.orthoHeight = SCREEN_H / 2; // Canvas set theo cả cửa sổ; viewport nay đúng bằng khung nên 1 đơn vị = 1 design px
    }
}
