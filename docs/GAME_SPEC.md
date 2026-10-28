# Boat Driver — Game Spec (port từ bản Construct 3 gốc)

Nguồn: decompile `data.json` (event sheets GameSheet/Menu/LevelSelect) của bản HTML5 gốc. Đã loại bỏ: ads SDK
(gamemonetize/IMA), analytics, AJAX ra ngoài, cheats, service worker. Ở dưới, **"C3"** = toạ độ gốc: pixel layout,
gốc trên-trái, **y hướng xuống**, góc dương = **chiều kim đồng hồ**. Code Cocos giữ simulation trong toạ độ C3 rồi
convert khi render: `node.setPosition(x, -y)`, `node.angle = -c3Angle`.

## 0. Endless (bản Cocos)
Game chỉ còn **endless**: đã bỏ level, LevelSelect, Map/MapMark, FinishLine (và state GameOn=2, cheer, nút restart frame 1).
Luồng: Menu `btn_play` → Game trực tiếp (như Random mode gốc, `RandomLvl=1` cố định). `Level`, `RandomLvl`, `Progress`,
bảng `mps` không còn dùng (key `Progress` cũ trong save được bỏ qua). Các mục bên dưới ghi "(đã bỏ — endless)" chỉ để tham khảo bản gốc.

Viewport 854×480 landscape. Âm lượng gốc tính bằng dB → linear `10^(dB/20)` (clamp ≤ 1).

## 1. Assets

- Texture: `assets/resources/textures/<Object>[_<frame>].png`. Metadata (kích thước gốc w/h, origin ox/oy 0..1 y-down,
  image points) ở `assets/scripts/data/SpriteDefs.ts` (generated). Cocos anchor = `(ox, 1 - oy)` (có thể ngoài 0..1, vd
  Buildings ox≈1.8–2.9 → hợp lệ). Size node = `w×h`, scale C3 `SetScale(k)` ⇒ `node.scale = (k·mirror, k)`;
  kích thước va chạm = `w·k × h·k`.
- Audio: `assets/resources/audio/{carmove,crash,pointup,cash,explosion,1ding}.ogg`.
- Font: system Arial **bold**, trắng, viền nhẹ không bắt buộc. Cỡ chữ gốc 21.75 (UI), 26.25 (số level), 24 (+10 bay).

## 2. Save data (localStorage)

Key `"Boat DriversaveData"`, JSON object (Dictionary): `Car0..Car5` (=1 nếu đã sở hữu; `Car0` luôn được thêm khi vào
Menu), `Cash`, `Best`, `Progress`, `SelectedCar`. Ghi lại toàn bộ object mỗi lần save.
Biến global giữa các màn: `Cash=0, Best=0, Progress=1, Selected_Car=0, Level=1, RandomLvl=0, Score=0`.
Load ở Menu start: nếu có key → nạp Cash/Best/Progress/SelectedCar.

## 3. Bảng dữ liệu

Thuyền (`Selected_Car` = frame `Cars_<n>`), giá (price.txt): `[0,150,400,600,800,1200]`

| n | Aceleration | MaxSpeed | Brake | Turning |
|---|---|---|---|---|
| 0 | 0.2 | 3 | 0.8 | 400 |
| 1 | 0.2 | 4 | 1 | 400 |
| 2 | 0.8 | 4 | 2 | 400 |
| 3 | 0.5 | 5 | 3 | 800 |
| 4 | 0.5 | 5 | 2 | 400 |
| 5 | 0.6 | 6 | 2 | 400 |

`mps` theo Level (1..20): `2, 1.8, 1.7, 1.6, 1.5, 1.2, 1, 0.8, 0.6, 0.5, 0.5, 0.5, 0.4, 0.4, 0.4, 0.3, 0.3, 0.2, 0.2, 0.2`.
Level 0 (endless/Random) giữ mps = 1 nhưng không có Map → không bao giờ về đích.

## 4. Menu (854×480, không scroll)

