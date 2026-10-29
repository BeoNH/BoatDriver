import { Color, Label, Node, Sprite, _decorator } from 'cc';
import { GameState } from '../core/Save';
import { PopupBase } from './PopupBase';

const { ccclass, property } = _decorator;

const ROW_COLOR = new Color(120, 84, 64, 255);
const SELF_COLOR = new Color(230, 140, 40, 255);
const MEDALS = [new Color(255, 200, 40, 255), new Color(200, 205, 215, 255), new Color(210, 130, 60, 255)];
const NAME_MAX = 15;

/** Popup bảng xếp hạng (POST /getRankList). Prefab: bake/specs/PopupRank.js. */
@ccclass('PopupRank')
export class PopupRank extends PopupBase {
    @property(Node) yourInfo: Node = null!;
    @property(Label) yourRank: Label = null!;
    @property(Label) yourName: Label = null!;
    @property(Label) yourScore: Label = null!;
    protected readonly path = '/getRankList';

    protected reset(): void { this.yourInfo.active = false; }

    protected onData(res: any): void {
        this.showItems(res?.board);
        const y = res?.yourInfo;
        this.yourInfo.active = !!y;
        if (y) {
            this.yourRank.string = PopupBase.txt(y.rank);
            this.yourName.string = PopupRank.cut(PopupBase.txt(y.name));
            this.yourScore.string = PopupBase.txt(y.numScore);
        }
    }

    protected fillRow(row: Node, d: any, i: number): void {
        const name = d?.name;
        row.getComponent(Sprite)!.color = name !== undefined && name === GameState.userName ? SELF_COLOR : ROW_COLOR;
        const medal = row.getChildByName('medal')!;
        medal.active = i < 3;
        if (i < 3) medal.getComponent(Sprite)!.color = MEDALS[i];
        row.getChildByName('rank')!.getComponent(Label)!.string = String(i + 1);
        row.getChildByName('name')!.getComponent(Label)!.string = PopupRank.cut(PopupBase.txt(name));
        row.getChildByName('score')!.getComponent(Label)!.string = PopupBase.txt(d?.numScore);
    }

    private static cut(s: string): string {
        return s.length > NAME_MAX ? s.slice(0, NAME_MAX) + '...' : s;
    }
}
