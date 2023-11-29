import { InjectRepository } from '@nestjs/typeorm';
import { DEFAULT_PAGE_SIZE } from 'src/common/constants';
import { DataSource, Repository } from 'typeorm';
import { DBUpdateFailureException } from '../common/exception/custom-exception';
import { ChannelUser } from './entities/channel-user.entity';
import { Channel } from './entities/channel.entity';

export class ChannelsRepository extends Repository<Channel> {
	constructor(@InjectRepository(Channel) private dataSource: DataSource) {
		super(Channel, dataSource.manager);
	}

	async findDmChannelUser(
		userId: number,
		targetUserId: number,
	): Promise<ChannelUser> {
		const [dmChannelUser] = await this.dataSource.query(
			`
			SELECT cu.*
			FROM channel_user cu
			WHERE cu."channelId" IN
				(SELECT c.id
				FROM channel_user cu2
						JOIN channel c
							ON cu2."channelId" = c.id
				WHERE cu2."userId" = $1
					AND c."channelType" = 'DM'
					AND c."deletedAt" IS NULL)
			AND cu."userId" = $2
			AND cu."deletedAt" IS NULL;
			`,
			[userId, targetUserId],
		);

		console.log(dmChannelUser);

		return dmChannelUser;
	}

	async findAllChannels(page: number) {
		const channels = await this.dataSource.query(
			`
			SELECT "channelId", "name", "channelType", count("userId") as "userCount"
			FROM Channel c JOIN channel_user cu
			ON c.id = cu."channelId"
			WHERE c."deletedAt" IS NULL 
			AND c."channelType" != 'PRIVATE' 
			AND c."channelType" != 'DM'
			GROUP BY "channelId", "name", "channelType"
			LIMIT $1 OFFSET $2;
			`,
			[DEFAULT_PAGE_SIZE, (page - 1) * DEFAULT_PAGE_SIZE],
		);

		return channels;
	}

	async findMyChannels(userId: number, page: number) {
		const channels = await this.dataSource.query(
			`
			SELECT "channelId", "name", "channelType", count("userId") as "userCount"
			FROM Channel c JOIN channel_user cu
			ON c.id = cu."channelId"
			WHERE cu."userId" = $1
			AND c."deletedAt" IS NULL
			GROUP BY "channelId", "name", "channelType"
			LIMIT $2 OFFSET $3;
			`,
			[userId, DEFAULT_PAGE_SIZE, (page - 1) * DEFAULT_PAGE_SIZE],
		);

		return channels;
	}

	async findDmChannels(userId: number, page: number) {
		const channels = await this.dataSource.query(
			`
			SELECT cu."channelId", cu."userId" as "PartnerName", u."status"
			FROM "user" u
			JOIN channel_user cu ON u."id" = cu."userId"
			JOIN channel c ON cu."channelId" = c.id
			WHERE c."channelType" = 'DM' 
			AND u.id NOT IN ($1)
			AND c."deletedAt" IS NULL
			LIMIT $2 OFFSET $3;
			`,
			[userId, DEFAULT_PAGE_SIZE, (page - 1) * DEFAULT_PAGE_SIZE],
		);

		return channels;
	}

	async softDeleteChannel(channelId: number) {
		const result = await this.softDelete(channelId);
		if (result.affected !== 1)
			throw DBUpdateFailureException('delete channel failed');
	}
}
