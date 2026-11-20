import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = file => readFile(new URL(`../${file}`, import.meta.url), 'utf8');

test('P1 layout keeps a single-view side panel and the 700/701 workspace boundary', async () => {
  const css = await read('styles.css');
  assert.match(css, /\.sidepanel \.app\[data-view="list"\] \.editor-area\{display:none\}/);
  assert.match(css, /\.sidepanel \.app\[data-view="editor"\] \.sidebar\{display:none\}/);
  assert.match(css, /@media\(max-width:700px\)/);
  assert.match(css, /@media\(min-width:701px\)/);
  assert.match(css, /\.workspace \.app\{display:block;grid-template-columns:none\}/);
});
test('P1 list rendering retains scroll during edits, resets when search changes', async () => {
  const js = await read('popup.js');
  assert.match(js,/const previousScroll = container\.scrollTop/);
  assert.match(js,/container\.scrollTop = resetScroll \? 0 : previousScroll/);
  assert.match(js,/search\.addEventListener\('input',\(\)=>renderList\(\{resetScroll:true\}\)\)/);
});
test('P1 focus mode requires an active note and restores keyboard context', async () => {
  const js = await read('popup.js');
  assert.match(js,/if \(enabled && \(!isWorkspace \|\| !activeId\)\) return/);
  assert.match(js,/focusBeforeMode = document\.activeElement/);
  assert.match(js,/elements\['body-input'\]\.focus\(\)/);
  assert.match(js,/elements\['focus-toggle'\]\.disabled = !note/);
});
test('P1 resizer exposes effective bounds and releases capture on drag completion', async () => {
  const js = await read('popup.js');
  assert.match(js,/setAttribute\('aria-valuemax', String\(Math\.max/);
  assert.match(js,/releasePointerCapture\(event\.pointerId\)/);
});
test('P1 narrow screen controls and dialogs stay viewport safe', async () => {
  const css = await read('styles.css');
  assert.match(css, /\.sidepanel \.editor-content\{padding-inline:12px\}/);
  assert.match(css, /@media\(max-height:450px\)/);
  assert.match(css, /\.backup-dialog\{max-height:calc\(100dvh - 16px\)\}/);
  assert.match(css, /\.sidebar-footer\{flex-wrap:wrap;row-gap:5px\}/);
});
