/* Print — the layout system that turns the preview into paper: per-section
   point sizing and bolding, the packet block-flow engine that keeps one .page
   equal to one sheet, the auto-fit passes, and printDoc itself. Extracted
   verbatim in the P3 split. Nothing here decides WHAT prints, only how it fits. */

/* ============ PRINTED SECTION STYLING (size + bold, per section) ============
   Each printable page carries data-sec. A section's size is stored in whole
   points and applied as a proportional zoom, so headers, rows, padding and
   callout lines all scale together and the PDF matches the preview exactly. */
const SEC_BASE={packet:8,folders:10,chart:8,lines:8,verbs:8};   // default body size, in pt, per output
const SEC_LABEL_EXTRA={
  'fd:hl':'Havoc call sheet','fd:hd':'Havoc data','fd:ol':'Opponent call sheet','fd:od':'Opponent data',
  'chart:hsv':'Havoc chart','chart:opp':'Opponent chart',lines:'Line card',
  'vb:verbs':'Verb list','vb:map':'Ice map'
};
function secLabel(key){
  if(SEC_LABEL_EXTRA[key])return SEC_LABEL_EXTRA[key];
  const hit=(typeof PACKET_SECTIONS!=='undefined')&&PACKET_SECTIONS.find(s=>s[0]===key);
  return hit?hit[1]:key;
}
function secFamily(key){
  if(key.indexOf('fd:')===0)return 'folders';
  if(key.indexOf('chart:')===0)return 'chart';
  if(key.indexOf('vb:')===0)return 'verbs';
  if(key==='lines')return 'lines';
  return 'packet';
}
function secBase(key){return SEC_BASE[secFamily(key)]||8;}
/* auto-fit's own value for a section, used only where he hasn't set one himself */
function secAutoPt(key){const v=+((DATA.secAuto||{})[key]);return (v>=6&&v<=16)?v:0;}
function secPt(key){
  DATA.secPt=DATA.secPt||{};
  const v=+DATA.secPt[key];
  if(!(v>=6&&v<=16)&&secAutoPt(key))return secAutoPt(key);
  return (v>=6&&v<=16)?v:secBase(key);
}
function secBold(key){return !!((DATA.secBold||{})[key]);}
function secSetPt(key,pt){
  pt=Math.max(6,Math.min(16,Math.round(pt)));
  DATA.secPt=DATA.secPt||{};
  if(DATA.secAuto)delete DATA.secAuto[key];   // his click takes the section back from auto-fit
  if(pt===secBase(key))delete DATA.secPt[key];else DATA.secPt[key]=pt;
  save();
  if(secFamily(key)==='packet'&&document.getElementById('packetDoc'))renderPacket();
  else secApplyAll();
}
function secStep(key,d){secSetPt(key,secPt(key)+d);}
function secToggleBold(key){
  DATA.secBold=DATA.secBold||{};
  if(secBold(key))delete DATA.secBold[key];else DATA.secBold[key]=1;
  save();secApplyAll();
}
function secReset(key){
  if(DATA.secPt)delete DATA.secPt[key];
  if(DATA.secBold)delete DATA.secBold[key];
  if(DATA.secAuto)delete DATA.secAuto[key];
  save();
  if(secFamily(key)==='packet'&&document.getElementById('packetDoc'))renderPacket();
  else secApplyAll();
}
function secToolsHTML(key){
  const pt=secPt(key);
  return `<div class="sec-tools no-print">
    <button title="1 pt smaller" onclick="event.stopPropagation();secStep('${key}',-1)">A&minus;</button>
    <span class="sec-pt">${pt} pt</span>
    <button title="1 pt larger" onclick="event.stopPropagation();secStep('${key}',1)">A+</button>
    <button class="${secBold(key)?'on':''}" title="Bold this section's body text" onclick="event.stopPropagation();secToggleBold('${key}')"><b>B</b></button>
    <button title="Back to the default" onclick="event.stopPropagation();secReset('${key}')">&#8635;</button>
  </div>`;
}
/* apply stored size/bold to every built page, and warn about anything that overflows */
function secApplyAll(){
  const sv=SUBTABS.print;
  const host=document.querySelector('#panel-'+(sv==='verbiage'?'verbiage':sv)+' .doc-scroll');
  const pages=[...document.querySelectorAll('#panel-print .subview.active .page')];
  const over=[];
  pages.forEach((p,i)=>{
    const key=p.dataset.sec;if(!key)return;
    const pt=secPt(key);
    // scale the CONTENT, never the page box — the sheet stays one letter page,
    // so a size change can make content stop fitting but can never spill onto
    // extra printed pages
    let z=p.querySelector(':scope > .sec-zoom');
    if(!z){
      z=document.createElement('div');z.className='sec-zoom';
      const keep=[...p.childNodes].filter(n=>!(n.nodeType===1&&n.classList.contains('sec-tools')));
      keep.forEach(n=>z.appendChild(n));
      p.appendChild(z);
    }
    z.style.zoom=(pt/secBase(key)).toFixed(4);
    p.style.zoom='';
    p.classList.toggle('sec-bold',secBold(key));
    if(!p.querySelector(':scope > .sec-tools'))p.insertAdjacentHTML('afterbegin',secToolsHTML(key));
    else p.querySelector(':scope > .sec-tools').outerHTML=secToolsHTML(key);
  });
  pgFooterFix(host||document);
  secRenderBar(null); // controls appear immediately; the overflow check follows a frame later
  // measure after the zoom lands
  requestAnimationFrame(()=>{
    pages.forEach((p,i)=>{
      const key=p.dataset.sec;if(!key)return;
      // a page that grows past one letter sheet, or any block inside it that has
      // started clipping its own content — both read as "this no longer fits"
      const z=p.querySelector(':scope > .sec-zoom');
      const scale=z?(+z.style.zoom||1):1;
      const grew=p.offsetHeight-1056>2;                              // auto-height page past a sheet
      const spills=z?(z.scrollHeight*scale)-p.clientHeight>2:false;  // scaled content past the fixed sheet
      // horizontal: anything reaching past the page's content box is cut off on paper
      const box=p.getBoundingClientRect(),cs=getComputedStyle(p);
      const right=box.right-parseFloat(cs.paddingRight)-parseFloat(cs.borderRightWidth||0)+1;
      let wide=0;
      (z||p).querySelectorAll('*').forEach(el=>{
        const r=el.getBoundingClientRect();
        if(r.width>0&&r.right>right)wide=Math.max(wide,Math.round(r.right-right));
      });
      p.classList.toggle('pg-over',!!(grew||spills||wide));
      const tag=p.querySelector(':scope > .pg-overtag');
      if(grew||spills||wide){
        const why=wide?('runs '+wide+'px past the right edge'):'is taller than one sheet';
        const html='<div class="pg-overtag no-print">This page '+why+
          ' <button onclick="event.stopPropagation();secStep(\''+key+'\',-1)">reduce '+esc(secLabel(key))+' by 1 pt</button></div>';
        if(tag)tag.outerHTML=html;else p.insertAdjacentHTML('afterbegin',html);
        over.push({i:i+1,key,wide});
      }else if(tag)tag.remove();
    });
    secRenderBar(over);
  });
  const badge=document.getElementById('prPages');
  if(badge)badge.textContent=pages.length+(pages.length===1?' page':' pages');
}
/* The same auto-fit the packet gets, for the other printable views: a page
   that has stopped fitting steps its section down rather than spilling.
   Anything he sized himself is left alone, and it stops at 7 pt. */
