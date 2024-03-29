import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { BlocksRepository } from './blocks.repository';
import { FriendUserResponseDto } from './dto/friend-user-response.dto';
import { FriendsRepository } from './friends.repository';
import { UsersRepository } from '../user-repository/users.repository';

@Injectable()
export class FriendsService {
	private readonly logger = new Logger(FriendsService.name);

	constructor(
		private readonly friendsRepository: FriendsRepository,
		private readonly usersRepository: UsersRepository,
		private readonly blocksRepository: BlocksRepository,
	) {}

	/**
	 * 친구 추가
	 * @param fromUserId 친구요청을 보낸 유저의 id
	 * @param toUserId 친구요청을 받은 유저의 id
	 * @returns
	 */
	async createFriend(fromUserId: number, toUserId: number) {
		// 본인에게 친구요청을 보내는지 확인
		this.checkSelfFriendship(fromUserId, toUserId);

		// 친구요청을 받은 유저가 존재하는지 확인
		await this.validateUserExists(toUserId);

		// 이미 친구인지 확인
		await this.checkAlreadyFriends(fromUserId, toUserId);

		// block 상태라면 block 해제
		await this.blocksRepository.softDelete({
			fromUserId,
			toUserId,
		});

		// 친구 추가
		const friend = this.friendsRepository.create({
			fromUserId,
			toUserId,
		});
		// this.logger.log('friend: ', friend);
		await this.friendsRepository.save(friend);
	}

	/**
	 * 친구 삭제
	 * @param fromUserId 친구 삭제 요청을 보낸 유저의 id
	 * @param toUserId 친구 삭제 요청을 받은 유저의 id
	 */
	async deleteFriend(fromUserId: number, toUserId: number) {
		// 본인에게 친구 삭제 요청을 보내는지 확인
		this.checkSelfFriendship(fromUserId, toUserId);

		// 친구 삭제 요청을 받은 유저가 존재하는지 확인
		await this.validateUserExists(toUserId);

		// 친구인지 확인
		const friend = await this.friendsRepository.findFriend(
			fromUserId,
			toUserId,
		);
		if (!friend) {
			throw new BadRequestException(`Not friend with ${toUserId}`);
		}

		// 친구 삭제
		const result = await this.friendsRepository.softDelete(friend.id);
		if (result.affected !== 1) {
			throw new BadRequestException(
				`Failed to delete friend with ${toUserId}`,
			);
		}
	}

	/**
	 * 친구 목록 조회
	 * @param userId 친구 목록을 조회할 유저의 id
	 * @param page 페이지 번호
	 * @returns 친구 목록
	 */
	async findFriendsWithPage(
		userId: number,
		page: number,
	): Promise<FriendUserResponseDto> {
		// 친구 목록 조회
		const friends = await this.friendsRepository.findFriendInfos(
			userId,
			page,
		);

		// 페이지 정보 조회
		const totalItemCount = await this.friendsRepository.count({
			where: {
				fromUserId: userId,
			},
		});

		// this.logger.log('friends: ', friends);
		this.logger.log('totalItemCount: ', totalItemCount);

		return { friends, totalItemCount };
	}

	/**
	 * 유저가 존재하는지 확인
	 */
	async validateUserExists(userId: number) {
		const user = await this.usersRepository.findOne({
			where: {
				id: userId,
			},
		});

		if (!user) {
			throw new BadRequestException(
				`User with id ${userId} doesn't exist`,
			);
		}
	}

	/**
	 * 본인에게 친구/친구삭제 요청을 보내는지 확인
	 */
	private checkSelfFriendship(fromUserId: number, toUserId: number) {
		if (fromUserId === toUserId) {
			throw new BadRequestException(`Can't be friend with yourself`);
		}
	}

	/**
	 * 이미 친구인지 확인
	 */
	private async checkAlreadyFriends(fromUserId: number, toUserId: number) {
		const isExistFriend = await this.friendsRepository.findFriend(
			fromUserId,
			toUserId,
		);
		if (isExistFriend) {
			throw new BadRequestException(`Already friends`);
		}
	}
}
