"""Contact sheet: every sprite at 3x on a light|dark split tile, plus one mock frame per background."""
from lib import *
from PIL import ImageFont
from creatures import CREATURES
from figures import FIG
TR = [*FIG, 'devansh']

F = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 13)
FB = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 15)
LIGHT, DARKC = (247, 245, 234), (35, 44, 82)
TW, TH, S = 200, 222, 3


def tile(path, label):
    t = Image.new("RGBA", (TW, TH), LIGHT)
    d = ImageDraw.Draw(t)
    d.rectangle([TW // 2, 0, TW, TH], fill=DARKC)
    im = Image.open(path).convert("RGBA").resize((64 * S, 64 * S), Image.NEAREST)
    t.alpha_composite(im, ((TW - 64 * S) // 2, 6))
    d.rectangle([0, 200, TW, TH], fill=(70, 74, 92))
    d.text((6, 203), label, font=F, fill=(255, 255, 255))
    return t


def mock(bg, player, enemy):
    im = Image.open(os.path.join(OUT, "bg", f"{bg}.png")).convert("RGBA")
    e = Image.open(os.path.join(OUT, "creatures", f"{enemy}-front.png")).convert("RGBA")
    p = Image.open(os.path.join(OUT, "creatures", f"{player}-back.png")).convert("RGBA")
    im.alpha_composite(e, (248 - 32, 78 - 63))
    im.alpha_composite(p, (90 - 32, 132 - 63))
    return im.resize((640, 360), Image.NEAREST)


def build():
    cols = 8
    items = []
    for k in CREATURES:
        for side in ("front", "back"):
            items.append((os.path.join(OUT, "creatures", f"{k}-{side}.png"), f"{k}-{side}"))
    n_c = len(items)
    for k in TR:
        items.append((os.path.join(OUT, "trainers", f"{k}.png"), k))
    rows = (len(items) + cols - 1) // cols
    mocks = [("grass", "react", "null-pointer"), ("jungle", "claude", "race-condition"), ("city", "react", "hydration"),
            ("gym", "node", "cors"), ("elite", "claude", "silent-data-loss")]
    mrows = (len(mocks) + 1) // 2
    STRIP = 250
    W = cols * TW
    H = 40 + STRIP + rows * TH + 40 + mrows * 400
    sheet = Image.new("RGBA", (W, H), (120, 124, 140, 255))
    d = ImageDraw.Draw(sheet)
    d.text((10, 10), "Portfolio Quest battle art, all 64x64 at 3x. Left half light, right half dark. Creatures first, then trainers.", font=FB, fill=(255, 255, 255))
    for i, (p, l) in enumerate(items):
        y0 = 40 + STRIP + (i // cols) * TH
        sheet.alpha_composite(tile(p, l), ((i % cols) * TW, y0))
    y = 40 + STRIP + rows * TH + 10
    d.rectangle([0, 36, W, 36 + STRIP - 6], fill=LIGHT)
    d.text((10, 40), "Trainer proportions, all ten at 3x on one baseline. devansh (right) is the reference.", font=FB, fill=DARKC)
    for i, k in enumerate(TR):
        im = Image.open(os.path.join(OUT, "trainers", f"{k}.png")).convert("RGBA").resize((192, 192), Image.NEAREST)
        sheet.alpha_composite(im, (10 + i * 158, 62))
        d.text((14 + i * 158, 62 + 194), k, font=F, fill=DARKC)
    d.text((10, y), "Mock frames, 320x180 native shown at 2x. Player back sprite bottom left, enemy front sprite top right.", font=FB, fill=(255, 255, 255))
    for i, (bg, pl, en) in enumerate(mocks):
        sheet.alpha_composite(mock(bg, pl, en), (10 + (i % 2) * 650, y + 28 + (i // 2) * 390))
        d.rectangle([10 + (i % 2) * 650, y + 28, 10 + (i % 2) * 650 + 330, y + 48] if False else [10 + (i % 2) * 650, y + 28 + (i // 2) * 390, 10 + (i % 2) * 650 + 330, y + 48 + (i // 2) * 390], fill=(70, 74, 92))
        d.text((16 + (i % 2) * 650, y + 30 + (i // 2) * 390), f"{bg}: {pl} vs {en}", font=FB, fill=(255, 255, 255))
    out = os.path.join(os.path.dirname(__file__), "sheet.png")
    sheet.convert("RGB").save(out)
    return out


if __name__ == "__main__":
    print(build())
