/* Feeds — everything that talks to a source outside this browser, and the
   season resolution that governs it: the HockeyTech/LeagueStat JSONP transport,
   the explicit season picker and its labelled fallback, the P0A stale-season
   guard, the Elite Prospects lanes, and the keyless daily-report baseline.
   Extracted verbatim in the P3 split. */


/* ============================================================
   LIVE SPHL DATA — HockeyTech/LeagueStat feed (JSONP)
   ============================================================ */
const HT_BASE='https://lscluster.hockeytech.com/feed/index.php';
function htKey(){
  // tolerate a pasted URL fragment ("8fa10d218c49ec96&client_code=sphl" etc.) — keep the 16-hex token
  const raw=(DATA.settings.htKey||'').trim();
  const m=raw.match(/[0-9a-f]{16}/i);
  return m?m[0].toLowerCase():raw;
}
/* ============================================================
   SEASONS — one explicit choice, threaded through every call.
   Sync used to auto-detect a season and then keep whatever it had picked
   for good, which is how a run ended up pulling 2015 Playoffs. The season
   is now chosen, shown on screen at all times, and sanity-checked.
   ============================================================ */
const SEASON_STALE_MONTHS=18;
function seasonNorm(s){
  const yes=v=>/^(1|y|yes|true)$/i.test(String(v==null?'':v).trim());
  const name=String(pick(s,['season_name','name'],'')).trim();
  const short=String(pick(s,['shortname','short_name'],'')).trim();
  // the live feed sets career="1" on EVERY season (it means "counts toward
  // career stats", not "career pseudo-season") — so a career row is detected
  // by NAME, never by the flag. Playoffs keep the flag plus the name check.
  return {id:String(pick(s,['season_id','id'],'')).trim(),
    name,short,
    playoff:yes(s&&s.playoff)||/playoff/i.test(name),
    career:/career/i.test(name)||/career/i.test(short),
    start:String(pick(s,['start_date'],'')).slice(0,10),
    end:String(pick(s,['end_date'],'')).slice(0,10)};
}
function seasonList(){return ((DATA.seasons||{}).list)||[];}
function seasonsStore(raw){
  const list=(raw||[]).map(seasonNorm).filter(s=>s.id).sort((a,b)=>(+b.id)-(+a.id));
  if(list.length){DATA.seasons={at:new Date().toISOString(),list};save();}
  return list;
}
/* the default: the highest season_id that is neither a playoff nor a career
   season. Sorted numerically — never [0], never a "current" flag. */
function seasonDefault(list){
  return (list||seasonList()).filter(s=>!s.playoff&&!s.career)
    .sort((a,b)=>(+b.id)-(+a.id))[0]||null;
}
function seasonById(id){return seasonList().find(s=>s.id===String(id))||null;}
function activeSeasonId(){
  const saved=String((DATA.settings||{}).htSeason||'').trim();
  if(saved)return saved;
  const d=seasonDefault();
  return d?d.id:'46';                       // 46 = 2026-27, until the list loads
}
function activeSeason(){return seasonById(activeSeasonId());}
function seasonLabelOf(id){const s=seasonById(id);return s?(s.name||s.short||('season '+id)):('season '+id);}
function seasonShortOf(id){const s=seasonById(id);return s?(s.short||s.name||('season '+id)):('season '+id);}
/* a season that ended more than 18 months ago is not the one he means */
function seasonStale(s){
  s=s||activeSeason();
  if(!s||!s.end)return false;
  const end=Date.parse(s.end+'T00:00');
  if(!end)return false;
  return (Date.now()-end)>SEASON_STALE_MONTHS*30.44*86400000;
}
/* every feed call goes through this, so a wrong season stops the run instead
   of quietly filling the app with numbers from another decade */
function seasonGuard(){
  const s=activeSeason();
  if(seasonStale(s))throw new Error('Season looks wrong ('+(s?s.name:activeSeasonId())+') — pick a season above.');
  return activeSeasonId();
}
function htSeason(){return activeSeasonId();}
/* the previous regular season, for the preseason fallback */
function seasonPrevRegular(id){
  return seasonList().filter(s=>!s.playoff&&!s.career&&(+s.id)<(+id))
    .sort((a,b)=>(+b.id)-(+a.id))[0]||null;
}
/* Record which season each step actually used, so a mismatch is visible in the
   run report instead of buried. */
function seasonUsed(step,id,fellBack){
  DATA.report=DATA.report||{};
  DATA.report.seasonUsed=DATA.report.seasonUsed||{};
  DATA.report.seasonUsed[step]=String(id);
  DATA.report.seasonFallback=DATA.report.seasonFallback||{};
  if(fellBack)DATA.report.seasonFallback[step]=String(id);
  else delete DATA.report.seasonFallback[step];
}
function seasonStepNote(step,extra){
  const id=((DATA.report||{}).seasonUsed||{})[step]||activeSeasonId();
  const fell=!!(((DATA.report||{}).seasonFallback||{})[step]);
  const nm=seasonShortOf(id);
  return (extra?extra+' · ':'')+(fell?fallbackNote(id):nm);
}
function fallbackNote(usedId){
  return seasonShortOf(usedId)+' (last season) — '+seasonShortOf(activeSeasonId())+' not yet published';
}
/* tidy season word for stat-line labels: "2025-2026 Regular Season" → "2025-26" */
function tidySeasonShort(id){
  let s=String(seasonShortOf(id)||'').replace(/\s*regular season\s*/i,'').trim();
  const m=s.match(/^(\d{4})-\d{2}(\d{2})/);if(m)s=m[1]+'-'+m[2];
  return /^season /.test(s)?'':s;   // unknown id — let the caller fall back
}
function seasonNowShort(){return tidySeasonShort(activeSeasonId())||sheetSeason();}
/* which season the per-player stat tables actually hold, as a printable word:
   "2026-27" (current), "2025-26 FINAL" (fallback), '' (nothing synced yet) */
function statsScopeLabel(){
  const R=DATA.report||{};
  const used=(R.seasonUsed||{}).players;
  if(used){
    const fell=!!((R.seasonFallback||{}).players);
    return fell?((tidySeasonShort(used)||'last season')+' FINAL'):seasonNowShort();
  }
  const d=Date.parse(String((R.daily||{}).date||''));
  if(d&&(Date.now()-d)<30*86400000)return seasonNowShort();   // recent daily report = this season
  return '';
}
/* heading suffix for a season-scoped packet box, per feed step */
function scopeSuffixFor(step){
  const id=((DATA.report||{}).seasonFallback||{})[step];
  return id?(' — '+(tidySeasonShort(id)||'last season')+' FINAL'):'';
}
/* true when anything on screen is showing a season other than the chosen one */
function seasonFellBack(){
  const f=(DATA.report||{}).seasonFallback||{};
  return Object.keys(f).length?f[Object.keys(f)[0]]:'';
}
function seasonBannerHTML(){
  const id=seasonFellBack();
  if(!id)return '';
  return '<div class="season-fell">'+esc(fallbackNote(id))+'</div>';
}
function seasonSet(id){
  id=String(id||'').trim();if(!id)return;
  if(id===activeSeasonId()){renderSeasonBar();return;}
  DATA.settings.htSeason=id;save();
  renderSeasonBar();
  toast('Season set to '+seasonLabelOf(id)+' — reloading every table');
  htSyncAll();
}
function renderSeasonBar(){
  const sel=document.getElementById('seasonPick');
  const now=document.getElementById('seasonNow');
  const warn=document.getElementById('seasonWarn');
  const list=seasonList(),cur=activeSeasonId(),s=activeSeason();
  if(sel){
    // a career aggregate is not a season you can sync — keep it out of the list
    const pick=list.filter(x=>!x.career||x.id===cur);
    sel.innerHTML=pick.length
      ? pick.map(x=>`<option value="${esc(x.id)}"${x.id===cur?' selected':''}>${esc(x.name||x.short||('Season '+x.id))}</option>`).join('')
      : `<option value="${esc(cur)}">${esc(seasonLabelOf(cur))}</option>`;
    sel.value=cur;
  }
  if(now)now.textContent='Season: '+(s?(s.name||s.short):('id '+cur));
  const fell=document.getElementById('seasonFell');
  if(fell)fell.innerHTML=seasonBannerHTML();
  if(warn){
    const bad=seasonStale(s);
    warn.style.display=bad?'':'none';
    warn.textContent=bad?('Season looks wrong ('+(s?s.name:cur)+') — pick a season above.'):'';
  }
  // the old Advanced dropdown stays in step with the one above it
  const old=document.getElementById('ht_seasonSel');
  if(old&&list.length){
    old.innerHTML=list.filter(x=>!x.career||x.id===cur).map(x=>`<option value="${esc(x.id)}"${x.id===cur?' selected':''}>${esc(x.name||('Season '+x.id))}</option>`).join('');
    old.value=cur;
  }
}
function htParams(extra){
  const p={key:htKey(),client_code:'sphl',fmt:'json',lang:'en',...extra};
  return Object.keys(p).map(k=>k+'='+encodeURIComponent(p[k])).join('&');
}
let HT_CB=0;
function htHosted(){return location.protocol.startsWith('http');}
/* Same-origin proxy state: null = untried, true = works, false = missing/broken (use direct JSONP). */
let HT_PROXY=null;
function htGuard(extra,data){
  // wrong-endpoint signal: asked for X, got the seasons list back
  if(data&&data.SiteKit&&Array.isArray(data.SiteKit.Seasons)&&String((extra||{}).view||'')!=='seasons')
    throw new Error('Feed answered with the seasons list — wrong endpoint/params for view='+((extra||{}).view||'?'));
  return data;
}
async function htFetch(extra,keyOverride,timeoutMs){
  const useKey=keyOverride||htKey();
  if(htHosted()&&HT_PROXY!==false){
    // hosted with a server proxy (e.g. Cloudflare Pages): same-origin /api/ht — no key needed client-side.
    // Plain static hosting (e.g. GitHub Pages) has no /api/ht; fall back to direct JSONP below.
    try{
      const q=Object.entries({...extra,...(useKey?{key:useKey}:{})}).map(([k,v])=>k+'='+encodeURIComponent(v)).join('&');
      const res=await fetch('/api/ht?'+q);
      if(!res.ok){let msg='Proxy error '+res.status;try{const j=await res.json();if(j.error)msg=j.error;}catch(e){}throw new Error(msg);}
      const j=await res.json();
      HT_PROXY=true;
      return htGuard(extra,j);
    }catch(e){
      if(HT_PROXY===true)throw e; // proxy known good — this is a real feed error, surface it
      HT_PROXY=false;             // no working proxy on this host — use direct JSONP from now on
    }
  }
  try{
    return htGuard(extra,await htJSONP(extra,useKey,timeoutMs));
  }catch(e){
    if(/seasons list/.test(e.message))throw e; // wrong endpoint — backup routes won't change that
    // last resort (e.g. Safari content blockers eating third-party script tags):
    // fetch the feed's plain JSON through the public CORS proxies
    if(!useKey)throw e;
    try{
      let txt=await epFetchText(HT_BASE+'?'+htParams({...extra,key:useKey}));
      txt=txt.trim();
      if(txt.startsWith('(')&&txt.endsWith(')'))txt=txt.slice(1,-1); // statviewfeed paren wrapper
      const m=txt.match(/[\[{][\s\S]*[\]}]/); // JSON body, tolerating JSONP wrappers
      if(!m)throw new Error('feed answered but not with data — key may be wrong');
      return htGuard(extra,JSON.parse(m[0]));
    }catch(e2){throw new Error(e.message+' · backup route: '+e2.message);}
  }
}
/* Find the real SPHL feed key on the league's own public pages (fetched
   through the CORS proxies) — used when none of the known keys answer. */
