import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { GameController } from './game.controller';
import { GameRepository } from './game.repository';
import { GameService } from './game.service';
import { UsersRepository } from '../users/users.repository';
import { User } from '../users/entities/user.entity';
import { GameInvitationRepository } from './game-invitation.repository';
import { GameInvitation } from './entities/game-invitation.entity';

@Module({
	imports: [TypeOrmModule.forFeature([Game, GameInvitation, User])],
	controllers: [GameController],
	providers: [
		GameRepository,
		GameService,
		GameInvitationRepository,
		UsersRepository,
	],
})
export class GameModule {}
