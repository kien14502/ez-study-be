import { Prop } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
export class MongoBaseSchema {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @ApiProperty()
  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @ApiProperty()
  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;

  @ApiProperty({ required: false })
  @Prop({ type: Date, default: null })
  deletedAt?: Date;
}
