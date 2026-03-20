import { Kafka, EachMessagePayload } from 'kafkajs';
import { ClickBuffer } from './buffer';
import { ClickEvent } from './flusher';

export async function setupConsumer(brokers: string[], topic: string) {
  const kafka = new Kafka({
    clientId: 'analytics-consumer',
    brokers,
  });

  const consumer = kafka.consumer({ groupId: 'analytics-group' });
  const buffer = new ClickBuffer(100);

  // Utility to extract shardId from Kafka key (e.g., "shard-1:14")
  const extractShardId = (key: string) => key.split(':')[0];

  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }: EachMessagePayload) => {
      if (!message.value) return;

      try {
        const event = JSON.parse(message.value.toString()) as ClickEvent;
        
        // Extract Shard ID from Key for reliable DB routing
        const kafkaKey = message.key?.toString() ?? '';
        event.shardId  = extractShardId(kafkaKey);

        await buffer.add(event);
      } catch (err) {
        console.error('Failed to process message:', err);
      }
    },
  });

  return consumer;
}