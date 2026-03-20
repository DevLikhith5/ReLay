import dotenv from 'dotenv';
import { setupConsumer } from './consumer';

dotenv.config();

const brokers = [
  process.env.KAFKA_BROKER_1 || 'localhost:9092',
  process.env.KAFKA_BROKER_2 || 'localhost:9093',
  process.env.KAFKA_BROKER_3 || 'localhost:9094',
];

const topic = process.env.KAFKA_TOPIC || 'url.clicks';

async function main() {
  console.log('Analytics Consumer Starting...');
  
  try {
    const consumer = await setupConsumer(brokers, topic);
    console.log(`Subscribed to topic: ${topic}`);

    // Graceful Shutdown
    const shutdown = async () => {
      console.log('Shutting down...');
      await consumer.disconnect();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (err) {
    console.error('Fatal error in consumer:', err);
    process.exit(1);
  }
}

main();
