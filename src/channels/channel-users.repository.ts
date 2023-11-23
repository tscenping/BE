import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ChannelUser } from './entities/channel-user.entity';
import { Logger } from '@nestjs/common';

export class ChannelUsersRepository extends Repository<ChannelUser> {
	constructor(@InjectRepository(ChannelUser) private dataSource: DataSource) {
		super(ChannelUser, dataSource.manager);
	}

	private readonly logger = new Logger(ChannelUsersRepository.name);

	async findChannelUserInfoList(userId: number, channelId: number) {
		// const channelUserInfoList = await this.dataSource
		// 	.createQueryBuilder()
		// 	.select([
		// 		'cu.channel_user_type AS channelUserType',
		// 		'u.id AS id',
		// 		'u.nickname AS nickname',
		// 		'u.avatar AS avatar',
		// 	])
		// 	.innerJoin('users', 'u', 'u.id = cu.user_id')
		// 	.where('cu.channel_id = :channelId', { channelId })
		// 	.getRawMany();

		const channelUserInfoList = await this.dataSource
			.createQueryBuilder()
			.innerJoin('user', 'u', 'u.id = cu.userId')
			.select([
				'cu.channelUserType',
				'u.id AS userId',
				'u.nickname AS nickname',
				'u.avatar AS avatar',
			])
			.addSelect((subQuery) => {
				return (
					subQuery
						.select('1')
						.from('friend', 'f')
						.where('f.fromUserId = :userId')
						.andWhere('f.toUserId = u.id')
						// .andWhere('f.deletedAt IS NULL')
						.limit(1)
				);
			}, 'isFriend')
			.addSelect((subQuery) => {
				return (
					subQuery
						.select('1')
						.from('block', 'b')
						.where('b.fromUserId = :userId')
						.andWhere('b.toUserId = u.id')
						// .andWhere('b.deletedAt IS NULL')
						.limit(1)
				);
			}, 'isBlocked')
			.from('channel_user', 'cu')
			.where('cu.channelId = :channelId')
			.andWhere('cu.isBanned = FALSE')
			.andWhere('cu.deletedAt IS NULL')
			.setParameter('userId', userId)
			.setParameter('channelId', channelId)
			.getRawMany();

		this.logger.log(channelUserInfoList);
		return channelUserInfoList;
		// return await this.dataSource.query(
		// 	`SELECT cu."channelUserType"         AS channelUserType,
		// 	u.id                                 AS userId,
		// 	u.nickname                           AS nickname,
		// 	u.avatar                             AS avatar,
		// 	EXISTS (SELECT 1
		// 			FROM friend f
		// 			WHERE f."fromUserId" = $1
		// 				AND f."toUserId" = u.id
		// 				AND f."deletedAt" IS NULL) AS isFriend,
		// 	EXISTS (SELECT 1
		// 			FROM block b
		// 			WHERE b."fromUserId" = $1
		// 			  AND b."toUserId" = u.id
		// 			  AND b."deletedAt" IS NULL) AS isBlocked
		// 	FROM channel_user cu
		// 		INNER JOIN "user" u ON u.id = cu."userId"
		// 	WHERE cu."channelId" = $2
		// 		AND cu."isBanned" = FALSE
		// 		AND cu."deletedAt" IS NULL;`,
		// 	[userId, channelId],
		// );
	}
}
