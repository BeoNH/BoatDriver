# BoatDriver — Cocos Creator 3.8.7 / TypeScript

Port 1:1 game "Boat Driver" (bản HTML5 Construct 3) sang Cocos. **Nguồn sự thật: [docs/GAME_SPEC.md](docs/GAME_SPEC.md)**.
Không ads / analytics / network / URL ngoài.

## Cấu trúc
- `assets/scenes/Main.scene` — Canvas (854×480 fitHeight) + Camera UI_2D + component `GameApp`. Scene duy nhất.
- `assets/scripts/core/` — `GameApp` (chuyển màn), `Res` (preload resources), `Save` (`GameState` + localStorage),
  `Sfx` (audio), `Input` (phím giữ, `HoldButton` touch), `UIKit` (makeSprite/makeLabel/onTap/SinePulse theo toạ độ C3),
  `C3` (lerp, anglelerp, random, choose, `Every`).
- `assets/scripts/screens/` — `MenuScreen`, `GameScreen` (component gắn lên node màn 854×480). Game chỉ endless: Menu → Game, không level/LevelSelect/Finish.
- `assets/scripts/game/` — simulation + view của màn chơi (World, entities, HUD, popup).
- `assets/scripts/data/` — `GameConfig` (bảng), `SpriteDefs` (generated: size/origin/image point gốc — không sửa tay).
- `assets/resources/textures|audio` — load bằng `Res.frame('<file>')`, `Sfx.play('<name>', dB)`.

## Quy ước
- Mọi thứ dựng bằng code, không prefab. Node màn có gốc trên-trái; đặt con bằng `placeC3(node, x, y)` (y xuống).
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
