import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppService } from 'src/app.service';
import { Game } from 'src/game/entities/game.entity';
import { GameRepository } from 'src/game/game.repository';
import { BlocksRepository } from 'src/users/blocks.repository';
import { Block } from 'src/users/entities/block.entity';
import { Friend } from 'src/users/entities/friend.entity';
import { FriendsRepository } from 'src/users/friends.repository';
import { ChannelUsersRepository } from '../channels/channel-users.repository';
import { ChannelsGateway } from '../channels/channels.gateway';
import { ChannelUser } from '../channels/entities/channel-user.entity';
import jwtConfig from '../config/jwt.config';
import { GameInvitation } from '../game/entities/game-invitation.entity';
import { GameInvitationRepository } from '../game/game-invitation.repository';
import { User } from '../users/entities/user.entity';
import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FtAuthService } from './ft-auth.service';
import { JwtAccessStrategy } from './jwt-access.strategy';
import { JwtRefreshStrategy } from './jwt-refresh.strategy';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			User,
			Game,
			GameInvitation,
			Friend,
			Block,
			ChannelUser,
		]),
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
		UsersRepository,
		UsersService,
		GameRepository,
		GameInvitationRepository,
		FriendsRepository,
		BlocksRepository,
		ChannelUsersRepository,
		FriendsRepository,
		AppService,
		JwtAccessStrategy,
		JwtRefreshStrategy,
	],
	exports: [JwtAccessStrategy, JwtRefreshStrategy],
})
export class AuthModule {}
