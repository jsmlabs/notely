import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
test('support motion is bounded and respects reduced motion', () => {
  const css = read('donation.css');
  assert.match(css, /support-reveal 160ms ease-out/);
  assert.match(css, /support-backdrop-reveal 160ms ease-out/);
  assert.match(css, /\.support-dialog\[open\],\.support-dialog\[open\]::backdrop\{animation:none!important\}/);
  assert.doesNotMatch(css, /animation[^;]*infinite/i);
  assert.doesNotMatch(css, /will-change\s*:/i);
});
test('support close handles buttons and Escape with reduced-motion fallback and focus restoration', () => {
  const js = read('popup.js');
  assert.match(js, /supportCloseAnimation/);
  assert.match(js, /duration:110, easing:'ease-in'/);
  assert.match(js, /supportDialog\.addEventListener\('cancel'/);
  assert.match(js, /reduceSupportMotion\(\) \|\| typeof supportDialog\.animate !== 'function'/);
  assert.match(js, /elements\['support-open'\]\.focus\(\)/);
});
