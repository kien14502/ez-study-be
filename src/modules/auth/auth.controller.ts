import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';

import { User } from '../user/user.schema';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}
