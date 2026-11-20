import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = name => readFile(new URL(`../${name}`, import.meta.url), 'utf8');
test('shared theme tokens and redesigned surfaces cover all three UI modes', async () => {
  const [css, popup, sidepanel] = await Promise.all([read('styles.css'), read('popup.html'), read('sidepanel.html')]);
  assert.match(css, /v2\.0 - cohesive Notely interface system/);
  for (const mode of ['dark', 'light']) assert.ok(css.includes(`body[data-theme="${mode}"]{--bg:`));
  for (const selector of ['.workspace .editor-content', '.sidepanel .editor-content', 'body:not(.workspace) .capture-actions']) assert.ok(css.includes(selector));
  for (const html of [popup, sidepanel]) {
    assert.match(html, /class="editor-empty"/);
    assert.match(html, /id="note-list"/);
  }
});
test('workspace empty state differentiates empty library from unselected existing notes', async () => {
  const js = await read('popup.js');
  assert.match(js, /const hasNotes = notes\.length > 0/);
  assert.match(js, /Select a note to begin\./);
  assert.match(js, /Choose a note from the sidebar/);
});
