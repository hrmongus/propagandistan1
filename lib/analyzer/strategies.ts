import { sb } from './store';

/** Public columns only: never select email here, so nothing that renders a strategy can leak it. */
const PUBLIC_COLUMNS = 'id, created_at, first_name, track, answers, metrics, hooks, lyric_line';

export async function getStrategy(id: string) {
  const { data, error } = await sb().from('strategies').select(PUBLIC_COLUMNS).eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}
