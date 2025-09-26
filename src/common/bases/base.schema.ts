import { Prop } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
export class MongoBaseSchema {
    @Prop({ required: false, default: null, type: Date })
    createdAt: Date;

    @Prop({ required: false, default: null, type: Date })
    updatedAt: Date;

    @Prop({ required: false, default: null, type: Date })
    deletedAt?: Date;
}