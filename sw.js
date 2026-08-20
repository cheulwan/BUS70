importScripts('./firebase-config.js');
importScripts('https://www.gstatic.com/firebasejs/12.2.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.2.1/firebase-messaging-compat.js');
const CACHE_NAME='bus70-v28-cache-1',APP_SHELL=['./','./index.html','./manifest.json','./firebase-config.js','./icon-192.png','./icon-512.png'];
if(self.BUS70_FIREBASE_CONFIG&&self.BUS70_FIREBASE_CONFIG.apiKey&&!String(self.BUS70_FIREBASE_CONFIG.apiKey).includes('여기에')){
  firebase.initializeApp(self.BUS70_FIREBASE_CONFIG);
  firebase.messaging().onBackgroundMessage(p=>{
    const n=p.notification||{},d=p.data||{};
    self.registration.showNotification(n.title||d.title||'BUS70 운행 알림',{body:n.body||d.body||'운행 알림',icon:'./icon-192.png',badge:'./icon-192.png',vibrate:[250,120,250],tag:d.tag||'bus70-fcm',data:{url:d.url||'./'}});
  });
}
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE_NAME).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const x=r.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,x)).catch(()=>{});return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))))});
self.addEventListener('notificationclick',e=>{e.notification.close();const t=(e.notification.data&&e.notification.data.url)||'./';e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>{for(const c of l){if('focus'in c){c.navigate(t);return c.focus()}}if(clients.openWindow)return clients.openWindow(t)}))});
