import { DataSource, Repository } from 'typeorm';
import { GameInvitation } from './entities/game-invitation.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateGameInvitationParamDto } from './dto/create-invitation-param.dto';
import { DBUpdateFailureException } from '../common/exception/custom-exception';

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

	async deleteGameInvitaiton(invitationId: number) {
		const result = await this.softDelete(invitationId);
		if (result.affected !== 1)
			throw DBUpdateFailureException('delete user from channel failed');
	}
}
