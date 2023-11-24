import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ChannelUser } from './entities/channel-user.entity';
import { Logger } from '@nestjs/common';
import { ChannelUserInfoReturnDto } from './dto/channel-user-info-return.dto';

export class ChannelUsersRepository extends Repository<ChannelUser> {
	constructor(@InjectRepository(ChannelUser) private dataSource: DataSource) {
		super(ChannelUser, dataSource.manager);
	}

	private readonly logger = new Logger(ChannelUsersRepository.name);

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
}
