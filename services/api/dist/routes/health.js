"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// routes/health.ts
const express_1 = require("express");
const shards_1 = require("../db/shards");
const redis_1 = require("../config/redis");
const cache_service_1 = require("../services/cache.service");
const router = (0, express_1.Router)();
// ── /health — main health check ───────────────────────────────────────────────
// Nginx uses this to decide if instance is healthy
// Returns 200 if all systems up, 503 if any critical system is down
router.get('/', async (req, res) => {
    // Run all checks in parallel — don't wait for one before checking next
    const [s0, s1, s2, rd] = await Promise.allSettled([
        shards_1.shards['shard-0'].query('SELECT 1'),
        shards_1.shards['shard-1'].query('SELECT 1'),
        shards_1.shards['shard-2'].query('SELECT 1'),
        redis_1.redis.ping(),
    ]);
    const health = {
        // Which instance responded — proves load balancing is working
        instance: process.env.INSTANCE_ID ?? 'local',
        pid: process.pid,
        // Overall status — degraded if ANY system is down
        status: [s0, s1, s2, rd].every(c => c.status === 'fulfilled')
            ? 'healthy'
            : 'degraded',
        // Individual system status
        systems: {
            'shard-0': s0.status === 'fulfilled' ? 'up' : 'down',
            'shard-1': s1.status === 'fulfilled' ? 'up' : 'down',
            'shard-2': s2.status === 'fulfilled' ? 'up' : 'down',
            redis: rd.status === 'fulfilled' ? 'up' : 'down',
        },
        // What went wrong — useful for debugging
        errors: [
            s0.status === 'rejected' ? `shard-0: ${s0.reason?.message}` : null,
            s1.status === 'rejected' ? `shard-1: ${s1.reason?.message}` : null,
            s2.status === 'rejected' ? `shard-2: ${s2.reason?.message}` : null,
            rd.status === 'rejected' ? `redis: ${rd.reason?.message}` : null,
        ].filter(Boolean), // remove nulls — only show actual errors
        uptime: `${Math.floor(process.uptime())}s`,
    };
    // 503 tells Nginx this instance is unhealthy — stop sending traffic here
    // 200 tells Nginx this instance is ready to serve requests
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
});
// ── /health/cache — Redis cache statistics ────────────────────────────────────
// Check this after load tests to see hit rate
// Target: 80%+ after cache warmup
router.get('/cache', async (req, res) => {
    const stats = await cache_service_1.cacheService.getCacheStats();
    res.json({ success: true, cache: stats });
});
// ── /health/shards — detailed shard statistics ────────────────────────────────
// Shows row counts per shard — proves even distribution
router.get('/shards', async (req, res) => {
    try {
        const [s0, s1, s2] = await Promise.all([
            shards_1.shards['shard-0'].query('SELECT COUNT(*) as count FROM urls'),
            shards_1.shards['shard-1'].query('SELECT COUNT(*) as count FROM urls'),
            shards_1.shards['shard-2'].query('SELECT COUNT(*) as count FROM urls'),
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
            shards: Object.fromEntries(Object.entries(counts).map(([shard, count]) => [
                shard,
                {
                    count,
                    percentage: total > 0
                        ? ((count / total) * 100).toFixed(1) + '%'
                        : '0%',
                },
            ])),
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
exports.default = router;
