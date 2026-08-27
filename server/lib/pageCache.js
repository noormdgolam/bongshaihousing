// server/lib/pageCache.js
const cache = new Map();
const MAX_CACHE_SIZE = 500;

function getCached(key) {
  if (cache.has(key)) {
    const item = cache.get(key);
    // Refresh LRU position by deleting and re-inserting
    cache.delete(key);
    cache.set(key, item);
    return item;
  }
  return null;
}

function setCached(key, html) {
  if (cache.size >= MAX_CACHE_SIZE) {
    // Delete oldest item (first in the Map's insertion order)
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(key, html);
}

function invalidatePageCache() {
  cache.clear();
}

function cacheMiddleware(req, res, next) {
  // Only cache GET requests without query parameters
  if (req.method !== 'GET' || Object.keys(req.query).length > 0) {
    return next();
  }

  const key = req.originalUrl;
  const cachedHtml = getCached(key);
  if (cachedHtml) {
    return res.send(cachedHtml);
  }

  const originalSend = res.send;
  res.send = function (body) {
    // Only cache successful string responses (HTML)
    if (res.statusCode === 200 && typeof body === 'string') {
      setCached(key, body);
    }
    return originalSend.call(this, body);
  };

  next();
}

module.exports = {
  getCached,
  setCached,
  invalidatePageCache,
  cacheMiddleware,
  getCacheSize: () => cache.size
};
