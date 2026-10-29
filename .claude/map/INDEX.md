# BoatDriver — map
Port 1:1 game HTML5 Construct 3 "Boat Driver" sang Cocos Creator 3.8.7 (TS). Endless: Menu → Game. Không ads/network.
Stack: Cocos Creator 3.8.7, TS (strict=false) | Run: mở editor → preview `http://localhost:7456` | Type-check: `sh .claude/tools/tsc.sh` | Test: không có (QA = `cocos-tester`)

## Where things are
| Area | Path | Notes |
|---|---|---|
| Scene | `assets/scenes/Main.scene` | Canvas 854×480 + `GameApp`. Scene duy nhất, sửa qua MCP |
| Core | `assets/scripts/core/` | GameApp, Res, Save(GameState), NetworkManager, Sfx, Input, UIKit, Pool, FrameAnim, C3 |
| Screens | `assets/scripts/screens/` | `MenuScreen`, `GameScreen` (component trên root prefab màn) |
| Gameplay | `assets/scripts/game/` | `World` (sim), Road, Player, Entities, Camera, Fx, Particles, Hud, ResultPopup |
| Data | `assets/scripts/data/` | `GameConfig` (stats/giá thuyền), `SpriteDefs` (generated, 642 dòng) |
| Prefabs | `assets/prefabs/` | màn + UI + entity (root = sprite, tên = def) |
| Assets runtime | `assets/resources/textures`, `audio` | preload toàn bộ bởi `Res.loadAll` |
| Spec | `docs/GAME_SPEC.md` | **nguồn sự thật**; code tham chiếu §-số |
| Bake prefab | `.claude/tools/bake/` (`specs/<Name>.js`, `bake.sh`) | one-shot, rebake đổi uuid |
| Agents | `.claude/agents/` | `cocos-coder`, `cocos-tester` |
| MCP plugin | `extensions/funplay-cocos-mcp/` | bên thứ 3, untracked — không map, không sửa |

## Entry points
- `core/GameApp.ts` — component trên Canvas: ép landscape, letterbox (Camera.rect), `Sfx.init`, `GameState.load`, `login()` (async, không chặn), `Res.loadAll` → `go('Menu')`
- `screens/GameScreen.ts` — owner state tĩnh; `update(dt)` duy nhất của gameplay → `World.update`
- `screens/MenuScreen.ts` — chọn/mua thuyền, Play

## Key flows (details: ARCHITECTURE.md#flows)
- Boot: GameApp.onLoad → Res.loadAll → swap(Menu prefab)
- Play: Menu.onPlay → GameState.save → GameApp.go('Game') → GameScreen.onLoad (register prefabs, Hud, Popup, new World)
- Frame: GameScreen.update → World.update (road→player→score→enemy→pickups→shield→collisions→audio→water→cam→fx→sort) → cam.apply → hud.refresh
- Thua: World.damage → reward=score/20, save, POST /saveScore (nếu có userName) → hooks.onDamage → sau 3s removePlayer + popup.show(result())
- Restart/Menu: `GameApp.go(...)` (defer 1 frame, destroy màn cũ, instantiate mới)

## Conventions
- Logic trong toạ độ C3 (y xuống, góc CW); render `placeC3` / `setPosition(x,-y)`, `angle=-a`.
- Chỉ `GameScreen.update`/`MenuScreen.update` là Cocos update; `FrameAnim` không tự update (owner gọi `tick`). Ngoại lệ UI: `SinePulse`.
- Entity: `new Entity(parent, def, frame, x, y)` → Pool(key=def) + `EntityPrefabs.create(def)`; xoá bằng `destroy()` (trả pool).
- "Every X s" dùng `C3.Every.tick(dt, X)`; lerp theo dt; "On collision" = `OverlapTracker.begins`.
- Port đúng spec, không thêm cơ chế. Comment ghi `§x.y` của GAME_SPEC.
- State tĩnh (Pool, EntityPrefabs, Input) chỉ do `GameScreen.owner` dọn (destroy trễ khi Restart).
- Không tạo Texture2D/SpriteFrame runtime, không chỉnh engine global (`macro`, `dynamicAtlasManager`).

## Don't touch / generated
- `data/SpriteDefs.ts` (generated, không sửa số; generator không có trong repo)
- `*.meta`, `library/`, `temp/`, `extensions/`; scene chỉ sửa qua MCP; prefab đã wire → sửa trong editor/MCP, không rebake

## Where to find X
- Thêm entity mới → spec bake `.claude/tools/bake/specs/<Def>.js` (copy `CashPickiUp.js`) → bake → thêm vào `GameScreen.entityPrefabs` → `new Entity(layer, '<Def>')` trong World/Fx
- Thêm popup/UI → pattern `game/ResultPopup.ts` + `specs/ResultPopup.js`; instantiate trong `GameScreen.onLoad` vào `popupLayer`
- Thêm màn → prefab root 854×480 anchor(0,1) + `@property` trong `GameApp` + `ScreenName`
- Đổi chỉ số/giá thuyền → `data/GameConfig.ts`
- Save keys → `core/Save.ts` (`'Boat DriversaveData'`: Cash, Best, SelectedCar, Car<n>)
- Âm thanh → `Sfx.play('<file trong resources/audio>', dB)`; engine loop `Sfx.startEngine`
- Network: `core/NetworkManager` (HTTP+WS client; chỉ dùng HTTP `/login`, `/saveScore`). Login ở `GameApp.login`, lưu `GameState.userName`; saveScore ở `World.grantReward`. Fire-and-forget, không retry.
