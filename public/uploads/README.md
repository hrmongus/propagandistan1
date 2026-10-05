# Media

The site serves media from `public/uploads/` at `/uploads/...`. Drop the files in and they load; until then every slot falls back to the gradient placeholder the design uses.

- `hero-1.mp4` … `hero-7.mp4` — hero carousel reels (9:16, silent). `hero-4.mp4` (baby doll) also plays in the "Anatomy of one reel" phone.
- `pages/page1_s1.webp` … `pages/page12_s6.webp` — reel screenshots for the 12 fan-page account cards (page N = card N, six tiles each; `s1` is also the avatar).
- `logos/capcut.png`, `logos/davinci-resolve.png`, `logos/final-cut-pro.png`, `logos/premiere-pro.png`, `logos/canva.png`, `logos/imovie.png`, `logos/edits.png`, `logos/instagram.png`, `logos/tiktok.png` — 32×32 tool logos.
- `packs/<slug>-1.webp` … `packs/<slug>-4.webp` and `packs/<slug>.mp4` for each of `golden-hour`, `midnight-city`, `coastal-drive`, `forest-trail` — pack fan tiles (9:16); `midnight-city-2`, `golden-hour-3` and `coastal-drive-2` also preview the "What you actually download" card.

## Encoding

Files here are web-optimised copies of the Claude Design originals (not committed):

- Reels: H.264, 540×960, CRF 30, `+faststart`, no audio.
- Pack loops: H.264, 240 px wide, CRF 28, 30 fps, no audio.
- Every `.mp4` has a first-frame poster next to it with the same name and `.webp` (`LazyVideo` picks it up automatically).
- Pack art: WebP, 270 px wide. Account screenshots: WebP, 240 px wide.

```bash
ffmpeg -i in.mp4 -vf scale=540:-2 -c:v libx264 -preset slower -crf 30 -pix_fmt yuv420p -g 60 -an -movflags +faststart out.mp4
ffmpeg -i out.mp4 -frames:v 1 -c:v libwebp -quality 70 out.webp
ffmpeg -i in.png -vf scale=270:-2 -c:v libwebp -quality 82 out.webp
```