async function htScrapeKeys(statusPrefix){
  const urls=['https://www.thesphl.com/','https://www.thesphl.com/stats/','https://lscluster.hockeytech.com/statview/mobile/flo/sphl/'];
  const found=new Set();
  const harvest=txt=>{
    (txt.match(/key=([0-9a-f]{16})/gi)||[]).forEach(m=>found.add(m.slice(4).toLowerCase()));
    if(/hockeytech|lscluster|leaguestat/i.test(txt))
      (txt.match(/["']([0-9a-f]{16})["']/g)||[]).forEach(m=>found.add(m.replace(/["']/g,'').toLowerCase()));
  };
  const fetchAny=async(u)=>{ // direct first (archive.org is CORS-open), CORS proxy otherwise
    try{const r=await fetch(u);if(r.ok)return await r.text();}catch(e){}
    return epFetchText(u);
  };
  const scriptSrcs=(html,base)=>(html.match(/<script[^>]+src=["']([^"']+)["']/gi)||[])
    .map(s=>(s.match(/src=["']([^"']+)["']/i)||[])[1]).filter(Boolean)
    .filter(s=>/hockeytech|leaguestat|league|stats|main|app|bundle|site/i.test(s)).slice(0,3)
    .map(s=>{try{if(s.indexOf('//')===0)return 'https:'+s;if(!/^https?:/i.test(s))return new URL(s,base).href;return s;}catch(e){return null;}}).filter(Boolean);
  // 1) live league pages via the CORS proxies
  for(const u of urls){
    htStatus((statusPrefix||'')+'searching the league site for the feed key…','');
    let html='';
    try{html=await epFetchText(u);}catch(e){continue;}
    harvest(html);
    if(!found.size)for(const s of scriptSrcs(html,u)){try{harvest(await epFetchText(s));}catch(e){}if(found.size)break;}
    if(found.size)break;
  }
  // 2) archived copies from the Wayback Machine — bypasses Cloudflare, original bytes
  if(!found.size){
    htStatus((statusPrefix||'')+'checking the web archive for the feed key…','');
    outer:
    for(const ts of ['2026','2025','2024']){
      for(const u of urls){
        let html='';
        try{html=await fetchAny('https://web.archive.org/web/'+ts+'id_/'+u);}catch(e){continue;}
        harvest(html);
        if(!found.size)for(const s of scriptSrcs(html,u)){try{harvest(await fetchAny('https://web.archive.org/web/'+ts+'id_/'+s));}catch(e){}if(found.size)break;}
        if(found.size)break outer;
      }
    }
  }
  HT_CANDIDATE_KEYS.forEach(k=>found.delete(k));
  return Array.from(found).slice(0,20);
}
function htJSONP(extra,useKey,timeoutMs){
  return new Promise((resolve,reject)=>{
    if(!useKey){reject(new Error('No feed key - run auto-detect or paste one.'));return;}
    const cb='__htcb'+(++HT_CB);
    const t=setTimeout(()=>{cleanup();reject(new Error('No response — key may be wrong, or the feed blocked the request.'));},timeoutMs||12000);
    function cleanup(){delete window[cb];if(s.parentNode)s.parentNode.removeChild(s);clearTimeout(t);}
    window[cb]=(data)=>{cleanup();resolve(data);};
    const s=document.createElement('script');
    s.src=HT_BASE+'?'+htParams({...extra,key:useKey})+'&callback='+cb;
    s.onerror=()=>{cleanup();reject(new Error('Feed request failed to load.'));};
    document.head.appendChild(s);
  });
}
/* The highest season_id that is neither a playoff nor a career season. Never
   by array index, never by a "current" flag — that is what put 2015 Playoffs
   into a Game Day Refresh. */
function htPickSeason(seasons){
  const norm=(seasons||[]).map(seasonNorm).filter(s=>s.id);
  const best=seasonDefault(norm);
  return best?(seasons.find(s=>String(pick(s,['season_id','id'],''))===best.id)||best):((seasons||[])[0]);
}
/* Fetch the season list, auto-detecting a feed key if the configured setup can't answer. */
async function htGetSeasons(prefix){
  let raw=null;
  try{
    const d=await htFetch({feed:'modulekit',view:'seasons'});
    raw=(d&&d.SiteKit&&d.SiteKit.Seasons)||[];
    if(!raw.length)throw new Error('Connected, but no seasons returned — check the key.');
  }catch(e){
    if(htKey())throw e; // a key is set but the feed still failed — surface that
    const auto=await htAutoKey(prefix||'');
    if(auto)raw=auto.seasons;
    else throw new Error('No feed key worked — paste one (thesphl.com, DevTools Network, lscluster request, key= value).');
  }
  seasonsStore(raw);            // cached; the list only changes twice a year
  renderSeasonBar();
  return raw;
}
/* re-read the league's season list on demand */
async function seasonsRefresh(){
  try{
    await htGetSeasons('');
    toast(seasonList().length+' seasons loaded');
  }catch(e){toast('Could not load the season list: '+e.message);}
}
async function htEnsureReady(prefix){
  if(htKey()&&seasonList().length)return;
  await htGetSeasons(prefix);
  if(!String((DATA.settings||{}).htSeason||'').trim()){
    const cur=seasonDefault();
    if(cur){DATA.settings.htSeason=cur.id;save();renderSeasonBar();}
  }
}
function pick(o,keys,d){for(const k of keys){if(o&&o[k]!=null&&o[k]!=='')return o[k];}return d;}
function htStatus(msg,ok){
  const el=document.getElementById('htStatus');if(!el)return;
  el.textContent=msg;
  // themed so it reads on the dark booth screen as well as the light one
  el.style.color=ok===true?'var(--ok-fg)':(ok===false?'var(--red-text)':'var(--ink-2)');
}
async function htTest(){
  try{
    htStatus('Testing…','');
    const seasons=await htGetSeasons('Auto-detect: ');
    if(!seasonById(activeSeasonId())){
      const d=seasonDefault();
      if(d){DATA.settings.htSeason=d.id;save();}
    }
    renderSeasonBar();
    htStatus('Connected — '+seasons.length+' seasons found. Season: '+seasonLabelOf(activeSeasonId())+'.',true);
    sbStart();
  }catch(e){htStatus(e.message,false);}
}

function htTeamsRows(d){
  // statviewfeed team responses nest teams under sections — deep-collect team-like rows
  const out=[];
  const walk=v=>{
    if(Array.isArray(v)){v.forEach(walk);return;}
    if(v&&typeof v==='object'){
      const hasName=('name' in v)||('team_name' in v)||('teamName' in v)||('team_city' in v);
      const hasPts=('points' in v)||('pts' in v);
      if(hasName&&hasPts){out.push(v);return;}
      Object.values(v).forEach(walk);
    }
  };
  walk(d);return out;
}
/* Run a pull for the chosen season; if the league has not published that
   season yet, run it again against the previous regular season and label the
   result. Never returns last season's numbers unlabelled. */
