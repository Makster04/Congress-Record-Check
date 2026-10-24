import {KV_MIN,leanOfVote,whyNotMarked,sideTaken,keyVoteRows,keyVoteScore} from './lean.js';
import {MIN_CHECKS,MIN_PVP_ACTIONS,ETHICS_COST,TRADE_COST,LATE_DAYS,WEIGHT,ACTION_TYPES,letter,billKey,matchScore,promiseScore,moneyRatio} from './grades.js';
import {makeScorer,voteBill} from './scoring.js';
import {hoverTips,tableView,legend,rankBars,stackRows,divergingRows,categoryBars,drawScatter,drawDelay,drawTradeTimeline,drawCaseTimeline,drawTreemap,drawMonthly,sectorSpendBars} from './charts.js';
import {ALIGN_LABEL,SECTOR_LABEL_EXTRA,TOP_DONORS,WINDOW_MONTHS,SWING,categoryAlign,outsideBySector,topDonors,voteDonorAlignment,timingFlags,positionChangeFlags,stockFlags,addMonths} from './influence.js';
(function(){
const $=s=>document.querySelector(s);
const app=$('#app'), tip=$('#tip');
const MEM=DATA.members, CANDS=DATA.cands||[], ALL=MEM.concat(CANDS);
// Featured profiles (the president) get a card at the top of the home page and a full profile, but stay out of the
// filters, races, comparisons and score pages, which cover the 2026 ballot.
const FEATURED=DATA.featured||[];
const byId=Object.fromEntries(ALL.concat(FEATURED).map(s=>[s.id,s]));
// One ID per bill ("117-hr-1319"), so a vote and a sponsorship on the same bill count once.
const VOTE_BY_ID=new Map(DATA.votes.concat(DATA.hvotes).map(v=>[v.id,v]));
for(const s of ALL.concat(FEATURED))for(const ev of Object.values(s.evidence||{}))for(const e of ev){
  if(e.bill)continue;
  const v=VOTE_BY_ID.get(e.ref);if(v){e.bill=voteBill(v);continue;}
  const m=/:bill:(\d+)$/.exec(e.ref||''), b=m&&(s.bills||[])[+m[1]];if(b)e.bill=billKey(b.congress,b.num);
}
// The reviewed grades come from public/scoring.js, shared with the monthly recalculation. Committee assignments
// (public/committees.json) and the sectors each committee oversees (public/committee-sectors.json) feed the Ethics
// committee-conflict check.
const COMMITTEES=window.COMMITTEES||{committees:{},people:{}}, COMMITTEE_SECTORS=window.COMMITTEE_SECTORS||{};
const SCORER=makeScorer(DATA,COMMITTEES,COMMITTEE_SECTORS);
const PVP_MARKS=SCORER.marks, committeesOf=SCORER.committeesOf, fullCommittee=SCORER.fullCommittee, overseenSectors=SCORER.overseen;
const personPvp=SCORER.pvp, personTrading=SCORER.trading, personEthics=SCORER.ethics;
const icH=s=>s.ideoKind==='house'?'H':s.chamber;
const chipCh=s=>s.office?CH[s.chamber].member:s.senInc?'Senate':s.cand?(s.openSeat?'Senate candidate':(s.chamber==='S'?'Senate challenger':'House challenger')):CH[s.chamber].name;
const CH={S:{name:'Senate',noun:'senator',nouns:'senators',votes:DATA.votes,member:'Senate'},H:{name:'House',noun:'representative',nouns:'representatives',votes:DATA.hvotes,member:'House'},P:{name:'Presidency',noun:'president',nouns:'presidents',votes:[],member:'President'}};
const fmt$=n=>{if(n==null)return'—';const a=Math.abs(n);if(a>=1e6)return'$'+(n/1e6).toFixed(a>=1e7?1:2)+'M';if(a>=1e3)return'$'+(n/1e3).toFixed(a>=1e5?0:1)+'K';return'$'+n.toFixed(0)};
const fmtFull=n=>n==null?'—':'$'+Math.round(n).toLocaleString('en-US');
const pct=(a,b)=>b?Math.round(a/b*1000)/10:0;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ASSESS={pending:['neutral','No related bill yet'],consistent:['good','Consistent'],contradiction:['crit','Direct contradiction'],partial:['warn','Partly consistent'],unclear:['neutral','Ambiguous or incomplete evidence'],changed:['serious','Changed position'],outcome:['neutral','Outcome check']};
const ICON={good:'✓',crit:'✕',warn:'◐',serious:'↻',neutral:'◇'};
const AICON={pending:'…',consistent:'✓',contradiction:'✕',partial:'◐',unclear:'?',changed:'↻',outcome:'◇'};
const posClass=p=>{p=(p||'').toLowerCase();if(p==='yea'||p==='guilty')return'yea';if(p==='nay'||p==='not guilty')return'nay';return'nv'};
const voteUrl=v=>v.roll!=null?`https://clerk.house.gov/Votes/${v.year}${v.roll}`:`https://www.senate.gov/legislative/LIS/roll_call_votes/vote${v.congress}${v.session}/vote_${v.congress}_${v.session}_${String(v.number).padStart(5,'0')}.htm`;
const partyName=p=>p==='R'?'Republican':p==='D'?'Democrat':'Independent';
const seatLabel=s=>s.chamber==='H'?s.district:s.state;
const REC_SHORT={senator:'Senator',member_of_congress:'House member',former_member_of_congress:'Ex-member of Congress',state_legislator:'State legislator',executive:'Executive office',none:'No elected office'};
const REC_LABEL={senator:'Sitting U.S. senator',member_of_congress:'Sitting U.S. House member',former_member_of_congress:'Former member of Congress',state_legislator:'State legislator',executive:'Executive / appointed office',none:'No prior elected office'};
const fmtDate=d=>{if(!d)return'—';const m=d.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return d;return new Date(+m[1],+m[2]-1,+m[3]).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})};
const cgUrl=s=>`https://www.congress.gov/member/${s.name.toLowerCase().replace(/-/g,' ').replace(/[^a-z ]/g,'').trim().split(/\s+/).filter(w=>w.length>1).join('-')}/${s.bioguide}`;
const fecCandUrl=id=>id[0]==='P'?`https://www.fec.gov/data/candidate/${id}/`:`https://www.fec.gov/data/candidate/${id}/?cycle=2026&election_full=true`;
const fecCmteUrl=id=>`https://www.fec.gov/data/committee/${id}/?cycle=2026`;
const fecIeUrl=id=>`https://www.fec.gov/data/independent-expenditures/?data_type=processed&cycle=2026&candidate_id=${id}`;
let resizers=[];
window.addEventListener('resize',()=>{clearTimeout(window.__rz);window.__rz=setTimeout(()=>resizers.forEach(f=>f()),120)});

// ---------- ideology helpers ----------
function ideoText(s){
  const i=s.ideo;
  if(!i){
    if(s.ideoKind==='former_text'){const m=(s.ideoNote||'').match(/more (conservative|liberal) than \d+% of the \d+\w* (House|Senate)/i);const ph=m?m[0]:'scored by Voteview';return {head:'In Congress: '+ph,within:'',short:'Voteview: '+ph}}
    if(s.ideoKind==='state'&&s.stateIdeology)return {head:s.stateIdeology.text,within:'',short:s.stateIdeology.text};
    if(s.ideoKind==='former_noscore')return {head:'Former member of Congress',within:'',short:'Ideology score not retrieved'};
    if(hasStateLeg(s))return {head:'No comparable ideology score',within:'',short:(s.recordType==='state_legislator'?'State legislator':'Former state legislator')+' (no comparable score)'};
    return {head:'No legislative voting record',within:'',short:'No legislative voting record'};
  }
  const ch=CH[icH(s)].name, grp=s.party==='R'?(ch+' Republicans'):(ch+' Democrats');
  const hi=Math.round((100-i.lo)*10)/10, phi=Math.round((100-i.plo)*10)/10;
  const head=s.party==='R'?`More conservative than ${i.lo}% of the ${ch}`:`More liberal than ${hi}% of the ${ch}`;
  let within;
  if(s.party==='R') within=i.plo>=50?`more conservative than ${i.plo}% of ${grp}`:(i.plo===0?`the most moderate of ${i.np+1} ${grp} scored`:`more moderate than ${phi}% of ${grp}`);
  else within=phi>=50?`more liberal than ${phi}% of ${grp}`:(phi===0?`the most moderate of ${i.np+1} ${grp} scored`:`more moderate than ${i.plo}% of ${grp}`);
  const short=s.party==='R'?`More conservative than ${Math.round(i.lo)}% of ${ch}`:`More liberal than ${Math.round(hi)}% of ${ch}`;
  return {head,within,short};
}
const hasStateLeg=s=>s.recordType==='state_legislator'||!!(s.stateLeg&&s.stateLeg.length);
function noIdeoBlock(s){
  const t=ideoText(s);
  let body;
  if(s.ideoKind==='former_text') body=`<p style="margin:8px 0 0">${esc(s.short)} served in Congress (see offices held above). Voteview's own summary: <b>${esc((s.ideoNote||'').replace(/^.*?It says: /,'').replace(/^Voteview: /,''))}</b> <a href="${esc((s.ideoSrc||{}).u||'#')}" target="_blank" rel="noopener">Voteview ↗</a></p><p class="small muted" style="margin:6px 0 0">That comparison is with colleagues in that Congress, not today's, so it is not placed on the current-chamber chart used for sitting members.</p>`;
  else if(s.ideoKind==='state') body=`<p style="margin:8px 0 0">${esc(s.stateIdeology.text)} <a href="${esc(s.stateIdeology.src.u)}" target="_blank" rel="noopener">${esc(s.stateIdeology.src.t)} ↗</a></p><p class="small muted" style="margin:6px 0 0">A state-legislature ranking, not comparable with congressional DW-NOMINATE scores.</p>`;
  else if(s.ideoKind==='former_noscore') body=`<p style="margin:8px 0 0">${esc(s.short)} served in Congress, but Voteview's page did not show an ideology score or comparison for ${esc(s.short)} when this release was built, so no percentile is shown. ${esc(s.short)}'s congressional votes are listed below. ${s.ideoSrc?`<a href="${esc(s.ideoSrc.u)}" target="_blank" rel="noopener">Voteview record ↗</a>`:''}</p>`;
  else if(hasStateLeg(s)) body=`<p style="margin:8px 0 0">${esc(s.short)}'s legislative votes were cast in a state legislature, which has no published score comparable with congressional DW-NOMINATE. The record below lists ${s.recordType==='state_legislator'?esc(s.short)+"'s recorded votes and bills on major issues":'major official actions'+(s.recordType==='executive'?' in executive office':'')} instead.</p>`;
  else body=`<p style="margin:8px 0 0">${esc(s.short)} has not served in a legislature, so there is no roll-call record to score. The record below lists ${esc(s.short)}'s documented official actions and public commitments instead.</p>`;
  return `<div class="chart"><div class="kicker">Voting ideology</div><div class="big" style="margin-top:4px">${esc(t.head)}</div>${body}</div>`;
}
function ideoBlock(s,id){
  if(!s.ideo)return noIdeoBlock(s);
  const t=ideoText(s), i=s.ideo, C=icH(s);
  return `<div class="chart">
    <div class="ideo-head"><div><div class="kicker">Voting ideology · DW-NOMINATE</div><div class="big" style="margin-top:4px">${esc(t.head)}</div></div>
    <div class="mono muted">Score ${i.dim1>0?'+':''}${i.dim1.toFixed(3)} on a −1 (liberal) to +1 (conservative) scale</div></div>
    <p class="small" style="margin:8px 0 0;color:var(--ink-2)">Within the party: ${esc(t.within)}. Party unity: votes with the ${s.party==='R'?'Republican':'Democratic'} majority on <b class="num">${i.unity}%</b> of party-line votes${i.partyVotes?` (${i.withParty} of ${i.partyVotes} in the 119th Congress)`:''}.</p>
    <div class="ideo" id="${id}" style="margin-top:10px"></div>
    <div class="legend"><span><i style="background:var(--dem)"></i>Democrats</span><span><i style="background:var(--rep)"></i>Republicans</span>${C==='S'?'<span><i style="background:var(--muted)"></i>Independents</span>':''}<span><i style="background:var(--ink);border-radius:50%"></i>${esc(s.short)}</span></div>
    <div class="sub" style="margin:8px 0 0">${s.ideoKind==='house'?esc(s.short)+' is a sitting House member, so the comparison is with the current House. ':''}Each dot is one current ${CH[C].noun} with at least 100 scored votes (${i.n+1} in all). Hover a dot for the name. Source: Voteview DW-NOMINATE first dimension, which scores a member's whole career of roll-call votes. <a href="https://voteview.com/person/${esc(i.icpsr)}" target="_blank" rel="noopener">Voteview record ↗</a></div>
  </div>`;
}
function drawIdeo(el,s){
  if(!el||!s.ideo)return;
  const C=icH(s), pts=DATA.pools[C];
  const W=Math.max(280,el.clientWidth), small=W<520;
  const diam=C==='S'?(small?7:10):(small?4.4:6);
  const mL=10,mR=10,x0=-1.0,x1=1.05;
  const X=v=>mL+(Math.max(x0,Math.min(x1,v))-x0)/(x1-x0)*(W-mL-mR);
  const nb=Math.floor((W-mL-mR)/diam);
  const bins={};
  const order=pts.map((p,i)=>i).sort((a,b)=>pts[a][0]-pts[b][0]);
  const pos=new Array(pts.length);
  let maxS=0;
  order.forEach(i=>{const b=Math.min(nb-1,Math.floor((X(pts[i][0])-mL)/diam));const k=bins[b]||0;bins[b]=k+1;pos[i]=[mL+(b+.5)*diam,k];if(k+1>maxS)maxS=k+1;});
  const top=34, plotH=maxS*diam, base=top+plotH, H=base+64;
  const meIdx=pts.findIndex(p=>(s.bioguide&&p[3]===s.bioguide)||p[2]===s.name);
  const med=code=>{const v=pts.filter(p=>p[1]===code).map(p=>p[0]).sort((a,b)=>a-b);return v.length?v[Math.floor(v.length/2)]:null};
  const dM=med('D'), rM=med('R');
  let g='';
  pts.forEach((p,i)=>{if(i===meIdx)return;const [cx,k]=pos[i];g+=`<circle class="${p[1]==='R'?'r':p[1]==='D'?'d':'i'}" cx="${cx.toFixed(1)}" cy="${(base-(k+.5)*diam).toFixed(1)}" r="${(diam/2-.6).toFixed(2)}" data-i="${i}"></circle>`;});
  const mx=X(s.ideo.dim1);
  let me='';
  if(meIdx>=0){const [cx,k]=pos[meIdx];const cy=base-(k+.5)*diam;
    me=`<line class="guide" x1="${cx}" x2="${cx}" y1="${top-8}" y2="${cy-diam/2-2}"></line><circle class="me ${s.party==='R'?'r':'d'}" cx="${cx}" cy="${cy}" r="${Math.max(4.5,diam/2+1.5)}" data-i="${meIdx}"></circle>`;
    const anchor=cx<W*.18?'start':cx>W*.82?'end':'middle';
    me+=`<text class="me-lab" x="${cx}" y="${top-14}" text-anchor="${anchor}">${esc(s.short)} ${s.ideo.dim1>0?'+':''}${s.ideo.dim1.toFixed(2)}</text>`;}
  let ax=`<line class="axis" x1="${mL}" x2="${W-mR}" y1="${base+2}" y2="${base+2}"></line>`;
  [-1,-.5,0,.5,1].forEach(v=>{ax+=`<line class="axis" x1="${X(v)}" x2="${X(v)}" y1="${base+2}" y2="${base+7}"></line><text class="tick" x="${X(v)}" y="${base+19}" text-anchor="${v===-1?'start':v===1?'end':'middle'}">${v>0?'+':''}${v}</text>`;});
  const medMark=(v,lab,cls)=>v==null?'':`<path d="M${X(v)-5},${base+33} L${X(v)+5},${base+33} L${X(v)},${base+26} Z" class="${cls}" style="fill:var(${cls==='d'?'--dem':'--rep'})"></path><text class="med" x="${X(v)}" y="${base+46}" text-anchor="middle">${lab} ${v>0?'+':''}${v.toFixed(2)}</text>`;
  ax+=medMark(dM,small?'D median':'Democratic median','d')+medMark(rM,small?'R median':'Republican median','r');
  ax+=`<text class="cap" x="${mL}" y="${base+62}">← More liberal</text><text class="cap" x="${W-mR}" y="${base+62}" text-anchor="end">More conservative →</text>`;
  el.innerHTML=`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(s.name)}'s DW-NOMINATE score ${s.ideo.dim1.toFixed(3)} among ${pts.length} ${CH[C].nouns}; ${esc(ideoText(s).head)}">${g}${ax}${me}</svg>`;
  const svg=el.querySelector('svg');
  svg.addEventListener('mousemove',e=>{const c=e.target.closest('circle[data-i]');if(!c){tip.classList.remove('show');return}const p=pts[+c.dataset.i];tip.textContent=`${p[2]} (${p[1]}) · ${p[0]>0?'+':''}${p[0].toFixed(3)}`;tip.classList.add('show');tip.style.left=Math.min(e.clientX+12,window.innerWidth-270)+'px';tip.style.top=(e.clientY+14)+'px';});
  svg.addEventListener('mouseleave',()=>tip.classList.remove('show'));
}
function mountIdeo(id,s){const f=()=>drawIdeo(document.getElementById(id),s);f();resizers.push(f);}

// ---------- funding (stage 3): campaign funds and outside spending are never added together ----------
const IE=DATA.ie, CLS=['super_pac','other','party'];
const CLSN={super_pac:'Super PACs',other:'Other outside groups',party:'Party committees'};
const CLS1={super_pac:'super PAC',other:'other outside group',party:'party committee'};
const CLSL={super_pac:'super PACs',other:'other outside groups',party:'party committees'};
const CLSV={super_pac:'--s2',other:'--s3',party:'--s4'};
const GLOSS={
  ie:'Independent expenditure: ads, mail or canvassing that support or oppose a candidate, paid for by a group that may not coordinate with the campaign. It is not money the campaign raised or controls.',
  superpac:'Super PAC: a committee that can raise unlimited sums and spend them independently. It cannot give money to a campaign directly.',
  receipts:'Campaign funds raised: everything the candidate\'s own campaign committee reported taking in (FEC "total receipts"): contributions, transfers, loans and other receipts.',
  pac:'PAC contribution: a check from a political action committee to the campaign, capped at $5,000 per election. It is part of campaign funds.',
  transfers:'Transfers: money passed on from joint fundraising committees, mostly individual contributions raised together with party committees.',
  earmarked:'Earmarked contribution: an individual\'s donation that a PAC collects and forwards. The FEC counts it as an individual contribution to the campaign.',
  party:'Party committees can make independent expenditures too. They are reported separately from the party\'s direct contributions.',
  coverage:'Coverage: the share of the PAC money a report lists that could be read row by row for this release.'
};
const term=(k,t)=>`<span class="term" tabindex="0" data-tip="${esc(GLOSS[k])}">${t}</span>`;
const period=(a,b)=>`${fmtDate(a)} – ${fmtDate(b)}`;
const shortPer=(b)=>'through '+fmtDate(b);
const cmOf=i=>IE.cm[i];
const candName=id=>IE.cands[id]||id;
const flag=(t,why)=>`<span class="flag" ${why?`data-tip="${esc(why)}" tabindex="0"`:''}>${t}</span>`;
function raceOf(s){return DATA.races.find(r=>r.keys.includes(s.id))}
function rivalsOf(s){const r=raceOf(s);return r?r.keys.filter(k=>k!==s.id).map(k=>byId[k]):[]}
function campFlags(s){
  const c=s.camp, f=[];
  if(c.missing)return [flag('No FEC report yet',c.note)];
  if(c.selfShare>20)f.push(flag(`${c.selfShare}% self-funded`,`Candidate loans and contributions: ${fmtFull(c.self)} of ${fmtFull(c.receipts)} in receipts.`));
  return f;
}
function outFlags(s){
  const o=s.out, f=[];
  if(o.incomplete.length)f.push(flag('Incomplete data',o.incomplete.join(' ')));
  if(o.multi)f.push(flag('Three-way race','Spending against one candidate cannot be credited to a single rival, so only spending aimed at this candidate is summarized.'));
  return f;
}
// headline numbers ---------------------------------------------------------
function campLine(s){return s.camp.missing?'<span class="muted">not yet reported</span>':`${fmt$(s.camp.receipts)} <span class="small muted">${shortPer(s.camp.end)}</span>`}
const forLabel=s=>s.out.multi?'Supporting '+s.short:'For '+s.short;
const agLabel=s=>s.out.multi?'Opposing '+s.short:'Against '+s.short;
function fundingPanels(s){
  const c=s.camp,o=s.out;
  const comp=c.missing?'':`<ul class="kvl">
      <li><span>From individuals</span><b>${fmt$(c.indiv)}</b></li>
      <li><span>${term('pac','From PACs')}</span><b>${fmt$(c.pac)}</b></li>
      <li><span>${term('transfers','Transfers from joint fundraising')}</span><b>${fmt$(c.transfers)}</b></li>
      <li><span>From party committees</span><b>${fmt$(c.party)}</b></li>
      ${c.self?`<li><span>Candidate's own loans and contributions</span><b>${fmt$(c.self)}</b></li>`:''}
      <li><span>Other receipts</span><b>${fmt$(Math.max(0,c.other))}</b></li>
    </ul>`;
  const byCls=(x)=>CLS.filter(k=>x[k]).map(k=>`<li><span><i class="sw" style="background:var(${CLSV[k]})"></i>${CLSN[k]}</span><b>${fmt$(x[k])}</b></li>`).join('')||'<li><span class="muted">None reported</span></li>';
  return `<div class="fpanels">
    <section class="fpanel camp">
      <div class="kicker">${term('receipts','Campaign funds raised')}</div>
      <div class="fbig">${c.missing?'—':fmt$(c.receipts)}</div>
      <div class="fper">${c.missing?'No FEC financial report filed yet':`${period(c.start,c.end)} · FEC committee summary`}</div>
      <div class="row" style="margin-top:6px">${campFlags(s).join('')}</div>
      ${c.missing?`<p class="small" style="margin-top:8px">${esc(c.note)}</p>`:comp}
      ${c.missing?'':`<p class="small muted" style="margin:8px 0 0">Cash on hand ${fmt$(c.cash)} on ${fmtDate(c.end)}${c.debts?` · debts ${fmt$(c.debts)}`:''}${c.src?` · <a href="${esc(c.src)}" target="_blank" rel="noopener">FEC ↗</a>`:''}</p>`}
    </section>
    <section class="fpanel out">
      <div class="kicker">Outside spending · ${term('ie','independent expenditures')}</div>
      <div class="fsplit">
        <div><div class="fl">${esc(forLabel(s))}</div><div class="fbig">${fmt$(o.for.total)}</div><ul class="kvl">${byCls(o.for)}</ul></div>
        <div><div class="fl">${esc(agLabel(s))}</div><div class="fbig">${fmt$(o.against.total)}</div><ul class="kvl">${byCls(o.against)}</ul></div>
      </div>
      <div class="fper">${period(o.start,o.end)} · general election only · <b>not money raised by the campaign</b></div>
      <div class="row" style="margin-top:6px">${outFlags(s).join('')}</div>
      ${o.multi?'':`<p class="small muted" style="margin:8px 0 0">"For" = spending supporting ${esc(s.short)} or opposing ${esc(rivalsOf(s).map(x=>x.short).join(' or ')||'the opponent')}. "Against" = the reverse.</p>`}
    </section>
  </div>`;
}
// same-scale bars (not summed) ------------------------------------------------
function hbar(parts,max,label){
  const tot=parts.reduce((a,p)=>a+Math.max(0,p[0]),0);
  if(!(tot>0))return '<div class="trk"></div>';
  return `<div class="trk"><div class="stk" style="width:${Math.max(.4,tot/max*100)}%">${parts.filter(p=>p[0]>0).map(([v,col,t])=>`<i style="flex:${v};background:var(${col})" data-tip="${esc(label)} · ${esc(t)}: ${fmtFull(v)}"></i>`).join('')}</div></div>`;
}
function scaleChart(s,compact){
  const c=s.camp,o=s.out;
  const rows=[
    ['Campaign funds raised',c.missing?'No FEC report yet':period(c.start,c.end),c.missing?null:[[c.receipts,'--s1','Campaign funds raised']],c.missing?null:c.receipts],
    ['Outside spending '+(o.multi?'supporting ':'for ')+s.short,period(o.start,o.end),CLS.map(k=>[o.for[k],CLSV[k],CLSN[k]]),o.for.total],
    ['Outside spending '+(o.multi?'opposing ':'against ')+s.short,period(o.start,o.end),CLS.map(k=>[o.against[k],CLSV[k],CLSN[k]]),o.against.total]];
  const max=Math.max(1,...rows.map(r=>r[3]||0));
  const leg=`<div class="legend" style="margin:0 0 10px"><span><i style="background:var(--s1)"></i>Campaign funds</span>${CLS.map(k=>`<span><i style="background:var(${CLSV[k]})"></i>${CLSN[k]} (outside)</span>`).join('')}</div>`;
  const body=rows.map(([l,p,parts,v])=>`<div class="r"><div class="lab"><b>${esc(l)}</b><small>${esc(p)}</small></div>${parts?hbar(parts,max,l):'<div class="trk"><div class="nm">not yet reported</div></div>'}<div class="val">${v==null?'—':fmt$(v)}</div></div>`).join('');
  const table=`<details class="tv"><summary>Show as a table</summary><div class="tablewrap"><table><thead><tr><th>Measure</th><th>Period</th><th class="r">Amount</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r[0])}</td><td class="small">${esc(r[1])}</td><td class="r">${r[3]==null?'—':fmtFull(r[3])}</td></tr>`).join('')}</tbody></table></div></details>`;
  return `<div class="chart"><h3>On the same scale</h3><div class="sub">Three separate amounts, drawn to one scale so their sizes can be compared. They are not added together: the campaign's figure and the outside spending cover different periods, and outside spending never passes through the campaign. Hover a bar for exact amounts.</div>${leg}<div class="hb ch">${body}</div>${compact?'':table}</div>`;
}
function combinedBlock(s){
  const c=s.camp,o=s.out,sm=o.same;
  if(c.missing)return `<div class="chart"><h3>Campaign funds + outside spending</h3><p class="small muted" style="margin:0">Not available: ${esc(s.short)}'s campaign has not filed an FEC financial report yet.</p></div>`;
  if(o.multi||!sm)return `<div class="chart"><h3>Campaign funds + outside spending</h3><p class="small muted" style="margin:0">Not computed for a three-way race, where outside spending against one candidate cannot be credited to a single rival.</p></div>`;
  return `<div class="chart"><h3>Campaign funds + outside spending for ${esc(s.short)}, same period</h3>
    <div class="sub">A combined figure is shown only where both parts cover the same dates: ${period(c.start,sm.end)}.</div>
    <div class="eq"><div><b>${fmtFull(sm.receipts)}</b><span>campaign funds raised</span></div><div class="op">+</div><div><b>${fmtFull(sm.for)}</b><span>outside spending for ${esc(s.short)}, same dates</span></div><div class="op">=</div><div><b>${fmtFull(sm.receipts+sm.for)}</b><span>campaign funds + outside spending</span></div></div>
    <ul class="list small" style="margin-top:10px">
      <li><b>Left out because the dates don't match yet:</b> ${fmtFull(sm.after)} in outside spending for ${esc(s.short)} after ${fmtDate(sm.end)}. Campaign reports covering that period are due Oct. 15, 2026.</li>
      <li><b>Left out by design:</b> outside spending against ${esc(s.short)} (${fmtFull(o.against.total)}), and party coordinated spending, which is reported separately from independent expenditures.</li>
      <li><b>No double counting:</b> PAC and party contributions are already inside campaign funds and are not added again. Independent expenditures are paid by outside groups and never pass through the campaign. Earmarked donations routed through PACs are counted by the FEC as individual contributions, so they are already in campaign funds.</li>
    </ul></div>`;
}
function shareBlock(s){
  return `<div class="note"><b>Super PAC share: withdrawn for now.</b> An earlier version showed a super PAC percentage; it was withdrawn because it divided super PAC spending through Sept. 30, 2026 by campaign receipts through mid-2026, two different periods. It will return only when both parts cover the same dates, using <span class="mono">super PAC spending for the candidate ÷ (campaign funds raised + all outside spending for the candidate)</span>, Jan. 1, 2025 – Sept. 30, 2026, from FEC filings, once the campaigns' Q3 reports (due Oct. 15) are in. It will cover general-election spending only, because primary spending is not in the data used here. The raw figures above are the reliable numbers.</div>`;
}
// outside-spending inspector ---------------------------------------------------
function ieRole(s,r){
  const me=s.fecCand, riv=rivalsOf(s).map(x=>x.fecCand);
  if(r[2]===me)return r[3]==='S'?'for':'against';
  if(riv.includes(r[2]))return s.out.multi?'rival':(r[3]==='O'?'for':'against');
  return 'other';
}
const ROLE_N={for:'For',against:'Against',rival:'Aimed at a rival',other:'Other candidate'};
function ieCommitteeTable(s){
  const o=s.out, multi=o.multi, hasO=o.others.length;
  if(!o.cms.length)return `<p class="small muted">No general-election independent expenditures were reported in this race through ${fmtDate(o.end)}.</p>`;
  const head=`<tr><th>Committee</th><th class="r">${esc(forLabel(s))}</th><th class="r">${esc(agLabel(s))}</th>${multi?'<th class="r">Aimed at rivals</th>':''}${hasO?'<th class="r">Other candidates</th>':''}<th class="r">Items</th><th>Dates</th></tr>`;
  const body=o.cms.map(([ci,f,a,rv,ot,n,d0,d1])=>{const m=cmOf(ci);return `<tr><td><a href="https://www.fec.gov/data/committee/${m[0]}/?cycle=2026" target="_blank" rel="noopener">${esc(m[1])}</a><div><span class="tag">${CLS1[m[2]]||m[2]}</span>${m[5]===1?'<span class="tag">only this race</span>':`<span class="tag">${m[5]} races</span>`}</div>${m[3]?`<div class="small" style="color:var(--ink-2);margin-top:4px">${esc(m[3])}${m[4]?` <a href="${esc(m[4])}" target="_blank" rel="noopener">source ↗</a>`:''}</div>`:''}</td>
    <td class="r">${f?fmtFull(f):'—'}</td><td class="r">${a?fmtFull(a):'—'}</td>${multi?`<td class="r">${rv?fmtFull(rv):'—'}</td>`:''}${hasO?`<td class="r">${ot?fmtFull(ot):'—'}</td>`:''}<td class="r">${n}</td><td class="mono small" style="white-space:nowrap">${d0===d1?fmtDate(d0):fmtDate(d0)+' –<br>'+fmtDate(d1)}</td></tr>`}).join('');
  return `<div class="tablewrap"><table>${'<thead>'+head+'</thead>'}<tbody>${body}</tbody></table></div>`;
}
function rowFlags(r){
  const f=r[7]||'', out=[];
  if(f.includes('d'))out.push(flag('Possible repeat','Same committee, candidate, amount, date and description as an item in an earlier filing, but listed as a separate transaction. It may be the same spending reported twice; it is kept because the filings list it separately.'));
  if(f.includes('p'))out.push(flag('Date capped',`Filed ${fmtDate(r[8])} with a dissemination date of Sept. 30 or later; the data set shows such dates as its Sept. 30 cut-off.`));
  if(f.includes('u'))out.push(flag('Designation uncertain','The filing does not clearly mark this as general-election spending.'));
  return out.length?`<div class="row" style="margin-top:4px;gap:4px">${out.join('')}</div>`:'';
}
function ieItems(s,host){
  const rows=(IE.rows[s.race]||[]).map(r=>({r,role:ieRole(s,r)}));
  if(!rows.length){host.innerHTML='';return}
  const roles=['for','against'].concat(s.out.multi?['rival']:[]).concat(rows.some(x=>x.role==='other')?['other']:[]);
  const cms=[...new Set(rows.map(x=>x.r[1]))].sort((a,b)=>cmOf(a)[1].localeCompare(cmOf(b)[1]));
  let st={role:'',cm:'',n:50,sort:'date'};
  host.innerHTML=`<div class="filters" id="ief"><button class="active" data-r="">All</button>${roles.map(k=>`<button data-r="${k}">${k==='for'?esc(forLabel(s)):k==='against'?esc(agLabel(s)):ROLE_N[k]}</button>`).join('')}</div>
    <div class="toolbar" style="margin:0 0 10px"><label class="small muted">Committee <select id="iec"><option value="">All committees</option>${cms.map(i=>`<option value="${i}">${esc(cmOf(i)[1])}</option>`).join('')}</select></label>
    <label class="small muted">Sort <select id="ies"><option value="date">Newest first</option><option value="amt">Largest first</option></select></label></div>
    <p class="small" id="iesum" style="margin:0 0 8px"></p>
    <div class="tablewrap"><table><thead><tr><th>Date</th><th>Committee</th><th>Aimed at</th><th>Description (as filed)</th><th class="r">Amount</th><th>Filing</th></tr></thead><tbody id="ietb"></tbody></table></div>
    <div id="iemore" style="margin-top:8px"></div>`;
  const draw=()=>{
    let L=rows.filter(x=>(!st.role||x.role===st.role)&&(st.cm===''||x.r[1]===+st.cm));
    L=L.slice().sort(st.sort==='amt'?(a,b)=>b.r[4]-a.r[4]:(a,b)=>b.r[0].localeCompare(a.r[0])||b.r[4]-a.r[4]);
    const tot=L.reduce((a,x)=>a+x.r[4],0);
    host.querySelector('#iesum').innerHTML=`<b class="num">${L.length.toLocaleString()}</b> items · <b class="num">${fmtFull(tot)}</b>${L.some(x=>x.r[4]<0)?' · negative amounts are corrections filed by the committee':''}`;
    host.querySelector('#ietb').innerHTML=L.slice(0,st.n).map(({r,role})=>{const m=cmOf(r[1]);return `<tr><td class="mono" style="white-space:nowrap">${fmtDate(r[0])}</td><td>${esc(m[1])}<div class="small muted">${CLS1[m[2]]||''}</div></td><td><span class="chip ${role==='for'?'dfor':role==='against'?'dag':'ghost'}">${r[3]==='S'?'Supports':'Opposes'} ${esc(candName(r[2]))}</span>${rowFlags(r)}</td><td class="small">${esc(IE.purp[r[5]]||'—')}</td><td class="r">${fmtFull(r[4])}</td><td class="small"><a href="https://docquery.fec.gov/cgi-bin/forms/${m[0]}/${esc(r[6])}/" target="_blank" rel="noopener">${esc(r[6])} ↗</a></td></tr>`}).join('')||'<tr><td colspan="6" class="muted">No items match.</td></tr>';
    host.querySelector('#iemore').innerHTML=L.length>st.n?`<button class="more" id="iemb">Show ${Math.min(50,L.length-st.n)} more of ${(L.length-st.n).toLocaleString()} remaining</button>`:'';
    const b=host.querySelector('#iemb');if(b)b.addEventListener('click',()=>{st.n+=50;draw();});
  };
  host.querySelector('#ief').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;host.querySelector('#ief .active').classList.remove('active');b.classList.add('active');st.role=b.dataset.r;st.n=50;draw();});
  host.querySelector('#iec').addEventListener('change',e=>{st.cm=e.target.value;st.n=50;draw();});
  host.querySelector('#ies').addEventListener('change',e=>{st.sort=e.target.value;draw();});
  draw();
}
// PAC contributions inspector -------------------------------------------------
function pacCoverage(s){
  const p=s.pac,c=s.camp;
  if(!p.filings.length)return `<div class="note">${c.missing?'No FEC reports have been filed yet, so there are no itemized PAC contributions to show.':`No PAC contribution rows were itemized for ${esc(s.short)}${c.pac?` (the FEC summary shows ${fmtFull(c.pac)} from PACs and other committees in 2025–26)`:''}.`}</div>`;
  const notIt=(c.pac||0)-p.subtotal;
  const over=p.filings.filter(f=>f.over);
  return `<p class="small" style="margin:0 0 8px">Rows from <b>${p.filings.length}</b> reports covering <b>${esc(p.window)}</b>. They add to <b class="num">${fmtFull(p.retrieved)}</b>; the same reports list <b class="num">${fmtFull(p.subtotal)}</b> in PAC contributions, so ${term('coverage',`<b>${p.coverage}% coverage</b>`)}.${!c.missing&&c.pac!=null?` The FEC summary shows <b class="num">${fmtFull(c.pac)}</b> from PACs and other committees for ${period(c.start,c.end)}${notIt>500?`; <b class="num">${fmtFull(notIt)}</b> of it is in reports not itemized here`:''}.`:''}</p>
  ${p.coverage!=null&&p.coverage<95?`<div class="row" style="margin-bottom:8px">${flag('Incomplete rows',`Only ${p.coverage}% of the PAC money in these reports could be read row by row; the missing rows are not shown or guessed.`)}</div>`:''}
  ${over.length?`<div class="note" style="margin-bottom:8px"><b>Check needed:</b> ${over.map(f=>`the ${esc(f.report)} transcription adds to ${fmtFull(f.retrieved-f.subtotal)} more than the report's own subtotal`).join('; ')}, so a row may be duplicated. Compare with the linked report before relying on individual rows.</div>`:''}
  ${p.gap?`<p class="small muted" style="margin:0 0 8px">${esc(p.gap)}</p>`:''}`;
}
function pacSectors(s){
  const p=s.pac;if(!p.byCat.length)return '';
  const max=Math.max(...p.byCat.map(c=>c[1]));
  return `<div class="chart"><h3>Itemized PAC contributions by sector</h3><div class="sub">${fmtFull(p.retrieved)} from ${p.nPacs} committees (${esc(p.window)}). Sectors are assigned by this app from each committee's name and sponsor, not reported by the FEC; committees that could not be identified are left unclassified rather than guessed.</div>
    <div class="bars">${p.byCat.map(([k,v])=>`<div class="r"><div class="lab" title="${esc(DATA.categories[k])}">${esc(DATA.categories[k])}</div><div class="track"><b style="width:${Math.max(1,v/max*100)}%" data-tip="${esc(DATA.categories[k])}: ${fmtFull(v)} (${pct(v,p.retrieved)}%)"></b></div><div class="val">${fmt$(v)}</div></div>`).join('')}</div></div>`;
}
function pacTable(s,host){
  const p=s.pac;if(!p.rows.length){host.innerHTML='';return}
  let st={q:'',k:'amt',dir:-1,n:50};
  host.innerHTML=`<div class="toolbar" style="margin:0 0 10px"><div class="search" style="margin:0"><input id="pq" type="search" placeholder="Filter by committee or sector" aria-label="Filter PAC contributions"></div></div>
    <p class="small" id="psum" style="margin:0 0 8px"></p>
    <div class="tablewrap"><table id="pt"><thead><tr><th><button data-k="name">Contributor (as filed)</button></th><th><button data-k="cat">Sector (assigned)</button></th><th><button data-k="rep">Report and period</button></th><th class="r"><button data-k="amt">Amount</button></th></tr></thead><tbody></tbody></table></div><div id="pmore" style="margin-top:8px"></div>`;
  const R=p.rows.map(r=>({name:DATA.pacNames[r[0]],amt:r[1],cat:DATA.categories[r[2]]||r[2],fi:r[3],rep:p.filings[r[3]].start,orient:(DATA.pacOrient||{})[r[0]]}));
  const draw=()=>{
    const q=st.q.toLowerCase();
    let L=R.filter(x=>!q||(x.name+' '+x.cat).toLowerCase().includes(q));
    L.sort((a,b)=>{const x=a[st.k],y=b[st.k];return (typeof x==='number'?x-y:String(x).localeCompare(String(y)))*st.dir||b.amt-a.amt});
    host.querySelector('#psum').innerHTML=`<b class="num">${L.length.toLocaleString()}</b> contributions · <b class="num">${fmtFull(L.reduce((a,x)=>a+x.amt,0))}</b>. The FEC lists these by report, so each row shows its report period, not an exact date.`;
    host.querySelector('#pt tbody').innerHTML=L.slice(0,st.n).map(x=>{const f=p.filings[x.fi];return `<tr><td>${esc(x.name)}${x.orient?`<div class="small muted">${esc(x.orient)}</div>`:''}</td><td class="small">${esc(x.cat)}</td><td class="small"><a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.report)}</a><div class="muted">${fmtDate(f.start)} – ${fmtDate(f.end)}</div></td><td class="r">${fmtFull(x.amt)}</td></tr>`}).join('')||'<tr><td colspan="4" class="muted">No rows match.</td></tr>';
    host.querySelector('#pmore').innerHTML=L.length>st.n?`<button class="more" id="pmb">Show ${Math.min(50,L.length-st.n)} more of ${(L.length-st.n).toLocaleString()} remaining</button>`:'';
    const b=host.querySelector('#pmb');if(b)b.addEventListener('click',()=>{st.n+=50;draw();});
  };
  host.querySelector('#pq').addEventListener('input',e=>{st.q=e.target.value;st.n=50;draw();});
  host.querySelector('#pt thead').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const k=b.dataset.k;st=Object.assign(st,st.k===k?{dir:-st.dir}:{k,dir:k==='amt'?-1:1});draw();});
  draw();
}
function topSpenders(s,role,n){
  const idx=role==='for'?1:2;
  return s.out.cms.filter(x=>x[idx]>0).sort((a,b)=>b[idx]-a[idx]).slice(0,n).map(x=>({name:cmOf(x[0])[1],cls:cmOf(x[0])[2],amt:x[idx]}));
}