async function fitActiveAuto(){
  for(let pass=0;pass<6;pass++){
    await new Promise(r=>requestAnimationFrame(()=>setTimeout(r,0)));
    let moved=false;
    document.querySelectorAll('#panel-print .subview.active .page').forEach(p=>{
      const key=p.dataset.sec;if(!key)return;
      if((DATA.secPt||{})[key])return;
      if(secPt(key)<=7)return;
      if(pkUsed(p)>pkRoom(p)+2){
        DATA.secAuto=DATA.secAuto||{};
        DATA.secAuto[key]=secPt(key)-1;moved=true;
      }
    });
    if(!moved)break;
    save();secApplyAll();
  }
}
/* Step every overflowing section down until its pages fit, so the PDF can't
   come out longer than the preview. Bounded, and it reports what it changed. */
async function secFitAll(){
  const changed={};
  for(let pass=0;pass<12;pass++){
    await new Promise(r=>requestAnimationFrame(()=>setTimeout(r,0)));
    const bad=[];
    document.querySelectorAll('#panel-print .subview.active .page').forEach(p=>{
      const key=p.dataset.sec;if(!key)return;
      const z=p.querySelector(':scope > .sec-zoom');
      const scale=z?(+z.style.zoom||1):1;
      const tall=p.offsetHeight-1056>2||(z&&(z.scrollHeight*scale)-p.clientHeight>2);
      if(tall&&bad.indexOf(key)<0)bad.push(key);
    });
    if(!bad.length)break;
    let moved=false;
    bad.forEach(k=>{if(secPt(k)>6){secStep(k,-1);changed[k]=(changed[k]||0)+1;moved=true;}});
    if(!moved)break;
  }
  const list=Object.keys(changed);
  toast(list.length?('Fitted '+list.map(k=>secLabel(k)+' −'+changed[k]+'pt').join(', ')):'Everything already fits');
}
function secRenderBar(over){
  const bar=document.getElementById('prSecBar');if(!bar)return;
  const keys=[];
  document.querySelectorAll('#panel-print .subview.active .page').forEach(p=>{
    if(p.dataset.sec&&keys.indexOf(p.dataset.sec)<0)keys.push(p.dataset.sec);
  });
  if(!keys.length){bar.innerHTML='';return;}
  bar.innerHTML=`<div class="sec-bar"><h4>Section size &amp; weight — 1 pt per click, saved with your layout</h4>`
   +keys.map(k=>`<span class="sec-item hub-sectionctrl"><span class="sec-nm hub-sectionctrl__label">${esc(secLabel(k))}</span>
      <button title="1 pt smaller" onclick="secStep('${k}',-1)">A&minus;</button>
      <span class="sec-pt hub-sectionctrl__value">${secPt(k)} pt</span>
      <button title="1 pt larger" onclick="secStep('${k}',1)">A+</button>
      <button class="${secBold(k)?'on':''}" aria-pressed="${secBold(k)?'true':'false'}" title="Bold the body text" onclick="secToggleBold('${k}')"><b>B</b></button>
      <button title="Back to the default" onclick="secReset('${k}')">&#8635;</button>${secAutoPt(k)&&!((DATA.secPt||{})[k])?`<span class="sec-auto" title="Auto-fitted to save a page">auto</span>`:''}</span>`).join('')
   +((over||[]).length?`<div class="sec-warn"><button class="sec-fix" style="margin-bottom:4px" onclick="secFitAll()">Fit every page (steps the offenders down until they fit)</button><br>${over.map(o=>'Page '+o.i+' ('+esc(secLabel(o.key))+') '+(o.wide?'runs '+o.wide+'px past the right edge':'overflows the page')+' — <button class="sec-fix" onclick="secStep(\''+o.key+'\',-1)">reduce by 1 pt</button>').join('<br>')}</div>`:'')
   +autoFitNoteHTML()
   +`</div>`;
}
/* what auto-fit did, said plainly */
function autoFitNoteHTML(){
  const a=DATA.secAuto||{};
  const ks=Object.keys(a).filter(k=>!((DATA.secPt||{})[k]));
  if(!ks.length)return '';
  return `<div class="sec-auto-note">${ks.map(k=>esc(secLabel(k))+' auto-fit to '+a[k]+' pt').join(' · ')}</div>`;
}
/* Collect a printed page's furniture into one stacked block at the foot of
   the sheet, and reserve the same height in the flow above it. Before this,
   the footer was absolutely positioned and the freshness line was in the
   flow, so on a full page they printed on top of each other. */
