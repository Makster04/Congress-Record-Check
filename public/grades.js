// The four A-F grades on the home page cards. Shared by the page, the monthly scoring script and the tests; the
// Methodology page and .02_POLITICAL_SCORECARD_METHODOLOGY.md state the same rules.
// A grade is shown only with enough evidence; otherwise the card says "Not graded", never a zero.
// Values the methodology still lists under "Open decisions" are marked (placeholder).
export const MIN_CHECKS=3, MIN_MATCH_ISSUES=3, MIN_PVP_ACTIONS=3;
export const ETHICS_COST={finding:20,open:15,closed:5,allegation:0};
// Stock trading (placeholder): a late or missing disclosure costs 2 and a trade in a sector the member's committees
// oversee costs 1, each capped at 10. Reports are due no later than 45 days after the trade (STOCK Act).
export const TRADE_COST={late:2,lateCap:10,conflict:1,conflictCap:10}, LATE_DAYS=45;
// Rule 1: actions count more than words. A statement counts only on an issue with no recorded action.
export const WEIGHT={action:1,statement:0.5};
export const ACTION_TYPES=new Set(['senate_vote','house_vote','vote','state_vote','sponsored','cosponsored','official_act']);

export function letter(pct){return pct>=90?'A':pct>=80?'B':pct>=70?'C':pct>=60?'D':'F';}

// One ID per bill, so a vote and a sponsorship on the same bill can be matched: "H.R. 1319 (117th Congress)" -> "117-hr-1319".
const BILL_TYPES=new Set(['HR','S','HJRES','SJRES','HCONRES','SCONRES','HRES','SRES']);
export function billKey(congress,measure){
  const m=String(measure||'').toUpperCase().replace(/[.\s]/g,'').match(/^([A-Z]+)(\d+)$/);
  if(!m||!BILL_TYPES.has(m[1])||!(+congress>0))return null;
  return `${+congress}-${m[1].toLowerCase()}-${+m[2]}`;
}
export function billKeyFromText(text){
  const m=String(text||'').match(/^((?:H|S)\.?\s?(?:J\.?\s?Res|Con\.?\s?Res|Res|R)?\.?)\s*(\d+)\s*\((\d+)(?:st|nd|rd|th) Congress\)/i);
  return m?billKey(m[3],m[1]+m[2]):null;
}
const isVote=t=>/vote$/.test(t||'')||t==='vote';
// Sponsoring a bill and then voting on it counts once; if both exist, the vote is the one counted ("the vote wins").
export function oneCreditPerBill(items){
  const out=[], at=new Map();
  for(const e of items){
    if(!e.bill){out.push(e);continue;}
    if(!at.has(e.bill)){at.set(e.bill,out.length);out.push(e);continue;}
    const i=at.get(e.bill);if(isVote(e.kind||e.type)&&!isVote(out[i].kind||out[i].type))out[i]=e;
  }
  return out;
}

// Your match: per issue, the share of the record that matches the visitor's side, weighted by the importance they gave it.
// choices: [{id, side, w}]; evidence: {issueId: [{type, side, bill?}]}. Issues with no evidence are left out; an issue
// backed only by statements counts at half its importance. A grade needs evidence on 3 issues and half the importance.
export function matchScore(choices,evidence){
  let totW=0,covW=0,effW=0,num=0,nCov=0;const rows=[];
  for(const c of choices){
    totW+=c.w;
    const ev=(evidence||{})[c.id]||[], rec=oneCreditPerBill(ev.filter(e=>ACTION_TYPES.has(e.type))), st=ev.filter(e=>e.type==='stated');
    const basis=rec.length?rec:st;
    if(!basis.length){rows.push({id:c.id,status:'none',rec,st});continue;}
    const match=basis.filter(e=>e.side===c.side).length, agree=match/basis.length, iw=rec.length?c.w:c.w*WEIGHT.statement;
    covW+=c.w;effW+=iw;num+=iw*agree;nCov++;
    rows.push({id:c.id,status:rec.length?'record':'stated',match,n:basis.length,agree,iw,rec,st,stMatch:st.filter(e=>e.side===c.side).length});
  }
  const need=Math.min(MIN_MATCH_ISSUES,choices.length), enough=choices.length>0&&nCov>=need&&totW>0&&covW/totW>=0.5;
  return {score:enough?Math.round(num/effW*100):null,covW,totW,effW,nCov,nChosen:choices.length,need,rows,num};
}

// Promises delivered: each counted check is 1 if the record supports it, 1/2 if partly supported or the position changed,
// 0 if contradicted (including a promise left unacted at the end of the term, recorded as a contradiction with `unacted`).
// Left out: ambiguous and outcome checks, promises with no related bill yet ("pending"), and vague goals (`vague: true`).
const COUNTED=new Set(['consistent','partial','changed','contradiction']);
// trackers: published promise-tracker tallies (PolitiFact's Trump-O-Meter and MAGA-Meter, for a president), counted like
// checked statements: Promise Kept 1, Compromise ½, Promise Broken 0. Stalled and In the Works wait, like a promise with
// no related bill yet. [{counts:{kept, compromise, broken, stalled, inTheWorks}}]
export function promiseScore(statements,trackers){
  const list=(statements||[]).filter(x=>!x.vague), c={};
  for(const x of list)c[x.assessment]=(c[x.assessment]||0)+1;
  let kept=c.consistent||0, half=(c.partial||0)+(c.changed||0), broken=c.contradiction||0, waiting=0, rated=0;
  for(const t of trackers||[]){const n=t.counts||{};kept+=n.kept||0;half+=n.compromise||0;broken+=n.broken||0;
    const w=(n.stalled||0)+(n.inTheWorks||0);waiting+=w;rated+=(n.kept||0)+(n.compromise||0)+(n.broken||0)+w;}
  const clear=kept+half+broken;
  return {pct:clear>=MIN_CHECKS?Math.round((kept+half/2)/clear*100):null,kept,half,broken,clear,total:list.length+rated,
    notCounted:list.filter(x=>!COUNTED.has(x.assessment)).length+waiting,vague:(statements||[]).length-list.length,
    unacted:list.filter(x=>x.assessment==='contradiction'&&x.unacted).length,promises:list.filter(x=>x.promise).length+rated};
}

