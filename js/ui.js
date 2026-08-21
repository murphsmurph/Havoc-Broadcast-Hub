/* UI — the screen surfaces that are neither the packet nor the booth: tabs and
   theme, the This Game form, the roster editors and bulk import, League
   Reference and the franchise files, Opening Weekend, headshots, venues, the
   career-stat pull, interviews, settings and backup, hockey operations, team
   colours, the auto-bio generators, report parsing helpers, the schedule tab
   and the line/pair entry both teams share. Extracted verbatim in the P3 split. */

/* ============ BOOTH DISPLAY (dark mode + type scale) ============
   Screen only: the print CSS resets both so PDFs are identical either way. */
const THEMES=['system','light','dark'];
function themeApply(){
  const t=DATA.settings.theme||'system';
  const dark=t==='dark'||(t==='system'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme',dark?'dark':'light');
  document.documentElement.setAttribute('data-booth',DATA.settings.booth?'1':'0');
  const b=document.getElementById('themeBtn');
  if(b)b.textContent='Theme: '+({system:'System',light:'Light',dark:'Dark'}[t])+(t==='system'?(dark?' (dark now)':' (light now)'):'');
  const bb=document.getElementById('boothBtn');
  if(bb)bb.textContent='Booth mode: '+(DATA.settings.booth?'On':'Off');
}
function themeCycle(){
  const cur=DATA.settings.theme||'system';
  DATA.settings.theme=THEMES[(THEMES.indexOf(cur)+1)%THEMES.length];
  save();themeApply();
}
function boothToggle(){DATA.settings.booth=DATA.settings.booth?0:1;save();themeApply();toast('Booth mode '+(DATA.settings.booth?'on — bigger type on screen only':'off'));}

/* ============ TABS ============ */
/* Merged panels (Rosters, Print Center) hold sub-views; last-used sub-view remembered per tab */
const SUBTABS={rosters:'roster',print:'packet'};
const SUB_INIT={
  roster:()=>{renderRoster();loadHockeyOps();},
  opproster:()=>renderOppRoster(),
  careers:()=>msInit(),
  learn:()=>learnInit(),
  packet:()=>{loadNotesExtra();pkRenderPicker();renderPacket();},
  chart:()=>renderChart(),
  lines:()=>linesInit(),
  folders:()=>renderFolders(),
  verbiage:()=>{vbLoad();renderVerbiage();}
};
function subShow(group,id){
  SUBTABS[group]=id;
  const wrap=document.getElementById('panel-'+group);if(!wrap)return;
  wrap.querySelectorAll('.subtab').forEach(b=>b.classList.toggle('active',b.dataset.sub===id));
  wrap.querySelectorAll('.subview').forEach(v=>v.classList.toggle('active',v.id==='panel-'+id));
  if(SUB_INIT[id])SUB_INIT[id]();
}
function showTab(tab){
  setTimeout(()=>{document.querySelectorAll('#tabs .tab').forEach(t=>t.setAttribute('aria-selected',t.classList.contains('active')?'true':'false'));},0);
  const btn=document.querySelector('#tabs .tab[data-tab="'+tab+'"]');if(!btn)return;
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t===btn));
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  const el=document.getElementById('panel-'+tab);if(el)el.classList.add('active');
  if(tab==='gameday')gdayInit();
  if(tab==='import'){loadSchedule();renderGameLog();renderSyncBadges();}
  if(tab==='game'){gmScorebar();renderSyncBadges();}
  if(tab==='rosters')subShow('rosters',SUBTABS.rosters);
  if(tab==='print')subShow('print',SUBTABS.print);
  if(tab==='reference'){renderReference();renderVenues();renderFranchise();}
  if(tab==='game')ivRender('pre');
  if(tab==='opening'){epLoadStatic().then(()=>{owLoad();owBuild();});}
  if(tab==='settings'){bkStatusRender();themeApply();}
}
/* Cmd/Ctrl+1..9 switches tabs (mac-first) */
/* Raw Cmd+P (macOS print dialog / Save as PDF) — mark the visible view so the
   print CSS shows it, and use landscape when the lineup chart is up */
let RAWPRINT=[];
/* Print Center shared toolbar — acts on the active sub-view */
/* ============ GAME TAB ============ */
function fillOpponents(){
  const opp=TEAMS.filter(t=>t!=="Huntsville Havoc").map(t=>`<option>${t}</option>`).join('');
  document.getElementById('g_opp').innerHTML='<option value="">— select —</option>'+opp;
  document.getElementById('oppRosterTeam').innerHTML='<option value="">— select team —</option>'+opp;
  document.getElementById('coachTeam').innerHTML='<option value="">— select team —</option>'+TEAMS.map(t=>`<option>${t}</option>`).join('');
}
/* Game # → schedule lookup: date, puck drop, venue, opponent, home/away, promo night */
function gameNoAutofill(){
  const n=parseInt(val('g_gameno'),10);if(!n)return;
  const games=parseScheduleData().filter(g=>!g.ps); // regular season only
  const g=games[n-1];
  if(!g){toast('No game #'+n+' on the saved schedule');return;}
  setv('g_date',g.dateISO);
  // a numbered game is regular season by definition — clear a leftover
  // preseason flag from a previously loaded exhibition
  const psEl=document.getElementById('g_ps');if(psEl)psEl.checked=false;
  if(g.time){
    const el=document.getElementById('g_time');
    const m=g.time.match(/(\d{1,2}):(\d{2})\s*([AP])/i);
    if(el&&el.type==='time'&&m){let h=(+m[1])%12;if(/p/i.test(m[3]))h+=12;el.value=String(h).padStart(2,'0')+':'+m[2];}
    else setv('g_time',g.time);
  }
  const full=TEAMS.find(t=>t.toLowerCase().startsWith(g.team.toLowerCase()))||g.team;
  setv('g_opp',full);
  setv('g_homeaway',g.hv==='@'?'@':'vs');
  if(g.hv!=='@')setv('g_venue',DATA.settings.venue); // road venue left as-is for hand entry
  const promo=(typeof promoFor==='function')?promoFor(g.dateISO):'';
  if(promo)setv('g_promo',promo);else if(g.note)setv('g_promo',g.note);
  updatePromoField();
  saveGame();
  toast('Game '+n+' loaded: '+(g.hv==='@'?'@ ':'vs ')+g.team+' · '+g.dateISO+(g.time?' · '+g.time:'')+(promo?' · '+promo:''));
}
function loadGameForm(){
  const g=DATA.game;
  for(const[k,id]of Object.entries({gameno:'g_gameno',promo:'g_promo',date:'g_date',time:'g_time',venue:'g_venue',opp:'g_opp',hsvrec:'g_hsvrec',opprec:'g_opprec',homeaway:'g_homeaway',broadcast:'g_broadcast',ir:'g_ir',echl:'g_echl',scratch:'g_scratch',susp:'g_susp',oppIr:'g_oppIr',oppEchl:'g_oppEchl',oppScratch:'g_oppScratch',oppSusp:'g_oppSusp',ref1:'g_ref1',ref2:'g_ref2',lin1:'g_lin1',lin2:'g_lin2',txhome:'g_txhome',txaway:'g_txaway'})){
    if(g[k]!==undefined)setv(id,g[k]);
  }
  if(!g.venue)setv('g_venue',DATA.settings.venue);
  const psEl=document.getElementById('g_ps');if(psEl)psEl.checked=!!g.ps;
  updatePromoField();
}
/* the schedule already knows which dates are exhibitions (the PS prefix) —
   picking such a date checks the box; picking a listed regular-season date
   unchecks it; an unlisted date leaves the hand-set value alone */
function psFromDate(){
  const d=val('g_date');if(!d)return;
  const row=parseScheduleData().find(g=>g.dateISO===d);
  if(!row)return;
  const el=document.getElementById('g_ps');if(el)el.checked=!!row.ps;
}
function saveGame(){
  DATA.game={gameno:val('g_gameno'),promo:val('g_promo'),date:val('g_date'),time:val('g_time'),venue:val('g_venue'),opp:val('g_opp'),hsvrec:val('g_hsvrec'),opprec:val('g_opprec'),homeaway:val('g_homeaway'),broadcast:val('g_broadcast'),ir:val('g_ir'),echl:val('g_echl'),scratch:val('g_scratch'),susp:val('g_susp'),oppIr:val('g_oppIr'),oppEchl:val('g_oppEchl'),oppScratch:val('g_oppScratch'),oppSusp:val('g_oppSusp'),ref1:val('g_ref1'),ref2:val('g_ref2'),lin1:val('g_lin1'),lin2:val('g_lin2'),txhome:val('g_txhome'),txaway:val('g_txaway'),
    ps:(document.getElementById('g_ps')||{}).checked?'1':''};
  save();toast("Game details saved");
  document.getElementById('gameSavedPill').innerHTML='<span class="pill ok">Saved</span>';
  setTimeout(()=>document.getElementById('gameSavedPill').innerHTML='',2000);
}
const val=id=>{const e=document.getElementById(id);return e?e.value.trim():'';};

