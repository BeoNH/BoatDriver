import { Label, Node, _decorator } from 'cc';
import { PopupBase } from './PopupBase';

const { ccclass } = _decorator;

const p2 = (n: number) => (n < 10 ? '0' : '') + n;

/** Popup lịch sử chơi (POST /getHistory). Prefab: bake/specs/PopupHistory.js. */
@ccclass('PopupHistory')
export class PopupHistory extends PopupBase {
    protected readonly path = '/getHistory';

    protected onData(res: any): void { this.showItems(res?.history); }

    protected fillRow(row: Node, d: any): void {
        const set = (n: string, s: string) => { row.getChildByName(n)!.getComponent(Label)!.string = s; };
        set('date', PopupHistory.date(d?.date));
        set('time', d?.numTime === undefined || d?.numTime === null ? '-' : `${d.numTime}s`);
        set('score', PopupBase.txt(d?.numScore));
    }

    /** ISO → dd/MM/yyyy HH:mm (local). */
    private static date(iso: any): string {
        const t = iso ? new Date(iso) : null;
        if (!t || isNaN(t.getTime())) return '-';
        return `${p2(t.getDate())}/${p2(t.getMonth() + 1)}/${t.getFullYear()} ${p2(t.getHours())}:${p2(t.getMinutes())}`;
    }
}
