import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = file => readFile(new URL(`../${file}`, import.meta.url), 'utf8');
test('full workspace is opened as an internal extension tab without new permissions', async () => {
  const [html, js, manifest] = await Promise.all([read('popup.html'),read('popup.js'),read('manifest.json')]);
  assert.match(html,/id="workspace-open"/);
  assert.match(js,/chrome\.tabs\.create\(\{url:chrome\.runtime\.getURL\('popup\.html\?workspace=1'\)\}\)/);
  assert.equal(JSON.parse(manifest).action.default_popup,'popup.html');
  assert.deepEqual(JSON.parse(manifest).permissions,['storage','contextMenus','sidePanel']);
});
test('workspace retains shared app and responsive list/editor views', async () => {
  const [js, css] = await Promise.all([read('popup.js'), read('styles.css')]);
  assert.match(js,/document\.body\.classList\.add\('workspace'\)/);
  assert.match(css,/\.workspace \.app\{display:grid/);
  assert.match(css,/@media\(max-width:700px\)/);
  assert.match(css,/\.workspace \.app\[data-view="editor"\] \.sidebar\{display:none\}/);
});
