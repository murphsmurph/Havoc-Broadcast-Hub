// Build data/ep-players.json: SPHL (HockeyTech) players matched to Elite
// Prospects via the official EP API, keyed by HockeyTech player ID.
//
// Run by .github/workflows/ep-data.yml (weekly + manual). Locally:
//   EP_API_KEY=xxx node scripts/build-ep-data.mjs
//
// Env:
//   EP_API_KEY   Elite Prospects API key (GitHub secret). Without it the
//                script still runs in Plan-B mode: it applies hand-made
//                overrides from data/ep-overrides.json as profile links
//                and never calls the EP API.
//   HT_KEY       optional HockeyTech feed key (otherwise auto-detected)
//   MAX_EP_CALLS optional per-run EP call budget (default 220 to stay
//                inside the free tier's 1,000/month across ~4 runs)

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const DATA_DIR=path.join(ROOT,'data');
const MAP_FILE=path.join(DATA_DIR,'sphl-ep-map.json');
const OVERRIDES_FILE=path.join(DATA_DIR,'ep-overrides.json');
const OUT_FILE=path.join(DATA_DIR,'ep-players.json');

const HT_BASE='https://lscluster.hockeytech.com/feed/index.php';
const HT_CANDIDATE_KEYS=['41b145a848f4bd67','ccb91f29d6744675','2976319eb44abe94','f1aa699db3d81487','446521baf8c38984','c680916776709578','50c2cd9b5e18e390','f322673b6bcae299'];
const EP_BASE='https://api.eliteprospects.com/v1';
// local convenience: read .env from the repo root when EP_API_KEY isn't already set
if(!process.env.EP_API_KEY){
  try{
    for(const line of fs.readFileSync(path.join(ROOT,'.env'),'utf8').split(/\r?\n/)){
      const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^["']|["']$/g,'');
    }
  }catch(e){}
}
const EP_KEY=process.env.EP_API_KEY||'';
const MAX_EP_CALLS=+(process.env.MAX_EP_CALLS||220);
const STATS_MAX_AGE_DAYS=30;

/* ---------------- small utils ---------------- */
export function normName(s){
  return String(s||'').toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu,'')
    .replace(/\b(jr|sr|ii|iii|iv)\.?\s*$/,'')
    .replace(/[^a-z]/g,'');
}
export function posClass(p){
  p=String(p||'').toUpperCase();
  if(/G/.test(p))return 'G';
  if(/D/.test(p)&&!/F/.test(p))return 'D';
  if(/C|W|F/.test(p))return 'F';
  return '';
}
export function isoDob(s){
  const m=String(s||'').match(/(\d{4})-(\d{2})-(\d{2})/);
  return m?m[1]+'-'+m[2]+'-'+m[3]:'';
}
export function heightInches(h){
  h=String(h||'').trim();
  let m=h.match(/(\d)\s*'\s*(\d{1,2})/)||h.match(/^(\d)[-.](\d{1,2})$/);
  if(m)return (+m[1])*12+(+m[2]);
  m=h.match(/^(\d{2,3})$/); // centimeters
  if(m&&+m[1]>100)return Math.round(+m[1]/2.54);
  return null;
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function readJson(file,fallback){
  try{return JSON.parse(fs.readFileSync(file,'utf8'));}catch(e){return fallback;}
}
function writeJson(file,obj){
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,JSON.stringify(obj,null,1)+'\n');
}
function pick(o,keys,d){for(const k of keys){if(o&&o[k]!=null&&o[k]!=='')return o[k];}return d;}

/* ---------------- default fetchers (injectable for tests) ---------------- */
async function defaultFetchJson(url,headers){
  const res=await fetch(url,{headers:headers||{}});
  if(!res.ok)throw new Error('HTTP '+res.status+' for '+url.replace(/apiKey=[^&]+/,'apiKey=***'));
  const txt=await res.text();
  const m=txt.match(/[\[{][\s\S]*[\]}]/);
  if(!m)throw new Error('not JSON from '+url.slice(0,80));
  return JSON.parse(m[0]);
}

let epCalls=0;
function makeEpFetch(fetchJson){
  return async function epGet(pathname,params){
    if(!EP_KEY)throw new Error('no EP_API_KEY');
    if(epCalls>=MAX_EP_CALLS)throw new Error('EP call budget ('+MAX_EP_CALLS+') exhausted');
    epCalls++;
    const q=new URLSearchParams({...(params||{}),apiKey:EP_KEY}).toString();
    const out=await fetchJson(EP_BASE+pathname+'?'+q,{'X-Api-Key':EP_KEY,'Authorization':'Bearer '+EP_KEY});
    await sleep(+(process.env.EP_SLEEP_MS||6500)); // free tier: 10 req/min
    return out;
  };
}

/* ---------------- HockeyTech side ---------------- */
async function htGet(fetchJson,key,params){
  const q=new URLSearchParams({key,client_code:'sphl',fmt:'json',lang:'en',...params}).toString();
  return fetchJson(HT_BASE+'?'+q);
}
async function htKeyWorks(fetchJson,k){
  try{
    const d=await htGet(fetchJson,k,{feed:'modulekit',view:'seasons'});
    return !!(d&&d.SiteKit&&Array.isArray(d.SiteKit.Seasons)&&d.SiteKit.Seasons.length);
  }catch(e){return false;}
}
/* When no known key answers, find the real one:
   1) the Wayback Machine's URL index — archived lscluster feed calls for
      client_code=sphl carry the key right in the URL;
   2) the league's own public pages. */
async function fetchText(u,ms){
  const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),ms||25000);
  try{
    const res=await fetch(u,{signal:ctl.signal,headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36','Accept':'*/*'}});
    if(!res.ok)throw new Error('HTTP '+res.status);
    return await res.text();
  }finally{clearTimeout(t);}
}
const HT_SCRAPE_PAGES=['https://www.thesphl.com/stats','https://www.thesphl.com/','https://www.thesphl.com/standings','https://www.thesphl.com/schedule'];
async function htScrapeKeys(){
  const found=new Set();
  const harvest=t=>{
    t=String(t);
    (t.match(/key=([0-9a-f]{16})/gi)||[]).forEach(m=>found.add(m.slice(4).toLowerCase()));
    if(/hockeytech|lscluster|leaguestat/i.test(t))
      (t.match(/["']([0-9a-f]{16})["']/g)||[]).forEach(m=>found.add(m.replace(/["']/g,'').toLowerCase()));
  };
  const scriptSrcs=(html,base)=>(html.match(/<script[^>]+src=["']([^"']+)["']/gi)||[])
    .map(s=>(s.match(/src=["']([^"']+)["']/i)||[])[1]).filter(Boolean)
    .filter(s=>/hockeytech|leaguestat|league|stats|main|app|bundle|site/i.test(s)).slice(0,3)
    .map(s=>{try{if(s.startsWith('//'))return 'https:'+s;if(!/^https?:/i.test(s))return new URL(s,base).href;return s;}catch(e){return null;}}).filter(Boolean);
  // 1) live league pages (often Cloudflare-blocked for bots, but cheap to try)
  for(const u of HT_SCRAPE_PAGES){
    try{harvest(await fetchText(u,10000));}catch(e){}
    if(found.size)break;
  }
  // 2) archived copies via the Wayback Machine — no Cloudflare, original bytes (id_ suffix)
  if(!found.size){
    outer:
    for(const ts of ['2026','2025','2024']){
      for(const u of HT_SCRAPE_PAGES){
        let html='';
        try{html=await fetchText('https://web.archive.org/web/'+ts+'id_/'+u,20000);}catch(e){continue;}
        harvest(html);
        if(!found.size){
          for(const s of scriptSrcs(html,u)){
            try{harvest(await fetchText('https://web.archive.org/web/'+ts+'id_/'+s,20000));}catch(e){}
            if(found.size)break;
          }
        }
        if(found.size){console.log('Found candidate key(s) in the '+ts+' web archive of '+u);break outer;}
      }
    }
  }
  // 3) last resort: the (slow) Wayback URL index of archived SPHL feed calls
  if(!found.size){
    try{
      harvest(await fetchText('https://web.archive.org/cdx/search/cdx?url=lscluster.hockeytech.com%2Ffeed%2F*&filter=original:.*client_code%3Dsphl.*&filter=original:.*key%3D.*&fl=original&collapse=urlkey&limit=300',55000));
    }catch(e){console.warn('Wayback index lookup failed: '+e.message);}
  }
  HT_CANDIDATE_KEYS.forEach(k=>found.delete(k));
  return [...found].slice(0,20);
}
async function htDetectKey(fetchJson){
  if(process.env.HT_KEY)return process.env.HT_KEY;
  for(const k of HT_CANDIDATE_KEYS)if(await htKeyWorks(fetchJson,k))return k;
  console.log('No known HockeyTech key answered — searching thesphl.com for the real one…');
  for(const k of await htScrapeKeys()){
    if(await htKeyWorks(fetchJson,k)){console.log('Found working feed key on the league site.');return k;}
  }
  throw new Error('No HockeyTech key worked — set HT_KEY env/repo variable');
}
export function pickSeason(seasons){
  const sorted=[...seasons].sort((a,b)=>(+b.season_id)-(+a.season_id));
  return sorted.find(s=>/regular/i.test(s.season_name||''))||sorted[0];
}
async function htAllPlayers(fetchJson){
  const key=await htDetectKey(fetchJson);
  const sd=await htGet(fetchJson,key,{feed:'modulekit',view:'seasons'});
  const seasons=(sd.SiteKit&&sd.SiteKit.Seasons)||[];
  if(!seasons.length)throw new Error('no seasons from HockeyTech');
  const sorted=[...seasons].sort((a,b)=>(+b.season_id)-(+a.season_id));
  const regs=sorted.filter(s=>/regular/i.test(s.season_name||''));
  // offseason: the new season exists but rosters are empty — fall back to the
  // previous season so the EP mapping gets prebuilt before puck drop
  for(const season of (regs.length?regs:sorted).slice(0,2)){
    const players=await htSeasonPlayers(fetchJson,key,season);
    if(players.length)return {players,season};
    console.log('No rosters published for '+season.season_name+' yet — trying the previous season…');
  }
  return {players:[],season:(regs[0]||sorted[0])};
}
async function htSeasonPlayers(fetchJson,key,season){
  const td=await htGet(fetchJson,key,{feed:'modulekit',view:'teamsbyseason',season_id:season.season_id});
  const teams=(td.SiteKit&&td.SiteKit.Teamsbyseason)||[];
  const players=[];
  for(const t of teams){
    const tid=String(pick(t,['id','team_id'],''));
    const tname=String(pick(t,['name','team_name'],'')).trim();
    if(!tid)continue;
    let rows=[];
    try{
      const rd=await htGet(fetchJson,key,{feed:'modulekit',view:'roster',season_id:season.season_id,team_id:tid});
      rows=(rd.SiteKit&&rd.SiteKit.Roster)||[];
    }catch(e){console.warn('roster failed for',tname,e.message);continue;}
    for(const r of rows){
      let name=String(pick(r,['name','player_name'],'')).trim();
      if(!name)name=(String(pick(r,['first_name'],''))+' '+String(pick(r,['last_name'],''))).trim();
      const pos=String(pick(r,['position','pos'],'')).toUpperCase().trim();
      const htId=String(pick(r,['player_id','id'],'')).trim();
      if(!name||!htId||!/^(F|C|LW|RW|W|D|G)$/.test(pos))continue;
      players.push({htId,name,team:tname,pos,
        dob:isoDob(pick(r,['birthdate','date_of_birth','dob'],'')),
        height:String(pick(r,['height_hyphenated','height','ht'],'')).trim(),
        nationality:String(pick(r,['nationality','country'],'')).trim()});
    }
  }
  return players;
}

/* ---------------- EP side ---------------- */
function epCandidatesFrom(resp){
  const out=[],seen=new Set();
  (function walk(o){
    if(!o||typeof o!=='object')return;
    if(Array.isArray(o)){o.forEach(walk);return;}
    const id=o.id!=null?o.id:o.playerId;
    let nm=o.name||o.fullName||o.fullname;
    if(!nm&&(o.firstName||o.lastName))nm=((o.firstName||'')+' '+(o.lastName||'')).trim();
    if(id!=null&&/^\d+$/.test(String(id))&&nm){
      const key=String(id);
      if(!seen.has(key)){seen.add(key);out.push({
        epId:key,name:String(nm).trim(),
        dob:isoDob(pick(o,['dateOfBirth','birthDate','dob','birthdate'],'')),
        pos:String(pick(o,['position','playerPosition'],'')),
        height:String(pick(o,['height','imperialHeight'],(o.height&&o.height.imperial)||'')),
        nationality:String(pick(o,['nationality','country'],(o.nationality&&o.nationality.name)||'')),
        slug:String(pick(o,['slug'],''))});}
    }
    Object.values(o).forEach(walk);
  })(resp);
  return out;
}
async function epSearch(epGet,name){
  const tries=[['/players',{q:name,limit:'12'}],['/search/players',{q:name}],['/players',{name}]];
  for(const [p,params] of tries){
    try{
      const cands=epCandidatesFrom(await epGet(p,params));
      if(cands.length)return cands;
    }catch(e){if(/budget/.test(e.message))throw e;}
  }
  return [];
}
export function matchPlayer(htP,cands){
  const key=normName(htP.name);
  const named=cands.filter(c=>normName(c.name)===key);
  if(!named.length)return {status:'unmatched',candidates:cands.slice(0,5)};
  // auto-accept: exact name + exact DOB
  if(htP.dob){
    const dobHit=named.filter(c=>c.dob&&c.dob===htP.dob);
    if(dobHit.length===1)return {status:'matched',ep:dobHit[0],method:'name+dob'};
    if(dobHit.length>1)return {status:'unmatched',candidates:dobHit.slice(0,5)};
    // DOB known on HT side but disagrees on every EP candidate → don't guess
    if(named.every(c=>c.dob))return {status:'unmatched',candidates:named.slice(0,5)};
  }
  // tie-break when DOB is missing on one side: position, then height
  let pool=named.filter(c=>!htP.dob||!c.dob);
  if(!pool.length)pool=named;
  const pc=posClass(htP.pos);
  if(pc){const byPos=pool.filter(c=>!posClass(c.pos)||posClass(c.pos)===pc);if(byPos.length)pool=byPos;}
  const hIn=heightInches(htP.height);
  if(hIn!=null){
    const byH=pool.filter(c=>{const ch=heightInches(c.height);return ch==null||Math.abs(ch-hIn)<=1;});
    if(byH.length)pool=byH;
  }
  if(pool.length===1)return {status:'matched',ep:pool[0],method:'name+tiebreak'};
  return {status:'unmatched',candidates:pool.slice(0,5)};
}
function epUrlFor(epId,slug){return 'https://www.eliteprospects.com/player/'+epId+(slug?'/'+slug:'');}
export function careerFromStats(resp){
  const seasons=[],seen=new Set();
  const rd=(st,keys)=>{for(const k of keys){if(st&&st[k]!=null&&st[k]!==''){const v=+String(st[k]).replace(',','.');if(!isNaN(v))return v;}}return null;};
  const nameOf=(v,fields)=>{for(const f of fields){if(v&&typeof v==='object'&&v[f])return String(v[f]);}return typeof v==='string'?v:'';};
  (function walk(o){
    if(!o||typeof o!=='object')return;
    if(Array.isArray(o)){o.forEach(walk);return;}
    const ym=String(nameOf(o.season,['slug','name'])||o.seasonSlug||'').match(/(\d{4})\s*-\s*(\d{2,4})/);
    const team=nameOf(o.team,['name','fullName'])||(typeof o.teamName==='string'?o.teamName:'');
    const league=nameOf(o.league,['name','shortName','slug'])||(typeof o.leagueName==='string'?o.leagueName:'');
    if(ym&&team){
      const year=ym[1]+'-'+ym[2].slice(-2);
      for(const st of [o.regularStats,o.stats,o]){
        const gp=rd(st,['GP','gp','gamesPlayed']);
        if(gp==null)continue;
        const row={year,team,league,stats:{gp,
          g:rd(st,['G','g','goals']),a:rd(st,['A','a','assists']),p:rd(st,['TP','PTS','tp','pts','points']),
          gaa:rd(st,['GAA','gaa','goalsAgainstAverage']),svp:rd(st,['SVP','svp','savePercentage'])}};
        const k=year+'|'+normName(team)+'|'+normName(league)+'|'+gp;
        if(!seen.has(k)){seen.add(k);seasons.push(row);}
        break;
      }
    }
    Object.values(o).forEach(walk);
  })(resp);
  seasons.sort((a,b)=>a.year<b.year?-1:(a.year>b.year?1:0));
  return seasons;
}
/* Bio bullets — same voice as the hub's in-app generator. */
export function buildBullets(seasons,isGoalie,currentTeam){
  const b=[];
  const S=(seasons||[]).filter(s=>s.team&&s.year);
  if(!S.length)return b;
  const college=S.find(s=>/NCAA|USPORTS|ACHA/i.test(s.league));
  if(college)b.push('Played college hockey at '+college.team+(college.league?' ('+college.league+')':''));
  else{
    const jr=S.find(s=>/USHL|NAHL|BCHL|OHL\b|WHL|QMJHL|OJHL|AJHL|NCDC|GOJHL|SJHL|MJHL/i.test(s.league));
    if(jr)b.push('Junior hockey with '+jr.team+(jr.league?' ('+jr.league+')':''));
  }
  const proRe=/SPHL|ECHL|\bAHL\b|\bNHL\b|FPHL|LNAH|\bKHL\b|Liiga|\bDEL\b|ICEHL|EIHL|Extraliga|Slovakia|Czechia|\bSHL\b|Allsv/i;
  const pro=S.filter(s=>proRe.test(s.league)&&s.stats&&s.stats.gp);
  if(pro.length&&!isGoalie){
    const gp=pro.reduce((t,s)=>t+(s.stats.gp||0),0);
    const pts=pro.reduce((t,s)=>t+(s.stats.p||0),0);
    const lgs=Array.from(new Set(pro.map(s=>s.league.trim()))).slice(0,4);
    if(gp>=25)b.push(pts+' points in '+gp+' career pro games ('+lgs.join(', ')+')');
  }
  const notCur=S.filter(s=>!currentTeam||normName(s.team)!==normName(currentTeam));
  const prior=notCur[notCur.length-1];
  if(prior&&(!college||prior.team!==college.team))b.push('Most recently with '+prior.team+(prior.league?' ('+prior.league+')':'')+' in '+prior.year);
  if(isGoalie){
    const val=v=>v>2?v/100:v;
    const bg=S.filter(s=>s.stats&&s.stats.svp!=null&&s.stats.gp>=5).sort((x,y)=>val(y.stats.svp)-val(x.stats.svp))[0];
    if(bg){
      const svp=val(bg.stats.svp).toFixed(3).replace(/^0/,'');
      b.push('Best season: '+svp+' SV%'+(bg.stats.gaa!=null?', '+bg.stats.gaa.toFixed(2)+' GAA':'')+' in '+bg.stats.gp+' GP with '+bg.team+' ('+bg.year+')');
    }
  }else{
    const best=S.filter(s=>s.stats&&s.stats.p>0).sort((x,y)=>y.stats.p-x.stats.p)[0];
    if(best)b.push('Best season: '+(best.stats.g!=null?best.stats.g+'G-'+best.stats.a+'A-':'')+best.stats.p+'P in '+best.stats.gp+' GP with '+best.team+' ('+best.year+')');
  }
  return b.slice(0,4);
}

/* ---------------- main ---------------- */
export async function main(deps){
  const fetchJson=(deps&&deps.fetchJson)||defaultFetchJson;
  const epGet=makeEpFetch(fetchJson);
  const now=new Date().toISOString();

  const {players,season}=await htAllPlayers(fetchJson);
  console.log('HockeyTech: '+players.length+' players across season '+season.season_id+' ('+season.season_name+')');

  const map=readJson(MAP_FILE,{matched:{},unmatched:{}});
  map.matched=map.matched||{};map.unmatched=map.unmatched||{};
  const overrides=readJson(OVERRIDES_FILE,{});
  const out=readJson(OUT_FILE,{});

  let fromCache=0,newlyMatched=0,overridden=0,unmatched=0,statsFetched=0,skippedNoKey=0;

  for(const p of players){
    // overrides always win
    if(overrides[p.htId]){
      if(!map.matched[p.htId]||String(map.matched[p.htId].epId)!==String(overrides[p.htId])){
        map.matched[p.htId]={epId:String(overrides[p.htId]),epName:p.name,method:'override',at:now};
        overridden++;
      }else fromCache++;
      continue;
    }
    if(map.matched[p.htId]){fromCache++;continue;}
    if(!EP_KEY){skippedNoKey++;continue;} // Plan B: no API calls at all
    // don't re-search known-unmatched players every run — retry ~monthly
    // (or immediately once they get an entry in ep-overrides.json)
    const un=map.unmatched[p.htId];
    if(un&&un.at&&Date.now()-Date.parse(un.at)<20*86400000){unmatched++;continue;}
    try{
      const cands=await epSearch(epGet,p.name);
      const m=matchPlayer(p,cands);
      if(m.status==='matched'){
        map.matched[p.htId]={epId:m.ep.epId,epName:m.ep.name,slug:m.ep.slug||'',method:m.method,at:now};
        delete map.unmatched[p.htId];
        newlyMatched++;
      }else{
        map.unmatched[p.htId]={name:p.name,team:p.team,dob:p.dob,candidates:m.candidates,at:now};
        unmatched++;
      }
    }catch(e){
      if(/budget/.test(e.message)){console.warn(e.message+' — stopping search phase');break;}
      console.warn('search failed for '+p.name+': '+e.message);
    }
  }

  // fetch/refresh career stats for mapped players
  for(const p of players){
    const m=map.matched[p.htId];
    if(!m)continue;
    const existing=out[p.htId];
    const fresh=existing&&existing.fetchedAt&&(Date.now()-Date.parse(existing.fetchedAt))<STATS_MAX_AGE_DAYS*86400000;
    if(!EP_KEY||fresh){
      out[p.htId]={...(existing||{}),epId:m.epId,epUrl:epUrlFor(m.epId,m.slug),name:p.name,team:p.team};
      continue;
    }
    try{
      let resp=null;
      for(const sp of ['/players/'+m.epId+'/stats','/players/'+m.epId+'/career-stats','/players/'+m.epId]){
        try{resp=await epGet(sp,{limit:'200'});if(resp)break;}catch(e){if(/budget/.test(e.message))throw e;}
      }
      const careerStats=resp?careerFromStats(resp):(existing&&existing.careerStats)||[];
      out[p.htId]={
        epId:m.epId,epUrl:epUrlFor(m.epId,m.slug),name:p.name,team:p.team,
        dob:p.dob||(existing&&existing.dob)||'',
        hometown:(existing&&existing.hometown)||'',
        careerStats,
        bullets:buildBullets(careerStats,p.pos==='G',p.team),
        fetchedAt:now
      };
      statsFetched++;
    }catch(e){
      if(/budget/.test(e.message)){console.warn(e.message+' — stopping stats phase');break;}
      console.warn('stats failed for '+p.name+': '+e.message);
      out[p.htId]=out[p.htId]||{epId:m.epId,epUrl:epUrlFor(m.epId,m.slug),name:p.name,team:p.team};
    }
  }

  // nothing needed EP this run? still validate the key with one test call
  if(EP_KEY&&epCalls===0){
    try{
      const n=epCandidatesFrom(await epGet('/players',{q:'Wilson',limit:'5'})).length;
      console.log('EP API key OK — test search returned '+n+' candidate(s).');
    }catch(e){console.warn('EP API key test call failed: '+e.message+' — check the key / auth style');}
  }

  map.updatedAt=now;
  writeJson(MAP_FILE,map);
  writeJson(OUT_FILE,out);

  const unmatchedList=Object.values(map.unmatched).map(u=>u.name+' ('+u.team+')');
  console.log('Summary: '+newlyMatched+' newly matched, '+fromCache+' from cache, '+overridden+' by override, '
    +unmatched+' unmatched'+(skippedNoKey?', '+skippedNoKey+' skipped (no EP_API_KEY — Plan B links only)':'')
    +', '+statsFetched+' stats pulls, '+epCalls+' EP API calls');
  if(unmatchedList.length)console.log('Unmatched players:\n  '+unmatchedList.join('\n  '));
  const totalMapped=Object.keys(map.matched).length;
  console.log('Coverage: '+totalMapped+'/'+players.length+' current players mapped');
  return {players:players.length,mapped:totalMapped,newlyMatched,fromCache,unmatched,epCalls};
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
  main().catch(e=>{console.error(e);process.exit(1);});
}
