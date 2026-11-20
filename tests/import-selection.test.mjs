import test from 'node:test';
import assert from 'node:assert/strict';
import {createImportSelection} from '../import-selection.mjs';

function pending() {
  let resolve, reject;
  const promise = new Promise((yes,no) => {resolve=yes;reject=no});
  return {promise,resolve,reject};
}

test('a slow previous backup cannot replace the latest selection', async () => {
  const older = pending(), newer = pending();
  const selection = createImportSelection(JSON.parse);
  const first = selection.invalidate();
  const a = selection.read({text: () => older.promise}, first);
  const second = selection.invalidate();
  const b = selection.read({text: () => newer.promise}, second);
  newer.resolve('[{"id":"latest"}]');
  assert.deepEqual(await b,{current:true,notes:[{id:'latest'}]});
  older.resolve('[{"id":"stale"}]');
  assert.deepEqual(await a,{current:false});
});

test('clearing a selection invalidates pending reads and stale errors', async () => {
  const older = pending();
  const selection = createImportSelection(JSON.parse);
  const first = selection.invalidate();
  const result = selection.read({text: () => older.promise}, first);
  selection.invalidate();
  older.reject(new Error('old file unavailable'));
  assert.deepEqual(await result,{current:false});
});

test('current invalid backup still surfaces an actionable parse error', async () => {
  const selection = createImportSelection(JSON.parse);
  const current = selection.invalidate();
  await assert.rejects(selection.read({text: async()=>'{broken'},current),SyntaxError);
});
