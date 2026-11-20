import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read = name => readFile(new URL(`../${name}`, import.meta.url), 'utf8');
test('real full-tab workspace contains exactly three sequential grid children', async () => {
  const html=await read('popup.html');
  const js=await read('popup.js');
  assert.match(js,/popup\.html\?workspace=1/);
  assert.match(js,/document\.body\.classList\.add\('workspace'\)/);
  assert.ok(html.indexOf('class="sidebar"') < html.indexOf('class="sidebar-resize"'));
  assert.ok(html.indexOf('class="sidebar-resize"') < html.indexOf('class="editor-area"'));
});
test('the last desktop workspace grid override reserves a real resize track',async()=>{
  const css=await read('styles.css');
  const desktop=[...css.matchAll(/@media\(min-width:701px\)\{\.workspace[^\n]*grid-template-columns:([^}]+)\}\}/g)];
  assert.ok(desktop.length);
  assert.match(desktop.at(-1)[1],/var\(--sidebar-width,320px\) 6px minmax\(0,1fr\)/);
  assert.match(css,/\.workspace\.focus-mode \.app\{grid-template-columns:minmax\(0,1fr\)\}/);
  assert.match(css,/@media\(max-width:700px\)\{\.workspace \.app\{display:block/);
});
