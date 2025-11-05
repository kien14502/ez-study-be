import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import ConfigKey from '@/common/config-key';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('MongooseModule');
        const uri = configService.get<string>(
          ConfigKey.MONGO_DATABASE_CONNECTION_STRING,
          'mongodb://mongodb:27017/ez-study',
        );
        logger.log('uri', uri);
        return {
          uri,
        };
      },
    }),
  ],
  providers: [],
})
export class MongoModule {}
