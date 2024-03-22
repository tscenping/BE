import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import jwtConfig from '../config/jwt.config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FtAuthService } from './ft-auth.service';
import { JwtAccessStrategy } from './jwt-access.strategy';
import { JwtRefreshStrategy } from './jwt-refresh.strategy';
import { UsersModule } from '../users/users.module';

@Module({
	imports: [
		PassportModule,
		JwtModule.registerAsync({
			inject: [jwtConfig.KEY],
			useFactory: (jwtConfigure: ConfigType<typeof jwtConfig>) =>
				jwtConfigure,
		}),
		UsersModule,
	],
	controllers: [AuthController],
	providers: [
		AuthService,
		FtAuthService,
		JwtAccessStrategy,
		JwtRefreshStrategy,
	],
	exports: [AuthService, JwtAccessStrategy, JwtRefreshStrategy],
})
export class AuthModule {}
