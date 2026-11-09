#!/usr/bin/env python3
"""Find Instagram/TikTok accounts for artists in data/results.csv and fetch TikTok follower counts.

Usage:
    python3 scripts/spotify-popularity/socials.py

1. Accounts: MusicBrainz, looked up by Spotify artist ID (no name guessing). Artists missing
   from MusicBrainz get no accounts; add them by hand in data/socials.csv (instagram_url /
   tiktok_url) and re-run to fetch their counts.
2. TikTok followers: read from the public profile page (TikTok rounds them, e.g. 17.3M).
   Polite pace, honest client name. If TikTok stops serving data, the script stops instead of
   trying to get around it.
Instagram counts are not fetched: logged-out visitors get a login wall.

Re-running is safe: rows already done are skipped and the CSV is saved after every artist.
"""
from __future__ import annotations

import csv
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
RESULTS = HERE / "data" / "results.csv"
SOCIALS = HERE / "data" / "socials.csv"
UA = "artist-research-script/0.1 ( github.com/hrmongus/propagandistan1 )"
FIELDS = ["spotify_id", "artist", "mbid", "instagram_url", "instagram_source", "tiktok_url",
          "tiktok_source", "tiktok_followers", "tiktok_status", "tiktok_nickname", "tiktok_verified",
          "spotify_page_listeners", "fetched_at"]


def unicodedata_ascii(s: str) -> str:
    import unicodedata
    return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()


def http(url: str, timeout: int = 30) -> tuple[int, str]:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.status, r.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            return e.code, ""
        except (urllib.error.URLError, OSError):  # dropped connection, timeout
            time.sleep(5 * 2 ** attempt)
    raise RuntimeError(f"network kept failing for {url}")


_last_mb = 0.0


def mb(path: str) -> dict | None:
    """MusicBrainz allows 1 request/second per client."""
    global _last_mb
    for attempt in range(5):
        time.sleep(max(0.0, 1.1 - (time.time() - _last_mb)))
        _last_mb = time.time()
        code, body = http("https://musicbrainz.org/ws/2/" + path)
        if code == 200:
            return json.loads(body)
        if code == 404:
            return None
        if code in (503, 429):
            time.sleep(2 ** attempt)
            continue
        raise RuntimeError(f"MusicBrainz {code} for {path}")
    raise RuntimeError(f"MusicBrainz kept rate limiting {path}")


def find_socials(spotify_id: str) -> tuple[str, str, str]:
    url = urllib.parse.quote(f"https://open.spotify.com/artist/{spotify_id}", safe="")
    d = mb(f"url?resource={url}&inc=artist-rels&fmt=json")
    artists = [r["artist"]["id"] for r in (d or {}).get("relations", []) if "artist" in r]
    if len(artists) != 1:  # 0 = not in MusicBrainz, >1 = shared link, can't tell which
        return "", "", ""
    a = mb(f"artist/{artists[0]}?inc=url-rels&fmt=json") or {}
    links = [r["url"]["resource"] for r in a.get("relations", []) if "url" in r and not r.get("ended")]
    ig = next((u for u in links if re.search(r"instagram\.com/[^/?#]+", u)), "")
    tt = next((u for u in links if re.search(r"tiktok\.com/@[^/?#]+", u)), "")
    return artists[0], ig, tt


def tiktok_followers(url: str) -> tuple[str, str]:
    handle = re.search(r"tiktok\.com/@([^/?#]+)", url).group(1)
    code, html = http(f"https://www.tiktok.com/@{handle}")
    if code == 404:
        return "", "not_found"
    m = re.search(r'"webapp\.user-detail":(\{.*?\})\s*,\s*"webapp\.', html, re.S)
    if m:
        try:
            info = json.loads(m.group(1))
            if info.get("statusCode") not in (0, None):
                return "", f"tiktok_status_{info.get('statusCode')}"  # e.g. deleted/private
            return str(info["userInfo"]["stats"]["followerCount"]), "ok"
        except (KeyError, json.JSONDecodeError):
            pass
    m = re.search(r'"followerCount":(\d+)', html)
    return (m.group(1), "ok") if m else ("", "no_data")


def save(rows: dict[str, dict]) -> None:
    tmp = SOCIALS.with_suffix(".tmp")
    with tmp.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS, restval="", extrasaction="ignore")
        w.writeheader()
        w.writerows(rows.values())
    tmp.replace(SOCIALS)


def main() -> int:
    with RESULTS.open(newline="", encoding="utf-8") as f:
        artists = [(r["spotify_id"], r["spotify_name"]) for r in csv.DictReader(f)]
    rows: dict[str, dict] = {}
    if SOCIALS.exists():
        with SOCIALS.open(newline="", encoding="utf-8") as f:
            rows = {r["spotify_id"]: r for r in csv.DictReader(f)}

    print("Phase 1: accounts from MusicBrainz", flush=True)
    for i, (sid, name) in enumerate(artists, 1):
        if sid in rows:
            continue
        mbid, ig, tt = find_socials(sid)
        rows[sid] = {"spotify_id": sid, "artist": name, "mbid": mbid, "instagram_url": ig,
                     "tiktok_url": tt, "tiktok_followers": "", "tiktok_status": "", "fetched_at": ""}
        print(f"[{i}/{len(artists)}] {name}: mb={'y' if mbid else 'n'} ig={'y' if ig else '-'} "
              f"tt={'y' if tt else '-'}", flush=True)
        save(rows)

    print("\nPhase 2: TikTok followers", flush=True)
    todo = [r for r in rows.values() if r["tiktok_url"] and r["tiktok_status"] in ("", "no_data")]
    misses = 0
    for i, r in enumerate(todo, 1):
        count, status = tiktok_followers(r["tiktok_url"])
        r.update(tiktok_followers=count, tiktok_status=status,
                 fetched_at=datetime.now(timezone.utc).isoformat(timespec="seconds"))
        save(rows)
        print(f"[{i}/{len(todo)}] {r['artist']}: {count or status}", flush=True)
        misses = misses + 1 if status == "no_data" else 0
        if misses >= 3:
            print("TikTok stopped returning profile data 3 times in a row; stopping. "
                  "Re-run later to continue.", flush=True)
            break
        time.sleep(4)

    total = len(rows)
    n_ig = sum(1 for r in rows.values() if r["instagram_url"])
    n_tt = sum(1 for r in rows.values() if r["tiktok_url"])
    n_ok = sum(1 for r in rows.values() if r["tiktok_status"] == "ok")
    print(f"\n{total} artists: {n_ig} with Instagram, {n_tt} with TikTok, {n_ok} TikTok counts fetched")
    return 0


if __name__ == "__main__":
    sys.exit(main())
