import test from 'node:test';
import assert from 'node:assert/strict';
import {preview, createNote, MAX_BODY_LENGTH} from '../core.mjs';

test('short previews preserve normalized whitespace and empty-state message', () => {
  assert.equal(preview({...createNote('a'), body:'  Hello\n\n  world  '}), 'Hello world');
  assert.equal(preview({...createNote('a'), body:' \n\t '}), 'No additional text');
});
test('list preview is bounded for the maximum-length note', () => {
  const note={...createNote('big'),body:'Leading text '+ 'x'.repeat(MAX_BODY_LENGTH-13)};
  const result=preview(note);
  assert.ok(result.length<=180, 'preview must remain bounded');
  assert.ok(result.startsWith('Leading text'));
  assert.ok(result.endsWith('…'));
});
test('full-body suffix does not change preview or require displaying entire note', () => {
  const a={...createNote('x'),body:'Intro '+ 'a'.repeat(500)+' tail A'};
  const b={...a,body:a.body.slice(0,500)+' other suffix'};
  assert.equal(preview(a),preview(b));
});
