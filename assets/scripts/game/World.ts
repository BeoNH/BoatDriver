import { KeyCode, Node } from 'cc';
import { Every, choose, lerp, random, randomInt } from '../core/C3';
import { Input } from '../core/Input';
import { GameState } from '../core/Save';
import { Sfx } from '../core/Sfx';
import { makeSprite, setAdditive, setSpriteFrame } from '../core/UIKit';
import { SPRITE_DEFS } from '../data/SpriteDefs';
import { Camera } from './Camera';
import { Box, Entity, OverlapTracker, overlap, prune } from './Entities';
import { Fx } from './Fx';
import { Hud } from './Hud';
import { Controls, Player } from './Player';
import { ResultData } from './ResultPopup';
import { Road } from './Road';

export interface Layers { bg: Node; buildings: Node; ground: Node; road: Node; fx: Node; ui: Node; }
export interface WorldHooks { onDamage(): void; }

/** GameOn values (§6.1). */
const PLAYING = 1, LOST = 0;

/** Gameplay simulation in C3 coordinates; update order mirrors GAME_SPEC §6.2-§6.10. */
export class World {
    readonly cam = new Camera();
    readonly fx: Fx;
    private readonly road: Road;
    private player: Player | null;
    private shield: Entity | null = null;
    private enemy: Entity | null = null;
    private bags: Entity[] = [];
    private shieldIcon: Entity | null = null;
    private water: Node;
    private waterFrame = 0;
    private waterT = 0;

    gameOn = PLAYING;
    s = 1;
    powerUp = 0;
    score = 0;
    distance = 0;
    private camDelay = 0;
    private startWait = false;
    private clock = 0;
    private reward = 0;
    private shieldT = 0;
    private spawnCarTimer = 0;
    private engineOn = false;
    private engineDb = 0;

    private t = { score: new Every(), dist: new Every(), cash: new Every(), shield: new Every() };
    private overtake = new OverlapTracker();
    private cashHit = new OverlapTracker();
    private iconHit = new OverlapTracker();

    constructor(private layers: Layers, private hud: Hud, private hooks: WorldHooks) {
        makeSprite(layers.bg, 'BG', -1, -2, { w: 904, h: 486 });
        makeSprite(layers.bg, 'BG', 886, -2, { w: 904, h: 486 });
        this.water = makeSprite(layers.bg, 'water', 802, 264, { opacity: 0.75 });
        setAdditive(this.water);
        this.applyWaterFrame(0);
        this.road = new Road(layers.road, layers.buildings);
        this.player = new Player(layers.road, GameState.selectedBoat);
        this.fx = new Fx(layers.ground, layers.fx, layers.ui, hud.dollarPos);
        this.cam.snap(this.player.x, this.player.y);
        GameState.score = 0;
    }

    update(dt: number): void {
        this.clock += dt;
        if (!this.startWait && this.clock >= 1) this.startWait = true;
        this.road.update(dt, this.s);
        this.enemy?.follow();
        this.shieldIcon?.follow();
        this.updatePlayer(dt, this.readControls());
        this.updateScore(dt);
        this.updateEnemy(dt);
        this.spawnPickups(dt);
        this.updateShield(dt);
        this.checkCollisions();
        this.updateAudio(dt);
        this.updateWater(dt);
        if (this.player) this.cam.follow(this.player.x, this.player.y, dt);
        if (this.player && this.gameOn !== LOST) this.fx.emitSpray(dt, this.s, this.player.x, this.player.y);
        this.fx.update(dt, this.s, this.road.vpX);
        this.syncAndSort(dt);
    }

    /** Called 3 s after damage: the player disappears and the result is shown. */
    removePlayer(): void {
        this.player?.ent.destroy();
        this.shield?.destroy();
        this.player = null;
        this.shield = null;
    }

    /** Applies end-of-run persistence (§6.10) and returns the popup data. */
    result(): ResultData {
        GameState.score = this.score;
        GameState.best = Math.max(GameState.best, this.score);
        GameState.save();
        return { score: this.score, cash: GameState.cash, reward: this.reward, best: GameState.best };
    }

    // ---- §6.3 player ---------------------------------------------------------------------------------------------

    private readControls(): Controls {
        const k = (...c: KeyCode[]) => Input.isDown(...c);
        const arrowL = k(KeyCode.ARROW_LEFT), arrowR = k(KeyCode.ARROW_RIGHT);
        return {
            accel: k(KeyCode.ARROW_UP, KeyCode.KEY_W) || this.hud.accel,
            brake: k(KeyCode.ARROW_DOWN, KeyCode.KEY_S) || this.hud.brake,
            left: arrowL || k(KeyCode.KEY_A) || this.hud.left,
            right: arrowR || k(KeyCode.KEY_D) || this.hud.right,
            neutral: !arrowL && !arrowR && !this.hud.left && !this.hud.right,
        };
    }

