import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {categoryAlign,spenderSector,outsideBySector,topDonors,voteDonorAlignment,timingFlags,positionChangeFlags,stockFlags,tradesInDonors,addMonths,TOP_DONORS} from '../public/influence.js';
const research=JSON.parse(await fs.readFile(new URL('../public/research.json',import.meta.url),'utf8'));

test('donor alignment: unions and small donors are People, industry is Profit, the rest Other',()=>{
  assert.equal(categoryAlign('labor'),'people');assert.equal(categoryAlign('pharma'),'profit');assert.equal(categoryAlign('biz'),'profit');
  for(const c of ['lead','ideo','party','tribal','other',undefined])assert.equal(categoryAlign(c),'other');
  for(const c of Object.keys(research.categories))assert.ok(['people','profit','other'].includes(categoryAlign(c)),c);
});
test('outside spenders get a sector from their name, and credit unions are not labor unions',()=>{
  assert.equal(spenderSector('SEIU COPE (Service Employees International Union Committee On Political Education)','super_pac'),'labor');
  assert.equal(spenderSector('Americas Credit Unions','other'),'finance');
  assert.equal(spenderSector('Associated Builders and Contractors, Inc. Political Action Committee (ABC PAC)','other'),'realestate');
  assert.equal(spenderSector('Senate Leadership Fund','super_pac'),'ideo');
  assert.equal(spenderSector('Maine Democratic Party','party'),'party');
  const cm=[['C1','AFSCME Working Families Fund','super_pac'],['C2','Dscc','party'],['C3','American Chemistry Council Inc','other']];
  const by=outsideBySector([[0,100,0],[1,50,25],[2,0,300]],i=>cm[i]);
  assert.deepEqual(by.for.map(x=>[x.cat,x.align]),[['labor','people'],['party','other']]);
  assert.deepEqual(by.against.map(x=>x.cat),['manuf','party']);
});
test('top donors sum each PAC across filings and add small-dollar donors as one People tile',()=>{
  const t=topDonors([[0,1000,'labor',0],[0,500,'labor',1],[1,2000,'pharma',0],[2,10,'lead',0]],['Union PAC','Drug PAC','Leader PAC'],5000,3);
  assert.deepEqual(t.tiles.map(x=>[x.label,x.value,x.align]),[['Small-dollar donors ($200 or less)',5000,'people'],['Drug PAC',2000,'profit'],['Union PAC',1500,'people']]);
  assert.equal(t.rest,1);assert.equal(t.restAmount,10);assert.equal(TOP_DONORS,20);
});
test('Vote Donor Alignment counts only donors that gave, and only votes cast',()=>{
  const v=voteDonorAlignment([{org:'A',pac:100,compared:[{match:true},{match:false},{match:null}]},{org:'B',pac:0,compared:[{match:true}]},{org:'C',pac:50,compared:[{match:true}]}]);
  assert.equal(v.n,3);assert.equal(v.same,2);assert.equal(v.pct,67);assert.deepEqual(v.rows.map(r=>r.org),['A','C']);
  assert.equal(voteDonorAlignment([]).pct,null);
});
test('timing flags: a 50% rise after a vote the donor wanted, a 50% drop after one it opposed, never past the data',()=>{
  assert.equal(addMonths('2025-11',3),'2026-02');assert.equal(addMonths('2025-02',-3),'2024-11');
  const series={'2025-01':1000,'2025-07':2000,'2025-08':500};
  const f=timingFlags('Org',series,[{date:'2025-07-15',match:true,label:'Vote'}],'2026-06');
  assert.equal(f.length,1);assert.equal(f[0].kind,'rose');assert.equal(f[0].before,1000);assert.equal(f[0].after,2500);assert.equal(f[0].from,'2025-01');assert.equal(f[0].to,'2025-12');
  assert.equal(timingFlags('Org',{'2025-03':1000,'2025-08':400},[{date:'2025-07-01',match:false}],'2026-06')[0].kind,'dropped');
  assert.equal(timingFlags('Org',{'2025-03':1000,'2025-08':600},[{date:'2025-07-01',match:false}],'2026-06').length,0,'a 40% drop is not flagged');
  assert.equal(timingFlags('Org',series,[{date:'2025-07-15',match:true}],'2025-10').length,0,'the window runs past the data');
  assert.equal(timingFlags('Org',series,[{date:'2025-07-15',match:null}],'2026-06').length,0,'a missed vote is not a decision');
});
test('position-change and stock flags',()=>{
  const p=positionChangeFlags('Org',{'2024-03':100,'2024-09':900},new Set(['health']),[{date:'2025-02-01',issue:'health'},{date:'2025-02-01',issue:'guns'}],'2026-01');
  assert.equal(p.length,1);assert.equal(p[0].kind,'changed');
  const s=stockFlags([{company:'Pfizer Inc.',traded:'2026-01-05',type:'purchase'},{company:'Apple Inc',traded:'2026-01-06'}],[{org:'Pfizer',positions:2},{org:'Apple',positions:0}]);
  assert.deepEqual(s.map(x=>x.org),['Pfizer']);
  const trades=[{asset:'Lockheed Martin Corporation - Common Stock',traded:'2026-02-01'},{company:'Microsoft Corp',traded:'2026-02-02'}];
  assert.deepEqual(tradesInDonors(trades,[{org:'Lockheed Martin'},{org:'Boeing'}]).map(x=>x.org),['Lockheed Martin'],'a trade in any donor is listed');
  assert.deepEqual(stockFlags(trades,[{org:'Lockheed Martin',stake:false},{org:'Microsoft',stake:true}]).map(x=>x.org),['Microsoft'],'a donor that lobbied on their bills makes it a flag');
});
