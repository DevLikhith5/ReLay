"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = void 0;
exports.getUrl = getUrl;
exports.invalidateUrl = invalidateUrl;
exports.getCacheStats = getCacheStats;
const redis_1 = require("../config/redis");
const url_service_1 = require("./url.service");
const key = (code) => `url:${code}`;
const DEFAULT_TTL = 3600;
async function getUrl(shortCode) {
    try {
        const cached = await redis_1.redis.get(key(shortCode));
        if (cached) {
            return JSON.parse(cached);
        }
    }
    catch (err) {
        console.error('Redis GET failed, falling back to Postgres:', err);
    }
    const urlData = await url_service_1.urlService.getUrl(shortCode);
    if (!urlData)
        return null;
    try {
        const ttl = urlData.expiresAt
            ? Math.floor((new Date(urlData.expiresAt).getTime() - Date.now()) / 1000)
            : DEFAULT_TTL;
        if (ttl > 0) {
            await redis_1.redis.setex(key(shortCode), ttl, JSON.stringify(urlData));
        }
    }
    catch (err) {
        console.error('Redis SET failed:', err);
    }
    return urlData;
}
async function invalidateUrl(shortCode) {
    try {
        await redis_1.redis.del(key(shortCode));
    }
    catch (err) {
        console.error('Redis DEL failed:', err);
    }
}
async function getCacheStats() {
    try {
        const info = await redis_1.redis.info('stats');
        const totalKeys = await redis_1.redis.dbsize();
        const hits = parseInt(info.match(/keyspace_hits:(\d+)/)?.[1] ?? '0');
        const misses = parseInt(info.match(/keyspace_misses:(\d+)/)?.[1] ?? '0');
        const total = hits + misses;
        return {
            hits,
            misses,
            hitRate: total > 0 ? ((hits / total) * 100).toFixed(1) + '%' : '0%',
            totalKeys,
        };
    }
    catch {
        return { hits: 0, misses: 0, hitRate: 'unavailable', totalKeys: 0 };
    }
}
exports.cacheService = { getUrl, invalidateUrl, getCacheStats };