Vị trí C3 (x,y) = vị trí origin; size = kích thước hiển thị.
- `BG` (-2,-2) 860×486 origin top-left. `water` (381,258) 1605×217, opacity 0.75, anim 14 frame 15fps loop.
- `Cars` preview (425,408) 127.8×171.8, frame = Selected_Car.
- `Title` (433,135) 355×111.6, **Sine size**: ±25 px, chu kỳ 1 s.
- `btn_play` (428,248) 80×80, Sine size ±5 px chu kỳ 0.5 s. `btn_buy` (427,248) 196×51. `PriceTxt` (387,248) căn trái.
- `btn_left` (261,385) 71×77, `btn_right` (592,385) 71×77 (Sine tắt).
- Top bar: `UIbar` (428,26) 861×51; `Logo` (422,25) 128×27; `dollerIcon` (121.5,25) 25.5×16.4 góc -20.8° (C3 339.2°);
  `CashTxt` (146,26) căn trái; `Txt "Best"` tâm (621,25); `BestTxt` (674,25) căn trái.

Logic:
- Start: stop all audio, add `Car0=1`, load save.
- `btn_right`: Selected_Car = (n<5 ? n+1 : 0). `btn_left`: (n>0 ? n-1 : 5). (delay 0.1 s như gốc — tuỳ chọn)
- Sở hữu (`Car<n>` có trong save) → hiện `btn_play`, ẩn `btn_buy`+`PriceTxt`. Chưa sở hữu → ngược lại, PriceTxt = giá.
- `btn_buy`: Cash ≥ giá → `Car<n>=1`, Cash -= giá, save (Cash, SelectedCar), sound `cash`. Không đủ → CashTxt đỏ
  (255,0,0) 0.5 s rồi trắng.
- `btn_play` → save SelectedCar, sang Game (LevelSelect đã bỏ — endless).

## 5. LevelSelect (854×480) (đã bỏ — endless)

- `BG` như Menu; `Dark` overlay đen alpha 150/255 phủ toàn màn.
- 20 nút `Lvl` 77×78: hàng 1 y=128 x=128..704 step 96 (ID 1–7); hàng 2 y=224 (ID 8–14); hàng 3 y=320 x=192..672
  (ID 15–20). ID ≤ Progress → frame 1 (mở, hiện số ID bằng label 26.25 trắng ở tâm); ngược lại frame 0 (khoá, không số).
- `btn_Random` (416,413) 149×65 — chỉ hiện khi Progress > 20 → Game với `RandomLvl=1, Level=0`.
- Nút back `Btn_restart` frame 1 lật ngang (64,416) 75×75 → Menu.
- Tap level mở → Game với `Level=ID, RandomLvl=0`. Start: stop all audio.

## 6. Game — layout 1600×480, camera

Layer (dưới → trên): **BG** (BG ảnh 904×486 tại (-1,-2) và (886,-2) origin top-left; `water` tại (802,264) size
1604×194, origin (0.5,-0.1108), opacity 0.75, anim fps = `SpeedGloble*15`) → **Buildings** → **Game** (mọi object
đường đua, Explosion, text +10) → **UI** (cố định màn hình, không zoom) → **Popup**.

Camera (áp cho BG/Buildings/Game): zoom `CamZoom`; scroll (tâm view) mỗi tick
`scroll = lerp(scroll, player.(x,y), 5*dt)`; clamp để view nằm trong layout:
`sx ∈ [viewW/(2z), 1600 - viewW/(2z)]`, `sy ∈ [viewH/(2z), 480 - viewH/(2z)]`. Màn hình = `(p - scroll)*z + view/2`.
Khởi đầu scroll = vị trí player (không lerp frame đầu).

### 6.1 Biến (reset khi vào Game)
`GameOn=1` (1 chơi, 0 thua, 2 về đích), `SpeedGloble(S)=1`, `PowerUp=0` (0 none, 2 shield), `Score=0`,
`DistanceMeter=0`, `CamZoom=1.2`, `CamDelay=0`, `SpawnCarTimer=0`, `LastSpawnedCar=none`, `StartWait=0` → sau 1 s = 1.
Stats thuyền theo bảng §3. `Vpoint` = (706, 288).

### 6.2 Vanishing point & waydots (đường đua giả 3D)
- `Vpoint` di chuyển ngang tới targetX với tốc độ `min(S*13, 400)` px/s, dừng khi tới. Mỗi `random(3,5)` s (random lại
  mỗi lần): `targetX = random(427, 1173)`. Vpoint.y luôn 288.
