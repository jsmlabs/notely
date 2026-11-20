import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read = async (p) => readFile(new URL(`../${p}`, import.meta.url));
function pngDims(buf){assert.equal(buf.subarray(0,8).toString('hex'),'89504e470d0a1a0a');return [buf.readUInt32BE(16),buf.readUInt32BE(20)];}
test('brand icon exports are real PNGs in canonical dimensions',async()=>{for(const s of [16,32,48,128,256,512,1024])assert.deepEqual(pngDims(await read(`brand/mark-${s}.png`)),[s,s]);});
test('store art has required dimensions and is not mislabeled as screenshots',async()=>{for(const [f,w,h] of [['store-icon-128.png',128,128],['small-promotional-tile-440x280.png',440,280],['marquee-promotional-tile-1400x560.png',1400,560]])assert.deepEqual(pngDims(await read(`store-assets/${f}`)),[w,h]);assert.match((await read('store-assets/STORE-LISTING.md')).toString(),/Do \*\*not\*\* use promotional illustrations as screenshots/);});
test('all production views share the same icon and brand tokens',async()=>{for(const f of ['popup.html','sidepanel.html','panel.html']){const s=(await read(f)).toString();assert.match(s,/design-tokens.css/);assert.match(s,/brand\/mark.svg/);}const css=(await read('styles.css')).toString();assert.match(css,/v2\.0\.8: cross-surface finishing/);const manifest=JSON.parse((await read('manifest.json')).toString());const pkg=JSON.parse((await read('package.json')).toString());assert.match(manifest.version,/^\d+\.\d+\.\d+$/);assert.equal(manifest.version,pkg.version);});

test('desktop workspace grid contains sidebar, resize handle and editor tracks', async()=>{const css=(await read('styles.css')).toString();assert.match(css,/grid-template-columns:var\(--sidebar-width,320px\) 6px minmax\(0,1fr\)/);assert.doesNotMatch(css,/grid-template-columns:var\(--sidebar-width,320px\) 5px/);});
