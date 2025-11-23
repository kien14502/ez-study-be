import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';

import { toObjectId } from '@/common/helpers/functions';
import { UserJWTPayload } from '@/interfaces/user.interface';

import { WithTryCatch } from '@/common/decorators/with-try-catch.decorator';
import { CreateWorkSpaceDto } from './dtos/create-workspace.dto';
import { InviteMemberWorkspaceDto } from './dtos/invite-member-workspace.dto';
import { WorkspaceRepository } from './workspace.repository';

@Injectable()
export class WorkspaceService {
  constructor(private readonly workspaceRepository: WorkspaceRepository) {}

  @WithTryCatch('Failed to create workspace')
  async createWorkspace(payload: CreateWorkSpaceDto, user: UserJWTPayload) {
    const res = await this.workspaceRepository.create(
      {
        ...payload,
        ownerId: new Types.ObjectId(user._id),
      },
      user,
    );
    const rs = res.populate('ownerId');
    return rs;
  }

  @WithTryCatch('Failed to invite member')
  async inviteMember({ idMember, wsId }: InviteMemberWorkspaceDto, user: UserJWTPayload) {
    const wsIdObj = toObjectId(wsId);
    const memberIdObj = toObjectId(idMember);
    const userIdObj = toObjectId(user._id);
    const res = await this.workspaceRepository.inviteMember(memberIdObj, wsIdObj, userIdObj);
    return res;
  }
}
