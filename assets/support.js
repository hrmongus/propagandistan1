/* FanpageKit landing — behaviour translated from the Claude Design component logic. */
(function () {
  'use strict';

  /* ---------- config (the design's "Tweaks") ---------- */
  var CONFIG = Object.assign({
    accent: 'white',          // 'white' | 'blue' | 'green'
    heroSeconds: 60,          // hero reel marquee duration
    marqueeSeconds: 50,       // account marquee duration
    discordUrl: '#',
    driveUrl: '#',
    calendlyUrl: ''           // e.g. 'https://calendly.com/you/onboarding'
  }, window.FANPAGEKIT_CONFIG || {});

  var ACCENTS = { white: '#F5F5F7', blue: '#2997FF', green: '#30D158' };
  document.documentElement.style.setProperty('--accent', ACCENTS[CONFIG.accent] || ACCENTS.white);

  /* ---------- helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pad2(n) { return String(n).padStart(2, '0'); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function lcg(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
  function fmtK(n) { return n >= 1000 ? (n >= 10000 ? Math.round(n / 1000) + 'K' : (n / 1000).toFixed(1) + 'K') : String(n); }

  /* ---------- state ---------- */
  var state = {
    open: 0, stepOpen: 0, split: 50, view: 'landing', pack: 0, upsell: 'none',
    bundleUp: false, accessStep: 1, anatomyMuted: true, zoom: 1, sheen: 0, parallax: 0
  };

  /* =====================================================================
     DATA
     ===================================================================== */
  var HERO_SRCS = [
    'uploads/lyric-video-5b73646c.mp4', 'uploads/lyric-video-43f38f2b.mp4', 'uploads/lyric-video-c1a7aa57-d7666788.mp4',
    'uploads/lyric-video-134d9c47.mp4', 'uploads/lyric-video-f8d946db-1174ec51.mp4', 'uploads/lyric-video-ede04a67.mp4'
  ];
  var heroStats = (function () {
    var rnd = lcg(7);
    return HERO_SRCS.map(function () {
      var views = Math.round(10000 + rnd() * 190000);
      var pct = 1 + rnd() * 4;
      return { views: fmtK(views), streams: fmtK(Math.round(views * pct / 100)), conv: pct.toFixed(1) + '%' };
    });
  })();
  var heroVideos = HERO_SRCS.map(function (src, i) { return Object.assign({ src: src }, heroStats[i]); });

  var ACCOUNTS = [
    { handle: '@sombr.archive', platform: 'Instagram', s1: '214', l1: 'posts', s2: '412K', l2: 'followers', s3: '3', l3: 'following', note: 'Fan-run. Started nine months before the first viral week.', avatar: 'n15', t: ['n15', 't00', 'n11', 'n13', 't02', 'n12'] },
    { handle: '@gigi.perez.files', platform: 'TikTok', s1: '9', l1: 'following', s2: '683K', l2: 'followers', s3: '8.4M', l3: 'likes', note: 'Same 8-second hook, posted daily. No face.', avatar: 'n04', t: ['n04', 'n03', 'n07', 'n06', 'n05', 'n09'] },
    { handle: '@alexwarren.moments', platform: 'Instagram', s1: '168', l1: 'posts', s2: '297K', l2: 'followers', s3: '6', l3: 'following', note: 'Cinematic B-roll under the chorus. Nothing else.', avatar: 'n27', t: ['n27', 't12', 'n19', 't14', 'n17', 't16'] },
    { handle: '@royel.otis.daily', platform: 'TikTok', s1: '4', l1: 'following', s2: '521K', l2: 'followers', s3: '6.1M', l3: 'likes', note: 'Runs on found footage and one lyric line at a time.', avatar: 'n33', t: ['n33', 'n34', 'n31', 'n16', 'n36', 'n35'] },
    { handle: '@lola.young.hq', platform: 'Instagram', s1: '93', l1: 'posts', s2: '188K', l2: 'followers', s3: '2', l3: 'following', note: 'Ninety-three cuts of the same song.', avatar: 'n00', t: ['n00', 'n01', 'n02', 'n37', 't26', 't28'] },
    { handle: '@bennysings.clips', platform: 'TikTok', s1: '11', l1: 'following', s2: '246K', l2: 'followers', s3: '3.9M', l3: 'likes', note: 'Built the whole audience before the album dropped.', avatar: 'n28', t: ['n28', 't30', 'n29', 't32', 'n30', 't34'] },
    { handle: '@wave2earth.reels', platform: 'Instagram', s1: '141', l1: 'posts', s2: '329K', l2: 'followers', s3: '5', l3: 'following', note: 'Zero budget. Zero appearances. All fan-page.', avatar: 'n20', t: ['n20', 'n23', 'n24', 'n22', 'n21', 'n25'] },
    { handle: '@chaotic.good.roster', platform: 'TikTok', s1: '7', l1: 'following', s2: '858K', l2: 'followers', s3: '12.7M', l3: 'likes', note: 'Chaotic Good runs this format for every artist they sign.', avatar: 'n18', t: ['n18', 'n08', 'n10', 'n14', 'n32', 'n11'] },
    { handle: '@djo.tapes', platform: 'Instagram', s1: '122', l1: 'posts', s2: '264K', l2: 'followers', s3: '4', l3: 'following', note: 'Lo-fi film scans. One song, one mood.', avatar: 't06', t: ['t06', 't08', 'n06', 't10', 'n05', 't11'] },
    { handle: '@dominic.fike.cuts', platform: 'TikTok', s1: '6', l1: 'following', s2: '437K', l2: 'followers', s3: '5.2M', l3: 'likes', note: 'Skate footage, VHS grain, chorus only.', avatar: 't18', t: ['t18', 't20', 'n13', 't22', 'n12', 't19'] },
    { handle: '@holly.humberstone.diary', platform: 'Instagram', s1: '87', l1: 'posts', s2: '153K', l2: 'followers', s3: '3', l3: 'following', note: 'Night drives and one lyric a day.', avatar: 'n29', t: ['n29', 't36', 'n37', 't38', 'n02', 't40'] },
    { handle: '@thexx.archive', platform: 'TikTok', s1: '5', l1: 'following', s2: '392K', l2: 'followers', s3: '4.8M', l3: 'likes', note: 'Same edit language across every release.', avatar: 'n09', t: ['n09', 't42', 'n07', 't44', 'n35', 't46'] }
  ];

  var STEPS = [
    { n: '1', title: 'Download the pack', short: 'One download, 30 finished MP4s + raw clips.', body: '30 finished MP4s, vertical, colour graded, no audio. Plus every raw clip used to build them.' },
    { n: '2', title: 'Make it yours', short: 'Lyric overlay, cover art, your track — two minutes.', body: "Drop in a lyric overlay, your cover art, your release date — two minutes in CapCut, guide included. Upload, pick your song from the audio library, post. The video is silent on purpose: the platform's audio is what links the view to your release page." },
    { n: '3', title: 'Post daily for a month', short: 'One clip a day. The playbook tells you when.', body: 'One clip a day for 30 days. The included playbook covers hooks, captions, posting times and what to do when one takes off.' }
  ];

  var TOOLS = ['CapCut', 'DaVinci Resolve', 'Final Cut Pro', 'Premiere Pro', 'Canva', 'iMovie', 'Clips', 'Instagram', 'TikTok'].map(function (n) {
    return { name: n, logo: 'uploads/logos/' + n.toLowerCase().replace(/[^a-z]+/g, '-') + '.png' };
  });

  var PACKS = [
    { n: 'Pack 01', stock: '41 of 200 left', stockColor: '#F5F5F7', slug: 'golden-hour', name: 'Golden Hour', genres: 'Indie · Singer-songwriter · Bedroom pop · Alt-R&B', desc: 'Warm, hazy, golden-hour footage. Built for songs that sound like a memory.', priceN: 37, was: '', cta: 'Get the pack — $37', bundle: false },
    { n: 'Pack 02', stock: '128 of 200 left', stockColor: '#6E6E73', slug: 'midnight-city', name: 'Midnight City', genres: 'Rap · Trap · Drill · Hyperpop', desc: 'Night cities, headlights, motion. High contrast, hard cuts.', priceN: 37, was: '', cta: 'Get the pack — $37', bundle: false },
    { n: 'Pack 03', stock: '176 of 200 left', stockColor: '#6E6E73', slug: 'coastal-drive', name: 'Coastal Drive', genres: 'Pop · Dance · Alt-pop · Surf rock', desc: 'Coast roads, sea light, wind in the frame. Bright, open, moving.', priceN: 37, was: '', cta: 'Get the pack — $37', bundle: false },
    { n: 'Pack 04', stock: '200 of 200 left', stockColor: '#6E6E73', slug: 'forest-trail', name: 'Forest Trail', genres: 'Folk · Acoustic · Ambient · Country', desc: 'Woodland, weather, slow light. Quiet and unhurried.', priceN: 37, was: '', cta: 'Get the pack — $37', bundle: false },
    { n: 'Bundle · all four', stock: 'Save $51', stockColor: '#30D158', slug: '', name: 'All four packs', genres: '120 videos · every genre above', desc: 'Golden Hour, Midnight City, Coastal Drive and Forest Trail. Four months of posting, one download.', priceN: 97, was: '$148', cta: 'Get the bundle — $97', bundle: true }
  ];
  var GRADS = [
    ['linear-gradient(160deg,#6B3E4A,#2A1E2B)', 'linear-gradient(160deg,#8CA7B5,#3E4A52)', 'linear-gradient(160deg,#E0A060,#3A2A3A)', 'linear-gradient(160deg,#9B5F72,#2B2530)', 'linear-gradient(160deg,#F0B070,#4A3020)'],
    ['linear-gradient(160deg,#1E2A44,#0B0E18)', 'linear-gradient(160deg,#3A2A55,#101018)', 'linear-gradient(160deg,#C0392B,#1A0D10)', 'linear-gradient(160deg,#2C4A6E,#0A0F18)', 'linear-gradient(160deg,#5A2A6A,#120A18)'],
    ['linear-gradient(160deg,#2E6E8A,#0E1E2A)', 'linear-gradient(160deg,#9FCBD8,#3A5560)', 'linear-gradient(160deg,#E8C9A0,#4A3A2A)', 'linear-gradient(160deg,#4A8FA8,#102030)', 'linear-gradient(160deg,#D9B37A,#2A3A40)'],
    ['linear-gradient(160deg,#3E5C3A,#14200F)', 'linear-gradient(160deg,#8A7A55,#2A2415)', 'linear-gradient(160deg,#A9B7C6,#3C4A55)', 'linear-gradient(160deg,#C58F5A,#2E2015)', 'linear-gradient(160deg,#6E8A6A,#1A2418)']
  ];
  var PACK_SLUGS = ['golden-hour', 'midnight-city', 'coastal-drive', 'forest-trail'];

  var FAQS = [
    ['Do I have to be on camera?', "No. Not once. There's no face, no voice and no filming anywhere in this."],
    ['How does my song get into the video?', "The videos ship silent. You upload one, pick your track from Instagram or TikTok's audio library, and post. Doing it that way is what links every view back to your release page — and it's why this converts to streams instead of just collecting views."],
    ["What if my song isn't on the platforms yet?", 'Distribute it first — DistroKid, TuneCore, whoever you use. Your track needs to exist in the audio library for the mechanic to work.'],
    ['Do I need editing skills?', 'No. The 30 videos are finished and ready to post. The raw clips and guides are there for when you want to add lyrics, cover art, or build your own on top.'],
    ['How much time per day?', "Posting as-is: under five minutes. Adding your own overlays: 15–20 once you've read the guide for your editor."],
    ['Will other artists have the same videos?', 'Each pack is capped at 200 copies and then retired. And because the audio, lyric overlays and artwork are yours, the same base footage reads as a format rather than a duplicate — the way a trend does.'],
    ['Is this an ad product? Do I need a budget?', 'No. This is organic posting. Zero ad spend.'],
    ['What happens after the 30 days?', 'Buy the next pack, or take the monthly option at checkout and a new one arrives automatically.'],
    ['Which genres does this work for?', "Each pack is labelled by genre. If nothing on the list matches your sound, don't buy yet — tell us what you make and we'll say when a fitting pack is coming."]
  ];

  var ORDER_ITEMS_SINGLE = [['Finished videos', '30 · 9:16 · silent'], ['Raw clips', '112'], ['Editing guides', '8 · one per tool'], ['Posting playbook', '24 pages'], ['Commercial licence', 'No expiry'], ['Money back guarantee', '30 days']];
  var ORDER_ITEMS_BUNDLE = [['Finished videos', '120 · 9:16 · silent'], ['Raw clips', '448'], ['Editing guides', '8 · one per tool'], ['Posting playbook', '4 months'], ['Commercial licence', 'No expiry'], ['Money back guarantee', '30 days']];

  /* =====================================================================
     SEEDED CHART SERIES (Spotify-for-Artists style, identical to the design)
     ===================================================================== */
  var SERIES = (function () {
    var rnd = lcg(7);
    var N = 182, W = 400, X0 = 18, X1 = 392, Y0 = 20, Y1 = 190, MAX = 30000;
    var toXY = function (i, v) { return [X0 + (i / (N - 1)) * (X1 - X0), Y1 - Math.min(v, MAX) / MAX * (Y1 - Y0)]; };
    var build = function (vals) {
      var pts = vals.map(function (v, i) { return toXY(i, v); });
      var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('');
      var fill = line + 'L' + X1 + ' ' + Y1 + 'L' + X0 + ' ' + Y1 + 'Z';
      var last = pts[pts.length - 1];
      var at = function (i) { var xy = toXY(i, vals[i]); return { xf: (xy[0] / W).toFixed(4), yf: (xy[1] / 210).toFixed(4) }; };
      return { line: line, fill: fill, lx: last[0].toFixed(1), ly: last[1].toFixed(1), lxf: (last[0] / W).toFixed(4), lyf: (last[1] / 210).toFixed(4), lv: Math.round(vals[vals.length - 1]), at: at };
    };
    var L = [], R = [];
    var wl = 0, wr = 0;
    var walk = function (w, amp) { return w * 0.82 + (rnd() - 0.5) * amp; };
    var week = function (i) { return 1 + 0.06 * Math.sin((i / 7) * Math.PI * 2 + 1.2); };
    // left: paid pushes — sharp spike, 2–4 week plateau, slow decay to a slightly higher floor
    var pushes = [[34, 3200, 17], [92, 4800, 26], [148, 3600, 15]];
    var floorL = 380, i, k, d, h, pl, ramp, decay, t, target, v, r, g;
    for (i = 0; i < N; i++) {
      wl = walk(wl, 0.12);
      v = floorL * (1 + wl) * week(i) * (0.94 + rnd() * 0.12);
      for (k = 0; k < pushes.length; k++) {
        d = pushes[k][0]; h = pushes[k][1]; pl = pushes[k][2]; ramp = 3; decay = 24;
        if (i >= d && i < d + ramp) v = floorL + (h - floorL) * ((i - d + 1) / ramp) * (0.9 + rnd() * 0.15);
        else if (i >= d + ramp && i < d + ramp + pl) v = h * (0.86 + rnd() * 0.16) * week(i);
        else if (i >= d + ramp + pl && i < d + ramp + pl + decay) {
          t = (i - d - ramp - pl) / decay; target = floorL + 120;
          v = target + (h * 0.9 - target) * Math.pow(1 - t, 2.2) * (0.94 + rnd() * 0.12);
          if (i === d + ramp + pl + decay - 1) floorL = target;
        }
      }
      L.push(v);
    }
    // right: daily posting — noisy floor, then compounding growth with weekly rhythm and two small viral bumps
    g = 520;
    for (i = 0; i < N; i++) {
      wr = walk(wr, 0.10);
      if (i > 38) { t = (i - 38) / (N - 38); g += (30 + 420 * Math.pow(t, 1.6)) * (0.7 + rnd() * 0.6) - (rnd() < 0.18 ? g * 0.02 : 0); }
      r = g * (1 + wr) * week(i) * (0.93 + rnd() * 0.14);
      var bumps = [[88, 0.35], [141, 0.5]];
      for (k = 0; k < bumps.length; k++) { d = bumps[k][0]; if (i >= d && i < d + 9) r *= 1 + bumps[k][1] * Math.exp(-(i - d) / 3); }
      R.push(r);
    }
    return { L: build(L), R: build(R) };
  })();

  /* =====================================================================
     RENDERERS
     ===================================================================== */
  var SPOTIFY_ICON = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1ED760" stroke-width="2.6" stroke-linecap="round"><path d="M5 9.5c4.5-1.3 9.7-.8 13.8 1.6"></path><path d="M6 13.3c3.7-1 8-.6 11.3 1.4"></path><path d="M7 16.8c2.9-.8 6.2-.5 8.8 1.1"></path></svg>';

  function renderHero() {
    var track = $('#hero-track');
    track.style.setProperty('--dur', CONFIG.heroSeconds + 's');
    var items = heroVideos.concat(heroVideos); // doubled so the -50% marquee loops seamlessly
    track.innerHTML = items.map(function (v) {
      return '<div class="reel-card">' +
        '<div class="reel-frame">' +
          '<video src="' + esc(v.src) + '" muted loop playsinline preload="metadata" data-lazy-video="1"></video>' +
          '<div class="reel-views"><span class="play-tri"></span>' + esc(v.views) + ' <span class="lbl">views</span></div>' +
        '</div>' +
        '<div class="reel-stats">' +
          '<div class="spotify-pill"><span class="dot">' + SPOTIFY_ICON + '</span>' + esc(v.streams) + ' Spotify streams</div>' +
          '<span class="reel-conv">' + esc(v.conv) + ' view-to-stream conversion</span>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function renderAccounts() {
    var track = $('#accounts-track');
    track.style.setProperty('--dur', CONFIG.marqueeSeconds + 's');
    var items = ACCOUNTS.concat(ACCOUNTS);
    track.innerHTML = items.map(function (a) {
      return '<div class="acc">' +
        '<div class="acc-head">' +
          '<div class="acc-avatar"><img src="uploads/thumbs/' + a.avatar + '.png" alt=""></div>' +
          '<div class="acc-id"><div class="acc-handle">' + esc(a.handle) + '</div><div class="acc-platform">' + esc(a.platform) + '</div></div>' +
        '</div>' +
        '<div class="acc-stats"><span><b>' + esc(a.s1) + '</b> ' + esc(a.l1) + '</span><span><b>' + esc(a.s2) + '</b> ' + esc(a.l2) + '</span><span><b>' + esc(a.s3) + '</b> ' + esc(a.l3) + '</span></div>' +
        '<div class="acc-grid">' + a.t.map(function (t) { return '<div class="acc-tile"><img src="uploads/thumbs/' + t + '.png" alt="" loading="lazy"></div>'; }).join('') + '</div>' +
        '<div class="acc-note">' + esc(a.note) + '</div>' +
      '</div>';
    }).join('');
  }

  function renderSteps() {
    $('#steps').innerHTML = STEPS.map(function (s, i) {
      var open = state.stepOpen === i;
      return '<div class="step' + (open ? ' open' : '') + '">' +
        '<button class="step-btn" type="button" data-step="' + i + '" aria-expanded="' + open + '">' +
          '<span class="step-num">' + esc(s.n) + '</span>' +
          '<span class="step-text"><span class="step-title">' + esc(s.title) + '</span><span class="step-short">' + esc(s.short) + '</span></span>' +
          '<span class="step-sym">' + (open ? '−' : '+') + '</span>' +
        '</button>' +
        (open ? '<p class="step-body">' + esc(s.body) + '</p>' : '') +
      '</div>';
    }).join('');
  }

  function renderTools() {
    var items = TOOLS.concat(TOOLS);
    $('#tools-track').innerHTML = items.map(function (t) {
      return '<div class="tool"><img src="' + esc(t.logo) + '" alt="" data-fallback="initial" data-initial="' + esc(t.name.charAt(0)) + '"><span class="name">' + esc(t.name) + '</span></div>';
    }).join('');
  }

  // Fan of five 9:16 tiles, offset diagonally. Mirrors mkFan(gi, big, tiny) in the design.
  function fanHTML(gi, big, tiny) {
    var tw = big ? 88 : (tiny ? 26 : 56), dx = big ? 34 : (tiny ? 9 : 22), dy = big ? 18 : (tiny ? 5 : 12);
    var slug = PACK_SLUGS[gi % 4];
    var tiles = GRADS[gi % 4].map(function (bg, k) {
      var media = k < 4
        ? '<img src="uploads/packs/' + slug + '-' + (k + 1) + '.png" alt="">'
        : '<video src="uploads/packs/' + slug + '.mp4" autoplay muted loop playsinline preload="auto" data-autoplay="1"></video>';
      return '<div class="tile" style="left:' + (k * dx) + 'px;top:' + (k * dy) + 'px;width:' + tw + 'px;background:' + bg + '">' + media + '</div>';
    }).join('');
    return '<div class="fan" style="width:' + (tw + dx * 4) + 'px;height:' + (tw * 16 / 9 + dy * 4) + 'px">' + tiles + '</div>';
  }

  function renderPacks() {
    $('#packs-grid').innerHTML = PACKS.map(function (p, i) {
      var fans = p.bundle ? [0, 1, 2, 3].map(function (g) { return fanHTML(g, false, true); }).join('') : fanHTML(i, true, false);
      return '<div class="pack">' +
        '<div class="fan-box">' + fans + '</div>' +
        '<div class="pack-body">' +
          '<div class="pack-meta"><span style="color:' + (p.bundle ? '#30D158' : '#6E6E73') + '">' + esc(p.n) + '</span><span style="color:' + p.stockColor + '">' + esc(p.stock) + '</span></div>' +
          '<span class="pack-name">' + esc(p.name) + '</span>' +
          '<span class="pack-genres">' + esc(p.genres) + '</span>' +
          '<p class="pack-desc">' + esc(p.desc) + '</p>' +
          '<div class="pack-price"><span class="now">$' + p.priceN + '</span>' + (p.was ? '<span class="was">' + esc(p.was) + '</span>' : '') + '</div>' +
          '<button class="btn ' + (p.bundle ? '' : 'btn-outline') + '" type="button" data-buy="' + i + '">' + esc(p.cta) + '</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function renderFaqs() {
    $('#faq-list').innerHTML = FAQS.map(function (f, i) {
      var open = state.open === i;
      return '<div class="faq-item">' +
        '<button class="faq-btn" type="button" data-faq="' + i + '" aria-expanded="' + open + '">' +
          '<span class="faq-q">' + esc(f[0]) + '</span><span class="faq-sym">' + (open ? '−' : '+') + '</span>' +
        '</button>' +
        (open ? '<p class="faq-a">' + esc(f[1]) + '</p>' : '') +
      '</div>';
    }).join('');
  }

  function chartHTML(S, id, flags, tip) {
    var flagHTML = flags.map(function (f) {
      var p = S.at(f[1]);
      return '<div class="chart-flag" style="left:calc(14px + (100% - 28px) * ' + p.xf + ');top:calc(14px + 220px * ' + p.yf + ' - 46px)"><span>' + esc(f[0]) + '</span><span></span></div>';
    }).join('');
    return '<svg viewBox="0 0 400 210" preserveAspectRatio="none" aria-hidden="true">' +
        '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1F5FD8" stop-opacity=".28"></stop><stop offset="1" stop-color="#1F5FD8" stop-opacity=".05"></stop></linearGradient></defs>' +
        '<line class="grid" x1="0" y1="20" x2="400" y2="20"></line><line class="grid" x1="0" y1="105" x2="400" y2="105"></line><line class="grid" x1="0" y1="190" x2="400" y2="190"></line>' +
        '<line class="axis0" x1="18" y1="20" x2="18" y2="190"></line>' +
        '<path d="' + S.fill + '" fill="url(#' + id + ')"></path>' +
        '<path class="line" d="' + S.line + '"></path>' +
        '<line class="last" x1="' + S.lx + '" y1="20" x2="' + S.lx + '" y2="' + S.ly + '"></line>' +
      '</svg>' +
      '<div class="axis-pill" style="top:26px">30K</div><div class="axis-pill" style="top:115px">15K</div><div class="axis-pill zero">0</div>' +
      '<div class="chart-dot" style="left:calc(14px + (100% - 28px) * ' + S.lxf + ');top:calc(14px + 220px * ' + S.lyf + ')"></div>' +
      flagHTML +
      '<div class="chart-tip">' + esc(tip) + '</div>' +
      '<div class="chart-dates"><span>Mar 24</span><span>Sep 24</span></div>';
  }

  function renderCharts() {
    $('#chart-r').innerHTML = chartHTML(SERIES.R, 'fillR', [['FanpageKit', 128]], '9/24/26 • ' + SERIES.R.lv.toLocaleString('en-US'));
    $('#chart-l').innerHTML = chartHTML(SERIES.L, 'fillL', [['Playlist pitching', 44], ['Meta ads', 104]], '9/24/26 • ' + SERIES.L.lv.toLocaleString('en-US'));
  }

  /* ---------- checkout ---------- */
  function checkoutModel() {
    var sel = PACKS[state.pack] || PACKS[0];
    var bundleUp = !sel.bundle && state.bundleUp;
    var monthlyAll = sel.bundle || bundleUp;
    var isBundleOrder = sel.bundle || bundleUp;
    return {
      sel: sel, bundleUp: bundleUp, monthlyAll: monthlyAll, isBundleOrder: isBundleOrder,
      orderName: isBundleOrder ? 'All four packs' : sel.name,
      orderPrice: '$' + (sel.bundle ? 97 : 37),
      total: '$' + (sel.bundle ? 97 : (bundleUp ? 97 : 37)),
      hasAddon: state.upsell === 'monthly' || bundleUp,
      addonLabel: bundleUp ? (state.upsell === 'monthly' ? 'Bundle upgrade + monthly pack' : 'Bundle upgrade') : 'Monthly pack · from next month',
      addonPrice: bundleUp ? '+$60' : '$0 today',
      items: isBundleOrder ? ORDER_ITEMS_BUNDLE : ORDER_ITEMS_SINGLE,
      subSave: monthlyAll ? '51 a month' : '8 a month',
      renewNote: state.upsell === 'monthly' ? ('Renews on the 1st at ' + (monthlyAll ? '$97' : '$29') + '; the confirmation email states the price and next billing date.') : 'Nothing renews.',
      upsells: [
        { id: 'none', title: 'Just this order', body: 'One payment. Nothing renews.', price: '—', was: '' },
        { id: 'monthly',
          title: monthlyAll ? 'All four packs, every month' : 'A new pack every month',
          body: monthlyAll ? 'Four fresh 30-video packs land on the 1st. $97 each month after today. Cancel any time in one click.' : 'A fresh 30-video pack lands on the 1st. $29 each month after today. Cancel any time in one click.',
          price: monthlyAll ? '$97 / mo' : '$29 / mo', was: monthlyAll ? '$148' : '$37' }
      ]
    };
  }

  function renderCheckout() {
    var m = checkoutModel();
    $('#order-fans').innerHTML = m.isBundleOrder ? [0, 1, 2, 3].map(function (g) { return fanHTML(g, false, false); }).join('') : fanHTML(state.pack, true, false);
    $('#order-name').textContent = m.orderName;
    $('#order-price').textContent = m.orderPrice;
    $('#order-items').innerHTML = m.items.map(function (o) {
      return '<div class="order-item"><span class="k"><span class="tick">✓</span>' + esc(o[0]) + '</span><span class="v">' + esc(o[1]) + '</span></div>';
    }).join('');

    var bu = $('#bundle-up');
    bu.hidden = !!m.sel.bundle;
    bu.classList.toggle('on', m.bundleUp);
    bu.setAttribute('aria-pressed', String(m.bundleUp));
    $('#flames').hidden = !m.bundleUp;
    $('#bundle-check').textContent = m.bundleUp ? '✓' : '';

    $('#sub-save').textContent = m.subSave;
    $('#sub-opts').innerHTML = m.upsells.map(function (u) {
      var on = state.upsell === u.id;
      return '<button class="sub-opt' + (on ? ' on' : '') + '" type="button" data-upsell="' + u.id + '" role="radio" aria-checked="' + on + '">' +
        '<span class="ring"><i></i></span>' +
        '<span class="txt"><span class="t">' + esc(u.title) + '</span><span class="b">' + esc(u.body) + '</span></span>' +
        '<span class="pr"><span class="now">' + esc(u.price) + '</span>' + (u.was ? '<span class="was">' + esc(u.was) + '</span>' : '') + '</span>' +
      '</button>';
    }).join('');

    $('#tot-name').textContent = m.orderName;
    $('#tot-price').textContent = m.orderPrice;
    $('#tot-addon').hidden = !m.hasAddon;
    $('#addon-label').textContent = m.addonLabel;
    $('#addon-price').textContent = m.addonPrice;
    $('#tot-due').textContent = m.total;
    $('#pay-btn').textContent = 'Pay ' + m.total;
    $('#renew-note').textContent = m.renewNote;
    playAutoVideos($('#order-fans'));
  }

  /* ---------- access ---------- */
  function renderAccess() {
    var m = checkoutModel();
    $('#access-order').textContent = m.orderName;
    $('#access-order-2').textContent = m.orderName;
    $$('.astep').forEach(function (el) {
      var n = Number(el.getAttribute('data-step'));
      var open = state.accessStep === n, done = state.accessStep > n;
      el.classList.toggle('open', open);
      el.classList.toggle('done', done);
      $('.astep-num', el).textContent = done ? '✓' : String(n);
    });
    $('#discord-link').href = CONFIG.discordUrl || '#';
    $('#drive-link').href = CONFIG.driveUrl || '#';
    var cal = $('#cal');
    if (CONFIG.calendlyUrl) {
      if (!$('iframe', cal)) cal.innerHTML = '<iframe src="' + esc(CONFIG.calendlyUrl) + '" title="Book onboarding" loading="lazy"></iframe>';
    }
  }

  /* ---------- views ---------- */
  var VIEWS = { landing: '#view-landing', checkout: '#view-checkout', access: '#view-access' };
  function setView(view, patch) {
    Object.assign(state, patch || {});
    state.view = view;
    Object.keys(VIEWS).forEach(function (k) { $(VIEWS[k]).hidden = k !== view; });
    if (view === 'checkout') renderCheckout();
    if (view === 'access') renderAccess();
    window.scrollTo(0, 0);
    if (view === 'landing') { onResize(); onScroll(); }
  }

  /* =====================================================================
     MEDIA
     ===================================================================== */
  // Missing artwork degrades to the gradient/dark placeholder behind it.
  document.addEventListener('error', function (e) {
    var t = e.target;
    if (!t || t.tagName !== 'IMG') return;
    if (t.getAttribute('data-fallback') === 'initial') {
      var span = document.createElement('span');
      span.className = 'initial';
      span.textContent = t.getAttribute('data-initial') || '';
      t.replaceWith(span);
    } else {
      t.style.visibility = 'hidden';
    }
  }, true);

  var io = null;
  function observeVideos() {
    if (!('IntersectionObserver' in window)) return;
    if (!io) io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) { var p = v.play && v.play(); if (p && p.catch) p.catch(function () {}); }
        else if (v.pause) v.pause();
      });
    }, { rootMargin: '100px' });
    $$('video[data-lazy-video]').forEach(function (v) { if (!v.__obs) { v.__obs = true; io.observe(v); } });
  }
  function playAutoVideos(root) {
    $$('video[data-autoplay]', root).forEach(function (v) { v.muted = true; var p = v.play(); if (p && p.catch) p.catch(function () {}); });
  }

  /* =====================================================================
     ANATOMY: zoom, parallax, connector lines, mute
     ===================================================================== */
  var anatomy = $('#anatomy'), reel = $('#reel'), lyric = $('#lyric'), pill = $('#pill');
  var c1 = $('#c1'), c2 = $('#c2'), c3 = $('#c3');

  function measureLines() {
    var b = anatomy.getBoundingClientRect(), z = state.zoom || 1;
    var rel = function (r) { return { l: (r.left - b.left) / z, r: (r.right - b.left) / z, t: (r.top - b.top) / z, b: (r.bottom - b.top) / z, cy: ((r.top + r.bottom) / 2 - b.top) / z }; };
    var B1 = rel(c1.getBoundingClientRect()), B2 = rel(c2.getBoundingClientRect()), B3 = rel(c3.getBoundingClientRect());
    var RR = rel(reel.getBoundingClientRect()), LY = rel(lyric.getBoundingClientRect()), PR = rel(pill.getBoundingClientRect());
    var elbow = function (x1, y1, x2, y2) { var xm = (x1 + x2) / 2; return 'M' + x1 + ' ' + y1 + 'L' + xm + ' ' + y1 + 'L' + xm + ' ' + y2 + 'L' + x2 + ' ' + y2; };
    var t1 = { x: RR.l, y: RR.t + (RR.b - RR.t) * 0.22 }, t2 = { x: RR.r, y: LY.cy }, t3 = { x: RR.l, y: PR.cy };
    var set = function (id, d, p) {
      $('#' + id).setAttribute('d', d);
      var c = $('#' + id + 'c'); c.setAttribute('cx', p.x); c.setAttribute('cy', p.y);
    };
    set('ln1', elbow(B1.r, B1.cy, t1.x, t1.y), t1);
    set('ln2', elbow(B2.l, B2.cy, t2.x, t2.y), t2);
    set('ln3', elbow(B3.r, B3.cy, t3.x, t3.y), t3);
  }

  function applyParallax() {
    var p = state.parallax || 0;
    c1.style.transform = 'translateY(' + (p * 28).toFixed(1) + 'px)';
    c2.style.transform = 'translateY(' + (p * -18).toFixed(1) + 'px)';
    c3.style.transform = 'translateY(' + (p * 40).toFixed(1) + 'px)';
  }

  function onResize() {
    if (state.view !== 'landing') return;
    var avail = anatomy.parentElement.clientWidth;
    var z = Math.round(Math.min(1, avail / 780) * 1000) / 1000;
    if (z !== state.zoom) {
      state.zoom = z;
      anatomy.style.zoom = z;
      anatomy.style.width = z < 1 ? '780px' : '100%';
    }
    measureLines();
  }

  var raf = 0;
  var timeCard = $('#time-card'), barGrey = $('#bar-grey'), barGreen = $('#bar-green');
  function onScroll() {
    if (raf || state.view !== 'landing') return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      var vh = window.innerHeight;
      // metallic sheen on the time-saved bars follows scroll position
      var cr = timeCard.getBoundingClientRect();
      var sh = Math.round(clamp(1 - (cr.top + cr.height / 2) / (vh + cr.height), 0, 1) * 200) / 200;
      if (sh !== state.sheen) {
        state.sheen = sh;
        barGrey.style.backgroundPosition = Math.round(sh * 100) + '% 50%';
        barGreen.style.backgroundPosition = Math.round(100 - sh * 100) + '% 50%';
      }
      // callout parallax around the anatomy reel
      var r = anatomy.getBoundingClientRect();
      var p = clamp((r.top + r.height / 2 - vh / 2) / vh, -1, 1);
      if (Math.abs(p - state.parallax) > 0.002) { state.parallax = p; applyParallax(); }
      measureLines();
    });
  }

  var anatomyVideo = $('#anatomy-video');
  $('#mute-btn').addEventListener('click', function () {
    var muted = !state.anatomyMuted;
    state.anatomyMuted = muted;
    anatomyVideo.muted = muted;
    if (!muted) { anatomyVideo.volume = 1; var p = anatomyVideo.play(); if (p && p.catch) p.catch(function () {}); }
    $('#ico-muted').hidden = !muted;
    $('#ico-sound').hidden = muted;
    this.setAttribute('aria-pressed', String(!muted));
  });

  /* =====================================================================
     COMPARE SLIDER
     ===================================================================== */
  var compareBox = $('#compare'), compareLeft = $('#compare-left'), compareHandle = $('#compare-handle');
  var dragging = false;
  function setSplit(pct) {
    state.split = clamp(pct, 18, 82);
    compareHandle.style.left = state.split + '%';
    compareLeft.style.clipPath = 'inset(0 ' + (100 - state.split) + '% 0 0)';
    compareHandle.setAttribute('aria-valuenow', Math.round(state.split));
  }
  function dragStart(e) { dragging = true; if (e.type === 'mousedown') e.preventDefault(); }
  function dragMove(e) {
    if (!dragging) return;
    var x = e.touches ? e.touches[0].clientX : e.clientX;
    var r = compareBox.getBoundingClientRect();
    setSplit(((x - r.left) / r.width) * 100);
  }
  function dragEnd() { dragging = false; }
  compareHandle.addEventListener('mousedown', dragStart);
  compareHandle.addEventListener('touchstart', dragStart, { passive: true });
  compareHandle.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { setSplit(state.split - 2); e.preventDefault(); }
    if (e.key === 'ArrowRight') { setSplit(state.split + 2); e.preventDefault(); }
  });
  window.addEventListener('mousemove', dragMove);
  window.addEventListener('touchmove', dragMove, { passive: true });
  window.addEventListener('mouseup', dragEnd);
  window.addEventListener('touchend', dragEnd);

  /* =====================================================================
     EVENTS
     ===================================================================== */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-step],[data-faq],[data-buy],[data-go],[data-upsell],[data-next],#bundle-up');
    if (!t) return;
    if (t.hasAttribute('data-step')) { var i = Number(t.getAttribute('data-step')); state.stepOpen = state.stepOpen === i ? -1 : i; renderSteps(); onScroll(); return; }
    if (t.hasAttribute('data-faq')) { var f = Number(t.getAttribute('data-faq')); state.open = state.open === f ? -1 : f; renderFaqs(); return; }
    if (t.hasAttribute('data-buy')) { setView('checkout', { pack: Number(t.getAttribute('data-buy')), upsell: 'none' }); return; }
    if (t.hasAttribute('data-go')) { setView(t.getAttribute('data-go')); return; }
    if (t.hasAttribute('data-upsell')) { state.upsell = t.getAttribute('data-upsell'); renderCheckout(); return; }
    if (t.id === 'bundle-up') { state.bundleUp = !state.bundleUp; renderCheckout(); return; }
    if (t.hasAttribute('data-next')) { state.accessStep = Number(t.getAttribute('data-next')); renderAccess(); return; }
  });

  $('#pay-form').addEventListener('submit', function (e) {
    e.preventDefault();
    setView('access', { accessStep: 1 });
  });

  window.addEventListener('resize', function () { onResize(); onScroll(); });
  window.addEventListener('scroll', onScroll, { passive: true });

  /* =====================================================================
     INIT
     ===================================================================== */
  renderHero();
  renderAccounts();
  renderSteps();
  renderTools();
  renderPacks();
  renderFaqs();
  renderCharts();
  setSplit(50);
  onResize();
  onScroll();
  setTimeout(onScroll, 300);
  setTimeout(onScroll, 1200);
  setTimeout(observeVideos, 50);
  playAutoVideos(document);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { onResize(); onScroll(); });
})();
