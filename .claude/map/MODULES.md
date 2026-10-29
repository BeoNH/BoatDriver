# BoatDriver — modules

## core — `assets/scripts/core/`
Role: hạ tầng dùng chung, không biết gameplay.
Key files: `GameApp.ts` (entry, chuyển màn, letterbox `lateUpdate`), `Res.ts` (preload `resources/textures|audio`, `frame(file)`, `audio(name)`),
`Save.ts` (`GameState` static cash/best/selectedBoat + `load/save/owns/setOwned`), `Sfx.ts` (oneShot + engine loop, dB→linear),
`Input.ts` (`Input` phím giữ, clear khi blur/hide; `HoldButton` multi-touch), `UIKit.ts` (`placeC3`, `setSpriteFrame(node, def, frame)`,
`setOpacity`, `onTap`, `SinePulse`), `Pool.ts` (pool node theo key, `clear()` khi rời màn), `FrameAnim.ts` (anim theo SPRITE_DEFS, owner `tick`),
`NetworkManager.ts` (singleton WS+HTTP; dùng `httpPost`, `urlParam`; file lớn, đọc theo offset), `C3.ts` (`Every`, `lerp`, `anglelerp`, `random`, `randomInt`, `choose`, `dbToLinear`).
Public API: `GameApp.instance.go('Menu'|'Game')`, `NetworkManager.instance.httpPost(path, body)`.
Depends on: data | Used by: screens, game
Gotchas: `Res` chỉ dùng được sau `loadAll` (GameApp chờ trước khi swap). `Pool` giữ node ngoài cây → leak nếu quên `clear`.

## screens — `assets/scripts/screens/`
Role: component trên root prefab màn (854×480, anchor (0,1)).
Key files: `MenuScreen.ts` (§4: chọn thuyền ←/→, Buy/Play, water anim, cash đỏ 0.5s khi thiếu tiền),
`GameScreen.ts` (layer `@property`, `entityPrefabs[]`, tạo Hud/Popup/World, `update` duy nhất của gameplay, `static owner` + `resetShared`).
Depends on: core, game, data | Used by: GameApp (qua prefab)
Gotchas: Restart → `onDestroy` màn cũ chạy SAU `onLoad` màn mới; chỉ owner được reset state tĩnh.
`entityPrefabs` phải gồm mọi def được `EntityPrefabs.create` (kể cả `Spray`, `BonusText`) — thiếu thì throw.

## game — `assets/scripts/game/`
Role: simulation (toạ độ C3) + view của màn chơi.
Key files:
- `World.ts` (344) — orchestrator; thứ tự update theo §6.2–§6.10; enemy, pickups, shield (12s, nhấp nháy từ 10s), collisions, damage/reward, audio, z-sort.
- `Road.ts` — vanishing point (vpX lerp tới target ngẫu nhiên 3–5s), waydots (spawn mỗi 0.5/s), buoys `sider`/`sider2`, buildings 2 phía. Quirk `FIRST_TICK_PUSH`.
- `Entities.ts` — `EntityPrefabs` registry, `Waydot` (data, move ∝ d²), `Entity` (sprite C3: attach/follow waydot, `box()`, `sync`, `detach`, `destroy`→Pool), `prune`, `OverlapTracker`, `overlap`.
- `Player.ts` — boat stats, steer (anglelerp ±8°), moveX kiểu 8Direction, `colider()`, `overtakeSensor()`, `touchesWall()`.
- `Camera.ts` — scroll/zoom, clamp layout 1600×480, `apply(worldRoot)`, `toScreen`, `viewBox`.
- `Fx.ts` — explosion (FrameAnim), bonus text (Pool key `label:bonus`), flying bag tới HUD, spray qua `Particles`.
- `Particles.ts` — pool particle cố định (node prefab `Spray`).
- `Hud.ts` — labels cash/score/distance, nút Menu, touch buttons (`HoldButton`, chỉ khi thiết bị có touch), `hideTouch`.
- `ResultPopup.ts` — `init(onMenu, onRestart)`, `show(ResultData)`.
Depends on: core, data | Used by: screens
Gotchas: không component gameplay nào tự `update`. Entity bị `detach()` thì owner mới phải `Pool.put`. Chỉ 1 enemy cùng lúc.

## data — `assets/scripts/data/`
Role: bảng tĩnh.
Key files: `GameConfig.ts` (BOAT_STATS, BOAT_PRICES, BOAT_COUNT, SCREEN_W/H), `SpriteDefs.ts` (generated — không sửa số liệu).
Used by: core, game, screens

## tooling — `.claude/tools/`, `.claude/agents/`, `docs/`
- `bake/` — dựng prefab từ `specs/<Name>.js` (`bake.sh`, `bake.py`, `lib.js`, README). One-shot.
- `mcp.sh`, `mcpjs.sh` — gọi MCP Funplay khi phiên chưa nạp; `tsc.sh` — type-check assets/.
- `docs/GAME_SPEC.md` (spec, §0–§7), `docs/MIGRATION_PREFAB.md`, `docs/reference/` (ảnh bản gốc để so).
- `extensions/funplay-cocos-mcp/` — plugin editor bên thứ 3 (untracked), bỏ qua.
