"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.urlService = void 0;
const query_1 = require("../db/query");
const generateCode_1 = require("../utils/generateCode");
const getTTL_1 = require("../utils/getTTL");
const shardRouter_service_1 = require("./shardRouter.service");
const AppError_1 = require("../utils/AppError");
const MAX_ATTEMPTS = 3;
async function createShortUrl({ longUrl, expiresIn, userId, }) {
    const expiresAt = expiresIn ? (0, getTTL_1.getTTL)(expiresIn) : null;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const shortCode = (0, generateCode_1.generateCode)();
        const shardId = shardRouter_service_1.shardRouterService.getShard(shortCode);
        try {
            const record = await (0, query_1.withTransaction)(shardId, async (client) => {
                const result = await client.query(`
          INSERT INTO urls (short_code, long_url, user_id, expires_at, created_at)
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (short_code) DO NOTHING
          RETURNING short_code, long_url, user_id, expires_at, created_at
        `, [shortCode, longUrl, userId ?? null, expiresAt]);
                if (result.rows.length === 0)
                    return null;
                // Insert analytics row — so first query returns 0 not null
                await client.query(`
          INSERT INTO click_analytics (short_code, total_clicks)
          VALUES ($1, 0)
          ON CONFLICT DO NOTHING
        `, [shortCode]);
                return result.rows[0];
            });
            if (record === null)
                continue;
            return {
                shortCode: record.short_code,
                longUrl: record.long_url,
                userId: record.user_id,
                shardId: shardId,
                expiresAt: record.expires_at,
                createdAt: record.created_at,
            };
        }
        catch (err) {
            if (err.code === '23505')
                continue;
            throw err;
        }
    }
    throw new AppError_1.AppError('Failed to generate unique short code — try again', 500, 'CODE_GENERATION');
}
async function getUrl(shortCode) {
    const shardId = shardRouter_service_1.shardRouterService.getShard(shortCode);
    const row = await (0, query_1.queryOne)(shardId, `
    SELECT short_code, long_url, user_id, expires_at, created_at
    FROM urls
    WHERE short_code = $1 AND is_active = TRUE
  `, [shortCode]);
    if (!row)
        return null;
    return {
        shortCode: row.short_code,
        longUrl: row.long_url,
        userId: row.user_id,
        shardId: shardId,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
    };
}
async function deactivateUrl(shortCode) {
    const shardId = shardRouter_service_1.shardRouterService.getShard(shortCode);
    await (0, query_1.query)(shardId, `
    UPDATE urls SET is_active = FALSE WHERE short_code = $1
  `, [shortCode]);
}
exports.urlService = {
    createShortUrl,
    getUrl,
    deactivateUrl,
};
