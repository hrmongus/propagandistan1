import { lcg } from './data';

/* Seeded listener series for the "Spikes you rent, or a curve you own" charts (Spotify-for-Artists style). */

export type Series = {
  line: string; fill: string; lx: string; ly: string; lxf: string; lyf: string; lv: number;
  at: (i: number) => { xf: string; yf: string };
};

function buildSeries() {
  const rnd = lcg(7);
  const N = 182, W = 400, X0 = 18, X1 = 392, Y0 = 20, Y1 = 190, MAX = 30000;
  const toXY = (i: number, v: number) => [X0 + (i / (N - 1)) * (X1 - X0), Y1 - (Math.min(v, MAX) / MAX) * (Y1 - Y0)];
  const build = (vals: number[]): Series => {
    const pts = vals.map((v, i) => toXY(i, v));
    const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
    const fill = line + 'L' + X1 + ' ' + Y1 + 'L' + X0 + ' ' + Y1 + 'Z';
    const last = pts[pts.length - 1];
    const at = (i: number) => {
      const xy = toXY(i, vals[i]);
      return { xf: (xy[0] / W).toFixed(4), yf: (xy[1] / 210).toFixed(4) };
    };
    return { line, fill, lx: last[0].toFixed(1), ly: last[1].toFixed(1), lxf: (last[0] / W).toFixed(4), lyf: (last[1] / 210).toFixed(4), lv: Math.round(vals[vals.length - 1]), at };
  };

  const L: number[] = [], R: number[] = [];
  let wl = 0, wr = 0;
  const walk = (w: number, amp: number) => w * 0.82 + (rnd() - 0.5) * amp;
  const week = (i: number) => 1 + 0.06 * Math.sin((i / 7) * Math.PI * 2 + 1.2);

  // left: paid pushes — sharp spike, 2–4 week plateau, slow decay to a slightly higher floor
  const pushes = [[34, 3200, 17], [92, 4800, 26], [148, 3600, 15]];
  let floorL = 380;
  for (let i = 0; i < N; i++) {
    wl = walk(wl, 0.12);
    let v = floorL * (1 + wl) * week(i) * (0.94 + rnd() * 0.12);
    for (const [d, h, pl] of pushes) {
      const ramp = 3, decay = 24;
      if (i >= d && i < d + ramp) v = floorL + (h - floorL) * ((i - d + 1) / ramp) * (0.9 + rnd() * 0.15);
      else if (i >= d + ramp && i < d + ramp + pl) v = h * (0.86 + rnd() * 0.16) * week(i);
      else if (i >= d + ramp + pl && i < d + ramp + pl + decay) {
        const t = (i - d - ramp - pl) / decay, target = floorL + 120;
        v = target + (h * 0.9 - target) * Math.pow(1 - t, 2.2) * (0.94 + rnd() * 0.12);
        if (i === d + ramp + pl + decay - 1) floorL = target;
      }
    }
    L.push(v);
  }

  // right: daily posting — noisy floor, then compounding growth with weekly rhythm and two small viral bumps
  let g = 520;
  const bumps = [[88, 0.35], [141, 0.5]];
  for (let i = 0; i < N; i++) {
    wr = walk(wr, 0.1);
    if (i > 38) {
      const t = (i - 38) / (N - 38);
      g += (30 + 420 * Math.pow(t, 1.6)) * (0.7 + rnd() * 0.6) - (rnd() < 0.18 ? g * 0.02 : 0);
    }
    let r = g * (1 + wr) * week(i) * (0.93 + rnd() * 0.14);
    for (const [d, b] of bumps) if (i >= d && i < d + 9) r *= 1 + b * Math.exp(-(i - d) / 3);
    R.push(r);
  }
  return { L: build(L), R: build(R) };
}

export const SERIES = buildSeries();
