import { InjectRepository } from '@nestjs/typeorm';
import { GAME_DEFAULT_PAGE_SIZE } from 'src/common/constants';
import { DataSource, Repository } from 'typeorm';
import { Game } from './entities/game.entity';
import { DBUpdateFailureException } from '../common/exception/custom-exception';
import { CreateInitialGameParamDto } from './dto/create-initial-game-param.dto';
export class GameRepository extends Repository<Game> {
	constructor(@InjectRepository(Game) private dataSource: DataSource) {
		super(Game, dataSource.manager);
	}

	async createGame(gameParamDto: CreateInitialGameParamDto) {
		const game = this.create(gameParamDto);
		// console.log(JSON.stringify(game)); // {"winnerId":8,"loserId":7,"gameType":"NORMAL_INVITE","winnerScore":0,"loserScore":0,"gameStatus":"WAITING","ballSpeed":1,"racketSize":1}
		// console.log(game.id); // undefined

		const result = await this.save(game);
		// console.log(JSON.stringify(result)); // {"winnerId":8,"loserId":7,"gameType":"NORMAL_INVITE","winnerScore":0,"loserScore":0,"gameStatus":"WAITING","ballSpeed":1,"racketSize":1,"deletedAt":null,"id":2,"createdAt":"2023-12-14T04:38:55.989Z","updatedAt":"2023-12-14T04:38:55.989Z"}
		// console.log(result.id); // 2

		if (!result)
			throw DBUpdateFailureException('create game invitation failed');

		return result;
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
}
