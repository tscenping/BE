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
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([Game, GameInvitation]),
		AuthModule,
		UsersModule,
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
