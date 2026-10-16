/* ============================================================
   CALL SHEET — one legal-portrait page per team (8.5 x 14 in)
   Laid out after Jacob's filled-in HSV sheet: a tinted two-line header (club,
   season record, place, the weekend's game line; championships, season number,
   roster count, phonetics note), a centred coaches box, then three columns —
   the data column on the left (schedule with this weekend shaded, transactions,
   standings, the "Data:" block with write-in lines, LINES / NOTES), one row per
   player in the middle (band: position, FIRST NAME, height-weight, season line;
   a big number badge; LAST NAME with the letter; hometown | GP cells) and bullet
   notes on the right, the first one led by the phonetic ("Say: GOCK-ler").
   Rendered from a plain model so the Broadcast Folders (fdCallSheetModel,
   packet.js) and the Preseason tab (ppCallSheetModel, preseason-pen.js) share
   one layout. Every size rides one --csf scale per sheet, stepped by csFit at
   print size. Classic script, file://.
   ============================================================ */
const CSL_BOX={w:'7.95in',h:'13.45in'};   // legal less the folders' 0.25in margins and 0.05in slack
const CSL_STEPS=Array.from({length:86},(_,i)=>+(1.6-i*0.01).toFixed(2));   // 1.60 down to 0.75 by 0.01

function cslT(v){return esc(String(v==null?'':v));}
function cslLines(v){
  const arr=Array.isArray(v)?v:String(v||'').split('\n');
  return arr.map(x=>String(x==null?'':x).trim()).filter(Boolean);
}
/* a player row: band / badge + name / hometown | GP on the left, bullets on the right */
function cslRowHTML(p){
  const b1=`(${cslT(p.pos||'')}) ${cslT(String(p.first||'').toUpperCase())}`.trim();
  const bullets=cslLines(p.bullets).map(b=>b.replace(/^[•\-\s]+/,''));
  const say=p.pron?`<b class="csl-say" contenteditable="false">Say: ${cslT(p.pron)}</b>`:'';
  let items=bullets.map(b=>`<div>${cslT(b)}</div>`);
  if(say){
    if(items.length)items[0]=`<div>${say} &middot; ${cslT(bullets[0])}</div>`;
    else items=[`<div>${say}</div>`];
  }
  const ed=p.noteKey?` contenteditable="true" spellcheck="false" data-t="${cslT(p.noteTeam||'')}" data-k="${cslT(p.noteKey)}"`:'';
  return `<div class="csl-row">
    <div class="csl-pl">
      <div class="csl-band"><span class="csl-b1">${b1}</span><span class="csl-b2">${cslT(p.hw||'')}</span><span class="csl-b3">${cslT(p.stat||'')}</span></div>
      <div class="csl-pl2"><span class="csl-badge${p.num?'':' csl-tbd'}">${cslT(p.num||'TBD')}</span>
        <div class="csl-id"><div class="csl-last">${cslT(String(p.last||'').toUpperCase())}${p.letter?` <span class="csl-let">(${cslT(p.letter)})</span>`:''}</div></div></div>
      <div class="csl-cells"><span class="csl-home">${cslT(p.hometown||'')}</span>${p.gp?`<span class="csl-gp">${cslT(p.gp)}</span>`:''}</div>
    </div>
    <div class="csl-bul${p.noteKey?' fv':''}"${ed}>${items.join('')}</div>
  </div>`;
}
/* the data column, in the sheet's order: schedule, transactions, standings, data, extra blocks */
function cslLeftHTML(L){
  if(!L)return '';
  const sec=t=>`<div class="csl-sec">${cslT(t)}</div>`;
  let h='';
  if(L.schedule){
    const rows=L.schedule.map(r=>`<tr${r.hl?' class="csl-hl"':''}><td>${cslT(r.date)}</td><td${r.homeSide==='away'?' class="csl-bold"':''}>${cslT(r.away)}</td><td${r.homeSide==='home'?' class="csl-bold"':''}>${cslT(r.home)}</td><td class="csl-r">${cslT(r.result||'')}</td></tr>`).join('');
    h+=`<table class="csl-sch"><tr><th>Date</th><th>Away</th><th>Home</th><th>Result</th></tr>${rows||'<tr><td colspan="4" class="csl-dim">No schedule loaded</td></tr>'}</table>`;
  }
  if(L.tx){
    const rows=L.tx.map(r=>`<tr><td class="csl-txd">${cslT(r.date)}</td><td class="csl-txw">${cslT(r.who)}</td><td>${cslT(r.what)}</td></tr>`).join('');
    h+=`<table class="csl-tx">${rows||'<tr><td colspan="3" class="csl-dim">No transactions entered</td></tr>'}</table>`;
  }
  if(L.standings){
    h+=sec(L.standingsTitle||'Standings')+(L.standings.map(s=>
      `<div class="csl-st${s.isMe?' csl-me':''}"><span class="csl-seed">${cslT(s.seed)}.</span><span class="csl-stt">${cslT(s.team)}</span><span class="csl-rec">${cslT(s.rec)}</span><span class="csl-pts">${cslT(s.pts)} pts</span></div>`).join('')||'<div class="csl-dim">No standings synced</div>');
  }
  if(L.data)h+=sec(L.dataTitle||'Data:')+L.data.map(d=>`<div class="csl-dr"><span class="csl-dl">${cslT(d.label)}</span><span class="csl-dv">${d.valueHTML||''}</span></div>`).join('');
  (L.blocks||[]).forEach(b=>{h+=sec(b.title)+(cslLines(b.rows).map(r=>`<div class="csl-br">${cslT(r)}</div>`).join('')||'<div class="csl-dim">—</div>');});
  return h;
}
function cslWriteHTML(){
  return `<div class="csl-write"><div class="csl-wbox"><div class="csl-wh">LINES</div><div class="cs-write csl-rule"></div></div><div class="csl-wbox"><div class="csl-wh">NOTES</div><div class="cs-write csl-rule"></div></div></div>`;
}
/* the sheet. The root must start "<div class="page" — the callers string-replace
   that to add their data-sec and preview classes. */
