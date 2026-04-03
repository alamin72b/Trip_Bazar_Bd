import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig from './config/app.config';
import adminConfig from './config/admin.config';
import authConfig from './config/auth.config';
import databaseConfig from './config/database.config';
import { AdminModule } from './admin/admin.module';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { OffersModule } from './offers/offers.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig, authConfig, databaseConfig, adminConfig],
      envFilePath: ['.env.local', '.env'],
      validate: validateEnv,
    }),
    DatabaseModule,
    HealthModule,
    UsersModule,
    AuthModule,
    AdminModule,
    OffersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
