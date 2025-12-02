import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findAll(filters?: any) {
    return this.userModel.find(filters).select('-password -refreshToken');
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).select('-password -refreshToken');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  async update(id: string, updateData: Partial<User>) {
    const user = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .select('-password -refreshToken');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async remove(id: string) {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { message: 'User deactivated successfully' };
  }

  async getUserStats(userId: string) {
    const user = await this.findOne(userId);

    // This can be extended to include orders, reviews, etc.
    return {
      user,
      stats: {
        totalOrders: 0,
        totalReviews: 0,
      },
    };
  }
}
