import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { UserRole } from '@/common/constants';
import { ApiGlobalResponses } from '@/common/decorators/api-global-responses.decorator';
import { ApiDefaultOkResponse } from '@/common/decorators/api-response.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserJWTPayload } from '@/interfaces/user.interface';

import { CreateWorkSpaceDto } from './dtos/create-workspace.dto';
import { InviteMemberWorkspaceDto } from './dtos/invite-member-workspace.dto';
import { Workspace } from './schemas/workspace.schema';
import { WorkspaceService } from './workspace.service';

@ApiTags('Workspace')
@ApiGlobalResponses()
@Controller('workspace')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @ApiDefaultOkResponse({
    type: Workspace,
    description: 'User profile updated successfully',
  })
  @Roles(UserRole.TEACHER)
  @Post('')
  async createWorkspace(@Body() payload: CreateWorkSpaceDto, @CurrentUser() user: UserJWTPayload) {
    return await this.workspaceService.createWorkspace(payload, user);
  }

  @ApiDefaultOkResponse({
    type: Workspace,
    description: 'User profile updated successfully',
  })
  @Post('invite-member')
  async inviteMember(@Body() payload: InviteMemberWorkspaceDto, @CurrentUser() user: UserJWTPayload) {
    return await this.workspaceService.inviteMember(payload, user);
  }
}
