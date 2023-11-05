import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Auth42Service } from './auth-42.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, Auth42Service],
})
export class AuthModule {}
