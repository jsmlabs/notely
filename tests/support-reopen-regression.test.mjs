import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source = readFileSync(new URL('../popup.js', import.meta.url), 'utf8');
test('completed support close animation is cancelled before native close', () => {
  const fn = source.slice(source.indexOf('const closeSupportDialog ='), source.indexOf("elements['support-open'].addEventListener"));
  assert.match(fn, /try \{ animation\.cancel\(\); \} catch/);
  assert.match(fn, /supportCloseAnimation = null;\s*if \(supportDialog\.open\) supportDialog\.close\(\)/);
});
