#!/usr/bin/env python3
"""Find more Instagram/TikTok accounts and fetch TikTok follower counts. Run after socials.py.

Usage:
    python3 scripts/spotify-popularity/discover.py

Sources, in order of trust:
  musicbrainz  (already in socials.csv, from socials.py)
  spotify      public open.spotify.com artist page: the artist's linked socials + bio text.
               Spotify only lets artists link Facebook/Instagram/Twitter/Wikipedia, so TikTok
               only comes from bio text. The page also shows monthly listeners, saved as
               spotify_page_listeners.
  wikidata     looked up by Spotify artist ID
  guess        Instagram handle or artist name tried on TikTok, accepted only if the TikTok
               display name matches the artist name. Check these by hand.

Polite pace, honest client name, no logins. Stops a source if it stops serving data.
Re-running is safe; progress is saved after every artist.
"""
from __future__ import annotations

import base64
import csv
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone

import socials as S
from fetch import norm

WIKIDATA = "https://query.wikidata.org/sparql"
TT_RE = re.compile(r"tiktok\.com/@([A-Za-z0-9_.]{2,24})")
IG_RE = re.compile(r"instagram\.com/([A-Za-z0-9_.]{1,30})")
IG_SKIP = {"p", "reel", "explore", "stories", "accounts", "tv"}


def wikidata(ids: list[str]) -> dict[str, dict]:
    q = ("SELECT ?sp ?tt ?ig WHERE { VALUES ?sp { %s } ?a wdt:P1902 ?sp . "
         "OPTIONAL {?a wdt:P7085 ?tt} OPTIONAL {?a wdt:P2003 ?ig} }") % " ".join(f'"{i}"' for i in ids)
    req = urllib.request.Request(
        WIKIDATA, data=urllib.parse.urlencode({"query": q, "format": "json"}).encode(),
        headers={"User-Agent": S.UA, "Accept": "application/sparql-results+json"})
    out: dict[str, dict] = {}
    with urllib.request.urlopen(req, timeout=120) as r:
        for b in json.load(r)["results"]["bindings"]:
            d = out.setdefault(b["sp"]["value"], {})
            if "tt" in b:
                d.setdefault("tt", b["tt"]["value"])
            if "ig" in b:
                d.setdefault("ig", b["ig"]["value"])
    return out


def spotify_page(spotify_id: str) -> dict | None:
    code, html = S.http(f"https://open.spotify.com/artist/{spotify_id}")
    m = re.search(r'<script id="initialState" type="text/plain">([^<]+)</script>', html)
    if code != 200 or not m:
        return None
    blob = json.dumps(json.loads(base64.b64decode(m.group(1))))
    links = re.findall(r'"name": "(\w+)", "url": "([^"]+)"', blob)
    bio = re.search(r'"biography": \{"text": "((?:[^"\\]|\\.)*)"', blob)
    ml = re.search(r'"monthlyListeners": (\d+)', blob)
    return {"links": dict(links), "bio": json.loads(f'"{bio.group(1)}"') if bio else "",
            "listeners": ml.group(1) if ml else ""}


def tiktok_profile(handle: str) -> tuple[str, dict | None]:
    """('ok', user+stats) | ('missing', None) | ('no_data', None)."""
    code, html = S.http(f"https://www.tiktok.com/@{handle}")
    if code == 404:
        return "missing", None
    m = re.search(r'"webapp\.user-detail":(\{.*?\})\s*,\s*"webapp\.', html, re.S)
    if not m:
        return "no_data", None
    try:
        d = json.loads(m.group(1))
    except json.JSONDecodeError:
        return "no_data", None
    if d.get("statusCode") not in (0, None) or "userInfo" not in d:
        return "missing", None
    return "ok", {**d["userInfo"]["user"], **d["userInfo"]["stats"]}


def name_matches(artist: str, nickname: str) -> bool:
    a, n = norm(artist), norm(nickname)
    if not a or not n:
        return False
    return a == n or (len(a) >= 5 and a in n) or (len(n) >= 5 and n in a)


