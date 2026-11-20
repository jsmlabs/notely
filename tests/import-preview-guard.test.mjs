import test from 'node:test';
import assert from 'node:assert/strict';
import { captureImportBaseline, importPreviewIsCurrent } from '../import-preview-guard.mjs';
import { createCoordinator } from '../coordinator.mjs';
import { createNote } from '../core.mjs';

const note = (id, body='') => ({...createNote(id, 1710000000000), body});
test('preview snapshot is isolated from later mutations and detect changes', () => {
  const current = [note('a', 'original')];
  const preview = captureImportBaseline(current);
  assert.ok(importPreviewIsCurrent(preview, current));
  current[0].body = 'changed';
  assert.ok(!importPreviewIsCurrent(preview, current));
  current[0].body = 'original';
  current.push(note('capture'));
  assert.ok(!importPreviewIsCurrent(preview, current));
  assert.equal(preview.length, 1);
  assert.ok(!importPreviewIsCurrent(null, current));
});
test('destructive import refuses a capture that happened after preview', async () => {
  let stored = [note('existing')];
  const api = createCoordinator(async () => structuredClone(stored), async next => {stored = structuredClone(next);});
  const preview = captureImportBaseline(await api.read());
  await api.capture('late capture', { id:'captured' });
  assert.ok(!importPreviewIsCurrent(preview, await api.read()));
  await assert.rejects(api.import([note('replacement')], 'replace', preview), /changed since preview/);
  assert.deepEqual(stored.map(n => n.id), ['captured', 'existing']);
});
test('unchanged preview permits replacement', async () => {
  let stored = [note('existing')];
  const api = createCoordinator(async () => structuredClone(stored), async next => {stored = structuredClone(next);});
  const preview = captureImportBaseline(await api.read());
  assert.ok(importPreviewIsCurrent(preview, await api.read()));
  const result = await api.import([note('replacement')], 'replace', preview);
  assert.equal(result.added, 1);
  assert.deepEqual(stored.map(n => n.id), ['replacement']);
});
