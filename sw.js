/* Syllabus Tracker service worker: offline app shell */
var CACHE='syllabus-v1';
var SHELL=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return Promise.all(SHELL.map(function(u){return c.add(u).catch(function(){})}))}).then(function(){return self.skipWaiting()}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}));
});
self.addEventListener('fetch',function(e){
  var r=e.request;
  if(r.method!=='GET')return;
  var u=new URL(r.url);
  if(u.origin===location.origin){
    /* network first, fall back to the saved copy when offline */
    e.respondWith(fetch(r).then(function(res){
      if(res&&res.ok){var cp=res.clone();caches.open(CACHE).then(function(c){c.put(r,cp)})}
      return res;
    }).catch(function(){return caches.match(r).then(function(m){return m||caches.match('index.html')})}));
  }else if(u.hostname==='cdn.jsdelivr.net'){
    /* library script: saved after first load */
    e.respondWith(caches.match(r).then(function(m){return m||fetch(r).then(function(res){
      if(res&&res.ok){var cp=res.clone();caches.open(CACHE).then(function(c){c.put(r,cp)})}
      return res;
    })}));
  }
});
self.addEventListener('notificationclick',function(e){
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(cs){
    for(var i=0;i<cs.length;i++){if('focus' in cs[i])return cs[i].focus()}
    return self.clients.openWindow('./');
  }));
});
