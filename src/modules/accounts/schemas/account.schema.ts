import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

import { baseSchemaOptions, MongoBaseSchema } from '@/common/bases/base.schema';
import { AccountStatus, AuthProvider, MongoCollection } from '@/common/constants';

@Schema({
  collection: MongoCollection.ACCOUNTS,
  ...baseSchemaOptions,
})
export class Account extends MongoBaseSchema {
  @ApiProperty({ description: 'Email của tài khoản', example: 'user@example.com' })
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email: string;

  @ApiProperty({ description: 'Mật khẩu đã hash (null nếu dùng OAuth)' })
  @Prop({
    required: false,
    select: false,
  })
  password?: string;

  @ApiProperty({
    description: 'Phương thức đăng nhập',
    enum: AuthProvider,
    example: AuthProvider.LOCAL,
  })
  @Prop({
    type: String,
    enum: Object.values(AuthProvider),
    default: AuthProvider.LOCAL,
    required: true,
  })
  provider: AuthProvider;

  @ApiProperty({ description: 'JWT refresh token' })
  @Prop({
    required: false,
    select: false,
  })
  refreshToken?: string;

  @ApiProperty({
    description: 'Trạng thái tài khoản',
    enum: AccountStatus,
    example: AccountStatus.ACTIVE,
  })
  @Prop({
    type: String,
    enum: Object.values(AccountStatus),
    default: AccountStatus.INACTIVE,
    required: true,
  })
  status: AccountStatus;

  @ApiProperty({ description: 'Google OAuth ID', required: false })
  @Prop({
    required: false,
    unique: true,
    sparse: true,
    index: true,
  })
  googleId?: string;

  @ApiProperty({ description: 'Thời điểm đăng nhập gần nhất' })
  @Prop({
    type: Date,
    required: false,
  })
  lastLoginAt?: Date;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
