import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { compareSync, genSaltSync, hashSync } from 'bcrypt';
import { Model } from 'mongoose';

import { AccountStatus } from '@/common/constants';
import { WithTryCatch } from '@/common/decorators/with-try-catch.decorator';
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

  @WithTryCatch('Failed to create account')
  async createAccountWithEmail(email: string) {
    const account = await this.accountModel.create({ email });
    return await account.save();
  }

  @WithTryCatch('Failed to create account')
  async createAccount(payload: Partial<Account>) {
    const account = await this.accountModel.create(payload);
    return await account.save();
  }

  async updateByEmail(email: string, payload: Partial<Account>) {
    const account = await this.accountModel.findOneAndUpdate({ email }, payload, { new: true });
    return account;
  }

  async updateAccount(payload: Partial<Account>) {
    const account = await this.accountModel.findOneAndUpdate(payload._id, payload);
    return account;
  }

  @WithTryCatch('Not found account by id')
  async findOneById(id: string) {
    const account = await this.accountModel.findById(id);
    if (!account) throw new BadRequestException('Account not found');
    return account;
  }

  @WithTryCatch('Not found account by email')
  async findOneByEmail(email: string) {
    const account = await this.accountModel.findOne({ email }).lean();
    return account;
  }

  @WithTryCatch('Not found account for auth')
  async findOneByEmailForAuth(email: string) {
    console.info('🚀 ~ AccountsService ~ findOneByEmailForAuth ~ email:', email);
    return await this.accountModel.findOne({ email }).select('+password +refreshToken').lean().exec();
  }

  @WithTryCatch('Failed to update account')
  async findByIdAndUpdate(accountId: string, payload: Partial<Account>) {
    const account = await this.accountModel.findByIdAndUpdate({ _id: accountId }, payload);
    return account;
  }

  @WithTryCatch('Failed to update refresh token account')
  async updateRefreshToken(accountId: string, refreshToken: string): Promise<void> {
    await this.findByIdAndUpdate(accountId, { refreshToken });
  }

  @WithTryCatch('Failed to update last login account')
  async updateLastLoginAt(accountId: string, lastLoginAt: Date): Promise<void> {
    await this.findByIdAndUpdate(accountId, { lastLoginAt });
  }

  @WithTryCatch('Failed to update verified status account')
  async updateVerifiedStatus(accountId: string, status: AccountStatus): Promise<void> {
    await this.findByIdAndUpdate(accountId, { status });
  }

  @WithTryCatch('Failed to generate tokens')
  async generateTokens(payload: UserJWTPayload): Promise<AuthTokens> {
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
  }

  async checkHashPassword(password: string, hashPassword: string) {
    return await compareSync(password, hashPassword);
  }

  getHashPassword(password: string) {
    const salt = genSaltSync(10);
    const hash = hashSync(password, salt);
    return hash;
  }
}
