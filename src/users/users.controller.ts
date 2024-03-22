import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	Logger,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/auth/get-user.decorator';
import { STATUS_MESSAGE_STRING } from 'src/common/constants';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';
import { BlocksService } from './blocks.service';
import { User } from './entities/user.entity';
import { FriendsService } from './friends.service';
import { RanksService } from './ranks.service';
import { UsersService } from './users.service';

@Controller('users')
@ApiTags('users')
export class UsersController {
	constructor(
		private readonly usersService: UsersService,
		private readonly friendsService: FriendsService,
		private readonly blocksService: BlocksService,
		private readonly ranksServices: RanksService,
	) {}

	private readonly logger = new Logger(UsersController.name);

	@UseGuards(AuthGuard('access'))
	@Post('/friends')
	@ApiOperation({
		summary: '친구추가',
		description:
			'친구추가 요청을 보낸다. 존재하지 않는 유저나 본인에게 요청을 보낼 수 없다.',
	})
	async createFriend(
		@GetUser() user: User,
		@Body('friendId', ParseIntPipe, PositiveIntPipe) toUserId: number,
	) {
		await this.friendsService.createFriend(user.id, toUserId);
		// TODO: 친구요청을 받은 유저에게 알림 보내기
	}

	@UseGuards(AuthGuard('access'))
	@Delete('/friends')
	@ApiOperation({
		summary: '친구삭제',
		description:
			'친구삭제 요청을 보낸다. 존재하지 않는 유저나 본인에게 삭제요청을 보낼 수 없다.',
	})
	async deleteFriend(
		@GetUser() user: User,
		@Body('friendId', ParseIntPipe, PositiveIntPipe) toUserId: number,
	) {
		await this.friendsService.deleteFriend(user.id, toUserId);
	}

	@UseGuards(AuthGuard('access'))
	@Get('/friends')
	@ApiOperation({
		summary: '친구목록 조회',
		description: '친구목록을 반환한다.',
	})
	async findFriendsWithPage(
		@GetUser() user: User,
		@Query('page', ParseIntPipe, PositiveIntPipe) page: number,
	) {
		const friendResponseDto = await this.friendsService.findFriendsWithPage(
			user.id,
			page,
		);

		return friendResponseDto;
	}

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

	@UseGuards(AuthGuard('access'))
	@Post('/blocks')
	@ApiOperation({
		summary: '유저 차단',
		description:
			'상대방 유저를 차단한다. 유저 자신인지, 가입 되어있는 유저인지, 차단되어있는 유저인지 체크한다.',
	})
	@ApiResponse({ status: 418, description: 'DB에 저장 실패' })
	async createBlock(
		@GetUser() user: User,
		@Body('blockId', ParseIntPipe, PositiveIntPipe) toUserId: number,
	) {
		await this.blocksService.applyBlock(user.id, toUserId);
	}

	@UseGuards(AuthGuard('access'))
	@Delete('/blocks')
	@ApiOperation({
		summary: '유저 차단 해제',
		description: '상대방 유저의 차단을 해제합니다. ',
	})
	@ApiResponse({ status: 418, description: 'DB에 저장 실패' })
	async deleteBlock(
		@GetUser() user: User,
		@Body('blockId', ParseIntPipe, PositiveIntPipe) toUserId: number,
	) {
		await this.blocksService.cancelBlock(user.id, toUserId);
	}

	@UseGuards(AuthGuard('access'))
	@Get('/blocks')
	@ApiOperation({
		summary: '유저 차단목록 조회',
		description: 'pagination된 차단 유저 목록을 제공합니다.',
	})
	@ApiResponse({ status: 400, description: '쿼리에러' })
	async findBlockListWithPage(
		@GetUser() user: User,
		@Query('page', ParseIntPipe, PositiveIntPipe) page: number,
	) {
		const BlockUserResponseDto =
			await this.blocksService.findBlockUserListWithPage(user.id, page);

		return BlockUserResponseDto;
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
		@Body('avatar') avatar: string,
	) {
		await this.usersService.updateMyAvatar(user.id, avatar);
	}
}
