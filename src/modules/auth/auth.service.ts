import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { Model } from 'mongoose';

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
      console.info('🚀 ~ AuthService ~ login ~ email:', email);

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

      const existingUser = await this.userModel.findOne({ email, deletedAt: null });
      if (existingUser) throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await this.userModel.create({
        email,
        password: hashedPassword,
        fullName,
        role: role,
        isActive: false,
        provider: AuthProvider.LOCAL,
      });

      const verificationToken = this.jwtService.sign(
        {
          email,
          userId: user._id.toString(),
          type: 'email-verification',
        },
        {
          secret: this.configService.get<string>('JWT_EMAIL_VERIFICATION_SECRET'),
          expiresIn: '24h',
        },
      );

      // TODO: Send verification email here

      const redisKey = `verify-token:${user._id.toString()}`;
      await this.redisService.set(redisKey, verificationToken, 86400);

      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      const verifyUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

      this.logger.log(`Verification link for ${email}: ${verifyUrl}`);

      return {
        message: 'Registration successful. Please check your email to verify your account.',
        email: user.email,
        fullName: user.fullName,
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

      const { email, userId, type } = payload;

      if (type !== 'email-verification') {
        throw new HttpException('Invalid token type', HttpStatus.BAD_REQUEST);
      }

      const user = await this.userModel.findOne({
        _id: userId,
        email,
        deletedAt: null,
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      if (user.isActive) {
        throw new HttpException('Account already verified', HttpStatus.BAD_REQUEST);
      }

      const redisKey = `verify-token:${userId}`;
      const storedToken = await this.redisService.get(redisKey);

      if (storedToken && storedToken !== token) {
        throw new HttpException('Token has been invalidated', HttpStatus.BAD_REQUEST);
      }

      user.isActive = true;
      await user.save();

      await this.redisService.del(redisKey);

      const tokens = await this.userService.generateTokens(user);

      this.logger.log(`Email verified successfully for user: ${email}`);

      return {
        message: 'Email verified successfully',
        tokens,
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
      const user = await this.userModel.findOne({ email, deletedAt: null });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      if (user.isActive) {
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

      const oldTokenKey = `verify-token:${user._id.toString()}`;
      await this.redisService.del(oldTokenKey);

      // Generate new verification code
      const verificationToken = this.jwtService.sign(
        {
          email,
          userId: user._id.toString(),
          type: 'email-verification',
        },
        {
          secret: this.configService.get<string>('JWT_EMAIL_VERIFICATION_SECRET'),
          expiresIn: '24h',
        },
      );

      // Store new token in Redis
      await this.redisService.set(oldTokenKey, verificationToken, 86400); // 24 hours

      // Set rate limit (5 minutes)
      await this.redisService.set(rateLimitKey, Date.now().toString(), 300);

      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      const verifyUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

      this.logger.log(`New verification link sent to ${email}: ${verifyUrl}`);

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
      await this.userService.updateRefreshToken(user.email, null);
      res.clearCookie('refreshToken');
      return { message: 'Logged out successfully' };
    } catch (error) {
      this.logger.error('Error logging out', error);
      throw new HttpException('Logout failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async googleLogin(user: User): Promise<AuthTokens> {
    try {
      return await this.userService.generateTokens(user);
    } catch (error) {
      this.logger.error('Error google login tokens', error);
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
        user.avatarUrl = avatar;
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
      this.logger.error('Error validating Google user tokens', error);
      throw new HttpException('Failed to validate Google user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
