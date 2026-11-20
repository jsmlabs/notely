import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('../popup.js', import.meta.url), 'utf8');
test('replace action passes captured preview baseline to coordinator', () => {
  assert.match(src, /expected:mode === 'replace' \? importPreviewBase : notes/);
  assert.match(src, /importPreviewIsCurrent\(importPreviewBase, notes\)/);
});
test('theme toggle updates accessible name alongside tooltip', () => {
  assert.match(src, /setAttribute\('aria-label', themeAction\)/);
});
