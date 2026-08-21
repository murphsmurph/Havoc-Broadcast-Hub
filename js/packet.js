/* Packet — everything that composes a printed page: the game-notes cover and
   scouting report, the lineup chart, broadcast verbiage and the ice map, the
   folder call sheets and data pages, the dense game sheet, the packet section
   picker and renderPacket itself, plus the match-up panel and game log those
   pages derive from. Extracted verbatim in the P3 split; js/print.js decides how
   these fit on paper, this file decides what is on them. */

/* ============ GAME NOTES RENDER ============ */
function loadNotesForm(){const n=DATA.notes;['h1','b1','h2','b2','h3','b3'].forEach(k=>{if(n[k]!==undefined)setv('n_'+k,n[k]);});}
function renderNotes(){
  DATA.notes={h1:val('n_h1'),b1:val('n_b1'),h2:val('n_h2'),b2:val('n_b2'),h3:val('n_h3'),b3:val('n_b3')};save();
  const S=DATA.settings,G=DATA.game,R=DATA.report,red=S.red||'#C8102E';
  const oppShort=(G.opp||'').replace(/Huntsville Havoc/,''),oppCity=teamCity(G.opp),oppAbbr=teamAbbrOf(G.opp)||'OPP';
  let standRows = R.standings.length ? R.standings.map(s=>{const me=/Huntsville/.test(s.team);return `<tr class="${me?'me':''}"><td>${s.team}</td><td class="r">${s.w}</td><td class="r">${s.l}</td><td class="r">${s.otl}</td><td class="r">${s.pts}</td></tr>`;}).join('') : emptyRow(5,'No standings yet','run a Game Day Refresh on Live Data');
  const hsv=findTeamStats('Huntsville');
  const leadersHtml=leadersBlock(hsv);
  const sp=R.special||{},hsvSp=sp['Huntsville']||{},oppSp=sp[oppCity]||{};
  const mrow=(stat,h,o)=>`<tr><td>${h||'—'}</td><td class="stat">${stat}</td><td>${o||'—'}</td></tr>`;
  const news=[[DATA.notes.h1,DATA.notes.b1],[DATA.notes.h2,DATA.notes.b2],[DATA.notes.h3,DATA.notes.b3]].filter(x=>x[0]||x[1]).map(x=>`<div class="news-item"><div class="h">${esc(x[0]||'')}</div><div class="b">${esc(x[1]||'')}</div></div>`).join('')||'<div class="b" style="color:var(--ink-2)">Add news headlines above.</div>';
  const dateStr=G.date?new Date(G.date+'T00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'}):'DATE';
  const timeStr=G.time?formatTime(G.time):'7:05 P.M.';
  // h2h
  const h2h=SPHL_REF.hsvVs[G.opp];
  const h2hHtml=h2h?`<div class="h2h"><div class="ln"><span>Reg. season</span><span>${h2h.rs}</span></div><div class="ln"><span>Playoffs</span><span>${h2h.po}</span></div></div>`:'<div class="h2h" style="color:var(--ink-2)">Select opponent</div>';
  // cups banner (Havoc)
  const cups=SPHL_REF.cups["Huntsville Havoc"]||[];
  const cupBanner=cups.length?`<div class="cupbanner">${cups.map(y=>`<span class="c">${y} CUP</span>`).join('')}</div>`:'';
  // franchise leaders mini
  const FR=recBook();
  const frecHtml=`<div class="frec"><div class="col"><h4>All-Time Leaders</h4>${FR.career.slice(0,5).map(r=>`<div class="rr"><span>${r[0]}</span><span>${r[1].split(' — ')[1]||r[1]}</span></div>`).join('')}</div><div class="col"><h4>Single-Season</h4>${FR.players.slice(0,4).map(r=>`<div class="rr"><span>${r[0].replace(', season','')}</span><span>${(r[1].split(' — ')[1]||'').split(' (')[0]}</span></div>`).join('')}</div></div>`;
  // opponent coach
  const oc=getCoach(G.opp);
  const coachHtml=oc.name?`<div class="news-item"><div class="h">${esc(oppShort.toUpperCase())} HEAD COACH — ${esc(oc.name)}</div><div class="b">${esc(oc.bio||'')}</div></div>`:'';

  const doc=`<div class="page" style="--havoc-red:${red}">
    <div class="gn-top">
      <div class="gn-logo">${logoHTML("Huntsville Havoc",'','H')}</div>
      <div class="gn-title">
        <div class="city">${esc(S.city)}</div><div class="team">${esc(S.name)}</div>
        <div class="gn-bar"><span>SPHL MEMBER SINCE 2004</span><span class="red">${cups.length} PRESIDENTS CUPS</span><span>HUNTSVILLEHAVOC.COM</span></div>
      </div>
    </div>
    <div class="gn-matchup">
      <div class="gn-game-meta">
        <div class="gname">GAME ${esc(G.gameno||'—')}</div>
        <div class="promo">${esc(G.promo||'')}</div>
        <div>${dateStr}</div><div>PUCK DROP: ${timeStr}</div>
        <div>${esc(G.venue||S.venue)}</div><div>${esc(G.broadcast||'')}</div>
      </div>
      <div class="gn-vs">
        <div class="tn" style="color:${red}">${esc(S.city)}<br>${esc(S.name)}</div>
        <div class="rec">(${esc(G.hsvrec||'—')})</div>
        ${cupBanner}
        <div class="versus">${G.homeaway==='@'?'@':'vs.'}</div>
        <div class="tn">${esc((oppShort||'OPPONENT').toUpperCase())}</div>
        <div class="rec">(${esc(G.opprec||'—')})</div>
      </div>
      <div class="gn-oppbox"><div class="gn-opp-logo">${logoHTML(G.opp,'',oppAbbr)}</div></div>
    </div>
    <div class="gn-cols">
      <div>
        <div class="box"><h3>Havoc News &amp; Notes</h3>${news}</div>
        <div class="box"><h3>Series History — Havoc vs. ${esc(oppShort||'Opp')}</h3>${h2hHtml}</div>
      </div>
      <div>
        <div class="box"><h3>SPHL Standings</h3><table class="standings"><thead><tr><th>Team</th><th class="r">W</th><th class="r">L</th><th class="r">OTL</th><th class="r">PTS</th></tr></thead><tbody>${standRows}</tbody></table></div>
        <div class="box matchbox"><h3>Matching Up</h3><table><tr class="hdr"><td>${esc(S.name)}</td><td></td><td>${esc((oppShort||'OPP').toUpperCase())}</td></tr>${mrow('PP%',hsvSp.pp,oppSp.pp)}${mrow('PK%',hsvSp.pk,oppSp.pk)}</table></div>
      </div>
    </div>
    <div class="box"><h3>Havoc Statistical Leaders</h3>${leadersHtml}</div>
    <div class="gn-cols">
      <div class="box"><h3>Havoc Franchise Leaders</h3>${frecHtml}</div>
      <div class="box"><h3>Opponent Bench</h3>${coachHtml||'<div style="color:var(--ink-2);font-size:9.5px">Add coach in League Reference.</div>'}</div>
    </div>
    <div class="gn-foot"><span>${esc(S.social)}</span><span>${esc(S.footer)}</span><span>PAGE 1</span></div>
  </div>`;
  document.getElementById('notesDoc').innerHTML=doc;
}
function leadersBlock(team){
  if(!team)return '<div class="empty-cell" style="font-size:10px">No 2026-27 stats published yet — leaders fill in after the first games. Run a Game Day Refresh on Live Data.</div>';
  const top=(key)=>[...team.players].sort((a,b)=>b[key]-a[key]).slice(0,5);
  const col=(title,arr,key)=>`<div class="lead-col"><h4>${title}</h4>`+arr.map(p=>`<div class="lr"><span class="nm">${esc(p.name)}</span><span class="vl">${p[key]}</span></div>`).join('')+`</div>`;
  return `<div class="leaders-grid">${col('G',top('g'),'g')}${col('A',top('a'),'a')}${col('PTS',top('pts'),'pts')}${col('+/-',top('pm'),'pm')}</div>`;
}
function findTeamStats(cityKeyword){const ts=DATA.report.teamStats||{};for(const k of Object.keys(ts))if(new RegExp(cityKeyword,'i').test(k))return ts[k];return null;}

/* ---- current-season stat line beside every player name ----
   Skater: "12G 8A 20P" · Goalie: ".923 SV% 2.36 GAA 12W".
   An em-dash when nothing is published for the player — a fabricated
   "0G 0A 0P" reads as a real stat line and can't be told from a failed sync.
   A hand-entered p.statOverride wins over synced data and shows a * marker. */
function statTeamKeyword(side){
  if(side==='away'){const t=val('oppRosterTeam')||DATA.game.opp||'';return teamCity(t)||'zzz-none';}
  return 'Huntsville';
}
function statLineFor(p,teamKeyword){
  if(p.statOverride&&String(p.statOverride).trim())return {text:String(p.statOverride).trim(),manual:true};
  const stats=teamKeyword?findTeamStats(teamKeyword):null;
  if(p.pos==='G'){
    const g=stats?(stats.goalies||[]).find(x=>String(x.num)===String(p.num)||norm(x.name)===norm(p.name)):null;
    if(!g)return {text:'—',manual:false};   // nothing published for him — never fabricate .000
    let sv=parseFloat(g.svpct);if(!isFinite(sv)||sv<0)sv=0;if(sv>1)sv/=100;
    let gaa=parseFloat(g.gaa);if(!isFinite(gaa)||gaa<0)gaa=0;
    const w=(g.w!=null&&g.w!=='')?g.w:0;
    return {text:'.'+String(Math.round(sv*1000)).padStart(3,'0')+' SV% '+gaa.toFixed(2)+' GAA '+w+'W',manual:false};
  }
  const list=stats?(stats.players||[]):[];
  const st=list.find(x=>String(x.num)===String(p.num))||list.find(x=>norm(x.name)===norm(p.name));
  if(!st)return {text:'—',manual:false};    // nothing published for him — never fabricate zeros
  return {text:((+st.g)||0)+'G '+((+st.a)||0)+'A '+((+st.pts)||0)+'P',manual:false};
}
function statSpan(p,teamKeyword){
  const r=statLineFor(p,teamKeyword);
  return '<span class="pstat" style="color:'+(DATA.settings.red||'#C8102E')+'">'+esc(r.text)+(r.manual?'<b class="pstat-mark" title="manual override">*</b>':'')+'</span>';
}
function statEdit(side,id){
  const p=getRoster(side).find(x=>x.id===id);if(!p)return;
  const cur=statLineFor(p,statTeamKeyword(side)).text;
  const nv=prompt('Stat line for '+p.name+' (blank = use synced data):',p.statOverride||cur);
  if(nv===null)return;
  p.statOverride=nv.trim();save();
  side==='home'?renderRoster():renderOppRoster();
  toast(p.statOverride?'Manual stat line saved':'Back to synced stats');
}
function statRevert(side,id){
  const p=getRoster(side).find(x=>x.id===id);if(!p)return;
  p.statOverride='';save();
  side==='home'?renderRoster():renderOppRoster();
  toast('Back to synced stats');
}

/* ============ LINEUP CHART (Image-1 dense style, per-team themed) ============ */
/* Broadcast bio for lineup chart & game sheet: the player's hand-written
   broadcast bio (bbio), at most 2 short lines. Falls back to the first
   lines of the media bio only so older saved data still shows something. */
function chartBio(p){
  // authored broadcast_bio from data/bios.json first, then the hand-typed
  // bbio, then the media bio — oldest fallback last
  const src=bioLine((biosFor(p)||{}).broadcast_bio)||p.bbio||p.notes||'';
  const lines=String(src).split('\n').map(s=>s.replace(/^[•\-\s]+/,'').trim()).filter(Boolean);
  return lines.slice(0,2).map(t=>t.length>92?t.slice(0,89).replace(/\s+\S*$/,'')+'…':t);
}
function renderChart(){
  const S=DATA.settings,G=DATA.game;
  const both=val('chartSides')==='both';
  const hsvTheme=teamTheme("Huntsville Havoc");
  const red=S.red||hsvTheme.primary;
  // one letter-landscape page per team
  const pages=[`<div class="page lc-page" data-sec="chart:hsv">${teamChartHTML("Huntsville Havoc",'Huntsville',DATA.roster,S.city+' '+S.name,G.hsvrec,{primary:red,secondary:hsvTheme.secondary},true,G)}</div>`];
  if(both&&G.opp){
    const list=DATA.oppRosters[G.opp]||[];
    pages.push(`<div class="page lc-page" data-sec="chart:opp">${teamChartHTML(G.opp,teamCity(G.opp),list,G.opp.toUpperCase(),G.opprec,teamTheme(G.opp),false,{})}</div>`);
  }
  const cstamp=dataStampHTML('chart');
  document.getElementById('chartDoc').innerHTML=pages.map(p=>p.replace(/<\/div>$/,cstamp+'</div>')).join('');
  secApplyAll();
}
function teamChartHTML(teamFull,cityKeyword,list,title,rec,theme,isHome,G){
  const primary=theme.primary,secondary=theme.secondary||'#111';
  const stats=findTeamStats(cityKeyword);
  const statByNum={},statByName={};
  if(stats)stats.players.forEach(p=>{statByNum[p.num]=p;statByName[norm(p.name)]=p;});
  // always numerical order: forwards by number, then defense by number, then goalies
  const byNum=(a,b)=>(+a.num||999)-(+b.num||999);
  const active=list.filter(p=>p.active!=='0');
  const forwards=active.filter(p=>p.pos!=='G'&&p.pos!=='D').sort(byNum);
  const defense=active.filter(p=>p.pos==='D').sort(byNum);
  const goalies=active.filter(p=>p.pos==='G').sort(byNum);
  const logo=teamLogoSrc(teamFull);

  const scopeLbl=esc((statsScopeLabel()||'SEASON').toUpperCase());
  const card=(p)=>{
    let season='';
    if(p.pos==='G'){
      const g=stats?stats.goalies.find(x=>x.num===p.num||norm(x.name)===norm(p.name)):null;
      if(g)season=`<b>${scopeLbl}:</b> ${g.gaa} GAA · ${g.svpct} SV% · ${g.w}-${g.l}-${g.otl}${g.so?' · '+g.so+' SO':''}`;
    }else{
      const st=statByNum[p.num]||statByName[norm(p.name)];
      if(st)season=`<b>${scopeLbl}:</b> ${st.g}-${st.a}-${st.pts} · ${st.pm>=0?'+':''}${st.pm} · ${st.pim} PIM${st.shots!=null?' · '+st.shots+' SH':''}`;
    }
    const notes=chartBio(p).map(n=>'• '+esc(n)).join('<br>');
    // last name first (bigger), then first name — captain letter follows the first name
    const parts=(p.name||'').trim().split(/\s+/);
    let first='',last='';
    if(parts.length>1){last=parts.pop();first=parts.join(' ');}else last=parts[0]||'';
    const letter=p.capt==='C'?' (C)':p.capt==='A'?' (A)':'';
    const inner=`
      <div class="lcx-ph" style="background:${secondary}">
        <span class="lcx-num" style="color:#fff">${p.num||''}</span>
        <span class="lcx-last" style="color:#fff">${esc(last.toUpperCase())}</span>
        <span class="lcx-first" style="color:#fff">${esc(first.toUpperCase())}${letter}</span>
        ${statSpan(p,cityKeyword)}
      </div>
      <div class="lcx-meta">${p.pos} · ${p.ht||'—'} · ${p.wt||'—'} · ${p.pos==='G'?'G':'Sh'} ${p.sh||'—'}${p.age?' · '+p.age+'y':''} · ${esc(p.birth||'')}</div>
      ${season?`<div class="lcx-stat" style="color:${primary}">${season}</div>`:''}
      ${notes?`<div class="lcx-notes">${notes}</div>`:''}`;
    return `<div class="lcx-card" style="border-color:${secondary}">${inner}</div>`;
  };

  // IR / ECHL / scratches moved to the packet's Quick Facts page — the chart
  // uses the full width so every player fits
  const side='';

  const header=`<div class="lcx-head" style="background:${primary}">
    ${logo?`<div class="lcx-logo"><img src="${logo}"></div>`:''}
    <div class="lcx-title">${esc(title)} ${rec?'('+esc(rec)+')':''}</div>
  </div>`;

  if(!active.length)return header+'<div class="empty">No active players on this roster — apply the 2026-27 signed sheet on the Rosters tab, or add players by hand.</div>';
  // each section grows in proportion to its row count so cards fill the page to the bottom
  const grid=(arr)=>`<div class="lcx-grid" style="flex:${Math.max(1,Math.ceil(arr.length/3))}">${arr.map(card).join('')}</div>`;
  return `${header}
    <div class="lcx-body">
      <div class="lcx-main">
        <div class="lcx-sub" style="color:${primary};border-color:${primary}">Forwards</div>
        ${grid(forwards)}
        ${defense.length?`<div class="lcx-sub" style="color:${primary};border-color:${primary}">Defense</div>${grid(defense)}`:''}
        ${goalies.length?`<div class="lcx-sub" style="color:${primary};border-color:${primary}">Goaltenders</div>${grid(goalies)}`:''}
      </div>
      ${side}
    </div>`;
}


