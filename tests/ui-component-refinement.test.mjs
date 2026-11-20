import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = name => readFile(new URL(`../${name}`, import.meta.url), 'utf8');

test('legacy palette rules are removed and token aliases remain for each theme', async () => {
  const css = await read('styles.css');
  for (const theme of ['dark','light']) {
    const rules = [...css.matchAll(new RegExp(`body\\[data-theme="${theme}"\\]\\s*\\{([^{}]+)\\}`, 'g'))];
    assert.equal(rules.length, 1, `${theme} must have one palette alias declaration`);
    assert.match(rules[0][1], /--bg:var\(--color-bg\)/);
    assert.doesNotMatch(rules[0][1], /--bg:#[a-f0-9]+/i);
  }
});

test('component states use shared tokens and include disabled, focus, selected', async () => {
  const css = await read('styles.css');
  assert.match(css, /transition:background-color var\(--duration-normal\)/);
  assert.match(css, /\.note-card\.active:hover\s*\{background:var\(--selected\)/);
  assert.match(css, /\.writing-toolbar button\[aria-pressed="true"\]/);
  assert.match(css, /\.backup-primary[^}]*:disabled/);
  assert.match(css, /\.filter-disclosure>summary[^}]*:focus-visible/);
});

test('shared component stylesheet and token file load identically in all entrypoints', async () => {
  for (const name of ['popup.html','sidepanel.html','panel.html']) {
    const html = await read(name);
    assert.ok(html.indexOf('href="design-tokens.css"') < html.indexOf('href="styles.css"'));
    assert.ok(html.includes('href="styles.css"'));
  }
});
