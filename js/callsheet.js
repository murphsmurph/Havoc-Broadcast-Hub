/* ============================================================
   CALL SHEET — one legal-portrait page per team (8.5 x 14 in)
   Styled after Jacob's hand-built HSV vs MC sheet: a header band in the club's
   colour with the logo, record and championships, a coaches box, then three
   columns — a data column on the left (results, transactions, standings, team
   data, periods), one row per player in the middle (band: position, first name,
   height-weight, season line; a big number badge; LAST NAME, pronunciation,
   hometown, GP) and bullet notes on the right — with IR / ECHL / scratches and
   LINES / NOTES write-ins under the players. Rendered from a plain model so the
   Broadcast Folders (fdCallSheetModel, packet.js) and the Preseason tab
   (ppCallSheetModel, preseason-pen.js) share one layout. Every size rides one
   --csf scale per sheet, stepped by csFit at print size. Classic script, file://.
   ============================================================ */
const CSL_BOX={w:'7.95in',h:'13.45in'};   // legal less the folders' 0.25in margins and 0.05in slack
const CSL_STEPS=Array.from({length:81},(_,i)=>+(1.6-i*0.01).toFixed(2));   // 1.60 down to 0.80 by 0.01

function cslT(v){return esc(String(v==null?'':v));}
function cslLines(v){
  const arr=Array.isArray(v)?v:String(v||'').split('\n');
  return arr.map(x=>String(x==null?'':x).trim()).filter(Boolean);
}

/* a player row: band / badge + identity on the left, bullet notes on the right */
function cslRowHTML(p){
  const first=`(${cslT(p.pos||'')}) ${cslT(p.first||'')}`.trim();
  const band=[first,p.hw?cslT(p.hw):'',p.stat?cslT(p.stat):''].filter(Boolean)
    .map(s=>`<span>${s}</span>`).join('<span class="csl-sep">|</span>');
  const meta=[p.hometown?cslT(p.hometown):'',p.gp?cslT(p.gp):''].filter(Boolean).join(' &middot; ');
  const bullets=cslLines(p.bullets).map(b=>`<div>${cslT(b.replace(/^[•\-\s]+/,''))}</div>`).join('');
  const ed=p.noteKey?` contenteditable="true" spellcheck="false" data-t="${cslT(p.noteTeam||'')}" data-k="${cslT(p.noteKey)}"`:'';
  return `<div class="csl-row">
    <div class="csl-pl">
      <div class="csl-band">${band}</div>
      <div class="csl-pl2"><span class="csl-badge">${cslT(p.num||'')}</span>
        <div class="csl-id"><div class="csl-last">${cslT(String(p.last||'').toUpperCase())}${p.letter?` <span class="csl-let">(${cslT(p.letter)})</span>`:''}</div>
          ${p.pron?`<div class="csl-pron">(${cslT(p.pron)})</div>`:''}
          ${meta?`<div class="csl-meta">${meta}</div>`:''}</div></div>
    </div>
    <div class="csl-bul${p.noteKey?' fv':''}"${ed}>${bullets}</div>
  </div>`;
}
/* the data column: whichever of these the model carries, in this order */
function cslLeftHTML(L){
  if(!L)return '';
  const sec=t=>`<div class="csl-sec">${cslT(t)}</div>`;
  let h='';
  if(L.results||L.upcoming){
    const row=(r,cls)=>`<tr${cls?' class="'+cls+'"':''}><td>${cslT(r.date)}</td><td>${cslT(r.away)}</td><td>${cslT(r.home)}</td><td class="csl-r${r.cls?' csl-'+cslT(r.cls):''}">${cslT(r.result||'')}</td></tr>`;
    const rows=(L.results||[]).map(r=>row(r,'')).join('')+(L.upcoming||[]).map(r=>row(r,'csl-up')).join('');
    h+=sec(L.resultsTitle||'Results')+`<table class="csl-res"><tr><th>Date</th><th>Away</th><th>Home</th><th>Result</th></tr>${rows||'<tr><td colspan="4" class="csl-dim">No finals yet</td></tr>'}</table>`;
  }
  if(L.txHTML!=null)h+=sec('Transactions')+`<div class="csl-tx">${L.txHTML}</div>`;
  if(L.standings){
    h+=sec(L.standingsTitle||'Standings')+(L.standings.map(s=>
      `<div class="csl-st${s.isMe?' csl-me':''}"><span class="csl-seed">${cslT(s.seed)}</span><span class="csl-stt">${cslT(s.team)}</span><span class="csl-stv">${s.valueHTML||''}</span></div>`
      +(s.poAfter?'<div class="csl-po">******* PLAYOFF LINE *******</div>':'')).join('')||'<div class="csl-dim">No standings synced</div>');
  }
  if(L.data)h+=sec(L.dataTitle||'Team data')+L.data.map(d=>`<div class="csl-dr"><span class="csl-dl">${cslT(d.label)}</span><span class="csl-dv">${d.valueHTML||''}</span></div>`).join('');
  if(L.periods)h+=`<table class="csl-per"><tr><th></th><th>GF</th><th>GA</th><th>SF</th><th>SA</th></tr>${L.periods.map(r=>`<tr><th>${cslT(r.label)}</th>${(r.cells||[]).map(c=>`<td>${c||''}</td>`).join('')}</tr>`).join('')}</table>`;
  (L.blocks||[]).forEach(b=>{h+=sec(b.title)+(cslLines(b.rows).map(r=>`<div class="csl-br">${cslT(r)}</div>`).join('')||'<div class="csl-dim">—</div>');});
  return h;
}
function cslStatusHTML(s){
  if(!s)return '';
  const cell=(t,rows)=>`<div class="csl-sc"><div class="csl-sh">${t}</div>${cslLines(rows).map(r=>`<div>${cslT(r)}</div>`).join('')||'<div class="csl-dim">—</div>'}</div>`;
  return `<div class="csl-status">${cell('IR',s.ir)}${cell('ECHL',s.echl)}${cell('SCRATCHES',s.scratch)}</div>`;
}
function cslWriteHTML(){
  return `<div class="csl-write"><div class="csl-wbox"><div class="csl-wh">LINES</div><div class="cs-write csl-rule"></div></div><div class="csl-wbox"><div class="csl-wh">NOTES</div><div class="cs-write csl-rule"></div></div></div>`;
}
/* the sheet. The root must start "<div class="page" — the callers string-replace
   that to add their data-sec and preview classes. */
