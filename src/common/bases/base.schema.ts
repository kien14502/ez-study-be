import { Prop, Schema } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

@Schema({ versionKey: false, timestamps: true })
export class MongoBaseSchema {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @ApiProperty({ required: false, default: new Date().toISOString(), type: Date })
  @Prop({ type: Date, default: new Date().toISOString(), required: false })
  createdAt: Date;

  @ApiProperty({ required: false, type: Date, default: new Date().toISOString() })
  updatedAt: Date;

  @ApiProperty({ required: false })
  @Prop({ type: Date, default: null })
  deletedAt?: Date;
}
