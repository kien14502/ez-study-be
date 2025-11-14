import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailersService {
  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async sendEmailRegister(email: string, token: string) {
    try {
      return await this.mailerService.sendMail({
        to: email,
        from: 'noreply@nestjs.com',
        subject: 'Verify Your Email - EZ Study',
        template: 'verify',
        context: {
          email: email,
          token: token,
          client_url: this.configService.get<string>('CLIENT_URL', 'localhost:3000'),
        },
      });
    } catch (error) {
      throw error;
    }
  }
}
