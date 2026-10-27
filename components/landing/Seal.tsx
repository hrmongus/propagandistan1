// scalloped seal edge: 28 rounded bumps around a 100-radius circle
const SCALLOP = (() => {
  const n = 28, pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 92 : 100;
    pts.push(`${(110 + r * Math.cos(a)).toFixed(2)} ${(110 + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
})();

/**
 * Certification-style "30-day money back" seal, drawn as a slightly tilted sticker. `uid` keeps the SVG gradient and
 * path ids unique when several seals share a page.
 */
export const Seal = ({ uid, className = 'seal' }: { uid: string; className?: string }) => (
  <svg className={className} viewBox="0 0 220 220" role="img" aria-label="30-day money back guarantee seal">
    <defs>
      <linearGradient id={`seal-gold-${uid}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FBE39A" />
        <stop offset=".45" stopColor="#E2B24C" />
        <stop offset="1" stopColor="#A9741F" />
      </linearGradient>
      <linearGradient id={`seal-face-${uid}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#F6D27A" />
        <stop offset="1" stopColor="#C8902F" />
      </linearGradient>
      <path id={`seal-ring-${uid}`} d="M110 110m-66 0a66 66 0 1 1 132 0a66 66 0 1 1 -132 0" />
      <clipPath id={`seal-clip-${uid}`}><path d={SCALLOP} /></clipPath>
      <linearGradient id={`seal-shine-${uid}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#fff" stopOpacity="0" />
        <stop offset=".42" stopColor="#fff" stopOpacity=".12" />
        <stop offset=".5" stopColor="#FFFBEA" stopOpacity=".7" />
        <stop offset=".58" stopColor="#fff" stopOpacity=".12" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
    </defs>
    {/* white sticker border, then the gold scalloped seal */}
    <path d={SCALLOP} fill="#fff" transform="translate(110 110) scale(1.06) translate(-110 -110)" />
    <path d={SCALLOP} fill={`url(#seal-gold-${uid})`} />
    <circle cx="110" cy="110" r="80" fill="none" stroke="#7A5215" strokeOpacity=".55" strokeWidth="1.5" strokeDasharray="2 3" />
    <circle cx="110" cy="110" r="52" fill={`url(#seal-face-${uid})`} stroke="#7A5215" strokeOpacity=".6" strokeWidth="1.5" />
    <text className="seal-ring" fill="#4A3008">
      <textPath href={`#seal-ring-${uid}`} startOffset="0" textLength="408" lengthAdjust="spacing">100% MONEY BACK GUARANTEE ★ RISK FREE ★</textPath>
    </text>
    <text x="110" y="112" textAnchor="middle" className="seal-num" fill="#3A2506">30</text>
    <text x="110" y="132" textAnchor="middle" className="seal-day" fill="#3A2506">DAY</text>
    <text x="110" y="146" textAnchor="middle" className="seal-sub" fill="#4A3008">MONEY BACK</text>
    {/* a band of light that sweeps across the metal now and then, like a coin catching the light */}
    <g clipPath={`url(#seal-clip-${uid})`}>
      <g transform="rotate(25 110 110)">
        <rect className="seal-shine" x="-90" y="-60" width="90" height="340" fill={`url(#seal-shine-${uid})`} />
      </g>
    </g>
  </svg>
);