/* ============ REPORT PARSER ============ */
function parseReport(){
  const raw=document.getElementById('reportPaste').value;
  if(!raw.trim()){toast("Paste the report first");return;}
  // a bare link is not the report — catch the most common mistake with real guidance
  if(/^\s*https?:\/\/\S+\s*$/i.test(raw)){
    document.getElementById('parseResult').innerHTML='<span class="pill warn">That\'s a link, not the report</span>';
    const sum=document.getElementById('importSummary');sum.style.display='block';
    sum.innerHTML='<b>That looks like the report\'s address, not its contents.</b> Open the link, then either save the page and use <i>Upload saved report</i>, or Select All (Ctrl/Cmd-A) → Copy → paste the page text here.';
    toast('Paste the report contents, not the link');
    return;
  }
  if(/<table[\s>]/i.test(raw)){importDailyHTMLText(raw,'manual paste');return;} // saved HTML page → shared daily-report parser
  const r={parsedAt:new Date().toISOString(),standings:[],leaders:{},teamStats:{},goalieStats:{},special:{}};
  const lines=raw.split(/\r?\n/);
  let inStand=false;
  for(let i=0;i<lines.length;i++){
    const L=lines[i];
    if(/^League Standings/i.test(L)||/^Conference Standings/i.test(L)){inStand=true;continue;}
    if(inStand){
      // Full: rank. Team GP GR W L OTL PTS PCT GF GA PIM HOME ROAD LAST_TEN STREAK
      const full=L.match(/^\s*\d+\.\s+([A-Za-z .]+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+([\d.]+)\s+(\d+)\s+(\d+)\s+(\d+)\s+([\d-]+)\s+([\d-]+)\s+([\d-]+)\s+([\d-]+)/);
      if(full){const name=full[1].trim();if(!r.standings.find(s=>s.team===name))r.standings.push({team:name,gp:+full[2],w:+full[4],l:+full[5],otl:+full[6],pts:+full[7],gf:+full[9],ga:+full[10],pim:+full[11],home:full[12],road:full[13],last10:full[14],streak:full[15]});continue;}
      const m=L.match(/^\s*\d+\.\s+([A-Za-z .]+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/);
      if(m){const name=m[1].trim();if(!r.standings.find(s=>s.team===name))r.standings.push({team:name,gp:+m[2],w:+m[4],l:+m[5],otl:+m[6],pts:+m[7]});}
      else if(r.standings.length&&(/^Overall Leaders/i.test(L)||/division leader/i.test(L)))inStand=false;
    }
  }
  r.leaders=parseLeaders(raw);
  parseTeamStats(raw,r);
  parseSpecial(raw,r);
  parseResultsAndH2H(raw,r);
  parseExtended(raw,r);
  const teams=Object.keys(r.teamStats).length;
  const gotAnything=r.standings.length||teams||Object.keys(r.special).length||(r.leaders&&(r.leaders.points||[]).length);
  const sum=document.getElementById('importSummary');sum.style.display='block';
  if(!gotAnything){ // nothing recognized — do NOT clobber existing data, and say so honestly
    document.getElementById('parseResult').innerHTML='<span class="pill warn">Nothing recognized</span>';
    sum.innerHTML='<b>Nothing recognized in that paste — your existing data was left untouched.</b> Paste the report\'s contents (open it → Select All → Copy), or save the HTML report and use <i>Upload saved report</i>.';
    toast("Nothing recognized — data unchanged");
    return;
  }
  DATA.report=r;
  syncRosterStats();
  save();
  document.getElementById('parseResult').innerHTML='<span class="pill ok">Parsed</span>';
  sum.innerHTML=`<b>Parsed successfully.</b> Standings: ${r.standings.length} teams · Player stats: ${teams} teams · Special teams: ${Object.keys(r.special).length} teams.`;
  toast("Report parsed");
}
function parseLeaders(raw){
  const out={};const grab=(label)=>{
    const re=new RegExp("#\\s+"+label+"\\s+TEAM[\\s\\S]*?(?=\\n#|\\nGoaltending|\\nx -|$)","i");
    const block=raw.match(re);if(!block)return [];const rows=[];
    block[0].split(/\r?\n/).forEach(l=>{const m=l.match(/^\s*\d+\s+\*?\s*([A-Za-z'.\- ]+?)\s+([A-Z]{2,3})\s+(?:\d+\s+)*(\d+)\s*$/);if(m)rows.push({name:m[1].trim(),team:m[2],val:m[3]});});
    return rows.slice(0,5);};
  out.points=grab("POINTS");out.goals=grab("GOALS");out.assists=grab("ASSISTS");return out;
}
function parseTeamStats(raw,r){
  const teamHeaderRe=/^(.+?) Statistics\s*$/gm;let m,blocks=[];
  while((m=teamHeaderRe.exec(raw)))blocks.push({name:m[1].trim(),start:m.index});
  for(let i=0;i<blocks.length;i++){
    const start=blocks[i].start,end=i+1<blocks.length?blocks[i+1].start:raw.length;
    const chunk=raw.slice(start,end),players=[],goalies=[];
    chunk.split(/\r?\n/).forEach(l=>{
      // Full skater row: No PLAYER POS GP G A PTS +/- PIM PP PPA SHG SHA GW FG IG OT UA EN SH SH%
      let s=l.match(/^\s*(\d+)\s+\*?x?\s*([A-Za-z'.\- ]+?)\s+(C|LW|RW|D)\s+(\d+)\s+(\d+)\s+(\d+)\s+(-?\d+)\s+(-?\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+([\d.]+)\s*$/);
      if(s){players.push({num:s[1],name:s[2].trim(),pos:s[3],gp:+s[4],g:+s[5],a:+s[6],pts:+s[7],pm:+s[8],pim:+s[9],pp:+s[10],shg:+s[12],gw:+s[14],shots:+s[20],shpct:s[21]});return;}
      // Fallback: shorter skater row (older/partial reports)
      let s2=l.match(/^\s*(\d+)\s+\*?x?\s*([A-Za-z'.\- ]+?)\s+(C|LW|RW|D)\s+(\d+)\s+(\d+)\s+(\d+)\s+(-?\d+)\s+(-?\d+)\s+(\d+)/);
      if(s2){players.push({num:s2[1],name:s2[2].trim(),pos:s2[3],gp:+s2[4],g:+s2[5],a:+s2[6],pts:+s2[7],pm:+s2[8],pim:+s2[9],pp:0,shg:0,gw:0,shots:0,shpct:''});return;}
      let gm=l.match(/^\s*(\d+)\s+\*?x?\s*([A-Za-z'.\- ]+?)\s+(\d+)\s+(\d+:\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+([\d.]+)\s+(\d+)\s+(\d+)\s+([\d.]+)/);
      if(gm)goalies.push({num:gm[1],name:gm[2].trim(),gp:+gm[3],w:+gm[5],l:+gm[6],otl:+gm[7],so:+gm[9],ga:+gm[10],gaa:gm[11],sa:+gm[12],svs:+gm[13],svpct:gm[14]});
    });
    if(players.length||goalies.length)r.teamStats[blocks[i].name]={players,goalies};
  }
}
function parseSpecial(raw,r){
  const ensure=t=>{r.special[t]=r.special[t]||{};return r.special[t];};
  const fullName=ab=>{for(const[c,a]of Object.entries(TEAM_ABBR))if(a===ab)return c;return ab;};
  // each special-teams block: rank TEAM GP ADV/TSH GF/GA PCT  -> capture adv, made, pct
  const grabBlock=(title,key)=>{
    const re=new RegExp(title+"[\\s\\S]*?(?=\\nHome |\\nRoad |\\nOverall |\\nHome SHGF|\\n\\s*\\n[A-Z]|$)","i");
    const b=raw.match(re);if(!b)return;
    b[0].split(/\r?\n/).forEach(l=>{
      const m=l.match(/^\s*\d+\s+([A-Z]{2,3})\s+(\d+)\s+(\d+)\s+(\d+)\s+([\d.]+)/);
      if(m){const o=ensure(fullName(m[1]));o[key]={att:+m[3],made:+m[4],pct:m[5]};}
    });
  };
  grabBlock("Overall Power Play Record","ppO");
  grabBlock("Home Power Play Record","ppH");
  grabBlock("Road Power Play Record","ppR");
  grabBlock("Overall Penalty Killing Record","pkO");
  grabBlock("Home Penalty Killing Record","pkH");
  grabBlock("Road Penalty Killing Record","pkR");
  // also keep simple pp/pk pct for legacy matchup box
  Object.keys(r.special).forEach(t=>{const o=r.special[t];if(o.ppO)o.pp=o.ppO.pct;if(o.pkO)o.pk=o.pkO.pct;});
}
/* recent results per team + season head-to-head matrix */
function parseResultsAndH2H(raw,r){
  r.recent=r.recent||{};       // {Team:[{date,opp,gf,ga,wl,home}]}
  r.seasonH2H=r.seasonH2H||{};  // {"Team|Team":"w-l-otl-sol"}
  // recent games appear as lines like "Peoria 1 at Evansville 2" within "This Week's Games" / "Last Weeks Games"
  const gameRe=/^\s*([A-Za-z .]+?)\s+(\d+)\s+at\s+([A-Za-z .]+?)\s+(\d+)(?:\s+(OT|OT2|SO))?\s*$/;
  raw.split(/\r?\n/).forEach(l=>{
    const m=l.match(gameRe);
    if(m){
      const away=m[1].trim(),ag=+m[2],home=m[3].trim(),hg=+m[4];
      const push=(team,gf,ga,isHome,opp)=>{r.recent[team]=r.recent[team]||[];r.recent[team].push({opp,gf,ga,wl:gf>ga?'W':(gf<ga?'L':'T'),home:isHome});};
      push(away,ag,hg,false,home);push(home,hg,ag,true,away);
    }
  });
  // Team vs Team Records matrix: rows like "RNK  2-0-0-0  1-3-0-0 ..." with header columns of abbrevs
  // capture the matrix blocks
  const matrixBlocks=raw.match(/Team vs\. Team Records[\s\S]*?(?=\nSpecial Teams|\n\s*\n[A-Z][a-z])/i);
  if(matrixBlocks){
    const lines=matrixBlocks[0].split(/\r?\n/);
    let cols=[];
    lines.forEach(l=>{
      const cells=l.trim().split(/\t|\s{2,}/).map(c=>c.trim()).filter(Boolean);
      // header row: all cells are 2-3 letter abbreviations
      if(cells.length>=3&&cells.every(c=>/^[A-Z]{2,3}$/.test(c))&&cells.length>cols.length){cols=cells;return;}
      // data row: first cell is team abbr, rest are records
      if(cols.length&&/^[A-Z]{2,3}$/.test(cells[0])){
        const rowTeam=cells[0];
        for(let i=1;i<cells.length&&i-1<cols.length;i++){
          if(/^\d+-\d+-\d+-\d+$/.test(cells[i])&&cells[i]!=='0-0-0-0'){
            r.seasonH2H[rowTeam+'|'+cols[i-1]]=cells[i];
          }
        }
      }
    });
  }
}

/* ============ ROSTERS (home + away) ============ */
function getRoster(side){
  if(side==='home')return DATA.roster;
  const t=val('oppRosterTeam');if(!t)return [];
  DATA.oppRosters[t]=DATA.oppRosters[t]||[];return DATA.oppRosters[t];
}
function renderRoster(){
  // baselines, in rising authority: committed spine, committed roster file,
  // live feed overlay, hand edits — each layer only fills what's beneath it
  if(MS_DATA)spineRosterApply();else msLoad().then(d=>{if(d)spineRosterApply();});
  rosterFileLoad();
  renderRosterTable('home','rosterTableWrap');renderRosterProgress();
}
function renderOppRoster(){renderRosterTable('away','oppRosterTableWrap');}
function renderRosterTable(side,wrapId){
  const wrap=document.getElementById(wrapId);
  const list=getRoster(side);
  if(side==='away'&&!val('oppRosterTeam')){wrap.innerHTML='<div class="empty"><div class="big">Select a team above</div>Choose which opponent\'s roster to edit.</div>';return;}
  if(!list.length){wrap.innerHTML='<div class="empty"><div class="big">No players yet</div>Add players or paste Elite Prospects text.</div>';return;}
  const order={C:0,LW:1,RW:2,D:3,G:4};
  const sorted=[...list].sort((a,b)=>(order[a.pos]-order[b.pos])||(+a.num-+b.num));
  let html='<table class="roster"><thead><tr><th>#</th><th>Name</th><th>Pos</th><th>Ht</th><th>Wt</th><th>Sh</th><th>Age</th><th>Hometown</th><th>Bio</th><th>Active</th><th></th></tr></thead><tbody>';
  sorted.forEach(p=>{
    const hasBio=(p.notes&&p.notes.trim())?'<span class="bio-has">✓</span>':'<span class="bio-no">—</span>';
    const manual=!!(p.statOverride&&p.statOverride.trim());
    html+=`<tr><td class="num">${p.num||''}</td><td class="nm"><a class="ep-link" href="${epLinkFor(p)}" target="_blank" rel="noopener" title="Open on Elite Prospects">${esc(dispName(p))}</a> <span style="cursor:pointer" title="Click to hand-edit this stat line" onclick="statEdit('${side}','${p.id}')">${statSpan(p,statTeamKeyword(side))}</span>${manual?`<button class="icon-btn" style="margin-left:4px" title="Revert to synced stats" onclick="statRevert('${side}','${p.id}')">↺ synced</button>`:''}</td><td>${p.pos||''}</td><td>${p.ht||''}</td><td>${p.wt||''}</td><td>${p.sh||''}</td><td>${p.age||''}</td><td>${esc(p.birth||'')}</td><td>${hasBio}</td><td>${p.active==='0'?'<span class="pill grey">No</span>':'<span class="pill ok">Yes</span>'}</td><td><div class="row-actions"><button class="icon-btn" onclick="openPlayer('${side}','${p.id}')">Edit</button></div></td></tr>`;
  });
  wrap.innerHTML=html+'</tbody></table>';
  // the reference default is jersey order; every column re-sorts from there
  tsWire(wrap,'roster:'+side,{def:{col:0,dir:1}});
}
function renderRosterProgress(){
  const f=DATA.roster.filter(p=>['C','LW','RW'].includes(p.pos)),d=DATA.roster.filter(p=>p.pos==='D'),g=DATA.roster.filter(p=>p.pos==='G');
  const bio=a=>a.filter(p=>p.notes&&p.notes.trim()).length;
  document.getElementById('rosterProgress').innerHTML=`<div class="chip">Forwards <b>${bio(f)}/${f.length}</b> bios</div><div class="chip">Defense <b>${bio(d)}/${d.length}</b> bios</div><div class="chip">Goaltenders <b>${bio(g)}/${g.length}</b> bios</div><div class="chip">Total <b>${DATA.roster.length}</b></div>${rosterFileStampHTML()}${guardBannerHTML()}`;
}
function openPlayer(side,id){
  document.getElementById('playerModalTitle').textContent=id?'Edit player':'Add player';
  const list=getRoster(side);const p=id?list.find(x=>x.id===id):{};
  setv('p_id',id||'');setv('p_side',side);
  setv('p_num',p.num);setv('p_name',p.name);setv('p_pos',p.pos||'C');setv('p_ht',p.ht);setv('p_wt',p.wt);setv('p_sh',p.sh);setv('p_age',p.age);setv('p_birth',p.birth);setv('p_bornIn',p.bornIn||'');setv('p_from',p.from||'');setv('p_dob',p.dob);setv('p_notes',p.notes);setv('p_bbio',p.bbio);setv('p_capt',p.capt||'');setv('p_active',p.active||'1');
  // opponents only carry a broadcast bio; the long media bio is Havoc-only
  document.getElementById('p_notes_wrap').style.display=(side==='home')?'':'none';
  const pw=document.getElementById('p_photo_wrap');if(pw)pw.style.display=(side==='home')?'':'none';
  const pp=document.getElementById('p_photo_preview');if(pp)pp.innerHTML=(p&&p.imgData)?'<img src="'+p.imgData+'" style="width:44px;height:44px;object-fit:cover;border-radius:6px"> uploaded photo on file':'';
  window._pPhotoData=(p&&p.imgData)||'';
  document.getElementById('delPlayerBtn').style.display=id?'inline-flex':'none';
  openModal('playerModal');
}
function pPhotoPick(e){
  const f=e.target.files[0];if(!f)return;
  const img=new Image();
  img.onload=()=>{
    const c=document.createElement('canvas');
    const sc=Math.min(1,240/Math.max(img.width,img.height));
    c.width=Math.round(img.width*sc);c.height=Math.round(img.height*sc);
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);
    window._pPhotoData=c.toDataURL('image/jpeg',0.82);
    document.getElementById('p_photo_preview').innerHTML='<img src="'+window._pPhotoData+'" style="width:44px;height:44px;object-fit:cover;border-radius:6px"> ready';
  };
  img.src=URL.createObjectURL(f);
  e.target.value='';
}
function savePlayer(){
  const id=val('p_id'),side=val('p_side');const list=getRoster(side);
  const obj={num:val('p_num'),name:val('p_name'),pos:val('p_pos'),ht:val('p_ht'),wt:val('p_wt'),sh:val('p_sh'),age:val('p_age'),birth:val('p_birth'),bornIn:val('p_bornIn'),from:val('p_from'),dob:val('p_dob'),notes:document.getElementById('p_notes').value.trim(),bbio:document.getElementById('p_bbio').value.trim(),capt:val('p_capt'),active:val('p_active'),imgData:window._pPhotoData||''};
  if(!obj.name){toast("Name required");return;}
  if(id){
    const cur=list.find(x=>x.id===id);
    // remember which vitals he changed by hand so the next roster sync leaves
    // his correction alone; everything else the league feed still owns
    const he=Object.assign({},cur.handEdit||{});
    ['num','pos','ht','wt','sh','age','birth','dob','active'].forEach(k=>{
      if(String(obj[k]||'')!==String(cur[k]||''))he[k]=1;
    });
    if(Object.keys(he).length)obj.handEdit=he;
    Object.assign(cur,obj);
  }else{obj.id=uid();list.push(obj);}
  save();closeModal('playerModal');side==='home'?renderRoster():renderOppRoster();toast("Player saved");
}
function deletePlayer(){
  const id=val('p_id'),side=val('p_side');if(!id)return;if(!confirm("Delete this player?"))return;
  if(side==='home')DATA.roster=DATA.roster.filter(x=>x.id!==id);
  else{const t=val('oppRosterTeam');DATA.oppRosters[t]=DATA.oppRosters[t].filter(x=>x.id!==id);}
  save();closeModal('playerModal');side==='home'?renderRoster():renderOppRoster();toast("Player deleted");
}
function openPasteEP(side){setv('ep_num','');setv('ep_text','');setv('ep_side',side);openModal('epModal');}
function parseEP(){
  const t=document.getElementById('ep_text').value,side=val('ep_side');
  if(!t.trim()){toast("Paste EP text first");return;}
  const grab=(label)=>{const m=t.match(new RegExp(label+"\\s*\\n?\\s*([^\\n]+)","i"));return m?m[1].trim():'';};
  let name='';const nm=t.match(/^(.+?)\s+Facts/m);if(nm)name=dedupeName(nm[1].trim());
  let dob=grab("Date of Birth").replace(/\[|\]|\(http.*$/g,'').trim();
  const dm=dob.match(/([A-Za-z]{3,})\s+(\d{1,2}),?\s+(\d{4})/);let dobOut=dob;
  if(dm){const months={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};const mo=months[dm[1].slice(0,3).toLowerCase()];if(mo)dobOut=`${String(mo).padStart(2,'0')}/${String(dm[2]).padStart(2,'0')}/${dm[3].slice(2)}`;}
  let age=grab("Age").replace(/[^\d]/g,'');
  let pos=grab("Position");pos=(pos.match(/RW|LW|C|D|G/)||[''])[0]||pos;
  let birth=grab("Place of Birth").replace(/\[|\]|\(http.*$/g,'').replace(/,\s*(USA|CAN|SWE|FIN|CZE)\s*$/,'').trim();
  const hm=grab("Height").match(/(\d)'(\d{1,2})"/);let ht=hm?`${hm[1]}-${hm[2]}`:'';
  const wm=grab("Weight").match(/(\d{2,3})\s*lbs/);let wt=wm?wm[1]:'';
  const shootsLabel=t.match(/Catches/i)?'Catches':'Shoots';
  let sh=grab(shootsLabel).replace(/[^LR]/g,'').slice(0,1);
  closeModal('epModal');
  openPlayer(side);
  setv('p_num',val('ep_num'));setv('p_name',name);setv('p_pos',pos||'C');setv('p_ht',ht);setv('p_wt',wt);setv('p_sh',sh);setv('p_age',age);setv('p_birth',birth);setv('p_dob',dobOut);
  toast("Parsed — review & add notes");
}
function dedupeName(s){const h=s.length/2;if(s.length%2===0&&s.slice(0,h)===s.slice(h))return s.slice(0,h);return s;}

/* ===== BULK ROSTER IMPORT ===== */
let BULK_PARSED=[];
function openBulk(side){
  if(side==='away'&&!val('oppRosterTeam')){toast("Select an opponent team first");return;}
  setv('bulk_side',side);setv('bulk_text','');document.getElementById('bulkPreviewWrap').innerHTML='';document.getElementById('bulkMsg').innerHTML='';
  openModal('bulkModal');
}
function bulkParse(raw){
  const rows=[];let group=''; // current position group from header lines
  const groupMap={forward:'F',forwards:'F',defence:'D',defense:'D',defencemen:'D',defensemen:'D',goalie:'G',goalies:'G',goaltender:'G',goaltenders:'G'};
  raw.split(/\r?\n/).forEach(line=>{
    let l=line.replace(/\u00a0/g,' ').trimEnd();
    if(!l.trim())return;
    const low=l.trim().toLowerCase();
    // section header?
    if(groupMap[low]){group=groupMap[low];return;}
    // skip a header row like "# Name Pos Height Weight Shoots Birth place"
    if(/^#?\s*(name)\b/i.test(low)||/birth\s*place/i.test(low)&&/name/i.test(low))return;
    // split on tabs first; if only one cell, fall back to 2+ spaces
    let cells=l.split('\t').map(c=>c.trim());
    if(cells.length<3)cells=l.trim().split(/\s{2,}/).map(c=>c.trim());
    cells=cells.filter((c,i)=>!(c===''&&i===cells.length-1)); // drop trailing empty
    if(cells.length<2)return;
    // first cell should be a jersey number (allow blank)
    let num='',idx=0;
    if(/^\d{1,2}$/.test(cells[0])){num=cells[0];idx=1;}
    let name=dedupeName(cells[idx]||'');idx++;
    if(!name)return;
    // remaining cells: pos, ht, wt, shoots, birthplace (order from EP table)
    let rest=cells.slice(idx);
    let pos='',ht='',wt='',sh='',birth='';
    // detect a position token among rest
    const posTok=rest.find(c=>/^(C|LW|RW|D|G)$/i.test(c));
    if(posTok){pos=posTok.toUpperCase();rest=rest.filter(c=>c!==posTok);}
    else if(group)pos=group==='F'?'C':group; // group F default to C, user can fix
    // height like 5-11 or 6'2"
    const htTok=rest.find(c=>/^\d-\d{1,2}$/.test(c)||/\d'\d{1,2}"/.test(c));
    if(htTok){ht=htTok.replace(/(\d)'(\d{1,2})"?/,'$1-$2');rest=rest.filter(c=>c!==htTok);}
    // weight = standalone 2-3 digit number
    const wtTok=rest.find(c=>/^\d{2,3}$/.test(c));
    if(wtTok){wt=wtTok;rest=rest.filter(c=>c!==wtTok);}
    // shoots/catches single L or R
    const shTok=rest.find(c=>/^[LR]$/i.test(c));
    if(shTok){sh=shTok.toUpperCase();rest=rest.filter(c=>c!==shTok);}
    // birthplace = the remaining longest text cell (contains a comma or letters)
    const bTok=rest.filter(c=>/[A-Za-z]{2,}/.test(c)).sort((a,b)=>b.length-a.length)[0];
    if(bTok)birth=bTok;
    rows.push({num,name,pos:pos||'C',ht,wt,sh,age:'',birth,dob:'',notes:'',active:'1'});
  });
  return rows;
}
function bulkPreview(){
  const raw=document.getElementById('bulk_text').value;
  if(!raw.trim()){toast("Paste roster text first");return;}
  BULK_PARSED=bulkParse(raw);
  const wrap=document.getElementById('bulkPreviewWrap');
  if(!BULK_PARSED.length){wrap.innerHTML='<div class="note">Couldn\'t parse any players. Check the format — each line needs at least a name.</div>';return;}
  let html='<div class="section-label hub-sectionhead">Preview — '+BULK_PARSED.length+' players</div><div style="max-height:300px;overflow:auto"><table class="roster"><thead><tr><th>#</th><th>Name</th><th>Pos</th><th>Ht</th><th>Wt</th><th>Sh</th><th>Birthplace</th></tr></thead><tbody>';
  BULK_PARSED.forEach(p=>{html+=`<tr><td class="num">${esc(p.num)}</td><td class="nm">${esc(p.name)}</td><td>${esc(p.pos)}</td><td>${esc(p.ht)}</td><td>${esc(p.wt)}</td><td>${esc(p.sh)}</td><td>${esc(p.birth)}</td></tr>`;});
  html+='</tbody></table></div>';
  html+='<div class="note" style="margin-top:10px">Position defaults to C for forwards if not specified — edit any player afterward to set LW/RW. Career notes, age, and DOB are added later per player.</div>';
  html+='<div class="btn-row"><button class="btn" onclick="bulkCommit(\'add\')">Add to existing roster</button><button class="btn secondary" onclick="bulkCommit(\'replace\')">Replace whole roster</button></div>';
  wrap.innerHTML=html;
}
function bulkCommit(mode){
  const side=val('bulk_side');const list=getRoster(side);
  if(!BULK_PARSED.length){toast("Nothing to import");return;}
  if(mode==='replace'&&!confirm("Replace the entire current roster with these "+BULK_PARSED.length+" players?"))return;
  const toAdd=BULK_PARSED.map(p=>Object.assign({id:uid()},p));
  if(side==='home'){DATA.roster=mode==='replace'?toAdd:DATA.roster.concat(toAdd);}
  else{const t=val('oppRosterTeam');DATA.oppRosters[t]=mode==='replace'?toAdd:(DATA.oppRosters[t]||[]).concat(toAdd);}
  save();closeModal('bulkModal');
  side==='home'?renderRoster():renderOppRoster();
  toast(toAdd.length+" players imported");
}

/* ============ LOGOS ============ */
function renderLogos(){
  const wrap=document.getElementById('logoList');
  wrap.innerHTML=TEAMS.map(t=>{
    const abbr=teamAbbrOf(t);const custom=DATA.logos[t];const def=(typeof DEFAULT_LOGOS!=='undefined')?DEFAULT_LOGOS[t]:null;const logo=custom||def;
    const tag=custom?'<span class="pill ok">custom</span>':(def?'<span class="pill grey">built-in</span>':'');
    return `<div class="logo-row">
      <div class="logo-thumb">${logo?`<img src="${logo}">`:abbr}</div>
      <div class="lname">${t} ${tag}</div>
      <button class="btn small secondary" onclick="document.getElementById('logoUp_${abbr}').click()">Upload</button>
      ${custom?`<button class="icon-btn" onclick="removeLogo('${t.replace(/'/g,"\\'")}')">Reset to built-in</button>`:''}
      <input type="file" id="logoUp_${abbr}" accept="image/*" style="display:none" onchange="uploadLogo('${t.replace(/'/g,"\\'")}',event)">
    </div>`;
  }).join('');
}
function uploadLogo(team,e){
  const f=e.target.files[0];if(!f)return;
  if(f.size>400000){toast("Logo too large — use a PNG under ~400KB");}
  const rd=new FileReader();rd.onload=()=>{DATA.logos[team]=rd.result;save();renderLogos();updateAppMark();toast("Logo saved");};rd.readAsDataURL(f);e.target.value='';
}
function removeLogo(team){delete DATA.logos[team];save();renderLogos();updateAppMark();}
function updateAppMark(){const m=document.getElementById('appMark');const l=teamLogoSrc("Huntsville Havoc");m.innerHTML=l?`<img src="${l}">`:'H';}
function logoHTML(team,fallbackClass,abbr){const l=DATA.logos[team]||(typeof DEFAULT_LOGOS!=='undefined'?DEFAULT_LOGOS[team]:null);return l?`<img src="${l}">`:abbr;}
function teamLogoSrc(team){return DATA.logos[team]||(typeof DEFAULT_LOGOS!=='undefined'?DEFAULT_LOGOS[team]:null);}

/* ============ REFERENCE ============ */
/* The franchise record book renders from the data file's league_reference
   block (the corrected book — career shutouts: 8, Brian Wilson, active) and
   falls back to the seeded copy until the file loads. Everything downstream —
   the League Reference card, the Game Notes minis, the packet records page and
   the record watch — reads through this one accessor; corrections go into the
   committed data file. */
function recBook(){
  const L=(MS_DATA||{}).league_reference;
  let R;
  if(L){
    const nm=v=>v==null?'—':(typeof v==='number'&&v>=1000?v.toLocaleString('en-US'):String(v));
    const pc=v=>(v!=null&&v<1)?('.'+String(Math.round(v*1000)).padStart(3,'0')):nm(v);
    // [label, display string, {value, holder}] — the third element keeps the
    // record STRUCTURED so the watch can join holders by full name, never by
    // parsing the display string back apart
    const f=(o,lbl,fmt)=>o?[lbl,(fmt||nm)(o.value)+(o.holder?' — '+o.holder:'')
      +(o.years?' ('+o.years+')':(o.year?' ('+o.year+')':(o.period?' ('+o.period+')':''))),
      {value:o.value,holder:String(o.holder||'')}]:null;
    const c=L.havoc_career_leaders||{},s=L.single_season_skaters||{},g=L.single_season_goalies||{},t=L.team_records||{};
    R={
      career:[f(c.games,'Games'),f(c.goals,'Goals'),f(c.assists,'Assists'),f(c.points,'Points'),f(c.pim,'Penalty minutes'),
        f(c.goalie_wins,'Wins (goalie)'),f(c.shutouts,'Shutouts'),f(c.goalie_games,'Games (goalie)'),f(c.goalie_saves,'Saves (goalie)')].filter(Boolean),
      players:[f(s.points,'Most points, season'),f(s.goals,'Most goals, season'),f(s.assists,'Most assists, season'),f(s.pim,'Most PIM, season')].filter(Boolean),
      goalies:[f(g.gaa,'Lowest GAA, season'),f(g.sv_pct,'Best SV%, season',pc),f(g.wins,'Most wins, season'),f(g.shutouts,'Most shutouts, season')].filter(Boolean),
      team:[f(t.most_points,'Most points'),f(t.fewest_points,'Fewest points'),f(t.most_wins,'Most wins'),f(t.most_goals,'Most goals scored'),
        f(t.fewest_goals_allowed,'Fewest goals allowed'),f(t.longest_win_streak,'Longest win streak')].filter(Boolean),
      notes:Object.fromEntries([['Games',c.games],['Goals',c.goals],['Assists',c.assists],['Points',c.points],['Penalty minutes',c.pim],
        ['Wins (goalie)',c.goalie_wins],['Shutouts',c.shutouts],['Games (goalie)',c.goalie_games],['Saves (goalie)',c.goalie_saves],
        ['Most wins, season',g.wins],['Most shutouts, season',g.shutouts]].filter(x=>x[1]&&x[1].note).map(x=>[x[0],x[1].note])),
      src:L._source||''
    };
  }else{
    R={career:SPHL_REF.hsvRecords.career,players:SPHL_REF.hsvRecords.players,
       goalies:SPHL_REF.hsvRecords.goalies,team:SPHL_REF.hsvRecords.team,notes:{},src:''};
  }
  return R;
}
function renderPalettes(){
  const el=document.getElementById('palList');if(!el)return;
  const label={primary:'Primary',secondary:'Secondary',accent:'Accent (D)',goalie:'Goaltenders',textOn:'Text on primary'};
  el.innerHTML=TEAMS.map(t=>{
    const p=teamPal(t),mine=!!((DATA.palettes||{})[t]);
    return `<div class="pal-row">
      <span class="pal-nm">${esc(t)}${p.ok?'':' <span class="unv" title="Not yet checked against the club&#39;s marks">&bull;</span>'}</span>
      <span class="pal-chip" style="background:${p.primary};color:${p.textOn}">${esc(teamCity(t).toUpperCase())}</span>
      ${PAL_KEYS.map(k=>`<label class="pal-sw" title="${label[k]}"><input type="color" value="${esc(p[k])}" onchange="palSet('${esc(t).replace(/'/g,"\\'")}','${k}',this.value)"><span>${label[k]}</span></label>`).join('')}
      ${mine?`<button class="icon-btn" onclick="palReset('${esc(t).replace(/'/g,"\\'")}')">&#8635; restore</button>`:''}
    </div>`;
  }).join('');
}
function renderReference(){renderMatrix();renderSeries();renderStandings();renderRef26();renderPalettes();
  // the data file carries the corrected book — load it, then paint again
  if(!MS_DATA)msLoad().then(d=>{if(d)renderReference();});
  // cups — from league_reference when the file is loaded, seeded copy until then
  const LC=((MS_DATA||{}).league_reference||{}).presidents_cup_wins;
  document.getElementById('ref_cups').innerHTML=TEAMS.map(t=>{
    const e=LC?LC[t]:null;
    const cups=e?(e.years||[]).map(String):(SPHL_REF.cups[t]||[]);
    const count=e?e.count:cups.length;
    const note=e?e.note:SPHL_REF.cupNote[t];
    return `<div class="cupline"><b>${t}:</b> ${count?count+(cups.length?' ('+cups.join(', ')+')':''):'0'}${note?` <span style="color:var(--ink-2)">— ${esc(note)}</span>`:''}</div>`;
  }).join('')+((LC&&LC._defunct_note)||SPHL_REF.cupDefunct?`<div class="cupline" style="color:var(--ink-2);margin-top:4px">${esc((LC&&LC._defunct_note)||SPHL_REF.cupDefunct)}</div>`:'');
  // h2h vs selected opponent
  renderH2H();
  // franchise records — from the data file's league_reference
  const R=recBook();
  const tbl=(key,arr)=>'<table>'+arr.map(r=>
    `<tr><td>${esc(r[0])}</td><td><b>${esc(r[1])}</b>${R.notes[r[0]]?`<div class="rec-chase">${esc(R.notes[r[0]])}</div>`:''}</td></tr>`).join('')+'</table>';
  const head=(t,k)=>`<div style="font-size:11px;font-weight:800;text-transform:uppercase;color:var(--ink-2);margin:8px 0 4px">${t}</div>`;
  document.getElementById('ref_records').innerHTML=
    head('All-Time Career Leaders','career')+tbl('career',R.career)
    +head('Single-Season — Skaters','players')+tbl('players',R.players)
    +head('Single-Season — Goaltenders','goalies')+tbl('goalies',R.goalies)
    +head('Team','team')+tbl('team',R.team)
    +`<div style="display:flex;gap:8px;align-items:center;margin-top:7px">
       <span style="font-size:10.5px;color:var(--ink-2)">${esc(R.src||'Seeded copy — loads from data/havoc_players.json when hosted.')}</span></div>`;
}

/* ---- 2026 season review + New Teams 2026-27 (verified research file, Aug 5 2026) ----
   Blocks render from the seed; content changes go through the committed data files.
   "•" (.unv) marks UNVERIFIED numbers per the file's quality flags. */
const REF26_SEED={
recap:`<div style="line-height:1.65">
<b>2026 President's Cup champion: EVANSVILLE THUNDERBOLTS</b> — beat Peoria 3-2 in the best-of-5 final after trailing 0-2, clinching Game 5 (6-4) on May 9, 2026 at Carver Arena. <b>Back-to-back titles (2025, 2026).</b><br>
<b>Round 1:</b> #1 Peoria def. #8 Macon &middot; <b style="color:var(--red-text)">#7 Knoxville UPSET #2 Huntsville</b> &middot; #3 Roanoke def. #6 Birmingham &middot; #4 Evansville def. #5 Pensacola 2-1<br>
<b>Semifinals:</b> Peoria def. Knoxville 2-0 &middot; Evansville def. Roanoke 2-1<br>
<i>Havoc storyline: 2nd in the regular season, upset in Round 1 — the 2026-27 redemption arc.</i><br>
<span style="color:var(--ink-2)">The SPHL fields <b>12 teams in 2026-27</b>: the 10 returning clubs plus Athens Rock Lobsters (announced May 13, 2026) and Pee Dee IceCats (approved June 24, 2026), both from the FPHL. Commissioner: Doug Price. League founded 2004.</span>
</div>`,
table12:`<table><tr><th>Team</th><th>2025-26 (W-L-OTL-SOL &middot; pts &middot; finish)</th><th>2026 playoffs</th><th>2026-27 head coach</th></tr>
<tr><td>Peoria Rivermen</td><td>38-17-3-0 &middot; 79 &middot; 1st</td><td>Lost the Final 2-3 to EVV (led 2-0)</td><td>Jean-Guy Trudel</td></tr>
<tr><td><b>Huntsville Havoc</b></td><td><b>32-20-5-1 &middot; 70 &middot; 2nd</b></td><td><b>Upset in R1 by #7 Knoxville</b></td><td>Stuart Stefan</td></tr>
<tr><td>Roanoke Rail Yard Dawgs</td><td>32-21-3-2 &middot; 69 &middot; 3rd</td><td>Beat BHM in R1; lost semis 1-2 to EVV</td><td>Dan Bremner (HC/GM)</td></tr>
<tr><td>Evansville Thunderbolts</td><td>31-20-1-6 &middot; 69 &middot; 4th</td><td><b>WON THE CUP</b> (beat PEN, ROA, PEO)</td><td>Jeff Bes</td></tr>
<tr><td>Pensacola Ice Flyers</td><td>28-21-6-3 &middot; 65 &middot; 5th</td><td>Lost R1 1-2 to EVV</td><td>Jeremy Gates</td></tr>
<tr><td>Birmingham Bulls</td><td>28-23-2-5 &middot; 63 &middot; 6th</td><td>Lost R1 to ROA</td><td>Craig Simchuk (3x Coach of the Year)</td></tr>
<tr><td>Knoxville Ice Bears</td><td>27-26-2-3 &middot; 59 &middot; 7th</td><td>Upset HSV; lost semis 0-2 to PEO</td><td>John Gurskis (extended)</td></tr>
<tr><td>Macon Mayhem</td><td>26-26-3-3 &middot; 58 &middot; 8th</td><td>Lost R1 to PEO</td><td>Dave Pszenyczny</td></tr>
<tr><td>Quad City Storm</td><td>25-28-4-1 &middot; 55 &middot; 9th</td><td>Missed</td><td>Shayne Toporowski</td></tr>
<tr><td>Fayetteville Marksmen</td><td>23-28-5-2 &middot; 53 &middot; 10th</td><td>Missed</td><td>NEW: Garrett Rutledge (hired 5/29/26 — ex-Athens FPHL)</td></tr>
<tr><td>Athens Rock Lobsters</td><td>FPHL: 44-11-1 &middot; 124 &middot; division champs</td><td>— (joins the SPHL)</td><td>NEW: Scott Burt, GM/HC (ex-Idaho / Rapid City / Greensboro)</td></tr>
<tr><td>Pee Dee IceCats</td><td>FPHL: 24-25-2-5 &middot; ~81 <span class="unv" title="UNVERIFIED — computed, not a published total">•</span> &middot; 4th Continental</td><td>— (joins the SPHL)</td><td>NEW: Chris Bernard (first pro HC job)</td></tr>
</table>`,
pd:`<div style="line-height:1.6">
<b>2025-26 (only FPHL season in Florence): 24-25-2-5, 4th Continental Division</b> (~81 pts <span class="unv" title="UNVERIFIED — computed, not a published total">•</span>).<br>
<b>Lineage:</b> Elmira River Sharks (2023) → Hudson Valley Venom (2024) → HC Venom → relocated to Florence as Pee Dee IceCats, 2025-26. <b>Ownership:</b> Kevin Cuppia, managing partner/president (majority owner Parker Moskal removed Oct 22, 2025, four games into the season). <b>GM:</b> Tom Callahan — also the team broadcaster.<br>
<b>"Cardiac Cats" playoff run — 9 games to the Commissioner's Cup Final in year one:</b><br>
&bull; R1: <b>SWEPT top-seeded Athens 2-0</b> (8-2, 7-2) despite going 3-11 against them in the regular season — first playoff series win in franchise history.<br>
&bull; Continental Division Final: beat Columbus 2-1 — G2 won 2-1 in OT (D. Marcinkevics tied it with the goalie pulled and under 30 seconds left; Frolov the OT winner); G3 won 4-3 in OT (<b>Houston Wilson hat trick</b>, incl. the tying goal with 1:01 left and the OT series-winner).<br>
&bull; <b>Commissioner's Cup Final: LOST 3-1 to Binghamton</b> (W 5-2, L 1-2, L 1-8, L 2-4) — Binghamton's three-peat, a first in FPHL history.<br>
<b>2025-26 leaders (EP):</b> Patriks Marcinkevics 53gp, 42-48-90 (co-led the FPHL scoring race late) &middot; Dominiks Marcinkevics 40gp, 28-35-63 &middot; Houston Wilson 48gp, 18-41-59 (7g, 10pts in 9 playoff gp — DEPARTED to Port Huron, FPHL) &middot; <b>Alexander Legkov 30gp, 19-31-50 with PD — FPHL ROOKIE OF THE YEAR</b> (91 pts league-wide) &middot; Zaychik 47gp, 41pts &middot; Lord 35pts &middot; Rasulov 35pts.<br>
<b>Goalies <span class="unv" title="UNVERIFIED table — cite individually verified stats only">•</span>:</b> playoff starter Breandan Colgan (departed, Watertown FPHL) &middot; Parker Rutherford (returning for SPHL 2026-27) &middot; Rahul Sharma 6-6-1, .890 (departed).<br>
<b>Broadcast gold:</b> FPHL single-season attendance record <b>126,841</b> (4,698 avg) &middot; single-game FPHL record <b>7,837</b> vs Athens, Jan 17, 2026 &middot; home playoff "White Out" games &middot; coach Gary Graham retired post-finals → the Chris Bernard era begins in the SPHL.<br>
<b>Known 2026-27 SPHL signings <span class="unv" title="UNVERIFIED — per EP, confirm before air">•</span>:</b> Rutherford (G) and Charlie Bedard (D) returning; Asp, Fechko, Shaporev.<br>
<b>Deep cut:</b> the Pee Dee Pride (ECHL, 1997-2005) played in Florence — pro hockey returns. Colors: electric blue/red/navy/sky blue/silver/black; palmetto-moon claw alternate logo. IG @peedeeicecats &middot; PeeDeeProHockey.com.
</div>`,
ath:`<div style="line-height:1.6">
<b>2024-25 (inaugural): 43-10-3, 121 pts</b> (220 GF / 137 GA); lost R1 best-of-3 1-2 to Columbus (L 4-7, W 5-3, L 2-4). Coach Steve Martinson — FPHL Coach of the Year (left for ECHL Allen, May 2025).<br>
<b>2025-26: 44-11-1, 124 pts</b> (275 GF / 180 GA) — <b>Continental Division champions</b>, the franchise's first division title. Then swept 0-2 by Pee Dee in R1 (2-8, 2-7) despite an 11-3 season series — the defining upset.<br>
<b>Cross-reference:</b> 2025-26 coach Garrett Rutledge (parted ways 4/24/26) now coaches <b>FAYETTEVILLE</b> — an instant SPHL storyline whenever the Havoc play either team.<br>
<b>Leaders:</b> 2024-25 — <b>Garrett Milan 56gp, 37-64-101 — FPHL MVP, the league's only 100-point player</b> &middot; Shinkaruk 77 &middot; Virgili 68 &middot; Kayson Gallant 67 (40 goals led the FPHL). Goalies: Rosenzweig 21-7, 2.21, .926 &middot; Lavallière 12-2, 2.38, .935. 2025-26 — Milan 51gp, 31-56-87 (player-assistant coach) &middot; Shinkaruk 72 &middot; Neiley 60 &middot; Bandurkin 56 &middot; Mack 56. Goalies <span class="unv" title="UNVERIFIED table — confirm before air">•</span>: McPhail 24-7, 2.93, .923 &middot; Lavallière 15-3, 3.14, .907.<br>
<b>Identity:</b> named for the B-52s' "Rock Lobster" (the band formed in Athens, 1976; members attended the opener). Mascot: Clawdius, a fan-named red lobster. Colors: Crimson, Sapphire, Norfolk Sky, White. Owners: Spire Hockey (Todd Mackin).<br>
<b>Attendance:</b> 229,000+ over two FPHL seasons; 125,611 in 2025-26 (~4,486/gm); 10 sellouts of 5,500+ at The Tank.<br>
<b>2026-27:</b> home/season opener <b>Oct 16, 2026 vs Macon</b> at The Tank; 30 home games; no player signings announced as of Aug 5, 2026. SPHL entry announced May 13, 2026.
</div>`};
function renderRef26(){
  const el=document.getElementById('ref26');if(!el)return;
  const blocks=[
    ['recap',"2026 President's Cup &amp; Playoffs"],
    ['table12','The 12-team field — 2025-26 results &amp; 2026-27 coaches'],
    ['pd','New team 2026-27 · Pee Dee IceCats — FPHL file (feeds Opening Weekend)'],
    ['ath','New team 2026-27 · Athens Rock Lobsters — FPHL file']
  ];
  el.innerHTML=blocks.map(([k,title])=>`<div class="ref-box"><h4>${title}</h4>
      <div class="ref-ed">${REF26_SEED[k]}</div></div>`).join('');
}
/* ---- franchise files: render + the running Havoc head-to-head ----
   Reliability marks in the seed text convert to the review •; ✅ renders clean.
   Content changes go through the committed data files. */
const FR_MARK={'➗':'COMPUTED by summing season tables — arithmetic-checked, but not a published figure. Verify before air.',
  '⚠️':'SINGLE SOURCE — verify before air.',
  '❌':'UNVERIFIED or disputed — do not state as fact.'};
function frMarks(s){
  return String(s||'').replace(/\s*✅/g,'')
    .replace(/\s*(➗|⚠️|❌)/g,(m,c)=>` <span class="unv" title="${FR_MARK[c]}">•</span>`);
}
function frTeam(){return DATA.frTeam||'Huntsville Havoc';}
function frStory(v){DATA.franchiseStory=DATA.franchiseStory||{};DATA.franchiseStory[frTeam()]=v;save();}
function frPick(t){DATA.frTeam=t;save();renderFranchise();}
function frSection(team,key,title,html){
  return `<div class="ref-box"><h4>${title}</h4>
    <div class="ref-ed">${html}</div></div>`;
}
/* Havoc all-time vs a club: an editable baseline plus everything our own game log has seen. */
function frH2HRows(team){
  const city=String(team).split(' ')[0];
  const games=(typeof glGames==='function'?glGames():[]).filter(g=>g.opp&&String(g.opp).toLowerCase().indexOf(city.toLowerCase())===0);
  const c={W:0,L:0,OTL:0,SOL:0};games.forEach(g=>{if(c[g.wl]!=null)c[g.wl]++;});
  return {games,rec:c.W+'-'+c.L+'-'+(c.OTL+c.SOL),n:games.length,
    gf:games.reduce((t,g)=>t+(+g.us||0),0),ga:games.reduce((t,g)=>t+(+g.them||0),0)};
}
function frH2HHTML(team){
  if(team==='Huntsville Havoc')return '';
  const base=SPHL_REF.hsvVs[team],t=frH2HRows(team);
  const baseLine=(base&&!base.first)
    ?`<tr><td>Baseline — Havoc media guide</td><td class="r"><b>${esc(base.rs)}</b></td></tr><tr><td>Baseline — playoffs</td><td class="r"><b>${esc(base.po)}</b></td></tr>`
    :`<tr><td>Baseline</td><td class="r"><b>No meetings on file — first season in the league</b></td></tr>`;
  const conflict=SPHL_REF.hsvVsNote[team];
  return `<table class="pk-t"><tr><th>Line</th><th class="r">Record</th></tr>${baseLine}
    <tr><td>Tracked here since the log began</td><td class="r"><b>${t.n?t.rec+' in '+t.n+' GP'+(t.gf||t.ga?' · '+t.gf+'-'+t.ga+' goals':''):'no games logged yet'}</b></td></tr></table>
    ${conflict?`<div style="font-size:11.5px;color:var(--ink-2);margin-top:6px">${frMarks(conflict)}</div>`:''}
    <div style="font-size:11px;color:var(--ink-2);margin-top:4px">The tracked line accumulates from your own game log every time a Havoc result is entered — it never resets on a sync.</div>`;
}
function renderFranchise(){
  const wrap=document.getElementById('frFile');if(!wrap)return;
  const team=frTeam(),F=FRANCHISES[team];
  const sel=document.getElementById('frTeamSel');
  if(sel&&!sel.options.length)sel.innerHTML=TEAMS.map(t=>`<option${t===team?' selected':''}>${t}</option>`).join('');
  else if(sel)sel.value=team;
  if(!F){wrap.innerHTML='<div class="empty">No file on record for this club yet.</div>';return;}
  const basics=`<table>${F.basics.map(r=>`<tr><td>${esc(r[0])}</td><td><b>${frMarks(esc(r[1]))}</b></td></tr>`).join('')}</table>`;
  const seasonTbl=F.seasons.length
    ?`<table><tr><th>Season</th><th>Record</th><th>PTS</th><th>Finish</th><th>Playoffs</th></tr>${F.seasons.map(r=>`<tr${/WON CUP|CHAMPION/.test(r[4])?' style="font-weight:800"':''}><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td><td>${esc(r[4])}</td></tr>`).join('')}</table>`
    :`<div>${frMarks(esc(F.keySeasons||'Not on file.'))}</div>`;
  const story=(DATA.franchiseStory||{})[team];
  wrap.innerHTML=
    frSection(team,'basics','Franchise basics',basics)
   +frSection(team,'record','All-time record &amp; championships',`<div style="line-height:1.6"><b>All-time:</b> ${frMarks(esc(F.allTime))}<br><b>Titles:</b> ${frMarks(esc(F.titles))}</div>`)
   +frSection(team,'seasons',F.seasons.length?'Season by season':'Key seasons',seasonTbl)
   +frSection(team,'leaders','All-time leaders',`<div style="line-height:1.6">${frMarks(esc(F.leaders))}</div>`)
   +frSection(team,'records','Records &amp; awards',`<div style="line-height:1.6">${frMarks(esc(F.records))}</div>`)
   +frSection(team,'attendance','Attendance',`<div style="line-height:1.6">${frMarks(esc(F.attendance))}</div>`)
   +frSection(team,'retired','Retired numbers &amp; honors',`<div style="line-height:1.6">${frMarks(esc(F.retired))}</div>`)
   +frSection(team,'coach','Head coach',`<div style="line-height:1.6">${frMarks(esc(F.coach))}</div>`)
   +(team==='Huntsville Havoc'?'':`<div class="ref-box"><h4>Havoc all-time vs ${esc(team.split(' ')[0])}</h4>${frH2HHTML(team)}</div>`)
   +`<div class="ref-box"><h4>Broadcast storylines (yours to edit)</h4>
      <textarea id="frStoryBox" rows="4" style="width:100%" onchange="frStory(this.value)" placeholder="Angles, cross-team notes, anything you want in front of you on air">${esc(story!=null?story:(F.story||''))}</textarea>
      <div style="font-size:11px;color:var(--ink-2);margin-top:4px">Pre-filled from the research file&rsquo;s cross-team notes. Edits save to this browser and are never touched by a sync.</div></div>`;
}
function renderH2H(){
  const opp=val('g_opp');const box=document.getElementById('ref_h2h');
  if(!opp){box.innerHTML='<div style="color:var(--ink-2);font-size:12px">Select an opponent on the This Game tab.</div>';return;}
  /* same running line as the franchise file: published baseline + everything our own log has seen */
  box.innerHTML=`<div style="font-size:12.5px;font-weight:800;margin-bottom:4px">${esc(opp)}</div>${frH2HHTML(opp)}`;
}
function getCoach(team){return (DATA.coaches[team]||SPHL_REF.coaches[team]||{name:"",bio:""});}
function loadCoach(){const t=val('coachTeam');const c=getCoach(t);setv('coach_name',c.name||'');setv('coach_bio',c.bio||'');}
function saveCoach(){const t=val('coachTeam');if(!t){toast("Select a team");return;}DATA.coaches[t]={name:val('coach_name'),bio:document.getElementById('coach_bio').value.trim()};save();toast("Coach saved");}

/* ============ OPENING WEEKEND (first Havoc–Pee Dee meeting) ============ */
const OW_FIRSTS=['First goal','First assist','First win','First home opener','First road win','First power-play goal','First shorthanded goal','First fight','First shutout','First hat trick','First OT/SO win','First sellout'];
function owData(){
  DATA.opening=DATA.opening||{};
  const o=DATA.opening;
  o.file=o.file||{founded:'',arena:'Florence Center',capacity:'',city:'Florence, SC',owner:'',affil:'',broadcast:'',coach:'',coachbio:''};
  o.story=o.story||{s1:'',s2:'',s3:'',nums:'',preseason:'',fphl:'',leaders:''};
  /* seed from the Aug 5, 2026 research file — fills BLANK fields only, never overwrites typed text.
     "•" carries the file's UNVERIFIED flag into the packet. */
  if(!o.seed26){
    if(o.file.founded==='2026 (expansion)')o.file.founded='';
    const F={founded:'2026 SPHL expansion (FPHL 2025-26; lineage: Elmira River Sharks → Hudson Valley Venom → HC Venom)',
      capacity:'~7,600 hockey • (10,000 total — unverified)',
      owner:'Kevin Cuppia — managing partner & president',
      affil:'IG @peedeeicecats · PeeDeeProHockey.com',
      broadcast:'Tom Callahan (GM & team broadcaster)',
      coach:'Chris Bernard',
      coachbio:'Hired July 5, 2026 — his first pro head-coaching job after 17 years at SUNY Potsdam (NCAA D-III). Succeeds Gary Graham, who retired after coaching the Cardiac Cats run to the 2026 FPHL Commissioner\'s Cup Final.'};
    Object.keys(F).forEach(k=>{if(!String(o.file[k]||'').trim())o.file[k]=F[k];});
    const S={
      s1:'The Cardiac Cats: in their only FPHL season in Florence (24-25-2-5), Pee Dee swept top-seeded Athens, beat Columbus on back-to-back OT winners, and reached the Commissioner\'s Cup Final before falling 3-1 to Binghamton.',
      s2:'Pro hockey returns to Florence: the ECHL\'s Pee Dee Pride played here 1997-2005. Chris Bernard opens his first pro head-coaching job after 17 years at SUNY Potsdam.',
      s3:'Roster churn: playoff hero Houston Wilson (hat trick incl. the OT series-winner vs Columbus) departed to Port Huron; Rutherford (G) and Bedard (D) return, with Asp, Fechko and Shaporev signed • (unverified, per EP).',
      nums:'Patriks Marcinkevics: 42-48-90 in 53 GP — co-led the FPHL scoring race\nAlexander Legkov: FPHL Rookie of the Year — 19-31-50 in 30 GP with PD (91 pts league-wide)\nFPHL single-season attendance record: 126,841 (4,698 avg)\nFPHL single-game record: 7,837 vs Athens — Jan 17, 2026\nHouston Wilson: 7 G, 10 PTS in 9 playoff GP (since departed)',
      fphl:'Regular season: 24-25-2-5, 4th in the Continental Division (~81 pts • — computed, not a published total).\nR1: swept top-seeded Athens 2-0 (8-2, 7-2) after going 3-11 against them in the regular season — the franchise\'s first playoff series win.\nDivision Final: beat Columbus 2-1 — G2 won 2-1 in OT (D. Marcinkevics tied it with the goalie pulled inside 30 seconds; Frolov the winner); G3 won 4-3 in OT on a Houston Wilson hat trick, tying goal at 1:01 and the series-winner.\nCommissioner\'s Cup Final: lost 3-1 to Binghamton (W 5-2, L 1-2, L 1-8, L 2-4) — Binghamton\'s three-peat.\nHome playoff games were "White Out" nights; Gary Graham retired after the finals.',
      leaders:'Patriks Marcinkevics — 53 GP, 42-48-90\nDominiks Marcinkevics — 40 GP, 28-35-63\nHouston Wilson — 48 GP, 18-41-59 (departed to Port Huron)\nAlexander Legkov — 30 GP, 19-31-50 with PD, FPHL Rookie of the Year\nZaychik 41 pts · Lord 35 · Rasulov 35\nG: Colgan (playoff starter, departed) · Rutherford (returning) · Sharma 6-6-1, .890 •'
    };
    Object.keys(S).forEach(k=>{if(!String(o.story[k]||'').trim())o.story[k]=S[k];});
    o.seed26=1;
  }
  o.firsts=o.firsts||OW_FIRSTS.map(t=>({t,done:0,detail:''}));
  o.connections=o.connections||[];
  o.origins=o.origins||{};
  return o;
}
function owLoad(){
  const o=owData();
  ['founded','arena','capacity','city','owner','affil','broadcast','coach','coachbio'].forEach(k=>setv('ow_'+k,o.file[k]));
  ['s1','s2','s3','nums','preseason','fphl','leaders'].forEach(k=>setv('ow_'+k,o.story[k]));
  owRenderFirsts();owRenderConn();
}
function owSave(){
  const o=owData();
  ['founded','arena','capacity','city','owner','affil','broadcast','coach','coachbio'].forEach(k=>o.file[k]=val('ow_'+k));
  ['s1','s2','s3','nums','preseason','fphl','leaders'].forEach(k=>o.story[k]=val('ow_'+k));
  save();
}
function owRenderFirsts(){
  const el=document.getElementById('owFirsts');if(!el)return;
  el.innerHTML=owData().firsts.map((f,i)=>`<div class="iv-q">
    <input type="checkbox" ${f.done?'checked':''} onchange="owData().firsts[${i}].done=this.checked?1:0;save();">
    <span class="iv-qt" style="font-weight:700">${esc(f.t)}</span>
    <input type="text" style="flex:2" placeholder="who / when / detail" value="${esc(f.detail)}" onchange="owData().firsts[${i}].detail=this.value;save();">
  </div>`).join('');
}
function owRenderConn(){
  const el=document.getElementById('owConn');if(!el)return;
  const o=owData();
  el.innerHTML=(o.connections.length?o.connections.map((c,i)=>`<div class="iv-q">
      <span class="iv-qt"><b>${esc(c.a)}</b> &amp; <b>${esc(c.b)}</b> — <input type="text" style="width:55%" value="${esc(c.note)}" onchange="owData().connections[${i}].note=this.value;save();"></span>
      <button class="icon-btn" onclick="owData().connections.splice(${i},1);save();owRenderConn();">✕</button>
    </div>`).join(''):'<div class="empty" style="padding:6px">Nothing yet — scan runs off EP career data for both rosters (pull the PD roster on Live Data first), or add pairs by hand.</div>')
    +`<div class="iv-add"><input type="text" id="owc_a" placeholder="Havoc player"><input type="text" id="owc_b" placeholder="IceCats player"><input type="text" id="owc_n" placeholder="connection" style="flex:2"><button class="btn small" onclick="owConnAdd()">Add</button></div>`;
}
function owConnAdd(){
  if(!val('owc_a')||!val('owc_b'))return;
  owData().connections.push({a:val('owc_a'),b:val('owc_b'),note:val('owc_n')});
  save();owRenderConn();
}
function owEpCareer(name){
  if(!EP_STATIC)return [];
  const e=Object.values(EP_STATIC).find(x=>x&&x.name&&norm(x.name)===norm(name));
  return (e&&e.careerStats)||[];
}
function owScan(){
  const pd=(DATA.oppRosters['Pee Dee IceCats']||[]).filter(p=>p.name);
  if(!pd.length){toast('No stored IceCats roster yet — pull rosters on Live Data first');return;}
  const o=owData();const found=[];
  DATA.roster.filter(p=>p.name).forEach(h=>{
    const hc=owEpCareer(h.name);if(!hc.length)return;
    pd.forEach(pp=>{
      owEpCareer(pp.name).forEach(oc=>{
        hc.forEach(hs=>{
          if(!hs.year||hs.year!==oc.year)return;
          if(hs.team&&oc.team&&norm(hs.team)===norm(oc.team))found.push({a:h.name,b:pp.name,note:'played together — '+hs.team+' ('+hs.year+')'});
          else if(hs.league&&hs.league===oc.league)found.push({a:h.name,b:pp.name,note:'faced off in the '+hs.league+' ('+hs.year+')'});
        });
      });
    });
  });
  const seen=new Set(o.connections.map(c=>c.a+'|'+c.b+'|'+c.note));
  let added=0;
  found.forEach(c=>{const k=c.a+'|'+c.b+'|'+c.note;if(!seen.has(k)){seen.add(k);o.connections.push(c);added++;}});
  save();owRenderConn();
  toast(added?added+' connection(s) found':'No overlaps in the EP career data yet — it deepens as the weekly EP action fills careers');
}
function owOrigins(){
  const pd=(DATA.oppRosters['Pee Dee IceCats']||[]).filter(p=>p.name);
  const o=owData();
  const groupOf=t=>{
    const u=String(t).toUpperCase();
    if(/SPHL/.test(u))return 'SPHL veterans';
    if(/ECHL/.test(u))return 'ECHL';
    if(/NCAA|ACHA|USPORTS|COLLEGE|UNIV/.test(u))return 'College';
    if(/OJHL|SJHL|BCHL|NAHL|USHL|GOJHL|CCHL|AJHL|NOJHL|MJHL|JUNIOR/.test(u))return 'Juniors';
    return 'Europe / other pro';
  };
  return pd.map(p=>{
    const ov=o.origins[p.name];
    let origin=ov||'';
    if(!origin){
      const cs=owEpCareer(p.name);
      if(cs.length){const last=cs[cs.length-1];origin=(last.team||'')+(last.league?' ('+last.league+')':'');}
    }
    return {p,origin,group:origin?groupOf(origin):'Unknown — fill by hand'};
  });
}
function owGameLine(){return 'GAME 1 · FRI, OCT 16, 2026 · 7:15 PM ET / 6:15 PM CT · FLORENCE CENTER, FLORENCE, SC — GAME 2 · SAT, OCT 17 · 7:15 PM ET / 6:15 PM CT';}
function owBuild(){
  const S=DATA.settings,red=S.red||'#C8102E';
  const o=owData();
  const pages=[];
  // ---- cover: FIRST MEETING banner replaces series history ----
  const hsvStand=standingsFor('Huntsville');
  pages.push(`<div class="page" style="--havoc-red:${red}">
    <div class="pg-head" style="border-color:${red}"><div class="pg-logo">${logoHTML('Huntsville Havoc','','H')}</div><div class="pg-title" style="color:${red}">OPENING WEEKEND — FIRST MEETING PACKET</div><div class="pg-num">__PGNO__</div></div>
    <div class="ow-banner" style="background:${red}">FIRST MEETING IN HISTORY<br><span>Huntsville Havoc vs. Pee Dee IceCats — the franchises have never played. Everything tonight is a first.</span></div>
    <div style="font-size:10px;font-weight:800;margin:6px 0">${owGameLine()}</div>
    <div class="gn-cols">
      <div class="box"><h3>The stakes</h3><div style="font-size:9.5px;line-height:1.6">
        Game 1 of 60 for the IceCats — the first SPHL regular-season game in franchise history (one FPHL season in Florence came before it).<br>
        Game 1 of 60 for the Havoc, opening their 23rd SPHL season${hsvStand?'':' (2025-26: see By the Numbers)'}.<br>
        First SPHL game ever played at ${esc(o.file.arena||'Florence Center')}.<br>
        Every PD goal, win, save and fight tonight is an SPHL franchise first — see the Firsts Watch page.</div></div>
      ${mediaBlockHTML('media-block')}
    </div>
    <div class="gn-foot"><span>${esc(S.social)}</span><span>${esc(S.footer)}</span><span>__PGNO__</span></div></div>`);
  // ---- franchise file ----
  const F=o.file;
  const fileRows=[['Founded',F.founded],['Arena',F.arena],['Capacity',F.capacity],['City',F.city],['Ownership',F.owner],['Affiliations',F.affil],['Broadcast',F.broadcast],['Head coach',F.coach]];
  pages.push(pgWrap(red,S,'ICECATS FRANCHISE FILE',`
    <div class="gn-cols">
      <div class="box"><h3>Franchise facts</h3><table class="pk-t">${fileRows.map(r=>`<tr><td>${r[0]}</td><td class="r">${esc(r[1]||'—')}</td></tr>`).join('')}</table></div>
      <div class="box"><h3>Head coach</h3><div style="font-size:9.5px;line-height:1.6"><b>${esc(F.coach||'TBA')}</b><br>${esc(F.coachbio||'Fill the bio on the Opening Weekend tab.')}</div></div>
    </div>
    <div class="box"><h3>Year one in Florence — FPHL 2025-26</h3><div style="font-size:9.5px;line-height:1.6">${(o.story.fphl||'').split('\n').filter(Boolean).map(t=>'&bull; '+esc(t)).join('<br>')||'Fill on the Opening Weekend tab.'}</div></div>
    <div class="gn-cols">
      <div class="box"><h3>Who they were — FPHL leaders</h3><div style="font-size:9.5px;line-height:1.6">${(o.story.leaders||'').split('\n').filter(Boolean).map(esc).join('<br>')||'—'}</div></div>
      <div class="box"><h3>PD preseason results</h3><div style="font-size:9.5px;line-height:1.6">${(o.story.preseason||'').split('\n').filter(Boolean).map(esc).join('<br>')||'None entered'}</div></div>
    </div>`));
  // ---- how the IceCats were built ----
  const org=owOrigins();
  const groups={};org.forEach(r=>{(groups[r.group]=groups[r.group]||[]).push(r);});
  const builtBody=org.length
    ?Object.keys(groups).map(g=>`<div class="box"><h3>${esc(g)} (${groups[g].length})</h3><table class="pk-t">${groups[g].map(r=>`<tr><td>${r.p.num?'#'+esc(r.p.num)+' ':''}${esc(r.p.name)} ${r.p.pos?'('+esc(r.p.pos)+')':''}</td><td class="r">${esc(r.origin||'—')}</td></tr>`).join('')}</table></div>`).join('')
    :'<div class="box"><h3>Roster origins</h3><div style="font-size:9.5px;color:var(--ink-2)">Not published yet — the SPHL feed has no Pee Dee roster for 2026-27. Run a Game Day Refresh; every player&rsquo;s previous stop then lists here from EP career data (an expansion club&rsquo;s version of &ldquo;returning players&rdquo;).</div></div>';
  pages.push(pgWrap(red,S,'HOW THE ICECATS WERE BUILT',builtBody));
  // ---- connections ----
  const connBody=(o.connections.length
    ?`<div class="box"><h3>Played with / against</h3><table class="pk-t">${o.connections.map(c=>`<tr><td>${esc(c.a)} &amp; ${esc(c.b)}</td><td class="r">${esc(c.note)}</td></tr>`).join('')}</table></div>`
    :'<div class="box"><h3>Connections</h3><div style="font-size:9.5px;color:var(--ink-2)">No shared history found yet — run the EP scan on the Opening Weekend tab or add pairs by hand.</div></div>');
  const nums=(o.story.nums||'').split('\n').filter(Boolean);
  const R=DATA.report,hsv=R.teamStats&&R.teamStats['Huntsville'];
  if(hsv&&hsv.players&&hsv.players.length){
    const top=[...hsv.players].sort((a,b)=>(b.pts||0)-(a.pts||0))[0];
    if(top)nums.push(top.name+' led the Havoc with '+top.pts+' points'+(R.seasonLabel?' — '+R.seasonLabel:' (2025-26, last season)'));
  }
  pages.push(pgWrap(red,S,'CONNECTIONS · STORYLINES · BY THE NUMBERS',`
    ${connBody}
    <div class="gn-cols">
      <div class="box"><h3>Storylines</h3><div style="font-size:9.5px;line-height:1.6">${[o.story.s1,o.story.s2,o.story.s3].filter(Boolean).map(t=>'&bull; '+esc(t)).join('<br>')||'Write storylines on the Opening Weekend tab.'}</div></div>
      <div class="box"><h3>By the numbers</h3><div style="font-size:9.5px;line-height:1.6">${nums.map(t=>'&bull; '+esc(t)).join('<br>')||'—'}</div></div>
    </div>`));
  // ---- firsts watch ----
  pages.push(pgWrap(red,S,'SPHL FRANCHISE FIRSTS WATCH — PEE DEE ICECATS',`
    <div class="box"><h3>Check them off as they happen</h3><table class="pk-t">${o.firsts.map(f=>`<tr><td>${f.done?'☑':'☐'} ${esc(f.t)}</td><td class="r">${esc(f.detail||'________________________')}</td></tr>`).join('')}</table></div>
    <div style="font-size:9px;color:var(--ink-2);margin-top:6px">This checklist is the permanent record — the in-app tracker feeds first-time/last-time data going forward.</div>`));
  const doc=document.getElementById('openingDoc');
  const ostamp=dataStampHTML('opening');
  if(doc)doc.innerHTML=pages.map((p,i)=>p.replace('<div class="gn-foot"',ostamp+'<div class="gn-foot"').replace(/__PGNO__/g,'PAGE '+(i+1))).join('');
}
function owPrint(){
  owBuild();
  const panel=document.getElementById('panel-opening');
  panel.classList.add('printing');
  setTimeout(()=>{window.print();panel.classList.remove('printing');},150);
}
function owArchive(){
  if(!confirm('Archive Opening Weekend?\n\nEverything (franchise file, firsts record, connections, storylines) stays saved as the permanent record, the tab leaves the nav, and Pee Dee becomes a normal opponent everywhere.'))return;
  owSave();
  owData().archived=true;owData().archivedAt=new Date().toISOString();
  save();
  const btn=document.getElementById('tab_opening');if(btn)btn.style.display='none';
  showTab('game');
  toast('Opening Weekend archived — the record lives on under DATA and the firsts tracker');
}

/* ============ HAVOC HEADSHOTS (Meet the Team) ============
   Official photos from HockeyTech's asset CDN, keyed by the same player_id the
   roster feed returns. CONFIRMED by the ht-probe Action against 2761 (Brian
   Wilson): https://assets.leaguestat.com/sphl/{size}/{player_id}.jpg
     60x60 = 200 (4.9KB) · 120x160 = 200 (17.8KB) · 240x240 = 200 (35KB, LARGEST)
     320x240 / 480x480 = 404 · CDN sends NO CORS headers (plain <img> only —
     no crossorigin attribute or every load fails; canvas pixel checks taint).
   Sizes are tried largest-first at render time (240x240 → 120x160 → feed URL →
   manual upload); a failed image collapses the entry to TEXT-ONLY layout —
   no placeholders, no initials, no broken frames. The duplicate-hash default-
   silhouette check below is best-effort: it only works where pixels are
   readable, and degrades silently to load-success detection otherwise.
   HAVOC PLAYERS ONLY — no photo fetching for any other team, anywhere. */
/* The roster feed hands us player_image verbatim — that is the source of truth.
   120x160 is small for print, so the one larger size that actually exists is
   tried first and falls back to what the feed gave us. The filename is the
   roster "id" (what we store as htId), not person_id.
   Probed live Aug 6, 2026 against id 3801: 120x160 = 200 (17.5KB) ·
   240x240 = 200 (37KB) · 240x320 and 360x480 = 404. Don't add sizes back
   without re-probing — a 404 costs a request and a flash of broken image. */
function havocHeadSrcs(p){
  const srcs=[];
  const bigger=u=>{
    const m=String(u||'').match(/^(https?:\/\/[^\s]*\/)(\d+x\d+)(\/[^\/]+)$/);
    return m?['240x240'].filter(s=>s!==m[2]).map(s=>m[1]+s+m[3]):[];
  };
  if(p.imgData)srcs.push(p.imgData);   // his own upload outranks every feed URL
  if(p.img){bigger(p.img).forEach(u=>srcs.push(u));srcs.push(p.img);}
  if(p.htId){                       // no feed url yet — the documented pattern
    srcs.push('https://assets.leaguestat.com/sphl/240x240/'+p.htId+'.jpg');
    srcs.push('https://assets.leaguestat.com/sphl/120x160/'+p.htId+'.jpg');
  }
  return [...new Set(srcs)];
}
function mtpImgErr(el){
  const alts=(el.dataset.alts||'').split('|').filter(Boolean);
  if(alts.length){el.src=alts.shift();el.dataset.alts=alts.join('|');return;}
  const card=el.closest('.mtp-card');
  if(card)card.classList.add('no-photo'); // contingency: text-only, full width
}
/* generic-silhouette detection: if several players' images hash identical,
   that's the CDN's default placeholder — drop them all to text-only.
   Needs CORS-readable pixels; degrades silently if the CDN taints the canvas. */
function mtpDetectDefaults(root){
  try{
    const imgs=[...(root||document).querySelectorAll('.mtp-photo')].filter(i=>i.complete&&i.naturalWidth>0);
    const hashes=new Map();
    imgs.forEach(img=>{
      try{
        const c=document.createElement('canvas');c.width=16;c.height=16;
        const x=c.getContext('2d');x.drawImage(img,0,0,16,16);
        const h=c.toDataURL(); // throws if tainted
        (hashes.get(h)||hashes.set(h,[]).get(h)).push(img);
      }catch(e){}
    });
    hashes.forEach(list=>{
      if(list.length>=2)list.forEach(img=>{const card=img.closest('.mtp-card');if(card)card.classList.add('no-photo');});
    });
  }catch(e){}
}
/* wait for packet images before printing — never print an empty box */
function imagesReady(root,ms){
  const imgs=[...(root||document).querySelectorAll('img')].filter(i=>!i.complete);
  if(!imgs.length)return Promise.resolve();
  return Promise.race([
    Promise.allSettled(imgs.map(i=>new Promise(r=>{i.addEventListener('load',r,{once:true});i.addEventListener('error',r,{once:true});}))),
    new Promise(r=>setTimeout(r,ms||3000))
  ]);
}

/* ============ SPHL VENUE REFERENCE + ROAD-GAME HELPERS ============ */
/* capacities per the Aug 5, 2026 research file; "•" = UNVERIFIED hockey config, confirm & edit */
const VENUES_DEFAULT={
 "Huntsville Havoc":{arena:"Propst Arena at the Von Braun Center",city:"Huntsville, AL",tz:"Central",cap:"~6,600 •",notes:""},
 "Athens Rock Lobsters":{arena:"Akins Ford Arena (The Tank)",city:"Athens, GA",tz:"Eastern",cap:"5,500",notes:"Opened Dec 13, 2024"},
 "Birmingham Bulls":{arena:"Pelham Civic Complex",city:"Pelham, AL",tz:"Central",cap:"4,100",notes:""},
 "Evansville Thunderbolts":{arena:"Ford Center",city:"Evansville, IN",tz:"Central",cap:"9,000",notes:""},
 "Fayetteville Marksmen":{arena:"Crown Coliseum",city:"Fayetteville, NC",tz:"Eastern",cap:"10,000",notes:""},
 "Knoxville Ice Bears":{arena:"Knoxville Civic Coliseum",city:"Knoxville, TN",tz:"Eastern",cap:"6,500",notes:""},
 "Macon Mayhem":{arena:"Macon Coliseum",city:"Macon, GA",tz:"Eastern",cap:"7,182",notes:""},
 "Pee Dee IceCats":{arena:"Florence Center",city:"Florence, SC",tz:"Eastern",cap:"~7,600 •",notes:"10,000 total; hockey config unverified"},
 "Pensacola Ice Flyers":{arena:"Pensacola Bay Center",city:"Pensacola, FL",tz:"Central",cap:"8,082",notes:""},
 "Peoria Rivermen":{arena:"Carver Arena at Peoria Civic Center",city:"Peoria, IL",tz:"Central",cap:"9,919",notes:""},
 "Quad City Storm":{arena:"Vibrant Arena at The MARK",city:"Moline, IL",tz:"Central",cap:"9,200",notes:""},
 "Roanoke Rail Yard Dawgs":{arena:"Berglund Center",city:"Roanoke, VA",tz:"Eastern",cap:"8,672",notes:""}
};
function venueFor(teamFull){
  if(!teamFull)return null;
  const key=Object.keys(VENUES_DEFAULT).find(k=>k===teamFull)||Object.keys(VENUES_DEFAULT).find(k=>k.split(' ')[0].toLowerCase()===String(teamFull).split(' ')[0].toLowerCase());
  if(!key)return null;
  return {...VENUES_DEFAULT[key],...((DATA.venues||{})[key]||{}),team:key};
}
function venueSet(team,field,v){DATA.venues=DATA.venues||{};(DATA.venues[team]=DATA.venues[team]||{})[field]=v;save();}
function renderVenues(){
  const el=document.getElementById('venueTableWrap');if(!el)return;
  el.innerHTML=`<table class="roster"><thead><tr><th>Team</th><th>Arena</th><th>City</th><th>TZ</th><th>Cap.</th><th>Booth notes</th></tr></thead><tbody>
    ${Object.keys(VENUES_DEFAULT).map(t=>{const v=venueFor(t);return `<tr><td style="font-weight:800">${esc(t)}</td>
      <td><input type="text" value="${esc(v.arena)}" onchange="venueSet('${esc(t)}','arena',this.value)"></td>
      <td><input type="text" style="width:110px" value="${esc(v.city)}" onchange="venueSet('${esc(t)}','city',this.value)"></td>
      <td><select onchange="venueSet('${esc(t)}','tz',this.value)"><option${v.tz==='Central'?' selected':''}>Central</option><option${v.tz==='Eastern'?' selected':''}>Eastern</option></select></td>
      <td><input type="text" style="width:60px" value="${esc(v.cap)}" onchange="venueSet('${esc(t)}','cap',this.value)"></td>
      <td><input type="text" value="${esc(v.notes)}" placeholder="booth location, wifi, contacts…" onchange="venueSet('${esc(t)}','notes',this.value)"></td></tr>`;}).join('')}</tbody></table>`;
}
/* "7:15 PM ET (6:15 PM CT)" for Eastern rinks, "7:05 PM CT" for Central — from the 24h time input */
function fmtDualTime(t24,tz){
  const m=String(t24||'').match(/^(\d{1,2}):(\d{2})/);
  if(!m)return '';
  const f=(h,mm)=>{const ap=h>=12?'PM':'AM';return ((h%12)||12)+':'+mm+' '+ap;};
  let h=+m[1];const mm=m[2];
  if(tz==='Eastern')return f(h,mm)+' ET ('+f((h+23)%24,mm)+' CT)';
  return f(h,mm)+' CT';
}
/* road game: promo is N/A, packet shows the opponent's building */
function updatePromoField(){
  const el=document.getElementById('g_promo');if(!el)return;
  if(val('g_homeaway')==='@'){el.value='N/A (road game)';el.disabled=true;}
  else{el.disabled=false;if(el.value==='N/A (road game)')el.value=(typeof promoFor==='function'&&val('g_date'))?promoFor(val('g_date')):'';}
}
/* pronunciation entries for a roster: player field first, Settings guide as fallback */
function teamPronList(list){
  const guide=(DATA.settings.pronounce||'').split('\n').map(l=>{const m2=l.split(/\s*[-–—]\s*/);return {name:(m2[0]||'').trim(),say:m2.slice(1).join('-').trim()};}).filter(x=>x.name&&x.say);
  const out=[];
  (list||[]).filter(p=>p.name).forEach(p=>{
    let say=(p.pron||'').trim();                                 // the feed's phonetic_name wins
    if(!say)say=bioLine((biosFor(p)||{}).pronunciation);         // then the authored bios file
    if(!say){const lastNm=p.name.trim().split(/\s+/).pop().toLowerCase();
      const hit=guide.find(g2=>g2.name.toLowerCase().indexOf(lastNm)>=0);
      if(hit)say=hit.say;}
    if(!say&&p.pronAsk)say='— ask him —';
    if(say)out.push({name:p.name,say});
  });
  return out;
}
function pronBoxHTML(title,list,blanks){
  const entries=teamPronList(list);
  const rows=entries.length
    ?entries.map(e=>`<tr><td>${esc(e.name)}</td><td class="r" style="font-style:italic">${esc(e.say)}</td></tr>`).join('')
    :Array.from({length:blanks||5},()=>'<tr><td style="border-bottom:1px solid #ccc">&nbsp;</td><td style="border-bottom:1px solid #ccc">&nbsp;</td></tr>').join('');
  return `<div class="box"><h3>${esc(title)}</h3><table class="pk-t"><tr><th>Name</th><th class="r">Say it</th></tr>${rows}</table></div>`;
}

/* ============ FULL SPHL CAREER STATS + PLAYER IMAGES ============
   Uses the same feed the league's own player pages run on:
   ?feed=statviewfeed&view=player&player_id=<htId>&season_id=<id>&site_id=2
   One call per rostered Havoc player (we already hold their HockeyTech ids). */
function htCareerParse(d){
  const rows=[];let img='';
  const seen=new Set();
  const walk=v=>{
    if(Array.isArray(v)){v.forEach(walk);return;}
    if(v&&typeof v==='object'){
      const sn=pick(v,['season_name','seasonName','shortname','season'],null);
      const hasGp=(v.games_played!=null&&v.games_played!=='')||(v.gp!=null&&v.gp!=='');
      if(sn&&hasGp&&String(sn).match(/\d{4}/)){
        const k=String(sn)+'|'+String(pick(v,['team_name','team_code','team'],''))+'|'+String(pick(v,['games_played','gp'],''));
        if(!seen.has(k)){seen.add(k);rows.push(v);}
        return;
      }
      Object.keys(v).forEach(k=>{
        const x=v[k];
        if(typeof x==='string'&&!img&&/\.(jpe?g|png)(\?|$)/i.test(x)&&/image|photo|media|assets|headshot/i.test(k+x))img=x;
        walk(x);
      });
    }
  };
  walk(d);
  return {rows,img};
}
function htCareerRow(r,isG){
  const season=String(pick(r,['season_name','seasonName','shortname','season'],''))
    .replace(/\s*Regular Season\s*/i,'').replace(/(\d{4})-(\d{2})(\d{2})/,'$1-$3');
  const playoffs=/playoff/i.test(String(pick(r,['season_name','seasonName','season'],'')));
  const base={season,playoffs,team:String(pick(r,['team_name','teamname','team_code','team'],'')).trim(),gp:+pick(r,['games_played','gp'],0)};
  if(isG)return {...base,w:+pick(r,['wins','w'],0),l:+pick(r,['losses','l'],0),otl:+pick(r,['ot_losses','otl'],0),
    so:+pick(r,['shutouts','so'],0),gaa:String(pick(r,['goals_against_average','gaa'],'')),svpct:String(pick(r,['save_percentage','savepct','svpct'],''))};
  return {...base,g:+pick(r,['goals','g'],0),a:+pick(r,['assists','a'],0),pts:+pick(r,['points','pts'],0),pim:+pick(r,['penalty_minutes','pim'],0)};
}
async function htPullCareers(force,quiet){
  const st=document.getElementById('htCareerMsg');
  const say=t=>{if(st)st.textContent=t;};
  DATA.careerHT=DATA.careerHT||{players:{}};
  const list=DATA.roster.filter(p=>p.name&&p.htId);
  if(!list.length){say('No players with HockeyTech ids — run a Game Day Refresh first.');return 'no players with HockeyTech ids yet';}
  const fresh=DATA.careerHT.at&&(Date.now()-Date.parse(DATA.careerHT.at))<7*86400000;
  if(fresh&&!force&&Object.keys(DATA.careerHT.players).length){say('Career stats already pulled this week — hold Shift+click to force.');return 'already current this week';}
  let done=0,got=0;
  for(const p of list){
    say('Career stats: '+p.name+' ('+(done+1)+'/'+list.length+')…');
    try{
      const d=await htFetch({feed:'statviewfeed',view:'player',player_id:p.htId,season_id:activeSeasonId(),site_id:'2',league_id:'',lang:'en'});
      const parsed=htCareerParse(d);
      const isG=p.pos==='G';
      const rows=parsed.rows.map(r=>htCareerRow(r,isG)).filter(r=>r.season&&r.gp>0);
      if(rows.length||parsed.img){
        DATA.careerHT.players[p.htId]={name:p.name,img:parsed.img||((DATA.careerHT.players[p.htId]||{}).img||''),rows};
        if(parsed.img)p.img=parsed.img;
        got++;
      }
    }catch(e){console.warn('career',p.name,e.message);}
    done++;
  }
  DATA.careerHT.at=new Date().toISOString();syncMark('careers');
  save();
  say('Career stats: '+got+'/'+list.length+' players pulled — on the packet’s career pages.');
  if(!quiet)toast('SPHL career stats pulled for '+got+' player'+(got!==1?'s':''));
  return got+'/'+list.length+' players';
}
function htCareerFor(p){
  const c=DATA.careerHT&&DATA.careerHT.players&&p.htId&&DATA.careerHT.players[p.htId];
  return c&&c.rows&&c.rows.length?c:null;
}

/* ============ PRE / POST-GAME INTERVIEWS ============ */
function ivKey(){return (DATA.game.date||'undated')+' | '+(DATA.game.opp||'no opponent');}
function ivStore(){
  DATA.interviews=DATA.interviews||{};
  const k=ivKey();
  return DATA.interviews[k]=DATA.interviews[k]||{pre:[],post:[]};
}
function ivFind(kind,id){return ivStore()[kind].find(x=>x.id===id);}
function ivAdd(kind){
  ivStore()[kind].push({id:uid(),person:'',role:'coach',team:'Huntsville Havoc',time:'',questions:[],notes:'',quotes:[]});
  save();ivRender(kind);
}
function ivDel(kind,id){
  if(!confirm('Delete this interview?'))return;
  const st=ivStore();st[kind]=st[kind].filter(x=>x.id!==id);save();ivRender(kind);
}
function ivQAdd(kind,id,inputId){
  const e=ivFind(kind,id);const el=document.getElementById(inputId);
  if(!e||!el||!el.value.trim())return;
  e.questions.push({t:el.value.trim(),asked:0});el.value='';save();ivRender(kind);
}
function ivQMove(kind,id,i,d){
  const q=ivFind(kind,id).questions;
  const j=i+d;if(j<0||j>=q.length)return;
  [q[i],q[j]]=[q[j],q[i]];save();ivRender(kind);
}
function ivQDel(kind,id,i){const e=ivFind(kind,id);e.questions.splice(i,1);save();ivRender(kind);}
function ivQAsked(kind,id,i,v){ivFind(kind,id).questions[i].asked=v?1:0;save();}
function ivQuoteAdd(kind,id,inputId){
  const e=ivFind(kind,id);const el=document.getElementById(inputId);
  if(!e||!el||!el.value.trim())return;
  e.quotes.push({t:el.value.trim(),star:0});el.value='';save();ivRender(kind);
}
function ivQuoteStar(kind,id,i){const q=ivFind(kind,id).quotes[i];q.star=q.star?0:1;save();ivRender(kind);}
function ivQuoteDel(kind,id,i){ivFind(kind,id).quotes.splice(i,1);save();ivRender(kind);}
function ivField(kind,id,f,v){const e=ivFind(kind,id);if(e){e[f]=v;save();}}
function ivEntryHTML(kind,e){
  const qs=e.questions.map((q,i)=>`<div class="iv-q">
    <button class="icon-btn" onclick="ivQMove('${kind}','${e.id}',${i},-1)">▲</button>
    <button class="icon-btn" onclick="ivQMove('${kind}','${e.id}',${i},1)">▼</button>
    <input type="checkbox" ${q.asked?'checked':''} title="asked" onchange="ivQAsked('${kind}','${e.id}',${i},this.checked)">
    <span class="iv-qt${q.asked?' iv-asked':''}">${esc(q.t)}</span>
    <button class="icon-btn" onclick="ivQDel('${kind}','${e.id}',${i})">✕</button>
  </div>`).join('');
  const quotes=e.quotes.map((q,i)=>`<div class="iv-q">
    <button class="icon-btn iv-star${q.star?' on':''}" title="usable quote" onclick="ivQuoteStar('${kind}','${e.id}',${i})">${q.star?'★':'☆'}</button>
    <span class="iv-qt">${esc(q.t)}</span>
    <button class="icon-btn" onclick="ivQuoteDel('${kind}','${e.id}',${i})">✕</button>
  </div>`).join('');
  return `<div class="iv-entry">
    <div class="grid g4">
      <div class="field hub-field"><label>Person</label><input type="text" value="${esc(e.person)}" onchange="ivField('${kind}','${e.id}','person',this.value)"></div>
      <div class="field hub-field"><label>Role</label><select onchange="ivField('${kind}','${e.id}','role',this.value)">${['coach','player','other'].map(r=>`<option${e.role===r?' selected':''}>${r}</option>`).join('')}</select></div>
      <div class="field hub-field"><label>Team</label><input type="text" value="${esc(e.team)}" onchange="ivField('${kind}','${e.id}','team',this.value)"></div>
      <div class="field hub-field"><label>Scheduled time</label><input type="text" value="${esc(e.time)}" placeholder="5:45 PM" onchange="ivField('${kind}','${e.id}','time',this.value)"></div>
    </div>
    <div class="section-label hub-sectionhead">Prepared questions</div>
    ${qs||'<div class="empty" style="padding:6px">No questions yet.</div>'}
    <div class="iv-add"><input type="text" id="ivq_${e.id}" placeholder="Add a question…"><button class="btn small" onclick="ivQAdd('${kind}','${e.id}','ivq_${e.id}')">Add</button></div>
    <div class="field hub-field" style="margin-top:8px"><label>Answers / notes</label><textarea rows="3" onchange="ivField('${kind}','${e.id}','notes',this.value)">${esc(e.notes)}</textarea></div>
    <div class="section-label hub-sectionhead">Quotable lines (★ = usable)</div>
    ${quotes||''}
    <div class="iv-add"><input type="text" id="ivu_${e.id}" placeholder="Add a line worth quoting…"><button class="btn small" onclick="ivQuoteAdd('${kind}','${e.id}','ivu_${e.id}')">Add</button></div>
    <div class="btn-row" style="margin-top:8px">
      <button class="btn small secondary" onclick="ivPrint('${kind}','${e.id}')">Print question sheet</button>
      <button class="btn small secondary" style="color:var(--red-text)" onclick="ivDel('${kind}','${e.id}')">Delete</button>
    </div>
  </div>`;
}
function ivArchiveHTML(kind,q){
  q=String(q||'').toLowerCase();
  const cur=ivKey();
  const rows=[];
  Object.keys(DATA.interviews||{}).sort().reverse().forEach(k=>{
    if(k===cur)return;
    const list=(DATA.interviews[k][kind]||[]);
    if(!list.length)return;
    const hit=!q||k.toLowerCase().indexOf(q)>=0||list.some(e=>(e.person||'').toLowerCase().indexOf(q)>=0);
    if(!hit)return;
    rows.push(`<details class="iv-arch"><summary><b>${esc(k)}</b> — ${list.map(e=>esc(e.person||'?')).join(', ')}</summary>
      ${list.map(e=>`<div class="iv-arch-body"><b>${esc(e.person)}</b> (${esc(e.role)}, ${esc(e.team)})${e.time?' · '+esc(e.time):''}
        ${e.questions.length?'<br>Q: '+e.questions.map(x=>esc(x.t)).join(' · '):''}
        ${e.notes?'<br>Notes: '+esc(e.notes):''}
        ${e.quotes.length?'<br>Quotes: '+e.quotes.map(x=>(x.star?'★ ':'')+esc(x.t)).join(' · '):''}</div>`).join('')}
    </details>`);
  });
  return rows.length?rows.join(''):'<div class="empty" style="padding:6px">No archived interviews'+(q?' match "'+esc(q)+'"':'')+'.</div>';
}
function ivRender(kind){
  const wrap=document.getElementById('ivWrap_'+kind);if(!wrap)return;
  const list=ivStore()[kind];
  wrap.innerHTML=`<div style="font-size:12px;font-weight:700;color:var(--ink-2);margin-bottom:6px">Game: ${esc(ivKey())}</div>`
    +list.map(e=>ivEntryHTML(kind,e)).join('')
    +`<div class="btn-row"><button class="btn secondary" onclick="ivAdd('${kind}')">+ Add interview</button></div>
    <div class="section-label" style="margin-top:12px">Season archive</div>
    <div class="iv-add"><input type="text" id="ivs_${kind}" placeholder="Search by opponent or person…" oninput="document.getElementById('ivarch_${kind}').innerHTML=ivArchiveHTML('${kind}',this.value)"></div>
    <div id="ivarch_${kind}">${ivArchiveHTML(kind,'')}</div>`;
}
function ivSheetHTML(kind,e){
  const S=DATA.settings,red=S.red||'#C8102E';
  const qRows=(e.questions.length?e.questions:[{t:''},{t:''},{t:''},{t:''},{t:''}]).map((q,i)=>
    `<div class="ivs-q"><b>${i+1}.</b> ${esc(q.t)}<div class="ivs-line"></div><div class="ivs-line"></div></div>`).join('');
  return `<div class="page" style="--havoc-red:${red}">
    <div class="pg-head" style="border-color:${red}"><div class="pg-logo">${logoHTML("Huntsville Havoc",'','H')}</div>
      <div class="pg-title" style="color:${red}">${kind==='pre'?'PRE':'POST'}-GAME INTERVIEW</div><div class="pg-num">SHEET</div></div>
    <div style="font-size:14px;font-weight:900;margin:6px 0 2px">${esc(e.person||'____________')} · ${esc(e.role)} · ${esc(e.team)}</div>
    <div style="font-size:11px;color:var(--ink-2);margin-bottom:8px">${esc(ivKey())}${e.time?' · scheduled '+esc(e.time):''}</div>
    ${qRows}
    <div style="margin-top:14px">${mediaBlockHTML('media-block')}</div>
    ${dataStampHTML('interview')}
    <div class="gn-foot"><span>${esc(S.social)}</span><span>${esc(S.footer)}</span><span>INTERVIEW</span></div>
  </div>`;
}
function ivPrint(kind,id){
  const e=ivFind(kind,id);if(!e)return;
  const d=document.createElement('div');
  d.className='panel printing';
  d.innerHTML=ivSheetHTML(kind,e);
  document.body.appendChild(d);
  setTimeout(()=>{window.print();d.remove();},120);
}

/* ============ SETTINGS / BACKUP ============ */
function loadSettings(){const s=DATA.settings;setv('s_red',s.red);setv('s_city',s.city);setv('s_name',s.name);setv('s_venue',s.venue);setv('s_footer',s.footer);setv('s_social',s.social);setv('s_pronounce',s.pronounce);['mediaName','mediaTitle','mediaOrg','mediaPhone','mediaEmail','mediaWeb'].forEach(k=>setv('s_'+k,s[k]));}
function saveSettings(){Object.assign(DATA.settings,{red:val('s_red'),city:val('s_city'),name:val('s_name'),venue:val('s_venue'),footer:val('s_footer'),social:val('s_social'),pronounce:document.getElementById('s_pronounce').value,mediaName:val('s_mediaName'),mediaTitle:val('s_mediaTitle'),mediaOrg:val('s_mediaOrg'),mediaPhone:val('s_mediaPhone'),mediaEmail:val('s_mediaEmail'),mediaWeb:val('s_mediaWeb')});save();toast("Settings saved");}
/* Backups carry a schema version so future imports can migrate old files;
   schema 1 = a bare DATA object (old exports), still importable */
const BACKUP_SCHEMA=2;
function exportPayload(){return {app:'havoc-hub',schema:BACKUP_SCHEMA,exportedAt:new Date().toISOString(),data:DATA};}
function applyImported(parsed){
  const d=(parsed&&parsed.app==='havoc-hub'&&parsed.data)?parsed.data:parsed;
  if(!d||typeof d!=='object'||Array.isArray(d))throw new Error('not a backup');
  DATA=Object.assign(structuredClone(DEFAULT_DATA),d);
  save();initForms();renderRoster();updateAppMark();
}
function exportData(tag){const blob=new Blob([JSON.stringify(exportPayload(),null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='havoc-hub-backup-'+new Date().toISOString().slice(0,10)+(tag?'-'+tag:'')+'.json';a.click();try{localStorage.setItem(KEY+'_lastbk',String(Date.now()));}catch(e){}bkStatusRender();toast(tag?"Safety backup downloaded":"Backup downloaded");}
function importData(e){const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{try{applyImported(JSON.parse(rd.result));toast("Backup imported");}catch(err){toast("Invalid backup file");}};rd.readAsText(f);e.target.value='';}

/* ============ macOS DATA SAFETY (Part B) ============ */
let PERSIST_GRANTED=null,BK_NEEDS_PERM=false;
function browserInfo(){
  const ua=navigator.userAgent;
  const isMac=/Mac/i.test(navigator.platform||ua);
  let name='this browser';
  if(/Edg\//.test(ua))name='Edge';
  else if((/Chrome\//.test(ua)||/CriOS/.test(ua)))name='Chrome';
  else if(/Firefox/i.test(ua))name='Firefox';
  else if(/Safari/.test(ua))name='Safari';
  return {name,isMac};
}
function bkFSASupported(){return typeof window.showDirectoryPicker==='function';}
async function bkChooseFolder(){
  if(!bkFSASupported()){toast("This browser can't auto-save to a folder — use Export weekly (in Safari, also try File → Add to Dock)");return;}
  try{
    const dir=await showDirectoryPicker({mode:'readwrite',id:'havoc-backups'});
    await idbSet('bkdir',dir);BK_NEEDS_PERM=false;
    toast('Backup folder set — a dated backup will be written once per day of use');
    await bkAutoRun();
  }catch(e){}
}
async function bkEnable(){
  const dir=await idbGet('bkdir').catch(()=>null);
  if(!dir)return bkChooseFolder();
  try{
    const p=await dir.requestPermission({mode:'readwrite'});
    if(p==='granted'){BK_NEEDS_PERM=false;await bkAutoRun();toast('Folder access re-enabled');}
  }catch(e){}
}
async function bkAutoRun(){
  try{
    if(!bkFSASupported())return bkStatusRender();
    const dir=await idbGet('bkdir').catch(()=>null);
    if(!dir)return bkStatusRender();
    const perm=await dir.queryPermission({mode:'readwrite'});
    if(perm!=='granted'){BK_NEEDS_PERM=true;return bkStatusRender();}
    const today=new Date().toISOString().slice(0,10);
    const name='havoc-hub-backup-'+today+'.json';
    let exists=false;try{await dir.getFileHandle(name);exists=true;}catch(e){}
    if(!exists){
      const fh=await dir.getFileHandle(name,{create:true});
      const w=await fh.createWritable();
      await w.write(JSON.stringify(exportPayload(),null,1));
      await w.close();
      try{localStorage.setItem(KEY+'_lastbk',String(Date.now()));}catch(e){}
    }
    const names=[];
    for await(const entry of dir.keys()){if(/^havoc-hub-backup-\d{4}-\d{2}-\d{2}\.json$/.test(entry))names.push(entry);}
    names.sort();
    while(names.length>10){const old=names.shift();try{await dir.removeEntry(old);}catch(e){}}
    bkStatusRender();
  }catch(e){bkStatusRender();}
}
async function bkListBackups(){
  const box=document.getElementById('bkList');if(!box)return;
  const dir=bkFSASupported()?await idbGet('bkdir').catch(()=>null):null;
  if(!dir){box.innerHTML='<div class="empty">'+(bkFSASupported()?'No backup folder chosen yet.':'Folder backups aren’t supported in this browser — use Export backup instead.')+'</div>';return;}
  if(await dir.queryPermission({mode:'readwrite'})!=='granted'){box.innerHTML='<div class="empty">Re-enable folder access first (button above).</div>';return;}
  const rows=[];
  for await(const entry of dir.keys()){if(/^havoc-hub-backup-.*\.json$/.test(entry))rows.push(entry);}
  rows.sort().reverse();
  box.innerHTML=rows.length
    ?rows.map(n=>'<div style="display:flex;gap:10px;align-items:center;padding:4px 0;font-size:13px;border-bottom:1px solid #eee"><span style="flex:1">'+esc(n)+'</span><button class="btn small" onclick="bkRestoreFile(\''+esc(n)+'\')">Restore</button></div>').join('')
    :'<div class="empty">No auto-backups in the folder yet — one is written per day of use.</div>';
}
async function bkRestoreFile(name){
  const dir=await idbGet('bkdir').catch(()=>null);if(!dir)return;
  if(!confirm('Restore '+name+'?\n\nA safety copy of the CURRENT data downloads first.'))return;
  exportData();
  try{
    const fh=await dir.getFileHandle(name);
    const f=await fh.getFile();
    applyImported(JSON.parse(await f.text()));
    toast('Backup restored');
  }catch(e){toast('Could not read that backup');}
}
function bkReminder(){
  try{
    if(bkFSASupported())return; // folder auto-backup path covers Chrome/Edge
    const last=+(localStorage.getItem(KEY+'_lastbk')||0);
    const snooze=+(localStorage.getItem(KEY+'_bksnooze')||0);
    if((last&&Date.now()-last<7*86400000)||Date.now()<snooze)return;
    if(!last){localStorage.setItem(KEY+'_lastbk',String(Date.now()));return;} // first visit: start the 7-day clock
    if(document.getElementById('bkBanner'))return;
    const d=document.createElement('div');d.id='bkBanner';d.className='no-print';
    d.style.cssText='background:#8a1420;color:#fff;padding:9px 14px;font-size:13px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;position:sticky;top:0;z-index:60';
    d.innerHTML='<span style="flex:1">It’s been over a week since your last backup — download one now to keep the season safe (this browser can clear saved data).</span>'
      +'<button class="btn small" onclick="exportData();document.getElementById(\'bkBanner\').remove()">Download backup now</button>'
      +'<button class="btn small secondary" onclick="localStorage.setItem(KEY+\'_bksnooze\',String(Date.now()+86400000));document.getElementById(\'bkBanner\').remove()">Later</button>';
    document.body.prepend(d);
  }catch(e){}
}
async function bkInlineRender(){
  const el=document.getElementById('bkInline');if(!el)return;
  const last=+(localStorage.getItem(KEY+'_lastbk')||0);
  const dir=bkFSASupported()?await idbGet('bkdir').catch(()=>null):null;
  const when=last?syncTimeStr(last):null;
  if(dir&&!BK_NEEDS_PERM)el.innerHTML='Last backup: <b>'+(when||'none yet')+'</b> · folder connected ✓ (“'+esc(dir.name||'backups')+'”)';
  else if(dir)el.innerHTML='Last backup: <b>'+(when||'none yet')+'</b> · <span class="bk-warn">folder access needs a click</span> — <a onclick="bkEnable()">re-enable</a>';
  else if(bkFSASupported())el.innerHTML='Last backup: <b>'+(when||'none yet')+'</b> · <span class="bk-warn">No backup folder chosen</span> — <a onclick="bkChooseFolder()">set one up</a>';
  else el.innerHTML='Last backup: <b>'+(when||'none yet')+'</b> · folder backups aren\u2019t supported in this browser — export by hand.';
}
async function bkStatusRender(){
  bkInlineRender();
  const el=document.getElementById('bkStatus');if(!el)return;
  const bi=browserInfo();
  const dir=bkFSASupported()?await idbGet('bkdir').catch(()=>null):null;
  let dirLine;
  if(!bkFSASupported())dirLine='Folder auto-backup: <b>not supported in '+bi.name+'</b> — the 7-day reminder + Export covers you instead.';
  else if(!dir)dirLine='Folder auto-backup: <b>no folder chosen</b> — pick one inside iCloud Drive or Documents so backups sync.';
  else if(BK_NEEDS_PERM)dirLine='Folder auto-backup: folder set (“'+esc(dir.name||'backups')+'”) but access needs a click — <button class="btn small" onclick="bkEnable()">Re-enable folder access</button>';
  else dirLine='Folder auto-backup: <b>on</b> — writing a dated JSON to “'+esc(dir.name||'backups')+'” once per day of use (keeps the last 10).';
  let rec;
  if(bi.name==='Safari')rec='Safari can clear saved data after ~7 days without a visit — on a Mac, Chrome or this app installed to the Dock (File → Add to Dock) is safest.';
  else if(bi.name==='Chrome'||bi.name==='Edge')rec='good choice — persistent storage and folder auto-backups both work here.';
  else rec='for the safest setup on a Mac, use Chrome or install the app to the Dock.';
  const last=+(localStorage.getItem(KEY+'_lastbk')||0);
  el.innerHTML=[
    'Persistent storage: <b>'+(PERSIST_GRANTED===null?'checking…':(PERSIST_GRANTED?'granted — exempt from eviction':'not granted'))+'</b>',
    'Browser: <b>'+bi.name+(bi.isMac?' on macOS':'')+'</b> — '+rec,
    dirLine,
    'Last file backup: <b>'+(last?new Date(last).toLocaleString():'never')+'</b>'
  ].map(x=>'<div>'+x+'</div>').join('');
}
/* boot: ask for durable storage, offer the IndexedDB mirror if localStorage came up empty */
/* what a reset would actually cost, counted from the live store */
function resetSummary(){
  const g=Object.keys(DATA.gamelog||{}).length;
  const bios=DATA.roster.filter(p=>(p.notes&&p.notes.trim())||(p.bbio&&p.bbio.trim())).length;
  const iv=Object.keys(DATA.interviews||{}).length;
  const ov=Object.keys(DATA.statOv||{}).length+Object.keys(DATA.folderOv||{}).length;
  return [[DATA.roster.length,'roster players'],[bios,'written bios'],[g,'logged games'],
[iv,'interview sets'],[ov,'manual edits & overrides']];
}
function resetRender(){
  const el=document.getElementById('resetSummary');if(!el)return;
  el.innerHTML='<b>What you would lose:</b><br>'+resetSummary().map(r=>'&bull; '+r[0]+' '+r[1]).join('<br>');
  const inp=document.getElementById('resetConfirm');if(inp)inp.value='';
  resetCheck();
}
function resetCheck(){
  const btn=document.getElementById('resetGo');if(!btn)return;
  btn.disabled=(val('resetConfirm')||'').trim().toUpperCase()!=='RESET';
}
function safetyBackup(tag){
  try{exportData(tag);return true;}catch(e){return false;}
}
function revertAllOverridesSafe(){
  if(!confirm('Revert every manual override and hand edit back to the synced values?\n\nA backup file downloads first.'))return;
  safetyBackup('before-revert');
  revertAllOverrides();
}
function wipeAll(){
  if((val('resetConfirm')||'').trim().toUpperCase()!=='RESET'){toast('Type RESET to confirm');return;}
  safetyBackup('before-reset');
  localStorage.removeItem(KEY);
  DATA=structuredClone(DEFAULT_DATA);
  initForms();renderRoster();updateAppMark();
  closeModal('resetModal');
  toast('Everything reset — the backup file just downloaded is the way back');
}
/* ============ HOCKEY OPERATIONS TEAM ============ */
const HO_ROLES=[['hc','HEAD COACH'],['ac','ASSISTANT COACH'],['gm','GENERAL MANAGER'],['eq','EQUIPMENT MANAGER']];
function loadHockeyOps(){
  const H=DATA.hockeyOps||{};
  HO_ROLES.forEach(r=>{const k=r[0];setv('ho_'+k+'_name',(H[k]||{}).name);setv('ho_'+k+'_bio',(H[k]||{}).bio);});
}
function saveHockeyOps(){
  DATA.hockeyOps=DATA.hockeyOps||{};
  HO_ROLES.forEach(r=>{const k=r[0];DATA.hockeyOps[k]={name:val('ho_'+k+'_name'),bio:document.getElementById('ho_'+k+'_bio').value.trim()};});
  save();
}
function hockeyOpsPage(red,S){
  const H=DATA.hockeyOps||{};
  // hand-typed entries win; an empty role fills from the authored staff bios
  const SB=((BIOS_FILE||{}).staff)||{};
  const staffFor=re=>{
    const k=Object.keys(SB).find(n=>re.test(SB[n].role||''));
    if(!k)return null;
    return {name:k,bio:bioLine(SB[k].season_recap)||bioLine(SB[k].coaching_career).split('\n')[0]||''};
  };
  const FILL={hc:staffFor(/^hc$|head coach/i),ac:staffFor(/^ac$|assistant/i),gm:staffFor(/^gm$|general manager/i),eq:null};
  const items=HO_ROLES.map(r=>{
    const k=r[0],title=r[1],e=H[k]||{},f=FILL[k]||{};
    const name=(e.name||'').trim()||f.name||'',bio=(e.bio||'').trim()||f.bio||'';
    if(!name&&!bio)return '';
    return `<div class="box"><h3>${title}${name?' — '+esc(name):''}</h3><div style="font-size:10px;line-height:1.6">${esc(bio)||'<span style="color:var(--ink-2)">Bio to come.</span>'}</div></div>`;
  }).filter(Boolean).join('');
  if(!items)return '';
  return `<div class="page" style="--havoc-red:${red}">
    <div class="pg-head" style="border-color:${red}"><div class="pg-logo">${logoHTML("Huntsville Havoc",'','H')}</div><div class="pg-title" style="color:${red}">MEET THE HOCKEY OPERATIONS TEAM</div><div class="pg-num">__PGNO__</div></div>
    ${items}
    <div class="gn-foot"><span>${esc(S.social)}</span><span>${esc(S.footer)}</span><span>__PGNO__</span></div></div>`;
}

function restoreBackup(){
  let bk=null;try{bk=JSON.parse(localStorage.getItem(KEY+'_backup')||'null');}catch(e){}
  if(!bk||!bk.data){toast("No auto-backup found yet");return;}
  if(!confirm("Restore auto-backup from "+new Date(bk.at).toLocaleString()+"? Team logos are kept from current data."))return;
  const logos=DATA.logos||{};
  DATA=Object.assign(structuredClone(DEFAULT_DATA),bk.data);
  DATA.logos=logos;
  save();initForms();renderRoster();updateAppMark();toast("Auto-backup restored");
}

/* ===== Per-team color themes (primary/secondary) derived from SPHL guide "Team Colors" ===== */
/* Each club's marks: primary, secondary, a third accent for the defence group
   and a fourth for goalies, plus the text colour that reads on the primary.
   `ok:0` means the shade still wants checking against the club's own marks —
   the League Reference palette card flags those with a red dot. Every value is
   editable there and edits are kept for good. */
const TEAM_PALETTE = {
  "Huntsville Havoc":       {primary:"#C8102E", secondary:"#111114", accent:"#8E9092", goalie:"#5A5C5E", textOn:"#ffffff", ok:1}, // red / black · silver
  "Roanoke Rail Yard Dawgs":{primary:"#1B3A6B", secondary:"#C8A04B", accent:"#5BA8D8", goalie:"#2E5E9E", textOn:"#ffffff", ok:1}, // navy / gold
  "Pensacola Ice Flyers":   {primary:"#16284B", secondary:"#9BCBEB", accent:"#5A7290", goalie:"#3C6E9F", textOn:"#ffffff", ok:1}, // navy / Columbia blue
  "Birmingham Bulls":       {primary:"#C8102E", secondary:"#000000", accent:"#8E9092", goalie:"#5A5C5E", textOn:"#ffffff", ok:1}, // red / black
  "Athens Rock Lobsters":   {primary:"#C1272D", secondary:"#0F52BA", accent:"#0B7A75", goalie:"#7A1B20", textOn:"#ffffff", ok:1}, // crimson / sapphire
  "Pee Dee IceCats":        {primary:"#0AA3E0", secondary:"#C8102E", accent:"#0E3A5D", goalie:"#7BA7C7", textOn:"#ffffff", ok:1}, // electric blue / red
  "Macon Mayhem":           {primary:"#111114", secondary:"#C8102E", accent:"#9BCBEB", goalie:"#5A5C5E", textOn:"#ffffff", ok:1}, // black / Mayhem red · ice blue
  "Evansville Thunderbolts":{primary:"#C8102E", secondary:"#1B3D8F", accent:"#8E9092", goalie:"#5A5C5E", textOn:"#ffffff", ok:1}, // red / blue
  "Knoxville Ice Bears":    {primary:"#5B2B82", secondary:"#E87722", accent:"#111114", goalie:"#7A4BA6", textOn:"#ffffff", ok:0},
  "Peoria Rivermen":        {primary:"#13294B", secondary:"#C8A04B", accent:"#C8102E", goalie:"#2E5E9E", textOn:"#ffffff", ok:0},
  "Quad City Storm":        {primary:"#1a1a1a", secondary:"#F2C200", accent:"#1B3D8F", goalie:"#5A5C5E", textOn:"#ffffff", ok:0},
  "Fayetteville Marksmen":  {primary:"#E87722", secondary:"#1a1a1a", accent:"#6B7A3A", goalie:"#B45A15", textOn:"#ffffff", ok:0}
};
const PAL_KEYS=['primary','secondary','accent','goalie','textOn'];
function teamPal(name){
  const seed=TEAM_PALETTE[name]||{primary:"#C8102E",secondary:"#111114",accent:"#8E9092",goalie:"#5A5C5E",textOn:"#ffffff",ok:0};
  const mine=((DATA.palettes||{})[name])||{};
  return Object.assign({},seed,mine);
}
function palSet(name,key,v){
  if(PAL_KEYS.indexOf(key)<0)return;
  DATA.palettes=DATA.palettes||{};
  DATA.palettes[name]=DATA.palettes[name]||{};
  DATA.palettes[name][key]=v;DATA.palettes[name].ok=1;
  save();renderPalettes();if(typeof renderFolders==='function'&&document.getElementById('foldersDoc'))renderFolders();
}
function palReset(name){
  if(DATA.palettes)delete DATA.palettes[name];
  save();renderPalettes();if(typeof renderFolders==='function'&&document.getElementById('foldersDoc'))renderFolders();
}
const TEAM_THEME=TEAM_PALETTE;
function teamTheme(name){const p=teamPal(name);return {primary:p.primary,secondary:p.secondary,text:p.textOn};}

/* ===== AUTO-BIO GENERATORS ===== */
/* Stat bullets computed from imported report, for one player on a given team */
function autoStatBullets(player, teamStats, allReport){
  const bullets=[];
  if(!teamStats) return bullets;
  const isG = player.pos==='G';
  if(isG){
    const g=teamStats.goalies.find(x=>x.num===player.num||norm(x.name)===norm(player.name));
    if(g){
      bullets.push(`Season: ${g.w}-${g.l}-${g.otl} record, ${g.gaa} GAA, ${g.svpct} SV%${g.so?`, ${g.so} SO`:''} in ${g.gp} GP`);
      // league SV% rank
      if(allReport){
        const allG=[];Object.values(allReport.teamStats||{}).forEach(t=>t.goalies.forEach(x=>{if(x.gp>=2)allG.push(x);}));
        allG.sort((a,b)=>parseFloat(b.svpct)-parseFloat(a.svpct));
        const rk=allG.findIndex(x=>norm(x.name)===norm(g.name));
        if(rk>=0&&rk<8)bullets.push(`Ranks ${ordinal(rk+1)} among SPHL goalies in save percentage (${g.svpct})`);
      }
    }
    return bullets;
  }
  const st=teamStats.players.find(x=>x.num===player.num||norm(x.name)===norm(player.name));
  if(!st)return bullets;
  bullets.push(`Season: ${st.g}G-${st.a}A-${st.pts}P, ${st.pm>=0?'+':''}${st.pm}, ${st.pim} PIM in ${st.gp} GP`);
  // team rank in points
  const sorted=[...teamStats.players].sort((a,b)=>b.pts-a.pts);
  const teamRk=sorted.findIndex(x=>norm(x.name)===norm(st.name));
  if(teamRk===0)bullets.push(`Leads the team in scoring with ${st.pts} points`);
  else if(teamRk>0&&teamRk<3)bullets.push(`${ordinal(teamRk+1)} on the team in scoring (${st.pts} points)`);
  // goal leader
  const gSorted=[...teamStats.players].sort((a,b)=>b.g-a.g);
  if(gSorted[0]&&norm(gSorted[0].name)===norm(st.name)&&st.g>0)bullets.push(`Team leader in goals (${st.g})`);
  // plus minus standout
  if(st.pm>=8)bullets.push(`Strong two-way season at ${st.pm>=0?'+':''}${st.pm}`);
  // league points rank
  if(allReport){
    const allP=[];Object.values(allReport.teamStats||{}).forEach(t=>t.players.forEach(x=>allP.push(x)));
    allP.sort((a,b)=>b.pts-a.pts);
    const rk=allP.findIndex(x=>norm(x.name)===norm(st.name));
    if(rk>=0&&rk<10&&st.pts>0)bullets.push(`Top-10 in the SPHL in scoring (${ordinal(rk+1)}, ${st.pts} points)`);
  }
  return bullets;
}
function ordinal(n){const s=["th","st","nd","rd"],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0]);}

/* EP career bio parser — parses a full EP profile (facts + stats table) into bio bullets */
function parseEPCareer(text){
  const out={facts:{},bullets:[]};
  const grab=(label)=>{const m=text.match(new RegExp(label+"\\s*\\n?\\s*([^\\n]+)","i"));return m?m[1].trim():'';};
  // facts
  let nm=text.match(/^(.+?)\s+Facts/m);if(nm)out.facts.name=dedupeName(nm[1].trim());
  out.facts.birth=grab("Place of Birth").replace(/\[|\]|\(http.*$/g,'').replace(/,\s*(USA|CAN|SWE|FIN|CZE)\s*$/,'').trim();
  // parse career stats lines: "2024-25 <Team> <League> GP G A P ..."
  const lines=text.split(/\r?\n/);
  const seasons=[];
  for(let i=0;i<lines.length;i++){
    const yr=lines[i].match(/^\s*(\d{4}-\d{2})\s*$/);
    if(yr){
      // team usually 2 lines down, league + stats follow
      let team='',league='',stats='';
      for(let j=i+1;j<Math.min(i+5,lines.length);j++){
        const t=lines[j].trim();
        if(!t||t==='undefined flag')continue;
        if(!team&&/[A-Za-z]/.test(t)&&!/^\d/.test(t)){team=t;continue;}
        // league + numbers line
        const sm=t.match(/^([A-Za-z0-9 .\-]+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/);
        if(sm){league=sm[1].trim();stats={gp:+sm[2],g:+sm[3],a:+sm[4],p:+sm[5]};break;}
      }
      if(team)seasons.push({year:yr[1],team,league,stats});
    }
  }
  // build bullets from seasons
  if(seasons.length){
    const colSeasons=seasons.filter(s=>/NCAA|USPORTS|ACHA/i.test(s.league));
    const lastNonCurrent=seasons.filter(s=>!/2025-26/.test(s.year));
    // college mention
    const college=seasons.find(s=>/NCAA/i.test(s.league));
    if(college)out.bullets.push(`Played college hockey at ${college.team}${college.league?` (${college.league})`:''}`);
    // most recent prior team
    const prior=lastNonCurrent[lastNonCurrent.length-1];
    if(prior&&(!college||prior.team!==college.team))out.bullets.push(`Most recently with ${prior.team}${prior.league?` (${prior.league})`:''} in ${prior.year}`);
    // a notable stat season (highest points)
    const best=[...seasons].filter(s=>s.stats&&s.stats.p!=null).sort((a,b)=>b.stats.p-a.stats.p)[0];
    if(best&&best.stats.p>0)out.bullets.push(`Posted ${best.stats.g}G-${best.stats.a}A-${best.stats.p}P in ${best.stats.gp} GP with ${best.team} (${best.year})`);
  }
  out.seasons=seasons;
  return out;
}

/* ===== EP BULK auto-bio ===== */
let EPBULK_PARSED=[];
function openEPBulk(side){if(side==='away'&&!val('oppRosterTeam')){toast("Select an opponent team first");return;}setv('epbulk_side',side);setv('epbulk_text','');document.getElementById('epBulkPreviewWrap').innerHTML='';openModal('epBulkModal');}
function epBulkPreview(){
  const raw=document.getElementById('epbulk_text').value;if(!raw.trim()){toast("Paste EP profiles first");return;}
  const chunks=raw.split(/^\s*===\s*$/m).map(c=>c.trim()).filter(Boolean);
  EPBULK_PARSED=chunks.map(c=>parseEPCareer(c)).filter(p=>p.facts.name);
  const wrap=document.getElementById('epBulkPreviewWrap');
  if(!EPBULK_PARSED.length){wrap.innerHTML='<div class="note">Couldn\'t parse any profiles. Make sure each includes the name line ending in "Facts".</div>';return;}
  const side=val('epbulk_side');const list=getRoster(side);
  let html='<div class="section-label hub-sectionhead">Preview — '+EPBULK_PARSED.length+' profiles</div>';
  EPBULK_PARSED.forEach(p=>{
    const match=list.find(x=>norm(x.name)===norm(p.facts.name));
    const status=match?(match.notes&&match.notes.trim()?'<span class="pill warn">has bio — will skip</span>':'<span class="pill ok">will fill bio</span>'):'<span class="pill grey">no roster match</span>';
    html+='<div class="ref-box"><h4>'+esc(p.facts.name)+' '+status+'</h4>'+(p.bullets.length?'<div style="font-size:12px">'+p.bullets.map(b=>'• '+esc(b)).join('<br>')+'</div>':'<div style="color:var(--ink-2);font-size:12px">No career bullets derived</div>')+'</div>';
  });
  html+='<div class="btn-row"><button class="btn" onclick="epBulkCommit()">Apply bios to matching players</button></div>';
  wrap.innerHTML=html;
}
function epBulkCommit(){
  const side=val('epbulk_side');const list=getRoster(side);let applied=0;
  EPBULK_PARSED.forEach(p=>{
    const m=list.find(x=>norm(x.name)===norm(p.facts.name));
    if(m&&!(m.notes&&m.notes.trim())&&p.bullets.length){m.notes=p.bullets.join('\n');applied++;}
  });
  save();closeModal('epBulkModal');side==='home'?renderRoster():renderOppRoster();toast(applied+" bios applied");
}


/* ============================================================
   EXTENDED REPORT PARSING — situational splits, goals-by-period,
   shots-by-period, GF/GA per game. Call after base parseReport.
   ============================================================ */
function parseExtended(raw,r){
  r.ext=r.ext||{};
  const findTeamRow=(blockRe,teamRe)=>{
    const b=raw.match(blockRe);if(!b)return null;
    for(const line of b[0].split(/\r?\n/)){if(teamRe.test(line))return line;}
    return null;
  };
  // Goals By Period: "Huntsville  GF GA | GF GA | GF GA | OT | TOTAL"
  const gpBlock=raw.match(/Team Scoring By Period[\s\S]*?(?=\nTeam Shots By Period|\n\s*\n[A-Z])/i);
  if(gpBlock){
    const m=gpBlock[0].split(/\r?\n/).find(l=>/Huntsville/i.test(l));
    if(m){const n=m.match(/Huntsville\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/);
      if(n)r.ext.goalsByPeriod={p1:[+n[1],+n[2]],p2:[+n[3],+n[4]],p3:[+n[5],+n[6]],ot:[+n[7],+n[8]],tot:[+n[9],+n[10]]};}
  }
  // GF/GA per game ranks
  const gfBlock=raw.match(/Goals For And Goals Against Per Game[\s\S]*?(?=\nShots For|\n\s*\n[A-Z])/i);
  if(gfBlock){
    const gf=gfBlock[0].split(/\r?\n/).find(l=>/\d+\s+Huntsville\s+\d+\s+\d+\s+[\d.]+/.test(l));
    if(gf){const n=gf.match(/(\d+)\s+Huntsville\s+\d+\s+\d+\s+([\d.]+)/);if(n)r.ext.gfRank={rank:+n[1],val:n[2]};}
  }
  // Record when scoring first
  const fgBlock=raw.match(/Record When Scoring First[\s\S]*?(?=\n\s*\n|\nTeam Records)/i);
  if(fgBlock){const m=fgBlock[0].split(/\r?\n/).find(l=>/^Huntsville/i.test(l.trim()));
    if(m){const c=m.trim().split(/\s+/);/* Team GP FG W L OTL SOL PTS PCT */if(c.length>=8)r.ext.scoreFirst={w:+c[3],l:+c[4],otl:+c[5]};}}
  // Home/Away splits
  const haBlock=raw.match(/Home and Away[\s\S]*?(?=\nTeam Overtime|\n\s*\n[A-Z])/i);
  if(haBlock){const m=haBlock[0].split(/\r?\n/).find(l=>/^Huntsville/i.test(l.trim()));
    if(m){const c=m.trim().replace(/0-0/g,'').split(/\s+/).filter(x=>/^-?\d+$/.test(x));
      /* after filtering: [teamGP, homeGP,W,L,OTL,SOL,PTS,GF,GA, awayGP,W,L,OTL,SOL,PTS,GF,GA] */
      if(c.length>=17)r.ext.homeAway={home:`${c[2]}-${c[3]}-${c[4]}`,away:`${c[10]}-${c[11]}-${c[12]}`};
      else if(c.length>=9)r.ext.homeAway={home:`${c[2]}-${c[3]}-${c[4]}`,away:'—'};}}
  // Special teams detail (PPG/PPO + PCT, PK)
  const ppFull=raw.match(/Overall Power Play Record[\s\S]*?Huntsville?[^\n]*HSV?[^\n]*/i);
  return r;
}

/* ============ GAME LOG EDITOR (Schedule tab) ============ */
function renderGameLog(){
  const wrap=document.getElementById('glTableWrap');if(!wrap)return;
  const gs=glGames();
  if(!gs.length){wrap.innerHTML=emptyState('No completed games yet','Final scores fill in from the schedule feed as they are played; shots, power plays and fights are yours to add.');return;}
  wrap.innerHTML=`<table class="gl-edit"><tr><th>Date</th><th>Opponent</th><th>Result</th><th>SF</th><th>SA</th><th>PPG</th><th>PP adv</th><th>Att.</th><th>Fights</th></tr>
    ${gs.map(g=>`<tr><td>${fmtDateShort(g.d)}</td><td>${g.ha==='@'?'@ ':''}${esc(g.opp)}</td><td>${g.wl} ${g.us}-${g.them}${g.otso?' ('+g.otso+')':''}</td>
      ${['sf','sa','ppg','ppa','att','fights'].map(f=>`<td><input type="number" value="${g[f]!=null?g[f]:''}" onchange="glSet('${g.d}','${f}',this.value)"></td>`).join('')}</tr>`).join('')}
  </table>`;
}
function glSet(d,f,v){
  DATA.gamelog=DATA.gamelog||{};
  const e=DATA.gamelog[d]=DATA.gamelog[d]||{};
  if(v==='')delete e[f];else e[f]=+v;
  save();
}

/* ============================================================
   ROSTER STAT SYNC — pull current stats from report into roster
   ============================================================ */
function syncRosterStats(){
  const hsv=findTeamStats('Huntsville');
  applyStatsTo(DATA.roster,hsv);
  // opponent rosters too
  Object.keys(DATA.oppRosters||{}).forEach(team=>{
    const ts=findTeamStats(teamCity(team));
    applyStatsTo(DATA.oppRosters[team],ts);
  });
}
function applyStatsTo(list,teamStats){
  if(!teamStats||!list)return;
  // the SPHL player_id is the join key; number and name are the fallbacks
  const byId=(rows,p)=>p.htId&&rows.find(x=>x.htId&&String(x.htId)===String(p.htId));
  list.forEach(p=>{
    if(p.pos==='G'){
      const g=byId(teamStats.goalies,p)||teamStats.goalies.find(x=>x.num===p.num||norm(x.name)===norm(p.name))||rosterMatch(p.name,teamStats.goalies);
      if(g)p.stat={gp:g.gp,w:g.w,l:g.l,otl:g.otl,so:g.so,ga:g.ga,gaa:g.gaa,sa:g.sa,svs:g.svs,svpct:g.svpct};
    }else{
      const s=byId(teamStats.players,p)||teamStats.players.find(x=>x.num===p.num||norm(x.name)===norm(p.name))||rosterMatch(p.name,teamStats.players);
      if(s)p.stat={gp:s.gp,g:s.g,a:s.a,pts:s.pts,pm:s.pm,pim:s.pim,pp:s.pp,shg:s.shg,gw:s.gw,shots:s.shots,shpct:s.shpct};
    }
  });
}

/* ============================================================
   CLEANER AUTO-BIO — concise, readable, computed from report
   ============================================================ */
function cleanAutoBio(player, teamStats, allReport){
  const out=[];
  if(!teamStats)return out;
  if(player.pos==='G'){
    const g=teamStats.goalies.find(x=>x.num===player.num||norm(x.name)===norm(player.name));
    if(!g)return out;
    out.push(`${g.w}-${g.l}-${g.otl}, ${g.gaa} GAA, ${g.svpct} SV%${g.so?`, ${g.so} SO`:''} in ${g.gp} GP this season`);
    const allG=[];Object.values(allReport.teamStats||{}).forEach(t=>t.goalies.forEach(x=>{if(x.gp>=2)allG.push(x);}));
    allG.sort((a,b)=>parseFloat(b.svpct)-parseFloat(a.svpct));
    const rk=allG.findIndex(x=>norm(x.name)===norm(g.name));
    if(rk>=0&&rk<5)out.push(`${ordinal(rk+1)} in the SPHL in save percentage`);
    return out;
  }
  const st=teamStats.players.find(x=>x.num===player.num||norm(x.name)===norm(player.name));
  if(!st)return out;
  out.push(`${st.g}G-${st.a}A-${st.pts}P with ${st.pm>=0?'+':''}${st.pm} rating in ${st.gp} GP`);
  const ptsRank=[...teamStats.players].sort((a,b)=>b.pts-a.pts).findIndex(x=>norm(x.name)===norm(st.name));
  const gRank=[...teamStats.players].sort((a,b)=>b.g-a.g).findIndex(x=>norm(x.name)===norm(st.name));
  if(ptsRank===0)out.push(`Leads the Havoc in scoring`);
  else if(ptsRank===1)out.push(`2nd on the Havoc in scoring`);
  if(gRank===0&&st.g>0&&ptsRank!==0)out.push(`Team leader in goals (${st.g})`);
  if(st.pp>0)out.push(`${st.pp} power-play goal${st.pp>1?'s':''}`);
  if(st.gw>0)out.push(`${st.gw} game-winner${st.gw>1?'s':''}`);
  const allP=[];Object.values(allReport.teamStats||{}).forEach(t=>t.players.forEach(x=>allP.push(x)));
  allP.sort((a,b)=>b.pts-a.pts);
  const lrk=allP.findIndex(x=>norm(x.name)===norm(st.name));
  if(lrk>=0&&lrk<10&&st.pts>0)out.push(`Top-10 in the SPHL in points (${ordinal(lrk+1)})`);
  return out;
}

/* ============================================================
   SEGMENTED PARSING — parse one category from its own box
   ============================================================ */
function parseSegment(kind){
  const id={players:'seg_players',standings:'seg_standings',pp:'seg_pp',pk:'seg_pk',leaders:'seg_leaders',results:'seg_results',ext:'seg_ext'}[kind];
  const raw=document.getElementById(id).value;
  if(!raw.trim()){toast("Paste something into that box first");return;}
  DATA.report=DATA.report||structuredClone(DEFAULT_DATA.report);
  const r=DATA.report;r.parsedAt=new Date().toISOString();
  let msg='';
  try{
    if(kind==='standings'){r.standings=[];parseStandingsInto(raw,r);msg=`${r.standings.length} teams`;}
    else if(kind==='players'){parseTeamStats(raw,r);msg=`${Object.keys(r.teamStats||{}).length} team stat blocks`;}
    else if(kind==='pp'||kind==='pk'){r.special=r.special||{};parseSpecial(raw,r);msg='special teams updated';}
    else if(kind==='leaders'){r.leaders=parseLeaders(raw);msg='leaders updated';}
    else if(kind==='results'){parseResultsAndH2H(raw,r);msg=`${Object.keys(r.recent||{}).length} teams w/ results`;}
    else if(kind==='ext'){parseExtended(raw,r);msg='situational updated';}
    syncRosterStats();save();
    const box=document.getElementById('segSummary');box.style.display='block';box.textContent='Parsed: '+msg+'. Roster stats re-synced.';
    toast('Segment parsed');
  }catch(err){toast('Parse error — check the format');console.error(err);}
}
/* helper used by both full + segment standings parse */
function parseStandingsInto(raw,r){
  const lines=raw.split(/\r?\n/);let inStand=true;
  for(const L of lines){
    const full=L.match(/^\s*\d+\.\s+([A-Za-z .]+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+([\d.]+)\s+(\d+)\s+(\d+)\s+(\d+)\s+([\d-]+)\s+([\d-]+)\s+([\d-]+)\s+([\d-]+)/);
    if(full){const name=full[1].trim();if(!r.standings.find(s=>s.team===name))r.standings.push({team:name,gp:+full[2],w:+full[4],l:+full[5],otl:+full[6],pts:+full[7],gf:+full[9],ga:+full[10],pim:+full[11],home:full[12],road:full[13],last10:full[14],streak:full[15]});continue;}
    const m=L.match(/^\s*\d+\.\s+([A-Za-z .]+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/);
    if(m){const name=m[1].trim();if(!r.standings.find(s=>s.team===name))r.standings.push({team:name,gp:+m[2],w:+m[4],l:+m[5],otl:+m[6],pts:+m[7]});}
  }
}

/* ============================================================
   SCHEDULE TAB
   ============================================================ */
function loadSchedule(){
  const raw=(DATA.notes&&DATA.notes.schedule)||'';
  setv('sched_text',raw);
  renderSchedPreview();
}
function saveSchedule(){
  DATA.notes=DATA.notes||{};
  DATA.notes.schedule=document.getElementById('sched_text').value;
  save();renderSchedPreview();
  const m=document.getElementById('schedMsg');m.textContent='Saved.';setTimeout(()=>m.textContent='',1500);
  toast('Schedule saved');
}
/* Season calendar: home=red, away=gray */
function renderCalendar(){
  const el=document.getElementById('schedCalendar');if(!el)return;
  const games=parseScheduleData();
  if(!games.length){el.innerHTML='<span style="color:var(--ink-2);font-size:13px">Save a schedule to see the calendar.</span>';return;}
  // map games by ISO date; detect home/away from the opp string ("vs X" home, "@ X" away)
  const byDate={};
  games.forEach(g=>{
    byDate[g.dateISO]={home:g.hv==='vs',opp:g.team,time:g.time||'',result:g.result||'',ps:g.ps,note:g.note||''};
  });
  // months span: from first to last game
  const sorted=games.map(g=>g.dateISO).sort();
  const first=new Date(sorted[0]+'T00:00'),last=new Date(sorted[sorted.length-1]+'T00:00');
  const months=[];
  let cur=new Date(first.getFullYear(),first.getMonth(),1);
  while(cur<=last){months.push(new Date(cur));cur=new Date(cur.getFullYear(),cur.getMonth()+1,1);}
  const dows=['S','M','T','W','T','F','S'];
  const mnames=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const html=months.map(m=>{
    const y=m.getFullYear(),mo=m.getMonth();
    const firstDow=new Date(y,mo,1).getDay();
    const daysIn=new Date(y,mo+1,0).getDate();
    let cells=dows.map(d=>`<div class="cal-dow">${d}</div>`).join('');
    for(let i=0;i<firstDow;i++)cells+='<div class="cal-day empty"></div>';
    for(let d=1;d<=daysIn;d++){
      const iso=`${y}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const g=byDate[iso];const pr=promoFor(iso);
      const tip=[pr,g&&g.ps?'Preseason':'',g&&g.note?g.note:''].filter(Boolean).join(' · ');
      cells+=`<div class="cal-day"><span class="dn">${d}</span>${g?`<div class="cal-game ${g.home?'home':'away'}" ${tip?`title="${esc(tip)}"`:''} style="cursor:pointer" onclick="setGameResult('${iso}')">${g.ps?'PS ':''}${g.home?'vs':'@'} ${esc(shortTeam(g.opp))}${pr?`<span class="promo">${esc(pr)}</span>`:''}<span class="res">${esc(g.result||g.time||'')}</span></div>`:''}</div>`;
    }
    // pad trailing cells to complete the row
    const total=firstDow+daysIn, pad=(7-(total%7))%7;
    for(let i=0;i<pad;i++)cells+='<div class="cal-day empty"></div>';
    return `<div class="cal-month"><div class="cal-mtitle">${mnames[mo]} ${y}</div><div class="cal-grid">${cells}</div></div>`;
  }).join('');
  el.innerHTML=`<div class="cal-months">${html}</div>`;
}
function shortTeam(name){
  const k=name.trim().split(' ')[0];
  if(name.trim().toLowerCase().startsWith('quad'))return 'QC';
  if(name.trim().toLowerCase().startsWith('pee'))return 'Pee Dee';
  return TEAM_ABBR[k]||k;
}
function renderSchedPreview(){
  renderCalendar();
  const s=parseScheduleData();
  const box=document.getElementById('schedPreview');
  if(!s.length){box.innerHTML='<span style="color:var(--ink-2)">No games parsed yet. One per line: M/D/YY  vs|@ Opponent  Result</span>';return;}
  let w=0,l=0,psw=0,psl=0;
  s.forEach(g=>{
    const W=/^w/i.test(g.result),L=/^(l|otl|sol)/i.test(g.result);
    if(g.ps){if(W)psw++;else if(L)psl++;}
    else{if(W)w++;else if(L)l++;}
  });
  const psTxt=(psw||psl)?` · preseason ${psw}-${psl}`:'';
  box.innerHTML=`<div style="margin-bottom:6px;font-weight:700">${s.length} games · ${w}-${l} from entered results${psTxt}</div>`+
    `<div style="font-size:11px;color:var(--ink-2);margin-bottom:6px">Tap a result cell (or the ＋) to enter a final score any time.</div>`+
    `<table class="qf-sched" style="font-size:12px">${s.map(g=>`<tr${g.ps?' style="background:var(--tint-neutral)"':''}><td style="width:64px">${g.date}${g.ps?' <b style="color:var(--amber);font-size:9px">PS</b>':''}</td><td style="width:30px">${g.hv}</td><td>${esc(g.team)}${g.note?` <span style="color:var(--ink-2);font-size:10px">${esc(g.note)}</span>`:''}</td><td style="color:var(--red-text);font-weight:700">${esc(promoFor(g.dateISO))}</td><td style="width:70px;color:var(--ink-2)">${esc(g.time||'')}</td><td style="text-align:right;font-weight:700;cursor:pointer" onclick="setGameResult('${g.dateISO}')" title="Enter final score">${esc(g.result)||'<span style="color:var(--ink-2)">＋</span>'}</td></tr>`).join('')}</table>`;
}

const SCHEDULE_2026="PS 10/9/26  vs Pensacola  Audio only — Radio & YouTube Live\n10/16/26  @ Pee Dee  7:15 PM\n10/17/26  @ Pee Dee  7:15 PM\n10/23/26  vs Pensacola  7:00 PM\n10/24/26  @ Pensacola  7:05 PM\n10/30/26  @ Pensacola  7:05 PM\n10/31/26  vs Macon  7:00 PM\n11/6/26  vs Macon  7:00 PM\n11/7/26  @ Fayetteville  6:00 PM\n11/8/26  @ Knoxville  3:00 PM\n11/13/26  @ Knoxville  7:30 PM\n11/14/26  vs Knoxville  7:00 PM\n11/20/26  vs Fayetteville  7:00 PM\n11/21/26  vs Fayetteville  7:00 PM\n11/25/26  @ Pensacola  7:05 PM\n11/26/26  vs Athens  7:00 PM\n11/27/26  vs Pensacola  7:00 PM\n12/4/26  vs Evansville  7:00 PM\n12/5/26  @ Evansville  7:05 PM\n12/11/26  vs Quad City  7:00 PM\n12/12/26  vs Quad City  7:00 PM\n12/18/26  @ Roanoke  7:05 PM\n12/19/26  @ Roanoke  7:05 PM\n12/20/26  vs Birmingham  5:00 PM\n12/26/26  @ Birmingham  7:00 PM\n12/27/26  @ Birmingham  2:00 PM\n12/29/26  vs Macon  7:00 PM\n12/31/26  @ Macon  6:00 PM\n1/2/27  @ Macon  6:00 PM\n1/8/27  vs Evansville  7:00 PM\n1/9/27  vs Evansville  7:00 PM\n1/15/27  vs Athens  7:00 PM\n1/16/27  vs Athens  7:00 PM\n1/18/27  @ Birmingham  1:00 PM\n1/22/27  vs Pensacola  7:00 PM\n1/23/27  vs Pee Dee  7:00 PM\n1/29/27  @ Evansville  7:05 PM\n1/30/27  @ Evansville  7:05 PM\n2/5/27  vs Knoxville  7:00 PM\n2/6/27  vs Knoxville  7:00 PM\n2/7/27  @ Pensacola  4:05 PM\n2/12/27  vs Quad City  7:00 PM\n2/13/27  vs Quad City  7:00 PM\n2/15/27  @ Birmingham  1:00 PM\n2/19/27  @ Peoria  7:15 PM\n2/20/27  @ Peoria  7:15 PM\n2/21/27  vs Birmingham  5:00 PM\n2/26/27  @ Quad City  7:10 PM\n2/27/27  @ Quad City  7:10 PM\n3/5/27  vs Athens  7:00 PM\n3/6/27  vs Athens  7:00 PM\n3/7/27  @ Evansville  5:00 PM\n3/12/27  @ Fayetteville  7:00 PM\n3/13/27  @ Fayetteville  6:00 PM\n3/19/27  vs Peoria  7:00 PM\n3/20/27  vs Peoria  7:00 PM\n3/25/27  vs Evansville  7:00 PM\n3/26/27  @ Athens  7:05 PM\n3/27/27  @ Athens  7:05 PM\n4/2/27  @ Knoxville  6:00 PM\n4/3/27  vs Knoxville  5:00 PM";
function seedScheduleIfEmpty(){DATA.notes=DATA.notes||{};const cur=DATA.notes.schedule||"";const hasResults=/\s(W|L|OTL|SOL)[\s,]/i.test(cur);if(!cur.trim()||(!hasResults&&cur!==SCHEDULE_2026)){DATA.notes.schedule=SCHEDULE_2026;save();}}

function setTouchIcon(){try{const l=teamLogoSrc("Huntsville Havoc");if(!l)return;const link=document.createElement('link');link.rel='apple-touch-icon';link.href=l;document.head.appendChild(link);}catch(e){}}
/* 2026-27 promo nights (all 30 home games) */
const PROMOS_2026={
"2026-10-23":"Opening Night","2026-10-31":"Hall-O-Wiener Dog Races",
"2026-11-06":"Veterans Game","2026-11-14":"Nightmare on Monroe St","2026-11-20":"An Evening of Violent Gentlemen",
"2026-11-21":"Adult Jersey Night","2026-11-26":"Thanksgiving Game","2026-11-27":"Black Friday",
"2026-12-04":"Shrek Night","2026-12-11":"Space Night","2026-12-12":"Kiss Night",
"2026-12-20":"Peanuts Holiday Game","2026-12-29":"Medieval Night",
"2027-01-08":"Golf Night","2027-01-09":"Barbie Night","2027-01-15":"Beanie Giveaway",
"2027-01-16":"Melissa George Night","2027-01-22":"Small Dog Races","2027-01-23":"Channel Cats Night",
"2027-02-05":"Chaos' Birthday","2027-02-06":"Glow Night","2027-02-12":"Great Outdoors Night",
"2027-02-13":"Wrestling Night","2027-02-21":"Star Wars Night",
"2027-03-05":"Hat Giveaway","2027-03-06":"Cars Night","2027-03-19":"Trash Pandas Night",
"2027-03-20":"Youth Jersey Giveaway","2027-03-25":"Military Night","2027-04-03":"Team Poster Giveaway"};
function promoFor(iso){return PROMOS_2026[iso]||'';}


/* 2026-27 SPHL schedule matrix: MATRIX[awayTeam][homeTeam] = games. 0 = never meet there. */
const MATRIX_ORDER=["ATH","BHM","EVV","FAY","HSV","KNX","MAC","PD","PEN","PEO","QC","RNK"];
const SCHED_MATRIX={
ATH:{BHM:1,EVV:0,FAY:3,HSV:5,KNX:2,MAC:5,PD:4,PEN:5,PEO:0,QC:2,RNK:3},
BHM:{ATH:4,EVV:1,FAY:4,HSV:2,KNX:4,MAC:1,PD:1,PEN:5,PEO:3,QC:3,RNK:2},
EVV:{ATH:1,BHM:3,FAY:0,HSV:4,KNX:4,MAC:0,PD:3,PEN:2,PEO:5,QC:6,RNK:2},
FAY:{ATH:2,BHM:2,EVV:2,HSV:2,KNX:4,MAC:4,PD:6,PEN:3,PEO:0,QC:0,RNK:5},
HSV:{ATH:2,BHM:4,EVV:4,FAY:3,KNX:3,MAC:2,PD:2,PEN:4,PEO:2,QC:2,RNK:2},
KNX:{ATH:3,BHM:3,EVV:2,FAY:2,HSV:4,MAC:1,PD:2,PEN:3,PEO:3,QC:2,RNK:5},
MAC:{ATH:5,BHM:4,EVV:2,FAY:3,HSV:3,KNX:3,PD:4,PEN:4,PEO:0,QC:2,RNK:0},
PD:{ATH:2,BHM:3,EVV:2,FAY:4,HSV:1,KNX:1,MAC:4,PEN:2,PEO:5,QC:3,RNK:3},
PEN:{ATH:2,BHM:6,EVV:3,FAY:3,HSV:3,KNX:3,MAC:5,PD:0,PEO:3,QC:0,RNK:2},
PEO:{ATH:3,BHM:0,EVV:6,FAY:0,HSV:2,KNX:1,MAC:3,PD:3,PEN:0,QC:8,RNK:4},
QC:{ATH:3,BHM:2,EVV:6,FAY:3,HSV:4,KNX:1,MAC:3,PD:0,PEN:0,PEO:6,RNK:2},
RNK:{ATH:3,BHM:2,EVV:2,FAY:5,HSV:0,KNX:4,MAC:2,PD:5,PEN:2,PEO:3,QC:2}};
function renderMatrix(){
  const el=document.getElementById('ref_matrix');if(!el)return;
  let h='<table class="mx"><tr><th></th>'+MATRIX_ORDER.map(c=>`<th class="${c==='HSV'?'hl':''}">${c}</th>`).join('')+'<th>Tot</th></tr>';
  MATRIX_ORDER.forEach(rw=>{
    let tot=0;
    h+=`<tr class="${rw==='HSV'?'hl':''}"><th>${rw}</th>`;
    MATRIX_ORDER.forEach(cl=>{
      if(rw===cl){h+='<td class="dg">—</td>';return;}
      const v=(SCHED_MATRIX[rw]&&SCHED_MATRIX[rw][cl])||0;tot+=v;
      h+=`<td class="${cl==='HSV'?'hl':''}">${v||''}</td>`;
    });
    h+=`<td class="tot">${tot}</td></tr>`;
  });
  h+='</table>';
  el.innerHTML=h;
}
function renderSeries(){
  const el=document.getElementById('ref_series');if(!el)return;
  const nameOf={ATH:"Athens",BHM:"Birmingham",EVV:"Evansville",FAY:"Fayetteville",KNX:"Knoxville",MAC:"Macon",PD:"Pee Dee",PEN:"Pensacola",PEO:"Peoria",QC:"Quad City",RNK:"Roanoke"};
  let rows='';
  MATRIX_ORDER.filter(t=>t!=='HSV').forEach(t=>{
    const home=(SCHED_MATRIX[t]&&SCHED_MATRIX[t]['HSV'])||0;   // they visit us
    const away=(SCHED_MATRIX['HSV']&&SCHED_MATRIX['HSV'][t])||0; // we visit them
    rows+=`<tr><td>${nameOf[t]}</td><td class="r">${home+away}</td><td class="r">${home}</td><td class="r">${away}</td></tr>`;
  });
  el.innerHTML=`<table class="mx series"><tr><th>Opponent</th><th class="r">Meetings</th><th class="r">Home</th><th class="r">Away</th></tr>${rows}</table>`;
}

/* ============================================================
   GAME LINES — forward lines, D pairs, goalies for both teams
   ============================================================ */
/* "12 Smith" / "Smith" → roster row, or null — the one resolver for every
   view that reads the free-text lines (line card, Game Day lineup) */
function lineResolve(v,list){
  const t=String(v||'').trim();if(!t)return null;
  const mnum=t.match(/^(\d+)/);
  let p=mnum?list.find(x=>String(x.num)===mnum[1]&&x.name):null;
  if(!p)p=list.find(x=>x.name&&t.toLowerCase().indexOf(x.name.toLowerCase())>=0);
  return p||null;
}
function linesDefault(){return {f:[["","",""],["","",""],["","",""],["","",""]],d:[["",""],["",""],["",""],["",""]],g:["",""]};}
function ensureLines(){
  DATA.lines=DATA.lines||{};
  if(!DATA.lines.home)DATA.lines.home=linesDefault();
  if(!DATA.lines.opp)DATA.lines.opp=linesDefault();
  return DATA.lines;
}
function linesInit(){
  ensureLines();
  // opponent title
  const t=document.getElementById('linesOppTitle');
  t.textContent=DATA.game.opp||'Opponent (set on This Game tab)';
  // datalists from rosters
  const dlH=document.getElementById('dl_lines_home'),dlO=document.getElementById('dl_lines_opp');
  dlH.innerHTML=DATA.roster.filter(p=>p.name).map(p=>`<option value="${p.num?p.num+' ':''}${esc(p.name)}">`).join('');
  const oppList=(DATA.game.opp&&DATA.oppRosters[DATA.game.opp])||[];
  dlO.innerHTML=oppList.filter(p=>p.name).map(p=>`<option value="${p.num?p.num+' ':''}${esc(p.name)}">`).join('');
  buildLinesForm('home','linesFormHome','dl_lines_home');
  buildLinesForm('opp','linesFormOpp','dl_lines_opp');
  renderLinesDoc();
}
function buildLinesForm(side,containerId,dlId){
  const L=ensureLines()[side];
  const inp=(sec,i,j,ph)=>`<input type="text" list="${dlId}" class="ln-inp" data-side="${side}" data-sec="${sec}" data-i="${i}" data-j="${j}" value="${esc((sec==='g'?L.g[i]:L[sec][i][j])||'')}" placeholder="${ph}">`;
  let h='<div class="ln-sec">Forward lines <span>LW · C · RW</span></div>';
  for(let i=0;i<4;i++)h+=`<div class="ln-row f"><span class="ln-num">${i+1}</span>${inp('f',i,0,'LW')}${inp('f',i,1,'C')}${inp('f',i,2,'RW')}</div>`;
  h+='<div class="ln-sec">Defense pairs <span>LD · RD</span></div>';
  for(let i=0;i<4;i++)h+=`<div class="ln-row d"><span class="ln-num">${i+1}</span>${inp('d',i,0,'LD')}${inp('d',i,1,'RD')}</div>`;
  h+='<div class="ln-sec">Goaltenders <span>starter · backup</span></div>';
  h+=`<div class="ln-row d"><span class="ln-num">G</span>${inp('g',0,0,'Starter')}${inp('g',1,0,'Backup')}</div>`;
  const box=document.getElementById(containerId);
  box.innerHTML=h;
  if(!box._wired){
    box._wired=true;
    box.addEventListener('input',e=>{
      const el=e.target;if(!el.classList.contains('ln-inp'))return;
      const L=ensureLines()[el.dataset.side];
      const sec=el.dataset.sec,i=+el.dataset.i,j=+el.dataset.j;
      if(sec==='g')L.g[i]=el.value;else L[sec][i][j]=el.value;
      save();
      // live preview: the line card and the lineup chart both reflect edits immediately
      clearTimeout(box._lt);
      box._lt=setTimeout(()=>{renderLinesDoc();renderChart();},400);
    });
  }
}
function clearLines(){
  if(!confirm('Clear all lines for both teams?'))return;
  DATA.lines={home:linesDefault(),opp:linesDefault()};save();linesInit();toast('Lines cleared');
}
/* printable line card */
function renderLinesDoc(){
  const S=DATA.settings,G=DATA.game;ensureLines();
  const dateStr=G.date?new Date(G.date+'T00:00').toLocaleDateString('en-US',{month:'numeric',day:'numeric',year:'2-digit'}):'';
  const teamBlock=(side,teamFull,title,theme)=>{
    const L=DATA.lines[side];const primary=theme.primary,secondary=theme.secondary||'#111';
    const logo=teamLogoSrc(teamFull);
    const list=side==='home'?DATA.roster:((G.opp&&DATA.oppRosters[G.opp])||[]);
    const kw=side==='home'?'Huntsville':teamCity(G.opp)||'zzz-none';
    const resolve=v=>lineResolve(v,list);
    const cell=v=>{const p=resolve(v);return `<td>${esc(v||'')}${p?' '+statSpan(p,kw):''}</td>`;};
    const fRows=L.f.map((ln,i)=>`<tr><th>${i+1}</th>${cell(ln[0])}${cell(ln[1])}${cell(ln[2])}</tr>`).join('');
    const dRows=L.d.map((pr,i)=>`<tr><th>${i+1}</th>${cell(pr[0])}${cell(pr[1])}<td class="void"></td></tr>`).join('');
    const gRows=`<tr><th>G1</th>${cell(L.g[0])}<td class="void"></td><td class="void"></td></tr><tr><th>G2</th>${cell(L.g[1])}<td class="void"></td><td class="void"></td></tr>`;
    return `<div class="lnc-team">
      <div class="lnc-head" style="background:${primary}">${logo?`<span class="lnc-logo"><img src="${logo}"></span>`:''}<span>${esc(title)}</span></div>
      <table class="lnc-tbl" style="--acc:${primary}">
        <tr class="lnc-sub"><td colspan="4">FORWARDS <span>LW · C · RW</span></td></tr>${fRows}
        <tr class="lnc-sub"><td colspan="4">DEFENSE <span>LD · RD</span></td></tr>${dRows}
        <tr class="lnc-sub"><td colspan="4">GOALTENDERS</td></tr>${gRows}
      </table></div>`;
  };
  const oppName=G.opp||'Opponent';
  const doc=`<div class="page" data-sec="lines" style="width:816px">
    <div class="lnc-top"><span>LINE CARD${G.ps?' — '+esc(sheetSeason())+' PRESEASON':''}</span><span>${esc(S.city)} ${esc(S.name)} ${G.homeaway==='@'?'@':'vs.'} ${esc(oppName)}</span><span>${dateStr}</span></div>
    <div class="lnc-grid">
      ${teamBlock('home','Huntsville Havoc',(S.city+' '+S.name).trim(),teamTheme('Huntsville Havoc'))}
      ${teamBlock('opp',oppName,oppName,teamTheme(oppName))}
    </div>
    ${dataStampHTML('lines')}
    <div class="gs-foot" style="border-color:${S.red||'#C8102E'};margin-top:10px"><span>${esc(S.social)}</span><span>${esc(S.footer)}</span></div>
  </div>`;
  document.getElementById('linesDoc').innerHTML=doc;
  secApplyAll();
}


/* league standings display w/ logos + abbreviations */
function renderStandings(){
  const el=document.getElementById('standingsTable');if(!el)return;
  const fellEl=document.getElementById('standingsSeason');
  if(fellEl){
    const used=((DATA.report||{}).seasonUsed||{}).standings||activeSeasonId();
    const fell=!!(((DATA.report||{}).seasonFallback||{}).standings);
    fellEl.innerHTML=fell?'<div class="season-fell">'+esc(fallbackNote(used))+'</div>'
      :'<div class="season-of">'+esc(seasonLabelOf(used))+'</div>';
  }
  const S=DATA.report.standings||[];
  const cityOf=t=>teamCity(t);
  let rows;
  if(S.length){
    rows=S.map(s=>{
      const city=cityOf(s.team);const full=TEAMS.find(x=>x.indexOf(city)===0)||s.team;
      return {abbr:TEAM_ABBR[city]||city,full,gp:s.gp,w:s.w,l:s.l,otl:s.otl,sol:s.sol!=null?s.sol:'-',pts:s.pts};
    });
  }else{
    rows=TEAMS.map(full=>{const city=cityOf(full);return {abbr:TEAM_ABBR[city]||'',full,gp:0,w:0,l:0,otl:0,sol:0,pts:0};});
  }
  const note=S.length?'':`<div class="empty-cell" style="text-align:left;font-size:12px">${preseasonNote()} These are placeholder zeros for all 12 clubs — nothing has been published for 2026-27 yet.</div>`;
  el.innerHTML=note+`<table class="stnd"><tr><th></th><th class="tm">SPHL</th><th>GP</th><th>W</th><th>L</th><th>OTL</th><th>SOL</th><th class="pts">PTS</th></tr>`+
    rows.map(r=>{const lg=teamLogoSrc(r.full);const me=/Huntsville/.test(r.full);
      return `<tr class="${me?'me':''}${S.length?'':' zeroed'}"><td class="lg">${lg?`<img src="${lg}">`:''}</td><td class="tm">${r.abbr}</td><td>${r.gp}</td><td>${r.w}</td><td>${r.l}</td><td>${r.otl}</td><td>${r.sol}</td><td class="pts">${r.pts}</td></tr>`;}).join('')+`</table>`;
}


function mtpCardHTML(p,teamStats,R,red,S){
  return [p].map(p=>{
    const isG=p.pos==='G';
    let stripe='';
    if(isG){const g=teamStats?teamStats.goalies.find(x=>x.num===p.num||norm(x.name)===norm(p.name)):null;
      if(g)stripe=`<div class="mtp-stats"><span>SV%: ${g.svpct}</span><span>GAA: ${g.gaa}</span><span>${g.w}-${g.l}-${g.otl}</span><span>SO: ${g.so}</span></div>`;}
    else{const st=teamStats?teamStats.players.find(x=>x.num===p.num||norm(x.name)===norm(p.name)):null;
      if(st)stripe=`<div class="mtp-stats"><span>G: ${st.g}</span><span>A: ${st.a}</span><span>P: ${st.pts}</span><span>+/-: ${st.pm>=0?'+':''}${st.pm}</span><span>PIM: ${st.pim}</span></div>`;}
    const auto=mediaBio(p,teamStats,R,true);
    // authored prose from data/bios.json first (joined line, season recap,
    // career highlights — the bio page's structure); hand-typed notes fall back
    const B=biosFor(p)||{};
    const para=t=>bioLine(t)?`<div class="mtp-para">${esc(bioLine(t))}</div>`:'';
    const authored=para(B.joined_blurb)+para(B.season_recap)+para(B.career_highlights);
    const notesHtml=authored||(p.notes||'').split('\n').map(x=>x.trim()).filter(Boolean).map(esc).join('<br>');
    const bioFns=[].concat(B.footnotes||[]).map(bioLine).filter(Boolean);
    const bioFoot=bioFns.length?`<div class="mtp-foot">${bioFns.map(esc).join(' · ')}</div>`:'';
    const srcs=havocHeadSrcs(p);
    const photo=srcs.length?`<div class="mtp-photo-wrap"><img class="mtp-photo" src="${esc(srcs[0])}" data-alts="${esc(srcs.slice(1).join('|'))}" onerror="mtpImgErr(this)"></div>`:'';
    return `<div class="mtp-card${srcs.length?'':' no-photo'}">
      <div class="mtp-flex">${photo}<div class="mtp-main">
      <div class="mtp-head"><span class="mtp-num" style="background:${red}">${p.num||''}</span><span class="mtp-name">${esc(dispName(p).toUpperCase())}</span>${(B.nickname||p.nickname)?`<span class="mtp-nick">&ldquo;${esc(B.nickname||p.nickname)}&rdquo;</span>`:''}${(p.pron||bioLine(B.pronunciation))?`<span class="mtp-pron">${esc(p.pron||bioLine(B.pronunciation))}</span>`:''} ${statSpan(p,'Huntsville')}<span class="mtp-meta">${p.pos||''} · HT: ${p.ht||'—'} · WT: ${p.wt||'—'} · ${isG?'GLOVE':'SHOOTS'}: ${p.sh||'—'}${p.age?' · AGE: '+p.age:''}${p.birth?' · '+esc(p.birth):''}${p.bornIn?' · BORN '+esc(p.bornIn):''}${p.rookie==='1'?' · ROOKIE':''}${p.draft?' · '+esc(p.draft):''}${p.seasonWithTeam?' · SEASON '+esc(p.seasonWithTeam)+' WITH HSV':''}${p.returning===0?' · NEW':''}</span></div>
      ${stripe}
      <div class="mtp-blurb">${esc(auto)}</div>
      <div class="mtp-blurb">${notesHtml||'<span class="mtp-nobio">No written bio yet — authored bios live in data/bios.json.</span>'}</div>
      ${p.acquired?`<div class="mtp-line"><b>Acquired</b> ${esc(p.acquired)}</div>`:''}
      ${(p.awards||[]).length?`<div class="mtp-line"><b>Awards</b> ${esc(p.awards.join(' · '))}</div>`:''}
      ${p.junior?`<div class="mtp-line"><b>Junior</b> ${esc(p.junior)}</div>`:''}
      ${bioFoot}
      </div></div>
    </div>`;
  }).join('');
}
function meetTeamPage(players,teamStats,R,red,S){
  const cards=players.map(p=>mtpCardHTML(p,teamStats,R,red,S)).join('');
  return `<div class="page" style="--havoc-red:${red}">
    <div class="pg-head" style="border-color:${red}"><div class="pg-logo">${logoHTML("Huntsville Havoc",'','H')}</div><div class="pg-title" style="color:${red}">MEET THE TEAM</div><div class="pg-num">__PGNO__</div></div>
    ${cards}
    <div class="gn-foot"><span>${esc(S.social)}</span><span>${esc(S.footer)}</span><span>__PGNO__</span></div></div>`;
}


