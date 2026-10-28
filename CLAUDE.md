# BoatDriver — Cocos Creator 3.8.7 / TypeScript

Port 1:1 game "Boat Driver" (bản HTML5 Construct 3) sang Cocos. **Nguồn sự thật: [docs/GAME_SPEC.md](docs/GAME_SPEC.md)**.
Không ads / analytics / network / URL ngoài.

## Cấu trúc
- `assets/scenes/Main.scene` — Canvas (854×480 fitHeight) + Camera UI_2D + component `GameApp`
  (`@property menuPrefab/gamePrefab`). Scene duy nhất.
- `assets/prefabs/` — màn (`MenuScreen`, `GameScreen`), UI (`Hud`, `ResultPopup`), entity (`Cars`, `CashPickiUp`, `shieldIcon`,
  `Shield`, `sider`, `sider2`, `Buildings`, `Explosion`, `BonusText`). Entity prefab: root = sprite node, tên = def SPRITE_DEFS.
  `assets/materials/additive.mtl` (water, Shield).
- `assets/scripts/core/` — `GameApp` (instantiate màn), `Res` (preload resources), `Save` (`GameState` + localStorage),
  `Sfx` (audio), `Input` (phím giữ, `HoldButton` touch), `UIKit` (placeC3/setSpriteFrame/setOpacity/onTap/SinePulse),
  `Pool` (tái dùng node theo key), `FrameAnim` (anim chuỗi frame theo SPRITE_DEFS, owner gọi `tick`),
  `C3` (lerp, anglelerp, random, choose, `Every`).
- `assets/scripts/screens/` — `MenuScreen`, `GameScreen` (component trên root prefab 854×480 anchor (0,1)). Game chỉ endless: Menu → Game, không level/LevelSelect/Finish.
- `assets/scripts/game/` — simulation + view của màn chơi (World, entities + `EntityPrefabs` registry, Hud, ResultPopup).
- `assets/scripts/data/` — `GameConfig` (bảng), `SpriteDefs` (generated từ C3: size/origin/image point gốc — không sửa số liệu; đã lọc def level/không dùng, generator không có trong repo).
- `assets/resources/textures|audio` — load bằng `Res.frame('<file>')`, `Sfx.play('<name>', dB)`.

## Quy ước
- Node hiển thị đến từ prefab; ref qua `@property`. Node màn có gốc trên-trái; đặt con bằng `placeC3(node, x, y)` (y xuống).
- Prefab mới: dựng bằng spec `.claude/tools/bake/specs/<Name>.js` + `sh .claude/tools/bake/bake.sh` (xem README).
  Bake = one-shot: rebake đổi uuid → mất ref đã wire. Prefab đã wire thì chỉnh trong editor/MCP.
- Entity mới: bake prefab tên = def, thêm vào `GameScreen.entityPrefabs`; spawn qua `new Entity(...)` (Pool + registry).
- Manager-driven update: chỉ `GameScreen.update` (và `MenuScreen`) là Cocos `update`; World gọi xuống theo thứ tự spec §6.
  Component gameplay (`FrameAnim`...) không tự `update`. Ngoại lệ: hiệu ứng UI thuần không ảnh hưởng gameplay (`SinePulse`).
- Không chỉnh engine toàn cục bằng code (`dynamicAtlasManager`, `macro`...). Không tạo Texture2D/SpriteFrame runtime — dùng asset.
- State tĩnh (Pool, EntityPrefabs, Input, engine) do `GameScreen.owner` quản: `destroy()` trễ cuối frame nên khi Restart
  `onDestroy` màn cũ chạy sau `onLoad` màn mới.
- Game logic chạy trong toạ độ C3 (y xuống, góc CW) rồi convert khi render (`setPosition(x,-y)`, `angle=-a`).
- Port công thức đúng như spec (lerp theo dt, "Every X s" dùng `Every`). Không tự thêm cơ chế.
- Không sửa `.meta`, `library/`, `temp/`. Scene chỉ sửa qua MCP.

## Công cụ
- Cocos editor phải mở project (MCP Funplay port 21458, profile **full** 106 tools). Phiên mới nạp qua `.mcp.json`;
  trong phiên chưa nạp: `sh .claude/tools/mcp.sh <tool> '<json>'`, `sh .claude/tools/mcpjs.sh <scene|editor> f.js`.
- Type-check: `sh .claude/tools/tsc.sh` (chỉ in lỗi trong assets/).
- Preview browser: `http://localhost:7456` (editor đang mở).

## Phân vai agent (tiết kiệm token)
- Opus (main): spec, kiến trúc, review, debug khó, quyết định.
- `cocos-coder` (Sonnet): implement module theo brief. **Không tự test gameplay.**
- `cocos-tester` (Sonnet): QA độc lập, read-only source, báo bug kèm repro.
- `scout` / `chore` (Haiku): tìm code, sửa cơ học đã chỉ rõ.
