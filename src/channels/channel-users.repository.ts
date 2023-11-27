import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ChannelUser } from './entities/channel-user.entity';
import { Logger } from '@nestjs/common';
import { ChannelUserInfoReturnDto } from './dto/channel-user-info-return.dto';
import {
	DBQueryErrorException,
	DBUpdateFailureException,
} from '../common/exception/custom-exception';
import { ChannelUserType } from '../common/enum';

export class ChannelUsersRepository extends Repository<ChannelUser> {
	constructor(@InjectRepository(ChannelUser) private dataSource: DataSource) {
		super(ChannelUser, dataSource.manager);
	}

	private readonly logger = new Logger(ChannelUsersRepository.name);

	async createChannelUser(channelId: number, userId: number) {
		const newChannelUser = this.create({
			channelId: channelId,
			userId: userId,
		});
		const res = await this.save(newChannelUser);

		if (!res) throw DBUpdateFailureException('join channel failed');
	}

	async findChannelUserInfoList(
		userId: number,
		channelId: number,
	): Promise<ChannelUserInfoReturnDto[]> {
		// const channelUserInfoList = await this.dataSource
		// 	.createQueryBuilder()
		// 	.select('cu.channelUserType', 'channelUserType')
		// 	.select('cu.id', 'channelUserId')
		// 	.addSelect('u.id', 'userId')
		// 	.addSelect('u.nickname', 'nickname')
		// 	.addSelect('u.avatar', 'avatar')
		// 	.addSelect(
		// 		`(SELECT 1 FROM friend f WHERE f."fromUserId" = :userId AND f."toUserId" = u.id AND f."deletedAt" IS NULL)`,
		// 		'isFriend',
		// 	)
		// 	.addSelect(
		// 		`(SELECT 1 FROM block b WHERE b."fromUserId" = :userId AND b."toUserId" = u.id AND b."deletedAt" IS NULL)`,
		// 		'isBlocked',
		// 	)
		// 	.from('channel_user', 'cu')
		// 	.innerJoin('user', 'u', 'u.id = cu.userId')
		// 	.where('cu.channelId = :channelId')
		// 	.andWhere('cu.isBanned = FALSE')
		// 	.andWhere('cu.deletedAt IS NULL')
		// 	.setParameters({ userId, channelId })
		// 	.getRawMany();

		const channelUserInfoList = await this.dataSource.query(
			`SELECT cu."channelUserType"         AS "channelUserType",
			cu.id                                AS "channelUserId",
			u.id                                 AS "userId",
			u.nickname                           AS nickname,
			u.avatar                             AS avatar,
			EXISTS (SELECT 1
					FROM friend f
					WHERE f."fromUserId" = $1
						AND f."toUserId" = u.id
						AND f."deletedAt" IS NULL) AS "isFriend",
			EXISTS (SELECT 1
					FROM block b
					WHERE b."fromUserId" = $1
					  AND b."toUserId" = u.id
					  AND b."deletedAt" IS NULL) AS "isBlocked"
			FROM channel_user cu
				INNER JOIN "user" u ON u.id = cu."userId"
			WHERE cu."channelId" = $2
				AND cu."isBanned" = FALSE
				AND cu."deletedAt" IS NULL;`,
			[userId, channelId],
		);

		// this.logger.log(
		// 	'channelUserInfoList: ' + JSON.stringify(channelUserInfoList),
		// );
		return channelUserInfoList;
	}

	async updateChannelUserType(channelUserId: number) {
		const result = await this.dataSource.query(
			`
			UPDATE channel_user
			SET
  			  channelUserType = CASE
    			WHEN "channelUserType" = 'MEMBER' THEN 'ADMIN' //MEMBER -> ChannelUserType.MEMBER ?
    			WHEN "channelUserType" = 'ADMIN' THEN 'MEMBER'
  			  END
			WHERE id = $1
				AND "deletedAt" IS NULL;
			`,
			[channelUserId],
		);

		if (result.affected !== 1)
			throw DBQueryErrorException('update channelUserType failed');

		// 임명 / 해제 분기 처리
		// let result;
		// if (receiverChannelUser.channelUserType === ChannelUserType.MEMBER) {
		// 	result = await this.channelUsersRepository.update(
		// 		receiverChannelUserId,
		// 		{
		// 			id: receiverChannelUserId,
		// 			channelUserType: ChannelUserType.ADMIN,
		// 		},
		// 	);
		// } else if (
		// 	receiverChannelUser.channelUserType === ChannelUserType.ADMIN
		// ) {
		// 	result = await this.channelUsersRepository.update(
		// 		receiverChannelUserId,
		// 		{
		// 			id: receiverChannelUserId,
		// 			channelUserType: ChannelUserType.MEMBER,
		// 		},
		// 	);
		// }
		// if (!result || result.affected !== 1)
		// 	throw DBUpdateFailureException('update channelUserType failed');
	}

	async softDeleteUserFromChannel(channelUserId: number) {
		const result = await this.softDelete(channelUserId);
		if (result.affected !== 1)
			throw DBUpdateFailureException('delete user from channel failed');
	}
}
