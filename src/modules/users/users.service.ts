import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';

import { UserJWTPayload } from '@/interfaces/user.interface';
import { convertTimeToSeconds } from '@/plugins/common';

import { AuthTokens } from '../auth/interfaces/jwt-payload.interface';
import { User } from './schemas/user.schema';

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
}
