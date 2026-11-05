# Sinh Btn_replay.png: khung gỗ của btn_play + mũi tên vòng + tam giác play (rõ nghĩa Replay hơn Btn_restart_0).
# Dùng: python gen_replay_button.py <textures_dir> <out_dir>
import math, sys
from PIL import Image, ImageDraw

T, OUT = sys.argv[1], sys.argv[2]
DARK = (75, 53, 46, 255); W = (255, 255, 255, 255)
SIZE, K = 125, 4  # K: supersample
C = 62.5

def s(v):
    return v * K

im = Image.open(f'{T}/btn_play.png').convert('RGBA')
disc = Image.new('L', (SIZE * K, SIZE * K), 0)
ImageDraw.Draw(disc).ellipse([s(C - 41), s(C - 41), s(C + 41), s(C + 41)], fill=255)
im.paste(Image.new('RGBA', (SIZE, SIZE), DARK), (0, 0), disc.resize((SIZE, SIZE), Image.LANCZOS))

ic = Image.new('RGBA', (SIZE * K, SIZE * K), (0, 0, 0, 0))
d = ImageDraw.Draw(ic)
R, WIDTH = 30, 8
A0, A1 = 25, 315  # góc PIL (CW từ trục +x): cung chạy CW từ A0 tới A1, mũi tên ở A1
d.arc([s(C - R), s(C - R), s(C + R), s(C + R)], A0, A1, fill=W, width=s(WIDTH))

# Mũi tên tại cuối cung, hướng tiếp tuyến CW.
a = math.radians(A1)
rm = R - WIDTH / 2
px, py = C + rm * math.cos(a), C + rm * math.sin(a)
nx, ny = math.cos(a), math.sin(a)      # pháp tuyến ra ngoài
tx, ty = -math.sin(a), math.cos(a)     # tiếp tuyến CW
HALF, LEN = 12, 16
d.polygon([
    (s(px + nx * HALF), s(py + ny * HALF)),
    (s(px - nx * HALF), s(py - ny * HALF)),
    (s(px + tx * LEN), s(py + ty * LEN)),
], fill=W)

# Tam giác play ở tâm.
d.polygon([(s(C - 7), s(C - 11)), (s(C - 7), s(C + 11)), (s(C + 12), s(C))], fill=W)

im.alpha_composite(ic.resize((SIZE, SIZE), Image.LANCZOS))
im.save(f'{OUT}/Btn_replay.png')
