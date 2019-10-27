importScripts("./js/sw-files.js");

const cacheName = /* 5ETOOLS_VERSION__OPEN */"1.86.0"/* 5ETOOLS_VERSION__CLOSE */;

let isCacheRunning;

// Installing Service Worker
self.addEventListener("install", () => {
	self.skipWaiting();
});

self.addEventListener("activate", e => {
	clients.claim();

	// Remove any outdated caches
	e.waitUntil((async () => {
		const cacheNames = await caches.keys();
		await Promise.all(cacheNames.filter(name => name !== cacheName).map(name => caches.delete(name)));
	})());
});

async function getOrCache (req, retryCount = 0) {
	const url = req.request ? req.request.url : req;

	const fromCache = await caches.match(url);
	if (fromCache) return fromCache;
	while (true) {
		let response;
		try {
			response = await fetch(url);
		} catch (e) {
			if (retryCount-- > 0) continue;
			else throw e;
		}
		const cache = await caches.open(cacheName);
		cache.put(url, response.clone()); // don't await
		return response;
	}
}

self.addEventListener("fetch", e => {
	e.respondWith(getOrCache(e));
});

self.addEventListener("message", async e => {
	const send = (msgOut) => e.ports[0].postMessage(msgOut);

	const msg = e.data;
	switch (msg.type) {
		case "cache-cancel":
			isCacheRunning = false;
			break;
		case "cache-start": {
			isCacheRunning = true;
			for (let i = 0; i < filesToCache.length; ++i) {
				if (!isCacheRunning) return send({type: "download-cancelled"});
				try {
					await getOrCache(filesToCache[i]);
				} catch (e) {
					return send({type: "download-error"});
				}
				if (!isCacheRunning) return send({type: "download-cancelled"});
				if (i % 50) send({type: "download-progress", data: {pct: `${((i / filesToCache.length) * 100).toFixed(2)}%`}});
			}
			send({type: "download-progress", data: {pct: `100%`}});
			break;
		}
	}
});
