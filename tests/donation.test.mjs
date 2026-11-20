import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {resolve} from 'node:path';
const read=(p)=>readFileSync(resolve(process.cwd(),p),'utf8');
const address='7CPrqUu3ioFtdiPrx7APLvpf6if2P4ZZiLKPrJAUyKu3';
test('both actual extension views contain a voluntary USDC Solana donation dialog',()=>{
 for (const f of ['popup.html','sidepanel.html']) {
  const s=read(f);
  for(const id of ['support-dialog','support-open','support-close','support-address','support-copy','support-done','support-copy-result']) assert.ok(s.includes(`id="${id}"`),`${f}: ${id}`);
  assert.ok(s.includes('href="donation.css"'));
  assert.ok(s.includes('src="donations/usdc-solana-qr.png"'));
  assert.ok(s.includes(`>${address}</textarea>`));
  assert.match(s,/Send only <strong>USDC via the Solana network<\/strong>/);
  assert.match(s,/entirely optional donation/);
  assert.match(s,/Binance deposit address/);
 }
});
test('donation interaction is local and copy failures are recoverable',()=>{
 const s=read('popup.js');
 assert.match(s,/navigator\.clipboard\?\.writeText/);
 assert.match(s,/support-address'\]\.select\(\)/);
 assert.match(s,/supportDialog\.close\(\)/);
 assert.match(s,/support-dialog'\]\.open/);
 assert.doesNotMatch(s,/https?:\/\/[^'" ]*donat/i);
});
test('assets are included and permissions unchanged',()=>{
 assert.ok(readFileSync(resolve(process.cwd(),'donations/usdc-solana-qr.png')).length>300);
 const manifest=JSON.parse(read('manifest.json'));
 assert.deepEqual(manifest.permissions,['storage','contextMenus','sidePanel']);
 assert.equal(manifest.version,JSON.parse(read('package.json')).version);
});
