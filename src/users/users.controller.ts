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
import { GetUser } from 'src/auth/get-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';
import { BlocksService } from './blocks.service';
import { User } from './entities/user.entity';
import { FriendsService } from './friends.service';
import { UsersService } from './users.service';
import { STATUS_MESSAGE_STRING } from 'src/common/constants';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
	constructor(
		private readonly usersService: UsersService,
		private readonly friendsService: FriendsService,

		private readonly blocksService: BlocksService,
	) {}

	private readonly logger = new Logger(UsersController.name);

	@Post('/friends')
	async createFriend(
		@GetUser() user: User,
		@Body('friendId', ParseIntPipe, PositiveIntPipe) toUserId: number,
	) {
		await this.friendsService.createFriend(user.id, toUserId);
		// TODO: 친구요청을 받은 유저에게 알림 보내기
	}

	@Delete('/friends')
	async deleteFriend(
		@GetUser() user: User,
		@Body('friendId', ParseIntPipe, PositiveIntPipe) toUserId: number,
	) {
		await this.friendsService.deleteFriend(user.id, toUserId);
	}

	@Get('/friends')
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

	@Get('/me')
	async findMyProfile(@GetUser() user: User) {
		const myProfile = await this.usersService.findMyProfile(user.id);

		return myProfile;
	}

	@Get('/profile/:nickname')
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

	@Get('/games/:nickname')
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

	@Post('/blocks')
	async createBlock(
		@GetUser() user: User,
		@Body('blockId') toUserId: number,
	) {
		await this.blocksService.applyBlock(user.id, toUserId);
	}

	@Delete('/blocks')
	async deleteBlock(
		@GetUser() user: User,
		@Body('blockId') toUserId: number,
	) {
		await this.blocksService.cancelBlock(user.id, toUserId);
	}

	@Get('/blocks')
	async findBlockListWithPage(
		@GetUser() user: User,
		@Query('page', ParseIntPipe, PositiveIntPipe) page: number,
	) {
		const BlockUserResponseDto =
			await this.blocksService.findBlockUserListWithPage(user.id, page);

		return BlockUserResponseDto;
	}

	@Patch('/me/statusMessage')
	async updateMyStatusMessage(
		@GetUser() user: User,
		@Body('statusMessage') statusMessage: string,
	) {
		// statusMessage 정규식 검사
		if (statusMessage.length > 20) {
			throw new BadRequestException(
				'20자 이하의 statusMessage를 입력해주세요.',
			);
		}
		if (statusMessage.match(STATUS_MESSAGE_STRING) === null) {
			throw new BadRequestException(
				'한글, 영문, 숫자만 입력 가능합니다.',
			);
		}

		await this.usersService.updateMyStatusMessage(user.id, statusMessage);
	}
}
