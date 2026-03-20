import { shards, ShardId } from '../db/shards';
import { shardRouterService } from './shardRouter.service';

export class AnalyticsService {
  async getClickAnalytics(shortCode: string) {
    const shardId = shardRouterService.getShard(shortCode) as ShardId;
    const pool = shards[shardId];

    if (!pool) {
      throw new Error(`Shard not found for code: ${shortCode}`);
    }

    // 1. Fetch aggregates
    const analyticsRes = await pool.query(
      'SELECT total_clicks, country_data, device_data, updated_at FROM click_analytics WHERE short_code = $1',
      [shortCode]
    );

    // 2. Fetch last 50 raw logs
    const logsRes = await pool.query(
      'SELECT country, city, device, clicked_at FROM click_log WHERE short_code = $1 ORDER BY clicked_at DESC LIMIT 50',
      [shortCode]
    );

    if (analyticsRes.rowCount === 0) {
      return null;
    }

    return {
      ...analyticsRes.rows[0],
      recent_clicks: logsRes.rows,
      shard: shardId
    };
  }
}

export const analyticsService = new AnalyticsService();
