import { ClickEvent, flushEvents } from './flusher';

export class ClickBuffer {
  private items: ClickEvent[] = [];
  private readonly batchSize: number;
  private totalProcessed: number = 0;

  constructor(batchSize: number = 100) {
    this.batchSize = batchSize;
  }

  async add(event: ClickEvent) {
    this.items.push(event);
    this.totalProcessed++;

    if (this.totalProcessed % 500 === 0) {
      console.log(`📥 Total messages received by buffer candidate: ${this.totalProcessed}`);
    }

    if (this.items.length >= this.batchSize) {
      await this.flush();
    }
  }

  async flush() {
    if (this.items.length === 0) return;
    const batch = [...this.items];
    this.items = [];
    
    const start = Date.now();
    await flushEvents(batch);
    const duration = Date.now() - start;

    console.log(`📦 Flushed batch of ${batch.length} events in ${duration}ms!`);
  }
}
