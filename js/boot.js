/* Boot — every top-level side effect in the app, in its original order.
   Loaded LAST, after every module, which is what makes the split safe: no module
   runs code at parse time, so nothing can touch a const/let binding declared in a
   file that has not been evaluated yet (65 of them would throw a TDZ
   ReferenceError, not read as undefined).

   Order and content are unchanged from the single-file build. There is still no
   DOMContentLoaded — this file is last in <body>, so the DOM is already parsed,
   exactly as before. */

window.addEventListener('resize',hubPageScale);
window.addEventListener('orientationchange',()=>setTimeout(hubPageScale,50));
if(window.matchMedia)try{window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if((DATA.settings.theme||'system')==='system')themeApply();});}catch(e){}
document.getElementById('tabs').addEventListener('click',e=>{
  if(!e.target.classList.contains('tab'))return;
  showTab(e.target.dataset.tab);
});
document.addEventListener('click',e=>{
  const b=e.target.closest('.subtab');if(!b)return;
  const panel=b.closest('.panel');if(!panel)return;
  subShow(panel.id.replace('panel-',''),b.dataset.sub);
});
document.addEventListener('keydown',e=>{
  if(!(e.metaKey||e.ctrlKey)||e.altKey||e.shiftKey)return;
  const n=parseInt(e.key,10);if(!(n>=1&&n<=9))return;
  const tabs=[...document.querySelectorAll('#tabs .tab')].filter(t=>t.style.display!=='none');
  if(tabs[n-1]){e.preventDefault();showTab(tabs[n-1].dataset.tab);}
});
window.addEventListener('beforeprint',()=>{
  if(document.querySelector('.printing'))return; // printDoc already handled it
  const panel=document.querySelector('.panel.active');if(!panel)return;
  if(panel.id==='panel-gameday'){
    // the booth view is screen-only — print a pointer, not a screen dump
    const note=document.createElement('div');
    note.className='rawprint-note';
    note.textContent='The Game Day view is screen-only — print packets, folders and cards from the Print Center.';
    document.body.appendChild(note);RAWPRINT=[note];
    return;
  }
  RAWPRINT=[panel];panel.classList.add('printing');
  const sv=panel.querySelector('.subview.active');
  if(sv){sv.classList.add('printing');RAWPRINT.push(sv);}
  if(sv&&sv.id==='panel-chart'&&!document.getElementById('rawPrintLand')){
    const st=document.createElement('style');st.id='rawPrintLand';
    st.textContent='@page{size:letter portrait;margin:0.25in;}';
    document.head.appendChild(st);
  }
});
window.addEventListener('afterprint',()=>{
  RAWPRINT.forEach(m=>{m.classList.remove('printing');if(m.classList.contains('rawprint-note'))m.remove();});RAWPRINT=[];
  const st=document.getElementById('rawPrintLand');if(st)st.remove();
});
(async function(){
  try{if(navigator.storage&&navigator.storage.persist)PERSIST_GRANTED=await navigator.storage.persist();}catch(e){PERSIST_GRANTED=false;}
  if(!HAD_LOCAL){
    try{
      const m=await idbGet('mirror');
      if(m&&m.data&&((m.data.roster||[]).length||(m.data.gamelog&&Object.keys(m.data.gamelog).length))
        &&confirm('No saved data was found in this browser, but a mirror copy exists from '+new Date(m.at).toLocaleString()+'.\n\nRestore it?')){
        applyImported(m);
        toast('Restored from the browser mirror');
      }
    }catch(e){}
  }
  bkAutoRun();
  bkReminder();
  bkStatusRender();
})();
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){
  navigator.serviceWorker.register('sw.js').catch(()=>{});
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-SB_LAST>55000)sbStart();});
setInterval(async()=>{
  if(document.hidden)return;
  if(!htKey()&&!htHosted())return;
  try{await htDoStandings();}catch(e){}
  try{await htDoPlayers();}catch(e){}
},3600000);
hubPageScale();themeApply();seedScheduleIfEmpty();initForms();renderRoster();updateAppMark();setTouchIcon();
(function(){if(DATA.opening&&DATA.opening.archived){const b=document.getElementById('tab_opening');if(b)b.style.display='none';}const k=document.getElementById('ht_key');if(k&&DATA.settings.htKey)k.value=DATA.settings.htKey;renderSeasonBar();htShowLastSync();renderSyncBadges();feedAutoCheck();sbStart();loadHockeyOps();dailyBadge();dailyAutoLoad();setInterval(dailyAutoLoad,6*3600000);epLoadStatic().then(d=>{if(d)renderRoster();});Promise.all([msLoad(),biosLoad(),matchupsLoad()]).then(([d])=>{if(d)spineRosterApply();});})();
(function(){const d=document.getElementById('g_date');if(d)d.addEventListener('change',()=>{const p=document.getElementById('g_promo');const pr=promoFor(d.value);if(pr&&p&&!p.value.trim()){p.value=pr;}});})();
