import test from 'node:test';
import assert from 'node:assert/strict';
import {parseMarkdown, inlineTokens, safeUrl, toggleTask, renderMarkdown} from '../markdown.mjs';
import {formatSelection} from '../editor-format.mjs';
import {normalizeNotes, updateNote} from '../core.mjs';

test('Markdown parser handles heading, list, code, checklist and plaintext consistently',()=>{
  const blocks=parseMarkdown('# Title\n- item\n1. first\n- [ ] todo\n- [x] done\n```\n<script>\n```\nRegular');
  assert.deepEqual(blocks.map(b=>b.type),['heading','bullet','number','task','task','codeblock','paragraph']);
  assert.deepEqual([blocks[3].line,blocks[3].checked,blocks[4].checked],[3,false,true]);
  assert.equal(blocks[5].text,'<script>');
});
test('Links accept http/https only, rejecting script and data schemes',()=>{
  assert.equal(safeUrl('javascript:alert(1)'),null);
  assert.equal(safeUrl('data:text/html,hi'),null);
  assert.equal(safeUrl('file:///etc/passwd'),null);
  assert.equal(safeUrl('https://example.com/test'),'https://example.com/test');
  assert.deepEqual(inlineTokens('[click](javascript:alert(1))'),[{type:'text',text:'[click](javascript:alert(1))'}]);
  assert.equal(inlineTokens('**bold** and `code`').filter(t=>t.type!=='text').length,2);
});
test('Checklist toggle preserves all non-target lines, and rejects arbitrary line',()=>{
  const original='# Title\n- [ ] one\n- [x] two\nordinary';
  const a=toggleTask(original,1);assert.equal(a,'# Title\n- [x] one\n- [x] two\nordinary');
  assert.equal(toggleTask(a,2),'# Title\n- [x] one\n- [ ] two\nordinary');
  assert.equal(toggleTask(original,3),original);
  assert.equal(toggleTask(original,50),original);
});
test('Formatting preserves selected text and returns focused cursor range',()=>{
  assert.deepEqual(formatSelection('hello',0,5,'bold'),{value:'**hello**',start:2,end:7});
  assert.deepEqual(formatSelection('hello',1,4,'italic'),{value:'h*ell*o',start:2,end:5});
  assert.deepEqual(formatSelection('hello',0,5,'link'),{value:'[hello](https://example.com)',start:1,end:6});
  assert.deepEqual(formatSelection('hello',0,0,'code'),{value:'`code`hello',start:1,end:5});
  assert.deepEqual(formatSelection('first\nsecond',0,12,'task'),{value:'- [ ] first\n- [ ] second',start:0,end:24});
  assert.equal(formatSelection('\nnext',0,0,'bullet').value,'- \nnext');
  assert.throws(()=>formatSelection('a',2,3,'bold'),RangeError);
  assert.throws(()=>formatSelection('a',0,1,'unknown'),TypeError);
});
test('Legacy notes remain byte-for-byte editable with Markdown body text and no extra fields',()=>{
  const old={id:'a',title:'Legacy',body:'<img src=x onerror=alert(1)>\n- [ ] task',createdAt:1,updatedAt:2,pinned:true};
  const normalized=normalizeNotes([old]);
  assert.equal(normalized[0].body,old.body);
  const next=updateNote(normalized,'a',{body:toggleTask(normalized[0].body,1)},3);
  assert.equal(next[0].body,'<img src=x onerror=alert(1)>\n- [x] task');
  assert.equal(next[0].pinned,true);
  assert.equal(next[0].createdAt,1);
});

test('Renderer uses only DOM creation/textContent - raw HTML never becomes elements',()=>{
  class Node {
    constructor(type){this.type=type;this.children=[];this.textContent='';this.attrs={};this.ownerDocument=doc;}
    append(...nodes){this.children.push(...nodes);}
    replaceChildren(...nodes){this.children=[...nodes];}
    setAttribute(k,v){this.attrs[k]=v;}
    addEventListener(event,fn){this.handler=fn;}
  }
  const doc={createElement:t=>new Node(t),createTextNode:text=>({type:'#text',text}),createDocumentFragment:()=>new Node('#fragment')};
  const root=new Node('root');
  let toggled=null;
  renderMarkdown(root,'<img src=x onerror=alert(1)>\n[bad](javascript:alert(1))\n[good](https://example.org)\n- [ ] check',line=>{toggled=line;});
  const all=[];function walk(n){all.push(n);for(const child of n.children||[])walk(child)}walk(root);
  assert.ok(!all.some(n=>n.type==='img'||n.type==='script'));
  assert.ok(all.some(n=>n.type==='a'&&n.href==='https://example.org/'));
  assert.ok(!all.some(n=>n.type==='a'&&n.href?.startsWith('javascript:')));
  const checkbox=all.find(n=>n.type==='checkbox');checkbox.handler();assert.equal(toggled,3);
});