function pgFooterFix(root){
  if(!root)return;
  root.querySelectorAll('.page').forEach(p=>{
    const zone=p.querySelector(':scope > .sec-zoom')||p;
    const foot=zone.querySelector(':scope > .gn-foot');
    if(!foot)return;                       // pages without a footer rule are laid out their own way
    let box=zone.querySelector(':scope > .pg-footer');
    if(!box){box=document.createElement('div');box.className='pg-footer';zone.appendChild(box);}
    // order: freshness line, then the rule and the footer row
    [...zone.children].filter(el=>el!==box&&el.classList.contains('pg-stamp'))
      .forEach(el=>box.appendChild(el));
    box.appendChild(foot);
    let pad=zone.querySelector(':scope > .pg-footpad');
    if(!pad){pad=document.createElement('div');pad.className='pg-footpad';}
    if(pad.nextSibling!==box)zone.insertBefore(pad,box);
    pad.style.height=(box.offsetHeight+6)+'px';
  });
}
/* ============================================================
   PACKET BLOCK LAYOUT
   Every printable page is built from blocks — a stat table, a bio card, a
   news box, a worksheet. This lays them out: it flows blocks onto as few
   sheets as they fit on, never splits one across a page break, and keeps a
   The per-section sizes plus "Fit every page" are the whole layout system.
   Pages the club's layout depends on (the cover, the game sheet, the ice
   map, the worksheets) are left exactly as they were built.
   ============================================================ */
