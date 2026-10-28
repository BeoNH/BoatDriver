# Migration: code-built → prefab + Component (Cocos chuẩn)

Mục tiêu: mọi node hiển thị đến từ prefab (layout chỉnh được trong editor), logic trong `@ccclass` với `@property`,
object spawn liên tục đi qua pool. **Hành vi giữ 1:1 theo GAME_SPEC** — không đổi công thức, thứ tự update, toạ độ C3.

## Quyết định kiến trúc
- **Manager-driven update**: chỉ `GameScreen.update` là Cocos `update`; `World` gọi `tick(dt)` xuống theo thứ tự §6.2–§6.10.
  Component entity KHÔNG tự `update()` (tránh phụ thuộc thứ tự node).
- **Prefab bake, không vẽ tay**: dựng node bằng script editor (MCP `mcpjs.sh scene`) từ `SPRITE_DEFS` + toạ độ hiện có,
  rồi `create_prefab_from_node`. Layout đúng tuyệt đối với bản code-built; chỉnh tay sau nếu muốn.
- Prefab ở `assets/prefabs/` (không qua `resources`), tham chiếu bằng `@property(Prefab)`:
  `GameApp` → screen prefabs; `GameScreen` → entity prefabs.
- `SPRITE_DEFS` giữ nguyên cho collision box/origin và đổi frame runtime.
- Pool: `core/Pool.ts` bọc `NodePool` theo prefab; `Entity.destroy()` → trả pool.
- Vẫn giữ toạ độ C3 (`placeC3`, y xuống) trong logic.

## Phân vai
| Vai | Việc |
|---|---|
| Opus (main) | plan, review spike, review cuối mỗi phase, quyết định khi lệch spec |
| cocos-coder (Sonnet) | TS component/pool, bake script, wire `@property` qua MCP |
| cocos-tester (Sonnet) | baseline trước migration, regression sau mỗi phase (so screenshot + flow) |
| chore (Haiku) | cập nhật CLAUDE.md / `.claude/map`, xoá helper chết |

## Plan
### Phase 0 — chuẩn bị (song song)
- [x] T000 tester — Baseline: screenshot Menu (boat 0 + đổi boat), Game (đầu ván, có enemy/bag/shield), ResultPopup;
      ghi flow + số liệu (tốc độ, score/distance sau ~10s) → `docs/reference/baseline/`.
- [x] S001 coder — Spike bake: script tạo 1 node `BG` có Sprite (spriteFrame theo uuid), anchor/size từ SPRITE_DEFS,
      lưu `assets/prefabs/_spike.prefab`, instantiate runtime hiển thị đúng. Báo cáo API dùng được + vướng mắc. **Gate: Opus duyệt.**

### Phase 1 — pool + spawn abstraction (chưa prefab)
- [x] T101 coder — `core/Pool.ts` (`Pool.get(key, factory)`, `Pool.put(node)`); `Entity` nhận Node từ factory thay vì `makeSprite`;
      `destroy()` trả pool (reset opacity/scale/frame). Áp cho Cars(enemy), CashPickiUp, sider/sider2, Buildings, Explosion, particles, label `+n`.
      verify: tsc; tester chơi 3 ván, so baseline.
- [x] T102 coder — `core/FrameAnim.ts` (`@property def` (tên SPRITE_DEFS — mỗi frame khác size/origin nên đổi qua `setSpriteFrame`, không dùng mảng SpriteFrame), `fps`, `loop`; `speed`, `play/stop`, `tick(dt)` do World/Fx gọi,
      `onFrame` callback; KHÔNG tự `update`). Thay frame-stepping tay: water Game (`fps 15 × S`), water Menu, Explosion (`age*15`, dừng frame 6).
      Giữ đúng công thức floor/modulo hiện tại. Không dùng DragonBones (asset là chuỗi PNG, không skeletal). verify: tsc; tester so baseline.

### Phase 2 — bake prefab + Component hoá (theo màn)
- [x] T201 coder — bake lib dùng chung `.claude/tools/bake/` (sprite/label/rect node theo opts như UIKit).
- [ ] T202 coder — `MenuScreen.prefab` + `MenuScreen` dùng `@property` (water, cars, btnPlay, btnBuy, priceTxt, cashTxt, bestTxt…). Dep T201.
- [ ] T203 coder — `Hud.prefab` + `ResultPopup.prefab` thành Component. Dep T201. (song song T202 được)
- [ ] T204 coder — Entity prefabs (Cars, CashPickiUp, shieldIcon, Shield, sider, sider2, Buildings, Explosion, particle) + `EntityView`;
      factory Phase 1 đổi sang `instantiate(prefab)`; prefab có anim gắn sẵn `FrameAnim` với frames đã điền. Dep T101, T102, T201.
- [ ] T205 coder — `GameScreen.prefab` (layer tree + BG/water) với `@property` tới Hud/Popup/entity prefabs; `GameApp` `@property` screen prefabs,
      wire trên Main.scene qua MCP. Dep T202–T204.
- [ ] T206 tester — regression toàn bộ vs baseline (layout pixel, flow Menu→Game→Popup→Restart/Menu, mua/chọn boat, save).

### Phase 3 — dọn
- [ ] T301 chore — xoá code dựng tay không còn dùng trong UIKit/screens; giữ `placeC3`, `setSpriteFrame`, `SinePulse` nếu còn dùng.
- [ ] T302 chore — cập nhật CLAUDE.md (Cấu trúc + Quy ước: prefab, pool, manager-driven update) và `.claude/map` nếu có.
- [ ] T303 Opus — review diff cuối.

## Rủi ro
- Rebake xoá + tạo lại prefab → đổi uuid. Bake là one-shot; sau khi wire `@property`, prefab là nguồn sự thật, chỉnh trong editor.
- Game View đứng frame khi editor ở nền → QA bằng browser preview `localhost:7456`.
- Sửa scene/prefab chỉ qua MCP; không sửa `.meta` tay.
- Label: font/lineHeight phải bake đúng như `makeLabel` (Arial bold, 1.2×) — lệch dễ nhất ở đây.
