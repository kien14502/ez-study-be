import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';

import { UserRole } from '@/common/constants';

export class UpdateAuthDto {
  @ApiProperty({ example: 'example@gmail.com', description: 'email verify email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'strongPassword123', description: 'Mật khẩu mới của người dùng' })
  @IsString({ message: 'Password phải là chuỗi' })
  @IsNotEmpty({ message: 'Password là bắt buộc' })
  password: string;

  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Tên đầy đủ của người dùng' })
  @IsString({ message: 'Fullname phải là chuỗi' })
  @IsNotEmpty({ message: 'Fullname là bắt buộc' })
  fullname: string;

  @ApiProperty({ enum: UserRole, default: UserRole.STUDENT })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}
