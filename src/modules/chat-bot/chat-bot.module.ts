import { Module } from '@nestjs/common';

import { ChatBotController } from './chat-bot.controller';
import { ChatBotService } from './chat-bot.service';

@Module({
  controllers: [ChatBotController],
  providers: [ChatBotService],
})
export class ChatBotModule {}
