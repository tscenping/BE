import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { GameService } from './game.service';
import { GameInvitationRequestDto } from './dto/game-invitation-request.dto';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('game')
@UseGuards(JwtAuthGuard)
export class GameController {
	constructor(private readonly gameService: GameService) {}

	@Post('/invite')
	async createInvitation(
		@GetUser() user: User,
		@Body() gameInvitationRequestDto: GameInvitationRequestDto,
	) {
		const invitedUser = gameInvitationRequestDto.invitedUserId;
		const gameType = gameInvitationRequestDto.gameType;
		await this.gameService.createInvitation(user.id, invitedUser, gameType);
	}
}
