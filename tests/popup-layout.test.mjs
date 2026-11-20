import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = name => readFile(new URL(`../${name}`, import.meta.url), 'utf8');

test('popup and side panel keep both capture actions and native collapsible filters', async () => {
  for (const name of ['popup.html', 'sidepanel.html']) {
    const html = await read(name);
    assert.match(html, /<details class="filter-disclosure" id="filter-disclosure">/);
    assert.match(html, /<summary>Filters &amp; sorting/);
    assert.match(html, /<div class="capture-actions">/);
    for (const id of ['new-note','quick-note','search-field','sort-mode','tag-filter','favorites-filter','note-list']) {
      assert.match(html, new RegExp(`id="${id}"`));
    }
    assert.ok(!/<details class="filter-disclosure" id="filter-disclosure" open/.test(html));
  }
});

test('compact notes-first styles apply outside workspace only', async () => {
  const css = await read('styles.css');
  assert.match(css, /body:not\(\.workspace\) \.capture-actions\{/);
  assert.match(css, /body:not\(\.workspace\) \.note-list\{/);
  assert.match(css, /\.filter-disclosure>summary:focus-visible/);
  assert.match(css, /\.workspace \.capture-actions\{/);
});
