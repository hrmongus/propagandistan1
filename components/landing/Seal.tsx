/**
 * The 30-day money-back guarantee as a certification medal: a brushed-metal rim around a domed green face, the words
 * stamped in white, and a glint of light passing over it now and then. The text is real text sized to the medal
 * (container units), so it stays crisp and in proportion at every size. `variant` only picks the size it's used at:
 * `pill` for a card corner, `icon` beside the guarantee headline, `card` on its own (the FAQ), `inline` next to a
 * buy button.
 */
export function Seal({ variant, className = '' }: { variant: 'pill' | 'icon' | 'card' | 'inline'; className?: string }) {
  return (
    <span className={`medal medal-${variant} ${className}`} role="img" aria-label="30-day money-back guarantee">
      <span className="medal-face" aria-hidden="true">
        <svg className="medal-check" viewBox="0 0 24 24"><path d="m6.5 12.5 3.5 3.5 7.5-8" /></svg>
        <b>30-DAY</b>
        <span>MONEY-BACK</span>
        <span>GUARANTEE</span>
      </span>
    </span>
  );
}
