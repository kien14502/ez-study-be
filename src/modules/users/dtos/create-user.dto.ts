import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { Types } from 'mongoose';

import { UserRole } from '@/common/constants';

export class CreateUserProfileDto {
  @ApiProperty({
    description: 'ID của tài khoản liên kết',
    example: '66fe78d4402b83c9f29a2f41',
  })
  @IsMongoId({ message: 'accountId phải là ObjectId hợp lệ' })
  @IsNotEmpty({ message: 'accountId không được để trống' })
  accountId: Types.ObjectId;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString({ message: 'fullName phải là chuỗi' })
  @IsNotEmpty({ message: 'fullName không được để trống' })
  fullName: string;

  @ApiProperty({
    example: 'https://example.com/avatar.png',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'avatarUrl phải là đường dẫn hợp lệ' })
  avatarUrl?: string;

  @ApiProperty({
    example: '2000-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'dateOfBirth phải là ngày hợp lệ (ISO 8601)' })
  dateOfBirth?: Date;

  @ApiProperty({
    description: 'ID workspace (nếu có)',
    example: '6700d9d4402b83c9f29a2f41',
    required: false,
  })
  @IsOptional()
  @IsMongoId({ message: 'workspaceId phải là ObjectId hợp lệ' })
  workspaceId?: Types.ObjectId;

  @ApiProperty({
    enum: UserRole,
    default: UserRole.STUDENT,
    description: 'Vai trò của user trong hệ thống',
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'role không hợp lệ' })
  role?: UserRole = UserRole.STUDENT;
}
