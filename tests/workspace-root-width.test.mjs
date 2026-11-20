import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('full workspace overrides popup width on the document root without changing the popup limit', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(css, /html,body,\.app\{width:min\(400px,100vw\);min-width:300px;max-width:400px\}/);
  assert.match(css, /html:has\(body\.workspace\)\{width:100%;min-width:320px;max-width:none;height:100dvh;overflow:hidden\}/);
  assert.match(css, /html:has\(body\.sidepanel\),body\.sidepanel\{width:100%;min-width:0;max-width:none/);
  assert.match(css, /\.workspace \.app\{grid-template-columns:var\(--sidebar-width,340px\) 6px minmax\(0,1fr\)\}/);
});
