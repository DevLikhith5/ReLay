import { shards, ShardId } from './shards';
import { logger } from '../utils/logger'; 

export async function query<T = any>(
  shardId: ShardId,
  sql: string,
  params: any[] = []
): Promise<T[]> {
  const pool = shards[shardId];

  if (!pool) {
    throw new Error(`Unknown shard: ${shardId}`);
  }

  const start = Date.now();

  try {
    const result = await pool.query(sql, params);
    logger.debug({
      shard: shardId,
      duration: Date.now() - start,
      rows: result.rowCount,
    });
    return result.rows;
  } catch (err: any) {
    logger.error({
      shard: shardId,
      sql,
      error: err.message,
    });
    throw err;
  }
}

export async function queryOne<T = any>(
  shardId: ShardId,
  sql: string,
  params: any[] = []
): Promise<T | null> {
  const rows = await query<T>(shardId, sql, params);
  return rows[0] ?? null;
}

export async function withTransaction<T>(
  shardId: ShardId,
  fn: (client: any) => Promise<T>
): Promise<T> {
  const pool   = shards[shardId];
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}