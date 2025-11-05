import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { Types } from 'mongoose';

import { AccountStatus } from '@/common/constants';
import { MailersService } from '@/common/services/mailers/mailers.service';
// import { MailService } from '@/common/services/mail/mail.service';
import { RedisService } from '@/common/services/redis/redis.service';
import { UserJWTPayload } from '@/interfaces/user.interface';

import { AccountsService } from '../accounts/accounts.service';
import { UserService } from '../users/users.service';
import { RegisterDto } from './dtos/register.dto';
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
    private mailersService: MailersService,
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

  async register(registerDto: RegisterDto) {
    try {
      const { email, password, fullName } = registerDto;

      const existingAccount = await this.accountService.findOneByEmail(email);
      if (existingAccount) {
        throw new HttpException('Email already registered', HttpStatus.BAD_REQUEST);
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Step 1: Create Account
      const account = await this.accountService.createAccount(email, hashedPassword);

      // Step 2: Create User
      await this.userService.createUserProfile({ accountId: account._id, fullName });

      // Step 3: Generate verification token
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

      const redisKey = `verify-token:${account._id.toString()}`;
      await this.redisService.set(redisKey, verificationToken, 86400);

      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      const verifyUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

      this.logger.log(`Verification link for ${email}: ${verifyUrl}`);

      // TODO: Send verification email here
      // await this.mailService.sendMail({
      //   to: email,
      //   subject: 'Email Verification',
      //   template: 'verification',
      //   context: {
      //     verifyUrl,
      //     year: new Date().getFullYear(),
      //   },
      //   attachments: [],
      // });

      return {
        message: 'Registration successful. Please check your email to verify your account.',
      };
    } catch (error) {
      throw error;
    }
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<{ message: string; tokens?: AuthTokens }> {
    const { token } = verifyEmailDto;

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_EMAIL_VERIFICATION_SECRET'),
      });

      const { email, accountId, type } = payload;

      if (type !== 'email-verification') {
        throw new HttpException('Invalid token type', HttpStatus.BAD_REQUEST);
      }

      const account = await this.accountService.findOneById(accountId);

      if (!account) {
        throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
      }

      if (account.status === AccountStatus.ACTIVE) {
        throw new HttpException('Account already verified', HttpStatus.BAD_REQUEST);
      }

      const redisKey = `verify-token:${accountId}`;
      const storedToken = await this.redisService.get(redisKey);

      if (!storedToken || storedToken !== token) {
        throw new HttpException('Invalid or expired verification token', HttpStatus.BAD_REQUEST);
      }

      await this.accountService.updateVerifiedStatus(accountId, AccountStatus.ACTIVE);

      await this.redisService.del(redisKey);

      this.logger.log(`Email verified successfully for: ${email}`);

      return {
        message: 'Email verified successfully',
      };
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new HttpException('Invalid verification token', HttpStatus.BAD_REQUEST);
      }
      if (error.name === 'TokenExpiredError') {
        throw new HttpException('Verification token has expired. Please request a new one.', HttpStatus.BAD_REQUEST);
      }

      this.logger.error('Error verifying email', error);
      throw error;
    }
  }

  async resendVerificationCode(email: string): Promise<{ message: string }> {
    try {
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
    } catch (error) {
      throw error;
    }
  }

  async refreshTokens(user: UserJWTPayload): Promise<AuthTokens> {
    try {
      return await this.accountService.generateTokens(user);
    } catch (error) {
      console.error('🚀 ~ AuthService ~ refreshTokens ~ error:', error);
      this.logger.error('Error refreshing tokens', error);
      throw new HttpException('Failed to refresh token', HttpStatus.UNAUTHORIZED);
    }
  }

  async logout(user: UserJWTPayload, res: Response): Promise<{ message: string }> {
    try {
      const account = await this.accountService.findOneByEmail(user.email);

      if (account) {
        await this.accountService.updateRefreshToken(account._id.toString(), '');
      }

      res.clearCookie('refreshToken');
      return { message: 'Logged out successfully' };
    } catch (error) {
      this.logger.error('Error logging out', error);
      throw new HttpException('Logout failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

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

  async getProfileUser(user: UserJWTPayload) {
    try {
      const accountIdObject = new Types.ObjectId(user._id);
      const currentUser = await this.userService.findOne({ accountId: accountIdObject });
      return currentUser;
    } catch (error) {
      this.logger.error('Error logging out', error);
      throw error;
    }
  }
}
