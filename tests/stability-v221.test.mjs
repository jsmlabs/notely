import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateStoredNotes, activeNoteChanged, createCoordinator } from '../coordinator.mjs';
import { createNote } from '../core.mjs';
import { createStorageQueue } from '../storage-queue.mjs';

const note = (id, body = '') => ({...createNote(id, 1710000000000), body});
const deferred = () => { let resolve; let reject; const promise = new Promise((a,b)=>{resolve=a;reject=b}); return {promise,resolve,reject}; };

test('external valid capture does not require replacing the active editor value or caret', () => {
  const before=[note('active','user text')];
  const after=[note('captured','page selection'), structuredClone(before[0])];
  assert.equal(activeNoteChanged(before,after,'active'), false);
  assert.equal(activeNoteChanged(before,[note('active','remote edit')],'active'), true);
  assert.equal(activeNoteChanged(before,[],'active'), true);
});

test('stored notebook validation refuses malformed, oversized and duplicate remote records', () => {
  for (const payload of [null, {}, [note('one'),note('one')], [note('ok'), {id:2}], [note('x'.repeat(129))], Array.from({length:1001},(_,i)=>note(String(i)))]) {
    assert.throws(()=>validateStoredNotes(payload));
  }
  assert.deepEqual(validateStoredNotes(undefined), []);
  assert.deepEqual(validateStoredNotes([note('ok')]), [note('ok')]);
});

test('failed remote validation cannot mutate input or silently reduce a notebook', () => {
  const raw=[note('a'),note('a')];
  const snapshot=structuredClone(raw);
  assert.throws(()=>validateStoredNotes(raw), /duplicate/);
  assert.deepEqual(raw,snapshot);
});

test('serialized import and edit preserve writes, stale edits are rejected', async () => {
  let stored=[note('origin')];
  const gate=deferred(); let firstWrite=true;
  const coordinator=createCoordinator(async()=>structuredClone(stored),async next=>{
    if (firstWrite) {firstWrite=false;await gate.promise;}
    stored=structuredClone(next);
  });
  const base=await coordinator.read();
  const edit=coordinator.edit(base,[note('origin','new body')]);
  const merged=coordinator.import([note('from-backup')],'merge',[]);
  gate.resolve();
  await Promise.all([edit,merged]);
  assert.equal(stored.find(x=>x.id==='origin').body,'new body');
  assert.ok(stored.some(x=>x.id==='from-backup'));
  await assert.rejects(coordinator.edit(base,[note('origin','stale')]), /changed in another window/);
  assert.equal(stored.find(x=>x.id==='origin').body,'new body');
});

test('failed autosave retains the latest revision and retry commits latest only', async () => {
  const blocker=deferred(); const writes=[];
  const queue=createStorageQueue(async data=>{
    writes.push(data);
    if(writes.length===1) await blocker.promise;
  });
  queue.enqueue('first'); queue.enqueue('second');
  blocker.reject(new Error('storage error'));
  await queue.whenIdle();
  assert.deepEqual(writes,['first','second']);
  assert.equal(queue.getState().failed,false);
  assert.equal(queue.getState().savedRevision,2);
});

test('external storage event is guarded before replacing editor state', () => {
  const source=readFileSync(new URL('../popup.js', import.meta.url),'utf8');
  assert.match(source,/remote = validateStoredNotes\(changes\[STORAGE_KEY\]\.newValue\)/);
  assert.match(source,/const refreshActive = activeNoteChanged\(notes, remote, activeId\)/);
  assert.match(source,/if \(refreshActive\) renderEditor\(\)/);
  assert.match(source,/catch \(error\) \{[\s\S]*?setSaveStatus\('Storage changed unexpectedly - reload'/);
});
