#!/usr/bin/env python3
"""Map 27 catalogue sheets to pages in references.pdf via OCR. Never publishes those pages."""

from __future__ import annotations

import json
import re
import subprocess
import tempfile
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "docs/inspirations/references.pdf"
OUT = ROOT / "docs/inspirations/reference-page-map.json"
OCR_CACHE = Path("/tmp/flyermint-ref-ocr.json")
PRIVATE = ROOT / "storage/private/ref-pages"

SHEETS: list[tuple[str, list[str]]] = [
    ("evenementiel-01", ["fulixgold", "beedex", "aura by", "by fulix"]),
    ("evenementiel-02", ["jeef tiga", "marguerita", "kolwezi", "passe simple"]),
    ("evenementiel-03", ["lac labotte", "coding", "15000fc", "vibes"]),
    ("evenementiel-04", ["levizy", "stade du 26", "26 mars", "3.000f", "3000f"]),
    ("restauration-01", ["avrum", "closed for renovation", "abuja"]),
    ("restauration-02", ["ghana high", "djinkoum", "koliko", "riz au gras"]),
    ("restauration-03", ["borcelle", "katsu ramen", "japanese chicken"]),
    ("restauration-04", ["lizim", "nos services"]),
    ("mode-01", ["rehoboth", "premium women wear"]),
    ("mode-02", ["xander", "lizzie", "dunkwa", "zara"]),
    ("mode-03", ["edith closet", "braced in beauty"]),
    ("beaute-01", ["aura luxe", "nanminda", "grand opening"]),
    ("beaute-02", ["eve's spa", "eves spa", "training center"]),
    ("beaute-03", ["eclat naturel", "beauty paradise", "revelez votre"]),
    ("immobilier-business-01", ["apartment to rent", "free car available", "sac's housing", "2+1"]),
    ("immobilier-business-02", ["modibo", "dembel", "construisons"]),
    ("immobilier-business-03", ["techpoint", "scalable solutions", "12.5k"]),
    ("immobilier-business-04", ["nexora", "banking reimagined", "24,560"]),
    ("immobilier-business-05", ["ololo", "one listing can change"]),
    ("techno-education-01", ["godfactor", "starlink", "right in your palm"]),
    ("techno-education-02", ["s/4hana", "quality management", "135.000"]),
    ("techno-education-03", ["cours a domicile", "cours à domicile", "bepc"]),
    ("sport-finance-01", ["marche sportive", "dspp", "7 km", "mitshopo"]),
    ("sport-finance-02", ["sendora", "shop with sendora", "75,000"]),
    ("sante-tourisme-associations-01", ["reviens a la vie", "reviens à la vie", "soigners", "14 fevrier"]),
    ("sante-tourisme-associations-02", ["hotels.ng", "wan dey this weekend", "calabar"]),
    ("sante-tourisme-associations-03", ["pecs", "bongisa", "ngaliema", "enfants de rue"]),
]


def ocr_page(doc: pymupdf.Document, index: int) -> str:
    page = doc[index]
    pix = page.get_pixmap(matrix=pymupdf.Matrix(1.35, 1.35), colorspace=pymupdf.csGRAY)
    with tempfile.NamedTemporaryFile(suffix=".png", delete=True) as tmp:
        pix.save(tmp.name)
        result = subprocess.run(
            ["tesseract", tmp.name, "stdout", "-l", "eng+fra", "--psm", "6"],
            check=False,
            capture_output=True,
            text=True,
        )
    return (result.stdout or "").lower()


def score(text: str, needles: list[str]) -> int:
    hits = 0
    for needle in needles:
        if needle.lower() in text:
            hits += 2 if len(needle) > 8 else 1
    return hits


def main() -> None:
    if not PDF.exists():
        raise SystemExit(f"missing {PDF}")
    doc = pymupdf.open(PDF)
    cache: dict[str, str] = {}
    if OCR_CACHE.exists():
        cache = json.loads(OCR_CACHE.read_text())
        print("ocr cache", len(cache), "pages")

    for i in range(doc.page_count):
        key = str(i + 1)
        if key in cache and cache[key]:
            continue
        cache[key] = ocr_page(doc, i)
        if (i + 1) % 20 == 0:
            OCR_CACHE.write_text(json.dumps(cache))
            print("ocr", i + 1, "/", doc.page_count)
    OCR_CACHE.write_text(json.dumps(cache))

    mapping = []
    used: set[int] = set()
    for sheet_id, needles in SHEETS:
        ranked = sorted(
            (
                (score(text, needles), int(page))
                for page, text in cache.items()
                if int(page) not in used
            ),
            reverse=True,
        )
        best_score, page = ranked[0] if ranked else (0, 0)
        snippet = re.sub(r"\s+", " ", cache.get(str(page), ""))[:180]
        if best_score <= 0:
            page = 0
            snippet = ""
        else:
            used.add(page)
        mapping.append(
            {
                "id": sheet_id,
                "page_reference_pdf": page or None,
                "ocr_score": best_score,
                "ocr_preview": snippet,
                "visual_ref_supported": True,
                "notes": "Gemini image-to-image style reference; never display this page on the site.",
            }
        )
        print("map", sheet_id, "page", page, "score", best_score)

    PRIVATE.mkdir(parents=True, exist_ok=True)
    for row in mapping:
        page = row["page_reference_pdf"]
        if not page:
            continue
        pix = doc[page - 1].get_pixmap(matrix=pymupdf.Matrix(1.6, 1.6))
        dest = PRIVATE / f"{row['id']}-p{page}.jpg"
        pix.save(dest.as_posix(), jpg_quality=82)
        row["local_ref_path"] = str(dest.relative_to(ROOT))
        print("extract", dest, dest.stat().st_size)

    payload = {
        "source_pdf": "docs/inspirations/references.pdf",
        "page_count": doc.page_count,
        "method": "tesseract OCR on rasterized pages; one best page per catalogue sheet",
        "rule": "Style reference only. Never copy logos, brand names, or identifiable real-company text. Never serve these images on the site.",
        "mapped": sum(1 for row in mapping if row["page_reference_pdf"]),
        "fiches": mapping,
    }
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
    print("wrote", OUT, "mapped", payload["mapped"], "/", len(mapping))


if __name__ == "__main__":
    main()
