'use client';

import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { acceptUpsell } from '@/app/upsell/actions';
import { track } from '@/lib/analytics/client';
import { trackClick } from '@/lib/analytics/events';
import { PRICES, UPSELL_PRICE } from '@/lib/checkout';
import { PACK_SLUGS, PACKS } from '@/lib/data';
import { Fan } from '../Fan';
import { Seal } from '../landing/Seal';
import { TrackView } from '../TrackView';
import { useFitRow } from '../useFitRow';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

/** `preview` (admin preview, lib/preview.ts): the buttons just move to the matching /access preview — no charge, no events. */
type Props = {
  sessionId: string; orderName: string; packs: { slug: string; name: string; genres: string }[]; monthly: boolean;
  preview?: { access: string; accepted: string };
};

/**
 * The one-click offer right after payment, built to sell the outcome on a phone: four audiences instead of one. The set
 * of four with the buyer's pack ticked and the missing ones marked, the price against what they're worth, who each
 * new pack reaches, and the button — all in the first screen. While that button is out of view a slim bar keeps price and button on screen.
 */
export function UpsellView({ sessionId, orderName, packs, monthly, preview }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stuck, setStuck] = useState(false);
  const cta = useRef<HTMLDivElement>(null);
  const { box, row } = useFitRow<HTMLDivElement, HTMLDivElement>();

  const access = preview?.access ?? `/access?session_id=${encodeURIComponent(sessionId)}`;
  const value = packs.length * PRICES.pack;
  const save = value - UPSELL_PRICE;
  const videos = packs.length * 30;
  const offered = new Set(packs.map((p) => p.slug));
  const owned = PACKS.find((p) => !p.bundle && !offered.has(p.slug));
  // one-off buyers paid the single-pack price, so their whole set comes in under the bundle on the site
  const setTotal = PRICES.pack + UPSELL_PRICE;

  // the bar at the bottom shows only while the offer's own button is off screen (and not once the card form is open)
  useEffect(() => {
    const el = cta.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [clientSecret]);

  const accept = (from: 'offer' | 'sticky') =>
    preview ? router.push(preview.accepted) : start(async () => {
      setError(null);
      track('upsell_accepted', { packs_offered: packs.length, monthly, cta: from });
      // On success the action redirects to /access; otherwise it hands back a card form or an error.
      const res = await acceptUpsell(sessionId);
      if ('clientSecret' in res) {
        track('upsell_card_required', { packs_offered: packs.length });
        setClientSecret(res.clientSecret);
      } else {
        track('upsell_error', { error: res.error });
        setError(res.error);
      }
    });

  const label = pending ? 'Adding to your order…' : `Add all ${packs.length} for $${UPSELL_PRICE}`;

  return (
    <div className="upsell">
      {!preview && <TrackView event="upsell_viewed" props={{ order_name: orderName, packs_offered: packs.length, monthly }} />}

      <div className="up-head">
        <span className="up-status"><span className="up-tick">✓</span>{orderName} is yours<span className="up-step">Step 2 of 3</span></span>
        <span className="up-kicker">One-time offer · only on this page</span>
        <h1>Reach <em>4 audiences</em>, not 1</h1>
        <p>Add the other {packs.length} packs for ${UPSELL_PRICE}. Run a fan page for each look, and each one finds its own crowd.</p>
      </div>

      <div className="card up-offer">
        {/* the set of four: theirs ticked, the missing ones marked +, kept on one row at every width */}
        <div className="up-set" ref={box}>
          <div className="up-set-row" ref={row}>
            {owned && (
              <div className="up-pack owned" style={{ '--i': 0 } as React.CSSProperties}>
                <span className="badge">✓ Yours</span>
                <Fan gi={PACK_SLUGS.indexOf(owned.slug)} size="small" />
                <span className="t">{owned.name}</span>
              </div>
            )}
            {packs.map((p, i) => (
              <div className="up-pack" key={p.slug} style={{ '--i': i + 1 } as React.CSSProperties}>
                <span className="badge add">+ Add</span>
                <Fan gi={PACK_SLUGS.indexOf(p.slug)} size="small" />
                <span className="t">{p.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* collection meter: one segment per pack, theirs filled, the missing ones waiting */}
        <div className="up-meter" aria-label={`Audiences you reach: ${4 - packs.length} of 4`}>
          <div className="up-meter-bar">
            {[0, 1, 2, 3].map((k) => <span key={k} className={k < 4 - packs.length ? 'have' : 'miss'} style={{ '--i': k } as React.CSSProperties} />)}
          </div>
          <div className="up-meter-text"><span>Audiences: <b>{4 - packs.length} of 4</b></span><span className="to">4× reach with this offer →</span></div>
        </div>

        <div className="up-deal">
          <div className="up-price">
            <span className="was">${value}</span>
            <span className="now">${UPSELL_PRICE}</span>
            <span className="tag">Save ${save}</span>
          </div>
          <span className="up-unit">{videos} more videos + {packs.length * 112} raw clips · {Math.round((UPSELL_PRICE / videos) * 100)}¢ a video</span>
        </div>

        {/* the outcome, pack by pack: who each new look puts the music in front of */}
        <div className="up-aud">
          <span className="up-aud-h">Who the new packs reach</span>
          {packs.map((p) => {
            const info = PACKS.find((x) => x.slug === p.slug);
            return (
              <div className="up-aud-row" key={p.slug} style={{ '--tint': info?.tint } as React.CSSProperties}>
                <span className="nm">{p.name}</span>
                <span className="pills">{info?.audience?.map((a) => <span key={a}>{a}</span>)}</span>
              </div>
            );
          })}
        </div>

        {clientSecret && stripePromise ? (
          <div className="up-card">
            <p className="fine">Your bank wants to confirm this one. Pay ${UPSELL_PRICE} below and we&apos;ll take you straight to your packs.</p>
            <div className="stripe-embed">
              <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          </div>
        ) : (
          <div className="up-buy" ref={cta}>
            <div className="up-buy-row">
              <button className="btn btn-green btn-lg up-go" type="button" onClick={() => accept('offer')} disabled={pending}>{label}{!pending && <span className="arr" aria-hidden="true">→</span>}</button>
              <Seal variant="inline" />
            </div>
            {error && <p className="pay-error" role="alert">{error}</p>}
            <p className="fine">
              One click on the card you just used. No details to re-enter, nothing renews.
              {monthly ? ' The extra packs arrive in your inbox within minutes.' : ' They’re added to your access page right away.'}
            </p>
            {!monthly && (
              <p className="up-compare">
                All four for ${setTotal} in total, less than the ${PRICES.bundle} bundle on the site.
              </p>
            )}
          </div>
        )}
      </div>

      <Link className="up-skip" href={access} {...(preview ? {} : trackClick('upsell_declined', { packs_offered: packs.length }))}>No thanks, just {orderName}</Link>

      {!clientSecret && (
        <div className={'up-sticky' + (stuck ? ' on' : '')} aria-hidden={!stuck}>
          <span className="up-sticky-price"><s>${value}</s> <b>${UPSELL_PRICE}</b></span>
          <button className="btn btn-green" type="button" onClick={() => accept('sticky')} disabled={pending} tabIndex={stuck ? 0 : -1}>{label}</button>
        </div>
      )}
    </div>
  );
}