const PK_NOFLOW={cover:1,gamesheet:1,worksheets:1,verbs:1};
const PK_CHROME=['pg-head','gn-foot','pg-footer','pg-footpad','mc-strip','sec-tools','pg-overtag','pg-stamp'];
function pkLayoutReset(){
  if(!confirm('Put every packet section back to its default printed size and weight?'))return;
  DATA.secPt={};DATA.secBold={};DATA.secAuto={};save();renderPacket();toast('Packet sizing reset');
}
/* the blocks that make up a page, in print order — page furniture excluded */
function pkFlowKids(host){
  return [...host.children].filter(el=>el.nodeType===1&&!el.classList.contains('sec-zoom')
    &&!PK_CHROME.some(c=>el.classList.contains(c)));
}
function pkZone(pg){return pg.querySelector(':scope > .sec-zoom')||pg;}
/* every flowable block on the packet, in build order */
function pkTag(){
  const out=[];
  document.querySelectorAll('#packetDoc .page').forEach(pg=>{
    const sec=pg.dataset.sec||'';
    pkFlowKids(pkZone(pg)).forEach(el=>{out.push({sec,el});});
  });
  return out;
}
/* Measure in heights, never in page positions: a scrolling preview or a
   phone-scaled page moves every coordinate, but a height is a height. */
function pkScale(pg){const w=pg.getBoundingClientRect().width;return w>0?w/816:1;}
/* how much of a sheet a page's content may fill before it reaches the footer */
function pkRoom(pg){
  const s=pkScale(pg);
  const foot=pg.querySelector('.pg-footer')||pg.querySelector('.gn-foot');
  const fh=foot?foot.getBoundingClientRect().height/s:0;
  const padT=parseFloat(getComputedStyle(pg).paddingTop)||34;
  return 1056-padT-18-fh-14;    // a little slack so a trailing margin can't tip a page over
}
/* how much of it the content actually fills */
function pkUsed(pg){
  const z=pkZone(pg);
  if(z===pg)return 0;
  return z.getBoundingClientRect().height/pkScale(pg);
}
/* Flow one section's blocks onto as few sheets as they fit on. A block is
   atomic: it never splits, it moves whole to the next page. */
function pkFlowSection(pages,blocks){
  if(!pages.length)return pages;
  const host=pages[0].parentNode,after=pages[pages.length-1].nextSibling;
  const tmpl=pages[0].cloneNode(true);
  pkFlowKids(pkZone(tmpl)).forEach(k=>k.remove());
  const tag=pkZone(tmpl).querySelector('.pg-overtag');if(tag)tag.remove();
  pages.slice(1).forEach(p=>p.remove());
  const first=pages[0];
  pkFlowKids(pkZone(first)).forEach(k=>k.remove());
  first.classList.remove('pg-over');
  const out=[first];
  let pg=first,zone=pkZone(pg),room=pkRoom(pg);
  // the footer block and its spacer stay at the end of the page; body blocks
  // are inserted above them so nothing ever flows underneath the footer
  const tail=z=>z.querySelector(':scope > .pg-footpad')||z.querySelector(':scope > .pg-footer');
  const put=el=>{const t=tail(zone);if(t)zone.insertBefore(el,t);else zone.appendChild(el);};
  const nextPage=()=>{
    pg=tmpl.cloneNode(true);host.insertBefore(pg,after);out.push(pg);
    zone=pkZone(pg);room=pkRoom(pg);
  };
  blocks.forEach(b=>{
    put(b.el);
    // a block never splits: if it puts the page over, it moves whole
    if(pkFlowKids(zone).length>1&&pkUsed(pg)>room){nextPage();put(b.el);}
  });
  return out;
}
/* page numbers are only knowable once the flow has settled */
function pkNumberPages(){
  [...document.querySelectorAll('#packetDoc .page')].forEach((pg,i)=>{
    pg.querySelectorAll('.pg-num').forEach(el=>{el.textContent='PAGE '+(i+1);});
    const foot=pg.querySelector('.gn-foot');
    if(foot&&foot.lastElementChild)foot.lastElementChild.textContent='PAGE '+(i+1);
  });
}
let PK_LAYOUT_BUSY=false;
function pkLayout(){
  const doc=document.getElementById('packetDoc');if(!doc)return;
  const blocks=pkTag();
  // group each section's pages together, then reflow the ones that may flow
  const bySec={};
  [...doc.querySelectorAll('.page')].forEach(pg=>{
    const s=pg.dataset.sec||'';(bySec[s]=bySec[s]||[]).push(pg);
  });
  Object.keys(bySec).forEach(sec=>{
    if(PK_NOFLOW[sec])return;
    const mine=blocks.filter(b=>b.sec===sec);
    if(!mine.length)return;
    pkFlowSection(bySec[sec],mine);
  });
  pkNumberPages();
}
/* Auto-fit: when a section is within ~10% of fitting on one fewer sheet, take
   it down a point rather than print a nearly empty page. Never below 7 pt. */
