import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read = name => readFile(new URL(`../${name}`, import.meta.url),'utf8');
test('writing controls are present in both extension surfaces and use shared logic',async()=>{
 const [popup,sidepanel,controller,css]=await Promise.all(['popup.html','sidepanel.html','popup.js','styles.css'].map(read));
 for(const html of [popup,sidepanel]) for(const id of ['focus-toggle','sidebar-resize','recovery-banner','recovery-restore','recovery-discard']) {
  assert.ok(html.includes(`id="${id}"`), `${id} missing`);
 }
 assert.match(controller,/recoverOrReuseCopy\(notes, candidate/);
 assert.match(controller,/storageQueue\.whenIdle\(\)/);
 assert.match(css,/workspace:not\(\.focus-mode\) \.app\[data-view="editor"\] \.sidebar\{display:flex\}/);
 assert.match(css,/\.workspace\.focus-mode \.sidebar/);
});
