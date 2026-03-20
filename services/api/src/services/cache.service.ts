
import { redis }      from '../config/redis';
import { urlService } from './url.service';
import { UrlRecord }  from '../types';

const key = (code: string) => `url:${code}`;
const DEFAULT_TTL = 3600;

export async function getUrl(shortCode: string): Promise<UrlRecord | null> {

  try {
    const cached = await redis.get(key(shortCode));

    if (cached) {
      return JSON.parse(cached) as UrlRecord;
    }
  } catch (err) {
    console.error('Redis GET failed, falling back to Postgres:', err);
  }

  const urlData = await urlService.getUrl(shortCode);

  if (!urlData) return null;
  try {
    const ttl = urlData.expiresAt
      ? Math.floor((new Date(urlData.expiresAt).getTime() - Date.now()) / 1000)
      : DEFAULT_TTL;


    if (ttl > 0) {
      await redis.setex(key(shortCode), ttl, JSON.stringify(urlData));
    }
  } catch (err) {
    console.error('Redis SET failed:', err);
  }

  return urlData;
}


export async function invalidateUrl(shortCode: string): Promise<void> {
  try {
    await redis.del(key(shortCode));
  } catch (err) {

    console.error('Redis DEL failed:', err);
  }
}


export async function getCacheStats() {
  try {
    const info      = await redis.info('stats');
    const totalKeys = await redis.dbsize();

    const hits   = parseInt(info.match(/keyspace_hits:(\d+)/)?.[1]   ?? '0');
    const misses = parseInt(info.match(/keyspace_misses:(\d+)/)?.[1] ?? '0');
    const total  = hits + misses;

    return {
      hits,
      misses,
      hitRate:   total > 0 ? ((hits / total) * 100).toFixed(1) + '%' : '0%',
      totalKeys,
    };
  } catch {
    return { hits: 0, misses: 0, hitRate: 'unavailable', totalKeys: 0 };
  }
}

export const cacheService = { getUrl, invalidateUrl, getCacheStats };