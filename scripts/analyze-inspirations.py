#!/usr/bin/env python3
"""Vision analysis of private inspiration posters. Resume-safe. Never publishes images."""

from __future__ import annotations

import argparse
import base64
import json
import os
import re
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
BUCKET = "inspirations-source"
TABLE = "inspiration_source"
VISION_MODEL = "google/gemini-2.5-flash-lite"
MIN_AVAILABLE_RODI = 0.35
ANALYSIS_PREFIX = "_analysis"

GUIDE_PATH = ROOT / "src" / "lib" / "catalogue-description-guide.json"


def catalogue_style_block() -> str:
    guide = json.loads(GUIDE_PATH.read_text(encoding="utf-8"))
    examples = []
    for row in guide.get("exemples", [])[:4]:
        examples.append(
            f"- fond: {row['arriere_plan']} | textes: {row['textes']} | visuel: {row['visuel']}"
        )
    rules = " ".join(guide.get("regles", []))
    return (
        "Même grain que le catalogue d'analyse des affiches (architecture visuelle, "
        "pas une transcription). "
        + rules
        + " Exemples de grain (génériques, sans marque):\n"
        + "\n".join(examples)
    )


def vision_prompt() -> str:
    return f"""Analyze this advertising poster. Reply with a compact JSON object only (no markdown) using EXACTLY these keys:
{{"arriere_plan":"...","textes":"...","visuel":"...","palette_dominante":["#RRGGBB","#RRGGBB"],"style_general":"..."}}
{catalogue_style_block()}
- French. arriere_plan / visuel: 1-2 precise sentences. textes: 1 sentence on hierarchy + placement + type treatment only.
- NEVER copy visible words, brand names, logos, slogans, phone numbers, or URLs.
- Do not name real companies, products, NGOs, governments, or celebrities.
- palette_dominante: 2 or 3 hex colors actually dominant."""


def load_env_file(path: Path) -> None:
    if not path.is_file():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def load_env() -> None:
    for candidate in (Path.cwd() / ".env.local", ROOT / ".env.local", Path.cwd() / ".env", ROOT / ".env"):
        load_env_file(candidate)


def sb_request(
    method: str,
    path: str,
    *,
    data: bytes | None = None,
    headers: dict[str, str] | None = None,
    timeout: int = 90,
) -> tuple[int, dict[str, str], bytes]:
    url = os.environ["SUPABASE_URL"].rstrip("/") + path
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    merged = {"apikey": key, "Authorization": f"Bearer {key}"}
    if headers:
        merged.update(headers)
    req = urllib.request.Request(url, data=data, method=method, headers=merged)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return response.status, dict(response.headers), response.read()
    except urllib.error.HTTPError as error:
        return error.code, dict(error.headers), error.read()


