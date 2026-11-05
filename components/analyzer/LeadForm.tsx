'use client';

import { useState } from 'react';

export function LeadForm({ id }: { id: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState('sending');
    const res = await fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, name: f.get('name'), email: f.get('email') }) });
    setState(res.ok ? 'done' : 'error');
  };
  if (state === 'done') return <p>Saved. Check your inbox.</p>;
  return (
    <form onSubmit={submit}>
      <input name="name" placeholder="Name" required /> <input name="email" type="email" placeholder="Email" required />{' '}
      <button disabled={state === 'sending'}>Send</button> {state === 'error' && 'Something went wrong.'}
    </form>
  );
}
