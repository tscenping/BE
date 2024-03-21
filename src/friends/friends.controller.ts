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
import { AuthGuard } from '@nestjs/passport';
import { FriendsService } from './friends.service';
import { BlocksService } from './blocks.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../user-repository/entities/user.entity';
import { PositiveIntPipe } from '../common/pipes/positiveInt.pipe';

@Controller('users')
@UseGuards(AuthGuard('access'))
export class FriendsController {
	constructor(
		private readonly friendsService: FriendsService,
		private readonly blocksService: BlocksService,
	) {}

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
}
