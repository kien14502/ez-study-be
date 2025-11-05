import { Controller, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ApiGlobalResponses } from '@/common/decorators/api-global-responses.decorator';

import { UserService } from './users.service';
@ApiTags('User')
@ApiGlobalResponses()
@Controller('user')
export class UserController {
  private readonly logger = new Logger(UserController.name);
  constructor(private readonly userService: UserService) {}
}
