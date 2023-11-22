import { DataSource, Repository } from 'typeorm';
import { GameInvitation } from './entities/game-invitation.entity';
import { InjectRepository } from '@nestjs/typeorm';

export class GameInvitationRepository extends Repository<GameInvitation> {
	constructor(
		@InjectRepository(GameInvitation) private dataSource: DataSource,
	) {
		super(GameInvitation, dataSource.manager);
	}
}
