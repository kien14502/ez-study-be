import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

export const kafkaConfig = (app: INestApplication, configService: ConfigService) =>
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'mail-service',
        brokers: [configService.get<string>('BROKER_KAFKA', 'kafka:29092')],
      },
      consumer: {
        groupId: 'email-consumer-group',
        allowAutoTopicCreation: true,
        retry: { retries: 5 },
        sessionTimeout: 30000,
      },
      subscribe: {
        fromBeginning: true,
      },
    },
  });
