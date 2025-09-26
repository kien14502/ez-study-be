import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Model } from 'mongoose';
import { UserRole } from 'src/common/constants';
import { RedisService } from 'src/redis/redis.service';

import { User } from '../user/user.schema';
import { RegisterDto } from './dtos/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

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
}
