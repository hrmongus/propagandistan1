'use client';

import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useState, useTransition } from 'react';
import { createCheckoutSession } from '@/app/checkout/actions';
import type { CheckoutModel, Order } from '@/lib/checkout';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

type Props = {
  order: Order;
  m: CheckoutModel;
  /** Client secret of the open Checkout Session; cleared by the parent whenever the order changes. */
  clientSecret: string | null;
  onSession: (secret: string | null) => void;
};

export function PayCard({ order, m, clientSecret, onSession }: Props) {
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  const start = () => {
    setError('');
    if (!stripePromise) {
      setError('Payments are not configured yet.');
      return;
    }
    startTransition(async () => {
      const res = await createCheckoutSession(order);
      if ('error' in res) setError(res.error);
      else onSession(res.clientSecret);
    });
  };

  return (
    <div className="pay">
      <div className="pay-top">
        <span className="k">Payment</span>
        {clientSecret && <button className="link-btn dark" type="button" onClick={() => onSession(null)}>Edit order</button>}
      </div>
      <div className="totals">
        <div className="row"><span>{m.orderName}</span><span>{m.orderPrice}</span></div>
        {m.hasAddon && <div className="row"><span>{m.addonLabel}</span><span>{m.addonPrice}</span></div>}
        <div className="row due"><span>Due today</span><span>{m.total}</span></div>
      </div>
      {clientSecret && stripePromise ? (
        <div className="stripe-embed">
          <EmbeddedCheckoutProvider key={clientSecret} stripe={stripePromise} options={{ clientSecret }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      ) : (
        <>
          <button className="btn btn-lg btn-dark btn-block" type="button" onClick={start} disabled={pending} aria-busy={pending}>
            {pending ? 'Opening secure checkout…' : `Continue to payment — ${m.total}`}
          </button>
          {error && <p className="pay-error" role="alert">{error}</p>}
        </>
      )}
      <p className="fine">{m.renewNote} 30-day money back guarantee. Instant access after payment. Payments by Stripe.</p>
    </div>
  );
}