async function seasonTry(step,fn){
  const want=seasonGuard();
  let out=await fn(want);
  if(out&&out.empty){
    const prev=seasonPrevRegular(want);
    if(prev){
      const back=await fn(prev.id);
      if(back&&!back.empty){seasonUsed(step,prev.id,true);save();return back;}
    }
  }
  seasonUsed(step,want,false);save();
  return out;
}
async function htStandingsRows(season){
  let rows=[];
  try{ // primary: statviewfeed teams — the format the SPHL's own site uses
    const d0=await htFetch({feed:'statviewfeed',view:'teams',season:season,groupTeamsBy:'division',context:'overall',special:'false',sort:'points',league_id:''});
    rows=htTeamsRows(d0);
  }catch(e){}
  if(!rows.length){
    const d=await htFetch({feed:'modulekit',view:'statviewtype',stat:'conference',type:'standings',season_id:season});
    rows=(d&&d.SiteKit&&(d.SiteKit.Statviewtype||d.SiteKit.Standings))||[];
  }
  if(!rows.length){ // some HockeyTech configs only answer the plain standings view
    const d2=await htFetch({feed:'modulekit',view:'standings',season_id:season});
    rows=(d2&&d2.SiteKit&&(d2.SiteKit.Standings||d2.SiteKit.Statviewtype))||[];
  }
  return rows;
}
async function htDoStandings(){
  const got=await seasonTry('standings',async se=>{
    const rows=await htStandingsRows(se);
    return {rows,empty:!rows.length};
  });
  const rows=got.rows||[];
  const out=[];
  rows.forEach(r=>{
    const name=String(pick(r,['team_name','name','teamName','team_city','city'],'')).trim();
    if(!name)return;
    out.push({team:name.replace(/ (Havoc|Bulls|Thunderbolts|Marksmen|Ice Bears|Mayhem|Ice Flyers|Rivermen|Storm|Rail Yard Dawgs|Rock Lobsters|IceCats|Mysticks)$/,''),
      gp:+pick(r,['games_played','gamesPlayed','gp'],0),w:+pick(r,['wins','w'],0),l:+pick(r,['losses','l'],0),
      otl:+pick(r,['ot_losses','otLosses','otl'],0),sol:+pick(r,['shootout_losses','shootoutLosses','sol'],0),
      pts:+pick(r,['points','pts'],0),gf:+pick(r,['goals_for','goalsFor','gf'],0),ga:+pick(r,['goals_against','goalsAgainst','ga'],0)});
  });
  if(!out.length)throw new Error('Standings: no readable rows for '+seasonLabelOf(activeSeasonId())+'.');
  DATA.report.standings=out;DATA.report.parsedAt=new Date().toISOString();DATA.report.live={at:DATA.report.parsedAt};save();renderStandings();syncMark('standings');
  return seasonStepNote('standings',out.length+' teams');
}
/* statviewfeed player stats. The parameter is season= (not season_id=), the
   body arrives wrapped in parentheses, and asking wrongly gets you the seasons
   list back with a 200 — htGuard turns that into a failure rather than a
   silent empty table. HockeyTech configs differ on the required knobs, so this
   tries three shapes in order (like the standings pull does): the league
   site's own parameter set, the older minimal set, then the modulekit
   top-scorers/top-goalies view — the same feed family every working pull uses. */
function htPlayerParse(d){
  const secs=Array.isArray(d)?d:((d&&d.sections)||[]);
  const rows=[];
  secs.forEach(sec=>{(sec.data||[]).forEach(x=>rows.push(x.row||x));});
  return rows;
}
async function htPlayerRows(season,position){
  const sort=position==='goalies'?'gaa':'points';
  try{ // shape 1: what thesphl.com's stats page itself sends
    const d=await htFetch({feed:'statviewfeed',view:'players',season:season,team:'all',
      position:position,rookies:0,statsType:'standard',rowseq:0,league_id:1,qualified:'all',
      first:0,limit:500,sort:sort});
    const rows=htPlayerParse(d);if(rows.length)return rows;
  }catch(e){}
  try{ // shape 2: the older minimal form
    const d=await htFetch({feed:'statviewfeed',view:'players',season:season,team:'all',
      position:position,statsType:'standard',first:0,limit:500,
      sort:sort,division:-1,conference:-1});
    const rows=htPlayerParse(d);if(rows.length)return rows;
  }catch(e){}
  try{ // shape 3: modulekit stat views
    const d=await htFetch({feed:'modulekit',view:'statviewtype',type:position==='goalies'?'topgoalies':'topscorers',
      season_id:season,first:0,limit:500});
    return (d&&d.SiteKit&&(d.SiteKit.Statviewtype||[]))||[];
  }catch(e){}
  return [];
}
async function htDoPlayers(){
  // preseason fallback: if the chosen season has no stat rows yet, load last
  // season's numbers instead and label them — never blank, never unlabelled
  const got=await seasonTry('players',async se=>{
    const skaters=await htPlayerRows(se,'skaters');
    const goalies=await htPlayerRows(se,'goalies');
    return {skaters,goalies,empty:!skaters.length&&!goalies.length};
  });
  const skaters=got.skaters||[],goalies=got.goalies||[];
  DATA.report.seasonLabel=(DATA.report.seasonFallback||{}).players?fallbackNote(DATA.report.seasonUsed.players):'';
  if(!skaters.length&&!goalies.length)throw new Error('Players: feed returned nothing readable for '+seasonLabelOf(activeSeasonId())+' — tried the league-site parameter shape, the legacy shape and the modulekit top-scorers view, for this season and the fallback season.');
  const ts={};
  const teamOf=r=>String(pick(r,['team_code','team','team_name'],'')).trim();
  // modulekit rows may carry first/last name instead of one name field
  const nameOf=r=>String(pick(r,['name','player_name'],'')).trim()
    ||((String(pick(r,['first_name'],''))+' '+String(pick(r,['last_name'],''))).trim());
  skaters.forEach(r=>{
    const ab=teamOf(r);if(!ab)return;
    const city=Object.keys(TEAM_ABBR).find(c=>TEAM_ABBR[c]===ab)||ab;
    ts[city]=ts[city]||{players:[],goalies:[]};
    ts[city].players.push({htId:String(pick(r,['player_id','playerId','id'],'')).trim(),num:String(pick(r,['jersey_number','tp_jersey_number','num'],'')),name:nameOf(r),pos:String(pick(r,['position','pos'],'')),
      gp:+pick(r,['games_played','gp'],0),g:+pick(r,['goals','g'],0),a:+pick(r,['assists','a'],0),pts:+pick(r,['points','pts'],0),
      pm:+pick(r,['plus_minus','pm'],0),pim:+pick(r,['penalty_minutes','pim'],0),pp:+pick(r,['power_play_goals','ppg'],0),
      shg:+pick(r,['short_handed_goals','shg'],0),gw:+pick(r,['game_winning_goals','gwg'],0),shots:+pick(r,['shots','sh'],0),shpct:String(pick(r,['shooting_percentage','shpct'],''))});
  });
  goalies.forEach(r=>{
    const ab=teamOf(r);if(!ab)return;
    const city=Object.keys(TEAM_ABBR).find(c=>TEAM_ABBR[c]===ab)||ab;
    ts[city]=ts[city]||{players:[],goalies:[]};
    ts[city].goalies.push({htId:String(pick(r,['player_id','playerId','id'],'')).trim(),num:String(pick(r,['jersey_number','tp_jersey_number','num'],'')),name:nameOf(r),
      gp:+pick(r,['games_played','gp'],0),w:+pick(r,['wins','w'],0),l:+pick(r,['losses','l'],0),otl:+pick(r,['ot_losses','otl'],0),
      so:+pick(r,['shutouts','so'],0),ga:+pick(r,['goals_against','ga'],0),gaa:String(pick(r,['goals_against_average','gaa'],'')),
      sa:+pick(r,['shots_against','sa'],0),svs:+pick(r,['saves','svs'],0),svpct:String(pick(r,['save_percentage','svpct'],''))});
  });
  DATA.report.teamStats=ts;DATA.report.parsedAt=new Date().toISOString();
  syncRosterStats();save();syncMark('players');
  return seasonStepNote('players',Object.keys(ts).length+' teams · '+skaters.length+' skaters, '+goalies.length+' goalies');
}
function htFmtTime(t){const m=String(t||'').match(/^(\d{1,2}):(\d{2})/);if(!m)return '';let h=+m[1];const ap=h>=12?'PM':'AM';h=h%12||12;return h+':'+m[2]+' '+ap;}
async function htDoResults(){
  const got=await seasonTry('schedule',async se=>{
    const d=await htFetch({feed:'modulekit',view:'schedule',season_id:se});
    const games=(d&&d.SiteKit&&d.SiteKit.Schedule)||[];
    return {games,empty:!games.length};
  });
  const games=got.games||[];
  if(!games.length)throw new Error('Schedule: no games returned for '+seasonLabelOf(activeSeasonId())+'.');
  const mySched=parseScheduleData();let filled=0,added=0;
  const lgLog=[];
  games.forEach(g=>{
    const home=String(pick(g,['home_team_name','home_team','home_team_city'],''));
    const away=String(pick(g,['visiting_team_name','visiting_team','visiting_team_city'],''));
    const dateISO=String(pick(g,['date_played','GameDateISO8601','date'],'')).slice(0,10);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(dateISO))return;
    { // league-wide finals cache — powers opponent sections + head-to-head
      const st=String(pick(g,['game_status','status'],''));
      const hg=+pick(g,['home_goal_count','home_goals'],NaN),ag=+pick(g,['visiting_goal_count','visiting_goals'],NaN);
      if((/final/i.test(st)||String(pick(g,['final'],''))==='1')&&!isNaN(hg)&&!isNaN(ag))
        lgLog.push({d:dateISO,h:home,a:away,hg,ag,ot:/SO/i.test(st)?'SO':(/OT/i.test(st)?'OT':'')});
    }
    if(!/Huntsville/i.test(home)&&!/Huntsville/i.test(away))return;
    const weAreHome=/Huntsville/i.test(home);
    const oppFull=(weAreHome?away:home).trim();
    const oppCity=Object.keys(TEAM_ABBR).find(c=>oppFull.indexOf(c)===0)||oppFull.replace(/\s+(Havoc|Bulls|Thunderbolts|Marksmen|Ice Bears|Mayhem|Ice Flyers|Rivermen|Storm|Rail Yard Dawgs|Rock Lobsters|IceCats|Mysticks)$/,'');
    let row=mySched.find(x=>x.dateISO===dateISO);
    if(!row){
      const parts=dateISO.split('-');
      row={date:(+parts[1])+'/'+(+parts[2]),yy:parts[0].slice(2),dateISO,hv:weAreHome?'vs':'@',team:oppCity,time:'',result:'',note:'',ps:false,opp:''};
      mySched.push(row);added++;
    }
    if(!row.time){const t=htFmtTime(pick(g,['schedule_time','game_time','time'],''));if(t)row.time=t;}
    const status=String(pick(g,['game_status','status'],''));
    const final=/final/i.test(status)||String(pick(g,['final'],''))==='1';
    if(final){ // feed the per-game store (attendance comes free from the feed)
      const hg2=+pick(g,['home_goal_count','home_goals'],NaN),ag2=+pick(g,['visiting_goal_count','visiting_goals'],NaN);
      if(!isNaN(hg2)&&!isNaN(ag2)){
        DATA.gamelog=DATA.gamelog||{};
        const e=DATA.gamelog[dateISO]=DATA.gamelog[dateISO]||{};
        e.opp=oppCity;e.ha=weAreHome?'vs':'@';
        e.us=weAreHome?hg2:ag2;e.them=weAreHome?ag2:hg2;
        e.otso=/SO/i.test(status)?'SO':(/OT/i.test(status)?'OT':'');
        const att=+String(pick(g,['attendance','att'],'')).replace(/,/g,'');
        if(att&&!e.att)e.att=att;
      }
    }
    if(!final||row.result)return; // never overwrite a manually entered result (e.g. OTL/SOL notation)
    const hg=+pick(g,['home_goal_count','home_goals'],NaN),ag=+pick(g,['visiting_goal_count','visiting_goals'],NaN);
    if(isNaN(hg)||isNaN(ag))return;
    const us=weAreHome?hg:ag, them=weAreHome?ag:hg;
    const ot=/OT/i.test(status)?' (OT)':(/SO/i.test(status)?' (SO)':'');
    row.result=(us>them?'W ':'L ')+us+'-'+them+ot;
    filled++;
  });
  if(lgLog.length)DATA.leagueLog=lgLog;
  if(filled||added){
    if(added)mySched.sort((a,b)=>a.dateISO<b.dateISO?-1:(a.dateISO>b.dateISO?1:0));
    DATA.notes.schedule=rebuildScheduleText(mySched);save();
    const box=document.getElementById('sched_text');if(box)box.value=DATA.notes.schedule;
    if(typeof renderSchedPreview==='function'&&document.getElementById('schedPreview'))renderSchedPreview();
  }
  syncMark('schedule');
  return seasonStepNote('schedule',filled+' new final scores filled'+(added?', '+added+' games added':''));
}
/* ---- Rosters: pull every team's roster from the feed ---- */
function htHeightFmt(h){h=String(h||'').trim();const m=h.match(/^(\d)\.(\d{1,2})$/);if(m)return m[1]+'-'+String(+m[2]);return h;}
function htDobFmt(b){const m=String(b||'').match(/^(\d{4})-(\d{2})-(\d{2})/);if(!m)return '';return m[2]+'/'+m[3]+'/'+m[1].slice(2);}
function htAgeFrom(b){const m=String(b||'').match(/^(\d{4})-(\d{2})-(\d{2})/);if(!m)return '';const t=new Date();let a=t.getFullYear()-(+m[1]);if((t.getMonth()+1)*100+t.getDate()<(+m[2])*100+(+m[3]))a--;return a>0&&a<60?String(a):'';}
/* The league feed is the authority on where a player is from. "homeplace" is
   the populated field — "hometown" usually comes back empty — so read it
   first and fall back through hometown to the birthplace fields. */
