import { Prop, SchemaOptions } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
export class MongoBaseSchema {
  @ApiProperty({ type: String })
  _id: Types.ObjectId;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  @Prop({ type: Date, default: null })
  deletedAt?: Date;
}

export const baseSchemaOptions: SchemaOptions = {
  timestamps: true,
  versionKey: false,
};
