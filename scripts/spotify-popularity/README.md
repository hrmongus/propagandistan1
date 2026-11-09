# Spotify popularity vs monthly listeners

A one-off research tool. It is not part of the app.

1. Write a CSV with `artist,monthly_listeners[,spotify_id]`. `spotify_id` can be an ID, open.spotify.com URL or URI.
   Fill it in where you can, because name search can match the wrong artist.
2. `SPOTIFY_CLIENT_ID=… SPOTIFY_CLIENT_SECRET=… python3 scripts/spotify-popularity/fetch.py artists.csv`
   adds the results to `data/results.csv`. Re-running is safe. Rows that matched by name and are marked FUZZY or AMBIGUOUS need checking.
3. `python3 scripts/spotify-popularity/analyze.py` prints Pearson (raw and log), Spearman, the log fit and popularity bands.

**Caveat:** since Feb/Mar 2026 Spotify removes `popularity` from Development Mode apps. Only Extended Quota Mode
apps still receive it. `fetch.py` detects this on the first artist and stops.
