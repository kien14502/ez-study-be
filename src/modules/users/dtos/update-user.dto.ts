import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUrl } from 'class-validator';

import { User } from '../schemas/user.schema';

export class UpdateProfileDto extends OmitType(User, [
  '_id',
  'accountId',
  'role',
  'workspaceId',
  'createdAt',
  'updatedAt',
  'deletedAt',
] as const) {
  @ApiProperty({ example: 'Nguyễn Văn A', required: true })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'https://example.com/avatar.png', required: false })
  @IsOptional()
  @IsUrl({}, { message: 'avatarUrl phải là đường dẫn hợp lệ' })
  avatarUrl?: string;

  @ApiProperty({ example: '2000-12-31', required: false })
  @IsOptional()
  @IsDateString({}, { message: 'dateOfBirth phải là ngày hợp lệ (ISO 8601)' })
  dateOfBirth?: Date;
}
