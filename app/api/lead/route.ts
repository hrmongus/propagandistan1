import { sb } from '@/lib/analyzer/store';
import { sendToESP } from '@/lib/analyzer/esp';

/** Lead capture on the results page: saves name + email onto the strategy row and hands it to the ESP stub. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as { id?: string; name?: string; email?: string } | null;
  const name = b?.name?.trim().slice(0, 120) ?? '', email = b?.email?.trim().toLowerCase().slice(0, 200) ?? '';
  if (!b?.id || !/^[A-Za-z0-9]{10}$/.test(b.id) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: 'invalid' }, { status: 400 });
  const { data, error } = await sb().from('strategies').update({ name, email }).eq('id', b.id).select('id').maybeSingle();
  if (error || !data) return Response.json({ error: 'not found' }, { status: 404 });
  await sendToESP({ strategyId: b.id, name, email, link: `${new URL(req.url).origin}/s/${b.id}` });
  return Response.json({ ok: true });
}
