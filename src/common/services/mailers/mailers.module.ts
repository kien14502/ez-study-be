import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

import { MailersService } from './mailers.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('EMAIL_HOST', 'smtp.gmail.com'),
          port: configService.get<number>('EMAIL_PORT', 587),
          secure: false,
          auth: {
            user: configService.get<string>('EMAIL_USER', 'phankien.epu@gmail.com'),
            pass: configService.get<string>('EMAIL_PASS', 'hqsw zrpc vadj foxt'),
          },
          template: {
            dir: join(__dirname, 'email-templates'),
            adapter: new HandlebarsAdapter(),
            options: { strict: true },
          },
          defaults: {
            from: '"No Reply" ' + configService.get<string>('EMAIL_USER', 'phankien.epu@gmail.com'),
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [],
  providers: [MailersService, JwtService],
})
export class MailersModule {}
