import test from 'node:test';
import assert from 'node:assert/strict';

const events = {};
const state = new Map();
const sleepTick=()=>new Promise(resolve=>setImmediate(resolve));
function emitter(name) {return {addListener(fn) {events[name]=fn}};}
const original=globalThis.chrome;
globalThis.chrome={
  runtime:{id:'notely-test',onMessage:emitter('message'),onInstalled:emitter('installed'),lastError:null},
  storage:{local:{
    async get(keys){const names=Array.isArray(keys)?keys:[keys];return Object.fromEntries(names.filter(k=>state.has(k)).map(k=>[k,structuredClone(state.get(k))]))},
    async set(values){for(const [key,value] of Object.entries(values))state.set(key,structuredClone(value))}
  }},
  contextMenus:{removeAll(cb){cb()},create(config,cb){events.menu=config;cb?.()},onClicked:emitter('capture')},
  commands:{onCommand:emitter('command')},
  action:{async setBadgeText(){},async setBadgeBackgroundColor(){}}
};
await import('../background.js');
async function message(type,payload={}) {
  return new Promise((resolve,reject)=>{
    const asyncResponse=events.message({type,...payload},{id:'notely-test'},resolve);
    if(!asyncResponse)reject(Error('Listener did not respond'));
  });
}

test('onInstalled registers selection-only context menu',()=>{
  events.installed();
  assert.equal(events.menu.id,'notely-save-selection');
  assert.deepEqual(events.menu.contexts,['selection']);
});
test('worker messaging writes and reads legacy storage key',async()=>{
  const read=await message('NOTES_GET');assert.equal(read.ok,true);
  const created={id:'manual',title:'Manual',body:'text',pinned:false,favorite:false,tags:[],createdAt:1,updatedAt:1};
  const written=await message('NOTES_EDIT',{base:[],notes:[created]});
  assert.equal(written.ok,true);
  assert.deepEqual(state.get('notely.notes.v1'),[created]);
  const rejected=events.message({type:'NOTES_GET'},{id:'foreign'},()=>{});
  assert.equal(rejected,false);
});
test('capture context event adds note while preserving existing note',async()=>{
  events.capture({menuItemId:'notely-save-selection',selectionText:'Selected <b>content</b>',pageUrl:'https://example.org/p'}, {title:'Page'});
  await sleepTick();await sleepTick();await sleepTick();
  const current=await message('NOTES_GET');
  assert.equal(current.ok,true);
  assert.equal(current.data.length,2);
  assert.equal(current.data[0].body,'Selected <b>content</b>');
  assert.deepEqual(current.data[0].source,{title:'Page',url:'https://example.org/p'});
  assert.equal(current.data[1].id,'manual');
});
test('shortcut event creates separate blank note without replacing prior notes',async()=>{
  events.command('quick-note');
  await sleepTick();await sleepTick();await sleepTick();
  const current=await message('NOTES_GET');
  assert.equal(current.ok,true);
  assert.equal(current.data.length,3);
  assert.equal(current.data[0].body,'');
});
test('invalid message cannot write and unknown message does not trigger reply',()=>{
  assert.equal(events.message({type:'OTHER'},{id:'notely-test'},()=>{}),false);
  globalThis.chrome=original;
});
