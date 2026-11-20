import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createNote } from '../core.mjs';
import { recoverOrReuseCopy } from '../draft-recovery.mjs';

const source = readFileSync(new URL('../popup.js', import.meta.url), 'utf8');
const extract = (start, end) => source.slice(source.indexOf(start), source.indexOf(end));
const methods = extract('async function discardRecovery()', 'async function request(') + '\n' +
  extract('async function applyImport()', '\nfunction bindings()');

function deferred() {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
}
function setup() {
  const gate = deferred();
  const draft = { key: 'recover-1', note: { ...createNote('source', 100), title: 'Draft', body: 'unsaved' } };
  const elements = Object.fromEntries(['recovery-restore','recovery-discard','import-apply'].map(k => [k,{disabled:false}]));
  const removed = [];
  const state = { failed: false };
  const context = vm.createContext({
    elements, recoveryCandidates: [draft], recoveryInProgress: false, importing: false,
    recoveryAttempt: null, notes: [createNote('source', 100)],
    storageQueue: { enqueue() {}, whenIdle: () => gate.promise, getState: () => state },
    crypto: { randomUUID: () => 'recovered-copy' },
    recoverOrReuseCopy, openNote() {}, refreshRecovery: async () => {},
    chrome: { storage: { local: { remove: async key => { removed.push(key); } } } },
    refreshImportPreview() { elements['import-apply'].disabled = false; },
    showNotice() {}, importedNotes: [],
  });
  vm.runInContext(methods, context);
  return { context, gate, draft, elements, removed, state };
}

test('pending recovery forbids discard and backup import until persistence completes', async () => {
  const f = setup();
  const recovering = vm.runInContext('restoreRecovery()', f.context);
  assert.equal(f.elements['recovery-discard'].disabled, true);
  assert.equal(f.elements['import-apply'].disabled, true);
  await vm.runInContext('discardRecovery()', f.context);
  await vm.runInContext('applyImport()', f.context);
  assert.deepEqual(f.removed, []);
  f.gate.resolve();
  await recovering;
  assert.deepEqual(f.removed, [f.draft.key]);
  assert.equal(f.elements['recovery-discard'].disabled, false);
  assert.equal(f.elements['import-apply'].disabled, false);
});

test('failed recovery save keeps source draft and unlocks conflicting actions', async () => {
  const f = setup();
  f.state.failed = true;
  const recovering = vm.runInContext('restoreRecovery()', f.context);
  await vm.runInContext('discardRecovery()', f.context);
  f.gate.resolve();
  await recovering;
  assert.deepEqual(f.removed, []);
  assert.equal(f.elements['recovery-restore'].disabled, false);
  assert.equal(f.elements['recovery-discard'].disabled, false);
  assert.equal(f.elements['import-apply'].disabled, false);
  assert.equal(vm.runInContext('notes.length', f.context), 2);
});
