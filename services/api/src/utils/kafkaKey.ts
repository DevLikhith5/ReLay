// utils/kafkaKey.ts
import { BUCKET_COUNT } from '../config/kafka';


function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;   
  }
  return Math.abs(hash);
}

// Shard = where data lives (DB routing)
// Bucket = how to spread load in Kafka
// Key = shard:bucket
export function buildKafkaKey(shardId: string, shortCode: string): string {
  const bucket = hashString(shortCode) % BUCKET_COUNT;
  return `${shardId}:${bucket}`;
}

// Consumer uses this to extract shardId from key
// Ignores bucket — only cares about where to write
export function extractShardId(kafkaKey: string): string {
  return kafkaKey.split(':')[0];
}