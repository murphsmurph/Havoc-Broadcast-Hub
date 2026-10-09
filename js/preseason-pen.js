/* Preseason vs PEN — the temporary tab for the 2026-27 exhibition against the
   Pensacola Ice Flyers (Fri Oct 9, 2026). Follows the Opening Weekend temp-tab
   pattern: researched data rendered verbatim, a few things Jacob fills in
   himself, a printable preview, and an Archive that files the record and takes
   the tab out of the nav.

   Everything researched is the PRESEASON_PEN constant (js/preseason-pen-data.js,
   loaded just before this file). What Jacob types — jersey numbers, the venue,
   storyline edits, the say-it column, the checklists, the final result — lives
   under DATA.preseasonPen, which every backup path already carries because they
   all serialize DATA. Seeded values are never edited in place.

   Declaration-only: nothing here runs at parse time. showTab('preseason') calls
   ppRender(); initForms() calls ppLoad().

   The bulk actions all feed EXISTING features and all follow the same two
   rules: preview before applying, and never overwrite a value that is already
   there. No Havoc player is created or edited here — that roster belongs to
   the league feed and the committed spine. */

const PP_TEAM='Pensacola Ice Flyers';   // the DATA.oppRosters key, a full TEAMS name
const PP_STATUS={back:['ok','Back'],'echl-camp':['warn','ECHL camp'],'new-team':['mute','New team'],
                 retired:['mute','Retired'],unsure:['warn','Unsure']};

function ppSrc(){return (typeof PRESEASON_PEN!=='undefined'&&PRESEASON_PEN)||{};}
/* the store for everything hand-entered on this tab */
function ppData(){
  DATA.preseasonPen=DATA.preseasonPen||{};
  const o=DATA.preseasonPen;
  o.numbers=o.numbers||{};  // {name:'18'} — jersey numbers Jacob types
  o.storyOv=o.storyOv||{};  // {index:'edited text'} — storyline overrides, seed untouched
  o.pron=o.pron||{};        // {name:'shuh-REE-no'} — the say-it column
  o.checks=o.checks||{};    // {'h:0'|'p:0'|'c:0':true} — PR questions + confirm-before-air
  o.result=o.result||{};    // {score,scorers,notes} — captured at archive
  if(o.venue==null)o.venue='';
  return o;
}

/* ---- small shared bits ---- */
/* the jersey number for a player: what Jacob typed on this device wins; otherwise the
   number seeded in the research (the Havoc camp numbers from the club); otherwise '' */
