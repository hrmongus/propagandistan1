import { getJob } from '@/lib/analyzer/store';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(id).catch(() => null);
  if (!job) return Response.json({ error: 'not found' }, { status: 404 });
  return Response.json(job, { headers: { 'Cache-Control': 'no-store' } });
}
