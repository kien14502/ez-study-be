import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';

import { UserJWTPayload } from '@/interfaces/user.interface';
import { convertTimeToSeconds } from '@/plugins/common';

import { AuthTokens } from '../auth/interfaces/jwt-payload.interface';
import { User } from './user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async checkHashPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async updateRefreshToken(email: string, refresh_token: string | null): Promise<void> {
    try {
      await this.userModel.updateOne({ email }, { refreshToken: refresh_token });
    } catch (error) {
      throw error;
    }
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async validateUserCredentials(email: string, password: string): Promise<User> {
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
  async generateTokens(user: User): Promise<AuthTokens> {
    try {
      const payload: UserJWTPayload = {
        _id: user._id.toString(),
        email: user.email,
        role: user.role,
        sub: user._id.toString(),
        iss: 'ez-study',
      };

      const accessTokenExpiry = this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRY', '15m');
      const refreshTokenExpiry = this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRY', '7d');

      const accessTokenSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
      const refreshTokenSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

      if (!accessTokenSecret || !refreshTokenSecret) {
        throw new HttpException('JWT secrets not configured', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const accessToken = await this.jwtService.signAsync(
        { ...payload, tokenType: 'access' },
        {
          secret: accessTokenSecret,
          expiresIn: accessTokenExpiry,
        },
      );

      const refreshToken = await this.jwtService.signAsync(
        { ...payload, tokenType: 'refresh' },
        {
          secret: refreshTokenSecret,
          expiresIn: refreshTokenExpiry,
        },
      );

      await this.updateRefreshToken(user.email, refreshToken);

      return {
        accessToken,
        refreshToken,
        expiresIn: convertTimeToSeconds(accessTokenExpiry),
      };
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
