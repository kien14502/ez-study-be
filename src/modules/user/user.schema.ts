import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { MongoBaseSchema } from 'src/common/bases/base.schema';
import { AuthProvider, MongoCollection, UserRole } from 'src/common/constants';

@Schema({ collection: MongoCollection.USERS, timestamps: true })
export class User extends MongoBaseSchema {
  @ApiProperty()
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @ApiProperty()
  @Prop({ required: true })
  password: string;

  @ApiProperty()
  @Prop({ required: true })
  fullName: string;

  @ApiProperty()
  @Prop({
    type: String,
    enum: Object.values(UserRole),
    required: false,
    default: UserRole.STUDENT,
  })
  role: UserRole;

  @ApiProperty({ type: Boolean })
  @Prop({ default: false })
  isActive: boolean;

  @ApiProperty()
  @Prop({
    type: String,
    default: null,
    required: false,
  })
  refreshToken?: string;

  @ApiProperty()
  @Prop({ required: false })
  googleId?: string;

  @ApiProperty()
  @Prop({ required: false })
  avatarUrl?: string;

  @ApiProperty()
  @Prop({ default: AuthProvider.LOCAL, enum: Object.values(AuthProvider) })
  provider: AuthProvider;

  @ApiProperty()
  @Prop({ type: Date, required: false })
  lastLoginAt?: Date;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, required: false })
  workspaceId?: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);
