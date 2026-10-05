'use client';

import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { acceptUpsell } from '@/app/upsell/actions';
import { UPSELL_PRICE } from '@/lib/checkout';
import { PACK_SLUGS } from '@/lib/data';
import { Fan } from '../Fan';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

type Props = { sessionId: string; orderName: string; packs: { slug: string; name: string; genres: string }[]; monthly: boolean };

export function UpsellView({ sessionId, orderName, packs, monthly }: Props) {
  const [pending, start] = useTransition();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const access = `/access?session_id=${encodeURIComponent(sessionId)}`;
  const value = packs.length * 37;
  const off = Math.round((1 - UPSELL_PRICE / value) * 100);

  const accept = () =>
    start(async () => {
      setError(null);
      // On success the action redirects to /access; otherwise it hands back a card form or an error.
      const res = await acceptUpsell(sessionId);
      if ('clientSecret' in res) setClientSecret(res.clientSecret);
      else setError(res.error);
    });

  return (
    <div className="upsell">
      <ol className="up-steps" aria-label="Order progress">
        <li className="done"><span>✓</span>Payment</li>
        <li className="on"><span>2</span>Complete the set</li>
        <li><span>3</span>Access</li>
      </ol>

      <div className="up-head">
        <span className="ok"><span className="gdot" />{orderName} is yours — your access link is one click away</span>
        <h1>Get the other {packs.length} packs for ${UPSELL_PRICE}. Not each — all {packs.length}.</h1>
        <p>
          That&apos;s ${(UPSELL_PRICE / packs.length).toFixed(0)} a pack instead of $37: {packs.length * 30} more finished videos and {packs.length * 112} raw
          clips, so you can post four times a day or line up the next three months. This price exists only on this page, only right after checkout.
        </p>
      </div>

      <div className="card up-offer">
        <div className="up-fans">
          {packs.map((p) => (
            <div className="up-pack" key={p.slug}>
              <Fan gi={PACK_SLUGS.indexOf(p.slug)} size="mid" />
              <span className="t">{p.name}</span>
              <span className="g">{p.genres}</span>
            </div>
          ))}
        </div>

        <div className="up-price">
          <span className="was">${value}</span>
          <span className="now">${UPSELL_PRICE}</span>
          <span className="tag">{off}% off</span>
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
          <>
            <button className="btn btn-green btn-lg btn-block" type="button" onClick={accept} disabled={pending}>
              {pending ? 'Adding to your order…' : `Yes — add all ${packs.length} packs for $${UPSELL_PRICE}`}
            </button>
            {error && <p className="pay-error" role="alert">{error}</p>}
            <p className="fine">
              One click, charged to the card you just used — no details to re-enter. One-off payment, nothing renews.
              {monthly ? ' The extra packs arrive in your inbox within minutes.' : ' They’re added to your access page right away.'} Covered by the 30-day money back guarantee.
            </p>
          </>
        )}
      </div>

      <Link className="up-skip" href={access}>No thanks — take me to my {orderName} pack</Link>
    </div>
  );
}
