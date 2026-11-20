import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = file => readFile(new URL(`../${file}`, import.meta.url), 'utf8');

test('semantic typography and spacing tokens are centrally declared', async () => {
  const tokens = await read('design-tokens.css');
  for (const key of ['--text-xs','--text-sm','--text-base','--text-editor','--leading-reading','--component-gap','--weight-semibold']) {
    assert.ok(tokens.includes(`${key}:`), `${key} is missing`);
  }
});

test('shared note, editor, toolbar and dialog styles consume semantic tokens', async () => {
  const css = await read('styles.css');
  for (const key of ['var(--text-base)','var(--text-editor)','var(--component-gap)','var(--radius-md)','var(--control-md)']) {
    assert.ok(css.includes(key), `Expected shared token ${key}`);
  }
  assert.match(css, /\.workspace:not\(\.focus-mode\) \.app\{display:grid;width:100%/);
  assert.match(css, /@media\(max-width:700px\)\{\.workspace \.app\{display:block/);
});

test('popup, side panel and full workspace use same token stylesheet before component CSS', async () => {
  for (const file of ['popup.html','sidepanel.html']) {
    const html = await read(file);
    assert.ok(html.indexOf('design-tokens.css') >= 0 && html.indexOf('design-tokens.css') < html.indexOf('styles.css'));
  }
  const script = await read('popup.js');
  assert.match(script, /location\.search\)\.get\('workspace'\)/);
});
