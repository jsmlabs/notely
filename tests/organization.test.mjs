import test from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEY, createNote, normalizeNotes, normalizeTags, updateNote, sortAndFilter, allTags, MAX_TAGS } from '../core.mjs';

test('v1.2 persisted notes load without losing content, timestamps or pins', () => {
  assert.equal(STORAGE_KEY, 'notely.notes.v1');
  const original = [{id:'legacy',title:'Meeting',body:'Do not lose this',pinned:true,createdAt:10,updatedAt:20}];
  const [migrated] = normalizeNotes(structuredClone(original));
  assert.deepEqual(migrated, {...original[0],favorite:false,tags:[]});
  assert.deepEqual(normalizeNotes(JSON.parse(JSON.stringify([migrated]))),[migrated]);
});

test('tags deduplicate case-insensitively, reject malformed values, and enforce caps',()=>{
  assert.deepEqual(normalizeTags([' Work ','work','Personal',12,null,'','  team  sync ']),['Work','Personal','team sync']);
  assert.equal(normalizeTags(Array.from({length:30},(_,i)=>`tag${i}`)).length,MAX_TAGS);
  assert.equal(normalizeTags(['a'.repeat(80)])[0].length,32);
});

test('tags can be added, renamed, removed and favorite toggles independently of pinned',()=>{
  const original = [createNote('one',50)];
  let next=updateNote(original,'one',{tags:['Work','Personal'],favorite:true},100);
  assert.deepEqual(next[0].tags,['Work','Personal']);
  assert.equal(next[0].favorite,true);
  assert.equal(next[0].pinned,false);
  next=updateNote(next,'one',{tags:['Work','Projects']},110);
  assert.deepEqual(next[0].tags,['Work','Projects']);
  next=updateNote(next,'one',{tags:['Projects'],favorite:false},120);
  assert.deepEqual(next[0].tags,['Projects']);
  assert.equal(next[0].favorite,false);
  assert.deepEqual(original[0].tags,[]);
});

test('repeated equivalent tag updates do not change timestamp',()=>{
  const initial=updateNote([createNote('a',1)],'a',{tags:['Research']},2);
  assert.equal(updateNote(initial,'a',{tags:['Research']},3)[0],initial[0]);
});

test('field-specific searching and tag/favorite filters combine with AND semantics',()=>{
  const notes=[
    {...createNote('a',10),title:'Launch',body:'review draft',tags:['Work'],favorite:true},
    {...createNote('b',20),title:'Review draft',body:'launch date',tags:['Personal'],favorite:true},
    {...createNote('c',30),title:'Launch',body:'notes',tags:['Work'],favorite:false},
  ];
  assert.deepEqual(sortAndFilter(notes,{query:'launch',field:'title',tag:'work',favoritesOnly:true}).map(n=>n.id),['a']);
  assert.deepEqual(sortAndFilter(notes,{query:'draft',field:'body'}).map(n=>n.id),['a']);
  assert.deepEqual(sortAndFilter(notes,{query:'work',field:'tags'}).map(n=>n.id),['c','a']);
  assert.deepEqual(sortAndFilter(notes,{query:'draft',field:'all'}).map(n=>n.id),['b','a']);
  assert.deepEqual(sortAndFilter(notes,{tag:'WORK'}).map(n=>n.id),['c','a']);
});

test('sorting orders by update, creation and title with pinned first and stable id ties',()=>{
  const notes=[
    {...createNote('a',10),title:'Zulu',updatedAt:100},
    {...createNote('b',20),title:'Alpha',updatedAt:30},
    {...createNote('c',5),title:'Bravo',updatedAt:3,pinned:true},
  ];
  assert.deepEqual(sortAndFilter(notes,{sort:'updated'}).map(n=>n.id),['c','a','b']);
  assert.deepEqual(sortAndFilter(notes,{sort:'created'}).map(n=>n.id),['c','b','a']);
  assert.deepEqual(sortAndFilter(notes,{sort:'alpha'}).map(n=>n.id),['c','b','a']);
  assert.deepEqual(notes.map(n=>n.id),['a','b','c']);
});

test('allTags returns unique case-insensitive sorted choices',()=>{
  const notes=[{tags:['work','Personal']},{tags:['Work','ideas']}];
  assert.deepEqual(allTags(notes),['ideas','Personal','work']);
});
