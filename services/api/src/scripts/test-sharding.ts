import { shardRouterService } from "../services/shardRouter.service";

const counts: Record<string, number> = {};

const TOTAL = 100000;

for (let i = 0; i < TOTAL; i++) {
  const key = `key-${i}`;
  const shard = shardRouterService.getShard(key);

  counts[shard] = (counts[shard] || 0) + 1;
}

console.log("\nDistribution:");
for (const shard in counts) {
  const percent = ((counts[shard] / TOTAL) * 100).toFixed(2);
  console.log(`${shard}: ${counts[shard]} (${percent}%)`);
}