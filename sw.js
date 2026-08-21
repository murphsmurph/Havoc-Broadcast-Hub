/* Havoc Broadcast Hub service worker — network-first with cache fallback so
   deploys always win online and the booth still works offline.
   Registered with a relative path, so scope follows the GitHub Pages subpath. */
const CACHE='havoc-hub-v9';
const HEADS='havoc-heads-v1'; // HockeyTech headshots — cache-first so packets build offline
/* Precache is best-effort PER FILE, never atomic. cache.addAll rejects the whole
   install if a single entry 404s, which silently leaves the booth with no service
   worker at all — that is exactly what happened while data/bios.json (embargoed,
   gitignored, never deployed) sat in this list. Optional files may be absent. */
const PRECACHE=['./','./index.html','./css/hub.css','./mobile.css','./js/logos.js','./js/reference.js','./js/career-math.js','./js/daily-report-parser.js','./data/havoc_players.json','./data/matchups.json','./data/season2526_final.json'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE)
    .then(c=>Promise.all(PRECACHE.map(u=>c.add(u).catch(()=>{}))))
    .then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k!==HEADS).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET')return;
  if(u.origin==='https://assets.leaguestat.com'){
    e.respondWith(caches.open(HEADS).then(c=>c.match(e.request).then(m=>m||fetch(e.request).then(r=>{
      if(r.ok||r.type==='opaque')c.put(e.request,r.clone());
      return r;
    }))));
    return;
  }
  if(u.origin!==self.location.origin)return;
  e.respondWith(
    fetch(e.request).then(r=>{
      if(r.ok){const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));}
      return r;
    }).catch(()=>caches.match(e.request).then(m=>m||(e.request.mode==='navigate'?caches.match('./index.html'):Response.error())))
  );
});