def rodium_request(method: str, path: str, data: bytes | None = None) -> tuple[int, bytes]:
    base = os.environ.get("RODIUMAI_BASE_URL", "https://api.rodiumai.io/v1").rstrip("/")
    key = os.environ["RODIUMAI_API_KEY"]
    req = urllib.request.Request(
        base + path,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {key}",
            "x-api-key": key,
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as response:
            return response.status, response.read()
    except urllib.error.HTTPError as error:
        return error.code, error.read()


def wallet_available() -> float:
    status, body = rodium_request("GET", "/wallet")
    if status >= 400:
        raise SystemExit(f"wallet {status}: {body.decode('utf-8', 'replace')[:200]}")
    payload = json.loads(body.decode())
    balance = float(payload.get("balance_rodi") or 0)
    reserved = float(payload.get("reserved_rodi") or 0)
    return balance - reserved


def fetch_rows() -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    offset = 0
    page = 1000
    while True:
        status, _, body = sb_request(
            "GET",
            f"/rest/v1/{TABLE}?select=id,domaine,storage_path,uploaded_at&offset={offset}&limit={page}",
        )
        if status >= 400:
            raise SystemExit(f"lecture table {status}: {body.decode('utf-8', 'replace')[:300]}")
        chunk = json.loads(body.decode() or "[]")
        rows.extend(chunk)
        if len(chunk) < page:
            break
        offset += page
    return rows


def list_done_ids() -> set[str]:
    payload = json.dumps({"prefix": f"{ANALYSIS_PREFIX}/", "limit": 1000, "offset": 0}).encode()
    status, _, body = sb_request(
        "POST",
        f"/storage/v1/object/list/{BUCKET}",
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    if status >= 400:
        return set()
    items = json.loads(body.decode() or "[]")
    done: set[str] = set()
    for item in items:
        name = str(item.get("name") or "")
        if "by-domain" in name:
            continue
        base = name.split("/")[-1]
        if base.endswith(".json"):
            done.add(base.removesuffix(".json"))
    return done


def download_original(storage_path: str) -> bytes:
    encoded = "/".join(urllib.parse.quote(part, safe="") for part in storage_path.split("/"))
    status, _, body = sb_request("GET", f"/storage/v1/object/{BUCKET}/{encoded}", timeout=120)
    if status >= 400:
        raise RuntimeError(f"download {status} {storage_path}: {body.decode('utf-8', 'replace')[:200]}")
    return body


def vision_jpeg(raw: bytes) -> bytes:
    with tempfile.TemporaryDirectory() as tmp:
        source = Path(tmp) / "in.bin"
        dest = Path(tmp) / "out.jpg"
        source.write_bytes(raw)
        result = subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(source), "-vf", "scale=512:-1", "-q:v", "8", str(dest)],
            check=False,
            capture_output=True,
        )
        if result.returncode != 0 or not dest.exists():
            raise RuntimeError(f"ffmpeg: {result.stderr.decode('utf-8', 'replace')[:200]}")
        return dest.read_bytes()


def sanitize_text(value: str) -> str:
    text = " ".join(str(value).split())
    text = re.sub(r"https?://\S+", "", text)
    text = re.sub(r"\b[\w.+-]+@[\w.-]+\.\w+\b", "", text)
    text = re.sub(r"\+?\d[\d\s().-]{6,}\d", "", text)
    text = re.sub(r"[«\"].{8,}?[»\"]", "texte court", text)
    return text.strip()


def flatten_textes(value: Any) -> str:
    if isinstance(value, str):
        return sanitize_text(value)
    if isinstance(value, dict):
        bits = []
        for key, item in value.items():
            if isinstance(item, dict):
                place = item.get("placement") or item.get("style") or key
                bits.append(str(place))
            else:
                bits.append(str(key))
        return sanitize_text(", ".join(bits))
    return "texte structure non transcrit"


def normalize_analysis(raw: dict[str, Any]) -> dict[str, Any]:
    palette = raw.get("palette_dominante") or []
    colors: list[str] = []
    if isinstance(palette, list):
        for item in palette:
            match = re.search(r"#?[0-9A-Fa-f]{6}", str(item))
            if match:
                hex_color = match.group(0)
                colors.append(hex_color if hex_color.startswith("#") else f"#{hex_color}")
    colors = colors[:3]
    if len(colors) < 2:
        colors = (colors + ["#111827", "#F8FAFC"])[:2]
    return {
        "arriere_plan": sanitize_text(raw.get("arriere_plan") or "fond simple non identifie"),
        "textes": flatten_textes(raw.get("textes")),
        "visuel": sanitize_text(raw.get("visuel") or "sujet principal non identifie"),
        "palette_dominante": colors,
        "style_general": sanitize_text(raw.get("style_general") or "affiche commerciale"),
    }


