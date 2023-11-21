import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import jwtConfig from '../config/jwt.config';
import { User } from '../users/entities/user.entity';
import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FtAuthService } from './ft-auth.service';
import { JwtAccessStrategy } from './jwt-access.strategy';
import { GameRepository } from 'src/game/game.repository';
import { Game } from 'src/game/entities/game.entity';
import { Friend } from 'src/users/entities/friend.entity';
import { Block } from 'src/users/entities/block.entity';
import { FriendsRepository } from 'src/users/friends.repository';
import { BlocksRepository } from 'src/users/blocks.repository';

@Module({
	imports: [
		TypeOrmModule.forFeature([User, Game, Friend, Block]),
		PassportModule,
		JwtModule.registerAsync({
			inject: [jwtConfig.KEY],
			useFactory: (jwtConfigure: ConfigType<typeof jwtConfig>) =>
				jwtConfigure,
		}),
	],
	controllers: [AuthController],
	providers: [
		AuthService,
		FtAuthService,
		JwtAccessStrategy,
		UsersRepository,
		UsersService,
		GameRepository,
		FriendsRepository,
		BlocksRepository,
	],
})
export class AuthModule {}
