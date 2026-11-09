#!/usr/bin/env python3
"""Grade TikTok accounts found by guessing (discover.py) so squatters/empty accounts can be excluded.

Usage:
    python3 scripts/spotify-popularity/verify.py

Sets tiktok_confidence for every TikTok row:
  source    account came from MusicBrainz, the Spotify page or Wikidata (linked by the artist/editors)
  verified  guessed, but TikTok-verified
  linked    guessed; bio link or bio text points to music (Spotify, Linktree, Bandcamp, "new single"...)
            or mentions the artist's Instagram handle
  weak      guessed; name matches but nothing else ties it to the artist  -> don't trust
  empty     guessed; account has no videos                                -> don't trust
"""
from __future__ import annotations

import csv
import re
import sys
import time

import socials as S
from discover import IG_RE, TT_RE, tiktok_profile

MUSIC = re.compile(
    r"spotify|linktr|bandcamp|apple\.co|music\.apple|soundcloud|youtube|lnk\.to|ffm\.to|hypeddit|"
    r"distrokid|songwhip|bio\.site|beacons|smarturl|feature\.fm|\bmusic\b|\bband\b|single|album|\bep\b|"
    r"out now|new song|listen|stream|tour|tickets|singer|songwriter|producer|\bdj\b|rapper|records",
    re.I)


def main() -> int:
    with S.SOCIALS.open(newline="", encoding="utf-8") as f:
        rows = {r["spotify_id"]: r for r in csv.DictReader(f)}
    misses = 0
    todo = [r for r in rows.values() if r.get("tiktok_status") == "ok" and not r.get("tiktok_confidence")]
    for i, r in enumerate(todo, 1):
        if r["tiktok_source"] != "guess":
            r["tiktok_confidence"] = "source"
            continue
        status, u = tiktok_profile(TT_RE.search(r["tiktok_url"]).group(1))
        time.sleep(3)
        if status != "ok":
            misses += status == "no_data"
            if misses >= 4:
                print("TikTok stopped serving profile data; stopping. Re-run later.")
                break
            continue
        misses = 0
        bio = u.get("signature") or ""
        link = ((u.get("bioLink") or {}).get("link")) or ""
        ig = IG_RE.search(r.get("instagram_url") or "")
        if not u.get("videoCount"):
            conf = "empty"
        elif u.get("verified"):
            conf = "verified"
        elif MUSIC.search(bio + " " + link) or (ig and ig.group(1).lower() in (bio + link).lower()):
            conf = "linked"
        else:
            conf = "weak"
        r.update(tiktok_confidence=conf, tiktok_videos=str(u.get("videoCount", "")),
                 tiktok_bio=(bio + (" | " + link if link else "")).replace("\n", " ")[:200],
                 tiktok_followers=str(u["followerCount"]))
        print(f"[{i}/{len(todo)}] {r['artist']}: {conf} ({u['followerCount']} followers, "
              f"{u.get('videoCount')} videos)", flush=True)
        S.save(rows)
    S.save(rows)
    from collections import Counter
    print(Counter(r.get("tiktok_confidence") for r in rows.values() if r.get("tiktok_status") == "ok"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
