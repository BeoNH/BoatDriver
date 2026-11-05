# Sinh Board_short.png: Board.png nén dải giữa thân bảng (giữ nguyên tấm tiêu đề, góc, ốc vít; gradient viền vẫn liền).
# Dùng: python gen_board_short.py <textures_dir> <out_dir>
import sys
from PIL import Image

T, OUT = sys.argv[1], sys.argv[2]
TOP, BOTTOM = 100, 300  # dải hàng được nén, nằm giữa tấm tiêu đề và viền đáy
MID_H = 92

b = Image.open(f'{T}/Board.png').convert('RGBA')
out = Image.new('RGBA', (b.width, TOP + MID_H + b.height - BOTTOM))
out.paste(b.crop((0, 0, b.width, TOP)), (0, 0))
out.paste(b.crop((0, TOP, b.width, BOTTOM)).resize((b.width, MID_H), Image.LANCZOS), (0, TOP))
out.paste(b.crop((0, BOTTOM, b.width, b.height)), (0, TOP + MID_H))
out.save(f'{OUT}/Board_short.png')
