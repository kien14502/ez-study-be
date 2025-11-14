import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Consumer, ConsumerRunConfig, ConsumerSubscribeTopic, Kafka } from 'kafkajs';

@Injectable()
export class ConsumerService implements OnApplicationShutdown {
  private readonly logger = new Logger(ConsumerService.name);
  private readonly kafka: Kafka;
  private readonly consumers: Consumer[];

  constructor(private readonly configService: ConfigService) {
    const brokers = this.configService.get<string>('KAFKA_BROKERS')?.split(',') || ['localhost:9092'];
    this.kafka = new Kafka({
      // clientId: this.configService.get<string>('KAFKA_CLIENT_ID') || 'email-producer',
      brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });
    this.consumers = [];
  }

  async consume(topic: ConsumerSubscribeTopic, config: ConsumerRunConfig) {
    console.info('🚀 ~ ConsumerService ~ consume ~ topic:', topic);
    this.logger.log('consume service started');
    const consumer = this.kafka.consumer({ groupId: 'nestjs-kafka' });
    await consumer.connect();
    await consumer.subscribe(topic);
    await consumer.run(config);
    this.consumers.push(consumer);
  }

  async onApplicationShutdown() {
    for (const consumer of this.consumers) {
      await consumer.disconnect();
    }
  }
}
