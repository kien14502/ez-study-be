import { Injectable, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

import { ETopicKafka } from '@/common/constants';

@Injectable()
export class EmailProducerService implements OnModuleInit, OnApplicationShutdown {
  private kafka: Kafka;
  private producer: Producer;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'mail-service',
      brokers: ['localhost:9092'],
    });
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
  }

  async onApplicationShutdown() {
    await this.producer.disconnect();
  }

  async sendVerificationEmail(data: { email: string; token: string }) {
    try {
      await this.producer.connect();
      await this.producer.send({
        topic: ETopicKafka.REGISTER_ACCOUNT,
        messages: [{ value: JSON.stringify(data) }],
      });
      console.info('send with kafka', data.email);
    } catch (error) {
      console.error(error);
    }
  }
}
