// Validate SPHL HockeyTech feed endpoints with the working key, from a
// network that can reach lscluster (GitHub runners). Prints one line per
// endpoint: HTTP status, CORS header (as seen with a GitHub Pages Origin),
// a seasons-trap flag, and a shape summary. Run by .github/workflows/ht-probe.yml.
const KEY=process.env.HT_KEY||'8fa10d218c49ec96';
const BASE='https://lscluster.hockeytech.com/feed/';
const ORIGIN='https://murphsmurph.github.io';

function shape(j){
  if(Array.isArray(j))return 'array['+j.length+'] first-keys:'+Object.keys(j[0]||{}).slice(0,8).join(',');
  if(j&&typeof j==='object'){
    const k=Object.keys(j);
    let inner='';
    if(j.SiteKit)inner=' SiteKit:'+Object.keys(j.SiteKit).join(',');
    return 'object keys:'+k.slice(0,6).join(',')+inner;
  }
  return typeof j;
}
function deepCount(j,pred){
  let n=0;
  const walk=v=>{
    if(Array.isArray(v)){v.forEach(walk);return;}
    if(v&&typeof v==='object'){if(pred(v)){n++;return;}Object.values(v).forEach(walk);}
  };
  walk(j);return n;
}
async function probe(label,qs,expect,opts){
  opts=opts||{};
  const base=opts.base||BASE;
  const url=base+'?'+qs+'&key='+KEY+'&client_code=sphl'+(opts.extra||'');
  const headers={'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36','Accept':'*/*'};
  if(!opts.noOrigin)headers['Origin']=ORIGIN;
  if(opts.referer)headers['Referer']=opts.referer;
  try{
    const r=await fetch(url,{headers});
    let t=(await r.text()).trim();
    const cors=r.headers.get('access-control-allow-origin')||'none';
    const paren=t.startsWith('(');
    if(paren)t=t.replace(/^\(/,'').replace(/\)$/,'');
    let j=null;try{j=JSON.parse(t);}catch(e){console.log(label.padEnd(20),'HTTP',r.status,'cors:'+cors,'NOT-JSON:',t.slice(0,100));return;}
    const trap=!!(j&&j.SiteKit&&Array.isArray(j.SiteKit.Seasons))&&!label.includes('seasons');
    const found=expect?expect(j):'-';
    console.log(label.padEnd(20),'HTTP',r.status,'cors:'+cors,paren?'paren-wrapped':'bare',trap?'SEASONS-TRAP':'ok','|',found,'|',shape(j).slice(0,160));
  }catch(e){console.log(label.padEnd(20),'FETCH-ERR',e.message.slice(0,120));}
}

const teamLike=v=>(('name'in v)||('team_name'in v))&&(('points'in v)||('pts'in v));
const playerLike=v=>(('name'in v)||('player_id'in v)||('lastName'in v))&&(('points'in v)||('goals'in v)||('gaa'in v));
const gameLike=v=>(('home_goal_count'in v)||('HomeGoals'in v)||('home_team'in v)||('HomeCity'in v));

// ---- transport diagnosis: find which request shape gets a body ----
const SK='feed=statviewfeed&view=players&season=44&team=all&position=skaters&statsType=standard&first=0&limit=2&sort=points&lang=en&division=-1&conference=-1';
await probe('diag-plain',SK,null,{noOrigin:true});
await probe('diag-origin',SK,null,{});
await probe('diag-indexphp',SK,null,{noOrigin:true,base:'https://lscluster.hockeytech.com/feed/index.php'});
await probe('diag-fmtjson',SK+'&fmt=json',null,{noOrigin:true});
await probe('diag-callback',SK+'&callback=x',null,{noOrigin:true});
await probe('diag-referer',SK,null,{noOrigin:true,referer:'https://www.thesphl.com/'});

await probe('seasons','feed=modulekit&view=seasons&fmt=json&lang=en',j=>'seasons:'+(((j.SiteKit||{}).Seasons)||[]).length,{noOrigin:true});
await probe('skaters-s44','feed=statviewfeed&view=players&season=44&team=all&position=skaters&statsType=standard&first=0&limit=5&sort=points&lang=en&division=-1&conference=-1',j=>'players:'+deepCount(j,playerLike),{noOrigin:true});
await probe('skaters-s46','feed=statviewfeed&view=players&season=46&team=all&position=skaters&statsType=standard&first=0&limit=5&sort=points&lang=en&division=-1&conference=-1',j=>'players:'+deepCount(j,playerLike),{noOrigin:true});
await probe('goalies-s44','feed=statviewfeed&view=players&season=44&team=all&position=goalies&statsType=standard&first=0&limit=5&sort=gaa&lang=en&division=-1&conference=-1',j=>'players:'+deepCount(j,playerLike),{noOrigin:true});
await probe('teams-s44','feed=statviewfeed&view=teams&season=44&groupTeamsBy=division&context=overall&special=false&sort=points&lang=en',j=>'teams:'+deepCount(j,teamLike),{noOrigin:true});
await probe('teams-s46','feed=statviewfeed&view=teams&season=46&groupTeamsBy=division&context=overall&special=false&sort=points&lang=en',j=>'teams:'+deepCount(j,teamLike),{noOrigin:true});
await probe('standings-mk-s44','feed=modulekit&view=statviewtype&stat=conference&type=standings&season_id=44&fmt=json&lang=en',j=>'teams:'+deepCount(j,teamLike),{noOrigin:true});
await probe('scorebar','feed=modulekit&view=scorebar&numberofdaysahead=7&numberofdaysback=3&fmt=json&lang=en',j=>'games:'+deepCount(j,gameLike),{noOrigin:true});
await probe('schedule-mk-s46','feed=modulekit&view=schedule&season_id=46&fmt=json&lang=en',j=>'games:'+deepCount(j,gameLike),{noOrigin:true});
await probe('roster-mk-s46','feed=modulekit&view=roster&season_id=46&team_id=3&fmt=json&lang=en',j=>'players:'+deepCount(j,v=>('last_name'in v)||('lastName'in v)),{noOrigin:true});
await probe('player-profile-2761','feed=statviewfeed&view=player&player_id=2761&season_id=46&site_id=2&league_id=&lang=en',j=>{
  let rows=0,img='';
  const walk=v=>{if(Array.isArray(v)){v.forEach(walk);return;}
    if(v&&typeof v==='object'){
      if((v.season_name||v.seasonName||v.shortname)&&(v.games_played!=null||v.gp!=null))rows++;
      Object.entries(v).forEach(([k,x])=>{if(typeof x==='string'&&!img&&/\.(jpe?g|png)/i.test(x))img=x.slice(0,60);walk(x);});
    }};
  walk(j);
  return 'seasonRows:'+rows+' img:'+(img||'none');
},{noOrigin:true});
// headshot CDN: find largest size + CORS readability for player 2761
for(const size of ['60x60','120x160','240x240','320x240','480x480']){
  try{
    const r=await fetch('https://assets.leaguestat.com/sphl/'+size+'/2761.jpg',{headers:{'User-Agent':'Mozilla/5.0'}});
    console.log('headshot-'+size,'HTTP',r.status,'type:'+(r.headers.get('content-type')||'?'),'bytes:'+(r.headers.get('content-length')||'?'),'acao:'+(r.headers.get('access-control-allow-origin')||'none'));
  }catch(e){console.log('headshot-'+size,'ERR',e.message.slice(0,80));}
}

