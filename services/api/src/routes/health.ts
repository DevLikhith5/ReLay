
import { Router }       from 'express';
import { shards }       from '../db/shards';
import { redis }        from '../config/redis';
import { cacheService } from '../services/cache.service';

const router = Router();


router.get('/', async (req, res) => {

  const [s0, s1, s2, rd] = await Promise.allSettled([
    shards['shard-0'].query('SELECT 1'),
    shards['shard-1'].query('SELECT 1'),
    shards['shard-2'].query('SELECT 1'),
    redis.ping(),
  ]);

  const health = {

    instance: process.env.INSTANCE_ID ?? 'local',
    pid:      process.pid,


    status: [s0, s1, s2, rd].every(c => c.status === 'fulfilled')
      ? 'healthy'
      : 'degraded',


    systems: {
      'shard-0': s0.status === 'fulfilled' ? 'up' : 'down',
      'shard-1': s1.status === 'fulfilled' ? 'up' : 'down',
      'shard-2': s2.status === 'fulfilled' ? 'up' : 'down',
      redis:     rd.status === 'fulfilled' ? 'up' : 'down',
    },


    errors: [
      s0.status === 'rejected' ? `shard-0: ${s0.reason?.message}` : null,
      s1.status === 'rejected' ? `shard-1: ${s1.reason?.message}` : null,
      s2.status === 'rejected' ? `shard-2: ${s2.reason?.message}` : null,
      rd.status === 'rejected' ? `redis: ${rd.reason?.message}`   : null,
    ].filter(Boolean),   

    uptime: `${Math.floor(process.uptime())}s`,
  };


  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});


router.get('/cache', async (req, res) => {
  const stats = await cacheService.getCacheStats();
  res.json({ success: true, cache: stats });
});


router.get('/shards', async (req, res) => {
  try {
    const [s0, s1, s2] = await Promise.all([
      shards['shard-0'].query('SELECT COUNT(*) as count FROM urls'),
      shards['shard-1'].query('SELECT COUNT(*) as count FROM urls'),
      shards['shard-2'].query('SELECT COUNT(*) as count FROM urls'),
    ]);

    const counts = {
      'shard-0': Number(s0.rows[0].count),
      'shard-1': Number(s1.rows[0].count),
      'shard-2': Number(s2.rows[0].count),
    };

    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    res.json({
      success: true,
      total,
      shards: Object.fromEntries(
        Object.entries(counts).map(([shard, count]) => [
          shard,
          {
            count,
            percentage: total > 0
              ? ((count / total) * 100).toFixed(1) + '%'
              : '0%',
          },
        ])
      ),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;