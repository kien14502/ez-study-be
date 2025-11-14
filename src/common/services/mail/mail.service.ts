/* eslint-disable @typescript-eslint/no-explicit-any */

import { WithTryCatch } from '@/common/decorators/with-try-catch.decorator';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  template: string;
  context: Record<string, any>;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
  }>;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.fromEmail = this.configService.get<string>('MAIL_FROM', 'vudaian12a7@gmail.com');
    this.fromName = this.configService.get<string>('MAIL_FROM_NAME', 'EZ Study');
  }

  @WithTryCatch('Error sending email')
  async sendMail(options: SendMailOptions): Promise<boolean> {
    const { to, subject, template, context, attachments } = options;

    await this.mailerService.sendMail({
      to,
      from: `${this.fromName} <${this.fromEmail}>`,
      subject,
      template,
      context,
      attachments,
    });

    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    this.logger.log(`Email sent successfully to: ${to}`);
    return true;
  }
}