function callSheetHTML(m){
  const pri=m.primary||'#C8102E',on=m.textOn||'#fff',num=m.numText||on;
  const co=m.coaches||{};
  const others=(co.others||[]).filter(c=>c&&c.name).map(c=>`<b>(${cslT(c.role||'')})</b> ${cslT(c.name)}`).join(', ');
  const coaches=(co.hc&&co.hc.name)||others
    ?`<div class="csl-coaches">${co.hc&&co.hc.name?`<div class="csl-hc"><b>(HC)</b> ${cslT(co.hc.name)}</div>${co.hc.extra?`<div class="csl-ten">${cslT(co.hc.extra)}</div>`:''}`:''}${others?`<div class="csl-oth">${others}</div>`:''}</div>`:'';
  const players=(m.players||[]).map(cslRowHTML).join('')||`<div class="csl-empty">${cslT(m.emptyNote||'No roster yet.')}</div>`;
  const writeLeft=m.writeIns!=='none';
  return `<div class="page csl-page" style="--pri:${cslT(pri)};--on:${cslT(on)};--num:${cslT(num)}">
    <div class="csl-head"><div class="csl-h1">${cslT(m.title||m.team||'')}</div>${m.sub?`<div class="csl-h2">${cslT(m.sub)}</div>`:''}</div>
    ${m.susp?`<div class="csl-susp">*** ${cslT(String(m.susp).toUpperCase())} ***</div>`:''}
    <div class="csl-body">
      <aside class="csl-left">${coaches}${cslLeftHTML(m.left)}${writeLeft?cslWriteHTML():''}</aside>
      <section class="csl-players">${players}</section>
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
/* a bullet edited on the sheet comes back with its "Say:" lead; the note keeps only his words */
function cslStripSay(text){
  const lines=String(text||'').split('\n').map(x=>x.trim()).filter(Boolean);
  if(lines.length)lines[0]=lines[0].replace(/^Say:\s*[^·]*·\s*/,'').replace(/^Say:\s*.*$/,'');
  return lines.filter(Boolean).join('\n');
}
