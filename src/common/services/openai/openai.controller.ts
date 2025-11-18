import { Controller, Get } from '@nestjs/common';

import { Public } from '@/common/decorators/public.decorator';

import { OpenaiService } from './openai.service';

@Controller('openai')
export class OpenaiController {
  constructor(private readonly openaiService: OpenaiService) {}

  @Public()
  @Get('models')
  async getModels() {
    return await this.openaiService.getModels();
  }
}
