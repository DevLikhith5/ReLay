import { query, queryOne, withTransaction } from '../db/query';
import { generateCode }         from '../utils/generateCode';
import { getTTL }               from '../utils/getTTL';
import { shardRouterService }   from './shardRouter.service';
// import { AppError }             from '../utils/AppError';
import { ShortenRequest, UrlRecord } from '../types';

// const MAX_ATTEMPTS = 3;

async function createShortUrl({
  longUrl,
  expiresIn,
  userId,
}: ShortenRequest): Promise<UrlRecord> {

  const expiresAt = expiresIn ? getTTL(expiresIn) : null;

  // Generate code from atomic counter — guaranteed unique
  // No retry loop needed — collision is impossible
  const shortCode = await generateCode();
  const shardId   = shardRouterService.getShard(shortCode);

  const record = await withTransaction(shardId, async (client) => {

    const result = await client.query(`
      INSERT INTO urls (short_code, long_url, user_id, expires_at, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING short_code, long_url, user_id, expires_at, created_at
    `, [shortCode, longUrl, userId ?? null, expiresAt]);

    // Create analytics row atomically
    await client.query(`
      INSERT INTO click_analytics (short_code, total_clicks)
      VALUES ($1, 0)
    `, [shortCode]);

    return result.rows[0];
  });

  return {
    shortCode: record.short_code,
    longUrl:   record.long_url,
    userId:    record.user_id,
    shardId,
    expiresAt: record.expires_at,
    createdAt: record.created_at,
  };
}

async function getUrl(shortCode: string): Promise<UrlRecord | null> {
  const shardId = shardRouterService.getShard(shortCode);

  const row = await queryOne(shardId, `
    SELECT short_code, long_url, user_id, expires_at, created_at
    FROM urls
    WHERE short_code = $1 AND is_active = TRUE
  `, [shortCode]);

  if (!row) return null;

  return {
    shortCode: row.short_code,
    longUrl:   row.long_url,
    userId:    row.user_id,
    shardId: shardId,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

async function deactivateUrl(shortCode: string): Promise<void> {
  const shardId = shardRouterService.getShard(shortCode);

  await query(shardId, `
    UPDATE urls SET is_active = FALSE WHERE short_code = $1
  `, [shortCode]);
}

export const urlService = {
  createShortUrl,
  getUrl,
  deactivateUrl,
};