import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const read = path => readFileSync(resolve(process.cwd(), path), 'utf8');
test('all surfaces load event-driven CSS after foundational styles', () => {
  for (const f of ['popup.html','sidepanel.html','panel.html']) {
    const html = read(f);
    assert.ok(html.includes('href="motion.css"'), f);
    assert.ok(html.indexOf('href="design-tokens.css"') < html.indexOf('href="styles.css"'));
    assert.ok(html.indexOf('href="styles.css"') < html.indexOf('href="motion.css"'));
  }
});
test('motion is finite, respects reduced motion and avoids persistent rendering layers', () => {
  const css=read('motion.css');
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /animation:\s*none\s*!important/);
  assert.match(css, /transition:\s*none\s*!important/);
  assert.doesNotMatch(css,/\binfinite\b\s*(?:;|,)/);
  assert.doesNotMatch(css,/\bwill-change\s*:/);
  assert.doesNotMatch(css,/\bbackdrop-filter\s*:/);
  assert.match(css, /\.title-input,\.body-input/);
  for(const name of ['notely-dialog-enter','notely-feedback-enter','notely-empty-enter']) assert.ok(css.includes(`@keyframes ${name}`));
});
test('shared motion tokens and package versions are consistent', () => {
  const tokens=read('design-tokens.css');
  for (const token of ['--motion-fast','--motion-standard','--motion-enter','--motion-ease']) assert.ok(tokens.includes(token));
  const manifest=JSON.parse(read('manifest.json'));
  const pkg=JSON.parse(read('package.json'));
  assert.equal(manifest.version,pkg.version);
  assert.match(pkg.version, /^\d+\.\d+\.\d+$/);
});

test('empty-state entrance only runs in the visible editor view', () => {
  const css = read('motion.css');
  assert.match(css, /@media \(max-width: 700px\)/);
  assert.match(css, /\.app\[data-view="editor"\] \.editor-empty/);
  assert.match(css, /\.workspace:not\(\.focus-mode\) \.editor-empty/);
});
