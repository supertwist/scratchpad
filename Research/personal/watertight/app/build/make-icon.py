#!/usr/bin/env python3
"""Generate the Watertight app icon (build/icon.png + build/icon.icns).

The drop is a circle plus the two tangent lines from an apex point above it:
for an external point at distance d from the centre, the tangency points lie at
+/- arccos(r/d) from the centre->apex direction. Joining them the long way
round, through the bottom of the circle, gives the teardrop outline.

Requires Pillow.  Run from the app/ directory:
    ../.venv/bin/python build/make-icon.py && iconutil -c icns build/icon.iconset -o build/icon.icns
"""
from PIL import Image, ImageDraw, ImageFilter
import math
import pathlib

S, SS = 1024, 4          # final size, supersample factor
W = S * SS

img = Image.new("RGBA", (W, W), (0, 0, 0, 0))

# Rounded-square plate with a vertical gradient.
inset, radius = int(W * 0.085), int(W * 0.225)
box = [inset, inset, W - inset, W - inset]

grad = Image.new("RGBA", (W, W))
gd = ImageDraw.Draw(grad)
top, bot = (0x54, 0x93, 0xFF), (0x1B, 0x49, 0xCE)
for y in range(W):
    t = y / (W - 1)
    gd.line([(0, y), (W, y)],
            fill=tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3)) + (255,))

mask = Image.new("L", (W, W), 0)
ImageDraw.Draw(mask).rounded_rectangle(box, radius=radius, fill=255)
img.paste(grad, (0, 0), mask)

# Teardrop.
cx, cy = W / 2.0, W * 0.600
r, apex_y = W * 0.200, W * 0.232

d = cy - apex_y
theta = math.acos(max(-1.0, min(1.0, r / d)))
t1 = -math.pi / 2 + theta
sweep = 2 * math.pi - 2 * theta

pts = [(cx, apex_y)]
for i in range(401):
    a = t1 + sweep * i / 400
    pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))

drop = Image.new("L", (W, W), 0)
ImageDraw.Draw(drop).polygon(pts, fill=255)
img.paste(Image.new("RGBA", (W, W), (255, 255, 255, 255)), (0, 0), drop)

# Soft highlight in the belly, clipped to the drop.
hl = Image.new("L", (W, W), 0)
ImageDraw.Draw(hl).ellipse(
    [cx - r * 0.62, cy - r * 0.70, cx - r * 0.02, cy - r * 0.10], fill=90)
hl = hl.filter(ImageFilter.GaussianBlur(W * 0.012))
hl = Image.composite(hl, Image.new("L", (W, W), 0), drop)
img.paste(Image.new("RGBA", (W, W), (0x9C, 0xC4, 0xFF, 255)), (0, 0), hl)

img = img.resize((S, S), Image.LANCZOS)

out = pathlib.Path(__file__).resolve().parent
img.save(out / "icon.png")

iconset = out / "icon.iconset"
iconset.mkdir(exist_ok=True)
for size in (16, 32, 64, 128, 256, 512):
    img.resize((size, size), Image.LANCZOS).save(iconset / f"icon_{size}x{size}.png")
    img.resize((size * 2, size * 2), Image.LANCZOS).save(iconset / f"icon_{size}x{size}@2x.png")

print(f"wrote {out/'icon.png'} and {iconset}")
