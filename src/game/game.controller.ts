import {
	Body,
	Controller,
	Delete,
	Param,
	ParseIntPipe,
	Post,
	UseGuards,
} from '@nestjs/common';
import { GameService } from './game.service';
import { CreateGameInvitationRequestDto } from './dto/create-invitation-request.dto';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { ApiTags } from '@nestjs/swagger';
import { CreateGameInvitationParamDto } from './dto/create-invitation-param.dto';
import { PositiveIntPipe } from '../common/pipes/positiveInt.pipe';
import { AuthGuard } from '@nestjs/passport';
import { DeleteGameInvitationParamDto } from './dto/delete-invitation-param.dto';
import { acceptGameParamDto } from './dto/accept-game-param.dto';

@Controller('game')
@ApiTags('game')
@UseGuards(AuthGuard('access'))
export class GameController {
	constructor(private readonly gameService: GameService) {}

	@Post('/invite')
	async createInvitation(
		@GetUser() user: User,
		@Body() invitationRequestDto: CreateGameInvitationRequestDto,
	) {
		const invitationParamDto: CreateGameInvitationParamDto = {
			invitingUser: user,
			invitedUserId: invitationRequestDto.invitedUserId,
			gameType: invitationRequestDto.gameType,
		};

		await this.gameService.createInvitation(invitationParamDto);
	}

	/**
	 * 초대 수락
	 * @param user
	 * @param invitationId 초대 테이블의 id
	 * (초대시 프론트가 이벤트를 수신하며 받은 data 입니다)
	 */
	@Post('/accept')
	async createGame(
		@GetUser() user: User,
		@Body('gameInvitationId', ParseIntPipe, PositiveIntPipe)
		invitationId: number,
	) {
		const createGameParamDto: acceptGameParamDto = {
			invitedUser: user,
			invitationId: invitationId,
		};
		await this.gameService.createGame(createGameParamDto);
	}

	@Delete('/invite/:gameInvitationId')
	async deleteInvitation(
		@GetUser() user: User,
		@Param('gameInvitationId', ParseIntPipe, PositiveIntPipe)
		invitationId: number,
	) {
		const deleteInvitationParamDto: DeleteGameInvitationParamDto = {
			cancelingUserId: user.id,
			invitationId: invitationId,
		};
		await this.gameService.deleteInvitationByInvitingUserId(
			deleteInvitationParamDto,
		);
	}

	@Delete('/refuse/:gameInvitationId')
	async refuseInvitation(
		@GetUser() user: User,
		@Param('gameInvitationId', ParseIntPipe, PositiveIntPipe)
		invitationId: number,
	) {
		const deleteInvitationParamDto: DeleteGameInvitationParamDto = {
			cancelingUserId: user.id,
			invitationId: invitationId,
		};
		await this.gameService.deleteInvitationByInvitedUserId(
			deleteInvitationParamDto,
		);
	}
}
