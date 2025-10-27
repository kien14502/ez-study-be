import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

import { UserJWTPayload } from '@/interfaces/user.interface';
import { UserService } from '@/modules/user/user.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super();
  }

  async validate(username: string, password: string): Promise<UserJWTPayload> {
    const user = await this.userService.validateUserCredentials(username, password);

    if (!user) {
      throw new UnauthorizedException('Username or password is incorrect');
    } else if (user.isActive === false) {
      throw new UnauthorizedException('Please verify your email');
    }
    return {
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
      sub: user._id.toString(),
      iss: 'ez-study',
    };
  }
}
