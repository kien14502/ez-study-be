import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { AccountStatus } from '@/common/constants';
import { UserJWTPayload } from '@/interfaces/user.interface';
import { convertTimeToSeconds } from '@/plugins/common';

import { AuthTokens } from '../auth/interfaces/jwt-payload.interface';
import { Account } from './schemas/account.schema';

@Injectable()
export class AccountsService {
  constructor(
    @InjectModel(Account.name) private accountModel: Model<Account>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async createAccount(email: string, password: string) {
    try {
      const account = await this.accountModel.create({ email, password });
      return await account.save();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create account');
    }
  }

  async findOneById(id: string) {
    try {
      const account = await this.accountModel.findById(id);
      if (!account) throw new BadRequestException('Account not found');
      return account;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Not found account');
    }
  }

  async findOneByEmail(email: string) {
    try {
      const account = await this.accountModel.findOne({ email }).lean();
      return account;
    } catch (error) {
      throw new Error(error);
    }
  }

  // account.service.ts
  async findOneByEmailForAuth(email: string) {
    try {
      return await this.accountModel.findOne({ email }).select('+password +refreshToken').lean().exec();
    } catch (error) {
      Error(error);
    }
  }

  async findByIdAndUpdate(accountId: string, payload: Partial<Account>) {
    try {
      const account = await this.accountModel.findByIdAndUpdate({ _id: accountId }, payload);
      return account;
    } catch (error) {
      throw new Error(error);
    }
  }

  async updateRefreshToken(accountId: string, refreshToken: string): Promise<void> {
    try {
      await this.findByIdAndUpdate(accountId, {
        refreshToken,
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  async updateLastLoginAt(accountId: string, lastLoginAt: Date): Promise<void> {
    try {
      await this.findByIdAndUpdate(accountId, {
        lastLoginAt,
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  async updateVerifiedStatus(accountId: string, status: AccountStatus): Promise<void> {
    try {
      await this.findByIdAndUpdate(accountId, {
        status,
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  async generateTokens(payload: UserJWTPayload): Promise<AuthTokens> {
    try {
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

      // Update refresh token
      await this.updateRefreshToken(payload._id, refreshToken);

      return {
        accessToken,
        refreshToken,
        expiresIn: convertTimeToSeconds(accessTokenExpiry),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to generate tokens', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
