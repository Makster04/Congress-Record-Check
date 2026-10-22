import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {letter,promiseScore,ethicsScore,pvpScore,MIN_CHECKS,ETHICS_COST} from '../public/grades.js';
const data=JSON.parse(await fs.readFile(new URL('../public/research.json',import.meta.url),'utf8'));
const people=data.members.concat(data.cands);
const st=(...a)=>a.map(assessment=>({assessment}));
test('letter grades use the usual 90/80/70/60 cut-offs',()=>{
  assert.deepEqual([100,90,89.9,80,79,70,69,60,59,0].map(letter),['A','A','B','B','C','C','D','D','F','F']);
});
test('promises: kept 1, partly or changed 1/2, broken 0; unclear and outcome checks left out; too few checks is not a zero',()=>{
  assert.equal(promiseScore(st('consistent','consistent','contradiction')).pct,67);
  assert.equal(promiseScore(st('consistent','partial','changed','outcome','unclear')).pct,67);
  assert.equal(promiseScore(st('consistent','consistent','outcome')).pct,null);
  assert.equal(promiseScore([]).pct,null);
  assert.equal(MIN_CHECKS,3);
});
test('ethics: findings, open and closed investigations cost points; allegations and "None found" do not',()=>{
  const e=(status,stage,outcome='x')=>({status,stage,outcome});
  assert.equal(ethicsScore([]).pct,100);
  assert.equal(ethicsScore([e('allegation'),e('allegation'),e('x','x','None found')]).pct,100);
  assert.equal(ethicsScore([e('finding')]).pct,100-ETHICS_COST.finding);
  assert.equal(ethicsScore([e('investigation','open')]).pct,100-ETHICS_COST.open);
  assert.equal(ethicsScore([e('investigation','closed')]).pct,100-ETHICS_COST.closed);
  assert.equal(ethicsScore(Array(9).fill(e('finding'))).pct,0);
});
test('people vs. profit: a Yea takes the marked side, a Nay the other, absences count for nothing; needs 3 votes',()=>{
  const v=(yea,pos)=>({pvp:{yea},pos:{p:pos}});
  assert.deepEqual(pvpScore([v('people','Yea'),v('profit','Nay'),v('profit','Yea')],'p'),{pct:67,people:2,n:3});
  assert.equal(pvpScore([v('people','Yea'),v('people','Not Voting')],'p').pct,null);
  assert.equal(pvpScore([{pos:{p:'Yea'}}],'p').n,0);
});
test('every displayed investigation says whether it is open or closed',()=>{
  for(const s of people)for(const e of s.ethics)if(e.status==='investigation')assert.ok(['open','closed'].includes(e.stage),`${s.id}: ${e.title}`);
});
test('any bill marked for people vs. profit cites its source',()=>{
  for(const v of data.votes.concat(data.hvotes))if(v.pvp){assert.ok(['people','profit'].includes(v.pvp.yea),v.id);assert.ok(v.pvp.src&&/^https:\/\//.test(v.pvp.src.u),v.id+' needs a source link');}
});
