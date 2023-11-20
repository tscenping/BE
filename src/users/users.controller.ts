import {
	Body,
	Controller,
	Delete,
	Get,
	ParseIntPipe,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { GetUser } from 'src/auth/get-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';
import { User } from './entities/user.entity';
import { FriendsService } from './friends.service';
import { UsersService } from './users.service';
import { BlocksService } from './blocks.service';
import { isString } from '@nestjs/common/utils/shared.utils';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
	constructor(
		private readonly usersService: UsersService,
		private readonly friendsService: FriendsService,
		private readonly blocksService: BlocksService,
	) {}

	@Post('/friends')
	async createFriend(
		@GetUser() user: User,
		@Body('friendId', ParseIntPipe, PositiveIntPipe) toUserId: string,
	) {
		await this.friendsService.createFriend(user.id, toUserId);
		// TODO: 친구요청을 받은 유저에게 알림 보내기
	}

	@Delete('/friends')
	async deleteFriend(
		@GetUser() user: User,
		@Body('friendId', ParseIntPipe, PositiveIntPipe) toUserId: string,
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
		const profile = await this.usersService.findMyProfile(user.id);

		return profile;
	}

	@Post('/blocks')
	async createBlock(
		@GetUser() user: User,
		@Body('blockId') toUserId: string,
	) {
		await this.blocksService.applyBlock(user.id, toUserId);
	}

	@Delete('/blocks')
	async deleteBlock(
		@GetUser() user: User,
		@Body('blockId') toUserId: string,
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
}
