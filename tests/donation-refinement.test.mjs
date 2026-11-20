import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = name => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
const address = '7CPrqUu3ioFtdiPrx7APLvpf6if2P4ZZiLKPrJAUyKu3';

function donationHarness(writeText) {
  const handlers = {};
  const el = Object.fromEntries(['support-open','support-dialog','support-copy','support-address','support-copy-result','support-close','support-done'].map(id => [id, {
    textContent: '', value: id === 'support-address' ? address : '', open: false,
    disabled: false, focused: false, selected: false,
    addEventListener(type, fn) { handlers[`${id}:${type}`] = fn; },
    focus() {this.focused=true;}, select() {this.selected=true;},
    showModal() {this.open=true;}, close() {this.open=false;handlers['support-dialog:close']();},
  }]));
  const source=read('popup.js');
  const start=source.indexOf('  // One-shot support dialog motion.');
  const end=source.indexOf("  elements['backup-open'].addEventListener",start);
  assert.ok(start>=0 && end>start);
  // Run the actual extracted event handler source with only its two dependencies.
  new Function('elements','navigator','window',source.slice(start,end))(el,{clipboard:{writeText}},{matchMedia:() => ({matches:false})});
  return {el,fire:(id,type='click')=>handlers[`${id}:${type}`]()};
}

test('full receiving address is present in both views, without truncating its readable copy',()=>{
 for (const file of ['popup.html','sidepanel.html']) {
  const markup=read(file);
  assert.ok(markup.includes(`<textarea id="support-address" rows="2" readonly spellcheck="false" aria-label="USDC receiving address on Solana">${address}</textarea>`));
  assert.equal(markup.split(address).length-1,1,`single visible address in ${file}`);
 }
 assert.match(read('donation.css'),/overflow-wrap:anywhere/);
 assert.doesNotMatch(read('donation.css'),/support-address-full/);
});

test('clipboard completion after closing and reopening must not change new session',async()=>{
 let complete;
 const task=new Promise(resolve=>{complete=resolve;});
 const {el,fire}=donationHarness(()=>task);
 fire('support-open');
 const pending=fire('support-copy');
 assert.equal(el['support-copy'].disabled,true);
 fire('support-close');
 fire('support-open');
 complete(); await pending;
 assert.equal(el['support-copy-result'].textContent,'');
 assert.equal(el['support-copy'].textContent,'Copy');
 assert.equal(el['support-copy'].disabled,false);
});

test('copy success and clipboard failure provide accurate feedback',async()=>{
 const good=donationHarness(async value=>assert.equal(value,address));
 good.fire('support-open'); await good.fire('support-copy');
 assert.equal(good.el['support-copy'].textContent,'Copied');
 assert.equal(good.el['support-copy'].disabled,false);
 const bad=donationHarness(async()=>{throw new Error('no permission');});
 bad.fire('support-open'); await bad.fire('support-copy');
 assert.equal(bad.el['support-address'].selected,true);
 assert.match(bad.el['support-copy-result'].textContent,/manually/);
 assert.equal(bad.el['support-copy'].disabled,false);
});
