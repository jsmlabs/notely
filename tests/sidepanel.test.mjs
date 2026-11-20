import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { openNotelySidePanel } from '../sidepanel.mjs';
const read = file => readFile(new URL(`../${file}`, import.meta.url), 'utf8');

test('side panel opens for active browser window with minimal API arguments', async () => {
  const calls=[];
  const api={
    tabs:{async query(query){calls.push(['query',query]);return [{id:42,windowId:7}]}},
    sidePanel:{async open(args){calls.push(['open',args]);}}
  };
  await openNotelySidePanel(api);
  assert.deepEqual(calls,[['query',{active:true,currentWindow:true}],['open',{windowId:7}]]);
});
test('side panel fails safely when Chrome API or active tab is unavailable', async () => {
  await assert.rejects(openNotelySidePanel({tabs:{query:async()=>[]}}),/unavailable/);
  await assert.rejects(openNotelySidePanel({sidePanel:{open:async()=>{}},tabs:{query:async()=>[]}}),/No active/);
  await assert.rejects(openNotelySidePanel({sidePanel:{open:async()=>{}},tabs:{query:async()=>[{id:-1}]}}),/No active/);
});
test('side panel propagates browser API rejection for visible UI error handling', async()=>{
  const api={tabs:{query:async()=>[{id:2,windowId:5}]},sidePanel:{open:async()=>{throw Error('Panel blocked')}}};
  await assert.rejects(openNotelySidePanel(api),/Panel blocked/);
});
test('sidepanel manifest, UI and controller share the popup implementation', async()=>{
  const [manifestString,popup,panel,controller,css] = await Promise.all([
    read('manifest.json'),read('popup.html'),read('sidepanel.html'),read('popup.js'),read('styles.css')
  ]);
  const manifest=JSON.parse(manifestString);
  assert.equal(manifest.version,JSON.parse(await read('package.json')).version);
  assert.equal(manifest.side_panel.default_path,'sidepanel.html');
  assert.ok(manifest.permissions.includes('sidePanel'));
  assert.equal(manifest.action.default_popup,'popup.html');
  assert.match(panel,/<body class="sidepanel"/);
  assert.match(panel,/<script type="module" src="popup.js"><\/script>/);
  assert.match(panel,/<link rel="stylesheet" href="styles.css"/);
  for(const id of ['sidepanel-open','workspace-open','note-list','body-input','title-input','list-save-status','retry-button']) {
    assert.ok(popup.includes(`id="${id}"`),`popup missing ${id}`);
    assert.ok(panel.includes(`id="${id}"`),`sidepanel missing ${id}`);
  }
  assert.match(controller,/openNotelySidePanel\(chrome\)/);
  assert.match(css,/\.sidepanel \.app\[data-view="editor"\] \.sidebar\{display:none\}/);
  assert.match(css,/\.sidepanel \.back-button\{display:grid\}/);
});
