import { BadRequestException, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Response } from 'express';
import { Types } from 'mongoose';
import { I18nService } from 'nestjs-i18n';

import { AccountStatus } from '@/common/constants';
import { WithTryCatch } from '@/common/decorators/with-try-catch.decorator';
import { ProducerService } from '@/common/services/kafka/producer.service';
import { EmailProducerService } from '@/common/services/mailers/mailer.producer';
import { RedisService } from '@/common/services/redis/redis.service';
import { UserJWTPayload } from '@/interfaces/user.interface';

import { AccountsService } from '../accounts/accounts.service';
import { UserService } from '../users/users.service';
import { RegisterDto } from './dtos/register.dto';
import { UpdateAuthDto } from './dtos/update-auth.dto';
import { VerifyEmailDto } from './dtos/verify-email.dto';
import { AuthTokens } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private redisService: RedisService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private userService: UserService,
    private accountService: AccountsService,
    private readonly i18n: I18nService,
    private readonly emailProducer: EmailProducerService,
    private readonly producerService: ProducerService,
  ) {}

  async login(userPayload: UserJWTPayload, res: Response) {
    try {
      const { email } = userPayload;
      const account = await this.accountService.findOneByEmail(email);
      if (!account) {
        throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
      }

      if (account.status !== AccountStatus.ACTIVE) {
        throw new HttpException('Account not verified. Please verify your email first.', HttpStatus.FORBIDDEN);
      }
      const payload: UserJWTPayload = {
        _id: account._id.toString(),
        email: account.email,
        iss: 'ez-study',
        sub: account._id.toString(),
      };

      const { accessToken, refreshToken } = await this.accountService.generateTokens(payload);

      await this.accountService.updateLastLoginAt(account._id.toString(), new Date());

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: this.configService.get<string>('NODE_ENV') === 'production',
        maxAge: this.configService.get<number>('JWT_REFRESH_TOKEN_EXPIRY_MS', 7 * 24 * 60 * 60 * 1000),
        sameSite: 'lax',
      });
      return { accessToken };
    } catch (error) {
      throw error;
    }
  }

  @WithTryCatch('Failed to register user')
  async register(registerDto: RegisterDto) {
    const { email } = registerDto;

    const existingAccount = await this.accountService.findOneByEmail(email);
    if (existingAccount) {
      throw new HttpException(this.i18n.t('auth.register.messages.existing_account'), HttpStatus.BAD_REQUEST);
    }

    const token = randomUUID();
    const redisKey = `verify:${token}`;

    await this.redisService.set(redisKey, email, 10 * 60);
    await this.emailProducer.sendVerificationEmail({ email, token });

    return {
      message: this.i18n.t('auth.register.messages.success'),
    };
  }

  @WithTryCatch('Fail to fill data')
  async updateAuthBeforeVerifyEmail(payload: UpdateAuthDto) {
    const account = await this.accountService.findOneByEmail(payload.email);
    if (!account) throw new BadRequestException('Account not found');

    const hashPassword = this.accountService.getHashPassword(payload.password);

    await this.accountService.updateByEmail(payload.email, {
      password: hashPassword,
    });

    await this.userService.createUserProfile({
      accountId: account._id,
      fullName: payload.fullname,
      role: payload.role,
    });

    return { message: 'Account register successfully' };
  }

  @WithTryCatch('Failed to verify email')
  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<{ message: string; tokens?: AuthTokens }> {
    const { token } = verifyEmailDto;
    const redisKey = `verify:${token}`;
    const email = await this.redisService.get(redisKey);

    if (!email) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    const isAccountExist = await this.accountService.findOneByEmail(email);

    if (isAccountExist) {
      if (isAccountExist.status === AccountStatus.ACTIVE) {
        throw new HttpException('Account already verified', HttpStatus.BAD_REQUEST);
      } else {
        // this.accountService
      }
    }

    await this.accountService.createAccount({
      email,
      status: AccountStatus.ACTIVE,
    });

    await this.redisService.del(redisKey);

    return { message: `Email ${email} verified successfully!` };
  }

  @WithTryCatch('Failed to resend verification code')
  async resendVerificationCode(email: string): Promise<{ message: string }> {
    const account = await this.accountService.findOneByEmail(email);

    if (!account) {
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }

    if (account.status === AccountStatus.ACTIVE) {
      throw new HttpException('Account already verified', HttpStatus.BAD_REQUEST);
    }

    const rateLimitKey = `resend-verify:${email}`;
    const lastSent = await this.redisService.get(rateLimitKey);

    if (lastSent) {
      const ttl = await this.redisService.ttl(rateLimitKey);
      throw new HttpException(
        `Please wait ${Math.ceil(ttl / 60)} minutes before requesting a new verification email.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const oldTokenKey = `verify-token:${account._id.toString()}`;
    await this.redisService.del(oldTokenKey);

    // Generate new verification token
    const verificationToken = this.jwtService.sign(
      {
        email,
        accountId: account._id.toString(),
        type: 'email-verification',
      },
      {
        secret: this.configService.get<string>('JWT_EMAIL_VERIFICATION_SECRET'),
        expiresIn: '24h',
      },
    );

    // Store new token in Redis
    await this.redisService.set(oldTokenKey, verificationToken, 86400);

    // Set rate limit (5 minutes)
    await this.redisService.set(rateLimitKey, Date.now().toString(), 300);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const verifyUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    this.logger.log(`New verification link sent to ${email}: ${verifyUrl}`);

    // TODO: Send verification email here

    return {
      message: 'Verification code sent successfully. Please check your email.',
    };
  }

  @WithTryCatch('Failed to refresh tokens')
  async refreshTokens(user: UserJWTPayload): Promise<AuthTokens> {
    return await this.accountService.generateTokens(user);
  }

  @WithTryCatch('Failed to logout')
  async logout(user: UserJWTPayload, res: Response): Promise<{ message: string }> {
    const account = await this.accountService.findOneByEmail(user.email);

    if (account) {
      await this.accountService.updateRefreshToken(account._id.toString(), '');
    }

    res.clearCookie('refreshToken');
    return { message: 'Logged out successfully' };
  }

  @WithTryCatch('Failed to validate user credentials')
  async validateUserCredentials(
    email: string,
    password: string,
  ): Promise<{
    _id: Types.ObjectId;
    email: string;
    fullName: string;
    role: string;
  }> {
    const account = await this.accountService.findOneByEmailForAuth(email);

    if (!account) {
      throw new HttpException('Account not found', HttpStatus.UNAUTHORIZED);
    }

    if (account.status !== AccountStatus.ACTIVE) {
      throw new HttpException('Account is not active.', HttpStatus.FORBIDDEN);
    }

    if (!account.password) {
      throw new HttpException('Please login with Google', HttpStatus.BAD_REQUEST);
    }

    const isPasswordValid = await bcrypt.compare(password, account.password);
    if (!isPasswordValid) {
      throw new HttpException('Invalid email or password', HttpStatus.UNAUTHORIZED);
    }

    const user = await this.userService.findOne({
      accountId: account._id,
    });

    if (!user) {
      throw new HttpException('User profile not found', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return {
      _id: user._id,
      email: account.email,
      fullName: user.fullName,
      role: user.role,
    };
  }

  @WithTryCatch('Failed to get profile')
  async getProfileUser(user: UserJWTPayload) {
    const accountIdObject = new Types.ObjectId(user._id);
    const currentUser = await this.userService.findOne({ accountId: accountIdObject });
    return currentUser;
  }
}
