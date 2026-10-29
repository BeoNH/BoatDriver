import { Component, Label, Layout, Node, ScrollView, _decorator, instantiate } from 'cc';
import { GameState } from '../core/Save';
import { NetworkManager } from '../core/NetworkManager';
import { onTap } from '../core/UIKit';

const { ccclass, property } = _decorator;

/** Base popup danh sách từ API portal (Rank/History): open → gọi API → fill list (tái dùng children của content). */
@ccclass('PopupBase')
export abstract class PopupBase extends Component {
    @property(Node) btnClose: Node = null!;
    @property(Label) statusTxt: Label = null!;
    @property(ScrollView) scroll: ScrollView = null!;
    @property(Node) content: Node = null!;
    @property(Node) itemTpl: Node = null!;
    private seq = 0;

    protected abstract readonly path: string;
    protected abstract onData(res: any): void;
    /** Điền 1 row (node đã active). */
    protected abstract fillRow(row: Node, d: any, i: number): void;
    /** Xoá dữ liệu phụ trước khi tải (vd. dải "your rank"). */
    protected reset(): void { }

    init(): void {
        this.node.active = false;
        this.itemTpl.active = false;
        onTap(this.btnClose, () => this.close());
    }

    open(): void {
        const seq = ++this.seq; // bỏ response của lần mở cũ
        this.node.active = true;
        this.reset();
        this.fill([]);
        if (!GameState.userName) { this.setStatus('OFFLINE'); return; }
        this.setStatus('LOADING...');
        NetworkManager.instance.httpPost(this.path, { username: GameState.userName }).then((res) => {
            if (seq !== this.seq || !this.node.active) return;
            this.onData(res);
        });
    }

    close(): void {
        this.seq++;
        this.node.active = false;
    }

    /** Hiện list; rỗng/không phải mảng → NO DATA. */
    protected showItems(items: any): void {
        const list = Array.isArray(items) ? items : [];
        this.fill(list);
        this.setStatus(list.length ? '' : 'NO DATA');
    }

    private setStatus(s: string): void {
        this.statusTxt.string = s;
        this.statusTxt.node.active = s !== '';
    }

    private fill(items: any[]): void {
        const c = this.content;
        for (let i = 0; i < items.length; i++) {
            let row = c.children[i];
            if (!row) { row = instantiate(this.itemTpl); row.setPosition(0, 0); c.addChild(row); } // tpl nằm ngoài content: bỏ x của nó
            row.active = true;
            this.fillRow(row, items[i], i);
        }
        for (let i = items.length; i < c.children.length; i++) c.children[i].active = false;
        c.getComponent(Layout)?.updateLayout();
        this.scroll.scrollToTop(0);
    }

    protected static txt(v: any): string {
        return v === undefined || v === null || v === '' ? '-' : String(v);
    }
}
