import test from 'node:test';
import assert from 'node:assert/strict';
import {createCoordinator,mergeEdits,captureNote,safeSourceUrl} from '../coordinator.mjs';
import {createNote} from '../core.mjs';
import {createBackup,parseBackup} from '../backup.mjs';
import {createStorageQueue} from '../storage-queue.mjs';

const note=(id,body='')=>({...createNote(id,1710000000000),body});
const createFixture=(initial=[])=>{
  let persisted=structuredClone(initial), writes=0,fail=false;
  const coordinator=createCoordinator(async()=>structuredClone(persisted),async value=>{
    if(fail) throw Error('quota exceeded');
    await Promise.resolve();
    persisted=structuredClone(value);writes++;
  });
  return {coordinator,get:()=>structuredClone(persisted),fail:v=>{fail=v},writes:()=>writes};
};
test('capture and stale popup edit preserve independent notes even when scheduled together',async()=>{
  const fx=createFixture([note('existing','old')]);const base=await fx.coordinator.read();
  const edited=[note('existing','edited')];
  const [captured]=await Promise.all([
    fx.coordinator.capture('selected content',{id:'capture',title:'Example',url:'https://example.com/path'}),
    fx.coordinator.edit(base,edited)
  ]);
  assert.equal(captured.source.url,'https://example.com/path');
  assert.equal(fx.get().length,2);
  assert.equal(fx.get().find(n=>n.id==='existing').body,'edited');
  assert.equal(fx.get().find(n=>n.id==='capture').body,'selected content');
});
test('two stale edits on the same note reject conflict without data loss',async()=>{
  const fx=createFixture([note('n','first')]);const base=await fx.coordinator.read();
  await fx.coordinator.edit(base,[note('n','new')]);
  await assert.rejects(fx.coordinator.edit(base,[note('n','stale')]),/changed in another window/);
  assert.equal(fx.get()[0].body,'new');
});
test('deleting an old note does not delete a new capture from stale base',async()=>{
  const fx=createFixture([note('old')]);const base=await fx.coordinator.read();
  await fx.coordinator.capture('new selection',{id:'new'});
  assert.deepEqual((await fx.coordinator.edit(base,[])).map(n=>n.id),['new']);
});
test('storage failure preserves old notes; captures are not acknowledged',async()=>{
  const fx=createFixture([note('old')]);fx.fail(true);
  await assert.rejects(fx.coordinator.capture('selected',{id:'new'}),/quota exceeded/);
  assert.deepEqual(fx.get(),[note('old')]);
});
test('replace refuses captures arriving since preview; merge includes them',async()=>{
  const fx=createFixture([note('old')]);const expected=await fx.coordinator.read();
  await fx.coordinator.capture('selection',{id:'capture'});
  await assert.rejects(fx.coordinator.import([note('new')],'replace',expected),/changed since preview/);
  const result=await fx.coordinator.import([note('new')],'merge',expected);
  assert.equal(result.added,1);
  assert.deepEqual(new Set(fx.get().map(n=>n.id)),new Set(['old','capture','new']));
});
test('source attribution is optional and URL schemes restricted',()=>{
  assert.equal(safeSourceUrl('javascript:alert(1)'),'');
  assert.equal(safeSourceUrl('data:text/html,x'),'');
  assert.equal(safeSourceUrl('https://example.com/?a=1'),'https://example.com/?a=1');
  assert.deepEqual(captureNote('text',{includeSource:false,url:'https://example.com',id:'a',now:1}).source,undefined);
  assert.equal(captureNote('<script>bad</script>',{url:'javascript:alert(1)',id:'a'}).body,'<script>bad</script>');
  assert.throws(()=>captureNote(' '),/Select some text/);
  assert.throws(()=>captureNote('x'.repeat(100001)),/limit/);
});
test('source metadata survives a version 1 backup roundtrip',()=>{
  const saved=captureNote('hello',{id:'a',url:'https://example.org',title:'Source'});
  assert.deepEqual(parseBackup(JSON.stringify(createBackup([saved]))),[saved]);
  const corrupt=createBackup([saved]);corrupt.notes[0].source.url='javascript:alert(1)';
  assert.throws(()=>parseBackup(JSON.stringify(corrupt)),/invalid source/);
});
test('resetting queue after authoritative restore prevents a stale retry',async()=>{
  const writes=[];const q=createStorageQueue(async data=>writes.push(data));
  q.enqueue([note('old')]);await q.whenIdle();
  q.seed([note('restored')]);q.retry();await q.whenIdle();
  assert.deepEqual(writes.at(-1),[note('restored')]);
});
