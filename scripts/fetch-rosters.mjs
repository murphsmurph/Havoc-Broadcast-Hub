// Fetch every SPHL team's roster from the HockeyTech feed and write
// data/sphl-rosters.json. Run nightly by .github/workflows/sphl-daily.yml
// (cleanup Phase 2): the site and the bio pages load rosters from this
// committed file first; the in-browser live sync is an overlay on top.
//
// FAIL SOFT, ALWAYS: any failure — key dead, feed empty, roster counts
// collapsing — leaves the last good file in place and exits 0 with the
// reason logged. An empty roster file must never replace a good one.
//
// Key: HT_KEY env → the league site's public key → auto-detected from the
// SPHL website's own page source (the same key the site's sync uses).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=process.env.HAVOC_ROSTERS_FILE||path.join(ROOT,'data','sphl-rosters.json');
const BASE='https://lscluster.hockeytech.com/feed/';
const UA={'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36','Accept':'*/*'};

function softExit(reason){
  console.log('SOFT-FAIL: '+reason+' — keeping the previous data/sphl-rosters.json.');
  process.exit(0);
}

async function jget(qs,key){
  const r=await fetch(BASE+'?'+qs+'&key='+key+'&client_code=sphl',{headers:UA});
  if(!r.ok)throw new Error('HTTP '+r.status);
  let t=(await r.text()).trim();
  if(t.startsWith('('))t=t.replace(/^\(/,'').replace(/\)$/,'');
  return JSON.parse(t);
}
// the feed answers flaky under load — a list call gets three tries
async function jgetRetry(qs,key,check){
  let last=null;
  for(let i=0;i<3;i++){
    try{
      const j=await jget(qs,key);
      if(!check||check(j))return j;
      last=j;
    }catch(e){last=null;}
    await new Promise(r=>setTimeout(r,1500*(i+1)));
  }
  return last;
}

async function resolveKey(){
  const tryKey=async k=>{
    try{
      const j=await jget('feed=modulekit&view=seasons&fmt=json&lang=en',k);
      return (((j||{}).SiteKit||{}).Seasons||[]).length?k:null;
    }catch(e){return null;}
  };
  if(process.env.HT_KEY){const k=await tryKey(process.env.HT_KEY.trim());if(k)return k;console.log('HT_KEY env key did not answer — trying fallbacks');}
  const known=await tryKey('8fa10d218c49ec96');
  if(known)return known;
  // last resort: the league's own site ships the key in its page source
  try{
    const html=await (await fetch('https://www.thesphl.com/stats/',{headers:UA})).text();
    const m=html.match(/key=([0-9a-f]{8,32})&/);
    if(m){const k=await tryKey(m[1]);if(k){console.log('Auto-detected feed key from thesphl.com');return k;}}
  }catch(e){}
  return null;
}

// the site's season rule (mirrors seasonNorm/seasonDefault): newest REGULAR
// season by numeric id — never a playoff or career pseudo-season, never the
// current-flag
const yes=v=>/^(1|y|yes|true)$/i.test(String(v==null?'':v).trim());
function pickSeason(seasons){
  // the live feed sets career="1" on EVERY season (it means "counts toward
  // career stats") — a career pseudo-season is detected by NAME only
  const norm=seasons.map(s=>({
    id:String(s.season_id??s.id??'').trim(),
    name:String(s.season_name??s.name??'').trim(),
    both:(String(s.season_name??s.name??'')+' '+String(s.shortname??'')).trim(),
    playoff:yes(s&&s.playoff)}))
    .filter(s=>s.id);
  const reg=norm.filter(s=>!s.playoff&&!/playoff|career/i.test(s.both));
  reg.sort((a,b)=>(+b.id)-(+a.id));
  if(!reg.length)console.log('  seasons seen (first 5): '+JSON.stringify(seasons.slice(0,5)));
  return reg.map(s=>({season_id:s.id,season_name:s.name}));
}

// only what the site's htRosterRow reader needs — keeps the file small
const KEEP=['name','player_name','first_name','last_name','position','pos','birthdate','date_of_birth','dob',
  'homeplace','hometown','birthplace','rookie','veteran_status','player_id','id','tp_jersey_number','jersey_number','num',
  'height_hyphenated','height','ht','weight','wt','shoots','catches','sh','draft_status','phonetic_name','player_image'];
