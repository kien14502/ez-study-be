import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from 'nestjs-pino';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import ConfigKey from './common/config-key';
import { RedisModule } from './common/services/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChaptersModule } from './modules/chapters/chapters.module';
import { ExercisesModule } from './modules/exercises/exercises.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { MissionsModule } from './modules/missions/missions.module';
import { SubjectsModule } from './modules/subjects/subjects.module';
import { UploadModule } from './modules/upload/upload.module';
import { UserModule } from './modules/user/user.module';

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
        console.info('uri', uri);
        return {
          uri,
        };
      },
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            singleLine: true,
            translateTime: 'HH:MM:ss.l',
            ignore: 'pid,hostname,context',
          },
        },
      },
    }),
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    AuthModule,
    UserModule,
    RedisModule,
    UploadModule,
    SubjectsModule,
    MissionsModule,
    ChaptersModule,
    LessonsModule,
    ExercisesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
