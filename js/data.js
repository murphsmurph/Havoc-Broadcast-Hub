/* Data — the store and the small helpers everything else builds on: the
   localStorage/IndexedDB persistence, DEFAULT_DATA and the DATA object itself,
   the team registries, and the shared string/DOM helpers. Loaded first, so the
   Safari polyfills at the top run before any other module is evaluated.
   Extracted verbatim in the P3 split. */

/* ============ COMPAT (older iOS/macOS Safari) ============ */
if(typeof structuredClone!=='function')window.structuredClone=o=>JSON.parse(JSON.stringify(o));
if(!Promise.any)Promise.any=ps=>new Promise((res,rej)=>{let n=ps.length;const errs=[];if(!n){rej(new Error('empty'));return;}ps.forEach((p,i)=>Promise.resolve(p).then(res,e=>{errs[i]=e;if(--n===0)rej(errs[0]);}));});

/* ============ DATA MODEL ============ */
const TEAMS=["Athens Rock Lobsters","Birmingham Bulls","Evansville Thunderbolts","Fayetteville Marksmen","Huntsville Havoc","Knoxville Ice Bears","Macon Mayhem","Pee Dee IceCats","Pensacola Ice Flyers","Peoria Rivermen","Quad City Storm","Roanoke Rail Yard Dawgs"];
const TEAM_ABBR={"Athens":"ATH","Birmingham":"BHM","Evansville":"EVV","Fayetteville":"FAY","Huntsville":"HSV","Knoxville":"KNX","Macon":"MAC","Pee Dee":"PD","Pensacola":"PEN","Peoria":"PEO","Quad City":"QC","Roanoke":"RNK"};
/* city key for a full team name — two-word cities (Pee Dee, Quad City) stay whole,
   so abbreviation and stat-table key lookups don't silently miss on "Pee"/"Quad" */
