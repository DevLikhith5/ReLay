import crypto from "crypto";
import { SHARDS, VIRTUAL_NODES } from "../config/shard";
import { ShardNode } from "../types";

export class ShardRouterService {
  private ring: ShardNode[] = [];

  constructor() {
    this.buildRing();
  }

  // Build hash ring
  private buildRing() {
    const tempRing: ShardNode[] = [];

    for (const shard of SHARDS) {
      for (let i = 0; i < VIRTUAL_NODES; i++) {
        const hash = crypto
          .createHash("sha256")
          .update(`${shard}#${i}`)
          .digest("hex");

        console.log(`Hash for ${shard}#${i} is ${hash}`)
        const position = parseInt(hash.slice(0, 8), 16);
        console.log(`Position for ${shard}#${i} is ${position}`)
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
  public getShard(key: string): string {
    const hash = crypto
      .createHash("sha256")
      .update(key)
      .digest("hex");

    const position = parseInt(hash.slice(0, 8), 16) ;

    let left = 0;
    let right = this.ring.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);

      if (this.ring[mid].position >= position) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    // wrap around
    return this.ring[left % this.ring.length].shardId;
  }

 
}


export const shardRouterService = new ShardRouterService();