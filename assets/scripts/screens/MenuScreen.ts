import { Color, Component, Label, Node, _decorator } from 'cc';
import { BOAT_COUNT, BOAT_PRICES } from '../data/GameConfig';
import { SPRITE_DEFS } from '../data/SpriteDefs';
import { GameApp } from '../core/GameApp';
import { GameState } from '../core/Save';
import { Sfx } from '../core/Sfx';
import { SinePulse, makeLabel, makeSprite, onTap, setAdditive, setSpriteFrame } from '../core/UIKit';

const { ccclass } = _decorator;

const WATER_FRAMES = 14;
const WATER_FPS = 15;
const WATER_W = 1605;
const WATER_H = 217;
const RED = new Color(255, 0, 0, 255);

/** Màn Menu — GAME_SPEC §4. */
@ccclass('MenuScreen')
export class MenuScreen extends Component {
    private water!: Node;
    private cars!: Node;
    private btnPlay!: Node;
    private btnBuy!: Node;
    private priceTxt!: Label;
    private cashTxt!: Label;
    private bestTxt!: Label;
    private waterT = 0;
    private waterFrame = -1;
    private shownCash = -1;
    private shownBest = -1;

    onLoad(): void {
        Sfx.stopAll();
        GameState.load();
        this.buildUI();
        this.refreshBoat();
        this.updateWater(0);
    }

    private buildUI(): void {
        const root = this.node;
        makeSprite(root, 'BG', -2, -2, { w: 860, h: 486 });
        this.water = makeSprite(root, 'water', 381, 258, { w: WATER_W, h: WATER_H, opacity: 0.75 });
        setAdditive(this.water);
        this.cars = makeSprite(root, 'Cars', 425, 408, { w: 127.8, h: 171.8, frame: GameState.selectedBoat });
        makeSprite(root, 'Title', 433, 135, { w: 355, h: 111.6 }).addComponent(SinePulse).setup(25, 1);
        this.btnPlay = makeSprite(root, 'btn_play', 428, 248, { w: 80, h: 80 });
        this.btnPlay.addComponent(SinePulse).setup(5, 0.5);
        this.btnBuy = makeSprite(root, 'btn_buy', 427, 248, { w: 196, h: 51 });
        this.priceTxt = makeLabel(root, '', 387, 248);
        const left = makeSprite(root, 'btn_left', 261, 385, { w: 71, h: 77 });
        const right = makeSprite(root, 'btn_right', 592, 385, { w: 71, h: 77 });
        makeSprite(root, 'UIbar', 428, 26, { w: 861, h: 51 });
        makeSprite(root, 'Logo', 422, 25, { w: 128, h: 27 });
        makeSprite(root, 'dollerIcon', 121.5, 25, { w: 25.5, h: 16.4, angle: 339.2 });
        this.cashTxt = makeLabel(root, '', 146, 26);
        makeLabel(root, 'Best', 621, 25, { align: 'center' });
        this.bestTxt = makeLabel(root, '', 674, 25);

        onTap(left, () => this.changeBoat(GameState.selectedBoat > 0 ? GameState.selectedBoat - 1 : BOAT_COUNT - 1));
        onTap(right, () => this.changeBoat(GameState.selectedBoat < BOAT_COUNT - 1 ? GameState.selectedBoat + 1 : 0));
        onTap(this.btnPlay, () => this.onPlay());
        onTap(this.btnBuy, () => this.onBuy());
    }

    private changeBoat(n: number): void {
        GameState.selectedBoat = n;
        setSpriteFrame(this.cars, 'Cars', n);
        const fd = SPRITE_DEFS['Cars'].frames[n];
        this.cars.setScale(127.8 / fd.w, 171.8 / fd.h, 1);
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

    private updateWater(dt: number): void {
        this.waterT += dt;
        const f = Math.floor(this.waterT * WATER_FPS) % WATER_FRAMES;
        if (f === this.waterFrame) return;
        this.waterFrame = f;
        setSpriteFrame(this.water, 'water', f);
        const fd = SPRITE_DEFS['water'].frames[f];
        this.water.setScale(WATER_W / fd.w, WATER_H / fd.h, 1);
    }

    update(dt: number): void {
        this.updateWater(dt);
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
