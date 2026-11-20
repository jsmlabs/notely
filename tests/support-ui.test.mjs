import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = name => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
const wallet = '7CPrqUu3ioFtdiPrx7APLvpf6if2P4ZZiLKPrJAUyKu3';

test('compact support UI displays one selectable receiving address in both extension entry points', () => {
  for (const file of ['popup.html', 'sidepanel.html']) {
    const html = read(file);
    assert.equal(html.split(wallet).length - 1, 1, `${file}: exactly one visible address`);
    assert.match(html, /<textarea id="support-address"[^>]+readonly[^>]*>/);
    assert.doesNotMatch(html, /support-address-full/);
    assert.match(html, /id="support-copy"/);
    assert.match(html, /id="support-done"/);
    assert.match(html, /donations\/usdc-solana-qr.png/);
    assert.match(html, /entirely optional donation/);
    assert.match(html, /USDC via the Solana network/);
  }
});
test('support modal is constrained to viewport and does not introduce animations or network requests', () => {
  const css = read('donation.css');
  assert.match(css, /max-height:calc\(100dvh - 20px\)/);
  assert.match(css, /overflow-y:auto/);
  assert.match(css, /overscroll-behavior:contain/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.doesNotMatch(css, /url\(https?:|@import|animation:\s*[^;]*infinite/);
});
