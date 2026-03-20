"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shards = exports.shardManager = void 0;
const pg_1 = require("pg");
const shard_1 = require("../config/shard");
class ShardManager {
    constructor() {
        this.pools = {};
        this.initPools();
    }
    initPools() {
        for (const shard in shard_1.SHARD_DB_MAP) {
            this.pools[shard] = new pg_1.Pool({
                connectionString: shard_1.SHARD_DB_MAP[shard],
                max: 5,
                idleTimeoutMillis: 30000,
            });
            console.log(`Connected to ${shard}`);
        }
    }
    getClient(shardId) {
        const client = this.pools[shardId];
        if (!client) {
            throw new Error(`Shard not found: ${shardId}`);
        }
        return client;
    }
    async closeAll() {
        for (const shard in this.pools) {
            await this.pools[shard].end();
            console.log(`Closed connection to ${shard}`);
        }
    }
}
exports.shardManager = new ShardManager();
exports.shards = exports.shardManager.pools;
