import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

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
    if (matchPayload._id) matchPayload._id = new Types.ObjectId(matchPayload._id);
    if (matchPayload.accountId) matchPayload.accountId = new Types.ObjectId(matchPayload.accountId);

    const users = await this.userModel.aggregate([
      { $match: matchPayload },
      {
        $lookup: {
          from: 'account',
          localField: 'accountId',
          foreignField: '_id',
          as: 'account',
          pipeline: [{ $project: { password: 0, refreshToken: 0 } }],
        },
      },
      { $unwind: { path: '$account', preserveNullAndEmptyArrays: true } },
      // Keep the account info in `account` field
      { $project: { accountId: 0 } },
      { $limit: 1 },
    ]);

    return users[0] || null;
  }
}