const trim=r=>{const o={};KEEP.forEach(k=>{if(r[k]!=null&&String(r[k]).trim()!=='')o[k]=r[k];});return o;};
const isPlayer=r=>/^(F|C|LW|RW|W|D|G)$/i.test(String(r.position||r.pos||'').trim());

async function main(){
  const key=await resolveKey();
  if(!key)softExit('no working feed key (env, known and auto-detect all failed)');
  const sj=await jgetRetry('feed=modulekit&view=seasons&fmt=json&lang=en',key,j=>((j||{}).SiteKit||{}).Seasons?.length);
  const seasons=((sj||{}).SiteKit||{}).Seasons||[];
  const regular=pickSeason(seasons);
  if(!regular.length)softExit('seasons list empty or all playoff/career');

  // one full sweep of a season: every team's roster, players only
  async function sweep(sid,sname){
    console.log('Season: '+sid+' ('+sname+')');
    const tj=await jgetRetry('feed=modulekit&view=teamsbyseason&season_id='+sid+'&fmt=json&lang=en',key,j=>((j||{}).SiteKit||{}).Teamsbyseason?.length);
    const teams=((tj||{}).SiteKit||{}).Teamsbyseason||[];
    if(!teams.length){console.log('  teamsbyseason returned no teams');return null;}
    const out={seasonId:sid,seasonLabel:sname,teams:[],total:0};
    for(const t of teams){
      const tid=String(t.id||t.team_id||'').trim(),tname=String(t.name||t.team_name||'').trim();
      if(!tid||!tname)continue;
      let rows=[];
      const j=await jgetRetry('feed=modulekit&view=roster&season_id='+sid+'&team_id='+tid+'&fmt=json&lang=en',key,x=>((x||{}).SiteKit||{}).Roster?.length);
      if(j)rows=(((j||{}).SiteKit||{}).Roster||[]).filter(isPlayer).map(trim);
      else console.log('  ! '+tname+': roster fetch failed after retries — team kept with 0 players');
      out.teams.push({id:tid,name:tname,city:String(t.city||'').trim(),roster:rows});
      out.total+=rows.length;
      console.log('  '+tname+': '+rows.length+' players');
    }
    console.log('Total players: '+out.total+' across '+out.teams.length+' teams');
    return out;
  }

  // newest regular season first; before the league publishes its player
  // rosters (preseason: the feed answers with staff-only rows), fall back to
  // the previous regular season — labelled, exactly like the site's season
  // fallback — so vitals and headshots for returning players flow now and
  // the sweep flips to the new season by itself once it is published
  let sweepRes=await sweep(String(regular[0].season_id),String(regular[0].season_name||''));
  let note='';
  if(sweepRes&&sweepRes.total===0&&regular[1]){
    note=String(regular[0].season_name||'')+' rosters not yet published — previous regular season used';
    console.log('FALLBACK: '+note);
    sweepRes=await sweep(String(regular[1].season_id),String(regular[1].season_name||''));
  }
  if(!sweepRes)softExit('no teams returned for any regular season');
  const total=sweepRes.total;
  const out={fetchedAt:new Date().toISOString(),seasonId:sweepRes.seasonId,seasonLabel:sweepRes.seasonLabel,
    ...(note?{note}:{}),source:'lscluster modulekit roster, per team',teams:sweepRes.teams};
  // never let a thin fetch replace a good file
  let prev=null;
  try{prev=JSON.parse(fs.readFileSync(OUT,'utf8'));}catch(e){}
  const prevTotal=prev?prev.teams.reduce((n,t)=>n+(t.roster||[]).length,0):0;
  if(total===0)softExit('zero players fetched');
  if(prev&&total<prevTotal*0.5)softExit('fetched '+total+' players but the last good file has '+prevTotal+' — refusing to shrink by more than half');
  fs.writeFileSync(OUT,JSON.stringify(out,null,1)+'\n');
  console.log('Wrote data/sphl-rosters.json ('+out.seasonLabel+(note?' — FALLBACK':'')+')');
}

main().catch(e=>softExit('unexpected error: '+e.message));