// ---------- routing ----------
let homeCh='', cmpCh='S';
// Older profile links (#id-record, #id-funding, ...) still work: each opens the tab that now holds that content, and the spot on it.
const TAB_ALIAS={record:['match','m-record'],align:['match'],statements:['promises'],funding:['finance'],superpacs:['finance','f-out'],latest:['finance','live-records'],bills:['match','live-records'],funders:['pvp','rec-funders'],money:['pvp','rec-money']};
function route(){
  resizers=[];tip.classList.remove('show');
  const h=(location.hash||'#home').slice(1);
  const m=h.match(/^([a-zA-Z0-9]+)(?:-([a-z]+))?$/)||[];
  document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('active',a.dataset.route===m[1]||(a.dataset.route==='home'&&!!byId[m[1]])));
  if(!h||m[1]==='home'){homeCh=m[2]==='senate'?'S':m[2]==='house'?'H':m[2]==='candidates'?'C':homeCh;renderHome();}
  else if(m[1]==='updates'){window.RecordLive.dashboard(app);}
  else if(m[1]==='races'){renderRaces();}
  else if(m[1]==='compare'){if(m[2])cmpCh=m[2]==='house'?'H':'S';renderCompare();}
  else if(m[1]==='method'){renderMethod();if(m[2]){const t=document.getElementById('method-'+m[2]);if(t)setTimeout(()=>t.scrollIntoView({block:'start'}),0);}}
  else if(m[1]==='scores'){renderScores(m[2]||'match');}
  else if(m[1]==='align'){renderAlign();}
  else if(byId[m[1]]){const [tb,foc]=TAB_ALIAS[m[2]]||[m[2]||'overview'];renderProfile(byId[m[1]],tb,foc||null);}
  else if(m[2]==='latest'){window.RecordLive.standalone(app,m[1]);}
  else renderHome();
  window.scrollTo({top:0});
}
window.addEventListener('hashchange',route);

