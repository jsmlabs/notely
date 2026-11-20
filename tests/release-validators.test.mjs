import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlResourceReferences } from '../scripts/release-validators.mjs';

test('accept local quoted and unquoted resource references', () => {
 assert.deepEqual(htmlResourceReferences(`<script src="popup.js"></script><link href='styles.css'><img src=icons/icon16.png>`), ['popup.js','styles.css','icons/icon16.png']);
});
test('reject remote resources even when single quoted or unquoted', () => {
 for (const snippet of [`<script src='https://evil.example/x.js'></script>`, `<link href=//evil.example/style.css>`, `<img src='data:image/svg+xml,abc'>`, `<script src=/absolute.js></script>`]) {
  assert.throws(() => htmlResourceReferences(snippet), /Non-local/);
 }
});
test('reject traversal in resource references', () => {
 for (const snippet of [`<script src='../escape.js'></script>`, `<link href='assets/../../outside.css'>`]) assert.throws(() => htmlResourceReferences(snippet), /Unsafe/);
});
