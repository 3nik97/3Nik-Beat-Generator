// 3Nik Beat Generator — service worker
// Pagina: prima la rete (versione più recente), la copia salvata solo se offline.
// Altri file (icone, convertitore MP3): prima la copia salvata.
const CACHE='nik-beat-1.11';
const FILES=['./','./index.html','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png','./lame.min.js'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(u=>new Request(u,{cache:'reload'})))));
  self.skipWaiting();
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));
});

function networkFirst(req){
  return new Promise(resolve=>{
    let done=false;
    const fallback=()=>caches.match(req,{ignoreSearch:true}).then(r=>r||caches.match('./index.html'));
    const timer=setTimeout(()=>{if(!done){done=true;fallback().then(resolve)}},3500);
    fetch(req,{cache:'no-store'}).then(res=>{
      if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy))}
      if(!done){done=true;clearTimeout(timer);resolve(res)}
    }).catch(()=>{if(!done){done=true;clearTimeout(timer);fallback().then(resolve)}});
  });
}

self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==location.origin)return;
  if(req.mode==='navigate'||url.pathname.endsWith('/index.html')){e.respondWith(networkFirst(req));return}
  e.respondWith(caches.match(req,{ignoreSearch:true}).then(r=>r||fetch(req).then(res=>{
    if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return res})));
});
