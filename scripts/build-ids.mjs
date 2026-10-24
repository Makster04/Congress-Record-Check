// Adds each profiled person's IDs across systems, official social accounts and committee assignments from the
// congress-legislators project (https://github.com/unitedstates/congress-legislators, public domain, no key).
//   node scripts/build-ids.mjs              download the current files
//   node scripts/build-ids.mjs --dir <dir>  use copies already downloaded (same file names, .json)
// Writes data/config.json (lis, ids, social, campaignSite for each profiled person) and public/committees.json.
// People who never served in Congress are looked up in Wikidata by their FEC candidate ID when Wikidata is reachable.
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const BASE='https://raw.githubusercontent.com/unitedstates/congress-legislators/gh-pages/';
const FILES=['legislators-current','legislators-historical','legislators-social-media','committees-current','committee-membership-current'];
const KEEP_IDS=['govtrack','opensecrets','votesmart','wikidata','ballotpedia','wikipedia','icpsr','cspan','thomas'];
const KEEP_SOCIAL=['twitter','facebook','youtube','youtube_id','instagram','mastodon'];
const root=new URL('../',import.meta.url);
const arg=process.argv.indexOf('--dir'),dir=arg>0?process.argv[arg+1]:null;

async function load(name){
  if(dir)return JSON.parse(await fs.readFile(`${dir}/${name}.json`,'utf8'));
  const r=await fetch(BASE+name+'.json',{signal:AbortSignal.timeout(60000)});
  if(!r.ok)throw new Error(`${name}: HTTP ${r.status}`);
  return r.json();
}
const pick=(o,keys)=>Object.fromEntries(keys.filter(k=>o?.[k]!=null&&o[k]!=='').map(k=>[k,o[k]]));

// Exported for the tests: match people to legislators and build the committee file from the published records.
export function matchPeople(people,legislators){
  const byBio=new Map(),byFec=new Map();
  for(const x of legislators){byBio.set(x.id.bioguide,x);for(const f of x.id.fec||[])byFec.set(f,x);}
  const out=new Map();
  for(const p of people){
    const x=(p.bioguide&&byBio.get(p.bioguide))||(p.fecCand&&byFec.get(p.fecCand));
    // A match through the FEC candidate ID must agree with the configured state.
    if(x&&(x.id.bioguide===p.bioguide||x.terms.some(t=>t.state===p.state)))out.set(p.id,x);
  }
  return out;
}
export function buildCommittees(committees,membership,matched,congress){
  const info={},people={};
  for(const c of committees){
    info[c.thomas_id]={name:c.name,chamber:{senate:'S',house:'H',joint:'J'}[c.type]||null,url:c.url||null,jurisdiction:c.jurisdiction||null};
    for(const s of c.subcommittees||[])info[c.thomas_id+s.thomas_id]={name:s.name,parent:c.thomas_id};
  }
  const bioToId=new Map([...matched].map(([id,x])=>[x.id.bioguide,id]));
  for(const [cid,members] of Object.entries(membership)){
    if(!info[cid])continue;
    for(const m of members){
      const id=bioToId.get(m.bioguide);if(!id)continue;
      (people[id]||=[]).push(Object.assign({id:cid,rank:m.rank??null,party:m.party||null},m.title?{title:m.title}:{}));
    }
  }
  // Full committees first, each followed by its subcommittees.
  for(const list of Object.values(people))list.sort((a,b)=>{
    const pa=info[a.id].parent||a.id,pb=info[b.id].parent||b.id;
    return pa.localeCompare(pb)||(info[a.id].parent?1:0)-(info[b.id].parent?1:0)||a.id.localeCompare(b.id);
  });
  const used=new Set(Object.values(people).flat().flatMap(c=>[c.id,info[c.id].parent].filter(Boolean)));
  return {congress,source:'https://github.com/unitedstates/congress-legislators',
    note:'Committee assignments for the current Congress, from congress-legislators. The refresher checks the official Senate and House lists daily and shows them under Latest official records.',
    committees:Object.fromEntries([...used].sort().map(id=>[id,info[id]])),people};
}

async function wikidata(fecIds){
  const values=fecIds.map(f=>`"${f}"`).join(' ');
  const q=`SELECT ?item ?fec WHERE { VALUES ?fec { ${values} } ?item wdt:P1839 ?fec }`;
  try{
    const r=await fetch('https://query.wikidata.org/sparql?format=json&query='+encodeURIComponent(q),{headers:{'User-Agent':'CongressRecordCheck/1.0 (local research build)'},signal:AbortSignal.timeout(30000)});
    if(!r.ok)throw new Error('HTTP '+r.status);
    const d=await r.json(),out=new Map();
    for(const b of d.results.bindings){const id=b.item.value.split('/').pop();if(/^Q\d+$/.test(id))(out.get(b.fec.value)||out.set(b.fec.value,new Set()).get(b.fec.value)).add(id);}
    // Two items claiming the same FEC ID need review, so neither is used.
    return new Map([...out].filter(([,s])=>s.size===1).map(([f,s])=>[f,[...s][0]]));
  }catch(e){console.warn(`Wikidata not reachable (${e.message}); existing Wikidata IDs left unchanged.`);return null;}
}

if(import.meta.url===pathToFileURL(process.argv[1]).href){
  const [current,historical,social,committees,membership]=await Promise.all(FILES.map(load));
  const configURL=new URL('data/config.json',root),config=JSON.parse(await fs.readFile(configURL,'utf8'));
  const research=JSON.parse(await fs.readFile(new URL('public/research.json',root),'utf8'));
  const profiles=new Map([...research.members,...research.cands].map(s=>[s.id,s]));
  const people=config.people.filter(p=>profiles.has(p.id));
  const matched=matchPeople(people,[...current,...historical]);
  const socialBy=new Map(social.map(s=>[s.id.bioguide,s.social]));
  const curMatched=new Map([...matched].filter(([,x])=>current.includes(x)));
  const wd=await wikidata(people.filter(p=>!matched.has(p.id)&&p.fecCand).map(p=>p.fecCand));
  let withLis=0,withIds=0,withWd=0;
  for(const p of config.people){
    if(!profiles.has(p.id))continue;
    const x=matched.get(p.id),s=profiles.get(p.id),bluesky=p.social?.bluesky||[];
    if(x){
      p.lis=x.id.lis||null;if(p.lis)withLis++;
      p.ids=pick(x.id,KEEP_IDS);withIds++;
      p.social=pick(socialBy.get(x.id.bioguide),KEEP_SOCIAL);
    }else{
      p.lis=null;
      const q=wd?.get(p.fecCand)||p.ids?.wikidata;
      p.ids=q?{wikidata:q}:{};if(q)withWd++;
      p.social=pick(p.social,KEEP_SOCIAL);
    }
    // Accounts the project adds by hand (Bluesky has no official list) are kept across rebuilds.
    p.social.bluesky=bluesky;
    p.campaignSite=s.cand?(s.site||null):(p.campaignSite||null);
    p.openstates=p.openstates||null;p.legiscan=p.legiscan||null;
  }
  await fs.writeFile(configURL,JSON.stringify(config,null,2));
  const out=buildCommittees(committees,membership,curMatched,config.congress);
  out.checked=new Date().toISOString().slice(0,10);
  await fs.writeFile(new URL('public/committees.json',root),JSON.stringify(out,null,1)+'\n');
  console.log(`${matched.size} of ${people.length} profiled people matched; ${withLis} with Senate LIS IDs; ${Object.keys(out.people).length} with current committee assignments; ${withWd} matched in Wikidata only.`);
}
