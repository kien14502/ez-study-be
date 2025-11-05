import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { MongoCollection } from '@/common/constants';
import { WithTryCatch } from '@/common/decorators/with-try-catch.decorator';

import { User } from './schemas/user.schema';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  @WithTryCatch('Failed to update user profile')
  async updateProfile(userId: string, updateData: Partial<User>): Promise<User | null> {
    const user = await this.userModel.findOneAndUpdate({ _id: userId }, updateData, { new: true }).exec();
    return user;
  }

  @WithTryCatch('Failed to create user profile')
  async createUserProfile(payload: Partial<User>) {
    const user = await this.userModel.create(payload);
    return await user.save();
  }

  @WithTryCatch('Failed to find user')
  async findOne(payload: Partial<User>) {
    const matchPayload = { ...payload };
    const users = await this.userModel.aggregate([
      { $match: matchPayload },
      {
        $lookup: {
          from: MongoCollection.ACCOUNTS,
          localField: 'accountId',
          foreignField: '_id',
          as: 'account',
          pipeline: [
            {
              $project: {
                password: 0,
                refreshToken: 0,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$account',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ['$$ROOT', '$account'],
          },
        },
      },
      {
        $project: {
          account: 0,
        },
      },

      { $limit: 1 },
    ]);

    return users[0] || null;
  }
}
