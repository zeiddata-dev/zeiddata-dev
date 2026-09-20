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
test('partial tiles preserve exact counts on one shared scale',()=>{
  const svg=render({total:43,categories:[{label:'A & B',count:43,color:'#506b65'}],repositories:[],checkedAt:'2026-09-20T00:00:00Z'});
  assert.match(svg,/1 TILE = 2 COMMITS/);
  assert.equal((svg.match(/height="13" fill="#506b65"/g)||[]).length,22);
  assert.match(svg,/width="4.75" height="13" fill="#506b65"/);
  assert.match(svg,/A &amp; B/);
});
test('empty history renders no fabricated activity',()=>{
  const svg=render({total:0,categories:[],repositories:[],checkedAt:'2026-09-20T00:00:00Z'});
  assert.match(svg,/0 PUBLIC COMMITS/);
  assert.doesNotMatch(svg,/height="13" fill="#506b65"/);
});
