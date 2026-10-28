# Baseline (code-built, trước migrate prefab) — T000
Preview http://localhost:7456, Chromium 854x480 (trang có toolbar editor ~45px phía trên; canvas ≈ 776x435 tại x=40,y=46, scale 0.906). Boat 0, phím ArrowUp giữ ga.

## Screenshots
- 01_menu_boat0.png — Menu, boat 0 (Play, cash/Best)
- 02_menu_boat1_locked.png — sau bấm right 1 lần: boat 1 khoá, nút Buy giá 150 (BOAT_PRICES[1])
- 02b_menu_back_boat0.png — bấm left quay lại boat 0
- 03_game_2s.png — Game ~2s đầu
- 04_game_10s_hold.png — ~10s giữ ga: cash 0, 22m, Score 62
- 05_game_try2.png (11m/17), 05_game_try4.png (17m/39) — enemy (thuyền buồm, tàu hàng, speedboat)
- 11_game_bag_pickup.png — money bag trước mặt (38m, cash 10); 12_game_enemy_cash_20.png — cash 20 sau nhặt, enemy gần
- 10_game_shield_176m.png — shield bubble quanh boat (176m, cash 97, Score 583)
- 07_popup_round0.png — ResultPopup (Score 160, BEST 160, cash 8, +8)
- 08_after_restart.png — sau Restart: ván mới 1m/0 score, cash giữ 37
- 09_menu_after_hud_menu.png — Menu sau nút Menu HUD: cash 37, Best 133

## Flow (đều OK)
Menu -> Play (btn_play ~428,248 C3) -> Game (HUD: nút Menu 35,30; cash; khoảng cách "Nm"; "Score :"). Va chạm -> boat biến mất/nổ, popup hiện sau ~3s.
Popup: Menu (353,389) / Restart (489,389). HUD Menu -> Menu OK, cash/best giữ. Restart -> ván mới OK, đã thử Popup Menu click không có hiệu lực trong ván sống (đúng, chưa có popup).

## localStorage key `Boat DriversaveData`
- Mới tinh: null (chỉ ghi khi bấm Play / kết thúc ván).
- Đầu ván 1: {"Car0":1,"Cash":0,"Best":0,"SelectedCar":0}
- Sau ván 1 (42m, Score 133, cash nhặt 37): {"Car0":1,"Cash":37,"Best":133,"SelectedCar":0}
- Sau ván khác (Score 980): {"Car0":1,"Cash":196,"Best":980,"SelectedCar":0}
- (chạy riêng khác: Score 160 -> Cash 8, Best 160)
Lưu ý: Best được ghi cùng lúc popup (không cần Menu).

## Số liệu ~10s giữ ga (boat 0, không lái)
Score ≈ 62, distance ≈ 22m, cash 0. Tỉ lệ ~ +9 score / 2s... ≈ 4.4 m/s ở ~đầu; Score ≈ 2.8 x distance (22m->62, 42m->133, 17m->39 ~ ngưỡng ±10%). Score tăng đều ~4.4/s.
Ván random: sống 20-60s không lái; 1 ván >60s không chết (176m+, có shield).

## Console
Không có error/pageerror. Chỉ warning WebGL "GPU stall due to ReadPixels" (do Playwright screenshot, không phải game).

## Bất thường có sẵn (không phải regression)
- Menu: sọc nước/reflection tràn ra ngoài mép phải canvas (x>815) ở 09/10 và nền đen 2 bên (letterbox) — cosmetic.
- Sau va chạm, boat bị che bởi tàu lớn (popup nền), enemy che tầm nhìn; ván không lái chỉ hợp lệ làm baseline thô.
- Thời gian popup trong test ≈ 3s sau va chạm (đo thô vì screenshot chậm).
