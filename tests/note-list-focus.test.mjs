import test from 'node:test';
import assert from 'node:assert/strict';
import { captureNoteListFocus, restoreNoteListFocus } from '../note-list-focus.mjs';

function makeCards(ids) {
  return ids.map(id => ({dataset: {noteId: id}, focus(options) { this.focusedWith = options; }}));
}
function makeContainer(cards) {
  return {contains(element) { return cards.includes(element); }, querySelectorAll(selector) {
    assert.equal(selector, '.note-card'); return cards;
  }};
}

test('preserves focused note by stable id after reorder', () => {
  const initial = makeCards(['a','b','c']);
  const snapshot = captureNoteListFocus(makeContainer(initial),initial[1]);
  const reordered = makeCards(['b','c','a']);
  assert.equal(restoreNoteListFocus(makeContainer(reordered),snapshot),true);
  assert.deepEqual(reordered[0].focusedWith,{preventScroll:true});
  assert.equal(reordered[1].focusedWith,undefined);
});
test('focus falls to adjacent surviving note when focused item disappears', () => {
  const initial = makeCards(['a','b','c']);
  const snapshot = captureNoteListFocus(makeContainer(initial),initial[1]);
  const remaining = makeCards(['a','c']);
  restoreNoteListFocus(makeContainer(remaining),snapshot);
  assert.deepEqual(remaining[1].focusedWith,{preventScroll:true});
});
test('external focus is never stolen by rerender', () => {
  const cards = makeCards(['a']);
  assert.equal(captureNoteListFocus(makeContainer(cards),{}),null);
  assert.equal(restoreNoteListFocus(makeContainer(cards),null),false);
  assert.equal(cards[0].focusedWith,undefined);
});
test('empty filtered list does not attempt invalid focus', () => {
  assert.equal(restoreNoteListFocus(makeContainer([]),{id:'gone',index:0}),false);
});
