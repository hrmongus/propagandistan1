# FanpageKit landing page

Static landing page for FanpageKit, implemented from the Claude Design file
`FanpageKit Landing v2.dc.html`. Open `index.html` directly or serve the folder with any static server.

## Files

- `index.html` — page markup: landing, checkout and access views
- `assets/styles.css` — styles (dark, Geist, Apple-style)
- `assets/support.js` — data, seeded chart series, view switching and all interactions
- `assets/favicon.svg`
- `uploads/` — where the videos, thumbnails, logos and pack art go (see `uploads/README.md`)

## Configuration

Set `window.FANPAGEKIT_CONFIG` before `assets/support.js` loads to override the design's tweaks:

```html
<script>
  window.FANPAGEKIT_CONFIG = {
    accent: 'white',        // 'white' | 'blue' | 'green'
    heroSeconds: 60,        // hero reel marquee duration
    marqueeSeconds: 50,     // account marquee duration
    discordUrl: '#',
    driveUrl: '#',
    calendlyUrl: ''         // Calendly embed on the access page
  };
</script>
```

## Behaviour

- Hero and account marquees pause on hover; videos play only while in view.
- "Anatomy of one reel" draws connector lines from the callouts to the reel, with a scroll parallax, and scales down under 780px.
- "Spikes you rent, or a curve you own" is a draggable before/after comparison over two seeded listener series.
- Steps and FAQ are accordions; the time-saved bars carry a scroll-driven sheen.
- Buying a pack opens the checkout view (bundle upgrade, monthly option, totals). Paying opens the four-step access view.
  The payment form is a front-end mock and does not charge anything.
