/* Milestones — career totals and everything that watches them: the shared
   stats-table sort, the committed-file loaders (spine, bios, matchups, the
   2025-26 snapshot), the milestone boards, the all-time franchise race, the
   staff/coaching board and the franchise record watch. Career math itself is
   canonical in js/career-math.js; these are its consumers. Extracted verbatim. */

/* ============================================================
   CAREER STATS & MILESTONE TRACKER — driven by data/havoc_players.json.
   The site only ever reads the committed JSON; the EliteProspects key
   lives in .env / a GitHub secret and is used by scripts/update_stats.mjs
   on a machine, never in this file. Rules from the build brief:
   Pro = league in meta.pro_leagues (never NCAA/juniors); Havoc = rows
   where team === "Huntsville Havoc"; regular season only; null prints
   as "—", never zero, never invented; an override from Jacob's tracker
   beats a computed sum until the season rows are complete.
   ============================================================ */
/* ============================================================
   SHARED TABLE SORT — every stats table runs through this one
   utility. tsWire(container,key) after a render makes headers
   clickable: first click is leaders-first for stat columns,
   A-to-Z for names / seasons / ranks / jersey numbers, and GAA
   starts low-is-good; a second click reverses, and ▲/▼ marks
   the active column. Sorting moves the rendered rows themselves,
   so badges, chips, row highlights and info popovers travel with
   their row (and nth-child striping recomputes on its own).
   Group headers and totals rows hold position — the runs of data
   rows between them sort independently. A blank or — always
   sinks to the bottom in either direction: a missing number is
   not a 0. State is per table key, so each tab keeps its own
   last sort across switches.
   ============================================================ */
