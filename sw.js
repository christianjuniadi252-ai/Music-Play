const CACHE_NAME = "v1";

self.addEventListener("install", event => {
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    clients.claim();
});

self.addEventListener("fetch", event => {
});