
export const KAFKA_CONFIG = {
  brokers: [
    process.env.KAFKA_BROKER_1 || 'localhost:9092',
    process.env.KAFKA_BROKER_2 || 'localhost:9093',
    process.env.KAFKA_BROKER_3 || 'localhost:9094',
  ],
  clientId: 'relay-api',
};

export const TOPICS = {
  URL_CLICKS: 'url.clicks',
};

// 100 partitions ÷ 3 shards = ~33 buckets per shard
// Round down to 30 for clean numbers
export const BUCKET_COUNT = 30;