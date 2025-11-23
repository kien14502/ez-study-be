import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { MemberRoleWorkspace } from '@/common/constants';
import { toObjectId } from '@/common/helpers/functions';
import { UserJWTPayload } from '@/interfaces/user.interface';

import { GetMemberWorkspaceDto } from './dtos/get-member-workspace.dto';
import { MemberWorkspace } from './schemas/member-workspace.schema';
import { Workspace } from './schemas/workspace.schema';

@Injectable()
export class WorkspaceRepository {
  constructor(
    @InjectModel(Workspace.name) private workspaceModel: Model<Workspace>,
    @InjectModel(MemberWorkspace.name) private memberWorkspace: Model<MemberWorkspace>,
  ) {}

  async create(data: Partial<Workspace>, user: UserJWTPayload) {
    const userIdObj = toObjectId(user._id);
    const newMember = await this.createNewMember({
      userId: userIdObj,
      invitedBy: userIdObj,
      role: MemberRoleWorkspace.ADMIN,
    });
    const createdWorkspace = new this.workspaceModel({
      ...data,
      members: [newMember._id],
    });
    return createdWorkspace.save();
  }

  async inviteMember(idMember: Types.ObjectId, idWs: Types.ObjectId, invitedBy: Types.ObjectId) {
    const workspaceExists = await this.findOneById(idWs);
    if (!workspaceExists) {
      throw new NotFoundException('Workspace not found or you do not have permission');
    }
    const memberExists = workspaceExists.members?.some((member) => member._id === idMember);
    if (memberExists) {
      throw new ConflictException('Member already exists in workspace');
    }

    const newMember = await this.createNewMember({
      userId: idMember,
      invitedBy,
    });

    workspaceExists.members = workspaceExists.members || [];
    workspaceExists.members.push(newMember._id);

    await workspaceExists.save();
    return workspaceExists;
  }

  async findOneById(idWs: Types.ObjectId) {
    return await this.workspaceModel.findById(idWs);
  }

  async getMemberInfo(idMember: Types.ObjectId) {
    const rs = await this.memberWorkspace.findById(idMember);
    return rs;
  }

  async createNewMember(payload: Partial<MemberWorkspace>) {
    const member = await this.memberWorkspace.create(payload);
    return member;
  }

  async findUserWorkspaces({ member_name, wsId }: GetMemberWorkspaceDto) {
    const users = await this.workspaceModel.aggregate([
      {
        $match: { _id: toObjectId(wsId) },
        $lookup: {
          from: 'MemberWorkspace',
          localField: 'members',
          foreignField: '_id',
          as: 'memberWorkspaces',
        },
      },
    ]);
    return users;
  }
}
