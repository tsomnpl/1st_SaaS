#!/usr/bin/env python3
"""Upload local inspiration posters to a PRIVATE Supabase bucket.

These files are collected references (Pinterest / Behance / portfolios).
FlyerMint does not own them. They must NEVER be displayed, republished,
resized for the web, or used as a final poster background.

Isaac runs this script on his Windows PC. The cloud agent cannot see those files.

Stdlib only. No compression. No resize. Idempotent via SHA-256 + storage_path.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import mimetypes
import os
import re
import sys
import tempfile
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
MAP_PATH = ROOT / "src" / "lib" / "inspiration-folder-map.json"
DEFAULT_REPORT = ROOT / "storage" / "private" / "inspiration-upload-report.json"
BUCKET = "inspirations-source"
TABLE = "inspiration_source"
IMAGE_EXTS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".tif",
    ".tiff",
    ".bmp",
    ".heic",
    ".heif",
    ".avif",
}
SKIP_NAMES = {".ds_store", "thumbs.db", "desktop.ini"}

# Minimal valid-enough fixtures for --self-test (not real posters).
TINY_JPEG = bytes.fromhex(
    "ffd8ffe000104a46494600010100000100010000ffdb00430008060607060508070707090908"
    "0a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434"
    "341f27393d38323c2e333432ffc0000b080001000101011100ffc4001410010000000000000000"
    "0000000000000008ffda000c03010002110311003f00aa7fffd9"
)
TINY_PNG = bytes.fromhex(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49"
    "444154789c63000100000500010d0a2db40000000049454e44ae426082"
)


def _reconfigure_stdio() -> None:
    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if reconfigure:
            try:
                reconfigure(encoding="utf-8")
            except Exception:
                pass


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
    for candidate in (
        Path.cwd() / ".env.local",
        Path.cwd() / ".env",
        ROOT / ".env.local",
        ROOT / ".env",
    ):
        load_env_file(candidate)


def normalize_folder_name(name: str) -> str:
    nfkd = unicodedata.normalize("NFKD", name)
    stripped = "".join(ch for ch in nfkd if not unicodedata.combining(ch))
    lowered = stripped.lower().replace("&", " ").replace("/", " ").replace("\\", " ")
    lowered = re.sub(r"[_+]+", " ", lowered)
    return re.sub(r"\s+", " ", lowered).strip()


def name_variants(value: str) -> set[str]:
    return {
        value,
        value.replace(" ", "-"),
        value.replace(" ", ""),
        value.replace("-", " "),
    }


def load_domain_map() -> list[dict[str, Any]]:
    payload = json.loads(MAP_PATH.read_text(encoding="utf-8"))
    if payload.get("bucket") != BUCKET or payload.get("table") != TABLE:
        raise SystemExit("inspiration-folder-map.json bucket/table mismatch")
    return payload["domains"]


def build_alias_index(domains: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    index: dict[str, dict[str, Any]] = {}
    for row in domains:
        labels = [row["slug"], row["domaine"], *row.get("aliases", [])]
        for label in labels:
            for key in name_variants(normalize_folder_name(str(label))):
                index[key] = row
    return index


def resolve_folder(folder_name: str, index: dict[str, dict[str, Any]]) -> dict[str, Any] | None:
    for key in name_variants(normalize_folder_name(folder_name)):
        hit = index.get(key)
        if hit:
            return hit
    return None


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while True:
            chunk = handle.read(1024 * 1024)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()


def safe_filename(original: str, file_hash: str) -> str:
    stem, ext = os.path.splitext(original)
    ext = ext.lower() if ext.lower() in IMAGE_EXTS else ext
    ascii_ok = re.fullmatch(r"[A-Za-z0-9._-]+", original) is not None
    if ascii_ok and 1 <= len(original) <= 120:
        return original
    short = file_hash[:12]
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "-", stem).strip("-")[:40]
    if cleaned:
        return f"{cleaned}-{short}{ext or '.bin'}"
    return f"{short}{ext or '.bin'}"


def guess_mime(path: Path) -> str:
    guessed, _ = mimetypes.guess_type(path.name)
    return guessed or "application/octet-stream"


@dataclass
class Candidate:
    local_path: str
    folder_name: str
    domaine: str
    slug: str
    storage_path: str
    file_hash: str
    original_filename: str
    mime_type: str
    byte_size: int


def scan_library(root: Path, index: dict[str, dict[str, Any]]) -> tuple[list[Candidate], list[str]]:
    if not root.is_dir():
        raise SystemExit(f"Dossier introuvable: {root}")

    unknown: list[str] = []
    candidates: list[Candidate] = []
    seen_paths: dict[str, str] = {}

    for child in sorted(root.iterdir(), key=lambda p: p.name.lower()):
        if child.name.startswith(".") or child.name.lower() in SKIP_NAMES:
            continue
        if not child.is_dir():
            print(f"ignore fichier a la racine: {child.name}")
            continue
        mapped = resolve_folder(child.name, index)
        if not mapped:
            unknown.append(child.name)
            continue
        for file in sorted(child.rglob("*")):
            if not file.is_file() or file.name.lower() in SKIP_NAMES:
                continue
            if file.suffix.lower() not in IMAGE_EXTS:
                continue
            file_hash = sha256_file(file)
            filename = safe_filename(file.name, file_hash)
            storage_path = f"{mapped['slug']}/{filename}"
            if storage_path in seen_paths and seen_paths[storage_path] != file_hash:
                storage_path = f"{mapped['slug']}/{file_hash[:16]}-{filename}"
            seen_paths[storage_path] = file_hash
            candidates.append(
                Candidate(
                    local_path=str(file),
                    folder_name=child.name,
                    domaine=mapped["domaine"],
                    slug=mapped["slug"],
                    storage_path=storage_path,
                    file_hash=file_hash,
                    original_filename=file.name,
                    mime_type=guess_mime(file),
                    byte_size=file.stat().st_size,
                )
            )
    return candidates, unknown


class SupabaseClient:
    def __init__(self, url: str, service_key: str) -> None:
        self.url = url.rstrip("/")
        self.service_key = service_key

    def _headers(self, extra: dict[str, str] | None = None) -> dict[str, str]:
        headers = {
            "Authorization": f"Bearer {self.service_key}",
            "apikey": self.service_key,
        }
        if extra:
            headers.update(extra)
        return headers

    def request(
        self,
        method: str,
        path: str,
        *,
        data: bytes | None = None,
        headers: dict[str, str] | None = None,
        query: dict[str, str] | None = None,
    ) -> tuple[int, bytes]:
        url = f"{self.url}{path}"
        if query:
            url += "?" + urllib.parse.urlencode(query)
        req = urllib.request.Request(url, data=data, method=method, headers=self._headers(headers))
        try:
            with urllib.request.urlopen(req, timeout=120) as response:
                return response.status, response.read()
        except urllib.error.HTTPError as error:
            body = error.read()
            return error.code, body

    def existing_rows(self) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        offset = 0
        page = 1000
        while True:
            status, body = self.request(
                "GET",
                f"/rest/v1/{TABLE}",
                headers={
                    "Accept": "application/json",
                    "Range": f"{offset}-{offset + page - 1}",
                    "Prefer": "count=exact",
                },
                query={"select": "id,domaine,storage_path,file_hash"},
            )
            if status >= 400:
                raise SystemExit(f"Lecture {TABLE} impossible ({status}): {body.decode('utf-8', 'replace')}")
            chunk = json.loads(body.decode("utf-8") or "[]")
            rows.extend(chunk)
            if len(chunk) < page:
                break
            offset += page
        return rows

    def confirm_bucket_private(self) -> dict[str, Any]:
        status, body = self.request(
            "GET",
            "/storage/v1/bucket/inspirations-source",
            headers={"Accept": "application/json"},
        )
        if status >= 400:
            raise SystemExit(
                f"Bucket {BUCKET} introuvable ({status}). "
                "Execute d'abord scripts/sql/inspiration_source.sql dans Supabase."
            )
        info = json.loads(body.decode("utf-8"))
        if info.get("public") is True:
            raise SystemExit(
                f"REFUS: le bucket {BUCKET} est public. "
                "Relance le SQL (public=false) avant tout upload."
            )
        return info

    def upload_original(self, candidate: Candidate) -> int:
        encoded_path = "/".join(urllib.parse.quote(part, safe="") for part in candidate.storage_path.split("/"))
        data = Path(candidate.local_path).read_bytes()
        if len(data) != candidate.byte_size:
            raise RuntimeError(f"taille changee pendant la lecture: {candidate.local_path}")
        status, body = self.request(
            "POST",
            f"/storage/v1/object/{BUCKET}/{encoded_path}",
            data=data,
            headers={
                "Content-Type": candidate.mime_type,
                "x-upsert": "false",
                "cache-control": "private, no-store",
            },
        )
        if status in {200, 201}:
            return status
        if status == 400 and b"Duplicate" in body:
            return 409
        if status == 409:
            return 409
        raise RuntimeError(
            f"upload storage {status} {candidate.storage_path}: {body.decode('utf-8', 'replace')[:400]}"
        )

    def insert_row(self, candidate: Candidate) -> None:
        payload = {
            "domaine": candidate.domaine,
            "folder_name": candidate.folder_name,
            "storage_path": candidate.storage_path,
            "file_hash": candidate.file_hash,
            "original_filename": candidate.original_filename,
            "mime_type": candidate.mime_type,
            "byte_size": candidate.byte_size,
        }
        status, body = self.request(
            "POST",
            f"/rest/v1/{TABLE}",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Prefer": "return=minimal",
            },
        )
        if status in {200, 201, 204}:
            return
        if status == 409:
            return
        raise RuntimeError(f"insert {TABLE} {status}: {body.decode('utf-8', 'replace')[:400]}")


def summarize(rows: list[dict[str, Any]]) -> dict[str, int]:
    counts: dict[str, int] = defaultdict(int)
    for row in rows:
        counts[str(row["domaine"])] += 1
    return dict(sorted(counts.items()))


def print_progress(index: int, total: int, action: str, storage_path: str) -> None:
    print(f"[{index}/{total}] {action:8} {storage_path}", flush=True)


def print_summary(title: str, per_domain: dict[str, Counter[str]], totals: Counter[str]) -> None:
    print()
    print(f"=== {title} ===")
    print(f"{'domaine':<28} {'upload':>8} {'skip':>8} {'fail':>8}")
    domains = sorted(per_domain)
    for domaine in domains:
        stats = per_domain[domaine]
        print(
            f"{domaine:<28} {stats['uploaded']:>8} {stats['skipped']:>8} {stats['failed']:>8}"
        )
    print(
        f"{'TOTAL':<28} {totals['uploaded']:>8} {totals['skipped']:>8} {totals['failed']:>8}"
    )
    print()
    print("Ces images ne doivent JAMAIS etre affichees sur le site.")
    print("Colle ce resume a l'agent pour deblocage des etapes 2-4.")


def write_report(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Rapport JSON: {path}")


def run_upload(args: argparse.Namespace) -> int:
    load_env()
    domains = load_domain_map()
    index = build_alias_index(domains)
    root = Path(args.root).expanduser()
    candidates, unknown = scan_library(root, index)
    if args.domains:
        wanted = {item.strip() for item in args.domains.split(",") if item.strip()}
        candidates = [
            row
            for row in candidates
            if row.domaine in wanted or row.slug in wanted or row.folder_name in wanted
        ]
    if args.limit:
        candidates = candidates[: args.limit]

    print(f"Racine: {root}")
    print(f"Images detectees: {len(candidates)}")
    if unknown:
        print("Dossiers non reconnus (ignores):")
        for name in unknown:
            print(f"  - {name}")

    if args.dry_run:
        per_domain: dict[str, Counter[str]] = defaultdict(Counter)
        totals: Counter[str] = Counter()
        for i, candidate in enumerate(candidates, start=1):
            print_progress(i, len(candidates), "detect", candidate.storage_path)
            per_domain[candidate.domaine]["skipped"] += 1
            totals["skipped"] += 1
        print()
        print("=== DRY-RUN (aucun upload, aucun appel reseau) ===")
        print(f"{'domaine':<28} {'detectees':>10}")
        for domaine in sorted(per_domain):
            print(f"{domaine:<28} {per_domain[domaine]['skipped']:>10}")
        print(f"{'TOTAL':<28} {totals['skipped']:>10}")
        print()
        print("Aucune image n'a ete envoyee. Relance sans --dry-run apres le SQL Supabase.")
        write_report(
            Path(args.report),
            {
                "mode": "dry-run",
                "root": str(root),
                "detected": len(candidates),
                "unknown_folders": unknown,
                "per_domain": {k: v["skipped"] for k, v in per_domain.items()},
                "note": "Aucune image n'a ete envoyee. Relance sans --dry-run apres le SQL Supabase.",
            },
        )
        return 0

    url = os.environ.get("SUPABASE_URL", "").strip()
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not url or not key:
        print(
            "PROBLÈME : SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY absents\n"
            "CAUSE : le script tourne en local et n'a pas les cles du projet Supabase\n"
            "TESTS EFFECTUÉS : lecture .env.local / variables d'environnement\n"
            "CE QUI MANQUE : URL + service_role du projet Supabase (Settings > API)\n"
            "ACTION QUE JE DOIS FAIRE MOI-MÊME : creer le projet, executer "
            "scripts/sql/inspiration_source.sql, puis definir les deux variables "
            "avant de relancer SANS --dry-run."
        )
        return 2

    client = SupabaseClient(url, key)
    bucket = client.confirm_bucket_private()
    print(f"Bucket {BUCKET}: public={bucket.get('public')} (doit rester false)")

    existing = client.existing_rows()
    known_hash = {row["file_hash"] for row in existing}
    known_path = {row["storage_path"] for row in existing}
    print(f"Lignes deja en base: {len(existing)}")

    per_domain = defaultdict(Counter)
    totals: Counter[str] = Counter()
    actions: list[dict[str, Any]] = []
    total = len(candidates)

    for i, candidate in enumerate(candidates, start=1):
        domaine_stats = per_domain[candidate.domaine]
        if candidate.file_hash in known_hash or candidate.storage_path in known_path:
            print_progress(i, total, "skip", candidate.storage_path)
            domaine_stats["skipped"] += 1
            totals["skipped"] += 1
            actions.append({"action": "skipped", **asdict(candidate)})
            continue
        try:
            client.upload_original(candidate)
            client.insert_row(candidate)
            known_hash.add(candidate.file_hash)
            known_path.add(candidate.storage_path)
            print_progress(i, total, "upload", candidate.storage_path)
            domaine_stats["uploaded"] += 1
            totals["uploaded"] += 1
            actions.append({"action": "uploaded", **asdict(candidate)})
        except Exception as error:
            print_progress(i, total, "FAIL", candidate.storage_path)
            print(f"    {error}")
            domaine_stats["failed"] += 1
            totals["failed"] += 1
            actions.append({"action": "failed", "error": str(error), **asdict(candidate)})

    print_summary("Resume upload", per_domain, totals)
    write_report(
        Path(args.report),
        {
            "mode": "upload",
            "root": str(root),
            "bucket": BUCKET,
            "bucket_public": bucket.get("public"),
            "detected": total,
            "unknown_folders": unknown,
            "already_in_table": len(existing),
            "per_domain": {
                domaine: dict(stats) for domaine, stats in sorted(per_domain.items())
            },
            "totals": dict(totals),
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "actions": [
                {k: v for k, v in row.items() if k != "local_path"} for row in actions
            ],
        },
    )
    return 1 if totals["failed"] else 0


def _write_fixture(root: Path, relative: str, payload: bytes) -> Path:
    path = root / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(payload)
    return path


def run_self_test() -> int:
    domains = load_domain_map()
    assert len(domains) == 22, len(domains)
    index = build_alias_index(domains)

    expected = {
        "Agriculture": "agriculture",
        "Anniversaire": "anniversaire",
        "Associations": "associations",
        "Automobile": "automobile",
        "Beauté": "beaute",
        "Beaut": "beaute",
        "Business": "business",
        "E-commerce": "e-commerce",
        "Éducation": "education",
        "ducation": "education",
        "Emploi": "emploi",
        "Événementiel": "evenementiel",
        "vnementiel": "evenementiel",
        "Finance": "finance",
        "Immobilier": "immobilier",
        "Mariage": "mariage",
        "Mode": "mode",
        "Musique": "musique",
        "Religion/Culture": "religion-culture",
        "Religion-Culture": "religion-culture",
        "Restauration": "restauration",
        "Santé": "sante",
        "Sant": "sante",
        "Services": "services",
        "Sport": "sport",
        "Technologie": "technologie",
        "Tourisme": "tourisme",
    }
    for folder, slug in expected.items():
        hit = resolve_folder(folder, index)
        assert hit, f"non resolu: {folder}"
        assert hit["slug"] == slug, (folder, hit["slug"], slug)

    assert resolve_folder("DossierInconnu", index) is None

    source = inspect_source().split("def run_self_test")[0]
    banned = ("PIL", "Pillow", "Image.open", "thumbnail(", ".resize(", "gzip", "/object/public/")
    for token in banned:
        assert token not in source, token

    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp) / "library"
        first = _write_fixture(root, "Agriculture/champ.jpg", TINY_JPEG)
        _write_fixture(root, "Beauté/soin.png", TINY_PNG)
        _write_fixture(root, "Éducation/cours.jpeg", TINY_JPEG)
        _write_fixture(root, "Religion-Culture/office.webp", TINY_PNG)
        _write_fixture(root, "Santé/clinique.jpg", TINY_JPEG)
        _write_fixture(root, "Inconnu/skip.jpg", TINY_JPEG)
        candidates, unknown = scan_library(root, index)
        assert unknown == ["Inconnu"], unknown
        assert len(candidates) == 5, [c.storage_path for c in candidates]
        slugs = {c.slug for c in candidates}
        assert slugs == {"agriculture", "beaute", "education", "religion-culture", "sante"}
        agri = next(c for c in candidates if c.slug == "agriculture")
        assert agri.storage_path == "agriculture/champ.jpg"
        assert agri.byte_size == first.stat().st_size
        assert agri.file_hash == sha256_file(first)
        assert agri.file_hash == sha256_file(first)

        same_hash = sha256_file(first)
        again = scan_library(root, index)[0]
        assert again[0].file_hash == same_hash

    print("self-test OK: mapping 22 domaines, hash stable, scan idempotent, aucune compression")
    return 0


def inspect_source() -> str:
    return Path(__file__).read_text(encoding="utf-8")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Upload local des affiches d'inspiration vers le bucket prive inspirations-source."
    )
    parser.add_argument("--root", help="Dossier racine contenant les 22 sous-dossiers de domaine")
    parser.add_argument("--dry-run", action="store_true", help="Scan + resume, aucun appel reseau")
    parser.add_argument("--self-test", action="store_true", help="Valide mapping/hash sans Supabase")
    parser.add_argument("--limit", type=int, default=0, help="Limiter le nombre d'images (debug)")
    parser.add_argument("--domains", default="", help="Filtrer par domaine/slug, separes par des virgules")
    parser.add_argument("--report", default=str(DEFAULT_REPORT), help="Chemin du rapport JSON")
    parser.add_argument("--print-map", action="store_true", help="Affiche le mapping dossier -> domaine")
    return parser


def main() -> int:
    _reconfigure_stdio()
    parser = build_parser()
    args = parser.parse_args()
    if args.self_test:
        return run_self_test()
    if args.print_map:
        print(json.dumps(load_domain_map(), indent=2, ensure_ascii=False))
        return 0
    if not args.root:
        parser.error("--root est obligatoire (sauf --self-test / --print-map)")
    return run_upload(args)


if __name__ == "__main__":
    raise SystemExit(main())
