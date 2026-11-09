#!/usr/bin/env python3
"""Merge results.csv + socials.csv into data/final.csv (one row per artist, sorted by listeners).

Usage:
    python3 scripts/spotify-popularity/build_final.py
"""
from __future__ import annotations

import csv
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "data" / "final.csv"
RAW = HERE / "data" / "raw.csv"

# Fitted on artists with popularity 10-32 (~2k-50k listeners), 9 Nov 2026. See README.
MID = (2.756, 0.0613)    # middle estimate: half of artists above, half below
HIGH = (2.899, 0.0613)   # estimate is higher than the real number ~90% of the time

TRUSTED = {"source", "verified", "linked"}
COLS = ["artist", "spotify_url", "monthly_listeners", "spotify_page_listeners", "popularity",
        "spotify_followers", "followers_per_listener", "est_listeners_mid", "est_listeners_90",
        "instagram_url", "instagram_source", "tiktok_url", "tiktok_followers", "tiktok_source",
        "tiktok_confidence", "tiktok_trusted", "tiktok_videos", "fetched_at"]


def est(p: int, f: tuple[float, float]) -> str:
    return str(round(10 ** (f[0] + f[1] * p))) if 10 <= p <= 32 else ""


def main() -> int:
    with (HERE / "data" / "results.csv").open(newline="", encoding="utf-8") as f:
        results = list(csv.DictReader(f))
    socials: dict[str, dict] = {}
    p = HERE / "data" / "socials.csv"
    if p.exists():
        with p.open(newline="", encoding="utf-8") as f:
            socials = {r["spotify_id"]: r for r in csv.DictReader(f)}

    out = []
    for r in results:
        s = socials.get(r["spotify_id"], {})
        listeners, pop = int(r["monthly_listeners"]), int(r["popularity"])
        followers = int(r["followers"]) if r["followers"] else None
        tt_ok = s.get("tiktok_status") == "ok"
        conf = (s.get("tiktok_confidence") or ("source" if s.get("tiktok_source") != "guess" else "unchecked")) if tt_ok else ""
        out.append({
            "artist": r["spotify_name"],
            "spotify_url": f"https://open.spotify.com/artist/{r['spotify_id']}",
            "monthly_listeners": listeners,
            "spotify_page_listeners": s.get("spotify_page_listeners", ""),
            "popularity": pop,
            "spotify_followers": followers if followers is not None else "",
            "followers_per_listener": f"{followers / listeners:.2f}" if followers is not None and listeners else "",
            "est_listeners_mid": est(pop, MID),
            "est_listeners_90": est(pop, HIGH),
            "instagram_url": s.get("instagram_url", ""),
            "instagram_source": s.get("instagram_source", "") or ("musicbrainz" if s.get("instagram_url") else ""),
            "tiktok_url": s.get("tiktok_url", "") if tt_ok else "",
            "tiktok_followers": s.get("tiktok_followers", "") if tt_ok else "",
            "tiktok_source": s.get("tiktok_source", "") or ("musicbrainz" if tt_ok else ""),
            "tiktok_confidence": conf,
            "tiktok_trusted": ("yes" if conf in TRUSTED else "no") if tt_ok else "",
            "tiktok_videos": s.get("tiktok_videos", ""),
            "fetched_at": r["fetched_at"][:10],
        })
    out.sort(key=lambda x: -x["monthly_listeners"])
    with OUT.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=COLS)
        w.writeheader()
        w.writerows(out)

    # Lean version: only trusted TikTok counts; Instagram counts can't be fetched (login wall).
    with RAW.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["artist", "monthly_listeners", "popularity", "spotify_followers",
                    "tiktok_followers", "instagram_followers"])
        for x in out:
            w.writerow([x["artist"], x["monthly_listeners"], x["popularity"], x["spotify_followers"],
                        x["tiktok_followers"] if x["tiktok_trusted"] == "yes" else "", ""])
    print(f"Wrote {RAW}")

    tt = [x for x in out if x["tiktok_followers"] != ""]
    print(f"Wrote {len(out)} artists to {OUT}")
    print(f"  Instagram accounts: {sum(1 for x in out if x['instagram_url'])}")
    print(f"  TikTok counts: {len(tt)} ({sum(1 for x in tt if x['tiktok_trusted'] == 'yes')} trusted, "
          f"{sum(1 for x in tt if x['tiktok_confidence'] == 'unchecked')} unchecked guesses)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
