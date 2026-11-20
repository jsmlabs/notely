import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const load = (name) => readFile(new URL(`../${name}`, import.meta.url), 'utf8');
const roles = ['bg','surface','surface-hover','border','text','muted','faint','accent','accent-text','danger','shadow','field','selected','divider'];
const parseVars = (block) => new Map([...block.matchAll(/(--[a-z-]+):\s*([^;{}]+)/g)].map(([,key,value]) => [key,value.trim()]));
const getRule = (css, theme) => {
  const rules = [...css.matchAll(new RegExp(`body\\[data-theme="${theme}"\\]\\s*\\{([^{}]+)\\}`, 'g'))];
  assert.ok(rules.length, `${theme} theme exists`);
  return parseVars(rules.at(-1)[1]);
};

test('three entrypoints load shared tokens ahead of application styles', async () => {
  for (const name of ['popup.html','sidepanel.html','panel.html']) {
    const html = await load(name);
    const tokens = html.indexOf('href="design-tokens.css"');
    const styles = html.indexOf('href="styles.css"');
    assert.ok(tokens !== -1 && styles > tokens, `${name} token cascade order`);
  }
});

test('active semantic colors resolve to defined primitive tokens for both themes', async () => {
  const [tokens, styles] = await Promise.all([load('design-tokens.css'),load('styles.css')]);
  for (const theme of ['dark','light']) {
    const primitives = getRule(tokens, theme);
    const aliases = getRule(styles, theme);
    for (const role of roles) {
      const token = `--color-${role}`;
      assert.match(primitives.get(token) ?? '', /^(#[0-9a-f]{3,8}|rgba\([^)]+\))$/i, `${theme} ${token}`);
      assert.equal(aliases.get(`--${role}`), `var(${token})`, `${theme} ${role} linked`);
    }
  }
});

test('foundation spacing and motion scales are positive and strictly increasing', async () => {
  const css = await load('design-tokens.css');
  for (const prefix of ['space']) {
    const matches = [...css.matchAll(new RegExp(`--${prefix}-(\\d+):\\s*(\\d+)px`, 'g'))];
    assert.ok(matches.length >= 4);
    const ordered = matches.map(([,index,val]) => [Number(index),Number(val)]).sort((a,b)=>a[0]-b[0]);
    for (let i=1;i<ordered.length;i++) assert.ok(ordered[i][1]>ordered[i-1][1], `${prefix} must increase`);
  }
  for (const radius of ['sm','md','lg','xl']) assert.match(css, new RegExp(`--radius-${radius}:\\s*\\d+px`));
  assert.match(css, /--duration-fast:\s*120ms/);
  assert.match(css, /--duration-normal:\s*150ms/);
});
