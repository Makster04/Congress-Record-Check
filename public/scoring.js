// Each person's three reviewed grades (Promises delivered, Ethics, People over profit) from the reviewed research, the
// committee lists and the committee sectors. The page and the monthly recalculation (scripts/scores-monthly.mjs) both
// use this, so they always agree. Your match is not here: it depends on each visitor's own choices.
import {billKey,billKeyFromText,promiseScore,tradeChecks,ethicsScore,pvpScore,pvpActions} from './grades.js';

export const voteBill=v=>billKeyFromText((v.bill||{}).measure);
export function makeScorer(data,committees={committees:{},people:{}},sectors={}){
  const votes=data.votes.concat(data.hvotes);
  // People over profit: bills marked People or Profit (research.json "bills"), and each person's votes and sponsorships on them.
  const marks=new Map((data.bills||[]).filter(b=>b.pvp==='people'||b.pvp==='profit').map(b=>[b.id,b]));
  // A subcommittee seat counts under its full committee.
  const committeesOf=s=>committees.people[s.id]||[];
  const fullCommittee=id=>(committees.committees[id]||{}).parent||id;
  const overseen=s=>[...new Set(committeesOf(s).flatMap(c=>(sectors[fullCommittee(c.id)]||{}).sectors||[]))];
  const trading=s=>tradeChecks(s.trades,overseen(s));
  return {
    marks,committeesOf,fullCommittee,overseen,trading,
    promises:s=>promiseScore(s.statements),
    ethics:s=>ethicsScore(s.ethics,trading(s)),
    pvp(s){
      const v=votes.filter(v=>v.pos&&s.id in v.pos).map(v=>({bill:voteBill(v),pos:v.pos[s.id],ref:v.id}));
      const spons=(s.bills||[]).map((b,i)=>({bill:billKey(b.congress,b.num),kind:'sponsored',ref:`${s.id}:bill:${i}`}))
        .concat((s.cosponsored||[]).map(b=>({bill:b.bill||billKey(b.congress,b.num),kind:'cosponsored'})));
      return pvpScore(pvpActions(marks,v,spons));
    },
  };
}
