import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { LoggingModule } from './modules/logging/logging.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({isGlobal: true, envFilePath: '.env'}), AuthModule, LoggingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
