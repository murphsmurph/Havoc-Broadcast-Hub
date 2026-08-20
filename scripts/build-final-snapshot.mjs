// One-shot generator for data/season2526_final.json — the committed 2025-26
// FINAL regular-season reference snapshot (bridge PR-F). Run from a GitHub
// runner (the feed hosts are egress-blocked from dev sandboxes):
//
//   node scripts/build-final-snapshot.mjs [seasonId]
//
// Reads ONLY the official SPHL/HockeyTech feed (the primary validator per
// the historical-stat validation experiment), season 44 = 2025-2026 Regular
// Season by default. Writes the file AND prints it between BEGIN/END
// markers so a branch Action's logs carry it out of the runner.
//
// Content is display-only reference data (like SPHL_REF): 12-team final
// standings, league scoring/goalie leaders, and the full skater/goalie
// tables for Huntsville and Pensacola. It is never joined into career math.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'data','season2526_final.json');
const BASE='https://lscluster.hockeytech.com/feed/';
const UA={'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36','Accept':'*/*'};
const SID=process.argv[2]||'44';

async function jget(qs,key){
  const r=await fetch(BASE+'?'+qs+'&key='+key+'&client_code=sphl',{headers:UA});
  if(!r.ok)throw new Error('HTTP '+r.status);
  let t=(await r.text()).trim();
  if(t.startsWith('('))t=t.replace(/^\(/,'').replace(/\)$/,'');
  return JSON.parse(t);
}
async function resolveKey(){
  const tryKey=async k=>{
    try{const j=await jget('feed=modulekit&view=seasons&fmt=json&lang=en',k);
      return (((j||{}).SiteKit||{}).Seasons||[]).length?k:null;}catch(e){return null;}
  };
  if(process.env.HT_KEY){const k=await tryKey(process.env.HT_KEY.trim());if(k)return k;}
  const known=await tryKey('8fa10d218c49ec96');
  if(known)return known;
  throw new Error('no working feed key');
}
const num=v=>{const n=parseFloat(v);return isFinite(n)?n:null;};

(async()=>{
  const key=await resolveKey();
  const seasons=(await jget('feed=modulekit&view=seasons&fmt=json&lang=en',key)).SiteKit.Seasons;
  const season=seasons.find(s=>String(s.season_id||s.id)===SID)||{};
  const label=(season.season_name||season.name||'2025-2026 Regular Season');

  // final standings — same shapes the app's htStandingsRows tries
  let stand=[];
  try{
    const j=await jget('feed=modulekit&view=statviewtype&type=standings&season_id='+SID+'&fmt=json&lang=en',key);
    stand=((j.SiteKit||{}).Statviewtype)||[];
  }catch(e){}
  if(!stand.length){
    try{
      const j=await jget('feed=statviewfeed&view=teams&groupTeamsBy=division&context=overall&season='+SID+'&special=false&fmt=json&lang=en',key);
      const secs=Array.isArray(j)?j:[j];
      secs.forEach(sec=>((sec||{}).sections||[sec]).forEach(s2=>(s2.data||[]).forEach(d=>stand.push(d.row||d))));
    }catch(e){}
  }
  const standings=stand.map(r=>({
    team:r.name||r.team_name||r.team||'',
    gp:num(r.games_played||r.gp),w:num(r.wins||r.w),l:num(r.losses||r.l),
    otl:num(r.ot_losses||r.otl),sol:num(r.shootout_losses||r.sol),
    pts:num(r.points||r.pts),gf:num(r.goals_for||r.gf),ga:num(r.goals_against||r.ga),
    pp_pct:r.power_play_pct!=null?String(r.power_play_pct):(r.pp_pct!=null?String(r.pp_pct):null),
    pk_pct:r.penalty_kill_pct!=null?String(r.penalty_kill_pct):(r.pk_pct!=null?String(r.pk_pct):null),
    shots_for:num(r.shots_for),pim:num(r.penalty_minutes||r.pim)
  })).filter(t=>t.team&&t.gp!=null);
  standings.sort((a,b)=>(b.pts||0)-(a.pts||0));
  standings.forEach((t,i)=>t.finish=i+1);

  // league-wide player tables (the modulekit path proven by the experiment)
  const sk=(await jget('feed=modulekit&view=statviewtype&type=topscorers&season_id='+SID+'&first=0&limit=500&fmt=json&lang=en',key)).SiteKit.Statviewtype||[];
  const gl=(await jget('feed=modulekit&view=statviewtype&type=topgoalies&season_id='+SID+'&first=0&limit=500&fmt=json&lang=en',key)).SiteKit.Statviewtype||[];
  const skRow=r=>({name:(r.name||((r.first_name||'')+' '+(r.last_name||''))).trim(),player_id:String(r.player_id||''),
    team:r.team_code||'',pos:r.position||'',gp:num(r.games_played),g:num(r.goals),a:num(r.assists),pts:num(r.points),
    pim:num(r.penalty_minutes),pm:num(r.plus_minus)});
  const glRow=r=>({name:(r.name||((r.first_name||'')+' '+(r.last_name||''))).trim(),player_id:String(r.player_id||''),
    team:r.team_code||'',gp:num(r.games_played),w:num(r.wins),l:num(r.losses),otl:num(r.ot_losses),sol:num(r.shootout_losses),
    so:num(r.shutouts),svs:num(r.saves),sa:num(r.shots),ga:num(r.goals_against),
    gaa:r.goals_against_average!=null?String(r.goals_against_average):null,
    svpct:r.save_percentage!=null?String(r.save_percentage):null});
  const skaters=sk.map(skRow),goalies=gl.map(glRow);
  const teamOf=code=>({skaters:skaters.filter(x=>x.team===code),goalies:goalies.filter(x=>x.team===code)});

  const out={
    _readme:'2025-26 FINAL regular-season reference snapshot from the official SPHL/HockeyTech feed (the primary validator). Display-only — never joined into career math. Regenerate: node scripts/build-final-snapshot.mjs on a GitHub runner.',
    season_id:SID,season_label:label,generated:new Date().toISOString(),
    source:'lscluster.hockeytech.com modulekit (official)',
    standings,
    leaders:{scoring:skaters.slice().sort((a,b)=>(b.pts||0)-(a.pts||0)).slice(0,10),
             goalies:goalies.filter(g=>(g.gp||0)>=15).sort((a,b)=>parseFloat(a.gaa||99)-parseFloat(b.gaa||99)).slice(0,5)},
    teams:{HSV:teamOf('HSV'),PEN:teamOf('PEN')}
  };
  fs.writeFileSync(OUT,JSON.stringify(out,null,1)+'\n');
  console.log('rows: standings='+standings.length+' skaters='+skaters.length+' goalies='+goalies.length);
  console.log('BEGIN-SNAPSHOT-JSON');
  console.log(JSON.stringify(out));
  console.log('END-SNAPSHOT-JSON');
})().catch(e=>{console.error('FAILED: '+e.message);process.exit(1);});