function htHome(r){
  const home=String(pick(r,['homeplace','hometown'],'')).trim();
  if(home)return home;
  return htBornIn(r);
}
function htBornIn(r){
  const bp=String(pick(r,['birthplace'],'')).trim();
  if(bp)return bp;
  const town=String(pick(r,['birthtown','birthcity'],'')).trim();
  const prov=String(pick(r,['birthprov','birthstate','birthcntry','birthcountry'],'')).trim();
  return [town,prov].filter(Boolean).join(', ');
}
/* The roster response carries the staff alongside the players — head coach,
   assistants, equipment manager, athletic trainer. They fill the call sheet's
   header line, so they are kept rather than skipped. */
function htStaffRow(r){
  let name=String(pick(r,['name','player_name'],'')).trim();
  if(!name)name=(String(pick(r,['first_name'],''))+' '+String(pick(r,['last_name'],''))).trim();
  const role=String(pick(r,['position','role','title'],'')).trim();
  if(!name||!role||/^(F|C|LW|RW|W|D|G)$/i.test(role))return null;
  return {name,role};
}
function staffFor(team){
  const list=((DATA.staff||{})[team])||[];
  const head=list.find(x=>/head\s*coach/i.test(x.role));
  const asst=list.filter(x=>/assist/i.test(x.role));
  return {list,head,asst};
}
function htRosterRow(r){
  let name=String(pick(r,['name','player_name'],'')).trim();
  if(!name)name=(String(pick(r,['first_name'],''))+' '+String(pick(r,['last_name'],''))).trim();
  const pos=String(pick(r,['position','pos'],'')).toUpperCase().trim();
  if(!name||!/^(F|C|LW|RW|W|D|G)$/.test(pos))return null; // skips staff/coach rows
  const bd=String(pick(r,['birthdate','date_of_birth','dob'],''));
  const home=htHome(r),born=htBornIn(r);
  const rk=String(pick(r,['rookie','isRookie','veteran_status'],'')).trim();
  return {name,pos:pos==='W'?'RW':pos,
    htid:String(pick(r,['player_id','id'],'')).trim(),
    num:String(pick(r,['tp_jersey_number','jersey_number','num'],'')).trim(),
    ht:htHeightFmt(pick(r,['height_hyphenated','height','ht'],'')),
    wt:String(pick(r,['weight','wt'],'')).trim(),
    sh:String(pick(r,['shoots','catches','sh'],'')).toUpperCase().replace(/[^LR]/g,'').slice(0,1),
    dob:htDobFmt(bd),age:htAgeFrom(bd),dobi:/^\d{4}-\d{2}-\d{2}/.test(bd)?bd.slice(0,10):'',
    birth:home,
    bornIn:(born&&born!==home)?born:'',
    rookie:/^(1|y|yes|true|rookie)$/i.test(rk)?'1':(rk&&/^(0|n|no|false|vet|veteran)$/i.test(rk)?'0':''),
    draft:String(pick(r,['draft_status','draftinfo','draft_info'],'')).trim(),
    pron:String(pick(r,['phonetic_name','phonetic'],'')).trim(),
    img:String(pick(r,['player_image','image','photo','headshot'],'')).trim()};
}
/* ---- who owns a field ----
   The league feed outranks the club's bios JSON on every vital. A value the
   broadcaster typed into the player editor himself outranks both, so a sync
   never silently undoes his correction. */
function feedOwns(p,k){return !!((p&&p.feedOwn||{})[k]);}
function handOwns(p,k){return !!((p&&p.handEdit||{})[k]);}
function feedSet(p,k,v){
  if(v==null||String(v).trim()==='')return;
  p.feedOwn=p.feedOwn||{};
  p.feedOwn[k]=1;                      // the feed has an opinion here from now on
  if(handOwns(p,k))return;             // his own correction stands
  p[k]=String(v);
}
/* The feed prints a player's everyday name; the club's bios file prints the
   name he signed under. Match on the surname and first initial once the exact
   name misses, so a sync updates the man already on the roster instead of
   adding him twice — but only when that is unambiguous. */
