import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { ApiGlobalResponses } from 'src/common/decorators/api-global-responses.decorator';
import { ApiDefaultOkResponse } from 'src/common/decorators/api-response.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';

import { User } from '../user/user.schema';
import { AuthService } from './auth.service';
import { AuthTokensDto, ResendVerificationResponseDto, VerifyEmailResponseDto } from './dtos/auth-response.dto';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { VerifyEmailDto } from './dtos/verify-email.dto';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

@ApiTags('Auth')
@ApiGlobalResponses()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @ApiDefaultOkResponse({
    type: AuthTokensDto,
    description: 'User logged in successfully',
  })
  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
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

  @ApiDefaultOkResponse({
    type: AuthTokensDto,
    description: 'User logged in successfully',
  })
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refresh(@CurrentUser() payload: { user: User; refreshToken: string }) {
    return this.authService.refreshTokens(payload.user, payload.refreshToken);
  }

  @Post('logout')
  async logout(@CurrentUser() user: User) {
    return this.authService.logout(user);
  }

  @Get('profile')
  async getProfile(@CurrentUser() user: User) {
    return { user };
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  async googleAuth() {
    // The req object is passed automatically by the GoogleOAuthGuard
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleAuthRedirect(@Req() req: ExpressRequest, @Res() res: ExpressResponse): Promise<void> {
    try {
      const user = req.user as User;
      const tokens = await this.authService.googleLogin(user);

      // Redirect về frontend với tokens
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      const redirectUrl = `${frontendUrl}/auth/callback?token=${tokens.accessToken}&refresh=${tokens.refreshToken}`;

      res.redirect(redirectUrl);
    } catch (error) {
      console.error(error);
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/error`);
    }
  }
}
