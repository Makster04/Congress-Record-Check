import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {letter,promiseScore,ethicsScore,pvpScore,moneyRatio,MIN_CHECKS,ETHICS_COST} from '../public/grades.js';
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
test('My alignment: every issue has a statement to agree or disagree with, and a known category',()=>{
  const groups=new Set(['econ','rights','imm','foreign','env']);
  for(const i of data.issues){
    assert.ok(groups.has(i.group),`${i.id}: group ${i.group}`);
    assert.ok(typeof i.statement==='string'&&i.statement.length>20&&/[.]$/.test(i.statement),`${i.id}: statement`);
  }
});
test('outside money ratio: larger side to 1, "all" when one side is zero, "even" within 10%, nothing when both are zero',()=>{
  assert.deepEqual(moneyRatio(210,100),{side:'for',r:2.1});
  assert.deepEqual(moneyRatio(100,340),{side:'against',r:3.4});
  assert.deepEqual(moneyRatio(500,0),{side:'for',r:null});
  assert.deepEqual(moneyRatio(0,500),{side:'against',r:null});
  assert.equal(moneyRatio(105,100).side,'even');
  assert.equal(moneyRatio(100,109).side,'even');
  assert.equal(moneyRatio(100,111).side,'against');
  assert.equal(moneyRatio(0,0),null);
  assert.equal(moneyRatio(-5,0),null);
});