function rosterMatch(name,list){
  const k=norm(name);
  const hit=list.find(x=>norm(x.name)===k);
  if(hit)return hit;
  const bare=s=>norm(String(s||'').replace(/["'“”‘’]/g,'').replace(/\(.*?\)/g,''));
  const b=bare(name);
  const same=list.find(x=>bare(x.name)===b);
  if(same)return same;
  const parts=String(name||'').trim().split(/\s+/);
  if(parts.length<2)return null;
  const last=norm(parts[parts.length-1]),first=norm(parts[0]).charAt(0);
  const near=list.filter(x=>{
    const xp=String(x.name||'').trim().split(/\s+/);
    return xp.length>1&&norm(xp[xp.length-1])===last&&norm(xp[0]).charAt(0)===first;
  });
  return near.length===1?near[0]:null;
}
/* true when the feed's rookie column varies across the roster — see above */
function rookieVaries(feedPlayers){
  const vals=new Set(feedPlayers.map(f=>String(f.rookie||'')).filter(Boolean));
  return vals.size>1;
}
/* ===== INTERIM STALE-SEASON GUARD (P0A tourniquet) =====
   Until real provenance lands, any feed apply REFUSES to (a) deactivate a
   sheet-owned player (= a player on the committed spine), or (b) overwrite
   internal data with rows from a season OLDER than the active one — and it
   says so loudly. Stale data may only fill a gap, never replace. */
let GUARD_LOG=[];
function guardIsSheet(p){
  const P=(MS_DATA&&MS_DATA.players)||[];
  return !!(p&&p.name&&P.some(x=>norm(x.name)===norm(p.name)));
}
function guardNote(msg){if(GUARD_LOG.indexOf(msg)<0)GUARD_LOG.push(msg);}
let GUARD_FILLS=0;   // count of stale field overwrites refused (too many to list)
function staleSet(p,k,v){ // stale-season value: fill an empty field only
  if(v==null||String(v).trim()==='')return;
  if(p[k]!=null&&String(p[k]).trim()!==''){if(String(p[k])!==String(v))GUARD_FILLS++;return;}
  feedSet(p,k,v);
}
function guardBannerHTML(){
  if(!GUARD_LOG.length&&!GUARD_FILLS)return '';
  const items=GUARD_LOG.slice(0,14).map(esc).join('<br>');
  return `<div class="guard-banner"><b>Stale-season guard</b> — refused:<br>${items}${GUARD_LOG.length>14?'<br>… and '+(GUARD_LOG.length-14)+' more':''}${GUARD_FILLS?`<br>+ ${GUARD_FILLS} field overwrite${GUARD_FILLS===1?'':'s'} from an older season (existing values kept)`:''}</div>`;
}
function htMergeRoster(list,feedPlayers,isHavoc,stale){
  list=list||[];
  const rookieUsable=rookieVaries(feedPlayers);
  const guardHavoc=!!(stale&&isHavoc);   // stale rows may not reshape the internal roster
  const seen=new Set();
  feedPlayers.forEach(fp=>{
    const k=norm(fp.name);if(!k)return;
    let p=rosterMatch(fp.name,list);
    seen.add(norm(p?p.name:fp.name));
    if(!p){
      if(guardHavoc){guardNote('add '+fp.name+' — older-season roster row');return;}
      p={id:uid(),notes:''};list.push(p);
    }
    // an existing Havoc name is the spine's join key (bios, milestones) — keep it
    else if(isHavoc&&p.name){}
    else p.name=fp.name;
    if(!p.name)p.name=fp.name;
    const set=guardHavoc?staleSet:feedSet;
    if(fp.htid)p.htId=fp.htid; // HockeyTech player ID — the join key for the EP data file
    if(fp.img&&!(guardHavoc&&p.img))p.img=fp.img;
    if(fp.num){
      // PRECEDENCE (master doc §5): the internal sheet's number outranks the
      // feed in ANY season — the feed's number is reported, never applied
      const sheetOwn=isHavoc&&(p.sheet===sheetSeason()||guardIsSheet(p));
      if(p.num&&String(p.num)!==String(fp.num)&&(guardHavoc||sheetOwn))
        guardNote('jersey #'+fp.num+' on '+p.name+' — '+(guardHavoc?'older-season number':'internal sheet number stands')+' (keeping #'+p.num+')');
      else set(p,'num',fp.num);
    }
    // keep a more specific existing position (C/LW/RW) when the feed only says F
    if(fp.pos&&!(fp.pos==='F'&&/^(C|LW|RW|F)$/.test(p.pos||'')))set(p,'pos',fp.pos);
    // vitals: the CURRENT season's league feed is the authority; an older
    // season's rows may only fill gaps
    ['ht','wt','sh','dob','age','dobi','birth','bornIn','draft'].forEach(k=>set(p,k,fp[k]));
    // the rookie column reads the same for every player on some rosters, which
    // makes it a formatting flag rather than a fact — only take it when it
    // actually distinguishes one player from another
    if(rookieUsable)set(p,'rookie',fp.rookie);
    if(fp.pron){set(p,'pron',fp.pron);if(p.pron)delete p.pronAsk;}   // phonetic_name fills the guide
    else if(!String(p.pron||'').trim())p.pronAsk=1;            // blank here is one to ask the club
    if(!guardHavoc){if(!handOwns(p,'active'))p.active='1';}    // a hand-set scratch survives a sync
    else if(p.active==null)p.active='1';                       // stale rows never flip a scratch back on
  });
  // only mark leftovers inactive when the feed clearly returned a full roster
  // FOR THE ACTIVE SEASON — and never a player the internal sheet says is signed
  if(feedPlayers.length>=8&&!stale){
    list.forEach(p=>{
      if(seen.has(norm(p.name)))return;
      if(isHavoc&&(p.sheet===sheetSeason()||guardIsSheet(p))){guardNote('deactivate '+p.name+' — signed on the internal sheet');return;}
      if(handOwns(p,'active'))return;   // his hand-set active state stands
      p.active='0';
    });
  }else if(feedPlayers.length>=8&&stale&&isHavoc){
    const would=list.filter(p=>!seen.has(norm(p.name))&&p.active!=='0');
    if(would.length)guardNote('deactivate '+would.length+' player'+(would.length===1?'':'s')+' ('+would.map(p=>p.name).join(', ')+') — the roster came from an older season');
  }
  return list;
}
/* team ids confirmed against the league feed */
const HT_TEAM_ID={"Peoria Rivermen":1,"Fayetteville Marksmen":2,"Huntsville Havoc":3,"Pensacola Ice Flyers":4,
  "Evansville Thunderbolts":5,"Knoxville Ice Bears":6,"Roanoke Rail Yard Dawgs":7,"Quad City Storm":8,
  "Birmingham Bulls":9,"Macon Mayhem":10,"Athens Rock Lobsters":27,"Pee Dee IceCats":28};
/* 2026-27 returns coaches only until the league publishes players, so returning
   players get their vitals and their picture from last season's roster, matched
   by name. Runs on every roster sync; new signings stay text-only until they
   appear in the feed, and then fill in automatically. Season 44 is still the
   league feed, so it outranks the bios file exactly the same way. */
/* ---- the committed roster file (cleanup Phase 2) ----
   data/sphl-rosters.json is fetched nightly by the Action and committed.
   The site loads it FIRST as the roster baseline; the in-browser live sync
   is an overlay on top. Both flow through feedSet, so a hand edit in the
   player editor still beats either, and a later live sync wins over the
   file simply by running later. */
let ROSTER_FILE=null,ROSTER_FILE_TRIED=false;
async function rosterFileLoad(){
  // re-apply on every render, not just first load: a player who joins the
  // roster later (live sync, hand add, a mid-season signing) still gets the
  // committed baseline — the apply is idempotent and hand edits win inside it
  if(ROSTER_FILE||ROSTER_FILE_TRIED){if(ROSTER_FILE)rosterFileApply();return ROSTER_FILE;}
  ROSTER_FILE_TRIED=true;
  try{
    const r=await fetch('data/sphl-rosters.json',{cache:'no-cache'});
    if(r.ok)ROSTER_FILE=await r.json();
  }catch(e){}
  if(ROSTER_FILE)rosterFileApply();
  return ROSTER_FILE;
}
function rosterFileStampHTML(){
  if(!ROSTER_FILE)return '';
  const d=new Date(ROSTER_FILE.fetchedAt);
  return `<div class="chip" title="data/sphl-rosters.json — every SPHL roster, fetched nightly by the league-roster Action; the live sync overlays it">Roster file <b>${isNaN(d)?esc(ROSTER_FILE.fetchedAt||'—'):d.toLocaleDateString()+' '+d.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}</b>${ROSTER_FILE.seasonLabel?' · '+esc(ROSTER_FILE.seasonLabel):''}</div>`;
}
function rosterFileApply(){
  if(!ROSTER_FILE||!Array.isArray(ROSTER_FILE.teams))return;
  rosterFileApplyOpponents();
  const hav=ROSTER_FILE.teams.find(t=>/Huntsville/.test(t.name||''));
  if(!hav||!(hav.roster||[]).length)return;
  const fps=hav.roster.map(htRosterRow).filter(Boolean);
  if(!fps.length)return;
  const by=new Map();fps.forEach(fp=>by.set(norm(fp.name),fp));
  const rookieUsable=rookieVaries(fps);
  const fileStale=+(ROSTER_FILE.seasonId||0)<+(activeSeasonId()||0);   // preseason fallback content
  const before=JSON.stringify(DATA.roster);   // apply runs on every render — only save/re-render on a real change
  (DATA.roster||[]).forEach(p=>{
    if(!p.name)return;
    const fp=by.get(norm(p.name))||fps.find(f=>rosterMatch(f.name,[p]));
    if(!fp)return;
    if(!p.htId&&fp.htid)p.htId=fp.htid;
    if(fp.img&&!p.img)p.img=fp.img;
    if(fp.num&&!p.num)p.num=fp.num;   // the committed file may lag a season — never overwrite a set number
    // when the committed file carries an OLDER season than the active one
    // (preseason fallback), its rows may fill gaps but never overwrite
    const fset=fileStale?staleSet:feedSet;
    ['ht','wt','sh','dob','age','dobi','birth','bornIn','draft','pos'].forEach(k=>fset(p,k,fp[k]));
    if(rookieUsable)fset(p,'rookie',fp.rookie);
    if(fp.pron){fset(p,'pron',fp.pron);if(p.pron)delete p.pronAsk;}
  });
  if(JSON.stringify(DATA.roster)!==before){save();if(document.getElementById('rosterTableWrap'))renderRoster();}
}
/* Opponent baselines from the same committed file — ADDITIVE ONLY.
   Every field goes through staleSet (fill-empty) no matter which season the
   file carries, players are added but never renamed, deactivated or
   renumbered, so a fresher live sync and hand edits always outrank the file.
   This is what puts an opponent roster on a fresh browser with no feed. */
function rosterFileApplyOpponents(){
  const teams=(ROSTER_FILE.teams||[]).filter(t=>!/Huntsville/.test(t.name||''));
  if(!teams.length)return;
  DATA.oppRosters=DATA.oppRosters||{};
  const before=JSON.stringify(DATA.oppRosters);
  teams.forEach(t=>{
    const fps=(t.roster||[]).map(htRosterRow).filter(Boolean);
    if(!fps.length)return;
    const full=TEAMS.find(x=>x===t.name)||TEAMS.find(x=>String(t.name||'').indexOf(teamCity(x))===0)||String(t.name||'');
    const list=DATA.oppRosters[full]=DATA.oppRosters[full]||[];
    const rookieUsable=rookieVaries(fps);
    fps.forEach(fp=>{
      let p=rosterMatch(fp.name,list);
      if(!p){p={id:uid(),name:fp.name,notes:'',active:'1'};list.push(p);}
      if(!p.htId&&fp.htid)p.htId=fp.htid;
      if(fp.img&&!p.img)p.img=fp.img;
      if(fp.num&&!p.num)p.num=fp.num;
      ['ht','wt','sh','dob','age','dobi','birth','bornIn','draft','pos'].forEach(k=>staleSet(p,k,fp[k]));
      if(rookieUsable)staleSet(p,'rookie',fp.rookie);
      if(fp.pron){staleSet(p,'pron',fp.pron);if(p.pron)delete p.pronAsk;}
    });
  });
  if(JSON.stringify(DATA.oppRosters)!==before){
    save();
    if(document.getElementById('oppRosterTableWrap')&&typeof renderOppRoster==='function')renderOppRoster();
  }
}
async function htVitalsBackfill(){
  // only reach back a season when the chosen one left something out
  const need=DATA.roster.filter(p=>p.name&&p.active!=='0'&&(!p.img||!p.birth||!p.ht||!p.wt||!p.dob));
  if(!need.length)return '';
  let rows=[];
  try{
    const prev=seasonPrevRegular(activeSeasonId());
    const r=await htFetch({feed:'modulekit',view:'roster',season_id:prev?prev.id:'44',team_id:String(HT_TEAM_ID['Huntsville Havoc'])});
    rows=(r&&r.SiteKit&&r.SiteKit.Roster)||[];
  }catch(e){return '';}
  const by=new Map();
  rows.map(htRosterRow).filter(Boolean).forEach(fp=>by.set(norm(fp.name),fp));
  let got=0,pics=0;
  const fpList=[...by.values()];
  const rookieUsable=rookieVaries(fpList);
  need.forEach(p=>{
    const fp=by.get(norm(p.name))||fpList.find(f=>rosterMatch(f.name,[p]));
    if(!fp)return;
    if(!p.htId&&fp.htid)p.htId=fp.htid;
    if(fp.img&&!p.img){p.img=fp.img;pics++;}   // verbatim, as the feed gives it
    // this whole path reaches back a season BY DESIGN — stale data fills gaps only
    ['ht','wt','sh','dob','age','dobi','birth','bornIn','draft','pos'].forEach(k=>staleSet(p,k,fp[k]));
    if(rookieUsable)staleSet(p,'rookie',fp.rookie);
    if(fp.pron){staleSet(p,'pron',fp.pron);if(p.pron)delete p.pronAsk;}
    else if(!String(p.pron||'').trim())p.pronAsk=1;
    got++;
  });
  if(got){save();renderRoster();}
  const prevName=(seasonPrevRegular(activeSeasonId())||{}).short||'last season';
  return got?got+' filled from '+prevName+(pics?' ('+pics+' photo'+(pics===1?'':'s')+')':''):'';
}
/* every club's roster for one season — returns what it found, so the caller
   can decide whether the season is simply not published yet */
async function htRosterSweep(season){
  const d=await htFetch({feed:'modulekit',view:'teamsbyseason',season_id:season});
  const teams=(d&&d.SiteKit&&d.SiteKit.Teamsbyseason)||[];
  if(!teams.length)return {teams:0,out:[],empty:true};
  const out=[];
  for(const t of teams){
    const tid=String(pick(t,['id','team_id'],'')).trim();
    const tname=String(pick(t,['name','team_name'],'')).trim();
    if(!tid||!tname)continue;
    let rows=[];
    try{
      const r=await htFetch({feed:'modulekit',view:'roster',season_id:season,team_id:tid});
      rows=(r&&r.SiteKit&&r.SiteKit.Roster)||[];
    }catch(e){continue;}
    const staff=rows.map(htStaffRow).filter(Boolean);
    if(staff.length){DATA.staff=DATA.staff||{};DATA.staff[tname]=staff;}
    const players=rows.map(htRosterRow).filter(Boolean);
    if(!players.length)continue;                 // coaches-only, as 2026-27 is today
    out.push({tname,players});
  }
  return {teams:teams.length,out,empty:!out.length};
}
async function htDoRosters(){
  await msLoad();   // the guard needs the internal sheet to know who is protected
  const guardBefore=GUARD_LOG.length;
  const got=await seasonTry('rosters',se=>htRosterSweep(se));
  // rows that came from the previous-season fallback are STALE — they may fill
  // gaps but never reshape the internal roster (the tourniquet, until provenance)
  const stale=!!(((DATA.report||{}).seasonFallback||{}).rosters);
  let teamCount=0,playerCount=0;
  (got.out||[]).forEach(({tname,players})=>{
    if(/Huntsville/i.test(tname)){
      DATA.roster=htMergeRoster(DATA.roster,players,true,stale);
    }else{
      const full=TEAMS.find(x=>x===tname)||TEAMS.find(x=>tname.indexOf(x.split(' ')[0])===0)||tname;
      DATA.oppRosters=DATA.oppRosters||{};
      DATA.oppRosters[full]=htMergeRoster(DATA.oppRosters[full],players,false,stale);
    }
    teamCount++;playerCount+=players.length;
  });
  if(GUARD_LOG.length>guardBefore)toast('Stale-season guard blocked '+(GUARD_LOG.length-guardBefore)+' change'+((GUARD_LOG.length-guardBefore)===1?'':'s')+' — details on the Rosters tab');
  if(!teamCount)throw new Error('Rosters: no club has published a roster for '+seasonLabelOf(activeSeasonId())+' yet.');
  syncRosterStats();save();syncMark('rosters');
  renderRoster();if(typeof renderOppRoster==='function')renderOppRoster();
  let back='';
  try{back=await htVitalsBackfill();}catch(e){}
  return seasonStepNote('rosters',teamCount+' of '+(got.teams||teamCount)+' team rosters ('+playerCount+' players)'+(back?' · '+back:''));
}

/* ============================================================
   ELITE PROSPECTS — two-lane integration.
   The slow lane: a weekly GitHub Action (.github/workflows/
   ep-data.yml) matches SPHL players to Elite Prospects via the
   official EP API and commits data/ep-players.json keyed by
   HockeyTech player ID. The browser just loads that same-origin
   JSON and merges it into rosters — career bio bullets for
   players with empty notes (hand-written notes are never
   touched) plus an EP profile link on every player name.
   No EP requests ever leave the visitor's browser.
   ============================================================ */
/* Generic CORS-proxy text fetch — used only as the last-resort
   transport for the league's own public HockeyTech feed. */
const EP_PROXIES=[
  u=>'https://corsproxy.io/?url='+encodeURIComponent(u),
  u=>'https://api.allorigins.win/raw?url='+encodeURIComponent(u),
  u=>'https://api.codetabs.com/v1/proxy?quest='+encodeURIComponent(u)
];
let EP_PROXY=0,EP_NETFAIL=0;
async function epFetchText(url){
  let lastErr=null;
  for(let i=0;i<EP_PROXIES.length;i++){
    const idx=(EP_PROXY+i)%EP_PROXIES.length;
    try{
      const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),12000);
      const res=await fetch(EP_PROXIES[idx](url),{signal:ctl.signal});
      clearTimeout(t);
      if(!res.ok)throw new Error('HTTP '+res.status);
      const txt=await res.text();
      if(!txt||!txt.trim())throw new Error('empty response');
      EP_PROXY=idx;EP_NETFAIL=0;
      return txt;
    }catch(e){lastErr=e;}
  }
  EP_NETFAIL++;
  throw lastErr||new Error('All CORS proxies failed');
}
let EP_STATIC=null,EP_STATIC_AT=0;
async function epLoadStatic(force){
  if(!force&&EP_STATIC&&Date.now()-EP_STATIC_AT<3600000)return EP_STATIC;
  try{
    const res=await fetch('data/ep-players.json',{cache:'no-cache'});
    if(!res.ok)throw new Error('HTTP '+res.status);
    const j=await res.json();
    if(j&&typeof j==='object'){EP_STATIC=j;EP_STATIC_AT=Date.now();}
  }catch(e){}
  return EP_STATIC;
}
function epEntryFor(p){
  if(!EP_STATIC)return null;
  if(p.htId&&EP_STATIC[p.htId])return EP_STATIC[p.htId];      // the SPHL player_id is the join key
  const list=Object.keys(EP_STATIC).map(id=>EP_STATIC[id]).filter(e=>e&&e.name);
  const k=norm(p.name);
  const exact=list.find(e=>norm(e.name)===k);
  if(exact)return exact;
  // the club signs him under one name and the league prints another — surname
  // and first initial, only where that is unambiguous
  const near=rosterMatch(p.name,list);
  if(near)return near;
  if(p.dobi){const byDob=list.filter(e=>e.dob===p.dobi);if(byDob.length===1)return byDob[0];}
  return null;
}
function epLinkFor(p){
  return p.epUrl||'https://www.eliteprospects.com/search/player?q='+encodeURIComponent(p.name||'');
}
async function epAutoBios(scope){ // links only — bios are written by hand (media + broadcast fields)
  const data=await epLoadStatic();
  if(!data)return 'EP links: data/ep-players.json not published yet — names link to EP search meanwhile';
  const teams=[['Huntsville Havoc',DATA.roster]];
  if(scope==='all')Object.keys(DATA.oppRosters||{}).forEach(t=>teams.push([t,DATA.oppRosters[t]]));
  else{const opp=(DATA.game&&DATA.game.opp)||'';if(opp&&DATA.oppRosters&&DATA.oppRosters[opp])teams.push([opp,DATA.oppRosters[opp]]);}
  let linked=0,already=0;const miss=[];
  teams.forEach(pair=>{
    (pair[1]||[]).forEach(p=>{
      if(!p.name||p.active==='0')return;
      const e=epEntryFor(p);
      if(!e){miss.push(p.name);return;}
      if(e.epId)p.epId=String(e.epId);
      if(e.epUrl&&p.epUrl!==e.epUrl){p.epUrl=e.epUrl;linked++;}
      else if(e.epUrl)already++;
      if(!p.birth&&e.hometown)p.birth=e.hometown; // header facts only — never bios
      if(!p.dob&&e.dob){p.dob=htDobFmt(e.dob)||p.dob;p.dobi=p.dobi||e.dob;if(!p.age)p.age=htAgeFrom(e.dob);}
      // previous stop: the last career line that isn't this club — fills the "from" header fact
      if(!p.from&&Array.isArray(e.careerStats)&&e.careerStats.length){
        const prev=[...e.careerStats].reverse().find(c=>c&&c.team&&norm(c.team)!==norm(pair[0]));
        if(prev)p.from=prev.team+(prev.league?' ('+prev.league+')':'');
      }
    });
  });
  save();renderRoster();if(typeof renderOppRoster==='function')renderOppRoster();
  DATA.report.epMiss=miss;save();
  // name the ones that missed rather than reporting a bare count
  const names=miss.slice(0,6).join(', ')+(miss.length>6?' +'+(miss.length-6)+' more':'');
  return 'EP links: '+linked+' newly linked'+(already?', '+already+' already had one':'')
    +(miss.length?' · no match for '+names+' (they link to EP search)':'');
}
async function epFillHome(){try{toast(await epAutoBios('home'));}catch(e){toast(e.message);}}
async function htPullEPBios(){try{htStatus('Linking Elite Prospects profiles (all teams)…','');htStatus(await epAutoBios('all'),true);}catch(e){htStatus(e.message,false);}}

function htShowLastSync(){
  const el=document.getElementById('htLastSync');if(!el)return;
  const ls=DATA.report&&DATA.report.lastSync;
  el.textContent=ls?('Last full sync: '+new Date(ls).toLocaleString()+' — data saved in this browser.'):'';
}

/* ============================================================
   SPHL DAILY REPORT — keyless baseline data.
   A nightly GitHub Action fetches the public daily report and
   commits data/sphl-daily.json; the site loads it as the data
   floor. The same shared parser (js/daily-report-parser.js)
   powers manual import: upload a saved daily-report.html or
   paste the page. Live feed data overlays this when it works.
   ============================================================ */
function dailyCityOf(t){
  t=String(t||'').trim();
  if(TEAM_ABBR[t])return t;
  const byAb=Object.keys(TEAM_ABBR).find(c=>TEAM_ABBR[c]===t.toUpperCase());
  if(byAb)return byAb;
  const byPrefix=Object.keys(TEAM_ABBR).find(c=>t.indexOf(c)===0);
  if(byPrefix)return byPrefix;
  return t.replace(/\s+(Havoc|Bulls|Thunderbolts|Marksmen|Ice Bears|Mayhem|Ice Flyers|Rivermen|Storm|Rail Yard Dawgs|Rock Lobsters|IceCats|Mysticks)$/,'');
}
function applyDailyReport(rep,label){
  const counts=[];
  const r=DATA.report;
  if(rep.parsed.standings){
    r.standings=rep.standings.map(s=>({team:dailyCityOf(s.team),gp:s.gp,w:s.w,l:s.l,otl:s.otl,sol:s.sol,pts:s.pts,gf:s.gf,ga:s.ga}));
    counts.push('Standings ✓ ('+r.standings.length+')');
  }else counts.push('Standings ✗');
  r.teamStats=r.teamStats||{};
  let sk=0,gl=0;
  (rep.skaters||[]).forEach(p=>{
    const c=dailyCityOf(p.team);if(!c)return;
    const t=r.teamStats[c]=r.teamStats[c]||{players:[],goalies:[]};
    const ex=t.players.find(x=>norm(x.name)===norm(p.name));
    if(ex){ex.gp=p.gp;ex.g=p.g;ex.a=p.a;ex.pts=p.pts;if(p.pim!=null)ex.pim=p.pim;if(p.pm!=null)ex.pm=p.pm;if(p.pp!=null)ex.pp=p.pp;if(p.shg!=null)ex.shg=p.shg;if(p.gw!=null)ex.gw=p.gw;}
    else t.players.push({num:'',name:p.name,pos:'',gp:p.gp,g:p.g,a:p.a,pts:p.pts,pm:p.pm||0,pim:p.pim||0,pp:p.pp||0,shg:p.shg||0,gw:p.gw||0,shots:0,shpct:''});
    sk++;
  });
  (rep.goalies||[]).forEach(p=>{
    const c=dailyCityOf(p.team);if(!c)return;
    const t=r.teamStats[c]=r.teamStats[c]||{players:[],goalies:[]};
    const ex=t.goalies.find(x=>norm(x.name)===norm(p.name));
    if(ex){ex.gp=p.gp;ex.w=p.w;ex.l=p.l;ex.otl=p.otl;ex.so=p.so;ex.ga=p.ga;ex.gaa=p.gaa;ex.svpct=p.svpct;if(p.sa)ex.sa=p.sa;if(p.svs)ex.svs=p.svs;}
    else t.goalies.push({num:'',name:p.name,gp:p.gp,w:p.w,l:p.l,otl:p.otl,so:p.so,ga:p.ga,gaa:p.gaa,sa:p.sa||0,svs:p.svs||0,svpct:p.svpct});
    gl++;
  });
  counts.push('Skaters '+(sk?'✓ ('+sk+')':'✗'));
  counts.push('Goaltenders '+(gl?'✓ ('+gl+')':'✗'));
  if(rep.parsed.specialTeams){
    r.special=r.special||{};
    (rep.specialTeams.pp||[]).forEach(x=>{const c=dailyCityOf(x.team);r.special[c]=r.special[c]||{};r.special[c].pp=x.pct;});
    (rep.specialTeams.pk||[]).forEach(x=>{const c=dailyCityOf(x.team);r.special[c]=r.special[c]||{};r.special[c].pk=x.pct;});
    counts.push('Special teams ✓');
  }else counts.push('Special teams ✗');
  if(rep.parsed.leaders)r.leaders=Object.assign(r.leaders||{},rep.leaders);
  r.parsedAt=new Date().toISOString();
  r.daily={label:label,date:rep.generatedDate||'',at:r.parsedAt};syncMark('daily');
  syncRosterStats();save();
  if(typeof renderStandings==='function')try{renderStandings();}catch(e){}
  dailyBadge();
  return counts.join(' · ');
}
function dailyBadge(){
  const el=document.getElementById('dailyBadge');if(!el)return;
  const d=DATA.report&&DATA.report.daily;
  el.textContent=d?('Baseline: SPHL daily report — '+(d.date||'date unknown')+' · '+d.label):'';
}
function importDailyHTMLText(html,label){
  if(typeof SPHLDailyReport==='undefined'){
    const sum=document.getElementById('importSummary');
    if(sum){sum.style.display='block';sum.innerHTML='<b>Daily-report parser not loaded.</b> Keep <i>js/daily-report-parser.js</i> next to index.html (it ships with the site), or paste the PDF text instead.';}
    toast('Parser file missing');return;
  }
  let rep;
  try{rep=SPHLDailyReport.parse(html);}catch(e){toast('Parse failed: '+e.message);return;}
  const ok=Object.values(rep.parsed).some(Boolean);
  // a hand upload always wins (his action) — but say so when it's older than the live sync
  const summary=ok?applyDailyReport(rep,label)
    +(dailyStaleVsFeed(rep)?' · ⚠ this report ('+(rep.generatedDate||'date unknown')+') is OLDER than your live stats sync — a Game Day Refresh restores the newer numbers':'')
    :'nothing recognized in that content';
  const pill=document.getElementById('parseResult');
  if(pill)pill.innerHTML=ok?'<span class="pill ok">Imported</span>':'<span class="pill warn">Nothing recognized</span>';
  const sum=document.getElementById('importSummary');
  if(sum){sum.style.display='block';sum.innerHTML='<b>Daily report ('+esc(label)+(rep.generatedDate?' — '+esc(rep.generatedDate):'')+'):</b> '+esc(summary);}
  toast(ok?'Daily report imported':'Could not read that as a daily report');
}
function dailyFilePick(e){
  const f=e.target.files[0];if(!f)return;
  const rd=new FileReader();
  rd.onload=()=>importDailyHTMLText(String(rd.result),'manual upload: '+f.name);
  rd.readAsText(f);
  e.target.value='';
}
/* The keyless daily report is the fallback FLOOR — it must never overwrite a
   fresher keyed pull. Offseason the league keeps serving the FINAL report of
   last season (the playoffs), so a report clearly older than the live stats
   sync is held, not applied. Judged on the report's own generatedDate — the
   nightly fetch stamp changes daily even when the content is months old. */
function dailyStaleVsFeed(rep){
  const rd=Date.parse(String(rep.generatedDate||'')+'T12:00')||Date.parse(rep.fetchedAt||'')||0;
  const feed=Math.max(syncAt('players')||0,syncAt('standings')||0);
  if(feed&&rd&&(feed-rd)>3*86400000)return true;   // >3 days older than the live sync
  // Fresh browser floor: with no live sync yet there is nothing to compare against,
  // but in-season the report is daily — one more than 30 days old can only be last
  // season's leftovers (the offseason playoff report), and must not present itself
  // as current. Auto path only; a manual import always applies.
  return !!(rd&&(Date.now()-rd)>30*86400000);
}
async function dailyAutoLoad(){
  try{
    const res=await fetch('data/sphl-daily.json',{cache:'no-cache'});
    if(!res.ok)return;
    const j=await res.json();
    if(!j||!j.parsed)return;
    if(dailyStaleVsFeed(j)){
      const el=document.getElementById('dailyBadge');
      const synced=Math.max(syncAt('players')||0,syncAt('standings')||0);
      if(el)el.textContent='Daily report held — the league is still serving the '+(j.generatedDate||'?')+' report (last season’s); '
        +(synced?'your live stats sync is newer and wins.':'it is more than 30 days old and would print old numbers as current. A manual import on Live Data still applies it.');
      return;   // no stamp — re-checked next load, applies again once a fresh report ships
    }
    const stamp=j.fetchedAt||j.generatedDate||'';
    if(DATA.report.dailyStamp===stamp){dailyBadge();return;}
    applyDailyReport(j,'auto (nightly GitHub Action)');
    DATA.report.dailyStamp=stamp;save();
  }catch(e){}
}
async function htPull(label,fn){
  try{
    htStatus(label+'…','');
    await htEnsureReady('');
    htStatus(label+': '+await fn(),true);
  }catch(e){htStatus(e.message,false);}
}
async function htPullStandings(){await htPull('Standings',htDoStandings);}
async function htPullPlayers(){await htPull('Player + goalie stats',htDoPlayers);}
async function htPullSchedule(){await htPull('Schedule + results',htDoResults);}
async function htPullRosters(){
  // roster pull automatically chains into EP career lookups for the new players
  await htPull('Rosters',async()=>{
    const r=await htDoRosters();
    let ep='';try{ep=await epAutoBios('auto');}catch(e){ep='EP bios failed ('+e.message+')';}
    return r+' · '+ep;
  });
}
let HT_SYNCING=false;
/* ---- Game Day Refresh: one button, everything tonight needs, step by step ---- */
const GD_STEPS=[
  ['connect','Connect + confirm the season'],
  ['standings','League standings'],
  ['players','Player + goalie stats'],
  ['schedule','Schedule + final scores'],
  ['rosters','Every team roster'],
  ['careers','Havoc career stats + headshots'],
  ['eplinks','Elite Prospects profile links'],
  ['scorebar','Tonight&rsquo;s scoreboard']
];
function gdRender(state){
  const el=document.getElementById('htSteps');if(!el)return;
  el.innerHTML=GD_STEPS.map(([k,label])=>{
    const s=state[k]||{};
    const mark=s.status==='ok'?'&#10003;':(s.status==='bad'?'&#10007;':(s.status==='run'?'&#9679;':'&#9675;'));
    return `<li class="${s.status||''}"><span class="gd-mark">${mark}</span><span>${label}</span>${s.note?`<span class="gd-note">— ${esc(s.note)}</span>`:''}</li>`;
  }).join('');
}
async function htSyncAll(){
  if(HT_SYNCING)return;HT_SYNCING=true;
  const btn=document.getElementById('htSyncBtn');if(btn){btn.disabled=true;btn.textContent='⟳ Refreshing…';}
  const state={};
  const run=async(key,fn)=>{
    state[key]={status:'run'};gdRender(state);
    try{const note=await fn();state[key]={status:'ok',note:note||'done'};}
    catch(e){state[key]={status:'bad',note:e.message};}
    gdRender(state);
    return state[key].status==='ok';
  };
  gdRender(state);
  DATA.report.seasonUsed={};DATA.report.seasonFallback={};
  const connected=await run('connect',async()=>{
    const hadKey=!!htKey();
    let note='';
    try{
      await htGetSeasons('');
      // a season we no longer recognise (or none at all) goes back to the rule:
      // the highest regular season the league lists
      if(!seasonById(activeSeasonId())){
        const d=seasonDefault();
        if(d){DATA.settings.htSeason=d.id;save();note='season reset to the current one · ';}
      }
      renderSeasonBar();
    }catch(e){
      if(!seasonList().length)throw e;
      note='season list offline · ';
    }
    const s=activeSeason();
    if(seasonStale(s))throw new Error('Season looks wrong ('+(s?s.name:activeSeasonId())+') — pick a season above.');
    return (hadKey?'':'key auto-detected · ')+note+seasonLabelOf(activeSeasonId());
  });
  const skipAll=!connected;
  const step=(k,fn)=>run(k,async()=>{
    if(skipAll)throw new Error('skipped — the season is not settled');
    return await fn();
  });
  await step('standings',()=>htDoStandings());
  await step('players',()=>htDoPlayers());
  await step('schedule',()=>htDoResults());
  const rostersOK=await step('rosters',()=>htDoRosters());
  await step('careers',async()=>{
    if(!rostersOK)throw new Error('skipped — rosters did not load');
    seasonUsed('careers',activeSeasonId(),false);
    return seasonStepNote('careers',await htPullCareers(false,true));
  });
  await step('eplinks',async()=>{
    if(!rostersOK)throw new Error('skipped — rosters did not load');
    seasonUsed('eplinks',((DATA.report||{}).seasonUsed||{}).rosters||activeSeasonId(),
      !!((DATA.report||{}).seasonFallback||{}).rosters);
    return seasonStepNote('eplinks',await epAutoBios('auto'));
  });
  await step('scorebar',async()=>{sbStart();seasonUsed('scorebar',activeSeasonId(),false);return seasonStepNote('scorebar','refreshing');});
  DATA.report.lastSync=new Date().toISOString();BK_LAST=0;save();htShowLastSync();renderSyncBadges();
  const bad=Object.keys(state).filter(k=>state[k].status==='bad');
  htStatus(bad.length?('Finished with '+bad.length+' step'+(bad.length>1?'s':'')+' failing — see the list above. Everything that did load is saved.')
    :('Game Day Refresh complete — saved locally '+new Date().toLocaleTimeString()+'.'),!bad.length);
  feedChip(bad.length<GD_STEPS.length);
  HT_SYNCING=false;if(btn){btn.disabled=false;btn.textContent='⟳ Game Day Refresh';}
}
/* the connection check runs itself on load and reports as a chip */
function feedChip(ok,msg){
  const el=document.getElementById('feedChip'),m=document.getElementById('feedChipMsg');
  if(!el||!m)return;
  el.className='feed-chip '+(ok===null?'checking':(ok?'ok':'off'));
  m.textContent=msg||(ok===null?'Checking the feed…':(ok?'Feed: connected ✓':'Feed: offline — using cached data'));
}
async function feedAutoCheck(){
  feedChip(null);
  try{
    const seasons=await Promise.race([htGetSeasons(''),new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),10000))]);
    if(seasons.length)renderSeasonBar();
    feedChip(true);
  }catch(e){
    const any=['standings','players','rosters','schedule'].some(k=>syncAt(k));
    feedChip(false,any?'Feed: offline — showing data saved '+syncTimeStr(Math.max(...['standings','players','rosters','schedule'].map(syncAt)))
      :'Feed: offline — no data saved in this browser yet');
  }
}



