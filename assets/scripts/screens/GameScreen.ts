import { Component, Node, _decorator } from 'cc';
import { GameApp } from '../core/GameApp';
import { Input } from '../core/Input';
import { Sfx } from '../core/Sfx';
import { GameState } from '../core/Save';
import { Hud } from '../game/Hud';
import { ResultPopup } from '../game/ResultPopup';
import { World } from '../game/World';

const { ccclass } = _decorator;

/** Gameplay screen: builds the layer tree (§6) and drives the World simulation. */
@ccclass('GameScreen')
export class GameScreen extends Component {
    private world!: World;
    private hud!: Hud;
    private worldRoot!: Node;

    onLoad(): void {
        Input.bind();
        Input.clear();
        this.worldRoot = this.child(this.node, 'worldRoot');
        const bg = this.child(this.worldRoot, 'bgLayer');
        const buildings = this.child(this.worldRoot, 'buildingsLayer');
        const game = this.child(this.worldRoot, 'gameLayer');
        const ground = this.child(game, 'groundLayer');
        const road = this.child(game, 'roadLayer');
        const fx = this.child(game, 'fxLayer');
        const ui = this.child(this.node, 'uiLayer');
        const popupLayer = this.child(this.node, 'popupLayer');

        const goMenu = () => GameApp.instance.go('Menu');
        this.hud = new Hud(ui, goMenu);
        const popup = new ResultPopup(popupLayer, goMenu, () => GameApp.instance.go('Game'));
        this.world = new World({ bg, buildings, ground, road, fx, ui }, this.hud, {
            onDamage: () => this.scheduleOnce(() => {
                this.world.removePlayer();
                popup.show(this.world.result());
            }, 3),
        });
        this.world.cam.apply(this.worldRoot);
    }

    update(dt: number): void {
        this.world.update(Math.min(dt, 1 / 30));
        this.world.cam.apply(this.worldRoot);
        this.hud.refresh(GameState.cash, this.world.score, this.world.distance);
    }

    onDestroy(): void {
        Sfx.stopEngine();
        Input.clear();
    }

    private child(parent: Node, name: string): Node {
        const n = new Node(name);
        n.layer = parent.layer;
        parent.addChild(n);
        return n;
    }
}
