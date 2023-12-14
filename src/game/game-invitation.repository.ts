import { DataSource, Repository } from 'typeorm';
import { GameInvitation } from './entities/game-invitation.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateGameInvitationParamDto } from './dto/create-invitation-param.dto';
import { DBUpdateFailureException } from '../common/exception/custom-exception';
import { DeleteGameInvitationsParamDto } from './dto/delete-invitations-param.dto';

export class GameInvitationRepository extends Repository<GameInvitation> {
	constructor(
		@InjectRepository(GameInvitation) private dataSource: DataSource,
	) {
		super(GameInvitation, dataSource.manager);
	}

	async createGameInvitation(
		gameInvitationDto: CreateGameInvitationParamDto,
	) {
		const gameInvitation = this.create({
			invitingUserId: gameInvitationDto.invitingUser.id,
			invitedUserId: gameInvitationDto.invitedUserId,
			gameType: gameInvitationDto.gameType,
		});

		const result = await this.save(gameInvitation);

		if (!result)
			throw DBUpdateFailureException('create game invitation failed');

		return result;
	}

	async deleteGameInvitaitons(
		deleteInvitationsDto: DeleteGameInvitationsParamDto,
	) {
		const invitingUserId = deleteInvitationsDto.invitingUserId;
		const invitedUserId = deleteInvitationsDto.invitedUserId;

		const result = await this.dataSource.query(
			`
			UPDATE game_invitation
			SET "deletedAt" = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
			WHERE "invitingUserId" = $1
			AND "invitedUserId" = $2
			AND "deletedAt" IS NULL
			`,
			[invitingUserId, invitedUserId],
		);
		// 	AND now() - "createdAt" >= INTERVAL '10 seconds'

		if (result[1] === 0)
			throw DBUpdateFailureException(
				'soft delete game invitations failed',
			);
	}
}