function pkAutoFit(){
  const doc=document.getElementById('packetDoc');if(!doc)return {};
  const changed={};
  for(let pass=0;pass<6;pass++){
    const bySec={};
    [...doc.querySelectorAll('.page')].forEach(pg=>{
      const s=pg.dataset.sec||'';if(PK_NOFLOW[s])return;
      (bySec[s]=bySec[s]||[]).push(pg);
    });
    let moved=false;
    // a page of a fixed section that no longer fits gets stepped down too —
    // otherwise its content prints underneath the footer
    [...doc.querySelectorAll('.page')].forEach(pg=>{
      const sec=pg.dataset.sec;if(!sec)return;
      if((DATA.secPt||{})[sec])return;
      if(secPt(sec)<=7)return;
      if(pkUsed(pg)>pkRoom(pg)+2){
        DATA.secAuto=DATA.secAuto||{};
        DATA.secAuto[sec]=secPt(sec)-1;moved=true;
      }
    });
    Object.keys(bySec).forEach(sec=>{
      const pages=bySec[sec];
      if(pages.length<2)return;
      if((DATA.secPt||{})[sec])return;                 // he set this one himself
      const floor=7;
      if(secPt(sec)<=floor)return;
      let used=0;
      const s=pkScale(pages[0]);
      pages.forEach(pg=>{pkFlowKids(pkZone(pg)).forEach(k=>{used+=k.getBoundingClientRect().height/s;});});
      const kids0=pkFlowKids(pkZone(pages[0]));
      const chrome=[...pkZone(pages[0]).children].filter(c=>kids0.indexOf(c)<0)
        .reduce((t,c)=>t+c.getBoundingClientRect().height/s,0);
      const target=(pages.length-1)*Math.max(1,pkRoom(pages[0])-chrome);
      if(used<=target*1.10){
        DATA.secAuto=DATA.secAuto||{};
        DATA.secAuto[sec]=secPt(sec)-1;
        changed[sec]=DATA.secAuto[sec];
        moved=true;
      }
    });
    if(!moved)break;
    save();
    pkRebuild();
  }
  return changed;
}
/* toolbar actions that used to be duplicated per section */
function prClearEdits(){
  const s=SUBTABS.print;
  if(s==='folders'){if(confirm('Clear every hand-edited value on the broadcast folders?')){DATA.folderOv={};save();renderFolders();}}
  else if(s==='verbiage')vbReset();
  else toast('Nothing to clear here — this content comes from the data files');
}
/* packet then folders, in one job — the order the booth folder gets assembled */
function printTonight(){
  renderPacket();renderFolders();
  const panel=document.getElementById('panel-print');
  const pk=document.getElementById('panel-packet'),fd=document.getElementById('panel-folders');
  [panel,pk,fd].forEach(el=>el&&el.classList.add('printing'));
  imagesReady(pk,3500).then(()=>{
    mtpDetectDefaults(pk);
    setTimeout(()=>{window.print();[panel,pk,fd].forEach(el=>el&&el.classList.remove('printing'));},120);
  });
}
function prRefresh(){
  const s=SUBTABS.print;
  if(s==='packet'){saveNotesExtra();renderPacket();}
  else if(s==='chart')renderChart();
  else if(s==='folders')renderFolders();
  else if(s==='verbiage')renderVerbiage();
  else renderLinesDoc();
}
function prPrint(){printDoc(SUBTABS.print);}
function prSyncBar(){secApplyAll();}


/* ============ PRINT ============ */
function printDoc(which){
  const map={chart:renderChart,packet:renderPacket,lines:renderLinesDoc,folders:renderFolders,verbiage:renderVerbiage};
  if(map[which])map[which]();
  const panel=document.getElementById('panel-'+which);
  // mark the target AND its host panel (Print Center wraps these as sub-views)
  const marks=[panel];
  const host=panel.closest('.panel');
  if(host&&host!==panel)marks.push(host);
  marks.forEach(m=>m.classList.add('printing'));
  let st=null;
  if(which==='chart'||which==='folders'){ // letter vertical (portrait), one page per side
    st=document.createElement('style');
    st.textContent='@page{size:letter portrait;margin:0.25in;}';
    document.head.appendChild(st);
  }
  // photos fully loaded (or collapsed to text-only) before the dialog opens
  imagesReady(panel,3000).then(()=>{
    mtpDetectDefaults(panel);
    setTimeout(()=>{window.print();marks.forEach(m=>m.classList.remove('printing'));if(st)st.remove();},120);
  });
}

