import test from 'node:test';
import assert from 'node:assert/strict';
import { createNote } from '../core.mjs';
import { createBackup, parseBackup, planImport, exportNote, persistImport, MAX_BACKUP_BYTES } from '../backup.mjs';
import { createStorageQueue } from '../storage-queue.mjs';

const note = (id, body = '- [x] shipped\n**safe**') => ({...createNote(id, 1710000000000), title:'Test / note', body, pinned:true, favorite:true, tags:['dev','ideas'], updatedAt:1710000000001});

test('versioned JSON roundtrip retains every field including Markdown and flags', () => {
  const original=[note('one'),note('two','## Heading')];
  const exported=createBackup(original,'2026-11-13T12:00:00.000Z');
  assert.equal(exported.format,'notely-backup');assert.equal(exported.version,1);
  const restored=parseBackup(JSON.stringify(exported));
  assert.deepEqual(restored,original);
  restored[0].tags.push('new');assert.equal(original[0].tags.length,2);
});

test('rejects malformed, unknown and oversized backup without modifying originals', () => {
  const old=[note('old')];
  for(const content of ['{bad', '{}',JSON.stringify({format:'notely-backup',version:2,notes:[]}), 'x'.repeat(MAX_BACKUP_BYTES+1)]) assert.throws(()=>parseBackup(content));
  assert.deepEqual(old,[note('old')]);
});

test('rejects duplicate IDs and invalid note fields rather than truncating data',()=>{
  const base=createBackup([note('x')]);
  assert.throws(()=>parseBackup(JSON.stringify({...base, notes:[note('x'),note('x')]})),/duplicate/);
  assert.throws(()=>parseBackup(JSON.stringify({...base, notes:[{...note('x'),body:'x'.repeat(100001)}]})),/content/);
  assert.throws(()=>parseBackup(JSON.stringify({...base, notes:[{...note('x'),tags:['a','A']}]})),/tag/);
  assert.throws(()=>parseBackup(JSON.stringify({...base, notes:[{...note('x'),pinned:'true'}]})),/flags/);
  assert.throws(()=>parseBackup(JSON.stringify({...base, notes:[{...note('x'),createdAt:null}]})),/timestamps/);
});

test('merge keeps existing IDs intact, skips conflicts and adds only new notes',()=>{
  const original=[note('x','old')];
  const imported=[note('x','different'),note('new')];
  const result=planImport(original,imported,'merge');
  assert.equal(result.added,1); assert.equal(result.skipped,1); assert.equal(result.conflicts,1);
  assert.deepEqual(result.notes,[...original,note('new')]);
  assert.deepEqual(original,[note('x','old')]);
});

test('replace is a pure plan; changes become active only after successful persistence',()=>{
  const before=[note('x')];
  const result=planImport(before,[note('y')],'replace');
  assert.equal(result.replaced,1);assert.deepEqual(before,[note('x')]);
  assert.deepEqual(result.notes,[note('y')]);
});

test('single-note Markdown and TXT export preserve exact body and safe filename',()=>{
  for(const extension of ['md','txt']) {
    const result=exportNote(note('a'),extension);
    assert.equal(result.filename,`Test - note.${extension}`);
    assert.equal(result.content,'- [x] shipped\n**safe**');
  }
  assert.throws(()=>exportNote(note('a'),'html'));
});

test('persistImport waits for writes and only returns a committed snapshot',async()=>{
  const storage={notes:[note('old')]};
  const q=createStorageQueue(async notes=>{storage.notes=structuredClone(notes)});
  const plan=await persistImport(q,storage.notes,[note('added')],'merge');
  assert.deepEqual(storage.notes,plan.notes);
});

test('failed import does not adopt imported notes and reasserts previous snapshot',async()=>{
  const original=[note('original')];
  let storage=structuredClone(original);
  let calls=0;
  const q=createStorageQueue(async notes=>{calls++; if(calls===1)throw new Error('quota');storage=structuredClone(notes)});
  await assert.rejects(persistImport(q,original,[note('new')],'replace'),/Import failed/);
  assert.deepEqual(storage,original);
  assert.equal(q.getState().failed,false);
});

test('failed current save rejects import without overwriting data',async()=>{
  const original=[note('original')];
  const q=createStorageQueue(async()=>{throw new Error('offline')});
  q.enqueue(original);await q.whenIdle();
  await assert.rejects(persistImport(q,original,[note('next')],'merge'),/Save current changes/);
});
