import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { jwtConfig } from '../config/jwt.config';
import { multerConfig } from '../config/multer.config';
import { Auth42Service } from './auth-42.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAccessStrategy } from './jwt-access.strategy';
import { User } from '../users/entities/user.entity';
import { UserRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.registerAsync(jwtConfig),
    MulterModule.registerAsync(multerConfig),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    Auth42Service,
    JwtAccessStrategy,
    UserRepository,
    UsersService,
  ],
})
export class AuthModule {}
