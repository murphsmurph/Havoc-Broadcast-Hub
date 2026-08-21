/* Booth — the surfaces driven live during a game, on a phone or the booth
   machine: the league-wide scorebar, the Game Day view (Pillar 2) and the
   Learn the Rosters study drill. Extracted verbatim in the P3 split; they read
   the same canonical rosters, lines and milestone data every printed page uses. */

/* ============================================================
   LIVE SCOREBAR — league-wide scores with smart polling:
   60s while games are on (or about to start), 15 min otherwise,
   fully paused while the tab is hidden.
   ============================================================ */
let SB_TIMER=null,SB_LAST=0,SB_HASGAMES=false;
function sbMsg(html){const el=document.getElementById('sbStrip');if(el)el.innerHTML='<div class="sb-msg">'+html+'</div>';}
function sbStatusOf(g){
  const s=String(pick(g,['GameStatusString','game_status_string','GameStatusStringLong','game_status'],'')).trim();
  const period=String(pick(g,['Period','period'],'')).trim(),clock=String(pick(g,['GameClock','game_clock'],'')).trim();
  if(/progress|live/i.test(s)&&period&&clock)return period+' · '+clock;
  if(s)return s;
  return String(pick(g,['ScheduledFormattedTime','scheduled_time'],'')).trim()||'Scheduled';
}
function sbIsLive(g){
  const s=String(pick(g,['GameStatusString','GameStatusStringLong','game_status'],''));
  if(/final|unofficial/i.test(s))return false;
  if(/progress|live/i.test(s))return true;
  return String(pick(g,['GameStatus','game_status_code'],''))==='2';
}
/* one formatter for every strip — Live Data, This Game and Game Day all show
   the same cards, only their filters differ */
function sbGamesHTML(games){
  return games.map(g=>{
    const vc=String(pick(g,['VisitorCode','visiting_team_code'],''))||String(pick(g,['VisitorCity','visiting_team_city'],'')).slice(0,3).toUpperCase();
    const hc=String(pick(g,['HomeCode','home_team_code'],''))||String(pick(g,['HomeCity','home_team_city'],'')).slice(0,3).toUpperCase();
    const vg=String(pick(g,['VisitorGoals','visiting_goal_count'],'')),hg=String(pick(g,['HomeGoals','home_goal_count'],''));
    const live=sbIsLive(g);
    const started=live||/final/i.test(String(pick(g,['GameStatusString','GameStatusStringLong'],'')));
    const hav=/HSV|Huntsville/i.test(vc+String(pick(g,['VisitorCity'],''))+hc+String(pick(g,['HomeCity'],'')));
    const date=String(pick(g,['GameDateISO8601','date_played','Date'],'')).slice(5,10).replace('-','/');
    return '<div class="sb-game'+(live?' sb-live':'')+(hav?' sb-hav':'')+'">'+
      '<div class="sb-row"><span>'+esc(vc)+'</span><span class="sb-score">'+(started?esc(vg):'')+'</span></div>'+
      '<div class="sb-row"><span>@ '+esc(hc)+'</span><span class="sb-score">'+(started?esc(hg):'')+'</span></div>'+
      '<div class="sb-status">'+esc(date)+' · '+esc(sbStatusOf(g))+'</div></div>';
  }).join('');
}
function sbTonightOf(games){
  const today=new Date().toISOString().slice(0,10);
  return games.filter(g=>String(pick(g,['GameDateISO8601','date_played','Date'],'')).slice(0,10)===today);
}
function sbRender(games){
  const el=document.getElementById('sbStrip');if(!el)return;
  if(!games.length){sbMsg('No SPHL games scheduled in this window (2 days back → 7 days ahead).');SB_HASGAMES=false;return;}
  SB_HASGAMES=true;
  el.innerHTML=sbGamesHTML(games);
}
/* This Game and Game Day carry read-only strips: tonight's games only, no
   controls. The full feed lives on Live Data — one place to pull. */
