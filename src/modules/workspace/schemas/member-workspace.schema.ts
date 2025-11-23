import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

import { MongoBaseSchema } from '@/common/bases/base.schema';
import { MemberRoleWorkspace, MemberWorkspaceStatus, MongoCollection } from '@/common/constants';

@Schema({ collection: MongoCollection.MEMBER_WORKSPACE })
export class MemberWorkspace extends MongoBaseSchema {
  @ApiProperty({ example: '12312321321' })
  @Prop({
    type: Types.ObjectId,
    ref: MongoCollection.USERS,
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @ApiProperty({ example: '12312321321' })
  @Prop({
    type: Types.ObjectId,
    ref: MongoCollection.USERS,
    required: true,
    index: true,
  })
  invitedBy: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: MongoCollection.WORKSPACES,
    required: true,
    index: true,
  })
  wsId: Types.ObjectId;

  @ApiProperty({ enum: MemberWorkspaceStatus })
  @Prop({ type: String, enum: MemberWorkspaceStatus, required: false, default: MemberWorkspaceStatus.PENDING })
  status: MemberWorkspaceStatus;

  @ApiProperty({ enum: MemberRoleWorkspace })
  @Prop({ type: String, enum: MemberRoleWorkspace, required: false, default: MemberRoleWorkspace.MEMBER })
  role: MemberRoleWorkspace;
}

export const MemberWorkspaceSchema = SchemaFactory.createForClass(MemberWorkspace);
