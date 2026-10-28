import { Label, Node, sys } from 'cc';
import { HoldButton } from '../core/Input';
import { makeLabel, makeSprite, onTap, setOpacity } from '../core/UIKit';

const ICON_ANGLE = -20.8;

/** Fixed-to-screen HUD (§6.11) + mobile touch controls (§6.3). */
export class Hud {
    /** Screen position the picked-up cash bag flies to. */
    readonly dollarPos = { x: 124, y: 24 };
    private readonly cashTxt: Label;
    private readonly scoreTxt: Label;
    private readonly levelTxt: Label;
    private touch: Record<'left' | 'right' | 'brake' | 'accel', HoldButton> | null = null;

    constructor(layer: Node, onMenu: () => void) {
        makeSprite(layer, 'UIbar', 428, 25, { w: 861, h: 51 });
        onTap(makeSprite(layer, 'Btn_Menu', 35, 30, { w: 55, h: 53 }), onMenu);
        makeSprite(layer, 'dollerIcon', 124, 24, { w: 26.5, h: 17, angle: ICON_ANGLE });
        this.cashTxt = makeLabel(layer, '0', 156, 26);
        makeLabel(layer, 'Score :', 584, 23);
        this.scoreTxt = makeLabel(layer, '0', 694, 23);
        this.levelTxt = makeLabel(layer, '', 420, 25, { align: 'center' });
        if (sys.isMobile) this.buildTouch(layer);
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

    private buildTouch(layer: Node): void {
        const mk = (def: string, x: number, y: number, w: number, h: number) => new HoldButton(makeSprite(layer, def, x, y, { w, h, opacity: 0.75 }));
        this.touch = {
            left: mk('LeftTurn', 105, 407, 95, 104),
            right: mk('rightTurn', 224, 407, 95, 104),
            brake: mk('Brake', 643, 404, 106, 118),
            accel: mk('accele', 776, 383, 103, 164),
        };
    }

    private setText(lb: Label, s: string): void {
        if (lb.string !== s) lb.string = s;
    }
}
