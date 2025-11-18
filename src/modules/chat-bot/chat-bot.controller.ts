import { Controller } from '@nestjs/common';

import { ChatBotService } from './chat-bot.service';

@Controller('chat-bot')
export class ChatBotController {
  constructor(private readonly chatBotService: ChatBotService) {}
}
