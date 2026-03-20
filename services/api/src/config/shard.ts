import dotenv from "dotenv"

dotenv.config();

export const VIRTUAL_NODES = parseInt(process.env.VIRTUAL_NODES || "100")
export const RING_SIZE = parseInt(process.env.RING_SIZE || "36000");

export const SHARDS = (process.env.SHARDS || "").split(",").map(s => s.trim()).filter(Boolean);

if (SHARDS.length === 0) {
  throw new Error("SHARDS not configured in .env");
}

export const SHARD_DB_MAP: Record<string, string> = {};

SHARDS.forEach((shard, index) => {
  const envKey = `SHARD_${index}`;
  const dbUrl = process.env[envKey];

  if (!dbUrl) {
    throw new Error(`Missing DB URL for ${envKey}`);
  }

  SHARD_DB_MAP[shard] = dbUrl;
});