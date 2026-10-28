import { Component, Label, Node, _decorator } from 'cc';
import { onTap } from '../core/UIKit';

const { ccclass, property } = _decorator;

export interface ResultData { score: number; cash: number; reward: number; best: number; }

/** End-of-run popup (§6.11); node ẩn tới khi show(). Cây node từ ResultPopup.prefab (spec: bake/specs/ResultPopup.js). */
@ccclass('ResultPopup')
export class ResultPopup extends Component {
    @property(Label) scoreTxt: Label = null!;
    @property(Label) bestTxt: Label = null!;
    @property(Label) cashTxt: Label = null!;
    @property(Label) rewardTxt: Label = null!;
    @property(Node) btnMenu: Node = null!;
    @property(Node) btnRestart: Node = null!;

    init(onMenu: () => void, onRestart: () => void): void {
        this.node.active = false;
        onTap(this.btnMenu, onMenu);
        onTap(this.btnRestart, onRestart);
    }

    show(d: ResultData): void {
        this.scoreTxt.string = `${d.score}`;
        this.bestTxt.string = `BEST   : ${d.best}`;
        this.cashTxt.string = `${d.cash}`;
        this.rewardTxt.string = `+${d.reward}`;
        this.node.active = true;
    }
}
