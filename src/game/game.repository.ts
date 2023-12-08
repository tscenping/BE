import { InjectRepository } from '@nestjs/typeorm';
import { GAME_DEFAULT_PAGE_SIZE } from 'src/common/constants';
import { DataSource, Repository } from 'typeorm';
import { Game } from './entities/game.entity';
import { CreateGameInvitationParamDto } from './dto/create-invitation-param.dto';
import { DBUpdateFailureException } from '../common/exception/custom-exception';
import { GameInvitationRepository } from './game-invitation.repository';
export class GameRepository extends Repository<Game> {
	constructor(
		@InjectRepository(Game) private dataSource: DataSource,
		private readonly gameInvitationRepository: GameInvitationRepository,
	) {
		super(Game, dataSource.manager);
	}

	async findGameHistoriesWithPage(userId: number, page: number) {
		const gameHistories = await this.dataSource.query(
			`
            SELECT u.nickname             AS rivalName,
            u.avatar               AS rivalAvatar,
            CASE
                WHEN g."winnerId" = $1 THEN g."winnerScore"
                ELSE g."loserScore"
                END                AS myScore,
            CASE
                WHEN g."winnerId" = $1 THEN g."loserScore"
                ELSE g."winnerScore"
                END                AS rivalScore,
            g."winnerId" = $1 AS isWinner
            FROM game g
            JOIN "user" u
            ON (g."winnerId" = u.id AND g."loserId" = $1)
                OR (g."loserId" = u.id AND g."winnerId" = $1)
            AND (g."winnerId" = $1 OR g."loserId" = $1)
            WHERE g."deletedAt" IS NULL
            ORDER BY g."updatedAt" DESC
            LIMIT $2 OFFSET $3;
            `,
			[
				userId,
				GAME_DEFAULT_PAGE_SIZE,
				(page - 1) * GAME_DEFAULT_PAGE_SIZE,
			],
		);
		return gameHistories;
	}

	async createGameInvitation(
		gameInvitationDto: CreateGameInvitationParamDto,
	) {
		const gameInvitation = this.gameInvitationRepository.create({
			invitingUserId: gameInvitationDto.invitingUser.id,
			invitedUserId: gameInvitationDto.invitedUserId,
			gameType: gameInvitationDto.gameType,
		});
		const result = await this.gameInvitationRepository.save(gameInvitation);
		if (!result)
			throw DBUpdateFailureException('create game invitation failed');
		return result;
	}
}
