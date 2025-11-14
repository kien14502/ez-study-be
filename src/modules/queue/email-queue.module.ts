import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EMAIL_QUEUE } from './email-queue.constant';
import { EmailProcessor } from './email.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: EMAIL_QUEUE.NAME,
      defaultJobOptions: EMAIL_QUEUE.JOB_OPTIONS.DEFAULT,
      limiter: EMAIL_QUEUE.LIMITER,
      settings: {
        lockDuration: 30000, // Key for locking the job (30 seconds)
        stalledInterval: 30000, // Check for stalled jobs every 30 seconds
        maxStalledCount: 1, // Max number of times to recover from stalled jobs
      },
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    MailerModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const awsRegion = configService.get<string>('AWS_REGION', 'ap-southeast-1');
        const mailFrom = configService.get<string>('MAIL_FROM', 'noreply@example.com');
        const transportConfig = {
          host: configService.get<string>('MAIL_TRANSPORT_HOST', `email-smtp.${awsRegion}.amazonaws.com`),
          port: configService.get<number>('MAIL_TRANSPORT_PORT', 465),
          secure: configService.get<boolean>('MAIL_TRANSPORT_SECURE', true),
          auth: {
            user: configService.get<string>('MAIL_USER'),
            pass: configService.get<string>('MAIL_PASSWORD'),
          },
        };

        return {
          transport: transportConfig,

          defaults: {
            from: mailFrom,
          },

          template: {
            dir: process.cwd() + '/src/email-templates',
            adapter: new HandlebarsAdapter(),
            options: {
              strict: false,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [EmailProcessor],
  exports: [BullModule, MailerModule],
})
export class EmailQueueModule {}
