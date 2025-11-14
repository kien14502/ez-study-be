import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import ConfigKey from '@/common/config-key';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>(
          ConfigKey.MONGO_DATABASE_CONNECTION_STRING,
          'mongodb://mongodb:27017/ez-study',
        );
        return {
          uri,
        };
      },
    }),
  ],
  providers: [],
})
export class MongoModule {}
