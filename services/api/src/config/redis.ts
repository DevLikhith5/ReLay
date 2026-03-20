
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: Number(process.env.REDIS_PORT) || 6379,

  retryStrategy(times) {
    if (times > 3) return null;  
    return times * 500;
  },

  lazyConnect: true,
});

redis.on('connect', () => console.log('Redis connected'));
redis.on('error',   (err) => console.error('Redis error:', err.message));

export { redis };