function sbTonightInto(id,games){
  const el=document.getElementById(id);if(!el)return;
  const src=(games&&games.length?games:sbCacheGames())||[];
  if(!src.length){el.innerHTML='<div class="sb-msg">No scores yet — run a Game Day Refresh on Live Data.</div>';return;}
  const tonight=sbTonightOf(src);
  if(!tonight.length){el.innerHTML='<div class="sb-msg">No SPHL games today. The week ahead is on the Live Data tab.</div>';return;}
  el.innerHTML=sbGamesHTML(tonight);
}
function gmScorebar(games){sbTonightInto('gmScorebar',games);}
function gdayScorebar(games){
  sbTonightInto('gdayScorebar',games);
  if(typeof gdayLiveBanner==='function')gdayLiveBanner(games);
}
function sbInterval(games){
  if(games.some(sbIsLive))return 60000;
  const now=Date.now();
  const nearGame=games.some(g=>{
    const iso=String(pick(g,['GameDateISO8601'],''));
    if(!iso)return false;
    const t=Date.parse(iso);
    return !isNaN(t)&&now>=t-15*60000&&now<=t+3.5*3600000;
  });
  return nearGame?60000:15*60000;
}
/* three states, always resolved: loading (capped at 10s) → loaded, or failed
   with a retry and whatever was cached last time */
function sbState(state,msg,retry){
  const box=document.getElementById('sbState');if(!box)return;
  box.className='sb-state '+state;
  const m=document.getElementById('sbStateMsg');if(m)m.textContent=msg;
  const r=document.getElementById('sbRetry');if(r)r.style.display=retry?'':'none';
}
function sbCacheSave(games){DATA.sbCache={at:new Date().toISOString(),games:games.slice(0,24)};try{save();}catch(e){}}
function sbCacheGames(){return ((DATA.sbCache||{}).games)||[];}
function sbRetry(){sbState('loading','Reconnecting to the league feed…',false);sbStart();}
async function sbTick(){
  if(document.hidden)return; // polling stops here; visibilitychange restarts it
  let games=[];
  if(!SB_HASGAMES)sbState('loading','Connecting to the league feed…',false);
  try{
    const d=await Promise.race([
      htFetch({feed:'modulekit',view:'scorebar',numberofdaysback:2,numberofdaysahead:7,season_id:activeSeasonId()}),
      new Promise((_,rej)=>setTimeout(()=>rej(new Error('the feed did not answer within 10 seconds')),10000))
    ]);
    games=(d&&d.SiteKit&&(d.SiteKit.Scorebar||d.SiteKit.Games))||[];
    sbRender(games);sbCacheSave(games);gmScorebar(games);gdayScorebar(games);
    SB_LAST=Date.now();syncMark('scorebar');
    sbState('loaded','League feed connected · '+syncLabel('scorebar').toLowerCase(),false);
    const st=document.getElementById('sbStamp');if(st)st.textContent='Last updated '+new Date().toLocaleTimeString();
  }catch(e){
    const cached=sbCacheGames();
    if(cached.length){sbRender(cached);SB_HASGAMES=true;}
    gmScorebar(cached);gdayScorebar(cached);
    const when=syncAt('scorebar');
    sbState('failed',
      'Live scores unavailable — '+e.message+'.'+(cached.length&&when?' Showing cached data from '+syncTimeStr(when)+'.':' No cached scores to fall back on yet.'),
      true);
    const st=document.getElementById('sbStamp');if(st)st.textContent=when?'Cached '+syncTimeStr(when)+' — will keep retrying':'';
  }
  clearTimeout(SB_TIMER);
  SB_TIMER=setTimeout(sbTick,sbInterval(games));
}
function sbStart(){clearTimeout(SB_TIMER);sbTick();}

/* ============================================================
   GAME DAY — the booth view (Pillar 2). One screen for the live
   call: tonight's context, lineups, jersey lookup, the milestone
   watch, quick stats and a notes pad. Strictly a view over data
   the other tabs already own — it computes nothing new.
   ============================================================ */
function gdayOppList(){return (DATA.game.opp&&DATA.oppRosters[DATA.game.opp])||[];}
function gdayOppKw(){return teamCity(DATA.game.opp)||'zzz-none';}
/* P2 — the Havoc game itself, big: score, period and clock from the scorebar
   feed (same 60s poll, no new timers), the manual next-break line beside it,
   and a refresh nudge the moment the game goes final. */
