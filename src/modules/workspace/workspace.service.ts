import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';

import { toObjectId } from '@/common/helpers/functions';
import { UserJWTPayload } from '@/interfaces/user.interface';

import { CreateWorkSpaceDto } from './dtos/create-workspace.dto';
import { InviteMemberWorkspaceDto } from './dtos/invite-member-workspace.dto';
import { WorkspaceRepository } from './workspace.repository';

@Injectable()
export class WorkspaceService {
  constructor(private readonly workspaceRepository: WorkspaceRepository) {}

  async createWorkspace(payload: CreateWorkSpaceDto, user: UserJWTPayload) {
    try {
      const res = await this.workspaceRepository.create(
        {
          ...payload,
          ownerId: new Types.ObjectId(user._id),
        },
        user,
      );
      const rs = res.populate('ownerId');
      return rs;
    } catch (error) {
      return error;
    }
  }

  async inviteMember({ idMember, wsId }: InviteMemberWorkspaceDto, user: UserJWTPayload) {
    try {
      const wsIdObj = toObjectId(wsId);
      const memberIdObj = toObjectId(idMember);
      const userIdObj = toObjectId(user._id);
      const res = await this.workspaceRepository.inviteMember(memberIdObj, wsIdObj, userIdObj);
      return res;
    } catch (error) {
      throw new Error(error);
    }
  }
}