/* ============ BROADCAST VERBIAGE & ICE MAP ============ */
const VERBS_DEFAULT={
 p1:"angled, banked, blasted, blocked, bounce, brought, brushed, carried, chipped, chopped, cleared, closed, collared, come (up), controlled, curled, cut, dealt, deflected, directed, dished, dropped, drubs, dubbed, dumped, fed, feeds, finessed, fires, flagged, flew, flipped, floats, flopped, forced, forwarded, gathering, gives, gloved, got, grabbed, guides, handle, hands, held, hopped, intercepted, kicked, knifed, knocks, lays, leads, lifted, lobbed, looked, lugged, muscled, nudges, one-handed, played, poked, popped, punched, pushed, rattled, regathered, ricocheted, rifled, sealed, sent, shooting, slipped, slug, spiked, spirited, spun, squibbed, start, steers, struck, swatted, swirl, taken, tangled, threaded, threw, tipped, touches, trickles, turned, twisted, went, whistled, yanks",
 p2:"backchecked, backhands, battled, dragged, fanned, filtered, go, jabbed, jam, ladled, moving, one-timed, outletted, picked (up), pitched, pitchforked, rag, rescues, settled, shakes, shoveled, shuffling, skittered, snagged, speared, stashed, stifled, stopped, swing, tap, trapped, wedged, whacked, whipped",
 p3:"answered, careens, caromed, center, charged, connected, drove, forced, galloped (at), kept, lost, misfired, nubbed, putting, retrieves, rolled, shaken, shuffleboards, skipped, skying, slowed, soccered, sparred (for), stolen, worked"
};
function vbData(){
  const v=DATA.verbs;
  return (v&&v.p1)?v:{...VERBS_DEFAULT};
}
function vbList(t){return String(t||'').split(/[,\n]/).map(x=>x.trim()).filter(Boolean);}
function vbLoad(){
  const v=vbData();
  setv('vb_p1',v.p1);setv('vb_p2',v.p2);setv('vb_p3',v.p3);
}
function vbSave(){
  DATA.verbs={p1:val('vb_p1'),p2:val('vb_p2'),p3:val('vb_p3')};
  save();renderVerbiage();
}
function vbReset(){
  if(!confirm('Reset the verb lists to the original #EmrickVerbs set? Your additions will be lost.'))return;
  DATA.verbs=null;save();vbLoad();renderVerbiage();toast('Back to the Emrick list');
}
function verbsPage(red,S){
  const v=vbData();
  const col=(title,words)=>`<div class="vb-col"><div class="vb-h" style="color:${red};border-color:${red}">${title}</div><div class="vb-list">${words.map(w=>`<span>${esc(w)}</span>`).join('')}</div></div>`;
  return pgWrap(red,S,'DOC EMRICK&rsquo;S PUCK VERBS',`
    <div class="vb-credit">compiled by @bmitchelf · edit the lists on Print Center → Verbiage &amp; Ice Map</div>
    <div class="vb-grid">
      ${col('First period (puck only)',vbList(v.p1))}
      ${col('Second period additions',vbList(v.p2))}
      ${col('Third period',vbList(v.p3))}
    </div>`).replace('<div class="page"','<div class="page vb-page"');
}
/* ---- SVG rink, drawn per attacking direction, from the booth's point of view
   (booth = bottom of the diagram, so NEAR side is the bottom boards) ---- */
function rinkSVG(dir,red){
  const attackRight=dir==='right';
  const W=760,H=330,X=30,Y=24,RW=700,RH=282,RX=86; // boards
  const gl1=X+34,gl2=X+RW-34;           // goal lines
  const bl1=X+RW*0.375,bl2=X+RW*0.625;  // blue lines
  const cx=X+RW/2,cy=Y+RH/2;
  const dotY1=Y+RH*0.26,dotY2=Y+RH*0.74;
  const fo1=X+RW*0.155,fo2=X+RW*0.845;  // zone faceoff dot x
  const nzd1=bl1+22,nzd2=bl2-22;        // neutral-zone dots
  const L=[];
  const line=(x1,y1,x2,y2,st,w,dash)=>L.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${st}" stroke-width="${w}"${dash?` stroke-dasharray="${dash}"`:''}/>`);
  const circ=(x,y,r,st,w,fill)=>L.push(`<circle cx="${x}" cy="${y}" r="${r}" stroke="${st}" stroke-width="${w}" fill="${fill||'none'}"/>`);
  const dot=(x,y)=>circ(x,y,3.2,'none',0,'#c33');
  // boards + below-goal-line shading (both ends)
  L.push(`<rect x="${X}" y="${Y}" width="${RW}" height="${RH}" rx="${RX}" fill="#fdfdfe" stroke="#333" stroke-width="2.5"/>`);
  L.push(`<path d="M ${gl1} ${Y+6} A ${RX-8} ${RX-8} 0 0 0 ${X+4} ${Y+RX} L ${X+4} ${Y+RH-RX} A ${RX-8} ${RX-8} 0 0 0 ${gl1} ${Y+RH-6} Z" fill="#f1f3f6" stroke="none"/>`);
  L.push(`<path d="M ${gl2} ${Y+6} A ${RX-8} ${RX-8} 0 0 1 ${X+RW-4} ${Y+RX} L ${X+RW-4} ${Y+RH-RX} A ${RX-8} ${RX-8} 0 0 1 ${gl2} ${Y+RH-6} Z" fill="#f1f3f6" stroke="none"/>`);
  // lines
  line(cx,Y+2,cx,Y+RH-2,'#c33',5);
  line(bl1,Y+2,bl1,Y+RH-2,'#2456a4',5);line(bl2,Y+2,bl2,Y+RH-2,'#2456a4',5);
  line(gl1,Y+7,gl1,Y+RH-7,'#c33',2);line(gl2,Y+7,gl2,Y+RH-7,'#c33',2);
  // center circle + dot, zone circles + dots + hash marks, nz dots
  circ(cx,cy,40,'#2456a4',1.6);dot(cx,cy);
  [[fo1,dotY1],[fo1,dotY2],[fo2,dotY1],[fo2,dotY2]].forEach(([x,y])=>{
    circ(x,y,34,'#c33',1.6);dot(x,y);
    [-1,1].forEach(sx=>[-1,1].forEach(sy=>line(x+sx*10,y+sy*34,x+sx*10,y+sy*40,'#c33',1.6)));
  });
  dot(nzd1,dotY1);dot(nzd1,dotY2);dot(nzd2,dotY1);dot(nzd2,dotY2);
  // creases, nets, trapezoids
  [[gl1,1],[gl2,-1]].forEach(([g,sgn])=>{
    L.push(`<path d="M ${g} ${cy-22} A 22 22 0 0 ${sgn>0?1:0} ${g} ${cy+22} Z" fill="#cfe3f5" stroke="#2456a4" stroke-width="1.5"/>`);
    L.push(`<rect x="${sgn>0?g-13:g}" y="${cy-16}" width="13" height="32" fill="none" stroke="#666" stroke-width="1.8"/>`);
    line(g,cy-34,sgn>0?X+10:X+RW-10,cy-64,'#c33',1.4);
    line(g,cy+34,sgn>0?X+10:X+RW-10,cy+64,'#c33',1.4);
  });
  // direction arrow along the top, inside the rink
  const ay=Y-9;
  const ax1=attackRight?cx-70:cx+70,ax2=attackRight?cx+70:cx-70;
  L.push(`<line x1="${ax1}" y1="${ay}" x2="${ax2}" y2="${ay}" stroke="${red}" stroke-width="3.5"/>`);
  L.push(`<path d="M ${ax2} ${ay} l ${attackRight?-10:10} -5 l 0 10 Z" fill="${red}"/>`);
  // ---- labels ----
  const oz=attackRight?{gl:gl2,fo:fo2,bl:bl2,end:X+RW,pt:bl2-14}:{gl:gl1,fo:fo1,bl:bl1,end:X,pt:bl1+14};
  const dz=attackRight?{gl:gl1,fo:fo1,bl:bl1}:{gl:gl2,fo:fo2,bl:bl2};
  const lab=(x,y,text,cls,ax,ay2,anchor)=>{
    if(ax!=null){const yEnd=ay2>y?y+4:y-10; // stop the callout just shy of the text
      L.push(`<line x1="${ax}" y1="${ay2}" x2="${x}" y2="${yEnd}" stroke="#999" stroke-width="0.9"/>`);}
    L.push(`<text x="${x}" y="${y}" class="${cls}"${anchor?` text-anchor="${anchor}"`:''}>${text}</text>`);
  };
  // primary: wings + points + slot + D sides. Attacking RIGHT → LW works the FAR (top) boards; attacking LEFT → LW is NEAR (bottom).
  const lwY=attackRight?dotY1-44:dotY2+52,rwY=attackRight?dotY2+52:dotY1-44;
  lab(oz.fo,lwY,'LW SIDE','rk-big',null,null,'middle');
  lab(oz.fo,rwY,'RW SIDE','rk-big',null,null,'middle');
  const ptX=attackRight?oz.pt:(oz.bl-10),ptA=attackRight?'start':'end';
  lab(ptX,attackRight?dotY1-6:dotY2+12,'LEFT POINT','rk-med',null,null,ptA);
  lab(ptX,attackRight?dotY2+12:dotY1-6,'RIGHT POINT','rk-med',null,null,ptA);
  lab((oz.gl+oz.bl)/2,cy+4,'SLOT','rk-big',null,null,'middle');
  lab(dz.fo,attackRight?dotY1-44:dotY2+52,attackRight?'LD SIDE':'LD SIDE','rk-med2',null,null,'middle');
  lab(dz.fo,attackRight?dotY2+52:dotY1-44,'RD SIDE','rk-med2',null,null,'middle');
  lab(cx,Y+RH+16,'NEUTRAL ZONE','rk-med2',null,null,'middle');
  // near/far side along bottom/top (booth POV)
  lab(cx,Y+RH-8,'NEAR SIDE (booth)','rk-small',null,null,'middle');
  lab(cx,Y+14,'FAR SIDE','rk-small',null,null,'middle');
  if(dir==='right'){
    // Diagram A extra layer: BOARDS & LINES
    lab(W-4,cy-60,'END BOARDS','rk-small',oz.end-6,cy-40,'end');
    lab(W-140,12,'CORNER BOARDS','rk-small',oz.end-26,Y+46,'middle');
    lab(X+150,Y+RH+16,'SIDE BOARDS / "THE WALL"','rk-small',X+170,Y+RH-2,'middle');
    lab(oz.bl+42,Y+RH+16,'HALF WALL','rk-small',(oz.gl+oz.bl)/2,Y+RH-6,'middle');
    lab(oz.bl,Y-12,'BLUE LINE','rk-small',null,null,'middle');
    lab(cx+34,Y+RH+30,'CENTER (RED) LINE','rk-small',cx,Y+RH-30,'middle');
    lab(oz.gl-46,Y+RH+16,'GOAL LINE','rk-small',oz.gl,Y+RH-12,'middle');
    lab(X+40,Y-12,'BELOW THE GOAL LINE (shaded)','rk-small',X+18,Y+50,'start');
    lab(X+4,cy+80,'TRAPEZOID','rk-small',X+26,cy+52,'start');
  }else{
    // Diagram B extra layer: ZONES & AREAS
    const mid=(oz.gl+oz.bl)/2;
    lab(mid,cy-34,'HIGH SLOT','rk-small',null,null,'middle');
    lab(mid,cy+42,'LOW SLOT','rk-small',null,null,'middle');
    lab(oz.fo+96,cy-58,'"THE HOUSE"','rk-small',oz.gl+44,cy-18,'start');
    lab(X+4,Y+RH+16,'BEHIND THE NET / "GRETZKY’S OFFICE"','rk-small',oz.gl-14,cy+38,'start');
    lab(X+130,Y-12,'CREASE / "THE PAINT"','rk-small',oz.gl+6,cy-24,'start');
    lab(oz.fo+70,dotY1-52,'TOP OF THE CIRCLES','rk-small',oz.fo+26,dotY1-26,'start');
    lab(X+4,dotY2+14,'HASH MARKS','rk-small',oz.fo-14,dotY2+30,'start');
    lab(cx,cy-48,'CENTER ICE','rk-small',null,null,'middle');
    lab(nzd1+18,dotY2+28,'"THE DOT(S)"','rk-small',nzd1+2,dotY2+8,'middle');
    lab(X+40,Y-12,'TRAPEZOID','rk-small',X+22,Y+56,'start');
  }
  return `<svg viewBox="0 -14 ${W} ${H+52}" class="rk-svg">${L.join('')}</svg>`;
}
function iceMapPage(red,S){
  const hdr=(txt,arrow)=>`<div class="rk-hdr" style="color:${red}">${txt} ${arrow}</div>`;
  return pgWrap(red,S,'ICE MAP — BROADCAST GEOGRAPHY',`
    <div class="rk-note">Booth point of view: you are at the bottom — the near boards. Wings swap sides with the attack: going RIGHT the left winger works the far boards; going LEFT he’s on the near boards.</div>
    ${hdr('DIAGRAM A · HAVOC ATTACKING LEFT &rarr; RIGHT','')}${rinkSVG('right',red)}
    ${hdr('DIAGRAM B · HAVOC ATTACKING RIGHT &rarr; LEFT','')}${rinkSVG('left',red)}
  `).replace('<div class="page"','<div class="page rk-page"');
}
function renderVerbiage(){
  const doc=document.getElementById('verbiageDoc');if(!doc)return;
  const S=DATA.settings,red=S.red||'#C8102E';
  doc.innerHTML=(verbsPage(red,S)+iceMapPage(red,S)).replace(/__PGNO__/g,'REFERENCE');
  stampMissing('verbiageDoc','verbs');
  const vps=doc.querySelectorAll('.page');
  if(vps[0])vps[0].dataset.sec='vb:verbs';
  if(vps[1])vps[1].dataset.sec='vb:map';
  secApplyAll();
}

/* ============ BROADCAST FOLDERS (booth pages) ============ */
let FD_FILTER=null;
function fdOv(team){DATA.folderOv=DATA.folderOv||{};return DATA.folderOv[team]=DATA.folderOv[team]||{};}
/* value cell: hand override > computed > "—" (Havoc) / write-in line (opponent) */
function fdCell(team,key,computed,isOpp){
  const ov=fdOv(team)[key];
  const hasOv=ov!=null&&String(ov).trim()!=='';
  const hasSrc=computed!=null&&computed!=='';
  let inner;
  if(hasOv)inner=esc(ov);
  else if(hasSrc)inner=esc(String(computed));
  else inner=isOpp?'<span class="fd-blank"></span>':'—';
  // marker + revert only when a synced source exists — sourceless fields are plain manual entry
  const mark=hasOv&&hasSrc?`<b class="ov-mark" title="manual override — synced: ${esc(String(computed))}">•</b><button class="fv-rv no-print" title="Revert to synced" onclick="fdRevert('${esc(team)}','${esc(key)}')">↺</button>`:'';
  return `<span class="fv" contenteditable="true" spellcheck="false" data-t="${esc(team)}" data-k="${esc(key)}">${inner}</span>${mark}`;
}
/* one line off the club's notes when you haven't written your own — the booth
   card is a fixed sheet, so it takes the headline note, not the whole file */
