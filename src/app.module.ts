import { MailerModule } from '@nestjs-modules/mailer';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { MailersModule } from './common/services/mailers/mailers.module';
import { MongoModule } from './common/services/mongo/mongo.module';
import { OpenaiModule } from './common/services/openai/openai.module';
import { RedisModule } from './common/services/redis/redis.module';
import { ThrottleModule } from './common/services/throttle/throttle.module';
import { loggerConfig } from './configs/logger.config';
import { mailerConfig } from './configs/mailer.config';
import { I18nModule } from './i18n/i18n.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChaptersModule } from './modules/chapters/chapters.module';
import { ChatBotModule } from './modules/chat-bot/chat-bot.module';
import { ExercisesModule } from './modules/exercises/exercises.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { MissionsModule } from './modules/missions/missions.module';
import { SubjectsModule } from './modules/subjects/subjects.module';
import { UploadModule } from './modules/upload/upload.module';
import { UsersModule } from './modules/users/users.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottleModule,
    LoggerModule.forRoot(loggerConfig()),
    MailerModule.forRootAsync({
      useFactory: mailerConfig,
      inject: [ConfigService],
    }),
    MongoModule,
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
    ScheduleModule.forRoot(),
    ChatBotModule,
    OpenaiModule,
    WorkspaceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
