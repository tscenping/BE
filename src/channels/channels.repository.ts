import { InjectRepository } from '@nestjs/typeorm';
import { Channel } from './entities/channel.entity';
import { DataSource, Repository } from 'typeorm';
import { ChannelUser } from './entities/channel-user.entity';
import { DBUpdateFailureException } from '../common/exception/custom-exception';
import { DEFAULT_PAGE_SIZE } from 'src/common/constants';

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

	async softDeleteChannel(channelId: number) {
		const result = await this.softDelete(channelId);
		if (result.affected !== 1)
			throw DBUpdateFailureException('delete channel failed');
	}

	async findAllChannels(
		page: number,
	){
		const channels = await this.dataSource.query(
			`
			SELECT "channelId", "name", "channelType"
			FROM Channel c JOIN channel_user cu
			ON c.id = cu."channelId"
			WHERE c."deletedAt" IS NULL
			LIMIT $1 OFFSET $2;
			`,
			[DEFAULT_PAGE_SIZE, (page - 1) * DEFAULT_PAGE_SIZE],
		);

		return channels;
	}

	async findMyChannels(
		userId: number,
		page: number,
	){
		const channels = await this.dataSource.query(
			`
			SELECT "channelId", "name", "channelType"
			FROM Channel c JOIN channel_user cu
			ON c.id = cu."channelId"
			WHERE cu."userId" = $1
			AND c."deletedAt" IS NULL
			ORDER BY c."channelType" DESC
			LIMIT $2 OFFSET $3;
			`,
			[userId, DEFAULT_PAGE_SIZE, (page - 1) * DEFAULT_PAGE_SIZE],
		);
		
		console.log("channels: ", channels);

		return channels;
	}

	async findDmChannels(
		userId: number,
		page: number,
	){
		const channels = await this.dataSource.query(
			`
			SELECT "channelId", "name", "channelType"
			FROM Channel c JOIN channel_user cu
			ON c.id = cu."channelId"
			WHERE c."channelType" = 'DM'
			AND cu."userId" = $1
			AND c."deletedAt" IS NULL
			LIMIT $2 OFFSET $3;
			`,
			[userId, DEFAULT_PAGE_SIZE, (page - 1) * DEFAULT_PAGE_SIZE],
		);
	
		return channels;
	}
}