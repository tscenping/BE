import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateGameInvitationParamDto } from './dto/create-invitation-param.dto';
import { CreateInvitationRequestDto } from './dto/create-invitation-request.dto';
import { GameService } from './game.service';

@Controller('game')
@ApiTags('game')
@UseGuards(AuthGuard('access'))
export class GameController {
	constructor(private readonly gameService: GameService) {}

	@Post('/invite')
	async createInvitation(
		@GetUser() user: User,
		@Body() invitationRequestDto: CreateInvitationRequestDto,
	) {
		const invitationParamDto: CreateGameInvitationParamDto = {
			invitingUser: user,
			invitedUserId: invitationRequestDto.invitedUserId,
			gameType: invitationRequestDto.gameType,
		};

		await this.gameService.createInvitation(invitationParamDto);
	}

	// @Post('/accept')
}