- `waydot` (vô hình, frame gốc 1300×20, origin giữa; image point 1 = (1,0.5) mép phải, 2 = (0,0.5) mép trái):
  - Start: tạo 20 cái tại `(Vpoint.x, 288 + 8 + ((i+1)/3)^2)`, i=0..19.
  - Mỗi `0.5/S` s: tạo 1 cái tại `(Vpoint.x, 290)`.
  - **Quirk C3 bắt buộc giữ**: Bullet tick trước event nên frame đầu waydot mới chạy ở speed mặc định 400 px/s →
    mọi waydot spawn trong lúc chơi xuất hiện thêm `+400/60 ≈ 6.67` px. 20 cái đầu (tạo lúc layout start) KHÔNG bị
    đẩy vì tick đầu của C3 có dt = 0 — nếu đẩy thì đầu game có ~3 s không có buoy hai bên. Vì vận tốc ∝ d², offset này quyết định mật độ
    buoy (đo ở bản gốc: sống ~7 s ở S=1, ~14 waydot cùng lúc).
  - Mỗi tick: `d = y - 288`; `vy = S * d*d/60` (đi thẳng xuống, x giữ nguyên lúc tạo); `scale = d/230`;
    width = 1300*scale. `y > 490` → huỷ (huỷ kèm buoy + mọi object bám vào).
  - "Waydot mới nhất" = cái tạo sau cùng (gần Vpoint nhất). "Count-5" = cái thứ 5 tính từ mới nhất.
- Buoy (`sider` ở image point 1, `sider2` ở image point 2 của waydot; mỗi waydot có 1 cặp, kể cả 20 cái đầu):
  scale `d/230`, fade-in 0.3 s, sprite 85×319 origin (0.506,0.549 / 0.542).

### 6.3 Player
- Sprite `Cars_<Selected_Car>`, origin theo frame. x khởi đầu 705; `y = 435 - CamDelay` khi GameOn=1.
  scale = `(y - 288)/230` (mọi Cars, mỗi tick).
- `colider`: hộp `0.8*carW × 40` tâm tại origin player. `OverTakeSensor`: hộp `(0.8*carW + 100) × 20` tâm tại origin.
- Lái ngang (chỉ khi GameOn=1), kiểu 8Direction trục X: maxSpeed 1000, accel = Turning, decel 500
  (nếu input ngược chiều vận tốc: dùng accel+decel; không input: giảm về 0 với decel).
  - Phải (→ / D / touch rightTurn): input +1; `angle = anglelerp(angle, 8, 2dt)`.
  - Trái (← / A / touch LeftTurn): input -1; `angle = anglelerp(angle, -8, 2dt)`.
  - Không nhấn ← → và không touch trái/phải: `angle = anglelerp(angle, 0, 2dt)` (gốc: A/D không tính ở đây — giữ).
  - Tường: x bị chặn trong `[46.5 + colW/2, 1564.5 - colW/2]` (colW = 0.8*carW).
- Tốc độ (GameOn=1):
  - Ga (↑ / W / touch accele): `S = lerp(S, MaxSpeed, Aceleration*dt)`, `CamDelay = lerp(CamDelay, 40, 2dt)`,
    `CamZoom = lerp(CamZoom, 1.1, 2dt)`.
  - Phanh (↓ / S / touch Brake): `S = lerp(S, 1, Brake*dt)`, `CamDelay→1 (4dt)`, `CamZoom→1.2 (2dt)`.
  - Không ga (kể cả đang phanh): `S = lerp(S, 1, 0.2dt)`, `CamDelay→1 (1dt)`, `CamZoom→1.2 (1dt)`.
- Touch controls (UI, chỉ hiện trên mobile; desktop huỷ): LeftTurn (105,407) 95×104, rightTurn (224,407) 95×104,
  Brake (643,404) 106×118, accele (776,383) 103×164. Opacity 100% khi đang chạm, 75% khi không. "Đang chạm" = có
  pointer đang giữ trên nút (multi-touch).

