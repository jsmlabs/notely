import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = (path) => readFile(new URL(`../${path}`, import.meta.url));
test('manifest icons are actual square PNGs in declared sizes', async () => {
 const m = JSON.parse((await read('manifest.json')).toString());
 const pkg = JSON.parse((await read('package.json')).toString());
 assert.equal(m.version, pkg.version);
 for (const [size, path] of Object.entries(m.icons)) {
  const buf = await read(path);
  assert.equal(buf.toString('hex',0,8),'89504e470d0a1a0a');
  assert.equal(buf.readUInt32BE(16),Number(size));
  assert.equal(buf.readUInt32BE(20),Number(size));
 }
});
test('all three entrypoints reference the same brand mark', async () => {
 assert.match((await read('brand/mark.svg')).toString(), /viewBox="0 0 128 128"/);
 for (const file of ['popup.html','panel.html','sidepanel.html']) {
  const html=(await read(file)).toString();
  assert.match(html, /<img src="brand\/mark.svg" width="32" height="32" alt="" aria-hidden="true"/);
  assert.match(html, /class="brand-period"/);
 }
});
