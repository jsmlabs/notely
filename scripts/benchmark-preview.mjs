import { performance } from 'node:perf_hooks';
import {pathToFileURL} from 'node:url';
import {fileURLToPath} from 'node:url';
const src=process.argv[2] || fileURLToPath(new URL('..', import.meta.url));
const {sortAndFilter,preview}=await import(pathToFileURL(src+'/core.mjs').href);
const count=1000;
const seed='k'.repeat(12000)+'ALPHA'+'z'.repeat(8000);
const notes=Array.from({length:count},(_,i)=>({id:'id'+i,title:'Note '+i,body: seed+i,tags:['work','items'],pinned:i%31===0,favorite:i%2===0,createdAt:i,updatedAt:i}));
const workloads=[['search-all-match',()=>sortAndFilter(notes,{query:'alpha',field:'all'})],['search-all-miss',()=>sortAndFilter(notes,{query:'nomatch',field:'all'})],['list-previews',()=>notes.map(preview)]];
for(const [name,fn] of workloads){for(let i=0;i<3;i++)fn(); const rounds=20;const samples=[];for(let i=0;i<rounds;i++){const t=performance.now();const result=fn();samples.push(performance.now()-t);} samples.sort((a,b)=>a-b);console.log(name,JSON.stringify({medianMs:+samples[10].toFixed(3),p95Ms:+samples[18].toFixed(3),heapMB:+(process.memoryUsage().heapUsed/1048576).toFixed(2)}));}