function teamCity(t){t=String(t||'').trim();const w=t.split(' ');const two=w.slice(0,2).join(' ');return TEAM_ABBR[two]!==undefined?two:(w[0]||'');}
function teamAbbrOf(t){return TEAM_ABBR[teamCity(t)]||'';}
const KEY="havocHubData_v2";
const DEFAULT_DATA={
  settings:{red:"#C8102E",city:"HUNTSVILLE",name:"HAVOC",venue:"Roto-Rooter Ice at Propst Arena | Huntsville, AL",footer:"2026-2027 HUNTSVILLE HAVOC HOCKEY · HUNTSVILLEHAVOC.COM",social:"@HUNTSVILLEHAVOC",pronounce:"",
    mediaName:"Jacob Murphy",mediaTitle:"Play by Play Broadcaster",mediaOrg:"Huntsville Havoc",mediaPhone:"863-430-4410 (cell)",mediaEmail:"jmurphy@huntsvillehavoc.com",mediaWeb:"www.huntsvillehavoc.com",theme:"system",booth:0},
  game:{},notes:{schedule:"PS 10/9/26  vs Pensacola  Audio only — Radio & YouTube Live\n10/16/26  @ Pee Dee  7:15 PM\n10/17/26  @ Pee Dee  7:15 PM\n10/23/26  vs Pensacola  7:00 PM\n10/24/26  @ Pensacola  7:05 PM\n10/30/26  @ Pensacola  7:05 PM\n10/31/26  vs Macon  7:00 PM\n11/6/26  vs Macon  7:00 PM\n11/7/26  @ Fayetteville  6:00 PM\n11/8/26  @ Knoxville  3:00 PM\n11/13/26  @ Knoxville  7:30 PM\n11/14/26  vs Knoxville  7:00 PM\n11/20/26  vs Fayetteville  7:00 PM\n11/21/26  vs Fayetteville  7:00 PM\n11/25/26  @ Pensacola  7:05 PM\n11/26/26  vs Athens  7:00 PM\n11/27/26  vs Pensacola  7:00 PM\n12/4/26  vs Evansville  7:00 PM\n12/5/26  @ Evansville  7:05 PM\n12/11/26  vs Quad City  7:00 PM\n12/12/26  vs Quad City  7:00 PM\n12/18/26  @ Roanoke  7:05 PM\n12/19/26  @ Roanoke  7:05 PM\n12/20/26  vs Birmingham  5:00 PM\n12/26/26  @ Birmingham  7:00 PM\n12/27/26  @ Birmingham  2:00 PM\n12/29/26  vs Macon  7:00 PM\n12/31/26  @ Macon  6:00 PM\n1/2/27  @ Macon  6:00 PM\n1/8/27  vs Evansville  7:00 PM\n1/9/27  vs Evansville  7:00 PM\n1/15/27  vs Athens  7:00 PM\n1/16/27  vs Athens  7:00 PM\n1/18/27  @ Birmingham  1:00 PM\n1/22/27  vs Pensacola  7:00 PM\n1/23/27  vs Pee Dee  7:00 PM\n1/29/27  @ Evansville  7:05 PM\n1/30/27  @ Evansville  7:05 PM\n2/5/27  vs Knoxville  7:00 PM\n2/6/27  vs Knoxville  7:00 PM\n2/7/27  @ Pensacola  4:05 PM\n2/12/27  vs Quad City  7:00 PM\n2/13/27  vs Quad City  7:00 PM\n2/15/27  @ Birmingham  1:00 PM\n2/19/27  @ Peoria  7:15 PM\n2/20/27  @ Peoria  7:15 PM\n2/21/27  vs Birmingham  5:00 PM\n2/26/27  @ Quad City  7:10 PM\n2/27/27  @ Quad City  7:10 PM\n3/5/27  vs Athens  7:00 PM\n3/6/27  vs Athens  7:00 PM\n3/7/27  @ Evansville  5:00 PM\n3/12/27  @ Fayetteville  7:00 PM\n3/13/27  @ Fayetteville  6:00 PM\n3/19/27  vs Peoria  7:00 PM\n3/20/27  vs Peoria  7:00 PM\n3/25/27  vs Evansville  7:00 PM\n3/26/27  @ Athens  7:05 PM\n3/27/27  @ Athens  7:05 PM\n4/2/27  @ Knoxville  6:00 PM\n4/3/27  vs Knoxville  5:00 PM"},
  roster:[],            // Havoc
  oppRosters:{},        // {teamName:[players]}
  logos:{},             // {teamName:dataURL}
  coaches:{},           // overrides of SPHL_REF.coaches
  report:{parsedAt:null,standings:[],leaders:{},teamStats:{},goalieStats:{},special:{}},
  epCache:{},            // {normName:{at,ok,id,slug,bullets}} — Elite Prospects lookups
  hockeyOps:{hc:{name:"",bio:""},ac:{name:"",bio:""},gm:{name:"",bio:""},eq:{name:"",bio:""}}, // Meet the Hockey Operations Team (user-filled)
  folderOv:{},           // {teamName:{key:value}} — hand overrides on broadcast-folder data pages
  statOv:{},             // {key:value} — hand overrides on packet/stat displays
  verbs:null,            // {p1,p2,p3} — #EmrickVerbs lists (null = built-in defaults)
  interviews:{},         // {gameKey:{pre:[],post:[]}} — interview prep + quotes archive
  venues:{},             // {teamName:{arena,city,tz,cap,notes}} — overrides of VENUES_DEFAULT
  franchiseStory:{},     // {team:text} — per-team broadcast storylines
  frTeam:'',             // last franchise file viewed
  sbCache:null,          // last scorebar payload, so a feed outage still shows something
  secPt:{},              // {sectionKey:pt} — per-section printed body size
  secBold:{},            // {sectionKey:1} — per-section bold body text
  sync:{},               // {feed:isoTime} — per-feed freshness (standings/players/schedule/rosters/careers/scorebar/daily)
  gamelog:{},            // {dateISO:{opp,ha,us,them,otso,att,sf,sa,ppg,ppa,pkk,pkt,fights}} — per-game store for derived packet sections
  leagueLog:[],          // league-wide finals [{d,h,a,hg,ag,ot}] for opponent sections + head-to-head
  gameday:{break:'',notes:'',at:''}  // booth view: next-break line + live notes (game-night ephemera)
};
const HAD_LOCAL=(()=>{try{return !!localStorage.getItem(KEY);}catch(e){return false;}})();
let DATA=load();
function load(){
  try{
    const raw=localStorage.getItem(KEY);
    if(raw){
      const parsed=JSON.parse(raw);
      const out=Object.assign(structuredClone(DEFAULT_DATA),parsed);
      out.settings=Object.assign(structuredClone(DEFAULT_DATA.settings),parsed.settings||{});
      return out;
    }
  }catch(e){}
  return structuredClone(DEFAULT_DATA);
}
/* tiny IndexedDB k/v — holds the full-state mirror and the backup-folder handle */
function idbOpen(){return new Promise((res,rej)=>{const r=indexedDB.open('havocHub',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
async function idbSet(k,v){const db=await idbOpen();return new Promise((res,rej)=>{const t=db.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=()=>{db.close();res();};t.onerror=()=>{db.close();rej(t.error);};});}
async function idbGet(k){const db=await idbOpen();return new Promise((res,rej)=>{const t=db.transaction('kv','readonly');const q=t.objectStore('kv').get(k);q.onsuccess=()=>{db.close();res(q.result);};q.onerror=()=>{db.close();rej(q.error);};});}
let BK_LAST=0;
function save(){
  try{localStorage.setItem(KEY,JSON.stringify(DATA));flashSaved();}catch(e){toast("Save failed — storage may be full (large logos?)");return;}
  /* rolling auto-backup, logos excluded so it stays small; at most every 30s */
  try{
    const now=Date.now();
    if(now-BK_LAST>30000){
      BK_LAST=now;
      const rest=Object.assign({},DATA);delete rest.logos;
      localStorage.setItem(KEY+'_backup',JSON.stringify({at:new Date().toISOString(),data:rest}));
    }
  }catch(e){}
  /* full-state mirror in IndexedDB (survives some cases localStorage doesn't) — debounced */
  try{
    clearTimeout(save._mt);
    save._mt=setTimeout(()=>{
      idbSet('mirror',{app:'havoc-hub',schema:BACKUP_SCHEMA,at:new Date().toISOString(),data:JSON.parse(JSON.stringify(DATA))}).catch(()=>{});
    },4000);
  }catch(e){}
}
let SAVE_FADE=null;
function flashSaved(){
  const el=document.getElementById('saveStatus');if(!el)return;
  el.textContent='✓ Saved '+new Date().toLocaleTimeString();
  el.classList.add('on');
  clearTimeout(SAVE_FADE);
  SAVE_FADE=setTimeout(()=>el.classList.remove('on'),2600);
}
function uid(){return 'p'+Math.random().toString(36).slice(2,9);}

/* Preview scaling on phones: CSS can't divide a length by a length, so the
   ratio that fits an 816px sheet into the viewport is published here and kept
   current on resize. mobile.css consumes it; print ignores it entirely. */
function hubPageScale(){
  const vw=document.documentElement.clientWidth;
  const r=document.documentElement;
  if(vw>640){r.style.removeProperty('--hub-page-scale');r.style.removeProperty('--hub-page-gap');return;}
  const s=Math.min(1,(vw-24)/816);
  r.style.setProperty('--hub-page-scale',s.toFixed(4));
  // the scaled page still reserves its unscaled height — pull the next page up
  r.style.setProperty('--hub-page-gap',Math.round(-1056*(1-s)+12)+'px');
}


/* ============ HELPERS ============ */
function esc(s){return (s==null?'':String(s)).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function setv(id,v){const el=document.getElementById(id);if(el)el.value=v==null?'':v;}
function norm(s){return (s||'').toLowerCase().replace(/[^a-z]/g,'');}
function dispName(p){return ((p&&(p.airName||p.name))||'')+(p&&p.capt?' ('+p.capt+')':'');}
/* Giovanni "Gio" Procopio → Gio Procopio for anything that goes on air or in print */
function formatTime(t){const[h,m]=t.split(':').map(Number);const ap=h>=12?'P.M.':'A.M.';const h12=((h+11)%12)+1;return `${h12}:${String(m).padStart(2,'0')} ${ap}`;}
function openModal(id){if(id==='resetModal')resetRender();document.getElementById(id).classList.add('show');}
function closeModal(id){document.getElementById(id).classList.remove('show');}
let toastTimer;function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2200);}
function initForms(){fillOpponents();loadGameForm();loadNotesForm();loadSettings();}

/* boot */
