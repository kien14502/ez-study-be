import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { MongoBaseSchema } from 'src/common/bases/base.schema';
import { AuthProvider, MongoCollection, UserRole } from 'src/common/constants';

@Schema({ collection: MongoCollection.USERS, timestamps: true })
export class User extends MongoBaseSchema {
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({
    type: String,
    enum: Object.values(UserRole),
    required: false,
    default: UserRole.STUDENT,
  })
  role: UserRole;

  @Prop({ default: false })
  isActive: boolean;

  @Prop({
    type: String,
    default: null,
    required: false,
  })
  refreshToken?: string;

  @Prop({ required: false })
  googleId?: string;

  @Prop({ required: false })
  avatar?: string;

  @Prop({ default: AuthProvider.LOCAL, enum: Object.values(AuthProvider) })
  provider: AuthProvider;
}

export const UserSchema = SchemaFactory.createForClass(User);
