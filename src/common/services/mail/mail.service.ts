/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable simple-import-sort/imports */

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

  async sendMail(options: SendMailOptions): Promise<boolean> {
    try {
      const { to, subject, template, context, attachments } = options;

      await this.mailerService.sendMail({
        to,
        from: `${this.fromName} <${this.fromEmail}>`,
        subject,
        template,
        context,
        attachments,
      });

      this.logger.log(`Email sent successfully to: ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      return false;
    }
  }
}
