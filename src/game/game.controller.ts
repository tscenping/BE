import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { GameService } from './game.service';
import { CreateInvitationRequestDto } from './dto/create-invitation-request.dto';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { CreateGameInvitationParamDto } from './dto/create-invitation-param.dto';

@Controller('game')
@ApiTags('game')
@UseGuards(JwtAuthGuard)
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
