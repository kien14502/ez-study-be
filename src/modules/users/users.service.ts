import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

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
      const user = await this.userModel.findOne(payload).lean().exec();
      return user;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Find user fail');
    }
  }
}
