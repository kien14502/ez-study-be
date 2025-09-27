import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Model } from 'mongoose';
import { AuthProvider, UserRole } from 'src/common/constants';
import { RedisService } from 'src/common/services/redis.service';

import { User } from '../user/user.schema';
import { UserService } from './../user/user.service';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { GoogleUser } from './interfaces/google.interface';
import { AuthTokens } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private redisService: RedisService,
    private configService: ConfigService,
    private userService: UserService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthTokens> {
    try {
      const { email, password } = loginDto;

      const user = await this.validateUserCredentials(email, password);

      if (!user.isActive) {
        throw new HttpException('Account not verified. Please verify your email first.', HttpStatus.FORBIDDEN);
      }

      return await this.generateTokens(user);
    } catch (error) {
      throw error;
    }
  }

  async register(registerDto: RegisterDto) {
    try {
      const { email, password, fullName, role } = registerDto;

      const existingUser = await this.userModel.findOne({ email, deletedAt: null });
      if (existingUser) throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);

      const hashed = await bcrypt.hash(password, 10);

      const user = await this.userModel.create({
        email,
        password: hashed,
        fullName,
        role: role || UserRole.STUDENT,
        isActive: false,
      });

      const verificationCode = randomBytes(3).toString('hex').toUpperCase();

      const redisKey = `user-verify:${email}`;
      const TTL = 900;

      await this.redisService.set(redisKey, verificationCode, TTL);

      return { email: user.email, fullName: user.fullName };
    } catch (error) {
      throw error;
    }
  }

  private async validateUserCredentials(email: string, password: string): Promise<User> {
    const user = await this.userModel.findOne({
      email,
      deletedAt: null,
    });

    if (!user) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    if (user.deletedAt !== null) {
      throw new HttpException('Account has been deactivated', HttpStatus.FORBIDDEN);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    return user;
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    try {
      const payload = {
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
      };

      const accessTokenExpiry = this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRY') || '15m';
      const refreshTokenExpiry = this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRY') || '7d';

      const accessTokenSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
      const refreshTokenSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

      if (!accessTokenSecret || !refreshTokenSecret) {
        throw new HttpException('JWT secrets not configured', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      // Generate access token
      const accessToken = await this.jwtService.signAsync(
        { ...payload, tokenType: 'access' },
        {
          secret: accessTokenSecret,
          expiresIn: accessTokenExpiry,
        },
      );

      // Generate refresh token
      const refreshToken = await this.jwtService.signAsync(
        { ...payload, tokenType: 'refresh' },
        {
          secret: refreshTokenSecret,
          expiresIn: refreshTokenExpiry,
        },
      );

      // Update refresh token in database
      await this.userService.updateRefreshToken(user.email, refreshToken);

      return {
        accessToken,
        refreshToken,
        expiresIn: this.convertTimeToSeconds(accessTokenExpiry),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to generate tokens', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private convertTimeToSeconds(expTime: string): number {
    const numericValue = parseInt(expTime);
    const unit = expTime.slice(-1);

    let seconds = 0;
    switch (unit) {
      case 's':
        seconds = numericValue;
        break;
      case 'm':
        seconds = numericValue * 60;
        break;
      case 'h':
        seconds = numericValue * 60 * 60;
        break;
      case 'd':
        seconds = numericValue * 24 * 60 * 60;
        break;
      default:
        throw new Error('Invalid time unit');
    }

    return seconds;
  }

  async refreshTokens(user: User, refreshToken: string): Promise<AuthTokens> {
    try {
      if (user.refreshToken !== refreshToken) {
        throw new HttpException('Invalid refresh token', HttpStatus.UNAUTHORIZED);
      }

      return await this.generateTokens(user);
    } catch (error) {
      console.error(error);
      throw new HttpException('Failed to refresh tokens', HttpStatus.UNAUTHORIZED);
    }
  }

  async logout(user: User): Promise<{ message: string }> {
    try {
      await this.userService.updateRefreshToken(user.email, null);
      return { message: 'Logged out successfully' };
    } catch (error) {
      console.error(error);
      throw new HttpException('Logout failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async googleLogin(user: User): Promise<AuthTokens> {
    try {
      return await this.generateTokens(user);
    } catch (error) {
      console.error(error);
      throw new HttpException('Failed to login with Google', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async validateGoogleUser(googleUser: GoogleUser): Promise<User> {
    try {
      const { googleId, email, fullName, avatar } = googleUser;
      let user = await this.userModel.findOne({
        googleId,
        deletedAt: null,
      });

      if (user) {
        return user;
      }
      user = await this.userModel.findOne({
        email,
        deletedAt: null,
      });

      if (user) {
        user.googleId = googleId;
        user.avatar = avatar;
        user.provider = AuthProvider.GOOGLE;
        user.isActive = true;
        await user.save();
        return user;
      }
      user = await this.userModel.create({
        googleId,
        email,
        fullName,
        avatar,
        provider: 'google',
        role: UserRole.STUDENT,
        isActive: true,
      });

      return user;
    } catch (error) {
      console.error(error);
      throw new HttpException('Failed to validate Google user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
