# Fanpage Blueprint Builder: build handoff

This is a mobile-first lead-magnet quiz for **FanpageKit**. An independent artist picks a Spotify track and answers 9 short questions. They then get **"Your Fanpage Blueprint"**: a **Fanpage Fit Score**, 3 fan page concepts, written hooks and a 6-month growth chart. The Blueprint sells a FanpageKit content pack ($37) and offers a bundle upgrade ($97).

The zip holds **static design mock-ups**, one HTML file per screen. Treat them as the visual source of truth for layout, copy, spacing and colour. They have **no logic and no navigation**: every interaction, the data flow and the integrations described below still have to be built.

---

## 1. What's in the zip

```
fanpage-blueprint-builder-screens/
  index.html                     list of all screens, in flow order
  00-landing.html … 18b-checkout-2-payment.html   one file per screen
  assets/imagery/                pack covers + mood stills (placeholders, low-res)
  assets/logo/                   FanpageKit lockup (white PNG, low-res; ask for SVG)
  assets/proof/                  3 Spotify for Artists screenshots used on proof cards
HANDOFF.md                       this file
```

- Each screen is a self-contained HTML file. The design tokens and component CSS are inlined in `<head>`, and images are relative paths into `assets/`.
- Fonts are **Geist** and **Geist Mono**, loaded from Google Fonts. They need a network connection; offline, the pages fall back to the system font.
- Every screen is drawn at a fixed **390px** width (iPhone 14/15). Some have a fixed design height so the whole scroll is visible. Build them as normal scrolling mobile pages with fluid width, not fixed-height boxes.
- The example data is the same on every screen: track "Paper Planes in July" by Nova Reyes; 1K–10K listeners now, goal 100K; aesthetics Light academia, Clean girl and Coquette; audience 18–24, women. In the real build, all of this comes from the user's answers.

## 2. Suggested stack

- Next.js (App Router) + TypeScript + Tailwind, or whatever the existing FanpageKit site uses.
- One route, a quiz state machine (a reducer or Zustand), and a persisted session id so a refresh doesn't lose answers.
- Server routes for Spotify search, preview fetch, analysis, lead capture and checkout (Stripe).
- Ship the design tokens below as CSS variables or a Tailwind theme. Don't hard-code hex values per component.

## 3. Screen flow

