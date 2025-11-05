/* eslint-disable simple-import-sort/imports */
import { MailerModule } from '@nestjs-modules/mailer';
import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import ConfigKey from './common/config-key';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { MailersModule } from './common/services/mailers/mailers.module';
import { RedisModule } from './common/services/redis/redis.module';
import { loggerConfig } from './configs/logger.config';
import { mailerAwsConfig } from './configs/mailer-aws.config';
import { I18nModule } from './i18n/i18n.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChaptersModule } from './modules/chapters/chapters.module';
import { ExercisesModule } from './modules/exercises/exercises.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { MissionsModule } from './modules/missions/missions.module';
import { SubjectsModule } from './modules/subjects/subjects.module';
import { UploadModule } from './modules/upload/upload.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
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
    LoggerModule.forRoot(loggerConfig()),
    MailerModule.forRootAsync({
      useFactory: mailerAwsConfig,
      inject: [ConfigService],
    }),
    I18nModule,
    AuthModule,
    UsersModule,
    RedisModule,
    UploadModule,
    SubjectsModule,
    MissionsModule,
    ChaptersModule,
    LessonsModule,
    ExercisesModule,
    AccountsModule,
    MailersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
