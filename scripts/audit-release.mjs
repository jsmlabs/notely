import { htmlResourceReferences } from './release-validators.mjs';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const read = async name => readFile(path.join(root, name));
const file = async name => {assert.ok(!name.startsWith('/')&&!name.includes('..'),`Unsafe path ${name}`);const p=path.join(root,name);assert.ok((await stat(p)).isFile(),`Missing file: ${name}`);return p};
const manifest=JSON.parse((await read('manifest.json')).toString());
const pkg=JSON.parse((await read('package.json')).toString());
assert.equal(manifest.version,pkg.version,'Manifest/package version mismatch');
assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
assert.equal(manifest.manifest_version,3);
assert.deepEqual([...manifest.permissions].sort(), ['storage','contextMenus','sidePanel'].sort());
assert.ok(!('host_permissions' in manifest));
assert.ok(!('content_scripts' in manifest));
assert.ok(!('externally_connectable' in manifest));
const paths=[manifest.action.default_popup,manifest.background.service_worker,manifest.side_panel.default_path,...Object.values(manifest.icons)];
for(const entry of Object.values(manifest.commands||{})){assert.equal(typeof entry.description,'string')}
for(const p of paths) await file(p);
let refs=0;
for(const page of ['popup.html','panel.html','sidepanel.html']){
 const html=(await read(page)).toString();
 for(const link of htmlResourceReferences(html)) { await file(link); refs++; }
}
const png=[...Object.entries(manifest.icons).map(([size,p])=>[p,Number(size),Number(size)]), ['store-assets/store-icon-128.png',128,128],['store-assets/small-promotional-tile-440x280.png',440,280],['store-assets/marquee-promotional-tile-1400x560.png',1400,560]];
for(const [name,w,h] of png){const b=await read(name);assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a',`${name} PNG signature`);assert.equal(b.readUInt32BE(16),w,`${name} width`);assert.equal(b.readUInt32BE(20),h,`${name} height`)}
for(const name of ['store-assets/STORE-LISTING.md','store-assets/PRIVACY-AND-PERMISSIONS-DRAFT.md','RELEASE-VALIDATION-V2.1.1.md']) await file(name);
const listing=(await read('store-assets/STORE-LISTING.md')).toString();
assert.ok(listing.includes('authentic screenshots'));
const privacy=(await read('store-assets/PRIVACY-AND-PERMISSIONS-DRAFT.md')).toString();
for(const perm of manifest.permissions) assert.ok(privacy.includes('`'+perm+'`'),`${perm} disclosure missing`);
console.log(`Release audit passed: manifest=${manifest.version}, ${paths.length} manifest resources, ${refs} HTML resources, ${png.length} PNG assets, 3 release documents`);
