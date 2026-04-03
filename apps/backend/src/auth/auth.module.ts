import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshTokenRecord } from './entities/refresh-token-record.entity';
import { AccessTokenGuard } from './guards/access-token.guard';
import { PasswordService } from './password.service';
import { AccessTokenStrategy } from './strategies/access-token.strategy';
import { TokenService } from './token.service';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([RefreshTokenRecord]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    TokenService,
    AccessTokenStrategy,
    AccessTokenGuard,
  ],
  exports: [PasswordService, TokenService, AccessTokenGuard],
})
export class AuthModule {}
