import {
	BadRequestException,
	Body,
	Controller,
	Get,
	Logger,
	Param,
	ParseIntPipe,
	Patch,
	Query,
	UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/auth/get-user.decorator';
import { STATUS_MESSAGE_STRING } from 'src/common/constants';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';
import { User } from '../user-repository/entities/user.entity';
import { RanksService } from './ranks.service';
import { UsersService } from './users.service';

@Controller('users')
@ApiTags('users')
export class UsersController {
	constructor(
		private readonly usersService: UsersService,
		private readonly ranksServices: RanksService,
	) {}

	private readonly logger = new Logger(UsersController.name);

	@UseGuards(AuthGuard('access'))
	@Get('/me')
	@ApiOperation({
		summary: '내 정보 조회',
		description: '저장된 모든 내 정보를 가지고 온다.',
	})
	async findMyProfile(@GetUser() user: User) {
		const myProfile = await this.usersService.findMyProfile(user.id);

		return myProfile;
	}

	@UseGuards(AuthGuard('access'))
	@Get('/profile/:nickname')
	@ApiOperation({
		summary: '유저 정보 조회',
		description:
			'랭킹페이지에서 유저 프로필이미지 클릭시 해당 유저의 정보를 가지고 온다.',
	})
	async findUserProfile(
		@GetUser() user: User,
		@Param('nickname') nickname: string,
	) {
		const userProfile = await this.usersService.findUserProfile(
			user.id,
			nickname,
		);

		return userProfile;
	}

	@UseGuards(AuthGuard('access'))
	@Get('/games/:nickname')
	@ApiOperation({
		summary: '게임 정보 조회',
		description: '게임을 했던 상대방의 정보를 반환한다.',
	})
	async findGameHistories(
		@GetUser() user: User,
		@Param('nickname') nickname: string,
		@Query('page', ParseIntPipe, PositiveIntPipe) page: number,
	) {
		const gameHistories = await this.usersService.findGameHistoriesWithPage(
			nickname,
			page,
		);

		this.logger.log('gameHistories: ', gameHistories);

		return gameHistories;
	}

	@Get('/rank')
	@ApiOperation({
		summary: '랭킹 조회',
		description: '레디스로부터 pagination해 랭킹 목록을 제공합니다.',
	})
	async paging() {
		// const rankResponseDto = await this.usersService.findRanksWithPage();	// 레디스 없이 DB에서 랭킹을 조회하는 코드
		let rankResponseDto = await this.ranksServices.findRanksWithPage(); // 레디스로부터 랭킹을 조회하는 코드
		if (rankResponseDto.rankUsers.length === 0) {
			this.logger.log('랭킹이 없습니다. 랭킹을 추가합니다.');
			rankResponseDto = await this.usersService.findRanksWithPage();
			await this.ranksServices.addRanking();
		}

		return rankResponseDto;
	}

	@UseGuards(AuthGuard('access'))
	@Patch('/me/statusMessage')
	@ApiOperation({
		summary: '상태 메세지 변경',
		description: '내 상태 메세지를 변경한다.',
	})
	async updateMyStatusMessage(
		@GetUser() user: User,
		@Body('statusMessage') statusMessage: string | null,
	) {
		// statusMessage 정규식 검사
		if (statusMessage && statusMessage.length > 20) {
			throw new BadRequestException(
				'20자 이하의 statusMessage를 입력해주세요.',
			);
		}
		if (
			statusMessage &&
			statusMessage.match(STATUS_MESSAGE_STRING) === null
		) {
			throw new BadRequestException(
				'한글, 영문, 숫자만 입력 가능합니다.',
			);
		}

		await this.usersService.updateMyStatusMessage(user.id, statusMessage);
	}

	@UseGuards(AuthGuard('access'))
	@Patch('/me/avatar')
	@ApiOperation({
		summary: '아바타 변경',
		description: '내 아바타 이미지를 변경한다.',
	})
	async updateMyAvatar(
		@GetUser() user: User,
		@Body('avatar') avatar: boolean,
	) {
		return await this.usersService.updateMyAvatar(
			user.id,
			user.nickname,
			avatar,
		);
	}
}
