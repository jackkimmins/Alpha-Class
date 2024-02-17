// service-worker.js
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open('AlphaClass-store').then((cache) => cache.addAll([
            '/',
            '/index.html',
            '/styles.css',
            '/main.js',
            '/manifest.json',
            '/models/mnist_cnn_tfjs/group1-shard1of1.bin',
            '/models/mnist_cnn_tfjs/model.json',
            '/models/emnist_cnn_tfjs/group1-shard1of1.bin',
            '/models/emnist_cnn_tfjs/model.json',
        ])),
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(caches.match(e.request).then((response) => response || fetch(e.request)), );
});  