import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { MongoCollection } from '@/common/constants';

import { User } from './schemas/user.schema';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async updateProfile(userId: string, updateData: Partial<User>): Promise<User | null> {
    try {
      const user = await this.userModel.findOneAndUpdate({ _id: userId }, updateData, { new: true }).exec();
      return user;
    } catch (error) {
      this.logger.error('Error updating user profile', error);
      throw new HttpException('Failed to update user profile', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createUserProfile(payload: Partial<User>) {
    try {
      const user = await this.userModel.create(payload);
      return await user.save();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Create user fail');
    }
  }

  async findOne(payload: Partial<User>) {
    try {
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
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Find user fail');
    }
  }
}
