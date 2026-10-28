import { EventKeyboard, EventTouch, input, Input as CCInput, KeyCode, Node } from 'cc';

/** Trạng thái phím giữ + nút touch đang giữ (C3 Keyboard.IsKeyDown / Touch.IsTouchingObject). */
export class Input {
    private static keys = new Set<KeyCode>();
    private static bound = false;

    static bind(): void {
        if (this.bound) return;
        this.bound = true;
        input.on(CCInput.EventType.KEY_DOWN, (e: EventKeyboard) => this.keys.add(e.keyCode));
        input.on(CCInput.EventType.KEY_UP, (e: EventKeyboard) => this.keys.delete(e.keyCode));
    }

    static isDown(...codes: KeyCode[]): boolean {
        return codes.some((c) => this.keys.has(c));
    }

    static clear(): void {
        this.keys.clear();
    }
}

/** Theo dõi các pointer đang giữ trên 1 node (multi-touch). */
export class HoldButton {
    private touches = new Set<number>();

    constructor(readonly node: Node) {
        node.on(Node.EventType.TOUCH_START, (e: EventTouch) => this.touches.add(e.getID()));
        node.on(Node.EventType.TOUCH_END, (e: EventTouch) => this.touches.delete(e.getID()));
        node.on(Node.EventType.TOUCH_CANCEL, (e: EventTouch) => this.touches.delete(e.getID()));
    }

    get held(): boolean {
        return this.node.isValid && this.node.active && this.touches.size > 0;
    }
}
