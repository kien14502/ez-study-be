import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

import { UserJWTPayload } from '@/interfaces/user.interface';
import { UserService } from '@/modules/users/users.service';

import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private userService: UserService,
    private authService: AuthService,
  ) {
    super();
  }

  async validate(username: string, password: string): Promise<UserJWTPayload> {
    const user = await this.authService.validateUserCredentials(username, password);
    return {
      _id: user._id.toString(),
      email: user.email,
      sub: user._id.toString(),
      iss: 'ez-study',
    };
  }
}
