import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const SHARDS = (process.env.SHARDS || "").split(",").map(s => s.trim()).filter(Boolean);

export const shards: Record<string, Pool> = {};

SHARDS.forEach((shard, index) => {
  const envKey = `SHARD_${index}`;
  const dbUrl = process.env[envKey];

  if (dbUrl) {
    shards[shard] = new Pool({
      connectionString: dbUrl,
      max: 10,
      idleTimeoutMillis: 30000,
    });
    console.log(`Analytics consumer connected to ${shard}`);
  }
});

export async function closeAllPools() {
  for (const shard in shards) {
    await shards[shard].end();
  }
}
