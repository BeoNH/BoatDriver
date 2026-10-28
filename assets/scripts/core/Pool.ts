import { Node } from 'cc';

/**
 * Pool node theo key (def name, 'label:bonus'...). Node rảnh được giữ ngoài cây (đã removeFromParent)
 * nên PHẢI gọi Pool.clear() khi rời màn, nếu không sẽ leak. Caller tự reset trạng thái node sau get().
 */
export class Pool {
    private static free = new Map<string, Node[]>();

    /** Lấy node rảnh (hoặc factory()), addChild vào parent, active, layer = parent.layer. */
    static get(key: string, parent: Node, factory: () => Node): Node {
        const list = Pool.free.get(key);
        let node = list?.pop();
        while (node && !node.isValid) node = list!.pop();
        if (!node) node = factory();
        node.layer = parent.layer;
        parent.addChild(node);
        node.active = true;
        return node;
    }

    /** Trả node về pool (gỡ khỏi cây, không destroy). */
    static put(key: string, node: Node): void {
        if (!node.isValid) return;
        node.removeFromParent();
        let list = Pool.free.get(key);
        if (!list) Pool.free.set(key, list = []);
        list.push(node);
    }

    /** Destroy toàn bộ node đang rảnh. */
    static clear(): void {
        for (const list of Pool.free.values()) for (const n of list) if (n.isValid) n.destroy();
        Pool.free.clear();
    }
}