    private updatePlayer(dt: number, c: Controls): void {
        const p = this.player;
        if (!p) { this.s = lerp(this.s, 1, 0.5 * dt); return; }
        if (this.gameOn === PLAYING) {
            this.updateSpeed(dt, c, p);
            p.steer(dt, c);
            p.ent.y = 435 - this.camDelay;
        } else if (this.gameOn === LOST) {
            this.s = lerp(this.s, 1, 0.5 * dt);
            p.coast(dt, 0);
            p.ent.y += 3000 * dt;
            p.ent.node.active = p.ent.y < 700;
        }
        p.updateScale();
    }

    private updateSpeed(dt: number, c: Controls, p: Player): void {
        const st = p.stats, cam = this.cam;
        if (c.accel) {
            this.s = lerp(this.s, st.maxSpeed, st.acceleration * dt);
            this.camDelay = lerp(this.camDelay, 40, 2 * dt);
            cam.zoom = lerp(cam.zoom, 1.1, 2 * dt);
        }
        if (c.brake) {
            this.s = lerp(this.s, 1, st.brake * dt);
            this.camDelay = lerp(this.camDelay, 1, 4 * dt);
            cam.zoom = lerp(cam.zoom, 1.2, 2 * dt);
        }
        if (!c.accel) {
            this.s = lerp(this.s, 1, 0.2 * dt);
            this.camDelay = lerp(this.camDelay, 1, dt);
            cam.zoom = lerp(cam.zoom, 1.2, dt);
        }
    }

    // ---- §6.4 score / distance -----------------------------------------------------------------------------------

    private updateScore(dt: number): void {
        const playing = this.gameOn === PLAYING;
        if (this.t.score.tick(dt, 0.1) && playing) {
            if (this.s >= 4) this.score += 5;
            else if (this.s > 2) this.score += 1;
        }
        if (this.t.dist.tick(dt, 1 / this.s) && playing) this.distance += 1;
    }

    // ---- §6.5 enemy ----------------------------------------------------------------------------------------------

    private updateEnemy(dt: number): void {
        const fast = this.s > 2.7;
        if (fast) this.spawnCarTimer -= dt;
        const last = this.enemy;
        if (fast && this.spawnCarTimer <= 0 && this.startWait && (!last || !last.alive || last.y >= 300)) {
            this.spawnCarTimer = 10 / this.s + random(0, 3);
            if (!last?.alive) this.spawnEnemy(); // a second enemy would be destroyed immediately in the original
        }
        const e = this.enemy;
        if (!e) return;
        if ((e.waydot && e.waydot.width < 1.5) || !overlap(e.box(), this.cam.viewBox())) e.alive = false;
        if (!e.alive) { e.destroy(); this.enemy = null; }
    }

    private spawnEnemy(): void {
        const e = new Entity(this.layers.road, 'Cars', randomInt(6));
        e.fadeIn = 0.2;
        e.attach(this.road.newest, choose(1, 0, -1) / 3, 230);
        this.enemy = e;
    }

    private destroyEnemy(e: Entity): void {
        this.fx.explode(e.x, e.y);
        e.destroy();
        this.enemy = null;
        Sfx.play('explosion');
    }

    private bonus(n: number): void {
        GameState.cash += n;
        if (this.player) this.fx.bonusText(this.player.x, n);
    }

    // ---- §6.7 pickups & shield -----------------------------------------------------------------------------------

    private spawnPickups(dt: number): void {
        const ready = this.s > 2 && this.gameOn === PLAYING && this.startWait;
        if (this.t.cash.tick(dt, 15) && ready) {
            const b = new Entity(this.layers.road, 'CashPickiUp', 1);
            b.fadeIn = 0.2;
            this.bags.push(b.attach(this.road.newest, choose(1, 0, -1) / 4, 230));
        }
        if (this.t.shield.tick(dt, 20) && ready && !this.shieldIcon?.alive) {
            const w = this.road.nth(5);
            if (w) this.shieldIcon = new Entity(this.layers.road, 'shieldIcon').attach(w, choose(-1, 0, 1) / 4, 230);
        }
        this.bags.forEach((b) => b.follow());
        this.bags = prune(this.bags);
        if (this.shieldIcon && !this.shieldIcon.alive) { this.shieldIcon.destroy(); this.shieldIcon = null; }
    }

    private collectBag(b: Entity): void {
        GameState.cash += 10;
        Sfx.play('pointup', -10);
        this.bags = this.bags.filter((x) => x !== b);
        const sc = this.cam.toScreen(b.x, b.y);
        this.fx.flyBag(b.node, sc.x, sc.y, b.scale * this.cam.zoom);
    }

    private collectShield(icon: Entity): void {
        icon.destroy();
        this.shieldIcon = null;
        Sfx.play('1ding', -10);
        if (this.powerUp !== 0 || this.gameOn !== PLAYING) return;
        this.powerUp = 2;
        this.shieldT = 0;
        this.shield = new Entity(this.layers.road, 'Shield');
        setAdditive(this.shield.node);
    }