/* Auto-detect a working public feed key (candidates from open-source HockeyTech projects).
   All candidates are probed in parallel with a short timeout; first one that answers wins. */
/* ---- SPHL HockeyTech feed — working key + verified endpoints (Aug 2026) ----
   key=8fa10d218c49ec96  client_code=sphl   base=https://lscluster.hockeytech.com/feed/
   VERIFIED:
     skater stats   ?feed=statviewfeed&view=players&season=<id>&team=all&position=skaters&statsType=standard&first=0&limit=200&sort=points&lang=en&division=-1&conference=-1
     goalie stats   same with position=goalies&sort=gaa
     seasons list   ?feed=modulekit&view=seasons&fmt=json&lang=en   (44=2025-26 REG · 45=2026 playoffs · 46=2026-27 REG)
   ALL VALIDATED by the ht-probe Action (Aug 5, 2026 — see its logs):
     standings      ?feed=statviewfeed&view=teams&season=<id>&groupTeamsBy=division&context=overall&special=false&sort=points   (sections array)
     standings alt  ?feed=modulekit&view=statviewtype&stat=conference&type=standings&season_id=<id>&fmt=json
     scorebar       ?feed=modulekit&view=scorebar&numberofdaysahead=7&numberofdaysback=3&fmt=json      (30 games seen)
     schedule       ?feed=modulekit&view=schedule&season_id=46&fmt=json                                 (360 games — full 2026-27 slate)
     roster         ?feed=modulekit&view=roster&season_id=<id>&team_id=<id>&fmt=json
   GOTCHAS (all confirmed by probe):
   · statviewfeed bodies arrive wrapped in ( … ) — strip before JSON.parse; modulekit is bare
   · the server returns an EMPTY 200 whenever an Origin header is present and sends no CORS
     headers — so a bare cross-origin fetch() from GitHub Pages gets nothing. Browser access
     MUST go through JSONP (script tags send no Origin; callback= confirmed working) or a
     proxy, which is exactly the order htFetch uses. Server-side (Actions) plain fetch is fine.
   · some modulekit views answer bad requests with the SEASONS LIST instead of an error —
     htGuard() below treats that as a wrong-endpoint signal, never as "API down". */
