import { randomUUID } from 'node:crypto';

// Låtsasdatabas i minnet med samma gränssnitt som server/repo/supabase.js.
// Används av testerna så att de inte behöver Supabase eller nyckel.
export function createMemoryRepo() {
  const rows = new Map();
  let tick = 0;

  const kopia = (rad) => ({ ...rad });

  return {
    // Alla rader, nyast först.
    async list() {
      return [...rows.values()]
        .sort((a, b) => b.seq - a.seq)
        .map(({ seq, ...rad }) => kopia(rad));
    },

    async get(id) {
      const rad = rows.get(id);
      if (!rad) return null;
      const { seq, ...resten } = rad;
      return kopia(resten);
    },

    async create({ kind, title, parent_id = null }) {
      const rad = {
        id: randomUUID(),
        kind,
        title,
        parent_id,
        done: false,
        done_at: null,
        created_at: new Date().toISOString(),
        seq: ++tick,
      };
      rows.set(rad.id, rad);
      const { seq, ...resten } = rad;
      return kopia(resten);
    },

    // Ändrar title och/eller done. Returnerar null om raden saknas.
    async update(id, { title, done }) {
      const rad = rows.get(id);
      if (!rad) return null;
      if (title !== undefined) rad.title = title;
      if (done !== undefined && done !== rad.done) {
        rad.done = done;
        rad.done_at = done ? new Date().toISOString() : null;
      }
      const { seq, ...resten } = rad;
      return kopia(resten);
    },

    // Tar bort raden och dess underpunkter. Returnerar true om något togs bort.
    async remove(id) {
      if (!rows.has(id)) return false;
      for (const rad of [...rows.values()]) {
        if (rad.parent_id === id) rows.delete(rad.id);
      }
      rows.delete(id);
      return true;
    },

    // Tar bort ikryssade underpunkter i ett projekt. Returnerar antalet.
    async removeDoneChildren(projectId) {
      let antal = 0;
      for (const rad of [...rows.values()]) {
        if (rad.parent_id === projectId && rad.done) {
          rows.delete(rad.id);
          antal++;
        }
      }
      return antal;
    },
  };
}
