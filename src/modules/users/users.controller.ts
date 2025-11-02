import { Body, Controller, HttpException, HttpStatus, Logger, Post } from '@nestjs/common';
import { ApiBody, ApiTags, OmitType } from '@nestjs/swagger';

import { ApiGlobalResponses } from '@/common/decorators/api-global-responses.decorator';
import { ApiDefaultOkResponse } from '@/common/decorators/api-response.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserJWTPayload } from '@/interfaces/user.interface';

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
    type: OmitType(User, ['_id', 'accountId', 'role', 'workspaceId', 'createdAt', 'updatedAt', 'deletedAt']),
  })
  @Post('profile')
  async updateProfile(@Body() body: Partial<User>, @CurrentUser() user: UserJWTPayload) {
    try {
      const updatedUser = await this.userService.updateProfile(user._id.toString(), body);
      return updatedUser;
    } catch (error) {
      this.logger.error('Error updating user profile', error);
      throw new HttpException('Failed to update user profile', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
