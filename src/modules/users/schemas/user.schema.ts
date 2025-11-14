import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

import { MongoBaseSchema } from '@/common/bases/base.schema';
import { MongoCollection, UserRole } from '@/common/constants';

@Schema({
  collection: MongoCollection.USERS,
})
export class User extends MongoBaseSchema {
  @ApiProperty({ description: 'Reference to Account', type: String })
  @Prop({
    type: Types.ObjectId,
    ref: MongoCollection.ACCOUNTS,
    required: true,
    index: true,
  })
  accountId: Types.ObjectId;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  @Prop({ required: true, trim: true })
  fullName: string;

  @ApiProperty({ required: false })
  @Prop({ required: false, default: null })
  avatarUrl?: string;

  @ApiProperty({ required: false })
  @Prop({ type: Date, required: false, default: null })
  dateOfBirth?: Date;

  @ApiProperty({ description: 'Reference to Workspace', type: String, required: false })
  @Prop({
    type: Types.ObjectId,
    ref: MongoCollection.WORKSPACES,
    required: false,
    index: true,
  })
  workspaceId?: Types.ObjectId;

  @ApiProperty({ enum: UserRole, default: UserRole.STUDENT })
  @Prop({
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.STUDENT,
    required: false,
  })
  role: UserRole;

  @ApiProperty({ type: Number, required: false })
  @Prop({ type: Number, default: 0, required: false })
  star: number;

  @ApiProperty({ type: Number, required: false })
  @Prop({ type: Number, default: 0, required: false })
  diamond: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
