import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

import { MongoBaseSchema } from '@/common/bases/base.schema';
import { MongoCollection, WorkspaceStatus } from '@/common/constants';

@Schema({ collection: 'Workspaces' })
export class Workspace extends MongoBaseSchema {
  @ApiProperty({ example: 'Nguyễn Văn A' })
  @Prop({ required: true, trim: true, type: String })
  name: string;
  @ApiProperty({ example: 'Nguyễn Văn A' })
  @Prop({ required: true, trim: true, type: String })
  logoUrl: string;
  @ApiProperty({ example: 'Nguyễn Văn A' })
  @Prop({
    type: Types.ObjectId,
    ref: MongoCollection.ACCOUNTS,
    required: true,
    index: true,
  })
  ownerId: Types.ObjectId;
  @ApiProperty({ example: ['1232132131'] })
  @Prop([
    {
      type: Types.ObjectId,
      ref: 'MemberWorkspace',
      required: false,
      index: true,
      default: [],
    },
  ])
  members: Types.ObjectId[];
  @ApiProperty({
    example: WorkspaceStatus.ACTIVE,
    enum: WorkspaceStatus,
    required: false,
    default: WorkspaceStatus.ACTIVE,
  })
  @Prop({ required: false, enum: WorkspaceStatus, type: String })
  status: WorkspaceStatus;
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);
