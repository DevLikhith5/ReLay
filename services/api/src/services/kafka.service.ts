import { buildKafkaKey } from '../utils/kafkaKey';
import { KAFKA_CONFIG, TOPICS } from '../config/kafka';
import { Kafka, Producer } from 'kafkajs';
import { ClickEvent } from '../types';

const kafka = new Kafka({
  clientId: KAFKA_CONFIG.clientId,
  brokers: KAFKA_CONFIG.brokers,
});

const producer: Producer = kafka.producer();
let isConnected = false;

async function connectProducer() {
  if (isConnected) return;
  try {
    await producer.connect();
    isConnected = true;
    console.log('Kafka Producer connected');
  } catch (err) {
    console.error('Failed to connect Kafka Producer:', err);
  }
}

export async function publishClick(event: ClickEvent): Promise<void> {
  await connectProducer();
  
  try {
    await producer.send({
      topic: TOPICS.URL_CLICKS,
      messages: [{
        key:   buildKafkaKey(event.shardId, event.shortCode),
        value: JSON.stringify(event),
      }],
    });
  } catch (err) {
    console.error('Failed to publish click event:', err);
  }
}