import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { UserJWTPayload } from '@/interfaces/user.interface';
import { convertTimeToSeconds } from '@/plugins/common';

import { AuthTokens } from '../auth/interfaces/jwt-payload.interface';
import { Account } from '../auth/schemas/account.schema';
import { User } from './schemas/user.schema';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Account.name) private accountModel: Model<Account>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async updateRefreshToken(accountId: string, refreshToken: string | null): Promise<void> {
    try {
      await this.accountModel.updateOne({ _id: accountId }, { refreshToken });
    } catch (error) {
      this.logger.error('Error updating refresh token', error);
      throw new HttpException('Failed to update refresh token', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findOneByEmail(email: string): Promise<User | null> {
    const account = await this.accountModel.findOne({ email, deletedAt: null }).exec();
    if (!account) return null;

    return this.userModel.findOne({ accountId: account._id, deletedAt: null }).exec();
  }

  async findUserWithAccount(accountId: string): Promise<{ user: User; account: Account } | null> {
    const account = await this.accountModel.findOne({ _id: accountId, deletedAt: null }).exec();
    if (!account) return null;

    const user = await this.userModel.findOne({ accountId: account._id, deletedAt: null }).exec();
    if (!user) return null;

    return { user, account };
  }

  async generateTokens(user: User): Promise<AuthTokens> {
    try {
      // Get account email
      const account = await this.accountModel
        .findOne({
          _id: user.accountId,
          deletedAt: null,
        })
        .exec();

      if (!account) {
        throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
      }

      const payload: UserJWTPayload = {
        _id: user._id.toString(),
        email: account.email,
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

      // Update refresh token
      await this.updateRefreshToken(account._id.toString(), refreshToken);

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
