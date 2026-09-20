import test from 'node:test';
import assert from 'node:assert/strict';
import {classify,render} from './data-loom.mjs';

test('work areas honor specific topics before generic languages',()=>{
  assert.equal(classify({name:'research',topics:['python','security-research']}),'research');
  assert.equal(classify({name:'reports',topics:['html','reporting']}),'publishing');
  assert.equal(classify({name:'site',topics:['javascript','static-site']}),'design');
  assert.equal(classify({name:'tool',topics:['developer-tools']}),'apps');
  assert.equal(classify({name:'new-unknown',topics:[]}),'other');
});
test('one shared fabric preserves exact category counts in partial cells',()=>{
  const svg=render({total:643,categories:[{id:'a',label:'A & B',count:641,color:'#506b65'},{id:'b',label:'B',count:2,color:'#738779'}],repositories:[],checkedAt:'2026-09-20T00:00:00Z'});
  assert.match(svg,/1 CELL = 2 COMMITS/);
  const counts={};
  for(const m of svg.matchAll(/data-commits="(\d+)" data-category="([^"]+)"/g)) counts[m[2]]=(counts[m[2]]||0)+Number(m[1]);
  assert.deepEqual(counts,{a:641,b:2});
  assert.equal((svg.match(/id="central-loom"/g)||[]).length,1);
  assert.equal((svg.match(/id="woven-block"/g)||[]).length,1);
  assert.match(svg,/A &amp; B/);
});
test('empty history renders no fabricated activity',()=>{
  const svg=render({total:0,categories:[],repositories:[],checkedAt:'2026-09-20T00:00:00Z'});
  assert.match(svg,/0 PUBLIC COMMITS/);
  assert.doesNotMatch(svg,/data-commits=/);
});
