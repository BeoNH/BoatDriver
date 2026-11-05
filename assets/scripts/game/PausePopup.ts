import { Component, Node, _decorator } from 'cc';
import { onTap } from '../core/UIKit';

const { ccclass, property } = _decorator;

/** Popup "Do you want to continue?" khi pause; node ẩn tới khi show(). */
@ccclass('PausePopup')
export class PausePopup extends Component {
    @property(Node) btnYes: Node = null!;
    @property(Node) btnNo: Node = null!;

    init(onYes: () => void, onNo: () => void): void {
        this.node.active = false;
        onTap(this.btnYes, onYes);
        onTap(this.btnNo, onNo);
    }

    show(): void { this.node.active = true; }
    hide(): void { this.node.active = false; }
}
