import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryRepo } from '../server/repo/memory.js';

// Samma gränssnitt ska gälla för alla repo-versioner. Fler versioner kan
// läggas till i listan nedan.
const versioner = [['minnesdatabas', () => createMemoryRepo()]];

for (const [namn, skapa] of versioner) {
  describe(`repo: ${namn}`, () => {
    test('create ger en rad med standardvärden', async () => {
      const repo = skapa();
      const rad = await repo.create({ kind: 'item', title: 'Köpa mjölk' });
      assert.equal(rad.kind, 'item');
      assert.equal(rad.title, 'Köpa mjölk');
      assert.equal(rad.parent_id, null);
      assert.equal(rad.done, false);
      assert.equal(rad.done_at, null);
      assert.ok(rad.id);
      assert.ok(rad.created_at);
    });

    test('list ger alla rader, nyast först', async () => {
      const repo = skapa();
      const a = await repo.create({ kind: 'item', title: 'A' });
      const b = await repo.create({ kind: 'project', title: 'B' });
      const c = await repo.create({ kind: 'item', title: 'C', parent_id: b.id });
      const lista = await repo.list();
      assert.deepEqual(lista.map((r) => r.id), [c.id, b.id, a.id]);
    });

    test('get hämtar en rad, och null om den saknas', async () => {
      const repo = skapa();
      const rad = await repo.create({ kind: 'item', title: 'A' });
      assert.deepEqual(await repo.get(rad.id), rad);
      assert.equal(await repo.get('00000000-0000-4000-8000-000000000000'), null);
    });

    test('update ändrar titel och sätter done_at när den kryssas i', async () => {
      const repo = skapa();
      const rad = await repo.create({ kind: 'item', title: 'A' });
      const bytt = await repo.update(rad.id, { title: 'B' });
      assert.equal(bytt.title, 'B');
      assert.equal(bytt.done, false);

      const klar = await repo.update(rad.id, { done: true });
      assert.equal(klar.done, true);
      assert.ok(klar.done_at);

      const ogjord = await repo.update(rad.id, { done: false });
      assert.equal(ogjord.done, false);
      assert.equal(ogjord.done_at, null);
    });

    test('update ger null om raden saknas', async () => {
      const repo = skapa();
      const svar = await repo.update('00000000-0000-4000-8000-000000000000', { done: true });
      assert.equal(svar, null);
    });

    test('remove tar bort raden, och ett projekt tar med sina underpunkter', async () => {
      const repo = skapa();
      const projekt = await repo.create({ kind: 'project', title: 'P' });
      await repo.create({ kind: 'item', title: 'U1', parent_id: projekt.id });
      await repo.create({ kind: 'item', title: 'U2', parent_id: projekt.id });
      const kvar = await repo.create({ kind: 'item', title: 'Egen' });

      assert.equal(await repo.remove(projekt.id), true);
      assert.deepEqual((await repo.list()).map((r) => r.id), [kvar.id]);
      assert.equal(await repo.remove(projekt.id), false);
    });

    test('removeDoneChildren tar bara bort ikryssade underpunkter i projektet', async () => {
      const repo = skapa();
      const p1 = await repo.create({ kind: 'project', title: 'P1' });
      const p2 = await repo.create({ kind: 'project', title: 'P2' });
      const klar = await repo.create({ kind: 'item', title: 'klar', parent_id: p1.id });
      const ogjord = await repo.create({ kind: 'item', title: 'ogjord', parent_id: p1.id });
      const annan = await repo.create({ kind: 'item', title: 'annan', parent_id: p2.id });
      await repo.update(klar.id, { done: true });
      await repo.update(annan.id, { done: true });

      assert.equal(await repo.removeDoneChildren(p1.id), 1);
      const ider = (await repo.list()).map((r) => r.id);
      assert.ok(!ider.includes(klar.id));
      assert.ok(ider.includes(ogjord.id));
      assert.ok(ider.includes(annan.id));
      assert.equal(await repo.removeDoneChildren(p1.id), 0);
    });
  });
}
