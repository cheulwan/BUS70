const CACHE_NAME='bus70-v27-cache-1';
const APP_SHELL=[
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  event.respondWith(
    fetch(req).then(res=>{
      const copy=res.clone();
      caches.open(CACHE_NAME).then(cache=>cache.put(req,copy)).catch(()=>{});
      return res;
    }).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html')))
  );
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=(event.notification.data&&event.notification.data.url)||'./';
  event.waitUntil(
    clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
      for(const c of list){
        if('focus' in c){
          c.navigate(target);
          return c.focus();
        }
      }
      if(clients.openWindow)return clients.openWindow(target);
    })
  );
});

// 향후 Web Push 서버를 붙일 때 그대로 사용할 수 있는 수신부
self.addEventListener('push',event=>{
  let data={};
  try{data=event.data?event.data.json():{}}catch(e){data={body:event.data?event.data.text():''}}
  const title=data.title||'BUS70 운행 알림';
  const options={
    body:data.body||'운행 알림이 도착했습니다.',
    icon:'./icon-192.png',
    badge:'./icon-192.png',
    vibrate:[200,100,200],
    tag:data.tag||'bus70-push',
    data:{url:data.url||'./'}
  };
  event.waitUntil(self.registration.showNotification(title,options));
});