function ppNum(p){
  const typed=String(ppData().numbers[p.name]||'').trim();
  return typed||String(p.number==null?'':p.number).trim();
}
function ppDash(v){return (v==null||String(v).trim()==='')?'—':esc(v);}
function ppQ(s){return esc(s).replace(/'/g,'&#39;');}   // safe inside a single-quoted onclick arg
/* +/- per GP: sign, two decimals, scope in small type. Missing is a dash, never 0. */
function ppPM(p){
  const v=p.plusMinusPerGP;
  if(v==null)return '<span class="pp-pm">—</span>';
  const cls=v>0?'pp-pos':(v<0?'pp-neg':'pp-zero');
  const num=(v>=0?'+':'-')+Math.abs(v).toFixed(2);
  return `<span class="pp-pm ${cls}">${num}</span>`+
    (p.plusMinusScope?`<span class="pp-scope">(${esc(p.plusMinusScope)})</span>`:'');
}
/* status badge — a pill on screen, plain colored text on paper (pills carry
   theme tokens that would print dark from the dark theme) */
function ppStatus(status,paper){
  const s=PP_STATUS[status]||['mute',status||'—'];
  return paper?`<span class="pp-st pp-st-${s[0]}">${esc(s[1])}</span>`:`<span class="pill ${s[0]}">${esc(s[1])}</span>`;
}
function ppTags(p){
  return (p.tags||[]).map(t=>`<span class="pp-tag pp-tag-${esc(t)}">${esc(t)}</span>`).join('')+
    (p.confirmNote?`<span class="pp-note" title="${esc(p.confirmNote)}">&#9432;</span>`:'');
}
function ppTeam(side){return ((ppSrc().teams||{})[side])||{};}
function ppSkaters(side){const t=ppTeam(side);return [].concat(t.forwards||[],t.defense||[],t.goalies||[]);}
function ppPlayers(side){return [].concat(ppTeam(side).coaches||[],ppSkaters(side));}
function ppFirstSentence(s){
  const m=String(s||'').match(/^.*?[.!?](?=\s|$)/);
  return (m?m[0]:String(s||'')).trim();
}
function ppLongDate(iso){
  if(!iso)return '—';
  return new Date(iso+'T00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
}
function ppShortDate(iso){
  if(!iso)return '—';
  return typeof fmtDateShort==='function'?fmtDateShort(iso):iso;
}
function ppTime24(s){
  const m=String(s||'').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if(!m)return '';
  let h=+m[1]%12; if(/pm/i.test(m[3]))h+=12;
  return String(h).padStart(2,'0')+':'+m[2];
}
function ppTable(cls,head,rows){
  return `<table class="${cls}"><thead><tr>${head.map(h=>`<th${/^r:/.test(h)?' class="r"':''}>${h.replace(/^r:/,'')}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`;
}

/* ============================================================
   SECTION 1 — the game card + venue
   ============================================================ */
function ppGameRows(){
  const m=ppSrc().meta||{},o=ppData();
  return [
    ['Matchup','Huntsville Havoc vs. '+(m.opponent||PP_TEAM)],
    ['Game type',m.gameType||'Preseason'],
    ['Date',ppLongDate(m.date)],
    ['Puck drop',(m.puckDropCT||'—')+' CT'],
    ['Venue',(o.venue||'').trim()||'Confirm venue'],
    ['Stream',m.stream||'—']
  ];
}
function ppRenderGame(){
  const el=document.getElementById('ppGame');if(!el)return;
  const m=ppSrc().meta||{},o=ppData();
  const rows=ppGameRows().map(r=>`<tr><td>${esc(r[0])}</td><td><b>${esc(r[1])}</b></td></tr>`).join('');
  el.innerHTML=`<div class="ref-box"><table>${rows}</table>
    ${m.ticketUrl?`<div class="pp-small"><a href="${esc(m.ticketUrl)}" target="_blank" rel="noopener">Ticket page</a>${m.asOf?' &middot; researched '+esc(m.asOf):''}</div>`:''}</div>
    ${!(o.venue||'').trim()&&m.venueNote?`<div class="note">${esc(m.venueNote)}</div>`:''}
    ${(ppSrc().quickFacts||[]).length?`<div class="section-label hub-sectionhead">Quick facts</div><ul class="pp-list">${ppSrc().quickFacts.map(f=>`<li>${esc(f)}</li>`).join('')}</ul>`:''}`;
}
function ppVenueSave(){
  ppData().venue=val('pp_venue').trim();save();ppRenderGame();ppBuild();
  toast(ppData().venue?'Venue saved for this game':'Venue cleared');
}

/* ============================================================
   SECTION 2 — storylines: seed from the constant, edits in an override map
   Same shape as the folder call sheet's value cells: the seed is never
   touched, an edit lives beside it, and the restore arrow only appears once
   there is something to restore.
   ============================================================ */
function ppStoryText(i){
  const o=ppData(),seed=(ppSrc().storylines||[])[i]||{};
  const ov=o.storyOv[i];
  return (ov!=null&&String(ov).trim()!=='')?String(ov):String(seed.text||'');
}
function ppStoryRestore(i){
  delete ppData().storyOv[i];save();ppRenderStories();ppBuild();
  toast('Back to the researched text');
}
function ppStoryMark(i){
  const el=document.getElementById('ppStories');if(!el)return;
  const box=el.querySelectorAll('.ref-box')[i];if(!box)return;
  const h=box.querySelector('h4');if(!h)return;
  const old=h.querySelector('.ov-mark'),oldBtn=h.querySelector('.fv-rv');
  if(old)old.remove();if(oldBtn)oldBtn.remove();
  const ov=ppData().storyOv[i];
  if(ov==null||String(ov).trim()==='')return;
  const seed=(ppSrc().storylines||[])[i]||{};
  h.insertAdjacentHTML('beforeend',
    `<b class="ov-mark" title="edited — researched text: ${esc(seed.text||'')}">&bull;</b>`+
    `<button class="fv-rv no-print" title="Restore the researched text" onclick="ppStoryRestore(${i})">&#8635;</button>`);
}
function ppRenderStories(){
  const el=document.getElementById('ppStories');if(!el)return;
  const list=ppSrc().storylines||[],o=ppData();
  if(!list.length){el.innerHTML='<div class="empty">No storylines in the research.</div>';return;}
  el.innerHTML=list.map((s,i)=>{
    const edited=o.storyOv[i]!=null&&String(o.storyOv[i]).trim()!=='';
    const mark=edited?`<b class="ov-mark" title="edited — researched text: ${esc(s.text||'')}">&bull;</b><button class="fv-rv no-print" title="Restore the researched text" onclick="ppStoryRestore(${i})">&#8635;</button>`:'';
    return `<div class="ref-box"><h4>${i+1}. ${esc(s.title||'')} ${mark}</h4>
      <div class="pp-story fv" contenteditable="true" spellcheck="false" data-i="${i}">${esc(ppStoryText(i))}</div></div>`;
  }).join('');
  ppWireStories();
}
function ppWireStories(){
  const el=document.getElementById('ppStories');if(!el||el._ppWired)return;
  el._ppWired=true;
  el.addEventListener('input',e=>{
    clearTimeout(el._ppT);
    el._ppT=setTimeout(()=>{
      const t=e.target.closest?e.target.closest('.pp-story'):null;if(!t)return;
      const i=t.dataset.i,seed=((ppSrc().storylines||[])[i]||{}).text||'';
      const txt=t.innerText.trim();
      const o=ppData();
      if(txt===String(seed).trim())delete o.storyOv[i]; else o.storyOv[i]=txt;
      save();ppStoryMark(i);ppBuild();
    },600);
  });
}

/* ============================================================
   SECTION 3 — top 10 scorers: who's back
   ============================================================ */
function ppTopRows(side,paper){
  const t=((ppSrc().topScorers||{})[side])||{};
  return (t.rows||[]).map(r=>
    `<tr><td class="r">${esc(r.rank)}</td><td class="nm">${esc(r.name)}</td><td>${ppDash(r.pos)}</td><td class="r">${ppDash(r.gp)}</td>
      <td class="r">${r.g==null?'—':esc(r.g)+'-'+esc(r.a)+'-'+esc(r.pts)}</td><td class="r">${ppPM(r)}</td>
      <td>${ppStatus(r.status,paper)}</td><td>${ppDash(r.where)}</td></tr>`).join('');
}
const PP_TOP_HEAD=['r:#','Player','Pos','r:GP','r:G-A-Pts','r:+/- per GP','Back Friday?','Where now'];
function ppRenderTop(){
  const el=document.getElementById('ppTop');if(!el)return;
  const T=ppSrc().topScorers||{};
  const block=(side,name)=>{
    const t=T[side]||{};
    if(!(t.rows||[]).length)return `<div><h3 class="pp-teamhead">${esc(name)}</h3><div class="empty">No top-10 rows in the research.</div></div>`;
    return `<div><h3 class="pp-teamhead">${esc(name)}</h3>
      ${t.summary?`<p class="desc">${esc(t.summary)}</p>`:''}
      <div class="hub-tablewrap">${ppTable('roster pp-t',PP_TOP_HEAD,ppTopRows(side,false))}</div></div>`;
  };
  el.innerHTML=block('havoc','Huntsville Havoc')+block('pensacola',PP_TEAM);
}

/* ============================================================
   SECTION 4 — ECHL camps right now
   ============================================================ */
function ppEchlRows(){
  return (ppSrc().echlCamps||[]).map(c=>
    `<tr><td class="nm">${esc(c.name)}</td><td>${ppDash(c.sphlTeam)}</td><td>${ppDash(c.pos)}</td><td>${ppDash(c.echlTeam)}</td><td>${ppDash(c.type)}</td><td>${ppDash(c.note)}</td></tr>`).join('');
}
/* every roster player (both teams) with an echlLastSeason value */
function ppEchlLastRows(){
  const rows=[];
  [['havoc','HSV'],['pensacola','PEN']].forEach(([side,abbr])=>{
    ppSkaters(side).forEach(p=>{if(p.echlLastSeason)rows.push(
      `<tr><td class="nm">${esc(p.name)}</td><td>${abbr}</td><td>${ppDash(p.pos)}</td><td>${esc(p.echlLastSeason)}</td></tr>`);});
  });
  return rows.join('');
}
const PP_ECHL_HEAD=['Player','SPHL team','Pos','ECHL camp','Type','Note'];
const PP_ECHL_LAST_HEAD=['Player','Team','Pos','ECHL last season'];
function ppRenderEchl(){
  const el=document.getElementById('ppEchl');if(!el)return;
  const former=(ppSrc().formerFlyersAtEchl||[]).map(s=>`<li>${esc(s)}</li>`).join('');
  const last=ppEchlLastRows();
  el.innerHTML=`<div class="hub-tablewrap">${ppTable('roster pp-t',PP_ECHL_HEAD,ppEchlRows()||'<tr><td colspan="6">—</td></tr>')}</div>
    ${former?`<div class="section-label hub-sectionhead">Former Ice Flyers at ECHL camps</div><ul class="pp-list">${former}</ul>`:''}
    <div class="section-label hub-sectionhead">On Friday's ice with ECHL time last season</div>
    <div class="hub-tablewrap">${ppTable('roster pp-t',PP_ECHL_LAST_HEAD,last||'<tr><td colspan="4">—</td></tr>')}</div>`;
}

/* ============================================================
   SECTION 5 — 2025-26 head-to-head + history + 2026-27 meetings
   ============================================================ */
function ppH2hSummary(){
  const s=(ppSrc().h2h2025_26||{}).summary||{};
  return `Havoc ${ppDash(s.havocRecord)}, outscored Pensacola ${ppDash(s.goalsFor)}-${ppDash(s.goalsAgainst)} (home ${ppDash(s.homeRecord)} &middot; road ${ppDash(s.roadRecord)})`;
}
function ppH2hRows(){
  return ((ppSrc().h2h2025_26||{}).games||[]).slice()
    .sort((a,b)=>String(b.date).localeCompare(String(a.date)))      // newest first
    .map(g=>`<tr><td>${esc(ppShortDate(g.date))}</td><td>${ppDash(g.site)}</td><td>${ppDash(g.final)}</td>
      <td class="r"><b>${ppDash(g.havocResult)}</b></td><td>${ppDash(g.notes)}</td></tr>`).join('');
}
function ppPlayoffRows(){
  return (ppSrc().playoffHistory||[]).map(p=>
    `<tr><td>${ppDash(p.year)}</td><td>${ppDash(p.round)}</td><td>${ppDash(p.winner)}</td><td>${ppDash(p.series)}</td><td>${ppDash(p.note)}</td></tr>`).join('');
}
function ppSeasonRows(){
  return (ppSrc().lastThreeSeasons||[]).map(s=>
    `<tr><td><b>${ppDash(s.season)}</b></td><td>${ppDash(s.havoc)}</td><td>${ppDash(s.pensacola)}</td></tr>`).join('');
}
function ppMeetingRows(paper){
  return (ppSrc().meetings2026_27||[]).map(m=>{
    const flag=/confirm/i.test(m.note||'');
    return `<tr><td>${esc(ppShortDate(m.date))}</td><td>${m.site==='HSV'?'Huntsville':(m.site==='PEN'?'Pensacola':ppDash(m.site))}</td>
      <td>${flag?(paper?'<span class="pp-st pp-st-warn">Confirm</span> ':'<span class="pill warn">Confirm</span> '):''}${esc(m.note||'')}</td></tr>`;
  }).join('');
}
const PP_H2H_HEAD=['Date','Site','Final','r:Result','Notes'];
const PP_PO_HEAD=['Year','Round','Winner','Series','Note'];
const PP_SEASON_HEAD=['Season','Havoc','Pensacola'];
const PP_MEET_HEAD=['Date','Site','Note'];
function ppRenderH2h(){
  const el=document.getElementById('ppH2h');if(!el)return;
  const tc=ppSrc().trophyCase||{};
  el.innerHTML=`<p class="desc">${ppH2hSummary()}</p>
    <div class="hub-tablewrap">${ppTable('roster pp-t',PP_H2H_HEAD,ppH2hRows()||'<tr><td colspan="5">—</td></tr>')}</div>
    <div class="section-label hub-sectionhead">Playoff history</div>
    <div class="hub-tablewrap">${ppTable('roster pp-t',PP_PO_HEAD,ppPlayoffRows()||'<tr><td colspan="5">—</td></tr>')}</div>
    <div class="section-label hub-sectionhead">Trophy case</div>
    <ul class="pp-list"><li><b>Havoc:</b> ${ppDash(tc.havoc)}</li><li><b>Ice Flyers:</b> ${ppDash(tc.pensacola)}</li></ul>
    <div class="section-label hub-sectionhead">Last three seasons</div>
    <div class="hub-tablewrap">${ppTable('roster pp-t',PP_SEASON_HEAD,ppSeasonRows()||'<tr><td colspan="3">—</td></tr>')}</div>
    <div class="section-label hub-sectionhead">2026-27 meetings</div>
    <div class="hub-tablewrap">${ppTable('roster pp-t',PP_MEET_HEAD,ppMeetingRows(false)||'<tr><td colspan="3">—</td></tr>')}</div>`;
}

/* ============================================================
   SECTION 6 — rosters side by side, with the jersey inputs
   ============================================================ */
function ppNumSet(name,v){
  ppData().numbers[name]=String(v||'').trim();
  save();
  ppBuild();   // the printed pages carry the numbers too
}
function ppNumInput(p){
  const name=p.name,v=ppNum(p);
  return `<input class="pp-num" type="text" inputmode="numeric" maxlength="2" value="${esc(v)}"
    aria-label="Jersey number for ${esc(name)}" placeholder="—"
    onchange="ppNumSet('${ppQ(name)}',this.value)">`;
}
function ppRenderRosters(){
  const el=document.getElementById('ppRosters');if(!el)return;
  const side=(name,key)=>{
    const t=ppTeam(key);
    const grp=(label,list,isCoach)=>!list||!list.length?'':
      `<div class="section-label hub-sectionhead">${label}</div>`+list.map(p=>
        `<div class="pp-row"><div class="pp-rnum">${isCoach?'':ppNumInput(p)}</div>
          <div class="pp-rbody"><div class="pp-rname">${esc(p.name)} ${ppTags(p)}
            <span class="pp-rpos">${esc(isCoach?(p.role||''):(p.pos||''))}</span></div>
          ${isCoach?'':`<div class="pp-rmeta">${ppDash(p.hometown)} &middot; ${ppDash(p.stats)} &middot; ${ppPM(p)}</div>`}
          <div class="pp-rnotes">${esc(p.notes||'')}</div>${isCoach?'':ppStudyDetails(p,key)}</div></div>`).join('');
    const G=ppStudy(),src=key==='pensacola'&&G&&G.players&&G.players.pensacolaSources;   // the guide's "Sources for these three" line
    return `<div><h3 class="pp-teamhead">${esc(name)}</h3>
      ${grp('Coaches',t.coaches,true)}${grp('Forwards',t.forwards)}${grp('Defense',t.defense)}${grp('Goalies',t.goalies)}
      ${src?`<p class="pp-small pp-rsrc">${esc(String(src.text||'').split(':')[0])}: ${(src.links||[]).map(x=>`<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.label)}</a>`).join(' &middot; ')}</p>`:''}</div>`;
  };
  el.innerHTML=side('Huntsville Havoc','havoc')+side(PP_TEAM,'pensacola');
}

/* ============================================================
   SECTION 7 — summer signings
   ============================================================ */
const PP_SIGN_HEAD=['Signed','Player','Pos','New/Back','Status'];
function ppSignRows(side,paper){
  const s=((ppSrc().signings2026||{})[side])||{};
  return (s.rows||[]).map(r=>
    `<tr><td>${esc(ppShortDate(r.date))}</td><td class="nm">${esc(r.name)}</td><td>${ppDash(r.pos)}</td><td>${ppDash(r.newOrBack)}</td>
      <td>${ppStatus(r.status,paper)} ${esc(r.statusText||'')}</td></tr>`).join('');
}
function ppRenderSignings(){
  const el=document.getElementById('ppSignings');if(!el)return;
  const S=ppSrc().signings2026||{};
  const block=(side,name)=>{
    const s=S[side]||{};
    const notes=(s.notAtCampNotes||[]).map(n=>`<li>${esc(n)}</li>`).join('');
    return `<div><h3 class="pp-teamhead">${esc(name)}</h3>
      ${s.summary?`<p class="desc">${esc(s.summary)}</p>`:''}
      <div class="hub-tablewrap">${ppTable('roster pp-t',PP_SIGN_HEAD,ppSignRows(side,false)||'<tr><td colspan="5">—</td></tr>')}</div>
      ${notes?`<div class="section-label hub-sectionhead">Not at camp</div><ul class="pp-list">${notes}</ul>`:''}</div>`;
  };
  el.innerHTML=block('havoc','Huntsville Havoc')+block('pensacola',PP_TEAM);
}

/* ============================================================
   SECTION 8 — pronunciation flags
   ============================================================ */
function ppSay(p){const o=ppData();return String(o.pron[p.name]!=null?o.pron[p.name]:(p.guess||'')).trim();}
function ppPronSet(name,v){ppData().pron[name]=String(v||'').trim();save();ppBuild();}
function ppRenderPron(){
  const el=document.getElementById('ppPron');if(!el)return;
  const list=ppSrc().pronunciations||[];
  if(!list.length){el.innerHTML='<div class="empty">No pronunciation flags in the research.</div>';return;}
  el.innerHTML=ppTable('roster pp-t',['Team','Name','Researched guess','Confidence','Say it'],list.map(p=>{
    const conf=p.confidence==='ask'?'<span class="pill warn">ask</span>':(p.confidence==='team'?'<span class="pill ok" title="From Pensacola PR">team</span>':`<span class="pill grey">${esc(p.confidence||'')}</span>`);
    return `<tr><td>${ppDash(p.team)}</td><td class="nm">${esc(p.name)}</td><td>${ppDash(p.guess)}</td><td>${conf}</td>
      <td><input class="pp-say" type="text" value="${esc(ppSay(p))}" placeholder="—"
        aria-label="Pronunciation for ${esc(p.name)}" onchange="ppPronSet('${ppQ(p.name)}',this.value)"></td></tr>`;
  }).join(''));
}

/* ============================================================
   SECTION 9 — ask team PR / confirm before air
   ============================================================ */
function ppCheck(key,on){ppData().checks[key]=!!on;save();ppBuild();}
function ppRenderChecks(){
  const el=document.getElementById('ppChecks');if(!el)return;
  const o=ppData(),Q=ppSrc().prQuestions||{};
  const group=(label,list,pre)=>!list||!list.length?'':
    `<div class="section-label hub-sectionhead">${label}</div>`+list.map((c,i)=>{
      const k=pre+':'+i;
      return `<div class="iv-q"><label><input type="checkbox" ${o.checks[k]?'checked':''} onchange="ppCheck('${k}',this.checked)">
        <span class="iv-qt${o.checks[k]?' iv-asked':''}">${esc(c)}</span></label></div>`;}).join('');
  el.innerHTML=group('Ask Havoc PR',Q.havoc,'h')+group('Ask Pensacola PR',Q.pensacola,'p')+group('Confirm before air',ppSrc().checklist,'c')
    ||'<div class="empty">No questions in the research.</div>';
}

/* ============================================================
   SECTION 10 — sources
   ============================================================ */
function ppRenderSources(){
  const el=document.getElementById('ppSources');if(!el)return;
  el.innerHTML=(ppSrc().sources||[]).map(s=>
    `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a></li>`).join('')||'<li>—</li>';
}

/* ============================================================
   BULK ACTIONS — every one previews first and fills empties only
   ============================================================ */
function ppPreview(title,lines,applyFn,emptyMsg){
  if(!lines.length){toast(emptyMsg||'Nothing to change — everything is already filled in');return;}
  if(!confirm(title+'\n\n'+lines.join('\n')+'\n\nApply?'))return;
  applyFn();
}

/* the game card -> This Game, empty fields only — including the ECHL and
   transaction boxes the game notes read */
function ppSendGame(){
  const D=ppSrc(),m=D.meta||{},o=ppData();
  const venue=(o.venue||'').trim();
  const echl=(D.echlCamps||[]).filter(c=>c.sphlTeam==='HSV').map(c=>[c.pos,c.name].filter(Boolean).join(' ')+' — '+(c.echlTeam||'')+(c.type?' ('+c.type+')':'')).join('\n');
  const oppEchl=(D.echlCamps||[]).filter(c=>c.sphlTeam==='PEN').map(c=>[c.pos,c.name].filter(Boolean).join(' ')+' — '+(c.echlTeam||'')+(c.type?' ('+c.type+')':'')).join('\n');
  const tx=D.transactionsForGameNotes||{};
  const want=[['g_opp','Opponent',m.opponent],['g_homeaway','Home/away','vs'],['g_date','Date',m.date],
              ['g_time','Puck drop',ppTime24(m.puckDropCT)],['g_broadcast','Broadcast',m.stream],['g_venue','Venue',venue],
              ['g_echl','Havoc ECHL call-ups',echl],['g_oppEchl','Pensacola ECHL call-ups',oppEchl],
              ['g_txhome','Havoc transactions',(tx.havoc||[]).join('\n')],['g_txaway','Pensacola transactions',(tx.pensacola||[]).join('\n')]];
  const lines=[],todo=[];
  want.forEach(([id,label,v])=>{
    if(!v){if(id==='g_oppEchl')lines.push('  '+label+': nothing in the research');return;}
    const el=document.getElementById(id);if(!el)return;
    const cur=String(el.value||'').trim();
    /* g_venue is back-filled from the settings default, so treat that as empty */
    const isDefault=(id==='g_venue'&&cur===String(DATA.settings.venue||'').trim());
    if(cur&&!isDefault){lines.push('  '+label+': keeping "'+cur.split('\n')[0]+(cur.indexOf('\n')>=0?' …':'')+'"');return;}
    todo.push([id,v]);lines.push('  '+label+' -> '+v.split('\n').join(' / '));
  });
  const ps=document.getElementById('g_ps');
  if(ps&&!ps.checked)lines.push('  Preseason: checked');
  ppPreview('Send to This Game — fills empty fields only:',lines,()=>{
    todo.forEach(([id,v])=>setv(id,v));
    if(ps)ps.checked=true;
    if(typeof updatePromoField==='function')updatePromoField();
    if(typeof saveGame==='function')saveGame();
    toast('This Game updated — preseason flagged');
  },'This Game already has all of it');
}

/* numbers -> Havoc roster + Pensacola opponent roster, empty slots only */
function ppCopyNumbers(){
  const o=ppData(),plan=[],skip=[];
  const consider=(side,list,label)=>{
    ppSkaters(side).forEach(p=>{
      const n=ppNum(p);
      if(!n)return;
      const hit=rosterMatch(p.name,list);
      if(!hit){skip.push('  no match on '+label+': '+p.name);return;}
      if(String(hit.num||'').trim()!==''){
        if(String(hit.num)!==n)skip.push('  '+label+' '+p.name+' already #'+hit.num+' (kept)');
        return;
      }
      plan.push({p:hit,n,line:'  '+label+' · '+p.name+' -> #'+n});
    });
  };
  consider('havoc',DATA.roster,'Havoc');
  DATA.oppRosters[PP_TEAM]=DATA.oppRosters[PP_TEAM]||[];
  consider('pensacola',DATA.oppRosters[PP_TEAM],'Pensacola');
  const lines=plan.map(x=>x.line).concat(skip.length?['',...skip]:[]);
  ppPreview('Copy jersey numbers into the rosters — empty numbers only:',lines,()=>{
    /* staleSet fills an empty field only and respects both ownership layers,
       so a number the feed owns or Jacob typed on the roster itself stands */
    plan.forEach(x=>staleSet(x.p,'num',x.n));
    save();
    if(typeof renderRoster==='function')renderRoster();
    if(typeof renderOppRoster==='function')renderOppRoster();
    toast(plan.length+' number'+(plan.length===1?'':'s')+' copied');
  },'No empty jersey numbers to fill — type some numbers first');
}

/* camp roster -> a stored roster (the Pensacola opponent roster, or the Havoc roster for
   the preseason game). Two things, one preview:
   1. add every camp player who is missing (never edits one who is there);
   2. scratch every active player who is NOT on the camp list — the stored rosters are
      last season's (the committed league file for Pensacola, the feed and spine for the
      Havoc), so without this the call sheets print stale names around the ones who dress.
   A scratch is recorded exactly as the Rosters tab records one (active '0' plus
   handEdit.active), so the next roster sync or spine apply leaves it alone and Edit on the
   Rosters tab reverses it. Nothing is deleted. A player whose active flag Jacob already set
   by hand is left exactly as he set it. For the Havoc this is the one place the tab touches
   DATA.roster beyond jersey numbers, at Jacob's request for the preseason game; his
   opening-day upload (Set as opening-day roster) reconciles everything afterwards. */
function ppHubPos(pos){           // the hub's call sheets group by C/LW/RW/D/G
  const p=String(pos||'').toUpperCase();
  if(p==='LD'||p==='RD')return 'D';
  if(p.indexOf('/')>=0)return p.split('/')[0];
  return p;
}
function ppSeedRoster(side,list,label){
  const add=[],scratch=[],lines=[],atCamp=new Set();
  ppSkaters(side).forEach(p=>{
    const hit=rosterMatch(p.name,list);
    if(hit){atCamp.add(hit.id);lines.push('  already on the roster: '+p.name);return;}
    add.push(p);lines.push('  add '+p.name+(p.pos?' ('+p.pos+')':''));
  });
  const kept=[];
  list.forEach(r=>{
    if(atCamp.has(r.id)||r.active==='0'||!r.name)return;
    if(handOwns(r,'active')){kept.push('  kept active (you set it by hand): '+r.name);return;}
    scratch.push(r);
  });
  if(scratch.length)lines.push('','  Scratch — not on the preseason roster:',...scratch.map(r=>'    '+r.name+(r.pos?' ('+r.pos+')':'')));
  if(kept.length)lines.push('',...kept);
  if(!add.length&&!scratch.length)lines.length=0;
  ppPreview('Seed the '+label+' roster — adds missing camp players, scratches everyone else:',lines,()=>{
    add.forEach(p=>{
      /* the call-sheet card reads callNote (its editable notes line), birth and age —
         not bbio — so a newcomer gets those filled from the camp research too */
      const first=ppFirstSentence(p.notes);
      const np={id:uid(),name:p.name,pos:ppHubPos(p.pos),notes:'',active:'1',bbio:first,callNote:first};
      if(p.hometown)np.birth=p.hometown;
      if(p.age!=null)np.age=String(p.age);
      const n=ppNum(p);
      if(n)np.num=n;
      list.push(np);
    });
    scratch.forEach(r=>{r.active='0';r.handEdit=Object.assign({},r.handEdit||{},{active:1});});
    save();
    /* refresh only the side touched: renderRoster() re-applies the Havoc baselines
       (spine, league file), which has no business running after a Pensacola seed */
    if(side==='havoc'){if(typeof renderRoster==='function')renderRoster();}
    else if(typeof renderOppRoster==='function')renderOppRoster();
    toast(add.length+' added, '+scratch.length+' scratched — the '+label+' call sheet now prints the preseason roster');
  },'The '+label+' roster already matches the preseason list — nothing to add or scratch');
}
function ppSeedOpp(){
  DATA.oppRosters[PP_TEAM]=DATA.oppRosters[PP_TEAM]||[];
  ppSeedRoster('pensacola',DATA.oppRosters[PP_TEAM],'Pensacola');
}
function ppSeedHavoc(){
  DATA.roster=DATA.roster||[];
  ppSeedRoster('havoc',DATA.roster,'Havoc');
}

/* Havoc coaches -> Hockey Operations, empty roles only */
function ppSeedOps(){
  const co=ppTeam('havoc').coaches||[];
  const hc=co.find(c=>/head coach/i.test(c.role||'')),ac=co.find(c=>/assistant/i.test(c.role||''));
  const H=DATA.hockeyOps||{},plan=[],lines=[];
  [['hc','Head coach',hc],['ac','Assistant coach',ac]].forEach(([k,label,c])=>{
    if(!c)return;
    const cur=H[k]||{};
    if(!String(cur.name||'').trim()){plan.push([k,'name',c.name]);lines.push('  '+label+' name -> '+c.name);}
    else lines.push('  '+label+' name: keeping "'+cur.name+'"');
    if(!String(cur.bio||'').trim()){plan.push([k,'bio',c.notes||'']);lines.push('  '+label+' bio -> '+ppFirstSentence(c.notes)+' …');}
    else lines.push('  '+label+' bio: kept');
  });
  ppPreview('Seed Hockey Operations — fills empty fields only:',lines,()=>{
    DATA.hockeyOps=DATA.hockeyOps||{};
    plan.forEach(([k,f,v])=>{DATA.hockeyOps[k]=DATA.hockeyOps[k]||{name:'',bio:''};DATA.hockeyOps[k][f]=v;});
    save();
    /* the hockey-ops form auto-saves from the DOM, so refill it or the next
       keystroke on any role would wipe what we just wrote */
    if(typeof loadHockeyOps==='function')loadHockeyOps();
    toast('Hockey Operations seeded');
  },'Hockey Operations already has both coaches');
}

/* pronunciation flags -> the Team Settings guide, skipping blanks + duplicates */
function ppAddPron(){
  const list=ppSrc().pronunciations||[];
  const guide=(DATA.settings.pronounce||'');
  /* the guide is matched by last-name substring everywhere it is read, so the
     honest duplicate test is the same one teamPronList and fdPron use */
  const have=guide.split('\n').map(l=>{const p=l.split(/\s*[-–—]\s*/);return {name:(p[0]||'').trim().toLowerCase(),say:p.slice(1).join('-').trim()};}).filter(x=>x.name&&x.say);
  const add=[],lines=[];
  list.forEach(p=>{
    const say=ppSay(p);
    if(!say){lines.push('  skipped (blank): '+p.name);return;}
    const last=p.name.trim().split(/\s+/).pop().toLowerCase();
    if(have.some(g=>g.name.indexOf(last)>=0)){lines.push('  skipped (already in the guide): '+p.name);return;}
    add.push(p.name+' - '+say);lines.push('  '+p.name+' - '+say);
  });
  ppPreview('Add to the pronunciation guide — new names only:',lines,()=>{
    const next=(guide.trim()?guide.replace(/\s*$/,'')+'\n':'')+add.join('\n')+'\n';
    DATA.settings.pronounce=next;
    /* saveSettings() rebuilds settings from the DOM, so the textarea has to be
       mirrored or the next Settings save would throw this append away */
    setv('s_pronounce',next);
    save();
    toast(add.length+' name'+(add.length===1?'':'s')+' added to the guide');
  },'Every flagged name is already in the guide, or has no pronunciation yet');
}

/* ============================================================
   PLAYER STUDY GUIDE — Jacob's Oct 7 research, revised Oct 8, from js/preseason-pen-study.js
   Matched to the camp roster by name (or by last name and number when the guide has only
   a surname, as with #3 Jakovljevic). On screen it sits under each roster row
   and in three cards (signed-not-on-list, benches and ties, booth reference);
   on paper it is the back half of the packet and its own Study guide view.
   ============================================================ */
const PP_STUDY_FIELDS=[['matchCheck','Match check'],['id','ID'],['path','Path'],['lastSeason','Last season'],['honors','Honors'],['talkingPoints','Talking points'],['ties','Ties'],['check','Check'],['numberCheck','Number check']];
function ppStudy(){return (typeof PRESEASON_STUDY!=='undefined'&&PRESEASON_STUDY)||null;}
function ppStudyFor(p,side){
  const S=ppStudy();if(!S||!p)return null;
  const k=norm(p.name),list=((S.players||{})[side])||[];
  const hit=list.find(e=>norm(e.name)===k);if(hit)return hit;
  /* a surname-only entry ("#3 Jakovljevic — D (new; confirm first name)") matches the roster
     player with that last name, and the same number when both carry one */
  const last=norm(String(p.name||'').trim().split(/\s+/).pop()||'');
  return last&&list.find(e=>!/\s/.test(String(e.name).trim())&&norm(e.name)===last&&(!e.num||!p.number||String(e.num)===String(p.number)))||null;
}
/* the guide's ID line without the birthdate or the "· Say:" pronunciation — "Shoots R · 6-0, 170 · 29 · Livonia, Mich."
   (the call-sheet card is one line; the sheet's pronunciation box carries the sayings) */
function ppStudyVitals(e){return e&&e.id?String(e.id).replace(/\s*\(b\.[^)]*\)/,'').replace(/\s*·\s*Say:.*$/,'').trim():'';}
function ppStudyFieldsHTML(e,cls){
  return PP_STUDY_FIELDS.filter(([k])=>e[k]).map(([k,label])=>`<div class="${cls}"><b>${label}:</b> ${esc(e[k])}</div>`).join('');
}
/* under a roster row on screen */
function ppStudyDetails(p,side){
  const e=ppStudyFor(p,side);if(!e)return '';
  return `<details class="pp-study"><summary>Study guide</summary><div class="pp-study-b">${ppStudyFieldsHTML(e,'pp-study-f')}</div></details>`;
}
function ppStudyBullets(list){return (list||[]).map(b=>`<li>${b.label?'<b>'+esc(b.label)+':</b> ':''}${esc(b.text)}</li>`).join('');}
function ppRenderNotOnList(){
  const el=document.getElementById('ppNotOnList');if(!el)return;
  const S=ppStudy();const N=S&&S.notOnList;
  if(!N){el.innerHTML='<div class="empty">No study guide loaded.</div>';return;}
  el.innerHTML=`<p class="desc">${esc(N.intro)}</p><div class="hub-tablewrap">${ppTable('roster pp-t',N.head,N.rows.map(r=>'<tr>'+N.head.map((h,i)=>`<td${i===0?' class="nm"':''}>${esc(r[h])}</td>`).join('')+'</tr>').join(''))}</div>`;
}
function ppRenderBench(){
  const el=document.getElementById('ppBench');if(!el)return;
  const S=ppStudy();const B=S&&S.benches,W=S&&S.whoKnowsWhom;
  if(!B){el.innerHTML='<div class="empty">No study guide loaded.</div>';return;}
  const bench=(name,list)=>`<div><h3 class="pp-teamhead">${esc(name)}</h3><ul class="pp-list">${(list||[]).map(b=>`<li><b>${esc(b.role)} ${esc(b.name)}:</b> ${esc(b.text)}</li>`).join('')}</ul></div>`;
  el.innerHTML=`<p class="desc">${esc(B.intro||'')}</p><div class="grid g2">${bench('Huntsville bench',B.havoc)}${bench('Pensacola bench',B.pensacola)}</div>
    ${W?`<div class="section-label hub-sectionhead">Who knows whom</div><div class="hub-tablewrap">${ppTable('roster pp-t',W.head,W.rows.map(r=>'<tr>'+W.head.map((h,i)=>`<td${i===0?' class="nm"':''}>${esc(r[h])}</td>`).join('')+'</tr>').join(''))}</div>`:''}`;
}
function ppRefTable(T){return ppTable('roster pp-t',T.head,T.rows.map(r=>'<tr>'+T.head.map((h,i)=>`<td${i===0?' class="nm"':''}>${esc(r[h])}</td>`).join('')+'</tr>').join(''));}
function ppRenderBooth(){
  const el=document.getElementById('ppBooth');if(!el)return;
  const S=ppStudy();
  if(!S){el.innerHTML='<div class="empty">No study guide loaded.</div>';return;}
  const det=(title,html,open)=>`<details class="pp-ref"${open?' open':''}><summary>${esc(title)}</summary><div class="pp-ref-b">${html}</div></details>`;
  const groups=(G)=>(G||[]).map(g=>`<h4>${esc(g.title)}</h4><ul class="pp-list">${g.items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul>`).join('');
  const R=S.rinkSpots,Y=S.synonyms,C=S.situational,U=S.ruleChanges,K=S.keyRules;
  el.innerHTML=
    (R?det('Rink locations and shorthand',`<p class="desc">${esc(R.intro)}</p>${S.rinkMapNote?`<p class="desc"><i>Rink map: ${esc(S.rinkMapNote)}</i></p>`:''}<div class="hub-tablewrap">${ppRefTable(R)}</div>`):'')+
    (Y?det('Synonyms: say it a different way',`<p class="desc">${esc(Y.intro)}</p><div class="hub-tablewrap">${ppRefTable(Y)}</div>`):'')+
    (C?det('Situational calls',`<p class="desc">${esc(C.intro)}</p>${groups(C.groups)}`):'')+
    (U?det('Rule changes for 2026-27',`<p class="desc">${esc(U.intro)}</p><div class="hub-tablewrap">${ppRefTable(U)}</div><ul class="pp-list">${ppStudyBullets(U.notes)}</ul>
      ${U.carriedOver?`<h4>Added last season and still in the book</h4><p class="desc">${esc(U.carriedOver.intro)}</p><ul class="pp-list">${ppStudyBullets(U.carriedOver.bullets)}</ul><p class="pp-small">Sources: ${(U.carriedOver.sources||[]).map(x=>`<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.label)}</a>`).join(' · ')}</p>`:''}`):'')+
    (K?det('Key rules to know on air',`<p class="desc">${esc(K.intro)}</p>${groups(K.groups)}`):'')+
    (S.sources?det('Study guide sources',`<p class="desc">${esc(S.sources.intro)}</p>${(S.sources.groups||[]).map(g=>`<h4>${esc(g.group)}</h4><ul class="pp-list">${g.items.map(x=>`<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.label)}</a></li>`).join('')}</ul>`).join('')}`):'');
}

/* ---- paper: the study pages ----
   Fixed pages where the content is known to fit; flowed pages for the player
   entries and the booth reference, where blocks are laid onto a measuring page
   one at a time and a new page starts when the next block would overflow. */
function ppFlow(red,S,title,blocks,cls,perFallback){
  const doc=document.getElementById('preseasonDoc');
  const render=arr=>pgWrap(red,S,title,`<div class="${cls}">${arr.join('')}</div>`);
  /* measure exactly what will be shown: the data stamp joins the footer box on the
     real page (pgFooterFix moves it there), so it has to be on the probe page too */
  const stamp=dataStampHTML('preseason');
  if(!doc||!doc.offsetWidth){   // panel hidden: cannot measure, so a safe fixed count per page
    const out=[];for(let i=0;i<blocks.length;i+=perFallback)out.push(render(blocks.slice(i,i+perFallback)));return out;
  }
  const probe=document.createElement('div');probe.className='pp-probe';probe.style.cssText='position:absolute;left:-9999px;top:0;width:816px;';
  doc.appendChild(probe);
  const fits=arr=>{probe.innerHTML=render(arr).replace('<div class="gn-foot"',stamp+'<div class="gn-foot"');const pg=probe.firstElementChild;if(typeof pgFooterFix==='function')pgFooterFix(probe);
    /* a .page has min-height 1056 on screen, so its box never tells how much room is left;
       drop the floor on the probe copy and its natural height (content + footer pad) is the
       real measure. 6px of slack for print rounding. */
    pg.style.minHeight='0';
    return pg.offsetHeight<=1056-6;};
  const pages=[];let cur=[];
  blocks.forEach(b=>{
    if(!cur.length||fits(cur.concat([b]))){cur.push(b);return;}
    pages.push(render(cur));cur=[b];
  });
  if(cur.length)pages.push(render(cur));
  probe.remove();
  return pages;
}
function ppStudyEntryHTML(e){
  return `<div class="pp-se"><div class="pp-se-h">${e.num?'#'+esc(e.num)+' ':''}${esc(e.name)} &mdash; ${esc(e.pos)}${(e.tags||[]).length?` <span class="pp-se-t">(${esc(e.tags.join(', '))})</span>`:''}</div>${ppStudyFieldsHTML(e,'pp-se-f')}</div>`;
}
function ppPaperRefTable(T){return ppPaperTable(T.head,T.rows.map(r=>'<tr>'+T.head.map(h=>`<td>${esc(r[h])}</td>`).join('')+'</tr>').join(''));}
function ppStudyPages(red,S){
  const G=ppStudy();if(!G)return [];
  const pages=[];
  const A=G.atAGlance||{},T=G.seriesTable,B=G.benches||{};
  const bench=(name,list)=>`<div class="box"><h3>${name}</h3>${(list||[]).map(b=>`<div class="pp-fact"><b>${esc(b.role)} ${esc(b.name)}:</b> ${esc(b.text)}</div>`).join('')}</div>`;
  pages.push(pgWrap(red,S,'STUDY GUIDE &middot; AT A GLANCE',`
    <div class="box"><h3>At a glance</h3><div class="pp-fact">${esc(A.intro||'')}</div><ul class="pp-list">${ppStudyBullets(A.bullets)}</ul><div class="pp-fact"><i>${esc(A.entryNote||'')}</i></div></div>
    ${T?`<div class="box"><h3>${esc(T.title)}</h3>${ppPaperRefTable(T)}</div>`:''}
    <div class="pp-fact">${esc(B.intro||'')}</div>
    <div class="pp-cols2">${bench('Huntsville bench',B.havoc)}${bench('Pensacola bench',B.pensacola)}</div>`));
  const P=G.players||{};
  if((P.havoc||[]).length)pages.push(...ppFlow(red,S,'HAVOC &mdash; STUDY GUIDE',[`<div class="pp-se pp-se-intro">${esc(P.havocIntro||'')}</div>`].concat(P.havoc.map(ppStudyEntryHTML)),'pp-flow',7));
  const N=G.notOnList,W=G.whoKnowsWhom;
  if(N||W)pages.push(pgWrap(red,S,'NOT ON THE LIST &middot; WHO KNOWS WHOM',`
    ${N?`<div class="box"><h3>Signed by the Havoc, not on the preseason list</h3><div class="pp-fact">${esc(N.intro)}</div>${ppPaperRefTable(N)}</div>`:''}
    ${W?`<div class="box"><h3>Who knows whom</h3>${ppPaperRefTable(W)}</div>`:''}`));
  if((P.pensacola||[]).length)pages.push(...ppFlow(red,S,'PENSACOLA &mdash; STUDY GUIDE',[`<div class="pp-se pp-se-intro">${esc(P.pensacolaIntro||'')}</div>`].concat(P.pensacola.map(ppStudyEntryHTML))
    .concat(P.pensacolaSources?[`<div class="pp-se pp-se-intro pp-se-src">${esc(P.pensacolaSources.text||'')}</div>`]:[]),'pp-flow',7));
  const ref=[];
  const R=G.rinkSpots,Y=G.synonyms,C=G.situational,U=G.ruleChanges,K=G.keyRules;
  if(R)ref.push(`<div class="box"><h3>Rink locations and shorthand</h3><div class="pp-fact">${esc(R.intro)}</div>${G.rinkMapNote?`<div class="pp-fact"><i>Rink map: ${esc(G.rinkMapNote)}</i></div>`:''}${ppPaperRefTable(R)}</div>`);
  if(Y)ref.push(`<div class="box"><h3>Synonyms: say it a different way</h3><div class="pp-fact">${esc(Y.intro)}</div>${ppPaperRefTable(Y)}</div>`);
  if(C){ref.push(`<div class="box"><h3>Situational calls</h3><div class="pp-fact">${esc(C.intro)}</div></div>`);(C.groups||[]).forEach(g=>ref.push(`<div class="box"><h3>${esc(g.title)}</h3><ul class="pp-list">${g.items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul></div>`));}
  if(U){ref.push(`<div class="box"><h3>Rule changes for 2026-27</h3><div class="pp-fact">${esc(U.intro)}</div>${ppPaperRefTable(U)}<ul class="pp-list">${ppStudyBullets(U.notes)}</ul></div>`);
    if(U.carriedOver)ref.push(`<div class="box"><h3>Added last season and still in the book</h3><div class="pp-fact">${esc(U.carriedOver.intro)}</div><ul class="pp-list">${ppStudyBullets(U.carriedOver.bullets)}</ul></div>`);}
  if(K){ref.push(`<div class="box"><h3>Key rules to know on air</h3><div class="pp-fact">${esc(K.intro)}</div></div>`);(K.groups||[]).forEach(g=>ref.push(`<div class="box"><h3>${esc(g.title)}</h3><ul class="pp-list">${g.items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul></div>`));}
  if(G.sources)ref.push(`<div class="box"><h3>Study guide sources</h3><div class="pp-fact">${esc(G.sources.intro)}</div>${(G.sources.groups||[]).map(g=>`<div class="pp-sub">${esc(g.group)}</div><ul class="pp-list">${g.items.map(x=>`<li>${esc(x.label)} &mdash; ${esc(x.url)}</li>`).join('')}</ul>`).join('')}</div>`);
  if(ref.length)pages.push(...ppFlow(red,S,'BOOTH REFERENCE',ref,'pp-refflow',3));
  return pages;
}

/* ============================================================
   CALL SHEETS — one portrait page per team, built from the camp data
   Same shell and classes as the Broadcast Folders call sheet (lc-page / cs-*),
   same team colours (teamPal), but every value comes from PRESEASON_PEN plus
   what is typed on this tab: the 18 Havoc and 22 Pensacola players who dress
   Friday, their numbers, positions, hometowns, stat lines and a note per player
   summarised from the study guide (PRESEASON_CALL_NOTES). The
   folders read the stored rosters and need the seed buttons first; these do not.
   ============================================================ */
let PP_VIEW='packet';   // 'packet' (four pages + the study guide) | 'calls' (two call sheets) | 'study' (the study guide alone)
function ppView(v){
  PP_VIEW=(v==='calls'||v==='study')?v:'packet';
  [['ppViewPacket','packet'],['ppViewCalls','calls'],['ppViewStudy','study']].forEach(([id,k])=>{const el=document.getElementById(id);if(el)el.classList.toggle('active',PP_VIEW===k);});
  ppBuild();
}
function ppCsCard(p,pal,group,side){
  const parts=String(p.name||'').trim().split(/\s+/);
  let first='',last='';
  if(parts.length>1){last=parts.pop();first=parts.join(' ');}else last=parts[0]||'';
  const edge=group==='D'?pal.accent:(group==='G'?pal.goalie:pal.secondary);
  const sv=ppStudyVitals(ppStudyFor(p,side));   // the study guide's ID line when there is one
  const vitals=sv?[p.pos?esc(p.pos):'',esc(sv)].filter(Boolean).join('&nbsp; &middot; &nbsp;')
    :([p.pos?esc(p.pos):'',p.hometown?esc(p.hometown):'',p.age!=null?'Age '+esc(p.age):''].filter(Boolean).join('&nbsp; &middot; &nbsp;')||'—');
  const num=ppNum(p);
  /* one badge colour per sheet, the same on every position, in the team's own scheme:
     Havoc red with black digits; Pensacola navy blue with white digits */
  const badge=side==='havoc'?{bg:(DATA.settings&&DATA.settings.red)||'#C8102E',fg:'#000'}:{bg:pal.primary,fg:'#fff'};
  /* the note is the study-guide summary written for the call sheet; roster notes are the fallback */
  const note=(typeof PRESEASON_CALL_NOTES!=='undefined'&&PRESEASON_CALL_NOTES[p.name])||p.notes||'';
  /* skip the ECHL segment when the stat line already carries it (Tanner Schachle, Helliwell) */
  const flat=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const echl=p.echlLastSeason&&!flat(p.stats).includes(flat(String(p.echlLastSeason).split('.')[0]))?p.echlLastSeason:'';
  const tags=(p.tags||[]).map(t=>`<span class="pp-tag pp-tag-${esc(t)}">${esc(t)}</span>`).join('');
  return `<div class="cs-card" style="border-color:${edge}">
    <div class="cs-top">
      <span class="cs-num" style="background:${badge.bg};color:${badge.fg}">${esc(num)}</span>
      <span class="cs-name">${esc(last.toUpperCase())}${first?', '+esc(first.toUpperCase()):''}</span>
    </div>
    <div class="cs-vitals">${vitals}${tags?' '+tags:''}</div>
    <div class="cs-stat"><i>2025-26:</i> ${p.stats?esc(p.stats):'<span class="cs-ph">—</span>'}${p.plusMinusPerGP!=null?` &middot; <i>+/- PER GP:</i> ${ppPM(p)}`:''}${echl?` &middot; <i>ECHL LAST SEASON:</i> ${esc(echl)}`:''}</div>
    <div class="cs-note">${esc(note)||'<span class="cs-ph">—</span>'}</div>
  </div>`;
}
function ppCsBox(title,rows){
  return `<div class="cs-sb-box"><div class="cs-sb-h">${esc(title)}</div>`+
    (rows.length?rows.map(r=>'<div class="cs-sb-row">'+esc(r)+'</div>').join(''):'<div class="cs-sb-row cs-dim">—</div>')+'</div>';
}
function ppCallSheet(side){
  const D=ppSrc(),S=DATA.settings,m=D.meta||{},t=ppTeam(side),o=ppData();
  const isHome=side==='havoc';
  const team=t.name||(isHome?'Huntsville Havoc':PP_TEAM);
  const pal=teamPal(team);
  const primary=isHome?(S.red||pal.primary):pal.primary;
  const byNum=(a,b)=>(+ppNum(a)||999)-(+ppNum(b)||999);
  /* full rows at `cols` across; a part-filled last row spreads its cards across the width
     (two forwards at double width, two goalies at half the row), so no space sits empty and
     the wider cards are shorter */
  const grid=(arr,group,cols)=>{
    if(!(arr||[]).length)return '<div class="cs-none">No players in this group.</div>';
    const cards=arr.slice().sort(byNum).map(p=>ppCsCard(p,pal,group,side));
    const full=cards.length-cards.length%cols,rows=[];
    if(full)rows.push(`<div class="cs-grid" style="grid-template-columns:repeat(${cols},minmax(0,1fr))">${cards.slice(0,full).join('')}</div>`);
    if(full<cards.length)rows.push(`<div class="cs-grid${full?' cs-grid-rest':''}" style="grid-template-columns:repeat(${cards.length-full},minmax(0,1fr))">${cards.slice(full).join('')}</div>`);
    return rows.join('');
  };
  const co=t.coaches||[];
  const hc=co.find(c=>/head/i.test(c.role||'')),ac=co.filter(c=>/assist/i.test(c.role||''));
  const coach=[hc?'HEAD COACH: '+hc.name:'',ac.length?'ASST. COACH'+(ac.length>1?'ES':'')+': '+ac.map(c=>c.name).join(', '):''].filter(Boolean).join('  /  ');
  const d=m.date?new Date(m.date+'T00:00').toLocaleDateString('en-US',{weekday:'short',month:'numeric',day:'numeric',year:'2-digit'}):'';
  const game=[(m.gameType||'Preseason').toUpperCase(),d,'Huntsville Havoc vs. '+(m.opponent||PP_TEAM),(o.venue||'').trim()||'Venue: confirm',m.puckDropCT?m.puckDropCT+' CT':''].filter(Boolean).join('  ·  ');
  const abbr=isHome?'HSV':'PEN';
  const pron=(D.pronunciations||[]).filter(x=>x.team===abbr).map(x=>{const say=ppSay(x);return x.name+': '+(say||'ask');});
  const side1=isHome
    ?ppCsBox('ECHL CAMPS',(D.echlCamps||[]).filter(c=>c.sphlTeam==='HSV').map(c=>[c.pos,c.name].filter(Boolean).join(' ')+' — '+(c.echlTeam||'')))
    :ppCsBox('FORMER FLYERS AT ECHL CAMPS',D.formerFlyersAtEchl||[]);
  const sb=`<aside class="cs-side" style="width:124px">
    ${side1}
    ${ppCsBox('PRONUNCIATION',pron)}
    <div class="cs-sb-box pp-lines"><div class="cs-sb-h">LINES</div><div class="cs-write"></div></div>
    <div class="cs-sb-box pp-notes"><div class="cs-sb-h">NOTES</div><div class="cs-write"></div></div>
  </aside>`;
  const F=t.forwards||[],Dd=t.defense||[],G=t.goalies||[];
  return `<div class="page lc-page cs-page pp-cs">
    <div class="cs-head" style="background:${primary};color:${pal.textOn}">
      <div class="cs-h1">${esc(team.toUpperCase())} &mdash; PRESEASON ROSTER</div>
      ${coach?`<div class="cs-h2">${esc(coach)}</div>`:''}
    </div>
    <div class="cs-game">${esc(game)}</div>
    <div class="cs-body">
      <div class="cs-main">
        <div class="cs-sub" style="color:${primary};border-color:${pal.secondary}">Forwards (${F.length})</div>${grid(F,'F',4)}
        <div class="cs-sub" style="color:${primary};border-color:${pal.accent}">Defense (${Dd.length})</div>${grid(Dd,'D',Dd.length>6?4:3)}
        <div class="cs-sub" style="color:${primary};border-color:${pal.goalie}">Goaltenders (${G.length})</div>${grid(G,'G',3)}
      </div>
      ${sb}
    </div>
  </div>`;
}
/* Type size per sheet: each call sheet steps its type up as far as it can while
   still fitting, measured at PRINT size (7.95 x 10.45in, the folders' letter
   page with 0.25in margins — narrower than the 816px preview, so text wraps
   more on paper). --csf scales every font on the sheet, --csl is the notes
   clamp. The Havoc sheet (18 cards) ends up larger than Pensacola's (19). */
/* larger type first, then more note lines: a step is (font scale, note lines) */
/* scale steps with the notes unclamped (every note shows in full); the clamped pairs after them are
   a last resort if a sheet ever carries more than its page holds */
const PP_CS_STEPS=[[1.4,99],[1.35,99],[1.3,99],[1.25,99],[1.2,99],[1.15,99],[1.1,99],[1.05,99],[1,99],[0.95,99],[0.9,99],[0.9,6],[0.9,5],[0.9,4],[0.85,4],[0.85,3]];
function ppCsOverflow(pg){
  const main=pg.querySelector('.cs-main'),aside=pg.querySelector('.cs-side');
  return Math.max(pg.scrollHeight-pg.clientHeight,main?main.scrollHeight-main.clientHeight:0,aside?aside.scrollHeight-aside.clientHeight:0);
}
function ppCsFit(){
  document.querySelectorAll('#preseasonDoc .page.pp-cs').forEach(pg=>{
    if(!pg.offsetWidth)return;                       // hidden panel: leave the defaults
    const keep=[pg.style.width,pg.style.height,pg.style.minHeight];
    pg.style.width='7.95in';pg.style.height='10.45in';pg.style.minHeight='0';   // measure at print size (the screen rule's min-height would hold it at 1056)
    let chosen=PP_CS_STEPS[PP_CS_STEPS.length-1];
    for(const [f,l] of PP_CS_STEPS){
      pg.style.setProperty('--csf',f);pg.style.setProperty('--csl',l);
      if(ppCsOverflow(pg)<=0){chosen=[f,l];break;}
    }
    pg.style.setProperty('--csf',chosen[0]);pg.style.setProperty('--csl',chosen[1]);
    pg.dataset.csf=chosen[0];pg.dataset.csl=chosen[1];
    pg.style.width=keep[0];pg.style.height=keep[1];pg.style.minHeight=keep[2];
  });
}

/* ============================================================
   THE PRINTED PAGES — four letter sheets
   ============================================================ */
function ppPaperRoster(side){
  const t=ppTeam(side);
  const grp=(label,list,isCoach)=>{
    if(!list||!list.length)return '';
    return `<tr class="pp-grp"><td colspan="7">${label}</td></tr>`+list.map(p=>{
      const num=ppDash(ppNum(p));
      const notes=esc(p.notes||'')+(p.confirmNote?` <i>Confirm: ${esc(p.confirmNote)}</i>`:'');
      if(isCoach)return `<tr><td class="r"></td><td><b>${esc(p.name)}</b> ${ppTags(p)}</td><td>${esc(p.role||'')}</td><td colspan="4">${notes}</td></tr>`;
      return `<tr><td class="r">${num}</td><td><b>${esc(p.name)}</b> ${ppTags(p)}</td><td>${ppDash(p.pos)}</td>
        <td>${ppDash(p.hometown)}</td><td>${ppDash(p.stats)}</td><td class="r">${ppPM(p)}</td><td>${notes}</td></tr>`;
    }).join('');
  };
  return `<table class="pk-t pp-pt"><tr><th class="r">#</th><th>Player</th><th>Pos</th><th>Hometown</th><th>2025-26</th><th class="r">+/- per GP</th><th>Notes</th></tr>
    ${grp('Coaches',t.coaches,true)}${grp('Forwards',t.forwards)}${grp('Defense',t.defense)}${grp('Goalies',t.goalies)}</table>`;
}
function ppPaperTable(head,rows){return ppTable('pk-t pp-pt',head,rows||'<tr><td>—</td></tr>');}
function ppBuild(){
  const doc=document.getElementById('preseasonDoc');if(!doc)return;
  const D=ppSrc(),S=DATA.settings,red=S.red||'#C8102E';
  if(!D.meta){
    doc.innerHTML='<div class="page"><div class="box"><h3>Preseason vs Pensacola</h3>'+
      '<div class="b" style="font-size:10px">js/preseason-pen-data.js did not load, so there is nothing to print.</div></div></div>';
    return;
  }
  const st=document.getElementById('ppStatus');
  if(PP_VIEW==='calls'){
    doc.innerHTML=['havoc','pensacola'].map((side,i)=>ppCallSheet(side)
      .replace('<div class="page','<div data-sec="pp:cs'+(i+1)+'" class="hub-preview__page page')).join('');
    if(st)st.textContent='Letter · 2 call sheets · prints to PDF';
    ppCsFit();
    ppFitReport();
    return;
  }
  if(PP_VIEW==='study'){
    const sp=ppStudyPages(red,S);
    doc.innerHTML=sp.map((p,i)=>p
      .replace('<div class="gn-foot"',dataStampHTML('preseason')+'<div class="gn-foot"')
      .replace(/__PGNO__/g,'PAGE '+(i+1)+' of '+sp.length)
      .replace('<div class="page','<div data-sec="pp:sg'+(i+1)+'" class="hub-preview__page page')).join('')
      ||'<div class="page"><div class="box"><h3>Study guide</h3><div class="b" style="font-size:10px">js/preseason-pen-study.js did not load.</div></div></div>';
    if(typeof pgFooterFix==='function')pgFooterFix(doc);
    if(st)st.textContent='Letter · '+sp.length+' page'+(sp.length===1?'':'s')+' · study guide · prints to PDF';
    ppFitReport();
    return;
  }
  const m=D.meta||{},T=D.topScorers||{},tc=D.trophyCase||{};
  const pages=[],gameRows=ppGameRows();

  /* page 1 — game card, storylines, top-10 tables */
  const stories=(D.storylines||[]).map((s,i)=>
    `<div class="news-item"><div class="h">${i+1}. ${esc(s.title||'')}</div><div class="b">${esc(ppStoryText(i))}</div></div>`).join('');
  const top=(side,name)=>{const t=T[side]||{};return `<div class="box"><h3>${name} &mdash; top 10 scorers, who's back</h3>
    ${t.summary?`<div class="pp-fact">${esc(t.summary)}</div>`:''}${ppPaperTable(PP_TOP_HEAD,ppTopRows(side,true))}</div>`;};
  pages.push(pgWrap(red,S,(m.gameType||'PRESEASON').toUpperCase()+' vs. PENSACOLA',`
    <div class="box"><h3>Game information</h3><div class="pp-cols2">
      ${[gameRows.slice(0,3),gameRows.slice(3)].map(half=>`<table class="pk-t pp-pt">${half.map(r=>`<tr><td>${esc(r[0])}</td><td><b>${esc(r[1])}</b></td></tr>`).join('')}</table>`).join('')}
    </div></div>
    <div class="box"><h3>Storylines</h3><div class="pp-stories">${stories}</div></div>
    ${top('havoc','Huntsville Havoc')}${top('pensacola','Pensacola Ice Flyers')}`));

  /* page 2 — ECHL camps, head-to-head and history */
  const former=(D.formerFlyersAtEchl||[]).map(s=>`<li>${esc(s)}</li>`).join('');
  pages.push(pgWrap(red,S,'ECHL CAMPS &middot; HEAD-TO-HEAD',`
    <div class="box"><h3>ECHL camps right now</h3>${ppPaperTable(PP_ECHL_HEAD,ppEchlRows())}
      ${former?`<div class="pp-sub">Former Ice Flyers at ECHL camps</div><ul class="pp-list">${former}</ul>`:''}</div>
    <div class="box"><h3>On Friday's ice with ECHL time last season</h3>${ppPaperTable(PP_ECHL_LAST_HEAD,ppEchlLastRows())}</div>
    <div class="box"><h3>2025-26 head-to-head &mdash; ${ppH2hSummary()}</h3>${ppPaperTable(PP_H2H_HEAD,ppH2hRows())}</div>
    <div class="pp-cols2">
      <div class="box"><h3>Playoff history</h3>${ppPaperTable(PP_PO_HEAD,ppPlayoffRows())}
        <div class="pp-sub">Trophy case</div><div class="pp-fact"><b>Havoc:</b> ${ppDash(tc.havoc)}</div><div class="pp-fact"><b>Ice Flyers:</b> ${ppDash(tc.pensacola)}</div></div>
      <div class="box"><h3>2026-27 meetings</h3>${ppPaperTable(PP_MEET_HEAD,ppMeetingRows(true))}</div>
    </div>
    <div class="box"><h3>Last three seasons</h3>${ppPaperTable(PP_SEASON_HEAD,ppSeasonRows())}</div>`));

  /* page 3 — Havoc roster with coaches and numbers, then the pronunciation flags for both
     teams (the Havoc page has the room; Pensacola's 22-man list fills page 4 on its own) */
  const pron=(D.pronunciations||[]);
  const pronRows=list=>list.map(p=>{const say=ppSay(p);
    return `<tr><td>${ppDash(p.team)}</td><td><b>${esc(p.name)}</b></td><td>${say?esc(say):'<i>ask</i>'}</td></tr>`;}).join('');
  const third=Math.ceil(pron.length/3);   // three-up keeps the flags to a few lines under the roster
  pages.push(pgWrap(red,S,'HAVOC CAMP ROSTER',`
    <div class="box"><h3>Coaches and players</h3>${ppPaperRoster('havoc')}</div>
    <div class="box"><h3>Pronunciation flags &mdash; both teams</h3><div class="pp-cols3">
      ${ppPaperTable(['Team','Name','Say it'],pronRows(pron.slice(0,third)))}
      ${ppPaperTable(['Team','Name','Say it'],pronRows(pron.slice(third,2*third)))}
      ${ppPaperTable(['Team','Name','Say it'],pronRows(pron.slice(2*third)))}</div></div>`));

  /* page 4 — Pensacola roster */
  pages.push(pgWrap(red,S,'PENSACOLA CAMP ROSTER',`
    <div class="box"><h3>Coaches and players</h3>${ppPaperRoster('pensacola')}</div>`));

  pages.push(...ppStudyPages(red,S));   // the study guide is the back half of the packet
  if(st)st.textContent='Letter · '+pages.length+' pages · prints to PDF';
  const stamp=dataStampHTML('preseason');
  doc.innerHTML=pages.map((p,i)=>p
    .replace('<div class="gn-foot"',stamp+'<div class="gn-foot"')
    .replace(/__PGNO__/g,'PAGE '+(i+1)+' of '+pages.length)
    .replace('<div class="page','<div data-sec="pp:p'+(i+1)+'" class="hub-preview__page page')).join('');
  if(typeof pgFooterFix==='function')pgFooterFix(doc);
  ppFitReport();
}
/* The shared auto-fit (secApplyAll/fitActiveAuto) only looks inside the Print
   Center, and a .page clips silently on paper. So this doc measures itself and
   says so above the preview — the folders' fdFitReport, without the zoom layer. */
function ppFitReport(){
  const el=document.getElementById('ppFit');if(!el)return;
  const run=()=>{
    const pages=[...document.querySelectorAll('#preseasonDoc .page')];
    if(!pages.length||!pages[0].offsetHeight){el.textContent='';el.className='';return;}  // panel hidden: nothing to measure
    let worst=0,who=0;
    pages.forEach((p,i)=>{const over=p.classList.contains('pp-cs')?ppCsOverflow(p):Math.max(p.offsetHeight-1056,p.scrollHeight-p.clientHeight);if(over>worst){worst=over;who=i+1;}});
    if(worst<=2){el.className='fd-fit ok';el.textContent='Fits on '+pages.length+(PP_VIEW==='calls'?' call sheet':' page')+(pages.length===1?'':'s')+' ✓';}
    else{el.className='fd-fit bad';el.textContent='Page '+who+' overflows by ~'+(worst/96).toFixed(1)+' in — it will be cut off in print';}
  };
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(run); else run();
}
function ppPrint(){
  ppBuild();
  const panel=document.getElementById('panel-preseason');
  panel.classList.add('printing');
  /* the call sheets are lc-pages, sized 7.95 x 10.45in for letter with 0.25in margins
     (the rule printDoc('folders') uses); the packet pages are full-bleed 8.5 x 11 */
  let st=null;
  if(PP_VIEW==='calls'){st=document.createElement('style');st.id='ppPrintPage';st.textContent='@page{size:letter portrait;margin:0.25in;}';document.head.appendChild(st);}
  setTimeout(()=>{window.print();panel.classList.remove('printing');if(st)st.remove();},150);
}

/* ============================================================
   RENDER / LOAD / ARCHIVE
   ============================================================ */
function ppRender(){
  if(!document.getElementById('panel-preseason'))return;
  ppLoad();
  ppRenderGame();ppRenderStories();ppRenderTop();ppRenderEchl();ppRenderH2h();
  ppRenderRosters();ppRenderSignings();ppRenderPron();ppRenderChecks();ppRenderSources();
  ppRenderNotOnList();ppRenderBench();ppRenderBooth();
  ppBuild();
}
/* form fields from the store — also runs from initForms(), so a Restore
   refreshes the venue and the archive fields along with every other form */
function ppLoad(){
  const o=ppData();
  setv('pp_venue',o.venue);
  setv('pp_result_score',o.result.score);setv('pp_result_scorers',o.result.scorers);setv('pp_result_notes',o.result.notes);
  const b=document.getElementById('tab_preseason');if(b)b.style.display=o.archived?'none':'';
}
function ppArchiveStart(){
  const c=document.getElementById('ppArchiveCard');if(!c)return;
  c.style.display='';
  c.scrollIntoView({behavior:'smooth',block:'start'});
  const f=document.getElementById('pp_result_score');if(f)f.focus();
}
function ppArchive(){
  const o=ppData();
  o.result={score:val('pp_result_score').trim(),scorers:val('pp_result_scorers').trim(),
            notes:((document.getElementById('pp_result_notes')||{}).value||'').trim()};
  if(!o.result.score&&!confirm('No final score entered.\n\nArchive anyway?'))return;
  if(!confirm('Archive the preseason tab?\n\nEverything — jersey numbers, storyline edits, pronunciations, the checklists and the result — stays saved as the permanent record, and the tab leaves the nav.'))return;
  o.archived=true;o.archivedAt=new Date().toISOString();
  save();
  const btn=document.getElementById('tab_preseason');if(btn)btn.style.display='none';
  showTab('game');
  toast('Preseason archived — the record lives on under DATA.preseasonPen');
}
