#!/usr/bin/env python3
"""Paint exact Après copy on the burger poster. Used by generate-burger-after.mts."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "public/creations/restauration-burger.webp"
HERO = ROOT / "public/creations/hero/restauration-burger.webp"
BOLD = "/usr/share/fonts/truetype/macos/Inter-Bold.ttf"
SEMI = "/usr/share/fonts/truetype/macos/Inter-SemiBold.ttf"


def main() -> None:
    im = Image.open(WEB).convert("RGB")
    w, h = im.size
    draw = ImageDraw.Draw(im)
    draw.rectangle((0, 0, w, int(h * 0.157)), fill=(6, 6, 6))
    draw.rectangle((0, int(h * 0.758), w, h), fill=(6, 6, 6))

    def font(path: str, size: int) -> ImageFont.FreeTypeFont:
        return ImageFont.truetype(path, size)

    def center(text: str, face: ImageFont.FreeTypeFont, y: int, fill=(255, 255, 255)) -> None:
        bbox = draw.textbbox((0, 0), text, font=face)
        draw.text(((w - (bbox[2] - bbox[0])) / 2, y), text, font=face, fill=fill)

    center("MENU DU SOIR", font(BOLD, 58), 48)
    center("Burger + boisson", font(SEMI, 28), 122, fill=(226, 232, 240))
    center("5 000 FCFA", font(BOLD, 46), 948)

    label = "Commander"
    cta = font(BOLD, 22)
    box = draw.textbbox((0, 0), label, font=cta)
    lw, lh = box[2] - box[0], box[3] - box[1]
    pad_x, pad_y = 36, 14
    bw, bh = lw + pad_x * 2, lh + pad_y * 2
    bx, by = (w - bw) / 2, 1024
    draw.rounded_rectangle((bx, by, bx + bw, by + bh), radius=26, fill=(255, 255, 255))
    draw.text((bx + pad_x, by + pad_y - 2), label, font=cta, fill=(15, 23, 42))
    badge = font(SEMI, 14)
    text = "FLYERMINT"
    bb = draw.textbbox((0, 0), text, font=badge)
    draw.text((w - 28 - (bb[2] - bb[0]), h - 36), text, font=badge, fill=(226, 232, 240))

    HERO.parent.mkdir(parents=True, exist_ok=True)
    im.save(WEB, "WEBP", quality=82, method=6)
    im.resize((480, 640)).save(HERO, "WEBP", quality=74, method=6)
    print(f"overlay {WEB} ({WEB.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
