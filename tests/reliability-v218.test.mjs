import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createCoordinator } from '../coordinator.mjs';
import { createNote } from '../core.mjs';
import { recoverOrReuseCopy } from '../draft-recovery.mjs';

const note = (id, body='')=>({...createNote(id,1710000000000),body});
function storageFixture(initial) {
  let data=structuredClone(initial); let writes=0;
  return {
    coordinator:createCoordinator(async()=>structuredClone(data),async notes=>{data=structuredClone(notes);writes++;}),
    get:()=>structuredClone(data), writes:()=>writes,
  };
}
function deferred() {
  let resolve;
  const promise=new Promise(r=>resolve=r);
  return {promise,resolve};
}

test('first launch with absent stored key can safely create a note',async()=>{
  const f=storageFixture(undefined);
  assert.deepEqual(await f.coordinator.read(),[]);
  await f.coordinator.quick();
  assert.equal(f.get().length,1);
  assert.equal(f.writes(),1);
});

test('non-array stored data fails closed for reads, edits, captures and imports',async()=>{
  const malformed={important:'do not erase'};
  const f=storageFixture(malformed);
  await assert.rejects(f.coordinator.read(),/not an array/);
  await assert.rejects(f.coordinator.quick(),/not an array/);
  await assert.rejects(f.coordinator.capture('text',{id:'x'}),/not an array/);
  await assert.rejects(f.coordinator.import([note('new')],'merge',[]),/not an array/);
  assert.deepEqual(f.get(),malformed);
  assert.equal(f.writes(),0);
});

test('duplicate and invalid stored IDs cannot be discarded by later operations',async()=>{
  for(const records of [[note('x'),note('x')],[note('x'),{id:42,body:'unparsed'}]]) {
    const f=storageFixture(records);
    await assert.rejects(f.coordinator.quick(),/invalid or duplicate IDs/);
    await assert.rejects(f.coordinator.edit(records,[note('x','updated')]),/invalid or duplicate IDs/);
    assert.deepEqual(f.get(),records);
    assert.equal(f.writes(),0);
  }
});

test('failed operation does not deadlock the coordinator for a later valid call',async()=>{
  const f=storageFixture([note('one','original')]);
  const base=await f.coordinator.read();
  // Explicit same-note stale conflict followed by an unrelated authorized capture.
  await f.coordinator.edit(base,[note('one','committed')]);
  await assert.rejects(f.coordinator.edit(base,[note('one','stale')]),/changed in another window/);
  await f.coordinator.capture('selection',{id:'captured'});
  assert.deepEqual(new Set(f.get().map(n=>n.id)),new Set(['one','captured']));
  assert.equal(f.get().find(n=>n.id==='one').body,'committed');
});

test('import serialized after a captured note never loses the captured note',async()=>{
  const gate=deferred(); let calls=0; let data=[note('original')];
  const c=createCoordinator(async()=>{
    if(++calls===2) await gate.promise;
    return structuredClone(data);
  },async value=>{data=structuredClone(value)});
  const capture=c.capture('from page',{id:'capture'});
  const imported=c.import([note('imported')],'merge',[]);
  gate.resolve();
  await Promise.all([capture,imported]);
  assert.deepEqual(new Set(data.map(n=>n.id)),new Set(['original','capture','imported']));
});

test('recovery retry reuses its own copy but refuses unrelated ID collisions',()=>{
  const draft={note:{...note('source','unsaved'),title:'Draft',tags:['work'],favorite:true}};
  const one=recoverOrReuseCopy([note('source','saved')],draft,'copy',200);
  assert.deepEqual(recoverOrReuseCopy(one,draft,'copy',300),one);
  const colliding=[note('copy','different'),note('source','saved')];
  assert.throws(()=>recoverOrReuseCopy(colliding,draft,'copy',300),/different note/);
  assert.deepEqual(colliding,[note('copy','different'),note('source','saved')]);
});

test('import UI enforces mutation lock in both success and failure paths',()=>{
  const controller=readFileSync(new URL('../popup.js',import.meta.url),'utf8');
  assert.match(controller,/importing = true;\s*lockEditingForImport\(true\)/);
  assert.match(controller,/finally \{ importing = false;\s*lockEditingForImport\(false\)/);
  for(const fn of ['newNote','changeActive','deleteActive','restoreDeleted','addTag']) {
    assert.match(controller,new RegExp(`function ${fn}\\([^]*?\\{\\s*if \\(importing`));
  }
});

test('oversized stored IDs and note content are not silently truncated on save',async()=>{
  for(const broken of [{...note('x'),id:'x'.repeat(129)},{...note('x'),body:'b'.repeat(100001)}]) {
    const fx=storageFixture([broken]);
    await assert.rejects(fx.coordinator.quick(),/field limits/);
    assert.deepEqual(fx.get(),[broken]);
    assert.equal(fx.writes(),0);
  }
});