// Stock trading: which reviewed trades were disclosed late (or not at all) and which were individual stocks in a sector
// the member's committees oversee. trades: [{traded, filed, sector, asset}]; overseen: sector names.
const DAY=86400000;
export function tradeChecks(trades,overseen){
  const sectors=new Set(overseen||[]);let late=0,conflict=0;
  const rows=(trades||[]).map(t=>{
    const days=t.filed&&t.traded?Math.round((Date.parse(t.filed)-Date.parse(t.traded))/DAY):null;
    const isLate=!!t.missing||(days!=null&&days>LATE_DAYS);
    const isConflict=(t.asset||'stock')==='stock'&&!!t.sector&&sectors.has(t.sector);
    if(isLate)late++;if(isConflict)conflict++;
    return Object.assign({},t,{days,late:isLate,conflict:isConflict});
  });
  return {rows,late,conflict};
}

// Ethics: starts at 100. Each case counts once, at its current status: a confirmed finding, an open investigation, or an
// investigation that ended without a finding. Allegations are listed but cost nothing; "None found" checks are ignored.
// Stock-trading deductions (from tradeChecks) are added on top, each capped. Never below 0.
export function ethicsScore(ethics,trading){
  const n={finding:0,open:0,closed:0,allegation:0};
  for(const e of ethics||[]){
    if(e.outcome==='None found')continue;
    if(e.status==='finding')n.finding++;
    else if(e.status==='investigation')n[e.stage==='open'?'open':'closed']++;
    else if(e.status==='allegation')n.allegation++;
  }
  const caseCost=n.finding*ETHICS_COST.finding+n.open*ETHICS_COST.open+n.closed*ETHICS_COST.closed+n.allegation*ETHICS_COST.allegation;
  const late=(trading&&trading.late)||0, conflict=(trading&&trading.conflict)||0;
  const lateCost=Math.min(TRADE_COST.lateCap,late*TRADE_COST.late), conflictCost=Math.min(TRADE_COST.conflictCap,conflict*TRADE_COST.conflict);
  const raw=100-caseCost-lateCost-conflictCost;
  return Object.assign({pct:Math.max(0,raw),raw,caseCost,late,conflict,lateCost,conflictCost},n);
}

// Workers > Profit: actions on bills marked People or Profit by a cited nonpartisan analysis of who gains.
// actions: [{bill, kind: 'vote'|'sponsored'|'cosponsored', pos?, mark: 'people'|'profit'}]. A Yea or a sponsorship takes the
// bill's side, a Nay the other; missed votes count for nothing; one credit per bill (the vote wins). Each counts 1.0.
export function pvpScore(actions){
  let people=0,profit=0;const scored=[];
  for(const a of oneCreditPerBill((actions||[]).filter(a=>a.mark==='people'||a.mark==='profit'))){
    let took;
    if(a.kind==='vote'){if(a.pos!=='Yea'&&a.pos!=='Nay')continue;took=a.pos==='Yea'?a.mark:(a.mark==='people'?'profit':'people');}
    // A president's veto takes the other side of the bill, like a Nay; signing a bill or issuing an order takes its side.
    else if(a.kind==='vetoed')took=a.mark==='people'?'profit':'people';
    else took=a.mark;
    if(took==='people')people+=WEIGHT.action;else profit+=WEIGHT.action;
    scored.push(Object.assign({},a,{took}));
  }
  const n=scored.length;
  return {pct:n>=MIN_PVP_ACTIONS?Math.round(people/(people+profit)*100):null,people,profit,n,scored};
}
// The actions one person took on marked bills: their recorded votes, and the bills they sponsored or cosponsored (or, for
// a president, signed or vetoed, and executive orders, keyed "eo-14251").
// marks: Map billKey -> {pvp}; votes: [{bill, pos}]; sponsorships: [{bill, kind}].
export function pvpActions(marks,votes,sponsorships){
  const out=[];
  for(const v of votes||[]){const m=v.bill&&marks.get(v.bill);if(m)out.push({bill:v.bill,kind:'vote',pos:v.pos,mark:m.pvp,ref:v.ref});}
  for(const sp of sponsorships||[]){const m=sp.bill&&marks.get(sp.bill);if(m)out.push({bill:sp.bill,kind:sp.kind||'sponsored',mark:m.pvp,ref:sp.ref});}
  return out;
}

// Outside money: the for-to-against ratio, always that way round. The larger side gets the number and the other is 1
// ("2.1 : 1" more for, "1 : 2.1" more against); "no opposing spending" / "no supporting spending" when one side is zero;
// null when both are. side says which way it leans ('even' when it reads 1 : 1), for coloring.
// share = for / (for + against) places the ratio on the chart's scale: 1 is all for, 0.5 is 1 : 1, 0 is all against.
export function moneyRatio(f,a){
  f=Math.max(0,+f||0);a=Math.max(0,+a||0);
  if(!f&&!a)return null;
  const n=x=>x>=9.95?String(Math.round(x)):String(Math.round(x*10)/10);
  const text=!a?'no opposing spending':!f?'no supporting spending':f>=a?`${n(f/a)} : 1`:`1 : ${n(a/f)}`;
  return {share:f/(f+a),text,side:text==='1 : 1'?'even':f>a?'for':'against',oneSided:!a||!f};
}
