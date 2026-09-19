#!/usr/bin/env python3
"""Write Supabase secrets into .env.local. Never prints the service role key."""

from __future__ import annotations

import getpass
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env.local"


def upsert(text: str, key: str, value: str) -> str:
    pattern = re.compile(rf"^{re.escape(key)}=.*$", re.MULTILINE)
    line = f"{key}={value}"
    if pattern.search(text):
        return pattern.sub(line, text, count=1)
    if text and not text.endswith("\n"):
        text += "\n"
    if text and not text.endswith("\n\n"):
        return text + line + "\n"
    return text + line + "\n"


def main() -> int:
    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if reconfigure:
            try:
                reconfigure(encoding="utf-8")
            except Exception:
                pass

    print("=== FlyerMint — clé Supabase (privee) ===")
    print("Colle les valeurs ICI, pas dans le chat.")
    print("Settings → API : Project URL + service_role (secret).")
    print(f"Fichier: {ENV_PATH}")
    print()

    try:
        url = input("SUPABASE_URL (https://xxxx.supabase.co) : ").strip().strip('"').strip("'")
        key = getpass.getpass("SUPABASE_SERVICE_ROLE_KEY (invisible) : ").strip().strip('"').strip("'")
    except (EOFError, KeyboardInterrupt):
        print("\nAnnule. Relance le script quand tu as les deux valeurs.")
        return 1

    if not url.startswith("https://") or ".supabase.co" not in url:
        print("URL refusee : elle doit ressembler a https://<projet>.supabase.co")
        return 2
    if len(key) < 20:
        print("Cle trop courte. Copie la clé service_role (pas anon).")
        return 2

    current = ENV_PATH.read_text(encoding="utf-8") if ENV_PATH.exists() else ""
    updated = upsert(current, "SUPABASE_URL", url)
    updated = upsert(updated, "SUPABASE_SERVICE_ROLE_KEY", key)
    ENV_PATH.write_text(updated, encoding="utf-8")
    print()
    print(f"OK — .env.local mis a jour (URL {len(url)} car., cle {len(key)} car.).")
    print("La cle n'a pas ete affichee. .env.local est gitignore.")
    print("Ensuite : python scripts/upload-inspirations.py --self-test")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