function fdNoteSeed(p){
  const b=bioLine((biosFor(p)||{}).broadcast_bio).split('\n').map(s=>s.replace(/^[•\-\s]+/,'').trim()).filter(Boolean)[0];
  const n=b||(p.bioNotes||[])[0];if(!n)return '';
  const t=String(n).replace(/^[A-Z][A-Z \-']{3,}:\s*/,'');
  return t.length>96?t.slice(0,93).replace(/\s+\S*$/,'')+'…':t;
}
function fdRevert(team,key){delete fdOv(team)[key];save();renderFolders();toast('Back to synced value');}
/* ---- freshness: one timestamp per feed, because they refresh at different rates ---- */
function syncMark(kind){DATA.sync=DATA.sync||{};DATA.sync[kind]=new Date().toISOString();try{save();}catch(e){}renderSyncBadges();}
function syncAt(kind){const t=Date.parse(((DATA.sync||{})[kind])||'');return isNaN(t)?0:t;}
function syncTimeStr(t){
  const d=new Date(t),now=new Date();
  const time=d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
  return d.toDateString()===now.toDateString()?time:d.toLocaleDateString('en-US',{month:'short',day:'numeric'})+', '+time;
}
function syncLabel(kind){const t=syncAt(kind);return t?'Updated '+syncTimeStr(t):'Never updated';}
/* <span class="upd" data-sync="standings"></span> anywhere = a live freshness badge */
function renderFeedAges(){
  const el=document.getElementById('htFeedAges');if(!el)return;
  const feeds=[['standings','Standings'],['players','Player stats'],['schedule','Schedule'],['rosters','Rosters'],['careers','Career stats'],['scorebar','Scorebar'],['daily','Daily report']];
  el.innerHTML=feeds.map(([k,label])=>{const t=syncAt(k);return `<span>${label}: <b>${t?syncTimeStr(t):'never'}</b></span>`;}).join('');
}
/* one honest empty state everywhere: what is missing, why, and what shows instead */
function emptyState(what,how){
  const lbl=(DATA.report&&DATA.report.seasonLabel)||'';
  const fallback=lbl?' Showing <b>'+esc(lbl)+'</b> until then.':'';
  return '<div class="empty"><div class="big">'+esc(what)+'</div>'+(how||'')+fallback+'</div>';
}
function emptyRow(cols,what,how){
  return '<tr><td colspan="'+cols+'" class="empty-cell"><b>'+esc(what)+'</b>'+(how?' — '+how:'')+'</td></tr>';
}
function preseasonNote(){
  const lbl=(DATA.report&&DATA.report.seasonLabel)||'';
  return lbl?'2026-27 hasn&rsquo;t started — these are <b>'+esc(lbl)+'</b> numbers.'
    :'No 2026-27 games played yet.';
}
function renderSyncBadges(){
  renderFeedAges();
  document.querySelectorAll('.upd[data-sync]').forEach(el=>{
    const k=el.dataset.sync,t=syncAt(k);
    el.textContent=t?syncLabel(k):'Not synced yet';
    el.className='upd'+(t?'':' none');
    el.title=t?new Date(t).toLocaleString():'This feed has not been pulled in this browser yet';
  });
}
/* every displayed stat traces to the synced store; a small stamp says how fresh */
function dataStampHTML(scope){
  const R=DATA.report||{};
  const feedAt=Math.max(syncAt('standings'),syncAt('players'),syncAt('schedule'),syncAt('rosters'),
    (R.live&&Date.parse(R.live.at))||0,(R.parsedAt&&Date.parse(R.parsedAt))||0);
  const parts=[];
  parts.push('SPHL feed '+(feedAt?new Date(feedAt).toLocaleString('en-US',{month:'numeric',day:'numeric',year:'2-digit',hour:'numeric',minute:'2-digit'}):'not synced'));
  if(R.daily&&R.daily.date)parts.push('daily report '+R.daily.date);
  parts.push('season '+seasonShortOf(activeSeasonId()));
  if(R.seasonLabel)parts.push('stats: '+R.seasonLabel);
  const edited=stampEdited(scope);
  return `<div class="pg-stamp">Data: ${esc(parts.join(' · '))} · printed ${new Date().toLocaleString('en-US',{month:'numeric',day:'numeric',year:'2-digit',hour:'numeric',minute:'2-digit'})}${edited?' · (includes manual edits)':''}</div>`;
}
function stampMissing(containerId,scope){
  const root=document.getElementById(containerId);if(!root)return;
  const html=dataStampHTML(scope);
  root.querySelectorAll('.page').forEach(p=>{if(!p.querySelector('.pg-stamp'))p.insertAdjacentHTML('beforeend',html);});
}
function stampEdited(scope){
  const any=o=>Object.keys(o||{}).some(k=>String(o[k]||'').trim());
  if(scope==='packet')return any(DATA.statOv)||DATA.roster.some(p=>p.statOverride&&p.statOverride.trim());
  if(scope==='chart')return false;
  if(scope==='verbs')return !!DATA.verbs;
  if(scope==='lines')return false;
  if(scope==='opening')return false;
  return any((DATA.folderOv||{})[scope])||any(DATA.statOv);
}
/* packet/stat-display value cell — same rules as the folder cells, global keys */
function ovCell(key,computed){
  DATA.statOv=DATA.statOv||{};
  const ov=DATA.statOv[key];
  const hasOv=ov!=null&&String(ov).trim()!=='';
  const hasSrc=computed!=null&&computed!=='';
  const inner=hasOv?esc(ov):(hasSrc?esc(String(computed)):'—');
  const mark=hasOv&&hasSrc?`<b class="ov-mark" title="manual override — synced: ${esc(String(computed))}">•</b><button class="fv-rv no-print" title="Revert to synced" onclick="statOvRevert('${esc(key)}')">↺</button>`:'';
  return `<span class="pv" contenteditable="true" spellcheck="false" data-k="${esc(key)}">${inner}</span>${mark}`;
}
function statOvRevert(key){delete (DATA.statOv||{})[key];save();renderPacket();toast('Back to synced value');}
function pkWireOv(){
  const doc=document.getElementById('packetDoc');if(!doc||doc._pvWired)return;
  doc._pvWired=true;
  doc.addEventListener('input',e=>{
    const pv=e.target.closest?e.target.closest('.pv[data-k]'):null;if(!pv)return;
    clearTimeout(doc._pvt);
    doc._pvt=setTimeout(()=>{
      DATA.statOv=DATA.statOv||{};DATA.statOv[pv.dataset.k]=pv.innerText.trim();
      save();
    },600);
  });
}
function revertAllOverrides(){
  const n1=Object.values(DATA.folderOv||{}).reduce((a,t)=>a+Object.keys(t).filter(k=>String(t[k]||'').trim()).length,0);
  const n2=Object.keys(DATA.statOv||{}).filter(k=>String(DATA.statOv[k]||'').trim()).length;
  const n3=DATA.roster.filter(p=>p.statOverride&&p.statOverride.trim()).length;
  if(!(n1+n2+n3)){toast('No overrides to revert');return;}
  if(!confirm('Revert ALL manual stat overrides to synced data?\n\n'+n1+' folder values · '+n2+' packet values · '+n3+' player stat lines'))return;
  DATA.folderOv={};DATA.statOv={};DATA.roster.forEach(p=>{if(p.statOverride)p.statOverride='';});
  save();renderFolders();toast('All overrides reverted');
}
function fdGamesFor(kw){
  const re=new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i');
  return (DATA.leagueLog||[]).filter(g=>re.test(g.h)||re.test(g.a)).sort((a,b)=>a.d<b.d?-1:1)
    .map(g=>{const home=re.test(g.h);const gf=home?g.hg:g.ag,ga=home?g.ag:g.hg;
      const wl=gf>ga?(g.ot?(g.ot==='SO'?'SOW':'OTW'):'W'):(gf<ga?(g.ot?(g.ot==='SO'?'SOL':'OTL'):'L'):'T');
      return {...g,home,gf,ga,wl};});
}
function fdRec(gs){
  if(!gs.length)return null;
  const c=ks=>gs.filter(g=>ks.indexOf(g.wl)>=0).length;
  return c(['W','OTW','SOW'])+'-'+c(['L'])+'-'+c(['OTL'])+'-'+c(['SOL']);
}
function fdPtsOf(gs){return gs.reduce((s,g)=>s+(g.wl==='W'?3:(g.wl==='OTW'||g.wl==='SOW'?2:(g.wl==='OTL'||g.wl==='SOL'?1:0))),0);}
function fdStreak(gs){
  if(!gs.length)return null;
  const w=g=>['W','OTW','SOW'].indexOf(g.wl)>=0;
  const last=w(gs[gs.length-1]);let n=0;
  for(let i=gs.length-1;i>=0&&w(gs[i])===last;i--)n++;
  return (last?'W':'L')+n;
}
function fdRankOf(map,kw,dir){ // rank of team kw within {city:val}; dir 1 = higher is better
  const re=new RegExp(kw,'i');
  const entries=Object.keys(map).map(k=>[k,parseFloat(map[k])]).filter(e=>isFinite(e[1]));
  if(!entries.length)return null;
  entries.sort((a,b)=>dir*(b[1]-a[1]));
  const i=entries.findIndex(e=>re.test(e[0]));
  return i<0?null:ordinal(i+1);
}
function fdPron(p){
  if(p.pron)return p.pron;
  const b=bioLine((biosFor(p)||{}).pronunciation);if(b)return b;
  const lastNm=(p.name||'').trim().split(/\s+/).pop();
  if(!lastNm)return '';
  const hit=(DATA.settings.pronounce||'').split('\n').find(l=>l.toLowerCase().indexOf(lastNm.toLowerCase())>=0);
  return hit?hit.split(/\s*[-–—]\s*/).slice(1).join('-').trim():'';
}
function fdGameLine(){
  const G=DATA.game,S=DATA.settings;
  const d=G.date?new Date(G.date+'T00:00').toLocaleDateString('en-US',{weekday:'short',month:'numeric',day:'numeric',year:'2-digit'}):'';
  return [G.ps?sheetSeason()+' PRESEASON':'',d,(S.city+' '+S.name)+' '+(G.homeaway==='@'?'@':'vs.')+' '+(G.opp||'Opponent'),G.venue||S.venue].filter(Boolean).join('  ·  ');
}
function fdPlayerHTML(p,kw,side){
  const parts=(p.name||'').trim().split(/\s+/);
  let first='',last='';
  if(parts.length>1){last=parts.pop();first=parts.join(' ');}else last=parts[0]||'';
  const letter=p.capt==='C'?' (C)':p.capt==='A'?' (A)':'';
  const pron=fdPron(p);
  return `<div class="fd-pl">
    <div class="fd-nm">#${esc(p.num||'')} <b>${esc(last.toUpperCase())}</b> ${esc(first)}${letter} ${statSpan(p,kw)}</div>
    ${pron?`<div class="fd-pron">${esc(pron)}</div>`:''}
    <div class="fd-note">${esc(p.callNote||fdNoteSeed(p))}</div>
  </div>`;
}
/* ============================================================
   BROADCAST FOLDER CALL SHEET
   One team, one page, everything visible at a glance: a header bar in the
   club's own colours, compact player cards grouped by position, and a
   write-in sidebar. Built to the reference call sheet's structure.
   ============================================================ */
function fdTeamRec(team){
  const st=standingsFor(team);
  if(!st)return '';
  const rec=[st.w,st.l,st.otl].concat(st.sol!=null?[st.sol]:[]).join('-');
  return rec;
}
function fdPlace(team){
  const rows=(DATA.report.standings||[]).slice().sort((a,b)=>(b.pts||0)-(a.pts||0));
  const k=teamCity(team);
  const i=rows.findIndex(r=>new RegExp(k,'i').test(r.team));
  return i>=0?ordinal(i+1).toUpperCase():'';
}
function fdCoachLine(team){
  const {head,asst}=staffFor(team);
  const ref=getCoach(team);
  const name=(head&&head.name)||ref.name||'';
  if(!name&&!asst.length)return '';
  const bits=[];
  if(name){
    // tenure and career record come from the League Reference file's coach note
    const bio=String(ref.bio||'');
    const career=(bio.match(/\(?\b(\d{2,4}-\d{2,4}(?:-\d{1,3})?)\b\)?/)||[])[1]||'';
    let tenure=(bio.match(/(\d+(?:st|nd|rd|th)[^.;]*?(?:with|overall)[^.;]*)/i)||[])[1]||'';
    if(career)tenure=tenure.replace(new RegExp('\\(?\\s*'+career.replace(/-/g,'\\-')+'\\s*\\)?','g'),'').trim();
    tenure=tenure.replace(/[\s(]+$/,'');
    bits.push('HEAD COACH: '+name.toUpperCase()
      +(tenure?' – '+tenure.toUpperCase():'')
      +(career?' ('+career+')':''));
  }
  if(asst.length)bits.push('ASST. COACHES: '+asst.map(a=>a.name).join(', '));
  return bits.join('  /  ');
}
/* season line for one player, from the synced team stats */
function fdSeasonLine(p,ts){
  if(!ts)return '';
  if(p.pos==='G'){
    const g=ts.goalies.find(x=>(x.htId&&p.htId&&x.htId===p.htId)||x.num===p.num||norm(x.name)===norm(p.name));
    if(!g)return '';
    return 'SV%: '+(g.svpct||'—')+'&nbsp;&nbsp;W-L-OT: '+g.w+'-'+g.l+'-'+g.otl
      +'<br>GAA: '+(g.gaa||'—')+'&nbsp;&nbsp;SO: '+(g.so||0);
  }
  const x=ts.players.find(y=>(y.htId&&p.htId&&y.htId===p.htId)||y.num===p.num||norm(y.name)===norm(p.name));
  if(!x)return '';
  return 'G: '+x.g+'&nbsp;&nbsp;A: '+x.a+'&nbsp;&nbsp;P: '+x.pts
    +'<br>+/-: '+(x.pm>=0?'+':'')+x.pm+'&nbsp;&nbsp;PIM: '+x.pim+'&nbsp;&nbsp;Shots: '+(x.shots||0);
}
/* SPHL career totals, from the feed's career pull where we have it */
function fdCareerLine(p){
  const hc=typeof htCareerFor==='function'?htCareerFor(p):null;
  if(!hc||!hc.rows||!hc.rows.length)return '';
  const reg=hc.rows.filter(r=>!r.playoffs);
  if(!reg.length)return '';
  const t=reg.reduce((a,r)=>{a.gp+=r.gp||0;a.g+=r.g||0;a.a+=r.a||0;a.p+=r.pts||0;a.pim+=r.pim||0;a.w+=r.w||0;a.l+=r.l||0;a.otl+=r.otl||0;a.so+=r.so||0;return a;},
    {gp:0,g:0,a:0,p:0,pim:0,w:0,l:0,otl:0,so:0});
  if(p.pos==='G')return 'GP: '+t.gp+', W-L-OT: '+t.w+'-'+t.l+'-'+t.otl+', SO: '+t.so;
  return 'GP: '+t.gp+', G: '+t.g+', A: '+t.a+', P: '+t.p+'<br>PIM: '+t.pim;
}
/* ---- committed bridge context (preseason / opening week) ----
   With no current-season stats published, the call sheet still shows real
   numbers from the committed spine: last season's rows verbatim (league
   labeled when not SPHL — college/junior numbers never masquerade as pro)
   and entering-season career totals via CareerMath. Havoc players only —
   the spine is Havoc-only; opponents keep their live/EP paths. */
function msSpineFor(p){
  if(!MS_DATA||!Array.isArray(MS_DATA.players))return null;
  const k=norm(p.name);
  return MS_DATA.players.find(x=>norm(x.name)===k)||null;
}
function spineLastRows(sp){
  const rows=(sp.seasons||[]).filter(r=>r&&r.season&&r.gp!=null);
  if(!rows.length)return [];
  const last=rows.map(r=>r.season).sort().pop();
  return rows.filter(r=>r.season===last);
}
function fmtSv(v){return '.'+String(Math.round(Number(v)*1000)).padStart(3,'0');}
function fdLastYrLine(p){
  const sp=msSpineFor(p);if(!sp)return null;
  const rows=spineLastRows(sp);if(!rows.length)return null;
  const isG=p.pos==='G'||sp.type==='goalie';
  const one=r=>{
    const tag=(r.league&&r.league!=='SPHL')?((r.team?r.team+' · ':'')+r.league):(rows.length>1?r.team:'');
    const line=isG
      ?[r.gp+' GP',(r.w!=null?r.w+'-'+(r.l||0)+'-'+(r.otl||0):''),(r.gaa!=null?Number(r.gaa).toFixed(2)+' GAA':''),(r.svpct!=null?fmtSv(r.svpct)+' SV%':''),(r.so?r.so+' SO':'')].filter(Boolean).join(' · ')
      :r.gp+' GP · '+(r.g||0)+'-'+(r.a||0)+'&mdash;'+(r.pts||0)+(r.pim!=null?' · '+r.pim+' PIM':'');
    return line+(tag?' <span class="cs-ph">('+esc(tag)+')</span>':'');
  };
  return {label:rows[0].season+' FINAL',html:rows.map(one).join('<br>')};
}
function fdEnteringLine(p){
  const sp=msSpineFor(p);if(!sp||typeof msTotals!=='function')return '';
  const isG=p.pos==='G'||sp.type==='goalie';
  const seg=(nm,t)=>{
    if(!t||!(+t.gp))return '';   // a rookie's zero pro career prints nothing, never zeros
    return nm+': '+(isG
      ?[t.gp+' GP',(t.w!=null?t.w+' W':''),(t.so!=null?t.so+' SO':'')].filter(Boolean).join(' · ')
      :[t.gp+' GP',(t.pts!=null?t.pts+' PTS':''),(t.pim!=null?t.pim+' PIM':'')].filter(Boolean).join(' · '));
  };
  const hv=(msTotals(sp,'havoc')||{}).vals,pr=(msTotals(sp,'pro')||{}).vals;
  const parts=[seg('HAVOC',hv)];
  if(pr&&(+pr.gp)&&(!hv||pr.gp!==hv.gp||pr.pts!==hv.pts||pr.w!==hv.w))parts.push(seg('PRO',pr));
  return parts.filter(Boolean).join('&nbsp;&nbsp;·&nbsp;&nbsp;');
}
/* the prose blurb — the club's broadcast notes, his to rewrite in place */
function fdNotesText(p){
  const b=bioLine((biosFor(p)||{}).broadcast_bio);
  if(b)return b.split('\n').map(s=>s.replace(/^[•\-\s]+/,'').trim()).filter(Boolean).join(' ');
  if(p.callNote!=null&&String(p.callNote).trim())return String(p.callNote);
  const n=(p.bioNotes||[]).slice(0,2).join(' ');
  return n||'';
}
function fdPersonalText(p){
  if(p.callPersonal!=null&&String(p.callPersonal).trim())return String(p.callPersonal);
  const bits=[];
  if(p.dob||p.birth)bits.push('Born '+[p.dob,p.birth?'from '+p.birth:''].filter(Boolean).join(' '));
  if(p.bornIn&&p.bornIn!==p.birth)bits.push('birthplace '+p.bornIn);
  if(p.junior)bits.push(p.junior);
  return bits.join(' … ');
}
function fdVitals(p){
  const g=p.pos==='G';
  return 'Ht: '+(p.ht||'—')+'&nbsp; Wt: '+(p.wt||'—')+'&nbsp; '+(g?'Catches':'Shoots')+': '+(p.sh||'—')
    +'&nbsp; Age: '+(p.age||'—');
}
function fdCard(p,side,pal,group){
  const parts=(p.name||'').trim().split(/\s+/);
  let first='',last='';
  if(parts.length>1){last=parts.pop();first=parts.join(' ');}else last=parts[0]||'';
  const letter=p.capt==='C'?' (C)':p.capt==='A'?' (A)':'';
  const edge=group==='D'?pal.accent:(group==='G'?pal.goalie:pal.secondary);
  const ts=findTeamStats(side==='home'?'Huntsville':teamCity(DATA.game.opp));
  const season=fdSeasonLine(p,ts),career=fdCareerLine(p);
  // committed bridge lines fill in only where live data is absent (Havoc only)
  const lastYr=(!season&&side==='home')?fdLastYrLine(p):null;
  const entering=(!career&&side==='home')?fdEnteringLine(p):'';
  const notes=fdNotesText(p),personal=fdPersonalText(p);
  const ed=(k,cls,html)=>`<div class="${cls}">${html}</div>`;
  return `<div class="cs-card" style="border-color:${edge}">
    <div class="cs-top">
      <span class="cs-num" style="background:${edge};color:${pal.primary}">${esc(p.num||'')}</span>
      <span class="cs-name">${esc(last.toUpperCase())}${first?', '+esc(first.toUpperCase()):''}${letter}</span>
    </div>
    <div class="cs-vitals">${fdVitals(p)}</div>
    ${season?`<div class="cs-stat"><i>${esc((statsScopeLabel()||'SEASON').toUpperCase())} STATS:</i> ${season}</div>`
            :lastYr?`<div class="cs-stat"><i>${esc(lastYr.label.toUpperCase())}:</i> ${lastYr.html}</div>`
            :`<div class="cs-stat"><i>SEASON STATS:</i> <span class="cs-ph">no ${esc(seasonNowShort())} stats published yet</span></div>`}
    ${career?`<div class="cs-stat"><i>CAREER STATS (SPHL TOTALS):</i> ${career}</div>`
            :entering?`<div class="cs-stat"><i>ENTERING ${esc(sheetSeason())}:</i> ${entering}</div>`:''}
    <div class="cs-lab">SEASON/CAREER NOTES:</div>
    ${ed('note','cs-note',esc(notes)||'<span class="cs-ph">click to write</span>')}
    <div class="cs-lab">PERSONAL NOTES:</div>
    ${ed('personal','cs-note cs-pers',esc(personal)||'<span class="cs-ph">click to write</span>')}
  </div>`;
}
function fdSideList(title,text,cls){
  const rows=String(text||'').split('\n').map(x=>x.trim()).filter(Boolean);
  return `<div class="cs-sb-box ${cls||''}"><div class="cs-sb-h">${esc(title)}</div>`
    +(rows.length?rows.map(r=>'<div class="cs-sb-row">'+esc(r)+'</div>').join(''):'<div class="cs-sb-row cs-dim">—</div>')
    +`</div>`;
}
function fdCallSheet(side){
  const S=DATA.settings,G=DATA.game;
  const isHome=side==='home';
  const team=isHome?'Huntsville Havoc':(G.opp||'Opponent');
  const pal=teamPal(team);
  const primary=isHome?(S.red||pal.primary):pal.primary;
  const list=(isHome?DATA.roster:((G.opp&&DATA.oppRosters[G.opp])||[])).filter(p=>p.active!=='0'&&p.name);
  const byNum=(a,b)=>(+a.num||999)-(+b.num||999);
  const fwd=(list.filter(p=>p.pos!=='D'&&p.pos!=='G')).sort(byNum);
  const def=(list.filter(p=>p.pos==='D')).sort(byNum);
  const gls=(list.filter(p=>p.pos==='G')).sort(byNum);
  const grid=(arr,group,key)=>arr.length
      ?`<div class="cs-grid" style="grid-template-columns:repeat(${({f:3,d:2,g:2})[key]},minmax(0,1fr))">${arr.map(p=>fdCard(p,side,pal,group)).join('')}</div>`
      :'<div class="cs-none">No players in this group.</div>';
  const rec=fdTeamRec(team),place=fdPlace(team);
  const coach=fdCoachLine(team);
  const susp=(isHome?(G.susp||''):(G.oppSusp||'')).trim();
  const sb=`<aside class="cs-side" style="width:170px">
    ${fdSideList('IR',isHome?G.ir:G.oppIr)}
    ${fdSideList('ECHL',isHome?G.echl:G.oppEchl)}
    ${susp?`<div class="cs-susp">*** ${esc(susp.toUpperCase())} ***</div>`:''}
    ${fdSideList('SCRATCHES',isHome?G.scratch:G.oppScratch)}
    <div class="cs-sb-box"><div class="cs-sb-h">LINES</div><div class="cs-write"></div></div>
    <div class="cs-sb-box cs-grow"><div class="cs-sb-h">NOTES</div><div class="cs-write cs-write-grow"></div></div>
  </aside>`;
  return `<div class="page lc-page cs-page">
    <div class="cs-head" style="background:${primary};color:${pal.textOn}">
      <div class="cs-h1">${esc(team.toUpperCase())}${rec?' ('+esc(rec)+')':''}${place?' – '+esc(place):''}</div>
      ${coach?`<div class="cs-h2">${esc(coach)}</div>`:''}
    </div>
    <div class="cs-game">${esc(fdGameLine())}</div>
    <div class="cs-body">
      <div class="cs-main">
        <div class="cs-sub" style="color:${primary};border-color:${pal.secondary}">Forwards (${fwd.length})</div>${grid(fwd,'F','f')}
        <div class="cs-sub" style="color:${primary};border-color:${pal.accent}">Defense (${def.length})</div>${grid(def,'D','d')}
        <div class="cs-sub" style="color:${primary};border-color:${pal.goalie}">Goaltenders (${gls.length})</div>${grid(gls,'G','g')}
      </div>
      ${sb}
    </div>
    <div class="fd-contact">${esc(S.mediaName||'')} | ${esc(S.mediaTitle||'')} · ${esc(S.mediaPhone||'')} · ${esc(S.mediaEmail||'')}</div>
    ${dataStampHTML(team)}
  </div>`;
}
function fdLineupPage(side){
  const S=DATA.settings,G=DATA.game;
  const isHome=side==='home';
  const teamFull=isHome?'Huntsville Havoc':(G.opp||'Opponent');
  const kw=isHome?'Huntsville':teamCity(G.opp)||'zzz';
  const theme=teamTheme(teamFull);const primary=isHome?(S.red||theme.primary):theme.primary;
  const list=isHome?DATA.roster:((G.opp&&DATA.oppRosters[G.opp])||[]);
  const logo=teamLogoSrc(teamFull);
  ensureLines();
  const L=DATA.lines[isHome?'home':'opp'];
  const resolve=v=>{
    const t=String(v||'').trim();if(!t)return null;
    const mnum=t.match(/^(\d+)/);
    let p=mnum?list.find(x=>String(x.num)===mnum[1]&&x.name):null;
    if(!p)p=list.find(x=>x.name&&t.toLowerCase().indexOf(x.name.toLowerCase())>=0);
    return p;
  };
  const cellFor=v=>{const p=resolve(v);return p?fdPlayerHTML(p,kw,side):(String(v||'').trim()?`<div class="fd-pl"><div class="fd-nm">${esc(v)}</div></div>`:'<div class="fd-pl fd-empty"></div>');};
  const linesUsed=L.f.some(ln=>ln.some(x=>x&&x.trim()))||L.d.some(pr=>pr.some(x=>x&&x.trim()))||L.g.some(x=>x&&x.trim());
  let fBlock,dBlock,gBlock;
  if(linesUsed){
    fBlock=L.f.map((ln,i)=>`<div class="fd-row f3"><span class="fd-ln">${i+1}</span>${ln.map(cellFor).join('')}</div>`).join('');
    dBlock=L.d.map((pr,i)=>`<div class="fd-row f2"><span class="fd-ln">${i+1}</span>${pr.map(cellFor).join('')}</div>`).join('');
    gBlock=`<div class="fd-row f2"><span class="fd-ln">G</span>${cellFor(L.g[0])}${cellFor(L.g[1])}</div>`;
  }else{ // no lines entered yet — numerical roster order so the page still works
    const act=list.filter(p=>p.active!=='0'&&p.name);
    const byNum=(a,b)=>(+a.num||999)-(+b.num||999);
    const wrap3=arr=>{let h='';for(let i=0;i<arr.length;i+=3)h+=`<div class="fd-row f3"><span class="fd-ln"></span>${arr.slice(i,i+3).map(p=>fdPlayerHTML(p,kw,side)).join('')}</div>`;return h;};
    fBlock=wrap3(act.filter(p=>p.pos!=='D'&&p.pos!=='G').sort(byNum));
    dBlock=wrap3(act.filter(p=>p.pos==='D').sort(byNum));
    gBlock=wrap3(act.filter(p=>p.pos==='G').sort(byNum));
  }
  const strip=isHome
    ?`<div class="fd-strip"><div><b>SCRATCHES</b> ${esc((G.scratch||'').replace(/\n/g,' · '))||'—'}</div><div><b>IR</b> ${esc((G.ir||'').split('\n').filter(Boolean).join(' · '))||'—'}</div><div><b>ECHL</b> ${esc((G.echl||'').split('\n').filter(Boolean).join(' · '))||'—'}</div></div>`
    :`<div class="fd-strip"><div><b>SCRATCHES</b> <span class="fd-blank"></span></div><div><b>IR</b> <span class="fd-blank"></span></div><div><b>ECHL</b> <span class="fd-blank"></span></div></div>`;
  return `<div class="page lc-page fd-page">
    <div class="lcx-head" style="background:${primary}">${logo?`<div class="lcx-logo"><img src="${logo}"></div>`:''}<div class="lcx-title">${esc(teamFull.toUpperCase())} — LINEUP</div></div>
    <div class="fd-game">${esc(fdGameLine())}</div>
    <div class="fd-body">
      <div class="fd-sub" style="color:${primary};border-color:${primary}">Forwards</div>${fBlock}
      <div class="fd-sub" style="color:${primary};border-color:${primary}">Defense</div>${dBlock}
      <div class="fd-sub" style="color:${primary};border-color:${primary}">Goaltenders</div>${gBlock}
    </div>
    ${strip}
    <div class="fd-contact">${esc(DATA.settings.mediaName||'')} | ${esc(DATA.settings.mediaTitle||'')} · ${esc(DATA.settings.mediaPhone||'')} · ${esc(DATA.settings.mediaEmail||'')}</div>
    ${dataStampHTML(teamFull)}
  </div>`;
}
function fdDataPage(side){
  const S=DATA.settings,G=DATA.game;
  const isHome=side==='home';
  const isOpp=!isHome;
  const teamFull=isHome?'Huntsville Havoc':(G.opp||'Opponent');
  const kw=isHome?'Huntsville':teamCity(G.opp)||'zzz';
  const oppKw=isHome?(teamCity(G.opp)||'zzz'):'Huntsville';
  const theme=teamTheme(teamFull);const primary=isHome?(S.red||theme.primary):theme.primary;
  const logo=teamLogoSrc(teamFull);
  const st=standingsFor(kw);
  const gs=fdGamesFor(kw);
  const ext=isHome?(DATA.report.ext||{}):{};
  const C=(key,computed)=>fdCell(teamFull,key,computed,isOpp);
  // special teams + ranks
  const ppMap={},pkMap={};
  Object.keys(DATA.report.special||{}).forEach(t=>{const o=DATA.report.special[t];if(o.pp!=null)ppMap[t]=o.pp;if(o.pk!=null)pkMap[t]=o.pk;});
  const ppRe=new RegExp(kw,'i');
  const ppKey=Object.keys(ppMap).find(k=>ppRe.test(k)),pkKey=Object.keys(pkMap).find(k=>ppRe.test(k));
  const pp=ppKey?ppMap[ppKey]+(fdRankOf(ppMap,kw,1)?' ('+fdRankOf(ppMap,kw,1)+')':''):null;
  const pk=pkKey?pkMap[pkKey]+(fdRankOf(pkMap,kw,1)?' ('+fdRankOf(pkMap,kw,1)+')':''):null;
  // PIM totals + rank
  const pimMap={};
  Object.keys(DATA.report.teamStats||{}).forEach(t=>{pimMap[t]=(DATA.report.teamStats[t].players||[]).reduce((s2,p)=>s2+(+p.pim||0),0);});
  const pimKey=Object.keys(pimMap).find(k=>ppRe.test(k));
  const pims=(pimKey&&pimMap[pimKey])?pimMap[pimKey]+(fdRankOf(pimMap,kw,1)?' ('+fdRankOf(pimMap,kw,1)+')':''):null;
  const homeGs=gs.filter(g=>g.home),roadGs=gs.filter(g=>!g.home);
  const otGs=gs.filter(g=>g.ot);
  const cnt=w=>gs.filter(g=>g.wl===w).length;
  const otso=gs.length?`OTW ${cnt('OTW')} · OTL ${cnt('OTL')} · SOW ${cnt('SOW')} · SOL ${cnt('SOL')} (${2*(cnt('OTW')+cnt('SOW'))+cnt('OTL')+cnt('SOL')} pts)`:null;
  const h2hGs=gs.filter(g=>new RegExp(oppKw,'i').test(g.h)||new RegExp(oppKw,'i').test(g.a));
  const splits=isHome?glSplits():null;
  const findSplit=lbl=>{const r=(((splits||{}).rows)||[]).find(x=>x[0]===lbl);return r?r[1]:null;};
  const rows=[
    ['pp','Power play',pp],
    ['pk','Penalty kill',pk],
    ['gf','Goals for',st?st.gf:null],
    ['ga','Goals against',st?st.ga:null],
    ['ratio','GF/GA ratio',st&&st.gf!=null&&st.ga?(st.gf/st.ga).toFixed(2):null],
    ['home','Home',fdRec(homeGs)?fdRec(homeGs)+' ('+fdPtsOf(homeGs)+' pts)':null],
    ['road','Road',fdRec(roadGs)?fdRec(roadGs)+' ('+fdPtsOf(roadGs)+' pts)':null],
    ['pims','PIMs',pims],
    ['otso','OT / SO',otso],
    ['first','Scoring first',isHome&&ext.scoreFirst?`${ext.scoreFirst.w}-${ext.scoreFirst.l}-${ext.scoreFirst.otl}`:null],
    ['lead1','Leading after 1st',null],
    ['lead2','Leading after 2nd',null],
    ['trail1','Trailing after 1st',null],
    ['trail2','Trailing after 2nd',null],
    ['tied1','Tied after 1st',null],
    ['tied2','Tied after 2nd',null],
    ['outshoot','When outshooting',isHome?findSplit('When outshooting opponent'):null],
    ['outshot','When outshot',isHome?findSplit('When outshot'):null],
    ['onegoal','One-goal games',gs.length?fdRec(gs.filter(g=>Math.abs(g.gf-g.ga)===1)):null],
    ['ppvs','PP vs '+(isHome?(teamCity(G.opp)||'opp'):'Havoc'),null],
    ['pkvs','PK vs '+(isHome?(teamCity(G.opp)||'opp'):'Havoc'),null],
    ['ppsplit','PP home / away',null],
    ['pksplit','PK home / away',null],
    ['past10','Past 10',gs.length?fdRec(gs.slice(-10))+' ('+fdPtsOf(gs.slice(-10))+' pts)':null],
    ['streak','Streak',fdStreak(gs)],
    ['h2h','H2H vs '+(isHome?(teamCity(G.opp)||'opp'):'Havoc'),h2hGs.length?fdRec(h2hGs):null]
  ];
  const dataRows=rows.map(r=>`<div class="fd-dr"><span class="fd-dl">${r[1]}</span>${C(r[0],r[2])}</div>`).join('')
    +`<div class="fd-dr"><span class="fd-dl">Streak note</span>${C('streaknote',null)}</div>`
    +`<div class="fd-dr"><span class="fd-dl">H2H note</span>${C('h2hnote',null)}</div>`;
  // standings block with playoff line under 8th
  const stRows=(DATA.report.standings||[]).map((t,i)=>{
    const line=`${t.w}-${t.l}-${t.otl}${t.sol!=null?'-'+t.sol:''} · ${t.pts} pts · GR ${t.gp!=null?Math.max(0,60-t.gp):'—'}`;
    return `<div class="fd-st${i===7?' fd-poline':''}"><span class="fd-seed">${i+1}</span><span class="fd-stt">${esc(t.team)}</span>${fdCell(teamFull,'st'+i,line,false)}</div>`;
  }).join('')||'<div style="color:var(--ink-2);font-size:12px">Sync live data / import the daily report for standings.</div>';
  // per-period table (GF/GA from report where known — every cell editable)
  const gp=isHome?ext.goalsByPeriod:null;
  const per=['p1','p2','p3','ot'];
  const perRow=(pk2,lbl)=>`<tr><th>${lbl}</th><td>${C(pk2+'gf',gp?gp[pk2][0]:null)}</td><td>${C(pk2+'ga',gp?gp[pk2][1]:null)}</td><td>${C(pk2+'sf',null)}</td><td>${C(pk2+'sa',null)}</td></tr>`;
  const perTable=`<table class="fd-per"><tr><th></th><th>GF</th><th>GA</th><th>SF</th><th>SA</th></tr>${perRow('p1','1st')}${perRow('p2','2nd')}${perRow('p3','3rd')}${perRow('ot','OT')}</table>`;
  // recent results (last 10) + next 5
  const recent=gs.slice(-10).map(g=>{
    const d=new Date(g.d+'T12:00').toLocaleDateString('en-US',{month:'numeric',day:'numeric'});
    return `<div class="fd-res"><span>${d}</span><span>${esc(teamCity(g.a))} ${g.ag} @ ${esc(teamCity(g.h))} ${g.hg}${g.ot?' ('+g.ot+')':''}</span><b>${g.wl}</b></div>`;
  }).join('')||'<div style="color:var(--ink-2);font-size:12px">No finals yet.</div>';
  let next='';
  if(isHome){
    const up=parseScheduleData().filter(x=>!x.result).slice(0,5);
    next=up.map(x=>`<div class="fd-res"><span>${esc(x.date||'')}</span><span>${esc((x.ha||'')+' '+(x.opp||''))}</span><span></span></div>`).join('');
  }
  if(!next)next=Array.from({length:5},()=>'<div class="fd-res"><span class="fd-blank" style="width:100%"></span></div>').join('');
  const tx=(isHome?G.txhome:G.txaway)||'';
  const txRows=tx.split('\n').map(x=>x.trim()).filter(Boolean).map(l=>`<div class="fd-res"><span>${esc(l)}</span></div>`).join('')||'<div style="color:var(--ink-2);font-size:12px">None entered (This Game tab).</div>';
  return `<div class="page lc-page fd-page">
    <div class="lcx-head" style="background:${primary}">${logo?`<div class="lcx-logo"><img src="${logo}"></div>`:''}<div class="lcx-title">${esc(teamFull.toUpperCase())} — DATA</div></div>
    <div class="fd-game">${esc(fdGameLine())}</div>
    <div class="fd-cols">
      <div class="fd-col">
        <div class="fd-sub" style="color:${primary};border-color:${primary}">SPHL Standings${esc(scopeSuffixFor('standings'))}</div>${stRows}
        <div class="fd-sub" style="color:${primary};border-color:${primary}">By Period</div>${perTable}
        <div class="fd-sub" style="color:${primary};border-color:${primary}">Last 10 Results</div>${recent}
        <div class="fd-sub" style="color:${primary};border-color:${primary}">Next 5</div>${next}
      </div>
      <div class="fd-col">
        <div class="fd-sub" style="color:${primary};border-color:${primary}">Team Data</div>${dataRows}
        <div class="fd-sub" style="color:${primary};border-color:${primary}">Recent Transactions</div>${txRows}
        <div class="fd-sub" style="color:${primary};border-color:${primary}">Pronunciation</div>
        ${(()=>{const list=isHome?DATA.roster:((G.opp&&DATA.oppRosters[G.opp])||[]);
          const all=teamPronList(list);
          // the booth card carries the ones we actually know; the unknowns are a
          // prep job, and they get their own line on the packet's guide
          const known=all.filter(e=>!/ask him/i.test(e.say)).slice(0,14);
          const ask=all.length-all.filter(e=>!/ask him/i.test(e.say)).length;
          const tail=ask?`<div style="font-size:11px;color:var(--ink-2);margin-top:2px">${ask} still to confirm with the club</div>`:'';
          return known.length?`<div class="fd-pron2">${known.map(e=>`<div><b>${esc(e.name.split(' ').pop().toUpperCase())}</b> ${esc(e.say)}</div>`).join('')}</div>${tail}`
          :(tail||'<div style="font-size:12px;color:var(--ink-2)">None saved — add on the rosters or the Settings guide.</div>');})()}
      </div>
    </div>
    <div class="fd-notes"><div class="fd-notes-label">NOTES</div><div class="fd-notes-rule"></div></div>
    <div class="fd-contact">${esc(DATA.settings.mediaName||'')} | ${esc(DATA.settings.mediaTitle||'')} · ${esc(DATA.settings.mediaPhone||'')} · ${esc(DATA.settings.mediaEmail||'')}</div>
    ${dataStampHTML(teamFull)}
  </div>`;
}
function renderFolders(){
  const doc=document.getElementById('foldersDoc');if(!doc)return;
  const want=FD_FILTER&&FD_FILTER!=='all'?[FD_FILTER]:['hl','hd','ol','od'];
  const mk={hl:()=>fdCallSheet('home'),hd:()=>fdDataPage('home'),ol:()=>fdCallSheet('opp'),od:()=>fdDataPage('opp')};
  doc.innerHTML=want.map(k=>mk[k]().replace('<div class="page','<div data-sec="fd:'+k+'" class="page')).join('');
  fdWireEdits();secApplyAll();fdViewSync();
  imagesReady(doc,2500).then(()=>fitActiveAuto().then(fdFitReport));
}
function fdWireEdits(){
  const doc=document.getElementById('foldersDoc');if(!doc||doc._fdWired)return;
  doc._fdWired=true;
  doc.addEventListener('input',e=>{
    clearTimeout(doc._ft);
    doc._ft=setTimeout(()=>{
      const t=e.target.closest?e.target.closest('.fv'):null;if(!t)return;
      fdOv(t.dataset.t)[t.dataset.k]=t.innerText.trim();save();
    },600);
  });
}
/* The four buttons switch the preview; printing is its own action, so he can
   always see what he is about to print. */
function fdShow(which){
  FD_FILTER=which==='all'?null:which;
  save();renderFolders();fdViewSync();
}
function fdViewSync(){
  const cur=FD_FILTER||'all';
  document.querySelectorAll('#fdViews [data-fdv]').forEach(b=>{
    const on=b.dataset.fdv===cur;
    b.classList.toggle('dark',on);
    b.setAttribute('aria-pressed',on?'true':'false');
  });
}
/* live fit indicator: does the visible sheet still land on one page? */
function fdFitReport(){
  const el=document.getElementById('fdFit');if(!el)return;
  const pages=[...document.querySelectorAll('#foldersDoc .page')];
  if(!pages.length){el.textContent='';return;}
  let worst=0,who='';
  pages.forEach(p=>{
    const z=p.querySelector(':scope > .sec-zoom');
    const scale=z?(+z.style.zoom||1):1;
    const over=Math.max(p.offsetHeight-1056,z?(z.scrollHeight*scale)-p.clientHeight:0);
    if(over>worst){worst=over;who=secLabel(p.dataset.sec||'');}
  });
  if(worst<=2){
    el.className='fd-fit ok';
    el.textContent='Fits on '+pages.length+' page'+(pages.length===1?'':'s')+' ✓';
  }else{
    el.className='fd-fit bad';
    el.textContent=who+' overflows by ~'+(worst/96).toFixed(1)+'in — reduce type or hide a block';
  }
}
function fdPrint(which){
  const keep=FD_FILTER;
  FD_FILTER=which==='all'?null:which;
  printDoc('folders');
  setTimeout(()=>{FD_FILTER=keep;renderFolders();fdViewSync();},600);
}


/* ===== GAME SHEET RENDERER (ROA.docx style) ===== */
function sheetPageHTML(){
  const S=DATA.settings,G=DATA.game,R=DATA.report;
  const theme=teamTheme("Huntsville Havoc");
  const red=S.red||theme.primary;
  const stats=findTeamStats('Huntsville');
  // numerical order with a defense divider, matching the lineup chart
  const byNum=(a,b)=>(+a.num||999)-(+b.num||999);
  const active=DATA.roster.filter(p=>p.active!=='0');
  const forwards=active.filter(p=>p.pos!=='G'&&p.pos!=='D').sort(byNum);
  const defense=active.filter(p=>p.pos==='D').sort(byNum);
  const goalies=active.filter(p=>p.pos==='G').sort(byNum);

  const rowFor=(p)=>{
    const st=stats?stats.players.find(x=>x.num===p.num||norm(x.name)===norm(p.name)):null;
    const line=st?`${st.g}-${st.a}-${st.pts}`:'—';
    const bio=chartBio(p).join(' · ');
    const[first,...lastArr]=(p.name||'').split(' ');const last=lastArr.join(' ');
    return `<tr>
      <td class="gs-num">${p.num||''}</td><td class="gs-pos">${p.pos||''}</td>
      <td class="gs-first">${esc(first)}<div class="gs-last">${esc(last.toUpperCase())}${p.capt?' ('+esc(p.capt)+')':''}</div><div class="gs-home">${esc(p.birth||'')}</div></td>
      <td class="gs-hw">${esc(p.ht||'')}<br>${esc(p.wt||'')}</td>
      <td class="gs-stat">${line}<div class="gs-gp">${st?st.gp+' GP':''}</div></td>
      <td class="gs-bullets">${esc(bio)||'<span style="color:#aaa">No notes — add bio or import report</span>'}</td>
    </tr>`;
  };
  const goalieRow=(p)=>{
    const g=stats?stats.goalies.find(x=>x.num===p.num||norm(x.name)===norm(p.name)):null;
    const line=g?`${g.gaa} / ${g.svpct}`:'—';const rec=g?`${g.gp} GP / ${g.w}-${g.l}-${g.otl}`:'';
    const bio=chartBio(p).join(' · ');
    const[first,...lastArr]=(p.name||'').split(' ');const last=lastArr.join(' ');
    return `<tr><td class="gs-num">${p.num||''}</td><td class="gs-pos">G</td>
      <td class="gs-first">${esc(first)}<div class="gs-last">${esc(last.toUpperCase())}${p.capt?' ('+esc(p.capt)+')':''}</div><div class="gs-home">${esc(p.birth||'')}</div></td>
      <td class="gs-hw">${esc(p.ht||'')}<br>${esc(p.wt||'')}</td>
      <td class="gs-stat">${line}<div class="gs-gp">${rec}</div></td>
      <td class="gs-bullets">${esc(bio)||'<span style="color:#aaa">No notes</span>'}</td></tr>`;
  };

  // standings
  let standRows=R.standings.length?R.standings.map(s=>{const me=/Huntsville/.test(s.team);return `<tr class="${me?'me':''}"><td>${s.team}</td><td>${s.w}-${s.l}-${s.otl}</td><td>${s.pts} pts</td></tr>`;}).join(''):'<tr><td colspan="3" style="color:var(--ink-2)">Import report</td></tr>';
  // special teams strip
  const sp=R.special||{};const hs=sp['Huntsville']||{};const oppCity=teamCity(G.opp);const os=sp[oppCity]||{};
  const oppShort=(G.opp||'').replace('Huntsville Havoc','');

  const dateStr=G.date?new Date(G.date+'T00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'}):'';
  const doc=`<div class="page" style="--havoc-red:${red};width:816px">
    <div class="gs-head" style="background:${red}">
      <div class="gs-head-t">${esc(S.city)} ${esc(S.name)}</div>
      <div class="gs-head-s">${esc(G.hsvrec||'')} · ${G.homeaway==='@'?'@':'vs.'} ${esc(oppShort||'Opponent')} ${esc(G.opprec||'')} · ${dateStr}</div>
    </div>
    <table class="gs-table"><tbody>
      <tr class="gs-section"><td colspan="6">FORWARDS</td></tr>
      ${forwards.map(rowFor).join('')}
      <tr class="gs-section"><td colspan="6">DEFENSE</td></tr>
      ${defense.map(rowFor).join('')}
      <tr class="gs-section"><td colspan="6">GOALTENDERS</td></tr>
      ${goalies.map(goalieRow).join('')}
    </tbody></table>

    <div class="gs-bottom">
      <div class="gs-box">
        <h4>Team Comparison${esc(scopeSuffixFor('standings')||scopeSuffixFor('players'))}</h4>
        <table class="gs-cmp"><tr><td>${esc(S.name)}</td><td></td><td>${esc((oppShort||'OPP').toUpperCase())}</td></tr>
        <tr><td>${hs.pp||'—'}</td><td class="s">PP% vs PK%</td><td>${os.pk||'—'}</td></tr>
        <tr><td>${hs.pk||'—'}</td><td class="s">PK% vs PP%</td><td>${os.pp||'—'}</td></tr></table>
      </div>
      <div class="gs-box"><h4>SPHL Standings${esc(scopeSuffixFor('standings'))}</h4><table class="gs-stand">${standRows}</table></div>
    </div>
    <div class="gs-foot" style="border-color:${red}"><span>${esc(S.social)}</span><span>${esc(S.footer)}</span></div>
  </div>`;
  return doc;
}



/* ============================================================
   MULTI-PAGE GAME NOTES (packet style)
   ============================================================ */
/* ============ NEW PACKET PAGES (Roanoke/Macon models) ============ */
function mediaBlockHTML(cls){
  const S=DATA.settings;
  return `<div class="${cls||'media-block'}"><div class="mb-h">MEDIA RELATIONS</div><b>${esc(S.mediaName||'')}</b> | ${esc(S.mediaTitle||'')}<br>${esc(S.mediaOrg||'')}<br>${esc(S.mediaPhone||'')}<br>${esc(S.mediaEmail||'')}<br>${esc(S.mediaWeb||'')}</div>`;
}
function pgWrap(red,S,title,body){
  return `<div class="page" style="--havoc-red:${red}">
    <div class="pg-head" style="border-color:${red}"><div class="pg-logo">${logoHTML("Huntsville Havoc",'','H')}</div><div class="pg-title" style="color:${red}">${title}</div><div class="pg-num">__PGNO__</div></div>
    ${body}
    <div class="gn-foot"><span>${esc(S.social)}</span><span>${esc(S.footer)}</span><span>__PGNO__</span></div></div>`;
}
function leaders4Block(ts){
  if(!ts||!ts.players||!ts.players.length)return '<div style="color:var(--ink-2);font-size:9px">Sync live data or import the daily report for leaders.</div>';
  const activeSet=new Set(DATA.roster.filter(p=>p.active!=='0').map(p=>norm(p.name)));
  const Gx=DATA.game||{};
  const flagged=((Gx.ir||'')+'\n'+(Gx.echl||'')+'\n'+(Gx.scratch||'')).toLowerCase();
  const star=n=>{
    if(n&&flagged.trim()&&flagged.indexOf(String(n).toLowerCase())>=0)return '*';
    return activeSet.size&&!activeSet.has(norm(n))?'*':'';
  };
  const col=(title,key,fmt)=>{
    const top=[...ts.players].sort((a,b)=>(b[key]||0)-(a[key]||0)).slice(0,5);
    return `<div><div class="ldr-h">${title}</div>${top.map(p=>`<div class="ldr-r"><span>${esc(p.name)}${star(p.name)}</span><span>${fmt?fmt(p):(p[key]||0)}</span></div>`).join('')}</div>`;
  };
  return `<div class="ldr4">${col('G','g')}${col('A','a')}${col('PTS','pts')}${col('+/-','pm',p=>((p.pm||0)>=0?'+':'')+(p.pm||0))}</div><div style="font-size:7px;color:var(--ink-2);margin-top:2px">* not on current active roster</div>`;
}
function splitsPage(red,S){
  const sp=glSplits();
  const R=DATA.report;
  const spSlug=k=>'sp_'+String(k).toLowerCase().replace(/[^a-z0-9]+/g,'_');
  const splitRows=sp?sp.rows.map(r=>`<tr><td>${esc(r[0])}</td><td class="r">${ovCell(spSlug(r[0]),r[1])}</td></tr>`).join(''):naRow('Season splits','no completed games in the log yet');
  const naNote=`<tr><td>Record when scoring first / leading after 1st &amp; 2nd</td><td class="r" style="color:var(--ink-2)">N/A — tracked from box scores going forward</td></tr>`;
  const lt=glLastTime().map(r=>`<tr><td>${esc(r[0])}</td><td class="r">${ovCell(spSlug('lt_'+r[0]),r[1])}</td></tr>`).join('');
  const spc=(R.special||{})['Huntsville']||{};
  const ppVal=(typeof spc.pp==='string'?spc.pp:(spc.ppO&&spc.ppO.pct!=null?spc.ppO.pct+'%':null))||null;
  const pkVal=(typeof spc.pk==='string'?spc.pk:(spc.pkO&&spc.pkO.pct!=null?spc.pkO.pct+'%':null))||null;
  const stTable=`<table class="pk-t"><tr><th>Special teams</th><th class="r">Overall</th></tr>
    <tr><td>Power play</td><td class="r">${ovCell('sp_pp',ppVal)}</td></tr>
    <tr><td>Penalty kill</td><td class="r">${ovCell('sp_pk',pkVal)}</td></tr></table>`;
  const gp=(R.ext||{}).goalsByPeriod;
  const sgp=(k,i)=>ovCell('sp_gp_'+k+i,gp?gp[k][i]:null);
  const gpTable=`<table class="pk-t"><tr><th></th><th class="r">1st</th><th class="r">2nd</th><th class="r">3rd</th><th class="r">OT</th><th class="r">Total</th></tr>
    <tr><td>${esc(S.name)}</td><td class="r">${sgp('p1',0)}</td><td class="r">${sgp('p2',0)}</td><td class="r">${sgp('p3',0)}</td><td class="r">${sgp('ot',0)}</td><td class="r">${sgp('tot',0)}</td></tr>
    <tr><td>Opponents</td><td class="r">${sgp('p1',1)}</td><td class="r">${sgp('p2',1)}</td><td class="r">${sgp('p3',1)}</td><td class="r">${sgp('ot',1)}</td><td class="r">${sgp('tot',1)}</td></tr></table>`;
  return pgWrap(red,S,'SEASON SPLITS',`
    <div class="gn-cols">
      <div class="box"><h3>At a Glance</h3><table class="pk-t">${splitRows}${naNote}</table></div>
      <div>
        <div class="box"><h3>Last Time It Happened</h3><table class="pk-t">${lt}</table></div>
        <div class="box"><h3>Special Teams</h3>${stTable}</div>
        <div class="box"><h3>Goals by Period</h3>${gpTable}</div>
      </div>
    </div>`);
}
function gameLogPage(red,S){
  const gs=glGames();
  if(!gs.length)return pgWrap(red,S,'GAME-BY-GAME',`<div class="box"><h3>Game-by-Game Log</h3><div style="color:var(--ink-2);font-size:10px">No completed games in the log yet — results fill in automatically as the season goes.</div></div>`);
  let w=0,l=0,otl=0,sol=0;
  const rows=gs.map(g=>{
    if(g.wl==='W')w++;else if(g.wl==='OTL')otl++;else if(g.wl==='SOL')sol++;else l++;
    const rec=w+'-'+l+'-'+otl+'-'+sol;
    return `<tr><td>${fmtDateShort(g.d)}</td><td>${g.ha==='@'?'@ ':''}${esc(g.opp)}</td>
      <td>${g.wl} ${g.us}-${g.them}${g.otso?' ('+g.otso+')':''}</td><td class="r">${rec}</td><td class="r">${glPts(gs.slice(0,gs.indexOf(g)+1))}</td>
      <td class="r">${g.sf!=null&&g.sa!=null?g.sf+'-'+g.sa:'—'}</td>
      <td class="r">${g.ppg!=null&&g.ppa!=null?g.ppg+'/'+g.ppa:'—'}</td>
      <td class="r">${g.att?Number(g.att).toLocaleString():'—'}</td></tr>`;
  }).join('');
  return pgWrap(red,S,'GAME-BY-GAME',`<div class="box"><h3>Game-by-Game Log</h3>
    <table class="pk-t"><tr><th>Date</th><th>Opponent</th><th>Result</th><th class="r">Record</th><th class="r">PTS</th><th class="r">Shots F-A</th><th class="r">PP</th><th class="r">Att.</th></tr>${rows}</table>
    <div style="font-size:7px;color:var(--ink-2);margin-top:2px">Shots, PP and attendance come from the Game Log on the Schedule tab — fill as available.</div></div>`);
}
function rosterPronPage(red,S){
  const byNum=(a,b)=>(+a.num||999)-(+b.num||999);
  const act=(DATA.roster.filter(p=>p.active!=='0'));
  const grp=(t,list)=>list.length?`<div class="box"><h3>${t}</h3><table class="pk-t"><tr><th>#</th><th>Player</th><th>Sh</th><th class="r">Ht</th><th class="r">Wt</th><th>DOB</th><th class="r">Age</th><th>Hometown</th></tr>
    ${list.sort(byNum).map(p=>`<tr><td>${p.num||''}</td><td>${esc(dispName(p))} ${statSpan(p,'Huntsville')}</td><td>${p.sh||''}</td><td class="r">${p.ht||''}</td><td class="r">${p.wt||''}</td><td>${p.dob||''}</td><td class="r">${p.age||''}</td><td>${esc(p.birth||'')}</td></tr>`).join('')}</table></div>`:'';
  // per-player pronunciations first (imported or typed), then any extra Settings lines
  const rows=teamPronList(act);
  const have=new Set(rows.map(r=>norm(r.name)));
  (S.pronounce||'').split('\n').map(s=>s.trim()).filter(Boolean).forEach(l=>{
    const m=l.split(/\s*[-–—]\s*/);const nm=(m[0]||l).trim();
    if(!have.has(norm(nm)))rows.push({name:nm,say:m.slice(1).join(' - ')});
  });
  const pronBox=`<div class="box"><h3>Pronunciation Guide</h3>${rows.length?`<table class="pk-t">${rows.map(r=>`<tr><td>${esc(r.name)}</td><td class="r">${esc(r.say)}</td></tr>`).join('')}</table>`:'<div style="color:var(--ink-2);font-size:9px">Add pronunciations in Settings (one per line: NAME - pro-nun-see-AY-shun), or import the club bios on the Rosters tab.</div>'}</div>`;
  const H=DATA.hockeyOps||{};
  const staff=HO_ROLES.map(r=>{const e=H[r[0]]||{};return e.name?`<div class="h2h-line"><span>${r[1]}</span><span>${esc(e.name)}</span></div>`:'';}).join('');
  return pgWrap(red,S,'ROSTER',`
    ${grp('Forwards',act.filter(p=>p.pos!=='D'&&p.pos!=='G'))}
    ${grp('Defense',act.filter(p=>p.pos==='D'))}
    ${grp('Goaltenders',act.filter(p=>p.pos==='G'))}
    <div class="gn-cols">${pronBox}<div class="box"><h3>Hockey Operations</h3>${staff||'<div style="color:var(--ink-2);font-size:9px">Fill names on the Roster tab.</div>'}</div></div>`);
}
function recordsPage(red,S){
  const R=recBook();if(!R)return '';
  const tab=(t,rows)=>`<div class="box"><h3>${t}</h3><table class="pk-t">${rows.map(r=>`<tr><td>${esc(r[0])}</td><td class="r">${esc(r[1])}</td></tr>`).join('')}</table></div>`;
  return pgWrap(red,S,'FRANCHISE RECORDS',`
    <div class="gn-cols">
      <div>${tab('Career Leaders',R.career)}${tab('Team Records',R.team)}</div>
      <div>${tab('Single-Season — Skaters',R.players)}${tab('Single-Season — Goaltenders',R.goalies)}</div>
    </div>`);
}
function worksheetsPage(red,S){
  const G=DATA.game;
  const goalRows=Array.from({length:12},()=>'<tr><td></td><td></td><td></td><td></td><td></td><td></td></tr>').join('');
  const penRows=Array.from({length:10},()=>'<tr><td></td><td></td><td></td><td></td><td></td></tr>').join('');
  // officials strip: names when known, write-in lines when not
  const off=v=>v?`<b>${esc(v)}</b>`:'<span class="ws-blank"></span>';
  const officials=`<div class="ws-off"><span>REFEREE 1 ${off(G.ref1)}</span><span>REFEREE 2 ${off(G.ref2)}</span><span>LINESMAN 1 ${off(G.lin1)}</span><span>LINESMAN 2 ${off(G.lin2)}</span></div>`;
  // flex column per team: tables stretch so the sheet fills the page to the bottom
  const side=t=>`<div class="ws-side"><div class="ldr-h" style="font-size:10px;margin:4px 0;flex:0 0 auto">${esc(t)}</div>
    <div class="ws-tw" style="flex:12"><table class="pk-ws"><tr><th>#</th><th>Per</th><th>Time</th><th>Goal</th><th>Assist</th><th>Assist</th></tr>${goalRows}</table></div>
    <div style="height:8px;flex:0 0 auto"></div>
    <div class="ws-tw" style="flex:10"><table class="pk-ws"><tr><th>Per</th><th>Time</th><th>#</th><th>Infraction</th><th>Min</th></tr>${penRows}</table></div></div>`;
  return pgWrap(red,S,'SCORING &amp; PENALTY WORKSHEET',`
    ${officials}
    <div class="gn-cols ws-fill">${side(S.city+' '+S.name)}${side((G.opp||'Opponent').toUpperCase())}</div>`)
    .replace('<div class="page"','<div class="page ws-page"');
}
/* Transactions & inactives page — both teams' moves plus IR / call-ups / scratches */
function transPage(red,S){
  const G=DATA.game||{};
  const lines=t=>String(t||'').split('\n').map(x=>x.trim()).filter(Boolean);
  const list=(arr,empty)=>arr.length?arr.map(l=>`<div class="h2h-line"><span>${esc(l)}</span></div>`).join(''):`<div style="color:var(--ink-2);font-size:9px">${empty}</div>`;
  return pgWrap(red,S,'TRANSACTIONS &amp; INACTIVES',`
    <div class="gn-cols">
      <div>
        <div class="box"><h3>Inactives &mdash; Injured Reserve</h3>${list(lines(G.ir),'None')}</div>
        <div class="box"><h3>Inactives &mdash; ECHL Call-ups</h3>${list(lines(G.echl),'None')}</div>
        <div class="box"><h3>Scratches / Suspensions</h3>${list(lines(G.scratch),'None')}</div>
      </div>
      <div>
        <div class="box"><h3>${esc(S.city)} ${esc(S.name)} &mdash; Transactions</h3>${list(lines(G.txhome),'None entered &mdash; add on the This Game tab')}</div>
        <div class="box"><h3>${esc((G.opp||'Opponent').toUpperCase())} &mdash; Transactions</h3>${list(lines(G.txaway),'None entered &mdash; add on the This Game tab')}</div>
      </div>
    </div>`);
}
/* Pack blocks into pages by MEASURING them, not guessing: long written bios and
   club stat tables vary too much for an estimate to hold. */
function packMeasured(blocks,limitPx){
  if(!blocks.length)return [];
  const host=document.createElement('div');
  host.className='page';
  host.style.cssText='position:absolute;left:-10000px;top:0;visibility:hidden;min-height:0;box-shadow:none;';
  document.body.appendChild(host);
  const heights=blocks.map(h=>{host.innerHTML=h;return host.offsetHeight;});
  document.body.removeChild(host);
  const pages=[];let chunk=[],acc=0;
  blocks.forEach((h,i)=>{
    const c=heights[i];
    if(chunk.length&&acc+c>limitPx){pages.push(chunk);chunk=[];acc=0;}
    chunk.push(h);acc+=c;
  });
  if(chunk.length)pages.push(chunk);
  return pages;
}
function careerPages(red,S){
  const act=(DATA.roster.filter(p=>p.active!=='0'&&p.name));
  const blocks=[];
  act.forEach(p=>{
    const isG=p.pos==='G';
    const hc=htCareerFor(p);
    if(hc){ // full SPHL career straight from the league feed — every season, every team
      const reg=hc.rows.filter(r=>!r.playoffs);
      const po=hc.rows.filter(r=>r.playoffs);
      const tot=reg.reduce((t,r)=>{t.gp+=r.gp||0;t.g+=r.g||0;t.a+=r.a||0;t.pts+=r.pts||0;t.w+=r.w||0;t.l+=r.l||0;t.otl+=r.otl||0;t.so+=r.so||0;return t;},{gp:0,g:0,a:0,pts:0,w:0,l:0,otl:0,so:0});
      const head=isG?'<th class="r">GP</th><th class="r">W</th><th class="r">L</th><th class="r">OTL</th><th class="r">GAA</th><th class="r">SV%</th><th class="r">SO</th>'
        :'<th class="r">GP</th><th class="r">G</th><th class="r">A</th><th class="r">PTS</th><th class="r">PIM</th>';
      const row=r=>isG?`<td class="r">${r.gp}</td><td class="r">${r.w}</td><td class="r">${r.l}</td><td class="r">${r.otl}</td><td class="r">${esc(r.gaa)}</td><td class="r">${esc(r.svpct)}</td><td class="r">${r.so}</td>`
        :`<td class="r">${r.gp}</td><td class="r">${r.g}</td><td class="r">${r.a}</td><td class="r">${r.pts}</td><td class="r">${r.pim}</td>`;
      blocks.push(`<div class="box"><h3>${p.img?`<img class="pk-mug" src="${esc(p.img)}">`:''}#${p.num||''} ${esc(dispName(p))} — SPHL Career</h3>
        <table class="pk-t"><tr><th>Season</th><th>Team</th>${head}</tr>
        ${reg.map(r=>`<tr><td>${esc(r.season)}</td><td>${esc(r.team)}</td>${row(r)}</tr>`).join('')}
        <tr><td colspan="2"><b>SPHL totals</b></td>${isG?`<td class="r"><b>${tot.gp}</b></td><td class="r"><b>${tot.w}</b></td><td class="r"><b>${tot.l}</b></td><td class="r"><b>${tot.otl}</b></td><td class="r"></td><td class="r"></td><td class="r"><b>${tot.so}</b></td>`:`<td class="r"><b>${tot.gp}</b></td><td class="r"><b>${tot.g}</b></td><td class="r"><b>${tot.a}</b></td><td class="r"><b>${tot.pts}</b></td><td class="r"></td>`}</tr>
        ${po.length?`<tr><td colspan="${isG?9:7}" style="color:var(--ink-2)">Playoffs: ${po.map(r=>esc(r.season)+' '+r.gp+' GP'+(isG?'':' '+r.g+'-'+r.a+'-'+r.pts)).join(' · ')}</td></tr>`:''}</table></div>`);
      return;
    }
    const e=(typeof epEntryFor==='function'&&EP_STATIC)?epEntryFor(p):null;
    if(!e||!e.careerStats||!e.careerStats.length)return;
    const rows=e.careerStats.slice(-9);
    const totals=e.careerStats.reduce((t,s)=>{const x=s.stats||{};t.gp+=x.gp||0;t.g+=x.g||0;t.a+=x.a||0;t.p+=x.p||0;return t;},{gp:0,g:0,a:0,p:0});
    blocks.push(`<div class="box"><h3>#${p.num||''} ${esc(dispName(p))} — Career</h3>
      <table class="pk-t"><tr><th>Season</th><th>Team</th><th>League</th><th class="r">GP</th>${isG?'<th class="r">GAA</th><th class="r">SV%</th>':'<th class="r">G</th><th class="r">A</th><th class="r">PTS</th>'}</tr>
      ${rows.map(s=>{const x=s.stats||{};return `<tr><td>${esc(s.year)}</td><td>${esc(s.team)}</td><td>${esc(s.league)}</td><td class="r">${x.gp!=null?x.gp:''}</td>${isG?`<td class="r">${x.gaa!=null?x.gaa:''}</td><td class="r">${x.svp!=null?x.svp:''}</td>`:`<td class="r">${x.g!=null?x.g:''}</td><td class="r">${x.a!=null?x.a:''}</td><td class="r">${x.p!=null?x.p:''}</td>`}</tr>`;}).join('')}
      ${isG?'':`<tr><td colspan="3"><b>Career totals</b></td><td class="r"><b>${totals.gp}</b></td><td class="r"><b>${totals.g}</b></td><td class="r"><b>${totals.a}</b></td><td class="r"><b>${totals.p}</b></td></tr>`}</table>
      <div style="font-size:7px;color:var(--ink-2)">Career vs. each SPHL opponent, single-game highs and firsts: N/A — builds from per-game data going forward.</div></div>`);
  });
  // one page of blocks — the layout engine flows them onto as few sheets as fit
  return blocks.length?[pgWrap(red,S,'PLAYER CAREER STATS',blocks.join(''))]:[];
}


/* ============ PACKET SECTION PICKER ============ */
const PACKET_SECTIONS=[
  ['cover','Cover'],['meet','Meet the Team'],['ops','Hockey Operations'],['career','Player career stats (EP)'],
  ['scout','Scouting report'],['facts','Quick facts'],['splits','Season splits'],['gamelog','Game-by-game log'],
  ['roster','Roster + pronunciation'],['trans','Transactions & inactives'],['verbs','Verbiage & ice map'],['records','Franchise records'],['worksheets','Blank worksheets'],['gamesheet','Dense game sheet']
];
const PACKET_PRESETS={
  full:PACKET_SECTIONS.map(s=>s[0]),
  booth:['cover','scout','facts','splits','gamelog','roster','worksheets','gamesheet']
};
function pkSel(){
  const sel=DATA.settings.packetSel;
  return Array.isArray(sel)&&sel.length?sel:PACKET_PRESETS.full;
}
function pkRenderPicker(){
  const el=document.getElementById('pkSecs');if(!el)return;
  const sel=new Set(pkSel());
  el.innerHTML=PACKET_SECTIONS.map(s=>`<label style="display:flex;gap:4px;align-items:center;cursor:pointer"><input type="checkbox" ${sel.has(s[0])?'checked':''} onchange="pkToggle('${s[0]}',this.checked)">${s[1]}</label>`).join('');
}
function pkToggle(k,on){
  const sel=new Set(pkSel());
  if(on)sel.add(k);else sel.delete(k);
  DATA.settings.packetSel=PACKET_SECTIONS.map(s=>s[0]).filter(x=>sel.has(x));
  save();
}
function pkPreset(name){
  DATA.settings.packetSel=PACKET_PRESETS[name].slice();
  DATA.secAuto={};                     // each preset auto-fits on its own terms
  save();pkRenderPicker();renderPacket();
  toast(name==='booth'?'Booth packet preset applied':'Full packet preset applied');
}

/* the cover's watch box — the same milestone / franchise-race / record-watch
   lines the board and the Game Day strip show, capped for one printed sheet.
   Nothing in any window → no box (the cover never carries an empty frame). */
function pkWatchBox(){
  if(!MS_DATA)return '';
  const lines=msWatchLines('havoc',15);
  lines.push(...frBannerLines());
  const seen=new Set();
  const top=lines.sort((a,b)=>a.away-b.away).filter(x=>!seen.has(x.html)&&seen.add(x.html)).slice(0,4);
  const recs=recWatchRows().slice(0,2).map(recRowHTML).join('');
  if(!top.length&&!recs)return '';
  return `<div class="box"><h3>Milestone &amp; Record Watch</h3>
    ${top.map(x=>`<div class="pk-ms">${x.html}</div>`).join('')}${recs}</div>`;
}
function renderPacket(){
  const S=DATA.settings,G=DATA.game,R=DATA.report,N=DATA.notes||{};
  const red=S.red||'#C8102E';
  // warm the committed sources once; re-render when they land
  if(!MX_TRIED)matchupsLoad().then(m=>{if(m)renderPacket();});
  if(!SN26_TRIED)snapLoad().then(s=>{if(s)renderPacket();});
  if(!MS_DATA)msLoad().then(d=>{if(d)renderPacket();});
  const oppShort=(G.opp||'').replace(/Huntsville Havoc/,''),oppCity=teamCity(G.opp),oppAbbr=teamAbbrOf(G.opp)||'OPP';
  const hsv=findTeamStats('Huntsville'),opp=oppCity?findTeamStats(oppCity):null;
  const sp=R.special||{},hsvSp=sp['Huntsville']||{},oppSp=sp[oppCity]||{};
  const pages=[];

  /* ---------- PAGE 1: COVER ---------- */
  let standRows=R.standings.length?R.standings.map(s=>{const me=/Huntsville/.test(s.team);return `<tr class="${me?'me':''}"><td>${s.team}</td><td class="r">${s.w}</td><td class="r">${s.l}</td><td class="r">${s.otl}</td><td class="r">${s.sol!=null?s.sol:'—'}</td><td class="r">${s.pts}</td></tr>`;}).join(''):emptyRow(6,'No standings yet','run a Game Day Refresh on Live Data');
  const news=[[N.h1,N.b1],[N.h2,N.b2],[N.h3,N.b3]].filter(x=>x[0]||x[1]).map(x=>`<div class="news-item"><div class="h">${esc(x[0]||'')}</div><div class="b">${esc(x[1]||'')}</div></div>`).join('')||'<div class="b" style="color:var(--ink-2)">Add news on Print Center &rarr; Game Packet.</div>';
  const dateStr=G.date?new Date(G.date+'T00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'}):'DATE';
  const timeStr=G.time?formatTime(G.time):'7:05 P.M.';
  const cups=SPHL_REF.cups["Huntsville Havoc"]||[];
  const oppStand=standingsFor(G.opp);const hsvStand=standingsFor('Huntsville');
  // a standings-derived record may only replace the typed one when the standings
  // are genuinely this season's — fallback or leftover last-season data never wins
  const standsCurrent=(()=>{if(G.ps)return false;   // exhibition: the typed records stand
    const su=(R.seasonUsed||{}).standings;
    if(su)return su===activeSeasonId()&&!((R.seasonFallback||{}).standings);
    const d=Date.parse(String((R.daily||{}).date||''));return !!(d&&(Date.now()-d)<30*86400000);})();
  const stripRec=s=>(s&&standsCurrent)?`(${s.w}-${s.l}-${s.otl}${s.sol!=null?'-'+s.sol:''})`:'';
  pages.push(`<div class="page" style="--havoc-red:${red}">
    <div class="mc-strip">${esc(S.city)} ${esc(S.name)} ${stripRec(hsvStand)||esc(G.hsvrec?'('+G.hsvrec+')':'')} ${G.homeaway==='@'?'at':'vs.'} ${esc(oppShort||'Opponent')} ${stripRec(oppStand)||esc(G.opprec?'('+G.opprec+')':'')} | ${esc(G.venue||S.venue)}</div>
    ${seasonBannerHTML()}
    <div class="gn-top"><div class="gn-logo">${logoHTML("Huntsville Havoc",'','H')}</div>
      <div class="gn-title"><div class="city">${esc(S.city)}</div><div class="team">${esc(S.name)}</div>
        <div class="gn-bar"><span>SPHL MEMBER SINCE 2004</span><span class="red">${cups.length} PRESIDENTS CUP${cups.length!==1?'S':''} (${cups.join(', ')||'—'})</span><span>HUNTSVILLEHAVOC.COM</span></div>
        <div style="font-size:8px;margin-top:2px;letter-spacing:.03em">OFFICIALS &mdash; REFEREES: ${esc(G.ref1||'TBD')}, ${esc(G.ref2||'TBD')} &middot; LINESMEN: ${esc(G.lin1||'TBD')}, ${esc(G.lin2||'TBD')}</div></div>
      ${mediaBlockHTML('media-block')}</div>
    <div class="gn-matchup">
      <div class="gn-game-meta"><div class="gname">${G.ps?esc(sheetSeason())+' PRESEASON':'GAME '+esc(G.gameno||'—')}</div><div class="promo">${G.homeaway==='@'?'N/A (ROAD GAME)':esc(G.promo||'')}</div><div>${dateStr}</div>
        ${(()=>{if(G.homeaway==='@'){const v=venueFor(G.opp);if(v){const dual=fmtDualTime(G.time,v.tz);return `<div>PUCK DROP: ${dual||timeStr}</div><div>${esc(v.arena)} · ${esc(v.city)}${v.cap?' · cap. '+esc(String(v.cap).replace(/\s*•/g,'')):''} · ${esc(v.tz)} time</div>`;}}return `<div>PUCK DROP: ${timeStr}</div><div>${esc(G.venue||S.venue)}</div>`;})()}
        <div>${esc(G.broadcast||'')}</div></div>
      <div class="gn-vs"><div class="tn" style="color:${red}">${esc(S.city)}<br>${esc(S.name)}</div><div class="rec">(${esc(G.hsvrec||'—')})</div><div class="versus">${G.homeaway==='@'?'@':'vs.'}</div><div class="tn">${esc((oppShort||'OPPONENT').toUpperCase())}</div><div class="rec">(${esc(G.opprec||'—')})</div></div>
      <div class="gn-oppbox"><div class="gn-opp-logo">${logoHTML(G.opp,'',oppAbbr)}</div></div></div>
    <div class="gn-cols"><div><div class="box"><h3>Havoc News &amp; Notes</h3>${news}</div></div>
      <div><div class="box"><h3>SPHL Standings${esc(scopeSuffixFor('standings'))}</h3><table class="standings"><thead><tr><th>Team</th><th class="r">W</th><th class="r">L</th><th class="r">OTL</th><th class="r">SOL</th><th class="r">PTS</th></tr></thead><tbody>${standRows}</tbody></table>${G.ps?'<div class="b" style="font-size:8px;color:var(--ink-2)">Exhibition — tonight carries no standings consequence.</div>':''}</div></div></div>
    <div class="box"><h3>Last 5 — Both Teams</h3>
      <div class="l10-row"><span class="tm">${esc(S.name)}</span>${last10Block('Huntsville')}</div>
      <div class="l10-row"><span class="tm">${esc(oppShort||'Opponent')}</span>${last10Block(G.opp)}</div></div>
    <div class="gn-cols">
      <div><div class="box"><h3>Havoc Statistical Leaders${esc(scopeSuffixFor('players'))}</h3>${leaders4Block(hsv)}</div></div>
      <div>${(()=>{const awayTeam=G.homeaway==='@'?(S.city+' '+S.name):(G.opp||'Visiting team');const awayList=G.homeaway==='@'?DATA.roster:((G.opp&&DATA.oppRosters[G.opp])||[]);return pronBoxHTML('Pronunciation Guide — '+awayTeam,awayList,5);})()}</div>
    </div>
    ${pkWatchBox()}
    ${upNextBox()}
    <div class="gn-foot"><span>${esc(S.social)}</span><span>${esc(S.footer)}</span><span>__PGNO__</span></div></div>`);

  /* ---------- PAGE 2: SCOUTING REPORT ---------- */
  const h2h=SPHL_REF.hsvVs[G.opp];
  const oppNews=[[N.oh1,N.ob1],[N.oh2,N.ob2]].filter(x=>x[0]||x[1]).map(x=>`<div class="news-item"><div class="h">${esc(x[0]||'')}</div><div class="b">${esc(x[1]||'')}</div></div>`).join('')||'<div class="b" style="color:var(--ink-2)">Add opponent news on the Full Packet tab.</div>';
  // full match up panel, with league-ranked rates appended
  const muRows=matchupRows().concat(rankedMatchupRows());
  const muTable=`<table class="matchup"><thead><tr><th></th><th>${esc(S.city)} ${esc(S.name)}</th><th>${esc(oppShort||'Opponent')}</th></tr></thead><tbody>
    ${muRows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table>`;
  // head to head: all-time (from ref) + current season (from report).
  // A flagged series total carries its flag wherever it prints (standing law 1)
  const svNote=(SPHL_REF.hsvVsNote||{})[G.opp];
  const seasonH2H=seasonH2HText();
  const h2hBox=`<div class="box"><h3>Head-to-Head — Havoc vs. ${esc(oppShort||'Opp')}</h3>
    <div class="h2h-line"><span>All-time regular season</span><span>${h2h?(h2h.first?'<b>First meeting in franchise history</b>':esc(h2h.rs)):'—'}</span></div>
    <div class="h2h-line"><span>All-time playoffs</span><span>${(h2h&&!h2h.first)?esc(h2h.po):'—'}</span></div>
    <div class="h2h-line"><span>This season (W-L-OTL-SOL)</span><span>${seasonH2H?esc(seasonH2H):'—'}</span></div>
    ${svNote?`<div class="h2h-note">&#9432; ${esc(svNote)}</div>`:''}</div>`;
  // authored matchup notes from data/matchups.json — the committed source
  const mx=matchupsFor(G.opp);
  const stories=(((mx||{}).storylines)||[]).filter(x=>x&&(x.h||x.b));
  const storyBox=`<div class="box"><h3>${esc((oppShort||'Opponent').toUpperCase())} Storylines</h3>
    ${stories.length?stories.map(x=>`<div class="news-item"><div class="h">${esc(x.h||'')}</div><div class="b">${esc(x.b||'')}</div></div>`).join('')
     :`<div class="b" style="color:var(--ink-2)">&mdash; storylines to come &mdash; authored in data/matchups.json${G.opp?' ('+esc(G.opp)+')':''}.</div>`}
    ${(mx&&mx.series_note)?`<div class="h2h-note">&#9432; ${esc(mx.series_note)}</div>`:''}</div>`;
  // last 10 for both
  const l10Box=`<div class="box"><h3>Last 10 — Both Teams</h3>
    <div class="l10-row"><span class="tm">${esc(S.name)}</span>${last10Block('Huntsville')}</div>
    <div class="l10-row"><span class="tm">${esc(oppShort||'Opponent')}</span>${last10Block(G.opp)}</div></div>`;
  pages.push(`<div class="page" style="--havoc-red:${red}">
    <div class="pg-head" style="border-color:${red}"><div class="pg-logo">${logoHTML("Huntsville Havoc",'','H')}</div><div class="pg-title" style="color:${red}">SCOUTING REPORT</div><div class="pg-num">__PGNO__</div></div>
    <div class="box"><h3>Match Up${esc(scopeSuffixFor('standings')||scopeSuffixFor('players'))}</h3>${muTable}</div>
    ${finalCompBox()}
    <div class="gn-cols">${seriesBoxHTML(red)||h2hBox}${l10Box}</div>
    <div class="box"><h3>${esc((oppShort||'Opponent').toUpperCase())} News &amp; Notes</h3>${oppNews}
      ${(function(){const oc=getCoach(G.opp);return oc.name?`<div class="news-item"><div class="h">HEAD COACH — ${esc(oc.name)}</div><div class="b">${esc(oc.bio||'')}</div></div>`:'';})()}</div>
    ${storyBox}
    <div class="box"><h3>${esc((oppShort||'Opponent').toUpperCase())} Statistical Leaders${esc(scopeSuffixFor('players'))}</h3>${leadersBlock(opp)}</div>
    <div class="gn-foot"><span>${esc(S.social)}</span><span>${esc(S.footer)}</span><span>__PGNO__</span></div></div>`);

  /* ---------- PAGE 3: QUICK FACTS ---------- */
  const ext=R.ext||{};
  const gp=ext.goalsByPeriod;
  const gpc=(k,i)=>ovCell('qf_gp_'+k+i,gp?gp[k][i]:null);
  const gpTable=`<table class="qf-grid"><tr><th></th><th>1ST</th><th>2ND</th><th>3RD</th><th>OT</th><th>TOTAL</th></tr>
    <tr><td>Havoc</td><td>${gpc('p1',0)}</td><td>${gpc('p2',0)}</td><td>${gpc('p3',0)}</td><td>${gpc('ot',0)}</td><td>${gpc('tot',0)}</td></tr>
    <tr><td>Opp</td><td>${gpc('p1',1)}</td><td>${gpc('p2',1)}</td><td>${gpc('p3',1)}</td><td>${gpc('ot',1)}</td><td>${gpc('tot',1)}</td></tr></table>`;
  const atGlance=[
    ['Overall record','qf_overall',G.hsvrec||null],['Home','qf_home',ext.homeAway?ext.homeAway.home:null],['Away','qf_away',ext.homeAway?ext.homeAway.away:null],
    ['When scoring first','qf_first',ext.scoreFirst?`${ext.scoreFirst.w}-${ext.scoreFirst.l}-${ext.scoreFirst.otl}`:null],
    ['GF/game rank','qf_gfrank',ext.gfRank?`${ext.gfRank.val} (${ordinal(ext.gfRank.rank)})`:null]
  ];
  pages.push(`<div class="page" style="--havoc-red:${red}">
    <div class="pg-head" style="border-color:${red}"><div class="pg-logo">${logoHTML("Huntsville Havoc",'','H')}</div><div class="pg-title" style="color:${red}">QUICK FACTS</div><div class="pg-num">__PGNO__</div></div>
    <div class="gn-cols">
      <div class="box"><h3>${esc(sheetSeason())} Schedule</h3><div style="font-size:8px;color:var(--ink-2)">Paste schedule on Live Data to populate.</div>${scheduleTable()}</div>
      <div>
        <div class="box"><h3>Havoc at a Glance</h3><table class="qf-list">${atGlance.map(r=>`<tr><td>${r[0]}</td><td>${ovCell(r[1],r[2])}</td></tr>`).join('')}</table></div>
        <div class="box"><h3>Special Teams</h3><table class="qf-list"><tr><td>Power play</td><td>${ovCell('qf_pp',hsvSp.pp||null)}</td></tr><tr><td>Penalty kill</td><td>${ovCell('qf_pk',hsvSp.pk||null)}</td></tr></table></div>
        <div class="box"><h3>Roster Status</h3><table class="qf-list">
          <tr><td>IR</td><td>${esc((G.ir||'').split('\n').filter(Boolean).join(', ')||'None')}</td></tr>
          <tr><td>ECHL</td><td>${esc((G.echl||'').split('\n').filter(Boolean).join(', ')||'None')}</td></tr>
          <tr><td>Scratches</td><td>${esc((G.scratch||'').trim()||'None')}</td></tr>
        </table></div>
        <div class="box"><h3>Goals by Period</h3>${gpTable}</div>
        ${goalieNotesBox()}
      </div>
    </div>
    <div class="gn-foot"><span>${esc(S.social)}</span><span>${esc(S.footer)}</span><span>__PGNO__</span></div></div>`);

  /* ---------- assemble the selected sections in order ---------- */
  const sel=new Set(pkSel());
  const allPlayers=(DATA.roster.filter(p=>p.active!=='0'&&p.name)).sort((a,b)=>(+a.num||999)-(+b.num||999));
  // written bios make the cards vary wildly in height — they go out as one run
  // of blocks and the layout engine flows them, two or three to a sheet
  const meetPages=allPlayers.length?[meetTeamPage(allPlayers,hsv,R,red,S)]:[];
  const opsPage=hockeyOpsPage(red,S);
  const recsPage=recordsPage(red,S);
  let sheetPages=[];
  try{sheetPages=[sheetPageHTML().replace('<div class="page"','<div class="page" data-sheet="1"')];}catch(e){console.error('sheet page',e);}
  const secPages={
    cover:[pages[0]],
    meet:meetPages,
    ops:opsPage?[opsPage]:[],
    career:careerPages(red,S),
    scout:[pages[1]],
    facts:[pages[2]],
    splits:[splitsPage(red,S)],
    gamelog:[gameLogPage(red,S)],
    roster:[rosterPronPage(red,S)],
    trans:[transPage(red,S)],
    verbs:[verbsPage(red,S),iceMapPage(red,S)],
    records:recsPage?[recsPage]:[],
    worksheets:[worksheetsPage(red,S)],
    gamesheet:sheetPages
  };
  const outPages=[];
  PACKET_SECTIONS.forEach(s=>{if(sel.has(s[0]))(secPages[s[0]]||[]).forEach((p,j)=>outPages.push({k:s[0]+':'+j,sec:s[0],html:p}));});
  const stamp=dataStampHTML('packet');
  const doc=document.getElementById('packetDoc');
  // page numbers wait until the blocks have flowed — they are not knowable yet
  doc.innerHTML=outPages.map(pg2=>{
    let h=pg2.html.replace('<div class="gn-foot"',stamp+'<div class="gn-foot"');
    return h.replace('<div class="page','<div data-sec="'+pg2.sec+'" data-pk="'+pg2.k+'" class="hub-preview__page page');
  }).join('');
  stampMissing('packetDoc','packet');
  pkWireOv();
  pkRebuild();
  if(!PK_LAYOUT_BUSY){
    PK_LAYOUT_BUSY=true;
    try{const auto=pkAutoFit();DATA.secAutoLast=auto;}finally{PK_LAYOUT_BUSY=false;}
  }
  secRenderBar(null);secApplyAll();
  imagesReady(doc,3500).then(()=>{mtpDetectDefaults(doc);pkRebuild();secApplyAll();});
}
/* one pass of the layout: section sizes, then blocks flowed onto sheets */
function pkRebuild(){
  secApplyAll();
  pgFooterFix(document.getElementById('packetDoc'));
  pkLayout();
}

/* Goalie Notes — the tandem from the committed spine (works at GP=0), the
   current-season line when stats are published (scope-labeled), and any
   goalie milestone calls the shared helpers already computed. */
function goalieNotesBox(){
  if(!MS_DATA)return '';
  const gs=(MS_DATA.players||[]).filter(sp=>sp.type==='goalie'||String(sp.pos||'').toUpperCase()==='G');
  if(!gs.length)return '';
  const ts=findTeamStats('Huntsville');
  const scope=statsScopeLabel();
  const rows=gs.map(sp=>{
    const lastR=spineLastRows(sp).filter(r=>r.w!=null||r.gaa!=null||r.svs!=null);
    const last=lastR.length?lastR[0].season+' FINAL: '+lastR.map(r=>
      [r.gp+' GP',(r.w!=null?(r.w||0)+'-'+(r.l||0)+'-'+(r.otl||0):''),(r.gaa!=null?Number(r.gaa).toFixed(2)+' GAA':''),(r.svpct!=null?fmtSv(r.svpct)+' SV%':''),(r.so?r.so+' SO':'')].filter(Boolean).join(' · ')
      +(r.league&&r.league!=='SPHL'?' ('+r.league+')':'')).join(' / '):'';
    const g=ts?(ts.goalies||[]).find(x=>norm(x.name||'')===norm(sp.name)||(sp.num&&String(x.num)===String(sp.num))):null;
    const cur=g?((scope||'SEASON')+': '+(g.svpct||'—')+' SV% · '+(g.gaa||'—')+' GAA · '+(g.w||0)+'-'+(g.l||0)+'-'+(g.otl||0)):'';
    const hv=(msTotals(sp,'havoc')||{}).vals||{};
    const ent=(+hv.gp)?('Entering '+sheetSeason()+' (Havoc): '+hv.gp+' GP · '+(hv.w||0)+' W · '+(hv.so||0)+' SO'):'';
    const bits=[cur,last,ent].filter(Boolean);
    if(!bits.length)return '';
    return `<div class="news-item"><div class="h">${esc((sp.num?'#'+sp.num+' ':'')+sp.name)}</div><div class="b">${bits.map(esc).join('<br>')}</div></div>`;
  }).filter(Boolean).join('');
  if(!rows)return '';
  const lastNames=gs.map(sp=>String(sp.name).split(' ').pop());
  const ms=(typeof msWatchLines==='function'?msWatchLines('havoc',15):[])
    .filter(l=>lastNames.some(n=>String(l.html||'').indexOf(n)>=0)).slice(0,2)
    .map(l=>`<div class="pk-ms">${l.html}</div>`).join('');
  return `<div class="box"><h3>Goalie Notes</h3>${rows}${ms}</div>`;
}
function upNextBox(){
  const sched=parseScheduleData();const G=DATA.game;
  // find games after current date
  let upcoming=[];
  if(sched.length&&G.date){upcoming=sched.filter(s=>s.dateISO>G.date).slice(0,3);}
  if(!upcoming.length)return `<div class="box"><h3>Up Next</h3><div class="upnext"><div class="un"><div class="d">—</div></div><div class="un"><div class="d">—</div></div><div class="un"><div class="d">—</div></div></div></div>`;
  return `<div class="box"><h3>Up Next</h3><div class="upnext">${upcoming.map(u=>`<div class="un"><div class="d">${u.date}</div>${esc(u.opp)}</div>`).join('')}</div></div>`;
}
function parseScheduleData(){
  const raw=(DATA.notes&&DATA.notes.schedule)||'';if(!raw.trim())return [];
  const out=[];raw.split(/\r?\n/).forEach(l=>{
    const m=l.match(/^\s*(PS\s+)?(\d{1,2})\/(\d{1,2})\/(\d{2})\s+(vs\.?|@)\s+([A-Za-z .]+?)(?:\s\s+(.*))?$/i);
    if(!m)return;
    const ps=!!m[1];
    const yr='20'+m[4];const iso=`${yr}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
    const hv=m[5].replace('.','');const team=m[6].trim();
    let time='',result='',note='',rest=(m[7]||'').trim();
    const tm=rest.match(/^(\d{1,2}:\d{2}\s*[AP]\.?M\.?)\s*/i);
    if(tm){time=tm[1].trim();rest=rest.slice(tm[0].length);}
    const rm=rest.match(/^((?:W|L|OTL|SOL|T)\b[.,]?(?:\s*\d+\s*-\s*\d+)?(?:\s*\((?:OT|SO)\))?)\s*(.*)$/i);
    if(rm){result=rm[1].trim();rest=rm[2];}
    note=rest.trim();
    out.push({date:`${m[2]}/${m[3]}`,yy:m[4],dateISO:iso,hv,team,time,result,note,ps,opp:`${hv} ${team}`});
  });
  return out;
}
function rebuildScheduleText(games){
  return games.map(g=>`${g.ps?'PS ':''}${g.date}/${g.yy}  ${g.hv} ${g.team}${g.time?'  '+g.time:''}${g.result?'  '+g.result:''}${g.note?'  '+g.note:''}`).join('\n');
}
function setGameResult(iso){
  const games=parseScheduleData();
  const g=games.find(x=>x.dateISO===iso);if(!g)return;
  const cur=g.result||'';
  const entry=prompt(`Final for ${g.date} ${g.hv} ${g.team}${g.ps?' (preseason)':''}\nFormat: W 4-2 · L 1-3 · OTL 2-3 · W 4-2 (OT)\nLeave blank to clear.`,cur);
  if(entry===null)return;
  g.result=entry.trim();
  DATA.notes.schedule=rebuildScheduleText(games);save();
  const box=document.getElementById('sched_text');if(box)box.value=DATA.notes.schedule;
  renderSchedPreview();
  toast(g.result?'Result saved':'Result cleared');
}
function scheduleTable(){
  const s=parseScheduleData();if(!s.length)return '';
  return `<table class="qf-sched">${s.map(r=>`<tr><td>${r.date}</td><td>${esc(r.opp)}</td><td>${esc(r.result)}</td></tr>`).join('')}</table>`;
}

/* notes extra (opponent news + schedule) */
function loadNotesExtra(){const n=DATA.notes||{};['h1','b1','h2','b2','h3','b3','oh1','ob1','oh2','ob2'].forEach(k=>{if(n[k]!==undefined)setv('n_'+k,n[k]);});}
/* the schedule itself lives on Live Data (sched_text) — the packet only reads it */
function saveNotesExtra(){DATA.notes=DATA.notes||{};['h1','b1','h2','b2','h3','b3','oh1','ob1','oh2','ob2'].forEach(k=>{DATA.notes[k]=val('n_'+k);});save();}



/* ============================================================
   MATCH UP PANEL — full two-column comparison from report
   ============================================================ */
function matchupRows(){
  const G=DATA.game,R=DATA.report;
  const hsvCity='Huntsville',oppCity=teamCity(G.opp);
  const sH=standingsFor('Huntsville'),sO=standingsFor(G.opp);
  const spH=(R.special||{})['Huntsville']||{},spO=(R.special||{})[oppCity]||{};
  const recH=lastResults('Huntsville'),recO=lastResults(G.opp);
  const fmtPP=(o)=>o&&o.att!=null?`${o.made}/${o.att} (${o.pct}%)`:'—';
  const lastGame=(rec)=>{if(!rec||!rec.length)return '—';const g=rec[rec.length-1];return `${g.gf}-${g.ga} ${g.wl} ${g.home?'vs':'@'} ${g.opp}`;};
  const rows=[
    ['Season Record', sH?`${sH.w}-${sH.l}-${sH.otl}`:(G.hsvrec||'—'), sO?`${sO.w}-${sO.l}-${sO.otl}`:(G.opprec||'—')],
    ['Last 10', sH&&sH.last10?sH.last10:'—', sO&&sO.last10?sO.last10:'—'],
    ['Streak', sH&&sH.streak?sH.streak:'—', sO&&sO.streak?sO.streak:'—'],
    ['Last Game', lastGame(recH), lastGame(recO)],
    ['Home Record', sH&&sH.home?sH.home:'—', sO&&sO.home?sO.home:'—'],
    ['Away Record', sH&&sH.road?sH.road:'—', sO&&sO.road?sO.road:'—'],
    ['Goals For', sH&&sH.gf!=null?sH.gf:'—', sO&&sO.gf!=null?sO.gf:'—'],
    ['Goals Against', sH&&sH.ga!=null?sH.ga:'—', sO&&sO.ga!=null?sO.ga:'—'],
    ['Power Play', fmtPP(spH.ppO), fmtPP(spO.ppO)],
    ['Power Play (Home)', fmtPP(spH.ppH), fmtPP(spO.ppH)],
    ['Power Play (Away)', fmtPP(spH.ppR), fmtPP(spO.ppR)],
    ['Penalty Kill', fmtPP(spH.pkO), fmtPP(spO.pkO)],
    ['Penalty Kill (Home)', fmtPP(spH.pkH), fmtPP(spO.pkH)],
    ['Penalty Kill (Away)', fmtPP(spH.pkR), fmtPP(spO.pkR)]
  ];
  return rows;
}
function standingsFor(teamKeyword){
  if(!teamKeyword)return null;
  const k=teamCity(teamKeyword);
  return (DATA.report.standings||[]).find(s=>new RegExp(k,'i').test(s.team))||null;
}
function lastResults(teamKeyword){
  if(!teamKeyword)return [];
  const k=teamCity(teamKeyword);const rec=DATA.report.recent||{};
  for(const t of Object.keys(rec))if(new RegExp(k,'i').test(t))return rec[t];
  return [];
}
function last10Block(teamKeyword){
  const rec=lastResults(teamKeyword).slice(-10);
  if(!rec.length)return '<span style="color:var(--ink-2)">No recent games in report</span>';
  return rec.map(g=>`<span class="r10 ${g.wl==='W'?'w':(g.wl==='L'?'l':'t')}">${g.wl} ${g.gf}-${g.ga} ${g.home?'vs':'@'} ${esc(teamCity(g.opp))}</span>`).join(' ');
}
function seasonH2HText(){
  const G=DATA.game;if(!G.opp)return null;
  const hsv='HSV',oppAb=teamAbbrOf(G.opp);
  const h2h=DATA.report.seasonH2H||{};
  return h2h[hsv+'|'+oppAb]||h2h[oppAb+'|'+hsv]||null;
}

/* ============================================================
   GAME LOG — the per-game store every derived packet section
   reads from. Filled by the schedule feed (scores, attendance),
   backfilled from the schedule text, hand-edited for shots /
   special teams / fights on the Schedule tab.
   ============================================================ */
function glBackfill(){ // seed the log from schedule-text results
  DATA.gamelog=DATA.gamelog||{};
  parseScheduleData().forEach(g=>{
    if(!g.result||g.ps)return;
    const m=g.result.match(/^(W|L|OTL|SOL|T)\s*,?\s*(\d+)\s*-\s*(\d+)(?:\s*\((OT|SO)\))?/i);
    if(!m)return;
    const e=DATA.gamelog[g.dateISO]=DATA.gamelog[g.dateISO]||{};
    if(e.us==null){
      e.us=+m[2];e.them=+m[3];
      const res=m[1].toUpperCase();
      e.otso=(m[4]||'').toUpperCase()||(res==='OTL'?'OT':(res==='SOL'?'SO':''));
    }
    e.opp=e.opp||g.team;e.ha=e.ha||(g.hv.indexOf('@')===0?'@':'vs');
  });
}
function glGames(){ // sorted, classified entries
  glBackfill();
  return Object.keys(DATA.gamelog).sort().map(d=>{
    const e=DATA.gamelog[d];
    if(e.us==null||e.them==null)return null;
    let wl;
    if(e.us>e.them)wl='W';
    else if(e.us<e.them)wl=e.otso==='SO'?'SOL':(e.otso==='OT'?'OTL':'L');
    else wl='T';
    const dt=new Date(d+'T12:00');
    return {...e,d,wl,month:dt.toLocaleString('en-US',{month:'short'}),dow:dt.toLocaleString('en-US',{weekday:'short'})};
  }).filter(Boolean);
}
function glRec(list){ // W-L-OTL-SOL string
  const c={W:0,L:0,OTL:0,SOL:0};
  list.forEach(g=>{if(c[g.wl]!=null)c[g.wl]++;});
  return c.W+'-'+c.L+'-'+c.OTL+'-'+c.SOL;
}
function glPts(list){return list.reduce((t,g)=>t+(g.wl==='W'?2:(g.wl==='OTL'||g.wl==='SOL'?1:0)),0);}
function glStreak(list){
  if(!list.length)return '—';
  const last=list[list.length-1];const kind=last.wl==='W'?'W':'L';
  let n=0;
  for(let i=list.length-1;i>=0;i--){const k=list[i].wl==='W'?'W':'L';if(k!==kind)break;n++;}
  return n+kind;
}
function fmtDateShort(d){const p=d.split('-');return (+p[1])+'/'+(+p[2])+'/'+p[0].slice(2);}
function naRow(label,note){return `<tr><td>${label}</td><td class="r" style="color:var(--ink-2)">${note||'N/A'}</td></tr>`;}

/* season splits — everything derivable from the game log; honest N/A otherwise */
function glSplits(){
  const gs=glGames();
  if(!gs.length)return null;
  const by=f=>{const m={};gs.forEach(g=>{const k=f(g);(m[k]=m[k]||[]).push(g);});return m;};
  const rows=[];
  rows.push(['Overall',glRec(gs)+' ('+glPts(gs)+' pts)']);
  rows.push(['Home',glRec(gs.filter(g=>g.ha==='vs'))]);
  rows.push(['Road',glRec(gs.filter(g=>g.ha==='@'))]);
  const mo=by(g=>g.month);Object.keys(mo).forEach(m=>rows.push(['In '+m,glRec(mo[m])]));
  const dw=by(g=>g.dow);['Thu','Fri','Sat','Sun'].forEach(d=>{if(dw[d])rows.push(['On '+d,glRec(dw[d])]);});
  rows.push(['Scoring 4+ goals',glRec(gs.filter(g=>g.us>=4))]);
  rows.push(['Scoring 2 or fewer',glRec(gs.filter(g=>g.us<=2))]);
  rows.push(['One-goal games',glRec(gs.filter(g=>Math.abs(g.us-g.them)===1))]);
  rows.push(['Decided by 3+',glRec(gs.filter(g=>Math.abs(g.us-g.them)>=3))]);
  rows.push(['Overtime games',glRec(gs.filter(g=>g.otso==='OT'))]);
  rows.push(['Shootouts',glRec(gs.filter(g=>g.otso==='SO'))]);
  const outsh=gs.filter(g=>g.sf!=null&&g.sa!=null);
  if(outsh.length){
    rows.push(['When outshooting opponent',glRec(outsh.filter(g=>+g.sf>+g.sa))]);
    rows.push(['When outshot',glRec(outsh.filter(g=>+g.sf<+g.sa))]);
  }
  return {gs,rows};
}
function glLastTime(){
  const gs=glGames();
  const latest=pred=>{for(let i=gs.length-1;i>=0;i--){const g=gs[i];if(pred(g))return fmtDateShort(g.d)+' '+g.ha+' '+g.opp;}return 'never happened (this log)';};
  return [
    ['Overtime win',latest(g=>g.wl==='W'&&g.otso==='OT')],
    ['Shootout win',latest(g=>g.wl==='W'&&g.otso==='SO')],
    ['Shootout loss',latest(g=>g.wl==='SOL')],
    ['Shutout win',latest(g=>g.wl==='W'&&g.them===0)],
    ['Shut out (scoreless)',latest(g=>g.us===0)],
    ['Scored 6+ goals',latest(g=>g.us>=6)],
    ['Won by 4+',latest(g=>g.us-g.them>=4)],
    ['Lost by 4+',latest(g=>g.them-g.us>=4)],
    ['Crowd of 5,000+',latest(g=>g.att>=5000)]
  ];
}
/* series history vs tonight's opponent: all-time (reference) + this season (game log) */
function seriesBoxHTML(red){
  const G=DATA.game;if(!G.opp)return '';
  const oppCity=teamCity(G.opp);
  const ref=SPHL_REF.hsvVs[G.opp];
  const vs=glGames().filter(g=>g.opp&&g.opp.indexOf(oppCity)===0);
  const last=vs[vs.length-1];
  const line=(a,b)=>`<div class="h2h-line"><span>${a}</span><span>${b}</span></div>`;
  return `<div class="box"><h3>Series History — vs. ${esc(oppCity)}</h3>
    ${line('All-time regular season',ref?(ref.first?'<b>First meeting in franchise history</b>':esc(ref.rs)):'—')}
    ${line('All-time playoffs',(ref&&!ref.first)?esc(ref.po):'—')}
    ${line('This season',vs.length?glRec(vs):'no meetings yet')}
    ${line('This season at home',vs.length?glRec(vs.filter(g=>g.ha==='vs')):'—')}
    ${line('This season on the road',vs.length?glRec(vs.filter(g=>g.ha==='@')):'—')}
    ${line('Current streak in series',vs.length?glStreak(vs):'—')}
    ${line('Last meeting',last?(fmtDateShort(last.d)+' — '+(last.wl==='W'?'W':'L')+' '+last.us+'-'+last.them+(last.otso?' ('+last.otso+')':'')):'—')}
    ${(SPHL_REF.hsvVsNote||{})[G.opp]?`<div class="h2h-note">&#9432; ${esc(SPHL_REF.hsvVsNote[G.opp])}</div>`:''}
  </div>`;
}
/* league ranks for the Matching Up table */
function lgRank(arr,val,higherBetter){
  const sorted=[...arr].sort((a,b)=>higherBetter?b.v-a.v:a.v-b.v);
  const i=sorted.findIndex(x=>x.me);
  return i<0?null:i+1;
}
function rankedMatchupRows(){
  const G=DATA.game,R=DATA.report;
  const S=R.standings||[];
  const oppCity=teamCity(G.opp);
  const mk=city=>S.map(s=>({v:0,me:new RegExp('^'+city,'i').test(s.team),s}));
  const val=(city,f)=>{const s=S.find(x=>new RegExp('^'+city,'i').test(x.team));return s&&s.gp?f(s):null;};
  const rk=(city,f,hb)=>{
    const arr=S.filter(s=>s.gp).map(s=>({v:f(s),me:new RegExp('^'+city,'i').test(s.team)}));
    return arr.length?lgRank(arr,null,hb):null;
  };
  const fmt=(v,r)=>v==null?'—':(v.toFixed(2)+(r?' ('+ordinal(r)+')':''));
  const pct=city=>{const sp=(R.special||{})[city]||{};let p=sp.pp;if(p&&typeof p==='object')p=p.pct;let k=sp.pk;if(k&&typeof k==='object')k=k.pct;
    return {pp:typeof sp.pp==='string'?sp.pp:(sp.ppO&&sp.ppO.pct!=null?sp.ppO.pct+'%':null),
            pk:typeof sp.pk==='string'?sp.pk:(sp.pkO&&sp.pkO.pct!=null?sp.pkO.pct+'%':null)};};
  const rows=[];
  if(S.length){
    const gpg=s=>s.gf/s.gp, gapg=s=>s.ga/s.gp;
    rows.push(['Goals Per Game (rank)',fmt(val('Huntsville',gpg),rk('Huntsville',gpg,true)),fmt(val(oppCity,gpg),rk(oppCity,gpg,true))]);
    rows.push(['Goals Against Per Game (rank)',fmt(val('Huntsville',gapg),rk('Huntsville',gapg,false)),fmt(val(oppCity,gapg),rk(oppCity,gapg,false))]);
  }
  const pH=pct('Huntsville'),pO=pct(oppCity);
  if(pH.pp||pO.pp)rows.push(['Power Play %',pH.pp||'—',pO.pp||'—']);
  if(pH.pk||pO.pk)rows.push(['Penalty Kill %',pH.pk||'—',pO.pk||'—']);
  return rows;
}
/* auto-draft the news blurbs from the latest result + top scorer (edit, don't retype) */
function autoDraftNews(){
  const gs=glGames();const S=DATA.settings;
  const last=gs[gs.length-1];
  if(last&&!val('n_h1')){
    const won=last.wl==='W';
    setv('n_h1',(S.name||'HAVOC').toUpperCase()+(won?' TOP ':' FALL TO ')+last.opp.toUpperCase()+' '+Math.max(last.us,last.them)+'-'+Math.min(last.us,last.them));
    setv('n_b1','The '+(S.name||'Havoc')+' '+(won?'defeated':'fell to')+' '+last.opp+' '+last.us+'-'+last.them+(last.otso?' in '+(last.otso==='SO'?'a shootout':'overtime'):'')+' on '+fmtDateShort(last.d)+', and are '+glRec(gs.slice(-10))+' over the last ten.');
  }
  const hsv=findTeamStats('Huntsville');
  if(hsv&&hsv.players.length&&!val('n_h2')){
    const top=[...hsv.players].sort((a,b)=>b.pts-a.pts)[0];
    const lastName=(top.name||'').split(' ').pop().toUpperCase();
    setv('n_h2',lastName+' PACING THE OFFENSE');
    setv('n_b2',top.name+' leads the team in scoring with '+top.g+' goals and '+top.a+' assists for '+top.pts+' points in '+top.gp+' games.');
  }
  const streak=gs.length?glStreak(gs):'';
  if(gs.length&&!val('n_h3')&&parseInt(streak)>=3){
    setv('n_h3',streak.endsWith('W')?('WIN STREAK AT '+parseInt(streak)):('SKID REACHES '+parseInt(streak)));
    setv('n_b3','The club has '+(streak.endsWith('W')?'won':'dropped')+' '+parseInt(streak)+' straight entering tonight.');
  }
  toast('News drafted — edit, then Refresh packet');
}

/* ============================================================
   LONGER MEDIA-PACKAGE BIO (game sheet)
   Combines written notes + a generated narrative from synced stats.
   ============================================================ */
function mediaBio(p, teamStats, allReport, skipNotes){
  const written=(p.notes||'').split('\n').map(s=>s.trim()).filter(Boolean);
  const sentences=[];
  // lead: who they are
  const posName={C:'center',LW:'left wing',RW:'right wing',D:'defenseman',G:'goaltender'}[p.pos]||'';
  let lead=`${p.name}`;
  const bits=[];
  if(p.ht||p.wt)bits.push(`${p.ht||''}${p.ht&&p.wt?', ':''}${p.wt||''}`.trim());
  if(p.birth)bits.push(`of ${p.birth}`);
  if(p.age)bits.push(`age ${p.age}`);
  if(posName)lead+=` is a ${posName}`;
  if(bits.length)lead+=` (${bits.join(', ')})`;
  lead+='.';
  sentences.push(lead);
  // season production
  if(p.pos==='G'){
    const g=teamStats?teamStats.goalies.find(x=>x.num===p.num||norm(x.name)===norm(p.name)):null;
    if(g){
      sentences.push(`This season he is ${g.w}-${g.l}-${g.otl} with a ${g.gaa} goals-against average and a ${g.svpct} save percentage across ${g.gp} appearances${g.so>0?`, including ${g.so} shutout${g.so>1?'s':''}`:''}.`);
      if(g.svs&&g.sa)sentences.push(`He has turned aside ${g.svs} of ${g.sa} shots faced.`);
      if(allReport){const allG=[];Object.values(allReport.teamStats||{}).forEach(t=>t.goalies.forEach(x=>{if(x.gp>=2)allG.push(x);}));allG.sort((a,b)=>parseFloat(b.svpct)-parseFloat(a.svpct));const rk=allG.findIndex(x=>norm(x.name)===norm(g.name));if(rk>=0&&rk<6)sentences.push(`That save percentage ranks ${ordinal(rk+1)} among SPHL goaltenders.`);}
    }
  }else{
    const st=teamStats?teamStats.players.find(x=>x.num===p.num||norm(x.name)===norm(p.name)):null;
    if(st){
      sentences.push(`Through ${st.gp} games he has ${st.g} goal${st.g!==1?'s':''} and ${st.a} assist${st.a!==1?'s':''} for ${st.pts} point${st.pts!==1?'s':''}, with a ${st.pm>=0?'plus':'minus'}-${Math.abs(st.pm)} rating and ${st.pim} penalty minutes.`);
      const extras=[];
      if(st.pp>0)extras.push(`${st.pp} power-play goal${st.pp>1?'s':''}`);
      if(st.shg>0)extras.push(`${st.shg} shorthanded goal${st.shg>1?'s':''}`);
      if(st.gw>0)extras.push(`${st.gw} game-winner${st.gw>1?'s':''}`);
      if(st.shots)extras.push(`${st.shots} shots on goal`);
      if(extras.length)sentences.push(`He has recorded ${listJoin(extras)}.`);
      // team / league context
      const ptsRank=[...teamStats.players].sort((a,b)=>b.pts-a.pts).findIndex(x=>norm(x.name)===norm(st.name));
      if(ptsRank===0)sentences.push(`He leads the Havoc in scoring.`);
      else if(ptsRank>0&&ptsRank<3)sentences.push(`He ranks ${ordinal(ptsRank+1)} on the team in scoring.`);
      if(allReport){const allP=[];Object.values(allReport.teamStats||{}).forEach(t=>t.players.forEach(x=>allP.push(x)));allP.sort((a,b)=>b.pts-a.pts);const lrk=allP.findIndex(x=>norm(x.name)===norm(st.name));if(lrk>=0&&lrk<15&&st.pts>0)sentences.push(`Leaguewide, he sits ${ordinal(lrk+1)} in SPHL scoring.`);}
    }
  }
  // append the hand-written media bio as its own sentences
  if(!skipNotes)written.forEach(w=>{const t=w.replace(/^[•\-\s]+/,'').trim();if(t)sentences.push(t.endsWith('.')?t:t+'.');});
  return sentences.join(' ');
}
function listJoin(arr){if(arr.length===1)return arr[0];if(arr.length===2)return arr[0]+' and '+arr[1];return arr.slice(0,-1).join(', ')+', and '+arr[arr.length-1];}

