import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const data=JSON.parse(await fs.readFile(new URL('../public/research.json',import.meta.url),'utf8'));
const people=data.members.concat(data.cands||[]);
test('every ethics item that is shown on the Overview has a valid status tag',()=>{
  for(const p of people)for(const e of p.ethics){
    if(e.outcome==='None found')continue;
    assert.ok(['allegation','investigation','finding'].includes(e.status),`${p.id}: "${e.title}" needs status allegation, investigation or finding`);
  }
});
test('campaign money sources add up to total receipts, so the Overview bar is a complete split',()=>{
  for(const p of people){
    const c=p.camp;if(c.missing)continue;
    const parts=(c.itemized||0)+(c.unitemized||0)+(c.pac||0)+(c.party||0)+(c.self||0)+(c.transfers||0)+Math.max(0,c.other||0);
    assert.ok(Math.abs(parts-c.receipts)<=1,`${p.id}: sources add to ${parts}, receipts are ${c.receipts}`);
    assert.ok(c.itemized!=null&&c.unitemized!=null,`${p.id}: small/large donor split missing`);
  }
});
test('every statement check has an assessment the tally knows how to group',()=>{
  const known=new Set(['consistent','partial','changed','contradiction','unclear','outcome']);
  for(const p of people)for(const x of p.statements)assert.ok(known.has(x.assessment),`${p.id}: ${x.topic} has assessment ${x.assessment}`);
});
test('ideology chart: scored people sit on the dim1 scale and the chamber pools exist',()=>{
  assert.ok(data.pools.S.length>0&&data.pools.H.length>0);
  for(const p of people)if(p.ideo){assert.ok(Math.abs(p.ideo.dim1)<=1.05,`${p.id}: dim1 ${p.ideo.dim1}`);}
});
