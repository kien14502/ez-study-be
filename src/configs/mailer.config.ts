import { ConfigService } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

export const mailerConfig = async (configService: ConfigService) => {
  const host = configService.get<string>('EMAIL_HOST', 'smtp.gmail.com');
  const port = configService.get<number>('EMAIL_PORT', 587);
  const secure = configService.get<boolean>('EMAIL_SECURE', false);
  const user = configService.get<string>('EMAIL_USER');
  const pass = configService.get<string>('EMAIL_PASS');

  if (!user || !pass) {
    // Log a clear message so developer knows to set env vars.

    console.error('[Mailer] Missing EMAIL_USER or EMAIL_PASS environment variables');
    throw new Error('Missing EMAIL_USER or EMAIL_PASS for SMTP transport');
  }

  const templatesDir = join(process.cwd(), 'src', 'common', 'services', 'mailers', 'templates');

  return {
    transport: {
      host,
      port,
      secure,
      auth: { user, pass },
    },
    defaults: {
      from: configService.get<string>('EMAIL_FROM', user),
    },
    template: {
      dir: templatesDir,
      adapter: new HandlebarsAdapter(),
      options: { strict: true },
    },
  };
};
