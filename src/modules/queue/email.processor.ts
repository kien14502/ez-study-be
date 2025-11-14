/* eslint-disable @typescript-eslint/no-explicit-any */
import { MailerService } from '@nestjs-modules/mailer';
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { Attachment } from 'nodemailer/lib/mailer';

import { EMAIL_QUEUE } from './email-queue.constant';

interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
  attachments: Attachment[];
}

@Processor(EMAIL_QUEUE.NAME)
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly mailerService: MailerService) {}

  @Process(EMAIL_QUEUE.JOB.SEND_EMAIL)
  async handleSendEmail(job: Job<EmailJobData>) {
    const { to, subject, template, context, attachments } = job.data;

    try {
      const mailOptions: any = {
        to,
        subject,
        template,
        context,
      };

      if (attachments && attachments.length > 0) {
        mailOptions.attachments = attachments;
      }

      await this.mailerService.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to: ${to}`);
    } catch (error) {
      this.logger.error(error, `Failed to send email to: ${to}`);
      throw error;
    }
  }
}
