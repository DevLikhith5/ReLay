"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shardRouterService = exports.ShardRouterService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const shard_1 = require("../config/shard");
class ShardRouterService {
    constructor() {
        this.ring = [];
        this.buildRing();
    }
    // Build hash ring
    buildRing() {
        const tempRing = [];
        for (const shard of shard_1.SHARDS) {
            for (let i = 0; i < shard_1.VIRTUAL_NODES; i++) {
                const hash = crypto_1.default
                    .createHash("sha256")
                    .update(`${shard}#${i}`)
                    .digest("hex");
                console.log(`Hash for ${shard}#${i} is ${hash}`);
                const position = parseInt(hash.slice(0, 8), 16);
                console.log(`Position for ${shard}#${i} is ${position}`);
                tempRing.push({
                    position,
                    shardId: shard,
                });
            }
        }
        tempRing.sort((a, b) => a.position - b.position);
        this.ring = tempRing;
        console.log(`Hash ring built with ${this.ring.length} virtual nodes`);
    }
    // Get shard using binary search
    getShard(key) {
        const hash = crypto_1.default
            .createHash("sha256")
            .update(key)
            .digest("hex");
        const position = parseInt(hash.slice(0, 8), 16);
        let left = 0;
        let right = this.ring.length - 1;
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (this.ring[mid].position >= position) {
                right = mid - 1;
            }
            else {
                left = mid + 1;
            }
        }
        // wrap around
        return this.ring[left % this.ring.length].shardId;
    }
}
exports.ShardRouterService = ShardRouterService;
exports.shardRouterService = new ShardRouterService();
