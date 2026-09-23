#!/usr/bin/env python3
"""Replace the leftover white badge with CE WEEKEND. Do not paint black bars."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "public/creations/restauration-burger.webp"
HERO = ROOT / "public/creations/hero/restauration-burger.webp"
BOLD = "/usr/share/fonts/truetype/macos/Inter-Bold.ttf"


def main() -> None:
    im = Image.open(WEB).convert("RGB")
    px = im.load()
    w, h = im.size
    # Small leftover badge only — never the white dinner plate at the bottom.
    whites = [
        (x, y)
        for y in range(int(h * 0.34), int(h * 0.60))
        for x in range(int(w * 0.12), int(w * 0.55))
        if px[x, y][0] > 245 and px[x, y][1] > 245 and px[x, y][2] > 245
    ]
    if len(whites) < 2500:
        print("no empty circle; skip")
        return
    cx = sum(p[0] for p in whites) / len(whites)
    cy = sum(p[1] for p in whites) / len(whites)
    xs = [p[0] for p in whites]
    ys = [p[1] for p in whites]
    radius = min(max(xs) - min(xs), max(ys) - min(ys)) / 2
    if radius < 36:
        print("circle too small; skip")
        return
    draw = ImageDraw.Draw(im)
    draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=(255, 255, 255))
    font = ImageFont.truetype(BOLD, 22 if radius < 70 else 26)

    def line(text: str, y: float) -> None:
        box = draw.textbbox((0, 0), text, font=font)
        draw.text((cx - (box[2] - box[0]) / 2, y), text, font=font, fill=(220, 38, 38))

    line("CE", cy - 28)
    line("WEEKEND", cy + 2)
    HERO.parent.mkdir(parents=True, exist_ok=True)
    im.save(WEB, "WEBP", quality=84, method=6)
    im.resize((480, 640)).save(HERO, "WEBP", quality=76, method=6)
    print(f"overlay {WEB} ({WEB.stat().st_size} bytes) r={radius:.0f}")


if __name__ == "__main__":
    main()
