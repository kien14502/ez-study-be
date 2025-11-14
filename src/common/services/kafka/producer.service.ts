import { Injectable, Logger, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, ProducerRecord } from 'kafkajs';

@Injectable()
export class ProducerService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(ProducerService.name);
  private readonly kafka: Kafka;
  private readonly producer: Producer;

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

    this.producer = this.kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
    });
  }

  async onModuleInit() {
    try {
      this.logger.log('🔌 Đang kết nối tới Kafka producer...');
      await this.producer.connect();
      this.logger.log('✅ Kafka producer đã kết nối thành công!');
    } catch (error) {
      this.logger.error('❌ Lỗi khi kết nối Kafka producer:', error);
      throw error;
    }
  }

  async onApplicationShutdown() {
    try {
      this.logger.log('🔌 Đang ngắt kết nối Kafka producer...');
      await this.producer.disconnect();
      this.logger.log('✅ Kafka producer đã ngắt kết nối');
    } catch (error) {
      this.logger.error('❌ Lỗi khi ngắt kết nối Kafka producer:', error);
    }
  }

  async produce(record: ProducerRecord) {
    console.info('producer send ', record);
    await this.producer.send(record);
  }
}
