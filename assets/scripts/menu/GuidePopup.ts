import { Component, Node, _decorator } from 'cc';
import { onTap } from '../core/UIKit';

const { ccclass, property } = _decorator;

/** Popup hướng dẫn chơi (nội dung tĩnh trong prefab); node ẩn tới khi open(). */
@ccclass('GuidePopup')
export class GuidePopup extends Component {
    @property(Node) btnClose: Node = null!;

    init(): void {
        this.node.active = false;
        onTap(this.btnClose, () => { this.node.active = false; });
    }

    open(): void { this.node.active = true; }
}