### 6.4 Điểm, tiến độ
- Mỗi 0.1 s khi GameOn=1: `2 < S < 4` → Score += 1; `S ≥ 4` → Score += 5.
- Mỗi `1/S` s khi GameOn=1: DistanceMeter += 1.
- (đã bỏ — endless) Map (UI): `Map` (21,260.7) 32×274 origin (0.219,0.5); `MapMark` (22,384) 20×13 origin (0,0.538).
  Mỗi `1/S` s khi GameOn=1 và S>2 và MapMark.y ≥ 139: `MapMark.y -= mps`.
  Khi MapMark.y < 139 (1 lần) → **FinishLine**: spawn `Finishline` gắn vào waydot mới nhất (đi theo nó).
- Endless: không có Map/MapMark/FinishLine; LevelTxt = `"<DistanceMeter>m"`.

### 6.5 Thuyền địch (`Cars` MyCar=0)
- Spawn khi: S > 2.7, SpawnCarTimer ≤ 0, StartWait=1, và (không có LastSpawnedCar hoặc nó.y ≥ 300).
  SpawnCarTimer -= dt chỉ khi S > 2.7. Sau spawn: `SpawnCarTimer = 10/S + random(0,3)`.
  Spawn tại waydot mới nhất, frame ngẫu nhiên 0..5, lane = choose(1,0,-1), fade-in 0.2 s.
- Mỗi tick: `x = waydot.x + lane*waydot.width/3`, `y = waydot.y`; scale `(y-288)/230`.
- Huỷ khi: waydot của nó huỷ; ra ngoài màn hình; width < 1.5. **Tối đa 1 địch cùng lúc** (cái thứ 2 bị huỷ ngay).
- Vượt: OverTakeSensor *bắt đầu* chạm địch, khi S>2, GameOn=1, PowerUp=0 → **Bonus(10)** + sound `pointup`.
- Đâm (GameOn=1, PowerUp=0): colider chồng địch **và** `enemy.y - 6 < player.y ≤ enemy.y + 6` → **damage**.
- Shield (PowerUp=2) hoặc GameOn=2: colider chồng địch và cửa sổ ±8 → địch nổ (**EneDestroy**) + Bonus(10).
- **Bonus(n)**: Cash += n; text `"+n"` xanh lá (0,255,0) cỡ 24 tại (colider.x, 240) layer Game, bay lên 100 px/s,
  fade-out 1 s rồi huỷ.
- **EneDestroy**: Explosion tại vị trí địch, huỷ địch, sound `explosion`. Explosion: 7 frame 15 fps không loop,
  scale `(y-288)/150`, bay ra xa Vpoint với tốc độ `S * distance(Vpoint, pos)` theo hướng Vpoint→pos, luôn trên cùng,
  fade-out 0.6 s rồi huỷ.

### 6.6 Va chạm môi trường (GameOn=1)
- Buoy: colider chồng buoy và `buoy.y - 6 < player.y ≤ buoy.y + 6` → damage (shield KHÔNG bảo vệ).
- Tường: colider cách tường ≤ 10 px (chồng với offset ±10) và S > 3 → damage.

### 6.7 Pickup
- Tiền (`CashPickiUp` frame 1 = túi tiền, +10): mỗi 15 s khi S>2, GameOn=1, StartWait=1 → spawn ở waydot mới nhất,
  lane choose(1,0,-1), `x = waydot.x + lane*waydot.width/4`, scale `(y-288)/230`, fade-in 0.2 s.
  colider bắt đầu chạm → +10 Cash, sound `pointup` (-10 dB); túi bay về icon tiền trên UI (800 px/s) và fade-out 2 s.
  (frame 0 = +1 / `1ding` — không spawn trong bản gốc.) Huỷ khi y > 490 hoặc waydot huỷ.
- Shield icon: mỗi 20 s khi S>2, GameOn=1, StartWait=1 → spawn ở waydot thứ 5 từ mới nhất, lane choose(-1,0,1), offset
  width/4, scale `(y-288)/230`. Tối đa 1 icon. colider chạm → huỷ icon, sound `1ding` (-10 dB), nếu PowerUp=0 và
  GameOn=1: PowerUp=2, tạo `Shield` (380×355, origin (0.502,0.694)) bám player (vị trí + scale `(y-288)/230`, vẽ
  ngay trên player); sau 10 s nhấp nháy (0.05 on/0.05 off) 2 s → huỷ, PowerUp=0.

