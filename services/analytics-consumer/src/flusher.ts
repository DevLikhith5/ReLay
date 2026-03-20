import { shards } from './db';
import { Pool } from 'pg';

export interface ClickEvent {
  shortCode: string;
  shardId:   string;
  country:   string;
  city?:     string;
  device:    string;
  timestamp: number;
}

export async function flushEvents(events: ClickEvent[]) {
  if (events.length === 0) return;

  const byShard: Record<string, ClickEvent[]> = {};
  for (const e of events) {
    byShard[e.shardId] = byShard[e.shardId] || [];
    byShard[e.shardId].push(e);
  }

  // 🔥 1. Parallelize shard writes
  // Instead of waiting for shard-0, then shard-1, etc.
  await Promise.all(
    Object.entries(byShard).map(([shardId, shardEvents]) => {
      const pool = shards[shardId];
      if (!pool) return Promise.resolve();
      return flushToShard(pool, shardEvents);
    })
  );
}

async function flushToShard(pool: Pool, events: ClickEvent[]) {
  try {
    await pool.query('BEGIN');

    // 🏗️ 2. Bulk Insert Click Logs (Much faster than N queries)
    const logValues: any[] = [];
    const logPlaceholders = events.map((event, i) => {
      const offset = i * 4;
      logValues.push(event.shortCode, event.country, event.device, event.timestamp);
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, to_timestamp($${offset + 4}/1000.0))`;
    }).join(',');

    await pool.query(
      `INSERT INTO click_log (short_code, country, device, clicked_at) VALUES ${logPlaceholders}`,
      logValues
    );

    // 📊 3. Aggregate Analytics in memory to reduce DB updates
    const aggregatedStats: Record<string, { count: number; countries: Record<string, number>; devices: Record<string, number> }> = {};
    for (const e of events) {
      if (!aggregatedStats[e.shortCode]) {
        aggregatedStats[e.shortCode] = { count: 0, countries: {}, devices: {} };
      }
      const agg = aggregatedStats[e.shortCode];
      agg.count++;
      agg.countries[e.country] = (agg.countries[e.country] || 0) + 1;
      agg.devices[e.device] = (agg.devices[e.device] || 0) + 1;
    }

    for (const [code, stats] of Object.entries(aggregatedStats)) {
      await pool.query(
        `INSERT INTO click_analytics (short_code, total_clicks, country_data, device_data)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (short_code) DO UPDATE SET
           total_clicks = click_analytics.total_clicks + EXCLUDED.total_clicks,
           country_data = (
             SELECT jsonb_object_agg(key, COALESCE(v1, 0) + COALESCE(v2, 0))
             FROM (
               SELECT key, value::int v1 FROM jsonb_each_text(click_analytics.country_data)
               UNION ALL
               SELECT key, value::int v2 FROM jsonb_each_text(EXCLUDED.country_data)
             ) t
           ),
           device_data = (
             SELECT jsonb_object_agg(key, COALESCE(v1, 0) + COALESCE(v2, 0))
             FROM (
               SELECT key, value::int v1 FROM jsonb_each_text(click_analytics.device_data)
               UNION ALL
               SELECT key, value::int v2 FROM jsonb_each_text(EXCLUDED.device_data)
             ) t
           ),
           updated_at = NOW()`,
        [code, stats.count, JSON.stringify(stats.countries), JSON.stringify(stats.devices)]
      );
    }

    await pool.query('COMMIT');
    console.log(`✅ Flushed ${events.length} events successfully.`);
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(`❌ Flush failed:`, err);
  }
}