const HT_CANDIDATE_KEYS=['8fa10d218c49ec96','41b145a848f4bd67','ccb91f29d6744675','2976319eb44abe94','f1aa699db3d81487','446521baf8c38984','c680916776709578','50c2cd9b5e18e390','f322673b6bcae299'];
async function htProbeKeys(keys){
  const probes=keys.map(k=>
    htFetch({feed:'modulekit',view:'seasons'},k,7000).then(d=>{
      const seasons=(d&&d.SiteKit&&d.SiteKit.Seasons)||[];
      if(!seasons.length)throw new Error('no seasons');
      return {key:k,seasons};
    })
  );
  try{return await Promise.any(probes);}catch(e){return null;}
}
async function htAutoKey(statusPrefix){
  htStatus((statusPrefix||'')+'trying '+HT_CANDIDATE_KEYS.length+' known public keys…','');
  let win=await htProbeKeys(HT_CANDIDATE_KEYS);
  if(!win){ // none of the known keys answer — pull the real one off the league's site
    try{
      const scraped=await htScrapeKeys(statusPrefix);
      if(scraped.length){
        htStatus((statusPrefix||'')+'found '+scraped.length+' possible key(s) on the league site — testing…','');
        win=await htProbeKeys(scraped);
      }
    }catch(e){}
  }
  if(!win)return null;
  DATA.settings.htKey=win.key;save();
  const inp=document.getElementById('ht_key');if(inp)inp.value=win.key;
  return win;
}
