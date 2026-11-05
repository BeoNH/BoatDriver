# Sinh btn_guide.png: khung gỗ của btn_play + dấu "?" trắng (cùng kiểu btn_rank/btn_history).
# Dùng: python gen_guide_button.py <textures_dir> <out_dir>
import sys
from PIL import Image, ImageDraw, ImageFont

T, OUT = sys.argv[1], sys.argv[2]
DARK = (75, 53, 46, 255); W = (255, 255, 255, 255)
SIZE, K = 125, 4  # K: supersample
C = 62.5

im = Image.open(f'{T}/btn_play.png').convert('RGBA')
disc = Image.new('L', (SIZE * K, SIZE * K), 0)
ImageDraw.Draw(disc).ellipse([(C - 41) * K, (C - 41) * K, (C + 41) * K, (C + 41) * K], fill=255)
im.paste(Image.new('RGBA', (SIZE, SIZE), DARK), (0, 0), disc.resize((SIZE, SIZE), Image.LANCZOS))

ic = Image.new('RGBA', (SIZE * K, SIZE * K), (0, 0, 0, 0))
font = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', 66 * K)
ImageDraw.Draw(ic).text((C * K, C * K), '?', font=font, fill=W, anchor='mm')
im.alpha_composite(ic.resize((SIZE, SIZE), Image.LANCZOS))
im.save(f'{OUT}/btn_guide.png')
