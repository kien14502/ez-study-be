import { Body, Controller, Get, Logger, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBody, ApiCookieAuth, ApiHeader, ApiOperation, ApiTags, OmitType } from '@nestjs/swagger';
import type { Response as ExpressResponse } from 'express';
import { ApiGlobalResponses } from 'src/common/decorators/api-global-responses.decorator';
import { ApiDefaultOkResponse } from 'src/common/decorators/api-response.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';

import { MessageDto } from '@/common/dto/message.dto';
import { UserJWTPayload } from '@/interfaces/user.interface';

import { User } from '../users/schemas/user.schema';
import { AuthService } from './auth.service';
import {
  AuthTokensDto,
  LoginResponseDto,
  ResendVerificationResponseDto,
  VerifyEmailResponseDto,
} from './dtos/auth-response.dto';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { VerifyEmailDto } from './dtos/verify-email.dto';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@ApiTags('Auth')
@ApiGlobalResponses()
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @ApiDefaultOkResponse({
    type: LoginResponseDto,
    description: 'User logged in successfully',
  })
  @ApiBody({ type: LoginDto })
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req, @Res({ passthrough: true }) res: ExpressResponse) {
    return this.authService.login(req.user, res);
  }

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return await this.authService.register(dto);
  }

  @ApiDefaultOkResponse({
    type: VerifyEmailResponseDto,
    description: 'Email verified successfully and returns authentication tokens',
  })
  @Public()
  @Get('verify-email')
  async verifyEmail(@Query() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @ApiDefaultOkResponse({
    type: ResendVerificationResponseDto,
    description: 'Verification code resent successfully',
  })
  @Public()
  @Post('resend-verification')
  async resendVerification(@Body('email') email: string) {
    return this.authService.resendVerificationCode(email);
  }

  @ApiCookieAuth('refreshToken')
  @ApiDefaultOkResponse({
    type: AuthTokensDto,
    description: 'User logged in successfully',
  })
  @ApiOperation({
    summary: 'Làm mới Access Token',
    description:
      'Yêu cầu này sử dụng Refresh Token được lưu trong Cookie HTTP-Only (tên là "refreshToken") để cấp lại một Access Token mới.',
  })
  @UseGuards(JwtRefreshGuard)
  @Public()
  @Get('refresh')
  async refresh(@CurrentUser() user: UserJWTPayload, @Res({ passthrough: true }) res: ExpressResponse) {
    const { accessToken, refreshToken } = await this.authService.refreshTokens(user);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge: this.configService.get<number>('JWT_REFRESH_TOKEN_EXPIRY_MS', 7 * 24 * 60 * 60 * 1000),
    });

    return { accessToken };
  }

  @ApiDefaultOkResponse({
    type: MessageDto,
    description: 'User logged in successfully',
  })
  @ApiHeader({ name: 'Authorization', description: 'Bearer <access_token>' })
  @Post('logout')
  async logout(@CurrentUser() user: UserJWTPayload, @Res({ passthrough: true }) res: ExpressResponse) {
    return this.authService.logout(user, res);
  }

  @ApiHeader({ name: 'Authorization', description: 'Bearer <access_token>' })
  @ApiDefaultOkResponse({
    type: OmitType(User, ['workspaceId', 'accountId']),
    description: 'User logged in successfully',
  })
  @Get('profile')
  async getProfile(@CurrentUser() payload: UserJWTPayload) {
    const user = await this.authService.getProfileUser(payload);
    return user;
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  async googleAuth() {
    // The req object is passed automatically by the GoogleOAuthGuard
    this.logger.log('Google OAuth initiated');
  }

  // TO DO
  // @Public()
  // @Get('google/callback')
  // @UseGuards(GoogleOAuthGuard)
  // async googleAuthRedirect(@Req() req: ExpressRequest, @Res() res: ExpressResponse): Promise<void> {
  //     const user = req.user as User;
  //     const tokens = await this.authService.googleLogin(user);

  //     // Redirect về frontend với tokens
  //     const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  //     const redirectUrl = `${frontendUrl}/auth/callback?token=${tokens.accessToken}&refresh=${tokens.refreshToken}`;

  //     res.redirect(redirectUrl);
  // }
}
