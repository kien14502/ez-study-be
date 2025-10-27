import { Module } from '@nestjs/common';

import { ChaptersController } from './chapters.controller';
import { ChaptersService } from './chapters.service';

@Module({
  controllers: [ChaptersController],
  providers: [ChaptersService],
})
export class ChaptersModule {}