function gdayLiveBanner(games){
  const el=document.getElementById('gdayLive');if(!el)return;
  const src=(games&&games.length?games:sbCacheGames())||[];
  const g=sbTonightOf(src).find(x=>{
    const s=String(pick(x,['VisitorCode','visiting_team_code'],''))+String(pick(x,['VisitorCity'],''))
           +String(pick(x,['HomeCode','home_team_code'],''))+String(pick(x,['HomeCity'],''));
    return /HSV|Huntsville/i.test(s);
  });
  const brk=String(((DATA.gameday||{}).break)||'').trim();
  const brkHTML=brk?`<div class="gday-break"><span class="lab">NEXT BREAK</span>${esc(brk)}</div>`:'';
  if(!g){el.innerHTML=brkHTML;return;}
  const vc=String(pick(g,['VisitorCode','visiting_team_code'],''))||String(pick(g,['VisitorCity'],'')).slice(0,3).toUpperCase();
  const hc=String(pick(g,['HomeCode','home_team_code'],''))||String(pick(g,['HomeCity'],'')).slice(0,3).toUpperCase();
  const vg=String(pick(g,['VisitorGoals','visiting_goal_count'],'')),hg=String(pick(g,['HomeGoals','home_goal_count'],''));
  const live=sbIsLive(g);
  const fin=/final/i.test(String(pick(g,['GameStatusString','GameStatusStringLong'],'')));
  const started=live||fin;
  el.innerHTML=`<div class="gday-livegame${live?' is-live':''}">
    <span class="gday-score">${esc(vc)} ${started?esc(vg):''} <span class="gday-at">@</span> ${started?esc(hg):''} ${esc(hc)}</span>
    <span class="gday-clock">${esc(sbStatusOf(g))}</span>
    ${fin?`<button class="btn small no-print" onclick="gdaySync()">Final — refresh stats</button>`:''}
  </div>`+brkHTML;
}
function gdayHeader(){
  const el=document.getElementById('gdayHeader');if(!el)return;
  const G=DATA.game;
  if(!G.opp&&!G.date){
    el.innerHTML=`<div class="gday-title">Game Day</div><div class="gday-sub">Set tonight's opponent and date on <a href="javascript:void 0" onclick="showTab('game')">This Game</a> — everything here follows it.</div>`;
  }else{
    const dateStr=G.date?new Date(G.date+'T12:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}):'—';
    const promo=promoFor(G.date)||G.promo||'';
    const bits=[[dateStr+(G.time?' · '+esc(G.time):'')],
      [G.venue?esc(G.venue):null],
      [promo?'<b>'+esc(promo)+'</b>':null],
      [G.broadcast?esc(G.broadcast):null],
      [[G.ref1,G.ref2].filter(Boolean).length?'Referees: '+esc([G.ref1,G.ref2].filter(Boolean).join(' · ')):null],
      [[G.lin1,G.lin2].filter(Boolean).length?'Linesmen: '+esc([G.lin1,G.lin2].filter(Boolean).join(' · ')):null]
    ].map(x=>x[0]).filter(Boolean);
    el.innerHTML=`<div class="gday-title">HAVOC ${esc(G.homeaway||'vs')} ${esc((G.opp||'—').toUpperCase())}${G.ps?' <span class="pill warn" style="vertical-align:middle">PRESEASON</span>':''}</div>
      <div class="gday-sub">${bits.join(' &nbsp;·&nbsp; ')}</div>`;
  }
  const un=document.getElementById('gdayUpNext');if(un)un.innerHTML=upNextBox();
}
/* one player, booth-sized: number, air name, pronunciation, red stat line */
function gdayPlayerHTML(p,kw,tag){
  const pron=fdPron(p);
  return `<div class="gday-p${p.active==='0'?' gday-scr':''}">
    <span class="gday-num">${p.num?'#'+esc(p.num):'—'}</span>
    <span class="gday-name">${esc(dispName(p))}</span>
    ${p.pos?`<span class="gday-pos">${esc(p.pos)}</span>`:''}
    ${pron?`<span class="gday-pron">${esc(pron)}</span>`:''}
    ${statSpan(p,kw)}
    ${tag?`<span class="gday-tag">${esc(tag)}</span>`:''}
    ${p.active==='0'?'<span class="gday-tag">not dressed</span>':''}
    ${p.callNote?`<div class="gday-note">${esc(p.callNote)}</div>`:''}
  </div>`;
}
function gdayLineup(side){
  const G=DATA.game;
  const list=side==='home'?DATA.roster:gdayOppList();
  const kw=side==='home'?'Huntsville':gdayOppKw();
  const title=side==='home'?'Huntsville Havoc':(G.opp||'Opponent');
  const L=ensureLines()[side];
  const used=L.f.some(ln=>ln.some(v=>String(v||'').trim()))||L.d.some(pr=>pr.some(v=>String(v||'').trim()))||L.g.some(v=>String(v||'').trim());
  const cell=v=>{
    const t=String(v||'').trim();if(!t)return '';
    const p=lineResolve(v,list);
    return p?gdayPlayerHTML(p,kw):`<div class="gday-p"><span class="gday-name">${esc(t)}</span></div>`;
  };
  let body='';
  if(used){
    const sec=(label,rows)=>{
      const filled=rows.map(r=>r.map(cell).join('')).filter(Boolean);
      const out=rows.map((r,i)=>{const c=r.map(cell).join('');return c?`<div class="gday-line"><span class="gday-lnum">${label==='G'?'G':(i+1)}</span>${c}</div>`:'';}).join('');
      return out?`<div class="gday-sec">${label==='G'?'Goaltenders':label==='F'?'Forward lines':'Defense pairs'}</div>${out}`:'';
    };
    body=sec('F',L.f)+sec('D',L.d)+sec('G',[L.g]);
    if(!body)body=`<div class="gday-sub">Lines are blank — fill them on Print Center → Lines.</div>`;
  }else{
    // no lines entered: roster-order groups, dressed players only (call-sheet rule)
    const act=list.filter(p=>p.name&&p.active!=='0');
    const byNum=(a,b)=>(+a.num||999)-(+b.num||999);
    const grp=(label,rows)=>rows.length?`<div class="gday-sec">${label}</div>`+rows.sort(byNum).map(p=>gdayPlayerHTML(p,kw)).join(''):'';
    body=act.length
      ?grp('Forwards',act.filter(p=>p.pos!=='D'&&p.pos!=='G'))+grp('Defense',act.filter(p=>p.pos==='D'))+grp('Goaltenders',act.filter(p=>p.pos==='G'))
       +`<div class="gday-sub">Roster order — set tonight's lines on Print Center → Lines and they show here.</div>`
      :`<div class="gday-sub">${side==='home'?'No roster loaded yet — run a Game Day Refresh.':'No opponent roster yet — set the opponent on This Game, then run a Game Day Refresh.'}</div>`;
  }
  return `<div class="gday-team"><div class="gday-teamhead">${esc(title)}</div>${body}</div>`;
}
function gdayScratchStrip(){
  const G=DATA.game;
  const inact=DATA.roster.filter(p=>p.name&&p.active==='0').map(p=>(p.num?'#'+p.num+' ':'')+p.name);
  const rows=[
    ['Havoc scratches',G.scratch],['Havoc IR',G.ir],['ECHL call-ups',G.echl],['Suspension',G.susp],
    ['Marked not dressed',inact.join(', ')],
    ['Opponent scratches',G.oppScratch],['Opponent IR',G.oppIr],['Opponent ECHL',G.oppEchl],['Opponent suspension',G.oppSusp]
  ].filter(r=>String(r[1]||'').trim());
  return rows.length?`<div class="gday-strips">${rows.map(r=>`<div class="gday-strip"><b>${r[0]}:</b> ${esc(String(r[1]).replace(/\n/g,' · '))}</div>`).join('')}</div>`:'';
}
function gdayMsStrip(){
  const el=document.getElementById('gdayMs');if(!el)return;
  if(!MS_DATA){el.innerHTML=`<div class="gday-sub">Career data loading…</div>`;return;}
  const lines=msWatchLines('havoc',15);
  lines.push(...frBannerLines());
  const seen=new Set();
  const pills=lines.sort((a,b)=>a.away-b.away).filter(x=>!seen.has(x.html)&&seen.add(x.html))
    .map(x=>`<div class="ms-call">${x.html}</div>`).join('');
  const recs=recWatchRows().map(recRowHTML).join('');
  el.innerHTML=(pills?`<div class="ms-urgent">${pills}</div>`:`<div class="gday-sub">Nobody inside a milestone window tonight (50s/100s per the board's rules).</div>`)
    +(recs?`<div class="gday-recs">${recs}</div>`:'');
}
function gdayStats(){
  const el=document.getElementById('gdayStats');if(!el)return;
  const G=DATA.game;
  const keep=['Season Record','Last 10','Streak','Last Game','Goals For','Goals Against','Power Play','Penalty Kill'];
  const rows=matchupRows().filter(r=>keep.includes(r[0]));
  const oppLbl=teamCity(G.opp)||'Opponent';
  const tbl=`<table class="gday-t"><tr><th></th><th class="r">HSV</th><th class="r">${esc(oppLbl)}</th></tr>
    ${rows.map(r=>`<tr><td>${esc(r[0])}</td><td class="r">${r[1]}</td><td class="r">${r[2]}</td></tr>`).join('')}</table>`;
  const gs=glGames();
  const logLine=gs.length?`<div class="gday-sub">Game log: ${glRec(gs)} · streak ${glStreak(gs)} · last 10: ${glRec(gs.slice(-10))}</div>`:'';
  const leaders=(kw,label)=>{
    const ts=findTeamStats(kw);
    if(!ts)return `<div class="gday-team"><div class="gday-teamhead">${esc(label)}</div><div class="gday-sub">No 2026-27 stats yet — run a Game Day Refresh.</div></div>`;
    const sk=(ts.players||[]).slice().sort((a,b)=>(b.pts||0)-(a.pts||0)).slice(0,3);
    const gl=(ts.goalies||[]).slice().sort((a,b)=>(b.w||0)-(a.w||0))[0];
    return `<div class="gday-team"><div class="gday-teamhead">${esc(label)} leaders</div>
      ${sk.map(p=>`<div class="gday-p"><span class="gday-num">${p.num?'#'+esc(p.num):''}</span><span class="gday-name">${esc(p.name)}</span><span class="pstat">${p.g||0}G ${p.a||0}A ${p.pts||0}P</span></div>`).join('')||'<div class="gday-sub">—</div>'}
      ${gl?`<div class="gday-p"><span class="gday-num">${gl.num?'#'+esc(gl.num):''}</span><span class="gday-name">${esc(gl.name)}</span><span class="pstat">${gl.w||0}W ${gl.svpct?esc(String(gl.svpct))+' SV%':''} ${gl.gaa?esc(String(gl.gaa))+' GAA':''}</span></div>`:''}
    </div>`;
  };
  el.innerHTML=tbl+logLine+`<div class="gday-teams" style="margin-top:10px">${leaders('Huntsville','Havoc')}${G.opp?leaders(gdayOppKw(),G.opp):''}</div>`;
}
function gdayLookup(){
  const inp=document.getElementById('gdayFind'),out=document.getElementById('gdayFindOut');
  if(!inp||!out)return;
  const q=inp.value.trim();
  if(!q){out.innerHTML='';return;}
  const G=DATA.game;
  const pools=[['Havoc','Huntsville',DATA.roster],[teamCity(G.opp)||'Opponent',gdayOppKw(),gdayOppList()]];
  const hits=[];
  pools.forEach(([tag,kw,list])=>{
    list.forEach(p=>{
      if(!p.name)return;
      const hit=/^\d+$/.test(q)?String(p.num)===q
        :(p.name.toLowerCase().indexOf(q.toLowerCase())>=0||String(p.airName||'').toLowerCase().indexOf(q.toLowerCase())>=0);
      if(hit)hits.push(gdayPlayerHTML(p,kw,tag));
    });
  });
  out.innerHTML=hits.length?hits.slice(0,8).join(''):`<div class="gday-sub">No #${esc(q)} on either roster tonight.</div>`;
}
/* next-break line + live notes — game-night ephemera, autosaved in DATA */
function gdayNotesLoad(){
  const gd=DATA.gameday||{};
  const b=document.getElementById('gdayBreak'),n=document.getElementById('gdayNotes');
  if(b&&document.activeElement!==b)b.value=gd.break||'';
  if(n&&document.activeElement!==n)n.value=gd.notes||'';
  gdayNotesStamp();
}
function gdayNotesStamp(){
  const el=document.getElementById('gdayNotesStamp');if(!el)return;
  const at=(DATA.gameday||{}).at;
  el.textContent=at?'saved '+new Date(at).toLocaleTimeString():'';
}
function gdayNotesClear(){
  if(!confirm('Clear the next-break line and live notes?'))return;
  DATA.gameday={break:'',notes:'',at:''};save();gdayNotesLoad();toast('Notes cleared');
}
function gdayWire(){
  const box=document.getElementById('panel-gameday');
  if(!box||box._wired)return;
  box._wired=true;
  box.addEventListener('input',e=>{
    if(e.target.id==='gdayFind'){gdayLookup();return;}
    if(e.target.id!=='gdayNotes'&&e.target.id!=='gdayBreak')return;
    DATA.gameday=DATA.gameday||{break:'',notes:'',at:''};
    DATA.gameday[e.target.id==='gdayBreak'?'break':'notes']=e.target.value;
    DATA.gameday.at=new Date().toISOString();
    save();
    if(e.target.id==='gdayBreak')gdayLiveBanner();   // the banner echoes it live
    clearTimeout(box._nt);box._nt=setTimeout(gdayNotesStamp,400);
  });
}
async function gdaySync(){
  await htSyncAll();
  gdayRender();
}
function gdayRender(){
  gdayHeader();
  gdayScorebar();
  const lt=document.getElementById('gdayLinesTitle');
  if(lt)lt.innerHTML=`Tonight's <span class="accent">Lineups</span>`;
  const ln=document.getElementById('gdayLines');
  if(ln)ln.innerHTML=gdayLineup('home')+gdayLineup('opp');
  const sc=document.getElementById('gdayScratches');
  if(sc)sc.innerHTML=gdayScratchStrip();
  gdayStats();
  gdayMsStrip();
  gdayNotesLoad();
  gdayLookup();
  const gu=document.getElementById('gdayGuard');
  if(gu)gu.innerHTML=guardBannerHTML();
  renderSyncBadges();
}
/* ============ LEARN THE ROSTERS — slim study drill (bridge) ============
   Jersey-first: see the number, know the player. Reads the same canonical
   pools as the Game Day jersey lookup and the same DATA.lines the line card
   prints — no separate study roster. No scoring, levels or gamification;
   the optional missed-counter only biases repetition. */
let LEARN={deck:[],i:0,revealed:false};
function learnPools(){
  const t=val('learnTeam')||'home';
  const activeOnly=(document.getElementById('learnActive')||{}).checked!==false;
  const opp=DATA.game.opp||'';
  const pools=[];
  if(t==='home'||t==='both')pools.push(['home','Huntsville',DATA.roster]);
  if(t==='opp'||t==='both')pools.push(['opp',teamCity(opp)||'Opponent',(opp&&DATA.oppRosters[opp])||[]]);
  const out=[];
  pools.forEach(([side,lbl,list])=>(list||[]).forEach(p=>{
    if(!p.name||!p.num)return;
    if(activeOnly&&p.active==='0')return;
    out.push({side,lbl,p});
  }));
  return out;
}
function learnShuffle(a){
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}
function learnStart(){
  DATA.learn=DATA.learn||{miss:{}};
  const cards=learnPools();
  const deck=[];
  cards.forEach(c=>{deck.push(c);if((DATA.learn.miss||{})[c.p.name])deck.push(c);}); // missed twice next run
  LEARN={deck:learnShuffle(deck),i:0,revealed:false};
  learnRender();
}
function learnCram(){
  const sel=document.getElementById('learnTeam');if(sel)sel.value='opp';
  learnStart();
}
function learnLineOf(p,side){
  if(typeof ensureLines!=='function')return '';
  ensureLines();
  const L=DATA.lines[side==='home'?'home':'opp'];if(!L)return '';
  const list=side==='home'?DATA.roster:((DATA.game.opp&&DATA.oppRosters[DATA.game.opp])||[]);
  let hit='';
  const chk=(v,tag)=>{const q=lineResolve(v,list);if(q&&q.id===p.id)hit=tag;};
  L.f.forEach((ln,i)=>ln.forEach(v=>chk(v,'Line '+(i+1))));
  L.d.forEach((pr,i)=>pr.forEach(v=>chk(v,'Pair '+(i+1))));
  chk(L.g[0],'Starter');chk(L.g[1],'Backup');
  return hit;
}
function learnCardHTML(c,revealed){
  const dir=val('learnDir')||'num';
  const p=c.p;
  const numFront=`<div class="learn-front">#${esc(p.num)}</div>`;
  const nameFront=`<div class="learn-front learn-namefront">${esc(dispName(p))}</div>`;
  if(!revealed)return `<div class="learn-team">${esc(c.lbl)}</div>${dir==='num'?numFront:nameFront}`;
  const pron=fdPron(p);
  const line=learnLineOf(p,c.side);
  const ret=c.side==='home'
    ?(p.from?(/Huntsville/i.test(p.from)?'RETURNING':'NEW — from '+p.from):'')
    :(p.rookie==='1'?'ROOKIE':'');
  const tags=[p.pos||'',line,ret].filter(Boolean).map(esc).join(' · ');
  return `<div class="learn-team">${esc(c.lbl)}</div>${numFront}
    <div class="learn-back">${dir==='num'?`<span class="nm">${esc(dispName(p))}</span>`:''}
      ${pron?`<span class="learn-pron">${esc(pron)}</span><br>`:''}
      <span class="learn-tags">${tags}</span></div>`;
}
function learnProg(){
  const el=document.getElementById('learnProg');if(!el)return;
  el.textContent=LEARN.deck.length?('Card '+Math.min(LEARN.i+1,LEARN.deck.length)+' of '+LEARN.deck.length):'';
}
function learnRender(){
  const el=document.getElementById('learnCard');if(!el)return;
  const oppEl=document.getElementById('learnOppName');
  if(oppEl)oppEl.textContent=DATA.game.opp?('Opponent: '+DATA.game.opp):'Set the opponent on This Game for opponent study';
  const btns=document.getElementById('learnBtns');
  if(!LEARN.deck.length||LEARN.i>=LEARN.deck.length){
    el.innerHTML=LEARN.deck.length
      ?'<div class="learn-done">Deck done — '+LEARN.deck.length+' cards. Reshuffle to run it again.</div>'
      :'<div class="learn-tags">'+(learnPools().length
        ?'Press Start / reshuffle.'
        :'No players in that pool yet — opponents load from the committed roster file; a brand-new club appears once the league publishes its roster.')+'</div>';
    if(btns)btns.style.display='none';
    learnProg();return;
  }
  el.innerHTML=learnCardHTML(LEARN.deck[LEARN.i],LEARN.revealed);
  if(btns)btns.style.display='';
  document.getElementById('learnRevealBtn').style.display=LEARN.revealed?'none':'';
  document.getElementById('learnGotBtn').style.display=LEARN.revealed?'':'none';
  document.getElementById('learnMissBtn').style.display=LEARN.revealed?'':'none';
  learnProg();
}
function learnReveal(){LEARN.revealed=true;learnRender();}
function learnMark(got){
  DATA.learn=DATA.learn||{miss:{}};
  const c=LEARN.deck[LEARN.i];
  if(c){if(got)delete DATA.learn.miss[c.p.name];else DATA.learn.miss[c.p.name]=1;save();}
  LEARN.i++;LEARN.revealed=false;learnRender();
}
function learnInit(){
  learnRender();
  if(learnInit.wired)return;learnInit.wired=true;
  document.addEventListener('keydown',e=>{
    const sub=document.getElementById('panel-learn'),tab=document.getElementById('panel-rosters');
    if(!sub||!tab||!sub.classList.contains('active')||!tab.classList.contains('active'))return;
    if(e.key!==' '&&e.key!=='Enter')return;
    const t=e.target;if(t&&/INPUT|SELECT|TEXTAREA|BUTTON/.test(t.tagName))return;
    e.preventDefault();
    if(!LEARN.deck.length||LEARN.i>=LEARN.deck.length)learnStart();
    else if(!LEARN.revealed)learnReveal();
    else learnMark(1);
  });
}
async function gdayInit(){
  gdayWire();
  gdayRender();
  // careers (milestones/records) and bios (pronunciations) load async — render
  // once from what's here, then again when they land
  await Promise.all([msLoad(),biosLoad()]).catch(()=>{});
  gdayRender();
}

/* Hourly background refresh of standings + player stats (spec: hourly is plenty).
   Skips quietly when the tab is hidden or the feed isn't configured yet. */




