/* eslint-disable simple-import-sort/imports */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from './common/services/logger/logger.module';
import { MailModule } from './common/services/mail/mail.module';
import { MongoModule } from './common/services/mongo/mongo.module';
import { RedisModule } from './common/services/redis/redis.module';
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
    MongoModule,
    LoggerModule,
    MailModule,
    I18nModule,
    MailModule,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
