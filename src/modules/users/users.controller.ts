import { Body, Controller, Logger, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';

import { ApiGlobalResponses } from '@/common/decorators/api-global-responses.decorator';
import { ApiDefaultOkResponse } from '@/common/decorators/api-response.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserJWTPayload } from '@/interfaces/user.interface';

import { UpdateProfileDto } from './dtos/update-user.dto';
import { User } from './schemas/user.schema';
import { UserService } from './users.service';

@ApiTags('User')
@ApiGlobalResponses()
@Controller('user')
export class UserController {
  private readonly logger = new Logger(UserController.name);
  constructor(private readonly userService: UserService) {}

  @ApiDefaultOkResponse({
    type: User,
    description: 'User profile updated successfully',
  })
  @ApiBody({
    type: UpdateProfileDto,
  })
  @Post('profile')
  async updateProfile(@Body() body: UpdateProfileDto, @CurrentUser() user: UserJWTPayload) {
    const updatedUser = await this.userService.updateProfile(user._id.toString(), body);
    return updatedUser;
  }
}
