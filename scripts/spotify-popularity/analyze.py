#!/usr/bin/env python3
"""Correlate monthly listeners with Spotify popularity from data/results.csv.

Usage:
    python3 scripts/spotify-popularity/analyze.py          # exact / ID matches only
    python3 scripts/spotify-popularity/analyze.py --all    # also fuzzy / ambiguous name matches

Popularity is a 0-100 score, listeners span ~6 orders of magnitude, so the relationship is
expected to be roughly linear in log10(listeners), not in raw listeners. Both are reported.
"""
from __future__ import annotations

import csv
import math
import statistics as st
import sys
from pathlib import Path

RESULTS = Path(__file__).resolve().parent / "data" / "results.csv"


def main() -> int:
    use_all = "--all" in sys.argv
    with RESULTS.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    data = [
        (int(r["monthly_listeners"]), int(r["popularity"]))
        for r in rows
        if int(r["monthly_listeners"]) > 0 and r["popularity"] != ""
        and (use_all or r["match"] in ("id", "exact"))
    ]
    print(f"{len(rows)} artists in file, {len(data)} used"
          + ("" if use_all else " (fuzzy/ambiguous name matches excluded; --all to include)"))
    if len(data) < 10:
        print("Need at least 10 artists for anything meaningful.")
        return 1

    L = [d[0] for d in data]
    logL = [math.log10(x) for x in L]
    P = [float(d[1]) for d in data]

    print("\nCorrelation with popularity")
    print(f"  Pearson  r, raw listeners    : {st.correlation(L, P):+.3f}")
    print(f"  Pearson  r, log10(listeners) : {st.correlation(logL, P):+.3f}")
    print(f"  Spearman rho (rank)          : {st.correlation(L, P, method='ranked'):+.3f}")

    # popularity ~ a + b*log10(listeners)
    b, a = st.linear_regression(logL, P)
    res = [p - (a + b * x) for x, p in zip(logL, P)]
    r2 = 1 - sum(e * e for e in res) / sum((p - st.fmean(P)) ** 2 for p in P)
    print("\nFit: popularity = {:.2f} + {:.2f} * log10(listeners)".format(a, b))
    print(f"  R^2 {r2:.3f}, residual SD {st.stdev(res):.1f} popularity points")
    print(f"  => every 10x more listeners adds ~{b:.1f} popularity points")

    # inverse: log10(listeners) ~ c + d*popularity, for estimating listeners from popularity
    d, c = st.linear_regression(P, logL)
    sd = st.stdev([y - (c + d * p) for p, y in zip(P, logL)])
    print("\nEstimate listeners from popularity: listeners = 10^({:.3f} + {:.4f} * popularity)".format(c, d))
    print(f"  typical error: x/÷ {10 ** sd:.1f} (68% of artists fall within that factor)")
    for p in range(10, 100, 10):
        if min(P) <= p <= max(P):
            print(f"  popularity {p:>2}: ~{10 ** (c + d * p):>13,.0f}")

    print("\nObserved listeners by popularity band")
    print(f"  {'band':>7} {'n':>4} {'median':>13} {'min':>13} {'max':>13}")
    for lo in range(0, 100, 10):
        band = [l for l, p in data if lo <= p < lo + 10 or (lo == 90 and p == 100)]
        if band:
            print(f"  {lo:>3}-{lo + 9:<3} {len(band):>4} {st.median(band):>13,.0f} "
                  f"{min(band):>13,} {max(band):>13,}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