const TSORT={};
const TS_COLS={ /* header label -> [value type, ascending-first] */
  '#':['num',1],'RANK':['num',1],
  'PLAYER':['text',1],'NAME':['text',1],'GOALIE':['text',1],'COACH':['text',1],
  'TEAM':['text',1],'LEAGUE':['text',1],'OPP':['text',1],'POS':['text',1],
  'YEARS':['text',1],'HOMETOWN':['text',1],'SH':['text',1],'HT':['text',1],'LVL':['text',1],
  'SEASON':['season',1],
  'GAA':['num',1],
  'GP':['num',0],'G':['num',0],'A':['num',0],'PTS':['num',0],'PIM':['num',0],'+/-':['num',0],
  'W':['num',0],'L':['num',0],'T':['num',0],'OTL':['num',0],'SO':['num',0],
  'SV%':['num',0],'SVS':['num',0],'S':['num',0],'PPG':['num',0],'GWG':['num',0],'SHG':['num',0],
  'P/GP':['num',0],'WT':['num',0],'AGE':['num',0],'SEASONS':['num',0],'CUPS':['num',0]
};
function tsSpec(th){
  const label=th.textContent.replace(/[▴▾▲▼]/g,'').trim().toUpperCase();
  return TS_COLS[label]||null;
}
function tsVal(td,type){
  const raw=(td?td.textContent:'').trim();
  if(!raw||raw==='—'||raw==='–')return null;
  if(type==='text')return raw.replace(/^#\d+\s*/,'').toLowerCase();  // "#12 Gio…" sorts by the name
  if(type==='season'){const m=raw.match(/\d{4}/);return m?+m[0]:null;}
  const m=raw.replace(/^T-/,'').match(/[+-]?\d*\.?\d+/);
  return m?parseFloat(m[0]):null;
}
function tsWire(root,prefix,opts){
  if(!root)return;
  [...root.querySelectorAll('table')].forEach((t,i)=>{
    if(t.classList.contains('ts-skip'))return;
    const hrow=t.rows[0];
    if(!hrow||!hrow.querySelector('th'))return;
    const key=prefix+':'+i;
    t.dataset.tskey=key;
    [...hrow.cells].forEach(th=>{
      if(!tsSpec(th))return;
      th.classList.add('ts-h');
      th.addEventListener('click',tsClick);
    });
    // remember each row's official rank (the # cell as rendered) so dynamic
    // re-ranking can restore it and show it as the small gray second line
    [...(t.tBodies[0]||t).rows].forEach(r=>{
      const c=[...r.cells].find(x=>x.classList&&x.classList.contains('fr-rk'));
      if(c&&c.dataset.rk0html==null){c.dataset.rk0html=c.innerHTML;c.dataset.rk0=(c.textContent.split('▲')[0]||'').trim();}
    });
    const st=TSORT[key]||(opts&&opts.def);
    if(st&&hrow.cells[st.col]&&tsSpec(hrow.cells[st.col])){
      TSORT[key]=TSORT[key]||{col:st.col,dir:st.dir};
      tsApply(t,st.col,st.dir);
    }
  });
}
function tsClick(e){
  const th=e.currentTarget,t=th.closest('table');
  const key=t.dataset.tskey,ci=th.cellIndex,spec=tsSpec(th);
  if(!spec)return;
  const cur=TSORT[key];
  const dir=(cur&&cur.col===ci)?-cur.dir:(spec[1]?1:-1);
  TSORT[key]={col:ci,dir};
  tsApply(t,ci,dir);
}
function tsApply(t,ci,dir){
  const hrow=t.rows[0];const spec=tsSpec(hrow.cells[ci]);if(!spec)return;
  const type=spec[0];
  [...hrow.cells].forEach((h,i)=>{
    h.querySelectorAll('.ts-i').forEach(x=>x.remove());
    if(i===ci)h.insertAdjacentHTML('beforeend',`<span class="ts-i">${dir>0?'▲':'▼'}</span>`);
  });
  const body=t.tBodies[0]||t;
  const isAnchor=r=>r.classList.contains('ms-grp')||r.classList.contains('ms-tot')||!!r.querySelector('th');
  const rows=[...body.rows].filter(r=>r!==hrow);
  // a rank cell's display is dynamic — sort it by its stamped canonical rank
  const cellVal=r=>{
    const c=r.cells[ci];
    if(c&&c.dataset&&c.dataset.rk0!=null){const m=String(c.dataset.rk0).replace(/^T-/,'').match(/\d+/);return m?+m[0]:null;}
    return tsVal(c,type);
  };
  const cmp=(a,b)=>{
    const av=cellVal(a),bv=cellVal(b);
    if(av==null&&bv==null)return 0;
    if(av==null)return 1;                      // nulls sink, both directions
    if(bv==null)return -1;
    if(type==='text')return dir*String(av).localeCompare(String(bv));
    return av<bv?-dir:(av>bv?dir:0);
  };
  const segs=[];let run=[];
  rows.forEach(r=>{if(isAnchor(r)){segs.push({rows:run,end:r});run=[];}else run.push(r);});
  segs.push({rows:run,end:null});
  segs.forEach(s=>{
    if(s.rows.length<2)return;
    [...s.rows].sort(cmp).forEach(r=>body.insertBefore(r,s.end));
  });
  tsRanks(t,ci,type);
}
/* The # column on ranked lists is never stored data — it recomputes for
   whatever stat the table is sorted by: ties on the sorted value share a
   rank (T-45, T-45, then 47), a row with — in that column gets — for a
   rank, and a name/season sort blanks the ranks entirely, because a rank
   only means something on a stat. The official list rank survives as a
   small gray second line whenever it differs, so the canonical order is
   never lost. Sorting by # itself restores the canonical cells. */
function tsRanks(t,ci,type){
  const body=t.tBodies[0]||t;
  const rows=[...body.rows].filter(r=>r!==t.rows[0]&&!r.querySelector('th'));
  const cells=rows.map(r=>[...r.cells].find(c=>c.classList.contains('fr-rk'))||null);
  if(!cells.some(Boolean))return;
  const rkIdx=cells.find(Boolean).cellIndex;
  const off=c=>c.dataset.rk0?`<span class="rk-off" title="official rank on the list's default sort">${c.dataset.rk0}</span>`:'';
  if(ci===rkIdx){cells.forEach(c=>{if(c&&c.dataset.rk0html!=null)c.innerHTML=c.dataset.rk0html;});return;}
  if(type!=='num'){cells.forEach(c=>{if(c)c.innerHTML='—'+off(c);});return;}
  const spec=tsSpec(t.rows[0].cells[ci])||['num',0];
  const betterLow=!!spec[1];                       // GAA-style: lower is better
  const vals=rows.map(r=>tsVal(r.cells[ci],'num'));
  rows.forEach((r,i)=>{
    const c=cells[i];if(!c)return;
    const v=vals[i];
    if(v==null){c.innerHTML='—'+off(c);return;}
    const rk=1+vals.filter(x=>x!=null&&(betterLow?x<v:x>v)).length;
    const txt=(vals.filter(x=>x===v).length>1?'T-':'')+rk;
    c.innerHTML=txt+(c.dataset.rk0&&c.dataset.rk0!==txt?off(c):'');
  });
}
let MS_DATA=null,MS_VIEW='pro';
/* career math is CANONICAL in js/career-math.js — these are thin delegates
   so every existing call site keeps its name (P0A consolidation, audit D-1) */
function msProLeagues(){return CareerMath.proLeagues((MS_DATA||{}).meta);}
function msIsPro(row){return CareerMath.isPro(row,msProLeagues());}
function msIsHavoc(row){return CareerMath.isHavoc(row);}
/* null-respecting sum: null in means unknown, and an unknown never becomes 0 */
function msSum(rows,keys){return CareerMath.sum(rows,keys);}
/* career = baseline_<scope> + current_season (the §4 model) — 2026-27 is Havoc
   SPHL hockey, so the live counters count in BOTH scopes. Milestones, the
   record watch and the franchise race all run off this one canonical result. */
function msTotals(p,scope){return CareerMath.totals(p,scope,(MS_DATA||{}).meta);}
/* the single shared milestone function from the brief */
function msWithin(val,step,window){
  if(val==null)return null;
  const next=Math.ceil((val+1)/step)*step;
  return next-val<=window?{next,away:next-val}:null;
}
const MS_RULES={
  skater:{gp:[100,25],g:[50,10],a:[50,10],pts:[50,15]},
  goalie:{gp:[100,25],w:[50,10]}
};
function msTier(away){return away<=5?'soon':(away<=15?'up':'far');}
function msTierLabel(away){return away<=5?'soon':(away<=15?'upcoming':'this season');}
function msFlags(p,vals){
  const rules=MS_RULES[p.type==='goalie'?'goalie':'skater'];
  const out={};
  Object.keys(rules).forEach(k=>{
    const hit=msWithin(vals[k],rules[k][0],rules[k][1]);
    if(hit)out[k]=hit;
  });
  return out;
}
function msCell(v){return v==null?'<span class="ms-null">—</span>':String(v);}
/* "away" counts in games only make sense for GP; for scoring stats it is
   simply how many more he needs — the brief's rule */
function msBadge(k,hit){
  const unit=k==='gp'?(hit.away===1?'game':'games'):(k==='w'?(hit.away===1?'win':'wins'):'');
  return `<span class="ms-badge ${msTier(hit.away)}" title="${msTierLabel(hit.away)}">${hit.away}${unit?' '+unit:''} from ${hit.next}</span>`;
}
async function msLoad(){
  if(MS_DATA)return MS_DATA;
  // the COMMITTED file always outranks a browser snapshot — an old import must
  // never permanently shadow committed counter updates and corrections
  try{
    const r=await fetch('data/havoc_players.json',{cache:'no-cache'});
    if(r.ok){MS_DATA=await r.json();return MS_DATA;}
  }catch(e){}
  // offline / file:// only: the last imported copy is better than nothing
  if(DATA.careersFile){MS_DATA=DATA.careersFile;return MS_DATA;}
  return null;
}
/* ---- authored prose: data/bios.json — written on the Mac, committed, and
   NEVER edited by the site. The hub only reads it. ---- */
let BIOS_FILE=null,BIOS_TRIED=false,BIOS_IDX=null;
async function biosLoad(){
  if(BIOS_FILE||BIOS_TRIED)return BIOS_FILE;
  BIOS_TRIED=true;
  try{
    const r=await fetch('data/bios.json',{cache:'no-cache'});
    if(r.ok)BIOS_FILE=await r.json();
  }catch(e){}
  return BIOS_FILE;
}
/* data/matchups.json — authored opponent matchup notes for the packet's
   scouting report (storylines + optional series caveat). Committed JSON is
   the source; the Hub only renders it. */
let MX_FILE=null,MX_TRIED=false;
async function matchupsLoad(){
  if(MX_FILE||MX_TRIED)return MX_FILE;
  MX_TRIED=true;
  try{
    const r=await fetch('data/matchups.json',{cache:'no-cache'});
    if(r.ok)MX_FILE=await r.json();
  }catch(e){}
  return MX_FILE;
}
function matchupsFor(team){return ((MX_FILE||{}).teams||{})[team]||null;}
/* the committed 2025-26 FINAL snapshot (official feed, validated) — the
   packet's prior-season team comparison never needs a live fetch to print */
let SN26=null,SN26_TRIED=false;
async function snapLoad(){
  if(SN26||SN26_TRIED)return SN26;
  SN26_TRIED=true;
  try{
    const r=await fetch('data/season2526_final.json',{cache:'no-cache'});
    if(r.ok)SN26=await r.json();
  }catch(e){}
  return SN26;
}
function snapStanding(team){
  if(!SN26||!team)return null;
  const k=teamCity(team);
  return (SN26.standings||[]).find(s=>new RegExp(k,'i').test(s.team))||null;
}
/* 2025-26 FINAL REGULAR SEASON — team comparison from the committed snapshot.
   A club that played last season outside the SPHL (Pee Dee, Athens — FPHL)
   never compares side-by-side (§17): the box says so and points at their
   league-labeled context instead. Per-game rates are display division only. */
function finalCompBox(){
  if(!SN26)return '';
  const G=DATA.game;if(!G.opp)return '';
  const h=snapStanding('Huntsville Havoc');if(!h)return '';
  const o=snapStanding(G.opp);
  const lm=String(SN26.season_label||'').match(/^(\d{4})-\d{2}(\d{2})/);
  const short=lm?lm[1]+'-'+lm[2]:'last season';
  const fmt=v=>v==null?'—':v;
  const pg=(n,gp)=>(n!=null&&gp)?(n/gp).toFixed(2):'—';
  const rec=s=>`${s.w}-${s.l}-${s.otl}${s.sol!=null?'-'+s.sol:''}`;
  const rows=[
    ['Record',rec(h),o?rec(o):null],
    ['Points',fmt(h.pts),o?fmt(o.pts):null],
    ['League finish',ordinal(h.finish),o?ordinal(o.finish):null],
    ['Goals for',fmt(h.gf),o?fmt(o.gf):null],
    ['Goals against',fmt(h.ga),o?fmt(o.ga):null],
    ['GF / game',pg(h.gf,h.gp),o?pg(o.gf,o.gp):null],
    ['GA / game',pg(h.ga,h.gp),o?pg(o.ga,o.gp):null],
    ['PIM',fmt(h.pim),o?fmt(o.pim):null]
  ];
  const oppName=(G.opp||'').replace(/Huntsville Havoc/,'').trim();
  const leadersOf=code=>{const t=((SN26.teams||{})[code]||{});
    return (t.skaters||[]).slice().sort((a,b)=>(b.pts||0)-(a.pts||0)).slice(0,3)
      .map(p=>`${esc(p.name)} ${p.g}-${p.a}&mdash;${p.pts}`).join(' &middot; ');};
  const gOf=code=>{const t=((SN26.teams||{})[code]||{});
    const g=(t.goalies||[]).slice().sort((a,b)=>(b.gp||0)-(a.gp||0))[0];
    return g?`${esc(g.name)} ${g.gp} GP &middot; ${esc(g.gaa||'—')} GAA &middot; ${fmtSv(g.svpct)} SV%${g.so?' &middot; '+g.so+' SO':''}`:'';};
  const oc=teamAbbrOf(G.opp);
  const hl=leadersOf('HSV'),hg=gOf('HSV'),ol=o?leadersOf(oc):'',og=o?gOf(oc):'';
  const note=o?'':`<div class="h2h-note">&#9432; ${esc(teamCity(G.opp))} played ${esc(short)} outside the SPHL — no side-by-side comparison. Their season, league-labeled, is in the Storylines box and the franchise file.</div>`;
  return `<div class="box"><h3>${esc(short)} FINAL REGULAR SEASON</h3>
    <table class="matchup"><thead><tr><th></th><th>Havoc</th>${o?`<th>${esc(oppName||'Opponent')}</th>`:''}</tr></thead><tbody>
    ${rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td>${o?`<td>${r[2]}</td>`:''}</tr>`).join('')}</tbody></table>
    ${hl?`<div class="b" style="font-size:9px"><b>HSV leaders:</b> ${hl}</div>`:''}
    ${ol?`<div class="b" style="font-size:9px"><b>${esc(oc)} leaders:</b> ${ol}</div>`:''}
    ${hg?`<div class="b" style="font-size:9px"><b>HSV goalie:</b> ${hg}</div>`:''}
    ${og?`<div class="b" style="font-size:9px"><b>${esc(oc)} goalie:</b> ${og}</div>`:''}
    ${note}</div>`;
}
/* roster player -> his authored entry. The bios key is the spine name;
   formal_name is the alias the feed prints (Gio ↔ Giovanni Procopio).
   An embargoed entry answers null — the prose renders nowhere until flipped. */
function biosFor(p){
  const P=(BIOS_FILE||{}).players;if(!P||!p||!p.name)return null;
  if(!BIOS_IDX){
    BIOS_IDX={};
    Object.keys(P).forEach(k=>{
      BIOS_IDX[norm(k)]=k;
      if(P[k].formal_name)BIOS_IDX[norm(P[k].formal_name)]=k;
    });
  }
  let k=BIOS_IDX[norm(p.name)];
  if(!k){const hit=rosterMatch(p.name,Object.keys(P).map(n=>({name:n})));if(hit)k=hit.name;}
  if(!k)return null;
  const B=P[k];
  return B.embargoed?null:B;
}
function bioLine(v){return String(v||'').trim();}
/* The committed spine (data/havoc_players.json) is the roster's baseline:
   before the league publishes 2026-27, every browser still shows the signed
   roster. Creates missing players and fills only EMPTY fields — hand edits
   and feed values always win. Idempotent; only saves on a real change. */
function sheetSeason(){return String(((MS_DATA||{}).meta||{}).season||'2026-27');}
function spineRosterApply(){
  if(!MS_DATA||!Array.isArray(MS_DATA.players))return;
  const before=JSON.stringify(DATA.roster);
  MS_DATA.players.forEach(sp=>{
    if(!sp.name)return;
    let p=DATA.roster.find(x=>norm(x.name)===norm(sp.name))||rosterMatch(sp.name,DATA.roster);
    if(!p){p={id:uid(),name:sp.name,notes:'',bbio:'',active:'1'};DATA.roster.push(p);}
    p.sheet=sheetSeason();   // PROVENANCE: this player is on the internal signed sheet
    if(!p.num&&sp.num)p.num=String(sp.num);
    if(!p.pos&&sp.pos)p.pos=sp.pos;
    if(!p.from&&sp.from)p.from=sp.from;   // previous club — "Huntsville Havoc" = returning
    const b=sp.bio||{};
    if(!p.ht&&b.height)p.ht=b.height;
    if(!p.wt&&b.weight)p.wt=String(b.weight);
    if(!p.sh&&b.shoots)p.sh=b.shoots;
    if(!p.birth&&b.born)p.birth=b.born;
    if(!p.dob&&b.birthdate)p.dob=b.birthdate;
  });
  if(JSON.stringify(DATA.roster)!==before){save();if(document.getElementById('rosterTableWrap'))renderRoster();}
}
function msImportFile(ev){
  const f=ev.target.files[0];if(!f)return;
  const rd=new FileReader();
  rd.onload=()=>{
    try{
      const j=JSON.parse(rd.result);
      if(!j||!Array.isArray(j.players))throw new Error('no players array');
      MS_DATA=j;DATA.careersFile=j;save();
      msInit();toast('Career data loaded — '+j.players.length+' players');
    }catch(e){toast('Could not read that file: '+e.message);}
  };
  rd.readAsText(f);ev.target.value='';
}
function msView(v){
  MS_VIEW=v;
  document.querySelectorAll('.ms-view').forEach(b=>b.classList.toggle('dark',b.dataset.msv===v));
  renderMilestones();
}
async function msInit(){
  const d=await msLoad();
  const meta=document.getElementById('msMeta');
  if(!d){
    const el=document.getElementById('msBoard');
    if(el)el.innerHTML=emptyState('data/havoc_players.json not loaded',
      'Hosted, it loads by itself; opened as a local file, import it with the button above.');
    if(meta)meta.textContent='';
    return;
  }
  if(meta)meta.textContent='compiled '+((d.meta||{}).compiled||'')+' · '+d.players.length+' players'
    +((d.meta||{}).current_season?' · career = through 2025-26 + live '+d.meta.current_season+' counters':'');
  renderMilestones();
  const sel=document.getElementById('msPlayerSel');
  if(sel){
    sel.innerHTML=d.players.map((p,i)=>`<option value="${i}">${p.num?'#'+esc(p.num)+' ':''}${esc(p.name)}</option>`).join('');
    renderCareerPage(sel.value||0);
  }
}
function renderMilestones(){
  const el=document.getElementById('msBoard');if(!el||!MS_DATA)return;
  if(MS_VIEW==='staff'){renderStaff();return;}
  if(MS_VIEW==='alltime'){
    renderAllTime();
    const watch=document.getElementById('msWatch');
    if(watch){
      const fr=frBannerLines().sort((a,b)=>a.away-b.away);
      watch.innerHTML=fr.length?`<div class="ms-urgent">${fr.map(x=>`<div class="ms-call">${x.html}</div>`).join('')}</div>`:'';
    }
    renderRecordWatch();
    return;
  }
  const scope=MS_VIEW;
  const rows=MS_DATA.players.map(p=>{
    const t=msTotals(p,scope);
    return {p,vals:t.vals,ov:t.ov,flags:msFlags(p,t.vals)};
  });
  const sk=rows.filter(r=>r.p.type!=='goalie'),gl=rows.filter(r=>r.p.type==='goalie');
  const table=(list,cols,labels)=>{
    if(!list.length)return '';
    const head=`<tr><th class="s">Player</th>${cols.map((c,i)=>`<th class="r s">${labels[i]}</th>`).join('')}<th>Watch</th></tr>`;
    const body=list.map(r=>{
      const badges=Object.keys(r.flags).map(k=>msBadge(k,r.flags[k])
        .replace('">','">'+k.toUpperCase()+': ')).join(' ')
        +(scope==='havoc'?' '+(r.p.type==='goalie'?frgPassBadge(r.p):frPassBadge(r.p)):'');
      return `<tr><td class="ms-nm"><a href="javascript:void 0" onclick="msOpen('${esc(r.p.name).replace(/'/g,"\\'")}')">${r.p.num?'#'+esc(r.p.num)+' ':''}${esc(r.p.name)}</a>${r.ov?'<span class="ms-src" title="Totals from Jacob&#39;s tracker (Apr 4, 2026) — this career baseline comes from the tracking sheet, not a season-row sum, because some rows are still missing GP">tracker</span>':''}${r.p.notes?'<span class="ms-note-i" title="'+esc(r.p.notes)+'">&#9432;</span>':''}</td>
        ${cols.map(c=>`<td class="r">${msCell(r.vals[c])}</td>`).join('')}
        <td class="ms-watch">${badges||''}</td></tr>`;
    }).join('');
    return `<table class="ms-t">${head}${body}</table>`;
  };
  el.innerHTML=
    `<div class="section-label hub-sectionhead">Skaters — ${scope==='pro'?'overall pro career':'with the Havoc'} (regular season)</div>`
   +`<div class="hub-tablewrap" style="overflow-x:auto">${table(sk,['gp','g','a','pts','pim'],['GP','G','A','PTS','PIM'])}</div>`
   +`<div class="section-label hub-sectionhead">Goaltenders — ${scope==='pro'?'overall pro career':'with the Havoc'} (regular season)</div>`
   +`<div class="hub-tablewrap" style="overflow-x:auto">${table(gl,['gp','svs','w','so'],['GP','SVS','W','SO'])}</div>`
   +`<p class="desc" style="margin-top:6px">${esc(((MS_DATA.meta||{}).tracker_asof)||'')}</p>`;
  tsWire(el,'ms:'+scope);
  // the broadcast line that has to jump off the screen
  const watch=document.getElementById('msWatch');
  if(watch){
    renderRecordWatch();
    const lines=msWatchLines(scope,5);
    // the franchise-list races ride along on the Havoc board
    if(scope==='havoc')lines.push(...frBannerLines());
    lines.sort((a,b)=>a.away-b.away);
    watch.innerHTML=lines.length?`<div class="ms-urgent">${lines.map(x=>`<div class="ms-call">${x.html}</div>`).join('')}</div>`:'';
  }
}
/* per-player milestone proximity lines — [{away,html}], sorted nearest first.
   The board keeps its ≤5 urgency window; the Game Day strip widens to 15. */
function msWatchLines(scope,maxAway){
  if(!MS_DATA)return [];
  const urgent=[];
  MS_DATA.players.forEach(p=>{
    const t=msTotals(p,scope),flags=msFlags(p,t.vals);
    Object.keys(flags).forEach(k=>{if(flags[k].away<=maxAway)urgent.push({p,k,hit:flags[k]});});
  });
  urgent.sort((a,b)=>a.hit.away-b.hit.away);
  return urgent.map(u=>{
    const last=u.p.name.split(' ').pop();
    const what=u.k==='gp'?(u.hit.away+' game'+(u.hit.away===1?'':'s')+' from '+u.hit.next)
      :(u.k==='w'?(u.hit.away+' win'+(u.hit.away===1?'':'s')+' from '+u.hit.next)
      :(u.hit.away+' '+({g:'goal',a:'assist',pts:'point'})[u.k]+(u.hit.away===1?'':'s')+' from '+u.hit.next));
    return {away:u.hit.away,html:`<b>${esc(last)}</b> is ${esc(what)}${scope==='havoc'?' as a Havoc':' as a pro'}`};
  });
}
/* ============================================================
   FRANCHISE RACE — the all-time Havoc scoring list from
   franchise_records.career_leaders_points, joined to the current roster by
   name. Roster players ride their LIVE Havoc career (baseline + the
   game-night counters) and the list re-ranks itself, so a two-point night
   moves a man up the board before the Zamboni is done. Ties share a rank.
   ============================================================ */
function frLeaders(){
  const fr=((MS_DATA||{}).franchise_records||{}).career_leaders_points;
  return (fr&&fr.leaders)||[];
}
/* join a leaders entry to a roster player: the pre-set flag plus a name match
   that survives "Giovanni Procopio" vs "Gio Procopio" */
function frJoin(entry){
  if(!MS_DATA)return null;
  const exact=MS_DATA.players.find(p=>p.name===entry.name);
  if(exact)return exact;
  if(!entry.active_2026_27_roster)return null;
  return (typeof rosterMatch==='function'?rosterMatch(entry.name,MS_DATA.players):null)||null;
}
/* the list with live numbers on roster rows, re-ranked; competition ranking,
   so equal points share a rank and the next one skips */
function frLive(){
  const L=frLeaders();
  // static rank under the same shared-rank rule, so a tie the club numbered
  // sequentially (…51, 52 on equal points) doesn't read as a day-one climb
  const statRank=e=>1+L.filter(x=>x.pts>e.pts).length;
  const rows=L.map(e=>{
    const p=frJoin(e);
    if(!p)return {e,live:null,pts:e.pts,gp:e.gp,g:e.g,a:e.a,pim:e.pim};
    const t=msTotals(p,'havoc').vals;
    return {e,live:p,pts:t.pts??e.pts,gp:t.gp??e.gp,g:t.g??e.g,a:t.a??e.a,pim:t.pim??e.pim};
  });
  rows.sort((x,y)=>(y.pts-x.pts)||((x.e.rank||99)-(y.e.rank||99)));
  rows.forEach(r=>{
    r.rank=1+rows.filter(x=>x.pts>r.pts).length;
    r.tied=rows.filter(x=>x.pts===r.pts).length>1;
    r.climb=statRank(r.e)-r.rank;
  });
  return rows;
}
/* the next man strictly above a roster player, and what it takes to pass him */
function frNextPass(row,rows){
  const above=[...rows].reverse().find(x=>x.pts>row.pts);
  if(!above)return null;
  return {name:above.e.name,need:above.pts+1-row.pts};
}
/* distance to the all-time top 15 (a tie at #15's points shares the rank) */
function frTop15(row,rows){
  const r15=rows.filter(x=>x.rank<=15);
  if(!r15.length||row.rank<=15)return null;
  const bar=Math.min(...r15.map(x=>x.pts));
  return {need:bar-row.pts,bar};
}
function renderAllTime(){
  const el=document.getElementById('msBoard');if(!el)return;
  const rows=frLive();
  if(!rows.length){el.innerHTML=emptyState('No franchise leaders list in the data file','franchise_records.career_leaders_points is missing.');return;}
  const meta=((MS_DATA.franchise_records||{}).career_leaders_points||{});
  const rk=r=>(r.tied?'T-':'')+r.rank;
  const body=rows.map(r=>{
    const ppg=r.live?(r.gp?(r.pts/r.gp).toFixed(2):'—'):(r.e.ppg!=null?r.e.ppg.toFixed(2):'—');
    return `<tr class="${r.live?'fr-me':''}">
      <td class="r fr-rk">${rk(r)}${r.live&&r.climb>0?`<span class="fr-climb" title="up ${r.climb} spot${r.climb===1?'':'s'} on the static list">&#9650;${r.climb}</span>`:''}</td>
      <td class="ms-nm">${r.live?`<a href="javascript:void 0" onclick="msOpen('${esc(r.live.name).replace(/'/g,"\\'")}')">${esc(r.e.name)}</a> <span class="fr-chip">ROSTER</span>`:esc(r.e.name)}</td>
      <td>${esc(r.e.pos||'')}</td>
      <td class="r">${msCell(r.gp)}</td><td class="r">${msCell(r.g)}</td><td class="r">${msCell(r.a)}</td>
      <td class="r fr-pts">${msCell(r.pts)}</td><td class="r">${ppg}</td><td class="r">${msCell(r.pim)}</td>
      <td class="fr-yrs">${esc(r.e.years||'')}</td></tr>`;
  }).join('');
  el.innerHTML=
    `<div class="section-label hub-sectionhead">All-time Havoc scoring — skaters, through 2025-26, live for the 2026-27 roster</div>`
   +`<div class="hub-tablewrap" style="overflow-x:auto"><table class="ms-t fr-t">
      <tr><th class="r">#</th><th>Player</th><th>Pos</th><th class="r">GP</th><th class="r">G</th><th class="r">A</th><th class="r">PTS</th><th class="r">P/GP</th><th class="r">PIM</th><th>Years</th></tr>
      ${body}</table></div>`
   +`<div class="section-label hub-sectionhead">Goalie career leaders${frgLeaders().length?' — click GP, W, SO, GAA, SV% or SVS to re-rank':''}</div>`
   +frgTableHTML()
   +`<p class="desc" style="margin-top:6px">${esc(meta._source||'')}</p>`;
  tsWire(el,'ms:alltime');
}
/* the pass badge for the Havoc milestone board's watch column */
function frPassBadge(p){
  const rows=frLive();
  const mine=rows.find(r=>r.live===p);
  if(!mine)return '';
  const pass=frNextPass(mine,rows);
  if(!pass||pass.need>15)return '';
  return `<span class="ms-badge ${pass.need<=5?'soon':'up'}" title="all-time Havoc scoring — currently ${(mine.tied?'T-':'')+mine.rank}">passes ${esc(pass.name.split(' ').pop())} in ${pass.need} PTS</span>`;
}
/* banner lines: a pass inside 3 points, or the top 15 inside 10 */
function frBannerLines(){
  const out=[];
  const rows=frLive();
  rows.filter(r=>r.live).forEach(r=>{
    const last=r.live.name.split(' ').pop();
    const pass=frNextPass(r,rows);
    if(pass&&pass.need<=3)out.push({away:pass.need,html:`<b>${esc(last)}</b> passes ${esc(pass.name)} on the all-time Havoc list in ${pass.need} point${pass.need===1?'':'s'}`});
    const t15=frTop15(r,rows);
    if(t15&&t15.need<=10)out.push({away:t15.need,html:`<b>${esc(last)}</b> is ${t15.need} point${t15.need===1?'':'s'} from the all-time Havoc top 15`});
  });
  // goalie chases — only a pass into the top 10 of a column makes the banner,
  // so a two-win rookie passing the bottom of the list doesn't drown the board
  [['w','wins list',3,'win'],['gp','games list',3,'game'],['svs','saves list',25,'save']].forEach(([col,label,win,unit])=>{
    const g=frgLive().filter(x=>x[col]!=null).sort((a,b)=>b[col]-a[col]);
    g.filter(x=>x.live).forEach(r=>{
      const above=[...g].reverse().find(x=>x[col]>r[col]);
      if(!above)return;
      const need=above[col]+1-r[col];
      const aboveRank=1+g.filter(x=>x[col]>above[col]).length;
      if(need<=win&&aboveRank<=10){
        const last=r.live.name.split(' ').pop();
        out.push({away:need,html:`<b>${esc(last)}</b> passes ${esc(above.e.name)} on the all-time Havoc ${label} in ${need} ${unit}${need===1?'':'s'}`});
      }
    });
  });
  return out;
}
/* ---- the goalie side of the race — ranked by GP by default, re-sortable;
   rate columns qualify at 25 Havoc games per the club's note. The game-night
   counters carry GP, W, SO and saves live; GAA and SV% stay as of 2025-26
   because the counters don't track goals-against or minutes. ---- */
var FRG_SORT='gp',FRG_REV=false,FRG_ALL=false;
const FRG_ASC={gaa:true};        // every other column: bigger is better
function frgSort(c){
  if(FRG_SORT===c)FRG_REV=!FRG_REV;else{FRG_SORT=c;FRG_REV=false;}
  renderMilestones();
}
function frgShowAll(){FRG_ALL=!FRG_ALL;renderMilestones();}
function frgLeaders(){
  const fr=((MS_DATA||{}).franchise_records||{}).career_leaders_goalies;
  return (fr&&fr.leaders)||[];
}
function frgLive(){
  return frgLeaders().map(e=>{
    const p=frJoin(e);
    const r={e,live:null,gp:e.gp,w:e.w,l:e.l,t:e.t,so:e.so,svs:e.svs,gaa:e.gaa,svpct:e.svpct};
    if(p&&p.type==='goalie'){
      const t=msTotals(p,'havoc').vals;
      r.live=p;r.gp=t.gp??e.gp;r.w=t.w??e.w;r.so=t.so??e.so;r.svs=t.svs??e.svs;
    }
    return r;
  });
}
function frgRanked(col){
  const asc=!!FRG_ASC[col];
  const better=(a,b)=>a==null?false:(b==null?true:(asc?a<b:a>b));
  const rate=col==='gaa'||col==='svpct';
  let rows=frgLive(),hidden=0;
  if(rate&&!FRG_ALL){const n=rows.length;rows=rows.filter(r=>(r.gp||0)>=25);hidden=n-rows.length;}
  rows.sort((x,y)=>better(x[col],y[col])?-1:(better(y[col],x[col])?1:((x.e.rank||99)-(y.e.rank||99))));
  rows.forEach(r=>{
    r.rank=1+rows.filter(x=>better(x[col],r[col])).length;
    r.tied=r[col]!=null&&rows.filter(x=>x[col]===r[col]).length>1;
    r.climb=(1+rows.filter(x=>better(x.e[col],r.e[col])).length)-r.rank;
  });
  return {rows,hidden};
}
/* the goalie pass badge rides the wins chase — that is the story the club's
   note tells (49, one behind McWhinney for 3rd) */
function frgPassBadge(p){
  const rows=frgLive().filter(r=>r.w!=null).sort((a,b)=>b.w-a.w);
  const mine=rows.find(r=>r.live===p);
  if(!mine)return '';
  const above=[...rows].reverse().find(x=>x.w>mine.w);
  if(!above)return '';
  const need=above.w+1-mine.w;
  if(need>15)return '';
  return `<span class="ms-badge ${need<=5?'soon':'up'}" title="all-time Havoc wins list">passes ${esc(above.e.name.split(' ').pop())} in ${need} W</span>`;
}
function frgTableHTML(){
  const gm=((MS_DATA.franchise_records||{}).career_leaders_goalies||{});
  if(!frgLeaders().length)
    return `<div class="rec-none">Not yet provided — Wilson (92 GP, 49 W as a Havoc) is likely already top-5 in franchise wins. This section fills in when the club supplies the goalie list.</div>`;
  const gr=frgRanked(FRG_SORT);
  const rate=FRG_SORT==='gaa'||FRG_SORT==='svpct';
  const cols=[['gp','GP',1],['w','W',1],['l','L',0],['t','T',0],['so','SO',1],['gaa','GAA',1],['svpct','SV%',1],['svs','SVS',1]];
  const fmt=(c,v)=>v==null?'<span class="ms-null">—</span>'
    :(c==='gaa'?v.toFixed(2):(c==='svpct'?'.'+String(Math.round(v*1000)).padStart(3,'0'):v));
  // the indicator reads by row order: best-first is ▼ for counting stats, ▲ for GAA
  const ind=c=>FRG_SORT===c?`<span class="ts-i">${(!!FRG_ASC[c])!==FRG_REV?'▲':'▼'}</span>`:'';
  const head=`<tr><th class="r">#</th><th>Goalie</th>${cols.map(([c,l,s])=>`<th class="r${s?' s ts-h':''}"${s?` onclick="frgSort('${c}')"`:''}>${l}${ind(c)}</th>`).join('')}<th>Years</th></tr>`;
  const list=FRG_REV?[...gr.rows].reverse():gr.rows;
  const rkCell=r=>{
    const dyn=r[FRG_SORT]==null?'—':(r.tied?'T-':'')+r.rank;   // a — in the sorted column ranks as —
    const climb=r.live&&r.climb>0&&r[FRG_SORT]!=null?`<span class="fr-climb" title="up ${r.climb} spot${r.climb===1?'':'s'} on the static list">&#9650;${r.climb}</span>`:'';
    const offN=FRG_SORT!=='gp'&&r.e.rank?`<span class="rk-off" title="official all-time rank, by games played">#${r.e.rank}</span>`:'';
    return dyn+climb+offN;
  };
  const body=list.map(r=>`<tr class="${r.live?'fr-me':''}">
    <td class="r fr-rk">${rkCell(r)}</td>
    <td class="ms-nm">${r.live?`<a href="javascript:void 0" onclick="msOpen('${esc(r.live.name).replace(/'/g,"\\'")}')">${esc(r.e.name)}</a> <span class="fr-chip">ROSTER</span>`:esc(r.e.name)}</td>
    ${cols.map(([c])=>`<td class="r${c===FRG_SORT?' fr-pts':''}">${fmt(c,r[c])}</td>`).join('')}
    <td class="fr-yrs">${esc(r.e.years||'')}</td></tr>`).join('');
  return `<div class="hub-tablewrap" style="overflow-x:auto"><table class="ms-t fr-t ts-skip">${head}${body}</table></div>`
    +(rate?(gr.hidden?`<p class="desc" style="margin-top:4px">Rate columns qualify at 25 Havoc games — ${gr.hidden} goalies under the line are off this sort. <a href="javascript:void 0" onclick="frgShowAll()">Show all ${gr.hidden+gr.rows.length}</a></p>`
      :`<p class="desc" style="margin-top:4px">Showing all ${gr.rows.length} — rate ranks under 25 Havoc games are small samples. <a href="javascript:void 0" onclick="frgShowAll()">Apply the 25-GP line</a></p>`):'')
    +`<p class="desc" style="margin-top:4px">${esc(gm._source||'')} GP, wins, shutouts and saves run live off the game-night counters; GAA and SV% are through 2025-26.</p>`;
}
/* ============================================================
   STAFF — the coaching side of the franchise book, from
   franchise_history.coaching_milestones. The head-coach table ranks by
   career Havoc wins; the sitting coach's row is live off the team record
   counters (current_season.team_w / team_l / team_otl / team_gp — edited on
   game nights right beside the player counters). Milestone watch per the
   club's note: coaching wins on the 50s (soon ≤5 / upcoming ≤15), games
   coached on the 100s (window 10), and the pass chase up the wins list —
   Gibson's 113 for second-most in franchise history is the season's story.
   ============================================================ */
function stCM(){return (((MS_DATA||{}).franchise_history||{}).coaching_milestones)||null;}
function stTenure(){return (stCM()||{}).staff_tenure_entering_2026_27||{};}
function stTeamCur(){return (stCM()||{}).current_season||{};}
function stOrd(n){return n+(n%10===1&&n%100!==11?'st':n%10===2&&n%100!==12?'nd':n%10===3&&n%100!==13?'rd':'th');}
function stCoaches(){
  const hc=(stCM()||{}).head_coach_career_totals||{};
  const rows=Object.keys(hc).filter(k=>!k.startsWith('_')).map(name=>{
    const c=hc[name];
    const s26=c.season_2025_26;
    const baseW=(c.w??0)+(s26?(s26.w||0):0);
    const baseGp=(c.gp??0)+(s26?(s26.gp||0):0);
    const live=name==='Stuart Stefan';          // the sitting HC rides the live team record
    const cur=live?stTeamCur():{};
    return {name,c,live,baseW,baseGp,
      w:baseW+(cur.team_w||0),gp:baseGp+(cur.team_gp||0),
      seasons:c.seasons??null,cups:c.cups_as_hc??null,years:c.years||''};
  });
  rows.sort((a,b)=>b.w-a.w);
  rows.forEach(r=>{
    r.rank=1+rows.filter(x=>x.w>r.w).length;
    r.tied=rows.filter(x=>x.w===r.w).length>1;
    r.climb=(1+rows.filter(x=>x.baseW>r.baseW).length)-r.rank;
  });
  return rows;
}
function stWatch(){
  const out={badges:[],lines:[]};
  const rows=stCoaches();
  const me=rows.find(r=>r.live);
  if(!me)return out;
  const chase=(next,away,label,unit)=>{
    out.badges.push(`<span class="ms-badge ${msTier(away)}">${label}: ${away} ${unit}${away===1?'':'s'} away</span>`);
  };
  // coaching wins on the 50s
  const wNext=Math.ceil((me.w+1)/50)*50,wAway=wNext-me.w;
  chase(wNext,wAway,wNext+' coaching wins','win');
  if(wAway<=5)out.lines.push({away:wAway,html:`<b>Stefan</b> is ${wAway} win${wAway===1?'':'s'} from ${wNext} as Havoc head coach`});
  // games coached on the 100s
  const gNext=Math.ceil((me.gp+1)/100)*100,gAway=gNext-me.gp;
  out.badges.push(`<span class="ms-badge ${gAway<=5?'soon':(gAway<=10?'up':'far')}">${gNext} games coached: ${gAway} away</span>`);
  if(gAway<=5)out.lines.push({away:gAway,html:`<b>Stefan</b> coaches his ${stOrd(gNext)} Havoc game ${gAway===1?'tonight — next game':'in '+gAway+' games'}`});
  // the pass chase up the wins list
  const above=[...rows].reverse().find(x=>x.w>me.w);
  if(above){
    const need=above.w+1-me.w;
    const spot=1+rows.filter(x=>x.w>above.w).length;
    out.badges.push(`<span class="ms-badge ${msTier(need)}" title="${esc(above.name)} — ${above.w} career coaching wins">passes ${esc(above.name.split(' ').pop())} (${above.w}) for ${stOrd(spot)} in ${need} W</span>`);
    if(need<=3)out.lines.push({away:need,html:`<b>Stefan</b> passes ${esc(above.name)} for ${stOrd(spot)}-most coaching wins in franchise history in ${need} win${need===1?'':'s'}`});
  }
  return out;
}
function renderStaff(){
  const el=document.getElementById('msBoard');if(!el)return;
  const watchEl=document.getElementById('msWatch');
  const cm=stCM();
  if(!cm){
    el.innerHTML=emptyState('No coaching data in the file','franchise_history.coaching_milestones is missing — re-import havoc_players.json.');
    if(watchEl)watchEl.innerHTML='';
    const recEl=document.getElementById('msRecords');if(recEl)recEl.innerHTML='';
    return;
  }
  const rows=stCoaches();
  const ten=stTenure();
  const chips=Object.keys(ten).map(name=>{
    const t=ten[name];
    const sn=t.hc_season_number||t.gm_season_number||t.staff_season_number;
    const what=t.hc_season_number?'season as HC':(t.gm_season_number?'season as GM':'season on staff');
    const org=(String(t.org_note||'').match(/^(\d+)[a-z]{2} year in org/)||[])[1];
    return `<div class="st-chip" title="${esc(t.org_note||'')}"><b>${esc(name)}</b><span>${esc(t.role||'')}</span>${sn?stOrd(sn)+' '+what:''}${org?' · '+stOrd(+org)+' in org':''}</div>`;
  }).join('');
  const cur=stTeamCur();
  const watch=stWatch();
  const body=rows.map(r=>`<tr class="${r.live?'fr-me':''}">
    <td class="r fr-rk">${(r.tied?'T-':'')+r.rank}${r.live&&r.climb>0?`<span class="fr-climb" title="up ${r.climb} spot${r.climb===1?'':'s'} on the wins list">&#9650;${r.climb}</span>`:''}</td>
    <td class="ms-nm">${esc(r.name)}${r.live?' <span class="fr-chip">HC</span>':''}${r.name==='Glenn Detulleo'?' <span class="ms-src" title="Also the sitting GM — franchise-record 312 coaching wins, back-to-back Cups 2018 and 2019">GM</span>':''}</td>
    <td class="r">${msCell(r.seasons)}</td><td class="r">${msCell(r.gp)}</td><td class="r fr-pts">${msCell(r.w)}</td>
    <td class="r">${r.cups!=null?r.cups:'<span class="ms-null">—</span>'}</td><td class="fr-yrs">${esc(r.years)}</td></tr>`).join('');
  el.innerHTML=
   `<div class="section-label hub-sectionhead">Bench &amp; front office — entering 2026-27</div>
    <div class="st-chips">${chips}</div>
    <div class="section-label hub-sectionhead">Head coaches, all-time — career Havoc wins</div>
    <div class="hub-tablewrap" style="overflow-x:auto"><table class="ms-t fr-t">
      <tr><th class="r">#</th><th>Coach</th><th class="r">Seasons</th><th class="r">GP</th><th class="r">W</th><th class="r">Cups</th><th>Years</th></tr>${body}</table></div>
    <div style="margin-top:7px">${watch.badges.join(' ')}</div>
    <p class="desc" style="margin-top:6px">2026-27 under Stefan so far: <b>${cur.team_w||0}-${cur.team_l||0}-${cur.team_otl||0}</b> — the team record counters (<i>franchise_history.coaching_milestones.current_season</i>) are edited on game nights right beside the player counters, and Stefan's live totals ride them. The franchise-best season is the benchmark: 41 wins / 84 points, 2021-22. ${esc(((cm.head_coach_career_totals||{})._note)||'')}</p>`;
  tsWire(el,'ms:staff');
  if(watchEl){
    const lines=watch.lines.sort((a,b)=>a.away-b.away);
    watchEl.innerHTML=lines.length?`<div class="ms-urgent">${lines.map(x=>`<div class="ms-call">${x.html}</div>`).join('')}</div>`:'';
  }
  renderRecordWatch();
}
/* ============================================================
   FRANCHISE RECORD WATCH — the same idea as the milestone board, aimed at
   the club's own book. Career records compare against the live Havoc career
   (baseline + current); single-season records compare against the 2026-27
   counters, so it stays quiet until the season starts and then wakes up on
   its own. Record values parse from the seeded League Reference strings, so
   an edit to the records card feeds straight through.
   ============================================================ */