### 6.8 Cảnh nền
- Buildings (layer Buildings, đi theo waydot mới nhất lúc spawn): 2 bộ spawn độc lập, mỗi bộ mỗi
  `(1/S)*random(5,10)` s; frame random 0..6; bộ 1 không lật, bộ 2 lật ngang (sang phía bên kia đường). Scale
  `(y-288)/30`. Huỷ khi y>490 hoặc waydot huỷ. Thứ tự vẽ: sort theo khoảng cách tới Vpoint tăng dần, cái sau đè cái trước.
- Z-order layer Game: OnRoad (địch, player, buoy, tiền, shield icon) sort theo y tăng dần (y lớn vẽ trên).
- Bọt nước (particles `watpar`) tại player: rate `S*20`/s, tốc độ đầu `100 + S*60`, 3 hướng (sau, trái-sau, phải-sau),
  hạt trắng mờ, sống ~0.5 s. Mức độ trung thực: chỉ cần hiệu ứng tương đương.

### 6.9 Âm thanh
- Engine `carmove` loop: bắt đầu khi S>0.5 & GameOn=1 (1 lần). Volume dB = `1 - S/2` (clamp linear ≤1).
  (Playback rate gốc `0.8 + S/8` — bỏ qua nếu engine không hỗ trợ.) GameOn=2: volume dB → lerp tới -30 (0.2dt).
  damage → stop.
- `crash` khi damage; `victory` khi về đích.

### 6.10 Kết thúc
- **damage** (chỉ khi player còn): GameOn=0; reward = round(Score/20); Cash += reward; save Cash; ẩn touch controls;
  sound `crash`, stop engine. Player: tắt lái, lao thẳng xuống 3000 px/s. S → lerp(S,1,0.5dt). Sau 3 s: huỷ player,
  nút restart = frame 0 (chơi lại), hiện Popup; Best = max(Best, Score) + save.
- **FinishLinedone** (đã bỏ — endless): khi Finishline.y > 400 lần đầu & GameOn=1: GameOn=2; reward như trên; save; ẩn touch controls; **cheer**
  (pháo giấy 2 bên Finishline); sound `victory`; S → lerp(S,1,1dt), player thẳng góc (0.7dt), không điều khiển;
  sau 2 s: stop engine, nút restart = frame 1 (tiếp → LevelSelect), hiện Popup; nếu Level ≥ Progress: Progress += 1
  + save; Best = max(Best, Score) + save.
- Finishline (đã bỏ — endless): 396×187, origin (0.5,0.92), scale `(y-288)/55`, đi theo waydot; huỷ khi y > 490.

### 6.11 HUD & Popup
- HUD (UI): `UIbar` (428,25) 861×51; `Btn_Menu` (35,30) 55×53 → Menu; `dollerIcon` (124,24) 26.5×17 góc -20.8°;
  `CashTxt` (156,26) căn trái = Cash; `Txt "Score :"` (584,23) căn trái; `ScoreTxt` (694,23) căn trái = Score;
  `LevelTxt` tâm (420,25) = `"<DistanceMeter>m"` (`"Level N"` đã bỏ — endless).
- Popup (ẩn lúc đầu): `Board` (415,266) 312×302; `"SCORE"` tâm (411,170); ScoreTxt tâm (411,226) = Score;
  BestTxt tâm (418,272) `"BEST   : N"` luôn hiện; `dollerIcon` (318,319) 39×25;
  `CashTxt` (354,318) căn trái = Cash; `RwCashTxt` (461,318) căn trái xanh lá = "+reward";
  `Btn_Menu` (353,389) 91×88 → Menu; `Btn_restart` (489,389) 89×89: luôn frame 0 → chơi lại (frame 1 → LevelSelect đã bỏ — endless).
  Nút popup có Sine size ±5 px chu kỳ 0.5 s. Click nút popup chỉ khi popup hiện.

## 7. Bỏ qua có chủ đích
Ads/timescale pause, cheats (booster PowerUp=1, intangible, cheat keys), NitroIcon/NitroFlame (chỉ cheat), zombie/blood
(asset thừa từ game gốc), WaterSplash/Explocion (không dùng trong event), AJAX price (đã nhúng bảng), log console.
