import { Color, Label, Node } from 'cc';
import { makeLabel, makeSprite, onTap, SinePulse } from '../core/UIKit';

export interface ResultData { score: number; cash: number; reward: number; best: number; }

/** End-of-run popup (§6.11); hidden until show(). */
export class ResultPopup {
    private readonly scoreTxt: Label;
    private readonly bestTxt: Label;
    private readonly cashTxt: Label;
    private readonly rewardTxt: Label;
    private readonly restart: Node;

    constructor(private layer: Node, onMenu: () => void, onRestart: () => void) {
        layer.active = false;
        makeSprite(layer, 'Board', 415, 266, { w: 312, h: 302 });
        makeLabel(layer, 'SCORE', 411, 170, { align: 'center', size: 26.25 });
        this.scoreTxt = makeLabel(layer, '0', 411, 226, { align: 'center', size: 36 });
        this.bestTxt = makeLabel(layer, '', 418, 272, { align: 'center' });
        makeSprite(layer, 'dollerIcon', 318, 319, { w: 39, h: 25 });
        this.cashTxt = makeLabel(layer, '0', 354, 318);
        this.rewardTxt = makeLabel(layer, '', 461, 318, { color: new Color(0, 255, 0) });
        const menu = makeSprite(layer, 'Btn_Menu', 353, 389, { w: 91, h: 88 });
        onTap(menu, onMenu);
        menu.addComponent(SinePulse).setup(5, 0.5);
        this.restart = makeSprite(layer, 'Btn_restart', 489, 389, { w: 89, h: 89 });
        onTap(this.restart, onRestart);
        this.restart.addComponent(SinePulse).setup(5, 0.5);
    }

    show(d: ResultData): void {
        this.scoreTxt.string = `${d.score}`;
        this.bestTxt.string = `BEST   : ${d.best}`;
        this.cashTxt.string = `${d.cash}`;
        this.rewardTxt.string = `+${d.reward}`;
        this.layer.active = true;
    }
}
