import sys, math
from PIL import Image, ImageDraw
T = sys.argv[1]; OUT = sys.argv[2]
DARK = (75, 53, 46, 255); W = (255, 255, 255, 255)
K = 4  # supersample

def base():
    im = Image.open(f'{T}/btn_play.png').convert('RGBA')
    m = Image.new('L', (125*K, 125*K), 0)
    ImageDraw.Draw(m).ellipse([(62-41)*K, (62-41)*K, (62+41)*K, (62+41)*K], fill=255)
    m = m.resize((125, 125), Image.LANCZOS)
    im.paste(Image.new('RGBA', (125, 125), DARK), (0, 0), m)
    return im

def icon(draw_fn):
    ic = Image.new('RGBA', (125*K, 125*K), (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(ic), lambda v: v*K)
    return ic.resize((125, 125), Image.LANCZOS)

def btn(name, draw_fn):
    im = base(); im.alpha_composite(icon(draw_fn)); im.save(f'{OUT}/{name}.png')

def trophy(d, s):
    d.pieslice([s(38), s(14), s(87), s(70)], 0, 180, fill=W)          # cup bowl
    d.rectangle([s(38), s(32), s(87), s(43)], fill=W)
    for cx in (38, 87):                                                    # handles
        d.ellipse([s(cx-13), s(37), s(cx+13), s(61)], outline=W, width=s(6))
    d.ellipse([s(33), s(39), s(92), s(60)], fill=None)
    d.rectangle([s(57), s(66), s(68), s(80)], fill=W)                      # stem
    d.rounded_rectangle([s(44), s(79), s(81), s(91)], radius=s(3), fill=W) # base
    d.polygon([(s(62.5), s(42)), (s(65.5), s(49)), (s(73), s(49)), (s(67), s(54)), (s(69), s(61)),
               (s(62.5), s(57)), (s(56), s(61)), (s(58), s(54)), (s(52), s(49)), (s(59.5), s(49))], fill=DARK)

def trophy_fix(d, s):
    # trophy body redraw: handles first, then cup over them
    d.arc([s(28), s(30), s(52), s(58)], 90, 270, fill=W, width=s(6))
    d.arc([s(73), s(30), s(97), s(58)], -90, 90, fill=W, width=s(6))
    d.line([s(40), s(55), s(46), s(58)], fill=W, width=s(6))
    d.line([s(85), s(55), s(79), s(58)], fill=W, width=s(6))
    d.rectangle([s(40), s(32), s(85), s(52)], fill=W)
    d.chord([s(40), s(26), s(85), s(72)], 0, 180, fill=W)
    d.rectangle([s(57), s(66), s(68), s(80)], fill=W)
    d.rounded_rectangle([s(45), s(79), s(80), s(91)], radius=s(3), fill=W)
    # star
    cx, cy, R, r = 62.5, 50, 9, 4
    pts = []
    for i in range(10):
        a = -math.pi/2 + i*math.pi/5; rr = R if i % 2 == 0 else r
        pts.append((s(cx + rr*math.cos(a)), s(cy + rr*math.sin(a))))
    d.polygon(pts, fill=DARK)

def clock(d, s):
    cx, cy, R = 64, 62, 28
    d.arc([s(cx-R), s(cy-R), s(cx+R), s(cy+R)], 215, 160+360, fill=W, width=s(7))
    a = math.radians(212); px, py = cx + (R-3.5)*math.cos(a), cy + (R-3.5)*math.sin(a)
    tx, ty = math.sin(a), -math.cos(a); nx, ny = math.cos(a), math.sin(a)
    d.polygon([(s(px + 12*tx), s(py + 12*ty)), (s(px + 10*nx), s(py + 10*ny)), (s(px - 10*nx), s(py - 10*ny))], fill=W)
    d.line([s(cx), s(cy), s(cx), s(cy-17)], fill=W, width=s(7))
    d.line([s(cx), s(cy), s(cx+13), s(cy+9)], fill=W, width=s(7))
    for x, y in ((cx, cy), (cx, cy-17), (cx+13, cy+9)):
        d.ellipse([s(x-3.5), s(y-3.5), s(x+3.5), s(y+3.5)], fill=W)

def cross(d, s):
    for (a, b, c, e) in ((42, 42, 83, 83), (83, 42, 42, 83)):
        d.line([s(a), s(b), s(c), s(e)], fill=W, width=s(13))
        for x, y in ((a, b), (c, e)):
            d.ellipse([s(x-6.5), s(y-6.5), s(x+6.5), s(y+6.5)], fill=W)

btn('btn_rank', trophy_fix)
btn('btn_history', clock)
btn('btn_close', cross)

# panel: kéo dài Board.png bằng dải đồng màu (giữ góc/ốc vít)
b = Image.open(f'{T}/Board.png').convert('RGBA')
PW, PH = 620, 440; sx, sy = 189, 200
dx, dy = PW - b.width, PH - b.height
h = Image.new('RGBA', (PW, b.height))
h.paste(b.crop((0, 0, sx, b.height)), (0, 0))
h.paste(b.crop((sx, 0, sx+1, b.height)).resize((dx+1, b.height)), (sx, 0))
h.paste(b.crop((sx+1, 0, b.width, b.height)), (sx+dx+1, 0))
p = Image.new('RGBA', (PW, PH))
p.paste(h.crop((0, 0, PW, sy)), (0, 0))
p.paste(h.crop((0, sy, PW, sy+1)).resize((PW, dy+1)), (0, sy))
p.paste(h.crop((0, sy+1, PW, b.height)), (0, sy+dy+1))
p.save(f'{OUT}/popup_panel.png')

# row: bo góc trắng, tint bằng Sprite.color
r = Image.new('RGBA', (540*K, 40*K), (0, 0, 0, 0))
ImageDraw.Draw(r).rounded_rectangle([0, 0, 540*K-1, 40*K-1], radius=10*K, fill=W)
r.resize((540, 40), Image.LANCZOS).save(f'{OUT}/popup_row.png')

# medal top3: đĩa trắng + viền xám (tint vàng/bạc/đồng)
m = Image.new('RGBA', (64*K, 64*K), (0, 0, 0, 0)); md = ImageDraw.Draw(m)
md.ellipse([0, 0, 64*K-1, 64*K-1], fill=(255, 255, 255, 255))
md.ellipse([6*K, 6*K, 58*K, 58*K], fill=(205, 205, 205, 255))
m.resize((64, 64), Image.LANCZOS).save(f'{OUT}/medal.png')

# overlay mờ nền
Image.new('RGBA', (16, 16), (0, 0, 0, 255)).save(f'{OUT}/dim.png')
