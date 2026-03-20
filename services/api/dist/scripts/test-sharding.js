"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shardRouter_service_1 = require("../services/shardRouter.service");
const counts = {};
const TOTAL = 100000;
for (let i = 0; i < TOTAL; i++) {
    const key = `key-${i}`;
    const shard = shardRouter_service_1.shardRouterService.getShard(key);
    counts[shard] = (counts[shard] || 0) + 1;
}
console.log("\nDistribution:");
for (const shard in counts) {
    const percent = ((counts[shard] / TOTAL) * 100).toFixed(2);
    console.log(`${shard}: ${counts[shard]} (${percent}%)`);
}
