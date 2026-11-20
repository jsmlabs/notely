import test from 'node:test';
import assert from 'node:assert/strict';
import { nextFocusIndex } from '../navigation.mjs';

test('keyboard navigation moves across notes with bounded indices', () => {
  assert.equal(nextFocusIndex('ArrowDown', -1, 4), 0);
  assert.equal(nextFocusIndex('ArrowDown', 1, 4), 2);
  assert.equal(nextFocusIndex('ArrowDown', 3, 4), 3);
  assert.equal(nextFocusIndex('ArrowUp', 2, 4), 1);
  assert.equal(nextFocusIndex('ArrowUp', 0, 4), 0);
  assert.equal(nextFocusIndex('ArrowUp', -1, 4), 3);
});
test('Home and End access list boundaries and empty lists are safe', () => {
  assert.equal(nextFocusIndex('Home', 3, 4), 0);
  assert.equal(nextFocusIndex('End', 0, 4), 3);
  assert.equal(nextFocusIndex('ArrowDown', -1, 0), -1);
  assert.equal(nextFocusIndex('End', 0, 0), -1);
  assert.equal(nextFocusIndex('Escape', 1, 4), -1);
});
test('popup exposes reset and correct semantic list keyboard hooks', async () => {
  const { readFile } = await import('node:fs/promises');
  const html = await readFile(new URL('../popup.html', import.meta.url),'utf8');
  const js = await readFile(new URL('../popup.js', import.meta.url),'utf8');
  assert.match(html, /id="clear-filters"/);
  assert.match(html, /id="note-list" role="group"/);
  assert.match(js, /addEventListener\('keydown',moveNoteFocus\)/);
  assert.match(js, /clear\.addEventListener\('click', clearFilters\)/);
});
