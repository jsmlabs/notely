import test from 'node:test';
import assert from 'node:assert/strict';
import {createNote, updateNote, normalizeNotes, sortAndFilter, displayTitle, wordCount, MAX_NOTES} from '../core.mjs';

test('create and update notes without mutating previous state',()=>{
 const first=createNote('abc',100);
 const list=[first,createNote('def',200)];
 const updated=updateNote(list,'abc',{title:'Work',body:'Plan',pinned:true},300);
 assert.deepEqual(updated[0],{...first,title:'Work',body:'Plan',pinned:true,updatedAt:300});
 assert.equal(list[0].title,'');assert.equal(updated[1],list[1]);
});
test('noop updates preserve timestamp',()=>{
 const notes=[createNote('a',20)];
 assert.equal(updateNote(notes,'a',{title:''},30)[0],notes[0]);
});
test('sort pinned first, then updated; search title and body case-insensitively',()=>{
 const notes=[{...createNote('a',10),title:'Alpha'}, {...createNote('b',20),title:'beta',pinned:true}, {...createNote('c',30),body:'aLpHa idea'}];
 assert.deepEqual(sortAndFilter(notes).map(n=>n.id),['b','c','a']);
 assert.deepEqual(sortAndFilter(notes,'ALPHA').map(n=>n.id),['c','a']);
});
test('invalid stored entries are dropped, duplicates removed, malformed fields normalized',()=>{
 const notes=normalizeNotes([null,{}, {id:'a',title:123,body:'Text',pinned:'yes',createdAt:'bad'}, {id:'a',title:'second'}]);
 assert.equal(notes.length,1);assert.equal(notes[0].title,'');assert.equal(notes[0].body,'Text');assert.equal(notes[0].pinned,false);
 assert.equal(Number.isFinite(notes[0].createdAt),true);
});
test('storage note ceiling is bounded',()=>{
 const notes=normalizeNotes(Array.from({length:MAX_NOTES+2},(_,i)=>({id:String(i)})));
 assert.equal(notes.length,MAX_NOTES);
});
test('note title fallback and word count',()=>{
 assert.equal(displayTitle({...createNote('x'),body:'  first line\nsecond line'}),'first line');
 assert.equal(wordCount('  one  two\nthree '),3);assert.equal(wordCount('  '),0);
});
