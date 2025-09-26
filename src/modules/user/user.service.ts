import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User } from './user.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async updateRefreshToken(email: string, refresh_token: string | null): Promise<void> {
    try {
      await this.userModel.updateOne({ email }, { refreshToken: refresh_token });
    } catch (error) {
      throw error;
    }
  }
}
