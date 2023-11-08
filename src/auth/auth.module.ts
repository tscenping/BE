import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { UserRepository } from 'src/users/users.repository';
import { Auth42Service } from './auth-42.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { MulterModule } from '@nestjs/platform-express';
import { jwtConfig } from '../common/config/jwt.config';
import { multerConfig } from '../common/config/multer.config';

@Module({
  controllers: [AuthController],
  providers: [AuthService, Auth42Service, UserRepository],
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync(jwtConfig),
    MulterModule.registerAsync(multerConfig),
  ],
})
export class AuthModule {}
