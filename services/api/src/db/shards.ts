import { Pool } from "pg";
import { SHARD_DB_MAP } from "../config/shard";

export type ShardId = keyof typeof SHARD_DB_MAP;

class ShardManager {
  public pools: Record<ShardId, Pool> = {};

  constructor() {
    this.initPools();
  }

  private initPools() {
    for (const shard in SHARD_DB_MAP) {
      this.pools[shard] = new Pool({
        connectionString: SHARD_DB_MAP[shard],
        max: 5,
        idleTimeoutMillis: 30000,
      });

      console.log(`Connected to ${shard}`);
    }
  }

  public getClient(shardId: ShardId): Pool {
    const client = this.pools[shardId];

    if (!client) {
      throw new Error(`Shard not found: ${shardId}`);
    }

    return client;
  }


  public async closeAll() {
    for (const shard in this.pools) {
      await this.pools[shard].end();
      console.log(`Closed connection to ${shard}`);
    }
  }
}


export const shardManager = new ShardManager();
export const shards = shardManager.pools;