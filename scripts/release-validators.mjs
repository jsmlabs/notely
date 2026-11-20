import assert from 'node:assert/strict';

// Validate literal resource references in extension-owned HTML, including single-quoted attributes.
// Fail closed on dynamic or external script/stylesheet/image references.
export function htmlResourceReferences(html) {
  const references = [];
  for (const match of html.matchAll(/<(script|link|img)\b([^>]*?)>/gi)) {
    const tag = match[1].toLowerCase();
    const attrs = match[2];
    const attr = /(?:^|\s)(src|href)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
    for (const found of attrs.matchAll(attr)) {
      const key = found[1].toLowerCase();
      if ((tag === 'link' && key !== 'href') || (tag !== 'link' && key !== 'src')) continue;
      const value = found[2] ?? found[3] ?? found[4];
      assert.ok(value && !/[<>]/.test(value), `Invalid ${tag} resource`);
      assert.ok(!/^(?:[a-z][a-z0-9+.-]*:|\/\/|\/)/i.test(value), `Non-local ${tag} resource: ${value}`);
      assert.ok(!value.includes('\\') && !value.includes('..'), `Unsafe ${tag} resource: ${value}`);
      if (value.startsWith('#')) continue;
      references.push(value.split(/[?#]/, 1)[0]);
    }
  }
  return references;
}
