import test from 'node:test';
import assert from 'node:assert/strict';
import { createNote } from '../core.mjs';
import { createDraftJournal, DRAFT_PREFIX, pendingRecovery, recoverAsCopy, recoverOrReuseCopy } from '../draft-recovery.mjs';

const note = (id, title, body) => ({...createNote(id, 10),title,body});
function fakeStorage() {
 const entries = {};
 return {entries,async set(record){Object.assign(entries,structuredClone(record));},async remove(key){delete entries[key];}};
}
test('recovery only offers uncommitted drafts, ordered newest first',()=>{
 const a=note('a','saved','same');const b=note('b','original','new');
 const items={
  [`${DRAFT_PREFIX}a`]:{version:1,timestamp:10,note:a},
  [`${DRAFT_PREFIX}b`]:{version:1,timestamp:20,note:b},
  junk:{version:1,timestamp:99,note:b},
  [`${DRAFT_PREFIX}invalid`]:{version:1,timestamp:45,note:{id:0}},
 };
 assert.deepEqual(pendingRecovery(items,[a,note('b','original','old')]).map(d=>d.note.id),['b']);
 assert.deepEqual(pendingRecovery(items,[]).map(d=>d.note.id),['b','a']);
});
test('recovery creates an independent copy without changing existing note',()=>{
 const original=note('a','Title','Current');
 const draft={note:note('a','Title','Unsaved')};
 const restored=recoverAsCopy([original],draft,'fresh',100);
 assert.equal(restored.length,2);
 assert.equal(restored[0].id,'fresh');assert.equal(restored[0].body,'Unsaved');
 assert.deepEqual(restored[1],original);
 assert.throws(()=>recoverAsCopy([original],draft,'a'),/already exists/);
 assert.throws(()=>recoverAsCopy(Array.from({length:1000},(_,i)=>note(String(i),'','')),draft,'fresh'),/full/);
});
test('separate editor sessions do not overwrite each other; successful save clears only own journal',async()=>{
 const storage=fakeStorage();const a=createDraftJournal(storage,'window-a');const b=createDraftJournal(storage,'window-b');
 await Promise.all([a.record(note('1','a','draft A')),b.record(note('2','b','draft B'))]);
 assert.equal(Object.keys(storage.entries).length,2);
 await a.acknowledged();
 assert.deepEqual(Object.keys(storage.entries),[b.key]);
});
test('acknowledgement cannot erase a newer queued edit',async()=>{
 let release;const barrier=new Promise(resolve=>{release=resolve;});
 const storage=fakeStorage();let writes=0;
 const slow={
  ...storage,
  async set(record) {writes++; if(writes===1) await barrier;await storage.set(record);}
 };
 const journal=createDraftJournal(slow,'window');
 const first=journal.record(note('n','draft','first'));
 const cleared=journal.acknowledged();
 const last=journal.record(note('n','draft','second'));
 release();
 await Promise.all([first,cleared,last]);
 assert.equal(storage.entries[journal.key].note.body,'second');
});
test('failed draft write remains surfaced and next write can recover',async()=>{
 const storage=fakeStorage();let fail=true;
 const adapter={...storage,async set(item){if(fail)throw Error('quota');return storage.set(item)}};
 const journal=createDraftJournal(adapter,'recover');
 await assert.rejects(journal.record(note('n','','one')),/quota/);
 fail=false;await journal.record(note('n','','two'));
 assert.equal(storage.entries[journal.key].note.body,'two');
});

test('a failed recovery save can retry without creating additional notes',()=>{
 const original=note('original','Saved','current');
 const draft={note:note('original','Saved','draft')};
 const first=recoverOrReuseCopy([original],draft,'stable-id',200);
 const retry=recoverOrReuseCopy(first,draft,'stable-id',300);
 assert.equal(first.length,2);
 assert.equal(retry.length,2);
 assert.deepEqual(retry,first);
 assert.equal(retry[0].body,'draft');
});
