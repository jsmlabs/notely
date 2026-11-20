import test from 'node:test';
import assert from 'node:assert/strict';
import { createNote, normalizeNotes, isValidTimestamp } from '../core.mjs';
import { createBackup, parseBackup } from '../backup.mjs';
import { safeSourceUrl } from '../coordinator.mjs';
import { validSourceUrl } from '../source-url.mjs';

const base = {...createNote('a',1700000000000), title:'Safe note'};

test('stored notes normalize out-of-range and noninteger dates into displayable timestamps', () => {
  for (const value of [1e100, 8640000000000001, -1, 1.25, NaN, Infinity, '2030']) {
    const [note] = normalizeNotes([{...base,createdAt:value,updatedAt:value}]);
    assert.ok(isValidTimestamp(note.createdAt), `createdAt: ${String(value)}`);
    assert.ok(isValidTimestamp(note.updatedAt), `updatedAt: ${String(value)}`);
    assert.doesNotThrow(() => new Intl.DateTimeFormat('en').format(new Date(note.updatedAt)));
  }
});

test('backup rejects impossible dates without silently modifying existing notes', () => {
  const archive = createBackup([base]);
  for (const value of [1e100, 8640000000000001, -1, 0.5]) {
    for (const field of ['createdAt','updatedAt']) {
      const broken = structuredClone(archive);
      broken.notes[0][field] = value;
      assert.throws(() => parseBackup(JSON.stringify(broken)), /invalid timestamps/);
    }
  }
  assert.equal(base.updatedAt,1700000000000);
});

test('source URLs use identical parsing rules in capture, stored notes and backups', () => {
  const invalid = ['https://', 'https:///','https://example.com:bad/path',
    'https://user:secret@example.com/', 'javascript:alert(1)', 'file:///etc/passwd',
    'https://example.com/'+'x'.repeat(4096)];
  for (const url of invalid) {
    assert.equal(validSourceUrl(url), false, url);
    assert.equal(safeSourceUrl(url), '',url);
    const [stored] = normalizeNotes([{...base, source:{title:'Source',url}}]);
    assert.equal(stored.source,undefined,url);
    const archive = createBackup([base]); archive.notes[0].source = {title:'Source',url};
    assert.throws(()=>parseBackup(JSON.stringify(archive)),/invalid source/, url);
  }
  const valid='https://example.com/path?q=1';
  assert.equal(validSourceUrl(valid),true);
  assert.equal(safeSourceUrl(valid),valid);
  const [stored] = normalizeNotes([{...base,source:{title:'Source',url:valid}}]);
  assert.equal(stored.source.url,valid);
  assert.equal(parseBackup(JSON.stringify(createBackup([stored])))[0].source.url,valid);
});
