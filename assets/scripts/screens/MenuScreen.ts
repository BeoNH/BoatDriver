import { Color, Component, Label, Node, _decorator } from 'cc';
import { BOAT_COUNT, BOAT_PRICES } from '../data/GameConfig';
import { SPRITE_DEFS } from '../data/SpriteDefs';
import { GameApp } from '../core/GameApp';
import { GameState } from '../core/Save';
import { FrameAnim } from '../core/FrameAnim';
import { Sfx } from '../core/Sfx';
import { onTap, setSpriteFrame } from '../core/UIKit';

const { ccclass, property } = _decorator;

const WATER_W = 1605;
const WATER_H = 217;
const RED = new Color(255, 0, 0, 255);

/** Màn Menu — GAME_SPEC §4. Cây node từ MenuScreen.prefab (bake spec: .claude/tools/bake/specs/MenuScreen.js). */
@ccclass('MenuScreen')
export class MenuScreen extends Component {
    @property(Node) water: Node = null!;
    @property(FrameAnim) waterAnim: FrameAnim = null!;
    @property(Node) cars: Node = null!;
    @property(Node) btnPlay: Node = null!;
    @property(Node) btnBuy: Node = null!;
    @property(Node) btnLeft: Node = null!;
    @property(Node) btnRight: Node = null!;
    @property(Label) priceTxt: Label = null!;
    @property(Label) cashTxt: Label = null!;
    @property(Label) bestTxt: Label = null!;
    private shownCash = -1;
    private shownBest = -1;

    onLoad(): void {
        Sfx.stopAll();
        GameState.load();
        this.waterAnim.onFrame = (f) => {
            const fd = SPRITE_DEFS['water'].frames[f];
            this.water.setScale(WATER_W / fd.w, WATER_H / fd.h, 1);
        };
        this.showBoat(GameState.selectedBoat);
        onTap(this.btnLeft, () => this.changeBoat(GameState.selectedBoat > 0 ? GameState.selectedBoat - 1 : BOAT_COUNT - 1));
        onTap(this.btnRight, () => this.changeBoat(GameState.selectedBoat < BOAT_COUNT - 1 ? GameState.selectedBoat + 1 : 0));
        onTap(this.btnPlay, () => this.onPlay());
        onTap(this.btnBuy, () => this.onBuy());
        this.refreshBoat();
        this.waterAnim.play(0);
    }

    private showBoat(n: number): void {
        setSpriteFrame(this.cars, 'Cars', n);
        const fd = SPRITE_DEFS['Cars'].frames[n];
        this.cars.setScale(127.8 / fd.w, 171.8 / fd.h, 1);
    }

    private changeBoat(n: number): void {
        GameState.selectedBoat = n;
        this.showBoat(n);
        this.refreshBoat();
    }

    /** Sở hữu → hiện Play; chưa → hiện Buy + giá. */
    private refreshBoat(): void {
        const n = GameState.selectedBoat;
        const owned = GameState.owns(n);
        this.btnPlay.active = owned;
        this.btnBuy.active = !owned;
        this.priceTxt.node.active = !owned;
        this.priceTxt.string = String(BOAT_PRICES[n]);
    }

    private onPlay(): void {
        if (!this.btnPlay.active) return;
        GameState.save();
        GameApp.instance.go('Game');
    }

    private onBuy(): void {
        if (!this.btnBuy.active) return;
        const n = GameState.selectedBoat;
        const price = BOAT_PRICES[n];
        if (GameState.cash >= price) {
            GameState.setOwned(n);
            GameState.cash -= price;
            GameState.save();
            Sfx.play('cash');
            this.refreshBoat();
        } else {
            this.cashTxt.color = RED;
            this.unschedule(this.resetCashColor);
            this.scheduleOnce(this.resetCashColor, 0.5);
        }
    }

    private resetCashColor(): void {
        this.cashTxt.color = Color.WHITE;
    }

    update(dt: number): void {
        this.waterAnim.tick(dt);
        if (GameState.cash !== this.shownCash) {
            this.shownCash = GameState.cash;
            this.cashTxt.string = String(GameState.cash);
        }
        if (GameState.best !== this.shownBest) {
            this.shownBest = GameState.best;
            this.bestTxt.string = String(GameState.best);
        }
    }
}
