import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import jwtConfig from '../config/jwt.config';
import { User } from '../users/entities/user.entity';
import { UserRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { FtAuthService } from './ft-auth.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAccessStrategy } from './jwt-access.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [jwtConfig.KEY],
      useFactory: (jwtConfigure: ConfigType<typeof jwtConfig>) => jwtConfigure,
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    FtAuthService,
    JwtAccessStrategy,
    UserRepository,
    UsersService,
  ],
})
export class AuthModule {}
