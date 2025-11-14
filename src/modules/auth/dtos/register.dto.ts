import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class RegisterDto {
  @ApiProperty()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email là bắt buộc' })
  email: string;

  // @ApiProperty()
  // @IsString({ message: 'Tên phải là chuỗi' })
  // @IsNotEmpty({ message: 'Tên là bắt buộc' })
  // fullName: string;

  // @ApiProperty()
  // @IsString({ message: 'Mật khẩu phải là chuỗi' })
  // @IsNotEmpty({ message: 'Mật khẩu là bắt buộc' })
  // @MinLength(8, { message: 'Mật khẩu tối thiểu 8 ký tự' })
  // password: string;
}
