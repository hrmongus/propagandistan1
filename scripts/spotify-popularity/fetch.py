#!/usr/bin/env python3
"""Look up Spotify `popularity` for artists in a CSV and append the results to data/results.csv.

Usage:
    export SPOTIFY_CLIENT_ID=... SPOTIFY_CLIENT_SECRET=...
    python3 scripts/spotify-popularity/fetch.py path/to/artists.csv

Input CSV (header row required, column names are case-insensitive):
    artist             artist name (required unless spotify_id is given)
    monthly_listeners  e.g. 1234567, "1,234,567", "1.2M", "850K" (required)
    spotify_id         optional: artist ID, open.spotify.com URL or spotify:artist: URI.
                       Strongly recommended: name search can pick the wrong artist.

Re-running is safe: rows already in results.csv (same Spotify ID) are updated, not duplicated.
Standard library only, no pip install needed.
"""
from __future__ import annotations

import base64
import csv
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
RESULTS = HERE / "data" / "results.csv"
API = "https://api.spotify.com/v1"
FIELDS = [
    "artist_input", "monthly_listeners", "spotify_id", "spotify_name", "popularity",
    "followers", "match", "fetched_at",
]


class Spotify:
    def __init__(self, client_id: str, client_secret: str):
        self._basic = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
        self._token = None
        self._expires = 0.0

    def _auth(self) -> str:
        if self._token and time.time() < self._expires - 60:
            return self._token
        req = urllib.request.Request(
            "https://accounts.spotify.com/api/token",
            data=b"grant_type=client_credentials",
            headers={"Authorization": f"Basic {self._basic}",
                     "Content-Type": "application/x-www-form-urlencoded"},
        )
        with urllib.request.urlopen(req, timeout=30) as r:
            body = json.load(r)
        self._token = body["access_token"]
        self._expires = time.time() + body.get("expires_in", 3600)
        return self._token

    def get(self, path: str, params: dict | None = None) -> dict:
        url = API + path + ("?" + urllib.parse.urlencode(params) if params else "")
        for attempt in range(6):
            req = urllib.request.Request(url, headers={"Authorization": f"Bearer {self._auth()}"})
            try:
                with urllib.request.urlopen(req, timeout=30) as r:
                    return json.load(r)
            except urllib.error.HTTPError as e:
                if e.code == 429:
                    wait = int(e.headers.get("Retry-After", "5")) + 1
                    print(f"  rate limited, sleeping {wait}s", file=sys.stderr)
                    time.sleep(wait)
                elif e.code == 401 and attempt == 0:
                    self._token = None
                elif e.code >= 500:
                    time.sleep(2 ** attempt)
                else:
                    raise
        raise RuntimeError(f"giving up on {url}")


def norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "", s.replace("&", "and"))


def parse_listeners(raw: str) -> int | None:
    s = (raw or "").strip().upper().replace(",", "").replace(" ", "")
    m = re.fullmatch(r"(\d+(?:\.\d+)?)([KMB]?)", s)
    if not m:
        return None
    return round(float(m.group(1)) * {"": 1, "K": 1e3, "M": 1e6, "B": 1e9}[m.group(2)])


def parse_id(raw: str) -> str | None:
    m = re.search(r"(?:artist[/:])?([0-9A-Za-z]{22})", (raw or "").strip())
    return m.group(1) if m else None


def find_artist(sp: Spotify, name: str) -> tuple[str | None, str]:
    """Return (artist_id, match) where match is exact | ambiguous | fuzzy | none."""
    items = sp.get("/search", {"q": name, "type": "artist", "limit": 10})["artists"]["items"]
    if not items:
        return None, "none"
    exact = [a for a in items if norm(a["name"]) == norm(name)]
    if exact:
        # Search results are relevance-ranked, so the first exact match is the most likely one.
        return exact[0]["id"], "exact" if len(exact) == 1 else "ambiguous"
    return items[0]["id"], "fuzzy"


def load_results() -> dict[str, dict]:
    if not RESULTS.exists():
        return {}
    with RESULTS.open(newline="", encoding="utf-8") as f:
        return {r["spotify_id"]: r for r in csv.DictReader(f)}


def save_results(rows: dict[str, dict]) -> None:
    RESULTS.parent.mkdir(parents=True, exist_ok=True)
    tmp = RESULTS.with_suffix(".tmp")
    with tmp.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        w.writeheader()
        w.writerows(rows.values())
    tmp.replace(RESULTS)


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    cid, secret = os.environ.get("SPOTIFY_CLIENT_ID"), os.environ.get("SPOTIFY_CLIENT_SECRET")
    if not cid or not secret:
        print("Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.", file=sys.stderr)
        return 2

    with open(sys.argv[1], newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        reader.fieldnames = [(h or "").strip().lower() for h in reader.fieldnames or []]
        rows = list(reader)

    sp = Spotify(cid, secret)
    results = load_results()
    skipped, checked_field = [], False

    for i, row in enumerate(rows, 1):
        name = (row.get("artist") or "").strip()
        listeners = parse_listeners(row.get("monthly_listeners", ""))
        if listeners is None:
            skipped.append(f"row {i} ({name or '?'}): bad monthly_listeners {row.get('monthly_listeners')!r}")
            continue

        artist_id, match = parse_id(row.get("spotify_id", "")), "id"
        if not artist_id:
            if not name:
                skipped.append(f"row {i}: no artist name or spotify_id")
                continue
            artist_id, match = find_artist(sp, name)
            if not artist_id:
                skipped.append(f"row {i} ({name}): not found on Spotify")
                continue

        a = sp.get(f"/artists/{artist_id}")  # batch GET /artists was removed in Feb 2026
        if not checked_field and "popularity" not in a:
            print(
                "\nSpotify returned this artist WITHOUT a 'popularity' field.\n"
                "Since Feb/Mar 2026 Spotify strips `popularity` and `followers` from Development Mode\n"
                "apps; only Extended Quota Mode apps still get them. This app's credentials can't\n"
                "produce the data. Nothing was saved.",
                file=sys.stderr,
            )
            return 1
        checked_field = True

        results[a["id"]] = {
            "artist_input": name,
            "monthly_listeners": listeners,
            "spotify_id": a["id"],
            "spotify_name": a["name"],
            "popularity": a["popularity"],
            "followers": (a.get("followers") or {}).get("total", ""),
            "match": match,
            "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        }
        flag = "" if match in ("id", "exact") else f"   <-- {match.upper()}, check it"
        print(f"[{i}/{len(rows)}] {name or a['name']} -> {a['name']}: popularity {a['popularity']}{flag}")
        save_results(results)  # save as we go so a crash loses nothing

    print(f"\nSaved {len(results)} artists total to {RESULTS}")
    if skipped:
        print(f"Skipped {len(skipped)}:\n  " + "\n  ".join(skipped))
    return 0


if __name__ == "__main__":
    sys.exit(main())