const REC_WATCH={
  career:{skater:{gp:['Games',25],g:['Goals',10],a:['Assists',10],pts:['Points',15],pim:['Penalty minutes',25]},
          goalie:{gp:['Games (goalie)',25],w:['Wins (goalie)',10],so:['Shutouts',2],svs:['Saves (goalie)',150]}},
  season:{skater:{g:['Most goals, season',10],a:['Most assists, season',10],pts:['Most points, season',15],pim:['Most PIM, season',25]},
          goalie:{w:['Most wins, season',5],so:['Most shutouts, season',2]}}
};
function recParse(label,list){
  const hit=(list||[]).find(r=>r[0]===label);
  if(!hit)return null;
  // structured record (the data-file path): value and holder come as data
  if(hit[2]&&hit[2].value!=null)return {val:+hit[2].value,who:hit[2].holder||''};
  // seeded-copy fallback only: recover the value from the display string; the
  // holder stays UNKNOWN ('' ) so the watch can never claim it by guesswork
  const m=String(hit[1]).match(/-?[\d,]+(?:\.\d+)?/);
  if(!m)return null;
  return {val:parseFloat(m[0].replace(/,/g,'')),who:''};
}
function recWatchRows(){
  const R=recBook();
  if(!R||!MS_DATA)return [];
  const out=[];
  MS_DATA.players.forEach(p=>{
    const type=p.type==='goalie'?'goalie':'skater';
    const hav=msTotals(p,'havoc').vals;
    Object.entries(REC_WATCH.career[type]||{}).forEach(([k,[label,win]])=>{
      const rec=recParse(label,R.career);if(!rec)return;
      const val=hav[k];if(val==null)return;
      const away=rec.val-val;
      if(away<=win)out.push({p,scope:'career',k,label,rec,val,away});
    });
    const cur=p.current_season||{};
    Object.entries((REC_WATCH.season[type])||{}).forEach(([k,[label,win]])=>{
      const rec=recParse(label,type==='goalie'?R.goalies:R.players);if(!rec)return;
      const val=cur[k];if(val==null||val===0)return;   // preseason: nothing to watch yet
      const away=rec.val-val;
      if(away<=win)out.push({p,scope:'season',k,label,rec,val,away});
    });
  });
  return out.sort((a,b)=>a.away-b.away);
}
const REC_STATNAME={gp:'games',g:'goals',a:'assists',pts:'points',pim:'PIM',w:'wins',so:'shutouts',svs:'saves'};
/* one recWatchRows() row → its broadcast line — shared by the milestone board
   and the Game Day strip so the holder-join logic lives in one place */
