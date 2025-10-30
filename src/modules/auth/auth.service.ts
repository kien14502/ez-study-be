import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { Model, Types } from 'mongoose';

import { AccountStatus, AuthProvider, UserRole } from '@/common/constants';
import { RedisService } from '@/common/services/redis/redis.service';
import { UserJWTPayload } from '@/interfaces/user.interface';

import { User } from '../users/schemas/user.schema';
import { UserService } from '../users/users.service';
import { RegisterDto } from './dtos/register.dto';
import { VerifyEmailDto } from './dtos/verify-email.dto';
import { GoogleUser } from './interfaces/google-profile.interface';
import { AuthTokens } from './interfaces/jwt-payload.interface';
import { Account } from './schemas/account.schema';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Account.name) private accountModel: Model<Account>,
    private redisService: RedisService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private userService: UserService,
  ) {}

  async login(userPayload: UserJWTPayload, res: Response) {
    try {
      const { email } = userPayload;
      this.logger.log(`🚀 ~ AuthService ~ login ~ email: ${email}`);

      const account = await this.accountModel.findOne({ email, deletedAt: null });
      if (!account) {
        throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
      }

      if (account.status !== AccountStatus.ACTIVE) {
        throw new HttpException('Account not verified. Please verify your email first.', HttpStatus.FORBIDDEN);
      }

      const user = await this.userModel.findOne({ accountId: account._id, deletedAt: null });
      if (!user) {
        throw new HttpException('User profile not found', HttpStatus.NOT_FOUND);
      }

      // Update last login
      account.lastLoginAt = new Date();
      await account.save();

      const { accessToken, refreshToken } = await this.userService.generateTokens(user);
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
      const { email, password, fullName, role } = registerDto;

      const existingAccount = await this.accountModel.findOne({ email, deletedAt: null });
      if (existingAccount) {
        throw new HttpException('Email already registered', HttpStatus.BAD_REQUEST);
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Step 1: Create Account
      const account = await this.accountModel.create({
        email,
        password: hashedPassword,
        provider: AuthProvider.LOCAL,
        status: AccountStatus.INACTIVE,
      });

      // Step 2: Create User
      await this.userModel.create({
        accountId: account._id,
        fullName,
        role: role || UserRole.STUDENT,
      });

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

      const account = await this.accountModel.findOne({
        _id: accountId,
        email,
        deletedAt: null,
      });

      if (!account) {
        throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
      }

      if (account.status === AccountStatus.ACTIVE) {
        throw new HttpException('Account already verified', HttpStatus.BAD_REQUEST);
      }

      // Verify token in Redis
      const redisKey = `verify-token:${accountId}`;
      const storedToken = await this.redisService.get(redisKey);

      if (!storedToken || storedToken !== token) {
        throw new HttpException('Invalid or expired verification token', HttpStatus.BAD_REQUEST);
      }

      // Activate account
      account.status = AccountStatus.ACTIVE;
      await account.save();

      // Clean up Redis
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
      const account = await this.accountModel.findOne({ email, deletedAt: null });

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

      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
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

  async refreshTokens(user: User): Promise<AuthTokens> {
    try {
      return await this.userService.generateTokens(user);
    } catch (error) {
      this.logger.error('Error refreshing tokens', error);
      throw new HttpException('Failed to refresh tokens', HttpStatus.UNAUTHORIZED);
    }
  }

  async logout(user: UserJWTPayload, res: Response): Promise<{ message: string }> {
    try {
      const account = await this.accountModel.findOne({
        email: user.email,
        deletedAt: null,
      });

      if (account) {
        await this.userService.updateRefreshToken(account._id.toString(), null);
      }

      res.clearCookie('refreshToken');
      return { message: 'Logged out successfully' };
    } catch (error) {
      this.logger.error('Error logging out', error);
      throw new HttpException('Logout failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async googleLogin(user: User): Promise<AuthTokens> {
    try {
      const account = await this.accountModel.findOne({
        _id: user.accountId,
        deletedAt: null,
      });

      if (account) {
        account.lastLoginAt = new Date();
        await account.save();
      }

      return await this.userService.generateTokens(user);
    } catch (error) {
      this.logger.error('Error google login tokens', error);
      throw new HttpException('Failed to login with Google', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async validateGoogleUser(googleUser: GoogleUser): Promise<User> {
    try {
      const { googleId, email, fullName, avatar } = googleUser;

      // Check if account exists with googleId
      let account = await this.accountModel.findOne({
        googleId,
        deletedAt: null,
      });

      if (account) {
        const user = await this.userModel.findOne({
          accountId: account._id,
          deletedAt: null,
        });

        if (user) {
          return user;
        }
      }

      // Check if account exists with email
      account = await this.accountModel.findOne({
        email,
        deletedAt: null,
      });

      if (account) {
        // Link Google account to existing account
        account.googleId = googleId;
        account.provider = AuthProvider.GOOGLE;
        account.status = AccountStatus.ACTIVE;
        await account.save();

        const user = await this.userModel.findOne({
          accountId: account._id,
          deletedAt: null,
        });

        if (user) {
          // Update avatar if needed
          if (avatar && !user.avatarUrl) {
            user.avatarUrl = avatar;
            await user.save();
          }
          return user;
        }
      }

      // Create new account and user
      const newAccount = await this.accountModel.create({
        email,
        googleId,
        provider: AuthProvider.GOOGLE,
        status: AccountStatus.ACTIVE,
      });

      const newUser = await this.userModel.create({
        accountId: newAccount._id,
        fullName,
        avatarUrl: avatar,
        role: UserRole.STUDENT,
      });

      return newUser;
    } catch (error) {
      this.logger.error('Google user validation error', error);
      throw new HttpException('Failed to validate Google user', HttpStatus.INTERNAL_SERVER_ERROR);
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
    const account = await this.accountModel
      .findOne({
        email,
        deletedAt: null,
      })
      .select('+password');

    if (!account) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    if (account.status !== AccountStatus.ACTIVE) {
      throw new HttpException('Account not verified', HttpStatus.UNAUTHORIZED);
    }

    if (!account.password) {
      throw new HttpException('Please login with Google', HttpStatus.UNAUTHORIZED);
    }

    const isPasswordValid = await bcrypt.compare(password, account.password);
    if (!isPasswordValid) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    const user = await this.userModel.findOne({
      accountId: account._id,
      deletedAt: null,
    });

    if (!user) {
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }

    return {
      _id: user._id,
      email: account.email,
      fullName: user.fullName,
      role: user.role,
    };
  }
}