| # | File | Screen | Step | What happens / data captured |
|---|------|--------|------|------------------------------|
| 00 | `00-landing.html` | Landing: "Free Fanpage Blueprint Builder." | – | Ad destination. Avatar row with "Trusted by [N]+ independent artists". Step-1 card with search box, 2 trust ticks, a "paste the Spotify link" hint and the "Build my Blueprint" CTA. A one-line distributor carousel, 3-step "How it works", 4 FAQ accordions and a final CTA. |
| 01 | `01-track-search.html` | Track search | – | Search input with live results (cover, title, artist, "On Spotify") and the selected state. "Not on Spotify yet? Upload an MP3" fallback. CTA "Analyze my track" stays disabled until a track is picked. **Kick off the audio analysis in the background here.** |
| 02 | `02-listeners-now.html` | Q1 Where are you now? | 1/9 | Single select: Under 1K / 1K–10K / 10K–50K / 50K–100K / 100K+ (with icons). Self-reported; the API can't return monthly listeners. |
| 03 | `03-did-you-know.html` | Interstitial: "#1 Organic Music Marketing Method" | – | Gold award plaque, a label line and "Used by" logo slots. Reassurance while the analysis runs. |
| 04 | `04-six-month-goal.html` | Q2 Goal in 6 months | 2/9 | Single select: 10K / 50K / 100K / 500K / 1M. **Only show goals above the current bucket.** The live chart card (Today → Month 6) updates with the pick and becomes the goal line on the results chart. |
| 05 | `05-biggest-blocker.html` | Q3 Biggest blocker | 3/9 | Single select, 5 options with icons. The picked option expands into a "The fix: …" line (copy per option in §6). This is the main email segment. |
| 06 | `06-how-it-works.html` | How it works: post anatomy | – | Phone mock with 4 numbered layers: hook, lyrics, background video, track. In the build, highlight the layers one after another (~1.8s each). The lyric shown should be the user's transcribed line. |
| 07 | `07-aesthetics.html` | Q4 Aesthetics | 4/9 | Multi select, **max 3**, 2-column grid of 20 mood boards (name + genres). The pick order is shown as 1-2-3, and **the first pick becomes the "#1 best option"**. The sticky footer shows the picked thumbnails and "Next · n of 3 selected". |
| 08 | `08-audience.html` | Q5 Audience | 5/9 | Age chips (max 2, one row), a gender segmented control (with icons) and listening-moment chips (max 2, with icons). The moments drive the AI-written POV hooks. |
| 09 | `09-several-pages.html` | Interstitial: "One song. Several fan pages." | – | 3 mini reels built from the user's top 3 aesthetics and moments. |
| 10 | `10-what-you-tried.html` | Q6 What have you tried? | 6/9 | Multi select with icons. "Nothing yet" clears the others. |
| 11 | `11-proof.html` | Interstitial: proof | – | Swipeable review cards: name, genre and country, 5 stars, headline result, quote and a Spotify for Artists screenshot. **Names and quotes are placeholders. Use real, consenting artists only.** |
| 12 | `12-daily-time.html` | Q7 Daily time | 7/9 | Single select: 5 / 15 / 30 / 60+ minutes. |
| 13 | `13-next-release.html` | Q8 Next release | 8/9 | Single select: already out / next month / 1–3 months / none. Urgency line for the results and emails. |
| 14 | `14-experience.html` | Q9 Experience | 9/9 | Single select: never / tried, didn't stick / run one now. A "Ready to build" summary of all answers (each with an EDIT link). CTA "Build my strategy". |
| 15 | `15-analyzing.html` | Analyzing (loading) | – | Small TikTok-profile mock in the middle that "fills up"; the user's answers (track, aesthetics, audience, moments) animate into it. One status line swaps through the steps: reading audio → locating hook → transcribing lyrics → matching aesthetics → mapping audience → writing hooks → filling pages → modelling the 6-month path. Progress bar. Hold for about 12–15s even if the API finishes sooner. Honour `prefers-reduced-motion`. |
| 16 | `16-email-gate.html` | Results behind the email gate | – | Results blurred behind a bottom sheet. Teaser stats (Fanpage Fit Score, 3 pages, goal), first name and email fields, CTA "Show my blueprint". |
| 17 | `17-results-blueprint.html` | **Your Fanpage Blueprint** | – | Long results page: track card, headline "Fanpage Blueprint: Your path to 100k listeners", Fit Score as a %, untapped-audience visual, short-form radar, growth chart (0 / 1 / 3 pages, goal line, S4A-style white card with the blue line), top 3 fan pages (each with its **own FanpageKit kit**, example reel, scores and a "Launch this page" CTA), offer box (kit selector with #1 preselected, price block, guarantee, CTA), proof cards, FAQ and a sticky CTA. There's a red 10-minute expiry bar at the top (see §8). |
| 18 | `18-checkout-1-offer.html` | Checkout 1/2: your offer | – | Bottom sheet over the results: the chosen pack, what's inside, the price block, the guarantee, the 10-minute bar and the CTA "Start growing today". |
| 18b | `18b-checkout-2-payment.html` | Checkout 2/2: bundle + payment | – | Order summary, a bundle upsell toggle (on by default in the mock), a Card / Apple Pay / Google Pay switch, card fields, terms, "Pay $97 — get my packs", "Secure payment processed by Stripe" and "Back to offer". |

The "Order confirmed" screen was removed from the canvas. Rebuild it as a simple post-payment page: download link, a "post #1 today" next step, a booking link for the strategy call (bundle only) and the community link.

## 4. Data model (quiz state)

```ts
type QuizState = {
  sessionId: string
  track: { spotifyId: string; isrc?: string; title: string; artist: string; artworkUrl: string;
           deezerId?: string; previewUrl?: string } | null
  listenersNow: '<1k' | '1-10k' | '10-50k' | '50-100k' | '100k+'
  goal: '10k' | '50k' | '100k' | '500k' | '1M'             // must be > listenersNow
  blocker: 'reach' | 'time' | 'money' | 'unknown' | 'face'
  aesthetics: AestheticId[]                                 // ordered, max 3; [0] = best option
  age: ('13-17'|'18-24'|'25-34'|'35-44'|'45+')[]            // max 2
  gender: 'women' | 'men' | 'everyone'
  moments: MomentId[]                                       // max 2
  tried: TriedId[]                                          // 'nothing' is exclusive
  dailyTime: '5' | '15' | '30' | '60'
  release: 'out' | 'month' | '3m' | 'none'
  experience: 'never' | 'tried' | 'running'
  lead?: { firstName: string; email: string }
  analysis?: Analysis                                       // see §5
  selectedKit?: PackId                                      // offer selector, defaults to the #1 page's kit
  bundle: boolean
}
```

**Aesthetics → content pack** (from the original spec; each aesthetic maps to one of the 4 FanpageKit packs):

- **Golden Hour:** Old money, Light academia, Coquette, Clean girl, Balletcore, Weirdcore / dreamcore
- **Midnight City:** Streetwear, Mob wife, Grunge, Synthwave, Cyberpunk, Noir
- **Coastal Drive:** Y2K, Vaporwave, Coastal
- **Forest Trail:** Dark academia, Cottagecore, Gorpcore, Fairycore, Cowboy / western

In the mock, the 3 recommended pages deliberately use **three different kits** (Golden Hour, Coastal Drive, Midnight City). Pick the kits so the 3 pages don't share one: use the mapped kit first, and if two picks map to the same kit, fall back to the closest unused kit. Confirm this rule with the product owner.

**Listening moments → example hook** (seed copy for the AI hook generator):

- **Late-night drivers:** "pov: 2am, empty highway, this comes on"
- **The heartbroken:** "the song i play when i pretend i'm over you"
- **Main-character energy:** "walking into the party like it's my movie"
- **Gym & hype:** "the song that makes you add 10kg"
- **Study & chill:** "3 hours into studying and this saves me"
- **Summer & road trips:** "windows down, nowhere to be"
- **Nostalgic & homesick:** "this song sounds like your childhood bedroom"
- **Festival crowd:** "imagine hearing this live at 1am"

The audience screen in the canvas may use a newer set of moment labels; the mock HTML is the source of truth for the labels.

## 5. Integrations and logic

1. **Track search:** Spotify Web API search (client credentials) returns title, artist, artwork, ISRC and popularity. Debounce at 250ms. Accept a pasted Spotify track URL too.
2. **Preview audio:** look up ISRC → Deezer `/track/isrc:{ISRC}` for the 30s preview MP3. Deezer preview URLs are signed and expire, so store the Deezer track id and re-fetch the URL when needed. If there's no match, fall back to an MP3 upload.
3. **Analysis**, started in the background on screen 01:
   - lyric transcription of the preview (Whisper) → pick the best line for the overlay
   - hook start = the loudest ~10s window (optional)
   - **Displayed scores are presentation.** Seed them from the track id + answers so they're stable per track: Fit Score 78–90 (shown as %), radar values 68–96, untapped-audience % from the listener bucket. Don't show BPM or key, so nothing can be visibly wrong.
4. **Hooks:** generate 3 POV hooks per chosen moment with an LLM, using track mood + age as context, and show the best one.
5. **Example reels on the results page:** composed client-side from a pack clip (CDN MP4), hook text, the transcribed lyric line and the Deezer preview audio. Tap to play. If there are no vocals, show the hook only.
6. **Growth chart:** illustrative fixed shapes, not a forecast. Start label = listener bucket, dashed line = goal. The 3-page line crosses the goal around month 5. Draw jagged S4A-style lines (daily noise), not smooth curves. Keep the caption "Illustrative projection. Results depend on posting consistency."
7. **Lead capture (screen 16):** save `{firstName, email, answers, analysis, score}`, generate a shareable results URL `/b/{id}`, send email 1 with the link, and tag the contact in the ESP with: listener bucket, goal, blocker, aesthetics, audience, tried, release, experience.
8. **Checkout:** Stripe Checkout or Payment Element. Line items: selected kit $37, plus the optional bundle (+$60 → $97 total). Deliver the download after payment and send the receipt email.
9. **Analytics events:** `quiz_start`, `track_selected`, `question_answered{step}`, `analysis_done`, `lead_submitted`, `offer_viewed`, `kit_changed`, `bundle_toggled`, `checkout_started`, `purchase`.

## 6. Copy that isn't obvious from the screens

**Blocker → "The fix" line (screen 05):**

- **Nobody hears my music:** Fan pages put your song in front of new listeners every day.
- **No time to make content:** The content is ready-made. You only post.
- **Promo is too expensive:** One-time cost, no ad budget, and it keeps working.
- **I don't know what works:** A proven format with a step-by-step playbook.
- **I don't want to show my face:** 100% faceless. You're never on camera.

**Release → urgency line:**

- **Already out:** Your song is out. Start today and every post can send listeners straight to it.
- **Next month:** Start now so your page has momentum on release day.
- **1–3 months:** Perfect timing: you have weeks to grow your page before release.
- **None:** Start with your current catalogue. Your best song is already out.

**Results FAQ answers (screen 17):**

- **Do I need to show my face?** No. Faceless fan pages never show you. Your song is the focal point of every post.
- **How much time does it take?** About 4 minutes per post. The content is ready-made, so you only add your song and post.
- **Do I need editing skills?** No. Step-by-step guides for CapCut, Canva, iMovie and more walk you through every post.
- **Which platforms does it work on?** Instagram Reels and TikTok. Every clip is vertical and ready to post. You attach your track as the platform audio.
- **How fast will I see results?** It depends on your song and how consistently you post. Fan pages grow with steady daily posting, so start as early as you can.
- **Is this a subscription?** No. One-time payment. The pack is yours to keep, with a commercial licence and no royalties or credit required.
- **What if it doesn't work for me?** You're covered by our 30-day money-back guarantee.

The landing-page FAQ answers (screen 00) still need writing.

## 7. Pricing (as on the live FanpageKit site)

| Item | Price | Anchor | Badge |
|------|-------|--------|-------|
| Single pack (kit) | **$37** | ~~$57~~ | "−35% · launch price" |
| Bundle (all 4 packs + 1:1 strategy call) | **$97** | ~~$148~~ | "Save $51" (vs 4 × $37) |
| Bundle as an upgrade at checkout | +$60 | – | – |

Per-post cost shown on screen 18 is $37 ÷ 30 reels ≈ $1.23.

## 8. Placeholders and open decisions (must resolve before launch)

- **"[N]+ independent artists"** (landing): needs the real customer count.
- **"[N] of 200 … kits left"** (results offer): wire to real remaining stock per kit, or remove it.
- **Proof cards** (screens 11 + 17): "Artist name", genre/country and the quotes are mock-only. Replace them with real artists who agreed to be featured, and show 5 stars only if they actually gave that rating. The S4A screenshots are real assets, but confirm you have permission to use each one.
- **Label logos** (screen 03): empty "LOGO" slots. Showing real label logos implies endorsement, so get permission or keep the "the method labels use" wording without logos.
- **"#1 organic music marketing method of 2026"** (screen 03): this is a marketing claim with no source. Keep it framed as opinion or back it with a citation.
- **10-minute expiry bar** (screens 17 + 18): it has to reflect real behaviour, meaning the offer or results genuinely expire. A fake countdown can get Meta ads rejected and breaks FTC/EU consumer-protection rules on fake urgency.
- **Launch price anchor ($57):** only show the strike-through if $57 is a real former or regular price.
- **Logo:** the PNG is low-res; ask for the SVG.
- **Imagery:** the pack covers and mood stills are cropped, low-res placeholders. Swap in real pack frames.
- **Example data:** "Paper Planes in July / Nova Reyes" is example content throughout.

## 9. Design tokens (from the FanpageKit design system, inlined in every HTML file)

- **Ground:** `#000` page, cards `#111113`, controls `#18181A`, hairlines `rgba(255,255,255,.08/.14/.28)`.
- **Text:** primary `#F5F5F7`, secondary `#A1A1A6`, tertiary `#6E6E73`.
- **Accent (one only):** Signal green `#22D46B` (hover `#4DE58A`, ink on green `#03210F`). Use it for streams, "your track" and success only. Ember `#FF5A36` is for scarcity and expiry.
- **Charts:** white cards with the Spotify for Artists blue line `#1D6CF0` and a `#D6E4FB` fill.
- **Type:** Geist (display 600, tight tracking −0.035 to −0.045em) and Geist Mono for overlines, counts and meta. Headlines end with a full stop. Sentence case everywhere. No emoji, no exclamation marks.
- **Shape:** radii 6 / 10 / 14 / 20 / 24 / 28 / 36 / pill. Buttons, badges and segmented controls are always pills. Option cards are 20px.
- **Motion:** ease-out `cubic-bezier(.22,1,.36,1)`; 160ms hover, 280ms state, 560ms media; press scale 0.97.
- **Components used:** Button (primary / signal / outline / ghost), Badge (signal / scarce / outline), Input. Plain-HTML versions are in each file's CSS (`.btn`, `.badge`, `.field`).

**Selection states:**

- single select: card gets a 1.5px white border, a lighter fill and a white check circle
- multi select: square check boxes
- chips: a white fill when selected

**Accessibility:** real `<button>` and `<input>` elements, touch targets of 44px or more, 4.5:1 text contrast, `aria-pressed` / `aria-checked` on selections, reduced-motion support.

## 10. Prompt to start Claude Code with

> Build the "Fanpage Blueprint Builder" quiz funnel described in HANDOFF.md. The HTML files in this folder are static mock-ups. Match them pixel-close for layout, copy and tokens, but build them as real responsive mobile pages. Implement the quiz state machine (§4), the integrations (§5) with mocked services behind interfaces first, the email gate and the two-step Stripe checkout. Treat every item in §8 as a TODO that must not ship as placeholder text. Start by setting up the design tokens and the shared components (Button, Badge, Input, OptionCard, Chip, ProgressHeader, BottomSheet), then build the screens in order 00 → 18b.
