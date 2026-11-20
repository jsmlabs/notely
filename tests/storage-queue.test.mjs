import test from 'node:test';
import assert from 'node:assert/strict';
import { createStorageQueue } from '../storage-queue.mjs';

function deferred() {
  let resolve, reject;
  const promise = new Promise((ok, fail) => {resolve=ok;reject=fail});
  return {promise, resolve, reject};
}

test('only one write is active; later snapshots replace queued intermediate snapshots', async () => {
  const first=deferred(); const second=deferred();
  const requests=[]; const states=[];
  const queue=createStorageQueue(async value => {
    requests.push(value);
    if (requests.length===1) await first.promise;
    if (requests.length===2) await second.promise;
  }, state => states.push(state));
  const one=[{title:'initial'}];
  queue.enqueue(one); one[0].title='mutated';
  queue.enqueue([{title:'middle'}]);
  queue.enqueue([{title:'final'}]);
  assert.equal(requests.length,1);
  assert.equal(requests[0][0].title,'initial');
  first.resolve(); await new Promise(resolve=>setImmediate(resolve));
  assert.equal(requests.length,2);
  assert.equal(requests[1][0].title,'final');
  assert.notEqual(states.at(-1),'saved');
  second.resolve(); await queue.whenIdle();
  assert.deepEqual(states.at(-1),'saved');
  assert.equal(queue.getState().savedRevision,3);
});

test('failed write retains snapshot for an explicit retry', async () => {
  let tries=0; const writes=[]; const states=[];
  const queue=createStorageQueue(async snapshot => {
    writes.push(snapshot);
    if (++tries===1) throw Error('Quota exceeded');
  }, state => states.push(state));
  queue.enqueue([{body:'retain me'}]);
  await queue.whenIdle();
  assert.equal(queue.getState().failed,true);
  assert.equal(queue.getState().savedRevision,0);
  assert.equal(states.at(-1),'error');
  queue.retry(); await queue.whenIdle();
  assert.equal(queue.getState().failed,false);
  assert.equal(states.at(-1),'saved');
  assert.deepEqual(writes[1],writes[0]);
});

test('failed old write cannot overwrite newest successful write', async () => {
  const first=deferred(); const requests=[]; const states=[];
  const queue=createStorageQueue(async snap=>{
    requests.push(snap);
    if (requests.length===1) await first.promise;
  }, state=>states.push(state));
  queue.enqueue('old'); queue.enqueue('new');
  first.reject(new Error('I/O error'));
  await queue.whenIdle();
  assert.deepEqual(requests,['old','new']);
  assert.equal(queue.getState().failed,false);
  assert.equal(queue.getState().savedRevision,2);
  assert.equal(states.at(-1),'saved');
});

test('retry without a pending snapshot does nothing', async () => {
  let count=0;
  const queue=createStorageQueue(()=>{count++});
  queue.retry(); await queue.whenIdle();
  assert.equal(count,0);
});
