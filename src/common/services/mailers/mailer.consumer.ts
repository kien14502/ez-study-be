import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { ETopicKafka } from '@/common/constants';

import { MailersService } from './mailers.service';

@Controller()
export class EmailConsumerController {
  private readonly logger = new Logger(EmailConsumerController.name);
  constructor(private readonly mailerService: MailersService) {}

  @MessagePattern(ETopicKafka.REGISTER_ACCOUNT)
  async handleEmailVerify(@Payload() message) {
    console.info(message);

    const { email, token } = message;
    await this.mailerService.sendEmailRegister(email, token);
    return { success: true, message: 'Email sent successfully' };
  }
}
