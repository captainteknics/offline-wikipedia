require('serviceworker-cache-polyfill');

var version = '18';
var prefix = 'wikioffline';
var staticCacheName = `${prefix}-static-v${version}`;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(staticCacheName).then(cache => {
      return cache.addAll([
        '/',
        '/shell.html',
        '/js/page.js',
        '/css/all.css',
        '//bits.wikimedia.org/en.wikipedia.org/load.php?debug=false&lang=en&modules=ext.gadget.switcher%7Cext.gather.menu.icon%7Cmediawiki.sectionAnchor%7Cmediawiki.ui.button%7Cmobile.pagelist.styles%7Cskins.minerva.chrome.styles%7Cskins.minerva.content.styles%7Cskins.minerva.drawers.styles%7Cskins.minerva.tablet.styles&only=styles&skin=minerva&target=mobile&*'
      ]);
    })
  );
});

var expectedCaches = [
  staticCacheName
];

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key.indexOf(prefix + '-') === 0
            && key.indexOf(`${prefix}-article-`) !== 0
            && expectedCaches.indexOf(key) === -1) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  var requestURL = new URL(event.request.url);

  // catch the root request
  if (requestURL.origin == location.origin) {
    if (requestURL.pathname == '/') {
      event.respondWith(caches.match('/'));
      return;
    }
    if (requestURL.pathname == '/' || requestURL.pathname.indexOf('/wiki/') === 0) {
      // just the network for these requests - pulling these out of the
      // cache is handled entirely by the page
      if (/\.json$/.test(requestURL.pathname)) return;
      event.respondWith(caches.match('/shell.html'));
      return;
    }
  }

  // default fetch behaviour
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('message', event => {
  if (event.data == 'skipWaiting') {
    self.skipWaiting();
  }
});