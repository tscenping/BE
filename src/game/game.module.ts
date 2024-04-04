import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { GameController } from './game.controller';
import { GameRepository } from './game.repository';
import { GameService } from './game.service';
import { GameInvitationRepository } from './game-invitation.repository';
import { GameInvitation } from './entities/game-invitation.entity';
import { GameGateway } from './game.gateway';
import { ChannelsModule } from '../channels/channels.module';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from '../config/jwt.config';
import { ConfigType } from '@nestjs/config';
import { UserRepositoryModule } from '../user-repository/user-repository.module';
import { FriendsModule } from '../friends/friends.module';

@Module({
	imports: [
		JwtModule.registerAsync({
			inject: [jwtConfig.KEY],
			useFactory: (jwtConfigure: ConfigType<typeof jwtConfig>) =>
				jwtConfigure,
		}),
		TypeOrmModule.forFeature([Game, GameInvitation]),
		UserRepositoryModule,
		FriendsModule,
		ChannelsModule,
	],
	controllers: [GameController],
	providers: [
		GameGateway,
		GameService,
		GameRepository,
		GameInvitationRepository,
	],
	exports: [GameRepository, GameInvitationRepository],
})
export class GameModule {}
