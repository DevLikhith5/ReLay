"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = query;
exports.queryOne = queryOne;
exports.withTransaction = withTransaction;
const shards_1 = require("./shards");
const logger_1 = require("../utils/logger");
async function query(shardId, sql, params = []) {
    const pool = shards_1.shards[shardId];
    if (!pool) {
        throw new Error(`Unknown shard: ${shardId}`);
    }
    const start = Date.now();
    try {
        const result = await pool.query(sql, params);
        logger_1.logger.debug({
            shard: shardId,
            duration: Date.now() - start,
            rows: result.rowCount,
        });
        return result.rows;
    }
    catch (err) {
        logger_1.logger.error({
            shard: shardId,
            sql,
            error: err.message,
        });
        throw err;
    }
}
async function queryOne(shardId, sql, params = []) {
    const rows = await query(shardId, sql, params);
    return rows[0] ?? null;
}
async function withTransaction(shardId, fn) {
    const pool = shards_1.shards[shardId];
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
    }
    catch (err) {
        await client.query('ROLLBACK');
        throw err;
    }
    finally {
        client.release();
    }
}
