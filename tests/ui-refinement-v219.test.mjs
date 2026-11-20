import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read = f => readFile(new URL(`../${f}`, import.meta.url),'utf8');
test('manifest and package versions stay aligned',async()=>{
  const manifest=JSON.parse(await read('manifest.json'));
  const pkg=JSON.parse(await read('package.json'));
  assert.match(manifest.version,/^\d+\.\d+\.\d+$/);
  assert.equal(manifest.version,pkg.version);
});
test('v2.0.19 preserves existing notes and donation DOM targets across actual entry pages',async()=>{
  for (const page of ['popup.html','sidepanel.html']) {
    const html=await read(page);
    for (const id of ['id="note-list"','id="body-input"','id="support-dialog"','id="support-copy"'])
      assert.ok(html.includes(id),`${page} missing ${id}`);
  }
});