def parse_model_json(content: str) -> dict[str, Any]:
    text = content.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?", "", text).removesuffix("```").strip()
    payload = json.loads(text)
    if not isinstance(payload, dict):
        raise ValueError("json root is not an object")
    return normalize_analysis(payload)


def analyze_image(jpeg: bytes) -> dict[str, Any]:
    data_url = "data:image/jpeg;base64," + base64.b64encode(jpeg).decode("ascii")
    body = json.dumps(
        {
            "model": VISION_MODEL,
            "temperature": 0.1,
            "max_tokens": 250,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": vision_prompt()},
                        {"type": "image_url", "image_url": {"url": data_url}},
                    ],
                }
            ],
        }
    ).encode()
    status, raw = rodium_request("POST", "/chat/completions", data=body)
    if status >= 400:
        raise RuntimeError(f"vision {status}: {raw.decode('utf-8', 'replace')[:240]}")
    payload = json.loads(raw.decode())
    content = ((payload.get("choices") or [{}])[0].get("message") or {}).get("content") or ""
    return parse_model_json(content)


def put_json(storage_path: str, payload: dict[str, Any]) -> None:
    encoded = "/".join(urllib.parse.quote(part, safe="") for part in storage_path.split("/"))
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    status, _, body = sb_request(
        "POST",
        f"/storage/v1/object/{BUCKET}/{encoded}",
        data=data,
        headers={"Content-Type": "application/json", "x-upsert": "true", "cache-control": "private, no-store"},
    )
    if status >= 400:
        raise RuntimeError(f"put {storage_path} {status}: {body.decode('utf-8', 'replace')[:200]}")


def get_json(storage_path: str) -> dict[str, Any] | None:
    encoded = "/".join(urllib.parse.quote(part, safe="") for part in storage_path.split("/"))
    status, _, body = sb_request("GET", f"/storage/v1/object/{BUCKET}/{encoded}")
    if status >= 400:
        return None
    try:
        payload = json.loads(body.decode())
    except json.JSONDecodeError:
        return None
    return payload if isinstance(payload, dict) else None


def try_update_row(row_id: str, analysis: dict[str, Any]) -> bool:
    payload = json.dumps(
        {"analysis": analysis, "analyzed_at": datetime.now(timezone.utc).isoformat()}
    ).encode()
    status, _, body = sb_request(
        "PATCH",
        f"/rest/v1/{TABLE}?id=eq.{row_id}",
        data=payload,
        headers={"Content-Type": "application/json", "Prefer": "return=minimal"},
    )
    return status < 400


def save_analysis(row: dict[str, Any], analysis: dict[str, Any]) -> None:
    record = {
        "id": row["id"],
        "domaine": row["domaine"],
        "analyzed_at": datetime.now(timezone.utc).isoformat(),
        "model": VISION_MODEL,
        "analysis": analysis,
    }
    put_json(f"{ANALYSIS_PREFIX}/{row['id']}.json", record)
    slug = row["domaine"]
    index_path = f"{ANALYSIS_PREFIX}/by-domain/{slug}.json"
    current = get_json(index_path) or {"domaine": slug, "items": []}
    items = [item for item in current.get("items", []) if item.get("id") != row["id"]]
    items.append({"id": row["id"], "analysis": analysis})
    put_json(index_path, {"domaine": slug, "items": items, "updated_at": record["analyzed_at"]})
    if not try_update_row(row["id"], analysis):
        pass


def round_robin(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    buckets: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        buckets[str(row["domaine"])].append(row)
    ordered: list[dict[str, Any]] = []
    while any(buckets.values()):
        for domaine in sorted(buckets):
            if buckets[domaine]:
                ordered.append(buckets[domaine].pop(0))
    return ordered


def summarize_done() -> dict[str, int]:
    counts: dict[str, int] = defaultdict(int)
    rows = fetch_rows()
    done = list_done_ids()
    for row in rows:
        if row["id"] in done:
            counts[str(row["domaine"])] += 1
    return dict(sorted(counts.items()))


def run_analysis(limit: int) -> int:
    load_env()
    rows = fetch_rows()
    done = list_done_ids()
    pending = [row for row in rows if row["id"] not in done]
    pending = round_robin(pending)
    if limit:
        pending = pending[:limit]
    print(f"lignes={len(rows)} deja={len(done)} reste={len(pending)} modele={VISION_MODEL}")
    print(f"RODI disponible={wallet_available():.1f}")
    totals = {"ok": 0, "fail": 0, "skip": 0}
    for index, row in enumerate(pending, start=1):
        available = wallet_available()
        if available < MIN_AVAILABLE_RODI:
            print(f"STOP wallet disponible={available:.2f} < {MIN_AVAILABLE_RODI} (Rodium a refuse 0.3 RODI si disponible=0.1)")
            break
        label = f"{row['domaine']}/{row['id'][:8]}"
        try:
            original = download_original(row["storage_path"])
            jpeg = vision_jpeg(original)
            analysis = analyze_image(jpeg)
            save_analysis(row, analysis)
            totals["ok"] += 1
            print(f"[{index}/{len(pending)}] ok   {label}  {analysis['style_general'][:60]}")
        except Exception as error:
            totals["fail"] += 1
            print(f"[{index}/{len(pending)}] FAIL {label}  {error}")
            err = str(error)
            if " 402" in err or "insufficient" in err.lower() or "low_balance" in err.lower():
                print("STOP: Rodium refuse le paiement (402 / solde).")
                break
        time.sleep(0.15)
    print("=== resume analyse ===")
    print(totals)
    per_domain = summarize_done()
    print("descriptions par domaine (fichiers _analysis):")
    for domaine, count in per_domain.items():
        print(f"  {domaine:<22} {count}")
    print(f"TOTAL descriptions {sum(per_domain.values())}/{len(rows)}")
    return 0 if totals["fail"] == 0 else 1


def print_examples(domains: list[str]) -> None:
    load_env()
    for slug in domains:
        payload = get_json(f"{ANALYSIS_PREFIX}/by-domain/{slug}.json")
        if not payload or not payload.get("items"):
            print(f"{slug}: aucune description")
            continue
        item = payload["items"][0]
        print(f"=== {slug} id={item.get('id')} ===")
        print(json.dumps(item.get("analysis"), ensure_ascii=False, indent=2))


def build_generation_prompt(slug: str) -> str:
    load_env()
    payload = get_json(f"{ANALYSIS_PREFIX}/by-domain/{slug}.json") or {}
    items = (payload.get("items") or [])[:3]
    lines = [
        "Create a professional advertising flyer.",
        f"Domain slug: {slug}.",
        "Compose a 100% original poster. Never copy a reference image, logo, brand name, or identifiable text.",
        "Use design laws: limited palette, hierarchy, contrast, alignment, proximity, readable CTA.",
        "Internal style library (structure/palette/mood only — do not reproduce artwork):",
    ]
    for index, item in enumerate(items, start=1):
        analysis = item.get("analysis") or {}
        lines.append(
            f"{index}) style={analysis.get('style_general')}; fond={analysis.get('arriere_plan')}; "
            f"textes={analysis.get('textes')}; visuel={analysis.get('visuel')}; "
            f"palette={', '.join(analysis.get('palette_dominante') or [])}."
        )
        lines.append(f"   internal_ref=insp-{item.get('id')}")
    if not items:
        lines.append("No library descriptions available yet. Use generic domain playbook only.")
    return "\n".join(lines)


def send_test_prompt(slug: str) -> int:
    prompt = build_generation_prompt(slug)
    print("=== PROMPT REEL ===")
    print(prompt)
    body = json.dumps(
        {
            "model": VISION_MODEL,
            "temperature": 0.2,
            "max_tokens": 80,
            "messages": [
                {
                    "role": "system",
                    "content": "FlyerMint strategy engine. Acknowledge the brief in one short sentence. Do not generate an image.",
                },
                {"role": "user", "content": prompt},
            ],
        }
    ).encode()
    status, raw = rodium_request("POST", "/chat/completions", data=body)
    print(f"=== RODIUM POST /chat/completions status={status} model={VISION_MODEL} ===")
    if status >= 400:
        print(raw.decode("utf-8", "replace")[:400])
        return 1
    payload = json.loads(raw.decode())
    content = ((payload.get("choices") or [{}])[0].get("message") or {}).get("content") or ""
    print("reponse:", content[:300])
    print("preuve: le prompt ci-dessus cite des refs insp-… sans aucune URL publique ni image source.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Analyse visuelle privee des inspirations.")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--examples", default="", help="slugs separes par des virgules")
    parser.add_argument("--test-prompt", default="", help="slug domaine pour envoyer un prompt test a Rodium")
    parser.add_argument("--summary", action="store_true")
    args = parser.parse_args()
    load_env()
    if args.summary:
        rows = fetch_rows()
        done = summarize_done()
        print(json.dumps({"total": len(rows), "described": sum(done.values()), "per_domain": done}, indent=2))
        return 0
    if args.examples:
        print_examples([item.strip() for item in args.examples.split(",") if item.strip()])
        return 0
    if args.test_prompt:
        return send_test_prompt(args.test_prompt)
    return run_analysis(args.limit)


if __name__ == "__main__":
    raise SystemExit(main())
