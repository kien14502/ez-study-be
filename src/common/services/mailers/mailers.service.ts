import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailersService {
  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  async sendEmailRegister(email: string) {
    const token = await this.jwtService.signAsync(
      { email: email },
      {
        secret: this.configService.get<string>('JWT_VERIFY_EMAIL_SECRET'),
        expiresIn: '5m',
      },
    );

    return this.mailerService.sendMail({
      to: email,
      from: 'noreply@nestjs.com',
      subject: 'Verify Email',
      template: 'verification',
      context: {
        email: email,
        token: token,
        client_url: this.configService.get<string>('CLIENT_URL'),
      },
    });
  }
}
