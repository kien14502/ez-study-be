import { ConfigService } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

export const mailerAwsConfig = async (configService: ConfigService) => {
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
};