def main() -> int:
    with S.SOCIALS.open(newline="", encoding="utf-8") as f:
        rows = {r["spotify_id"]: r for r in csv.DictReader(f)}
    for r in rows.values():
        for k in S.FIELDS:
            r.setdefault(k, "")
        if r["tiktok_status"].startswith("tiktok_status_") or r["tiktok_status"] == "not_found":
            r.update(tiktok_url="", tiktok_status="")  # dead link: retry via other sources
        if r["tiktok_url"] and not r["tiktok_source"]:
            r["tiktok_source"] = "musicbrainz"
        if r["instagram_url"] and not r["instagram_source"]:
            r["instagram_source"] = "musicbrainz"
    S.save(rows)

    print("Wikidata...", flush=True)
    wd = wikidata(list(rows))
    for sid, d in wd.items():
        r = rows[sid]
        if d.get("tt") and not r["tiktok_url"]:
            r.update(tiktok_url=f"https://www.tiktok.com/@{d['tt']}", tiktok_source="wikidata")
        if d.get("ig") and not r["instagram_url"]:
            r.update(instagram_url=f"https://www.instagram.com/{d['ig']}/", instagram_source="wikidata")
    S.save(rows)

    print("Spotify artist pages...", flush=True)
    misses = 0
    for i, r in enumerate(rows.values(), 1):
        if r["spotify_page_listeners"]:
            continue
        page = spotify_page(r["spotify_id"])
        time.sleep(1.5)
        if page is None:
            misses += 1
            print(f"  [{i}] {r['artist']}: no page data", flush=True)
            if misses >= 3:
                print("Spotify stopped serving page data; skipping the rest.", flush=True)
                break
            continue
        misses = 0
        r["spotify_page_listeners"] = page["listeners"] or "?"
        ig = page["links"].get("INSTAGRAM", "")
        if ig and not r["instagram_url"]:
            r.update(instagram_url=ig, instagram_source="spotify")
        tt = TT_RE.search(page["bio"]) or TT_RE.search(" ".join(page["links"].values()))
        if tt and not r["tiktok_url"]:
            r.update(tiktok_url=f"https://www.tiktok.com/@{tt.group(1)}", tiktok_source="spotify")
        print(f"  [{i}/{len(rows)}] {r['artist']}: ig={'y' if r['instagram_url'] else '-'} "
              f"tt={'y' if r['tiktok_url'] else '-'}", flush=True)
        S.save(rows)

    print("TikTok: counts for known accounts, guesses for the rest...", flush=True)
    misses = 0
    for i, r in enumerate(rows.values(), 1):
        if r["tiktok_status"] in ("ok", "missing", "no_match"):
            continue
        if r["tiktok_url"]:
            candidates = [(TT_RE.search(r["tiktok_url"]).group(1), r["tiktok_source"])]
        else:
            cands: list[str] = []
            ig = IG_RE.search(r["instagram_url"] or "")
            if ig and ig.group(1).lower() not in IG_SKIP:
                cands.append(ig.group(1).rstrip("."))
            n = re.sub(r"[^a-z0-9_.]", "", S.unicodedata_ascii(r["artist"]).lower())
            if len(n) >= 4:
                cands += [n, n + "music"]
            candidates = [(c, "guess") for c in dict.fromkeys(cands)]
        found = False
        for handle, source in candidates:
            status, u = tiktok_profile(handle)
            time.sleep(3)
            if status == "no_data":
                misses += 1
                if misses >= 4:
                    print("TikTok stopped serving profile data; stopping. Re-run later.", flush=True)
                    S.save(rows)
                    return 0
                continue
            misses = 0
            if status == "ok" and (source != "guess" or name_matches(r["artist"], u.get("nickname", ""))):
                r.update(tiktok_url=f"https://www.tiktok.com/@{u['uniqueId']}", tiktok_source=source,
                         tiktok_followers=str(u["followerCount"]), tiktok_status="ok",
                         tiktok_nickname=u.get("nickname", ""), tiktok_verified=str(u.get("verified", "")),
                         fetched_at=datetime.now(timezone.utc).isoformat(timespec="seconds"))
                found = True
                break
        if not found:
            r["tiktok_status"] = "missing" if r["tiktok_url"] else "no_match"
        print(f"  [{i}/{len(rows)}] {r['artist']}: "
              f"{r['tiktok_followers'] + ' (' + r['tiktok_source'] + ')' if found else r['tiktok_status']}",
              flush=True)
        S.save(rows)

    ok = [r for r in rows.values() if r["tiktok_status"] == "ok"]
    by = {}
    for r in ok:
        by[r["tiktok_source"]] = by.get(r["tiktok_source"], 0) + 1
    print(f"\n{len(rows)} artists: {sum(1 for r in rows.values() if r['instagram_url'])} with Instagram, "
          f"{len(ok)} TikTok counts {by}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
