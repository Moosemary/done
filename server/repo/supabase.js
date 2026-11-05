import { createClient } from '@supabase/supabase-js';

const FALT = 'id, kind, title, parent_id, done, done_at, created_at';

function kasta(error) {
  if (error) throw new Error(`Databasfel: ${error.message}`);
}

// Databaslager mot Supabase. Samma gränssnitt som server/repo/memory.js.
export function createSupabaseRepo({ url, secretKey }) {
  const db = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const tabell = () => db.from('todos');

  return {
    // Alla rader, nyast först.
    async list() {
      const { data, error } = await tabell()
        .select(FALT)
        .order('created_at', { ascending: false });
      kasta(error);
      return data;
    },

    async get(id) {
      const { data, error } = await tabell().select(FALT).eq('id', id).maybeSingle();
      kasta(error);
      return data;
    },

    async create({ kind, title, parent_id = null }) {
      const { data, error } = await tabell()
        .insert({ kind, title, parent_id })
        .select(FALT)
        .single();
      kasta(error);
      return data;
    },

    // Ändrar title och/eller done. Returnerar null om raden saknas.
    async update(id, { title, done }) {
      const andring = {};
      if (title !== undefined) andring.title = title;
      if (done !== undefined) {
        andring.done = done;
        andring.done_at = done ? new Date().toISOString() : null;
      }
      const { data, error } = await tabell()
        .update(andring)
        .eq('id', id)
        .select(FALT)
        .maybeSingle();
      kasta(error);
      return data;
    },

    // Tar bort raden och dess underpunkter (on delete cascade).
    async remove(id) {
      const { data, error } = await tabell().delete().eq('id', id).select('id');
      kasta(error);
      return data.length > 0;
    },

    // Tar bort ikryssade underpunkter i ett projekt. Returnerar antalet.
    async removeDoneChildren(projectId) {
      const { data, error } = await tabell()
        .delete()
        .eq('parent_id', projectId)
        .eq('done', true)
        .select('id');
      kasta(error);
      return data.length;
    },
  };
}
