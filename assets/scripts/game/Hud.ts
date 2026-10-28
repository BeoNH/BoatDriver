import { Component, Label, Node, _decorator, sys } from 'cc';
import { HoldButton } from '../core/Input';
import { onTap, setOpacity } from '../core/UIKit';

const { ccclass, property } = _decorator;

/** Fixed-to-screen HUD (§6.11) + mobile touch controls (§6.3). Cây node từ Hud.prefab (spec: bake/specs/Hud.js). */
@ccclass('Hud')
export class Hud extends Component {
    /** Screen position the picked-up cash bag flies to. */
    readonly dollarPos = { x: 124, y: 24 };
    @property(Node) btnMenu: Node = null!;
    @property(Label) cashTxt: Label = null!;
    @property(Label) scoreTxt: Label = null!;
    @property(Label) levelTxt: Label = null!;
    @property(Node) leftBtn: Node = null!;
    @property(Node) rightBtn: Node = null!;
    @property(Node) brakeBtn: Node = null!;
    @property(Node) accelBtn: Node = null!;
    private touch: Record<'left' | 'right' | 'brake' | 'accel', HoldButton> | null = null;

    /** Gọi ngay sau instantiate (trước/sau onLoad đều được). */
    init(onMenu: () => void): void {
        onTap(this.btnMenu, onMenu);
        if (sys.isMobile) {
            this.touch = {
                left: new HoldButton(this.leftBtn),
                right: new HoldButton(this.rightBtn),
                brake: new HoldButton(this.brakeBtn),
                accel: new HoldButton(this.accelBtn),
            };
        } else {
            for (const n of [this.leftBtn, this.rightBtn, this.brakeBtn, this.accelBtn]) n.active = false;
        }
        this.refresh(0, 0, 0);
    }

    refresh(cash: number, score: number, distance: number): void {
        this.setText(this.cashTxt, `${cash}`);
        this.setText(this.scoreTxt, `${score}`);
        this.setText(this.levelTxt, `${distance}m`);
        if (this.touch) {
            for (const b of this.touchButtons()) setOpacity(b.node, b.held ? 1 : 0.75);
        }
    }

    get left(): boolean { return !!this.touch?.left.held; }
    get right(): boolean { return !!this.touch?.right.held; }
    get brake(): boolean { return !!this.touch?.brake.held; }
    get accel(): boolean { return !!this.touch?.accel.held; }

    private touchButtons(): HoldButton[] {
        const t = this.touch;
        return t ? [t.left, t.right, t.brake, t.accel] : [];
    }

    hideTouch(): void {
        if (!this.touch) return;
        for (const b of this.touchButtons()) b.node.active = false;
    }

    private setText(lb: Label, s: string): void {
        if (lb.string !== s) lb.string = s;
    }
}