function recRowHTML(r){
  const statName=REC_STATNAME;
  const last=r.p.name.split(' ').pop();
  const what=(r.scope==='season'?'the single-season record':'the franchise '+statName[r.k]+' record');
  // the book's holder IS this player — whole-name equality against his spine
  // name and formal_name alias, never a last-name substring; a shared-holder
  // card ("Mike Robinson / Matt Carmichael") splits into its names first
  const holders=String(r.rec.who||'').split(/\s*[\/,&]\s*|\s+and\s+/i).map(norm).filter(Boolean);
  const pb=biosFor(r.p)||{};
  const names=[r.p.name,pb.formal_name].filter(Boolean).map(norm);
  const mine=holders.length>0&&names.some(n=>holders.indexOf(n)>=0);
  if(r.away<=0&&mine){
    const one=statName[r.k].replace(/s$/,'');
    if(r.scope==='season')
      return `<div class="rec-row rec-mine"><b>${esc(last)}</b> has ${r.away<0?'broken':'matched'} the single-season ${esc(statName[r.k])} record (${r.rec.val}) — a record he already shares</div>`;
    return `<div class="rec-row rec-mine"><b>${esc(last)}</b> holds the franchise ${esc(statName[r.k])} record — ${r.val} as a Havoc${r.val>r.rec.val?' (the book card still says '+r.rec.val+' — update it)':''}, and every ${esc(one)} extends it</div>`;
  }
  if(r.away<=0)
    // ahead of the book — either the record is his now, or the seeded number is stale
    return `<div class="rec-row rec-holds"><b>${esc(last)}</b> — ${r.val} ${esc(statName[r.k])} as a Havoc, ahead of ${esc(what)} in the book (${r.rec.val}${r.rec.who?', '+esc(r.rec.who):''}) — verify the record before air</div>`;
  return `<div class="rec-row ${r.away<=5?'rec-soon':''}"><b>${esc(last)}</b> is <b>${r.away}</b> ${esc(statName[r.k])} from ${esc(what)} — ${r.rec.val}${r.rec.who?', held by '+esc(r.rec.who):''}</div>`;
}
function renderRecordWatch(){
  const el=document.getElementById('msRecords');if(!el)return;
  const R=recBook();
  if(!R||!MS_DATA){el.innerHTML='';return;}
  const rows=recWatchRows();
  el.innerHTML=`<div class="section-label hub-sectionhead">Franchise record watch — the club book vs. live Havoc careers</div>`
    +(rows.length?rows.map(recRowHTML).join('')
      :`<div class="rec-none">Nobody is inside the watch window on any franchise record. Career records check against live Havoc careers (closest today: Wilson's ${(function(){const w=MS_DATA.players.find(x=>x.name==='Brian Wilson');const r=recParse('Wins (goalie)',R.career);return w&&r?msTotals(w,'havoc').vals.w+' wins vs '+r.val+' ('+r.who+')':'—';})()}); single-season records wake up once the 2026-27 counters start moving.</div>`)
    +`<div class="rec-src">Record book from League Reference → Franchise records — edit it there and this watch follows.</div>`;
}
function msOpen(name){
  const i=MS_DATA.players.findIndex(p=>p.name===name);
  if(i<0)return;
  const sel=document.getElementById('msPlayerSel');
  if(sel)sel.value=String(i);
  renderCareerPage(i);
  const card=document.getElementById('msCareer');
  if(card)card.scrollIntoView({behavior:'smooth',block:'start'});
}
function renderCareerPage(idx){
  const el=document.getElementById('msCareer');if(!el||!MS_DATA)return;
  const p=MS_DATA.players[+idx];if(!p)return;
  const G=p.type==='goalie';
  const n=msCell;
  // league-stat extras (shots, PPG, GWG, SHG) print only when this player's
  // rows actually carry them — today that is Fries's SPHL seasons
  const hasExtras=!G&&(p.seasons||[]).some(r=>r.shots!=null||r.ppg!=null||r.gwg!=null||r.shg!=null);
  const cols=G?['gp','w','l','otl','so','gaa','svpct','svs']
    :(hasExtras?['gp','g','a','pts','pim','pm','shots','ppg','gwg','shg']:['gp','g','a','pts','pim','pm']);
  const labels=G?['GP','W','L','OTL','SO','GAA','SV%','SVS']
    :(hasExtras?['GP','G','A','PTS','PIM','+/-','S','PPG','GWG','SHG']:['GP','G','A','PTS','PIM','+/-']);
  const po=r=>r.po?`${n(r.po.gp)} · ${G?'':n(r.po.g)+'-'+n(r.po.a)+'-'}${n(r.po.pts!=null?r.po.pts:null)}`:'';
  const row=r=>`<tr class="${msIsPro(r)?'ms-pro':''}"><td>${esc(r.season)}</td><td class="ms-team">${esc(r.team)}</td><td>${esc(r.league)}</td>
    ${cols.map(c=>`<td class="r">${n(r[c])}</td>`).join('')}<td class="r ms-po">${r.po?po(r):''}</td></tr>`;
  const group=(lvl,label)=>{
    const rs=(p.seasons||[]).filter(r=>r.level===lvl);
    if(!rs.length)return '';
    return `<tr class="ms-grp"><td colspan="${cols.length+4}">${label}</td></tr>`+rs.map(row).join('');
  };
  // the live 2026-27 counters, once anything has been entered on a game night
  const liveRow=()=>{
    const cur=p.current_season;
    if(!cur)return '';
    const any=cols.some(c=>cur[c]!=null&&cur[c]!==0&&c!=='gaa'&&c!=='svpct');
    if(!any)return '';
    return `<tr class="ms-pro ms-live"><td>${esc(cur.season||'2026-27')}</td><td class="ms-team">${esc(cur.team||'Huntsville Havoc')} <span class="ms-livetag">live</span></td><td>${esc(cur.league||'SPHL')}</td>
      ${cols.map(c=>`<td class="r">${n(cur[c])}</td>`).join('')}<td class="r ms-po">${cur.po&&cur.po.gp?po(cur):''}</td></tr>`;
  };
  const tot=(scope,label)=>{
    const t=msTotals(p,scope);
    const keys=G?['gp','svs','w','so']:['gp','g','a','pts','pim'];
    const map=G?{gp:'gp',w:'w',so:'so',svs:'svs'}:{gp:'gp',g:'g',a:'a',pts:'pts',pim:'pim'};
    return `<tr class="ms-tot"><td colspan="3">${label}${t.ov?' <span class="ms-src">tracker</span>':''}</td>
      ${cols.map(c=>{const k=Object.keys(map).find(x=>map[x]===c);return `<td class="r">${k&&t.vals[k]!=null?t.vals[k]:''}</td>`;}).join('')}<td></td></tr>`;
  };
  el.innerHTML=`
    <div class="ms-head"><span class="ms-num2">${esc(p.num||'')}</span><b>${esc(p.name.toUpperCase())}</b>
      <span class="ms-meta">${esc(p.pos||'')}${p.from?' · from '+esc(p.from):''}</span>
      <a class="btn small secondary" style="margin-left:auto" href="player.html?p=${encodeURIComponent(p.name)}" target="_blank" rel="noopener" title="The game-notes bio page — website and packet page in one; prints letter-size">Bio page &#8599;</a></div>
    <div class="hub-tablewrap" style="overflow-x:auto"><table class="ms-t ms-career">
      <tr><th>Season</th><th>Team</th><th>League</th>${labels.map(l=>`<th class="r">${l}</th>`).join('')}<th class="r">Playoffs ${G?'GP · PTS':'GP · G-A-P'}</th></tr>
      ${group('Youth','YOUTH')}
      ${group('High School','HIGH SCHOOL')}
      ${group('Junior','JUNIORS')}
      ${group('College','COLLEGE')}
      ${group('Pro','PRO')}
      ${liveRow()}
      ${tot('pro','PRO TOTALS (regular season)')}
      ${tot('havoc','HAVOC TOTALS (regular season)')}
    </table></div>
    ${p.notes?`<div class="ms-notes">&#9432; ${esc(p.notes)}</div>`:''}`;
  tsWire(el,'career');
}
