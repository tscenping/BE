import { InjectRepository } from '@nestjs/typeorm';
import { DEFAULT_PAGE_SIZE } from 'src/common/constants';
import { DataSource, Repository } from 'typeorm';
import { findAllFriendChannelSocketIdByUserIdResponseDto } from './dto/channel-socket-id-response.dto';
import { FriendUserReturnDto } from './dto/friend-user-return.dto';
import { Friend } from './entities/friend.entity';

export class FriendsRepository extends Repository<Friend> {
	constructor(@InjectRepository(Friend) private dataSource: DataSource) {
		super(Friend, dataSource.manager);
	}

	async findFriend(fromUserId: number, toUserId: number) {
		return await this.findOne({
			where: {
				fromUserId,
				toUserId,
			},
		});
	}

	async findFriendInfos(
		userId: number,
		page: number,
	): Promise<FriendUserReturnDto[]> {
		const friends = await this.dataSource.query(
			`
			SELECT u.id, u.nickname, u.avatar, u.status
			FROM friend f
			JOIN "user" u
			ON u.id = f."toUserId"
			WHERE f."fromUserId" = $1 AND f."deletedAt" IS NULL
			LIMIT $2 OFFSET $3;
			`,
			[userId, DEFAULT_PAGE_SIZE, (page - 1) * DEFAULT_PAGE_SIZE],
		);

		return friends;
	}
	async findAllFriendChannelSocketIdByUserId(
		toUserId: number,
	): Promise<findAllFriendChannelSocketIdByUserIdResponseDto[]> {
		const friendChannelSocketIdList = await this.dataSource.query(
			`
			SELECT u."channelSocketId"
			FROM friend f
			JOIN "user" u
			ON u.id = f."fromUserId"
			WHERE f."toUserId" = $1 AND f."deletedAt" IS NULL AND u."channelSocketId" IS NOT NULL;
			`,
			[toUserId],
		);

		return friendChannelSocketIdList;
	}
}
