import { Component, Node, Prefab, instantiate, _decorator } from 'cc';
import { GameApp } from '../core/GameApp';
import { Input } from '../core/Input';
import { Pool } from '../core/Pool';
import { Sfx } from '../core/Sfx';
import { GameState } from '../core/Save';
import { EntityPrefabs } from '../game/Entities';
import { Hud } from '../game/Hud';
import { PausePopup } from '../game/PausePopup';
import { ResultPopup } from '../game/ResultPopup';
import { World } from '../game/World';

const { ccclass, property } = _decorator;

/** Gameplay screen: layer tree (§6) từ GameScreen.prefab; drives the World simulation. */
@ccclass('GameScreen')
export class GameScreen extends Component {
    @property(Node) worldRoot: Node = null!;
    @property(Node) bgLayer: Node = null!;
    @property(Node) buildingsLayer: Node = null!;
    @property(Node) groundLayer: Node = null!;
    @property(Node) roadLayer: Node = null!;
    @property(Node) fxLayer: Node = null!;
    @property(Node) uiLayer: Node = null!;
    @property(Node) popupLayer: Node = null!;
    @property(Node) water: Node = null!;
    @property(Prefab) hudPrefab: Prefab = null!;
    @property(Prefab) popupPrefab: Prefab = null!;
    @property(Prefab) pausePrefab: Prefab = null!;
    /** Cars, CashPickiUp, shieldIcon, Shield, sider, sider2, Buildings, Explosion, BonusText (key = tên prefab). */
    @property([Prefab]) entityPrefabs: Prefab[] = [];
    /** Màn Game đang sở hữu state tĩnh (Pool, EntityPrefabs, Input, engine). Restart: node cũ bị destroy trễ
     *  đến cuối frame nên onDestroy của nó chạy SAU onLoad của màn mới — chỉ owner mới được dọn. */
    private static owner: GameScreen | null = null;
    private world!: World;
    private hud!: Hud;
    private paused = false;
    private pausePopup!: PausePopup;
    private popup!: ResultPopup;

    onLoad(): void {
        GameScreen.owner = this;
        GameScreen.resetShared();
        EntityPrefabs.register(this.entityPrefabs);
        Input.bind();
        const goMenu = () => GameApp.instance.go('Menu');
        const hudNode = instantiate(this.hudPrefab);
        this.uiLayer.addChild(hudNode);
        this.hud = hudNode.getComponent(Hud)!;
        this.hud.init(() => this.onHudMenu());
        const popupNode = instantiate(this.popupPrefab);
        this.popupLayer.addChild(popupNode);
        const popup = popupNode.getComponent(ResultPopup)!;
        this.popup = popup;
        popup.init(goMenu, () => GameApp.instance.go('Game'));
        const pauseNode = instantiate(this.pausePrefab);
        this.popupLayer.addChild(pauseNode);
        this.pausePopup = pauseNode.getComponent(PausePopup)!;
        this.pausePopup.init(() => this.resume(), () => this.quitRun());
        this.world = new World({
            bg: this.bgLayer, buildings: this.buildingsLayer, ground: this.groundLayer,
            road: this.roadLayer, fx: this.fxLayer, ui: this.uiLayer, water: this.water,
        }, this.hud, {
            onDamage: () => this.scheduleOnce(() => {
                this.world.removePlayer();
                popup.show(this.world.result());
            }, 3),
        });
        this.world.cam.apply(this.worldRoot);
    }

    private onHudMenu(): void {
        if (!this.world.isPlaying) { GameApp.instance.go('Menu'); return; }
        if (this.paused) return;
        this.pause();
    }

    private pause(): void {
        this.paused = true;
        this.world.setEnginePaused(true);
        this.pausePopup.show();
    }

    private resume(): void {
        this.pausePopup.hide();
        this.paused = false;
        this.world.setEnginePaused(false);
    }

    /** NO: kết thúc lượt như thua (không crash), world giữ đóng băng sau popup kết quả. */
    private quitRun(): void {
        this.pausePopup.hide();
        this.world.quit();
        this.popup.show(this.world.result());
    }

    update(dt: number): void {
        if (!this.paused) {
            this.world.update(Math.min(dt, 1 / 30));
            this.world.cam.apply(this.worldRoot);
        }
        this.hud.refresh(GameState.cash, this.world.score, this.world.distance);
    }

    onDestroy(): void {
        if (GameScreen.owner !== this) return;
        GameScreen.owner = null;
        GameScreen.resetShared();
    }

    private static resetShared(): void {
        Sfx.stopEngine();
        Input.clear();
        Pool.clear();
        EntityPrefabs.clear();
    }
}
