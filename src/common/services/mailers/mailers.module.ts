import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';

import { EmailConsumerController } from './mailer.consumer';
import { MailersService } from './mailers.service';

@Module({
  imports: [MailerModule],
  controllers: [EmailConsumerController],
  providers: [MailersService],
})
export class MailersModule {}