// ---------- home cards: who they are, four A-F grades, campaign and outside money, outside money by month ----------
const GRADE_TIP={
  match:'How their documented record compares with the positions you chose in My alignment. Votes, sponsorships and official acts count fully; an issue backed only by statements counts at half its importance. Needs evidence on at least 3 of your issues.',
  prom:`Checked promises and stated positions: 1 if the record supports it, ½ if partly supported or the position changed, 0 if contradicted, including a promise never acted on by the end of the term. Ambiguous checks, outcome checks, promises with no related bill yet and vague goals are left out. For a president, PolitiFact's promise-tracker ratings count the same way: Promise Kept 1, Compromise ½, Promise Broken 0, with Stalled and In the Works left out. Needs ${MIN_CHECKS} counted checks.`,
  eth:`Starts at 100: −${ETHICS_COST.finding} per confirmed finding, −${ETHICS_COST.open} per open investigation, −${ETHICS_COST.closed} per investigation closed without a finding. Stock trading: −${TRADE_COST.late} per late or missing disclosure and −${TRADE_COST.conflict} per trade in a sector their committees oversee, each capped at ${TRADE_COST.lateCap}. Allegations are listed but not scored.`,
  pvp:`Higher means their record delivered more for working people; lower means more for the wealthy and corporations. Counts votes and sponsorships on bills that a cited nonpartisan analysis shows mostly help lower- and middle-income households, or mostly the wealthy and corporations. A Yea or a sponsorship takes the bill's side and a Nay the other, one credit per bill; for a president, signing a bill or issuing an executive order takes its side and a veto the other. Needs ${MIN_PVP_ACTIONS} scored actions.`
};
const initials=n=>{const w=n.replace(/\b(Jr|Sr|III|II)\b\.?/g,'').split(/\s+/).filter(x=>/^[A-Z][a-z'-]/.test(x));return ((w[0]||'?')[0]+(w.length>1?w[w.length-1][0]:'')).toUpperCase()};
// Portrait: a cut-out photo standing in a party-colored circle, head rising above its top edge (public/portraits/,
// built by scripts/build-portraits.py). Without a photo, or if it fails to load, the same circle shows initials.
const PORTRAITS=window.PORTRAITS||{};
function portrait(s){
  const p=PORTRAITS[s.id], ini=initials(s.name);
  return p?`<div class="hc-pv ${s.party}" data-ini="${ini}"><img src="/${esc(p.file)}" alt="" width="88" height="104" loading="lazy" decoding="async"></div>`
    :`<div class="hc-pv ${s.party} ini" aria-hidden="true"><span>${ini}</span></div>`;
}
document.addEventListener('error',e=>{
  const pv=e.target.tagName==='IMG'&&e.target.parentNode.classList.contains('hc-pv')?e.target.parentNode:null;if(!pv)return;
  const span=document.createElement('span');span.textContent=pv.dataset.ini;pv.replaceChildren(span);pv.classList.add('ini');pv.setAttribute('aria-hidden','true');
},true);
function gradeTile(label,pct,detail,tip,extra='',href=''){
  const g=pct==null?null:letter(pct), t=href?'a':'div';
  return `<${t} class="hc-gt"${href?` href="${href}"`:''} title="${esc(tip)}"><div class="hc-gl">${label}</div><div class="hc-gv">${g?`<b class="gr-${g}">${g}</b><span>${pct}%</span>`:'<span class="hc-ng">Not graded</span>'}</div>${extra}<div class="hc-gd">${detail}</div></${t}>`;
}
// With links, each tile opens that grade's tab on the profile (not on the home cards, which are links themselves).
function reportCard(s,links){
  const m=scoreFor(s), pr=SCORER.promises(s), e=personEthics(s), v=personPvp(s), h=k=>links?`#${s.id}-${k}`:'';
  const md=!m.nChosen?'Choose issues in My alignment':m.score==null?`evidence on ${m.nCov} of ${m.nChosen} issues`:`${m.nCov} of your ${m.nChosen} issues`;
  const bar=pr.pct!=null?`<div class="hc-seg" aria-hidden="true">${pr.kept?`<i style="flex:${pr.kept};background:var(--good)"></i>`:''}${pr.half?`<i style="flex:${pr.half};background:var(--warn)"></i>`:''}${pr.broken?`<i style="flex:${pr.broken};background:var(--crit)"></i>`:''}</div>`:'';
  const pd=pr.pct!=null?`${pr.kept} of ${pr.clear} kept`:pr.total?`${pr.clear} of ${MIN_CHECKS} clear checks`:'no checks yet';
  const ed=[e.finding&&`${e.finding} finding${e.finding>1?'s':''}`,e.open&&`${e.open} open inquir${e.open>1?'ies':'y'}`,e.closed&&`${e.closed} closed inquir${e.closed>1?'ies':'y'}`,e.allegation&&`${e.allegation} allegation${e.allegation>1?'s':''}`,e.late&&`${e.late} late report${e.late>1?'s':''}`,e.conflict&&`${e.conflict} conflict trade${e.conflict>1?'s':''}`].filter(Boolean).join(' · ')||'none located';
  const vd=v.pct!=null?`${v.people} of ${v.n} actions for working people`:v.n?`${v.n} of ${MIN_PVP_ACTIONS} scored actions`:PVP_MARKS.size?'no scored actions yet':'no bills scored yet';
  return `<div class="hc-rc">${gradeTile('Your match',m.score,md,GRADE_TIP.match,'',h('match'))}${gradeTile('Promises delivered',pr.pct,pd,GRADE_TIP.prom,bar,h('promises'))}${gradeTile('Ethics',e.pct,ed,GRADE_TIP.eth,'',h('ethics'))}${gradeTile('People over profit',v.pct,vd,GRADE_TIP.pvp,'',h('pvp'))}</div>`;
}
// Promises, Ethics and People over profit are recalculated monthly after review (public/score-log.json). The tab says
// when, and marks a grade that reviewed edits have changed since; the next monthly run logs it.
function monthlyNote(s,key,pct){
  const last=(window.SCORELOG||[]).at(-1);if(!last)return '';
  const was=last.scores[s.id]?.[key];
  return `<p class="small muted gh-mo">Recalculated monthly; last on ${fmtDate(last.date)}.${was&&was.pct!==pct?` <b>Changed since then</b> (was ${was.pct==null?'not graded':was.pct+'%'}): the next monthly recalculation will log why.`:''} <a href="#method-log">Change log</a></p>`;
}
// The top of each grade tab: the letter and percentage, what it is based on, and the rule.
function gradeHead(title,pct,detail,rule,extra=''){
  const g=pct==null?null:letter(pct);
  return `<div class="gh"><div class="gh-g">${g?`<b class="gr-${g}">${g}</b><span>${pct}%</span>`:'<span class="gh-ng">Not graded</span>'}</div>
    <div class="gh-t"><h2>${title}</h2><div class="gh-d">${detail}</div>${extra}<p class="small muted gh-r">${rule} <a href="#method">How the grades work</a></p></div></div>`;
}
function homeMonths(asof=DATA.ie_asof){const end=asof.slice(0,7), out=[];let y=+end.slice(0,4), k=+end.slice(5,7);for(let i=0;i<7;i++){out.unshift(`${y}-${String(k).padStart(2,'0')}`);if(--k<1){k=12;y--;}}return out;}
// Outside money by month: for and against side by side, with the month's for-to-against ratio as a line on its own scale (right).
const RATIO_TICKS=[[1,'all for'],[.75,'3 : 1'],[.5,'1 : 1'],[.25,'1 : 3'],[0,'all against']];
// live, when given, is outside spending from the daily FEC refresh ({end, items:[{date, amount, role}]}) instead of the
// reviewed race data.
function miniOutside(s,bare,live){
  const asof=live?live.end:DATA.ie_asof, months=homeMonths(asof), M=Object.fromEntries(months.map(m=>[m,{f:0,a:0}]));
  const items=live?live.items:(IE.rows[s.race]||[]).map(r=>({date:r[0],amount:r[4],role:ieRole(s,r)}));
  for(const x of items){const mo=x.date.slice(0,7);if(!M[mo])continue;if(x.role==='for')M[mo].f+=x.amount;else if(x.role==='against')M[mo].a+=x.amount;}
  const fw=s.out.multi?'supporting':'for', aw=s.out.multi?'opposing':'against';
  const max=Math.max(0,...months.map(m=>Math.max(M[m].f,M[m].a)));
  const F=months.reduce((t,m)=>t+M[m].f,0), A=months.reduce((t,m)=>t+M[m].a,0), q=moneyRatio(F,A);
  const badge=q?`<span class="hc-ratio" title="${esc(`For-to-against ratio of outside money in the months charted: ${fmtFull(F)} ${fw} ${s.short}, ${fmtFull(A)} ${aw}.`)}">${q.oneSided?`<b class="${q.side}">${q.text[0].toUpperCase()+q.text.slice(1)}</b>`:`For-to-against <b class="${q.side}">${q.text}</b>`}</span>`:'';
  const head=`<div class="hc-mh"><span>${bare?'':'Outside money by month'}${badge}</span><span>${MON[+months[0].slice(5,7)-1]} – <b>${fmtDate(asof)}</b></span></div>`;
  if(!max)return `<div class="hc-mini">${head}<p class="small muted" style="margin:4px 0 0">No outside spending reported in these months.</p></div>`;
  const W=280,top=6,base=96,gw=W/7,bw=14,y=sh=>top+(1-sh)*(base-top);
  let svg=RATIO_TICKS.slice(1,4).map(([sh])=>`<line class="${sh===.5?'hc-g1':'hc-g'}" x1="0" x2="${W}" y1="${y(sh)}" y2="${y(sh)}"></line>`).join('');
  const pts=months.map((m,i)=>{const {f,a}=M[m], x0=i*gw+(gw-2*bw-2)/2, r=moneyRatio(f,a);
    if(f>0){const h=Math.max(1.5,f/max*(base-top));svg+=`<rect class="hc-f" x="${x0.toFixed(1)}" y="${(base-h).toFixed(1)}" width="${bw}" height="${h.toFixed(1)}"></rect>`;}
    if(a>0){const h=Math.max(1.5,a/max*(base-top));svg+=`<rect class="hc-a" x="${(x0+bw+2).toFixed(1)}" y="${(base-h).toFixed(1)}" width="${bw}" height="${h.toFixed(1)}"></rect>`;}
    return r&&{x:(i*gw+gw/2).toFixed(1),y:y(r.share).toFixed(1),m,r};});
  svg+=`<line class="hc-z" x1="0" x2="${W}" y1="${base}" y2="${base}"></line>`;
  // The line breaks over a month with no outside money, since it has no ratio.
  const d=pts.map((p,i)=>p?`${pts[i-1]?'L':'M'}${p.x} ${p.y}`:'').join('');
  if(d)svg+=`<path class="hc-rl-h" d="${d}"></path><path class="hc-rl" d="${d}"></path>`;
  svg+=pts.filter(Boolean).map(p=>`<path class="hc-rd" d="M${p.x} ${p.y}h0"></path>`).join('');
  svg+=months.map((m,i)=>{const {f,a}=M[m],r=pts[i];return `<rect class="hc-hit" x="${(i*gw).toFixed(1)}" y="0" width="${gw.toFixed(1)}" height="100"><title>${esc(`${monLabel(m)}: ${fmt$(f)} ${fw}, ${fmt$(a)} ${aw}${!r?'':r.r.oneSided?` · ${r.r.text}`:` · for-to-against ${r.r.text}`}`)}</title></rect>`}).join('');
  const label=months.map((m,i)=>`${monLabel(m)}: ${fmt$(M[m].f)} ${fw}, ${fmt$(M[m].a)} ${aw}${pts[i]?`, ratio ${pts[i].r.text}`:''}`).join('; ');
  const rax=RATIO_TICKS.map(([sh,t])=>`<span style="top:${y(sh)}%">${t}</span>`).join('');
  return `<div class="hc-mini">${head}<div class="hc-plot"><svg viewBox="0 0 ${W} 100" preserveAspectRatio="none" role="img" aria-label="${esc(`Outside spending by month, with the for-to-against ratio. ${label}`)}">${svg}</svg><div class="hc-rax" aria-hidden="true">${rax}</div></div>
    <div class="hc-mx" aria-hidden="true">${months.map(m=>`<span>${MON[+m.slice(5,7)-1]}</span>`).join('')}</div>
    <div class="hc-ms"><span><i class="sw" style="background:var(--s3)"></i>${fw}</span><span><i class="sw" style="background:var(--s2)"></i>${aw}</span><span><i class="hc-ln"></i>ratio, right scale</span><span>tallest bar ${fmt$(max)}</span></div></div>`;
}
// A titled section of a home card: the grades ("Report Card"), then the money ("Money & Influence Analysis").
const hcHead=(icon,cls,title,sub)=>`<div class="hc-sh"><h4><i class="${cls}" aria-hidden="true">${icon}</i>${title}</h4><p>${sub}</p></div>`;
function homeCard(s){
  const c=s.camp, o=s.out, it=ideoText(s), race=raceOf(s), riv=rivalsOf(s);
  const ideo=s.cand&&!s.ideo&&s.ideoKind!=='former_text'&&s.ideoKind!=='state'?`No voting score · ${REC_LABEL[s.recordType]||it.short}`:it.short;
  const sub=s.cand?`${s.openSeat?'Open seat':s.term} · ${s.since}`:`In the ${CH[s.chamber].name} since ${String(s.since).split(' (')[0]} · ${s.term}`;
  return `<article class="card sen-card hc" tabindex="0" data-id="${s.id}" role="link" aria-label="Open profile of ${esc(s.name)}">
    <div class="hc-top">${portrait(s)}<div class="hc-who">
      <div class="row" style="gap:5px"><span class="chip ${s.party}">${s.party} · ${esc(seatLabel(s))}</span><span class="chip ch">${chipCh(s)}</span></div>
      <div class="name">${esc(s.name)}</div><div class="hc-sub">${esc(sub)}</div></div></div>
    <div class="hc-ideo">${esc(ideo)}</div>
    ${hcHead('✓','rc','Report Card','Four A–F grades from the documented record and your own answers')}
    ${reportCard(s)}
    ${hcHead('$','mi','Money &amp; Influence Analysis','Who pays for the campaign, and who spends for and against it')}
    <div class="hc-money">
      <div class="hc-mt">${c.missing?'<b class="hc-na">Not yet reported</b><span>Campaign funds raised</span><small>no FEC report filed yet</small>':`<b>${fmt$(c.receipts)}</b><span>Campaign funds raised</span><small>${shortPer(c.end)}</small>`}</div>
      <div class="hc-mt"><b class="hc-two"><i class="sw" style="background:var(--s3)"></i>${fmt$(o.for.total)} <em>${o.multi?'supporting':'for'}</em><br><i class="sw" style="background:var(--s2)"></i>${fmt$(o.against.total)} <em>${o.multi?'opposing':'against'}</em></b><span>Outside money</span><small>${shortPer(o.end)}</small></div>
    </div>
    ${miniOutside(s)}
    <div class="hc-ft"><span>${race?esc(race.label):''}</span><span class="hc-vs">${riv.length?'vs. '+esc(riv.map(x=>x.short).join(', ')):'No profiled opponent'}</span></div>
  </article>`;
}
// The featured card (the president): the same Report Card and Money & Influence Analysis as the others. Not being on the
// 2026 ballot, there is no reviewed race money, so the money comes from the daily FEC refresh of the committee that
// still files (filled in by fillFeatured).
function featuredCard(s){
  return `<article class="card sen-card hc hc-feat" tabindex="0" data-id="${s.id}" role="link" aria-label="Open profile of ${esc(s.name)}">
    <div class="hc-top">${portrait(s)}<div class="hc-who">
      <div class="row" style="gap:5px"><span class="chip ${s.party}">${s.party} · ${esc(seatLabel(s))}</span><span class="chip ch">${chipCh(s)}</span></div>
      <div class="name">${esc(s.name)}</div><div class="hc-sub">${esc(s.term)}</div></div></div>
    <div class="hc-ideo">${esc(REC_SHORT[s.recordType]||'')} · ${esc(s.seat)}</div>
    ${hcHead('✓','rc','Report Card','Four A–F grades from the documented record and your own answers')}
    ${reportCard(s)}
    ${hcHead('$','mi','Money &amp; Influence Analysis',`Money raised by ${esc(s.cmteName||'the campaign committee')}, and outside spending for and against ${esc(s.short)}, from the daily FEC refresh`)}
    <div class="hc-live" data-live="${s.id}">${featuredMoney(s,null)}</div>
    <div class="hc-ft"><span>Not on the 2026 ballot</span><span class="hc-vs">Open profile →</span></div>
  </article>`;
}
// p is the person's refreshed records (/api/profile), null while loading, or false when the refresh is unreachable.
function featuredMoney(s,p){
  const c=p&&p.sections.campaign, o=p&&p.sections.outside;
  const wait=p===null?'Loading…':p===false?'Refresh unavailable':'Waiting for the FEC refresh';
  const camp=c?`<b>${fmt$(c.receipts)}</b><span>Campaign funds raised</span><small>${shortPer(c.end)}</small>`:`<b class="hc-na">${wait}</b><span>Campaign funds raised</span><small>${esc(s.fecCmte)}, 2025–26</small>`;
  const out=o?`<b class="hc-two"><i class="sw" style="background:var(--s3)"></i>${fmt$(o.support)} <em>for</em><br><i class="sw" style="background:var(--s2)"></i>${fmt$(o.oppose)} <em>against</em></b><span>Outside money</span><small>${shortPer(o.through)}</small>`:`<b class="hc-na">${wait}</b><span>Outside money</span><small>2025–26</small>`;
  const mini=o?miniOutside(s,false,{end:o.through,items:(o.rows||[]).map(r=>({date:r.date,amount:r.amount,role:r.direction==='S'?'for':'against'}))})
    :`<div class="hc-mini"><div class="hc-mh"><span>Outside money by month</span></div><p class="small muted" style="margin:4px 0 0">${p===false?'The refreshed FEC records are unavailable right now.':p===null?'Loading the refreshed FEC records…':'Fills in from the daily FEC refresh.'}</p></div>`;
  return `<div class="hc-money"><div class="hc-mt">${camp}</div><div class="hc-mt">${out}</div></div>${mini}`;
}
async function fillFeatured(){
  for(const el of document.querySelectorAll('.hc-live')){
    const s=byId[el.dataset.live];let p=false;
    try{const r=await fetch('/api/profile?id='+encodeURIComponent(s.id),{cache:'no-store'});if(r.ok)p=await r.json();}catch{}
    if(el.isConnected)el.innerHTML=featuredMoney(s,p&&p.sections?p:false);
  }
}
const gradeHow=()=>`<section class="hc-how" aria-labelledby="hc-how-h"><h2 id="hc-how-h" style="font-size:1.05rem">How the grades work</h2>
  <div class="hc-howg">
    <div><h3>Your match</h3><p>${GRADE_TIP.match} It uses your own choices, saved only in this browser.</p></div>
    <div><h3>Promises delivered</h3><p>${GRADE_TIP.prom}</p></div>
    <div><h3>Ethics</h3><p>${GRADE_TIP.eth}</p></div>
    <div><h3>People over profit</h3><p>${GRADE_TIP.pvp}</p></div>
    <div><h3>Grade scale</h3><p><b class="gr-A">A</b> 90–100 · <b class="gr-B">B</b> 80–89 · <b class="gr-C">C</b> 70–79 · <b class="gr-D">D</b> 60–69 · <b class="gr-F">F</b> below 60. "Not graded" means too little evidence, never a zero. <a href="#method">Full rules</a></p></div>
  </div></section>`;
let homeSort='';

// ---------- home ----------
function renderHome(){
  const nS=ALL.filter(s=>s.chamber==='S'&&(!s.cand||s.senInc)).length, nH=MEM.filter(s=>s.chamber==='H').length, nC=CANDS.filter(s=>!s.senInc).length, nComp=DATA.races.filter(r=>r.chamber==='S'&&r.competitive).length;
  app.innerHTML=`
  <section class="hero${FEATURED.length?' hero-feat':''}">
    <div class="hero-text">
    <div class="asof">Research snapshot · ${esc(DATA.asof)}</div>
    <h1 style="margin-top:8px">What they said. What they did. Who paid for it.</h1>
    <p class="lede">${nS} senators and ${nH} House members on the November 3, 2026 ballot, their ${CANDS.filter(c=>!c.openSeat&&!c.senInc).length} opponents, and ${CANDS.filter(c=>c.openSeat).length} nominees for ${DATA.races.filter(r=>r.open).length} open Senate seats: ${DATA.races.length} races, including all ${nComp} Senate races rated competitive by Cook, Inside Elections or Sabato. Profiled from official records: FEC filings, roll-call votes, state legislative records, ethics findings and court records. Every profile shows the voting or official record, the money the campaign raised, outside groups' spending for and against the candidate (kept separate), and statements checked against actions. Every entry links to its source. Each card grades four things from A to F, with the percentage beside each, and says "Not graded" rather than guessing when the evidence is thin.</p>
    </div>
    ${FEATURED.length?`<aside class="hero-side" aria-label="Featured profile">${FEATURED.map(featuredCard).join('')}</aside>`:''}
    <div class="toolbar">
      <div class="seg" id="chs" role="group" aria-label="Chamber"><button data-c="" class="${homeCh===''?'active':''}">All ${ALL.length}</button><button data-c="S" class="${homeCh==='S'?'active':''}">Senators</button><button data-c="H" class="${homeCh==='H'?'active':''}">House</button><button data-c="C" class="${homeCh==='C'?'active':''}">Challengers & candidates</button></div>
      <div class="search"><input id="q" type="search" placeholder="Search by name, state or district" aria-label="Search members"></div>
      <label class="small muted">Sort <select id="hsort" aria-label="Sort candidates"><option value="">Default</option><option value="out">Most outside money</option><option value="camp">Most campaign money</option><option value="name">Name</option></select></label>
    </div>
  </section>
  <div class="grid hc-grid" id="cards"></div>
  ${gradeHow()}
  <section class="section">
    <div class="cols">
      <div class="card"><h3>Head-to-head races</h3><p class="small" style="margin-top:6px">Each candidate next to their 2026 opponents: campaign funds, cash on hand, and outside groups' spending for and against each side, shown separately.</p><a class="cta" href="#races">See the ${DATA.races.length} races</a></div>
      <div class="card"><h3>Compare the record</h3><p class="small" style="margin-top:6px">Senate and House vote matrices on consequential roll calls since 2021, plus ideology, campaign funds and outside spending side by side.</p><a class="cta" href="#compare">Open the comparison</a></div>
      <div class="card"><h3>How the numbers work</h3><p class="small" style="margin-top:6px">Ideology percentiles come from Voteview's DW-NOMINATE scores. Every money figure carries its period and source. The methodology page explains every rule, what changed in this version, and every known gap.</p><a class="cta" href="#method">Read the methodology</a></div>
    </div>
  </section>`;
  const cards=$('#cards');
  const draw=q=>{
    q=(q||'').trim().toLowerCase();
    const list=ALL.filter(s=>(!homeCh||(homeCh==='C'?(s.cand&&!s.senInc):((!s.cand||s.senInc)&&s.chamber===homeCh)))&&(!q||[s.name,s.state,s.stateName,s.district||'',s.cand?(s.openSeat?'senate candidate open seat':'challenger '+(s.chamber==='S'?'senate':'house')):s.chamber==='S'?'senate senator':'house representative',partyName(s.party)].join(' ').toLowerCase().includes(q)));
    const key={out:s=>-(s.out.for.total+s.out.against.total),camp:s=>s.camp.missing?1:-s.camp.receipts,name:s=>s.name.split(' ').pop()+' '+s.name}[homeSort];
    if(key)list.sort((x,y)=>{const a=key(x),b=key(y);return typeof a==='number'?a-b:String(a).localeCompare(String(b))});
    cards.innerHTML=list.map(homeCard).join('')||`<p class="muted">No one matches that search. This release covers ${ALL.length} people in ${DATA.races.length} races; the methodology page explains how they were chosen.</p>`;
  };
  draw('');
  $('#q').addEventListener('input',e=>draw(e.target.value));
  const hs=$('#hsort');hs.value=homeSort;hs.addEventListener('change',e=>{homeSort=e.target.value;draw($('#q').value);});
  $('#chs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;homeCh=b.dataset.c;$('#chs .active').classList.remove('active');b.classList.add('active');draw($('#q').value);});
  fillFeatured();
  for(const host of [cards,$('.hero-side')].filter(Boolean)){
    host.addEventListener('click',e=>{const c=e.target.closest('.sen-card');if(c)location.hash=c.dataset.id;});
    host.addEventListener('keydown',e=>{const c=e.target.closest('.sen-card');if(c&&(e.key==='Enter'||e.key===' ')){e.preventDefault();location.hash=c.dataset.id;}});
  }
}

// ---------- profile ----------
// Overview, then one tab per home-card grade, then the money.
const TABS=[['overview','Overview'],['match','Your match'],['promises','Promises Delivered'],['ethics','Ethics'],['pvp','People Over Profit'],['finance','Money &amp; Influence']];
const tabsFor=s=>TABS;
const PANES={overview:(...a)=>paneOverview(...a),match:(...a)=>paneMatch(...a),promises:(...a)=>panePromises(...a),ethics:(...a)=>paneEthics(...a),pvp:(...a)=>panePvp(...a),finance:(...a)=>paneFinance(...a),sources:(...a)=>paneSources(...a)};
function renderProfile(s,tab,focus){
  if(!PANES[tab])tab='overview';
  app.innerHTML=`
  <header class="phead">
    <div class="top"><div>
      <div class="row"><span class="chip ch">${chipCh(s)}</span><span class="chip ${s.party}">${partyName(s.party)} · ${esc(s.stateName)}${s.chamber==='H'?' · '+esc(s.district):''}</span><span class="chip ghost">${esc(s.term)}</span></div>
      <h1 style="margin-top:8px">${esc(s.name)}</h1>
      ${s.cand?`<p class="small" style="margin:8px 0 0;color:var(--ink-2);max-width:80ch">${esc(s.status)}${s.statusSrc?` <a href="${esc(s.statusSrc.u)}" target="_blank" rel="noopener">${esc(s.statusSrc.t)} ↗</a>`:''}</p>${s.background?`<p class="small muted" style="margin:4px 0 0;max-width:80ch">${esc(s.background)}</p>`:''}`:''}
    </div></div>
    <div class="meta">
      <div><span>${s.office?'In office':s.cand?'Current or most recent role':'In the '+CH[s.chamber].name+' since'}</span>${esc(s.since)}</div>
      ${s.office?`<div><span>2026 ballot</span>${esc(s.seat)}</div>`:`<div><span>2026 ${s.cand?'opponents':'opponent'}</span>${esc(s.opponent)} · <a href="#races">race view</a></div>`}
      <div class="roles"><span>${s.cand?'Offices held':'Committees / roles'}</span>${esc(s.roles||'None')}</div>
      <div><span>Identifiers</span><span class="mono" style="display:inline;color:var(--ink-2);text-transform:none;letter-spacing:0;font-size:.82rem">FEC ${esc(s.fecCand)}${s.office&&s.fecCmte?' · committee '+esc(s.fecCmte):''}${s.bioguide?' · Bioguide '+esc(s.bioguide):''}</span></div>
    </div>
    <div class="links row">
      <a href="${fecCandUrl(s.fecCand)}" target="_blank" rel="noopener">FEC candidate summary ↗</a>
      ${s.bioguide?`<a href="${cgUrl(s)}" target="_blank" rel="noopener">Congress.gov member page ↗</a>`:''}
      ${s.site?`<a href="${esc(s.site)}" target="_blank" rel="noopener">${s.cand&&!s.office?'Campaign site':'Official site'} ↗</a>`:''}
      <a href="#${s.id}-sources">All sources for this profile →</a>
    </div>
  </header>
  <div class="tabs"><div class="wrap" style="padding-inline:0" id="tabs">${tabsFor(s).map(([k,l])=>`<button data-tab="${k}" class="${k===tab?'active':''}">${l}</button>`).join('')}</div></div>
  <section class="section" id="pane"></section>`;
  $('#tabs').addEventListener('click',e=>{const b=e.target.closest('button');if(b){location.hash=`${s.id}-${b.dataset.tab}`;}});
  const pane=$('#pane');
  PANES[tab](s,pane,focus);
  if(focus){const t=document.getElementById(focus);if(t)setTimeout(()=>t.scrollIntoView({block:'start'}),50);}
  const act=$('#tabs .active');if(act)act.scrollIntoView({block:'nearest',inline:'center'});
}
function tiles(items){return `<div class="tiles">${items.map(t=>`<div class="tile"><div class="l">${t[0]}</div><div class="v">${t[1]}</div><div class="d">${t[2]||''}</div></div>`).join('')}</div>`}
const statedVotes=s=>CH[icH(s)].votes.filter(v=>s.id in v.pos&&!/not in office/i.test(v.pos[s.id])).length;

// ---------- overview: five quick visuals and a short ethics list ----------
const ovPct=(v,t)=>{const p=v/t*100;return p<0.5?'<1%':Math.round(p)+'%'};
function ovCard(kicker,title,sub,body,foot,cls){
  return `<section class="chart ov-card ${cls||''}"><div class="kicker">${kicker}</div><h3>${title}</h3><p class="sub">${sub}</p>${body}${foot?`<p class="ov-foot small muted">${foot}</p>`:''}</section>`;
}
// 1. where the campaign's money comes from: one bar, parts of FEC total receipts (none counted twice)
function ovMoney(s,here){
  const c=s.camp, T='Where the campaign’s money comes from';
  if(c.missing)return ovCard('Campaign money',T,'Share of campaign funds raised, by source',`<div class="note"><b>No FEC financial report yet.</b> ${esc(c.note)}</div>`,`<a href="${fecCandUrl(s.fecCand)}" target="_blank" rel="noopener">FEC candidate page ↗</a>`,'ov-wide');
  const split=c.itemized!=null&&c.unitemized!=null;
  const defs=[
    ...(split?[['Small donors','gifts of $200 or less','--s1',c.unitemized],['Larger individual donors','gifts over $200','--s2',c.itemized]]:[['Individual donors','size split not available','--s1',c.indiv]]),
    ['PACs','political action committees','--s3',c.pac],
    ['Party committees','','--s4',c.party],
    ['Candidate’s own money and loans','','--s5',c.self],
    ['Joint fundraising and other','transfers and other receipts','--muted',(c.transfers||0)+Math.max(0,c.other||0)],
  ];
  const segs=defs.map(([l,d,col,v])=>({l,d,col,v:Math.max(0,v||0)})).filter(x=>x.v>0);
  const tot=segs.reduce((a,x)=>a+x.v,0)||1;
  const top=segs.slice().sort((a,b)=>b.v-a.v)[0];
  const rows=[...(split?[['Individuals, $200 or less',c.unitemized],['Individuals, over $200',c.itemized]]:[['Individuals',c.indiv]]),['PACs and other committees',c.pac],['Joint fundraising transfers',c.transfers],['Party committees',c.party],['Candidate’s own loans and contributions',c.self],['Other receipts',c.other==null?null:Math.max(0,c.other)]].filter(r=>r[1]!=null);
  const body=`<div class="big" style="font-size:1.15rem">Largest source: ${esc(top.l.toLowerCase())}, ${ovPct(top.v,tot)}</div>
    <div class="ov-stack" role="group" aria-label="Campaign funds raised, by source">${segs.map(x=>`<i style="flex:${x.v};background:var(${x.col})" data-tip="${esc(x.l)}: ${fmtFull(x.v)} (${ovPct(x.v,tot)})"></i>`).join('')}</div>
    <ul class="ov-legend">${segs.map(x=>`<li><i style="background:var(${x.col})"></i><span>${esc(x.l)}${x.d?`<small class="muted">${esc(x.d)}</small>`:''}</span><b>${ovPct(x.v,tot)}</b><span class="v">${fmt$(x.v)}</span></li>`).join('')}</ul>
    <details class="tv"><summary>Show as a table</summary><div class="tablewrap"><table><thead><tr><th>Source</th><th class="r">Amount</th><th class="r">Share</th></tr></thead><tbody>${rows.map(([l,v])=>`<tr><td>${esc(l)}</td><td class="r">${fmtFull(v)}</td><td class="r">${v>0?ovPct(v,c.receipts):'0%'}</td></tr>`).join('')}</tbody></table></div></details>`;
  return ovCard('Campaign money',T,`Share of the ${fmtFull(c.receipts)} the campaign raised, ${period(c.start,c.end)}`,body,`FEC two-year committee summary · <a href="${esc(c.src)}" target="_blank" rel="noopener">source ↗</a>${here?'':` · <a href="#${s.id}-finance">Money &amp; Influence details →</a>`}`,'ov-wide');
}
// 2. outside money for and against: two bars on one scale, top groups named under each
function ovOutside(s,here){
  const o=s.out, f=o.for.total, a=o.against.total, T='Outside money for and against';
  const sub=`Spending by outside groups, ${period(o.start,o.end)}`;
  const foot=`Not money the campaign raised, and never added to it. ${o.multi?'':`“For” counts spending that supports ${esc(s.short)} or opposes the opponent. `}${here?'Every group and filing is listed below.':`<a href="#${s.id}-finance">Every group and filing →</a>`}`;
  if(!(f>0)&&!(a>0))return ovCard('Outside money',T,sub,`<div class="note">No outside spending for or against ${esc(s.short)} was reported through ${fmtDate(o.end)}.</div>`,foot);
  const max=Math.max(f,a,1);
  const col=(label,amt,list,cls)=>`<div class="ov-col"><div class="ov-amt">${fmt$(amt)}</div>
    <div class="ov-plot">${amt>0?`<i class="${cls}" style="height:${Math.max(2,amt/max*100).toFixed(1)}%" data-tip="${esc(label)}: ${fmtFull(amt)}"></i>`:''}</div>
    <div class="ov-collab">${esc(label)}</div>
    ${list.length?`<ul class="ov-top">${list.map(x=>`<li><span>${esc(x.name)}<small class="muted">${CLS1[x.cls]||''}</small></span><b>${fmt$(x.amt)}</b></li>`).join('')}</ul>`:'<p class="small muted" style="margin:6px 0 0">No groups reported</p>'}</div>`;
  const body=`<div class="ov-pair">${col(forLabel(s),f,topSpenders(s,'for',3),'for')}${col(agLabel(s),a,topSpenders(s,'against',3),'ag')}</div>${o.incomplete.length?`<p class="small" style="margin:10px 0 0">${flag('Incomplete data',o.incomplete.join(' '))}</p>`:''}`;
  return ovCard('Outside money',T,sub,body,foot);
}
// 3. issue by issue against the viewer's own choices; no evidence is left blank, never scored as a mismatch
function ovAlign(s){
  const r=scoreFor(s), T='How they compare with your choices';
  if(!r.nChosen)return ovCard('Your issues',T,'Issue by issue, never a single score',`<p class="small" style="margin:0 0 10px">Pick your positions on up to ${ISS.length} issues in My alignment and this shows where ${esc(s.short)}’s documented record matches you, differs, or has no evidence. Evidence available: ${esc(evidenceMix(s))}.</p><a class="cta" href="#align">Choose my issues</a>`,'');
  const kind=x=>x.status==='none'?'none':x.agree===1?'match':x.agree===0?'differ':'mixed';
  const SYM={match:'✓',differ:'✕',mixed:'◐',none:''};
  const rows=r.rows.map(x=>({x,k:kind(x)}));
  const n=k=>rows.filter(y=>y.k===k).length;
  const txt=({x,k})=>{
    if(k==='none')return 'No evidence';
    const lead=k==='match'?'Matches you':k==='differ'?'Doesn’t match':`Mixed: ${x.match} of ${x.n} match`;
    return lead+(x.status==='stated'?' <span class="muted">(stated position only)</span>':'');
  };
  const body=`<div class="row" style="margin-bottom:6px"><span class="chip good">✓ ${n('match')} match</span><span class="chip crit">✕ ${n('differ')} differ</span>${n('mixed')?`<span class="chip warn">◐ ${n('mixed')} mixed</span>`:''}<span class="chip ghost">${n('none')} no evidence</span></div>
    <ul class="ov-iss">${rows.map(y=>`<li class="${y.k}"><span class="ov-mk ${y.k}" aria-hidden="true">${SYM[y.k]}</span><span>${esc(y.x.i.label)}</span><span class="r">${txt(y)}</span></li>`).join('')}</ul>`;
  return ovCard('Your issues',T,`Your ${r.nChosen} chosen issue${r.nChosen===1?'':'s'}. Blank means no evidence, which is not counted as a mismatch.`,body,`Not a rating of the candidate. <a href="#${s.id}-match">Evidence for every issue →</a>`);
}
// ---------- key-vote ideology: bills marked liberal or conservative, scored from how each person voted ----------
const kvCache=new Map();
const kvScore=s=>{if(!kvCache.has(s.id))kvCache.set(s.id,keyVoteScore(keyVoteRows(CH[icH(s)].votes,s.id,ISSBY)));return kvCache.get(s.id)};
function kvTotals(C){
  let lib=0,con=0;
  CH[C].votes.forEach(v=>{const l=leanOfVote(v,ISSBY);if(l==='liberal')lib++;else if(l==='conservative')con++;});
  return {lib,con,n:lib+con};
}
const kvSide=side=>`<span class="chip ${side==='liberal'?'D':'R'}">Voted ${side==='liberal'?'Liberal':'Conservative'} Side</span>`;
// A Yea/Nay row's mark, for the vote lists: what a Yea means, or that the bill is not marked and why.
function leanTag(v){
  const l=leanOfVote(v,ISSBY);
  return l?`<span class="chip ${l==='liberal'?'D':'R'}" title="This bill is marked ${l}: a Yea takes the ${l} side and a Nay takes the other.">A Yea is the ${l} side</span>`:`<span class="chip ghost" title="${esc(whyNotMarked(v,ISSBY))}">Not marked liberal or conservative</span>`;
}
// A person's vote on a bill, always plain black text; the side taken is shown separately in the "Side taken" chip.
function voteText(v,pos){
  const l=v?leanOfVote(v,ISSBY):null, side=l?sideTaken(l,pos):null;
  const tip=side?`${pos}: voted the ${side} side on a bill marked ${l}`:l?`${pos}: no side taken`:`${pos}: bill not marked liberal or conservative`;
  return `<span class="vt" title="${esc(tip)}">${esc(pos)}</span>`;
}
const vtLegend=()=>`<p class="small muted vtkey" style="margin:4px 0 8px"><b>Reading a vote:</b> on a bill marked liberal or conservative, a Yea takes the marked side and a Nay takes the other. The "Side taken" column says which side each vote was on. Bills not marked liberal or conservative have no side.</p>`;
function kvBlock(s,id,full){
  const kv=kvScore(s), C=icH(s), tot=kvTotals(C), noun=CH[C].noun, T='Key votes marked liberal or conservative';
  const head=`<div class="kicker">${T}</div>`;
  if(!CH[C].votes.length)return `${head}<p class="small" style="margin:6px 0 0;color:var(--ink-2)">${esc(s.short)} casts no roll-call votes in this office, so there is no key-vote position.</p>`;
  if(!kv.n)return `${head}<p class="small" style="margin:6px 0 0;color:var(--ink-2)">${esc(s.short)} has no Yea or Nay on the ${tot.n} bills marked in the ${CH[C].name} set, so there is no key-vote position.</p>`;
  const rows=kv.rows.slice().sort((a,b)=>b.v.date.localeCompare(a.v.date));
  const table=`<details class="tv" ${full?'open':''}><summary>${full?'The marked bills':'Show the marked bills'} (${kv.n})</summary>${vtLegend()}<div class="tablewrap"><table><thead><tr><th>Date</th><th>Bill</th><th>Vote</th><th>Side taken</th><th>How it is marked</th></tr></thead><tbody>${rows.map(r=>`<tr><td class="mono" style="white-space:nowrap">${fmtDate(r.v.date)}</td><td><a href="${voteUrl(r.v)}" target="_blank" rel="noopener">${esc(r.v.short)}</a></td><td>${voteText(r.v,r.pos)}</td><td>${kvSide(r.side)}</td><td class="small">A Yea is the ${r.lean} side</td></tr>`).join('')}</tbody></table></div></details>`;
  if(!kv.ok)return `${head}<p class="small" style="margin:6px 0 0;color:var(--ink-2)">${esc(s.short)} voted on only ${kv.n} of the ${tot.n} marked ${CH[C].name} bills. At least ${KV_MIN} are needed for a position, so none is shown.</p>${table}`;
  const pool=ALL.filter(p=>icH(p)===C&&kvScore(p).ok);
  const unmarked=full?CH[C].votes.filter(v=>!leanOfVote(v,ISSBY)):[];
  const why=unmarked.length?`<details class="tv"><summary>The other ${unmarked.length} ${CH[C].name} bills, not marked, and why</summary><ul class="list small" style="margin-top:8px">${unmarked.map(v=>`<li><b>${esc(v.short)}</b> <span class="muted">${esc(whyNotMarked(v,ISSBY))}</span></li>`).join('')}</ul></details>`:'';
  return `${head}<div class="big" style="margin-top:4px">Conservative side on ${kv.con} of ${kv.n} marked bills</div>
    <p class="small muted" style="margin:4px 0 6px">Liberal side on ${kv.lib} of ${kv.n}. A missed vote is not counted.</p>
    <div class="ideo" id="${id}"></div>
    <p class="small muted" style="margin:6px 0 0">Each dot is one profiled ${noun} with at least ${KV_MIN} marked votes (${pool.length}). Of the ${tot.n} bills marked in the ${CH[C].name} set, a Yea is the liberal side on ${tot.lib} and the conservative side on ${tot.con}, so positions can be compared only within the ${CH[C].name}. This is a count of selected votes, not the career score above.</p>
    ${table}${why}`;
}
function drawKV(el,s){
  if(!el)return;
  const me=kvScore(s);if(!me.ok)return;
  const C=icH(s), pool=ALL.filter(p=>icH(p)===C&&kvScore(p).ok).sort((a,b)=>kvScore(a).share-kvScore(b).share);
  const W=Math.max(280,el.clientWidth), small=W<520, d=small?9:11, mL=16, mR=16;
  const X=v=>mL+v*(W-mL-mR), nb=Math.floor((W-mL-mR)/d), bins={};
  let maxS=0;
  const placed=pool.map(p=>{const b=Math.min(nb-1,Math.floor((X(kvScore(p).share)-mL)/d));const k=bins[b]||0;bins[b]=k+1;if(k+1>maxS)maxS=k+1;return [p,mL+(b+.5)*d,k]});
  const top=38, base=top+maxS*d, H=base+50;
  let g='',mine='';
  placed.forEach(([p,cx,k])=>{
    const k2=kvScore(p), cy=base-(k+.5)*d, cls=p.party==='R'?'r':p.party==='D'?'d':'i';
    const tip=`${p.name} (${p.party}) · conservative side on ${k2.con} of ${k2.n}`;
    if(p.id===s.id){
      const anchor=cx<W*.18?'start':cx>W*.82?'end':'middle';
      mine=`<line class="guide" style="stroke-dasharray:none" x1="${cx}" x2="${cx}" y1="${top-8}" y2="${cy-d/2-2}"></line><circle class="me ${cls}" cx="${cx}" cy="${cy}" r="${d/2+1.5}" data-tip="${esc(tip)}"></circle><text class="me-lab" x="${cx}" y="${top-14}" text-anchor="${anchor}">${esc(s.short)} · ${k2.con} of ${k2.n}</text>`;
    } else g+=`<circle class="${cls}" cx="${cx}" cy="${cy}" r="${d/2-.6}" data-tip="${esc(tip)}"></circle>`;
  });
  let ax=`<line class="axis" x1="${mL}" x2="${W-mR}" y1="${base+2}" y2="${base+2}"></line>`;
  [[0,'0%','start'],[.5,'50%','middle'],[1,'100%','end']].forEach(([v,l,a])=>{ax+=`<line class="axis" x1="${X(v)}" x2="${X(v)}" y1="${base+2}" y2="${base+7}"></line><text class="tick" x="${X(v)}" y="${base+19}" text-anchor="${a}">${l}</text>`;});
  ax+=`<text class="cap" x="${mL}" y="${base+40}">← Liberal side every time</text><text class="cap" x="${W-mR}" y="${base+40}" text-anchor="end">Conservative side every time →</text>`;
  el.innerHTML=`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(s.name)} took the conservative side on ${me.con} of ${me.n} bills marked liberal or conservative, among ${pool.length} ${CH[C].nouns}">${ax}${g}${mine}</svg>`;
  bindTips(el);
}
function mountKV(id,s){const f=()=>drawKV(document.getElementById(id),s);f();resizers.push(f);}

// 4. one line from most liberal to most conservative, the candidate among faint dots for the whole chamber
function ovIdeo(s){
  const it=ideoText(s), T='Where they sit politically', kv=kvScore(s);
  if(!s.ideo&&!kv.ok){
    const few=kv.n?` ${esc(s.short)} voted on only ${kv.n} bill${kv.n===1?'':'s'} marked liberal or conservative, too few for a position.`:'';
    return ovCard('Politics',T,'Needs a congressional voting record',`<div class="big">No voting score</div><p class="small" style="margin:6px 0 0;color:var(--ink-2)">${esc(it.short)}. A position is shown only where there is a congressional voting record, and is never guessed.${few}</p>`,`<a href="#${s.id}-record">Record and votes →</a>`,'ov-wide');
  }
  const C=icH(s);
  const career=s.ideo?`<div class="kicker">Whole career, Voteview</div><div class="big" style="margin-top:4px">${esc(it.head)}</div><div class="ideo ov-strip" id="ovstrip"></div><p class="small muted" style="margin:6px 0 0">Each faint dot is one current ${CH[C].noun} (${DATA.pools[C].length} in all). DW-NOMINATE score ${s.ideo.dim1>0?'+':''}${s.ideo.dim1.toFixed(3)} on a −1 (liberal) to +1 (conservative) scale.</p>`:'';
  const keyv=kv.ok?`<div class="${s.ideo?'ov-sep':''}">${kvBlock(s,'ovkv',false)}</div>`:'';
  return ovCard('Politics',T,kv.ok&&s.ideo?'Two views: the whole career, and the bills marked liberal or conservative':kv.ok?'From the bills marked liberal or conservative':'Whole career',career+keyv,`<a href="#${s.id}-record">Full chart with names and every vote →</a> · <a href="#method">How bills are marked</a>`,'ov-wide');
}
function drawStrip(el,s){
  if(!el||!s.ideo)return;
  const C=icH(s), pts=DATA.pools[C];
  const W=Math.max(260,el.clientWidth), mL=12, mR=12, x0=-1, x1=1.05, lineY=48, H=96;
  const X=v=>mL+(Math.max(x0,Math.min(x1,v))-x0)/(x1-x0)*(W-mL-mR);
  const meIdx=pts.findIndex(p=>(s.bioguide&&p[3]===s.bioguide)||p[2]===s.name);
  let g='';
  pts.forEach((p,i)=>{if(i===meIdx)return;g+=`<circle class="f ${p[1]==='R'?'r':p[1]==='D'?'d':'i'}" cx="${X(p[0]).toFixed(1)}" cy="${(lineY+((i*37)%9-4)*1.5).toFixed(1)}" r="3.2"></circle>`;});
  const mx=X(s.ideo.dim1), score=(s.ideo.dim1>0?'+':'')+s.ideo.dim1.toFixed(2);
  const anchor=mx<W*.18?'start':mx>W*.82?'end':'middle';
  const me=`<line class="guide" style="stroke-dasharray:none" x1="${mx}" x2="${mx}" y1="${lineY-30}" y2="${lineY-8}"></line><circle class="me ${s.party==='R'?'r':'d'}" cx="${mx}" cy="${lineY}" r="6.5" data-tip="${esc(s.name)} · ${score}"></circle><text class="me-lab" x="${mx}" y="${lineY-36}" text-anchor="${anchor}">${esc(s.short)} ${score}</text>`;
  const ax=`<line class="axis" x1="${mL}" x2="${W-mR}" y1="${lineY}" y2="${lineY}"></line><text class="cap" x="${mL}" y="${H-6}">← More liberal</text><text class="cap" x="${W-mR}" y="${H-6}" text-anchor="end">More conservative →</text>`;
  el.innerHTML=`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(s.name)}'s DW-NOMINATE score ${s.ideo.dim1.toFixed(3)} among ${pts.length} ${CH[C].nouns}; ${esc(ideoText(s).head)}">${ax}${g}${me}</svg>`;
  bindTips(el);
}
function mountStrip(id,s){const f=()=>drawStrip(document.getElementById(id),s);f();resizers.push(f);}
// 5. do their words match their actions: a tally of checked statements that always shows how many were checked
const WORD_GROUPS=[
  ['Record supports it','good','✓',['consistent'],true],
  ['Partly supported, or changed over time','warn','◐',['partial','changed'],true],
  ['Record contradicts it','crit','✕',['contradiction'],true],
  ['Unclear, or later events matter','neutral','◇',['unclear','outcome'],false],
];
function ovWords(s){
  const T='Do their words match their actions?', N=s.statements.length;
  if(!N)return ovCard('Words and actions',T,'Checked statements',`<div class="big">No statements checked</div>`,'');
  const groups=WORD_GROUPS.map(([label,cls,icon,keys,always])=>({label,cls,icon,always,items:s.statements.filter(x=>keys.includes(x.assessment))}));
  const body=`<div class="big">${N} statement${N===1?'':'s'} checked</div>
    <div class="ov-tiles" role="group" aria-label="${N} checked statements, grouped by result">${groups.map(g=>g.items.map(x=>`<i class="${g.cls}" data-tip="${esc(x.topic)}: ${esc(g.label.toLowerCase())}">${g.icon}</i>`).join('')).join('')}</div>
    <ul class="ov-tally">${groups.filter(g=>g.always||g.items.length).map(g=>`<li><span class="chip ${g.cls}">${g.icon}</span><span>${g.label}</span><b class="num">${g.items.length}</b></li>`).join('')}</ul>
    <details class="tv"><summary>Show the statements</summary><ul class="list small" style="margin-top:8px">${groups.map(g=>g.items.map(x=>`<li>${esc(x.topic)} <span class="muted">· ${esc(g.label.toLowerCase())}</span></li>`).join('')).join('')}</ul></details>`;
  return ovCard('Words and actions',T,`Only the statements that were checked, not everything ${esc(s.short)} has said.`,body,`<a href="#${s.id}-promises">Read the checks →</a>`);
}
// ethics: a short text list, never a chart, because an allegation, an investigation and a confirmed finding are very different things
const ETH_TAG={finding:['Confirmed finding','crit'],investigation:['Investigation','warn'],allegation:['Allegation','neutral']};
function ovEthics(s){
  const items=s.ethics.filter(e=>e.outcome!=='None found');
  const order=Object.keys(ETH_TAG), rank=e=>{const i=order.indexOf(e.status);return i<0?order.length:i};
  const list=items.map((e,i)=>[e,i]).sort((a,b)=>rank(a[0])-rank(b[0])||a[1]-b[1]).map(x=>x[0]);
  const body=list.length?`<ul class="ov-eths">${list.map(e=>{const [lab,cls]=ETH_TAG[e.status]||[e.type,'ghost'];return `<li class="ov-eth"><span class="chip ${cls}">${esc(lab)}</span><b>${esc(e.title)}</b> <span class="mono muted">${esc(e.date)}</span><div class="small muted ov-clamp" style="margin-top:4px">${esc(e.outcome)}</div></li>`}).join('')}</ul>
    <p class="small muted" style="margin:10px 0 0"><b>Allegation:</b> a complaint or report with no official finding. <b>Investigation:</b> a formal inquiry, lawsuit or proceeding, whether pending, closed or ended without a finding against ${esc(s.short)}. <b>Confirmed finding:</b> a court, agency or ethics body found a violation or imposed a penalty, or ${esc(s.short)} admitted it.</p>`
    :`<p class="small" style="margin:8px 0 0">No documented violations, penalties or findings located in the sources checked.</p>`;
  return ovCard('Ethics','Ethics & compliance',`${list.length?`${list.length} item${list.length===1?'':'s'}, most certain first`:'Sources checked'}`,body,`<a href="#${s.id}-ethics">Details, sources and the grade →</a>`,'ov-top-align');
}

// In place of the campaign and outside-money cards for someone in office who is not on the 2026 ballot.
function ovOffice(s){
  return ovCard('Not on the ballot','No 2026 race to show',esc(s.term),`<div class="big">${esc(s.seat)}</div><p class="small" style="margin:6px 0 0;color:var(--ink-2)">So there are no 2026 campaign totals, outside spending or opponents to compare, and ${esc(s.short)} is left out of the filters, races, comparisons and score pages. The grades come from the official acts and the ethics record. ${esc(s.cmteName||'The 2024 committee')} (${esc(s.fecCmte)}) still files with the FEC; its latest totals appear on the Money &amp; Influence tab from the daily refresh.</p>`,`<a href="${fecCmteUrl(s.fecCmte)}" target="_blank" rel="noopener">FEC committee page ↗</a> · <a href="#${s.id}-finance">Money &amp; Influence →</a>`);
}
function paneOverview(s,pane){
  const race=raceOf(s), riv=rivalsOf(s);
  pane.innerHTML=`
  <h2>At a glance</h2>
  <p class="intro">The four grades, five quick visuals and a short ethics list, each with its period. Click a grade, or use the tabs above, for the evidence behind it.</p>
  <div class="ov-grades">${reportCard(s,true)}</div>
  <div class="ov-grid">
    ${s.office?ovOffice(s):ovMoney(s)+ovOutside(s)}
    ${ovAlign(s)}
    ${ovIdeo(s)}
    ${ovWords(s)}
    ${ovEthics(s)}
  </div>
  <div class="cols" style="margin-top:14px">
    ${s.office?`<div class="card"><h3>Term in office</h3><p class="small" style="margin-top:8px">${esc(s.since)}.</p><p class="small" style="margin-top:6px">${esc(s.term)}. ${esc(s.seat)}.</p><p style="margin-top:10px"><a href="#${s.id}-ethics">Ethics record →</a></p></div>`:`<div class="card"><h3>2026 race</h3>
      ${riv.length?`<ul class="list small" style="margin-top:8px">${riv.map(x=>`<li><a href="#${x.id}">${esc(x.name)}</a> (${x.party}${x.id===s.incumbent?', incumbent':''}): campaign funds ${campLine(x)}; outside spending for ${fmt$(x.out.for.total)}</li>`).join('')}</ul>`:'<p class="small muted">No profiled opponent.</p>'}
      ${race&&race.note?`<p class="small muted" style="margin-top:6px">${esc(race.note)}</p>`:''}
      <p style="margin-top:10px"><a href="#races">Side-by-side race view →</a></p></div>`}
    <div class="card"><h3>${s.cand?'Record':'Votes & bills'}</h3>
      ${s.cand?`<p class="small" style="margin-top:8px">${esc(REC_LABEL[s.recordType]||'')}. ${s.record.length} documented ${s.recordType==='state_legislator'?'votes and bills':s.recordType==='executive'?'official actions':'items'}${s.ideoKind==='house'?`, plus positions on ${statedVotes(s)} key House roll calls`:''}.</p><ul class="list small">${s.record.slice(0,3).map(r=>`<li>${esc(r.title)}</li>`).join('')}</ul>`:`<p class="small" style="margin-top:8px">Positions on ${statedVotes(s)} key ${CH[s.chamber].name} roll calls. ${s.sponsoredCount?`<b class="num">${s.sponsoredCount.toLocaleString()}</b> measures sponsored over a congressional career.`:''} ${s.bills.length} notable sponsored bills listed.</p>`}
      <p style="margin-top:10px"><a href="#${s.id}-record">The record behind your match →</a></p></div>
  </div>`;
  mountStrip('ovstrip',s);
  mountKV('ovkv',s);
  bindTips(pane);
}

function conduitBlock(s){
  const c=s.conduit||{status:'not_measured',rows:[],aipacDirect:[]};
  const direct=c.aipacDirect||[];
  const dsum=direct.reduce((a,b)=>a+b.amount,0);
  const head=`<h3 style="margin:22px 0 6px">${term('earmarked','Money routed through PACs on donors\' behalf')}</h3>
  <p class="small" style="color:var(--ink-2);max-width:72ch;margin-bottom:10px">A PAC can give a candidate at most $5,000 per election from its own account, but some groups also act as a conduit: their members write checks that the PAC collects and forwards ("earmarked" contributions). The FEC records that money as individual contributions, so it is already inside campaign funds raised, but it does not appear in the PAC contributions table above even though the group directed it.</p>`;
  let body='';
  if(c.status==='measured'){
    body=`<div class="tablewrap"><table><thead><tr><th>Conduit</th><th>Period</th><th class="r">Amount</th></tr></thead><tbody>${c.rows.map(r=>`<tr><td><a href="${fecCmteUrl(r.id)}" target="_blank" rel="noopener">${esc(r.conduit)}</a><div class="small" style="color:var(--ink-2);margin-top:4px">${esc(r.detail)}</div><div class="small" style="margin-top:4px">${r.srcs.map(x=>`<a href="${esc(x.u)}" target="_blank" rel="noopener">${esc(x.t)} ↗</a>`).join(' · ')}</div></td><td class="mono" style="white-space:nowrap">${esc(r.period)}</td><td class="r"><b>${fmtFull(r.amount)}</b></td></tr>`).join('')}</tbody></table></div>`;
  } else if(c.status==='present'){
    body=`<div class="note"><b>Earmarked money found, total not yet tallied.</b> ${esc(c.note)}</div>`;
  } else {
    body=`<div class="note"><b>Not measured for ${esc(s.short)}.</b> Earmarked totals come from each conduit's own FEC reports, which run to tens of thousands of rows and could not be read accurately for this release, so no total is shown rather than a partial one. This is not a finding that ${esc(s.short)} received none.</div>`;
  }
  const note=c.status==='measured'&&c.note?`<p class="small" style="margin-top:8px;color:var(--ink-2)">${esc(c.note)} ${c.noteSrc?`<a href="${esc(c.noteSrc.u)}" target="_blank" rel="noopener">${esc(c.noteSrc.t)} ↗</a>`:''}</p>`:(c.status==='present'&&c.noteSrc?`<p class="small" style="margin-top:6px"><a href="${esc(c.noteSrc.u)}" target="_blank" rel="noopener">${esc(c.noteSrc.t)} ↗</a></p>`:'');
  const dl=s.pac.filings.length?(direct.length?`<p class="small" style="margin-top:8px">Direct checks from AIPAC's PAC in the reports itemized here (${esc(s.pac.window)}): <b class="num">${fmtFull(dsum)}</b> — ${direct.map(d=>`${esc(d.report)} ${fmtFull(d.amount)}`).join('; ')}. These are in the PAC contributions table above.</p>`:`<p class="small muted" style="margin-top:8px">No direct check from AIPAC's PAC appears in the reports itemized here (${esc(s.pac.window)}).</p>`):'';
  return head+body+note+dl;
}

// ---------- Money & Influence tab: where the campaign's money comes from, outside money, and every filing behind them ----------
function paneFinance(s,pane){
  if(s.office)return paneFinanceOffice(s,pane);
  const c=s.camp, o=s.out;
  pane.innerHTML=`
  <h2>Money &amp; Influence</h2>
  <p class="intro">Two different kinds of money, kept apart. <b>Campaign funds</b> are what ${esc(s.short)}'s own committee raised and reported to the FEC. <b>Outside spending</b> is money other groups spent on the race on their own, which the campaign never receives. Every figure shows its period.</p>
  <nav class="jump small"><a href="#f-analysis">Money &amp; Influence Analysis</a><a href="#f-glance">At a glance</a><a href="#f-sum">Summary</a><a href="#f-camp">Campaign funds</a><a href="#f-pac">PAC contributions</a><a href="#f-out">Outside spending</a><a href="#f-items">Every item</a><a href="#f-comb">Combined view</a><a href="#live-records">Latest filings</a></nav>
  ${analysisBlock(s)}
  <div class="ov-grid" id="f-glance" style="margin-top:22px">${ovMoney(s,true)}${ovOutside(s,true)}${ovCard('Outside money','Outside money by month',`For and against ${esc(s.short)}, the last seven months`,miniOutside(s,true),`The badge is the for-to-against ratio for these months. <a href="#method">How it is figured</a>`)}</div>
  <div id="f-sum" style="margin-top:14px">${fundingPanels(s)}</div>
  ${scaleChart(s,false)}
  ${shareBlock(s)}
  <h2 id="f-camp" style="margin-top:28px">Campaign funds raised</h2>
  ${c.missing?`<div class="note"><b>No FEC financial report yet.</b> ${esc(c.note)} <a href="${fecCandUrl(s.fecCand)}" target="_blank" rel="noopener">FEC candidate page ↗</a></div>`:`
  <p class="small muted" style="margin:4px 0 0">${esc(c.cmte||'Campaign committee')} (${esc(c.cmteId)}) · FEC two-year summary, ${period(c.start,c.end)} · <a href="${esc(c.src)}" target="_blank" rel="noopener">source ↗</a></p>
  ${tiles([
    ['Campaign funds raised',fmt$(c.receipts),period(c.start,c.end)],
    ['Small donors',fmt$(c.unitemized),c.unitemized==null?'not broken out':`${pct(c.unitemized,c.receipts)}% of campaign funds (gifts of $200 or less)`],
    [term('pac','From PACs'),fmt$(c.pac),`${pct(c.pac,c.receipts)}% of campaign funds`],
    ['Spent · cash on hand',c.disbursements==null?fmt$(c.cash):`${fmt$(c.disbursements)} · ${fmt$(c.cash)}`,`cash on ${fmtDate(c.end)}${c.debts?` · debts ${fmt$(c.debts)}`:''}`],
  ])}
  ${c.selfShare>20?`<div class="note" style="margin-bottom:12px"><b>Mostly self-funded so far.</b> ${fmtFull(c.self)} (${c.selfShare}%) of ${esc(s.short)}'s campaign funds are the candidate's own loans or contributions${c.debts?`; the committee reports ${fmtFull(c.debts)} in debts`:''}.</div>`:''}
  ${c.itemized==null?'<p class="small muted" style="margin:8px 0 0">The itemized/unitemized split is not available for this committee.</p>':''}`}
  <h2 id="f-pac" style="margin-top:28px">${term('pac','PAC contributions to the campaign')}</h2>
  <p class="small muted" style="margin:4px 0 10px">Part of campaign funds raised. Each row is one contribution as itemized on FEC Schedule A, line 11C.</p>
  ${pacCoverage(s)}
  ${pacSectors(s)}
  <div id="pachost"></div>
  ${conduitBlock(s)}
  <h2 id="f-out" style="margin-top:28px">Outside spending (${term('ie','independent expenditures')})</h2>
  <p class="small" style="margin:4px 0 10px;color:var(--ink-2);max-width:78ch">Spending by ${term('superpac','super PACs')}, other outside groups and party committees that support or oppose a candidate without coordinating with the campaign. General-election spending only, ${period(o.start,o.end)}. Source: ${esc(IE.source)}${o.excludedPre.n?` Excluded: ${fmtFull(o.excludedPre.amount)} in ${o.excludedPre.n} items dated before 2025 (2024-election spending filed late).`:''}${o.dupRemoved.n?` Excluded: ${fmtFull(o.dupRemoved.amount)} in ${o.dupRemoved.n} items that were the same transaction filed twice (identical in every field, including the transaction ID); the latest filing is kept.`:''}${o.uncertain?` ${o.uncertain} items have an uncertain election designation and are marked.`:''} <a href="${fecIeUrl(s.fecCand)}" target="_blank" rel="noopener">FEC independent expenditures for ${esc(s.short)} ↗</a></p>
  ${o.incomplete.map(t=>`<div class="note" style="margin-bottom:10px"><b>Incomplete data.</b> ${esc(t)}</div>`).join('')}
  ${o.possibleRepeat?`<div class="note" style="margin-bottom:10px"><b>Possible repeats:</b> the totals above include ${fmtFull(o.possibleRepeat)} in items that match an item in another filing in every detail except the transaction ID. They may be the same spending reported twice, so the totals may be overstated by up to that amount. They are marked "Possible repeat" in the item list.</div>`:''}
  ${o.pinned?`<p class="small muted" style="margin:0 0 10px">${o.pinned} items were filed in advance with a dissemination date of Sept. 30 or later; they are dated Sept. 30 here and marked "Date capped".</p>`:''}
  ${o.others.length?`<div class="note" style="margin-bottom:10px"><b>Spending on other candidates in this race</b> is listed separately and not counted for or against ${esc(s.short)}: ${o.others.map(x=>`${esc(candName(x.cand))} (${x.O?fmtFull(x.O)+' opposing':''}${x.O&&x.S?', ':''}${x.S?fmtFull(x.S)+' supporting':''})`).join('; ')}.</div>`:''}
  ${o.multi&&o.rivals.length?`<div class="note" style="margin-bottom:10px"><b>Aimed at ${esc(s.short)}'s rivals</b> (not credited to ${esc(s.short)}): ${o.rivals.map(x=>`${esc(candName(x.cand))}: ${fmtFull(x.S)} supporting, ${fmtFull(x.O)} opposing`).join('; ')}.</div>`:''}
  <p class="small" style="margin:0 0 8px"><a href="#${s.id}-funders">How these groups' own published positions compare with ${esc(s.short)}'s votes →</a></p>
  ${outsideSectorBlock(s)}
  <h3 style="margin:14px 0 8px">By committee</h3>
  ${ieCommitteeTable(s)}
  <h3 id="f-items" style="margin:22px 0 8px">Every item</h3>
  <p class="small muted" style="margin:0 0 8px">Each independent expenditure as reported, with its dissemination date and FEC filing.</p>
  <div id="iehost"></div>
  <div id="f-comb" style="margin-top:22px">${combinedBlock(s)}</div>
  <section id="live-records" style="margin-top:28px"></section>`;
  pacTable(s,$('#pachost'));
  ieItems(s,$('#iehost'));
  mountAnalysis(s);hoverTips(pane);
  window.RecordLive.profile(s,$('#live-records'),['campaign','pac','outside','donors','lobbying','fara','regulations','sam','contracts','outside-groups']);
  pane.querySelectorAll('.jump a').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const t=document.getElementById(a.getAttribute('href').slice(1));if(t)t.scrollIntoView({behavior:'smooth',block:'start'});}));
  bindTips(pane);
}

// Someone in office who is not on the 2026 ballot: no 2026 campaign or outside money, so the analysis and the refreshed
// FEC, lobbying and contract records for the committee that still files.
function paneFinanceOffice(s,pane){
  pane.innerHTML=`
  <h2>Money &amp; Influence</h2>
  <p class="intro">${esc(s.short)} is not on the 2026 ballot, so no 2025–26 campaign totals or outside spending are profiled and there is no race to compare. ${esc(s.cmteName||'The 2024 committee')} (${esc(s.fecCmte)}) still files with the FEC: its totals, PAC contributions and donors by employer appear under Latest official records from the daily refresh.</p>
  <p class="small" style="margin:0 0 6px"><a href="${fecCandUrl(s.fecCand)}" target="_blank" rel="noopener">FEC candidate page ↗</a> · <a href="${fecCmteUrl(s.fecCmte)}" target="_blank" rel="noopener">FEC committee page ↗</a></p>
  ${analysisBlock(s)}
  <section id="live-records" style="margin-top:28px"></section>`;
  mountAnalysis(s);hoverTips(pane);
  window.RecordLive.profile(s,$('#live-records'),['campaign','pac','outside','donors','lobbying','fara','regulations','sam','contracts','outside-groups']);
  bindTips(pane);
}

// ---------- records (stage 5): congressional, state legislative and other records kept in separate, labeled sections ----------
const realVotes=(s,V)=>V.filter(v=>s.id in v.pos&&!/not in office/i.test(v.pos[s.id]));
function evidenceOf(s){
  const sv=realVotes(s,DATA.votes).length, hv=realVotes(s,DATA.hvotes).length, st=s.stateRecord?s.stateRecord.items.length:0;
  let kind,label;
  if(!s.cand||s.recordType==='senator'||s.ideoKind==='house'){
    const ch=(!s.cand&&s.chamber==='H')||s.ideoKind==='house'?'House':'Senate', n=ch==='House'?hv:sv;
    kind='us';label=`U.S. ${ch} votes (${n} key roll calls) and a career ideology score`;
  } else if(s.recordType==='former_member_of_congress'){kind='former';label=`Former member of Congress: ${s.record.length} documented votes or bills${sv?`, plus ${sv} key Senate roll calls`:''}`;}
  else if(s.recordType==='state_legislator'){kind='state';label=`State legislature: ${s.record.length} documented votes or bills`;}
  else if(s.recordType==='executive'){kind='exec';label=`Executive office: ${s.record.length} official actions (no legislative votes in that office)`;}
  else {kind='none';label=`No voting record: ${s.record.length} documented public actions`;}
  if(st&&s.recordType!=='state_legislator')label+=`; earlier state legislative service: ${st} documented item${st===1?'':'s'}`;
  else if(s.stateRecord&&!st&&s.recordType!=='state_legislator')label+='; earlier state legislative service (no votes could be sourced)';
  return {kind,label};
}
function evidenceNote(list){
  const k=[...new Set(list.map(s=>evidenceOf(s).kind))];
  if(k.length<2)return '';
  const N={us:'U.S. congressional votes',former:'a past congressional record',state:'state legislative votes',exec:'official actions in executive office',none:'documented public actions without a voting record'};
  return `Different kinds of evidence: ${list.map(s=>`${esc(s.short)}'s record is ${N[evidenceOf(s).kind]}`).join('; ')}. The records are not directly comparable, and fewer items does not mean a better or worse record.`;
}
function senateVoteList(s){
  const V=DATA.votes.filter(v=>s.id in v.pos);
  const n=realVotes(s,DATA.votes).length;
  if(!n)return '';
  return `<h3 style="margin-top:26px">Key U.S. Senate votes</h3><p class="small muted" style="margin:4px 0 8px">The same ${V.length} roll calls shown for the other senators, each linked to the official tally. ${esc(s.short)} cast ${n} of them${V.length>n?`; "Not in office" marks votes cast when ${esc(s.short)} was not a senator`:''}.</p>
  <div>${V.slice().sort((x,y)=>y.date.localeCompare(x.date)).map(v=>{const p=v.pos[s.id]||'—';return `<div class="vote"><div class="d">${v.date}</div><div><div class="t"><a href="${voteUrl(v)}" target="_blank" rel="noopener">${esc(v.short)}</a></div><div class="s">${esc(v.issue)} · ${esc(v.result)}</div><div class="s muted">${esc(v.area)}</div></div><div class="pos"><span class="chip ${posClass(p)}">${esc(p)}</span></div></div>`}).join('')}</div>`;
}
function stateRecordBlock(s){
  const r=s.stateRecord;
  if(!r){
    if(s.recordType==='state_legislator')return '';
    return '';
  }
  const kindN={vote:'Recorded vote',authored:'Bill authored',sponsored:'Bill sponsored',cosponsored:'Co-sponsored',leadership:'Leadership post'};
  return `<section class="recsec state">
    <div class="kicker">State legislative record · not a congressional record</div>
    <h3 style="margin-top:4px">State legislative record</h3>
    <ul class="list small" style="margin:6px 0 10px">${r.service.map(x=>`<li><b>${esc(x.chamber)}</b>${x.district?`, District ${esc(x.district)}`:''}, ${esc(x.start)}–${esc(x.end)}${x.roles?` (${esc(x.roles)})`:''} ${x.src?`<a href="${esc(x.src.u)}" target="_blank" rel="noopener">source ↗</a>`:''}</li>`).join('')}</ul>
    ${r.stateIdeology?`<p class="small" style="margin:0 0 10px"><b>Published ranking:</b> ${esc(r.stateIdeology.text)} <a href="${esc(r.stateIdeology.src.u)}" target="_blank" rel="noopener">${esc(r.stateIdeology.src.t)} ↗</a> <span class="muted">(state-legislature ranking; not comparable with congressional scores)</span></p>`:''}
    ${r.items.length?r.items.map(it=>`<div class="vote"><div class="d">${esc(it.date||'')}</div><div><div class="t">${esc(it.title)}</div><div class="s">${esc(it.summary||'')}</div>${it.result?`<div class="s"><b>Result:</b> ${esc(it.result)}</div>`:''}<div class="s muted">${esc(kindN[it.kind]||it.kind)}${it.session?' · '+esc(it.session):''} · ${esc(it.area||'')}${it.areaWhy?` <span class="term" tabindex="0" data-tip="Why this policy area: ${esc(it.areaWhy)}">why this area?</span>`:''}${it.src?` · <a href="${esc(it.src.u)}" target="_blank" rel="noopener">${esc(it.src.t)} ↗</a>`:''}</div></div><div class="pos"><span class="chip ${posClass(it.position)}">${esc(it.position||'')}</span></div></div>`).join(''):`<div class="note">No recorded votes or bills from this service could be sourced for this release.</div>`}
    ${r.searched?`<p class="small muted" style="margin-top:8px"><b>What was searched:</b> ${esc(r.searched)}</p>`:''}
  </section>`;
}
function recordHeading(s){
  return {state_legislator:'State legislative record',executive:'Record in executive office',member_of_congress:'Bills sponsored in Congress',senator:'Bills sponsored in the Senate',former_member_of_congress:'Record in Congress',none:'Other documented record (no voting record)'}[s.recordType]||'Documented record';
}
function recordKicker(s){
  return {state_legislator:'State legislative record · not a congressional record',executive:'Executive or appointed office · not a voting record',member_of_congress:'Congressional record',senator:'Congressional record',former_member_of_congress:'Congressional record (past service)',none:'Documented actions and commitments · no voting record'}[s.recordType]||'';
}
// ---------- voter alignment (stage 7): a comparison with the viewer's own choices, never a quality rating ----------
const ISS=DATA.issues, ISSBY=Object.fromEntries(ISS.map(i=>[i.id,i]));
const RECT=ACTION_TYPES;
const TYPEL=DATA.typeLabel;
const WLAB={1:'Low',2:'Medium',3:'High'};
const ALKEY='crc-align-v1';
let PROF=(()=>{try{const v=JSON.parse(localStorage.getItem(ALKEY)||'null');if(v&&v.issues)return v}catch(e){}return {issues:{}}})();
function saveProf(){try{localStorage.setItem(ALKEY,JSON.stringify(PROF))}catch(e){}}
const chosenIssues=()=>ISS.filter(i=>PROF.issues[i.id]&&PROF.issues[i.id].side&&PROF.issues[i.id].w>0);
// Example starting points: labeled by their content only. Every choice can be changed.
const EXAMPLES=[
  {name:'Health coverage, abortion access, climate',set:{health:['A',3],abortion:['A',3],climate:['A',2],labor:['A',1],tariffs:['B',1]}},
  {name:'Lower taxes, immigration enforcement, gun rights',set:{taxes:['B',3],immigration:['A',3],guns:['B',2],voting:['A',2],vouchers:['A',1]}},
  {name:'Ukraine aid, war-powers limits, ending Canada tariffs',set:{ukraine:['A',3],warpowers:['A',2],tariffs:['B',2],jan6:['A',1],infra:['A',1]}},
];
function scoreFor(s){
  const ch=chosenIssues();
  const r=matchScore(ch.map(i=>({id:i.id,side:PROF.issues[i.id].side,w:PROF.issues[i.id].w})),s.evidence);
  r.rows.forEach((x,k)=>{x.i=ch[k];x.pr=PROF.issues[ch[k].id];});
  return r;
}
function scoreBadge(r){
  if(!r.nChosen)return '<span class="muted">Set your priorities</span>';
  if(r.score==null)return `<span class="chip ghost" data-tip="Evidence covers ${r.nCov} of your ${r.nChosen} issues (${Math.round(r.covW/r.totW*100)||0}% of your weight). A score needs at least ${r.need} issues and half your weight.">Insufficient data</span>`;
  return `<span class="alscore"><b>${r.score}%</b> match</span>`;
}
function evidenceMix(s){
  const c={};Object.values(s.evidence||{}).flat().forEach(e=>{const k=RECT.has(e.type)?(e.type==='senate_vote'||e.type==='house_vote'||e.type==='vote'?'votes':e.type==='state_vote'?'state votes':e.type==='sponsored'?'bills sponsored':e.type==='cosponsored'?'bills cosponsored':'official actions'):'statements';c[k]=(c[k]||0)+1});
  return Object.entries(c).map(([k,n])=>`${n} ${k}`).join(', ')||'no coded evidence';
}
function sideLabel(i,side){return side==='A'?ISSBY[i].A:ISSBY[i].B}
function builderHTML(){
  return `<div class="albuild">
    <div class="row" style="margin-bottom:10px"><span class="small muted">Start from an example (you can change every choice):</span>${EXAMPLES.map((x,k)=>`<button class="pill" data-ex="${k}">${esc(x.name)}</button>`).join('')}<button class="pill ghostb" data-ex="clear">Clear all</button></div>
    ${ISS.map(i=>{const pr=PROF.issues[i.id]||{};return `<div class="alrow" data-i="${i.id}">
      <div class="alq"><b>${esc(i.label)}</b><small>${esc(i.q)}</small></div>
      <div class="seg alside" role="group" aria-label="${esc(i.label)}: your position"><button data-s="A" class="${pr.side==='A'?'active':''}">${esc(i.A)}</button><button data-s="B" class="${pr.side==='B'?'active':''}">${esc(i.B)}</button><button data-s="" class="${!pr.side?'active':''}">Skip</button></div>
      <label class="alw small">Importance <select data-w aria-label="${esc(i.label)}: importance">${[1,2,3].map(w=>`<option value="${w}" ${(pr.w||2)===w?'selected':''}>${WLAB[w]}</option>`).join('')}</select></label>
    </div>`}).join('')}
  </div>`;
}
function bindBuilder(root,onChange){
  root.querySelectorAll('.alrow').forEach(r=>{
    const id=r.dataset.i;
    r.querySelector('.alside').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const w=+r.querySelector('select').value;if(b.dataset.s)PROF.issues[id]={side:b.dataset.s,w};else delete PROF.issues[id];r.querySelectorAll('.alside button').forEach(x=>x.classList.toggle('active',x===b));saveProf();onChange();});
    r.querySelector('select').addEventListener('change',e=>{if(PROF.issues[id]){PROF.issues[id].w=+e.target.value;saveProf();onChange();}});
  });
  root.querySelectorAll('[data-ex]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.ex;PROF={issues:{}};if(k!=='clear')Object.entries(EXAMPLES[+k].set).forEach(([i,[s,w]])=>PROF.issues[i]={side:s,w});saveProf();onChange(true);}));
}
const ALNOTE=`<div class="note small" style="margin:10px 0"><b>What this is:</b> a comparison between the positions <i>you</i> choose and each candidate's documented record. It is not a rating of candidate quality, and the issue list covers only what could be documented. Recorded actions (votes, bills, official acts) are used where they exist; stated positions are used only for an issue with no recorded action, and are labeled. A score appears only when evidence covers at least three of your issues and half of your total importance; otherwise the candidate shows "Insufficient data", never a neutral or zero score. <a href="#method">How it is calculated</a>.</div>`;
// ---------- My alignment: a five-point quiz over the issue list. Each answer is saved as a side and an importance:
// strongly agree/disagree = importance 3, agree/disagree = 2, neutral = answered but not counted. ----------
const AL_GROUPS=[['econ','Economy & health','$'],['rights','Rights & social','♥'],['imm','Immigration & elections','⛨'],['foreign','Foreign policy','◍'],['env','Environment','❦']];
const AL_GBY=Object.fromEntries(AL_GROUPS.map(g=>[g[0],g]));
// mixed order for "All questions": one from each category in turn
const AL_ORDER=(()=>{const by=AL_GROUPS.map(([g])=>ISS.filter(i=>i.group===g)),out=[];for(let k=0;out.length<ISS.length&&k<ISS.length;k++)by.forEach(l=>{if(l[k])out.push(l[k])});ISS.forEach(i=>{if(!out.includes(i))out.push(i)});return out})();
const AL_OPTS=[['B',3,'Strongly disagree'],['B',2,'Disagree'],['',0,'Neutral'],['A',2,'Agree'],['A',3,'Strongly agree']];
const AL_PAGE=5;
let alView={g:'',page:0};
const alPick=id=>{const p=PROF.issues[id];if(!p)return -1;if(p.neutral)return 2;if(p.side==='B')return p.w>=3?0:1;if(p.side==='A')return p.w>=3?4:3;return -1};
const alAnswered=()=>ISS.filter(i=>alPick(i.id)>=0).length;
const AL_VOTES=Object.fromEntries(ISS.map(i=>[i.id,DATA.votes.map(v=>['Senate',v]).concat(DATA.hvotes.map(v=>['House',v])).filter(([,v])=>(v.codes||[]).some(c=>c.issue===i.id)).sort((a,b)=>b[1].date.localeCompare(a[1].date))]));
function alTied(i){
  const V=AL_VOTES[i.id];
  if(!V.length)return 'No key congressional vote on this yet; compared with state records, official actions and statements where they exist.';
  return 'Compared with: '+V.slice(0,2).map(([c,v])=>`${esc(v.short)} (${c}, ${v.date.slice(0,4)})`).join(' · ')+(V.length>2?` · ${V.length-2} more`:'');
}
function alCard(i){
  const [g,label,icon]=AL_GBY[i.group]||['econ','Other','•'], n=AL_ORDER.indexOf(i)+1, k=alPick(i.id);
  return `<article class="al-q" data-i="${i.id}"><div class="al-qh"><span class="al-ic al-${g}" aria-hidden="true">${icon}</span><span class="al-tag al-${g}">${label}</span><span class="al-qn">Question ${n} of ${ISS.length}</span></div>
    <h3 id="alq-${i.id}">${esc(i.statement||i.A)}</h3><p class="al-tied">${alTied(i)}</p>
    <div class="al-opts" role="radiogroup" aria-labelledby="alq-${i.id}">${AL_OPTS.map((o,j)=>`<button type="button" role="radio" aria-checked="${k===j}" data-k="${j}" class="${k===j?'on':''}"><span class="al-r" aria-hidden="true"></span>${o[2]}</button>`).join('')}</div></article>`;
}
function alList(){return alView.g?AL_ORDER.filter(i=>i.group===alView.g):AL_ORDER.slice(alView.page*AL_PAGE,alView.page*AL_PAGE+AL_PAGE);}
// "Your matches so far": the closest records to your answers, or flipped to the furthest ("mismatches").
let alLiveMode='match', alLiveCh='';
function alLive(){
  const mis=alLiveMode==='mismatch', chName={S:'Senate',H:'House'}[alLiveCh]||'', title=`Your ${chName?chName+' ':''}${mis?'mismatches':'matches'} so far`;
  const sw=`<div class="seg al-seg" role="group" aria-label="Show matches or mismatches"><button type="button" data-m="match" class="${mis?'':'active'}" aria-pressed="${!mis}">Top matches</button><button type="button" data-m="mismatch" class="${mis?'active':''}" aria-pressed="${mis}">Top mismatches</button></div>`;
  const sw2=`<div class="seg al-seg" role="group" aria-label="Which races">${[['','All'],['S','Senate'],['H','House']].map(([c,l])=>`<button type="button" data-c="${c}" class="${alLiveCh===c?'active':''}" aria-pressed="${alLiveCh===c}">${l}</button>`).join('')}</div>`;
  const counted=chosenIssues().length;
  if(!counted)return `<h4>${title}</h4>${sw}${sw2}<p class="small muted" style="margin:0">Answer a few questions${alAnswered()?' (Neutral answers are not counted)':''} to see how every candidate compares.</p>`;
  const rows=ALL.filter(s=>!alLiveCh||s.chamber===alLiveCh).map(s=>({s,r:scoreFor(s)})), graded=rows.filter(x=>x.r.score!=null);
  // matches are records at 50% or more of your answers, mismatches below 50%, so neither list borrows from the other
  const pool=graded.filter(x=>mis?x.r.score<50:x.r.score>=50).sort((a,b)=>(mis?a.r.score-b.r.score:b.r.score-a.r.score)||a.s.name.localeCompare(b.s.name));
  const list=pool.slice(0,6).map(({s,r})=>{const L=letter(r.score);return `<a class="al-lr" href="#${s.id}-match"><span class="chip ${s.party}">${s.party}</span><span class="al-ln">${esc(s.name)}<small>${esc(seatLabel(s))} ${s.chamber==='S'?'Senate':'House'}</small></span><b class="gr-${L}">${L}</b><span class="al-lp">${r.score}%</span></a>`}).join('');
  const where=chName?` in ${chName} races`:'';
  const empty=!graded.length?`No one${where} has enough evidence on your issues yet.`:mis?`No one${where} is below 50% on your answers yet.`:`No one${where} reaches 50% on your answers yet.`;
  return `<h4>${title}</h4>${sw}${sw2}${list||`<p class="small muted" style="margin:0">${empty}</p>`}
    <p class="al-foot">${pool.length?`${mis?'Lowest':'Top'} ${Math.min(6,pool.length)} of ${pool.length} ${mis?'below 50%, furthest from your answers first':'at 50% or more'} · `:''}${graded.length} graded${where}, ${rows.length-graded.length} not graded yet.${chName?` ${chName} races include challengers${DATA.races.some(r=>r.chamber===alLiveCh&&r.open)?' and nominees for open seats':''}.`:''} Based on your ${counted} answer${counted===1?'':'s'} that ${counted===1?"isn't":"aren't"} Neutral; a grade needs evidence on 3 of your issues. <button type="button" class="al-link" id="al-all">See every candidate ↓</button></p>`;
}
function alResults(){
  const ch=chosenIssues();
  if(!ch.length)return '<div class="note">Answer at least one question (other than Neutral) to see how every candidate compares, race by race.</div>';
  return `<p class="small muted" style="margin:0 0 6px">Results for ${ch.length} issue${ch.length===1?'':'s'}. Open a candidate for the issue-by-issue breakdown and every piece of evidence.</p>`+DATA.races.map(r=>{const C=r.keys.map(k=>byId[k]);return `<article class="race"><div class="rh"><h3>${esc(r.label)}</h3><span class="small muted">${r.open?'Open seat':'Incumbent running'}</span></div>
    <div class="tablewrap"><table><thead><tr><th>Candidate</th><th>Compared with your choices</th><th>Evidence used</th></tr></thead><tbody>${C.map(s=>{const sc=scoreFor(s);return `<tr><td><a href="#${s.id}-match"><b>${esc(s.name)}</b></a> <span class="chip ${s.party}">${s.party}</span></td><td>${sc.score==null?scoreBadge(sc):`<span class="alscore"><b class="gr-${letter(sc.score)}">${letter(sc.score)}</b> <b>${sc.score}%</b> match</span>`}<div class="small muted">${sc.nCov} of ${sc.nChosen} of your issues have evidence</div></td><td class="small">${esc(evidenceOf(s).label)}<div class="muted">${esc(evidenceMix(s))}</div></td></tr>`}).join('')}</tbody></table></div>
    ${evidenceNote(C)?`<p class="small" style="margin:6px 0 0;color:var(--ink-2)"><b>Comparing records:</b> ${evidenceNote(C)}</p>`:''}</article>`}).join('');
}
function renderAlign(){
  const pages=Math.ceil(ISS.length/AL_PAGE);
  app.innerHTML=`
  <section class="al-hero">
    <svg class="al-dome" width="300" height="172" viewBox="0 0 330 190" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M165 10v22M158 32h14M150 60c0-14 7-26 15-28 8 2 15 14 15 28"/><path d="M118 96c0-24 21-40 47-40s47 16 47 40"/><path d="M108 96h114v10H108zM112 106v34M124 106v34M136 106v34M148 106v34M160 106v34M172 106v34M184 106v34M196 106v34M208 106v34M218 106v34"/><path d="M30 140h270v10H30zM40 150v30M290 150v30M30 180h270"/><path d="M60 150v30M80 150v30M100 150v30M230 150v30M250 150v30M270 150v30"/><path d="M95 140V122h140v18"/></svg>
    <h1>My <em>alignment</em></h1>
    <p class="al-lede">Say how strongly you agree or disagree with each statement. There are no right or wrong answers. Your answers are compared with every candidate's real votes, bills and statements, issue by issue.</p>
    <div class="al-feats">
      <div><span class="al-fi" aria-hidden="true">▤</span><div><b>${ISS.length} issues, tied to real votes</b><small>Each question lists the roll calls behind it</small></div></div>
      <div><span class="al-fi" aria-hidden="true">🔒</span><div><b>Your answers stay with you</b><small>Saved only in this browser</small></div></div>
      <div><span class="al-fi" aria-hidden="true">⚖</span><div><b>Not a rating of candidates</b><small>Same questions and rules for everyone</small></div></div>
    </div>
  </section>
  <div class="al-wrap">
    <nav class="al-cats" id="al-cats" aria-label="Question categories"></nav>
    <div class="al-main">
      <div class="al-top"><b id="al-pos"></b><span id="al-pct"></span></div>
      <div class="al-prog" aria-hidden="true"><i id="al-bar"></i></div>
      <div id="al-qs"></div>
      <div class="al-nav"><button type="button" class="al-btn" id="al-prev">← Previous</button><span class="small muted">Answer as many as you like; results update as you go</span><button type="button" class="al-btn p" id="al-next">Next →</button></div>
      <div class="al-ex"><span class="small muted">Or start from an example (you can change every answer):</span>${EXAMPLES.map((x,k)=>`<button class="pill" data-ex="${k}">${esc(x.name)}</button>`).join('')}<button class="pill ghostb" data-ex="clear">Clear all</button></div>
    </div>
    <aside class="al-box al-live" id="al-live" aria-live="polite"></aside>
    <aside class="al-box al-keep"><h4>💡 Keep in mind</h4><p>"Strongly" counts three times as much as a plain agree or disagree. Neutral skips the issue, and it never counts against anyone. A match describes a record compared with your views; it is not a rating of the candidate.</p></aside>
  </div>
  <section class="section" id="al-results" style="padding-top:8px"><h2>Every candidate, race by race</h2>${ALNOTE}<div id="alr"></div></section>`;
  const drawCats=()=>{$('#al-cats').innerHTML=[['','All questions','☰',ISS.length]].concat(AL_GROUPS.map(([g,l,ic])=>[g,l,ic,ISS.filter(i=>i.group===g).length])).map(([g,l,ic,n])=>{const done=(g?ISS.filter(i=>i.group===g):ISS).filter(i=>alPick(i.id)>=0).length;return `<button type="button" class="al-cat${alView.g===g?' on':''}" data-g="${g}" aria-pressed="${alView.g===g}"><span class="al-ic${g?' al-'+g:''}" aria-hidden="true">${ic}</span><span class="al-cl">${l}</span><span class="al-cn" title="${done} of ${n} answered">${n}</span></button>`}).join('');};
  const drawTop=()=>{const L=alList(),a=alAnswered();
    $('#al-pos').textContent=alView.g?`${AL_GBY[alView.g][1]} · ${L.length} question${L.length===1?'':'s'}`:`Questions ${alView.page*AL_PAGE+1}–${alView.page*AL_PAGE+L.length} of ${ISS.length}`;
    $('#al-pct').textContent=`${a} of ${ISS.length} answered · ${Math.round(a/ISS.length*100)}% complete`;
    $('#al-bar').style.width=(a/ISS.length*100)+'%';
    const gi=AL_GROUPS.findIndex(g=>g[0]===alView.g);
    $('#al-prev').disabled=alView.g?false:alView.page===0;
    $('#al-next').textContent=alView.g?(gi<AL_GROUPS.length-1?`Next: ${AL_GROUPS[gi+1][1]} →`:'See my results ↓'):(alView.page<pages-1?'Next →':'See my results ↓');};
  const drawQs=()=>{$('#al-qs').innerHTML=alList().map(alCard).join('');};
  const drawBox=focus=>{$('#al-live').innerHTML=alLive();const b=$('#al-all');if(b)b.addEventListener('click',()=>$('#al-results').scrollIntoView({behavior:'smooth'}));if(focus){const f=$(`#al-live ${focus}`);if(f)f.focus();}};
  const drawLive=()=>{drawBox();$('#alr').innerHTML=alResults();bindTips(app);};
  $('#al-live').addEventListener('click',e=>{const m=e.target.closest('button[data-m]'),c=e.target.closest('button[data-c]');
    if(m&&m.dataset.m!==alLiveMode){alLiveMode=m.dataset.m;drawBox(`[data-m="${alLiveMode}"]`);}
    else if(c&&c.dataset.c!==alLiveCh){alLiveCh=c.dataset.c;drawBox(`[data-c="${alLiveCh}"]`);}});
  const all=()=>{drawCats();drawTop();drawQs();drawLive();};
  $('#al-qs').addEventListener('click',e=>{
    const b=e.target.closest('button[data-k]');if(!b)return;
    const id=b.closest('.al-q').dataset.i, k=+b.dataset.k, was=alPick(id);
    if(was===k)delete PROF.issues[id];
    else{const [side,w]=AL_OPTS[k];PROF.issues[id]=side?{side,w}:{side:'',w:0,neutral:true};}
    saveProf();
    b.closest('.al-opts').querySelectorAll('button').forEach(x=>{const on=+x.dataset.k===alPick(id);x.classList.toggle('on',on);x.setAttribute('aria-checked',on);});
    drawCats();drawTop();drawLive();
  });
  $('#al-cats').addEventListener('click',e=>{const b=e.target.closest('button[data-g]');if(!b)return;alView={g:b.dataset.g,page:0};all();});
  const go=d=>{
    if(alView.g){const gi=AL_GROUPS.findIndex(g=>g[0]===alView.g)+d;if(gi<0){alView={g:'',page:0};}else if(gi>=AL_GROUPS.length){$('#al-results').scrollIntoView({behavior:'smooth'});return}else alView.g=AL_GROUPS[gi][0];}
    else{const p=alView.page+d;if(p>=pages){$('#al-results').scrollIntoView({behavior:'smooth'});return}alView.page=Math.max(0,p);}
    all();$('.al-main').scrollIntoView({behavior:'smooth',block:'start'});
  };
  $('#al-prev').addEventListener('click',()=>go(-1));
  $('#al-next').addEventListener('click',()=>go(1));
  app.querySelectorAll('[data-ex]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.ex;PROF={issues:{}};if(k!=='clear')Object.entries(EXAMPLES[+k].set).forEach(([i,[s,w]])=>PROF.issues[i]={side:s,w});saveProf();all();}));
  all();
}
function evRow(e,want){
  const m=want?(e.side===want):null;
  return `<li class="evi"><span class="mk ${m===null?'':m?'yes':'no'}" aria-label="${m===null?'':m?'matches your choice':'differs from your choice'}">${m===null?'·':m?'✓':'✕'}</span>
    <div><div><span class="chip ghost">${esc(TYPEL[e.type]||e.type)}</span> <b>${esc(e.title)}</b> <span class="mono muted">${esc(e.date||'date not given')}</span></div>
    <div class="small">${e.pos?`Position: <b>${esc(e.pos)}</b> → `:''}counts toward "${esc(sideLabel(e.issue||'',e.side))}"</div>
    <div class="small muted">${e.yea?`What the measure does: ${esc(e.why)} A Yea counts toward "${esc(sideLabel(e.issue,e.yea))}".`:`Why: ${esc(e.why)}`} ${e.src&&e.src.u?`<a href="${esc(e.src.u)}" target="_blank" rel="noopener">${esc(e.src.t||'source')} ↗</a>`:''}</div></div></li>`;
}
// ---------- Your match tab: the comparison with your choices, then the record it is drawn from ----------
function paneMatch(s,pane){
  pane.innerHTML='<div id="m-al"></div><div id="m-rec"></div>';
  recordInto(s,pane.querySelector('#m-rec'));
  alignInto(s,pane.querySelector('#m-al'));
}
function alignInto(s,host){
  const draw=()=>{
    const r=scoreFor(s);
    const ev=s.evidence||{};
    const all=ISS.filter(i=>(ev[i.id]||[]).length);
    const md=!r.nChosen?'You have not chosen any positions yet.':r.score==null?`Evidence on ${r.nCov} of your ${r.nChosen} issues, too few for a grade.`:`Based on ${r.nCov} of your ${r.nChosen} issues.`;
    host.innerHTML=`${gradeHead('Your match',r.score,md,GRADE_TIP.match+' It uses your own choices, saved only in this browser.')}
    <p class="intro">How ${esc(s.short)}'s documented record compares with the positions you choose below. ${esc(evidenceOf(s).label)}.</p>
    ${ALNOTE}
    <div class="chart"><div class="kicker">How the match is calculated</div>
      ${r.nChosen?`<p class="small" style="margin:6px 0 0">${r.score==null?`Evidence covers ${r.nCov} of your ${r.nChosen} issues (${Math.round(r.covW/r.totW*100)||0}% of your total importance). A score needs at least ${r.need} issue${r.need===1?'':'s'} with evidence and at least half of your total importance.`:`For each of your issues with evidence, the share of ${esc(s.short)}'s items that match your side, weighted by importance (an issue backed only by statements counts at half its importance): ${r.rows.filter(x=>x.status!=='none').map(x=>`${esc(x.i.label)} ${x.match}/${x.n} × ${+x.iw.toFixed(2)}${x.status==='stated'?' (statements only)':''}`).join(' + ')} = ${(r.num).toFixed(2)}, divided by the importance counted ${+r.effW.toFixed(2)} = <b>${r.score}%</b>. A sponsorship and a vote on the same bill count once. Issues without evidence (${r.nChosen-r.nCov}) are left out rather than scored as zero.`}</p>`:`<p class="small" style="margin:6px 0 0">Choose positions below, or on the <a href="#align">My alignment</a> page.</p>`}
    </div>
    ${r.nChosen?`<h3 style="margin-top:18px">Issue by issue</h3>${r.rows.map(x=>`<div class="alissue">
      <div class="row" style="justify-content:space-between"><div><b>${esc(x.i.label)}</b> <span class="small muted">· you: ${esc(sideLabel(x.i.id,x.pr.side))} · importance ${WLAB[x.pr.w]}</span></div>
      <div>${x.status==='none'?'<span class="chip ghost">Insufficient data</span>':`<span class="chip ${x.agree>=.5?'dfor':'dag'}">${x.match} of ${x.n} ${x.status==='record'?'recorded actions':'statements'} match</span>`}</div></div>
      ${x.status==='stated'?'<p class="small" style="margin:4px 0 0;color:var(--warn)">Based on stated positions only: no recorded vote, bill or official action on this issue, so it counts at half its importance.</p>':''}
      ${x.status==='record'&&x.st.length?`<p class="small muted" style="margin:4px 0 0">Stated positions on this issue (shown, not scored because recorded actions exist): ${x.stMatch} of ${x.st.length} match.</p>`:''}
      ${(x.rec.concat(x.st)).length?`<ul class="evl">${x.rec.concat(x.st).map(e=>evRow(Object.assign({issue:x.i.id},e),x.pr.side)).join('')}</ul>`:`<p class="small muted" style="margin:4px 0 0">No documented vote, bill, official action or statement on this issue was found for ${esc(s.short)}.${(s.notVoted||{})[x.i.id]?' Did not vote on: '+s.notVoted[x.i.id].map(n=>esc(n.title)).join('; ')+'.':''}</p>`}
    </div>`).join('')}`:''}
    <details class="tv" ${r.nChosen?'':'open'}><summary>${r.nChosen?'Change your choices':'Choose your positions'}</summary><div id="alb2" style="margin-top:10px">${builderHTML()}</div></details>
    ${all.length?`<h3 style="margin-top:22px">All coded evidence for ${esc(s.short)}</h3><p class="small muted">Every item used for alignment, by issue, whatever your choices.</p>${all.map(i=>`<div class="alissue"><b>${esc(i.label)}</b><ul class="evl">${ev[i.id].map(e=>evRow(Object.assign({issue:i.id},e),null)).join('')}</ul></div>`).join('')}`:`<div class="note" style="margin-top:16px">No documented action or statement by ${esc(s.short)} could be coded to the issue list, so no comparison is possible. ${s.recordType==='none'||s.recordType==='executive'?esc(s.short)+' has no legislative voting record.':''}</div>`}`;
    bindBuilder(host.querySelector('#alb2'),rebuild=>{draw();});
    bindTips(host);
  };
  draw();
}

// ---------- legislative record tab (votes with bill details, state record, other record, money & votes, ethics) ----------
function billDetails(v){
  const b=v.bill||{};
  const codes=(v.codes||[]).map(c=>`<li><b>${esc(ISSBY[c.issue].label)}</b>: a Yea counts toward "${esc(sideLabel(c.issue,c.yea))}". ${esc(c.why)}</li>`).join('');
  return `<details class="bd"><summary>Bill details and why it is filed under this issue</summary>
    <dl class="kvd small">
      <dt>Measure</dt><dd>${esc(b.measure||'')}${b.popularTitle?` (${esc(b.popularTitle)})`:''}</dd>
      ${b.officialTitle?`<dt>Official title</dt><dd>${esc(b.officialTitle)}</dd>`:''}
      ${b.introduced?`<dt>Introduced</dt><dd>${fmtDate(b.introduced)}</dd>`:''}
      <dt>What it does</dt><dd>${esc(b.summary||'')} ${b.summarySrc?`<a href="${esc(b.summarySrc.u)}" target="_blank" rel="noopener">${esc(b.summarySrc.t)} ↗</a>`:''}</dd>
      ${(b.provisions||[]).length?`<dt>Key provisions</dt><dd><ul class="list">${b.provisions.map(p=>`<li>${esc(p.fact)} <a href="${esc(p.src.u)}" target="_blank" rel="noopener">source ↗</a></li>`).join('')}</ul></dd>`:''}
      <dt>Recorded vote</dt><dd>${fmtDate(v.date)} · ${esc(b.voteQuestion||v.question)} · ${esc(v.result)} · <a href="${voteUrl(v)}" target="_blank" rel="noopener">official tally ↗</a></dd>
      <dt>Policy area</dt><dd>${esc(v.area)}</dd>
      <dt>Alignment issue</dt><dd>${codes?`<ul class="list">${codes}</ul>`:`Not used for voter alignment: ${esc(v.excluded||'')}`}</dd>
    </dl></details>`;
}
function keyVotesBlock(s,V,label,id){
  if(!V.length)return '';
  const areas=[...new Set(V.map(v=>v.area))].sort();
  const html=`<section class="recsec" id="${id}"><div class="kicker">Congressional record</div><h3 style="margin-top:4px">${esc(label)}</h3>
    <p class="small muted" style="margin:4px 0 8px">${V.length} consequential roll calls chosen by this app, newest first. Open "Bill details" for the measure's summary, the recorded result and why it is filed under its issue.</p>${vtLegend()}
    <div class="filters" data-vf><button class="active" data-a="">All areas</button>${areas.map(a=>`<button data-a="${esc(a)}">${esc(a)}</button>`).join('')}</div><div data-vl></div></section>`;
  return html;
}
// ---------- funders' and spenders' own published positions vs. the candidate's votes ----------
const GP=DATA.groupPos||[], GPBY=Object.fromEntries(GP.map(g=>[g.key,g]));
// ---------- money and votes over time: one group's money to or about a candidate, month by month, on the same axis as its key votes ----------
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const monLabel=m=>`${MON[+m.slice(5,7)-1]} ${m.slice(0,4)}`;
const nextMon=m=>{let y=+m.slice(0,4),k=+m.slice(5,7)+1;if(k>12){k=1;y++;}return `${y}-${String(k).padStart(2,'0')}`};
// Months from the group: contributions from the FEC bulk file (all years); outside spending naming the candidate from the bulk
// file before 2025 and from the reviewed 2025-26 data (the same rows as the totals above) after.
function fundSeries(s,g){
  const H=window.FUNDHIST;if(!H)return null;
  const grp=(DATA.groupPos.find(x=>x.key===g.key)||{}).fecIds||[], ids=new Set(grp.map(f=>f.id));
  const M=new Map(), add=(m,k,v)=>{const o=M.get(m)||{c:0,f:0,a:0};o[k]+=v;M.set(m,o);};
  const h=(H.people[s.id]||{})[g.key]||{c:[],f:[],a:[]};
  for(const k of ['c','f','a'])h[k].forEach(([m,v])=>add(m,k,v));
  (IE.rows[s.race]||[]).forEach(r=>{if(r[0]<H.ieBefore||r[2]!==s.fecCand||!ids.has(cmOf(r[1])[0]))return;add(r[0].slice(0,7),r[3]==='S'?'f':'a',r[4]);});
  const votes=g.compared.map((c,i)=>({c,i})).sort((a,b)=>a.c.date.localeCompare(b.c.date)).map((x,k)=>Object.assign({n:k+1},x));
  let end=DATA.ie_asof.slice(0,7);
  votes.forEach(v=>{if(v.c.date.slice(0,7)>end)end=v.c.date.slice(0,7)});
  const months=[];for(let m=H.start.slice(0,7);m<=end;m=nextMon(m))months.push(m);
  const tot={c:0,f:0,a:0};M.forEach(o=>{tot.c+=o.c;tot.f+=o.f;tot.a+=o.a;});
  return {M,months,votes,tot,committees:grp.map(f=>f.name),H};
}
const voteNum=(g,i)=>1+g.compared.map((c,k)=>[c.date,k]).sort((a,b)=>a[0].localeCompare(b[0])||a[1]-b[1]).findIndex(x=>x[1]===i);
function fundTimeline(s,g,id){
  const d=fundSeries(s,g);if(!d)return '';
  const {tot,M,votes,H}=d, none=!(tot.c||tot.f||tot.a);
  const rows=d.months.filter(m=>M.has(m)||votes.some(v=>v.c.date.slice(0,7)===m));
  const vt=v=>`#${v.n} ${esc(v.c.short)}: ${v.c.match===null?'did not vote':v.c.match?'✓ same as the group':'✕ opposite of the group'}`;
  return `<div class="ftl-wrap"><div class="kicker" style="margin-top:14px">Money and votes over time</div>
    <p class="small" style="margin:4px 0 6px">${none?`No money from ${esc(g.org)} to or about ${esc(s.short)} appears in the FEC data for ${fmtDate(H.start)} – ${fmtDate(DATA.ie_asof)}; only the votes are shown.`:`In this chart, ${fmtDate(H.start)} – ${fmtDate(DATA.ie_asof)}: contributions to the campaign <b class="num">${fmtFull(tot.c)}</b> · outside spending for ${esc(s.short)} <b class="num">${fmtFull(tot.f)}</b> · against ${esc(s.short)} <b class="num">${fmtFull(tot.a)}</b>.`}</p>
    <div class="legend" style="margin:0 0 6px"><span><i style="background:var(--s1)"></i>Contributions to ${esc(s.short)}'s campaign</span><span><i style="background:var(--s3)"></i>Outside spending for ${esc(s.short)}</span><span><i style="background:var(--s2)"></i>Outside spending against ${esc(s.short)} (below the line)</span><span><i class="ftl-key same"></i>Voted the way ${esc(g.org)} wanted</span><span><i class="ftl-key opp"></i>Voted the opposite way</span></div>
    <div class="ftl" id="${id}" data-person="${esc(s.id)}" data-group="${esc(g.key)}"></div>
    <p class="small muted" style="margin:6px 0 0">Each bar is one month. Above the line is money for ${esc(s.short)}: checks to the campaign from the group's PACs, and outside ads or mail that name ${esc(s.short)} in support. Below the line is outside spending naming ${esc(s.short)} in opposition, which is money spent to defeat ${esc(s.short)}, not money ${esc(s.short)} received. The numbered circles are the votes in the table above, placed on their dates. Committees counted: ${esc(d.committees.join(', '))}. Sources: FEC bulk data for contributions (through ${fmtDate(H.contribThrough)}) and for outside spending before 2025; outside spending from 2025 on is the same data as the totals above. Outside spending counts only general-election items that name ${esc(s.short)} directly, so it can be lower than the totals above, which also count spending on opponents; primary spending is not shown. <b>Money arriving near a vote does not show that it influenced the vote.</b></p>
    <details class="tv"><summary>Show as a table</summary><div class="tablewrap"><table><thead><tr><th>Month</th><th class="r">Contributions</th><th class="r">Outside for</th><th class="r">Outside against</th><th>Votes that month</th></tr></thead><tbody>${rows.map(m=>{const o=M.get(m)||{c:0,f:0,a:0};return `<tr><td class="mono" style="white-space:nowrap">${monLabel(m)}</td><td class="r">${o.c?fmtFull(o.c):'—'}</td><td class="r">${o.f?fmtFull(o.f):'—'}</td><td class="r">${o.a?fmtFull(o.a):'—'}</td><td class="small">${votes.filter(v=>v.c.date.slice(0,7)===m).map(vt).join('<br>')}</td></tr>`}).join('')||'<tr><td colspan="5" class="muted">No months with money or votes.</td></tr>'}</tbody></table></div></details></div>`;
}
function drawFundTL(el){
  if(!el)return;
  const s=byId[el.dataset.person], g=(s.funderPos||[]).find(x=>x.key===el.dataset.group), d=s&&g&&fundSeries(s,g);if(!d)return;
  const {M,months,votes}=d, n=months.length;
  const W=Math.max(300,el.clientWidth), small=W<560, mL=small?42:54, mR=8, top=20;
  const mw=(W-mL-mR)/n, X=i=>mL+i*mw;
  const xDate=iso=>{const i=months.indexOf(iso.slice(0,7));const dim=new Date(+iso.slice(0,4),+iso.slice(5,7),0).getDate();return X(Math.max(0,i)+(+iso.slice(8,10)-.5)/dim)};
  let up=0,down=0;M.forEach(o=>{up=Math.max(up,o.c+o.f);down=Math.max(down,o.a)});
  const P=small?110:140, total=up+down||1, upH=up||down?P*up/total:P/2, base=top+upH, k=P/total;
  const plotBottom=top+P, axisY=plotBottom+(down?0:2);
  let svg='';
  // election days (first Tuesday after the first Monday in November, even years)
  for(let y=+months[0].slice(0,4);y<=+months[n-1].slice(0,4);y++){if(y%2)continue;const m=`${y}-11`,i=months.indexOf(m);if(i<0)continue;const x=X(i);svg+=`<rect class="ftl-elec" x="${x}" y="${top}" width="${Math.max(2,mw)}" height="${P}"></rect>${small?'':`<text class="ftl-small" x="${x+mw/2}" y="${top-6}" text-anchor="middle">${y} election</text>`}`;}
  // data end shading
  const endI=months.indexOf(DATA.ie_asof.slice(0,7));if(endI>=0&&endI<n-1)svg+=`<rect class="ftl-nodata" x="${X(endI+1)}" y="${top}" width="${X(n)-X(endI+1)}" height="${P}"></rect>`;
  svg+='@@GUIDES@@';
  // bars and hover columns
  const bw=Math.max(1,mw-(mw>4?1:0));
  months.forEach((m,i)=>{
    const o=M.get(m);if(!o)return;
    const x=X(i);
    const hc=o.c*k, hf=o.f*k, ha=o.a*k;
    if(hc>0)svg+=`<rect class="ftl-c" x="${x}" y="${base-Math.max(2,hc)}" width="${bw}" height="${Math.max(2,hc)}"></rect>`;
    if(hf>0)svg+=`<rect class="ftl-f" x="${x}" y="${base-(hc>0?Math.max(2,hc)+1:0)-Math.max(2,hf)}" width="${bw}" height="${Math.max(2,hf)}"></rect>`;
    if(ha>0)svg+=`<rect class="ftl-a" x="${x}" y="${base}" width="${bw}" height="${Math.max(2,ha)}"></rect>`;
    const tip=`${monLabel(m)} · contributions ${fmtFull(o.c)} · outside for ${fmtFull(o.f)} · outside against ${fmtFull(o.a)}`;
    svg+=`<rect class="ftl-hit" x="${x}" y="${top}" width="${Math.max(mw,1)}" height="${P}" data-tip="${esc(tip)}"></rect>`;
  });
  // value scale: the line, and the largest month in each direction
  svg+=`<line class="ftl-base" x1="${mL}" x2="${W-mR}" y1="${base}" y2="${base}"></line>`;
  svg+=`<text class="ftl-y" x="${mL-6}" y="${base+4}" text-anchor="end">$0</text>`;
  if(up)svg+=`<text class="ftl-y" x="${mL-6}" y="${top+9}" text-anchor="end">${fmt$(up)}</text><line class="ftl-grid" x1="${mL}" x2="${W-mR}" y1="${top}" y2="${top}"></line>`;
  if(down)svg+=`<text class="ftl-y" x="${mL-6}" y="${plotBottom}" text-anchor="end">−${fmt$(down)}</text><line class="ftl-grid" x1="${mL}" x2="${W-mR}" y1="${plotBottom}" y2="${plotBottom}"></line>`;
  // years
  const yAx=axisY+14;
  months.forEach((m,i)=>{if(m.endsWith('-01')){const x=X(i);svg+=`<line class="ftl-tick" x1="${x}" x2="${x}" y1="${axisY}" y2="${axisY+4}"></line>`;if(!small||(+m.slice(0,4))%2===0)svg+=`<text class="ftl-small" x="${x}" y="${yAx}" text-anchor="middle">${m.slice(0,4)}</text>`;}});
  // votes: numbered circles on their dates, stacked when they would overlap
  const r=small?8:9, laneTop=yAx+10, rows=[];
  const placed=votes.map(v=>{const x=xDate(v.c.date);let row=0;while((rows[row]||[]).some(px=>Math.abs(px-x)<r*2+2))row++;(rows[row]=rows[row]||[]).push(x);return {v,x,row};});
  const laneH=(rows.length||1)*(r*2+6);
  let guides='';placed.forEach(({v,x})=>{guides+=`<line class="ftl-guide ${v.c.match===null?'nv':v.c.match?'same':'opp'}" x1="${x}" x2="${x}" y1="${top}" y2="${laneTop}"></line>`;});
  placed.forEach(({v,x,row})=>{
    const cy=laneTop+r+row*(r*2+6), cls=v.c.match===null?'nv':v.c.match?'same':'opp';
    const tip=`#${v.n} ${fmtDate(v.c.date)} · ${v.c.short} · ${g.org} wanted ${v.c.wanted}, ${s.short} voted ${v.c.cast}${v.c.match===null?'':v.c.match?' (same)':' (opposite)'}`;
    svg+=`<g class="ftl-vote ${cls}" data-tip="${esc(tip)}"><circle cx="${x}" cy="${cy}" r="${r}"></circle><text x="${x}" y="${cy+4}" text-anchor="middle">${v.n}</text></g>`;
  });
  svg=svg.replace('@@GUIDES@@',guides);
  const H=laneTop+laneH+4;
  el.innerHTML=`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(g.org)}'s money to or about ${esc(s.name)} by month since ${monLabel(months[0])}, with ${votes.length} key votes on the same time axis. The table below the chart lists every month.">${svg}</svg>`;
  bindTips(el);
}
function mountFundTL(root){root.querySelectorAll('.ftl').forEach(el=>{const f=()=>drawFundTL(document.getElementById(el.id));f();resizers.push(f);});}

function fundersBlock(s){
  const F=s.funderPos||[];
  const noVotes=!realVotes(s,DATA.votes).length&&!realVotes(s,DATA.hvotes).length;
  const head=`<section class="recsec" id="rec-funders"><div class="kicker">Funding and legislative activity, side by side</div><h3 style="margin-top:4px">What ${esc(s.short)}'s funders and spenders wanted, and how ${esc(s.short)} voted</h3>
    <div class="note small" style="margin:6px 0 12px">For groups that gave to ${esc(s.short)}'s campaign or spent on the race <i>and</i> publish their own positions on bills (congressional scorecards or "key vote" letters), each of the key votes the group took a position on is shown next to ${esc(s.short)}'s recorded vote, with a link to the group's own page. <b>A match shows agreement, not that money influenced the vote</b>: groups mostly fund and support people who already vote their way, and spend against people who don't. Positions are collected for organizations that publish scorecards or key-vote letters (${GP.filter(g=>g.status==='done').length} of ${GP.length} finished so far); other spenders, including the large party-aligned super PACs, are not compared.</div>`;
  if(!F.length)return head+`<p class="small muted">None of the ${GP.length} organizations whose published positions are collected gave to ${esc(s.short)}'s campaign or spent on this race in the data used here.</p></section>`;
  const money=g=>[g.pac?`gave <b class="num">${fmtFull(g.pac)}</b> to the campaign (${g.pacN} contribution${g.pacN>1?'s':''}, ${esc(s.pac.window)})`:'',g.for?`spent <b class="num">${fmtFull(g.for)}</b> ${s.out.multi?'supporting':'for'} ${esc(s.short)}`:'',g.against?`spent <b class="num">${fmtFull(g.against)}</b> ${s.out.multi?'opposing':'against'} ${esc(s.short)}`:''].filter(Boolean).join('; ');
  const body=F.map(g=>{
    const meta=GPBY[g.key]||{};
    let res;
    if(g.status==='pending')res=`<p class="small" style="margin:6px 0 0">${flag('Research not finished','This organization\'s published positions have not been collected yet; they will be added in the next update.')} Its positions on these votes are not shown yet.</p>`;
    else if(noVotes)res=`<p class="small muted" style="margin:6px 0 0">${esc(s.short)} has no recorded congressional votes among the key votes, so there is nothing to compare.</p>`;
    else if(!g.compared.length)res=`<p class="small muted" style="margin:6px 0 0">No published position by ${esc(g.org)} was found on the key votes ${esc(s.short)} cast.</p>`;
    else res=`<p class="small" style="margin:6px 0 4px"><b>${esc(s.short)} voted the way ${esc(g.org)} wanted on ${g.agree} of ${g.n} key votes it scored or took a public position on.</b></p>
      <div class="tablewrap"><table><thead><tr><th>#</th><th>Vote</th><th>${esc(g.org)} wanted</th><th>${esc(s.short)} voted</th><th>Same?</th><th>Group's own source</th></tr></thead><tbody>${g.compared.map((c,ci)=>{const v=(DATA.votes.concat(DATA.hvotes)).find(x=>x.id===c.voteId);return `<tr><td><span class="ftl-num ${c.match===null?'nv':c.match?'same':'opp'}">${voteNum(g,ci)}</span></td><td><a href="${voteUrl(v)}" target="_blank" rel="noopener">${esc(c.short)}</a><div class="small muted">${esc(c.chamber)} · ${fmtDate(c.date)}</div></td><td><span class="chip ${posClass(c.wanted)}">${esc(c.wanted)}</span></td><td><span class="chip ${posClass(c.cast)}">${esc(c.cast)}</span></td><td>${c.match===null?'<span class="muted">did not vote</span>':c.match?'<b style="color:var(--good)">✓ Same</b>':'<b style="color:var(--crit)">✕ Opposite</b>'}</td><td class="small">${c.basis==='scorecard'?'Scored in its scorecard':'Public position before the vote'}: <a href="${esc(c.src.u)}" target="_blank" rel="noopener">${esc(c.src.t)} ↗</a></td></tr>`}).join('')}</tbody></table></div>${fundTimeline(s,g,'ftl-'+g.key)}`;
    return `<div class="mv"><h4>${esc(g.org)}</h4><p class="small" style="margin:0">${money(g)}${g.spenders.length?` <span class="muted">(${esc(g.spenders.join(', '))})</span>`:''}</p>${res}</div>`;}).join('');
  return head+body+`<p class="small muted" style="margin-top:10px">Organizations researched: ${GP.map(g=>esc(g.org)+(g.status==='pending'?' (in progress)':'')).join(', ')}. <a href="#method">How positions were collected</a>.</p></section>`;
}

function moneyVotesBlock(s){
  const A=s.assoc||{}, keys=ISS.map(i=>i.id).filter(k=>A[k]);
  const head=`<section class="recsec" id="rec-money"><div class="kicker">Funding and legislative activity, by issue</div><h3 style="margin-top:4px">Money and votes by issue</h3>
    <div class="note small" style="margin:6px 0 12px"><b>How to read this:</b> for each issue, ${esc(s.short)}'s recorded actions are shown next to the PACs that gave to the campaign and the outside groups that spent on the race whose sector, documented orientation or name ties them to that issue. Shown together so you can look for patterns yourself. <b>This does not show that any contribution or spending influenced a vote</b>: groups often back candidates who already agree with them, and both can reflect party alignment. Hover or tap the dotted label next to each group to see why it is linked to the issue.</div>`;
  if(!keys.length)return head+`<p class="small muted">No issue-linked groups or coded actions were found for ${esc(s.short)}.</p></section>`;
  const body=keys.map(k=>{const a=A[k], ev=((s.evidence||{})[k]||[]).filter(e=>RECT.has(e.type)), st=((s.evidence||{})[k]||[]).filter(e=>e.type==='stated');
    return `<div class="mv"><h4>${esc(ISSBY[k].label)}</h4><div class="mvgrid">
      <div><div class="kicker">${esc(s.short)}'s recorded actions</div>${ev.length?`<ul class="list small">${ev.map(e=>`<li><b>${esc(e.title)}</b> (${esc(e.date||'')}): ${esc(e.pos||'')} → "${esc(sideLabel(k,e.side))}" <span class="muted">${esc(TYPEL[e.type])}</span></li>`).join('')}</ul>`:`<p class="small muted">No recorded vote, bill or official action on this issue${st.length?` (${st.length} stated position${st.length>1?'s':''} on the Your match tab)`:''}.</p>`}</div>
      <div><div class="kicker">Groups with a stake in this issue</div>
        ${a.pac.length?`<p class="small" style="margin:4px 0 2px"><b>PAC contributions to the campaign</b> (${esc(s.pac.window)}): ${fmtFull(a.pacTotal)} from ${a.pac.length+a.pacMore} PAC${a.pac.length+a.pacMore>1?'s':''}</p>${(()=>{const li=g=>`<li>${esc(g.name)}: <b class="num">${fmtFull(g.amount)}</b> <span class="muted">(${g.n} × ${g.reports.map(fi=>esc(s.pac.filings[fi].report)).join(', ')})</span> <span class="term small" tabindex="0" data-tip="${esc(g.why)}">${esc(g.whyShort)}</span></li>`;return `<ul class="list small">${a.pac.slice(0,5).map(li).join('')}</ul>${a.pac.length>5?`<details class="tv"><summary>${a.pac.length-5} more</summary><ul class="list small">${a.pac.slice(5).map(li).join('')}</ul></details>`:''}`})()}${a.pacMore?`<p class="small muted">and ${a.pacMore} more in the PAC table on the Money &amp; Influence tab.</p>`:''}`:'<p class="small muted" style="margin:4px 0">No issue-linked PAC contributions in the itemized reports.</p>'}
        ${a.out.length?`<p class="small" style="margin:8px 0 2px"><b>Outside spending on the race</b> (${period(s.out.start,s.out.end)}):</p><ul class="list small">${a.out.map(o=>{const m=cmOf(o.ci);return `<li>${esc(m[1])} (${CLS1[m[2]]}): ${o.for?`<b class="num">${fmtFull(o.for)}</b> ${s.out.multi?'supporting':'for'} ${esc(s.short)}`:''}${o.for&&o.against?'; ':''}${o.against?`<b class="num">${fmtFull(o.against)}</b> ${s.out.multi?'opposing':'against'}`:''}, ${fmtDate(o.first)}${o.last!==o.first?' – '+fmtDate(o.last):''} <span class="term small" tabindex="0" data-tip="${esc(o.why)}">${esc(o.whyShort)}</span></li>`}).join('')}</ul>`:''}
      </div></div></div>`}).join('');
  return head+body+'</section>';
}
const ethCost=e=>e.outcome==='None found'?null:e.status==='finding'?ETHICS_COST.finding:e.status==='investigation'?ETHICS_COST[e.stage==='open'?'open':'closed']:e.status==='allegation'?0:null;
function ethTag(e){
  if(e.outcome==='None found')return '<span class="chip good">Nothing found</span>';
  const [lab,cls]=ETH_TAG[e.status]||[e.type,'ghost'], stage=e.status==='investigation'?(e.stage==='open'?' · open':' · closed, no finding'):'';
  const c=ethCost(e);
  return `<span class="chip ${cls}">${esc(lab+stage)}</span>${c==null?'':`<span class="eth-cost">${c?`−${c} points`:'no points'}</span>`}`;
}
function ethicsHTML(s){
  const rank=e=>e.outcome==='None found'?9:e.status==='finding'?0:e.status==='investigation'?(e.stage==='open'?1:2):e.status==='allegation'?3:4;
  const list=s.ethics.map((e,i)=>[e,i]).sort((x,y)=>rank(x[0])-rank(y[0])||x[1]-y[1]).map(x=>x[0]);
  return `<section class="recsec" id="rec-ethics"><div class="kicker">Ethics & legal compliance</div><h3 style="margin-top:4px">Every entry, most serious first</h3>
  <p class="small muted" style="margin:4px 0 8px">Documented findings, penalties, investigations and disclosure checks, each tied to an official record or credible report. <b>Allegation:</b> a complaint or report with no official finding. <b>Investigation:</b> a formal inquiry, lawsuit or proceeding, open or closed without a finding against ${esc(s.short)}. <b>Confirmed finding:</b> a court, agency or ethics body found a violation or imposed a penalty, or ${esc(s.short)} admitted it. "Nothing found" means the sources checked turned up nothing, not that nothing exists.</p>
  ${list.map(e=>`<article class="eth"><div class="head">${ethTag(e)}<span class="chip ghost">${esc(e.type)}</span><span class="mono muted">${esc(e.date)}</span></div><h3>${esc(e.title)}</h3><p style="margin-top:8px">${esc(e.summary)}</p><div class="outcome"><b>Outcome:</b> ${esc(e.outcome)}</div><ul class="srcs">${e.sources.map(x=>`<li><a href="${esc(x.u)}" target="_blank" rel="noopener">${esc(x.t)} ↗</a></li>`).join('')}</ul></article>`).join('')}
  ${s.ethicsSearched&&s.ethics.some(e=>e.outcome!=='None found')?`<p class="small muted" style="margin-top:12px"><b>Also checked:</b> ${esc(s.ethicsSearched)}</p>`:''}</section>`;
}
// Stock trading: reviewed trades, each checked for a late or missing disclosure and for a committee conflict.
const TRADE_OWNER={self:'Self',spouse:'Spouse',child:'Dependent child',joint:'Joint'};
function tradingHTML(s){
  const t=personTrading(s), sec=overseenSectors(s);
  const head=`<section class="recsec" id="eth-trades"><div class="kicker">Stock trading</div><h3 style="margin-top:4px">Stock trades</h3>`;
  if(!s.bioguide)return head+`<p class="small muted" style="margin:4px 0 0">No trading data: these disclosures cover members of Congress only, and state disclosure rules vary.</p></section>`;
  if(!t.rows.length)return head+`<p class="small muted" style="margin:4px 0 0">No reviewed stock-trade records for ${esc(s.short)} yet. Trades from the official disclosures appear under Latest official records below and count toward the grade only once reviewed.</p></section>`;
  return head+`<p class="small muted" style="margin:4px 0 8px">Periodic Transaction Reports are due no later than ${LATE_DAYS} days after a trade. ${sec.length?`${esc(s.short)}'s committees oversee: ${esc(sec.join(', '))}.`:'Committee sectors are not recorded yet, so no trade is counted as a conflict.'} Spouse and dependent-child trades are included and labeled. Returns are not scored.</p>
  ${tradeChartsBlock(t.rows,sec,'eth-tr')}
  <div class="tablewrap"><table><thead><tr><th>Traded</th><th>Filed</th><th>Company</th><th>Type</th><th class="r">Amount</th><th>Owner</th><th>Checks</th></tr></thead><tbody>${t.rows.map(r=>`<tr><td class="mono">${esc(r.traded||'')}</td><td class="mono">${r.missing?'<b style="color:var(--crit)">not filed</b>':esc(r.filed||'')}${r.days!=null?`<div class="small muted">${r.days} days</div>`:''}</td><td>${esc(r.company||'')}${r.ticker?` <span class="mono muted">${esc(r.ticker)}</span>`:''}${r.sector?`<div class="small muted">${esc(r.sector)}</div>`:''}</td><td>${esc(r.type||'')}</td><td class="r">${esc(r.amount||'')}</td><td>${esc(TRADE_OWNER[r.owner]||r.owner||'')}</td><td>${r.late?`<span class="chip crit">Late −${TRADE_COST.late}</span> `:''}${r.conflict?`<span class="chip warn">Committee conflict −${TRADE_COST.conflict}</span>`:''}${r.flag?` <span class="chip ghost" title="${esc(r.flag)}">Flagged, not scored</span>`:''}${r.src?` <a class="small" href="${esc(r.src.u)}" target="_blank" rel="noopener">filing ↗</a>`:''}</td></tr>`).join('')}</tbody></table></div></section>`;
}
function paneEthics(s,pane){
  const e=personEthics(s);
  const terms=[[e.finding,ETHICS_COST.finding,'confirmed finding','confirmed findings'],[e.open,ETHICS_COST.open,'open investigation','open investigations'],[e.closed,ETHICS_COST.closed,'investigation closed without a finding','investigations closed without a finding']].filter(t=>t[0]);
  const trade=[e.late&&`${e.late} late or missing disclosure${e.late>1?'s':''}`,e.conflict&&`${e.conflict} committee-conflict trade${e.conflict>1?'s':''}`].filter(Boolean);
  const detail=(terms.length||trade.length)?terms.map(([n,,one,many])=>`${n} ${n>1?many:one}`).concat(trade).join(' · ')+(e.allegation?` · ${e.allegation} allegation${e.allegation>1?'s':''} (not scored)`:''):`No confirmed findings, investigations or trading problems in the sources checked${e.allegation?`; ${e.allegation} allegation${e.allegation>1?'s are':' is'} listed but not scored`:''}.`;
  const parts=terms.map(([n,c])=>`${c} × ${n}`).concat(e.late?[`${e.lateCost} for late disclosures${e.late*TRADE_COST.late>e.lateCost?` (capped at ${TRADE_COST.lateCap})`:''}`]:[]).concat(e.conflict?[`${e.conflictCost} for conflict trades${e.conflict*TRADE_COST.conflict>e.conflictCost?` (capped at ${TRADE_COST.conflictCap})`:''}`]:[]);
  const math=parts.length?`<p class="small gh-m"><b>How it was calculated:</b> 100 − ${parts.join(' − ')} = ${e.raw<0?`${e.raw}, shown as <b>0%</b>`:`<b>${e.pct}%</b>`}.</p>`:'';
  pane.innerHTML=`${gradeHead('Ethics',e.pct,detail,GRADE_TIP.eth,math+monthlyNote(s,'ethics',e.pct))}${ethicsHTML(s)}${caseTimelineBlock(s)}${tradingHTML(s)}<section id="live-records" style="margin-top:28px"></section>`;
  mountCaseTimeline(s);mountTradeCharts(s,personTrading(s).rows,'eth-tr');hoverTips(pane);
  window.RecordLive.profile(s,pane.querySelector('#live-records'),['trades','courts','fec-legal','doj']);
}

// ---------- People Over Profit tab: votes on scored bills, then who funds them and how those funders wanted them to vote ----------
const PVP_SIDE={people:'Working people',profit:'The wealthy and corporations'};
const billUrl=k=>{const eo=/^eo-(\d+)$/.exec(k||'');if(eo)return `https://www.govinfo.gov/link/cpd/executiveorder/${eo[1]}`;const m=/^(\d+)-([a-z]+)-(\d+)$/.exec(k||'');if(!m)return null;const T={hr:'house-bill',s:'senate-bill',hjres:'house-joint-resolution',sjres:'senate-joint-resolution',hconres:'house-concurrent-resolution',sconres:'senate-concurrent-resolution',hres:'house-resolution',sres:'senate-resolution'};return `https://www.congress.gov/bill/${m[1]}th-congress/${T[m[2]]}/${m[3]}`;};
const billLabel=k=>{const eo=/^eo-(\d+)$/.exec(k||'');if(eo)return `Executive Order ${eo[1]}`;const m=/^(\d+)-([a-z]+)-(\d+)$/.exec(k||'');if(!m)return k;const L={hr:'H.R.',s:'S.',hjres:'H.J.Res.',sjres:'S.J.Res.',hconres:'H.Con.Res.',sconres:'S.Con.Res.',hres:'H.Res.',sres:'S.Res.'};return `${L[m[2]]} ${m[3]} (${m[1]}th Congress)`;};
const PVP_DID={vote:p=>`Voted ${p}`,sponsored:()=>'Sponsored',cosponsored:()=>'Cosponsored',signed:()=>'Signed into law',vetoed:()=>'Vetoed',order:()=>'Issued the order'};
function panePvp(s,pane){
  const v=personPvp(s);
  const detail=v.pct!=null?`${v.people} of ${v.n} scored actions delivered more for working people; ${v.profit} more for the wealthy and corporations.`:!PVP_MARKS.size?'No bills have been scored yet, so no one has this grade.':v.n?`${v.n} of the ${MIN_PVP_ACTIONS} scored actions a grade needs.`:`None of ${esc(s.short)}'s recorded ${s.office?'bill signings, vetoes or executive orders':'votes or sponsorships'} is on a scored bill yet.`;
  const math=v.pct!=null?`<p class="small gh-m"><b>How it was calculated:</b> ${v.people} People-leaning ÷ (${v.people} People + ${v.profit} Profit) = <b>${v.pct}%</b>. Each ${s.office?'signing, veto or order':'vote or sponsorship'} counts 1, and a bill counts once.</p>`:'';
  const table=v.scored.length?`<div class="tablewrap"><table><thead><tr><th>Bill</th><th>${esc(s.short)}</th><th>Delivered more for</th><th>Who gains, per</th></tr></thead><tbody>${v.scored.map(a=>{const mk=PVP_MARKS.get(a.bill)||{},u=billUrl(a.bill);return `<tr><td>${u?`<a href="${u}" target="_blank" rel="noopener">${esc(mk.title||billLabel(a.bill))}</a>`:esc(mk.title||a.bill)}<div class="small muted">${esc(billLabel(a.bill))}</div></td><td>${esc(PVP_DID[a.kind](a.pos))}</td><td><b class="${a.took==='people'?'gr-A':'gr-F'}">${PVP_SIDE[a.took]}</b></td><td class="small">${esc(mk.why||'')} ${mk.src?`<a href="${esc(mk.src.u)}" target="_blank" rel="noopener">${esc(mk.src.t)} ↗</a>`:''}</td></tr>`}).join('')}</tbody></table></div>`
    :`<div class="note">${PVP_MARKS.size?`${esc(s.short)} has no recorded ${s.office?'signing, veto or executive order':'vote or sponsorship'} on any of the ${PVP_MARKS.size} scored bill${PVP_MARKS.size===1?'':'s'}.`:`<b>No bills are scored yet.</b> A bill counts once a nonpartisan analysis of who gains from it (for example from the Congressional Budget Office, the Joint Committee on Taxation or the Tax Policy Center) is cited. Each scored vote and sponsorship will be listed here with the side it took and the analysis behind it.`}</div>`;
  pane.innerHTML=`${gradeHead('People Over Profit',v.pct,detail,GRADE_TIP.pvp,math+monthlyNote(s,'pvp',v.pct))}
  <div class="chart"><h3>Who the record delivered more for</h3><div class="sub">Centered at 50%: People-leaning records to the right, wealthy-and-corporate-leaning to the left. <a href="#scores-pvp">Everyone on one chart</a></div>
    ${divergingRows([{label:s.name,sub:`${v.people} for working people · ${v.profit} for the wealthy and corporations`,value:v.pct,cls:v.pct==null?'':'gr-'+letter(v.pct),note:v.pct==null?`${v.n} of ${MIN_PVP_ACTIONS} scored actions`:`${v.n} scored actions`}])}</div>
  <h3 style="margin:18px 0 8px">${s.office?'Scored bills signed or vetoed, and executive orders':'Scored votes and sponsorships'}</h3>${table}
  ${s.office?`<h2 style="margin-top:30px">Their funders and their votes</h2>
  <p class="intro">Not shown for ${esc(s.short)}. This section compares the groups that pay for each 2026 campaign with the roll-call votes the candidate cast, and ${esc(s.short)} is not on the 2026 ballot and casts no roll-call votes. The refreshed FEC records for the committee that still files are on the <a href="#${s.id}-finance">Money &amp; Influence tab</a>.</p>`:`${donorTreemapBlock(s)}
  <h2 style="margin-top:30px">Their funders and their votes</h2>
  <p class="intro">Who pays for ${esc(s.short)}'s campaign and spends on the race, and how those groups wanted ${esc(s.short)} to vote. Shown together so you can look for patterns yourself; a match shows agreement, not that money changed a vote.</p>
  ${fundersBlock(s)}
  ${moneyVotesBlock(s)}`}`;
  mountFundTL(pane);mountTreemap(s);hoverTips(pane);
  bindTips(pane);
}

// The votes, bills and actions behind the match, kept in separate, labeled sections by kind of record.
// Committee seats, full committees first with their subcommittees beneath, and the sectors each one oversees.
function committeeBlock(s){
  const list=committeesOf(s), info=id=>COMMITTEES.committees[id]||{name:id};if(!list.length)return '';
  const full=[...new Set(list.map(c=>fullCommittee(c.id)))], seat=id=>list.find(c=>c.id===id);
  return `<section class="recsec" id="rec-cmte"><div class="kicker">Committee assignments</div><h3 style="margin-top:4px">Committees in the ${COMMITTEES.congress}th Congress</h3>
  <p class="small muted" style="margin:4px 0 8px">From the <a href="${esc(COMMITTEES.source)}" target="_blank" rel="noopener">congress-legislators</a> project, checked ${fmtDate(COMMITTEES.checked)}. The sectors marked on a committee are the ones it oversees; a stock trade in one of them counts as a committee conflict on the Ethics tab (sector list is a draft under review).</p>
  <ul class="list small cmte">${full.map(id=>{const c=seat(id),i=info(id),sec=(COMMITTEE_SECTORS[id]||{}).sectors||[],subs=list.filter(x=>x.id!==id&&fullCommittee(x.id)===id);
    return `<li>${i.url?`<a href="${esc(i.url)}" target="_blank" rel="noopener">${esc(i.name)} ↗</a>`:esc(i.name)}${c&&c.title?` <span class="chip ghost">${esc(c.title)}</span>`:''}${c?'':' <span class="small muted">(subcommittee seat only)</span>'}${sec.map(x=>` <span class="chip warn">${esc(x)}</span>`).join('')}${subs.length?`<div class="muted">Subcommittees: ${subs.map(x=>esc(info(x.id).name)+(x.title?` (${esc(x.title)})`:'')).join('; ')}</div>`:''}</li>`;}).join('')}</ul></section>`;
}
function recordInto(s,host){
  const inc=!s.cand;
  const SV=inc?(s.chamber==='S'?DATA.votes:[]):(s.senateVotes?DATA.votes.filter(v=>s.id in v.pos):[]);
  const HV=inc?(s.chamber==='H'?DATA.hvotes:[]):(s.ideoKind==='house'?DATA.hvotes.filter(v=>s.id in v.pos):[]);
  const ev=evidenceOf(s);
  const jump=[['rec-ideo','Ideology'],SV.length&&['rec-sv','Senate votes'],HV.length&&['rec-hv','House votes'],inc&&['rec-bills','Sponsored bills'],!inc&&['rec-other',recordHeading(s)],committeesOf(s).length&&['rec-cmte','Committees'],s.stateRecord&&['rec-state','State legislative record'],['live-records','Latest official records']].filter(Boolean);
  host.innerHTML=`
  <h2 id="m-record" style="margin-top:34px">The record behind the match</h2>
  <p class="intro">${inc?`${esc(s.short)}'s positions on consequential ${CH[s.chamber].name} roll calls, sponsored bills`:esc(REC_LABEL[s.recordType]||'')+'. '+esc({member_of_congress:'Positions on key House roll calls and notable sponsored bills',senator:'Positions on key Senate roll calls and notable sponsored bills',former_member_of_congress:'Votes and bills from '+s.short+"'s time in Congress",state_legislator:'Recorded votes and bills from '+s.short+"'s time in a state legislature",executive:'No legislative votes in executive office; major official actions are listed instead',none:'No legislative voting record; documented public actions and commitments are listed instead'}[s.recordType]||'')}${hasStateLeg(s)&&s.recordType!=='state_legislator'?', a separate state legislative record':''}. These are what your choices are compared with. Each item links to its source.</p>
  <div class="note" style="margin-bottom:12px"><b>Evidence available:</b> ${esc(ev.label)}.</div>
  <nav class="jump small">${jump.map(([k,l])=>`<a href="#${k}">${esc(l)}</a>`).join('')}</nav>
  <div id="rec-ideo">${ideoBlock(s,'ideo2')}<div class="chart">${kvBlock(s,'kv2',true)}</div></div>
  ${keyVotesBlock(s,SV,'Key U.S. Senate votes','rec-sv')}
  ${keyVotesBlock(s,HV,'Key U.S. House votes','rec-hv')}
  ${inc?`<section class="recsec" id="rec-bills"><div class="kicker">Congressional record</div><h3 style="margin-top:4px">Sponsored legislation</h3><p class="small" style="margin:6px 0 10px">${s.sponsoredCount?`<b class="num">${s.sponsoredCount.toLocaleString()}</b> bills, resolutions and amendments sponsored. ${esc(s.sponsoredNote)}`:esc(s.sponsoredNote)} <a href="${cgUrl(s)}" target="_blank" rel="noopener">Full list on Congress.gov ↗</a></p>
    <div class="tablewrap"><table><thead><tr><th>Measure</th><th>Title</th><th>Policy area</th><th>Introduced</th></tr></thead><tbody>${s.bills.map(b=>`<tr><td class="mono" style="white-space:nowrap"><a href="${esc(b.url)}" target="_blank" rel="noopener">${esc(b.num)}</a></td><td>${esc(b.title)}</td><td class="small">${esc(b.area)}</td><td class="mono">${esc(b.date)}</td></tr>`).join('')}</tbody></table></div></section>`:
  `<section class="recsec" id="rec-other"><div class="kicker">${esc(recordKicker(s))}</div><h3 style="margin-top:4px">${esc(recordHeading(s))}</h3>
    <div>${s.record.map(r=>`<div class="vote"><div class="d">${esc(r.date||'')}</div><div><div class="t">${esc(r.title)}</div><div class="s">${esc(r.detail)}</div><div class="s muted">${esc(r.area||'')}${r.src?` · <a href="${esc(r.src.u)}" target="_blank" rel="noopener">${esc(r.src.t)} ↗</a>`:''}${(r.more||[]).map(m=>` · <a href="${esc(m.u)}" target="_blank" rel="noopener">${esc(m.t)} ↗</a>`).join('')}</div></div><div class="pos"><span class="chip ${posClass(r.position)}">${esc(r.position||'')}</span></div></div>`).join('')}</div></section>`}
  ${committeeBlock(s)}
  <div id="rec-state">${stateRecordBlock(s)}</div>
  <section id="live-records" style="margin-top:28px"></section>`;
  mountIdeo('ideo2',s);
  mountKV('kv2',s);
  host.querySelectorAll('#rec-sv,#rec-hv').forEach(sec=>{const V=sec.id==='rec-sv'?SV:HV;const f=sec.querySelector('[data-vf]'),L=sec.querySelector('[data-vl]');
    const draw=a=>{L.innerHTML=V.filter(v=>!a||v.area===a).slice().sort((x,y)=>y.date.localeCompare(x.date)).map(v=>{const p=v.pos[s.id]||'—';return `<div class="vote"><div class="d">${v.date}</div><div><div class="t"><a href="${voteUrl(v)}" target="_blank" rel="noopener">${esc(v.short)}</a></div><div class="s">${esc(v.issue)} · ${esc(v.result)}</div><div class="s muted">${esc(v.area)}</div><div class="s" style="margin:4px 0">${leanTag(v)}</div>${billDetails(v)}</div><div class="pos">${voteText(v,p)}</div></div>`}).join('');};
    draw('');f.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;f.querySelector('.active').classList.remove('active');b.classList.add('active');draw(b.dataset.a);});});
  host.querySelectorAll('.jump a').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const t=document.getElementById(a.getAttribute('href').slice(1));if(t)t.scrollIntoView({behavior:'smooth',block:'start'});}));
  bindTips(host);
  window.RecordLive.profile(s,host.querySelector('#live-records'),['legislation','cosponsored','crs','official-acts','stateBills','committees','votes']);
}

// ---------- Promises Delivered tab: the grade, then every statement check behind it ----------
// For a president: PolitiFact's promise trackers, each tally as a bar, with sourced examples of each rating.
const PF_RATING={kept:['good','✓','Promise Kept'],compromise:['warn','◐','Compromise'],broken:['crit','✕','Promise Broken'],stalled:['neutral','…','Stalled'],inTheWorks:['neutral','…','In the Works']};
function trackerBlock(s){
  const T=s.promiseTrackers||[];if(!T.length)return '';
  const seg=(n,col)=>n?`<i style="flex:${n};background:${col}"></i>`:'';
  return `<h2 id="p-trackers" style="margin-top:6px">PolitiFact promise trackers</h2>
  <p class="intro">${esc(s.short)}'s promises are graded from PolitiFact's own ratings, which compare each campaign promise with what happened, including the executive orders and bills ${esc(s.short)} signed or vetoed. Each tally counts like the checks on other profiles: Promise Kept 1, Compromise ½, Promise Broken 0. Stalled and In the Works are listed but not counted until PolitiFact gives a final rating.</p>
  ${T.map(t=>{const c=t.counts,rated=(c.kept||0)+(c.compromise||0)+(c.broken||0),waiting=(c.stalled||0)+(c.inTheWorks||0);
    return `<div class="chart pf-tracker"><h3>${esc(t.name)} <span class="muted" style="font-weight:600">· ${esc(t.term)}</span></h3>
    <div class="sub">${esc(t.rater)} · ratings ${t.final?'':'as of '}${esc(t.asOf)} · <a href="${esc(t.url)}" target="_blank" rel="noopener">Every promise on PolitiFact ↗</a></div>
    <div class="hc-seg pf-bar" role="img" aria-label="${esc(`${t.name}: ${c.kept||0} kept, ${c.compromise||0} compromise, ${c.broken||0} broken${waiting?`, ${waiting} stalled or in the works`:''}`)}">${seg(c.kept,'var(--good)')}${seg(c.compromise,'var(--warn)')}${seg(c.broken,'var(--crit)')}${seg(c.stalled,'var(--muted)')}${seg(c.inTheWorks,'var(--line-2)')}</div>
    <ul class="pf-tally">${['kept','compromise','broken','stalled','inTheWorks'].filter(k=>c[k]!=null).map(k=>{const [cls,ic,lab]=PF_RATING[k];return `<li><span class="chip ${cls}">${ic} ${lab}</span><b class="num">${c[k]}</b></li>`}).join('')}</ul>
    <p class="small muted" style="margin:6px 0 0">${esc(t.about)} Counted here: ${rated} with a final rating${waiting?`; ${waiting} not counted yet`:''}.</p>
    ${t.examples?.length?`<h4 style="margin:14px 0 6px">Examples</h4><ul class="pf-ex">${t.examples.map(x=>{const [cls,ic,lab]=PF_RATING[x.rating];return `<li><span class="chip ${cls}">${ic} ${lab}</span><div><b>${esc(x.title)}</b><div class="small" style="color:var(--ink-2);margin-top:2px">${esc(x.did)}</div><div class="small" style="margin-top:2px">${x.action?`<a href="${esc(x.action.u)}" target="_blank" rel="noopener">${esc(x.action.t)} ↗</a> · `:''}<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.urlT||'PolitiFact rating')} ↗</a></div></div></li>`}).join('')}</ul><p class="small muted" style="margin:6px 0 0">A sample of the ratings; the tally above counts all ${rated+waiting} promises.</p>`:''}
    <p class="small" style="margin:8px 0 0">Source: <a href="${esc(t.src.u)}" target="_blank" rel="noopener">${esc(t.src.t)} ↗</a>${t.also?` · <a href="${esc(t.also.u)}" target="_blank" rel="noopener">${esc(t.also.t)} ↗</a>`:''}</p></div>`}).join('')}`;
}
function panePromises(s,pane){
  const pr=SCORER.promises(s), out=pr.notCounted, pf=!!(s.promiseTrackers||[]).length;
  const detail=pf&&pr.pct!=null?`${pr.kept} of ${pr.clear} promises with a final PolitiFact rating kept, ${pr.half} compromises, ${pr.broken} broken.`:pr.pct!=null?`${pr.kept} of ${pr.clear} clear checks kept${pr.half?`, ${pr.half} partly kept or changed over time`:''}${pr.broken?`, ${pr.broken} contradicted by the record`:''}.`:pr.total?`${pr.clear} clear check${pr.clear===1?'':'s'} so far; a grade needs ${MIN_CHECKS}.`:'No statements checked yet.';
  const bar=pr.pct!=null?`<div class="hc-seg gh-bar" aria-hidden="true">${pr.kept?`<i style="flex:${pr.kept};background:var(--good)"></i>`:''}${pr.half?`<i style="flex:${pr.half};background:var(--warn)"></i>`:''}${pr.broken?`<i style="flex:${pr.broken};background:var(--crit)"></i>`:''}</div>`:'';
  const math=pf&&pr.pct!=null?`<p class="small gh-m"><b>How it was calculated:</b> (${pr.kept} kept + ${pr.half} × ½ compromise) ÷ ${pr.clear} promises with a final rating = <b>${pr.pct}%</b>.${out?` ${out} Stalled or In the Works ${out===1?'is':'are'} not counted yet.`:''}</p>`
    :pr.pct!=null?`<p class="small gh-m"><b>How it was calculated:</b> (${pr.kept} kept${pr.half?` + ${pr.half} × ½ partly kept or changed`:''}) ÷ ${pr.clear} clear checks = <b>${pr.pct}%</b>.${out?` ${out} ambiguous or outcome check${out===1?' is':'s are'} listed below but not counted.`:''}</p>`:'';
  pane.innerHTML=`
  ${gradeHead('Promises Delivered',pr.pct,detail,GRADE_TIP.prom,bar+math+monthlyNote(s,'promises',pr.pct))}
  ${trackerBlock(s)}
  ${pf&&!s.statements.length?'':`<p class="intro">Each check pairs something ${esc(s.short)} said or pledged with what the record shows. The label describes that pairing, not the merits of the policy.</p>
  <dl class="legendlist small">
    <div><dt><span class="chip good">✓ Consistent</span></dt><dd>The action matches the statement.</dd></div>
    <div><dt><span class="chip crit">✕ Direct contradiction</span></dt><dd>The documented record directly conflicts with what was said.</dd></div>
    <div><dt><span class="chip warn">◐ Partly consistent</span></dt><dd>The record clearly matches part of the statement and clearly conflicts with another part.</dd></div>
    <div><dt><span class="chip neutral">? Ambiguous or incomplete evidence</span></dt><dd>Statement and action point in different directions, but whether they conflict depends on interpretation, or the evidence is incomplete.</dd></div>
    <div><dt><span class="chip serious">↻ Changed position</span></dt><dd>An acknowledged or evident reversal over time.</dd></div>
    <div><dt><span class="chip neutral">◇ Outcome check</span></dt><dd>The action matched the stated reasoning at the time, but later events bear on it.</dd></div>
    <div><dt><span class="chip neutral">… No related bill yet</span></dt><dd>A promise that nothing has come up to act on yet. Not counted until there is.</dd></div>
  </dl>
  <p class="small muted" style="margin:0 0 10px">Counted: consistent 1, partly consistent or changed ½, contradicted 0. A promise ${esc(s.short)} could have acted on but didn't by the end of the term is closed as contradicted. Vague goals, such as "fight for families," are listed but never scored.${pr.vague?` ${pr.vague} vague goal${pr.vague>1?'s are':' is'} listed below.`:''}</p>
  ${s.statements.map(x=>{const [cls,lab]=ASSESS[x.assessment];return `
  <article class="stmt ${x.assessment}">
    <h3>${esc(x.topic)}${x.promise?' <span class="chip ghost">Promise</span>':''}${x.vague?' <span class="chip ghost">Vague goal · not scored</span>':''}</h3>
    <div class="sd">
      <div><div class="k">What was said</div><div>${esc(x.said.text)}</div><div class="src">${esc(x.said.date)} · <a href="${esc(x.said.src.u)}" target="_blank" rel="noopener">${esc(x.said.src.t)} ↗</a></div></div>
      <div><div class="k">What the record shows</div><div>${esc(x.did.text)}</div><div class="src">${esc(x.did.date)} · <a href="${esc(x.did.src.u)}" target="_blank" rel="noopener">${esc(x.did.src.t)} ↗</a></div></div>
    </div>
    ${x.record?`<div class="small" style="margin-top:10px;color:var(--ink-2)"><b>Context:</b> ${esc(x.record)} ${x.recordSrc?`<a href="${esc(x.recordSrc.u)}" target="_blank" rel="noopener">${esc(x.recordSrc.t)} ↗</a>`:''}</div>`:''}
    ${x.unacted?`<div class="small" style="margin-top:10px;color:var(--ink-2)"><b>Not acted on by the end of the term</b>${x.unacted.date?` (${esc(x.unacted.date)})`:''}: ${esc(x.unacted.reason||'')}</div>`:''}
    <div class="verdict"><span class="chip ${cls}">${AICON[x.assessment]} ${lab}</span><div class="note">${esc(x.note)}</div></div>
  </article>`}).join('')}`}
  <section id="live-records" style="margin-top:28px"></section>`;
  window.RecordLive.profile(s,pane.querySelector('#live-records'),['crec-day','hearing','meeting','votesmart','bluesky','youtube','wayback','factcheck','news']);
}

function paneSources(s,pane){
  const list=[];
  list.push({t:'FEC candidate financial summary ('+s.fecCand+')',u:fecCandUrl(s.fecCand)});
  list.push({t:'FEC filings, '+s.cmteName+' ('+s.fecCmte+')',u:`https://docquery.fec.gov/cgi-bin/forms/${s.fecCmte}/`});
  list.push({t:'FEC independent expenditures for this candidate',u:fecIeUrl(s.fecCand)});
  if(s.ideo&&s.ideo.icpsr)list.push({t:'Voteview DW-NOMINATE record',u:`https://voteview.com/person/${s.ideo.icpsr}`});
  if(s.ideoSrc)list.push(s.ideoSrc);
  if(s.statusSrc)list.push(s.statusSrc);
  (s.record||[]).forEach(r=>{if(r.src)list.push(r.src)});
  s.out.cms.forEach(x=>{const m=cmOf(x[0]);if(m[4])list.push({t:m[1]+': affiliation source',u:m[4]})});
  s.pac.filings.forEach(f=>list.push({t:'FEC report '+f.report+' ('+f.start+' to '+f.end+'), Schedule A line 11C',u:f.url}));
  if(s.camp.src)list.push({t:'FEC committee summary, 2025–26: '+(s.camp.cmte||s.fecCmte),u:s.camp.src});
  s.statements.forEach(x=>{list.push(x.said.src);list.push(x.did.src);if(x.recordSrc)list.push(x.recordSrc)});
  s.ethics.forEach(e=>e.sources.forEach(x=>list.push(x)));
  s.bills.forEach(b=>list.push({t:b.num+' — '+b.title,u:b.url}));
  if(s.stateRecord){s.stateRecord.service.forEach(x=>{if(x.src)list.push(x.src)});s.stateRecord.items.forEach(x=>{if(x.src)list.push(x.src)});}
  {const r=raceOf(s);if(r&&r.rating&&r.rating.src)list.push(r.rating.src);}
  const seen=new Set();const uniq=list.filter(x=>x&&x.u&&!seen.has(x.u)&&seen.add(x.u));
  pane.innerHTML=`<h2>Sources for this profile</h2><p class="intro">${uniq.length} distinct records and reports. Roll-call votes link to their official tallies from the Your match tab; every independent expenditure links to its FEC filing from the Money &amp; Influence tab.</p><ul class="list">${uniq.map(x=>`<li><a href="${esc(x.u)}" target="_blank" rel="noopener">${esc(x.t)}</a> <span class="small muted mono">${esc(x.u.replace(/^https?:\/\//,'').split('/')[0])}</span></li>`).join('')}</ul>`;
}

// ---------- races ----------
const ratingLine=r=>r.rating&&r.rating.cook?`<div class="rating"><span>Cook: <b>${esc(r.rating.cook)}</b></span><span>Inside Elections: <b>${esc(r.rating.ie)}</b></span><span>Sabato: <b>${esc(r.rating.sabato)}</b></span>${r.rating.note?`<span class="muted">${esc(r.rating.note)}</span>`:''}</div>`:(r.rating&&r.rating.note?`<div class="rating muted">${esc(r.rating.note)}</div>`:'');
function raceCard(r){
  const C=r.keys.map(k=>byId[k]);
  const row=(lab,f)=>`<tr><td class="k">${lab}</td>${C.map(s=>`<td>${f(s)}</td>`).join('')}</tr>`;
  const multi=C.some(s=>s.out.multi);
  return `<article class="race">
    <div class="rh"><h3>${esc(r.label)}${r.competitive&&r.chamber==='S'?' <span class="chip warn" style="vertical-align:middle">Competitive</span>':''}</h3><span class="small muted">${r.open?'Open seat':'Incumbent running'} · outside spending on all candidates: <b class="num">${fmt$(r.ieTotal)}</b></span></div>
    ${ratingLine(r)}
    <div class="tablewrap"><table>
      <thead><tr><th></th>${C.map(s=>`<th>${s.id===r.inc?'Incumbent':(r.open?partyName(s.party):'Challenger')}</th>`).join('')}</tr></thead>
      <tbody>
      ${row('Candidate',s=>`<a href="#${s.id}"><b>${esc(s.name)}</b></a> <span class="chip ${s.party}">${s.party}</span>`)}
      ${row('Record',s=>esc(s.cand?(REC_LABEL[s.recordType]||''):'U.S. '+CH[s.chamber].name)+((s.ideo||s.ideoKind==='former_text'||s.ideoKind==='state'||hasStateLeg(s))?`<div class="small muted">${esc(ideoText(s).short)}</div>`:''))}
      ${row('Evidence available',s=>`<span class="small">${esc(evidenceOf(s).label)}</span> <a class="small" href="#${s.id}-record">record →</a>`)}
      ${row(term('receipts','Campaign funds raised'),s=>s.camp.missing?'<span class="muted">No FEC report yet</span>':`${fmtFull(s.camp.receipts)}<div class="small muted">${period(s.camp.start,s.camp.end)}</div>${s.camp.selfShare>20?`<div>${flag(s.camp.selfShare+'% self-funded','Candidate loans and contributions as a share of campaign funds.')}</div>`:''}`)}
      ${row('Cash on hand',s=>s.camp.missing?'<span class="muted">—</span>':`${fmtFull(s.camp.cash)}<div class="small muted">on ${fmtDate(s.camp.end)}</div>`)}
      ${row(term('ie',multi?'Outside spending supporting':'Outside spending for'),s=>`${fmtFull(s.out.for.total)}<div class="small muted">${CLS.filter(k=>s.out.for[k]).map(k=>CLSL[k]+' '+fmt$(s.out.for[k])).join(' · ')||'none'}</div>`)}
      ${row(term('ie',multi?'Outside spending opposing':'Outside spending against'),s=>`${fmtFull(s.out.against.total)}<div class="small muted">${CLS.filter(k=>s.out.against[k]).map(k=>CLSL[k]+' '+fmt$(s.out.against[k])).join(' · ')||'none'}</div>`)}
      ${row('Largest outside spenders '+(multi?'supporting':'for'),s=>topSpenders(s,'for',3).map(x=>esc(x.name)).join(', ')||'<span class="muted">None</span>')}
      </tbody></table></div>
    <p class="small muted" style="margin:8px 0 0">Campaign funds and outside spending are separate: outside groups' spending never passes through a campaign, and the two cover different periods (outside spending through ${fmtDate(DATA.ie_asof)}).</p>
    ${evidenceNote(C)?`<p class="small" style="margin:6px 0 0;color:var(--ink-2)"><b>Comparing records:</b> ${evidenceNote(C)}</p>`:''}
    ${r.note?`<p class="small" style="margin:6px 0 0;color:var(--ink-2)">${esc(r.note)}</p>`:''}
    <p class="small" style="margin:8px 0 0">${C.map(s=>`<a href="${fecCandUrl(s.fecCand)}" target="_blank" rel="noopener">FEC: ${esc(s.short)} ↗</a>`).join(' · ')}</p>
  </article>`;
}
function liteCard(r){
  const N=r.nominees;
  const row=(lab,f)=>`<tr><td class="k">${lab}</td>${N.map(n=>`<td>${f(n)}</td>`).join('')}</tr>`;
  return `<article class="race lite"><div class="rh"><h3>${esc(r.label)} <span class="chip warn" style="vertical-align:middle">Toss-up</span></h3><span class="small muted">Outside spending on all candidates: <b class="num">${fmt$(r.ieTotal)}</b></span></div>
    <div class="rating"><span>Cook: <b>${esc(r.ratings.cook)}</b></span><span>Inside Elections: <b>${esc(r.ratings.ie)}</b></span><span>Sabato: <b>${esc(r.ratings.sabato)}</b></span></div>
    <div class="note small" style="margin:8px 0">Funding comparison only: full profiles (record, statements, ethics, alignment) have not been built for this race.</div>
    <div class="tablewrap"><table><thead><tr><th></th>${N.map(n=>`<th>${n.incumbent?'Incumbent':partyName(n.party)}</th>`).join('')}</tr></thead><tbody>
    ${row('Nominee',n=>`<b>${esc(n.name)}</b> <span class="chip ${n.party}">${n.party}</span><div class="small muted">${esc(n.basis||'')} ${n.src?`<a href="${esc(n.src.u)}" target="_blank" rel="noopener">source ↗</a>`:''}</div>`)}
    ${row(term('receipts','Campaign funds raised'),n=>n.receipts!=null?`${fmtFull(n.receipts)}<div class="small muted">2025–26, through ${fmtDate(n.through)} (FEC totals via the Follow the Money compilation)</div>`:`<span class="muted">${esc(n.campNote)}</span>`)}
    ${row('Cash on hand',n=>n.cash!=null?`${fmtFull(n.cash)}<div class="small muted">on ${fmtDate(n.through)}</div>`:'<span class="muted">—</span>')}
    ${row(term('ie','Outside spending for'),n=>`${fmtFull(n.out.for.total)}<div class="small muted">${CLS.filter(k=>n.out.for[k]).map(k=>CLSL[k]+' '+fmt$(n.out.for[k])).join(' · ')||'none'}</div>`)}
    ${row(term('ie','Outside spending against'),n=>`${fmtFull(n.out.against.total)}<div class="small muted">${CLS.filter(k=>n.out.against[k]).map(k=>CLSL[k]+' '+fmt$(n.out.against[k])).join(' · ')||'none'}</div>`)}
    </tbody></table></div>
    <p class="small" style="margin:8px 0 0">${N.map(n=>`<a href="${fecCandUrl(n.fecCand)}" target="_blank" rel="noopener">FEC: ${esc(n.name)} ↗</a>`).join(' · ')} · <a href="${fecIeUrl(N[0].fecCand)}" target="_blank" rel="noopener">FEC independent expenditures ↗</a></p>
    ${N.some(n=>n.out.possibleRepeat)?'<p class="small muted" style="margin:6px 0 0">Outside-spending totals include items flagged as possible repeat filings.</p>':''}
  </article>`;
}
function renderRaces(){
  const S=DATA.races.filter(r=>r.chamber==='S'), H=DATA.races.filter(r=>r.chamber==='H');
  app.innerHTML=`
  <section class="hero" style="padding-bottom:10px"><div class="asof">2026 general election · outside spending through ${fmtDate(DATA.ie_asof)}</div><h1 style="margin-top:8px">The races</h1>
  <p class="lede">Every profiled candidate next to their 2026 opponents, competitive races first. Campaign funds and outside spending are separate rows with their own dates, and each candidate's kind of record is labeled so like is compared with like.</p>
  <div class="toolbar"><div class="seg" id="rs"><button data-c="S" class="active">Senate (${S.length})</button><button data-c="H">House (${H.length+DATA.liteRaces.length})</button></div>
  <label class="small muted">Jump to <select id="rj">${S.concat(H).concat(DATA.liteRaces.map(r=>({id:r.id,label:r.label,chamber:'H'}))).map(r=>`<option value="${r.id}">${esc(r.label)}</option>`).join('')}</select></label></div></section>
  <div id="rlist"></div>`;
  const draw=ch=>{const L=DATA.races.filter(r=>r.chamber===ch);
    $('#rlist').innerHTML=ch==='S'?`<h2 style="margin-top:8px">Competitive Senate races</h2><p class="small muted" style="margin:4px 0 0;max-width:80ch">Rated Toss-up, Tilt or Lean by at least one of the Cook Political Report, Inside Elections or Sabato's Crystal Ball (ratings of Sept. 17–23, 2026, as compiled on <a href="https://en.wikipedia.org/wiki/2026_United_States_Senate_elections" target="_blank" rel="noopener">Wikipedia</a>). Every such race is covered.</p>${L.filter(r=>r.competitive).map(r=>`<div id="r-${r.id}">${raceCard(r)}</div>`).join('')}<h2 style="margin-top:26px">Other Senate races covered</h2>${L.filter(r=>!r.competitive).map(r=>`<div id="r-${r.id}">${raceCard(r)}</div>`).join('')}`
      :`<h2 style="margin-top:8px">House toss-ups with full profiles</h2><p class="small muted" style="margin:4px 0 0;max-width:80ch">Eight of the ${L.length+DATA.liteRaces.length} House races the Cook Political Report rates Toss-up (Sept. 25, 2026), with full profiles of both nominees.</p>${L.map(r=>`<div id="r-${r.id}">${raceCard(r)}</div>`).join('')}
        <h2 style="margin-top:26px">Other House toss-ups: funding only</h2><p class="small muted" style="margin:4px 0 0;max-width:80ch">The remaining ${DATA.liteRaces.length} Cook toss-ups, with verified nominees, campaign funds and outside spending. Records, statements and ethics have not been researched for these candidates yet, so they have no profiles.</p>${DATA.liteRaces.map(r=>`<div id="r-${r.id}">${liteCard(r)}</div>`).join('')}`;
    bindTips(app);};
  draw('S');
  $('#rs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$('#rs .active').classList.remove('active');b.classList.add('active');draw(b.dataset.c);});
  $('#rj').addEventListener('change',e=>{const r=DATA.races.find(x=>x.id===e.target.value)||Object.assign({chamber:'H'},DATA.liteRaces.find(x=>x.id===e.target.value));const want=r.chamber;const cur=$('#rs .active').dataset.c;if(cur!==want){$('#rs .active').classList.remove('active');$(`#rs button[data-c="${want}"]`).classList.add('active');draw(want);}document.getElementById('r-'+r.id).scrollIntoView({behavior:'smooth',block:'start'});});
}

// ---------- compare ----------
let cmpGrp='all';
function renderCompare(){
  const V=CH[cmpCh].votes, M=MEM.filter(s=>s.chamber===cmpCh).concat(cmpCh==='S'?CANDS.filter(s=>s.senateVotes):[]);
  const areas=[...new Set(V.map(v=>v.area))].sort();
  app.innerHTML=`
  <section class="hero" style="padding-bottom:10px"><div class="asof">Roll calls since 2021 · ideology · money</div><h1 style="margin-top:8px">Compare</h1>
  <p class="lede">How the senators and representatives profiled here voted on consequential roll calls (former Sen. Sherrod Brown's votes are included for the years he served), then ideology, campaign funds and outside spending side by side for all ${ALL.length} people profiled.</p>
  <div class="toolbar"><div class="seg" id="cs"><button data-c="S" class="${cmpCh==='S'?'active':''}">Senate votes</button><button data-c="H" class="${cmpCh==='H'?'active':''}">House votes</button></div></div></section>
  <div class="filters" id="cf"><button class="active" data-a="">All areas</button>${areas.map(a=>`<button data-a="${esc(a)}">${esc(a)}</button>`).join('')}</div>
  ${vtLegend()}<div class="matrix"><table id="mx"><thead><tr><th>Vote</th>${M.map(s=>`<th class="sen"><a href="#${s.id}">${esc(s.short)}</a><br><span class="chip ${s.party}" style="margin-top:4px">${s.party}-${esc(seatLabel(s))}</span>${s.recordType==='former_member_of_congress'?'<div class="small muted" style="font-weight:400;text-transform:none;letter-spacing:0">former senator</div>':''}</th>`).join('')}</tr></thead><tbody></tbody></table></div>
  <section class="section">
    <h2>Side by side</h2>
    <p class="intro">Campaign funds and outside spending are separate columns with their own periods, drawn on one shared scale; they are never added. Ideology percentiles are within each member's own chamber; candidates without a congressional record show their record type. The kind of evidence differs by person (U.S. votes, state legislative votes or no voting record), so ideology cells are not comparable across those types. Click a column to sort.</p>
    <div class="toolbar" style="margin:0 0 10px"><div class="seg" id="cg"><button data-g="all" class="${cmpGrp==='all'?'active':''}">All ${ALL.length}</button><button data-g="S" class="${cmpGrp==='S'?'active':''}">Senate races</button><button data-g="H" class="${cmpGrp==='H'?'active':''}">House races</button></div></div>
    <div class="tablewrap"><table id="side"><thead><tr><th><button data-k="name">Name</button></th><th><button data-k="pctl">Voting record</button></th><th class="r"><button data-k="unity">Party unity</button></th><th><button data-k="rc">Campaign funds raised</button></th><th><button data-k="of">Outside spending for</button></th><th><button data-k="oa">Outside spending against</button></th><th><button data-k="al">Compared with your choices</button></th></tr></thead><tbody></tbody></table></div>
    <p class="small muted" style="margin:8px 0 0">Campaign funds: FEC two-year summaries, reports through the date shown for each person (mostly June 30, 2026). Outside spending: general-election independent expenditures through ${fmtDate(DATA.ie_asof)}. In Montana's three-way race the outside-spending columns show only spending aimed directly at that candidate.</p>
  </section>`;
  const draw=a=>{$('#mx tbody').innerHTML=V.filter(v=>!a||v.area===a).slice().sort((x,y)=>y.date.localeCompare(x.date)).map(v=>`<tr><td class="v"><a href="${voteUrl(v)}" target="_blank" rel="noopener"><b>${esc(v.short)}</b></a><div class="s">${v.date} · ${esc(v.result)} · ${esc(v.area)}</div></td>${M.map(s=>{const p=v.pos[s.id]||'—';return `<td class="c">${voteText(v,p)}</td>`}).join('')}</tr>`).join('');};
  draw('');
  $('#cf').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$('#cf .active').classList.remove('active');b.classList.add('active');draw(b.dataset.a);});
  $('#cs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;location.hash='compare-'+(b.dataset.c==='H'?'house':'senate');});
  const all=ALL.map(s=>{const sc=scoreFor(s);return {s,sc,name:s.name,pctl:s.ideo?s.ideo.lo:-1,unity:s.ideo&&s.ideo.unity!=null?s.ideo.unity:-1,rc:s.camp.missing?-1:s.camp.receipts,of:s.out.for.total,oa:s.out.against.total,al:sc.score==null?-1:sc.score}});
  let sort={k:'rc',dir:-1};
  const cell=(v,max,col,sub)=>v<0?'<span class="muted">No FEC report yet</span>':`<div class="mini"><span class="num" style="min-width:4.6em"><b>${fmt$(v)}</b></span><span class="tr"><b style="width:${Math.max(.5,v/max*100)}%;background:var(${col})"></b></span></div>${sub?`<div class="small muted">${sub}</div>`:''}`;
  const drawS=()=>{
    const rows=all.filter(x=>cmpGrp==='all'||x.s.chamber===cmpGrp);
    const max=Math.max(1,...rows.map(x=>Math.max(x.rc,x.of,x.oa)));
    rows.sort((a,b)=>{const x=a[sort.k],y=b[sort.k];return (typeof x==='number'?x-y:String(x).localeCompare(String(y)))*sort.dir});
    $('#side tbody').innerHTML=rows.map(({s,rc,of,oa,sc})=>`<tr><td><a href="#${s.id}-finance">${esc(s.name)}</a><div class="row" style="margin-top:3px"><span class="chip ${s.party}">${s.party}-${esc(seatLabel(s))}</span><span class="chip ch">${chipCh(s)}</span></div></td><td class="small">${esc(ideoText(s).short)}<div class="muted">${esc(evidenceOf(s).kind==='us'?'U.S. votes':evidenceOf(s).kind==='former'?'past congressional record':evidenceOf(s).kind==='state'?'state legislative record':evidenceOf(s).kind==='exec'?'executive record, no votes':'no voting record')}</div></td><td class="r">${s.ideo&&s.ideo.unity!=null?s.ideo.unity+'%':'—'}</td><td style="min-width:170px">${cell(rc,max,'--s1',s.camp.missing?'':'through '+fmtDate(s.camp.end))}</td><td style="min-width:170px">${cell(of,max,'--neutral',s.out.incomplete.length?'incomplete data':'')}</td><td style="min-width:170px">${cell(oa,max,'--neutral','')}</td><td style="min-width:150px">${scoreBadge(sc)}<div class="small muted">${esc(evidenceMix(s))}</div></td></tr>`).join('');bindTips(app);};
  drawS();
  $('#side thead').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const k=b.dataset.k;sort=sort.k===k?{k,dir:-sort.dir}:{k,dir:k==='name'?1:-1};drawS();});
  $('#cg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;cmpGrp=b.dataset.g;$('#cg .active').classList.remove('active');b.classList.add('active');drawS();});
}

// ---------- methodology ----------
// ---------- profile charts: Ethics case timeline and trading, People Over Profit donors, Money & Influence Analysis ----------
const CASE_COLOR={finding:'var(--s1)',open:'var(--s2)',closed:'var(--s3)',allegation:'var(--cx-other)'};
const CASE_LABEL={finding:'Confirmed finding',open:'Open investigation',closed:'Investigation closed without a finding',allegation:'Allegation'};
function caseRows(s){
  return (s.ethics||[]).filter(e=>e.outcome!=='None found'&&['finding','investigation','allegation'].includes(e.status)).map(e=>{
    const y=(String(e.date||'').match(/\b(?:19|20)\d{2}\b/g)||[]).map(Number),k=e.status==='investigation'?(e.stage==='open'?'open':'closed'):e.status;
    return {label:e.title,from:y[0]||null,to:y.length>1?y.at(-1):null,status:k,statusLabel:CASE_LABEL[k],when:e.date};
  });
}
function caseTimelineBlock(s){
  const rows=caseRows(s).filter(r=>r.from);if(!rows.length)return '';
  return `<div class="chart" id="eth-timeline"><h3>Case timeline</h3><div class="sub">Each entry over the years it covers, colored by its current status. When a case changes, its status is updated rather than a new entry added, so each counts once.</div>
    <div class="cx-plot" id="eth-tl"></div>${legend(Object.keys(CASE_LABEL).filter(k=>rows.some(r=>r.status===k)).map(k=>[CASE_COLOR[k],CASE_LABEL[k]]))}
    ${tableView(['Entry','Status','Dates'],rows.map(r=>[esc(r.label),esc(r.statusLabel),esc(r.when)]))}</div>`;
}
// Trading charts, for reviewed trades (and, on the latest-records card, for trades not reviewed yet).
function tradeChartsBlock(rows,sectors,id){
  if(!rows.length)return '';
  const by={};for(const r of rows)if(r.sector)by[r.sector]=(by[r.sector]||0)+1;
  const cats=Object.entries(by).map(([label,value])=>({label,value,hi:sectors.includes(label)})).sort((a,b)=>b.value-a.value);
  return `<div class="chart"><h3>Days from trade to disclosure</h3><div class="sub">One dot per trade. Reports are due within ${LATE_DAYS} days; dots past the line were late.</div><div class="cx-plot" id="${id}-delay"></div>${legend([['var(--crit)','Late or never disclosed'],['var(--cx-other)','On time']])}</div>
    ${cats.length?`<div class="chart"><h3>Trades by sector</h3><div class="sub">Sectors their committees oversee are highlighted; an individual stock trade in one of them counts as a committee conflict.</div>${categoryBars(cats,{highlightLabel:'Overseen by their committees',otherLabel:'Other sectors'})}</div>`:''}
    <div class="chart"><h3>Trades and votes</h3><div class="sub">Buys above the line, sells below, and their recorded key votes as ticks on the line. A ringed dot is a trade flagged for review (for example, near a related vote); flags are not scored.</div><div class="cx-plot" id="${id}-tl"></div>${legend([['var(--s3)','Buy'],['var(--s2)','Sell'],['var(--ink-2)','Recorded vote']])}</div>`;
}
function personVotes(s){return DATA.votes.concat(DATA.hvotes).filter(v=>v.pos&&/^(Yea|Nay|Aye|No)$/i.test(v.pos[s.id]||'')).map(v=>({date:v.date,label:`${v.short}: voted ${v.pos[s.id]}`}));}
function mountTradeCharts(s,rows,id){
  if(!rows.length||!document.getElementById(id+'-delay'))return;
  const tr=rows.map(r=>({...r,company:r.company||r.asset}));
  const span=tr.map(r=>r.traded).filter(Boolean).sort(),from=addMonths(span[0].slice(0,7),-3),to=addMonths(span.at(-1).slice(0,7),3);
  const ev=personVotes(s).filter(v=>v.date.slice(0,7)>=from&&v.date.slice(0,7)<=to);
  const f=()=>{drawDelay(document.getElementById(id+'-delay'),tr,LATE_DAYS);drawTradeTimeline(document.getElementById(id+'-tl'),tr,ev);};f();resizers.push(f);
}
function mountCaseTimeline(s){const el=document.getElementById('eth-tl');if(!el)return;const rows=caseRows(s).filter(r=>r.from);const f=()=>drawCaseTimeline(document.getElementById('eth-tl'),rows,CASE_COLOR);f();resizers.push(f);}

// People Over Profit: the person's own diverging bar, and the tree map of their top donors.
const catLabel=c=>c==='small'?'Small-dollar donors':DATA.categories[c]||SECTOR_LABEL_EXTRA[c]||c;
function donorTreemapBlock(s){
  const p=s.pac||{},t=topDonors(p.rows,DATA.pacNames,s.camp&&!s.camp.missing?s.camp.unitemized:0);
  if(!t.tiles.length)return `<div class="chart"><h3>Top donors</h3><p class="small muted">No PAC contributions or small-dollar totals are on file for ${esc(s.short)}'s campaign.</p></div>`;
  const tiles=t.tiles.map(x=>({...x,alignLabel:ALIGN_LABEL[x.align],catLabel:catLabel(x.cat)}));
  const sum=k=>tiles.filter(x=>x.align===k).reduce((n,x)=>n+x.value,0);
  return `<div class="chart" id="pvp-donors"><h3>Top ${tiles.length} donors</h3><div class="sub">Tile size is the amount given${p.window?` (PAC contributions ${esc(p.window)}; small-dollar donors ${s.camp?period(s.camp.start,s.camp.end):''})`:''}. People-aligned: unions and small-dollar donors, as one tile. Profit-aligned: corporate PACs and industry groups. Other: leadership, party and ideological committees. Sectors are assigned by this app from each committee's name.${t.rest?` ${t.rest} smaller PACs (${fmtFull(t.restAmount)}) are not shown.`:''}</div>
    <div class="cx-plot" id="pvp-tm"></div>${legend([['var(--s1)',`People-aligned ${fmt$(sum('people'))}`],['var(--s5)',`Profit-aligned ${fmt$(sum('profit'))}`],['var(--cx-other)',`Other ${fmt$(sum('other'))}`]])}
    ${tableView(['Donor','Amount','Alignment','Sector'],tiles.map(x=>[esc(x.label),fmtFull(x.value),x.alignLabel,esc(x.catLabel)]))}
    <p class="small" style="margin:8px 0 0"><a href="#${s.id}-finance">Outside spending by sector, for and against, on the Money &amp; Influence tab →</a></p></div>`;
}
function mountTreemap(s){const el=document.getElementById('pvp-tm');if(!el)return;const p=s.pac||{},t=topDonors(p.rows,DATA.pacNames,s.camp&&!s.camp.missing?s.camp.unitemized:0);
  const tiles=t.tiles.map(x=>({...x,alignLabel:ALIGN_LABEL[x.align],catLabel:catLabel(x.cat)}));const f=()=>drawTreemap(document.getElementById('pvp-tm'),tiles);f();resizers.push(f);}

// Money & Influence Analysis: alignment and timing, from the reviewed research now, and from the daily FEC and LDA.gov
// refresh as it fills in. Never part of a grade.
function influenceData(s){
  const H=window.FUNDHIST,funders=s.funderPos||[],through=H?H.contribThrough.slice(0,7):null;
  const rows=[];
  // Every group whose positions are collected and whose PACs gave to this person, with the votes it took a position on.
  for(const [key,h] of Object.entries(H?.people[s.id]||{})){
    const g=funders.find(f=>f.key===key)||{key,org:(GPBY[key]||{}).org||key,compared:[]};
    const series={};for(const [m,v] of h.c||[])series[m]=(series[m]||0)+v;
    const total=Object.values(series).reduce((t,v)=>t+v,0);if(!total)continue;
    const decisions=(g.compared||[]).map(c=>({date:c.date,match:c.match,label:`${c.short}: ${g.org} wanted ${c.wanted}, ${s.short} voted ${c.cast}`}));
    // A changed-position check tagged with an issue the group took positions on (through the votes it scored).
    const issues=new Set((g.compared||[]).flatMap(c=>(VOTE_BY_ID.get(c.voteId)?.codes||[]).map(x=>x.issue)));
    const changes=(s.statements||[]).filter(x=>x.assessment==='changed'&&x.issue&&/^\d{4}-\d{2}/.test(x.did?.date||'')).map(x=>({date:x.did.date,issue:x.issue,label:`Changed position: ${x.topic}`}));
    const flags=timingFlags(g.org,series,decisions,through).concat(positionChangeFlags(g.org,series,issues,changes,through));
    rows.push({key,label:g.org,series,total,flags,markers:decisions.filter(d=>d.match!==null).map(d=>({date:d.date,kind:d.match?'same':'opp',label:d.label}))});
  }
  rows.sort((a,b)=>b.total-a.total);
  const trades=personTrading(s).rows,stock=stockFlags(trades,funders.map(g=>({org:g.org,positions:(g.compared||[]).length})));
  const months=[];if(H)for(let m=H.start.slice(0,7);m<=through;m=addMonths(m,1))months.push(m);
  return {rows:rows.slice(0,8),allFlags:rows.flatMap(r=>r.flags).concat(stock),months,vda:voteDonorAlignment(funders),through};
}
const H0=()=>window.FUNDHIST?monLabel(window.FUNDHIST.start.slice(0,7)):'2019';
const FLAG_TEXT={rose:'Donations rose',dropped:'Donations dropped',changed:'Position changed after a donation shift',stock:'Held or traded stock in a donor'};
function analysisBlock(s){
  const d=influenceData(s),v=d.vda;
  const flagRows=d.allFlags.map(f=>f.kind==='stock'?`<li><b>${FLAG_TEXT.stock}:</b> ${esc(f.org)} · ${esc(f.decision.label)} on ${fmtDate(f.decision.date)}</li>`
    :`<li><b>${FLAG_TEXT[f.kind]}</b> ${f.kind==='rose'?'after a vote it wanted':f.kind==='dropped'?'after a vote it opposed':''}: ${esc(f.org)}, ${fmtFull(f.before)} in the ${WINDOW_MONTHS} months before → ${fmtFull(f.after)} from ${monLabel(f.decision.date.slice(0,7))} through ${monLabel(f.to)}. ${esc(f.decision.label)} (${fmtDate(f.decision.date)}).</li>`);
  return `<section id="f-analysis"><h2 style="margin-top:6px">Money &amp; Influence Analysis</h2>
    <p class="intro">Whether the timing of ${esc(s.short)}'s money lines up with ${esc(s.short)}'s decisions. It shows timing and alignment, <b>not proof that money caused a decision</b>, so it sits beside the grades and never inside them. Thresholds are placeholders under review: the top ${TOP_DONORS} donors, a ${SWING*100}% change and a ${WINDOW_MONTHS}-month window.</p>
    <div class="cx-stats">
      <div class="cx-stat"><span>Vote Donor Alignment</span><b>${v.pct==null?'—':v.pct+'%'}</b><small>${v.n?`${v.same} of ${v.n} votes went the way a donor that took a public position wanted (${v.rows.length} donor${v.rows.length===1?'':'s'})`:'No donor that gave to the campaign took a public position on a vote compared here'}</small></div>
      <div class="cx-stat"><span>Speech Donor Alignment</span><b>—</b><small>Not measured yet: floor speeches are collected from the Congressional Record and need to be coded by issue and side before they can be compared</small></div>
      <div class="cx-stat"><span>Timing flags</span><b>${d.allFlags.length}</b><small>for review, not scored</small></div></div>
    ${d.rows.length?`<div class="chart"><h3>Donations by month from donors with public positions</h3><div class="sub">Contributions to the campaign from each group's PACs, ${d.months.length?`${monLabel(d.months[0])} – ${monLabel(d.months.at(-1))}`:''}, each row on its own scale (the largest month is labeled at the right). Triangles under a row are votes the group took a position on: green when ${esc(s.short)} voted its way, red when not. A shaded window is a timing flag. FEC bulk data; groups are the ones whose scorecards or key-vote letters are collected.</div>
      <div class="cx-plot" id="f-months"></div>${legend([['var(--s1)','Monthly contributions'],['var(--good)','Voted the way the donor wanted'],['var(--crit)','Voted the other way'],['var(--warn)','Timing flag window']])}
      ${tableView(['Donor','Total','Votes compared','Flags'],d.rows.map(r=>[esc(r.label),fmtFull(r.total),r.markers.length,r.flags.length]))}</div>`:s.office?`<p class="small muted">The monthly series of donations from the ${GP.length} groups whose public positions are collected covers the 2026 candidates' committees, not ${esc(s.short)}'s, so there is no series to compare.</p>`:`<p class="small muted">None of the ${GP.length} groups whose public positions are collected gave to ${esc(s.short)}'s campaign in the FEC data since ${H0()}, so there is no monthly series to compare yet.</p>`}
    ${flagRows.length?`<div class="chart"><h3>Timing flags</h3><ul class="list small">${flagRows.join('')}</ul></div>`:''}
    ${v.rows.length?`<details class="tv"><summary>Vote Donor Alignment by donor</summary><div class="tablewrap"><table><thead><tr><th>Donor</th><th class="r">Votes its way</th><th class="r">Votes compared</th></tr></thead><tbody>${v.rows.map(r=>`<tr><td>${esc(r.org)}</td><td class="r">${r.same}</td><td class="r">${r.n}</td></tr>`).join('')}</tbody></table></div></details>`:''}
    <div id="f-live-analysis"></div></section>`;
}
function mountAnalysis(s){
  const el=document.getElementById('f-months');
  if(el){const d=influenceData(s);const rows=d.rows.map(r=>({...r,flags:r.flags.map(f=>({from:f.from,to:f.to,tip:`${FLAG_TEXT[f.kind]}: ${fmtFull(f.before)} before, ${fmtFull(f.after)} after`}))}));
    const f=()=>drawMonthly(document.getElementById('f-months'),rows,d.months,[]);f();resizers.push(f);}
  liveAnalysis(s,document.getElementById('f-live-analysis'));
}
// From the daily refresh: the top donor organizations combining PAC and employee money, and the bills they lobbied on
// that this person acted on.
const orgKey=v=>String(v||'').toLowerCase().replace(/\b(pac|political action committee|employees|of|the|inc|corp|corporation|co|company|llc|federal|fund)\b/g,'').replace(/[^a-z0-9]/g,'');
async function liveAnalysis(s,host){
  if(!host)return;
  try{
    const r=await fetch('/api/profile?id='+encodeURIComponent(s.id),{cache:'no-store'});if(!r.ok)throw 0;const p=await r.json();if(!host.isConnected)return;
    const emp=p.sections.donors?.orgs||[],pac=p.sections.pac?.rows||[],months=p.sections['donor-months']?.months||{},lob=p.sections.lobbying?.rows||[];
    if(!emp.length&&!pac.length){host.innerHTML=`<p class="small muted">The top ${TOP_DONORS} donor organizations by month (each organization's PAC plus its employees) and the lobbying on bills ${esc(s.short)} acted on fill in from the daily FEC and LDA.gov refresh once the keys are set. <a href="#updates">Update status</a></p>`;return;}
    const orgs=new Map();
    for(const e of emp){const k=orgKey(e.employer);orgs.set(k,{name:e.employer,pac:0,emp:e.total});}
    for(const x of pac){const k=orgKey(x.name);const o=orgs.get(k)||{name:x.name,pac:0,emp:0};o.pac+=x.amount;orgs.set(k,o);}
    const top=[...orgs.values()].map(o=>({...o,total:o.pac+o.emp})).sort((a,b)=>b.total-a.total).slice(0,TOP_DONORS);
    const mine=new Set([...(p.sections.legislation?.rows||[]),...(p.sections.cosponsored?.rows||[])].map(r=>r.bill||String(r.id).toLowerCase()).concat(DATA.votes.concat(DATA.hvotes).filter(v=>v.pos&&s.id in v.pos).map(voteBill)).filter(Boolean));
    const stake=lob.filter(l=>l.bills.some(b=>mine.has(b)));
    const mrows=Object.entries(months).map(([org,series])=>({label:org,series,markers:[]})).slice(0,8),ms=[...new Set(mrows.flatMap(r=>Object.keys(r.series)))].sort();
    const allMonths=[];if(ms.length)for(let m=ms[0];m<=ms.at(-1);m=addMonths(m,1))allMonths.push(m);
    host.innerHTML=`<div class="chart"><h3>Top ${top.length} donor organizations this cycle</h3><div class="sub">Each organization's PAC contributions plus its employees' itemized contributions (grouped by employer; donors' names are never shown), from the latest FEC refresh.</div>
      ${rankBars(top.map(o=>({label:o.name,value:Math.round(o.total/top[0].total*100),color:'var(--s1)',display:fmt$(o.total),note:[o.pac&&`PAC ${fmt$(o.pac)}`,o.emp&&`employees ${fmt$(o.emp)}`].filter(Boolean).join(' · '),tip:`${o.name}: ${fmtFull(o.total)}`})))}</div>
      ${mrows.length?`<div class="chart"><h3>Top donors' employees by month</h3><div class="cx-plot" id="f-live-months"></div></div>`:''}
      <div class="chart"><h3>Who had a stake</h3><div class="sub">Lobbying reports filed for top donor organizations that name a bill ${esc(s.short)} sponsored, cosponsored or voted on (LDA.gov).</div>${stake.length?`<ul class="list small">${stake.map(l=>`<li>${esc(l.org)} (${esc(l.registrant||'self-filed')}, ${esc(l.period||'')} ${esc(l.year||'')}): ${l.bills.filter(b=>mine.has(b)).map(b=>esc(billLabel(b))).join(', ')}${l.url?` <a href="${esc(l.url)}" target="_blank" rel="noopener">report ↗</a>`:''}</li>`).join('')}</ul>`:'<p class="small muted">No lobbying report from a top donor names one of these bills yet.</p>'}</div>`;
    if(mrows.length){const f=()=>drawMonthly(document.getElementById('f-live-months'),mrows,allMonths,[]);f();resizers.push(f);}
    hoverTips(host);
  }catch{if(host.isConnected)host.innerHTML='<p class="small muted">The refreshed donor and lobbying records are unavailable right now; the analysis above uses the reviewed research.</p>';}
}
// Outside spending for and against, each split by the spenders' sectors and colored People- or Profit-aligned.
function outsideSectorBlock(s){
  const o=s.out;if(!o||!o.cms?.length)return '';
  const by=outsideBySector(o.cms,cmOf),F=by.for.reduce((t,x)=>t+x.amount,0),A=by.against.reduce((t,x)=>t+x.amount,0),q=moneyRatio(F,A);
  const fw=o.multi?'Supporting':'For',aw=o.multi?'Opposing':'Against';
  const cats=[...new Set([...by.for,...by.against].map(x=>x.cat))];
  const amt=(side,c)=>side.find(x=>x.cat===c)?.amount||0;
  return `<div class="chart" id="f-out-sector"><h3>Outside spending by sector</h3><div class="sub">Each bar split by the spending groups' sectors, colored People-aligned (unions), Profit-aligned (industry and corporate groups) or Other (party, ideological and candidate-aligned groups). Sectors are assigned by this app from each committee's name and are under review. ${period(o.start,o.end)}.</div>
    ${q?`<p class="small" style="margin:0 0 6px"><span class="hc-ratio" style="margin-left:0;font-size:.8rem">${q.oneSided?`<b class="${q.side}">${esc(q.text[0].toUpperCase()+q.text.slice(1))}</b>`:`For-to-against <b class="${q.side}">${esc(q.text)}</b>`}</span></p>`:''}
    ${sectorSpendBars(by,catLabel,{fw,aw})}${legend([['var(--s1)',ALIGN_LABEL.people],['var(--s5)',ALIGN_LABEL.profit],['var(--cx-other)',ALIGN_LABEL.other]])}
    ${tableView(['Sector','Alignment',`Amount ${fw.toLowerCase()}`,`Amount ${aw.toLowerCase()}`],cats.map(c=>[esc(catLabel(c)),ALIGN_LABEL[categoryAlign(c)],fmtFull(amt(by.for,c)),fmtFull(amt(by.against,c))]))}</div>`;
}

// ---------- score pages: each grade ranks everyone; people who are "Not graded" stay as grey rows ----------
const SCORE_PAGES=[['match','Your match'],['promises','Promises delivered'],['ethics','Ethics'],['pvp','People over profit'],['ideology','Ideological position']];
const GRADE_FILL={A:'var(--good)',B:'var(--grade-b)',C:'var(--warn)',D:'var(--serious)',F:'var(--crit)'};
const gradeFill=p=>GRADE_FILL[letter(p)];
const whoSub=s=>`${partyName(s.party)} · ${chipCh(s)} · ${seatLabel(s)}`;
// Points lost on the Ethics grade, by kind, in the palette's fixed order.
const ETH_SEGS=[{key:'finding',label:'Confirmed findings',color:'var(--s1)'},{key:'open',label:'Open investigations',color:'var(--s2)'},{key:'closed',label:'Investigations closed without a finding',color:'var(--s3)'},{key:'late',label:'Late or missing disclosures',color:'var(--s4)'},{key:'conflict',label:'Committee-conflict trades',color:'var(--s5)'}];
const PROM_SEGS=[{key:'consistent',label:'Supported',color:'var(--good)'},{key:'partial',label:'Partly supported',color:'var(--warn)'},{key:'changed',label:'Changed position',color:'var(--warn)',cls:'cx-hatch'},{key:'contradiction',label:'Contradicted',color:'var(--crit)'}];
function ethicsPoints(s){const e=personEthics(s);return {e,parts:{finding:e.finding*ETHICS_COST.finding,open:e.open*ETHICS_COST.open,closed:e.closed*ETHICS_COST.closed,late:e.lateCost,conflict:e.conflictCost}};}
function promiseCounts(s){const c={consistent:0,partial:0,changed:0,contradiction:0};for(const x of s.statements||[])if(!x.vague&&x.assessment in c)c[x.assessment]++;return c;}
function renderScores(sub){
  if(!SCORE_PAGES.some(([k])=>k===sub))sub='match';
  const N=ALL.length,title=SCORE_PAGES.find(([k])=>k===sub)[1];
  const head=`<section class="hero" style="padding-bottom:6px"><div class="asof">Scores · ${N} politicians and candidates</div><h1 style="margin-top:8px">${esc(title)}</h1>
    <p class="lede">Each grade ranks everyone on one measure, with the number of data points behind it. People with too little evidence are listed as "Not graded" rather than left out. The Money &amp; Influence Analysis is shown on each profile, beside the grades and never inside them.</p>
    <nav class="sc-tabs" aria-label="Score pages">${SCORE_PAGES.map(([k,l])=>`<a href="#scores-${k}" class="${k===sub?'active':''}">${esc(l)}</a>`).join('')}</nav></section><section class="section" id="sc-body"></section>`;
  app.innerHTML=head;
  const body=$('#sc-body');
  ({match:scoresMatch,promises:scoresPromises,ethics:scoresEthics,pvp:scoresPvp,ideology:scoresIdeology})[sub](body);
  hoverTips(body);bindTips(body);
}
function scoresMatch(host){
  const ch=chosenIssues();
  const rows=ALL.map(s=>({s,r:scoreFor(s)})).sort((a,b)=>(b.r.score??-1)-(a.r.score??-1)||b.r.nCov-a.r.nCov||a.s.name.localeCompare(b.s.name));
  const bars=rankBars(rows.map(({s,r})=>({label:s.name,sub:whoSub(s),href:`#${s.id}-match`,value:r.score,color:r.score==null?null:gradeFill(r.score),cls:r.score==null?'':'gr-'+letter(r.score),display:r.score==null?'':`${letter(r.score)} ${r.score}%`,
    note:!ch.length?'choose your issues':`${r.nCov} of ${r.nChosen} issues`,tip:r.score==null?'':`${s.name}: ${r.score}% match on ${r.nCov} of your ${r.nChosen} issues`})));
  const graded=rows.filter(x=>x.r.score!=null);
  host.innerHTML=`${ch.length?'':`<div class="note" style="margin-bottom:12px"><b>Choose your positions first.</b> This ranking compares each record with the positions you choose in <a href="#align">My alignment</a>, weighted by the importance you give each issue. Your choices stay in this browser.</div>`}
    <div class="chart"><h3>Match with your positions</h3><div class="sub">${ch.length?`${graded.length} of ${ALL.length} have evidence on enough of your ${ch.length} issues for a grade. Bars are colored by grade; the note under each value is how many of your issues have evidence.`:'Everyone is shown as Not graded until you choose issues.'}</div>${bars}
    ${tableView(['Name','Score','Issues with evidence'],rows.map(({s,r})=>[`<a href="#${s.id}-match">${esc(s.name)}</a>`,r.score==null?'Not graded':`${letter(r.score)} ${r.score}%`,`${r.nCov} of ${r.nChosen}`]))}</div>
    ${ch.length?`<div class="chart"><h3>Issue by issue</h3><div class="sub">For one person, the share of their record that matches your side on each issue, sorted by the importance you chose.</div>
      <label class="small">Person <select id="sc-person">${rows.map(({s})=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></label><div id="sc-issues"></div></div>`:''}`;
  const sel=host.querySelector('#sc-person');
  const drawIssues=()=>{const s=byId[sel.value],r=scoreFor(s);const list=r.rows.slice().sort((a,b)=>b.pr.w-a.pr.w);
    host.querySelector('#sc-issues').innerHTML=rankBars(list.map(x=>({label:x.i.label,sub:`you: ${sideLabel(x.i.id,x.pr.side)} · importance ${WLAB[x.pr.w]}`,value:x.status==='none'?null:Math.round(x.agree*100),color:'var(--s1)',
      display:x.status==='none'?'':`${Math.round(x.agree*100)}%`,note:x.status==='none'?'no evidence':`${x.match} of ${x.n} ${x.status==='record'?'actions':'statements'}`,tip:x.status==='none'?'':`${x.i.label}: ${x.match} of ${x.n} match your side`})));
    hoverTips(host);};
  if(sel){sel.addEventListener('change',drawIssues);drawIssues();}
}
function scoresPromises(host){
  const rows=ALL.map(s=>({s,p:SCORER.promises(s),c:promiseCounts(s)})).sort((a,b)=>(b.p.pct??-1)-(a.p.pct??-1)||b.p.clear-a.p.clear||a.s.name.localeCompare(b.s.name));
  const graded=rows.filter(x=>x.p.pct!=null).length;
  host.innerHTML=`<div class="chart"><h3>Promises and stated positions checked against the record</h3><div class="sub">Raw counts, so a grade built on 3 checks looks different from one built on 20. ${graded} of ${ALL.length} have the ${MIN_CHECKS} counted checks a grade needs; ambiguous checks, outcome checks, promises with no related bill yet and vague goals are not counted.</div>
    ${legend(PROM_SEGS.map(x=>[x.color,x.label,x.cls]))}
    ${stackRows(rows.map(({s,p,c})=>({label:s.name,sub:whoSub(s),href:`#${s.id}-promises`,parts:c,grey:p.pct==null,value:p.pct==null?'Not graded':`${letter(p.pct)} ${p.pct}%`,cls:p.pct==null?'':'gr-'+letter(p.pct),note:`${p.clear} counted check${p.clear===1?'':'s'}`,empty:'No counted checks'})),PROM_SEGS,{unit:''})}
    ${tableView(['Name','Score','Kept','Half','Contradicted','Not counted'],rows.map(({s,p,c})=>[`<a href="#${s.id}-promises">${esc(s.name)}</a>`,p.pct==null?'Not graded':`${letter(p.pct)} ${p.pct}%`,c.consistent,`${c.partial} partly, ${c.changed} changed`,c.contradiction,p.notCounted+p.vague]))}</div>`;
}
function scoresEthics(host){
  const rows=ALL.map(s=>({s,...ethicsPoints(s)}));
  const noCases=rows.filter(({e})=>!e.finding&&!e.open&&!e.closed&&!e.allegation).length;
  const ded=rows.filter(({e})=>e.raw<100).sort((a,b)=>a.e.pct-b.e.pct||a.s.name.localeCompare(b.s.name));
  host.innerHTML=`<div class="cx-stats"><div class="cx-stat"><span>No recorded cases</span><b>${noCases} of ${ALL.length}</b><small>no finding, investigation or allegation in the sources checked</small></div><div class="cx-stat"><span>Lost points</span><b>${ded.length} of ${ALL.length}</b><small>have at least one deduction</small></div></div>
    <div class="chart"><h3>Points lost, by kind</h3><div class="sub">Only people with deductions are shown; everyone else scores 100%. Each case counts once, at its current status (−${ETHICS_COST.finding} confirmed finding, −${ETHICS_COST.open} open investigation, −${ETHICS_COST.closed} closed without a finding); stock trading adds −${TRADE_COST.late} per late disclosure and −${TRADE_COST.conflict} per committee-conflict trade, each capped at ${TRADE_COST.lateCap}.</div>
    ${legend(ETH_SEGS.map(x=>[x.color,x.label]))}
    ${ded.length?stackRows(ded.map(({s,e,parts})=>({label:s.name,sub:whoSub(s),href:`#${s.id}-ethics`,parts,value:`${letter(e.pct)} ${e.pct}%`,cls:'gr-'+letter(e.pct),note:`−${100-Math.max(0,e.raw)} points`})),ETH_SEGS,{unit:' points'}):'<p class="small muted">No one has a deduction.</p>'}
    ${tableView(['Name','Score','Points lost','Findings','Open','Closed','Late disclosures','Conflict trades','Allegations (not scored)'],rows.sort((a,b)=>a.e.pct-b.e.pct||a.s.name.localeCompare(b.s.name)).map(({s,e})=>[`<a href="#${s.id}-ethics">${esc(s.name)}</a>`,`${letter(e.pct)} ${e.pct}%`,100-e.pct,e.finding,e.open,e.closed,e.late,e.conflict,e.allegation]))}</div>`;
}
function scoresPvp(host){
  const rows=ALL.map(s=>({s,v:personPvp(s)})).sort((a,b)=>(b.v.pct??-1)-(a.v.pct??-1)||b.v.n-a.v.n||a.s.name.localeCompare(b.s.name));
  const graded=rows.filter(x=>x.v.pct!=null);
  const pts=graded.filter(x=>x.s.ideo).map(({s,v})=>({x:s.ideo.dim1,y:v.pct,cls:s.party,tip:`${s.name}: ${v.pct}% for working people · DW-NOMINATE ${s.ideo.dim1>0?'+':''}${s.ideo.dim1.toFixed(2)}`}));
  host.innerHTML=`${PVP_MARKS.size?'':`<div class="note" style="margin-bottom:12px"><b>No bills are scored yet, so no one has this grade.</b> A bill counts once a nonpartisan analysis of who gains from it (CBO, the Joint Committee on Taxation or the Tax Policy Center) is cited in the reviewed research. Everyone is listed below as Not graded until then.</div>`}
    <div class="chart"><h3>Who their record delivered more for</h3><div class="sub">Centered at 50%. To the right, more of their scored votes and sponsorships favored working people; to the left, the wealthy and corporations. ${graded.length} of ${ALL.length} have the ${MIN_PVP_ACTIONS} scored actions a grade needs.</div>
    ${divergingRows(rows.map(({s,v})=>({label:s.name,sub:whoSub(s),href:`#${s.id}-pvp`,value:v.pct,cls:v.pct==null?'':'gr-'+letter(v.pct),note:v.pct==null?`${v.n} of ${MIN_PVP_ACTIONS} actions`:`${v.people} of ${v.n} actions`,tip:v.pct==null?'':`${s.name}: ${v.people} for working people, ${v.profit} for the wealthy and corporations`})))}
    ${tableView(['Name','Score','People','Profit'],rows.map(({s,v})=>[`<a href="#${s.id}-pvp">${esc(s.name)}</a>`,v.pct==null?'Not graded':`${letter(v.pct)} ${v.pct}%`,v.people,v.profit]))}</div>
    <div class="chart"><h3>People over profit against ideology</h3><div class="sub">Each graded person with a DW-NOMINATE score, to spot outliers: someone far from others with a similar ideology.</div>
    ${pts.length?`<div class="cx-plot" id="sc-scatter"></div>${legend([['var(--dem)','Democrats'],['var(--rep)','Republicans'],['var(--muted)','Independents']])}`:'<p class="small muted">Nothing to plot until people are graded.</p>'}</div>`;
  if(pts.length){const f=()=>drawScatter(document.getElementById('sc-scatter'),pts,{x:{min:-1,max:1,ticks:[-1,-.5,0,.5,1],left:'More liberal',right:'More conservative',label:'DW-NOMINATE'},y:{min:0,max:100,ticks:[0,25,50,75,100],label:'People over profit'}});f();resizers.push(f);}
}
function scoresIdeology(host){
  const list=ALL.filter(s=>s.ideo);
  host.innerHTML=`<div class="chart"><h3>Where each sits in the chamber</h3><div class="sub">Voteview's DW-NOMINATE score for the whole chamber, with one person highlighted. Not graded: it describes a voting pattern, not a better or worse record. ${list.length} of ${ALL.length} have a score.</div>
    <label class="small">Person <select id="sc-ideo-p">${list.map(s=>`<option value="${s.id}">${esc(s.name)} (${CH[icH(s)].name})</option>`).join('')}</select></label><div id="sc-ideo-host"></div></div>`;
  const sel=host.querySelector('#sc-ideo-p');
  const draw=()=>{const s=byId[sel.value];resizers=resizers.filter(f=>!f.ideoPage);host.querySelector('#sc-ideo-host').innerHTML=ideoBlock(s,'sc-ideo');const f=()=>drawIdeo(document.getElementById('sc-ideo'),s);f.ideoPage=true;f();resizers.push(f);};
  sel.addEventListener('change',draw);draw();
}

// The latest entries of the monthly change log, newest first.
function methodLog(){
  const L=(window.SCORELOG||[]).slice(-3).reverse();if(!L.length)return '<p class="small muted">No monthly recalculation has been recorded yet.</p>';
  const G={promises:'Promises delivered',ethics:'Ethics',pvp:'People over profit',all:'All grades'},pc=v=>v==null?'Not graded':v+'%';
  return L.map(e=>`<div class="chart"><h3>${fmtDate(e.date)}</h3><div class="sub">Research reviewed ${esc(e.reviewedAt)} · ${esc(e.note||'')}</div>${e.changes.length?`<div class="tablewrap"><table><thead><tr><th>Person</th><th>Grade</th><th>From</th><th>To</th><th>Why</th></tr></thead><tbody>${e.changes.slice(0,60).map(c=>`<tr><td>${byId[c.id]?`<a href="#${c.id}">${esc(byId[c.id].name)}</a>`:esc(c.id)}</td><td>${G[c.grade]||esc(c.grade)}</td><td>${c.from===undefined?'—':pc(c.from)}</td><td>${pc(c.to)}</td><td class="small">${esc(c.why)}</td></tr>`).join('')}</tbody></table></div>${e.changes.length>60?`<p class="small muted">and ${e.changes.length-60} more in the log file.</p>`:''}`:'<p class="small muted">No grade changed.</p>'}</div>`).join('');
}
function renderMethod(sub){
  const sv=DATA.votes.length, hv=DATA.hvotes.length;
  const nRows=Object.values(IE.rows).reduce((a,r)=>a+r.length,0);
  app.innerHTML=`
  <section class="hero" style="padding-bottom:10px"><div class="asof">How this works</div><h1 style="margin-top:8px">Methodology</h1><p class="lede">What is covered, where every number comes from, how figures are calculated, and what is missing.</p></section>
  <section class="section prose">
    <h2>What changed in this version (October 24, 2026)</h2>
    <ul class="list">
      <li><b>New scoring rules</b> (Rule 1): votes, sponsorships, cosponsorships and official acts count fully and statements half, only where no action exists; a vote and a sponsorship on the same bill count once; promises left unacted at the end of a term count as contradicted; vague goals and promises with no related bill yet are left out; People over profit also counts sponsorships, from a list of marked bills; Ethics adds stock-trading deductions.</li>
      <li><b>Score pages:</b> a Scores menu ranks everyone on each grade, with "Not graded" people as grey rows and the data behind each grade.</li>
      <li><b>Money &amp; Influence Analysis</b> on each Money &amp; Influence tab: Vote Donor Alignment, monthly donations with vote markers, timing flags and, from the daily refresh, the top 20 donor organizations and who lobbied on their bills. Outside spending is now also split by sector and colored People- or Profit-aligned.</li>
      <li><b>New charts:</b> an Ethics case timeline and trading charts, a People Over Profit diverging bar and donor tree map.</li>
      <li><b>Many more official sources</b> refresh automatically (listed under "What refreshes" below), each with its own free key; every key that is set is used at the same time, and the same record from several sources appears once.</li>
      <li><b>Committees and IDs:</b> committee assignments and each member's IDs come from congress-legislators; Senate votes now match senators by their official LIS ID instead of surname and state.</li>
      <li><b>Monthly recalculation:</b> Promises, Ethics and People over profit are recalculated each month after review, with a change log (below).</li>
    </ul>
    <details class="tv"><summary>Earlier changes (October 3, 2026)</summary>
    <ul class="list">
      <li><b>Voter alignment:</b> choose a side and an importance on ${ISS.length} issues ("My alignment" in the top menu, or the Voter alignment tab on any profile) and see how each candidate's documented record compares, issue by issue, with every piece of evidence, its date, its type (recorded vote, bill, official action or stated position) and the arithmetic. Candidates without enough evidence show "Insufficient data".</li>
      <li><b>Money and votes side by side:</b> each Legislative record tab now lists, issue by issue, the candidate's recorded actions next to the PACs and outside groups with a stake in that issue, described as associations only.</li>
      <li><b>Bill details:</b> every key vote now opens to the measure's official title, a summary from the Congressional Research Service or another cited source, the recorded question and result, and why it is filed under its issue (or why it is not used for alignment).</li>
      <li><b>All 22 House toss-up races</b> (Cook, Sept. 25, 2026) are now on the Races page: 8 with full profiles and 14 with verified nominees, campaign funds and outside spending.</li>
      <li><b>Simpler profiles:</b> five tabs (Overview, Funding, Legislative record, Statements vs. actions, Voter alignment); ethics now sits inside the Legislative record tab, and sources are one link away.</li>
      <li><b>Citations:</b> 37 Wikipedia citations were replaced with official, Ballotpedia or news sources; claims those sources did not support were trimmed (for example, unconfirmed primary percentages), and three errors were corrected (Paxton finished second, not first, in the March primary; the 2002 phone-jamming settlement was $135,000; Wess's primary share was 39.57%). One unconfirmed ethics item (Merrin) was removed.</li>
      <li>Added the Ohio special election (Sen. Jon Husted vs. Sherrod Brown) and Nebraska (Sen. Pete Ricketts vs. independent Dan Osborn). Every Senate race rated Toss-up, Tilt or Lean by Cook, Inside Elections or Sabato is now covered, and the Races page lists those first with their ratings.</li>
      <li>Candidates who served in a state legislature now have a separate, labeled "State legislative record" section, distinct from any congressional or executive record, listing their seats and the votes and bills that could be sourced.</li>
      <li>Statement checks now separate a direct contradiction from a pairing whose evidence is ambiguous or incomplete; the former "mixed" label is gone.</li>
      <li>Race and comparison views now state what kind of evidence each candidate's record rests on, and flag when candidates are compared on different kinds.</li>
      <li>Campaign funds and outside spending are now shown separately everywhere. The earlier "all PAC and super PAC money" total, which added outside groups' spending to PAC checks the campaign received, has been withdrawn.</li>
      <li>The super PAC percentage shown in earlier versions has been withdrawn: it divided outside spending through Sept. 30 by campaign receipts through mid-2026. See "Super PAC share" below.</li>
      <li>Senators' headline figures now cover 2025–26, the same two-year period as everyone else, instead of their six-year Senate cycle.</li>
      <li>Outside spending is now counted for or against a candidate only when it names that candidate or the candidate's current opponent. $6.86 million spent opposing Graham Platner, who withdrew from the Maine race, had been counted as help for Sen. Collins; it is now listed separately.</li>
      <li>Spending dated before 2025 (2024-election ads filed late) is excluded; it had added about $330,000, mostly to three House races. Seven items filed twice with the same transaction ID ($243,601, mostly in Alaska) are now counted once.</li>
      <li>Every independent expenditure (${nRows.toLocaleString()} items) and every itemized PAC contribution can now be inspected on each Funding tab, with dates or report periods and links to the FEC filings.</li>
    </ul></details>
    <h2>The Overview page</h2>
    <p>Each profile opens on its Overview: the four grades (each opening its own tab), five small visuals and a short ethics list, each readable in a few seconds. Everything shown is also on a deeper tab, linked from the card.</p>
    <ul class="list">
      <li><b>Where the campaign's money comes from:</b> one bar splitting the FEC two-year total receipts into small donors (gifts of $200 or less, the FEC's "unitemized" individual contributions), larger individual donors (over $200), PACs and other committees, party committees, the candidate's own contributions and loans, and a last group for joint-fundraising transfers and other receipts. The groups add up to total receipts, so nothing is left out or counted twice. A campaign with no FEC report yet shows a note instead.</li>
      <li><b>Outside money for and against:</b> two bars on one scale, using the same "for" and "against" totals as the Money &amp; Influence tab (see Outside spending below), with the three largest spenders named under each. It is never added to campaign money.</li>
      <li><b>How they compare with your choices:</b> one row per issue you chose in My alignment. A check mark means every recorded item on the issue matches your side, a cross means none does, a half mark means the record is split, and an empty dashed circle means no evidence, which is never counted as a mismatch. No single percentage is shown. Until you choose issues, the card only invites you to.</li>
      <li><b>Where they sit politically:</b> the candidate's DW-NOMINATE score as a dot among faint dots for every current member of their chamber. People with no congressional voting record show "No voting score" and are never placed on the line. Below it, a second chart shows how the candidate voted on the bills marked liberal or conservative (next section).</li>
      <li><b>Do their words match their actions?:</b> the count of checked statements the record supports, those it contradicts, those partly supported or changed over time, and those unclear or affected by later events. It always states how many statements were checked, because a few checks are not a full picture of what someone has said.</li>
      <li><b>Ethics:</b> a text list rather than a chart, because very different things should not look alike. Each item carries one tag, assigned from the entry's own sources. <b>Allegation:</b> a complaint or report with no official finding. <b>Investigation:</b> a formal inquiry, lawsuit or proceeding, whether pending, closed or ended without a finding against the person. <b>Confirmed finding:</b> a court, agency or ethics body found a violation or imposed a penalty, or the person admitted it. The outcome is shown beside each item, and the full entry with sources is on the Ethics tab.</li>
    </ul>
    <h2>Profile pages</h2>
    <p>Each profile has six tabs. The four in the middle are the home-page grades, and each opens with its letter, its percentage and the arithmetic behind it, followed by the evidence. Older links to a profile's previous tabs still work and open the tab that now holds that content.</p>
    <ul class="list">
      <li><b>Overview:</b> the four grades, where the campaign's money comes from, outside money, how the record compares with your choices, where they sit politically, whether their words match their actions, and a short ethics list.</li>
      <li><b>Your match:</b> the comparison with the positions you chose, issue by issue with every piece of evidence, then the record it is drawn from: the career ideology score and key-vote position, key Senate or House votes with bill details, sponsored bills or other documented actions, any state legislative record, and the latest official bills and roll calls.</li>
      <li><b>Promises Delivered:</b> every statement check, pairing what was said with what the record shows, then the latest official records: floor speeches, hearings and committee testimony, Vote Smart positions and ratings, fact-checks, videos, posts, campaign-site snapshots and news.</li>
      <li><b>Ethics:</b> every ethics entry, most serious first, each tagged with what it is and what it costs the grade; a case timeline; reviewed stock trades with a filing-delay chart, trades by sector and a trade-and-vote timeline; then the latest trades and leads from court records, FEC enforcement records and DOJ press releases, kept apart from scored cases.</li>
      <li><b>People Over Profit:</b> a diverging bar, the votes and sponsorships on bills scored by who gains, a tree map of the top 20 donors, how the groups that fund the campaign or spend on the race wanted the candidate to vote, and money and votes by issue. These comparisons show agreement, not that money influenced a vote.</li>
      <li><b>Money &amp; Influence:</b> the Money &amp; Influence Analysis (below), where the campaign's money comes from, outside money for and against (also by month, with the for-to-against ratio), campaign funds raised, cash on hand, every PAC contribution, money routed through PACs on donors' behalf, every outside-spending group and item, the combined view, and the latest official filings.</li>
    </ul>
    <h2 id="m-grades">Grades on the home page</h2>
    <p>Each home-page card grades four things from A to F, with the percentage beside it: A is 90–100, B 80–89, C 70–79, D 60–69 and F below 60, after rounding to a whole percentage. A grade appears only with enough evidence; otherwise the card says "Not graded", which is never a zero. The rules live in one file (<span class="mono">public/grades.js</span>), and the inputs are the same records shown on each profile. The full methodology, with worked examples and the values still open for decision, is in <span class="mono">1_Political_Scorecard_Metholodgy.md</span>.</p>
    <p><b>Rule 1: actions count more than words.</b> Sponsoring or cosponsoring a bill, voting on it, and an official act (for officials who don't vote in Congress) each weigh ${WEIGHT.action}. A speech or statement weighs ${WEIGHT.statement} and is used only on an issue with no recorded action. Sponsoring a bill and then voting on it counts once, and if the two differ, the vote is the one counted. A Yea or a sponsorship takes the bill's marked side and a Nay the other; missed votes are not counted. A person who never held federal office but held a state office is scored on that state record.</p>
    <ul class="list">
      <li><b>Your match:</b> the Voter alignment score for the positions you chose in My alignment (see Voter alignment below). For each of your issues with evidence, the share of the record that matches your side, weighted by the importance you gave the issue; an issue backed only by statements counts at half its importance, and issues with no evidence are left out. It needs evidence on at least 3 of your issues and half of your total importance, and uses only your own choices, saved in your browser.</li>
      <li><b>Promises delivered:</b> from the checks on each profile's Promises Delivered tab, each pairing a specific commitment or stated position with what the record shows. A check counts 1 if the record supports it, ½ if partly supported or the position changed, and 0 if contradicted. A promise the person could have acted on but didn't by the end of the term is closed as contradicted. Ambiguous checks, outcome checks, promises with no related bill yet, and vague goals such as "fight for families" are left out. It needs ${MIN_CHECKS} counted checks. Checks that are true campaign promises are labeled "Promise". For a president, the grade uses PolitiFact's promise trackers instead (the Trump-O-Meter and MAGA-Meter for Donald Trump): each tracker's tally counts Promise Kept 1, Compromise ½ and Promise Broken 0, and Stalled and In the Works are left out until PolitiFact rates them.</li>
      <li><b>Ethics:</b> starts at 100. Each case counts once, at its current status: ${ETHICS_COST.finding} points for a confirmed finding, ${ETHICS_COST.open} for an open investigation (including one with no public resolution), and ${ETHICS_COST.closed} for an investigation that ended without a finding against the person (an acquittal, dismissal, decision not to charge, ruling in their favor, or settlement without admission). Allegations, meaning complaints no official body acted on, are listed but cost nothing. Stock trading adds ${TRADE_COST.late} points per late or missing disclosure (Periodic Transaction Reports are due within ${LATE_DAYS} days of a trade) and ${TRADE_COST.conflict} per individual stock trade in a sector the person's committees oversee, each capped at ${TRADE_COST.lateCap}; a trade near a related vote is flagged but not scored, and returns are never scored. The score never goes below 0. Spouse and dependent-child trades count and are labeled; state-only officials show "No trading data". Only reviewed trades count: new disclosures are listed for review first.</li>
      <li><b>People over profit:</b> whether their record delivered more for working people or for the wealthy and corporations. Bills are marked People or Profit only when a nonpartisan analysis of who gains (for example from the Congressional Budget Office, the Joint Committee on Taxation or the Tax Policy Center) is cited, with a short reason; a bill with no clear winner is left out. Each vote or sponsorship on a marked bill counts 1 for the side it took, one credit per bill, and the score is People points ÷ (People + Profit points). For a president, signing a marked bill or issuing a marked executive order counts for its side and a veto for the other side. It needs ${MIN_PVP_ACTIONS} scored actions. ${PVP_MARKS.size?`${PVP_MARKS.size} bill${PVP_MARKS.size===1?' is':'s are'} marked so far.`:'<b>No bills are marked yet</b>, so no one is graded.'}</li>
    </ul>
    <p>Below the grades, each card charts outside money by month for the last seven months: spending for the candidate (green) and against them (orange), side by side. The line is each month's <b>for-to-against ratio</b>, read on the scale at the right, which runs from "all for" at the top through 1 : 1 in the middle to "all against" at the bottom. The ratio is always written for-to-against, with the larger side given as a number and the other as 1: "2.1 : 1" means $2.10 was spent for the candidate for every $1 spent against, and "1 : 2.1" the reverse. The line is placed by the share of the month's outside money spent for the candidate (so 3 : 1 is 75%, 1 : 3 is 25%), which keeps "all for" and "all against" on the scale; it breaks over a month with no outside money. The badge beside the chart's title gives the same ratio for all seven months together, in green when more was spent for the candidate, orange when more was spent against, and uncolored at 1 : 1. When nothing was spent against them it reads "No opposing spending" (or "No supporting spending" for the reverse). Hover over a month, or the badge, for the dollar amounts. In races with more than two candidates the chart says "supporting" and "opposing". It covers independent expenditures reported for the general election, not money given to the campaign.</p>
    <h2 id="method-scores">Score pages</h2>
    <p>The Scores menu has one page per grade, each ranking all ${ALL.length} people, plus the ideological position. Every chart shows how many data points sit behind each grade, and people who are "Not graded" are listed as grey rows rather than left out. <b>Your match:</b> ranked bars by match, colored by grade, and an issue-by-issue breakdown for one person sorted by the importance you chose. <b>Promises delivered:</b> one stacked bar per person in raw counts (supported, partly supported, changed position, contradicted), so a grade built on 3 checks looks different from one built on 20. <b>Ethics:</b> stacked bars of points lost by kind (confirmed findings, open and closed investigations, late disclosures, committee-conflict trades) for people with deductions, and how many have no recorded cases. <b>People over profit:</b> diverging bars centered at 50%, and People over profit against DW-NOMINATE position to spot outliers. <b>Ideological position:</b> the whole chamber on the DW-NOMINATE scale with one person highlighted. Gauges, pie charts and radar charts are not used.</p>
    <h2 id="method-influence">Money &amp; Influence Analysis</h2>
    <p>Shown on each Money &amp; Influence tab, beside the grades and never inside them. It shows timing and alignment, not proof that money caused a decision. Thresholds are placeholders under review: the top ${TOP_DONORS} donors, a ${SWING*100}% change and a ${WINDOW_MONTHS}-month window.</p>
    <ul class="list">
      <li><b>Vote Donor Alignment:</b> of the votes on bills a group that gave to the campaign took a public position on (its scorecard or key-vote letter), the share that went the group's way. Missed votes are not counted. <b>Speech Donor Alignment</b> is not measured yet: floor speeches arrive from the Congressional Record and need to be coded by issue and side first.</li>
      <li><b>Donations by month:</b> each group's PAC contributions to the campaign month by month (FEC bulk data since 2019), with the votes it took a position on marked under its row. From the daily FEC refresh, the top ${TOP_DONORS} donor organizations combine each organization's PAC with its employees' itemized contributions, grouped by employer; donors' names are never shown, as FEC rules on reusing contributor information require.</li>
      <li><b>Timing flags</b> (for review, not scored): donations rose ${SWING*100}% or more in the ${WINDOW_MONTHS} months from a vote the group wanted, compared with the ${WINDOW_MONTHS} months before; dropped ${SWING*100}% or more after a vote it opposed; a position change on an issue followed a ${SWING*100}% shift in donations from a group that took positions on it; or the person held or traded stock in a group that donated and took positions on bills they acted on. A window that runs past the data is not judged.</li>
      <li><b>Who had a stake:</b> lobbying reports (LDA.gov) filed for top donor organizations that name a bill the person sponsored, cosponsored or voted on; foreign-agent registrations (FARA), comments on federal rules (Regulations.gov) and federal contracts (USAspending, matched through SAM.gov's company IDs) are listed as context.</li>
      <li><b>Outside spending by sector:</b> money outside groups spent for and against, each bar split by the groups' sectors and colored People-aligned (unions), Profit-aligned (industry and corporate groups) or Other (party, ideological and candidate-aligned groups). Outside spenders have no industry code, so the sector is assigned by this app from the committee's name, the same way PAC sectors are; it is under review. Outside spending is a plain number, not a grade: the person cannot legally coordinate with these groups.</li>
      <li><b>Top donors tree map</b> (People Over Profit tab): tile size is the amount given; unions and small-dollar donors (one tile) are People-aligned, corporate PACs and industry groups Profit-aligned, and leadership, party and ideological committees Other.</li>
    </ul>
    <h2 id="method-sources">What refreshes, and how sources are merged</h2>
    <p>The reviewed research is the basis of every grade. Separately, official sources refresh daily (weekly for court records, LegiScan and committee meetings) and appear under "Latest official records" on each tab. <b>Nothing new changes a grade by itself:</b> new votes, bills, speeches, trades, filings and leads are listed for review, and a grade changes only when the reviewed research is updated and the monthly recalculation runs. Where several sources cover the same thing, their records are merged so each appears once: stock trades from Bargo, Eulerpool and Financial Modeling Prep by member, company, date, buy or sell and amount range, then matched to the member's official House filing, whose date wins; state bills from Open States and LegiScan by state, session year and bill number; news from GDELT and the New York Times by link. Disagreements are flagged for review. Court records, FEC enforcement records, DOJ press releases and news are leads: one becomes a scored case only after its status is confirmed from an official record. <a href="#updates">See every source and its status</a>.</p>
    <h2 id="method-log">Monthly recalculation and change log</h2>
    <p>Promises delivered, Ethics and People over profit are recalculated once a month, after the month's review, by <span class="mono">npm run scores:monthly</span>, which records every change and why in <span class="mono">public/score-log.json</span>. Your match is not logged, since it depends on your own choices. Each grade tab says when it was last recalculated, and marks a grade that reviewed edits have changed since.</p>
    ${methodLog()}
    <h2>Key votes marked liberal or conservative</h2>
    <p>Each key vote is checked against the issues it is coded to. Where an issue is a clear liberal-versus-conservative policy question in current U.S. politics, one side is marked liberal and the other conservative, as listed below. A bill is marked only if every issue it is coded to points the same way. Bills on unmarked issues, bipartisan deals, nominations and stopgap funding bills are left unmarked, and each unmarked bill shows its reason on the Your match tab. The marking is a judgment, kept in one place (<span class="mono">liberalSide</span> on each issue in <span class="mono">research.json</span>) so it can be reviewed and changed.</p>
    <ul class="list">${ISS.map(i=>i.liberalSide?`<li><b>${esc(i.label)}:</b> liberal side = "${esc(i[i.liberalSide])}"; conservative side = "${esc(i[i.liberalSide==='A'?'B':'A'])}".</li>`:`<li><b>${esc(i.label)}:</b> not marked. ${esc(i.leanNote)}</li>`).join('')}</ul>
    <p>A person's key-vote position counts only the marked bills they voted on: a Yea takes the side the bill is marked with and a Nay takes the other. A missed vote, and any bill from before the person took office, is not counted. A position is shown only with at least ${KV_MIN} such votes, and the chart places the person by the share of those votes taken on the conservative side. This counts a small, selected set of consequential votes. It is not a statistical ideology score, it can be compared only within a chamber because the House and Senate sets differ, and it should not be confused with the DW-NOMINATE career score above it, which uses every roll call. Vote text is always plain black; the "Side taken" column says whether each vote was on the liberal or the conservative side.</p>
    <h2>Portraits</h2>
    <p>Home cards show a portrait for each person with a photo. For those who have served in Congress it is usually their official congressional portrait, a public-domain U.S. government photo, from the <a href="https://github.com/unitedstates/images" target="_blank" rel="noopener">unitedstates/images</a> project. Photos of the other candidates, and of Sens. Cory Booker and Jon Husted, were supplied by the site's editor for use here. The background is removed automatically and each face is scaled and placed the same way, so no one is shown larger than anyone else (except one, shown about 15% smaller so his wide-brimmed hat fits the frame); where a photo was cropped tightly, the clothing is extended into the bottom of the circle. Former members' official photos date from their time in Congress, which for some was years ago. Every profiled person now has a photo; if one is missing or fails to load, the card shows their initials instead.</p>
    <h2>Who is covered</h2>
    <p><b>Senate incumbents:</b> six senators on the November 3, 2026 ballot, three Republicans and three Democrats, chosen as a bipartisan sample of competitive and safe seats. Two senators originally selected were replaced during research because they will not be on the ballot: Sen. Lindsey Graham (R-SC) died in July 2026 and Sen. Markwayne Mullin (R-OK) left the Senate for an administration post.</p>
    <p><b>House:</b> the Cook Political Report rates 22 House races Toss-up (Sept. 25, 2026). Eight have full profiles of both nominees (four seats held by each party). The other 14 are shown on the Races page with their nominees (verified from election results or news reports), campaign funds and outside spending only; their records, statements and ethics have not been researched yet.</p>
    <p><b>Challengers and open seats:</b> every opponent of those 14 incumbents, and both major-party nominees in each open Senate race (plus independent Seth Bodnar in Montana). Nominees were confirmed from primary and runoff results.</p>
    <p><b>Ohio and Nebraska:</b> Sen. Jon Husted (appointed in January 2025) and Sen. Pete Ricketts are profiled alongside their opponents, Sherrod Brown and independent Dan Osborn. No Democrat is on the Nebraska ballot: the Democratic nominee withdrew in July 2026 and the state party declined to name a replacement.</p>
    <h2>Competitive races</h2>
    <p>A Senate race is marked competitive when at least one of the Cook Political Report (Sept. 23), Inside Elections (Sept. 17) or Sabato's Crystal Ball (Sept. 22, 2026) rates it Toss-up, Tilt or Lean, as compiled in Wikipedia's ratings table. That gives ten races: Alaska, Georgia, Iowa, Kansas, Maine, Michigan, New Hampshire, North Carolina, Ohio and Texas; all are covered. Nebraska is rated Likely Republican by all three but Toss-up or Lean by some other forecasters, and is included. House races were chosen from Cook's toss-up list at the time of research; their ratings have not been re-checked.</p>
    <h2>Campaign funds raised</h2>
    <p>Each campaign's figures are the FEC's two-year summary for its principal campaign committee (2025–26), through the end date of its latest report, usually June 30, 2026. "Campaign funds raised" is the FEC's total receipts: individual contributions, PAC and party contributions, transfers from joint fundraising committees, the candidate's own loans and contributions, and other receipts. Where a candidate's own money is more than 20% of the total, the profile says so. Cash on hand and debts are as of the same date. Third-quarter reports, through Sept. 30, are due October 15, 2026.</p>
    <h2>PAC contributions</h2>
    <p>PAC contributions are part of campaign funds. Each row is one contribution itemized on FEC Schedule A, line 11C, in the reports listed on the profile: 2025–26 reports for senators and January–June 2026 reports for everyone else. The FEC lists contributions by report, so each row shows its report and period, not an exact date. Rows were transcribed from the FEC's report viewer; where some could not be read, the profile shows the share covered and does not estimate the rest. Sectors are assigned by this app from each committee's name and sponsor (not reported by the FEC); committees that cannot be identified from the filing are left unclassified. "Orientation" appears only where a group's political purpose is documented.</p>
    <h2>Outside spending (independent expenditures)</h2>
    <p>An independent expenditure is spending on ads, mail or canvassing that supports or opposes a candidate, paid for by a group that may not coordinate with the campaign. It is never money the campaign raised. Data: ${esc(IE.source)} Items run from January 1, 2025 to ${fmtDate(IE.asof)}, by date of dissemination. Three filings were spot-checked against FEC images.</p>
    <ul class="list">
      <li><b>For a candidate</b> = items supporting that candidate plus items opposing the candidate's current opponent. <b>Against</b> = items opposing the candidate plus items supporting the opponent.</li>
      <li>Items naming anyone else (a primary candidate, or a nominee who withdrew) are listed separately and counted for no one.</li>
      <li>Three-way races (Montana): spending against one candidate cannot be credited to a single rival, so profiles summarize only spending aimed directly at that candidate and list spending aimed at rivals separately.</li>
      <li>Spending is split by who paid: super PACs, other outside groups (nonprofits and traditional PACs) and party committees. Party coordinated spending is a different category and is not included.</li>
      <li>Negative amounts are corrections filed by the spender and are kept so totals match the filings.</li>
      <li>An item that appears in two filings identical in every field, including its transaction ID, is the same spending reported twice (an amended or repeated notice) and is counted once, from the latest filing. Items identical except for the transaction ID are kept, because the filings list them as separate transactions, but are flagged "possible repeat" and their total is stated on the profile.</li>
      <li>Some notices are filed in advance with a dissemination date after the data cut-off; the data set shows those as Sept. 30, and they are flagged "date capped".</li>
      <li>When one ad both supports a candidate and opposes the opponent, the spender is supposed to split its cost between two lines; both lines count toward "for" the same candidate, so the split does not change the totals. If a spender instead reported the full cost on both lines, the totals would be overstated; this app adds lines as filed and cannot check the split without the filing images.</li>
      <li>The compiled data leaves out spending on third-party and independent candidates, so the Montana race (Seth Bodnar) is marked incomplete.</li>
      <li>Primary-election spending is not included.</li>
    </ul>
    <h2>Combined view</h2>
    <p>A "campaign funds + outside spending" figure appears only where both parts cover the same dates: campaign funds raised through the campaign's latest report, plus outside spending for the candidate dated on or before that day. Outside spending after that date is shown separately, as is spending against the candidate. Nothing is counted twice: PAC and party contributions are already inside campaign funds, independent expenditures never pass through the campaign, and earmarked donations routed through PACs are recorded by the FEC as individual contributions.</p>
    <h2>Super PAC share</h2>
    <p>Withdrawn for now. The earlier figure divided super PAC spending through Sept. 30 by campaign receipts through mid-2026, two different periods, and most general-election spending came after June. The planned replacement is <b>super PAC spending for the candidate ÷ (campaign funds raised + all outside spending for the candidate)</b>, with both parts covering January 1, 2025 to September 30, 2026, computed once third-quarter campaign reports are filed (due October 15). It will be labeled as general-election only, and it will not be shown for three-way races or races marked incomplete. The earlier Low/Moderate/High bands are dropped because they were never validated.</p>
    <h2>Money routed through PACs on donors' behalf</h2>
    <p>Some groups bundle their members' donations: individuals give through the group's PAC, which forwards each contribution to the candidate as an "earmarked" contribution. The FEC treats this as individual money, so it is invisible in a PAC breakdown even when a group directed it. Totals are shown only where they could be verified: for Sen. Booker, $707,803 routed through AIPAC's PAC from January to September 2025, as tallied from FEC filings by Sludge. For Sen. Collins, AIPAC PAC's August 2026 report shows earmarked contributions forwarded to her campaign, but the total is not yet tallied. Elsewhere the figure is "not measured", which is not a finding that none was received.</p>
    <h2>Voting ideology (liberal–conservative %)</h2>
    <p>Ideology uses Voteview's DW-NOMINATE first-dimension score, estimated from every roll call a member has cast (−1 most liberal, +1 most conservative), taken from the Open Chambers mirror of Voteview data (built September 30, 2026) and spot-checked against Voteview. The percentile compares each member with the other current members of the same chamber who have at least 100 scored votes (${DATA.pools.S.length} senators, ${DATA.pools.H.length} representatives). Party unity is the share of party-line votes cast with the party majority in the 119th Congress. No published state-legislature score is comparable, so state legislators show their record instead.</p>
    <h2>Records for candidates who are not in Congress</h2>
    <p>Each candidate's record comes from the office they actually held, in clearly labeled sections: <b>congressional record</b> (U.S. roll-call votes and sponsored bills), <b>state legislative record</b> (seats held, recorded votes, bills authored or sponsored, leadership posts), <b>record in executive office</b> (major official acts with outcomes) and, for candidates who never held office, <b>other documented record</b> (public actions and platform commitments). A state legislative vote is shown only where a source shows that person's own vote; no vote is inferred. Many state journals from before about 2010 are not online, so several people's state records are short or empty, and each section says what was searched. Each state item notes why it is filed under its policy area. Comparisons flag when candidates' records are different kinds of evidence, because a congressional vote record, a state record and a list of executive actions are not directly comparable.</p>
    <h2>Legislative record</h2>
    <p>Senate: ${sv} roll calls from the 117th–119th Congresses, read from the Senate's official vote records. House: ${hv} roll calls from 2021–2026, positions read from the House Clerk's records (via the Open Chambers mirror for 2025–26, verified against the Clerk for sampled votes). These key votes were selected by this app to cover major issues of the period; each opens to the measure's official title, a cited summary, the recorded question and result, and the reason it is or is not used for voter alignment.</p>
    <h2>Statements vs. actions</h2>
    <p>Each check pairs a dated, sourced statement with a dated, sourced action. <b>Consistent</b>: the action matches the statement. <b>Direct contradiction</b>: the documented record directly conflicts with what was said (for example, a claim of an amount that the official record shows was not reached). <b>Partly consistent</b>: the record clearly matches one part of a statement and clearly conflicts with another. <b>Ambiguous or incomplete evidence</b>: statement and action point in different directions, but whether they conflict depends on interpretation (different bills, different stated reasons) or the record is incomplete (for example, absences). <b>Changed position</b>: an acknowledged or evident reversal. <b>Outcome check</b>: the action matched the reasoning at the time, but later developments bear on it. Labels describe the pairing, not the merits of the policy. Checks were chosen for being consequential and verifiable, not as a representative sample of everything a candidate has said.</p>
    <h2>Ethics and compliance</h2>
    <p>Entries cover findings by ethics bodies, enforcement actions, reported STOCK Act late disclosures, complaints and referrals (with their documented outcome), and investigations that ended without charges. Partisan outlets are not used as the sole source. "None found" means the listed searches turned up nothing, not that nothing exists.</p>
    <h2>Voter alignment</h2>
    <p><b>Issues.</b> ${ISS.length} issues, each with two sides written neutrally: ${ISS.map(i=>esc(i.label)).join('; ')}. The list is limited to issues on which candidates' records could be documented; it leaves out many topics voters care about.</p>
    <p><b>Answering.</b> On My alignment each issue is one statement to agree or disagree with; agreeing takes the issue's first side and disagreeing the second. Strongly agree or strongly disagree counts as high importance (3), agree or disagree as medium (2), and Neutral is recorded as answered but left out of every score. Each question lists the key votes it is compared with. The answers are the same choices used on each profile's Your match tab and in the home-page "Your match" grade.</p>
    <p><b>Evidence.</b> (1) Key congressional votes: each is assigned to an issue only when the measure's documented content makes the direction clear, with the reason shown on the vote ("Bill details"). Nominations, stopgap spending bills, bundled packages and lopsided votes are not used; each shows why. When a member voted more than once on the same bill, only the final vote counts. (2) State legislative votes, sponsored bills, official actions and statements from each profile, coded only when the item's own words make the side clear; each coded item shows the reason. Coding was proposed item by item, then reviewed; two items coded from a bill title alone were removed. No vote is inferred, and absences are never counted.</p>
    <p><b>Score.</b> For each issue you choose, the candidate's agreement is the share of their recorded actions (votes, bills, official actions) that match your side. Stated positions are used only for an issue with no recorded action, and are labeled. The overall figure is the importance-weighted average across your issues that have evidence: Σ (importance × agreement) ÷ Σ importance of covered issues. Issues without evidence are left out, not scored as zero. A figure is shown only when evidence covers at least three of your issues (or all of them, if you chose fewer than three) and at least half of your total importance; otherwise the result is "Insufficient data". The figure compares a record with your choices; it is not a rating of the candidate, and candidates with more votes on record have more chances to differ from you.</p>
    <p><b>Your choices</b> are stored only in your browser. The example starting points are labeled by their content, and every choice can be changed.</p>
    <h2>Money and votes side by side</h2>
    <p>For each issue, the People Over Profit tab lists the candidate's recorded actions next to groups linked to that issue by one of three documented routes: the group's documented orientation or description (for example, a gun-rights or environmental group); its own name; or the industry sector this app assigned to a PAC (for example, oil and gas for climate and energy), with the reason shown. Amounts are PAC contributions to the campaign in the itemized reports and outside spending for or against the candidate, with dates. This is an association to explore, not evidence that money influenced a vote; groups often support candidates who already agree with them.</p>
    <h2>Funders' own positions vs. votes</h2>
    <p>For organizations that gave to a campaign or spent on a race and that publish congressional scorecards or "key vote" letters, the app records which way the organization wanted each of the key votes to go, from the organization's own scorecard or letter (or, as a second choice, a news report quoting it), and shows the candidate's recorded vote beside it. A position is recorded only for the same roll call (or, for a public letter, the same bill at the same stage); nothing is inferred from an organization's general mission. Two positions were left out because the exact roll call could not be confirmed from a page that was read (AFL-CIO on the March 2025 stopgap bill; NFIB on the Senate's 2025 budget-bill vote). Organizations researched: ${GP.map(g=>esc(g.org)+' ('+g.nPositions+' positions'+(g.status==='pending'?', research in progress':'')+')').join('; ')}. Groups are matched to money by the names of the committees they control. Party-aligned super PACs, which make most of the outside spending in these races, were not researched for bill positions. Agreement with a funder's positions is not evidence that money influenced a vote.</p>
    <h3>Money and votes over time</h3>
    <p>Under each comparison, a timeline shows that organization's money to or about the candidate month by month since January 2019, with the compared votes as numbered circles on the same time axis. Above the line: contributions to the candidate's campaign from the organization's PACs, and independent expenditures naming the candidate in support. Below the line: independent expenditures naming the candidate in opposition, which is money spent to defeat the candidate, not money the candidate received. The organization's FEC committees are listed under each chart, and include its own connected PAC where the FEC committee file names the organization.</p>
    <ul class="list">
      <li><b>Contributions</b> (direct and in-kind) come from the FEC bulk file of committee contributions to candidates for the 2020 through 2026 cycles, as reported by the giving committee, by transaction date. They include the candidate's earlier campaigns for another office (for example, a House member now running for the Senate), matched by FEC candidate ID. Memo lines are left out.</li>
      <li><b>Outside spending before 2025</b> comes from the same bulk file. <b>From January 2025</b> it comes from the outside-spending data used everywhere else on this site, because the bulk file holds only regular reports and misses the most recent 24- and 48-hour notices.</li>
      <li>Outside spending counts only general-election items (including runoffs held after a general election, such as Georgia's in January 2021) that name the candidate directly. Primary spending, and spending for or against an opponent, are not shown, so a chart's total can be lower than the totals above it.</li>
      <li>Money arriving before or after a vote does not show that it influenced the vote. Groups mostly fund people who already vote their way, and spend most heavily in the months before an election.</li>
    </ul>
    <h2>Glossary</h2>
    <dl class="kvd">
      <dt>Campaign funds raised</dt><dd>${esc(GLOSS.receipts)}</dd>
      <dt>Independent expenditure</dt><dd>${esc(GLOSS.ie)}</dd>
      <dt>Outside spending</dt><dd>All independent expenditures by super PACs, other outside groups and party committees. "For" a candidate = supporting them or opposing their opponent.</dd>
      <dt>Super PAC</dt><dd>${esc(GLOSS.superpac)}</dd>
      <dt>PAC contribution</dt><dd>${esc(GLOSS.pac)}</dd>
      <dt>Joint fundraising transfer</dt><dd>${esc(GLOSS.transfers)}</dd>
      <dt>Earmarked contribution</dt><dd>${esc(GLOSS.earmarked)}</dd>
      <dt>Roll call</dt><dd>A recorded vote in which each member's position is listed by name in the official record.</dd>
      <dt>Cloture</dt><dd>A Senate vote to end debate, usually needing 60 votes; a vote for cloture is a vote to move a measure forward.</dd>
      <dt>DW-NOMINATE</dt><dd>A political-science score of where a member of Congress sits on a left–right scale, estimated from all their roll-call votes.</dd>
      <dt>Insufficient data</dt><dd>Shown instead of an alignment figure when the documented evidence covers too few of your chosen issues.</dd>
    </dl>
    <h2>Automatic refresh checks</h2><p>The update service checks source identifiers, required fields, amounts, pagination, and vote identities before publishing. It retains the previous published records when an update fails. Reviewed research remains the imported snapshot and is not automatically fact-checked or reclassified. See the Updates page for retrieval history and coverage.</p>
    <h2>Known gaps</h2>
    <ul class="list">
      <li>Campaign funds run through each campaign's latest report (mostly June 30, 2026); outside spending runs through ${fmtDate(IE.asof)}.</li>
      <li>Troy Jackson (D-ME) has not filed a financial report yet.</li>
      <li>Two of Sen. Collins' reports (Year-End 2025 and Pre-Primary 2026) could not be retrieved, so her PAC rows are incomplete. Several other candidates' rows are a few short of their reports' totals; each profile shows its coverage.</li>
      <li>One of Sen. Marshall's reports (April 2025) transcribed to $5,000 more than the report's subtotal; it is flagged on his profile.</li>
      <li>Earmarked (conduit) totals are measured only for Sen. Booker.</li>
      <li>Fourteen of the 22 House toss-ups are shown with funding only; their candidates have no record, statement or ethics research yet.</li>
      <li>The alignment issue list covers ${ISS.length} issues that could be documented; candidates whose records are mostly on other topics (for example, Texas education bills) have little coded evidence, and several candidates without a voting record show "Insufficient data".</li>
      <li>Some 2026 primary percentages could not be confirmed against certified results and were removed from status lines.</li>
      <li>State legislative records are thin where old journals are offline: none could be sourced for Chris Pappas or Juliana Stratton, and only a leadership post for Mary Peltola and Mariannette Miller-Meeks.</li>
      <li>Outside spending on independent candidates Dan Osborn (Nebraska) and Seth Bodnar (Montana) is missing from the compiled data, so those races are marked incomplete.</li>
      <li>Voteview's page for Sherrod Brown did not show his numeric ideology score, so none is displayed.</li>
    </ul>
    <h2>Independence</h2>
    <p>Built from public records with no affiliation to any campaign, party or PAC. Nothing here is a voting recommendation.</p>
  </section>`;
}

// ---------- tooltips ----------
function bindTips(root){
  root.querySelectorAll('[data-tip]').forEach(el=>{
    el.addEventListener('mouseenter',()=>{tip.textContent=el.dataset.tip;tip.classList.add('show');});
    el.addEventListener('mousemove',e=>{const x=Math.min(e.clientX+12,window.innerWidth-270);tip.style.left=x+'px';tip.style.top=(e.clientY+14)+'px';});
    el.addEventListener('mouseleave',()=>tip.classList.remove('show'));
    el.setAttribute('tabindex','0');el.setAttribute('aria-label',el.dataset.tip);
    el.addEventListener('focus',()=>{const r=el.getBoundingClientRect();tip.textContent=el.dataset.tip;tip.style.left=r.left+'px';tip.style.top=(r.bottom+6)+'px';tip.classList.add('show')});
    el.addEventListener('blur',()=>tip.classList.remove('show'));
  });
}
route();
})();
