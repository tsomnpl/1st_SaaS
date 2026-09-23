#!/usr/bin/env python3
"""Fill the empty composition-model circle with CE WEEKEND. Do not paint black bars."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "public/creations/restauration-burger.webp"
HERO = ROOT / "public/creations/hero/restauration-burger.webp"
BOLD = "/usr/share/fonts/truetype/macos/Inter-Bold.ttf"


def main() -> None:
    im = Image.open(WEB).convert("RGB")
    px = im.load()
    whites = [
        (x, y)
        for y in range(420, 900)
        for x in range(480, 870)
        if px[x, y][0] > 245 and px[x, y][1] > 245 and px[x, y][2] > 245
    ]
    if len(whites) < 8000:
        print("no empty circle; skip")
        return
    cx = sum(p[0] for p in whites) / len(whites)
    cy = sum(p[1] for p in whites) / len(whites)
    draw = ImageDraw.Draw(im)
    font = ImageFont.truetype(BOLD, 28)

    def line(text: str, y: float) -> None:
        box = draw.textbbox((0, 0), text, font=font)
        draw.text((cx - (box[2] - box[0]) / 2, y), text, font=font, fill=(220, 38, 38))

    line("CE", cy - 36)
    line("WEEKEND", cy - 2)
    HERO.parent.mkdir(parents=True, exist_ok=True)
    im.save(WEB, "WEBP", quality=84, method=6)
    im.resize((480, 640)).save(HERO, "WEBP", quality=76, method=6)
    print(f"overlay {WEB} ({WEB.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
