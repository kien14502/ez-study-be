import { ApiProperty } from '@nestjs/swagger';

export class AuthTokensDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT refresh token',
  })
  refreshToken: string;

  @ApiProperty({
    example: 900,
    description: 'Token expiration time in seconds',
  })
  expiresIn: number;
}

export class VerifyEmailResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Email verified successfully. You are now logged in.',
  })
  message: string;

  @ApiProperty({
    description: 'Authentication tokens',
    type: AuthTokensDto,
  })
  tokens: AuthTokensDto;
}

export class ResendVerificationResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Verification email has been resent. Please check your inbox.',
  })
  message: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'Authentication tokens',
    type: String,
  })
  accessToken: string;
}