    /** Shield follows the player; after 10 s it flickers (0.05 on/off) for 2 s, then expires. */
    private updateShield(dt: number): void {
        const sh = this.shield, p = this.player;
        if (!sh || !p) return;
        this.shieldT += dt;
        sh.x = p.x;
        sh.y = p.y;
        sh.scale = (p.y - 288) / 230;
        sh.alpha = this.shieldT >= 10 && Math.floor((this.shieldT - 10) / 0.05) % 2 === 1 ? 0 : 1;
        if (this.shieldT >= 12) {
            sh.destroy();
            this.shield = null;
            this.powerUp = 0;
        }
    }

    // ---- §6.5 / §6.6 collisions ----------------------------------------------------------------------------------

    private checkCollisions(): void {
        const p = this.player;
        if (!p) return;
        const col = p.colider(), e = this.enemy;
        const overtaken = this.overtake.begins(p.overtakeSensor(), e ? [e] : []);
        const bagHits = this.cashHit.begins(col, this.bags);
        const iconHits = this.iconHit.begins(col, this.shieldIcon ? [this.shieldIcon] : []);
        if (overtaken.length && this.gameOn === PLAYING && this.powerUp === 0 && this.s > 2) {
            this.bonus(10);
            Sfx.play('pointup');
        }
        if (e && e.alive && overlap(col, e.box())) this.hitEnemy(e, p);
        if (this.gameOn === PLAYING) this.hitEnvironment(p, col);
        bagHits.forEach((b) => this.collectBag(b));
        iconHits.forEach((i) => this.collectShield(i));
    }

    private hitEnemy(e: Entity, p: Player): void {
        const inWindow = (w: number) => e.y - w < p.y && p.y <= e.y + w;
        if (this.gameOn === PLAYING && this.powerUp === 0 && inWindow(6)) this.damage();
        else if (this.powerUp === 2 && this.gameOn !== LOST && inWindow(8)) {
            this.destroyEnemy(e);
            this.bonus(10);
        }
    }

    private hitEnvironment(p: Player, col: Box): void {
        for (const b of this.road.buoys) {
            if (!(b.y - 6 < p.y && p.y <= b.y + 6)) continue;
            if (overlap(col, b.box())) { this.damage(); return; }
        }
        if (this.s > 3 && p.touchesWall()) this.damage();
    }

    // ---- §6.10 end -----------------------------------------------------------------------------------------------

    private damage(): void {
        if (this.gameOn !== PLAYING) return;
        this.gameOn = LOST;
        this.grantReward();
        this.hud.hideTouch();
        Sfx.play('crash');
        Sfx.stopEngine();
        this.hooks.onDamage();
    }

    private grantReward(): void {
        this.reward = Math.round(this.score / 20);
        GameState.cash += this.reward;
        GameState.save();
    }

    // ---- §6.9 audio / water --------------------------------------------------------------------------------------

    private updateAudio(dt: number): void {
        if (this.gameOn === PLAYING) {
            if (!this.engineOn && this.s > 0.5) { this.engineOn = true; Sfx.startEngine(); }
            this.engineDb = 1 - this.s / 2;
        }
        if (this.engineOn && this.gameOn !== LOST) Sfx.setEngineVolumeDb(this.engineDb);
    }

    private updateWater(dt: number): void {
        this.waterT += dt * this.s * 15;
        const f = Math.floor(this.waterT) % SPRITE_DEFS['water'].frames.length;
        if (f !== this.waterFrame) this.applyWaterFrame(f);
    }

    /** Fixed 1604x194 display size regardless of the frame's own size. */
    private applyWaterFrame(f: number): void {
        this.waterFrame = f;
        setSpriteFrame(this.water, 'water', f);
        const fd = SPRITE_DEFS['water'].frames[f];
        this.water.setScale(1604 / fd.w, 194 / fd.h, 1);
    }

    // ---- rendering sync ------------------------------------------------------------------------------------------

    /** §6.8 z-order: OnRoad sorted by y ascending, Shield right above the player. */
    private syncAndSort(dt: number): void {
        const road: Entity[] = [...this.road.buoys, ...this.bags];
        if (this.player) road.push(this.player.ent);
        if (this.enemy) road.push(this.enemy);
        if (this.shieldIcon) road.push(this.shieldIcon);
        road.sort((a, b) => a.y - b.y);
        let i = 0;
        for (const e of road) {
            e.sync(dt);
            e.node.setSiblingIndex(i++);
            if (this.shield && this.player && e === this.player.ent) {
                this.shield.sync(dt);
                this.shield.node.setSiblingIndex(i++);
            }
        }
        this.road.buildings.forEach((b) => b.sync(dt));
        this.road.sortBuildings();
    }
}