function callSheetHTML(m){
  const pri=m.primary||'#C8102E',on=m.textOn||'#fff',num=m.numText||on;   // the digits may differ from the band text (Havoc: black on red)
  const coaches=(m.coaches||[]).filter(c=>c&&c.name).map(c=>`<span class="csl-co"><b>(${cslT(c.role||'')})</b> ${cslT(c.name)}${c.extra?` <i>— ${cslT(c.extra)}</i>`:''}</span>`).join('');
  const players=(m.players||[]).map(cslRowHTML).join('')||`<div class="csl-empty">${cslT(m.emptyNote||'No roster yet.')}</div>`;
  const writeLeft=m.writeIns==='left';
  return `<div class="page csl-page" style="--pri:${cslT(pri)};--on:${cslT(on)};--num:${cslT(num)}">
    <div class="csl-head">${m.logo?`<img class="csl-logo" src="${cslT(m.logo)}" alt="">`:''}
      <div class="csl-title"><div class="csl-h1">${cslT(m.title||m.team||'')}</div>${m.sub?`<div class="csl-h2">${cslT(m.sub)}</div>`:''}</div></div>
    ${m.game?`<div class="csl-game">${cslT(m.game)}</div>`:''}
    ${m.susp?`<div class="csl-susp">*** ${cslT(String(m.susp).toUpperCase())} ***</div>`:''}
    ${coaches?`<div class="csl-coaches">${coaches}</div>`:''}
    <div class="csl-body">
      <aside class="csl-left">${cslLeftHTML(m.left)}${writeLeft?cslWriteHTML():''}</aside>
      <section class="csl-players">${players}${cslStatusHTML(m.status)}${writeLeft?'':cslWriteHTML()}</section>
    </div>
    <div class="csl-foot">${m.foot&&m.foot.contact?`<div class="fd-contact">${cslT(m.foot.contact)}</div>`:''}${(m.foot&&m.foot.stampHTML)||''}</div>
  </div>`;
}
/* Type size per sheet: step --csf down from the largest size until the sheet,
   its data column and its player column all fit the PRINT box (legal with the
   0.25in margins — narrower than the 816px preview, so text wraps more on
   paper). The chosen scale and any leftover overflow at the floor are kept on
   the page element for the fit reports. */
function cslOverflow(pg){
  const l=pg.querySelector('.csl-left'),p=pg.querySelector('.csl-players');
  return Math.max(pg.scrollHeight-pg.clientHeight,l?l.scrollHeight-l.clientHeight:0,p?p.scrollHeight-p.clientHeight:0);
}
function csFit(pages){
  [...(pages||[])].forEach(pg=>{
    if(!pg.offsetWidth)return;                       // hidden panel: leave the defaults
    const keep=[pg.style.width,pg.style.height,pg.style.minHeight];
    pg.style.width=CSL_BOX.w;pg.style.height=CSL_BOX.h;pg.style.minHeight='0';
    let chosen=CSL_STEPS[CSL_STEPS.length-1],over=0;
    for(const f of CSL_STEPS){
      pg.style.setProperty('--csf',f);
      over=cslOverflow(pg);
      if(over<=0){chosen=f;break;}
    }
    pg.style.setProperty('--csf',chosen);
    pg.dataset.csf=chosen;pg.dataset.csOver=Math.max(0,over);
    pg.style.width=keep[0];pg.style.height=keep[1];pg.style.minHeight=keep[2];
  });
}