// ---- 2026-27 Havoc roster check (season 46) ----
// Does the league feed have the Havoc roster yet, and what does it say about
// jersey numbers vs the team's own signed-players sheet?
const SHEET=[['4','Davis Goukler'],['8','Kevin Weaver-Vitale'],['12','Gio Procopio'],['72','Alex Proctor'],
  ['91','Connor Fries'],['15','Dawson Sciarrino'],['93','Troy Williams'],['18','Austin Alger'],
  ['86','Landry Schmuck'],['3','Ben Schultheis'],['63','Craig McCabe'],['20','Cade Helmer'],
  ['11','Michael Hodge'],['','Kadin Ilot'],['43','Terry Ryder']];
const nrm=s=>String(s||'').toLowerCase().replace(/[^a-z]/g,'');
async function jget(qs){
  const r=await fetch(BASE+'?'+qs+'&key='+KEY+'&client_code=sphl',{headers:{'User-Agent':'Mozilla/5.0'}});
  let t=(await r.text()).trim();
  if(t.startsWith('('))t=t.replace(/^\(/,'').replace(/\)$/,'');
  try{return JSON.parse(t);}catch(e){return null;}
}
for(const season of ['46','44']){
  const tb=await jget('feed=modulekit&view=teamsbyseason&season_id='+season+'&fmt=json&lang=en');
  const teams=(tb&&tb.SiteKit&&tb.SiteKit.Teamsbyseason)||[];
  console.log('season '+season+' teams:',teams.length,teams.map(t=>(t.name||t.team_name)+'#'+(t.id||t.team_id)).join(', ').slice(0,300));
  const hsv=teams.find(t=>/huntsville/i.test(t.name||t.team_name||''));
  if(!hsv){console.log('season '+season+': no Huntsville team row');continue;}
  const rr=await jget('feed=modulekit&view=roster&season_id='+season+'&team_id='+(hsv.id||hsv.team_id)+'&fmt=json&lang=en');
  const rows=(rr&&rr.SiteKit&&rr.SiteKit.Roster)||[];
  const players=rows.map(r=>({
    name:(r.name||((r.first_name||'')+' '+(r.last_name||''))).trim(),
    num:r.tp_jersey_number||r.jersey_number||'',pos:(r.position||r.pos||'').toUpperCase(),
    id:r.player_id||r.id||'',ht:r.height_hyphenated||r.height||'',wt:r.weight||'',
    dob:r.birthdate||r.date_of_birth||'',home:r.hometown||r.birthplace||'',img:r.player_image||r.image||''
  })).filter(p=>p.name&&/^(F|C|LW|RW|W|D|G)$/.test(p.pos));
  console.log('season '+season+' HUNTSVILLE roster rows:',rows.length,'players:',players.length);
  players.forEach(p=>console.log('   #'+String(p.num).padStart(2)+' '+p.name.padEnd(24)+p.pos.padEnd(3)+' id='+p.id+' '+p.ht+' '+p.wt+' dob='+p.dob+' home='+(p.home||'-')+' img='+(p.img?'yes':'no')));
  if(season==='46'){
    const byName=new Map(players.map(p=>[nrm(p.name),p]));
    console.log('--- reconcile vs the signed sheet ---');
    SHEET.forEach(([num,name])=>{
      const f=byName.get(nrm(name));
      if(!f)console.log('   NOT IN FEED   '+name+' (sheet #'+(num||'--')+')');
      else if(String(f.num)!==String(num))console.log('   NUMBER CONFLICT '+name+': sheet #'+(num||'--')+' vs feed #'+(f.num||'--')+' id='+f.id);
      else console.log('   match         '+name+' #'+num+' id='+f.id);
    });
    const sheetNames=new Set(SHEET.map(s=>nrm(s[1])));
    players.filter(p=>!sheetNames.has(nrm(p.name))).forEach(p=>console.log('   IN FEED ONLY  #'+p.num+' '+p.name+' ('+p.pos+') id='+p.id));
  }
}
