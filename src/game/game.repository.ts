import { InjectRepository } from '@nestjs/typeorm';
import { DEFAULT_PAGE_SIZE } from 'src/common/constants';
import { DataSource, Repository } from 'typeorm';
import { Game } from './entities/game.entity';
export class GameRepository extends Repository<Game> {
	constructor(@InjectRepository(Game) private dataSource: DataSource) {
		super(Game, dataSource.manager);
	}

	async findGameHistoriesWithPage(userId: string, page: number) {
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
            ORDER BY g."updatedAt" DESC
            LIMIT $2 OFFSET $3;
            `,
			[userId, DEFAULT_PAGE_SIZE, (page - 1) * DEFAULT_PAGE_SIZE],
		);
		return gameHistories;
	}
}
