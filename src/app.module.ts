/* eslint-disable simple-import-sort/imports */
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from 'nestjs-pino';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import ConfigKey from './common/config-key';
import { MailModule } from './common/services/mail/mail.module';
import { RedisModule } from './common/services/redis/redis.module';
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
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            singleLine: true,
            translateTime: 'HH:MM:ss.l',
            ignore: 'pid,hostname,context,res.headers,req.headers,req.remoteAddress,req.remotePort',
          },
        },
        serializers: {
          req: (req) => {
            return req;
          },
          res: (res) => {
            return res;
          },
        },
      },
    }),
    MailerModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const awsRegion = configService.get<string>('AWS_REGION', 'ap-southeast-1');
        const mailFrom = configService.get<string>('MAIL_FROM', 'noreply@example.com');
        const transportConfig = {
          host: configService.get<string>('MAIL_TRANSPORT_HOST', `email-smtp.${awsRegion}.amazonaws.com`),
          port: configService.get<number>('MAIL_TRANSPORT_PORT', 465),
          secure: configService.get<boolean>('MAIL_TRANSPORT_SECURE', true),
          auth: {
            user: configService.get<string>('MAIL_USER'),
            pass: configService.get<string>('MAIL_PASSWORD'),
          },
        };
        return {
          transport: transportConfig,
          defaults: {
            from: mailFrom,
          },
          template: {
            dir: process.cwd() + '/src/email-templates',
            adapter: new HandlebarsAdapter(),
            options: {
              strict: false,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
