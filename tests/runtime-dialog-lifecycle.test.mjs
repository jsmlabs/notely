import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createImportSelection } from '../import-selection.mjs';

const source = readFileSync(new URL('../popup.js', import.meta.url), 'utf8');
const deferred = () => { let resolve; const promise = new Promise(r => {resolve = r;}); return {promise,resolve}; };

test('closing the backup dialog invalidates an outstanding file read', async () => {
  const file = deferred();
  const selection = createImportSelection(JSON.parse);
  const read = selection.read({ text: () => file.promise }, selection.invalidate());
  // The actual close handler calls the same invalidation API.
  selection.invalidate();
  file.resolve('[{"id":"stale-preview"}]');
  assert.deepEqual(await read, {current:false});
  assert.match(source, /function resetImportPreviewOnClose\(\)\s*\{[\s\S]*?importSelection\.invalidate\(\)/);
  assert.match(source, /backup-dialog'\]\.addEventListener\('close',[\s\S]*?resetImportPreviewOnClose\(\)/);
});

test('closing and reopening backup resets selected file and destructive confirmation', () => {
  const reset = source.slice(source.indexOf('function resetImportPreviewOnClose()'), source.indexOf('function refreshImportPreview()'));
  assert.match(reset, /importedNotes = null/);
  assert.match(reset, /importPreviewBase = null/);
  assert.match(reset, /import-file'\]\.value = ''/);
  assert.match(reset, /replace-confirm'\]\.checked = false/);
});

test('support closing resolves even if the animation.finished getter throws', async () => {
  const support = source.slice(source.indexOf('const closeSupportDialog ='), source.indexOf("elements['support-open'].addEventListener"));
  assert.match(support, /Promise\.resolve\(animation\.finished\)\.then\(finish, finish\)/);
  assert.match(support, /catch \{ finish\(\); \}/);
  assert.match(support, /try \{ animation\.cancel\(\); \} catch/);
});
