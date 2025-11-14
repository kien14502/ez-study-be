import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';

import { ConsumerService } from '../kafka/consumer.service';
import { EmailConsumerController } from './mailer.consumer';
import { MailersService } from './mailers.service';

@Module({
  imports: [MailerModule],
  controllers: [EmailConsumerController],
  providers: [MailersService, ConsumerService],
})
export class MailersModule {}
